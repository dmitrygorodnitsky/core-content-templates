# lab-ui CMS Family Generator

This generator layer turns normalized landing copy into dry-run the platform CMS artifacts.

It does not upload to CMS. It produces files that can later feed a separate, credentialed uploader.

## Input

The primary input is structured Markdown copy:

```text
docs/cms-components/lab-ui/compositions/examples/sample-landing-copy.md
```

Expected shape:

- frontmatter with `code`, `name`, `url`, `locale`, `theme`, and optional `background`
- first `#` heading as hero title
- first body paragraphs as hero lead copy
- first one or two markdown links as hero CTAs
- `## Features` with intro paragraphs and `###` feature items
- `## Comparison` with optional intro paragraph and a markdown table
- `## FAQ` with `###` question headings and answer paragraphs
- `## Final CTA` with paragraph copy and a markdown link

This is intentionally normalized copy. Freeform briefs should be normalized into this shape before running the deterministic generator.

## Output

Example command:

```bash
node docs/cms-components/lab-ui/scripts/generate-cms-family.mjs \
  --copy docs/cms-components/lab-ui/compositions/examples/sample-landing-copy.md \
  --out docs/cms-components/lab-ui/dist/sample-landing
```

Generated files:

```text
landing.model.json
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
```

Validate the output:

```bash
node docs/cms-components/lab-ui/scripts/validate-cms-family.mjs \
  --out docs/cms-components/lab-ui/dist/sample-landing
```

## CMS Tree Model

The generator emits a CMS-native family:

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

Root owns:

- `head`
- bundled `css`
- bundled `javascript`
- shell `html`
- root parameters

Child templates own:

- section or item `html`
- section or item `parameters`

Child templates intentionally have empty `head`, `css`, and `javascript` so the page does not duplicate runtime assets.

## Repeatable Content

CMS repeater support is not assumed. Repeatable content is projected into nested children:

- FAQ parent + `FAQ_N`
- comparison parent + `COMPARE_ROW_N`
- features parent + `FEATURE_N`

The generated parent HTML includes a named child-slot comment such as:

```html
<!-- cms-child-slot:FAQ_ITEMS -->
```

The uploader/rendering adapter can later replace that marker with the CMS-specific child render directive.

## Future Uploader

Uploading is deliberately out of scope for this generator. A future uploader should read `cms-family.payload.json` and use environment-driven credentials only:

- `LANDING_API_KEY`
- `LANDING_BEARER`
- `LANDING_BASE_URL`
- `LANDING_ORG`

Preview shape after creating a template:

```text
/page-context/0/preview.html?templateId=<templateId>&enabledTemplates=<templateId>
```
