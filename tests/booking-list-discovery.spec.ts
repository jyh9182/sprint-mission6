import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// 8단계 예약 목록 탐색(design/steps/08-list-discovery.md). 검색·상태·정렬·페이지와 URL 쿼리 동기화,
// 상세·수정·삭제에서 목록 조건 유지를 실제 LocalStorage 저장소로 검사한다.
const base = process.env.LANDING_TEST_URL || 'http://localhost:3100';
const KEY = 'lessonconnect:bookings:v1';
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const seoulDate = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);
const seoulHour = (ms: number) => new Date(ms + 9 * HOUR).getUTCHours();
const pad = (n: number) => String(n).padStart(2, '0');
const enc = (v: string) => encodeURIComponent(v);
const url = (path: string) => new URL(path, base).toString();

type Fixture = {
  id?: string; date?: string; startTime?: string; status?: 'scheduled' | 'cancelled';
  instructorName?: string; instrumentLabel?: string; studioName?: string; roomName?: string; memo?: string; createdAt?: string;
};

let seq = 0;
function booking(f: Fixture = {}) {
  seq += 1;
  const created = f.createdAt ?? new Date(Date.UTC(2026, 0, 1) + seq * 60_000).toISOString();
  const status = f.status ?? 'scheduled';
  return {
    id: f.id ?? randomUUID(),
    offerId: 'offer-kim-guitar-60',
    instructorId: 'instructor-kim-minjun',
    spaceId: 'space-dongtan-a',
    catalogVersion: '1',
    snapshot: {
      instructorName: f.instructorName ?? '김민준',
      instrumentId: 'guitar',
      instrumentLabel: f.instrumentLabel ?? '기타',
      genres: ['rock'],
      studioName: f.studioName ?? '동탄 스튜디오',
      roomName: f.roomName ?? 'A 레슨실',
      equipmentLabels: ['기타'],
      examplePriceKRW: 50000,
      currency: 'KRW',
      durationMinutes: 60,
    },
    date: f.date ?? seoulDate(Date.now() + 3 * DAY),
    startTime: f.startTime ?? '18:00',
    timeZone: 'Asia/Seoul',
    memo: f.memo ?? '',
    status,
    source: 'user',
    createdAt: created,
    updatedAt: created,
    cancelledAt: status === 'cancelled' ? created : null,
  };
}
type B = ReturnType<typeof booking>;

const store = (bookings: B[]) =>
  JSON.stringify({ schemaVersion: 1, revision: 3, initializedAt: '2026-01-01T00:00:00.000Z', seedVersion: 1, bookings });

/** n일 뒤 예정 예약(같은 시각) */
const future = (days: number, f: Fixture = {}) => booking({ date: seoulDate(Date.now() + days * DAY), startTime: '18:00', ...f });

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

async function open(page: Page, raw: string | null, path = '/bookings') {
  await seed(page, raw);
  await page.goto(url(path));
  await expect(page.locator('.lc-list-viewport')).not.toHaveAttribute('aria-busy', 'true');
}

const cards = (page: Page) => page.locator('.lc-booking-card');
const names = (page: Page) => page.locator('.lc-booking-card__instructor');
const count = (page: Page) => page.locator('.lc-discovery__count');
const searchBox = (page: Page) => page.getByRole('searchbox', { name: '예약 검색' });
const chip = (page: Page, name: string) => page.getByRole('group', { name: '예약 상태 필터' }).getByRole('button', { name, exact: true });
const sortSelect = (page: Page) => page.getByRole('combobox', { name: '정렬' });
const pager = (page: Page) => page.getByRole('navigation', { name: '예약 목록 페이지' });
const viewport = (page: Page) => page.locator('.lc-list-viewport');
const historyLength = (page: Page) => page.evaluate(() => history.length);

