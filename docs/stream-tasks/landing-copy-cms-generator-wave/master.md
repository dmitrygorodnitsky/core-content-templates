---
created: 2026-05-25
level: wave
status: done
---

# Landing Copy CMS Generator Wave

## Goal

Build the first deterministic generator that turns normalized landing copy into a ServiceWand CMS `BlockTemplate` family backed by `docs/cms-components/lab-ui`.

The generator must produce root + child CMS artifacts, not upload anything to CMS.

## Core Decision

Input is a structured `landing-copy.md` file, not a hand-authored block list.

The generator resolves that copy into a CMS family:

```text
ROOT_LANDING_JTE
  HEADER
  HERO
  FEATURES
    FEATURE_1
    FEATURE_2
  COMPARISON
    COMPARE_ROW_1
    COMPARE_ROW_2
  FAQ
    FAQ_1
    FAQ_2
  CTA
  FOOTER
```

Root owns all CSS and JavaScript. Child templates own HTML and parameters only. Nested children are used for repeatable CMS editor structures such as FAQ items, comparison rows, feature rows, and cards.

## Scope

In scope:

- Add a generator contract and implementation under `docs/cms-components/lab-ui`.
- Parse normalized Markdown landing copy into an intermediate `landing.model.json`.
- Resolve the model into selected `lab-ui` blocks and a nested CMS tree.
- Emit dry-run CMS artifacts and payload JSON for root + children.
- Emit sample `PageContext` data and `enabledTemplates` for the full tree.
- Validate placeholder coverage, parameter uniqueness, child/root field boundaries, and nested tree integrity.
- Add one example copy input and expected generated output summary.

Out of scope:

- No CMS uploader or live `core-cms` writes.
- No API key, bearer token, `.env`, or credential handling beyond documenting future env names.
- No visual redesign of existing `lab-ui` blocks.
- No freeform LLM copy interpretation inside the deterministic generator.
- No real repeater abstraction unless CMS support is confirmed later.

## Core Rules

- `docs/cms-components/lab-ui` remains the durable visual/block source of truth.
- `manifest.json` and per-block `block.json` drive available blocks; hardcoded block lists are allowed only in example fixtures or explicit recipes generated from copy.
- The accepted input format is normalized Markdown with frontmatter, sections, FAQ headings, CTA links, and optional comparison tables.
- Root `BlockTemplate` must contain the bundled CSS/JS. Child and item templates must have empty `css`, `javascript`, and `head` unless an explicit exception is documented.
- Every CMS placeholder `${CODE@TYPE}` emitted into `head`, `html`, `css`, or `javascript` must have exactly one matching parameter declaration.
- Parameter codes must be deterministic and stable across re-runs for the same input.
- Repeated content uses numbered child templates, for example `FAQ_1`, `FAQ_2`, `COMPARE_ROW_1`.
- Validation must run without network access.

## Ownership Zones

- Catalog contract: `docs/cms-components/lab-ui/**/block.json`, `docs/cms-components/lab-ui/manifest.json`
- Generator scripts: `docs/cms-components/lab-ui/scripts/generate-cms-family.mjs`, `docs/cms-components/lab-ui/scripts/validate-cms-family.mjs`
- Generator docs/examples: `docs/cms-components/lab-ui/generator/**`, `docs/cms-components/lab-ui/compositions/**`
- Generated dry-run output: `docs/cms-components/lab-ui/dist/**`
- Existing block visuals: read-only unless a generator requirement exposes a real contract bug

## Wave Ledger

| slice | zone lead | owner | status | depends_on | validation | done_when |
| --- | --- | --- | --- | --- | --- | --- |
| S1 generator contract | local | executor | done | none | docs review + JSON examples parse | `generator/README.md` defines input, tree model, output, and non-goals |
| S2 copy parser | local | executor | done | S1 | parser fixture command exits 0 | `landing-copy.md` becomes deterministic `landing.model.json` |
| S3 tree resolver | local | executor | done | S2 | resolver fixture diff stable | model resolves to root + children + nested items |
| S4 artifact emitter | local | executor | done | S3 | generate command emits all expected files | root/child payloads, params, page context sample, summary are written |
| S5 validation | local | executor | done | S4 | validate command fails bad fixtures and passes example | placeholder, params, root/child boundary, enabledTemplates checks exist |
| S6 docs and example | local | executor | done | S5 | README commands run from repo root | example copy and closeout-ready usage docs exist |

## Definition of Done

- `node docs/cms-components/lab-ui/scripts/generate-manifest.mjs` passes.
- `node docs/cms-components/lab-ui/scripts/validate-lab-ui.mjs` passes with existing CSS collision warnings only.
- Example generation command succeeds:

  ```bash
  node docs/cms-components/lab-ui/scripts/generate-cms-family.mjs \
    --copy docs/cms-components/lab-ui/compositions/examples/field-service-copy.md \
    --out docs/cms-components/lab-ui/dist/field-service
  ```

- Example validation command succeeds:

  ```bash
  node docs/cms-components/lab-ui/scripts/validate-cms-family.mjs \
    --out docs/cms-components/lab-ui/dist/field-service
  ```

- Generated output contains:
  - `landing.model.json`
  - `composition.resolved.json`
  - `root.template.json`
  - `children/**/template.json`
  - `cms-family.payload.json`
  - `page-context.sample.json`
  - `parameters.json`
  - `head.html`
  - `root.css`
  - `root.js`
  - `summary.md`
- Root template owns all CSS/JS in the generated payload.
- FAQ is represented as a parent `FAQ` child with nested `FAQ_N` item children in the generated payload.
- No upload script is introduced.
- No credentials or environment files are added.
- Repo has no `package.json` or `Dockerfile`; there is no separate prod compile gate available. Node script validation is the compile/runtime gate for this wave.

## Delivery Notes

- Package creation commit: `a33901d` (`Add lab-ui CMS family generator`).
- Implementation commit: `a33901d` (`Add lab-ui CMS family generator`).
- Closeout artifacts:
  - `docs/stream-tasks/landing-copy-cms-generator-wave/audits/A1.md`
  - `docs/stream-tasks/landing-copy-cms-generator-wave/evidence/closeout.md`
