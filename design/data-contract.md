# 레슨커넥트AI — 예약 데이터 계약 v1

작성일: 2026-11-11 · 단계: 1/10 · 담당: Codex 설계 / Claude 구현

이 문서는 구현할 계약이다. 앱 구현·런타임 검증 완료를 의미하지 않는다. 현재 접근 가능한 폴더에는 앱 소스와 IDE의 브리프가 없으므로 실제 프로젝트와의 정합성 확인은 Claude 착수 조건이다. 조사 근거는 [1단계 인계](steps/01-foundation.md)를 참조한다.

## 1. 범위와 결정

- 핵심 리소스는 `LessonBooking`이다. LocalStorage가 예약의 최종 저장소이며 화면은 저장소 조회 결과를 표시한다.
- 브라우저에서 관리하는 데모 예약이다. 실제 강사·공간 확보, 결제, 환불, 서버 AI 매칭, 인증·권한 관리 기능은 포함하지 않는다.
- 1단계 당시에는 Figma의 일정 → 공간 → 확인 → 완료 화면을 생성 경로로 계획했다. **5단계 최신 요청에서 `/bookings/new`의 표현은 단일 스크롤 폼으로 변경**했다. 기존 화면은 유지하며 데이터 타입·검증·확인 체크·저장 계약은 이 문서대로 재사용한다. 상세 동작은 [5단계 설계](steps/05-booking-create.md)를 우선한다.
- v1 레슨 길이는 현재 디자인에 맞춰 60분 고정이다. 강사·악기·장르·예시 가격은 선택한 레슨 상품(offer)에서 결정한다.
- 예약 취소는 상태 변경으로 기록을 유지한다. 예약 삭제는 해당 레코드와 그에 종속된 첨부 정보를 제거한다. 삭제 복구 기능은 없다.
- 기준 데이터(강사·상품·공간)는 코드의 읽기 전용 데모 카탈로그, 사용자 예약은 LocalStorage에 분리한다.
- 음악 취향 선택값과 AI 매칭률은 예약의 필수 필드가 아니다. 매칭률을 실제 계산 결과로 새로 생성하지 않는다.
- 파일 첨부는 9단계에서 계약 확장 후 구현한다. v1에 임의 첨부 필드를 추가하거나 파일 업로드를 선행 구현하지 않는다.

## 2. 타입 계약

아래 TypeScript는 구현 인계용 명세이며 실행 코드 파일은 아니다. 문자열 별칭에도 런타임 검증을 적용한다.

```ts
type BookingId = string; // crypto.randomUUID()로 생성한 UUID v4
type ISOInstant = string; // UTC ISO 8601, 예: 2026-11-11T09:00:00.000Z
type LocalDate = string; // 실제 존재하는 날짜, YYYY-MM-DD
type LocalTime = string; // 24시간제 HH:mm
type BookingStatus = "scheduled" | "cancelled";
type GenreId = "rock" | "pop" | "jazz" | "blues" | "rnb" | "k-pop"
  | "funk" | "ballad" | "indie" | "metal" | "classical" | "new-age" | "edm";

interface InstructorReference {
  id: string;
  name: string;
  active: boolean;
}
interface LessonOfferReference {
  id: string;
  instructorId: string;
  instrumentId: string;
  instrumentLabel: string;
  genres: GenreId[]; // 1~3개, 중복 없음
  durationMinutes: 60;
  examplePriceKRW: number; // 0 이상의 안전한 정수
  allowedSpaceIds: string[];
  active: boolean;
}
interface SpaceReference {
  id: string; // 방마다 별도 ID
  studioName: string;
  roomName: string;
  equipmentLabels: string[];
  active: boolean;
}
interface BookingCatalog {
  version: "1";
  instructors: readonly InstructorReference[];
  offers: readonly LessonOfferReference[];
  spaces: readonly SpaceReference[];
  demoStartTimes: readonly LocalTime[];
}

interface LessonSnapshot {
  instructorName: string;
  instrumentId: string;
  instrumentLabel: string;
  genres: GenreId[];
  studioName: string;
  roomName: string;
  equipmentLabels: string[];
  examplePriceKRW: number;
  currency: "KRW";
  durationMinutes: 60;
}
interface LessonBooking {
  id: BookingId;
  offerId: string;
  instructorId: string;
  spaceId: string;
  catalogVersion: string;
  snapshot: LessonSnapshot;
  date: LocalDate;
  startTime: LocalTime;
  timeZone: "Asia/Seoul";
  memo: string; // 미입력은 빈 문자열
  status: BookingStatus;
  source: "user" | "seed";
  createdAt: ISOInstant;
  updatedAt: ISOInstant;
  cancelledAt: ISOInstant | null;
}
interface BookingStoreV1 {
  schemaVersion: 1;
  revision: number; // 1부터 시작하는 안전한 정수; 성공적인 변경마다 +1
  initializedAt: ISOInstant;
  seedVersion: 1;
  bookings: LessonBooking[];
}
interface BookingInput {
  offerId: string;
  spaceId: string;
  date: LocalDate;
  startTime: LocalTime;
  memo?: string; // 저장소가 trim하고 누락은 ""로 정규화
  acknowledged: true; // 확인 체크; 저장 레코드에는 포함하지 않음
}
type BookingField = keyof BookingInput;
type StoreErrorCode = "NOT_READY" | "STORAGE_UNAVAILABLE" | "CORRUPT_DATA"
  | "UNSUPPORTED_VERSION" | "QUOTA_EXCEEDED" | "WRITE_FAILED"
  | "VALIDATION_ERROR" | "NOT_FOUND" | "INVALID_TRANSITION"
  | "CONFLICT" | "LOCAL_TIME_CONFLICT";
type StoreResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: {
      code: StoreErrorCode;
      message: string;
      fieldErrors?: Partial<Record<BookingField, string>>;
    }};
interface BookingListData { bookings: LessonBooking[]; revision: number }
interface BookingData { booking: LessonBooking; revision: number }
```

