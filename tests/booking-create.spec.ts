import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// 5단계 예약 생성(/bookings/new). 실제 LocalStorage 저장소에 쓰는 화면을 개발 서버(또는 LANDING_TEST_URL)에서 검사한다.
const base = process.env.LANDING_TEST_URL || 'http://localhost:3100';
const NEW_PATH = '/bookings/new';
const KEY = 'lessonconnect:bookings:v2'; // 9단계부터 활성 키(v1은 마이그레이션 원본, booking-image.spec.ts에서 검증)
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const DETAIL_RE = /\/bookings\/detail\?id=[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const seoulDate = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);
const seoulHour = (ms: number) => new Date(ms + 9 * HOUR).getUTCHours();

function seedBooking(date: string, startTime: string) {
  const created = new Date(Date.now() - 2 * DAY).toISOString();
  return {
    id: randomUUID(), offerId: 'offer-kim-guitar-60', instructorId: 'instructor-kim-minjun', spaceId: 'space-dongtan-a', catalogVersion: '1',
    snapshot: { instructorName: '김민준', instrumentId: 'guitar', instrumentLabel: '기타', genres: ['rock', 'blues'], studioName: '동탄 스튜디오', roomName: 'A 레슨실', equipmentLabels: ['기타', '앰프'], examplePriceKRW: 50000, currency: 'KRW', durationMinutes: 60 },
    date, startTime, timeZone: 'Asia/Seoul', memo: '', status: 'scheduled', source: 'seed', createdAt: created, updatedAt: created, cancelledAt: null, referenceImage: null,
  };
}
const storeOf = (bookings: unknown[], revision = 1) =>
  JSON.stringify({ schemaVersion: 2, revision, initializedAt: new Date(Date.now() - 2 * DAY).toISOString(), seedVersion: 1, bookings });

function watchErrors(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') failures.push(m.text()); });
  return failures;
}

/** 저장소 원시값을 넣은 뒤(null이면 키 없음) 생성 화면을 연다. 저장소 준비가 끝날 때까지 기다린다. */
async function openNew(page: Page, raw: string | null, width = 390, height = 844) {
  await page.setViewportSize({ width, height });
  await page.goto(base);
  await page.evaluate(([key, value]) => { localStorage.clear(); sessionStorage.clear(); if (value !== null) localStorage.setItem(key, value); }, [KEY, raw] as const);
  await page.goto(new URL(NEW_PATH, base).toString());
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByLabel('강사 · 레슨 (필수)')).toBeEnabled();
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), KEY);
const field = (page: Page, label: string) => page.getByLabel(label, { exact: true });
const submit = (page: Page) => page.locator('.lc-detail-footer').getByRole('button', { name: '예약하기' });
const futureDate = seoulDate(Date.now() + 5 * DAY);

