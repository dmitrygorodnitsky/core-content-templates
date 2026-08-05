# Products And Services: Beauty Concept Cases

## Status And Scope

This is the product and service model for the two fictional beauty-vertical
cases. It is a content and integration brief, not a live catalog or a source
of commercial facts. Do not publish its brand, SKU, availability, price,
inventory, practitioner, or booking data without a verified customer source.

The two brands must remain distinct:

| Case | Positioning | Service focus | Retail focus |
| --- | --- | --- | --- |
| Calm Harbor Spa | Quiet, restorative day spa | Massage, facial, body and paired rituals | At-home body and skin aftercare |
| Luma Beauty Studio | Detail-led urban beauty studio | Cut, color, finishing, and facial care | Hair maintenance and barrier-support skincare |

## Entity Boundaries

`ServiceOffering`, `RetailProduct`, `Package`, and `Membership` are not
interchangeable records.

| Entity | Examples | Authority | May be shown now | Dynamic facts required before it is bookable or purchasable |
| --- | --- | --- | --- | --- |
| `ServiceOffering` | Massage, cut, facial | CMS/service catalog for editorial fields; scheduling backend for operation | Name, benefit, category, non-price booking CTA | Enabled state, practitioner/room eligibility, duration, live availability, current total, booking result |
| `RetailProduct` | Hair oil, cleansing balm | Dedicated Core PIM catalog | Not on public landing; candidate record only | SKU/variant, media, price, tax, availability, inventory, fulfillment, purchase eligibility |
| `Package` | Harbor Reset, color refresh | Service catalog plus scheduling backend | Name and editorial description only | Included service keys, sequencing, duration, availability, current total, booking result |
| `Membership` | Ritual credit or routine membership | Membership/entitlement service plus PIM pricing only when opened | Not yet | Entitlement, billing interval, current price, renewal/cancellation terms, credit balance |

The existing Core PIM price-comparison adapter is not a retail product
catalog. It must not receive these product candidates as an expedient way to
populate product cards.

## MVP Decision

The two machine-checked `*.catalog-concept.json` files are the structured
inventory for this brief. For each brand, four service offerings are selected
as MVP. Three are visible now on the public SEO landing; the fourth is for the
future authenticated `/services` route after scheduling is opened.

| Case | SEO services | Additional portal-MVP service | Retail-products release |
| --- | --- | --- | --- |
| Calm Harbor Spa | Grounding massage, Custom facial, Harbor reset | Seasonal body ritual | Deferred |
| Luma Beauty Studio | Signature cut, Lived-in color, Skin reset | Blowout and style | Deferred |

## Canonical Contracts To Open

### Service offering

```js
{
  id,                 // stable service-catalog key, never a display name
  vertical: "beauty",
  brandKey,           // calm-harbor-spa | luma-beauty-studio
  kind,               // single | package | add-on | consultation
  category,
  name,
  shortDescription,   // CMS-authored editorial copy
  bookingKey,         // scheduling backend key
  publicState,        // hidden | visible | unavailable; backend-confirmed for bookability
  pricePolicy,        // not-listed | booking-total | quote
  allowedAddOnIds,
  allowedActions      // e.g. ["booking.open"] only when backend authorizes it
}
```

`duration`, `currentTotal`, `currency`, `availability`, `specialist`, and
`room` are scheduling output, not CMS fields. A service card may exist before
the scheduling contract opens, but its booking control must render unavailable
instead of fabricating a slot or price.

### Retail product

```js
{
  id,
  sku,
  vertical: "beauty",
  brandKey,
  category,
  name,
  shortDescription,
  variantGroup,
  media,
  price,
  currency,
  availability,
  inventoryState,
  fulfillment,
  allowedActions
}
```

The dedicated PIM catalog must provide every field from `sku` through
`fulfillment`; no CMS or fixture fallback may supply price or stock. Checkout
still requires the commerce/PSP contract described in `DATA-OWNERSHIP.md`.

## Calm Harbor Spa

### Service-offering candidates

| Stable id | Kind | Category | Customer-facing name | Editorial intent | Price policy | Booking notes |
| --- | --- | --- | --- | --- | --- | --- |
| `chs-grounding-massage` | single | massage | Grounding massage | A restorative full-body session shaped around comfort and pace. | booking-total | Supports optional approved add-ons only. |
| `chs-deep-release-massage` | single | massage | Deep release massage | A more focused massage for guests who want concentrated bodywork. | booking-total | Intake and practitioner eligibility must be confirmed by scheduling. |
| `chs-custom-facial` | single | facial | Custom facial | Skin-focused care with a consultation-led treatment plan. | booking-total | Do not make efficacy or medical claims in CMS copy. |
| `chs-seasonal-body-ritual` | single | body | Seasonal body ritual | A seasonal sensory treatment designed as a slower reset. | booking-total | Editorial seasonal theme may change; service key remains stable. |
| `chs-harbor-reset` | package | ritual | Harbor reset | A longer massage-and-facial visit for an unhurried change of pace. | booking-total | Package sequencing and resource availability are backend owned. |
| `chs-duo-reset` | package | ritual | Duo reset | Two coordinated individual rituals in the same visit window. | quote | Requires a room and practitioner capacity rule; do not show as available until opened. |
| `chs-aroma-journey` | add-on | enhancement | Aroma journey | An optional sensory layer selected only where the primary ritual permits it. | booking-total | Not independently bookable. |

