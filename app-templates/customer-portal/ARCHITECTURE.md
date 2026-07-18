# Customer Portal Architecture

Status: frozen wave-9 runtime contract.
Last updated: 2026-07-10.
Accepted design baseline: `c9879ae` (`Expand customer portal vertical design`).

This document is the production contract for transferring the accepted
executable design in `design-inbox/` into the customer portal runtime and CMS
artifacts. The design source owns visual truth. The production runtime owns
routing, configuration, data, commands, authorization, persistence, CMS
packaging, and honest failure behavior.

## Domain-Specific Authority

Authority is split by concern; there is no global source ordering:

- Accepted design commit `c9879ae` and its executable source are authoritative
  only for visual composition, responsive behavior, stable ids/hooks, class
  composition, and accepted visual states.
- This `ARCHITECTURE.md` is authoritative for production business logic,
  security, authorization, permissions, normalized data truth, live/fixture
  disposition, command outcomes, CMS ownership, and delivery boundaries.
- The closed customer-portal runtime program and current implementation are the
  regression baseline for behavior already proven, including PIM and
  `stormOps`; they do not override this wave-9 production contract.
- Design demo timers, hardcoded transitions, preview toolbar behavior, fixture
  success messages, and mock command outcomes are never production business
  authority. They express visual lifecycle only.

### Accepted Design Metadata Reconciliation

Two prose fields in the accepted manifest are stale:

- `manifest.json.format` still says six CSS files and approximately 47 JS files;
  the actual accepted tree/current HANDOFF baseline is seven CSS files and 61
  JavaScript files.
- the Care module-tree note still says six vertical-specific Care sets; the
  current manifest component arrays, fixtures, scenarios, source, and HANDOFF
  contain eight, including Health and Beauty.

`design-inbox/**` remains immutable. For inventory/count reconciliation, actual
files plus current HANDOFF, current manifest arrays, fixtures, and scenarios
override stale prose/count fields. Stable ids/hooks and visual composition in
the executable design remain design authority; this reconciliation does not
authorize renaming or redesign.

`design-inbox/**` is immutable designer-owned input. Production changes belong
under `runtime/**`, `cms/**`, and owned scripts/docs. A screenshot is supporting
evidence, not a replacement for the executable design source.

## Frozen Platform Decisions

- Use custom JavaScript and native ES modules served over HTTP.
- Do not add React, a bundler, a package manager, or a build-only runtime.
- Preserve accepted `data-route`, `data-module`, `data-action`, `data-bind`,
  `data-state`, `data-visual-id`, `data-requires-confirmation`, entity ids,
  class composition, and responsive behavior unless an explicit contract
  migration is approved.
- Do not ship `data-dev-toolbar`, viewport-simulation wrappers, preview-only
  metadata panels, or an end-user theme picker.
- Do not add aliases or backward-compatibility shims for superseded dev-only
  contracts. Tests must call production contracts directly.
- Do not invent endpoints, permissions, data, regulated facts, command results,
  or success states.
- A read-only fallback may render only with explicit `fallback`/`error` state.
  It is never live success. A mutation without a real live handler or an
  inspectable fixture transition is unavailable or `not_opened`.
- CMS upload, deployment, DNS, analytics-provider configuration, and production
  credentials are outside this program.

## Two Production Surfaces

Wave 9 has two related but separately deployable surfaces.

| surface | purpose | boot/auth/routing contract | production owner |
| --- | --- | --- | --- |
| Authenticated portal | Profile-driven customer operations and the vertical Care hub | Portal shell; configured hash/history/memory router; private routes require session and guards | Existing portal CMS block/root template plus `runtime/**` |
| Public SEO landing | Indexable vertical-by-locality marketing document | Useful server-visible HTML without portal boot, auth, shell, or hash navigation | A separate public CMS block/template/export |

`seo.landing` remains an executable parity route so shared sections can be
compared with `c9879ae`. It is not the production delivery mechanism for SEO.
The canonical public URL is authored by CMS and served as a normal public
document.

## Ownership And Runtime Boundaries

