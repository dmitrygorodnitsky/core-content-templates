import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { corePimAdapter } from "../runtime/src/adapters/core-pim-adapter.js";
import { normalizePricing, normalizeProducts } from "../runtime/src/normalizers/index.js";

const fixturePath = path.resolve("docs/cms-components/lab-ui/14-pricing/_fixtures/saas.json");

globalThis.window = {
  fetch: globalThis.fetch.bind(globalThis),
};

const server = http.createServer(async (req, res) => {
  if (req.url !== "/saas.json") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const body = await fs.readFile(fixturePath);
  res.writeHead(200, { "content-type": "application/json" });
  res.end(body);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const fixtureUrl = `http://127.0.0.1:${address.port}/saas.json`;

try {
  const context = {
    config: {
      dataMode: "live",
      pimFixtureUrl: fixtureUrl,
      pimCurrency: "CAD",
      pimProductTypeCode: "SERVICEWAND_SAAS",
    },
  };
  const pricingRaw = await corePimAdapter.load("pricing", context);
  const pricing = normalizePricing(pricingRaw);
  if (!pricing.plans.length || pricing.source !== "core-pim") {
    throw new Error("Pricing PIM normalization failed");
  }

  const productsRaw = await corePimAdapter.load("products", context);
  const products = normalizeProducts(productsRaw);
  if (!products.items.length || products.source !== "core-pim") {
    throw new Error("Products PIM normalization failed");
  }

  console.log(`pim-adapter ok: ${pricing.plans.length} plans`);
} finally {
  await new Promise((resolve) => server.close(resolve));
}
