/// <reference types="node" />
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
export declare function convertHwp(inputPath: string, format: HwpConvertibleFormat, options?: HwpConvertOptions): Promise<HwpConvertResult>;
export declare function convertHwpToPdf(inputPath: string, options?: HwpConvertOptions): Promise<HwpConvertResult>;
export declare function convertHwpToDocx(inputPath: string, options?: HwpConvertOptions): Promise<HwpConvertResult>;
export declare function convertHwpToXml(inputPath: string, options?: HwpConvertOptions): Promise<HwpConvertResult>;
export interface HwpReadOptions extends HwpConvertOptions {
    encoding?: BufferEncoding;
}
export declare function readHwpAsHtml(inputPath: string, options?: HwpReadOptions): Promise<string>;
export interface HwpWriteOptions extends HwpConvertOptions {
    workingDir?: string;
}
export declare function writeHwpFromDocx(docxPath: string, options?: HwpWriteOptions): Promise<HwpConvertResult>;
export declare function isHwpSupportedEnvironment(): boolean;
//# sourceMappingURL=hwp.d.ts.map