```text
customer-portal/
  design-inbox/                 immutable executable visual baseline
  runtime/
    source.html                 local portal preview
    styles/                     transferred production styles/tokens
    src/
      app.js                    boot and root render only
      config.js                 themes, profiles, routes, root config
      router.js                 route resolution and guards
      state.js                  runtime/session/UI state
      actions.js                delegated command dispatch
      portal-runtime.js         module loading/cache/status
      modules/                  module descriptors/orchestration
      adapters/                 fixture/live IO only
      normalizers/              raw-to-UI shape logic only
      components/               visual components
      routes/                   route composition
    data/                       fixtures and scenario registry
    manifest.json               production hook/component/action inventory
  cms/
    block.json                  authenticated portal CMS contract
    root-template.html          authenticated portal document
    public SEO metadata/template contract (wave-9 gap)
  scripts/
    deterministic config, route, adapter, export, and document checks
  dist/
    generated portal/public previews; never hand-authored business logic
```

Shared files must be edited serially in later stages:

- `runtime/src/app.js`, `config.js`, `router.js`, `state.js`, `actions.js`;
- `runtime/src/modules/index.js`, adapters, and normalizers;
- `runtime/data/fixtures.js`, `runtime/data/scenarios.json`, and
  `runtime/manifest.json`;
- shared tokens/routes/responsive styles;
- CMS metadata, templates, export scripts, and generated previews.

### Authenticated Root Template Contract

The authenticated portal root owns shell mounting, shared runtime/style loading,
and deployment configuration only. Route-specific business copy, page markup,
and reusable visual components remain in their route/module owners; they must
not be embedded in the CMS root template.

The stable root section emitted by `cms/root-template.html` is:

```html
<section
  id="app"
  data-portal-api-base="{{portal_api_base}}"
  data-portal-organization="{{portal_organization}}"
  data-portal-core-api-base="{{portal_core_api_base}}"
  data-portal-account-api-base="{{portal_account_api_base}}"
  data-portal-bill-api-base="{{portal_bill_api_base}}"
  data-portal-account-type-code="{{portal_account_type_code}}"
  data-portal-vertical="{{portal_vertical}}"
  data-portal-profile="{{portal_profile}}"
  data-portal-theme="{{portal_theme}}"
  data-portal-default-mode="{{portal_default_mode}}"
  data-portal-router-mode="{{portal_router_mode}}"
  data-portal-default-route="{{portal_default_route}}"
  data-portal-enabled-modules="{{portal_enabled_modules}}"
  data-portal-auth-mode="{{portal_auth_mode}}"
  data-portal-error-mode="{{portal_error_mode}}"
  data-portal-data-mode="{{portal_data_mode}}"
  data-portal-case="{{portal_case}}"
  data-portal-pim-api-base="{{portal_api_base}}"
  data-portal-pim-organization="{{portal_organization}}"
  data-portal-pim-fixture-url="{{portal_pim_fixture_url}}"
  data-portal-pim-product-type-code="{{portal_pim_product_type_code}}"
  data-portal-pim-currency="{{portal_pim_currency}}"
></section>
```

These attribute names are production contracts. CMS exposes their values
through stable parameter codes; runtime code parses them without hidden template
edits. `data-portal-auth-mode` and `data-portal-data-mode` are independent, and
the PIM attributes remain the pricing/products adapter inputs. The Core,
Account, and Bill service bases select same-origin services only. The Account type code
narrows the signed-in User lookup to the configured customer Account kind; it
is not an Account id or an authorization result.

## Configuration Axes

The configuration relationship is:

```text
vertical -> theme -> profile -> enabled modules -> enabled routes/actions
```

Themes are token sets. Profiles are navigation/business behavior. Both are
data-driven registries, not scattered vertical-name conditionals.

