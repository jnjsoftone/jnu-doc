// cd /var/services/homes/jungsam/apps/npmjs/jnu-doc && node --loader ts-node/esm tests/hwp-test.ts
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readHwp } from '../src/hwp.js';

const SAMPLE_PATH = resolve('./tests/samples/001.hwp');
const SAMPLE_URL = 'https://blog.kakaocdn.net/dna/bBGRYs/btq7jCEYcBl/AAAAAAAAAAAAAAAAAAAAAGEV09owfVMhz_DTzVE6o3hV7IKS8n0HzP-hkYvRgpZc/%EA%B3%B5%EA%B3%A0%EB%AC%B8.hwp?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=QFV%2F313Y2s5fwDlQsWfoLx2E5EA%3D&attach=1&knm=tfile.hwp';

const main = async () => {
  try {
    // Local
    const localHTML = await readHwp(SAMPLE_PATH, 'html');
    const localMarkdown = await readHwp(SAMPLE_PATH, 'markdown');
    console.log('=== Local HTML HWP Output ===')
    console.log(localHTML);

    console.log('\n=== Local MarkdownHWP Output ===')
    console.log(localMarkdown);

    // Remote
    const remoteHTML = await readHwp(SAMPLE_URL, 'html');
    const remoteMarkdown = await readHwp(SAMPLE_URL, 'markdown');
    console.log('=== Remote HTML HWP Output ===')
    console.log(remoteHTML);

    console.log('\n=== Remote MarkdownHWP Output ===')
    console.log(remoteMarkdown);
  } catch (error) {
    console.error('Failed to read remote HWP sample:', error);
  }

};

const isDirectExecution = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isDirectExecution) {
  main();
}

export { main };