## 3. 필드 생성·검증 규칙

| 필드 | 규칙 |
|---|---|
| `id` | 생성 시 저장소가 UUID v4 생성. 배열 내 유일. 수정으로 변경 불가 |
| `offerId`, `spaceId` | 생성·수정 시 카탈로그의 활성 항목이어야 하며 공간은 상품의 허용 공간이어야 함 |
| `instructorId`, `snapshot`, `catalogVersion` | 클라이언트 폼 값을 신뢰하지 않고 저장소가 카탈로그에서 복사 |
| `date`, `startTime` | 정규식뿐 아니라 실제 달력 날짜·시각 검증. 시작 시각은 `demoStartTimes`에 포함 |
| 레슨 시작·종료 | 서울 시각으로 해석. 생성·수정 시 시작은 현재 시각보다 미래. 종료는 시작 + 60분, 다음 날로 넘어가지 않음 |
| `memo` | 선택, 앞뒤 공백 제거, 줄바꿈 허용, 정규화 후 최대 500 Unicode code point. HTML로 해석하지 않음 |
| `acknowledged` | 저장 버튼을 누를 때 true 필수. 변경된 예약 정보 확인을 위한 UI 상태이며 기록의 법적 동의로 해석하지 않음 |
| `status` | 생성은 scheduled. 일반 수정 입력으로 변경 불가 |
| 시각 필드 | 저장소의 동일한 now를 사용. 생성 시 createdAt=updatedAt. 수정 시 createdAt 유지. 취소 시 updatedAt=cancelledAt |
| `cancelledAt` | scheduled면 null, cancelled면 유효한 UTC 시각이며 createdAt ≤ cancelledAt ≤ updatedAt |
| `source` | 최초 샘플만 seed, 사용자 신규 예약은 user. 수정·취소 후에도 원래 값 유지 |

시간 계산은 `date + 'T' + startTime + ':00+09:00'`을 기준으로 한다. 사용자 장치 시간대와 관계없이 서울 날짜·시간으로 표시한다. UTC 날짜를 잘라서 서울 날짜로 사용하지 않는다. 종료 시각·표시용 요일은 계산하고 별도 저장하지 않는다.

읽기 검증은 저장 구조·필드 타입·날짜 형식·상태 불변식을 확인한다. 과거 날짜라는 이유로 손상 데이터로 판단하지 않는다. 기준 카탈로그에서 사라진 ID도 snapshot이 정상이면 조회 가능하다. 생성·수정의 활성 카탈로그 검증과 저장 데이터 읽기 검증을 분리한다.

`getBooking` 등에 전달된 ID가 유효한 UUID가 아니거나 저장소에 없으면 `NOT_FOUND`다. 한 레코드의 필수 필드가 손상되거나 ID가 중복되면 전체 저장소를 `CORRUPT_DATA`로 처리하고 자동으로 잘못된 행을 버리지 않는다.

### 상태와 액션

