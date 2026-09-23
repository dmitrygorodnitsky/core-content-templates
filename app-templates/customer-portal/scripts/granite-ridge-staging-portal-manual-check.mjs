import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assertLiveBundle, liveFixtureMarkers } from "./build-live-portal-runtime.mjs";
import { assertLiveTemplate, coreOidcCallback, exportLivePortalManual, liveDeploymentParameters, operatorParameterPlaceholder } from "./export-live-portal-manual.mjs";

const root = path.resolve("app-templates/customer-portal");
const inputPath = path.join(root, "cms/granite-ridge-snow.customer-portal-staging.json");
const runtimePath = path.join(root, "runtime/manual/granite-ridge-staging-runtime.js");
const fixtureRuntimePath = path.join(root, "runtime/manual/granite-ridge-fixture-runtime.js");
const fixtureSourcePath = path.join(root, "content/cases/granite-ridge-snow.customer-portal-fixture.json");
const outputDir = path.join(root, "dist/manual-upload/.granite-ridge-staging-portal-manual-check");
const { portalProfiles, readServiceGeography } = await import(pathToFileURL(path.join(root, "runtime/src/config.js")).href);

try {
  await fs.rm(outputDir, { recursive: true, force: true });
  await exportLivePortalManual({ inputPath, runtimePath, outputDir });

  const source = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const template = JSON.parse(await fs.readFile(path.join(outputDir, "root/template.json"), "utf8"));
  const familyPayload = JSON.parse(await fs.readFile(path.join(outputDir, "cms-family.payload.json"), "utf8"));
  const manifest = JSON.parse(await fs.readFile(path.join(outputDir, "manual-export-manifest.json"), "utf8"));
  const parameters = JSON.parse(await fs.readFile(path.join(outputDir, "root/parameters.json"), "utf8"));
  const readme = await fs.readFile(path.join(outputDir, "README.md"), "utf8");
  const preview = await fs.readFile(path.join(outputDir, "preview.html"), "utf8");
  const { head, html, css, javascript } = template;
  const dataset = rootDataset(html);

  assert.equal(template.code, "CUSTOMER_PORTAL_GRANITE_RIDGE_STAGING");
  assert.equal(template.templateLanguage, "JTE", "JTE is the only template language proven against this CMS");
  assert.equal(familyPayload.schemaVersion, 1);
  assert.deepEqual(familyPayload.root, template, "the uploader sends exactly the reference record");
  assert.deepEqual(familyPayload.children, []);
  assert.deepEqual(parameters, template.parameters);

  assert.equal(dataset["data-portal-data-mode"], "live");
  assert.equal(dataset["data-portal-auth-mode"], "required");
  assert.equal(dataset["data-portal-organization"], "SNOWLIMITLESS", "the tenant code is a deployment value and ships");
  assert.equal(dataset["data-portal-account-type-code"], source.account.accountTypeCode, "the customer Account types come from the exporter input");
  for (const code of dataset["data-portal-account-type-code"].split(",")) assert.match(code, /^[A-Z][A-Z0-9_]*$/, "every listed Account type is a plain code");
  assert.equal(dataset["data-portal-vertical"], "snow");
  assert.equal(dataset["data-portal-profile"], "stormRetail");
  assert.equal(dataset["data-portal-theme"], "snow");
  assert.equal(dataset["data-portal-router-mode"], "hash");
  assert.equal(dataset["data-portal-default-route"], "overview");
  assert.equal(dataset["data-portal-enabled-modules"], source.runtime.enabledModules.join(","), "the module list comes from the exporter input, so it grows without a code change");
  const enabled = dataset["data-portal-enabled-modules"].split(",");
  for (const id of enabled) assert.ok(portalProfiles.stormRetail.modules.includes(id), id + " must be owned by the stormRetail profile");
  assert.equal(enabled.includes("account"), false, "the runtime resolves the customer Account for every signed-in entry, so the list does not carry it");
  assert.equal(dataset["data-portal-brand-name"], source.shell.brandName);
  assert.equal("data-portal-case" in dataset, false, "portal_case is a fixture selector and must not ship in a live root");
  assert.doesNotMatch(html, /account-id|user-id|access-token|bearer/i);
  for (const key of ["data-portal-core-api-base", "data-portal-account-api-base", "data-portal-bill-api-base", "data-portal-resource-api-base", "data-portal-auth-core-base", "data-portal-auth-callback-path"]) {
    assert.match(dataset[key], /^\/(?!\/)[A-Za-z0-9._~/-]*$/, key + " must be a same-origin path");
  }
  assert.equal(dataset["data-portal-auth-callback-path"], coreOidcCallback.callbackPath);
  assert.equal(dataset["data-portal-auth-return-storage-key"], coreOidcCallback.returnStorageKey, "the shared callback page reads this key to return to the portal");
  assert.equal(dataset["data-portal-auth-logout-return-storage-key"], coreOidcCallback.logoutReturnStorageKey);
  const geography = readServiceGeography(dataset["data-portal-service-geography"]);
  assert.ok(geography, "the runtime must accept the shipped service geography");
  assert.deepEqual(geography, readServiceGeography(JSON.stringify(source.serviceGeography)));
  assert.equal(Object.keys(geography.zones).length, Object.keys(source.serviceGeography.zones).length, "every zone reaches the runtime");

  assert.deepEqual(template.parameters.map((item) => item.code), [...liveDeploymentParameters]);
  for (const item of template.parameters) {
    assert.equal(item.type, "STRING");
    assert.equal(dataset[attributeFor(item.code)], "${" + item.code + "@STRING}", item.code + " reaches the root element as a CMS marker");
    if (item.code === "PORTAL_REQUEST_FORM_URL") assert.match(item.value, /^https:\/\//);
    else assert.equal(item.value, operatorParameterPlaceholder, item.code + " is operator-owned and ships only the placeholder the runtime reads as not set");
  }
  const withValue = (code, value) => Object.assign({}, template, { parameters: template.parameters.map((item) => (item.code === code ? Object.assign({}, item, { value }) : item)) });
  assert.doesNotThrow(() => assertLiveTemplate(template));
  assert.throws(() => assertLiveTemplate(withValue("PORTAL_MAPS_API_KEY", "real-browser-key")), /ships only the # placeholder/, "a real Google key is refused");
  assert.throws(() => assertLiveTemplate(withValue("PORTAL_WEATHER_CLIENT_SECRET", "s3cretValue")), /ships only the # placeholder/, "a real Xweather secret is refused");
  assert.throws(() => assertLiveTemplate(withValue("PORTAL_WEATHER_CLIENT_ID", "")), /ships only the # placeholder/, "an empty key cannot back a CMS page, so it is refused too");
  assert.throws(() => assertLiveTemplate(withValue("PORTAL_REQUEST_FORM_URL", "http://example.test/form")), /absolute https/);
  const byCode = Object.fromEntries(template.parameters.map((item) => [item.code, item.nls.en.DESCRIPTION]));
  for (const code of ["PORTAL_WEATHER_CLIENT_ID", "PORTAL_WEATHER_CLIENT_SECRET", "PORTAL_MAPS_API_KEY"]) {
    assert.match(byCode[code], /visible in page source/, code + " must tell the operator the value is public");
  }
  assert.match(byCode.PORTAL_MAPS_API_KEY, /HTTP referrer/);
  assert.match(byCode.PORTAL_WEATHER_CLIENT_ID, /namespace/);

  const fixtureSource = JSON.parse(await fs.readFile(fixtureSourcePath, "utf8"));
  const shipped = JSON.stringify(familyPayload) + readme + preview + JSON.stringify(manifest);
  for (const value of Object.values(fixtureSource.runtime.weather || {}).filter((item) => typeof item === "string" && item.length > 8)) {
    assert.equal(shipped.includes(value), false, "a fixture Xweather credential must never reach the live package");
  }
  assert.equal(shipped.toLowerCase().includes(fixtureSource.shell.brandName.toLowerCase()), false, "the demonstration brand never ships in the live package");
  assert.doesNotMatch(shipped, /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.|AIza[0-9A-Za-z_-]{35}/, "no token or Google key ships");

  assert.match(head, /oidc-client-ts\/3\.0\.1\/browser\/oidc-client-ts\.js/);
  assert.match(head, /integrity="sha384-EX6IlpbPbIxs1Zi4cPDGkFJm4YuPKx31VxifYK2nLwYtwc7EoKJRA9a2BFBNxz1H"/);
  assert.match(head, /name="robots" content="noindex,nofollow"/, "a staging portal must not be indexable");
  assert.doesNotMatch(head + html, /maps\.googleapis\.com/, "the Google script is loaded lazily by the property map, never by the page");
  for (const selector of [".oidc-status", ".oidc-spinner", ".account-gate", ".ov-map"]) {
    assert.ok(css.includes(selector), "missing stylesheet selector " + selector);
  }

  assert.doesNotThrow(() => assertLiveBundle(javascript));
  for (const marker of liveFixtureMarkers) assert.equal(javascript.includes(marker), false, "fixture marker " + marker + " leaked into the live runtime");
  assert.doesNotMatch(javascript, /granite-ridge-snow|Granite Ridge/, "the snow demonstration case must not ship in the live runtime");
  assert.doesNotMatch(javascript, /^\s*import\s/m);
  assert.doesNotThrow(() => Function(javascript));
  assert.match(javascript, /signinRedirect/);
  assert.match(javascript, /signoutRedirect/);
  assert.match(javascript, /oauth-protected-resource/);
  assert.match(javascript, /core-oidc-auth/);
  assert.match(javascript, /account-bootstrap/);
  assert.match(javascript, /customerAccountRequired/, "the runtime must resolve the customer Account without the module list naming it");
  assert.match(javascript, /property: "user\.id"/);
  assert.match(javascript, /property: "type\.code"/);
  assert.match(javascript, /operator: "IN", property: "type\.code"/, "a list of Account types is read through one IN filter");
  assert.match(javascript, /SNOW_REMOVAL_PROPERTY/);
  assert.match(javascript, /browser-filtered/);
  for (const [field, value] of Object.entries({ head, html, css, javascript })) {
    assert.doesNotMatch(value, /@\{|!\{|<%|%>|@(param|import|template|if|for|while|switch|else)\b/, field + " must stay JTE-safe");
    assert.equal(value.replace(/\$\{[A-Z0-9_]+@STRING\}/g, "").includes("${"), false, field + " carries a ${ opener that is not a declared parameter marker");
  }
  assert.equal((head + css + javascript).includes("${"), false, "only the root element carries parameter markers");
  assert.doesNotMatch(javascript, /<\/script/i);

  assert.equal(manifest.uploadPerformed, false);
  assert.equal(manifest.launchState, "staging-only");
  assert.equal(manifest.runtime.sameOriginRequired, true);
  assert.equal(manifest.runtime.dataMode, "live");
  assert.deepEqual(manifest.runtime.openedModules, source.runtime.enabledModules);
  assert.equal(manifest.runtime.auth.flow, "oidc-authorization-code-pkce");
  assert.match(readme, /same origin as Core/);
  assert.equal(preview.includes("${"), false, "the preview resolves every parameter marker");
  assert.match(preview, /data-portal-weather-client-id="#"/, "the preview renders the placeholder the way CMS will");
  assert.ok(preview.length > 500_000, "the standalone preview must inline the whole runtime");

  const refusals = [
    ["fixture data mode", (s) => { s.runtime.dataMode = "fixture"; }, /live data mode/],
    ["a fixture case selector", (s) => { s.runtime.case = "granite-ridge-snow"; }, /does not ship: case/],
    ["a fixture auth mode", (s) => { s.runtime.authMode = "fixture"; }, /require Core OIDC/],
    ["a missing auth contract", (s) => { delete s.auth; }, /auth contract/],
    ["an auth contract without its callback", (s) => { delete s.auth.callbackPath; }, /missing auth\.callbackPath/],
    ["a cross-origin callback", (s) => { s.auth.callbackPath = "https://login.example.test/core/oauth2-callback.html"; }, /same-origin/],
    ["a return key the shared callback does not read", (s) => { s.auth.returnStorageKey = "portal-return"; }, /oidc-return-url/],
    ["a missing account contract", (s) => { delete s.account; }, /customer Account contract/],
    ["a cross-origin Account base", (s) => { s.account.accountApiBase = "https://evil.example.test/core-acct"; }, /same-origin/],
    ["a protocol-relative Resource base", (s) => { s.account.resourceApiBase = "//evil.example.test/core-rm"; }, /same-origin/],
    ["a backslash Bill base", (s) => { s.account.billApiBase = "/\\evil.example.test/core-bill"; }, /same-origin/],
    ["a cross-origin Core auth base", (s) => { s.auth.coreBase = "https://evil.example.test/core"; }, /same-origin/],
    ["a module the profile does not own", (s) => { s.runtime.enabledModules.push("products"); }, /Module products is not part of profile stormRetail/],
    ["a spa module", (s) => { s.runtime.enabledModules.push("appointments"); }, /Module appointments is not part of profile stormRetail/],
    ["a PIM module without a PIM contract", (s) => { s.runtime.enabledModules.push("pricing"); }, /carries no PIM contract/],
    ["the account module the profile does not own", (s) => { s.runtime.enabledModules.push("account"); }, /Module account is not part of profile stormRetail/],
    ["a default route whose module is off", (s) => { s.runtime.defaultRoute = "appointments"; }, /Default route appointments/],
    ["a profile the vertical cannot use", (s) => { s.runtime.vertical = "beauty"; s.runtime.theme = "beauty"; }, /cannot serve vertical beauty/],
    ["a malformed service geography", (s) => { s.serviceGeography.map.zoom = null; }, /serviceGeography/],
    ["no service geography", (s) => { delete s.serviceGeography; }, /needs serviceGeography/],
    ["a weather credential in the source", (s) => { s.runtime.weather = { clientId: "id", clientSecret: "secret" }; }, /does not ship: weather/],
    ["an Account id in the source", (s) => { s.account.accountId = 694; }, /does not ship: accountId/],
    ["a PIM contract", (s) => { s.pim = { organization: "SNOWLIMITLESS" }; }, /does not ship: pim/],
    ["a non-https form address", (s) => { s.shell.requestFormUrl = "http://dev-1.servicewand.com/pages/SNOWLIMITLESS/request-quote"; }, /absolute https/],
    ["an Account type list with an empty item", (s) => { s.account.accountTypeCode = "SNOW_RESIDENTIAL_CUSTOMER,,CUSTOMER"; }, /comma-separated list/],
    ["an Account type list with a space", (s) => { s.account.accountTypeCode = "SNOW_RESIDENTIAL_CUSTOMER, CUSTOMER"; }, /comma-separated list/],
    ["a lowercase Account type", (s) => { s.account.accountTypeCode = "customer"; }, /upper-snake code/],
    ["an Account type listed twice", (s) => { s.account.accountTypeCode = "CUSTOMER,CUSTOMER"; }, /lists a code twice/],
  ];
  for (const [label, mutate, expected] of refusals) {
    const mutated = structuredClone(source);
    mutate(mutated);
    const mutatedInput = path.join(outputDir, "refused-source.json");
    await fs.writeFile(mutatedInput, JSON.stringify(mutated));
    await assert.rejects(exportLivePortalManual({ inputPath: mutatedInput, runtimePath, outputDir: outputDir + "-refused" }), expected, "the exporter must refuse " + label);
  }
  await assert.rejects(exportLivePortalManual({ inputPath, runtimePath: fixtureRuntimePath, outputDir: outputDir + "-refused" }), /Fixture data leaked/, "a fixture bundle must never ship as the live runtime");
  await assert.rejects(exportLivePortalManual({ inputPath, runtimePath, outputDir: path.join(root, "runtime/escaped-package") }), /dist\/manual-upload/);

  const growth = portalProfiles.stormRetail.modules.find((id) => !source.runtime.enabledModules.includes(id) && id !== "pricing");
  if (growth) {
    const grown = structuredClone(source);
    grown.runtime.enabledModules.push(growth);
    const grownInput = path.join(outputDir, "grown-source.json");
    await fs.writeFile(grownInput, JSON.stringify(grown));
    const grownPackage = await exportLivePortalManual({ inputPath: grownInput, runtimePath, outputDir: outputDir + "-grown" });
    assert.deepEqual(grownPackage.manifest.runtime.openedModules, [...source.runtime.enabledModules, growth], "a module the profile owns joins through the input alone");
  }

  console.log("granite-ridge-staging-portal-manual-check ok: JTE-safe live root with Core OIDC, the customer Account gate and " + enabled.join(", ") + "; same-origin bases, operator keys shipped only as the # placeholder, no fixture data or demonstration brand, and " + (refusals.length + 2) + " refusals");
} finally {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.rm(outputDir + "-refused", { recursive: true, force: true });
  await fs.rm(outputDir + "-grown", { recursive: true, force: true });
  await fs.rm(path.join(root, "runtime/escaped-package"), { recursive: true, force: true });
}

function rootDataset(html) {
  const match = /^<section id="app" ([^>]*)><\/section>$/.exec(html);
  assert.ok(match, "the root element is the whole html field");
  const dataset = {};
  for (const attribute of match[1].matchAll(/([a-z-]+)="([^"]*)"/g)) dataset[attribute[1]] = decodeHtml(attribute[2]);
  return dataset;
}

function decodeHtml(value) {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function attributeFor(code) {
  return {
    PORTAL_REQUEST_FORM_URL: "data-portal-request-form-url",
    PORTAL_WEATHER_CLIENT_ID: "data-portal-weather-client-id",
    PORTAL_WEATHER_CLIENT_SECRET: "data-portal-weather-client-secret",
    PORTAL_MAPS_API_KEY: "data-portal-maps-api-key",
    PORTAL_MAPS_MAP_ID: "data-portal-maps-map-id",
  }[code];
}