| slug | display name | profile | Care label/kind | calendar/weather | commerce |
| --- | --- | --- | --- | --- | --- |
| `hvac` | HVAC | `onDemand` | Equipment / `equipment` | Month calendar; weather details only when present | Pricing, products, cart on |
| `snow` | Snow Removal | `stormOps` | Season log / `seasonLog` | Weather-operational calendar | Cart off |
| `lawn` | Lawn & Garden | `stormOps` | Program / `program` | Weather-operational calendar | Cart off |
| `pool` | Pool & Spa | `stormOps` | Water / `water` | Weather-operational calendar | Cart off |
| `roofing` | Roofing | `stormOps` | Roof report / `roof` | Weather-operational calendar | Cart off |
| `pest` | Pest Control | `stormOps` | Monitoring / `monitoring` | Weather-operational calendar | Cart off |
| `health` | Health | `appointments` | Care plan / `healthCare` | Month calendar; no weather trigger | Pricing, products, cart on |
| `beauty` | Beauty | `appointments` | My routine / `beautyCare` | Month calendar; no weather trigger | Pricing, products, cart on |

Profile contract:

| profile | verticals | navigation contract | primary action | calendar | cart |
| --- | --- | --- | --- | --- | --- |
| `onDemand` | HVAC | Orders, Care, Proposals, Services, Pricing, Products, Support | `booking.open` / + Book | Month | on |
| `stormOps` | Snow, Lawn, Pool, Roofing, Pest | Home, Calendar, Care, Contracts, Services, Activity, Support | `service.request` | Weather-operational | off |
| `appointments` | Health, Beauty | Appointments, Calendar, Care, Services, Pricing, Products, Support | `booking.open` / + Book | Month | on |

Health and Beauty set weather-trigger data to absent. Absence is valid input;
it must remove weather banner/panel/feed UI rather than create Snow-specific
defaults.

### Theme And Mode Propagation

`data-theme` is deployment configuration and is not an end-user picker.
Components consume CSS custom properties rather than hardcoded vertical colors.

The HTML `data-mode="light|dark"` value from `portal_default_mode` is an initial
default only. After the user chooses a mode, re-render, module refresh, route
change, or hydration must preserve that choice. This rule is distinct from
`portal_data_mode="fixture|live"`, which selects a data adapter mode and never
controls color mode.

`portal_case` is an optional fixture-only case id. It selects a complete
demonstration organization only when `portal_data_mode="fixture"`; the runtime
ignores it in live mode. It is never a customer, tenant, or production data
selector.

## Route Registry: 17 Accepted Routes

Route ids are the stable contract. Parameterized design paths must retain their
entity id semantics; implementations may compile them for a router but must not
replace the contract with a preview-only static detail path.

| route id | accepted path | auth | module | production disposition |
| --- | --- | --- | --- | --- |
| `landing` | `/` | public | landing | Portal/public pre-auth page |
| `seo.landing` | CMS `canonicalPath`, e.g. `/hvac/{locality-slug}` | public | SEO parity | Parity route only; separate public CMS document owns production URL |
| `auth.phone` | `/login` | public | auth | Portal route |
| `auth.code` | `/login/verify` | public | auth | Portal route |
| `orders.list` | `/orders` | private | orders | Portal route/profile variant |
| `order.detail` | `/orders/:id` | private | orders | Portal entity route |
| `calendar` | `/calendar` | private | calendar | Month or storm profile variant |
| `services` | `/services` | private | services | Portal route |
| `pricing` | `/pricing` | private | pricing | Portal route; preserve PIM behavior |
| `products` | `/products` | private | products | Portal route; preserve PIM behavior |
| `checkout` | `/checkout` | private | checkout | Enabled by profile |
| `proposals.list` | `/proposals` | private | proposals | Portal route/profile label variant |
| `proposal.detail` | `/proposals/:id` | private | proposals | Portal entity route |
| `profile` | `/profile` | private | profile | Portal route |
| `activity` | `/activity` | private | activity | Enabled by profile |
| `support` | `/support` | private | support | Portal route |
| `care` | `/care` | private | care | Module- and entitlement-aware portal route |

Guard contract:

- Unknown routes resolve deliberately, never to a blank page.
- Unauthenticated private access goes to `auth.phone` and retains the intended
  route.
