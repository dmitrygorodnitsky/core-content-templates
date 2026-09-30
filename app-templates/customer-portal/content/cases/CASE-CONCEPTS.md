# Beauty vertical concept cases

These two authored landing documents are concept cases created for the customer-portal beauty vertical. Their brands, locations, contact details, domains, and booking endpoints are illustrative and are not customer facts.

They are complete content and manual-upload packaging references, not publish-ready business sites. Before a case is assigned to a real customer, replace every invented identity and endpoint, confirm the source of any proof claim, connect a real booking destination, and regenerate the package.

The cases deliberately contain no numeric pricing, PIM data, or customer testimonials. Those inputs require a real commercial source of truth.

The service and retail-product concepts, entity boundaries, and activation
order are in [PRODUCTS-AND-SERVICES.md](PRODUCTS-AND-SERVICES.md).

The machine-checked concept catalogs are
`calm-harbor-spa.catalog-concept.json` and
`luma-beauty-studio.catalog-concept.json`. They select four MVP services per
brand, retain the three public SEO services already used by each landing, and
keep every retail product deferred until the dedicated PIM catalog opens.

Regenerate both manual packages with:

```bash
node app-templates/customer-portal/scripts/build-beauty-concept-cases.mjs
```