| 조건 | 표시 상태 | 수정 | 취소 | 삭제 |
|---|---|---|---|---|
| scheduled, 시작 전 | 예정 | 가능 | 가능 | 불가: 먼저 취소 |
| scheduled, 시작 ≤ 현재 < 종료 | 진행 중 | 불가 | 불가 | 불가 |
| scheduled, 종료 ≤ 현재 | 종료 | 불가 | 불가 | 확인 후 가능 |
| cancelled | 취소됨 | 불가 | 이미 취소: 변화 없는 성공 | 확인 후 가능 |

‘진행 중/종료’는 시간에서 파생하는 표시 상태다. 실제 수강을 확인할 수 없으므로 ‘수강 완료’로 단정하거나 `completed` 상태를 자동 저장하지 않는다. 취소는 복원하지 않는다. 다시 예약하려면 새 예약을 생성한다.

동일 브라우저의 다른 취소되지 않은 예약과 시간 구간이 겹치면 `LOCAL_TIME_CONFLICT`로 생성·수정을 거절한다. 사용자 한 명이 동시에 두 레슨을 예약하는 것을 방지하는 로컬 검증일 뿐, 강사·공간의 실제 가용성을 검증하지 않는다. 수정 대상 자신은 제외하고 끝 시각=다음 시작 시각은 허용한다.

## 4. 기준 데이터와 snapshot

첫 구현의 필수 카탈로그는 현재 예약 흐름에 맞춘 최소 fixture로 한다. 다음 ID는 새 구현용 제안 ID이며 기존 앱의 ID를 조사해 확인한 값은 아니다. 기존 카탈로그가 있으면 Claude가 대응표를 기록하고 이 계약을 일관되게 조정한다.

| 구분 | v1 fixture |
|---|---|
| 강사 | `instructor-kim-minjun` / 김민준 / active |
| 상품 | `offer-kim-guitar-60` / 위 강사 / guitar·기타 / rock, blues / 60분 / 예시 50,000원 |
| 공간 A | `space-dongtan-a` / 동탄 스튜디오 / A 레슨실 / 기타·앰프 제공 |
| 공간 B | `space-dongtan-b` / 동탄 스튜디오 / B 레슨실 / 기타·앰프 제공 |
| 공간 C | `space-dongtan-c` / 동탄 스튜디오 / C 레슨실 / 기타 제공 |
| 허용 공간·시각 | 위 상품은 A/B/C 모두 허용. 시작 18:00, 19:00, 20:00, 21:00 |

홈에 이지은·박도현 강사가 있어도 그 강사의 예약 상품·가격·공간을 임의로 확정하지 않는다. 기존 앱에 검증 가능한 카탈로그가 없다면 첫 CRUD는 김민준 상품으로 완주하고 나머지 상품 확장은 별도 기록한다. 다른 강사를 선택했는데 김민준으로 몰래 대체하면 안 된다.

예약 상세·목록은 snapshot을 표시한다. 이후 기준 데이터의 이름·금액·시설 설명이 바뀌어도 기존 예약 표시는 변하지 않는다. 일반 수정에서 offerId와 spaceId가 모두 같으면 snapshot을 유지한다. 둘 중 하나가 변경되면 전체 snapshot을 최신 유효 카탈로그로 재구성하고 확인 화면에서 변경값을 보여준다. snapshot은 진짜 가격 보장이나 예약 확정 정보가 아니다.

## 5. LocalStorage 저장 규칙

유일한 예약 저장 키: `lessonconnect:bookings:v1`. 값은 `BookingStoreV1` 전체를 JSON으로 직렬화한다. UI 필터·미저장 폼·음악 취향은 이 키에 섞지 않는다. 초기화 여부를 별도 키에 저장하지 않아 두 키의 불일치를 피한다.

1. 브라우저 마운트 후 `initialize()`를 호출한다. SSR·모듈 import 중 `window` 또는 LocalStorage를 읽지 않는다.
2. `getItem`이 null인 최초 초기화만 시드 대상이다. revision=1, initializedAt=now, seedVersion=1, 예약 1건을 한 번의 `setItem`으로 저장한다.
3. 시드는 김민준 상품, A 레슨실, 서울 기준 오늘+7일 19:00, 60분, memo 빈 값, source=seed, scheduled로 생성한다. 고정된 2026년 9월 Figma 날짜를 저장하지 않는다. UUID·시각은 최초 저장 후 유지한다.
4. 기존 키가 있으면 파싱·버전·스키마 검증 후 그대로 읽는다. `bookings: []`는 정상 초기화된 빈 저장소이며 재시드하지 않는다.
5. 개발 모드의 반복 mount·Strict Mode에서도 매번 키를 다시 읽고 중복 시드하지 않는다. 같은 앱 인스턴스의 initialize는 공유 Promise로 중복 실행을 막는다.
6. 전체 삭제 후에도 envelope와 초기화 정보는 유지한다. 예약 CRUD는 `removeItem`이나 `localStorage.clear()`를 사용하지 않는다.
7. 실행 중 이미 ready였는데 키가 사라지면 자동 시드하지 않고 `CONFLICT`를 반환한다. 사용자가 새로고침한 뒤 키가 없다면 새 로컬 환경으로 취급한다. 브라우저 데이터 삭제 전의 존재 여부는 복원할 수 없다.

