import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// 6단계 예약 수정(/bookings/edit?id=…). 실제 LocalStorage 저장소를 쓰는 화면을 개발 서버(또는 LANDING_TEST_URL)에서 검사한다.
const base = process.env.LANDING_TEST_URL || 'http://localhost:3100';
const KEY = 'lessonconnect:bookings:v2'; // 9단계부터 활성 키(v1은 마이그레이션 원본, booking-image.spec.ts에서 검증)
const HOUR = 3600e3;
const DAY = 24 * HOUR;

const seoulDate = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);
const editUrl = (id: string) => new URL(`/bookings/edit?id=${encodeURIComponent(id)}`, base).toString();
const detailUrl = (id: string) => new URL(`/bookings/detail?id=${encodeURIComponent(id)}`, base).toString();

type Fixture = { date?: string; startTime?: string; memo?: string; spaceId?: string; offerId?: string; status?: 'scheduled' | 'cancelled'; roomName?: string };

function booking(f: Fixture = {}) {
  const created = new Date(Date.now() - 10 * DAY).toISOString();
  const status = f.status ?? 'scheduled';
  return {
    id: randomUUID(),
    offerId: f.offerId ?? 'offer-kim-guitar-60',
    instructorId: 'instructor-kim-minjun',
    spaceId: f.spaceId ?? 'space-dongtan-a',
    catalogVersion: '1',
    snapshot: { instructorName: '김민준', instrumentId: 'guitar', instrumentLabel: '기타', genres: ['rock', 'blues'], studioName: '동탄 스튜디오', roomName: f.roomName ?? 'A 레슨실', equipmentLabels: ['기타', '앰프'], examplePriceKRW: 50000, currency: 'KRW', durationMinutes: 60 },
    date: f.date ?? seoulDate(Date.now() + 7 * DAY),
    startTime: f.startTime ?? '19:00',
    timeZone: 'Asia/Seoul',
    memo: f.memo ?? '',
    status,
    source: 'seed',
    createdAt: created,
    updatedAt: created,
    cancelledAt: status === 'cancelled' ? created : null,
    referenceImage: null,
  };
}
type Booking = ReturnType<typeof booking>;
const storeOf = (bookings: Booking[], revision = 3) =>
  JSON.stringify({ schemaVersion: 2, revision, initializedAt: new Date(Date.now() - 10 * DAY).toISOString(), seedVersion: 1, bookings });

function watchErrors(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') failures.push(m.text()); });
  return failures;
}

async function seed(page: Page, raw: string | null, width = 390, height = 844) {
  await page.setViewportSize({ width, height });
  await page.goto(base);
  await page.evaluate(([key, value]) => { localStorage.clear(); sessionStorage.clear(); if (value !== null) localStorage.setItem(key, value); }, [KEY, raw] as const);
}

/** 저장소 원시값을 넣고 수정 화면을 직접 연다. 폼이 준비될 때까지 기다린다. */
async function openEdit(page: Page, raw: string, id: string, width = 390, height = 844) {
  await seed(page, raw, width, height);
  await page.goto(editUrl(id));
  await page.evaluate(() => document.fonts.ready);
  await expect(field(page, '메모 (선택)')).toBeEnabled();
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), KEY);
const rawStore = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEY);
const field = (page: Page, label: string) => page.getByLabel(label, { exact: true });
const ack = (page: Page) => page.getByLabel('예약 내용과 이용 안내를 확인했어요.');
const save = (page: Page) => page.locator('.lc-detail-footer').getByRole('button', { name: '변경사항 저장' });
const cancelEdit = (page: Page) => page.getByRole('button', { name: '수정 취소' });
const back = (page: Page) => page.getByRole('button', { name: '예약 상세로 돌아가기' });
const UNCHANGED = '변경한 내용이 없어요. 내용을 바꾸면 저장할 수 있어요.';
const infoValue = (page: Page, label: string) => page.locator('.lc-detail-info__row').filter({ has: page.locator('dt', { hasText: label }) }).locator('dd');

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

