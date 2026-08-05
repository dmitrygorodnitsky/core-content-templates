# HANDOFF — Customer Portal modular design source

Continuation doc for a fresh thread. Read top-to-bottom before touching anything.

## What this is
`customer-portal-design/` is the **modular, no-build, native-ES-module** design source for the Aircove
field-service customer portal. It was split from the monolith `aircove-portal-design/`
(`app.js` 2282 lines / one IIFE, `styles.css` 1078 lines) into many small files **without changing the
visual design or the contract**.

It is a **design source / presentation runtime — NOT a production app**: no business logic, no API calls,
no real pricing/auth/persistence. Codex transfers components one-by-one and wires the real logic.

## Ground rules (unchanged)
- **ES modules** (`export` / `import`). **No build step** = many files, no bundler.
- **Must run over HTTP** — native modules are blocked on `file://`. Don't rely on double-click.
- `aircove-portal-design/` stays **untouched** as the fallback + the visual/contract parity reference.
- Do **not** redesign and do **not** add business logic. Parity is the only success metric.

## Contract attributes — preserve verbatim
`data-route`, `data-module`, `data-action`, `data-bind`, `data-state`, `data-visual-id`,
dev-toolbar behavior (`data-dev-toolbar`), fixture shape, class names, route ids, action ids.
Any contract change must be documented in `README.md` + here.

---

## ✅ Current state — everything below is DONE

### Structure (delivered)
```
customer-portal-design/
  source.html          7 <link> stylesheets + <script type="module" src="src/app.js">
  seo-landing.html     direct-preview entry for the public SEO landing (sets window.__initialRoute)
  README.md            full docs: module tree, contract, deviations, known issues
  HANDOFF.md           this file
  manifest.json        index of components / actions / bindings / attributes
  data/{fixtures.js, seo-fixtures.js, scenarios.json}
  src/{dom,state,actions,router,app}.js + components/** + routes/*Page.js   (~50 files)
  styles/{tokens,base,shell,components,routes,responsive,seo}.css            (7 files)
  previews/            viewport captures — see "previews" below
```

### JS split — done and verified
`app.js` was split by function boundary into `dom / state / actions / router / app` + `components/**` +
`routes/*Page.js`. Export names were kept **original** (`OrdersPage.js` exports `Cabinet`, etc.).
Two stray `export` tokens the splitter had injected mid-function-body were removed. **`source.html` boots
over HTTP and all 17 routes render with no JS errors** (orders.list, order.detail, calendar, services,
pricing, products, checkout, proposals.list, proposal.detail, profile, activity, support, landing,
auth.phone, auth.code, **care** — wave 7, **seo.landing** — wave 8). Walk them via the dev-toolbar route
selector.

### CSS split — done, byte-exact
`styles.css` → 6 files by section: `tokens` (theme/mode vars), `base` (reset/type/keyframes),
`shell` (app-shell/nav/page), `components` (buttons/badges/tabs/cards/panels/states/toast/drawer/dev),
`routes` (route/module layouts), `responsive` (`.vw-*`). All `.vw-*` rules were gathered into
`responsive.css` (loaded last; higher specificity → cascade preserved). A non-whitespace character diff of
the 6 files vs. the monolith `styles.css` is **exactly zero** (69007 = 69007). The page renders styled.
Wave 8 added a 7th stylesheet, `seo.css` (public SEO landing only); waves 7–9 append new sections to
`routes.css`/`tokens.css` — the byte-exact-diff claim applies to the original wave-6 split, not to the
additive wave 7–9 content.

### Auth naming — done (route-based)
Auth is now two routes, **`auth.phone`** and **`auth.code`**, driven by `state.route`. The old
`state.authStep` flag was removed. `router.js` renders `Auth()` for both; `Auth()` picks phone vs. OTP from
the route; `isPublic()` treats both as public; `auth.sendCode` → `auth.code`, `auth.back` → `auth.phone`.
DevToolbar lists both. Matches `scenarios.json`. Flow tested: phone → code (number carried) → back → phone.

### manifest.json — regenerated from real split source
Every `data-module` present in source has a component entry; every ACTION-map key is listed in
`manifest.actions`; `auth-card` props changed `["authStep"]` → `["route"]`; `proposals-list` id aligned to
source `proposal-list`; inline-only pieces are listed as `"inline in X"` factories. Kept in lock-step
through waves 7–11 (current version: `wave-11`).

