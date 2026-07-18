# Manual upload: Calm Harbor Spa customer portal

This is a staging-only authenticated root template. It resolves the signed-in Core User to one customer Account, reads and creates Core records through the current APIs, and exposes the public Core PIM catalog. Appointment list scope is tenant-level and is accepted only for this one-customer demo.

## Upload order

1. Create a root JTE template with code `CUSTOMER_PORTAL_CALM_HARBOR_STAGING`.
2. Paste `root/head.html`, `root/html.html`, `root/css.css`, and `root/javascript.js` into the matching CMS fields. `root/template.json` is the complete reference record.
3. Publish the template, then open it on `dev-1.servicewand.com` at `#/orders`, `#/pricing`, `#/products`, and `#/login`.

## Runtime contract

The browser sends unauthenticated same-origin POST requests to `/core-pim/public/CALM_HARBOR_SPA_STAGING/catalog/price-comparison.json`. Pricing queries `SPA_SERVICE, SPA_MEMBERSHIP, SPA_PACKAGE`; products query `SPA_RETAIL`. The runtime reads `AMOUNT_MINOR` with divisor `100`.

After OIDC sign-in, the browser resolves the signed-in User to exactly one `SPA_CUSTOMER` Account. Orders are read with that Account id. Booking and rescheduling save `SPA_VISIT` Appointments through `/core-svc/api/appointment`; checkout saves an Order through `/core-bill/api/order`; profile editing saves only the signed-in User email through `/core/api/user`. Each mutation is single-flight and followed by authoritative readback. Payment is simulated: no card, charge, paid Invoice, receipt, cancellation, return, entitlement, or renewal mutation is claimed.

The package is intentionally same-origin only. Do not host it on another domain: the current Core PIM CORS policy denies that path. Sign-in uses the Core discovery document and registered `/core/oauth2-callback.html` redirect; `oidc-client-ts` is loaded from a pinned CDN URL with SRI. The CMS template never stores or authors a password, API key, access token, customer, order, appointment, or account value. The runtime is self-contained in `javascript.js`; no static asset upload is required.

`preview.html` is a structural preview. It cannot validate live PIM when opened from `file://`; validate the deployed template on `dev-1` instead.