test('검색 대상: 강사·악기·스튜디오·방·스튜디오+방, 정규화(NFC·공백·영문 대소문자), 메모·ID 제외, 결과 수는 전체 기준', async ({ page }) => {
  const failures = watchErrors(page);
  const list = [
    future(1, { instructorName: '이서연', instrumentLabel: '피아노', studioName: '합정 스튜디오', roomName: 'Studio B' }),
    future(2, { instructorName: '박지호', instrumentLabel: '보컬', studioName: '동탄 스튜디오', roomName: 'A 레슨실', memo: '재즈 연습' }),
    future(3, { instructorName: '김민준', instrumentLabel: '기타' }),
  ];
  await open(page, store(list));
  await expect(count(page)).toHaveText('예약 3건');

  const expectSearch = async (q: string, expected: string[]) => {
    await page.goto(url(`/bookings?q=${enc(q)}`));
    await expect(count(page)).toHaveText(`검색 결과 ${expected.length}건`);
    await expect(names(page)).toHaveText(expected.map((n) => `${n} 선생님`));
  };
  await expectSearch('서연', ['이서연']); // 강사
  await expectSearch('피아노', ['이서연']); // 악기
  await expectSearch('동탄', ['박지호', '김민준']); // 스튜디오
  await expectSearch('레슨실', ['박지호', '김민준']); // 방
  await expectSearch('합정 스튜디오 studio', ['이서연']); // 스튜디오 + ' ' + 방, 영문 소문자
  await expectSearch('  STUDIO   b ', ['이서연']); // 앞뒤·연속 공백, 대문자
  await expectSearch('기타', ['김민준']); // NFD '기타' → NFC 비교
  await expectSearch('재즈', []); // 메모는 대상 아님
  await expectSearch(list[0].id.slice(0, 8), []); // ID는 대상 아님
  await expectSearch('선생님', []); // 표시용 접미사는 snapshot에 없다
  expect(failures).toEqual([]);
});

test('검색 → 상태 → 정렬 → 페이지 순서, 네 상태 필터(파생 상태), 동률은 id 오름차순', async ({ page }) => {
  const now = Date.now();
  const sameCreated = '2026-02-01T00:00:00.000Z';
  const ids = ['00000000-0000-4000-8000-00000000000b', '00000000-0000-4000-8000-00000000000a'];
  const list = [
    booking({ id: ids[0], date: seoulDate(now + 2 * DAY), startTime: '10:00', instructorName: '동률 B', createdAt: sameCreated }),
    booking({ id: ids[1], date: seoulDate(now + 2 * DAY), startTime: '10:00', instructorName: '동률 A', createdAt: sameCreated }),
    booking({ date: seoulDate(now + DAY), startTime: '09:00', instructorName: '내일', createdAt: '2026-03-01T00:00:00.000Z' }),
    booking({ date: seoulDate(now - DAY), startTime: '19:00', instructorName: '어제', createdAt: '2026-01-15T00:00:00.000Z' }),
    booking({ date: seoulDate(now), startTime: `${pad(seoulHour(now))}:00`, instructorName: '지금' }),
    booking({ date: seoulDate(now + 5 * DAY), startTime: '20:00', status: 'cancelled', instructorName: '취소', createdAt: '2026-04-01T00:00:00.000Z' }),
  ];
  await open(page, store(list));
  // 기본: 레슨 날짜순(취소도 레슨 날짜 기준), 같은 시각은 id 오름차순
  await expect(names(page)).toHaveText(['어제 선생님', '지금 선생님', '내일 선생님', '동률 A 선생님', '동률 B 선생님']);

  const byStatus: [string, string[]][] = [
    ['예정', ['내일 선생님', '동률 A 선생님', '동률 B 선생님']],
    ['진행 중', ['지금 선생님']],
    ['종료', ['어제 선생님']],
    ['취소됨', ['취소 선생님']],
  ];
  for (const [label, expected] of byStatus) {
    await chip(page, label).click();
    await expect(chip(page, label)).toHaveAttribute('aria-pressed', 'true');
    await expect(names(page)).toHaveText(expected);
    await expect(count(page)).toHaveText(`검색 결과 ${expected.length}건`);
  }

  // 최근 생성순, 동률(createdAt 같음)은 id 오름차순
  await chip(page, '예정').click();
  await sortSelect(page).selectOption('created-desc');
  await expect(page).toHaveURL(url('/bookings?status=upcoming&sort=created-desc'));
  await expect(names(page)).toHaveText(['내일 선생님', '동률 A 선생님', '동률 B 선생님']);

  // 검색 + 상태 조합
  await searchBox(page).fill('동률');
  await searchBox(page).press('Enter');
  await expect(page).toHaveURL(url(`/bookings?q=${enc('동률')}&status=upcoming&sort=created-desc`));
  await expect(names(page)).toHaveText(['동률 A 선생님', '동률 B 선생님']);
  await expect(page.locator('.lc-discovery__conditions')).toHaveText('적용 조건: “동률” · 예정 · 최근 생성순');
});

