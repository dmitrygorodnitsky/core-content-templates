# D5 — Responsive verification and browser-suite verdicts

## Browser used

**System Google Chrome 150.0.7871.129**, driven by Playwright 1.61.1 resolved
through `PLAYWRIGHT_NODE_MODULES`. The bundled chromium was *not* downloaded
(Playwright 1.61.1 wants build 1228; the cache holds 1217), so every run below
used:

```bash
export PLAYWRIGHT_NODE_MODULES=/Users/imighty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
export PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

Supporting modules resolved from the same tree: `pngjs` 7.0.0, `sharp` 0.34.5,
`pixelmatch` 7.2.0.

This matters for one verdict below, so it is stated first: **drift measured
against pixels shot by a different browser is not a finding about the layout.**

## The instrument — and why `previews/` is not it

`slices.md` §D5 asks for runtime renders compared against
`design-inbox/previews/` at 390 / 768 / 1180 / 1440. That comparison cannot be
made as a pixel diff, and the reason is in the corpus itself.

All 217 stored previews, by pixel dimension:

| dimensions | count | example |
| --- | --- | --- |
| **908×540** | **170** | `calm-harbor/01-dark.png`, `wave16/profile-ready-768-light.png`, `wave17/product-ready-390-light.png` |
| 390×540 | 13 | `calm-harbor/pricing-empty-390-light.png` |
| 924×540 | 12 | `oidc-checking-session-1440-light.png` |
| 1440×900 | 6 | `calm-harbor/pricing-ready-1440-light.png` |
| 768×540 | 5 | `care-beauty-routine-768.png` |
| 390×523 · 768×523 | 6 | `care-hvac-equipment-390.png` |
| 1440×768 · 390×527 · 1440×80 | 3 | `desktop-1440.png`, `wave14/shell-1440-light.png` |
| 1180×1410 · 1440×1410 | 2 | `wave14/staging-orders-long-1180-light.png` |

**78% of the corpus is a fixed 908×540 frame.** `wave17/product-ready-390-light.png`
is 908 pixels wide, not 390. The width in the filename names the *scenario* the
designer captured, not the raster width. These are proof images of a framed
viewport, not width-native captures, and diffing a 390-wide runtime render
against a 908-wide thumbnail measures the frame, not the layout.

The correct instrument is the one this repo's own suites already use: **re-render
`design-inbox/source.html` at the target width, in the same browser, in the same
run, and diff that against the runtime at the same width.** Same browser on both
sides removes the cross-browser variable entirely. That is what the per-wave
visual suites do, and it is what the measurements below rest on.

Recorded as finding `RS-01`: D5's stated method cannot be executed against
`previews/` as written. The package's own instruction should be corrected to
name the same-run re-render. This is a note against the method, not against the
runtime or the design.

## Coverage achieved at the four widths

| suite | surfaces | widths | pairs | result | measured by |
| --- | --- | --- | --- | --- | --- |
| `calm-harbor-wave15-visual-check.mjs` | 12 paired surfaces | 390/768/1180/1440 | 12 | **pass** | inherited — not re-run |
| `calm-harbor-wave16-visual-check.mjs` | appointment, booking, plans, profile | 390/768/1180/1440 | 16 | **15 identical, 1 sub-pixel** | this wave, Chrome 150 |
| `calm-harbor-wave17-visual-check.mjs` | shop, product, product-no-media, orders | 390/768/1180/1440 | 16 | **pass**, `changed=0` | inherited — not re-run |
| `calm-harbor-wave14-visual-check.mjs` | orders, services, products | 390/768/1180/1440 | 0 | **blocked — harness** | this wave |

**44 paired surfaces across the four accepted widths**, of which 16 were
measured here and 28 are inherited.

Inheriting wave15 and wave17 is sound rather than lazy: both render reference
*and* implementation in the same run with the same browser, so their comparison
is internally valid whichever browser produced it. Re-running a green suite for
reassurance is explicitly out of scope. What is *not* claimed: that wave15 and
wave17 were verified under Chrome 150 by this wave. They were not.

### wave16 — the one non-zero pair

`plans` at viewport 1440 (element width 1120): `changed=339` px of 1,116,480
(**0.0304%**), `rms=0.116`, `dimensionMismatch=false`.

DOM metrics for all three tracked elements — `spa-catalog`, `plan-offer-list`,
`plan-offer-card` — are **identical** between reference and implementation: same
x, y, width, height, font size, weight, line height, colour, background, border,
border radius. And the same surface at viewport 1180, which renders at the same
1120 element width, came out at `changed=0` **in the same run**.

Identical geometry, identical computed style, same width passing and failing in
one run: that is rasterisation nondeterminism, not layout drift. The suite's
threshold is `0` in `strict` mode, so a single pixel fails it.

Verdict: **not a fidelity finding.** Filed as `RS-02`, a note that the wave16
threshold is tighter than the renderer is deterministic.

Artifacts: `wave16-visual-report-chrome150.json`,
`wave16-diff-plans-1440-chrome150.png` in this directory.

### Baselines were restored

`calm-harbor-wave16-visual-check.mjs` rewrites `reference-*.png`,
`implementation-*.png`, `diff-*.png` and `visual-report.json` into
`…/evidence/W1-wave16-visual/` on every run. All 37 modified files were restored
with `git restore` after the report was captured, so the committed baselines are
the ones the previous browser produced. Verified: `git status --short` on that
directory returns nothing.

## Per-suite verdicts for the four undiagnosed suites

Every one was run and diagnosed. None is reported as "unrun".

### 1. `visual-acceptance.mjs` — **harness: baseline shot by a different browser**

Run: `node app-templates/customer-portal/scripts/visual-acceptance.mjs --verify`
Exit 1 on row 1 of 62, `care-ready-hvac-390`:

```
AssertionError: implementation persisted lossless WebP pixels match fresh PNG capture
changed: 19945 (3.44%), rms: 12.28, componentCount: 9
largest component: 332×60 at (29,1141), 19203 changed pixels
```

Diagnostic images pulled with
`--id=care-ready-hvac-390 --diagnostic-dir=$TMPDIR/…` and inspected directly.
Cropped to the changed region, persisted vs fresh:

- **persisted baseline**: the `Book service for this unit` primary button has no
  fill and grey text; the two `Download` links are grey.
- **fresh Chrome 150 capture**: the same button carries the blue accent gradient
  with white text; the `Download` links are accent blue.

Geometry, text, and position are pixel-identical. Only accent-coloured paint
differs. `.btn--primary` is
`background: linear-gradient(180deg, var(--accent-2), var(--accent)); color: #fff`
(`runtime/styles/components.css:18`) — no `color-mix`, no `@property`, no
`oklch` anywhere in the stylesheets, so this is not a modern-colour-feature gap;
the accent simply was not painted in the environment that produced the stored
packet.

