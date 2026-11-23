// Hand-built so <lastmod> comes from the content itself: a chapter's `updated` date, a note's date.
import { getCollection } from 'astro:content';
import { reviews } from '../lib/data';
export async function GET({ site }: { site: URL }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const chapters = (await getCollection('chapters')).sort((a, b) => a.data.order - b.data.order);
  const notes = (await getCollection('notes')).sort((a, b) => b.data.month.localeCompare(a.data.month));
  const latest = [...chapters.map(c => c.data.updated), ...notes.map(n => n.data.date)].reduce((a, b) => (b > a ? b : a));
  const lastNote = notes[0]?.data.date ?? latest;
  const pages: [string, Date][] = [
    ['/', latest],
    ...chapters.map(c => [`/learn/${c.id}/`, c.data.updated] as [string, Date]),
    ...Object.keys(reviews).map(id => [`/review/${id}/`, latest] as [string, Date]),
    ['/notes/', lastNote],
    ...notes.map(n => [`/notes/${n.id}/`, n.data.date] as [string, Date]),
    ['/radar/', lastNote], ['/glossary/', latest], ['/sources/', latest], ['/reading/', latest], ['/about/', latest],
  ];
  const body = pages.map(([p, d]) => `  <url><loc>${new URL(base + p, site).href}</loc><lastmod>${day(d)}</lastmod></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