test('페이지: 5개 단위, 이전/다음 활성 규칙, push 기록, 범위 밖 페이지 보정, 1페이지면 숨김', async ({ page }) => {
  const failures = watchErrors(page);
  const list = Array.from({ length: 12 }, (_, i) => future(i + 1, { instructorName: `강사${pad(i + 1)}` }));
  await open(page, store(list));
  await expect(count(page)).toHaveText('예약 12건');
  await expect(cards(page)).toHaveCount(5);
  await expect(pager(page)).toContainText('1 / 3');
  const prev = pager(page).getByRole('button', { name: '이전 페이지' });
  const next = pager(page).getByRole('button', { name: '다음 페이지' });
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();

  const before = await historyLength(page);
  await next.click();
  await expect(page).toHaveURL(url('/bookings?page=2'));
  await expect(names(page).first()).toHaveText('강사06 선생님');
  await next.click();
  await expect(page).toHaveURL(url('/bookings?page=3'));
  await expect(cards(page)).toHaveCount(2);
  await expect(next).toBeDisabled();
  await expect(prev).toBeFocused(); // 누른 버튼이 비활성되면 반대 버튼으로 포커스
  expect(await historyLength(page)).toBe(before + 2);

  // 범위를 벗어난 양의 정수 페이지 → 데이터 조회 후 마지막 유효 페이지로 replace
  await page.goto(url('/bookings?page=9'));
  await expect(page).toHaveURL(url('/bookings?page=3'));
  await expect(cards(page)).toHaveCount(2);

  // 결과가 1페이지뿐이면 페이지 영역 자체를 숨긴다
  await page.goto(url(`/bookings?q=${enc('강사01')}`));
  await expect(cards(page)).toHaveCount(1);
  await expect(pager(page)).toHaveCount(0);
  expect(failures).toEqual([]);
});

