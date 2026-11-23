// The inline bootstrap script as it is written into every page: src/scripts/boot.js without its comment lines.
// Shared by Base.astro (which inlines it) and astro.config.mjs (which hashes it for the Content-Security-Policy),
// so the two can never disagree.
export const bootCode = source => source.split('\n').filter(line => !line.startsWith('//')).join('\n').trim();
