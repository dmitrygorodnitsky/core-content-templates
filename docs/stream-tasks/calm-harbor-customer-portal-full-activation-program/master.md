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
- staff/operator workflows, and changes to the `core-ui` application itself;
  its `scripts/dev` provisioning tooling **is** in scope, because the tenant
  seed and the RBAC/type/workflow definitions this program depends on live
  there and nowhere else;
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
| W0 — API and seed readiness | exact scoped endpoint matrix, live positive/negative probes, deterministic seed | done | — | superseded 2026-07-26: the missing scoped contracts are an accepted residual for the single-client demo, not a stop |
| W1 — design completion | accepted executable Wave 16 source for appointment detail, full booking/reschedule, plan purchase entry, and Spa Profile | done | product contract; may overlap W0 | designer source/evidence is absent or violates payment/privacy rules |
| W2 — scoped cabinet reads | `/me`/capabilities, Appointments, Purchase list/detail, Plan and Profile reads populate accepted states | done | W0 + relevant W1 detail/profile surfaces | foreign-resource, zero/multiple-account, or status mapping fails closed incorrectly |
| W3 — appointment commands | book, reschedule, cancel, book again, slot expiry/conflict, authoritative confirmation; also replaces the seeded-row cloning in both write paths (`evidence/S3.md` §6) | blocked | W2 + W1 | holds/idempotency/readback are not proven |
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
| S0 API inventory | product/API contract | executor + backend evidence | done | — | OpenAPI api-docs inspection, live bearer probes | exact endpoint and normalized contract matrix exists |
| S1 seed + authorization proof | product/API contract | executor + backend | done | S0 | own/foreign/missing/multiple Account probes; financial side-effect check | deterministic seed supports every program flow and fails closed |
| S2 design handoff | accepted design source | designer/user + executor intake | done | brief; S0 shapes where available | syntax/JSON, route/action inventory, screenshots at four widths | all declared design gaps are accepted executable source |
| S3 read adapters | adapters/commands | frontend executor | done | S0-S2 | focused adapter tests and negative scope tests | Appointment/Purchase/Plan/Profile reads use no private fixtures |
| S4 read presentation | runtime presentation | frontend executor | done | S3 | route-state matrix + visual parity | accepted read states render 1:1 from live normalized data |
| S5 appointment commands | adapters/commands | frontend executor | blocked | S4 | idempotency, hold expiry, conflict, session loss, authoritative readback | every appointment action is end-to-end |
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
- 2026-07-26: S0 API inventory completed against `dev-1.servicewand.com`
  (OpenAPI `api-docs` for 8 services + read-only live bearer probes; no
  writes). Evidence: `evidence/S0.md`. Headline findings: a dedicated
  server-owned Cart API exists in core-bill (`/api/cart/current*`, refused a
  foreign `accountId` with 403); booking slots/holds, checkout frozen quote,
  cancel/return requests, and plan balance/ledger endpoints do not exist;
  core-pim ProductReview save is broken (pre-existing defect, reviews excluded
  from seed plans). S1 is unblocked.
- 2026-07-26: S1 opened. Read-only staging inventory recorded in
  `evidence/S1.md`. Blocking finding: `SPA_VISIT` appointments carry no
  customer link in any form (`account`/`customer`/`user`/`project` all null;
  the Task→Project chain has no account either), because the Calm Harbor types
  were seeded without attributes — unlike the access-probe types, which use
  `CUSTOMER_ACCOUNT`/`CUSTOMER_USER` dynamic attributes. Seed sources in
  `core-ui` were updated (not applied): customer/specialist/service attributes
  on `SPA_VISIT`, customer attributes on `SPA_CARE_PLAN`/`SPA_CARE_TASK`, and
  the missing `CANCELLED`/`NO_SHOW` and `CANCELLED`/`RETURN_REQUESTED`/
  `RETURNED` states plus their events on the appointment and order lifecycles.
  Record-level seeding and the authorization matrix remain open; the latter is
  blocked on a human-obtained customer-session bearer (no password grant is
  deployed).
