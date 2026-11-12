import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { formatLessonDate } from '../lib/bookings/format';

// 3단계 예약 목록(/bookings). 실제 LocalStorage 저장소에서 읽는 화면을 개발 서버(또는 LANDING_TEST_URL)에서 검사한다.
const base = process.env.LANDING_TEST_URL || 'http://localhost:3100';
const LIST = new URL('/bookings', base).toString();
const KEY = 'lessonconnect:bookings:v1';
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const FOCUS_BLUE = 'rgb(56, 117, 199)';

const seoulDate = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);
const seoulHour = (ms: number) => new Date(ms + 9 * HOUR).getUTCHours();
const pad = (n: number) => String(n).padStart(2, '0');

type Fixture = { date: string; startTime: string; status?: 'scheduled' | 'cancelled'; instructorName?: string; studioName?: string; roomName?: string; instrumentLabel?: string };

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
      instrumentLabel: f.instrumentLabel ?? '기타',
      genres: ['rock', 'blues'],
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
    memo: '',
    status,
    source: 'user',
    createdAt: created,
    updatedAt: created,
    cancelledAt: status === 'cancelled' ? created : null,
  };
}

const store = (bookings: ReturnType<typeof booking>[]) =>
  JSON.stringify({ schemaVersion: 1, revision: 3, initializedAt: new Date(Date.now() - 30 * DAY).toISOString(), seedVersion: 1, bookings });

function watchErrors(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') failures.push(m.text()); });
  return failures;
}

/** 목록을 열기 전에 LocalStorage 원시값을 넣는다(null이면 키 없음 = 최초 실행). */
async function openWith(page: Page, raw: string | null, width = 390, height = 844) {
  await page.setViewportSize({ width, height });
  await page.goto(base);
  await page.evaluate(([key, value]) => { localStorage.clear(); sessionStorage.clear(); if (value !== null) localStorage.setItem(key, value); }, [KEY, raw] as const);
  await page.goto(LIST);
  await page.evaluate(() => document.fonts.ready);
}

const viewport = (page: Page) => page.locator('.lc-list-viewport');
const cards = (page: Page) => page.locator('.lc-booking-card');
const cta = (page: Page) => page.locator('.lc-app__top .lc-list-cta');

test('최초 실행: 시드 1건을 저장소에서 읽어 카드·건수·링크 표시', async ({ page }) => {
  const failures = watchErrors(page);
  await openWith(page, null);
  await expect(page.getByText('예약 1건', { exact: true })).toBeVisible();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
  const seed = stored.bookings[0];
  expect(seed.source).toBe('seed');
  const card = cards(page).first();
  await expect(card).toHaveAttribute('href', `/bookings/detail?id=${seed.id}`);
  await expect(card).toContainText('김민준 선생님');
  await expect(card).toContainText('기타 · 60분');
  await expect(card).toContainText(`${formatLessonDate(seoulDate(Date.now() + 7 * DAY))} · 19:00–20:00`);
  await expect(card).toContainText('동탄 스튜디오 · A 레슨실');
  await expect(card.locator('.lc-badge')).toHaveText('예정');
  await expect(card).toHaveAccessibleName(/^김민준 선생님, .+ 19:00–20:00, 예정, /);
  await expect(page.getByRole('link', { name: '새 레슨 예약' })).toHaveAttribute('href', '/bookings/new');
  await expect(page.getByText('예약은 이 브라우저에만 저장돼요.')).toBeVisible();
  // 새로고침해도 재시드하지 않는다
  await page.reload();
  await expect(cards(page)).toHaveCount(1);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).bookings.length, KEY)).toBe(1);
  expect(failures).toEqual([]);
});

test('정상 0건: 빈 상태, CTA 활성, 재시드 없음', async ({ page }) => {
  const failures = watchErrors(page);
  const raw = store([]);
  await openWith(page, raw);
  await expect(page.getByText('예약 0건', { exact: true })).toBeVisible();
  await expect(page.getByText('아직 예약한 레슨이 없어요')).toBeVisible();
  await expect(page.getByText('마음에 드는 강사와 첫 레슨을 시작해보세요.')).toBeVisible();
  await expect(page.getByRole('link', { name: '새 레슨 예약' })).toBeVisible();
  await expect(cards(page)).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('예약 0건', { exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(raw);
  expect(failures).toEqual([]);
});

test('초기화 중: 서버 HTML은 로딩 상태이며 빈 목록·건수를 먼저 보여주지 않음', async ({ request }) => {
  const html = await (await request.get(LIST)).text();
  expect(html).toContain('예약을 불러오는 중이에요');
  expect(html).toContain('예약 확인 중');
  expect(html).toContain('aria-busy="true"');
  expect(html).not.toContain('아직 예약한 레슨이 없어요');
  expect(html).not.toMatch(/예약 \d+건/);
  expect(html).not.toContain('href="/bookings/new"'); // 초기화 전 CTA는 비활성 버튼
});

test('읽기 실패: 데이터 보존, 오류·재시도, 성공 후에만 목록 표시', async ({ page }) => {
  const failures = watchErrors(page);
  const broken = '{"schemaVersion":1,"bookings":';
  await openWith(page, broken);
  // Next.js 경로 안내 요소도 role=alert라서 제목으로 한정한다
  const alert = page.getByRole('alert').filter({ hasText: '예약을 불러오지 못했어요' });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('저장된 예약 정보를 읽을 수 없어요. 기존 데이터는 변경하지 않았어요.');
  await expect(page.getByText('예약을 불러올 수 없어요', { exact: true })).toBeVisible();
  await expect(cta(page)).toBeDisabled();
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByText('아직 예약한 레슨이 없어요')).toHaveCount(0);

  // 여전히 손상 → 오류 유지, 원본 그대로
  const retry = page.getByRole('button', { name: '다시 시도' });
  await retry.click();
  await expect(retry).toBeEnabled();
  await expect(alert).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(broken);

  // 데이터가 복구된 뒤 재시도 → 목록
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, store([booking({ date: seoulDate(Date.now() + 3 * DAY), startTime: '18:00' })])] as const);
  await retry.click();
  await expect(page.getByText('예약 1건', { exact: true })).toBeVisible();
  await expect(cards(page)).toHaveCount(1);
  await expect(alert).toHaveCount(0);
  await expect(page.getByRole('link', { name: '새 레슨 예약' })).toBeVisible();
  expect(failures).toEqual([]);
});