test('조건 변경 시 page=1 초기화·목록 맨 위, 칩·정렬·초기화는 push라 뒤로/앞으로 복원', async ({ page }) => {
  const list = Array.from({ length: 12 }, (_, i) => future(i + 1, { instructorName: `강사${pad(i + 1)}`, status: i % 4 === 3 ? 'cancelled' : 'scheduled' }));
  await open(page, store(list), '/bookings?page=2');
  await viewport(page).evaluate((el) => { el.scrollTop = 300; });
  await expect.poll(() => viewport(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(200);

  await chip(page, '예정').click();
  await expect(page).toHaveURL(url('/bookings?status=upcoming'));
  await expect.poll(() => viewport(page).evaluate((el) => el.scrollTop)).toBe(0);
  await expect(count(page)).toHaveText('검색 결과 9건');

  await sortSelect(page).selectOption('created-desc');
  await expect(page).toHaveURL(url('/bookings?status=upcoming&sort=created-desc'));

  // 뒤로: 직전 조건(정렬 전) → 그 전(page=2)
  await page.goBack();
  await expect(page).toHaveURL(url('/bookings?status=upcoming'));
  await expect(sortSelect(page)).toHaveValue('date-asc');
  await expect(chip(page, '예정')).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(page).toHaveURL(url('/bookings?page=2'));
  await expect(chip(page, '전체')).toHaveAttribute('aria-pressed', 'true');
  await expect(pager(page)).toContainText('2 / 3');
  await page.goForward();
  await expect(chip(page, '예정')).toHaveAttribute('aria-pressed', 'true');
  await expect(count(page)).toHaveText('검색 결과 9건');

  // 조건 초기화(텍스트 버튼): 네 조건 모두 기본 → /bookings, 기본이면 초기화 버튼 숨김
  await page.goto(url(`/bookings?q=${enc('강사')}&status=upcoming&sort=created-desc&page=2`));
  await expect(searchBox(page)).toHaveValue('강사');
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(page).toHaveURL(url('/bookings'));
  await expect(searchBox(page)).toHaveValue('');
  await expect(sortSelect(page)).toHaveValue('date-asc');
  await expect(chip(page, '전체')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '초기화', exact: true })).toHaveCount(0);
  await page.goBack();
  await expect(searchBox(page)).toHaveValue('강사');
});

test('검색 입력: 300ms 뒤 replace, Enter 즉시, ×·Escape로 지우기, 80 code point 제한', async ({ page }) => {
  const list = Array.from({ length: 7 }, (_, i) => future(i + 1, i < 2 ? { instructorName: `피아노쌤${i}`, instrumentLabel: '피아노' } : { instructorName: `기타쌤${i}` }));
  await open(page, store(list), '/bookings?page=2');
  const before = await historyLength(page);

  await searchBox(page).pressSequentially('기타', { delay: 50 });
  await expect(searchBox(page)).toHaveValue('기타'); // 입력은 즉시 보인다
  expect(new URL(page.url()).search).toBe('?page=2'); // 결과·URL은 아직
  await expect(page).toHaveURL(url(`/bookings?q=${enc('기타')}`)); // 멈춘 뒤 반영, page 초기화
  await expect(count(page)).toHaveText('검색 결과 5건');
  expect(await historyLength(page)).toBe(before); // replace

  // 빈 검색어에는 × 숨김, 값이 있으면 '검색어 지우기'
  const clear = page.getByRole('button', { name: '검색어 지우기' });
  await clear.click();
  await expect(searchBox(page)).toHaveValue('');
  await expect(searchBox(page)).toBeFocused();
  await expect(page).toHaveURL(url('/bookings'));
  await expect(clear).toHaveCount(0);

  // Enter는 즉시 반영
  await searchBox(page).fill('피아노');
  await searchBox(page).press('Enter');
  await expect(page).toHaveURL(url(`/bookings?q=${enc('피아노')}`));
  await expect(count(page)).toHaveText('검색 결과 2건');

  // Escape는 검색어를 지우고, 빈 상태 Escape는 아무것도 하지 않는다
  await searchBox(page).press('Escape');
  await expect(searchBox(page)).toHaveValue('');
  await expect(page).toHaveURL(url('/bookings'));
  await searchBox(page).press('Escape');
  await expect(page).toHaveURL(url('/bookings'));

  // 공백만 입력 → q 제거
  await searchBox(page).fill('   ');
  await searchBox(page).press('Enter');
  await expect(page).toHaveURL(url('/bookings'));

  // 80 code point 제한(이모지는 UTF-16 2단위지만 1 code point)
  await searchBox(page).fill('🎸'.repeat(85));
  expect(await searchBox(page).evaluate((el: HTMLInputElement) => Array.from(el.value).length)).toBe(80);
  await searchBox(page).press('Enter');
  expect(new URL(page.url()).searchParams.get('q')).toBe('🎸'.repeat(80));
});