- Disabled modules do not appear in navigation. Direct access renders a clear
  disabled state or the configured reachable default, except Care entitlement
  failures, which use the accepted Care gate described below.
- Router modes remain `hash` (CMS default), `history` (only with server path
  fallback), and `memory` (tests/previews).
- Public SEO production correctness must be provable with the portal script
  disabled and with no hash fragment.

## Module Model

Each module owns its routes, adapter choice, normalizer, normalized UI shape,
commands, and states:

```text
module.id
module.requires
module.routes
module.adapter(context)
module.load(context)
module.normalize(raw, context)
module.commands
module.emptyState
module.errorState
```

`module.normalize(raw, context)` must delegate to a dedicated module-owned
normalizer. A descriptor may select/import that function but must not become a
second location for shape logic.

Existing module regression set: `auth`, `orders`, `proposals`, `services`,
`pricing`, `products`, `checkout`, `calendar`, `activity`, `profile`, and
`support`. Wave 9 adds `care` plus reusable SEO content/section normalization;
the public SEO document remains a separate delivery surface.

### Adapter And Data-Mode Truthfulness

- Adapters perform IO and return raw payloads.
- Normalizers convert raw payloads to stable UI shapes.
- Components never consume raw Core/CMS payloads.
- Fixture mode is explicit offline/test behavior.
- Live mode may use only a repository-proven live contract. It must not silently
  choose fixture data for an unsupported module.
- An unknown live adapter, permission, or command remains `not_opened`; the UI
  renders unavailable/error/fallback truthfully.
- Static read-only fallback content may remain useful, but must be visibly
  `fallback` and must not enable mutations or masquerade as fresh live data.

The current Core PIM adapter for pricing/products is the only proven live data
path in the closed baseline. Preserve its request/normalization behavior and
fixture path. Non-PIM live modules remain `not_opened` until their contracts
exist.

### Canonical Target Shapes And Current Legacy Baseline

The previously documented entity contracts below remain production architecture
targets. They are not a claim that every current fixture normalizer or consumer
already emits/uses every canonical field.

Order entity:

```js
{
  id,
  status,
  serviceName,
  scheduledAt,
  completedAt,
  site,
  technician,
  totals,
  timeline,
  weatherTrigger,
  allowedActions,
}
```

Proposal entity:

```js
{
  id,
  status,
  site,
  title,
  plans,
  selectedPlanId,
  totals,
  expiresAt,
  allowedActions,
}
```

Pricing/product entity:

```js
{
  id,
  code,
  name,
  description,
  price,
  currency,
  interval,
  attributes,
  cta,
  allowedActions,
}
```

The current implementation is a known baseline gap:

```js
normalizeOrders(raw)    -> { items: LegacyOrderFixture[], statusMeta, technician, addresses }
normalizeProposals(raw) -> { proposal, sites: ProposalSiteRecord[], statusMeta }
normalizePricing(raw)   -> { plans: PricingProduct[], rates, source? }
normalizeProducts(raw)  -> { feature, categories, items: PricingProduct[], source? }
```

- `normalizeOrders` clones existing fixture order records and adds
  `allowedActions`; it does not currently guarantee every canonical Order
  target field.
- `normalizeProposals` returns the existing top-level `proposal`, `statusMeta`,
  and `sites`. Each `sites` item is a proposal-site record augmented with
  `allowedActions`, not a canonical `Proposal` entity.
- several current routes/components still read `window.AircoveFixtures` / `F.*`
  directly, so the normalizer boundary is not yet complete.
- Core PIM rows expose most canonical PricingProduct target fields and also
  retain internal `priceNum` and raw `row` metadata for current behavior.
  Components must not add new dependencies on provider `row`.

Migration is atomic within the stage that owns the affected surface: update the
normalizer, every consuming component/route, fixture and PIM contract tests, and
browser regression together. Preserve current user-visible behavior while
progressively removing direct `F.*`/raw consumption where the owned stage needs
that boundary. Do not silently change shapes, relabel legacy records as
canonical, or add a dev-only backward-compatibility layer. A canonical target
becomes an implemented contract only when both fixture/live normalization and
all consumers are validated against it.