test('상세 → 예약 수정: 저장된 값으로 채움, 확인 체크만 비어 있음, 변경 없음이면 저장 비활성', async ({ page }) => {
  const failures = watchErrors(page);
  const b = booking({ memo: '레슨 전에 연습할 곡을 상담하고 싶어요.', spaceId: 'space-dongtan-b', roomName: 'B 레슨실', startTime: '20:00' });
  const raw = storeOf([b]);
  await seed(page, raw);
  await page.goto(detailUrl(b.id));
  await page.locator('.lc-detail-footer').getByRole('link', { name: '예약 수정' }).click();
  await expect(page).toHaveURL(editUrl(b.id));
  await expect(page.getByRole('heading', { level: 1, name: '예약 수정' })).toBeVisible();

  await expect(field(page, '강사 · 레슨 (필수)')).toHaveValue('offer-kim-guitar-60');
  await expect(field(page, '날짜 (필수)')).toHaveValue(b.date);
  await expect(field(page, '시작 시간 (필수)')).toHaveValue('20:00');
  await expect(field(page, '레슨 공간 (필수)')).toHaveValue('space-dongtan-b');
  await expect(field(page, '메모 (선택)')).toHaveValue('레슨 전에 연습할 곡을 상담하고 싶어요.');
  await expect(ack(page)).not.toBeChecked();
  await expect(page.getByRole('group', { name: '선택한 레슨 요약' })).toHaveText('기타 · Rock / Blues레슨 길이 60분 · 예시 50,000원');
  await expect(page.getByText(UNCHANGED)).toBeVisible();
  await expect(save(page)).toBeDisabled();
  await expect(cancelEdit(page)).toBeEnabled();
  await expect(page.locator('.lc-field__error')).toHaveCount(0);

  // 확인 체크만 바꾼 것은 변경이 아니다
  await ack(page).check();
  await expect(save(page)).toBeDisabled();
  // 메모 앞뒤 공백만 바꾼 것도 변경이 아니다
  await field(page, '메모 (선택)').fill('  레슨 전에 연습할 곡을 상담하고 싶어요.\n');
  await expect(save(page)).toBeDisabled();
  await expect(page.getByText(UNCHANGED)).toBeVisible();
  // 바꾸면 활성, 원래 값으로 되돌리면 다시 변경 없음
  await field(page, '시작 시간 (필수)').selectOption('21:00');
  await expect(save(page)).toBeEnabled();
  await expect(page.getByText(UNCHANGED)).toHaveCount(0);
  await field(page, '시작 시간 (필수)').selectOption('20:00');
  await expect(save(page)).toBeDisabled();
  // 변경 없음은 Enter 제출로도 저장하지 않는다
  await field(page, '날짜 (필수)').press('Enter');
  await expect(page).toHaveURL(editUrl(b.id));
  expect(await rawStore(page)).toBe(raw); // 변경 없음은 저장소에 쓰지 않는다
  expect(failures).toEqual([]);
});

test('정상 수정: id·createdAt·source 유지, updatedAt 갱신, 상세·목록 반영, 새로고침 유지, 다른 예약 불변', async ({ page }) => {
  const failures = watchErrors(page);
  const target = booking({ memo: '처음 메모' });
  const other = booking({ date: seoulDate(Date.now() + 3 * DAY), startTime: '18:00', memo: '다른 예약 메모' });
  await openEdit(page, storeOf([target, other]), target.id);
  const before = await stored(page);

  await field(page, '시작 시간 (필수)').selectOption('21:00');
  await field(page, '레슨 공간 (필수)').selectOption('space-dongtan-c');
  await field(page, '메모 (선택)').fill('  바꾼 메모\n둘째 줄  ');
  await ack(page).check();
  await save(page).click();

  await expect(page).toHaveURL(detailUrl(target.id));
  const flash = page.getByRole('status').filter({ hasText: '예약을 수정했어요' });
  await expect(flash).toBeVisible();
  await expect(flash).toContainText('이 브라우저에 변경 내용이 저장됐어요.');
  await expect(page.locator('.lc-detail-heading__description')).toHaveText('예약 내용을 확인하고 변경할 수 있어요.');
  await expect(infoValue(page, '시간')).toHaveText('21:00–22:00');
  await expect(infoValue(page, '공간')).toHaveText('동탄 스튜디오 · C 레슨실');
  await expect(page.locator('.lc-detail-memo__text')).toHaveText('바꾼 메모\n둘째 줄');

  const after = await stored(page);
  expect(after.revision).toBe(before.revision + 1);
  expect(after.bookings).toHaveLength(2);
  const updated = after.bookings.find((x: Booking) => x.id === target.id);
  expect(updated).toMatchObject({
    id: target.id, createdAt: target.createdAt, source: 'seed', status: 'scheduled',
    startTime: '21:00', spaceId: 'space-dongtan-c', memo: '바꾼 메모\n둘째 줄', snapshot: { roomName: 'C 레슨실' },
  });
  expect(Date.parse(updated.updatedAt)).toBeGreaterThan(Date.parse(target.updatedAt));
  expect(updated).not.toHaveProperty('acknowledged');
  expect(after.bookings.find((x: Booking) => x.id === other.id)).toEqual(other); // 다른 예약은 그대로

  // 새로고침: 수정값 유지, 성공 알림은 다시 나오지 않음
  await page.reload();
  await expect(infoValue(page, '시간')).toHaveText('21:00–22:00');
  await expect(page.locator('.lc-detail-memo__text')).toHaveText('바꾼 메모\n둘째 줄');
  await expect(page.getByText('예약을 수정했어요')).toHaveCount(0);

  // 목록: 수정된 시간이 보이고 새로고침해도 유지, 건수 그대로
  await page.goto(new URL('/bookings', base).toString());
  await expect(page.locator('.lc-booking-card')).toHaveCount(2);
  const card = page.locator('.lc-booking-card').filter({ has: page.locator(`[href="/bookings/detail?id=${target.id}"]`) }).or(page.locator(`a.lc-booking-card[href="/bookings/detail?id=${target.id}"]`));
  await expect(card).toContainText('21:00');
  await page.reload();
  await expect(page.locator('.lc-booking-card')).toHaveCount(2);
  await expect(card).toContainText('21:00');
  expect((await stored(page)).bookings.find((x: Booking) => x.id === other.id)).toEqual(other);
  expect(failures).toEqual([]);
});

