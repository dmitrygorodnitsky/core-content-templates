import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { buildCustomerExperience } from "./build-customer-experience.mjs";
import { AUTH_LOGIN_STYLE_NAMES, LOGIN_COPY_SLOTS, stripLoginPreviewHarness } from "./customer-experience-auth-source.mjs";
import { loadCustomerExperienceInputs } from "./customer-experience-config-report.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const designRoot = path.join(portalRoot, "design-inbox");
const checkRoot = path.join(portalRoot, "dist/customer-experience/login-visual-build");
const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json")) : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");
const { PNG } = requireFrom("pngjs");
const pixelmatch = requireFrom("pixelmatch").default;
const scenarios = [
  { state: "default", width: 1440, mode: "light", error: "none", logout: "none" },
  { state: "default", width: 390, mode: "dark", error: "none", logout: "none" },
  { state: "error", width: 1440, mode: "dark", error: "block", logout: "none" },
  { state: "error", width: 390, mode: "light", error: "block", logout: "none" },
  { state: "after-logout", width: 1440, mode: "light", error: "none", logout: "block" },
  { state: "after-logout", width: 390, mode: "dark", error: "none", logout: "block" },
  { state: "both", width: 1440, mode: "dark", error: "block", logout: "block" },
  { state: "both", width: 390, mode: "light", error: "block", logout: "block" },
];

const [source, inputs, ...styleParts] = await Promise.all([
  fs.readFile(path.join(designRoot, "core-auth-login.html"), "utf8"),
  loadCustomerExperienceInputs(),
  ...AUTH_LOGIN_STYLE_NAMES.map((name) => fs.readFile(path.join(designRoot, "styles", name), "utf8")),
]);
const acceptedCss = styleParts.join("\n\n");
let browser;

try {
  const build = await buildCustomerExperience({ inputs, outputDir: checkRoot });
  const template = build.templates.login;
  const values = new Map(build.pageContexts.login.parameters.map((parameter) => [parameter.code, localized(parameter.value)]));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ["--disable-gpu"] });
  const rows = [];

  for (const scenario of scenarios) {
    const runtime = { LOGIN_ACTION: "/login", CSRF_PARAMETER_NAME: "_csrf", CSRF_TOKEN: "safe-test-token", RESET_PASSWORD_URL: "/reset", ERROR_DISPLAY: scenario.error, LOGOUT_DISPLAY: scenario.logout };
    const referenceHtml = renderReference(source, acceptedCss, values, runtime, scenario);
    const implementationHtml = renderImplementation(template, values, runtime, scenario);
    const page = await browser.newPage({ viewport: { width: scenario.width, height: 1000 }, deviceScaleFactor: 1 });
    await page.setContent(referenceHtml, { waitUntil: "load" });
    await page.evaluate(() => document.fonts?.ready);
    const reference = await page.screenshot({ fullPage: true, animations: "disabled" });
    const referenceMetrics = await metrics(page);
    await page.setContent(implementationHtml, { waitUntil: "load" });
    await page.evaluate(() => document.fonts?.ready);
    const implementation = await page.screenshot({ fullPage: true, animations: "disabled" });
    const implementationMetrics = await metrics(page);
    const changed = strictDiff(reference, implementation);
    rows.push({ ...scenario, changed, referenceMetrics, implementationMetrics });
    await page.close();
  }

  const failures = rows.filter((row) => row.changed !== 0 || JSON.stringify(row.referenceMetrics) !== JSON.stringify(row.implementationMetrics));
  assert.equal(failures.length, 0, "LOGIN visual parity drift: " + JSON.stringify(failures, null, 2));
  console.log("customer-experience-login-visual-check ok: 8 strict Wave 18 pairs, four states, desktop/mobile, light/dark, changed=0");
} finally {
  if (browser) await browser.close();
  await fs.rm(checkRoot, { recursive: true, force: true });
}

function renderReference(value, css, values, runtime, scenario) {
  let html = stripLoginPreviewHarness(value).replace(/<link rel="stylesheet"[^>]*>/g, "");
  html = html.replace("</head>", "<style>" + css + "</style></head>");
  html = html.replace(/<html[^>]*>/, '<html lang="en" dir="ltr" data-theme="beauty" data-mode="' + scenario.mode + '">');
  for (const [slot, code] of Object.entries(LOGIN_COPY_SLOTS)) html = replaceCopy(html, slot, escapeHtml(values.get(code) || ""));
  return replaceRuntime(html, runtime);
}

function renderImplementation(template, values, runtime, scenario) {
  const implementationValues = new Map(values);
  implementationValues.set("CX_LANGUAGE", "en");
  implementationValues.set("CX_DIRECTION", "ltr");
  implementationValues.set("CX_THEME", "beauty");
  implementationValues.set("CX_DEFAULT_MODE", scenario.mode);
  const resolve = (value) => String(value).replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, (_, code) => escapeHtml(implementationValues.get(code) || ""));
  return replaceRuntime("<!doctype html><html><head>" + resolve(template.head) + "</head>" + resolve(template.html) + "<script>" + template.javascript + "</script></html>", runtime);
}

function replaceCopy(value, slot, replacement) {
  const pattern = new RegExp('(<([a-z][a-z0-9]*)\\b[^>]*\\bdata-copy="' + escapeRegex(slot) + '"[^>]*>)([\\s\\S]*?)(<\\/\\2>)', "gi");
  let count = 0;
  const result = String(value).replace(pattern, (match, open, tag, current, close) => { count += 1; return open + replacement + close; });
  assert.equal(count, 1, "reference copy slot exists exactly once: " + slot);
  return result;
}

function replaceRuntime(value, runtime) {
  let result = String(value);
  for (const [code, replacement] of Object.entries(runtime)) result = result.replaceAll("{{" + code + "}}", replacement);
  return result;
}

async function metrics(page) {
  return page.evaluate(() => {
    const ids = ["core-auth-login", "core-auth-login-card", "auth-message-error", "auth-message-logout"];
    return Object.fromEntries(ids.map((id) => {
      const element = document.querySelector('[data-visual-id="' + id + '"], [data-module="' + id + '"]');
      if (!element) return [id, null];
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return [id, { x: rect.x, y: rect.y, width: rect.width, height: rect.height, display: style.display, fontSize: style.fontSize, borderRadius: style.borderRadius, color: style.color, backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage, accent: style.getPropertyValue("--accent"), ink: style.getPropertyValue("--ink"), surface: style.getPropertyValue("--surface") }];
    }));
  });
}

function strictDiff(leftBuffer, rightBuffer) {
  const left = PNG.sync.read(leftBuffer);
  const right = PNG.sync.read(rightBuffer);
  if (left.width !== right.width || left.height !== right.height) return Number.MAX_SAFE_INTEGER;
  const diff = new PNG({ width: left.width, height: left.height });
  return pixelmatch(left.data, right.data, diff.data, left.width, left.height, { threshold: 0, includeAA: true });
}

function localized(value) { return value && typeof value === "object" ? value.en || "" : value || ""; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function escapeRegex(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
