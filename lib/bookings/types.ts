// 레슨커넥트AI 예약 데이터 타입 — design/data-contract.md v1 + §8 v2(참고 이미지) 기준

export type BookingId = string; // crypto.randomUUID()로 생성한 UUID v4
export type ISOInstant = string; // UTC ISO 8601, 예: 2026-11-11T09:00:00.000Z
export type LocalDate = string; // 실제 존재하는 날짜, YYYY-MM-DD
export type LocalTime = string; // 24시간제 HH:mm
export type BookingStatus = 'scheduled' | 'cancelled';

export const GENRE_IDS = [
  'rock', 'pop', 'jazz', 'blues', 'rnb', 'k-pop', 'funk',
  'ballad', 'indie', 'metal', 'classical', 'new-age', 'edm',
] as const;
export type GenreId = (typeof GENRE_IDS)[number];

export interface InstructorReference {
  id: string;
  name: string;
  active: boolean;
}

export interface LessonOfferReference {
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

export interface SpaceReference {
  id: string;
  studioName: string;
  roomName: string;
  equipmentLabels: string[];
  active: boolean;
}

export interface BookingCatalog {
  version: '1';
  instructors: readonly InstructorReference[];
  offers: readonly LessonOfferReference[];
  spaces: readonly SpaceReference[];
  demoStartTimes: readonly LocalTime[];
}

export interface LessonSnapshot {
  instructorName: string;
  instrumentId: string;
  instrumentLabel: string;
  genres: GenreId[];
  studioName: string;
  roomName: string;
  equipmentLabels: string[];
  examplePriceKRW: number;
  currency: 'KRW';
  durationMinutes: 60;
}

export interface LessonBooking {
  id: BookingId;
  offerId: string;
  instructorId: string;
  spaceId: string;
  catalogVersion: string;
  snapshot: LessonSnapshot;
  date: LocalDate;
  startTime: LocalTime;
  timeZone: 'Asia/Seoul';
  memo: string; // 미입력은 빈 문자열
  status: BookingStatus;
  source: 'user' | 'seed';
  createdAt: ISOInstant;
  updatedAt: ISOInstant;
  cancelledAt: ISOInstant | null;
  /** v2 필수 키. 첨부가 없으면 null. 예약 삭제 시 레코드와 함께 사라진다. */
  referenceImage: ReferenceImage | null;
}

// ---------------------------------------------------------------------------
// 9단계 참고 이미지 — design/data-contract.md §8
// ---------------------------------------------------------------------------

export type ReferenceImageSourceMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ReferenceImage {
  fileName: string; // 안전한 기본 이름: 경로·제어문자 제거, 1~120 code point
  originalMimeType: ReferenceImageSourceMime; // 시그니처로 확인한 원본 형식
  originalSizeBytes: number; // 원본 File.size, 1..2 MiB
  mimeType: 'image/webp'; // 변환 결과 실제 MIME
  sizeBytes: number; // 변환 Blob.size, 1..500 KiB
  width: number; // 변환 결과 픽셀
  height: number; // max(width, height) <= 1280
  dataUrl: string; // data:image/webp;base64,<변환 바이트>
}

/** 폼 draft 명령. 저장 레코드에는 들어가지 않는다. */
export type ReferenceImageChange =
  | { kind: 'keep' }
  | { kind: 'replace'; image: ReferenceImage }
  | { kind: 'remove' };

/** v1 레코드(마이그레이션 입력 전용). */
export type LessonBookingV1 = Omit<LessonBooking, 'referenceImage'>;

export interface BookingStoreV1 {
  schemaVersion: 1;
  revision: number; // 1부터 시작, 성공적인 변경마다 +1
  initializedAt: ISOInstant;
  seedVersion: 1;
  bookings: LessonBookingV1[];
}

/** 활성 저장 envelope(`lessonconnect:bookings:v2`). */
export interface BookingStoreV2 {
  schemaVersion: 2;
  revision: number;
  initializedAt: ISOInstant;
  seedVersion: 1;
  bookings: LessonBooking[];
}

export interface BookingInput {
  offerId: string;
  spaceId: string;
  date: LocalDate;
  startTime: LocalTime;
  memo?: string; // 저장소가 trim, 누락은 ""
  acknowledged: true; // 확인 체크 — 저장 레코드에는 포함하지 않음
  /** 생략·keep: 생성은 null, 수정은 기존 유지. replace: 교체. remove: 저장 성공 시 제거. */
  referenceImageChange?: ReferenceImageChange;
}

export type BookingField = keyof BookingInput;

export type StoreErrorCode =
  | 'NOT_READY'
  | 'STORAGE_UNAVAILABLE'
  | 'CORRUPT_DATA'
  | 'UNSUPPORTED_VERSION'
  | 'QUOTA_EXCEEDED'
  | 'WRITE_FAILED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'CONFLICT'
  | 'LOCAL_TIME_CONFLICT';

export interface StoreError {
  code: StoreErrorCode;
  message: string;
  fieldErrors?: Partial<Record<BookingField, string>>;
}

export type StoreResult<T> = { ok: true; data: T } | { ok: false; error: StoreError };

export interface BookingListData {
  bookings: LessonBooking[];
  revision: number;
}

export interface BookingData {
  booking: LessonBooking;
  revision: number;
}

export interface DeleteBookingData {
  deletedId: BookingId;
  revision: number;
}

/** 시간에서 파생하는 표시 상태. 저장하지 않는다. */
export type BookingPhase = 'upcoming' | 'in-progress' | 'ended' | 'cancelled';

export interface BookingRepository {
  initialize(): Promise<StoreResult<BookingListData>>;
  getBookings(): Promise<StoreResult<BookingListData>>;
  getBooking(id: BookingId): Promise<StoreResult<BookingData>>;
  createBooking(input: BookingInput, expectedRevision: number): Promise<StoreResult<BookingData>>;
  updateBooking(id: BookingId, input: BookingInput, expectedRevision: number): Promise<StoreResult<BookingData>>;
  cancelBooking(id: BookingId, expectedRevision: number): Promise<StoreResult<BookingData>>;
  deleteBooking(id: BookingId, expectedRevision: number): Promise<StoreResult<DeleteBookingData>>;
  /** 성공한 쓰기 이후에만 호출된다. 반환 함수로 구독을 해제한다. */
  subscribe(listener: () => void): () => void;
}
