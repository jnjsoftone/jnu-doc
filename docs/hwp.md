› hwp 파일을 읽고, 쓰는 기능, hwp 파일을 pdf 나 xml, doc 파일로 변환하는 기능을 구현하려면 nodejs의
  어떤 패키지가 적합한가요?

• - Node 생태계에선 HWP를 직접 읽고/쓰는 1급 지원 라이브러리가 거의 없습니다. 가장 적극적으로 쓰이
    는 오픈소스는 hwp.js(hahnlee/hwp.js)로, HWP를 JSON/HTML로 파싱해 주지만 서식·개체가 복잡한 문서
    를 완전히 보존하긴 어렵고, 다시 HWP로 저장하는 기능은 제한적입니다.
  - PDF·DOC 변환은 대부분 외부 애플리케이션에 의존합니다. Windows 환경이면 한/글이 제공하는
    ActiveX(hwpctrl)를 감싼 hwp-converter 같은 래퍼를 Node에서 호출할 수 있고, macOS/Linux에서는
    libreoffice-convert(soffice CLI) + hwpfilters 플러그인을 설치해 unoconv나 libreoffice-convert
    패키지로 HWP→PDF/DOC를 스크립팅하는 방법이 가장 현실적입니다. 이 경우 LibreOffice가 HWP를 완전
    히 지원하지 못하는 문서는 실패할 수 있습니다.
  - XML 등 구조화된 데이터가 필요하면 Java용 hwplib이 가장 기능이 풍부합니다. Node에서 java 또는
    @elastic-io/java 같은 브리지로 JVM을 호출해 hwplib을 사용하면, 텍스트·문단·필드 등을 세밀하게
    추출하거나 수정한 뒤 다시 HWP로 저장할 수 있습니다.
  - 결국 “Node 패키지 하나로 읽기·쓰기·PDF/XML/DOC 변환을 모두 해결”하기는 어려우므로, (1) hwp.js로
    경량 파싱, (2) 외부 변환 툴(한/글 CLI, LibreOffice, Hancom Web API 등)을 child_process로 호출,
    (3) 고급 편집이 필요하면 Java hwplib 연동이라는 조합을 검토하는 것이 현실적인 선택입니다.

===

linux 환경에서 실행되는 것을 기준으로 hwp.ts를 구현한 후에, window 환경에서 import 해서 사용할 수 있나요?


    Windows 환경에서 import해서 사용하는 데는 문제가 없습니다.
  - 다만 구현 내부에서 Linux 전용 바이너리(예: libreoffice, unoconv)를 호출하거나 POSIX 전용 경로/
    명령을 사용한다면 Windows에서 실행 시 오류가 납니다. 그런 호출은 process.platform 등으로 플랫
    폼을 분기하고, Windows용 대안(예: Hancom CLI, 별도 변환기)을 선택적으로 사용하도록 설계해야 합
    니다.
  - 플랫폼별 의존성이 큰 경우에는 linux.ts, windows.ts처럼 별도 헬퍼로 분리하고, hwp.ts에서는 런타
    임 플랫폼 탐지 후 해당 구현을 위임하는 구조를 추천합니다. 이렇게 하면 공통 API는 유지하면서도
    OS별 동작 차이를 안전하게 처리할 수 있습니다.


› linux 용으로 hwp.ts를 생성하고, hwp.ts를 사용하여 api 서비스를 linux에서 제공하는 것은 어떤가요?


• - 리눅스 한정 기능이라면 hwp.ts를 Linux 전용 어댑터로 구현하고, 이를 호출하는 API 서버(예:
    Express, Fastify)를 리눅스에서만 구동하는 전략은 현실적입니다. 서버가 돌아가는 환경과 코드의 의
    존성이 일치하므로 배포와 운영이 단순해집니다.
  - 다만 변환 로직이 외부 CLI(libreoffice, unoconv, hwpfilters) 호출에 의존한다면, 해당 패키지 설치
    ·버전 관리·권한 설정을 컨테이너 이미지나 서버 프로비저닝 과정에 명확히 포함하세요. 변환 속도가
    느리거나 실패율이 있는 경우, 작업 큐(BullMQ 등)나 재시도 전략도 함께 설계하는 편이 안전합니다.
  - API에서는 기능 유무를 스스로 판별하도록(process.platform !== 'linux'면 “지원 안 함” 응답) 방어
    로직을 남겨 두면, 추후 같은 코드를 다른 OS에서 로드해도 런타임 예외를 막을 수 있습니다.
  - 팀 내에서 Windows 개발자가 있으면, 타입 정의·비즈니스 로직 등 공용 부분은 그대로 재사용하고, 실
    제 spawn 호출이나 경로 설정만 Linux 전용 모듈에서 처리하도록 경계를 유지하면 개발 경험이 더 좋
    아집니다.

  ===

