import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { buildCustomerExperience } from "./build-customer-experience.mjs";
import { loadCustomerExperienceInputs, validateDescriptorSemantics } from "./customer-experience-config-report.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const checkRoot = path.join(portalRoot, "dist/customer-experience/build-check");
const inputs = await loadCustomerExperienceInputs();
const beauty = resolvedClone(inputs, "CALM_HARBOR_SPA_STAGING");
const hvac = resolvedClone(inputs, "NORTHWIND_HVAC_STAGING");

hvac.descriptor.experience.id = "northwind-hvac-staging";
hvac.descriptor.experience.vertical = "hvac";
hvac.descriptor.experience.theme = "hvac";
hvac.descriptor.experience.brandName.en = "Northwind HVAC";
hvac.descriptor.surfaces.portal.profile = "on-demand-commerce";
hvac.descriptor.surfaces.portal.capability = "current-staging";
hvac.descriptor.surfaces.portal.capabilities = { booking: "closed", retail: "browse-only", planCommerce: "closed", payment: "closed", demoCommands: "closed" };
hvac.descriptor.content.portal.documentTitle.en = "Northwind HVAC | Customer Portal";
hvac.descriptor.content.portal.navigation.primary.en = "Orders";
hvac.descriptor.content.portal.navigation.care.en = "Equipment";
hvac.descriptor.content.portal.navigation.services.en = "Services";
hvac.descriptor.content.portal.navigation.products.en = "Products";
hvac.descriptor.content.portal.primaryCtaLabel.en = "Request service";
hvac.descriptor.content.twoFactor.documentTitle.en = "Two-step verification — Northwind HVAC";
hvac.descriptor.deployment.organization = "NORTHWIND_HVAC_STAGING";
hvac.descriptor.deployment.accountTypeCode = "CUSTOMER_ACCOUNT";
hvac.descriptor.deployment.pim.organization = "NORTHWIND_HVAC_STAGING";
hvac.descriptor.deployment.pim.enrichmentMode = "closed";
hvac.descriptor.deployment.pim.pricingProductTypeCodes = ["HVAC_SERVICE"];
hvac.descriptor.deployment.pim.productsProductTypeCodes = ["HVAC_PRODUCT"];
hvac.evidence.landingContent.content.brand.name = "Northwind HVAC";
hvac.evidence.landingContent.content.vertical = { name: "HVAC", slug: "hvac" };
hvac.evidence.portalSource.runtime.vertical = "hvac";
hvac.evidence.portalSource.runtime.theme = "hvac";
hvac.evidence.portalSource.runtime.profile = "onDemand";
hvac.evidence.portalSource.runtime.capability = "current-staging";
hvac.evidence.portalSource.runtime.booking = "closed";
hvac.evidence.portalSource.runtime.retail = "browse-only";
hvac.evidence.portalSource.runtime.planCommerce = "closed";
hvac.evidence.portalSource.runtime.demoCommands = "closed";
hvac.evidence.portalSource.runtime.enabledModules = hvac.registry.profiles["on-demand-commerce"].modules.slice();
hvac.evidence.portalSource.account.organization = "NORTHWIND_HVAC_STAGING";
hvac.evidence.portalSource.account.accountTypeCode = "CUSTOMER_ACCOUNT";
hvac.evidence.portalSource.pim.organization = "NORTHWIND_HVAC_STAGING";

