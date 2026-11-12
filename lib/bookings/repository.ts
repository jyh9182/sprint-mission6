// LocalStorage 예약 저장소 — design/data-contract.md §5~6, §8(v2 참고 이미지·v1 마이그레이션).
// 이 모듈만 LocalStorage에 접근한다. import 시점에는 window를 읽지 않는다.

import { getBookingCatalog, SEED_DAYS_AHEAD, SEED_OFFER_ID, SEED_SPACE_ID, SEED_START_TIME } from './catalog';
import { ERROR_MESSAGES } from './messages';
import { addDays, getBookingPhase, lessonWindow, seoulDate } from './time';
import type {
  BookingCatalog,
  BookingData,
  BookingField,
  BookingId,
  BookingInput,
  BookingListData,
  BookingRepository,
  BookingStoreV2,
  DeleteBookingData,
  LessonBooking,
  StoreErrorCode,
  StoreResult,
} from './types';
import { sameReferenceImage } from './reference-image';
import { buildSnapshot, isUuidV4, parseStoreValue, parseStoreValueV1, validateBookingInput } from './validation';

/** 활성 키. 예약과 참고 이미지를 같은 envelope에 저장한다. */
export const BOOKING_STORAGE_KEY = 'lessonconnect:bookings:v2';
/** v1 키는 마이그레이션 원본으로 읽기만 한다. 쓰거나 자동 삭제하지 않는다. */
export const LEGACY_BOOKING_STORAGE_KEY = 'lessonconnect:bookings:v1';

/** 테스트 대역과 실제 localStorage 모두 만족하는 최소 인터페이스. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export interface BookingRepositoryOptions {
  /** null을 반환하면 브라우저 밖(SSR)으로 보고 NOT_READY. 예외는 STORAGE_UNAVAILABLE. */
  getStorage?: () => StorageLike | null;
  now?: () => Date;
  generateId?: () => string;
  catalog?: BookingCatalog;
}

type Failure = { ok: false; error: { code: StoreErrorCode; message: string; fieldErrors?: Partial<Record<BookingField, string>> } };
type ReadResult = { ok: true; store: BookingStoreV2 | null } | Failure;
type Plan<T> = { ok: true; data: T; next?: BookingStoreV2 } | Failure;

function fail(code: StoreErrorCode, fieldErrors?: Partial<Record<BookingField, string>>): Failure {
  return { ok: false, error: fieldErrors ? { code, message: ERROR_MESSAGES[code], fieldErrors } : { code, message: ERROR_MESSAGES[code] } };
}

function defaultGetStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage; // 접근이 차단되면 SecurityError를 던진다
}

/**
 * UUID v4 생성. crypto.randomUUID는 보안 컨텍스트(https·localhost)에서만 존재하므로
 * LAN IP의 http 개발 서버 등에서는 getRandomValues로 같은 형식을 만든다.
 */
export function generateUuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function mapWriteError(error: unknown): StoreErrorCode {
  const e = error as { name?: unknown; code?: unknown } | null;
  const name = typeof e?.name === 'string' ? e.name : '';
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || e?.code === 22 || e?.code === 1014) return 'QUOTA_EXCEEDED';
  if (name === 'SecurityError') return 'STORAGE_UNAVAILABLE';
  return 'WRITE_FAILED';
}

