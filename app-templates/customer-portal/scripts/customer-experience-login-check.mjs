import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { buildCustomerExperience } from "./build-customer-experience.mjs";
import { AUTH_LOGIN_STYLE_NAMES, LOGIN_COPY_SLOTS, LOGIN_RUNTIME_PLACEHOLDERS } from "./customer-experience-auth-source.mjs";
import { loadCustomerExperienceInputs } from "./customer-experience-config-report.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const sourcePath = path.join(portalRoot, "design-inbox/core-auth-login.html");
const checkRoot = path.join(portalRoot, "dist/customer-experience/login-contract-check");
const protectedCodes = new Set(LOGIN_RUNTIME_PLACEHOLDERS.concat(["PASSWORD_VALUE"]));

const [source, inputs, ...styles] = await Promise.all([
  fs.readFile(sourcePath, "utf8"),
  loadCustomerExperienceInputs(),
  ...AUTH_LOGIN_STYLE_NAMES.map((name) => fs.readFile(path.join(portalRoot, "design-inbox/styles", name), "utf8")),
]);
const sourceHash = sha256(source);
const styleHashes = styles.map(sha256);

try {
  const build = await buildCustomerExperience({ inputs, outputDir: checkRoot });
  const template = build.templates.login;
  assert.equal(template.code, "CUSTOMER_EXPERIENCE_LOGIN");
  assert.equal(template.parameters.length, 26);
  assert.equal(template.css, "", "login styles are self-contained in the CMS head");
  assert.match(template.javascript, /data-password-toggle/, "the accepted password reveal enhancement is emitted");
  assert.match(template.javascript, /fetch\(actionPath/, "direct-session login bootstraps and submits against the same-origin backend form");
  assert.match(template.javascript, /credentials: 'same-origin'/, "direct-session auth requests stay same-origin");
  assert.match(template.javascript, /successUrl\.origin !== window\.location\.origin/, "direct-session return rejects another origin");
  assert.equal(/localStorage|sessionStorage|console\./.test(template.javascript), false, "credentials and tokens are neither persisted nor logged");
  assert.equal(/data-dev-toolbar|<script\b|<!--[\s\S]*?-->/.test(template.html), false, "preview harness, script tags, and comments stay out of CMS markup");
  assert.equal(/<link[^>]+stylesheet|https?:\/\//i.test(template.head + template.html), false, "login is self-contained and third-party free");
  assert.equal((template.html.match(/<form\b/gi) || []).length, 1);
  assert.equal((template.html.match(/data-core-auth-login\b/gi) || []).length, 1);
  assert.match(template.html, /<form[^>]+method="post"[^>]+action="\{\{LOGIN_ACTION\}\}"[^>]+data-core-auth-login/);
  assert.match(template.html, /data-login-success-url="\$\{CX_PORTAL_URL@STRING\}"/, "direct-session success returns to the configured customer portal");
  assert.match(template.html, /name="username"[^>]+autocomplete="username"/);
  assert.match(template.html, /name="password"[^>]+autocomplete="current-password"/);
  assert.match(template.html, /style="display:none;display:\{\{ERROR_DISPLAY\}\}"/, "raw CMS login hides the unresolved error state");
  assert.match(template.html, /style="display:none;display:\{\{LOGOUT_DISPLAY\}\}"/, "raw CMS login hides the unresolved logout state");
  assert.match(template.html.replace("{{ERROR_DISPLAY}}", "block"), /style="display:none;display:block"/, "Core Auth can still show the error state");
  assert.match(template.html.replace("{{LOGOUT_DISPLAY}}", "block"), /style="display:none;display:block"/, "Core Auth can still show the logout state");
  for (const placeholder of LOGIN_RUNTIME_PLACEHOLDERS) assert.equal(count(template.html, "{{" + placeholder + "}}"), 1, placeholder + " survives exactly once");
  for (const parameter of template.parameters) assert.equal(protectedCodes.has(parameter.code), false, parameter.code + " must not own runtime auth data");

  const copySlots = [...template.html.matchAll(/data-copy="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(copySlots.slice().sort(), Object.keys(LOGIN_COPY_SLOTS).filter((slot) => slot !== "page.documentTitle").sort(), "accepted body copy slots survive transfer");
  for (const code of Object.values(LOGIN_COPY_SLOTS)) assert.equal(template.head.includes("${" + code + "@LOCALIZED_STRING_SS}") || template.html.includes("${" + code + "@LOCALIZED_STRING_SS}"), true, code + " is parameterized");
  assert.equal(build.manifest.sources.login.source, "app-templates/customer-portal/design-inbox/core-auth-login.html");
  assert.equal(build.manifest.sources.login.sha256, sourceHash);
  assert.equal(JSON.stringify(build.manifest).includes("CUSTOMER_PORTAL_CALM_HARBOR_LOGIN"), false, "manifest has no deleted tenant-package dependency");

  assert.equal(sha256(await fs.readFile(sourcePath)), sourceHash, "accepted login HTML remains immutable");
  const currentStyleHashes = await Promise.all(AUTH_LOGIN_STYLE_NAMES.map(async (name) => sha256(await fs.readFile(path.join(portalRoot, "design-inbox/styles", name)))));
  assert.deepEqual(currentStyleHashes, styleHashes, "accepted login styles remain immutable");
  console.log("customer-experience-login-check ok: Wave 18 compiles into generic LOGIN with fail-closed raw CMS states and direct-session CSRF bootstrap; 26 safe parameters, 6 runtime placeholders, one guarded form");
} finally {
  await fs.rm(checkRoot, { recursive: true, force: true });
}

function count(value, needle) { return String(value).split(needle).length - 1; }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
