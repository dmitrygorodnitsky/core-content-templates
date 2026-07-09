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
  source.html          6 <link> stylesheets + <script type="module" src="src/app.js">
  README.md            full docs: module tree, contract, deviations, known issues
  HANDOFF.md           this file
  manifest.json        index of components / actions / bindings / attributes
  data/{fixtures.js, scenarios.json}
  src/{dom,state,actions,router,app}.js + components/** + routes/*Page.js   (~47 files)
  styles/{tokens,base,shell,components,routes,responsive}.css                (6 files)
  previews/{desktop-1440,tablet-768,mobile-390}.png
```

### JS split — done and verified
`app.js` was split by function boundary into `dom / state / actions / router / app` + `components/**` +
`routes/*Page.js`. Export names were kept **original** (`OrdersPage.js` exports `Cabinet`, etc.).
Two stray `export` tokens the splitter had injected mid-function-body were removed. **`source.html` boots
over HTTP and all 15 routes render with no JS errors** (orders.list, order.detail, services, pricing,
products, checkout, proposals.list, proposal.detail, profile, calendar, activity, support, landing,
auth.phone, auth.code). Walk them via the dev-toolbar route selector.

### CSS split — done, byte-exact
`styles.css` → 6 files by section: `tokens` (theme/mode vars), `base` (reset/type/keyframes),
`shell` (app-shell/nav/page), `components` (buttons/badges/tabs/cards/panels/states/toast/drawer/dev),
`routes` (route/module layouts), `responsive` (`.vw-*`). All `.vw-*` rules were gathered into
`responsive.css` (loaded last; higher specificity → cascade preserved). A non-whitespace character diff of
the 6 files vs. the monolith `styles.css` is **exactly zero** (69007 = 69007). The page renders styled.

### Auth naming — done (route-based)
Auth is now two routes, **`auth.phone`** and **`auth.code`**, driven by `state.route`. The old
`state.authStep` flag was removed. `router.js` renders `Auth()` for both; `Auth()` picks phone vs. OTP from
the route; `isPublic()` treats both as public; `auth.sendCode` → `auth.code`, `auth.back` → `auth.phone`.
DevToolbar lists both. Matches `scenarios.json`. Flow tested: phone → code (number carried) → back → phone.

### manifest.json — regenerated from real split source
Every `data-module` present in source (77) has a component entry; every ACTION-map key (68) is listed in
`manifest.actions`; `auth-card` props changed `["authStep"]` → `["route"]`; `proposals-list` id aligned to
source `proposal-list`; inline-only pieces are listed as `"inline in X"` factories.

### scenarios ⊆ manifest — drift fixed
`scenarios.json` referenced `profile.updatePaymentMethod`, which is not a real action. Replaced with the
real `profile.setDefaultPayment`. Verified: **every scenarios action exists in manifest** and **every
scenarios route is rendered by `router.js`**.

### previews — real viewport sizes
`previews/desktop-1440.png` (1440×768), `tablet-768.png` (768×540), `mobile-390.png` (390×527) — actual
per-viewport layouts (desktop landing / tablet orders / mobile Snow-Removal storm calendar), **dev toolbar
hidden**. Desktop shows the true two-column 1440 layout. (Method: render each at its true CSS width — 1440
scaled-to-fit then upscaled since the capture pane is ~924px — crop to the exact width, trim trailing
whitespace.)

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
