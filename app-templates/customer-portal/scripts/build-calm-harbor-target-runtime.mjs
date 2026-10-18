import path from "node:path";
import process from "node:process";
import { buildLivePortalRuntime } from "./build-live-portal-runtime.mjs";

const output = path.resolve("app-templates/customer-portal/runtime/manual/calm-harbor-target-runtime.js");

await buildLivePortalRuntime({ output });

console.log("build-calm-harbor-target-runtime ok: " + path.relative(process.cwd(), output));
