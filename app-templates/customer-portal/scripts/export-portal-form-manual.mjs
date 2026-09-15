import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const portalRoot = path.resolve("app-templates/customer-portal");
const distRoot = path.join(portalRoot, "dist/manual-upload");
const defaultOutputDir = path.join(distRoot, "portal-form-document");
const rootCode = "PORTAL_FORM_DOCUMENT";
const styleFiles = ["tokens.css", "base.css", "components.css"];

const COPY = [
  ["TITLE", "Get your free quote"],
  ["SUBTITLE", "Tell us about the property and we will come back with a seasonal number."],
  ["NOTE", ""],
  ["SUBMIT_LABEL", "Send request"],
  ["SUBMITTING_LABEL", "Sending…"],
  ["NEXT_LABEL", "Continue"],
  ["BACK_LABEL", "Back"],
  ["RETRY_LABEL", "Try again"],
  ["STEP_FALLBACK", "Step {n}"],
  ["SELECT_PLACEHOLDER", "Choose one"],
  ["REQUIRED_ERROR", "This field is required."],
  ["FORMAT_ERROR", "That format is not accepted."],
  ["INCOMPLETE_ERROR", "Finish filling this field."],
  ["EMAIL_ERROR", "Enter a valid email address."],
  ["URL_ERROR", "Enter a full https address."],
  ["NUMBER_ERROR", "Enter a number."],
  ["MIN_ERROR", "Minimum is {n}."],
  ["MAX_ERROR", "Maximum is {n}."],
  ["MIN_LENGTH_ERROR", "At least {n} characters."],
  ["MAX_LENGTH_ERROR", "At most {n} characters."],
  ["SCHEMA_ERROR_TITLE", "The form could not be loaded"],
  ["SCHEMA_ERROR_BODY", "We could not reach the form service. Nothing was sent."],
  ["EMPTY_TITLE", "This form has no fields"],
  ["EMPTY_BODY", "The published form type contains no visible attributes."],
  ["SUCCESS_TITLE", "Request received"],
  ["SUCCESS_BODY", "Thanks — we have your details and will be in touch."],
  ["SUBMIT_ERROR_TITLE", "The request was not sent"],
  ["SUBMIT_ERROR_BODY", "Something went wrong on the way. Your answers are still here — try again."],
  ["BLOCKED_TITLE", "Sending is not configured"],
  ["BLOCKED_BODY", "This form has no organization id yet, so it cannot submit."],
];

const COPY_KEYS = {
  TITLE: "title", SUBTITLE: "subtitle", NOTE: "note",
  SUBMIT_LABEL: "submitLabel", SUBMITTING_LABEL: "submittingLabel", NEXT_LABEL: "nextLabel",
  BACK_LABEL: "backLabel", RETRY_LABEL: "retryLabel", STEP_FALLBACK: "stepFallback",
  SELECT_PLACEHOLDER: "selectPlaceholder", REQUIRED_ERROR: "requiredError", FORMAT_ERROR: "formatError",
  INCOMPLETE_ERROR: "incompleteError", EMAIL_ERROR: "emailError", URL_ERROR: "urlError",
  NUMBER_ERROR: "numberError", MIN_ERROR: "minError", MAX_ERROR: "maxError",
  MIN_LENGTH_ERROR: "minLengthError", MAX_LENGTH_ERROR: "maxLengthError",
  SCHEMA_ERROR_TITLE: "schemaErrorTitle", SCHEMA_ERROR_BODY: "schemaErrorBody",
  EMPTY_TITLE: "emptyTitle", EMPTY_BODY: "emptyBody",
  SUCCESS_TITLE: "successTitle", SUCCESS_BODY: "successBody",
  SUBMIT_ERROR_TITLE: "submitErrorTitle", SUBMIT_ERROR_BODY: "submitErrorBody",
  BLOCKED_TITLE: "blockedTitle", BLOCKED_BODY: "blockedBody",
};

const THEMES = ["hvac", "snow", "lawn", "pool", "roofing", "pest", "health", "beauty"];
const MODES = ["light", "dark"];

