# Maintaining

Notes for the maintainer: deployment, the domain, the monthly update and release checks.

## Deployment

Every push to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`). A weekly scheduled rebuild keeps freshness fading current even without commits. Pull requests run `.github/workflows/check.yml`: claims freshness (strict), design rules and the build.

Repository settings this relies on:

- **Pages:** source "GitHub Actions", custom domain `machinerylearning.eu`, **Enforce HTTPS** on. `public/CNAME` sets the domain too.
- **Domain verification** for `machinerylearning.eu` in the account's Pages settings (prevents domain takeover).
- **Branch protection on `main`:** require the Check workflow and a review for pull requests.
- **Security:** private vulnerability reporting, Dependabot alerts and security updates on.

### DNS (at the registrar)

| Type | Host | Value |
|---|---|---|
| A | @ | 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153 |
| CNAME | www | rhaist.github.io |
| TXT | _github-pages-challenge-rhaist | (value from GitHub's domain verification) |

Check these against GitHub's documentation ("Managing a custom domain for your GitHub Pages site") before changing anything.

## The monthly update

A scheduled research run on the 1st of each month follows [`research/MONTHLY_UPDATE.md`](../research/MONTHLY_UPDATE.md) and opens one pull request on a branch named `update/YYYY-MM`. Review it like any other change: open the sources for every rewritten claim and radar move, read the field notes, and check the "Uncertain" and "Suspicious content" sections of the PR description. If the run couldn't research, it opens an issue instead.

The run may only edit `src/data/`, `src/content/` and the table components. CI rejects update PRs that touch `.claude/`, `.github/`, build configuration, package files, `scripts/`, `DESIGN.md` or the brief.

## Before a release or a big share

- `npm run check` passes locally.
- Visual check at 1280px and 390px wide, light and dark.
- Accessibility: axe on every page in both themes runs on every pull request (`npm run check:a11y` locally, after a build). It finds what a machine can find; a keyboard and screen-reader pass by a person is still worth doing before a launch.
- `node scripts/check-claims.mjs` shows nothing aging or stale.

## Legal pages

The legal notice and privacy notice read their details from `legal:` in `src/data/site.yaml`. Any value starting with `TODO` shows a visible draft warning on those pages.
