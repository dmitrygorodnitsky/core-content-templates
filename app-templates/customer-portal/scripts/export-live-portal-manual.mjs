import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { assertLiveBundle } from "./build-live-portal-runtime.mjs";
import { controlCharacterOffsets } from "./export-client-review-manual.mjs";
import { assertJteSafeTemplate } from "./export-portal-form-manual.mjs";
import {
  assertExactInventory,
  attrs,
  escapeHtml,
  portalHead,
  readStyles,
  replaceDirectory,
  sha256,
  splitTemplate,
  writeJson,
  writeText,
} from "./portal-manual-package.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const distRoot = path.join(portalRoot, "dist/manual-upload");

export const coreOidcCallback = Object.freeze({
  callbackPath: "/core/oauth2-callback.html",
  returnStorageKey: "oidc-return-url",
  logoutReturnStorageKey: "oidc-logout-return-url",
});

const pimCatalogModules = Object.freeze(["pricing", "products"]);
export const liveDeploymentParameters = Object.freeze([
  "PORTAL_REQUEST_FORM_URL",
  "PORTAL_WEATHER_CLIENT_ID",
  "PORTAL_WEATHER_CLIENT_SECRET",
  "PORTAL_MAPS_API_KEY",
  "PORTAL_MAPS_MAP_ID",
]);
export const operatorParameterPlaceholder = "#";

const packageInventory = [
  "README.md", "cms-family.payload.json", "manual-export-manifest.json", "preview.html",
  "root/css.css", "root/head.html", "root/html.html", "root/javascript.js", "root/parameters.json", "root/template.json",
];

const sourceKeys = ["schemaVersion", "purpose", "template", "runtime", "account", "auth", "serviceGeography", "shell", "constraints"];
const templateKeys = ["code", "title"];
const runtimeKeys = ["vertical", "theme", "profile", "routerMode", "defaultRoute", "enabledModules", "authMode", "dataMode", "errorMode"];
const accountKeys = ["organization", "accountTypeCode", "coreApiBase", "accountApiBase", "billApiBase", "resourceApiBase", "serviceApiBase"];
const requiredAccountBases = ["coreApiBase", "accountApiBase"];
const authKeys = ["coreBase", "callbackPath", "returnStorageKey", "logoutReturnStorageKey"];
const shellKeys = ["experienceId", "brandName", "defaultMode", "primaryCtaLabel", "navigation", "requestFormUrl"];
const navigationKeys = ["primary", "appointments", "calendar", "activity", "care", "proposals", "services", "pricing", "products", "account", "support"];

const credentialShapes = [
  { label: "JSON Web Token", pattern: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\./ },
  { label: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { label: "bearer credential", pattern: /Bearer\s+[A-Za-z0-9._~+/-]{20,}/ },
];

export async function exportLivePortalManual(options = {}) {
  if (!options.inputPath) throw new Error("--input=<source.json> is required");
  if (!options.runtimePath) throw new Error("--runtime=<live-runtime.js> is required");
  if (!options.outputDir) throw new Error("--output=<dist/manual-upload/...> is required");
  const sourcePath = path.resolve(options.inputPath);
  const outputDir = path.resolve(options.outputDir);
  assertSafeOutputDir(outputDir);

  const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  const geography = await validateSource(source);
  const javascript = await fs.readFile(path.resolve(options.runtimePath), "utf8");
  assertLiveBundle(javascript);
  const css = await readStyles();
  const template = templateFor(source, geography, css, javascript);
  assertLiveTemplate(template);
  const manifest = manifestFor(sourcePath, source, geography, template);
  const preview = previewFor(source, template);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "live-portal-manual-"));
  try {
    await writePackage(tempDir, { source, template, manifest, preview });
    await replaceDirectory(outputDir, tempDir);
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
  return { outputDir, manifest };
}

