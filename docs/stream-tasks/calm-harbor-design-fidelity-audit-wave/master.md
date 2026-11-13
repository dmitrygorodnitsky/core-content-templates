# Calm Harbor Design Fidelity Audit

Created: 2026-07-28
Level: wave
Parent program: `docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/`

## Goal

Establish, with evidence, how faithfully the production runtime carries the
accepted design — and turn every deviation into either a fix ticket or a
request to Claude Design.

This wave **audits and reports**. It does not redesign, and it does not fix
presentation itself beyond removing outright inventions.

## Core Decision

- `design-inbox/**` is immutable designer-owned truth. It is the reference, and
  it is never edited by this wave for any reason.
- `runtime/**` is production. Where it disagrees with the design source, the
  design source wins unless a recorded product decision says otherwise.
- Presentation that does not exist in the accepted source is **not** something
  to invent. It is a brief for Claude Design in `design-requests/`.
- The output that matters is a **punch list**: every finding classified, located,
  and either fixed, ticketed to design, or explicitly accepted with a reason.

## Scope

In scope:

- component-level comparison of `runtime/src/**` against `design-inbox/src/**`;
- the manifest diff: `design-inbox/manifest.json` versus `runtime/manifest.json`
  (components, actions, data bindings, states);
- copy and label fidelity, including strings that changed meaning as the portal
  went live;
- states declared by the design but never reachable in the runtime, and states
  the runtime can reach that the design never described;
- stable hooks: `data-route`, `data-module`, `data-action`, `data-bind`,
  `data-state`, `data-visual-id` — these are contract, and drift breaks the
  visual suites;
- responsive behaviour at 390 / 768 / 1180 / 1440;
- producing the punch list and any design briefs.

Out of scope:

- Any edit to `design-inbox/**`.
- Redesign, or "improving" the accepted design.
- New features, new routes, new data.
- Backend work.
- Fixing things that are a recorded product decision rather than drift — check
  the program evidence before filing.

## Core Rules

1. **Classify every finding.** One of: `invention` (runtime shows something the
   design never described), `gap` (design describes something the runtime does
   not render), `drift` (both exist but differ), `decision` (differs because a
   recorded decision said so — not a defect), `design-gap` (reality has a state
   the design never covered).
2. **Cite both sides.** Every finding names the runtime file and line and the
   design-inbox counterpart, or states plainly that the counterpart is absent.
3. **Never fix by inventing.** A `gap` or `design-gap` becomes a brief, not a
   guess. Only an `invention` may be removed outright, and only when removal
   restores the accepted state.
4. **A recorded decision is not a defect.** The program has settled decisions
   about plans, order taxonomy and booking-without-holds; presentation that
   follows them is correct even where the original design assumed otherwise.
5. **Do not weaken the honesty rules to match a picture.** If the design shows a
   figure the server does not provide, the finding is against the design, not
   against the runtime that omits it.

## Ownership Zones

| zone | paths | rule |
| --- | --- | --- |
| reference | `app-templates/customer-portal/design-inbox/**` | read-only, always |
| production presentation | `runtime/src/routes/**`, `runtime/src/components/**`, `runtime/styles/**` | may be corrected only to remove an invention or repair drift |
| inventory | `runtime/manifest.json` | update when the audit proves the real inventory differs |
| findings | this package's `evidence/` | the punch list lives here |
| design requests | `app-templates/customer-portal/design-requests/` | one brief per design-gap cluster |

## Known Starting Points

The audit does not start from zero. These are already identified and should be
confirmed, not rediscovered:

| item | classification | source |
| --- | --- | --- |
| Expired plan card — `EXPIRED` enrollment state has no accepted treatment | `design-gap` | `../calm-harbor-customer-portal-full-activation-program/evidence/S3.md` §5 |
| Purchase card for `RETURN_REQUESTED` / `RETURNED` | `design-gap` | same |
| `SpaPlanPage` "Personal plan details aren't in the current API" is now gated on the plan module rather than shown unconditionally | `decision` — verify it reads as intended, and that the accepted plan-card path is what renders | `…/evidence/S4.md` §3 |
| Purchase `attention` copy "Ready — please pick up by …" assembled from the accepted phrasing plus live window data | **verify** — is this transfer or invention? | `…/evidence/S3.md` §4 |
| Per-line total omitted on a purchase because Core provides none, while the design fixture shows `displayTotal` | `design-gap` or accepted omission — decide and record | `…/evidence/S3.md` §5a |
| Plan page state now comes from `moduleStatus.plan`, matching Purchases | `decision` | `…/evidence/S4.md` §3 |

