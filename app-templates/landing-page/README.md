# Landing Page Build System

This application/tooling zone owns normalized CMS landing blocks, composition
specs, repo-owned content, compiler and operator entrypoints, previews, and
generated CMS families. Generated families stay under this application's
`dist/**`; they are not independently authored `cms-templates/**` packages.

## Current Shape

- `manifest.json` is generated from every block's `block.json`.
- `manifest-data.js` mirrors the manifest for local `file://` pages.
- `gallery.html` renders live block harnesses from the manifest and cache-busts
  iframe URLs on each load.
- `index.html` is a thin entry point over the same manifest.
- `blocks/00-tokens/` contains canonical tokens.
- Numbered directories under `blocks/` contain normalized block sources.
- `compositions/` and `content/` are portable compiler inputs.
- `scripts/` is the stable operator CLI surface.
- `dist/` is generated and must never be edited by hand.

Each block directory contains:

- `block.html`
- `block.css`
- `block.json`
- `block.js` when needed
- `harness.html`
- `preview-1440.png`
- `preview-390.png`

## Commands

Run from the repository root:

```bash
node app-templates/landing-page/scripts/generate-manifest.mjs
node app-templates/landing-page/scripts/validate-lab-ui.mjs
```

Open `index.html` or `gallery.html` locally after generating the manifest.

## Optional Section Background Preview

Full section blocks may declare an optional `background` contract in
`block.json`. This is metadata for the future CMS generator, not an uploader.
Supported preview modes are:

```text
?bg=none
?bg=gradient
?bg=image
?bg=image&bgImage=<encoded-image-url>
```

`gallery.html` exposes the same modes in the Background control and passes the
query params only to blocks whose manifest entry has `background.optional`.
Image backgrounds are decorative and separate from content media slots such as
hero photos, card images, or signature side-panel screenshots.

## CMS Family Composer And Uploader

The composer lives under `scripts/`. It accepts an operator
request or explicit landing spec and emits a root + children CMS family. Upload
is supported by a separate script, but must be an explicit operator action.

The only structural invariant is:

```text
header.default
  ...any selected gallery blocks...
footer.default
```

Everything between header and footer is selected from `manifest.json`.

Operator-style flow:

```bash
node app-templates/landing-page/scripts/build-landing.mjs \
  --request "HVAC vertical landing, ~2500 words"
```

This writes a generated spec file under
`app-templates/landing-page/compositions/generated/`, then runs composition,
validation, and preview rendering.

Explicit block override:

```bash
node app-templates/landing-page/scripts/build-landing.mjs \
  --topic hvac \
  --sections hero.composite-photo,features.card-grid-4,section.axes-grid,faq.bubble-light-grouped
```

Lower-level flow:

```bash
node app-templates/landing-page/scripts/compose-cms-family.mjs \
  --spec app-templates/landing-page/compositions/generated/hvac.spec.json \
  --out app-templates/landing-page/dist/hvac

node app-templates/landing-page/scripts/validate-cms-family.mjs \
  --out app-templates/landing-page/dist/hvac
```

The generated root template owns `head`, shared CSS/JS infrastructure, shell
HTML, and root parameters. Section children own their block HTML, block-specific
CSS/JS, dependency CSS/JS, and block parameters.

See `app-templates/landing-page/COMPILER.md` for the spec format, tree
model, and generated artifact layout.

## Field Service Operations

Field Service has stable export and verification entrypoints. Both commands
read only the repo-owned spec and content pack; generated `dist/**` is never an
upstream source.

```bash
node app-templates/landing-page/scripts/export-field-service-landing-manual.mjs
node app-templates/landing-page/scripts/field-service-landing-manual-check.mjs
```

The exporter writes `dist/manual-upload/field-service-operations`, validates
the CMS family contract, renders `preview.html`, and emits
`cms-family.payload.json`. The check rebuilds twice and requires byte-for-byte
determinism, the expected template order, resolved CMS markers, portable paths,
and a `dev-1`/`SYSTEM` offline dry-run-ready payload through the legacy CLI
facade.

The complete operator flow mirrors Calm Harbor while retaining the stronger
update guard for the existing Field Service family:

