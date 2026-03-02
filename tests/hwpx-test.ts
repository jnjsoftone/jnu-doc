// cd /var/services/homes/jungsam/apps/npmjs/jnu-doc && node --loader ts-node/esm tests/hwpx-test.ts
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readHwpx } from '../src/hwpx.js';



const SAMPLE_PATH = resolve('./tests/samples/001.hwpx');
const SAMPLE_URL = 'https://blog.kakaocdn.net/dna/ppwK5/btq7lP41aBY/AAAAAAAAAAAAAAAAAAAAAN6_SNvFnaRk5ARLUpua0oYCU8uHkDIsvLcO4d_amNix/%EC%9E%85%EB%B2%95%EC%98%88%EA%B3%A0(%EC%9A%B8%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C+%EB%82%A8%EA%B5%AC+%EA%B5%AC%EC%84%B8+%EC%A1%B0%EB%A1%80+%EC%9D%BC%EB%B6%80%EA%B0%9C%EC%A0%95%EC%A1%B0%EB%A1%80%EC%95%88).hwpx?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=%2BKBTtq%2BdnUIQUEmcokTv%2BMn6i4c%3D&attach=1&knm=tfile.hwpx';

const main = async () => {
  try {
    // Local
    const localHTML = await readHwpx(SAMPLE_PATH, 'html');
    const localMarkdown = await readHwpx(SAMPLE_PATH, 'markdown');
    console.log('=== Local HTML HWPX Output ===')
    console.log(localHTML);

    console.log('\n=== Local MarkdownHWPX Output ===')
    console.log(localMarkdown);

    // Remote
    const remoteHTML = await readHwpx(SAMPLE_URL, 'html');
    const remoteMarkdown = await readHwpx(SAMPLE_URL, 'markdown');
    console.log('=== Remote HTML HWPX Output ===')
    console.log(remoteHTML);

    console.log('\n=== Remote MarkdownHWPX Output ===')
    console.log(remoteMarkdown);
  } catch (error) {
    console.error('Failed to read remote HWPX sample:', error);
  }

  // try {
  //   // const remote = await readHwpxAsPlainTextFromUrl(SAMPLE_URL);
  //   const remote = await readHwpxAsMarkdownFromUrl(SAMPLE_URL);
  //   // logPreview('Remote HWPX Output', remote);
  //   console.log('=== Remote HWPX Output ===')
  //   console.log(remote);
  // } catch (error) {
  //   console.error('Failed to read remote HWPX sample:', error);
  // }
};

const isDirectExecution = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isDirectExecution) {
  main();
}

export { main };