The stored S4 packet was captured by a different renderer than the one available
here. Per the rule at the top of this file, that is not a finding about the
layout. It is also not a Calm Harbor finding at all — the 62-row S4 matrix is the
care and SEO verticals of the `customer-portal-wave9-runtime-program`.

**Not runtime drift. Harness/baseline-environment problem.** Re-baselining it
was deliberately not done: it is another program's evidence, and rewriting it
from this browser would destroy their comparison.

### 2. `s7-route-state-check.mjs` — **harness gap opened by an inventory gap**

```
page.evaluate: Error: Missing route parameter id for product.detail
  at src/config.js:237 routePath
  at scripts/s7-route-state-check.mjs:73
```

Line 70–73 iterates `Object.values(routeRegistry)` and calls
`AircovePortal.go(route.id)` for every registered route. `product.detail` carries
`param: "id"` (`runtime/src/config.js:110`) and `routePath` correctly throws when
no param is supplied. The check seeds params for exactly two detail routes —
`order.detail` and `proposal.detail` (lines 99–108) — because those were the only
parameterised routes when it was written.

The runtime is correct: refusing to build a path with a missing required
parameter is the right behaviour. The check enumerates a registry that has grown
by three parameterised routes (`appointment.detail`, `product.detail`,
`purchase.detail`) since wave 9.

**Harness problem.** Related to `INV-01` in D4 — the same waves that added the
routes left `runtime/data/scenarios.json` at 17 of 25.

### 3. `config-behavior-check.mjs` — **runtime drift: a stale manifest**

```
AssertionError: manifest file inventory
  actual (manifest.fileInventory): { stylesheets: 7, srcJavaScript: 95,  runtimeJavaScript: 108 }
  expected (counted on disk):      { stylesheets: 7, srcJavaScript: 96,  runtimeJavaScript: 109 }
```

`config-behavior-check.mjs:626` counts the files on disk and compares them to
what the manifest declares. The manifest is one short. Traced in D1 §3 to commit
`84042c5`, which added two `runtime/src` JS files but bumped the counter by one.

**This one is a genuine finding, not a harness problem** — the check is doing
exactly its job and catching a real inventory drift. It is the only one of the
four that is.

Note for whoever fixes it: `config-behavior-check.mjs:627` *also* pins the same
numbers as a literal Wave-17 contract
(`{ stylesheets: 7, srcJavaScript: 95, runtimeJavaScript: 108 }`). Correcting
`runtime/manifest.json` alone turns this failure into a failure on the next line.
Both must move together. That second line is in `scripts/`, outside this wave's
ownership zones, which is why it is routed rather than fixed here.

