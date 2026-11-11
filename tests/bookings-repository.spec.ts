// 예약 저장소 계약 검증 (design/steps/01-foundation.md F01~F17).
// 브라우저 없이 Node에서 실행된다. 저장소는 메모리 대역, 시각·ID는 고정값을 주입한다.
import { test, expect } from '@playwright/test';
import { BOOKING_STORAGE_KEY, createBookingRepository, type StorageLike } from '../lib/bookings/repository';
import { getBookingCatalog } from '../lib/bookings/catalog';
import { getBookingPhase, seoulDate } from '../lib/bookings/time';
import type { BookingCatalog, BookingInput, BookingRepository, BookingStoreV1, StoreResult } from '../lib/bookings/types';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  setCalls = 0;
  setError: Error | null = null;
  getError: Error | null = null;
  getItem(key: string) {
    if (this.getError) throw this.getError;
    return this.values.has(key) ? this.values.get(key)! : null;
  }
  setItem(key: string, value: string) {
    if (this.setError) throw this.setError;
    this.setCalls += 1;
    this.values.set(key, String(value));
  }
  raw() {
    return this.values.get(BOOKING_STORAGE_KEY) ?? null;
  }
  json(): BookingStoreV1 {
    return JSON.parse(this.raw()!);
  }
}

function domError(name: string) {
  const e = new Error(name);
  e.name = name;
  return e;
}

// 2026-11-11 12:00 서울 (03:00Z)
const BASE_NOW = Date.parse('2026-11-11T03:00:00.000Z');

function setup(opts: { storage?: MemoryStorage; catalog?: BookingCatalog; now?: number } = {}) {
  const storage = opts.storage ?? new MemoryStorage();
  const clock = { ms: opts.now ?? BASE_NOW };
  let counter = 0;
  const repoFactory = () =>
    createBookingRepository({
      getStorage: () => storage,
      now: () => new Date(clock.ms),
      generateId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
      catalog: opts.catalog,
    });
  return { storage, clock, repo: repoFactory(), newRepo: repoFactory };
}

