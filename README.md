# Machinery Learning

**A living field guide to how AI actually works.** [machinerylearning.eu](https://machinerylearning.eu)

[![Deploy](https://github.com/rhaist/machinery-learning/actions/workflows/deploy.yml/badge.svg)](https://github.com/rhaist/machinery-learning/actions/workflows/deploy.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Content: CC BY-SA 4.0](https://img.shields.io/badge/content-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE-CONTENT)

![Machinery Learning](docs/preview.png)

An interactive guide for people who use AI tools every day and want to understand what is going on inside them. It starts with large language models and is written for two kinds of reader at once: a plain-language core with everyday analogies, and an *Engineer depth* layer with the technical detail. Switch between them at any time.

- **Part 1: Language models.** Tokens, attention, training, generation, agents, limits and the research frontier. Ten chapters, each with a hands-on demo.
- **Part 2: Trust & security.** Prompt injection, agent permissions, the AI supply chain, where your data goes, and how to judge AI claims. Five chapters with interactive labs.

## What makes it different

- **It shows its age.** Every fact that can go out of date lives in a claims registry with its sources, the date it was last verified and a re-check interval. Overdue facts visibly fade on the page until someone re-verifies them. The full list is on the [Sources & freshness](https://machinerylearning.eu/sources/) page.
- **It shows disagreement.** Where experts genuinely disagree, a chapter presents both sides, steelmanned, with named proponents and primary sources, plus what evidence would settle it.
- **It changes every month.** A research run drafts an update as a pull request (re-verified claims, radar moves, field notes) and a human reviews every change before it is published. The [frontier radar](https://machinerylearning.eu/radar/) keeps its full history.
- **It respects readers.** No cookies, no tracking, no third-party requests. Reading progress stays in your browser.

## Spotted an error?

Please [open an issue](https://github.com/rhaist/machinery-learning/issues/new/choose). There are templates for factual errors, broken sources and suggestions. Corrections with a primary source are the most valuable contribution there is. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Running it locally

Requires Node.js 22.12 or later (CI uses the current LTS, Node 26).

```sh
npm ci
npm run dev        # http://localhost:4321/
npm run check      # claims freshness (strict), design rules, production build
```

## How the repository is organised

| Path | What lives there |
|---|---|
| `src/content/chapters/` | Chapters in MDX: plain-language core, `<Engineer>` depth blocks, `<Claim>` facts, `<Debate>` boxes, quizzes |
| `src/data/claims.yaml` | Every time-sensitive fact, with sources, `verified` date and `half_life` |
| `src/data/debates.yaml` | "Where experts disagree": two sides, proponents, sources, what would settle it |
| `src/data/radar.yaml` | The frontier radar, with an append-only history per entry |
| `src/data/glossary.json`, `reading.yaml` | Glossary terms and further reading per chapter |
| `src/content/notes/` | Monthly field notes |
| `src/components/`, `src/scripts/` | Demos and labs (Astro components plus guarded client scripts) |
| `research/` | The brief and source list for the monthly update |
| `scripts/` | `check-claims.mjs` (freshness and integrity), `check-design.mjs` (design rules) |
| [`DESIGN.md`](DESIGN.md) | The design system: tokens, type, layout, signatures and the rules CI enforces |
| [`docs/MAINTAINING.md`](docs/MAINTAINING.md) | Deployment, domain, the monthly update and release checks |

Built with [Astro](https://astro.build), Instrument Sans and Martian Mono (both self-hosted), and no client-side framework.

## Licence

Code is MIT ([LICENSE](LICENSE)). Text, diagrams and data are CC BY-SA 4.0 ([LICENSE-CONTENT](LICENSE-CONTENT)): you may reuse and adapt them with attribution, under the same licence.

Maintained by Robert Haist. Drafts are written with AI assistance; a human reviews and verifies every change before it is published.
