import { test, expect, type Page } from '@playwright/test';

// Exercise the exact Capacitor boundary with a fake native transport. No real key or paid request is used.
async function nativeMock(page: Page, configured = true, scenario = 'success') {
  await page.addInitScript(({ configured, scenario }) => {
    const listeners = new Map<string, (event: unknown) => void>();
    const pending = new Map<string, (error: unknown) => void>();
    let settings = { configured, model: 'deepseek-flash', maxTokens: 2048, consent: configured };
    let listenerId = 0;
    const state = { scenario, requests: [] as { requestId: string; messages: { role: string; content: string }[] }[], cancelled: [] as string[] };
    const emit = (requestId: string, text: string) => listeners.forEach(callback => callback({ requestId, text }));
    Object.assign(window, {
      CapacitorCustomPlatform: { name: 'android' },
      __deepseekMock: state,
      Capacitor: {
        PluginHeaders: [{ name: 'DeepSeek', methods: [
          ...['getSettings', 'saveSettings', 'clearKey', 'interpret', 'cancel', 'removeListener'].map(name => ({ name, rtype: 'promise' })),
          { name: 'addListener', rtype: 'callback' },
        ] }],
        nativeCallback: (_plugin: string, method: string, _options: unknown, callback: (event: unknown) => void) => {
          if (method !== 'addListener') throw new Error('Unknown native callback');
          const id = String(++listenerId); listeners.set(id, callback); return id;
        },
        nativePromise: async (_plugin: string, method: string, options: Record<string, unknown> = {}) => {
          if (method === 'getSettings') return { ...settings };
          if (method === 'saveSettings') {
            settings = { configured: true, model: String(options.model), maxTokens: Number(options.maxTokens), consent: !!options.consent };
            return { ...settings };
          }
          if (method === 'clearKey') { settings.configured = false; settings.consent = false; return { ...settings }; }
          if (method === 'removeListener') { listeners.delete(String(options.callbackId)); return {}; }
          if (method === 'cancel') {
            const id = String(options.requestId); state.cancelled.push(id);
            pending.get(id)?.({ code: 'CANCELLED' }); pending.delete(id);
            setTimeout(() => emit(id, '旧分片不得混入'), 150);
            return {};
          }
          if (method === 'interpret') {
            const request = options as unknown as typeof state.requests[number]; state.requests.push(request);
            if (['AUTH', 'BALANCE', 'RATE_LIMIT', 'TIMEOUT'].includes(state.scenario)) throw { code: state.scenario };
            return new Promise((resolve, reject) => {
              pending.set(request.requestId, reject);
              setTimeout(() => { if (pending.has(request.requestId)) emit(request.requestId, '第一段中文'); }, 50);
              if (state.scenario === 'slow') return;
              setTimeout(() => { if (pending.has(request.requestId)) emit(request.requestId, '，第二段'); }, 100);
              setTimeout(() => {
                if (!pending.has(request.requestId)) return;
                pending.delete(request.requestId);
                const sourceId = /\"id\":\"(TJ-\d{4})\"/.exec(request.messages[0].content)?.[1];
                const finalText = state.scenario === 'uncited' ? '没有课程引用的回答' : state.scenario === 'forged' ? '虚构引用 [TJ-9999]' : state.scenario === 'fakequote' ? `倪老师说：“保证今年必定获得巨额横财。” [${sourceId}]` : `第一段中文，第二段 [${sourceId}]`;
                resolve({ text: finalText, finishReason: 'stop', promptTokens: 100, completionTokens: 20 });
              }, 300);
            });
          }
          throw new Error('Unknown native method');
        },
      },
    });
  }, { configured, scenario });
}
async function makeChart(page: Page) {
  await page.clock.setFixedTime(new Date('2026-11-02T04:00:00Z'));
  await page.goto('/');
  const form = page.locator('form');
  await form.locator('input[type="text"]').fill('PRIVATE_NAME');
  await form.getByLabel('出生年份', { exact: true }).selectOption('2000');
  await form.getByLabel('出生月份', { exact: true }).selectOption('1');
  await form.getByLabel('出生日期', { exact: true }).selectOption('31');
  await form.getByLabel('出生小时', { exact: true }).selectOption('23');
  await form.getByLabel('出生分钟', { exact: true }).selectOption('30');
  await form.getByLabel('出生省份', { exact: true }).selectOption('浙江省');
  await form.getByLabel('出生城市', { exact: true }).selectOption('杭州');
  await page.getByRole('button', { name: /立即起盘/ }).tap();
}
async function requests(page: Page) {
  return page.evaluate(() => (window as unknown as { __deepseekMock: { requests: { requestId: string; messages: { role: string; content: string }[] }[] } }).__deepseekMock.requests);
}

