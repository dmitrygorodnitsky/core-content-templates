import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { buildCustomerExperience } from "./build-customer-experience.mjs";
import { loadCustomerExperienceInputs } from "./customer-experience-config-report.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const designRoot = path.join(portalRoot, "design-inbox");
const checkRoot = path.join(portalRoot, "dist/customer-experience/2fa-visual-build");
const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");
const { PNG } = requireFrom("pngjs");
const pixelmatch = requireFrom("pixelmatch").default;
const styleNames = ["tokens.css", "base.css", "shell.css", "components.css", "routes.css", "core-auth-login.css", "core-auth-2fa.css"];
const scenarios = [
  { state: "setup-ready", width: 1440, mode: "light", setup: "block", notice: "none", error: "none" },
  { state: "setup-ready", width: 390, mode: "dark", setup: "block", notice: "none", error: "none" },
  { state: "setup-error", width: 1440, mode: "dark", setup: "block", notice: "none", error: "block" },
  { state: "setup-error", width: 390, mode: "light", setup: "block", notice: "none", error: "block" },
  { state: "verify-ready", width: 1440, mode: "light", setup: "none", notice: "block", error: "none" },
  { state: "verify-ready", width: 390, mode: "dark", setup: "none", notice: "block", error: "none" },
  { state: "verify-error", width: 1440, mode: "dark", setup: "none", notice: "block", error: "block" },
  { state: "verify-error", width: 390, mode: "light", setup: "none", notice: "block", error: "block" },
];

const [source, inventory, qr, inputs, ...styleParts] = await Promise.all([
  fs.readFile(path.join(designRoot, "core-auth-2fa.html"), "utf8"),
  readJson(path.join(designRoot, "data/core-auth-2fa-parameters.json")),
  fs.readFile(path.join(designRoot, "previews/wave19/qr-harness-sample.png")),
  loadCustomerExperienceInputs(),
  ...styleNames.map((name) => fs.readFile(path.join(designRoot, "styles", name), "utf8")),
]);
const acceptedCss = styleParts.join("\n\n");
const qrDataUrl = "data:image/png;base64," + qr.toString("base64");
let browser;

try {
  const build = await buildCustomerExperience({ inputs, outputDir: checkRoot });
  const template = build.templates.twoFactor;
  const examples = new Map(inventory.parameters.map((parameter) => [parameter.name, parameter.example]));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ["--disable-gpu"] });
  const rows = [];

  for (const scenario of scenarios) {
    const runtime = runtimeValues(scenario, qrDataUrl);
    const referenceHtml = renderReference(source, acceptedCss, examples, runtime, scenario);
    const implementationHtml = renderImplementation(template, examples, runtime, scenario);
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
  assert.equal(failures.length, 0, "AUTH_2FA visual parity drift: " + JSON.stringify(failures, null, 2));
  console.log("customer-experience-2fa-visual-check ok: 8 strict Wave 19 pairs, four states, desktop/mobile, light/dark, changed=0");
} finally {
  if (browser) await browser.close();
  await fs.rm(checkRoot, { recursive: true, force: true });
}

function renderReference(value, css, examples, runtime, scenario) {
  let html = String(value).replace(/<!--[\s\S]*?-->/g, "").replace(/<link rel="stylesheet"[^>]*>/g, "");
  html = html.replace("</head>", "<style>" + css + "</style></head>");
  html = html.replace(/<html[^>]*>/, '<html lang="en" dir="ltr" data-theme="hvac" data-mode="' + scenario.mode + '">');
  html = html.replace(/\$\{([A-Z0-9_]+)@LOCALIZED_STRING_SS\}/g, (_, code) => escapeHtml(examples.get(code) || ""));
  return replaceRuntime(html, runtime);
}

function renderImplementation(template, examples, runtime, scenario) {
  const values = new Map([
    ["CX_LANGUAGE", "en"], ["CX_DIRECTION", "ltr"], ["CX_THEME", "hvac"], ["CX_DEFAULT_MODE", scenario.mode],
    ["CX_BRAND_NAME", examples.get("AUTH_BRAND_NAME")], ["LOGIN_PITCH_EYEBROW", examples.get("AUTH_PITCH_EYEBROW")],
  ]);
  for (const [code, example] of examples) if (!code.startsWith("AUTH_")) values.set(code, example);
  const resolve = (value) => String(value).replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, (_, code) => escapeHtml(values.get(code) || ""));
  return replaceRuntime("<!doctype html><html><head>" + resolve(template.head) + "</head>" + resolve(template.html) + "</html>", runtime);
}

function runtimeValues(scenario, qrDataUrl) {
  return {
    TWO_FACTOR_ACTION: "/verify", CSRF_PARAMETER_NAME: "_csrf", CSRF_TOKEN: "safe-test-token",
    SETUP_DISPLAY: scenario.setup, VERIFY_NOTICE_DISPLAY: scenario.notice, ERROR_DISPLAY: scenario.error,
    TWO_FACTOR_QR_CODE: qrDataUrl, TWO_FACTOR_SECRET: "JBSWY3DPEHPK3PXP",
  };
}

function replaceRuntime(value, runtime) {
  let result = String(value);
  for (const [code, replacement] of Object.entries(runtime)) result = result.replaceAll("{{" + code + "}}", replacement);
  return result;
}

async function metrics(page) {
  return page.evaluate(() => {
    const ids = ["core-auth-2fa", "core-auth-2fa-card", "core-auth-2fa-setup", "core-auth-2fa-notice", "core-auth-2fa-error"];
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

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
async function readJson(file) { return JSON.parse(await fs.readFile(file, "utf8")); }
