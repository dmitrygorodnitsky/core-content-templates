# Closeout Evidence — Dynamic Token Credits Wave

## Result
`pricing.credits-meter` now supports opt-in dynamic routing-token pricing through the shared `window.LabPricing` runtime while preserving the original static CMS allowance and pack markup as fallback/editor preview.

## Implementation
- Added dynamic pricing data attributes to `pricing.credits-meter/block.html`.
- Added `LabPricing.parseConfig(section)` and `LabPricing.load(section)` integration to `pricing.credits-meter/block.js`.
- Rendered normalized routing-token products into the existing token pack slots:
  - product name to pack name
  - `ROUTING_TOKENS` attribute to token amount
  - price display amount/currency to per-token price
  - custom prices to contact/negotiated fallback labels
- Added CMS metadata parameters for routing-token pricing source configuration.
- Updated the credits harness to load `../_shared/pricing-runtime.js`, default to `../_fixtures/routes.json`, and support `?mode=fallback` and `?mode=error`.

## Validation Commands
```bash
jq empty docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.json
node --check docs/cms-components/lab-ui/14-pricing/pricing.credits-meter/block.js
python3 -m http.server 8765
```

## DOM Harness Evidence
Server root:
`docs/cms-components/lab-ui/`

Harness URL:
`http://127.0.0.1:8765/14-pricing/pricing.credits-meter/harness.html`

Chrome DOM checks passed:
- Dynamic mode reached `data-pricing-state="dynamic"`.
- Dynamic packs rendered in fixture sort order:
  - `SERVICEWAND_SAAS_ROUTING_EXT_FOUNDATION` — 10 tokens — `$5 CAD`
  - `SERVICEWAND_SAAS_ROUTING_EXT_GROWTH` — 20 tokens — `$4.50 CAD`
  - `SERVICEWAND_SAAS_ROUTING_EXT_PRO` — 30 tokens — `$4 CAD`
  - `SERVICEWAND_SAAS_ROUTING_EXT_ENTERPRISE` — 100 tokens — `$3 CAD`
- `?mode=fallback` reached `data-pricing-state="fallback"` and preserved static `Starter pack` content.
- `?mode=error` reached `data-pricing-state="fallback"`, preserved static content, and recorded `data-pricing-error="HTTP 404"`.
- Dispatching `pricing:billing` with `{ period: "annual" }` updated the credits section to `data-pricing-period="annual"`.

Combined preview URL:
`http://127.0.0.1:8765/14-pricing/_combined-preview.html`

Combined preview check passed:
- Before toggle, credits were `data-pricing-period="monthly"`.
- Clicking the plans annual toggle updated plans, matrix, and credits to `data-pricing-period="annual"`.
- Credits remained static in combined preview because that page does not opt into dynamic credits.

## Prod Compile
No production compile command was found. The repository scan found no root `package.json`, Dockerfile, CI workflow, Makefile, justfile, or task runner. The only build-like artifact found was `docs/cms-components/lab-ui/scripts/build-landing.mjs`, which is a standalone generator script rather than a package-level compile command.

## Residual Risks
- Live API validation was not performed; the required offline `routes.json` fixture path was validated.
- Any CMS or page preview that enables dynamic credits must load `_shared/pricing-runtime.js` before `pricing.credits-meter/block.js`.
- Existing prior-wave uncommitted changes under plans, matrix, shared runtime, and fixtures were intentionally preserved and not reverted.

## Commit
No commit was made; commits were not requested.
