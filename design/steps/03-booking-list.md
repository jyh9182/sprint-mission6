# 3/10단계 — 예약 목록 화면

작성일: 2026-11-12 · Codex 디자인·UX 명세 / Claude 앱 구현

## 범위와 Figma 결과

`/bookings`의 390×844 화면만 설계했다. 기존 홈 화면은 수정하지 않았다. 1단계의 [LessonBooking 데이터 계약](../data-contract.md), [라우트·흐름](01-foundation.md), 2단계의 [공통 UI](02-components.md)를 따른다. 실제 앱 코드와 런타임은 이 작업 폴더에서 확인하지 못했으며 Figma 화면은 동작 명세다.

| 상태 | Figma 프레임 | 진입 조건 |
|---|---|---|
| 기본 목록 | [14_Booking_List_Default](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=283-1588) | 초기화·조회 성공, 예약 1건 이상 |
| 예약 0건 | [14_Booking_List_Empty](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=283-1659) | 검증된 저장소의 `bookings.length === 0` |
| 초기화 중 | [14_Booking_List_Initializing](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=283-1716) | 브라우저 mount 후 `initialize()` 대기 중 |
| 읽기 실패 | [14_Booking_List_Read_Error](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=283-1771) | `initialize()` 또는 `getBookings()` 실패 |
| 긴 목록·스크롤 | [14_Booking_List_Dense_Scroll](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=283-1833) | 카드가 화면보다 많음; viewport 세로 스크롤 |

새 [Card / LessonBooking](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=282-1584) 컴포넌트를 한 개 만들고 화면에는 인스턴스를 배치했다. 기존 [Header / Basic](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1551), [Primary Button](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=188-1164), [Status Badge](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1526), [Inline Alert](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1550), [Bottom Navigation](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=30-126), 달력·위치 아이콘을 재사용했다. 내비게이션은 각 화면 인스턴스에서 `예약`을 선택 상태로 표시하며 홈 마스터와 홈 화면은 그대로다.

## 화면 구조와 시각 규칙

- 화면 390×844, 흰 배경, 콘텐츠 좌우 20px → 너비 350px. 상단 상태 표시줄과 가운데 `예약 내역` 헤더 아래 `내 레슨` 제목, 설명, `새 레슨 예약` Primary CTA를 둔다.
- CTA 아래 전체 저장 예약 수를 `예약 N건`으로 표시한다. `N`에는 예정·진행 중·종료·취소됨을 모두 포함한다. 검색·필터·상태별 집계는 8단계 범위다.
- 목록 viewport는 화면의 y=309~767, 높이 458px이며 세로 스크롤이다. 카드 간격 12px. 하단 내비게이션은 y=767~844에 고정한다. 마지막 카드가 내비게이션 아래에 숨지 않도록 코드의 스크롤 콘텐츠 끝에 안전 여백을 둔다.
- 카드 기본 너비 350px, 최소 예시 높이 180px, radius 20px, 흰 배경·기존 얇은 border. 내부 16px 여백과 8px 단위 간격을 사용한다. 내용 증가 시 높이를 늘리며 고정 높이로 자르지 않는다.
- Noto Sans KR 기존 텍스트 스타일과 `ink`, `muted`, `primary`, `surface`, `border`, `white` 변수를 사용한다. 카드에 새 그림자·사진·AI 매칭률을 추가하지 않았다. 예약 snapshot에는 프로필 사진이나 매칭률이 없기 때문이다.
- Figma에 표시한 `2026년 11월 19일`은 시각 예시다. 런타임 초기 시드는 1단계 계약대로 **서울 기준 최초 실행일+7일**이며, 예시 날짜를 하드코딩하지 않는다.

## 카드 데이터·상태 계약

