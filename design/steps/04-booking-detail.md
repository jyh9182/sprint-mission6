# 4/10단계 — 예약 상세 화면

작성일: 2026-11-12 · Codex 디자인·UX 명세 / Claude 앱 구현

## 범위와 Figma 프레임

대상은 예약 ID별 상세 화면(`/bookings/[id]`의 의미), 기준 크기는 390×844다. **현재 실제 앱은 Next.js 정적 export이므로 물리 URL은 `/bookings/detail?id={UUID}`로 구현한다.** 빌드 뒤 LocalStorage에서 생기는 UUID를 `generateStaticParams()`로 열거할 수 없어 `/bookings/{id}` 파일을 생성할 수 없다. 기존 `lib/bookings/routes.ts`의 `bookingDetailHref(id)`만 새 URL을 만들도록 바꾸고 목록 카드도 그 헬퍼를 사용한다. 호스팅 rewrite나 서버 전환은 이번 범위가 아니다. [예약 데이터 계약](../data-contract.md)과 [3단계 목록](03-booking-list.md)의 같은 `LessonBooking`을 사용한다. 취소·삭제 **확인 Dialog의 최종 내용과 실행 흐름은 7단계**에 둔다. 이번 단계는 상세 조회, 화면 상태, 액션의 위치·노출 조건을 설계했다. 기존 홈과 예약 목록 화면은 수정하지 않았다.

| 상태 | Figma 링크 | 의미 |
|---|---|---|
| 시작 전 예정 | [15_Booking_Detail_Scheduled](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-1807) | 상세 정상 조회, 수정·취소 진입 가능 |
| 메모 없음 | [15_Booking_Detail_No_Memo](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-1869) | `memo === ""`인 정상 예약 |
| 긴 메모 | [15_Booking_Detail_Long_Memo](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-1931) | 줄바꿈과 스크롤 검수 |
| 취소됨 | [15_Booking_Detail_Cancelled](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-1993) | 수정·재취소 없음, 삭제 진입 가능 |
| 없는 ID | [15_Booking_Detail_Not_Found](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-2055) | 유효하지 않거나 저장소에 없는 ID |
| 초기화 중 | [15_Booking_Detail_Initializing](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-2090) | `initialize()`·첫 `getBooking()` 대기 |
| 조회 실패 | [15_Booking_Detail_Read_Error](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-2123) | NOT_FOUND 이외 읽기 오류 |

