# Punch list — Calm Harbor design fidelity audit

Every finding, classified, located, routed. Citations live in the per-surface
findings files; this file is the work queue.

| source file | slice | findings |
| --- | --- | --- |
| `manifest-diff.md` | D1 | inventory |
| `findings-components-appointments.md` · `findings-copy-hooks-appointments.md` | D2/D3 | `A-01`…`A-27`, `S-01`…`S-03`, `H-6` |
| `findings-components-account.md` · `findings-copy-hooks-account.md` | D2/D3 | `AC-C01`…`AC-C35`, `CP-04`…`CP-12`, `HK-01`…`HK-05` |
| `findings-components-commerce.md` · `findings-copy-hooks-commerce.md` | D2/D3 | `C-01`…`C-23` |
| `findings-states.md` | D4 | `SG-01`…`SG-04`, `PL-01`, `LT-01`…`LT-05`, `INV-01` |
| `responsive/README.md` | D5 | `RS-01`, `RS-02` |

**Totals: 118 findings** — `invention` 22 · `gap` 12 · `drift` 34 · `decision` 33
· `design-gap` 15 · inventory 2.

## Routing summary

| route | count | meaning |
| --- | --- | --- |
| **fixed here** | **0** | see §Why nothing was fixed |
| ticket | 27 | a defect with a determined correct output; no design judgement needed |
| brief | 15 | needs a designer's answer — five briefs filed |
| accepted with reason | 43 | reason recorded per finding |
| decision (not a defect) | 33 | follows a recorded product decision |

## Why nothing was fixed in this wave

No file under `runtime/` was touched. Three reasons, in order of weight:

1. **The severe findings are not presentation.** The top five all originate in
   `runtime/src/adapters/**`, `runtime/src/actions.js` and
   `runtime/src/state.js` — outside the `production presentation` ownership zone
   (`routes/**`, `components/**`, `styles/**`) this wave may correct.
2. **The clearest "inventions" are load-bearing.** `A-24`
   (`data-visual-id="support-dismiss"`) has no design counterpart and looks
   deletable — but `calm-harbor-customer-portal-manual-check.mjs:189` clicks it.
   Removing it breaks a green check. Same shape as `SG-01`.
3. **Several runtime files are byte-identical to the design.** `SpaCartPage.js`
   and `CommerceBits.js` match exactly; `AC-C03`'s unreachable `unavailable`
   treatment lives in code that *is* the accepted source. "Fixing" it would mean
   diverging from the reference this wave measures against.

Consequently the release compile was not mandatory. It was run anyway as a tree
health check and is green and idempotent:
`build-calm-harbor-target-runtime ok`, `git status` clean before and after.

## HIGH — the eleven that should move first

| id | class | surface | runtime | design counterpart | route |
| --- | --- | --- | --- | --- | --- |
| `C-03` | invention | checkout | `actions.js:597-608` computes `Math.round(subtotal * 0.08)`; `:410-412` sends `total`/`taxes` to `createOrder` | absent — accepted confirm is a readback, `design-inbox/.../SpaCheckoutPage.js:194-198` | **ticket, highest** — an invented tax is *persisted to Core*, not merely displayed |
| `C-01` | invention | cart + checkout | `actions.js:318,329` assembles `displayTotals` | `design-inbox/.../SpaCartPage.js:1-8,102` "renders returned display totals verbatim and never recomputes" | ticket |
| `C-02` | invention | plan checkout | `SpaCheckoutPage.js:45` fabricates `tax: "$0.00"` | absent | ticket |
| `CP-12` / `AC-C25` | invention | account | `SpaAccountPage.js:23-26,64-65,72-73` — "A personal balance or renewal record is not exposed by the current API", and the foot link is swapped to `pricing` | absent; design `SpaAccountPage.js:15-21` has no `spaCurrentApiDemoOpen` branch | ticket — **user-visible falsehood in production**: the plan page shows the balances this page denies, and the swap removes the only route to it |
| `CP-10` / `AC-C23b` | invention | profile | `SpaProfilePage.js:147` "Phone and visit preferences are not returned…" while `:84` renders the live phone | design `:123-142` renders a full `spa-profile-preferences` panel | ticket — one clause is false |
| `A-06` | invention | appointments | `core-spa-demo-adapter.js:520-521` `visitMode: "salon"`, `location: "Harbor Front studio"` | `design-inbox/.../SpaAppointmentsPage.js:146` provides the honest `" · location details not provided yet"` | ticket — a fabricated constant makes the accepted honest state unreachable |
| `A-07` | drift | appointments | `core-spa-demo-adapter.js:553-558` falls through to `"Confirmed"` | `design-inbox/.../SpaAppointmentsPage.js:5-7` — labels are backend-owned, "never derived from raw Core statuses in the browser" | ticket — both sibling adapters raise instead |
| `A-16` | drift | booking | `SpaBookingFlow.js:180-191` renders `F.spaBooking.days`; `actions.js:456` books from it | design `:181-191` + `:5-8` declare slots server-returned | ticket — a booking is made against fixture availability |
| `A-27` | drift | appointments | `SpaAppointmentsPage.js:224-226` — "Live from the public catalog — shown as published." above `F.spa.pim.services` | design `:220-222` identical *when the catalog was fixture on both sides* | ticket — `spaCatalogServices()` already exists and is used elsewhere; one-line truth restoration |
| `C-06` | gap | shop | `state.js:156-160` infers `sellable` from a PIM row's presence | `design-inbox/src/state.js:180-182` "SERVER sellability … never inferred in the browser" | ticket — `out-of-stock`, `price-changed`, `variant-required` and `variant-picker` are dead live |
| `C-07` | gap | cart | `CartRow.js:6,14,16,19` — no `data-state`, no disabled controls, no failure note | `design-inbox/.../CartRow.js:9,10,11,17,20,22,25` | ticket — the wave-13 row lifecycle was dropped |

