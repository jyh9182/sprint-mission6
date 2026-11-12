import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// 9단계 참고 이미지 E2E(design/steps/09-booking-image.md). 개발 서버(또는 LANDING_TEST_URL)의 실제 화면·LocalStorage·Canvas로
// 첨부·교체·제거·되돌리기·새로고침·형식/용량/해석 오류·저장 실패·v1 마이그레이션·390 레이아웃을 검사한다.
// 테스트 이미지는 브라우저 Canvas로 즉석에서 만든 실제 JPEG/PNG/WebP 바이트다(외부 파일·네트워크 없음).
const base = process.env.LANDING_TEST_URL || 'http://localhost:3100';
const KEY = 'lessonconnect:bookings:v2';
const V1_KEY = 'lessonconnect:bookings:v1';
const HOUR = 3600e3;
const DAY = 24 * HOUR;
const MAX_OUTPUT = 500 * 1024;
const MSG = {
  type: 'JPEG, PNG, WebP 이미지만 첨부할 수 있어요.',
  size: '원본 이미지는 2MB 이하만 첨부할 수 있어요.',
  decode: '이미지를 열 수 없어요. 다른 파일을 선택해주세요.',
  quota: '브라우저 저장 공간이 부족해요. 기존 예약과 편집 중인 내용은 유지했어요.',
};

const seoulDate = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(0, 10);
const url = (path: string) => new URL(path, base).toString();
const detailUrl = (id: string) => url(`/bookings/detail?id=${id}`);
const editUrl = (id: string) => url(`/bookings/edit?id=${id}`);

type Img = { fileName: string; originalMimeType: string; originalSizeBytes: number; mimeType: 'image/webp'; sizeBytes: number; width: number; height: number; dataUrl: string };
type FilePayload = { name: string; mimeType: string; buffer: Buffer };

function booking(referenceImage: Img | null = null, memo = '') {
  const created = new Date(Date.now() - 10 * DAY).toISOString();
  return {
    id: randomUUID(), offerId: 'offer-kim-guitar-60', instructorId: 'instructor-kim-minjun', spaceId: 'space-dongtan-a', catalogVersion: '1',
    snapshot: { instructorName: '김민준', instrumentId: 'guitar', instrumentLabel: '기타', genres: ['rock', 'blues'], studioName: '동탄 스튜디오', roomName: 'A 레슨실', equipmentLabels: ['기타', '앰프'], examplePriceKRW: 50000, currency: 'KRW', durationMinutes: 60 },
    date: seoulDate(Date.now() + 7 * DAY), startTime: '19:00', timeZone: 'Asia/Seoul', memo, status: 'scheduled', source: 'seed',
    createdAt: created, updatedAt: created, cancelledAt: null, referenceImage,
  };
}
const storeOf = (bookings: object[], schemaVersion = 2) =>
  JSON.stringify({ schemaVersion, revision: 3, initializedAt: new Date(Date.now() - 10 * DAY).toISOString(), seedVersion: 1, bookings });

function watchErrors(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') failures.push(m.text()); });
  return failures;
}

async function seed(page: Page, entries: Record<string, string>, width = 390, height = 844) {
  await page.setViewportSize({ width, height });
  await page.goto(base);
  await page.evaluate((values) => {
    localStorage.clear();
    sessionStorage.clear();
    for (const [k, v] of Object.entries(values)) localStorage.setItem(k, v);
  }, entries);
}

async function openNew(page: Page, width = 390, height = 844) {
  await seed(page, {}, width, height);
  await page.goto(url('/bookings/new'));
  await expect(page.getByLabel('강사 · 레슨 (필수)')).toBeEnabled();
}

async function openEdit(page: Page, raw: string, id: string) {
  await seed(page, { [KEY]: raw });
  await page.goto(editUrl(id));
  await expect(page.getByLabel('메모 (선택)', { exact: true })).toBeEnabled();
}

