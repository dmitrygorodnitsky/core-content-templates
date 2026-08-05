# Calm Harbor Customer Portal Product And Commerce Contract

Status: proposed target contract, v0.1

Related sources:

- [`CORE-CUSTOMER-PORTAL-CONTRACT.md`](CORE-CUSTOMER-PORTAL-CONTRACT.md)
- [`SPA-VERTICAL-CORE-MODEL.md`](SPA-VERTICAL-CORE-MODEL.md) — the tenant-side types, workflows and money ownership this contract runs on
- [`BEAUTY-SCHEDULING-CONTRACT.md`](BEAUTY-SCHEDULING-CONTRACT.md)
- [`PRODUCTS-AND-SERVICES.md`](PRODUCTS-AND-SERVICES.md)
- [`../../DATA-OWNERSHIP.md`](../../DATA-OWNERSHIP.md)
- [`../../design-requests/calm-harbor-spa-customer-portal-ia.md`](../../design-requests/calm-harbor-spa-customer-portal-ia.md)

## Product Decision

The portal is an appointment-first spa customer product, not a customer-facing
view of generic Core entities.

`Purchase` is a user concept, not a separate backend entity. The commercial
record is an `Order`. What the customer receives from an order depends on its
line type:

```text
service selection -> booking intent -> held slot -> checkout -> Order
                                                       |-> Appointment
retail cart -----------------------------> checkout -> Order -> pickup/delivery
package offer ---------------------------> checkout -> Order -> visit credits
membership offer ------------------------> checkout -> Order -> subscription
```

An Appointment is operational fulfillment, not a renamed Order. A package or
membership is an entitlement created by a purchase, not a public PIM row.
Payment is outside the current product increment.

## Real Customer Jobs

The portal must let an existing customer complete these jobs without staff
intervention:

1. Understand the next appointment and its valid actions.
2. Book, reschedule, or cancel a service under the real salon policy.
3. See what was ordered and its current operational state.
4. Track a retail pickup or delivery when retail commerce is enabled.
5. Understand remaining package visits or membership benefits.
6. Buy a retail product, package, or membership with a server-owned total.
7. Update safe contact/preferences data and request help.

The primary metric is successful completion of jobs 1-3 without staff contact,
while no customer can read or mutate another customer's resources.

| Verdict | Condition |
| --- | --- |
| PASS | At `390` and `1440`, the next appointment is immediately understandable; a customer can find an Order in at most two navigation steps; every real action returns authoritative scoped readback and every simulated action is visibly non-financial. |
| PIVOT | Calm Harbor does not need retail fulfillment in the demonstration. Remove Cart from the first demo and concentrate on booking, Order history, and plan balance. |
| ABORT | The implementation needs a browser-provided Account id, client-calculated totals, unheld appointment slots, raw card data, or generic entity filters as its production authorization boundary. |

## Baseline Business Assumptions

These assumptions let implementation and design progress without pretending
that the salon policy is already known:

- One authenticated Core User resolves to exactly one `SPA_CUSTOMER` Account.
- Payment capability is `SIMULATED` for the current demonstration. No PSP,
  payment method, capture, invoice settlement, or refund is performed.
- Retail starts with pickup if Calm Harbor does not explicitly confirm delivery
  operations, shipment pricing, tracking, and returns.
- A package is a one-time purchase that grants a finite balance of visits.
- A membership is recurring and has renewal/cancellation terms.
- Cancellation eligibility is returned as a capability and policy copy by the
  backend; the frontend does not calculate deadlines.
- Real payment, refunds, gift credit, household accounts, transferring credits,
  and guest checkout are later capabilities unless explicitly opened.

## Current Payment Decision: Simulated Only

The current portal may demonstrate the shape of checkout, but it does not
process money.

- Checkout uses an explicit `paymentMode: "SIMULATED"` deployment capability.
- The primary command is `Confirm order` or `Book`, never `Pay now`.
- No card form, saved payment method, PSP redirect, payment intent, webhook,
  `BalanceTransaction`, or paid Invoice is created.
- A real scoped backend command may create the Order, Appointment, or plan
  enrollment. Its success is real for that test environment, but it does not
  imply payment.
- If the entire flow is fixture/local, the UI must carry a visible demo
  treatment and the result must not enter a live Order list.
- The customer-safe result may say `Order confirmed`, `Booking confirmed`, or
  `Demo checkout completed`. It must not say `Paid`, `Payment successful`,
  `Charged`, `Refunded`, or issue a receipt.
- Totals may still be displayed as server-owned commercial totals. They are not
  evidence that money moved.

This keeps the checkout UX testable without building a false financial ledger.
The future PSP boundary remains a separate release decision.

## Customer Information Architecture

The spa portal keeps no more than four primary product destinations:

