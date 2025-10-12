/**
 * Utilities for reading HWPX documents and extracting plain text.
 */
import { readFile } from 'node:fs/promises';
import { get as httpGet } from 'node:http';
import { get as httpsGet } from 'node:https';
import { URL } from 'node:url';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

const SECTION_PREFIX = 'Contents/section';
const SECTION_SUFFIX = '.xml';
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
const LINE_BREAK_ELEMENTS = new Set(['br', 'linebreak']);
const TAB_ELEMENTS = new Set(['tab']);
const PARAGRAPH_ELEMENTS = new Set(['p']);
const TRAILING_BREAK_ELEMENTS = new Set(['sublist', 'tbl']);

const parser = new DOMParser();

type XmlNode = {
  nodeType: number;
  nodeName: string;
  localName?: string | null;
  nodeValue?: string | null;
  childNodes: {
    length: number;
    item(index: number): XmlNode | null | undefined;
  };
};

const extractTextFromNode = (node: XmlNode): string => {
  if (node.nodeType === TEXT_NODE) {
    return (node.nodeValue ?? '').replace(/\r\n?/g, '\n');
  }

  if (node.nodeType !== ELEMENT_NODE) {
    return '';
  }

  const element = node;
  const name = (element.localName ?? element.nodeName).toLowerCase();

  if (name === 'tr') {
    const cells: string[] = [];
    for (let i = 0; i < element.childNodes.length; i += 1) {
      const child = element.childNodes.item(i) as XmlNode | null | undefined;
      if (!child || child.nodeType !== ELEMENT_NODE) {
        continue;
      }

      const cellName = (child.localName ?? child.nodeName).toLowerCase();
      if (cellName === 'tc') {
        const cellText = extractTextFromNode(child)
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\s+\n/g, '\n')
          .trim();
        cells.push(cellText);
      }
    }

    const row = cells.join('\t');
    return row ? `${row}\n` : '';
  }

  if (name === 'tc') {
    let cellResult = '';
    for (let i = 0; i < element.childNodes.length; i += 1) {
      const child = element.childNodes.item(i) as XmlNode | null | undefined;
      if (child) {
        cellResult += extractTextFromNode(child);
      }
    }

    return cellResult.replace(/\n{3,}/g, '\n\n').trim();
  }

  if (LINE_BREAK_ELEMENTS.has(name)) {
    return '\n';
  }

  if (TAB_ELEMENTS.has(name)) {
    return '\t';
  }

  let result = '';
  for (let i = 0; i < element.childNodes.length; i += 1) {
    const child = element.childNodes.item(i) as XmlNode | null | undefined;
    if (child) {
      result += extractTextFromNode(child);
    }
  }

  if (TRAILING_BREAK_ELEMENTS.has(name) && result.length > 0 && !result.endsWith('\n')) {
    result += '\n';
  }

  return result;
};

const collectParagraphs = (root: XmlNode): string[] => {
  const paragraphs: string[] = [];
  const stack: XmlNode[] = [];

  for (let i = root.childNodes.length - 1; i >= 0; i -= 1) {
    const child = root.childNodes.item(i) as XmlNode | null | undefined;
    if (child) {
      stack.push(child);
    }
  }

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (current.nodeType === ELEMENT_NODE) {
      const element = current;
      const name = (element.localName ?? element.nodeName).toLowerCase();

      if (PARAGRAPH_ELEMENTS.has(name)) {
        paragraphs.push(extractTextFromNode(element));
        continue;
      }

      for (let i = element.childNodes.length - 1; i >= 0; i -= 1) {
        const child = element.childNodes.item(i) as XmlNode | null | undefined;
        if (child) {
          stack.push(child);
        }
      }
    }
  }

  return paragraphs;
};

