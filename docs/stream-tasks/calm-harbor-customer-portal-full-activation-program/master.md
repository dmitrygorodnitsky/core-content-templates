# Calm Harbor Customer Portal Full Activation Program

Created: 2026-07-17

Package path: `docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/`

Status: program container; next wave first

## Goal

Turn every Calm Harbor customer job except Support into an honest end-to-end
portal flow backed by customer-scoped APIs, while preserving the accepted Spa
visual system and keeping payment explicitly simulated.

The finished staging portal lets an authenticated customer:

1. view appointment history and appointment detail;
2. book, reschedule, cancel, and book again;
3. browse services, prices, retail products, packages, and memberships;
4. buy retail products or plans through a persistent server cart/quote flow;
5. view purchases and their operational detail;
6. request eligible cancellation or return actions;
7. view and use package/membership entitlements;
8. update whitelisted profile contact/preferences fields.

Support remains visible only as the already-accepted unavailable treatment and
is not a dependency of any opened flow.

## Core Decision

- The portal is appointment-first. `Appointments` becomes the default route;
  `Purchases` remains under Account.
- `Purchase` is the customer view of a committed Order. Appointment, Order,
  fulfillment, plan, and simulated-payment states remain separate dimensions.
- Payment mode stays `SIMULATED`: no card data, PSP, charge, paid Invoice,
  receipt, BalanceTransaction, or refund-success claim.
- A confirmation may still create a real test Order, Appointment, or plan
  enrollment. It renders only from authoritative scoped API readback.
- Current raw read-only Orders remain a temporary diagnostic fallback until
  Purchases is live. They are not the final customer history experience.
- Public catalog data may remain read-only as source data, but eligible service,
  retail, package, and membership offers gain real portal actions.
- No browser-provided Account id or generic entity filtering is an
  authorization boundary. User, customer Account, and organization scope are
  derived on the server.

Product/API source of truth:

- `app-templates/customer-portal/content/cases/CALM-HARBOR-CUSTOMER-PORTAL-PRODUCT-CONTRACT.md`
- `app-templates/customer-portal/content/cases/CORE-CUSTOMER-PORTAL-CONTRACT.md`
- `app-templates/customer-portal/DATA-OWNERSHIP.md`

Accepted visual source:

- `app-templates/customer-portal/design-inbox/**` (Wave 15 at program creation)
- `app-templates/customer-portal/design-requests/calm-harbor-spa-full-flow-activation.md`

## Scope

In scope:

- exact scoped-API discovery, live probes, normalized contracts, and a
  deterministic Calm Harbor test seed;
- missing designer states and their accepted executable handoff;
- Appointment reads, detail, booking, slot holds, reschedule, cancel, and book
  again;
- sellability, variants, persistent server Cart, frozen checkout quote,
  simulated confirmation, and authoritative Order readback;
- Purchases list/detail, fulfillment, related resources, eligible cancellation
  and return requests;
- packages/memberships, balances/ledger projection, book with credit, buy again,
  and cancel renewal when allowed;
- customer-safe Profile reads and versioned updates;
- capability migration from `current-staging` to the full Calm Harbor profile;
- CMS export, dry-run upload validation, responsive/visual/runtime evidence,
  and closeout.

Out of scope:

- Support threads, tickets, chat, message delivery, email/call claims, or a new
  support destination;
- real payment, refunds, invoices/receipts, saved payment methods, PSP UI, gift
  credit, guest checkout, or household accounts;
- delivery/shipping unless Calm Harbor and the backend explicitly open it;
  the baseline retail fulfillment is pickup;
- staff/operator workflows or changes in `core-ui`;
- client-side totals, eligibility, policy, inventory, balance, or status
  inference;
- uploading/publishing to CMS without explicit approval in the execution turn.

## Flow Activation Matrix

