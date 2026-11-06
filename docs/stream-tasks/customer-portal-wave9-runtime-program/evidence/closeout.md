# Customer Portal Wave 9 Runtime Program Closeout

Status: complete
Date: 2026-07-11
Design baseline: `c9879ae`
Final implementation commit: this closeout commit

## Result

The program delivered both required surfaces without React or a bundler:

1. An authenticated, profile-driven customer portal covering 17 routes, eight
   verticals, three profiles, modular Care, existing commerce/proposals/PIM,
   guards, truthful fixture actions, and explicit unavailable states.
2. A separate public, server-visible SEO CMS document with strict authored
   metadata/content, native FAQ, canonical policy, progressive enhancement,
   and no portal auth, shell, or hash-router dependency.

The accepted designer source remains immutable. Visual verification compares
the executable design and runtime at 390/768/1180/1440 with zero accepted drift
outside two explicit contract-state rows.

## Stage Evidence

- [S0 contract and baseline](S0.md)
- [S1 shared config, themes, profiles, router](S1.md)
- [S2 Care executable transfer](S2.md)
- [S3 public SEO executable transfer](S3.md)
- [S4 visual acceptance](S4.md)
- [S5 data and command activation](S5.md)
- [S6 CMS packaging and export](S6.md)
- [S7 validation and audit](S7.md)
- [A1 independent audit](../audits/A1.md)

## Implementation Commits

```text
6ce1980  close S0 contract/baseline
431469a  close S1 config/router
28c1634  close S2 Care transfer
c849072  close S3 public SEO transfer
54b1cd9  close S4 visual acceptance
4710778  close S5 activation
6c89f04  close S6 CMS/export
this commit  close S7 and the program
```

Stage-open commits are recorded in `master.md` and the stage evidence files.

## Behavioral Summary

- Vertical/profile/theme/module configuration is CMS-driven and deterministic.
- Care is normalized across HVAC, Snow, Lawn, Pool, Roofing, Pest, Health, and
  Beauty with real loading/empty/error/disabled/unauthorized treatment.
- Health data remains logistics and secure-document metadata only; sensitive
  actions fail closed.
- Pricing/products retain the proven Core PIM fixture/live adapter.
- Fixture successes have inspectable readback; unavailable commands do not
  simulate success. Support button/Enter share one command path and render
  scoped validation errors.
- Public SEO emits title, description, canonical, H1, body, FAQ and JSON-LD
  before JavaScript. Test/reference previews are noindex.
- Portal and public SEO CMS packages export independently and transactionally
  as five deterministic artifacts. Invalid input preserves the previous
  package; upload is out of scope and did not occur.

## Final Validation

The final S7 aggregator passed 16/16 commands, 51 route/profile attempts,
59/59 executable state probes, 33 private-route auth guards, two deterministic
CMS exports, and all 62 visual rows. Console errors, failed network requests,
skipped checks, visual failures, and accepted changed pixels/RMS were all zero.

Machine evidence:

- `artifacts/S7/regression-result.json`
- `artifacts/S7/route-state-coverage.json`
- `artifacts/S7/cms/contract-export-proof.json`
- `artifacts/S7/activation/activation-visual-metrics.json`
- `artifacts/S4/metrics.json` and per-row persisted images

## Opened And Unopened Contracts

- Opened live Care/SEO endpoints: `0`.
- `care.live`: `not_opened`.
- Sensitive Health provider, appointment mutation, contact, and secure document
  operations: unavailable/`not_opened` until the full security and readback
  contract exists.
- Core PIM pricing/products: retained as the only repository-proven live portal
  adapter.

## Honest Residuals

- No external general-purpose Draft 2020-12 validator is installed. The public
  SEO generator uses the audited fail-closed local subset and rejects every
  unsupported schema form.
- Production public SEO still requires real complete CMS-authored payloads;
  committed previews are explicitly test/reference content.
- CMS upload and external Care/Health integrations remain outside this program.

All required ledger rows are `done` or intentionally `not_opened`. No required
program work remains.
