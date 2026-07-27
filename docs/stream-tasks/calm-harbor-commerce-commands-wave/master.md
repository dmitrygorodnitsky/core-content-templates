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
| C1 cart adapter | commerce adapters | executor | done | — | `scripts/core-cart-adapter-check.mjs`; live read/add/count/remove against staging | cart reads and mutates through Core with server totals only |
| C2 sellability | commerce adapters | executor | done | C1 | inventory join check; out-of-stock row proves an unbuyable product | Shop shows server stock truth, never inferred |
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

- **C1 cart adapter — done.** `e08b0de` the adapter and its check; `4634280` the
  corrections live probing forced. Proven live against `CALM_HARBOR_SPA_STAGING`
  as `CHS_STG_ELENA_RIOS`: empty read → add `CHS_BODY_001` (`$42.00` subtotal
  from Core) → count 2 (`unitAmount` 42, `lineAmount` 84, `subtotal` 84, all
  Core's) → replayed identical count wrote nothing → remove → clear → foreign
  account 4 refused `403 cart-forbidden` → no resolved account refused locally
  with `customer-account-required` and zero calls.

- **C2 sellability — done.** `13bad3f`. One `sellability` field with exactly
  three values, sourced only from a `SPA_STOCK` row joined by product **id**:
  `sellable` (positive count), `out-of-stock` (zero), `unknown` (no row, or
  inventory unreadable). `unknown` is neither of the other two — absence of
  stock data is absence of permission to sell, so the buy action closes without
  the presentation claiming an empty shelf. The inventory read filters
  `type.code`, a real relation column, never `attributes.*`. Counts are never
  summed. Verified independently by the operator: six adapter checks green.
  Filed `design-requests/calm-harbor-unknown-stock-shop-state.md`.
  **Handoff to C4:** `state.js` `spaSellInfo()` still hardcodes
  `{state: "sellable"}` in live mode, so the adapter's truth does not reach the
  customer yet. C2 correctly refused to touch the serial hotspot; C4 owns the
  one-line fix.

## Backend Corrections Found Live (2026-07-28)

Four things the written contract had wrong or unstated. Each cost a probe cycle;
they are recorded so the next wave does not rediscover them.

1. **`CartItemRequest.currency` is the Dictionary entity id, not the code.**
   Sending `"USD"` returns `404 "No sellable price found"` wrapped in a `500`.
   Sending `17` succeeds. Currency ids are resolved from Core in both
   directions — nothing assumes 17 means USD.
2. **`CartView` has no `currency` and no `notes`.** The live shape is
   `{id, organization, itemCount, subtotal, items[]}`; `organization` is a plain
   code string. `CartItemView.currency` is a *stringified* Dictionary id.
   `itemCount` is the sum of line quantities, not the number of lines.
3. **A foreign accountId that EXISTS returns 403; one that exists nowhere
   returns 404.** The truth table recorded only the 403. 404 maps to
   `cart-account-unknown` so a missing account is never reported to a customer
   as somebody else's cart.
4. **The cart API does not enforce stock.** `CHS_SKIN_002` (`SPA_STOCK` count 0)
   was accepted into the live cart with a `200` and a created line. Sellability
   is entirely the portal's job from the inventory join; there is no server-side
   refusal to lean on. Live inventory holds only two rows — `CHS_BODY_001` 12
   and `CHS_SKIN_002` 0 — so the other ten retail products have **no inventory
   row**, making "unknown stock" the dominant live case rather than an edge one.

Confirmed for C4, read-only: order type `SPA_ORDER` is id 4 on
`SPA_ORDER_LIFECYCLE`; all four `SPA_ITEM_*` types exist on
`SPA_ORDER_ITEM_LIFECYCLE`. Financial baseline before any checkout this wave:
`invoice` and `balance-transaction` both return `resultSize 0`.
