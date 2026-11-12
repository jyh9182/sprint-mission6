# 레슨커넥트AI — 음악 레슨 예약 데모

음악 취향과 일정에 맞는 강사를 찾는 서비스 **레슨커넥트AI**의 소개 랜딩페이지와 **로컬 데모 예약(CRUD)** 앱입니다.
Next.js 정적 export로 만들었고, 예약 데이터는 브라우저 LocalStorage에만 저장합니다.

> **데모 범위**: 실제 AI 추천, 강사·공간 실시간 가용성, 결제·환불, 로그인, 서버 예약, 문자 발송은 구현하지 않았습니다.
> 화면의 강사·가격·공간은 예시이며, 예약은 사용 중인 브라우저에만 남습니다.

## 화면과 경로

| 경로 | 내용 |
|---|---|
| `/` | 서비스 소개 랜딩(헤더 → 히어로 → 기능 카드 → 이용 방법 → CTA → 푸터). `서비스 체험하기`는 저장하지 않는 악기 선택 Dialog를 엽니다 |
| `/home` | 앱 홈. **다가오는 레슨**(저장된 예약 중 다음 예정 1건)과 **강사 예시**(김민준 기타 60분 → 사전 선택 예약) |
| `/bookings` | 예약 목록. 검색(강사·악기·공간), 상태 필터, 정렬, 5개 단위 페이지. 조건은 URL 쿼리 `q`·`status`·`sort`·`page` |
| `/bookings/new` | 예약 생성. `?offerId=offer-kim-guitar-60&from=home`으로 들어오면 상품만 사전 선택하고 뒤로가기는 홈으로 갑니다 |
| `/bookings/detail?id={UUID}` | 예약 상세. 예정 예약은 수정·취소, 종료·취소된 예약은 기록 삭제 |
| `/bookings/edit?id={UUID}` | 예약 수정. 변경이 없으면 저장 버튼이 비활성이고, 저장하지 않고 나가면 확인 창이 뜹니다 |

정적 export에서는 빌드할 때 예약 ID를 알 수 없습니다. 그래서 `/bookings/[id]` 대신 `?id=` 쿼리를 받는 정적 페이지 하나를 씁니다.
하단 내비게이션의 `찾기`·`마이`는 아직 화면이 없어 "준비 중"으로 표시하며, 눌러도 이동하지 않습니다.

## 실행 방법

필요 환경: Node.js 24(개발 시 v24.15.0 사용), npm

```bash
npm ci
npm run dev            # 터미널에 표시되는 http://localhost:3000
npm run typecheck      # TypeScript 검사
npm run build          # 정적 export → out/
```

브라우저 테스트(Playwright, Chromium):

```bash
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright install chromium --only-shell
npm run dev -- --port 3100                         # 별도 터미널
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm test
```

기본 검사 주소는 `http://localhost:3100`이며, 다른 주소는 `LANDING_TEST_URL`로 지정합니다.
`/ui-check`(공통 UI 확인 화면)는 개발 서버에서만 제공하므로, 정적 빌드를 대상으로 실행하면 관련 테스트 7건이 skip 처리됩니다.

## 환경 변수

**필요 없음.** 일반 실행·빌드·배포에 비밀 값이나 API 키를 쓰지 않습니다.

| 변수 | 용도 | 필수 |
|---|---|---|
| `LANDING_TEST_URL` | Playwright 검사 대상 주소 | 아니요(기본 `http://localhost:3100`) |
| `LESSONCONNECT_FIGMA_PREVIEW_HOST` | Figma Make 미리보기 호스트를 개발 서버 `allowedDevOrigins`에 추가. `.figma/make/dev`가 설정 | 아니요(Figma 미리보기 전용) |

## 데이터 구조

저장소 접근은 `lib/bookings/repository.ts`에서만 합니다. 화면은 `useBookings()`·`useBookingDetail()` 훅으로 읽습니다.

- 활성 키: `lessonconnect:bookings:v2`
- 이전 키 `lessonconnect:bookings:v1`: 읽기 전용 마이그레이션 원본입니다. v2가 없을 때 검증한 뒤 v2로 복사하고, v1 원본은 지우지 않습니다.