## Wave Ledger

| slice | zone lead | owner | status | depends_on | validation | done_when |
| --- | --- | --- | --- | --- | --- | --- |
| D1 manifest diff | inventory | executor | **done** | — | `evidence/manifest-diff.md` | every component/action/binding present in one manifest and not the other is listed |
| D2 component audit | production presentation | 3 surface agents | **done** | D1 | `evidence/findings-components-{appointments,account,commerce}.md` | every runtime component compared to its design counterpart |
| D3 copy and hooks | production presentation | 3 surface agents | **done** | D1 | `evidence/findings-copy-hooks-*.md`; 51 greps verified | stable hooks match the design; every user-visible string is traced |
| D4 state reachability | production presentation | executor | **done** | D2 | `evidence/findings-states.md` | declared-but-unreachable and reachable-but-undescribed states are both listed |
| D5 responsive | production presentation | executor | **done** | D2 | `evidence/responsive/README.md` | drift at every width is measured and classified; the four undiagnosed suites have a verdict each |
| D6 punch list and briefs | findings, design requests | executor | **done** | D2–D4 | `evidence/punch-list.md`; 5 briefs | every finding classified and routed |

D5 is `done`, not `blocked`: the earlier draft's tooling claim was wrong.
Playwright 1.61.1 drove system **Google Chrome 150.0.7871.129**; 44 paired
surfaces at the four widths (16 measured here, 28 inherited), and all four
undiagnosed suites plus wave14 have a named cause. The one coverage gap —
wave14's three surfaces have no pixel measurement — is stated in
`evidence/closeout.md` rather than hidden behind a green ledger row.

## Definition of Done

- A punch list exists in which **every** finding has: classification, runtime
  location, design counterpart (or a statement of absence), and a route —
  fixed, briefed, or accepted-with-reason.
- Inventions are removed or, where removal is not safe in this wave, ticketed
  with the exact reason.
- One design brief per design-gap cluster in `design-requests/`, each naming
  route, states, actions, data shape and the four widths, per that directory's
  README.
- `runtime/manifest.json` reflects the real production inventory.
- The stable-hook contract is proven intact by grep.
- Every browser suite has a verdict: passed, or failed with the cause named —
  runtime drift is a finding, a missing session or seed is a harness problem.
  Nothing is reported as passed on the strength of reading code, and no crash is
  filed as "unrun" without its cause.

## Delivery Notes

| slice | commit | artifact |
| --- | --- | --- |
| D1 | `9b28c35` | `evidence/manifest-diff.md` |
| D4 | `4aca731` | `evidence/findings-states.md` |
| D5 | `a66ae1c` | `evidence/responsive/README.md` + Chrome-150 artifacts |
| D2/D3 appointments | `88ca410`, `103cccb` | `evidence/findings-{components,copy-hooks}-appointments.md` |
| D2/D3 account | `f7fc636` | `evidence/findings-{components,copy-hooks}-account.md` |
| D2/D3 commerce | `bb34032` | `evidence/findings-{components,copy-hooks}-commerce.md` |
| D6 | see closeout commit | `evidence/punch-list.md`, `evidence/closeout.md`, `audits/A1.md`, 5 briefs |

**Verdict: the transferred presentation is faithful; the live data path is not.**
118 findings — `invention` 22 · `gap` 12 · `drift` 34 · `decision` 33 ·
`design-gap` 15 · inventory 2. Nothing was corrected in `runtime/`, for the three
reasons in `audits/A1.md` §What was corrected. Release compile run as a health
check: green and idempotent.

### Corrections to this package's own text

- **Known Starting Point 2 is broader than reality.** `RETURN_REQUESTED` already
  has an accepted treatment (`return-accepted-for-review`); only a completed
  `RETURNED` lacks one. The brief asks for that alone.
- **`slices.md:91`'s example grep does not hit.** These sources build attributes
  as JS object literals; the working form is `rg -n '"data-visual-id": "plan-card"'`.
- **D5's stated method cannot be executed as written** (`RS-01`): 170 of the 217
  files in `design-inbox/previews/` are a fixed 908×540 frame, so the width in a
  filename names the scenario, not the raster width. The correct instrument is
  the same-run re-render the per-wave suites already use.