const normalizeParagraph = (text: string): string => {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
 * Get attribute value from XML element
 */
const getAttr = (element: XmlNode, attrName: string): string | null => {
  if (!element || typeof (element as any).getAttribute !== 'function') {
    return null;
  }
  return (element as any).getAttribute(attrName);
};

/**
 * Extract cell span information
 */
const getCellSpan = (tcElement: XmlNode): { colSpan: number; rowSpan: number } => {
  let colSpan = 1;
  let rowSpan = 1;

  for (let i = 0; i < tcElement.childNodes.length; i += 1) {
    const child = tcElement.childNodes.item(i) as XmlNode | null | undefined;
    if (!child || child.nodeType !== ELEMENT_NODE) {
      continue;
    }

    const childName = (child.localName ?? child.nodeName).toLowerCase();
    if (childName === 'cellspan') {
      const colSpanAttr = getAttr(child, 'colSpan');
      const rowSpanAttr = getAttr(child, 'rowSpan');

      if (colSpanAttr) {
        const parsed = parseInt(colSpanAttr, 10);
        if (!isNaN(parsed) && parsed > 0) {
          colSpan = parsed;
        }
      }

      if (rowSpanAttr) {
        const parsed = parseInt(rowSpanAttr, 10);
        if (!isNaN(parsed) && parsed > 0) {
          rowSpan = parsed;
        }
      }
      break;
    }
  }

  return { colSpan, rowSpan };
};

/**
 * Extract text content from cell (for table extraction)
 */
const extractCellText = (node: XmlNode): string => {
  if (node.nodeType === TEXT_NODE) {
    return (node.nodeValue ?? '').replace(/\r\n?/g, ' ').trim();
  }

  if (node.nodeType !== ELEMENT_NODE) {
    return '';
  }

  const element = node;
  const name = (element.localName ?? element.nodeName).toLowerCase();

  if (LINE_BREAK_ELEMENTS.has(name)) {
    return ' ';
  }

  if (TAB_ELEMENTS.has(name)) {
    return '    ';
  }

  let result = '';
  for (let i = 0; i < element.childNodes.length; i += 1) {
    const child = element.childNodes.item(i) as XmlNode | null | undefined;
    if (child) {
      result += extractCellText(child);
    }
  }

  return result;
};

/**
 * Extract structured content from XML node for HTML conversion
 */
const extractStructuredContent = (node: XmlNode): string => {
  if (node.nodeType === TEXT_NODE) {
    return escapeHtml((node.nodeValue ?? '').replace(/\r\n?/g, '\n'));
  }

  if (node.nodeType !== ELEMENT_NODE) {
    return '';
  }

  const element = node;
  const name = (element.localName ?? element.nodeName).toLowerCase();

  // Handle table rows
  if (name === 'tr') {
    const cells: string[] = [];
    for (let i = 0; i < element.childNodes.length; i += 1) {
      const child = element.childNodes.item(i) as XmlNode | null | undefined;
      if (!child || child.nodeType !== ELEMENT_NODE) {
        continue;
      }

      const cellName = (child.localName ?? child.nodeName).toLowerCase();
      if (cellName === 'tc') {
        const { colSpan, rowSpan } = getCellSpan(child);
        const cellContent = extractStructuredContent(child);

        const attrs: string[] = [];
        if (colSpan > 1) {
          attrs.push(`colspan="${colSpan}"`);
        }
        if (rowSpan > 1) {
          attrs.push(`rowspan="${rowSpan}"`);
        }

        const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
        cells.push(`<td${attrStr}>${cellContent}</td>`);
      }
    }

    return cells.length > 0 ? `<tr>${cells.join('')}</tr>` : '';
  }

  // Handle table cells
  if (name === 'tc') {
    let cellResult = '';
    for (let i = 0; i < element.childNodes.length; i += 1) {
      const child = element.childNodes.item(i) as XmlNode | null | undefined;
      if (child) {
        const childName = (child.localName ?? child.nodeName).toLowerCase();
        // Skip cellspan, celladdr, cellsz, cellmargin elements
        if (!['cellspan', 'celladdr', 'cellsz', 'cellmargin'].includes(childName)) {
          cellResult += extractStructuredContent(child);
        }
      }
    }
    return cellResult;
  }

  // Handle tables
  if (name === 'tbl') {
    let tableResult = '<table>';
    for (let i = 0; i < element.childNodes.length; i += 1) {
      const child = element.childNodes.item(i) as XmlNode | null | undefined;
      if (child) {
        tableResult += extractStructuredContent(child);
      }
    }
    tableResult += '</table>';
    return tableResult;
  }

  // Handle line breaks
  if (LINE_BREAK_ELEMENTS.has(name)) {
    return '<br>';
  }

  // Handle tabs
  if (TAB_ELEMENTS.has(name)) {
    return '&nbsp;&nbsp;&nbsp;&nbsp;';
  }

  // Recursively process child nodes
  let result = '';
  for (let i = 0; i < element.childNodes.length; i += 1) {
    const child = element.childNodes.item(i) as XmlNode | null | undefined;
    if (child) {
      result += extractStructuredContent(child);
    }
  }

  return result;
};

/**
 * Collect paragraphs as HTML
 */
const collectParagraphsAsHtml = (root: XmlNode): string[] => {
  const paragraphs: string[] = [];
  const stack: XmlNode[] = [];

  for (let i = root.childNodes.length - 1; i >= 0; i -= 1) {
    const child = root.childNodes.item(i) as XmlNode | null | undefined;
    if (child) {
      stack.push(child);
    }
  }

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (current.nodeType === ELEMENT_NODE) {
      const element = current;
      const name = (element.localName ?? element.nodeName).toLowerCase();

      if (PARAGRAPH_ELEMENTS.has(name)) {
        const content = extractStructuredContent(element);
        paragraphs.push(`<p>${content}</p>`);
        continue;
      }

      if (name === 'tbl') {
        paragraphs.push(extractStructuredContent(element));
        continue;
      }

      for (let i = element.childNodes.length - 1; i >= 0; i -= 1) {
        const child = element.childNodes.item(i) as XmlNode | null | undefined;
        if (child) {
          stack.push(child);
        }
      }
    }
  }

  return paragraphs;
};

