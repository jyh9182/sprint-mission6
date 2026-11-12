# 레슨커넥트AI 예약 CRUD — 진행 기록

최종 갱신: 2026-11-12 (Asia/Seoul)

## 현재 상태

- 1단계 Codex: 설계 문서 작성 완료. 로컬 구현 조사는 경로 불일치로 미확인.
- 1단계 Claude: **구현·검증 완료 (2026-11-11)**. 실제 앱 프로젝트 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`. 아래 "Claude 1단계 구현 기록" 참조.
- 2단계 Codex: Figma 공통 UI 컴포넌트 9종과 사용 예시 검수 완료, UX·동작 인계 문서 작성 완료.
- 2단계 Claude: **구현·검증 완료 (2026-11-12)**. 공통 UI만 구현했고 예약 화면은 만들지 않았다. 아래 "Claude 2단계 구현 기록" 참조.
- Figma: 기존 홈·음악 취향·예약 제품 화면은 유지. 기존 Primary·Secondary·안내 마스터를 재사용·확장하고 예약 공통 요소만 추가.
- 배포: 수행하지 않음.

## 작업 경로와 인계 주의

현재 산출물 경로: `/Users/jeongyohan/Documents/Codex/2026-09-11/figma-mcp-figma-design-ai-hi/design`.

요청된 AGENTS.md, CLAUDE.md, design/README.md, design/brief.md와 앱 소스를 현재 작업 폴더에서 찾지 못했다. IDE 탭 내용은 읽지 못했다. 실제 앱 프로젝트 경로는 아직 확인되지 않았다. 앱 전체가 없다고 단정하는 의미가 아니다.

Claude 구현 전 `data-contract.md`, `steps/01-foundation.md`, `steps/02-components.md`, 이 진행 기록을 실제 앱 프로젝트에 전달하고 그 프로젝트의 작업 규칙·브리프와 대조해야 한다. 기존 같은 이름의 문서가 있다면 덮어쓰지 말고 내용을 비교·병합한다. 현재 폴더에서 새 Next.js 앱을 만들지 않는다.

## 산출물

- [데이터 계약](data-contract.md): 타입, 필수값, 상태, snapshot, LocalStorage 키/버전/초기화/오류, 저장소 함수 계약.
- [1단계 인계](steps/01-foundation.md): 현재 Figma 근거, UX·라우트, Claude 구현 범위, 완료 조건, 인계 프롬프트.
- [2단계 공통 UI 인계](steps/02-components.md): Figma 노드, 재사용 방법, 상태·문구·포커스·키보드 동작, Claude 완료 조건.
- 이 진행 기록: Codex/Claude 단계별 상태와 재개 지점.

## 최신 Figma 근거

파일 `TnJzGfgFHX6R7OnZR6KeET`, Page 1 `0:1`.

- 홈 `23:67`, 음악 취향 `42:136`: 390×844, 스크린샷 검수.
- 기존 예약 흐름: 일정 `163:833` → 공간 `178:1041` → 확인 `186:1158` → 완료 `199:1279`.
- 기존 구조에서 총 12개 제품 화면 확인. 새 CRUD 화면은 이번 단계에서 생성하지 않음.
- 과거 기록의 `7:2`, `16:94`, `7:5`는 조회되지 않음. `work/design-system-state-lessonconnect.json`을 최신 마스터로 사용하지 말 것.
- 현재 스타일은 검정 CTA·밝은 중립색·사진형 카드·Noto Sans KR. 기존 색상·스타일을 재설계하지 않음.
- 2단계 Figma 마스터 영역 `273:1454`, 상태 인스턴스 검수 보드 `279:1459`. 기존 Primary `188:1164`, Secondary 기본 `47:188`, 안내 기본 `188:1182`를 유지했다. 새 예약 화면은 없음.

## 확정 설계 결정

1. `LessonBooking`은 로컬 데모 예약이며 실제 결제·강사/공간 확정 기능이 아님.
2. 기존 3단계 일정/공간/확인 생성 흐름과 완료 화면 재사용.
3. 키 `lessonconnect:bookings:v1`, envelope schemaVersion=1. 최초 null 키만 시드, 빈 배열은 재시드 금지.
4. 상태는 scheduled/cancelled. 진행 중/종료는 시간에서 파생. 취소는 기록 유지, 삭제는 제거.
5. 첫 상품은 김민준·기타·Rock/Blues·60분·동탄 스튜디오 A/B/C·예시 50,000원.
6. 사용자 입력과 기준 카탈로그를 구분하고 예약에 표시 snapshot 저장.
7. 손상/버전 불일치/저장 실패 시 원본 유지. 성공한 쓰기 이후에만 성공 UI.
8. 실제 앱 규칙·기존 카탈로그 ID와의 정합성은 Claude 착수 시 확인.

## 10단계 상태

| 단계 | 범위 | Codex | Claude |
|---|---|---|---|
| 1 | 데이터 계약·저장소 기반 | 문서 완료 / 앱 경로 미확인 | 구현·검증 완료 |
| 2 | 기존 공통 UI 조사·보강 | Figma·문서 완료 | 구현·검증 완료 |
| 3 | 예약 목록 | 미착수 | 미착수 |
| 4 | 예약 상세 | 미착수 | 미착수 |
| 5 | 기존 생성 흐름의 CRUD 연결 설계 | 미착수 | 미착수 |
| 6 | 예약 수정 | 미착수 | 미착수 |
| 7 | 취소·삭제 | 미착수 | 미착수 |
| 8 | 검색·필터·정렬·페이지 | 미착수 | 미착수 |
| 9 | 이미지 첨부·계약 확장 | 미착수 | 미착수 |
| 10 | 통합·검수·최종 인계 | 미착수 | 미착수 |

## 검증 기록

- 로컬 파일 목록과 요청 파일 존재 여부 확인 완료.
- Figma MCP의 최신 페이지·화면·선택 컴포넌트 속성 확인 완료.
- 홈·음악 취향 스크린샷 확인 완료.
- 명세의 라우트·상태·저장 함수·단계 범위 수동 일관성 검토 완료.
- 2단계 Figma 마스터 9종의 상태·속성 확인, 검수 보드 스크린샷 확인 완료.
- Secondary Disabled의 비정상적 희미함을 수정하고 검수 보드 재촬영 완료. 기존 예약 확인 화면 `186:1158` 회귀 스크린샷 확인 완료.
- 런타임 F01~F17: Claude가 실행, 전부 통과 (1단계 기록).
- 2단계 공통 UI 런타임 검사: Claude가 실행, 전부 통과 (2단계 기록).

## 다음 작업 / 재개 지점

Claude 1·2단계 완료. 실제 앱 프로젝트 경로는 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`이며, 이 진행 기록도 그 프로젝트의 `design/`에 있다. 다음은 Codex 3단계(예약 목록) 디자인. Claude는 3단계 구현을 시작하지 않았다.

