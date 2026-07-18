# Calm Harbor Customer Portal Full Activation Slices

## Program Overview

This is a next-wave-first program. It activates normalized customer-scoped
behavior behind an already accepted no-build CMS runtime. The executor must not
collapse design acceptance, API truth, frontend wiring, and CMS activation into
one unreviewable change.

## W0 — API and Seed Readiness

### S0 — Exact API inventory

- Intent: replace proposed endpoint names with deployed backend truth.
- Owned zone: product/API contract and `evidence/W0-api-matrix.md`; read-only
  inspection elsewhere.
- Task:
  - inspect Core Javadoc and backend source where available;
  - record exact endpoint, method, permission, headers, request, safe response,
    pagination, version/idempotency, and error semantics for every row in the
    API readiness gate;
  - define the normalized UI shape independently of backend entity layout;
  - classify each capability `proven | missing | unsafe | needs-clarification`.
- Do not: wire generic list filters as the final customer API, change backend,
  or treat a 200 response as authorization proof.
- Validation: positive own-resource and negative foreign/missing-resource probes
  with a basic-user bearer; secrets are never written to repo evidence.
- Completion signal: every flow has an exact safe contract or W0 stops with a
  concrete backend gap list.

### S1 — Deterministic seed and security proof

- Intent: provide repeatable business states without trusting current Calm
  Harbor records.
- Owned zone: backend seed location agreed with the backend repo/team and
  redacted program evidence.
- Task: create/prove the seed listed in `master.md`, then test zero, one,
  multiple, foreign, expired-session, version-conflict, duplicate-confirm, and
  simulated-payment cases.
- Do not: expose bearer tokens, rely on browser Account selection, or create
  paid financial records.
- Validation: rerunnable seed command plus API probes showing exactly one
  customer scope and no cross-customer reads/writes.
- Completion signal: all later waves can run against stable refs and named
  scenarios.

## W1 — Design Completion

### S2 — Designer handoff and acceptance

- Intent: close only the presentation gaps that Wave 15 does not safely cover.
- Owned zone: designer output imported by the user under `design-inbox/**`;
  executor writes intake/evidence only.
- Exact task: execute
  `app-templates/customer-portal/design-requests/calm-harbor-spa-full-flow-activation.md`.
- Required additions:
  - standalone Appointment detail and navigable list rows;
  - complete book/reschedule/book-again flow from service/plan through slot hold
    and simulated confirmation;
  - package/membership offer purchase entry and enrollment confirmation;
  - Spa-specific Profile limited to whitelisted contact/preferences fields.
- Do not: edit the incoming designer source during transfer, redesign accepted
  Wave 15 commerce, add payment/support, or reuse the generic legacy Profile
  stats/address/card screen.
- Validation: full JS syntax; JSON parse; manifest/action/route scan; executable
  states and screenshot evidence at 390/768/1180/1440; privacy/payment copy scan.
- Completion signal: accepted intake names exact source version, states, hooks,
  viewport evidence, and any rejected drift.

## W2 — Scoped Cabinet Reads

### S3 — Read adapters and normalizers

- Intent: populate customer cabinet concepts from scoped APIs.
- Owned zone: `runtime/src/adapters/**`, module descriptors/normalizers, focused
  adapter checks.
- Task:
  - implement session/capability, Appointment list/detail, Purchase list/detail,
    Plan, and Profile read adapters;
  - normalize raw backend entities into the product read models;
  - enforce opaque refs, cursor pagination, customer-safe status labels,
    display-ready totals, and per-resource allowed actions;
  - remove private fixture fallback from live paths.
- Do not: implement writes, calculate business values, or expose raw Account,
  User, tenant, workflow, or sequential entity ids.
- Validation: contract fixtures plus live seed probes; foreign and absent detail
  return identical non-enumerating presentation; zero/multiple Account fails
  closed.
- Completion signal: adapters independently pass all positive and negative read
  contracts.

### S4 — Read presentation and navigation

