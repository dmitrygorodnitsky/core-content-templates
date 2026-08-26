import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { assertFixtureBundle } from "./build-fixture-portal-runtime.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const distRoot = path.join(portalRoot, "dist/manual-upload");
const styleFiles = ["tokens.css", "base.css", "shell.css", "components.css", "routes.css", "responsive.css", "seo.css"];

export async function exportFixturePortalManual(options = {}) {
  if (!options.inputPath) throw new Error("--input=<source.json> is required");
  if (!options.runtimePath) throw new Error("--runtime=<fixture-runtime.js> is required");
  if (!options.outputDir) throw new Error("--output=<dist/manual-upload/...> is required");
  const sourcePath = path.resolve(options.inputPath);
  const outputDir = path.resolve(options.outputDir);
  assertSafeOutputDir(outputDir);

  const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  await validateSource(source);
  const javascript = await fs.readFile(path.resolve(options.runtimePath), "utf8");
  assertFixtureBundle(javascript, source.runtime.case);
  const css = await readStyles();
  const template = templateFor(source, css, javascript);
  assertJteSafeTemplate(template);
  const manifest = manifestFor(sourcePath, source, template);
  const preview = previewFor(source, template);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "fixture-portal-manual-"));
  try {
    await writePackage(tempDir, { source, template, css, manifest, preview });
    await replaceDirectory(outputDir, tempDir);
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
  return { outputDir, manifest };
}

async function validateSource(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Fixture portal source must be an object");
  if (source.schemaVersion !== 1) throw new Error("Fixture portal source schemaVersion must be 1");
  if (!source.template || typeof source.template.code !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(source.template.code)) {
    throw new Error("Fixture portal source needs an upper-snake template code");
  }
  if (!source.template.title) throw new Error("Fixture portal source needs a template title");

  const runtime = source.runtime;
  if (!runtime) throw new Error("Fixture portal source needs a runtime block");
  if (runtime.dataMode !== "fixture") throw new Error("A fixture portal package must stay in fixture data mode");
  if (runtime.authMode !== "fixture") throw new Error("A fixture portal package must not claim an authentication contract");
  if (!runtime.case) throw new Error("A fixture portal package must name its demonstration case");

  for (const key of ["account", "pim", "auth"]) {
    if (source[key]) throw new Error("A fixture portal package must not carry a " + key + " contract; nothing here is live");
  }

  const { knownCaseIds } = await import(pathToFileURL(path.join(portalRoot, "runtime/data/case-fixtures.js")).href);
  if (!knownCaseIds.includes(runtime.case)) throw new Error("Unknown fixture case " + runtime.case);

  const { portalProfiles, verticalProfiles } = await import(pathToFileURL(path.join(portalRoot, "runtime/src/config.js")).href);
  const { caseVerticalFor } = await import(pathToFileURL(path.join(portalRoot, "runtime/data/case-fixtures.js")).href);
  if (!verticalProfiles[runtime.vertical]) throw new Error("Unknown vertical " + runtime.vertical);
  if (caseVerticalFor(runtime.case) !== runtime.vertical) {
    throw new Error("Case " + runtime.case + " does not belong to vertical " + runtime.vertical);
  }
  const profile = portalProfiles[runtime.profile];
  if (!profile) throw new Error("Unknown profile " + runtime.profile);
  if (!Array.isArray(runtime.enabledModules) || !runtime.enabledModules.length) {
    throw new Error("Fixture portal source needs an explicit enabledModules list");
  }
  for (const moduleId of runtime.enabledModules) {
    if (!profile.modules.includes(moduleId)) throw new Error("Module " + moduleId + " is not part of profile " + runtime.profile);
  }
  if (runtime.enabledModules.includes("products") && !runtime.enabledModules.includes("checkout")) {
    throw new Error("Enabling products without checkout would render add-to-cart actions that cannot complete");
  }
  if (!Array.isArray(source.constraints) || !source.constraints.length) {
    throw new Error("Fixture portal source must state its constraints");
  }
}

function templateFor(source, css, javascript) {
  const runtime = source.runtime;
  const shell = source.shell || {};
  const navigation = shell.navigation || {};
  const attributes = {
    "data-portal-experience-id": shell.experienceId || "",
    "data-portal-brand-name": shell.brandName || "",
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
    "data-portal-case": runtime.case,
    "data-portal-primary-cta-label": shell.primaryCtaLabel || "",
    "data-portal-nav-primary-label": navigation.primary || "",
    "data-portal-nav-calendar-label": navigation.calendar || "",
    "data-portal-nav-activity-label": navigation.activity || "",
    "data-portal-nav-care-label": navigation.care || "",
    "data-portal-nav-proposals-label": navigation.proposals || "",
    "data-portal-nav-services-label": navigation.services || "",
    "data-portal-nav-pricing-label": navigation.pricing || "",
    "data-portal-nav-products-label": navigation.products || "",
    "data-portal-nav-support-label": navigation.support || "",
    "data-portal-weather-client-id": (runtime.weather && runtime.weather.clientId) || "",
    "data-portal-weather-client-secret": (runtime.weather && runtime.weather.clientSecret) || "",
  };
  return {
    code: source.template.code,
    nls: { en: { NAME: source.template.title } },
    templateLanguage: "JTE",
    parent: null,
    children: [],
    head: '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>'
      + escapeHtml(source.template.title)
      + '</title>\n<meta name="robots" content="noindex,nofollow">\n<link rel="icon" href="data:,">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;530;600;700;800&display=swap" rel="stylesheet">',
    html: '<section id="app" ' + attrs(attributes) + "></section>",
    css,
    javascript,
    parameters: [],
  };
}

