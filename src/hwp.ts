import { execFile } from 'node:child_process';
import { access, constants, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type HwpConvertibleFormat = 'pdf' | 'doc' | 'docx' | 'xml' | 'html';

export interface HwpConvertOptions {
  outputDir?: string;
  converterBinary?: string;
  filter?: string;
}

export interface HwpConvertResult {
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

export async function convertHwp(
  inputPath: string,
  format: HwpConvertibleFormat,
  options: HwpConvertOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(inputPath, { format, filter: options.filter }, options);
}

export async function convertHwpToPdf(
  inputPath: string,
  options: HwpConvertOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(inputPath, { format: 'pdf', filter: options.filter }, options);
}

export async function convertHwpToDocx(
  inputPath: string,
  options: HwpConvertOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(inputPath, { format: 'docx', filter: options.filter }, options);
}

export async function convertHwpToXml(
  inputPath: string,
  options: HwpConvertOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(inputPath, { format: 'xml', filter: options.filter }, options);
}

export interface HwpReadOptions extends HwpConvertOptions {
  encoding?: BufferEncoding;
}

export async function readHwpAsHtml(
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

export interface HwpWriteOptions extends HwpConvertOptions {
  workingDir?: string;
}

export async function writeHwpFromDocx(
  docxPath: string,
  options: HwpWriteOptions = {}
): Promise<HwpConvertResult> {
  return convertWithLibreOffice(docxPath, { format: 'doc', filter: options.filter }, options);
}

export function isHwpSupportedEnvironment() {
  return process.platform === 'linux';
}

