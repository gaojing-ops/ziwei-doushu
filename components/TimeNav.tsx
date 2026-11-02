'use client';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { BRANCHES } from '@/lib/ziwei/constants';
import { niFortune } from '@/lib/ziwei/ni-school';
export type TimeView = 'mingpan' | 'daxian' | 'liunian';
interface TimeNavProps {
  chart: ZiweiChart; view: TimeView; liunianYear: number;
  onViewChange: (view: TimeView) => void; onYearChange: (year: number) => void;
}
export default function TimeNav({ chart, view, liunianYear, onViewChange, onYearChange }: TimeNavProps) {
  const f = niFortune(chart, view, liunianYear);
  const changeYear = (delta: number) => {
    onYearChange(liunianYear + delta);
    if (view === 'mingpan') onViewChange('liunian');
  };
  return <nav aria-label="运限切换" className="time-nav">
    <div className="time-nav-tabs" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
      {([['mingpan', '本命'], ['daxian', '大限'], ['liunian', '流年']] as const).map(([value, label]) =>
        <button key={value} aria-pressed={view === value} onClick={() => onViewChange(value)} className="time-nav-tab"
          style={{ color: view === value ? 'var(--t-gold)' : 'var(--t-faint)', background: view === value ? 'rgba(212,168,67,0.12)' : 'transparent' }}>{label}</button>)}
    </div>
    <div className="time-nav-context">
      <span>{view === 'mingpan' ? '本命四化固定' : `${liunianYear} 农历流年 · 虚岁 ${f.age}`}</span>
      <div className="time-year-controls">
        <button aria-label="上一流年" onClick={() => changeYear(-1)} className="time-year-arrow">‹</button>
        <button className="time-year-value" onClick={() => onViewChange('liunian')}>{liunianYear}年</button>
        <button aria-label="下一流年" onClick={() => changeYear(1)} className="time-year-arrow">›</button>
      </div>
    </div>
    <p className="time-overlay-summary" aria-label="倪师行限依据">
      {view === 'mingpan' ? '倪师口径：星曜与生年四化固定，本命看三方四正。'
        : view === 'daxian' ? f.daXian ? `所选大限 ${f.daXian.startAge}–${f.daXian.endAge}岁 · ${BRANCHES[f.daXian.palaceBranch]}宫（本命${f.daXian.palaceName}） · 看三方四正，四化不重算。` : '所选年份未进入已排出的十年大限，不能套用当前大限。'
        : f.annualBranch === null ? '所选年份尚未出生。' : `小流年在${BRANCHES[f.annualBranch]}宫 · 男顺女逆 · 以十年大限为主，小流年看本宫和对宫，四化不重算。`}
    </p>
  </nav>;
}