### 쓰기 순서·실패 보호

- `read latest → 버전/스키마/expectedRevision 확인 → 입력/상태 검증 → 메모리에서 다음 전체값 생성 → JSON.stringify → setItem → 성공 상태 발행` 순서다.
- 변경 한 번에 해당 키의 `setItem` 한 번만 사용한다. 먼저 원본을 지우거나 빈 배열을 저장하지 않는다.
- 성공적인 setItem 이후에만 UI 목록·상세 상태와 성공 토스트를 갱신한다. 실패 시 원래 저장값과 폼 입력을 유지한다.
- 읽기 불가와 빈 목록을 구분한다. 메모리 저장으로 조용히 전환해 ‘저장됨’으로 표시하지 않는다.
- `QuotaExceededError`는 `QUOTA_EXCEEDED`, 접근 차단/SecurityError는 `STORAGE_UNAVAILABLE`, 그 외 직렬화·쓰기 오류는 `WRITE_FAILED`로 매핑한다.
- 같은 탭의 쓰기는 직렬화한다. 다른 탭의 `storage` 이벤트에서 다시 읽고, 변경된 폼은 덮어쓰지 않고 충돌 안내를 한다.
- `expectedRevision`은 오래된 편집을 감지하는 낙관적 확인이다. LocalStorage에는 여러 탭을 묶는 트랜잭션/CAS가 없으므로 동시 쓰기의 완전한 무손실 보장을 주장하지 않는다. 이 MVP는 단일 탭 순차 사용을 기준으로 검증한다.

### 버전·손상·복구

- v1만 지원한다. JSON 객체의 schemaVersion이 정수지만 1이 아니면 `UNSUPPORTED_VERSION`, 필드 누락·잘못된 타입·파싱 실패는 `CORRUPT_DATA`다.
- 지원하지 않는 버전·손상 데이터를 초기값으로 덮어쓰거나 시드하지 않는다. 조회/변경을 중단하고 재시도 안내를 한다.
- 현재 범위에는 자동 마이그레이션·리셋 UI가 없다. 필요할 때 원본 보존과 명시적 사용자 확인을 포함한 별도 복구 작업으로 다룬다.
- 이후 첨부 등 계약을 변경할 때 버전 정책과 마이그레이션을 먼저 문서화한다. 새 키로 바꾸고 기존 예약을 못 읽게 만드는 변경을 금지한다.

## 6. 저장소 함수 계약

비동기 인터페이스로 통일하되 LocalStorage 자체는 동기 API다. 저장이 느린 것처럼 보이도록 인위적 지연을 추가하지 않는다. 반환 객체는 복사본으로 제공해 UI 변이가 저장소를 우회하지 못하게 한다.

```ts
interface BookingRepository {
  initialize(): Promise<StoreResult<BookingListData>>;
  getBookings(): Promise<StoreResult<BookingListData>>;
  getBooking(id: BookingId): Promise<StoreResult<BookingData>>;
  createBooking(input: BookingInput, expectedRevision: number): Promise<StoreResult<BookingData>>;
  updateBooking(id: BookingId, input: BookingInput, expectedRevision: number): Promise<StoreResult<BookingData>>;
  cancelBooking(id: BookingId, expectedRevision: number): Promise<StoreResult<BookingData>>;
  deleteBooking(id: BookingId, expectedRevision: number): Promise<StoreResult<{ deletedId: BookingId; revision: number }>>;
}
```

