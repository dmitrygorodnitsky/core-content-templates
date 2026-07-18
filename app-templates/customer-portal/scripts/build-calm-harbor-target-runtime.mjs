import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const portalRoot = path.resolve("app-templates/customer-portal");
const entry = path.join(portalRoot, "runtime/src/app.js");
const output = path.join(portalRoot, "runtime/manual/calm-harbor-target-runtime.js");
const candidates = [
  process.env.ESBUILD_BIN,
  path.resolve("../core-ui/node_modules/.bin/esbuild"),
  path.resolve("node_modules/.bin/esbuild"),
].filter(Boolean);
const esbuild = candidates.find((candidate) => fs.existsSync(candidate));

if (!esbuild) {
  throw new Error("esbuild was not found. Set ESBUILD_BIN or install it in the sibling core-ui workspace.");
}

const result = spawnSync(esbuild, [
  entry,
  "--bundle",
  "--format=iife",
  "--platform=browser",
  "--target=es2020",
  "--outfile=" + output,
], { stdio: "inherit" });

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log("build-calm-harbor-target-runtime ok: " + path.relative(process.cwd(), output));