- 2026-07-26: settled product decisions restated as implementation input in
  `evidence/S1.md` §7 after they were wrongly listed as open questions. Plans
  are hybrid — membership is a `core-bill` Subscription created from its Order,
  package is a customer-scoped plan instance with a finite visit balance, both
  surfaced through one portal `/plans` read model, org-level entitlement grants
  unused. Because the deployed `entitlement-grant` cannot bind to an Account,
  the package instance takes the typed form `SPA_PLAN_ENROLLMENT` (a `core-svc`
  Project type with customer/product/order refs and `CREDITS_TOTAL`/
  `CREDITS_USED`) on a new `SPA_PLAN_ENROLLMENT_LIFECYCLE`. Orders use one
  general `SPA_ORDER` type with the kind carried by `SPA_ITEM_SERVICE|RETAIL|
  PACKAGE|MEMBERSHIP` lines (`MIXED` derived), and pickup lives in a separate
  `SPA_FULFILLMENT` shipment dimension. Booking without a server hold is
  accepted for staging/demo under honest-readback rules, so W3 is not blocked;
  a production hold is still required. Seed sources updated accordingly and
  plan-verified.
- 2026-07-26: deterministic record seeding written in
  `core-ui/scripts/dev/beautySpaEntities.ts` (`seedDeterministic()`): three
  customer-linked appointments covering scheduled/completed/cancelled, five
  `SPA_ORDER` rows with typed lines including one MIXED, two package
  enrollments (active and exhausted), one membership Subscription created from
  its order with no payment method, a PICKUP fulfillment shipment, and in-stock
  plus out-of-stock inventory rows. Entity field contracts were taken from
  `core-ui/docs/domain-model/*.json`, which independently confirms that
  Appointment's only relation is `task` and that Shipment has no native order
  link. `tsc --noEmit` and the expanded dry run pass; nothing is applied to
  staging yet.
- 2026-07-26: **S1 authorization matrix executed with a real customer session**
  (`SPA_CUSTOMER_PORTAL`, user `elena`, exactly the 13 seeded permissions).
  Result: the deployed generic entity APIs **fail open**. The session reads
  every Account, Order, User, Role, Project, Task, EntitlementGrant,
  AccountType, and ProductPrice in the tenant despite holding none of those
  permissions; a foreign account and a foreign order are returned in full by
  both `list` and `get`; foreign versus missing is enumerable (200 with data
  versus 404); and `delete.json` returned 200 for the customer role — probed
  only with a nonexistent id, so nothing was destroyed, and deliberately not
  confirmed against a real record. Two boundaries do hold: `cart/current`
  enforces a server-side account binding (own 200 / foreign 403) and the
  organization scope is not widened by the `X-Organization-Code` header.
  Evidence and the backend item list are in `evidence/S1.md` §6. This confirms
  with direct proof the standing promotion blocker: nothing in the current
  posture may be presented as customer or tenant isolation, and W2–W5 must not
  treat a client-side filter as a security boundary.
- 2026-07-26: **W0 closed; the backend authorization gap is an accepted
  residual, not a stop.** The portal ships as a single-client demo, so the
  absence of customer scoping no longer blocks W2–W6. The honesty rules stand
  unchanged: no flow, UI string, README, or evidence file may present the
  current posture as customer or tenant isolation, and a client-side filter is
  presentation only.