| Destination | Purpose | Availability rule |
| --- | --- | --- |
| Appointments | Default/home, next visit, upcoming and past visits, booking actions | Requires customer-scoped Appointment reads; commands are capability-gated. |
| Services & prices | Discover service offers and start a booking intent | Public editorial/PIM data may render; bookability requires scheduling data. |
| Shop | Browse retail products and open the retail cart | Browse-only until sellability, inventory/fulfillment, cart, and checkout are open. |
| Account | Purchases, My plan, profile, support | Each subsection appears only when its own contract is open. |

`Purchases` belongs under Account rather than competing with the
appointment-first destinations. The appointment detail links to its related
purchase, while checkout success links directly to the created purchase.

The Account area contains these customer concepts:

- **Purchases**: all committed Orders, line items, totals, fulfillment, and
  related appointments or plans. Payment, receipts, and refunds are absent in
  the current simulated-payment increment.
- **My plan**: active packages, remaining visits, membership state, renewal or
  expiry, and allowed commands.
- **Profile**: scoped contact fields and preferences only.
- **Support**: contact or ticket capabilities backed by a real destination.

## Domain Boundaries

| Concept | Source/aggregate | Customer meaning | Must not be confused with |
| --- | --- | --- | --- |
| Service offer | service catalog + scheduling | Something that may be booked | Appointment or Order |
| Booking intent | scheduling orchestration | In-progress service choice, optional specialist/add-ons | Durable appointment |
| Slot hold | scheduling | Time-limited reservation of capacity | Confirmed appointment |
| Appointment | scheduling | The operational visit | Order status |
| Retail product | PIM + sellability/fulfillment | A purchasable SKU/variant | Editorial product card |
| Cart | commerce | Mutable retail purchase intent | Order history |
| Checkout session | commerce/demo orchestration | Server-priced confirmation flow | Payment success |
| Order | Core Bill/commerce | Committed commercial record | Appointment, invoice, or cart |
| Payment simulation | demo presentation state | Shows the future confirmation step without moving money | Payment, Invoice, receipt, or BalanceTransaction |
| Package | offer + entitlement | One-time bundle granting finite uses | Membership |
| Membership | subscription + entitlement | Recurring plan with terms and benefits | Public `SPA_MEMBERSHIP` PIM offer |
| Entitlement/credit | customer-scoped plan service | What the customer may consume | Organization RBAC entitlement |
| Fulfillment | commerce/operations | Pickup, delivery, service visit, or entitlement grant | Order confirmation state |

## What Core Already Provides

The current `core-ui` source exposes useful backend building blocks:

- Core Bill: `Order`, `OrderItem`, `Invoice`, and `BalanceTransaction`.
- An Order belongs to an Account, owns totals/currency/items, and has related
  Tasks and Invoices in the operator UI.
- An Invoice relates to an Order and exposes due date and paid amount.
- A BalanceTransaction relates accounts, Order, Invoice, amount, currency, and
  payment type.
- Core SVC: `Appointment`, `Task`, and `Project` with workflow transitions.
- Core PIM: `Product`, `ProductPrice`, and `Inventory`.
- Core entitlement infrastructure: definitions, grants, and quota pools,
  including `sourceOrderId` and `sourcePlanId`.

These entities remain available for a future real financial increment. The
current portal uses Order as its commercial record and does not write a payment
ledger.

## Backend Additions Or Clarifications

The customer-scoped API must add or prove these boundaries:

1. Server-derived customer scope for every read and command.
2. A customer-safe Order read model and status/type mapping.
3. A direct customer relationship for Appointments, or a server-owned traversal
   that cannot be influenced by browser filters.
4. Slot search, slot hold, booking confirm, reschedule, and cancel commands.
5. Retail sellability, SKU/variant, current server price, tax, inventory state,
   and fulfillment methods.
6. A durable Cart or a formally supported `DRAFT` Order lifecycle.
7. Checkout orchestration with idempotent Order confirmation and an explicit
   `SIMULATED` payment mode that performs no financial write.
8. Customer-scoped fulfillment, cancellation, and return models.
9. Customer-scoped package/membership enrollment and credit consumption.
10. Receipt/PDF delivery is deferred until real payment/invoicing is opened.

The existing entitlement module is only a candidate foundation. Its visible
model grants to organizations. It must not represent an individual's spa plan
until the backend provides an Account/customer subject or a customer-scoped
projection with consumption rules.

### Cart decision

Reusing `Order` as a cart is acceptable only if Core formally supports all of
the following:

- a private `DRAFT` state excluded from purchase history;
- Account ownership enforced on the server;
- expiry/abandonment behavior;
- versioned item mutation;
- server recalculation after every mutation;
- conversion to one committed Order exactly once.

If any condition is absent, add a dedicated Cart aggregate. Do not implement a
browser-only cart for live checkout.