```ts
// BookingStoreV2 (LocalStorage 값 하나)
{
  schemaVersion: 2,
  revision: number,          // 성공한 변경마다 +1. 다른 탭에서 바뀐 값을 덮어쓰지 않도록 비교(CONFLICT)
  initializedAt: string,     // ISO UTC
  seedVersion: 1,
  bookings: LessonBooking[],
}

// LessonBooking
{
  id: string,                // crypto.randomUUID()
  offerId, instructorId, spaceId, catalogVersion: string,
  snapshot: {                // 예약 시점의 표시 정보(카탈로그가 바뀌어도 기록 유지)
    instructorName, instrumentId, instrumentLabel, genres[], studioName, roomName,
    equipmentLabels[], examplePriceKRW, currency: 'KRW', durationMinutes: 60,
  },
  date: 'YYYY-MM-DD', startTime: 'HH:mm', timeZone: 'Asia/Seoul',
  memo: string,
  status: 'scheduled' | 'cancelled',   // 진행 중·종료는 현재 시각에서 계산
  source: 'user' | 'seed',
  createdAt, updatedAt: string, cancelledAt: string | null,
  referenceImage: null | {             // 선택 사항, 예약당 1장
    fileName, originalMimeType, originalSizeBytes,
    mimeType: 'image/webp', sizeBytes, width, height,
    dataUrl: 'data:image/webp;base64,...',
  },
}
```

- 카탈로그(`lib/bookings/catalog.ts`)는 읽기 전용 예시입니다. 현재는 김민준 · 기타 · Rock/Blues · 60분 · 동탄 스튜디오 A/B/C · 예시 50,000원 상품 하나만 있습니다.
- 키가 없을 때만 예시 예약 1건(7일 뒤 19:00)을 넣습니다. 사용자가 모두 삭제해 `[]`가 되면 다시 넣지 않습니다.
- 모든 레슨 시각은 기기 시간대와 상관없이 Asia/Seoul 기준으로 해석합니다.
- 참고 이미지: JPEG/PNG/WebP 원본(파일 서명 확인)만 받고, 원본은 2 MiB 이하여야 합니다. 브라우저에서 긴 변 최대 1280px의 WebP로 변환하며, 변환 결과는 500 KiB 이하여야 합니다.

## LocalStorage 제약

- **브라우저 프로필과 origin(프로토콜·호스트·포트)별로 저장됩니다.** 다른 기기, 다른 브라우저, 다른 배포 주소(예: preview URL과 production URL)와는 공유되지 않습니다.
- 브라우저 데이터를 지우거나 비공개 창을 닫으면 사라질 수 있습니다. 서버 백업은 없습니다.
- 브라우저 저장 용량(보통 origin당 약 5 MiB)이 이미지 Data URL까지 포함한 전체 한도입니다. 한도를 넘으면 저장을 거절하고, 기존 데이터와 작성 중인 내용은 그대로 둡니다.
- 로그인과 사용자별 보호가 없어 같은 브라우저를 쓰는 사람은 모두 같은 예약을 봅니다.
- 손상된 JSON이나 지원하지 않는 스키마 버전이 저장돼 있으면 자동으로 지우거나 다시 시드하지 않고 오류 화면을 보여줍니다.
- 목록 검색 조건은 URL에, 목록 스크롤 위치는 sessionStorage에 둡니다.

원래 과제의 Supabase DB·Storage·Auth·RLS와 Server Actions는 LocalStorage, Data URL, 클라이언트 저장소 함수로 대체했습니다. 서버 데이터 처리 요건을 충족한 구현이 아닙니다.

## QA 결과 (2026-11-13, Claude 실행)

| 검사 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. `/`, `/home`, `/bookings`, `/bookings/new`, `/bookings/detail`, `/bookings/edit`, `/_not-found` 정적 생성 |
| Playwright, 개발 서버(`localhost:3100`) | **156/156 통과**(기존 142 + 10단계 통합 14) |
| Playwright, 정적 빌드 `out/` 로컬 서빙(`.html` 확장자 없는 주소를 해당 파일로 연결) | **149 통과, 7 skip**(개발 전용 `/ui-check`) |
| lint | **실행하지 않음.** 프로젝트에 lint 스크립트와 ESLint 설정이 없습니다 |

