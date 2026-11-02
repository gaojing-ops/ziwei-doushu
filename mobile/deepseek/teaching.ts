import index from '../../docs/tianji-ziwei/mobile-index.generated.json';
import { niFortune } from '../../lib/ziwei/ni-school';
import { BRANCHES } from '../../lib/ziwei/constants';
import type { ChartAiContext } from './prompt';

export type TeachingEvidence = typeof index.entries[number];
const at = (part: number, time: string) => index.entries.find(e => e.part === part && e.time === time)!;

/** Deterministic local retrieval. The complete corpus never goes to the provider. */
export function retrieveTeaching(context: ChartAiContext, question: string): TeachingEvidence[] {
  const f = niFortune(context.chart, context.view, context.liunianYear);
  const focus = context.selectedPalace ?? context.chart.palaces.find(p => p.branch === f.activeBranch);
  const relevant = context.chart.palaces.filter(p => p === focus || f.relatedBranches.includes(p.branch));
  const starNames = [...new Set(relevant.flatMap(p => p.stars.map(s => s.name)))];
  const terms = ['命宫', '夫妻', '官禄', '事业', '财帛', '财运', '田宅', '性格', '感情', '四化', '三方四正', '空宫']
    .filter(t => question.includes(t));
  const foundation = [at(5, '00:01:17'), at(7, '00:37:58'),
    at(7, context.view === 'liunian' ? '00:38:48' : '00:37:28')];
  // Explicitly preserve the course's location condition for its first worked example.
  if (relevant.some(p => p.branch === 6 && p.stars.some(s => s.name === '贪狼'))) foundation.push(at(9, '00:03:14'));
  const scored = index.entries.map(e => ({ e, score:
    starNames.reduce((n, star) => n + (e.title.includes(star) ? 6 : e.quote.includes(star) ? 1 : 0), 0)
    + terms.reduce((n, term) => n + (e.title.includes(term) ? 5 : 0), 0)
    + (focus && e.title.includes(focus.name) ? 8 : 0)
    + (focus && e.title.includes(`${BRANCHES[focus.branch]}宫`) ? 4 : 0)
  })).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.e.id.localeCompare(b.e.id));
  const result = foundation.filter(Boolean);
  for (const { e } of scored) {
    if (result.length >= 8) break;
    if (!result.some(x => x.id === e.id)) result.push(e);
  }
  return result;
}

/** Reject invented reference IDs, and visibly flag uncited/model-only conclusions. */
export function evidenceWarning(text: string, evidence: TeachingEvidence[]): string {
  const cited = [...text.matchAll(/\bTJ-\d{4}\b/g)].map(m => m[0]);
  if (cited.some(id => !evidence.some(e => e.id === id))) return '回答含未提供的教学编号，依据校验未通过；请核对下方原文，不采用该项结论。';
  if (!cited.length) return '回答没有引用本次教学编号，尚不能核对是否符合课程；请参照下方依据。';
  // A real ID must not make an invented direct quotation look authentic.
  const normalize = (s: string) => s.replace(/[\s，。！？、：；“”「」『』,.!?;:'"（）()]/g, '');
  for (const match of text.matchAll(/[「『“"]([^」』”"\n]{4,})[」』”"]/g)) {
    const before = text.slice(Math.max(0, (match.index ?? 0) - 35), match.index);
    const after = text.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 35);
    if (!/倪|老师|原话|课程|引文|教学/.test(before) && !/TJ-\d{4}/.test(after)) continue;
    const quotation = normalize(match[1]);
    if (!evidence.some(e => normalize(e.quote).includes(quotation))) return '回答中的直接引文与本次课程原文不符，原文校验未通过；不能视为倪老师原话。';
  }
  return '';
}
