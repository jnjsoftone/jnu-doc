/**
 * Utilities for reading HWP (Hangul Word Processor) documents and extracting content.
 * Powered by hwp.js for in-process text extraction.
 */
import { readFile } from 'node:fs/promises';
import { get as httpGet } from 'node:http';
import { get as httpsGet } from 'node:https';
import { URL } from 'node:url';
import type { CFB$ParsingOptions } from 'cfb';
import { parse } from 'hwp.js';
import type HWPDocument from 'hwp.js/build/models/document';
import type Paragraph from 'hwp.js/build/models/paragraph';
import type HWPChar from 'hwp.js/build/models/char';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

const HWP_CHAR_TYPE = {
  char: 0,
  inline: 1,
  extended: 2,
} as const;

const CONTROL_CHAR_MAP: Record<number, string> = {
  0: '',
  10: '\n',
  13: '\n',
};

const MAX_REDIRECTS = 5;

/**
 * Convert HWP character to text fragment
 */
const toTextFragment = (char: HWPChar): string => {
  if (typeof char.value === 'string') {
    return char.value;
  }

  if (typeof char.value === 'number') {
    const mapped = CONTROL_CHAR_MAP[char.value];
    if (typeof mapped === 'string') {
      return mapped;
    }
  }

  if (char.type === HWP_CHAR_TYPE.char && typeof char.value === 'number') {
    return String.fromCharCode(char.value);
  }

  return '';
};

/**
 * Convert paragraph to plain text
 */
const paragraphToText = (paragraph: Paragraph): string => {
  return paragraph.content.map(toTextFragment).join('');
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Convert paragraph to HTML
 */
const paragraphToHtml = (paragraph: Paragraph): string => {
  const text = paragraphToText(paragraph);
  return `<p>${escapeHtml(text)}</p>`;
};

/**
 * Download binary data from URL with redirect support
 */
const downloadBinary = (target: string, redirects = 0): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const url = new URL(target);
    const getter = url.protocol === 'https:' ? httpsGet : httpGet;

    const request = getter(url, (response) => {
      const { statusCode = 0, headers } = response;

      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        if (redirects >= MAX_REDIRECTS) {
          response.resume();
          reject(new Error(`Too many redirects while fetching ${target}`));
          return;
        }

        const redirectUrl = new URL(headers.location, url).toString();
        response.destroy();
        downloadBinary(redirectUrl, redirects + 1).then(resolve).catch(reject);
        return;
      }

      if (statusCode >= 400) {
        response.resume();
        reject(new Error(`Request to ${target} failed with status code ${statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      });
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });

    request.on('error', reject);
  });
};

export interface HwpReadOptions {
  /**
   * Options forwarded to the underlying CFB parser.
   */
  parseOptions?: CFB$ParsingOptions;
  /**
   * Controls how paragraphs are joined. When false, all paragraphs are concatenated without extra line breaks.
   */
  preserveParagraphBreaks?: boolean;
}

/**
 * Convert HWP buffer to plain text
 */
const readHwpBufferAsPlainText = (buffer: Buffer, options: HwpReadOptions = {}): string => {
  const parseOptions: CFB$ParsingOptions = {
    ...(options.parseOptions ?? {}),
    type: 'buffer',
  };
  const document = parse(buffer, parseOptions) as HWPDocument;

  const paragraphs = document.sections.flatMap((section) => section.content);
  const paragraphTexts = paragraphs
    .map(paragraphToText)
    .map((text) => text.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));

  if (options.preserveParagraphBreaks === false) {
    return paragraphTexts.join('');
  }

  return paragraphTexts.join('\n');
};

/**
 * Post-process HTML to clean up formatting issues
 */
const postProcessHTML = (html: string): string => {
  return html
    // Remove empty <p> tags
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p>&nbsp;<\/p>/g, '')
    // Clean up multiple consecutive newlines
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // Remove whitespace-only paragraphs
    .replace(/<p>[\s\u00a0]+<\/p>/g, '');
};

/**
 * Convert HWP buffer to HTML
 */
const readHwpBufferAsHTML = (buffer: Buffer, options: HwpReadOptions = {}): string => {
  const parseOptions: CFB$ParsingOptions = {
    ...(options.parseOptions ?? {}),
    type: 'buffer',
  };
  const document = parse(buffer, parseOptions) as HWPDocument;

  const paragraphs = document.sections.flatMap((section) => section.content);
  const htmlParagraphs = paragraphs.map(paragraphToHtml);

  let htmlBody = htmlParagraphs.join('\n');
  htmlBody = postProcessHTML(htmlBody);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HWP Document</title>
  <style>
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    p { margin: 10px 0; }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;
};

/**
 * Configure Turndown service for HTML to Markdown conversion
 */
const configureTurndownService = (): TurndownService => {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
  });

  return turndownService;
};

/**
 * Convert HTML to Markdown
 */
const convertHtmlToMarkdown = (html: string): string => {
  const turndownService = configureTurndownService();

  // Extract body content only
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  let markdown = turndownService.turndown(bodyContent);

  // Clean up markdown
  markdown = markdown
    // Remove excessive blank lines
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // Trim
    .trim();

  return markdown;
};

/**
 * Convert HWP buffer to Markdown
 */
const readHwpBufferAsMarkdown = (buffer: Buffer, options: HwpReadOptions = {}): string => {
  const html = readHwpBufferAsHTML(buffer, options);
  return convertHtmlToMarkdown(html);
};

/**
 * Unified function to read HWP files from various sources and convert to different formats
 *
 * @param source - Can be a Buffer, local file path (string), or remote URL (string starting with http/https)
 * @param output - Output format: 'plain' (default), 'html', or 'markdown'
 * @param options - Optional reading options
 * @returns Converted content as string
 *
 * @example
 * ```typescript
 * // From local file to plain text
 * const text = await readHwp('./document.hwp');
 * const text = await readHwp('./document.hwp', 'plain');
 *
 * // From URL to HTML
 * const html = await readHwp('https://example.com/doc.hwp', 'html');
 *
 * // From buffer to Markdown
 * const buffer = fs.readFileSync('./document.hwp');
 * const markdown = await readHwp(buffer, 'markdown');
 * ```
 */
const readHwp = async (
  source: Buffer | string,
  output: 'plain' | 'html' | 'markdown' = 'plain',
  options: HwpReadOptions = {}
): Promise<string> => {
  let buffer: Buffer;

  // Determine source type and get buffer
  if (Buffer.isBuffer(source)) {
    // Source is already a buffer
    buffer = source;
  } else if (typeof source === 'string') {
    // Check if it's a URL
    if (source.trim().startsWith('http://') || source.trim().startsWith('https://')) {
      // Remote URL
      buffer = await downloadBinary(source.trim());
    } else {
      // Local file path
      buffer = await readFile(source);
    }
  } else {
    throw new Error('Invalid source type. Must be a Buffer, file path string, or URL string.');
  }

  // Convert based on output format
  switch (output) {
    case 'html':
      return readHwpBufferAsHTML(buffer, options);
    case 'markdown':
      return readHwpBufferAsMarkdown(buffer, options);
    case 'plain':
    default:
      return readHwpBufferAsPlainText(buffer, options);
  }
};

export { readHwp };

export default readHwp;
