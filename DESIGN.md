# Machinery Learning design guide

The rules every page and component follows. `node scripts/check-design.mjs` enforces the mechanical ones and runs in CI; the rest are for review.

All tokens live at the top of `src/styles/global.css`. **Never write a raw size, gap or radius.** If no token fits, the design is wrong, not the token list. Changing a token is a design decision and needs a reason in the commit message.

## Character

**A technical drawing of the machine.** Calm, precise, a little playful in the demos. Pages read like engineering plates: a faint drafting grid, hairline rules, square corners, numbered figures, small uppercase labels, and one amber signal colour. Every fact carries an inspection stamp showing when it was last checked. Dark is a blueprint at night; light is drafting paper.

No gradients (the frontier drawing's horizon is the one exception), no drop shadows except the tooltip, no decorative motion, no photos of people.

## Type

Two families, both open-source and self-hosted: **Instrument Sans** (headings and all reading and UI text) and **Martian Mono** (labels, code, tokens, model output, numbers in drawings).

| Token | Size | Use |
|---|---|---|
| `--fs-label` | 11px | Mono labels only (see Labels) |
| `--fs-xs` | 12px | Code blocks, axis ticks, token IDs |
| `--fs-sm` | 14px | Captions, meta lines, legends, footers, compact controls, table cells on phones |
| `--fs-md` | 15px | Secondary text: card descriptions, notes in panels, tables, debate points, UI buttons and navigation |
| `--fs-base` | 17px | Reading text. Body default |
| `--fs-input` | 16px | Text inputs and selects only (prevents zoom on phones) |
| `--fs-lg` | 19px | Ledes, h3, card and panel titles |
| `--fs-xl` | 22px | Small display: debate question, card numbers, quadrant heads |
| `--fs-2xl` | 26–32px fluid | Every h2 |
| `--fs-3xl` | 38–64px fluid | Every h1 (one per page) |

Line height: `--lh-tight` 1.1 for headings (h1 1.02), `--lh-snug` 1.35 for UI and compact lists, `--lh-body` 1.6 for reading text. Weights: 400 body, 500 h1/h2 and UI emphasis, 600 h3 and component titles. Nothing heavier: the large, light headings are part of the identity.

**Labels** are Martian Mono, `--fs-label`, uppercase, tracked `--ls-label`. They are for kickers, figure tags, stamps and badges, table heads, meta lines and card footers. Never for navigation, buttons, body text or anything longer than one line. The wordmark is the one larger mono element.

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

Corners are nearly square. Radii: `--r-xs` 2 (bars, badges) · `--r-sm` 2 (buttons, inputs, chips) · `--r-md` 3 (list rows, notes, inner panels) · `--r-lg` 4 (panels, cards, debates, drawings) · `--r-pill` only for true circles. Don't round anything else.

Borders: 1px `--line` hairlines by default. 1.5–2px only for selected or accent outlines. Coloured edges (notes, verdicts, data rows, debate sides) are `--edge` (2px) on one side only.

Controls: `--ctl` 44px for anything tapped in content (WCAG target size); `--ctl-sm` 36px only for header controls and dense rows inside demos.

## Colour roles

Colours come only from the theme variables, which switch for light and dark. Never write a hex value outside `:root`, the share-image template or print styles.

| Role | Variables |
|---|---|
| Ground and surfaces, lowest to highest | `--bg`, `--s1`, `--s2` (panels), `--sunk` (inputs, rows inside panels) |
| Text | `--ink`, `--mut` (secondary), `--faint` (tertiary, never for body text) |
| Lines | `--line` |
| Cyan: links, "fresh", positive, progress, blueprint lines | `--t` (lines and fills), `--tt` (text) |
| Amber, the signal colour: the one primary action, selection, current item, kickers | `--y` (fills), `--yt` (text), `--onY` (text on amber) |
| Red: risk, attack, error | `--r`, `--rt` |
| Violet-blue: structure, system, the Engineer path | `--b`, `--bsoft` |
| Grid | `--grid` (4–5% ink) |

One amber primary action per view. Red means risk, never decoration. Text colour on every fill must pass WCAG AA in both themes; axe runs on every page in both themes.

## Components

- **Panel** (`.panel`): translucent `--s1` over the grid, 1px hairline, `--r-lg`, `--pad`. Demos are panels and carry registration marks and a figure tag.
- **Card** (`.card`): same as a panel; whole card is the link; hover changes the border to cyan.
- **Note** (`.note`): `--s1`, 2px left edge in cyan (analogy), amber (key point) or red (warning). Title in sans 600.
- **Debate** (`.debate`): panel on `--s1`; two sides with a top edge in blue and red.
- **Engineer block** (`details.eng`): blue-tinted, collapsed on the beginner path.
- **Quiz** (`.quiz`): sunk surface, options as full-width 44px buttons.
- **Badge / stamp** (`.badge` family: claim dates, ring labels, freshness, tags): a mono label inside a 1px outline in its own colour, no fill. The "new" tag is the one filled badge.
- **Caption** (`.caption`): `--fs-sm`, `--mut`. The last line of a demo that explains what is illustrative.
- **Buttons**: `.btn` (secondary) and `.btn.pri` (the primary, amber). Segmented toggles use `aria-pressed`.

## Reader

Chapters read like a book on phones and tablets. This is how chapters behave, not a mode readers have to switch on.

- **Compact header** (≤900px): wordmark and a Menu button in one row. It slides away while you scroll down and returns when you scroll up, near the top and near the end. A 2px amber progress line sits on its bottom edge on chapter pages, at every width.
- **Reader bar** (≤900px or touch screens, chapter pages only): Contents · chapter number and minutes left · Aa · Next (the one amber action). `--bar-h` tall plus the device's safe area; it hides and returns with the header.
- **Sheet**: one dialog for everything that left the header. A bottom sheet on phones, a full-height side panel from 601px. Order on chapter pages: this chapter's sections (current one marked, read ones in ink), all chapters by part with done state, guide links, settings (Engineer boxes closed or open, text size, theme). On other pages, guide links come first.
- **Progress and resume**: progress is measured through the chapter text. Reaching the end marks the chapter done and shows "Chapter complete" above the pager. The position is remembered per chapter; on return a toast *offers* to continue. Never jump without asking.
- **Text size**: S/M/L adjusts `--fs-base`, `--fs-md` and `--fs-lg` only, so every proportion holds.
- **Keyboard**: ← and → move between chapters, except while a control, a scrolling demo or the sheet has focus. Esc closes the sheet.

Motion is limited to the header, bar and sheet sliding in (0.2–0.25s) and is off under reduced motion.

## Signatures

The five elements that make a page recognisably ours. Use them as specified, nowhere else.

1. **Drafting grid**: `--grid` lines every `--sp-5` (24px) behind every page. Alternate sections (`.alt`) are solid, which gives the page its rhythm.
2. **Registration marks**: L-shaped corner marks 5px outside lab panels and chapter drawings. Not on cards, notes or debates.
3. **Figure tags**: every lab panel in a chapter gets "Fig. n" on its top edge, numbered automatically. Don't number anything else.
4. **Line-art plates**: chapter drawings are stroke-only (1.5px neutral, 1.75px colour), with a 14–18% tint inside coloured shapes, mono labels and gears drawn as rim, hub and teeth. Drawn at 800×220.
5. **Attention mark**: the brand mark, three tokens where the newest (amber) attends back to the earlier two (teal arcs). On a dark rounded tile in the header, favicon and phone icon; without the tile on share images. Built on a 32-unit grid, centred with a slight upward optical nudge, strokes no thinner than 2.8 units so it holds at 16px. Source: `public/favicon.svg`.

Share images (`src/lib/og.ts`) use the dark tokens, the grid, registration marks, an amber mono kicker and the large light title.

## Writing in the interface

Sentence case everywhere. No praise or chat wrappers in feedback text ("Well done!", "Great question"): say what happened. Labels say what happens ("Check the registry", not "Submit"). Illustrative numbers are labelled as illustrative in a caption.

## Engineer boxes

Depth without density. Open with the plain takeaway in one or two sentences. One idea per paragraph, two to four sentences each, with a bold run-in head as a signpost. Explain every term the first time it appears, in a few words or with a `<Term>`. Prefer one worked example with real numbers from a named model over a list of names. Cut detail only researchers need.

Give any mechanism with moving parts a figure: a step-through (Back / Next, "n of N", one highlighted part per step) or a static drawing in the technical-drawing style. Use real shapes and sizes from a named model, and say in the caption what is illustrative. Figures inside Engineer boxes are not numbered. Check every figure at 390px wide: no clipped labels, no text over lines, no horizontal scrolling of key columns.

## Checks

- `node scripts/check-design.mjs`: no raw sizes, gaps, radii or hex colours outside the token block, art and print sections; no inline `style` attributes in HTML except custom properties (`style="--c:…"`) and SVG drawing attributes.
- axe (WCAG 2.1 AA) on every page, both themes.
- Visual check at 1280px and 390px wide before every release.
