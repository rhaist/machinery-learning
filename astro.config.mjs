import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// SITE/BASE can be overridden, e.g. for a preview under a sub-path
export default defineConfig({
  site: process.env.SITE ?? 'https://machinerylearning.eu',
  base: process.env.BASE ?? '/',
  trailingSlash: 'ignore',
  build: { format: process.env.BUILD_FORMAT ?? 'directory', assets: 'assets' },
  integrations: [mdx()],
});
