import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertValidCmsPayload } from "./cms-schema-validation.mjs";
import { validateAcceptedLoginSource } from "./customer-experience-auth-source.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const portalRoot = path.resolve(scriptsDir, "..");
const repositoryRoot = path.resolve(portalRoot, "../..");

export const DEFAULT_EXPERIENCE_PATH = path.join(portalRoot, "experience/descriptors/calm-harbor-spa.staging.json");
export const DEFAULT_SCHEMA_PATH = path.join(portalRoot, "experience/config/customer-experience.schema.json");
export const DEFAULT_REGISTRY_PATH = path.join(portalRoot, "experience/config/customer-experience.parameters.json");

const SURFACES = ["landing", "portal", "login", "twoFactor"];
const VERTICALS = ["hvac", "snow", "lawn", "pool", "roofing", "pest", "health", "beauty"];
const FORBIDDEN_PARAMETER_FRAGMENTS = [
  "ACCESS_TOKEN", "API_KEY", "PASSWORD_VALUE", "CSRF_TOKEN", "USER_ID",
  "CUSTOMER_ID", "ACCOUNT_ID", "ORDER_ID", "APPOINTMENT_ID", "ROLE_RESULT",
  "AUTHORIZATION_RESULT", "ENTITLEMENT_ID", "SESSION_ID",
];

export async function loadCustomerExperienceInputs(options = {}) {
  const descriptorPath = path.resolve(options.descriptorPath || DEFAULT_EXPERIENCE_PATH);
  const schemaPath = path.resolve(options.schemaPath || DEFAULT_SCHEMA_PATH);
  const registryPath = path.resolve(options.registryPath || DEFAULT_REGISTRY_PATH);
  const [descriptor, schema, registry] = await Promise.all([
    readJson(descriptorPath),
    readJson(schemaPath),
    readJson(registryPath),
  ]);

  assertValidCmsPayload(schema, descriptor, "Customer experience descriptor");
  validateParameterRegistry(registry);
  validateDescriptorSemantics(descriptor, registry);

  const evidence = {};
  for (const [key, reference] of Object.entries(descriptor.evidenceRefs)) {
    const evidencePath = safeRepositoryPath(reference);
    evidence[key] = path.extname(evidencePath) === ".json"
      ? await readJson(evidencePath)
      : await fs.readFile(evidencePath, "utf8");
  }

  return { descriptor, schema, registry, evidence, paths: { descriptorPath, schemaPath, registryPath } };
}

export function buildCustomerExperienceReport(inputs) {
  const { descriptor, registry, evidence } = inputs;
  validateParameterRegistry(registry);
  validateDescriptorSemantics(descriptor, registry);
  const findings = compareEvidence(descriptor, registry, evidence);
  const profile = registry.profiles[descriptor.surfaces.portal.profile];
  const resolved = resolveNavigation(descriptor, registry);
  const context = buildParameterContext(descriptor, profile, resolved, evidence.landingContent);
  const compiled = compileParameters(registry, context, resolved.deferredReasons);
  const sharedChecks = compareSharedParameters(registry, compiled.parameterMaps);
  const blockers = compiled.deferred.map((item) => ({
    id: "parameter-unresolved",
    surface: item.surface,
    code: item.code,
    reason: item.reason,
  }));

  if (descriptor.surfaces.login.pageContextSelector.status !== "resolved") {
    blockers.push({
      id: "login-page-context-selector-unproven",
      surface: "login",
      code: null,
      reason: descriptor.surfaces.login.pageContextSelector.reason,
    });
  }

  return {
    schemaVersion: 1,
    mode: "report-only",
    writesPerformed: false,
    publishable: blockers.length === 0,
    experience: {
      id: descriptor.experience.id,
      classification: descriptor.classification,
      environment: descriptor.deployment.environment,
      vertical: descriptor.experience.vertical,
      theme: descriptor.experience.theme,
    },
    templates: Object.fromEntries(SURFACES.map((surface) => [surface, {
      code: registry.templateCodes[surface],
      parameterCount: compiled.parameterMaps[surface].length,
    }])),
    profile: {
      intent: descriptor.surfaces.portal.profile,
      runtimeProfile: profile.runtimeProfile,
      enabledModules: profile.modules,
      navigationRoutes: profile.navigationRoutes,
    },
    navigation: Object.fromEntries(Object.entries(resolved.destinations).map(([key, value]) => [key, value ?? null])),
    parameterMaps: compiled.parameterMaps,
    deferredParameters: compiled.deferred,
    blockers,
    findings,
    checks: [
      { id: "descriptor-schema", status: "pass", detail: "draft 2020-12 schema validation passed" },
      { id: "registry", status: "pass", detail: registry.parameters.length + " unique parameter definitions" },
      { id: "descriptor-semantics", status: "pass", detail: "capability, route, URL, and live/staging rules passed" },
      { id: "shared-parameter-equality", status: "pass", detail: sharedChecks.length + " shared values agree across consumers" },
      { id: "filesystem-writes", status: "pass", detail: "report builder has no output/write path" },
    ],
  };
}

