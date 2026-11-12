import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// 10단계 통합(design/handoff.md §3, design/qa-checklist.md A·B·D·F).
// 앱 홈 `/home`의 다가오는 레슨(실제 v2 데이터) · 강사 예시 → `/bookings/new?offerId=` 사전 선택 진입 ·
// 잘못된 offerId · 진입 문맥별 뒤로가기 · 생성 용량 초과 문구(선택 이미지 있음) · 390/320 레이아웃·키보드를 검사한다.
const base = process.env.LANDING_TEST_URL || 'http://localhost:3100';
const KEY = 'lessonconnect:bookings:v2';
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const OFFER = 'offer-kim-guitar-60';
const url = (path: string) => new URL(path, base).toString();
const seoulDate = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);
const seoulHHMM = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(11, 16);

function booking(over: Partial<{ date: string; startTime: string; status: 'scheduled' | 'cancelled'; roomName: string; createdAt: string }> = {}) {
  const created = over.createdAt ?? new Date(Date.now() - 3 * DAY).toISOString();
  const cancelled = over.status === 'cancelled';
  return {
    id: randomUUID(), offerId: OFFER, instructorId: 'instructor-kim-minjun', spaceId: 'space-dongtan-a', catalogVersion: '1',
    snapshot: { instructorName: '김민준', instrumentId: 'guitar', instrumentLabel: '기타', genres: ['rock', 'blues'], studioName: '동탄 스튜디오', roomName: over.roomName ?? 'A 레슨실', equipmentLabels: ['기타', '앰프'], examplePriceKRW: 50000, currency: 'KRW', durationMinutes: 60 },
    date: over.date ?? seoulDate(Date.now() + 7 * DAY), startTime: over.startTime ?? '19:00', timeZone: 'Asia/Seoul', memo: '',
    status: over.status ?? 'scheduled', source: 'user', createdAt: created, updatedAt: created, cancelledAt: cancelled ? created : null, referenceImage: null,
  };
}
const storeOf = (bookings: object[]) =>
  JSON.stringify({ schemaVersion: 2, revision: 4, initializedAt: new Date(Date.now() - 5 * DAY).toISOString(), seedVersion: 1, bookings });

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

async function openHome(page: Page, raw: string | null, width = 390, height = 844) {
  await seed(page, raw, width, height);
  await page.goto(url('/home'));
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.lc-home')).not.toHaveAttribute('aria-busy', 'true');
}

const upcoming = (page: Page) => page.getByRole('region', { name: '다가오는 레슨' });
const field = (page: Page, label: string) => page.getByLabel(label, { exact: true });
const ack = (page: Page) => page.getByLabel('예약 내용과 이용 안내를 확인했어요.');
const rawStore = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEY);

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

test('홈: 저장소가 없으면 시드 1건을 다가오는 레슨으로 표시하고 카드는 목록으로 이동', async ({ page }) => {
  const failures = watchErrors(page);
  await openHome(page, null);
  const region = upcoming(page);
  const seedDate = seoulDate(Date.now() + 7 * DAY);
  const [, m, d] = seedDate.split('-').map(Number);
  const card = region.getByRole('link', { name: /다가오는 레슨: 김민준 선생님/ });
  await expect(card).toContainText(`${m}월 ${d}일`);
  await expect(card).toContainText('19:00–20:00');
  await expect(card).toContainText('동탄 스튜디오 · A 레슨실');
  await expect(card).toHaveAttribute('href', '/bookings');
  // Figma 고정 예시(3월 15일 등)를 쓰지 않는다
  await expect(page.getByText('3월 15일')).toHaveCount(0);
  expect(JSON.parse((await rawStore(page))!).bookings).toHaveLength(1);
  await card.click();
  await expect(page).toHaveURL(url('/bookings'));
  expect(failures).toEqual([]);
});

