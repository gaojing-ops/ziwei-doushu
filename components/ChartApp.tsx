'use client';
import { useEffect, useState, type ReactNode } from 'react';
import BirthForm, { type BirthFormState } from '@/components/BirthForm';
import ChartBoard from '@/components/ChartBoard';
import InsightPanel from '@/components/InsightPanel';
import TimeNav, { type TimeView } from '@/components/TimeNav';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart, Palace } from '@/lib/ziwei/types';
import '@/app/chart/chart.css';

/**
 * 命盘页 —— 开源版「排盘引擎 Demo」
 *
 * 这是一个最小可运行示例：用本仓库的排盘引擎 generateChart() 配合基础 UI
 * 组件，渲染一张完整紫微命盘 + 基础解读，并支持本命 / 大限 / 流年切换。
 *
 * 说明：线上商业版的完整交互界面（重设计的新 UI、AI 流式解读、合盘、分享
 * 卡片等）不在开源范围内；但排盘内核——安星算法、四化、格局识别、古籍库——
 * 完全开放（见 lib/ziwei/*），可自由二次开发出你自己的界面。
 */
export default function ChartApp({ localOnly = false, renderInsights }: {
  localOnly?: boolean;
  renderInsights?: (context: { chart: ZiweiChart; selectedPalace: Palace | null; view: TimeView; liunianYear: number }) => ReactNode;
}) {
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null);
  const [view, setView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState(() => new Date().getFullYear());
  const [formDraft, setFormDraft] = useState<Partial<BirthFormState>>({});

  useEffect(() => {
    if (!localOnly) return;
    const backToForm = () => { setChart(null); setSelectedPalace(null); };
    window.addEventListener('popstate', backToForm);
    return () => window.removeEventListener('popstate', backToForm);
  }, [localOnly]);

  // ── 未起盘：展示出生信息表单 ──
  if (!chart) {
    return (
      <main className="chart-form-page">
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>紫微斗数排盘</h1>
        <p style={{ color: '#888', marginBottom: 32, fontSize: 14, lineHeight: 1.7 }}>
          输入出生年月日时，开源排盘引擎即时生成命盘。
          <br />
          {localOnly ? '排盘在本机完成；使用 AI 解读时才发送必要的命盘资料。' : '（本页为引擎 Demo，完整商业版界面不在开源范围；排盘内核完全开放。）'}
        </p>
        <BirthForm initialData={formDraft} onFormSave={setFormDraft} onSubmit={(info: BirthInfo) => {
          setChart(generateChart(info));
          if (localOnly) window.history.pushState({ ziweiChart: true }, '', window.location.href);
          setView('mingpan');
          setLiunianYear(new Date().getFullYear());
          setSelectedPalace(null);
        }} />
      </main>
    );
  }

  // ── 已起盘：命盘 + 解读 ──
  return (
    <main className="chart-page">
      <header className="chart-result-header">
        <div>
          <p className="chart-eyebrow">紫微斗数 · 本地排盘</p>
          <h1>命盘总览</h1>
        </div>
      <button
        type="button"
        className="chart-reset"
        onClick={() => {
          setChart(null); setSelectedPalace(null);
          if (localOnly && window.history.state?.ziweiChart) window.history.back();
        }}
      >
        ← 重新起盘
      </button>
      </header>

      {chart.birthInfo.origInput && (
        <p className="chart-birth-summary">
          出生输入：{chart.birthInfo.origInput.year}-{String(chart.birthInfo.origInput.month).padStart(2, '0')}-{String(chart.birthInfo.origInput.day).padStart(2, '0')}
          {' '}{String(chart.birthInfo.origInput.clockHour).padStart(2, '0')}:{String(chart.birthInfo.origInput.clockMinute).padStart(2, '0')}
          {' → '}排盘日期：{chart.birthInfo.year}-{String(chart.birthInfo.month).padStart(2, '0')}-{String(chart.birthInfo.day).padStart(2, '0')}
          （{chart.birthInfo.useTrueSolarTime ? '已启用真太阳时，' : ''}倪师口径：午夜换日、闰月归下月）
        </p>
      )}

      <TimeNav
        chart={chart}
        view={view}
        liunianYear={liunianYear}
        onViewChange={setView}
        onYearChange={setLiunianYear}
      />
      {chart.birthInfo.timeUnknown && <p className="chart-birth-summary">时辰不详：目前按子时试排，不能视为已确定的命盘。</p>}

      <div className="chart-result-layout">
        <ChartBoard chart={chart} view={view} liunianYear={liunianYear} onPalaceSelect={setSelectedPalace} />
        <aside className="chart-insights" aria-label="命理解读">
        {renderInsights ? renderInsights({ chart, selectedPalace, view, liunianYear }) : <InsightPanel chart={chart} selectedPalace={selectedPalace} localOnly={localOnly} />}
        </aside>
      </div>
    </main>
  );
}