async function fillValid(page: Page, opts: { date?: string; time?: string; space?: string; memo?: string } = {}) {
  await field(page, '강사 · 레슨 (필수)').selectOption('offer-kim-guitar-60');
  await field(page, '날짜 (필수)').fill(opts.date ?? futureDate);
  await field(page, '시작 시간 (필수)').selectOption(opts.time ?? '20:00');
  await field(page, '레슨 공간 (필수)').selectOption(opts.space ?? 'space-dongtan-b');
  if (opts.memo !== undefined) await field(page, '메모 (선택)').fill(opts.memo);
  await page.getByLabel('예약 내용과 이용 안내를 확인했어요.').check();
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

test('진입: 오류 없음, 상품 미선택이면 종속 필드·CTA 비활성, 데모 안내 표시', async ({ page }) => {
  const failures = watchErrors(page);
  await openNew(page, null); // 최초 방문: 시드 1건 생성
  await expect(page.getByRole('heading', { level: 1, name: '새 레슨 예약' })).toBeVisible();
  await expect(page.locator('.lc-field__error')).toHaveCount(0);
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
  for (const label of ['날짜 (필수)', '시작 시간 (필수)', '레슨 공간 (필수)']) await expect(field(page, label)).toBeDisabled();
  await expect(submit(page)).toBeDisabled();
  await expect(page.getByText('레슨을 선택하면 악기·장르·길이와 가능한 공간을 볼 수 있어요.')).toBeVisible();
  await expect(page.getByText('표시된 일정·공간은 데모 선택 항목이며 실제 예약 가능 여부를 확인하지 않아요.')).toBeAttached();
  await expect(page.getByText('이 기기의 이 브라우저에 예약 내용이 저장돼요. 실제 강사·공간 예약은 확정되지 않아요.')).toBeAttached();
  for (const banned of ['예약 가능', '공간 확보 완료', '강사 확정', '예약 확정']) {
    expect(await page.locator('.lc-app').evaluate((el, t) => (el.textContent ?? '').replace('실제 예약 가능 여부', '').includes(t), banned)).toBe(false);
  }

  // 상품 선택 → 읽기 전용 요약과 카탈로그 옵션만
  await field(page, '강사 · 레슨 (필수)').selectOption('offer-kim-guitar-60');
  await expect(page.getByRole('group', { name: '선택한 레슨 요약' })).toHaveText('기타 · Rock / Blues레슨 길이 60분 · 예시 50,000원');
  expect(await field(page, '시작 시간 (필수)').locator('option:not([value=""])').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value))).toEqual(['18:00', '19:00', '20:00', '21:00']);
  expect(await field(page, '레슨 공간 (필수)').locator('option:not([value=""])').allTextContents()).toEqual([
    '동탄 스튜디오 · A 레슨실 (기타·앰프)', '동탄 스튜디오 · B 레슨실 (기타·앰프)', '동탄 스튜디오 · C 레슨실 (기타)',
  ]);
  await expect(submit(page)).toBeEnabled();
  expect(await stored(page).then((s) => s.bookings.length)).toBe(1); // 입력만으로는 쓰지 않음
  expect(failures).toEqual([]);
});

test('정상 생성: 저장 후 반환 ID 상세로 이동, 성공 알림 1회, 새로고침 후 상세·목록 유지', async ({ page }) => {
  const failures = watchErrors(page);
  await openNew(page, null);
  const before = await stored(page);
  await fillValid(page, { memo: '  첫 레슨이에요.\n앰프 소리 조절을 배우고 싶어요.  ' });
  await submit(page).click();

  await expect(page).toHaveURL(DETAIL_RE);
  const id = new URL(page.url()).searchParams.get('id')!;
  const alert = page.getByRole('status').filter({ hasText: '예약을 저장했어요' });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('실제 강사·공간 예약은 확정되지 않아요.');

  const after = await stored(page);
  expect(after.revision).toBe(before.revision + 1);
  expect(after.bookings).toHaveLength(2);
  const created = after.bookings.find((b: { id: string }) => b.id === id);
  expect(created).toMatchObject({
    offerId: 'offer-kim-guitar-60', spaceId: 'space-dongtan-b', date: futureDate, startTime: '20:00', status: 'scheduled', source: 'user',
    memo: '첫 레슨이에요.\n앰프 소리 조절을 배우고 싶어요.', snapshot: { roomName: 'B 레슨실', durationMinutes: 60 },
  });
  expect(created).not.toHaveProperty('acknowledged');
  await expect(page.locator('.lc-detail-info__row').filter({ hasText: '시간' }).locator('dd')).toHaveText('20:00–21:00');

  // 새로고침: 같은 예약이 보이고 성공 알림은 다시 나오지 않는다
  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: '김민준 선생님과의 레슨' })).toBeVisible();
  await expect(page.locator('.lc-detail-memo__text')).toHaveText('첫 레슨이에요.\n앰프 소리 조절을 배우고 싶어요.');
  await expect(page.getByText('예약을 저장했어요')).toHaveCount(0);

  // 목록: 새로고침해도 2건, 새 카드가 상세로 연결
  await page.goto(new URL('/bookings', base).toString());
  await expect(page.locator('.lc-booking-card')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.lc-booking-card')).toHaveCount(2);
  await expect(page.locator(`a[href="/bookings/detail?id=${id}"]`)).toHaveCount(1);
  expect(failures).toEqual([]);
});

