import fs from 'node:fs';
import crypto from 'node:crypto';
const input = new URL('../docs/tianji-ziwei/entries.jsonl', import.meta.url);
// Canonical LF text makes provenance identical on Windows and Linux checkouts.
const raw = fs.readFileSync(input, 'utf8').replace(/\r\n/g, '\n');
const seen = new Set();
const entries = raw.trim().split('\n').map(line => JSON.parse(line))
  .filter(e => !/勘误|疑误|存疑/.test(e.note || ''))
  .filter(e => { const key = `${e.bvid}:${e.part}:${e.t_hms}:${e.quote}`; if (seen.has(key)) return false; seen.add(key); return true; })
  .map((e, i) => ({ id: `TJ-${String(i + 1).padStart(4, '0')}`, title: `${e.h2} · ${e.h3}`,
    quote: e.quote, part: e.part, time: e.t_hms, note: e.note || '',
    url: `https://www.bilibili.com/video/${e.bvid}?p=${e.part}&t=${e.t_hms.split(':').reduce((n, v) => n * 60 + Number(v), 0)}` }));
fs.writeFileSync(new URL('../docs/tianji-ziwei/mobile-index.generated.json', import.meta.url), JSON.stringify({
  source: 'Renhuai123/nihai-tianji-corpus (upstream snapshot 462faa4), local entries.jsonl',
  license: 'CC-BY-NC-SA-4.0', sourceSha256: crypto.createHash('sha256').update(raw).digest('hex'), entries,
}, null, 2) + '\n');
console.log(`Indexed ${entries.length} deduplicated teaching excerpts; disputed/corrected passages excluded.`);
