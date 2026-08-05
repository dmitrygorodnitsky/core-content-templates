# Customer Experience Parameter Contract

Status: the schema, registry, Calm Harbor descriptor, report-only validator,
local compiler, configuration wizard, and dormant anonymous-intent runtime
primitive are implemented. No CMS upload, PageContext/consumer switch, or
anonymous-flow UI activation is authorized by this document.

Report-only implementation:

- `experience/config/customer-experience.schema.json` — descriptor shape;
- `experience/config/customer-experience.parameters.json` — generic template codes,
  profiles, routes, and parameter registry;
- `experience/descriptors/calm-harbor-spa.staging.json` — current
  staging descriptor with unresolved deployment URLs recorded explicitly;
- `scripts/customer-experience-config-report.mjs` — read-only compiler/report;
- `scripts/customer-experience-config-check.mjs` — positive and adversarial
  contract checks.

Run the report without writing an output file:

```bash
node app-templates/customer-portal/scripts/customer-experience-config-report.mjs
```

Add `--require-resolved` when a publishability gate is intended. It currently
fails closed until landing/portal PageContext URLs and the trusted Core Auth
PageContext selector are proven.

## Objective

Define one reusable customer-experience template source that can produce a
public landing, an authenticated portal, a Core Auth login skin, and its
two-factor step for
different verticals without tenant names, navigation destinations, enabled
features, or deployment selectors being baked into HTML.

The success metric is not the number of CMS parameters. The contract passes
when:

1. one validated experience descriptor generates all four surfaces;
2. shared brand, theme, and cross-surface destinations cannot drift between
   those surfaces;
3. a second vertical can be generated without editing template HTML, CSS, or
   JavaScript;
4. Calm Harbor keeps its accepted presentation and current truthful behavior;
5. invalid feature combinations, unsafe destinations, and private/runtime
   values fail generation rather than reaching CMS.

## Baseline findings

The original three surfaces did not share a parameter contract, and the Core
Auth 2FA surface now joins them through the same descriptor:

- the active Calm Harbor portal root has zero CMS parameters; its vertical,
  theme, features, routes, organization, API bases, PIM selectors, and auth
  settings are emitted as literal `data-portal-*` attributes;
- the landing has CMS-authored section copy, but its template code, tenant
  names, `Sign in` control, section actions, and several CTA transitions are
  hardcoded by the Calm Harbor exporter;
- the login has 20 parameters, but it is a tenant-specific template and its
  current Calm Harbor default palette is `hvac`, not `beauty`;
- portal profiles, navigation labels, module lists, the Calm Harbor brand, and
  OIDC post-action hashes are also hardcoded in runtime JavaScript;
- the family uploader does not manage PageContext, parent links, or consumer
  routing, so template reuse alone cannot keep four independent PageContexts
  synchronized.

The existing baseline has important reasons to survive: route IDs are used by
guards and commands, capability modes express real backend boundaries, and the
accepted design only permits known theme/layout variants. Parameterization must
not turn those contracts into arbitrary CMS-authored behavior.

## Decision

Use one repository-owned **Experience Descriptor** as the source of truth and
compile it into four reusable CMS template roots:

```text
customer-experience descriptor
  -> CUSTOMER_EXPERIENCE_LANDING (+ approved child templates)
  -> CUSTOMER_EXPERIENCE_PORTAL
  -> CUSTOMER_EXPERIENCE_LOGIN
  -> CUSTOMER_EXPERIENCE_AUTH_2FA
  -> PageContext value maps for each consumer
```

These are one product template family, not necessarily one CMS parent/child
tree. The login is consumed by Core Auth, the landing is a public document, and
the portal is an authenticated application; forcing them under one CMS root
would couple unrelated rendering lifecycles.

CMS does not currently provide a proven shared-parameter inheritance mechanism
across these consumers. Shared parameter codes are therefore repeated only in
the templates that consume them, while their values are generated from one
descriptor and checked for equality. Operators should edit the descriptor (or
a future validated editor), not independently hand-edit four copies.

Until Core Auth is proven to select a tenant-specific PageContext by
organization or host, the login may need separate deployment instances per
tenant. That is compatible with one reusable source template; it is not yet
evidence that one live login PageContext can brand multiple tenants correctly.

## Configuration layers

Keep four layers separate.

### 1. Shared customer experience

Safe, public, cross-surface identity and navigation values. These use the same
codes everywhere they are consumed.

