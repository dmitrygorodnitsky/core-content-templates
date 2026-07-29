# Spa Vertical — Core Type and Flow Model

Status: implemented and applied on `dev-1` for `CALM_HARBOR_SPA_STAGING`.
Last updated: 2026-07-26.

This is the tenant-side contract for the beauty/spa vertical: which Core types
exist, what each field means, which workflows govern them, and which record
creates which. It is the counterpart to the portal-side contracts — where
`CORE-CUSTOMER-PORTAL-CONTRACT.md` describes how the portal talks to Core, this
describes what Core is configured to hold.

**Where these definitions belong is a separate question, answered in
[`ORGANIZATION-CASCADE-AND-ENTITY-PLACEMENT.md`](ORGANIZATION-CASCADE-AND-ENTITY-PLACEMENT.md).**
The short version: the `SPA_` prefix throughout this document is misleading.
None of these 17 types and none of these 15 workflows is spa-specific — 14 of
the types belong at service-industries level and would serve a nail salon,
physiotherapy clinic or HVAC business unchanged. Treat the codes here as what is
deployed today, not as what they should be called.

**Source of truth for the definitions** is
`core-ui/scripts/dev/seeds/beautySpaTypes.json` and
`core-ui/scripts/dev/seeds/beautySpaWorkflows.json`, applied by
`core-ui/scripts/dev/beautySpa.ts`. This document must be updated in the same
change as those files.

## 1. Types

`req`/`opt` is the attribute's `required` flag. Attributes typed as an entity
class hold that entity's **id** as their value.

### core-acct

| type | workflow | attributes |
| --- | --- | --- |
| `SPA_CUSTOMER` | `SPA_ACCOUNT_LIFECYCLE` | — |
| `SPA_SPECIALIST` | `SPA_ACCOUNT_LIFECYCLE` | — |

The customer Account must be linked to an OIDC `User`; the portal resolves the
customer from the session and then finds the one `SPA_CUSTOMER` account for that
user. A specialist is an Account, not a User.

### core-pim

| type | workflow | attributes |
| --- | --- | --- |
| `SPA_SERVICE` | `SPA_PRODUCT_LIFECYCLE` | `DURATION_MIN` Long opt, `FOCUS` String opt |
| `SPA_RETAIL` | `SPA_PRODUCT_LIFECYCLE` | `COLLECTION` String opt, `FORMAT` String opt, `VOLUME_ML` Long opt, `SCENT_PROFILE` String opt |
| `SPA_MEMBERSHIP` | `SPA_PRODUCT_LIFECYCLE` | — |
| `SPA_PACKAGE` | `SPA_PRODUCT_LIFECYCLE` | — |
| `SPA_CUSTOMER_REVIEW` | `SPA_PRODUCT_REVIEW_LIFECYCLE` | `REVIEW_KEY` String req unique, `RATING` Long req, `TITLE` String opt, `BODY` String req, `AUTHOR_NAME` String req, `VERIFIED` Boolean req |
| `SPA_STOCK` | `SPA_INVENTORY_LIFECYCLE` | `RECORD_CODE` String opt |

**Prices use the SYSTEM price-type family — this vertical defines no price type
of its own.** One-time prices (services, retail, packages) are `PER_UNIT`;
memberships are `PER_UNIT_RECURRENT`. See §3.

The superseded local type `SPA_STANDARD_PRICE` still exists on staging with its
original 24 price rows. The seed no longer declares it and the deployed portal
no longer reads it, so it is safe to remove by hand through the UI.

### core-svc

