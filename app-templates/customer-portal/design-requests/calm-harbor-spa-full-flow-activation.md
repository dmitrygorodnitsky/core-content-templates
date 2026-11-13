# Design Request: Calm Harbor Spa Full Flow Activation

## Objective

Complete the remaining presentation contract needed to make every Calm Harbor
customer portal flow except Support operational. Preserve the accepted Wave 15
Spa shell, tokens, components, responsive behavior, commerce surfaces, stable
hooks, and appointment-first IA.

This request fills specific gaps. It does not redesign the existing Account,
Purchases, Purchase detail, My plan, Shop, Cart, Checkout, or confirmation
surfaces that Wave 15 already supplied.

Payment remains explicitly `SIMULATED`. The backend may create a real test
Order, Appointment, or plan enrollment, but no card, charge, paid Invoice,
receipt, BalanceTransaction, refund, or payment-success claim exists.

## Frozen IA

Primary destinations remain:

1. Appointments (home/default);
2. Services & prices;
3. Shop;
4. Account.

Account owns Purchases, My plan, Profile, and the existing unavailable Support
entry. Do not create a Support flow or make any new flow depend on Support.

## Existing Wave 15 Surfaces To Reuse

- Account available/unavailable entry system;
- Purchases list and Purchase detail;
- cancellation/return request presentation;
- My plan package/membership cards;
- sellable Shop variants;
- persistent server Cart states;
- simulated Checkout and authoritative confirmation;
- booking review bridge, slot-expired/repriced blocking states;
- loading, empty, error, unauthorized, unavailable, conflict, session-lost,
  non-enumerating not-found, and entity-scoped command states.

## Required New Or Completed Surfaces

### 1. Appointment detail

Create a standalone customer-owned detail route opened from upcoming/past rows.

Show only source-provided fields:

- service title and customer-safe Appointment status;
- local date/time/timezone note;
- specialist/resource when provided;
- visit mode and least-data location;
- optional display price;
- customer-safe reference;
- related Purchase link when provided;
- policy/attention copy and per-resource allowed actions.

Actions: `Reschedule`, `Cancel visit`, `Book again`, `View purchase`. Render only
those returned as allowed. Foreign, removed, or unknown refs share one
non-enumerating not-found treatment.

States: `loading | ready | error | unauthorized | not-found | conflict |
session-lost`, plus per-action `pending | failed | conflict` and server-confirmed
cancelled/rescheduled readback.

### 2. Complete booking flow

Complete the current booking drawer/flow from every supported entry:

- service card `Book`;
- empty Appointments `Book an appointment`;
- past Appointment `Book again`;
- active package `Book with a credit`;
- upcoming Appointment `Reschedule`.

Required steps:

1. service/plan-credit context;
2. optional specialist/resource choice only when returned;
3. eligible date/slot selection;
4. expiring server slot hold;
5. review with visit details, server display total and policy acknowledgement;
6. explicit `Simulation — no charge will be made` treatment;
7. authoritative confirmation for Appointment-only or Appointment-plus-Order.

Reschedule must clearly identify the currently booked visit and the proposed
new slot. It must not imply the original visit changed before confirmation.

Required blocking/command states:

- slots loading/empty/error;
- hold pending/held/expired/failed;
- repriced/conflict;
- confirm pending/failed/session-lost;
- server-confirmed result;
- plan credit unavailable/exhausted/changed;
- cancellation pending/failed/conflict/confirmed.

Do not display a locally ticking hold as authoritative after its server expiry.
Do not calculate cancellation eligibility, deadlines, price, availability, or
credit balance in presentation.

### 3. Package and membership purchase entry

Extend published `Membership options`/plan offers only when a sellable plan
contract is open.

- Distinguish `Package` (finite uses) and `Membership` (recurring terms).
- Show only server-provided display price, interval/terms summary, benefits and
  sellability.
- Primary action: `Buy package` or `Join membership`; disabled/unavailable when
  not sellable.
- Enter the accepted simulated Checkout with source `plan`.
- Confirmation links to both Purchase and My plan after authoritative readback.
- Keep public offers visually distinct from the customer's existing My plan.

States: sellable, unavailable, changed terms/price, confirm pending/failed,
conflict, session-lost, and authoritative enrollment confirmation.

### 4. Spa-specific Profile

