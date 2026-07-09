# Customer Portal Architecture

Status: draft architecture contract for design wave-6.
Last updated: 2026-07-09.

This document defines the production architecture contract for the customer
portal template. The design source in `design-inbox/` is the visual baseline;
the implementation runtime owns routing, business logic, data adapters,
permissions, and CMS integration.

## Success Metric

The portal succeeds when a Claude Design update can be transferred 1:1 into the
implementation while preserving:

- visual parity with the accepted design previews;
- stable `data-*` hooks, route ids, module ids, and action ids;
- stable `data-visual-id` hooks for screenshot parity and visual transfer;
- CMS-compatible template packaging;
- vertical-specific themes, profiles, routes, and feature sets;
- dynamic data from Core APIs with honest loading, empty, error, and fallback
  states.

The production baseline is custom JavaScript with native ES modules. React is
not part of this template architecture. A router is required, implemented inside
the custom runtime. The baseline follows the proven lab-ui pricing pattern:
plain DOM/ES modules, root configuration through `data-*`, module adapters,
offline fixtures, and CMS fallback.

## Source Ownership

`design-inbox/` is immutable input from Claude Design.
It is the ingested repository path for the delivered `customer-portal-design/`
package; internal design docs may still refer to that original package name.

Claude Design owns:

- visual UX, layout, spacing, responsive behavior;
- reusable visual components;
- theme tokens and vertical visual treatments;
- fixture-driven visual states;
- stable visual hooks: `data-route`, `data-module`, `data-action`,
  `data-bind`, `data-state`, `data-visual-id`.

Codex owns:

- router and route guards;
- business modules and command registry;
- Core API adapters and data normalization;
- auth/session behavior;
- permissions and allowed actions;
- persistence, validation, errors, retries, pending states;
- CMS params, export scripts, preview harnesses, and upload-safe artifacts.

Design files should never contain real API calls, secrets, permissions, or
production business decisions.

## Baseline Pattern

Use the existing dynamic pricing architecture as the baseline:

- a shared runtime parses root/section `data-*` config;
- runtime loads fixtures or Core API data;
- adapters normalize raw API payloads into stable UI shapes;
- blocks render static fallback when dynamic mode is disabled or fails;
- dynamic state is explicit on DOM roots;
- CMS parameters feed `data-*` attributes and fallback copy;
- PageContext values remain authored overrides only.

Locked runtime decision:

- no React baseline;
- no bundler requirement;
- custom JavaScript and native ES modules are the implementation target;
- future framework adoption requires a concrete failing in the custom runtime,
  not preference or router convenience.

PageContext is the lab-ui CMS page override mechanism. Template defaults live
on `BlockTemplate.parameters`; PageContext values are page-specific authored
overrides that migrate by stable parameter code.

For the portal, this becomes:

```text
customer-portal/
  design-inbox/             # immutable Claude Design handoff
  runtime/                  # production transfer target
    source.html             # local preview entry
    styles/
    src/
      portal-runtime.js
      router.js
      actions.js
      state.js
      config.js
      modules/
      adapters/
      normalizers/
      components/
      routes/
    data/
      fixtures/
      scenarios.json
    manifest.json
  cms/
    block.json
    export scripts / generated artifacts
```

The exact folder names can change during implementation, but the responsibility
boundaries should stay intact.

Adapter and normalizer boundaries:

- adapters perform IO: fetch fixtures, call Core APIs, submit commands;
- normalizers convert raw adapter payloads into stable UI shapes;
- modules orchestrate adapter calls, normalization, commands, and route state.
  If a module exposes `module.normalize(raw, context)`, it should delegate to
  that module's normalizer rather than becoming a second home for shape logic.

## Root Template Contract

The portal root owns shared shell concerns only:

- app shell container;
- route outlet;
- global navigation placement;
- modal/drawer/toast layers;
- shared CSS tokens and base utilities;
- shared runtime script loading;
- root CMS params and `data-portal-*` configuration.

Do not place page-specific business copy or one-off page sections directly in
the root. Reusable page bodies belong to route/content modules.

Example root contract:

```html
<section
  data-block="customer.portal"
  data-portal-api-base="{{portal_api_base}}"
  data-portal-organization="{{portal_organization}}"
  data-portal-vertical="{{portal_vertical}}"
  data-portal-profile="{{portal_profile}}"
  data-portal-theme="{{portal_theme}}"
  data-portal-default-mode="{{portal_default_mode}}"
  data-portal-router-mode="{{portal_router_mode}}"
  data-portal-default-route="{{portal_default_route}}"
  data-portal-enabled-modules="{{portal_enabled_modules}}"
  data-portal-auth-mode="{{portal_auth_mode}}"
  data-portal-error-mode="{{portal_error_mode}}"
>
  <div data-portal-root></div>
</section>
```

CMS should expose config as explicit parameters, not hidden JavaScript edits.

