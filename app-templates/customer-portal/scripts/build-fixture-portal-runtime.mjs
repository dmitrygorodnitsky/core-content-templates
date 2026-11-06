import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const portalRoot = path.resolve("app-templates/customer-portal");
const entry = path.join(portalRoot, "runtime/src/app.js");

export function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    const match = /^--([a-zA-Z-]+)=(.*)$/.exec(arg);
    if (!match) throw new Error("Unsupported argument: " + arg);
    options[match[1]] = match[2];
  }
  if (!options.case) throw new Error("--case=<fixture-case-id> is required");
  if (!options.output) throw new Error("--output=<path> is required");
  return options;
}

function resolveEsbuild() {
  const candidates = [
    process.env.ESBUILD_MODULE,
    path.resolve("../core-ui/node_modules/esbuild/lib/main.js"),
    path.resolve("node_modules/esbuild/lib/main.js"),
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("esbuild was not found. Set ESBUILD_MODULE or install it in the sibling core-ui workspace.");
  return found;
}

export async function buildFixturePortalRuntime(options) {
  const { knownCaseIds } = await import(pathToFileURL(path.join(portalRoot, "runtime/data/case-fixtures.js")).href);
  if (!knownCaseIds.includes(options.case)) {
    throw new Error("Unknown fixture case " + options.case + ". Registered cases: " + knownCaseIds.join(", "));
  }
  const output = path.resolve(options.output);
  const esbuild = await import(pathToFileURL(resolveEsbuild()).href);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    outfile: output,
  });

  const bundled = fs.readFileSync(output, "utf8");
  assertFixtureBundle(bundled, options.case);
  return { output, bytes: Buffer.byteLength(bundled) };
}

export function assertFixtureBundle(bundled, caseId) {
  if (!bundled.includes(caseId)) {
    throw new Error("The fixture runtime does not contain case " + caseId + ". The live data boundary must not be aliased into a fixture build.");
  }
  const forbidden = [
    { token: "${", label: "JTE expression opener" },
    { token: "@{", label: "JTE code opener" },
    { token: "!{", label: "JTE unsafe-content opener" },
    { token: "<%", label: "server-template code opener" },
    { token: "<\/script", label: "inline script terminator" },
  ];
  for (const marker of forbidden) {
    const index = bundled.indexOf(marker.token);
    if (index !== -1) {
      const line = bundled.slice(0, index).split("\n").length;
      throw new Error("Refusing to emit a CMS-unsafe fixture runtime: " + marker.label + " " + JSON.stringify(marker.token) + " at line " + line);
    }
  }
  try {
    Function(bundled);
  } catch (error) {
    throw new Error("The fixture runtime is not syntactically valid: " + error.message);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  const result = await buildFixturePortalRuntime(options);
  console.log("build-fixture-portal-runtime ok: " + path.relative(process.cwd(), result.output) + " (" + result.bytes + " bytes, case " + options.case + ")");
}
