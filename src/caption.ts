import fs from 'fs';
import path from 'path';

/**
 * Convert SubRipText(`srt`) format string => Tab-Separated Values(`tsv`) format string
 */
const tsvFromSrt = (str: string) => {
  return `\n${str}`
    .replace(/\r\n/g, '\n')
    .replace(/\n(\d+)\n+/g, '$1\t')
    .replace(/\n([^\d])/g, '\t$1');
};

/**
 * Convert SubRipText(`srt`) format string => TXT format string
 */
const txtFromSrt = (str: string) => {
  return (
    `\n${str}`
      .replace(/\r\n/g, '\n') // CRLF -> LF 변환
      .replace(/^\s*\d+\s*$/gm, '') // 자막 번호 제거
      // .replace(/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/g, '')  // 타임스탬프 제거
      .replace(/\d.+\-\->\s*\d.+/g, '') // 타임스탬프 제거
      .replace(/^\s*$/gm, '') // 빈 줄 제거
      .replace(/\n{2,}/g, '\n') // 연속된 줄바꿈을 하나로
      .trim()
  ); // 앞뒤 공백 제거
};

/**
 * Convert SubRipText(`srt`) format string => Tab-Separated Values(`tsv`) format string
 */
const tsvFromVtt = (str: string) => {
  return `\n${str}`
    .replace(/\r\n/g, '\n')
    .replace(/WEBVTT\n/g, '')
    .replace(/\n(\d+)\n+/g, '$1\t')
    .replace(/\n([^\d])/g, '\t$1');
};

/**
 * Convert SubRipText(`srt`) format string => Tab-Separated Values(`tsv`) format string
 */
const txtFromVtt = (str: string) => {
  return `\n${str}`
    .replace(/\r\n/g, '\n') // CRLF -> LF 변환
    .replace(/WEBVTT\n/g, '')
    .replace(/\d.+\-\->\s*\d.+/g, '') // 타임스탬프 제거
    .replace(/^\s*$/gm, '') // 빈 줄 제거
    .replace(/\n{2,}/g, '\n') // 연속된 줄바꿈을 하나로
    .trim(); // 앞뒤 공백 제거
};

/**
 * Convert Tab-Separated Values(`tsv`) => SubRipText(`srt`)
 */
const srtFromTsv = (str: string) => {
  return str.replace(/\r\n/g, '\n').replace(/\n/g, '\n\n').replace(/\t/g, '\n');
};

// * 자막 변환
const srtToVtt = (srtContent: string) => {
  // 줄 단위로 분리
  const lines = srtContent.split('\n');

  // 숫자만 있는 줄 제거
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();
    return !(trimmed !== '' && !isNaN(Number(trimmed)));
  });

  // 콤마를 점으로 변경
  const content = filteredLines.join('\n').replace(/,/g, '.');

  // WEBVTT 헤더 추가
  return `WEBVTT\n\n${content}`;
};

// * vtt to srt
const vttToSrt = (vttContent: string) => {
  // WEBVTT 헤더 제거 및 줄 단위로 분리
  const lines = vttContent.replace('WEBVTT\n', '').split('\n');

  // 빈 줄 제거
  const filteredLines = lines.filter((line) => line.trim() !== '');

  // 자막 블록 분리 및 번호 추가
  let subtitleNumber: number = 1;
  const srtLines: string[] = [];

  for (let i = 0; i < filteredLines.length; i++) {
    // 자막 번호 추가
    srtLines.push(subtitleNumber.toString());

    // 시간 정보와 자막 텍스트 추가
    srtLines.push(filteredLines[i].replace(/\./g, ','));
    if (i < filteredLines.length - 1) {
      srtLines.push(''); // 자막 블록 사이 빈 줄 추가
    }

    subtitleNumber++;
  }

  return srtLines.join('\n');
};

/**
 * Main Converter
 * @remarks
 * format coverter(string, arrays, dicts)
 */
const convertStr = (data: string, srcType: string, dstType: string) => {
  // return tsvFromSrt(data);
  if (srcType == 'srt' && dstType == 'tsv') {
    return tsvFromSrt(data);
  } else if (srcType == 'tsv' && dstType == 'srt') {
    return srtFromTsv(data);
  }
};

// # file / folder

// 파일 시스템 작업을 위한 함수 (Node.js 환경에서 사용)
const convertSrtFileToVtt = (srtPath: string, vttPath: string) => {
  try {
    // SRT 파일 읽기
    const srtContent = fs.readFileSync(srtPath, 'utf-8');

    // VTT로 변환
    const vttContent = srtToVtt(srtContent);

    // VTT 파일 저장
    fs.writeFileSync(vttPath, vttContent, 'utf-8');

    console.log('변환이 완료되었습니다.');
  } catch (error) {
    console.error('변환 중 오류가 발생했습니다:', error);
    throw error;
  }
};

// 폴더 내의 모든 자막 변환(하위 폴더 포함 recursive)
const convertSrtToVttInFolder = (srtDir: string, vttDir: string) => {
  const files = fs.readdirSync(srtDir);

  for (const file of files) {
    const srtPath = path.join(srtDir, file);
    const vttPath = path.join(vttDir, file.replace('.srt', '.vtt'));

    // 디렉토리인 경우 재귀적으로 처리
    if (fs.statSync(srtPath).isDirectory()) {
      // vtt 디렉토리가 없으면 생성
      if (!fs.existsSync(vttPath)) {
        fs.mkdirSync(vttPath, { recursive: true });
      }
      convertSrtToVttInFolder(srtPath, vttPath);
    }
    // srt 파일인 경우에만 변환
    else if (file.endsWith('.srt')) {
      convertSrtFileToVtt(srtPath, vttPath);
    }
  }
};

export {
  tsvFromSrt, // Convert SubRipText(`srt`) format string => Tab-Separated Values(`tsv`) format string
  txtFromSrt, // Convert SubRipText(`srt`) format string => Text(`txt`) format string
  srtFromTsv, // Convert Tab-Separated Values(`tsv`) => SubRipText(`srt`)
  tsvFromVtt, // Convert WebVTT(`vtt`) format string => Tab-Separated Values(`tsv`) format string
  txtFromVtt, // Convert WebVTT(`vtt`) format string => Text(`txt`) format string
  convertStr, // convert string format
  srtToVtt,
  vttToSrt,
  convertSrtFileToVtt,
  convertSrtToVttInFolder,
};