export function validateParameterRegistry(registry) {
  if (!isPlainObject(registry) || registry.schemaVersion !== 1 || registry.mode !== "report-only") {
    throw new Error("Customer experience parameter registry must be schemaVersion 1 and report-only");
  }
  if (!isPlainObject(registry.templateCodes) || !isPlainObject(registry.routes)
      || !isPlainObject(registry.routeModules) || !isPlainObject(registry.profiles)
      || !Array.isArray(registry.parameters)) {
    throw new Error("Customer experience parameter registry is incomplete");
  }
  if (JSON.stringify(registry.consumers) !== JSON.stringify(SURFACES)) {
    throw new Error("Customer experience registry consumers must be landing, portal, login, twoFactor in stable order");
  }
  const cmsTypes = new Set(registry.cmsTypes || []);
  if (!cmsTypes.size) throw new Error("Customer experience registry must declare CMS types");

  for (const surface of SURFACES) {
    const code = registry.templateCodes[surface];
    if (!/^CUSTOMER_EXPERIENCE_[A-Z0-9_]+$/.test(code)) throw new Error("Generic template code is invalid for " + surface);
    if (/CALM|HARBOR|SPA_STAGING/.test(code)) throw new Error("Generic template code contains tenant identity: " + code);
  }

  for (const [routeId, routePath] of Object.entries(registry.routes)) {
    if (!routeId || typeof routePath !== "string" || !/^\/[A-Za-z0-9./_-]*$/.test(routePath)) {
      throw new Error("Invalid registered route " + routeId);
    }
    if (!Object.prototype.hasOwnProperty.call(registry.routeModules, routeId)) {
      throw new Error("Registered route has no module mapping: " + routeId);
    }
  }

  for (const [profileId, profile] of Object.entries(registry.profiles)) {
    if (!/^[a-z][a-z0-9-]*$/.test(profileId) || !isPlainObject(profile)) throw new Error("Invalid profile " + profileId);
    for (const key of ["verticals", "modules", "navigationRoutes"]) {
      if (!isUniqueStringArray(profile[key], true)) throw new Error("Profile " + profileId + " has invalid " + key);
    }
    if (profile.verticals.some((vertical) => !VERTICALS.includes(vertical))) throw new Error("Profile " + profileId + " has unknown vertical");
    if (profile.navigationRoutes.some((routeId) => !registry.routes[routeId])) throw new Error("Profile " + profileId + " has unknown navigation route");
    if (typeof profile.runtimeProfile !== "string" || !profile.runtimeProfile) throw new Error("Profile " + profileId + " has no runtime profile");
  }

  const codes = new Set();
  for (const parameter of registry.parameters) {
    if (!isPlainObject(parameter) || !/^[A-Z][A-Z0-9_]*$/.test(parameter.code || "")) throw new Error("Invalid parameter registry entry");
    if (codes.has(parameter.code)) throw new Error("Duplicate customer experience parameter code: " + parameter.code);
    codes.add(parameter.code);
    if (!cmsTypes.has(parameter.type)) throw new Error("Unsupported CMS type for " + parameter.code);
    if (!isUniqueStringArray(parameter.consumers, true) || parameter.consumers.some((surface) => !SURFACES.includes(surface))) {
      throw new Error("Invalid consumers for " + parameter.code);
    }
    if (typeof parameter.source !== "string" || !/^[a-zA-Z][a-zA-Z0-9.]*$/.test(parameter.source)) throw new Error("Invalid source for " + parameter.code);
    if (typeof parameter.required !== "boolean") throw new Error("Parameter required flag is missing for " + parameter.code);
    if (parameter.deferredUntilResolved && !parameter.required) throw new Error("Only required parameters may be deferred: " + parameter.code);
    if (parameter.serialization && !["csv", "string"].includes(parameter.serialization)) throw new Error("Invalid serialization for " + parameter.code);
    if (parameter.allowedValues && !isUniqueStringArray(parameter.allowedValues, true)) throw new Error("Invalid allowedValues for " + parameter.code);
    const forbidden = FORBIDDEN_PARAMETER_FRAGMENTS.find((fragment) => parameter.code.includes(fragment));
    if (forbidden) throw new Error("Private/runtime parameter is forbidden: " + parameter.code);
  }
  return registry;
}

