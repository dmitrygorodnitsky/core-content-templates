# Customer experience build: calm-harbor-spa-staging

Local deterministic build only. No CMS upload or PageContext switch was performed.

State: **BLOCKED for publishing**.

Each surface contains `template.json`, template defaults in `parameters.json`, and descriptor-specific `page-context.parameters.json`.

Blockers:

- CX_LANDING_URL: Canonical landing route is reserved by project convention, but its anonymous deployment/readback is not yet proven. The route returned HTTP 404 on 2026-08-05.
- CX_PORTAL_URL: Canonical portal route preserves the previously observed customer-portal slug, but its current anonymous deployment/readback is not yet proven. The route returned HTTP 404 on 2026-08-05.
- login-page-context-selector-unproven: Core Auth tenant-specific PageContext selection by a trusted organization, host, client registration, or route is not yet proven.
