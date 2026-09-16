# Landing Page Agent Rules

## Responsibility Map

- `blocks/**`: authored CMS block, token, fixture, and harness sources.
- `compositions/**`: landing specs, recipes, themes, and structural mappings.
- `content/**`: repo-owned normalized copy and parameter-value overlays.
- `scripts/**`: stable build, export, validation, preview, and upload entrypoints.
- `dist/**`: generated output; never hand-edit or use as an upstream source.
- Root manifest/gallery files are generated catalog and local preview surfaces.

Repository-wide ownership is documented in
`../../docs/repository-zones/zone-catalog.md`.

## Build And Content Rules

- Compose from `blocks/**`, `compositions/**`, and `content/**` only.
- Do not use Downloads, Codex attachments, local absolute paths, or existing
  `dist/**` files as compiler inputs.
- Canonical committed landing specs belong under `compositions/specs/**`;
  ad-hoc operator specs may be written under `compositions/generated/**`.
- Generate `manifest.json` and `manifest-data.js` through
  `scripts/generate-manifest.mjs`.
- Generate manual-upload packages through their owning exporter.
- Keep output deterministic: timestamps, random staging names, and host paths
  must not enter committed artifacts.

## Operator Safety

- Do not perform live upload without explicit user permission.
- Update flows must use `--require-existing`; pin the root with
  `--expected-root-id` when its UUID is known.
- The flat uploader must not change template parents, root include markup,
  enabled templates, or PageContext.
- The flat uploader must not clear a parameter value CMS already holds. A
  package that ships a parameter empty leaves the CMS value in place; only a
  value the package actually ships is written.
- Compatibility wrappers under `docs/cms-components/lab-ui/scripts/**` contain
  forwarding logic only. Product behavior belongs here.

## Narrow Checks

Run from the repository root:

```bash
node app-templates/landing-page/scripts/generate-manifest.mjs
node app-templates/landing-page/scripts/validate-lab-ui.mjs
node app-templates/landing-page/scripts/field-service-landing-manual-check.mjs
node app-templates/landing-page/scripts/upload-cms-family-check.mjs
```
