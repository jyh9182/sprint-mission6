# 7/10단계 — 예약 취소·기록 삭제

작성일: 2026-11-12 · Codex 디자인·동작 명세 / Claude 앱 구현

## 범위와 데이터 의미

대상은 기존 예약 상세 `/bookings/detail?id={UUID}`의 `예약 관리` 영역과 삭제 후 `/bookings` 목록이다. [예약 데이터 계약](../data-contract.md)의 `cancelBooking`·`deleteBooking`을 그대로 사용한다. **예약 취소는 `status: scheduled → cancelled` 상태 변경**이며 ID, 예약 정보, `createdAt`, `source`, snapshot이 남는다. 성공 시 `updatedAt`과 `cancelledAt`을 기록한다. **예약 기록 삭제는 해당 `LessonBooking`을 배열에서 제거**하며 복구 기능이 없다. 삭제 후 다른 예약과 LocalStorage envelope·초기화 정보는 유지한다. 전체 삭제 뒤 0건이어도 최초 시드를 다시 넣지 않는다.

이 서비스는 로컬 데모 예약이다. 취소·삭제는 실제 강사·공간 확보, 수업 참여, 결제, 환불 또는 운영자 접수와 연결되지 않는다. 화면과 완료 문구에서 그런 처리를 약속하지 않는다. 브라우저 프로필·사이트 주소별 LocalStorage 저장 범위는 1단계 계약을 따른다.

## 상태별 액션

| 저장 상태와 서울 시각 | 상세 표시 | `예약 취소` | `예약 기록 삭제` | 근거 |
|---|---|---|---|---|
| `scheduled`, 시작 전 | 예정 | 표시·확인 후 실행 | 숨김 | 시작 전에는 취소 가능. 삭제하려면 먼저 취소 |
| `scheduled`, 시작 ≤ 현재 < 종료 | 진행 중 | 숨김 | 숨김 | 둘 다 `INVALID_TRANSITION` |
| `scheduled`, 종료 ≤ 현재 | 종료 | 숨김 | 표시·확인 후 실행 | 수강 완료를 단정하지 않는 파생 상태 |
| `cancelled` | 취소됨 | 숨김 | 표시·확인 후 실행 | 취소 기록은 상세·목록에 남음 |

액션은 [4단계 상세](04-booking-detail.md)의 메모 아래 `예약 관리` 영역에 둔다. 상세 Footer는 예정 상태의 `예약 수정` Primary(6단계), 그 외 `예약 목록으로` Secondary를 유지한다. 허용되지 않는 액션을 비활성 버튼으로 남기지 않는다. UI는 `getDetailActions(phase)`를 사용하고 **저장소가 실행 시각·최신 revision으로 다시 판정**한다. Dialog를 열어둔 사이 레슨이 시작하거나 다른 탭에서 상태가 바뀌면 액션을 성공한 척 진행하지 않는다.

## Figma 화면과 기존 컴포넌트

390×844 기준이다. [Confirmation Dialog](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=276-1448)의 `Default / Processing / Error`, 기존 [Primary](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=188-1164)·[Secondary](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=274-1459), [Inline Alert](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=275-1550), 예약 상세·목록을 인스턴스로 재사용했다. 새 컬러·글꼴·라운드·그림자·Dialog 컴포넌트는 만들지 않았다. 원래 상세 액션 위치는 [예정 상세](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-1807)와 [취소됨 상세](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-1993)를 기준으로 한다.

| 단계 | Figma 프레임 | 표시 |
|---|---|---|
| 취소 확인 | [Cancel Default](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2478) | 기존 예정 상세 위 확인 Dialog |
| 취소 중 | [Cancel Processing](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2520) | `취소 중…`, 유지하기 비활성 |
| 취소 실패 | [Cancel Error](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2564) | Dialog 안 오류 Alert, 기존 상세 유지 |
| 취소 완료 | [Cancel Success Detail](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2748) | `취소됨` 배지·기록·성공 Alert·삭제 진입 |
| 삭제 확인 | [Delete Default](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2613) | 취소됨 상세 위 복구 불가 확인 Dialog |
| 삭제 중 | [Delete Processing](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2655) | `삭제 중…`, 유지하기 비활성 |
| 삭제 실패 | [Delete Error](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2699) | Dialog 안 오류 Alert, 기존 기록 유지 |
| 삭제 완료 | [Delete Success List](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=299-2792) | 목록 이동·성공 Alert·0건 예시 |

