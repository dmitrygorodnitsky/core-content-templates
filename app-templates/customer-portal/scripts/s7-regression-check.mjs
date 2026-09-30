import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const portal = path.join(repo, "app-templates/customer-portal");
const program = path.join(repo, "docs/stream-tasks/customer-portal-wave9-runtime-program");
const outputRoot = path.join(program, "evidence/artifacts/S7");
const resultPath = path.join(outputRoot, "regression-result.json");
const node = process.execPath;
const startedAt = new Date().toISOString();
const commands = [];
const skippedChecks = [];
const historicalRoot = path.join(program, "evidence");
const designRoot = path.join(portal, "design-inbox");
const s4MetricsPath = path.join(program, "evidence/artifacts/S4/metrics.json");
const historicalBefore = await hashHistoricalEvidence();
const designBefore = await hashTree(designRoot);
const s4Before = await hashTree(path.dirname(s4MetricsPath));

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

try {
  await runShell("static-js-syntax", `find app-templates/customer-portal/runtime app-templates/customer-portal/scripts app-templates/customer-portal/design-inbox app-templates/customer-portal/public app-templates/customer-portal/cms \\( -name '*.js' -o -name '*.mjs' \\) -print0 | xargs -0 -n1 ${quote(node)} --check`);
  await runShell("non-design-json", "find app-templates/customer-portal -path '*/design-inbox' -prune -o -name '*.json' -print0 | xargs -0 -n1 jq empty");
  await run("config-matrix", node, ["app-templates/customer-portal/scripts/config-behavior-check.mjs", "--root", "app-templates/customer-portal/runtime"]);
  await run("route-state-matrix", node, ["app-templates/customer-portal/scripts/s7-route-state-check.mjs", "--root", "app-templates/customer-portal/runtime", "--output", path.relative(repo, path.join(outputRoot, "route-state-coverage.json"))]);
  await run("runtime-route-smoke", node, ["app-templates/customer-portal/scripts/route-smoke.mjs", "--root", "app-templates/customer-portal/runtime"]);
  await run("pim-adapter", node, ["app-templates/customer-portal/scripts/pim-adapter-check.mjs"]);
  await run("seo-public", node, ["app-templates/customer-portal/scripts/seo-public-check.mjs"]);

  const careTemp = await fs.mkdtemp(path.join(os.tmpdir(), "customer-portal-s7-care-"));
  try {
    await run("care-runtime", node, ["app-templates/customer-portal/scripts/care-runtime-check.mjs", "--root", "app-templates/customer-portal/runtime", "--output-dir", careTemp]);
  } finally {
    await fs.rm(careTemp, { recursive: true, force: true });
  }

  const activationDir = path.join(outputRoot, "activation");
  await run("activation-contract", node, ["app-templates/customer-portal/scripts/activation-contract-check.mjs", `--output-dir=${activationDir}`]);
  await run("cms-export", node, ["app-templates/customer-portal/scripts/export-cms.mjs"]);
  await run("cms-dual-export", node, ["app-templates/customer-portal/scripts/s6-cms-export-check.mjs"], { S6_EVIDENCE_DIR: path.join(outputRoot, "cms") });
  await run("exported-portal-route-smoke", node, ["app-templates/customer-portal/scripts/route-smoke.mjs", "--root", "app-templates/customer-portal", "--entry", "dist/customer-portal-preview.html"]);
  await run("visual-full-verify", node, ["app-templates/customer-portal/scripts/visual-acceptance.mjs", "--verify"]);
  await runShell("post-generation-json", "find app-templates/customer-portal -path '*/design-inbox' -prune -o -name '*.json' -print0 | xargs -0 -n1 jq empty");
  await runShell("diff-whitespace", "git diff --check");
  await runShell("design-source-integrity", "git diff --exit-code c9879ae -- app-templates/customer-portal/design-inbox");

  const historicalAfter = await hashHistoricalEvidence();
  const designAfter = await hashTree(designRoot);
  const s4After = await hashTree(path.dirname(s4MetricsPath));
  assert.equal(historicalAfter, historicalBefore, "historical S0-S6 evidence changed during S7 regression");
  assert.equal(designAfter, designBefore, "design source changed during S7 regression");
  assert.equal(s4After, s4Before, "committed S4 visual packet changed during --verify");

  const routeCoverage = JSON.parse(await fs.readFile(path.join(outputRoot, "route-state-coverage.json"), "utf8"));
  const visual = JSON.parse(await fs.readFile(s4MetricsPath, "utf8"));
  const cms = JSON.parse(await fs.readFile(path.join(outputRoot, "cms/contract-export-proof.json"), "utf8"));
  const scenarios = JSON.parse(await fs.readFile(path.join(portal, "runtime/data/scenarios.json"), "utf8"));
  const activation = JSON.parse(await fs.readFile(path.join(portal, "runtime/data/activation-contracts.json"), "utf8"));
  const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
    ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
    : createRequire(import.meta.url);
  const playwright = requireFrom("playwright/package.json");
  const browserVersion = await capture(process.env.PLAYWRIGHT_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--version"]);
  const debris = await transactionDebris();
  assert.deepEqual(debris, [], `transaction/process debris remains: ${debris.join(", ")}`);
  assert.equal(commands.every((command) => command.status === "pass" && command.exitCode === 0), true);
  assert.deepEqual(skippedChecks, []);
  assert.deepEqual(visual.failures, []);
  assert.equal(visual.acceptedMaxChanged, 0);
  assert.equal(visual.acceptedMaxRms, 0);
  assert.equal(cms.uploadPerformed, false);

  const result = {
    schemaVersion: 1,
    program: "customer-portal-wave9-runtime-program",
    stage: "S7.1",
    status: "pass",
    startedAt,
    completedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      nodeExecutable: node,
      playwright: playwright.version,
      browser: browserVersion.trim(),
      platform: `${process.platform} ${process.arch}`,
      viewports: scenarios.viewports,
    },
    commands,
    coverage: {
      verticals: scenarios.themes.length,
      profiles: Object.keys(scenarios.profiles).filter((key) => key !== "note").length,
      routes: scenarios.routes.length,
      routeProfile: routeCoverage.coverage,
      expectedRouteStateProbes: routeCoverage.stateCoverage.expectedTotal,
      executedRouteStateProbes: routeCoverage.stateCoverage.passedTotal,
      routeDeclaredStates: routeCoverage.stateCoverage.routeDeclaredTotal,
      stateProbeRoutes: routeCoverage.stateCoverage.routes,
      careVerticals: Object.keys(scenarios.careContract.verticalKinds).length,
      careActions: scenarios.careContract.fixtureTransitions.length + scenarios.careContract.unavailableWithoutApprovedDestination.length,
      scenarioActions: scenarios.actions.length,
      activationDataSources: activation.dataSources.length,
      activationActions: activation.actions.length,
      activationSurfaceControls: activation.surfaceControls.length,
      cmsVerticals: cms.verticals.length,
      cmsProfiles: cms.profiles.length,
      cmsExportRuns: cms.exportRuns,
    },
    visual: {
      packetSchemaVersion: visual.schemaVersion,
      packetSha256: sha(await fs.readFile(s4MetricsPath)),
      packetTreeSha256: s4After,
      matrixRows: visual.matrixRows,
      modeCounts: visual.modeCounts,
      failures: visual.failures,
      rawMaxChanged: visual.rawMaxChanged,
      rawMaxChangedPct: visual.rawMaxChangedPct,
      rawMaxRms: visual.rawMaxRms,
      acceptedMaxChanged: visual.acceptedMaxChanged,
      acceptedMaxChangedPct: visual.acceptedMaxChangedPct,
      acceptedMaxRms: visual.acceptedMaxRms,
      comparison: visual.comparison,
      browserLifecycle: visual.browserLifecycle,
    },
    cms: {
      byteIdentical: cms.byteIdentical,
      transactionPreservation: cms.transactionalFailurePreservation,
      transactionDebris: cms.transactionDebris,
      browserBoot: cms.browserBoot,
      hashes: cms.hashes,
      uploadPerformed: cms.uploadPerformed,
    },
    integrity: {
      designBaseline: "c9879ae",
      designTreeBefore: designBefore,
      designTreeAfter: designAfter,
      historicalEvidenceBefore: historicalBefore,
      historicalEvidenceAfter: historicalAfter,
      s4PacketBefore: s4Before,
      s4PacketAfter: s4After,
      backgroundOrTransactionDebris: debris,
    },
    skippedChecks,
    residuals: ["External general-purpose Draft 2020-12 validator is unavailable; the fail-closed local CMS schema subset and adversarial suite are executed by s6-cms-export-check.mjs."],
    uploadPerformed: false,
  };
  await fs.writeFile(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(`s7-regression-check ok: ${commands.length} commands, ${routeCoverage.coverage.routeAttempts} route/profile attempts, ${visual.matrixRows} full visual rows, skipped 0`);
} catch (error) {
  const failure = {
    schemaVersion: 1,
    program: "customer-portal-wave9-runtime-program",
    stage: "S7.1",
    status: "fail",
    startedAt,
    completedAt: new Date().toISOString(),
    commands,
    skippedChecks,
    error: error.stack || String(error),
  };
  await fs.writeFile(resultPath, JSON.stringify(failure, null, 2) + "\n", "utf8");
  throw error;
}

async function runShell(id, command, extraEnv = {}) {
  return run(id, "/bin/zsh", ["-lc", command], extraEnv, command);
}

async function run(id, executable, args, extraEnv = {}, displayCommand = null) {
  const started = Date.now();
  const record = {
    id,
    command: displayCommand || [executable, ...args].map(quote).join(" "),
    cwd: repo,
    startedAt: new Date().toISOString(),
    status: "running",
  };
  commands.push(record);
  const result = await spawnCapture(executable, args, { ...process.env, ...extraEnv });
  Object.assign(record, {
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    exitCode: result.exitCode,
    signal: result.signal,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    status: result.exitCode === 0 ? "pass" : "fail",
  });
  if (result.exitCode !== 0) throw new Error(`${id} failed with exit ${result.exitCode}\n${result.stdout}\n${result.stderr}`);
  return record;
}

function spawnCapture(executable, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: repo, env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; process.stdout.write(chunk); });
    child.stderr.on("data", (chunk) => { stderr += chunk; process.stderr.write(chunk); });
    child.once("error", reject);
    child.once("close", (exitCode, signal) => resolve({ exitCode, signal, stdout, stderr }));
  });
}

