# Manual upload: section-03-section-h2-narrative-only

Generated from `docs/cms-components/lab-ui/dist/field-service-pdf-reference/children/03-section-03-section-h2-narrative-only/template.json`.

- Code: `SECTION_03_SECTION_H2_NARRATIVE_ONLY`
- Parent: `FIELD_SERVICE_LANDING`
- Parameters: 9

Files:

- `html.html` - CMS block HTML
- `css.css` - CMS block CSS
- `javascript.js` - CMS block JavaScript
- `head.html` - CMS block head
- `parameters.json` - CMS block parameters for `sync-block-template-parameters.mjs --parameters-json`
- `template.json` - full generated block template payload for UI upload or `--template-json`

Sync example:

```bash
SERVICEWAND_API_KEY="..." \
node docs/cms-components/lab-ui/scripts/sync-block-template-parameters.mjs \
  --template-id "<cms-block-template-id>" \
  --template-json docs/cms-components/lab-ui/dist/manual-upload/section-03-section-h2-narrative-only/template.json \
  --base-url https://lsrc.pixelnation.com/core \
  --org SYSTEM \
  --mode merge \
  --dry-run
```
