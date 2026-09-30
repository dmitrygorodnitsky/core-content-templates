import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");
const { PNG } = requireFrom("pngjs");
const sharp = requireFrom("sharp");
const pixelmatchPath = requireFrom.resolve("pixelmatch");
const { default: pixelmatch } = await import(pathToFileURL(pixelmatchPath));

const portalRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const repoRoot = path.resolve(portalRoot, "../..");
const requested = process.argv.slice(2);
const outputArgument = requested.find((value) => value.startsWith("--output-dir="));
const diagnosticArgument = requested.find((value) => value.startsWith("--diagnostic-dir="));
const outputRoot = path.resolve(outputArgument ? outputArgument.slice("--output-dir=".length) : path.join(repoRoot, "docs/stream-tasks/customer-portal-wave9-runtime-program/evidence/artifacts/S4"));
const diagnosticRoot = diagnosticArgument ? path.resolve(diagnosticArgument.slice("--diagnostic-dir=".length)) : null;
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const update = requested.includes("--update");
const verify = requested.includes("--verify");
const smoke = requested.includes("--smoke");
const browserRowBatchSize = 4;
const maxStableCaptureRounds = 3;
const browserGracefulCloseTimeoutMs = 30000;
const onlyIds = requested.filter((value) => value.startsWith("--id=")).map((value) => value.slice(5));
assert.equal(update && verify, false, "--update and --verify are mutually exclusive");
assert.equal(verify && (smoke || onlyIds.length > 0), false, "--verify always checks the complete stored matrix");
if (diagnosticRoot) {
  const relativeToTemp = path.relative(path.resolve(os.tmpdir()), diagnosticRoot);
  assert(relativeToTemp && !relativeToTemp.startsWith("..") && !path.isAbsolute(relativeToTemp), "--diagnostic-dir must be a child of the system temporary directory");
  assert.equal(update, false, "diagnostic output is mismatch-only and cannot be combined with --update");
}

const verticals = [
  ["hvac", "HVAC"], ["snow", "Snow Removal"], ["lawn", "Lawn & Garden"],
  ["pool", "Pool & Spa"], ["roofing", "Roofing"], ["pest", "Pest Control"],
  ["health", "Health"], ["beauty", "Beauty"],
];
const widths = [390, 768, 1180, 1440];
const CARE_UNAVAILABLE_INVENTORY = Object.freeze({
  HVAC: [
    ["booking.open", null],
    ["care.download", "doc-hvac-diag-2026-01"],
    ["care.download", "doc-hvac-warranty-carrier"],
  ],
  "Snow Removal": [
    ["care.download", "doc-snow-compliance-2025-12"],
    ["care.download", "doc-snow-compliance-2025-11"],
  ],
  "Lawn & Garden": [
    ["service.requestExtra", null],
  ],
  "Pool & Spa": [
    ["service.requestExtra", null],
  ],
  Roofing: [
    ["care.download", "doc-roof-inspection-2026-01"],
    ["care.download", "doc-roof-warranty-shingle"],
    ["care.download", "doc-roof-insurance-pack"],
  ],
  "Pest Control": [],
  Health: [
    ["order.reschedule", "#SV-2410"],
    ["order.open", "#SV-2410"],
    ["care.contactProvider", "prov-health-pt-01"],
    ["support.call", null],
    ["care.openSecureDoc", "doc-health-plan-2025-11"],
    ["care.openSecureDoc", "doc-health-visit-2026-01-12"],
    ["care.openSecureDoc", "doc-health-results-2026-01"],
  ],
  Beauty: [
    ["order.reschedule", "#SV-3312"],
    ["booking.open", null],
  ],
});

function row(id, surface, vertical, width, options = {}) {
  return {
    id, surface, vertical, width, height: options.height || 900,
    mode: options.mode || "light", state: options.state || "ready",
    referenceState: options.referenceState || options.state || "ready",
    variant: options.variant || "default",
    comparisonMode: options.comparisonMode || "strict-full",
  };
}

function buildMatrix() {
  const rows = [];
  for (const [, vertical] of verticals) {
    for (const width of widths) rows.push(row(`care-ready-${slug(vertical)}-${width}`, "care", vertical, width, { comparisonMode: CARE_UNAVAILABLE_INVENTORY[vertical].length ? "source-effect-components" : "strict-full" }));
  }
  rows.push(
    row("care-loading-hvac-390", "care", "HVAC", 390, { state: "loading" }),
    row("care-empty-health-768", "care", "Health", 768, { state: "empty" }),
    row("care-error-beauty-1180", "care", "Beauty", 1180, { state: "error" }),
    row("care-unauthorized-pest-1440", "care", "Pest Control", 1440, { state: "unauthorized" }),
    row("care-disabled-hvac-768", "care", "HVAC", 768, { state: "disabled", referenceState: "unauthorized", comparisonMode: "contract-state" }),
    row("care-mobile-nav-health-390", "care", "Health", 390, { variant: "mobile-nav", comparisonMode: "source-effect-components" }),
    row("care-dark-health-390", "care", "Health", 390, { mode: "dark", comparisonMode: "source-effect-components" }),
    row("care-dark-health-1440", "care", "Health", 1440, { mode: "dark", comparisonMode: "source-effect-components" }),
  );
  for (const vertical of ["Health", "Beauty", "HVAC"]) {
    for (const width of widths) rows.push(row(`seo-ready-${slug(vertical)}-${width}`, "seo", vertical, width));
  }
  rows.push(
    row("seo-faq-open-hvac-768", "seo", "HVAC", 768, { variant: "faq-open" }),
    row("seo-selected-service-beauty-768", "seo", "Beauty", 768, { variant: "selected-service", comparisonMode: "contract-state" }),
    row("seo-cta-pending-health-768", "seo", "Health", 768, { variant: "cta-pending" }),
    row("seo-cta-success-health-768", "seo", "Health", 768, { variant: "cta-success" }),
    row("seo-cta-error-health-768", "seo", "Health", 768, { variant: "cta-error" }),
    row("seo-source-long-health-390", "seo", "Health", 390, { variant: "source-long-content" }),
    row("seo-missing-media-hvac-390", "seo", "HVAC", 390, { variant: "missing-media" }),
    row("seo-missing-media-hvac-1440", "seo", "HVAC", 1440, { variant: "missing-media" }),
    row("seo-dark-beauty-390", "seo", "Beauty", 390, { mode: "dark" }),
    row("seo-dark-beauty-1440", "seo", "Beauty", 1440, { mode: "dark" }),
  );
  return rows;
}

