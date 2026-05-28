---
name: create-servicewand-landing-template
description: Create a ServiceWand CMS landing template from the tracked lab-ui gallery blocks. Use when an operator asks for a landing page/template by topic, vertical, page type, or approximate length, and wants a local preview or CMS-ready family. The agent must compose existing blocks, generate lorem parameter values, validate the artifacts, and only upload when explicitly requested.
---

# Create ServiceWand Landing Template

Use this skill to turn an operator request like:

```text
Create an HVAC vertical landing template, around 2500 words.
```

into a ServiceWand CMS family generated from `docs/cms-components/lab-ui`.

## Core Contract

The agent is a template composer, not a designer and not a copywriter.

Hard rules:

- Use only tracked `lab-ui` gallery blocks from `docs/cms-components/lab-ui/manifest.json`.
- Do not invent new visual components.
- Do not write ad-hoc section HTML, CSS, or JavaScript.
- Do not use `sample-landing-copy.md` or a previous landing as a fixed structure.
- Do not write real copy unless the user explicitly asks for final content.
- Placeholder visible copy must begin with `Lorem Ipsum`.
- Header is always first, footer is always last.
- All middle sections may vary by request, recipe, and explicit operator overrides.
- Do not upload to CMS unless the user explicitly asks to upload.
- Never commit `.env`, tokens, API keys, temporary files, old extract catalogs, or local scratch output outside the approved `lab-ui` paths.

## Canonical Paths

Primary docs:

```text
docs/cms-components/lab-ui/generator/README.md
docs/cms-components/lab-ui/compositions/ORCHESTRATOR.md
docs/cms-components/lab-ui/compositions/RECIPES.md
docs/cms-components/lab-ui/manifest.json
```

Main scripts:

```text
docs/cms-components/lab-ui/scripts/build-landing.mjs
docs/cms-components/lab-ui/scripts/compose-cms-family.mjs
docs/cms-components/lab-ui/scripts/validate-cms-family.mjs
docs/cms-components/lab-ui/scripts/render-cms-family-preview.mjs
docs/cms-components/lab-ui/scripts/upload-cms-family.mjs
```

Generated output:

```text
docs/cms-components/lab-ui/compositions/generated/<slug>.spec.json
docs/cms-components/lab-ui/dist/<slug>/
```

## Operator Input

Accept plain intent from a non-developer:

```text
topic: HVAC
page type: vertical landing
target length: about 2500 words
route: /verticals/hvac
upload: no
```

If fields are missing, infer conservative defaults:

- `page type`: vertical landing
- `target length`: 2500 words
- `recipe`: medium
- `route`: slug from topic, usually `/verticals/<topic-slug>`
- `upload`: no

Ask a question only when the missing value changes a destructive or external action, such as upload target, route overwrite, or organization.

## Block Selection

Fixed shell:

```text
header.default
  ...selected middle blocks...
footer.default
```

Pick middle blocks from `manifest.json`, guided by `compositions/RECIPES.md`.
Use recipes as patterns, not as mandatory outlines. Different topics should be
allowed to produce different section mixes.

Useful block families:

- `hero.*` for the first content section.
- `section.h2-narrative-only`, `section.axes-grid`, `section.stages-list`, `section.stats-strip` for narrative and structural SEO sections.
- `features.card-grid-*` for scannable feature summaries.
- `features.accordion-2col-numbered` for dense H3-like feature lists.
- `mobile.4-card-glyph` for mobile/workforce workflows.
- `verticals.glyph-grid-20-slots` for supported industries or related verticals.
- `comparison.three-col-with-mobile-cards` for 2-6 column comparison tables.
- `faq.bubble-light-grouped` for FAQ.
- `decorative.callout-band` or `cta` blocks for final calls to action.

Do not include blocks that are not in the current manifest.

## Content and Parameters

The generated template must be content-empty but editor-ready:

