# lab-ui CMS Family Composer

This layer turns a landing spec into dry-run ServiceWand CMS artifacts.

It does not upload to CMS. It produces files that can later feed a separate,
credentialed uploader.

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

## Future Uploader

Uploading is deliberately out of scope for this composer. A future uploader
should read `cms-family.payload.json` and use environment-driven credentials
only:

- `SERVICEWAND_API_KEY`
- `SERVICEWAND_BEARER`
- `SERVICEWAND_BASE_URL`
- `SERVICEWAND_ORG`