```bash
node app-templates/landing-page/scripts/export-field-service-landing-manual.mjs
node app-templates/landing-page/scripts/field-service-landing-manual-check.mjs

SERVICEWAND_API_KEY="$SERVICEWAND_API_KEY" \
node app-templates/landing-page/scripts/upload-cms-family.mjs \
  --out app-templates/landing-page/dist/manual-upload/field-service-operations \
  --base-url https://dev-1.servicewand.com/core \
  --org SYSTEM \
  --require-existing \
  --dry-run
```

The compatibility path `docs/cms-components/lab-ui/scripts/upload-cms-family.mjs`
may be substituted for the canonical uploader above. Review the resolved IDs
for all 15 templates, then use the identical command with `--live` only after
explicit approval. An empty `SERVICEWAND_API_KEY` is not a valid live upload.
Root/child relationships, parent links, includes, enabled templates, and
PageContext remain manual CMS work; this flow neither requires a root UUID nor
writes those fields.

## CMS Parameter Contract

Every editable text, URL, image id, image name, alt text, icon state, and option
is represented as a CMS parameter. Visible placeholder copy should remain
`Lorem Ipsum` until SEO/content editors author real values in CMS.

Parameter reuse is allowed only for the same semantic value in multiple DOM
locations, for example:

- visible text plus `aria-label`;
- visible email plus `mailto:`;
- comparison column names repeated in desktop and mobile labels.

Repeated visual instances that editors may change independently must use unique
numbered parameters. Do not share one parameter across multiple cards, stages,
axes, capability tiles, rows, or tabs.

Known patterns:

- `section.axes-grid` uses `axis_1_label_prefix` ... `axis_6_label_prefix`;
- `section.stages-list` uses `stage_1_label` ... `stage_4_label`;
- `signature.ai-shell` uses `cap_1_prefix` ... `cap_3_prefix`.

Before uploading a changed block, scan repeated placeholders and classify every
repeat as intentional same-value reuse or a source contract bug.

## PageContext Values

Generated template defaults live on `BlockTemplate.parameters`. Generated
`page-context.sample.json` should not copy all defaults into `values`.

`PageContext.values` is reserved for authored page-specific overrides and should
use the canonical UUID-nested shape:

```json
{
  "<blockTemplateUuid>": {
    "<PARAM_CODE>": {
      "en": "Authored value"
    }
  }
}
```

Flat values that duplicate template defaults are not authored overrides. Any
future PageContext migration must preserve real nested overrides where the
template/parameter still exists and migrate them by parameter code. The flat
uploader in this zone intentionally does not read or write PageContext.

Migration contract:

- Treat `PageContext.values` as authored overrides only; template defaults stay
  on `BlockTemplate.parameters`.
- Treat `blockTemplateUuid` buckets as revision-specific. New revision templates
  get new UUIDs, so old buckets must not be reused.
- Migrate by stable `PARAM_CODE`, not by old UUID. For each old value, find the
  new template that owns the same parameter code and write the value into that
  new UUID bucket.
- Give saved CMS `PageContext.values` precedence over generated payload values.
  Payload values are only a seed; existing authored values win on conflicts.
  Example: if the saved page has `CTA_LABEL = "Talk to sales"` and the new
  payload has `CTA_LABEL = "Book a demo"`, the migrated page keeps
  `"Talk to sales"` in the new template UUID bucket.
- Do not generate empty-string seed overrides. If a source/import has no value
  for a parameter, omit that parameter from generated `PageContext.values`
  instead of writing `""`. Empty values are preserved only when they already
  exist in saved CMS `PageContext.values`, because that means an editor cleared
  the field intentionally. The uploader applies this only to generated payload
  seed values, not to existing CMS values.
- Keep every `PARAM_CODE` unique across the whole template family. Duplicate
  codes make value ownership ambiguous and must fail validation.
- Keep `PARAM_CODE` stable between revisions. If a parameter is renamed, the old
  value is intentionally dropped as unknown; do not use aliases.
- Drop values for parameters that no longer exist in the new template family.
- Drop values that equal the new template default; they are not authored
  overrides.
- Drop top-level flat values (`"PARAM_CODE": value`). Strict mode accepts only
  UUID-nested buckets.
