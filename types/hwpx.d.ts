/// <reference types="node" />
/// <reference types="node" />
export interface HwpxReadOptions {
    preserveParagraphBreaks?: boolean;
    paragraphSeparator?: string;
}
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
declare const readHwpx: (source: Buffer | string, output?: 'plain' | 'html' | 'markdown', options?: HwpxReadOptions) => Promise<string>;
export { readHwpx, };
//# sourceMappingURL=hwpx.d.ts.map