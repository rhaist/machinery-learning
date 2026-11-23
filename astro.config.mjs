import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { bootCode } from './src/lib/boot.mjs';

// hash of the one inline script (src/scripts/boot.js), for the Content-Security-Policy below
const bootHash = 'sha256-' + crypto.createHash('sha256').update(bootCode(fs.readFileSync(new URL('./src/scripts/boot.js', import.meta.url), 'utf8'))).digest('base64');

// SITE/BASE can be overridden, e.g. for a preview under a sub-path
export default defineConfig({
  site: process.env.SITE ?? 'https://machinerylearning.eu',
  base: process.env.BASE ?? '/',
  trailingSlash: 'ignore',
  build: { format: process.env.BUILD_FORMAT ?? 'directory', assets: 'assets' },
  integrations: [mdx()],
  // no syntax highlighter: Shiki colours code with inline styles, which the Content-Security-Policy below is stricter about.
  // The guide has no code blocks today; one added later renders as plain monospace text.
  markdown: { syntaxHighlight: false },
  // Content-Security-Policy as a <meta> tag on every page (GitHub Pages cannot send headers).
  // Astro hashes the site's bundled scripts and styles; the one inline script is hashed above; everything else is limited
  // to this origin. Inline style *attributes* stay allowed: the demos set bar widths and colours that way, and an
  // attribute cannot run code.
  security: {
    csp: {
      directives: ["default-src 'self'", "img-src 'self' data:", "font-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"],
      scriptDirective: { hashes: [bootHash] },
      styleDirective: { resources: [{ resource: "'unsafe-inline'", kind: 'attribute' }] },
    },
  },
});
