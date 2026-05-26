# Orchestrator Agent — Build a Landing End-to-End

This is the operating manual for the agent that turns a single-line user request ("build me a landing on HVAC, 2500 chars") into a CMS-uploaded landing template.

The agent is **read-mostly**. It reads the catalog + recipes + themes map, generates one new markdown file, runs three scripts, and reports outcomes.

---

## Inputs the agent reads (NEVER edits)

| File | Why |
|---|---|
| `manifest.json` | List of available blocks + their descriptions + parameters. |
| `compositions/themes.json` | Vertical/topic → theme color mapping. |
| `compositions/RECIPES.md` | Length-budgeted recipes (small/medium/long). |
| `compositions/examples/sample-landing-copy.md` | Canonical input format reference. |
| block-level `block.json` files | Per-block parameter contracts (optional deep dive). |

---

## Output the agent writes

A single new markdown file:

```
compositions/generated/<topic-slug>-<YYYYMMDD-HHMM>.md
```

Naming is for traceability; the orchestrator can pass any path via `--copy`.

---

## End-to-end flow

```
1. user prompt
   "Build a landing for HVAC vertical, ~2800 chars."
       │
       ▼
2. agent decisions
   ├─ topic_slug = "hvac"
   ├─ theme      = themes.json.verticals.hvac → "orange"
   ├─ budget     = 2800 chars
   ├─ recipe     = RECIPES.md.medium  (2300-3300 covers 2800)
   └─ blocks     = recipe defaults  (+ any user-specified overrides)
       │
       ▼
3. agent writes copy.md
   ├─ frontmatter: code, name, url, locale=en, theme, blocks.* overrides
   ├─ # hero title  (≤ 80 chars)
   ├─ 3 hero paragraphs  (≤ 150 chars each)
   ├─ 2 hero CTA links
   ├─ ## Features  + 5 × ### items
   ├─ ## Comparison + intro + table (6 cols × 7 rows)
   ├─ ## FAQ + 4 × ### Q&A pairs
   └─ ## Final CTA + paragraph + link
       │
       ▼
4. node scripts/generate-cms-family.mjs --copy <copy.md> --out dist/<slug>
       │
       ▼
5. node scripts/validate-cms-family.mjs --out dist/<slug>
       │           (fails → return to step 3 with parser error)
       ▼
6. node scripts/render-cms-family-preview.mjs --out dist/<slug> --file preview.html
       │           (optional — local visual check before upload)
       ▼
7. node scripts/upload-cms-family.mjs --out dist/<slug>
       │           (dry-run by default; --live when API spec is ready)
       ▼
8. agent reports to user:
   ├─ landing code
   ├─ char count actual vs budget
   ├─ preview path (file://...)
   └─ upload status
```

---

## Step-by-step rules for the agent

### Step 2 — Pick theme + recipe

- **Theme**: Look up `themes.json.verticals[topic_slug]`. If absent, use `themes.json.default` (cyan).
- **Recipe**: Match the budget to the recipe table in `RECIPES.md`. Don't invent new budgets.
- **Block overrides**: User may say "use card-grid features" — translate to `blocks.features: features.card-grid-3`. Read `manifest.json` to validate the chosen block ID exists.

### Step 3 — Generate copy

- **Always real content**, never `lorem ipsum`. Lorem is reserved for unfilled block defaults.
- Match recipe section budgets ±20%.
- Sum the visible-text characters. Don't count markdown markup.
- Lists are supported (`- item`, `* item`, `1. item`) — they render as real `<ul>` / `<ol>` in the preview and ship as HTML inside the parameter value.
- Don't include code fences.
- Comparison statuses: pick from the canonical short list in `RECIPES.md` (`native`, `partial`, `limited`, `manual`, `no`, `add-ons`, `enterprise`, etc.). Free-form text falls into the `--yes` class by default.
- Frontmatter keys with dots are now supported (e.g. `blocks.hero`).

### Step 4 — Generate

```bash
node docs/cms-components/lab-ui/scripts/generate-cms-family.mjs \
  --copy docs/cms-components/lab-ui/compositions/generated/hvac-20260526.md \
  --out  docs/cms-components/lab-ui/dist/hvac-20260526
```