삭제 Dialog의 Figma 배경은 취소됨 예약 예시다. **종료된 `scheduled` 예약에서도 동일 Dialog와 삭제 동작**을 사용한다. 삭제 완료 목록의 0건은 마지막 한 건을 지운 예시다. 다른 기록이 있으면 남은 예약 카드를 그대로 보여주고 개수를 다시 계산한다.

## 확인 Dialog 문구·접근성

| 구분 | 취소 | 삭제 |
|---|---|---|
| 제목 | `예약을 취소할까요?` | `예약 기록을 삭제할까요?` |
| 설명 | `취소해도 예약 기록은 남아요.\n다시 예약하려면 새 예약을 만들어주세요.` | `삭제한 기록은 복구할 수 없어요.\n이 브라우저의 기록에서 제거돼요.` |
| 안전 버튼 | `유지하기` | `유지하기` |
| 확인 버튼 | `예약 취소` | `삭제하기` |
| 처리 중 | `취소 중…` | `삭제 중…` |
| 실패 제목 | `취소하지 못했어요` | `삭제하지 못했어요` |
| 실패 설명 | `기존 예약은 유지했어요. 다시 시도해주세요.` | `기록은 그대로예요. 다시 시도해주세요.` |
| 성공 제목 | `예약을 취소했어요` | `예약 기록을 삭제했어요` |
| 성공 설명 | `예약 기록은 이 브라우저에 남아 있어요. 다시 예약하려면 새 예약을 만들어주세요.` | `삭제한 기록은 복구할 수 없어요.` |

상세 버튼을 누를 때 **저장 함수는 호출하지 않고** Dialog만 연다. 열릴 때 `유지하기`에 먼저 포커스한다. Tab/Shift+Tab은 Dialog 안에서 순환, Escape와 `유지하기`는 닫고 원래 상세 액션 버튼에 포커스를 돌린다. 배경 클릭으로 닫지 않는다. 제목·설명을 `aria-labelledby`·`aria-describedby`로 연결한다. Processing에서는 확인 버튼 Loading·`aria-busy=true`, 안전 버튼 disabled, Escape/배경 이동 차단, 같은 클릭·Enter의 중복 실행 방지다. 처리 중 상태는 실제 저장 Promise 동안만 보이며 인위적 지연은 없다. Error 상태의 Alert는 `role=alert`로 읽히고 재시도 가능한 경우 확인 버튼을 다시 활성화한다. 같은 오류를 Dialog 밖에도 중복 표시하지 않는다.

## 취소 실행과 결과

1. 시작 전 `scheduled` 상세의 `예약 취소`에서 현재 ID와 읽기 revision을 확보한다. 확인 버튼에서만 `cancelBooking(id, expectedRevision)`을 한 번 호출한다. Dialog를 연 뒤 시각·상태가 바뀔 수 있으므로 저장소 결과를 최종 판정한다.
2. 실제 변경 성공이면 같은 상세를 재조회해 `취소됨` Badge, 기존 강사·악기·장르·날짜·시각·공간·메모를 보여준다. `예약 수정`·`예약 취소`를 제거하고 `예약 기록 삭제`를 표시한다. 성공 Alert는 `예약을 취소했어요`로 한 번만 보여준다. 목록에서도 상태가 취소됨으로 갱신된다. 취소된 예약의 레슨 시간을 실제 수업 취소가 처리된 것처럼 설명하지 않는다.
3. repository가 이미 `cancelled`인 레코드를 무변경 성공으로 반환하는 경우, 중복 취소 성공 메시지를 새로 띄우지 않는다. 상세를 재조회해 `이미 취소된 예약이에요.` 안내 또는 현재 `취소됨` 상태를 보여준다. revision·`cancelledAt`을 불필요하게 갱신하지 않는다.
4. `INVALID_TRANSITION`(레슨 시작·종료 등), `NOT_FOUND`, `CONFLICT`는 Dialog를 닫고 최신 대상 `getBooking(id)`을 다시 읽는다. 상태에 따라 최신 상세·없는 ID·조회 실패로 전환하며, 오래된 revision으로 자동 재실행하지 않는다. `CONFLICT`가 다른 예약의 변경 때문이어도 사용자가 최신 상태를 확인하고 다시 눌러야 한다.

