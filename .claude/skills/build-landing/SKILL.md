---
name: build-landing
description: Build a local ServiceWand CMS landing family from lab-ui gallery blocks. Use when the user asks for a landing template by topic/vertical/size. The agent must select structure only, compile blocks from the catalog, keep visible values lorem, and stop before upload.
---

# /build-landing

You build a local CMS landing family from `lab-ui` blocks.

## Contract

Only one structural rule is fixed:

```text
header.default
  ...selected gallery blocks...
footer.default
```

Everything between header and footer can vary.

## Command

Prefer the deterministic wrapper:

```bash
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --request "<original user request>"
```

For explicit block selection:

```bash
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --topic hvac \
  --sections hero.composite-photo,features.card-grid-4,section.axes-grid,faq.bubble-light-grouped
```

The wrapper writes a spec and runs:

```text
compose-cms-family -> validate-cms-family -> render-cms-family-preview
```

## Hard Rules

- Do not write real content.
- Do not write HTML/CSS/JS.
- Do not use `sample-landing-copy.md`.
- Do not invent block IDs; use only `manifest.json`.
- Do not upload.
- If the generated structure looks wrong, adjust `--sections` and rerun.

## Report

Report:

- selected blocks
- dist path
- preview URL/path
- validation result

Mention that all visible content is lorem by design and CMS editors will fill
parameter values later.