## Proposed Customer-Scoped API

The paths below define resource and behavior boundaries. The backend may choose
a different prefix, but the browser contract should remain equivalent.

All endpoints derive User, Account, and organization from the authenticated
session. They do not accept `userId`, `accountId`, or organization selection
from URL/query/body.

### Session and home

| Method and path | Result |
| --- | --- |
| `GET /portal/v1/me` | Customer-safe identity, locale/timezone, capability summary, no raw permissions. |
| `GET /portal/v1/home` | Next appointment, active-plan summary, attention-required purchase, and module availability. |

### Appointments and booking

| Method and path | Result/command |
| --- | --- |
| `GET /portal/v1/appointments?scope=upcoming|past&cursor=` | Scoped appointment summaries. |
| `GET /portal/v1/appointments/{ref}` | Appointment detail plus related purchase and allowed actions. |
| `POST /portal/v1/booking-intents` | Start from a service offer; returns version and `paymentMode: SIMULATED`. |
| `GET /portal/v1/booking-intents/{ref}/slots?...` | Current eligible slots, specialists/resources only as allowed. |
| `POST /portal/v1/booking-intents/{ref}/holds` | Time-limited slot hold with `expiresAt`. |
| `POST /portal/v1/booking-intents/{ref}/confirm` | Creates authoritative Appointment and, when applicable, Order; performs no payment write. |
| `POST /portal/v1/appointments/{ref}/reschedule` | Versioned reschedule using a new hold. |
| `POST /portal/v1/appointments/{ref}/cancel` | Policy-checked cancellation with returned Appointment; no refund consequence in simulated-payment mode. |

### Catalog, cart, and checkout

| Method and path | Result/command |
| --- | --- |
| `GET /portal/v1/catalog/services` | Service offers; editorial facts separated from current bookability. |
| `GET /portal/v1/catalog/products` | Sellable retail SKUs/variants, media, server price, and fulfillment summary. |
| `GET /portal/v1/catalog/plans` | Package/membership offers, not customer enrollment. |
| `GET /portal/v1/cart` | Current server cart or an explicit empty response. |
| `POST /portal/v1/cart/items` | Add an SKU/plan offer with version and authoritative recalculation. |
| `PATCH /portal/v1/cart/items/{ref}` | Change quantity; returns complete recalculated cart. |
| `DELETE /portal/v1/cart/items/{ref}` | Remove line; returns complete recalculated cart. |
| `POST /portal/v1/checkout-sessions` | Freeze a cart/booking/plan source into a versioned checkout quote. |
| `PATCH /portal/v1/checkout-sessions/{ref}` | Select an allowed fulfillment/contact option. |
| `POST /portal/v1/checkout-sessions/{ref}/confirm` | Idempotently creates Order and related Appointment/entitlement when applicable. |

### Purchases, plans, and account

| Method and path | Result/command |
| --- | --- |
| `GET /portal/v1/orders?kind=&status=&cursor=` | Customer purchase history; drafts excluded. |
| `GET /portal/v1/orders/{ref}` | Lines, commercial totals, fulfillment, and related resources; no simulated payment fact. |
| `POST /portal/v1/orders/{ref}/cancel-request` | Allowed retail cancellation request, never a generic delete. |
| `POST /portal/v1/orders/{ref}/return-requests` | Versioned operational return request for eligible lines; no refund claim. |
| `GET /portal/v1/plans` | Customer's enrolled packages/memberships and current balances. |
| `GET /portal/v1/plans/{ref}/ledger` | Credit grants and consumption events without internal RBAC data. |
| `POST /portal/v1/plans/{ref}/cancel-renewal` | Membership command when capability is present. |
| `GET /portal/v1/profile` / `PATCH /portal/v1/profile` | Whitelisted scoped contact/preference fields with versioned readback. |

## Customer Read Models

### Purchase summary

```js
{
  ref,
  reference,
  kind,                 // SERVICE | RETAIL | PACKAGE | MEMBERSHIP | MIXED
  customerStatus,       // approved backend mapping
  placedAt,
  displayTotal,
  currency,
  itemSummary,
  attention,
  allowedActions
}
```

### Purchase detail

```js
{
  ...purchaseSummary,
  version,
  lines: [{ ref, kind, title, variant, quantity, displayUnitPrice, displayTotal }],
  money: { subtotal, discount, tax, total, currency },
  paymentMode: "SIMULATED",
  fulfillment: { kind, status, pickupWindow, tracking },
  relatedAppointments: [{ ref, service, start, customerStatus }],
  relatedPlan: null | { ref, kind, status },
  allowedActions
}
```

Every money field is display-ready and server-owned. The frontend may format a
typed minor-unit amount only when the API contract explicitly supplies amount,
currency, and rounding rules; it never recomputes totals.

