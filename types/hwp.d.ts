/// <reference types="node" />
/// <reference types="node" />
import type { CFB$ParsingOptions } from 'cfb';
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
declare function convertHwp(inputPath: string, format: HwpConvertibleFormat, options?: HwpConvertOptions): Promise<HwpConvertResult>;
declare function convertHwpToPdf(inputPath: string, options?: HwpConvertOptions): Promise<HwpConvertResult>;
declare function convertHwpToDocx(inputPath: string, options?: HwpConvertOptions): Promise<HwpConvertResult>;
declare function convertHwpToXml(inputPath: string, options?: HwpConvertOptions): Promise<HwpConvertResult>;
interface HwpReadOptions extends HwpConvertOptions {
    encoding?: BufferEncoding;
}
declare function readHwpAsHtml(inputPath: string, options?: HwpReadOptions): Promise<string>;
interface HwpWriteOptions extends HwpConvertOptions {
    workingDir?: string;
}
declare function writeHwpFromDocx(docxPath: string, options?: HwpWriteOptions): Promise<HwpConvertResult>;
declare function isHwpSupportedEnvironment(): boolean;
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
declare const bufferToPlainText: (buffer: Buffer, options?: HwpPlainTextOptions) => string;
declare const readHwpAsPlainText: (filePath: string, options?: HwpPlainTextOptions) => Promise<string>;
declare const readHwpAsPlainTextFromUrl: (url: string, options?: HwpPlainTextOptions) => Promise<string>;
export { bufferToPlainText, convertHwp, convertHwpToPdf, convertHwpToDocx, convertHwpToXml, readHwpAsHtml, writeHwpFromDocx, isHwpSupportedEnvironment, readHwpAsPlainText, readHwpAsPlainTextFromUrl, };
export type { HwpConvertibleFormat, HwpConvertOptions, HwpConvertResult, HwpReadOptions, HwpWriteOptions, HwpPlainTextOptions, };
export default readHwpAsPlainText;
//# sourceMappingURL=hwp.d.ts.map