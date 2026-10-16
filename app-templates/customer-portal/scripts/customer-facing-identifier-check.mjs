import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("app-templates/customer-portal");

const visibleRoutes = await Promise.all([
  "runtime/src/routes/SpaShopPage.js",
  "runtime/src/routes/SpaProductDetailPage.js",
  "runtime/src/routes/SpaCatalogPage.js",
  "runtime/src/routes/SpaOrdersPage.js",
].map(read));

for (const [file, source] of visibleRoutes) {
  assert.doesNotMatch(
    source,
    /["']class["']\s*:\s*["']code-chip["'][^\n]*(?:\.code\b|typeCode)/,
    `${file} must not render an internal code as customer-facing copy`,
  );
}

const fallbackSources = await Promise.all([
  "runtime/src/adapters/core-pim-adapter.js",
  "runtime/src/adapters/core-cart-adapter.js",
  "runtime/src/adapters/core-orders-adapter.js",
  "runtime/src/adapters/core-plans-adapter.js",
  "runtime/src/adapters/core-account-adapter.js",
  "runtime/src/adapters/core-spa-demo-adapter.js",
  "runtime/src/normalizers/spa-availability.js",
  "runtime/src/components/commerce/ProductCard.js",
  "runtime/src/routes/PricingPage.js",
  "scripts/export-calm-harbor-landing-blocks-manual.mjs",
].map(read));

const forbiddenFallbacks = [
  /name:\s*nls\.NAME\s*\|\|\s*(?:p|product)\.code/,
  /(?:name|title|displayName|service):[^\n]*\|\|\s*text\([^\n]*\.code/,
  /(?:tag|description|blurb|features):?[^\n]*\|\|[^\n]*\.code/,
  /item\.description\s*\|\|\s*item\.code/,
];

for (const [file, source] of fallbackSources) {
  forbiddenFallbacks.forEach((pattern) => {
    assert.doesNotMatch(source, pattern, `${file} must use neutral copy when localized display text is absent`);
  });
}

const shop = visibleRoutes.find(([file]) => file.endsWith("SpaShopPage.js"))[1];
assert.match(shop, /["']data-product-code["']\s*:\s*code/, "shop must retain its internal product join key");
assert.match(shop, /action:\s*["']cart\.addItem["'],\s*id:\s*code/, "shop commands must still carry the product code");
assert.match(shop, /product\.displayTag\s*\?\s*h\(["']span["'][^\n]*pim\.products\[\]\.displayTag/, "shop may render the approved display tag only when Core provides one");

const landing = fallbackSources.find(([file]) => file.endsWith("export-calm-harbor-landing-blocks-manual.mjs"))[1];
assert.match(landing, /card\.dataset\.productCode\s*=\s*item\.code/, "landing navigation must retain the internal product key");
assert.match(landing, /item\.displayTag\s*\?\s*el\(["']span["'],\s*["']product-tag["']/, "landing may render the approved display tag only when Core provides one");
assert.doesNotMatch(landing, /displayTag:\s*[^\n]*\.code/, "landing display tags must never fall back to a technical code");

console.log("customer-facing identifier check ok: technical codes stay internal and display fallbacks stay neutral");

async function read(relativePath) {
  return [relativePath, await readFile(path.join(root, relativePath), "utf8")];
}