test('중복 제출: 클릭 2번 + Enter에도 updateBooking 1회(revision +1)', async ({ page }) => {
  const b = booking();
  await openEdit(page, storeOf([b]), b.id);
  await field(page, '메모 (선택)').fill('한 번만');
  await ack(page).check();
  await page.evaluate(() => {
    const button = document.querySelector<HTMLButtonElement>('.lc-detail-footer button[type="submit"]')!;
    button.click();
    button.click();
    (document.querySelector('form') as HTMLFormElement).requestSubmit();
  });
  await expect(page).toHaveURL(detailUrl(b.id));
  expect((await stored(page)).revision).toBe(4);
});

test('입력 검증: 확인 체크 누락·과거 날짜·메모 500자 초과는 저장하지 않고 첫 오류 포커스', async ({ page }) => {
  const failures = watchErrors(page);
  const b = booking();
  const raw = storeOf([b]);
  await openEdit(page, raw, b.id);
  await field(page, '메모 (선택)').fill('변경');
  await save(page).click();
  await expect(ack(page)).toBeFocused();
  await expect(ack(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('예약 내용을 확인해주세요.')).toBeVisible();

  const date = field(page, '날짜 (필수)');
  await date.fill(seoulDate(Date.now() - DAY));
  await ack(page).check();
  await save(page).click();
  await expect(date).toBeFocused();
  await expect(date).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('미래의 날짜와 시작 시간을 선택해주세요.')).toBeVisible();
  await date.fill(b.date);

  await field(page, '메모 (선택)').fill('🎸'.repeat(501));
  await save(page).click();
  await expect(field(page, '메모 (선택)')).toBeFocused();
  await expect(page.getByText('메모는 500자까지 입력할 수 있어요.')).toBeVisible();
  expect(await rawStore(page)).toBe(raw);
  expect(failures).toEqual([]);
});

test('카탈로그에서 사라진 상품: 기존 값을 비활성 옵션으로 보이고 재선택 오류, 상품 변경 시 종속 값만 초기화', async ({ page }) => {
  const b = booking({ offerId: 'offer-retired-60', memo: '유지될 메모' });
  await openEdit(page, storeOf([b]), b.id);
  const offer = field(page, '강사 · 레슨 (필수)');
  await expect(offer).toHaveValue('offer-retired-60');
  await expect(offer.locator('option[value="offer-retired-60"]')).toHaveText('김민준 선생님 · 기타 (현재 선택할 수 없음)');
  await expect(offer.locator('option[value="offer-retired-60"]')).toBeDisabled();
  await expect(page.getByText('선택한 레슨을 이용할 수 없어요. 다시 선택해주세요.')).toBeVisible();
  await expect(save(page)).toBeDisabled(); // 아직 변경 없음

  await offer.selectOption('offer-kim-guitar-60');
  await expect(page.getByText('레슨을 바꿔서 날짜·시작 시간·공간 선택을 지웠어요. 다시 선택해주세요.')).toBeVisible();
  await expect(field(page, '날짜 (필수)')).toHaveValue('');
  await expect(field(page, '시작 시간 (필수)')).toHaveValue('');
  await expect(field(page, '레슨 공간 (필수)')).toHaveValue('');
  await expect(field(page, '메모 (선택)')).toHaveValue('유지될 메모');
  await field(page, '날짜 (필수)').fill(b.date);
  await field(page, '시작 시간 (필수)').selectOption('19:00');
  await field(page, '레슨 공간 (필수)').selectOption('space-dongtan-a');
  await ack(page).check();
  await save(page).click();
  await expect(page).toHaveURL(detailUrl(b.id));
  expect((await stored(page)).bookings[0]).toMatchObject({ id: b.id, offerId: 'offer-kim-guitar-60', createdAt: b.createdAt });
});

