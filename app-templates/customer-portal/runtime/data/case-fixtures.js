import { calmHarborSpaFixture } from "./cases/calm-harbor-spa.js";

const cases = Object.freeze({ "calm-harbor-spa": calmHarborSpaFixture });

export const knownCaseIds = Object.freeze(Object.keys(cases));

export function caseFixtureFor(caseId) {
  return cases[String(caseId || "")] || null;
}

export function cloneCaseValue(value) {
  return JSON.parse(JSON.stringify(value));
}
