import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { formatLessonDate } from '../lib/bookings/format';
import { ERROR_MESSAGES } from '../lib/bookings/messages';

// 4단계 예약 상세(/bookings/detail?id=…). 실제 LocalStorage 저장소에서 읽는 화면을 개발 서버(또는 LANDING_TEST_URL)에서 검사한다.
const base = process.env.LANDING_TEST_URL || 'http://localhost:3100';
const LIST_PATH = '/bookings';
const detailUrl = (id: string) => new URL(`/bookings/detail?id=${encodeURIComponent(id)}`, base).toString();
const KEY = 'lessonconnect:bookings:v1';
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const FOCUS_BLUE = 'rgb(56, 117, 199)';

const seoulDate = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);
const seoulHour = (ms: number) => new Date(ms + 9 * HOUR).getUTCHours();
const pad = (n: number) => String(n).padStart(2, '0');

type Fixture = { date: string; startTime: string; status?: 'scheduled' | 'cancelled'; memo?: string; instructorName?: string; studioName?: string; roomName?: string; genres?: string[] };

function booking(f: Fixture) {
  const created = new Date(Date.now() - 30 * DAY).toISOString();
  const status = f.status ?? 'scheduled';
  return {
    id: randomUUID(),
    offerId: 'offer-kim-guitar-60',
    instructorId: 'instructor-kim-minjun',
    spaceId: 'space-dongtan-a',
    catalogVersion: '1',
    snapshot: {
      instructorName: f.instructorName ?? '김민준',
      instrumentId: 'guitar',
      instrumentLabel: '기타',
      genres: f.genres ?? ['rock', 'blues'],
      studioName: f.studioName ?? '동탄 스튜디오',
      roomName: f.roomName ?? 'A 레슨실',
      equipmentLabels: ['기타', '앰프'],
      examplePriceKRW: 50000,
      currency: 'KRW',
      durationMinutes: 60,
    },
    date: f.date,
    startTime: f.startTime,
    timeZone: 'Asia/Seoul',
    memo: f.memo ?? '',
    status,
    source: 'user',
    createdAt: created,
    updatedAt: created,
    cancelledAt: status === 'cancelled' ? created : null,
  };
}

const store = (bookings: ReturnType<typeof booking>[]) =>
  JSON.stringify({ schemaVersion: 1, revision: 3, initializedAt: new Date(Date.now() - 30 * DAY).toISOString(), seedVersion: 1, bookings });

const upcoming = (extra: Partial<Fixture> = {}) => booking({ date: seoulDate(Date.now() + 7 * DAY), startTime: '19:00', ...extra });

function watchErrors(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') failures.push(m.text()); });
  return failures;
}

/** 상세 URL로 직접 접속하기 전에 LocalStorage 원시값을 넣는다(null이면 키 없음). */
async function openDetail(page: Page, raw: string | null, id: string, width = 390, height = 844) {
  await page.setViewportSize({ width, height });
  await page.goto(base);
  await page.evaluate(([key, value]) => { localStorage.clear(); sessionStorage.clear(); if (value !== null) localStorage.setItem(key, value); }, [KEY, raw] as const);
  await page.goto(detailUrl(id));
  await page.evaluate(() => document.fonts.ready);
}

const rawStore = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEY);
const infoValue = (page: Page, label: string) => page.locator('.lc-detail-info__row').filter({ has: page.locator('dt', { hasText: label }) }).locator('dd');
const footerLink = (page: Page) => page.locator('.lc-detail-footer').getByRole('link', { name: '예약 목록으로' });