## Care Module Contract

Care is one normalized, entitlement-aware module selected by configuration. The
route does not embed eight vertical implementations or copy branches.

### Two-Phase Authorization And Load Flow

Care must decide access before protected payload IO:

1. **Preflight phase:** resolve module enablement, authenticated session,
   customer/tenant scope, entitlement, and permission from configuration and an
   unprotected authorization/control-plane contract. The protected Care payload
   adapter must not be constructed or called in this phase.
2. **Payload phase:** only an explicit `granted` preflight decision may invoke
   the protected Care adapter. The returned raw payload is then passed to the
   dedicated Care normalizer.

Disabled, unauthenticated, not-entitled, forbidden, preflight-loading, and
preflight-error decisions never trigger protected payload IO. Until preflight is
granted and payload normalization succeeds, `content` is `null`, `kind` may be
`null`, and `allowedActions` is empty. Protected entity ids and payload fields
must not enter application state, DOM, logs, analytics, error context, or
telemetry on a failed access decision.

### Normalized Envelope

The envelope represents both preflight and payload phases without requiring a
kind-specific payload before authorization:

```js
{
  id: "care",
  vertical: "hvac|snow|lawn|pool|roofing|pest|health|beauty",
  phase: "preflight|payload",
  kind: null|"equipment|seasonLog|program|water|roof|monitoring|healthCare|beautyCare",
  navLabel: String,
  title: String,
  subtitle: String,
  state: "ready|loading|empty|error|disabled|unauthorized",
  access: {
    status: "checking|disabled|unauthenticated|not-entitled|forbidden|granted|error",
    reasonCode: String|null
  },
  emptyState: null|{ glyph: String, title: String, description: String },
  content: null|{ /* exactly one kind-specific normalized payload after grant */ },
  allowedActions: [String]
}
```

`kind` and kind-specific `content` become required only for an authorized
payload-phase `ready` result. `loading`, `error`, `disabled`, `unauthorized`,
and pre-payload states require `content: null`; `empty` may carry only safe,
normalized empty-state copy and no protected entities.

Kind-specific normalized content:

| kind | required content |
| --- | --- |
| `equipment` | Units/passports/check groups and nonsecure document metadata; stable `unit-*`, `doc-*` ids |
| `seasonLog` | Stats, SLA result, storm events, compliance document metadata |
| `program` | Re-entry notice, program steps, soil snapshot, progress photos |
| `water` | Test timestamp/cadence, readings/safe ranges, dose log |
| `roof` | Score/inspection metadata, zones, repair project timeline, document metadata |
| `monitoring` | Summary, stations/map coordinates, alerts, guarantee scope with `planId`, `propertyId`, `serviceId` |
| `healthCare` | Appointment, logistics-only plan milestones, follow-up tasks, provider metadata, secure-document metadata, disclaimer |
| `beautyCare` | Appointment, package usage, specialists/preference, treatment/routine history, loyalty, product references |

### Entitlement And State Rules

- Module disabled by profile/config: hide navigation and render the explicit
  module-disabled route treatment on direct access, with `content: null` and no
  protected adapter call.
- Module enabled but session missing: apply the normal private-route auth guard,
  with no Care payload state and no protected adapter call.
- Session present but plan entitlement absent or denied: render the accepted
  `unauthorized` entitlement gate. Do not redirect to an unrelated route and do
  not expose or load Care payload data; `content` remains `null`.
- Preflight loading/error: render the matching safe route/module treatment with
  `content: null`; do not call the protected adapter.
- Granted preflight: invoke the protected adapter once, then render payload
  `loading`, `empty`, `error`, or `ready`; loading/error/empty expose no
  protected content.
- Action permission failures are scoped to the affected action/entity and do
  not rewrite the whole route as success.

Accepted Care states are `ready`, `loading`, `empty`, `error`, and
`unauthorized`. Accepted component states include Pest retreat
`available|requesting|used`, Health tasks `open|done`, and Beauty specialist
selection `active`.

