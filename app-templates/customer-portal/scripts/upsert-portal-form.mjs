/* Upsert the universal portal form document into ServiceWand CMS.
 *
 * One stable operator entrypoint for the whole chain:
 *
 *   1. regenerate dist/manual-upload/portal-form-document from runtime/forms
 *   2. run the deterministic renderer check
 *   3. create or update the BlockTemplate by code through upload-cms-family.mjs
 *
 * Dry-run is the default. Step 3 never touches template parents, include
 * markup, enabled templates, or PageContext records.
 *
 *   node app-templates/customer-portal/scripts/upsert-portal-form.mjs \
 *     --base-url https://dev-1.servicewand.com/core --org SYSTEM [--live]
 */

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { exportPortalFormManual } from "./export-portal-form-manual.mjs";

const repoRoot = path.resolve(".");
const portalRoot = path.join(repoRoot, "app-templates/customer-portal");

const target = {
  templateCode: "PORTAL_FORM_DOCUMENT",
  package: path.join(portalRoot, "dist/manual-upload/portal-form-document"),
  checks: [path.join(portalRoot, "scripts/portal-form-check.mjs")],
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
  node app-templates/customer-portal/scripts/upsert-portal-form.mjs \\
    [--dry-run | --live] [--base-url https://dev-1.servicewand.com/core] [--org SYSTEM] \\
    [--expected-root-id <uuid>] [--require-existing | --require-missing] \\
    [--skip-build] [--skip-checks]

Regenerates the form document, runs the renderer check, then creates or updates
BlockTemplate ${target.templateCode} by code.

--skip-build reuses the package on disk and verifies it still matches the
sha256 digests in its own manifest, so a hand-edited package is refused.

The document ships with FORM_API_BASE_URL, FORM_TYPE_CODE and
FORM_ORGANIZATION_ID empty. It renders nothing and submits nothing until an
operator fills them in CMS. An update keeps the values CMS already holds for
them and names every one it kept.

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
  const manifest = JSON.parse(await fs.readFile(path.join(target.package, "manual-export-manifest.json"), "utf8"));
  const fields = { head: "root/head.html", html: "root/html.html", css: "root/css.css", javascript: "root/javascript.js" };
  for (const [field, file] of Object.entries(fields)) {
    const content = await fs.readFile(path.join(target.package, file), "utf8");
    const actual = sha256(content.replace(/\n$/, ""));
    if (actual !== manifest.template.sha256[field]) {
      throw new Error("Package field " + file + " no longer matches its manifest digest. Regenerate it instead of hand-editing: drop --skip-build.");
    }
  }
  if (manifest.template.code !== target.templateCode) {
    throw new Error("Package template code is " + manifest.template.code + ", expected " + target.templateCode);
  }
  const parameters = JSON.parse(await fs.readFile(path.join(target.package, "root/parameters.json"), "utf8"));
  const deployment = parameters.filter((parameter) => parameter.code.startsWith("FORM_"));
  const required = ["FORM_API_BASE_URL", "FORM_TYPE_CODE", "FORM_ORGANIZATION_ID"];
  for (const code of required) {
    const parameter = deployment.find((entry) => entry.code === code);
    if (!parameter) throw new Error("The document must declare " + code);
    if (parameter.value !== "") {
      throw new Error(code + " must ship empty; a deployment value belongs in CMS, not in the uploaded template");
    }
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

export async function upsertPortalForm(options) {
  if (!options.skipBuild) {
    console.log("[1/3] regenerating the form document");
    const built = await exportPortalFormManual({});
    console.log("      " + path.relative(repoRoot, built.outputDir) + " (" + built.template.parameters.length + " parameters)");
  } else {
    console.log("[1/3] verifying the package on disk against its manifest");
  }

  const manifest = await assertPackageMatchesManifest();

  if (!options.skipChecks) {
    console.log("[2/3] running the renderer check");
    for (const check of target.checks) {
      await run(process.execPath, [check], path.basename(check));
    }
  } else {
    console.log("[2/3] skipped checks");
  }

  console.log("[3/3] " + (options.mode === "live" ? "upserting into CMS" : "resolving the CMS plan without writing"));
  const uploaderArgs = [target.uploader, "--out", target.package, "--org", options.org];
  if (options.baseUrl) uploaderArgs.push("--base-url", options.baseUrl);
  if (options.expectedRootId) uploaderArgs.push("--expected-root-id", options.expectedRootId);
  if (options.requireExisting) uploaderArgs.push("--require-existing");
  if (options.requireMissing) uploaderArgs.push("--require-missing");
  uploaderArgs.push(options.mode === "live" ? "--live" : "--dry-run");
  try {
    await run(process.execPath, uploaderArgs, "upload-cms-family");
  } catch (error) {
    if (options.requireMissing) {
      console.error("");
      console.error("A template with this code already exists in the target CMS, and it was not created by this package.");
      console.error("Resolve its id with an authenticated read before deciding to take it over:");
      console.error("");
      console.error("  node " + path.relative(repoRoot, process.argv[1]) + " --base-url " + (options.baseUrl || "<base>") + " --org " + options.org + " --require-existing");
      console.error("");
      console.error("If that id is ours to update, repeat the upload with --expected-root-id <uuid> --live and without --require-missing.");
      console.error("If it belongs to someone else, change the template code instead of overwriting their work.");
    }
    throw error;
  }

  return { templateCode: manifest.template.code, mode: options.mode, package: target.package };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    const result = await upsertPortalForm(options);
    console.log("upsert-portal-form ok: " + result.templateCode + " (" + result.mode + ")");
  }
}
