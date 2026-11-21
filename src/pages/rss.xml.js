import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
export async function GET(context) {
  const notes = (await getCollection('notes')).sort((a, b) => b.data.month.localeCompare(a.data.month));
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return rss({
    title: 'LLM Field Guide: field notes',
    description: 'Monthly notes on what changed in how large language models work and how to use them.',
    site: context.site + base.replace(/^\//, ''),
    items: notes.map(n => ({ title: n.data.title, pubDate: n.data.date, description: n.data.summary, link: `${base}/notes/${n.id}/` })),
  });
}