반복되는 상세 필드는 새 [Card / Information](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=285-1808), 메모는 새 [Card / Memo](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=285-1828) 인스턴스를 사용한다. 두 컴포넌트는 기존 색·타입·간격·라운드 변수에 바인딩했다. [Header / Basic](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1551), [Status Badge](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1526), [Primary/Secondary 버튼](02-components.md#figma-컴포넌트와-재사용-방법), [Inline Alert](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1550)을 재사용했다. 예약 snapshot에 사진이 없어 프로필 사진이나 AI 매칭률은 새로 표시하지 않는다.

## 레이아웃·데이터 표시

- 상단 상태 표시줄, 가운데 `예약 상세` Header와 44px 뒤로가기 터치 영역을 둔다. Header의 뒤로가기는 **항상 `/bookings`**로 이동한다. 직접 링크로 들어와도 브라우저 방문 기록에 의존하지 않는다.
- 본문은 x=20, y=108, 너비 350, 높이 636px인 세로 스크롤 영역이다. 하단 100px Footer는 고정이다. 긴 메모에서는 본문만 스크롤되고 마지막 액션까지 도달하도록 끝에 24px 여백을 둔다.
- 본문 상단은 읽기 전용 상태 Badge, `김민준 선생님과의 레슨` 제목, 상태별 설명이다. 이후 정보 카드, 메모 카드, 조건에 맞는 `예약 관리` 액션 순서다. 350px 카드, 20px radius, 흰 배경, 기존 1px border, 16px 내부 여백을 사용한다. 새 그림자나 컬러 체계는 없다.
- Footer의 시작 전 예정 상태 Primary `예약 수정`은 x=20, y=756, 350×56이다. 그 외 조회된 상태와 없는 ID·오류는 Secondary `예약 목록으로`, 초기화 중에는 `예약 확인 중` Disabled 상태다. Footer는 y=744~844에 고정된다.
- 날짜·시간은 Figma의 고정 예시가 아닌 실제 예약값을 `Asia/Seoul` 기준으로 계산한다. 레슨 종료 시각은 `startTime + snapshot.durationMinutes`다. 상태의 `진행 중`·`종료`도 서울 시각에서 파생하며 저장된 `status`를 임의 변경하지 않는다.

| 화면 항목 | 값의 원천·규칙 |
|---|---|
| 강사 | `snapshot.instructorName`; 호칭 `선생님`은 중복 추가하지 않음 |
| 악기 | `snapshot.instrumentLabel` · `snapshot.durationMinutes`분 |
| 장르 | `snapshot.genres`를 카탈로그의 장르 레이블로 표시, 순서 유지. 예: `Rock · Blues` |
| 날짜 | `booking.date`의 서울 달력 날짜·요일 |
| 시간 | `startTime`과 계산한 종료 시각, `HH:mm–HH:mm` |
| 공간 | `snapshot.studioName` · `snapshot.roomName`; 현재 카탈로그 값으로 과거 기록을 덮지 않음 |
| 메모 | `booking.memo`의 텍스트·줄바꿈 그대로 표시; HTML 해석 안 함 |
| 상태 | 2단계 Badge의 Scheduled/InProgress/Ended/Cancelled |

정보 카드 텍스트 속성은 `Instructor`, `Instrument`, `Genres`, `Date`, `Time`, `Space`, 메모 카드 속성은 `Memo`다. 긴 강사명·공간명·장르명은 상세에서 줄바꿈하여 **전체값**을 보이고 카드 높이를 늘린다. 날짜·시간·상태를 생략하지 않는다. 메모는 최대 500 Unicode code point의 저장값을 `white-space: pre-wrap`처럼 표시하고 긴 단어도 컨테이너 밖으로 넘치지 않게 한다. 본문을 고정 높이 텍스트 박스로 잘라서는 안 된다.

### 선택 값이 없거나 저장 데이터가 잘못된 경우

`memo`는 유일한 선택 입력 필드다. 정상화된 빈 문자열 `""`이면 메모 카드는 유지하고 `작성한 메모가 없어요.`를 muted 색상으로 표시한다. 작성 시점의 선택 입력이 없다는 이유로 빈 카드를 숨기거나 가짜 내용을 만들지 않는다. 누락된 `memo` 속성은 v1 스키마 손상이므로 임의로 빈 문자열로 보정하지 않는다.

`snapshot.instructorName`, 악기, 장르 배열, 공간, 날짜·시간, 상태 같은 **필수 저장 필드가 누락·손상되면** 정보 카드 일부를 `미정`으로 채우지 않는다. 저장소 검증이 `CORRUPT_DATA`를 반환하고 조회 실패 화면을 보여야 한다. 카탈로그에서 과거의 강사·공간 ID가 사라졌더라도 저장된 snapshot이 유효하면 정상 상세를 보여준다. 장비 목록이 빈 배열인 경우에는 이 화면에 별도 장비 행을 만들지 않는다.

## 상태별 액션 조건

| 예약 상태·서울 시각 | 상태 Badge | Footer | `예약 관리` 영역 |
|---|---|---|---|
| `scheduled`, 시작 전 | 예정 | Primary `예약 수정` | Secondary `예약 취소` + `레슨 시작 전까지 취소할 수 있어요.` |
| `scheduled`, 시작 ≤ 현재 < 종료 | 진행 중 | Secondary `예약 목록으로` | 수정·취소·삭제 액션 없음 |
| `scheduled`, 종료 ≤ 현재 | 종료 | Secondary `예약 목록으로` | Secondary `예약 기록 삭제` + 복구 불가 안내 |
| `cancelled` | 취소됨 | Secondary `예약 목록으로` | Secondary `예약 기록 삭제` + 복구 불가 안내 |

취소·삭제는 본문의 메모 아래 `예약 관리` 영역에, 수정은 고정 Footer에 둔다. 허용되지 않은 액션은 Disabled 버튼으로 남기지 않고 **영역에서 제거**한다. 삭제는 취소됨 또는 시간이 종료된 예약에서만 보이고, 시작 전 예정 예약에서는 먼저 취소해야 한다. 취소는 기록을 유지하는 상태 변경이며 삭제는 기록 제거다.

`예약 수정`의 논리 목적지는 `/bookings/[id]/edit`다. 실제 정적 URL은 6단계에서 같은 방식으로 매핑하되, 해당 화면이 구현되기 전에는 404로 보내는 활성 버튼을 노출하지 않는다. `예약 취소`와 `예약 기록 삭제`는 확인 절차의 **진입점**이며 눌렀다고 바로 `cancelBooking`/`deleteBooking`을 실행하지 않는다. 공통 Dialog 기본형은 2단계에 있으나, 최종 문구·포커스·처리/오류/성공 흐름은 7단계에서 확정한다. 4단계 코드에서 아직 확인 핸들러가 없다면 동작하지 않는 버튼을 노출하지 않고, 실제 구현 단계에 맞춰 연결한다. Figma에는 최종 배치를 보여주기 위해 표시했다.

## 로딩·없는 ID·조회 실패

1. 클라이언트 mount 후 URL의 `id` 쿼리를 읽고 `initialize()`를 기다린다. 유효한 ID에 대해 완료 뒤 `getBooking(id)`를 호출한다. 정적 HTML/SSR에서 `window`, 검색 쿼리나 LocalStorage를 직접 읽지 않는다. 그 전에는 빈 상세·없는 ID 상태를 잠깐 표시하지 않는다. 로딩 본문은 `aria-busy=true`와 `role=status`로 안내한다.
2. UUID 형식이 잘못됐거나 저장소에 ID가 없어서 `NOT_FOUND`면 `예약을 찾을 수 없어요` 화면을 보여준다. Header 뒤로가기와 Footer `예약 목록으로` 모두 `/bookings`로 이동한다.
3. `STORAGE_UNAVAILABLE`, `CORRUPT_DATA`, `UNSUPPORTED_VERSION`, 그 외 읽기 실패는 **조회 실패**로 분리한다. 기존 데이터는 덮어쓰거나 지우지 않는다. 오류 Inline Alert의 구체 문구는 [1단계 오류 계약](../data-contract.md#오류-메시지-기본값)에 맞춰 교체한다.
4. `다시 시도`는 `getBooking(id)`를 읽기 재시도하고, 저장소 초기화가 실패했다면 안전한 `initialize()` 재호출 후 조회한다. 실패가 지속되면 오류 화면을 유지하고, 성공하면 해당 상세로 전환한다. 오류를 `NOT_FOUND`로 바꾸지 않는다.
5. 조회 실패·없는 ID·로딩 상태에는 수정·취소·삭제 액션과 임의 예약 데이터가 나타나지 않는다. `예약 목록으로`는 실패 상태에서도 사용할 수 있다.

모든 링크·버튼은 키보드 Tab으로 접근하고 Enter/Space로 실행한다. 포커스 링은 2단계 기준을 따른다. 상태 Badge와 정보 행은 읽기 전용이다. 상세 제목과 상태를 스크린 리더가 읽을 수 있도록 한다.

## Claude 구현 인계와 완료 조건

실제 앱 프로젝트 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`의 `AGENTS.md`, `CLAUDE.md`, `next.config.ts`, `lib/bookings/routes.ts`를 읽었다. 그 프로젝트는 `output: 'export'`이며 1~3단계 Claude 구현 기록이 [progress](../progress.md)에 있다. 이 단계에서 앱 코드는 수정하지 않았다. 이 문서는 현재 디자인 작업 폴더에 저장돼 있으므로 Claude에게 전달할 때 실제 앱 프로젝트의 `design/` 문서와 비교·병합해야 한다.

> `design/data-contract.md`, `design/steps/01-foundation.md`부터 `04-booking-detail.md`까지 읽고 ID별 예약 상세를 구현해줘. 현재 `output: 'export'`를 유지하고 정적 페이지 `/bookings/detail?id={UUID}`로 제공해줘. `lib/bookings/routes.ts`의 `bookingDetailHref`를 이 URL로 바꿔 기존 목록 카드도 실제 상세를 열게 해줘. Figma의 정상·메모 없음·긴 메모·취소됨·없는 ID·초기화·조회 실패 프레임을 기준으로 기존 공통 UI를 재사용해줘. 클라이언트에서 ID를 읽고 `getBooking(id)` 결과의 snapshot·서울 시각·파생 상태·메모를 표시하며 `NOT_FOUND`와 저장소 오류를 구분해줘. 목록으로는 항상 `/bookings`로 이동해줘. 수정·취소·삭제는 조건부 배치를 구현하되 목적지/확인 핸들러가 아직 없다면 작동하지 않는 버튼을 노출하지 말고 다음 단계에서 활성화해줘. 확인 없이 데이터 함수를 실행하지 마. Dialog 최종 동작은 7단계에 남겨줘. 변경 파일·검증 결과를 progress에 기록해줘.`

완료 조건:

1. 390×844 기준 정보 카드·메모·Footer가 Figma와 일치하고 기존 홈·목록에 회귀가 없다.
2. 정상 예약의 강사·악기·장르·날짜·시간·공간·메모·상태가 저장된 snapshot 및 서울 시각과 일치한다. 긴 문자열과 500자 메모를 자르지 않고 스크롤로 끝까지 볼 수 있다.
3. 빈 메모는 안내 문구, 필수 필드 손상은 조회 실패, 없는 ID는 없는 ID 화면으로 구분한다.
4. 상태·시간에 따른 수정·취소·삭제 표시 조건이 표와 일치한다. 구현 전인 목적지는 활성 404 버튼으로 남기지 않는다. 목록 이동은 `/bookings`로 가고, 확인 전 취소·삭제가 실행되지 않는다. 목록 카드의 `bookingDetailHref(id)`는 `/bookings/detail?id={UUID}`를 열어 새로고침해도 같은 ID를 읽는다.
5. 초기화 중 데이터 화면이 깜빡이지 않으며 저장소 읽기 실패는 데이터 보존·재시도 UI로 처리한다. 키보드 접근과 포커스가 가능하다.
6. 실제 앱 프로젝트에서 실행 검증 결과를 기록한다. Supabase·새 서버 저장소는 추가하지 않는다.

## Figma 검수

- 7개 프레임을 390×844 스크린샷으로 검수했다. 없는 ID 화면은 노드 자체 렌더링으로 Header·Footer까지 재확인했다.
- 모든 텍스트의 폰트는 Noto Sans KR, 콘텐츠는 편집 가능한 텍스트·카드·Badge·버튼 인스턴스다. 화면 전체 래스터 이미지는 없다.
- 긴 메모 viewport는 `VERTICAL` 스크롤·클립 350×636, 내부 콘텐츠 871px이며 Footer y=744에 고정된다. 기본 상세의 내부 콘텐츠는 598px으로 화면 안에 들어온다.
- 기존 홈 `23:67`과 예약 목록 `283:1588`은 수정하지 않았다.
