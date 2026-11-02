import { test, expect, type Locator, type Page } from '@playwright/test';

const browserErrors = new WeakMap<Page, string[]>();

async function fillBirth(form: Locator, hour = '23', minute = '30') {
  await form.getByLabel('出生年份', { exact: true }).selectOption('2000');
  await form.getByLabel('出生月份', { exact: true }).selectOption('1');
  await form.getByLabel('出生日期', { exact: true }).selectOption('31');
  await form.getByLabel('出生小时', { exact: true }).selectOption(hour);
  await form.getByLabel('出生分钟', { exact: true }).selectOption(minute);
}

async function openChart(page: Page) {
  await page.goto('/chart');
  await fillBirth(page.locator('form'));
  await expect(page.getByText('排盘日期：2000-02-01（晚子时按次日）', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /立即起盘/ }).click();
  await expect(page.getByRole('navigation', { name: '运限切换' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-11-02T04:00:00Z'));
  // Only local chart behavior is tested; the open-source build has no AI backend.
  await page.route('**/api/interpret', route => route.fulfill({ status: 404 }));
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

test('single navigation controls overlays, year changes and fresh-chart reset', async ({ page }) => {
  await openChart(page);
  await expect(page.getByText(/出生输入：2000-01-31 23:30 → 排盘日期：2000-02-01/)).toBeVisible();
  const nav = page.getByRole('navigation', { name: '运限切换' });
  await expect(nav).toHaveCount(1);
  await expect(page.getByLabel(/^流年化/)).toHaveCount(0);
  await expect(page.getByLabel(/^大限化/)).toHaveCount(0);
  const natal = await page.getByLabel(/^生年化/).allTextContents();

  await nav.getByRole('button', { name: '流年', exact: true }).click();
  await expect(nav.getByRole('button', { name: '流年', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(nav).toContainText('2026·丙年四化');
  await expect(page.getByLabel(/^流年化/)).toHaveCount(4);
  await expect(page.getByLabel('流年化禄', { exact: true }).locator('..')).toContainText('天同');
  await expect(page.getByLabel('流年化忌', { exact: true }).locator('..')).toContainText('廉贞');

  await nav.getByRole('button', { name: '下一流年' }).click();
  await expect(nav).toContainText('2027·丁年四化');
  await expect(page.getByLabel('流年化禄', { exact: true }).locator('..')).toContainText('太阴');
  await expect(page.getByLabel('流年化忌', { exact: true }).locator('..')).toContainText('巨门');

  await nav.getByRole('button', { name: /^大限/ }).click();
  await expect(page.getByLabel(/^流年化/)).toHaveCount(0);
  await expect(page.getByLabel(/^大限化/)).toHaveCount(4);
  await nav.getByRole('button', { name: '本命', exact: true }).click();
  await expect(page.getByLabel(/^大限化/)).toHaveCount(0);
  expect(await page.getByLabel(/^生年化/).allTextContents()).toEqual(natal);

  // Clicking a year arrow from natal view must activate that year's overlay as well.
  await nav.getByRole('button', { name: '上一流年' }).click();
  await expect(nav).toContainText('2026·丙年四化');
  await expect(page.getByLabel(/^流年化/)).toHaveCount(4);
  await nav.getByRole('button', { name: '下一流年' }).click();
  await page.getByRole('button', { name: /重新起盘/ }).click();
  await fillBirth(page.locator('form'), '0');
  await page.getByRole('button', { name: /立即起盘/ }).click();
  await expect(nav.getByRole('button', { name: '本命', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(nav).toContainText('2026');
  await expect(page.getByLabel(/^流年化/)).toHaveCount(0);
  await expect(page.getByText(/出生输入：2000-01-31 00:30 → 排盘日期：2000-01-31/)).toBeVisible();
});

test('solar correction changes branch and date in the form and submitted chart', async ({ page }) => {
  await page.goto('/chart');
  const form = page.locator('form');
  await fillBirth(form, '0');
  await form.getByLabel('出生省份', { exact: true }).selectOption({ label: '新疆维吾尔自治区' });
  await expect(form.getByText('排盘日期：2000-01-30（晚子时按次日）', { exact: true })).toBeVisible();
  await expect(form).toContainText('亥时');
  await page.getByRole('button', { name: /立即起盘/ }).click();
  await expect(page.getByText(/出生输入：2000-01-31 00:30 → 排盘日期：2000-01-30/)).toBeVisible();
});

test('combined-chart submission uses the same conversion as direct submission', async ({ page }) => {
  await page.route('**/api/heming', route => route.fulfill({ status: 404 }));
  await page.goto('/heming');
  const forms = page.locator('form');
  await fillBirth(forms.nth(0));
  await fillBirth(forms.nth(1), '0');
  const requestPromise = page.waitForRequest('**/api/heming');
  await page.getByRole('button', { name: '开始合盘分析', exact: true }).click();
  const payload = (await requestPromise).postDataJSON();
  expect(payload.chartA.birthInfo).toMatchObject({ year: 2000, month: 2, day: 1, hour: 0 });
  expect(payload.chartB.birthInfo).toMatchObject({ year: 2000, month: 1, day: 31, hour: 0 });
});

test('equation of time is reflected in both preview and engine input', async ({ page }) => {
  await page.goto('/chart');
  const form = page.locator('form');
  await fillBirth(form, '12', '50');
  await form.getByLabel('出生月份', { exact: true }).selectOption('11');
  await form.getByLabel('出生日期', { exact: true }).selectOption('2');
  await form.getByLabel('出生省份', { exact: true }).selectOption('浙江省');
  await form.getByLabel('出生城市', { exact: true }).selectOption('杭州');
  await expect(form).toContainText('未时');
  await expect(form).toContainText('均时差 16.4 分钟');
  const requestPromise = page.waitForRequest('**/api/interpret');
  await page.getByRole('button', { name: /立即起盘/ }).click();
  expect((await requestPromise).postDataJSON().chart.birthInfo).toMatchObject({
    year: 2000, month: 11, day: 2, hour: 7,
  });
});
