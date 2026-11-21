import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const dataDir = path.resolve('src/data');
const load = (f: string) => yaml.load(fs.readFileSync(path.join(dataDir, f), 'utf8')) as any;

export type Claim = {
  id: string; text: string; sources?: string[]; verified: string | Date;
  half_life?: number; status: string;
};
export type RadarEntry = {
  id: string; name: string; quadrant: string; chapter?: string; note: string;
  history: Record<string, string>;
};

const iso = (d: string | Date) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

export const claims: Claim[] = (load('claims.yaml') as Claim[]).map(c => ({ ...c, verified: iso(c.verified) }));
export const claimById = Object.fromEntries(claims.map(c => [c.id, c]));
export const debates: any[] = ((load('debates.yaml') as any)?.debates ?? []).map((d: any) => ({ ...d, verified: iso(d.verified) }));
export const debateById = Object.fromEntries(debates.map(d => [d.id, d]));
export const reading: Record<string, any[]> = (load('reading.yaml') as any) ?? {};
export const glossary: Record<string, { term: string; def: string }> = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'glossary.json'), 'utf8'));

const radarRaw = load('radar.yaml');
export const quadrants: string[] = radarRaw.quadrants;
export const radarEntries: RadarEntry[] = radarRaw.entries.map((e: any) => ({
  ...e, history: Object.fromEntries(Object.entries(e.history).map(([k, v]) => [String(k), v as string])),
}));
export const radarMonths: string[] = [...new Set(radarEntries.flatMap(e => Object.keys(e.history)))].sort();
export const rings = ['research', 'emerging', 'shipping', 'faded'];

/** Ring of an entry in a given month (inherits the last earlier entry). */
export function ringAt(e: RadarEntry, month: string): string | null {
  const ks = Object.keys(e.history).filter(k => k <= month).sort();
  return ks.length ? e.history[ks[ks.length - 1]] : null;
}

/** Months since verification vs half-life → fresh | aging | stale | evergreen */
export function freshness(c: Claim, today = new Date()): string {
  if (!c.half_life) return 'evergreen';
  const v = new Date(iso(c.verified));
  const months = (today.getTime() - v.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return months < c.half_life ? 'fresh' : months < c.half_life * 2 ? 'aging' : 'stale';
}

export const site: { name: string; tagline: string; repo: string; domain: string; legal: Record<string, string>; editions: { month: string; subtitle: string }[]; parts: { id: string; title: string; summary: string }[] } = load('site.yaml');
export const edition = [...site.editions].sort((a, b) => String(b.month).localeCompare(String(a.month)))[0];

/** Chapters grouped by part (in site.yaml order), each with its number inside the part. */
export function byPart<T extends { id: string; data: { order: number; part: string } }>(chapters: T[]) {
  const sorted = [...chapters].sort((a, b) => a.data.order - b.data.order);
  return site.parts.map((p, pi) => {
    const list = sorted.filter(c => c.data.part === p.id);
    return { ...p, index: pi + 1, chapters: list.map((c, i) => ({ c, num: pi === 0 ? i : i + 1 })) };
  }).filter(p => p.chapters.length);
}

export const monthLabel = (m: string) =>
  new Date(m + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
