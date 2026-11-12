// 실제 Chromium LocalStorage에서 저장소 동작 확인 (새로고침 지속성·재시드 금지·용량 초과).
// 개발 서버 없이 lib/bookings 모듈을 TypeScript로 변환해 테스트 전용 origin에서 제공한다.
// 테스트 origin은 http(비보안 컨텍스트)라 crypto.randomUUID가 없는 환경도 함께 확인된다.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ORIGIN = 'http://bookings.test';
const MODULES = ['types', 'catalog', 'messages', 'time', 'reference-image', 'validation', 'repository'];
const KEY = 'lessonconnect:bookings:v2'; // 9단계부터 활성 키(v1은 마이그레이션 원본, booking-image.spec.ts에서 검증)
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function compile(name: string) {
  const source = readFileSync(path.join(__dirname, '..', 'lib', 'bookings', `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
  return outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.js'");
}

async function serve(page: Page) {
  const files = new Map(MODULES.map((m) => [`/${m}.js`, compile(m)]));
  await page.route(`${ORIGIN}/**`, (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/') {
      return route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><meta charset="utf-8"><script type="module">import * as m from './repository.js'; window.bookings = m; window.loaded = true;</script>`,
      });
    }
    const body = files.get(pathname);
    return body ? route.fulfill({ contentType: 'text/javascript', body }) : route.fulfill({ status: 404, body: '' });
  });
}

async function open(page: Page, reload = false) {
  if (reload) await page.reload();
  else await page.goto(`${ORIGIN}/`);
  await page.waitForFunction(() => (window as unknown as { loaded?: boolean }).loaded === true);
}

test('real LocalStorage: 시드 → 생성 → 새로고침 유지 → 전체 삭제 후 재시드 없음', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await serve(page);
  await open(page);

  const first = await page.evaluate(async () => {
    const repo = (window as any).bookings.createBookingRepository();
    const init = await repo.initialize();
    if (!init.ok) return { init, created: null, secure: isSecureContext };
    const d = new Date(Date.now() + 9 * 3600e3 + 10 * 86400e3).toISOString().slice(0, 10);
    const created = await repo.createBooking({ offerId: 'offer-kim-guitar-60', spaceId: 'space-dongtan-b', date: d, startTime: '18:00', memo: ' 메모 ', acknowledged: true }, init.data.revision);
    return { init, created, secure: isSecureContext };
  });
  expect(first.secure).toBe(false);
  expect(first.init).toMatchObject({ ok: true, data: { revision: 1 } });
  expect(first.init.data.bookings).toHaveLength(1);
  expect(first.init.data.bookings[0].id).toMatch(UUID_V4);
  expect(first.created).toMatchObject({ ok: true, data: { revision: 2, booking: { memo: '메모', source: 'user' } } });
  expect(first.created.data.booking.id).toMatch(UUID_V4);

  await open(page, true);
  const afterReload = await page.evaluate(async () => {
    const repo = (window as any).bookings.createBookingRepository();
    const list = await repo.initialize();
    let revision = list.data.revision;
    for (const b of list.data.bookings) {
      revision = (await repo.cancelBooking(b.id, revision)).data.revision;
      revision = (await repo.deleteBooking(b.id, revision)).data.revision;
    }
    return { list, final: await repo.getBookings() };
  });
  expect(afterReload.list.data.revision).toBe(2);
  expect(afterReload.list.data.bookings.map((b: { id: string }) => b.id)).toEqual([first.init.data.bookings[0].id, first.created.data.booking.id]);
  expect(afterReload.final).toEqual({ ok: true, data: { bookings: [], revision: 6 } });

  await open(page, true);
  const empty = await page.evaluate(async () => (window as any).bookings.createBookingRepository().initialize());
  expect(empty).toEqual({ ok: true, data: { bookings: [], revision: 6 } });
  expect(errors).toEqual([]);
});

test('real LocalStorage: 용량 초과 시 QUOTA_EXCEEDED, 원본 유지', async ({ page }) => {
  await serve(page);
  await open(page);
  const result = await page.evaluate(async (key) => {
    const repo = (window as any).bookings.createBookingRepository();
    const init = await repo.initialize();
    const before = localStorage.getItem(key);
    // 다른 키로 origin 저장 공간을 거의 채운다
    let chunk = 'x'.repeat(1024 * 1024);
    let i = 0;
    while (chunk.length >= 1) {
      try {
        localStorage.setItem(`filler-${i++}`, chunk);
      } catch {
        chunk = chunk.slice(0, Math.floor(chunk.length / 2));
      }
    }
    const d = new Date(Date.now() + 9 * 3600e3 + 10 * 86400e3).toISOString().slice(0, 10);
    const created = await repo.createBooking({ offerId: 'offer-kim-guitar-60', spaceId: 'space-dongtan-b', date: d, startTime: '18:00', memo: 'a'.repeat(400), acknowledged: true }, init.data.revision);
    const unchanged = localStorage.getItem(key) === before;
    for (let j = 0; j < i; j++) localStorage.removeItem(`filler-${j}`);
    return { init, created, unchanged, list: await repo.getBookings() };
  }, KEY);
  expect(result.init.ok).toBe(true);
  expect(result.created).toMatchObject({ ok: false, error: { code: 'QUOTA_EXCEEDED' } });
  expect(result.unchanged).toBe(true);
  expect(result.list.data.bookings).toHaveLength(1);
});