async function validateSource(source) {
  assertKnownKeys(source, sourceKeys, "Live portal source");
  if (source.schemaVersion !== 1) throw new Error("Live portal source schemaVersion must be 1");
  assertKnownKeys(source.template, templateKeys, "template");
  assertCode(source.template.code, "template.code");
  if (typeof source.template.title !== "string" || !source.template.title.trim()) throw new Error("template.title must be a nonempty string");
  if (!Array.isArray(source.constraints) || !source.constraints.length || source.constraints.some((line) => typeof line !== "string" || !line)) {
    throw new Error("A live portal source must state its constraints");
  }

  const runtime = source.runtime;
  assertKnownKeys(runtime, runtimeKeys, "runtime");
  if (runtime.dataMode !== "live") throw new Error("A live portal package must use live data mode; fixture data belongs to export-fixture-portal-manual.mjs");
  if (runtime.authMode !== "required") throw new Error("A live portal package must require Core OIDC authentication");
  if (runtime.routerMode !== "hash") throw new Error("A CMS portal root must use the hash router; the CMS has no server path fallback");
  if (!["error", "fallback"].includes(runtime.errorMode)) throw new Error("runtime.errorMode must be error or fallback");
  assertAuthContract(source.auth);
  assertAccountContract(source.account);

  const { portalProfiles, readServiceGeography, resolveProfile, routeRegistry, verticalProfiles } = await import(pathToFileURL(path.join(portalRoot, "runtime/src/config.js")).href);
  if (!verticalProfiles[runtime.vertical]) throw new Error("Unknown vertical " + runtime.vertical);
  if (!verticalProfiles[runtime.theme]) throw new Error("Unknown theme " + runtime.theme);
  const profile = portalProfiles[runtime.profile];
  if (!profile) throw new Error("Unknown profile " + runtime.profile);
  if (resolveProfile(runtime.vertical, runtime.profile) !== runtime.profile) {
    throw new Error("Profile " + runtime.profile + " cannot serve vertical " + runtime.vertical + "; the runtime would replace it");
  }
  assertEnabledModules(runtime, profile);
  const route = routeRegistry[runtime.defaultRoute];
  if (!route || route.public || route.parityOnly || !runtime.enabledModules.includes(route.module)) {
    throw new Error("Default route " + runtime.defaultRoute + " must be a private route of an enabled module");
  }

  const geography = source.serviceGeography === undefined ? null : readServiceGeography(JSON.stringify(source.serviceGeography));
  if (source.serviceGeography !== undefined && !geography) {
    throw new Error("serviceGeography must be { map: { center: { lat, lon }, zoom }, zones: { name: { lat, lon } } }; the runtime refuses anything else");
  }
  if (profile.weatherCalendar && !geography) throw new Error("Profile " + runtime.profile + " needs serviceGeography for its live home screen");

  const shell = source.shell || {};
  assertKnownKeys(shell, shellKeys, "shell");
  assertKnownKeys(shell.navigation || {}, navigationKeys, "shell.navigation");
  for (const key of ["experienceId", "brandName", "primaryCtaLabel"]) assertOptionalText(shell[key], "shell." + key);
  for (const key of navigationKeys) assertOptionalText((shell.navigation || {})[key], "shell.navigation." + key);
  if (shell.defaultMode !== undefined && !["light", "dark"].includes(shell.defaultMode)) throw new Error("shell.defaultMode must be light or dark");
  if (shell.requestFormUrl !== undefined && !isHttpsUrl(shell.requestFormUrl)) throw new Error("shell.requestFormUrl must be an absolute https address");
  return geography;
}

function assertAuthContract(auth) {
  if (!auth || typeof auth !== "object") throw new Error("A live portal package needs its Core OIDC auth contract");
  assertKnownKeys(auth, authKeys, "auth");
  for (const key of authKeys) {
    if (typeof auth[key] !== "string" || !auth[key]) throw new Error("The Core OIDC auth contract is missing auth." + key);
  }
  assertSameOriginPath(auth.coreBase, "auth.coreBase");
  assertSameOriginPath(auth.callbackPath, "auth.callbackPath");
  for (const [key, value] of Object.entries(coreOidcCallback)) {
    if (auth[key] !== value) throw new Error("auth." + key + " must be " + value + ": the shared Core callback page is registered and reads exactly that");
  }
}

function assertAccountContract(account) {
  if (!account || typeof account !== "object") throw new Error("A live portal package needs a customer Account contract");
  assertKnownKeys(account, accountKeys, "account");
  assertCode(account.organization, "account.organization");
  assertCodeList(account.accountTypeCode, "account.accountTypeCode");
  for (const key of requiredAccountBases) {
    if (account[key] === undefined) throw new Error("The customer Account contract is missing account." + key);
  }
  for (const key of accountKeys.filter((name) => name.endsWith("ApiBase"))) {
    if (account[key] !== undefined) assertSameOriginPath(account[key], "account." + key);
  }
}

function assertEnabledModules(runtime, profile) {
  const modules = runtime.enabledModules;
  if (!Array.isArray(modules) || !modules.length || modules.some((id) => typeof id !== "string" || !id)) {
    throw new Error("runtime.enabledModules must be a nonempty list of module ids");
  }
  if (new Set(modules).size !== modules.length) throw new Error("runtime.enabledModules lists a module twice");
  for (const id of modules) {
    if (!profile.modules.includes(id)) throw new Error("Module " + id + " is not part of profile " + profile.id);
    if (pimCatalogModules.includes(id)) throw new Error("Module " + id + " reads the Core PIM catalog, and this package carries no PIM contract");
  }
}

function assertKnownKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + " must be an object");
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new Error(label + " carries keys this package does not ship: " + unknown.join(", "));
}

function assertCode(value, label) {
  if (typeof value !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(value)) throw new Error(label + " must be an upper-snake code");
}

function assertCodeList(value, label) {
  if (typeof value !== "string" || !/^[A-Z][A-Z0-9_]*(,[A-Z][A-Z0-9_]*)*$/.test(value)) {
    throw new Error(label + " must be one upper-snake code or a comma-separated list of them with no spaces or empty items");
  }
  const codes = value.split(",");
  if (new Set(codes).size !== codes.length) throw new Error(label + " lists a code twice");
}

function assertOptionalText(value, label) {
  if (value !== undefined && (typeof value !== "string" || !value.trim())) throw new Error(label + " must be a nonempty string when present");
}

function assertSameOriginPath(value, label) {
  const origin = "https://portal.invalid";
  if (typeof value !== "string" || !/^\/(?!\/)[A-Za-z0-9._~/-]*$/.test(value) || new URL(value, origin).origin !== origin) {
    throw new Error(label + " must be a same-origin absolute path, got " + JSON.stringify(value));
  }
}

function isHttpsUrl(value) {
  try {
    return typeof value === "string" && new URL(value).protocol === "https:";
  } catch (_) {
    return false;
  }
}

function templateFor(source, geography, css, javascript) {
  const { runtime, account, auth } = source;
  const shell = source.shell || {};
  const navigation = shell.navigation || {};
  const attributes = {
    "data-portal-experience-id": shell.experienceId,
    "data-portal-brand-name": shell.brandName,
    "data-portal-vertical": runtime.vertical,
    "data-portal-profile": runtime.profile,
    "data-portal-theme": runtime.theme,
    "data-portal-default-mode": shell.defaultMode || "light",
    "data-portal-router-mode": runtime.routerMode,
    "data-portal-default-route": runtime.defaultRoute,
    "data-portal-enabled-modules": runtime.enabledModules.join(","),
    "data-portal-auth-mode": runtime.authMode,
    "data-portal-error-mode": runtime.errorMode,
    "data-portal-data-mode": runtime.dataMode,
    "data-portal-primary-cta-label": shell.primaryCtaLabel,
  };
  for (const key of navigationKeys) attributes["data-portal-nav-" + key + "-label"] = navigation[key];
  Object.assign(attributes, {
    "data-portal-request-form-url": parameterMarker("PORTAL_REQUEST_FORM_URL"),
    "data-portal-weather-client-id": parameterMarker("PORTAL_WEATHER_CLIENT_ID"),
    "data-portal-weather-client-secret": parameterMarker("PORTAL_WEATHER_CLIENT_SECRET"),
    "data-portal-maps-api-key": parameterMarker("PORTAL_MAPS_API_KEY"),
    "data-portal-maps-map-id": parameterMarker("PORTAL_MAPS_MAP_ID"),
    "data-portal-service-geography": geography ? JSON.stringify(geography) : undefined,
    "data-portal-organization": account.organization,
    "data-portal-account-type-code": account.accountTypeCode,
    "data-portal-core-api-base": account.coreApiBase,
    "data-portal-account-api-base": account.accountApiBase,
    "data-portal-bill-api-base": account.billApiBase,
    "data-portal-resource-api-base": account.resourceApiBase,
    "data-portal-service-api-base": account.serviceApiBase,
    "data-portal-auth-core-base": auth.coreBase,
    "data-portal-auth-callback-path": auth.callbackPath,
    "data-portal-auth-return-storage-key": auth.returnStorageKey,
    "data-portal-auth-logout-return-storage-key": auth.logoutReturnStorageKey,
  });
  const emitted = Object.fromEntries(Object.entries(attributes).filter(([, value]) => value !== undefined));
  return {
    code: source.template.code,
    nls: { en: { NAME: source.template.title } },
    templateLanguage: "JTE",
    parent: null,
    children: [],
    head: portalHead(source.template.title, "noindex,nofollow"),
    html: '<section id="app" ' + attrs(emitted) + "></section>",
    css,
    javascript,
    parameters: [
      parameter(
        "PORTAL_REQUEST_FORM_URL",
        shell.requestFormUrl || "",
        "Absolute https address of the published request-a-quote form. The primary button in the top bar opens it. Any other scheme is discarded and the button stays inert.",
      ),
      parameter(
        "PORTAL_WEATHER_CLIENT_ID",
        operatorParameterPlaceholder,
        "Xweather client ID for the service-area forecast on the home screen. It is visible in page source, as every Xweather browser credential is, so restrict its namespace in the Xweather account to the host that serves this page. The forecast is requested only while both this and PORTAL_WEATHER_CLIENT_SECRET hold a key; the # it ships with means not set, and the home screen then says the forecast is not set up.",
      ),
      parameter(
        "PORTAL_WEATHER_CLIENT_SECRET",
        operatorParameterPlaceholder,
        "Xweather client secret paired with PORTAL_WEATHER_CLIENT_ID. Xweather sends it from the browser, so it is visible in page source too; restrict the namespace to the host that serves this page. The forecast is requested only while both hold a key; the # it ships with means not set.",
      ),
      parameter(
        "PORTAL_MAPS_API_KEY",
        operatorParameterPlaceholder,
        "Google Maps browser key for the property map on the home screen. It is visible in page source, as every browser key is, so restrict it by HTTP referrer to this host and to the Maps JavaScript API and the Geocoding API. Addresses of properties without stored coordinates are sent to the Geocoding API. While it holds the # it ships with, no Google script is loaded and the home screen lists the properties without a map.",
      ),
      parameter(
        "PORTAL_MAPS_MAP_ID",
        operatorParameterPlaceholder,
        "Optional Google Cloud map ID that styles the property map, created in the same Google Cloud project as PORTAL_MAPS_API_KEY. It is not a secret. While it holds the # it ships with, the map uses Google's default style.",
      ),
    ],
  };
}

