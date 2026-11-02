import data from './ni-manual-data.json';

export const NI_MANUAL_SOURCE = data.source;
const mod = (n: number) => ((n % 12) + 12) % 12;
type Rows = Record<string, number[]>;

export interface NiLogicalDate {
  yearStem: number; yearBranch: number; month: number; day: number;
  hour: number; ming: number; shen: number; wuxingJu: number;
}

/** Calculation variables, NOT a fabricated lunar calendar date. Day 30 remains 30. */
export function niManualStarPositions(input: NiLogicalDate): Record<string, number> {
  const { yearStem, yearBranch, month, day, hour, ming, shen, wuxingJu } = input;
  if (!Number.isInteger(day) || day < 1 || day > 30 || !Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('安星月／日序无效');
  const ziwei = (data.ziweiByDay as Rows)[String(wuxingJu)]?.[day - 1];
  if (ziwei === undefined) throw new RangeError('五行局无效');
  const positions: Record<string, number> = {};
  for (const [star, offset] of Object.entries({ 紫微: 0, 天机: -1, 太阳: -3, 武曲: -4, 天同: -5, 廉贞: -8 })) positions[star] = mod(ziwei + offset);
  const tianfu = mod(4 - ziwei);
  for (const [star, offset] of Object.entries({ 天府: 0, 太阴: 1, 贪狼: 2, 巨门: 3, 天相: 4, 天梁: 5, 七杀: 6, 破军: 10 })) positions[star] = mod(tianfu + offset);
  for (const [star, row] of Object.entries(data.monthly as Rows)) positions[star] = row[month - 1];
  for (const [star, row] of Object.entries(data.yearStem as Rows)) positions[star] = row[yearStem];
  for (const [star, row] of Object.entries(data.yearBranch as Rows)) positions[star] = row[yearBranch];
  for (const [star, row] of Object.entries(data.hour as Rows)) positions[star] = row[hour];
  positions['三台'] = mod(positions['左辅'] + day - 1);
  positions['八座'] = mod(positions['右弼'] - day + 1);
  positions['恩光'] = mod(positions['文昌'] + day - 2);
  positions['天贵'] = mod(positions['文曲'] + day - 2);
  positions['火星'] = mod([2, 3, 1, 9][yearBranch % 4] + hour);
  positions['铃星'] = mod((yearBranch % 4 === 2 ? 3 : 10) + hour);
  positions['天才'] = mod(ming + yearBranch);
  positions['天寿'] = mod(shen + yearBranch);
  positions['天伤'] = mod(ming + 5);
  positions['天使'] = mod(ming + 7);
  // The manual lists an unordered pair. Selecting its primary branch and the
  // upstream name 副截 are software conventions, not separately verified teaching.
  positions['截空'] = data.jiekongByStem[yearStem];
  positions['副截'] = positions['截空'] ^ 1;
  return positions;
}

export function niManualBrightness(star: string, branch: number): string | undefined {
  return (data.brightness as Record<string, (string | null)[]>)[star]?.[branch] ?? undefined;
}

export function niStarProvenance(star: string, branch: number) {
  let page = star in data.monthly ? 19 : star in data.yearStem ? 19 : star in data.yearBranch ? 20 : star in data.hour ? 18 : 0;
  if (['紫微', '天机', '太阳', '武曲', '天同', '廉贞'].includes(star)) page = 17;
  if (['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军', '火星', '铃星'].includes(star)) page = 18;
  if (['三台', '八座', '恩光', '天贵'].includes(star)) page = 19;
  if (['天才', '天寿', '截空'].includes(star)) page = 20;
  if (['天伤', '天使'].includes(star)) page = 21;
  const xunkongPair = ['旬空', '副旬'].includes(star);
  const jiekongPair = ['截空', '副截'].includes(star);
  if (xunkongPair) page = 21;
  if (jiekongPair) page = 20;
  const conflict = data.brightnessConflicts.find(c => c.star === star && c.branch === branch);
  return {
    placement: jiekongPair ? '教材只列截空两宫；主／副名称与选位为软件推导约定，未取得直接课程依据' : xunkongPair ? '教材给出旬空两宫；主／副名称分配沿用上游，不冒充教材原名' : page ? '教材表格口径' : '上游扩展／待课程核实',
    placementUrl: page ? `${data.source.url}#page=${page}` : 'https://github.com/Renhuai123/ziwei-doushu/tree/495b79ecb3524b20b2edc026067d7d0b0f407319/lib/ziwei',
    page: page || null,
    brightness: conflict ? `教材同格同时列${conflict.values.join('／')}，暂沿用上游参考` : niManualBrightness(star, branch) ? '教材庙旺表；与部分例图存在异文' : '上游参考；未取得明确教材亮度',
    brightnessUrl: conflict || niManualBrightness(star, branch) ? `${data.source.url}#page=24` : 'https://github.com/Renhuai123/ziwei-doushu/tree/495b79ecb3524b20b2edc026067d7d0b0f407319/lib/ziwei',
  };
}