- After saving a migrated PageContext, verify that the page template points to
  the new root, `enabledTemplates` contains the new template ids, and `values`
  has no old or unknown UUID buckets.

Local preview renders template defaults plus PageContext overrides so an empty
sample page context can still show a complete placeholder landing.

## CMS Upload Guardrails

Use upload only when explicitly requested. Credentials must come from
environment variables, never from committed files.

`upload-cms-family.mjs` is deliberately a flat BlockTemplate uploader. It reads
`cms-family.payload.json`, resolves every template by its `code`, then creates a
missing template or updates the matching record. It does not write parent links,
root include markup, `enabledTemplates`, or `PageContext` records.

```bash
SERVICEWAND_API_KEY=... \
node app-templates/landing-page/scripts/upload-cms-family.mjs \
  --out app-templates/landing-page/dist/<slug> \
  --base-url https://lsrc.pixelnation.com/core \
  --org SYSTEM \
  --require-existing \
  --expected-root-id <uuid> \
  --dry-run
```

With `--require-existing`, dry-run authenticates for reads, resolves every code,
prints the matching IDs, and fails before writes if any template is absent.
`--expected-root-id` additionally pins the root record. After reviewing that
preflight, replace `--dry-run` with `--live` to apply. Compose the root,
set child parents, configure includes, and attach a PageContext manually in CMS.
That manual step is intentional: template relationships are not stable enough to
infer safely from an export.

Production uploads need a current-thread confirmation of:

- base URL;
- organization;
- template codes being created or updated.

Review the code list before a live upload. A matching code updates its existing
template; an absent code creates a new independent template.

### BlockTemplate Parameter Transfer

To move only `BlockTemplate.parameters` between environments, download the
source parameters first. The downloaded file is a normalized parameters array
compatible with `sync-block-template-parameters.mjs --parameters-json`.

Download from stage:

```bash
SERVICEWAND_API_KEY=<stage-token> \
node app-templates/landing-page/scripts/download-block-template-parameters.mjs \
  --template-id <stage-block-template-id> \
  --base-url https://lsrc.pixelnation.com/core \
  --org SYSTEM \
  --out tmp/stage-block-template-parameters.json
```

Apply to production with a dry run first:

```bash
SERVICEWAND_API_KEY=<prod-token> \
node app-templates/landing-page/scripts/sync-block-template-parameters.mjs \
  --template-id <prod-block-template-id> \
  --parameters-json tmp/stage-block-template-parameters.json \
  --base-url https://servicewand.com/core \
  --cms-base-url https://servicewand.com/core-cms \
  --org SYSTEM \
  --mode replace \
  --dry-run
```

If the diff is correct, repeat the same production command with `--live`.
Use `--template-code` instead of `--template-id` only when the code is unique in
the target organization.

## Locked Decisions

- Default theme is light. `blocks/00-tokens/dark.overlay.css` is parked reference for
  future dark contexts.
- `header.default` is the canonical header for hub, vertical, and product
  pages.
- Breadcrumb is an optional sublayer owned by `header.default`; keep it with
  the canonical header instead of maintaining a separate block source of truth.
- Canonical CTA blocks are `cta.btn-primary-ring` and
  `cta.btn-secondary-filled`.
- `hero.operational-diagram` is the hub default hero.
- `hero.composite-photo` is the vertical-landing hero pattern.
- `verticals.glyph-grid-20-slots` is the extensible vertical grid pattern.

## Collision Risk

Harnesses and gallery cards isolate blocks in iframes, but CMS pages will
compose several blocks in one document. Known shared/global class candidates:

- Shared primitives: `.container`, `.eyebrow`, `.btn`, `.btn-star`
- Cross-block state: `.is-open`
- Header/language composition: `.locale-selector`, `.nav-link`
- CTA/effect composition: `.btn-primary-ring`, `.btn-secondary-filled`

Before building production CMS templates, the generator layer should either
document these as shared primitives or scope emitted CSS under a page/template
namespace.

## Generator Layer

```text
manifest.json + block.json contracts
  -> selected block catalog
  -> CMS fragment HTML/CSS/JS
  -> parameter map / BlockTemplate artifacts
```

The generator keeps text and URLs parameterized with the current CMS placeholder
model and avoids introducing repeater semantics until CMS supports them in the
editor/runtime.
