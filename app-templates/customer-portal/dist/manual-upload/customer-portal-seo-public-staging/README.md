# Manual upload: customer-portal-seo-public

This is one public, server-authored JTE root template. It intentionally has no child blocks: the canonical URL, visible FAQ, and FAQ JSON-LD were produced from the same validated input document and must remain atomic.

## Upload order

1. Upload every file in `assets/` to the matching `publicUrl` in `assets-manifest.json`. Verify each final HTTPS URL returns the intended image.
2. Create a root template with code `CUSTOMER_PORTAL_SEO_PUBLIC` and language `JTE`.
3. Paste `root/head.html`, `root/html.html`, `root/css.css`, and `root/javascript.js` into the matching CMS fields. `root/template.json` is the complete import record.
4. Publish only after checking the canonical, meta description, visible FAQ, FAQ JSON-LD, CTA destinations, and uploaded media on the deployed URL.

## Content authority

`page-context.source.json` is the exact validated source used for this package. Do not edit rendered HTML to change business content. Update the authored input and regenerate the package so HTML and structured data stay aligned.

Regenerate a package with:

```bash
node app-templates/customer-portal/scripts/export-seo-public-manual.mjs \
  --input /absolute/path/to/public-authored-landing.json \
  --mode staging
```

Staging writes `dist/manual-upload/customer-portal-seo-public-staging`; production writes `dist/manual-upload/customer-portal-seo-public`; test input writes the separate `*-reference` path. Modes are isolated and cannot overwrite one another.

`catalog-snapshot.source.json` is the PIM snapshot used to author the displayed prices. It is not a browser-side Core integration. Regenerate after a catalog change. Do not add an unverified CMS price or a client-side authenticated API call.

## Staging-only package

This package contains `noindex,nofollow` and an explicit staging banner. Upload it only to staging. It must not be promoted or published to a production domain; regenerate in `production` mode after customer facts, public URLs, and live catalog ownership are verified.
