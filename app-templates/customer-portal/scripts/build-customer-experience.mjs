import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildCustomerExperienceReport, loadCustomerExperienceInputs } from "./customer-experience-config-report.mjs";
import { AUTH_LOGIN_STYLE_NAMES, compileAcceptedLoginSource } from "./customer-experience-auth-source.mjs";
import { buildCalmHarborLandingFamily } from "./export-calm-harbor-landing-blocks-manual.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const portalRoot = path.resolve(scriptsDir, "..");
const repositoryRoot = path.resolve(portalRoot, "../..");
const runtimePath = path.join(portalRoot, "runtime/manual/calm-harbor-target-runtime.js");
const loginSourcePath = path.join(portalRoot, "design-inbox/core-auth-login.html");
const twoFactorStylePath = path.join(portalRoot, "design-inbox/styles/core-auth-2fa.css");
const styleFiles = ["tokens.css", "base.css", "shell.css", "components.css", "routes.css", "responsive.css", "seo.css"];
const surfaces = ["landing", "portal", "login", "twoFactor"];

const oidcLibrary = {
  integrity: "sha384-EX6IlpbPbIxs1Zi4cPDGkFJm4YuPKx31VxifYK2nLwYtwc7EoKJRA9a2BFBNxz1H",
  src: "https://cdnjs.cloudflare.com/ajax/libs/oidc-client-ts/3.0.1/browser/oidc-client-ts.js",
};

export async function buildCustomerExperience(options = {}) {
  const inputs = options.inputs || await loadCustomerExperienceInputs(options);
  const report = buildCustomerExperienceReport(inputs);
  if (inputs.descriptor.experience.vertical !== "beauty") {
    report.publishable = false;
    report.blockers.push({
      id: "landing-content-map-not-compiled",
      surface: "landing",
      code: null,
      reason: "The accepted 13-section presentation is generic, but child content mapping is currently compiled only from the accepted Beauty source package.",
    });
  }
  if (options.requireResolved && !report.publishable) {
    throw new Error("Customer experience is not publishable: " + report.blockers.map((item) => item.code || item.id).join(", "));
  }

  const outputDir = path.resolve(options.outputDir || path.join(portalRoot, "dist/customer-experience", safeSegment(inputs.descriptor.experience.id)));
  assertSafeOutput(outputDir);
  const [portalCss, portalJavascript, acceptedLoginSource, acceptedLoginStyles, acceptedLanding, twoFactorCss] = await Promise.all([
    readPortalStyles(),
    fs.readFile(runtimePath, "utf8"),
    fs.readFile(loginSourcePath, "utf8"),
    readAcceptedLoginStyles(),
    buildCalmHarborLandingFamily(),
    fs.readFile(twoFactorStylePath, "utf8"),
  ]);
  assertLiveRuntime(portalJavascript);

  const loginSource = compileAcceptedLoginSource(acceptedLoginSource, acceptedLoginStyles);
  const landingFamily = landingTemplate(inputs, report, acceptedLanding.payload);
  const login = loginTemplate(inputs, report, loginSource);
  const templates = {
    landing: landingFamily.root,
    portal: portalTemplate(inputs, report, portalCss, portalJavascript),
    login,
    twoFactor: twoFactorTemplate(inputs, report, login, inputs.evidence.twoFactorTemplate, twoFactorCss),
  };
  validateTemplates(templates, inputs, report);

  const pageContexts = Object.fromEntries(surfaces.map((surface) => [surface, pageContextMap(surface, inputs, report)]));
  const manifest = buildManifest(inputs, report, templates, pageContexts, {
    landing: {
      builder: path.relative(repositoryRoot, path.join(scriptsDir, "export-calm-harbor-landing-blocks-manual.mjs")),
      rootSha256: acceptedLanding.manifest.sha256.root,
    },
    login: { source: path.relative(repositoryRoot, loginSourcePath), sha256: sha256(acceptedLoginSource) },
    twoFactor: { source: inputs.descriptor.evidenceRefs.twoFactorTemplate, sha256: sha256(inputs.evidence.twoFactorTemplate) },
  });
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "customer-experience-build-"));
  try {
    await writeJson(path.join(tempDir, "build-manifest.json"), manifest);
    await writeJson(path.join(tempDir, "customer-experience.report.json"), report);
    await writeText(path.join(tempDir, "README.md"), buildReadme(inputs, report));
    for (const surface of surfaces) {
      const surfaceDir = path.join(tempDir, surface);
      await fs.mkdir(surfaceDir, { recursive: true });
      await writeJson(path.join(surfaceDir, "template.json"), templates[surface]);
      await writeJson(path.join(surfaceDir, "parameters.json"), templates[surface].parameters);
      await writeJson(path.join(surfaceDir, "page-context.parameters.json"), pageContexts[surface]);
      await writeText(path.join(surfaceDir, "preview.html"), previewFor(templates[surface], report.parameterMaps[surface]));
      if (surface === "landing") {
        await writeJson(path.join(surfaceDir, "cms-family.payload.json"), landingFamily);
        await writeJson(path.join(surfaceDir, "page-context.children.json"), landingFamily.pageContexts);
        for (let index = 0; index < landingFamily.children.length; index += 1) {
          await writeJson(path.join(surfaceDir, "children", String(index + 1).padStart(2, "0") + ".template.json"), landingFamily.children[index]);
        }
      }
    }
    await replaceDirectory(outputDir, tempDir);
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
  return { outputDir, manifest, report, templates, pageContexts };
}