/** 브라우저 Canvas로 실제 이미지 바이트를 만든다. noise=true면 압축이 어려운 무작위 픽셀. */
async function canvasImage(page: Page, w: number, h: number, type: string, opts: { noise?: boolean; quality?: number } = {}): Promise<Buffer> {
  const b64 = await page.evaluate(async ({ w, h, type, noise, quality }) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d')!;
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#d9a46b');
    g.addColorStop(1, '#2f5d7c');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff';
    x.fillRect(w * 0.4, h * 0.1, w * 0.2, h * 0.8); // 방향 확인용 세로 막대
    if (noise) {
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        d.data[i] = Math.random() * 255;
        d.data[i + 1] = Math.random() * 255;
        d.data[i + 2] = Math.random() * 255;
      }
      x.putImageData(d, 0, 0);
    }
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), type, quality));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }, { w, h, type, noise: opts.noise ?? false, quality: opts.quality ?? 0.9 });
  return Buffer.from(b64, 'base64');
}

/** 저장 시드용 ReferenceImage(실제 WebP 바이트). */
async function storedImage(page: Page, fileName: string, w = 640, h = 480): Promise<Img> {
  const buffer = await canvasImage(page, w, h, 'image/webp', { quality: 0.8 });
  return { fileName, originalMimeType: 'image/jpeg', originalSizeBytes: 300_000, mimeType: 'image/webp', sizeBytes: buffer.length, width: w, height: h, dataUrl: `data:image/webp;base64,${buffer.toString('base64')}` };
}

const imageGroup = (page: Page) => page.getByRole('group', { name: '참고 이미지 (선택)' });
const preview = (page: Page) => page.locator('.lc-image-card__thumb');
const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), KEY);
const rawStore = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEY);
const field = (page: Page, label: string) => page.getByLabel(label, { exact: true });
const ack = (page: Page) => page.getByLabel('예약 내용과 이용 안내를 확인했어요.');
const footerButton = (page: Page, name: string) => page.locator('.lc-detail-footer').getByRole('button', { name });

/** 보이는 버튼을 눌러 실제 파일 선택 창을 열고 파일을 고른다. 준비가 끝날 때까지 기다린다. */
async function choose(page: Page, buttonName: string, file: FilePayload) {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), imageGroup(page).getByRole('button', { name: buttonName }).click()]);
  expect(chooser.isMultiple()).toBe(false);
  await chooser.setFiles(file);
  await expect(imageGroup(page)).not.toHaveAttribute('aria-busy', 'true');
}

async function fillValid(page: Page) {
  await field(page, '강사 · 레슨 (필수)').selectOption('offer-kim-guitar-60');
  await field(page, '날짜 (필수)').fill(seoulDate(Date.now() + 5 * DAY));
  await field(page, '시작 시간 (필수)').selectOption('20:00');
  await field(page, '레슨 공간 (필수)').selectOption('space-dongtan-b');
  await ack(page).check();
}

