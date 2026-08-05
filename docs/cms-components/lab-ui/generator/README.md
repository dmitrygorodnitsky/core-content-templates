# lab-ui CMS Family Composer

This layer turns a landing spec into ServiceWand CMS artifacts. It can produce
local preview files and a CMS payload. Upload is handled by a separate
credentialed script and must be an explicit operator action.

## Rule

There is one structural rule:

```text
header.default
  ...any selected gallery blocks...
footer.default
```

All middle sections are selected from `manifest.json`. The composer must not
invent HTML, CSS, or JavaScript.

## Operator Input

```bash
node docs/cms-components/lab-ui/scripts/build-landing.mjs \
  --request "HVAC vertical landing, ~2500 words"
```

The wrapper writes:

```text
docs/cms-components/lab-ui/compositions/generated/<slug>.spec.json
```

Then it runs:

```text
compose-cms-family -> validate-cms-family -> render-cms-family-preview
```

## Spec Input

Lower-level command:

```bash
node docs/cms-components/lab-ui/scripts/compose-cms-family.mjs \
  --spec docs/cms-components/lab-ui/compositions/generated/hvac.spec.json \
  --out docs/cms-components/lab-ui/dist/hvac
```

Spec shape:

```json
{
  "$schema": "lab-ui/landing-spec@1",
  "code": "HVAC_LANDING",
  "name": "HVAC Landing",
  "url": "/verticals/hvac",
  "locale": "en",
  "topic": "hvac",
  "targetWords": 2500,
  "theme": "orange",
  "background": "none",
  "recipe": "medium",
  "sections": [
    "header.default",
    "hero.composite-photo",
    "features.accordion-2col-numbered",
    "section.stages-list",
    "mobile.4-card-glyph",
    "faq.bubble-light-grouped",
    "decorative.callout-band",
    "footer.default"
  ]
}
```

`sections[0]` must be `header.default`. The final section must be
`footer.default`. Every other ID must exist in `manifest.json`.

## Output

Generated files:

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

Root owns:

- `head`
- shared `css` only: tokens, reset, base typography, composition rhythm, and generic shell utilities
- shared `javascript` only: root-level idempotent shell guards/helpers
- shell `html`
- root parameters

Root `head` includes SEO parameters:

- `${ROOT_META_TITLE@LOCALIZED_STRING_SS}`
- `${ROOT_META_DESCRIPTION@LOCALIZED_STRING_SS}`
- `${SEO_LD_SCHEMA@LOCALIZED_JSON_OBJECT}` rendered inside:

```html
<script type="application/ld+json">
  ${SEO_LD_SCHEMA@LOCALIZED_JSON_OBJECT}
</script>
```

Child templates own:

- one gallery block's `block.html`, with `{{param}}` converted to CMS placeholders
- that block's own `block.css` and `block.js`
- any `depends_on.other_blocks` CSS/JS needed by that block
- parameters derived from that block's `block.json`

Child templates intentionally keep `head` empty. CSS/JS ownership stays with the
block that needs it; standalone preview files concatenate root + child assets
only as a preview convenience.

Every generated CMS parameter includes English editor metadata:

- `nls.en.NAME`
- `nls.en.DESCRIPTION`
- `options` for enum-style fields such as icon state or comparison column count

## Parameter Reuse

One CMS parameter may appear in multiple DOM locations only when those locations
represent the same semantic value. Acceptable examples:

- visible text plus `aria-label`;
- visible email plus `mailto:`;
- a comparison column name repeated in the desktop header and mobile row label.

Do not reuse one parameter for repeated visual instances that editors may change
independently. Use numbered parameters for cards, stages, axes, rows, tabs, and
capability tiles.

Examples:

- `section.axes-grid`: `axis_1_label_prefix` ... `axis_6_label_prefix`
- `section.stages-list`: `stage_1_label` ... `stage_4_label`
- `signature.ai-shell`: `cap_1_prefix` ... `cap_3_prefix`

Before upload, scan repeated `{{param}}` placeholders in source block HTML and
classify each repeat. If a repeated placeholder controls multiple independent
editor targets, fix the source block contract and rebuild the generated family.

## Image Slots

Image-like striped placeholders in the gallery are fallback states. When a block
defines an image slot, the generated CMS template emits a real CMS image
contract with image id, image name, and alt text:

