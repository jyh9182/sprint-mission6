# 레슨커넥트AI 랜딩페이지 — Claude Code 작업 지침

먼저 `AGENTS.md`를 읽고 프로젝트 목적과 공통 규칙을 확인한다. (`AGENTS.md`의 "내 역할 (Codex)" 항목은 Codex용이다.) 이 폴더는 이미 구현된 Next.js 프로젝트이므로 새 프로젝트를 만들거나 다른 프레임워크로 교체하지 않는다.

## 역할 분담

**Codex = 디자인 시안 담당 / Claude = 실제 코드 구현 담당**

- Codex가 만든 시안과 스펙은 `/design` 폴더에 있다. Claude는 이를 기준으로 실제 코드를 구현·보정한다.
- `/design` 폴더의 파일은 읽기만 하고 수정하지 않는다. 시안과 다르게 구현해야 할 이유가 있으면 먼저 말하고 확인받는다.
- Codex와 같은 파일을 동시에 수정하지 않는다.
- Codex 시안은 참고 자료다. HTML을 그대로 복사하지 말고 현재 구조와 재사용 컴포넌트에 맞게 반영한다.

## 디자인 기준 자료 (우선순위 순)

1. 승인된 Figma 원본
   - 파일: https://www.figma.com/design/RyxzsASpQMGHSrEaHfWGgJ
   - 편집 가능한 Desktop: https://www.figma.com/design/RyxzsASpQMGHSrEaHfWGgJ?node-id=2-44
   - 편집 가능한 Mobile: https://www.figma.com/design/RyxzsASpQMGHSrEaHfWGgJ?node-id=2-45
   - Components & Behavior: https://www.figma.com/design/RyxzsASpQMGHSrEaHfWGgJ?node-id=2-46
   - 같은 파일의 실행 코드 레이어: https://www.figma.com/design/RyxzsASpQMGHSrEaHfWGgJ?node-id=16-154
2. `design/brief.md` — 브랜드 톤, 색상, 폰트, 지금까지의 결정사항
3. `design/specs/` — Codex가 작성한 페이지·섹션별 스펙 (문구, 간격, 인터랙션, 390/1440 차이)
4. `design/prototypes/` — Codex가 만든 정적 HTML 시안
5. `design/mockups/` — 시안 이미지. 구현 전에 직접 열어서 확인한다.
6. `design/assets.manifest.json`, `public/assets` — 사용할 사진과 정보

Codex 시안이 승인된 Figma와 충돌하면 바로 반영하지 말고 차이를 알려 확인받는다.

Desktop 1440px, Mobile 390px은 긴 랜딩페이지 시안이다. 앱 화면의 390×844 제한을 랜딩페이지 전체 높이에 적용하지 않는다. 기존 모바일 앱 파일의 01~12 화면은 변경하지 않는다.

## 유지할 내용과 스타일

헤더 → 히어로 → 기능 카드 3개 → 이용 방법 3단계 → CTA → 푸터 순서다. 화이트 배경, 다크 버튼, Noto Sans KR, 민트 추천 배지, 피치 CTA, 따뜻한 음악 사진, 둥근 카드를 유지한다. 전체 화면을 PNG로 대체하지 않는다.

현재 서비스는 데모다. 체험 버튼은 악기 선택 창을 열고, FAQ는 설명 창을 열며, 메뉴는 해당 섹션으로 이동한다. 실제 AI·예약·결제·문자·개인정보 수집은 연결하지 않는다. 강사 정보는 예시임을 표시한다. 허위 후기, 실제 예약번호, 운영 실적을 추가하지 않는다.

## 프로젝트 구조

- `app/page.tsx`: 랜딩페이지 섹션, 체험/FAQ 창, 모바일 메뉴
- `app/globals.css`: 디자인 토큰, 반응형 레이아웃, 접근성 스타일
- `components/ui/button.tsx`: shadcn/ui 방식의 재사용 Button
- `app/layout.tsx`: 한국어 문서, 로컬 글꼴, 메타데이터
- `next.config.ts`: 정적 export. production build 결과는 `out/`
- `.figma/make/`: Figma 실행·배포 설정. 배포 명령은 사용자 승인 전 실행하지 않는다.
- `tests/landing.spec.ts`: 화면 너비 320/390/768/1440과 메뉴·FAQ·체험 흐름 검사
- `design/`: Codex 시안·스펙과 디자인 참고 자료 (읽기 전용)

## 코드 규칙