| type | workflow | attributes |
| --- | --- | --- |
| `SPA_CARE_PLAN` | `SPA_CARE_PLAN_LIFECYCLE` | `CUSTOMER_ACCOUNT` Account opt, `CUSTOMER_USER` User opt |
| `SPA_PLAN_ENROLLMENT` | `SPA_PLAN_ENROLLMENT_LIFECYCLE` | `CUSTOMER_ACCOUNT` Account req, `CUSTOMER_USER` User req, `PLAN_PRODUCT` Product req, `SOURCE_ORDER` Order req, `CREDITS_TOTAL` Integer req, `CREDITS_USED` Integer req, `VALID_UNTIL` LocalDate opt |
| `SPA_CARE_TASK` | `SPA_TASK_LIFECYCLE` | `CUSTOMER_ACCOUNT` Account opt, `CUSTOMER_USER` User opt |
| `SPA_VISIT` | `SPA_APPOINTMENT_LIFECYCLE` | `CUSTOMER_ACCOUNT` Account opt, `CUSTOMER_USER` User opt, `SPECIALIST_ACCOUNT` Account opt, `SERVICE_PRODUCT` Product opt |

Both project types are Core `Project`s distinguished only by their type code:
`SPA_CARE_PLAN` is the customer's container that visits' tasks hang off,
`SPA_PLAN_ENROLLMENT` is a purchased package with a visit balance.

The customer attributes are `opt` on the three pre-existing types **only** so
that rows created before they were introduced stay valid. Every writer must set
them: an appointment without `CUSTOMER_ACCOUNT` is invisible to its own customer
(§4).

### core-rm

| type | workflow | attributes |
| --- | --- | --- |
| `SPA_STUDIO` | `SPA_RESOURCE_LIFECYCLE` | — |

The physical location. Referenced by `SPA_FULFILLMENT.PICKUP_LOCATION`.

### core-bill

| type | workflow | attributes |
| --- | --- | --- |
| `SPA_ORDER` | `SPA_ORDER_LIFECYCLE` | `RECORD_CODE` String opt, `CUSTOMER_USER` User opt |
| `SPA_ITEM_SERVICE` | `SPA_ORDER_ITEM_LIFECYCLE` | `RECORD_CODE` String opt |
| `SPA_ITEM_RETAIL` | `SPA_ORDER_ITEM_LIFECYCLE` | `RECORD_CODE` String opt |
| `SPA_ITEM_PACKAGE` | `SPA_ORDER_ITEM_LIFECYCLE` | `RECORD_CODE` String opt |
| `SPA_ITEM_MEMBERSHIP` | `SPA_ORDER_ITEM_LIFECYCLE` | `RECORD_CODE` String opt |
| `SPA_FULFILLMENT` | `SPA_FULFILLMENT_LIFECYCLE` | `RECORD_CODE` String opt, `FULFILLMENT_KIND` String req (`PICKUP`), `FULFILLMENT_STATUS` String req (`PENDING`\|`READY`\|`COLLECTED`\|`CANCELLED`), `SOURCE_ORDER` Order req, `PICKUP_LOCATION` Resource opt, `WINDOW_START` Long opt, `WINDOW_END` Long opt |

**One order type.** What a purchase delivers comes from its line types, never
from the order. A purchase whose lines differ is `MIXED` — a portal-derived
label, not a stored value.

`SPA_SERVICE_ORDER` is the superseded predecessor of `SPA_ORDER`. It still
exists with four legacy rows on staging; nothing new may use it.

## 2. Workflows

