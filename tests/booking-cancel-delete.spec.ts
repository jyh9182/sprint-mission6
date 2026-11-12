import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// 7단계 예약 취소·기록 삭제(design/steps/07-cancel-delete.md). 실제 LocalStorage 저장소를 쓰는 화면을 개발 서버(또는 LANDING_TEST_URL)에서 검사한다.
const base = process.env.LANDING_TEST_URL || 'http://localhost:3100';
const KEY = 'lessonconnect:bookings:v1';
const HOUR = 3600e3;
const DAY = 24 * HOUR;

const seoulDate = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);
const detailUrl = (id: string) => new URL(`/bookings/detail?id=${encodeURIComponent(id)}`, base).toString();
const listUrl = new URL('/bookings', base).toString();

type Fixture = { date?: string; startTime?: string; memo?: string; status?: 'scheduled' | 'cancelled' };

function booking(f: Fixture = {}) {
  const created = new Date(Date.now() - 10 * DAY).toISOString();
  const status = f.status ?? 'scheduled';
  return {
    id: randomUUID(),
    offerId: 'offer-kim-guitar-60',
    instructorId: 'instructor-kim-minjun',
    spaceId: 'space-dongtan-a',
    catalogVersion: '1',
    snapshot: { instructorName: '김민준', instrumentId: 'guitar', instrumentLabel: '기타', genres: ['rock', 'blues'], studioName: '동탄 스튜디오', roomName: 'A 레슨실', equipmentLabels: ['기타', '앰프'], examplePriceKRW: 50000, currency: 'KRW', durationMinutes: 60 },
    date: f.date ?? seoulDate(Date.now() + 7 * DAY),
    startTime: f.startTime ?? '19:00',
    timeZone: 'Asia/Seoul',
    memo: f.memo ?? '',
    status,
    source: 'seed',
    createdAt: created,
    updatedAt: created,
    cancelledAt: status === 'cancelled' ? created : null,
  };
}
type Booking = ReturnType<typeof booking>;
const INITIALIZED_AT = new Date(Date.now() - 10 * DAY).toISOString();
const storeOf = (bookings: Booking[], revision = 3) =>
  JSON.stringify({ schemaVersion: 1, revision, initializedAt: INITIALIZED_AT, seedVersion: 1, bookings });

function watchErrors(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') failures.push(m.text()); });
  return failures;
}

async function seed(page: Page, raw: string | null) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.evaluate(([key, value]) => { localStorage.clear(); sessionStorage.clear(); if (value !== null) localStorage.setItem(key, value); }, [KEY, raw] as const);
}

async function openDetail(page: Page, raw: string, id: string) {
  await seed(page, raw);
  await page.goto(detailUrl(id));
  await expect(page.locator('.lc-detail-heading .lc-badge')).toBeVisible();
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), KEY);
const rawStore = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEY);
const setRaw = (page: Page, raw: string) => page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, raw] as const);
const manage = (page: Page) => page.getByRole('region', { name: '예약 관리' });
const cancelButton = (page: Page) => manage(page).getByRole('button', { name: '예약 취소', exact: true });
const deleteButton = (page: Page) => manage(page).getByRole('button', { name: '예약 기록 삭제', exact: true });
const dialog = (page: Page) => page.getByRole('dialog');
const keep = (page: Page) => dialog(page).getByRole('button', { name: '유지하기' });
const badge = (page: Page) => page.locator('.lc-detail-heading .lc-badge');

async function failWrites(page: Page, kind: 'quota' | 'write') {
  await page.evaluate((k) => {
    const w = window as unknown as { __setItem?: Storage['setItem'] };
    w.__setItem ??= Storage.prototype.setItem;
    Storage.prototype.setItem = k === 'quota'
      ? function () { throw new DOMException('full', 'QuotaExceededError'); }
      : function () { throw new Error('boom'); };
  }, kind);
}
const restoreWrites = (page: Page) => page.evaluate(() => {
  Storage.prototype.setItem = (window as unknown as { __setItem: Storage['setItem'] }).__setItem;
});

