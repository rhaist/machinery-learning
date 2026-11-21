# Security policy

Machinery Learning is a static website: no accounts, no server-side code, no cookies and no third-party requests. Reports are still very welcome.

## Reporting a vulnerability

Please report privately, not in a public issue:

- **GitHub:** use [private vulnerability reporting](https://github.com/rhaist/machinery-learning/security/advisories/new) on this repository, or
- **Email:** hello@machinerylearning.eu

Include what you found, how to reproduce it, and the impact you expect. You'll get an acknowledgement within a few days. Please give a reasonable time to fix the issue before disclosing it publicly.

## In scope

- The site at machinerylearning.eu and its build (for example script injection through content, unsafe handling in the demos, or a compromised dependency).
- The update pipeline: the monthly research run reads untrusted web pages and opens pull requests. Ways to make it change protected paths, leak credentials or slip instructions past human review are in scope.
- Supply-chain issues in this repository (dependencies, GitHub Actions).

## Out of scope

- Findings that need a compromised device or browser of the reader.
- Missing security headers that GitHub Pages doesn't let us set.
- Reports produced by automated scanners without a demonstrated impact.

## How the project is hardened

- Dependencies are updated monthly through Dependabot, and the build fails on design or content-integrity violations.
- GitHub Actions are pinned to full commit SHAs, and workflows run with least-privilege permissions.
- Monthly update pull requests can't change workflows, scripts, build configuration or agent settings; CI enforces this.
- Everything the research run fetches is treated as data, never as instructions, and nothing is published without human review.
