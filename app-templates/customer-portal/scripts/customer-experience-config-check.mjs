import assert from "node:assert/strict";
import { assertValidCmsPayload } from "./cms-schema-validation.mjs";
import {
  buildCustomerExperienceReport,
  loadCustomerExperienceInputs,
  validateDescriptorSemantics,
  validateParameterRegistry,
} from "./customer-experience-config-report.mjs";

const inputs = await loadCustomerExperienceInputs();
const report = buildCustomerExperienceReport(inputs);

assert.equal(report.mode, "report-only");
assert.equal(report.writesPerformed, false);
assert.equal(report.publishable, false, "unknown PageContext URLs and login selector keep the report non-publishable");
assert.deepEqual(report.templates, {
  landing: { code: "CUSTOMER_EXPERIENCE_LANDING", parameterCount: 18 },
  portal: { code: "CUSTOMER_EXPERIENCE_PORTAL", parameterCount: 55 },
  login: { code: "CUSTOMER_EXPERIENCE_LOGIN", parameterCount: 25 },
  twoFactor: { code: "CUSTOMER_EXPERIENCE_AUTH_2FA", parameterCount: 24 },
});
assert.equal(report.profile.intent, "appointments-commerce");
assert.equal(report.profile.runtimeProfile, "spaTarget");
assert.deepEqual(report.profile.enabledModules, ["appointments", "orders", "services", "pricing", "products", "account", "cart", "checkout", "purchases", "plan", "profile"]);
assert.equal(report.navigation.landingUrl, null);
assert.equal(report.navigation.portalUrl, null);
assert.equal(report.deferredParameters.length, 10);
assert.equal(report.blockers.some((item) => item.id === "login-page-context-selector-unproven"), true);
assert.equal(report.findings.some((item) => item.id.startsWith("login-") || item.id === "tenant-specific-login-template"), false, "login is compiled directly from accepted generic source");
assert.equal(valueFor(report, "landing", "CX_THEME"), "beauty");
assert.equal(valueFor(report, "portal", "CX_THEME"), "beauty");
assert.equal(valueFor(report, "login", "CX_THEME"), "beauty");
assert.equal(valueFor(report, "twoFactor", "CX_THEME"), "beauty");
assert.equal(valueFor(report, "twoFactor", "CX_DIRECTION"), "ltr");
assert.equal(valueFor(report, "twoFactor", "TWO_FACTOR_BUTTON").en, "Verify");
assert.equal(valueFor(report, "portal", "PORTAL_ANONYMOUS_INTENT_MODE"), "closed");
assert.equal(valueFor(report, "portal", "PORTAL_REGISTRATION_MODE"), "closed");

const resolvedInputs = structuredClone(inputs);
resolvedInputs.descriptor.surfaces.landing.url = {
  status: "resolved",
  url: "https://dev-1.servicewand.com/pages/CALM_HARBOR_SPA_STAGING/public/landing.html",
  reason: null,
};
resolvedInputs.descriptor.surfaces.portal.url = {
  status: "resolved",
  url: "https://dev-1.servicewand.com/pages/CALM_HARBOR_SPA_STAGING/customer/portal.html",
  reason: null,
};
resolvedInputs.descriptor.surfaces.login.pageContextSelector = {
  status: "resolved",
  selector: "page-context-route",
  reason: null,
};
validateDescriptorSemantics(resolvedInputs.descriptor, resolvedInputs.registry);
const resolvedReport = buildCustomerExperienceReport(resolvedInputs);
assert.equal(resolvedReport.publishable, true, "synthetic trusted URL/selector inputs close every report-only blocker");
assert.equal(resolvedReport.deferredParameters.length, 0);
assert.equal(resolvedReport.navigation.servicesDestination, "https://dev-1.servicewand.com/pages/CALM_HARBOR_SPA_STAGING/customer/portal.html#/services");
assert.equal(valueFor(resolvedReport, "landing", "NAV_PORTAL_SERVICES_URL"), resolvedReport.navigation.servicesDestination);
assert.equal(valueFor(resolvedReport, "portal", "NAV_LOGOUT_RETURN_URL"), "https://dev-1.servicewand.com/pages/CALM_HARBOR_SPA_STAGING/customer/portal.html#/login");