function slug(value) { return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function verticalSlug(displayName) { return verticals.find(([, name]) => name === displayName)?.[0] || "hvac"; }

const matrix = buildMatrix();
assert.equal(matrix.length, 62, "S4 matrix row count changed; update the explicit coverage contract");
for (const vertical of verticals.map(([, name]) => name)) {
  for (const width of widths) assert(matrix.some((item) => item.surface === "care" && item.vertical === vertical && item.width === width && item.state === "ready"));
}
for (const vertical of ["Health", "Beauty", "HVAC"]) {
  for (const width of widths) assert(matrix.some((item) => item.surface === "seo" && item.vertical === vertical && item.width === width && item.state === "ready"));
}
for (const required of ["loading", "empty", "error", "unauthorized", "disabled"]) assert(matrix.some((item) => item.surface === "care" && item.state === required));
for (const required of ["mobile-nav", "source-long-content", "faq-open", "selected-service", "cta-pending", "cta-success", "cta-error", "missing-media"]) assert(matrix.some((item) => item.variant === required));
assert(matrix.some((item) => item.mode === "dark" && item.surface === "care"));
assert(matrix.some((item) => item.mode === "dark" && item.surface === "seo"));
await runSelfTests();

const freezeCss = `
  [data-dev-toolbar] { display: none !important; }
  .viewport-host { display: block !important; }
  .viewport-frame { width: 100% !important; max-width: none !important; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; }
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
`;

async function main() {
  const verifyTreeBefore = verify ? await hashTree(outputRoot) : null;
  if (update && !smoke && !onlyIds.length) await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });
  const server = await serve(portalRoot);
  const browserOptions = {
    executablePath,
    headless: true,
    args: [
      "--disable-gpu",
      "--disable-lcd-text",
      "--font-render-hinting=none",
      "--force-color-profile=srgb",
      "--disable-threaded-animation",
      "--disable-threaded-scrolling",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-features=PaintHolding",
    ],
  };
  const rows = onlyIds.length ? matrix.filter((item) => onlyIds.includes(item.id))
    : smoke ? matrix.filter((item) => ["care-ready-health-390", "care-ready-hvac-1440", "seo-ready-health-390", "seo-ready-hvac-1440"].includes(item.id)) : matrix;
  assert.equal(rows.length, onlyIds.length || (smoke ? 4 : matrix.length), "requested matrix row is missing");
  const results = [];
  let ownedBrowsers = null;
  try {
    for (const [index, item] of rows.entries()) {
      if (!ownedBrowsers) ownedBrowsers = await launchOwnedBrowsers(browserOptions);
      process.stdout.write(`[${index + 1}/${rows.length}] ${item.id}\n`);
      const contextOptions = { viewport: { width: item.width, height: item.height }, deviceScaleFactor: 1, locale: "en-CA", colorScheme: item.mode };
      const reference = await captureStableSide(ownedBrowsers.browsers[0], ownedBrowsers.browsers[1], contextOptions, server.url, item, "reference");
      const implementation = await captureStableSide(ownedBrowsers.browsers[0], ownedBrowsers.browsers[1], contextOptions, server.url, item, "implementation");
      const effectBounds = implementation.effectBounds;
      const comparisonMode = item.comparisonMode;
      const comparison = await compare(reference.image, implementation.image, comparisonMode === "source-effect-components" ? effectBounds : []);
      if (diagnosticRoot && comparisonMode === "strict-full" && comparison.raw.changed > 0) {
        await writeCaptureDiagnostic(item, "reference-implementation-parity", reference.image, implementation.image);
      }
      const assertions = Object.assign({}, reference.assertions, implementation.assertions);
      const unavailableInventory = careInventoryResult(item, effectBounds);
      const metricsEqual = JSON.stringify(reference.metrics) === JSON.stringify(implementation.metrics);
      const metricDifferences = metricDelta(reference.metrics, implementation.metrics);
      const metricDeltaDisposition = classifyUnavailableMetricDelta(item, metricDifferences, implementation.metrics, effectBounds);
      const result = {
        ...item,
        comparisonMode,
        reference: reference.meta,
        implementation: implementation.meta,
        raw: withoutDiff(comparison.raw),
        accepted: withoutDiff(comparison.masked),
        effectBounds,
        unavailableInventory,
        changedComponents: comparison.components,
        unassociatedComponents: comparison.unassociatedComponents,
        assertions,
        dimensions: comparison.dimensions,
        metricsEqual,
        metricDelta: metricDifferences,
        metricDeltaDisposition,
      };
      const freshImages = {
        reference: reference.image,
        implementation: implementation.image,
        diff: comparison.raw.diff,
        componentDiff: comparisonMode === "source-effect-components" ? comparison.masked.diff : null,
      };
      if (update) result.persistedImages = await writePersistedImages(item, freshImages);
      else if (verify || diagnosticRoot) result.persistedImages = await inspectPersistedImages(path.join(outputRoot, item.id), freshImages, item);
      if (update || verify || diagnosticRoot) result.persistedImagesVerified = true;
      result.passed = rowPassed(result);
      if (update) await fs.writeFile(path.join(outputRoot, item.id, "metrics.json"), JSON.stringify(result, null, 2) + "\n");
      results.push(result);
      if ((index + 1) % browserRowBatchSize === 0 || index + 1 === rows.length) {
        const completedBatch = ownedBrowsers;
        ownedBrowsers = null;
        await closeBrowsers(completedBatch.browsers, completedBatch.processIds);
      }
    }
  } finally {
    if (ownedBrowsers) await closeOwnedResources(ownedBrowsers, server);
    else await server.close();
  }

  const summary = {
    schemaVersion: 7,
    designBaseline: "c9879ae",
    activationAddendum: {
      stage: "S5 remediation cycle 1",
      priorPacket: "schema v6 remains the accepted pre-activation history in evidence/S4.md and git history",
      rule: "Only exact implementation-owned unavailable control effects are excluded; raw metrics and source captures remain retained",
    },
    browserLifecycle: { rowBatchSize: browserRowBatchSize, ownedBrowsersPerBatch: 2, gracefulCloseRequired: true },
    comparison: { pixelmatchThreshold: 0, alpha: 1, includeAA: true, strictTarget: "zero", modes: ["strict-full", "source-effect-components", "contract-state"] },
    matrixRows: results.length,
    expectedMatrixRows: onlyIds.length || (smoke ? 4 : matrix.length),
    modeCounts: Object.fromEntries(["strict-full", "source-effect-components", "contract-state"].map((mode) => [mode, results.filter((item) => item.comparisonMode === mode).length])),
    rawMaxChanged: Math.max(...results.map((item) => item.raw.changed)),
    rawMaxChangedPct: Math.max(...results.map((item) => item.raw.changedPct)),
    rawMaxRms: Math.max(...results.map((item) => item.raw.rms)),
    acceptedMaxChanged: Math.max(...results.filter((item) => item.comparisonMode !== "contract-state").map((item) => item.accepted.changed)),
    acceptedMaxChangedPct: Math.max(...results.filter((item) => item.comparisonMode !== "contract-state").map((item) => item.accepted.changedPct)),
    acceptedMaxRms: Math.max(...results.filter((item) => item.comparisonMode !== "contract-state").map((item) => item.accepted.rms)),
    failures: results.filter((item) => !item.passed).map((item) => item.id),
    rows: results,
  };
  if (update) {
    await fs.writeFile(path.join(outputRoot, "metrics.json"), JSON.stringify(summary, null, 2) + "\n");
    await fs.writeFile(path.join(outputRoot, "index.md"), renderIndex(summary));
  }
  if (verify) {
    const stored = JSON.parse(await fs.readFile(path.join(outputRoot, "metrics.json"), "utf8"));
    assert.deepEqual(canonicalVisualPacket(summary), canonicalVisualPacket(stored), "--verify captures and canonical aggregate metrics match the stored packet");
    for (const row of summary.rows) {
      const storedRow = JSON.parse(await fs.readFile(path.join(outputRoot, row.id, "metrics.json"), "utf8"));
      assert.deepEqual(canonicalVisualPacket(row), canonicalVisualPacket(storedRow), `--verify ${row.id} metrics, assertions, and image SHA values match`);
    }
    assert.equal(await hashTree(outputRoot), verifyTreeBefore, "--verify leaves artifact bytes and mtimes unchanged");
  }
  process.stdout.write(JSON.stringify({ matrixRows: summary.matrixRows, modeCounts: summary.modeCounts, rawMaxChanged: summary.rawMaxChanged, rawMaxChangedPct: summary.rawMaxChangedPct, rawMaxRms: summary.rawMaxRms, acceptedMaxChanged: summary.acceptedMaxChanged, acceptedMaxChangedPct: summary.acceptedMaxChangedPct, acceptedMaxRms: summary.acceptedMaxRms, failures: summary.failures }, null, 2) + "\n");
  assert.deepEqual(summary.failures, [], "all selected S4 rows pass");
}