### scenarios ⊆ manifest — drift fixed
`scenarios.json` referenced `profile.updatePaymentMethod`, which is not a real action. Replaced with the
real `profile.setDefaultPayment`. Verified: **every scenarios action exists in manifest** and **every
scenarios route is rendered by `router.js`**.

### Wave 7 — vertical care hub (`care` route) — done
One config-driven route whose content is vertical-specific via `fixtures.careModules[theme]` (same
mechanism as portal profiles); the nav label comes from `careModules[theme].navLabel`. Hubs:
HVAC **Equipment** (unit picker / passport / diagnostics / document vault), Snow **Season log**
(storm-response compliance log + SLA meter), Lawn **Program** (5-step program + kids-&-pets re-entry),
Pool **Water** (readings vs. safe ranges + dose log), Roofing **Roof report** (zones + score + project
tracker), Pest **Monitoring** (station map/list + alert log + free re-treat).
States: `ready | loading | empty | error | unauthorized` (entitlement gate). Actions: `care.selectUnit`,
`care.download`, `care.requestRetreat` — payload contracts use stable ids (unit.id, document.id,
plan.planId + data-property-id/data-service-id), never display names.

### Wave 8 — public SEO landing (`seo.landing`) — done
ONE reusable section set (`src/components/seo/SeoSections.js`, styles in `styles/seo.css`) serves every
vertical; content = CMS slots in `data/seo-fixtures.js` (nullable slots render an explicit "from CMS" chip,
never an invented fact). Direct-preview entry: `seo-landing.html`. Sections: hero (+`{locality}` merge tag),
trust strip, services grid, how-it-works, vertical proof, pricing (`from:null` = needs-assessment), service
area, reviews (media slots), FAQ (schema.org microdata), final CTA, footer. Fixed CTA action ids
(`seo.cta.*`, `seo.service.select`, `seo.faq.toggle`) with a `data-state` lifecycle `idle|pending|success|error`.

### Wave 9 — Health & Beauty verticals — done
Two non-weather verticals on the new **`appointments`** portal profile (nav: Appointments / Calendar /
care hub / Services / Pricing / Products / Support; primary **+ Book**; cart on; month calendar). Both set
`themes[x].wt = null`, which removes the Weather Trigger banner/panel and feed item everywhere (guards in
`ordersFor` / `buildFeed`). New themes `data-theme="health|beauty"` in `tokens.css`.
Care hubs: **Health → "Care plan"** (`HealthCareHub.js`) — next appointment, care-plan milestones
(logistics steps only), follow-up tasks, secure documents (METADATA only — contents open in a secure
viewer; **no clinical metrics, readings or results are ever rendered, by design**), provider card,
not-a-medical-record disclaimer. **Beauty → "My routine"** (`BeautyCareHub.js`) — appointment + session
package with usage meter, preferred-specialist picker, treatment/routine history (saved formulas & notes),
loyalty card, routine products via the existing cart contract.
New actions: `care.selectSpecialist`, `care.completeTask`, `care.contactProvider`, `care.openSecureDoc`.
Stable entity ids: `appt-*`, `prov-*`/`spec-*`, `plan-*`/`pkg-*`, `task-*`, `doc-*`. SEO-landing content for
both verticals added to `data/seo-fixtures.js` (Health copy is logistics-only — no clinical claims;
regulated facts are null CMS slots).


### Wave 10 — Core OIDC login (`auth.oidc`) — done
Route **`auth.oidc`** at `/login` (module **`core-oidc-auth`**, `src/routes/AuthOidcPage.js`) replaces the
fixture phone/OTP/Apple flow with the Core OIDC authorization-code+PKCE redirect presentation. Six states
on the card's `data-state`: `checking-session` (bootstrap on every /login load, incl. the callback
return: discovery + session restore — non-interactive, no redirect claim, no controls, no name),
`ready-signed-out` (one primary **Continue to secure sign-in**),
`redirecting` (non-interactive, page is leaving for Core), `unavailable` (honest retry, NO fallback login),
`ready-signed-in` (one customer-safe display name — `data-bind="session.displayName"` — + Browse the
catalog + Sign out), `signing-out` (non-interactive). Actions: `auth.oidcSignIn`, `auth.retrySession`,
`auth.signOut` (bodies are DEMO transitions; Codex swaps in the real redirect/re-init/logout).
No password input, token, API key or Account id is ever rendered — dynamic data is session status +
one display name only. `auth.gotoSignin` now routes to `auth.oidc`; **`auth.phone`/`auth.code` stay in the
package as reference only** (dev-toolbar "(ref)" entries, no product navigation reaches them).
Dev toolbar gains an `oidc` state select on the route. Previews: `previews/oidc-*.png`.