test('지원하지 않는 버전: 앱 버전 확인 문구', async ({ page }) => {
  await openWith(page, JSON.stringify({ schemaVersion: 2, bookings: [] }));
  await expect(page.getByRole('alert').filter({ hasText: '예약을 불러오지 못했어요' })).toContainText('현재 앱에서 지원하지 않는 예약 데이터예요. 앱 버전을 확인해주세요.');
});

test('파생 상태 Badge·정렬·전체 건수(취소 포함)', async ({ page }) => {
  const now = Date.now();
  const list = [
    booking({ date: seoulDate(now + 5 * DAY), startTime: '20:00', status: 'cancelled', roomName: 'C 레슨실' }),
    booking({ date: seoulDate(now + 2 * DAY), startTime: '18:00', roomName: 'B 레슨실' }),
    booking({ date: seoulDate(now - DAY), startTime: '19:00' }),
    booking({ date: seoulDate(now), startTime: `${pad(seoulHour(now))}:00` }),
  ];
  await openWith(page, store(list));
  await expect(page.getByText('예약 4건', { exact: true })).toBeVisible();
  await expect(cards(page).locator('.lc-badge')).toHaveText(['종료', '진행 중', '예정', '취소됨']);
});

test('390×844 긴 텍스트·많은 카드: 줄임, 겹침 없음, 마지막 카드까지 스크롤, 하단 내비에 가리지 않음', async ({ page }) => {
  const failures = watchErrors(page);
  const longName = '김민준아주긴이름을가진기타선생님테스트용으로아주아주길게만든강사이름입니다정말로길어요';
  const longRoom = '세 번째 층 복도 끝 방음 처리된 아주 넓은 합주실 겸 개인 레슨실 (주차 가능, 앰프 두 대 비치)';
  const list = Array.from({ length: 12 }, (_, i) =>
    booking({ date: seoulDate(Date.now() + (i + 1) * DAY), startTime: '19:00', ...(i === 0 ? { instructorName: longName, roomName: longRoom, instrumentLabel: '일렉트릭 기타와 어쿠스틱 기타 병행 레슨' } : {}) }),
  );
  await openWith(page, store(list));
  // 8단계부터 5개 단위 페이지. 건수는 전체(12건), 카드는 현재 페이지 5개
  await expect(cards(page)).toHaveCount(5);
  await expect(page.getByText('예약 12건', { exact: true })).toBeVisible();

  // 페이지 자체는 가로·세로로 넘치지 않고 목록 영역만 스크롤
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);

  const first = cards(page).first();
  expect((await first.boundingBox())?.width).toBe(350);
  const name = first.locator('.lc-booking-card__instructor');
  expect((await name.boundingBox())!.height).toBeLessThanOrEqual(48); // 2줄
  expect(await name.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true); // 실제로 잘림
  expect((await first.locator('.lc-booking-card__space').boundingBox())!.height).toBeLessThanOrEqual(42);
  await expect(first).toHaveAccessibleName(new RegExp(`^${longName} 선생님, .*${longRoom.replace(/[()]/g, '\\$&')}`));
  // Badge가 강사명과 겹치지 않고 카드 안에 있음
  const [nb, bb, cb] = await Promise.all([name.boundingBox(), first.locator('.lc-badge').boundingBox(), first.boundingBox()]);
  expect(nb!.x + nb!.width).toBeLessThanOrEqual(bb!.x);
  expect(bb!.x + bb!.width).toBeLessThanOrEqual(cb!.x + cb!.width - 16);
  // 날짜·시간은 자르지 않는다
  const dt = first.locator('.lc-booking-card__datetime');
  expect(await dt.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);

  // 마지막 카드와 안내문까지 스크롤되고 하단 내비 위에 보인다
  await viewport(page).evaluate((el) => { el.scrollTop = el.scrollHeight; });
  const nav = await page.locator('.lc-bottom-nav').boundingBox();
  const last = await cards(page).last().boundingBox();
  const note = await page.getByText('예약은 이 브라우저에만 저장돼요.').boundingBox();
  // 페이지 컨트롤은 목록 viewport 아래·하단 내비 위에 있다
  const pager = await page.getByRole('navigation', { name: '예약 목록 페이지' }).boundingBox();
  const vp = await viewport(page).boundingBox();
  expect(last!.y + last!.height).toBeLessThanOrEqual(pager!.y);
  expect(note!.y + note!.height).toBeLessThanOrEqual(pager!.y);
  expect(vp!.y + vp!.height).toBeLessThanOrEqual(pager!.y + 0.5);
  expect(pager!.y + pager!.height).toBeLessThanOrEqual(nav!.y + 0.5);
  expect(nav!.y + nav!.height).toBeLessThanOrEqual(844 + 0.5);
  await page.screenshot({ path: 'test-results/bookings-dense-390-bottom.png' });
  await viewport(page).evaluate((el) => { el.scrollTop = 0; });
  await page.screenshot({ path: 'test-results/bookings-dense-390-top.png' });
  expect(failures).toEqual([]);
});

