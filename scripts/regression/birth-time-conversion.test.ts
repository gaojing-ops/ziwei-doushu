import assert from 'node:assert/strict';
import type { BirthFormState } from '../../components/BirthForm';
import { generateChart } from '../../lib/ziwei/algorithm';
import {
  calculateFormSolarTime, formToBirthInfo, formToSearchParams, searchParamsToForm,
} from '../../lib/ziwei/share';
import { resolveZiweiDayOffset } from '../../lib/ziwei/true-solar-time';

const base: BirthFormState = {
  name: '', year: '2000', month: '1', day: '31', clockHour: '23', clockMinute: '30',
  unknownTime: false, province: '', city: '', longitude: 120, gender: 'male',
};

// Expected dates/branches are fixed fixtures, including leap days and both sides of midnight.
const cases: [string, Partial<BirthFormState>, number[]][] = [
  ['late Zi stays on date', {}, [2000, 1, 31, 0]],
  ['before late Zi', { clockHour: '22', clockMinute: '59' }, [2000, 1, 31, 11]],
  ['late Zi boundary', { clockMinute: '0' }, [2000, 1, 31, 0]],
  ['early Zi', { clockHour: '0' }, [2000, 1, 31, 0]],
  ['after early Zi', { clockHour: '1', clockMinute: '0' }, [2000, 1, 31, 1]],
  ['before leap day', { month: '2', day: '28' }, [2000, 2, 28, 0]],
  ['leap day', { month: '2', day: '29' }, [2000, 2, 29, 0]],
  ['ordinary February', { year: '2001', month: '2', day: '28' }, [2001, 2, 28, 0]],
  ['year end', { month: '12', day: '31' }, [2000, 12, 31, 0]],
  ['western evening stays on input day', { province: '新疆', useTrueSolarTime: true, longitude: 87.6 }, [2000, 1, 31, 11]],
  ['western midnight shifts to preceding day', { province: '新疆', useTrueSolarTime: true, longitude: 87.6, clockHour: '0' }, [2000, 1, 30, 11]],
  ['preceding solar day late Zi stays on solar day', { province: '新疆', useTrueSolarTime: true, longitude: 87.6, clockHour: '1' }, [2000, 1, 30, 0]],
  ['eastern correction enters late Zi', { province: '黑龙江', useTrueSolarTime: true, longitude: 134, clockHour: '22', clockMinute: '40' }, [2000, 1, 31, 0]],
  ['eastern correction enters next solar day', { province: '黑龙江', useTrueSolarTime: true, longitude: 134, clockMinute: '50' }, [2000, 2, 1, 0]],
  ['equation of time crosses branch boundary', { month: '11', day: '2', province: '测试地点', useTrueSolarTime: true, clockHour: '12', clockMinute: '50' }, [2000, 11, 2, 7]],
];

function fields(info: ReturnType<typeof formToBirthInfo>) {
  return [info.year, info.month, info.day, info.hour];
}

// Conversion must not depend on the operating system timezone.
const previousTZ = process.env.TZ;
try {
  for (const tz of ['UTC', 'Asia/Shanghai', 'America/New_York']) {
    process.env.TZ = tz;
    for (const [name, changes, expected] of cases) {
      const form = { ...base, ...changes };
      const before = { ...form };
      const info = formToBirthInfo(form);
      assert.deepEqual(fields(info), expected, `${tz}: ${name}`);
      assert.deepEqual(form, before, 'original form must stay unchanged');
      assert.deepEqual(info.origInput, {
        year: Number(form.year), month: Number(form.month), day: Number(form.day),
        clockHour: Number(form.clockHour), clockMinute: Number(form.clockMinute),
      });
      assert.equal(calculateFormSolarTime(form).branch, info.hour, 'preview and submission agree');
      const restored = { ...base, ...searchParamsToForm(formToSearchParams(form)) };
      assert.deepEqual(formToBirthInfo(restored), info, 'share round trip must preserve conversion');
    }
  }
} finally {
  if (previousTZ === undefined) delete process.env.TZ;
  else process.env.TZ = previousTZ;
}

for (const rule of ['current-day', 'all-current', 'day-cur-time-next'] as const) {
  assert.deepEqual(fields(formToBirthInfo(base, rule)), [2000, 1, 31, 0]);
  assert.deepEqual(fields(formToBirthInfo({ ...base, province: '新疆', useTrueSolarTime: true, longitude: 87.6, clockHour: '1' }, rule)), [2000, 1, 30, 0]);
}
assert.equal(resolveZiweiDayOffset({ dayOffset: 1, normalizedMinutes: 1410, branch: 0 }), 2);
assert.deepEqual(fields(formToBirthInfo({ ...base, unknownTime: true })), [2000, 1, 31, 0]);
assert.equal(formToBirthInfo({ ...base, unknownTime: true }).origInput, undefined);

for (const invalid of [
  { month: '2', day: '30' }, { year: '2001', month: '2', day: '29' },
  { clockHour: '24' }, { clockHour: '' }, { clockMinute: '60' },
  { province: '测试地点', longitude: Number.NaN },
]) {
  assert.throws(() => formToBirthInfo({ ...base, ...invalid }), RangeError);
}

// The engine receives the resolved date once and agrees with an explicit reference input.
const resolved = generateChart(formToBirthInfo(base));
const reference = generateChart({ year: 2000, month: 1, day: 31, hour: 0, gender: 'male' });
assert.deepEqual(resolved.palaces, reference.palaces);
assert.deepEqual(resolved.lunarInfo, reference.lunarInfo);
assert.deepEqual(fields(formToBirthInfo(base, 'next-day')), [2000, 2, 1, 0], 'legacy strategy is explicit only');
assert.deepEqual(fields(formToBirthInfo({ ...base, province: '新疆', longitude: 87.6 })), [2000, 1, 31, 0], 'location alone does not change clock');
console.log(`✓ birth time: ${cases.length} boundary fixtures × 3 timezones, sharing, validation and engine integration passed`);