function directChromeChildren() {
  const rows = execFileSync("/bin/ps", ["-axo", "ppid=,pid=,command="], { encoding: "utf8" }).split("\n");
  return rows.map((row) => row.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/)).filter(Boolean)
    .filter((match) => Number(match[1]) === process.pid && match[3].includes(executablePath))
    .map((match) => Number(match[2]));
}

async function launchOwnedBrowsers(browserOptions) {
  assert.deepEqual(directChromeChildren(), [], "visual harness starts without an inherited direct Chrome process");
  const browsers = [];
  try {
    browsers.push(await chromium.launch(browserOptions));
    browsers.push(await chromium.launch(browserOptions));
    const processIds = directChromeChildren();
    assert.equal(processIds.length, browsers.length, "visual harness owns exactly two direct Chrome browser processes");
    return { browsers, processIds };
  } catch (error) {
    const processIds = directChromeChildren();
    if (browsers.length || processIds.length) {
      try {
        await closeBrowsers(browsers, processIds);
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "browser launch and partial cleanup failed");
      }
    }
    throw error;
  }
}

async function closeOwnedResources(ownedBrowsers, server) {
  const failures = [];
  try {
    await closeBrowsers(ownedBrowsers.browsers, ownedBrowsers.processIds);
  } catch (error) {
    failures.push(error);
  }
  try {
    await server.close();
  } catch (error) {
    failures.push(error);
  }
  if (failures.length) throw new AggregateError(failures, "S4 owned resource cleanup failed");
}

async function closeBrowsers(browsers, processIds) {
  const closeFailures = [];
  for (const [index, browser] of browsers.entries()) {
    try {
      await withTimeout(browser.close(), browserGracefulCloseTimeoutMs, `browser ${index + 1} graceful close`);
    } catch (error) {
      closeFailures.push(error);
    }
  }

  let remaining = await waitForPidsAbsent(processIds, 3000);
  if (remaining.length) {
    for (const processId of remaining) signalOwnedPid(processId, "SIGTERM");
    remaining = await waitForPidsAbsent(remaining, 2000);
  }
  if (remaining.length) {
    for (const processId of remaining) signalOwnedPid(processId, "SIGKILL");
    remaining = await waitForPidsAbsent(remaining, 2000);
  }
  for (const browser of browsers) {
    if (browser.isConnected()) browser._connection.close();
  }
  assert.deepEqual(remaining, [], `all owned Chrome PIDs are absent after cleanup: ${processIds.join(",")}`);
  if (closeFailures.length) throw new AggregateError(closeFailures, "browser graceful close timed out or failed");
}

