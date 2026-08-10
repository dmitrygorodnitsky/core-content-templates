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

The downloader is CMS read-only. It reads the selected `PageContext`, resolves
`HEADER` and `FOOTER` by exact code, and overlays saved page values over their
BlockTemplate defaults. Override the codes with `--header-code` and
`--footer-code` if that page uses a different chrome family. It has no `--live`
mode and does not call any save endpoint.

Production can contain several templates with the same code. In that case the
downloader selects the exact UUID present in the page's `enabledTemplates`
instead of taking an arbitrary global match.

The snapshot stores both the effective CMS values per source template and their
mapping to authored block-local codes, so it can be reused by future
compositions even when generated parameter prefixes differ. A page override has
precedence over a template default. An explicitly saved empty or null override
is retained because it represents the actual page state.