test('저장 실패(용량 초과·쓰기 실패): 이동 없이 편집값·체크 유지, 알림 후 재시도 성공', async ({ page }) => {
  const failures = watchErrors(page);
  const b = booking();
  const raw = storeOf([b]);
  await openEdit(page, raw, b.id);
  await field(page, '레슨 공간 (필수)').selectOption('space-dongtan-b');
  await field(page, '메모 (선택)').fill('실패해도 남는 메모');
  await ack(page).check();

  await page.evaluate(() => {
    (window as unknown as { __setItem: Storage['setItem'] }).__setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); };
  });
  await save(page).click();
  const alert = page.locator('.lc-alert--error');
  await expect(alert).toContainText('변경 내용을 저장하지 못했어요');
  await expect(alert).toContainText('브라우저 저장 공간이 부족해요. 입력과 기존 이미지는 유지했어요.');
  await expect(page).toHaveURL(editUrl(b.id));
  await expect(field(page, '메모 (선택)')).toHaveValue('실패해도 남는 메모');
  await expect(field(page, '레슨 공간 (필수)')).toHaveValue('space-dongtan-b');
  await expect(ack(page)).toBeChecked();
  await expect(save(page)).toBeEnabled();

  await page.evaluate(() => { Storage.prototype.setItem = function () { throw new Error('boom'); }; });
  await save(page).click();
  await expect(alert).toContainText('편집 중인 내용은 유지했어요. 다시 시도해주세요.');
  expect(await rawStore(page)).toBe(raw);
  await expect(page.getByText('예약을 수정했어요')).toHaveCount(0);

  await page.evaluate(() => { Storage.prototype.setItem = (window as unknown as { __setItem: Storage['setItem'] }).__setItem; });
  await save(page).click();
  await expect(page).toHaveURL(detailUrl(b.id));
  await expect(page.getByText('예약을 수정했어요')).toBeVisible();
  expect((await stored(page)).bookings[0].memo).toBe('실패해도 남는 메모');
  expect(failures).toEqual([]);
});

test('같은 브라우저의 다른 예약과 시간 겹침: 시작 시간 오류, 자기 예약은 제외', async ({ page }) => {
  const target = booking({ startTime: '19:00' });
  const other = booking({ date: target.date, startTime: '20:00' });
  await openEdit(page, storeOf([target, other]), target.id);
  const time = field(page, '시작 시간 (필수)');
  await time.selectOption('20:00');
  await ack(page).check();
  await save(page).click();
  await expect(time).toBeFocused();
  await expect(page.getByText('같은 시간에 저장된 레슨이 있어요. 다른 시간을 선택해주세요.')).toBeVisible();
  // 자기 예약 시간(19:00)으로 돌아오고 메모만 바꾸면 겹침으로 보지 않는다
  await time.selectOption('19:00');
  await field(page, '메모 (선택)').fill('시간은 그대로');
  await save(page).click();
  await expect(page).toHaveURL(detailUrl(target.id));
  const s = await stored(page);
  expect(s.bookings.find((x: Booking) => x.id === other.id)).toEqual(other);
});

