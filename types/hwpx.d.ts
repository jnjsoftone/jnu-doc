/// <reference types="node" />
/// <reference types="node" />
export interface HwpxReadOptions {
    preserveParagraphBreaks?: boolean;
    paragraphSeparator?: string;
}
declare const readHwpxBuffer: (buffer: Buffer, options?: HwpxReadOptions) => Promise<string>;
declare const readHwpxAsPlainText: (filePath: string, options?: HwpxReadOptions) => Promise<string>;
declare const readHwpxAsPlainTextFromUrl: (url: string, options?: HwpxReadOptions) => Promise<string>;
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
declare const readHwpxAsHTML: (filePath: string) => Promise<string>;
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
declare const readHwpxAsHTMLFromUrl: (url: string) => Promise<string>;
/**
 * Convert HWPX buffer to HTML
 *
 * @param buffer - Buffer containing HWPX file data
 * @returns HTML string
 */
declare const readHwpxBufferAsHTML: (buffer: Buffer) => Promise<string>;
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
declare const readHwpxAsMarkdown: (filePath: string) => Promise<string>;
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
declare const readHwpxAsMarkdownFromUrl: (url: string) => Promise<string>;
/**
 * Convert HWPX buffer to Markdown
 */
declare const readHwpxBufferAsMarkdown: (buffer: Buffer) => Promise<string>;
export { readHwpxBuffer, readHwpxAsPlainText, readHwpxAsPlainTextFromUrl, readHwpxAsHTML, readHwpxAsHTMLFromUrl, readHwpxBufferAsHTML, readHwpxAsMarkdown, readHwpxAsMarkdownFromUrl, readHwpxBufferAsMarkdown, };
export default readHwpxAsPlainText;
//# sourceMappingURL=hwpx.d.ts.map