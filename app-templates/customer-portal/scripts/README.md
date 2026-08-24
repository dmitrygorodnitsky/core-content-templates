# Customer Portal Scripts

This directory is intentionally a flat, stable CLI surface. Internal source is
organized elsewhere; script paths stay stable for documentation, skills, CI,
and operator commands.

| Prefix or entrypoint | Purpose |
| --- | --- |
| `customer-experience-*`, `create-customer-experience.mjs`, `build-customer-experience.mjs` | Configure, compile, and validate the four-surface family |
| `export-*`, `generate-*`, `build-calm-harbor-target-runtime.mjs` | Generate owned runtime/CMS artifacts |
| `build-fixture-portal-runtime.mjs`, `export-fixture-portal-manual.mjs` | Compile and package a fixture-only demonstration portal for one registered case |
| `upsert-*.mjs` | One operator entrypoint per deliverable: build, export, check, then create-or-update the BlockTemplate by code |
| `export-*-landing-blocks-manual.mjs` | Compile a tenant public landing into a CMS family: one root plus independently editable section blocks |
| `export-portal-form-manual.mjs`, `portal-form-check.mjs` | Compile and guard the universal Core form document rendered in the portal design language |
| `core-*-adapter-check.mjs`, `pim-adapter-check.mjs` | Deterministic adapter contracts |
| `core-*-live-check.mjs` | Explicit live staging probes; may create real records |
| `*-visual-check.mjs`, `visual-acceptance.mjs` | Browser-based visual evidence |
| `s6-*`, `s7-*`, `config-behavior-check.mjs`, `route-smoke.mjs` | Broad CMS/runtime regression gates |

Generated output must be changed through its owning build/export script, never
by editing `../dist/` directly. Builders must not read `../dist/` or a generated
tenant package as an upstream source.

`granite-ridge-fixture-check.mjs` and `calm-harbor-fixture-check.mjs` pin one
demonstration tenant each. They assert that the case fixture, the profile it
selects, every fixture adapter payload, and the case-vertical guard stay
coherent without a browser.

The fixture portal pair is generic. `build-fixture-portal-runtime.mjs` bundles
`runtime/src/app.js` with the fixture data modules left in place, the opposite
of `build-calm-harbor-target-runtime.mjs`, and refuses to emit a bundle that
does not contain its case. `export-fixture-portal-manual.mjs` refuses any
source that leaves fixture mode, claims an authentication contract, carries an
`account`/`pim`/`auth` block, enables a module its profile does not own, or
enables products without checkout.

`upsert-granite-ridge-portal.mjs` chains the four steps for the snow tenant and
is dry-run by default. `--live` refuses to run without an explicit `--base-url`,
and `--skip-build` verifies the package on disk still matches the sha256 digests
in its own manifest, so a hand-edited package is refused rather than uploaded.
The upsert itself is delegated to `../../landing-page/scripts/upload-cms-family.mjs`,
which resolves the template by code and never writes template parents, include
markup, enabled templates, or PageContext records.

`granite-ridge-portal-manual-check.mjs` re-exports the package into a throwaway
directory and asserts the fixture invariants: a JTE-safe parameter-free root, no
service base, no OIDC contract, no tenant organization, a noindex head, and an
exporter that still refuses live data mode, an escape from `dist/manual-upload/`,
and products without checkout.

`granite-ridge-landing-manual-check.mjs` guards the snow landing family. It
re-exports into a throwaway directory and asserts that every child records the
root as its parent, that every declared parameter is referenced and every
referenced parameter is declared, that no block calls a backend or names a Core
service or a deployment host, that the three portal destinations ship empty and
fail closed, and that the runtime URL guard accepts only absolute https.

`upsert-portal-form.mjs` chains regenerate, check and upsert for the form
document and is dry-run by default. Beyond the shared staleness gate it refuses
to upload a package whose `FORM_API_BASE_URL`, `FORM_TYPE_CODE` or
`FORM_ORGANIZATION_ID` carries a value: a deployment target belongs in CMS, not
baked into the uploaded template.

`portal-form-check.mjs` loads `runtime/forms/portal-form.js` in an isolated
`vm` context and asserts the whole field contract without a browser: the Java
class to field-type mapping, every `inputFormat` token including masks that
contain spaces, mask application and completeness, `attributeOrder` winning over
`attributeGroups`, inherited attributes keeping their parent type id,
`visible:false` being skipped while ungrouped attributes still render, locale
fallback, and that all sixteen renderable kinds appear in the committed
fixture. It also refuses a renderer that gains `new Function`, `eval` or
`innerHTML`, and a stylesheet that hardcodes a colour instead of using a portal
token.

`customer-experience-login-check.mjs` and
`customer-experience-2fa-check.mjs` protect the accepted Core Auth transfer
contracts. Their visual companions require Playwright and compare accepted and
compiled pages with a strict zero-diff gate.