| flow | current truth | target truth | backend gate | design gate | wave |
| --- | --- | --- | --- | --- | --- |
| OIDC + customer bootstrap | live User -> `SPA_CUSTOMER` Account | preserve, preferably consume scoped `/me` | exact session/customer contract | none; preserve accepted states | W0/W2 |
| Appointments list | target fixture only | scoped upcoming/past list, default portal route | appointment projection | accepted Wave 14 list states | W2 |
| Appointment detail | next-card only; rows intentionally non-navigable | owned detail, related purchase, allowed actions | detail endpoint + non-enumerating 404 | **new detail surface required** | W1/W2 |
| Book service | partial target drawer | service -> optional specialist -> slot -> hold -> review -> confirm | booking intent, slots, hold, idempotent confirm | **complete booking sequence required** | W1/W3 |
| Reschedule/cancel/book again | target command demo | policy/capability-driven versioned commands with readback | reschedule/cancel commands | **complete reschedule variants required** | W1/W3 |
| Services & prices | live public PIM, read-only | catalog stays authoritative; eligible service opens booking | bookability added to normalized service offer | existing cards plus opened CTA | W3 |
| Purchases | target fixture; staging raw Orders only | cursor list with mapped customer statuses | scoped Order summaries | Wave 15 accepted | W2/W4 |
| Purchase detail | target fixture | lines, totals, fulfillment, appointment/plan links | scoped Order detail | Wave 15 accepted | W2/W4 |
| Cancel/return request | target command demo | eligible request with pending/conflict/readback | scoped idempotent commands | Wave 15 accepted | W4 |
| Shop sellability | local direct `Buy` simulation | SKU/variant/inventory/fulfillment from server | sellable product projection | Wave 15 accepted | W4 |
| Persistent Cart | target fixture only | server-owned, versioned, recalculated after each command | Cart or formal private DRAFT Order contract | Wave 15 accepted | W4 |
| Checkout | local simulated confirmation | frozen server quote; confirm creates real test Order, no financial write | checkout session + idempotent confirm | Wave 15 accepted | W4 |
| Buy package/membership | checkout source exists but offer CTA is not complete | offer -> quote -> confirmation -> plan enrollment | sellable plan offer + enrollment readback | **offer/enrollment entry states required** | W1/W5 |
| My plan | target fixture only | scoped package/membership state and balance | plan projection + ledger/cancel command | Wave 15 accepted | W2/W5 |
| Book with credit | target drawer only | booking consumes/reserves credit exactly once | atomic entitlement + appointment command | booking sequence must show credit source | W1/W5 |
| Profile | staging unavailable; generic legacy Profile is not Spa-safe | phone/email and approved preferences only | scoped versioned read/update | **new Spa Profile required** | W1/W5 |
| Support | unavailable | unchanged unavailable treatment | none | no work | not_opened |

## API Readiness Gate

The route names below express behavior, not a mandatory backend prefix. W0 must
record the exact deployed endpoint, request, response, permission, and error
semantics for every row before its wave opens.

| boundary | required behavior |
| --- | --- |
| session/home | current customer identity, module capabilities, next appointment/attention summaries; no Account id accepted from the browser |
| appointments | scoped list/detail; customer-safe statuses; related purchase; per-resource `allowedActions` |
| booking | intent, eligible slots, expiring hold, confirm, reschedule, cancel; versions and idempotency |
| catalog | service bookability; retail/plan sellability; variants, server price, inventory/fulfillment summary |
| cart/checkout | durable private Cart or formal DRAFT lifecycle; complete recalculation; frozen quote; explicit `SIMULATED` mode; idempotent confirmation |
| orders | committed purchases only; cursor pagination; mapped statuses; detail, totals, fulfillment and related resources |
| order recovery | line/resource-scoped cancellation and return requests; no refund consequence in this increment |
| plans | enrolled packages/memberships, balances/ledger projection, enrollment and allowed renewal actions |
| profile | whitelisted contact/preferences read and versioned patch with authoritative readback |

All private reads and commands must derive User, Account, and organization from
the bearer session. Foreign or absent refs return the same non-enumerating
result. Mutations require resource version/ETag, entity-scoped pending UX, and
idempotency where the product contract requires it.

## Deterministic Test Seed

W0 must prove or create a staging seed with no dependency on Calm Harbor's
current hand-made records:

- one basic OIDC User linked to exactly one active `SPA_CUSTOMER` Account;
- one editable upcoming appointment, one completed appointment, and one
  cancelled/policy-blocked appointment;
- committed service, retail-pickup, package, and membership Orders, including
  at least one mixed/attention state if the backend supports it;
- one active finite package with remaining uses, one exhausted package, and one
  active membership without a guessed visit balance;
- one sellable retail product with variants and one out-of-stock product;
- pickup fulfillment, a price-change/conflict case, and an empty initial Cart;
- no paid Invoice or BalanceTransaction created by any simulated checkout.