참고: 2026-11-12 Codex 갱신 시 이 문서의 "Claude 1단계 구현 기록"이 삭제되어 있었다. Claude가 커밋 `244a463`의 기록을 그대로 복원했다.

Claude 기록 양식:

```text
실제 앱 프로젝트 절대 경로:
읽은 프로젝트 규칙/브리프:
변경 파일:
카탈로그·라우트 대응표 및 계약 조정 이유:
실행한 검증 명령과 결과:
F01~F17 통과/실패/미실행 항목:
알려진 제한/미해결 문제:
Claude 1단계 완료 여부:
```
---

## Claude 1단계 구현 기록 (2026-11-11)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 프로젝트 규칙/브리프: AGENTS.md, CLAUDE.md, design/brief.md, design/data-contract.md, design/steps/01-foundation.md, package.json, tsconfig.json, playwright.config.ts, app/page.tsx, components/ui/button.tsx, Next 문서 `static-exports.md`(Browser APIs), `single-page-applications.md`.

### 변경 파일 (모두 신규, 기존 코드 수정 없음)

| 파일 | 내용 |
|---|---|
| `lib/bookings/types.ts` | 계약 §2 타입 전체, `BookingRepository` 인터페이스, 파생 `BookingPhase` |
| `lib/bookings/catalog.ts` | 읽기 전용(deep freeze) v1 카탈로그, 시드 상수, `getBookingCatalog()` |
| `lib/bookings/time.ts` | 서울 기준 날짜·시각 검증/계산, 시작·종료 구간, 파생 상태 `getBookingPhase` |
| `lib/bookings/validation.ts` | 저장 데이터 읽기 검증(구조·타입·불변식·ID 중복)과 입력 검증(활성 카탈로그·미래 시각·메모·확인 체크) 분리, snapshot 생성 |
| `lib/bookings/messages.ts` | 계약 §6 오류·필드·성공 문구 |
| `lib/bookings/repository.ts` | LocalStorage 접근이 있는 유일한 모듈. initialize/CRUD/cancel, 시드, revision, 쓰기 직렬화, 오류 매핑, 공유 싱글톤 `getBookingRepository()` |
| `lib/bookings/use-bookings.ts` | `'use client'` 최소 어댑터 훅. `initializing / ready / error` 상태, 성공 쓰기 구독, 다른 탭 `storage` 이벤트 재조회, `retry` |
| `lib/bookings/index.ts` | 공개 export (훅 제외) |
| `tests/bookings-repository.spec.ts` | F01~F17 (Node 실행, 메모리 Storage 대역, 고정 now/ID 주입) |
| `tests/bookings-browser.spec.ts` | 실제 Chromium LocalStorage: 새로고침 유지·전체 삭제 후 재시드 없음·실제 용량 초과 |