### Wave 11 — Calm Harbor Spa public landing (Beauty) — done
The Beauty `seo.landing` ships as the **Calm Harbor Spa** release — same section set, Beauty theme/tokens/
nav/buttons untouched. All additions are per-vertical opt-in slots in `data/seo-fixtures.js`; other
verticals render byte-identically.
- **`seo-products-teaser`** (between seo-pricing and seo-service-area): 3–4 cards from the repeated public
  PIM collection (`pim.products[]`; public fields ONLY: code / name / short description / displayed price /
  optional image; `data-product-code` on every card). Reuses the accepted `product-card` classes — no second
  card system, no Add/cart. ONE action everywhere (cards + section CTA): **`nav.products`** → existing Shop
  route. States ready|loading|empty; `seo-products-teaser-empty` = honest empty-catalog copy, CTA hidden,
  nothing invented. `productsTeaser.codes[]` = CMS slot choosing featured catalog codes; Beauty products in
  `data/fixtures.js` gained stable `code` fields (`rtl-beauty-01…06`).
- **Honest-navigation CTA mode**: CTA kinds `services|pricing|products|signin` → `nav.services` /
  `nav.pricing` (scroll to live sections; the pricing section now carries `id="seo-pricing"`) /
  `nav.products` / `auth.gotoSignin`. Nav CTAs render NO pending/success lifecycle (ignore `seoCtaForce`).
  Beauty uses ONLY these four public actions — no seo.cta.book/quote, payment, checkout, booking command or
  "request sent" state; service cards route to pricing ("Pricing →") in this mode. book/quote verticals
  unchanged.
- **`seo-media`** CMS media slots on hero + proof (`cms.media.hero/proof`: src, alt, focal). Renders the
  real public image (cover + focal point); missing file → striped spec slot. DELIVERED (wave 12):
  `media/spa-massage-1448.webp` (hero, 1448×1086) and `media/spa-room-1600.webp`
  (proof, 1600×686) — crops / focal / alt / ratios in **MEDIA-SPEC.md**. No logos/text/prices/claims inside bitmaps.
- New optional per-vertical fixture slots: `meta.brand` (footer/proof fall back to "Aircove"), `hero.note`,
  `services{eyebrow,title,sub}`, `pricing.cta`, `finalCta{sub,primary,secondary}`, `media{hero,proof}`,
  `productsTeaser{…}`. New actions: `nav.services`, `nav.pricing`, `nav.products` (+ generalized
  `seoScrollTo(id)` in actions.js). manifest wave-11, scenarios wave 11, README §Wave 11, previews
  `previews/calm-harbor/`.

### Wave 12 — Calm Harbor live PIM pricing contract — done
`seo-pricing` keeps its accepted composition/ids; only the DATA contract changed for verticals that supply
`pimPricing` (Beauty/Calm Harbor only — others still render `cms.pricing.rows[]`):
- ready = repeated LIVE public PIM collection **`pim.pricing[]`** — `seo-pricing-row` (new stable
  data-module/data-visual-id, also added to legacy CMS rows) binds `code` / `name` / `displayPrice` /
  optional `interval` | `shortDescription`, carries `data-product-code`. SPA_SERVICE + SPA_MEMBERSHIP only,
  never SPA_RETAIL. `displayPrice` renders VERBATIM — no calculation/estimation/comparison in presentation.
- `loading` keeps the accepted skeleton; `empty` truthfully says no treatments/memberships are published —
  no quote, booking or fallback price. Section CTA stays honest navigation (`auth.gotoSignin`).
- Public preview nav brand now comes from `cms.meta.brand` (PublicNav → "Calm Harbor Spa" on Beauty,
  "Aircove" fallback; nav composition unchanged).
- Evidence: `previews/calm-harbor/pricing-{state}-{width}-{mode}.png` — REAL viewport pixels: desktop 1440 (1440×900, upscaled scaled-to-fit capture) + mobile 390 (true 390×540), ready/loading/empty × light/dark.
- Demo PIM response lives in `seo-fixtures.js` → `Beauty.pimPricing` (Codex swaps it for the real
  public Core PIM response; the old bridal from:null quote row is gone — quotes are not part of this release).

