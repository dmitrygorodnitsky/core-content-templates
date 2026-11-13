# ServiceWand production chrome values

`parameter-values.json` is a generated, versioned snapshot of the effective
standard header and footer values on one production page. It is intentionally
not created from template defaults alone or from placeholder data.

Refresh it from the repository root:

```bash
SERVICEWAND_API_KEY="..." \
node app-templates/landing-page/scripts/download-production-chrome-values.mjs \
  --page-url /the-production-page \
  --base-url https://servicewand.com/core \
  --org SYSTEM
```

Use `--page-context-id <id>` instead of `--page-url` when the URL is ambiguous.
Exactly one page selector is required. Full production URLs are accepted and
normalized to their path and query.

The downloader is CMS read-only. It reads the selected `PageContext`, finds the
family-specific `<PAGE_ROOT_CODE>_HEADER` and `<PAGE_ROOT_CODE>_FOOTER` inside
the root template tree attached to that page, and overlays saved page values
over their BlockTemplate defaults. If those exact family codes do not exist, it
falls back to unique `*_HEADER` and `*_FOOTER` children. Override the detection
with `--header-code` and `--footer-code` when necessary. It has no `--live` mode
and does not call any save endpoint.

Production can contain several templates with the same code. Global duplicates
are irrelevant because the downloader follows the selected PageContext's own
template tree instead of performing a global code lookup.

For diagnosis, download the complete PageContext and its attached template tree
without attempting chrome mapping:

```bash
node app-templates/landing-page/scripts/download-production-chrome-values.mjs \
  --page-context-id 77 \
  --base-url https://servicewand.com/core \
  --org SYSTEM \
  --dump-page tmp/production-page-context-77.json
```

The dump can then be processed again without credentials or CMS access:

```bash
node app-templates/landing-page/scripts/download-production-chrome-values.mjs \
  --from-page-dump tmp/production-page-context-77.json
```

The snapshot stores both the effective CMS values per source template and their
mapping to authored block-local codes, so it can be reused by future
compositions even when generated parameter prefixes differ. A page override has
precedence over a template default. An explicitly saved empty or null override
is retained because it represents the actual page state.