function signalOwnedPid(processId, signal) {
  try {
    process.kill(processId, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

function pidAlive(processId) {
  try {
    process.kill(processId, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

async function waitForPidsAbsent(processIds, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let remaining = processIds.filter(pidAlive);
  while (remaining.length && Date.now() < deadline) {
    await delay(50);
    remaining = processIds.filter(pidAlive);
  }
  return remaining;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withTimeout(promise, timeoutMs, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function captureStableSide(firstBrowser, secondBrowser, contextOptions, baseUrl, item, side) {
  const [firstWarmup, secondWarmup] = await Promise.all([
    captureFreshContext(firstBrowser, contextOptions, baseUrl, item, side),
    captureFreshContext(secondBrowser, contextOptions, baseUrl, item, side),
  ]);
  const failedRounds = [];
  for (let round = 1; round <= maxStableCaptureRounds; round += 1) {
    const [first, second] = await Promise.all([
      captureFreshContext(firstBrowser, contextOptions, baseUrl, item, side),
      captureFreshContext(secondBrowser, contextOptions, baseUrl, item, side),
    ]);
    const firstSha256 = sha(first.image);
    const secondSha256 = sha(second.image);
    const pixelsExact = firstSha256 === secondSha256;
    const metricsExact = JSON.stringify(first.metrics) === JSON.stringify(second.metrics);
    if (pixelsExact && metricsExact) {
      assert.deepEqual(first.metrics, second.metrics, `${side} ${item.id} independent capture DOM metrics match`);
      second.meta.captureStability = {
        method: "dual-browser-phase-normalized-ready-contexts",
        warmupSha256: [sha(firstWarmup.image), sha(secondWarmup.image)],
        firstSha256,
        secondSha256,
        twoCapturePixelsStable: true,
      };
      if (failedRounds.length) {
        process.stdout.write(`[capture-stable] ${item.id} ${side} acceptedRound=${round} failedRounds=${failedRounds.length}\n`);
      }
      return second;
    }
    const diagnostic = { round, firstSha256, secondSha256, pixelsExact, metricsExact };
    failedRounds.push(diagnostic);
    process.stdout.write(`[capture-retry] ${item.id} ${side} round=${round}/${maxStableCaptureRounds} pixelsExact=${pixelsExact} metricsExact=${metricsExact}\n`);
    await writeCaptureDiagnostic(item, `${side}-unstable-capture-round-${round}`, first.image, second.image, diagnostic);
  }
  assert.fail(`${side} ${item.id} did not produce an exact independent capture pair in ${maxStableCaptureRounds} rounds: ${JSON.stringify(failedRounds)}`);
}

async function captureFreshContext(browser, contextOptions, baseUrl, item, side) {
  const context = await browser.newContext(contextOptions);
  try {
    return await capture(context, baseUrl, item, side);
  } finally {
    await context.close();
  }
}

async function capture(context, baseUrl, item, side) {
  const page = await context.newPage();
  const failures = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const source = message.location().url;
    if (!source || new URL(source).origin === new URL(baseUrl).origin) failures.push(`console:${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`page:${error.message}`));
  page.on("requestfailed", (request) => { if (new URL(request.url()).origin === new URL(baseUrl).origin) failures.push(`request:${request.url()}:${request.failure()?.errorText || "failed"}`); });
  await page.route("https://**/*", (route) => route.abort());
  const slugName = verticalSlug(item.vertical);
  if (side === "implementation") {
    await page.addInitScript(({ slugName, mode, disabled }) => {
      document.addEventListener("DOMContentLoaded", () => {
        const root = document.getElementById("app");
        root.dataset.portalVertical = slugName;
        root.dataset.portalTheme = slugName;
        root.dataset.portalProfile = ["health", "beauty"].includes(slugName) ? "appointments" : slugName === "hvac" ? "onDemand" : "stormOps";
        root.dataset.portalDefaultMode = mode;
        if (disabled) root.dataset.portalEnabledModules = "orders,calendar,activity,services,pricing,products,checkout,profile,support";
      }, { once: true });
    }, { slugName, mode: item.mode, disabled: item.state === "disabled" });
  } else {
    await page.addInitScript(() => { window.__initialRoute = "orders.list"; });
  }
  const entry = side === "reference" ? "design-inbox/source.html" : "runtime/source.html";
  await page.goto(`${baseUrl}/${entry}${side === "implementation" ? "#/care" : ""}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.AircovePortal && document.querySelector(".app-shell"));
  await page.addStyleTag({ content: freezeCss });
  await setup(page, item, side);
  await page.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; });
  await page.mouse.move(1, 1);
  await page.mouse.move(0, 0);
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await waitForDeterministicReadiness(page, item);
  const prepaint = await prepaintDocument(page);
  const readiness = Object.assign(await waitForDeterministicReadiness(page, item), prepaint);
  assert.deepEqual(failures, [], `${side} failures for ${item.id}`);
  const metrics = await collectMetrics(page, item.surface);
  const effectBounds = side === "implementation" ? await collectUnavailableEffects(page) : [];
  const assertions = await collectAssertions(page, item, side);
  const image = await page.screenshot({ fullPage: true, type: "png" });
  const meta = { url: normalizedPageUrl(page.url()), sha256: sha(image), failures, metrics, readiness, captureViewport: page.viewportSize() };
  await page.close();
  return { image, metrics, effectBounds, assertions, meta };
}

async function waitForDeterministicReadiness(page, item) {
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForFunction(({ routeName }) => {
    if (document.fonts.status !== "loaded") return false;
    if (Array.from(document.images).some((image) => !image.complete)) return false;
    if (document.querySelector(".seo-svc:hover")) return false;
    const shell = document.querySelector(".app-shell");
    const route = document.querySelector(`[data-route='${routeName}']`);
    if (!shell || !route) return false;
    const rect = route.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && document.documentElement.scrollWidth > 0 && document.documentElement.scrollHeight > 0;
  }, { routeName: item.surface === "care" ? "care" : "seo.landing" });

  const signatures = await page.evaluate(async () => {
    function snapshot() {
      const route = document.querySelector("[data-route='care'], [data-route='seo.landing']");
      const elements = Array.from(document.querySelectorAll(".app-shell, [data-route], [data-module], h1, h2, button, a"));
      return JSON.stringify({
        fonts: Array.from(document.fonts).map((font) => [font.family, font.weight, font.status]).sort(),
        root: [document.documentElement.className, document.body.className, document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        route: route ? [route.getAttribute("data-route"), route.getAttribute("data-state"), route.getBoundingClientRect().width, route.getBoundingClientRect().height] : null,
        boxes: elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return [element.getAttribute("data-module") || element.tagName, rect.x, rect.y, rect.width, rect.height, getComputedStyle(element).fontFamily];
        }),
      });
    }
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    let first = null;
    let second = null;
    let framesObserved = 0;
    for (let frameIndex = 0; frameIndex < 120; frameIndex += 1) {
      await frame();
      framesObserved += 1;
      const current = snapshot();
      if (current === first) { second = current; break; }
      first = current;
    }
    return { first, second, framesObserved, fontsStatus: document.fonts.status, fontCount: Array.from(document.fonts).length };
  });
  assert.equal(signatures.first, signatures.second, `${item.id} layout and fonts are stable across two animation frames`);
  return { fontsStatus: signatures.fontsStatus, fontCount: signatures.fontCount, framesObserved: signatures.framesObserved, twoFrameLayoutStable: true };
}

async function prepaintDocument(page) {
  const result = await page.evaluate(async () => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const viewportHeight = window.innerHeight;
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const positions = [];
    for (let y = 0; y < documentHeight; y += viewportHeight) {
      const target = Math.min(y, Math.max(0, documentHeight - viewportHeight));
      window.scrollTo(0, target);
      await frame();
      positions.push(window.scrollY);
    }
    window.scrollTo(0, 0);
    await frame();
    return { prepaintSegments: positions.length, prepaintPositions: positions, prepaintReturnedToOrigin: window.scrollX === 0 && window.scrollY === 0 };
  });
  assert.equal(result.prepaintReturnedToOrigin, true, "deterministic prepaint returns to the capture origin");
  return result;
}

async function setup(page, item, side) {
  await page.evaluate(async ({ item, side }) => {
    const portal = window.AircovePortal;
    if (side === "reference") {
      portal.setState({
        route: item.surface === "care" ? "care" : "seo.landing",
        theme: item.vertical,
        mode: item.mode === "dark" ? "Dark" : "Light",
        view: item.referenceState,
        vw: "full",
        mobileNav: item.variant === "mobile-nav",
        seoFaqOpen: null,
        seoCtaForce: item.variant.startsWith("cta-") ? item.variant.slice(4) : null,
      });
    } else {
      portal.state.mode = item.mode === "dark" ? "Dark" : "Light";
      portal.state.userModeOverridden = true;
      portal.state.route = item.surface === "care" ? "care" : "seo.landing";
      if (item.surface === "care") {
        await portal.runtime().loadAsync("care").catch(() => null);
        if (["loading", "error", "unauthorized"].includes(item.state)) {
          portal.state.access.care = {
            status: item.state === "loading" ? "checking" : item.state === "error" ? "error" : "not-entitled",
            reasonCode: item.state,
          };
          portal.runtime().syncPreflight("care");
        } else if (item.state === "empty") {
          const current = portal.state.moduleData.care;
          portal.state.moduleData.care = { ...current, content: null, state: "empty" };
        }
      }
      const ctaState = item.variant.startsWith("cta-") ? item.variant.slice(4) : null;
      portal.setState({
        view: item.surface === "seo" ? item.state : "ready",
        mobileNav: item.variant === "mobile-nav",
        seoFaqOpenId: item.variant === "faq-open" ? "faq-0" : null,
        seoCtaStates: ctaState ? {
          "seo.cta.book": ctaState, "seo.cta.quote": ctaState,
          "seo.cta.call": ctaState, "seo.cta.services": ctaState,
        } : {},
      });
    }
  }, { item, side });
  await page.waitForFunction(({ surface, state }) => {
    const route = document.querySelector(`[data-route='${surface === "care" ? "care" : "seo.landing"}']`);
    if (!route) return false;
    return surface !== "care" || state !== "ready" || route.getAttribute("data-state") === "ready";
  }, { surface: item.surface, state: item.state });
  if (item.variant === "faq-open") {
    await page.locator("[data-action='seo.faq.toggle']").first().click();
    await page.waitForSelector(".seo-faq__item.is-open");
  }
  if (item.variant === "selected-service") {
    await page.locator("[data-action='seo.service.select']").first().click();
    if (side === "reference") await page.waitForSelector('[data-state="drawer-open"]');
    else await page.waitForSelector(".seo-svc.is-selected");
  }
}

async function collectMetrics(page, surface) {
  const selectors = surface === "care" ? {
    shell: ".app-shell", topNav: ".top-nav", page: "[data-route='care']", title: ".page-title", subtitle: ".page-sub", grid: ".care-grid", firstCard: "[data-route='care'] .card", primaryAction: "[data-route='care'] .btn--primary", mobileNav: ".mobile-nav-popover",
  } : {
    shell: ".app-shell", page: "[data-route='seo.landing']", hero: ".seo-hero", heroInner: ".seo-hero__inner", title: ".seo-hero__title", services: ".seo-svc-grid", service: ".seo-svc", faq: ".seo-faq", faqItem: ".seo-faq__item", primaryAction: ".seo-hero .btn--primary",
  };
  return page.evaluate((selectors) => Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
    const element = document.querySelector(selector);
    if (!element) return [name, null];
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const round = (value) => Math.round(value * 100) / 100;
    return [name, { x: round(rect.x), y: round(rect.y), width: round(rect.width), height: round(rect.height), fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, lineHeight: style.lineHeight, color: style.color, background: style.backgroundColor, border: style.border, borderRadius: style.borderRadius, display: style.display, gridTemplateColumns: style.gridTemplateColumns }];
  })), selectors);
}

async function collectUnavailableEffects(page) {
  return page.locator('[data-route="care"] [data-state="unavailable"]').evaluateAll((nodes) => nodes.map((node, index) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const boxShadow = style.boxShadow;
    const shadows = splitShadows(boxShadow).map(parseShadow).filter(Boolean);
    const extensions = shadows.reduce((result, shadow) => {
      if (shadow.inset) return result;
      const radius = Math.max(0, shadow.blurKernelExtent + shadow.spread);
      result.left = Math.max(result.left, Math.max(0, radius - shadow.offsetX));
      result.right = Math.max(result.right, Math.max(0, radius + shadow.offsetX));
      result.top = Math.max(result.top, Math.max(0, radius - shadow.offsetY));
      result.bottom = Math.max(result.bottom, Math.max(0, radius + shadow.offsetY));
      return result;
    }, { left: 0, right: 0, top: 0, bottom: 0 });
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const borderBox = {
      x: Math.floor(rect.x + window.scrollX), y: Math.floor(rect.y + window.scrollY),
      width: Math.ceil(rect.width), height: Math.ceil(rect.height),
    };
    const left = Math.max(0, Math.floor(borderBox.x - extensions.left));
    const top = Math.max(0, Math.floor(borderBox.y - extensions.top));
    const right = Math.min(documentWidth, Math.ceil(borderBox.x + borderBox.width + extensions.right));
    const bottom = Math.min(documentHeight, Math.ceil(borderBox.y + borderBox.height + extensions.bottom));
    return {
      controlIndex: index,
      selector: '[data-route="care"] [data-state="unavailable"]',
      reason: "S5 truthful unavailable treatment is implementation-owned and absent from the accepted design",
      action: node.getAttribute("data-action"),
      entityId: node.getAttribute("data-id"),
      disabled: node.hasAttribute("disabled"),
      ariaDisabled: node.getAttribute("aria-disabled"),
      truthfulUnavailable: node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true",
      derivation: { borderBox, computedBoxShadow: boxShadow, blurKernelFormula: "ceil(1.5 * blur) + spread", shadows, extensions, clip: { width: documentWidth, height: documentHeight } },
      x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top),
    };

    function splitShadows(value) {
      if (!value || value === "none") return [];
      const parts = [];
      let depth = 0, start = 0;
      for (let i = 0; i < value.length; i += 1) {
        if (value[i] === "(") depth += 1;
        else if (value[i] === ")") depth -= 1;
        else if (value[i] === "," && depth === 0) { parts.push(value.slice(start, i).trim()); start = i + 1; }
      }
      parts.push(value.slice(start).trim());
      return parts;
    }
    function parseShadow(value) {
      const lengths = (value.match(/-?(?:\d+\.?\d*|\.\d+)px/g) || []).map((length) => Number.parseFloat(length));
      if (lengths.length < 2) return null;
      const blur = Math.max(0, lengths[2] || 0);
      return { source: value, inset: /\binset\b/.test(value), offsetX: lengths[0], offsetY: lengths[1], blur, spread: lengths[3] || 0, blurKernelExtent: Math.ceil(blur * 1.5) };
    }
  }));
}