function base64Bytes(dataUrl: string) {
  return Buffer.from(dataUrl.slice('data:image/webp;base64,'.length), 'base64');
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

test('생성: 첨부 → 변환 미리보기 → 저장 → 상세 표시, 새로고침해도 유지(긴 변 1280px·WebP·메타데이터)', async ({ page }) => {
  const failures = watchErrors(page);
  await openNew(page);
  await expect(imageGroup(page).getByText('JPEG · PNG · WebP · 원본 최대 2MB')).toBeVisible();
  await expect(imageGroup(page).locator('input[type=file]')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  const jpeg = await canvasImage(page, 2400, 1600, 'image/jpeg');
  await fillValid(page);
  await choose(page, '참고 이미지 선택', { name: 'guitar-reference.jpg', mimeType: 'image/jpeg', buffer: jpeg });

  await expect(preview(page)).toHaveAttribute('alt', '선택한 참고 이미지: guitar-reference.jpg');
  await expect(preview(page)).toHaveAttribute('src', /^data:image\/webp;base64,/);
  await expect(imageGroup(page)).toContainText(/변환 완료 · \d+KB/);
  await expect(imageGroup(page).getByRole('button', { name: '참고 이미지 교체' })).toBeVisible();
  await expect(imageGroup(page).getByRole('button', { name: '참고 이미지 제거' })).toBeVisible();
  for (const name of ['참고 이미지 교체', '참고 이미지 제거']) {
    const box = await imageGroup(page).getByRole('button', { name }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  // 선택 전 저장소는 그대로(폼 draft만 바뀜)
  expect((await stored(page)).bookings).toHaveLength(1);

  await footerButton(page, '예약하기').click();
  await expect(page).toHaveURL(/\/bookings\/detail\?id=/);
  const id = new URL(page.url()).searchParams.get('id')!;
  const img = (await stored(page)).bookings.find((b: { id: string }) => b.id === id).referenceImage as Img;
  expect(img).toMatchObject({ fileName: 'guitar-reference.jpg', originalMimeType: 'image/jpeg', originalSizeBytes: jpeg.length, mimeType: 'image/webp', width: 1280, height: 853 });
  const bytes = base64Bytes(img.dataUrl);
  expect(bytes.length).toBe(img.sizeBytes);
  expect(img.sizeBytes).toBeLessThanOrEqual(MAX_OUTPUT);
  expect(bytes.subarray(0, 4).toString('latin1') + bytes.subarray(8, 12).toString('latin1')).toBe('RIFFWEBP');

  const card = page.getByRole('region', { name: '참고 이미지' });
  const detailImg = card.getByRole('img', { name: '예약 참고 이미지: guitar-reference.jpg' });
  await expect(detailImg).toBeVisible();
  await expect.poll(() => detailImg.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1280);
  await expect(card).toContainText('guitar-reference.jpg');
  // 메모 카드 다음, 예약 관리 전
  const order = await page.locator('.lc-detail-content > section').evaluateAll((els) => els.map((e) => e.getAttribute('aria-labelledby') ?? e.getAttribute('aria-label')));
  expect(order.slice(0, 4)).toEqual(['예약 정보', 'booking-memo-title', 'booking-image-title', 'booking-manage-title']);

  await page.reload();
  await expect(page.getByRole('img', { name: '예약 참고 이미지: guitar-reference.jpg' })).toBeVisible();
  expect(failures).toEqual([]);
});

test('잘못된 형식·초과 용량·해석 실패: 필드 아래 오류, 직전 미리보기 유지, 저장소 무변경', async ({ page }) => {
  const failures = watchErrors(page);
  await openNew(page);
  const before = await rawStore(page);
  const png = await canvasImage(page, 300, 200, 'image/png');
  const jpeg = await canvasImage(page, 300, 200, 'image/jpeg');
  const pngHeader = png.subarray(0, 16);
  const cases: Array<[string, FilePayload, string]> = [
    ['텍스트', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') }, MSG.type],
    ['SVG', { name: 'icon.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') }, MSG.type],
    ['PDF를 png로 위장', { name: 'doc.png', mimeType: 'image/png', buffer: Buffer.from('%PDF-1.7 ...') }, MSG.type],
    ['MIME·시그니처 불일치', { name: 'photo.png', mimeType: 'image/png', buffer: jpeg }, MSG.type],
    ['2MB 초과', { name: 'big.png', mimeType: 'image/png', buffer: Buffer.concat([pngHeader, Buffer.alloc(2 * 1024 * 1024 + 1 - pngHeader.length)]) }, MSG.size],
    ['빈 파일', { name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) }, MSG.decode],
    ['깨진 PNG', { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.concat([pngHeader, Buffer.from('not really an image')]) }, MSG.decode],
  ];

  // 이미지 없음 상태의 오류: `다른 이미지 선택`으로 바뀐다
  await choose(page, '참고 이미지 선택', cases[0][1]);
  const error = imageGroup(page).getByRole('alert');
  await expect(error).toHaveText(MSG.type);
  const retry = imageGroup(page).getByRole('button', { name: /다른 이미지 선택/ });
  await expect(retry).toHaveAttribute('aria-invalid', 'true');
  await expect(preview(page)).toHaveCount(0);

  // 정상 파일로 오류 해제 → 미리보기
  await choose(page, '다른 이미지 선택 파일을 선택해 다시 시도해주세요', { name: 'small.png', mimeType: 'image/png', buffer: png });
  await expect(error).toHaveCount(0);
  await expect(preview(page)).toHaveAttribute('alt', '선택한 참고 이미지: small.png');
  const firstSrc = await preview(page).getAttribute('src');

  for (const [name, file, message] of cases) {
    await choose(page, '참고 이미지 교체', file);
    await expect(error, name).toHaveText(message);
    await expect(preview(page), name).toHaveAttribute('alt', '선택한 참고 이미지: small.png');
    expect(await preview(page).getAttribute('src'), name).toBe(firstSrc);
    const replace = imageGroup(page).getByRole('button', { name: '참고 이미지 교체' });
    await expect(replace).toHaveAttribute('aria-invalid', 'true');
    const describedBy = (await replace.getAttribute('aria-describedby'))!.split(' ');
    expect(describedBy).toContain((await error.getAttribute('id'))!);
  }
  // 작은 이미지는 확대하지 않는다
  await fillValid(page);
  await footerButton(page, '예약하기').click();
  await expect(page).toHaveURL(/\/bookings\/detail\?id=/);
  const id = new URL(page.url()).searchParams.get('id')!;
  const saved = (await stored(page)).bookings.find((b: { id: string }) => b.id === id).referenceImage;
  expect(saved).toMatchObject({ fileName: 'small.png', originalMimeType: 'image/png', width: 300, height: 200 });
  expect(before).not.toBeNull();
  expect(failures).toEqual([]);
});

test('압축이 어려운 이미지: 품질·크기를 낮춰 변환 결과 500KB 이하만 저장', async ({ page }) => {
  await openNew(page);
  const noisy = await canvasImage(page, 1100, 1100, 'image/jpeg', { noise: true, quality: 0.6 });
  expect(noisy.length).toBeLessThanOrEqual(2 * 1024 * 1024); // 원본 제한 안
  await fillValid(page);
  await choose(page, '참고 이미지 선택', { name: 'noise.jpg', mimeType: 'image/jpeg', buffer: noisy });
  await expect(preview(page)).toBeVisible();
  await footerButton(page, '예약하기').click();
  await expect(page).toHaveURL(/\/bookings\/detail\?id=/);
  const id = new URL(page.url()).searchParams.get('id')!;
  const img = (await stored(page)).bookings.find((b: { id: string }) => b.id === id).referenceImage as Img;
  expect(img.sizeBytes).toBeLessThanOrEqual(MAX_OUTPUT);
  expect(base64Bytes(img.dataUrl).length).toBe(img.sizeBytes);
  expect(Math.max(img.width, img.height)).toBeLessThanOrEqual(1100);
  expect(img.width).toBe(img.height); // 비율 유지
  // 첫 품질(0.86)로는 500KB를 넘는 입력이어야 단계적 축소를 실제로 검사한 것이다
  const firstPass = await page.evaluate(async (b64) => {
    const blob = new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: 'image/jpeg' });
    const bmp = await createImageBitmap(blob);
    const c = document.createElement('canvas');
    c.width = bmp.width;
    c.height = bmp.height;
    c.getContext('2d')!.drawImage(bmp, 0, 0);
    return new Promise<number>((r) => c.toBlob((b) => r(b!.size), 'image/webp', 0.86));
  }, noisy.toString('base64'));
  test.info().annotations.push({ type: 'sizes', description: `원본 ${noisy.length}B, 첫 품질 WebP ${firstPass}B, 저장 ${img.sizeBytes}B ${img.width}×${img.height}` });
  expect(firstPass).toBeGreaterThan(MAX_OUTPUT);
});

test('이미지 준비 중: 상태 안내, 저장·교체·제거 차단, 완료 후 해제', async ({ page }) => {
  await openNew(page);
  await fillValid(page);
  await choose(page, '참고 이미지 선택', { name: 'first.png', mimeType: 'image/png', buffer: await canvasImage(page, 200, 200, 'image/png') });
  // 디코딩을 테스트가 풀어줄 때까지 붙잡는다
  await page.evaluate(() => {
    const original = window.createImageBitmap.bind(window);
    const w = window as unknown as { __release: () => void };
    (window as unknown as { createImageBitmap: unknown }).createImageBitmap = (...args: Parameters<typeof createImageBitmap>) =>
      new Promise((resolve) => { w.__release = () => resolve(original(...args)); });
  });
  const second = await canvasImage(page, 300, 300, 'image/png');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), imageGroup(page).getByRole('button', { name: '참고 이미지 교체' }).click()]);
  await chooser.setFiles({ name: 'second.png', mimeType: 'image/png', buffer: second });
  await expect(imageGroup(page).getByRole('status')).toHaveText('이미지 준비 중…');
  await expect(footerButton(page, '예약하기')).toBeDisabled();
  await expect(imageGroup(page).getByRole('button', { name: '참고 이미지 교체' })).toBeDisabled();
  await expect(imageGroup(page).getByRole('button', { name: '참고 이미지 제거' })).toBeDisabled();
  await field(page, '날짜 (필수)').press('Enter'); // Enter 제출도 막힌다
  await expect(page).toHaveURL(url('/bookings/new'));
  await page.evaluate(() => (window as unknown as { __release: () => void }).__release());
  await expect(preview(page)).toHaveAttribute('alt', '선택한 참고 이미지: second.png');
  await expect(imageGroup(page).getByText('이미지 준비 중…')).toHaveCount(0);
  await expect(footerButton(page, '예약하기')).toBeEnabled();
});