export function validateDescriptorSemantics(descriptor, registry) {
  const staging = descriptor.classification === "staging-customer-experience";
  if (staging !== (descriptor.deployment.environment === "staging")) {
    throw new Error("Descriptor classification and deployment environment disagree");
  }

  const allowedOrigins = descriptor.experience.allowedNavOrigins.map((value) => {
    const parsed = parseHttpsUrl(value, "allowed navigation origin");
    if (parsed.href !== parsed.origin + "/") throw new Error("Allowed navigation origin must not contain a path, query, or fragment: " + value);
    return parsed.origin;
  });
  if (new Set(allowedOrigins).size !== allowedOrigins.length) throw new Error("Allowed navigation origins are not canonical and unique");

  validateUrlSlot(descriptor.experience.support, "support", allowedOrigins);
  validateUrlSlot(descriptor.surfaces.landing.url, "landing", allowedOrigins);
  validateUrlSlot(descriptor.surfaces.portal.url, "portal", allowedOrigins);
  validateUrlSlot(descriptor.surfaces.portal.registration.destination, "registration", allowedOrigins);

  const selector = descriptor.surfaces.login.pageContextSelector;
  if (selector.status === "unproven" && (selector.selector !== null || !selector.reason)) {
    throw new Error("Unproven Core Auth PageContext selector needs a null selector and a reason");
  }
  if (selector.status === "resolved" && (!selector.selector || !["organization", "host", "client-registration", "page-context-route"].includes(selector.selector))) {
    throw new Error("Resolved Core Auth PageContext selector must name a trusted selector contract");
  }

  const portal = descriptor.surfaces.portal;
  const profile = registry.profiles[portal.profile];
  if (!profile) throw new Error("Unknown customer experience profile: " + portal.profile);
  if (!profile.verticals.includes(descriptor.experience.vertical)) throw new Error("Profile " + portal.profile + " does not support vertical " + descriptor.experience.vertical);
  if (!registry.routes[portal.defaultRoute]) throw new Error("Portal default route is not registered: " + portal.defaultRoute);
  const defaultModule = registry.routeModules[portal.defaultRoute];
  if (defaultModule !== "auth" && !profile.modules.includes(defaultModule)) throw new Error("Portal default route belongs to a disabled module: " + portal.defaultRoute);
  for (const routeId of profile.navigationRoutes) {
    const moduleId = registry.routeModules[routeId];
    if (moduleId !== "auth" && !profile.modules.includes(moduleId)) throw new Error("Profile navigation targets a disabled module: " + routeId);
  }

  const caps = portal.capabilities;
  requireModules(profile, caps.retail === "retail-commerce-open", ["products", "cart", "checkout"], "open retail");
  requireModules(profile, caps.booking === "open", ["appointments", "services"], "open booking");
  requireModules(profile, caps.planCommerce === "open", ["pricing", "plan", "checkout"], "open plan commerce");
  requireModules(profile, caps.payment === "simulated", ["checkout"], "simulated payment");
  if (caps.payment === "simulated" && caps.retail !== "retail-commerce-open" && caps.planCommerce !== "open") {
    throw new Error("Simulated payment requires an opened retail or plan checkout path");
  }
  if (portal.anonymousIntent.mode === "selection-only"
      && caps.booking !== "open" && caps.retail !== "retail-commerce-open") {
    throw new Error("Anonymous selection requires an opened booking or retail capability");
  }
  const registration = portal.registration;
  if (registration.mode === "closed" && registration.destination.status !== "closed") {
    throw new Error("Closed registration requires a closed destination");
  }
  if (registration.mode === "core-auth" && registration.destination.status !== "resolved") {
    throw new Error("Core Auth registration requires a resolved destination");
  }
  if (!staging && (caps.demoCommands !== "closed" || caps.payment !== "closed" || descriptor.deployment.pim.enrichmentMode !== "closed")) {
    throw new Error("Production descriptors cannot inherit staging demo commands, simulated payment, or current-api PIM enrichment");
  }

  const pim = descriptor.deployment.pim;
  if (Boolean(pim.priceAttributeCode) !== Boolean(pim.priceAttributeValues.length)) {
    throw new Error("PIM price attribute code and values must be configured together or both omitted");
  }
  for (const [label, value] of Object.entries({
    coreApiBase: descriptor.deployment.coreApiBase,
    accountApiBase: descriptor.deployment.accountApiBase,
    serviceApiBase: descriptor.deployment.serviceApiBase,
    billApiBase: descriptor.deployment.billApiBase,
    pimApiBase: pim.apiBase,
    authCoreBase: descriptor.deployment.auth.coreBase,
    authCallbackPath: descriptor.deployment.auth.callbackPath,
  })) validateSameOriginPath(value, label);

  for (const destination of [
    descriptor.surfaces.landing.primaryDestination,
    descriptor.surfaces.landing.servicesDestination,
    descriptor.surfaces.landing.pricingDestination,
    descriptor.surfaces.landing.productsDestination,
    descriptor.surfaces.portal.logoutDestination,
  ]) validateDestinationSyntax(destination, registry, allowedOrigins);

  return descriptor;
}