async function collectAssertions(page, item, side) {
  return page.evaluate(({ item, side }) => {
    const assertions = {};
    if (side === "implementation" && item.surface === "care" && ["Health", "Beauty"].includes(item.vertical)) {
      const activity = document.querySelector('[data-module="activity-control"]');
      assertions.activityControlNonDispatching = Boolean(activity && activity.getAttribute("aria-disabled") === "true" && !activity.hasAttribute("data-action") && !activity.hasAttribute("title"));
    }
    if (side === "implementation" && item.surface === "care" && item.state === "ready") {
      const unavailable = Array.from(document.querySelectorAll('[data-route="care"] [data-state="unavailable"]'));
      assertions.unavailableControlsTruthful = unavailable.every((node) => node.getAttribute("aria-disabled") === "true" || node.hasAttribute("disabled"));
      assertions.unavailableControlCount = unavailable.length;
    }
    if (item.variant === "selected-service") {
      if (side === "reference") assertions.referenceActionOpenedDrawer = Boolean(document.querySelector('[data-state="drawer-open"]'));
      else {
        assertions.runtimeActionSelectedService = Boolean(document.querySelector(".seo-svc.is-selected"));
        assertions.runtimeSelectionReadback = Boolean(document.querySelector('[data-seo-selection][data-state="selected"]'));
      }
    }
    if (item.state === "disabled") {
      assertions[item.surface + (side === "implementation" ? "RuntimeDisabled" : "ReferenceUnauthorized")] = side === "implementation"
        ? document.querySelector('[data-route="care"]')?.getAttribute("data-state") === "disabled"
        : document.querySelector('[data-route="care"]')?.getAttribute("data-state") === "unauthorized";
    }
    if (item.variant === "missing-media") assertions.missingMediaHasExplicitSlot = Boolean(document.querySelector('.seo-hero__media[data-state="no-data"]'));
    if (item.variant === "source-long-content") {
      const title = document.querySelector(".seo-hero__title");
      const rect = title && title.getBoundingClientRect();
      const lineHeight = title ? parseFloat(getComputedStyle(title).lineHeight) : 0;
      assertions.sourceLongTitleWraps = Boolean(rect && lineHeight && rect.height >= lineHeight * 1.8);
      assertions.sourceLongTitleFits = Boolean(title && title.scrollWidth <= title.clientWidth && title.scrollHeight <= title.clientHeight + 1);
    }
    if (item.variant === "faq-open") assertions.faqOpenedThroughAction = Boolean(document.querySelector(".seo-faq__item.is-open"));
    if (item.variant.startsWith("cta-")) {
      const expected = item.variant.slice(4);
      assertions.ctaStateRendered = Array.from(document.querySelectorAll(".seo-cta")).every((node) => node.getAttribute("data-state") === expected);
    }
    return assertions;
  }, { item, side });
}

async function compare(referenceBuffer, implementationBuffer, effectBounds) {
  const reference = PNG.sync.read(referenceBuffer);
  const implementation = PNG.sync.read(implementationBuffer);
  const width = Math.max(reference.width, implementation.width);
  const height = Math.max(reference.height, implementation.height);
  const left = pad(reference, width, height);
  const right = pad(implementation, width, height);
  const raw = pixelMetrics(left, right, width, height);
  if (!effectBounds.length) return { raw, masked: raw, components: [], unassociatedComponents: [], dimensions: { width, height, referenceHeight: reference.height, implementationHeight: implementation.height } };
  const componentData = changedComponents(left, right, width, height, effectBounds);
  const maskedRight = PNG.sync.read(PNG.sync.write(right));
  for (const component of componentData.internal) {
    if (!component.controlIndexes.length) continue;
    for (const pixelIndex of component.pixels) {
      const offset = pixelIndex * 4;
      for (let channel = 0; channel < 4; channel += 1) maskedRight.data[offset + channel] = left.data[offset + channel];
    }
  }
  const masked = pixelMetrics(left, maskedRight, width, height);
  return {
    raw,
    masked,
    components: componentData.summaries,
    unassociatedComponents: componentData.summaries.filter((component) => !component.controlIndexes.length),
    dimensions: { width, height, referenceHeight: reference.height, implementationHeight: implementation.height },
  };
}

