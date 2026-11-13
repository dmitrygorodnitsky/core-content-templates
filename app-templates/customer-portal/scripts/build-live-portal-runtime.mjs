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

export const liveRuntimeVertical = "snow";

export function minifiedRuntimePath(runtimePath) {
  return runtimePath.replace(/\.js$/, ".min.js");
}

async function loadEsbuild() {
  return import(pathToFileURL(resolveEsbuild()).href);
}

function runtimeBuildOptions(vertical, minify) {
  return {
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    write: false,
    metafile: true,
    outfile: path.join(portalRoot, "runtime/manual/live-runtime.js"),
    define: vertical ? { "globalThis.__PORTAL_VERTICAL__": JSON.stringify(vertical) } : {},
    pure: ["Object.freeze", "Object.keys"],
    minify,
    legalComments: minify ? "none" : undefined,
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
  };
}

export async function bundleLivePortalRuntime(options = {}) {
  const esbuild = await loadEsbuild();
  const [readable, minified] = await Promise.all([false, true].map(async (minify) => {
    const result = await esbuild.build(runtimeBuildOptions(options.vertical, minify));
    return { text: result.outputFiles[0].text, metafile: result.metafile };
  }));
  assertLiveBundle(readable.text);
  if (JSON.stringify(bundledInputs(readable.metafile)) !== JSON.stringify(bundledInputs(minified.metafile))) {
    throw new Error("The readable and the minified live runtime did not bundle the same source");
  }
  return { readable, minified };
}

export function bundledInputs(metafile) {
  const [output] = Object.values(metafile.outputs);
  return Object.keys(output.inputs).sort().map((input) => [input, metafile.inputs[input].bytes]);
}

export async function minifyStylesheet(css) {
  const esbuild = await loadEsbuild();
  return (await esbuild.transform(css, { loader: "css", minify: true, legalComments: "none" })).code;
}

export async function buildLivePortalRuntime(options) {
  if (!options || !options.output) throw new Error("--output=<path> is required");
  const output = path.resolve(options.output);
  const { readable, minified } = await bundleLivePortalRuntime({ vertical: options.vertical });
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, readable.text);
  const result = { output, bytes: Buffer.byteLength(readable.text) };
  if (options.minifiedOutput) {
    result.minifiedOutput = path.resolve(options.minifiedOutput);
    fs.writeFileSync(result.minifiedOutput, minified.text);
    result.minifiedBytes = Buffer.byteLength(minified.text);
  }
  return result;
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
