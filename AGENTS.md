# 레슨커넥트AI 랜딩페이지

목적: 음악을 취미로 시작하거나 다시 배우려는 성인에게 취향 기반 강사 추천, 수준별 레슨, 일정과 공간 선택의 가치를 소개한다.

역할 분담: **Codex = 디자인 시안 담당 / Claude = 실제 코드 구현 담당**

## 내 역할 (Codex)
- 디자인 시안과 스펙을 만든다. 실제 서비스 코드는 Claude가 작성한다.
- 작업 결과물은 **`/design` 폴더 안에만** 만든다.
- `app/`, `components/`, `public/`, `package.json` 등 실제 코드와 설정 파일은 수정하지 않는다.
- 채팅으로만 답하지 말고 결과물은 반드시 파일로 저장한다. Claude는 파일만 읽을 수 있다.

## 프로젝트 정보
- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui Button. 정적 export 구성.
- 서비스 데이터와 로그인은 아직 연결하지 않는다.
- 디자인 원본(Figma): https://www.figma.com/design/RyxzsASpQMGHSrEaHfWGgJ

## 디자인 기준 (승인 시안 유지)
- 화이트 배경, 다크 버튼, 피치와 민트 강조색
- 폰트: Noto Sans KR
- 따뜻한 분위기의 음악 사진, 둥근 카드
- 세부 기준과 지금까지의 결정사항: `design/brief.md` (최우선 기준)
- 기존 시안 이미지: `design/mockups/`. 새 시안은 기존 시안과 스타일이 이어지게 만든다.

## 페이지 구성과 콘텐츠 원칙
- 섹션 순서: 헤더 → 히어로 → 기능 카드 3개 → 이용 방법 3단계 → CTA → 푸터
- 데모 동작: 체험 버튼은 악기 선택 창, FAQ는 설명 창을 열고, 메뉴는 해당 섹션으로 이동한다.
- CTA는 로컬 악기 선택 체험이다. 실제 AI·예약·결제·문자·개인정보 수집 기능을 시안에 넣지 않는다.
- 강사 정보는 예시임을 화면에 표시한다. 허위 후기, 실제 예약번호, 운영 실적을 넣지 않는다.
- 사진은 `public/assets`와 `design/assets.manifest.json`에 있는 것을 우선 사용한다. 전체 화면을 PNG 한 장으로 대체하지 않는다.
- Desktop 1440px, Mobile 390px은 긴 랜딩페이지다. 앱 화면의 390×844 제한을 전체 높이에 적용하지 않는다.
- 반복되는 버튼과 카드는 같은 스타일로 통일해 재사용할 수 있게 설계한다.

## 결과물 형식
1. **정적 HTML 시안** → `design/prototypes/<페이지명>.html`
   - 파일 하나로 열어볼 수 있게 만든다 (CSS 포함, 외부 빌드 불필요).
   - 섹션마다 주석으로 이름을 단다 (예: `<!-- Hero -->`, `<!-- Features -->`).
2. **스펙 문서** → `design/specs/<페이지명>.md`
   - 섹션 순서와 각 섹션의 목적, 문구
   - 사용한 색상 코드, 폰트, 크기, 간격, 모서리 둥글기
   - 버튼·호버·메뉴·모달·FAQ 등 인터랙션 설명
   - 모바일(390px) / 데스크톱(1440px)에서 달라지는 점
   - 이미지 자리마다 들어갈 사진 설명과 대체 텍스트(alt) 문구

## 규칙
- 색상과 폰트는 승인 시안과 `brief.md`의 값을 우선 사용한다. 새 값을 쓰면 스펙 문서에 이유를 적는다.
- 이미지가 필요한 자리는 플레이스홀더로 두고 어떤 이미지가 들어갈지 적는다.
- 접근성을 고려한다: 충분한 색 대비, 의미 있는 버튼·링크 문구, 모달의 닫기 방법(Escape 포함), 애니메이션은 reduced-motion에서 꺼질 수 있게 설명한다.
- 승인 시안의 방향을 바꾸는 제안은 바로 반영하지 말고 스펙 문서에 "제안"으로 따로 적는다.
- 승인 전 외부 게시나 실제 서비스 연결은 하지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
