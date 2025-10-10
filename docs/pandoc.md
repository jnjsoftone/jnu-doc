## 설치

```sh
# Ubuntu/Debian
sudo apt-get install pandoc

# macOS
brew install pandoc

# Windows
choco install pandoc
```

===

● 완료되었습니다! pandoc.ts 파일을 child_process를 직접 사용하여 안전하게 구현했습니다.

  ✅ 구현 완료 내용

  1. pandoc.ts 생성 (/var/services/homes/jungsam/apps/npmjs/jnu-doc/src/pandoc.ts)

  주요 함수:

  1. checkPandocInstalled() - Pandoc 설치 여부 확인
  2. convertWithPandoc() - 문자열/파일을 Pandoc으로 변환
  3. convertFileWithPandoc() - 파일을 파일로 변환
  4. markdownToHtml() - Markdown → HTML 변환 (편의 함수)
  5. htmlToMarkdown() - HTML → Markdown 변환 (편의 함수)

  보안 기능:
  - ✅ execFile 사용 (shell injection 방지)
  - ✅ --sandbox 플래그 적용 (파일 시스템 접근 제한)
  - ✅ 포맷 검증 (40+ 유효한 포맷만 허용)
  - ✅ 타임아웃 설정 (무한 대기 방지)
  - ✅ 버퍼 크기 제한 (메모리 폭주 방지)

  편의 기능:
  - ✅ 문자열 입력 시 자동 임시 파일 생성/삭제
  - ✅ Promise 기반 비동기 API
  - ✅ 상세한 JSDoc 주석 및 사용 예시
  - ✅ 상세한 에러 메시지
  - ✅ TypeScript 타입 정의 (PandocOptions)

  2. index.ts 업데이트

  5개 함수 export 추가:
  export {
    checkPandocInstalled,
    convertWithPandoc,
    convertFileWithPandoc,
    markdownToHtml,
    htmlToMarkdown,
  } from './pandoc.js';

  3. 빌드 성공

  - ✅ TypeScript 타입 선언 생성 (types/pandoc.d.ts)
  - ✅ CommonJS 빌드 (cjs/pandoc.js)
  - ✅ ES Module 빌드 (esm/pandoc.js)

  📝 사용 예시

  import {
    checkPandocInstalled,
    convertWithPandoc,
    convertFileWithPandoc,
    markdownToHtml,
    htmlToMarkdown
  } from 'jnu-doc';

  // 1. Pandoc 설치 확인
  const installed = await checkPandocInstalled();
  if (!installed) {
    console.log('Please install pandoc first');
  }

  // 2. 문자열 변환 (Markdown → HTML)
  const html = await convertWithPandoc(
    '# Hello World\n\nThis is **bold** text.',
    'markdown',
    'html',
    { args: ['--standalone', '--toc'] }
  );

  // 3. 파일 변환 (Markdown → PDF)
  await convertFileWithPandoc(
    './input.md',
    './output.pdf',
    'markdown',
    'pdf',
    {
      args: ['--pdf-engine=xelatex'],
      timeout: 60000
    }
  );

  // 4. 편의 함수 사용
  const htmlContent = await markdownToHtml('# Title\n\nContent');
  const mdContent = await htmlToMarkdown('<h1>Title</h1><p>Content</p>');

  🔒 보안 특징

  프로젝트 요구사항에 맞춰 안전하게 구현되었습니다:
  - Shell injection 공격 방지
  - 샌드박스 모드로 파일 시스템 접근 제한
  - 입력 검증 및 타임아웃 처리