# Calm Harbor Commerce Commands (W4)

Created: 2026-07-28
Level: wave
Parent program: `docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/`

## Goal

Make the Calm Harbor customer able to fill a **server-owned** cart, see honest
sellability, and complete a **simulated** checkout that creates a real Core
Order with typed lines and is confirmed only by authoritative readback.

Cancellation and return requests are **not** in this wave — both are blocked
(§Scope).

## Core Decision

Carried from the parent program; do not reopen:

- One order type `SPA_ORDER`; what a purchase delivers comes from its
  `SPA_ITEM_SERVICE|RETAIL|PACKAGE|MEMBERSHIP` lines. `MIXED` is derived by the
  portal, never stored.
- Payment stays `SIMULATED`. Confirming may create a real Order; it must never
  create a charge, invoice, receipt, balance transaction, or refund, and must
  never say Paid, Charged, or Receipt.
- Pickup is a separate fulfillment dimension (`SPA_FULFILLMENT` shipment), not
  an order state.
- **Money is read, never assembled.** See §Core Rules — this rule already cost
  one defect cycle.

## Scope

In scope:

- server cart reads and mutations against `core-bill /api/cart/current*`;
- sellability on the Shop surface from `SPA_STOCK` inventory;
- checkout: build the order from the server cart, create `SPA_ORDER` +
  `SPA_ITEM_*` lines, confirm from readback, keep it idempotent;
- the pickup fulfillment record for a retail order, if the accepted design
  requires it at confirmation time;
- adapter checks for every command, including negative and replay cases.

Out of scope, with reasons:

- **Cancellation and return requests.** Blocked twice over: no accepted design
  exists for `RETURN_REQUESTED`/`RETURNED` on a purchase card
  (`../calm-harbor-customer-portal-full-activation-program/evidence/S3.md` §5),
  and workflow event dispatch returns an opaque 500 tenant-wide
  (`…/evidence/S5.md` §4). Do not implement either against a dead endpoint.
- Real payment of any kind, saved payment methods beyond the single existing
  `OFFLINE` row, gift credit, guest checkout.
- Delivery/shipping. Baseline retail fulfillment is pickup.
- Any new UI. Missing presentation goes to `design-requests/`, never into
  `runtime/**` by hand.
- `core-ui` application changes. Its `scripts/dev` seed tooling is in scope only
  if a missing seed row blocks a slice.

## Core Rules

1. **Money is read, never assembled.** The Cart API returns server-computed
   `CartView.subtotal`, `CartItemView.unitAmount` and `lineAmount` — use them
   verbatim. `OrderItem.amount` is the **unit** price and Core multiplies it by
   `itemCount` for `Order.grandTotal`; never send a pre-multiplied amount and
   never send order totals at all. Core exposes no per-line order total, so omit
   it rather than computing one.
2. **A 2xx is not success.** Every mutation confirms from an authoritative
   readback or an inspectable state transition. A toast, a closed drawer, or a
   dispatched request proves nothing.
3. **Single-flight per entity, replay-safe.** A repeated `requestRef` returns
   the existing record without a second write. Identity lives in the
   `RECORD_CODE` attribute, never in `notes`.
4. **Resolve references by code**, never by cloning a neighbouring row: order
   type, organization, and currency all resolve by code and fail with a named
   contract error when absent.
5. **Client-side narrowing is presentation, not authorization.** Say so in the
   envelope (`scopeMode`) and never describe it as isolation.
6. **No fixture fallback in live mode**, and no invented sellability, stock,
   policy, or totals.

## Ownership Zones

| zone | paths | rule |
| --- | --- | --- |
| commerce adapters | `runtime/src/adapters/core-cart-adapter.js` (new), `core-orders-adapter.js`, `core-spa-demo-adapter.js` | the only place Core commerce IO happens |
| command orchestration | `runtime/src/actions.js`, `runtime/src/state.js` | **shared hotspot** — edit serially, never in two parallel slices |
| presentation | `runtime/src/routes/SpaCartPage.js`, `SpaCheckoutPage.js`, `SpaShopPage.js`, `SpaProductDetailPage.js` | transfer accepted design only |
| checks | `scripts/*-check.mjs` | one check per adapter; extend, do not fork |
| seed | `core-ui/scripts/dev/beautySpaEntities.ts` + seeds | only if a slice is blocked by a missing row |

