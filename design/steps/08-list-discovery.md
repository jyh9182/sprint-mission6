# 8/10단계 — 예약 목록 탐색

작성일: 2026-11-12 · Codex 디자인·UX 명세 / Claude 앱 구현

## 범위와 Figma

기존 `/bookings`의 검색·상태 필터·정렬·페이지 탐색을 확장한다. 390×844 기준이며 [3단계 목록](03-booking-list.md)의 Header, Primary Button, Card / LessonBooking, Bottom Navigation과 [2단계 공통 필드](02-components.md)의 입력 스타일을 유지했다. 원본 홈과 기존 목록 프레임은 수정하지 않았다. 예약은 계속 `lessonconnect:bookings:v1`의 LocalStorage 데이터만 사용한다.

| 상태 | Figma | 확인할 내용 |
|---|---|---|
| 기본, 페이지 탐색 | [19_Booking_List_Discovery_Default](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=302-2781) | 전체 12건 예시, 날짜순, 1/3, 이전 비활성·다음 활성 |
| 조건 적용 | [19_Booking_List_Discovery_Filtered](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=302-2896) | `기타` 검색·예정·최근 생성순, 결과 3건, 선택 칩·초기화 |
| 결과 없음 | [19_Booking_List_Discovery_No_Results](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=302-3007) | 조건 적용 후 0건, 원인 안내·조건 초기화 |

새로 필요한 작은 상태 칩만 [Default](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=302-2777)와 [Selected](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=302-2779) 컴포넌트로 만들었다. 화면에는 인스턴스를 사용한다. 카드·헤더·CTA·하단 내비게이션은 기존 인스턴스다. 검색 컨트롤은 기존 Input의 흰 surface, 1px 중립 stroke, 14px radius, Noto Sans KR을 따른다. 390px 폭의 좌우 여백은 20px이며 화면 하단 내비게이션은 y=767에 고정한다. 목록 viewport는 350×238px, 세로 스크롤·클립이다. 페이지 컨트롤은 내비게이션 위에 두며 페이지가 둘 이상일 때만 표시한다. 3단계의 초기화·읽기 실패·진짜 예약 0건 상태는 그대로 재사용한다.

Figma의 12건·3건 및 카드 내용은 레이아웃 예시다. 실제 수치·카드·페이지 수는 LocalStorage 조회 결과에서 계산한다. 기본 화면의 두 번째 카드가 viewport 아래로 이어지는 것은 스크롤 가능함을 드러내기 위한 표현이다.

## 데이터 처리 순서

`getBookings()`의 검증된 목록을 읽은 뒤, 현재 서울 시각 `now`에 대해 각 예약의 `getBookingPhase`를 계산한다. 다음 순서를 고정한다.

1. 검색: `snapshot.instructorName`, `snapshot.instrumentLabel`, `snapshot.studioName`, `snapshot.roomName` 및 `studioName + ' ' + roomName`에 부분 문자열 일치. 현재 카탈로그 이름이 아니라 예약 당시 snapshot을 검색한다. 메모·장르·ID는 검색 대상에서 제외한다.
2. 상태: `all`은 전체, 나머지는 파생 표시 상태 `upcoming | in-progress | ended | cancelled` 하나와 일치. UI 표기는 전체·예정·진행 중·종료·취소됨. `scheduled`만으로 예정 필터를 만들지 않는다.
3. 정렬: `date-asc`는 서울 레슨 시작 시각 오름차순, `created-desc`는 `createdAt` 내림차순. 동률은 `id` 오름차순으로 안정화한다. 기본값은 기존 목록의 날짜순이다. 취소 예약도 레슨 예정 날짜 기준으로 정렬한다.
4. 페이지: 필터된 전체 결과 수를 먼저 계산한 뒤 5개씩 자른다. 페이지는 1부터 시작하며 `pageCount=max(1,ceil(resultCount/5))`다. 0건에서는 페이지 컨트롤을 숨긴다.

검색 비교는 입력과 대상 모두 Unicode NFC, 앞뒤 공백 제거, 연속 공백 하나로 축약, 영문 소문자화 후 수행한다. 검색어는 최대 80 Unicode code point다. UI `maxLength`는 UTF-16 기준과 다를 수 있으므로 코드 포인트 기준의 길이 제한도 적용한다. 검색 결과 수는 **현재 페이지 수가 아닌 조건을 통과한 전체 수**다. `예약 0건`은 저장된 예약 자체가 0건일 때만 사용한다. 저장된 예약이 있으나 조건에 맞는 행이 0건이면 `검색 결과가 없어요`를 사용한다.

