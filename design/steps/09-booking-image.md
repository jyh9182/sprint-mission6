# 9/10단계 — 예약 참고 이미지 첨부 UX

작성일: 2026-11-12 · Codex 디자인·UX/데이터 명세 · Claude 앱 구현

## 범위와 기존 화면

예약당 선택적 참고 이미지 **1장**을 생성·수정 폼에서 고르고, 미리보고, 교체하거나 제거한다. 상세는 저장된 이미지가 있으면 보여준다. JPEG/PNG/WebP만 허용한다. PDF·음성·동영상·SVG·실제 서버 업로드는 제외한다. 기준은 [데이터 계약 §8](../data-contract.md#8-9단계-참고-이미지-확장--v2-계약)이며 v1 예약은 v2로 안전하게 이전한다. 기존 5단계 공통 폼, 6단계 수정·이탈 규칙, 4단계 상세 카드, 7단계 성공·실패 처리, 8단계 목록 복귀 문맥을 유지한다. 실제 앱 코드는 이 단계에서 수정하지 않았다.

### Figma 추가 영역·상태

| 용도 | 링크 | 확인할 점 |
|---|---|---|
| 공통 이미지 필드 상태 | [09_Reference_Image_Field_States](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=306-2964) | 이미지 없음·선택됨·형식/크기/해석 오류·제거 예정 |
| 생성에서 선택됨 | [20_Booking_Create_Image_Selected](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=307-2961) | 메모 다음 이미지, 미리보기·교체·제거, 기존 저장 CTA |
| 수정에서 기존 첨부 | [20_Booking_Edit_Image_Existing](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=307-3044) | 저장된 이미지 표시, 기존 수정 취소·저장 배치 |
| 파일 유효성 오류 | [20_Booking_Create_Image_Invalid](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=307-3129) | 이미지 필드 바로 아래 오류, 값 보존 |
| 저장 용량 초과 | [20_Booking_Edit_Image_Quota_Error](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=307-3208) | 기존 Inline Alert, 준비한 이미지와 폼 유지 |
| 상세, 첨부 있음 | [20_Booking_Detail_With_Reference_Image](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=307-3300), [스크롤 상태](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=307-3388) | 메모 아래 이미지 카드, 본문 스크롤, Footer 고정 |
| 상세, 첨부 없음 | [기존 4단계 상세](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=286-1807) | 이미지 카드 전체 숨김, 빈 자리 없음 |

이미지 필드는 [Empty](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=306-2936), [Selected](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=306-2944), [Error](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=306-2956), [Remove Pending](https://www.figma.com/design/TnJzGfgFHX6R7OnZR6KeET/LessonConnectAI-App-Design?node-id=309-3225) 재사용 컴포넌트로 만들었다. 프레임은 기존 생성·수정·상세를 복제한 새 화면이며 원본은 건드리지 않았다. 샘플 기타 사진과 `guitar-reference.jpg · 420KB`는 **시각 예시**다. 런타임은 사용자가 선택한 변환 결과와 저장 데이터로 교체해야 한다.

## 배치와 상태 전이

공통 폼에서 `메모 (선택)` 아래, `예약 정보 확인` 체크 위에 `참고 이미지 (선택)`을 둔다. 350px 폭, 흰 카드·1px 중립 테두리·기존 20px 안팎의 카드 라운드와 Noto Sans KR을 따른다. `JPEG · PNG · WebP · 원본 최대 2MB`를 필드 설명으로 상시 표시한다. 선택됨 상태는 작은 **변환 결과** 미리보기, 원본 파일명, 변환 결과 크기, `교체`/`제거`를 보여준다. `교체`와 `제거`는 각각 명시적 44px 이상 터치 영역을 갖는다. 폼 본문만 세로 스크롤하고 Header·Footer CTA는 기존 위치에 고정한다. 상세의 `참고 이미지` 카드는 메모 다음, `예약 관리` 전에 배치한다.

| 현재 draft | 행동 | 다음 draft/화면 | 저장된 예약 |
|---|---|---|---|
| 없음 | 유효한 파일 선택·변환 성공 | 선택됨 + 미리보기 | 그대로 |
| 선택됨/기존 첨부 | `교체` → 유효한 파일 성공 | 새 이미지 미리보기 | 그대로 |
| 선택됨/기존 첨부 | `교체` → 선택 창 취소·검증 실패 | 직전 미리보기 유지, 오류만 표시 | 그대로 |
| 생성의 선택됨 | `제거` | 이미지 없음 | 없음 유지 |
| 수정의 기존 첨부 | `제거` | `제거 예정` + `되돌리기` | 기존 첨부 유지 |
| 수정의 제거 예정 | `되돌리기` | 기존 미리보기 복원 | 기존 첨부 유지 |
| 수정의 교체/제거 예정 | `수정 취소` 또는 이탈 확인의 `나가기` | 편집 draft 폐기 | 기존 첨부 유지 |
| 새 이미지 선택/제거 예정 | 저장 성공 | 상세로 이동, 성공 피드백 | 이미지와 예약을 함께 갱신 |
| 새 이미지 선택/제거 예정 | 저장 실패 | 폼·미리보기·오류/제거 예정 유지 | 기존 첨부·revision 유지 |

이미지 선택·교체·제거는 6단계의 의미 있는 변경에 포함한다. 이미지가 준비 중이면 저장 버튼을 비활성화하고 `이미지 준비 중…`을 해당 필드에 알린다. 변환 완료 후 기존 폼 검증·확인 체크·저장 중 중복 제출 차단을 그대로 적용한다. 이미지 없는 생성은 정상이며 이미지 없음만으로 저장을 막지 않는다. 이미지 없는 수정은 기존 카드 없는 상태와 같고, 이미지만 새로 선택해도 저장 가능하다. 수정 불가 상태(진행 중·종료·취소됨)에는 이미지 편집 진입을 새로 허용하지 않는다.

`제거`는 저장 전까지 되돌릴 수 있다. 저장 성공 전에는 상세에 기존 이미지가 계속 표시된다. 저장 취소/뒤로 가기는 기존 이탈 확인 Dialog를 사용하고, `계속 작성`을 고르면 폼과 준비된 이미지 draft가 유지된다. 저장 실패 때 브라우저 파일 선택 창을 다시 강제로 열지 않는다.

## 파일 준비·오류·저장

| 조건 | 표시 문구 | 처리 |
|---|---|---|
| MIME/시그니처가 JPEG/PNG/WebP가 아니거나 불일치 | `JPEG, PNG, WebP 이미지만 첨부할 수 있어요.` | 새 파일 무시, 이전 draft 유지 |
| 원본이 2 MiB 초과 | `원본 이미지는 2MB 이하만 첨부할 수 있어요.` | 디코딩 전 중단 |
| 비어 있거나 이미지 디코딩 실패 | `이미지를 열 수 없어요. 다른 파일을 선택해주세요.` | 새 파일 무시, 이전 draft 유지 |
| WebP 변환 실패 또는 500 KiB 이하 달성 불가 | `이미지를 준비하지 못했어요. 다른 파일로 다시 시도해주세요.` | 초과 결과 저장 금지 |
| LocalStorage `QUOTA_EXCEEDED` | `브라우저 저장 공간이 부족해요. 입력과 기존 이미지는 유지했어요.` | 기존 데이터·현재 draft 유지, 재시도 가능 |
| `STORAGE_UNAVAILABLE`/`WRITE_FAILED` | 기존 공통 저장 실패 문구 | 기존 데이터·현재 draft 유지 |

원본 2 MiB·긴 변 1280px·변환 결과 500 KiB는 각각 별도 기준이다. 원본 형식·시그니처·크기를 검증하고 이미지를 디코딩한 뒤, 비율과 방향을 보존해 축소한다. 결과는 WebP로 저장하며 500 KiB 이하를 확인한 뒤 Data URL을 만든다. 용량 제한을 넘는 결과를 임의로 허용하거나 이미지 없이 예약을 성공 처리하지 않는다. 상세 이미지가 손상되어 읽기 검증에 실패하면 기존 [조회 실패](04-booking-detail.md#로딩없는-id조회-실패) 규칙대로 원본을 유지하고 오류를 보여준다.

오류 문구는 필드 아래에, 저장소 쓰기 실패는 폼 상단의 기존 Inline Alert에 둔다. 두 종류를 혼합해 형식 오류를 `QUOTA_EXCEEDED`처럼 설명하지 않는다. 선택한 파일은 브라우저/기기 외부로 전송되지 않지만, 같은 origin의 LocalStorage에 Data URL로 남는다. 미리보기 object URL은 사용이 끝나면 해제한다.

## 데이터 계약·마이그레이션

[데이터 계약 §8](../data-contract.md#8-9단계-참고-이미지-확장--v2-계약)에 `ReferenceImage`의 `fileName`, `originalMimeType`, `originalSizeBytes`, 변환 후 `mimeType`, `sizeBytes`, `width`, `height`, `dataUrl`을 정의했다. v2 예약은 `referenceImage: ReferenceImage | null`을 필수 키로 갖는다. 폼의 `referenceImageChange`는 `keep | replace | remove` draft 명령이며 저장 레코드에는 들어가지 않는다. 취소는 첨부를 유지하고 삭제는 해당 예약의 첨부를 함께 제거한다.

활성 키는 `lessonconnect:bookings:v2`다. v1 키는 기존 예약을 읽어 안전하게 옮길 때만 사용하고 자동 삭제하지 않는다. v2가 없고 v1이 있으면 v1을 먼저 엄격하게 검증한 다음 모든 예약에 `referenceImage:null`을 추가해 v2를 **한 번에** 쓴다. v1이 빈 배열이라도 재시드하지 않는다. 쓰기 실패 시 v1을 유지하고 오류를 보여준다. v2가 있으면 v2만 읽으며 v2 손상을 v1로 되돌려 숨기지 않는다. 기존 LocalStorage `revision`, 예약 ID와 시각, 8단계 URL 조건은 유지한다. 1~8단계의 예약 표시·검색·상태 동작은 첨부 유무와 관계없이 같다.

## 접근성·Claude 구현 인계

- 보이는 필드 레이블 `참고 이미지 (선택)`을 파일 입력과 연결한다. 숨겨진 실제 파일 입력은 키보드로 접근 가능한 `참고 이미지 선택` 버튼/레이블에서 열고, `accept`는 힌트일 뿐 별도 유효성 검증을 한다.
- 이미지 미리보기의 대체 텍스트는 `선택한 참고 이미지: {fileName}`, 상세는 `예약 참고 이미지: {fileName}`이다. 파일명은 길면 화면에서 2줄로 줄일 수 있지만 접근 가능한 이름에는 전체 안전한 이름을 제공한다.
- `교체`, `참고 이미지 제거`, `제거 되돌리기`는 구별되는 접근성 이름을 갖는다. 오류는 파일 필드에 `aria-invalid`, 설명/오류 ID에 `aria-describedby`, 오류 메시지에 `role=alert`를 적용한다. 준비 중과 저장 결과는 공통 라이브 영역 규칙을 따른다.
- 앱 프로젝트 `/Users/jeongyohan/Desktop/Codeit-it-5/sprint-mission6`에서 `AGENTS.md`·`CLAUDE.md`를 먼저 읽고 실제 코드는 Claude가 작성한다. 이 디자인 작업 폴더의 문서는 앱 프로젝트와 자동 동기화되지 않으므로 동명 파일을 비교·병합해 전달한다. `components/bookings/booking-form.tsx`의 공통 폼, `booking-detail-screen.tsx`, `lib/bookings/types.ts`·`validation.ts`·`repository.ts`를 우선 확인한다. 새 서버/API/Storage 서비스는 추가하지 않는다.

Claude 완료 조건:

1. 이미지 없음·선택·교체·제거 예정·되돌리기·상세 표시가 생성/수정 공통 폼에서 작동하고, 저장 취소·저장 실패 때 기존 첨부가 유지된다.
2. 형식·시그니처·2 MiB 원본·디코딩 실패·긴 변 1280px·WebP 결과 500 KiB를 실제 파일로 확인한다. 이미지 처리 중 중복 선택/저장을 막는다.
3. 1장만 저장하고 `referenceImage` 메타데이터·Data URL이 v2 계약과 일치한다. 이미지 없는 v1 예약은 v2로 옮겨져 상세가 정상이며 빈 v1 저장소는 재시드되지 않는다.
4. 마이그레이션·생성·수정의 용량 초과/쓰기 실패는 원본과 현재 폼을 보존한다. 취소는 첨부 유지, 삭제는 첨부 제거. v2 손상·미지원 버전은 조회 실패로 처리한다.
5. 390×844에서 이미지 필드·오류·상세 카드가 스크롤 가능하고 고정 Footer와 겹치지 않는다. 키보드·스크린리더 레이블·긴 파일명을 확인한다.
6. 기존 1~8단계 기능과 8단계 URL 목록 복귀, Claude의 기존 테스트를 유지하고 이미지 계약 검증을 추가한다. 실행한 검증과 결과만 `design/progress.md`에 기록하며 기존 Claude 기록은 지우지 않는다.

## 시각 검수 기록

공통 필드 상태 보드와 새 생성·수정·오류·상세 6개 프레임의 스크린샷을 확인했다. 새 제품 프레임은 390×844이며 기존 Header·Button·Textarea·Dialog·Inline Alert·Footer 스타일을 유지한다. 이미지 필드는 메모 다음, 상세 이미지는 메모와 예약 관리 사이에 있고 둘 다 스크롤 본문 안이다. 예시 사진의 기존 장식 가장자리는 크롭했다. 실제 파일 선택·압축·LocalStorage 쓰기·마이그레이션은 앱 구현 단계에서 검증해야 한다.
