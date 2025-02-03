// // https://github.com/9beach/hanspell
// import hanspell from 'hanspell';

// interface SpellCheckResult {
//   token: string;       // 검사 대상 어절
//   suggestions: string[]; // 제안 단어들
//   info: string;        // 규칙에 대한 설명
// }

// const hanspellCheck = async (sentence: string): Promise<SpellCheckResult[]> => {
//   return new Promise((resolve, reject) => {
//     const results: SpellCheckResult[] = [];

//     const callback = (data: SpellCheckResult) => {
//       results.push(data);
//     };

//     const end = () => {
//       resolve(results);
//     };

//     const error = (err: any) => {
//       reject(err);
//     };

//     try {
//       // DAUM 맞춤법 검사기 사용
//       hanspell.spellCheckByDAUM(sentence, 6000, callback, end, error);
//     } catch (err) {
//       reject(err);
//     }
//   });
// };

// export { hanspellCheck };

// 사용 예시:
// const test = async () => {
//   try {
//     const results = await hanspellCheck('리랜드는 얼굴 골격이 굵은게,');
//     console.log(results);
//   } catch (error) {
//     console.error('맞춤법 검사 실패:', error);
//   }
// };