test('수정: 교체 후 수정 취소 → 기존 첨부 유지, 제거 예정·되돌리기, 제거 저장 → 상세 카드 숨김', async ({ page }) => {
  const failures = watchErrors(page);
  await seed(page, {});
  const old = await storedImage(page, 'old-guitar.jpg');
  const b = booking(old, '기존 메모');
  const raw = storeOf([b]);
  await openEdit(page, raw, b.id);

  await expect(preview(page)).toHaveAttribute('alt', '선택한 참고 이미지: old-guitar.jpg');
  await expect(footerButton(page, '변경사항 저장')).toBeDisabled();

  // 교체 → 이미지 변경만으로도 저장 가능
  const png = await canvasImage(page, 800, 600, 'image/png');
  await choose(page, '참고 이미지 교체', { name: 'new-score.png', mimeType: 'image/png', buffer: png });
  await expect(preview(page)).toHaveAttribute('alt', '선택한 참고 이미지: new-score.png');
  await expect(footerButton(page, '변경사항 저장')).toBeEnabled();

  // 수정 취소 → 계속 작성: draft 유지
  await page.getByRole('button', { name: '수정 취소' }).click();
  const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
  await expect(dialog).toContainText('수정을 그만둘까요?');
  await dialog.getByRole('button', { name: '계속 작성' }).click();
  await expect(preview(page)).toHaveAttribute('alt', '선택한 참고 이미지: new-score.png');
  // 수정 취소 → 나가기: 기존 첨부 유지
  await page.getByRole('button', { name: '수정 취소' }).click();
  await dialog.getByRole('button', { name: '나가기' }).click();
  await expect(page).toHaveURL(detailUrl(b.id));
  await expect(page.getByRole('img', { name: '예약 참고 이미지: old-guitar.jpg' })).toBeVisible();
  expect(await rawStore(page)).toBe(raw);

  // 제거 예정 → 되돌리기 → 변경 없음
  await page.goto(editUrl(b.id));
  await imageGroup(page).getByRole('button', { name: '참고 이미지 제거' }).click();
  await expect(imageGroup(page)).toContainText('이미지 제거 예정');
  await expect(imageGroup(page)).toContainText('저장 전에는 기존 이미지가 유지돼요');
  await expect(preview(page)).toHaveCount(0);
  await expect(footerButton(page, '변경사항 저장')).toBeEnabled();
  await imageGroup(page).getByRole('button', { name: '제거 되돌리기' }).click();
  await expect(preview(page)).toHaveAttribute('alt', '선택한 참고 이미지: old-guitar.jpg');
  await expect(footerButton(page, '변경사항 저장')).toBeDisabled();

  // 교체 후 다시 제거하면 최종 draft는 제거 예정
  await choose(page, '참고 이미지 교체', { name: 'new-score.png', mimeType: 'image/png', buffer: png });
  await imageGroup(page).getByRole('button', { name: '참고 이미지 제거' }).click();
  await expect(imageGroup(page)).toContainText('이미지 제거 예정');
  await ack(page).check();
  await footerButton(page, '변경사항 저장').click();
  await expect(page).toHaveURL(detailUrl(b.id));
  await expect(page.getByText('예약을 수정했어요')).toBeVisible();
  await expect(page.getByRole('region', { name: '참고 이미지' })).toHaveCount(0);
  const s = await stored(page);
  expect(s.bookings[0].referenceImage).toBeNull();
  expect(s.bookings[0].memo).toBe('기존 메모');
  expect(s.revision).toBe(4);
  await page.reload();
  await expect(page.getByRole('heading', { level: 3, name: '메모' })).toBeVisible();
  await expect(page.getByRole('region', { name: '참고 이미지' })).toHaveCount(0);
  expect(failures).toEqual([]);
});

