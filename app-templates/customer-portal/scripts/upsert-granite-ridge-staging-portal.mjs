import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { buildLivePortalRuntime } from "./build-live-portal-runtime.mjs";
import { exportLivePortalManual, liveDeploymentParameters, operatorParameterPlaceholder } from "./export-live-portal-manual.mjs";
import { sha256 } from "./portal-manual-package.mjs";
import { parseArgs, upsertPortalPackage } from "./upsert-granite-ridge-portal.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");

const staging = {
  templateCode: "CUSTOMER_PORTAL_GRANITE_RIDGE_STAGING",
  runtimeLabel: "live",
  source: path.join(portalRoot, "cms/granite-ridge-snow.customer-portal-staging.json"),
  runtime: path.join(portalRoot, "runtime/manual/granite-ridge-staging-runtime.js"),
  package: path.join(portalRoot, "dist/manual-upload/customer-portal-granite-ridge-staging"),
  checks: [
    "granite-ridge-staging-portal-manual-check.mjs",
    "core-account-adapter-check.mjs",
    "snow-portal-shell-check.mjs",
    "snow-portal-public-entry-check.mjs",
    "snow-account-profile-check.mjs",
    "snow-contracts-check.mjs",
    "core-snow-adapter-check.mjs",
    "snow-live-overview-check.mjs",
    "live-weather-check.mjs",
    "property-map-check.mjs",
  ].map((name) => path.join(portalRoot, "scripts", name)),
  buildRuntime() {
    return buildLivePortalRuntime({ output: staging.runtime });
  },
  exportPackage() {
    return exportLivePortalManual({ inputPath: staging.source, runtimePath: staging.runtime, outputDir: staging.package });
  },
  async assertPackage(manifest) {
    if (manifest.runtime.dataMode !== "live" || manifest.runtime.authMode !== "required") {
      throw new Error("Refusing to upsert a package that is not a live, signed-in portal");
    }
    if (manifest.launchState !== "staging-only") throw new Error("Refusing to upsert a package whose launch state is not staging-only");
    const payload = JSON.parse(await fs.readFile(path.join(staging.package, "cms-family.payload.json"), "utf8"));
    if (payload.root.code !== staging.templateCode || (payload.children || []).length) {
      throw new Error("cms-family.payload.json must carry exactly the " + staging.templateCode + " root");
    }
    for (const field of ["head", "html", "css", "javascript"]) {
      if (sha256(payload.root[field]) !== manifest.template.sha256[field]) {
        throw new Error("cms-family.payload.json field " + field + " no longer matches its manifest digest. Regenerate it instead of hand-editing: drop --skip-build.");
      }
    }
    const codes = payload.root.parameters.map((item) => item.code);
    if (JSON.stringify(codes) !== JSON.stringify(manifest.template.parameters) || codes.some((code) => !liveDeploymentParameters.includes(code))) {
      throw new Error("cms-family.payload.json declares parameters its manifest does not: " + codes.join(", "));
    }
    for (const item of payload.root.parameters) {
      if (item.code !== "PORTAL_REQUEST_FORM_URL" && item.value !== operatorParameterPlaceholder) {
        throw new Error("Refusing to upsert " + item.code + " with anything but the " + operatorParameterPlaceholder + " placeholder: it is operator-owned and is set in CMS, never shipped");
      }
    }
  },
};

const usage = () => `Usage:
  node app-templates/customer-portal/scripts/upsert-granite-ridge-staging-portal.mjs \\
    [--dry-run | --live] [--base-url https://dev-1.servicewand.com/core] [--org SYSTEM] \\
    [--expected-root-id <uuid>] [--require-existing | --require-missing] \\
    [--skip-build] [--skip-checks]

Rebuilds the live runtime from runtime/src, regenerates the manual package from
cms/granite-ridge-snow.customer-portal-staging.json, runs its checks, then
creates or updates BlockTemplate ${staging.templateCode} by code.
It never creates or changes a PageContext.

--skip-build reuses the package on disk and verifies its root files and its
upload payload against the manifest digests, so a hand-edited package is
refused. An operator-owned parameter that carries anything but the # placeholder
is refused too.

Env credentials, read by the uploader and never printed in full:
  SERVICEWAND_API_KEY or LANDING_API_KEY
  SERVICEWAND_BEARER  or LANDING_BEARER`;

export function upsertGraniteRidgeStagingPortal(options) {
  return upsertPortalPackage(options, staging);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    const result = await upsertGraniteRidgeStagingPortal(options);
    console.log("upsert-granite-ridge-staging-portal ok: " + result.templateCode + " (" + result.mode + ")");
  }
}