The `--out` path MUST contain `dist/` — the generator refuses to wipe anything else (safety check).

### Step 5 — Validate

```bash
node docs/cms-components/lab-ui/scripts/validate-cms-family.mjs \
  --out docs/cms-components/lab-ui/dist/hvac-20260526
```

Exits 1 with FAIL messages on the first issue. The agent should:
1. Read the FAIL messages
2. If they reference the copy.md (e.g. "missing required section"), regenerate copy and retry from step 4.
3. If they reference the payload itself (e.g. "FAQ family must contain nested FAQ_N children"), this is a generator bug — surface to a human.

### Step 6 — Preview (optional but recommended)

```bash
node docs/cms-components/lab-ui/scripts/render-cms-family-preview.mjs \
  --out docs/cms-components/lab-ui/dist/hvac-20260526 \
  --file preview.html
```

Yields `dist/<slug>/preview.html` — a standalone HTML page you can open in a browser (`file://`) to verify the visual.

### Step 7 — Upload (dry-run by default)

```bash
LANDING_API_KEY=… LANDING_BASE_URL=… LANDING_ORG=… \
  node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \
    --out docs/cms-components/lab-ui/dist/hvac-20260526
```

Default mode prints the curl that would be executed. Use `--live` only when the CMS API contract is finalized.

---

## Errors the agent must handle

| Error pattern | Fix |
|---|---|
| `<file>:<line>: invalid frontmatter line` | Regenerate frontmatter — check `RECIPES.md` for valid keys. |
| `<file>: copy is missing required sections — <list>` | Add the missing `##` sections to copy.md. |
| `<file>:<line>: subheading appears before any ## section` | Move `###` items under a `## Section`. |
| `<file>:<line>: malformed markdown table` | Ensure: header row + `\| --- \| --- \|` divider + ≥1 body row. |
| `Required block is missing from manifest: <id>` | Check spelling of `blocks.<section>` override; only IDs in `manifest.json` are valid. |
| `Refusing to wipe --out path that is not inside a dist/ directory` | Add `dist/` to your `--out` path. |
| `Missing required env: LANDING_API_KEY` | Set env vars before invoking the uploader. |
| `Live upload is not implemented yet` | Stay in `--dry-run` until the CMS spec is finalized. |

---

## Block selection cheat-sheet

(Defaults shown; the recipe in `RECIPES.md` overrides per length tier.)

| Section | Default block | When to override |
|---|---|---|
| hero | `hero.operational-diagram` | Use `hero.composite-photo` if the topic needs a strong human/photo focus (services, retail). |
| features | `features.accordion-2col-numbered` | Use `features.card-grid-3` or `…card-grid-4` for shorter landings with visual cards. |
| comparison | `comparison.three-col-with-mobile-cards` | (No alternative today — single block.) |
| faq | `faq.bubble-light-grouped` | (No alternative today — single block.) |
| ctaPrimary | `cta.btn-primary-ring` | (No alternative — canonical primary CTA.) |
| ctaSecondary | `cta.btn-secondary-filled` | (No alternative — canonical secondary CTA.) |
| callout | `decorative.callout-band` | (No alternative.) |
| footer | `footer.default` | (No alternative.) |

Adding a new section block? Drop a new directory under `lab-ui/<NN-category>/`, run `generate-manifest.mjs`, and it becomes a valid override target immediately.

---

## Quality bar

The orchestrator agent owns content quality. The generator owns structural integrity. The SEO editor owns final polish.

The agent should:
- Match length budget ±20%.
- Hit the topic clearly in the hero title (it becomes the page H1 + meta title).
- Use real industry terminology — don't translate every sentence into placeholder-speak.
- Avoid keyword stuffing — write for humans, the SEO editor will tune later.
- Pick 5-7 competitor categories for the comparison table (e.g. "Generic SaaS", "Enterprise Suites", "Manual Workflows"), not specific competitor brand names.
- Keep FAQ questions in plain English — searchable, not just keyword fragments.

The agent should NOT:
- Output JSON, code, lists, or HTML in copy.md.
- Add new frontmatter keys not in `RECIPES.md`.
- Bypass the parser by writing payload JSON directly.
- Invoke the uploader in `--live` mode until explicitly told.
