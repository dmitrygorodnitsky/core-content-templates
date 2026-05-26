/* Stub uploader for lab-ui CMS family payloads.
 *
 *   node scripts/upload-cms-family.mjs --out dist/<slug> [--live]
 *
 * Default mode: --dry-run. Prints the requests it WOULD make (method,
 * URL, headers, body shape) without touching the network. Lets you
 * verify the env wiring + payload shape before any real CMS call.
 *
 * --live mode is reserved for when the CMS API contract is finalized.
 * Today it fails fast with a clear message — do not silently hit a
 * production endpoint with an untested payload.
 *
 * Environment variables (documented in the audit + generator/README):
 *   LANDING_API_KEY    — primary credential. Required.
 *   LANDING_BEARER     — optional bearer token (alternative auth).
 *   LANDING_BASE_URL   — CMS API base URL. Required.
 *   LANDING_ORG        — organization / tenant ID. Required.
 *
 * Exit codes:
 *   0   dry-run succeeded (or live upload succeeded once implemented)
 *   1   bad args / missing env / payload not found
 *   2   live mode requested before implementation is ready
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { mode: "dry-run" };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--out") out.out = args[++i];
    else if (arg === "--live") out.mode = "live";
    else if (arg === "--dry-run") out.mode = "dry-run";
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
  node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \\
    --out docs/cms-components/lab-ui/dist/<slug> \\
    [--dry-run | --live]

Default mode: --dry-run. Prints what would be POSTed without hitting the network.

Required env vars (read at runtime, NOT bundled into the script):
  LANDING_API_KEY    primary credential
  LANDING_BASE_URL   e.g. https://cms.example.com/api/v1
  LANDING_ORG        tenant id or slug
Optional:
  LANDING_BEARER     bearer token alternative`;

const fail = (message, code = 1) => {
  console.error(`upload: ${message}`);
  process.exit(code);
};

const readPayload = (outDir) => {
  const file = join(outDir, "cms-family.payload.json");
  if (!existsSync(file)) fail(`Payload not found: ${file}. Run build-landing.mjs first.`);
  return JSON.parse(readFileSync(file, "utf8"));
};

const requireEnv = (name) => {
  const v = process.env[name];
  if (!v || !v.trim()) fail(`Missing required env: ${name}`);
  return v.trim();
};

const summarizePayload = (payload) => ({
  generatedAt: payload.generatedAt,
  mode: payload.mode,
  rootCode: payload.root?.code,
  rootName: payload.pageContext?.name || payload.root?.nls?.en?.NAME,
  childCount: (payload.children || []).length,
  totalTemplates: flatten(payload.children || []).length + 1,
  parameterCount: countParams(payload.root, payload.children),
});

const flatten = (templates = []) =>
  templates.flatMap((t) => [t, ...flatten(t.children || [])]);

const countParams = (root, children) => {
  const recur = (t) => (t.parameters?.length || 0) + (t.children || []).reduce((sum, c) => sum + recur(c), 0);
  return (root?.parameters?.length || 0) + (children || []).reduce((sum, c) => sum + recur(c), 0);
};

const headersFor = (env) => {
  const headers = {
    "content-type": "application/json",
    "x-api-key": env.LANDING_API_KEY,
    "x-org": env.LANDING_ORG,
  };
  if (env.LANDING_BEARER) headers.authorization = `Bearer ${env.LANDING_BEARER}`;
  return headers;
};

const targetUrl = (env, rootCode) => `${env.LANDING_BASE_URL.replace(/\/+$/, "")}/landings/${rootCode}`;

const printDryRun = (env, payload) => {
  const summary = summarizePayload(payload);
  console.log("\n=== upload-cms-family · DRY RUN ===\n");
  console.log("Payload summary:");
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(18)} ${v}`);

  console.log("\nTarget:");
  console.log(`  PUT ${targetUrl(env, summary.rootCode)}`);

  console.log("\nHeaders:");
  const h = headersFor(env);
  for (const [k, v] of Object.entries(h)) {
    const masked = (k === "x-api-key" || k === "authorization") ? maskSecret(v) : v;
    console.log(`  ${k}: ${masked}`);
  }

  console.log("\nBody:");
  console.log("  <cms-family.payload.json contents — root + children tree>");
  console.log(`  size: ${Buffer.byteLength(JSON.stringify(payload), "utf8")} bytes`);

  console.log("\nEquivalent curl:");
  console.log(`  curl -X PUT '${targetUrl(env, summary.rootCode)}' \\`);
  for (const [k, v] of Object.entries(h)) {
    const masked = (k === "x-api-key" || k === "authorization") ? "$" + k.toUpperCase().replace(/-/g, "_") : v;
    console.log(`    -H '${k}: ${masked}' \\`);
  }
  console.log(`    --data @cms-family.payload.json`);

  console.log("\nNo network call was made. Pass --live to actually upload (not yet implemented).\n");
};

const maskSecret = (value) => {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}…${value.slice(-2)}`;
};

const main = () => {
  const args = parseArgs();
  if (args.help || !args.out) {
    console.log(usage());
    process.exit(args.help ? 0 : 1);
  }

  const outAbs = resolve(args.out);
  if (!existsSync(outAbs)) fail(`Out dir not found: ${args.out}`);

  const env = {
    LANDING_API_KEY: requireEnv("LANDING_API_KEY"),
    LANDING_BASE_URL: requireEnv("LANDING_BASE_URL"),
    LANDING_ORG: requireEnv("LANDING_ORG"),
    LANDING_BEARER: process.env.LANDING_BEARER || "",
  };

  const payload = readPayload(outAbs);

  if (args.mode === "dry-run") {
    printDryRun(env, payload);
    return;
  }

  // --live mode placeholder. Real network calls are intentionally
  // gated behind explicit implementation work — the CMS API contract
  // (endpoint shape, idempotency keys, child-write order) is not yet
  // finalized. When ready, replace this block with the real fetch()
  // sequence and tests.
  fail(
    "Live upload is not implemented yet. The CMS API contract has not been wired. " +
    "Use --dry-run today; implement the live path once the CMS spec is locked.",
    2,
  );
};

main();