| 카드 요소 | 데이터 원천·표시 |
|---|---|
| 강사 | `booking.snapshot.instructorName` + `선생님` 호칭. 원본에 이미 호칭이 포함돼 있으면 중복 추가하지 않음 |
| 악기·길이 | `snapshot.instrumentLabel` · `snapshot.durationMinutes`분. v1은 60분 |
| 날짜·시간 | `booking.date`, `startTime`을 `Asia/Seoul`로 해석. 예: `2026년 11월 19일 (목) · 19:00–20:00`; 종료는 길이에서 계산 |
| 공간 | `snapshot.studioName` · `snapshot.roomName`; 현재 카탈로그를 재조회해 과거 예약의 표기를 바꾸지 않음 |
| 상태 | 중첩 Status Badge: `Scheduled`=예정, `InProgress`=진행 중, `Ended`=종료, `Cancelled`=취소됨 |

`scheduled`와 `cancelled`만 저장한다. 진행 중·종료는 현재 서울 시각과 레슨 시작·종료에서 파생한다. 실제 수강 완료로 해석하지 않는다. 목록은 `getBookings()`의 서울 레슨 시작 오름차순, 동률 ID 오름차순을 따른다. 취소된 예약도 삭제 전까지 목록에 남는다. 선택한 필터가 없으므로 모든 상태를 표시한다.

새 카드 컴포넌트의 Figma 텍스트 속성은 `Instructor`, `Instrument`, `Date and time`, `Space`다. 상태는 카드 내부 `Booking status` Badge 인스턴스의 `Status`를 설정한다. 카드 전체가 상세 링크이며, 카드 안에 별도의 취소·삭제 버튼을 두지 않는다.

### 긴 이름과 많은 예약

- 강사명은 최대 2줄, 공간명은 최대 2줄까지 표시하고 넘치면 줄임표를 사용한다. 상세 화면과 접근성 이름에는 **전체 문자열**을 보존한다. 악기·길이는 가능하면 1줄, 긴 악기명은 2줄까지 허용한다.
- 날짜·시간·상태는 의미가 잘리면 안 된다. 날짜·시간은 구분자 주변에서 최대 2줄로 줄바꿈하고, 공간/강사 문자열보다 우선해 읽을 수 있게 한다. 카드 높이는 늘어난 만큼 자동 확장한다.
- 카드가 많아도 마지막 항목까지 스크롤 가능해야 한다. 스크롤 위치는 목록 → 상세 → 뒤로 돌아왔을 때 같은 목록 세션에서 복원한다. 새 데이터가 저장·취소·삭제되면 목록을 다시 읽고 count와 상태를 갱신한다.
- 3단계에서 검색·필터·정렬 조작·페이지네이션을 만들지 않는다. 대량 목록의 UI 기준은 스크롤이며, 이후 8단계에서 탐색 기능을 추가한다. 임의 개수만 표시하거나 나머지를 숨기지 않는다.

## 화면 상태와 버튼 동작

| 요소·상태 | 사용자 동작 | 결과 |
|---|---|---|
| `새 레슨 예약` | 탭/클릭, Enter/Space | `/bookings/new`의 유효 상품 선택 단계로 이동. 이미 선택한 offer가 있는 진입점은 기존 `/bookings/new?offerId=...` 계약을 사용. 목록에서 김민준 상품을 임의 기본 선택하지 않음 |
| 예약 카드 | 카드 전체 탭/클릭, Enter | `/bookings/[id]`로 이동. `id`는 저장된 예약 ID. 목록에서 수정·취소·삭제하지 않음 |
| 하단 예약 탭 | 탭/클릭 | `/bookings`로 이동하고 현재 탭 강조. 다른 탭은 기존 앱의 라우트 계약을 따른다 |
| 빈 목록 | 새 레슨 예약 CTA 사용 | 0건이 정상 조회 결과임을 유지. 다시 시드하지 않음 |
| 초기화 중 | CTA 비활성, 예약 수 미표시 | `initialize()`가 끝나기 전 빈 목록을 순간 표시하지 않음. 하단 탭 이동은 가능 |
| 읽기 실패 | `다시 시도` | 저장소를 **읽기 재시도**. 성공하면 기본/빈 목록으로 전환. 실패면 오류 유지. CTA는 비활성; 쓰기나 초기화 리셋을 시도하지 않음 |

