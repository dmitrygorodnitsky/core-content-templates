# Design Request: Calm Harbor Spa Purchases, Simulated Checkout, And Account

## Objective

Extend the accepted Calm Harbor Beauty portal with the customer-facing
commercial lifecycle defined in
[`../content/cases/CALM-HARBOR-CUSTOMER-PORTAL-PRODUCT-CONTRACT.md`](../content/cases/CALM-HARBOR-CUSTOMER-PORTAL-PRODUCT-CONTRACT.md).

This is a presentation request. It must preserve the accepted Wave 14/14.1
shell, tokens, components, responsive behavior, stable hooks, and appointment-
first priority. The current increment uses an explicit payment simulation and
must not present it as a real financial event.

## IA Decision

Keep four primary destinations:

1. Appointments;
2. Services & prices;
3. Shop;
4. Account.

Account owns `Purchases`, `My plan`, `Profile`, and `Support`. Appointment
detail and checkout confirmation may deep-link to a
purchase, but Purchases does not replace Appointments as the home.

## Required New Surfaces

### Account overview

- Current customer-safe display name.
- Entry rows/cards for Purchases, My plan, Profile, and Support.
- Each entry supports `available | unavailable`; unavailable is not rendered as
  empty data.
- No raw Account/User id, role, permission, or organization selector.

### Purchases list

- Filters: `All`, `Services`, `Shop`, `Plans`; show only filters supported by
  the returned data.
- Purchase row: user-facing reference, placed date, item summary, kind,
  customer-safe status, display total, and optional attention message.
- States: `loading | ready | empty | error | unauthorized | unavailable`.
- Cursor loading state that does not replace already-rendered rows.
- The old current-staging raw Order row remains a separate capability variant;
  do not apply target labels to unmapped `OPEN` data.

### Purchase detail

- Summary header with reference, placed date, kind, and customer-safe status.
- Line items grouped only when grouping is source-provided.
- Separate sections for commercial totals, fulfillment, related appointments,
  and related plan.
- Omit absent sections rather than filling them with guessed facts.
- Actions are capability-driven: view appointment, track or view pickup,
  request cancellation, request return, buy again.
- States: `loading | ready | not-found | error | unauthorized | unavailable`.
- Command states per action/entity: `idle | pending | failed | conflict |
  succeeded | session-lost`.

### My plan

- Distinguish active package from recurring membership.
- Show title, status, remaining/total visits when provided, renewal or expiry,
  recurring display price when provided, and next valid action.
- States for active, expiring, exhausted, cancelled, empty, loading, error,
  unauthorized, and unavailable.
- Commands: book with credit and cancel renewal only when returned as allowed.
- Public membership cards remain `Membership options`, never `My membership`.

### Sellable Shop and cart

- Extend the accepted browse-only Shop only under a new `retail-commerce-open`
  capability.
- Product states: sellable, unavailable, out of stock, price changed, variant
  required.
- Persistent server Cart with add, quantity update, remove, empty, stale-price,
  inventory-conflict, loading, error, and unavailable states.
- Row-scoped pending state; unrelated rows remain interactive.
- Cart shows server-owned display totals and an explicit fulfillment summary.
- Do not visually imply that adding to cart reserves inventory.

### Simulated checkout

- Review sections: contact, fulfillment, order lines, server totals, and policy
  acknowledgement when required.
- Render an explicit `Simulation — no charge will be made` treatment whenever
  the payment step is shown.
- No card fields, saved payment methods, PSP controls, payment redirects, or
  payment-success treatment.
- States: `loading | ready | repriced | inventory-conflict | slot-expired |
  confirm-pending | confirm-failed | conflict | session-lost | unavailable`.
- Confirmation renders only from authoritative result and includes created
  purchase reference plus related Appointment or plan when present.
- Confirmation copy is `Order confirmed`, `Booking confirmed`, or `Demo
  checkout completed`; never `Paid`, `Charged`, or `Payment successful`.

### Booking confirmation bridge

- Booking review uses `paymentMode: SIMULATED` and clearly says that no charge
  occurs.
- Held-slot expiry and price change have blocking review states.
- Confirm result can create Appointment only, or Appointment plus Order,
  depending on backend response.

### Return and cancellation

- Design request flows, not immediate guaranteed outcomes.
- Scope commands to eligible lines/resources.
- Do not show or calculate refund consequences in this increment.
- States: pending, accepted-for-review, completed, rejected, failed, conflict,
  and unavailable.

## Dynamic Data Contract

The product contract owns the normalized field definitions. Presentation must
support:

- `purchase.{reference,kind,customerStatus,placedAt,displayTotal,currency,itemSummary,attention,allowedActions}`;
- `purchase.lines[]`, `money`, `paymentMode`, `fulfillment`,
  `relatedAppointments[]`, and `relatedPlan`;
- `plan.{kind,title,status,remainingUses,totalUses,renewsAt,expiresAt,displayRecurringPrice,allowedActions}`;
- `cart.{version,expiresAt,lines,displayTotals,fulfillment,allowedActions}`;
- `checkout.{version,expiresAt,source,paymentMode,displayTotals,allowedActions}`.

Amounts and status labels render verbatim from normalized fields. Presentation
does not calculate savings, tax, balance, deadlines, eligibility, availability,
or return eligibility.

## Stable Action Contract

Propose and document stable hooks for at least:

- `account.open`, `account.openPurchases`, `account.openPlan`;
- `purchase.open`, `purchase.openAppointment`, `purchase.cancelRequest`,
  `purchase.returnRequest`, `purchase.buyAgain`;
- `plan.bookWithCredit`, `plan.cancelRenewal`;
- `cart.open`, `cart.addItem`, `cart.changeQuantity`, `cart.removeItem`;
- `checkout.start`, `checkout.selectFulfillment`, `checkout.confirm`,
  `checkout.retryConfirm`.

Every entity action carries a stable opaque `data-*-ref`, never a display name
or raw sequential Core id.

## Required Responsive Evidence

Provide executable previews at `1440`, `1180`, `768`, and `390`, in light and
dark modes where the accepted shell supports them.

At minimum capture:

1. Account overview ready and partially unavailable.
2. Purchases ready, empty, loading, and error.
3. Purchase detail for service, retail, and membership/package Orders.
4. A mixed Order showing separate Order and fulfillment states.
5. My plan active and exhausted states.
7. Shop sellable and out-of-stock cards.
8. Cart ready, row pending, stale price, and inventory conflict.
9. Checkout ready, simulation treatment, confirm pending, confirm failed,
   repriced, and session lost.
10. Confirmation for retail Order, Appointment purchase, and plan enrollment.
11. Return request pending and failed, without refund claims.
12. Mobile navigation with Account reachable without crowding the accepted
    appointment-first actions.

## Constraints

- Do not modify or replace the accepted Beauty visual system.
- Do not expose raw workflow states, internal ids, permissions, or addresses
  beyond least-data needs.
- Do not use CMS/fixtures as current Cart, Order, plan, fulfillment,
  inventory, availability, or authorization data.
- Do not make a local transition, closed drawer, toast, or HTTP success look
  like commercial success without authoritative readback.
- Simulation may exercise UI states but must not create `BalanceTransaction`,
  mark an Invoice paid, issue a receipt, or imply that money moved.
- Do not merge Appointment, Order, fulfillment, and plan states into one
  generic status.
- Preserve explicit loading, empty, error, unauthorized, unavailable, stale,
  conflict, and session-lost treatments.
