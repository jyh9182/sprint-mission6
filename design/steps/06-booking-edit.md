# 6/10단계 — 예약 수정 UX

작성일: 2026-11-12 · Codex 디자인·동작 명세 / Claude 앱 구현

## 범위와 기존 자산

논리 화면은 `/bookings/[id]/edit`이다. 현재 앱은 Next.js 정적 export여서 LocalStorage에서 생성된 UUID별 HTML을 빌드할 수 없다. 실제 URL은 **`/bookings/edit?id={UUID}`**로 매핑하고 `bookingEditHref(id)`를 `lib/bookings/routes.ts`에 둔다. 상세는 기존 `bookingDetailHref(id)`의 `/bookings/detail?id={UUID}`를 유지한다. `id` 쿼리 이름은 기존 `BOOKING_ID_PARAM`을 재사용한다. 서버·Supabase를 추가하지 않는다.

[5단계 생성 폼](05-booking-create.md)의 필드 순서·입력 상태·Noto Sans KR·색·간격·라운드와 [Form / Fields 마스터](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2603)를 그대로 사용했다. Figma 화면은 기존 생성·상세 프레임의 편집 가능한 레이어와 컴포넌트 인스턴스를 복제해 **수정에서 달라지는 상태만** 나타낸다. 기존 홈·생성·상세 화면은 수정하지 않았다. 실제 앱에는 이미 `BookingForm(mode='edit', initialValues, onSubmit, submitLabel)`, `validateBookingForm`, `mapSaveError`, `useLeaveGuard`, `ConfirmDialog`, `setBookingFlash(id,'update')`가 있다. 이 계약에 맞춰 화면 연결과 변경 여부만 확장한다.

| 수정 상태 | Figma 링크 | 핵심 차이 |
|---|---|---|
| 기존 값·변경 없음 | [Edit Unchanged](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=295-2272) | 기존값 표시, 미확인 체크, `변경사항 저장` 비활성 |
| 편집·확인 완료 | [Edit Changed](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=295-2355) | 메모 변경, 확인 체크, `수정 취소`와 저장 CTA |
| 저장 실패 | [Edit Save Error](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=295-2433) | 오류 Inline Alert, 편집값 유지, 재시도 |
| 미저장 이탈 | [Edit Leave Confirm](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=295-2518) | `계속 작성` / `나가기` Dialog |
| 없는 ID | [Edit Not Found](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=295-2605) | 편집 폼 없음, 목록 이동 |
| 수정 불가 | [Edit Unavailable](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=295-2637) | 시작 전 예정이 아니면 편집 폼 없음, 상세 이동 |
| 저장 성공 목적지 | [Edit Success Detail](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=295-2670) | 상세에 `예약을 수정했어요` 1회 표시 |

390×844 프레임, 본문 x=20/y=108/350×636 세로 스크롤, 고정 Footer y=744·높이 100, 350×56 CTA를 생성 폼과 동일하게 유지한다. 수정 화면에는 Bottom Navigation을 넣지 않는다. 스크롤 하단의 Secondary `수정 취소`와 Header 뒤로가기 모두 같은 이탈 규칙을 사용한다. Figma의 `2026-11-19`, 김민준·기타·동탄 A룸은 **예시 데이터**이며 실제 수정 시 해당 예약의 값을 표시한다.

## 진입·기존 값 표시