async function capture(executable, args) {
  const result = await spawnCapture(executable, args, process.env);
  if (result.exitCode !== 0) throw new Error(`${executable} ${args.join(" ")} failed`);
  return result.stdout;
}

async function hashHistoricalEvidence() {
  const entries = await fs.readdir(historicalRoot, { withFileTypes: true });
  const hash = crypto.createHash("sha256");
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "artifacts") {
      const artifactEntries = await fs.readdir(path.join(historicalRoot, entry.name));
      for (const name of artifactEntries.filter((value) => /^S[0-6]$/.test(value)).sort()) {
        hash.update(name + "\0" + await hashTree(path.join(historicalRoot, "artifacts", name)) + "\0");
      }
    } else if (/^S[0-6]\.md$/.test(entry.name)) {
      hash.update(entry.name + "\0" + await fs.readFile(path.join(historicalRoot, entry.name)) + "\0");
    }
  }
  return hash.digest("hex");
}

async function hashTree(root) {
  const hash = crypto.createHash("sha256");
  async function visit(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const target = path.join(directory, entry.name);
      const relative = path.relative(root, target);
      if (entry.isDirectory()) await visit(target);
      else hash.update(relative + "\0" + await fs.readFile(target) + "\0");
    }
  }
  await visit(root);
  return hash.digest("hex");
}

async function transactionDebris() {
  const entries = await fs.readdir(portal);
  return entries.filter((name) => /^\.s6-export-.*\.(?:staging|backup)-/.test(name) || /^\.dist\.(?:staging|backup)-/.test(name));
}

function sha(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function quote(value) { return `'${String(value).replace(/'/g, `'"'"'`)}'`; }
