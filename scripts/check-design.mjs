#!/usr/bin/env node
// Enforces the mechanical rules in DESIGN.md:
//  1. No raw px values for spacing, font size or radius in global.css outside the token block
//     and the regions marked /* design-lint: off */ ... /* design-lint: on */ (SVG drawings, print).
//  2. No hex colours outside the token block and those regions.
//  3. No inline style attributes in components, pages or chapters, except custom properties
//     (style="--c:…") and the hand-drawn chapter illustrations (ChapterArt.astro).
// Exit code 1 on any violation.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const problems = [];

// ---- 1 and 2: stylesheet ----
const cssFile = path.join(root, 'src/styles/global.css');
const lines = fs.readFileSync(cssFile, 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('========== base =========='));
if (start < 0) problems.push('global.css: missing "========== base ==========" marker after the token block');
const checked = /(^|[;{\s])(margin(-[a-z-]+)?|padding(-[a-z-]+)?|gap|row-gap|column-gap|font-size|font|border-radius|border-[a-z-]+-radius)\s*:\s*([^;}]+)/g;
let off = false;
lines.forEach((line, i) => {
  if (line.includes('design-lint: off')) { off = true; return; }
  if (line.includes('design-lint: on')) { off = false; return; }
  if (off || i < start) return;
  const code = line.replace(/\/\*.*?\*\//g, '');
  for (const m of code.matchAll(checked)) {
    const prop = m[2], value = m[5];
    const raw = value.replace(/var\([^)]*\)/g, '').match(/(^|[\s,(/])-?\d*\.?\d+px\b/);
    if (raw) problems.push(`global.css:${i + 1}  ${prop}: ${value.trim()}  → use a token`);
  }
  // hex colours inside declaration values (id selectors like #tip are fine)
  for (const d of code.matchAll(/\{([^}]*)\}?/g)) {
    const hex = d[1].match(/:[^;]*?(#[0-9a-fA-F]{3,8})\b/);
    if (hex) problems.push(`global.css:${i + 1}  raw colour ${hex[1]}  → use a theme variable`);
  }
});

// ---- 3: inline styles ----
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = [...walk(path.join(root, 'src/components')), ...walk(path.join(root, 'src/pages')), ...walk(path.join(root, 'src/layouts')), ...walk(path.join(root, 'src/content'))]
  .filter(f => /\.(astro|mdx|md)$/.test(f) && !f.endsWith('ChapterArt.astro'));
for (const f of files) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\sstyle=(["'{])([^"'}]*)/g)) {
      const decls = m[2].split(';').map(s => s.trim()).filter(Boolean);
      if (decls.some(d => !d.startsWith('--'))) problems.push(`${path.relative(root, f)}:${i + 1}  inline style "${m[2].slice(0, 60)}"  → use a class`);
    }
  });
}

if (problems.length) {
  console.log(`Design check: ${problems.length} problem(s)\n`);
  problems.forEach(p => console.log('  ' + p));
  process.exit(1);
}
console.log('Design check: OK');
