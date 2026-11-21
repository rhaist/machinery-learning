#!/usr/bin/env node
// Lists claims that are past their half-life (and so fading on the site), plus claims never referenced.
// Usage: node scripts/check-claims.mjs [--as-of YYYY-MM-DD] [--strict]
//   --strict exits 1 if any claim is stale (past 2x half-life). Used by the monthly update and CI.
import fs from 'node:fs';
import path from 'node:path';
import { load as parseYaml } from 'js-yaml';

const args = process.argv.slice(2);
const asOfArg = args.includes('--as-of') ? args[args.indexOf('--as-of') + 1] : null;
const today = asOfArg ? new Date(asOfArg + 'T00:00:00Z') : new Date();
const strict = args.includes('--strict');

const iso = d => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));
const claims = parseYaml(fs.readFileSync('src/data/claims.yaml', 'utf8')).map(c => ({ ...c, verified: iso(c.verified) }));
const chapterDir = 'src/content/chapters';
const used = new Set();
for (const f of fs.readdirSync(chapterDir)) {
  for (const m of fs.readFileSync(path.join(chapterDir, f), 'utf8').matchAll(/<Claim id="([^"]+)"/g)) used.add(m[1]);
}
for (const f of fs.readdirSync('src/components')) {
  for (const m of fs.readFileSync(path.join('src/components', f), 'utf8').matchAll(/<Claim id="([^"]+)"/g)) used.add(m[1]);
}

const rows = { stale: [], aging: [], fresh: [], evergreen: [] };
const problems = [];
const ids = new Set();
for (const c of claims) {
  if (ids.has(c.id)) problems.push(`duplicate id: ${c.id}`);
  ids.add(c.id);
  if (c.half_life && !(c.sources && c.sources.length)) problems.push(`time-sensitive claim without sources: ${c.id}`);
  if (c.sources?.length && !c.evidence) problems.push(`claim without an evidence excerpt from its source: ${c.id}`);
  if (c.evidence_src && !(c.sources ?? []).includes(c.evidence_src)) problems.push(`evidence_src is not one of the claim's sources: ${c.id}`);
  const verified = new Date(c.verified + 'T00:00:00Z');
  if (!c.half_life) { rows.evergreen.push(c); continue; }
  const months = (today - verified) / (1000 * 60 * 60 * 24 * 30.44);
  const state = months < c.half_life ? 'fresh' : months < c.half_life * 2 ? 'aging' : 'stale';
  rows[state].push({ ...c, months: months.toFixed(1) });
}
for (const id of used) if (!ids.has(id)) problems.push(`chapter references unknown claim: ${id}`);
// debates: both sides need sources; same freshness rules as claims
const debates = (parseYaml(fs.readFileSync('src/data/debates.yaml', 'utf8'))?.debates ?? []).map(d => ({ ...d, verified: iso(d.verified) }));
for (const d of debates) {
  if (!d.sides || d.sides.length !== 2) problems.push(`debate needs exactly two sides: ${d.id}`);
  for (const sd of d.sides ?? []) if (!(sd.sources && sd.sources.length)) problems.push(`debate side without sources: ${d.id} / ${sd.label}`);
  if (d.half_life) {
    const months = (today - new Date(d.verified + 'T00:00:00Z')) / (1000 * 60 * 60 * 24 * 30.44);
    const state = months < d.half_life ? 'fresh' : months < d.half_life * 2 ? 'aging' : 'stale';
    if (state !== 'fresh') rows[state].push({ ...d, id: 'debate:' + d.id, months: months.toFixed(1) });
  }
}
const unused = claims.filter(c => !used.has(c.id)).map(c => c.id);

const out = [];
out.push(`# Claims freshness report (as of ${today.toISOString().slice(0, 10)})`, '');
out.push(`${claims.length} claims: ${rows.fresh.length} fresh, ${rows.aging.length} aging, ${rows.stale.length} stale, ${rows.evergreen.length} evergreen.`, '');
for (const state of ['stale', 'aging']) {
  if (!rows[state].length) continue;
  out.push(`## ${state === 'stale' ? 'Stale (past 2x half-life): re-verify or rewrite first' : 'Aging (past half-life): re-verify this month'}`, '');
  for (const c of rows[state]) out.push(`- \`${c.id}\`: verified ${c.verified}, ${c.months} months ago, half-life ${c.half_life}`);
  out.push('');
}
if (unused.length) out.push('## Not referenced by any chapter', '', ...unused.map(id => `- \`${id}\``), '');
if (problems.length) out.push('## Problems', '', ...problems.map(p => `- ${p}`), '');
const report = out.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
if (problems.length || (strict && rows.stale.length)) process.exit(1);