### 4. `calm-harbor-customer-portal-manual-check.mjs` — **harness: stub predates the wave-15 order fan-out**

```
page.waitForSelector: Timeout 30000ms exceeded
  waiting for locator('[data-route="orders.list"][data-state="ready"]')
```

Diagnosed by driving the check's own fake backend and dumping the live state
instead of waiting:

```
stateRoute: "orders.list", stateView: "error", stateAccount: "ready",
moduleStatus: { orders: "error", plan: "error", appointments: "empty", … }
rootDataState: "orders-request-failed"
body: "Couldn't load your orders — Your orders didn't load, so nothing is shown
       — we never show stale records. Nothing was changed; try again."
```

Request paths the runtime actually issued:

```
/core/api/user/basic-info.json          served
/core-acct/api/account/list.json        served
/core-bill/api/order/list.json          served
/core-svc/api/appointment/list.json     served
/core-pim/public/…/price-comparison     served
/core-svc/api/project/list.json         404
/core-bill/api/subscription/list.json   404
/core-bill/api/order-item/list.json     404
/core-bill/api/shipment/list.json       404
/core-pim/api/product-model/list.json   404
/core-pim/api/product-review/list.json  404
```

The stub serves a wave-14-era endpoint set. The runtime's wave-15+ typed-line
fan-out (`order-item`, `shipment`) 404s, the orders adapter raises
`orders-request-failed`, and the route never reaches `ready`.

**The runtime is behaving correctly** — it refuses to render a partial order list
when a required call fails, which is the honesty rule working as intended. The
stub is stale.

**Harness problem**, caused by runtime evolution rather than runtime drift.

### 5. `calm-harbor-wave14-visual-check.mjs` — **harness: asymmetric setup** (not in the original four; diagnosed because D5 needs it)

```
locator.waitFor: Timeout 30000ms exceeded
  waiting for locator('[data-visual-id="spa-orders"]')
  at calm-harbor-wave14-visual-check.mjs:81
```

Line 81 is the **implementation** page, not the reference. Probed:

```
route: "auth.oidc", capability: "target-appointments", account: "ready"
visualIds: [app-shell, public-nav, public-home, auth.oidc, core-oidc-auth, …]
```

The check sets `capability: "current-staging"` on the reference page (line 71)
but never on the implementation page, so the staging preview boots at
`target-appointments` and lands on the OIDC entry route. `spa-orders` is never
reachable.

Proven by adding the one missing line to a throwaway copy of the check:

```js
await implementation.evaluate(() => {
  window.AircovePortal.state.capability = "current-staging";
  window.AircovePortal.go("orders.list");
});
```

→ `route: "orders.list"`, `visualIds: [… "spa-orders" …]` renders immediately.

**Harness problem** — a one-line asymmetry, invalidated by the OIDC bootstrap
that landed after this check was written.

## Summary

| suite | verdict | class |
| --- | --- | --- |
| `calm-harbor-wave17-visual-check.mjs` | pass, 16 pairs, `changed=0` | inherited, not re-run |
| `calm-harbor-wave15-visual-check.mjs` | pass, 12 pairs | inherited, not re-run |
| `calm-harbor-wave16-visual-check.mjs` | 15/16 identical; 1 sub-pixel at 0.03% with identical DOM | **harness strictness** |
| `calm-harbor-wave14-visual-check.mjs` | blocked at the implementation page | **harness** |
| `visual-acceptance.mjs` | baseline accent unpainted in the stored packet | **harness / baseline browser** |
| `s7-route-state-check.mjs` | unseeded param on a route added after the check | **harness** |
| `config-behavior-check.mjs` | manifest `fileInventory` one short of disk | **runtime drift — real finding** |
| `calm-harbor-customer-portal-manual-check.mjs` | stub missing the wave-15 order fan-out | **harness** |

One of the four undiagnosed suites was a real finding. The other three, plus
wave14, are stale harnesses. No suite is reported as unrun, and no layout is
described as verified on the strength of reading code.

## What could not be checked

- **`previews/` was not pixel-compared**, for the reason in §The instrument.
  No runtime layout is claimed verified against a stored preview image.
- **wave15 and wave17 were not re-run under Chrome 150.** Their pass is
  inherited from the package's recorded state.
- **wave14's three surfaces** (orders, services, products under the staging
  export) have **no pixel measurement at any width** from this wave. The harness
  fix is a one-line change in `scripts/`, outside this wave's ownership.