const DEPLOYMENT = [
  ["FORM_API_BASE_URL", "", "Absolute https origin of the Core deployment, for example https://dev-1.servicewand.com. Any other scheme is discarded and the form reports that it could not load."],
  ["FORM_TYPE_CODE", "", "Published Core form type code, for example GET_QUOTE_. The document renders whatever that type declares."],
  ["FORM_ORGANIZATION_ID", "", "Numeric organization id the submission belongs to. While it is empty the submit button stays disabled and nothing can be posted."],
  ["FORM_LOCALE", "en", "Locale segment used when reading the schema and when picking labels out of each nls bag."],
  ["FORM_THEME", "snow", "Vertical palette. One of: " + THEMES.join(", ") + ". Any other value falls back to snow."],
  ["FORM_MODE", "light", "Colour mode. One of: " + MODES.join(", ") + ". Any other value falls back to light."],
  ["FORM_MAPS_API_KEY", "", "Google Maps browser key, used only by fields whose Input format declares address. It is visible in page source, as every browser key is, so restrict it by HTTP referrer to this host and to the Maps JavaScript, Places and Geocoding APIs. While it is empty no Google script is loaded and an address field stays a plain text input."],
];

export async function exportPortalFormManual(options = {}) {
  const outputDir = path.resolve(options.outputDir || defaultOutputDir);
  assertSafeOutputDir(outputDir);

  const [renderer, formCss, portalCss] = await Promise.all([
    fs.readFile(path.join(portalRoot, "runtime/forms/portal-form.js"), "utf8"),
    fs.readFile(path.join(portalRoot, "runtime/forms/portal-form.css"), "utf8"),
    readStyles(),
  ]);

  const documentCss = annotated("portal form document scope", [
    "html, body { min-height: 100%; }",
    "body { margin: 0; background: var(--app-bg); color: var(--ink); font-family: var(--font); }",
  ].join("\n"));
  const template = templateFor([portalCss, annotated("runtime/forms/portal-form.css", formCss), documentCss].join("\n\n"), renderer);
  assertJteSafeTemplate(template);
  const manifest = manifestFor(template);
  const preview = await previewFor(template);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "portal-form-manual-"));
  try {
    await writePackage(tempDir, { template, manifest, preview });
    await replaceDirectory(outputDir, tempDir);
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
  return { outputDir, template, manifest };
}

function templateFor(css, renderer) {
  const parameters = DEPLOYMENT.map(function (entry) { return field(entry[0], entry[1], "STRING", entry[2]); })
    .concat(COPY.map(function (entry) { return field(entry[0], entry[1]); }));

  const attributes = {
    id: "portal-form-root",
    "data-form-api-base": ref("FORM_API_BASE_URL", "STRING"),
    "data-form-type-code": ref("FORM_TYPE_CODE", "STRING"),
    "data-form-organization-id": ref("FORM_ORGANIZATION_ID", "STRING"),
    "data-form-locale": ref("FORM_LOCALE", "STRING"),
    "data-form-theme": ref("FORM_THEME", "STRING"),
    "data-form-mode": ref("FORM_MODE", "STRING"),
    "data-form-maps-api-key": ref("FORM_MAPS_API_KEY", "STRING"),
  };
  Object.keys(COPY_KEYS).forEach(function (code) {
    attributes["data-copy-" + COPY_KEYS[code].replace(/[A-Z]/g, function (character) { return "-" + character.toLowerCase(); })] = ref(code);
  });

  return {
    code: rootCode,
    nls: { en: { NAME: "Portal form — universal renderer" } },
    templateLanguage: "JTE",
    parent: null,
    children: [],
    head: '<meta charset="utf-8">\n'
      + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
      + "<title>" + ref("TITLE") + "</title>\n"
      + '<link rel="icon" href="data:,">\n'
      + '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
      + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
      + '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;530;600;700;800&display=swap" rel="stylesheet">',
    html: '<section ' + attrs(attributes) + '>\n  <div class="pf-shell"><div data-portal-form-mount></div></div>\n</section>',
    css: css,
    javascript: renderer + "\n" + bootScript(),
    parameters: parameters,
  };
}

