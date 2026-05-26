# Orchestrator Agent — Block Composer Flow

This is the operating manual for turning a single-line request like
"build me a landing on HVAC, 2500 words" into a local CMS family preview.

The orchestrator owns structure only. It does not write landing copy and does
not upload.

## Inputs

| File | Why |
|---|---|
| `manifest.json` | Available gallery blocks. |
| `compositions/themes.json` | Topic -> theme color mapping. |
| `scripts/build-landing.mjs` | Operator-facing CLI. |
| `scripts/compose-cms-family.mjs` | Spec -> CMS family compiler. |

## Structural Rule

Only one rule is fixed:

```text
header.default
  ...any selected gallery blocks...
footer.default
```

Do not copy the structure of any sample landing. There is no canonical middle
sequence. The middle should vary by request, recipe, and explicit operator
overrides.

## Flow

```text
1. User request
   "Build a landing for HVAC vertical, ~2500 words."
       |
       v
2. build-landing decisions
   - topic = hvac
   - theme = orange
   - recipe = medium
   - sections = header + selected gallery blocks + footer
       |
       v
3. write landing.spec.json
       |
       v
4. compose-cms-family.mjs
   - reads manifest/block.json/block.html/block.css/block.js
   - bundles CSS/JS into root
   - creates one child template per selected block
   - fills parameter values with deterministic lorem
       |
       v
5. validate-cms-family.mjs
       |
       v
6. render-cms-family-preview.mjs
       |
       v
7. report local preview path
```

## Commands

Operator request:

```bash
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --request "HVAC vertical landing, ~2500 words"
```

Explicit sections:

```bash
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --topic hvac \
  --sections hero.composite-photo,features.card-grid-4,section.axes-grid,faq.bubble-light-grouped
```

The wrapper adds `header.default` and `footer.default`; do not include them
unless you are writing the lower-level spec manually.

## Hard Rules

- Do not write real copy.
- Do not write ad-hoc HTML/CSS/JS.
- Do not use `sample-landing-copy.md` as a source of structure.
- Do not bypass `manifest.json`.
- Do not upload in this flow.
- If a requested block does not exist in `manifest.json`, fail.

## Output Contract

Each run writes:

```text
compositions/generated/<slug>.spec.json
dist/<slug>/
```

The dist folder contains:

- `landing.spec.json`
- `composition.resolved.json`
- `root.template.json`
- `children/**/template.json`
- `parameters.json`
- `page-context.sample.json`
- `cms-family.payload.json`
- `preview.html`
