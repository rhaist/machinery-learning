// Fetches every source URL in claims, figures, debates and the reading list.
// Fails on links that are gone (404, 410, DNS or TLS errors, 5xx after a retry).
// 401/403/429 count as warnings: many publishers block automated requests.
// Runs monthly in CI (.github/workflows/links.yml); not part of `npm run check`.
import fs from 'node:fs';
import { load } from 'js-yaml';

const y = f => load(fs.readFileSync('src/data/' + f, 'utf8'));
const urls = new Map();
const add = (u, where) => { if (typeof u === 'string' && /^https?:\/\//.test(u)) urls.set(u, [...(urls.get(u) ?? []), where]); };
for (const c of y('claims.yaml')) (c.sources ?? []).forEach(u => add(u, 'claim:' + c.id));
for (const f of (y('figures.yaml')?.figures ?? [])) (f.sources ?? []).forEach(u => add(u, 'figure:' + f.page));
for (const d of (y('debates.yaml')?.debates ?? [])) for (const s of d.sides ?? []) (s.sources ?? []).forEach(u => add(u, 'debate:' + d.id));
for (const [ch, items] of Object.entries(y('reading.yaml') ?? {})) for (const r of items) add(r.url, 'reading:' + ch);

const UA = 'Mozilla/5.0 (compatible; machinery-learning-linkcheck; +https://machinerylearning.eu/)';
async function probe(u, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,application/pdf,*/*' }, signal: AbortSignal.timeout(25000) });
      r.body?.cancel();
      if (r.status < 500 || i === tries - 1) return r.status;
    } catch (e) { if (i === tries - 1) return 'error: ' + (e.cause?.code ?? e.name); }
    await new Promise(res => setTimeout(res, 3000));
  }
}

const bad = [], soft = [];
const list = [...urls.keys()];
for (let i = 0; i < list.length; i += 8) {
  await Promise.all(list.slice(i, i + 8).map(async u => {
    const st = await probe(u);
    if (typeof st === 'number' && st < 400) return;
    (([401, 403, 429].includes(st)) ? soft : bad).push(`${st}  ${u}  (${urls.get(u).join(', ')})`);
  }));
}
soft.forEach(s => console.warn('warning: ' + s));
bad.forEach(b => console.error('✗ ' + b));
console.log(`${list.length} links checked: ${bad.length} broken, ${soft.length} blocked automated access.`);
process.exit(bad.length ? 1 : 0);