test('저장 용량 초과·쓰기 실패: 폼·준비한 이미지·기존 첨부 보존, 재시도 성공', async ({ page }) => {
  const failures = watchErrors(page);
  await seed(page, {});
  const old = await storedImage(page, 'old-guitar.jpg');
  const b = booking(old);
  const raw = storeOf([b]);
  await openEdit(page, raw, b.id);
  const jpeg = await canvasImage(page, 1600, 1200, 'image/jpeg');
  await choose(page, '참고 이미지 교체', { name: 'replacement.jpg', mimeType: 'image/jpeg', buffer: jpeg });
  await field(page, '메모 (선택)').fill('남아야 하는 메모');
  await ack(page).check();

  // 실제 origin 저장 공간을 다른 키로 채워 브라우저의 QuotaExceededError를 낸다
  const fillers = await page.evaluate(() => {
    let chunk = 'x'.repeat(1024 * 1024);
    let i = 0;
    while (chunk.length >= 1) {
      try {
        localStorage.setItem(`filler-${i}`, chunk);
        i += 1;
      } catch {
        chunk = chunk.slice(0, Math.floor(chunk.length / 2));
      }
    }
    return i;
  });
  await footerButton(page, '변경사항 저장').click();
  const alert = page.locator('.lc-alert--error');
  await expect(alert).toContainText('변경 내용을 저장하지 못했어요');
  await expect(alert).toContainText(MSG.quota);
  await expect(page).toHaveURL(editUrl(b.id));
  await expect(preview(page)).toHaveAttribute('alt', '선택한 참고 이미지: replacement.jpg');
  await expect(field(page, '메모 (선택)')).toHaveValue('남아야 하는 메모');
  await expect(ack(page)).toBeChecked();
  expect(await rawStore(page)).toBe(raw);
  // 이미지 오류(파일 필드)와 저장소 오류(상단 알림)를 섞지 않는다
  await expect(imageGroup(page).getByRole('alert')).toHaveCount(0);

  // 일반 쓰기 실패
  await page.evaluate((n) => { for (let j = 0; j < n; j++) localStorage.removeItem(`filler-${j}`); }, fillers + 1);
  await page.evaluate(() => {
    (window as unknown as { __setItem: Storage['setItem'] }).__setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new Error('boom'); };
  });
  await footerButton(page, '변경사항 저장').click();
  await expect(alert).toContainText('편집 중인 내용은 유지했어요. 다시 시도해주세요.');
  await expect(preview(page)).toHaveAttribute('alt', '선택한 참고 이미지: replacement.jpg');
  expect(await rawStore(page)).toBe(raw);

  await page.evaluate(() => { Storage.prototype.setItem = (window as unknown as { __setItem: Storage['setItem'] }).__setItem; });
  await footerButton(page, '변경사항 저장').click();
  await expect(page).toHaveURL(detailUrl(b.id));
  await expect(page.getByRole('img', { name: '예약 참고 이미지: replacement.jpg' })).toBeVisible();
  const saved = (await stored(page)).bookings[0];
  expect(saved.memo).toBe('남아야 하는 메모');
  expect(saved.referenceImage).toMatchObject({ fileName: 'replacement.jpg', width: 1280, height: 960 });
  expect(failures).toEqual([]);
});