async function expectNoBookingActions(page: Page) {
  for (const name of ['예약 수정', '예약 취소', '예약 기록 삭제']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
  }
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

test('목록 카드 → 상세: 시드 예약을 snapshot·서울 시각으로 표시, 새로고침해도 같은 ID', async ({ page }) => {
  const failures = watchErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(new URL(LIST_PATH, base).toString());
  const card = page.locator('.lc-booking-card').first();
  await expect(card).toBeVisible();
  const seed = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).bookings[0], KEY);
  const raw = await rawStore(page);
  await card.click();
  await expect(page).toHaveURL(detailUrl(seed.id));

  const check = async () => {
    await expect(page.getByRole('heading', { level: 1, name: '예약 상세' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '김민준 선생님과의 레슨' })).toBeVisible();
    await expect(page.locator('.lc-detail-heading .lc-badge')).toHaveText('예정');
    await expect(infoValue(page, '강사')).toHaveText('김민준 선생님');
    await expect(infoValue(page, '악기')).toHaveText('기타 · 60분');
    await expect(infoValue(page, '장르')).toHaveText('Rock · Blues');
    await expect(infoValue(page, '날짜')).toHaveText(formatLessonDate(seoulDate(Date.now() + 7 * DAY)));
    await expect(infoValue(page, '시간')).toHaveText('19:00–20:00');
    await expect(infoValue(page, '공간')).toHaveText('동탄 스튜디오 · A 레슨실');
    await expect(page.locator('.lc-detail-memo__text--empty')).toHaveText('작성한 메모가 없어요.');
  };
  await check();
  await page.reload();
  await expect(page).toHaveURL(detailUrl(seed.id));
  await check();
  expect(await rawStore(page)).toBe(raw); // 상세 조회는 쓰기를 하지 않는다
  expect(failures).toEqual([]);
});

test('예정 예약: 수정·취소 자리는 준비 중 안내만, 동작하지 않는 버튼·쓰기 없음', async ({ page }) => {
  const failures = watchErrors(page);
  const b = upcoming({ memo: '퇴근 후 레슨을 희망해요.' });
  const raw = store([b]);
  await openDetail(page, raw, b.id);
  await expect(page.locator('.lc-detail-memo__text')).toHaveText('퇴근 후 레슨을 희망해요.');
  const manage = page.getByRole('region', { name: '예약 관리' });
  await expect(manage).toContainText('예약 수정·취소는 준비 중이에요');
  await expect(manage).toContainText('레슨 시작 전까지 수정하거나 취소할 수 있어요.');
  await expectNoBookingActions(page);
  await expect(footerLink(page)).toHaveAttribute('href', LIST_PATH);
  // 페이지의 조작 요소는 헤더 뒤로가기와 목록 링크뿐
  // (개발 서버의 Next.js 오버레이 shadow DOM 요소를 빼기 위해 화면 루트로 한정)
  await expect(page.locator('.lc-app').locator('button:not([disabled]), a[href]')).toHaveCount(2);
  expect(await rawStore(page)).toBe(raw);
  expect(failures).toEqual([]);
});

test('상태별 표시: 진행 중은 관리 영역 없음, 종료·취소됨은 삭제 준비 중 안내', async ({ page }) => {
  const now = Date.now();
  const inProgress = booking({ date: seoulDate(now), startTime: `${pad(seoulHour(now))}:00` });
  const ended = booking({ date: seoulDate(now - DAY), startTime: '19:00' });
  const cancelled = booking({ date: seoulDate(now + 3 * DAY), startTime: '20:00', status: 'cancelled' });
  const raw = store([inProgress, ended, cancelled]);

  await openDetail(page, raw, inProgress.id);
  await expect(page.locator('.lc-detail-heading .lc-badge')).toHaveText('진행 중');
  await expect(page.getByText('지금 진행 중인 레슨이에요.')).toBeVisible();
  await expect(page.getByRole('region', { name: '예약 관리' })).toHaveCount(0);
  await expectNoBookingActions(page);

  await page.goto(detailUrl(ended.id));
  await expect(page.locator('.lc-detail-heading .lc-badge')).toHaveText('종료');
  await expect(page.getByRole('region', { name: '예약 관리' })).toContainText('예약 기록 삭제는 준비 중이에요');
  await expectNoBookingActions(page);

  await page.goto(detailUrl(cancelled.id));
  await expect(page.locator('.lc-detail-heading .lc-badge')).toHaveText('취소됨');
  await expect(page.getByText('이 예약은 취소되었어요.')).toBeVisible();
  await expect(infoValue(page, '시간')).toHaveText('20:00–21:00');
  await expect(page.getByRole('region', { name: '예약 관리' })).toContainText('예약 기록 삭제는 준비 중이에요');
  await expectNoBookingActions(page);
  await expect(footerLink(page)).toBeVisible();
  expect(await rawStore(page)).toBe(raw);
});

