# Closeout Evidence — Customer Portal Runtime Program

Date: 2026-07-09

## Outcome

Customer portal runtime program completed locally through S6. The result is a
CMS-compatible customer portal template with accepted design transfer, modular
runtime architecture, vertical profiles/themes, guarded routing, normalized
fixture modules, command dispatch, PIM live adapter support for pricing/products,
and generated CMS preview.

## Key Files

- `app-templates/customer-portal/ARCHITECTURE.md`
- `app-templates/customer-portal/runtime/source.html`
- `app-templates/customer-portal/runtime/src/config.js`
- `app-templates/customer-portal/runtime/src/router.js`
- `app-templates/customer-portal/runtime/src/portal-runtime.js`
- `app-templates/customer-portal/runtime/src/modules/index.js`
- `app-templates/customer-portal/runtime/src/adapters/fixture-adapter.js`
- `app-templates/customer-portal/runtime/src/adapters/core-pim-adapter.js`
- `app-templates/customer-portal/runtime/src/normalizers/index.js`
- `app-templates/customer-portal/cms/block.json`
- `app-templates/customer-portal/cms/root-template.html`
- `app-templates/customer-portal/dist/customer-portal-preview.html`
- `app-templates/customer-portal/scripts/route-smoke.mjs`
- `app-templates/customer-portal/scripts/pim-adapter-check.mjs`
- `app-templates/customer-portal/scripts/export-cms.mjs`

## Commit Trail

- `6ff130a` — Strengthen customer portal runtime contract
- `204b331` — Add customer portal runtime scaffold
- `e89557a` — Add customer portal config router guards
- `446f5e2` — Add customer portal fixture runtime modules
- `a2e5f6b` — Add customer portal PIM live adapter
- `c97b046` — Add customer portal CMS export package

## Behavioral Proof

- All 15 accepted routes render in runtime.
- Generated CMS preview boots through the same route smoke harness.
- Snow Removal/stormOps proves storm home, storm calendar, and weather-card
  order detail.
- HVAC/onDemand proves month calendar and commerce routes.
- Unknown, disabled, and unauthenticated route paths resolve deliberately.
- User light/dark toggle is preserved across re-render.
- All opened modules load normalized fixture data into `state.moduleData`.
- Command assertions cover proposal, weather, access, service request, support,
  checkout, cart, profile, and activity flows.
- Empty support message and empty checkout fail honestly; no mock success path.
- Core PIM adapter normalizes existing lab-ui SaaS fixture for pricing/products.
- CMS root emits `data-portal-auth-mode` from `portal_auth_mode`.

## Residuals

- Non-PIM live adapters remain `not_opened` pending endpoint contracts.
- No production CMS upload was performed.
- No repo-level prod compile command exists; validation used the strongest local
  checks available for this no-build template.