test('목록 CTA → 생성 → 상세 → 목록: 클라이언트 이동으로 전체 흐름 연결', async ({ page }) => {
  await openNew(page, storeOf([]));
  await page.goto(new URL('/bookings', base).toString());
  await page.getByRole('link', { name: '새 레슨 예약' }).first().click();
  await expect(page).toHaveURL(new URL(NEW_PATH, base).toString());
  await fillValid(page);
  await submit(page).click();
  await expect(page).toHaveURL(DETAIL_RE);
  await expect(page.getByText('예약을 저장했어요')).toBeVisible();
  // 6단계부터 예정 예약 상세 Footer는 `예약 수정`이므로 Header 뒤로가기로 목록에 간다.
  await page.getByRole('button', { name: '예약 목록으로 돌아가기' }).click();
  await expect(page.locator('.lc-booking-card')).toHaveCount(1);
});

test('중복 제출: 같은 클릭 2번 + Enter에도 1건만 생성', async ({ page }) => {
  await openNew(page, storeOf([]));
  await fillValid(page);
  await page.evaluate(() => {
    const button = document.querySelector<HTMLButtonElement>('.lc-detail-footer button[type="submit"]')!;
    button.click();
    button.click();
    (document.querySelector('form') as HTMLFormElement).requestSubmit();
  });
  await expect(page).toHaveURL(DETAIL_RE);
  const s = await stored(page);
  expect(s.bookings).toHaveLength(1);
  expect(s.revision).toBe(2);
});

test('잘못된 입력: 제출 시 첫 오류에 포커스, aria 연결, 수정하면 오류가 사라짐', async ({ page }) => {
  const failures = watchErrors(page);
  await openNew(page, storeOf([]));
  await field(page, '강사 · 레슨 (필수)').selectOption('offer-kim-guitar-60');
  await submit(page).click();

  const date = field(page, '날짜 (필수)');
  await expect(date).toBeFocused();
  await expect(date).toHaveAttribute('aria-invalid', 'true');
  const describedBy = await date.getAttribute('aria-describedby');
  await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('날짜를 선택해주세요.');
  await expect(page.getByText('시작 시간을 선택해주세요.')).toBeVisible();
  await expect(page.getByText('레슨 공간을 선택해주세요.')).toBeAttached();
  await expect(page.getByText('예약 내용을 확인해주세요.')).toBeAttached();
  const ack = page.getByLabel('예약 내용과 이용 안내를 확인했어요.');
  await expect(ack).toHaveAttribute('aria-invalid', 'true');

  // 과거 날짜 → 오류, 미래로 고치면 즉시 사라짐
  await date.fill(seoulDate(Date.now() - DAY));
  await expect(page.getByText('미래의 날짜와 시작 시간을 선택해주세요.')).toBeVisible();
  await date.fill(futureDate);
  await expect(date).not.toHaveAttribute('aria-invalid', 'true');

  await field(page, '시작 시간 (필수)').selectOption('19:00');
  await field(page, '레슨 공간 (필수)').selectOption('space-dongtan-c');
  await expect(page.locator('.lc-field__error').filter({ hasText: '시간을' })).toHaveCount(0);

  // 메모 501 code point → 저장 차단, 입력은 남아 있음
  const memo = field(page, '메모 (선택)');
  await memo.fill('🎸'.repeat(501));
  await ack.check();
  await expect(ack).not.toHaveAttribute('aria-invalid', 'true');
  await submit(page).click();
  await expect(memo).toBeFocused();
  await expect(page.getByText('메모는 500자까지 입력할 수 있어요.')).toBeVisible();
  expect(await memo.inputValue()).toBe('🎸'.repeat(501));
  expect((await stored(page)).bookings).toHaveLength(0);
  await memo.press('Backspace');
  await expect(page.getByText('메모는 500자까지 입력할 수 있어요.')).toHaveCount(0);
  await expect(page.getByText('500/500자')).toBeVisible();

  await submit(page).click();
  await expect(page).toHaveURL(DETAIL_RE);
  expect((await stored(page)).bookings[0].memo).toBe('🎸'.repeat(500));
  expect(failures).toEqual([]);
});

test('blur 시점 검증: 값을 바꾸고 떠난 필드만 오류 표시', async ({ page }) => {
  await openNew(page, storeOf([]));
  await field(page, '강사 · 레슨 (필수)').selectOption('offer-kim-guitar-60');
  const date = field(page, '날짜 (필수)');
  await date.fill(seoulDate(Date.now() - 3 * DAY));
  await expect(page.locator('.lc-field__error')).toHaveCount(0); // 아직 포커스 안
  await date.blur();
  await expect(page.locator('.lc-field__error')).toHaveText(['미래의 날짜와 시작 시간을 선택해주세요.']);
});