Common thread across nine of the eleven: **the live path invents or infers what
the server did not provide**, which is the one rule
`master.md` §Core Rules 5 and `ARCHITECTURE.md` both freeze. None is a styling
question; every one has a determined correct output, which is why they are
tickets and not briefs.

## Briefs filed (15 findings → 5 briefs)

| brief | findings covered |
| --- | --- |
| `calm-harbor-plan-expired-and-terminal-enrolment-states.md` | `SG-03`/`AC-C17` |
| `calm-harbor-purchase-completed-return-state.md` | `SG-04` |
| `calm-harbor-partially-unavailable-sections.md` | `AC-C10`, `AC-C11`, `AC-C23b`, `A-04` |
| `calm-harbor-route-root-access-and-source-failure-states.md` | `SG-01`, `SG-02`, `A-21`, `A-10` |
| `calm-harbor-appointment-status-and-slot-availability-states.md` | `A-05`, `A-08`, `A-17`, `A-19`, `C-22` |

Two design-gaps are deliberately **not** briefed: `C-05` (the accepted checkout
fixture asserts a 15-minute hold, a "2 days · free" SLA and a 14-day retention
policy Core does not provide) is a finding **against the design** under
`master.md` §Core Rules 5 — the runtime omitting them is correct, and the fixture
should lose the claims rather than the runtime gain them. `RS-01` is a defect in
this package's own method, recorded in D5.

## Tickets (27) — determined correct output, no design judgement

`C-01` `C-02` `C-03` `C-04` `C-09` `C-10` `C-17` `C-18` `C-21` — invented
presentation and fabricated copy on the commerce surfaces.
`C-06` `C-07` `C-08` — accepted lifecycles and server states dropped in live mode.
`C-13` `C-15` — hardcoded heading; checkout not migrated to `moduleStatus`.
`A-06` `A-07` `A-16` `A-18` `A-27` — appointment and booking fixture leakage and
guessed labels.
`A-26` — `ActionButton` lost the accepted pending treatment (in-flight buttons are
neither labelled nor disabled).
`AC-C03` — the accepted `unavailable` treatment is unreachable on five routes.
`AC-C29` `AC-C31` — browser-assembled money with an invented currency; route-state
precedence diverging from Purchases.
`CP-06` `CP-07` `CP-09` `CP-10` `CP-11` `CP-12` — unaccepted or false live copy.
`INV-01` — `runtime/data/scenarios.json` carries 17 of 25 registered routes.
`C-23` — the wave-14→17 inventory is absent from `runtime/manifest.json`.

### Two inventory tickets, with a trap

`runtime/manifest.json` is stale in two independent ways (D1): its
`fileInventory.srcJavaScript` is 95 against 96 on disk, and it declares 142
component ids where the source emits 101 it never names.

**Correcting the manifest alone will not make `config-behavior-check.mjs` pass.**
Line 626 compares the manifest to disk; line 627 pins the same numbers as a
literal Wave-17 contract. Both must move together. Line 627 is in `scripts/`,
outside this wave's ownership, which is why this is routed rather than fixed.

## Accepted with reason (43) — a reason, not "looks fine"

- `S-01` `S-02` `S-03` / `C-19` `C-20` / `AC-C35` — stylesheet deltas: a
  `.link-action` control reset (verified a no-op on the `<span>`s these surfaces
  emit), one relocated block, one trailing newline. 724/724 `routes.css`
  selectors identical.
- `C-12` — `data-state="ready"` on `product-model-list`: the **runtime is the
  compliant side**; `design-inbox/manifest.json` components[190] declares
  `states: ["ready","unavailable"]` with "data-state on the container", and the
  design source omits it.
- `A-08` — `Needs confirmation` is an accepted badge no Core workflow state maps
  to. Accepted until a mapping exists; recorded in D4's matrix.
- `PL-01` — `cursor-loading` is declared but unreachable live
  (`SpaPurchasesPage.js:100` is guarded by `!live`). Accepted: no server cursor
  contract exists yet.
- `LT-01` `LT-02` — `activity.open` and `support.retryMessage` exist in the design
  and not the runtime. Accepted: Activity and Support are outside the nine
  priority surfaces and outside the Calm Harbor capability set.
