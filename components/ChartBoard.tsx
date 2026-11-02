'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import PalaceCell from './PalaceCell';
import { type TimeView } from './TimeNav';
import { niFortune } from '@/lib/ziwei/ni-school';

interface ChartBoardProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  onStarSelect?: (star: Star, palace: Palace) => void;
  onPalaceSelect?: (palace: Palace) => void;
  onSiHuaClick?: (starName: string, siHua: string, view: TimeView) => void;
}

const BRANCH_GRID_POS: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

// 每个地支宫位在网格中的中心坐标（百分比）
const BRANCH_SVG_POS: Record<number, [number, number]> = {
  5: [12.5, 12.5], 6: [37.5, 12.5], 7: [62.5, 12.5], 8: [87.5, 12.5],
  4: [12.5, 37.5],                                      9: [87.5, 37.5],
  3: [12.5, 62.5],                                     10: [87.5, 62.5],
  2: [12.5, 87.5], 1: [37.5, 87.5], 0: [62.5, 87.5], 11: [87.5, 87.5],
};

// 绕盘面顺时针排列（用于三方四正四边形排序）
const CLOCKWISE_INDEX: Record<number, number> = {
  5: 0, 6: 1, 7: 2, 8: 3,
  9: 4, 10: 5,
  11: 6, 0: 7, 1: 8, 2: 9,
  3: 10, 4: 11,
};

function sortClockwise(branches: number[]): number[] {
  return [...branches].sort((a, b) => CLOCKWISE_INDEX[a] - CLOCKWISE_INDEX[b]);
}

/** 三方四正：本宫 + 对宫 + 两个三合宫 */
function getSanFangSiZheng(branch: number): [number, number, number, number] {
  return [
    branch,
    (branch + 6) % 12,   // 对宫
    (branch + 4) % 12,   // 三合1
    (branch + 8) % 12,   // 三合2
  ];
}

const ANIMATION_ORDER = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4];

