// Every specific number in chapter and field-note prose must have a home:
// either a <Claim> (src/data/claims.yaml) or an entry in src/data/figures.yaml
// (kind: source, derived or illustrative). Bare years (1900–2099) are exempt,
// as are names listed under `names` in figures.yaml (for example "Llama 3").
// Fails on uncovered numbers and on ledger entries whose text no longer exists.
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';

const ledger = load(fs.readFileSync('src/data/figures.yaml', 'utf8')) ?? {};
const entries = ledger.figures ?? [];
const names = (ledger.names ?? []).sort((a, b) => b.length - a.length);
const problems = [];
const warn = [];

const files = [
  ...fs.readdirSync('src/content/chapters').filter(f => f.endsWith('.mdx')).map(f => ['chapters/' + f.replace(/\.mdx$/, ''), path.join('src/content/chapters', f)]),
  ...fs.readdirSync('src/content/notes').filter(f => f.endsWith('.md')).map(f => ['notes/' + f.replace(/\.md$/, ''), path.join('src/content/notes', f)]),
];

/** Reader-visible text of an MDX/MD file, with attribute text of quizzes and notes kept. */
function prose(src) {
  let s = src.replace(/^---[\s\S]*?\n---\n/, '');
  s = s.replace(/^import .*$/gm, '');
  s = s.replace(/<(Quiz|Note|Engineer)\b([^>]*?)\/?>/g, (_m, _t, attrs) =>
    ' ' + [...attrs.matchAll(/(?:q|title|explain)="([^"]*)"|options=\{\[([^\]]*)\]\}/g)].map(m => (m[1] ?? m[2] ?? '').replace(/","/g, ' / ')).join(' ') + ' ');
  s = s.replace(/<\/?Term\b[^>]*>/g, '');                // inline terms: keep their text in place
  s = s.replace(/<\/?[A-Za-z][^>]*>/g, ' ');           // other tags (Claim, Debate, figures)
  s = s.replace(/^#+\s*\d+\.\s/gm, ' ');               // numbered headings
  s = s.replace(/\]\([^)]*\)/g, ']');                  // link targets
  s = s.replace(/^\s*\d+\.\s/gm, ' ');                 // numbered-list markers
  return s.replace(/\s+/g, ' ');
}

const NUM = /CVE-\d{4}-\d+|(?<![\w/.\-])\d[\d,.]*(?:\s?(?:%|×))?/g;
const covered = new Set();

for (const [key, file] of files) {
  const text = prose(fs.readFileSync(file, 'utf8'));
  let masked = text;
  for (const n of names) masked = masked.split(n).join(' '.repeat(n.length));
  const spans = [];
  for (const e of entries.filter(e => e.page === key)) {
    const t = e.text.replace(/\s+/g, ' ');
    let i = text.indexOf(t), found = false;
    while (i !== -1) { spans.push([i, i + t.length]); found = true; i = text.indexOf(t, i + 1); }
    if (found) covered.add(e); else problems.push(`${key}: figures.yaml text not found: "${e.text}"`);
  }
  for (const m of masked.matchAll(NUM)) {
    const v = m[0].replace(/[.,]$/, '');
    if (/^(19|20)\d\d$/.test(v)) continue;
    if (/^\d{1,2}$/.test(v) && /^\s(January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(masked.slice(m.index + m[0].length))) continue; // day of a date
    const at = m.index;
    if (spans.some(([a, b]) => at >= a && at < b)) continue;
    problems.push(`${key}: number without a home: "${text.slice(Math.max(0, at - 40), at + v.length + 25).trim()}"`);
  }
}

for (const e of entries) {
  if (!['source', 'derived', 'illustrative'].includes(e.kind)) problems.push(`figures.yaml: bad kind for "${e.text}"`);
  if (e.kind === 'source' && !(e.sources?.length)) problems.push(`figures.yaml: source figure without sources: "${e.text}"`);
  if (e.kind === 'source' && !e.evidence) warn.push(`figures.yaml: no evidence excerpt yet: "${e.text}"`);
  if (e.kind === 'derived' && !e.calc) problems.push(`figures.yaml: derived figure without calc: "${e.text}"`);
  if (e.kind === 'illustrative' && !e.note) problems.push(`figures.yaml: illustrative figure without note: "${e.text}"`);
}

for (const w of warn) console.warn('warning: ' + w);
if (problems.length) {
  console.error(problems.map(p => '✗ ' + p).join('\n'));
  console.error(`\n${problems.length} problem(s). Give each number a <Claim> or an entry in src/data/figures.yaml.`);
  process.exit(1);
}
console.log(`Figures check: OK (${entries.length} ledger entries, ${warn.length} without evidence yet)`);
