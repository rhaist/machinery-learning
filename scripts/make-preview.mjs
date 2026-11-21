#!/usr/bin/env node
// Builds a self-contained preview (all links relative, explicit index.html) for hosts without
// directory-index support. Usage: BASE=/ npx astro build --outDir dist-preview && node scripts/make-preview.mjs dist-preview
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2] || 'dist-preview';
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk(root).filter(f => f.endsWith('.css'))) {
  // stylesheets live in assets/, so root-absolute asset URLs become siblings
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/url\(\/assets\//g, 'url(./'));
}
for (const f of walk(root).filter(f => f.endsWith('.html'))) {
  const depth = path.relative(root, path.dirname(f)).split(path.sep).filter(Boolean).length;
  const up = depth ? '../'.repeat(depth) : './';
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/(href|src)="\/(?!\/)([^"#?]*)([#?][^"]*)?"/g, (m, attr, p, tail = '') => {
    let target = p;
    if (target === '' || target.endsWith('/')) target += 'index.html';
    return `${attr}="${up}${target}${tail}"`;
  });
  s = s.replace(/href="((?:\.\.\/)+[^"#?]*\/)"/g, (m, p) => `href="${p}index.html"`);
  fs.writeFileSync(f, s);
}
console.log('preview links rewritten in', root);