1. 상세의 시작 전 예정 예약에만 `예약 수정` Primary를 노출하고 `bookingEditHref(id)`로 이동한다. 7단계에서 연결할 취소·삭제 액션은 이번 범위에 넣지 않는다. 직접 URL 진입도 같은 자격 검사를 거친다.
2. mount 후 URL의 `id`를 읽고 `initialize()` → `getBooking(id)`를 완료할 때까지 기존 값을 추측해 빈 폼으로 보이지 않는다. 4단계의 초기화·조회 실패 패턴을 재사용한다. 잘못된 UUID/없는 ID는 `NOT_FOUND`, 저장소 손상·접근 실패는 별도 읽기 실패이며 데이터를 덮어쓰지 않는다.
3. 정상 예약은 `offerId`, `date`, `startTime`, `spaceId`, `memo`를 **저장된 예약값**으로 채운다. `acknowledged`는 저장 필드가 아니므로 매번 `false`로 시작한다. 악기·장르·60분·예시 가격은 현재 선택 가능한 offer의 읽기 전용 요약으로 보여주고, 과거 예약의 표시값이 현재 카탈로그와 다를 때 상세에서는 `snapshot`을 유지한다. 수정 폼에서 과거 값을 현재값으로 조용히 대체하지 않는다.
4. 현재 카탈로그에서 기존 offer/space/startTime이 사라지거나 비활성화되면 기존 ID/값은 **비활성 옵션**으로 보존해 사용자가 무엇을 수정 중인지 알 수 있게 한다. 저장 전에는 유효한 활성 옵션으로 재선택하게 하고 필드 오류를 준다. 현재 카탈로그의 다른 강사 상품이 없는 경우 가짜 선택지를 만들지 않는다.
5. 현재 서울 시각으로 `scheduled`이고 레슨 **시작 전**인 예약만 수정할 수 있다. `cancelled`, 진행 중, 종료된 `scheduled`는 `수정할 수 없어요` 상태를 표시하고 편집 컨트롤·저장 버튼을 노출하지 않는다. 유효 ID가 있으면 `예약 상세로`를 제공한다. 화면을 열어둔 사이 시작 시각이 지나면 CTA를 막고 `이 예약은 이제 수정할 수 없어요.`를 안내한다. 저장소의 `INVALID_TRANSITION`이 최종 판정이다.

| 항목 | 수정 가능 여부 | 규칙 |
|---|---|---|
| 강사·레슨 상품 | 가능 | 현재 활성 offer 중 선택. 변경 시 **날짜·시작 시간·공간을 초기화**, 메모는 유지. 악기·장르·60분·예시 가격은 선택 상품에 따라 파생 |
| 날짜·시작 시간 | 가능 | 서울 시각의 미래 시작, 실제 달력 날짜, `demoStartTimes` 중 하나. 자신의 현재 예약은 로컬 시간 중복 검사에서 제외 |
| 레슨 공간 | 가능 | 선택 offer의 허용·활성 공간만. 공간 변경은 다른 값 보존 |
| 메모 | 가능 | 선택 입력, trim 후 최대 500 Unicode code point. 줄바꿈과 수정 중 입력 유지 |
| ID·상태·생성 시각·source | 불가 | `updateBooking`이 유지. 화면에서 수정 입력으로 제공하지 않음 |
| 확인 체크 | 저장 전 필수 | 바뀐 내용을 확인하는 일시적 UI 상태. 저장 레코드·의미 있는 변경 비교에서 제외 |

상품을 바꿔 날짜·시각·공간이 지워지면 5단계 안내 `레슨을 바꿔서 날짜·시작 시간·공간 선택을 지웠어요. 다시 선택해주세요.`를 사용한다. 실제 강사나 공간의 실시간 가능 여부는 확인하지 않으며, 상세·폼 모두 데모 로컬 예약임을 유지한다.

## 변경 사항 없음·검증·저장