- Intent: render W2 live data through accepted Wave 15/16 presentation.
- Owned zone: routes/components/styles/router/shell, then manual runtime parity.
- Task:
  - make Appointments the default route;
  - enable Account -> Purchases/My plan/Profile entries;
  - open Appointment and Purchase detail using opaque refs;
  - preserve loading, empty, error, unauthorized, not-found, unavailable,
    conflict and session-expired distinctions;
  - retire raw Orders from primary customer navigation once Purchase mapping is
    proven.
- Do not: activate commands or modify accepted geometry/copy during wiring.
- Validation: route-state matrix, DOM hook parity, 1:1 screenshot/geometry checks
  at four widths, no-private-fixture scan.
- Completion signal: all scoped reads are customer-usable and visually accepted.

## W3 — Appointment Commands

### S5 — Booking, reschedule, cancel and repeat

- Intent: complete the appointment-first value loop.
- Owned zone: booking adapters/commands, action/state orchestration, appointment
  routes/components, focused checks, then manual runtime parity.
- Task:
  - open booking from service offer, past Appointment, active package, and next
    appointment reschedule;
  - implement eligible slots, slot hold countdown/expiry, review, policy
    acknowledgement, idempotent confirm, conflict and session loss;
  - implement reschedule and cancel from returned allowed actions;
  - render Appointment/Order result only from authoritative readback.
- Do not: hold slots locally, infer policy/deadlines, consume credits in the
  browser, or imply payment.
- Validation: duplicate click/retry, expired hold, stale version, two-tab
  conflict, failed command, expired session, own/foreign Appointment, and
  Appointment-only versus Appointment-plus-Order confirmation.
- Completion signal: every visible Appointment command has an end-to-end safe
  result and entity-scoped pending state.

## W4 — Commerce and Purchase Recovery

### S6 — Sellable Shop, Cart and simulated checkout

- Intent: replace the local direct-buy shortcut with real test commerce and no
  financial write.
- Owned zone: catalog/cart/checkout adapters and commands, Shop/Cart/Checkout
  runtime, focused checks, then manual runtime parity.
- Task:
  - load server sellability, variants, price, inventory, and pickup summary;
  - add/change/remove through a versioned persistent server Cart;
  - start/freeze/reload checkout quote;
  - confirm idempotently in `SIMULATED` payment mode and read back the created
    Order/fulfillment;
  - implement buy again without bypassing sellability or quote checks.
- Do not: reuse local cart math/state as live truth, reserve inventory on add,
  accept raw card data, or create financial ledger records.
- Validation: row-scoped duplicate submit, stale price, variant required,
  out-of-stock, inventory conflict, repriced quote, session loss, confirm retry,
  exactly-one Order, persistent Cart reload, and financial side-effect audit.
- Completion signal: Shop -> Cart -> Checkout -> Purchase is end-to-end and
  truthful.

### S6b — Cancellation and return requests

- Intent: activate eligible post-order recovery without promising refunds.
- Owned zone: Order command adapter and Purchase detail actions.
- Task: send versioned cancellation/line-return requests, retain the current
  authoritative Order while pending, and render accepted-for-review/completed/
  rejected states returned by the backend.
- Do not: delete Orders, calculate refund impact, or label an accepted request
  as cancelled/refunded.
- Validation: eligible/ineligible line, conflict, duplicate request, failure,
  session loss and foreign Order cases.
- Completion signal: every visible recovery action reflects backend state.

## W5 — Plans and Profile

### S7 — Plan enrollment, balances and commands

- Intent: make packages and memberships personal operational products.
- Owned zone: plan catalog/enrollment/read/command adapters and Plan/Checkout/
  Booking integration.
- Task:
  - buy package/membership offer through the W4 checkout path;
  - show the created customer plan and server balance;
  - book with a credit atomically;
  - buy an exhausted package again;
  - cancel renewal only when allowed and return authoritative plan readback.
- Do not: use public membership PIM rows as current enrollment, infer zero
  balance, or map organization entitlements directly to a person.