function changedComponents(left, right, width, height, effectBounds) {
  const size = width * height;
  const changed = new Uint8Array(size);
  const visited = new Uint8Array(size);
  for (let pixel = 0; pixel < size; pixel += 1) {
    const offset = pixel * 4;
    if (left.data[offset] !== right.data[offset] || left.data[offset + 1] !== right.data[offset + 1] || left.data[offset + 2] !== right.data[offset + 2] || left.data[offset + 3] !== right.data[offset + 3]) changed[pixel] = 1;
  }
  const internal = [];
  const directions = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  for (let start = 0; start < size; start += 1) {
    if (!changed[start] || visited[start]) continue;
    const queue = [start];
    const pixels = [];
    visited[start] = 1;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const pixel = queue[cursor];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      pixels.push(pixel);
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      for (const [dx, dy] of directions) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const next = ny * width + nx;
        if (changed[next] && !visited[next]) { visited[next] = 1; queue.push(next); }
      }
    }
    const component = { pixels, x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    component.effectAssociations = effectAssociations(component, effectBounds, width);
    component.controlIndexes = component.effectAssociations.filter((association) => association.associated).map((association) => association.controlIndex);
    internal.push(component);
  }
  const summaries = internal.map(function (component, index) {
    return {
      componentIndex: index,
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      changedPixels: component.pixels.length,
      controlIndexes: component.controlIndexes,
      fullyContainedInEffectEnvelope: component.controlIndexes.length > 0,
      intersectsOwningControlBorderBox: component.controlIndexes.length > 0,
      effectAssociations: component.effectAssociations,
      controls: component.controlIndexes.map(function (controlIndex) { return effectBounds[controlIndex]; }),
    };
  });
  return { internal, summaries };
}

function effectAssociations(component, effectBounds, imageWidth) {
  const componentRight = component.x + component.width;
  const componentBottom = component.y + component.height;
  return effectBounds.map(function (bound, index) {
    const fullyContainedInEffectEnvelope = component.x >= bound.x && component.y >= bound.y && componentRight <= bound.x + bound.width && componentBottom <= bound.y + bound.height;
    const borderBox = bound.derivation.borderBox;
    const intersectsOwningControlBorderBox = component.pixels.some(function (pixelIndex) {
      const x = pixelIndex % imageWidth;
      const y = Math.floor(pixelIndex / imageWidth);
      return x >= borderBox.x && y >= borderBox.y && x < borderBox.x + borderBox.width && y < borderBox.y + borderBox.height;
    });
    return { controlIndex: index, fullyContainedInEffectEnvelope, intersectsOwningControlBorderBox, associated: fullyContainedInEffectEnvelope && intersectsOwningControlBorderBox };
  });
}

function pixelMetrics(left, right, width, height) {
  const diff = new PNG({ width, height });
  const changed = pixelmatch(left.data, right.data, diff.data, width, height, { threshold: 0, alpha: 1, includeAA: true, diffColor: [255, 0, 80], aaColor: [255, 190, 0] });
  let squared = 0;
  for (let i = 0; i < left.data.length; i += 4) {
    for (let channel = 0; channel < 3; channel += 1) { const delta = left.data[i + channel] - right.data[i + channel]; squared += delta * delta; }
  }
  return { changed, changedPct: changed / (width * height) * 100, rms: Math.sqrt(squared / (width * height * 3)), diff: PNG.sync.write(diff) };
}

function withoutDiff(metrics) {
  return { changed: metrics.changed, changedPct: metrics.changedPct, rms: metrics.rms };
}

function pad(image, width, height) {
  if (image.width === width && image.height === height) return image;
  const result = new PNG({ width, height, fill: true });
  PNG.bitblt(image, result, 0, 0, image.width, image.height, 0, 0);
  return result;
}

function metricDelta(left, right) {
  const delta = {};
  for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
    if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) delta[key] = { reference: left[key], implementation: right[key] };
  }
  return delta;
}

function classifyUnavailableMetricDelta(item, differences, implementationMetrics, effectBounds) {
  const fields = Object.keys(differences);
  if (!fields.length) return { applies: false, fields: [], exactUnavailableControlBounds: true };
  if (item.comparisonMode !== "source-effect-components") return { applies: false, fields, exactUnavailableControlBounds: false };
  const exactUnavailableControlBounds = fields.every(function (field) {
    const metric = implementationMetrics[field];
    if (!metric) return false;
    return effectBounds.some(function (bound) {
      const box = bound.derivation.borderBox;
      return Math.abs(metric.x - box.x) <= 1 && Math.abs(metric.y - box.y) <= 1 && Math.abs(metric.width - box.width) <= 1 && Math.abs(metric.height - box.height) <= 1;
    });
  });
  return { applies: true, fields, exactUnavailableControlBounds };
}

function careInventoryResult(item, effectBounds) {
  const applies = item.surface === "care" && item.state === "ready";
  const expectedPairs = applies ? CARE_UNAVAILABLE_INVENTORY[item.vertical] || [] : [];
  const canonical = (pairs) => pairs.map(function (pair) {
    return Array.isArray(pair) ? { action: pair[0], entityId: pair[1] } : { action: pair.action, entityId: pair.entityId };
  }).sort(function (left, right) { return (left.action + "\0" + left.entityId).localeCompare(right.action + "\0" + right.entityId); });
  const expected = canonical(expectedPairs);
  const actual = canonical(effectBounds);
  const expectedMode = expected.length ? "source-effect-components" : "strict-full";
  return {
    applies,
    expected,
    actual,
    expectedCount: expected.length,
    actualCount: actual.length,
    truthfulCount: effectBounds.filter(function (bound) { return bound.truthfulUnavailable; }).length,
    exactMatch: JSON.stringify(expected) === JSON.stringify(actual),
    countMatch: expected.length === actual.length,
    allTruthful: effectBounds.every(function (bound) { return bound.truthfulUnavailable; }),
    expectedMode,
    modeMatch: !applies || item.comparisonMode === expectedMode,
  };
}

function canonicalVisualPacket(value) {
  const canonical = structuredClone(value);
  const rows = Array.isArray(canonical.rows) ? canonical.rows : [canonical];
  for (const row of rows) {
    for (const side of ["reference", "implementation"]) {
      const stability = row && row[side] && row[side].captureStability;
      if (stability && Object.prototype.hasOwnProperty.call(stability, "warmupSha256")) delete stability.warmupSha256;
    }
  }
  return canonical;
}