const MAX_REDIRECTS = 5;

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

export interface HwpxReadOptions {
  preserveParagraphBreaks?: boolean;
  paragraphSeparator?: string;
}

const readHwpxBuffer = async (
  buffer: Buffer,
  options: HwpxReadOptions = {}
): Promise<string> => {
  const zip = await JSZip.loadAsync(buffer);

  const sectionEntries = Object.keys(zip.files)
    .filter((name) => name.startsWith(SECTION_PREFIX) && name.endsWith(SECTION_SUFFIX))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const paragraphTexts: string[] = [];

  for (const entryName of sectionEntries) {
    const entry = zip.files[entryName];
    if (!entry) {
      continue;
    }

    const xmlContent = await entry.async('string');
    const document = parser.parseFromString(xmlContent, 'text/xml');
    const sectionParagraphs = collectParagraphs(document.documentElement).map(normalizeParagraph);
    paragraphTexts.push(...sectionParagraphs);
  }

  const filteredParagraphs = paragraphTexts.filter((paragraph) => paragraph.length > 0);

  const separator = options.preserveParagraphBreaks === false
    ? ''
    : options.paragraphSeparator ?? '\n\n';

  return filteredParagraphs.join(separator);
};

const readHwpxAsPlainText = async (
  filePath: string,
  options: HwpxReadOptions = {}
): Promise<string> => {
  const buffer = await readFile(filePath);
  return readHwpxBuffer(buffer, options);
};

const readHwpxAsPlainTextFromUrl = async (
  url: string,
  options: HwpxReadOptions = {}
): Promise<string> => {
  const buffer = await downloadBinary(url.trim());
  return readHwpxBuffer(buffer, options);
};

/**
 * Read HWPX file and convert to HTML
 *
 * @param filePath - Path to the HWPX file
 * @returns HTML string
 *
 * @example
 * ```typescript
 * const html = await readHwpxAsHTML('./document.hwpx');
 * console.log(html);
 * ```
 */
const readHwpxAsHTML = async (filePath: string): Promise<string> => {
  const buffer = await readFile(filePath);
  return readHwpxBufferAsHTML(buffer);
};

