# Aircove Customer Portal — Modular Design Source

**Componentized, executable design source** for the Aircove field-service customer portal —
the same design as `aircove-portal-design/`, split from one monolithic `app.js` (2282 lines, one IIFE)
and one `styles.css` (1078 lines) into a **modular, no-build, native-ES-module** tree.

Purpose: let the Codex team transfer the design **1:1** and wire it to real business logic, component by
component, without reverse-engineering a single giant file.

- **Claude Design** owns: visual UX, layout, responsive behavior, reusable components, visual states, fixture-driven interactions.
- **Codex** owns: business logic, real data adapters, Core API, auth/session, permissions, validation, commands, persistence, error handling.

> This is a **design source / presentation runtime — NOT a production app.** There is no business logic:
> no API calls, no real pricing/auth/persistence. Every component is a plain factory function + an inline
> CSS block, so each maps 1:1 to a React component later. The monolith in `aircove-portal-design/` remains
> the untouched fallback and the behavioral/visual reference for parity.

---

## How to run

**Must be served over HTTP.** Native ES modules (`import` / `export`) are blocked on the `file://`
protocol, so double-clicking `source.html` will not work — open it through the running preview / any
static HTTP server. There is **no build step**: "no build" here means *many small files loaded natively*,
not a bundler.

```
# any static server works, e.g.
npx serve customer-portal-design
# then open http://localhost:3000/source.html
```

`source.html` links the 6 stylesheets, then loads `src/app.js` as `<script type="module">`, which builds
the `AppShell` into `#app`.

A **dev toolbar** (bottom, `data-dev-toolbar`) flips route / theme / UI-state / light-dark / viewport for
review. It is **preview-only** — Codex strips any element carrying `data-dev-toolbar`.

---

## Module tree

```
customer-portal-design/
  source.html                 entry — 6 <link> stylesheets + <script type="module" src="src/app.js">
  styles/
    tokens.css                design tokens: fonts, neutral + 6 vertical themes + dark-mode vars
    base.css                  reset, base type, links, @keyframes
    shell.css                 app-shell, page layout, top-nav (+ mobile-nav popover)
    components.css            buttons, badges, tabs, cards, panels, states, toast, drawer, dev harness
    routes.css                route/module-specific layouts (orders → auth)
    responsive.css            container-width overrides (.vw-mobile / .vw-tablet / .vw-compact)
  src/
    dom.js                    h(), clear(), svgPath()
    state.js                  state object + pure selectors (currentOrder, money, cartCount, findProduct,
                              activeProfile, isPublic, currentSite, computeSite, buildCalendarGrid,
                              filteredOrders, tabItems)
    actions.js                ACTIONS map + all mutations/transitions + bindActions (one delegated listener)
    router.js                 renderRoute() switch + ComingSoon
    app.js                    entry: render, positionNavPill, applyResponsive, DevToolbar, BookingDrawer,
                              boot (DOMContentLoaded), window.AircovePortal
    components/
      shell/                  AppShell, TopNav, PublicNav, PageHeader
      primitives/             ActionButton, StatusBadge, Tabs, Toggle, EmptyState, ErrorState, LoadingState
      orders/                 OrderCard, MembershipCard, TrackingCard, WeatherCard, Timeline
      commerce/               ServiceCard, PricingCard, ProductCard, CartRow, AddressCard, PaymentMethodCard
      proposals/              ProposalBanner, ProposalCard, ProposalComparison
      storm/                  StormHome, StormCalendar
      profile/                StatCard
    routes/                   *Page.js page-level renderers (export names kept ORIGINAL — see deviations)
  data/
    fixtures.js               mock data — IIFE still sets window.AircoveFixtures, plus `export const F`
    scenarios.json            coverage map: routes × states × themes × flags × viewports
  manifest.json               machine-readable index of components / actions / bindings / attributes
  README.md                   this file
  previews/                   desktop-1440 / tablet-768 / mobile-390 PNGs (dev toolbar hidden)
  HANDOFF.md                  the wave plan this split was executed against
```

The split was mechanical: each top-level `function`/`var` from the monolith `app.js` became one exported
symbol, grouped into the files above; `styles.css` was cut along its section-banner comments. **No visual
or contract change** — a non-whitespace character diff of the 6 CSS files against the monolith `styles.css`
is exactly zero.

---

## Integration contract (stable attributes)

Every data-driven / interactive element carries stable hooks — **identical to the monolith**:

| attribute | meaning |
|---|---|
| `data-route` | page / view id (matches `scenarios.routes[].id`) |
| `data-module` | reusable component id (matches `manifest.components[].id`) |
| `data-bind` | fixture field(s) the value came from |
| `data-action` | user command name (matches `manifest.actions[]`) |
| `data-state` | UI state on the element (`ready` / `loading` / `empty` / `error` / `pending-action` / `drawer-open` / `mobile-navigation-open` / `active`) |
| `data-visual-id` | stable id for screenshot parity / visual transfer |
| `data-dev-toolbar` | **preview-only** harness — strip on integration |

### Actions are callbacks-out only
`actions.js` centralizes every user command in one `ACTIONS` registry, invoked through **one delegated
click listener** (`bindActions`) that reads `data-action` + `data-id`. The bodies are **demo only** (fake
nav, local state, toast). Codex replaces each body with a real command/adapter — the markup contract does
not change.

