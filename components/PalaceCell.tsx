'use client';
import { motion } from 'framer-motion';
import type { Palace, Star } from '@/lib/ziwei/types';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import clsx from 'clsx';

interface PalaceCellProps {
  palace: Palace;
  onClick?: () => void;
  onStarClick?: (star: Star) => void;
  isSelected?: boolean;
  isSanFang?: boolean;
  delay?: number;
  overlayStarSiHua?: Record<string, string>;
  overlayLabel?: string;
  onSiHuaClick?: (starName: string, siHua: string) => void;
}

function SiHuaBadge({ siHua, overlay, label, onClick }: {
  siHua: string;
  overlay?: boolean;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      aria-label={`${overlay ? (label === '年' ? '流年' : '大限') : '生年'}化${siHua}`}
      className={clsx('sihua-badge', overlay && 'sihua-overlay')}
      data-sihua={siHua}
      onClick={onClick}
    >
      {overlay && label && <span>{label}</span>}{siHua}
    </span>
  );
}

export default function PalaceCell({
  palace, onClick, onStarClick, isSelected, isSanFang, delay = 0,
  overlayStarSiHua, overlayLabel, onSiHuaClick,
}: PalaceCellProps) {
  const { branch, stem, name, stars, daXianAge, isCurrentDaXian, isMingGong, isShenGong } = palace;
  const ganzhi = `${STEMS[stem]}${BRANCHES[branch]}`;
  const majorStars = stars.filter(star => star.type === 'major');
  const otherStars = stars.filter(star => star.type !== 'major');

  const renderStar = (star: Star) => (
    <div key={star.name} className={clsx('palace-star', `star-${star.type}`)}
      onClick={onStarClick && star.type === 'major' ? event => {
        event.stopPropagation();
        onStarClick(star);
      } : undefined}
    >
      <span className="palace-star-name">{star.name}</span>
      {star.siHua && <SiHuaBadge siHua={star.siHua} />}
      {overlayStarSiHua?.[star.name] && (
        <SiHuaBadge siHua={overlayStarSiHua[star.name]} overlay label={overlayLabel}
          onClick={onSiHuaClick ? event => {
            event.stopPropagation();
            onSiHuaClick(star.name, overlayStarSiHua[star.name]);
          } : undefined}
        />
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
      role="button"
      tabIndex={0}
      aria-label={`${name} ${ganzhi}`}
      aria-pressed={!!isSelected}
      onClick={onClick}
      onKeyDown={event => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={clsx('chart-palace-cell', isSelected && 'palace-selected', isSanFang && 'palace-sanfang', isCurrentDaXian && 'palace-current-daxian')}
    >
      <div className="palace-header">
        <span className={clsx('palace-name', isMingGong && 'palace-ming-name')}>{name}</span>
        {isMingGong && <span className="palace-marker">命</span>}
        {isShenGong && <span className="palace-marker palace-body-marker">身</span>}
      </div>
      <div className="palace-age">{daXianAge ? `${daXianAge[0]}–${daXianAge[1]}岁` : '—'}</div>
      <div className="palace-ganzhi">{ganzhi}</div>
      <div className="palace-major-stars">
        {majorStars.length ? majorStars.map(renderStar) : <span className="palace-empty">空宫</span>}
      </div>
      <div className="palace-other-stars">{otherStars.map(renderStar)}</div>
    </motion.div>
  );
}
