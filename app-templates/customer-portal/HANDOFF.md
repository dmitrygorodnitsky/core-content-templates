# Calm Harbor Customer Portal — cross-session handoff

Updated: 2026-08-05

This is the canonical resume checkpoint for the Calm Harbor customer portal,
its public landing, and the Core Auth CMS login skin. Read this file and
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
- HEAD when this checkpoint was written: `249b15c122392b4eaa5219c5e39568dba7fcafaf`
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

Current local build and transfer checks:

```bash
node app-templates/customer-portal/scripts/build-customer-experience.mjs
node app-templates/customer-portal/scripts/customer-experience-login-check.mjs
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

Wave 19 accepted the CMS-skinned `/auth/2fa.html`. The compiler now emits
`CUSTOMER_EXPERIENCE_AUTH_2FA` from that immutable source, with 24 safe CMS
parameters and eight byte-preserved Core Auth runtime placeholders. The
generated template is self-contained, script-free, and shares the trusted
Core Auth PageContext selector gate with login.

The `customer-experience-configurator` skill is installed under
`~/.codex/skills/`. It runs the Q&A wizard, produces a descriptor plus creation
report, and keeps unresolved deployment/evidence gates fail-closed.

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
node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \
  --out app-templates/customer-portal/dist/manual-upload/customer-portal-calm-harbor-staging \
  --base-url https://dev-1.servicewand.com/core \
  --org SYSTEM \
  --live
```

Public landing upload uses the same uploader with:

```text
--out app-templates/customer-portal/dist/manual-upload/customer-portal-calm-harbor-landing-staging
```

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

## Exact next action

Before opening new product work, verify the new login template end-to-end:

1. confirm the anonymous PageContext used by Core Auth resolves to template id
   `17c450d7-963e-4837-891a-15d01fb35c80` and is `excludeFromSeo`;
2. fetch the CMS login URL anonymously and confirm the six Core Auth
   placeholders remain unsubstituted there;
3. exercise portal redirect → Core Auth login → portal return, plus logout and
   failed-login states, without exposing credentials in logs;
4. if successful, ask the user for commit scope, because the worktree contains
   both this login work and unrelated/user-owned dirty changes.

Resume prompt for a new task:

```text
Read app-templates/customer-portal/HANDOFF.md and AGENTS.md, verify the recorded
git checkpoint against the current tree, then execute only the "Exact next
action" section. Preserve design-inbox and all unrelated dirty changes. Never
print or persist credentials.
```