test('취소 Dialog: 저장 없이 열림, 문구·aria 연결, 유지하기 포커스·Tab 순환, Escape·유지하기로 닫고 버튼으로 포커스 복귀, 배경 클릭 무시', async ({ page }) => {
  const failures = watchErrors(page);
  const b = booking({ memo: '퇴근 후 레슨을 희망해요.' });
  const raw = storeOf([b]);
  await openDetail(page, raw, b.id);

  await cancelButton(page).click();
  const d = dialog(page);
  await expect(d).toBeVisible();
  await expect(d).toHaveAccessibleName('예약을 취소할까요?');
  await expect(d).toHaveAccessibleDescription('취소해도 예약 기록은 남아요.\n다시 예약하려면 새 예약을 만들어주세요.');
  await expect(d.getByRole('button', { name: '예약 취소' })).toBeVisible();
  await expect(keep(page)).toBeFocused();
  expect(await rawStore(page)).toBe(raw); // 확인 전에는 저장 함수가 실행되지 않는다

  await page.keyboard.press('Tab');
  await expect(d.getByRole('button', { name: '예약 취소' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(keep(page)).toBeFocused(); // Dialog 안에서 순환
  await page.keyboard.press('Shift+Tab');
  await expect(d.getByRole('button', { name: '예약 취소' })).toBeFocused();

  await page.mouse.click(5, 5); // 배경 클릭으로 닫지 않는다
  await expect(d).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(d).toBeHidden();
  await expect(cancelButton(page)).toBeFocused();

  await cancelButton(page).click();
  await keep(page).click();
  await expect(d).toBeHidden();
  await expect(cancelButton(page)).toBeFocused();
  await expect(badge(page)).toHaveText('예정');
  expect(await rawStore(page)).toBe(raw);
  expect(failures).toEqual([]);
});

test('취소 성공: status·cancelledAt·updatedAt만 변경, 취소됨·성공 알림 1회·삭제 진입, 목록 반영, 새로고침 유지', async ({ page }) => {
  const failures = watchErrors(page);
  const target = booking({ memo: '기록이 남아야 하는 메모' });
  const other = booking({ date: seoulDate(Date.now() + 3 * DAY), startTime: '18:00' });
  await openDetail(page, storeOf([target, other]), target.id);

  await cancelButton(page).click();
  await dialog(page).getByRole('button', { name: '예약 취소' }).click();
  await expect(dialog(page)).toBeHidden();

  await expect(badge(page)).toHaveText('취소됨');
  const flash = page.getByRole('status').filter({ hasText: '예약을 취소했어요' });
  await expect(flash).toHaveCount(1);
  await expect(flash).toContainText('예약 기록은 이 브라우저에 남아 있어요.');
  await expect(page.locator('.lc-detail-memo__text')).toHaveText('기록이 남아야 하는 메모');
  await expect(page.getByText('이 예약은 취소되었어요.')).toBeVisible();
  await expect(cancelButton(page)).toHaveCount(0);
  await expect(page.getByRole('link', { name: '예약 수정' })).toHaveCount(0);
  await expect(deleteButton(page)).toBeVisible();
  await expect(page.locator('.lc-detail-footer').getByRole('link', { name: '예약 목록으로' })).toBeVisible();
  await expect(page.locator('#booking-detail-title')).toBeFocused(); // 원래 버튼이 사라져 제목으로

  const s = await stored(page);
  expect(s.revision).toBe(4);
  expect(s.initializedAt).toBe(INITIALIZED_AT);
  const saved = s.bookings.find((x: Booking) => x.id === target.id);
  const { status, cancelledAt, updatedAt, ...rest } = saved;
  const { status: _s, cancelledAt: _c, updatedAt: _u, ...restBefore } = target;
  expect(rest).toEqual(restBefore); // ID·예약 정보·createdAt·source·snapshot 유지
  expect(status).toBe('cancelled');
  expect(cancelledAt).toBe(updatedAt);
  expect(Date.parse(updatedAt)).toBeGreaterThan(Date.parse(target.updatedAt));
  expect(s.bookings.find((x: Booking) => x.id === other.id)).toEqual(other);

  await page.reload();
  await expect(badge(page)).toHaveText('취소됨');
  await expect(page.getByText('예약을 취소했어요')).toHaveCount(0); // 성공 알림은 한 번만

  await page.goto(listUrl);
  const card = page.locator(`a[href="/bookings/detail?id=${target.id}"]`);
  await expect(card).toContainText('취소됨');
  await expect(page.locator('.lc-booking-card')).toHaveCount(2);
  expect(failures).toEqual([]);
});

test('중복 실행 방지: 확인 버튼 연속 클릭·Enter에도 cancelBooking 1회(revision +1)', async ({ page }) => {
  const b = booking();
  await openDetail(page, storeOf([b]), b.id);
  await cancelButton(page).click();
  await page.evaluate(() => {
    const confirm = Array.from(document.querySelectorAll<HTMLButtonElement>('dialog button')).find((x) => x.textContent === '예약 취소')!;
    confirm.click();
    confirm.click();
    confirm.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    confirm.click();
  });
  await expect(badge(page)).toHaveText('취소됨');
  expect((await stored(page)).revision).toBe(4);
  await expect(page.getByText('예약을 취소했어요')).toHaveCount(1);
});

test('취소 저장 실패(용량 초과·쓰기 실패): Dialog 오류, 원본·화면 유지, 성공 없음, 재시도 성공', async ({ page }) => {
  const failures = watchErrors(page);
  const b = booking();
  const raw = storeOf([b]);
  await openDetail(page, raw, b.id);
  await cancelButton(page).click();
  const confirm = dialog(page).getByRole('button', { name: '예약 취소' });

  await failWrites(page, 'quota');
  await confirm.click();
  const alert = dialog(page).getByRole('alert');
  await expect(alert).toContainText('취소하지 못했어요');
  await expect(alert).toContainText('기존 예약은 유지했어요. 다시 시도해주세요.');
  await expect(dialog(page)).toBeVisible();
  await expect(confirm).toBeEnabled();
  await expect(confirm).not.toHaveAttribute('aria-busy', 'true');
  await expect(keep(page)).toBeEnabled();
  await expect(page.locator('.lc-alert--error')).toHaveCount(1); // Dialog 밖에 중복 표시 없음
  expect(await rawStore(page)).toBe(raw);

  await failWrites(page, 'write');
  await confirm.click();
  await expect(alert).toBeVisible();
  expect(await rawStore(page)).toBe(raw);

  // 실패 뒤 유지하기로 닫으면 화면은 그대로 예정
  await keep(page).click();
  await expect(dialog(page)).toBeHidden();
  await expect(badge(page)).toHaveText('예정');
  await expect(page.getByText('예약을 취소했어요')).toHaveCount(0);

  await restoreWrites(page);
  await cancelButton(page).click();
  await expect(dialog(page).getByRole('alert')).toHaveCount(0); // 다시 열면 Default 상태
  await confirm.click();
  await expect(badge(page)).toHaveText('취소됨');
  await expect(page.getByText('예약을 취소했어요')).toBeVisible();
  expect(failures).toEqual([]);
});

test('삭제 Dialog·실패: 문구 확인, 쓰기 실패 시 기록·화면 유지·이동 없음, Escape 포커스 복귀', async ({ page }) => {
  const failures = watchErrors(page);
  const b = booking({ status: 'cancelled' });
  const raw = storeOf([b]);
  await openDetail(page, raw, b.id);
  await deleteButton(page).click();
  const d = dialog(page);
  await expect(d).toHaveAccessibleName('예약 기록을 삭제할까요?');
  await expect(d).toHaveAccessibleDescription('삭제한 기록은 복구할 수 없어요.\n이 브라우저의 기록에서 제거돼요.');
  await expect(keep(page)).toBeFocused();
  expect(await rawStore(page)).toBe(raw);

  await failWrites(page, 'write');
  await d.getByRole('button', { name: '삭제하기' }).click();
  await expect(d.getByRole('alert')).toContainText('삭제하지 못했어요');
  await expect(d.getByRole('alert')).toContainText('기록은 그대로예요. 다시 시도해주세요.');
  await expect(page).toHaveURL(detailUrl(b.id));
  expect(await rawStore(page)).toBe(raw);

  await page.keyboard.press('Escape');
  await expect(d).toBeHidden();
  await expect(deleteButton(page)).toBeFocused();
  await expect(badge(page)).toHaveText('취소됨');
  await restoreWrites(page);
  expect(failures).toEqual([]);
});

test('삭제 성공: 대상 1건만 제거·목록 이동·성공 알림 1회(포커스), 이전 상세 URL은 없는 ID', async ({ page }) => {
  const failures = watchErrors(page);
  const target = booking({ status: 'cancelled' });
  const other = booking({ date: seoulDate(Date.now() + 3 * DAY), startTime: '18:00', memo: '남는 예약' });
  await openDetail(page, storeOf([target, other]), target.id);
  await deleteButton(page).click();
  await dialog(page).getByRole('button', { name: '삭제하기' }).click();

  await expect(page).toHaveURL(listUrl);
  const flash = page.getByRole('status').filter({ hasText: '예약 기록을 삭제했어요' });
  await expect(flash).toHaveCount(1);
  await expect(flash).toContainText('삭제한 기록은 복구할 수 없어요.');
  await expect(page.locator('.lc-list-flash')).toBeFocused();
  await expect(page.locator('.lc-booking-card')).toHaveCount(1);
  await expect(page.getByText('예약 1건', { exact: true })).toBeVisible();
  await expect(page.locator(`a[href="/bookings/detail?id=${target.id}"]`)).toHaveCount(0);

  const s = await stored(page);
  expect(s).toMatchObject({ schemaVersion: 1, revision: 4, initializedAt: INITIALIZED_AT, seedVersion: 1 });
  expect(s.bookings).toEqual([other]);

  // 브라우저 뒤로가기로 이전 상세에 돌아가도 최신 저장소를 읽어 없는 ID로 보인다
  await page.goBack();
  await expect(page).toHaveURL(detailUrl(target.id));
  await expect(page.getByRole('heading', { name: '예약을 찾을 수 없어요' })).toBeVisible();
  await expect(deleteButton(page)).toHaveCount(0);

  await page.goto(listUrl);
  await expect(page.locator('.lc-booking-card')).toHaveCount(1);
  await expect(page.getByText('예약 기록을 삭제했어요')).toHaveCount(0); // 새 방문에는 성공 알림 없음

  await page.goto(detailUrl(target.id));
  await expect(page.getByRole('heading', { name: '예약을 찾을 수 없어요' })).toBeVisible();
  expect(failures).toEqual([]);
});

test('종료된 예정 예약도 같은 삭제 Dialog로 삭제', async ({ page }) => {
  const ended = booking({ date: seoulDate(Date.now() - 2 * DAY) });
  await openDetail(page, storeOf([ended]), ended.id);
  await expect(badge(page)).toHaveText('종료');
  await expect(cancelButton(page)).toHaveCount(0);
  await deleteButton(page).click();
  await expect(dialog(page)).toHaveAccessibleName('예약 기록을 삭제할까요?');
  await dialog(page).getByRole('button', { name: '삭제하기' }).click();
  await expect(page).toHaveURL(listUrl);
  expect((await stored(page)).bookings).toEqual([]);
});

test('전체 삭제 후 0건, 새로고침·재방문해도 시드 재생성 없음', async ({ page }) => {
  const failures = watchErrors(page);
  const a = booking({ status: 'cancelled' });
  const b = booking({ date: seoulDate(Date.now() - 3 * DAY), startTime: '18:00' });
  await openDetail(page, storeOf([a, b]), a.id);
  await deleteButton(page).click();
  await dialog(page).getByRole('button', { name: '삭제하기' }).click();
  await expect(page).toHaveURL(listUrl);
  await expect(page.locator('.lc-booking-card')).toHaveCount(1);

  await page.locator(`a[href="/bookings/detail?id=${b.id}"]`).click();
  await deleteButton(page).click();
  await dialog(page).getByRole('button', { name: '삭제하기' }).click();
  await expect(page).toHaveURL(listUrl);
  await expect(page.getByText('아직 예약한 레슨이 없어요')).toBeVisible();
  await expect(page.getByText('예약 0건', { exact: true })).toBeVisible();

  for (const go of [() => page.reload(), () => page.goto(listUrl), () => page.goto(base)]) {
    await go();
    await page.goto(listUrl);
    await expect(page.getByText('예약 0건', { exact: true })).toBeVisible();
    await expect(page.locator('.lc-booking-card')).toHaveCount(0);
  }
  const s = await stored(page);
  expect(s).toMatchObject({ schemaVersion: 1, revision: 5, initializedAt: INITIALIZED_AT, seedVersion: 1, bookings: [] });
  expect(failures).toEqual([]);
});

test('Dialog를 연 사이 다른 화면에서 취소됨(CONFLICT): 성공 없이 닫고 최신 취소됨 표시, 덮어쓰지 않음', async ({ page }) => {
  const b = booking();
  await openDetail(page, storeOf([b]), b.id);
  await cancelButton(page).click();
  const elsewhere = { ...b, status: 'cancelled' as const, cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const changedRaw = storeOf([elsewhere as Booking], 4);
  await setRaw(page, changedRaw); // 같은 페이지 setItem은 storage 이벤트가 없어 Dialog가 열린 채 유지된다
  await dialog(page).getByRole('button', { name: '예약 취소' }).click();

  await expect(dialog(page)).toBeHidden();
  await expect(badge(page)).toHaveText('취소됨');
  await expect(page.getByText('예약을 취소했어요')).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: '예약 정보를 다시 불러왔어요' })).toContainText('다른 화면에서 예약 정보가 변경됐어요.');
  await expect(page.locator('#booking-detail-title')).toBeFocused();
  expect(await rawStore(page)).toBe(changedRaw);
});

test('다른 예약만 바뀐 CONFLICT: 자동 재실행 없이 닫고, 다시 누르면 최신 revision으로 취소', async ({ page }) => {
  const b = booking();
  await openDetail(page, storeOf([b]), b.id);
  await cancelButton(page).click();
  const added = booking({ date: seoulDate(Date.now() + 12 * DAY) });
  await setRaw(page, storeOf([b, added], 7));
  await dialog(page).getByRole('button', { name: '예약 취소' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(badge(page)).toHaveText('예정');
  await expect(cancelButton(page)).toBeFocused();
  expect((await stored(page)).revision).toBe(7);

  await cancelButton(page).click();
  await dialog(page).getByRole('button', { name: '예약 취소' }).click();
  await expect(badge(page)).toHaveText('취소됨');
  const s = await stored(page);
  expect(s.revision).toBe(8);
  expect(s.bookings.find((x: Booking) => x.id === added.id)).toEqual(added);
});

test('다른 화면에서 이미 삭제(NOT_FOUND): 삭제 성공 안내·목록 이동 없이 없는 ID 화면', async ({ page }) => {
  const b = booking({ status: 'cancelled' });
  await openDetail(page, storeOf([b]), b.id);
  await deleteButton(page).click();
  await setRaw(page, storeOf([], 3)); // 같은 revision이라 저장소가 NOT_FOUND로 판정
  await dialog(page).getByRole('button', { name: '삭제하기' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByRole('heading', { name: '예약을 찾을 수 없어요' })).toBeVisible();
  await expect(page).toHaveURL(detailUrl(b.id));
  await expect(page.getByText('예약 기록을 삭제했어요')).toHaveCount(0);
});

test('Dialog를 연 사이 레슨 시작(INVALID_TRANSITION): 취소하지 않고 진행 중으로 전환, 액션 없음', async ({ page }) => {
  const date = seoulDate(Date.now() + 2 * DAY);
  const start = Date.parse(`${date}T19:00:00+09:00`);
  await page.clock.install({ time: start - 30_000 });
  const b = booking({ date, startTime: '19:00' });
  const raw = storeOf([b]);
  await openDetail(page, raw, b.id);
  await expect(badge(page)).toHaveText('예정');
  await cancelButton(page).click();
  await page.clock.setSystemTime(start + 60_000); // 타이머는 돌지 않아 화면은 아직 예정
  await dialog(page).getByRole('button', { name: '예약 취소' }).click();

  await expect(dialog(page)).toBeHidden();
  await expect(badge(page)).toHaveText('진행 중');
  await expect(manage(page)).toHaveCount(0);
  await expect(page.getByText('예약을 취소했어요')).toHaveCount(0);
  await expect(page.locator('#booking-detail-title')).toBeFocused();
  expect(await rawStore(page)).toBe(raw);
});

test('손상된 저장값에서 실행: 자동 복구 없이 조회 실패 화면, 원본 유지', async ({ page }) => {
  const b = booking();
  await openDetail(page, storeOf([b]), b.id);
  await cancelButton(page).click();
  await setRaw(page, '{broken');
  await dialog(page).getByRole('button', { name: '예약 취소' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByRole('heading', { name: '예약 상세를 표시할 수 없어요' })).toBeVisible();
  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  expect(await rawStore(page)).toBe('{broken');
});