- `LT-03` `LT-04` `LT-05` — `activity-control`, `routine-tasks`/`routine-task-row`,
  `seo-public-header` are runtime-only modules on the multi-vertical shell, the
  care hub and the SEO surface. Accepted: none is a Calm Harbor surface.
- `RS-02` — the wave16 `plans@1440` 339-pixel diff (0.03%, identical DOM metrics,
  same width passing at 1180 in the same run). Accepted: rasterisation
  nondeterminism against a `threshold: 0` suite.
- `A-24` / `H-6` — `data-visual-id="support-dismiss"` has no design counterpart.
  **Accepted and explicitly protected**: `calm-harbor-customer-portal-manual-check.mjs:189`
  clicks it. Deleting it would break a check to satisfy a census.
- `AC-C30` — invented fallback labels, dead under all three shipped configs.
- `AC-C27` `AC-C09` — unreachable staging branches.
- `HK-02`…`HK-05`, `AC-C04` `AC-C08` `AC-C13` `AC-C22` `AC-C32` `AC-C34`,
  `C-11` — low-severity drift with the reason recorded per finding.

## Decisions (33) — not defects

Confirmed against `…/calm-harbor-customer-portal-full-activation-program/evidence/`:
`A-09` `A-12` `A-14` `A-15`, `AC-C01` `AC-C02` `AC-C05` `AC-C07` `AC-C12`
`AC-C14` `AC-C16` `AC-C18` `AC-C19` `AC-C20` `AC-C21` `AC-C23a` `AC-C24`
`AC-C26` `AC-C28` `AC-C33`, `C-14` `C-16`, `CP-04`, `HK-05`, and the nine
"verified identical" component groups.

Two carry a correction to the record:

- **`CP-08` / `AC-C15`.** `S4.md` §3 states "Both treatments are accepted
  design". The *gate* is a decision and reads as intended, but the
  `plan-current-api-unavailable` block itself has **zero** design counterpart —
  0 matches across 315 `design-inbox/` files, a different `data-visual-id`,
  glyph and copy from the accepted `UnavailableState`. Classified `decision` on
  the gate, `invention` on the block. Independently confirmed in D1 §4.
- **`CP-04`** (Known Starting Point 4, "Ready — please pick up by …") is a
  **transfer, not an invention**. Every word is the accepted string
  (`design-inbox/data/fixtures.js:861`); only the date is substituted, in the
  normalizer (`core-orders-adapter.js:300-306`), and the component is
  byte-identical. The dateless variant is a minor design-gap folded into the
  partially-unavailable brief.

## Known Starting Points — all six closed

| # | item | verdict |
| --- | --- | --- |
| 1 | Expired plan card | `design-gap` **confirmed** — accepted vocabulary is four labels (`design-inbox/data/fixtures.js:988`), no `Expired`; the adapter raises `plan-status-unmapped` rather than guessing. Brief filed. |
| 2 | Purchase card for `RETURN_REQUESTED` / `RETURNED` | `design-gap` **confirmed but narrower than recorded** — `RETURN_REQUESTED` already *has* an accepted treatment (`design-inbox/.../SpaPurchaseDetailPage.js:28`, `return-accepted-for-review` is in the grammar). Only a completed `RETURNED` lacks one. Brief asks for that alone. |
| 3 | `SpaPlanPage` "not in the current API" gated on the plan module | `decision` on the gate — verified it reads as intended and the accepted plan-card path is what renders (all three shipped configs enable `plan`, so the short-circuit never fires). `invention` on the block. See `CP-08` above. |
| 4 | Purchase `attention` "Ready — please pick up by …" | **transfer**, classified `decision`. See `CP-04` above. |
| 5 | Per-line total omitted while the design fixture shows `displayTotal` | `design-gap` **filed against the design** — Core provides none, so omission is correct (S3 §5a). Secondary runtime defect `AC-C11`: `dom.js:16-19` skips `null` children, so an empty `<b data-bind="purchase.lines[].displayTotal">` still renders where the design shows an amount. Ticketed + briefed. |
| 6 | Plan page state from `moduleStatus.plan` | `decision` **confirmed** (`SpaPlanPage.js:78-82`, S4 §3). |

## Hook contract — verdict: intact

`data-route` matches **23 for 23** across both source trees. Across the nine
priority surfaces the per-surface set comparison yields **zero** differences on
every route but two, and no hook any browser suite selects on is missing.

Recorded greps: **19 appointments + 16 account + 16 commerce = 51**, all verified
against real output, plus two deliberate negatives (`support-dismiss` and
`plan-current-api-unavailable` absent from `design-inbox/`) whose *absence* is the
finding.

**Correction to this package.** The example grep in `slices.md:91`,
`rg -n 'data-visual-id="plan-card"' …`, **does not hit**. These sources build
attributes as JS object literals, so the working form is
`rg -n '"data-visual-id": "plan-card"'`. Found independently by D1 and by two of
the three surface agents. Every grep recorded in this wave uses the source form.