- Validation: enrollment confirmation, unknown balance omission, concurrent
  credit consumption, exhausted plan, cancel-renewal conflict/failure/session
  loss, and foreign Plan.
- Completion signal: catalog -> enrollment -> My plan -> use/manage loop works.

### S7b — Spa Profile update

- Intent: open a least-data customer profile.
- Owned zone: Profile adapter/command and accepted Spa Profile presentation.
- Task: load only approved phone/email/preferences fields; validate safe client
  syntax without claiming save; patch with version/ETag; render server-confirmed
  values or explicit field/general/conflict/session errors.
- Do not: show spend/savings stats, addresses, payment methods, raw ids, plan
  claims, or optimistic saved values unless separately opened later.
- Validation: unchanged, invalid field, pending, failed, conflict, session loss,
  retry, authoritative normalization, and foreign-scope prevention.
- Completion signal: Profile view/edit/save is end-to-end and least-data.

## W6 — Staging Activation and Closeout

### S8 — Capability switch, CMS export and proof

- Intent: ship one reproducible full-flow staging package.
- Owned zone: staging case config, exporter/manual runtime/checks, generated
  output, program evidence.
- Task:
  - replace `current-staging`/closed-module guards with the accepted full Spa
    capability only after W2-W5 pass;
  - set Appointments as default and enable Account/Purchases/Plan/Profile/Cart/
    Checkout modules;
  - update exporter invariants and generated package;
  - run full seeded browser journey and negative security suite;
  - perform CMS uploader dry run only.
- Do not: hand-edit generated output, upload/publish without approval, open
  Support, or weaken negative tests to make activation pass.
- Validation: commands in the matrix below plus paired visual evidence and a
  full live same-origin browser proof on `dev-1` when available.
- Completion signal: one root CMS family is ready for explicit manual upload;
  audits and closeout state Support as the sole unopened flow.

## Dependency Chain

```text
W0 API/seed ----+----> W2 reads -> W3 appointments -> W4 commerce -> W5 plan/profile -> W6 activation
                |
W1 design ------+
```

W0 and W1 may progress concurrently, but no live implementation wave opens
until both its backend and design gates are accepted. W3-W5 are sequential
because they share `actions.js`, `state.js`, router, and manual runtime.

## Validation Matrix

| layer | required proof |
| --- | --- |
| syntax/data | `node --check` for design/runtime/scripts; JSON parse for manifest/scenarios/config/export payloads |
| focused adapters | existing Account/Orders/PIM checks plus new session/appointments/purchases/cart/checkout/plans/profile checks |
| authorization | own, foreign, absent, zero/multiple Account, unauthorized organization, expired session |
| mutation safety | per-entity pending, duplicate click, idempotent retry, version conflict, stale quote/hold, authoritative readback |
| payment boundary | no card/PSP; no BalanceTransaction or paid Invoice; prohibited-copy scan |
| visual | accepted reference/runtime pairs at 390, 768, 1180, 1440 in supported light/dark states |
| release compile | `node app-templates/customer-portal/scripts/export-calm-harbor-portal-manual.mjs` |
| package | `node app-templates/customer-portal/scripts/calm-harbor-customer-portal-manual-check.mjs` and uploader `--dry-run` |
| regression | config, route-state, activation-contract, legacy manual checks, `git diff --check` |

There is no package-manager production build in this repository. The exporter
is the production assembly step for the inline CMS runtime and is mandatory.

## Closeout and Audit Rules

- Update the ledger when each slice closes; do not mark a flow done from target
  fixtures alone.
- Record exact commands, environment assumptions, endpoint versions, seed refs
  (opaque/redacted), and screenshots under this package's `evidence/`.
- Add `audits/A1.md` after the first complete execution pass. Add later audits
  only when real remediation occurs.
- Add `evidence/closeout.md` only when W6 passes and Support is the only accepted
  unopened product flow.
- Record commit hashes in `master.md` Delivery Notes. Never commit user secrets
  or unrelated dirty-worktree changes.

