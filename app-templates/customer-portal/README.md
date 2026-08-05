# Customer Portal Template Family

This directory owns the reusable customer-experience family that connects four
separately deployed surfaces: public landing, authenticated customer portal,
Core Auth login, and Core Auth 2FA.

## Directory Map

| Path | Responsibility | Edit policy |
| --- | --- | --- |
| `experience/` | Family schema, parameter registry, contracts, and tenant descriptors | Canonical authored configuration |
| `runtime/` | Portal behavior, adapters, routes, state, and styles | Authored production source |
| `cms/` | Portal and public-landing CMS source contracts | Authored CMS source |
| `design-inbox/` | Accepted executable visual baseline | Immutable; user updates only |
| `design-requests/` | Missing-state briefs for the designer | Authored requests, not UI implementations |
| `content/cases/` | Domain fixtures and tenant-specific source documents | Authored domain/content evidence |
| `scripts/` | Stable build, export, and validation entrypoints | Keep paths stable; see `scripts/README.md` |
| `dist/` | Generated upload packages and previews | Never hand-edit |
| `assets/`, `public/` | Public SEO assets and source | Authored public-surface input |

All four generated family templates live only under
`dist/customer-experience/<experience-id>/`. `cms-templates/` is reserved for
independently authored reusable packages and is never an upstream or output
location for a customer-experience build.

## Family Flow

```text
experience/config + experience/descriptors
design-inbox/core-auth-login.html + core-auth-2fa.html
runtime/ + authored landing/content pipeline
                    │
                    ▼
scripts/build-customer-experience.mjs
                    │
                    ▼
dist/customer-experience/<experience-id>/
  landing/  portal/  login/  twoFactor/
```

Start with `experience/README.md` when creating or changing a family instance.
Use `ARCHITECTURE.md` for runtime behavior and `DATA-OWNERSHIP.md` for live-data
boundaries.

## Focused Checks

```bash
node app-templates/customer-portal/scripts/customer-experience-wizard-check.mjs
node app-templates/customer-portal/scripts/customer-experience-config-check.mjs
node app-templates/customer-portal/scripts/customer-experience-build-check.mjs
node app-templates/customer-portal/scripts/customer-experience-login-check.mjs
node app-templates/customer-portal/scripts/customer-experience-2fa-check.mjs
node app-templates/customer-portal/scripts/config-behavior-check.mjs
```
