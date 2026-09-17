# Wave 15 Design Source Intake

Status: accepted for executable transfer

## Incoming Source

- Path: `app-templates/customer-portal/design-inbox/`
- Version: `wave-15 (modular / customer-portal-design)`
- Date received: 2026-07-17
- Owner: external designer; imported by the repository owner
- Format: no-build native ES modules, CSS, deterministic fixture scenarios,
  manifest, and PNG viewport evidence

The binding visual source is `design-inbox/source.html` plus its `src/`,
`styles/`, and `data/` dependencies. `design-inbox/manifest.json` is the binding
hook/action inventory. The source is immutable during transfer.

## Previous Accepted Reference

- Wave 14/14.1 remains available in `design-inbox/previews/wave14/` and the
  Wave 14 sections of `design-inbox/README.md`.
- The current production-facing transfer remains under
  `app-templates/customer-portal/runtime/` while Wave 15 parity is established.

## Changed Surfaces

- Spa shell navigation: Account as the fourth destination and capability-gated
  server-cart indicator.
- Account overview and per-entry available/unavailable states.
- Purchases list, filters, cursor append, and route states.
- Purchase detail for service, retail, package, and mixed Orders.
- My plan package/membership states.
- Sellable Shop states and variant selection.
- Persistent server Cart and row-scoped command states.
- Simulated checkout, blocking quote states, and authoritative confirmation.
- Booking review bridge with simulated payment mode and slot-hold states.
- Return/cancellation request presentation without refund claims.
- Responsive additions for `1440`, `1180`, `768`, and `390`.

## Adjudication

- Payment is explicitly `SIMULATED`; the accepted copy says no charge is made.
- No card fields, saved payment methods, PSP controls, paid Invoice, receipt,
  BalanceTransaction, or refund-success claim is present.
- Confirmation renders from `state.spaResult`, not from a local click alone.
- Staging raw `OPEN` Orders remain visually and semantically separate from the
  target customer status vocabulary.
- Opaque deterministic refs are provided for purchase, line, plan, product,
  variant, appointment, and cart commands.
- Cart totals and purchase money are display strings; presentation does not
  calculate commercial facts.

The package is accepted for presentation transfer. Acceptance does not open
real commerce writes or replace server-side customer authorization.

## Deterministic Normalization

- No random ids or current-clock dependencies were found in the Wave 15
  contract.
- Named dev-toolbar controls select capability, route, cart, checkout, plan,
  booking-hold, and confirmation-result states.
- The fixture cart acts as a deterministic stand-in for scoped server Cart
  readback.

## Acceptance Backlog

| Surface | Viewport/state evidence | Runtime acceptance |
| --- | --- | --- |
| Account | `1440 ready`, `390 partial dark` | Exact shell, entry states, links, and wrapping |
| Purchases | `1440 ready`, `390 empty/error`, `768 loading` | Lists, filters, cursor state, unavailable distinction |
| Purchase detail | service `1180`, retail `390`, package `768`, mixed `1440` | Optional sections and separate statuses |
| My plan | active `768`, exhausted `390` | Package/membership distinction and server-only meter |
| Shop | sellable `1440` plus manifest out-of-stock contract | Capability gating and variant action hooks |
| Cart | ready `1180`, stale `390`, inventory conflict `768` | Row pending and blocking refresh states |
| Checkout | ready `1440`, repriced `768`, pending/failed/session-lost `390` | Simulation notice and authoritative confirmation only |
| Booking bridge | expired hold `390` | Blocking confirm and retry contract |
| Confirmation | retail `390`, booking `768`, plan `390 dark` | No payment-success language |
| Mobile shell | account nav `390` | No crowding or hidden primary action |

## Forbidden During Transfer

- No edits under `design-inbox/**`.
- No visual cleanup, relabeling, or component substitution.
- No generic Core entity write activation.
- No fixture success presented as a live business result.
- Existing Account and Orders adapters remain intact until a separate adapter
  activation pass proves the new scoped contracts.