The seed must use opaque stable customer refs in portal responses. Raw Core ids
may exist in backend setup evidence but never become portal route parameters or
display values.

## Core Rules

- `design-inbox/**` is immutable designer-owned input during transfer.
- Transfer accepted design into `runtime/**` before adapter activation.
- Live mode never falls back to private fixture entities or fixture success.
- Every mutation is single-flight per entity; unrelated rows remain usable.
- A local click, closed drawer, toast, or HTTP 2xx is not business success.
- Server-owned display strings and statuses render verbatim after normalization;
  the browser does not reconstruct business policy.
- Empty, unavailable, unauthorized, not-found, conflict, expired, and error are
  distinct states.
- Unknown/foreign refs fail closed and do not reveal ownership.
- Support stays unavailable and no opened action routes through fake support.
- Generated `dist/manual-upload/**` files are exporter-owned; never hand-edit.
- Preserve all unrelated dirty-worktree changes.

## Ownership Zones

| zone | primary paths | owner | rule |
| --- | --- | --- | --- |
| product/API contract | `content/cases/**`, `DATA-OWNERSHIP.md`, program evidence | product + backend + executor | exact live evidence beats proposed paths |
| designer request | `design-requests/calm-harbor-spa-full-flow-activation.md` | product/Codex | frozen brief for missing surfaces |
| accepted design source | `design-inbox/**` | external designer/user import | validate and ingest; do not redesign during transfer |
| runtime presentation | `runtime/src/routes/**`, `runtime/src/components/**`, `runtime/styles/**` | frontend executor | preserve accepted hooks and geometry |
| adapters/commands | `runtime/src/adapters/**`, `runtime/src/modules/**`, `runtime/src/actions.js`, `runtime/src/state.js` | frontend executor | normalized scoped APIs only |
| manual CMS runtime | `runtime/manual/calm-harbor-pim-runtime.js` | frontend/export executor | parity with activated modular behavior |
| config/export | staging case JSON, `cms/**`, exporter/check scripts | packaging executor | full profile only after gates pass |
| generated output | `dist/manual-upload/customer-portal-calm-harbor-staging/**` | exporter | reproducible output only |
| evidence/closeout | this package | wave owner | record exact commands, screenshots and residuals |

Shared runtime hotspots (`actions.js`, `state.js`, router, manual monolith) are
owned sequentially. W3, W4, and W5 must not edit them in parallel.

## Program Waves

| wave | outcome | status | depends_on | stop condition |
| --- | --- | --- | --- | --- |
| W0 — API and seed readiness | exact scoped endpoint matrix, live positive/negative probes, deterministic seed | todo | — | any required domain has no safe scoped read/command contract |
| W1 — design completion | accepted executable Wave 16 source for appointment detail, full booking/reschedule, plan purchase entry, and Spa Profile | done | product contract; may overlap W0 | designer source/evidence is absent or violates payment/privacy rules |
| W2 — scoped cabinet reads | `/me`/capabilities, Appointments, Purchase list/detail, Plan and Profile reads populate accepted states | todo | W0 + relevant W1 detail/profile surfaces | foreign-resource, zero/multiple-account, or status mapping fails closed incorrectly |
| W3 — appointment commands | book, reschedule, cancel, book again, slot expiry/conflict, authoritative confirmation | todo | W2 + W1 | holds/idempotency/readback are not proven |
| W4 — commerce and purchase recovery | sellable Shop, server Cart, simulated checkout, real test Order, cancellation/return requests | todo | W2 + W3 runtime hotspots released | Cart/quote/totals are client-owned or confirm performs a financial write |
| W5 — plans and profile | buy/use plan, book with credit, cancel renewal, safe Profile update | todo | W2 + W4 + W1 | individual entitlement scope or versioned Profile update is not proven |
| W6 — staging activation and closeout | full capability config, CMS package, end-to-end and visual evidence | todo | W2-W5 | any primary flow still uses fixture/local success or Support is accidentally opened |

W3 precedes W4 because both own command orchestration hotspots. W5 follows W4
because plan enrollment reuses checkout confirmation and Order readback.

## Cross-Wave Dependency Rules

- W0 records exact API truth; later waves may change adapter paths but not the
  product boundaries without updating this package and product contract.
- W1 accepts designer source only. Implementation does not approximate missing
  surfaces before acceptance.
- W2 opens reads before writes. The old raw Orders route may remain available
  only until Purchase read models are proven.
