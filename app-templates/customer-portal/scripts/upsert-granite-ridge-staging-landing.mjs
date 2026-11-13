import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { buildLiveLandingManual, exportLiveLandingManual, landingRobots, packageInventory, sourceLabel } from "./export-live-landing-manual.mjs";
import { assertExactInventory } from "./portal-manual-package.mjs";
import { parseArgs } from "./upsert-granite-ridge-portal.mjs";

const repoRoot = path.resolve(".");
const portalRoot = path.join(repoRoot, "app-templates/customer-portal");
const uploader = path.join(repoRoot, "app-templates/landing-page/scripts/upload-cms-family.mjs");

const landing = {
  templateCode: "CUSTOMER_PORTAL_GRANITE_RIDGE_LANDING_STAGING",
  source: path.join(portalRoot, "cms/granite-ridge-snow.landing-staging.json"),
  package: path.join(portalRoot, "dist/manual-upload/customer-portal-granite-ridge-landing-staging"),
  checks: [path.join(portalRoot, "scripts/granite-ridge-staging-landing-manual-check.mjs")],
};

const usage = () => `Usage:
  node app-templates/customer-portal/scripts/upsert-granite-ridge-staging-landing.mjs \\
    [--dry-run | --live] [--base-url https://dev-1.servicewand.com/core] [--org SYSTEM] \\
    [--expected-root-id <uuid>] [--require-existing | --require-missing] \\
    [--skip-build] [--skip-checks]

Rebuilds the public landing from ${sourceLabel(landing.source)},
repackages ${path.relative(repoRoot, landing.package)},
runs its check, then creates or updates BlockTemplate ${landing.templateCode}
by code through upload-cms-family.mjs. It never creates or changes a PageContext.

--skip-build reuses the package on disk and refuses it unless every file equals
a fresh build of the source, so a hand-edited or stale package is not uploaded.

Env credentials, read by the uploader and never printed in full:
  SERVICEWAND_API_KEY or LANDING_API_KEY
  SERVICEWAND_BEARER  or LANDING_BEARER`;

export async function upsertGraniteRidgeStagingLanding(options) {
  if (options.requireExisting && options.requireMissing) throw new Error("--require-existing and --require-missing are mutually exclusive");
  if (options.expectedRootId && options.requireMissing) throw new Error("--expected-root-id cannot be combined with --require-missing");
  const input = sourceLabel(landing.source);
  if (!options.skipBuild) {
    console.log("[1/4] rebuilding " + landing.templateCode + " from " + input);
    const result = await exportLiveLandingManual({ inputPath: landing.source, outputDir: landing.package });
    console.log("[2/4] repackaged " + path.relative(repoRoot, result.outputDir) + " (" + result.template.parameters.length + " parameters)");
  } else {
    console.log("[1/4] skipped rebuild");
    console.log("[2/4] verifying " + path.relative(repoRoot, landing.package) + " against a fresh build of " + input);
  }
  const manifest = await assertPackageMatchesSource(input);

  if (!options.skipChecks) {
    console.log("[3/4] running deterministic checks");
    for (const check of landing.checks) await run(process.execPath, [check], path.basename(check));
  } else {
    console.log("[3/4] skipped checks");
  }

  console.log("[4/4] " + (options.mode === "live" ? "upserting into CMS" : "resolving the CMS plan without writing"));
  const uploaderArgs = [uploader, "--out", landing.package, "--org", options.org];
  if (options.baseUrl) uploaderArgs.push("--base-url", options.baseUrl);
  if (options.expectedRootId) uploaderArgs.push("--expected-root-id", options.expectedRootId);
  if (options.requireExisting) uploaderArgs.push("--require-existing");
  if (options.requireMissing) uploaderArgs.push("--require-missing");
  uploaderArgs.push(options.mode === "live" ? "--live" : "--dry-run");
  await run(process.execPath, uploaderArgs, "upload-cms-family");

  return { templateCode: manifest.template.code, mode: options.mode, package: landing.package };
}

async function assertPackageMatchesSource(input) {
  const source = JSON.parse(await fs.readFile(landing.source, "utf8"));
  const built = await buildLiveLandingManual(source, input);
  await assertExactInventory(landing.package, packageInventory).catch(() => {
    throw new Error(path.relative(repoRoot, landing.package) + " does not hold exactly the package inventory. Regenerate it instead of hand-editing: drop --skip-build.");
  });
  for (const [name, content] of built.files) {
    if (await fs.readFile(path.join(landing.package, name), "utf8") !== content) {
      throw new Error("Package file " + name + " no longer matches a fresh build of " + input + ". Regenerate it instead of hand-editing: drop --skip-build.");
    }
  }
  const { manifest, template } = built;
  if (template.code !== landing.templateCode || template.children.length) throw new Error("The package must carry exactly the " + landing.templateCode + " root");
  if (manifest.launchState !== "staging-only" || manifest.template.robots !== landingRobots) throw new Error("Refusing to upsert a landing that is not a " + landingRobots + " staging page");
  return manifest;
}

function run(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: repoRoot, stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(label + " failed with exit code " + code))));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    const result = await upsertGraniteRidgeStagingLanding(options);
    console.log("upsert-granite-ridge-staging-landing ok: " + result.templateCode + " (" + result.mode + ")");
  }
}