function bootScript() {
  return `(function () {
  "use strict";
  var COPY_KEYS = ${JSON.stringify(COPY_KEYS)};
  var THEMES = ${JSON.stringify(THEMES)};
  var MODES = ${JSON.stringify(MODES)};
  function oneOf(value, allowed, fallback) { return allowed.indexOf(value) === -1 ? fallback : value; }
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true }); else fn(); }
  function attribute(root, name) { return String(root.getAttribute(name) || "").trim(); }
  function safeBase(value) {
    if (!value) return "";
    try { var url = new URL(value); return url.protocol === "https:" ? url.origin + url.pathname.replace(/\\/+$/, "") : ""; } catch (_) { return ""; }
  }
  function copyFrom(root) {
    var copy = {};
    Object.keys(COPY_KEYS).forEach(function (code) {
      var name = "data-copy-" + COPY_KEYS[code].replace(/[A-Z]/g, function (character) { return "-" + character.toLowerCase(); });
      copy[COPY_KEYS[code]] = attribute(root, name);
    });
    return copy;
  }
  ready(function () {
    var root = document.getElementById("portal-form-root");
    if (!root || typeof window.PortalForm !== "function") return;
    var mount = root.querySelector("[data-portal-form-mount]");
    if (!mount) return;
    var theme = oneOf(attribute(root, "data-form-theme").toLowerCase(), THEMES, "snow");
    var mode = oneOf(attribute(root, "data-form-mode").toLowerCase(), MODES, "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
    var organizationId = Number(attribute(root, "data-form-organization-id"));
    new window.PortalForm({
      apiBaseUrl: safeBase(attribute(root, "data-form-api-base")),
      formTypeCode: attribute(root, "data-form-type-code"),
      organizationId: Number.isFinite(organizationId) && organizationId > 0 ? organizationId : null,
      locale: attribute(root, "data-form-locale") || "en",
      mapsApiKey: attribute(root, "data-form-maps-api-key"),
      copy: copyFrom(root),
    }).mount(mount);
  });
})();`;
}

export function assertJteSafeTemplate(template) {
  if (template.templateLanguage !== "JTE") throw new Error("The portal form document must be a JTE template");
  const declared = new Set(template.parameters.map(function (parameter) { return parameter.code; }));
  const referenced = new Set();
  const markers = [
    { token: "@{", label: "JTE code opener" },
    { token: "!{", label: "JTE unsafe-content opener" },
    { token: "<%", label: "server-template code opener" },
    { token: "%>", label: "server-template code closer" },
  ];
  for (const [name, value] of Object.entries({ head: template.head, html: template.html, css: template.css, javascript: template.javascript })) {
    for (const marker of markers) {
      if (value.includes(marker.token)) throw new Error("Refusing to export JTE-unsafe " + name + ": " + marker.label);
    }
    for (const match of value.matchAll(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g)) referenced.add(match[1]);
    const stray = value.replace(/\$\{[A-Z0-9_]+@[A-Z_]+\}/g, "");
    if (stray.includes("${")) throw new Error("Refusing to export " + name + ": it contains a ${ opener that is not a declared parameter marker");
  }
  for (const code of referenced) {
    if (!declared.has(code)) throw new Error("Parameter " + code + " is referenced but never declared");
  }
  for (const code of declared) {
    if (!referenced.has(code)) throw new Error("Parameter " + code + " is declared but never referenced");
  }
  try {
    Function(template.javascript);
  } catch (error) {
    throw new Error("The document javascript is not syntactically valid: " + error.message);
  }
}

async function readStyles() {
  const parts = await Promise.all(styleFiles.map(async function (name) {
    const content = await fs.readFile(path.join(portalRoot, "runtime/styles", name), "utf8");
    return annotated("runtime/styles/" + name, content);
  }));
  return parts.join("\n\n");
}

function annotated(name, css) { return "/* source: " + name + " */\n" + css.trim(); }