function landingTemplate(inputs, report, accepted) {
  const code = inputs.registry.templateCodes.landing;
  const codeMap = new Map(accepted.children.map((child, index) => [child.code, code + "_" + String(index + 1).padStart(2, "0") + "_" + child.code.split("_").slice(3).join("_")]));
  const rewriteCodes = (value) => {
    let result = String(value || "");
    for (const [oldCode, newCode] of codeMap) result = result.replaceAll(oldCode, newCode);
    return result;
  };
  const root = structuredClone(accepted.root);
  root.code = code;
  root.nls = { en: { NAME: "Customer experience | Landing" } };
  root.parameters = templateParameters("landing", inputs, report);
  root.head = root.head
    .replace(/\$\{ROOT_META_TITLE@LOCALIZED_STRING_SS\}/g, ref("LANDING_META_TITLE", "LOCALIZED_STRING_SS"))
    .replace(/\$\{ROOT_META_DESCRIPTION@LOCALIZED_STRING_SS\}/g, ref("LANDING_META_DESCRIPTION", "LOCALIZED_STRING_SS"))
    .replace(/\n?<script type="application\/ld\+json">\$\{ROOT_FAQ_JSON_LD@LOCALIZED_JSON_OBJECT\}<\/script>/, "");
  root.html = root.html
    .replace('id="calm-harbor-landing"', 'id="customer-experience-landing"')
    .replace('data-theme="beauty"', 'data-theme="' + ref("CX_THEME", "STRING") + '"')
    .replace('data-mode="light"', 'data-mode="' + ref("CX_DEFAULT_MODE", "STRING") + '"')
    .replace('data-screen-label="SEO landing · Beauty"', 'data-screen-label="Customer experience landing"')
    .replace('data-module="app-shell"', 'data-module="app-shell" data-nav-portal-url="' + ref("NAV_PORTAL_URL", "STRING") + '"');
  root.javascript = root.javascript
    .replaceAll("Calm Harbor public landing runtime", "Customer experience public landing runtime")
    .replaceAll("__CALM_HARBOR_PREVIEW_PIM", "__CUSTOMER_EXPERIENCE_PREVIEW_PIM")
    .replaceAll("#calm-harbor-landing", "#customer-experience-landing")
    .replace('document.documentElement.dataset.theme = "beauty";', 'document.documentElement.dataset.theme = root.dataset.theme;')
    .replace('} else if (name === "seo.faq.toggle") {', '} else if (name === "auth.gotoSignin") { event.preventDefault(); if (root.dataset.navPortalUrl) window.location.assign(root.dataset.navPortalUrl); } else if (name === "seo.faq.toggle") {');

  const pageContexts = [];
  const children = accepted.children.map((source) => {
    const child = structuredClone(source);
    child.code = codeMap.get(source.code);
    child.parent = { code };
    child.nls = { en: { NAME: "Customer experience | " + source.nls.en.NAME.split("|").at(-1).trim() } };
    child.head = rewriteCodes(source.head);
    child.html = rewriteCodes(source.html);
    child.parameters = source.parameters.map((parameter) => {
      const result = { ...structuredClone(parameter), code: rewriteCodes(parameter.code) };
      result.nls = { en: { NAME: humanize(result.code), DESCRIPTION: "Customer experience landing section value." } };
      return result;
    });
    if (source.code.endsWith("PUBLIC_NAV")) {
      child.html = child.html.replace(/\$\{[^}]+_BRAND@LOCALIZED_STRING_SS\}/, ref("CX_BRAND_NAME", "LOCALIZED_STRING_SS"));
      child.parameters = child.parameters.filter((parameter) => !parameter.code.endsWith("_BRAND"));
      child.parameters.push(parameterDefinition(inputs, report, "landing", "CX_BRAND_NAME"));
    }
    pageContexts.push({
      templateCode: child.code,
      parameters: child.parameters.map((parameter) => ({ code: parameter.code, type: parameter.type, value: structuredClone(parameter.value) })),
    });
    child.parameters = child.parameters.map((parameter) => ({ ...parameter, value: emptyValue(parameter.type) }));
    return child;
  });
  return { schemaVersion: 1, root, children, pageContexts, sourcePresentation: "accepted 13-section landing family" };
}