function sortBookings(bookings: LessonBooking[]): LessonBooking[] {
  return [...bookings].sort((a, b) => lessonWindow(a).start - lessonWindow(b).start || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function overlapsOther(store: BookingStoreV2, date: string, startTime: string, excludeId?: string): boolean {
  const target = lessonWindow({ date, startTime });
  return store.bookings.some((b) => {
    if (b.id === excludeId || b.status === 'cancelled') return false;
    const other = lessonWindow(b);
    return target.start < other.end && other.start < target.end; // 맞닿은 경계는 허용
  });
}

/** 시계가 뒤로 가더라도 createdAt ≤ updatedAt 불변식을 지킨다. */
function laterIso(nowIso: string, previous: string): string {
  return nowIso > previous ? nowIso : previous;
}

export function createBookingRepository(options: BookingRepositoryOptions = {}): BookingRepository {
  const getStorage = options.getStorage ?? defaultGetStorage;
  const clock = options.now ?? (() => new Date());
  const generateId = options.generateId ?? generateUuidV4;
  const catalog = options.catalog ?? getBookingCatalog();
  const listeners = new Set<() => void>();

  let ready = false;
  let initPromise: Promise<StoreResult<BookingListData>> | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  /** 같은 인스턴스의 읽기·쓰기를 순서대로 실행한다. */
  function serialize<T>(task: () => StoreResult<T>, onUnexpected: StoreErrorCode): Promise<StoreResult<T>> {
    const safeTask = (): StoreResult<T> => {
      try {
        return task();
      } catch {
        return fail(onUnexpected);
      }
    };
    const run = queue.then(safeTask, safeTask);
    queue = run.catch(() => undefined);
    return run;
  }

  function resolveStorage(): { ok: true; storage: StorageLike } | Failure {
    let storage: StorageLike | null;
    try {
      storage = getStorage();
    } catch {
      return fail('STORAGE_UNAVAILABLE');
    }
    return storage ? { ok: true, storage } : fail('NOT_READY');
  }

  function getRaw(storage: StorageLike, key: string): { ok: true; raw: string | null } | Failure {
    try {
      return { ok: true, raw: storage.getItem(key) };
    } catch {
      return fail('STORAGE_UNAVAILABLE');
    }
  }

  function read(storage: StorageLike): ReadResult {
    const got = getRaw(storage, BOOKING_STORAGE_KEY);
    if (!got.ok) return got;
    const raw = got.raw;
    if (raw === null) return { ok: true, store: null };
    const parsed = parseStoreValue(raw);
    if (parsed.kind === 'unsupported-version') return fail('UNSUPPORTED_VERSION');
    if (parsed.kind === 'corrupt') return fail('CORRUPT_DATA');
    return { ok: true, store: parsed.store };
  }

  /** 다음 전체값을 한 번의 setItem으로 저장한다. 원본을 먼저 지우지 않는다. */
  function write(storage: StorageLike, next: BookingStoreV2): { ok: true } | Failure {
    let json: string;
    try {
      json = JSON.stringify(next);
    } catch {
      return fail('WRITE_FAILED');
    }
    try {
      storage.setItem(BOOKING_STORAGE_KEY, json);
    } catch (error) {
      return fail(mapWriteError(error));
    }
    return { ok: true };
  }

  function emit() {
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
        // 구독자 오류가 저장 결과를 바꾸지 않게 한다
      }
    }
  }

  function listData(store: BookingStoreV2): StoreResult<BookingListData> {
    return { ok: true, data: structuredClone({ bookings: sortBookings(store.bookings), revision: store.revision }) };
  }

  /** ready 이후 최신값 읽기. 실행 중 키가 사라졌으면 자동 시드하지 않고 CONFLICT. */
  function readReady(): { ok: true; storage: StorageLike; store: BookingStoreV2 } | Failure {
    if (!ready) return fail('NOT_READY');
    const resolved = resolveStorage();
    if (!resolved.ok) return resolved;
    const result = read(resolved.storage);
    if (!result.ok) return result;
    if (!result.store) return fail('CONFLICT');
    return { ok: true, storage: resolved.storage, store: result.store };
  }

  function mutate<T>(expectedRevision: number, plan: (store: BookingStoreV2, now: Date) => Plan<T>): Promise<StoreResult<T>> {
    return serialize<T>(() => {
      const current = readReady();
      if (!current.ok) return current;
      if (current.store.revision !== expectedRevision) return fail('CONFLICT');
      const result = plan(current.store, clock());
      if (!result.ok) return result;
      if (result.next) {
        const written = write(current.storage, result.next);
        if (!written.ok) return written;
        emit();
      }
      return { ok: true, data: structuredClone(result.data) };
    }, 'WRITE_FAILED');
  }

  function findBooking(store: BookingStoreV2, id: unknown): LessonBooking | undefined {
    return isUuidV4(id) ? store.bookings.find((b) => b.id === id) : undefined;
  }

  function nextRevision(store: BookingStoreV2): number | null {
    const revision = store.revision + 1;
    return Number.isSafeInteger(revision) ? revision : null;
  }

  function initializeTask(): StoreResult<BookingListData> {
    const resolved = resolveStorage();
    if (!resolved.ok) return resolved;
    const result = read(resolved.storage);
    if (!result.ok) return result;
    if (result.store) {
      ready = true;
      return listData(result.store);
    }

    // v2가 없고 v1이 있으면: v1을 기존 검증기로 엄격하게 확인한 뒤 referenceImage:null만 추가해 한 번에 쓴다.
    // 빈 배열도 그대로 옮기며 재시드하지 않는다. 쓰기 실패 시 v1은 그대로이고 준비 완료로 표시하지 않는다.
    const legacy = getRaw(resolved.storage, LEGACY_BOOKING_STORAGE_KEY);
    if (!legacy.ok) return legacy;
    if (legacy.raw !== null) {
      const parsed = parseStoreValueV1(legacy.raw);
      if (parsed.kind === 'unsupported-version') return fail('UNSUPPORTED_VERSION');
      if (parsed.kind === 'corrupt') return fail('CORRUPT_DATA');
      const v1 = parsed.store;
      const migrated: BookingStoreV2 = {
        schemaVersion: 2,
        revision: v1.revision,
        initializedAt: v1.initializedAt,
        seedVersion: v1.seedVersion,
        bookings: v1.bookings.map((booking) => ({ ...booking, referenceImage: null })),
      };
      const written = write(resolved.storage, migrated);
      if (!written.ok) return written;
      ready = true;
      emit();
      return listData(migrated);
    }

    // v1·v2 모두 없는 최초 초기화만 시드한다. 빈 배열 저장소는 위에서 그대로 반환된다.
    const now = clock();
    const nowIso = now.toISOString();
    const offer = catalog.offers.find((o) => o.id === SEED_OFFER_ID);
    const space = catalog.spaces.find((s) => s.id === SEED_SPACE_ID);
    const instructor = offer && catalog.instructors.find((i) => i.id === offer.instructorId);
    const id = generateId();
    if (!offer || !space || !instructor || !isUuidV4(id)) return fail('WRITE_FAILED');
    const seed: LessonBooking = {
      id,
      offerId: offer.id,
      instructorId: instructor.id,
      spaceId: space.id,
      catalogVersion: catalog.version,
      snapshot: buildSnapshot(offer, space, instructor.name),
      date: addDays(seoulDate(now.getTime()), SEED_DAYS_AHEAD),
      startTime: SEED_START_TIME,
      timeZone: 'Asia/Seoul',
      memo: '',
      status: 'scheduled',
      source: 'seed',
      createdAt: nowIso,
      updatedAt: nowIso,
      cancelledAt: null,
      referenceImage: null,
    };
    const store: BookingStoreV2 = { schemaVersion: 2, revision: 1, initializedAt: nowIso, seedVersion: 1, bookings: [seed] };
    const written = write(resolved.storage, store);
    if (!written.ok) return written;
    ready = true;
    emit();
    return listData(store);
  }

  const repository: BookingRepository = {
    initialize() {
      if (initPromise) return initPromise; // Strict Mode 등 동시 호출은 같은 Promise 공유
      if (ready) return repository.getBookings(); // 재호출은 쓰기 없는 조회
      const pending = serialize(initializeTask, 'STORAGE_UNAVAILABLE');
      initPromise = pending;
      void pending.finally(() => {
        if (initPromise === pending) initPromise = null; // 실패 시 재시도 가능
      });
      return pending;
    },

    getBookings() {
      return serialize(() => {
        const current = readReady();
        return current.ok ? listData(current.store) : current;
      }, 'STORAGE_UNAVAILABLE');
    },

    getBooking(id: BookingId) {
      return serialize<BookingData>(() => {
        const current = readReady();
        if (!current.ok) return current; // 저장소 오류를 NOT_FOUND로 바꾸지 않는다
        const booking = findBooking(current.store, id);
        if (!booking) return fail('NOT_FOUND');
        return { ok: true, data: structuredClone({ booking, revision: current.store.revision }) };
      }, 'STORAGE_UNAVAILABLE');
    },

    createBooking(input: BookingInput, expectedRevision: number) {
      return mutate<BookingData>(expectedRevision, (store, now) => {
        const validation = validateBookingInput(input, catalog, now);
        if (!validation.ok) return fail('VALIDATION_ERROR', validation.fieldErrors);
        const v = validation.value;
        if (overlapsOther(store, v.date, v.startTime)) return fail('LOCAL_TIME_CONFLICT');
        const revision = nextRevision(store);
        const id = generateId();
        if (revision === null || !isUuidV4(id) || findBooking(store, id)) return fail('WRITE_FAILED');
        const nowIso = now.toISOString();
        const booking: LessonBooking = {
          id,
          offerId: v.offer.id,
          instructorId: v.offer.instructorId,
          spaceId: v.space.id,
          catalogVersion: catalog.version,
          snapshot: buildSnapshot(v.offer, v.space, v.instructorName),
          date: v.date,
          startTime: v.startTime,
          timeZone: 'Asia/Seoul',
          memo: v.memo,
          status: 'scheduled',
          source: 'user',
          createdAt: nowIso,
          updatedAt: nowIso,
          cancelledAt: null,
          referenceImage: v.referenceImageChange.kind === 'replace' ? v.referenceImageChange.image : null,
        };
        const next: BookingStoreV2 = { ...store, revision, bookings: [...store.bookings, booking] };
        return { ok: true, data: { booking, revision }, next };
      });
    },

    updateBooking(id: BookingId, input: BookingInput, expectedRevision: number) {
      return mutate<BookingData>(expectedRevision, (store, now) => {
        const existing = findBooking(store, id);
        if (!existing) return fail('NOT_FOUND');
        if (getBookingPhase(existing, now) !== 'upcoming') return fail('INVALID_TRANSITION');
        const validation = validateBookingInput(input, catalog, now);
        if (!validation.ok) return fail('VALIDATION_ERROR', validation.fieldErrors);
        const v = validation.value;
        const change = v.referenceImageChange;
        const referenceImage = change.kind === 'replace' ? change.image : change.kind === 'remove' ? null : existing.referenceImage;

        const unchanged =
          v.offer.id === existing.offerId &&
          v.space.id === existing.spaceId &&
          v.date === existing.date &&
          v.startTime === existing.startTime &&
          v.memo === existing.memo &&
          sameReferenceImage(referenceImage, existing.referenceImage);
        if (unchanged) return { ok: true, data: { booking: existing, revision: store.revision } };

        if (overlapsOther(store, v.date, v.startTime, existing.id)) return fail('LOCAL_TIME_CONFLICT');
        const revision = nextRevision(store);
        if (revision === null) return fail('WRITE_FAILED');

        // 상품·공간이 같으면 snapshot 유지, 하나라도 바뀌면 최신 카탈로그로 전체 재구성
        const sameLesson = v.offer.id === existing.offerId && v.space.id === existing.spaceId;
        const booking: LessonBooking = {
          ...existing,
          offerId: v.offer.id,
          spaceId: v.space.id,
          instructorId: sameLesson ? existing.instructorId : v.offer.instructorId,
          catalogVersion: sameLesson ? existing.catalogVersion : catalog.version,
          snapshot: sameLesson ? existing.snapshot : buildSnapshot(v.offer, v.space, v.instructorName),
          date: v.date,
          startTime: v.startTime,
          memo: v.memo,
          referenceImage,
          updatedAt: laterIso(now.toISOString(), existing.updatedAt),
        };
        const next: BookingStoreV2 = { ...store, revision, bookings: store.bookings.map((b) => (b.id === existing.id ? booking : b)) };
        return { ok: true, data: { booking, revision }, next };
      });
    },

    cancelBooking(id: BookingId, expectedRevision: number) {
      return mutate<BookingData>(expectedRevision, (store, now) => {
        const existing = findBooking(store, id);
        if (!existing) return fail('NOT_FOUND');
        if (existing.status === 'cancelled') return { ok: true, data: { booking: existing, revision: store.revision } };
        if (getBookingPhase(existing, now) !== 'upcoming') return fail('INVALID_TRANSITION');
        const revision = nextRevision(store);
        if (revision === null) return fail('WRITE_FAILED');
        const at = laterIso(now.toISOString(), existing.updatedAt);
        const booking: LessonBooking = { ...existing, status: 'cancelled', cancelledAt: at, updatedAt: at };
        const next: BookingStoreV2 = { ...store, revision, bookings: store.bookings.map((b) => (b.id === existing.id ? booking : b)) };
        return { ok: true, data: { booking, revision }, next };
      });
    },

    deleteBooking(id: BookingId, expectedRevision: number) {
      return mutate<DeleteBookingData>(expectedRevision, (store, now) => {
        const existing = findBooking(store, id);
        if (!existing) return fail('NOT_FOUND');
        const phase = getBookingPhase(existing, now);
        if (phase !== 'cancelled' && phase !== 'ended') return fail('INVALID_TRANSITION');
        const revision = nextRevision(store);
        if (revision === null) return fail('WRITE_FAILED');
        // 0건이 되어도 envelope(초기화 정보)는 유지해 재시드되지 않게 한다
        const next: BookingStoreV2 = { ...store, revision, bookings: store.bookings.filter((b) => b.id !== existing.id) };
        return { ok: true, data: { deletedId: existing.id, revision }, next };
      });
    },

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return repository;
}

let sharedRepository: BookingRepository | null = null;

/** 앱 인스턴스에서 공유하는 저장소. 생성만 하고 브라우저 API는 호출 시점에 접근한다. */
export function getBookingRepository(): BookingRepository {
  sharedRepository ??= createBookingRepository();
  return sharedRepository;
}