S2 must include negative security tests for disabled, unauthenticated,
not-entitled, forbidden, preflight-loading, and preflight-error cases. A spy must
prove the protected adapter was not called. Assertions must also prove protected
entity ids/payload never enter runtime state, DOM text/attributes, console/error
logs, analytics, or telemetry. A positive granted case must prove exactly one
adapter call occurs only after the access decision. These are stage gates, not
optional security smoke tests.

### Care Command Dispositions

| action | stable payload | fixture/local rule | live rule at S0 |
| --- | --- | --- | --- |
| `care.selectUnit` | `unit.id` | May change inspectable selected-unit state | Local selection allowed; persistence is `not_opened` |
| `care.download` | `document.id` | Requires an actual fixture URL/blob or is unavailable | `not_opened` until document URL/authorization contract exists |
| `care.requestRetreat` | `planId`, `propertyId`, `serviceId` | Must create an inspectable request/status transition; a spinner/toast alone is not success | `not_opened` pending endpoint, entitlement, idempotence, and readback |
| `care.selectSpecialist` | `specialist.id` | May change inspectable preference state | Local selection allowed; live persistence is `not_opened` |
| `care.completeTask` | `task.id` | Must toggle inspectable task state | Live sync is `not_opened` pending endpoint/auth/readback |
| `care.contactProvider` | `provider.id` | Requires an approved real destination/command or is unavailable | `not_opened` pending provider-contact authorization and audit contract |
| `care.openSecureDoc` | `document.id` | No fake document contents; metadata-only fixture may report unavailable | `not_opened` until the full secure-document gate passes |

Opened async commands use action/entity-scoped pending and error state, prevent
duplicate submission with documented single-flight/drop semantics, allow retry,
and prove success from authoritative response/readback or an inspectable fixture
transition. Toasts are feedback, never proof.

## Public SEO Contract

The parity route and public document account for all 14 accepted SEO component
ids:

`seo-hero`, `seo-trust-strip`, `seo-service-card`, `seo-services-grid`,
`seo-how-it-works`, `seo-proof`, `seo-pricing`, `seo-service-area`,
`seo-reviews`, `seo-faq`, `seo-final-cta`, `seo-footer`, `seo-cta`, and
`seo-meta-preview`.

`seo-service-card` is the reusable item inside `seo-services-grid`, and
`seo-cta` is the shared control. `seo-meta-preview` is accepted for executable
parity only; it and `data-dev-toolbar` must not ship as production UI.

### CMS-Authored Inputs

The separate public CMS schema owns, per vertical/locality document:

- metadata: `seoTitle`, `metaDescription`, `h1`, resolved `canonicalPath`,
  `locality`, `serviceArea`, primary CTA kind/label/destination, and secondary
  CTA;
- content: hero service/offer, trust facts, how-it-works, vertical proof,
  pricing rows, service-area collection/map media, reviews/media, FAQ
  collection, final CTA, and footer contacts/hours/areas/legal links;
- assets/collections as CMS references, not encoded live business JSON in root
  parameters.

Nullable trust, price, contact, regulated, review-media, and map slots never
become invented facts. Public production output omits or honestly labels an
unavailable slot; preview-only “from CMS” chips are not production content.

### Public Document Requirements

- Server-visible meaningful body content before JavaScript boot.
- Real `<title>`, meta description, canonical link, and one authored H1.
- Canonical/locality merge tags resolved before output; no literal
  `{locality}` or `{locality-slug}` in production.
- Visible FAQ and valid FAQ structured data generated from the same authored
  FAQ collection. JSON-LD is preferred; omit it when no eligible FAQ exists.
- No auth/session dependency, portal root dependency, or hash-only navigation.
- Shared tokens/components may be reused without importing authenticated shell
  behavior or duplicating business logic in generated HTML.

SEO dynamic section states are `ready|loading|empty`; only CMS-dynamic trust,
pricing, service-area, reviews, FAQ, and hero-offer sections use loading/empty.
CTA lifecycle is `idle|pending|success|error`.

