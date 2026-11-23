import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    short: z.string(),          // label in the chapter bar
    order: z.number(),            // global order across all parts
    part: z.string().default('language-models'),
    extra: z.boolean().default(false),   // optional side page: built at /learn/<id>/, but not numbered, not in the progress map or the pager sequence
    summary: z.string(),        // one sentence, shown on the journey map
    minutes: z.number(),
    updated: z.coerce.date(),   // last substantive change
    goals: z.array(z.string()).default([]),      // "After this chapter you can…", shown at the top
    takeaways: z.array(z.string()).default([]),  // "Remember this", shown after the checkpoint questions
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    month: z.string(),          // YYYY-MM
    date: z.coerce.date(),
    summary: z.string(),
    // Facts that were wrong on a published page and have been fixed. Shown at the end of the note.
    corrections: z.array(z.object({
      page: z.string().startsWith('/'),   // site path, e.g. /learn/tokens/
      title: z.string(),                  // page or chapter title
      was: z.string(),
      now: z.string(),
      found_by: z.enum(['reader', 'fact-check', 'monthly review', 'editor']),
    })).default([]),
  }),
});

export const collections = { chapters, notes };
