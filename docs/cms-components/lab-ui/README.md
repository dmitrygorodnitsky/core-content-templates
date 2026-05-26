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

## CMS Family Composer

The dry-run composer lives under `generator/` and `scripts/`. It accepts an
operator request or explicit landing spec and emits a root + children CMS family
without uploading anything to CMS.

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

## Next Layer

Do not add a CMS uploader here yet. The next layer is a generator:

```text
manifest.json + block.json contracts
  -> selected block catalog
  -> CMS fragment HTML/CSS/JS
  -> parameter map / BlockTemplate artifacts
```

The generator should keep text and URLs parameterized with the current CMS
placeholder model and avoid introducing repeater semantics until CMS supports
them in the editor/runtime.