async function runSelfTests() {
  const imageWidth = 100;
  const envelope = [{ x: 10, y: 10, width: 20, height: 20, derivation: { borderBox: { x: 15, y: 15, width: 10, height: 10 } } }];
  const indexes = (component) => effectAssociations(component, envelope, imageWidth).filter((association) => association.associated).map((association) => association.controlIndex);
  assert.deepEqual(indexes(componentFromPoints([[16, 16], [17, 17]], imageWidth)), [0], "contained component intersecting the owning border box is associated");
  assert.deepEqual(indexes(componentFromPoints([[15, 15], [34, 15]], imageWidth)), [], "thin changed path extending beyond envelope is rejected");
  assert.deepEqual(indexes(componentFromPoints([[31, 14], [32, 15]], imageWidth)), [], "adjacent unrelated changed patch is rejected");
  const isolated = effectAssociations(componentFromPoints([[11, 11], [12, 12]], imageWidth), envelope, imageWidth)[0];
  assert.equal(isolated.fullyContainedInEffectEnvelope, true, "isolated patch is inside the visual-effect envelope");
  assert.equal(isolated.intersectsOwningControlBorderBox, false, "isolated patch outside the owning border box is rejected");
  assert.equal(isolated.associated, false, "envelope-only containment cannot associate a component");
  const missing = careInventoryResult({ surface: "care", state: "ready", vertical: "HVAC", comparisonMode: "source-effect-components" }, []);
  assert.equal(missing.exactMatch || missing.countMatch, false, "missing required Care unavailable controls fail inventory self-test");
  assert.equal(missing.expectedCount, 3, "negative inventory self-test retains expected count");
  canonicalPacketSelfTest();
  await assert.rejects(() => decodedPixels(Buffer.from("corrupt-webp")), "corrupt persisted image is rejected before verification");
  await cleanupProcessSelfTest();
}

function canonicalPacketSelfTest() {
  const baseline = {
    comparison: { pixelmatchThreshold: 0, alpha: 1, includeAA: true, modes: ["strict-full", "source-effect-components", "contract-state"] },
    failures: [],
    rows: [{
      id: "self-test-row",
      comparisonMode: "strict-full",
      reference: {
        metrics: { title: { x: 1, y: 2, width: 3, height: 4 } },
        captureStability: { warmupSha256: ["warm-a", "warm-b"], firstSha256: "final-reference", secondSha256: "final-reference", twoCapturePixelsStable: true },
      },
      implementation: {
        metrics: { title: { x: 1, y: 2, width: 3, height: 4 } },
        captureStability: { warmupSha256: ["warm-c", "warm-d"], firstSha256: "final-implementation", secondSha256: "final-implementation", twoCapturePixelsStable: true },
      },
      raw: { changed: 0, changedPct: 0, rms: 0 },
      accepted: { changed: 0, changedPct: 0, rms: 0 },
      unavailableInventory: { expected: [], actual: [], exactMatch: true },
      persistedImages: { reference: { sha256: "encoded", decodedPixelSha256: "decoded" } },
    }],
  };
  const changedWarmup = structuredClone(baseline);
  changedWarmup.rows[0].reference.captureStability.warmupSha256 = ["jitter-a", "jitter-b"];
  changedWarmup.rows[0].implementation.captureStability.warmupSha256 = ["jitter-c", "jitter-d"];
  assert.deepEqual(canonicalVisualPacket(changedWarmup), canonicalVisualPacket(baseline), "canonical packet ignores only noncanonical warmup capture hashes");

  const protectedMutations = [
    ["first final hash", (value) => { value.rows[0].reference.captureStability.firstSha256 = "changed"; }],
    ["second final hash", (value) => { value.rows[0].implementation.captureStability.secondSha256 = "changed"; }],
    ["DOM metrics", (value) => { value.rows[0].reference.metrics.title.x = 99; }],
    ["raw pixel metrics", (value) => { value.rows[0].raw.changed = 1; }],
    ["accepted pixel metrics", (value) => { value.rows[0].accepted.rms = 1; }],
    ["failures", (value) => { value.failures.push("self-test-row"); }],
    ["pixel threshold", (value) => { value.comparison.pixelmatchThreshold = 0.01; }],
    ["comparison modes", (value) => { value.comparison.modes.pop(); }],
    ["row comparison mode", (value) => { value.rows[0].comparisonMode = "contract-state"; }],
    ["unavailable inventory", (value) => { value.rows[0].unavailableInventory.actual.push({ action: "changed" }); }],
    ["persisted encoded hash", (value) => { value.rows[0].persistedImages.reference.sha256 = "changed"; }],
    ["persisted decoded hash", (value) => { value.rows[0].persistedImages.reference.decodedPixelSha256 = "changed"; }],
  ];
  for (const [label, mutate] of protectedMutations) {
    const candidate = structuredClone(baseline);
    mutate(candidate);
    assert.notDeepEqual(canonicalVisualPacket(candidate), canonicalVisualPacket(baseline), `canonical packet preserves ${label}`);
  }
}

function componentFromPoints(points, imageWidth) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    pixels: points.map(([x, y]) => y * imageWidth + x),
    x: Math.min(...xs), y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs) + 1,
    height: Math.max(...ys) - Math.min(...ys) + 1,
  };
}

async function cleanupProcessSelfTest() {
  const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
  await withTimeout(new Promise((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", reject);
  }), 2000, "cleanup self-test child spawn");
  const processId = child.pid;
  assert(pidAlive(processId), "cleanup self-test owns a live disposable child");
  signalOwnedPid(processId, "SIGTERM");
  const remaining = await waitForPidsAbsent([processId], 2000);
  if (remaining.length) signalOwnedPid(processId, "SIGKILL");
  assert.deepEqual(await waitForPidsAbsent([processId], 2000), [], "cleanup self-test reaps its owned disposable child");
}

function rowPassed(result) {
  const booleanAssertions = Object.values(result.assertions).filter((value) => typeof value === "boolean");
  if (booleanAssertions.some((value) => value !== true)) return false;
  if (result.unavailableInventory.applies) {
    if (!result.unavailableInventory.exactMatch || !result.unavailableInventory.countMatch || !result.unavailableInventory.allTruthful || !result.unavailableInventory.modeMatch) return false;
    if (result.unavailableInventory.truthfulCount !== result.unavailableInventory.expectedCount) return false;
  }
  if (Object.prototype.hasOwnProperty.call(result, "persistedImagesVerified") && result.persistedImagesVerified !== true) return false;
  if (result.comparisonMode === "contract-state") return booleanAssertions.length > 0;
  if (result.comparisonMode === "source-effect-components" && result.unassociatedComponents.length) return false;
  const metricsAccepted = result.metricsEqual || (result.metricDeltaDisposition.applies && result.metricDeltaDisposition.exactUnavailableControlBounds);
  return result.accepted.changed === 0 && result.accepted.rms === 0 && metricsAccepted;
}

async function writePersistedImages(item, freshImages) {
  const dir = path.join(outputRoot, item.id);
  await fs.mkdir(dir, { recursive: true });
  const specs = imageSpecs(freshImages);
  const writes = specs.map((spec) => sharp(spec.fresh).webp({ lossless: true }).toFile(path.join(dir, spec.file)));
  await Promise.all(writes);
  return inspectPersistedImages(dir, freshImages, item);
}

async function inspectPersistedImages(dir, freshImages, item) {
  const records = {};
  for (const spec of imageSpecs(freshImages)) {
    const filePath = path.join(dir, spec.file);
    const persisted = await fs.readFile(filePath);
    const persistedPixels = await decodedPixels(persisted);
    const freshPixels = await decodedPixels(spec.fresh);
    const dimensionsMatch = persistedPixels.width === freshPixels.width && persistedPixels.height === freshPixels.height;
    if (!dimensionsMatch || persistedPixels.sha256 !== freshPixels.sha256) {
      await writePersistedMismatchDiagnostic(item || { id: path.basename(dir) }, spec, persisted, spec.fresh, persistedPixels, freshPixels);
    }
    assert.equal(persistedPixels.sha256, freshPixels.sha256, `${spec.key} persisted lossless WebP pixels match fresh PNG capture`);
    assert.deepEqual({ width: persistedPixels.width, height: persistedPixels.height }, { width: freshPixels.width, height: freshPixels.height }, `${spec.key} persisted dimensions match fresh capture`);
    records[spec.key] = {
      file: spec.file,
      sha256: sha(persisted),
      decodedPixelSha256: persistedPixels.sha256,
      width: persistedPixels.width,
      height: persistedPixels.height,
    };
  }
  return records;
}

