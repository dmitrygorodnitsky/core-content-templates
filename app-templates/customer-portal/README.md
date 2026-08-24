# Customer Portal Template Family

This directory owns the reusable customer-experience family that connects four
separately deployed surfaces: public landing, authenticated customer portal,
Core Auth login, and Core Auth 2FA.

## Directory Map

| Path | Responsibility | Edit policy |
| --- | --- | --- |
| `experience/` | Family schema, parameter registry, contracts, and tenant descriptors | Canonical authored configuration |
| `runtime/` | Portal behavior, adapters, routes, state, and styles | Authored production source |
| `cms/` | Portal and public-landing CMS source contracts | Authored CMS source |
| `design-inbox/` | Accepted executable visual baseline | Immutable; user updates only |
| `design-requests/` | Missing-state briefs for the designer | Authored requests, not UI implementations |
| `content/cases/` | Domain fixtures and tenant-specific source documents | Authored domain/content evidence |
| `scripts/` | Stable build, export, and validation entrypoints | Keep paths stable; see `scripts/README.md` |
| `dist/` | Generated upload packages and previews | Never hand-edit |
| `assets/`, `public/` | Public SEO assets and source | Authored public-surface input |

All four generated family templates live only under
`dist/customer-experience/<experience-id>/`. `cms-templates/` is reserved for
independently authored reusable packages and is never an upstream or output
location for a customer-experience build.

## Family Flow

```text
experience/config + experience/descriptors
design-inbox/core-auth-login.html + core-auth-2fa.html
runtime/ + authored landing/content pipeline
                    │
                    ▼
scripts/build-customer-experience.mjs
                    │
                    ▼
dist/customer-experience/<experience-id>/
  landing/  portal/  login/  twoFactor/
```

Start with `experience/README.md` when creating or changing a family instance.
Use `ARCHITECTURE.md` for runtime behavior and `DATA-OWNERSHIP.md` for live-data
boundaries.

## Fixture Demonstration Tenants

A fixture tenant is a complete demonstration organization that the runtime
selects through `data-portal-case` while `data-portal-data-mode="fixture"`. It
opens no backend contract and is never a customer, tenant, or source-system
selector. Each one owns a case file under `runtime/data/cases/`, registers in
`runtime/data/case-fixtures.js`, and declares the `vertical` it belongs to; the
runtime refuses a case whose vertical does not match the configured one.

| case | vertical | profile | local preview | deterministic check |
| --- | --- | --- | --- | --- |
| `calm-harbor-spa` | `beauty` | `spaTarget` | `runtime/calm-harbor-spa-target.html` | `scripts/calm-harbor-fixture-check.mjs` |
| `granite-ridge-snow` | `snow` | `stormRetail` | `runtime/granite-ridge-snow.html` | `scripts/granite-ridge-fixture-check.mjs` |

Serve `runtime/` over HTTP to open a preview; the runtime is native ES modules
and does not load from `file://`.

To package a fixture tenant for CMS:

```bash
node app-templates/customer-portal/scripts/build-fixture-portal-runtime.mjs --case=granite-ridge-snow --output=app-templates/customer-portal/runtime/manual/granite-ridge-fixture-runtime.js
```

```bash
node app-templates/customer-portal/scripts/export-fixture-portal-manual.mjs --input=app-templates/customer-portal/content/cases/granite-ridge-snow.customer-portal-fixture.json --runtime=app-templates/customer-portal/runtime/manual/granite-ridge-fixture-runtime.js --output=app-templates/customer-portal/dist/manual-upload/customer-portal-granite-ridge-fixture
```

To build, package, check and upsert the snow tenant in one command, dry-run
first:

```bash
node app-templates/customer-portal/scripts/upsert-granite-ridge-portal.mjs --base-url https://dev-1.servicewand.com/core --org SYSTEM
```

```bash
SERVICEWAND_API_KEY=... node app-templates/customer-portal/scripts/upsert-granite-ridge-portal.mjs --base-url https://dev-1.servicewand.com/core --org SYSTEM --live
```