- 2026-07-26: **deterministic seed applied to staging and verified by readback**
  (`beautySpa.ts apply --apply --from=workflows --skip-reviews`). Landed: three
  customer-linked appointments (`SCHEDULED`/`COMPLETED`/`CANCELLED`), five
  `SPA_ORDER` rows with typed lines including one MIXED, two package
  enrollments (`ACTIVE` 5/1 and `EXHAUSTED` 3/3), a PICKUP fulfillment, and
  in-stock plus out-of-stock inventory. Invoice, payment-method, and
  balance-transaction tables remain empty; the seed is idempotent across runs.
  Five backend constraints were discovered during the apply and are recorded in
  `evidence/S1.md` §5.2 — notably `appointment.task_id` NOT NULL, no `code`
  column on Order/OrderItem/Shipment/Inventory, and Shipment never receiving an
  initial workflow state (fulfillment status now lives in an attribute).
  Where the `code` column is missing, identity is carried by a dedicated
  `RECORD_CODE` attribute on the type rather than by overloading `notes`; a
  standard field keeps its standard meaning.
- 2026-07-26: **membership residual resolved; S1 complete.** Core requires a
  payment-method row before a Subscription can exist
  (`subscription.payment_method_id` NOT NULL, and on `AccountPaymentMethod`
  both `provider` and `provider_pm_id` are NOT NULL too). Decision: seed exactly
  one OFFLINE payment method — `type`/`provider` `OFFLINE`, no PSP reference,
  and every card field empty (`brand`, `last4`, `expMonth`, `expYear`,
  `fingerprint`, `funding`, `country`, `billing`), verified by readback. It
  records "settled at the spa" and creates no charge, invoice, receipt, or
  balance transaction, so the SIMULATED posture is unchanged; the scope line on
  saved payment methods is narrowed to this one foreign-key row rather than
  dropped. The membership Subscription is now `ACTIVE` against
  `CHS_STG_ORDER_MEMBERSHIP`. Financial assertion going forward: zero invoices,
  zero balance transactions, one OFFLINE payment method with no card data.
- 2026-07-26: **live demo adapter moved off the `notes` overload.**
  `runtime/src/adapters/core-spa-demo-adapter.js` now writes its idempotency key
  to `RECORD_CODE` and leaves `notes` as a human label, matching the seed.
  Core cannot filter on dynamic attributes and **fails silently** — a filter on
  `attributes.RECORD_CODE` returns 200 with zero rows — so the adapter matches
  client-side over one account-scoped list (down from two list calls) with a
  `notes` fallback for pre-existing rows. `core-spa-demo-adapter-check.mjs`
  updated to the new contract and extended with replay-idempotency and
  legacy-marker cases; it passes. Runtime source only — the deployed CMS bundle
  still carries the previous build.
- 2026-07-26: **W2 opened; S3 appointments and plans are live.** Appointments
  now narrow to the signed-in customer via the `CUSTOMER_ACCOUNT` attribute
  (3 customer rows out of 5 tenant rows on staging), the envelope reports both
  counts so the gap is not hidden, an unresolved account yields an empty list
  rather than the tenant's, and booking writes the customer link so a new visit
  does not vanish from its own list. A new `core-plans-adapter.js` returns the
  unified `/plans` read model — packages from `SPA_PLAN_ENROLLMENT` with a
  derived `remainingUses`, memberships from `Subscription` with title and price
  joined from the order line — matching the accepted fixture shape field for
  field, with workflow-state mapping in one table and a loud failure for any
  state outside the approved vocabulary. Both adapters carry
  `scopeMode: "customer-filtered-client-side"`: the narrowing is presentation,
  never an authorization boundary. Evidence: `evidence/S3.md`.
- 2026-07-26: **S3 purchases live.** `core-orders-adapter.js` now emits the
  purchase read model instead of a raw order list: `kind` derived from the
  `SPA_ITEM_*` line types with `MIXED` when they differ, `customerStatus`
  mapped through one table with the raw state kept alongside, real lines and
  item summaries, and fulfillment joined from the `SPA_FULFILLMENT` shipment via
  `SOURCE_ORDER` — a ready pickup surfacing as `Ready for pickup` with the
  accepted notice. Live: 5 purchases from 7 account orders. Two invariants
  hardened: account scope is now validated for every returned row before the
  line filter (a foreign order with no lines previously slipped past), and an
  Order with no lines is excluded as not-a-purchase with `ordersWithoutLines`
  reported so the drop is visible — it would otherwise have crashed `KindChip`
  on a null kind. Remaining in S3: the Spa Profile read shape and selecting the
  plans adapter in `modules/index.js`, which lands with S4. Two design gaps are
  recorded for later waves (`EXPIRED` plan, `RETURN_REQUESTED`/`RETURNED`
  purchase); both fail loudly today rather than being labelled by guesswork.
