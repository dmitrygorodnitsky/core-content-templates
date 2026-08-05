# Customer Portal Scripts

This directory is intentionally a flat, stable CLI surface. Internal source is
organized elsewhere; script paths stay stable for documentation, skills, CI,
and operator commands.

| Prefix or entrypoint | Purpose |
| --- | --- |
| `customer-experience-*`, `create-customer-experience.mjs`, `build-customer-experience.mjs` | Configure, compile, and validate the four-surface family |
| `export-*`, `generate-*`, `build-calm-harbor-target-runtime.mjs` | Generate owned runtime/CMS artifacts |
| `core-*-adapter-check.mjs`, `pim-adapter-check.mjs` | Deterministic adapter contracts |
| `core-*-live-check.mjs` | Explicit live staging probes; may create real records |
| `*-visual-check.mjs`, `visual-acceptance.mjs` | Browser-based visual evidence |
| `s6-*`, `s7-*`, `config-behavior-check.mjs`, `route-smoke.mjs` | Broad CMS/runtime regression gates |

Generated output must be changed through its owning build/export script, never
by editing `../dist/` directly.
