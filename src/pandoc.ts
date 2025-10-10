/**
 * A library for Pandoc Utility Functions
 *
 * Pandoc wrapper using Node.js child_process for secure document conversion.
 * Supports conversion between various formats like markdown, html, docx, pdf, etc.
 *
 * @references
 *  - [Pandoc User's Guide](https://pandoc.org/MANUAL.html)
 *  - [Node.js child_process](https://nodejs.org/api/child_process.html)
 *
 * @requires pandoc must be installed on the system
 */

// & IMPORT AREA
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execFileAsync = promisify(execFile);

// & TYPES AREA
/**
 * Pandoc 변환 옵션
 */
interface PandocOptions {
  /** 추가 Pandoc 명령줄 옵션 */
  args?: string[];
  /** 최대 실행 시간 (밀리초, 기본값: 30000) */
  timeout?: number;
  /** 최대 버퍼 크기 (바이트, 기본값: 10MB) */
  maxBuffer?: number;
  /** sandbox 모드 비활성화 (보안상 권장하지 않음) */
  noSandbox?: boolean;
}

// & FUNCTIONS AREA
/**
 * Pandoc이 시스템에 설치되어 있는지 확인
 *
 * @returns Pandoc 설치 여부
 *
 * @example
 * const installed = await checkPandocInstalled();
 * if (!installed) {
 *   console.log('Please install pandoc first');
 * }
 */
