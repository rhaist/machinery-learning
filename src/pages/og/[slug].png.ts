import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { ogPng } from '../../lib/og';
import { site, edition, monthLabel, byPart } from '../../lib/data';

export async function getStaticPaths() {
  const chapters = await getCollection('chapters');
  const notes = await getCollection('notes');
  const parts = byPart(chapters as any[]);
  const kick = (id: string) => { const p = parts.find(p => p.chapters.some(x => x.c.id === id)); if (!p) return 'Optional reading'; const num = p.chapters.find(x => x.c.id === id)!.num; return `${parts.length > 1 ? p.title.split(':')[0] + ' · ' : ''}Chapter ${num} of ${p.chapters[p.chapters.length - 1].num}`; };
  const pages = [
    { slug: 'home', kicker: `${monthLabel(String(edition.month))} edition`, title: 'How AI like ChatGPT works, updated every month', summary: site.tagline + '. Interactive and in plain language.' },
    { slug: 'radar', kicker: 'Frontier radar', title: 'Where AI research stands this month', summary: 'From research to emerging to shipping, reviewed monthly. History is never rewritten.' },
    ...chapters.map(c => ({ slug: `learn-${c.id}`, kicker: kick(c.id), title: c.data.title, summary: c.data.summary })),
    ...notes.map(x => ({ slug: `notes-${x.id}`, kicker: `Field notes · ${monthLabel(x.data.month)}`, title: x.data.title, summary: x.data.summary })),
  ];
  return pages.map(p => ({ params: { slug: p.slug }, props: p }));
}

export const GET: APIRoute = async ({ props }) => {
  const p = props as { kicker: string; title: string; summary: string };
  const png = await ogPng({ ...p, footer: site.domain });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
