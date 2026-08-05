// Production CMS builds never resolve a local case fixture.
export const knownCaseIds = Object.freeze([]);

export function caseFixtureFor() {
  return null;
}

export function cloneCaseValue(value) {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}
