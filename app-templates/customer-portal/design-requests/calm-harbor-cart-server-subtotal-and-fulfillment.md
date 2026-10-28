# Design Request: Calm Harbor Cart — A Subtotal-Only Totals Card, and a Bag With No Fulfillment Source

## Context

The bag now renders from the server cart and from nothing else
(`runtime/src/routes/SpaCartPage.js` + `runtime/src/modules/index.js`, wave W4
slice C3). The cart module reads `core-bill /api/cart/current.json` through the
C1 adapter and publishes the envelope the page draws.

The accepted bag (`design-inbox/src/routes/SpaCartPage.js:102-122`) composes two
cards on the right rail:

- `cart-totals` — three money rows, **Subtotal / Tax / Total**, bound to
  `cart.displayTotals.subtotal|tax|total` (`:107-109`).
- `cart-fulfillment` — "How you'll get it", bound to
  `cart.fulfillment.label` and `cart.fulfillment.detail` (`:117-122`).

Both were designed against the fixture `spaServerCart`
(`design-inbox/data/fixtures.js:1273-1285`), which legitimately stands in for a
server and supplies all five values.

**Core supplies one of the five.** Verified live on `dev-1` 2026-07-28:
`GET /api/cart/current.json` returns `{ id, organization, itemCount, subtotal,
items[] }`. There is no tax field, no total field, and no fulfillment dimension
anywhere on the cart. `CartItemView` carries `unitAmount` and `lineAmount`; the
cart carries `subtotal`. That is the whole of the money Core will state about a
bag.

Until this wave, production filled the gap by computing it: `actions.js:318`
applied a hardcoded `Math.round(subtotal * 0.08)` and `:329` assembled
`{subtotal, tax, total}` from it, and `:330` hardcoded
`{kind:"PICKUP", label:"Pickup at the studio", detail:"Availability is confirmed
by the studio"}`. The design fidelity audit recorded that as finding `C-01`
(`docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/evidence/findings-components-commerce.md`
§C-01) and routed it to this wave. It is now removed from the live path: the bag
renders Core's subtotal verbatim and shows **nothing** where Core stated
nothing.

That leaves two accepted compositions without a defined appearance, which is
what this request is for.

This request is presentation-only. It does not authorize an API, a permission, a
mutation, or any new data field. In particular it does **not** ask for a cart
tax or a cart total to be obtained from somewhere else — see §Explicitly not
requested.

## User Goal

A customer reviewing their bag can see what the store says the items come to,
and is never shown — or left to infer — a tax or an order total that the store
has not calculated. Nothing on the bag may read as a final amount payable.

## Route

`cart` — `data-route="cart"`, `data-visual-id="spa-cart"`,
`data-module="spa-cart"`.

- Totals card: `data-module="cart-totals"` / `data-visual-id="cart-totals"`,
  rows `money-rows__row` and `money-rows__row--total`.
- Fulfillment card: `data-module="cart-fulfillment"` /
  `data-visual-id="cart-fulfillment"`.

## Required States

### 1. `cart-totals` with a subtotal and nothing else

Requested: the treatment for a totals card that can state exactly one figure.

The accepted card's visual weight comes from its three-row rhythm, with
`money-rows__row--total` as the emphasized last line. A single Subtotal row in
that frame currently renders as a card with one row and no emphasized line —
structurally valid, but nobody designed it, and the card is titled "Totals" for
one total that is not the total.

Questions the answer needs to settle:

- Does the card keep its "Totals" title, or does a subtotal-only card get a
  different title?
- Does the single row take the emphasized `--total` styling, or stay a plain
  row? (It must not *read* as a grand total — that is the failure mode.)
- Should the card say, in copy, that tax and the final amount are not calculated
  here? The runtime will not write that sentence itself. If the answer is yes,
  supply the exact copy. If the answer is no, the card simply shows one row.

**Current gated behaviour:** the runtime renders the Subtotal row from
`displaySubtotal` verbatim and omits the Tax and Total rows entirely. It never
derives, sums or rounds a figure to fill them.

### 2. `cart-totals` when Core states no subtotal either

A cart that Core priced without a subtotal — a field it may return null, and the
shape a failed or partially-read cart takes — leaves the card with zero rows.

**Current gated behaviour:** the whole `cart-totals` card is omitted rather than
rendered empty. Requested: confirm that is right, or supply the empty-card
treatment. This state is reachable but not expected on healthy staging data.

### 3. `cart-fulfillment` with no source at all

Core's cart has no fulfillment dimension. Pickup is a separate `SPA_FULFILLMENT`
shipment record that exists only **after** an order is created (wave slice C5) —
there is nothing to join to a bag that has not been ordered yet.