| code | CMS type | required | purpose |
| --- | --- | --- | --- |
| `CX_CONTRACT_VERSION` | `STRING` | yes | Reject incompatible descriptor/template combinations. |
| `CX_EXPERIENCE_ID` | `STRING` | yes | Stable non-secret deployment identity, for example `calm-harbor-spa-staging`. |
| `CX_VERTICAL` | `STRING` with options | yes | Vertical behavior/content family: `hvac`, `snow`, `lawn`, `pool`, `roofing`, `pest`, `health`, or `beauty`. |
| `CX_THEME` | `STRING` with options | yes | Accepted visual theme token set. Initially the same eight values as `CX_VERTICAL`, but intentionally independent. |
| `CX_DEFAULT_MODE` | `STRING` with options | yes | `light` or `dark`; initial default only. |
| `CX_LANGUAGE` | `STRING` | yes for Core Auth | BCP-47 language inherited by the login and 2FA roots. |
| `CX_DIRECTION` | `STRING` with options | yes for Core Auth | `ltr` or `rtl`; shared by login and 2FA. |
| `CX_BRAND_NAME` | `LOCALIZED_STRING_SS` | yes | Visible brand name shared by landing, portal, login, and 2FA. |
| `CX_LANDING_URL` | `STRING` | yes | Canonical public landing entry. |
| `CX_PORTAL_URL` | `STRING` | yes | Authenticated portal document entry, without a tenant-editable internal route. |
| `CX_SUPPORT_URL` | `STRING` | no | Approved support destination. Empty means unavailable; it never invents support. |
| `CX_ALLOWED_NAV_ORIGINS` | `STRING` | yes | Comma-separated allowlist used to validate generated cross-document destinations. |

`CX_BRAND_LOGO`, arbitrary accent colors, and arbitrary font URLs are not phase-1
parameters. The accepted design currently contains a CSS brand mark and eight
tested theme packs. A custom logo or free-form palette needs an accepted visual
state, contrast checks, and asset constraints before it can become configurable.

### 2. Surface presentation and copy

Localized, presentation-only parameters belong to their surface:

- `LANDING_*` owns metadata, visible public copy, approved media references,
  CTA labels, FAQ, footer, and section data;
- `PORTAL_*_LABEL` and `PORTAL_*_COPY` own shell/navigation copy and later the
  accepted state-copy dictionary;
- `LOGIN_*` owns the current login title, field labels, error/logout copy,
  and login-specific pitch copy;
- `TWO_FACTOR_*` owns 2FA title, setup/verification guidance, field/error copy,
  submit label, and 2FA-specific pitch copy. Brand and pitch eyebrow are shared
  with login; CSRF, QR, setup secret, display state, and form action remain
  Core Auth runtime placeholders and never become CMS parameters;
  anti-phishing note, and explanatory pitch.

Existing landing section parameters should be retained but renamed/grown under
the `LANDING_*` namespace when compatibility permits. Login's unprefixed
`TITLE`, `CARD_TITLE`, and similar codes should migrate to `LOGIN_*` aliases so
generic shared codes cannot collide with surface copy.

Large repeatable content remains in child templates or CMS collections. Do not
turn a full landing, catalog, customer record, or feature graph into one opaque
JSON string merely to reduce the parameter count.

### 3. Portal capability and deployment configuration

These values select only runtime behavior that the code already supports.