- **의미 있는 변경**은 `offerId`, `date`, `startTime`, `spaceId`, `trim(memo)`를 처음 읽은 예약과 비교한다. `acknowledged`만 체크하거나 메모의 앞뒤 공백만 바꾼 것은 변경이 아니다. 바꿨다가 원래값으로 되돌리면 다시 변경 없음이다. 화면의 dirty 이탈 판단도 이 의미 있는 변경 기준을 사용한다. 확인 체크는 실제 변경이 생긴 뒤 제출 가능 조건으로만 작동한다.
- 변경 없음이면 `변경한 내용이 없어요. 내용을 바꾸면 저장할 수 있어요.`를 보여주고 Primary `변경사항 저장`을 native disabled로 둔다. `수정 취소`는 사용할 수 있다. 저장소가 무변경 `updateBooking`을 성공으로 반환하더라도 UI는 변경 없음 제출을 실행하지 않고 성공 알림을 띄우지 않는다.
- 의미 있는 변경이 있으면 확인 체크를 요구한다. 체크 전 Primary를 비활성화하거나 제출 시 체크 오류와 포커스를 제공한다. 5단계의 blur/제출 오류 노출 시점, `aria-invalid`·`aria-describedby`, 첫 오류 스크롤·포커스, 네이티브 date/select 키보드 동작을 재사용한다. 체크를 `dirty`의 대용으로 쓰지 않는다.
- 유효한 제출에 `updateBooking(id, input, expectedRevision)`을 **한 번** 호출한다. 현재 repository revision을 읽고 전달하며, `saving` 중 버튼은 `저장 중…` Loading·`aria-busy`이고 중복 클릭/Enter와 화면 내부 이탈을 막는다. 새 ID를 만들거나 `createdAt`/`source`/`status`를 폼에서 보내지 않는다.
- `StoreResult.ok`와 실제 LocalStorage `setItem` 성공 후에만 `setBookingFlash(id,'update')`를 설정하고 기존 `bookingDetailHref(id)`로 돌아간다. 상세에서 `예약을 수정했어요` Inline Alert를 **한 번** 보인다. 수정된 snapshot·날짜·메모를 다시 조회해 표시한다. 직접 상세 방문·새로고침에는 성공 알림을 반복하지 않는다.
- 실패 시 편집 필드·메모·확인 체크·스크롤 위치를 유지하고 Loading을 해제한다. `QUOTA_EXCEEDED`, `STORAGE_UNAVAILABLE`, `WRITE_FAILED`는 오류 Inline Alert와 재시도를 제공한다. `LOCAL_TIME_CONFLICT`는 시작 시간 필드 오류로 보이되 **자기 예약은 중복 계산에서 제외**한다. `VALIDATION_ERROR`는 해당 필드에 매핑하고 현재 서울 시각으로 다시 검증한다. 실패로 이동하거나 성공 알림을 띄우지 않는다.
- `CONFLICT`는 다른 탭/화면에서 같은 예약이 수정·취소·삭제됐을 수 있다. **revision만 갱신해 그대로 재시도하게 하지 않는다.** 먼저 `getBooking(id)`으로 대상 자체를 재조회한다. 여전히 시작 전 예정이고 원래 예약값과 달라졌다면 `다른 화면에서 이 예약이 변경됐어요. 새 내용을 확인해주세요.`를 보이며 편집 draft는 별도로 유지한다. 사용자가 최신 값과 draft를 비교·재적용하기 전에는 저장을 막는다. 대상이 없어졌으면 없는 ID, 취소/시간 경과면 수정 불가 상태로 전환한다. 다른 예약만 변경돼 대상값이 동일하면 최신 revision으로 사용자 확인 후 재시도한다. LocalStorage는 탭 간 원자 트랜잭션이 없어 완전한 동시 쓰기 보장은 주장하지 않는다.
- `INVALID_TRANSITION`(시간 경과/취소 등)은 draft를 유지한 채 `이 예약은 이제 수정할 수 없어요.`를 알리고 저장을 다시 시도하지 않게 한다. `NOT_FOUND`는 대상이 삭제된 상태로 전환한다. 화면 내 draft는 이탈 전까지만 유지하며 영구 복구 기능은 추가하지 않는다.

## 수정 취소·뒤로 가기

Header 뒤로가기와 본문의 `수정 취소`는 **항상 해당 예약 상세**로 향한다. 변경이 없으면 바로 `bookingDetailHref(id)`로 간다. 의미 있는 변경이 있으면 공통 Dialog `수정을 그만둘까요?` / `변경한 내용은 저장되지 않아요.` / `계속 작성`·`나가기`를 연다. `계속 작성`은 편집값·포커스 유지, `나가기`는 draft를 버리고 상세로 이동한다. 브라우저 뒤로가기도 같은 미저장 확인 흐름을 사용한다. Dialog는 2단계의 포커스 트랩·Escape 닫기·복귀 규칙을 재사용한다.

새로고침·탭 닫기에는 dirty일 때 브라우저 native `beforeunload` 확인만 사용한다. 맞춤 문구를 강제하지 않는다. 별도 draft LocalStorage 키를 만들지 않는다. 저장 성공·확인된 나가기 직전 `allowLeave()`로 가드를 해제한다. 5단계 구현의 `useLeaveGuard`가 같은 URL의 history 항목을 추가하는 현재 동작과 그 부작용은 Claude가 6단계 브라우저 검수에서 확인한다.

## Claude 구현 인계·완료 조건