`actions.js` and `state.js` are the reason S3–S6 must not run in parallel. One
slice owns them at a time.

## Backend Truth This Wave Depends On

Verified live on `dev-1`, 2026-07-26:

| capability | endpoint | note |
| --- | --- | --- |
| read cart | `GET /core-bill/api/cart/current.json?accountId=` | **enforces a server-side account binding**: own → 200, foreign → 403. The only endpoint in this tenant with real row-level enforcement. Missing `accountId` → raw 500, not 400. |
| add/update item | `POST /api/cart/current/items.json` | body `CartItemRequest {accountId, productId, priceId, currency, count, notes, metadata}` |
| change count | `POST /api/cart/current/items/{priceId}/count.json?accountId&delta` | |
| remove / clear | `DELETE /api/cart/current/items/{priceId}.json`, `DELETE /api/cart/current/items.json` | both need `accountId` |
| merge | `POST /api/cart/current/merge.json` | body `CartMergeRequest` |
| shapes | — | `CartView {id, organization, currency, notes, itemCount, subtotal, items[]}`, `CartItemView {id, productId, productCode, priceId, currency, unitAmount, count, lineAmount, notes, metadata}` |
| inventory | `core-pim /api/inventory/list.json` | `SPA_STOCK`: `CHS_BODY_001` count 12, `CHS_SKIN_002` count 0 |
| prices | public catalog | `PRICE_CURRENCY` umbrella; server returns `display.amount`, `display.currency`, `display.intervalLabel` |

**There is no checkout-session or frozen-quote endpoint.** The quote is the
server cart as last read; confirmation re-reads it and creates the order from
that. If the re-read disagrees with what the customer saw, that is a conflict —
surface it, do not silently proceed.

## Wave Ledger

| slice | zone lead | owner | status | depends_on | validation | done_when |
| --- | --- | --- | --- | --- | --- | --- |
| C1 cart adapter | commerce adapters | executor | todo | — | `scripts/core-cart-adapter-check.mjs`; live read/add/count/remove against staging | cart reads and mutates through Core with server totals only |
| C2 sellability | commerce adapters | executor | todo | C1 | inventory join check; out-of-stock row proves an unbuyable product | Shop shows server stock truth, never inferred |
| C3 cart presentation | presentation | executor | todo | C1 | route-state matrix for cart empty/ready/error | accepted cart states render from the live envelope |
| C4 checkout | command orchestration | executor | todo | C1–C3 | replay, conflict, and readback cases in the adapter check; live order created with typed lines | confirmation renders only from Order readback |
| C5 fulfillment record | commerce adapters | executor | todo | C4 | pickup shipment joined to the order by `SOURCE_ORDER` | a retail order carries its pickup record |
| C6 evidence | evidence | executor | todo | C1–C5 | all checks green; live transcript recorded | `evidence/` holds live proof and honest residuals |

## Definition of Done

- A customer can add a retail product to a server cart, change its quantity,
  remove it, and see totals that came from Core.
- An out-of-stock product cannot be added, and says so from server stock.
- Checkout creates one `SPA_ORDER` with correct `SPA_ITEM_*` lines, is
  replay-safe, and shows success only after Order readback.
- No client-computed money anywhere in the wave.
- `grandTotal` equals Σ(`amount` × `itemCount`) for every order the wave creates.
- Invoice, balance-transaction tables stay empty; the payment-method table keeps
  exactly one `OFFLINE` row with no card fields.
- Cancellation and return remain `not_opened`, with the two blockers cited.
- All adapter checks pass, and the release compile succeeds.

## Delivery Notes

- (record commit hashes here as slices close)