test('긴 메모 500자·긴 값: 자르지 않고 줄바꿈 유지, 본문만 스크롤해 끝까지 도달', async ({ page }) => {
  const failures = watchErrors(page);
  const head = '첫 줄 메모예요.\n\n<b>HTML 아님</b>\n' + 'A'.repeat(120) + '\n';
  const memo = head + '🎸'.repeat(20) + '가'.repeat(500 - [...head].length - 20);
  expect([...memo].length).toBe(500);
  const b = upcoming({
    memo,
    instructorName: '아주아주긴이름을가진강사님의전체이름이잘리지않는지확인합니다',
    studioName: '동탄 센트럴파크 앞 아주 긴 이름의 음악 스튜디오',
    roomName: '지하 1층 방음 처리된 B-2 레슨실',
    genres: ['rnb', 'k-pop', 'new-age'],
  });
  await openDetail(page, store([b]), b.id);

  const text = page.locator('.lc-detail-memo__text');
  expect(await text.evaluate((el) => el.textContent)).toBe(memo);
  await expect(text.locator('b')).toHaveCount(0); // HTML로 해석하지 않음
  expect(await text.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('pre-wrap');
  expect(await text.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(infoValue(page, '강사')).toHaveText('아주아주긴이름을가진강사님의전체이름이잘리지않는지확인합니다 선생님');
  await expect(infoValue(page, '공간')).toHaveText('동탄 센트럴파크 앞 아주 긴 이름의 음악 스튜디오 · 지하 1층 방음 처리된 B-2 레슨실');
  await expect(infoValue(page, '장르')).toHaveText('R&B · K-Pop · New Age');
  for (const el of await page.locator('.lc-detail-card').all()) {
    expect((await el.boundingBox())!.width).toBe(350);
  }

  const viewport = page.locator('.lc-detail-viewport');
  expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  const footer = page.locator('.lc-detail-footer');
  const footerTop = (await footer.boundingBox())!.y;
  expect(footerTop + (await footer.boundingBox())!.height).toBeLessThanOrEqual(844);
  await viewport.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(100);
  expect((await footer.boundingBox())!.y).toBe(footerTop); // Footer 고정
  const lastAlert = page.getByRole('region', { name: '예약 관리' }).locator('.lc-alert');
  const box = (await lastAlert.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(footerTop);
  await expect(lastAlert).toBeInViewport({ ratio: 1 });
  await expectNoHorizontalOverflow(page);
  expect(failures).toEqual([]);
});

test('없는 ID: 저장소에 없는 UUID·잘못된 형식·ID 없음 모두 없는 ID 화면, 데이터 변경 없음', async ({ page }) => {
  const failures = watchErrors(page);
  const b = upcoming();
  const raw = store([b]);
  for (const id of [randomUUID(), 'not-a-uuid', '']) {
    await openDetail(page, raw, id);
    await expect(page.getByRole('heading', { name: '예약을 찾을 수 없어요' })).toBeVisible();
    await expect(page.getByText('삭제되었거나 주소가 잘못됐을 수 있어요.')).toBeVisible();
    await expect(page.locator('.lc-detail-content')).toHaveCount(0);
    await expect(page.getByRole('alert').filter({ hasText: '예약 정보를 읽지 못했어요' })).toHaveCount(0);
    await expectNoBookingActions(page);
    await expect(footerLink(page)).toHaveAttribute('href', LIST_PATH);
    expect(await rawStore(page)).toBe(raw);
  }
  // 쿼리 자체가 없는 주소
  await page.goto(new URL('/bookings/detail', base).toString());
  await expect(page.getByRole('heading', { name: '예약을 찾을 수 없어요' })).toBeVisible();
  // 헤더 뒤로가기는 방문 기록과 무관하게 목록으로
  await page.getByRole('button', { name: '예약 목록으로 돌아가기' }).click();
  await expect(page).toHaveURL(new URL(LIST_PATH, base).toString());
  expect(failures).toEqual([]);
});

test('조회 실패: NOT_FOUND와 구분, 데이터 보존, 다시 시도 성공 시 상세 전환', async ({ page }) => {
  const failures = watchErrors(page);
  const b = upcoming();
  const broken = '{"schemaVersion":1,"bookings":';
  await openDetail(page, broken, b.id);
  const alert = page.getByRole('alert').filter({ hasText: '예약 정보를 읽지 못했어요' });
  await expect(alert).toContainText(ERROR_MESSAGES.CORRUPT_DATA);
  await expect(page.getByRole('heading', { name: '예약 상세를 표시할 수 없어요' })).toBeVisible();
  await expect(page.getByText('예약을 찾을 수 없어요')).toHaveCount(0);
  await expect(page.locator('.lc-detail-content')).toHaveCount(0);
  await expectNoBookingActions(page);
  await expect(footerLink(page)).toHaveAttribute('href', LIST_PATH);

  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(alert).toBeVisible();
  expect(await rawStore(page)).toBe(broken); // 덮어쓰거나 지우지 않음

  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, store([b])] as const);
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('heading', { level: 2, name: '김민준 선생님과의 레슨' })).toBeVisible();
  await expect(alert).toHaveCount(0);
  expect(failures).toEqual([]);
});

