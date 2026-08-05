# Closeout Evidence — Dynamic Pricing Blocks Wave

Date: 2026-06-15
Result: complete

## Changed Files
- `docs/cms-components/lab-ui/14-pricing/_shared/pricing-runtime.js`
- `docs/cms-components/lab-ui/14-pricing/_fixtures/saas.json`
- `docs/cms-components/lab-ui/14-pricing/_fixtures/sites.json`
- `docs/cms-components/lab-ui/14-pricing/_fixtures/routes.json`
- `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.html`
- `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.js`
- `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.json`
- `docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/harness.html`
- `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.html`
- `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.css`
- `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.js`
- `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.json`
- `docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/harness.html`
- `docs/stream-tasks/dynamic-pricing-blocks-wave/master.md`
- `docs/stream-tasks/dynamic-pricing-blocks-wave/audits/A1.md`
- `docs/stream-tasks/dynamic-pricing-blocks-wave/evidence/closeout.md`

## Behavior Delivered
- Dynamic pricing is opt-in with `data-pricing-dynamic="true"` / `dynamic_pricing_enabled`.
- Static CMS-authored markup remains the fallback/editor preview for both pricing blocks.
- The shared runtime posts to `/public/{organization}/catalog/price-comparison.json`, or loads a fixture URL for offline harness validation.
- `pricing.plans-flex` fills existing card slots from normalized plans and keeps billing toggle event semantics.
- `pricing.matrix-collapsible` rebuilds desktop and mobile matrix content from normalized groups and values.
- Value states map to `yes`, `no`, `empty`, or `text`; API descriptions are tag-stripped before insertion and DOM renderers use text nodes.
- Harnesses default to offline SaaS fixture data and support `?mode=fallback` and `?mode=error`.

## Commands Run
```sh
jq empty docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.json docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.json docs/cms-components/lab-ui/14-pricing/_fixtures/saas.json docs/cms-components/lab-ui/14-pricing/_fixtures/sites.json docs/cms-components/lab-ui/14-pricing/_fixtures/routes.json
```
Result: passed.

```sh
node --check docs/cms-components/lab-ui/14-pricing/_shared/pricing-runtime.js && node --check docs/cms-components/lab-ui/14-pricing/pricing.plans-flex/block.js && node --check docs/cms-components/lab-ui/14-pricing/pricing.matrix-collapsible/block.js
```
Result: passed.

```sh
node - <<'NODE'
const fs = require('fs');
const runtime = require('./docs/cms-components/lab-ui/14-pricing/_shared/pricing-runtime.js');
const configs = [
  ['saas', 'SERVICEWAND_SAAS', 'RECURRENT', 'INTERVAL', '1 month'],
  ['sites', 'SERVICEWAND_SAAS_EXT', 'RECURRENT', 'INTERVAL', '1 month'],
  ['routes', 'SERVICEWAND_SAAS_ROUTING_TOKENS', 'PER_UNIT', 'UNIT_PRICE', '3,4,4.5,5']
];
for (const [name, productTypeCode, priceTypeCode, priceAttributeCode, priceAttributeValues] of configs) {
  const data = JSON.parse(fs.readFileSync(`docs/cms-components/lab-ui/14-pricing/_fixtures/${name}.json`, 'utf8'));
  const normalized = runtime.normalize(data, { locale: 'en', productTypeCode, priceTypeCode, priceAttributeCode, priceAttributeValues, currency: 'CAD', productSortAttributeCode: 'SORT_ORDER_PRIORITY' });
  console.log(name, normalized.plans.map((plan) => plan.name).join(' > '), `groups=${normalized.groups.length}`);
  if (!normalized.plans.length) throw new Error(`${name} has no plans`);
  if (!normalized.groups.length) throw new Error(`${name} has no groups`);
}
NODE
```
Result:
```text
saas Foundation > Growth > Professional > Enterprise groups=3
sites Foundation Sites Expansion > Growth Sites Expansion > Professional Sites Expansion > Enterprise Sites Expansion groups=1
routes Foundation Routing Expansion > Growth Routing Expansion > Professional Routing Expansion > Enterprise Routing Expansion groups=1
```

```sh
python3 -m http.server 4174
```
Result: served harnesses from `docs/cms-components/lab-ui/` for Browser validation at `http://127.0.0.1:4174/`.

## Browser Proof
- `14-pricing/pricing.plans-flex/harness.html`: `data-pricing-state="dynamic"`, 4 visible cards, names `Foundation`, `Growth`, `Professional`, `Enterprise`, amounts `99.99`, `449`, `1,099`, `Contact us`; shared token CSS loaded.
- `14-pricing/pricing.plans-flex/harness.html?mode=fallback`: `data-pricing-state="fallback"`, first static card remained `Starter`.
- `14-pricing/pricing.plans-flex/harness.html?mode=error`: `data-pricing-state="fallback"`, `data-pricing-error="HTTP 404"`, first static card remained `Starter`.
- `14-pricing/pricing.matrix-collapsible/harness.html`: `data-pricing-state="dynamic"`, 4 headers, 3 groups, 6 dynamic rows, 4 CTAs.
- `14-pricing/pricing.matrix-collapsible/harness.html` at 390px: desktop table `display: none`; accordion `display: grid`; 4 plan panels with 3 groups and 6 rows each.
- `14-pricing/pricing.matrix-collapsible/harness.html?mode=fallback`: `data-pricing-state="fallback"`, first static header `Starter`, 12 static rows.
- `14-pricing/pricing.matrix-collapsible/harness.html?mode=error`: `data-pricing-state="fallback"`, `data-pricing-error="HTTP 404"`, first static header `Starter`.
- `14-pricing/_combined-preview.html`: clicking Annual set plans, matrix, and credits `data-pricing-period` to `annual`; browser console errors were empty.

## Build Availability
No prod compile command is available in this repository. Search found no `package.json`, Dockerfile, or CI YAML, so validation used JSON checks, JS syntax checks, runtime normalization proof, and browser harness proof.

## Residual Risks
- Deployed CMS output must load `_shared/pricing-runtime.js` before block adapter scripts for dynamic mode.
- Live Core PIM endpoint behavior was matched from the studied public contract and fixtures; deployment-level CMS integration was not available in this repository.