The runtime must propagate section-level CMS config to the attributes used by
the delivered design CSS:

```js
document.documentElement.dataset.theme = config.theme;
document.documentElement.dataset.mode = config.mode;
```

`config.mode` is an initial/default value only. After a user changes light/dark
mode, re-render or re-hydration must not overwrite the user's current choice.

If the portal is embedded into a CMS page that cannot safely mutate `<html>`,
the implementation must scope equivalent CSS variables under the portal root
and document that divergence before transfer.

## Vertical Themes And Profiles

Vertical is the top-level product configuration axis:

```text
vertical -> theme -> profile -> enabled modules -> enabled routes/actions
```

Themes are visual token sets. Profiles are UX/business behavior sets.

Known design themes:

- `hvac`
- `snow`
- `lawn`
- `pool`
- `roofing`
- `pest`

Theme rules:

- `data-theme` is deployment/profile config, not an end-user picker.
- `data-mode` defaults from `portal_default_mode` and may remain
  user-controlled if light/dark is retained.
- Components must consume CSS custom properties, not hardcoded vertical colors.
- A vertical can change copy, navigation, primary CTA, calendar type, commerce
  availability, and dynamic module behavior.

Example profile map:

```js
export const verticalProfiles = {
  hvac: {
    theme: "hvac",
    profile: "onDemand",
    modules: ["orders", "proposals", "services", "pricing", "products", "checkout", "support"],
    defaultRoute: "orders.list",
  },
  snow: {
    theme: "snow",
    profile: "stormOps",
    modules: ["orders", "calendar", "proposals", "services", "activity", "support"],
    defaultRoute: "orders.list",
  },
};
```

Profiles should be data, not scattered `if (theme === "...")` checks.

## Module Model

The portal is a modular runtime, not a fixed page bundle. A module owns its
data source, normalized shape, page fragments, allowed commands, and states.

Initial modules:

```text
auth         sign-in, OTP, session resume
shell        nav, mobile nav, profile switcher, route outlet
orders       service orders, visits, tracking, invoices, weather confirmations
proposals    proposals, contracts, quotes, plan selection, approval/revision
services     service catalog, request flow, service issue reporting
pricing      Core PIM pricing plans, memberships, add-ons
products     Core PIM products, cart eligibility
checkout     cart, address, payment, order placement
calendar     month calendar or storm/weather operational agenda
activity     notifications, timeline, unread state
profile      addresses, payment methods, preferences, memberships
support      messages, tickets, quick replies
```

Each module should provide:

```text
module.id
module.requires
module.routes
module.load(context)
module.normalize(raw, context)
module.commands
module.emptyState
module.errorState
```

Modules can be enabled/disabled by vertical profile. Disabled modules must not
appear in navigation and must guard direct route access.

## Router Contract

Routes are registered, not hardcoded in a large switch.
Route ids preserve the delivered design grammar. Some ids are dotted
module/action names such as `orders.list`; some legacy/top-level ids are flat,
such as `pricing` and `support`. Do not rename ids for consistency without a
manifest and scenario migration.

```js
export const routes = {
  "orders.list": {
    path: "/orders",
    module: "orders",
    component: OrdersPage,
    requires: ["orders"],
    auth: true,
  },
  "proposals.list": {
    path: "/proposals",
    module: "proposals",
    component: ProposalsPage,
    requires: ["proposals"],
    auth: true,
  },
  "pricing": {
    path: "/pricing",
    module: "pricing",
    component: PricingPage,
    requires: ["pricing"],
    auth: true,
  },
};
```

Router mode is configurable:

- `hash`: safest CMS default, single PageContext route, no backend fallback
  required;
- `history`: allowed only when CMS/backend can serve the portal shell for every
  portal path;
- `memory`: preview/testing mode.

Direct navigation to disabled or unauthorized routes should resolve to a clear
fallback route, not a blank screen.

Baseline guard contract:

- `auth.phone`, `auth.code`, and `landing` are public routes.
- All other accepted portal routes are private unless a module descriptor marks
  them public.
- Fixture mode starts with an authenticated demo session for private-route
  smoke tests and can force an unauthenticated session for guard tests.
- Unauthenticated access to a private route redirects to `auth.phone` while
  preserving the intended route for post-auth navigation.
- Disabled-module route access resolves to the configured `portal_default_route`
  or a module-disabled state, never a blank route.

## Dynamic Data Contracts

UI components must not consume raw Core payloads. Every dynamic module gets a
normalizer.

Order shape:

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

Proposal shape:

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

Pricing/product shape:

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

A route should be able to render from fixtures, fallback CMS copy, or live data
without changing component markup.

## Actions And Commands

The design action ids are the public command contract. Implementation replaces
demo bodies with real commands.

Action handling rules:

- one delegated action binding is preferred;
- actions read `data-action` and optional `data-id`;
- actions preserve `data-requires-confirmation`; mutating commands with that
  attribute must require user confirmation before submission;
