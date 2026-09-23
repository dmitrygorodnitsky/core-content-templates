# Customer Portal — cross-session handoff

Updated: 2026-09-22

This is the canonical resume checkpoint for the customer portal work: the Calm
Harbor spa tenant, the Granite Ridge snow tenant, the universal form document,
and the Core Auth CMS login skin. Read this file and
`AGENTS.md` before changing anything. Do not treat the designer handoff under
`design-inbox/HANDOFF.md` as production authority outside presentation.

## Objective and completion boundary

Deliver a convincing one-customer Calm Harbor Spa staging portal on the APIs
that exist today, while keeping the production boundary honest:

- the signed-in Core User resolves to exactly one customer Account;
- current catalog, cart, purchases, and allowed demo commands use Core;
- payment is explicitly `SIMULATED` and creates no financial transaction;
- private data never comes from CMS or fixture fallback in live mode;
- Support remains unopened;
- production readiness still requires server-enforced customer-scoped APIs.

The staging demo is not evidence of production tenant isolation. Browser-side
filters against generic entity endpoints are acceptable only for this bounded
one-customer demonstration.

## Repository checkpoint

- Repository: `/Users/imighty/Code/core-content-templates`
- Branch: `codex/lab-ui-durable-catalog`
- Implementation checkpoint before this handoff refresh: `a2fd49e`
- Current staging tenant: `CALM_HARBOR_SPA_STAGING`
- Main authenticated CMS family: `CUSTOMER_PORTAL_CALM_HARBOR_STAGING`
- Public landing CMS family: `CUSTOMER_PORTAL_CALM_HARBOR_LANDING_STAGING`

The pre-cleanup implementation state, including the accepted Wave 18/19 auth
assets and customer-experience compiler, is preserved in commit `f9beaff`.
Do not reset or rewrite that checkpoint when changing the repository layout.
`design-inbox/**` remains user/designer-owned and immutable to Codex.

Canonical family configuration now lives under `experience/**`; generated
packages remain under `dist/**`, and stable CLI entrypoints remain under
`scripts/**`.

## Authority map

- `app-templates/customer-portal/AGENTS.md` — mandatory edit rules.
- `design-inbox/**` — accepted executable visual truth; never edit it.
- `ARCHITECTURE.md` — runtime, routing, security, and behavior contract.
- `DATA-OWNERSHIP.md` — which facts may be live and who owns them.
- `content/cases/CORE-CUSTOMER-PORTAL-CONTRACT.md` — current User → Account →
  Orders staging boundary.
- `content/cases/CALM-HARBOR-CUSTOMER-PORTAL-PRODUCT-CONTRACT.md` — target
  customer-facing purchase/plan/API model.
- `content/cases/SPA-VERTICAL-CORE-MODEL.md` — deployed Core types, workflows,
  entity relationships, and money ownership.
- `content/cases/SNOW-VERTICAL-CORE-MODEL.md` — the same for the winter-services
  vertical, read from `dev-1` as `SNOWLIMITLESS`: types, pricing, magic links
  (§6c), settled decisions (§7) and the rules for reading Core without breaking
  it.
- `content/cases/QUOTATION-PACKAGE-FLOW.md` — the quotation, contract and client
  activation design: the service agreement as the quotation package, its
  workflow, hooks, links and pages.
- `content/cases/QUOTATION-FLOW-IMPLEMENTATION-GAPS.md` — what workflow 49 and
  its scripts do, the team's answers, the takeover into `core-ui`, and dev-1 on
  2026-09-15 and 2026-09-16.
- `content/cases/SNOW-CUSTOMER-PORTAL-API.md` and
  `content/cases/CUSTOMER-SCOPE-GENERIC-API.md` — the customer-scoped API the
  backend owes, per screen and as one generic capability.
- `docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/master.md`
  — program container. Its ledger is partly stale: the separate commerce wave
  closed W4 after the master was written.
- `docs/stream-tasks/calm-harbor-commerce-commands-wave/evidence/closeout.md`
  — current commerce truth and reproducible checks.

Generated output under `dist/manual-upload/**` is exporter-owned. Never edit it
by hand.

## Settled product and domain decisions

### Identity and scope

The customer is an Account linked through `Account.user` to the authenticated
Core User. The portal:

1. calls `/core/api/user/basic-info.json` without an organization header;
2. verifies `CALM_HARBOR_SPA_STAGING` is authorized for the User;
3. lists Accounts with both `user.id` and `type.code = SPA_CUSTOMER`;
4. requires exactly one match;
5. scopes Orders by `Order.account`.

Zero Accounts, multiple Accounts, an unauthorized organization, an expired
session, or a failed source all fail closed. Generic entity permissions do not
prove row isolation, so the backend still owes customer-scoped portal APIs.

### Orders and fulfillment

Use one order type: `SPA_ORDER`. Purchase kind comes from line types:
`SPA_ITEM_SERVICE`, `SPA_ITEM_RETAIL`, `SPA_ITEM_PACKAGE`, and
`SPA_ITEM_MEMBERSHIP`. Mixed lines produce a portal-derived `MIXED` label.
Pickup is a separate `SPA_FULFILLMENT` Shipment linked through the
`SOURCE_ORDER` attribute; it is not a special Order type.

Money is server-owned. `OrderItem.amount` is a unit price, quantity is
`itemCount`, and `Order.grandTotal` is computed by Core. The browser must never
send or reconstruct an order total. Cart UI uses Core's `CartView.subtotal` and
line amounts verbatim.

### Plans

- A purchased package becomes a customer-scoped `SPA_PLAN_ENROLLMENT` Project
  with total/used credits and optional expiry.
- A membership becomes a Subscription and has no invented visit balance.
- Organization `EntitlementGrant` rows are RBAC, not customer memberships.
- Plan `EXPIRED` and completed `RETURNED` purchase presentation require accepted
  design states before they can be opened.

### Booking

Appointments belong to Tasks, and Tasks belong to Projects. The current Core
model now carries customer Account/User attributes on relevant Spa entities,
but production booking still needs a server-scoped contract with availability,
hold/idempotency, and authoritative readback. Do not claim a server hold when
none exists. The one-user staging demo may demonstrate current API commands;
that does not close the scoped backend requirement.

Wave 20 is now activated for the bounded staging flow through generic Core
attributes. `SPA_SERVICE.BOOKING_OPTIONS` carries a schema-versioned booking
options/quote read model; provider/studio Resources remain the authority for
slots and the selected location. Confirmation and rescheduling write
`VISIT_MODE`, `LOCATION_RESOURCE`, `LOCATION_LABEL`, `ADD_ON_REFS`,
`CUSTOMER_NOTE`, and `BOOKING_OPTIONS_VERSION` to `SPA_VISIT` and require those
values in authoritative readback. This is not a server quote or slot hold: the
UI continues to label payment and hold behavior as simulated/current-API demo.

### Payment

Payment stays `SIMULATED`. Checkout may create a real staging Order and related
records, but it must not create or claim a charge, paid Invoice, receipt,
BalanceTransaction, refund, or PSP result.

## Current functional checkpoint

- Core OIDC and the route-root account gate exist. Private portal contents are
  hidden until session, organization, and customer Account checks succeed.
- Public PIM pricing/products are live from the same-origin Core PIM catalog.
- ProductModel and published ProductReview enrichment exists for the staging
  demo; media/inventory remain source-dependent and fail closed.
- Account-scoped read-only Orders are live-proven for the test customer.
- The server Cart is live. Add/change/remove/clear re-read authoritative Core
  state. Sellability is `sellable | out-of-stock | unknown` from inventory;
  unknown is not buyable.
- Simulated checkout creates a real `SPA_ORDER`, typed OrderItems, and retail
  pickup fulfillment, then renders only from readback. Replay is idempotent.
- Appointment/plan/profile demo surfaces exist, but the production scoped API
  program is not complete.
