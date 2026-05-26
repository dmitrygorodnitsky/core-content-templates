# Launch — Landing Copy CMS Generator Wave

## Mission

Implement the first deterministic generator that turns normalized landing copy into a dry-run ServiceWand CMS `BlockTemplate` family using `docs/cms-components/lab-ui` as the source of truth.

## Package Path

`docs/stream-tasks/landing-copy-cms-generator-wave/`

Source of truth:

- `master.md` for goal, decisions, ledger, and definition of done.
- `slices.md` for execution decomposition and validation.

Update `master.md` as slices close.

## Constraints

- No CMS uploader in this wave.
- No live `core-cms` writes or network-dependent validation.
- No `.env`, API keys, bearer tokens, or credentials.
- No visual redesign of existing `lab-ui` blocks.
- Historical v1 constraint: all CSS and JavaScript emitted for CMS lived on the root template.
- Next-wave superseding constraint: root CSS/JS must contain only shared page infrastructure; block-specific CSS/JS must live on the owning child template.
- Child and nested item templates must own their HTML and parameters; section children also own their block-specific CSS/JS when the selected `lab-ui` block has `block.css` or `block.js`.
- Every emitted CMS parameter must include a clear English display name and a clear English description of what it controls.
- Image slots must be generated as real `<img>` contracts with parameterized `src` and `alt`; striped placeholders are only the fallback when no `src` value is provided.
- Missing image parameters must render the existing placeholder state with expected size and fallback label, never a broken image icon.
- FAQ must support the CMS tree pattern: parent `FAQ` block with nested `FAQ_N` child item templates.
- The deterministic generator accepts normalized Markdown copy. It must not depend on an LLM to infer page structure at runtime.
- Preserve existing `lab-ui` gallery/manifest behavior.

## Required Execution Order

1. S1 generator contract.
2. S2 copy parser.
3. S3 tree resolver.
4. S4 artifact emitter.
5. S5 CMS family validation.
6. S6 docs and example.

Use `$execution-operator` semantics if delegating: one ledger, bounded ownership, close completed agents promptly. Do not run S2-S5 in parallel unless S1 is done and the implementation ownership is clearly split.

## Validation

Run from `/Users/imighty/Code/core-content-templates`.

Existing catalog checks:

```bash
node docs/cms-components/lab-ui/scripts/generate-manifest.mjs
node docs/cms-components/lab-ui/scripts/validate-lab-ui.mjs
```

Generator example:

```bash
node docs/cms-components/lab-ui/scripts/generate-cms-family.mjs \
  --copy docs/cms-components/lab-ui/compositions/examples/field-service-copy.md \
  --out docs/cms-components/lab-ui/dist/field-service
```

CMS family validation:

```bash
node docs/cms-components/lab-ui/scripts/validate-cms-family.mjs \
  --out docs/cms-components/lab-ui/dist/field-service
```

Required artifact checks:

```bash
test -f docs/cms-components/lab-ui/dist/field-service/landing.model.json
test -f docs/cms-components/lab-ui/dist/field-service/composition.resolved.json
test -f docs/cms-components/lab-ui/dist/field-service/root.template.json
test -f docs/cms-components/lab-ui/dist/field-service/cms-family.payload.json
test -f docs/cms-components/lab-ui/dist/field-service/page-context.sample.json
test -f docs/cms-components/lab-ui/dist/field-service/summary.md
```

Repo note: this repository currently has no root `package.json` or `Dockerfile`, so there is no separate production compile command available. The Node generator and validator commands are the execution gate for this wave.

## Closeout

- All ledger rows in `master.md` are `done` or explicitly `not_opened`.
- Commit hashes are recorded in `master.md` Delivery Notes.
- Add `docs/stream-tasks/landing-copy-cms-generator-wave/audits/A1.md`.
- Add `docs/stream-tasks/landing-copy-cms-generator-wave/evidence/closeout.md`.
- Final report must include:
  - generated files and paths
  - validation commands and results
  - any residual risks, especially CMS tree assumptions and CSS collision risks before live upload

## Commit / Report Expectations

- Keep package creation as a docs-only commit if committing separately.
- Prefer one implementation commit for the bounded generator if the change remains compact; split only if validation/docs become large.
- Do not include generated secrets or local environment files.
- Report result first, then validation, then residuals.