자동 검사로 확인한 범위:
- 목록·상세·생성·수정·취소·삭제 흐름, 검색·필터·정렬·페이지, 목록 조건을 유지한 복귀
- 이미지 선택·교체·제거·되돌리기, 형식·용량·디코딩 오류, 저장 공간 초과(생성·수정), v1→v2 마이그레이션
- 새로고침, 직접 URL 접속(`/home`, 상세·수정 `?id=`), 0건, 없는 ID, 손상된 저장소, 다른 탭 변경
- 홈 다가오는 레슨: 다음 예정 1건 선택(취소·진행 중·종료 제외), 0건, 오류와 다시 시도
- 강사 진입: 상품만 사전 선택, 잘못된 `offerId`는 다른 상품으로 바꾸지 않고 오류 안내, 진입 경로별 뒤로가기
- 가로 넘침(랜딩은 320/390/768/1440, 앱 화면은 320/390), 이미지 대체 텍스트, Dialog 포커스 가두기·Escape·포커스 복귀, 키보드 Tab/Enter, 콘솔 오류 없음

**실행하지 않은 검증**(통과로 보지 않음):
- 실제 모바일 Safari/Chrome 실기기(회전, 모바일 키보드, WebP 인코딩, EXIF 방향)
- 스크린 리더 실제 낭독 순서
- Vercel 등 실제 배포 URL에서의 확인(배포하지 않음)
- 여러 브라우저 엔진(Firefox·WebKit). 자동 검사는 Chromium만 사용합니다

## 알려진 제한

- Figma 앱 홈의 AI 매칭률, 별점·후기 수, 강사 검증 배지, 이지은·박도현 추천 카드는 근거 데이터가 없어 구현하지 않았습니다. 홈에는 예약할 수 있는 상품(김민준)만 "예시 강사"로 표시합니다.
- Figma의 음악 취향 1~5/5 단계, AI 추천 결과, 강사 상세 화면은 아직 실제 라우트가 없습니다. 랜딩의 체험 Dialog는 저장되지 않는 데모입니다.
- 강사 진입 생성의 뒤로가기는 Figma(강사 상세)와 달리 `/home`으로 갑니다. 강사 상세 화면이 없기 때문입니다.
- 같은 시간대 중복 검사는 이 브라우저에 저장된 예약끼리만 합니다. 실제 강사·공간 일정과 비교하지 않습니다.
- 랜딩(`/`)에서 앱 홈(`/home`)으로 가는 링크는 없습니다(승인된 랜딩 시안 유지). 앱 화면의 하단 `홈` 탭으로 이동합니다.

## 배포

`next.config.ts`가 `output: 'export'`라서 `npm run build` 결과인 `out/`을 그대로 정적 호스팅에 올리면 됩니다. 서버 런타임과 환경 변수는 필요 없습니다.

- **Figma Make**: `.figma/make/deploy`(production), `.figma/make/deploy-preview`가 build 후 `figma make deploy --build-dir out`을 실행합니다. 사용자 승인 전에는 실행하지 않습니다.
- **Vercel**: 저장소에 `vercel.json`과 `.vercel` 연결 정보가 없습니다. 연결한다면 Framework Preset은 Next.js, Build Command는 `npm run build`, Install Command는 `npm ci`, Node.js 24, 환경 변수는 없음으로 설정하면 됩니다. 배포 후 직접 URL 새로고침(`/home`, `/bookings/detail?id=…`)과 이미지를 포함한 CRUD를 배포 주소에서 다시 확인해야 합니다. preview와 production은 origin이 달라 예약 데이터가 따로 저장됩니다.
- 현재 `origin` 원격은 `https://github.com/jyh9182/sprint-mission5.git`입니다. 폴더 이름(`sprint-mission6`)과 다르므로 push 전에 대상 저장소가 맞는지 확인해야 합니다.

## 프로젝트 구조

```
app/                 라우트(page.tsx), 전역 스타일·디자인 토큰(globals.css)
components/ui/       공통 UI(Button, Field, InlineAlert, ConfirmDialog, PageHeader, StatusBadge)
components/app/      앱 홈, 하단 내비게이션
components/bookings/ 예약 목록·상세·생성·수정 화면, 공통 BookingForm, 이미지 필드
lib/bookings/        타입, 카탈로그, 저장소, 검증, 경로, 목록 탐색, 시간(서울) 계산
tests/               Playwright 테스트
design/              디자인 시안·명세·진행 기록(Codex 담당, 읽기 전용)
```