| code | allowed values / shape | notes |
| --- | --- | --- |
| `PORTAL_PROFILE` | validated profile code | Chooses an accepted information architecture; profile names should become vertical-neutral. |
| `PORTAL_CAPABILITY` | validated capability bundle | Selects a code-owned behavior contract, not arbitrary DOM. |
| `PORTAL_ENABLED_MODULES` | validated comma-separated route modules | Advanced generated value. It must be checked against the profile and capability dependency graph. |
| `PORTAL_DEFAULT_ROUTE_ID` | a registered route ID | Never an arbitrary path. |
| `PORTAL_ROUTER_MODE` | `hash`, `history` | `memory` remains preview/test only. |
| `PORTAL_AUTH_MODE` | `required` | Live customer deployments cannot downgrade this through CMS. |
| `PORTAL_DATA_MODE` | `live` | Fixture mode remains preview/test only. |
| `PORTAL_ERROR_MODE` | `error` | Live mode must not opt into fixture fallback. |
| `PORTAL_BOOKING_MODE` | `closed`, `open` | `open` is valid only when the required server/current-demo contract is explicitly selected. |
| `PORTAL_RETAIL_MODE` | `browse-only`, `retail-commerce-open` | Must agree with cart/checkout modules and inventory truth. |
| `PORTAL_PLAN_COMMERCE_MODE` | `closed`, `open` | Must agree with pricing, checkout, and plan capability. |
| `PORTAL_PAYMENT_MODE` | `closed`, `simulated` | `paid` is deliberately not an allowed value. |
| `PORTAL_DEMO_COMMANDS_MODE` | `closed`, `current-api` | Staging-only; cannot imply production customer scope. |
| `PORTAL_ANONYMOUS_INTENT_MODE` | `closed`, `selection-only` | Stores only a short-lived public selection capsule; never cart, price, availability, PII, or success truth. |
| `PORTAL_ANONYMOUS_INTENT_TTL_SECONDS` | integer string, 60–86400 | Session capsule lifetime. |
| `PORTAL_ANONYMOUS_INTENT_MAX_ITEMS` | integer string, 1–50 | Maximum retail lines in the capsule. |
| `PORTAL_ANONYMOUS_INTENT_RECONCILIATION_MODE` | `authenticated-server` | Requires authentication plus resolved Account and authoritative server readback. |
| `PORTAL_REGISTRATION_MODE` | `closed`, `core-auth` | `core-auth` requires a proven registration and customer Account provisioning/linkage contract. |
| `PORTAL_ORGANIZATION` | organization code | Deployment selector, never authorization proof. |
| `PORTAL_ACCOUNT_TYPE_CODE` | account type code | Used by the fail-closed User-to-Account resolver. |
| `PORTAL_CORE_API_BASE` | same-origin path | Usually `/core`. |
| `PORTAL_ACCOUNT_API_BASE` | same-origin path | Usually `/core-acct`. |
| `PORTAL_SERVICE_API_BASE` | same-origin path | Usually `/core-svc`. |
| `PORTAL_BILL_API_BASE` | same-origin path | Usually `/core-bill`. |
| `PORTAL_PIM_API_BASE` | same-origin path | Usually `/core-pim/api`. |
| `PORTAL_PIM_ORGANIZATION` | organization code | Public/catalog selector, not customer scope. |
| `PORTAL_PIM_*` | current validated PIM selector fields | Product/price/currency/amount selectors retained from the existing contract. |
| `PORTAL_AUTH_CORE_BASE` | same-origin path | Core OIDC discovery base. |
| `PORTAL_AUTH_CALLBACK_PATH` | registered same-origin path | Must match discovery metadata exactly. |

The descriptor owns friendly profile intent. The compiler owns the final module
list and rejects invalid combinations. At minimum:

- `checkout` requires `cart` plus a sellable commerce source;
- open retail requires `products`, `cart`, and `checkout`;
- open booking requires `appointments` and `services`;
- open plan commerce requires `pricing`, `plan`, and `checkout`;
- a default route must be public or belong to an enabled module;
- a navigation item must target a reachable registered route;
- a live surface cannot use fixture auth, fixture data, or fallback success.

### 4. Runtime/session truth

The following must never be CMS parameters or descriptor defaults:

- User, Account, Order, Appointment, Cart, Subscription, or entitlement IDs;
- access tokens, API keys, passwords, CSRF values, roles, or authorization
  results;
- customer data, purchase data, account balances, private profile data, or
  support messages;
- computed totals, payment/receipt/refund truth, inventory truth, or allowed
  actions returned by the backend;
- tenant/customer scope derived from the authenticated session.

The six Core Auth placeholders remain request-owned and are not CMS parameters:
`LOGIN_ACTION`, `CSRF_PARAMETER_NAME`, `CSRF_TOKEN`, `RESET_PASSWORD_URL`,
`ERROR_DISPLAY`, and `LOGOUT_DISPLAY`.

## Navigation contract

Parameterize transitions between documents, not the portal's internal route
grammar.

The stable internal contract remains route IDs such as `orders.list`,
`services`, `pricing`, and `products`. The descriptor expresses semantic
destinations, and the compiler resolves them using `CX_LANDING_URL`,
`CX_PORTAL_URL`, and `PORTAL_ROUTER_MODE`.

Recommended descriptor destination forms:

```text
page:landing
page:portal
portal-route:services
portal-route:pricing
portal-route:products
section:services
url:https://approved.example/path
```

Generated templates receive resolved, explicit URL parameters only where an
anchor/navigation action needs one:

| code | consumers | intended transition |
| --- | --- | --- |
| `NAV_LANDING_URL` | portal; future login back-link | Return to the public landing. |
| `NAV_PORTAL_URL` | landing | Enter the portal document. The portal, not the landing, starts OIDC. |
| `NAV_PORTAL_SERVICES_URL` | landing | Open the portal services route using the configured router mode. |
| `NAV_PORTAL_PRICING_URL` | landing | Open the portal pricing route. |
| `NAV_PORTAL_PRODUCTS_URL` | landing | Open the portal shop route. |
| `NAV_SUPPORT_URL` | portal/landing | Open approved support or remain unavailable when empty. |
| `NAV_LOGOUT_RETURN_URL` | portal OIDC flow | Final safe destination after the registered logout callback. |
| `NAV_REGISTRATION_URL` | portal | Allowlisted Core Auth registration entry; absent while registration is closed. |

The public landing must not hardcode or directly guess the Core Auth form URL.
Its `Sign in` action enters `NAV_PORTAL_URL`; the portal stores the intended
route and starts the discovery-driven OIDC flow. This preserves return state and
keeps authentication topology out of marketing CMS content.

Every resolved HTTP(S) destination must pass the origin allowlist. Reject
`javascript:`, `data:`, protocol-relative URLs, malformed URLs, and any
cross-origin redirect not explicitly listed. `tel:` and `mailto:` are allowed
only in typed contact fields, never as auth or portal destinations.

## Portal copy strategy

The current runtime contains substantial hardcoded English and some
vertical-specific shell copy. Replacing only root `data-portal-*` values would
make features configurable but would not make the family fully reusable or
localizable.

Migrate copy in two bounded passes:

1. parameterize brand, navigation labels, global CTAs, account-menu labels,
   document title, and cross-surface destinations;
2. inventory accepted loading/empty/error/command-state copy and move it to a
   typed code-owned copy dictionary.

The copy dictionary should expose known keys, not arbitrary HTML. For JTE, emit
localized values into inert text nodes or individually escaped attributes and
let runtime JavaScript read `textContent`. Do not interpolate untrusted JSON
directly into executable `<script>` content.

## Experience Descriptor

The repository source should be a schema-validated document resembling:

```json
{
  "schemaVersion": 1,
  "experience": {
    "id": "calm-harbor-spa-staging",
    "vertical": "beauty",
    "theme": "beauty",
    "defaultMode": "light",
    "brand": { "name": { "en": "Calm Harbor Spa" } },
    "allowedNavOrigins": ["https://dev-1.servicewand.com"]
  },
  "surfaces": {
    "landing": {
      "url": "https://dev-1.servicewand.com/calm-harbor",
      "primaryDestination": "page:portal",
      "servicesDestination": "portal-route:services"
    },
    "portal": {
      "url": "https://dev-1.servicewand.com/calm-harbor/portal",
      "routerMode": "hash",
      "defaultRoute": "orders.list",
      "profile": "appointments-commerce",
      "capabilities": {
        "booking": "open",
        "retail": "retail-commerce-open",
        "planCommerce": "open",
        "payment": "simulated",
        "demoCommands": "current-api"
      }
    },
    "login": {
      "consumer": "core-auth",
      "pageContextSelector": "UNPROVEN"
    }
  },
  "deployment": {
    "organization": "CALM_HARBOR_SPA_STAGING",
    "accountTypeCode": "SPA_CUSTOMER",
    "coreApiBase": "/core",
    "accountApiBase": "/core-acct",
    "serviceApiBase": "/core-svc",
    "billApiBase": "/core-bill",
    "pimApiBase": "/core-pim/api",
    "authCallbackPath": "/core/oauth2-callback.html"
  },
  "content": {
    "landingRef": "calm-harbor-spa.public-authored.json",
    "portalCopyRef": "customer-portal.en.json",
    "loginCopyRef": "customer-login.en.json"
  }
}
```

The example is intentionally staging-specific. A production descriptor must
not inherit `current-api` demo commands merely because the vertical and theme
match.

### Two-vertical falsification check

The same schema must accept both of these without template-source edits:

| decision | Calm Harbor staging | HVAC customer portal |
| --- | --- | --- |
| vertical/theme | `beauty` / `beauty` | `hvac` / `hvac` |
| profile intent | appointments + commerce | on-demand service + commerce |
| primary module | `appointments` | `orders` |
| weather calendar | off | off |
| retail | open only for the bounded simulated staging contract | closed or opened only by its own contract |
| landing primary destination | portal appointments/services entry | portal booking/services entry |
| brand/login copy | tenant descriptor | different tenant descriptor |
| template source | generic family | the same generic family |

This check fails if a Beauty/Calm Harbor string, `SPA_*` selector, navigation
label, or module requirement is needed by generic HTML/JavaScript rather than by
the descriptor/profile adapter. It also fails if enabling one vertical silently
opens commands for the other.

## Template identity and PageContext

Prefer stable generic template codes:

```text
CUSTOMER_EXPERIENCE_LANDING
CUSTOMER_EXPERIENCE_LANDING_<APPROVED_SECTION>
CUSTOMER_EXPERIENCE_PORTAL
CUSTOMER_EXPERIENCE_LOGIN
CUSTOMER_EXPERIENCE_AUTH_2FA
```

Tenant/vertical customization belongs in PageContext values. Template defaults
must be neutral, safe, and non-operational: no tenant organization, no live
catalog selectors, no open commands, and no claims. A missing PageContext must
fail closed rather than render another tenant's brand or data source.

Compatibility rule: do not delete current Calm Harbor codes or PageContexts
during the first migration. Generate generic packages beside them, compare,
then switch each consumer explicitly. The login's consumer wiring is an
independent gate from template correctness.

## JTE constraint

The portal exporter currently enforces a parameter-free JTE root. The bundled
runtime does not currently contain JavaScript template-literal `${...}`
markers, so portal parameters can be introduced safely if the exporter changes
its invariant to:

- allow `${CODE@TYPE}` only in `head` and `html` at declared locations;
- continue rejecting undeclared JTE markers and directives;
- reject `${` in the bundled JavaScript and CSS fields;
- verify that every declared parameter is referenced and every reference is
  declared;
- render a preview with resolved values and assert no CMS marker remains.

Do not weaken the JTE safety check globally merely to enable parameters.

## Validation gates

The generated family is acceptable only when automated checks prove:

1. all shared `CX_*` and `NAV_*` values agree across consuming surfaces;
2. no generic template field contains `Calm Harbor`, its organization code, or
   its URLs as hardcoded source text;
3. Calm Harbor generated output matches the accepted visual baseline and the
   current functional checks;
4. one non-Beauty descriptor generates the same four template types without
   source edits;
5. feature dependencies, route reachability, and profile navigation validate;
6. live configurations cannot select fixture/fallback modes or unsupported
   paid-payment semantics;
7. navigation destinations pass scheme/origin rules and cannot create an open
   redirect;
8. the six login placeholders and eight 2FA placeholders survive byte-for-byte,
   and the unused 2FA OTPAUTH URI remains absent;
9. CMS parameter values contain no credential, customer/session identity, or
   private entity data;
10. a repeated build is deterministic and a repeated CMS sync is a no-op;
11. anonymous landing -> portal -> Core Auth -> intended portal route and
    logout return are proven end-to-end for the selected PageContexts.
12. anonymous selection resume is single-flight, server-idempotent, Account-
    gated, and preserves its capsule for retry after failed reconciliation.

## Anonymous selection and auth resume

The browser may preserve a pre-auth *intent*, not a cart or booking. The
session capsule contains only the experience id, intent reference, public
offer/variant or service code, quantity, registered return route, and
created/expiry timestamps. It must not contain price, totals, inventory,
availability, a selected slot, PII, User/Account IDs, payment state, or a claim
that anything succeeded.

After Core Auth returns, the portal waits for the User-to-Account resolver.
Only then may an authenticated-server handler re-read current offer, price,
availability, and cart/booking state and attempt reconciliation with the
capsule's intent reference as an idempotency key. Concurrent resume attempts
for the same intent share one promise. Success clears the capsule; a server
failure preserves it for explicit retry; expiry and malformed capsules clear
locally and fail closed.

`selection-only` remains a configuration capability, not an accepted visual
state. It must stay `closed` for Calm Harbor until the design request for
selection, auth handoff, pending, retry, expiry, and changed-price/availability
states is accepted and the authenticated handlers are wired.

## Failure modes to keep explicit

- **Configuration drift:** operators edit three PageContexts independently.
  Mitigation: generate all maps from one descriptor and compare live readback.
- **Open redirect:** a CTA/auth return accepts an arbitrary external URL.
  Mitigation: semantic destinations plus an explicit origin allowlist.
