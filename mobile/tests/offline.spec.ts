import { test, expect } from '@playwright/test';

test('packaged assets calculate without a network and preserve theme locally', async ({ page, context }) => {
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '紫微斗数排盘' })).toBeVisible();
  await context.setOffline(true);
  await page.getByLabel('出生年份', { exact: true }).selectOption('2000');
  await page.getByLabel('出生月份', { exact: true }).selectOption('1');
  await page.getByLabel('出生日期', { exact: true }).selectOption('31');
  await page.getByLabel('出生小时', { exact: true }).selectOption('23');
  await page.getByLabel('出生分钟', { exact: true }).selectOption('30');
  await page.getByRole('button', { name: /立即起盘/ }).tap();
  await expect(page.getByText(/出生输入：2000-01-31 23:30 → 排盘日期：2000-02-01/)).toBeVisible();
  await expect(page.getByRole('button', { name: '命宫 丁丑', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '流年', exact: true }).tap();
  await expect(page.getByLabel(/^流年化/)).toHaveCount(4);
  await page.getByRole('button', { name: '命宫 丁丑', exact: true }).tap();
  await expect(page.getByRole('region', { name: '宫位详情' })).toContainText('天机');
  await expect(page.getByRole('heading', { name: 'DeepSeek 解读' })).toBeVisible();
  await page.getByRole('button', { name: '切换主题' }).tap();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('ziwei-theme'))).toBe('light');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
  await page.goBack();
  await expect(page.getByRole('heading', { name: '紫微斗数排盘' })).toBeVisible();
  await expect(page.getByLabel('出生年份', { exact: true })).toHaveValue('2000');
  await expect(page.getByLabel('出生小时', { exact: true })).toHaveValue('23');
});

test('packaged app includes readable upstream and dependency licenses', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '关于', exact: true }).tap();
  await expect(page.getByRole('region', { name: '关于应用' })).toContainText('Renhuai123/ziwei-doushu');
  await page.getByRole('link', { name: '查看开源许可' }).tap();
  await expect(page.locator('body')).toContainText('Permission is hereby granted');
});