- Cancellation/return workflow commands remain unopened because the workflow
  event path returned an opaque 500 and required terminal design states are
  incomplete.
- Support remains unavailable by product decision.

The active generated portal is:

```text
app-templates/customer-portal/dist/manual-upload/customer-portal-calm-harbor-staging
```

Its root currently enables appointments, orders, services, pricing, products,
account, cart, checkout, purchases, plan, and profile for the bounded staging
demo. Do not confuse this with a production-safe scoped portal.

## Core Auth CMS login checkpoint

The old tenant-specific local package was removed. It was generated output in
an authored-package zone and had incorrectly become an upstream dependency of
the generic compiler.

Canonical accepted source and generated output are now:

```text
app-templates/customer-portal/design-inbox/core-auth-login.html
app-templates/customer-portal/dist/customer-experience/calm-harbor-spa-staging/login/
```

`build-customer-experience.mjs` compiles login directly from the immutable Wave
18 HTML and linked accepted styles. It also builds landing from the authored
landing/content pipeline in memory; it never reads a prior package from
`dist/**`.

Historical deployed tenant-specific CMS BlockTemplate:

```text
code: CUSTOMER_PORTAL_CALM_HARBOR_LOGIN
id:   17c450d7-963e-4837-891a-15d01fb35c80
org:  SYSTEM
```

The historical tenant-specific template was initialized on `dev-1` with exact
`head`, `html`, `javascript`, `css`, and 20 parameters. A raw CMS readback
confirmed all four content fields match byte-for-byte and all 20 normalized
parameters match.
The final repeat run reported `Updated: 0`, `Content fields changed: 0`, and
`Unchanged incoming: 20`, with no network write.

Do not use or delete the older experimental template ids
`bf6bb842-e02b-4f1b-8b13-48cf92bd0e3c` and
`23749960-38a0-48bc-a7e3-27f4b52b9fdb`; their cleanup was not authorized.

### CMS behavior learned

1. `block-template/save.json` is not a true partial update: a payload containing
   only `id`, `optimistic`, and `parameters` returns `400`. Preserve required
   fields such as code, NLS, organization, template language, and advanced.
2. A blank template does not retain unused parameters. A parameter-only save
   can return success and a subsequent read still returns zero parameters.
3. Initializing a blank template therefore requires one atomic save of content
   and parameters using `--with-content`.
4. CMS normalizes JSON field order and may return `options`; comparisons must be
   canonical and ignore non-semantic ordering. The sync script now does this
   and skips genuine no-op writes.
5. Send localized values only for languages enabled in the organization. An
   earlier value map containing `ru` produced an empty-body `400`; the current
   package intentionally ships `en` only.
6. Core Auth placeholders use double braces and must survive CMS unchanged:
   `LOGIN_ACTION`, `CSRF_PARAMETER_NAME`, `CSRF_TOKEN`,
   `RESET_PASSWORD_URL`, `ERROR_DISPLAY`, and `LOGOUT_DISPLAY`.
7. For manual paste, use either complete `head.html` with its style block or the
   split `head.no-style.html` plus `css.css`; never paste the CSS twice.
8. A direct CMS read does not substitute the Core Auth display placeholders.
   Generated login markup therefore emits
   `display:none;display:{{ERROR_DISPLAY}}` and the equivalent logout rule:
   the unresolved CMS source fails closed, while Core Auth's later `block|none`
   substitution remains authoritative.
9. The direct CMS compatibility path retrieves the current `_csrf` value from
   same-origin `/oauth2/login`, uses a drop-while-running scripted submit, and
   returns successful session login to a same-origin `returnUrl` query value or
   descriptor-owned `CX_PORTAL_URL`. Cross-origin and login-loop returns are
   rejected. If Core Auth has already substituted all placeholders, the
   accepted native POST remains active and the compatibility bootstrap does
   nothing. Bootstrap unavailable/retry presentation is still open in
   `design-requests/core-auth-direct-session-bootstrap.md`.
10. The deployed historical template id still belongs to the legacy 20-code
    parameter contract (`TITLE`, `BRAND_NAME`, `CARD_TITLE`, and peers). Do not
    sync the 26-code generic `dist/customer-experience/.../login/template.json`
    directly into that id: its PageContext has no `LOGIN_*`/`CX_*` values and
    renders blank copy. Use `export-calm-harbor-login-manual.mjs`; it preserves
    the legacy codes, adds the direct-session bootstrap, and rejects JTE markers
    in executable fields. Sync that package with `--mode replace` and
    `--with-content`.

Current local build and transfer checks:

```bash
node app-templates/customer-portal/scripts/build-customer-experience.mjs
node app-templates/customer-portal/scripts/customer-experience-login-check.mjs
node app-templates/customer-portal/scripts/customer-experience-direct-login-check.mjs
node app-templates/customer-portal/scripts/export-calm-harbor-login-manual.mjs
node app-templates/customer-portal/scripts/customer-experience-login-visual-check.mjs
```

No upload or PageContext switch is performed by these commands. Any future CMS
activation must use the generated generic `CUSTOMER_EXPERIENCE_LOGIN` template,
a separately approved template id, and an explicit consumer-switch plan.

Not yet proven after switching to the new template id: the PageContext at the
canonical anonymous login URL and the complete Core Auth redirect/login/return
flow. The template itself is proven; the consumer wiring still needs an
end-to-end check.

## Provisioning commands in `core-ui`

Repository: `/Users/imighty/Code/core-ui`.

Full types, workflows, tenant, entities, and customer-role provisioning:

```bash
cd /Users/imighty/Code/core-ui
npm run beauty-spa -- apply --apply \
  --base-url=https://dev-1.servicewand.com/core \
  --org=CALM_HARBOR_SPA_STAGING \
  --bootstrap-org=SYSTEM
```

Resume only from entities after the type/workflow foundation is already
present:

```bash
npm run beauty-spa -- apply --apply \
  --from=entities \
  --base-url=https://dev-1.servicewand.com/core \
  --org=CALM_HARBOR_SPA_STAGING \
  --bootstrap-org=SYSTEM
```

`beauty-spa` creates both definitions and records from its selected `--from`
stage onward. `beauty-spa-entities` creates/updates records only and expects all
referenced types and workflows, including `SPA_PRODUCT_REVIEW_LIFECYCLE`, to
already exist.

Do not migrate or delete the superseded `SPA_STANDARD_PRICE` /
`SPA_SERVICE_ORDER` staging records without a separately authorized migration.
The organization-cascade document also contains unresolved, destructive
migration questions; it is analysis, not permission to re-parent or rename
live types.

## Generic customer-experience family checkpoint

A report-only descriptor/registry/compiler now connects the landing, portal,
Core Auth login, and Core Auth 2FA as one parameterized family. It is additive and has not
uploaded or switched any existing Calm Harbor PageContext or CMS consumer.

Primary sources:

- `experience/config/customer-experience.schema.json`;
- `experience/config/customer-experience.parameters.json`;
- `experience/contracts/CUSTOMER-EXPERIENCE-PARAMETER-CONTRACT.md`;
- `experience/contracts/ANONYMOUS-INTENT-AUTH-RESUME-CONTRACT.md`;
- `scripts/create-customer-experience.mjs`.

The descriptor now includes anonymous-intent and registration modes. Calm
Harbor keeps both closed. The dormant runtime primitive stores only a bounded,
short-lived public selection capsule and reconciles single-flight only after
authentication and Account resolution. It is not wired to visual controls or
server handlers because accepted pending/retry/expiry/changed-truth states and
registration/Account-provisioning evidence do not exist yet. The missing
presentation is filed in
`design-requests/customer-experience-anonymous-intent-auth-resume.md`.

The staging descriptor now reserves these canonical PageContext routes:

```text
landing: https://dev-1.servicewand.com/calm-harbor-spa
portal:  https://dev-1.servicewand.com/calm-harbor-spa-customer-portal
```

