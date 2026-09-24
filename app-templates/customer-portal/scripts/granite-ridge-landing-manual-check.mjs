import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { exportGraniteRidgeLandingBlocksManual } from "./export-granite-ridge-landing-blocks-manual.mjs";

const root = path.resolve("app-templates/customer-portal");
const outputDir = path.join(root, "dist/manual-upload/.granite-ridge-landing-manual-check");

try {
  await fs.rm(outputDir, { recursive: true, force: true });
  const { root: rootTemplate, children } = await exportGraniteRidgeLandingBlocksManual({ outputDir });

  const payload = JSON.parse(await fs.readFile(path.join(outputDir, "cms-family.payload.json"), "utf8"));
  const composition = JSON.parse(await fs.readFile(path.join(outputDir, "composition.resolved.json"), "utf8"));
  const manifest = JSON.parse(await fs.readFile(path.join(outputDir, "manual-export-manifest.json"), "utf8"));
  const head = await fs.readFile(path.join(outputDir, "head.html"), "utf8");
  const html = await fs.readFile(path.join(outputDir, "html.html"), "utf8");
  const runtime = await fs.readFile(path.join(outputDir, "root.js"), "utf8");
  const preview = await fs.readFile(path.join(outputDir, "preview.html"), "utf8");

  assert.equal(rootTemplate.code, "CUSTOMER_PORTAL_GRANITE_RIDGE_LANDING_FIXTURE");
  assert.equal(rootTemplate.templateLanguage, "JTE");
  assert.equal(children.length, 12);
  assert.equal(payload.root.code, rootTemplate.code);
  assert.deepEqual(payload.children.map((child) => child.code), children.map((child) => child.code));
  for (const child of children) {
    assert.equal(child.parent.code, rootTemplate.code, child.code + " must record the family root as its parent");
    assert.equal(child.templateLanguage, "JTE");
    assert.ok(child.parameters.length > 0, child.code + " must expose at least one CMS parameter");
    for (const parameter of child.parameters) {
      assert.ok(parameter.code.startsWith(child.code + "_"), "child parameter " + parameter.code + " must be scoped to " + child.code);
    }
  }

  assert.deepEqual(composition.slots.ROOT_NAV, [children[0].code]);
  assert.deepEqual(composition.slots.ROOT_SECTIONS, children.slice(1).map((child) => child.code));
  assert.deepEqual(composition.dynamicData, {}, "this landing has no dynamic data source");
  assert.deepEqual(manifest.openedLiveContracts, []);
  assert.equal(manifest.uploadPerformed, false);
  assert.equal(manifest.launchState, "demonstration-only");

  assert.match(head, /name="robots" content="noindex,nofollow"/, "a demonstration landing must not be indexable");
  assert.match(html, /data-theme="snow"/);
  assert.match(html, /id="granite-ridge-landing"/);
  assert.match(html, /<!-- cms-child-slot:ROOT_NAV -->/);
  assert.match(html, /<!-- cms-child-slot:ROOT_SECTIONS -->/);

  const family = [rootTemplate].concat(children);
  const allFields = family.flatMap((item) => [item.head, item.html, item.css, item.javascript]).join("\n");
  assert.doesNotMatch(allFields, /fetch\(|XMLHttpRequest|credentials:/, "no landing block may call a backend");
  assert.doesNotMatch(allFields, /core-pim|core-acct|core-bill|core-svc|core-rm|oauth2/i, "no landing block may reference a Core service");
  assert.doesNotMatch(allFields, /dev-1\.servicewand\.com|lsrc\.pixelnation\.com/, "portal destinations are CMS parameters, never a baked host");
  for (const marker of ["@{", "!{", "<%", "%>"]) {
    assert.ok(!allFields.includes(marker), "the family must stay JTE-safe, found " + marker);
  }

  const declared = new Set(family.flatMap((item) => item.parameters.map((parameter) => parameter.code)));
  const referenced = new Set();
  for (const item of family) {
    for (const value of [item.head, item.html, item.css, item.javascript]) {
      for (const match of value.matchAll(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g)) referenced.add(match[1]);
    }
  }
  for (const code of referenced) assert.ok(declared.has(code), code + " is referenced but never declared");
  for (const code of declared) assert.ok(referenced.has(code), code + " is declared but never referenced");

  const portalParameters = rootTemplate.parameters.filter((parameter) => parameter.code.startsWith("ROOT_PORTAL_"));
  assert.equal(portalParameters.length, 3);
  for (const parameter of portalParameters) {
    assert.equal(parameter.type, "STRING");
    assert.equal(parameter.value, "", parameter.code + " must ship empty so an unconfigured package cannot emit a live-looking link");
  }

  const safeUrlSource = /function safeUrl\(value\) \{[\s\S]*?\n  \}/.exec(runtime);
  assert.ok(safeUrlSource, "the landing runtime must keep its URL guard");
  const safeUrl = new Function("return (" + safeUrlSource[0].replace(/^function safeUrl/, "function") + ")")();
  assert.equal(safeUrl("https://dev-1.servicewand.com/portal"), "https://dev-1.servicewand.com/portal");
  assert.equal(safeUrl("https://dev-1.servicewand.com/portal#/orders"), "https://dev-1.servicewand.com/portal#/orders");
  assert.equal(safeUrl("javascript:alert(1)"), "", "a javascript: destination must be rejected");
  assert.equal(safeUrl("http://insecure.example.com/x"), "", "a plaintext destination must be rejected");
  assert.equal(safeUrl("data:text/html,<b>x</b>"), "", "a data: destination must be rejected");
  assert.equal(safeUrl("/relative"), "", "a relative destination must be rejected");
  assert.equal(safeUrl(""), "");
  assert.equal(safeUrl(null), "");

  assert.match(runtime, /node\.disabled = true/, "an unconfigured portal CTA must fail closed through the accepted disabled treatment");
  assert.match(runtime, /node\.dataset\.portalDestination = "unset"/, "a disabled portal CTA must stay identifiable");
  assert.doesNotMatch(runtime, /"unavailable"/, "the accepted seo-cta states are idle, pending, success and error only");
  assert.doesNotMatch(runtime, /innerHTML/, "the landing runtime must not assign innerHTML");

  const hero = children[1];
  const proof = children[5];
  for (const block of [hero, proof]) {
    const mediaUrl = block.parameters.find((parameter) => parameter.code.endsWith("_MEDIA_URL"));
    assert.ok(mediaUrl, block.code + " must expose a media URL parameter");
    assert.equal(mediaUrl.value, "", "media ships empty and renders the accepted no-data slot");
    assert.match(block.html, /data-state="no-data"/);
    assert.doesNotMatch(block.html, /<img/, "an empty media slot must not emit an img that would paint its alt text");
  }

  const pricing = children[6];
  assert.doesNotMatch(pricing.html, /data-pim-/, "this landing has no PIM contract");
  const quoteRow = pricing.parameters.find((parameter) => parameter.code.endsWith("_ROW_3_VALUE"));
  assert.equal(quoteRow.value.en, "Quoted from measured area and trigger level", "the seasonal contract row must stay a quote, never a number");

  assert.match(preview, /<!doctype html>/);
  assert.ok(!preview.includes("${"), "the preview must resolve every parameter marker");
  assert.ok(preview.includes("Granite Ridge"));
  assert.ok(preview.includes("Snowfall") || preview.includes("snowfall"));

  console.log("granite-ridge-landing-manual-check ok: 12 JTE blocks, every parameter declared and used, https-only portal destinations that fail closed, no backend call and no PIM contract");
} finally {
  await fs.rm(outputDir, { recursive: true, force: true });
}