- W3 opens one appointment command at a time: hold/confirm, reschedule, cancel,
  then book again and plan-credit entry.
- W4 may not reuse the current local `Buy -> confirmation` shortcut as live
  commerce. Cart/quote/order readback must be server-owned.
- W5 must not interpret organization RBAC entitlements as an individual Spa
  plan without a customer-scoped projection.
- W6 changes the staging capability only after negative authorization, session
  expiry, conflict, and duplicate-submit tests pass.

## Program Ledger

| slice | zone lead | owner | status | depends_on | validation | done_when |
| --- | --- | --- | --- | --- | --- | --- |
| S0 API inventory | product/API contract | executor + backend evidence | todo | — | Javadoc/source inspection, live bearer probes | exact endpoint and normalized contract matrix exists |
| S1 seed + authorization proof | product/API contract | executor + backend | todo | S0 | own/foreign/missing/multiple Account probes; financial side-effect check | deterministic seed supports every program flow and fails closed |
| S2 design handoff | accepted design source | designer/user + executor intake | done | brief; S0 shapes where available | syntax/JSON, route/action inventory, screenshots at four widths | all declared design gaps are accepted executable source |
| S3 read adapters | adapters/commands | frontend executor | todo | S0-S2 | focused adapter tests and negative scope tests | Appointment/Purchase/Plan/Profile reads use no private fixtures |
| S4 read presentation | runtime presentation | frontend executor | todo | S3 | route-state matrix + visual parity | accepted read states render 1:1 from live normalized data |
| S5 appointment commands | adapters/commands | frontend executor | todo | S4 | idempotency, hold expiry, conflict, session loss, authoritative readback | every appointment action is end-to-end |
| S6 commerce commands | adapters/commands | frontend executor | todo | S5 | server Cart/quote tests, duplicate confirm, no financial writes | retail and purchase-recovery flows are end-to-end |
| S7 plan/profile commands | adapters/commands | frontend executor | todo | S6 | entitlement concurrency, profile validation/version/readback | plan and Profile flows are end-to-end |
| S8 activation/export | config/export + evidence | packaging executor | todo | S3-S7 | release compile/export, manual package E2E, visual suite, upload dry-run | full staging package is reproducible and truthful |

## Definition of Done

- Primary navigation is Appointments, Services & prices, Shop, Account; default
  route is Appointments.
- Every flow in the activation matrix except Support is live against scoped API
  or explicitly unavailable because its entire program wave is not opened; the
  final program cannot close with a primary flow still unavailable.
- No private fixture data or local success appears in the live CMS package.
- All allowed actions come from the resource contract, use opaque refs, prevent
  duplicate submission, and render authoritative readback.
- Simulated checkout can create test business records but creates no financial
  transaction and never says Paid, Charged, Payment successful, Refunded, or
  Receipt.
- Appointment, Order, fulfillment, plan, and payment-mode states remain
  separately understandable at 390, 768, 1180, and 1440 widths.
- Customer/foreign/missing/multiple-account/session-expired/conflict tests fail
  closed without leaking ids or stale records.
- The full CMS family payload contains one root template and passes uploader
  dry run.
- `audits/A1.md` and `evidence/closeout.md` record exact validation and any
  accepted residuals. Support is the only accepted unopened product flow.

## Delivery Notes

- 2026-07-17: Program package and Wave 16 design request created. No runtime,
  backend, generated CMS output, upload, or commit was performed by package
  creation.
- 2026-07-17: User-imported Wave 16 executable design accepted at
  `app-templates/customer-portal/design-inbox/`. Static source/manifest/scenario
  validation and `calm-harbor-wave16-source-check.mjs` passed. Intake evidence:
  `evidence/W1-intake.md`. Runtime transfer remains a separate phase.
- 2026-07-17: Wave 16 was transferred into the modular target fixture runtime.
  Functional browser validation passed for booking, Appointment detail, plan
  offer checkout, least-data Profile and non-enumerating not-found. Pixel
  acceptance passed 16 strict reference/runtime pairs at 390/768/1180/1440
  with `changed=0`, `rms=0`; evidence: `evidence/W1-transfer.md`. No live API,
  manual CMS runtime, generated package or upload was opened by this transfer.
- No repository-level package manager or production compile command exists.
  For this no-build CMS runtime, the release compile is the manual exporter;
  W6 must run it and validate the generated inline JavaScript package.
