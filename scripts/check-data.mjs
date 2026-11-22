#!/usr/bin/env node
// Catches text in the hand-written YAML data files that YAML silently read as something else.
// Example: an unquoted list item containing ": " becomes a mapping and renders as "[object Object]".
//  1. A list that contains text must contain only text.
//  2. Fields that hold prose or links must be text (or lists of text).
// Exit code 1 on any violation.
import fs from 'node:fs';
import path from 'node:path';
import { load as parseYaml } from 'js-yaml';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dirs = ['src/data', 'research'];
const TEXT = new Set(['text', 'evidence', 'points', 'sources', 'who', 'label', 'settle', 'note', 'why', 'title', 'by', 'q', 'options', 'explain', 'intro', 'summary', 'question', 'url', 'evidence_src', 'signal', 'short', 'plain']);
const kind = v => (v === null ? 'empty' : Array.isArray(v) ? 'list' : v instanceof Date ? 'date' : typeof v === 'object' ? 'mapping' : typeof v);
const show = v => JSON.stringify(v).slice(0, 110);
const problems = [];

function walk(v, where, file) {
  if (Array.isArray(v)) {
    if (v.some(x => typeof x === 'string')) v.forEach((x, i) => { if (typeof x !== 'string') problems.push(`${file}: ${where}[${i}] is a ${kind(x)}, not text: ${show(x)}`); });
    v.forEach((x, i) => walk(x, `${where}[${i}]`, file));
  } else if (v && typeof v === 'object' && !(v instanceof Date)) {
    for (const [k, x] of Object.entries(v)) {
      const at = where ? `${where}.${k}` : k;
      if (TEXT.has(k) && x != null) {
        const items = Array.isArray(x) ? x : [x];
        items.forEach((y, i) => { if (typeof y !== 'string') problems.push(`${file}: ${at}${Array.isArray(x) ? `[${i}]` : ''} is a ${kind(y)}, not text: ${show(y)}`); });
      }
      walk(x, at, file);
    }
  }
}

let files = 0;
for (const d of dirs) {
  for (const f of fs.readdirSync(path.join(root, d)).filter(f => /\.ya?ml$/.test(f))) {
    const rel = `${d}/${f}`, raw = fs.readFileSync(path.join(root, rel), 'utf8');
    let data;
    try { data = parseYaml(raw); } catch (e) { problems.push(`${rel}: cannot be read (${e.message.split('\n')[0]})`); continue; }
    files++;
    walk(data, '', rel);
  }
}
const unique = [...new Set(problems)];
if (unique.length) {
  console.error(`Data check: ${unique.length} problem${unique.length === 1 ? '' : 's'}. Put the text in double quotes.\n` + unique.map(p => '  ✗ ' + p).join('\n'));
  process.exit(1);
}
console.log(`Data check: OK (${files} files)`);
