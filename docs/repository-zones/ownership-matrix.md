# Ownership Matrix

| Task type | Zone | Intake stream | Execution stream | Required handoff | Validation evidence |
|---|---|---|---|---|---|
| Add a vertical or family instance | Portal family definition | product/developer | customer-experience | runtime or design handoff only when capability/UI changes | schema + wizard + config + build checks |
| Change portal behavior | Portal runtime | product/developer | portal-runtime | design request if no accepted state; CMS handoff if root attributes change | focused adapter/module checks + route regression |
| Change presentation | Portal design authority -> runtime | design-owner | customer-experience | user imports accepted design before runtime transfer | executable baseline + viewport comparison |
| Change CMS package | Shared CMS packages or Portal CMS source | developer | cms-packaging or portal-cms | document parameter/consumer contract changes | schema check + generated manual package |
| Change a landing block, spec, or content pack | Landing page source | product/developer | landing-experience | build-tooling handoff when compiler behavior changes | manifest validation + focused family check |
| Change landing compiler or uploader behavior | Landing page build tooling | developer/operator | landing-experience | CMS/operator review for upload contract changes | syntax checks + deterministic export + upload preflight check |
| Regenerate a landing CMS family | Landing page generated output | owning landing source/tooling zone | landing-build-output | none; never consume an older generated family as input | clean exporter run + manifest/hash comparison |
| Change generated output | Portal generated output | owning source zone | owning exporter/compiler | none; never edit output directly | clean regeneration + manifest diff |
| Move files across zones | Repository governance | developer | repository-maintenance | source and destination owners agree on canonical path | references, CODEOWNERS, docs, focused checks |
| Run a live staging probe | Portal build tooling | operator/developer | customer-experience | explicit awareness of record-creating side effects | command log + created record ids + cleanup plan |

## Routing Rules

- If a change touches multiple zones, keep one parent task and identify each
  zone dependency explicitly.
- Sequence source changes before generated-output changes.
- Never use a generated artifact or local scratch file as the upstream source.
- Route `app-templates/landing-page/**` work through its scoped `AGENTS.md` and
  keep docs compatibility wrappers free of product logic.
- When a path is ambiguous, the zone catalog and nearest `AGENTS.md` decide.