test('카드·CTA 키보드 조작, 포커스 링, 상세 경로, 뒤로 오면 스크롤 복원', async ({ page }) => {
  const list = Array.from({ length: 8 }, (_, i) => booking({ date: seoulDate(Date.now() + (i + 1) * DAY), startTime: '18:00' }));
  await openWith(page, store(list));
  await expect(cards(page)).toHaveCount(5); // 8단계: 1페이지 5개

  // 8단계부터 CTA와 카드 사이에 검색·상태·정렬 컨트롤이 있다. 정렬 다음 Tab이 첫 카드다.
  await page.getByRole('combobox', { name: '정렬' }).focus();
  await page.keyboard.press('Tab');
  const firstCard = cards(page).first();
  await expect(firstCard).toBeFocused();
  await expect.poll(() => firstCard.evaluate((el) => { const s = getComputedStyle(el); return [s.outlineColor, s.outlineWidth]; })).toEqual([FOCUS_BLUE, '2px']);

  await viewport(page).evaluate((el) => { el.scrollTop = 500; });
  await page.waitForTimeout(100);
  const target = cards(page).nth(4);
  const href = await target.getAttribute('href');
  expect(href).toBe(`/bookings/detail?id=${list[4].id}`);
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new URL(href!, base).toString());
  await page.goBack();
  await expect(cards(page)).toHaveCount(5);
  await expect.poll(() => viewport(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(400);
});

test('하단 내비: 예약 탭 현재 위치, 준비 중 탭은 링크 아님', async ({ page }) => {
  await openWith(page, store([]));
  const nav = page.getByRole('navigation', { name: '앱 메뉴' });
  await expect(nav.getByRole('link', { name: '예약' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: '예약' })).toHaveAttribute('href', '/bookings');
  await expect(nav.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/');
  await expect(nav.getByRole('link')).toHaveCount(2);
  await expect(nav.getByText('찾기')).toBeVisible();
  await expect(nav.getByText('마이')).toBeVisible();
  // 초기화와 무관하게 하단 탭은 이동 가능해야 하므로 링크로 렌더링된다(서버 HTML 포함)
});

test('다른 탭에서 저장되면 목록을 다시 읽어 건수 갱신', async ({ page, context }) => {
  await openWith(page, store([booking({ date: seoulDate(Date.now() + DAY), startTime: '18:00' })]));
  await expect(page.getByText('예약 1건', { exact: true })).toBeVisible();
  const other = await context.newPage();
  await other.goto(base);
  const next = store([booking({ date: seoulDate(Date.now() + DAY), startTime: '18:00' }), booking({ date: seoulDate(Date.now() + 2 * DAY), startTime: '20:00', status: 'cancelled' })]);
  await other.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, next] as const);
  await expect(page.getByText('예약 2건', { exact: true })).toBeVisible();
  await expect(cards(page).locator('.lc-badge')).toHaveText(['예정', '취소됨']);
});

for (const width of [320, 390]) {
  test(`가로 넘침 없음·이미지 alt ${width}`, async ({ page }) => {
    const failures = watchErrors(page);
    await openWith(page, null, width, 844);
    await expect(cards(page)).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // 8단계 검색 아이콘이 추가돼 이미지 로드 완료를 기다린 뒤 검사한다
    await expect.poll(() => page.locator('img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0 && i.getAttribute('alt') === ''))).toBe(true);
    await page.screenshot({ path: `test-results/bookings-${width}.png` });
    expect(failures).toEqual([]);
  });
}

test('읽기 실패 알림 문구는 왼쪽 정렬(Figma 283:1771)', async ({ page }) => {
  await openWith(page, '{broken');
  const alert = page.locator('.lc-alert');
  await expect(alert).toBeVisible();
  expect(await alert.evaluate((el) => getComputedStyle(el).textAlign)).toBe('left');
  expect((await alert.boundingBox())?.width).toBe(350);
});
