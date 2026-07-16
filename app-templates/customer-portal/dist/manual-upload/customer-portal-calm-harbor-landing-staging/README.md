# Manual upload: Calm Harbor landing blocks (staging)

This package is a CMS family: one root and 13 independently editable child templates. It is staging-only and emits `noindex,nofollow`.

## Upload order

1. Upload each file under `assets/` to the exact same-origin public URL in `assets-manifest.json`. Preserve filenames.
2. Create the root template from `root.template.json` with code `CUSTOMER_PORTAL_CALM_HARBOR_LANDING_STAGING`.
3. Create child templates in numeric order under `children/`. Each child records its parent as `CUSTOMER_PORTAL_CALM_HARBOR_LANDING_STAGING`.
4. Compose `CHS_LANDING_01_PUBLIC_NAV` at `ROOT_NAV`. Compose children 02–13, in numeric order, at `ROOT_SECTIONS` inside `.page.seo-page`. The flat uploader intentionally does not create these include relationships.
5. Before publishing, replace every `SIGN_IN_URL`, shop URL, phone, email, and legal URL placeholder with verified staging values. A `#` sign-in URL is intentionally non-functional and must not be treated as a login flow.

## Live data boundary

Only `CHS_LANDING_07_PRICING_PIM` and `CHS_LANDING_08_PRODUCTS_PIM` fetch Core PIM. They request the public same-origin endpoint with `credentials: omit`, render loading/ready/empty/error, and never use CMS numeric prices as a fallback. All other children are CMS-authored public content.

## Included media

- `spa-massage-1448.webp` -> `/assets/customer-portal/calm-harbor-landing-staging/spa-massage-1448.webp`
- `spa-room-1600.webp` -> `/assets/customer-portal/calm-harbor-landing-staging/spa-room-1600.webp`