| workflow | entity | initial | states | events |
| --- | --- | --- | --- | --- |
| `SPA_ORGANIZATION_LIFECYCLE` | Organization | DRAFT | DRAFT, ACTIVE | DRAFT→ACTIVE |
| `SPA_ACCOUNT_LIFECYCLE` | Account | DRAFT | DRAFT, ACTIVE | DRAFT→ACTIVE |
| `SPA_PRODUCT_LIFECYCLE` | Product | DRAFT | DRAFT, ACTIVE | DRAFT→ACTIVE |
| `SPA_PRODUCT_REVIEW_LIFECYCLE` | ProductReview | PENDING | PENDING, PUBLISHED, REJECTED | PENDING→PUBLISHED, PENDING→REJECTED |
| `SPA_CARE_PLAN_LIFECYCLE` | Project | DRAFT | DRAFT, ACTIVE | DRAFT→ACTIVE |
| `SPA_PLAN_ENROLLMENT_LIFECYCLE` | Project | ACTIVE | ACTIVE, EXHAUSTED, EXPIRED, CANCELLED | ACTIVE→EXHAUSTED, ACTIVE→EXPIRED, ACTIVE→CANCELLED |
| `SPA_TASK_LIFECYCLE` | Task | OPEN | OPEN, DONE | OPEN→DONE |
| `SPA_APPOINTMENT_LIFECYCLE` | Appointment | SCHEDULED | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW | SCHEDULED→IN_PROGRESS, IN_PROGRESS→COMPLETED, SCHEDULED→CANCELLED, SCHEDULED→NO_SHOW |
| `SPA_ORDER_LIFECYCLE` | Order | OPEN | OPEN, IN_PROGRESS, COMPLETED, CANCELLED, RETURN_REQUESTED, RETURNED | OPEN→IN_PROGRESS, IN_PROGRESS→COMPLETED, OPEN→CANCELLED, COMPLETED→RETURN_REQUESTED, RETURN_REQUESTED→RETURNED |
| `SPA_ORDER_ITEM_LIFECYCLE` | OrderItem | OPEN | OPEN, FULFILLED, CANCELLED, RETURNED | OPEN→FULFILLED, OPEN→CANCELLED, FULFILLED→RETURNED |
| `SPA_FULFILLMENT_LIFECYCLE` | Shipment | PENDING | PENDING, READY, COLLECTED, CANCELLED | PENDING→READY, READY→COLLECTED, PENDING→CANCELLED |
| `SPA_SUBSCRIPTION_LIFECYCLE` | Subscription | ACTIVE | ACTIVE, CANCELLED, EXPIRED | ACTIVE→CANCELLED, ACTIVE→EXPIRED |
| `SPA_RESOURCE_LIFECYCLE` | Resource | ACTIVE | ACTIVE | — |
| `SPA_INVENTORY_LIFECYCLE` | Inventory | ACTIVE | ACTIVE | — |

Workflow state is the entity's status. The portal maps it to customer-facing
vocabulary in exactly one place per domain (its adapter) and rejects any state
absent from that table rather than labelling it by guesswork.

Two states currently have **no accepted customer treatment** and so cannot
reach the UI: `EXPIRED` on a plan enrollment, and `RETURN_REQUESTED`/`RETURNED`
on an order. Both need a design request before their flow opens.

## 3. Money — Who Owns What

This section exists because it was got wrong once. The rule is: **money is
read, never assembled.**

| figure | owner | where it lives |
| --- | --- | --- |
| catalog price | Core (PIM) | `ProductPrice` on `PER_UNIT` / `PER_UNIT_RECURRENT`: `UNIT_PRICE` decimal, `CURRENCY` Dictionary ref, `INTERVAL` + unit |
| price paid per unit | Core (Bill) | `OrderItem.amount` — a snapshot of the catalog price at purchase |
| line quantity | Core (Bill) | `OrderItem.itemCount` |
| order total | **Core, computed** | `Order.grandTotal` = Σ(`amount` × `itemCount`) |
| cart totals | **Core, computed** | `CartView.subtotal`, `CartItemView.unitAmount` / `lineAmount` |

**`OrderItem.amount` is the unit price, not the line total.** Core multiplies it
by `itemCount`. Writing a pre-multiplied amount doubles every multi-quantity
order.

**`Order.grandTotal` is computed by the server and a client-sent value is
ignored.** The seed therefore sends no totals at all. Nothing outside Core may
compute an order figure.

**Core exposes no per-line total on `OrderItem`.** The portal shows the unit
price and the quantity and omits the line total rather than multiplying —
omission is the honest output when the server provides no figure. The Cart API
*does* provide `lineAmount` and `subtotal`, so checkout must use those.

**A recurring rate comes from the catalog price, not from an order line.** An
order records one charge; the ongoing rate is `UNIT_PRICE`/`CURRENCY`/`INTERVAL`
on the `ProductPrice`. Currency and the interval unit are entity references
whose codes are resolved from Core — never assumed, and no hardcoded symbol.