초기 로딩은 `aria-busy=true`인 목록 영역과 `role=status` 문구로 안내한다. 오류는 2단계 Inline Alert `Tone=Error`를 사용하고, 코드별 구체 문구는 1단계 데이터 계약을 따른다: `STORAGE_UNAVAILABLE`은 브라우저 설정 확인, `CORRUPT_DATA`는 기존 데이터 미변경, `UNSUPPORTED_VERSION`은 앱 버전 확인. 실패를 0건으로 바꾸거나 `localStorage.clear()`/재시드로 덮어쓰지 않는다. 읽기 재시도 성공 후에만 카드와 count를 노출한다. 카드 링크와 CTA의 포커스 링은 2단계 규칙을 따르고, 스크린 리더 카드 이름에는 강사·날짜·시간·상태를 포함한다.

## Claude 구현 인계

실제 앱 프로젝트에서 `AGENTS.md`, `CLAUDE.md`, `design/README.md`, `design/brief.md` 및 기존 라우트·공통 컴포넌트를 먼저 확인한다. 이 폴더에는 해당 앱 소스가 없어 구현 완료를 주장하지 않는다. 경로가 다르면 1단계의 목표 라우트 의미를 유지하고 대응표를 기록한다.

> `design/data-contract.md`, `design/steps/01-foundation.md`, `design/steps/02-components.md`, `design/steps/03-booking-list.md`를 읽고 `/bookings`를 구현해줘. Figma의 기본·0건·초기화·읽기 실패·긴 목록 프레임을 기준으로 기존 Master Design System과 컴포넌트를 재사용해줘. `initialize()` 완료 후 `getBookings()` 결과에서 count와 카드를 만들고, snapshot·서울 시각·파생 상태를 정확히 표시해줘. 카드 전체는 `/bookings/[id]`, 새 예약 CTA는 유효 상품 선택 흐름으로 연결해줘. LocalStorage 읽기 실패와 정상 0건을 구분하고 재시도를 구현해줘. 검색·필터 기능과 상세 화면은 아직 만들지 마. 변경 파일·실행 검증·Figma 대응을 progress에 기록해줘.`

### 완료 조건

1. 390×844에서 헤더·CTA·카드·하단 내비게이션 배치가 Figma와 일치하고, 홈 화면에 회귀가 없다.
2. 유효한 `LessonBooking`의 snapshot, 서울 날짜·시간, 파생 상태 Badge, 전체 건수가 일치한다. 0건에도 시드가 반복 생성되지 않는다.
3. 초기화 중에는 빈 상태가 표시되지 않고, 실패 시 저장 데이터를 보존한 오류·재시도 UI가 뜬다. 성공한 조회 이후에만 목록을 표시한다.
4. 카드와 CTA가 마우스·터치·키보드에서 동작하고 카드가 정확한 ID 상세 경로를 연다. 아직 상세 페이지가 없다면 라우트 연결의 목표를 유지하고 단계 4까지 임시 목적지 동작을 명시한다.
5. 긴 문자열·다수 카드가 겹치거나 하단 내비게이션에 가려지지 않으며 마지막 카드까지 스크롤된다.
6. SSR 단계에서 LocalStorage를 읽지 않고, Supabase·서버 DB를 추가하지 않는다. 앱의 테스트·실행 결과는 Claude가 실제 프로젝트에서 기록한다.

## Figma 검수

- 5개 390×844 프레임을 각각 스크린샷으로 확인했다. 카드·빈 상태·초기화·오류·긴 목록에서 텍스트 잘림/겹침을 확인했다.
- 긴 목록 viewport는 `overflowDirection=VERTICAL`, `clipsContent=true`, 높이 458px, 내부 콘텐츠 높이 756px이다. Bottom Navigation 인스턴스는 프레임 하단 y=767에 고정되어 있다.
- 화면 텍스트 폰트는 모두 Noto Sans KR. 카드·버튼·Badge·알림·헤더·내비게이션은 편집 가능한 Figma 노드/인스턴스이며 전체 화면 래스터 이미지는 없다.
- 원본 홈 `23:67`과 원본 하단 내비게이션 마스터 `30:126`을 수정하지 않았다. 새 화면은 기존 내비게이션 인스턴스에서 예약 탭 강조를 오버라이드한다.
