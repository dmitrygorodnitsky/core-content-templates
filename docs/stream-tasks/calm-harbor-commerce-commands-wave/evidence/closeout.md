# Closeout — Calm Harbor Commerce Commands (W4)

Date: 2026-07-28. Branch `codex/lab-ui-durable-catalog`.
Environment: `CALM_HARBOR_SPA_STAGING` on `dev-1.servicewand.com`, as
`CHS_STG_ELENA_RIOS` (Account id 1) with a real customer OIDC session.

## Result

A Calm Harbor customer can fill a **server-owned** cart, see sellability that
came from Core inventory, and complete a **simulated** checkout that creates a
real `SPA_ORDER` with typed lines, confirmed only by reading the order back.
No money figure anywhere in this wave is computed by the browser.

Cancellation and return remain `not_opened`, blocked twice over — see §Residuals.

## Key files

| file | what it now owns |
| --- | --- |
| `runtime/src/adapters/core-cart-adapter.js` | every Core cart call; server money copied verbatim |
| `runtime/src/adapters/core-pim-adapter.js` | sellability from the `SPA_STOCK` join; Core product/price ids |
| `runtime/src/adapters/core-spa-demo-adapter.js` | `createCoreOrder` — the order and its `SPA_ITEM_*` lines |
| `runtime/src/adapters/core-orders-adapter.js` | `createPickupFulfillment` — the pickup dimension |
| `runtime/src/modules/index.js` | the `cart` module |
| `runtime/src/routes/SpaCartPage.js`, `spa-cart-view.js` | the bag, rendered from the live envelope |
| `runtime/src/routes/SpaCheckoutPage.js` | review and confirmation from readback |
| `runtime/src/actions.js`, `state.js` | cart and checkout commands; sellability selector |

## Behavioural summary

- **Cart.** Add, change quantity, remove and clear are Core mutations. Each
  re-reads the cart and fails by name if Core does not report the effect. A
  repeated quantity target issues no write. The bag renders `subtotal` and
  nothing else, because `subtotal` is the only figure Core states about a cart.
- **Sellability.** One field, three values, from a `SPA_STOCK` row joined by
  product id: `sellable`, `out-of-stock`, `unknown`. `unknown` closes the buy
  action without claiming an empty shelf.
- **Checkout.** Confirmation re-reads the cart, refuses on conflict, creates one
  `SPA_ORDER` with one `SPA_ITEM_*` line per item, sends no totals, and clears
  the cart only after the order reads back.
- **Pickup.** A retail order gets a `SPA_FULFILLMENT` shipment linked by
  `SOURCE_ORDER`, status in the attribute, no workflow transition attempted.

## Commands to reproduce

All from the repo root (`core-content-templates`), not the template directory.

```bash
node app-templates/customer-portal/scripts/core-cart-adapter-check.mjs
node app-templates/customer-portal/scripts/pim-adapter-check.mjs
node app-templates/customer-portal/scripts/core-pim-enrichment-check.mjs
node app-templates/customer-portal/scripts/cart-module-check.mjs
node app-templates/customer-portal/scripts/plan-module-check.mjs
node app-templates/customer-portal/scripts/core-orders-adapter-check.mjs
node app-templates/customer-portal/scripts/core-plans-adapter-check.mjs
node app-templates/customer-portal/scripts/core-spa-demo-adapter-check.mjs
node app-templates/customer-portal/scripts/core-account-adapter-check.mjs
node app-templates/customer-portal/scripts/core-user-profile-adapter-check.mjs
node app-templates/customer-portal/scripts/build-calm-harbor-target-runtime.mjs
node app-templates/customer-portal/scripts/export-calm-harbor-portal-manual.mjs
```

All twelve pass. The last two are the **release compile** — this runtime has no
bundler in the usual sense, so the esbuild step is the production build and it
also runs the fixture-leak boundary scan.

Browser suites need two environment variables first:

```bash
export PLAYWRIGHT_NODE_MODULES=/Users/imighty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
export PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

`calm-harbor-wave17-visual-check`, `calm-harbor-wave15-visual-check`,
`calm-harbor-wave17-runtime-check` and `calm-harbor-wave16-runtime-check` pass.
See `audits/A1.md` for the suites that fail and the proof they already failed at
`b808ac4`.

Live probes need a **customer** OIDC bearer — the deploy key yields an admin
session, which does not reproduce the cart's account binding. Never commit it.

```bash
SERVICEWAND_BEARER=<customer bearer> node app-templates/customer-portal/scripts/core-cart-live-check.mjs
SERVICEWAND_BEARER=<customer bearer> node app-templates/customer-portal/scripts/core-checkout-live-check.mjs
```

The second **creates a real order**. It is idempotent per
`SERVICEWAND_CHECKOUT_REF` (default `w4-live-1`), so re-running with the same ref
creates nothing.

## Live proof

Full transcripts: `c1-cart-live-transcript.json`,
`c4-c5-checkout-live-transcript.json`.

**Cart** — empty read → add `CHS_BODY_001` (`$42.00` from Core) → count 2
(`unitAmount` 42, `lineAmount` 84, `subtotal` 84, all Core's) → replay of the
same count wrote nothing → remove → clear. Foreign account 4 refused
`403 cart-forbidden`; no resolved account refused locally with
`customer-account-required` and zero calls.

**Checkout** — a two-item cart (Harbor body oil ×2 @ 42, Quiet shoulders ×1 @ 95,
subtotal 179) became `order-core-13`:

| assertion | result |
| --- | --- |
| `Order.grandTotal` | 179 |
| Σ(`amount` × `itemCount`) | 179 — **equal** |
| line types | `SPA_ITEM_RETAIL`, `SPA_ITEM_SERVICE` |
| line amounts | 42 and 95 — the server's unit prices, unmultiplied |
| replayed `requestRef` | returned the same order, created nothing |
| cart after | empty, cleared only after the readback |
| pickup record | id 3, `PICKUP`, `PENDING`, `SOURCE_ORDER` 13, no window |
| pickup replay | same record, no second write |

**Financial cleanliness.** Before and after, unchanged:
`invoice` **0 rows**, `balance-transaction` **0 rows**. `payment` and `refund`
have no endpoint at all (404). No charge, invoice, receipt, balance transaction
or refund was created, and no surface says Paid, Charged, Payment successful,
Refunded or Receipt.

Orders `order-core-11`, `12` and `13` and shipments 2 and 3 were created by these
probes and are deliberately left on staging as evidence.

## Residuals — honest

> **Correction, 2026-07-28 — residuals 2 and 3 below are superseded.** Both were
> measured before the customer role had any grants for these services, and both
> were true then. `core-svc` and `core-rm` do not refuse the customer token; that
> was a missing permission and they answer 200 now, so the pickup studio resolves
> and `locationUnresolvedReason` is no longer needed. The `core-pim` 200/401
> alternation does not reproduce — 20 consecutive calls returned 200, balanced
> across both nodes. Evidence, with the numbers and the method:
> `docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/evidence/S1a-rbac-grants-and-scope.md`.
> The rest of this section stands. Residual 1 in particular is unchanged: the
> workflow-event 500 is not a permission problem.

1. **Cancellation and return stay `not_opened`.** Two independent blockers: no
   accepted design exists for `RETURN_REQUESTED`/`RETURNED` on a purchase card
   (`../../calm-harbor-customer-portal-full-activation-program/evidence/S3.md`
   §5), and workflow event dispatch returns an opaque 500 tenant-wide
   (`…/evidence/S5.md` §4). Nothing was built against a dead endpoint.
2. **The authenticated `core-pim` API alternates 200/401 on identical
   requests.** Checkout was restructured to avoid it, but **C2's inventory
   enrichment still depends on it and will fail roughly half the time**. It
   fails closed to `unknown`, so nothing unbuyable becomes buyable — but the
   Shop will intermittently show every product as not purchasable. This is a
   backend fault and is not this wave's to fix.
3. **`core-svc` and `core-rm` refuse the customer token outright.** `core-rm` is
   why a customer-created pickup carries no `PICKUP_LOCATION`; the record says
   so via `locationUnresolvedReason` rather than looking like a missing studio.
4. **Two design requests are open and gate real states**:
   `calm-harbor-unknown-stock-shop-state.md` (the dominant live case — 10 of 12
   retail products have no inventory row) and
   `calm-harbor-cart-server-subtotal-and-fulfillment.md` (Core states only a
   subtotal, so the accepted three-row totals card cannot be filled).
5. **`core-plans-adapter.js` `codesById` builds a multi-id filter**, which Core
   ANDs into an empty result. Unreached today because a customer has one
   currency; recorded in `audits/A1.md` rather than fixed outside this wave's
   zones.
6. **Two browser suites fail** (`calm-harbor-wave15-runtime-check`,
   `route-smoke`) that were not on the package's known-bad list. Both were
   verified to fail identically at `b808ac4`, before this wave opened.
7. **No CMS upload was performed.** Rebuild and export only, as required.
