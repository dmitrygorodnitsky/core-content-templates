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
through waves 7–9 (current version: `wave-9`).

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
