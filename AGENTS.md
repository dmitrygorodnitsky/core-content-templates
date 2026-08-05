# Repository Agent Rules

## Start Here

- Read `docs/repository-zones/zone-catalog.md` before changing ownership or
  moving files across top-level directories.
- The nearest scoped `AGENTS.md` overrides this file. Customer portal work must
  also follow `app-templates/customer-portal/AGENTS.md`.
- Keep a change inside one responsibility zone when possible. For cross-zone
  work, record the dependency using
  `docs/repository-zones/handoff-contract.md`.

## Repository Boundaries

- `cms-templates/**` contains independently deployable CMS packages.
- `app-templates/customer-portal/design-inbox/**` is immutable and user-owned.
- `app-templates/customer-portal/dist/**` is generated; update it only through
  the owning exporter or compiler.
- `tmp/**` is local scratch space and must not become a source of truth.
- Do not move stable CLI entrypoints under
  `app-templates/customer-portal/scripts/**` without a compatibility plan.

## Change Evidence

- Update path references and ownership docs in the same change as a move.
- Run the narrow checks owned by the changed zone before broader regression
  checks.
- Do not commit secrets, tokens, customer/session data, or local credentials.
