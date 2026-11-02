import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });

test('course Xin-Chou female case: fixed transformations, Kui at Wu and selected-year fortune', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.setFixedTime(new Date('1994-11-02T04:00:00Z'));
  await page.route('**/api/interpret', route => route.fulfill({ status: 404 }));
  await page.goto('/chart');
  for (const [field, value] of [['出生年份', '1961'], ['出生月份', '4'], ['出生日期', '19'], ['出生小时', '19'], ['出生分钟', '0']]) {
    await page.getByLabel(field, { exact: true }).selectOption(value);
  }
  await page.getByRole('button', { name: '♀ 女', exact: true }).tap();
  await page.getByRole('button', { name: /立即起盘/ }).tap();
  const ming = page.getByRole('button', { name: /^命宫 .*午$/ });
  await expect(ming).toContainText('贪狼');
  await expect(ming).toContainText('天魁');
  const natal = await page.getByLabel(/^生年化/).allTextContents();
  const nav = page.getByRole('navigation', { name: '运限切换' });
  await nav.getByRole('button', { name: '大限', exact: true }).tap();
  await expect(nav).toContainText('34–43岁');
  await expect(page.locator('.palace-fortune-marker').locator('..')).toHaveAttribute('aria-label', /^田宅 .*酉$/);
  await nav.getByRole('button', { name: '流年', exact: true }).tap();
  await expect(page.locator('.palace-fortune-marker').locator('..')).toHaveAttribute('aria-label', /^官禄 .*戌$/);
  for (let i = 0; i < 6; i++) await nav.getByRole('button', { name: '下一流年' }).tap();
  await expect(nav).toContainText('2000 农历流年 · 虚岁 40');
  await expect(page.locator('.palace-fortune-marker').locator('..')).toHaveAttribute('aria-label', /^夫妻 .*辰$/);
  expect(await page.getByLabel(/^生年化/).allTextContents()).toEqual(natal);
  await expect(page.getByLabel(/^流年化|^大限化/)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('ni-course-female-40.png'), fullPage: true });
});

test('unsupported leap-day substitution is explained without silently changing the birth day', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/chart');
  for (const [field, value] of [['出生年份', '1952'], ['出生月份', '7'], ['出生日期', '21']]) {
    await page.getByLabel(field, { exact: true }).selectOption(value);
  }
  await page.getByRole('button', { name: /立即起盘/ }).tap();
  await expect(page.locator('form').getByRole('alert')).toContainText('闰月三十');
  await expect(page.getByRole('heading', { name: '紫微斗数排盘' })).toBeVisible();
  expect(errors).toEqual([]);
});
