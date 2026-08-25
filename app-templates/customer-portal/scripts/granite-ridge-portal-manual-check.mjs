import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { exportFixturePortalManual } from "./export-fixture-portal-manual.mjs";

const root = path.resolve("app-templates/customer-portal");
const inputPath = path.join(root, "content/cases/granite-ridge-snow.customer-portal-fixture.json");
const runtimePath = path.join(root, "runtime/manual/granite-ridge-fixture-runtime.js");
const outputDir = path.join(root, "dist/manual-upload/.granite-ridge-portal-manual-check");

try {
  await fs.rm(outputDir, { recursive: true, force: true });
  await exportFixturePortalManual({ inputPath, runtimePath, outputDir });

  const template = JSON.parse(await fs.readFile(path.join(outputDir, "root/template.json"), "utf8"));
  const familyPayload = JSON.parse(await fs.readFile(path.join(outputDir, "cms-family.payload.json"), "utf8"));
  const manifest = JSON.parse(await fs.readFile(path.join(outputDir, "manual-export-manifest.json"), "utf8"));
  const html = await fs.readFile(path.join(outputDir, "root/html.html"), "utf8");
  const head = await fs.readFile(path.join(outputDir, "root/head.html"), "utf8");
  const javascript = await fs.readFile(path.join(outputDir, "root/javascript.js"), "utf8");
  const css = await fs.readFile(path.join(outputDir, "root/css.css"), "utf8");

  assert.equal(template.code, "CUSTOMER_PORTAL_GRANITE_RIDGE_FIXTURE");
  assert.equal(template.templateLanguage, "JTE", "JTE is the only template language proven against this CMS");
  assert.deepEqual(template.parameters, [], "the fixture root reads data-portal-* attributes, never CMS parameters");
  assert.equal(familyPayload.schemaVersion, 1);
  assert.equal(familyPayload.root.code, template.code);
  assert.deepEqual(familyPayload.children, []);

  assert.match(html, /data-portal-data-mode="fixture"/);
  assert.match(html, /data-portal-auth-mode="fixture"/);
  assert.match(html, /data-portal-case="granite-ridge-snow"/);
  assert.match(html, /data-portal-vertical="snow"/);
  assert.match(html, /data-portal-profile="stormRetail"/);
  assert.match(html, /data-portal-theme="snow"/);
  assert.match(html, /data-portal-default-route="overview"/);
  assert.match(html, /data-portal-enabled-modules="overview,orders,calendar,activity,proposals,care,services,pricing,products,checkout,profile,support"/);
  assert.match(html, /data-portal-brand-name="Granite Ridge"/);
  assert.match(html, /data-portal-nav-care-label="Season log"/);
  assert.match(html, /data-portal-nav-proposals-label="Contracts"/);
  assert.match(html, /data-portal-nav-products-label="Shop"/);

  assert.doesNotMatch(html, /data-portal-(core|account|bill|service|resource|pim)-api-base/, "a fixture package must not carry a service base");
  assert.doesNotMatch(html, /data-portal-auth-(core-base|callback-path)/, "a fixture package must not carry an OIDC contract");
  assert.doesNotMatch(html, /data-portal-organization/, "a fixture package must not name a tenant organization");
  assert.doesNotMatch(html, /account-id|user-id|access-token|bearer/i);
  assert.doesNotMatch(head, /<script/i, "the fixture head must not load an external runtime library");
  assert.match(head, /name="robots" content="noindex,nofollow"/, "a demonstration portal must not be indexable");

  assert.equal(manifest.runtime.dataMode, "fixture");
  assert.equal(manifest.runtime.authMode, "fixture");
  assert.equal(manifest.runtime.case, "granite-ridge-snow");
  assert.deepEqual(manifest.runtime.openedLiveContracts, []);
  assert.equal(manifest.uploadPerformed, false);
  assert.ok(manifest.constraints.length >= 5);

  assert.ok(javascript.includes("granite-ridge-snow"), "the bundled runtime must contain its case");
  assert.ok(javascript.includes("Granite Ridge Snow Removal"));
  assert.ok(javascript.includes("stormRetail"));
  assert.ok(javascript.includes("Season log"));
  assert.doesNotMatch(javascript, /cdnjs\.cloudflare\.com|oidc-client-ts/, "the fixture runtime must not pull an external authentication library");
  assert.doesNotMatch(javascript, /dev-1\.servicewand\.com|lsrc\.pixelnation\.com/, "the fixture runtime must not hardcode a deployment host");
  for (const [field, value] of Object.entries({ head, html, css, javascript })) {
    for (const marker of ["${", "@{", "!{", "<%", "%>"]) {
      assert.ok(!value.includes(marker), field + " must stay JTE-safe, found " + marker);
    }
  }

  const previewSize = (await fs.stat(path.join(outputDir, "preview.html"))).size;
  assert.ok(previewSize > 100_000, "the standalone preview must inline the whole runtime");

  await assert.rejects(
    exportFixturePortalManual({
      inputPath,
      runtimePath,
      outputDir: path.join(root, "runtime/escaped-package"),
    }),
    /dist\/manual-upload/,
    "packages may only be written under dist/manual-upload/",
  );

  const liveSource = JSON.parse(await fs.readFile(inputPath, "utf8"));
  liveSource.runtime.dataMode = "live";
  const liveInput = path.join(outputDir, "live-source.json");
  await fs.writeFile(liveInput, JSON.stringify(liveSource));
  await assert.rejects(
    exportFixturePortalManual({ inputPath: liveInput, runtimePath, outputDir }),
    /fixture data mode/,
    "a fixture package must refuse live data mode",
  );

  const productsWithoutCheckout = JSON.parse(await fs.readFile(inputPath, "utf8"));
  productsWithoutCheckout.runtime.enabledModules = productsWithoutCheckout.runtime.enabledModules.filter((id) => id !== "checkout");
  const productsInput = path.join(outputDir, "products-source.json");
  await fs.writeFile(productsInput, JSON.stringify(productsWithoutCheckout));
  await assert.rejects(
    exportFixturePortalManual({ inputPath: productsInput, runtimePath, outputDir }),
    /products without checkout/,
    "products without checkout would render add-to-cart actions that cannot complete",
  );

  console.log("granite-ridge-portal-manual-check ok: JTE-safe parameter-free fixture root, no service base, no auth contract, no live contract opened");
} finally {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.rm(path.join(root, "runtime/escaped-package"), { recursive: true, force: true });
}