| action | production truth contract |
| --- | --- |
| `seo.cta.book`, `seo.cta.quote` | Navigate/hand off only to an authored, allowed destination; no synthetic success. Async flows need pending/error and authoritative acceptance/readback. |
| `seo.cta.call` | Use an authored valid contact destination; otherwise unavailable/omitted. |
| `seo.cta.services` | Local navigation to the services section. |
| `seo.service.select` | Preserve stable service identity and navigate to an authored booking/quote destination; otherwise unavailable. |
| `seo.faq.toggle` | Local disclosure state; visible FAQ and structured data remain consistent. |

## Health And Beauty Sensitive-Data Boundary

Health is logistics and secure-document metadata only. It must not invent or
render clinical metrics, readings, diagnoses, results, outcomes, treatment
claims, or medical-record content. Secure contents never appear in list markup,
logs, fixtures, analytics, or normal API responses.

Beauty appointment, address, provider/specialist, saved formula/note, treatment
history, preference, and document data are personal/sensitive service data even
when not clinical. Apply least-data rendering and the same deliberate access
review rather than treating the vertical as ordinary marketing content.

Before any sensitive Health/Beauty live read or action opens, all of these must
be repository-proven and testable:

1. authenticated session and tenant/customer object scope;
2. RBAC/ABAC permission for the exact record and command;
3. recorded, current consent/purpose where required;
4. audit event for view/download/contact/mutation with actor, object, action,
   timestamp, and outcome, without sensitive contents in the log;
5. secure document viewer/download using short-lived authorized access,
   no public URL/cache leak, and correct content disposition;
6. least-data adapter/normalizer shape and redaction;
7. scoped pending/error, duplicate-submit policy, idempotence, and authoritative
   readback for mutations.

If any item is missing, the specific live path remains `not_opened`. Fixture UI
may show metadata and honest unavailable states; it may not simulate protected
document contents or a successful sensitive mutation.

## State And Command Grammar

Accepted global UI states:

```text
ready loading empty error pending-action drawer-open
mobile-navigation-open active validation-error success-toast
```

Accepted entity/domain states include:

```text
scheduled inProgress completed cancelled
unseen viewed approved revision declined
idle success requesting used open done
```

Runtime-only truth states may include `fallback`, `disabled`, and
`unauthorized` when they receive explicit visual/scenario coverage. State lives
at the narrowest useful scope: route, module, then entity/action.

All action handlers validate module availability, auth, permission, current
entity state, and confirmation requirements. Unknown handlers fail honestly.
Fixture success must mutate inspectable offline state. Live success requires an
authoritative response or readback; dispatch, timeout, hardcoded response, or
toast is not success.

Delegated command binding must preserve `data-requires-confirmation`. An action
element carrying that hook requires explicit user confirmation before command
dispatch; cancellation performs no mutation. The command handler still repeats
authorization and current-entity validation after confirmation, so the DOM hook
cannot bypass business enforcement.

## CMS Contract

The authenticated root continues to expose stable portal parameters for API
base/organization, vertical/profile/theme, initial default mode, router/default
route, enabled modules, auth/error/data modes, and PIM configuration.

Wave-9 portal CMS work must:

- extend vertical/theme enums to `health` and `beauty`;
- extend profile enum to `appointments`;
- add Care module and entitlement configuration without embedding customer
  entitlements or sensitive data as CMS defaults;
- include transferred Care styles and runtime modules;
- preserve existing parameter codes and PageContext authored overrides;
- keep `portal_default_mode` initial-default-only after user mode selection.

Public SEO CMS work must be a separate block/template/schema and export. It
owns metadata/content slots and public document output; it must not reuse the
authenticated portal root as its only entry.

The manual-upload form of that public document is generated by
`scripts/export-seo-public-manual.mjs`. It is an intentionally atomic JTE root
artifact: canonical metadata, visible FAQ, and FAQ JSON-LD derive from one
validated authored input. The source remains componentized; hand-editing the
generated HTML is not a supported authoring path.