function manifestFor(template) {
  return {
    schemaVersion: 1,
    uploadPerformed: false,
    kind: "portal-form-document",
    template: {
      code: template.code,
      templateLanguage: template.templateLanguage,
      parameterCount: template.parameters.length,
      sha256: {
        head: sha256(template.head), html: sha256(template.html),
        css: sha256(template.css), javascript: sha256(template.javascript),
      },
    },
    renderer: {
      source: "app-templates/customer-portal/runtime/forms/portal-form.js",
      styles: "app-templates/customer-portal/runtime/forms/portal-form.css",
      kinds: ["text", "textarea", "password", "email", "tel", "url", "color", "date", "number", "slider", "boolean", "select", "multiselect", "radio", "checklist", "combobox", "address", "address-list"],
    },
    themes: THEMES,
    modes: MODES,
    api: {
      schema: "GET {apiBase}/{locale}/core-cms/api/form-type/{FORM_TYPE_CODE}/get.json",
      submit: "POST {apiBase}/core-cms/api/form/submit.json",
      credentials: "omit",
    },
    constraints: [
      "The document renders whatever the published form type declares. It contains no field list of its own.",
      "FORM_API_BASE_URL must be an absolute https origin. Any other scheme is discarded and the form reports that it could not load.",
      "FORM_ORGANIZATION_ID must be a positive number. Until it is set the submit button stays disabled, so an unconfigured document cannot post.",
      "uiBehavior is honoured only as a declarative applyBehavior mapping of value to step. Server-supplied JavaScript is never executed.",
      "Both requests are anonymous: credentials are omitted and no token, session or customer value is ever sent.",
      "Masks are applied only when the attribute declares mask: in its inputFormat. Nothing is inferred, so no value is reshaped without the schema asking.",
      "FORM_MAPS_API_KEY is a public browser key by design and must be restricted by HTTP referrer and API list in the Google console. While it is empty no Google script is loaded at all, and an address field degrades to a plain text input that still submits.",
      "FORM_THEME and FORM_MODE accept only a published vertical and light or dark. An unrecognised value falls back to the shipped default instead of writing an unknown data-theme that would silently render the wrong palette.",
    ],
  };
}

async function previewFor(template) {
  const snapshot = await fs.readFile(path.join(portalRoot, "content/form-types/GET_QUOTE_.en.json"), "utf8");
  const values = new Map(template.parameters.map(function (parameter) {
    return [parameter.code, parameter.type.startsWith("LOCALIZED") ? parameter.value.en : parameter.value];
  }));
  const resolve = function (value) {
    return value.replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, function (_, code) { return escapeHtml(values.get(code) || ""); });
  };
  return "<!doctype html>\n<html lang=\"en\" data-theme=\"snow\" data-mode=\"light\">\n<head>\n"
    + resolve(template.head) + "\n<style>\n" + template.css + "</style>\n</head>\n<body>\n"
    + resolve(template.html) + "\n<script>\n" + template.javascript + "\n</script>\n"
    + '<script>window.__PORTAL_FORM_PREVIEW_SCHEMA=' + snapshot.replace(/</g, "\\u003c") + ";\n"
    + "document.addEventListener('DOMContentLoaded', function () {\n"
    + "  var mount = document.querySelector('[data-portal-form-mount]');\n"
    + "  if (!mount) return;\n"
    + "  mount.replaceChildren();\n"
    + "  var root = document.getElementById('portal-form-root');\n"
    + "  var copy = {};\n"
    + "  Object.keys(" + JSON.stringify(COPY_KEYS) + ").forEach(function (code) {\n"
    + "    var key = " + JSON.stringify(COPY_KEYS) + "[code];\n"
    + "    copy[key] = root.getAttribute('data-copy-' + key.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); })) || '';\n"
    + "  });\n"
    + "  new window.PortalForm({ schema: window.__PORTAL_FORM_PREVIEW_SCHEMA, locale: 'en', copy: copy }).mount(mount);\n"
    + "});</script>\n</body>\n</html>\n";
}