• - 새 src/hwp.ts:1에서 Linux 전용 HWP 변환 유틸리티를 추가했습니다. LibreOffice CLI를 래핑해 PDF/
    Docx/XML/HTML 변환과 HTML 읽기, Docx→Hwp 변환을 제공하며, 실행 전 플랫폼과 변환기 설치 여부를
    검증합니다.
  - 모든 변환 함수가 공통 헬퍼(convertWithLibreOffice)를 공유해 출력 경로 생성, 오류 메시지, 옵션
    처리(outputDir, filter, converterBinary)를 일관되게 수행합니다 (src/hwp.ts:36, src/hwp.ts:78).
  - 런타임에서 isHwpSupportedEnvironment로 플랫폼을 확인할 수 있고, LibreOffice 미설치 시 명확한 에
    러를 반환해 API 서버에서 대응할 수 있도록 했습니다 (src/hwp.ts:146).

  1. 실제 서버 환경에 LibreOffice와 hwpfilters가 설치되어 있는지 확인하고, 엔드투엔드 변환 시나리오
     를 수동으로 검증하세요.

===

• - LibreOffice
      - Debian/Ubuntu 계열:

        sudo apt update
        sudo apt install libreoffice libreoffice-writer libreoffice-common
      - Fedora/RHEL/CentOS(≥8):

        sudo dnf install libreoffice-core libreoffice-writer libreoffice-common
      - Arch 계열:

        sudo pacman -S libreoffice-fresh   # LTS가 필요하면 libreoffice-still
      - 설치 확인: soffice --version
  - hwpfilters (LibreOffice용 HWP 필터)
      - 대부분의 배포판에서는 LibreOffice 설치 시 함께 들어옵니다. 필터 패키지가 분리되어 있다면 아
        래와 같이 설치합니다.
          - Debian/Ubuntu:

            sudo apt install libreoffice-filters
          - Fedora/RHEL/CentOS:

            sudo dnf install libreoffice-writer libreoffice-langpack-ko libreoffice-core
          - openSUSE:

            sudo zypper install libreoffice libreoffice-filters
      - 제공되지 않는 배포판이라면 GitHub의 LibreOffice/hwpfilter 소스를 내려 받아 cmake로 빌드한
        뒤 LibreOffice 확장 디렉터리에 배포해야 합니다.
  - 한글 폰트(권장)
      - Debian/Ubuntu: sudo apt install fonts-nanum fonts-noto-cjk
      - Fedora: sudo dnf install google-noto-sans-cjk-ttc nanum-gothic-fonts
      - Arch: sudo pacman -S noto-fonts-cjk ttf-baekmuk
      - 서버 재기동 후 fc-cache -fv 실행으로 캐시 갱신.
  - 선택 도구
      1. unoconv (LibreOffice를 감싸는 CLI)
          - Debian/Ubuntu: sudo apt install unoconv
          - Fedora: sudo dnf install unoconv
          - Arch: sudo pacman -S unoconv
          - LibreOffice가 headless 모드에서 잘 작동하지 않을 때 대체 진입점으로 활용합니다.
      2. ghostscript (PDF 후처리/최적화)
          - Debian/Ubuntu: sudo apt install ghostscript
          - Fedora: sudo dnf install ghostscript
          - Arch: sudo pacman -S ghostscript
  - 설치 후에는 soffice --headless --convert-to pdf test.hwp 같은 명령으로 HWP 변환이 성공하는지 확
    인하고, 필요한 경우 sudo update-alternatives --config soffice로 올바른 바이너리가 선택되어 있는
    지 점검하세요.

===

## 샘플

https://www.kookje.ac.kr/lifelong/index.php?pCode=stusquaredata&mode=fdn&idx=192&num=1


https://blog.kakaocdn.net/dna/ppwK5/btq7lP41aBY/AAAAAAAAAAAAAAAAAAAAAN6_SNvFnaRk5ARLUpua0oYCU8uHkDIsvLcO4d_amNix/%EC%9E%85%EB%B2%95%EC%98%88%EA%B3%A0(%EC%9A%B8%EC%82%B0%EA%B4%91%EC%97%AD%EC%8B%9C+%EB%82%A8%EA%B5%AC+%EA%B5%AC%EC%84%B8+%EC%A1%B0%EB%A1%80+%EC%9D%BC%EB%B6%80%EA%B0%9C%EC%A0%95%EC%A1%B0%EB%A1%80%EC%95%88).hwpx?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1761922799&allow_ip=&allow_referer=&signature=%2BKBTtq%2BdnUIQUEmcokTv%2BMn6i4c%3D&attach=1&knm=tfile.hwpx

===

node --loader ts-node/esm -e "import { readHwpAsPlainText } from './src/hwp.ts'; import { resolve } from 'node:path';    readHwpAsPlainText(resolve('./samples/001.hwp')).then(text => console.log(text.slice(0,120))).catch(err => { console.error(err); process.exitCode = 1; });"


===

# python

https://tech.hancom.com/python-hwp-parsing-1/

