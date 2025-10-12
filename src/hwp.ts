/**
 * Utilities for working with Hangul Word Processor (HWP) documents.
 * Includes conversion helpers based on LibreOffice as well as in-process
 * text extraction powered by hwp.js.
 */
import { execFile } from 'node:child_process';
import { access, constants, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { get as httpGet } from 'node:http';
import { get as httpsGet } from 'node:https';
import { URL } from 'node:url';
import type { CFB$ParsingOptions } from 'cfb';
import { parse } from 'hwp.js';
import type HWPDocument from 'hwp.js/build/models/document';
import type Paragraph from 'hwp.js/build/models/paragraph';
import type HWPChar from 'hwp.js/build/models/char';

const execFileAsync = promisify(execFile);

type HwpConvertibleFormat = 'pdf' | 'doc' | 'docx' | 'xml' | 'html';

interface HwpConvertOptions {
  outputDir?: string;
  converterBinary?: string;
  filter?: string;
}

interface HwpConvertResult {
  outputPath: string;
  stdout: string;
  stderr: string;
}

const DEFAULT_BINARY = 'libreoffice';

const formatExtensions: Record<HwpConvertibleFormat, string> = {
  pdf: 'pdf',
  doc: 'doc',
  docx: 'docx',
  xml: 'xml',
  html: 'html',
};

type LibreOfficeArgs = {
  format: HwpConvertibleFormat;
  filter?: string;
};

function ensureLinux() {
  if (process.platform !== 'linux') {
    throw new Error('src/hwp.ts는 Linux 환경에서만 동작하도록 설계되었습니다.');
  }
}

async function ensureBinaryExists(binary: string) {
  try {
    await execFileAsync('which', [binary]);
  } catch (error) {
    throw new Error(`필수 변환기(${binary})가 PATH에 없습니다. LibreOffice 또는 호환 도구를 설치하세요.`);
  }
}

async function ensureFileExists(path: string) {
  try {
    await access(path, constants.F_OK);
  } catch (error) {
    throw new Error(`입력 파일을 찾을 수 없습니다: ${path}`);
  }
}

async function resolveOutputDir(provided?: string) {
  if (provided) {
    return resolve(provided);
  }

  return await mkdtemp(join(tmpdir(), 'hwp-convert-'));
}

async function convertWithLibreOffice(
  inputPath: string,
  args: LibreOfficeArgs,
  options: HwpConvertOptions = {}
): Promise<HwpConvertResult> {
  ensureLinux();

  const binary = options.converterBinary ?? DEFAULT_BINARY;
  await ensureBinaryExists(binary);

  const resolvedInput = resolve(inputPath);
  await ensureFileExists(resolvedInput);

  const outputDir = await resolveOutputDir(options.outputDir);
  const convertTo = args.filter ? `${args.format}:${args.filter}` : args.format;
  const cmdArgs = [
    '--headless',
    '--nologo',
    '--nolockcheck',
    '--convert-to',
    convertTo,
    '--outdir',
    outputDir,
    resolvedInput,
  ];

  const { stdout, stderr } = await execFileAsync(binary, cmdArgs);
  const extension = formatExtensions[args.format];
  const outputPath = join(outputDir, `${basename(resolvedInput, extname(resolvedInput))}.${extension}`);

  try {
    await access(outputPath, constants.F_OK);
  } catch (error) {
    throw new Error(`LibreOffice 변환 출력 파일을 찾을 수 없습니다: ${outputPath}`);
  }

  return { outputPath, stdout, stderr };
}

async function convertHwp(
  inputPath: string,
  format: HwpConvertibleFormat,
  options: HwpConvertOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(inputPath, { format, filter: options.filter }, options);
}

async function convertHwpToPdf(
  inputPath: string,
  options: HwpConvertOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(inputPath, { format: 'pdf', filter: options.filter }, options);
}

async function convertHwpToDocx(
  inputPath: string,
  options: HwpConvertOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(inputPath, { format: 'docx', filter: options.filter }, options);
}

async function convertHwpToXml(
  inputPath: string,
  options: HwpConvertOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(inputPath, { format: 'xml', filter: options.filter }, options);
}

interface HwpReadOptions extends HwpConvertOptions {
  encoding?: BufferEncoding;
}

async function readHwpAsHtml(
  inputPath: string,
  options: HwpReadOptions = {}
): Promise<string> {
  const { outputPath } = await convertWithLibreOffice(
    inputPath,
    { format: 'html', filter: options.filter },
    options
  );

  return readFile(outputPath, { encoding: options.encoding ?? 'utf8' });
}

interface HwpWriteOptions extends HwpConvertOptions {
  workingDir?: string;
}

async function writeHwpFromDocx(
  docxPath: string,
  options: HwpWriteOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(docxPath, { format: 'doc', filter: options.filter }, options);
}

function isHwpSupportedEnvironment() {
  return process.platform === 'linux';
}

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

const paragraphToText = (paragraph: Paragraph): string => {
  return paragraph.content.map(toTextFragment).join('');
};

interface HwpPlainTextOptions {
  /**
   * Options forwarded to the underlying CFB parser.
   */
  parseOptions?: CFB$ParsingOptions;
  /**
   * Controls how paragraphs are joined. When false, all paragraphs are concatenated without extra line breaks.
   */
  preserveParagraphBreaks?: boolean;
}

const bufferToPlainText = (buffer: Buffer, options: HwpPlainTextOptions = {}): string => {
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

const readHwpAsPlainText = async (
  filePath: string,
  options: HwpPlainTextOptions = {}
): Promise<string> => {
  const buffer = await readFile(filePath);
  return bufferToPlainText(buffer, options);
};

const readHwpAsPlainTextFromUrl = async (
  url: string,
  options: HwpPlainTextOptions = {}
): Promise<string> => {
  const buffer = await downloadBinary(url.trim());
  return bufferToPlainText(buffer, options);
};

export {
  bufferToPlainText,
  convertHwp,
  convertHwpToPdf,
  convertHwpToDocx,
  convertHwpToXml,
  readHwpAsHtml,
  writeHwpFromDocx,
  isHwpSupportedEnvironment,
  readHwpAsPlainText,
  readHwpAsPlainTextFromUrl,
};

export type {
  HwpConvertibleFormat,
  HwpConvertOptions,
  HwpConvertResult,
  HwpReadOptions,
  HwpWriteOptions,
  HwpPlainTextOptions,
};

export default readHwpAsPlainText;
