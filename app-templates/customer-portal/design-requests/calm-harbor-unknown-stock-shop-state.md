# Design Request: Calm Harbor Shop — Unknown Stock

## Context

The Shop now takes sellability from Core inventory and from nothing else
(`runtime/src/adapters/core-pim-adapter.js`, wave W4 slice C2). The join reads
`core-pim /api/inventory/list.json` for the `SPA_STOCK` rows and reduces each
catalog product to one value:

| value | source |
| --- | --- |
| `sellable` | an inventory row reports a positive count |
| `out-of-stock` | an inventory row reports zero |
| `unknown` | **no inventory row exists, or inventory could not be read** |

The accepted design covers the first two. `spa-shop-card` and the product detail
render an `Out of stock` chip on a muted card and withhold the buy control
(`design-inbox/src/routes/SpaShopPage.js`, `SpaProductDetailPage.js`;
`design-inbox/data/fixtures.js` `spaCommerce.retail.products`, which declares
`sellable`, `variant-required`, `out-of-stock`, `price-changed` and
`unavailable`).

There is no treatment for the third — and it is the **majority state of the
shop**, not a rare edge. `CALM_HARBOR_SPA_STAGING` publishes 12 `SPA_RETAIL`
products and inventory holds exactly two rows (`CHS_BODY_001` count 12,
`CHS_SKIN_002` count 0). The other ten — `CHS_BODY_002/003/004/005`,
`CHS_BATH_001/002`, `CHS_SKIN_001/003/004/005` — have no inventory row at all.
Whatever `unknown` looks like is what a customer sees on most of the shelf.

Every product also becomes `unknown` whenever the inventory read fails, which is
the correct failure direction and needs to look deliberate rather than broken.

One more reason this matters more than it looks: **the cart API does not enforce
stock.** Verified live 2026-07-28 — adding the zero-count `CHS_SKIN_002` to the
cart returns `200` and Core creates the line. There is no server-side refusal
behind the presentation. Whatever this brief decides the customer may click is
exactly what the customer can buy.

This request is presentation-only. It does not authorize an API, a permission,
a mutation, or any new data field.

## User Goal

A customer understands that the studio has not told the portal whether this
product is on the shelf — and is neither offered a purchase that might fail nor
told the shelf is empty when nobody said so.

## Route

`products` — `data-visual-id="spa-shop"`, cards `data-visual-id="spa-shop-card"`
carrying `data-state` = the sellability value; and the product detail,
`data-visual-id="product-detail"`.

## Required States

### 1. `unknown` on the Shop card (`data-state="unknown"`)

Requested: the card treatment for a product whose stock the store has not
stated. It must be visibly distinct from `out-of-stock`, because the two mean
different things:

- `out-of-stock` — the studio counted and the answer was zero. "Out of stock" is
  a true sentence.
- `unknown` — the studio never counted, or the count could not be read. "Out of
  stock" would be a claim nobody made.

The existing `unavailable` treatment is the nearest accepted neighbour but its
copy, `Not sold online`, is also a claim nobody made — please do not let us
reuse it by default. If the answer is that `unknown` should collapse into
`unavailable` with different copy, say so explicitly and supply the copy.

Until this is answered, the runtime keeps the buy action **closed** for
`unknown` and renders no chip at all.

### 2. Whether the price may still be shown

The price is real and published; only stock is missing. Requested: confirm
whether an `unknown` card keeps its price, or whether showing a price with no
availability reads as an offer. The audit's constraint is that nothing on the
card may imply the product can be bought right now.

### 3. `unknown` on the product detail

Same question at the detail width, where the buy control is the page's primary
affordance and its absence is more conspicuous than on a card.

### 4. The whole-shelf case

When the inventory read itself fails, every card is `unknown` at once. Requested:
confirm whether that is the same per-card treatment repeated, or whether the
Shop deserves a section-level note. `calm-harbor-partially-unavailable-sections.md`
asks for a reusable pattern for exactly this shape — if that pattern lands
first, this may simply be an application of it, which is a valid answer.

## Explicitly not requested

**No low-stock threshold and no "only N left" badge.** The portal has no
accepted definition of "low", and the count is not exposed to presentation
precisely so that one cannot be improvised. If a scarcity treatment is wanted it
is a separate product decision, not a fix to this brief.

## Required Actions

Unchanged and gated on server-provided `allowedActions`: `cart.addItem`,
`product.open`, `shop.pickVariant`, `cart.open`. No new action name is
requested. `cart.addItem` is absent from `allowedActions` for both
`out-of-stock` and `unknown`.

## Dynamic Data Shape

The wave-17 product read model plus one field:

```
product.{ ref, code, name, description, price, currency, variantFacts[],
          modelRef, modelName, media[], reviews[],
          sellability: "sellable" | "out-of-stock" | "unknown",
          allowedActions[] }
products.enrichment.{ models, reviews, inventory }
```

`sellability` is the **stock** dimension only. It does not encode
`variant-required` or `price-changed`, which come from the price side and remain
as accepted. `enrichment.inventory` is `ready | unavailable | error |
session-expired | forbidden` and exists so the shelf-wide case in §4 can be told
apart from a catalog that simply has no rows.

The stock **count** is deliberately not in the read model.

## Responsive Requirements

390 / 768 / 1180 / 1440, light and dark. 390 is primary.

- An `unknown` card must keep the same footprint as a `sellable` one — a grid
  mixing all three states must not shift columns.
- Whatever replaces the buy control must not collapse the card's height at 390,
  or a mixed grid will look ragged.
- The shelf-wide case (§4) must be legible without scrolling past four cards to
  discover why nothing can be bought.

## Reusable Source Components

- `spa-shop-card`, `spa-shop-list`, `product-model-section`
- `shop-chip`, `shop-chip--stock`, `spa-shop-card--muted`
- `action-button`, `unavailable-state`, `empty-state`
- `product-detail`, `product-detail-buy`

## Data-Ownership Constraints

- Sellability comes from a `SPA_STOCK` inventory row and from nothing else.
  Never from price presence, product lifecycle state, or a neighbouring product.
- Absence of data is not availability. `unknown` may never render as buyable.
- Absence of data is not zero either. `unknown` may never say "Out of stock".
- No stock count, no threshold, no scarcity language.
- No Core product id, inventory id, or `RECORD_CODE` in the DOM; the card
  carries the opaque `data-product-ref` only.

## Acceptance

- `sellable`, `out-of-stock` and `unknown` side by side at 390 — the three
  distinguishable at a glance and at the same card height.
- The same three at 1180 in a grid, light and dark.
- The product detail at `unknown`, 390 and 1180.
- The whole shelf `unknown` at 390 — or a written confirmation that it is the
  per-card treatment repeated.
- A written answer on the price question in §2. Prose is fine, no mockup needed.
