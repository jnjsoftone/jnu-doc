/// <reference types="node" />
/// <reference types="node" />
import type { CFB$ParsingOptions } from 'cfb';
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
declare const readHwp: (source: Buffer | string, output?: 'plain' | 'html' | 'markdown', options?: HwpReadOptions) => Promise<string>;
export { readHwp };
export default readHwp;
//# sourceMappingURL=hwp.d.ts.map