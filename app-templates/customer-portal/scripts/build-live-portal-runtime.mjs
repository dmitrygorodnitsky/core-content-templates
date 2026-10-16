import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const portalRoot = path.resolve("app-templates/customer-portal");
const entry = path.join(portalRoot, "runtime/src/app.js");

const productionAliases = new Map([
  ["fixtures.js", path.join(portalRoot, "runtime/data/live-fixtures.js")],
  ["case-fixtures.js", path.join(portalRoot, "runtime/data/live-case-fixtures.js")],
  ["spa-product-catalog.js", path.join(portalRoot, "runtime/data/live-spa-product-catalog.js")],
  ["care-fixtures.js", path.join(portalRoot, "runtime/data/live-care-fixtures.js")],
  ["seo-fixtures.js", path.join(portalRoot, "runtime/data/live-seo-fixtures.js")],
]);

export const liveFixtureMarkers = Object.freeze([
  "runtime/data/fixtures.js",
  "runtime/data/cases/",
  "runtime/data/spa-product-catalog.js",
  "runtime/data/care-fixtures.js",
  "runtime/data/seo-fixtures.js",
  "mia.chen@example.com",
  "Priya S.",
  "Same-day slots in your area",
  "fixture organization",
]);

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

export async function buildLivePortalRuntime(options) {
  if (!options || !options.output) throw new Error("--output=<path> is required");
  const output = path.resolve(options.output);
  const esbuild = await import(pathToFileURL(resolveEsbuild()).href);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    outfile: output,
    plugins: [{
      name: "live-data-boundary",
      setup(build) {
        build.onResolve({ filter: /(?:^|\/)data\/(?:fixtures|case-fixtures|spa-product-catalog|care-fixtures|seo-fixtures)\.js$/ }, (args) => {
          const name = path.basename(args.path);
          const replacement = productionAliases.get(name);
          return replacement ? { path: replacement } : null;
        });
      },
    }],
  });

  const bundled = fs.readFileSync(output, "utf8");
  assertLiveBundle(bundled);
  return { output, bytes: Buffer.byteLength(bundled) };
}

export function assertLiveBundle(bundled) {
  const leakedMarker = liveFixtureMarkers.find((marker) => bundled.includes(marker));
  if (leakedMarker) throw new Error("Fixture data leaked into the live CMS runtime: " + leakedMarker);
}

function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    const match = /^--(output)=(.*)$/.exec(arg);
    if (!match) throw new Error("Unsupported argument: " + arg);
    options[match[1]] = match[2];
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await buildLivePortalRuntime(parseArgs(process.argv.slice(2)));
  console.log("build-live-portal-runtime ok: " + path.relative(process.cwd(), result.output) + " (" + result.bytes + " bytes)");
}