const hvacInputs = structuredClone(inputs);
hvacInputs.descriptor.experience.id = "northwind-hvac-staging";
hvacInputs.descriptor.experience.vertical = "hvac";
hvacInputs.descriptor.experience.theme = "hvac";
hvacInputs.descriptor.experience.brandName.en = "Northwind HVAC";
hvacInputs.descriptor.surfaces.portal.profile = "on-demand-commerce";
hvacInputs.descriptor.surfaces.portal.capability = "current-staging";
hvacInputs.descriptor.surfaces.portal.capabilities = {
  booking: "closed",
  retail: "browse-only",
  planCommerce: "closed",
  payment: "closed",
  demoCommands: "closed",
};
hvacInputs.descriptor.content.portal.documentTitle.en = "Northwind HVAC | Customer Portal";
hvacInputs.descriptor.content.portal.navigation.primary.en = "Orders";
hvacInputs.descriptor.content.portal.navigation.care.en = "Equipment";
hvacInputs.descriptor.content.portal.navigation.services.en = "Services";
hvacInputs.descriptor.content.portal.navigation.products.en = "Products";
hvacInputs.descriptor.content.portal.primaryCtaLabel.en = "Request service";
hvacInputs.descriptor.deployment.organization = "NORTHWIND_HVAC_STAGING";
hvacInputs.descriptor.deployment.accountTypeCode = "CUSTOMER_ACCOUNT";
hvacInputs.descriptor.deployment.pim.organization = "NORTHWIND_HVAC_STAGING";
hvacInputs.descriptor.deployment.pim.enrichmentMode = "closed";
hvacInputs.descriptor.deployment.pim.pricingProductTypeCodes = ["HVAC_SERVICE"];
hvacInputs.descriptor.deployment.pim.productsProductTypeCodes = ["HVAC_PRODUCT"];
hvacInputs.evidence.landingContent.content.brand.name = "Northwind HVAC";
hvacInputs.evidence.landingContent.content.vertical = { name: "HVAC", slug: "hvac" };
hvacInputs.evidence.portalSource.runtime.vertical = "hvac";
hvacInputs.evidence.portalSource.runtime.theme = "hvac";
hvacInputs.evidence.portalSource.runtime.profile = "onDemand";
hvacInputs.evidence.portalSource.runtime.capability = "current-staging";
hvacInputs.evidence.portalSource.runtime.booking = "closed";
hvacInputs.evidence.portalSource.runtime.retail = "browse-only";
hvacInputs.evidence.portalSource.runtime.planCommerce = "closed";
hvacInputs.evidence.portalSource.runtime.demoCommands = "closed";
hvacInputs.evidence.portalSource.runtime.enabledModules = hvacInputs.registry.profiles["on-demand-commerce"].modules.slice();
hvacInputs.evidence.portalSource.account.organization = "NORTHWIND_HVAC_STAGING";
hvacInputs.evidence.portalSource.account.accountTypeCode = "CUSTOMER_ACCOUNT";
hvacInputs.evidence.portalSource.pim.organization = "NORTHWIND_HVAC_STAGING";
validateDescriptorSemantics(hvacInputs.descriptor, hvacInputs.registry);
const hvacReport = buildCustomerExperienceReport(hvacInputs);
assert.equal(hvacReport.profile.runtimeProfile, "onDemand", "a second vertical resolves through the same generic registry");
assert.equal(valueFor(hvacReport, "portal", "CX_BRAND_NAME").en, "Northwind HVAC");
assert.equal(valueFor(hvacReport, "portal", "PORTAL_PROFILE"), "onDemand");
assert.equal(valueFor(hvacReport, "portal", "PORTAL_RETAIL_MODE"), "browse-only");

const invalidAnonymousIntent = structuredClone(inputs.descriptor);
invalidAnonymousIntent.surfaces.portal.capabilities.booking = "closed";
invalidAnonymousIntent.surfaces.portal.capabilities.retail = "browse-only";
invalidAnonymousIntent.surfaces.portal.anonymousIntent.mode = "selection-only";
assert.throws(() => validateDescriptorSemantics(invalidAnonymousIntent, inputs.registry), /Anonymous selection requires/);

const unresolvedRegistration = structuredClone(inputs.descriptor);
unresolvedRegistration.surfaces.portal.registration.mode = "core-auth";
unresolvedRegistration.surfaces.portal.registration.destination = {
  status: "unresolved",
  url: null,
  reason: "Registration route is unknown.",
};
assert.throws(() => validateDescriptorSemantics(unresolvedRegistration, inputs.registry), /requires a resolved destination/);

const crossOrigin = structuredClone(resolvedInputs.descriptor);
crossOrigin.surfaces.portal.url.url = "https://attacker.invalid/portal";
assert.throws(() => validateDescriptorSemantics(crossOrigin, inputs.registry), /origin is not allowlisted/);

const unknownRoute = structuredClone(inputs.descriptor);
unknownRoute.surfaces.landing.servicesDestination = "portal-route:not.registered";
assert.throws(() => validateDescriptorSemantics(unknownRoute, inputs.registry), /unknown route/);

const productionDemo = structuredClone(inputs.descriptor);
productionDemo.classification = "production-customer-experience";
productionDemo.deployment.environment = "production";
assert.throws(() => validateDescriptorSemantics(productionDemo, inputs.registry), /Production descriptors cannot inherit/);

const missingCart = structuredClone(inputs.registry);
missingCart.profiles["appointments-commerce"].modules = missingCart.profiles["appointments-commerce"].modules.filter((moduleId) => moduleId !== "cart");
validateParameterRegistry(missingCart);
assert.throws(() => validateDescriptorSemantics(inputs.descriptor, missingCart), /open retail requires profile modules: cart/);

const duplicateParameter = structuredClone(inputs.registry);
duplicateParameter.parameters.push(structuredClone(duplicateParameter.parameters[0]));
assert.throws(() => validateParameterRegistry(duplicateParameter), /Duplicate customer experience parameter code/);

const schemaEscape = structuredClone(inputs.descriptor);
schemaEscape.privateCustomerId = "must-not-be-accepted";
assert.throws(() => assertValidCmsPayload(inputs.schema, schemaEscape, "mutated descriptor"), /privateCustomerId is not allowed/);

const evidenceDrift = structuredClone(inputs);
evidenceDrift.evidence.portalSource.runtime.theme = "hvac";
assert.throws(() => buildCustomerExperienceReport(evidenceDrift), /Portal source theme disagrees/);

console.log("customer-experience-config-check ok: 114 definitions, Beauty and HVAC report-only maps, generic AUTH_2FA contract, anonymous intent/registration fail closed, URL/profile/production/schema mutations rejected");

function valueFor(candidate, surface, code) {
  const parameter = candidate.parameterMaps[surface].find((item) => item.code === code);
  assert.ok(parameter, surface + " parameter is present: " + code);
  return parameter.value;
}