const checkPandocInstalled = async (): Promise<boolean> => {
  try {
    await execFileAsync('pandoc', ['--version'], { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 포맷이 유효한지 검증
 *
 * @param format - 검증할 포맷
 * @returns 유효 여부
 */
const isValidFormat = (format: string): boolean => {
  const validFormats = [
    // Text formats
    'markdown', 'markdown_strict', 'markdown_phpextra', 'markdown_mmd',
    'gfm', 'commonmark', 'commonmark_x',
    'rst', 'textile', 'html', 'html5', 'latex', 'plain', 'org', 'mediawiki',
    'dokuwiki', 'haddock', 'asciidoc', 'asciidoctor', 'tikiwiki', 'twiki',
    'vimwiki', 'creole', 'txt2tags', 'jats', 'jira', 'man', 'ms',
    // Binary formats
    'docx', 'odt', 'epub', 'epub2', 'epub3', 'fb2', 'ipynb',
    // Other formats
    'json', 'native', 'rtf', 'pdf', 'beamer', 'pptx', 'revealjs', 's5',
    'slideous', 'slidy', 'dzslides', 'tei', 'opml', 'biblatex', 'bibtex',
    'csljson', 'context', 'texinfo', 'icml', 'chunkedhtml'
  ];

  return validFormats.includes(format.toLowerCase());
};

/**
 * Pandoc으로 문자열 또는 파일을 다른 포맷으로 변환
 *
 * @param source - 변환할 소스 (문자열 또는 파일 경로)
 * @param from - 소스 포맷 (markdown, html, docx, etc.)
 * @param to - 출력 포맷 (html, markdown, pdf, etc.)
 * @param options - Pandoc 옵션
 * @param isFile - source가 파일 경로인지 여부 (기본값: false)
 * @returns 변환된 문자열
 *
 * @throws {Error} Pandoc이 설치되지 않은 경우
 * @throws {Error} 유효하지 않은 포맷인 경우
 * @throws {Error} 변환 중 오류가 발생한 경우
 *
 * @example
 * // 문자열 변환
 * const html = await convertWithPandoc(
 *   '# Hello World\n\nThis is **bold**.',
 *   'markdown',
 *   'html',
 *   { args: ['--standalone'] }
 * );
 *
 * @example
 * // 파일 변환
 * const html = await convertWithPandoc(
 *   './input.md',
 *   'markdown',
 *   'html',
 *   { args: ['--toc', '--css=style.css'] },
 *   true
 * );
 */
const convertWithPandoc = async (
  source: string,
  from: string,
  to: string,
  options: PandocOptions = {},
  isFile: boolean = false
): Promise<string> => {
  // Pandoc 설치 확인
  const installed = await checkPandocInstalled();
  if (!installed) {
    throw new Error('Pandoc is not installed. Please install pandoc first.');
  }

  // 포맷 검증
  if (!isValidFormat(from)) {
    throw new Error(`Invalid source format: ${from}`);
  }
  if (!isValidFormat(to)) {
    throw new Error(`Invalid target format: ${to}`);
  }

  const {
    args = [],
    timeout = 30000,
    maxBuffer = 10 * 1024 * 1024, // 10MB
    noSandbox = false
  } = options;

  let inputFile = source;
  let tempFile: string | null = null;

  try {
    // 문자열 입력이면 임시 파일 생성
    if (!isFile) {
      tempFile = join(tmpdir(), `pandoc-input-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
      await writeFile(tempFile, source, 'utf-8');
      inputFile = tempFile;
    }

    // Pandoc 명령줄 인수 구성
    const pandocArgs = [
      '-f', from,
      '-t', to,
      ...(noSandbox ? [] : ['--sandbox']), // 보안: 파일 시스템 접근 제한
      ...args,
      inputFile
    ];

    // execFile 사용 (shell injection 방지)
    const { stdout, stderr } = await execFileAsync('pandoc', pandocArgs, {
      maxBuffer,
      timeout,
      encoding: 'utf-8'
    });

    // stderr가 있으면 경고 출력 (pandoc은 경고를 stderr로 출력)
    if (stderr && stderr.trim()) {
      console.warn('[Pandoc Warning]:', stderr.trim());
    }

    return stdout;

  } catch (error: any) {
    // 에러 메시지 개선
    if (error.code === 'ETIMEDOUT') {
      throw new Error(`Pandoc conversion timeout (${timeout}ms exceeded)`);
    } else if (error.code === 'ENOENT') {
      throw new Error('Pandoc executable not found. Please ensure pandoc is installed and in PATH.');
    } else if (error.killed) {
      throw new Error('Pandoc process was killed');
    } else {
      throw new Error(`Pandoc conversion failed: ${error.message}`);
    }
  } finally {
    // 임시 파일 정리
    if (tempFile) {
      await unlink(tempFile).catch(() => {
        // 삭제 실패 시 무시 (이미 삭제되었거나 권한 문제)
      });
    }
  }
};

/**
 * Pandoc으로 파일을 다른 포맷의 파일로 변환
 *
 * @param inputPath - 입력 파일 경로
 * @param outputPath - 출력 파일 경로
 * @param from - 소스 포맷 (markdown, html, docx, etc.)
 * @param to - 출력 포맷 (html, markdown, pdf, etc.)
 * @param options - Pandoc 옵션
 * @returns Promise<void>
 *
 * @throws {Error} Pandoc이 설치되지 않은 경우
 * @throws {Error} 유효하지 않은 포맷인 경우
 * @throws {Error} 파일 변환 중 오류가 발생한 경우
 *
 * @example
 * // Markdown을 HTML 파일로 변환
 * await convertFileWithPandoc(
 *   './input.md',
 *   './output.html',
 *   'markdown',
 *   'html',
 *   { args: ['--standalone', '--toc', '--css=style.css'] }
 * );
 *
 * @example
 * // Markdown을 PDF로 변환
 * await convertFileWithPandoc(
 *   './input.md',
 *   './output.pdf',
 *   'markdown',
 *   'pdf',
 *   { args: ['--pdf-engine=xelatex'], timeout: 60000 }
 * );
 */
const convertFileWithPandoc = async (
  inputPath: string,
  outputPath: string,
  from: string,
  to: string,
  options: PandocOptions = {}
): Promise<void> => {
  // Pandoc 설치 확인
  const installed = await checkPandocInstalled();
  if (!installed) {
    throw new Error('Pandoc is not installed. Please install pandoc first.');
  }

  // 포맷 검증
  if (!isValidFormat(from)) {
    throw new Error(`Invalid source format: ${from}`);
  }
  if (!isValidFormat(to)) {
    throw new Error(`Invalid target format: ${to}`);
  }

  const {
    args = [],
    timeout = 60000, // 파일 변환은 더 긴 시간 허용
    noSandbox = false
  } = options;

  try {
    // Pandoc 명령줄 인수 구성
    const pandocArgs = [
      '-f', from,
      '-t', to,
      ...(noSandbox ? [] : ['--sandbox']),
      '-o', outputPath,
      ...args,
      inputPath
    ];

    // execFile 사용 (shell injection 방지)
    const { stderr } = await execFileAsync('pandoc', pandocArgs, {
      timeout,
      encoding: 'utf-8'
    });

    // stderr가 있으면 경고 출력
    if (stderr && stderr.trim()) {
      console.warn('[Pandoc Warning]:', stderr.trim());
    }

  } catch (error: any) {
    // 에러 메시지 개선
    if (error.code === 'ETIMEDOUT') {
      throw new Error(`Pandoc file conversion timeout (${timeout}ms exceeded)`);
    } else if (error.code === 'ENOENT') {
      throw new Error('Pandoc executable not found. Please ensure pandoc is installed and in PATH.');
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied: Cannot read '${inputPath}' or write to '${outputPath}'`);
    } else if (error.killed) {
      throw new Error('Pandoc process was killed');
    } else {
      throw new Error(`Pandoc file conversion failed: ${error.message}`);
    }
  }
};

/**
 * Markdown을 HTML로 변환 (편의 함수)
 *
 * @param markdown - Markdown 문자열
 * @param options - Pandoc 옵션
 * @returns HTML 문자열
 *
 * @example
 * const html = await markdownToHtml('# Hello\n\nWorld', {
 *   args: ['--standalone']
 * });
 */
const markdownToHtml = async (
  markdown: string,
  options: PandocOptions = {}
): Promise<string> => {
  return convertWithPandoc(markdown, 'markdown', 'html', options);
};

/**
 * HTML을 Markdown으로 변환 (편의 함수)
 *
 * @param html - HTML 문자열
 * @param options - Pandoc 옵션
 * @returns Markdown 문자열
 *
 * @example
 * const md = await htmlToMarkdown('<h1>Hello</h1><p>World</p>');
 */
const htmlToMarkdown = async (
  html: string,
  options: PandocOptions = {}
): Promise<string> => {
  return convertWithPandoc(html, 'html', 'markdown', options);
};

// & EXPORT AREA
export {
  checkPandocInstalled,
  convertWithPandoc,
  convertFileWithPandoc,
  markdownToHtml,
  htmlToMarkdown,
  PandocOptions
};

// & TEST AREA (commented out)
// (async () => {
//   // Pandoc 설치 확인
//   const installed = await checkPandocInstalled();
//   console.log('Pandoc installed:', installed);
//
//   if (installed) {
//     // Markdown → HTML 변환
//     const html = await convertWithPandoc(
//       '# Hello World\n\nThis is **bold** text.',
//       'markdown',
//       'html',
//       { args: ['--standalone'] }
//     );
//     console.log('HTML:', html);
//
//     // HTML → Markdown 변환
//     const md = await htmlToMarkdown('<h1>Title</h1><p>Paragraph</p>');
//     console.log('Markdown:', md);
//   }
// })();