실제 앱 프로젝트: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`. 이 단계에서 Codex는 앱 코드를 수정하지 않았다. 이 문서는 디자인 작업 폴더에 있으며 실제 앱 프로젝트와 자동 동기화되지 않는다. 기존 앱은 `output: 'export'`이므로 `app/bookings/edit/page.tsx` 같은 정적 페이지에서 `useSearchParams()`를 `Suspense` 아래에 두고 `id`를 읽는다. 현재 앱의 `components/bookings/booking-form.tsx`는 이미 `mode='edit'`를 받지만 **의미 있는 변경만으로 CTA를 제어하는 기능은 아직 없다.** 5단계 구현을 복제하지 말고 이 최소 확장을 한다. `lib/bookings/routes.ts`에는 상세 helper가 이미 있다.

Claude에게 전달할 요청:

> `design/data-contract.md`, `design/steps/04-booking-detail.md`부터 `06-booking-edit.md`까지와 `design/progress.md`를 읽고 예약 수정 화면을 구현해줘. 정적 export를 유지하며 논리 `/bookings/[id]/edit`를 `/bookings/edit?id={UUID}`로 매핑하고 `bookingEditHref`를 추가해줘. 상세의 시작 전 예정 예약에만 `예약 수정` 진입 버튼을 연결하고 7단계 취소·삭제는 아직 실행하지 마. 기존 `BookingForm(mode='edit')`, 검증, `useLeaveGuard`, `ConfirmDialog`, `mapSaveError`, `setBookingFlash(id,'update')`를 재사용해줘. 기존 예약값을 초기화하고 확인 체크는 false로 시작해줘. 예약 필드의 정규화된 변경만 dirty로 판단해 변경 없음에는 저장을 막고 성공 알림을 띄우지 마. `updateBooking(id,input,revision)` 성공 후 같은 ID 상세로 돌아가 성공 알림을 한 번 보여줘. 실패는 편집값 유지, CONFLICT는 같은 예약의 최신 상태를 재조회해 무분별한 재시도를 막아줘. 없는 ID·수정 불가 상태와 미저장 이탈 확인을 구현하고 브라우저 검증 결과를 progress에 기록해줘.

완료 조건:

1. 정적 경로 `/bookings/edit?id={UUID}`가 빌드·새로고침에서 작동하고, 상세의 허용 상태에서만 진입한다. 없는/잘못된 ID, 저장소 읽기 실패, 수정 불가 예약은 편집 폼을 숨기고 각각 다른 상태를 보인다.
2. 기존 예약의 상품·날짜·시간·공간·메모가 그대로 보이며 확인 체크만 비어 있다. 저장된 snapshot을 임의로 현재 카탈로그 값으로 덮지 않는다. 상품 변경 시 종속 값만 초기화한다.
3. 저장 전·값 되돌림·확인 체크만 변경한 경우에는 `변경사항 저장` 비활성이다. 의미 있는 변경+확인 체크에서만 제출 가능하다. 필드 오류·키보드·포커스·500자 규칙은 생성과 같다.
4. 저장 중 중복 제출이 없고, 성공하면 기존 ID·createdAt·source를 유지하며 상세에 수정값과 1회 알림이 표시된다. 실패/시간 경과/다른 탭 충돌에는 draft를 유지하고 성공으로 처리하지 않는다.
5. Header·수정 취소·브라우저 뒤로가기는 변경 시 Dialog를 거치고, 변경 없음은 상세로 바로 이동한다. 새로고침·탭 닫기는 브라우저 기본 확인을 사용한다.
6. 390×844에서 본문 스크롤·고정 Footer가 유지되고 기존 생성·목록·상세·홈 화면에 회귀가 없다. 실제 브라우저 테스트, 타입 검사, 빌드 결과를 기록한다.

## Figma 검수

7개 수정 전용 프레임을 390×844로 만들고 정상·변경·오류·이탈·없는 ID·수정 불가·성공 상세의 스크린샷을 확인했다. 모든 프레임은 기존 Header·Field·Button·Dialog·Alert 인스턴스를 사용하며 화면 전체 이미지가 아니다. 생성 폼·홈·기존 상세 노드는 유지했다. 저장 중은 [5단계 Saving](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=291-2303)의 버튼 레이블만 `저장 중…`으로 재사용하고, 조회 실패는 [4단계 조회 실패](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-2123) 패턴을 재사용한다. Figma 상태는 시각 명세이며 실제 LocalStorage·history·포커스 동작은 앱 검증 대상이다.
