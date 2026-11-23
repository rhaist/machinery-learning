// Fetches every source URL in claims, figures, debates, the reading list and links in chapters and notes.
// Fails on links that are gone (404, 410, DNS or TLS errors, 5xx after a retry).
// 401/403/429 count as warnings: many publishers block automated requests.
// Links listed in research/links-blocked.yaml are known to do so and were opened in a browser; they are only counted,
// so that a new blocked link stands out.
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
for (const dir of ['src/content/chapters', 'src/content/notes']) for (const f of fs.readdirSync(dir)) for (const m of fs.readFileSync(`${dir}/${f}`, 'utf8').matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) add(m[1], `${dir.split('/').pop()}:${f}`);

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

const known = new Map((load(fs.readFileSync('research/links-blocked.yaml', 'utf8'))?.blocked ?? []).map(e => [e.url, e]));
const bad = [], soft = [], quiet = [], notes = [];
const list = [...urls.keys()];
for (let i = 0; i < list.length; i += 8) {
  await Promise.all(list.slice(i, i + 8).map(async u => {
    const st = await probe(u);
    if (typeof st === 'number' && st < 400) { if (known.has(u)) notes.push(`${u} answers the checker again: remove it from research/links-blocked.yaml`); return; }
    const blocked = [401, 403, 429].includes(st);
    (blocked ? (known.has(u) ? quiet : soft) : bad).push(`${st}  ${u}  (${urls.get(u).join(', ')})`);
  }));
}
// housekeeping for the list of known blocked links
const halfYearAgo = Date.now() - 183 * 864e5;
for (const [u, e] of known) {
  if (!urls.has(u)) notes.push(`${u} is no longer used on the site: remove it from research/links-blocked.yaml`);
  else if (!e.opened || new Date(e.opened).getTime() < halfYearAgo) notes.push(`${u} was last opened in a browser on ${e.opened ? new Date(e.opened).toISOString().slice(0, 10) : 'an unknown date'}: open it again and update the date`);
}
soft.forEach(s => console.warn('warning: ' + s));
notes.forEach(n => console.warn('note: ' + n));
bad.forEach(b => console.error('✗ ' + b));
console.log(`${list.length} links checked: ${bad.length} broken, ${soft.length} newly blocked automated access, ${quiet.length} known to block it (research/links-blocked.yaml).`);
process.exit(bad.length ? 1 : 0);