test('첨부 없는 v1 예약: v2로 이전 후 상세 정상(이미지 카드 없음), v1 원본 유지, 이미지만 추가해도 수정 저장', async ({ page }) => {
  const failures = watchErrors(page);
  const { referenceImage: _omit, ...v1 } = booking(null, 'v1 메모');
  const v1Raw = storeOf([v1], 1);
  await seed(page, { [V1_KEY]: v1Raw });
  await page.goto(detailUrl(v1.id));
  await expect(page.getByRole('heading', { level: 2, name: '김민준 선생님과의 레슨' })).toBeVisible();
  await expect(page.getByText('v1 메모')).toBeVisible();
  await expect(page.getByRole('region', { name: '참고 이미지' })).toHaveCount(0);
  const v2 = await stored(page);
  expect(v2).toMatchObject({ schemaVersion: 2, revision: 3 });
  expect(v2.bookings[0]).toEqual({ ...v1, referenceImage: null });
  expect(await page.evaluate((k) => localStorage.getItem(k), V1_KEY)).toBe(v1Raw);

  await page.goto(editUrl(v1.id));
  await expect(imageGroup(page).getByRole('button', { name: /참고 이미지 선택/ })).toBeVisible();
  await expect(footerButton(page, '변경사항 저장')).toBeDisabled();
  await choose(page, '참고 이미지 선택', { name: 'added.webp', mimeType: 'image/webp', buffer: await canvasImage(page, 400, 300, 'image/webp') });
  await ack(page).check();
  await footerButton(page, '변경사항 저장').click();
  await expect(page).toHaveURL(detailUrl(v1.id));
  await expect(page.getByRole('img', { name: '예약 참고 이미지: added.webp' })).toBeVisible();
  expect((await stored(page)).bookings[0].referenceImage).toMatchObject({ originalMimeType: 'image/webp', width: 400, height: 300 });
  expect(failures).toEqual([]);
});

