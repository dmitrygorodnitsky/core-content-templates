# Dynamic Pricing Blocks Wave — Slices

## Overview
This wave makes lab-ui pricing sections dynamic using the live Core PIM pricing contract already proven on:

- `https://lsrc.pixelnation.com/pricing-table`
- `https://lsrc.pixelnation.com/pricing-table-sites`
- `https://lsrc.pixelnation.com/pricing-table-routes`

The live pages POST to:

```text
/core-pim/public/SERVICEWAND/catalog/price-comparison.json
```

The executor must preserve existing visual blocks and add dynamic data behavior through a shared loader plus adapters.

## Slice 1 — Shared Runtime

Intent:
Create the reusable pricing data layer that all dynamic pricing blocks consume.

Owned paths:
- `docs/cms-components/lab-ui/14-pricing/`
- New shared JS files under a clear shared path such as `docs/cms-components/lab-ui/14-pricing/_shared/`
- Harness support files needed to load the shared runtime.

Exact task:
- Implement `ready`, config parsing, payload building, URL building, request caching, fetch, normalization, sorting, localization, text sanitization, and value formatting.
- Expose a small global namespace or module pattern compatible with plain browser harnesses, for example `window.LabPricing`.
- Normalize Core PIM response into `plans` and `groups`.
- Support mock fixtures by allowing an override such as `data-pricing-fixture-url` or an injectable fetch path for harnesses.

What not to do:
- Do not couple render adapters to raw Core PIM response internals.
- Do not add a bundler or package manager.
- Do not touch unrelated lab-ui categories.

Validation:
- Run a JS syntax check with local tools available in the repo environment.
- Prove normalization with SaaS, Sites, and Routes sample payloads, either from fixtures or live curl output captured as fixtures.

Completion signal:
- A consumer can call the runtime with a pricing section and receive normalized plans/groups or a controlled error state.

## Slice 2 — `pricing.plans-flex` Adapter

Intent:
Make plan cards populate dynamically from normalized `plans`.

Owned paths:
- `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.html`
- `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.js`
- `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.json`
- `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/harness.html`
- Shared runtime integration references needed by this block.

Exact task:
- Add dynamic data attributes to section root while preserving existing placeholders/static content.
- Keep existing billing toggle and `pricing:billing` event behavior.
- When dynamic pricing succeeds:
  - show one card per returned plan, up to existing slot capacity unless a safe dynamic clone strategy is implemented;
  - fill name, description, price amount, currency, period, custom/contact pricing, CTA URL/label, and feature list;
  - hide unused static slots;
  - preserve card state styling where possible by slot or plan code mapping.
- When dynamic pricing fails or is disabled, keep current static fallback behavior.

What not to do:
- Do not remove existing static plan parameters from `block.json`.
- Do not change global pricing event semantics.

Validation:
- Harness renders static fallback with dynamic disabled.
- Harness renders dynamic SaaS plans from fixture/live-equivalent data.
- Billing toggle still updates `data-pricing-period` and dispatches `pricing:billing`.

Completion signal:
- Plan cards are visibly and semantically populated from normalized API data with fallback intact.

## Slice 3 — `pricing.matrix-collapsible` Adapter

Intent:
Make the comparison matrix rebuild from normalized feature groups and plan values.

Owned paths:
- `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.html`
- `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.js`
- `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.json`
- `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/harness.html`
- Shared runtime integration references needed by this block.

Exact task:
- Keep outer section/header/shell design.
- On dynamic success, rebuild desktop table rows and mobile accordion contents from normalized groups.
- Map values:
  - true -> `data-state="yes"`
  - false -> `data-state="no"`
  - null/empty -> `data-state="empty"` and visual empty value
  - text/number -> `data-state="text"` with display text
- Preserve accessibility labels for yes/no/partial/empty states.
- Continue listening to `pricing:billing` for period synchronization.

What not to do:
- Do not keep matrix limited to the old fixed 12 row static parameter model in dynamic mode.
- Do not delete fallback static markup unless a fallback renderer is explicitly equivalent.