test('홈: 예정 중 가장 이른 1건만 표시하고 취소·진행 중·종료는 제외', async ({ page }) => {
  const now = Date.now();
  const inProgressStart = now - 20 * 60e3; // 시작 20분 경과 = 진행 중
  const bookings = [
    booking({ date: seoulDate(now + 9 * DAY), roomName: 'C 레슨실' }),
    booking({ date: seoulDate(now + 2 * DAY), status: 'cancelled', roomName: '취소된 방' }),
    booking({ date: seoulDate(now - 2 * DAY), roomName: '종료된 방' }),
    booking({ date: seoulDate(inProgressStart), startTime: seoulHHMM(inProgressStart - (inProgressStart % 60e3)), roomName: '진행 중 방' }),
    booking({ date: seoulDate(now + 4 * DAY), roomName: 'B 레슨실' }),
  ];
  await openHome(page, storeOf(bookings));
  const card = upcoming(page).getByRole('link', { name: /다가오는 레슨/ });
  await expect(card).toContainText('B 레슨실');
  await expect(card).toContainText('예정 레슨 1건 더');
  for (const room of ['취소된 방', '종료된 방', '진행 중 방', 'C 레슨실']) await expect(upcoming(page).getByText(room)).toHaveCount(0);
});

test('홈: 0건은 빈 상태와 목록 링크, 새로고침해도 재시드하지 않음', async ({ page }) => {
  await openHome(page, storeOf([]));
  await expect(upcoming(page).getByText('예정된 레슨이 없어요')).toBeVisible();
  await expect(upcoming(page).getByRole('link', { name: '예약 목록 보기' })).toHaveAttribute('href', '/bookings');
  await page.reload();
  await expect(upcoming(page).getByText('예정된 레슨이 없어요')).toBeVisible();
  expect(JSON.parse((await rawStore(page))!).bookings).toEqual([]);
});

test('홈: 손상된 저장소는 오류·다시 시도, 원본을 바꾸지 않음', async ({ page }) => {
  const failures = watchErrors(page);
  await openHome(page, '{not json');
  await expect(upcoming(page).getByRole('alert')).toContainText('예약 현황을 불러오지 못했어요');
  await expect(upcoming(page).getByText('예정된 레슨이 없어요')).toHaveCount(0);
  await upcoming(page).getByRole('button', { name: '다시 시도' }).click();
  await expect(upcoming(page).getByRole('alert')).toBeVisible();
  expect(await rawStore(page)).toBe('{not json');
  expect(failures).toEqual([]);
});

test('홈: 다른 탭에서 예약을 취소하면 다가오는 레슨이 갱신됨', async ({ page, context }) => {
  const b = booking({ date: seoulDate(Date.now() + 3 * DAY) });
  await openHome(page, storeOf([b]));
  await expect(upcoming(page).getByRole('link', { name: /다가오는 레슨/ })).toBeVisible();
  const other = await context.newPage();
  await other.goto(url('/home'));
  await other.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, storeOf([{ ...b, status: 'cancelled', cancelledAt: b.updatedAt }])] as const);
  await expect(upcoming(page).getByText('예정된 레슨이 없어요')).toBeVisible();
  await other.close();
});

test('강사 예시 → 상품만 사전 선택된 생성 폼, 뒤로가기는 홈', async ({ page }) => {
  const failures = watchErrors(page);
  await openHome(page, storeOf([]));
  const instructor = page.getByRole('article', { name: '김민준 선생님' });
  await expect(instructor.getByText('예시 강사', { exact: true })).toBeVisible();
  await expect(instructor.getByText(/AI 매칭 결과·후기·검증 내역이 아니에요/)).toBeVisible();
  await expect(page.getByText(/AI 매칭 9\d%|★/)).toHaveCount(0);
  await instructor.getByRole('link', { name: '이 강사와 레슨하기' }).click();
  await expect(page).toHaveURL(url(`/bookings/new?offerId=${OFFER}&from=home`));
  await expect(field(page, '강사 · 레슨 (필수)')).toBeEnabled();
  await expect(field(page, '강사 · 레슨 (필수)')).toHaveValue(OFFER);
  await expect(field(page, '날짜 (필수)')).toHaveValue('');
  await expect(field(page, '시작 시간 (필수)')).toHaveValue('');
  await expect(field(page, '레슨 공간 (필수)')).toHaveValue('');
  await expect(ack(page)).not.toBeChecked();
  await expect(page.locator('.lc-alert--error')).toHaveCount(0);

  // 사전 선택만으로는 미저장 변경이 아니다 → 확인 없이 홈으로
  await page.getByRole('button', { name: '홈으로 돌아가기' }).click();
  await expect(page).toHaveURL(url('/home'));
  expect(failures).toEqual([]);
});