test('오늘 날짜: 이미 시작한 시각은 고를 수 없음(서울 기준)', async ({ page }) => {
  await openNew(page, storeOf([]));
  await field(page, '강사 · 레슨 (필수)').selectOption('offer-kim-guitar-60');
  await field(page, '날짜 (필수)').fill(seoulDate(Date.now()));
  const hour = seoulHour(Date.now());
  for (const t of ['18:00', '19:00', '20:00', '21:00']) {
    const option = field(page, '시작 시간 (필수)').locator(`option[value="${t}"]`);
    if (Number(t.slice(0, 2)) <= hour) await expect(option).toBeDisabled();
    else await expect(option).toBeEnabled();
  }
});

test('저장 실패(용량 초과·쓰기 실패): 이동 없이 입력 유지, 알림 후 재시도 성공', async ({ page }) => {
  const failures = watchErrors(page);
  await openNew(page, storeOf([]));
  await fillValid(page, { memo: '실패해도 남아야 하는 메모' });
  const viewport = page.locator('.lc-form-viewport');
  await viewport.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  const memoY = async () => (await field(page, '메모 (선택)').boundingBox())!.y;
  const memoBefore = await memoY();

  await page.evaluate(() => {
    (window as unknown as { __setItem: Storage['setItem'] }).__setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); };
  });
  await submit(page).click();
  const alert = page.locator('.lc-alert--error');
  await expect(alert).toContainText('예약을 저장하지 못했어요');
  await expect(alert).toContainText('브라우저 저장 공간이 부족해요. 작성한 내용은 유지했어요.');
  await expect(alert).toBeInViewport(); // 스크롤 위치를 바꾸지 않아도 보이는 고정 알림
  expect(Math.abs((await memoY()) - memoBefore)).toBeLessThanOrEqual(1); // 보던 입력 위치 유지(맨 위로 튀지 않음)
  await expect(page).toHaveURL(new URL(NEW_PATH, base).toString());
  await expect(field(page, '메모 (선택)')).toHaveValue('실패해도 남아야 하는 메모');
  await expect(field(page, '레슨 공간 (필수)')).toHaveValue('space-dongtan-b');
  await expect(page.getByLabel('예약 내용과 이용 안내를 확인했어요.')).toBeChecked();
  await expect(submit(page)).toBeEnabled();
  await expect(submit(page)).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.getByText('예약을 저장했어요')).toHaveCount(0);

  await page.evaluate(() => { Storage.prototype.setItem = function () { throw new Error('boom'); }; });
  await submit(page).click();
  await expect(page.locator('.lc-alert--error')).toContainText('입력 내용은 유지했어요. 다시 시도해주세요.');
  expect(await stored(page).then((s) => s.bookings.length)).toBe(0);

  await page.evaluate(() => { Storage.prototype.setItem = (window as unknown as { __setItem: Storage['setItem'] }).__setItem; });
  await submit(page).click();
  await expect(page).toHaveURL(DETAIL_RE);
  await expect(page.getByText('예약을 저장했어요')).toBeVisible();
  expect(await stored(page).then((s) => s.bookings.length)).toBe(1);
  expect(failures).toEqual([]);
});

test('같은 브라우저의 겹치는 예약: 시작 시간 오류와 포커스, 다른 시간으로 저장', async ({ page }) => {
  await openNew(page, storeOf([seedBooking(futureDate, '20:00')]));
  await fillValid(page);
  await submit(page).click();
  const time = field(page, '시작 시간 (필수)');
  await expect(time).toBeFocused();
  await expect(time).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('같은 시간에 저장된 레슨이 있어요. 다른 시간을 선택해주세요.')).toBeVisible();
  await time.selectOption('21:00'); // 20:00–21:00과 맞닿은 경계는 허용
  await expect(time).not.toHaveAttribute('aria-invalid', 'true');
  await submit(page).click();
  await expect(page).toHaveURL(DETAIL_RE);
});

