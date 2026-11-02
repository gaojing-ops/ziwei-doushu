import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { chartForAi, requestMessages } from '../../mobile/deepseek/prompt';
import { retrieveTeaching } from '../../mobile/deepseek/teaching';
const chart = generateChart({ year: 2000, month: 2, day: 1, hour: 0, gender: 'male', name: 'PRIVATE_NAME', city: 'PRIVATE_CITY', province: 'PRIVATE_PROVINCE', longitude: 123.456,
  origInput: { year: 2000, month: 1, day: 31, clockHour: 23, clockMinute: 30 } });
const context = { chart, selectedPalace: chart.palaces.find(p => p.name === '命宫')!, view: 'liunian' as const, liunianYear: 2026 };
const compact = chartForAi(context);
for (const value of ['PRIVATE_NAME', 'PRIVATE_CITY', 'PRIVATE_PROVINCE', '123.456', 'origInput', 'birthInfo', '2000-02-01', 'clockHour', 'lunarYear', 'overlaySiHua']) assert(!JSON.stringify(compact).includes(value), value);
assert.equal(compact.palaces.length, 12);
const next = chartForAi({ ...context, liunianYear: 2027 });
assert.deepEqual(compact.palaces, next.palaces, '星曜、生年四化不随流年重排');
assert.notEqual(compact.annualBranch, next.annualBranch);
assert.equal(next.nominalAge, 2027 - chart.lunarInfo.lunarYear + 1);
assert.equal(compact.profile.fourTransformations, 'natal-fixed');
const messages = requestMessages(context, Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' as const : 'user' as const, content: `turn ${i}`, privateExtra: 'MUST_NOT_LEAK' })), ' 问题 ');
assert.equal(messages.length, 10);
assert.equal(messages[9].content, '问题');
assert(!JSON.stringify(messages).includes('PRIVATE_NAME'));
assert(!JSON.stringify(messages).includes('MUST_NOT_LEAK'));
assert(messages[0].content.includes('现有教学依据不足'));
assert(messages[0].content.includes('teachingEvidence'));
const evidence = retrieveTeaching(context, '事业');
assert(evidence.length >= 3 && evidence.length <= 8);
for (const e of evidence) { assert(messages[0].content.includes('TJ-')); assert(/^https:\/\/www.bilibili.com\/video\//.test(e.url)); }
assert(messages[0].content.length < 40000, '完整语料不能直接塞进提示词');
console.log('✓ AI privacy, fixed natal transformations, course retrieval, missing-evidence policy and bounded history passed');