### Plan summary

```js
{
  ref,
  kind,                 // PACKAGE | MEMBERSHIP
  title,
  status,
  remainingUses,
  totalUses,
  renewsAt,
  expiresAt,
  displayRecurringPrice,
  allowedActions
}
```

Unknown fields are omitted, not guessed. For example, a membership without a
proven credit balance does not show `0 visits remaining`.

## Status And Capability Rules

- Raw workflow states such as `OPEN` do not appear as customer labels without
  an approved backend-owned mapping.
- Customer states are separate per dimension: Order, fulfillment, Appointment,
  and plan. Simulated payment is a deployment mode, not a business status.
- `allowedActions` is returned per resource. The browser never reconstructs a
  permission policy from status strings.
- A foreign resource returns the same non-enumerating `404` as an absent one.
- Lists use cursor pagination and stable sorting; totals are optional and never
  required to render the first page.

Suggested Order labels are a contract vocabulary, not a direct mapping:

`CONFIRMED | IN_PROGRESS | READY_FOR_PICKUP | FULFILLED | CANCELLED`

## Write Safety Contract

Every mutation must satisfy all of these rules:

1. Customer and organization scope are derived from the bearer session.
2. `Idempotency-Key` is mandatory for confirm, book, cancel, return, and plan
   commands; the same key and payload return the original result.
3. Mutable resources carry a version/ETag; stale writes return `409` with a
   current safe read model.
4. Duplicate clicks are prevented per entity in the UI, but backend
   idempotency remains authoritative.
5. Success returns the updated resource or a command result containing the
   created Order/Appointment/plan references and current states.
6. A simulated confirmation never creates a financial transaction or paid
   Invoice and never returns a customer-facing payment-success claim.
7. Slot holds and checkout quotes have explicit expiry and cannot be silently
   renewed with changed price or availability.
8. Audit records capture actor, customer scope, command, resource, result, and
   correlation id.

## Failure Modes To Test

- A modified client requests a foreign Order, Appointment, Invoice, plan, Cart,
  or document.
- The User has zero or multiple matching customer Accounts.
- A slot expires between review and confirm.
- Product price, tax, inventory, or fulfillment changes during checkout.
- Two tabs update the same Cart or appointment.
- Confirm is retried after a timeout and creates only one Order.
- The demo UI accidentally presents simulated confirmation as real payment.
- A simulated confirmation creates a BalanceTransaction or marks an Invoice
  paid.
- An Order is partially fulfilled.
- A package credit is consumed twice by concurrent appointment confirmation.
- Backend returns an unmapped workflow state.
- Session expires while private data is visible or a command is pending.

## Delivery Sequence

| Release | Product outcome | Backend gate | Design gate |
| --- | --- | --- | --- |
| R0 — current staging | OIDC, Account bootstrap, read-only Order rows, public services/prices and browse-only Shop | Existing live-proven staging adapters | Accepted Wave 14/14.1 |
| R1 — scoped cabinet | Appointment reads, Order detail, totals and fulfillment summaries | Scoped `/me`, Appointment and commercial read models; safe status mapping | Appointment detail and Account/Purchases states |
| R2 — booking | Book, reschedule, cancel, book again with simulated confirmation | Availability, hold, policy, idempotent commands, authoritative readback | Booking, conflict, expiry, demo-confirmation and command states |
| R3 — retail purchase demo | Sellable Shop, server Cart, simulated checkout, pickup-first fulfillment | Catalog sellability, Cart/checkout, explicit `SIMULATED` mode, Order creation | Cart, checkout, demo treatment, confirmation and order-tracking states |
| R4 — packages and membership | Buy and use packages; enroll/manage membership | Customer-scoped enrollment, credit ledger, renewal/cancel rules | My plan, low/empty balance, renewal and cancellation states |
| R5 — service recovery | Returns, profile and support | Scoped commands, retention/audit | Return, profile and support states |

Do not block R1 on retail checkout. R1 and R2 create the spa-specific value;
R3 has no PSP dependency. Real payment is a future program outside this release
sequence.

## Decisions To Confirm With Calm Harbor

Before final copy and command activation, the owner must answer:

1. Is simulated checkout visibly labelled as a demo, or should payment simply
   be omitted and the action read `Confirm order`?
2. Is retail pickup-only, delivery-only, or both; who owns fulfillment and
   returns?
3. Are packages finite one-time credits, and are memberships recurring credits
   or discount/benefit plans?
4. What are the cancellation, no-show, return, and reschedule rules?
5. Can one login manage another person, gifts, or household members?
6. When real payment is eventually opened, which invoice/receipt document will
   be legally customer-facing?

Until answered, the baseline assumptions above control the first design and
API review; the UI must use capability-driven neutral copy rather than inventing
policy.