They are `planned`, not `resolved`: anonymous probes returned HTTP 404 on
2026-08-05. The compiler can already derive `#/services`, `#/pricing`,
`#/products`, and `#/login` transitions, but publication remains blocked until
the PageContexts are deployed and read back. Core discovery currently reports
authority `https://dev-1.servicewand.com/oauth2`, authorization endpoint
`/oauth2/oauth2/authorize`, and callback `/core/oauth2-callback.html`; these stay
discovery-owned rather than CMS-authored navigation parameters.

The tenant-specific manual landing exporter also reads the planned portal URL
from this descriptor. Its root exposes `ROOT_NAV_PORTAL_URL`, and every
`auth.gotoSignin` action delegates to that value. This keeps the currently
uploaded manual landing functional during the migration without hardcoding the
Core Auth endpoint; the portal remains responsible for starting OIDC.

Wave 19 accepted the CMS-skinned `/auth/2fa.html`. The compiler now emits
`CUSTOMER_EXPERIENCE_AUTH_2FA` from that immutable source, with 24 safe CMS
parameters and eight byte-preserved Core Auth runtime placeholders. The
generated template is self-contained, script-free, and shares the trusted
Core Auth PageContext selector gate with login.

The `customer-experience-configurator` skill is installed under
`~/.codex/skills/`. It runs the Q&A wizard, produces a descriptor plus creation
report, and keeps unresolved deployment/evidence gates fail-closed.
Planned routes remain deployment evidence gates until CMS readback succeeds.

Focused checks:

```bash
node app-templates/customer-portal/scripts/customer-experience-wizard-check.mjs
node app-templates/customer-portal/scripts/customer-experience-config-check.mjs
node app-templates/customer-portal/scripts/anonymous-intent-check.mjs
node app-templates/customer-portal/scripts/customer-experience-build-check.mjs
node app-templates/customer-portal/scripts/customer-experience-2fa-check.mjs
PLAYWRIGHT_NODE_MODULES=/path/to/node_modules PLAYWRIGHT_EXECUTABLE_PATH=/path/to/chrome node app-templates/customer-portal/scripts/customer-experience-2fa-visual-check.mjs
```

## Build, validation, and upload

Focused deterministic checks from the repository root:

```bash
node app-templates/customer-portal/scripts/core-account-adapter-check.mjs
node app-templates/customer-portal/scripts/core-orders-adapter-check.mjs
node app-templates/customer-portal/scripts/core-cart-adapter-check.mjs
node app-templates/customer-portal/scripts/pim-adapter-check.mjs
node app-templates/customer-portal/scripts/core-pim-enrichment-check.mjs
node app-templates/customer-portal/scripts/cart-module-check.mjs
node app-templates/customer-portal/scripts/plan-module-check.mjs
node app-templates/customer-portal/scripts/core-plans-adapter-check.mjs
node app-templates/customer-portal/scripts/core-spa-demo-adapter-check.mjs
node app-templates/customer-portal/scripts/core-user-profile-adapter-check.mjs
node app-templates/customer-portal/scripts/build-calm-harbor-target-runtime.mjs
node app-templates/customer-portal/scripts/export-calm-harbor-portal-manual.mjs
node app-templates/customer-portal/scripts/calm-harbor-customer-portal-manual-check.mjs
```

The last two generation commands own the manual package; do not hand-edit its
output. Live checkout probes create real staging Orders and must not be run
casually.

Authenticated portal upload:

```bash
SERVICEWAND_API_KEY=... \
node app-templates/landing-page/scripts/upload-cms-family.mjs \
  --out app-templates/customer-portal/dist/manual-upload/customer-portal-calm-harbor-staging \
  --base-url https://dev-1.servicewand.com/core \
  --org SYSTEM \
  --live
```

Public landing upload uses the same uploader with:

```text
--out app-templates/customer-portal/dist/manual-upload/customer-portal-calm-harbor-landing-staging
```

Granite Ridge has one entrypoint that chains rebuild, repackage, its checks and
the upsert by template code. Dry-run is the default; `--require-existing`
refuses to create a duplicate if the code is not already in the target
organization:

```bash
SERVICEWAND_API_KEY=... node app-templates/customer-portal/scripts/upsert-granite-ridge-portal.mjs --base-url https://dev-1.servicewand.com/core --org SYSTEM --require-existing --live
```

The whole deterministic suite for the snow tenant and the form:

```bash
node app-templates/customer-portal/scripts/granite-ridge-fixture-check.mjs
node app-templates/customer-portal/scripts/appointments-check.mjs
node app-templates/customer-portal/scripts/live-weather-check.mjs
node app-templates/customer-portal/scripts/property-map-check.mjs
node app-templates/customer-portal/scripts/snow-contracts-check.mjs
node app-templates/customer-portal/scripts/snow-live-overview-check.mjs
node app-templates/customer-portal/scripts/core-snow-adapter-check.mjs
node app-templates/customer-portal/scripts/granite-ridge-portal-manual-check.mjs
node app-templates/customer-portal/scripts/granite-ridge-landing-manual-check.mjs
node app-templates/customer-portal/scripts/portal-form-check.mjs
node app-templates/customer-portal/scripts/client-review-check.mjs
node app-templates/customer-portal/scripts/calm-harbor-fixture-check.mjs
node app-templates/customer-portal/scripts/customer-experience-config-check.mjs
node app-templates/customer-portal/scripts/cms-schema-validation.mjs
```

## Granite Ridge snow tenant and the quotation flow

Status on 2026-09-15. The tenant is `SNOWLIMITLESS`, organization 43 of type
`OPERATOR`, on `dev-1`. The client's "Quotation → Contract → Client Activation"
specification is authoritative but not in the repository; the snow documents in
the authority map carry its requirements, the founder's and the team's answers,
and every decision taken where it is silent.

### Settled decisions

- **The service agreement is the quotation package** (2026-09-11). One
  `FIELD_SERVICE_ORDER` prices one property under one pricing model. The
  `SERVICE_AGREEMENT` document collects the internally approved Orders, is sent
  once, receives the client's contract details as attributes of its
  `AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED` event; the transient hook
  validates and persists them before moving the agreement to `DRAFT`.
