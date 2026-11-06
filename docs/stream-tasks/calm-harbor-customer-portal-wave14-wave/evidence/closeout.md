# Closeout Evidence

## Delivered

- Accepted Wave 14.1 Calm Harbor visual language in the production runtime styles.
- Authenticated SPA shell with Orders, Services & prices, secondary Shop, account/session menu, mobile navigation, light/dark mode, and support-unavailable dialog.
- Fail-closed OIDC → User → one `SPA_CUSTOMER` Account → Account-filtered Orders flow.
- Public PIM services, membership offers, and retail rendering with no booking or commerce mutation.
- Reproducible manual CMS family at `app-templates/customer-portal/dist/manual-upload/customer-portal-calm-harbor-staging/`.
- Pairwise visual evidence and focused adapter/browser checks.

## Package identity

- Template code: `CUSTOMER_PORTAL_CALM_HARBOR_STAGING`.
- Profile: `spaStaging`.
- Capability: `current-staging`.
- Booking: `closed`.
- Opened modules: `orders`, `pricing`, `products`.
- Upload performed: no.

## Explicitly unopened

- Appointment list/detail and appointment status mapping.
- Booking, reschedule, cancel, and book-again.
- Order detail and all Order mutations.
- Customer membership/package state and balances.
- Cart, checkout, payment, and purchase success.
- Editable profile and customer-contact writes.
- Support conversation, email, phone, ticket, or delivery integration.

## Security handoff

The staging demo is showable, but promotion waits on backend-enforced customer row isolation. The current browser derives Account scope from the authenticated User and sends an Account filter; it cannot make a generic endpoint a production authorization boundary by itself.

## Reproduce

```sh
node app-templates/customer-portal/scripts/export-calm-harbor-portal-manual.mjs \
  --input app-templates/customer-portal/content/cases/calm-harbor-spa.customer-portal-staging.json \
  --output-dir app-templates/customer-portal/dist/manual-upload/customer-portal-calm-harbor-staging
```

The generated `cms-family.payload.json` contains a non-empty `root`, so it is compatible with `upload-cms-family.mjs`.
