import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:3108',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    viewport: { width: 393, height: 851 },
    isMobile: true,
    hasTouch: true,
    screenshot: 'only-on-failure',
  },
  outputDir: './test-results',
  webServer: {
    command: 'npm run mobile:preview',
    url: 'http://127.0.0.1:3108',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
});