시간 경과로 예정→진행 중→종료가 바뀌거나 다른 탭에서 LocalStorage가 바뀌면 현재 조건을 같은 순서로 다시 적용한다. 사용자 조작 없이 결과가 변해 현재 페이지가 범위를 벗어나면 마지막 유효 페이지로 URL을 `replace`한다. 예약 삭제 후에도 이 규칙을 적용한다. 읽기 오류를 검색 결과 0건으로 표시하지 않는다.

## URL 쿼리 계약

실제 목록 URL은 정적 export와 호환되는 `/bookings`다. 검색·필터 상태는 LocalStorage 예약 envelope에 저장하지 않고 URL만 단일 출처로 사용한다.

| 파라미터 | 허용값·기본값 | 정규 URL 예 |
|---|---|---|
| `q` | 0~80 code point, 빈 문자열 기본 | `q=%EA%B8%B0%ED%83%80` |
| `status` | `all` 기본, `upcoming`, `in-progress`, `ended`, `cancelled` | `status=upcoming` |
| `sort` | `date-asc` 기본, `created-desc` | `sort=created-desc` |
| `page` | 1부터 시작하는 정수, 기본 1 | `page=2` |

기본값은 URL에서 생략한다. 순서는 `q → status → sort → page`, 인코딩은 `URLSearchParams`로 통일한다. 예: `/bookings?q=%EA%B8%B0%ED%83%80&status=upcoming&sort=created-desc&page=2`. 알 수 없는 파라미터·중복 파라미터·허용되지 않은 enum·음수/소수/지수형·비정상적으로 긴 값은 무시하고 정규 URL로 `replace`한다. 범위를 벗어난 양의 정수 페이지는 데이터 조회 후 마지막 유효 페이지로 조정한다. 검색어 정규화로 빈 값이 되면 `q`를 제거한다. URL 파서는 throw하지 않아야 한다.

검색 입력은 즉시 화면에 표시하되 결과/URL 반영은 입력이 멈춘 뒤 300ms에 `replace`한다. Enter는 즉시 반영한다. 돋보기는 장식이고, 입력 내 ×는 검색어만 즉시 지운다. 상태 칩·정렬 변경과 `조건 초기화`는 `push`하여 브라우저 뒤로 가기에서 직전 조건을 되살린다. 페이지 이동도 `push`한다. **검색·상태·정렬 중 하나라도 바뀌면 `page=1`로 초기화**하고 목록 viewport를 맨 위로 이동한다. 페이지 이동 시에도 맨 위로 이동한다. `조건 초기화`는 `q/status/sort/page`를 모두 기본값으로 돌려 `/bookings`로 이동한다. 이미 기본 상태라면 초기화 링크를 표시하지 않는다.

## 상세·수정·삭제에서 목록 복귀

카드 링크는 현 목록의 유효한 네 파라미터를 상세 URL에 보존한다. 예: `/bookings/detail?id={UUID}&q=...&status=upcoming&sort=created-desc&page=2`. 정적 export의 `id` 경로 규칙은 [4단계](04-booking-detail.md) 그대로다. 상세의 `목록으로 돌아가기`는 허용된 목록 파라미터만 읽어 정규화된 `/bookings?...`로 이동한다. 직접 URL로 상세에 온 경우에는 `/bookings`로 간다. `returnTo` 같은 임의 URL을 받지 않는다. `bookingDetailHref`는 기존 한 곳에서 쿼리 컨텍스트를 **선택적으로** 받도록 확장하고, 기존 인자 하나로 부르는 생성·수정 완료 흐름은 계속 동작해야 한다.

상세→수정→상세를 거쳐도 목록 컨텍스트를 유지한다. 취소 후 상세를 갱신할 때도 컨텍스트를 유지한다. 삭제 성공 시 [7단계의 일회성 성공 알림](07-cancel-delete.md)을 유지하면서 원래 목록 조건으로 이동한다. 삭제로 결과가 0건이 되거나 마지막 페이지가 사라지면 위 결과 없음·페이지 보정 규칙을 적용한다. 상세의 `id`와 목록의 `page`를 혼동하지 않는다.

스크롤 복원은 현재 앱의 `lessonconnect:bookings:list-scroll` sessionStorage 메커니즘을 확장한다. 정규화된 `q/status/sort/page` 조합별 키로 저장하고, 카드→상세→목록 복귀 시 그 키의 위치만 복원한다. 조건이나 페이지를 새로 바꾸는 동작은 맨 위에서 시작한다. 값을 읽을 수 없으면 0으로 처리하며 예약 데이터 읽기와 분리한다. 다른 조건의 이전 스크롤 위치를 적용하지 않는다.

## 모바일 동작·접근성

