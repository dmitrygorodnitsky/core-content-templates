import { calmHarborSpaFixture } from "./cases/calm-harbor-spa.js";
import { graniteRidgeSnowFixture } from "./cases/granite-ridge-snow.js";

const cases = Object.freeze({
  "calm-harbor-spa": calmHarborSpaFixture,
  "granite-ridge-snow": graniteRidgeSnowFixture,
});

export const knownCaseIds = Object.freeze(Object.keys(cases));

export function caseFixtureFor(caseId) {
  return cases[String(caseId || "")] || null;
}

export function caseVerticalFor(caseId) {
  const fixture = caseFixtureFor(caseId);
  if (!fixture) return null;
  return fixture.vertical || (fixture.theme && fixture.theme.slug) || null;
}

export function cloneCaseValue(value) {
  return JSON.parse(JSON.stringify(value));
}
