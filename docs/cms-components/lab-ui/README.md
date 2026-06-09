# lab-ui — the platform CMS/UI block catalog

`lab-ui` is the durable source of truth for normalized, reusable the platform
CMS/UI landing blocks. It was promoted from `tmp/lab-ui`; the old
source-extract catalog under this path was removed because it duplicated the
block source of truth.

## Current Shape

- `manifest.json` is generated from every block's `block.json`.
- `manifest-data.js` mirrors the manifest for local `file://` pages.
- `gallery.html` renders live block harnesses from the manifest and cache-busts
  iframe URLs on each load.
- `index.html` is a thin entry point over the same manifest.
- `00-tokens/` contains canonical tokens.
- Numbered category directories contain normalized block directories.

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
node docs/cms-components/lab-ui/scripts/generate-manifest.mjs
node docs/cms-components/lab-ui/scripts/validate-lab-ui.mjs
```

Open locally:

```text
file:///Users/imighty/Code/core-content-templates/docs/cms-components/lab-ui/index.html
file:///Users/imighty/Code/core-content-templates/docs/cms-components/lab-ui/gallery.html
```

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

The composer lives under `generator/` and `scripts/`. It accepts an operator
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
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --request "HVAC vertical landing, ~2500 words"
```

This writes a generated spec file under
`docs/cms-components/lab-ui/compositions/generated/`, then runs composition,
validation, and preview rendering.

Explicit block override:

```bash
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --topic hvac \
  --sections hero.composite-photo,features.card-grid-4,section.axes-grid,faq.bubble-light-grouped
```

Lower-level flow:

```bash
node docs/cms-components/lab-ui/scripts/compose-cms-family.mjs \
  --spec docs/cms-components/lab-ui/compositions/generated/hvac.spec.json \
  --out docs/cms-components/lab-ui/dist/hvac

node docs/cms-components/lab-ui/scripts/validate-cms-family.mjs \
  --out docs/cms-components/lab-ui/dist/hvac
```

The generated root template owns `head`, shared CSS/JS infrastructure, shell
HTML, and root parameters. Section children own their block HTML, block-specific
CSS/JS, dependency CSS/JS, and block parameters.

See `docs/cms-components/lab-ui/generator/README.md` for the spec format, tree
model, and generated artifact layout.

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

Flat values that duplicate template defaults are not authored overrides. The
uploader canonicalizes existing values, drops default duplicates, and preserves
real nested overrides where the template/parameter still exists. When a page is
switched to a new template-family revision, existing UUID buckets are migrated by
parameter code into the new block-template UUID buckets.

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

For a live PageContext route, prefer revision deployment instead of updating the
existing template family in place:

```bash
SERVICEWAND_API_KEY=... \
node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \
  --out docs/cms-components/lab-ui/dist/<slug> \
  --base-url https://lsrc.pixelnation.com/core \
  --org SYSTEM \
  --root-code FIELD_SERVICE_OPERATIONS_JTE \
  --strategy revision \
  --revision-suffix 20260608_001 \
  --live
```

Revision deployment creates a new root and new child `BlockTemplate` records,
saves the root include list with the new child ids, migrates authored
`PageContext.values` into the new UUID buckets by parameter code, switches the
PageContext to the new root, and verifies that `enabledTemplates` and value
buckets point only at the new family.

Use legacy `--strategy upsert` only for first uploads, disposable tests, or an
explicitly approved in-place maintenance operation. Do not use upsert as the
default path for an already published page; it can leave root include cache,
child bodies, and PageContext values out of sync.

To upload a generated template family for inspection without applying it to a
PageContext route, use `--templates-only`. Prefer this with `revision` so the
uploaded `BlockTemplate` codes are fresh and the live page remains untouched:

```bash
SERVICEWAND_API_KEY=... \
node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \
  --out docs/cms-components/lab-ui/dist/<slug> \
  --base-url https://lsrc.pixelnation.com/core \
  --org SYSTEM \
  --root-code FIELD_SERVICE_OPERATIONS_JTE \
  --strategy revision \
  --revision-suffix 20260608_001 \
  --templates-only \
  --live
```

This creates the root and child `BlockTemplate` records, saves the root include
list, and prints a preview URL with explicit `templateId` and `enabledTemplates`.
It does not call `page-context/save.json`.

Production uploads need a current-thread confirmation of:

- base URL;
- organization;
- root/template code;
- whether an existing production template family/root has been deleted or the
  exact overwrite/reuse path is approved.

Do not upload a fresh production root over an existing production template
family unless the old root/family has been removed or the user explicitly
accepts that reuse path.

## Locked Decisions

- Default theme is light. `00-tokens/dark.overlay.css` is parked reference for
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