| 함수 | 상세 계약 |
|---|---|
| `initialize` | 최초 시드 또는 검증된 기존 목록 반환. 서버에서는 NOT_READY. 재호출은 기존값 조회이며 쓰기 없음 |
| `getBookings` | ready 이후 최신값 검증·조회. 초기화 전 NOT_READY. 기본 정렬은 서울 레슨 시작 오름차순, 동률 id 오름차순. 전체 목록 반환; 탐색·페이지 로직은 8단계 |
| `getBooking` | 검증된 최신 저장소에서 ID 조회. 없는/잘못된 ID는 NOT_FOUND. 손상·저장 접근 오류를 NOT_FOUND로 바꾸지 않음 |
| `createBooking` | 입력 전체 검증, ID·snapshot·시각·scheduled·source=user 생성. revision+1 저장 후 생성 레코드 반환 |
| `updateBooking` | 시작 전 scheduled만 가능. input은 전체 편집값, 누락 memo는 빈 문자열. id/createdAt/source/status 유지. 변경이 없으면 쓰기·updatedAt/revision 갱신 없이 성공 |
| `cancelBooking` | 시작 전 scheduled만 취소. id/createdAt/snapshot 등 유지. fresh revision에서 이미 cancelled면 무변경 성공. 진행 중·종료는 INVALID_TRANSITION |
| `deleteBooking` | cancelled 또는 시간이 종료된 scheduled만 가능. 해당 레코드만 제거, revision+1. 없는 ID는 NOT_FOUND. 최종 0건도 envelope 유지 |

모든 변경 함수는 revision 확인 후 대상 존재·상태·입력을 검증한다. 실패는 StoreResult 오류로 반환한다. UI는 오류일 때 이동하지 않는다. 카탈로그는 `getBookingCatalog(): BookingCatalog` 같은 읽기 전용 함수로 별도 제공하고, 테스트에서는 저장소·현재 시각·ID 생성기를 주입 가능하게 구성한다. 특정 상태 관리 라이브러리를 새로 강제하지 않는다.

### 오류 메시지 기본값

| 코드/상황 | 사용자 문구·행동 |
|---|---|
| NOT_READY | 초기화 중 UI. 재시도 없이 준비 완료를 기다림 |
| STORAGE_UNAVAILABLE | 이 브라우저에서 예약을 저장하거나 불러올 수 없어요. 브라우저 설정을 확인한 뒤 다시 시도해주세요. |
| CORRUPT_DATA | 저장된 예약 정보를 읽을 수 없어요. 기존 데이터는 변경하지 않았어요. |
| UNSUPPORTED_VERSION | 현재 앱에서 지원하지 않는 예약 데이터예요. 앱 버전을 확인해주세요. |
| QUOTA_EXCEEDED | 저장 공간이 부족해요. 입력 내용은 유지했어요. |
| WRITE_FAILED | 저장하지 못했어요. 입력 내용을 확인하고 다시 시도해주세요. |
| NOT_FOUND | 예약을 찾을 수 없어요. / 예약 목록 보기 |
| INVALID_TRANSITION | 현재 상태에서는 이 작업을 할 수 없어요. 예약 정보를 다시 확인해주세요. |
| CONFLICT | 다른 화면에서 예약 정보가 변경됐어요. 새 정보를 확인한 뒤 다시 시도해주세요. |
| LOCAL_TIME_CONFLICT | 같은 시간에 저장된 레슨이 있어요. 다른 시간을 선택해주세요. |
| offerId/spaceId 오류 | 레슨을 선택해주세요. / 이용할 공간을 선택해주세요. |
| 날짜·시각 오류 | 예약 가능한 미래 날짜와 시간을 선택해주세요. |
| memo 초과 | 메모는 500자까지 입력할 수 있어요. |
| 확인 체크 누락 | 예약 내용과 이용 안내를 확인해주세요. |

## 7. 저장 범위와 제출 설명

- 데이터는 같은 브라우저 프로필의 같은 origin(프로토콜·호스트·포트)에 저장된다. 경로가 달라도 같은 origin이면 공유한다.
- localhost, 미리보기 배포 주소, 정식 배포 주소는 각각 다른 저장소일 수 있다. 기기·브라우저 간 동기화는 없다.
- 브라우저 데이터 삭제·비공개 모드 종료·저장 정책 등에 따라 데이터가 사라질 수 있다. 암호화된 서버 보관이나 복구를 제공하지 않는다.
- 실제 개인정보·결제정보는 수집하지 않는다. 강사 검증·가격·가용 시간은 화면 예시임을 유지한다.
- 원래 과제의 Supabase DB/Storage/RLS 및 서버 데이터 처리 요구사항은 사용자 지시에 따라 LocalStorage 구조·클라이언트 CRUD로 대체했다. 원래 서버 요건까지 충족했다고 제출 문서에 쓰지 않는다.
