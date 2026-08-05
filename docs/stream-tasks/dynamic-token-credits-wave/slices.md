# Dynamic Token Credits Wave — Slices

## Overview
The previous dynamic pricing wave added a shared runtime and fixtures for SaaS, Sites, and Routes payloads. This wave connects the remaining token-specific block, `pricing.credits-meter`, to that runtime.

Current state:
- `pricing.credits-meter/block.js` only mirrors `pricing:billing`.
- `pricing.credits-meter/block.html` contains static allowance rows and token pack cards.
- `docs/cms-components/lab-ui/14-pricing/_fixtures/routes.json` contains routing-token products from the live `SERVICEWAND_SAAS_ROUTING_TOKENS` contract.
- `window.LabPricing` already normalizes plans/groups and can load fixtures.

## Slice 1 — Credits Adapter

Intent:
Render `pricing.credits-meter` dynamically from normalized routing-token data.

Owned paths:
- `docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.js`
- `docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.html`
- Tiny generic shared runtime helper only if strictly necessary:
  - `docs/cms-components/lab-ui/14-pricing/_shared/pricing-runtime.js`

Exact task:
- Keep the existing billing listener.
- Add dynamic init when `data-pricing-dynamic="true"` and `window.LabPricing` is available.
- Load normalized pricing through `window.LabPricing.load(section)`.
- Interpret normalized routing-token plans as token pack/rate rows:
  - plan/product name -> pack/tier name
  - price amount/currency -> per-unit or displayed price/rate, based on available fixture/API data
  - `ROUTING_TOKENS` attribute value -> token amount/capacity
  - custom/contact price -> contact/negotiated label
- Preserve static fallback when disabled, error, or no data.
- Set section state attributes such as `data-pricing-state="dynamic|fallback"` and `data-pricing-error` on failures, matching patterns from other dynamic pricing blocks.

What not to do:
- Do not rebuild the whole visual design.
- Do not duplicate fetch/payload code.
- Do not remove the static allowance/pack markup unless dynamic rendering has an equivalent fallback-safe replacement.

Validation:
- `node --check docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.js`
- Browser/DOM proof that dynamic mode renders routing token packs from `routes.json`.

Completion signal:
- The token pack surface changes from static CMS values to route fixture values in dynamic mode.

## Slice 2 — Metadata and Dynamic Config

Intent:
Expose dynamic token pricing configuration in CMS metadata.

Owned paths:
- `docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.json`

Exact task:
- Add parameters aligned with plans/matrix where useful:
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
- Defaults should target routing tokens:
  - `SERVICEWAND_SAAS_ROUTING_TOKENS`
  - `PER_UNIT`
  - `UNIT_PRICE`
  - `3,4,4.5,5`
  - `CAD`
- Notes must clarify that static allowance/pack fields are fallback/editor preview.

What not to do:
- Do not remove existing static parameters.
- Avoid broad JSON reformat churn beyond what is necessary.

Validation:
- `jq empty docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.json`

Completion signal:
- Editors can configure token pricing source without code edits.

## Slice 3 — Harness and Offline Validation

Intent:
Make credits-meter dynamic behavior testable without live API access.

Owned paths:
- `docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/harness.html`
- `docs/cms-components/lab-ui/14-pricing/_combined-preview.html` only if required to include runtime before credits script or exercise dynamic credits safely.

Exact task:
- Load `../_shared/pricing-runtime.js` before `block.js` in credits harness.
- Add dynamic data attributes to the harness section:
  - `data-pricing-dynamic="true"`
  - `data-pricing-fixture-url="../_fixtures/routes.json"`
  - routing-token product/price config.
- Support query modes matching other pricing harnesses:
  - default dynamic
  - `?mode=fallback`
  - `?mode=error`
- If combined preview should test dynamic credits, load runtime and route fixture for credits there as well; otherwise preserve billing sync proof.

What not to do:
- Do not require network access for the default harness.
- Do not break existing combined preview.

Validation:
- Open via static server from `docs/cms-components/lab-ui/`.
- Verify dynamic mode has `data-pricing-state="dynamic"` and token pack content from routes fixture.
- Verify fallback mode keeps static content.
- Verify error mode records error and keeps static content.
- Verify billing event still sets `data-pricing-period="annual"` after the plans toggle is clicked.

Completion signal:
- Credits dynamic/fallback/error states are reproducible locally.

## Slice 4 — Closeout

Intent:
Record what changed and how it was validated.

Owned paths:
- `docs/stream-tasks/dynamic-token-credits-wave/master.md`
- `docs/stream-tasks/dynamic-token-credits-wave/audits/A1.md`
- `docs/stream-tasks/dynamic-token-credits-wave/evidence/closeout.md`

Exact task:
- Update ledger rows to `done` or `not_opened`.
- Record changed files and validation commands/results.
- State residual deployment risks, especially script load order.
- No commit unless explicitly requested.

Validation:
- Closeout files exist and match completed work.

Completion signal:
- Package can be audited without chat context.

## Dependency Order
1. Credits Adapter and Metadata can proceed after reading existing runtime contract.
2. Harness follows Adapter once attribute names and behavior are finalized.
3. Closeout follows validation.

## Validation Matrix

| check | required proof |
| --- | --- |
| JSON validity | `jq empty pricing.credits-meter/block.json` |
| JS syntax | `node --check pricing.credits-meter/block.js` and any shared runtime edit |
| Dynamic routes fixture | credits harness renders routing token products from `routes.json` |
| Fallback | `?mode=fallback` keeps static credits/token content |
| Error handling | `?mode=error` falls back and records error state |
| Billing sync | combined preview or credits harness proves annual event updates `data-pricing-period` |
| Runtime reuse | no duplicated fetch/payload implementation in credits adapter |
