# Manual upload: Calm Harbor Spa live PIM catalog

This is a staging-only root template. It exposes only the opened Core PIM surfaces: pricing and retail products. It is not an authenticated customer portal and must not be presented as one.

## Upload order

1. Create a root JTE template with code `CUSTOMER_PORTAL_CALM_HARBOR_PIM_STAGING`.
2. Paste `root/head.html`, `root/html.html`, `root/css.css`, and `root/javascript.js` into the matching CMS fields. `root/template.json` is the complete reference record.
3. Publish the template, then open it on `dev-1.servicewand.com` at `#/pricing`, then `#/products`.

## Runtime contract

The browser sends unauthenticated same-origin POST requests to `/core-pim/public/CALM_HARBOR_SPA_STAGING/catalog/price-comparison.json`. Pricing queries `SPA_SERVICE, SPA_MEMBERSHIP`; products query `SPA_RETAIL`. The runtime reads `AMOUNT_MINOR` with divisor `100`.

The package is intentionally same-origin only. Do not host it on another domain: the current Core PIM CORS policy denies that path. No price, product, customer, order, appointment, or account value is authored in CMS. The runtime is self-contained in `javascript.js`; no static asset upload is required.

`preview.html` is a structural preview. It cannot validate live PIM when opened from `file://`; validate the deployed template on `dev-1` instead.