Payment stays **SIMULATED**: no charge, invoice, receipt, balance transaction,
or refund. Exactly one `AccountPaymentMethod` exists per customer, of type
`OFFLINE` with every card field empty, purely to satisfy the non-null foreign
key `Subscription` requires.

### 3.1 Prices Use the SYSTEM Price Types

Core ships a composable price-type family in the SYSTEM organization, visible
and usable from any tenant without creating anything. This vertical uses it; the
local `SPA_STANDARD_PRICE` it briefly defined has been retired.

| type | parents | own attributes |
| --- | --- | --- |
| `PRICE_CURRENCY` (abstract) | — | `CURRENCY` **Dictionary** req |
| `PER_UNIT` | `PRICE_CURRENCY` | `UNIT_PRICE` BigDecimal req, `FIXED_FEE` BigDecimal |
| `RECURRENT` (abstract) | — | `INTERVAL` Integer req (carries a unit), `USAGE_TYPE` String req |
| `PER_UNIT_RECURRENT` | `PRICE_CURRENCY`, `RECURRENT` | — |
| `TIERED` | `PRICE_CURRENCY` | tier attributes |
| `TIERED_RECURRENT` | `TIERED`, `RECURRENT` | — |

**How this vertical uses them.** Services, retail and packages are `PER_UNIT`.
Memberships are `PER_UNIT_RECURRENT` with `INTERVAL` 1 / unit `MONTH` and
`USAGE_TYPE` `Licensed`. Prices on SYSTEM types carry **no workflow**.

Attribute groups are keyed by the type that *declares* the attribute, not by the
type of the price: a `PER_UNIT_RECURRENT` price carries `UNIT_PRICE` under the
`PER_UNIT` group, `CURRENCY` under `PRICE_CURRENCY`, and `INTERVAL`/`USAGE_TYPE`
under `RECURRENT`. `PER_UNIT_RECURRENT` does not formally inherit `PER_UNIT`,
but Core accepts and persists `UNIT_PRICE` on it, which is why no SYSTEM-level
type change was needed and no `TIERED_RECURRENT` workaround.

**What this buys.** Each of these replaced a defect:

1. `UNIT_PRICE` is a decimal in major units — the `AMOUNT_MINOR / 100`
   conversion and its two-decimal-currency assumption are gone from both the
   seed and the portal.
2. `CURRENCY` is a Dictionary reference — the same entity `Order.currency` points
   at — instead of a free-text string that agreed with the order only by
   convention.
3. Recurrence is expressed by choosing a type; the `ONE_TIME` sentinel is gone.
4. **The server now formats the money.** `price-comparison.json` returns
   `display: {amount, currency, intervalLabel}` — for the local type it returned
   no `amount` at all, because Core could not know which attribute held it. The
   PIM adapter already preferred `display.amount`, so the client-side divisor
   path is now dead code on this vertical.

**Portal configuration.** `priceTypeCode` is `PRICE_CURRENCY` — the abstract
parent — with `includeChildPriceTypes`, so one request covers both one-time and
recurring prices. `amountAttributeCode` is `UNIT_PRICE`; `amountMinorDivisor` is
gone. The `priceAttributeCode`/`priceAttributeValues` filter is **omitted**: a
one-time price carries no `INTERVAL`, so filtering by it would drop every
service and retail row. The PIM adapter now sends that filter only when a
deployment configures it.

**Reading a price outside the catalog.** The plans read model reaches a
`ProductPrice` through an order line rather than the catalog, so it gets raw
attributes: `CURRENCY` and the `INTERVAL` unit are entity ids and their codes are
resolved from Core. Nothing is assumed and no symbol is hardcoded.

**Migration state — live.** All 24 prices exist on the new types (22 `PER_UNIT`,
2 `PER_UNIT_RECURRENT`), the catalog serves every one with a server-formatted
amount, and the rebuilt portal package has been uploaded and confirmed working
against them. Both the authenticated and the PIM-variant packages point at
`PRICE_CURRENCY` / `UNIT_PRICE`.