- command handlers validate module availability, auth, permissions, and current
  entity state;
- pending actions are scoped by action/entity, not global page blocking;
- every mutating command has success, error, and retry behavior;
- commands must not invent successful outcomes when the backend rejects them.

Examples:

```text
proposal.approve
proposal.requestRevision
weather.confirm
order.cancel
checkout.placeOrder
profile.setDefaultPayment
support.sendMessage
```

## State Grammar

Use explicit DOM state attributes for testability. Keep global UI states,
domain/entity states, and implementation-added runtime states distinct so
validators do not reject accepted design statuses.

Global UI states already emitted by the delivered design source:

```text
ready
loading
empty
error
pending-action
drawer-open
mobile-navigation-open
active
validation-error
success-toast
```

Accepted domain/entity states from scenarios:

```text
scheduled
inProgress
completed
cancelled
unseen
viewed
approved
revision
declined
```

Implementation-added states outside the visual parity contract:

```text
fallback
disabled
unauthorized
```

These added states are allowed because Codex owns runtime behavior, but they
must receive explicit visual treatment and scenario coverage before they are
used in production UI.

The state belongs at the narrowest useful scope:

- route state on `[data-route]`;
- module state on `[data-module]`;
- entity/action state on the affected card/button/row.

## CMS Parameter Contract

CMS params configure the portal and provide fallback/editor copy. They should
not duplicate live business data.

Root-level params:

```text
portal_api_base
portal_organization
portal_vertical
portal_profile
portal_theme
portal_default_mode
portal_router_mode
portal_default_route
portal_enabled_modules
portal_auth_mode
portal_error_mode
```

Author-editable copy should use normal localized fields. Prefer enum params for
bounded options such as theme/profile/router mode. Avoid large JSON params for
labels that editors need to manage independently.

Keep parameter codes stable between revisions. PageContext values are authored
overrides only and must migrate by stable parameter code, matching the lab-ui
CMS contract.

## Fallback And Fixtures

Every dynamic module needs three concrete modes:

```text
fixture    local/offline development and visual QA
dynamic    live Core API data
fallback   static CMS/default content when dynamic data is disabled or fails
```

Fallback is not a hidden success state. If live data fails, mark the module or
route with `data-state="fallback"` or `data-state="error"` and preserve a useful
editor/customer view.

Fixtures must cover:

- every route;
- every vertical profile;
- loading, empty, error, fallback, ready;
- disabled module route access;
- permission-denied actions;
- pending and failed mutations.

## Design Transfer Rules

When Claude Design updates `design-inbox/`:

1. Verify the design package boots over HTTP.
2. Run syntax checks on all JS modules.
3. Validate `manifest.json` against actual `data-module` and `data-action`
   usage.
4. Validate `scenarios.json` route/action coverage.
5. Compare screenshots against accepted previews and, when available, the
   original design runtime/baseline. The three checked-in preview PNGs are smoke
   coverage only; they do not cover every route by every vertical.
6. Transfer visual markup/styles component-by-component into `runtime/`.
7. Preserve `data-visual-id`, `data-module`, `data-route`, `data-bind`,
   `data-action`, and `data-requires-confirmation` unless a contract migration
   is explicitly approved.
8. Strip preview-only elements carrying `data-dev-toolbar`.
9. Keep business adapters and command handlers intact unless a contract change
   explicitly requires an update.

Contract changes must be documented here and in the design handoff.

## Failure Modes To Guard

- A design update renames actions or routes and silently breaks commands.
- A vertical disables a module but the route remains reachable.
- A component reads raw API shape and breaks when Core changes payload details.
- Theme logic leaks into business modules through hardcoded vertical checks.
- CMS params duplicate dynamic business data and become stale.
- Live API failure looks like valid empty data.
- PageContext overrides are lost because parameter codes were renamed.
- Router uses history mode before CMS/backend supports portal path fallback.
- Pending mutations block the whole portal instead of the affected entity.

## Initial Implementation Plan

1. Create the production runtime folder from the accepted design source.
2. Add config/profile/theme registry.
3. Replace route switch with route registry and guards.
4. Introduce `PortalRuntime` with fixture adapter first.
5. Add module adapters in this order:
   - auth/session;
   - orders;
   - proposals;
   - pricing/products;
   - profile/payment/address;
   - support/activity.
6. Add CMS block metadata and export path after the runtime contract is stable.
7. Add visual parity and scenario checks before any upload work.

## Open Decisions

- Final router mode for deployed CMS pages: `hash` by default unless backend
  confirms history fallback.
- Exact Core API endpoints for orders, proposals, profile, support, and
  checkout.
- Server-side auth/session/token mode. The delivered design already establishes
  `auth.phone` and `auth.code` as public pre-auth routes.
- Which modules are mandatory for first customer-facing release.
