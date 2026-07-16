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

The portal reshapes by **profile**, chosen from the vertical (`fixtures.profileFor`):

- **`onDemand`** (HVAC): booking-first. Nav = Orders / **Equipment** / Proposals / Services / Pricing / Products / Support;
  primary action **+ Book**; cart on; Calendar = month grid.
- **`stormOps`** (Snow Removal, Roofing, Pool & Spa, Lawn & Garden, Pest Control): weather-triggered seasonal
  service. Nav = **Home / Calendar / ‹care hub› / Contracts / Services / Activity / Support**; primary action **Request
  service**; cart off; Calendar = **weather-operational agenda**. The **StormCalendar** derives service names
  and trigger copy from the active vertical, so one component serves all five weather-triggered verticals.
- **`appointments`** (Health, Beauty — wave 9): booking-first, no weather triggers (`themes[x].wt = null`
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
`design-inbox/media/calm-harbor-{hero,proof}.jpg`; full desktop/tablet/mobile crops, focal points, alt
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
light/dark. Media assets are delivered: `design-inbox/media/spa-massage-1448.webp` (hero) and
`design-inbox/media/spa-room-1600.webp` (proof) — see MEDIA-SPEC.md.