Validation:
- Dynamic SaaS fixture renders all visible API groups/rows.
- Desktop shell has plan headers and group rows.
- Mobile accordion has one details panel per dynamic plan.
- Static fallback still labels existing state cells.

Completion signal:
- Matrix dynamically reflects returned plan count and feature rows without hardcoded row slots.

## Slice 4 — Fixtures and Harness Validation

Intent:
Make validation reproducible without relying on the live API.

Owned paths:
- New fixture files under `docs/cms-components/lab-ui/14-pricing/_fixtures/`
- Pricing harness files under `docs/cms-components/lab-ui/14-pricing/**/harness.html`
- Combined preview if needed.

Exact task:
- Add compact JSON fixtures for SaaS, Sites, and Routes pricing responses.
- Wire harnesses to use fixture URLs by default.
- Add a documented way to switch to live API when running on a Core-hosted page.
- If practical, add a small browser smoke harness script that asserts:
  - plan count
  - sorted plan order
  - custom price label
  - matrix row/group rendering

What not to do:
- Do not commit huge raw API dumps if compact fixtures preserve the needed shape.
- Do not require network access for normal harness validation.

Validation:
- Open harnesses through a local static server or file URL if CORS permits fixture loading.
- Run any available node/browser smoke checks if the worker adds them.

Completion signal:
- Another agent can verify dynamic behavior offline.

## Slice 5 — Metadata and Documentation

Intent:
Expose dynamic pricing controls to CMS editors while keeping static fields as fallback.

Owned paths:
- Affected `block.json` files under `docs/cms-components/lab-ui/14-pricing/`
- Optional README/notes adjacent to pricing blocks if helpful.

Exact task:
- Add parameters:
  - `dynamic_pricing_enabled`
  - `pricing_api_base`
  - `pricing_organization`
  - `pricing_product_type_code`
  - `pricing_sort_attribute_code`
  - `pricing_price_type_code`
  - `pricing_price_attribute_code`
  - `pricing_price_attribute_values`
  - `pricing_currency`
  - `pricing_purchase_url`
  - `pricing_buy_label`
  - `pricing_contact_label`
  - `pricing_error_mode`
- Update notes to explain dynamic versus fallback fields.
- Keep JSON valid and avoid broad reformat churn where possible.

What not to do:
- Do not remove existing static editor fields.
- Do not rename established block codes.

Validation:
- `jq empty` on edited JSON files.
- Manual scan that new parameters are referenced in HTML where required.

Completion signal:
- Editors can configure Core PIM pricing without code changes.

## Dependency Order
1. Shared Runtime first.
2. Plans Adapter and Matrix Adapter can proceed in parallel after the runtime contract is stable.
3. Fixtures/Harness can proceed in parallel with adapters once runtime fixture support exists.
4. Metadata/Docs can proceed after dynamic attribute names are finalized.
5. Closeout after all implementation and validation.

## Validation Matrix

| check | required proof |
| --- | --- |
| JSON validity | `jq empty` on edited `block.json` and fixture files |
| JS syntax | `node --check` or equivalent on edited `.js` files |
| Static fallback | harness works with dynamic disabled or failed fixture |
| Dynamic SaaS plans | `pricing.plans-flex` shows Foundation/Growth/Professional/Enterprise from fixture |
| Dynamic SaaS matrix | matrix renders API groups and rows from fixture |
| Dynamic routes/sites fixtures | runtime normalizes Sites and Routes payloads |
| Cross-block billing | `pricing:billing` still updates period on plans, matrix, and credits where present |
| Responsive proof | desktop and mobile viewport check for plans and matrix |

## Closeout Requirements
- Update `master.md` ledger statuses and delivery notes.
- Create `audits/A1.md` with implementation summary, validation evidence, residual risks.
- Create `evidence/closeout.md` with key files, behavior summary, and exact commands/checks run.
- Explicitly state whether a prod compile command exists. Current package intake found no `package.json`, Dockerfile, or CI build config in this repo.
