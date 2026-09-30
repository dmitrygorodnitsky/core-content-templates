# Design Request: Calm Harbor — Route-Root Access and Source-Failure States

## Context

The accepted `data-state` grammar for route roots is eight values
(`design-inbox/manifest.json` `dataAttributes.data-state`):

```
ready · loading · empty · error · unauthorized · not-found · conflict · unavailable
```

The reference app's own dev toolbar offers exactly those eight and nothing else
— verified by serving `design-inbox/source.html` and reading its `state` select.

The live runtime reaches more than eight. `runtime/src/modules/index.js:206`
passes the raw adapter contract-error code into the orders envelope, and
`runtime/src/routes/SpaOrdersPage.js:46` writes it onto the route root. Values
reachable on `[data-route="orders.list"]` include:

```
order-scope-mismatch · orders-request-failed · orders-forbidden · session-expired
session-required · invalid-order · invalid-response · fetch-unavailable
origin-required · cross-origin-service · organization-required
customer-account-required · unsupported-module
```

Confirmed live, not inferred — driving the staging preview against a backend
that fails the wave-15 order fan-out renders
`orders.list:orders-request-failed`.

**This is deliberate and must not be "corrected".**
`app-templates/customer-portal/scripts/calm-harbor-customer-portal-manual-check.mjs:198`
asserts it:

```js
await page.waitForSelector('[data-route="orders.list"][data-state="order-scope-mismatch"]');
assert.equal(await page.locator('[data-module="spa-order-row"]').count(), 0, "foreign Order fails closed");
```

A distinguishable state is the fail-closed signal when a customer's session
reaches an Order that is not theirs. The grammar simply never described it. The
precedent already exists in the accepted design: the account-bootstrap module
passes its codes through, and its seven values *are* declared.

Two adjacent gaps have the same shape:

- `runtime/src/router.js:178` renders `data-visual-id="route-fallback"` for an
  unknown route. The design has no unknown-route treatment (`SG-02`).
- `state.account` can hold values outside the accepted seven, and the gate then
  renders an empty card (`A-21`, `AccountBootstrap.js:22-80`).
- The page root `data-state` and the rendered body can disagree — a finding
  against the design rather than the runtime (`A-10`).

This request is presentation-only. It does not authorize an API, a permission,
a mutation, or a new data field.

Audit reference: `docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/evidence/punch-list.md`
findings `SG-01`, `SG-02`, `A-21`, `A-10`.

## User Goal

A customer who hits an access boundary or a failed source understands that
nothing of theirs is missing or wrong, that nothing was changed, and what to do
next — without being told which record they were not allowed to see.

## What Is Requested

Extend the accepted route-root grammar to cover the states the runtime already
reaches, grouped by what the customer needs to understand. **Not thirteen
treatments — a small set the codes map onto.** The mapping is yours to propose;
the audit's suggested grouping:

| Group | Codes it must cover | What the customer needs |
| --- | --- | --- |
| **access-denied, non-enumerating** | `order-scope-mismatch`, `orders-forbidden`, `customer-forbidden` | That this is not available to them — **without confirming the record exists**. This is the security-critical one: the treatment must be identical whether the record is foreign, removed, or never existed. |
| **source failure** | `orders-request-failed`, `invalid-order`, `invalid-response`, `fetch-unavailable` | That the data did not load, that **nothing stale is being shown**, and that nothing was changed. Retry is meaningful here. The existing live copy — "Your orders didn't load, so nothing is shown — we never show stale records. Nothing was changed; try again." — is the right register; please accept or replace it. |
| **session** | `session-expired`, `session-required` | That they need to sign in again, and that their intended destination is preserved. Already accepted for the account gate — confirm it composes at route-root scope. |
| **configuration** | `origin-required`, `cross-origin-service`, `organization-required`, `customer-account-required`, `unsupported-module` | These are deployment faults, not customer faults. The customer must see a generic honest failure with **no internal detail**. |
| **unknown route** | `route-fallback` | That the address is not a page. Non-enumerating: must not reveal whether a route exists but is closed. |

## Required States

`data-state` on the route root. Every value above must resolve to a declared
state — the current situation, where a raw code lands on a contract attribute
with no declared treatment, is what this request closes.

Please also declare **whether the raw code stays on the attribute** or a mapped
value replaces it. The audit has no preference, with one hard constraint:
`order-scope-mismatch` must remain selectable, because a check depends on it.
If the answer is a mapped value, the mapping must keep foreign-Order
distinguishable to the check while staying non-enumerating to the customer.

## Required Actions

- `ui.retry` — on source-failure only, where retry can help.
- `auth.gotoSignin` / `auth.signOut` — on session states.
- `nav.go` to an accepted destination on unknown-route.
- **No action at all** on access-denied beyond navigation away. Do not offer a
  request-access affordance; no such contract exists.

No new action name is requested.

## Dynamic Data Shape

None. These states render **without entity data** by definition — that is what
makes them safe. The treatment must not depend on a partially loaded entity, and
must never render a partially loaded one behind or beside itself.

## Responsive Requirements

390 / 768 / 1180 / 1440, light and dark. The treatment sits inside the
authenticated shell (`app-shell`, `top-nav`, `page-header`) on private routes
and inside the public shell on `route-fallback`. At 390 it must not be mistaken
for an empty list.

## Reusable Source Components

- `error-state`, `empty-state`, `unauthorized-state`, `unavailable-state`,
  `not-found-state` — `design-inbox/src/components/primitives/`
- `account-bootstrap` — `design-inbox/src/components/shell/AccountBootstrap.js`,
  the accepted precedent for codes-as-states
- `app-shell`, `top-nav`, `page-header`, `action-button`

Do not add a separate visual system. The accepted brief
`calm-harbor-authenticated-live-data-states.md` owns shared lifecycle and
authorization design; this request extends that territory to the route root and
should be answered in the same language.

## Data-Ownership Constraints

- **Non-enumerating is a hard requirement** on the access-denied group. The
  treatment must be byte-identical for a foreign record, a removed record and a
  never-existing one.
- No Core id, account id, organization code, endpoint, HTTP status or error code
  may appear in customer-facing copy.
- Never show stale entity data behind one of these states. The runtime already
  refuses to; the design must not reintroduce it.

## Acceptance

- Access-denied on `orders.list` at 390 and 1180, beside `not-found`, showing
  the two are indistinguishable to a customer.
- Source-failure with retry, 390 and 1440, light and dark.
- Session-expired at route-root scope, 390.
- Configuration failure at 768 — proving no internal detail leaks.
- `route-fallback` on the public shell, 390 and 1440.
