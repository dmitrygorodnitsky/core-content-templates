# Manual upload: Calm Harbor Spa live PIM catalog

This is a staging-only root template. It exposes live Core PIM pricing and retail products, plus the Core OIDC sign-in boundary. It does not open private customer data.

## Upload order

1. Create a root JTE template with code `CUSTOMER_PORTAL_CALM_HARBOR_PIM_STAGING`.
2. Paste `root/head.html`, `root/html.html`, `root/css.css`, and `root/javascript.js` into the matching CMS fields. `root/template.json` is the complete reference record.
3. Publish the template, then open it on `dev-1.servicewand.com` at `#/pricing`, `#/products`, and `#/login`.

## Runtime contract

The browser sends unauthenticated same-origin POST requests to `/core-pim/public/CALM_HARBOR_SPA_STAGING/catalog/price-comparison.json`. Pricing queries `SPA_SERVICE, SPA_MEMBERSHIP`; products query `SPA_RETAIL`. The runtime reads `AMOUNT_MINOR` with divisor `100`.

The package is intentionally same-origin only. Do not host it on another domain: the current Core PIM CORS policy denies that path. Sign-in uses the Core discovery document and registered `/core/oauth2-callback.html` redirect; `oidc-client-ts` is loaded from a pinned CDN URL with SRI. The CMS template never stores or authors a password, API key, access token, customer, order, appointment, or account value. The runtime is self-contained in `javascript.js`; no static asset upload is required.

`preview.html` is a structural preview. It cannot validate live PIM when opened from `file://`; validate the deployed template on `dev-1` instead.