function parameter(code, value, description) {
  return { code, type: "STRING", nls: { en: { NAME: code.replace(/_/g, " "), DESCRIPTION: description } }, value };
}

function parameterMarker(code) {
  return "$" + "{" + code + "@STRING}";
}

export function assertLiveTemplate(template) {
  assertJteSafeTemplate(template);
  const allowed = new Set(liveDeploymentParameters);
  for (const item of template.parameters) {
    if (!allowed.has(item.code)) throw new Error("A live portal root may only declare the deployment parameters " + liveDeploymentParameters.join(", ") + "; " + item.code + " is not one of them");
    if (item.type !== "STRING") throw new Error("Parameter " + item.code + " must be a STRING");
    if (item.code === "PORTAL_REQUEST_FORM_URL") {
      if (item.value !== "" && !isHttpsUrl(item.value)) throw new Error("Parameter PORTAL_REQUEST_FORM_URL must be an absolute https address");
    } else if (item.value !== operatorParameterPlaceholder) {
      throw new Error("Parameter " + item.code + " is operator-owned and ships only the " + operatorParameterPlaceholder + " placeholder");
    }
  }
  const directive = /@(param|import|template|if|for|while|switch|else)\b/;
  const fields = { head: template.head, html: template.html, css: template.css, javascript: template.javascript };
  for (const [field, value] of Object.entries(fields)) {
    const match = directive.exec(value);
    if (match) throw new Error("Refusing to export JTE-unsafe " + field + ": JTE directive " + JSON.stringify(match[0]));
    if (field !== "html" && value.includes("${")) throw new Error("Refusing to export " + field + ": only the root element may carry a parameter marker");
    const offsets = controlCharacterOffsets(value);
    if (offsets.length) throw new Error("Refusing to export " + field + ": control character " + value.charCodeAt(offsets[0]) + " at offset " + offsets[0]);
  }
  if (/<\/script/i.test(template.javascript)) throw new Error("Refusing to inline a javascript field that contains a script terminator");
  const shipped = Object.assign({}, fields, { parameters: JSON.stringify(template.parameters), nls: JSON.stringify(template.nls) });
  for (const [field, value] of Object.entries(shipped)) {
    for (const shape of credentialShapes) {
      if (shape.pattern.test(value)) throw new Error("Refusing to ship a " + shape.label + " in " + field);
    }
  }
}