export function resolveNavigation(descriptor, registry) {
  const deferredReasons = {};
  const landingUrl = resolvedSlotValue(descriptor.surfaces.landing.url, "resolved.landingUrl", deferredReasons);
  const portalUrl = resolvedSlotValue(descriptor.surfaces.portal.url, "resolved.portalUrl", deferredReasons);
  const supportUrl = resolvedSlotValue(descriptor.experience.support, "resolved.supportUrl", deferredReasons, false);
  const registrationUrl = resolvedSlotValue(descriptor.surfaces.portal.registration.destination, "resolved.registrationUrl", deferredReasons, false);
  const landing = descriptor.surfaces.landing;
  const portal = descriptor.surfaces.portal;
  const resolver = (destination, key) => {
    const value = resolveDestination(destination, { landingUrl, portalUrl, portal, registry });
    if (value === undefined) deferredReasons["resolved." + key] = destinationReason(destination, descriptor);
    return value;
  };
  const destinations = {
    landingUrl,
    portalUrl,
    primaryDestination: resolver(landing.primaryDestination, "primaryDestination"),
    servicesDestination: resolver(landing.servicesDestination, "servicesDestination"),
    pricingDestination: resolver(landing.pricingDestination, "pricingDestination"),
    productsDestination: resolver(landing.productsDestination, "productsDestination"),
    supportUrl,
    registrationUrl,
    logoutDestination: resolver(portal.logoutDestination, "logoutDestination"),
  };
  return { destinations, deferredReasons };
}