test('잘못된 쿼리는 throw 없이 안전한 기본값 → 정규 URL로 replace', async ({ page }) => {
  const failures = watchErrors(page);
  await open(page, store([future(1), future(2, { status: 'cancelled' })]));
  const cases: [string, string][] = [
    ['/bookings?status=foo&sort=bar&page=-1&utm=1', '/bookings'],
    ['/bookings?page=1.5', '/bookings'],
    ['/bookings?page=1e2', '/bookings'],
    ['/bookings?page=0', '/bookings'],
    ['/bookings?page=01', '/bookings'],
    ['/bookings?page=12345678901234567890', '/bookings'],
    ['/bookings?status=upcoming&status=ended', '/bookings'], // 중복
    ['/bookings?page=1&sort=date-asc&status=all&q=', '/bookings'], // 기본값 생략
    [`/bookings?q=${enc('가'.repeat(81))}`, '/bookings'], // 비정상적으로 긴 값
    [`/bookings?sort=created-desc&q=${enc('  기타  ')}&status=cancelled`, `/bookings?q=${enc('기타')}&status=cancelled&sort=created-desc`], // 순서·공백 정규화
    [`/bookings?q=${enc('기타')}&page=1`, `/bookings?q=${enc('기타')}`],
  ];
  for (const [from, to] of cases) {
    await page.goto(url(from));
    await expect(page, from).toHaveURL(url(to));
    await expect(count(page)).toHaveText(/건$/);
  }
  // 깨진 퍼센트 인코딩도 throw 없이 일반 검색어로 처리된다
  await page.goto(url('/bookings?q=%E0%A4%A'));
  await expect(count(page)).toHaveText('검색 결과 0건');
  await page.goto(url(`/bookings?q=${enc('기타')}&status=cancelled&sort=created-desc`));
  await expect(count(page)).toHaveText('검색 결과 1건');
  expect(failures).toEqual([]);
});

test('저장 예약 0건 vs 검색 결과 0건, 조건 초기화 버튼', async ({ page }) => {
  await open(page, store([]), `/bookings?q=${enc('기타')}`);
  await expect(page.getByText('아직 예약한 레슨이 없어요')).toBeVisible();
  await expect(count(page)).toHaveText('예약 0건');
  await expect(page.getByText('검색 결과가 없어요')).toHaveCount(0);

  await open(page, store([future(1)]), `/bookings?q=${enc('재즈 스튜디오')}&status=cancelled`);
  await expect(count(page)).toHaveText('검색 결과 0건');
  await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
  await expect(page.getByText('검색어나 필터를 바꿔 다시 찾아보세요.')).toBeVisible();
  await expect(page.getByText('아직 예약한 레슨이 없어요')).toHaveCount(0);
  await expect(pager(page)).toHaveCount(0);
  await page.getByRole('button', { name: '조건 초기화' }).click();
  await expect(page).toHaveURL(url('/bookings'));
  await expect(count(page)).toHaveText('예약 1건');
});

test('초기화 중·읽기 실패: 검색·필터·정렬 비활성, URL 조건 유지, 결과 0건으로 표시하지 않음', async ({ page, request }) => {
  const html = await (await request.get(url('/bookings?status=upcoming'))).text();
  expect(html).toContain('예약을 불러오는 중이에요');
  expect(html).not.toContain('검색 결과');

  const target = `/bookings?q=${enc('기타')}&status=upcoming`;
  await seed(page, '{"schemaVersion":1,"bookings":');
  await page.goto(url(target));
  await expect(page.getByRole('alert').filter({ hasText: '예약을 불러오지 못했어요' })).toBeVisible();
  await expect(searchBox(page)).toBeDisabled();
  await expect(searchBox(page)).toHaveValue('기타');
  await expect(chip(page, '예정')).toBeDisabled();
  await expect(sortSelect(page)).toBeDisabled();
  await expect(page.getByText('검색 결과가 없어요')).toHaveCount(0);
  await expect(count(page)).toHaveText('예약을 불러올 수 없어요');
  await expect(page).toHaveURL(url(target));

  // 복구 후 다시 시도 → URL 조건 적용
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, store([future(1), future(2, { instrumentLabel: '피아노' })])] as const);
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(count(page)).toHaveText('검색 결과 1건');
  await expect(searchBox(page)).toBeEnabled();
});