The 24 original `SPA_STANDARD_PRICE` rows and the type itself remain untouched
on staging — the seed only ever upserts and no longer declares the type. Now
that the deployed portal no longer reads them, the type can be removed by hand
through the UI.

## 4. Flows — What Creates What

```text
catalog:   Product (SPA_SERVICE|RETAIL|MEMBERSHIP|PACKAGE) -> ProductPrice (PER_UNIT | PER_UNIT_RECURRENT)
                                                           -> Inventory (SPA_STOCK)   [retail only]

booking:   customer session -> SPA_CUSTOMER Account
                            -> Task (SPA_CARE_TASK) under the customer's SPA_CARE_PLAN
                            -> Appointment (SPA_VISIT) referencing that task

purchase:  Cart -> Order (SPA_ORDER)
                -> OrderItem (SPA_ITEM_*) per line, one per purchased thing
                -> Shipment (SPA_FULFILLMENT)          [retail pickup]
                -> Project (SPA_PLAN_ENROLLMENT)       [package: visit credits]
                -> Subscription                        [membership: recurring]
```

Four independent dimensions describe a purchase, and none substitutes for
another: the **order** state, the **fulfillment** state, any **appointment** it
produced, and any **plan** it enrolled.

Rules that follow from the model:

- **An appointment must belong to a task, and a task must belong to a project.**
  Core rejects both otherwise. Each booked visit creates its own task under the
  customer's care plan; visits never share a task.
- **A package's remaining balance is `CREDITS_TOTAL - CREDITS_USED`**, derived on
  read and never stored twice.
- **A membership has no visit balance.** It is a `Subscription`; showing it a
  credit count would be an invention.
- **An order with no lines is not a purchase.** It is excluded from customer
  history rather than shown with an empty kind.

## 5. Core Behaviours That Bite

Every one of these cost a debugging cycle. They are properties of the platform,
not of this vertical.

| behaviour | consequence |
| --- | --- |
| `Order`, `OrderItem`, `Shipment`, `Inventory` have **no `code` column** | identity is carried by a `RECORD_CODE` attribute; never overload `notes` |
| **Dynamic attributes are not filterable, and fail silently** — a filter on `attributes.X` returns `200` with zero rows | any narrowing by attribute (customer scope, `SOURCE_ORDER`) must happen client-side; a naive filter looks like "no rows" and causes duplicates |
| `Shipment` has **no order relation** | the link lives in the `SOURCE_ORDER` attribute |
| `Shipment` never receives an **initial workflow state**, and `send-event` on a stateless shipment 500s | fulfillment status is carried by the `FULFILLMENT_STATUS` attribute |
| `Task.project` must be **mapped as well as set** — a save whose mappings omit it NPEs | include every reference you write in the mappings |
| `subscription.payment_method_id`, `account_payment_method.provider` and `.provider_pm_id` are **NOT NULL** | a membership needs the OFFLINE payment method described in §3 |
| relation mappings need the `{key, mappings, name, type:"identifier"}` shape | a bare `{name}` returns the whole nested graph |
| `subscription` cadence lives under `cadence.{period,unit}`, which list projections do not return | read the interval from the price, not the subscription |

## 6. Open Against the Backend

- **Workflow event dispatch returns an opaque 500 tenant-wide** (see
  `docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/evidence/S5.md`
  §4). Every state transition is blocked; saves are unaffected.
- **No row-level authorization.** A customer-role session reads every entity in
  the tenant and `delete` is not pre-authorized. Accepted as a residual for the
  single-client demo; nothing here may be described as customer isolation.
- **core-pim `ProductReview` save is broken** — reviews are excluded from the
  seed via `--skip-reviews`.
- **No booking slots, holds, checkout quote, cancel/return request, or plan
  balance endpoints exist.** The vertical models what it can with the generic
  entity APIs; see the program evidence for what each wave accepted.
