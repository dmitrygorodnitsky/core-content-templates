# Slices — Calm Harbor Commerce Commands (W4)

## Overview

Six slices. C1 is the foundation; C2 and C3 can run in parallel after it; C4
takes the shared command hotspot alone; C5 and C6 close.

Everything in this wave runs against `CALM_HARBOR_SPA_STAGING` on
`dev-1.servicewand.com`. Live probing as the customer needs the portal API key
(the deploy key in `core-ui/.env` only yields an admin session, which does **not**
reproduce the cart's account binding). Ask the user for it; never commit it.

---

## C1 — Cart adapter

**Intent.** One adapter owns every Core cart call and returns a normalized cart
whose money came from the server.

**Owned paths.** `runtime/src/adapters/core-cart-adapter.js` (new),
`scripts/core-cart-adapter-check.mjs` (new).

**Task.**
- Resolve the customer account from the session exactly as the other adapters
  do (`context.account || state.customerAccount || session.account`); refuse
  with `customer-account-required` when absent, before any call.
- Implement read, add/update item, change count, remove item, clear.
- Normalize to the accepted cart shape, taking `subtotal`, `unitAmount`,
  `lineAmount`, `itemCount` and `currency` **verbatim** from `CartView` /
  `CartItemView`.
- Map failures to named contract errors: 401 → `session-expired`, 403 →
  `cart-forbidden`, missing `accountId` 500 → `cart-account-required` (Core
  returns a raw 500 here; translate it rather than surfacing a stack trace).
- Single-flight per cart mutation; a replayed identical mutation must not double
  the quantity.

**Do not.**
- Do not compute or round any amount, including a line total you could derive.
- Do not cache the cart in `state` as the source of truth — after every mutation
  the server's returned cart replaces the local one.
- Do not send `accountId` values that came from anywhere but the resolved
  session account.

**Validation.**
- `node app-templates/customer-portal/scripts/core-cart-adapter-check.mjs`
  covering: read, add, count change, remove, clear, replay-no-double,
  401/403/no-account mapping, and an assertion that no returned money field was
  computed locally.
- Live: read the cart for `CHS_STG_ELENA_RIOS`, add `CHS_BODY_001`, verify
  `subtotal` and `lineAmount` come back from Core, then clear.
- Live negative: passing another account's id must return 403.

**Completion signal.** The check passes and a live transcript shows a cart
mutating with server-computed totals.

---

## C2 — Sellability from inventory

**Intent.** The Shop tells the truth about what can be bought.

**Owned paths.** `runtime/src/adapters/core-pim-adapter.js` (enrichment only),
`scripts/pim-adapter-check.mjs`.

**Task.**
- Join `core-pim /api/inventory/list.json` (`SPA_STOCK`) to catalog products by
  product id, and expose a normalized sellability field per product.
- A product with no inventory row has **unknown** stock, which is not the same
  as in stock — render it per the accepted design, or leave the buy action
  closed if the design has no treatment. Do not assume availability.
- `CHS_SKIN_002` (count 0) must be unbuyable; `CHS_BODY_001` (count 12) buyable.

**Do not.**
- Do not infer stock from price presence, product state, or anything but the
  inventory row.
- Do not invent a low-stock threshold or badge that the accepted design does not
  define — if you want one, it goes to `design-requests/`.

**Validation.** Extended `pim-adapter-check.mjs` with an in-stock, a zero-stock
and a no-row product. Run it **from the repo root** — it resolves fixtures
relative to the repo, not the template dir.

**Completion signal.** Sellability comes only from server stock, with the
zero-stock case proven.

---

## C3 — Cart presentation

**Intent.** The accepted cart states render from the live envelope.

**Owned paths.** `runtime/src/routes/SpaCartPage.js`, and `state.js` **only** for
the selector that reads `state.moduleData.cart`.

**Task.**
- Follow the pattern already used by Purchases and Plan: `live ?
  state.moduleData.cart : fixtures`, page state from `state.moduleStatus.cart`
  first, and nothing rendered from fixtures in live mode.
- Register a `cart` module in `runtime/src/modules/index.js` selecting the C1
  adapter in live mode and an inert empty envelope otherwise.

**Do not.**
- Do not touch `actions.js` in this slice — C4 owns it.
- Do not invent an empty-cart, error, or conflict treatment. If the accepted
  design lacks one, raise it in `design-requests/` and leave the state gated.

**Validation.** A browser-free module check in the shape of
`scripts/plan-module-check.mjs`: module registered, live adapter selected,
fixture path inert, failure envelopes mapped, selector reads the live envelope
and shows nothing when unloaded.

**Completion signal.** Cart renders live, and an unloaded module shows nothing
rather than fixture lines.

---

## C4 — Checkout

**Intent.** Confirming creates a real Order and says so only from readback.

**Owned paths.** `runtime/src/actions.js`, `runtime/src/state.js`,
`runtime/src/adapters/core-spa-demo-adapter.js` (`createCoreOrder`),
`runtime/src/routes/SpaCheckoutPage.js`. **This slice owns the shared hotspot —
nothing else may edit `actions.js` while it runs.**

**Task.**
- Re-read the server cart at confirmation. If it differs from what the customer
  reviewed, surface the accepted conflict treatment; do not proceed silently.
- Create one `SPA_ORDER` with a `SPA_ITEM_*` line per cart item: `itemPrice`
  from the cart item's `priceId`, `amount` = the server's `unitAmount`,
  `itemCount` = the cart count. Send **no** order totals.
- Keep `createCoreOrder`'s existing behaviour: references resolved by code,
  `RECORD_CODE` identity, replay returns the existing order.
- Clear the server cart only after the order readback confirms.
- Success renders from the Order readback. On failure the cart stays intact.

**Do not.**
- Do not create any payment, invoice, or balance record.
- Do not write `grandTotal`, `totalCharges`, or `totalTaxes`.
- Do not treat the save response id as proof — re-read the order.
- Do not reuse a neighbouring order as a template.

**Validation.**
- `core-spa-demo-adapter-check.mjs` extended: multi-line order from a cart,
  amounts equal the server `unitAmount`, no totals in the save body, replay
  creates nothing, conflict path, and cart cleared only after readback.
- Live: check out a two-item cart, then assert `grandTotal` equals
  Σ(`amount` × `itemCount`) and that `invoice` and `balance-transaction` are
  still empty.

**Completion signal.** A live order exists with correct typed lines and
server-computed total, and a replay adds nothing.

---

## C5 — Pickup fulfillment record

**Intent.** A retail order carries its pickup record, joined the way the model
requires.

**Owned paths.** `runtime/src/adapters/core-orders-adapter.js`, seed if needed.

**Task.**
- If the accepted design shows fulfillment at confirmation, create the
  `SPA_FULFILLMENT` shipment with `FULFILLMENT_KIND=PICKUP`,
  `FULFILLMENT_STATUS`, the window, `PICKUP_LOCATION`, and `SOURCE_ORDER`.
- Remember `Shipment` has **no** order relation and **never receives an initial
  workflow state**; status lives in the attribute, and `send-event` on a
  shipment 500s. Do not attempt a transition.

**Do not.** Do not invent a pickup window if the design or the studio data does
not supply one — an absent window renders as absent.

**Validation.** Orders-adapter check already covers the join and the
"another order's shipment must not attach" case; extend for a shipment created
by checkout.

**Completion signal.** A retail order created by checkout reads back with its
pickup dimension.

---

## C6 — Evidence

**Intent.** The wave is provable later without this chat.

**Owned paths.** `docs/stream-tasks/calm-harbor-commerce-commands-wave/evidence/`,
`audits/A1.md`, and the parent program's `master.md` delivery notes.

**Task.** Record: exact commands run, the live transcripts, what each check
proves, the financial-cleanliness assertion, and honest residuals — including
cancel/return still `not_opened` with both blockers cited.

**Validation.** Someone who was not here can re-run every command from the file.

---

## Dependency order

```
C1 ──┬── C2        (parallel)
     └── C3        (parallel)
            └── C4 (sequential — owns actions.js/state.js alone)
                   └── C5 ── C6
```

## Validation matrix

| slice | command | proves |
| --- | --- | --- |
| C1 | `node app-templates/customer-portal/scripts/core-cart-adapter-check.mjs` | cart IO, server money, error mapping, replay |
| C2 | `node app-templates/customer-portal/scripts/pim-adapter-check.mjs` | stock truth incl. zero and unknown |
| C3 | `node app-templates/customer-portal/scripts/cart-module-check.mjs` | wiring, no fixture fallback |
| C4 | `node app-templates/customer-portal/scripts/core-spa-demo-adapter-check.mjs` | order from cart, replay, conflict, readback |
| C5 | `node app-templates/customer-portal/scripts/core-orders-adapter-check.mjs` | fulfillment join |
| all | `node app-templates/customer-portal/scripts/build-calm-harbor-target-runtime.mjs` | **release compile** — the esbuild bundle plus the fixture-leak boundary scan. This is the prod build for this no-bundler runtime; a check suite passing does not prove the bundle builds. |
| all | `node app-templates/customer-portal/scripts/export-calm-harbor-portal-manual.mjs` | the CMS package still assembles and validates |

Run every command from the **repo root** (`core-content-templates`), not from
the template directory — several scripts resolve paths relative to the root.

**Cannot run in this environment:** anything requiring Playwright —
`config-behavior-check.mjs`, `s7-route-state-check.mjs`, the per-wave visual
suites, `calm-harbor-customer-portal-manual-check.mjs`. Pixel and route-state
acceptance are therefore **unrun, not passed**, and must execute where Playwright
is installed before W6 claims visual parity. Say so in the evidence rather than
implying coverage.

## Operator notes

Status vocabulary is the canonical one: `todo` · `in_progress` · `blocked` ·
`done` · `not_opened` · `stale`. A delegated slice with no forward motion is
`stale` — redirect it with one narrower `Agent` call or close it; never leave it
drifting.

C2 and C3 are the only genuinely parallel pair. C4 owns `actions.js` and
`state.js` alone — if a parallel agent touches either, stop the overlap, decide
`re-slice` / `integrate-local` / `drop-one-result`, and record the decision in
the ledger.

Full delegation rules — budget, the mandatory ambiguity line, prompt shape,
first-spawn retry, background lifecycle SLA — are in `launch-prompt.md`
§Delegation protocol.

## Closeout requirements

- Every ledger row `done` or `not_opened` with a reason.
- `audits/A1.md`: what landed, what was validated, residuals.
- `evidence/closeout.md`: result, key files, behavioural summary, honest
  residuals.
- Parent program `master.md` gains a delivery note.
- Do **not** upload to CMS as part of closeout. Upload is a separate, explicitly
  approved step; rebuild and export only.
