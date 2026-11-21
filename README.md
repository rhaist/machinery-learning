# Machinery Learning

*A living field guide to how AI actually works.*

A living, interactive guide to how AI works, starting with large language models, for people who use AI tools every day and want to understand what is going on inside them. Two reading paths (beginner and engineer), live demos in every chapter, and a monthly update as the field moves.

**Live site:** https://machinerylearning.eu (once Pages and DNS are set up)

## How it stays alive

| Layer | Where | Changes |
|---|---|---|
| Evergreen chapters | `src/content/chapters/*.mdx` | Rarely: how tokens, attention, training work |
| Claims registry | `src/data/claims.yaml` | Every fact that can go stale, with sources, `verified` date and `half_life`. Fades on the site when overdue |
| Frontier radar | `src/data/radar.yaml` | Monthly; `history` keeps every past position |
| Field notes | `src/content/notes/YYYY-MM.md` | One per month |
| Glossary | `src/data/glossary.json` | As new terms appear |
| Name, tagline, edition subtitle | `src/data/site.yaml` | Subtitle per edition; history kept |

The monthly update follows [`research/MONTHLY_UPDATE.md`](research/MONTHLY_UPDATE.md): re-verify stale claims, scan [`research/sources.yaml`](research/sources.yaml), apply the editorial bar, update radar, claims and chapters, write field notes, open **one PR** for human review. CI blocks update PRs that touch the build, workflows or scripts.

## Writing chapters

Chapters are MDX. The plain-language core is ordinary Markdown; technical depth goes in `<Engineer title="...">…</Engineer>`, which is folded on the beginner path and open on the engineer path.

```mdx
The model works with <Claim id="vocab-size" />.           {/* time-sensitive fact from claims.yaml */}
Hover a <Term k="kv">KV cache</Term> for its definition.  {/* glossary.json key */}
<Note title="Like Lego bricks">…</Note>                   {/* analogy aside; kind="warn" | "key" */}
<Quiz q="…" options={["…","…"]} answer={1} explain="…" />
```

Demos are Astro components in `src/components/`; their behaviour lives in `src/scripts/demos.js`, each block guarded by the element it needs.

## Commands

```sh
npm install
npm run dev            # http://localhost:4321/
npm run build
npm run check:claims   # freshness report; --strict fails on stale claims
```

## Going live

**Before the repo goes public**

- [ ] Fill `legal.address` and `legal.email` in `src/data/site.yaml` (the Impressum and privacy pages show a draft warning until you do)
- [ ] Review the chapters, especially the beginner layers
- [ ] Confirm licences (MIT code, CC BY-SA content) and the maintainer line on About

**GitHub Pages with machinerylearning.eu**

1. *Verify the domain first* (prevents domain takeover): GitHub → Settings (your account) → Pages → Add a domain → `machinerylearning.eu`, then add the TXT record GitHub shows you at your DNS provider.
2. Repo → Settings → Pages → Source: **GitHub Actions**. Custom domain: `machinerylearning.eu` (the `public/CNAME` file sets it too).
3. DNS at your registrar:

   | Type | Host | Value |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | rhaist.github.io |

   Check these against GitHub's current docs ("Managing a custom domain for your GitHub Pages site") before entering them.
4. Once the certificate is issued, tick **Enforce HTTPS**.

## Licence

Code: MIT ([LICENSE](LICENSE)). Text, diagrams and data: CC BY-SA 4.0 ([LICENSE-CONTENT](LICENSE-CONTENT)).

Maintained by Robert Haist. Drafts are written with AI assistance and reviewed by a human before publishing.