- **Every entity is created with the request** (the user, 2026-09-17,
  superseding the team's "quotation is manual" of 2026-09-10). A submitted quote
  form creates the Account, its addresses, a property per address and three
  Orders per property, one per pricing model. The manager takes the request by
  moving it from `NOTIFIED` to `PROCESSED` by hand, which sends the requester
  the email with the Account link (the user, 2026-09-21), reviews and corrects
  the Orders, and sends one link for all of them through a bulk action designed
  separately. The form no longer collects a property size. A failed automated
  step must land in a visible state.
- **Customer Portal entitlement is an attribute of the `OPERATOR` organization**
  (2026-09-11). This remains the product design; staging defers the flag and
  provisions a portal User when a client Account is activated after approval.
- **Beam AI measurements are not stored on `SNOW_REMOVAL_PROPERTY`** for now
  (2026-09-11); the founder prices from one parameter.
- **Anonymous steps run through magic links, and a signed-in client's input
  through forms**: `QUOTE_CHANGE_REQUEST`, `SUPPORT_REQUEST` and
  `SUPPORT_TICKET_REPLY` (2026-09-11).
- **Signed-in clients need a customer-scoped API before production.** It is
  requested per screen in `SNOW-CUSTOMER-PORTAL-API.md` and as one generic
  capability in `CUSTOMER-SCOPE-GENERIC-API.md`.
- **Presentation is designed in the session** (2026-09-11); see `AGENTS.md`.

### Surfaces

| surface | source | preview | check |
| --- | --- | --- | --- |
| portal | `runtime/data/cases/granite-ridge-snow.js`, profile `stormRetail` | `runtime/granite-ridge-snow.html` | `granite-ridge-fixture-check.mjs` |
| appointments, property, visit | same fixture | same entry | `appointments-check.mjs` |
| weather | `runtime/src/adapters/xweather-adapter.js` | same entry | `live-weather-check.mjs` |
| property map | `runtime/src/components/storm/PropertyMap.js`, `runtime/src/adapters/google-maps-adapter.js` | same entry; without a key it lists the properties | `property-map-check.mjs` |
| contracts as a package | `runtime/src/normalizers/contracts.js`, `runtime/src/components/proposals/QuotePackage.js` | same entry, Contracts | `snow-contracts-check.mjs` |
| live properties and home | `runtime/src/adapters/core-snow-adapter.js`, `runtime/src/state.js` | — | `core-snow-adapter-check.mjs`, `snow-live-overview-check.mjs` |
| portal package | `content/cases/granite-ridge-snow.customer-portal-fixture.json` | `dist/manual-upload/customer-portal-granite-ridge-fixture/preview.html` | `granite-ridge-portal-manual-check.mjs` |
| live portal package | `cms/granite-ridge-snow.customer-portal-staging.json` | dev-1 `/pages/SNOWLIMITLESS/portal` | `granite-ridge-staging-portal-manual-check.mjs` |
| live Contracts and profile | `runtime/src/adapters/core-snow-adapter.js`, `runtime/src/contract-commands.js`, `runtime/src/adapters/core-account-profile-adapter.js` | same entry | `snow-contracts-live-check.mjs`, `snow-account-profile-check.mjs`, `snow-portal-shell-check.mjs` |
| client review document | `runtime/client-review/` | `runtime/client-review.html` | `client-review-check.mjs` |
| quote form document | `runtime/forms/portal-form.js` | `runtime/portal-form.html` | `portal-form-check.mjs` |
| landing | `scripts/export-granite-ridge-landing-blocks-manual.mjs` | `dist/manual-upload/customer-portal-granite-ridge-landing/preview.html` | `granite-ridge-landing-manual-check.mjs` |

Checks live under `scripts/`. Routes in the `stormRetail` profile: `overview`,
`appointments`, `visit.detail` (`/visits/:id`), `property.detail`
(`/properties/:id`), `calendar`, `care`, `proposals.list`, `proposals.detail`,
`support`, `activity`, `profile`, `pricing`. Shop, Services, checkout and the
cart are retired: every service is ordered through the quote form, and the
primary button leaves for `PORTAL_REQUEST_FORM_URL`.

### What is already live

`runtime/src/live-weather.js` fetches one daily forecast per service zone from
Xweather and replaces `overview.weather` when a key is configured, plus one
forecast for a property's own point, rounded to 0.01°, the first time its popup
opens. Every failure — no key, a half key, HTTP 401, and Xweather's habit of
answering a rejected key with HTTP 200 and `success:false` — falls back to the
fixture, or in the popup to the zone forecast labelled as the area forecast.

The Xweather map image was retired on 2026-09-11: it cost 60 accesses a view.
The card is a Google Maps JavaScript API map when `data-portal-maps-api-key`
(`PORTAL_MAPS_API_KEY`) holds a key, styled by the optional
`data-portal-maps-map-id`. Pins are the portal's own buttons drawn through an
`OverlayView` rather than advanced markers, which do not render without a Map
ID. The map element survives the runtime's full re-render, so a render is never
a second map load. A popup opens anchored to its pin; on a map narrower than
648 px, where a 288 px popup cannot sit beside a pin in the middle, it docks below
the map inside the card instead, and a resize across that width moves an open
popup between the two. A property without coordinates is geocoded once and cached in
`localStorage`; without a key, or when Google rejects it, the card lists the
properties instead. Their presentation was designed in the
session on 2026-09-15.

Credentials travel as `data-portal-weather-client-id` / `-secret`. They are
public by design and origin-scoped; the demo key in the repo is disposable and
its namespace should be restricted to whatever host serves the portal.

### Built on 2026-09-15, on fixtures

- **Contracts show the package.** The header comes from the agreement: its
  state, its dates when present, counts, and "N of M properties decided" while
  quotes are under review. Rows are Orders grouped by property, with a
  pricing-model label only for known codes and Core's total only above zero with
  a currency. The rollup counts Orders; a property is decided when one option is
  approved or all are declined. The Contracts map is a schematic pinned only from
  stored or already geocoded coordinates. A request still being prepared says
  "We have your request" and never shows the withheld count. `proposals` stays
  disabled in live mode.
- **The home map explains a missing pin** — "Finding it on the map…", "Address
  not found on the map", "No address on file" — keeps its height while locating,
  never falls back to the map centre, and credits the weather once per card.
- **Live mode claims nothing its sources do not hold.** A section without a
  source says "Not available yet" and offers no action. The live overview model
  declares its `sources`; a section may say it is empty only once its source is
  `ready`, and a newly opened source still needs its own loading and error
  states. Contract, visit, monitoring and trigger facts, including a property
  status on the map and on property detail, appear only when their sources are
  open, and the weather card keeps only what Xweather answers. The unread dot on
  the header bell and a deep link that said a property was not found while the
  list was still loading were fixed on 2026-09-23. Trigger and dispatch
  wording remains on the storm home, calendar, season log, appointments and
  order pages, none of them enabled live.
- **`CLIENT_REVIEW_DOCUMENT` is the anonymous page behind both links**: quote
  review with approve, decline and request changes, the contract details step,
  "being prepared", agreement review with approval, completion, and the link,
  error and partial states. It reads the token only from `#token=`, sends one
  command at a time, and renders only what it reads back. An option shows the
  server's `totalCharges` and `totalTaxes` above its total when they are
  returned, and the two confirmations read as statements a client can agree to.
  Its CMS parameters are `REVIEW_API_BASE_URL` and copy. Its live adapter has
  contract coverage for the combined `Document`, `Account`, `Order`,
  `OrderItem`, `ProductPrice` and `Product` grant. The production CMS package
  still needs upload and a browser pass with a fresh real link.
- **The quote form** keeps the first click, Tab focus and one geocode per
  address, its suggestions follow the ARIA combobox pattern, and its success
  screen lists next steps from copy parameters. Values proposed for the
  `GET_QUOTE_` page, not yet set in CMS: `SUCCESS_TITLE` "Request received",
  `SUCCESS_BODY` "Thank you. Your request has reached our team.",
  `SUCCESS_NEXT_TITLE` "What happens next", `SUCCESS_STEP_1` "We prepare quotes
  for each property you listed." and `SUCCESS_STEP_2` "You get one email with a
  link to review them."

Screenshots of all four went to the user on 2026-09-15 for acceptance.

### Assumed and not yet verified

- ~~The grant requests.~~ **Verified on 2026-09-17** against a real link on
  dev-1: POST with a JSON body, `list.json` paged, `get.json?id=`, `event.json`
  with `{id, event, metadata}`, a grant issued on `core-bill` read through
  `core` and `core-acct`, `403` for an event outside the grant and `404` for an
  entity outside it.
- ~~`MAPPINGS_ORDER` and `MAPPINGS_DOCUMENT` must exist first.~~ **Superseded.**
  A link's fields come from a SYSTEM `EntityMappingDefinition`, and its ceiling
  is the authority; scripts 203 and 204 are not consulted. On 2026-09-18 the
  deployed ceiling accepted `attributes` as a primitive. SYSTEM `DEFAULT`
  profiles 102 (Account), 114 (Order) and 11 (Document) were updated. A fresh
  combined grant rechecked on 2026-09-21 returns Order totals and
  `states[].code`, plus separate `OrderItem`, `ProductPrice` and `Product`
  records through their anonymous endpoints; introspection reports all six
  entity types readable. Existing grants keep their original snapshots and
  must be reissued when their field set changes. The client-review runtime now
  joins the id-only chain instead of expecting deep Order item projections.
- The planned attributes the pages read: the agreement's client snapshot under
  the ten detail codes, and `PROVIDER_LEGAL_NAME`,
  `PROVIDER_REPRESENTATIVE_NAME` and `PROVIDER_REPRESENTATIVE_JOB_TITLE`. Order
  `PRICING_MODEL` is written by the draft creator since 2026-09-22, and
  `SERVICE_ADDRESS` by `SNOW_QUOTATION_ORDER_UTILITIES_V2` since 2026-09-23.
- Customer-scope payloads: agreement dates as ISO date strings, `ORDERS` as an
  array or a comma-separated string, and the `get.json` envelope.
- Whether event metadata reaches a hook through a link
  (`QUOTATION-PACKAGE-FLOW.md` §9).

### dev-1 and the CMS on 2026-09-15

With reproduction steps in `QUOTATION-FLOW-IMPLEMENTATION-GAPS.md`, "dev-1 on
2026-09-15":

- `GET_QUOTE_` was rewritten on 2026-09-14 back to the single-address contract.
  Its schema answers `401` anonymously and `500` with a bearer, and
  `/pages/SNOWLIMITLESS/request-quote` answers `404`. No submission can create
  an account until it is restored.
- The CMS holds older packages than the repository: the form document predates
  the address list and coordinates, the portal fixture predates the Google map,
  and `CLIENT_REVIEW_DOCUMENT` was never uploaded.
- No Core document is readable in any organization. The backend's answer that
  day covers only the core-ui admin screens, which send the `permissions` of a
  Document, Project or Task as nested objects the server refuses; that fix
  belongs to core-ui.
- `SERVICE_AGREEMENT` (document type 17) and `SERVICE_AGREEMENT_LIFECYCLE`
  (workflow 53) exist; the role grants of its seed were not applied at that
  checkpoint. They were reconciled on 2026-09-22 as recorded below.
- Twelve Orders, all in `INITIAL`; account 692 is the only one with a user and
  owns nothing.

### dev-1 on 2026-09-16

With reproduction steps in `QUOTATION-FLOW-IMPLEMENTATION-GAPS.md`, "dev-1 on
2026-09-16":

- `GET_QUOTE_` answers `200` without a token again, from both CMS nodes
  (`app-1-core-cms`, `app-3-core-cms`). The backend traced the `401` to option
  loading reading an NLS field that `Address` does not have; the lookup is now
  skipped, so an Address attribute always arrives with empty options.
- The contract is still the single-address one of 2026-09-14.
  `PROPERTY_ADDRESS` is of class `com.pixelnation.common.domain.Address`,
  required, with no `inputFormat` and no options; `PROPERTY_ADDRESSES`,
  `ORGANIZATION_NAME` and the `PROPERTIES` group are absent.
- `portal-form.js` rendered that field as a required select with no options, so
  the form could not be submitted. Since `c778c2e` an Address-class attribute
  without options renders the address control and submits the typed text;
  whether Core accepts text there is question 6 in
  `QUOTATION-FLOW-IMPLEMENTATION-GAPS.md`.
- `/pages/SNOWLIMITLESS/request-quote` answers `200` again later that day. It
  serves the deployed form document, which predates the Address-class fix, so
  its address field is a select with nothing in it and the form cannot be
  completed until the renderer is uploaded.
- A ServiceWand API key is not a bearer. Exchange it for an access token at the
  issuer, `grant_type=api_key` with an `X-API-Key` header; the token lives 15
  minutes.
- Script 169 is unchanged since 2026-09-04 and still reads addresses only from
  `PROPERTY_ADDRESSES`, so the form as served creates no account. The stored
  `GET_QUOTE_` is `optimistic` 12 of 2026-09-14 15:39 UTC, and no Core document
  is readable in `SNOWLIMITLESS`. The team said that day that the rewrite was a
  mistake and that they restore the form type themselves.
- Applied that day with the user's go: workflow 49 carries `PROCESSING_FAILED`
  with an event into it and a retry back to `PROCESSED`, both permissions exist
  and role `ADMIN` holds them; scripts 169 and 176 are at `optimistic` 22 and
  26; `WINTER_SERVICE_PROPERTY_CREATOR` is script 200 on `CORE-RM`. The
  coordinate attributes landed on `PROPERTY` (153), now `optimistic` 7, and the
  hidden `PROPERTY_COORDINATES` followed on the form once its address row was
  back, leaving `GET_QUOTE_` at `optimistic` 16.
- The flow runs end to end again, from the published page and with nobody
  watching: form 43 reached `NOTIFIED` on its own, form 42 reached `PROCESSED`
  and produced account 698. Two things were in the way, both in
  `QUOTATION-FLOW-IMPLEMENTATION-GAPS.md`. `submit.json` no longer fires the
  first transition, so `INITIAL.onEnter` now calls `submitAfterCreate` in the
  utility script. And a script that fails to compile once stays dead on the CMS
  nodes whatever is saved over it, so every change needs a new code until they
  are evicted: workflow 49 is bound to script 202, the 2026-09-04 content plus
  that method.

### Live read path

`runtime/src/adapters/core-snow-adapter.js` reads a customer's properties and
quotes from Core and was proven against `dev-1` on account 62. Properties have
no server-side account filter and are walked and filtered in the browser,
reported as `scopeMode: "browser-filtered"`, which remains a backend debt.
Service geography is deployment configuration: `data-portal-service-geography`
carries `{ map: { center, zoom }, zones }` as JSON and fails closed on anything
malformed. A live pin comes from `COORD_LAT` and `COORD_LNG`, which Core type
`PROPERTY` does not carry yet.

Field-by-field shapes a live backend has to fill are in
`design-requests/granite-ridge-overview-home.md`,
`design-requests/granite-ridge-appointments-timeline.md` and
`design-requests/overview-weather-provider-xweather.md`.

### Seams to wire against, and traps already paid for

The adapter/normalizer split is the seam: `runtime/src/adapters/*` do IO,
`runtime/src/normalizers/*` shape, components never see a raw payload. A live
module is registered in `runtime/src/modules/index.js` and picks its adapter by
`context.config.dataMode`.

Things that already cost time here and will again:

1. **`Number(null)` is `0`.** It bit three times — a missing temperature
   rendered as `0°C`, an "all dates" filter became day zero, and a missing
   window sorted first. Guard before coercing.
2. **Appointments are pinned to `dayIndex`, not a date string.** Matching on
   `"Jan 16"` worked only while the timeline was also fixture data; against a
   live window every visit silently vanished.
3. **Module ids are global.** The spa already owns `appointments`, so the storm
   table registers as `appointmentsTimeline` and its detail lives at
   `/visits/:id` rather than `/appointments/:id`.
4. **`data-portal-enabled-modules` on the entry overrides the profile.** A new
   route whose module is missing there silently falls back to the default route
   with no error. It caught us twice.
5. **The lab server on 8765 caches ES modules.** An edit can look unapplied.
   A no-cache server on 8766 is what this session used.
6. **A control character inside an inline script stops the whole CMS document
   from parsing.** `export-client-review-manual.mjs` and its check refuse one.
7. **`background-attachment: fixed` draws a band across tall headless
   screenshots.** A browser does not show it.
8. **The Browser pane can be hidden, and its screenshots then fail.** The
   evidence of 2026-09-15 came from headless Chrome driven by scratchpad
   scripts, with Google Maps and Xweather stubbed inside the page.
9. **A `JavaScript` workflow's hook reaches its script as `this.workflowUtils`.**
   A `Java` workflow such as 49 writes `workflowUtils`; the same line in a
   JavaScript hook is a `ReferenceError`, and a `try/catch` around it hid that
   from 2026-09-17 to 2026-09-21. A hook cannot refuse its transition either.
10. **Never switch an existing workflow's `scriptLanguage`.** Workflow 53 set to
    `Java` read back `valid: false` and then answered every event with HTTP 200
    without moving anything.
11. **`NOTIFIED` → `PROCESSED` is manual on purpose.** It is the manager taking
    the request into work, and it is what sends the requester the email with
    the Account link; every entity is created earlier, on entering `NOTIFIED`.
    A request sitting in `NOTIFIED` is waiting for a person, not stuck, and no
    hook should send that event. `npm run winter-quotation-flow-check` in
    `core-ui` guards the split.
12. **A CMS node can keep serving an old template.** The CMS nodes do not
    invalidate each other's page cache after a template save: the node that
    took the save serves the new page, and the other node may keep the old one,
    although its API already returns the new template. On 2026-09-23 this hit
    both `app-3-core-cms` and `app-1-core-cms`. A browser's navigations can stay
    pinned to the stale node. After every upload, fetch the page several times
    and compare the `x-node-id` header with the body; if one node is stale, send
    one identical save steered to it (read, and when a read lands on the other
    node, save next). The backend is asked to fix the invalidation.
13. **After a client's anonymous event, a dispatched script must not send
    workflow events as that client.** Core does not apply them there: processor
    V3's `DRAFT` and activation V1's `PROSPECT-ACTIVE` both failed on 2026-09-23.
    Events that follow a client's action are sent from the workflow utility's
    own hook context (utility V7 and later send `CLIENT_DETAILS_RECEIVED-DRAFT`)
    or as a service identity: the system user holding an in-memory role, as
    activation V2 and provisioning V2 do.
14. **A workflow utility must be shaped like one.** A Java workflow whose bound
    script is category API, lacks `CORE`, or sits outside
    `com.pixelnation.<service>.generated` fails its hooks with "Execution
    error". This broke every REST order-line save until workflow 46 was
    rebound on 2026-09-23. The organization workflow's script 166 has the
    same shape: SNOWLIMITLESS attribute values saved only under its parent's
    header, `SERVICE_WAND_WINTER_SERVICES_CANADA`, and under SYSTEM they
    answered "Execution error".
15. **`snowTypes.json` is behind dev-1 for the snow Account types.** It
    declares types 5 and 6 without the six prefill attributes, and with a
    `CUSTOMER_STATUS` that dev-1 lacks. A `snow-types` re-apply would drop the
    prefill attributes: re-apply `snowResidentialCustomerPrefillPatch.json` and
    `snowCommercialCustomerPrefillPatch.json` after it, or align the seed first.

The fixture root is no longer parameter-free: it may declare codes on the
`DEPLOYMENT_PARAMETERS` allow-list in `scripts/export-fixture-portal-manual.mjs`,
each must be referenced and every reference declared, and a `${` that is not a
well-formed marker is still refused.

## Universal form document

`runtime/forms/portal-form.js` renders any published Core form type in the
portal design language. Contract, read from dev-1 and snapshotted under
`content/form-types/`:

```text
GET  {apiBase}/{locale}/core-cms/api/form-type/{CODE}/get.json
POST {apiBase}/core-cms/api/form/submit.json
```

The locale is a path segment: `?locale=en` answers 302 and moves it into the
path. Both requests are anonymous. `uiBehavior` is honoured only as a
declarative `applyBehavior` value-to-step mapping; the shared
`js/dynamic-form.js` reference client executes server JavaScript through
`new Function`, and this renderer never does.

Its field kinds, the repeating address list with hidden coordinates, the
combobox behaviour and the success screen parameters are described in
`README.md`, "Universal Form Document".

## Open threads for the next session

1. ~~The portal's primary button points at a guess.~~ **Resolved 2026-08-31.**
   The guessed `https://dev-1.servicewand.com/snow-removal--request-quote`
   answers 404. `PORTAL_FORM_DOCUMENT` is published at PageContext 17,
   `https://dev-1.servicewand.com/pages/SNOWLIMITLESS/request-quote`, which
   answers 200 and mounts the renderer. The default now points there; the CMS
   parameter still overrides it.
2. ~~Resolve the `PORTAL_FORM_DOCUMENT` id.~~ **Resolved 2026-08-31.** The
   deployed BlockTemplate is `0d62e1e1-d1af-4ae8-ab5f-9c0d12f0ab04`. A separate
   `REQUEST_QUOTE` template, `5a6c7eb6-c7bb-4b8a-b532-17322a8918c5`, also exists.
   Whether to take the id over with `--expected-root-id` or to change the
   template code is still undecided; do not overwrite it blindly. Confirmed on
   2026-09-16: the published page renders `PORTAL_FORM_DOCUMENT`, and
   `REQUEST_QUOTE` is a 3.6 KB template of something else.
   **A live upload clears the deployment values CMS holds.** The package ships
   `FORM_API_BASE_URL`, `FORM_TYPE_CODE`, `FORM_ORGANIZATION_ID` and
   `FORM_MAPS_API_KEY` empty by design, the uploader sends the whole parameter
   array, and the server takes it as authority, so the page renders nothing
   until an operator refills them. Read them before an upload; on 2026-09-16
   they were `https://dev-1.servicewand.com`, `GET_QUOTE_`, `43` and `#`.
3. ~~The numeric organization id for `SNOWLIMITLESS` is unknown.~~
   **Resolved 2026-08-31.** It is **43**, and the deployed document already
   carries `data-form-organization-id="43"`. The submit button is enabled and
   the anonymous quote path works end to end. `FORM_MAPS_API_KEY` is still the
   placeholder `#`, so the address control renders without geocoding. The path
   is broken again since 2026-09-14; see "dev-1 and the CMS on 2026-09-15".
4. `GET_QUOTE_` on dev-1 regressed on 2026-09-14 to the single-address
   contract. The repository keeps the multi-address contract as published on
   2026-09-10 in `content/form-types/GET_QUOTE_.en.json`. Still open whenever
   it returns: group names and the form title are English only while fields
   and options carry eight locales, and the first group name reads "so we can
   can confirm".
5. **Xweather questions still open with the vendor**: whether MapsGL runs on a
   free developer key; whether `/roadweather` covers private lots and
   residential streets in the Front Range, since that endpoint — not the general
   forecast — is what a dispatch trigger should read; whether
   `/roadweather/analytics` is inside the standard subscription; and the cache
   and redistribution terms for tiles. Per-product access cost is answered: map
   responses report it in `x-cost-tokens`, and it is tiles × layers.
6. **Weather belongs in Core, not the browser, once there is a backend.** A
   seven-day forecast per zone is identical for every customer in that zone, so
   one cached read serves all of them; the dispatch trigger is server-side
   anyway; and evidence for billing must be stored at the time of the event, not
   re-fetched. The browser path shipped here is stage one and the payload shape
   does not change on the way to Core.
7. One gap against `js/dynamic-form.js` is worth closing: preset values are
   supported by the renderer but not exposed as a CMS parameter. The success
   screen gained an optional start-over button on 2026-09-15.
8. Smaller, recorded in the design requests: the top nav in the reference mockup
   carries different items and a different primary label; both detail pages read
   the fixture directly and answer an unknown id with an empty state rather than
   a 404; and the button label ships as `Request a quote` where the brief said
   "request form".

Checks that need `playwright` fail on a machine without it:
`config-behavior-check`, `care-runtime-check`, `route-smoke`,
`s6-cms-export-check`, `s7-regression-check`, `s7-route-state-check`,
`seo-public-check`, `activation-contract-check`,
`calm-harbor-customer-portal-manual-check` and the `calm-harbor-wave15`–`17`
runtime and source checks. On 2026-09-15 each failed the same way on a clean
checkout of HEAD: an environment gap, not a regression. Verify against a clean
checkout before treating any of them as broken.

## Open backend/product work

- Organization-specific SSO/login ownership and routing, instead of every
  organization appearing to sign in through generic ServiceWand presentation.
- Server-derived customer-scoped portal endpoints. The server must derive User,
  customer Account, and organization from the session rather than accept them
  as browser authority. Deferred on 2026-09-16: the first dev version of the
  snow portal reads the generic endpoints and scopes in the browser, as the spa
  staging demo already does. Production still requires these endpoints. Required projections/commands cover Account/Profile,
  Orders/OrderItems/Fulfillment, Appointments/Tasks/Projects/availability,
  Cart/checkout, plans/Subscriptions/ledger, and per-resource allowed actions.
- Booking availability holds, version/conflict behavior, idempotent commands,
  and authoritative readback.
- Plan/profile command wave, then full staging activation/closeout.
- Product/gallery media integration remains unfinished. Generated images exist
  outside the repository and were deliberately postponed; do not assume they
  are approved or shipped.

## Exact next action

The public quote page renders the multi-address form and the workflow runs by
itself through `NOTIFIED` to `READY_FOR_REVIEW`. Since 2026-09-22 entering
`NOTIFIED` creates the Account and a property per address; only the manager's
manual `READY_FOR_REVIEW-PROCESSED` event issues the Account link and sends the
requester's email. Form 60 proved the final path with Account 711 and Property
960. `WINTER_SERVICE_REGION_WORKFLOW_UTILS_V16` (script 237) exposes retryable
`VALIDATION_FAILED`, `PROCESSING_FAILED` and `DELIVERY_FAILED` states, while
`WINTER_SERVICE_QUOTATION_CREATOR_V6` (script 233) revokes a just-issued grant
when the following email step fails. `npm run winter-quotation-flow-check` in
`core-ui` guards that split. V16 also dispatches
`WINTER_SERVICE_QUOTATION_DRAFT_CREATOR_V1` (script 236): form 62 created
Account 713, Property 962 and Orders 53–55 for `PER_SERVICE`, `MONTHLY` and
`SEASONAL`; a repeat returned the same IDs and created zero records. The drafts
start unpriced because the form intentionally has no property size. Workflow 45
is now bound to SYSTEM-owned `SNOW_QUOTATION_ORDER_UTILITIES_V1` (script 238):
approved-internally Orders join a quotation agreement, a client approval
declines the sibling pricing options for the same property, terminal decisions
evaluate the package, and a requested-change event requires `MESSAGE` and
notifies the configured `QUOTATION_MANAGER`. Orders 53–55 and agreement 134
proved the live path: approving Order 53 declined 54 and 55 and moved the
agreement to `AWAITING_CLIENT_DETAILS`; Order 36 proved the requested-change
transition. Where the whole flow stands is
`QUOTATION-PACKAGE-FLOW.md` §10. In order:

1. **The backend:** evict the compiled script cache on the CMS nodes so script
   169 can run again, say whether `form/submit.json` is meant to fire the first
   transition, fix the core-ui `permissions` mapping, and answer
   `CUSTOMER-SCOPE-GENERIC-API.md` §5. Core documents became readable on
   2026-09-16.
2. **When dev-1 is back, each write with the user's go:** re-read `GET_QUOTE_`;
   upload `PORTAL_FORM_DOCUMENT` and set its success copy; upload
   `CUSTOMER_PORTAL_GRANITE_RIDGE_FIXTURE` with a restricted Google browser key.
   The `CLIENT_REVIEW_DOCUMENT` part was completed on 2026-09-22: the generated
   JavaScript and CSS were uploaded to the existing SYSTEM-owned template
   `7f4ded3f-083d-4a71-a2e6-ac168f4e093b`, while its SNOWLIMITLESS PageContext
   and `REVIEW_API_BASE_URL` were preserved. All four live template hashes now
   match the repository. Fresh grant 50 over test agreement 133 and the other
   18 records rendered the three quote cards, their six line items and their
   server totals in the browser. Existing links still retain their older
   mapping snapshots and cannot verify the new contract. On 2026-09-23 the
   version with the checking state, returned details, portal invitation
   (`PORTAL_URL` left empty) and numbered terms was uploaded to the same
   template the same way; the four hashes match and PageContext 21 is
   unchanged. `app-3-core-cms` still served the previous one (trap 12), and the
   backend is asked to evict it. The next version, which follows the last
   decision on its own and words a return on a reopened link, is not uploaded
   yet.
3. **In `core-ui`.** Applied on 2026-09-16: workflow 49 with its failure state,
   its retry and the `script` binding; a property per address; quote orders per
   property restructured but still not called; `COORD_LAT` and `COORD_LNG` on
   `PROPERTY`, which the property creator writes when the form supplies them;
   `MAPPINGS_ORDER` and `MAPPINGS_DOCUMENT`, scripts 203 and 204, the field
   caps a magic link reads through; `CONTRACT_TERMS` and the three provider
   fields on document type 17, which the review page reads. Applied on
   2026-09-21: `WINTER_SERVICE_QUOTATION_CREATOR_V3` (script 224) narrows the
   Account grant to `id`, `code`, `nls`, `attributes` and `type`, and creates
   the Account inside `getInNewTxRW`; workflow 49 is bound to the clean
   `WINTER_SERVICE_REGION_WORKFLOW_UTILS_V9` (script 225). A direct run created
   Account 705 and its grant returned `200` from both introspection and
   anonymous Account list. The workflow path then created Account 706; Property
   956 was created by `WINTER_SERVICE_PROPERTY_CREATOR_V3`, and the retry held
   the form in `PROCESSED`. Later the same day creation moved to `NOTIFIED`
   and the requester's email with its link to `PROCESSED`. Superseded on
   2026-09-22 by V16/V6: successful creation enters `READY_FOR_REVIEW`, manager
   actions are unavailable before that state, and validation, creation and
   delivery failures have separate retryable states. Forms 59 and 60 verified
   the new flow and did not duplicate their Account or Property on retry. Form
   62 additionally created one unpriced draft per property and pricing model,
   with `SERVICE_PROPERTY`, `QUOTE_REQUEST_FORM_ID` and `PRICING_MODEL`; its
   idempotency rerun created nothing. Applied on 2026-09-22: workflow 45 and
   its Order hooks are versioned in seeds and live on dev-1. Workflow 53 now
   has the transient `CLIENT_DETAILS_RECEIVED` state and dispatches its
   cross-service work through `SNOW_SERVICE_AGREEMENT_WORKFLOW_UTILITIES_V5`
   (script 255). Client details still run through
   `SNOW_SERVICE_AGREEMENT_PROCESSOR_V2` (script 250); agreement delivery runs
   through `SNOW_SERVICE_AGREEMENT_DELIVERY_V1` (script 252) and email template
   253. Agreement 133 proved the automatic details path through `DRAFT`, then
   management approval through `SENT_TO_CLIENT`; grant 51 was issued and its ID
   persisted without the token. The authenticated approval check then ran
   `SNOW_SERVICE_AGREEMENT_ACTIVATION_V1` (script 254), revoked the agreement
   grant, cleared its ID and moved Account 694 through `DRAFT`, `PROSPECT` and
   `ACTIVE`. The workflow deployer now writes role permissions as identifier
   links and reconciles the workflow's permission set exactly. A live readback
   on 2026-09-22 found all 33 events on `SW_FS_WS_COMPANY_ADMIN`, 6 on
   `SW_FS_WS_SALES`, 2 on `SW_FS_WS_OPERATIONS_MANAGER` and 4 on
   `SW_FS_WS_BILLING_FINANCE`, with no missing or extra workflow permissions.
   The final anonymous approval was then verified in the live browser with a
   fresh writable link: agreement 134 reached `CLIENT_APPROVED`, the page
   rendered `Agreement approved`, grant 54 was revoked, its stored ID was
   cleared and Account 694 remained `ACTIVE`. A post-action introspection of
   the same token returned `401`. The staging-only customer role
   `SW_FS_WS_CUSTOMER_PORTAL` (75 on dev-1) now exists with the minimal
   `overview` and `properties` permissions. Provisioning is live through
   `SNOW_PORTAL_USER_PROVISION_V1` (258): Account 714 created User 43 with the
   role and Account link; an approval retry on agreement 134 restored the
   intentionally removed role on User 35. The retry fix in activation script
   254 treats a cleared agreement grant as absent. On 2026-09-22 the existing
   admin reset sent a test password to a reachable mailbox, and Core OIDC
   accepted User 43; Calm Harbor correctly refused its SNOWLIMITLESS session.
   Script 258 now calls Core's password generation and email path after a new
   User commits. ACTIVE smoke Account 715 created User 49 with
   `credentialsIssued: true`; rerun returned `credentialsIssued: false`.
   ACTIVE smoke Account 716 created User 50 the same way using a reachable
   mailbox; the user confirmed receipt of the automatically generated password
   email. The operator plan now resolves a User by login because email is not
   unique. Applied on 2026-09-23: `SERVICE_ADDRESS` on type 5,
   `SNOW_SERVICE_PROPERTY_ADDRESS_V1` (259) and
   `SNOW_QUOTATION_ORDER_UTILITIES_V2` (260), and workflow 45 bound to V2 with
   state 221 re-saved; Orders 41 and 42 were backfilled on both core-bill
   nodes. Left: fix quotation delivery and the details processor (item 5),
   publish and test the live snow portal, and build the three client forms.
4. **Backend read contract and live page verified:** a freshly issued combined
   link reads the exact `Document`, `Account`, `Order`, `OrderItem`,
   `ProductPrice` and `Product` records anonymously. It returns Order totals and
   Order/Document `states[].code`; introspection reports every type readable.
   The client-review runtime joins the id-only line chain and keeps all totals
   server-owned. On 2026-09-22 `core-bill` again accepted the API key; grant 50
   contained 19 exact records and all six anonymous list endpoints returned
   `200`. The live browser pass displayed CA$2,444.72, CA$6,687.90 and
   CA$26,751.60 with their service lines. A second live browser pass on
   2026-09-22 used combined grant 57 over agreement 135 and Orders 39–40:
   Order 39 was approved, Order 40 rejected an empty change request and then
   accepted one carrying `MESSAGE`, and the page updated to one approved option
   and one changes-requested option. The test grant was then revoked, its ID
   cleared and its token returned `401`. Automatic quotation delivery is now
   wired through `SNOW_SERVICE_QUOTATION_DELIVERY_V1` (script 256) and
   `WINTER_SERVICE_QUOTATION_READY` (template 257). On 2026-09-22 a single
   transition of agreement 136 to `QUOTATION_SENT` moved Orders 41–42 to
   `QUOTE_SENT`, issued combined grant 58, persisted only its ID and completed
   the email call. Agreement 137 proved compensation: its incomplete Order 50
   moved the agreement to `QUOTATION_SEND_FAILED` without a grant ID while the
   Order and Account remained in their pre-delivery states. Question 10 records
   the backend verification. A third live browser pass on 2026-09-23 used
   hand-issued grant 59 over agreement 136:
   - Orders 41 and 42 were approved on the page.
   - A details event without phone and authority came back with both fields
     marked.
   - The details sent from the page passed the checking state into `DRAFT`.
   - The grant was then revoked.
   - Through the link the Account returns contacts and addresses as ids only.
     Since the end of that day the details form pre-fills from Account
     attributes instead (trap 15, `QUOTATION-PACKAGE-FLOW.md` §9).
5. **Then:** finish the agreement side of
   `QUOTATION-PACKAGE-FLOW.md` §5. The details, delivery and Account activation
   hooks are complete. Workflow 53 validates in
   `CLIENT_DETAILS_RECEIVED`, persists Party B, removes unapproved Orders,
   notifies `CONTRACT_MANAGER` and reaches `DRAFT`; internal approval then
   advances automatically, issues a 30-day six-type agreement grant and queues
   the client email. Delivery failures revoke a just-issued grant and enter
   `AGREEMENT_SEND_FAILED`. Approval revokes that grant, clears its ID and
   activates Accounts from `DRAFT`, `PROSPECT` or `INACTIVE`; failures enter
   retryable `ACTIVATION_FAILED`. `npm run service-agreement-client-details-check`
   and `npm run service-agreement-delivery-check` guard the flow. Quotation
   delivery is also automatic and compensated now. The bulk Send Quotation
   action is owned outside this stream. Portal User provisioning now runs after
   Account activation through script 258 and assigns `SW_FS_WS_CUSTOMER_PORTAL`
   (75 on dev-1); new-User and retry paths were checked on Accounts 714 and
   694. The portal flag remains intentionally deferred.

   On 2026-09-23 the first end-to-end run took a public request to a client
   signed in to the live portal. The steps, the defects it found and their
   fixes are in `QUOTATION-PACKAGE-FLOW.md` §10, "The first end-to-end run".
   Live after it:
   - quotation delivery V2 (263), which grants the details event;
   - details processor V4 (267);
   - activation V2 (269) and provisioning V2 (270), which act as a service
     identity;
   - workflow utility V8 (268);
   - draft pricer V2 (265);
   - the published portal on PageContext 22.

   Trap 13 is the lesson. A second run the same day (form 64, agreement 139)
   proved that an anonymous approval activates the Account and provisions the
   User without an operator.

   Also on 2026-09-23:
   - order lines save through REST again (trap 14);
   - agreements take the provider party and the terms from their organization,
     with test values on SNOWLIMITLESS;
   - each client link carries the representative and billing details as
     Account attributes, from which the review page pre-fills (trap 15).

   Workflow 53 runs utility V10 (292). Workflow 45 runs order utilities V3
   (296): a draft entering `QUOTE_PREPARED` is priced from its property's
   `SERVICE_AREA_SQFT`, which the manager fills. The founder's pricing model
   (per-visit prices by area; monthly and seasonal derived from them) waits
   for its per-visit price table (`QUOTATION-PACKAGE-FLOW.md` §10). Next here
   are the three client forms.

   The role remains staging-only until customer Account scoping is enforced by
   the backend.

The live snow entry is the package `CUSTOMER_PORTAL_GRANITE_RIDGE_STAGING`
(`scripts/export-live-portal-manual.mjs` from
`cms/granite-ridge-snow.customer-portal-staging.json`, guarded by
`granite-ridge-staging-portal-manual-check.mjs`, uploaded by
`upsert-granite-ridge-staging-portal.mjs`).

- **Published** on dev-1 on 2026-09-23 as BlockTemplate
  `3e57675e-c967-47b2-9501-9235830f3bc3` on PageContext 22,
  `/pages/SNOWLIMITLESS/portal`.
- **Settings:** live data, Core OIDC sign-in, SNOWLIMITLESS, brand "Limitless
  Snow Removal" (the user's choice), British Columbia service geography.
- **Modules:** overview, properties, proposals and profile.
- **Account types:** `SNOW_RESIDENTIAL_CUSTOMER,SNOW_COMMERCIAL_CUSTOMER,CUSTOMER`;
  the snow creator assigns the first two.
- **Operator keys:** the Xweather pair and the Maps key and map id ship as the
  placeholder `#`, which the runtime reads as unset. Real keys belong in
  PageContext 22's values, because every upload writes `#` back into the
  template.
- **Portal link:** the review page's `PORTAL_URL` points at the portal.

The fixture package must stay as it is: `granite-ridge-portal-manual-check`
refuses a service base, an auth contract or live data mode in it, and that
guard is correct.

Still open after that: whether an address the browser geocodes should be written
back to `COORD_LAT`/`COORD_LNG` by the CRM rather than geocoded again in every
browser, and whether weather moves behind Core, using the shape in
`design-requests/overview-weather-provider-xweather.md`.

Resume prompt for a new session:

```text
Read app-templates/customer-portal/HANDOFF.md and AGENTS.md, verify the recorded
git checkpoint against the current tree, then take the "Exact next action" in
order and ask the user before any dev-1 or CMS write. Preserve design-inbox and
all unrelated dirty changes. Never print or persist credentials.
```