### Retail-product candidates

| Proposed SKU | Category | Candidate name | Intended use in experience | Variant/media requirements |
| --- | --- | --- | --- | --- |
| `CHS-BODY-001` | body-care | Harbor body oil | Home ritual after massage or bath. | Size, ingredient list, usage, primary and detail media. |
| `CHS-BATH-001` | bath | Mineral bath soak | A simple at-home pause between spa visits. | Size, ingredient list, usage, primary media. |
| `CHS-BODY-002` | body-care | Restorative body cream | Daily body-care follow-on. | Size, ingredients, allergen policy, primary and detail media. |
| `CHS-SKIN-001` | skin | Gentle cleansing balm | First step in an at-home facial routine. | Skin-use guidance, size, ingredients, media. |
| `CHS-SKIN-002` | skin | Hydration mist | Lightweight follow-on for a simple routine. | Size, ingredients, media, variant rules. |
| `CHS-GIFT-001` | gift | Spa gift credit | Deferred-value gift instrument, not a physical retail item. | Must use a gift-credit/commerce contract; no PIM-only launch. |

`CHS-GIFT-001` is deliberately deferred. Its balance, redemption, expiry, and
payment rules cannot be represented safely as a normal product card.

## Luma Beauty Studio

### Service-offering candidates

| Stable id | Kind | Category | Customer-facing name | Editorial intent | Price policy | Booking notes |
| --- | --- | --- | --- | --- | --- | --- |
| `lbs-signature-cut` | single | cut | Signature cut | A cut planned around texture, routine, and at-home styling habits. | booking-total | Requires consultation notes and practitioner eligibility. |
| `lbs-lived-in-color` | single | color | Lived-in color | Dimensional color planned for a soft grow-out. | quote | Requires color history and a consultation; do not expose a current total in CMS. |
| `lbs-root-refresh` | single | color | Root refresh | A maintenance color appointment for an established formula. | booking-total | Formula history and eligibility are private customer data. |
| `lbs-gloss-and-finish` | single | finish | Gloss and finish | A shine-focused color and finishing appointment. | booking-total | Scheduling owns the service duration and available slots. |
| `lbs-blowout-and-style` | single | finish | Blowout and style | A polished finish for a day that calls for one. | booking-total | May be independently bookable only when supported by scheduling. |
| `lbs-skin-reset` | single | facial | Skin reset | A consultation-led facial session shaped around the current routine. | booking-total | Do not infer skin conditions or treatment claims. |
| `lbs-event-ready` | package | event | Event-ready session | Coordinated styling and beauty preparation for a planned event. | quote | Requires event details, assigned team, and an explicit booking flow. |

### Retail-product candidates

| Proposed SKU | Category | Candidate name | Intended use in experience | Variant/media requirements |
| --- | --- | --- | --- | --- |
| `LBS-HAIR-001` | hair-care | Bond wash | Maintenance cleansing after color or heat styling. | Size, hair-use guidance, ingredients, primary and detail media. |
| `LBS-HAIR-002` | hair-care | Heat veil | A heat-protection styling step. | Size, directions, ingredients, media. |
| `LBS-HAIR-003` | hair-care | Finish oil | Lightweight finishing care for ends and shine. | Size, directions, ingredients, media. |
| `LBS-SKIN-001` | skincare | Barrier serum | A simple serum step for a home routine. | Size, ingredients, usage, suitability copy, media. |
| `LBS-SKIN-002` | skincare | Daily hydration cream | Everyday moisturizing care. | Size, ingredients, usage, media. |
| `LBS-SKIN-003` | skincare | Overnight recovery mask | An occasional routine step. | Size, ingredients, usage frequency, media. |

## Portal Mapping And Delivery Order

| Surface | First behavior | Source | Not allowed |
| --- | --- | --- | --- |
| Public SEO service cards | Use the three selected editorial services already in each authored landing. | CMS authored input | Current price, stock, or available-slot claims. |
| Private `/services` | Show services only after a service-catalog adapter and scheduling availability contract are opened. | Service catalog + scheduling | Reusing `F.themes.Beauty.svc` as customer truth. |
| Booking drawer and calendar | Build from authorized `bookingKey`, selected offering, availability hold, and returned appointment state. | Scheduling backend | Optimistic success, unheld slots, or invented appointment ids. |
| Private `/products` | Remains unavailable for these concept products until a dedicated PIM catalog and commerce contract exist. | Dedicated Core PIM catalog | Current price-comparison adapter, fixture product cards, or fabricated inventory. |
| Beauty Care | May show references to purchased/used products only after authorized customer-scoped Care data exists. | Beauty Care backend | Deriving routine history from a public product catalog. |
| Orders and checkout | Show only created orders and server-calculated totals. | Commerce/order backend + PSP | Local cart success or client-calculated totals. |

### Activation sequence

1. Select the real brand and validate the final service list with its operator.
2. Open the [Beauty Scheduling Contract](BEAUTY-SCHEDULING-CONTRACT.md) service-offering and availability contract. Implement
   `/services`, booking, calendar, and appointment readback against it.
3. Open dedicated PIM retail catalog and commerce/PSP contracts. Implement
   `/products`, cart, checkout, and order readback with no fixture fallback.
4. Add customer-scoped Beauty Care history and product references only after
   entitlement and privacy rules are proven.

No product or service above is a launch claim until the corresponding source
of truth is connected and verified.
