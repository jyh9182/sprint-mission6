# 레슨커넥트AI 예약 CRUD — 진행 기록

최종 갱신: 2026-11-11 (Asia/Seoul)

## 현재 상태

- 1단계 Codex: 설계 문서 작성 완료. 로컬 구현 조사는 경로 불일치로 미확인.
- 1단계 Claude: **구현·검증 완료 (2026-11-11)**. 저장소 기반만 구현했고 화면은 만들지 않았다. 아래 "Claude 1단계 구현 기록" 참조.
- Figma: 현재 홈·음악 취향 시각 확인 및 예약 흐름 텍스트/구조 확인. 변경 없음.
- 배포: 수행하지 않음. 2단계: 미착수.

## 작업 경로와 인계 주의

현재 산출물 경로: `/Users/jeongyohan/Documents/Codex/2026-09-11/figma-mcp-figma-design-ai-hi/design`.

요청된 AGENTS.md, CLAUDE.md, design/README.md, design/brief.md와 앱 소스를 현재 작업 폴더에서 찾지 못했다. IDE 탭 내용은 읽지 못했다. 실제 앱 프로젝트 경로는 아직 확인되지 않았다. 앱 전체가 없다고 단정하는 의미가 아니다.

Claude 구현 전 이 문서 3개를 실제 앱 프로젝트에 전달하고 그 프로젝트의 작업 규칙·브리프와 대조해야 한다. 기존 같은 이름의 문서가 있다면 덮어쓰지 말고 내용을 비교·병합한다. 현재 폴더에서 새 Next.js 앱을 만들지 않는다.

## 산출물

- [데이터 계약](data-contract.md): 타입, 필수값, 상태, snapshot, LocalStorage 키/버전/초기화/오류, 저장소 함수 계약.
- [1단계 인계](steps/01-foundation.md): 현재 Figma 근거, UX·라우트, Claude 구현 범위, 완료 조건, 인계 프롬프트.
- 이 진행 기록: Codex/Claude 단계별 상태와 재개 지점.

## 최신 Figma 근거

파일 `TnJzGfgFHX6R7OnZR6KeET`, Page 1 `0:1`.

- 홈 `23:67`, 음악 취향 `42:136`: 390×844, 스크린샷 검수.
- 기존 예약 흐름: 일정 `163:833` → 공간 `178:1041` → 확인 `186:1158` → 완료 `199:1279`.
- 기존 구조에서 총 12개 제품 화면 확인. 새 CRUD 화면은 이번 단계에서 생성하지 않음.
- 과거 기록의 `7:2`, `16:94`, `7:5`는 조회되지 않음. `work/design-system-state-lessonconnect.json`을 최신 마스터로 사용하지 말 것.
- 현재 스타일은 검정 CTA·밝은 중립색·사진형 카드·Noto Sans KR. 기존 색상·스타일을 재설계하지 않음.

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
| 2 | 기존 공통 UI 조사·보강 | 미착수 | 미착수 |
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
- 런타임 F01~F17: Claude가 실행, 전부 통과 (아래 기록).

## 다음 작업 / 재개 지점

Claude 1단계 완료. 다음은 Codex 2단계(기존 공통 UI 조사·보강). Claude는 2단계 구현을 시작하지 않았다.

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