test('다른 화면에서 같은 예약 변경(CONFLICT): 덮어쓰지 않고 최신 내용 확인 전 저장 차단, draft 유지', async ({ page }) => {
  const b = booking({ memo: '원래 메모' });
  await openEdit(page, storeOf([b]), b.id);
  await field(page, '메모 (선택)').fill('내가 고친 메모');
  await ack(page).check();
  const changed = { ...b, startTime: '18:00', memo: '다른 탭 메모', updatedAt: new Date().toISOString() };
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, storeOf([changed], 5)] as const);
  await save(page).click();

  const notice = page.locator('.lc-form-alert');
  await expect(notice).toContainText('다른 화면에서 이 예약이 변경됐어요. 새 내용을 확인해주세요.');
  await expect(notice).toContainText('18:00–19:00');
  await expect(notice).toContainText('메모: 다른 탭 메모');
  await expect(field(page, '메모 (선택)')).toHaveValue('내가 고친 메모');
  await expect(save(page)).toBeDisabled();
  expect((await stored(page)).bookings[0]).toEqual(changed); // 덮어쓰지 않음

  await notice.getByRole('button', { name: '최신 내용 확인했어요' }).click();
  await expect(notice).toHaveCount(0);
  await expect(save(page)).toBeEnabled();
  await save(page).click();
  await expect(page).toHaveURL(detailUrl(b.id));
  const s = await stored(page);
  expect(s.revision).toBe(6);
  expect(s.bookings[0]).toMatchObject({ memo: '내가 고친 메모', startTime: '19:00' }); // draft 값(시간도 draft의 19:00)
});

test('다른 예약만 바뀐 CONFLICT: 안내 후 다시 누르면 최신 revision으로 저장, 다른 예약 유지', async ({ page }) => {
  const b = booking();
  await openEdit(page, storeOf([b]), b.id);
  await field(page, '메모 (선택)').fill('수정');
  await ack(page).check();
  const added = booking({ date: seoulDate(Date.now() + 12 * DAY), startTime: '18:00' });
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, storeOf([b, added], 7)] as const);
  await save(page).click();
  await expect(page.locator('.lc-alert--error')).toContainText('다른 화면에서 예약 정보가 변경됐어요');
  expect((await stored(page)).revision).toBe(7);
  await save(page).click();
  await expect(page).toHaveURL(detailUrl(b.id));
  const s = await stored(page);
  expect(s.revision).toBe(8);
  expect(s.bookings.find((x: Booking) => x.id === added.id)).toEqual(added);
});

test('편집 중 다른 화면에서 취소·삭제되면 수정 불가·없는 ID 상태로 전환', async ({ page }) => {
  const b = booking();
  await openEdit(page, storeOf([b]), b.id);
  await field(page, '메모 (선택)').fill('수정');
  await ack(page).check();
  const cancelled = { ...b, status: 'cancelled', cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, storeOf([cancelled as Booking], 4)] as const);
  await save(page).click();
  await expect(page.getByRole('heading', { name: '이 예약은 수정할 수 없어요' })).toBeVisible();
  await expect(field(page, '메모 (선택)')).toHaveCount(0);

  await openEdit(page, storeOf([b]), b.id);
  await field(page, '메모 (선택)').fill('수정');
  await ack(page).check();
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, storeOf([], 4)] as const);
  await save(page).click();
  await expect(page.getByRole('heading', { name: '수정할 예약을 찾을 수 없어요' })).toBeVisible();
});

test('없는 ID·잘못된 ID·수정 불가 예약·조회 실패: 편집 폼 없이 각각 다른 상태', async ({ page }) => {
  const failures = watchErrors(page);
  const b = booking();
  const raw = storeOf([b]);
  for (const id of [randomUUID(), 'not-a-uuid']) {
    await seed(page, raw);
    await page.goto(editUrl(id));
    await expect(page.getByRole('heading', { name: '수정할 예약을 찾을 수 없어요' })).toBeVisible();
    await expect(page.getByText('삭제되었거나 주소가 잘못됐을 수 있어요.')).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
    expect(await rawStore(page)).toBe(raw);
  }
  await page.locator('.lc-detail-footer').getByRole('button', { name: '예약 목록으로' }).click();
  await expect(page).toHaveURL(new URL('/bookings', base).toString());

  const cancelled = booking({ status: 'cancelled' });
  const ended = booking({ date: seoulDate(Date.now() - 2 * DAY) });
  for (const x of [cancelled, ended]) {
    await seed(page, storeOf([x]));
    await page.goto(editUrl(x.id));
    await expect(page.getByRole('heading', { name: '이 예약은 수정할 수 없어요' })).toBeVisible();
    await expect(page.getByText('시작 전 예정 예약만 수정할 수 있어요.')).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '변경사항 저장' })).toHaveCount(0);
  }
  await page.locator('.lc-detail-footer').getByRole('button', { name: '예약 상세로' }).click();
  await expect(page).toHaveURL(detailUrl(ended.id));
  await expect(page.locator('.lc-detail-footer').getByRole('link', { name: '예약 수정' })).toHaveCount(0); // 종료 예약은 진입 버튼 없음

  const broken = '{broken';
  await seed(page, broken);
  await page.goto(editUrl(b.id));
  await expect(page.getByRole('alert').filter({ hasText: '예약 정보를 읽지 못했어요' })).toBeVisible();
  await expect(page.getByText('수정할 예약을 찾을 수 없어요')).toHaveCount(0);
  await expect(page.locator('form')).toHaveCount(0);
  expect(await rawStore(page)).toBe(broken);
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, raw] as const);
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(field(page, '메모 (선택)')).toBeVisible();
  expect(failures).toEqual([]);
});