- **Broken router:** CMS authors route paths that no guard/component owns.
  Mitigation: stable route IDs; compiler resolves URLs.
- **Impossible feature set:** checkout is enabled without cart/products or a
  default route points to a disabled module. Mitigation: dependency validation.
- **Brand leak:** missing PageContext falls back to another tenant's defaults.
  Mitigation: neutral closed defaults and required experience identity.
- **Login ambiguity:** Core Auth cannot determine which tenant branding to use.
  Mitigation: keep per-tenant deployment instances until selector behavior is
  proven; do not infer tenant from an untrusted return URL.
- **Visual drift:** arbitrary colors/logo/layout are exposed before accepted
  states exist. Mitigation: theme/profile enums and design-gap flow.
- **Security theatre:** organization/API parameters are treated as customer
  authorization. Mitigation: preserve server/session-derived scope boundaries.
- **JTE collision/injection:** parameter syntax appears in executable runtime
  fields or unsafe content is injected into scripts. Mitigation: field-scoped
  marker checks and inert/escaped copy transport.
- **Localization mismatch:** values are generated for organization-disabled
  locales. Mitigation: generate only enabled locales and validate completeness.

## Migration sequence

1. Add the descriptor schema, parameter registry, destination resolver, and a
   Calm Harbor descriptor. Generate reports only; do not change CMS output.
2. Parameterize the portal root's current literal attributes and shared shell
   identity. Preserve current runtime behavior and route IDs.
3. Replace hardcoded OIDC `#/orders` and `#/login` post-action choices with the
   validated intended/default/logout destination contract.
4. Convert the login package to the generic source contract while preserving
   all Core Auth placeholders and accepted states.
5. Convert landing navigation/actions to resolved URL parameters and remove
   tenant names from exporter/template identity.
6. Add a cross-surface contract check and generate a second vertical fixture.
7. Prove PageContext selection and the complete browser flow before switching
   any existing Calm Harbor consumer.

## Required product answer before the final login deployment model

Which trusted request property selects the customer experience on the anonymous
Core Auth page: organization, host/domain, a server-owned client registration,
or a dedicated PageContext route?

The answer must come from Core Auth/CMS behavior. A return URL, query parameter,
or browser-authored organization value is not sufficient authority for tenant
branding or routing.

## Local compiler checkpoint (2026-08-04)

The first local compiler slice is implemented:

```bash
node app-templates/customer-portal/scripts/build-calm-harbor-target-runtime.mjs
node app-templates/customer-portal/scripts/build-customer-experience.mjs \
  --descriptor app-templates/customer-portal/experience/descriptors/calm-harbor-spa.staging.json
node app-templates/customer-portal/scripts/customer-experience-build-check.mjs
```

The default output is generated under
`app-templates/customer-portal/dist/customer-experience/<experience-id>/` and
contains:

- one generic landing family with the accepted 13-section presentation;
- one generic portal root with descriptor-backed `data-portal-*` values;
- one generic Core Auth login root preserving all six Core placeholders;
- a surface PageContext parameter map beside every template;
- landing child PageContext maps, a report, and a build manifest.

Template parameter defaults are deliberately empty. Tenant brand, copy,
organization, selectors, feature modes, and destinations exist only in the
generated PageContext maps. Therefore a missing PageContext cannot silently
render another tenant's defaults.

The compiler performs no CMS upload and no consumer/PageContext switch.
`--require-resolved` refuses output unless all URL and login-selector gates are
closed. The current Calm Harbor descriptor remains non-publishable because its
deployed landing/portal URLs are not recorded and the trusted Core Auth
PageContext selector is still unproven.

The cross-vertical check proves that Beauty and HVAC use the same generic
template identities and portal/login runtime structure with different maps.
Non-Beauty full publication remains fail-closed until its accepted landing
child-content map is compiled; the build explicitly emits
`landing-content-map-not-compiled` rather than leaking Beauty defaults.

## Configuration wizard checkpoint (2026-08-05)

Create a structurally validated configured experience interactively:

```bash
node app-templates/customer-portal/scripts/create-customer-experience.mjs
```

The wizard writes the descriptor and a sibling `.creation-report.json`. The
report distinguishes schema/semantic validity from publication readiness and
lists unresolved deployment, evidence, auth, and visual gates. The discoverable
`customer-experience-configurator` Codex skill runs the same workflow; it does
not bypass report or build gates.
