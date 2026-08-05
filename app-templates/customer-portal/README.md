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

The tenant login package intentionally lives at
`../../cms-templates/CUSTOMER_PORTAL_CALM_HARBOR_LOGIN/`: CMS templates are
independent deployable packages. Generic compiled family output lives under
`dist/customer-experience/`.

## Family Flow

```text
experience/config + experience/descriptors
                    |
                    v
scripts/customer-experience-*.mjs
                    |
                    v
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
node app-templates/customer-portal/scripts/customer-experience-2fa-check.mjs
node app-templates/customer-portal/scripts/config-behavior-check.mjs
```