/**
 * Read HWPX file from URL and convert to HTML
 *
 * @param url - URL of the HWPX file
 * @returns HTML string
 *
 * @example
 * ```typescript
 * const html = await readHwpxAsHTMLFromUrl('https://example.com/doc.hwpx');
 * console.log(html);
 * ```
 */
const readHwpxAsHTMLFromUrl = async (url: string): Promise<string> => {
  const buffer = await downloadBinary(url.trim());
  return readHwpxBufferAsHTML(buffer);
};

/**
 * Post-process HTML to clean up formatting issues
 *
 * @param html - Raw HTML string
 * @returns Cleaned HTML string
 */
const postProcessHTML = (html: string): string => {
  return html
    // Remove <p> tags wrapping <table>
    .replace(/<p>\s*<table>/g, '<table>')
    .replace(/<\/table>\s*<\/p>/g, '</table>')
    // Remove empty <p> tags
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p>&nbsp;<\/p>/g, '')
    // Clean up multiple consecutive newlines in HTML
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // Remove whitespace-only paragraphs
    .replace(/<p>[\s\u00a0]+<\/p>/g, '');
};

/**
 * Convert HWPX buffer to HTML
 *
 * @param buffer - Buffer containing HWPX file data
 * @returns HTML string
 */
const readHwpxBufferAsHTML = async (buffer: Buffer): Promise<string> => {
  const zip = await JSZip.loadAsync(buffer);

  const sectionEntries = Object.keys(zip.files)
    .filter((name) => name.startsWith(SECTION_PREFIX) && name.endsWith(SECTION_SUFFIX))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const htmlParagraphs: string[] = [];

  for (const entryName of sectionEntries) {
    const entry = zip.files[entryName];
    if (!entry) {
      continue;
    }

    const xmlContent = await entry.async('string');
    const document = parser.parseFromString(xmlContent, 'text/xml');
    const sectionParagraphs = collectParagraphsAsHtml(document.documentElement);
    htmlParagraphs.push(...sectionParagraphs);
  }

  let htmlBody = htmlParagraphs.join('\n');

  // Apply post-processing to clean up HTML
  htmlBody = postProcessHTML(htmlBody);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HWPX Document</title>
  <style>
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    td { border: 1px solid #ddd; padding: 8px; }
    p { margin: 10px 0; }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;
};

/**
 * Configure Turndown service with custom rules for better table handling
 */
const configureTurndownService = (): TurndownService => {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
  });

  // Custom table rule to handle colspan/rowspan properly
  turndownService.addRule('customTable', {
    filter: 'table',
    replacement: (_content: any, node: any) => {
      const nodeElement = node as HTMLElement;
      const dom = new JSDOM(`<table>${nodeElement.innerHTML}</table>`);
      const table = dom.window.document.querySelector('table');

      if (!table) {
        return '';
      }

      const rows: Element[] = Array.from(table.querySelectorAll('tr'));

      if (rows.length === 0) {
        return '';
      }

      // Build grid to handle colspan/rowspan
      const grid: (string | null)[][] = [];
      let maxCols = 0;

      rows.forEach((tr) => {
        const cells: Element[] = Array.from(tr.querySelectorAll('td, th'));
        let colIndex = 0;

        // Initialize current row in grid
        const currentRowIndex = grid.length;
        if (!grid[currentRowIndex]) {
          grid[currentRowIndex] = [];
        }

        cells.forEach((cell) => {
          const cellElement = cell as HTMLElement;
          const colSpan = parseInt(cellElement.getAttribute('colspan') || '1', 10);
          const rowSpan = parseInt(cellElement.getAttribute('rowspan') || '1', 10);
          const text = (cellElement.textContent || '').trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');

          // Find next available column
          while (grid[currentRowIndex][colIndex] !== undefined) {
            colIndex++;
          }

          // Fill the cell and its spans
          for (let r = 0; r < rowSpan; r++) {
            const rowIdx = currentRowIndex + r;
            if (!grid[rowIdx]) {
              grid[rowIdx] = [];
            }
            for (let c = 0; c < colSpan; c++) {
              const targetCol = colIndex + c;
              if (r === 0 && c === 0) {
                grid[rowIdx][targetCol] = text || ' ';
              } else {
                grid[rowIdx][targetCol] = null; // Placeholder for merged cells
              }
              maxCols = Math.max(maxCols, targetCol + 1);
            }
          }

          colIndex += colSpan;
        });

        // Ensure row is complete
        while (grid[currentRowIndex].length < maxCols) {
          if (grid[currentRowIndex][grid[currentRowIndex].length] === undefined) {
            grid[currentRowIndex].push(' ');
          } else {
            grid[currentRowIndex].push(null);
          }
        }
      });

      // Convert grid to markdown table
      const markdownRows: string[] = [];

      grid.forEach((row, rowIndex) => {
        const cells: string[] = [];

        for (let i = 0; i < maxCols; i++) {
          const cellValue = row[i];
          if (cellValue === null) {
            // Merged cell placeholder - repeat previous content or empty
            cells.push('');
          } else if (cellValue !== undefined) {
            cells.push(cellValue);
          } else {
            cells.push(' ');
          }
        }

        markdownRows.push(`| ${cells.join(' | ')} |`);

        // Add header separator after first row
        if (rowIndex === 0) {
          markdownRows.push(`| ${Array(maxCols).fill('---').join(' | ')} |`);
        }
      });

      return '\n\n' + markdownRows.join('\n') + '\n\n';
    },
  });

  return turndownService;
};

