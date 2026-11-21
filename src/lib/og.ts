// Renders 1200x630 social preview cards at build time (satori -> SVG -> PNG via resvg).
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { site } from './data';

const font = (pkg: string, file: string) => fs.readFileSync(path.resolve('node_modules/@fontsource', pkg, 'files', file));
const fonts = [
  { name: 'Display', data: font('red-hat-display', 'red-hat-display-latin-800-normal.woff'), weight: 800 as const, style: 'normal' as const },
  { name: 'Text', data: font('red-hat-text', 'red-hat-text-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Text', data: font('red-hat-text', 'red-hat-text-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];

const h = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });

export async function ogPng({ kicker, title, summary, footer }: { kicker: string; title: string; summary: string; footer: string }) {
  const blocks = ['#3b4fd8', '#4fc1c6', '#f7e463', '#e8452c', '#3b4fd8'].map((c, i) =>
    h('div', { width: [70, 96, 64, 110, 58][i], height: 44, borderRadius: 10, background: c, marginRight: 12, opacity: i === 2 ? 1 : 0.9 }));
  const tree = h('div', { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: '#0b1433', color: '#eef1fb', fontFamily: 'Text' }, [
    h('div', { display: 'flex', alignItems: 'center', fontFamily: 'Display', fontSize: 34, letterSpacing: -0.5 }, [
      h('div', { width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#4fc1c6,#f7e463)', marginRight: 16 }),
      site.name,
    ]),
    h('div', { display: 'flex', flexDirection: 'column' }, [
      h('div', { fontSize: 28, fontWeight: 500, color: '#4fc1c6', marginBottom: 18 }, kicker),
      h('div', { fontFamily: 'Display', fontSize: title.length > 48 ? 58 : 70, lineHeight: 1.05, letterSpacing: -1.5, marginBottom: 22 }, title),
      h('div', { fontSize: 30, lineHeight: 1.35, color: '#b0badf', maxWidth: 980 }, summary),
    ]),
    h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
      h('div', { display: 'flex' }, blocks),
      h('div', { fontSize: 24, color: '#b0badf' }, footer),
    ]),
  ]);
  const svg = await satori(tree as any, { width: 1200, height: 630, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