### 카탈로그·라우트 대응표 및 계약 조정 이유

- 이 프로젝트는 랜딩페이지(`/` 하나)이며 기존 예약 카탈로그·라우트가 없다. 계약 §4 fixture ID를 **그대로** 사용했다 (대응표 변경 없음). 랜딩 체험 창의 악기 목록은 데모 선택 UI이며 예약 카탈로그로 사용하지 않았다.
- 파일 위치: 제안된 `src/features/bookings` 대신 `lib/bookings`. 프로젝트에 `src/`가 없고 공용 코드가 `lib/`에 있어 기존 구조를 따랐다.
- `/bookings` 등 라우트는 3단계 이후 범위로 만들지 않았다.

### 계약과 다르거나 보완한 부분 (Codex 확인 요청)

1. **UUID 생성 폴백**: `crypto.randomUUID`는 보안 컨텍스트(https·localhost)에서만 존재한다. 실제 브라우저 테스트에서 http 테스트 origin에서 시드가 실패(안전하게 오류 반환, 쓰기 없음)하는 것을 확인했다. `dev` 스크립트가 `0.0.0.0`으로 열려 LAN IP http 접속이 가능하므로, randomUUID가 없으면 `crypto.getRandomValues`로 같은 UUID v4 형식을 생성하도록 보완했다.
2. **`subscribe(listener)` 추가**: 계약 인터페이스에 없던 메서드. 성공한 `setItem` 이후에만 호출되어 "성공 후에만 상태 발행" 규칙을 어댑터에 연결한다.
3. **시계 역행 보호**: 수정·취소 시 `updatedAt = max(now, 기존 updatedAt)`. 장치 시간이 뒤로 가도 `createdAt ≤ updatedAt` 불변식이 깨져 다음 읽기가 CORRUPT_DATA가 되는 것을 막는다.
4. **초기화 실패 후 재시도**: 공유 Promise는 진행 중에만 공유하고, 실패하면 해제해 `retry`로 다시 읽을 수 있다. 성공 후 재호출은 쓰기 없는 `getBookings`.
5. **과거 시각 오류 위치**: 날짜·시각은 각각 형식이 맞아도 조합이 과거이면 `date`, `startTime` 두 필드에 같은 문구를 넣는다.
6. **읽기 검증 세부**: 저장된 memo가 trim되지 않았거나 500 code point를 넘으면 손상으로 본다. 알 수 없는 추가 필드는 거부하지 않고 보존한다. 예상하지 못한 내부 예외는 읽기 → `STORAGE_UNAVAILABLE`, 쓰기 → `WRITE_FAILED`로 반환한다(throw하지 않음).
7. **종료가 다음 날로 넘어가지 않음**: 24:00 정각 종료는 허용한다(현재 시작 시각 최대 21:00이라 실제 영향 없음).

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과 (`/`, `/_not-found` 정적 생성) |
| `npx playwright test tests/bookings-repository.spec.ts` (TZ=Asia/Seoul, America/Los_Angeles, Pacific/Kiritimati 각각) | 17/17 통과 ×3 |
| `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test tests/bookings-browser.spec.ts` | 2/2 통과 |
| `LANDING_TEST_URL=http://localhost:3000 PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npm test` | 23/23 통과 (기존 랜딩 4개 포함) |

참고: 포트 3100 개발 서버는 이미 실행 중인 3000번 서버 때문에 시작되지 않아, 기존 3000번 서버를 대상으로 전체 검사를 실행했다. 실행 중이던 서버는 종료하지 않았다.

### F01~F17