export function resolveDestination(destination, context) {
  if (destination === "page:landing") return context.landingUrl;
  if (destination === "page:portal") return context.portalUrl;
  if (destination.startsWith("section:")) return "#" + destination.slice("section:".length);
  if (destination.startsWith("url:")) return destination.slice("url:".length);
  if (destination.startsWith("portal-route:")) {
    if (!context.portalUrl) return undefined;
    const routeId = destination.slice("portal-route:".length);
    const routePath = context.registry.routes[routeId];
    if (!routePath) throw new Error("Destination names an unknown portal route: " + routeId);
    const url = new URL(context.portalUrl);
    if (context.portal.routerMode === "hash") {
      url.hash = routePath;
      return url.href;
    }
    if (!url.pathname.endsWith("/")) throw new Error("History-mode portal URL must end with / so routes stay under its document base");
    url.pathname = url.pathname + routePath.replace(/^\//, "");
    return url.href;
  }
  throw new Error("Unsupported semantic destination: " + destination);
}

function buildParameterContext(descriptor, profile, resolved, landingContent) {
  const landing = landingContent.content;
  const portal = descriptor.surfaces.portal;
  const deployment = descriptor.deployment;
  const pim = deployment.pim;
  return {
    contract: { version: String(descriptor.schemaVersion) },
    experience: {
      id: descriptor.experience.id,
      vertical: descriptor.experience.vertical,
      theme: descriptor.experience.theme,
      defaultMode: descriptor.experience.defaultMode,
      language: descriptor.experience.language,
      direction: descriptor.experience.direction,
      brandName: descriptor.experience.brandName,
      allowedNavOrigins: descriptor.experience.allowedNavOrigins,
    },
    resolved: resolved.destinations,
    landing: {
      metaTitle: localized(landing.meta.title),
      metaDescription: localized(landing.meta.description),
      canonicalUrl: resolveLandingCanonical(landing.meta),
      heroEyebrow: localized(landing.meta.serviceArea),
      heroTitle: localized(landing.meta.h1),
      heroBody: localized(landing.hero.service),
      heroNote: localized(landing.hero.note),
      finalTitle: localized(landing.final.heading),
      finalBody: localized(landing.final.body.replaceAll("{locality}", landing.meta.locality)),
      primaryCtaLabel: localized(landing.ctas.primary.label),
      secondaryCtaLabel: localized(landing.ctas.secondary.label),
    },
    portal: {
      documentTitle: descriptor.content.portal.documentTitle,
      runtimeProfile: profile.runtimeProfile,
      capability: portal.capability,
      enabledModules: profile.modules,
      defaultRoute: portal.defaultRoute,
      routerMode: portal.routerMode,
      authMode: "required",
      dataMode: "live",
      errorMode: "error",
      bookingMode: portal.capabilities.booking,
      retailMode: portal.capabilities.retail,
      planCommerceMode: portal.capabilities.planCommerce,
      paymentMode: portal.capabilities.payment,
      demoCommandsMode: portal.capabilities.demoCommands,
      anonymousIntentMode: portal.anonymousIntent.mode,
      anonymousIntentTtlSeconds: portal.anonymousIntent.ttlSeconds,
      anonymousIntentMaxItems: portal.anonymousIntent.maxItems,
      anonymousIntentReconciliationMode: portal.anonymousIntent.reconciliationMode,
      registrationMode: portal.registration.mode,
      organization: deployment.organization,
      accountTypeCode: deployment.accountTypeCode,
      coreApiBase: deployment.coreApiBase,
      accountApiBase: deployment.accountApiBase,
      serviceApiBase: deployment.serviceApiBase,
      billApiBase: deployment.billApiBase,
      pimApiBase: pim.apiBase,
      pimOrganization: pim.organization,
      pimEnrichmentMode: pim.enrichmentMode,
      pimPricingProductTypeCodes: pim.pricingProductTypeCodes,
      pimProductsProductTypeCodes: pim.productsProductTypeCodes,
      pimPriceTypeCode: pim.priceTypeCode,
      pimPriceAttributeCode: pim.priceAttributeCode,
      pimPriceAttributeValues: pim.priceAttributeValues,
      pimCurrency: pim.currency,
      pimCurrencyAttributeCode: pim.currencyAttributeCode,
      pimCurrencyAttributeValues: pim.currencyAttributeValues,
      pimAmountAttributeCode: pim.amountAttributeCode,
      pimAmountMinorDivisor: pim.amountMinorDivisor,
      authCoreBase: deployment.auth.coreBase,
      authCallbackPath: deployment.auth.callbackPath,
      navigation: descriptor.content.portal.navigation,
      primaryCtaLabel: descriptor.content.portal.primaryCtaLabel,
    },
    login: descriptor.content.login,
    twoFactor: descriptor.content.twoFactor,
  };
}

function compileParameters(registry, context, deferredReasons) {
  const parameterMaps = Object.fromEntries(SURFACES.map((surface) => [surface, []]));
  const deferred = [];
  for (const definition of registry.parameters) {
    const rawValue = readPath(context, definition.source);
    const missing = rawValue === undefined || rawValue === null || rawValue === "" || (Array.isArray(rawValue) && rawValue.length === 0);
    if (missing) {
      if (definition.required) {
        if (!definition.deferredUntilResolved) throw new Error("Required parameter source is missing: " + definition.code + " <- " + definition.source);
        for (const surface of definition.consumers) deferred.push({
          surface,
          code: definition.code,
          source: definition.source,
          reason: deferredReasons[definition.source] || "Required deployment value is unresolved.",
        });
      }
      continue;
    }
    const value = serializeValue(rawValue, definition.serialization);
    validateCompiledValue(definition, value);
    for (const surface of definition.consumers) parameterMaps[surface].push({
      code: definition.code,
      type: definition.type,
      value: structuredClone(value),
      source: definition.source,
    });
  }
  return { parameterMaps, deferred };
}

function compareSharedParameters(registry, parameterMaps) {
  const checks = [];
  for (const definition of registry.parameters.filter((item) => item.consumers.length > 1)) {
    const present = definition.consumers.map((surface) => ({ surface, item: parameterMaps[surface].find((parameter) => parameter.code === definition.code) }));
    const values = present.filter((entry) => entry.item).map((entry) => JSON.stringify([entry.item.type, entry.item.value]));
    if (new Set(values).size > 1) throw new Error("Shared parameter drift detected for " + definition.code);
    if (present.some((entry) => Boolean(entry.item)) && present.some((entry) => !entry.item)) throw new Error("Shared parameter is only partially emitted: " + definition.code);
    checks.push(definition.code);
  }
  return checks;
}

function compareEvidence(descriptor, registry, evidence) {
  const findings = [];
  const landing = evidence.landingContent;
  const portal = evidence.portalSource;
  const loginSource = evidence.loginSource;
  const twoFactorTemplate = stripHtmlComments(evidence.twoFactorTemplate);
  const twoFactorParameterNames = evidence.twoFactorParameters.parameters.map((parameter) => parameter.name);

  requireEvidence(landing.classification === "public-authored", "Landing evidence is not public-authored");
  requireEvidence(landing.content.brand.name === descriptor.experience.brandName.en, "Landing brand disagrees with experience descriptor");
  requireEvidence(landing.content.vertical.slug === descriptor.experience.vertical, "Landing vertical disagrees with experience descriptor");
  requireEvidence(portal.runtime.vertical === descriptor.experience.vertical, "Portal source vertical disagrees with experience descriptor");
  requireEvidence(portal.runtime.theme === descriptor.experience.theme, "Portal source theme disagrees with experience descriptor");
  const profile = registry.profiles[descriptor.surfaces.portal.profile];
  requireEvidence(portal.runtime.profile === profile.runtimeProfile, "Portal runtime profile disagrees with resolved profile intent");
  requireEvidence(portal.runtime.capability === descriptor.surfaces.portal.capability, "Portal capability disagrees with descriptor");
  requireEvidence(portal.runtime.booking === descriptor.surfaces.portal.capabilities.booking, "Portal booking mode disagrees with descriptor");
  requireEvidence(portal.runtime.retail === descriptor.surfaces.portal.capabilities.retail, "Portal retail mode disagrees with descriptor");
  requireEvidence(portal.runtime.planCommerce === descriptor.surfaces.portal.capabilities.planCommerce, "Portal plan commerce mode disagrees with descriptor");
  requireEvidence(portal.runtime.demoCommands === descriptor.surfaces.portal.capabilities.demoCommands, "Portal demo command mode disagrees with descriptor");
  requireEvidence(JSON.stringify(portal.runtime.enabledModules) === JSON.stringify(profile.modules), "Portal modules disagree with registry profile");
  requireEvidence(portal.account.organization === descriptor.deployment.organization, "Portal organization disagrees with descriptor");
  requireEvidence(portal.account.accountTypeCode === descriptor.deployment.accountTypeCode, "Portal Account type disagrees with descriptor");
  requireEvidence(portal.pim.organization === descriptor.deployment.pim.organization, "Portal PIM organization disagrees with descriptor");
  requireEvidence(portal.auth.callbackPath === descriptor.deployment.auth.callbackPath, "Portal auth callback disagrees with descriptor");

  validateAcceptedLoginSource(loginSource);

  const twoFactorRuntimePlaceholders = ["TWO_FACTOR_ACTION", "CSRF_PARAMETER_NAME", "CSRF_TOKEN", "SETUP_DISPLAY", "VERIFY_NOTICE_DISPLAY", "ERROR_DISPLAY", "TWO_FACTOR_QR_CODE", "TWO_FACTOR_SECRET"];
  for (const placeholder of twoFactorRuntimePlaceholders) {
    requireEvidence(countOccurrences(twoFactorTemplate, "{{" + placeholder + "}}") === 1, "2FA source must preserve exactly one Core Auth placeholder " + placeholder);
  }
  requireEvidence(!twoFactorTemplate.includes("{{TWO_FACTOR_OTPAUTH_URI}}"), "2FA source must not expose the unused OTPAUTH URI");
  requireEvidence((twoFactorTemplate.match(/<form\b/gi) || []).length === 1, "2FA source must contain exactly one form");
  requireEvidence((twoFactorTemplate.match(/data-core-auth-2fa\b/gi) || []).length === 1, "2FA source must contain exactly one marked form");
  requireEvidence(!/<script\b|\son[a-z]+\s*=/i.test(twoFactorTemplate), "2FA source must stay script-free");
  requireEvidence(evidence.twoFactorManifest.form.count === 1 && evidence.twoFactorManifest.form.action === "{{TWO_FACTOR_ACTION}}", "2FA manifest form contract drifted");
  requireEvidence(JSON.stringify(evidence.twoFactorManifest.states.map((state) => state.id)) === JSON.stringify(["setup-ready", "setup-error", "verify-ready", "verify-error"]), "2FA manifest state coverage drifted");
  const sourceParameterNames = [...twoFactorTemplate.matchAll(/\$\{([A-Z0-9_]+)@LOCALIZED_STRING_SS\}/g)].map((match) => match[1]);
  requireEvidence(JSON.stringify([...new Set(sourceParameterNames)].sort()) === JSON.stringify([...twoFactorParameterNames].sort()), "2FA source and parameter evidence disagree");
  const expectedRegistryCodes = twoFactorParameterNames.map((code) => code === "AUTH_BRAND_NAME" ? "CX_BRAND_NAME" : code === "AUTH_PITCH_EYEBROW" ? "LOGIN_PITCH_EYEBROW" : code);
  const registeredTwoFactorCodes = registry.parameters.filter((parameter) => parameter.consumers.includes("twoFactor") && expectedRegistryCodes.includes(parameter.code)).map((parameter) => parameter.code);
  requireEvidence(JSON.stringify([...registeredTwoFactorCodes].sort()) === JSON.stringify([...expectedRegistryCodes].sort()), "2FA localized parameters are not registered exactly once");

  if (portal.template.code !== registry.templateCodes.portal) findings.push({
    severity: "info",
    id: "tenant-specific-portal-template",
    current: portal.template.code,
    intended: registry.templateCodes.portal,
    detail: "Expected during report-only migration; no CMS output was changed.",
  });
  return findings;
}

function stripHtmlComments(value) { return String(value).replace(/<!--[\s\S]*?-->/g, ""); }
function countOccurrences(value, needle) { return String(value).split(needle).length - 1; }

function validateUrlSlot(slot, label, allowedOrigins) {
  if (slot.status === "resolved") {
    if (!slot.url || slot.reason !== null) throw new Error("Resolved " + label + " URL must have a value and null reason");
    const parsed = parseHttpsUrl(slot.url, label + " URL");
    if (!allowedOrigins.includes(parsed.origin)) throw new Error(label + " URL origin is not allowlisted: " + parsed.origin);
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error(label + " URL cannot contain credentials, query, or fragment");
    return;
  }
  if (slot.url !== null || !slot.reason) throw new Error(slot.status + " " + label + " URL must be null and explain why");
}

function validateDestinationSyntax(destination, registry, allowedOrigins) {
  if (destination.startsWith("portal-route:")) {
    const routeId = destination.slice("portal-route:".length);
    if (!registry.routes[routeId]) throw new Error("Semantic destination uses unknown route: " + routeId);
  }
  if (destination.startsWith("url:")) {
    const parsed = parseHttpsUrl(destination.slice("url:".length), "explicit navigation destination");
    if (!allowedOrigins.includes(parsed.origin)) throw new Error("Explicit navigation destination origin is not allowlisted: " + parsed.origin);
  }
}

function resolvedSlotValue(slot, source, deferredReasons, required = true) {
  if (slot.status === "resolved") return slot.url;
  if (required || slot.status === "unresolved") deferredReasons[source] = slot.reason;
  return undefined;
}

function destinationReason(destination, descriptor) {
  if (destination === "page:landing") return descriptor.surfaces.landing.url.reason;
  if (destination === "page:portal" || destination.startsWith("portal-route:")) return descriptor.surfaces.portal.url.reason;
  return "Destination could not be resolved from the current descriptor.";
}

function requireModules(profile, condition, modules, label) {
  if (!condition) return;
  const missing = modules.filter((moduleId) => !profile.modules.includes(moduleId));
  if (missing.length) throw new Error(label + " requires profile modules: " + missing.join(", "));
}

function validateSameOriginPath(value, label) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("..") || /[?#]/.test(value)) {
    throw new Error(label + " must be a normalized same-origin path");
  }
}