### previews — real viewport sizes
`previews/desktop-1440.png` (1440×768), `tablet-768.png` (768×540), `mobile-390.png` (390×527) — actual
per-viewport layouts (desktop landing / tablet orders / mobile Snow-Removal storm calendar), **dev toolbar
hidden**. Desktop shows the true two-column 1440 layout. (Method: render each at its true CSS width — 1440
scaled-to-fit then upscaled since the capture pane is ~924px — crop to the exact width, trim trailing
whitespace.)
Wave 7: `care-{hvac-equipment,snow-season-log,pest-monitoring}-{768,390}.png` +
`care-{lawn-program,pool-water,roofing-report}-ref-390.png`.
Wave 9: `care-{health-plan,beauty-routine}-{768,390}.png` and `seo-{health,beauty}-{768,390}.png`
(public landing) — true PNGs at exact viewport widths (768×540 / 390×540), dev toolbar hidden, cropped to
the centered viewport frame. Faithful 1440 desktop captures still can't be produced in this workspace
(capture pane ~908px) — regenerate in a ≥1440 browser window if needed.

### housekeeping
- `source.html` sets `<link rel="icon" href="data:,">` to silence the `/favicon.ico` 404.
- Font `<link>` carries a "Known dependency" comment; `tokens.css` has a local-first `@font-face` fallback.
- No `.DS_Store` in the package.

---

## ⚠ Known issues / open items (non-blocking)
- **Google Fonts Manrope** is fetched from the CDN (preview only). Fallback is wired (`ManropeFallback`
  local + `system-ui`), but for a fully offline/CI transfer, drop local `woff2` files in `styles/` and swap
  the `<link>` for an `@font-face`. See README → "Known dependencies & issues".
- **Responsive is container-width driven** (`ResizeObserver` → `.vw-mobile/.vw-tablet/.vw-compact`), not
  `@media`. Intentional for the harness; Codex may convert to `@media`.
- **Over-import in ESM** is intentional/harmless — the auto-generated `import` lines may import a symbol a
  file doesn't use.
- Deeper per-field `disabled` states and real validation are Codex's to add; `scenarios.notImplementedYet`
  is empty (all required routes implemented).

## Guardrails
- Keep the modular structure — do **not** collapse back to one big `app.js`.
- Pure decomposition only. No redesign, no business logic.
- Keep `aircove-portal-design/` untouched as the fallback.
- Any contract change (attributes / ids / class names / fixture shape) → document in README + this file.

## Wave 15 — Calm Harbor commercial lifecycle — done
Account / Purchases / purchase detail / My plan / sellable Shop / server cart / SIMULATED checkout,
per the "spa purchases, simulated checkout, and account" design request + product contract. See
README §Wave 15 for the full contract. Key facts for continuation:
- **New routes** (stable ids): `account`, `purchases.list`, `purchase.detail`, `plan`, `cart`;
  `checkout` renders SpaCheckout on Beauty (other verticals keep the accepted generic checkout).
  New files: `src/routes/Spa{Account,Purchases,PurchaseDetail,Plan,Cart,Checkout}Page.js`,
  `src/components/spa/CommerceBits.js` (UnavailableState, SimulationBadge, KindChip, MoneyRows,
  spaGate). SpaShopPage gains the sellable variant; SpaTopNav gains the Account link + bag
  indicator; BookingDrawer gains the simulated booking-review bridge.
- **New capability**: `retail-commerce-open` (`state.spaRetail`, `data-retail` hook) gates
  sellable Shop / cart / checkout. Account entries are available|unavailable per contract;
  staging keeps its raw Orders variant — target purchase labels never touch unmapped `OPEN`.
- **Payment is simulated only**: simulation-notice treatment wherever a payment step or
  confirmation shows; copy Order confirmed / Booking confirmed / Demo checkout completed; success
  renders ONLY from `state.spaResult` readback; no refund consequences anywhere.
- **New actions** in README §Wave 15 / manifest; every entity action carries an opaque
  `data-*-ref`. Demo server = `F.spaServerCart` + `F.spaCommerce.*` fixtures.
- **Dev toolbar**: retail / acct / plan / cart / co / src / hold / bookres selects; `state` select
  adds `unavailable`; `AircovePortal.seedCart()` preview helper.
- **CSS**: additive Wave 15 section at the end of `routes.css` + `responsive.css` (no accepted
  rule modified). manifest wave-15; scenarios wave 15 (descriptionWave15 + new route entries).



