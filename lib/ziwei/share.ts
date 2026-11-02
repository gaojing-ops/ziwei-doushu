import type { BirthFormState } from '@/components/BirthForm';
import type { BirthInfo } from './types';
import {
  calculateTrueSolarTime, isValidGregorianDate, resolveZiweiDayOffset,
  shiftGregorianDate, type LateZishiRule,
} from './true-solar-time';

/** 表单预览与提交共用；未选出生地时按原始北京时间，不猜测当地经度。 */
export function calculateFormSolarTime(form: BirthFormState) {
  return calculateTrueSolarTime({
    year: Number(form.year), month: Number(form.month), day: Number(form.day),
    clockHour: Number(form.clockHour), clockMinute: Number(form.clockMinute),
    longitude: form.province ? form.longitude : undefined,
  });
}

/** 先算地方真太阳日期与时辰，再按晚子时规则换日；所有起盘入口只转换一次。 */
export function formToBirthInfo(form: BirthFormState, lateZishi: LateZishiRule = 'next-day'): BirthInfo {
  const inputDate = { year: Number(form.year), month: Number(form.month), day: Number(form.day) };
  if (!isValidGregorianDate(inputDate.year, inputDate.month, inputDate.day)) {
    throw new RangeError('出生日期不存在');
  }
  const clockHour = Number(form.clockHour);
  const clockMinute = Number(form.clockMinute);
  if (!form.unknownTime) {
    if (form.clockHour === '' || form.clockMinute === '' ||
      !Number.isInteger(clockHour) || clockHour < 0 || clockHour > 23 ||
      !Number.isInteger(clockMinute) || clockMinute < 0 || clockMinute > 59) {
      throw new RangeError('出生时间必须是有效的小时和分钟');
    }
    if (form.province && (!Number.isFinite(form.longitude) || Math.abs(form.longitude) > 180)) {
      throw new RangeError('出生地经度无效');
    }
  }
  let chartDate = inputDate;
  let hour = 0;
  if (!form.unknownTime) {
    const solar = calculateFormSolarTime(form);
    chartDate = shiftGregorianDate(inputDate, resolveZiweiDayOffset(solar, lateZishi));
    hour = solar.branch;
  }
  return {
    ...chartDate,
    hour,
    gender: form.gender,
    name: form.name || undefined,
    province: form.province || undefined,
    city: form.city || undefined,
    longitude: form.province ? form.longitude : undefined,
    origInput: form.unknownTime ? undefined : { ...inputDate, clockHour, clockMinute },
  };
}

/** BirthFormState → URLSearchParams（用于分享链接） */
export function formToSearchParams(form: BirthFormState): URLSearchParams {
  const p = new URLSearchParams();
  if (form.name) p.set('n', form.name);
  p.set('y', form.year);
  p.set('m', form.month);
  p.set('d', form.day);
  if (form.unknownTime) {
    p.set('u', '1');
  } else {
    p.set('h', form.clockHour);
    p.set('mi', form.clockMinute);
  }
  if (form.province) p.set('p', form.province);
  if (form.city) p.set('c', form.city);
  if (form.longitude && form.longitude !== 120) p.set('lo', String(form.longitude));
  p.set('g', form.gender === 'male' ? 'm' : 'f');
  return p;
}

/** URLSearchParams → Partial<BirthFormState>，不完整时返回 null */
export function searchParamsToForm(params: URLSearchParams): Partial<BirthFormState> | null {
  const year = params.get('y');
  const month = params.get('m');
  const day = params.get('d');
  if (!year || !month || !day) return null;
  return {
    name: params.get('n') || '',
    year,
    month,
    day,
    unknownTime: params.get('u') === '1',
    clockHour: params.get('h') || '8',
    clockMinute: params.get('mi') || '0',
    province: params.get('p') || '',
    city: params.get('c') || '',
    longitude: parseFloat(params.get('lo') || '120'),
    gender: params.get('g') === 'f' ? 'female' : 'male',
  };
}
