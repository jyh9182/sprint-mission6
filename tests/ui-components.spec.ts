import { test, expect, type Page } from '@playwright/test';

// 2단계 공통 UI 검사. 개발 서버 전용 확인 화면(/ui-check)을 사용한다.
const base = process.env.LANDING_TEST_URL || 'http://localhost:3100';
const target = new URL('/ui-check', base).toString();
const FOCUS_BLUE = 'rgb(56, 117, 199)';
const ERROR_RED = 'rgb(180, 35, 24)';

async function openCheck(page: Page, width = 390) {
  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') failures.push(m.text()); });
  await page.setViewportSize({ width, height: 900 });
  const res = await page.goto(target);
  test.skip(res?.status() === 404, '/ui-check는 개발 서버에서만 제공된다');
  await page.evaluate(() => document.fonts.ready);
  // 클라이언트 초기화 완료(재사용 Button은 그 뒤 활성화된다)
  await expect(page.getByRole('button', { name: '이전' }).first()).toBeEnabled();
  return failures;
}

const outline = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => { const s = getComputedStyle(el); return { color: s.outlineColor, width: s.outlineWidth, style: s.outlineStyle, border: s.borderTopColor }; });

test('Button: 비활성 → 활성, 처리 중 포커스 유지·이름 변경, 저장 결과 알림', async ({ page }) => {
  const failures = await openCheck(page);
  const primary = page.getByRole('button', { name: '예약하기' });
  await expect(primary).toBeDisabled();
  await expect(page.getByText('예약 내용을 확인해주세요.')).toBeVisible();
  const box = await primary.boundingBox();
  expect(box?.height).toBe(56);

  await page.getByLabel('예약 내용을 확인했어요').check();
  await expect(primary).toBeEnabled();

  // 키보드 포커스 → 2px 파란 바깥 링
  await primary.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(primary).toBeFocused();
  expect(await primary.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  // transition-colors 전환(150ms)이 끝난 값을 확인한다
  await expect.poll(() => primary.evaluate((el) => { const s = getComputedStyle(el); return [s.outlineColor, s.outlineWidth, s.outlineStyle]; })).toEqual([FOCUS_BLUE, '2px', 'solid']);

  await page.keyboard.press('Enter');
  const busy = page.getByRole('button', { name: '저장 중…' });
  await expect(busy).toHaveAttribute('aria-busy', 'true');
  await expect(busy).toHaveAttribute('aria-disabled', 'true');
  await expect(busy).toBeFocused();
  await expect(busy).not.toHaveAttribute('disabled', '');
  await page.keyboard.press('Enter'); // 중복 실행 무시
  await expect(page.getByRole('status').filter({ hasText: '예약을 저장했어요' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '예약을 저장했어요' })).toHaveCount(1);
  await expect(primary).toBeFocused();
  await expect(primary).not.toHaveAttribute('aria-busy', 'true');

  await page.getByLabel('저장 실패로 응답').check();
  await primary.click();
  await expect(page.getByRole('alert').filter({ hasText: '저장하지 못했어요' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '예약을 저장했어요' })).toHaveCount(0);
  await expect(primary).toBeEnabled();

  // Secondary: Disabled는 opacity .32 + 탭 순서 제외, Loading은 aria-disabled
  const secondaries = page.getByRole('button', { name: '이전' });
  await expect(secondaries.nth(1)).toBeDisabled();
  expect(await secondaries.nth(1).evaluate((el) => getComputedStyle(el).opacity)).toBe('0.32');
  await expect(page.getByRole('button', { name: '처리 중…' })).toHaveAttribute('aria-busy', 'true');
  expect(failures).toEqual([]);
});

test('Input·Select·Textarea: 레이블 연결, 오류 표시·포커스, 값 유지', async ({ page }) => {
  const failures = await openCheck(page);
  const name = page.getByLabel('이름 (필수)');
  const space = page.getByLabel('레슨 공간 (필수)');
  const memo = page.getByLabel('메모 (선택)');
  await expect(name).toHaveAttribute('aria-required', 'true');
  await expect(name).toHaveAccessibleDescription('입력 내용을 확인해주세요.');
  await expect(memo).toHaveAccessibleDescription('최대 500자');
  expect((await name.boundingBox())?.height).toBe(52);
  expect((await memo.boundingBox())?.height).toBe(112);
  // 빈 값 placeholder는 선택 불가
  await expect(space.locator('option[value=""]')).toBeDisabled();
  await expect(space).toHaveValue('');

  await page.getByRole('button', { name: '입력 확인' }).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription('이름을 입력해주세요.');
  await expect(space).toHaveAccessibleDescription('이용할 공간을 선택해주세요.');
  // 오류 + 포커스: 빨간 선 유지 + 파란 바깥 링
  const both = await outline(page, '#' + (await name.getAttribute('id')));
  expect(both.border).toBe(ERROR_RED);
  expect([both.color, both.width, both.style]).toEqual([FOCUS_BLUE, '2px', 'solid']);

  await name.fill('홍길동');
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription('입력 내용을 확인해주세요.');
  await space.focus();
  await space.selectOption('space-dongtan-b');
  await expect(space).not.toHaveAttribute('aria-invalid', 'true');

  const long = '🎸'.repeat(501);
  await memo.fill(long);
  await expect(memo).toHaveAttribute('aria-invalid', 'true');
  await expect(memo).toHaveAccessibleDescription('메모는 500자까지 입력할 수 있어요.');
  await expect(memo).toHaveValue(long); // 오류여도 입력값 유지
  await memo.press('End');
  await memo.press('Backspace');
  await memo.press('Backspace');
  await expect(memo).not.toHaveAttribute('aria-invalid', 'true');
  await memo.fill('첫 줄');
  await memo.press('Enter'); // 줄바꿈, 제출 아님
  await memo.pressSequentially('둘째 줄');
  await expect(memo).toHaveValue('첫 줄\n둘째 줄');
  expect(failures).toEqual([]);
});

test('Badge·Inline Alert·Header', async ({ page }) => {
  const failures = await openCheck(page);
  for (const label of ['예정', '진행 중', '종료', '취소됨']) {
    const badge = page.locator('.lc-badge', { hasText: new RegExp(`^${label}$`) });
    await expect(badge).toBeVisible();
    expect(await badge.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(-1);
  }
  await expect(page.getByRole('status').filter({ hasText: '레슨 전에 확인해주세요' })).toHaveAttribute('aria-live', 'polite');
  await expect(page.getByRole('alert').filter({ hasText: '저장하지 못했어요' })).toBeVisible();

  const back = page.getByRole('button', { name: '뒤로 가기' });
  await expect(back).toHaveCount(1); // Show back=false 헤더에는 버튼이 없다
  const b = await back.boundingBox();
  expect([b?.width, b?.height]).toEqual([44, 44]);
  await back.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status').filter({ hasText: '뒤로 가기를 눌렀어요' })).toBeVisible();
  const header = page.locator('.lc-header').filter({ hasText: '예약 내역' });
  await expect(header.getByRole('button')).toHaveCount(0);
  expect(failures).toEqual([]);
});

test('확인 Dialog: 초기 포커스, Tab 가두기, Escape·포커스 복귀, 처리 중 잠금, 오류·재시도, 성공', async ({ page }) => {
  const failures = await openCheck(page);
  const opener = page.getByRole('button', { name: '삭제하기' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: '예약 기록을 삭제할까요?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(/삭제한 예약 기록은 복구할 수 없어요./);
  const keep = dialog.getByRole('button', { name: '유지하기' });
  const confirm = dialog.getByRole('button', { name: '삭제하기' });
  await expect(keep).toBeFocused();
  const dbox = await dialog.boundingBox();
  expect(dbox?.width).toBe(350);

  // Tab 순환
  await page.keyboard.press('Tab');
  await expect(confirm).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(keep).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirm).toBeFocused();

  // 배경 클릭으로 닫히지 않음
  await page.mouse.click(5, 5);
  await expect(dialog).toBeVisible();

  // Escape → 닫힘, 연 버튼으로 포커스 복귀
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  // 처리 중: 확인 Loading, 유지 Disabled, Escape 무시 → 실패 시 Error
  await opener.click();
  await confirm.click();
  const busy = dialog.getByRole('button', { name: '처리 중…' });
  await expect(busy).toHaveAttribute('aria-busy', 'true');
  await expect(busy).toBeFocused();
  await expect(keep).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  const error = dialog.getByRole('alert');
  await expect(error).toContainText('삭제하지 못했어요');
  await expect(error).toContainText('기존 기록은 유지했어요. 다시 시도해주세요.');
  await expect(keep).toBeEnabled();
  await expect(confirm).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: '예약 기록을 삭제했어요' })).toHaveCount(0);
  await keep.click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  // 성공: 저장 성공 이후에만 닫히고 결과 알림 표시
  await page.getByLabel('처리 실패로 응답').uncheck();
  await opener.click();
  await confirm.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: '예약 기록을 삭제했어요' })).toBeVisible();
  await expect(opener).toBeFocused();

  // 같은 Dialog를 예약 취소 문구로 재사용
  await page.getByRole('button', { name: '예약 취소' }).click();
  const cancelDialog = page.getByRole('dialog', { name: '예약을 취소할까요?' });
  await expect(cancelDialog.getByRole('button', { name: '예약 취소' })).toBeVisible();
  await expect(cancelDialog.getByRole('button', { name: '유지하기' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '예약 취소' })).toBeFocused();
  expect(failures).toEqual([]);
});

for (const width of [320, 390]) {
  test(`가로 넘침 없음·콘텐츠 350px 이하 ${width}`, async ({ page }) => {
    const failures = await openCheck(page, width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const widths = await page.locator('.lc-field, .lc-alert, .lc-header').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
    for (const w of widths) expect(w).toBeLessThanOrEqual(350);
    if (width === 390) for (const w of widths) expect(w).toBe(350);
    expect(await page.locator('img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0 && i.hasAttribute('alt')))).toBe(true);
    await page.screenshot({ path: `test-results/ui-check-${width}.png`, fullPage: true });
    expect(failures).toEqual([]);
  });
}

test('모션 감소 환경에서 스피너 정지', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCheck(page);
  const spinner = page.getByRole('button', { name: '처리 중…' }).locator('.lc-spinner');
  await expect(spinner).toBeVisible();
  expect(await spinner.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