## Closed Runtime Regression Baseline

The wave-9 implementation must preserve:

- all existing 15 runtime routes and auth/unknown/disabled/detail guards;
- `onDemand` HVAC month-calendar, commerce, and booking behavior;
- `stormOps` for Snow/Lawn/Pool/Roofing/Pest: StormHome, StormCalendar,
  vertical-derived weather copy, weather/access/service-extra commands, and no
  Snow strings hardcoded into shared behavior;
- configuration-driven `data-theme` propagation and user light/dark choice
  surviving render/route/module refresh;
- normalized fixture loading and explicit module loading/error state;
- pricing/products fixture behavior plus the proven Core PIM live adapter,
  organization/product-type/currency inputs, and adapter checks;
- honest fixture state transitions and explicit unavailable command errors;
- current authenticated portal CMS block/root template, deterministic export,
  and generated portal preview.

Do not preserve an implementation defect as compatibility. In particular,
unsupported non-PIM live modules must not silently use fixtures and be reported
as live success.

## S0 Design-To-Runtime Gap Baseline

At the start of wave 9, the accepted design has 17 routes, eight themes, three
profiles, 138 manifest components, and 81 manifest actions. The current runtime
has 15 routes, six themes, two profiles, 84 components, and 68 actions.

| area | current runtime | accepted wave-9 delta |
| --- | --- | --- |
| Routes | 15 | Add/account for `care` and `seo.landing`; reconcile parameterized detail path semantics |
| Themes | HVAC, Snow, Lawn, Pool, Roofing, Pest | Add Health and Beauty tokens/config |
| Profiles | `onDemand`, `stormOps` | Add `appointments`; add Care navigation to all profile contracts |
| Modules/components | Existing portal set; 84 component ids | Add normalized Care module/eight hubs and reusable SEO sections; 54 component ids absent |
| States | Existing route/entity grammar | Add Care route/entitlement/component states and SEO section/CTA states |
| Actions | 68 manifest actions | Add seven Care and six SEO actions with truthful dispositions |
| Fixtures | Existing six-theme portal fixtures | Add `careModules`; Health/Beauty fixtures; separate SEO CMS-shaped fixture module |
| Styles | Six runtime stylesheets | Transfer Health/Beauty tokens and Care routes/responsive rules; add production SEO stylesheet; exclude preview toolbar CSS |
| CMS | One portal block/root, six-theme/two-profile enums | Extend portal config and add separate public SEO schema/template with metadata/content/FAQ contract |
| Export | One authenticated portal preview | Preserve portal export and add independent deterministic public SEO export/preview |

The detailed, exact S0 gap inventory and validation record lives in
`docs/stream-tasks/customer-portal-wave9-runtime-program/evidence/S0.md`.

## Validation Contract

Every later stage must keep the design source unchanged, validate JSON and JS,
and compare runtime behavior against the executable accepted source. Final
proof covers 390, 768, 1180, and 1440 widths, all eight Care hubs, representative
states, public SEO content/metadata, all profile matrices, existing route and
PIM checks, dual exports, and browser console health.

Functional fixture/state validation is exhaustive even where visual comparison
uses representative captures. S7 must execute and record:

- every accepted route under every profile where it is enabled;
- direct access for every route/profile combination where the module is
  disabled, plus unauthenticated private-route access;
- every applicable route/module `ready`, `loading`, `empty`, `error`, and
  explicit `fallback` state;
- every applicable permission denial and Care entitlement/access decision;
- every mutating command's pending state, duplicate-submit policy, failed
  mutation/error/retry behavior, and authoritative or inspectable success
  readback;
- fixture and live-PIM normalized-shape regression for Orders, Proposals,
  Pricing, and Products.

Representative route/state smoke is not sufficient for S7 completion. A matrix
row may be marked not applicable only with the reason recorded; missing coverage
is a blocking validation finding.

Unknown endpoints, security contracts, or CMS upload remain explicit
residuals/`not_opened`; they are never filled with fallback/mock success.
