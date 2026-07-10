import { F } from "../../data/fixtures.js";
import { verticalProfiles } from "../config.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createCareFixtureAdapter() {
  return {
    async load(moduleId, context) {
      if (moduleId !== "care") throw new Error("Care fixture adapter only supports care");
      const { careFixtures } = await import("../../data/care-fixtures.js");
      var vertical = verticalProfiles[context.config.vertical];
      var displayName = vertical && vertical.displayName;
      var fixture = careFixtures[displayName];
      if (!fixture) throw new Error("Care fixture is unavailable for configured vertical");
      var requestedState = context.state.carePayloadState;
      var stateName = requestedState === undefined ? "ready" : requestedState;
      if (!["ready", "loading", "empty", "error"].includes(stateName)) {
        throw new Error("Unsupported Care payload state");
      }
      return {
        vertical: context.config.vertical,
        state: stateName,
        emptyState: clone(fixture.empty),
        fixture: stateName === "ready" ? clone(fixture) : null,
        products: stateName === "ready" ? clone((F.themes[displayName] && F.themes[displayName].products) || []) : [],
      };
    },
  };
}
