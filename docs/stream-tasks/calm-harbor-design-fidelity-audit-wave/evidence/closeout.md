# Closeout — Calm Harbor design fidelity audit

## The fidelity verdict

**The transferred presentation is faithful. The live data path is not.**

Those are two different questions and the audit separates them, because
conflating them is how a portal ends up with a pixel-perfect surface telling
customers things that are not true.

**Presentation — high fidelity, and better than the line counts suggested.**
The stable-hook contract is intact: `data-route` matches 23 for 23 across both
source trees, and across the nine priority surfaces the per-surface hook
comparison yields zero differences on all but two routes. No hook any browser
suite selects on is missing. `routes.css` is 724/724 selectors identical.
`SpaCartPage.js` and `CommerceBits.js` are byte-identical to the design. The two
alarming deltas — product detail at −92 lines and shop at −45 — were proved
mechanically to be comments and collapsed calls: 76 elements against 76 with
zero differences, and 53→51 explained by one refactor plus one addition.
**Nothing was lost.** That result alone prevented two unnecessary design briefs.

**Live data path — this is where the wave's value is.** Twenty-two `invention`
findings, and the eleven HIGH ones share a single root cause: **the live path
supplies what the server did not.** An 8% tax computed in the browser and
*written to Core* (`C-03`). A fabricated studio name that makes the design's own
"location details not provided yet" unreachable (`A-06`). An appointment status
that falls through to `Confirmed` for any unmapped Core state (`A-07`). Booking
slots read from fixtures and booked against (`A-16`). A caption reading "Live
from the public catalog" above fixture data (`A-27`). Sellability asserted from
the mere presence of a price row (`C-06`).

Two are worse than drift because they are **false statements to a customer in
production**: the Account page tells the customer their plan balance is not
exposed by the current API while the plan page renders it, and removes the only
link to that page (`CP-12`); the Profile page says the phone is not returned
while displaying it (`CP-10`).

This is the exact rule `master.md` §Core Rules 5 and `ARCHITECTURE.md` freeze,
and it is being broken systematically in one layer — `adapters/`, `actions.js`,
`state.js` — not scattered through the presentation.

## Coverage — what was and was not audited

**Fully audited, no sampling:** all nine priority surfaces, plus Booking flow,
Account, Orders, Catalog, `CommerceBits`, the six `commerce/**` components,
`StatCard`, and the four shell components.

**Sampled under a stated rule:** the 16 non-priority routes (D4 §1).

**Not audited, named:** `PricingPage.js`, `ProductsPage.js`, `CheckoutPage.js`,
`ServicesPage.js` — read only to confirm changed props are exercised. `seo.css`
(107 diff lines) — seen, deliberately not analysed, no Calm Harbor surface uses
it. The Activity, Support and Care long-tail surfaces beyond the sampling rule.

**No DOM was rendered for D2/D3.** Every component and copy claim is
source-level. The single exception is the orders fail-closed path, driven live.
Nothing in this wave is reported as visually verified on the strength of reading
code.

## Pixels

Browser named: **system Google Chrome 150.0.7871.129**, Playwright 1.61.1.

44 paired surfaces at 390/768/1180/1440 — **16 measured here**, 28 inherited
from wave15 and wave17, which were not re-run. The wave16 run produced 15
identical pairs and one 339-pixel difference (0.03%) with identical DOM metrics
on all three tracked elements, at a width that passed in the same run:
rasterisation noise against a `threshold: 0` suite, not layout drift.

**wave14's three surfaces have no pixel measurement at any width** from this
wave. The suite is blocked by a one-line harness asymmetry.

`design-inbox/previews/` was **not** pixel-compared, and no layout is claimed
verified against one: 170 of the 217 stored previews are a fixed 908×540 frame,
so the width in the filename names the scenario, not the raster width.

## Browser suites — every one has a cause

| suite | verdict |
| --- | --- |
| `calm-harbor-wave17-visual-check.mjs` | pass, 16 pairs, `changed=0` — inherited |
| `calm-harbor-wave15-visual-check.mjs` | pass, 12 pairs — inherited |
| `calm-harbor-wave16-visual-check.mjs` | 15/16 identical; 1 sub-pixel — **harness strictness** |
| `calm-harbor-wave14-visual-check.mjs` | **harness** — sets `capability` on the reference page and not the implementation page, so the preview boots to the OIDC route; proven by adding the one missing line |
| `visual-acceptance.mjs` | **harness / baseline browser** — the stored packet's accent colour was never painted; geometry and text pixel-identical |
| `s7-route-state-check.mjs` | **harness** — navigates every registered route without seeding `product.detail`'s required param |
| `config-behavior-check.mjs` | **runtime drift — a real finding.** `manifest.fileInventory` is one short of disk |
| `calm-harbor-customer-portal-manual-check.mjs` | **harness** — the stub predates the wave-15 order fan-out; the runtime correctly refuses to show a partial list |

One of the four previously undiagnosed suites was a real finding. Three, plus
wave14, are stale harnesses. **None is reported as unrun.**

## Disposition

- **Fixed here: nothing**, for the three reasons in `audits/A1.md` §What was
  corrected. The short version: the severe findings are outside this wave's
  ownership zone, the deletable-looking inventions are asserted by live checks,
  and some runtime files *are* the accepted source.
- **Tickets: 27**, each with a determined correct output and no design judgement
  required.
- **Briefs: 5**, covering 15 findings, listed in
  `app-templates/customer-portal/design-requests/README.md`.
- **Accepted with reason: 43.** Every one carries a reason; none says "looks
  fine".
- **Decisions: 33**, confirmed against the program evidence.

## Three things the next wave should not have to rediscover

1. **`SG-01` is not a bug.** The orders route root carrying raw adapter error
   codes reads as a contract break and is asserted deliberately at
   `calm-harbor-customer-portal-manual-check.mjs:198` as the fail-closed signal
   for a foreign Order. Same for `data-visual-id="support-dismiss"`, clicked at
   `:189`. Check `scripts/` before removing anything that looks invented.
2. **Correcting `runtime/manifest.json` alone will not green
   `config-behavior-check.mjs`.** Line 626 compares it to disk; line 627 pins the
   same numbers as a literal Wave-17 contract. Both must move together, and 627
   is in `scripts/`.
3. **Grep the source form, not the DOM form.** These trees build attributes as JS
   object literals. `data-visual-id="plan-card"` finds nothing;
   `"data-visual-id": "plan-card"` finds it. The example in `slices.md:91` is
   wrong and cost three separate agents the same detour.

## Residual risk

The audit is source-level for presentation. A rendered-DOM pass over the
templated and mode-gated hooks — `"account-entry-" + e.key`, and the three that
vanish under live config — would close the last gap between "the source emits
it" and "the browser sees it". The wave16 suite passes partly because it runs in
fixture mode, which is a reason unrelated to live correctness.