export default function ChartBoard({ chart, view: timeView, liunianYear, onStarSelect, onPalaceSelect, onSiHuaClick }: ChartBoardProps) {
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

  const palaceMap: Record<number, Palace> = {};
  chart.palaces.forEach(p => { palaceMap[p.branch] = p; });

  const fortune = niFortune(chart, timeView, liunianYear);

  const handlePalaceClick = (branch: number) => {
    setSelectedBranch(branch);
    const palace = palaceMap[branch];
    if (palace) onPalaceSelect?.(palace);
  };

  // 三方四正
  const focus = selectedBranch ?? fortune.activeBranch;
  const sanFangBranches = focus === null ? null : timeView === 'liunian'
    ? [focus, (focus + 6) % 12] : getSanFangSiZheng(focus);
  const sanFangSet = sanFangBranches ? new Set(sanFangBranches) : null;

  return (
    <section className="chart-board" aria-label="十二宫命盘">
      {/* 命盘标题 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-board-heading"
      >
        <div className="text-[10px] tracking-[0.5em] uppercase mb-1" style={{ color: 'var(--t-faint)' }}>
          Zi Wei Dou Shu
        </div>
        <h2 className="text-sm tracking-[0.25em] font-medium" style={{ color: 'var(--t-gold)' }}>
          {chart.birthInfo.name ? `${chart.birthInfo.name} · ` : ''}紫微斗数命盘
        </h2>
      </motion.div>

      {/* 4x4 命盘网格（含 SVG 叠加层） */}
      <div
        className="chart-grid"
        style={{
          gap: '1px',
          background: 'var(--t-border)',
          border: '1px solid var(--t-border)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
        }}
      >
        {ANIMATION_ORDER.map((branch, i) => {
          const [row, col] = BRANCH_GRID_POS[branch];
          const palace = palaceMap[branch];
          if (!palace) return null;
          return (
            <div key={branch} className="chart-palace-slot" style={{ gridRow: row, gridColumn: col, background: 'var(--t-bg)' }}>
              <PalaceCell
                palace={{ ...palace, isCurrentDaXian: fortune.daXian?.palaceBranch === branch }}
                onClick={() => handlePalaceClick(branch)}
                onStarClick={onStarSelect ? (star) => onStarSelect(star, palace) : undefined}
                isSelected={selectedBranch === branch}
                isSanFang={!!(sanFangSet?.has(branch) && selectedBranch !== branch)}
                delay={i * 0.04}
                fortuneLabel={timeView !== 'mingpan' && fortune.activeBranch === branch ? timeView === 'daxian' ? '所选大限' : '小流年' : undefined}
              />
            </div>
          );
        })}

        {/* 中央信息区 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="chart-center"
          style={{ gridRow: '2 / 4', gridColumn: '2 / 4', background: 'var(--t-bg)' }}
        >
          <div className="chart-center-symbol" aria-hidden="true">
            ☯
          </div>

          <div className="text-center space-y-1">
            <div className="chart-center-title">{timeView === 'liunian' ? `${liunianYear} 小流年` : timeView === 'daxian' ? '大限行宫' : '本命命盘'}</div>
            <div className="chart-center-caption">生年四化固定</div>
            <div className="chart-center-facts">
              <div>命宫 <span style={{ color: 'var(--t-gold)', opacity: 0.7 }}>{BRANCHES[chart.mingGongBranch]}</span></div>
              <div>身宫 <span className="text-sky-500/70">{BRANCHES[chart.shenGongBranch]}</span></div>
              <div style={{ color: 'var(--t-gold)' }}>{chart.wuxingJuName}</div>
            </div>
          </div>

          {fortune.daXian && (() => {
            const dx = fortune.daXian;
            return (
              <div className="border border-purple-500/30 rounded-lg px-3 py-1.5 text-center"
                style={{ background: 'rgba(147,51,234,0.06)' }}>
                <div className="chart-center-caption">{liunianYear} 所属大限</div>
                <div className="chart-center-decade">{dx.startAge}–{dx.endAge}岁</div>
                <div className="chart-center-caption">{dx.palaceName}</div>
              </div>
            );
          })()}

          <div className="chart-center-lunar">
            农历 {chart.lunarInfo.lunarYear}年<br />{chart.lunarInfo.isLeapMonth ? '闰' : ''}{chart.lunarInfo.lunarMonth}月{chart.lunarInfo.lunarDay}日
          </div>
          <p className="chart-center-hint">{selectedBranch !== null ? `已选${palaceMap[selectedBranch].name} · 详情见下方` : timeView === 'liunian' ? '点按宫位\n查看本宫与对宫' : '点按宫位\n查看星曜与三方四正'}</p>
        </motion.div>

        {/* ── 三方四正 SVG 连线（绝对定位在 grid 内部，受 overflow:hidden 裁切） ── */}
        <AnimatePresence>
          {sanFangBranches !== null && (
            <motion.div
              key={`sf-${selectedBranch}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
              }}
            >
              <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block' }}
              >
                {(() => {
                  const points = sanFangBranches.map(b => BRANCH_SVG_POS[b]);
                  const pairs = points.length === 2 ? [[0, 1]] : [[0, 1], [0, 2], [2, 3], [3, 0]];
                  return <>
                    {pairs.map(([a, b]) => <line key={`${a}-${b}`} x1={`${points[a][0]}%`} y1={`${points[a][1]}%`}
                      x2={`${points[b][0]}%`} y2={`${points[b][1]}%`} stroke="rgba(37,99,235,0.55)" strokeWidth="1.5" strokeDasharray="6,5" />)}
                    {points.map((p, i) => <circle key={i} cx={`${p[0]}%`} cy={`${p[1]}%`} r="3" fill="rgba(37,99,235,0.65)" />)}
                  </>;
                })()}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 图例 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="chart-legend"
      >
        {[
          { h: '化禄', c: 'text-emerald-500 border-emerald-500/30' },
          { h: '化权', c: 'text-blue-500 border-blue-500/30' },
          { h: '化科', c: 'text-yellow-500 border-yellow-500/30' },
          { h: '化忌', c: 'text-red-500 border-red-500/30' },
        ].map(({ h, c }) => (
          <span key={h} className={`border px-1.5 py-0.5 rounded-full font-medium ${c}`}>{h}</span>
        ))}
        <span className="px-1.5 py-0.5 rounded-full" style={{ color: 'var(--t-faint)', border: '1px solid var(--t-border)' }}>
          {timeView === 'liunian' ? '点击宫位看本宫及对宫' : '点击宫位看三方四正'}
        </span>
      </motion.div>

      <section className="palace-detail" aria-label="宫位详情" aria-live="polite">
        {selectedBranch !== null ? (() => {
          const palace = palaceMap[selectedBranch];
          return <>
            <h3>{palace.name} <span>{STEMS[palace.stem]}{BRANCHES[palace.branch]}</span></h3>
            {palace.isEmpty && <p>空宫{palace.borrowedStars?.length ? `，借对宫${palace.borrowedFromName}：${palace.borrowedStars.join('、')}` : ''}</p>}
            <div className="palace-detail-stars">
              {palace.stars.map(star => <span key={star.name} className={`palace-detail-star star-${star.type}`}>
                {star.name}{star.brightnessRaw && <small> {star.brightnessRaw}</small>}
                {star.siHua && <small> · 生年化{star.siHua}</small>}
              </span>)}
            </div>
          </>;
        })() : <><h3>宫位详情</h3><p>点按上方任一宫位，在这里查看完整星曜、亮度和四化。</p></>}
      </section>
    </section>
  );
}
