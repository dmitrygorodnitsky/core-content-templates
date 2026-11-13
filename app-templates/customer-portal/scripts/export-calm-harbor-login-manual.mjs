import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { buildCustomerExperience } from "./build-customer-experience.mjs";
import { loadCustomerExperienceInputs } from "./customer-experience-config-report.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const defaultOutputDir = path.join(portalRoot, "dist/manual-upload/customer-experience-calm-harbor-login-staging");
const legacyParameters = [
  ["THEME", "STRING", null, "hvac"],
  ["MODE", "STRING", null, "light"],
  ["TITLE", "LOCALIZED_STRING_SS", "LOGIN_DOCUMENT_TITLE"],
  ["BRAND_NAME", "LOCALIZED_STRING_SS", "CX_BRAND_NAME"],
  ["CARD_TITLE", "LOCALIZED_STRING_SS", "LOGIN_CARD_TITLE"],
  ["CARD_SUBTITLE", "LOCALIZED_STRING_SS", "LOGIN_CARD_SUBTITLE"],
  ["ERROR_TITLE", "LOCALIZED_STRING_SS", "LOGIN_ERROR_TITLE"],
  ["ERROR_BODY", "LOCALIZED_STRING_SS", "LOGIN_ERROR_BODY"],
  ["LOGOUT_TITLE", "LOCALIZED_STRING_SS", "LOGIN_LOGOUT_TITLE"],
  ["LOGOUT_BODY", "LOCALIZED_STRING_SS", "LOGIN_LOGOUT_BODY"],
  ["USERNAME_LABEL", "LOCALIZED_STRING_SS", "LOGIN_USERNAME_LABEL"],
  ["PASSWORD_LABEL", "LOCALIZED_STRING_SS", "LOGIN_PASSWORD_LABEL"],
  ["FORGOT_PASSWORD", "LOCALIZED_STRING_SS", "LOGIN_FORGOT_PASSWORD_LABEL"],
  ["SHOW_PASSWORD", "LOCALIZED_STRING_SS", "LOGIN_SHOW_PASSWORD_LABEL"],
  ["HIDE_PASSWORD", "LOCALIZED_STRING_SS", "LOGIN_HIDE_PASSWORD_LABEL"],
  ["LOGIN_BUTTON", "LOCALIZED_STRING_SS", "LOGIN_SUBMIT_LABEL"],
  ["CARD_NOTE", "LOCALIZED_STRING_SS", "LOGIN_CARD_NOTE"],
  ["PITCH_EYEBROW", "LOCALIZED_STRING_SS", "LOGIN_PITCH_EYEBROW"],
  ["PITCH_TITLE", "LOCALIZED_STRING_SS", "LOGIN_PITCH_TITLE"],
  ["PITCH_BODY", "LOCALIZED_STRING_SS", "LOGIN_PITCH_BODY"],
];