- 2026-07-26: **S3 done.** The Spa Profile read is live and least-data: phone is
  read from the customer Account's `PHONE` contact entry (Contact is a nested
  collection on Account, so it has no endpoint of its own), a foreign account can
  never supply it, and it stays read-only because no scoped contact write
  contract exists. Preferences remain explicitly unavailable — Core has nowhere
  to persist them (`UserOrganizationPreferences` holds only `{id, user}` and both
  preference endpoints return empty). The seed gained a matching `PRIMARY`
  contact for the demo customer, saved inline with the Account and idempotent
  across runs. Live: `phone +1 512 555 0143`, `allowedActions [edit-email]`,
  `unavailableFields [preferences]`. All four read domains — appointments,
  plans, purchases, profile — now come from live Core with no private fixtures.
  Next: S4 wires the plans adapter into `modules/index.js` and renders the
  accepted read states against live data.
- 2026-07-26: **S4 done; W2 closed.** Appointments, Purchases, and Profile were
  already wired to live module data and only needed S3's shapes. The plan
  surface was not wired at all: a `plan` module now exists in the registry and
  `spaPlans()` reads the live envelope, showing nothing rather than fixtures when
  the module has not loaded. `SpaPlanPage` had a message that had become false —
  "Personal plan details aren't in the current API" — which is now gated on the
  module being enabled rather than on the demo command mode, and the page takes
  its state from `moduleStatus.plan` like Purchases does instead of the fixture
  scenario. New browser-free `scripts/plan-module-check.mjs` passes alongside all
  adapter checks. **Not verified here:** pixel acceptance at the four widths, the
  plan route × state matrix, and the browser purchase assertions all need
  Playwright, which is absent on this machine; they are unrun, not passed, and
  must execute before W6 claims visual parity. Evidence: `evidence/S4.md`.
- 2026-07-28: **Two handoff packages created**, so the remaining work survives
  this session. `docs/stream-tasks/calm-harbor-commerce-commands-wave/` carries
  W4 — server cart, sellability, simulated checkout, pickup record — with
  cancel/return explicitly out of scope behind their two blockers.
  `docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/` opens a separate
  stream that audits the transferred runtime against `design-inbox/**`,
  classifies every deviation, and routes design gaps to Claude Design as briefs
  in `design-requests/`. That audit gates W6: visual parity cannot be claimed
  without it, and no Playwright machine has run the visual suites yet.
- 2026-07-26: **Package rebuilt and uploaded; the deployed portal now runs this
  work.** The runtime was compiled and exported
  (`build-calm-harbor-target-runtime.mjs` then
  `export-calm-harbor-portal-manual.mjs`) and the four root fields were uploaded
  to `CUSTOMER_PORTAL_CALM_HARBOR_STAGING` by hand; the user confirms the UI
  updated and works. This is the first upload in this program — every previous
  manifest recorded `uploadPerformed: false`, and the generated manifest still
  does, since the exporter does not perform the upload. Live from this build:
  the customer-scoped reads (appointments, purchases, plans, profile), the
  purchase model with fulfillment, booking and reschedule, and the price
  migration. Cancel ships but stays inert while workflow event dispatch is
  broken — it fails closed rather than claiming success. Two exporter fixes were
  needed to build at all: the price-attribute filter became optional (it must now
  be configured as a code/values pair or not at all) and `amountMinorDivisor`
  became optional. The PIM variant package was migrated to the system price types
  in the same pass, since it reads the same prices and would have returned an
  empty catalog once the local type is removed.
