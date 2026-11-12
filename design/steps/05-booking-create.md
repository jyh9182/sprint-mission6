# 5/10단계 — 예약 생성 폼

작성일: 2026-11-12 · Codex 디자인·UX 명세 / Claude 앱 구현

## 범위와 설계 결정

대상은 정적 경로 `/bookings/new`, 화면 기준은 390×844이다. [예약 데이터 계약](../data-contract.md)의 `BookingInput`과 기존 LocalStorage repository를 그대로 사용한다. 기존 홈·목록·상세와 09~12 예약 제품 화면은 수정하지 않았다. 이번 화면은 **한 화면에서 강사 상품·일정·공간·메모를 입력하는 스크롤 폼**이다. 1단계의 일정 → 공간 → 확인 순서와 2단계의 기존 일정 UI 우선 규칙은 이 경로의 **표현·라우팅에 한해** 이번 최신 요청으로 대체한다. 저장 모델, 검증, 확인 체크와 실제 가용성 비보장 규칙은 유지한다. 과거 09~12 화면은 시각 참고 자료이며 `/bookings/new`에서 별도 중간 경로로 연결하지 않는다.

Figma 파일: [LessonConnectAI App Design](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=0-1), Page 1. 기존 [공통 UI](02-components.md#figma-컴포넌트와-재사용-방법)의 Header, Primary/Secondary, Input, Select, Textarea, Inline Alert, Confirmation Dialog와 확인 체크박스를 인스턴스로 재사용했다. 새 컬러·글꼴·아이콘·그림자는 만들지 않았다.

| 상태 | Figma 프레임 | 검수 목적 |
|---|---|---|
| 진입·미선택 | [Initial](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-1950) | 상품 미선택, 종속 필드 비활성, 제출 비활성 |
| 유효한 입력 상단 | [Ready](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2020) | 상품·악기·장르·길이·날짜·시각·공간 |
| 유효한 입력 하단 | [Ready Scrolled](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2114) | 공간·메모·확인 체크·안내·고정 CTA |
| 검증 오류 | [Errors](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2208) | 과거 날짜, 카탈로그 외 시각, 공간 누락 |
| 저장 중 | [Saving](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2303) | 입력 유지, Loading CTA |
| 저장 실패 | [Save Error](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2399) | Inline Alert, 재시도 가능, 입력 유지 |
| 입력 중 이탈 | [Leave Confirm](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2500) | 계속 작성 / 나가기 Dialog |
| 저장 성공 목적지 | [Success Detail](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2647) | 상세에서 성공 Inline Alert 표시 |

다음 수정 화면에서도 쓸 [Booking / Form / Fields 마스터](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2603)를 별도로 뒀다. 내부 입력은 기존 필드 인스턴스다. 앱에서는 `BookingForm`을 `mode: 'create' | 'edit'`와 초기값·제출 콜백으로 재사용한다. Figma 화면의 예시 날짜 `2026-11-19`는 시각 견본일 뿐, 런타임 기본값·가용 날짜가 아니다.

Success Detail은 5단계 구현 시점에 아직 없는 수정·취소 실행 버튼을 표시하지 않고 `예약 목록으로`만 제공한다. 수정 진입은 6단계, 취소 확인은 7단계에서 연결한다.

## 레이아웃과 입력 필드

- 상태 표시줄과 Header `새 레슨 예약`은 y=15/44, 본문은 x=20·y=108·350×636 세로 스크롤, Footer는 y=744·390×100 고정이다. Footer Primary는 350×56. 긴 레이블·오류·500자 메모에서 본문만 스크롤하며 Footer를 덮지 않는다.
- 필드 순서: 강사·레슨 상품 → 상품 요약(악기·장르·60분·예시 가격) → 날짜 → 시작 시간 → 레슨 공간 → 데모 가용성 안내 → 메모 → 예약 내용 확인 체크 → LocalStorage 안내. 정보 밀도를 낮추기 위해 상품에서 결정되는 **악기·장르·레슨 길이는 읽기 전용 요약**으로 보인다. 수정 가능한 독립 필드인 것처럼 만들지 않는다.
- 상품 미선택 시 날짜·시각·공간 컨트롤은 비활성화한다. Figma의 흐린 표현은 상태 예시다. 앱에서는 native `disabled`와 의존 안내를 함께 사용한다. 메모는 미리 쓸 수 있어도 저장 전 상품 선택이 필수다.
- 마스터의 20px 좌우 여백, Noto Sans KR, 흰 배경, warm surface `#F6F4F0`, ink `#0E0E0E`, 검정 Primary `#212121`, 14px 입력·버튼 radius, 16px 필드 간격을 유지한다. 오류는 기존 `#B42318` 토큰만 쓴다. 하단 내비게이션은 폼 집중과 고정 CTA 공간 확보를 위해 이 화면에 표시하지 않고, Header 뒤로가기를 제공한다.

| UI | 값·선택 규칙 | 필수·오류 |
|---|---|---|
| 강사 · 레슨 | 활성 `LessonOfferReference` + 활성 강사만. 옵션은 `강사명 · 악기`로 표시하고 상품 ID를 값으로 사용한다. 현재 fixture는 `offer-kim-guitar-60` 한 개뿐이다 | `offerId` 필수. 비활성/삭제된 선택은 유지해 성공 처리하지 않고 재선택 안내 |
| 악기·장르·길이 | 선택 상품의 `instrumentLabel`, `genres`, `durationMinutes=60` 읽기 전용. 장르 `Rock / Blues`. 가격은 `examplePriceKRW` **예시** | 별도 사용자가 입력하는 필드가 아니다. 상품 변경 즉시 함께 갱신 |
| 날짜 | native date 컨트롤을 기존 Input 시각으로 감싼다. 서울 기준 유효한 실제 날짜, 시작 시각과 결합해 미래여야 한다 | `date` 필수. 빈값, 형식/달력 오류, 과거·현재 시작은 오류 |
| 시작 시간 | `catalog.demoStartTimes` 중 하나. 현재 `18:00`, `19:00`, `20:00`, `21:00` | `startTime` 필수. 오늘 날짜일 때 지난 시각은 선택 불가하거나 저장 전 오류. `17:30` 등 카탈로그 외 값 거절 |
| 레슨 공간 | 선택 offer의 `allowedSpaceIds`에 속한 활성 공간만. fixture는 동탄 A/B/C 레슨실. 스튜디오·방 이름과 장비를 옵션에서 구별 | `spaceId` 필수. 상품 변경으로 허용 범위가 바뀌면 선택 해제 |
| 메모 | 선택, 줄바꿈 허용. UI에 현재 글자수/500 표시. 저장소는 앞뒤 공백 trim | 최대 500 Unicode code point. 초과 입력은 남겨 수정 가능하게 하고 오류 표시, 저장 차단 |
| 예약 내용 확인 | `acknowledged: true`를 제출 시에만 전달; 레코드에 저장하지 않음 | 미체크면 제출 불가. 체크를 법적 동의나 실제 강사·공간 확보로 설명하지 않음 |

날짜 또는 시각을 바꾸면 `date + startTime`을 `Asia/Seoul`로 다시 검증한다. 상품을 바꾸면 종속 **날짜·시간·공간을 지우고** 새 상품의 옵션을 보여준다. 이 초기화는 저장 전 사용자에게 명확히 보인다. 공간만 바꾸면 다른 필드 값은 유지한다. 카탈로그에 상품이 0개라면 Select를 억지로 채우지 않고 `선택할 수 있는 레슨이 없어요.`와 목록으로 이동을 보여준다. 기준 데이터는 코드의 읽기 전용 카탈로그이며 실제 가용성을 조회하지 않는다.

## 검증·오류 노출 시점

1. 최초 진입에는 빨간 오류를 띄우지 않는다. 사용자가 값을 바꾸고 해당 컨트롤을 떠난 뒤(`blur`) 오류를 검사하며, 제출을 시도하면 전체 필드를 검증한다. 이후 수정하는 순간 유효해진 해당 오류는 지운다.
2. CTA를 누르면 `offerId`, `date`, `startTime`, `spaceId`, `memo`, `acknowledged`를 검사하고 첫 오류 필드로 스크롤·포커스한다. 오류 컨트롤은 빨간 선, 해당 항목 아래 문구, `aria-invalid=true`, `aria-describedby` 연결을 사용한다. 선택 항목의 레이블을 포커스 가능한 입력과 연결한다.
3. 날짜·시간은 서울 현재 시각보다 **시작이 미래**인지 검사한다. 경계 시각에 저장 중 시간이 지나면 저장소 검증 결과가 최종이다. 실제 슬롯 확보를 의미하는 `예약 가능` 표시는 사용하지 않는다.
4. 동일 브라우저의 다른 `scheduled` 예약과 60분 구간이 겹치면 `LOCAL_TIME_CONFLICT`: `같은 시간에 저장된 레슨이 있어요. 다른 시간을 선택해주세요.`를 시작 시간 아래에 표시하고 해당 필드로 포커스한다. 이는 **사용자 로컬 기록 충돌**이며 강사나 공간의 실시간 일정 검증이 아니다.
5. `CONFLICT`는 다른 탭/화면 변경 안내를 Inline Alert로 표시하고 최신 예약을 재조회한 뒤 사용자가 내용을 검토해 재시도하게 한다. 오래된 `expectedRevision`으로 조용히 다시 쓰지 않는다. 비활성 상품·공간은 각 선택 필드 오류로 매핑한다.

| 사례 | 필드 문구 |
|---|---|
| 상품 미선택 | `강사와 레슨을 선택해주세요.` |
| 날짜 빈값 | `날짜를 선택해주세요.` |
| 과거/오늘의 지난 조합 | `미래의 날짜와 시작 시간을 선택해주세요.` |
| 유효하지 않은 날짜 | `올바른 날짜를 선택해주세요.` |
| 시각 빈값 또는 카탈로그 외 값 | `시작 시간을 선택해주세요.` / `선택할 수 없는 시간이에요. 다시 선택해주세요.` |
| 공간 미선택·허용되지 않은 공간 | `레슨 공간을 선택해주세요.` / `선택한 공간을 이용할 수 없어요. 다시 선택해주세요.` |
| 메모 초과 | `메모는 500자까지 입력할 수 있어요.` |
| 확인 체크 누락 | `예약 내용을 확인해주세요.` |

Figma Errors는 예시 여러 오류를 동시에 보여준다. 그 프레임의 `2026-11-11`, `17:30`은 특정 검증 예시이며 현재 날짜로 하드코딩하지 않는다. 네이티브 date picker와 select의 키보드 조작은 브라우저 기본 동작을 사용하고, Textarea Enter는 줄바꿈이다. Ctrl/Cmd+Enter 자동 제출은 하지 않는다.

## 저장·이동·이탈

1. 초기화 후 `getBookings()`의 최신 `revision`을 받는다. 브라우저 mount 전 LocalStorage를 읽지 않는다. 준비 중에는 폼 입력과 저장 액션을 막고 `예약 정보를 준비하고 있어요.`를 상태 영역에 표시한다. 초기화 실패는 빈 폼으로 성공한 것처럼 전환하지 않고 재시도를 제공한다.
2. 유효한 제출 시 같은 클릭·Enter가 두 번 들어와도 **한 번만** `createBooking(input, expectedRevision)`을 실행한다. 즉시 CTA를 Loading `저장 중…`으로 바꾸고 `aria-busy=true`, 재실행 차단을 적용한다. 폼 데이터는 화면에 유지한다. Loading은 실제 Promise 동안만 보이며 인위적 지연을 넣지 않는다.
3. `setItem` 성공을 반영한 `StoreResult.ok` 이후에만 반환된 `booking.id`로 `bookingDetailHref(id)`를 호출해 실제 URL `/bookings/detail?id={UUID}`로 이동한다. 목적지 상세에 성공 Inline Alert `예약을 저장했어요`를 **한 번** 보여준다. 쿼리나 로컬 저장 키에 성공 상태를 영구 저장하지 않는다. 필요하면 탭 내 navigation state/session state로 한 번 전달하고, 직접 상세 방문에는 숨긴다.
4. 실패하면 생성 페이지에 남고 필드 값·메모·스크롤 위치·확인 체크를 유지한다. Loading을 해제하고 원인별 Inline Alert를 보여준다. `QUOTA_EXCEEDED`: `저장 공간이 부족해요. 입력 내용은 유지했어요.`; `STORAGE_UNAVAILABLE`/`WRITE_FAILED`: `예약을 저장하지 못했어요. 입력 내용은 유지했어요. 다시 시도해주세요.` 실패 상태에서 버튼은 재시도 가능하다. 저장 실패를 성공 상세로 넘기지 않는다.
5. 수정 전 재사용: `BookingForm`은 `initialValues`, 읽기 전용 상품 요약, `catalog`, `mode`, `onSubmit`을 받으며, 생성 화면은 `createBooking`, 6단계 수정 화면은 `updateBooking`을 호출한다. 생성과 수정은 같은 필드 순서·검증 문구·종속 값 정리 규칙을 쓴다. 수정 화면의 기존 선택값은 snapshot과 카탈로그 현재 상태를 대조한다. 변경 전 `acknowledged`는 매번 새로 확인한다.
6. 아무것도 바꾸지 않았다면 Header 뒤로가기와 브라우저 뒤로가기는 `/bookings`로 바로 간다. 입력·선택·체크 등 **dirty** 상태에서 앱 내부 뒤로가기/이동은 Dialog `예약 작성을 그만둘까요?` / `작성 중인 내용은 저장되지 않아요.` / `계속 작성`·`나가기`를 연다. `계속 작성`은 폼·포커스 유지, `나가기`는 미저장 draft를 버리고 목록으로 이동한다. Dialog는 초점 트랩, Escape 닫기, 닫은 뒤 원래 컨트롤로 초점 복원을 따른다.
7. 브라우저 새로고침·탭 닫기 같은 페이지 이탈은 dirty 상태에서 브라우저의 native `beforeunload` 확인만 사용한다. 맞춤 Dialog 문구를 강제할 수 없으며, 사용자가 이탈하면 미저장 draft는 복원하지 않는다. 별도 draft LocalStorage 키를 만들지 않는다. 저장 중에는 UI 내 이동을 차단하고 완료/실패 결과 이후 이동한다.

`실제 예약 가능`, `공간 확보 완료`, `강사 확정` 같은 문구는 사용하지 않는다. UI 안내는 `표시된 일정·공간은 데모 선택 항목이며 실제 예약 가능 여부를 확인하지 않아요.`와 `이 기기의 이 브라우저에 예약 내용이 저장돼요.`다. 저장 성공은 **로컬 기록 성공**만 뜻한다.

## Claude 구현 인계와 완료 조건

실제 앱 프로젝트는 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`이다. Codex는 이 단계에서 앱 코드를 변경하지 않았다. 이 문서는 현재 디자인 작업 폴더에 있으므로 Claude 착수 전 실제 앱 `design/` 문서와 비교·병합한다. 기존 앱은 Next 정적 export이며 `lib/bookings/catalog.ts`에 현재 상품 1개/공간 3개/시각 4개, `lib/bookings/routes.ts`에 `NEW_BOOKING_HREF`와 `bookingDetailHref`가 있다. Claude는 실제 현재 코드를 다시 확인해야 한다.

> `design/data-contract.md`, `design/steps/02-components.md`부터 `05-booking-create.md`까지와 `design/progress.md`를 읽고 `/bookings/new` 생성 폼을 구현해줘. 기존 1~4단계 코드·UI를 재사용하고, 5단계의 단일 스크롤 폼 설계가 이전 3경로 생성 표현보다 최신임을 반영해줘. `BookingForm` 입력·검증을 6단계 수정에서 재사용 가능하게 분리해줘. 상품에서 악기·장르·60분을 읽기 전용으로 파생하고, 상품 변경 시 종속 날짜·시간·공간을 정리해줘. 서울 미래 시작·카탈로그 옵션·500자 메모·확인 체크를 검증해줘. `createBooking` 저장 성공 후 `bookingDetailHref(id)`로 이동하고 한 번만 성공 알림을 보여줘. 저장 중 중복 실행을 막고 실패 시 입력을 유지해줘. dirty 이탈 확인과 키보드·aria 동작을 구현해줘. 실제 강사·공간 가용성을 확정하는 문구를 쓰지 말고 Supabase/서버 저장소를 추가하지 마. 변경 파일·검증 결과를 progress의 Claude 5단계 기록에 남겨줘.

완료 조건:

1. 390×844에서 폼 전체가 스크롤되고 고정 CTA·Header가 유지된다. 필드가 오류/긴 문구에서도 겹치지 않는다. 홈·목록·상세에 회귀가 없다.
2. 상품 미선택, 정상 입력, 필수값 누락, 과거·카탈로그 외 시각, 비허용 공간, 메모 501 code point, 체크 누락 각각 검증된다. 첫 오류에 포커스하고 입력을 수정하면 오류가 사라진다.
3. 상품/공간/시각 옵션은 현재 읽기 전용 카탈로그에서만 오며, 악기·장르·60분이 상품과 일치한다. 실제 가용성을 주장하지 않는다.
4. 중복 클릭·Enter로 예약이 2건 생기지 않는다. 저장 성공 후 반환 ID 상세로 이동하고 한 번만 성공 알림을 보여준다. 실패/용량 초과/접근 차단은 상세 이동 없이 입력을 유지한다.
5. dirty/clean 뒤로가기와 새로고침 이탈이 규칙대로 동작한다. 6단계 수정에서 폼 컴포넌트와 필드 검증을 재사용할 수 있다.
6. 실제 브라우저에서 LocalStorage 새로고침 지속, 서울 시각 경계, 키보드·포커스·`aria-*`를 검증하고 결과를 기록한다.

## Figma 검수

8개 390×844 프레임을 만들었다. Initial·Ready·Ready Scrolled·Errors·Saving·Save Error·Leave Confirm·Success Detail을 스크린샷으로 확인했다. 첫 렌더에서 폼 Auto Layout 높이가 1px로 잘려 보인 문제를 수정하고 다시 검수했다. 본문 viewport는 350×636, 콘텐츠는 1040px, Footer는 y=744에 고정이다. 오류 입력의 빨간 선과 문구, Loading CTA, 이탈 Dialog의 `계속 작성`/`나가기`, 성공 상세의 안내를 확인했다. Figma는 시각·속성 명세이고 저장·포커스·native date 동작은 Claude의 앱 검증 대상이다.
