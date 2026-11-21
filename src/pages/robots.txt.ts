// Everyone may crawl everything; the sitemap lists the pages worth indexing.
export function GET({ site }: { site: URL }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(`${base}/sitemap.xml`, site).href}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
