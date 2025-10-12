// cd /var/services/homes/jungsam/apps/npmjs/jnu-doc && node --loader ts-node/esm tests/hwp-test.ts
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readHwpAsPlainText, readHwpAsPlainTextFromUrl } from '../src/hwp.js';

const SAMPLE_PATH = resolve('./tests/samples/001.hwp');
const SAMPLE_URL = 'https://blog.kakaocdn.net/dna/bBGRYs/btq7jCEYcBl/AAAAAAAAAAAAAAAAAAAAAGEV09owfVMhz_DTzVE6o3hV7IKS8n0HzP-hkYvRgpZc/%EA%B3%B5%EA%B3%A0%EB%AC%B8.hwp?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=QFV%2F313Y2s5fwDlQsWfoLx2E5EA%3D&attach=1&knm=tfile.hwp';

const logPreview = (label: string, text: string) => {
  const preview = text.length > 300 ? `${text.slice(0, 300)}&` : text;
  console.log(`\n=== ${label} ===`);
  console.log(preview);
};

const main = async () => {
  try {
    const local = await readHwpAsPlainText(SAMPLE_PATH);
    // logPreview('Local HWP Output', local);
    console.log('=== Local HWP Output ===')
    console.log(local);
  } catch (error) {
    console.error('Failed to read local HWP sample:', error);
  }

  try {
    const remote = await readHwpAsPlainTextFromUrl(SAMPLE_URL);
    // logPreview('Remote HWP Output', remote);
    console.log('=== Remote HWP Output ===')
    console.log(remote);
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
