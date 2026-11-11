import { FIELD_MESSAGES } from './messages';
import { endsSameSeoulDay, isValidISOInstant, isValidLocalDate, isValidLocalTime, seoulStartMs } from './time';
import {
  GENRE_IDS,
  type BookingCatalog,
  type BookingField,
  type BookingStoreV1,
  type LessonBooking,
  type LessonOfferReference,
  type LessonSnapshot,
  type SpaceReference,
} from './types';

export const MEMO_MAX_CODE_POINTS = 500;
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_RE.test(value);
}

// ---------------------------------------------------------------------------
// 읽기 검증: 저장 구조·필드 타입·형식·상태 불변식만 본다.
// 과거 날짜나 카탈로그에서 사라진 ID는 손상으로 보지 않는다.
// ---------------------------------------------------------------------------

export type ParsedStore =
  | { kind: 'ok'; store: BookingStoreV1 }
  | { kind: 'unsupported-version' }
  | { kind: 'corrupt' };

export function parseStoreValue(raw: string): ParsedStore {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { kind: 'corrupt' };
  }
  if (!isRecord(value)) return { kind: 'corrupt' };
  if (Number.isInteger(value.schemaVersion) && value.schemaVersion !== 1) return { kind: 'unsupported-version' };
  return isValidStore(value) ? { kind: 'ok', store: value } : { kind: 'corrupt' };
}

function isValidStore(value: Record<string, unknown>): value is BookingStoreV1 & Record<string, unknown> {
  if (value.schemaVersion !== 1 || value.seedVersion !== 1) return false;
  if (!isPositiveSafeInt(value.revision)) return false;
  if (!isValidISOInstant(value.initializedAt)) return false;
  if (!Array.isArray(value.bookings)) return false;
  const ids = new Set<string>();
  for (const booking of value.bookings) {
    if (!isValidStoredBooking(booking)) return false;
    const key = booking.id.toLowerCase();
    if (ids.has(key)) return false;
    ids.add(key);
  }
  return true;
}

function isValidStoredBooking(value: unknown): value is LessonBooking {
  if (!isRecord(value)) return false;
  if (!isUuidV4(value.id)) return false;
  if (!isNonEmptyString(value.offerId) || !isNonEmptyString(value.instructorId) || !isNonEmptyString(value.spaceId)) return false;
  if (!isNonEmptyString(value.catalogVersion)) return false;
  if (!isValidSnapshot(value.snapshot)) return false;
  if (!isValidLocalDate(value.date) || !isValidLocalTime(value.startTime)) return false;
  if (value.timeZone !== 'Asia/Seoul') return false;
  if (typeof value.memo !== 'string' || value.memo !== value.memo.trim() || codePointLength(value.memo) > MEMO_MAX_CODE_POINTS) return false;
  if (value.source !== 'user' && value.source !== 'seed') return false;
  if (!isValidISOInstant(value.createdAt) || !isValidISOInstant(value.updatedAt)) return false;
  if (value.createdAt > value.updatedAt) return false;
  if (value.status === 'scheduled') return value.cancelledAt === null;
  if (value.status === 'cancelled') {
    return isValidISOInstant(value.cancelledAt) && value.createdAt <= value.cancelledAt && value.cancelledAt <= value.updatedAt;
  }
  return false;
}

function isValidSnapshot(value: unknown): value is LessonSnapshot {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.instructorName) &&
    isNonEmptyString(value.instrumentId) &&
    isNonEmptyString(value.instrumentLabel) &&
    isValidGenres(value.genres) &&
    isNonEmptyString(value.studioName) &&
    isNonEmptyString(value.roomName) &&
    Array.isArray(value.equipmentLabels) &&
    value.equipmentLabels.every((label) => typeof label === 'string') &&
    isNonNegativeSafeInt(value.examplePriceKRW) &&
    value.currency === 'KRW' &&
    value.durationMinutes === 60
  );
}

function isValidGenres(value: unknown): boolean {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) return false;
  if (!value.every((g) => (GENRE_IDS as readonly unknown[]).includes(g))) return false;
  return new Set(value).size === value.length;
}

// ---------------------------------------------------------------------------
// 입력 검증: 생성·수정 시 활성 카탈로그와 현재 시각 기준으로 확인한다.
// ---------------------------------------------------------------------------

export interface NormalizedInput {
  offer: LessonOfferReference;
  space: SpaceReference;
  instructorName: string;
  date: string;
  startTime: string;
  memo: string;
}

export type InputValidation =
  | { ok: true; value: NormalizedInput }
  | { ok: false; fieldErrors: Partial<Record<BookingField, string>> };

export function validateBookingInput(input: unknown, catalog: BookingCatalog, now: Date): InputValidation {
  const fieldErrors: Partial<Record<BookingField, string>> = {};
  const raw = isRecord(input) ? input : {};

  const offer = catalog.offers.find((o) => o.id === raw.offerId && o.active);
  const instructor = offer && catalog.instructors.find((i) => i.id === offer.instructorId && i.active);
  if (!offer || !instructor) fieldErrors.offerId = FIELD_MESSAGES.offerId;

  const space = catalog.spaces.find((s) => s.id === raw.spaceId && s.active);
  if (!space || (offer && !offer.allowedSpaceIds.includes(space.id))) fieldErrors.spaceId = FIELD_MESSAGES.spaceId;

  const dateOk = isValidLocalDate(raw.date);
  const timeOk = isValidLocalTime(raw.startTime) && catalog.demoStartTimes.includes(raw.startTime) && endsSameSeoulDay(raw.startTime);
  if (!dateOk) fieldErrors.date = FIELD_MESSAGES.dateTime;
  if (!timeOk) fieldErrors.startTime = FIELD_MESSAGES.dateTime;
  if (dateOk && timeOk && seoulStartMs(raw.date as string, raw.startTime as string) <= now.getTime()) {
    fieldErrors.date = FIELD_MESSAGES.dateTime;
    fieldErrors.startTime = FIELD_MESSAGES.dateTime;
  }

  let memo = '';
  if (raw.memo !== undefined) {
    if (typeof raw.memo !== 'string') fieldErrors.memo = FIELD_MESSAGES.memo;
    else {
      memo = raw.memo.trim();
      if (codePointLength(memo) > MEMO_MAX_CODE_POINTS) fieldErrors.memo = FIELD_MESSAGES.memo;
    }
  }

  if (raw.acknowledged !== true) fieldErrors.acknowledged = FIELD_MESSAGES.acknowledged;

  if (Object.keys(fieldErrors).length > 0 || !offer || !instructor || !space) return { ok: false, fieldErrors };
  return {
    ok: true,
    value: { offer, space, instructorName: instructor.name, date: raw.date as string, startTime: raw.startTime as string, memo },
  };
}

export function buildSnapshot(offer: LessonOfferReference, space: SpaceReference, instructorName: string): LessonSnapshot {
  return {
    instructorName,
    instrumentId: offer.instrumentId,
    instrumentLabel: offer.instrumentLabel,
    genres: [...offer.genres],
    studioName: space.studioName,
    roomName: space.roomName,
    equipmentLabels: [...space.equipmentLabels],
    examplePriceKRW: offer.examplePriceKRW,
    currency: 'KRW',
    durationMinutes: 60,
  };
}

// ---------------------------------------------------------------------------

export function codePointLength(value: string): number {
  return Array.from(value).length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPositiveSafeInt(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

function isNonNegativeSafeInt(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