try {
  validateDescriptorSemantics(beauty.descriptor, beauty.registry);
  validateDescriptorSemantics(hvac.descriptor, hvac.registry);
  const beautyBuild = await buildCustomerExperience({ inputs: beauty, outputDir: path.join(checkRoot, "beauty"), requireResolved: true });
  const hvacBuild = await buildCustomerExperience({ inputs: hvac, outputDir: path.join(checkRoot, "hvac") });
  const beautyRepeat = await buildCustomerExperience({ inputs: beauty, outputDir: path.join(checkRoot, "beauty-repeat"), requireResolved: true });

  assert.equal(beautyBuild.report.publishable, true);
  assert.equal(hvacBuild.report.publishable, false, "non-Beauty landing child content mapping remains fail-closed");
  assert.equal(hvacBuild.report.blockers.some((item) => item.id === "landing-content-map-not-compiled"), true);
  assert.deepEqual(beautyBuild.manifest.templates, beautyRepeat.manifest.templates, "repeated builds are deterministic");
  assert.deepEqual(templateCodes(beautyBuild), templateCodes(hvacBuild), "verticals use the same four generic template codes");
  assert.equal(beautyBuild.templates.portal.javascript, hvacBuild.templates.portal.javascript, "verticals use the same portal runtime");
  assert.equal(beautyBuild.templates.portal.javascript.includes('returnUrl.hash = "#/orders"'), false, "OIDC return is route-parameterized");
  assert.equal(beautyBuild.templates.portal.javascript.includes("oidc-return-invalid"), true, "OIDC return URL is allowlist-guarded");
  assert.equal(beautyBuild.templates.landing.html, hvacBuild.templates.landing.html, "verticals use the same landing structure");
  assert.equal(valueFor(beautyBuild, "portal", "CX_BRAND_NAME").en, "Calm Harbor Spa");
  assert.equal(valueFor(hvacBuild, "portal", "CX_BRAND_NAME").en, "Northwind HVAC");
  assert.equal(valueFor(beautyBuild, "portal", "PORTAL_PROFILE"), "spaTarget");
  assert.equal(valueFor(hvacBuild, "portal", "PORTAL_PROFILE"), "onDemand");
  assert.match(valueFor(hvacBuild, "landing", "NAV_PORTAL_SERVICES_URL"), /NORTHWIND_HVAC_STAGING\/customer\/portal\.html#\/services$/);
  assert.equal(beautyBuild.templates.login.html.includes("{{CSRF_TOKEN}}"), true);
  assert.equal(hvacBuild.templates.login.html.includes("${CX_BRAND_NAME@LOCALIZED_STRING_SS}"), true);
  assert.equal(beautyBuild.templates.twoFactor.html, hvacBuild.templates.twoFactor.html, "verticals use one generic AUTH_2FA structure");
  assert.equal(beautyBuild.templates.twoFactor.html.includes("{{TWO_FACTOR_SECRET}}"), true);
  assert.equal(beautyBuild.templates.twoFactor.html.includes("{{TWO_FACTOR_OTPAUTH_URI}}"), false);
  assert.equal(beautyBuild.templates.twoFactor.javascript, "", "AUTH_2FA stays script-free");
  assert.equal(valueFor(beautyBuild, "twoFactor", "CX_BRAND_NAME").en, "Calm Harbor Spa");
  assert.equal(valueFor(hvacBuild, "twoFactor", "CX_BRAND_NAME").en, "Northwind HVAC");
  assert.equal(valueFor(hvacBuild, "twoFactor", "TWO_FACTOR_DOCUMENT_TITLE").en, "Two-step verification — Northwind HVAC");
  for (const template of Object.values(beautyBuild.templates)) {
    assert.equal(template.parameters.every((parameter) => isEmptyDefault(parameter.value)), true, template.code + " has neutral defaults");
  }
  console.log("customer-experience-build-check ok: Beauty and HVAC use four identical generic templates, including AUTH_2FA, with distinct maps; non-Beauty landing content stays fail-closed");
} finally {
  await fs.rm(checkRoot, { recursive: true, force: true });
}

function resolvedClone(source, tenant) {
  const result = structuredClone(source);
  result.descriptor.surfaces.landing.url = { status: "resolved", url: "https://dev-1.servicewand.com/pages/" + tenant + "/public/landing.html", reason: null };
  result.descriptor.surfaces.portal.url = { status: "resolved", url: "https://dev-1.servicewand.com/pages/" + tenant + "/customer/portal.html", reason: null };
  result.descriptor.surfaces.login.pageContextSelector = { status: "resolved", selector: "page-context-route", reason: null };
  return result;
}

function templateCodes(build) {
  return Object.fromEntries(Object.entries(build.templates).map(([surface, template]) => [surface, template.code]));
}

function valueFor(build, surface, code) {
  const item = build.pageContexts[surface].parameters.find((parameter) => parameter.code === code);
  assert.ok(item, surface + " PageContext parameter exists: " + code);
  return item.value;
}

function isEmptyDefault(value) {
  return value === "" || (value && typeof value === "object" && !Array.isArray(value) && Object.values(value).every((item) => item === ""));
}
