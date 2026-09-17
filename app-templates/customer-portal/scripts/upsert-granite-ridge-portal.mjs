/* Upsert the Granite Ridge snow-removal fixture portal into ServiceWand CMS.
 *
 * One stable operator entrypoint for the whole chain:
 *
 *   1. rebuild the fixture runtime bundle from runtime/src
 *   2. regenerate dist/manual-upload/customer-portal-granite-ridge-fixture
 *   3. run the deterministic fixture and package checks
 *   4. create or update the BlockTemplate by code through upload-cms-family.mjs
 *
 * Dry-run is the default. Step 4 never touches template parents, include
 * markup, enabled templates, or PageContext records.
 *
 *   node app-templates/customer-portal/scripts/upsert-granite-ridge-portal.mjs \
 *     --base-url https://dev-1.servicewand.com/core --org SYSTEM [--live]
 */

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { buildFixturePortalRuntime } from "./build-fixture-portal-runtime.mjs";
import { exportFixturePortalManual } from "./export-fixture-portal-manual.mjs";

const repoRoot = path.resolve(".");
const portalRoot = path.join(repoRoot, "app-templates/customer-portal");

const tenant = {
  caseId: "granite-ridge-snow",
  templateCode: "CUSTOMER_PORTAL_GRANITE_RIDGE_FIXTURE",
  source: path.join(portalRoot, "content/cases/granite-ridge-snow.customer-portal-fixture.json"),
  runtime: path.join(portalRoot, "runtime/manual/granite-ridge-fixture-runtime.js"),
  package: path.join(portalRoot, "dist/manual-upload/customer-portal-granite-ridge-fixture"),
  checks: [
    path.join(portalRoot, "scripts/granite-ridge-fixture-check.mjs"),
    path.join(portalRoot, "scripts/granite-ridge-portal-manual-check.mjs"),
    path.join(portalRoot, "scripts/live-weather-check.mjs"),
    path.join(portalRoot, "scripts/property-map-check.mjs"),
    path.join(portalRoot, "scripts/appointments-check.mjs"),
  ],
  uploader: path.join(repoRoot, "app-templates/landing-page/scripts/upload-cms-family.mjs"),
};

export function parseArgs(argv) {
  const options = { mode: "dry-run", org: "SYSTEM" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--live") options.mode = "live";
    else if (arg === "--dry-run") options.mode = "dry-run";
    else if (arg === "--base-url") options.baseUrl = argv[++index];
    else if (arg === "--org") options.org = argv[++index];
    else if (arg === "--expected-root-id") options.expectedRootId = argv[++index];
    else if (arg === "--require-existing") options.requireExisting = true;
    else if (arg === "--require-missing") options.requireMissing = true;
    else if (arg === "--skip-build") options.skipBuild = true;
    else if (arg === "--skip-checks") options.skipChecks = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error("Unknown argument: " + arg);
  }
  if (options.mode === "live" && !options.baseUrl && !envFirst("SERVICEWAND_BASE_URL", "LANDING_BASE_URL")) {
    throw new Error("--live requires an explicit --base-url or SERVICEWAND_BASE_URL/LANDING_BASE_URL");
  }
  return options;
}

const usage = () => `Usage:
  node app-templates/customer-portal/scripts/upsert-granite-ridge-portal.mjs \\
    [--dry-run | --live] [--base-url https://dev-1.servicewand.com/core] [--org SYSTEM] \\
    [--expected-root-id <uuid>] [--require-existing | --require-missing] \\
    [--skip-build] [--skip-checks]

Rebuilds the fixture runtime, regenerates the manual package, runs both
deterministic checks, then creates or updates BlockTemplate
${tenant.templateCode} by code.

--skip-build reuses the package on disk and verifies it still matches the
sha256 digests in its own manifest, so a hand-edited package is refused.

Env credentials, read by the uploader and never printed in full:
  SERVICEWAND_API_KEY or LANDING_API_KEY
  SERVICEWAND_BEARER  or LANDING_BEARER`;

function envFirst(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return "";
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

async function assertPackageMatchesManifest() {
  const manifest = JSON.parse(await fs.readFile(path.join(tenant.package, "manual-export-manifest.json"), "utf8"));
  const fields = { head: "root/head.html", html: "root/html.html", css: "root/css.css", javascript: "root/javascript.js" };
  for (const [field, file] of Object.entries(fields)) {
    const content = await fs.readFile(path.join(tenant.package, file), "utf8");
    const expected = manifest.template.sha256[field];
    const actual = sha256(field === "head" || field === "html" ? content.replace(/\n$/, "") : content);
    if (actual !== expected) {
      throw new Error("Package field " + file + " no longer matches its manifest digest. Regenerate it instead of hand-editing: drop --skip-build.");
    }
  }
  if (manifest.template.code !== tenant.templateCode) {
    throw new Error("Package template code is " + manifest.template.code + ", expected " + tenant.templateCode);
  }
  if (manifest.runtime.dataMode !== "fixture" || manifest.runtime.authMode !== "fixture") {
    throw new Error("Refusing to upsert a package that is not in fixture mode");
  }
  if (manifest.runtime.case !== tenant.caseId) {
    throw new Error("Package case is " + manifest.runtime.case + ", expected " + tenant.caseId);
  }
  return manifest;
}

function run(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: repoRoot, stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(label + " failed with exit code " + code));
    });
  });
}

export async function upsertGraniteRidgePortal(options) {
  if (!options.skipBuild) {
    console.log("[1/4] building the fixture runtime bundle");
    const built = await buildFixturePortalRuntime({ case: tenant.caseId, output: tenant.runtime });
    console.log("      " + path.relative(repoRoot, built.output) + " (" + built.bytes + " bytes)");

    console.log("[2/4] regenerating the manual package");
    await exportFixturePortalManual({ inputPath: tenant.source, runtimePath: tenant.runtime, outputDir: tenant.package });
    console.log("      " + path.relative(repoRoot, tenant.package));
  } else {
    console.log("[1/4] skipped build");
    console.log("[2/4] verifying the package on disk against its manifest");
  }

  const manifest = await assertPackageMatchesManifest();

  if (!options.skipChecks) {
    console.log("[3/4] running deterministic checks");
    for (const check of tenant.checks) {
      await run(process.execPath, [check], path.basename(check));
    }
  } else {
    console.log("[3/4] skipped checks");
  }

  console.log("[4/4] " + (options.mode === "live" ? "upserting into CMS" : "resolving the CMS plan without writing"));
  const uploaderArgs = [tenant.uploader, "--out", tenant.package, "--org", options.org];
  if (options.baseUrl) uploaderArgs.push("--base-url", options.baseUrl);
  if (options.expectedRootId) uploaderArgs.push("--expected-root-id", options.expectedRootId);
  if (options.requireExisting) uploaderArgs.push("--require-existing");
  if (options.requireMissing) uploaderArgs.push("--require-missing");
  uploaderArgs.push(options.mode === "live" ? "--live" : "--dry-run");
  await run(process.execPath, uploaderArgs, "upload-cms-family");

  return { templateCode: manifest.template.code, mode: options.mode, package: tenant.package };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    const result = await upsertGraniteRidgePortal(options);
    console.log("upsert-granite-ridge-portal ok: " + result.templateCode + " (" + result.mode + ")");
  }
}