## 삭제 실행과 결과

1. `cancelled` 또는 종료된 `scheduled` 상세에서 `예약 기록 삭제`를 누르면 복구 불가 Dialog를 연다. **시작 전 예정 예약은 바로 삭제할 수 없으며 먼저 취소**해야 한다. 확인 버튼에서만 `deleteBooking(id, expectedRevision)`을 한 번 호출한다.
2. 성공한 `setItem` 뒤 반환된 `deletedId`가 요청 ID와 일치하면 `/bookings`로 이동한다. 삭제한 예약 카드는 목록에서 제거하고 나머지는 유지한다. 목록 상단 성공 Alert `예약 기록을 삭제했어요`를 같은 탭 이동에서 한 번만 보여준다. 마지막 기록을 지웠다면 정상 0건 상태를 보이며 시드 재생성은 하지 않는다.
3. 이전 상세 URL에 다시 방문하면 `NOT_FOUND`를 보여준다. 브라우저 뒤로가기로 상세 캐시가 보이더라도 최신 저장소를 재조회해 삭제된 예약 정보를 다시 조작 가능하게 두지 않는다.
4. `INVALID_TRANSITION`, `NOT_FOUND`, `CONFLICT`는 취소와 마찬가지로 최신 상태를 재조회한다. 다른 탭이 이미 삭제했으면 목록으로 보낼 수 있지만 **이번 클릭으로 삭제 성공한 것처럼** 안내하지 않는다.

## 실패·데이터 보존·포커스

- `QUOTA_EXCEEDED`, `STORAGE_UNAVAILABLE`, `WRITE_FAILED` 등 쓰기 실패는 Dialog Error 상태로 보이고, 원래 예약 정보와 LocalStorage 원본을 유지한다. 처리 중을 해제하고 `유지하기`/재시도 선택을 제공한다. 실패 뒤 바로 다른 화면으로 보내거나 성공 배지·성공 Alert를 표시하지 않는다. 재시도는 **최신 revision·상태를 다시 확인한 뒤** 같은 액션을 실행한다.
- `CORRUPT_DATA`·`UNSUPPORTED_VERSION` 등 읽기 문제는 자동 초기화·시드·삭제로 복구하지 않는다. 저장소 오류 안내와 안전한 읽기 재시도를 제공한다. 원본 값을 덮어쓰지 않는다.
- Dialog 닫힌 뒤 원래 버튼이 상태 변경으로 DOM에서 사라졌으면 해당 상세 제목 또는 새 `예약 기록 삭제` 액션으로 포커스를 옮긴다. 취소 성공은 동일 상세 안에서 Badge·성공 Alert를 읽을 수 있게 한다. 삭제 성공은 목록 제목 또는 성공 Alert로 포커스를 이동한다. 자동 이동·알림은 실제 저장 성공 뒤에만 한다.
- 동일 탭에서 액션 진행 중 다른 버튼·Header 이동과 재확인을 막는다. 다른 탭의 LocalStorage 변경은 완전한 원자 트랜잭션을 제공하지 않으므로 최신 조회·revision 확인으로 충돌을 감지한다.

## Claude 구현 인계·완료 조건