- 검색 필드는 보이는 `예약 검색` 레이블, `강사, 악기, 공간 검색` placeholder, `type=search`, 적절한 `search` 입력 모드, × 버튼의 `검색어 지우기` 접근성 이름을 가진다. 빈 검색어에는 ×를 숨긴다. Escape를 누르면 검색어를 지우고, 빈 상태의 Escape는 아무것도 하지 않는다.
- 상태는 한 번에 하나만 선택한다. 칩은 44px 이상 터치 영역을 확보하고, `aria-pressed`를 갖는 버튼 그룹(`예약 상태 필터`)으로 만든다. 선택 상태는 검정 배경·흰 텍스트이며 색만으로 구별하지 않도록 `aria-pressed`도 제공한다. 가로 390px에서 다섯 칩이 한 줄에 들어간다.
- 정렬은 보이는 `정렬` 또는 숨김 레이블을 가진 네이티브 `<select>`를 권장한다. 레슨 날짜순·최근 생성순 두 값만 제공하고 키보드로 변경할 수 있어야 한다.
- 결과 수는 `aria-live=polite`로 발표하되 입력 중 매 키 입력마다 발표하지 않는다. 적용 조건 요약은 최대 한 줄로 줄이고 전체 조건은 접근 가능한 텍스트로 제공한다. 조건 초기화는 텍스트 버튼이다.
- 페이지 영역은 `nav aria-label="예약 목록 페이지"`, `이전 페이지`/`다음 페이지` 버튼, 현재 `1 / 3` 텍스트로 구성한다. 첫/마지막 페이지의 해당 버튼은 비활성이고 1페이지만 있으면 영역 자체를 숨긴다.
- 목록 카드는 기존 전체 클릭 링크·긴 이름 2줄 축약·접근 가능한 전체 이름 규칙을 유지한다. 카드 안에 별도 필터/삭제 버튼을 넣지 않는다. 하단 내비게이션은 목록 viewport 스크롤 중에도 고정한다.
- 초기화/읽기 실패 중에는 검색·필터·정렬·페이지를 사용할 수 없게 하고 URL은 유지한다. 조회 성공 후 URL 조건을 적용한다. 상단의 `새 레슨 예약` CTA와 삭제 성공 알림의 기존 동작·포커스 규칙을 유지한다.

## Claude 인계·완료 조건

앱 프로젝트 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`의 `AGENTS.md`, `CLAUDE.md`를 먼저 따르고 1~7단계 구현을 보존한다. `booking-list-screen.tsx`, `booking-card.tsx`, `booking-detail-screen.tsx`, 수정 화면 및 `lib/bookings/routes.ts`의 URL 연결을 점검한다. 검색·필터·정렬·페이지는 조회 결과의 **파생 데이터**로 구현하며 저장소 `BookingRepository`와 LocalStorage 스키마를 바꾸지 않는다. 기존 `Button`, `Input`, `Select`, `StatusBadge`, `BottomNav`, `BookingCard`를 재사용한다. 필터 칩은 이 단계의 두 Figma 상태를 따르고 다른 화면에 불필요한 새 스타일을 확산하지 않는다.

완료 판단:

1. 강사명·악기·공간 검색, 네 가지 상태 필터, 두 정렬, 5개 단위 페이지가 실제 LocalStorage 목록에서 작동한다. 검색→상태→정렬→페이지 순서와 동률 규칙을 확인한다.
2. 모든 조작이 위 URL 규칙과 동기화된다. 직접 URL·새로고침·브라우저 뒤로/앞으로, 잘못된 쿼리와 페이지 범위 보정이 안전하다. 조건 변경 시 1페이지와 스크롤 맨 위로 간다.
3. 상세/수정/취소/삭제에서 목록 조건이 유지되고 삭제 후 페이지 보정·일회성 성공 알림이 작동한다. 직접 상세 진입은 기본 목록으로 돌아간다.
4. 저장 예약 0건과 검색 결과 0건, 초기화 중과 읽기 실패가 각각 올바른 상태로 보인다. 필터 초기화는 네 조건을 모두 기본값으로 돌린다.
5. 390×844에서 검색·칩·정렬·결과 수·카드·페이지·고정 하단 내비게이션이 겹치지 않는다. 키보드·스크린리더 레이블·포커스·긴 텍스트를 확인한다.
6. 검색·페이지용 URL 및 sessionStorage 상태가 `lessonconnect:bookings:v1`의 데이터에 섞이지 않는다. 기존 1~7단계 기능과 테스트를 유지하고 `design/progress.md`의 Claude 기록은 지우지 않는다.

Codex는 이번 단계에서 앱 코드를 수정하거나 배포하지 않았다. Figma 세 상태를 스크린샷으로 시각 검수했고 프레임 390×844, 기존 컴포넌트 인스턴스, viewport 세로 스크롤, 하단 내비게이션 고정을 확인했다.