- 정적 export 구성이다. 서버 전용 기능(API 라우트, 서버 액션, 동적 렌더링 등)을 추가하지 않는다.
- 이 프로젝트의 Next.js 버전은 학습 데이터와 API·규칙이 다를 수 있다. 코드 작성 전 `node_modules/next/dist/docs/`의 관련 문서를 확인하고 deprecation 안내를 따른다.
- 색상·폰트·간격은 하드코딩하지 말고 `app/globals.css`의 디자인 토큰을 사용하거나 확장한다.
- 반복되는 버튼과 카드는 재사용한다. 버튼은 `components/ui/button.tsx`를 사용한다.
- 상태나 이벤트가 필요한 곳에만 클라이언트 컴포넌트를 사용한다.
- 접근성: 이미지 대체 텍스트, 의미 있는 버튼·링크 문구, 키보드 조작, 모달 포커스 가두기와 Escape 닫기·포커스 복귀, `prefers-reduced-motion` 대응을 유지한다.

## 실행과 검증

1. Node.js와 npm을 확인한다. 개발 환경에서는 Node 24를 사용했다.
2. `npm ci`
3. `npm run dev` → 터미널에 표시되는 `http://localhost:3000` 주소에서 확인. 개발 모드에서 임의의 IP 주소로 바꾸면 Next.js의 개발 서버 연결이 차단될 수 있다.
4. `npm run build`, `npm run typecheck`
5. 브라우저 검사: `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install chromium --only-shell` 후, 별도 터미널에서 `npm run dev -- --port 3100`을 실행하고 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm test`. 기본 검사 주소는 `http://localhost:3100`이다. 다른 주소는 `LANDING_TEST_URL` 환경 변수로 지정한다.

메뉴/CTA/FAQ, 선택 전 비활성/선택 후 활성, Escape 닫기와 포커스 복귀, 마지막 CTA, 가로 넘침, 이미지와 대체 텍스트, 콘솔 오류를 확인한다. 디자인과 실제 동작 검증을 구분해서 보고한다.

## 작업 방식

- 현재 구현을 실행하고 Figma의 Desktop/Mobile(또는 요청받은 Codex 시안)을 실제로 읽은 뒤 차이가 큰 부분부터 보정한다. 변경 범위를 작게 유지한다.
- 한 번에 한 섹션 또는 한 기능씩 작업한다.
- 작업이 끝나면 바뀐 파일, 시안과 다르게 구현한 부분, 검증 결과를 짧게 정리해서 알려준다.
- Figma MCP 연결은 사용하는 Claude Code 환경에서 별도로 인증해야 하며 이 폴더에는 토큰이나 계정 정보가 없다. 연결되지 않으면 접근했다고 주장하지 않는다.
- Figma의 코드와 이 로컬 폴더는 자동 동기화되지 않는다. 한쪽을 수정한 뒤 다른 쪽이 바뀌었다고 가정하지 않는다. 결과를 검증한 뒤 반영 경로를 명시한다.
- 재설계, 프레임워크 교체, 새로운 서비스 연동은 별도 요청이 있을 때만 진행한다.
- 승인 전 외부 게시, 배포, 실제 서비스 연결은 하지 않는다.

## Figma 미리보기 유지보수

`.figma/make/dev`는 현재 코드 레이어의 정확한 미리보기 호스트를 `LESSONCONNECT_FIGMA_PREVIEW_HOST`로 전달한다. `next.config.ts`는 이 호스트만 추가 허용한다. 일반 로컬 실행에는 이 환경 변수가 필요 없다. Figma가 미리보기 주소를 바꾸면 실제 표시되는 새 호스트를 확인한 후 갱신한다. 와일드카드 전체 허용이나 보안 검사 비활성화로 대체하지 않는다.

`.figma/make/install`은 중단된 설치 파일 때문에 발생한 ENOTEMPTY 오류를 방지하기 위해 기존 `node_modules`를 임시 폴더로 옮긴 후 `npm ci`를 실행한다. 프로젝트 소스는 삭제하지 않는다.

재사용 Button과 FAQ 버튼은 클라이언트 초기화가 완료된 뒤 활성화된다. Figma의 첫 로딩이 느릴 때 클릭이 사라지던 문제를 해결한 동작이므로 유지한다. 실제 사용자 기능과 상태가 준비되기 전에 버튼만 활성화하지 않는다.

## VS Code에서 이어가기

`lessonconnect-landing.code-workspace`를 VS Code의 파일 → 파일에서 작업 영역 열기로 연다. 권장 확장에 포함된 Anthropic의 공식 Claude Code를 설치하고 본인 계정으로 로그인한다. 처음에는 현재 프로젝트를 실행·검수하는 작업부터 시작한다.

공식 설치 안내: https://code.claude.com/docs/en/vs-code