**Current gated behaviour:** the entire `cart-fulfillment` card is omitted in
live mode. Requested: confirm one of —

- **(a)** the bag legitimately has no fulfillment card until checkout, and the
  accepted composition applies from the checkout surface onward; or
- **(b)** the bag should state how the customer will get their items, in which
  case the copy must be a **studio-configured** value, and this becomes a data
  request as well as a design one. It cannot be a constant compiled into the
  portal — that is precisely the `A-06`/`C-01` class of defect this wave is
  removing.

One consequence worth flagging for (a): the accepted fulfillment card is also
where the sentence *"Items in your bag aren't reserved — stock and prices are
confirmed at checkout"* lives (`design-inbox/src/routes/SpaCartPage.js:121`).
Omitting the card omits that sentence. The page header sub still says "nothing
is reserved yet", so the claim is not lost — but if the longer sentence should
survive independently of the card, say where it goes.

## Explicitly not requested

- **No cart tax and no cart total from any other source.** Not a portal
  constant, not a tenant setting read client-side, not a rate inferred from a
  past order. If the studio wants a tax line on the bag, Core has to calculate
  and return it; that is a backend request, not a design one.
- **No estimate, no "approximately", no "excl. tax" arithmetic.** A figure the
  browser produced is the defect being removed, whatever it is labelled.
- The empty, loading, error and unauthorized bag states are already accepted
  (`cart-empty` `:73`, and the `spaGate` skeleton/error/unauthorized set
  `:57-68`) and are **not** re-opened by this request.

## Required Actions

Unchanged. `cart.changeQuantity`, `cart.removeItem`, `nav.products` and
`checkout.start` all stay exactly as accepted. No new action name is requested.

The "Go to checkout" button stays enabled on a bag with lines regardless of how
§1 is answered — the missing rows are a presentation gap, not a blocked cart.

## Dynamic Data Shape

The envelope the cart module publishes, every field server-read:

```
cart.{ state, scopeMode, backendId, currencyCode, itemCount,
       subtotal, displaySubtotal, notes, organizationCode, lines[], byRef{} }
line.{ ref, priceId, productId, productCode, title, variant, qty,
       unitAmount, lineAmount, displayUnitPrice, displayTotal, currencyCode,
       notes, metadata }
```

- `displaySubtotal` is a formatted string or `null`. There is **no**
  `displayTotals` object and **no** `fulfillment` object on a live cart.
- `itemCount` is a quantity — one line of three reports `3`, not `1`.
- `variant` is always `null` on a live cart line; Core's cart item has no
  variant dimension. The accepted row renders `title · variant` when present,
  which today means it never renders the variant half. Not a gap this request
  needs answered, but recorded so it is not mistaken for a regression.
- `scopeMode` is `"server-account-bound"` — the cart is the one surface in this
  tenant the server actually scopes, rather than the portal narrowing it.

## Responsive Requirements

390 / 768 / 1180 / 1440, light and dark. 390 is primary.

- At 1180 the bag is a two-column `purch-grid`. With the fulfillment card gone
  and totals reduced to one row, the right rail is short — confirm the checkout
  button placement still reads as the page's primary action and the rail does
  not look truncated.
- At 390 the rail stacks under the item list; a one-row totals card directly
  above the checkout button must not read as a price label on the button.

## Reusable Source Components

Compose from the accepted language; do not introduce a separate visual system.

- `cart-totals`, `money-rows`, `money-rows__row`, `money-rows__row--total`
  (`design-inbox/src/routes/SpaCartPage.js:104-112`)
- `cart-fulfillment`, `purch-ful__note` (`:117-122`)
- `card card--pad`, `card__title`, `action-button`

## Data-Ownership Constraints

- Money is read, never assembled. Every figure on this surface is a string Core
  produced; the browser does not multiply `unitAmount` by `qty` even though it
  could, and does not add lines to make a subtotal.
- Absence of a figure renders as absence. Never `$0.00`, never `—`, never
  "calculated at checkout" unless this brief supplies that copy.
- Nothing on the bag may say Paid, Charged, Receipt, or Total Due. Payment is
  `SIMULATED` for the whole portal.
- No cart id, Core Account id, price id or product id in the DOM. Lines carry
  the opaque `data-line-ref` only. The accepted `data-cart-ref` hook has no live
  source — the live cart's only identifier is a raw Core id — and is therefore
  omitted in live mode.

## Acceptance

- The subtotal-only `cart-totals` card at 390 and 1180, light and dark, shown
  next to the accepted three-row version so the difference is deliberate.
- The bag at 1180 with no fulfillment card, showing the right rail balance.
- A written answer on §2 (zero-row card) and §3 (fulfillment (a) or (b)). Prose
  is fine, no mockup needed for those two.