function unwrap<T>(result: StoreResult<T>): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}`);
  return result.data;
}

function input(over: Partial<BookingInput> = {}): BookingInput {
  return { offerId: 'offer-kim-guitar-60', spaceId: 'space-dongtan-b', date: '2026-11-20', startTime: '18:00', memo: '  첫 레슨  ', acknowledged: true, ...over };
}

async function ready(repo: BookingRepository) {
  return unwrap(await repo.initialize());
}

test.describe('booking repository', () => {
  test('F01 빈 저장소 시드 1건, 반복·동시 초기화에도 같은 ID·시각', async () => {
    const { repo, storage, newRepo, clock } = setup();
    const [a, b] = await Promise.all([repo.initialize(), repo.initialize()]); // Strict Mode 동시 호출
    expect(storage.setCalls).toBe(1);
    const first = unwrap(a);
    expect(unwrap(b)).toEqual(first);
    expect(first.revision).toBe(1);
    expect(first.bookings).toHaveLength(1);
    const seed = first.bookings[0];
    expect(seed).toMatchObject({
      source: 'seed', status: 'scheduled', offerId: 'offer-kim-guitar-60', spaceId: 'space-dongtan-a',
      date: '2026-11-18', startTime: '19:00', memo: '', timeZone: 'Asia/Seoul', cancelledAt: null,
    });
    expect(seed.snapshot).toMatchObject({ instructorName: '김민준', roomName: 'A 레슨실', examplePriceKRW: 50000, currency: 'KRW', durationMinutes: 60 });
    expect(storage.json().initializedAt).toBe(seed.createdAt);

    clock.ms += 86_400_000;
    const again = unwrap(await repo.initialize());
    const reloaded = unwrap(await newRepo().initialize()); // 새로고침 = 새 인스턴스
    expect(again.bookings).toEqual(first.bookings);
    expect(reloaded.bookings).toEqual(first.bookings);
    expect(storage.setCalls).toBe(1);
  });

  test('F02 생성 후 새 repository에서 재조회 — 입력·snapshot 유지, 고유 UUID, revision 증가', async () => {
    const { repo, newRepo } = setup();
    const init = await ready(repo);
    const created = unwrap(await repo.createBooking(input(), init.revision));
    expect(created.revision).toBe(2);
    expect(created.booking).toMatchObject({ source: 'user', status: 'scheduled', memo: '첫 레슨', spaceId: 'space-dongtan-b', instructorId: 'instructor-kim-minjun', catalogVersion: '1' });
    expect(created.booking).not.toHaveProperty('acknowledged');
    expect(created.booking.createdAt).toBe(created.booking.updatedAt);
    expect(created.booking.id).not.toBe(init.bookings[0].id);

    const other = newRepo();
    const list = unwrap(await other.initialize());
    expect(list.revision).toBe(2);
    expect(list.bookings.map((b) => b.id)).toEqual([init.bookings[0].id, created.booking.id]); // 시작 시각 오름차순 (11-18 시드 → 11-20)
    expect(unwrap(await other.getBooking(created.booking.id)).booking).toEqual(created.booking);

    // 반환값 변이가 저장소를 우회하지 못함
    created.booking.memo = '변조';
    expect(unwrap(await repo.getBooking(created.booking.id)).booking.memo).toBe('첫 레슨');
  });

  test('F03 수정 — id/createdAt/source 유지, 새 값과 updatedAt 저장', async () => {
    const { repo, clock } = setup();
    const init = await ready(repo);
    const seed = init.bookings[0];
    clock.ms += 60_000;
    const updated = unwrap(await repo.updateBooking(seed.id, input({ spaceId: 'space-dongtan-a', date: '2026-11-19', startTime: '20:00', memo: '줄\n바꿈' }), 1));
    expect(updated.revision).toBe(2);
    expect(updated.booking).toMatchObject({ id: seed.id, createdAt: seed.createdAt, source: 'seed', status: 'scheduled', date: '2026-11-19', startTime: '20:00', memo: '줄\n바꿈' });
    expect(updated.booking.updatedAt).toBe(new Date(clock.ms).toISOString());
    expect(updated.booking.snapshot).toEqual(seed.snapshot); // 상품·공간 동일 → snapshot 유지
    expect(unwrap(await repo.getBooking(seed.id)).booking).toEqual(updated.booking);
  });

  test('F04 시작 전 취소 — cancelled/cancelledAt 기록, 목록에 남음', async () => {
    const { repo, clock } = setup();
    const seed = (await ready(repo)).bookings[0];
    clock.ms += 1000;
    const cancelled = unwrap(await repo.cancelBooking(seed.id, 1));
    const at = new Date(clock.ms).toISOString();
    expect(cancelled.booking).toMatchObject({ status: 'cancelled', cancelledAt: at, updatedAt: at, createdAt: seed.createdAt, snapshot: seed.snapshot });
    const list = unwrap(await repo.getBookings());
    expect(list.bookings).toHaveLength(1);
    expect(getBookingPhase(list.bookings[0], new Date(clock.ms))).toBe('cancelled');
  });

  test('F05 취소된 예약 삭제 — 대상만 제거', async () => {
    const { repo } = setup();
    const seed = (await ready(repo)).bookings[0];
    const created = unwrap(await repo.createBooking(input(), 1));
    unwrap(await repo.cancelBooking(seed.id, created.revision));
    const deleted = unwrap(await repo.deleteBooking(seed.id, 3));
    expect(deleted).toEqual({ deletedId: seed.id, revision: 4 });
    const list = unwrap(await repo.getBookings());
    expect(list.bookings.map((b) => b.id)).toEqual([created.booking.id]);
    // 예정 예약은 먼저 취소해야 삭제 가능
    expect(await repo.deleteBooking(created.booking.id, 4)).toMatchObject({ ok: false, error: { code: 'INVALID_TRANSITION' } });
  });

  test('F06 마지막 예약 삭제 후 새로고침해도 재시드 없음', async () => {
    const { repo, storage, newRepo } = setup();
    const seed = (await ready(repo)).bookings[0];
    unwrap(await repo.cancelBooking(seed.id, 1));
    unwrap(await repo.deleteBooking(seed.id, 2));
    const stored = storage.json();
    expect(stored).toMatchObject({ schemaVersion: 1, seedVersion: 1, revision: 3, bookings: [] });
    const before = storage.setCalls;
    const reloaded = unwrap(await newRepo().initialize());
    expect(reloaded).toEqual({ bookings: [], revision: 3 });
    expect(storage.setCalls).toBe(before);
  });

  test('F07 손상·미지원 버전 — 명시적 오류, 원본 무변경, 재시드 없음', async () => {
    const valid = new MemoryStorage();
    const s = setup({ storage: valid });
    await ready(s.repo);
    unwrap(await s.repo.createBooking(input(), 1));
    const good = valid.json();

    const cases: Array<[string, string, string]> = [
      ['parse', '{not json', 'CORRUPT_DATA'],
      ['array root', '[]', 'CORRUPT_DATA'],
      ['missing field', JSON.stringify({ ...good, bookings: [{ ...good.bookings[0], snapshot: undefined }] }), 'CORRUPT_DATA'],
      ['bad date', JSON.stringify({ ...good, bookings: [{ ...good.bookings[0], date: '2026-02-30' }] }), 'CORRUPT_DATA'],
      ['bad status invariant', JSON.stringify({ ...good, bookings: [{ ...good.bookings[0], status: 'cancelled', cancelledAt: null }] }), 'CORRUPT_DATA'],
      ['duplicate id', JSON.stringify({ ...good, bookings: [good.bookings[0], good.bookings[0]] }), 'CORRUPT_DATA'],
      ['missing schemaVersion', JSON.stringify({ ...good, schemaVersion: undefined }), 'CORRUPT_DATA'],
      ['version 2', JSON.stringify({ ...good, schemaVersion: 2 }), 'UNSUPPORTED_VERSION'],
    ];
    for (const [name, raw, code] of cases) {
      const storage = new MemoryStorage();
      storage.values.set(BOOKING_STORAGE_KEY, raw);
      const { repo } = setup({ storage });
      const result = await repo.initialize();
      expect(result, name).toMatchObject({ ok: false, error: { code } });
      expect(await repo.getBookings(), name).toMatchObject({ ok: false, error: { code: 'NOT_READY' } });
      expect(await repo.createBooking(input(), 1), name).toMatchObject({ ok: false });
      expect(storage.raw(), name).toBe(raw);
      expect(storage.setCalls, name).toBe(0);
    }

    // 실행 중 다른 탭이 손상시킨 경우: 변경 중단, 원본 유지
    valid.values.set(BOOKING_STORAGE_KEY, '{broken');
    expect(await s.repo.getBookings()).toMatchObject({ ok: false, error: { code: 'CORRUPT_DATA' } });
    expect(await s.repo.getBooking(good.bookings[0].id)).toMatchObject({ ok: false, error: { code: 'CORRUPT_DATA' } });
    expect(await s.repo.cancelBooking(good.bookings[0].id, 2)).toMatchObject({ ok: false, error: { code: 'CORRUPT_DATA' } });
    expect(valid.raw()).toBe('{broken');

    // 실행 중 키가 사라지면 자동 시드 대신 CONFLICT
    valid.values.delete(BOOKING_STORAGE_KEY);
    expect(await s.repo.initialize()).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
    expect(await s.repo.createBooking(input(), 2)).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
    expect(valid.raw()).toBeNull();
  });

  test('F08 접근 차단·용량 초과·쓰기 예외 — 오류 반환, 원본 무변경, 성공 이벤트 없음', async () => {
    const blocked = createBookingRepository({ getStorage: () => { throw domError('SecurityError'); } });
    expect(await blocked.initialize()).toMatchObject({ ok: false, error: { code: 'STORAGE_UNAVAILABLE' } });

    const readBlocked = new MemoryStorage();
    readBlocked.getError = domError('SecurityError');
    expect(await setup({ storage: readBlocked }).repo.initialize()).toMatchObject({ ok: false, error: { code: 'STORAGE_UNAVAILABLE' } });

    // 최초 시드 쓰기 실패 → ready 아님, 키 없음, 이후 재시도 가능
    const seedFail = new MemoryStorage();
    seedFail.setError = domError('QuotaExceededError');
    const sf = setup({ storage: seedFail });
    expect(await sf.repo.initialize()).toMatchObject({ ok: false, error: { code: 'QUOTA_EXCEEDED' } });
    expect(seedFail.raw()).toBeNull();
    seedFail.setError = null;
    expect(unwrap(await sf.repo.initialize()).bookings).toHaveLength(1);

    for (const [error, code] of [
      [domError('QuotaExceededError'), 'QUOTA_EXCEEDED'],
      [domError('SecurityError'), 'STORAGE_UNAVAILABLE'],
      [new Error('disk'), 'WRITE_FAILED'],
    ] as const) {
      const { repo, storage } = setup();
      const seed = (await ready(repo)).bookings[0];
      const before = storage.raw();
      let events = 0;
      repo.subscribe(() => events++);
      storage.setError = error;
      expect(await repo.createBooking(input(), 1)).toMatchObject({ ok: false, error: { code } });
      expect(await repo.updateBooking(seed.id, input({ spaceId: 'space-dongtan-a' }), 1)).toMatchObject({ ok: false, error: { code } });
      expect(await repo.cancelBooking(seed.id, 1)).toMatchObject({ ok: false, error: { code } });
      expect(storage.raw()).toBe(before);
      expect(events).toBe(0);
      storage.setError = null;
      expect(unwrap(await repo.getBookings()).revision).toBe(1); // 실패 후에도 기존 데이터 정상 조회
    }
  });

  test('F09 없는/잘못된 ID는 NOT_FOUND, 저장소 오류와 구분', async () => {
    const { repo, storage } = setup();
    await ready(repo);
    for (const id of ['nope', '', '00000000-0000-4000-8000-999999999999']) {
      expect(await repo.getBooking(id)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
      expect(await repo.cancelBooking(id, 1)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
      expect(await repo.deleteBooking(id, 1)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
      expect(await repo.updateBooking(id, input(), 1)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    }
    storage.getError = domError('SecurityError');
    expect(await repo.getBooking('nope')).toMatchObject({ ok: false, error: { code: 'STORAGE_UNAVAILABLE' } });
  });

  test('F10 서버(window 없음)·초기화 전 호출 — 크래시 없이 NOT_READY', async () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    const server = createBookingRepository(); // 기본 storage 경로: window 미존재
    expect(await server.initialize()).toMatchObject({ ok: false, error: { code: 'NOT_READY' } });
    const { repo, storage } = setup();
    expect(await repo.getBookings()).toMatchObject({ ok: false, error: { code: 'NOT_READY' } });
    expect(await repo.getBooking('x')).toMatchObject({ ok: false, error: { code: 'NOT_READY' } });
    expect(await repo.createBooking(input(), 1)).toMatchObject({ ok: false, error: { code: 'NOT_READY' } });
    expect(storage.setCalls).toBe(0);
    expect(storage.raw()).toBeNull();
  });

  test('F11 입력 검증 — 필드별 문구', async () => {
    const { repo, storage } = setup();
    await ready(repo);
    const before = storage.raw();
    const cases: Array<[Partial<BookingInput> | Record<string, unknown>, string[]]> = [
      [{ date: '2026-02-30' }, ['date']],
      [{ date: '2026/11/20' }, ['date']],
      [{ startTime: '18:30' }, ['startTime']], // demoStartTimes 외
      [{ startTime: '25:00' }, ['startTime']],
      [{ date: '2026-11-10' }, ['date', 'startTime']], // 과거
      [{ memo: 'a'.repeat(501) }, ['memo']],
      [{ acknowledged: false as unknown as true }, ['acknowledged']],
      [{ offerId: 'offer-unknown' }, ['offerId']],
      [{ spaceId: 'space-unknown' }, ['spaceId']],
    ];
    for (const [over, fields] of cases) {
      const result = await repo.createBooking(input(over as Partial<BookingInput>), 1);
      expect(result.ok, JSON.stringify(over)).toBe(false);
      if (result.ok) continue;
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(Object.keys(result.error.fieldErrors ?? {}).sort(), JSON.stringify(over)).toEqual([...fields].sort());
    }
    const missingAck = await repo.createBooking({ offerId: 'offer-kim-guitar-60', spaceId: 'space-dongtan-a', date: '2026-11-20', startTime: '19:00' } as BookingInput, 1);
    expect(missingAck).toMatchObject({ ok: false, error: { fieldErrors: { acknowledged: '예약 내용과 이용 안내를 확인해주세요.' } } });
    expect(storage.raw()).toBe(before);

    // 경계: 500 code point(이모지 포함)는 허용, 오늘 서울 18:00(현재 12:00)은 미래라 허용, memo 누락은 ""
    const emoji = '🎸'.repeat(500);
    const ok = unwrap(await repo.createBooking(input({ memo: emoji }), 1));
    expect(ok.booking.memo).toBe(emoji);
    const today = unwrap(await repo.createBooking({ offerId: 'offer-kim-guitar-60', spaceId: 'space-dongtan-a', date: '2026-11-11', startTime: '18:00', acknowledged: true }, 2));
    expect(today.booking.memo).toBe('');
  });

  test('F12 진행 중/종료 예약 수정·취소 불가, 종료 데이터는 정상 조회·삭제 가능', async () => {
    const { repo, clock } = setup();
    const seed = (await ready(repo)).bookings[0]; // 2026-11-18 19:00 서울 = 10:00Z
    clock.ms = Date.parse('2026-11-18T10:30:00.000Z'); // 진행 중
    expect(await repo.updateBooking(seed.id, input({ date: '2026-11-25' }), 1)).toMatchObject({ ok: false, error: { code: 'INVALID_TRANSITION' } });
    expect(await repo.cancelBooking(seed.id, 1)).toMatchObject({ ok: false, error: { code: 'INVALID_TRANSITION' } });
    expect(await repo.deleteBooking(seed.id, 1)).toMatchObject({ ok: false, error: { code: 'INVALID_TRANSITION' } });
    clock.ms = Date.parse('2026-11-18T11:00:00.000Z'); // 정확히 종료
    const list = unwrap(await repo.getBookings());
    expect(getBookingPhase(list.bookings[0], new Date(clock.ms))).toBe('ended');
    expect(await repo.cancelBooking(seed.id, 1)).toMatchObject({ ok: false, error: { code: 'INVALID_TRANSITION' } });
    expect(unwrap(await repo.deleteBooking(seed.id, 1)).revision).toBe(2);
  });

  test('F13 시간 겹침 거부, 맞닿음 허용, 취소 건 제외', async () => {
    const { repo } = setup();
    const seed = (await ready(repo)).bookings[0]; // 11-18 19:00
    expect(await repo.createBooking(input({ date: '2026-11-18', startTime: '19:00', spaceId: 'space-dongtan-c' }), 1)).toMatchObject({ ok: false, error: { code: 'LOCAL_TIME_CONFLICT' } });
    const before = unwrap(await repo.createBooking(input({ date: '2026-11-18', startTime: '18:00' }), 1)); // 19:00 종료 = 시드 시작
    const after = unwrap(await repo.createBooking(input({ date: '2026-11-18', startTime: '20:00' }), 2));
    expect(after.revision).toBe(3);
    // 수정은 자신 제외: 같은 시간으로 메모만 변경 가능
    unwrap(await repo.updateBooking(before.booking.id, input({ date: '2026-11-18', startTime: '18:00', memo: '변경' }), 3));
    // 다른 예약 시간으로 수정은 거부
    expect(await repo.updateBooking(before.booking.id, input({ date: '2026-11-18', startTime: '19:00' }), 4)).toMatchObject({ ok: false, error: { code: 'LOCAL_TIME_CONFLICT' } });
    unwrap(await repo.cancelBooking(seed.id, 4));
    unwrap(await repo.createBooking(input({ date: '2026-11-18', startTime: '19:00' }), 5));
  });

  test('F14 stale revision — CONFLICT, 원본 유지', async () => {
    const { repo, storage, newRepo } = setup();
    const seed = (await ready(repo)).bookings[0];
    const otherTab = newRepo();
    await otherTab.initialize();
    unwrap(await otherTab.createBooking(input(), 1));
    const before = storage.raw();
    for (const result of [
      await repo.createBooking(input({ startTime: '20:00' }), 1),
      await repo.updateBooking(seed.id, input({ startTime: '20:00' }), 1),
      await repo.cancelBooking(seed.id, 1),
      await repo.deleteBooking(seed.id, 1),
    ]) expect(result).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
    expect(storage.raw()).toBe(before);
  });

  test('F15 무변경 수정·재취소 — 쓰기 없음, revision/updatedAt 유지', async () => {
    const { repo, storage, clock } = setup();
    const seed = (await ready(repo)).bookings[0];
    const writes = storage.setCalls;
    clock.ms += 5000;
    const same = unwrap(await repo.updateBooking(seed.id, { offerId: seed.offerId, spaceId: seed.spaceId, date: seed.date, startTime: seed.startTime, memo: '   ', acknowledged: true }, 1));
    expect(same).toEqual({ booking: seed, revision: 1 });
    expect(storage.setCalls).toBe(writes);
    const cancelled = unwrap(await repo.cancelBooking(seed.id, 1));
    clock.ms += 5000;
    const again = unwrap(await repo.cancelBooking(seed.id, cancelled.revision));
    expect(again).toEqual(cancelled);
    expect(storage.setCalls).toBe(writes + 1);
  });

  test('F16 상품·공간 활성/호환 검증, 카탈로그 변경이 과거 snapshot을 덮지 않음', async () => {
    const base = getBookingCatalog();
    const storage = new MemoryStorage();
    const v1 = setup({ storage });
    const seed = (await ready(v1.repo)).bookings[0];

    // 가격·방 이름 변경 + 공간 C 비활성 + 허용 공간에서 B 제외 + 공간 D 추가(허용 아님)
    const changed: BookingCatalog = {
      ...base,
      offers: [{ ...base.offers[0], examplePriceKRW: 70000, allowedSpaceIds: ['space-dongtan-a', 'space-dongtan-c'] }],
      spaces: [
        { ...base.spaces[0], roomName: 'A룸(리뉴얼)' },
        base.spaces[1],
        { ...base.spaces[2], active: false },
        { id: 'space-other-d', studioName: '다른 스튜디오', roomName: 'D', equipmentLabels: [], active: true },
      ],
    };
    const v2 = setup({ storage, catalog: changed });
    const list = unwrap(await v2.repo.initialize());
    expect(list.bookings[0].snapshot).toEqual(seed.snapshot);
    expect(await v2.repo.createBooking(input({ spaceId: 'space-dongtan-b' }), 1)).toMatchObject({ ok: false, error: { fieldErrors: { spaceId: '이용할 공간을 선택해주세요.' } } });
    expect(await v2.repo.createBooking(input({ spaceId: 'space-dongtan-c' }), 1)).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    expect(await v2.repo.createBooking(input({ spaceId: 'space-other-d' }), 1)).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });

    // 같은 상품·공간 수정 → 기존 snapshot 유지
    const kept = unwrap(await v2.repo.updateBooking(seed.id, input({ spaceId: 'space-dongtan-a', date: '2026-11-19' }), 1));
    expect(kept.booking.snapshot).toEqual(seed.snapshot);

    const inactiveOffer: BookingCatalog = { ...base, offers: [{ ...base.offers[0], active: false }] };
    const v3 = setup({ storage, catalog: inactiveOffer });
    await v3.repo.initialize();
    expect(await v3.repo.createBooking(input({ date: '2026-11-21' }), 2)).toMatchObject({ ok: false, error: { fieldErrors: { offerId: '레슨을 선택해주세요.' } } });

    // 공간 변경 → 최신 카탈로그로 snapshot 재구성
    const v4 = setup({ storage, catalog: { ...changed, spaces: [changed.spaces[0], { ...base.spaces[2], roomName: 'C룸' }], offers: [{ ...changed.offers[0], allowedSpaceIds: ['space-dongtan-a', 'space-dongtan-c'] }] } });
    await v4.repo.initialize();
    const moved = unwrap(await v4.repo.updateBooking(seed.id, input({ spaceId: 'space-dongtan-c', date: '2026-11-19' }), 2));
    expect(moved.booking.snapshot).toMatchObject({ roomName: 'C룸', examplePriceKRW: 70000 });
  });

  test('F17 서울 자정 경계·장치 시간대 무관', async () => {
    // 서울 2026-11-12 00:30 = 2026-11-11 15:30Z (UTC 날짜는 아직 11일)
    const nowMs = Date.parse('2026-11-11T15:30:00.000Z');
    expect(seoulDate(nowMs)).toBe('2026-11-12');
    const { repo, clock } = setup({ now: nowMs });
    const seed = (await ready(repo)).bookings[0];
    expect(seed.date).toBe('2026-11-19'); // 서울 오늘(12일) + 7
    // 서울 11-11 21:00은 이미 지남(UTC로는 11일 12:00Z) → 과거
    expect(await repo.createBooking(input({ date: '2026-11-11', startTime: '21:00' }), 1)).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    // 정렬은 서울 시작 기준
    const a = unwrap(await repo.createBooking(input({ date: '2026-11-19', startTime: '18:00' }), 1));
    const b = unwrap(await repo.createBooking(input({ date: '2026-11-12', startTime: '21:00' }), 2));
    expect(unwrap(await repo.getBookings()).bookings.map((x) => x.id)).toEqual([b.booking.id, a.booking.id, seed.id]);
    // 서울 21:00 시작 → 22:00 종료 사이 진행 중
    clock.ms = Date.parse('2026-11-12T12:30:00.000Z');
    expect(getBookingPhase(b.booking, new Date(clock.ms))).toBe('in-progress');
  });
});