test('390×844: 이미지 필드·긴 파일명·상세 카드가 스크롤 본문 안에 있고 고정 Footer와 겹치지 않음, 키보드로 선택', async ({ page }) => {
  const failures = watchErrors(page);
  await openNew(page);
  const longName = `${'아주-긴-레슨-참고-이미지-파일명-'.repeat(8)}.png`;
  // 키보드: Tab으로 `참고 이미지 선택`에 도달해 Enter로 선택 창을 연다
  const trigger = imageGroup(page).getByRole('button', { name: /참고 이미지 선택/ });
  await field(page, '메모 (선택)').focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Enter')]);
  await chooser.setFiles({ name: longName, mimeType: 'image/png', buffer: await canvasImage(page, 900, 1200, 'image/png') });
  await expect(preview(page)).toBeVisible();

  const name = imageGroup(page).locator('.lc-image-card__name');
  const safeName = Array.from(longName).slice(0, 120).join('');
  await expect(name).toHaveAttribute('title', safeName);
  await expect(preview(page)).toHaveAttribute('alt', `선택한 참고 이미지: ${safeName}`);
  expect(await name.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThanOrEqual(42 + 1); // 2줄
  await expectNoHorizontalOverflow(page);

  await imageGroup(page).scrollIntoViewIfNeeded();
  const footerTop = (await page.locator('.lc-detail-footer').boundingBox())!.y;
  const actions = (await imageGroup(page).getByRole('button', { name: '참고 이미지 제거' }).boundingBox())!;
  expect(actions.y + actions.height).toBeLessThanOrEqual(footerTop);

  await fillValid(page);
  await footerButton(page, '예약하기').click();
  await expect(page).toHaveURL(/\/bookings\/detail\?id=/);
  const card = page.getByRole('region', { name: '참고 이미지' });
  await card.scrollIntoViewIfNeeded();
  const cardBox = (await card.boundingBox())!;
  const detailFooterTop = (await page.locator('.lc-detail-footer').boundingBox())!.y;
  expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(detailFooterTop);
  expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(390);
  await expectNoHorizontalOverflow(page);
  expect(failures).toEqual([]);
});