- 2026-07-26: **Pricing correction after backend review** (`evidence/S3.md`
  §5a). `OrderItem.amount` is the **unit** price, which Core multiplies by
  `itemCount`; the seed wrote a pre-multiplied amount, doubling every
  multi-quantity order (retail order `grandTotal` 168 against one line of 42×2 —
  now $84.00). The purchase adapter compounded it by dividing to get a unit
  price and presenting the unit as a line total; it now shows the server value
  verbatim and **omits** the per-line total, which Core does not provide, taking
  the order figure from `grandTotal`. The plan's recurring rate was read from
  the order line rather than the catalog price, formatted with a hardcoded `$`,
  and carried a cadence read from a field that does not exist
  (`subscription.unit`; Core keeps it under `cadence.{period,unit}`), so the
  period silently vanished — it now comes from the `ProductPrice`
  `AMOUNT_MINOR`/`CURRENCY`/`INTERVAL`. Standing rule reaffirmed for W4+: money
  is read, never assembled; where the server gives no figure, show none. The
  Cart API does return `unitAmount`/`lineAmount`/`subtotal`, so checkout has
  server-owned totals to use.
- 2026-07-26: **S5 partially done; W3 blocked by a backend fault.** The S3 §6
  debt is paid: booking and checkout now resolve type, workflow, organization,
  currency, and the customer's care plan **by code**, and booking creates its own
  task per visit, so both work in a tenant with no prior rows and fail with named
  contract errors when a reference is missing. Two Core constraints were found
  and encoded: a Task must belong to a Project, and `project` must appear in the
  save *mappings* or the save NPEs. Live proof: an appointment was booked
  (`appt-core-9`), a replayed `requestRef` returned the same row without a second
  write, the visit appeared in the customer's own list, and reschedule moved it
  with readback. **Cancel is implemented and unit-proven but cannot run live:**
  **workflow event dispatch is broken tenant-wide.** `send-event` returns an
  opaque 500 for every entity kind (appointment, project, shipment) and
  `list-events` returns `[]` everywhere, reproducibly with the admin session and
  on rows the portal never wrote — so it is not caused by the portal code. It
  **regressed during this session**, but not from the workflow seed change: the
  workflow definitions were applied *first* and the entity seed then drove real
  transitions through this same call afterwards, so dispatch was working after
  they changed. The empty `list-events` is likewise normal — it returns `[]` for
  entities on workflows this session never touched. Cause unattributed from the
  client; a service restart is the cheapest next diagnostic, otherwise a
  server-side stack trace is needed. This blocks W3 cancel, W4 order
  cancel/return, and W5 plan cancellation — every remaining command that is a
  workflow event. Saves are unaffected, so book, reschedule, checkout, and
  profile update remain open. Evidence: `evidence/S5.md`.
- 2026-07-26: Scope clarified. "changes in `core-ui`" excluded the whole
  repository, which would have made S1's deterministic seed impossible: the
  tenant seed and the RBAC/type/workflow definitions live only in
  `core-ui/scripts/dev`, and the product contract already cites them. The line
  now excludes the `core-ui` application itself and admits its provisioning
  tooling. Work stayed split accordingly — seed tooling in `core-ui`, portal
  runtime and evidence here; nothing crossed over.
- 2026-07-26: **Debt recorded for W3** (`evidence/S3.md` §6). The read paths are
  generic, but both write commands clone a seeded row instead of resolving
  references by code: `createCoreAppointment` copies organization/task/type/
  workflow from any existing `SPA_VISIT`, and `createCoreOrder` copies
  currency/organization/type/workflow from the account's newest Order. Neither
  works in an empty tenant, a cloned reference can be the wrong one, and the
  booking path reuses another visit's Task to satisfy the NOT NULL `task_id`
  instead of creating its own. W3 touches both commands anyway and owns the fix;
  until then this is demo scaffolding, not production behaviour.
