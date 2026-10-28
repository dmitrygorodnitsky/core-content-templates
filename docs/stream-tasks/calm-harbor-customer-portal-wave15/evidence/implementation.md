# Wave 15 Implementation Evidence

Status: implemented and verified

## Productization

- Transferred the Wave 15 Account, Purchases, Purchase Detail, My Plan, Shop,
  Cart, simulated Checkout, confirmation, and booking-review presentation into
  the modular runtime without editing `design-inbox/**`.
- Added `spaStaging` and `spaTarget` capability profiles and the Account,
  Purchases, Plan, Cart, Checkout, and OIDC routes.
- Preserved the live User → `SPA_CUSTOMER` Account → Account-scoped Orders
  adapter path. Foreign Orders and missing Account scope continue to fail closed.
- Added a target fixture harness at `runtime/calm-harbor-spa-target.html`.
- Kept the uploadable CMS staging package at `current-staging` and
  `booking=closed`, while opening `retail-commerce-open` as an explicitly
  simulated demo flow. Its Account overview still marks Purchases, My plan,
  Profile, and Support unavailable instead of rendering fixture data.

## Payment Boundary

- Checkout is explicitly `SIMULATED` and states that no charge is made.
- No card entry, saved payment method, PSP redirect, paid Invoice, receipt,
  BalanceTransaction, or refund-success treatment is present.
- Confirmation is rendered only from the authoritative demo readback model.

## Verification

- `calm-harbor-wave15-runtime-check.mjs`: passed.
- `calm-harbor-customer-portal-manual-check.mjs`: passed.
- `calm-harbor-portal-manual-check.mjs`: passed.
- `config-behavior-check.mjs`: passed.
- `s7-route-state-check.mjs`: 69 route/profile attempts and 59 executable state
  probes passed.
- `activation-contract-check.mjs`: passed.
- Core Account and Core Orders adapter checks: passed.
- Visual acceptance: 12 paired surfaces at 390 and 1180 pixels; maximum x and
  width drift were both 0 pixels. See `visual-report.json` and `screenshots/`.
- CMS upload dry run: one root template,
  `CUSTOMER_PORTAL_CALM_HARBOR_STAGING`; no network writes performed.

## Residual Boundary

Purchases, personal plans, persistent server Cart, and booking mutations remain
target-only until their customer-scoped backend APIs are available and
activated. The staging CMS package opens only a local, clearly labelled retail
simulation: `Buy` → review → acknowledgement → confirmation. It never presents
that confirmation as a paid or backend-persisted Order.
