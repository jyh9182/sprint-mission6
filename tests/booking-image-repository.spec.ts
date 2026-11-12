// 9단계 참고 이미지·v2 계약의 저장소 검증 (design/data-contract.md §8). 브라우저 없이 Node에서 실행한다.
import { test, expect } from '@playwright/test';
import { BOOKING_STORAGE_KEY, LEGACY_BOOKING_STORAGE_KEY, createBookingRepository, type StorageLike } from '../lib/bookings/repository';
import { isValidReferenceImage, MAX_DATA_URL_LENGTH, sanitizeFileName, sniffImageMime } from '../lib/bookings/reference-image';
import type { BookingInput, ReferenceImage, StoreResult } from '../lib/bookings/types';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  setCalls = 0;
  setError: Error | null = null;
  getItem(key: string) {
    return this.values.has(key) ? this.values.get(key)! : null;
  }
  setItem(key: string, value: string) {
    if (this.setError) throw this.setError;
    this.setCalls += 1;
    this.values.set(key, String(value));
  }
  json(key = BOOKING_STORAGE_KEY) {
    return JSON.parse(this.values.get(key)!);
  }
}

const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' });
const BASE_NOW = Date.parse('2026-11-11T03:00:00.000Z');

function setup(storage = new MemoryStorage()) {
  let counter = 0;
  const make = () =>
    createBookingRepository({
      getStorage: () => storage,
      now: () => new Date(BASE_NOW),
      generateId: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
    });
  return { storage, repo: make(), newRepo: make };
}

