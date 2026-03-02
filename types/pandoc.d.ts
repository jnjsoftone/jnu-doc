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
declare const checkPandocInstalled: () => Promise<boolean>;
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
declare const convertWithPandoc: (source: string, from: string, to: string, options?: PandocOptions, isFile?: boolean) => Promise<string>;
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
declare const convertFileWithPandoc: (inputPath: string, outputPath: string, from: string, to: string, options?: PandocOptions) => Promise<void>;
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
declare const markdownToHtml: (markdown: string, options?: PandocOptions) => Promise<string>;
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
declare const htmlToMarkdown: (html: string, options?: PandocOptions) => Promise<string>;
export { checkPandocInstalled, convertWithPandoc, convertFileWithPandoc, markdownToHtml, htmlToMarkdown, PandocOptions };
//# sourceMappingURL=pandoc.d.ts.map