- 2026-07-28: **Correction — Playwright is available; the two entries above that
  call it absent are wrong.** This repo has no `package.json` and no
  `node_modules` by design, so every browser check resolves `playwright` and
  `pngjs` through `PLAYWRIGHT_NODE_MODULES`; pointed at the codex runtime cache,
  with `PLAYWRIGHT_EXECUTABLE_PATH` set to system Chrome, the suites run.
  `calm-harbor-wave17-visual-check.mjs` passes with 16 strict pairs and
  `changed=0`, and `calm-harbor-wave15-visual-check.mjs` passes with 12 paired
  surfaces. The bundled chromium is not downloaded — playwright 1.61.1 wants
  build 1228 and the cache holds 1217 — which is why the executable path is
  needed, or `playwright/cli.js install chromium` once.
  Four suites (`visual-acceptance`, `s7-route-state-check`,
  `config-behavior-check`, `calm-harbor-customer-portal-manual-check`) exit
  non-zero for reasons nobody has diagnosed. So visual parity is still unproven
  and W6 still waits on the audit — but the reason is those four failures, not
  missing tooling. D5 in the audit package is `todo`, not `blocked`; both child
  packages carry the setup and the known suite state.

- **2026-07-28 — the design fidelity audit is closed, and W6's visual gate can
  close with it.** Package:
  `docs/stream-tasks/calm-harbor-design-fidelity-audit-wave/`. All six slices are
  `done`, including D5.

  **Verdict: the transferred presentation is faithful; the live data path is
  not.** The stable-hook contract is intact — `data-route` matches 23 for 23,
  `routes.css` is 724/724 selectors identical, `SpaCartPage.js` and
  `CommerceBits.js` are byte-identical to the design, and the two alarming line
  deltas (product detail −92, shop −45) were proved mechanically to be comments
  and collapsed calls, not lost presentation. 118 findings: `invention` 22,
  `gap` 12, `drift` 34, `decision` 33, `design-gap` 15, inventory 2.

  **D5 is runnable and was run.** Playwright 1.61.1 → system **Google Chrome
  150.0.7871.129**. 44 paired surfaces at 390/768/1180/1440 — 16 measured in this
  wave, 28 inherited from the two already-green suites. Evidence:
  `…/calm-harbor-design-fidelity-audit-wave/evidence/responsive/README.md`.

  **All four undiagnosed suites now have a cause**, and only one is a finding:

  | suite | cause |
  | --- | --- |
  | `config-behavior-check` | **runtime drift** — `runtime/manifest.json` `fileInventory` is one short of disk (commit `84042c5` added two `src` files and bumped the counter by one) |
  | `visual-acceptance` | harness — the stored S4 packet's accent colour was never painted; geometry and text are pixel-identical, so it is a baseline-browser artifact, not layout drift |
  | `s7-route-state-check` | harness — it navigates every registered route without seeding `product.detail`'s required param, a route added after the check was written |
  | `calm-harbor-customer-portal-manual-check` | harness — its stub predates the wave-15 order fan-out; the runtime correctly refuses to render a partial order list |

  `calm-harbor-wave14-visual-check` was diagnosed too: it sets `capability` on
  the reference page and not the implementation page, so the preview boots to the
  OIDC route. Its three surfaces therefore have **no pixel measurement at any
  width**, which is the one coverage gap and is stated as such.

  **What W6 must not treat as closed.** Visual parity is proven; **data honesty
  is not.** Eleven HIGH findings share one root cause — the live path supplies
  what the server did not — and all of them sit in `adapters/`, `actions.js` and
  `state.js`, outside the audit's ownership zone, so none was fixed. The sharpest:
  an 8% tax computed in the browser and **written to Core**
  (`runtime/src/actions.js:597-608,410-412`); a fabricated visit location that
  makes the design's own honest fallback unreachable
  (`core-spa-demo-adapter.js:520-521`); an appointment status falling through to
  `Confirmed` for any unmapped Core state (`:553-558`); booking slots read from
  fixtures and booked against (`SpaBookingFlow.js:180-191`); and two surfaces
  telling customers in production that data is unavailable while displaying it
  (`SpaAccountPage.js:64-65`, `SpaProfilePage.js:147`). 27 tickets, full detail in
  `…/evidence/punch-list.md`.

  **Two traps recorded so a later wave does not spring them.** The orders route
  root carries raw adapter error codes as `data-state`, which reads as a contract
  break and is asserted deliberately at
  `scripts/calm-harbor-customer-portal-manual-check.mjs:198` as the fail-closed
  signal for a foreign Order — briefed, not fixed. And correcting
  `runtime/manifest.json` alone will **not** green `config-behavior-check.mjs`:
  line 626 compares it to disk while line 627 pins the same numbers as a literal
  contract, and 627 is in `scripts/`.

  **One correction to this program's evidence.** `evidence/S4.md` §3 says "Both
  treatments are accepted design" of the `SpaPlanPage` unavailable block. The
  gate is a recorded decision and stands; the block itself has zero design
  counterpart across 315 `design-inbox/` files. Recorded in the audit's
  `audits/A1.md` §Corrections to the record.

  Five design briefs filed and listed in
  `app-templates/customer-portal/design-requests/README.md`. Nothing under
  `runtime/` or `design-inbox/` was modified by the audit; the release compile was
  run as a health check and is green and idempotent.