function unwrap<T>(result: StoreResult<T>): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}`);
  return result.data;
}

// 실제 1×1 무손실 WebP(34 bytes).
const WEBP_1PX = 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
function image(over: Partial<ReferenceImage> = {}): ReferenceImage {
  return {
    fileName: 'guitar-reference.jpg', originalMimeType: 'image/jpeg', originalSizeBytes: 420_000,
    mimeType: 'image/webp', sizeBytes: 34, width: 1, height: 1, dataUrl: `data:image/webp;base64,${WEBP_1PX}`, ...over,
  };
}
const other = () => image({ fileName: 'second.png', originalMimeType: 'image/png', originalSizeBytes: 1000 });
const input = (over: Partial<BookingInput> = {}): BookingInput => ({
  offerId: 'offer-kim-guitar-60', spaceId: 'space-dongtan-b', date: '2026-11-20', startTime: '18:00', memo: '', acknowledged: true, ...over,
});

const v1Booking = (id: string, status: 'scheduled' | 'cancelled' = 'scheduled') => ({
  id, offerId: 'offer-kim-guitar-60', instructorId: 'instructor-kim-minjun', spaceId: 'space-dongtan-a', catalogVersion: '1',
  snapshot: { instructorName: '김민준', instrumentId: 'guitar', instrumentLabel: '기타', genres: ['rock', 'blues'], studioName: '동탄 스튜디오', roomName: 'A 레슨실', equipmentLabels: ['기타', '앰프'], examplePriceKRW: 50000, currency: 'KRW', durationMinutes: 60 },
  date: '2026-11-19', startTime: '19:00', timeZone: 'Asia/Seoul', memo: '기존 메모', status, source: 'seed',
  createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-02T00:00:00.000Z', cancelledAt: status === 'cancelled' ? '2026-11-02T00:00:00.000Z' : null,
});
const v1Store = (bookings: unknown[]) =>
  JSON.stringify({ schemaVersion: 1, revision: 7, initializedAt: '2026-11-01T00:00:00.000Z', seedVersion: 1, bookings });

test.describe('v1 → v2 마이그레이션', () => {
  test('v1 예약을 엄격 검증 후 referenceImage:null만 추가해 v2에 한 번에 쓰고, v1은 그대로 둔다', async () => {
    const { storage, repo, newRepo } = setup();
    const raw = v1Store([v1Booking('11111111-1111-4111-8111-111111111111'), v1Booking('22222222-2222-4222-8222-222222222222', 'cancelled')]);
    storage.values.set(LEGACY_BOOKING_STORAGE_KEY, raw);
    const list = unwrap(await repo.initialize());
    expect(storage.setCalls).toBe(1);
    expect(list.revision).toBe(7);
    const v2 = storage.json();
    expect(v2).toMatchObject({ schemaVersion: 2, revision: 7, initializedAt: '2026-11-01T00:00:00.000Z', seedVersion: 1 });
    expect(v2.bookings).toEqual(JSON.parse(raw).bookings.map((b: object) => ({ ...b, referenceImage: null })));
    expect(storage.values.get(LEGACY_BOOKING_STORAGE_KEY)).toBe(raw); // 자동 삭제하지 않음
    // 이후에는 v2만 읽는다. v1을 바꿔도 반영·재마이그레이션하지 않는다.
    storage.values.set(LEGACY_BOOKING_STORAGE_KEY, v1Store([]));
    expect(unwrap(await newRepo().initialize()).bookings).toHaveLength(2);
    expect(storage.setCalls).toBe(1);
  });

  test('빈 v1은 빈 v2로 옮기고 재시드하지 않는다', async () => {
    const { storage, repo } = setup();
    storage.values.set(LEGACY_BOOKING_STORAGE_KEY, v1Store([]));
    expect(unwrap(await repo.initialize())).toEqual({ bookings: [], revision: 7 });
    expect(storage.json().bookings).toEqual([]);
  });

  test('손상·미지원 v1은 오류로 멈추고 v2를 쓰지 않는다', async () => {
    for (const [raw, code] of [['{broken', 'CORRUPT_DATA'], [JSON.stringify({ ...JSON.parse(v1Store([])), schemaVersion: 5 }), 'UNSUPPORTED_VERSION']] as const) {
      const { storage, repo } = setup();
      storage.values.set(LEGACY_BOOKING_STORAGE_KEY, raw);
      expect(await repo.initialize()).toMatchObject({ ok: false, error: { code } });
      expect(storage.values.has(BOOKING_STORAGE_KEY)).toBe(false);
      expect(storage.setCalls).toBe(0);
    }
  });

  test('마이그레이션 쓰기 실패: v1 유지, 준비 안 됨, 재시도 시 같은 원본으로 성공', async () => {
    const { storage, repo } = setup();
    const raw = v1Store([v1Booking('11111111-1111-4111-8111-111111111111')]);
    storage.values.set(LEGACY_BOOKING_STORAGE_KEY, raw);
    storage.setError = quota();
    expect(await repo.initialize()).toMatchObject({ ok: false, error: { code: 'QUOTA_EXCEEDED' } });
    expect(await repo.getBookings()).toMatchObject({ ok: false, error: { code: 'NOT_READY' } });
    expect(storage.values.has(BOOKING_STORAGE_KEY)).toBe(false);
    expect(storage.values.get(LEGACY_BOOKING_STORAGE_KEY)).toBe(raw);
    storage.setError = null;
    expect(unwrap(await repo.initialize()).bookings[0].referenceImage).toBeNull();
  });

  test('v2가 손상되면 v1로 되돌아가지 않고 CORRUPT_DATA', async () => {
    const { storage, repo } = setup();
    storage.values.set(LEGACY_BOOKING_STORAGE_KEY, v1Store([v1Booking('11111111-1111-4111-8111-111111111111')]));
    storage.values.set(BOOKING_STORAGE_KEY, '{broken');
    expect(await repo.initialize()).toMatchObject({ ok: false, error: { code: 'CORRUPT_DATA' } });
    expect(storage.values.get(BOOKING_STORAGE_KEY)).toBe('{broken');
  });

  test('v1·v2 모두 없을 때만 v2 시드(referenceImage:null)', async () => {
    const { storage, repo } = setup();
    const list = unwrap(await repo.initialize());
    expect(list.bookings[0].referenceImage).toBeNull();
    expect(storage.json().schemaVersion).toBe(2);
    expect(storage.values.has(LEGACY_BOOKING_STORAGE_KEY)).toBe(false);
  });
});

test.describe('참고 이미지 저장', () => {
  test('생성 replace → 메타데이터·Data URL 저장, 새 인스턴스(새로고침)에서도 동일', async () => {
    const { repo, newRepo } = setup();
    const init = unwrap(await repo.initialize());
    const created = unwrap(await repo.createBooking({ ...input(), referenceImageChange: { kind: 'replace', image: image() } }, init.revision));
    expect(created.booking.referenceImage).toEqual(image());
    const reloaded = unwrap(await newRepo().initialize());
    expect(reloaded.bookings.find((b) => b.id === created.booking.id)!.referenceImage).toEqual(image());
    // 생략·keep은 첨부 없음
    const plain = unwrap(await repo.createBooking(input({ date: '2026-11-21' }), created.revision));
    expect(plain.booking.referenceImage).toBeNull();
  });

  test('수정: keep 유지 · 같은 이미지는 쓰기 없음 · replace 교체 · remove 제거, 이미지 변경만으로도 저장', async () => {
    const { storage, repo } = setup();
    const init = unwrap(await repo.initialize());
    const c = unwrap(await repo.createBooking({ ...input(), referenceImageChange: { kind: 'replace', image: image() } }, init.revision));
    const id = c.booking.id;
    const memo = unwrap(await repo.updateBooking(id, { ...input(), memo: '메모만', referenceImageChange: { kind: 'keep' } }, c.revision));
    expect(memo.booking.referenceImage).toEqual(image());

    const calls = storage.setCalls;
    const same = unwrap(await repo.updateBooking(id, { ...input(), memo: '메모만', referenceImageChange: { kind: 'replace', image: image() } }, memo.revision));
    expect(same.revision).toBe(memo.revision);
    expect(storage.setCalls).toBe(calls);

    const replaced = unwrap(await repo.updateBooking(id, { ...input(), memo: '메모만', referenceImageChange: { kind: 'replace', image: other() } }, memo.revision));
    expect(replaced.revision).toBe(memo.revision + 1);
    expect(replaced.booking.referenceImage).toEqual(other());

    const removed = unwrap(await repo.updateBooking(id, { ...input(), memo: '메모만', referenceImageChange: { kind: 'remove' } }, replaced.revision));
    expect(removed.booking.referenceImage).toBeNull();
    expect(storage.json().bookings.find((b: { id: string }) => b.id === id).referenceImage).toBeNull();
  });

  test('취소는 이미지 유지, 삭제는 레코드와 Data URL을 함께 제거', async () => {
    const { storage, repo } = setup();
    const init = unwrap(await repo.initialize());
    const c = unwrap(await repo.createBooking({ ...input(), referenceImageChange: { kind: 'replace', image: image() } }, init.revision));
    const cancelled = unwrap(await repo.cancelBooking(c.booking.id, c.revision));
    expect(cancelled.booking.referenceImage).toEqual(image());
    unwrap(await repo.deleteBooking(c.booking.id, cancelled.revision));
    expect(storage.values.get(BOOKING_STORAGE_KEY)).not.toContain(WEBP_1PX);
  });

  test('저장 용량 초과: 기존 v2·revision·이미지 보존', async () => {
    const { storage, repo } = setup();
    const init = unwrap(await repo.initialize());
    const c = unwrap(await repo.createBooking({ ...input(), referenceImageChange: { kind: 'replace', image: image() } }, init.revision));
    const before = storage.values.get(BOOKING_STORAGE_KEY);
    storage.setError = quota();
    const result = await repo.updateBooking(c.booking.id, { ...input(), referenceImageChange: { kind: 'replace', image: other() } }, c.revision);
    expect(result).toMatchObject({ ok: false, error: { code: 'QUOTA_EXCEEDED' } });
    expect(storage.values.get(BOOKING_STORAGE_KEY)).toBe(before);
    expect(unwrap(await repo.getBooking(c.booking.id)).booking.referenceImage).toEqual(image());
  });

  test('폼 검증을 우회한 이미지 값은 VALIDATION_ERROR · fieldErrors.referenceImageChange, 쓰기 없음', async () => {
    const { storage, repo } = setup();
    const init = unwrap(await repo.initialize());
    const bad: unknown[] = [
      { kind: 'replace', image: image({ sizeBytes: 35 }) }, // 실제 바이트 수 불일치
      { kind: 'replace', image: image({ mimeType: 'image/png' as 'image/webp' }) },
      { kind: 'replace', image: image({ dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }) },
      { kind: 'replace', image: image({ dataUrl: `data:image/webp;base64,${'A'.repeat(MAX_DATA_URL_LENGTH)}` }) }, // 디코딩 전 길이 거부
      { kind: 'replace', image: image({ width: 1281 }) },
      { kind: 'replace', image: image({ originalSizeBytes: 2 * 1024 * 1024 + 1 }) },
      { kind: 'replace', image: image({ originalMimeType: 'image/svg+xml' as 'image/png' }) },
      { kind: 'replace', image: image({ fileName: '../secret.png' }) },
      { kind: 'replace', image: { ...image(), extra: true } },
      { kind: 'upload' },
      'replace',
    ];
    const calls = storage.setCalls;
    for (const change of bad) {
      const result = await repo.createBooking({ ...input(), referenceImageChange: change } as BookingInput, init.revision);
      expect(result, JSON.stringify(change).slice(0, 80)).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR', fieldErrors: { referenceImageChange: expect.any(String) } } });
    }
    expect(storage.setCalls).toBe(calls);
  });

  test('저장된 이미지가 손상되면 레코드 전체를 CORRUPT_DATA로 처리하고 원본을 바꾸지 않는다', async () => {
    const { storage, repo } = setup();
    const init = unwrap(await repo.initialize());
    unwrap(await repo.createBooking({ ...input(), referenceImageChange: { kind: 'replace', image: image() } }, init.revision));
    const good = storage.json();
    const target = good.bookings.findIndex((b: { referenceImage: unknown }) => b.referenceImage);
    for (const broken of [{ ...image(), dataUrl: 'data:image/webp;base64,UklGRhoAAABXRUJQ' }, { ...image(), height: 0 }, 'x']) {
      const s = new MemoryStorage();
      const value = structuredClone(good);
      value.bookings[target].referenceImage = broken;
      const raw = JSON.stringify(value);
      s.values.set(BOOKING_STORAGE_KEY, raw);
      expect(await setup(s).repo.initialize()).toMatchObject({ ok: false, error: { code: 'CORRUPT_DATA' } });
      expect(s.values.get(BOOKING_STORAGE_KEY)).toBe(raw);
    }
  });
});

test('순수 규칙: 시그니처 판별 · 안전한 파일명 · 검증기', () => {
  expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
  expect(sniffImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
  expect(sniffImageMime(Uint8Array.from(atob(WEBP_1PX), (c) => c.charCodeAt(0)))).toBe('image/webp');
  expect(sniffImageMime(new TextEncoder().encode('<svg xmlns='))).toBeNull();
  expect(sanitizeFileName('C:\\fakepath\\사진\u0007.jpg')).toBe('사진.jpg');
  expect(sanitizeFileName('a/b/\u202e  ')).toBe('참고 이미지');
  expect(Array.from(sanitizeFileName('가'.repeat(200) + '.png'))).toHaveLength(120);
  expect(isValidReferenceImage(image())).toBe(true);
});
