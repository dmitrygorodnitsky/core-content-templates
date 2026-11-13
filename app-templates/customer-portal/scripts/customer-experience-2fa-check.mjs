import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { buildCustomerExperience } from "./build-customer-experience.mjs";
import { loadCustomerExperienceInputs } from "./customer-experience-config-report.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const sourcePath = path.join(portalRoot, "design-inbox/core-auth-2fa.html");
const stylePath = path.join(portalRoot, "design-inbox/styles/core-auth-2fa.css");
const checkRoot = path.join(portalRoot, "dist/customer-experience/2fa-contract-check");
const runtimePlaceholders = [
  "TWO_FACTOR_ACTION", "CSRF_PARAMETER_NAME", "CSRF_TOKEN", "SETUP_DISPLAY",
  "VERIFY_NOTICE_DISPLAY", "ERROR_DISPLAY", "TWO_FACTOR_QR_CODE", "TWO_FACTOR_SECRET",
];

const [source, acceptedStyle, inputs] = await Promise.all([
  fs.readFile(sourcePath, "utf8"),
  fs.readFile(stylePath, "utf8"),
  loadCustomerExperienceInputs(),
]);
const sourceHash = sha256(source);

try {
  const build = await buildCustomerExperience({ inputs, outputDir: checkRoot });
  const template = build.templates.twoFactor;
  assert.equal(template.code, "CUSTOMER_EXPERIENCE_AUTH_2FA");
  assert.equal(template.parameters.length, 24);
  assert.equal(template.javascript, "", "AUTH_2FA must not execute client JavaScript");
  assert.equal(template.css, "", "AUTH_2FA styles are self-contained in the CMS head");
  assert.equal(/<link[^>]+stylesheet/i.test(template.head), false, "AUTH_2FA must not depend on relative or remote stylesheets");
  assert.equal(/https?:\/\//i.test(template.head + template.html), false, "AUTH_2FA must not call a third-party origin");
  assert.equal(/<!--[\s\S]*?-->/.test(template.html), false, "accepted explanatory comments must not enter CMS markup");
  assert.equal(/<script\b|\son[a-z]+\s*=/i.test(template.html), false, "AUTH_2FA markup must stay script-free");
  assert.equal((template.html.match(/<form\b/gi) || []).length, 1);
  assert.equal((template.html.match(/data-core-auth-2fa\b/gi) || []).length, 1);
  assert.match(template.html, /<form[^>]+method="post"[^>]+action="\{\{TWO_FACTOR_ACTION\}\}"[^>]+data-core-auth-2fa/);
  assert.match(template.html, /name="code"[^>]+inputmode="numeric"[^>]+autocomplete="one-time-code"/);
  assert.equal(template.html.includes("{{TWO_FACTOR_OTPAUTH_URI}}"), false);
  for (const placeholder of runtimePlaceholders) {
    assert.equal(count(template.html, "{{" + placeholder + "}}"), 1, placeholder + " survives exactly once");
  }

  const protectedParameterCodes = new Set(["CSRF_PARAMETER_NAME", "CSRF_TOKEN", "TWO_FACTOR_SECRET", "TWO_FACTOR_QR_CODE", "TWO_FACTOR_ACTION", "TWO_FACTOR_OTPAUTH_URI"]);
  for (const parameter of template.parameters) {
    assert.equal(protectedParameterCodes.has(parameter.code), false, parameter.code + " must not own runtime auth data");
  }

  const acceptedBody = stripComments(source).match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1].trim();
  assert.ok(acceptedBody, "accepted source body exists");
  const generatedBody = template.html.match(/<div class="auth-root"[^>]*>([\s\S]*?)<\/div>\s*<\/body>$/i)?.[1].trim();
  assert.ok(generatedBody, "generated scoped body exists");
  const expectedBody = acceptedBody
    .replaceAll("${AUTH_BRAND_NAME@LOCALIZED_STRING_SS}", "${CX_BRAND_NAME@LOCALIZED_STRING_SS}")
    .replaceAll("${AUTH_PITCH_EYEBROW@LOCALIZED_STRING_SS}", "${LOGIN_PITCH_EYEBROW@LOCALIZED_STRING_SS}");
  assert.equal(normalize(expectedBody), normalize(generatedBody), "accepted Wave 19 body transfers 1:1 apart from shared generic parameter names");

  const expectedStyle = stripCssComments(acceptedStyle).replace(/@container\s+authpage\s*\(/g, "@media (").trim();
  assert.equal(normalizeCss(template.head).includes(normalizeCss(expectedStyle)), true, "accepted Wave 19 additions transfer intact into the self-contained CMS head");
  assert.match(template.html, /class="auth-root" lang="\$\{CX_LANGUAGE@STRING\}" dir="\$\{CX_DIRECTION@STRING\}" data-theme="\$\{CX_THEME@STRING\}" data-mode="\$\{CX_DEFAULT_MODE@STRING\}"/);
  assert.equal(build.pageContexts.twoFactor.selector, inputs.descriptor.surfaces.login.pageContextSelector, "2FA uses the same trusted Core Auth PageContext selector contract as login");
  assert.equal(build.pageContexts.twoFactor.parameters.find((item) => item.code === "CX_BRAND_NAME")?.value.en, "Calm Harbor Spa");
  assert.equal(build.pageContexts.twoFactor.parameters.find((item) => item.code === "TWO_FACTOR_BUTTON")?.value.en, "Verify");

  assert.equal(sha256(await fs.readFile(sourcePath, "utf8")), sourceHash, "design-inbox source remains immutable");
  console.log("customer-experience-2fa-check ok: Wave 19 transferred 1:1 into generic AUTH_2FA; 24 safe parameters, 8 runtime placeholders, one native form, no script or external dependency");
} finally {
  await fs.rm(checkRoot, { recursive: true, force: true });
}

function stripComments(value) { return String(value).replace(/<!--[\s\S]*?-->/g, ""); }
function stripCssComments(value) { return String(value).replace(/\/\*[\s\S]*?\*\//g, ""); }
function normalize(value) { return String(value).replace(/\s+/g, " ").trim(); }
function normalizeCss(value) { return stripCssComments(value).replace(/\s+/g, " ").trim(); }
function count(value, needle) { return String(value).split(needle).length - 1; }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