### Theming is declarative
Colors are never hardcoded in components. The whole palette derives from CSS custom properties in
`styles/tokens.css`, selected by two attributes on `<html>`:

```html
<html data-theme="hvac|snow|lawn|pool|roofing|pest" data-mode="light|dark">
```

`app.js` only flips these two attributes; `ui.toggleMode` drives dark mode. **`data-theme` (the vertical)
is config-driven** — set once from deployment config, not a user control. The dev toolbar can still switch
it for preview.

### Portal profiles (config-driven per vertical)

The portal reshapes by **profile**, chosen from the vertical (`fixtures.profileFor`):

- **`onDemand`** (HVAC): booking-first. Nav = Orders / Proposals / Services / Pricing / Products / Support;
  primary action **+ Book**; cart on; Calendar = month grid.
- **`stormOps`** (Snow Removal, Roofing, Pool & Spa, Lawn & Garden, Pest Control): weather-triggered seasonal
  service. Nav = **Home / Calendar / Contracts / Services / Activity / Support**; primary action **Request
  service**; cart off; Calendar = **weather-operational agenda**. The **StormCalendar** derives service names
  and trigger copy from the active vertical, so one component serves all five weather-triggered verticals.

---

## Pages

| route id | path | status |
|---|---|---|
| `landing` | `/` | **done** |
| `auth.phone` | `/login` | **done** |
| `auth.code` | `/login/verify` | **done** |
| `orders.list` (dashboard/cabinet) | `/orders` | **done** |
| `order.detail` | `/orders/:id` | **done** |
| `calendar` | `/calendar` | **done** |
| `activity` | `/activity` | **done** |
| `services` | `/services` | **done** |
| `pricing` | `/pricing` | **done** |
| `products` | `/products` | **done** |
| `checkout` | `/checkout` | **done** |
| `proposals.list` | `/proposals` | **done** |
| `proposal.detail` | `/proposals/:id` | **done** |
| `profile` | `/profile` | **done** |
| `support` | `/support` | **done** |

Every `data-module` and `data-action` present in the source is indexed in `manifest.json`; every route in
`scenarios.json` is rendered by `router.js`.

---

## Deviations from the requested tree (intentional)

Noted so nothing looks "missing" during transfer:

- **Route-based auth.** Auth is two routes — `auth.phone` and `auth.code` — driven by `state.route` (the
  earlier `state.authStep` flag was removed). `router.js` renders `Auth()` for both; `Auth()` picks the
  phone vs. OTP step from the route; `isPublic()` treats both as public. `auth.sendCode` navigates
  phone → code, `auth.back` navigates code → phone. This matches `scenarios.json` (`auth.phone` / `auth.code`).
- **Export names kept ORIGINAL** even where the *file* is named by role: `routes/OrdersPage.js` exports
  `Cabinet`, `OrderDetailPage.js` exports `OrderDetail`, `ProposalsPage.js` exports `ProposalsList`, etc.
  Zero renames = zero broken references.
- **No standalone file for markup-only pieces.** Components that exist in the monolith only as inline markup
  inside a page/component function (no standalone factory) were co-located rather than turned into empty
  files: checkout summary → `CheckoutPage.js`; chat thread/composer → `SupportPage.js`; storm sub-pieces →
  `StormHome.js` / `StormCalendar.js`; profile hero/prefs → `ProfilePage.js`; auth card → `AuthPage.js`;
  invoice / status-banner / technician-card / location-card → `OrderDetailPage.js`. Their `data-module` ids
  still exist in the DOM and in `manifest.json` (as `"inline in X"` factories).
- **`toast`** lives in `actions.js` (an imperative state + render call, not a component).
- **`svgPath`** lives in `dom.js` (generic SVG helper shared by tracking maps).
- **Over-import is intentional and harmless** in ESM: the auto-generated `import` lines err on the side of
  importing a symbol that a file may not use, rather than missing one.

---

## Feature flags

`showProducts`, `showProposals`, `showMemberships`, `weatherTriggers`, `darkMode` — see `scenarios.json`.

## Viewports checked

`1440`, `1180`, `768`, `390` — responsive is container-width driven via `.vw-mobile` / `.vw-tablet` /
`.vw-compact` classes set by a `ResizeObserver` in `app.js` (`applyResponsive`); Codex may convert to `@media`.

## Mock / fixture data

**All data is mock** and lives in `data/fixtures.js` (`window.AircoveFixtures`, re-exported as `F`). Nothing
here computes real prices, checks permissions, or calls an API. `ordersFor(theme)` builds fixture visit rows;
`themes` holds per-vertical copy, services, products and proposal content.

## Known dependencies & issues (non-blocking)

- **Google Fonts "Manrope"** — loaded via `<link>` in `source.html`, used **only for design preview**.
  `styles/tokens.css` declares a local-first fallback (`@font-face ManropeFallback { src: local("Manrope") }`)
  and the font stack ends in `system-ui`, so the layout holds if the CDN is blocked. For offline / CI
  transfer, add local Manrope `woff2` files and swap the `<link>` for an `@font-face`.
- **`/favicon.ico` 404** — silenced with an inline `<link rel="icon" href="data:,">`; a design source needs
  no favicon.
- **Responsive is container-width driven** (`ResizeObserver` → `.vw-*` classes), not `@media`. Intentional for
  the preview harness; Codex may convert to `@media` on integration.