async function writePersistedMismatchDiagnostic(item, spec, persisted, fresh, persistedPixels, freshPixels) {
  const report = await imageDifferenceReport(persisted, fresh);
  const summary = {
    row: item.id,
    image: spec.key,
    persistedFileSha256: sha(persisted),
    persistedPixelSha256: persistedPixels.sha256,
    freshFileSha256: sha(fresh),
    freshPixelSha256: freshPixels.sha256,
    ...report.summary,
  };
  if (diagnosticRoot) {
    const dir = path.join(diagnosticRoot, item.id, spec.key);
    await fs.mkdir(dir, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(dir, "persisted.webp"), persisted),
      fs.writeFile(path.join(dir, "persisted.png"), report.leftPng),
      fs.writeFile(path.join(dir, "fresh.png"), report.rightPng),
      fs.writeFile(path.join(dir, "diff.png"), report.diff),
      fs.writeFile(path.join(dir, "metrics.json"), JSON.stringify(summary, null, 2) + "\n"),
    ]);
    summary.diagnosticDirectory = dir;
  } else {
    summary.diagnosticHint = "rerun with --diagnostic-dir=<child of system temp> to persist fresh/persisted/diff images";
  }
  process.stderr.write(`S4 image mismatch diagnostic:\n${JSON.stringify(summary, null, 2)}\n`);
}

async function writeCaptureDiagnostic(item, label, first, second, runtime = {}) {
  const report = await imageDifferenceReport(first, second);
  const summary = { row: item.id, image: label, ...runtime, firstSha256: sha(first), secondSha256: sha(second), ...report.summary };
  if (diagnosticRoot) {
    const dir = path.join(diagnosticRoot, item.id, label);
    await fs.mkdir(dir, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(dir, "first.png"), report.leftPng),
      fs.writeFile(path.join(dir, "second.png"), report.rightPng),
      fs.writeFile(path.join(dir, "diff.png"), report.diff),
      fs.writeFile(path.join(dir, "metrics.json"), JSON.stringify(summary, null, 2) + "\n"),
    ]);
    summary.diagnosticDirectory = dir;
  }
  process.stderr.write(`S4 unstable capture diagnostic:\n${JSON.stringify(summary, null, 2)}\n`);
}

async function imageDifferenceReport(leftBuffer, rightBuffer) {
  const leftPng = await sharp(leftBuffer).png().toBuffer();
  const rightPng = await sharp(rightBuffer).png().toBuffer();
  const leftImage = PNG.sync.read(leftPng);
  const rightImage = PNG.sync.read(rightPng);
  const width = Math.max(leftImage.width, rightImage.width);
  const height = Math.max(leftImage.height, rightImage.height);
  const left = pad(leftImage, width, height);
  const right = pad(rightImage, width, height);
  const metrics = pixelMetrics(left, right, width, height);
  const components = changedComponents(left, right, width, height, []).summaries.map(({ controls, controlIndexes, fullyContainedInEffectEnvelope, intersectsOwningControlBorderBox, effectAssociations: associations, ...component }) => component);
  const componentBounds = components.length ? {
    x: Math.min(...components.map((component) => component.x)),
    y: Math.min(...components.map((component) => component.y)),
    right: Math.max(...components.map((component) => component.x + component.width)),
    bottom: Math.max(...components.map((component) => component.y + component.height)),
  } : null;
  return {
    leftPng,
    rightPng,
    diff: metrics.diff,
    summary: {
      dimensions: { width, height, left: [leftImage.width, leftImage.height], right: [rightImage.width, rightImage.height] },
      changed: metrics.changed,
      changedPct: metrics.changedPct,
      rms: metrics.rms,
      componentCount: components.length,
      componentBounds,
      components: components.slice(0, 200),
      componentsTruncated: components.length > 200,
    },
  };
}

function imageSpecs(freshImages) {
  return [
    { key: "reference", file: "reference.webp", fresh: freshImages.reference },
    { key: "implementation", file: "implementation.webp", fresh: freshImages.implementation },
    { key: "diff", file: "diff.webp", fresh: freshImages.diff },
    freshImages.componentDiff ? { key: "componentDiff", file: "component-diff.webp", fresh: freshImages.componentDiff } : null,
  ].filter(Boolean);
}

async function decodedPixels(buffer) {
  const decoded = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { sha256: sha(decoded.data), width: decoded.info.width, height: decoded.info.height };
}

function renderIndex(summary) {
  const lines = ["# S4 Visual Acceptance Artifacts", "", `Design baseline: \`${summary.designBaseline}\``, `Rows: ${summary.matrixRows}`, `Modes: ${Object.entries(summary.modeCounts).map(([mode, count]) => `${mode}=${count}`).join(", ")}`, "", "Raw metrics are always retained. Accepted metrics equal raw metrics for strict rows, exclude only associated changed-pixel components for source-effect rows, and are not an acceptance threshold for contract-state rows.", "", "| Row | Mode | Surface | Vertical | Width | State/variant | Raw changed | Accepted changed | Raw RMS | Accepted RMS | Result |", "| --- | --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | --- |"];
  for (const item of summary.rows) lines.push(`| [${item.id}](./${item.id}/) | ${item.comparisonMode} | ${item.surface} | ${item.vertical} | ${item.width} | ${item.state}/${item.variant}/${item.mode} | ${item.raw.changed} | ${item.accepted.changed} | ${item.raw.rms.toFixed(6)} | ${item.accepted.rms.toFixed(6)} | ${item.passed ? "pass" : "fail"} |`);
  lines.push("");
  return lines.join("\n");
}

function sha(buffer) { return crypto.createHash("sha256").update(buffer).digest("hex"); }

function normalizedPageUrl(value) {
  const url = new URL(value);
  return url.pathname + url.search + url.hash;
}

async function hashTree(root) {
  const hash = crypto.createHash("sha256");
  async function visit(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute);
      if (entry.isDirectory()) await visit(absolute);
      else {
        const stat = await fs.stat(absolute);
        const body = await fs.readFile(absolute);
        hash.update(relative + "\0" + stat.size + "\0" + stat.mtimeMs + "\0");
        hash.update(body);
      }
    }
  }
  await visit(root);
  return hash.digest("hex");
}

async function serve(root) {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
      const file = path.resolve(root, "." + pathname);
      if (!file.startsWith(root + path.sep)) throw new Error("outside root");
      const stat = await fs.stat(file);
      const target = stat.isDirectory() ? path.join(file, "index.html") : file;
      const body = await fs.readFile(target);
      const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png" };
      response.writeHead(200, { "content-type": types[path.extname(target)] || "application/octet-stream", "cache-control": "no-store" });
      response.end(body);
    } catch (_) { response.writeHead(404); response.end("not found"); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: async () => {
      try {
        await withTimeout(new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())), 5000, "HTTP server graceful close");
      } catch (error) {
        server.closeIdleConnections();
        server.closeAllConnections();
        throw error;
      }
      assert.equal(server.listening, false, "HTTP server transport is closed");
    },
  };
}

await main();
