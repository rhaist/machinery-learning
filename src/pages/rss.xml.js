import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../lib/data';
export async function GET(context) {
  const notes = (await getCollection('notes')).sort((a, b) => b.data.month.localeCompare(a.data.month));
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return rss({
    title: `${site.name}: field notes`,
    description: `${site.tagline}. Monthly notes on what changed in the field and why it matters.`,
    site: context.site + base.replace(/^\//, ''),
    items: notes.map(n => ({ title: n.data.title, pubDate: n.data.date, description: n.data.summary, link: `${base}/notes/${n.id}/` })),
  });
}