| ID | 결과 | 비고 |
|---|---|---|
| F01 | 통과 | 동시 2회 + 반복 + 새 인스턴스 초기화, setItem 1회, 같은 ID·시각 |
| F02 | 통과 | 새 repository 재조회, 서울 시작 오름차순, 반환값 변이 차단 |
| F03 | 통과 | id/createdAt/source 유지, 줄바꿈 메모 |
| F04 | 통과 | |
| F05 | 통과 | 예정 예약 삭제는 INVALID_TRANSITION |
| F06 | 통과 | Node 대역 + 실제 Chromium 새로고침 모두 확인 |
| F07 | 통과 | 파싱 실패·배열 루트·필드 누락·없는 날짜·상태 불변식·ID 중복·버전 누락·v2; 실행 중 손상, 실행 중 키 삭제 → CONFLICT |
| F08 | 통과 | 접근 차단(getStorage·getItem)·Quota·SecurityError·일반 예외; 시드 쓰기 실패 후 재시도. 실제 Chromium 용량 초과도 확인 |
| F09 | 통과 | 저장소 오류는 NOT_FOUND로 바뀌지 않음 |
| F10 | 통과 | window 없는 Node에서 기본 저장소 → NOT_READY, 쓰기 없음 |
| F11 | 통과 | 500 code point(이모지) 경계 허용, memo 누락은 "" |
| F12 | 통과 | 진행 중 수정·취소·삭제 불가, 정확히 종료 시점부터 삭제 가능 |
| F13 | 통과 | 맞닿음 허용, 자기 자신 제외, 취소 건 제외 |
| F14 | 통과 | 다른 인스턴스(탭) 변경 후 stale revision |
| F15 | 통과 | |
| F16 | 통과 | 비활성 상품·공간, 비허용 공간, 카탈로그 변경 후 snapshot 유지/재구성 |
| F17 | 통과 | 서울 자정 경계 시드 날짜·과거 판정·정렬·진행 중; 장치 TZ 3종 |

### 알려진 제한 / 미검증

- `useBookings` 훅은 아직 어떤 화면에도 연결하지 않았다. 타입 검사만 했고 React 렌더링·Strict Mode·하이드레이션 동작은 화면 단계(3단계~)에서 실제로 확인해야 한다. 중복 시드 방지는 저장소 수준에서 검증했다.
- 실제 브라우저의 접근 차단(SecurityError)은 Storage 대역으로만 확인했다.
- 실제 두 탭 간 `storage` 이벤트 재조회는 미검증. 편집 중 폼의 충돌 안내 UI는 해당 화면 단계 범위다.
- 계약대로 LocalStorage에는 탭 간 트랜잭션이 없어 동시 쓰기 무손실을 보장하지 않는다(단일 탭 순차 사용 기준).
- AGENTS.md·CLAUDE.md의 "예약·서비스 데이터 연결하지 않음" 문구는 이번 LocalStorage 데모 예약 범위와 표현이 어긋날 수 있다. 실제 예약은 발생하지 않으므로 충돌하지 않는다고 판단했으며 문서는 수정하지 않았다.

Claude 1단계 완료 여부: **완료**. 2단계는 시작하지 않았다.

---

## Claude 2단계 구현 기록 (2026-11-12)

