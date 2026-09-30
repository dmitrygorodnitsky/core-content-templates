# Production-filled chrome | SW

Two independent BlockTemplates generated from repo-owned corporate chrome blocks
and the versioned production PageContext snapshot:

- `FIELD_SERVICE_LANDING_HEADER_SW`
- `FIELD_SERVICE_LANDING_FOOTER_SW`

The suffix prevents the flat uploader from targeting the source production
templates. Parent links, root includes, enabled templates, and PageContext are
not part of this package.

Create-only production dry-run:

```bash
SERVICEWAND_API_KEY="..." \
node app-templates/landing-page/scripts/upload-cms-family.mjs \
  --out app-templates/landing-page/dist/manual-upload/servicewand-production-chrome-sw \
  --base-url https://servicewand.com/core \
  --org SYSTEM \
  --require-missing \
  --dry-run
```

Replace `--dry-run` with `--live` only after both codes are reported as
`would create`.