## Wave 18 — core-auth CMS login page — done
Static sign-in page served by `core-auth` with a `core-cms` skin. See README §Wave 18 for the
full contract. Key facts for continuation:
- **Files**: `core-auth-login.html` (static entry, next to `source.html` / `seo-landing.html`)
  + `styles/core-auth-login.css` (8th stylesheet, page-specific only) + `previews/wave18/`.
- **No duplication**: the page LINKS `tokens.css` → `base.css` → `shell.css` → `components.css`
  → `routes.css` → `core-auth-login.css`, same order as `source.html`. Tokens, `.btn`, `.field*`,
  `.brand-logo`, `.eyebrow` and the `auth-*` composition stay owned by their existing files —
  do not fork them for this page.
- **Deliberate deviations from the package ground rules** (this page only, required by the
  request): no ES modules, no `h()`, no `ACTIONS`, no build step; responsive is `@container`
  on `.auth-page` instead of the `.vw-*` classes (no script runs to set them); dark mode is
  the server-rendered `data-mode` attribute only.
- **Runtime contract**: one `<form data-core-auth-login>`, fields `username` / `password`,
  hidden CSRF input, and six verbatim placeholders — `{{LOGIN_ACTION}}`,
  `{{CSRF_PARAMETER_NAME}}`, `{{CSRF_TOKEN}}`, `{{RESET_PASSWORD_URL}}`, `{{ERROR_DISPLAY}}`,
  `{{LOGOUT_DISPLAY}}`. State is ONLY the two inline `display` values. Do not add a class
  toggle, a `data-state` switch or scripted visibility.
- **Copy slots**: `data-copy="<slot>"`, one visible string per element (18 slots).
- **JS**: one inline enhancement block (show/hide password). Deleting it must stay a no-op —
  the JavaScript-disabled render is the acceptance artifact.
- **Harness**: `data-dev-toolbar` only; the three states preview through `:target` CSS with no
  script, so the JS-disabled captures can be taken from the same file.

## Wave 19 — core-auth CMS two-factor page — done
Static 2FA page served by `core-auth` after login requires a second factor. Answers the wave-18
open item. See README §Wave 19 for the full contract. Key facts for continuation:
- **Files**: `core-auth-2fa.html` (transfer source) + `core-auth-2fa-preview.html` (GENERATED
  evidence harness — never transfer it, regenerate it from the source) +
  `styles/core-auth-2fa.css` (9th stylesheet) + `data/core-auth-2fa-parameters.json` (17
  localized parameters with safe example copy) + `data/core-auth-2fa.manifest.json` (four-state
  scenario/manifest coverage + validation note) + `previews/wave19/` (29 PNGs + one synthetic
  QR stand-in).
- **No duplication**: the page LINKS `tokens.css` → `base.css` → `shell.css` → `components.css`
  → `routes.css` → **`core-auth-login.css`** → `core-auth-2fa.css`. `core-auth-login.css` is
  treated as the SHARED standalone-auth layer (page/centering/head/title/sub/note, the assertive
  region, the focus convention, the container breakpoints) — do not fork it. The 9th sheet holds
  only the enrollment panel, QR frame, setup key, notice and code field.
- **Runtime contract**: one `<form data-core-auth-2fa>`, field `code`, hidden CSRF input, and
  eight verbatim placeholders — `{{TWO_FACTOR_ACTION}}`, `{{CSRF_PARAMETER_NAME}}`,
  `{{CSRF_TOKEN}}`, `{{SETUP_DISPLAY}}`, `{{VERIFY_NOTICE_DISPLAY}}`, `{{ERROR_DISPLAY}}`,
  `{{TWO_FACTOR_QR_CODE}}`, `{{TWO_FACTOR_SECRET}}`. `{{TWO_FACTOR_OTPAUTH_URI}}` is
  deliberately unreferenced. State is ONLY the three inline `display` values.
- **Zero JavaScript**: the transfer source has no `<script>` tag and no event attribute at all —
  not even login's show/hide enhancement. Do not add one; the page renders a live CSRF token and
  a generated secret.
- **States**: `setup-ready` / `setup-error` / `verify-ready` / `verify-error`. setup-error must
  keep the runtime QR and key untouched — CMS never stores, defaults or regenerates them.
- **Unchanged**: `manifest.json`, `scenarios.json`, `core-auth-login.html`, every accepted
  stylesheet. Wave 19 adds files only.