test('필수 필드 손상·버전 불일치는 미정 표시 없이 조회 실패', async ({ page }) => {
  const b = upcoming();
  const damaged = JSON.parse(store([b]));
  delete damaged.bookings[0].snapshot.instructorName;
  await openDetail(page, JSON.stringify(damaged), b.id);
  await expect(page.getByRole('alert').filter({ hasText: '예약 정보를 읽지 못했어요' })).toContainText(ERROR_MESSAGES.CORRUPT_DATA);
  await expect(page.getByText('미정')).toHaveCount(0);

  const v2 = JSON.stringify({ ...JSON.parse(store([b])), schemaVersion: 2 });
  await openDetail(page, v2, b.id);
  await expect(page.getByRole('alert').filter({ hasText: '예약 정보를 읽지 못했어요' })).toContainText(ERROR_MESSAGES.UNSUPPORTED_VERSION);
  expect(await rawStore(page)).toBe(v2);
});

test('초기화 중: 정적 HTML은 로딩 상태, 빈 상세·없는 ID·목록 링크를 먼저 보여주지 않음', async ({ request }) => {
  const html = await (await request.get(detailUrl(randomUUID()))).text();
  expect(html).toContain('예약을 불러오는 중이에요');
  expect(html).toContain('예약 확인 중');
  expect(html).toContain('aria-busy="true"');
  expect(html).not.toContain('예약을 찾을 수 없어요');
  expect(html).not.toContain('작성한 메모가 없어요');
  expect(html).not.toContain('예약 정보를 읽지 못했어요');
});

test('다른 탭에서 삭제되면 없는 ID 화면으로 바뀜', async ({ page }) => {
  const b = upcoming();
  await openDetail(page, store([b]), b.id);
  await expect(page.getByRole('heading', { level: 2, name: '김민준 선생님과의 레슨' })).toBeVisible();
  await page.evaluate(([key, value]) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent('storage', { key }));
  }, [KEY, store([])] as const);
  await expect(page.getByRole('heading', { name: '예약을 찾을 수 없어요' })).toBeVisible();
});

test('키보드: 뒤로가기 → 목록 링크 순서, 포커스 링, Enter로 목록 이동', async ({ page }) => {
  const b = upcoming();
  await openDetail(page, store([b]), b.id);
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  const back = page.getByRole('button', { name: '예약 목록으로 돌아가기' });
  await expect(back).toBeEnabled();
  await page.keyboard.press('Tab');
  await expect(back).toBeFocused();
  expect((await back.boundingBox())!.width).toBe(44);
  await page.keyboard.press('Tab');
  const link = footerLink(page);
  await expect(link).toBeFocused();
  await expect.poll(() => link.evaluate((el) => { const s = getComputedStyle(el); return [s.outlineColor, s.outlineWidth]; })).toEqual([FOCUS_BLUE, '2px']);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new URL(LIST_PATH, base).toString());
  await expect(page.locator('.lc-booking-card')).toHaveCount(1);
});

test('320/390px 가로 넘침 없음, 이미지 로드·장식 alt', async ({ page }) => {
  const failures = watchErrors(page);
  const b = upcoming({ memo: '메모' });
  for (const width of [320, 390]) {
    await openDetail(page, store([b]), b.id, width);
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
  await openDetail(page, store([b]), randomUUID(), 320);
  await expect(page.getByRole('heading', { name: '예약을 찾을 수 없어요' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  const images = await page.locator('img').evaluateAll((els) => els.map((el) => ({ alt: el.getAttribute('alt'), ok: (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0 })));
  expect(images.length).toBeGreaterThan(0);
  for (const img of images) expect(img).toEqual({ alt: '', ok: true });
  expect(failures).toEqual([]);
});
