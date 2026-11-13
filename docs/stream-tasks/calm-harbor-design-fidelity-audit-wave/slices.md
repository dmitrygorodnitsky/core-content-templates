# Slices — Calm Harbor Design Fidelity Audit

## Overview

Six slices. D1 produces the machine-readable inventory that makes the rest
tractable. D2–D4 are the audit proper and can be split by surface. D5 is blocked
on tooling. D6 turns findings into action.

The reference is `app-templates/customer-portal/design-inbox/` — a runnable
no-build app (`source.html`, `src/`, `styles/`, `data/`, `manifest.json`,
`previews/`). Serve it and click it; do not read it only as text. It is
**read-only** in every slice.

---

## D1 — Manifest diff

**Intent.** Turn "is anything missing?" into a list instead of an impression.

**Owned paths.** This package's `evidence/manifest-diff.md` and any throwaway
script (keep it out of `scripts/` unless it earns a permanent place).

**Task.**
- Load `design-inbox/manifest.json` and `runtime/manifest.json`.
- Diff four dimensions: components, actions, data bindings, states.
- Produce three buckets: **design-only**, **runtime-only**, **both**. For the
  first two, note the id and where it appears.
- Do not judge yet — D2 explains each one.

**Do not.** Do not "fix" a manifest to make the diff clean. The manifest must
describe reality; changing it to hide a gap is the failure mode this whole wave
exists to catch.

**Validation.** `evidence/manifest-diff.md` lists every id in the first two
buckets with counts, and the counts reconcile against each file.

**Completion signal.** A reviewer can see, in one table, what the design
declares and the runtime does not, and vice versa.

---

## D2 — Component audit

**Intent.** Compare what is actually rendered, component by component.

**Owned paths.** Findings in `evidence/findings-components.md`. Corrections in
`runtime/src/components/**` and `runtime/src/routes/**` only when removing a
clear invention.

**Task.**
- For each runtime component, open its design counterpart and compare
  structure, class composition, element order, and the accepted visual states.
- Classify per `master.md` §Core Rules. Cite `file:line` on both sides.
- Prioritise the surfaces this year's waves touched most: Appointments,
  Appointment detail, Purchases, Purchase detail, Plan, Profile, Shop, Cart,
  Checkout.
- Confirm the six **Known Starting Points** in `master.md` rather than
  rediscovering them.

**Do not.**
- Do not restyle anything to taste.
- Do not "improve" copy.
- Do not treat a recorded product decision as drift — check the program evidence
  first.

**Validation.** Every component in the manifest's `both` bucket has a verdict.
Sampling is not enough for the nine priority surfaces; it is acceptable for the
long tail if the sampling rule is stated.

**Completion signal.** A findings file where each entry is actionable without
re-deriving the comparison.

---

## D3 — Copy and stable hooks

**Intent.** Two failure modes that are invisible until they bite: text that
drifted, and hooks that broke the visual suites.

**Owned paths.** `evidence/findings-copy-hooks.md`.

**Task.**
- **Hooks.** Every `data-route`, `data-module`, `data-action`, `data-bind`,
  `data-state`, `data-visual-id` in the runtime must exist in the design source
  or be justified by a recorded decision. These are contract: the per-wave
  visual checks and `calm-harbor-current-api-browser-check.mjs` select on them.
  Prove the contract with a grep, and record the greps so a future wave can
  re-run them:

  ```
  rg -n 'data-visual-id="plan-card"' app-templates/customer-portal/runtime/src/routes/SpaPlanPage.js
  rg -n 'data-purchase-ref' app-templates/customer-portal/runtime/src/routes/SpaPurchasesPage.js
  ```

  Extend that list to every hook the browser checks actually select on — read
  the check scripts to find them rather than guessing.
- **Copy.** Build a table of user-visible strings per audited surface: runtime
  text, design text, verdict. Flag anything that changed meaning, not just
  wording. Pay attention to strings that were true when designed and are not
  now — the plan page already had one.

**Do not.** Do not rename a hook to match a preference; a hook change is a
contract change and needs its own justification.

**Validation.** Every recorded grep still hits. The copy table covers the nine
priority surfaces.

**Completion signal.** Hook contract proven intact, copy drift enumerated.

---

## D4 — State reachability

**Intent.** Find states the design promised that nobody can reach, and states
users can reach that nobody designed.

**Owned paths.** `evidence/findings-states.md`.

**Task.**
- From `design-inbox/data/scenarios.json` and the design manifest, list every
  declared state per route.
- For each, determine whether the live runtime can reach it, and how. Where it
  cannot, say why: no data, no backend contract, gated by capability, or dead
  code.
- Then invert: enumerate states the live runtime can produce — including error,
  conflict, unauthorized, empty, and the contract-error paths the adapters
  raise — and check each has an accepted treatment.
- Cross-check against the two known `design-gap` items so they land in the same
  table as everything else.

**Do not.** Do not create a treatment for an undescribed state. That is D6's
brief.

**Validation.** A matrix of route × state × reachable × has-treatment, with no
blank cells.

**Completion signal.** Both directions of the gap are enumerated.

---

## D5 — Responsive verification

**Intent.** Confirm the transferred layout holds at the four accepted widths.