async function writePackage(dir, packageData) {
  await fs.mkdir(path.join(dir, "root"), { recursive: true });
  await writeJson(path.join(dir, "cms-family.payload.json"), { schemaVersion: 1, root: packageData.template, children: [] });
  await writeJson(path.join(dir, "manual-export-manifest.json"), packageData.manifest);
  await writeJson(path.join(dir, "root/template.json"), packageData.template);
  await writeText(path.join(dir, "root/head.html"), packageData.template.head);
  await writeText(path.join(dir, "root/html.html"), packageData.template.html);
  await writeText(path.join(dir, "root/css.css"), packageData.template.css);
  await writeText(path.join(dir, "root/javascript.js"), packageData.template.javascript);
  await writeJson(path.join(dir, "root/parameters.json"), packageData.template.parameters);
  await writeText(path.join(dir, "preview.html"), packageData.preview);
  await writeText(path.join(dir, "README.md"), readme(packageData));
}

function readme(packageData) {
  return [
    "# Portal form — universal renderer",
    "",
    "One standalone CMS document that renders whatever a published Core form type declares, in the customer portal design language.",
    "Generated by `scripts/export-portal-form-manual.mjs`. Never hand-edit this directory.",
    "",
    "| field | value |",
    "| --- | --- |",
    "| template code | `" + packageData.template.code + "` |",
    "| template language | `" + packageData.template.templateLanguage + "` |",
    "| parameters | " + packageData.template.parameters.length + " |",
    "| field kinds covered | " + packageData.manifest.renderer.kinds.length + " |",
    "",
    "## Configure",
    "",
    "| parameter | meaning |",
    "| --- | --- |",
    "| `FORM_API_BASE_URL` | absolute https origin of the Core deployment |",
    "| `FORM_TYPE_CODE` | published form type code, for example `GET_QUOTE_` |",
    "| `FORM_ORGANIZATION_ID` | numeric organization id the submission belongs to |",
    "| `FORM_LOCALE` | locale segment used when reading the schema |",
    "| `FORM_THEME` | `hvac`, `snow`, `lawn`, `pool`, `roofing`, `pest`, `health` or `beauty` |",
    "| `FORM_MODE` | `light` or `dark` |",
    "",
    "Every other parameter is copy: labels, button text, and one message per validation and lifecycle state.",
    "",
    "## Contract",
    "",
    "```text",
    packageData.manifest.api.schema,
    packageData.manifest.api.submit,
    "```",
    "",
    "## Constraints",
    "",
    ...packageData.manifest.constraints.map(function (line) { return "- " + line; }),
    "",
    "`preview.html` renders the document against the committed `GET_QUOTE_` snapshot, so it opens without a network.",
    "",
  ].join("\n");
}

function assertSafeOutputDir(outputDir) {
  const relative = path.relative(distRoot, outputDir);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Manual packages may only be written under dist/manual-upload/");
  }
}

async function replaceDirectory(outputDir, tempDir) {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(outputDir), { recursive: true });
  await fs.rename(tempDir, outputDir);
}

async function writeText(file, value) { await fs.writeFile(file, String(value).replace(/\n*$/, "\n"), "utf8"); }
async function writeJson(file, value) { await writeText(file, JSON.stringify(value, null, 2)); }
function sha256(value) { return crypto.createHash("sha256").update(value, "utf8").digest("hex"); }
function field(code, value, type = "LOCALIZED_STRING_SS", description) {
  return {
    code,
    type,
    nls: { en: { NAME: code.replaceAll("_", " "), DESCRIPTION: description || "Portal form document copy." } },
    value: type.startsWith("LOCALIZED") ? { en: value } : value,
  };
}
function ref(code, type = "LOCALIZED_STRING_SS") { return "$" + "{" + code + "@" + type + "}"; }
function attrs(map) {
  return Object.entries(map).map(function (entry) { return entry[0] + '="' + escapeHtml(entry[1]) + '"'; }).join("\n  ");
}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportPortalFormManual({ outputDir: process.argv.includes("--output") ? process.argv[process.argv.indexOf("--output") + 1] : undefined });
  console.log("export-portal-form-manual ok: " + path.relative(process.cwd(), result.outputDir)
    + " (" + result.template.parameters.length + " parameters)");
}
