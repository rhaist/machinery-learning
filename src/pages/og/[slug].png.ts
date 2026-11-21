import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { ogPng } from '../../lib/og';
import { site, edition, monthLabel } from '../../lib/data';

export async function getStaticPaths() {
  const chapters = await getCollection('chapters');
  const notes = await getCollection('notes');
  const n = chapters.length - 1;
  const pages = [
    { slug: 'home', kicker: `${monthLabel(String(edition.month))} edition`, title: 'How AI like ChatGPT actually works, explained as it changes', summary: site.tagline + '. Interactive, plain-language, updated monthly.' },
    { slug: 'radar', kicker: 'Frontier radar', title: 'Where AI research stands this month', summary: 'From research to emerging to shipping, reviewed monthly. History is never rewritten.' },
    ...chapters.map(c => ({ slug: `learn-${c.id}`, kicker: `Chapter ${c.data.order} of ${n}`, title: c.data.title, summary: c.data.summary })),
    ...notes.map(x => ({ slug: `notes-${x.id}`, kicker: `Field notes · ${monthLabel(x.data.month)}`, title: x.data.title, summary: x.data.summary })),
  ];
  return pages.map(p => ({ params: { slug: p.slug }, props: p }));
}

export const GET: APIRoute = async ({ props }) => {
  const p = props as { kicker: string; title: string; summary: string };
  const png = await ogPng({ ...p, footer: site.domain });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