test('configure on device, explicit send, sanitized context and follow-up history', async ({ page }) => {
  await nativeMock(page, false);
  await page.goto('/');
  await page.getByRole('button', { name: 'DeepSeek 设置', exact: true }).tap();
  const settings = page.getByRole('region', { name: 'DeepSeek 设置' });
  await settings.getByLabel('DeepSeek API Key', { exact: true }).fill('sk-test-local-only-12345');
  await settings.getByLabel('DeepSeek 模型').selectOption('deepseek-v4-pro');
  await settings.getByRole('checkbox').check();
  await settings.getByRole('button', { name: '保存设置' }).tap();
  await expect(settings).toContainText('已加密保存在手机');
  await expect(settings.getByLabel('DeepSeek API Key', { exact: true })).toHaveValue('');
  expect(await requests(page)).toHaveLength(0);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('sk-test');
  await settings.getByRole('button', { name: '收起' }).tap();
  // Keep this document and its mock settings instead of reloading.
  const form = page.locator('form');
  await form.locator('input[type="text"]').fill('PRIVATE_NAME');
  for (const [field, value] of [['出生年份', '2000'], ['出生月份', '1'], ['出生日期', '31'], ['出生小时', '23'], ['出生分钟', '30']]) {
    await form.getByLabel(field, { exact: true }).selectOption(value);
  }
  await page.getByRole('button', { name: /立即起盘/ }).tap();
  await expect(page.getByRole('region', { name: 'DeepSeek 解读' })).toContainText('deepseek-v4-pro');
  expect(await requests(page)).toHaveLength(0);
  await page.getByRole('button', { name: '开始解读', exact: true }).tap();
  await expect(page.getByText(/^第一段中文，第二段/)).toBeVisible();
  const first = (await requests(page))[0];
  expect(first.messages).toHaveLength(2);
  expect(JSON.stringify(first.messages)).not.toMatch(/PRIVATE_NAME|birthInfo|origInput|clockHour/);
  await page.getByLabel('追问内容').fill('继续说明');
  await page.getByRole('button', { name: '发送追问' }).tap();
  await expect.poll(async () => (await requests(page)).length).toBe(2);
  expect((await requests(page))[1].messages.map(m => m.role)).toEqual(['system', 'user', 'assistant', 'user']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('stream partial answer, stop, then scope changes clear and cancel old results', async ({ page }) => {
  await nativeMock(page, true, 'slow'); await makeChart(page);
  await page.getByRole('button', { name: '开始解读', exact: true }).tap();
  await expect(page.getByText('第一段中文', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '停止解读', exact: true }).tap();
  await expect(page.getByRole('alert')).toContainText('已停止');
  await page.getByRole('button', { name: '重新解读', exact: true }).tap();
  await expect.poll(async () => (await requests(page)).length).toBe(2);
  await page.getByRole('button', { name: '下一流年' }).tap();
  await expect(page.getByRole('region', { name: 'DeepSeek 解读' })).toContainText('2027 小流年');
  await expect(page.getByText('第一段中文', { exact: true })).toHaveCount(0);
  await page.evaluate(() => { (window as unknown as { __deepseekMock: { scenario: string } }).__deepseekMock.scenario = 'success'; });
  await page.getByRole('button', { name: '开始解读', exact: true }).tap();
  await expect(page.getByText(/^第一段中文，第二段/)).toBeVisible();
  await expect(page.getByText('旧分片不得混入', { exact: true })).toHaveCount(0);
  const last = (await requests(page)).at(-1)!;
  expect(last.messages).toHaveLength(2);
  expect(last.messages[0].content).toContain('"selectedYear":2027');
  expect(last.messages[0].content).not.toContain('杭州');
});

test('settings and AI controls fit the 320px Android viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await nativeMock(page, true); await page.goto('/');
  await page.getByRole('button', { name: 'DeepSeek 设置', exact: true }).tap();
  await expect(page.getByLabel('DeepSeek API Key', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('deepseek-settings-320.png'), fullPage: true, scale: 'css' });
  await page.getByRole('button', { name: '收起', exact: true }).tap();
  await makeChart(page);
  await page.getByRole('button', { name: '开始解读', exact: true }).tap();
  await expect(page.getByText(/^第一段中文，第二段/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('deepseek-answer-320.png'), fullPage: true, scale: 'css' });
});

for (const [code, text] of [['AUTH', '密钥无效'], ['BALANCE', '余额不足'], ['RATE_LIMIT', '过于频繁'], ['TIMEOUT', '超时']]) {
  test(`${code} shows actionable error without automatic retries`, async ({ page }) => {
    await nativeMock(page, true, code); await makeChart(page);
    await page.getByRole('button', { name: '开始解读', exact: true }).tap();
    await expect(page.getByRole('alert')).toContainText(text);
    expect(await requests(page)).toHaveLength(1);
    await page.getByRole('button', { name: '下一流年' }).tap();
    expect(await requests(page)).toHaveLength(1);
    await page.getByRole('button', { name: 'DeepSeek 设置', exact: true }).tap();
    const settings = page.getByRole('region', { name: 'DeepSeek 设置' });
    await settings.getByRole('button', { name: '删除密钥' }).tap();
    await expect(settings).toContainText('已删除本机密钥');
    await settings.getByRole('button', { name: '收起' }).tap();
    await expect(page.getByRole('button', { name: '开始解读', exact: true })).toBeDisabled();
  });
}

for (const scenario of ['uncited', 'forged', 'fakequote']) {
  test(`${scenario} teaching answer is flagged and excluded from follow-up history`, async ({ page }) => {
    await nativeMock(page, true, scenario); await makeChart(page);
    await page.getByRole('button', { name: '开始解读', exact: true }).tap();
    await expect(page.getByRole('alert')).toContainText(scenario === 'forged' ? '依据校验未通过' : scenario === 'fakequote' ? '原文校验未通过' : '没有引用');
    await page.getByText(/本次教学依据/).click();
    await expect(page.getByRole('link', { name: /原课程 P5/ })).toBeVisible();
    await page.getByLabel('追问内容').fill('请补充可核对的依据');
    await page.getByRole('button', { name: '发送追问' }).tap();
    await expect.poll(async () => (await requests(page)).length).toBe(2);
    expect((await requests(page))[1].messages).toHaveLength(2);
  });
}