test('정적 HTML은 불러오는 중 화면만(빈 폼·없는 ID를 먼저 보이지 않음)', async ({ request }) => {
  const html = await (await request.get(editUrl(randomUUID()))).text();
  expect(html).toContain('예약을 불러오는 중이에요');
  expect(html).not.toContain('변경사항 저장');
  expect(html).not.toContain('수정할 예약을 찾을 수 없어요');
});

test('이탈: 변경 없음은 바로 상세, 변경 있으면 Dialog(Escape·계속 작성·수정 취소·브라우저 뒤로·나가기)', async ({ page }) => {
  const failures = watchErrors(page);
  const b = booking({ memo: '원래' });
  const raw = storeOf([b]);
  await openEdit(page, raw, b.id);
  await ack(page).check(); // 확인 체크만으로는 dirty가 아니다
  await back(page).click();
  await expect(page).toHaveURL(detailUrl(b.id));

  await page.goto(editUrl(b.id));
  await expect(field(page, '메모 (선택)')).toBeEnabled();
  await cancelEdit(page).click();
  await expect(page).toHaveURL(detailUrl(b.id));

  await page.goto(editUrl(b.id));
  await expect(field(page, '메모 (선택)')).toBeEnabled();
  await field(page, '메모 (선택)').fill('수정 중');
  await back(page).click();
  const dialog = page.getByRole('dialog', { name: '수정을 그만둘까요?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('변경한 내용은 저장되지 않아요.');
  await expect(dialog.getByRole('button', { name: '계속 작성' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(back(page)).toBeFocused();
  await expect(field(page, '메모 (선택)')).toHaveValue('수정 중');

  await cancelEdit(page).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '계속 작성' }).click();
  await expect(dialog).toBeHidden();
  await expect(cancelEdit(page)).toBeFocused();
  await expect(field(page, '메모 (선택)')).toHaveValue('수정 중');

  await page.evaluate(() => history.back());
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(editUrl(b.id));
  await dialog.getByRole('button', { name: '나가기' }).click();
  await expect(page).toHaveURL(detailUrl(b.id));
  await expect(page.locator('.lc-detail-memo__text')).toHaveText('원래');
  expect(await rawStore(page)).toBe(raw);
  expect(failures).toEqual([]);
});

test('새로고침·탭 닫기: 변경이 있으면 브라우저 기본 beforeunload 확인', async ({ page }) => {
  const b = booking();
  await openEdit(page, storeOf([b]), b.id);
  await field(page, '메모 (선택)').click();
  await page.keyboard.type('수정 중');
  const dialogPromise = page.waitForEvent('dialog');
  void page.close({ runBeforeUnload: true });
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe('beforeunload');
  await dialog.dismiss();
});

test('레이아웃: 390×844 본문만 스크롤·Footer 고정·CTA 350px, 320~1440 가로 넘침 없음', async ({ page }) => {
  const b = booking({ memo: '메모' });
  await openEdit(page, storeOf([b]), b.id);
  const footer = page.locator('.lc-detail-footer');
  const box = (await footer.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  expect((await save(page).boundingBox())!.width).toBe(350);
  const viewport = page.locator('.lc-form-viewport');
  expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await viewport.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(cancelEdit(page)).toBeInViewport();
  expect((await cancelEdit(page).boundingBox())!.width).toBe(350);
  await expect(page.locator('.lc-bottom-nav')).toHaveCount(0);
  for (const [w, h] of [[320, 640], [390, 844], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await expectNoHorizontalOverflow(page);
  }
});