test('강사 진입 생성: 입력 후 뒤로가기는 이탈 확인, 저장하면 홈 현황에 반영', async ({ page }) => {
  await seed(page, storeOf([booking({ date: seoulDate(Date.now() + 10 * DAY) })]));
  await page.goto(url(`/bookings/new?offerId=${OFFER}&from=home`));
  await expect(field(page, '강사 · 레슨 (필수)')).toHaveValue(OFFER);
  const date = seoulDate(Date.now() + 2 * DAY);
  await field(page, '날짜 (필수)').fill(date);
  await page.getByRole('button', { name: '홈으로 돌아가기' }).click();
  const dialog = page.getByRole('dialog', { name: '예약 작성을 그만둘까요?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '계속 작성' }).click();
  await expect(field(page, '날짜 (필수)')).toHaveValue(date);

  await field(page, '시작 시간 (필수)').selectOption('20:00');
  await field(page, '레슨 공간 (필수)').selectOption('space-dongtan-b');
  await ack(page).check();
  await page.locator('.lc-detail-footer').getByRole('button', { name: '예약하기' }).click();
  await expect(page).toHaveURL(/\/bookings\/detail\?id=[0-9a-f-]{36}$/);
  await page.goto(url('/home'));
  const card = upcoming(page).getByRole('link', { name: /다가오는 레슨/ });
  await expect(card).toContainText('B 레슨실');
  await expect(card).toContainText('20:00–21:00');
  await expect(card).toContainText('예정 레슨 1건 더');
});

for (const [label, query] of [['없는 상품', 'offerId=offer-unknown'], ['빈 값', 'offerId='], ['악의적 문자열', 'offerId=%3Cscript%3E']] as const) {
  test(`잘못된 offerId(${label}): 다른 상품으로 대체하지 않고 선택 오류 안내, 뒤로가기는 목록`, async ({ page }) => {
    const failures = watchErrors(page);
    await seed(page, storeOf([]));
    await page.goto(url(`/bookings/new?${query}`));
    await expect(field(page, '강사 · 레슨 (필수)')).toBeEnabled();
    await expect(field(page, '강사 · 레슨 (필수)')).toHaveValue('');
    await expect(page.locator('.lc-form-alert').getByRole('alert')).toContainText('선택한 강사 레슨을 찾을 수 없어요');
    await field(page, '강사 · 레슨 (필수)').selectOption(OFFER);
    await expect(page.getByText('선택한 강사 레슨을 찾을 수 없어요')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '예약 목록으로 돌아가기' })).toBeVisible();
    expect(failures).toEqual([]);
  });
}

test('목록 진입 생성은 상품을 선택하지 않고 뒤로가기는 목록', async ({ page }) => {
  await seed(page, storeOf([]));
  await page.goto(url('/bookings'));
  await page.getByRole('link', { name: '새 레슨 예약' }).click();
  await expect(page).toHaveURL(url('/bookings/new'));
  await expect(field(page, '강사 · 레슨 (필수)')).toBeEnabled();
  await expect(field(page, '강사 · 레슨 (필수)')).toHaveValue('');
  await page.getByRole('button', { name: '예약 목록으로 돌아가기' }).click();
  await expect(page).toHaveURL(url('/bookings'));
});