**Owned paths.** `evidence/responsive/`.

**Status: runnable.** An earlier draft of this package called D5 blocked on
tooling. That was wrong. Playwright is available — see the Playwright setup
block in `launch-prompt.md` §Validation for the two environment variables and
why they are needed.

Every responsive and pixel check in this repo goes through it:
`scripts/calm-harbor-wave1{4,5,6,7}-visual-check.mjs`, `visual-acceptance.mjs`,
`s7-route-state-check.mjs`, `config-behavior-check.mjs`,
`calm-harbor-customer-portal-manual-check.mjs`.

**Task.**
- Run the per-wave visual suites and `visual-acceptance.mjs` at 390 / 768 /
  1180 / 1440.
- Compare runtime renders against `design-inbox/previews/` for the same
  scenario and width.
- Record every non-zero drift with the pair, and classify it like any other
  finding.
- Record which browser rendered the pixels — bundled chromium or system Chrome
  — because a drift measured against previews shot by the other one is not a
  finding about the layout.

These suites are slow. Start them in the background and work other slices while
they run; do not re-run a green suite for reassurance.

**Diagnose before you judge.** Four suites exited non-zero when this package was
written and nobody looked at why: `visual-acceptance.mjs`,
`s7-route-state-check.mjs`, `config-behavior-check.mjs`,
`calm-harbor-customer-portal-manual-check.mjs`. A suite failing because the
runtime drifted is a finding. One failing because it wants a live session, a
seeded tenant or an argument is a harness problem and belongs in the evidence as
exactly that. Reporting either as "unrun" without saying which is not acceptable.

**If a suite genuinely cannot run**, say which one and why, and do **not**
describe that layout as verified. An unrun check is unrun.

**Validation.** Pixel pairs at four widths, with the browser named; plus a
per-suite verdict for the four above.

---

## D6 — Punch list and design briefs

**Intent.** Convert findings into work someone will actually do.

**Owned paths.** `evidence/punch-list.md`,
`app-templates/customer-portal/design-requests/<slug>.md`.

**Task.**
- Merge D2–D4 into one punch list. Each row: id, classification, surface,
  runtime location, design counterpart, severity, route (fixed here / brief
  filed / accepted with reason).
- Cluster the `design-gap` and `gap` findings into as few briefs as make sense —
  one brief per coherent surface, not one per line.
- Write each brief to `design-requests/` following that directory's README: the
  route, required states and actions, dynamic data shape, responsive
  requirements, reusable source components, and any data-ownership constraint.
  Add it to the README's Calm Harbor list.
- Known briefs likely needed: the **expired plan card**, and the **purchase card
  for a return in progress and a completed return**. Confirm before writing —
  the audit may find they cluster with more.
- For anything accepted rather than fixed, write the reason. "Looks fine" is not
  a reason.

**Do not.** Do not file a brief for something a recorded product decision
already settled. Do not batch unrelated surfaces into one brief to save effort —
the designer answers per surface.

**Validation.** Every finding has a route. Every brief names all six elements
the README requires.

**Completion signal.** The punch list is a work queue, and the briefs are
sendable as-is.

---

## Dependency order

```
D1 ── D2 ──┬── D4 ──┐
      └─ D3 ────────┼── D6
             D5 ────┘   (D5 blocked; D6 proceeds without it and records the gap)
```

D2 and D3 may be split across parallel agents **by surface** — one agent per
route family — because findings files are append-only per surface. Do not split
by dimension, or two agents will fight over the same file.

## Validation matrix

| slice | proof |
| --- | --- |
| D1 | `evidence/manifest-diff.md` reconciles against both manifests |
| D2 | every priority surface has a verdict per component, with both citations |
| D3 | recorded greps hit; copy table covers the priority surfaces |
| D4 | route × state matrix with no blank cells |
| D5 | pixel pairs at four widths, or an explicit `blocked` with reason |
| D6 | every finding routed; every brief complete per the README |
| all | `node app-templates/customer-portal/scripts/build-calm-harbor-target-runtime.mjs` — **release compile**, mandatory if any runtime file was touched, even to delete an invention |

Run from the repo root. If a slice removed an invention, also run the adapter
checks — presentation and adapters share `state.js` selectors more than they
look like they do.

## Operator notes

Status vocabulary is the canonical one: `todo` · `in_progress` · `blocked` ·
`done` · `not_opened` · `stale`. D5 starts `blocked` on tooling, not on a
decision — do not mark it `done` by reasoning about layout from source.

When D2/D3 fan out by surface, each agent owns its own findings file section.
Two agents appending to the same surface is an ownership conflict: re-slice
rather than merge by hand.

Full delegation rules — budget, the mandatory ambiguity line, prompt shape,
first-spawn retry, background lifecycle SLA — are in `launch-prompt.md`
§Delegation protocol.

## Closeout requirements

- Ledger rows `done`, or `blocked` with the tooling reason.
- `audits/A1.md`: what was audited, coverage actually achieved (not intended),
  what was corrected, what was briefed.
- `evidence/closeout.md`: the honest fidelity verdict. If coverage was partial,
  say which surfaces were not audited.
- A delivery note in the parent program's `master.md`, because W6 cannot claim
  visual parity without this wave's result.
