import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const portalRoot = path.resolve("app-templates/customer-portal");
const entry = path.join(portalRoot, "runtime/src/app.js");
const output = path.join(portalRoot, "runtime/manual/calm-harbor-target-runtime.js");
const candidates = [
  process.env.ESBUILD_MODULE,
  path.resolve("../core-ui/node_modules/esbuild/lib/main.js"),
  path.resolve("node_modules/esbuild/lib/main.js"),
].filter(Boolean);
const esbuildModule = candidates.find((candidate) => fs.existsSync(candidate));

if (!esbuildModule) {
  throw new Error("esbuild was not found. Set ESBUILD_MODULE or install it in the sibling core-ui workspace.");
}

const productionAliases = new Map([
  ["fixtures.js", path.join(portalRoot, "runtime/data/live-fixtures.js")],
  ["case-fixtures.js", path.join(portalRoot, "runtime/data/live-case-fixtures.js")],
  ["spa-product-catalog.js", path.join(portalRoot, "runtime/data/live-spa-product-catalog.js")],
  ["care-fixtures.js", path.join(portalRoot, "runtime/data/live-care-fixtures.js")],
  ["seo-fixtures.js", path.join(portalRoot, "runtime/data/live-seo-fixtures.js")],
]);

const esbuild = await import(pathToFileURL(esbuildModule).href);
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

const bundledSource = fs.readFileSync(output, "utf8");
const forbiddenFixtureMarkers = [
  "runtime/data/fixtures.js",
  "runtime/data/cases/",
  "runtime/data/spa-product-catalog.js",
  "runtime/data/care-fixtures.js",
  "runtime/data/seo-fixtures.js",
  "mia.chen@example.com",
  "Priya S.",
  "Same-day slots in your area",
  "fixture organization",
];
const leakedMarker = forbiddenFixtureMarkers.find((marker) => bundledSource.includes(marker));
if (leakedMarker) throw new Error("Fixture data leaked into the live CMS runtime: " + leakedMarker);

console.log("build-calm-harbor-target-runtime ok: " + path.relative(process.cwd(), output));