function parseHttpsUrl(value, label) {
  let parsed;
  try { parsed = new URL(value); } catch (_) { throw new Error(label + " is not an absolute URL"); }
  if (parsed.protocol !== "https:") throw new Error(label + " must use https");
  return parsed;
}

function resolveLandingCanonical(meta) {
  const value = meta.canonical
    .replaceAll("{locality-slug}", meta.localitySlug)
    .replaceAll("{locality}", encodeURIComponent(meta.locality));
  if (/\{[^}]+\}/.test(value)) throw new Error("Landing canonical contains an unresolved merge token");
  parseHttpsUrl(value, "landing canonical URL");
  return value;
}

function validateCompiledValue(definition, value) {
  if (definition.type === "STRING" && typeof value !== "string") throw new Error(definition.code + " must compile to STRING");
  if (definition.type === "LOCALIZED_STRING_SS" && (!isPlainObject(value) || typeof value.en !== "string" || !value.en)) {
    throw new Error(definition.code + " must compile to localized English text");
  }
  if (definition.allowedValues && !definition.allowedValues.includes(value)) throw new Error(definition.code + " compiled to a disallowed value");
}

function serializeValue(value, serialization) {
  if (serialization === "csv") {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item)) throw new Error("CSV source must be a nonempty string array");
    return value.join(",");
  }
  if (serialization === "string") return String(value);
  return value;
}

