# Anonymous Intent → Auth → Resume Contract

Status: runtime primitive and contract checks implemented; product activation
closed. Calm Harbor descriptor mode is `closed`.

## Objective

Let an anonymous visitor select a retail offer or service before sign-in, then
authenticate or register and continue without treating browser state as an
authoritative cart, booking, price, or customer record.

## State flow

```text
anonymous browse
  -> capture selection-only capsule in session storage
  -> preserve registered return route
  -> Core Auth sign-in (registration remains separately gated)
  -> resolve exactly one customer Account
  -> reconcile against authoritative server state
  -> clear capsule on success / preserve for explicit retry on failure
```

Authentication success alone is insufficient. Reconciliation cannot start
until the existing User-to-Account gate is `ready`.

## Capsule allowlist

Allowed:

- schema version, experience id, opaque intent reference;
- kind: `retail` or `service`;
- public offer/variant code plus integer quantity, or public offering code;
- registered return route;
- created and expiry timestamps.

Forbidden:

- name, email, phone, address, free-form notes, or other PII;
- User, Account, Cart, Order, Appointment, payment, or session IDs;
- price, subtotal, tax, total, currency claims, inventory, availability, slot,
  specialist, entitlement, or success state;
- arbitrary URLs or routes.

The store is namespaced by experience id, uses `sessionStorage`, has a bounded
TTL and line count, rejects unknown fields, and clears malformed, cross-scope,
or expired values.

## Reconciliation

The caller provides separate authenticated-server handlers for retail cart and
service selection. Each receives the capsule and its intent reference as an
idempotency key. The handler must re-read current server truth and return a
result; it must not trust capsule price, availability, or scope.

Calls for the same experience/intent reference share the exact same in-flight
promise. A successful handler clears the capsule. A failed handler emits a
failed status and leaves the capsule available for an explicit retry. UI must
show pending/disabled behavior while reconciliation is in flight.

## Registration boundary

`PORTAL_REGISTRATION_MODE=core-auth` requires both:

1. a resolved, allowlisted Core Auth registration URL; and
2. proof that the resulting User provisions or links the customer Account type
   required by the portal.

Without both, registration stays `closed`. A newly registered User with zero
customer Accounts must enter the existing fail-closed Account state; the
browser must not invent or auto-select an Account.

## Activation gates

- Accepted responsive UI states exist for selection, auth handoff, checking
  Account, reconciliation pending, failure/retry, expiry, and server-changed
  price/availability.
- Retail and service handlers use customer-scoped endpoints and server
  idempotency/readback.
- Browser tests cover duplicate actions, refresh/return, expiry, zero/multiple
  Accounts, changed server truth, failure, and retry.
- The selected descriptor passes schema, semantic, report, build, and
  cross-surface navigation checks.
