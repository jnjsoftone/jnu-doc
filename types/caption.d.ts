/**
 * Convert SubRipText(`srt`) format string => Tab-Separated Values(`tsv`) format string
 */
declare const tsvFromSrt: (str: string) => string;
/**
 * Convert SubRipText(`srt`) format string => TXT format string
 */
declare const txtFromSrt: (str: string) => string;
/**
 * Convert SubRipText(`srt`) format string => Tab-Separated Values(`tsv`) format string
 */
declare const tsvFromVtt: (str: string) => string;
/**
 * Convert SubRipText(`srt`) format string => Tab-Separated Values(`tsv`) format string
 */
declare const txtFromVtt: (str: string) => string;
/**
 * Convert Tab-Separated Values(`tsv`) => SubRipText(`srt`)
 */
declare const srtFromTsv: (str: string) => string;
declare const srtToVtt: (srtContent: string) => string;
declare const vttToSrt: (vttContent: string) => string;
/**
 * Main Converter
 * @remarks
 * format coverter(string, arrays, dicts)
 */
declare const convertStr: (data: string, srcType: string, dstType: string) => string | undefined;
declare const convertSrtFileToVtt: (srtPath: string, vttPath: string) => void;
declare const convertSrtToVttInFolder: (srtDir: string, vttDir: string) => void;
export { tsvFromSrt, // Convert SubRipText(`srt`) format string => Tab-Separated Values(`tsv`) format string
txtFromSrt, // Convert SubRipText(`srt`) format string => Text(`txt`) format string
srtFromTsv, // Convert Tab-Separated Values(`tsv`) => SubRipText(`srt`)
tsvFromVtt, // Convert WebVTT(`vtt`) format string => Tab-Separated Values(`tsv`) format string
txtFromVtt, // Convert WebVTT(`vtt`) format string => Text(`txt`) format string
convertStr, // convert string format
srtToVtt, vttToSrt, convertSrtFileToVtt, convertSrtToVttInFolder, };
//# sourceMappingURL=caption.d.ts.map