function manifestFor(sourcePath, source, geography, template) {
  return {
    schemaVersion: 1,
    uploadPerformed: false,
    mode: "staging",
    launchState: "staging-only",
    input: path.relative(process.cwd(), sourcePath),
    template: {
      code: template.code,
      templateLanguage: template.templateLanguage,
      parameters: template.parameters.map((item) => item.code),
      sha256: { head: sha256(template.head), html: sha256(template.html), css: sha256(template.css), javascript: sha256(template.javascript) },
    },
    runtime: {
      delivery: "inline-template-javascript",
      sameOriginRequired: true,
      dataMode: source.runtime.dataMode,
      authMode: source.runtime.authMode,
      vertical: source.runtime.vertical,
      profile: source.runtime.profile,
      openedModules: source.runtime.enabledModules,
      auth: Object.assign({ flow: "oidc-authorization-code-pkce" }, source.auth),
      account: source.account,
      serviceGeography: geography,
    },
    constraints: source.constraints,
  };
}

function previewFor(source, template) {
  const values = new Map(template.parameters.map((item) => [item.code, item.value]));
  const html = template.html.replace(/\$\{([A-Z0-9_]+)@[A-Z_]+\}/g, (marker, code) => (values.has(code) ? escapeHtml(values.get(code)) : marker));
  const mode = (source.shell && source.shell.defaultMode) || "light";
  return '<!doctype html>\n<html lang="en" data-theme="' + escapeHtml(source.runtime.theme) + '" data-mode="' + escapeHtml(mode) + '">\n<head>\n'
    + template.head + "\n<style>\n" + template.css + "</style>\n</head>\n<body>\n" + html + "\n<script>\n" + template.javascript + "\n</script>\n</body>\n</html>\n";
}

async function writePackage(root, packageData) {
  const { source, template, manifest, preview } = packageData;
  await writeJson(path.join(root, "cms-family.payload.json"), { schemaVersion: 1, root: template, children: [] });
  await writeJson(path.join(root, "manual-export-manifest.json"), manifest);
  await writeText(path.join(root, "preview.html"), preview);
  await writeText(path.join(root, "README.md"), readme(source, template, manifest));
  await splitTemplate(path.join(root, "root"), template);
  await assertExactInventory(root, packageInventory);
}

function readme(source, template, manifest) {
  const account = source.account;
  const parameters = template.parameters.map((item) => "| `" + item.code + "` | " + (item.value ? "`" + item.value + "`" : "empty") + " |");
  return [
    "# " + template.nls.en.NAME,
    "",
    "Generated by `scripts/export-live-portal-manual.mjs` from `" + manifest.input + "`. Never hand-edit this directory.",
    "",
    "| field | value |",
    "| --- | --- |",
    "| template code | `" + template.code + "` |",
    "| template language | `" + template.templateLanguage + "` |",
    "| data mode | `" + manifest.runtime.dataMode + "` |",
    "| auth mode | `" + manifest.runtime.authMode + "`, Core OIDC authorization code with PKCE |",
    "| organization | `" + account.organization + "` |",
    "| customer Account types | " + account.accountTypeCode.split(",").map((code) => "`" + code + "`").join(", ") + " |",
    "| enabled modules | " + source.runtime.enabledModules.map((id) => "`" + id + "`").join(", ") + " |",
    "| launch state | `" + manifest.launchState + "` |",
    "",
    "## Upload",
    "",
    "`app-templates/landing-page/scripts/upload-cms-family.mjs --out <this directory>` creates or updates the BlockTemplate by code. It is a dry run unless `--live` is passed, and it never creates or changes a PageContext.",
    "",
    "For a manual paste, copy `root/head.html`, `root/html.html`, `root/css.css` and `root/javascript.js` into the matching fields of a JTE BlockTemplate with code `" + template.code + "`, and declare the parameters of `root/parameters.json`. `root/template.json` is the complete record.",
    "",
    "The page must be served from the same origin as Core: every service base, the Core discovery document and the `" + source.auth.callbackPath + "` callback are same-origin paths. `oidc-client-ts` is loaded from a pinned CDN address with SRI.",
    "",
    "## Operator-owned parameters",
    "",
    "| parameter | shipped value |",
    "| --- | --- |",
    ...parameters,
    "",
    "## Constraints",
    "",
    ...source.constraints.map((line) => "- " + line),
    "",
  ].join("\n");
}

function assertSafeOutputDir(outputDir) {
  const relative = path.relative(distRoot, outputDir);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Manual packages may only be written under dist/manual-upload/");
}

export function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    const match = /^--(input|runtime|output)=(.*)$/.exec(arg);
    if (!match) throw new Error("Unsupported argument: " + arg);
    options[{ input: "inputPath", runtime: "runtimePath", output: "outputDir" }[match[1]]] = match[2];
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportLivePortalManual(parseArgs(process.argv.slice(2)));
  console.log("export-live-portal-manual ok: " + path.relative(process.cwd(), result.outputDir) + " upload=false");
}
