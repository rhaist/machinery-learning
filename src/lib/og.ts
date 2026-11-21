// Renders 1200x630 social preview cards at build time (satori -> SVG -> PNG via resvg).
// Same identity as the site (DESIGN.md): blueprint ground, drafting grid, amber mono kicker, registration marks.
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { site } from './data';

const font = (pkg: string, file: string) => fs.readFileSync(path.resolve('node_modules/@fontsource', pkg, 'files', file));
const fonts = [
  { name: 'Sans', data: font('instrument-sans', 'instrument-sans-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Sans', data: font('instrument-sans', 'instrument-sans-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  { name: 'Mono', data: font('martian-mono', 'martian-mono-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Mono', data: font('martian-mono', 'martian-mono-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];
// Dark-theme values from the token block in global.css.
const C = { bg: '#0d1014', ink: '#e6e8ea', mut: '#9ba2a9', line: '#262c34', amber: '#f5b544', grid: 'rgba(230,232,234,0.05)', mark: 'rgba(230,232,234,0.5)' };

const h = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });
// Registration mark: an L of two bars at absolute coordinates, rotated per corner.
const corner = (x: number, y: number, rot: number) =>
  h('div', { position: 'absolute', left: x, top: y, width: 24, height: 24, display: 'flex', transform: `rotate(${rot}deg)` }, [
    h('div', { position: 'absolute', left: 0, top: 0, width: 24, height: 2, background: C.mark }),
    h('div', { position: 'absolute', left: 0, top: 0, width: 2, height: 24, background: C.mark }),
  ]);

export async function ogPng({ kicker, title, summary, footer }: { kicker: string; title: string; summary: string; footer: string }) {
  const content = h('div', { position: 'absolute', left: 80, top: 72, width: 1040, height: 486, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }, [
    h('div', { display: 'flex', alignItems: 'center', fontFamily: 'Mono', fontWeight: 500, fontSize: 22, letterSpacing: 2.5, textTransform: 'uppercase' }, [
      h('div', { width: 26, height: 26, marginRight: 22, display: 'flex', position: 'relative' }, [
        h('div', { position: 'absolute', left: 0, top: 0, width: 26, height: 26, borderRadius: 13, border: `2.5px solid ${C.amber}` }),
        h('div', { position: 'absolute', left: 11.75, top: -6, width: 2.5, height: 38, background: C.amber }),
        h('div', { position: 'absolute', top: 11.75, left: -6, height: 2.5, width: 38, background: C.amber }),
      ]),
      site.name,
    ]),
    h('div', { display: 'flex', flexDirection: 'column' }, [
      h('div', { fontFamily: 'Mono', fontSize: 20, letterSpacing: 1.6, textTransform: 'uppercase', color: C.amber, marginBottom: 24 }, kicker),
      h('div', { fontWeight: 500, fontSize: title.length > 48 ? 62 : 76, lineHeight: 1.02, letterSpacing: -2.2, marginBottom: 24 }, title),
      h('div', { fontSize: 28, lineHeight: 1.4, color: C.mut, maxWidth: 940 }, summary),
    ]),
    h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.line}`, paddingTop: 20, fontFamily: 'Mono', fontSize: 16, letterSpacing: 1.6, textTransform: 'uppercase', color: C.mut }, [
      h('div', {}, 'A living field guide · updated monthly'),
      h('div', {}, footer),
    ]),
  ]);
  const tree = h('div', {
    width: 1200, height: 630, display: 'flex', position: 'relative', backgroundColor: C.bg, color: C.ink, fontFamily: 'Sans',
    backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`, backgroundSize: '24px 24px',
  }, [content, corner(36, 36, 0), corner(1140, 36, 90), corner(1140, 570, 180), corner(36, 570, 270)]);
  const svg = await satori(tree as any, { width: 1200, height: 630, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