- Every user-facing copy value is a CMS parameter.
- Every visible placeholder value starts with `Lorem Ipsum`.
- Each parameter includes an English editor name and description.
- Repeated structures use numbered slots unless the CMS repeater contract is confirmed.
- Breadcrumbs are CMS parameters; they are not hardcoded SEO content.

Parameter ownership:

- Root owns page-level metadata and shared shell parameters.
- Child templates own their own section parameters.

Images:

- Gallery striped placeholders represent image slots.
- Generated templates should expose image slots as real image contracts:

```html
<img src="${FIELD_IMAGE@IMAGE}" alt="${FIELD_IMAGE_ALT@LOCALIZED_STRING_SS}">
```

- If no image parameter is set, the existing striped placeholder remains visible.
- Missing image values must not show a broken image icon.
- Decorative avatar/icon image slots follow the same rule when the block uses them as content images.

## CSS and JavaScript Ownership

CMS output uses root + children.

Root may contain only shared concerns:

- tokens;
- reset/base typography;
- composition rhythm;
- generic shell helpers;
- idempotent root-level JavaScript helpers.

Child templates own:

- that block's `block.html`;
- that block's private `block.css`;
- that block's private `block.js`;
- declared dependency CSS/JS required by the block.

Do not move private section styles into root just to make a local preview pass.
If local and CMS previews differ, fix the generator ownership model or selectors.

## Build Flow

Preferred operator command:

```bash
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --request "<original operator request>"
```

Explicit block override:

```bash
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --topic hvac \
  --sections hero.composite-photo,features.card-grid-4,section.axes-grid,faq.bubble-light-grouped
```

The wrapper should:

```text
1. write compositions/generated/<slug>.spec.json
2. compose CMS family
3. validate CMS family
4. render local preview
```

Expected dist files:

```text
landing.spec.json
composition.resolved.json
head.html
root.css
root.js
root.template.json
children/**/template.json
parameters.json
page-context.sample.json
cms-family.payload.json
summary.md
preview.html
```

## Local Verification

Start or reuse a local server from `docs/cms-components/lab-ui`:

```bash
python3 -m http.server 8766
```

Open:

```text
http://127.0.0.1:8766/dist/<slug>/preview.html
```

Verify against gallery behavior:

- header and breadcrumbs are sticky together;
- desktop, tablet, and mobile layouts do not overflow unexpectedly;
- sections keep the shared composition rhythm;
- boxed blocks do not become full viewport width unless the source block is full width;
- comparison supports the requested 2-6 visible columns;
- FAQ and accordions work;
- mobile header menu works;
- placeholders remain placeholders;
- no real copy was generated by accident.

Run validation:

```bash
node docs/cms-components/lab-ui/scripts/generate-manifest.mjs
node docs/cms-components/lab-ui/scripts/validate-lab-ui.mjs
node docs/cms-components/lab-ui/scripts/validate-cms-family.mjs docs/cms-components/lab-ui/dist/<slug>
```

CSS collision warnings are acceptable only if validation does not fail and the
risk is reported.

## CMS Upload

Upload is a separate explicit step. Use only when the user asks to upload.

Credentials must come from environment variables:

```text
SERVICEWAND_API_KEY
SERVICEWAND_BEARER
SERVICEWAND_BASE_URL
SERVICEWAND_ORG
```

Never paste or commit credentials.

Upload source:

```text
docs/cms-components/lab-ui/dist/<slug>/cms-family.payload.json
```

After upload, verify CMS preview with the returned root template id and enabled
template ids. Compare it to the local `preview.html`. If CMS preview differs,
debug root/child CSS ownership, selector scope, and `enabledTemplates` order.

## Response Format

When finished, report:

- selected block sequence;
- generated spec path;
- dist path;
- local preview URL;
- validation commands and results;
- whether CMS upload was skipped or completed;
- residual risks, especially CSS collision candidates or CMS preview drift.

Keep the response operator-friendly. Do not require the user to understand the
generator internals unless a validation failure needs a decision.