Replace the generic legacy Profile presentation for Calm Harbor with a
least-data Account subsection.

In the first increment show/edit only:

- phone;
- email;
- explicitly approved communication/appointment preferences returned by the
  scoped API.

Do not show spend, savings, order stats, addresses, saved cards/payment methods,
plan claims, member-since claims, raw ids, roles, permissions, or organization.

Values remain the last server-confirmed readback until save succeeds. Required
states:

- loading/ready/error/unauthorized/unavailable;
- per-field invalid state and accessible error copy;
- unchanged/dirty;
- saving;
- save failed with old confirmed values preserved;
- version conflict requiring reload/review;
- session lost;
- server-confirmed success/readback.

Provide a clear Account back path and keep Profile visually subordinate to the
appointment-first product.

## Stable Route And Action Contract

Preserve existing actions and add stable opaque-ref hooks where missing:

- `appointment.open` with `data-appointment-ref`;
- `appointment.openPurchase`;
- `booking.open`, `booking.selectService`, `booking.selectSpecialist`,
  `booking.selectSlot`, `booking.hold`, `booking.confirm`, `booking.retry`;
- `appointment.reschedule`, `appointment.cancel`, `appointment.bookAgain`;
- `plan.purchase`, `plan.bookWithCredit`, `plan.cancelRenewal`;
- `profile.open`, `profile.edit`, `profile.changeField`, `profile.save`,
  `profile.reload`.

If existing runtime aliases (`order.reschedule`, `order.cancel`,
`order.bookAgain`, `profile.saveContact`) must be preserved for compatibility,
document the alias rather than silently changing hook meaning.

Every entity action carries an opaque `data-*-ref`; display names and raw Core
ids are never command identifiers. Exact actionable entity carries
`data-state=pending|failed|conflict`; unrelated entities remain interactive.

## Dynamic Data Contract

Support these normalized shapes without binding to raw backend entities:

```js
appointment: {
  ref, service, start, timezoneNote, specialist, visitMode, location,
  customerStatus, displayPrice, reference, attention,
  relatedPurchaseRef, allowedActions, version
}

booking: {
  ref, version, source, service, planRef, eligibleSpecialists, eligibleSlots,
  hold: { ref, version, expiresAt }, review, paymentMode: "SIMULATED",
  displayTotal, policy, allowedActions
}

planOffer: {
  ref, kind, title, displayPrice, termsSummary, benefits, sellability,
  allowedActions
}

profile: {
  version, displayName, phone, email, preferences, allowedActions
}
```

Unknown fields are omitted, never filled with guessed zero/empty values.

## Required Responsive Evidence

Provide executable previews at 1440, 1180, 768, and 390 widths, using supported
light/dark modes. At minimum capture:

1. Appointment detail ready, not-found and command conflict;
2. service booking through slot selection and held review;
3. reschedule comparison plus expired hold;
4. cancellation pending, failed and confirmed readback;
5. book again and book with credit entry variants;
6. package and membership sellable/unavailable offer variants;
7. plan enrollment Checkout/confirmation reuse;
8. Spa Profile ready, invalid, saving, failed, conflict and session lost;
9. 390px mobile navigation and primary actions for every new route;
10. long localized names/copy without action clipping.

## Acceptance Constraints

- Preserve the accepted Beauty/Calm Harbor visual system and Wave 15 commerce.
- Do not modify or create Support behavior.
- Do not introduce a fifth primary navigation destination.
- Do not use generic Order language as the Appointment headline.
- Do not merge Appointment, Order, fulfillment, plan, and simulated-payment
  states.
- Do not expose raw workflow states, internal ids, Account/tenant data, roles,
  claims, or permissions.
- Do not calculate money, eligibility, availability, hold validity, policy,
  inventory, fulfillment, plan balance, or return/refund consequence.
- No fixture/local transition may look like a live server-confirmed result.
- No card fields, PSP controls, paid/charged/refunded/receipt copy, or payment
  success visuals.
- Keep every lifecycle state visually truthful and accessible.

## Requested Handoff

Return executable source components/routes/styles, manifest/scenario updates,
stable hooks, deterministic fixtures, and named viewport evidence. The user
will import the result into `design-inbox/`; production implementation will
then transfer it 1:1 and connect only server-proven scoped adapters/commands.