test('다른 탭 변경(CONFLICT): 덮어쓰지 않고 안내, 확인 후 다시 누르면 저장', async ({ page }) => {
  const other = seedBooking(seoulDate(Date.now() + 9 * DAY), '18:00');
  await openNew(page, storeOf([]));
  await fillValid(page);
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, storeOf([other], 4)] as const);
  await submit(page).click();
  await expect(page.locator('.lc-alert--error')).toContainText('다른 화면에서 예약 정보가 변경됐어요');
  expect((await stored(page)).revision).toBe(4);
  await submit(page).click();
  await expect(page).toHaveURL(DETAIL_RE);
  const s = await stored(page);
  expect(s.revision).toBe(5);
  expect(s.bookings.map((b: { id: string }) => b.id)).toContain(other.id); // 다른 탭의 예약을 지우지 않음
});

test('이탈: 깨끗하면 바로 목록, 작성 중이면 확인 Dialog(Escape·계속 작성·나가기)', async ({ page }) => {
  const failures = watchErrors(page);
  await openNew(page, storeOf([]));
  const back = page.getByRole('button', { name: '예약 목록으로 돌아가기' });
  await back.click();
  await expect(page).toHaveURL(new URL('/bookings', base).toString());

  await page.goto(new URL(NEW_PATH, base).toString());
  await expect(field(page, '강사 · 레슨 (필수)')).toBeEnabled();
  await field(page, '메모 (선택)').fill('작성 중');
  await back.click();
  const dialog = page.getByRole('dialog', { name: '예약 작성을 그만둘까요?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('작성 중인 내용은 저장되지 않아요.');
  await expect(dialog.getByRole('button', { name: '계속 작성' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(back).toBeFocused();
  await expect(field(page, '메모 (선택)')).toHaveValue('작성 중');

  await back.click();
  await dialog.getByRole('button', { name: '계속 작성' }).click();
  await expect(dialog).toBeHidden();
  await expect(field(page, '메모 (선택)')).toHaveValue('작성 중');

  // 브라우저 뒤로가기도 같은 Dialog
  await page.evaluate(() => history.back());
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(new URL(NEW_PATH, base).toString());
  await dialog.getByRole('button', { name: '나가기' }).click();
  await expect(page).toHaveURL(new URL('/bookings', base).toString());
  expect((await stored(page)).bookings).toHaveLength(0);
  expect(failures).toEqual([]);
});

test('새로고침·탭 닫기: 작성 중이면 브라우저 기본 beforeunload 확인', async ({ page }) => {
  await openNew(page, storeOf([]));
  await field(page, '메모 (선택)').click();
  await page.keyboard.type('작성 중'); // Chrome은 실제 사용자 입력이 있었던 페이지에서만 확인창을 띄운다
  const dialogPromise = page.waitForEvent('dialog');
  void page.close({ runBeforeUnload: true });
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe('beforeunload');
  await dialog.dismiss();
});

test('저장소 초기화 실패: 빈 폼으로 넘어가지 않고 재시도 제공', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.evaluate((key) => { localStorage.clear(); localStorage.setItem(key, '{broken'); }, KEY);
  await page.goto(new URL(NEW_PATH, base).toString());
  await expect(page.locator('.lc-alert--error')).toContainText('저장된 예약 정보를 읽을 수 없어요.');
  await expect(page.getByLabel('강사 · 레슨 (필수)')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe('{broken'); // 덮어쓰지 않음
});

test('레이아웃: 390×844 본문만 스크롤·Header/Footer 고정, 320~1440 가로 넘침 없음', async ({ page }) => {
  await openNew(page, storeOf([]));
  await field(page, '강사 · 레슨 (필수)').selectOption('offer-kim-guitar-60');
  await submit(page).click(); // 오류 문구가 모두 보이는 상태
  const footer = page.locator('.lc-detail-footer');
  const box = (await footer.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  expect((await submit(page).boundingBox())!.width).toBe(350);
  const viewport = page.locator('.lc-form-viewport');
  expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await viewport.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  const note = page.getByText('이 기기의 이 브라우저에 예약 내용이 저장돼요. 실제 강사·공간 예약은 확정되지 않아요.');
  await expect(note).toBeInViewport();
  expect((await note.boundingBox())!.y + (await note.boundingBox())!.height).toBeLessThanOrEqual(box.y);
  await expect(page.getByRole('heading', { level: 1, name: '새 레슨 예약' })).toBeInViewport();
  for (const [w, h] of [[320, 640], [390, 844], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await expectNoHorizontalOverflow(page);
  }
});
