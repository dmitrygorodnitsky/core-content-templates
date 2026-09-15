# Zone Catalog

| Zone | Paths | Primary owner stream | Backup owner stream | In scope | Out of scope | Contracts/interfaces | Criticality |
|---|---|---|---|---|---|---|---|
| Repository governance | `/AGENTS.md`, `/.github/**`, `/.claude/**`, `/.vscode/**`, `/.gitignore`, `/LICENSE`, `/docs/repository-zones/**` | repository-maintenance | customer-experience | ownership, contribution, editor/agent and handoff rules | product behavior | scoped `AGENTS.md`, CODEOWNERS | high |
| Repository documentation | `/README.md`, `/CMS_BLOCK_PORTAL_STRUCTURE.md`, `/docs/**` except `/docs/repository-zones/**` | documentation | repository-maintenance | CMS guidance, task evidence, design briefs | runtime implementation | links to canonical source paths | medium |
| Shared CMS packages | `/cms-templates/**` | cms-packaging | repository-maintenance | independently authored reusable CMS templates | portal runtime source or generated customer-experience output | `block_template_config.json`, manual-upload contract | high |
| Shared tooling | `/scripts/**`, `/js/**`, `/test/**` | shared-tooling | repository-maintenance | repository-wide generators and tests | customer-portal-only checks | CLI and fixture contracts | medium |
| Landing page source | `/app-templates/landing-page/blocks/**`, `/app-templates/landing-page/compositions/**`, `/app-templates/landing-page/content/**`, landing-page root manifest/gallery/Markdown/`AGENTS.md` files | landing-experience | cms-packaging | authored blocks, portable specs/content, catalog preview and contracts | generated packages or credentialed upload behavior | manifest, landing spec and content-value contracts | high |
| Landing page build tooling | `/app-templates/landing-page/scripts/**` | landing-experience | shared-tooling | stable compose/export/check/preview/upload entrypoints | hand-authored block content or generated artifacts | CLI and CMS family contracts | high |
| Landing page generated output | `/app-templates/landing-page/dist/**` | landing-build-output | landing-experience | exporter/compiler output and manual-upload packages | authored source or upstream compiler inputs | build and manual-export manifests | high |
| Portal family definition | `/app-templates/customer-portal/experience/**` | customer-experience | portal-runtime | schema, registry, contracts, descriptors | visual source and generated output | descriptor schema and parameter registry | high |
| Portal runtime | `/app-templates/customer-portal/runtime/**` | portal-runtime | customer-experience | routes, state, adapters, commands, styles | accepted design source | runtime manifest and CMS data attributes | high |
| Portal CMS source | `/app-templates/customer-portal/cms/**`, `/app-templates/customer-portal/assets/**`, `/app-templates/customer-portal/public/**` | portal-cms | customer-experience | authored CMS/public source and assets | generated packages | CMS template and public-document contracts | high |
| Portal design authority | `/app-templates/customer-portal/design-inbox/**` | design-owner | customer-experience | accepted executable design | production logic | manifest, stable hooks, accepted states | critical |
| Portal product docs | `/app-templates/customer-portal/*.md`, `/app-templates/customer-portal/content/**`, `/app-templates/customer-portal/design-requests/**` | customer-experience | documentation | domain evidence, architecture, handoff, closed design-request history | generated artifacts | architecture and data-ownership contracts | high |
| Portal build tooling | `/app-templates/customer-portal/scripts/**` | customer-experience | shared-tooling | stable build/export/check entrypoints | authored runtime UI | CLI contracts | high |
| Portal generated output | `/app-templates/customer-portal/dist/**` | portal-build-output | customer-experience | exporter/compiler output | hand-authored logic | build manifests | high |
| Local scratch | `/tmp/**` | local-developer | repository-maintenance | ignored previews and downloads | canonical evidence or source | `.gitignore` | low |

## Precedence Rules

- `/docs/repository-zones/**` belongs to Repository governance; the broader
  `/docs/**` rule does not apply there.
- `/docs/cms-components/lab-ui/scripts/**` remains Repository documentation as
  a forwarding-only compatibility facade; canonical behavior is owned by
  Landing page build tooling.
- The nearest scoped `AGENTS.md` controls work below its directory.
- `design-inbox/**` is immutable even when a cross-zone task consumes it.
- `dist/**` is owned by its generator; edit the source and regenerate.
