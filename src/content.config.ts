import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    short: z.string(),          // label in the chapter bar
    order: z.number(),            // global order across all parts
    part: z.string().default('language-models'),
    summary: z.string(),        // one sentence, shown on the journey map
    minutes: z.number(),
    updated: z.coerce.date(),   // last substantive change
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    month: z.string(),          // YYYY-MM
    date: z.coerce.date(),
    summary: z.string(),
  }),
});

export const collections = { chapters, notes };