실제 앱 프로젝트 절대 경로: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`

읽은 프로젝트 규칙/브리프와 근거: CLAUDE.md, AGENTS.md, design/steps/02-components.md, 이 진행 기록, 기존 `components/ui/button.tsx`·`app/page.tsx`·`app/globals.css`·`lib/bookings/*`, Next 문서 `next-config-js/index.md`(phase 함수)·`pageExtensions.md`. Figma MCP로 파일 `TnJzGfgFHX6R7OnZR6KeET`의 마스터 영역 `273:1454` 스크린샷·변수, 각 마스터(188:1164, 274:1459, 275:1476, 275:1454, 275:1526, 275:1550, 275:1551, 276:1447)의 design context를 직접 읽었다.

### 기존 UI 조사 결과

- 재사용 Button: `components/ui/button.tsx` 하나. 클라이언트 초기화 전 비활성화하는 동작이 있어 그대로 유지했다.
- Input·Select·Textarea·Badge·Alert·Header 공통 컴포넌트는 없었다. Dialog는 랜딩 `app/page.tsx` 안에 체험/FAQ 전용 네이티브 `<dialog>`가 있지만 재사용 가능한 컴포넌트가 아니라서, 같은 네이티브 `<dialog>` 방식으로 공통 컴포넌트를 새로 만들었다. 랜딩의 체험/FAQ 창은 수정하지 않았다.

### 변경 파일

| 파일 | 내용 |
|---|---|
| `components/ui/button.tsx` (확장) | `appPrimary`·`appSecondary` variant와 `app` 크기 추가. `loading`·`busyLabel` prop 추가: `aria-busy`·`aria-disabled`, 포커스 유지(native disabled 아님), 클릭·폼 제출 중복 차단, Figma 스피너. 기존 variant·초기화 전 비활성 동작은 그대로 |
| `components/ui/field.tsx` (신규) | `Input`·`Select`·`Textarea`와 `focusFirstInvalid()`. 항상 보이는 레이블 `(필수)/(선택)`, `htmlFor`/`id`, 도움말·오류 `aria-describedby`, 오류 시 `aria-invalid`, `aria-required`. Select는 네이티브 + 선택 불가 placeholder 옵션 |
| `components/ui/status-badge.tsx` (신규) | `StatusBadge` — 1단계 `BookingPhase`(upcoming/in-progress/ended/cancelled) → 예정/진행 중/종료/취소됨. 포커스 불가 텍스트 |
| `components/ui/inline-alert.tsx` (신규) | `InlineAlert` info/success/error. 정보·성공 `role=status`+`aria-live=polite`, 오류 `role=alert`. 자동으로 사라지지 않음 |
| `components/ui/page-header.tsx` (신규) | `PageHeader` — 44×44 `뒤로 가기`(기존 Button ghost/icon 재사용), `onBack`이 없으면 버튼을 DOM에서 제외하고 균형 영역 유지 |
| `components/ui/confirm-dialog.tsx` (신규) | `ConfirmDialog` — Default/Processing/Error. 열리면 `유지하기`로 포커스, Tab 가두기, Escape 닫기, 배경 클릭 무시, 닫힌 뒤 연 요소로 포커스 복귀(`returnFocusRef` 지정 가능). 처리 중 확인=Loading·취소=Disabled·Escape 차단. `onConfirm` 성공 후에만 닫고 `onSuccess` 호출. 실패·예외는 Error 상태와 재시도. `StoreResult`를 그대로 반환할 수 있음 |
| `app/globals.css` | 앱 토큰 `--lc-*` 추가(Figma 변수값) 및 `lc-` 공통 UI 스타일, 확인 화면 스타일. 랜딩 토큰과 스타일은 변경 없음 |
| `public/assets/ui/*.svg` (신규) | Figma에서 내려받은 아이콘 7개: 안내·성공·오류, 스피너(밝음/어두움), 뒤로 가기, Select chevron |
| `next.config.ts` | phase 함수로 변경. 개발 서버에서만 `dev.tsx` 페이지 확장자를 허용. 정적 export 등 기존 설정은 그대로 |
| `app/ui-check/page.dev.tsx` (신규) | 개발 서버 전용 공통 UI 확인 화면 `/ui-check`. production build(`out/`)에는 라우트가 없다. LocalStorage를 쓰지 않고 결과는 체크박스로 흉내 낸다 |
| `tests/ui-components.spec.ts` (신규) | 공통 UI Playwright 검사 7개. `/ui-check`가 404면 skip |

### 명세와 다르거나 보완한 부분 (Codex 확인 요청)

1. **앱 토큰 분리**: Figma 앱 파일의 ink `#0E0E0E`·muted `#5E6169`·surface `#F6F4F0`가 랜딩 토큰(`--ink #20201e` 등)과 다르다. 랜딩 화면이 바뀌지 않도록 `--lc-*`로 따로 두었다. 두 체계를 합칠지는 디자인 결정이 필요하다.
2. **필드 포커스 표현**: Figma Focused는 2px 파란 테두리. 코드는 테두리 색 + 안쪽 1px 그림자로 같은 2px 파란 선을 만든다. 오류+포커스는 빨간 1px 테두리를 유지하고 2px 파란 outline을 2px 바깥에 그린다(명세의 합성 규칙).
3. **버튼 포커스 링**: 2px 파란 outline, offset 2px, `:focus-visible` 기준. Figma Focused variant의 안쪽 테두리 대신 바깥 링으로 구현했다(명세 문구 "2px 파란 바깥 링" 우선).
4. **오류 문구가 도움말을 대신함**: Figma처럼 오류 상태에서는 도움말 자리에 오류만 표시하고 `aria-describedby`도 오류만 가리킨다.
5. **Textarea 높이 조절**: 기본 112px, 세로로만 늘릴 수 있게 했다(`resize: vertical`). 500자 제한은 컴포넌트가 아니라 화면 검증(1단계 `validation.ts`와 같은 code point 기준)에서 처리한다. native `maxLength`는 UTF-16 기준이라 쓰지 않았다.
6. **필수 표시**: native `required`는 브라우저 기본 말풍선을 띄워 `aria-required`만 사용했다. 폼은 `noValidate`로 쓰고 `focusFirstInvalid()`로 첫 오류에 포커스한다.
7. **Dialog Escape 처리**: Chrome의 반복 Escape 강제 닫기를 피하려고 keydown 단계에서 Escape를 직접 처리한다. 동작은 명세와 같다.

### 실행한 검증 명령과 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 라우트 `/`, `/_not-found`만 생성되고 `out/ui-check`는 없음 확인. `out/assets/ui/*.svg` 포함 |
| `npm run dev -- --port 3100` 후 `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright npx playwright test` | 30/30 통과(build 전후 각 1회). 기존 랜딩 4 + 저장소 F01~F17·브라우저 2 + 공통 UI 7 |

공통 UI 검사 항목 (`tests/ui-components.spec.ts`, 실제 동작 검증):

- Button: 조건 전 Disabled와 근처 안내 문구 → 조건 충족 후 활성. 키보드 포커스 시 2px `#3875C7` outline. Enter 실행 후 이름 `저장 중…`, `aria-busy`/`aria-disabled`, 포커스 유지, 중복 Enter 무시. 성공 알림은 처리가 끝난 뒤 1개만 표시. 실패 시 오류 알림, 성공 알림 없음, 버튼 원상 복귀. Secondary Disabled opacity 0.32.
- 필드: 레이블로 찾기, 도움말 accessible description, 높이 52/112px, placeholder 옵션 선택 불가. 빈 제출 → 첫 오류 항목 포커스·`aria-invalid`·오류 문구. 오류+포커스 = 빨간 테두리 + 파란 outline. 수정하면 오류 제거. 메모 501자(이모지)는 오류지만 입력값 유지, 500자로 줄이면 해제. Enter는 줄바꿈.
- Badge 4종 텍스트·포커스 불가. Alert role/aria-live. Header 뒤로 가기 44×44, Space 실행, `Show back=false`이면 버튼 없음.
- Dialog: 이름·설명 연결, 폭 350px(390 화면), `유지하기` 초기 포커스, Tab/Shift+Tab 순환, 배경 클릭 무시, Escape 닫기·여는 버튼으로 포커스 복귀. 처리 중 Escape 무시·유지 Disabled·확인 Loading 포커스 유지. 실패 시 `role=alert`의 `삭제하지 못했어요 / 기존 기록은 유지했어요. 다시 시도해주세요.`, 성공 알림 없음, 재시도 가능. 성공 시에만 닫히고 결과 알림 표시. 같은 컴포넌트로 `예약을 취소할까요?` 문구 재사용.
- 320/390px 가로 넘침 없음, 390px에서 필드·알림·헤더 폭 350px, 이미지 로드·alt. 콘솔 오류 없음. `prefers-reduced-motion: reduce`에서 스피너 animation `none`.

디자인 확인(시각): 390px 확인 화면 전체, 필드 오류+포커스, Dialog Processing 스크린샷을 Figma 마스터 `273:1454` 스크린샷과 나란히 비교했다. 버튼·필드·Badge·Alert·Header·Dialog의 색·크기·모서리·문구가 일치했다. 화면 판독 기준이며 픽셀 단위 비교 도구는 쓰지 않았다.

### 알려진 제한 / 미검증

- 실제 스크린 리더(VoiceOver 등)로 읽어 보지는 않았다. role·aria 속성과 accessible name/description은 Playwright로 확인했다.
- `role=status` 알림은 처음 렌더링될 때 문구가 함께 들어가므로, 일부 스크린 리더는 읽지 않을 수 있다. 화면 단계에서 알림 영역을 미리 두고 내용만 바꾸는 방식이 필요한지 확인한다.
- `/ui-check`는 개발 서버 전용이라 Figma 미리보기나 정적 `out/` 검사에서는 이 공통 UI 검사가 skip된다.
- 예약 목록·상세·폼 화면과 `useBookings` 연결은 범위 밖이라 구현하지 않았다(3단계 이후).

Claude 2단계 완료 여부: **완료**. 3단계는 시작하지 않았다.
