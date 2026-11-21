# Machinery Learning design guide

The rules every page and component follows. `node scripts/check-design.mjs` enforces the mechanical ones and runs in CI; the rest are for review.

All tokens live at the top of `src/styles/global.css`. **Never write a raw size, gap or radius.** If no token fits, the design is wrong, not the token list. Changing a token is a design decision and needs a reason in the commit message.

## Character

Calm, precise, a little playful in the demos. A field guide with live instruments, not a marketing site. Every fact shows when it was last checked. No gradients except the brand mark, no drop shadows except the tooltip, no decorative motion.

## Type

Three families, all self-hosted: **Red Hat Display** (headings, labels that act as headings), **Red Hat Text** (everything else), **Red Hat Mono** (tokens, code, model output).

| Token | Size | Use |
|---|---|---|
| `--fs-xs` | 12px | Badges, tags, axis ticks, token IDs |
| `--fs-sm` | 14px | Captions, meta lines, legends, footers, compact controls, table cells on phones |
| `--fs-md` | 15px | Secondary text: card descriptions, notes in panels, tables, debate points, UI buttons and navigation |
| `--fs-base` | 17px | Reading text. Body default |
| `--fs-input` | 16px | Text inputs and selects only (prevents zoom on phones) |
| `--fs-lg` | 19px | Ledes, h3, card and panel titles |
| `--fs-xl` | 22px | Small display: debate question, card numbers, quadrant heads |
| `--fs-2xl` | 26–32px fluid | Every h2 |
| `--fs-3xl` | 34–52px fluid | Every h1 (one per page) |

Line height: `--lh-tight` 1.1 for headings, `--lh-snug` 1.35 for UI and compact lists, `--lh-body` 1.6 for reading text. Weights: 400 body, 500 UI emphasis, 700 labels and h3, 800 h1/h2 and the wordmark only.

Headings use `text-wrap: balance`. Reading text never exceeds `--w-text` (about 75 characters).

## Space

One scale, 4px base (plus `--hair`, 2px, only for gaps and radii inside dense data graphics such as the 1,000-essay grid): `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 · `--sp-6` 32 · `--sp-7` 48 · `--sp-8` 64 · `--sp-9` 96.

| Relationship | Token |
|---|---|
| Inside a control, icon to label | `--sp-2` |
| Between items in a list, chips, buttons in a row | `--sp-2` |
| Between parts of a component (title → text, control → output) | `--sp-3` |
| Panel and card padding | `--pad` (16px on phones, 24px from 720px) |
| Between paragraphs | `--sp-4` |
| Between a block (demo, note, debate, quiz, table) and its neighbours | `--sp-5` |
| Before an h2 in reading text | `--sp-7` |
| Section padding (`.band`) | `--band` (48–96px fluid) |
| Page side gutter | `--gutter` (16–48px fluid) |

Components **don't set outer margins**; the container they sit in does (`.prose` flow, `.stack`, grids with `gap`). Inside a demo panel, children are stacked with a `--sp-3` gap: no margins on children.

## Layout

| Token | Width | Use |
|---|---|---|
| `--w-page` | 1240px | Wide pages: home, radar, glossary, sources. Header, chapter bar and footer |
| `--w-wide` | 920px | Chapter column: drawings, demos, debates |
| `--w-text` | 680px | Reading text everywhere: chapter prose, notes, about, legal pages |

Chapters use a centred grid: text runs in the `--w-text` track, and demos, debates, tables and the drawing break out to `--w-wide`. Text-only pages use `.page-text` (the `--w-text` column). Every page starts with `.page-head` (optional kicker, h1, optional lede) with fixed gaps.

Breakpoints, and only these: **600px** (phone: stack everything), **720px** (header and panel padding), **900px** (two-column layouts collapse).

The footer sits at the bottom of the viewport on short pages.

## Shape

Radii: `--r-xs` 4 (bars, badges, inline marks) · `--r-sm` 8 (buttons, inputs, chips, nav pills) · `--r-md` 12 (list rows, notes, inner panels) · `--r-lg` 16 (panels, cards, debates, drawings) · `--r-pill` (chapter bar, round markers). An inner element's radius is one step below its container's.

Borders: 1px `--line` by default. 2px only for selected or accent outlines. Coloured edges (notes, verdicts, data rows, debate sides) are `--edge` (4px) on one side only.

Controls: `--ctl` 44px for anything tapped in content (WCAG target size); `--ctl-sm` 36px only for header controls and dense rows inside demos.

## Colour roles

Colours come only from the theme variables, which switch for light and dark. Never write a hex value outside `:root`, the share-image template or print styles.

| Role | Variables |
|---|---|
| Ground and surfaces, lowest to highest | `--bg`, `--s1`, `--s2` (panels), `--sunk` (inputs, rows inside panels) |
| Text | `--ink`, `--mut` (secondary), `--faint` (tertiary, never for body text) |
| Lines | `--line` |
| Teal: links, "fresh", positive, progress | `--t` (fills), `--tt` (text) |
| Yellow: the one primary action, selection, current item | `--y` (fills), `--yt` (text), `--onY` (text on yellow) |
| Red: risk, attack, error | `--r`, `--rt` |
| Blue: structure, system, the Engineer path | `--b`, `--bsoft` |

One yellow primary action per view. Red means risk, never decoration. Text colour on every fill must pass WCAG AA in both themes; axe runs on every page in both themes.

## Components

- **Panel** (`.panel`): surface `--s2`, 1px line, `--r-lg`, `--pad`. Demos are panels.
- **Card** (`.card`): same as a panel; whole card is the link; hover changes the border to teal.
- **Note** (`.note`): `--s1`, left edge in teal (analogy), yellow (key point) or red (warning). Title in Display 700.
- **Debate** (`.debate`): panel on `--s1`; two sides with a top edge in blue and red.
- **Engineer block** (`details.eng`): blue-tinted, collapsed on the beginner path.
- **Quiz** (`.quiz`): sunk surface, options as full-width 44px buttons.
- **Badge** (`.badge` family: claim dates, ring labels, freshness, tags): `--fs-xs`, 700, `--r-xs`, `0 --sp-2` padding.
- **Caption** (`.caption`): `--fs-sm`, `--mut`. The last line of a demo that explains what is illustrative.
- **Buttons**: `.btn` (secondary) and `.btn.pri` (the primary, yellow). Segmented toggles use `aria-pressed`.

## Writing in the interface

Sentence case everywhere. Labels say what happens ("Check the registry", not "Submit"). Illustrative numbers are labelled as illustrative in a caption.

## Checks

- `node scripts/check-design.mjs`: no raw sizes, gaps, radii or hex colours outside the token block, art and print sections; no inline `style` attributes in HTML except custom properties (`style="--c:…"`) and SVG drawing attributes.
- axe (WCAG 2.1 AA) on every page, both themes.
- Visual check at 1280px and 390px wide before every release.
