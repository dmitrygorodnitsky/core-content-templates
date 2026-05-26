# Landing Recipes

Reference catalog of length-budgeted landing recipes for the orchestrator agent. Pick a recipe by total character budget, then fill the copy.md frontmatter + sections within the per-section budgets.

All recipes assume the canonical input format from `examples/sample-landing-copy.md`. Char budgets are visible content (excluding HTML markup) — the SEO editor will refine final copy in the CMS.

---

## Recipe `small` — 1500–2200 chars

Use for: single-product landings, low-stakes campaign pages, MVP launches.

**Block selection** (frontmatter overrides):

```yaml
blocks.hero: hero.operational-diagram
blocks.features: features.card-grid-3
blocks.comparison: comparison.three-col-with-mobile-cards
blocks.faq: faq.bubble-light-grouped
```

**Section budgets:**

| Section | Chars | Notes |
|---|---|---|
| hero title + 2 lead paragraphs | 350 | h1 ≤ 80 chars, each paragraph ≤ 150 |
| features (3 items) | 600 | each item: ### title ≤ 50 chars + body ≤ 150 chars |
| comparison table | 350 | 1 intro paragraph + 5×6 table; statuses are short keywords |
| faq (3 items) | 450 | each: ### question ≤ 60 + answer ≤ 100 |
| final CTA | 100 | 1 short paragraph + 1 link |

**Total target: 1850 ± 350 chars.**

---

## Recipe `medium` — 2300–3300 chars

Use for: vertical landing pages, comparison-driven sales pages, product overviews.

**Block selection:**

```yaml
blocks.hero: hero.operational-diagram
blocks.features: features.accordion-2col-numbered
blocks.comparison: comparison.three-col-with-mobile-cards
blocks.faq: faq.bubble-light-grouped
```

**Section budgets:**

| Section | Chars | Notes |
|---|---|---|
| hero title + 3 lead paragraphs | 500 | richer story, leaves room for differentiation |
| features (5 items in 2 columns) | 1000 | each: title ≤ 50 + body ≤ 150 |
| comparison table | 600 | 1 intro paragraph + 6 rows × 6 cols |
| faq (4 items) | 800 | each: question ≤ 80 + answer ≤ 120 |
| final CTA | 150 | 1 paragraph + 1 CTA link |

**Total target: 2800 ± 500 chars.**

---

## Recipe `long` — 3400–5000 chars

Use for: cornerstone SEO pages, deep vertical guides, multi-feature flagship landings.

**Block selection:**

```yaml
blocks.hero: hero.composite-photo
blocks.features: features.accordion-2col-numbered
blocks.comparison: comparison.three-col-with-mobile-cards
blocks.faq: faq.bubble-light-grouped
```

**Section budgets:**

| Section | Chars | Notes |
|---|---|---|
| hero title + 3 lead paragraphs | 600 | extra paragraph for differentiation story |
| features (5 items) | 1300 | each: title ≤ 60 + body ≤ 200 |
| comparison table | 900 | 1 intro paragraph + 7 rows × 6 cols, with longer status keywords ("enterprise", "manual config") |
| faq (4–5 items) | 1300 | each: question ≤ 100 + answer ≤ 200 |
| final CTA | 200 | 1 longer paragraph (story-style) + 1 link |

**Total target: 4300 ± 700 chars.**

---

## Frontmatter contract (all recipes)

```yaml
---
code: <UPPERCASE_LANDING_CODE>          # e.g. HVAC_LANDING — codeSlug() applied
name: <Human readable name>             # e.g. "HVAC Operations Landing"
url: <relative-path>                    # e.g. /verticals/hvac
locale: en                              # locale code, single language
theme: <theme-name>                     # from themes.json — cyan/green/orange/red/forest/blue/amber/magenta
background: <none|gradient|image>       # optional decorative background
blocks.hero: <block-id>                 # optional override per section
blocks.features: <block-id>             # optional
blocks.comparison: <block-id>           # optional
blocks.faq: <block-id>                  # optional
---
```

The orchestrator agent picks `theme` from `themes.json` based on the requested topic. If the topic isn't in the map, fall back to the default (`cyan`).

---

## Required sections (parser hard-requirements)

`generate-cms-family.mjs` rejects copy.md that lacks any of:

- A top-level `#` heading (hero title)
- `## Features` with ≥1 `###` item
- `## Comparison` with a markdown table (one header row, one divider, ≥1 data row)
- `## FAQ` with ≥1 `###` question
- `## Final CTA` is optional but recommended

If a section is missing, the agent must regenerate, not skip.

---

## Comparison status keywords

The comparison block classifies each table cell with a CSS class via substring match:

| Status class | Triggered by |
|---|---|
| `--yes` (default) | any keyword that doesn't match below — "native", "built-in", "unified", "integrated" |
| `--partial` | contains "partial" or "limited" or "manual" |
| `--no` | exact "no", "none", "false", or empty |

**Implication for the agent**: pick status keywords from a short canonical list (`native`, `built-in`, `unified`, `partial`, `limited`, `manual config`, `no`, `add-ons`, `enterprise`). Random freeform strings will all classify as `yes`.

---

## Supported markdown features

- **Headings**: `#` (hero title, once), `##` (section, e.g. `## Features`), `###` (item, e.g. one FAQ Q&A).
- **Paragraphs**: any non-empty line that isn't a heading / list-item / table.
- **Unordered lists**: lines starting with `- ` or `* `. Consecutive list items group into one `<ul>`.
- **Ordered lists**: lines starting with `1. `, `2. ` etc. Group into one `<ol>`.
- **Inline links**: `[label](href)`. The label stays as text in the surrounding content; the href is extracted into the section's `links[]`.
- **Markdown tables**: only inside `## Comparison`. Standard `| col | col |` + `| --- | --- |` divider + body rows.

Lists, paragraphs and links can mix in any order within a section item. The parser pre-renders lists as `<ul>` / `<ol>` HTML and includes them in the parameter value; the preview renderer un-escapes a small whitelist of inline tags (`ul/ol/li/strong/em/br/p/a`) so they actually render.

## Things to avoid

- **Code fences** (```` ``` ````) — not supported.
- **Nested links** in paragraph text — `[label with [brackets]](href)` will fail the regex.
- **Multiple H1** — only the first `#` counts as hero title.
- **Comparison table outside `## Comparison`** section — parser ignores tables elsewhere.
- **Inline raw `<html>`** — passes through as escaped text, only the whitelist (ul/ol/li/strong/em/br/p/a) renders. Don't write `<div>` or `<script>` — they'll be visible as `&lt;div&gt;`.

---

## Quality bar (for the orchestrator agent)

- Avoid stuffing the same keyword into every paragraph — SEO editor will tune later.
- Don't write "Lorem ipsum" — that's reserved for unfilled defaults. Generate real content.
- Match the requested length budget within ±20%.
- One paragraph per slot — don't try to compress two paragraphs into one parameter.
- Comparison column headers should be short noun phrases (≤ 18 chars each).
- FAQ questions should be searchable (full question form, not just keywords).

---

## Adding new recipes

If a new size tier is needed (e.g. `xs` for one-screen pages, `xl` for content hubs), append a section above. Each recipe MUST:

1. Have a section budget table
2. Specify default block selection
3. State the total target with ± tolerance
4. Note any sections that should be omitted (e.g. an `xs` recipe might skip comparison entirely)