- **W4 — Calm Harbor Commerce Commands: done.** Package
  `docs/stream-tasks/calm-harbor-commerce-commands-wave/`; closeout in its
  `evidence/closeout.md`, per-slice record in `audits/A1.md`. Commits `e08b0de`,
  `4634280`, `13bad3f`, `08274ce`, `3fd2329`, `1a4c936` on
  `codex/lab-ui-durable-catalog`.

  **The customer now has a server-owned cart and a real order.** One adapter owns
  every Core cart call; the bag renders only from the live envelope; sellability
  comes from the `SPA_STOCK` join and nothing else; and confirming creates one
  `SPA_ORDER` with typed `SPA_ITEM_*` lines, replay-safe, reported only from the
  Order readback, with the pickup dimension recorded for a retail order.

  **The money violation this program flagged twice is closed.** The 8% tax
  computed in the browser and written to Core — S3 §5a's lesson and the
  design-fidelity audit's sharpest finding — is deleted. `createCoreOrder` sends
  no `grandTotal`, `totalCharges` or `totalTaxes`; Core computes the total from
  the lines. Proven live: `order-core-13`, `grandTotal` 179 = Σ(`amount` ×
  `itemCount`), lines `SPA_ITEM_RETAIL` + `SPA_ITEM_SERVICE`, cart cleared only
  after readback, replay creating nothing. `invoice` and `balance-transaction`
  stayed at zero rows throughout; `payment` and `refund` have no endpoint.

  **Cancel and return stay `not_opened`**, both blockers unchanged: no accepted
  design for `RETURN_REQUESTED`/`RETURNED` (S3 §5) and tenant-wide workflow-event
  500s (S5 §4). Nothing was built against the dead endpoint.

  **Three backend faults found live, none of them the portal's.** The
  authenticated `core-pim` API alternates 200/401 on identical requests — one bad
  replica behind the load balancer — which W4's checkout was restructured to
  avoid but which **still degrades W2's inventory enrichment about half the
  time** (fails closed to `unknown`, so the Shop intermittently shows everything
  as unbuyable). `core-svc` and `core-rm` refuse a customer token outright, which
  blocks the appointments read and is why a customer-created pickup carries no
  studio. And two `=` filters on the same property are ANDed into an empty body
  — the same silent-zero-rows class as the unfilterable dynamic attribute.

  Two design requests are open and gate live states: the `unknown` stock
  treatment (10 of 12 retail products have no inventory row) and the cart totals
  card (Core states only a subtotal). Two browser suites fail that were not on
  the package's known-bad list; both were verified to fail identically at
  `b808ac4`, before the wave opened. No CMS upload was performed.