실제 앱 프로젝트: `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`. Codex는 이번 단계에서 앱 코드를 변경하지 않았다. 현재 앱에는 `getDetailActions(phase)`, `cancelBooking`, `deleteBooking`, `ConfirmDialog`, `InlineAlert`, 상세·목록 화면이 구현돼 있다. 상세는 6단계까지 `예약 취소는 준비 중이에요` / `예약 기록 삭제는 준비 중이에요` 안내를 표시하므로 이번 단계에서 실제 액션으로 교체한다. 이 디자인 문서는 앱 프로젝트와 자동 동기화되지 않으므로 기존 문서와 비교·병합해 전달한다.

Claude에게 전달할 요청:

> `design/data-contract.md`, `design/steps/02-components.md`, `04-booking-detail.md`, `07-cancel-delete.md`, `design/progress.md`를 읽고 7단계 취소·삭제를 구현해줘. 상세의 준비 중 안내를 `getDetailActions(phase)`에 따른 `예약 취소` 또는 `예약 기록 삭제`로 교체해줘. 기존 `ConfirmDialog`의 Default/Processing/Error와 공통 Button·Inline Alert를 재사용하고, 확인 전에는 저장 함수를 호출하지 마. 취소는 `cancelBooking(id,revision)` 성공 후 같은 ID 상세를 재조회해 `취소됨`과 기록 유지·성공 Alert를 보여줘. 삭제는 `deleteBooking(id,revision)` 성공 뒤 목록으로 이동하고 대상 카드만 제거·성공 Alert를 한 번 보여줘. 저장 실패에는 기존 정보를 유지하고 재시도하게 해줘. 시간 경계·다른 탭 변경·없는 ID는 최신 상태 재조회 후 처리하고 성공으로 오인하지 마. 결제·환불 처리나 서버 기능은 추가하지 마. 실제 브라우저 검증과 변경 파일을 progress의 Claude 7단계 기록에 남겨줘.

완료 조건:

1. 시작 전 예정에는 취소만, 취소됨·종료에는 삭제만 보인다. 진행 중에는 둘 다 없다. 허용되지 않은 저장소 호출은 화면에서도 차단되고 repository가 최종 거절한다.
2. Dialog의 취소·삭제 문구·복구 불가 안내, 키보드·포커스·Escape·처리 중 중복 제출 방지가 Figma와 일치한다. 확인 전에는 LocalStorage 원본이 변하지 않는다.
3. 취소 성공은 동일 ID·기존 필드·createdAt·source를 유지하고 status/cancelledAt/updatedAt만 계약대로 변경한다. 상세·목록이 `취소됨`을 표시하고 취소/수정 액션은 사라지며 삭제 진입이 나타난다.
4. 삭제 성공은 대상 1건만 제거하고 `/bookings`로 이동한다. 다른 예약은 불변이며 0건에서 재시드하지 않는다. 이전 상세 URL은 없는 ID 상태가 된다.
5. 쓰기 실패/용량 초과/접근 불가는 데이터·화면을 성공으로 바꾸지 않는다. `CONFLICT`, `INVALID_TRANSITION`, `NOT_FOUND`는 최신 상태를 읽고 재실행/성공을 단정하지 않는다.
6. 기존 홈·생성·수정·상세·목록에 회귀가 없다. 실제 브라우저 테스트, 타입 검사, 정적 빌드 결과를 기록한다.

## Figma 검수

8개 390×844 프레임을 구성했다. 취소·삭제 각각 Default/Processing/Error Dialog, 취소 완료 상세, 삭제 완료 목록을 스크린샷으로 확인했다. 공통 Dialog는 350px 너비로 사용하고 Background scrim, 고정 Footer, 기존 상세·목록 레이어를 유지했다. 오류 문구·처리 중 버튼·복구 불가 안내가 보이며 화면 전체 래스터 이미지는 없다. 원본 홈·생성·수정·상세·목록은 수정하지 않았다. Figma는 시각 명세이며 실제 저장·상태 전이·포커스·동시 실행은 Claude의 앱 검증 대상이다.