The upsert resolves `CUSTOMER_PORTAL_GRANITE_RIDGE_FIXTURE` by code and creates
it if absent, otherwise updates that same id. It never writes template parents,
include markup, enabled templates, or PageContext records; those stay manual.

### Public landing

The snow tenant also owns a public landing CMS family: one root plus 12
independently editable section blocks, all CMS-authored, with no backend call
and no PIM contract. Portal destinations are three root parameters that ship
empty; a CTA whose parameter is unset renders unavailable rather than emitting a
dead link.

```bash
node app-templates/customer-portal/scripts/export-granite-ridge-landing-blocks-manual.mjs
```

```bash
node app-templates/customer-portal/scripts/granite-ridge-landing-manual-check.mjs
node app-templates/customer-portal/scripts/portal-form-check.mjs
```

The generated family lives in
`dist/manual-upload/customer-portal-granite-ridge-landing` and uploads with the
same flat uploader as every other family; composing the children into
`ROOT_NAV` and `ROOT_SECTIONS` stays manual.

## Universal Form Document

`runtime/forms/portal-form.js` renders whatever a published Core form type
declares, in the portal design language and under the eight vertical themes. It
covers sixteen field kinds — text, textarea, password, email, tel, url, colour,
date, number, slider, boolean, select, multiselect, radio, checklist and
combobox — plus multi-step groups, input masks, per-field validation, and the
loading, empty, error, blocked, submitting, success and submit-error states.

The contract it reads:

```text
GET  {apiBase}/{locale}/core-cms/api/form-type/{FORM_TYPE_CODE}/get.json
POST {apiBase}/core-cms/api/form/submit.json
```

Both requests are anonymous. `uiBehavior` is honoured only as a declarative
`applyBehavior` mapping of value to step; server-supplied JavaScript is never
executed, unlike the shared `js/dynamic-form.js` reference client.

Two published schemas are committed under `content/form-types/` and drive the
preview and the check without a network: the live `GET_QUOTE_` snapshot and a
`PORTAL_FORM_KITCHEN_SINK` fixture that exercises every kind.

```bash
node app-templates/customer-portal/scripts/portal-form-check.mjs
```

```bash
node app-templates/customer-portal/scripts/export-portal-form-manual.mjs
```

Upload it with the same flat uploader as every other family, dry-run first:

```bash
node app-templates/customer-portal/scripts/upsert-portal-form.mjs --base-url https://dev-1.servicewand.com/core --org SYSTEM
```

```bash
SERVICEWAND_API_KEY=... node app-templates/customer-portal/scripts/upsert-portal-form.mjs --base-url https://dev-1.servicewand.com/core --org SYSTEM --require-missing --live
```

Use `--require-missing` for the first upload so it refuses if the code already
exists, and drop it for later updates. The upsert resolves
`PORTAL_FORM_DOCUMENT` by code and never writes template parents, include
markup, enabled templates, or PageContext records.

Serve `runtime/portal-form.html` to preview either schema against any theme,
mode and forced state. The generated standalone document lives in
`dist/manual-upload/portal-form-document`; its `FORM_API_BASE_URL` must be an
absolute https origin and its `FORM_ORGANIZATION_ID` a positive number, or the
submit button stays disabled.

## Focused Checks

```bash
node app-templates/customer-portal/scripts/customer-experience-wizard-check.mjs
node app-templates/customer-portal/scripts/customer-experience-config-check.mjs
node app-templates/customer-portal/scripts/customer-experience-build-check.mjs
node app-templates/customer-portal/scripts/customer-experience-login-check.mjs
node app-templates/customer-portal/scripts/customer-experience-2fa-check.mjs
node app-templates/customer-portal/scripts/config-behavior-check.mjs
node app-templates/customer-portal/scripts/calm-harbor-fixture-check.mjs
node app-templates/customer-portal/scripts/granite-ridge-fixture-check.mjs
node app-templates/customer-portal/scripts/granite-ridge-portal-manual-check.mjs
node app-templates/customer-portal/scripts/granite-ridge-landing-manual-check.mjs
```