```html
<img width="520" height="650" src="/core/image/${FIELD_IMAGE@IMAGE}/get/${FIELD_IMAGE_NAME@STRING}" alt="${FIELD_IMAGE_ALT@LOCALIZED_STRING_SS}">
```

Every image slot must declare either required dimensions, such as `520x650`, or
an aspect ratio, such as `4:3` or `16:9`. Prefer exact dimensions when the block
depends on a fixed crop; use aspect ratio for responsive media. The generated
parameter description must include the required dimensions/aspect ratio for CMS
editors.

If the image value is empty, CSS hides the empty image and keeps the existing
striped placeholder visible with its dimension/fallback label. Missing image
values must not show a broken image icon.

## Placeholder Content

Visible values are deterministic lorem placeholders. The operator request can
affect:

- metadata (`code`, `name`, `url`)
- theme
- recipe tier
- selected block IDs

It must not generate real landing copy. SEO/content editors fill CMS parameter
values later.

## PageContext Values

`BlockTemplate.parameters` hold template defaults. `PageContext.values` should
hold only authored page-specific overrides.

Generated `page-context.sample.json` intentionally does not copy every template
default into `values`. Local preview overlays template defaults with any
PageContext overrides, so a mostly empty PageContext still renders a complete
placeholder landing.

Canonical PageContext values are UUID-nested by block template id:

```json
{
  "<blockTemplateUuid>": {
    "<PARAM_CODE>": {
      "en": "Authored value"
    }
  }
}
```

Do not rely on flat parameter-code entries. Flat entries that equal template
defaults are not authored content and should be dropped. The uploader
canonicalizes existing PageContext values, removes default duplicates, and
preserves real nested overrides when their template bucket and parameter still
exist. During revision deployment, existing UUID-nested values are migrated to
the new template-family buckets by `PARAM_CODE`, so authored page content can
survive new `BlockTemplate` ids without copying default Lorem Ipsum values.

Migration contract:

- `PageContext.values` stores authored overrides only; generated defaults remain
  on `BlockTemplate.parameters`.
- UUID buckets are revision-specific. When a new template revision is uploaded,
  old bucket ids are expected to change.
- Values migrate by stable `PARAM_CODE`. For each old value, locate the new
  template that owns the same parameter code and write the value into that new
  template UUID bucket.
- Saved CMS `PageContext.values` have precedence over generated payload values.
  Payload values are only a seed; existing authored values win on conflicts.
  Example: if the saved page has `CTA_LABEL = "Talk to sales"` and the new
  payload has `CTA_LABEL = "Book a demo"`, the migrated page keeps
  `"Talk to sales"` in the new template UUID bucket.
- `PARAM_CODE` must be unique across the whole generated family. Duplicate
  codes are invalid because ownership cannot be inferred.
- `PARAM_CODE` must stay stable between revisions. If a field is renamed, the
  old value is intentionally dropped as unknown; do not use aliases.
- Values for removed parameters are dropped.
- Values equal to the new template default are dropped because they are not real
  overrides.
- Top-level flat values (`"PARAM_CODE": value`) are dropped. Strict mode accepts
  only UUID-nested buckets.
- After PageContext save, verify the new root template id, the new
  `enabledTemplates`, and that no old or unknown value buckets remain.

## Uploader

Uploading is deliberately separate from composition. The uploader reads
`cms-family.payload.json`, resolves each template by code, and creates or
updates only that `BlockTemplate`. It never writes parent links, include lists,
`enabledTemplates`, or a `PageContext`.

- `SERVICEWAND_API_KEY`
- `SERVICEWAND_BEARER`
- `SERVICEWAND_BASE_URL`
- `SERVICEWAND_ORG`

Example:

```bash
SERVICEWAND_API_KEY=... \
node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \
  --out docs/cms-components/lab-ui/dist/<slug> \
  --base-url https://lsrc.pixelnation.com/core \
  --org SYSTEM \
  --dry-run
```

After reviewing the dry-run output, replace `--dry-run` with `--live`. Build the
root/child relationship, include list, and PageContext manually in CMS.

Upload rules:

- Upload only after an explicit user request.
- Never paste credentials into committed files.
- Verify the live output identifies each template as `created` or `updated` by
  its code.
- Set parents, includes, enabled templates, and PageContext manually after the
  flat upload.
- Production uploads require explicit confirmation of base URL, organization,
  and every template code that may be updated.
- If production still has an old root and the requested deployment depends on a
  fresh root, stop and report the blocker.
