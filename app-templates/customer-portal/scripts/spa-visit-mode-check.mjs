import assert from "node:assert/strict";
import { spaVisitModeClass, spaVisitModeLabel } from "../runtime/src/normalizers/spa-visit-mode.js";

assert.equal(spaVisitModeLabel("STUDIO", {}), "At Calm Harbor");
assert.equal(spaVisitModeLabel("salon", { salon: "At the configured studio" }), "At the configured studio");
assert.equal(spaVisitModeLabel("HOME", {}), "At your place");
assert.equal(spaVisitModeLabel(undefined, {}), "Visit location pending");
assert.equal(spaVisitModeLabel("BACKEND_ONLY_CODE", {}), "Visit location pending");
assert.equal(spaVisitModeClass("STUDIO"), "studio");
assert.equal(spaVisitModeClass(undefined), "pending");

console.log("spa-visit-mode-check ok");