test('상세 → 목록 복귀: 카드가 조건 보존, 뒤로가기·목록으로 버튼 모두 같은 조건·스크롤 키 복원, 직접 진입은 기본 목록', async ({ page }) => {
  const list = Array.from({ length: 12 }, (_, i) => future(i + 1, { instructorName: `강사${pad(i + 1)}` }));
  const listPath = `/bookings?q=${enc('강사')}&sort=created-desc&page=2`;
  await open(page, store(list), listPath);
  await expect(names(page).first()).toHaveText('강사07 선생님'); // 생성 역순 2페이지
  await viewport(page).evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(100);
  const savedTop = await viewport(page).evaluate((el) => el.scrollTop);
  expect(savedTop).toBeGreaterThan(100);

  const card = cards(page).last();
  const href = await card.getAttribute('href');
  expect(href).toBe(`/bookings/detail?id=${list[2].id}&q=${enc('강사')}&sort=created-desc&page=2`);
  await card.click();
  await expect(page).toHaveURL(url(href!));

  // 브라우저 뒤로 → 같은 조건·같은 키 스크롤
  await page.goBack();
  await expect(page).toHaveURL(url(listPath));
  await expect.poll(() => viewport(page).evaluate((el) => el.scrollTop)).toBe(savedTop);

  // 상세의 `목록으로 돌아가기` → 정규화된 목록 URL, 같은 키 스크롤
  await cards(page).last().click();
  await page.getByRole('button', { name: '예약 목록으로 돌아가기' }).click();
  await expect(page).toHaveURL(url(listPath));
  await expect.poll(() => viewport(page).evaluate((el) => el.scrollTop)).toBe(savedTop);

  // 다른 조건(1페이지)에는 이전 스크롤을 적용하지 않는다
  await page.goto(url(`/bookings?q=${enc('강사')}&sort=created-desc`));
  await expect(cards(page)).toHaveCount(5);
  expect(await viewport(page).evaluate((el) => el.scrollTop)).toBe(0);

  // 상세 URL의 허용되지 않은 값·임의 returnTo는 무시
  await page.goto(url(`/bookings/detail?id=${list[0].id}&status=bogus&returnTo=${enc('https://example.com')}&sort=created-desc`));
  await page.getByRole('button', { name: '예약 목록으로 돌아가기' }).click();
  await expect(page).toHaveURL(url('/bookings?sort=created-desc'));

  // 직접 상세 진입 → 기본 목록
  await page.goto(url(`/bookings/detail?id=${list[0].id}`));
  await page.getByRole('button', { name: '예약 목록으로 돌아가기' }).click();
  await expect(page).toHaveURL(url('/bookings'));
});

