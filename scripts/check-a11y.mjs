#!/usr/bin/env node
// Runs axe-core (WCAG checks) on every built page, in the light and the dark theme, on a phone-sized and a desktop-sized
// screen. Needs a build in dist/ and a local Chrome (GitHub's runners have one; set CHROME_PATH to use another).
// Exit code 1 on any violation.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');
if (!fs.existsSync(dist)) { console.error('Accessibility check: no dist/ folder. Run "npm run build" first.'); process.exit(1); }
const axeSource = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

// every page of the site: dist/**/index.html plus the 404 page
const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') pages.push('/' + path.relative(dist, dir).split(path.sep).join('/') + (dir === dist ? '' : '/'));
    else if (e.name === '404.html') pages.push('/404.html');
  }
})(dist);
pages.sort();

// a minimal static server for dist/
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(dist, rel);
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
const setups = [['phone, light', 390, 844, 'light'], ['phone, dark', 390, 844, 'dark'], ['desktop, light', 1280, 900, 'light'], ['desktop, dark', 1280, 900, 'dark']];
const problems = [];
let runs = 0;
for (const [name, width, height, colorScheme] of setups) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const url of pages) {
    await page.goto(origin + url, { waitUntil: 'load' });
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => (await window.axe.run()).violations.map(v => ({ id: v.id, help: v.help, n: v.nodes.length, first: v.nodes[0]?.html.slice(0, 140) })));
    runs++;
    for (const v of violations) problems.push(`${url}  [${name}]  ${v.id}: ${v.help} (${v.n}×), e.g. ${v.first}`);
  }
  await context.close();
}
await browser.close();
server.close();

if (problems.length) {
  console.error(`Accessibility check: ${problems.length} problem${problems.length === 1 ? '' : 's'} in ${runs} page checks.\n` + problems.map(p => '  ✗ ' + p).join('\n'));
  process.exit(1);
}
console.log(`Accessibility check: OK (${pages.length} pages × ${setups.length} setups, axe-core)`);
