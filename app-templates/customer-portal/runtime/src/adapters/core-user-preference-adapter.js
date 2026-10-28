import { requestContext } from "./core-profile-form-adapter.js";

export function createCoreUserPreferenceAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  return {
    async overwrite(key, value, context) {
      var api = requestContext(context);
      var response = await fetchImpl(api.coreBase + "/api/user/preference.json", {
        method: "PUT",
        credentials: "same-origin",
        headers: api.headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ key: key, value: JSON.stringify(value) }),
      });
      return !!(response && response.ok);
    },
  };
}
