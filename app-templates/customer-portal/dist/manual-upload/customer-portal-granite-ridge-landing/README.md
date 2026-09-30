# Manual upload: Granite Ridge Snow Removal landing blocks (demonstration)

This package is a CMS family: one root and 12 independently editable child templates. Granite Ridge is a demonstration organization, so the package emits `noindex,nofollow` and must not be published to a production domain.

## Upload order

1. Create the root template from `root.template.json` with code `CUSTOMER_PORTAL_GRANITE_RIDGE_LANDING_FIXTURE`.
2. Create child templates in numeric order under `children/`. Each child records its parent as `CUSTOMER_PORTAL_GRANITE_RIDGE_LANDING_FIXTURE`.
3. Compose `GRS_LANDING_01_PUBLIC_NAV` at `ROOT_NAV`. Compose children 02–12, in numeric order, at `ROOT_SECTIONS` inside `.page.seo-page`. The flat uploader intentionally does not create these include relationships.
4. Set `ROOT_PORTAL_URL` to the deployed portal document. Optionally set `ROOT_PORTAL_REQUEST_URL` and `ROOT_PORTAL_SERVICES_URL`; each falls back to `ROOT_PORTAL_URL` when empty.
5. Replace the phone, email, and legal placeholders with verified values before showing the page to anyone outside the team.

## Data boundary

Every block is CMS-authored public content. No block calls a backend, and none contains customer, session, account, payment, order, or appointment data. A portal CTA whose parameter is empty is disabled through the accepted `.btn[disabled]` treatment and performs no navigation, so an unconfigured package cannot emit a dead link. Portal destinations must be absolute `https` URLs; the runtime rejects anything else at click time.

## Media

`GRS_LANDING_02_HERO_MEDIA_URL` and `GRS_LANDING_06_PROOF_MEDIA_URL` are empty. Both slots render the accepted `no-data` placeholder until a URL is set. The photography brief is `design-requests/granite-ridge-landing-media.md`.