test('상세 → 수정 → 상세에서도 목록 조건 유지, 취소 후에도 유지', async ({ page }) => {
  const target = future(4, { instructorName: '수정대상' });
  const list = [target, future(5), future(6)];
  const ctx = `q=${enc('수정')}&status=upcoming`;
  await open(page, store(list), `/bookings?${ctx}`);
  await cards(page).first().click();
  await expect(page).toHaveURL(url(`/bookings/detail?id=${target.id}&${ctx}`));

  const edit = page.getByRole('link', { name: '예약 수정' });
  await expect(edit).toHaveAttribute('href', `/bookings/edit?id=${target.id}&${ctx}`);
  await edit.click();
  await expect(page).toHaveURL(url(`/bookings/edit?id=${target.id}&${ctx}`));
  await page.getByRole('button', { name: '예약 상세로 돌아가기' }).click();
  await expect(page).toHaveURL(url(`/bookings/detail?id=${target.id}&${ctx}`));

  // 취소 후 같은 상세를 갱신해도 URL 컨텍스트 유지 → 목록 복귀 시 조건 유지
  await page.getByRole('button', { name: '예약 취소' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '예약 취소' }).click();
  await expect(page.locator('.lc-detail-heading .lc-badge')).toHaveText('취소됨');
  await expect(page).toHaveURL(url(`/bookings/detail?id=${target.id}&${ctx}`));
  await page.getByRole('link', { name: '예약 목록으로' }).click();
  await expect(page).toHaveURL(url(`/bookings?${ctx}`));
  // 예정 필터라 방금 취소한 예약은 결과에서 빠진다
  await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
});

test('삭제 성공: 원래 조건으로 이동, 마지막 페이지가 사라지면 유효 페이지로 보정, 성공 알림 1회', async ({ page }) => {
  const failures = watchErrors(page);
  // 종료 6건(삭제 가능) → 2페이지에 1건
  const ended = Array.from({ length: 6 }, (_, i) => booking({ date: seoulDate(Date.now() - (10 - i) * DAY), startTime: '10:00', instructorName: `종료${i + 1}` }));
  await open(page, store(ended), '/bookings?status=ended&page=2');
  await expect(cards(page)).toHaveCount(1);
  await cards(page).first().click();
  await page.getByRole('button', { name: '예약 기록 삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '삭제하기' }).click();

  // 2페이지가 사라져 1페이지로 replace, 일회성 성공 알림
  await expect(page).toHaveURL(url('/bookings?status=ended'));
  await expect(page.getByRole('status').filter({ hasText: '예약 기록을 삭제했어요' })).toHaveCount(1);
  await expect(page.locator('.lc-list-flash')).toBeFocused();
  await expect(count(page)).toHaveText('검색 결과 5건');
  await expect(pager(page)).toHaveCount(0);

  // 결과가 0건이 되면 결과 없음
  await page.goto(url(`/bookings?q=${enc('종료5')}`));
  await cards(page).first().click();
  await page.getByRole('button', { name: '예약 기록 삭제' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '삭제하기' }).click();
  await expect(page).toHaveURL(url(`/bookings?q=${enc('종료5')}`));
  await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
  await page.reload();
  await expect(page.locator('.lc-list-flash')).toHaveCount(0); // 새로고침에는 알림 없음
  expect(failures).toEqual([]);
});

test('다른 탭 변경으로 결과가 줄면 현재 페이지를 마지막 유효 페이지로 replace', async ({ page, context }) => {
  const list = Array.from({ length: 6 }, (_, i) => future(i + 1));
  await open(page, store(list), '/bookings?page=2');
  await expect(cards(page)).toHaveCount(1);
  const before = await historyLength(page);
  const other = await context.newPage();
  await other.goto(base);
  await other.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, store(list.slice(0, 5))] as const);
  await expect(page).toHaveURL(url('/bookings'));
  await expect(cards(page)).toHaveCount(5);
  expect(await historyLength(page)).toBe(before);
});

test('URL·sessionStorage 상태는 예약 데이터에 섞이지 않음', async ({ page }) => {
  const raw = store(Array.from({ length: 7 }, (_, i) => future(i + 1)));
  await open(page, raw);
  await chip(page, '예정').click();
  await searchBox(page).fill('김');
  await searchBox(page).press('Enter');
  await pager(page).getByRole('button', { name: '다음 페이지' }).click();
  await viewport(page).evaluate((el) => { el.scrollTop = 100; });
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(raw);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual([KEY]);
});

