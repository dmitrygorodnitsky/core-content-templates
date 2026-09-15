# Customer Portal — cross-session handoff

Updated: 2026-08-31

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
- HEAD when this checkpoint was written: `df29104`
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
  vertical, read from `dev-1` as `SNOWLIMITLESS`, plus the settled decision that
  the Order is the contract and the rules for reading Core without breaking it.
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

Granite Ridge has one entrypoint that chains rebuild, repackage, four checks and
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
node app-templates/customer-portal/scripts/granite-ridge-portal-manual-check.mjs
node app-templates/customer-portal/scripts/granite-ridge-landing-manual-check.mjs
node app-templates/customer-portal/scripts/portal-form-check.mjs
node app-templates/customer-portal/scripts/calm-harbor-fixture-check.mjs
node app-templates/customer-portal/scripts/customer-experience-config-check.mjs
node app-templates/customer-portal/scripts/cms-schema-validation.mjs
```

## Granite Ridge snow tenant

The tenant the next session takes live. Everything on screen is fixture data
**except the weather**, which calls Xweather from the browser, and **the map**,
which is Google Maps when a browser key is configured.

| surface | source | preview | check |
| --- | --- | --- | --- |
| portal | `runtime/data/cases/granite-ridge-snow.js`, profile `stormRetail` | `runtime/granite-ridge-snow.html` | `scripts/granite-ridge-fixture-check.mjs` |
| appointments, property, visit | same fixture | same entry | `scripts/appointments-check.mjs` |
| weather | `runtime/src/adapters/xweather-adapter.js` | same entry | `scripts/live-weather-check.mjs` |
| property map | `runtime/src/components/storm/PropertyMap.js`, `runtime/src/adapters/google-maps-adapter.js` | same entry; without a key it lists the properties | `scripts/property-map-check.mjs` |
| portal package | `content/cases/granite-ridge-snow.customer-portal-fixture.json` | `dist/manual-upload/customer-portal-granite-ridge-fixture/preview.html` | `scripts/granite-ridge-portal-manual-check.mjs` |
| landing | `scripts/export-granite-ridge-landing-blocks-manual.mjs` | `dist/manual-upload/customer-portal-granite-ridge-landing/preview.html` | `scripts/granite-ridge-landing-manual-check.mjs` |

Routes in the `stormRetail` profile: `overview`, `appointments`,
`visit.detail` (`/visits/:id`), `property.detail` (`/properties/:id`),
`calendar`, `care`, `proposals.list`, `proposals.detail`, `support`,
`activity`, `profile`, `pricing`. Shop, Services, checkout and the cart are
retired — every service is ordered through the quote form, and the primary
button leaves for `PORTAL_REQUEST_FORM_URL`.

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
properties instead. None of these states has an accepted design yet:
`design-requests/granite-ridge-google-property-map.md`.

Credentials travel as `data-portal-weather-client-id` / `-secret`. They are
public by design and origin-scoped; the demo key in the repo is disposable and
its namespace should be restricted to whatever host serves the portal.

### The shape a live backend has to fill

Each screen already declares its contract, and the design requests carry the
field-by-field tables:

- `design-requests/granite-ridge-overview-home.md` — weather frames, zone
  forecast, properties, invoices with three states, contracts, support, banner.
- `design-requests/granite-ridge-appointments-timeline.md` — resource, planned
  and actual windows, appointment states, day index.
- `design-requests/overview-weather-provider-xweather.md` — what Xweather
  answers, what it costs, and what it does not answer.

None of these entities exist in Core today. The six that block everything else
are Property as a Resource type, Contract, Quote with Order Items, Invoice
workflow, Support Ticket lifecycle, and snow Appointment states.

### Seams to wire against, and traps already paid for

The adapter/normalizer split is the seam: `runtime/src/adapters/*` do IO,
`runtime/src/normalizers/*` shape, components never see a raw payload. A live
module is registered in `runtime/src/modules/index.js` and picks its adapter by
`context.config.dataMode`.

Five things that already cost time here and will again:

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
   template code is still undecided; do not overwrite it blindly.
3. ~~The numeric organization id for `SNOWLIMITLESS` is unknown.~~
   **Resolved 2026-08-31.** It is **43**, and the deployed document already
   carries `data-form-organization-id="43"`. The submit button is enabled and
   the anonymous quote path works end to end. `FORM_MAPS_API_KEY` is still the
   placeholder `#`, so the address control renders without geocoding.
4. The published `GET_QUOTE_` form type was largely fixed on the backend and the
   repository snapshot was stale; `content/form-types/GET_QUOTE_.en.json` and
   `portal-form-check.mjs` now carry the current contract. Every attribute but
   `ADDITIONAL_NOTES` declares `required: true`, `RISK_FACTORS` is `multiselect`
   and renders as a checklist, and `inputFormat` now declares `email`, `tel`,
   `address`, `textarea rows:5` and `expanded`. Still open: group names and the
   form title are English only while fields and options carry eight locales, and
   the first group name still reads "so we can can confirm".
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
7. Two gaps against `js/dynamic-form.js` worth closing: preset values are
   supported by the renderer but not exposed as a CMS parameter, and the success
   screen offers no way to submit another response.
8. Smaller, recorded in the design requests: the top nav in the reference mockup
   carries different items and a different primary label; both detail pages read
   the fixture directly and answer an unknown id with an empty state rather than
   a 404; and the button label ships as `Request a quote` where the brief said
   "request form".

`config-behavior-check`, `care-runtime-check`, `route-smoke`,
`s7-regression-check` and `s6-cms-export-check` fail on a machine without
`playwright`. That is an environment gap, not a regression; verify against a
clean checkout before treating any of them as broken.

## Open backend/product work

- Organization-specific SSO/login ownership and routing, instead of every
  organization appearing to sign in through generic ServiceWand presentation.
- Server-derived customer-scoped portal endpoints. The server must derive User,
  customer Account, and organization from the session rather than accept them
  as browser authority. Required projections/commands cover Account/Profile,
  Orders/OrderItems/Fulfillment, Appointments/Tasks/Projects/availability,
  Cart/checkout, plans/Subscriptions/ledger, and per-resource allowed actions.
- Booking availability holds, version/conflict behavior, idempotent commands,
  and authoritative readback.
- Plan/profile command wave, then full staging activation/closeout.
- Product/gallery media integration remains unfinished. Generated images exist
  outside the repository and were deliberately postponed; do not assume they
  are approved or shipped.

## Granite Ridge live read path

Steps 1 and 2 of the previous checkpoint are done. The enumeration lives in
`content/cases/SNOW-VERTICAL-CORE-MODEL.md` with 92 payload snapshots under
`content/core-types/`, reproduced by `scripts/snow-core-inventory.mjs`.

`runtime/src/adapters/core-snow-adapter.js` reads a customer's properties and
quotes from Core. It is proven against `dev-1`: account 62 resolves to two
`SNOW_REMOVAL_PROPERTY` resources with real British Columbia addresses and two
quotes correctly withheld as operator-side. Quotes are scoped by the server on
`account.id`; properties have no server-side account filter and are walked and
filtered in the browser, which the envelope reports as
`scopeMode: "browser-filtered"` and which remains a backend debt.

The `properties` module picks the live adapter in live mode. `currentOverview()`
now returns a live model built only from live facts: properties from Core,
weather from Xweather, and absent invoices, contracts, support and banner. It
refuses to render at all rather than fall back to the demonstration forecast or
the fixture book.

Service geography moved out of the case fixture. `data-portal-service-geography`
carries `{ map: { center, zoom }, zones: { name: { lat, lon } } }` as JSON and
fails closed on anything malformed, a null coordinate or zoom included; `map` is
the initial viewport before the map fits its pins, live weather reads its zone
centroids from there, and the fixture keeps its own geography for the
demonstration tenant. A live property's pin comes from `COORD_LAT` and
`COORD_LNG`, Float attributes being added to Core type `PROPERTY` (153) and
inherited by `SNOW_REMOVAL_PROPERTY`.

Checks: `core-snow-adapter-check.mjs`, `snow-live-overview-check.mjs`, and the
read-only staging probe `core-snow-live-check.mjs`.

## Exact next action

Two things block a live Granite Ridge portal, and only the first is code.

1. **Presentation.** `design-requests/granite-ridge-live-core-home-and-quotes.md`
   asks for four states that do not exist: a property with no coordinate, a
   Contracts list with no grouping proposal and no measured area, a quote the
   operator has not sent yet, and what the anonymous quote request promises.
   Until that is accepted, `proposals` stays on fixtures and is not enabled in
   live mode. The home screen already places a live property from its
   coordinates or geocoded address and lists it without a pin otherwise, pending
   `design-requests/granite-ridge-google-property-map.md`.
2. **Data.** No customer Account that owns anything is linked to a Core User.
   Account 692 is the only one with a user (29) and owns nothing; account 62
   owns property 278, property 430 and orders 18 and 19 but has no user. All
   three quote orders sit in `INITIAL`, before `QUOTE_SENT`, so nothing is
   customer-visible yet. Linking a user and advancing one order are writes and
   belong to the user or to the CRM, not to this repository.

Then, and only then: the live snow entry needs `data-portal-data-mode="live"`,
`data-portal-auth-mode="required"`, `data-portal-organization="SNOWLIMITLESS"`,
`data-portal-account-type-code="CUSTOMER"`, service geography for the British
Columbia service area, and an enabled-module list restricted to what has both
data and design. The fixture package must stay as it is —
`granite-ridge-portal-manual-check` refuses a service base, an auth contract or
live data mode in it, and that guard is correct.

Still open after that: whether an address the browser geocodes should be written
back to `COORD_LAT`/`COORD_LNG` by the CRM rather than geocoded again in every
browser; and whether weather moves behind Core, using the shape in
`design-requests/overview-weather-provider-xweather.md`.

Resume prompt for a new session:

```text
Read app-templates/customer-portal/HANDOFF.md and AGENTS.md, verify the recorded
git checkpoint against the current tree, then execute only the "Exact next
action" section. Preserve design-inbox and all unrelated dirty changes. Never
print or persist credentials.
```
