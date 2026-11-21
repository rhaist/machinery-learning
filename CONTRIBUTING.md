# Contributing

Thank you for helping keep the guide accurate. The most useful contributions, in order:

1. **Corrections.** A claim that is wrong, outdated or overstated, ideally with a primary source.
2. **Broken or weak sources.** A dead link, or a secondary source where a primary one exists.
3. **Clarity.** A beginner passage that confused you, or jargon that isn't explained.
4. **Counterpoints.** A credible expert position the guide leaves out.

For any of these, [open an issue](https://github.com/rhaist/machinery-learning/issues/new/choose) using the matching template. That is usually better than a pull request, because content changes need checking against sources first.

## The editorial bar

Something goes into the guide only if it changes how a reader should understand or use these systems. New model releases, benchmark records and funding rounds rarely qualify on their own.

- **Sources:** primary sources (papers, official lab or vendor posts, standards, court and regulator documents) over commentary. Vendor numbers about their own products are marked "self-reported".
- **Time-sensitive facts** go into `src/data/claims.yaml` with sources, a `verified` date and a `half_life` (months until re-check), and appear in chapters as `<Claim id="…" />`. Don't hard-code them into prose.
- **Disagreements** go into `src/data/debates.yaml`: both sides steelmanned, with named proponents and sources for each side.
- **Beginner core first:** plain language, everyday analogies, no unexplained jargon. Technical detail belongs inside `<Engineer>` blocks.
- **Style:** British English, short sentences, sentence case for headings, no hype. State the point directly: no "not X but Y" setups, one-line closers, staged run-ups ("Here's the thing"), stock AI words or decorative bold. The [humanizer checklist](https://github.com/blader/humanizer) lists the patterns to avoid.

## Pull requests

1. Fork, branch from `main`, and run `npm ci`.
2. Make your change. New or changed UI follows [`DESIGN.md`](DESIGN.md).
3. Run `npm run check`. It must pass: claims freshness and integrity, design rules, and the production build.
4. Open a pull request using the template. Say what changed and link the sources you checked.

Branches named `update/…` are reserved for the monthly research update and may not change the build, workflows, scripts or design rules.

## Licence of contributions

By contributing you agree that code is licensed under MIT and text, diagrams and data under CC BY-SA 4.0, as described in the [README](README.md#licence).

## Conduct

Be kind, assume good faith, and argue with evidence. Personal attacks, harassment and discriminatory language are not tolerated; the maintainer may remove such contributions and block their authors.
