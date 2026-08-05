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
  core-auth-login.html        STATIC entry (wave 18) — core-auth CMS login page, no script, no modules
  core-auth-2fa.html          STATIC entry (wave 19) — core-auth CMS 2FA page, NO script tag at all
  core-auth-2fa-preview.html  GENERATED evidence harness for wave 19 — reviewed, never transferred
  styles/
    tokens.css                design tokens: fonts, neutral + 6 vertical themes + dark-mode vars
    base.css                  reset, base type, links, @keyframes
    shell.css                 app-shell, page layout, top-nav (+ mobile-nav popover)
    components.css            buttons, badges, tabs, cards, panels, states, toast, drawer, dev harness
    routes.css                route/module-specific layouts (orders → auth)
    responsive.css            container-width overrides (.vw-mobile / .vw-tablet / .vw-compact)
    core-auth-login.css       wave 18 — core-auth login page only (message regions + standalone page);
                              wave 19 re-uses it as the SHARED standalone-auth layer
    core-auth-2fa.css         wave 19 — core-auth 2FA page only (setup panel, QR frame, key, notice, code)
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
      care/                   shared (careChip, DocRow), EquipmentHub, SeasonLog, LawnProgram, WaterQuality, RoofReport, PestMonitoring
      profile/                StatCard
    routes/                   *Page.js page-level renderers (export names kept ORIGINAL — see deviations)
  data/
    fixtures.js               mock data — IIFE still sets window.AircoveFixtures, plus `export const F`
    scenarios.json            coverage map: routes × states × themes × flags × viewports
  manifest.json               machine-readable index of components / actions / bindings / attributes
  README.md                   this file
  previews/                   desktop-1440 / tablet-768 / mobile-390 PNGs (dev toolbar hidden)
                              + wave-7 care-hub captures: care-{hvac-equipment,snow-season-log,pest-monitoring}-{768,390}.png
                              and reference screens care-{lawn-program,pool-water,roofing-report}-ref-390.png;
                              wave-9 captures: care-{health-plan,beauty-routine}-{768,390}.png and
                              seo-{health,beauty}-{768,390}.png (public landing).
                              NOTE: the automated capture pane in this workspace is 908px wide — faithful
                              1440 desktop captures could not be produced here (wide shots render with
                              clipping artifacts in the capture pipeline; the live page is correct — open
                              source.html and set vw=1440 in the dev toolbar in a ≥1440 browser window
                              to regenerate desktop previews).
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
<html data-theme="hvac|snow|lawn|pool|roofing|pest|health|beauty" data-mode="light|dark">
```

`app.js` only flips these two attributes; `ui.toggleMode` drives dark mode. **`data-theme` (the vertical)
is config-driven** — set once from deployment config, not a user control. The dev toolbar can still switch
it for preview.

### Portal profiles (config-driven per vertical)

The portal reshapes by **profile**. Non-Beauty verticals map via `fixtures.profileFor`; Beauty (Calm Harbor) resolves from the capability config (`state.capability` → `spaStaging` | `spaTarget`) and is intentionally absent from `profileFor` (wave 14.1):

- **`onDemand`** (HVAC): booking-first. Nav = Orders / **Equipment** / Proposals / Services / Pricing / Products / Support;
  primary action **+ Book**; cart on; Calendar = month grid.
- **`stormOps`** (Snow Removal, Roofing, Pool & Spa, Lawn & Garden, Pest Control): weather-triggered seasonal
  service. Nav = **Home / Calendar / ‹care hub› / Contracts / Services / Activity / Support**; primary action **Request
  service**; cart off; Calendar = **weather-operational agenda**. The **StormCalendar** derives service names
  and trigger copy from the active vertical, so one component serves all five weather-triggered verticals.
- **`appointments`** (**Health only** — wave 9; Beauty moved to `spaStaging`/`spaTarget` in wave 14): booking-first, no weather triggers (`themes[x].wt = null`
  removes the Weather Trigger banner/panel and feed item everywhere). Nav = **Appointments / Calendar /
  ‹care hub› / Services / Pricing / Products / Support**; primary action **+ Book**; cart on; Calendar = month grid.

### Vertical care hub (wave 7 — config-driven per vertical)

One route — **`care`** — whose content is vertical-specific, chosen from `fixtures.careModules[theme]`
(the same mechanism as portal profiles). The nav label comes from the module (`navLabel`):

- **HVAC → Equipment**: unit picker + unit passport (model / serial / warranty / health), latest
  point-by-point diagnostic with per-check status and technician's note, reports & warranties vault.
- **Snow Removal → Season log**: storm-response compliance log (trigger, response time, SLA met/missed,
  materials used), season stats, SLA meter, downloadable slip-and-fall compliance reports.
- **Lawn & Garden → Program**: 5-step season program (done / next / planned), kids-&-pets re-entry card
  after treatments, soil snapshot, lawn progress photos.
- **Pool & Spa → Water**: readings vs. safe ranges with trend sparklines, dosing log (what was added and
  why), swim-ready status, testing cadence.
- **Roofing → Roof report**: drone-inspection findings by zone with severity, condition score, active
  repair project tracker, documents (report / warranty / insurance pack).
- **Pest Control → Monitoring**: bait-station & smart-sensor map + list with per-station status, sensor
  alert log, free re-treat request (plan guarantee).
- **Health → Care plan** (wave 9): upcoming appointment, care-plan milestones (logistics steps — intake /
  reviews / cadence, never outcomes), follow-up tasks, secure documents (metadata only — contents open in a
  secure viewer, access logged), provider/care-team card. **No clinical metrics, readings or results are
  ever rendered** — the hub is scheduling + documents by design, with an explicit not-a-medical-record note.
- **Beauty → My routine** (wave 9): next appointment + session package (with usage meter), preferred-specialist
  picker, treatment/routine history with saved formulas & notes, loyalty/membership card, routine products
  (reuses the cart contract).

New actions: `care.selectUnit`, `care.download`, `care.requestRetreat`; wave 9 adds `care.selectSpecialist`,
`care.completeTask`, `care.contactProvider`, `care.openSecureDoc`. New fixture: `careModules`.
All readings / scores / logs are display fixtures — Codex owns real telemetry, diagnostics and compliance data.
Stable entity ids across the wave-9 hubs: `appt-*` (appointments), `prov-*` / `spec-*` (providers/specialists),
`plan-*` / `pkg-*` (plans/packages), `task-*` (tasks), `doc-*` (documents).

### Public SEO landing (wave 8 — one section set, all verticals)

Route **`seo.landing`** (direct-preview entry: `seo-landing.html`) is a public, CMS-driven landing built
from **reusable sections** in `src/components/seo/SeoSections.js` — NOT separate pages per vertical. Content comes
from `data/seo-fixtures.js` keyed by vertical (wave 9 adds **Health** — logistics-only copy, no clinical claims —
and **Beauty**); theming from `data-theme` as everywhere else. Styles live in
`styles/seo.css` (7th stylesheet).

Sections (stable `data-module` ids): `seo-hero` (service + `{locality}` geography merge slot + seasonal-offer
CMS slot + primary/secondary CTA), `seo-trust-strip` (rating / licence / insurance / guarantee / response —
**CMS data slots only**: null values render an explicit `from CMS` chip, never an invented fact),
`seo-services-grid` (3–6 benefit-first cards → booking/quote flow), `seo-how-it-works` (request →
scheduling/dispatch → service → report/payment), `seo-proof` (vertical-specific: HVAC equipment/maintenance/
emergency · Snow trigger/SLA/compliance · Lawn programme/re-entry · Pool readings/swim-ready · Roofing
inspection/report/project · Pest monitoring/guarantee), `seo-pricing` (“from” prices via CMS only; `from:null`
= needs-assessment variant), `seo-service-area` (city/region chips + abstract coverage rings — no fake
addresses; real map is a CMS media slot), `seo-reviews` (media slots for real photos; honest fallback when the
collection is empty), `seo-faq` (accordion with schema.org FAQPage microdata — FAQ-schema ready),
`seo-final-cta`, `seo-footer` (contacts/hours/areas/legal — contact values are nullable slots).

**CTA contract** — fixed action ids `seo.cta.book` / `seo.cta.quote` (primary; destination =
`cms.meta.primaryCta.destination`), `seo.cta.call`, `seo.cta.services`, `seo.service.select`, `seo.faq.toggle`.
Every CTA renders `data-state = idle | pending | success | error` (demo lifecycle; preview any state via the
dev-toolbar **cta** select). Codex replaces demo bodies with real booking/quote/call commands — markup contract
unchanged.

**Dynamic-data states** (`loading` / `empty`, driven by the dev-toolbar *state* select) exist **only** where
data is CMS-dynamic: trust strip, pricing, service area, reviews, FAQ and the hero seasonal offer. Hero copy,
how-it-works, proof and footer are static content.

**Head-level CMS fields** (SEO title, meta description, H1, canonical path, locality/service area, FAQ
collection, review/media collection, primary CTA destination) are defined per vertical in
`data/seo-fixtures.js`; the ones with no visible place on the page are surfaced by the dev-only
`seo-meta-preview` block (`data-dev-toolbar` — stripped on integration).

---

## Pages

| route id | path | status |
|---|---|---|
| `landing` | `/` | **done** |
| `seo.landing` (public SEO landing, all 8 verticals) | `cms.meta.canonicalPath` | **done** |
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
| `care` (vertical hub) | `/care` | **done** |

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


## Wave 10 — Core OIDC login (route `auth.oidc`, path `/login`)
- **Module `core-oidc-auth`** (`src/routes/AuthOidcPage.js`), reuses the accepted `auth-grid`/`auth-card`
  composition + button primitives. Fixture phone, OTP, resend and Apple controls are not part of the route.
- **States** (`data-state` on the card): `checking-session | ready-signed-out | redirecting | unavailable | ready-signed-in | signing-out`.
  `checking-session` = initial bootstrap on every page load (incl. the return from `/core/oauth2-callback.html`):
  Core discovery + session restore from browser storage — non-interactive, claims no redirect, shows no
  sign-in controls and no session name; Codex resolves it to signed-out / signed-in / unavailable.
  `unavailable` = Core discovery / authorization-library init failure — retry only, no fallback login method.
- **Actions**: `auth.oidcSignIn` (starts the authorization-code+PKCE redirect), `auth.retrySession`,
  `auth.signOut` (Core logout). Demo bodies only — Codex owns the real commands.
- **Data**: dynamic values are session status + ONE customer-safe display name,
  `data-bind="session.displayName"` (`state.sessionName`). No password/token/API-key/Account-id is rendered.
- **Contract changes**: `auth.gotoSignin` → `auth.oidc` (was `auth.phone`); `auth.signOut` body now drives the
  signing-out → signed-out demo cycle; `auth.phone`/`auth.code` are reference-only (kept for visual parity,
  reachable via dev toolbar). `isPublic()` includes `auth.oidc` — the public catalog nav stays before/after auth.
- **Preview**: dev-toolbar `oidc` select (visible on the route) forces any of the five states; clicking the
  primary runs the demo cycle signed-out → redirecting → signed-in.


## Wave 11 — Calm Harbor Spa public landing (Beauty vertical)

The Beauty `seo.landing` ships as the **Calm Harbor Spa** release. Same accepted section set and Beauty
theme — every addition is a per-vertical opt-in slot in `data/seo-fixtures.js`, so the other seven
verticals render unchanged.

**Data classes (this release):** public Core PIM (SPA_SERVICE treatments, SPA_MEMBERSHIP plans,
SPA_RETAIL products + displayed prices — demo values in `data/fixtures.js`) and explicit CMS content
slots. Nothing else is rendered.

**Honest navigation only.** Public CTA kinds `services|pricing|products|signin` map to:
`nav.services` / `nav.pricing` (scroll to the live sections — the pricing section carries
`id="seo-pricing"`), `nav.products` (opens the existing public Shop route), `auth.gotoSignin`
(existing sign-in route). These CTAs render **no pending/success lifecycle** and ignore the dev-toolbar
`cta` override. No `seo.cta.book`/`seo.cta.quote`, payment, checkout, booking command or
"request sent" state exists on this page; service cards route to pricing ("Pricing →") in this mode.

**`seo-products-teaser`** (module + visual id; between `seo-pricing` and `seo-service-area`):
- 3–4 `seo-product-teaser-card` cards from the repeated PIM collection `pim.products[]`; each card binds
  only public fields (code, name, short description, displayed price, optional image) and carries
  `data-product-code` (stable codes `rtl-beauty-01…06` added to `fixtures.js`).
- Reuses the accepted `product-card` visual language — no second catalog-card system, no Add/cart button.
- One action everywhere: `nav.products`. `productsTeaser.codes[]` is a CMS slot picking featured codes.
- States `ready | loading | empty` (global dev-toolbar state select); empty renders
  `seo-products-teaser-empty` — honest copy, CTA hidden, no invented products.

**Calm Harbor media direction:** hero + proof accept CMS media slots (`cms.media.hero` /
`cms.media.proof` — src, alt, focal). The `seo-media` slot renders the real image (cover + focal
point) and falls back to the striped spec slot while the file is missing. Drop accepted files at
`media/calm-harbor-{hero,proof}.jpg`; full desktop/tablet/mobile crops, focal points, alt
text and aspect ratios are in **MEDIA-SPEC.md**. No logos, text, prices or claims inside bitmaps.

Preview evidence: `previews/calm-harbor/` (ready + empty, light + dark, 1440/1180/768/390 — larger
widths are scaled-to-fit captures, same caveat as earlier waves).


## Wave 12 — Calm Harbor live PIM pricing contract (Beauty)

`seo-pricing` visual composition is unchanged; the Beauty vertical now supplies `pimPricing` in
`data/seo-fixtures.js`, which switches the ready state to the repeated live public PIM collection
`pim.pricing[]`: rows are `seo-pricing-row` (stable module/visual id, also on legacy CMS rows), bind
`code`/`name`/`displayPrice`/optional `interval`|`shortDescription`, and carry `data-product-code`.
SPA_SERVICE + SPA_MEMBERSHIP only — never SPA_RETAIL. `displayPrice` renders verbatim; presentation never
calculates, estimates, compares or transforms a price. `empty` truthfully reports that no treatments or
memberships are published (no quote/booking/fallback price); `loading` keeps the accepted skeleton. The
section CTA remains honest navigation (`auth.gotoSignin`). The public preview nav brand comes from
`cms.meta.brand` (“Calm Harbor Spa” on Beauty; “Aircove” fallback — same nav composition).
Evidence: `previews/calm-harbor/pricing-{state}-{width}-{mode}.png` — real viewport pixels: desktop 1440
(1440×900, upscaled from a scaled-to-fit capture) + mobile 390 (true 390×540), ready/loading/empty ×
light/dark. Media assets are delivered: `media/spa-massage-1448.webp` (hero) and
`media/spa-room-1600.webp` (proof) — see MEDIA-SPEC.md.


## Wave 13 — Authenticated live-data states (accounts, routes, commands)

Presentation for the phase that replaces fixtures with customer-scoped data behind the Core OIDC
session. **Presentation-only:** nothing here authorizes an API, permission, customer relation,
mutation or success result. Loading, empty, error, unauthorized, unavailable, and stale are distinct
states — none ever falls back to fixture success.

**Shared account bootstrap** (`src/components/shell/AccountBootstrap.js`, module `account-bootstrap`).
After Core sign-in the server must resolve the subject to exactly one active `SPA_CUSTOMER` Account
(Core `user/basic-info` → organization check → `Account.user`); the browser never chooses Account or
tenant. While `state.account != "ready"`, `render()` substitutes this module for EVERY private route
body — no private fixture entity renders — and `TopNav` renders **gated** (brand + light/dark only;
no nav links, cart count, badges or avatar, since those imply resolved capabilities/entities).
States (`data-state`, + `data-intended-route` = preserved route id):
- `resolving-customer` — non-interactive progress (aria-busy); exposes no ids/claims.
- `customer-unavailable` — honest retry (`ui.retry` `data-id="account-bootstrap"`) + `auth.signOut`.
- `customer-not-linked` / `customer-forbidden` — non-enumerating (no reason, role or claim);
  `support.email` + `auth.signOut` only.
- `session-expired` — intended route preserved in `state.route` and shown as a customer-safe label;
  `auth.oidcSignIn` re-enters secure sign-in and returns to it; stale data never shown as current.
Demo transitions only (`accountRetry`/`reauthDemo`) — Codex owns real resolution.

**Route lifecycle** — `data-state` on every private route root; shared primitives in
`src/components/primitives/RouteStates.js` (`UnauthorizedState` non-enumerating access-denied,
`NotFoundState` non-enumerating not-found, `ConflictBanner` stale-version refresh prompt,
`InlineFailure` command failure, `routeStateBody` gate, skeleton helpers mirroring each route's
layout). `ErrorState` now takes `retryId` — retry stays `ui.retry`, scoped by module/entity id.
Added states: calendar loading/error/unauthorized (gates both MonthCalendar and StormCalendar);
services empty/error/unauthorized; pricing loading/empty/error (live PIM rows — empty shows no
fallback or estimated price); products error; checkout loading/error/unauthorized; proposals.list
loading/error/unauthorized (+ its empty no longer renders the fixture proposal header);
proposal.detail loading/error/unauthorized/not-found/conflict; profile loading/error/unauthorized;
activity loading/error/unauthorized; support loading/empty/error/unauthorized. `orders.list`,
`order.detail` and `care` keep their accepted treatments (confirmed valid for customer-scope
failures; no separate visual system added).

**Command lifecycle** (`runCommand` in `actions.js`): `state.commands["<action>:<entityId>"]` =
`pending | failed | conflict`, stamped as `data-state` on the exact actionable entity — one pending
row/card never disables unrelated entities; duplicate submission is blocked while pending.
**`succeeded` is never stored: success renders only from the (demo) readback callback**, a fixture
stand-in for the authoritative entity the server returns. `session-lost` clears pending, suppresses
success, closes any drawer and opens the expired-session gate with the route preserved. Covered:
`booking.confirm:booking` (new `booking.close` closes the drawer without confirming — the scrim/✕
no longer fire `booking.confirm`), `order.cancel:<orderId>`, `proposal.decide:<siteId>` (approve/
revision/decline; version conflict blocks deciding until `ui.retry` reloads), `cart.addItem:<name>`,
`cart.mutate:<name>`, `checkout.placeOrder:cart` (failed = order NOT placed, cart intact; conflict =
server re-priced the cart, submit disabled until refreshed; **no local order-success state exists**),
`profile.saveContact:contact` (new `contact-details` panel: field validation → saving →
server-confirmed readback / save failure; values shown are the last confirmed ones),
`support.sendMessage:m<idx>` (sending → sent on readback / failed with per-message
`support.retryMessage`), `care.requestRetreat:<planId>`.

**Dev toolbar additions:** `account` select (private routes), `cmd` outcome select
(succeeded | failed | conflict | session-lost → `state.cmdForce`), `state` select extended with
`unauthorized | not-found | conflict`. All preview-only (`data-dev-toolbar`).

**New actions:** `booking.close`, `profile.saveContact`, `support.retryMessage`. Changed demo
bodies: `checkout.placeOrder`, `order.cancel`, `proposal.*` decisions, `cart.*`, `booking.confirm`,
`support.sendMessage`, `care.requestRetreat`, `ui.retry` (now id-scoped), `auth.oidcSignIn` (from the
expired-session gate it preserves the intended route). Markup contract otherwise unchanged.

**Privacy:** no Account id, tenant id, token, raw role, claim or internal mapping is ever rendered;
not-found/forbidden are non-enumerating; payment UI still shows only approved PSP references.

Evidence: `previews/wave13/*.png` — descriptive names `{scope}-{state}-{width}-{mode}.png` covering
account resolution/not-linked/forbidden/unavailable/session-expired (1440 + 390, light + dark),
proposals list loading/empty/error/unauthorized (768 light, 1440 dark), proposal detail
loading/not-found/conflict + decide pending/failed/succeeded (768), checkout pending/failed/
conflict-stale + cart-row pending (1180), profile validation/saving/save-failed (390 light,
768 dark), support empty/sending/send-failed (390/1180). Same capture-pane caveat as earlier waves:
wide widths are scaled-to-fit captures; the live page at true viewport width is authoritative
(html-to-image can also mis-wrap a centered state-block title in captures — the DOM does not overlap).


## Wave 14 — Calm Harbor Spa authenticated portal IA (Beauty)

The Beauty vertical now ships as the **Calm Harbor Spa authenticated portal** — the product IA from
`calm-harbor-spa-customer-portal-ia.md` implemented inside the accepted Beauty system (tokens, glass
surfaces, buttons, badges, state blocks and responsive conventions unchanged). Presentation only:
no API, auth, permission, adapter, mapping, persistence or command implementation was added.

### Capability config (the staging ↔ target hook)

One portal, two capability variants, selected by **deployment config** — in the preview,
`state.capability` via the dev-toolbar **spa** select; in the DOM,
`data-capability="current-staging|target-appointments"` + `data-booking="closed|open"` +
`data-portal-profile="spaStaging|spaTarget"` on `app-shell`, `top-nav` and the route roots.
Production activates modules from these hooks — no ambiguous labels.

- **current-staging** — only the proven read-only sources render: neutral `Orders` list, public PIM
  `Services & prices`, browse-only `Shop`, session/account gates. No `+ Book`, Calendar, My routine,
  cart, notification badge or editable profile. The only global CTA is honest navigation
  (**Browse services**).
- **target-appointments** — the capability-gated appointment-first IA. Its fixtures are **not
  selectable** by the current-staging profile. `+ Book` and reschedule / cancel / book-again exist
  only while `data-booking="open"`; closed shows an honest disabled treatment.

### IA / route migration map (stable ids preserved)

| Stable route id | Staging renders | Target renders | Nav label |
|---|---|---|---|
| `orders.list` | `SpaOrders` — read-only Core Order list | `SpaAppointments` — appointment-first default | Orders → Appointments |
| `services` / `pricing` | `SpaCatalog` — ONE "Services & prices" destination; in-section tab (accepted Tabs, `nav.go` carries the route id) | same | Services & prices |
| `products` | `SpaShop` — browse-only public PIM fields | same | Shop (secondary, muted, last) |
| `care` (My routine), `calendar`, `activity`, `proposals.*`, `checkout`, `profile` | **out of primary navigation** (dev-toolbar reachable reference only) | same | — |

Action ids are unchanged: `order.cancel` / `order.reschedule` / `order.bookAgain` /
`booking.open|confirm|close` carry the appointment commands on the target portal (entity id =
`data-appointment-id`). New action: `account.menu`. The wave-9 `appointments` profile now applies
to Health only.

### Truth rules demonstrated (failure-mode coverage)

1. Staging rows are **orders, never appointments**: no date/time, specialist, location, tracking,
   invoice, detail navigation or scheduling command exists on `spa-order-row`.
2. Raw `OPEN` is never translated — `status-badge--unmapped` renders the backend code verbatim
   (dashed, monospaced, text label) with a read-only footnote.
3. Fixture appointments can never appear during load/failure: the target route gates
   loading/error/unauthorized before any fixture renders, and staging cannot select target fixtures.
4. No active Book/Reschedule/Cancel in staging (absent) or closed target (disabled + honest note).
5. Public `SPA_MEMBERSHIP` rows are **Membership options** — never "My membership", enrollment or
   balance.
6. Shop has no Add-to-cart/inventory/checkout and carries a Browse-only chip + footnote.
7. At 390 the greeting, next-appointment hero and primary action precede all catalog content;
   Shop is last and muted.
8. At-home visits always show the explicit **At your place** chip + least-data location line.
9. `session-lost` during a command clears pending, suppresses success and opens the expired-session
   gate with the intended route preserved (wave-13 engine, reused).
10. Cancel success renders **only** from the authoritative (demo) readback — the hero flips to a
    confirmed "Cancelled" state; nothing is optimistic.

### Reused / changed / new

- **Reused unchanged:** app-shell, page-header, card/order-card visual language, status-badge,
  ActionButton (incl. pending), Tabs, Empty/Error/Loading + wave-13 RouteStates + command engine +
  booking drawer, AccountBootstrap composition, Beauty tokens + light/dark, rate-row/list-panel/
  log-row vocabulary from the accepted care hubs.
- **Changed:** TopNav delegates to SpaTopNav for Beauty; AccountBootstrap adds
  `customer-account-ambiguous` + `organization-forbidden`; `order.cancel` readback is
  appointment-aware on the spa target; AppShell exposes the capability hooks; dev toolbar gains
  spa/booking/appt/rows/name selects and the two new account states.
- **New (wave 14):** SpaTopNav + account-control/account-menu, SpaOrdersPage (spa-order-list/row,
  unmapped status treatment), SpaAppointmentsPage (next-appointment, visit-mode,
  appointment-list/row/empty, catalog-teaser), SpaCatalogPage (spa-catalog, spa-service-card,
  spa-pricing-row, membership-options), SpaShopPage (spa-shop-card), `spa` fixture block +
  spaStaging/spaTarget profiles.

### Evidence

`previews/wave14/` — naming `{scope}-{state}-{width}-{mode}.png`: staging orders ready/empty/error
(1440 + 390), target next-appointment ready/empty (1440 + 390), at-salon + at-your-place (390),
account bootstrap failure (390), mobile navigation open (390), cancel pending + failed (390),
services & prices ready/empty (1440 + 390), dark shell + next appointment (390). Same capture-pane
caveat as earlier waves: wide widths are scaled-to-fit captures; the live page at true viewport
width is authoritative.

### Unresolved product assumptions (recorded, not resolved by design)

1. The Calm Harbor operator has **not** confirmed the top three existing-customer tasks — the
   appointment-first default follows the IA's stated priority.
2. The customer-facing status mapping ("Confirmed", "Needs confirmation") is a backend-owned
   contract that does not exist yet — target fixtures mark it as a placeholder.
3. Whether the backend can distinguish appointment-like Orders from retail Orders is unproven;
   staging therefore shows both as neutral orders with type codes.
4. Hybrid (at-salon + at-home) service and the least-data address policy for home visits are
   inherited assumptions from the accepted landing.
5. Packages / membership / loyalty as separate concepts (`My plan`) stay out of this increment —
   no customer-scoped source.
6. Timezone policy for appointment times ("local time") needs a real policy decision.

States that could not be represented without inventing a backend fact: a live "Reschedule" picker
(needs availability), a real booked-confirmation, membership enrollment/balance, and any customer
status derived from `OPEN` — all deliberately absent or capability-gated.


## Wave 15 — Calm Harbor commercial lifecycle (Account, Purchases, My plan, sellable Shop, server cart, SIMULATED checkout)

Implements the design request "Calm Harbor spa purchases, simulated checkout, and account" on top of
the accepted Wave 14/14.1 shell — tokens, components, responsive conventions, stable hooks and the
appointment-first priority unchanged. Presentation only. **Payment is an explicit simulation:**
`paymentMode: "SIMULATED"` everywhere, no card fields / saved methods / PSP controls / redirects /
payment-success treatment; a confirmation never claims Paid/Charged and never implies a
BalanceTransaction, paid Invoice or receipt.

### IA — four primary destinations

Nav (both capability variants): **Appointments (Orders in staging) / Services & prices / Shop /
Account**. Account owns `Purchases`, `My plan`, `Profile`, `Support` as entry cards, each
`available | unavailable` per its OWN contract (unavailable = honest notice + honest alternative
link, never empty data). Purchases never replaces Appointments as home; the appointment hero
deep-links to its purchase (`purchase.open` with `data-purchase-ref`) and checkout confirmation
deep-links to the created purchase.

### New routes (stable ids) × states

| route | renders | states |
|---|---|---|
| `account` | SpaAccount (module `spa-account`, entries `account-entry`) | ready / partially-unavailable (dev `acct`) / loading / error / unauthorized / unavailable |
| `purchases.list` | SpaPurchases (`purchase-row`, filters only for returned kinds, cursor append) | ready / empty / loading / cursor-loading / error / unauthorized / unavailable; staging → honest unavailable pointing at raw Orders |
| `purchase.detail` | SpaPurchaseDetail (summary / lines / totals / fulfillment / appointments / plan — absent sections OMITTED; grouping only when source-provided) | ready / loading / not-found / error / unauthorized / unavailable + per-action command states |
| `plan` | SpaPlan (`plan-card`: PACKAGE ≠ MEMBERSHIP, meter only from server numbers) | active / expiring / exhausted / cancelled / empty / loading / error / unauthorized / unavailable (dev `plan`) |
| `cart` | SpaCart (persistent SERVER cart) | ready / empty / loading / error / unauthorized / unavailable; line: pending / stale-price / inventory-conflict (dev `cart`) |
| `checkout` | SpaCheckout (spa only; other verticals keep the accepted checkout) | loading / ready / repriced / inventory-conflict / slot-expired / confirm-pending / confirm-failed / conflict / session-lost / unavailable / confirmed |

### Truth rules demonstrated

1. **Money is server-owned display strings** (`purchase.money`, `cart.displayTotals`,
   `checkout.displayTotals`) rendered VERBATIM — presentation never calculates savings, tax,
   balance, deadlines or eligibility. The demo recalculation lives in `fixtures.js`
   (`spaServerCart`) as a stand-in for `/portal/v1/cart` responses.
2. **Success only from authoritative readback** (wave-13 engine): the confirmation surface
   (`spa-confirmation`) renders exclusively from `state.spaResult`; cancel/return/renewal write
   back `accepted-for-review`/cancelled states — never optimistic, no refund consequence shown.
3. **Customer status mapping stays backend-owned**: `purchase-row` uses the contract vocabulary
   (Confirmed / In progress / Ready for pickup / Fulfilled / Cancelled); the staging raw
   `spa-order-row` variant is untouched and never borrows these labels for unmapped `OPEN` data.
4. **Order ≠ fulfillment ≠ Appointment ≠ plan**: purchase detail renders them as separate sections
   with separate statuses (the MIXED fixture `pur-3d76c2` shows In progress + Being prepared +
   Confirmed visit at once).
5. **Cart never reserves**: explicit copy on shop, cart and checkout; the bag indicator counts
   server-cart contents only. Row-scoped pending — one busy line never freezes others.
6. **Blocking review states**: cart stale-price / inventory-conflict and checkout repriced /
   inventory-conflict / slot-expired disable checkout/confirm until an explicit reload
   (`ui.retry` ids `cart-quote` / `checkout-quote` / `booking-hold`).
7. **Simulation treatment** (`simulation-notice`) renders wherever a payment step or confirmation
   is shown; approved copy only: `Order confirmed` / `Booking confirmed` / `Demo checkout
   completed`.
8. **Booking bridge**: the drawer review carries `data-payment-mode="SIMULATED"` +
   `booking-review` with held / slot-expired / repriced blocking states; confirm result is
   Appointment-only or Appointment+Order (dev `bookres`), rendered on the confirmation surface.
9. **Opaque refs**: every entity action carries `data-purchase-ref` / `data-line-ref` /
   `data-plan-ref` / `data-product-ref` / `data-variant-ref` / `data-appointment-ref` — stable
   non-sequential handles, never display names or raw Core ids. Not-found is non-enumerating.
10. **Unavailable ≠ empty**: the new `unavailable-state` treatment (and per-entry Account states)
    says the capability isn't connected — it never renders as "no data".

### Capability config

`retail-commerce-open` is a NEW deployment capability (preview: dev-toolbar `retail` select;
DOM: `data-retail="browse-only|retail-commerce-open"` on top-nav / products / cart / checkout
roots). Browse-only keeps the accepted wave-14 Shop byte-for-byte in behavior; sellable adds SERVER
sellability states per card: `sellable | unavailable | out-of-stock | price-changed |
variant-required` (variant picker `data-variant-ref`, Add disabled until picked).

### Stable action contract (new ids)

`account.open` / `account.openPurchases` / `account.openPlan` / `account.openProfile`;
`purchases.filter` / `purchases.more`; `purchase.open` / `purchase.openAppointment` /
`purchase.cancelRequest` / `purchase.returnRequest` / `purchase.buyAgain`;
`plan.bookWithCredit` / `plan.cancelRenewal`; `cart.open` (spa → the bag) / `cart.addItem` /
`cart.changeQuantity` (data-id `<lineRef>|<qty>`) / `cart.removeItem`; `checkout.start` /
`checkout.selectFulfillment` / `checkout.ackPolicy` / `checkout.confirm` / `checkout.retryConfirm`;
`shop.pickVariant`. All demo bodies — Codex owns the real commands (Idempotency-Key, versions,
scoped readback).

### Dev toolbar additions (wave 15)

`retail` (capability), `acct` (account route), `plan` (plan route), `cart` (cart route), `co` +
`src` (checkout route), `hold` + `bookres` (open booking); global `state` select gains
`unavailable`. `window.AircovePortal.seedCart()` is a preview convenience that replays add commands
against the demo server cart.

### Evidence

`previews/wave15/` — naming `{scope}-{state}-{width}-{mode}.png`; see the folder for the full
matrix (account ready/partial, purchases ready/empty/loading/error, purchase detail
service/retail/plan/mixed, plan active/exhausted, shop sellable/out-of-stock, cart ready/pending/
stale/conflict, checkout ready/sim/confirm states, confirmations, return request states, mobile
nav). Same capture-pane caveat as earlier waves: wide widths are scaled-to-fit captures; the live
page at true viewport width is authoritative.

### Unresolved product assumptions (recorded, not resolved by design)

1. Whether the demo checkout is visibly labelled a simulation in production copy (Calm Harbor
   decision #1) — the current treatment labels it explicitly.
2. Retail is pickup-only per the baseline assumption; delivery/tracking/returns ownership is
   unconfirmed (the fulfillment section renders a tracking slot only if the source provides one).
3. Package = finite one-time credits, membership = recurring — per baseline assumptions.
4. Return/cancellation policy windows are backend capabilities; the UI never derives eligibility.
5. The Purchases "attention" message vocabulary is a backend contract that does not exist yet.



## Wave 14.1 — acceptance corrections (blocking review)

Files changed: `src/components/shell/AppShell.js`, `src/actions.js`, `src/state.js`,
`data/fixtures.js`, `styles/responsive.css`, `styles/shell.css`, `manifest.json`,
`data/scenarios.json`, this README, regenerated `previews/wave14/` evidence.

1. **Mobile Orders row (390):** `.spa-order-row` becomes a two-row grid at `vw-mobile` —
   the identity column owns the full width beside the icon (no sibling badge/amount starving it);
   raw status + amount move to their own row. Nothing is truncated; long names/codes wrap at word
   boundaries; the long unmapped badge may wrap rather than overflow.
2. **Support truth (staging + closed target):** Calm Harbor has **no approved support destination**
   — chosen contract: the honest **support-unavailable** notice (`data-module="support-unavailable"`,
   `data-state="unavailable"`). Every visible support action (`support.open`, `support.email`,
   `support.call`) ends there; it states nothing was opened, sent or recorded. The fixture support
   route/chat-panel/threads/tickets are unreachable through Calm Harbor navigation, and no
   success-like toast implies delivery. New action: `support.dismiss`.
3. **Address-sharing claim removed:** the at-home fixture location is now neutral least-data copy
   (`Address on file`). The `At your place` chip is unchanged. Address policy, consent and
   specialist-sharing behavior remain **unresolved product/backend assumptions** (README §Wave 14).
4. **Profile contract sync:** legacy `appointments` lists **Health only** in manifest + scenarios;
   `spaStaging`/`spaTarget` are declared in both with capability, nav, primary, cart and booking
   rules; `fixtures.profileFor` no longer contains Beauty at all — `activeProfile()` resolves
   Beauty exclusively from the capability config.

Evidence regenerated at true CSS widths: the wide presets set an explicit `width` on
`.viewport-frame` (`data-vw="1180"` → 1180px, `"1440"` → 1440px; the host scrolls instead of
clamping), so the shell's width observer applies the real desktop classes — at 1440 nav links are
visible and the hamburger is hidden. Files: `staging-orders-long-{390,768,1180,1440}-light`, `staging-orders-long-390-dark`,
`target-long-{390,768}-light`, `shop-ready-{390,768}-light`, `support-unavailable-390-light`,
`target-appt-home-390-light` (re-shot), `shell-1440-light`.


## Wave 16 — Calm Harbor full flow activation (Appointment detail, complete booking flow, plan purchase entry, least-data Profile)

Completes the presentation contract for every Calm Harbor flow except Support, on the accepted
Wave 15 shell — tokens, components, responsive conventions, commerce surfaces, stable hooks and the
appointment-first IA unchanged. No Support flow was created or modified; no fifth primary
destination exists. Payment stays explicitly `SIMULATED` — no card fields, PSP controls,
paid/charged/refunded/receipt copy or payment-success visuals anywhere.

### 1. Appointment detail (route `appointment.detail`, module `appointment-detail`)

`src/routes/SpaAppointmentDetailPage.js`. Opened from upcoming/past rows (rows are now links —
`appointment.open`, opaque `data-appointment-ref`) and the hero's `View details ›`. Renders ONLY
source-provided fields from `F.spaCommerce.appointmentDetails[ref]`: service title as the headline
(never Order language), backend-mapped customer status, start + timezone note, optional
specialist, visit-mode chip + least-data location, optional display price, customer-safe
reference, the related-purchase link when provided, and server-owned policy/attention copy
verbatim. Actions render exactly from `allowedActions` (`Reschedule` / `Cancel visit` /
`Book again` / `View purchase`); while `data-booking="closed"` they are honestly disabled with the
support path. Foreign / removed / unknown refs share ONE non-enumerating not-found. States:
route `loading | ready | error | unauthorized | not-found | conflict` (+ session-lost via the
global gate); card `pending | failed | conflict`; cancelled and rescheduled render EXCLUSIVELY
from the authoritative (demo) readback (`state.spaCancelled` / `state.spaRescheduled`).

### 2. Complete booking flow (module `booking-flow`, in the accepted drawer)

`src/components/spa/SpaBookingFlow.js`, rendered by `BookingDrawer` whenever `state.spaFlow` is
open. ONE flow serves every supported entry: service card `Book` (`booking.open` + service code),
empty Appointments `Book an appointment`, past `Book again` (`appointment.bookAgain`), active
package `Book with a credit` (`plan.bookWithCredit`), upcoming `Reschedule`
(`appointment.reschedule`). Steps: **context** (service/plan-credit) → **specialist** (ONLY when
the server returns eligible specialists — manicure returns none and the step is skipped) →
**slots** (server days/slots; `loading | empty | error` on the slot source, error retries via
`ui.retry slots`) → **hold** (`booking.hold` — entity-scoped command `pending | held | failed`;
the hold is an opaque `data-hold-ref` + a display-ready expiry label rendered verbatim — NEVER a
local countdown, and a locally elapsed hold is never treated as authoritative; expiry and reprice
are SERVER-reported blocking states `slot-expired | repriced` on `booking-review`) → **review**
(visit details, server display total verbatim, policy acknowledgement `booking.ackPolicy`, the
required `Simulation — no charge will be made` treatment, confirm `pending | failed | conflict |
session-lost`). The confirmation renders only from the authoritative readback
(Appointment-only or Appointment+Order — dev `bookres`) on the accepted `spa-confirmation`
surface. **Reschedule truth:** `reschedule-current` identifies the currently booked visit
("unchanged until you confirm") on every step, the review shows a current-vs-proposed
`reschedule-compare` ("not booked yet"), and the original visit is released ONLY by the
confirmation readback. **Plan credit:** `plan-credit-context` renders the server's credit state
verbatim — `ok | unavailable | exhausted | changed` block the flow with server copy (changed
reloads via `ui.retry plan-credit`); no balance, eligibility, price or deadline is calculated in
presentation.

### 3. Package & membership purchase entry (module `plan-offer-card`)

`SpaCatalogPage` extends `membership-options`: while the NEW sellable-plan deployment contract is
open (`data-plan-commerce="open"`, dev select `plansell`) the published offers render as offer
cards — `Package` (finite uses) visually and semantically distinct from `Membership` (recurring
terms), showing only server-provided display price, terms summary, benefits and sellability, with
a `Published offer` chip and copy keeping them distinct from My plan. Primary action `Buy package`
/ `Join membership` (`plan.purchase`, `data-plan-offer-ref`) is disabled/absent when not sellable:
`unavailable` shows the honest note, `changed` blocks buying until an explicit `ui.retry
plan-offers` reload. Buying enters the accepted SIMULATED checkout with source `plan` (per-offer
frozen quotes `checkout.planQuotes`, membership quote carries the recurring-terms note), and the
confirmation links to BOTH the created purchase and My plan from the authoritative readback
(`confirmations.plan` / `confirmations.membership`). Contract closed keeps the accepted wave-14
offer rows byte-for-byte in behavior.

### 4. Calm Harbor Profile (route `profile`, module `spa-profile`)

`src/routes/SpaProfilePage.js` replaces the generic legacy Profile for Beauty only (the stable
route id is preserved; other verticals keep the accepted `Profile`). LEAST DATA: shows/edits only
phone, email and the explicitly approved communication/appointment preferences returned by the
scoped source (`F.spaProfileSrv`) — no spend, savings, order stats, addresses, saved cards/payment
methods, plan claims, member-since claims, raw ids, roles, permissions or organization. Values are
ALWAYS the last server-confirmed readback until `profile.save` succeeds; a failed save preserves
the old confirmed values; a version conflict blocks further edits until an explicit
`profile.reload`; per-field invalid states carry accessible error copy (`role=alert`,
`aria-invalid` + `aria-describedby`). Panel states: `ready | unchanged | dirty | invalid | saving
| save-failed | conflict` (+ route `loading | error | unauthorized | unavailable`, session-lost
via the global gate). Clear `‹ Account` back path; the page stays visually subordinate to the
appointment-first product.

### Stable route & action contract (wave 16)

New actions: `appointment.open` / `appointment.openPurchase` / `appointment.reschedule` /
`appointment.cancel` / `appointment.bookAgain`; `booking.selectService` /
`booking.selectSpecialist` / `booking.selectSlot` / `booking.hold` / `booking.retry` /
`booking.back` / `booking.ackPolicy`; `plan.purchase`; `profile.edit` / `profile.changeField`
(also the input-event hook on the profile fields) / `profile.save` / `profile.reload`.
**Preserved aliases (documented, meanings unchanged):** `order.reschedule` → appointment
reschedule, `order.cancel` → appointment cancel (both share the command key
`order.cancel:<ref>`, so pending/failed/conflict render identically everywhere),
`order.bookAgain` → appointment book-again, `profile.saveContact` → the legacy generic contact
panel (the Calm Harbor profile uses `profile.save`). New opaque refs: `data-plan-offer-ref`,
`data-slot-ref`, `data-day-key`, `data-hold-ref`, `data-booking-ref`, `data-specialist-ref`.
Exact actionable entities carry `data-state=pending|failed|conflict`; unrelated entities stay
interactive. Navigating (`go()`) now closes any open drawer/flow — navigation never confirms
anything.

### Dev toolbar additions (wave 16)

`adet` (appointment.detail scenario — every fixture ref + `unknown-ref` for the non-enumerating
not-found), `plansell` (`closed | open`), `offers` (`sellable | unavailable | changed`) on the
catalog routes, `slots` (`ready | loading | empty | error`) and `credit`
(`ok | unavailable | exhausted | changed`) while a flow is open; the existing `hold`, `bookres`,
`cmd` and `state` selects drive the remaining review states. All preview-only (`data-dev-toolbar`).

### Evidence

`previews/wave16/` — naming `{scope}-{state}-{width}-{mode}.png`: appointment detail
ready/not-found/conflict, booking slots + held review, reschedule compare + expired hold,
cancellation pending/failed/confirmed, book-again + book-with-credit entries, offers
sellable/unavailable, plan checkout/confirmation reuse, profile ready/invalid/saving/failed/
conflict/session-lost, 390 mobile navigation + primary actions, long-name review. Same
capture-pane caveat as earlier waves: wide widths are scaled-to-fit captures; the live page at
true viewport width is authoritative.

### Unresolved product assumptions (recorded, not resolved by design)

1. The slot-hold duration and its customer-facing wording ("Held until …") are backend contracts
   that do not exist yet — the label is a fixture stand-in rendered verbatim.
2. Specialist choice is assumed optional per service; which services return specialists is a
   backend capability.
3. The approved preference list on the Profile is a placeholder for the scoped API's returned
   set — nothing beyond phone/email/preferences may be added without a proven source.
4. Whether a reschedule can change the service or specialist (not only the time) is unconfirmed —
   this increment reschedules the time and keeps the visit's service/specialist context.
5. Package/membership offer benefits copy is CMS/PIM-owned; the fixture list stands in.


## Wave 17 — Calm Harbor product models, media galleries & published reviews (Beauty)

Adds the accepted visual system for browsing collections, opening a product, and reading published
reviews on top of the Wave 14/15 Calm Harbor Shop — tokens, components, responsive conventions, stable
hooks and the appointment-first IA unchanged. Presentation only: no API, auth, permission, adapter,
mapping, persistence or command implementation was added. Models, reviews and media are OPTIONAL
enrichments merged onto the sellable product by the immutable product code / opaque product ref; a failed
enrichment degrades ONLY its region and never blanks the product.

### 1. Shop grouping (route `products`, modules `product-model-list` / `product-model-section`)

`src/routes/SpaShopPage.js`. When the ProductModel enrichment is available (`state.spaModels === "ready"`)
the grid is grouped into `product-model-section` blocks (heading = model name + optional **decorative**
model media (empty alt) + product count + the variant dimensions the model DECLARES via `model.variants`),
in returned order, followed by a neutral **`Other products`** group for unmodeled products — a series is
NEVER inferred from a product's code or name. When the enrichment is unavailable the accepted flat grid
renders with an honest notice and the products stay sellable. Cards gain an OPTIONAL primary image
(`media[0]`, decorative), the collection name (shown only while models are available) and compact variant
facts, and carry **`product.open`** (opaque `data-product-ref`) to the detail as a SEPARATE affordance from
`cart.addItem` (the media + identity are one open button; the Add control is a sibling — no nested
interactive). Browse-only and retail-commerce-open both group and both link to the detail.

### 2. Product detail (route `product.detail`, module `product-detail`)

`src/routes/SpaProductDetailPage.js`. Opened with an OPAQUE product ref (never an authored id or the PIM
code as the route param). Composition: back to Shop (`nav.products`), product name, current display price
(verbatim), description, media gallery, source-provided variant facts, collection link (shown only while
models are available), add-to-bag and published reviews. Foreign / removed / unknown refs share ONE
non-enumerating not-found. States: route `loading | ready | error | unauthorized | not-found`; add-to-bag
reuses the wave-13 command lifecycle (`idle | pending | failed | conflict`; success only from the server
cart readback) and is present only under `retail-commerce-open` (adding never reserves).

- **Gallery** (`product-gallery` / `product-gallery-primary` / `product-gallery-thumb`, `data-media-ref`):
  the primary image and thumbnails come from `product.media[]` in EXPLICIT backend order — no image is
  duplicated to pad the gallery. A raw Media id is never used as a URL (`media.url` is a public/approved
  asset; while it is missing the accepted striped media slot renders with the backend alt text). Three
  images render primary + thumbs; **one image** is a deliberate single-image composition; **zero images**
  renders the accepted no-media state. Thumbnails are keyboard-reachable `<button>`s exposing the selected
  state (`aria-current` + `data-state="active"`). `product.gallerySelect` changes ONLY the shown image
  (`state.spaGallery`) — never the product or cart identity. Product images carry backend/CMS alt text;
  decorative model/collection images use empty alt text.

- **Reviews** (`product-review-list` / `product-review-card`, `data-review-ref`): region-scoped and
  INDEPENDENT of the route lifecycle (`state.spaReviews` = `ready | empty | loading | unavailable | error`)
  — the product stays fully sellable while reviews load, are forbidden, or error. Renders ONLY the
  backend-`PUBLISHED` set; shows the count of the VISIBLE loaded set and claims **no aggregate score /
  rating average**. Each card: star rating with a textual accessible label (`X out of 5`), optional title,
  body, backend-supplied public `authorName`, `Verified purchase` ONLY when `review.verified` is true, and
  optional `publishedAt`. Never exposes Review / Product / User / Account / workflow ids, raw attributes or
  moderation state. **Read-only initial release — no `Write a review`** (no customer-scoped create contract
  / moderation submission command exists yet).

### Data (`data/fixtures.js` → `spaCommerce.productCatalog`)

`codeToRef` (merge key), `models[]` (ProductModel enrichment: `ref, name, media?, variants[],
productCodes[]`), `byRef` (product read models: `ref, code, name, displayPrice, collection?, description,
variantFacts[], media[]` in explicit order), `reviews` (PUBLISHED-only, keyed by product ref). Opaque refs
(`prd-* / pmd-* / med-* / rev-*`) are stable non-sequential handles, never raw Core/Media/Review/User ids.
`prd-longform` is a preview-only long-content scenario for the 390 px overflow check.

### Stable action & state contract

New actions: `product.open` (opaque ref → detail), `product.gallerySelect` (presentation-only image
select). `cart.addItem` / `nav.products` unchanged. New dev-toolbar selects (on `products` /
`product.detail`): `models` (`ready | unavailable`), `pdet` (product ref incl. `unknown-ref` for the
non-enumerating not-found, and `prd-longform`), `rev` (reviews region state). `ui.retry product-reviews`
reloads only the reviews region.

### Constraints honored

Reuses the accepted Beauty tokens and primitives; the shell, nav, cart and simulated checkout are
untouched. No fake stock, bestseller label, discount, crossed-out price, rating average, before/after claim
or invented review count (the count is the visible loaded set only). No generated person is presented as a
real reviewer (author names are backend-supplied public display names, consistent with every other fixture
name). Product media is a public / approved asset URL — a raw Media id is never an image URL.

### Evidence

`previews/wave17/` — naming `{scope}-{state}-{width}-{mode}.png`: shop models-ready / models-unavailable,
product ready (3 images / 1 image / no media), gallery first- vs non-first-selected, reviews ready / empty /
unavailable / error / loading, add-to-bag pending, not-found, long-content at 390, product ready + reviews
unavailable in dark mode, across 1440 / 1180 / 768 / 390. Same capture-pane caveat as earlier waves: wide
widths are scaled-to-fit captures; the live page at true viewport width is authoritative.

### Unresolved product assumptions (recorded, not resolved by design)

1. The customer-facing review count wording ("N published reviews", the visible loaded set) stands in for a
   backend-owned presentation decision; no aggregate/average is claimed until the backend supplies one.
2. Which products belong to which ProductModel, and the declared `model.variants` dimensions, are a
   backend/PIM contract — the fixtures stand in.
3. Real product photography (public or approved-URL) is not yet delivered; every gallery renders the
   accepted striped media slot with the backend alt text until assets exist (see MEDIA-SPEC.md conventions).
4. Whether a collection link should filter the Shop to that model (vs. return to the grouped Shop) is
   unconfirmed — this increment returns to the Shop, where the collection lives.


## Wave 17.1 — staging Order-row representative thumbnail (addendum)

Scoped addendum to the `orders.list` current-staging Order rows only — no other page, component, navigation,
type, status badge, amount column, route or action changed. The former abstract colored square is replaced by
an OPTIONAL backend-supplied representative thumbnail (`order-thumb`) in the **same footprint** (38×38,
`--radius-sm`, same position):

- **retail order → product primary image · service order → service image · package/series order → package or
  ProductModel hero.** The backend supplies `order.media` (`{kind, url, alt}`); it is NEVER inferred from the
  order title, type, amount, filename or first order line, and a multi-line order is never rendered as a
  collage.
- **No approved image → neutral no-media fallback** in the same footprint (the accepted striped placeholder).
- Executable media states (dev `omedia`): `mixed` (per-row backend media), `loading` (skeleton in footprint),
  `missing`, `forbidden`, and `broken` (a supplied `url` that fails → `onerror` swaps to the no-media
  fallback). Every failure resolves to the neutral fallback **without turning the row into an error or moving
  the text / status / amount columns**.
- The thumbnail is decorative (`alt=""`), **not a separate button**, and does not change the read-only
  behavior of the row. Textual product/service identity (type label + reference + code) is preserved so the
  list reads without images. Long titles still wrap at 390 px beside a fixed-footprint thumbnail.

Files touched: `data/fixtures.js` (`spa.stagingOrders[].media`), `src/state.js` (`spaOrderMedia`),
`src/routes/SpaOrdersPage.js` (`orderThumb`), `src/app.js` (dev `omedia`), `styles/routes.css`
(`.spa-order-thumb`), `manifest.json`, `data/scenarios.json`. Evidence:
`previews/wave17/orders-thumb-{mixed,broken,loading}-{1440,768,390}-{light,dark}.png`.



## Wave 18 — core-auth CMS login page (static, `core-auth-login.html`)

The page `core-auth` serves when the portal redirects a customer to sign in. The skin comes
from `core-cms`; the CMS supplies presentation only and never receives the username,
password, CSRF token, session or authentication cookies. Counterpart to the portal-side
OIDC request (wave 10): `AuthOidcPage` is the redirect hand-off, **this** is the page it
redirects to. `AuthPage` (fixture phone + OTP) and `AuthOidcPage` are not visual answers
for a username and password form and are not reused here.

### The deviation — and it is the point of the request

Everywhere else in this package the DOM is built by `h()` factories from `src/app.js` and
driven by one delegated action listener. **None of that exists on this page.** The answer
transfers into a CMS block template, so it is static HTML: no component factory, no ES
modules, no build step, no router, no state object, no `manifest.json` component entry.
**The page is fully functional with JavaScript disabled** — submission is a native form
POST. The visual system carries over unchanged; the delivery shape does not.

### One system, not a second one

Nothing is copied. `core-auth-login.html` **links the accepted stylesheets** in the same
order `source.html` uses — `tokens.css` → `base.css` → `shell.css` → `components.css` →
`routes.css` → `core-auth-login.css` — so tokens, the base reset, `.brand-logo`, the
`.btn` and `.field` primitives, `.eyebrow` and the `auth-page` / `auth-grid` /
`auth-pitch` / `auth-card` composition stay owned by their existing files and this page
follows any change to them. There is no second token block and no second dark palette.

`styles/core-auth-login.css` (8th stylesheet) holds **only**: the two message regions, the
card header/copy, the label row and the optional reveal control, and the standalone-page
adjustments the `.app-shell` used to provide (full-height `--app-bg`, centering, the
container-query breakpoints). Responsive is `@container` on `.auth-page` at the accepted
thresholds (≤900 tablet, ≤560 mobile) because the `.vw-*` classes are set by a
`ResizeObserver` in `app.js` and **no script runs here**.

**Dropped, because no product action remains behind them:** `auth-phone` and the
country-code chip, the OTP boxes, resend, the Apple control, `auth-divider`. The
`auth-pitch` column is kept — at 1440 it carries the anti-phishing context that makes the
page legible as a hand-off from the portal; the card is first in the DOM, so at 390 the
form comes first and the pitch follows it.

### Three server-controlled states, one form

| State | Content |
|---|---|
| `default` | Username, password, submit, password-reset link. Neither message region occupies layout. |
| `error` | Assertive region above the fields. The form keeps its layout and stays fully usable; at 390 × 667 the submit action is still above the fold. |
| `after-logout` | Polite region. A neutral confirmation — it differs from `error` by glyph, title, weight, border and fill, not by color alone. |

Both regions are in the DOM at all times, so every combination is valid, including both
visible at once.

### Stable transfer hooks

- Exactly one `<form>`, marked `data-core-auth-login`, `method="post"`.
- Field names `username` / `password` — fixed, never parameters or bindings.
- `autocomplete="username"` / `autocomplete="current-password"`; hidden CSRF input first.
- `role="alert"` on `#auth-error-message`, `role="status"` on `#auth-logout-message`.
- **Six placeholders, verbatim:** `{{LOGIN_ACTION}}` (form action), `{{CSRF_PARAMETER_NAME}}`
  + `{{CSRF_TOKEN}}` (hidden input), `{{RESET_PASSWORD_URL}}` (reset link),
  `{{ERROR_DISPLAY}}` + `{{LOGOUT_DISPLAY}}`. State is expressed **only** as
  `style="display:{{ERROR_DISPLAY}}"` / `style="display:{{LOGOUT_DISPLAY}}"` — no class
  toggling, no scripted visibility, no `data-state` switch. The shipped CSS contains no
  visibility rule for the two regions at all.
- `lang`, `dir`, `data-theme` and `data-mode` are **server-rendered attributes** on
  `<html>` (ar / he ship in the locale set → `dir="rtl"`; layout mirrors through logical
  properties only). No script flips them.
- **Copy slots** — every visible string sits alone in an element carrying
  `data-copy="<slot>"`: `page.documentTitle`, `brand.name`, `card.title`,
  `card.subtitle`, `error.title`, `error.body`, `logout.title`, `logout.body`,
  `field.username.label`, `field.password.label`, `link.resetPassword`,
  `action.showPassword`, `action.hidePassword`, `action.submit`, `card.note`,
  `pitch.eyebrow`, `pitch.title`, `pitch.body`.

### Data and security

No `fetch`, no scripted submit, no delegated action listener, no client-side check as the
only guard (`required` is native constraint validation and works without script; the
server remains the only real check). The page's own JavaScript is **one inline block that
reveals the show/hide password control** — deleting it changes nothing functional, and the
control is `hidden` until the script un-hides it. Nothing third-party: no script, style,
font, icon set or image from another origin, including for preview (`tokens.css` declares
the local-first Manrope fallback; the Google Fonts `<link>` in `source.html` is **not**
used here). No analytics, tag manager, session recorder or error reporter — the DOM
carries a password field and a live CSRF token. **Dynamic data: none** — no customer name,
session state, account id or claim; everything variable comes from the six placeholders
and the copy slots.

### Preview harness

Everything marked `data-dev-toolbar` is preview-only: one `<style>`, four `<i>` anchors,
the toolbar (reusing the accepted `.dev-toolbar` treatment) and one `<script>`. Remove
them and the page is the delivered artifact. The three states are previewed with
**`:target` CSS and no JavaScript** — that is how the JavaScript-disabled captures were
taken. The harness `<style>` also supplies the hidden default for the two regions, because
in an un-substituted template `display:{{ERROR_DISPLAY}}` is not a valid declaration and is
dropped. The mode / dir / vw buttons do use script; they are harness controls, not page
behavior.

### Evidence

`previews/wave18/` — `login-{state}-{width}-{mode}.png`, 26 files: default / error /
after-logout at **1440, 1180, 768, 390** in **light and dark**; `login-both-visible-390-light`
(both regions at once); `login-error-390x667-fold-light` (the fold check);
`login-error-390-rtl-light` and `login-after-logout-1440-rtl-dark` (RTL — the English
fixture copy shows the usual bidi punctuation flip; real ar/he strings read correctly);
`login-js-disabled-error-390-light` and `login-js-disabled-default-1440-light` — **the
acceptance artifact**, rendered with the enhancement script's only effect removed (the
reveal control back to `hidden`) and the state driven by `:target` CSS, which is exactly
the DOM a browser with scripting off produces. The missing *Show* control is the whole
visible difference. Re-shoot in a real browser with JavaScript disabled before sign-off if
the acceptance process requires it. Same capture-pane caveat as earlier waves: wide widths
are scaled-to-fit at their true CSS width (container queries resolve at the real width, so
the layout is faithful); the live page at true viewport width is authoritative.

### Unresolved / recorded, not resolved by design

1. **Per-field invalid state is out of scope.** The accepted field contract (`aria-invalid`
   + `aria-describedby` + a `field-error` sibling with `role="alert"`) needs a per-field
   placeholder this runtime contract does not have — the six placeholders carry no
   field-level signal. Both inputs point `aria-describedby` at the assertive region, which
   exposes nothing while hidden and is announced with the field when `core-auth` shows it.
   `components.css` keeps the `[data-state="invalid"]` / `.field-error` primitives and
   `core-auth-login.html` carries a commented example at the exact insertion point, so a
   seventh placeholder later is a markup-only change.
2. **Two-factor authentication is a separate request** — delivered in wave 19,
   `core-auth-2fa.html`. See §Wave 19.
3. The error copy is **non-enumerating** — it never says which of the two values was wrong,
   matching the package's rule for not-found and forbidden.
4. The `pitch` copy asserts the portal redirected the customer here. If `core-auth` also
   serves this page on a direct visit, that sentence needs a second CMS variant.
5. Stylesheet hrefs are relative, as in `source.html` and `seo-landing.html`: `core-auth`
   must serve the page and `styles/` from the same directory, or prefix each href with the
   deploy root so every URL is root-relative and valid on the public host.
6. If the `core-auth` CSP forbids inline script, move the enhancement block verbatim to a
   root-relative `login.js` — the page's behavior with it absent is already the tested one.


## Wave 19 — core-auth CMS two-factor page (static, `core-auth-2fa.html`)

The page `core-auth` serves after login when the account requires a second factor. Answers
§Wave 18 unresolved item 2. Same delivery shape as the login page, same visual family, one
step further into the flow. This brief owns **only** that CMS page: the portal-side
`auth.oidc` redirect screen (wave 10) is untouched, and no login, OAuth, session or Account
contract changes.

### Continuity is the deliverable

The composition is the accepted login skin, not a new one: the same `auth-page` /
`auth-inner` / `auth-grid` centered layout, the same card hierarchy (brand mark + name →
title → subtitle → one form → note), the same `auth-pitch` column carrying the
anti-phishing context, the card first in the DOM so the form comes first at 390, the same
theme and light/dark token packs, the same `.btn` / `.field` primitives, the same 2px accent
focus outline, the same 16px-minimum mobile field type, and the same no-JavaScript form
behavior. A customer moving from login to 2FA should not be able to tell that a second
template rendered.

### One system, not a second one

`core-auth-2fa.html` links, in the order `source.html` uses: `tokens.css` → `base.css` →
`shell.css` → `components.css` → `routes.css` → **`core-auth-login.css`** →
`core-auth-2fa.css`.

Linking the login stylesheet is deliberate. It is the **shared standalone-auth layer**: the
full-height `--app-bg` page, `.auth-inner` centering, the `.auth-grid` columns and ordering,
`.auth-head` / `.auth-title` / `.auth-sub` / `.auth-note`, the assertive `.auth-msg--error`
region, the page-wide focus convention and the container-query breakpoints all live there.
Forking those rules into a second file would create exactly the second system wave 18 was
careful not to build, and the two pages would drift on the first token change. If the name
becomes confusing at integration, rename it once (e.g. `core-auth-shell.css`) and update
both `<link>`s — but do not copy it.

`styles/core-auth-2fa.css` (9th stylesheet) holds **only** what 2FA introduces: the
enrollment panel, the QR frame, the setup-key block, the already-enrolled notice, the code
field, and the two shared-region overrides the form's flex gap needs. No animation and no
transition is declared in it, so reduced-motion behavior is unchanged.

### Four server-controlled states, one form

| State | Runtime | Content |
|---|---|---|
| `setup-ready` | `SETUP=block`, `NOTICE=none`, `ERROR=none` | Enrollment explanation, QR image, setup key, code field, verify action. |
| `setup-error` | `SETUP=block`, `ERROR=block` | Identical enrollment content plus the assertive region below the field. Resubmission goes through the same form; the QR and key are still the substituted runtime values, because nothing in CMS stores, defaults or regenerates them. |
| `verify-ready` | `SETUP=none`, `NOTICE=block`, `ERROR=none` | Already-enrolled notice, code field, verify action. No QR, no key. |
| `verify-error` | `SETUP=none`, `NOTICE=block`, `ERROR=block` | Verification context kept, assertive invalid-code message, resubmission. Claims nothing beyond the supplied copy. |

Submitting is a native form navigation. There is no loading state, no disabled state and no
progressive enhancement of any kind — see "Data and security".

### Stable transfer hooks

- Exactly one `<form>`, marked `data-core-auth-2fa`, `method="post"`.
- Field name `code` — fixed, never a parameter or a binding. `inputmode="numeric"`,
  `autocomplete="one-time-code"`, `required`, hidden CSRF input first.
- Element order is the contract order: hidden CSRF → enrollment block → verify notice →
  label → input → accessible hint → assertive error → submit. Everything added between
  them is an inert wrapper or an accessible description.
- **Eight placeholders, verbatim:** `{{TWO_FACTOR_ACTION}}`, `{{CSRF_PARAMETER_NAME}}`,
  `{{CSRF_TOKEN}}`, `{{SETUP_DISPLAY}}`, `{{VERIFY_NOTICE_DISPLAY}}`, `{{ERROR_DISPLAY}}`,
  `{{TWO_FACTOR_QR_CODE}}`, `{{TWO_FACTOR_SECRET}}`. State is expressed **only** as
  `style="display:{{…}}"` — no class toggling, no `data-state` switch, no scripted
  visibility, and the shipped CSS contains no visibility rule for the three regions.
- `{{TWO_FACTOR_OTPAUTH_URI}}` is **not referenced**: no visible control needs it in this
  brief, and an unused placeholder is one more protected value on the page.
- `lang`, `dir`, `data-theme`, `data-mode` are server-rendered attributes on `<html>`.
  Every registered theme works from this one layout; no tenant-specific rule exists.
- **Localized copy** — 17 `LOCALIZED_STRING_SS` parameters, each alone in its element and
  each element also carrying `data-copy="<slot>"`. Full inventory with safe example copy:
  `data/core-auth-2fa-parameters.json`. `AUTH_BRAND_NAME` and `AUTH_PITCH_EYEBROW` are the
  same parameters login uses; the two pitch sentences are step-specific because login's
  pitch asserts that a password is entered on that page, which is false here.
- Scenario / manifest coverage for the four states, plus the validation note:
  `data/core-auth-2fa.manifest.json`.

### The QR and the key

The QR tile is the one element on the page that does not follow `--surface`: it stays light
in dark mode, because a scanner needs the quiet zone and full module contrast. 176px at
desktop, 152px at ≤560, `image-rendering: pixelated` so a small data-URL bitmap keeps square
modules, `overflow: hidden` so a long `alt` string stays inside the card if the image ever
fails to decode.

The QR is never the only way to enroll. The setup key sits directly under it at equal
weight: a labelled, monospaced, letter-spaced block that **wraps** inside the card
(`overflow-wrap: anywhere`), is selectable with the keyboard, carries `dir="ltr"` so the
Latin key keeps reading order under an RTL locale, and is read by assistive technology in
document order straight after its own label. Nothing reveals, groups, formats or copies it —
each of those is a script handling a protected value.

### Data and security

**The transfer source contains no `<script>` tag at all** and no event attribute: not even
the login page's one enhancement block. Nothing prevents a second click, because doing so
would mean script on a page that renders a live CSRF token and a generated secret, and the
form must stay completely functional without it either way. No `fetch`, no scripted submit,
no client-side check as the only guard (`required` is native constraint validation; the
server remains the only real check). No third-party script, style, font, icon set, QR
generator, telemetry or image — the QR source is the core-auth data URL, so the browser
never fetches it from an external service. No username, password, access token, OAuth
state, Account id, role or authentication cookie is visible to or owned by CMS. **Dynamic
data: none beyond the eight placeholders and the copy parameters.** CMS failure, invalid
markup, timeout or oversized response is handled by Core Auth's bundled 2FA fallback and is
outside this page.

### Accessibility

Explicit visible label for the code field; `aria-describedby` naming the hint and the
assertive region (which exposes nothing while `core-auth` keeps it hidden, and is announced
with the field when shown); exactly one `role="alert"` region on the page; heading order h1
(card) → h2 (pitch); **no `autofocus`**, deliberately — focusing the field would move a
screen reader and a zoomed viewport past the enrollment instructions and the key on a
first-time setup. 200% zoom lands on the ≤900 container layout (evidence at 720), and the
card, key and QR all reflow rather than clip.

### Evidence harness

`core-auth-2fa-preview.html` is **generated from** `core-auth-2fa.html` and is never
transferred: it substitutes the 17 localized parameters with the example copy from the
parameter inventory, points the QR `src` at a local stand-in, and fills
`{{TWO_FACTOR_SECRET}}` with a sample key — the three things a reviewer cannot see in an
un-substituted template. Edit the transfer source, then regenerate. The three display
placeholders stay un-substituted on purpose: an invalid declaration is dropped, so the
pure-CSS `:target` harness owns visibility and the four states are previewed **with no
JavaScript**. `previews/wave19/qr-harness-sample.png` is a synthetic, **non-scannable**
stand-in generated locally for layout evidence — it encodes nothing, and the transfer source
never references it.

### Evidence

`previews/wave19/` — `2fa-{state}-{width}-{mode}.png`, 29 files: all four states at **1440,
1180, 768, 390**, light and dark; `2fa-setup-ready-920-rtl-dark` and
`2fa-verify-error-390-rtl-light` (RTL — mirrored entirely through logical properties: card
left, pitch right, brand mark and error glyph on the trailing edge. The English example copy
shows the usual bidi punctuation flip; real ar/he strings read correctly. RTL is shot at
widths the capture pane holds natively — 920 rather than 1440 — because an oversized RTL box
overflows to the left and defeats the fit-scale; the composition at 920 is the same
two-column desktop layout); `2fa-setup-ready-zoom200-720-light` and
`2fa-verify-error-zoom200-720-dark` (1440 at 200% zoom). **These are also the
JavaScript-disabled artifact**: the page has no script, and the four states are driven by
`:target` CSS through plain anchors, so a browser with scripting off renders exactly this.
Re-shoot in a real browser with JavaScript disabled before sign-off if the acceptance
process requires it. Capture caveats, same spirit as earlier waves: each shot sets the true
CSS width on `.auth-page` and scales the result to fit the capture pane — container queries
resolve at the real width, so the layout is faithful — and the card's `backdrop-filter` is
neutralised during capture only, because compositing it under a scale transform ghosts the
image. The live page at true viewport width is authoritative.

### Unresolved / recorded, not resolved by design

1. **Per-field invalid state** is still out of scope, for the same reason as wave 18: the
   runtime contract carries no field-level signal. The code input points
   `aria-describedby` at the shared assertive region.
2. **The setup key is read as one string** by assistive technology. Grouping it into
   readable chunks would mean a script transforming a protected value, so the copy carries
   the guidance instead ("spaces and letter case do not matter"). Revisit only if
   `core-auth` ever supplies a pre-grouped secret.
3. **No resend, recovery-code, trust-device, alternate-factor or factor-management
   affordance exists** — none is in this brief. If one is added later it needs its own
   action, and a second form would break the one-form contract.
4. `{{TWO_FACTOR_OTPAUTH_URI}}` has no visible control. Adding an "open in your
   authenticator app" link later is a markup-only change.
5. This page is intentionally **outside `manifest.json` and `scenarios.json`** (no factory,
   no route, no action, no fixture), exactly as the wave-18 login page is. Its coverage
   document is `data/core-auth-2fa.manifest.json`; the accepted manifest and scenarios files
   are unchanged by wave 19.
6. Stylesheet hrefs are relative, as in wave 18: `core-auth` must serve the page and
   `styles/` from the same directory, or prefix each href with the deploy root.
