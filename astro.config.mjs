import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// SITE/BASE can be overridden for previews (e.g. BASE=/ npm run build)
export default defineConfig({
  site: process.env.SITE ?? 'https://rhaist.github.io',
  base: process.env.BASE ?? '/llm-field-guide',
  trailingSlash: 'ignore',
  build: { format: process.env.BUILD_FORMAT ?? 'directory' },
  integrations: [mdx()],
});
