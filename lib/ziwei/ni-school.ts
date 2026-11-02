import type { ZiweiChart } from './types';

/** Explicit course profile; evidence and unresolved details: docs/ni-school-audit.md. */
export const NI_PROFILE = {
  id: 'ni-tianji-v1', lateZishi: 'current-day', leapMonth: 'next-month',
  fourTransformations: 'natal-fixed',
} as const;
const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** 随课安小限表：申子辰戌起、巳酉丑未起、寅午戌辰起、亥卯未丑起。 */
export function niAnnualBranch(yearBranch: number, gender: 'male' | 'female', age: number): number | null {
  if (!Number.isInteger(age) || age < 1 || !Number.isInteger(yearBranch) || yearBranch < 0 || yearBranch > 11) return null;
  const start = [10, 7, 4, 1][yearBranch % 4];
  return mod12(start + (gender === 'male' ? 1 : -1) * (age - 1));
}
export function niFortune(chart: ZiweiChart, view: 'mingpan' | 'daxian' | 'liunian', year: number) {
  const age = Math.trunc(year) - chart.lunarInfo.lunarYear + 1;
  const daXianIndex = chart.daXians.findIndex(dx => age >= dx.startAge && age <= dx.endAge);
  const daXian = chart.daXians[daXianIndex] ?? null;
  const annualBranch = niAnnualBranch(chart.lunarInfo.yearBranch, chart.birthInfo.gender, age);
  const activeBranch = view === 'daxian' ? daXian?.palaceBranch ?? null
    : view === 'liunian' ? annualBranch : chart.mingGongBranch;
  const relatedBranches = activeBranch === null ? [] : view === 'liunian'
    ? [activeBranch, mod12(activeBranch + 6)]
    : [activeBranch, mod12(activeBranch + 4), mod12(activeBranch + 8), mod12(activeBranch + 6)];
  return { year, age, daXianIndex, daXian, annualBranch, activeBranch, relatedBranches };
}
