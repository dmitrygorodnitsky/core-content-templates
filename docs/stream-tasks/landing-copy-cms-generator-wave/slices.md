# Slices — Landing Copy CMS Generator Wave

## Overview

This wave creates the first deterministic CMS generator for `lab-ui`.

The generator accepts normalized landing copy and emits dry-run CMS family artifacts. It must not call `core-cms` or upload templates. The output should be suitable for later handoff to an uploader layer.

Note: this wave is closed. The follow-up CMS review amendment in `master.md` supersedes the v1 CSS/JS ownership rule for the next implementation wave: root owns only shared infrastructure; block-specific CSS/JS belongs to the owning child template. The next wave must also add editor-grade English names and descriptions for every emitted CMS parameter.

## Slice-by-slice Breakdown

### S1 — Generator Contract

Intent: freeze the input and output contract before implementation.

Owned paths:

- `docs/cms-components/lab-ui/generator/README.md`
- `docs/cms-components/lab-ui/compositions/examples/field-service-copy.md`
- optional schema docs under `docs/cms-components/lab-ui/generator/`

Exact task:

- Define normalized `landing-copy.md` input:
  - frontmatter: `code`, `name`, `url`, `locale`, `theme`, optional `background`
  - first H1 as hero title
  - intro paragraphs as hero body
  - markdown links as primary/secondary CTA candidates
  - `## Features` with `###` items
  - `## Comparison` markdown table
  - `## FAQ` with `###` question headings and following answer paragraphs
  - `## Final CTA`
- Define generator output file layout.
- Define root + child + nested item CMS tree semantics.
- Define parameter naming rules and supported CMS parameter types.

What not to do:

- Do not implement upload or auth.
- Do not require a freeform LLM step for deterministic generation.

Validation:

- Example copy is valid Markdown and can be read by the planned parser.
- README commands are executable from repo root.

Completion signal:

- A future executor can implement scripts from the contract without hidden chat context.

### S2 — Copy Parser

Intent: turn normalized Markdown into a stable intermediate model.

Owned paths:

- `docs/cms-components/lab-ui/scripts/generate-cms-family.mjs`
- parser helpers under `docs/cms-components/lab-ui/scripts/` if useful
- example fixtures under `docs/cms-components/lab-ui/compositions/examples/`

Exact task:

- Parse frontmatter without introducing a heavy dependency unless the repo already has one.
- Parse headings, paragraphs, links, FAQ items, and markdown comparison tables.
- Emit `landing.model.json` in the output directory.
- Keep parser failures actionable: missing H1, duplicate sections, malformed table, empty FAQ answer, unsupported section.

What not to do:

- Do not infer arbitrary layouts from ambiguous prose.
- Do not mutate source copy.

Validation:

```bash
node docs/cms-components/lab-ui/scripts/generate-cms-family.mjs \
  --copy docs/cms-components/lab-ui/compositions/examples/field-service-copy.md \
  --out docs/cms-components/lab-ui/dist/field-service
```

Completion signal:

- The command writes a deterministic `landing.model.json`.

### S3 — Tree Resolver

Intent: map the intermediate model to `lab-ui` blocks and CMS tree nodes.

Owned paths:

- `docs/cms-components/lab-ui/scripts/generate-cms-family.mjs`
- relevant generator docs
- `docs/cms-components/lab-ui/**/block.json` only for contract metadata additions

Exact task:

- Read `manifest.json`.
- Select canonical blocks for recognized sections:
  - header: `header.sw-default`
  - hero: default to `hero.operational-diagram`, allow vertical hero selection from frontmatter later
  - features: `features.accordion-2col-numbered` or card-grid based on copy shape
  - comparison: `comparison.three-col-with-mobile-cards`
  - FAQ: `faq.bubble-light-grouped`
  - CTA: canonical CTA block pair inside relevant section
  - footer: `footer.sw-default`
- Resolve nested children for repeatables:
  - FAQ parent + `FAQ_N`
  - comparison parent + `COMPARE_ROW_N`
  - feature group + `FEATURE_N` when the selected block supports item children
- Emit `composition.resolved.json`.

What not to do:

- Do not introduce visual variants that do not exist in `lab-ui`.
- Do not change block designs to fit one example copy.

Validation:

- Re-running the same input produces the same resolved composition.
- Missing required block ids fails with clear errors.

Completion signal:

- Resolved composition contains root metadata, direct children, nested item children, selected block paths, and parameter namespaces.

### S4 — CMS Artifact Emitter

Intent: emit dry-run CMS artifacts for root, section children, and item children.

Owned paths:

- `docs/cms-components/lab-ui/scripts/generate-cms-family.mjs`
- generated output under `docs/cms-components/lab-ui/dist/field-service/`

Exact task:

- Bundle root CSS:
  - `00-tokens/tokens.css`
  - selected `block.css`
  - optional generator wrapper/scope comments
- Bundle root JS:
  - selected `block.js`
  - shared idempotent init wrapper if needed
- Emit root template JSON with `head`, `css`, `javascript`, `html`, `parameters`, `children`.
- Emit child template JSON with `html`, `parameters`, empty `head/css/javascript`.
- Emit nested item template JSON under the owning section.
- Emit `parameters.json` and `page-context.sample.json`.
- Emit `cms-family.payload.json` that can later drive a separate uploader.

Follow-up amendment for the next wave:

- Root template JSON must keep only shared CSS/JS infrastructure.
- Child template JSON must include the CSS/JS owned by that block.
- Generated parameter declarations must include editor-grade English name and description metadata.
- Standalone preview may still emit combined assets, but that must remain separate from canonical CMS template ownership.
- Image-like placeholders must become real CMS image slots: generated HTML emits parameterized `<img src="...">` plus editor-controlled `alt`, while missing `src` values render the existing striped placeholder fallback without a broken image icon.
- Block contracts must describe image slot dimensions/aspect ratio, fallback label, required/optional status, and alt parameter ownership.

