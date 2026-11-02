import { test, expect } from '@playwright/test';

const sizes: { name: string; width: number; height: number; mobile: boolean; theme?: string }[] = [
  { name: 'Android 320', width: 320, height: 740, mobile: true },
  { name: 'Android 360', width: 360, height: 800, mobile: true },
  { name: 'Android 393', width: 393, height: 851, mobile: true },
  { name: 'Android 412', width: 412, height: 915, mobile: true },
  { name: 'Android 393 light', width: 393, height: 851, mobile: true, theme: 'light' },
  { name: 'Android landscape', width: 800, height: 360, mobile: true },
  { name: 'narrow app panel', width: 716, height: 900, mobile: false },
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
];

for (const size of sizes) {
  test.describe(size.name, () => {
    test.use({
      viewport: { width: size.width, height: size.height },
      isMobile: size.mobile,
      hasTouch: size.mobile,
      deviceScaleFactor: size.mobile ? 3 : 1,
      ...(size.mobile ? { userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' } : {}),
    });

    test('chart fits, star names stay intact and touch navigation works', async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-11-02T04:00:00Z'));
      if (size.theme) await page.addInitScript(theme => localStorage.setItem('ziwei-theme', theme), size.theme);
      await page.route('**/api/interpret', route => route.fulfill({ status: 404 }));
      await page.goto('/chart');
      await page.getByLabel('出生年份', { exact: true }).selectOption('2000');
      await page.getByLabel('出生月份', { exact: true }).selectOption('1');
      await page.getByLabel('出生日期', { exact: true }).selectOption('31');
      await page.getByLabel('出生小时', { exact: true }).selectOption('23');
      await page.getByLabel('出生分钟', { exact: true }).selectOption('30');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.getByRole('button', { name: /立即起盘/ }).click();
      const cells = page.locator('.chart-palace-cell');
      await expect(cells).toHaveCount(12);
      await expect.poll(() => cells.evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1'))).toBe(true);

      const geometry = await page.evaluate(() => {
        const board = document.querySelector('.chart-board')!.getBoundingClientRect();
        const aside = document.querySelector('.chart-insights')!.getBoundingClientRect();
        const header = document.querySelector('.chart-result-header')!.getBoundingClientRect();
        const cells = [...document.querySelectorAll<HTMLElement>('.chart-palace-cell')];
        const overflowNames = [...document.querySelectorAll<HTMLElement>('.palace-star-name')].filter(element => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const box = range.getBoundingClientRect();
          const cell = element.closest('.chart-palace-cell')!.getBoundingClientRect();
          return box.height > parseFloat(getComputedStyle(element).lineHeight) + 1 || box.left < cell.left || box.right > cell.right;
        }).map(element => element.textContent);
        return {
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          headerBeforeBoard: header.bottom < board.top,
          boardWidth: board.width,
          stacked: aside.top >= board.bottom - 1,
          beside: aside.left >= board.right,
          overflowingCells: cells.filter(cell => cell.scrollWidth > cell.clientWidth + 1).map(cell => cell.getAttribute('aria-label')),
          overflowNames,
          rowHeights: cells.map(cell => cell.getBoundingClientRect().height),
        };
      });
      expect(geometry.pageOverflow).toBe(false);
      expect(geometry.headerBeforeBoard).toBe(true);
      expect(geometry.overflowingCells).toEqual([]);
      expect(geometry.overflowNames).toEqual([]);
      expect(Math.max(...geometry.rowHeights) - Math.min(...geometry.rowHeights)).toBeLessThan(2);
      if (size.width < 1180) {
        expect(geometry.stacked).toBe(true);
        expect(geometry.boardWidth).toBeGreaterThan(size.width - 40);
      } else expect(geometry.beside).toBe(true);

      const nav = page.getByRole('navigation', { name: '运限切换' });
      const arrow = nav.getByRole('button', { name: '下一流年' });
      const arrowSize = await arrow.boundingBox();
      expect(arrowSize!.width).toBeGreaterThanOrEqual(44);
      expect(arrowSize!.height).toBeGreaterThanOrEqual(44);
      if (size.mobile) await arrow.tap();
      else await arrow.click();
      await expect(nav).toContainText('2027 农历流年');
      await expect(page.getByLabel(/^流年化/)).toHaveCount(0);
      const mingStar = page.getByRole('button', { name: '命宫 丁丑', exact: true }).locator('.palace-star-name').first();
      if (size.mobile) await mingStar.tap();
      else await mingStar.click();
      const detail = page.getByRole('region', { name: '宫位详情' });
      await expect(detail).toContainText((await mingStar.textContent())!);
      await expect(detail.getByRole('heading')).toContainText('命宫');
      expect(errors).toEqual([]);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath('chart-responsive.png'), fullPage: true });
    });
  });
}