export function assertJteSafeTemplate(template) {
  if (template.templateLanguage !== "JTE") throw new Error("A fixture portal template must be JTE, the only language proven against this CMS");
  if (template.parameters.length) throw new Error("A fixture portal root must stay parameter-free; every value it reads is a data-portal-* attribute");
  const markers = [
    { token: "${", label: "JTE expression/parameter opener" },
    { token: "@{", label: "JTE code opener" },
    { token: "!{", label: "JTE unsafe-content opener" },
    { token: "<%", label: "server-template code opener" },
    { token: "%>", label: "server-template code closer" },
  ];
  const directive = /@(param|import|template|if|for|while|switch|else)\b/g;
  for (const [field, value] of Object.entries({ head: template.head, html: template.html, css: template.css, javascript: template.javascript })) {
    for (const marker of markers) {
      const index = value.indexOf(marker.token);
      if (index !== -1) {
        const line = value.slice(0, index).split("\n").length;
        throw new Error("Refusing to export JTE-unsafe " + field + ": " + marker.label + " " + JSON.stringify(marker.token) + " at line " + line);
      }
    }
    directive.lastIndex = 0;
    const match = directive.exec(value);
    directive.lastIndex = 0;
    if (match) throw new Error("Refusing to export JTE-unsafe " + field + ": JTE directive " + JSON.stringify(match[0]));
    if (value.includes("\u0000")) throw new Error("Field " + field + " contains a NUL byte");
  }
  try {
    Function(template.javascript);
  } catch (error) {
    throw new Error("CMS javascript is not syntactically valid after the JTE safety pass: " + error.message);
  }
}

async function readStyles() {
  const parts = await Promise.all(styleFiles.map(async (name) => {
    const content = await fs.readFile(path.join(portalRoot, "runtime/styles", name), "utf8");
    return "/* manual portal source: runtime/styles/" + name + " */\n" + content.trim();
  }));
  return parts.join("\n\n") + "\n";
}

function manifestFor(sourcePath, source, template) {
  return {
    schemaVersion: 1,
    uploadPerformed: false,
    mode: "fixture-demonstration",
    launchState: "demonstration-only",
    input: path.relative(process.cwd(), sourcePath),
    template: {
      code: template.code,
      templateLanguage: template.templateLanguage,
      parameters: [],
      sha256: {
        head: sha256(template.head),
        html: sha256(template.html),
        css: sha256(template.css),
        javascript: sha256(template.javascript),
      },
    },
    runtime: {
      delivery: "inline-template-javascript",
      sameOriginRequired: false,
      dataMode: source.runtime.dataMode,
      authMode: source.runtime.authMode,
      case: source.runtime.case,
      openedModules: source.runtime.enabledModules,
      openedLiveContracts: [],
    },
    constraints: source.constraints,
  };
}

function previewFor(source, template) {
  return '<!doctype html>\n<html lang="en" data-theme="' + escapeHtml(source.runtime.theme)
    + '" data-mode="' + escapeHtml((source.shell && source.shell.defaultMode) || "light") + '">\n<head>\n'
    + template.head + "\n<style>\n" + template.css + "</style>\n</head>\n<body>\n"
    + template.html + "\n<script>\n" + template.javascript + "\n</script>\n</body>\n</html>\n";
}

async function writePackage(root, packageData) {
  await fs.mkdir(path.join(root, "root"), { recursive: true });
  await writeJson(path.join(root, "cms-family.payload.json"), { schemaVersion: 1, root: packageData.template, children: [] });
  await writeJson(path.join(root, "manual-export-manifest.json"), packageData.manifest);
  await writeJson(path.join(root, "root/template.json"), { ...packageData.template, head: undefined, html: undefined, css: undefined, javascript: undefined });
  await fs.writeFile(path.join(root, "root/head.html"), packageData.template.head + "\n");
  await fs.writeFile(path.join(root, "root/html.html"), packageData.template.html + "\n");
  await fs.writeFile(path.join(root, "root/css.css"), packageData.template.css);
  await fs.writeFile(path.join(root, "root/javascript.js"), packageData.template.javascript);
  await fs.writeFile(path.join(root, "preview.html"), packageData.preview);
  await fs.writeFile(path.join(root, "README.md"), readmeFor(packageData));
}

function readmeFor(packageData) {
  const manifest = packageData.manifest;
  return [
    "# " + packageData.template.nls.en.NAME,
    "",
    "Generated by `scripts/export-fixture-portal-manual.mjs`. Never hand-edit this directory.",
    "",
    "| field | value |",
    "| --- | --- |",
    "| template code | `" + packageData.template.code + "` |",
    "| template language | `" + packageData.template.templateLanguage + "` |",
    "| data mode | `" + manifest.runtime.dataMode + "` |",
    "| auth mode | `" + manifest.runtime.authMode + "` |",
    "| fixture case | `" + manifest.runtime.case + "` |",
    "| opened live contracts | none |",
    "",
    "## Manual upload",
    "",
    "Paste `root/head.html`, `root/html.html`, `root/css.css`, and `root/javascript.js` into the",
    "matching CMS BlockTemplate fields. The template declares no parameters: every value the",
    "runtime reads is a `data-portal-*` attribute in `root/html.html`.",
    "",
    "Open `preview.html` in a browser to see exactly what CMS will render.",
    "",
    "## Constraints",
    "",
    ...manifest.constraints.map((line) => "- " + line),
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

async function writeJson(file, value) {
  await fs.writeFile(file, JSON.stringify(value, null, 1) + "\n");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function attrs(map) {
  return Object.entries(map)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => key + '="' + escapeHtml(String(value)) + '"')
    .join("\n  ");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportFixturePortalManual(parseArgs(process.argv.slice(2)));
  console.log("export-fixture-portal-manual ok: " + path.relative(process.cwd(), result.outputDir));
}