function readPath(value, source) {
  let current = value;
  for (const part of source.split(".")) {
    if (!isPlainObject(current) || !Object.prototype.hasOwnProperty.call(current, part)) return undefined;
    current = current[part];
  }
  return current;
}

function localized(value) { return { en: value }; }

function requireEvidence(condition, message) {
  if (!condition) throw new Error("Current-source evidence mismatch: " + message);
}

function isUniqueStringArray(value, requireItems) {
  return Array.isArray(value) && (!requireItems || value.length > 0)
    && value.every((item) => typeof item === "string" && item)
    && new Set(value).size === value.length;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}

function safeRepositoryPath(reference) {
  if (typeof reference !== "string" || !reference || path.isAbsolute(reference)) throw new Error("Evidence reference must be repository-relative: " + reference);
  const resolved = path.resolve(repositoryRoot, reference);
  if (resolved !== repositoryRoot && !resolved.startsWith(repositoryRoot + path.sep)) throw new Error("Evidence reference escapes the repository: " + reference);
  return resolved;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--descriptor") options.descriptorPath = argv[++index];
    else if (arg === "--schema") options.schemaPath = argv[++index];
    else if (arg === "--registry") options.registryPath = argv[++index];
    else if (arg === "--require-resolved") options.requireResolved = true;
    else if (arg === "--compact") options.compact = true;
    else throw new Error("Unknown argument: " + arg);
  }
  for (const key of ["descriptorPath", "schemaPath", "registryPath"]) if (options[key] === undefined && argv.includes("--" + key.replace("Path", ""))) throw new Error("Missing value for " + key);
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const inputs = await loadCustomerExperienceInputs(options);
  const report = buildCustomerExperienceReport(inputs);
  if (options.requireResolved && !report.publishable) {
    throw new Error("Customer experience is not publishable: " + report.blockers.map((item) => item.code || item.id).join(", "));
  }
  process.stdout.write(JSON.stringify(report, null, options.compact ? 0 : 2) + "\n");
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) await main();
