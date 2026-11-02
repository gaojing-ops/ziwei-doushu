import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { chartForAi, requestMessages } from '../../mobile/deepseek/prompt';

const chart = generateChart({ year: 2000, month: 2, day: 1, hour: 0, gender: 'male', name: 'PRIVATE_NAME', city: 'PRIVATE_CITY', province: 'PRIVATE_PROVINCE', longitude: 123.456,
  origInput: { year: 2000, month: 1, day: 31, clockHour: 23, clockMinute: 30 } });
const context = { chart, selectedPalace: chart.palaces.find(p => p.name === '命宫')!, view: 'liunian' as const, liunianYear: 2026 };
const compact = chartForAi(context);
const encoded = JSON.stringify(compact);
for (const privateValue of ['PRIVATE_NAME', 'PRIVATE_CITY', 'PRIVATE_PROVINCE', '123.456', 'origInput', 'birthInfo', '2000-02-01', 'clockHour', 'lunarYear']) {
  assert(!encoded.includes(privateValue), `should omit ${privateValue}`);
}
assert.equal(compact.palaces.length, 12);
const stars = compact.palaces.flatMap(p => p.stars);
assert.equal(stars.find(s => s.name === '天同')!.overlaySiHua, '禄');
assert.equal(stars.find(s => s.name === '天机')!.overlaySiHua, '权');
assert.equal(stars.find(s => s.name === '文昌')!.overlaySiHua, '科');
assert.equal(stars.find(s => s.name === '廉贞')!.overlaySiHua, '忌');
const nextYear = chartForAi({ ...context, liunianYear: 2027 });
assert.equal(nextYear.palaces.flatMap(p => p.stars).find(s => s.name === '太阴')!.overlaySiHua, '禄');
assert.equal(nextYear.nominalAge, 2027 - chart.lunarInfo.lunarYear + 1);
assert(chartForAi({ ...context, view: 'mingpan' }).palaces.every(p => p.stars.every(s => s.overlaySiHua === null)));
const messages = requestMessages(context, Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' as const : 'user' as const, content: `turn ${i}` })), ' 问题 ');
assert.equal(messages.length, 10);
assert.equal(messages[0].role, 'system');
assert.equal(messages[9].content, '问题');
assert(!JSON.stringify(messages).includes('PRIVATE_NAME'));
assert(messages[0].content.includes('未提供完整'));
console.log('✓ DeepSeek context: privacy allowlist, 2026/2027 overlays, age and bounded history passed');