What not to do:

- Do not add a CMS uploader.
- Historical v1: do not place CSS/JS into child templates. Next-wave rule supersedes this: do place block-specific CSS/JS into the owning child template.
- Do not make live HTTP requests.
- Do not replace image contracts with div-only placeholders in generated CMS templates.

Validation:

```bash
test -f docs/cms-components/lab-ui/dist/field-service/root.template.json
test -f docs/cms-components/lab-ui/dist/field-service/cms-family.payload.json
test -f docs/cms-components/lab-ui/dist/field-service/page-context.sample.json
```

Completion signal:

- A human can inspect generated JSON and see the full root + children CMS family.

### S5 — CMS Family Validation

Intent: make bad CMS artifacts fail before anyone tries to upload them.

Owned paths:

- `docs/cms-components/lab-ui/scripts/validate-cms-family.mjs`
- optional bad fixtures under `docs/cms-components/lab-ui/compositions/examples/fixtures/`

Exact task:

- Validate all `${CODE@TYPE}` placeholders in root and child fields.
- Validate every placeholder has exactly one parameter declaration.
- Validate no declared parameter is unused unless explicitly marked as reserved.
- Validate parameter code uniqueness across the full family.
- Validate child templates do not contain `head`; block-specific CSS/JS belongs on the owning child.
- Validate root template owns only shared CSS/JS infrastructure, not bundled block assets.
- Validate every emitted parameter has English `NAME` and `DESCRIPTION` metadata.
- Validate image slots use parameterized `<img src>` and `alt` contracts.
- Validate `enabledTemplates` includes all direct and nested child template codes/ids in sample output.
- Validate FAQ item children exist when FAQ copy exists.
- Preserve existing `validate-lab-ui.mjs` behavior; do not weaken CSS collision warnings.

What not to do:

- Do not use network or CMS credentials.
- Do not require browser rendering for this wave.

Validation:

```bash
node docs/cms-components/lab-ui/scripts/validate-cms-family.mjs \
  --out docs/cms-components/lab-ui/dist/field-service
```

Completion signal:

- Valid example passes.
- At least one intentionally malformed fixture or documented manual check proves missing parameter detection works.

### S6 — Docs and Example

Intent: make the workflow reusable after this chat.

Owned paths:

- `docs/cms-components/lab-ui/README.md`
- `docs/cms-components/lab-ui/generator/README.md`
- `docs/cms-components/lab-ui/compositions/examples/field-service-copy.md`
- generated `summary.md`

Exact task:

- Add usage docs:
  - what copy format to write
  - how block selection works
  - what artifacts are emitted
  - how root + children map to CMS
  - how FAQ nested children work
  - why upload is intentionally out of scope
- Document future uploader inputs:
  - `SERVICEWAND_API_KEY`
  - `SERVICEWAND_BEARER`
  - `SERVICEWAND_BASE_URL`
  - `SERVICEWAND_ORG`
- Include the ServiceWand CMS preview URL shape:
  `/page-context/0/preview.html?templateId=<templateId>&enabledTemplates=<templateId>`

What not to do:

- Do not document unimplemented upload commands as if they work.
- Do not move or delete existing lab-ui blocks.

Validation:

- Commands in docs run from repo root.
- Existing lab-ui validation still passes:

  ```bash
  node docs/cms-components/lab-ui/scripts/generate-manifest.mjs
  node docs/cms-components/lab-ui/scripts/validate-lab-ui.mjs
  ```

Completion signal:

- Another executor can generate and validate the example without asking for missing context.

## Dependency Order

1. S1 first.
2. S2 after S1.
3. S3 after S2.
4. S4 after S3.
5. S5 after S4.
6. S6 after S5, with minor README updates allowed during earlier slices.

Do not parallelize S2-S5 until the contract is stable; they touch the same generator critical path.

## Validation Matrix

| area | command or proof | expected result |
| --- | --- | --- |
| lab-ui manifest | `node docs/cms-components/lab-ui/scripts/generate-manifest.mjs` | manifest and manifest-data regenerate cleanly |
| lab-ui catalog | `node docs/cms-components/lab-ui/scripts/validate-lab-ui.mjs` | 23 blocks / 13 categories, CSS collision warnings allowed, no failures |
| composer example | `node docs/cms-components/lab-ui/scripts/compose-cms-family.mjs --spec docs/cms-components/lab-ui/compositions/generated/field-service-pdf-reference.spec.json --out docs/cms-components/lab-ui/dist/field-service-pdf-reference` | output directory contains resolved composition, templates, payload, summary |
| CMS family validation | `node docs/cms-components/lab-ui/scripts/validate-cms-family.mjs --out docs/cms-components/lab-ui/dist/field-service-pdf-reference` | passes with no missing params, metadata, image contract, or root/child ownership errors |
| artifact inspection | inspect `cms-family.payload.json` | root owns shared CSS/JS only; children own block CSS/JS; image slots are real `<img>` contracts with fallback placeholders |

Repo note: this repository currently has no root `package.json` or `Dockerfile`, so there is no separate production compile command to run for this wave.

## Closeout Requirements

- Update `master.md` ledger statuses.
- Record implementation commit hashes in `master.md` Delivery Notes.
- Add `audits/A1.md` with:
  - what landed
  - validation commands and outputs
  - residual risks
- Add `evidence/closeout.md` with:
  - generated artifact summary
  - key paths
  - accepted residuals