test('390×844 배치·접근성: 겹침 없음, 칩 한 줄·44px 터치, 레이블, 결과 수 live, 하단 내비 고정', async ({ page }) => {
  const failures = watchErrors(page);
  const list = Array.from({ length: 12 }, (_, i) => future(i + 1));
  await open(page, store(list), `/bookings?q=${enc('김민준')}&status=upcoming&sort=created-desc`);

  await expect(page.getByText('예약 검색', { exact: true })).toBeVisible();
  await expect(searchBox(page)).toHaveAttribute('placeholder', '강사, 악기, 공간 검색');
  await expect(searchBox(page)).toHaveAttribute('type', 'search');
  await expect(searchBox(page)).toHaveAttribute('inputmode', 'search');
  await expect(count(page)).toHaveAttribute('aria-live', 'polite');
  await expect(sortSelect(page).locator('option')).toHaveText(['레슨 날짜순', '최근 생성순']);

  const boxes = await page.locator('.lc-chip').evaluateAll((els) => els.map((el) => {
    const r = el.getBoundingClientRect();
    const a = getComputedStyle(el, '::after');
    return { y: r.y, h: r.height, right: r.right, hitTop: parseFloat(a.top), hitBottom: parseFloat(a.bottom) };
  }));
  expect(new Set(boxes.map((b) => Math.round(b.y))).size).toBe(1); // 한 줄
  expect(Math.max(...boxes.map((b) => b.right))).toBeLessThanOrEqual(370.5);
  for (const b of boxes) expect(b.h - b.hitTop - b.hitBottom).toBeGreaterThanOrEqual(44);

  // 순서대로 겹치지 않음: 검색 → 칩 → 결과 행 → 조건 → 목록 → 페이지 → 내비
  const order = ['.lc-search__box', '.lc-chips', '.lc-discovery__row', '.lc-discovery__summary', '.lc-list-viewport', '.lc-pagination', '.lc-bottom-nav'];
  const rects = await Promise.all(order.map((s) => page.locator(s).boundingBox()));
  for (let i = 1; i < rects.length; i += 1) expect(rects[i - 1]!.y + rects[i - 1]!.height, order[i]).toBeLessThanOrEqual(rects[i]!.y + 0.5);
  expect(rects.at(-1)!.y + rects.at(-1)!.height).toBeLessThanOrEqual(844.5);

  // 목록 스크롤 중에도 내비·페이지 고정
  const navY = rects.at(-1)!.y;
  await viewport(page).evaluate((el) => { el.scrollTop = el.scrollHeight; });
  expect((await page.locator('.lc-bottom-nav').boundingBox())!.y).toBe(navY);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);

  // 키보드: 칩은 Enter·Space로 선택, 칩 다음 Tab은 정렬(네이티브 select라 키보드로 값 변경 가능)
  await chip(page, '전체').focus();
  await page.keyboard.press('Enter');
  await expect(chip(page, '전체')).toHaveAttribute('aria-pressed', 'true');
  await expect(chip(page, '전체')).toBeFocused();
  await chip(page, '종료').focus();
  await page.keyboard.press(' ');
  await expect(chip(page, '종료')).toHaveAttribute('aria-pressed', 'true');
  await chip(page, '취소됨').focus();
  await page.keyboard.press('Tab');
  await expect(sortSelect(page)).toBeFocused();
  await expect(sortSelect(page)).toHaveJSProperty('tagName', 'SELECT');
  await page.screenshot({ path: 'test-results/bookings-discovery-390.png' });
  expect(failures).toEqual([]);
});

test('320 폭에서도 가로 넘침 없음', async ({ page }) => {
  await seed(page, store(Array.from({ length: 7 }, (_, i) => future(i + 1))));
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(url(`/bookings?q=${enc('아주 긴 검색어를 입력해서 조건 요약이 한 줄을 넘는지 확인합니다')}&status=in-progress&sort=created-desc`));
  await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const cond = page.locator('.lc-discovery__conditions');
  expect((await cond.boundingBox())!.height).toBeLessThanOrEqual(18.5); // 한 줄로 줄임
});
