import assert from 'node:assert/strict';
import { generateChart } from '../../lib/ziwei/algorithm';
import { lunarToSolar, lunarMonthDayCount } from '../../lib/ziwei/lunar-solar';
import cases from '../../docs/ni-manual-cases.json';
import data from '../../lib/ziwei/ni-manual-data.json';
import { niManualBrightness, niStarProvenance } from '../../lib/ziwei/ni-manual';
import { niAnnualBranch } from '../../lib/ziwei/ni-school';

let assertions = 0;
for (const c of cases.cases) {
  const date = lunarToSolar(c.referenceLunar[0], c.referenceLunar[1], c.referenceLunar[2]);
  assert(date, `${c.id} calendar input`);
  const chart = generateChart({ ...date, hour: c.hour, gender: c.gender as 'male' | 'female' });
  assert(!chart.palaces.some(p => p.stars.some(s => s.name === '年解')), '教材年支解神不能再叠一颗同义年解');
  assert.equal(chart.mingGongBranch, c.expected.ming, c.id); assertions++;
  for (const [star, branch] of Object.entries(c.expected.majorStars)) {
    assert.equal(chart.palaces.find(p => p.stars.some(s => s.name === star))?.branch, branch, `${c.id} ${star}`); assertions++;
  }
  const expectedSiHua = Object.fromEntries(Object.entries(data.natalSiHua).map(([kind, row]) => [row[chart.lunarInfo.yearStem], kind]));
  const actualSiHua = Object.fromEntries(chart.palaces.flatMap(p => p.stars).filter(s => s.siHua).map(s => [s.name, s.siHua]));
  assert.deepEqual(actualSiHua, expectedSiHua, `${c.id} 生年四化表`); assertions++;
  const direction = (chart.lunarInfo.yearStem % 2 === 0) === (c.gender === 'male') ? 1 : -1;
  for (const [i, dx] of chart.daXians.entries()) {
    assert.deepEqual([dx.startAge, dx.endAge, dx.palaceBranch], [chart.wuxingJu + i * 10, chart.wuxingJu + i * 10 + 9, ((chart.mingGongBranch + direction * i) % 12 + 12) % 12], `${c.id} 教材大限`); assertions++;
  }
  // Integrate independently transcribed tables through the full calendar/chart pipeline.
  for (const [rows, index] of [[data.monthly, c.referenceLunar[1] - 1], [data.yearStem, chart.lunarInfo.yearStem], [data.yearBranch, chart.lunarInfo.yearBranch], [data.hour, c.hour]] as const) {
    for (const [star, row] of Object.entries(rows)) {
      assert.equal(chart.palaces.find(p => p.stars.some(s => s.name === star))?.branch, row[index], `${c.id} table ${star}`); assertions++;
    }
  }
}

for (let month = 1; month <= 12; month++) for (let hour = 0; hour < 12; hour++) {
  const c = generateChart({ ...lunarToSolar(1961, month, 5)!, hour, gender: 'female' });
  assert.equal(c.mingGongBranch, data.mingByMonth[month - 1][hour]);
  assert.equal(c.shenGongBranch, data.shenByMonth[month - 1][hour]);
  for (const p of c.palaces) {
    const tableColumn = (p.branch + 10) % 12; // 原表从寅至丑排列。
    assert.equal(p.stem, data.palaceStemsByYearGroup[c.lunarInfo.yearStem % 5][tableColumn]);
    for (const star of p.stars) {
      const grade = (data.brightness as Record<string, (string | null)[]>)[star.name]?.[p.branch];
      if (grade) assert.equal(star.brightnessRaw, grade, `${star.name} 教材庙旺表`);
    }
  }
}

// This previously rejected date has 30 actual birth days, not an invented sixth-month 29th.
const edge = generateChart({ year: 1952, month: 7, day: 21, hour: 6, gender: 'female' });
assert.deepEqual(edge.lunarInfo.calendarDate, { year: 1952, month: 5, day: 30, isLeapMonth: true });
assert.equal(edge.lunarInfo.lunarMonth, 6);
assert.equal(edge.lunarInfo.lunarDay, 30);
assert.equal(edge.wuxingJu, 3); // 教材定五行局表：壬年丑命=木三局。
for (const [star, branch] of Object.entries({ 紫微: 11, 三台: 2, 八座: 0, 恩光: 8, 天贵: 2 })) {
  assert.equal(edge.palaces.find(p => p.stars.some(s => s.name === star))?.branch, branch, `30-day boundary ${star}`);
}

let leapBoundaries = 0;
const juCovered = new Set<number>();
for (let year = 1900; year <= 2050; year++) for (let month = 1; month < 12; month++) {
  if (lunarMonthDayCount(year, month, true) !== 30 || lunarMonthDayCount(year, month + 1) !== 29) continue;
  const date = lunarToSolar(year, month, 30, true)!;
  for (const gender of ['male', 'female'] as const) for (let hour = 0; hour < 12; hour++) {
    const c = generateChart({ ...date, hour, gender });
    assert.equal(c.lunarInfo.lunarDay, 30);
    assert.equal(c.birthInfo.day, date.day);
    assert.equal(c.ziweiPos, (data.ziweiByDay as Record<string, number[]>)[String(c.wuxingJu)][29]);
    assert.equal(c.palaces.flatMap(p => p.stars).filter(s => s.type === 'major').length, 14);
    juCovered.add(c.wuxingJu); leapBoundaries++;
  }
}
assert.deepEqual([...juCovered].sort(), [2, 3, 4, 5, 6]);
assert.equal(niManualBrightness('天机', 1), undefined, 'source conflict must not silently choose 庙 or 陷');
assert(niStarProvenance('天机', 1).brightness.includes('同时列'));
assert(niStarProvenance('副截', 1).placement.includes('软件推导'));
for (const [ageIndex, row] of data.annualFirst12.entries()) for (const [column, expected] of row.entries()) {
  const group = [2, 0, 1, 3][Math.floor(column / 2)];
  const gender = column % 2 === 0 ? 'male' : 'female';
  for (let cycle = 0; cycle < 10; cycle++) assert.equal(niAnnualBranch(group, gender, ageIndex + 1 + cycle * 12), expected);
}
console.log(`✓ ${cases.diagrams} textbook diagrams (${cases.distinctInputs} distinct inputs): ${assertions} placements/table integrations; ${leapBoundaries} exceptional leap-day charts covering all five Ju; source conflicts remain explicit`);