export async function exportCalmHarborLoginManual(options = {}) {
  const outputDir = path.resolve(options.outputDir || defaultOutputDir);
  assertSafeOutputDir(outputDir);
  const buildRoot = path.join(portalRoot, "dist/customer-experience");
  await fs.mkdir(buildRoot, { recursive: true });
  const buildDir = await fs.mkdtemp(path.join(buildRoot, "manual-login-build-"));
  let staging = await fs.mkdtemp(path.join(os.tmpdir(), "calm-harbor-login-manual-"));
  try {
    const inputs = options.inputs || await loadCustomerExperienceInputs(options);
    const build = await buildCustomerExperience({ inputs, outputDir: buildDir });
    const template = legacyTemplateFor(build);
    assertMaterialized(template);
    const manifest = {
      schemaVersion: 1,
      kind: "customer-experience-login-manual-export",
      uploadPerformed: false,
      experienceId: inputs.descriptor.experience.id,
      templateCode: template.code,
      parameterCount: template.parameters.length,
      templateSha256: sha256(JSON.stringify(template)),
      directSession: {
        action: "/oauth2/login",
        csrfBootstrap: "/oauth2/login",
        resetPassword: "/oauth2/forgot-password",
      successParameter: "same-origin returnUrl with Calm Harbor portal fallback",
      },
    };
    await fs.writeFile(path.join(staging, "template.json"), JSON.stringify(template, null, 2) + "\n");
    await fs.writeFile(path.join(staging, "parameters.json"), JSON.stringify(template.parameters, null, 2) + "\n");
    await fs.writeFile(path.join(staging, "page-context.parameters.json"), JSON.stringify(build.pageContexts.login, null, 2) + "\n");
    await fs.writeFile(path.join(staging, "manual-export-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(path.dirname(outputDir), { recursive: true });
    await fs.rename(staging, outputDir);
    staging = null;
    return { outputDir, manifest };
  } finally {
    await fs.rm(buildDir, { recursive: true, force: true });
    if (staging) await fs.rm(staging, { recursive: true, force: true });
  }
}

function assertMaterialized(template) {
  if (template.code !== "CUSTOMER_PORTAL_CALM_HARBOR_LOGIN") throw new Error("Unexpected compatibility login template code");
  if (!template.javascript.includes("fetch(actionPath")) throw new Error("Direct-session bootstrap is missing");
  if (!template.html.includes('data-login-success-url="https://dev-1.servicewand.com/calm-harbor-spa-customer-portal"')) throw new Error("Calm Harbor portal return is missing");
  for (const parameter of template.parameters) {
    const value = parameter.value;
    const empty = value == null
      || (typeof value === "string" && !value.trim())
      || (typeof value === "object" && !Object.values(value).some((item) => String(item || "").trim()));
    if (empty) throw new Error("Manual login parameter is not materialized: " + parameter.code);
  }
  const declared = new Set(template.parameters.map((parameter) => parameter.code));
  const referenced = new Set([...String(template.head + template.html).matchAll(/\$\{([A-Z0-9_]+)@[A-Z_]+\}/g)].map((match) => match[1]));
  if (declared.size !== legacyParameters.length || [...referenced].some((code) => !declared.has(code))) throw new Error("Legacy login JTE parameter inventory drifted");
  if (/\$\{|@\{|!\{|<%|%>/.test(template.javascript + template.css)) throw new Error("Executable login fields contain a JTE marker");
  const directive = /@(param|import|template|if|for|while|switch|else)\b/;
  if (directive.test(template.javascript + template.css)) throw new Error("Executable login fields contain a JTE directive");
}

function legacyTemplateFor(build) {
  const values = new Map(build.pageContexts.login.parameters.map((item) => [item.code, item.value]));
  const generic = build.templates.login;
  const parameters = legacyParameters.map(([code, type, sourceCode, fixedValue]) => {
    const value = fixedValue ?? values.get(sourceCode);
    if (value == null) throw new Error("Login PageContext is missing " + sourceCode);
    return {
      code,
      type,
      nls: { en: { NAME: code.toLowerCase().replaceAll("_", " "), DESCRIPTION: "Calm Harbor deployed login compatibility value." } },
      value,
    };
  });
  const markerMap = new Map(legacyParameters.filter((item) => item[2]).map(([legacyCode, type, genericCode]) => [genericCode + "@" + type, legacyCode + "@" + type]));
  const rewrite = (value) => String(value)
    .replaceAll('${CX_LANGUAGE@STRING}', "en")
    .replaceAll('${CX_DIRECTION@STRING}', "ltr")
    .replaceAll('${CX_THEME@STRING}', '${THEME@STRING}')
    .replaceAll('${CX_DEFAULT_MODE@STRING}', '${MODE@STRING}')
    .replaceAll('${CX_PORTAL_URL@STRING}', "https://dev-1.servicewand.com/calm-harbor-spa-customer-portal")
    .replace(/\$\{([A-Z0-9_]+@[A-Z_]+)\}/g, (match, key) => markerMap.has(key) ? "${" + markerMap.get(key) + "}" : match);
  return {
    ...generic,
    code: "CUSTOMER_PORTAL_CALM_HARBOR_LOGIN",
    nls: { en: { NAME: "Calm Harbor Spa | Core Auth login" } },
    head: rewrite(generic.head),
    html: rewrite(generic.html),
    parameters,
  };
}

function assertSafeOutputDir(outputDir) {
  const allowed = path.join(portalRoot, "dist/manual-upload") + path.sep;
  if (!outputDir.startsWith(allowed)) throw new Error("Login manual export must stay under customer-portal/dist/manual-upload");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await exportCalmHarborLoginManual();
  console.log("export-calm-harbor-login-manual ok: " + result.outputDir);
}