/**
 * Read HWPX file and convert to Markdown
 *
 * @param filePath - Path to the HWPX file
 * @returns Markdown string
 *
 * @example
 * ```typescript
 * const markdown = await readHwpxAsMarkdown('./document.hwpx');
 * console.log(markdown);
 * ```
 */
const readHwpxAsMarkdown = async (filePath: string): Promise<string> => {
  const html = await readHwpxAsHTML(filePath);
  return convertHtmlToMarkdown(html);
};

/**
 * Read HWPX file from URL and convert to Markdown
 *
 * @param url - URL of the HWPX file
 * @returns Markdown string
 *
 * @example
 * ```typescript
 * const markdown = await readHwpxAsMarkdownFromUrl('https://example.com/doc.hwpx');
 * console.log(markdown);
 * ```
 */
const readHwpxAsMarkdownFromUrl = async (url: string): Promise<string> => {
  const html = await readHwpxAsHTMLFromUrl(url);
  return convertHtmlToMarkdown(html);
};

/**
 * Convert HWPX buffer to Markdown
 */
const readHwpxBufferAsMarkdown = async (buffer: Buffer): Promise<string> => {
  const html = await readHwpxBufferAsHTML(buffer);
  return convertHtmlToMarkdown(html);
};

/**
 * Convert HTML to Markdown with proper table handling
 *
 * @param html - HTML string
 * @returns Markdown string
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
    // Clean up table formatting
    .replace(/\|\s+\|/g, '| |')
    // Trim
    .trim();

  return markdown;
};

/**
 * Unified function to read HWPX files from various sources and convert to different formats
 *
 * @param source - Can be a Buffer, local file path (string), or remote URL (string starting with http/https)
 * @param output - Output format: 'plain' (default), 'html', or 'markdown'
 * @param options - Optional reading options
 * @returns Converted content as string
 *
 * @example
 * ```typescript
 * // From local file to plain text
 * const text = await readHwpx('./document.hwpx');
 * const text = await readHwpx('./document.hwpx', 'plain');
 *
 * // From URL to HTML
 * const html = await readHwpx('https://example.com/doc.hwpx', 'html');
 *
 * // From buffer to Markdown
 * const buffer = fs.readFileSync('./document.hwpx');
 * const markdown = await readHwpx(buffer, 'markdown');
 * ```
 */
const readHwpx = async (
  source: Buffer | string,
  output: 'plain' | 'html' | 'markdown' = 'plain',
  options: HwpxReadOptions = {}
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
      return readHwpxBufferAsHTML(buffer);
    case 'markdown':
      return readHwpxBufferAsMarkdown(buffer);
    case 'plain':
    default:
      return readHwpxBuffer(buffer, options);
  }
};

export {
  readHwpx,
};