function portalTemplate(inputs, report, css, javascript) {
  const attributes = {
    "data-portal-experience-id": ["CX_EXPERIENCE_ID", "STRING"],
    "data-portal-brand-name": ["CX_BRAND_NAME", "LOCALIZED_STRING_SS"],
    "data-portal-vertical": ["CX_VERTICAL", "STRING"],
    "data-portal-theme": ["CX_THEME", "STRING"],
    "data-portal-default-mode": ["CX_DEFAULT_MODE", "STRING"],
    "data-portal-landing-url": ["NAV_LANDING_URL", "STRING"],
    "data-portal-url": ["CX_PORTAL_URL", "STRING"],
    "data-portal-support-url": ["NAV_SUPPORT_URL", "STRING"],
    "data-portal-logout-return-url": ["NAV_LOGOUT_RETURN_URL", "STRING"],
    "data-portal-allowed-nav-origins": ["CX_ALLOWED_NAV_ORIGINS", "STRING"],
    "data-portal-profile": ["PORTAL_PROFILE", "STRING"],
    "data-portal-capability": ["PORTAL_CAPABILITY", "STRING"],
    "data-portal-booking": ["PORTAL_BOOKING_MODE", "STRING"],
    "data-portal-retail": ["PORTAL_RETAIL_MODE", "STRING"],
    "data-portal-plan-commerce": ["PORTAL_PLAN_COMMERCE_MODE", "STRING"],
    "data-portal-payment": ["PORTAL_PAYMENT_MODE", "STRING"],
    "data-portal-demo-commands": ["PORTAL_DEMO_COMMANDS_MODE", "STRING"],
    "data-portal-anonymous-intent-mode": ["PORTAL_ANONYMOUS_INTENT_MODE", "STRING"],
    "data-portal-anonymous-intent-ttl-seconds": ["PORTAL_ANONYMOUS_INTENT_TTL_SECONDS", "STRING"],
    "data-portal-anonymous-intent-max-items": ["PORTAL_ANONYMOUS_INTENT_MAX_ITEMS", "STRING"],
    "data-portal-anonymous-intent-reconciliation": ["PORTAL_ANONYMOUS_INTENT_RECONCILIATION_MODE", "STRING"],
    "data-portal-registration-mode": ["PORTAL_REGISTRATION_MODE", "STRING"],
    "data-portal-registration-url": ["NAV_REGISTRATION_URL", "STRING"],
    "data-portal-router-mode": ["PORTAL_ROUTER_MODE", "STRING"],
    "data-portal-default-route": ["PORTAL_DEFAULT_ROUTE_ID", "STRING"],
    "data-portal-enabled-modules": ["PORTAL_ENABLED_MODULES", "STRING"],
    "data-portal-auth-mode": ["PORTAL_AUTH_MODE", "STRING"],
    "data-portal-error-mode": ["PORTAL_ERROR_MODE", "STRING"],
    "data-portal-data-mode": ["PORTAL_DATA_MODE", "STRING"],
    "data-portal-organization": ["PORTAL_ORGANIZATION", "STRING"],
    "data-portal-account-type-code": ["PORTAL_ACCOUNT_TYPE_CODE", "STRING"],
    "data-portal-core-api-base": ["PORTAL_CORE_API_BASE", "STRING"],
    "data-portal-account-api-base": ["PORTAL_ACCOUNT_API_BASE", "STRING"],
    "data-portal-service-api-base": ["PORTAL_SERVICE_API_BASE", "STRING"],
    "data-portal-bill-api-base": ["PORTAL_BILL_API_BASE", "STRING"],
    "data-portal-pim-api-base": ["PORTAL_PIM_API_BASE", "STRING"],
    "data-portal-pim-organization": ["PORTAL_PIM_ORGANIZATION", "STRING"],
    "data-portal-pim-enrichment": ["PORTAL_PIM_ENRICHMENT_MODE", "STRING"],
    "data-portal-pim-pricing-product-type-codes": ["PORTAL_PIM_PRICING_PRODUCT_TYPE_CODES", "STRING"],
    "data-portal-pim-products-product-type-codes": ["PORTAL_PIM_PRODUCTS_PRODUCT_TYPE_CODES", "STRING"],
    "data-portal-pim-price-type-code": ["PORTAL_PIM_PRICE_TYPE_CODE", "STRING"],
    "data-portal-pim-price-attribute-code": ["PORTAL_PIM_PRICE_ATTRIBUTE_CODE", "STRING"],
    "data-portal-pim-price-attribute-values": ["PORTAL_PIM_PRICE_ATTRIBUTE_VALUES", "STRING"],
    "data-portal-pim-currency": ["PORTAL_PIM_CURRENCY", "STRING"],
    "data-portal-pim-currency-attribute-code": ["PORTAL_PIM_CURRENCY_ATTRIBUTE_CODE", "STRING"],
    "data-portal-pim-currency-attribute-values": ["PORTAL_PIM_CURRENCY_ATTRIBUTE_VALUES", "STRING"],
    "data-portal-pim-amount-attribute-code": ["PORTAL_PIM_AMOUNT_ATTRIBUTE_CODE", "STRING"],
    "data-portal-pim-amount-minor-divisor": ["PORTAL_PIM_AMOUNT_MINOR_DIVISOR", "STRING"],
    "data-portal-auth-core-base": ["PORTAL_AUTH_CORE_BASE", "STRING"],
    "data-portal-auth-callback-path": ["PORTAL_AUTH_CALLBACK_PATH", "STRING"],
    "data-portal-nav-primary-label": ["PORTAL_NAV_PRIMARY_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-nav-calendar-label": ["PORTAL_NAV_CALENDAR_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-nav-activity-label": ["PORTAL_NAV_ACTIVITY_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-nav-care-label": ["PORTAL_NAV_CARE_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-nav-proposals-label": ["PORTAL_NAV_PROPOSALS_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-nav-services-label": ["PORTAL_NAV_SERVICES_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-nav-pricing-label": ["PORTAL_NAV_PRICING_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-nav-products-label": ["PORTAL_NAV_PRODUCTS_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-nav-account-label": ["PORTAL_NAV_ACCOUNT_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-nav-support-label": ["PORTAL_NAV_SUPPORT_LABEL", "LOCALIZED_STRING_SS"],
    "data-portal-primary-cta-label": ["PORTAL_PRIMARY_CTA_LABEL", "LOCALIZED_STRING_SS"],
  };
  return {
    code: inputs.registry.templateCodes.portal,
    nls: { en: { NAME: "Customer experience | Portal" } },
    templateLanguage: "JTE",
    parent: null,
    children: [],
    head: '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + ref("PORTAL_DOCUMENT_TITLE", "LOCALIZED_STRING_SS") + '</title>\n<link rel="icon" href="data:,">\n<script src="' + oidcLibrary.src + '" integrity="' + oidcLibrary.integrity + '" crossorigin="anonymous" referrerpolicy="no-referrer"></script>',
    html: '<section id="app" ' + Object.entries(attributes).map(([name, value]) => name + '=\"' + ref(value[0], value[1]) + '\"').join(" ") + '></section>',
    css,
    javascript,
    parameters: templateParameters("portal", inputs, report),
  };
}

export function loginTemplate(inputs, report, source) {
  return {
    code: inputs.registry.templateCodes.login,
    nls: { en: { NAME: "Customer experience | Core Auth login" } },
    templateLanguage: "JTE",
    advanced: true,
    parent: null,
    children: [],
    head: source.head,
    html: source.html,
    css: source.css || "",
    javascript: source.javascript,
    parameters: templateParameters("login", inputs, report),
  };
}

export function twoFactorTemplate(inputs, report, loginSource, acceptedSource, twoFactorCss) {
  const tokenMap = {
    AUTH_BRAND_NAME: "CX_BRAND_NAME",
    AUTH_PITCH_EYEBROW: "LOGIN_PITCH_EYEBROW",
  };
  const rewrite = (value) => String(value).replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, function (match, code, type) {
    return ref(tokenMap[code] || code, type);
  });
  const withoutComments = String(acceptedSource).replace(/<!--[\s\S]*?-->/g, "");
  const bodyMatch = withoutComments.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error("Accepted 2FA source has no body");
  const body = bodyMatch[1].trim();
  const scopedTwoFactorCss = String(twoFactorCss)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@container\s+authpage\s*\(/g, "@media (")
    .trim();
  const baseHead = loginSource.head
    .replace(ref("LOGIN_DOCUMENT_TITLE", "LOCALIZED_STRING_SS"), ref("TWO_FACTOR_DOCUMENT_TITLE", "LOCALIZED_STRING_SS"))
    .replace(/<\/style>\s*$/, "\n/* Wave 19 AUTH_2FA additions */\n" + scopedTwoFactorCss + "\n</style>");
  return {
    code: inputs.registry.templateCodes.twoFactor,
    nls: { en: { NAME: "Customer experience | Core Auth two-factor" } },
    templateLanguage: "JTE",
    advanced: true,
    parent: null,
    children: [],
    head: baseHead,
    html: rewrite('<body>\n<div class="auth-root" lang="' + ref("CX_LANGUAGE", "STRING") + '" dir="' + ref("CX_DIRECTION", "STRING") + '" data-theme="' + ref("CX_THEME", "STRING") + '" data-mode="' + ref("CX_DEFAULT_MODE", "STRING") + '">\n' + body + '\n</div>\n</body>'),
    css: "",
    javascript: "",
    parameters: templateParameters("twoFactor", inputs, report),
  };
}

function templateParameters(surface, inputs, report) {
  return inputs.registry.parameters.filter((item) => item.consumers.includes(surface)).map((definition) => ({
    code: definition.code,
    type: definition.type,
    nls: { en: { NAME: humanize(definition.code), DESCRIPTION: "Customer experience descriptor value: " + definition.source + "." } },
    value: emptyValue(definition.type),
  }));
}

function parameterDefinition(inputs, report, surface, code) {
  const definition = inputs.registry.parameters.find((item) => item.code === code && item.consumers.includes(surface));
  if (!definition) throw new Error("Missing parameter definition for " + surface + ": " + code);
  return {
    code: definition.code,
    type: definition.type,
    nls: { en: { NAME: humanize(definition.code), DESCRIPTION: "Customer experience descriptor value: " + definition.source + "." } },
    value: emptyValue(definition.type),
  };
}

function pageContextMap(surface, inputs, report) {
  return {
    schemaVersion: 1,
    kind: "customer-experience-page-context-parameter-map",
    experienceId: inputs.descriptor.experience.id,
    surface,
    templateCode: inputs.registry.templateCodes[surface],
    publishable: report.publishable,
    selector: ["login", "twoFactor"].includes(surface) ? inputs.descriptor.surfaces.login.pageContextSelector : null,
    parameters: report.parameterMaps[surface],
    deferredParameters: report.deferredParameters.filter((item) => item.surface === surface),
  };
}

function validateTemplates(templates, inputs, report) {
  const expectedPlaceholders = ["LOGIN_ACTION", "CSRF_PARAMETER_NAME", "CSRF_TOKEN", "RESET_PASSWORD_URL", "ERROR_DISPLAY", "LOGOUT_DISPLAY"];
  for (const placeholder of expectedPlaceholders) {
    if (!templates.login.html.includes("{{" + placeholder + "}}")) throw new Error("Generic login lost Core Auth placeholder " + placeholder);
  }
  const twoFactorPlaceholders = ["TWO_FACTOR_ACTION", "CSRF_PARAMETER_NAME", "CSRF_TOKEN", "SETUP_DISPLAY", "VERIFY_NOTICE_DISPLAY", "ERROR_DISPLAY", "TWO_FACTOR_QR_CODE", "TWO_FACTOR_SECRET"];
  for (const placeholder of twoFactorPlaceholders) {
    if (countOccurrences(templates.twoFactor.html, "{{" + placeholder + "}}") !== 1) throw new Error("Generic 2FA must preserve exactly one Core Auth placeholder " + placeholder);
  }
  if (templates.twoFactor.html.includes("{{TWO_FACTOR_OTPAUTH_URI}}")) throw new Error("Generic 2FA exposes an unused protected OTPAUTH URI");
  if (/<!--[\s\S]*?-->/.test(templates.twoFactor.html) || /<script\b|\son[a-z]+\s*=/i.test(templates.twoFactor.html)) throw new Error("Generic 2FA must be comment- and script-free");
  if ((templates.twoFactor.html.match(/<form\b/gi) || []).length !== 1 || (templates.twoFactor.html.match(/data-core-auth-2fa\b/gi) || []).length !== 1) throw new Error("Generic 2FA must have one marked form");
  for (const surface of surfaces) {
    const template = templates[surface];
    if (template.code !== inputs.registry.templateCodes[surface]) throw new Error("Template code drift for " + surface);
    const codes = new Set(template.parameters.map((item) => item.code));
    if (codes.size !== template.parameters.length) throw new Error("Duplicate template parameter for " + surface);
    for (const item of report.parameterMaps[surface]) if (!codes.has(item.code)) throw new Error("PageContext parameter has no template definition: " + item.code);
  }
  if (!templates.landing.html.includes(ref("NAV_PORTAL_URL", "STRING"))) throw new Error("Landing does not consume the resolved portal destination");
  if (!templates.portal.html.includes(ref("NAV_LANDING_URL", "STRING"))) throw new Error("Portal does not consume the resolved landing destination");
}

function buildManifest(inputs, report, templates, pageContexts, sources) {
  return {
    schemaVersion: 1,
    kind: "customer-experience-local-build",
    uploadPerformed: false,
    experienceId: inputs.descriptor.experience.id,
    descriptor: path.relative(repositoryRoot, inputs.paths.descriptorPath),
    publishable: report.publishable,
    blockers: report.blockers,
    templates: Object.fromEntries(surfaces.map((surface) => [surface, {
      code: templates[surface].code,
      parameterCount: templates[surface].parameters.length,
      pageContextParameterCount: pageContexts[surface].parameters.length,
      sha256: sha256(JSON.stringify(templates[surface])),
    }])),
    sources,
    runtime: { source: path.relative(repositoryRoot, runtimePath), sha256: sha256(templates.portal.javascript) },
  };
}

function buildReadme(inputs, report) {
  const state = report.publishable ? "publishable" : "BLOCKED for publishing";
  return "# Customer experience build: " + inputs.descriptor.experience.id + "\n\n"
    + "Local deterministic build only. No CMS upload or PageContext switch was performed.\n\n"
    + "State: **" + state + "**.\n\n"
    + "Each surface contains `template.json`, template defaults in `parameters.json`, and descriptor-specific `page-context.parameters.json`.\n"
    + (report.blockers.length ? "\nBlockers:\n\n" + report.blockers.map((item) => "- " + (item.code || item.id) + ": " + item.reason).join("\n") + "\n" : "");
}

function previewFor(template, parameterMap) {
  const values = new Map(template.parameters.map((item) => [item.code + "@" + item.type, item.value]));
  for (const item of parameterMap) values.set(item.code + "@" + item.type, item.value);
  const resolve = (value) => String(value).replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, function (_, code, type) {
    const raw = values.get(code + "@" + type);
    const text = raw && typeof raw === "object" ? raw.en || "" : raw || "";
    return escapeHtml(text || (type === "STRING" ? "#unresolved" : ""));
  });
  return "<!doctype html><html><head>" + resolve(template.head) + "<style>" + template.css + "</style></head>" + resolve(template.html) + (template.javascript ? "<script>" + template.javascript + "</script>" : "") + "</html>";
}

function assertLiveRuntime(value) {
  const forbidden = ["runtime/data/fixtures.js", "runtime/data/cases/", "mia.chen@example.com", "fixture organization"];
  const leaked = forbidden.find((marker) => value.includes(marker));
  if (leaked) throw new Error("Fixture data leaked into generic portal runtime: " + leaked);
}

async function readPortalStyles() {
  const parts = await Promise.all(styleFiles.map(async (name) => "/* runtime/styles/" + name + " */\n" + (await fs.readFile(path.join(portalRoot, "runtime/styles", name), "utf8")).trim()));
  return parts.join("\n\n") + "\n";
}

async function readAcceptedLoginStyles() {
  const entries = await Promise.all(AUTH_LOGIN_STYLE_NAMES.map(async (name) => [name, await fs.readFile(path.join(portalRoot, "design-inbox/styles", name), "utf8")]));
  return Object.fromEntries(entries);
}

function assertSafeOutput(value) {
  const allowed = path.join(portalRoot, "dist/customer-experience") + path.sep;
  if (!value.startsWith(allowed) || value === allowed.slice(0, -1)) throw new Error("Output must be a child of " + allowed.slice(0, -1));
}

async function replaceDirectory(target, staged) {
  const backup = target + ".backup-" + crypto.randomBytes(5).toString("hex");
  await fs.mkdir(path.dirname(target), { recursive: true });
  let hadTarget = false;
  try {
    await fs.rename(target, backup);
    hadTarget = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await fs.rename(staged, target);
    if (hadTarget) await fs.rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (hadTarget) await fs.rename(backup, target);
    throw error;
  }
}

function ref(code, type) { return "${" + code + "@" + type + "}"; }
function emptyValue(type) { return type.startsWith("LOCALIZED") ? { en: "" } : ""; }
function humanize(value) { return value.toLowerCase().replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase()); }
function safeSegment(value) { if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) throw new Error("Experience id is not a safe output segment"); return value; }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function countOccurrences(value, needle) { return String(value).split(needle).length - 1; }
function escapeHtml(value) { return String(value).replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
async function writeText(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const normalized = String(value).replace(/[ \t]+$/gm, "").replace(/\n*$/, "\n");
  await fs.writeFile(file, normalized, "utf8");
}
async function writeJson(file, value) { await writeText(file, JSON.stringify(value, null, 2)); }

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--descriptor") options.descriptorPath = argv[++index];
    else if (arg === "--schema") options.schemaPath = argv[++index];
    else if (arg === "--registry") options.registryPath = argv[++index];
    else if (arg === "--output") options.outputDir = argv[++index];
    else if (arg === "--require-resolved") options.requireResolved = true;
    else throw new Error("Unknown argument: " + arg);
  }
  return options;
}

async function main() {
  const result = await buildCustomerExperience(parseArgs(process.argv.slice(2)));
  console.log("build-customer-experience ok: " + path.relative(process.cwd(), result.outputDir) + " (publishable=" + result.report.publishable + ")");
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) await main();
