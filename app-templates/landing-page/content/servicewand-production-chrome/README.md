# ServiceWand production chrome values

`parameter-values.json` is a generated, versioned snapshot of the values on the
production standard header and footer BlockTemplates. It is intentionally not
created with placeholder data.

Refresh it from the repository root:

```bash
SERVICEWAND_API_KEY="..." \
node app-templates/landing-page/scripts/download-production-chrome-values.mjs \
  --base-url https://servicewand.com/core \
  --org SYSTEM
```

The downloader is CMS read-only. It authenticates, resolves
`FIELD_SERVICE_LANDING_HEADER` and `FIELD_SERVICE_LANDING_FOOTER` by exact code,
and performs only BlockTemplate list requests. It has no `--live` mode and does
not call any save endpoint.

The snapshot stores values by authored block-local code so it can be reused by
future compositions even when their generated CMS parameter prefixes differ.
Empty and null production values are omitted; localized values and production
image identifiers are retained.
