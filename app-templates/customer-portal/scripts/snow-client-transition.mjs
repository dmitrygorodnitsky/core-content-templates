import assert from "node:assert/strict";

export const legacyClientTypes = Object.freeze(["SNOW_RESIDENTIAL_CUSTOMER", "SNOW_COMMERCIAL_CUSTOMER", "SNOW_PROPERTY_MANAGER"]);
const obsoleteCopies = new Set(["BILLING_ADDRESS", "REPRESENTATIVE_FIRST_NAME", "REPRESENTATIVE_LAST_NAME", "REPRESENTATIVE_JOB_TITLE", "REPRESENTATIVE_EMAIL", "REPRESENTATIVE_PHONE"]);
const empty = (value) => value == null || value === "" || (typeof value === "object" && Object.hasOwn(value, "value") && empty(value.value));

// A plan contains private Account data. Keep it outside Git with its source snapshot.
export function planClientTransition(accounts, types, contactTypes, { organizationCodes } = {}) {
  assert.ok(Array.isArray(organizationCodes) && organizationCodes.length, "Explicit migration organization scope is required");
  const client = types.find((t) => t.code === "CUSTOMER");
  const legal = contactTypes.find((t) => t.code === "LEGAL");
  assert.ok(client && !client.isAbstract && legal, "Client and LEGAL configuration required");
  assert.equal(client.workflow?.code, "CLIENT_ACCOUNT_LIFECYCLE");
  const seen = new Set();
  return accounts.map((source) => {
    assert.ok(organizationCodes.includes(source.organization?.code), "Account organization is outside the transition");
    assert.ok(Number.isInteger(source.id) && !seen.has(source.id), "Duplicate or missing Account identity");
    seen.add(source.id);
    const legacy = legacyClientTypes.includes(source.type?.code);
    assert.ok(legacy || source.type?.code === "CUSTOMER", "Account is outside the transition");
    assert.equal(source.workflow?.id, client.workflow.id, "Refusing a workflow change");
    const goal = structuredClone(source);
    if (legacy) {
      const own = goal.attributes?.[source.type.id] || {};
      const notes = own.CUSTOMER_NOTES?.value;
      if (!empty(notes)) {
        assert.equal(typeof notes, "string", "Notes must be text");
        goal.nls ||= {};
        goal.nls.en ||= {};
        const existing = goal.nls.en.DESCRIPTION || "";
        assert.equal(typeof existing, "string");
        goal.nls.en.DESCRIPTION = !existing ? notes : existing === notes || existing.endsWith("\n\n" + notes) ? existing : existing + "\n\n" + notes;
      }
      for (const [code, value] of Object.entries(own)) {
        assert.ok(code === "CUSTOMER_NOTES" || obsoleteCopies.has(code) || empty(value), "Unmapped legacy Account attribute: " + code);
      }
      goal.attributes = structuredClone(goal.attributes || {});
      delete goal.attributes[source.type.id];
      goal.type = structuredClone(client);
    }
    const legalContacts = (goal.contacts || []).filter((c) => c.type?.code === "LEGAL");
    const primaryContacts = (goal.contacts || []).filter((c) => c.type?.code === "PRIMARY");
    assert.ok(legalContacts.length <= 1, "Ambiguous LEGAL contacts");
    if (!legalContacts.length && primaryContacts.length) {
      assert.equal(primaryContacts.length, 1, "Ambiguous PRIMARY contacts need operator reconciliation");
      primaryContacts[0].type = structuredClone(legal);
    }
    const fields = [];
    if (legacy) fields.push("type", "nls", "attributes");
    if (JSON.stringify(goal.contacts) !== JSON.stringify(source.contacts)) fields.push("contacts");
    return { id: source.id, before: source, after: goal, fields };
  });
}

export function verifyClientTransition(row, after) {
  for (const key of Object.keys(row.before)) {
    if (key === "optimistic") continue;
    if (key === "type" && row.fields.includes("type")) {
      assert.equal(after.type?.id, row.after.type.id);
      assert.equal(after.type?.code, "CUSTOMER");
    } else {
      assert.deepEqual(after[key], row.after[key], "Unexpected mutation of Account " + row.id + "." + key);
    }
  }
}