test('생성 용량 초과(선택 이미지 있음): 기존 이미지라고 지칭하지 않고 입력·이미지 유지', async ({ page }) => {
  await seed(page, storeOf([]));
  await page.goto(url(`/bookings/new?offerId=${OFFER}&from=home`));
  await expect(field(page, '강사 · 레슨 (필수)')).toHaveValue(OFFER);
  const png = Buffer.from(await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 240;
    const x = c.getContext('2d')!;
    x.fillStyle = '#d9a46b'; x.fillRect(0, 0, 320, 240);
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png'));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return btoa(String.fromCharCode(...bytes));
  }), 'base64');
  const group = page.getByRole('group', { name: '참고 이미지 (선택)' });
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), group.getByRole('button', { name: '참고 이미지 선택' }).click()]);
  await chooser.setFiles({ name: 'quota.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.lc-image-card__thumb')).toBeVisible();
  await field(page, '날짜 (필수)').fill(seoulDate(Date.now() + 5 * DAY));
  await field(page, '시작 시간 (필수)').selectOption('20:00');
  await field(page, '레슨 공간 (필수)').selectOption('space-dongtan-b');
  await ack(page).check();
  const before = await rawStore(page);
  await page.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); }; });
  await page.locator('.lc-detail-footer').getByRole('button', { name: '예약하기' }).click();
  const alert = page.locator('.lc-alert--error');
  await expect(alert).toContainText('브라우저 저장 공간이 부족해요. 작성한 내용과 선택한 이미지는 유지했어요.');
  await expect(alert).not.toContainText('기존 이미지');
  await expect(page.locator('.lc-image-card__thumb')).toBeVisible();
  await expect(field(page, '강사 · 레슨 (필수)')).toHaveValue(OFFER);
  expect(await rawStore(page)).toBe(before);
});

test('홈 레이아웃·내비·키보드: 390/320 가로 넘침 없음, 홈 탭 현재 위치, Tab으로 CTA 실행', async ({ page }) => {
  const failures = watchErrors(page);
  for (const width of [390, 320]) {
    await openHome(page, storeOf([booking()]), width, 844);
    await expectNoHorizontalOverflow(page);
    const nav = page.getByRole('navigation', { name: '앱 메뉴' });
    await expect(nav).toBeInViewport();
    await expect(nav.getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: '예약' })).toHaveAttribute('href', '/bookings');
    await expect(nav.getByRole('link')).toHaveCount(2); // 찾기·마이는 준비 중(링크 아님)
    const photo = page.getByRole('img', { name: '기타를 든 김민준 선생님의 예시 프로필' });
    await expect(photo).toBeVisible();
    expect(await photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  const cta = page.getByRole('link', { name: '이 강사와 레슨하기' });
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    if (await cta.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(cta).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(url(`/bookings/new?offerId=${OFFER}&from=home`));
  expect(failures).toEqual([]);
});

test('정적 경로 직접 진입·새로고침: /home, 상세·수정 ?id=, 없는 ID', async ({ page }) => {
  const b = booking();
  await seed(page, storeOf([b]));
  await page.goto(url('/home'));
  await page.reload();
  await expect(upcoming(page).getByRole('link', { name: /다가오는 레슨: 김민준 선생님/ })).toBeVisible();
  await page.goto(url(`/bookings/detail?id=${b.id}`));
  await page.reload();
  await expect(page.getByRole('heading', { name: '김민준 선생님과의 레슨' })).toBeVisible();
  await page.goto(url(`/bookings/edit?id=${b.id}`));
  await page.reload();
  await expect(field(page, '강사 · 레슨 (필수)')).toHaveValue(OFFER);
  await page.goto(url(`/bookings/detail?id=${randomUUID()}`));
  await expect(page.getByText(/찾을 수 없어요/).first()).toBeVisible();
});

// 10단계 후속: 랜딩(/)에서 앱 홈으로 들어가는 입구. 승인된 랜딩 구성은 그대로 두고 링크만 추가했다.
for (const width of [320, 390, 768, 1440]) {
  test(`랜딩 → 앱 홈 입구 ${width}: 메뉴 '내 예약'·히어로 '예약 데모 보기'`, async ({ page }) => {
    const failures = watchErrors(page);
    await seed(page, storeOf([booking()]), width, 900);
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await expectNoHorizontalOverflow(page);

    const hero = page.locator('.hero').getByRole('link', { name: '예약 데모 보기' });
    await expect(hero).toHaveAttribute('href', '/home');

    if (width < 768) {
      await page.getByRole('button', { name: '메뉴 열기' }).click();
      const menu = page.getByRole('navigation', { name: '모바일 메뉴' });
      await menu.getByRole('link', { name: '내 예약' }).click();
    } else {
      await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '내 예약' }).click();
    }
    await expect(page).toHaveURL(url('/home'));
    await expect(upcoming(page).getByRole('link', { name: /다가오는 레슨: 김민준 선생님/ })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(url('/'));
    await hero.click();
    await expect(page).toHaveURL(url('/home'));
    expect(failures).toEqual([]);
  });
}
