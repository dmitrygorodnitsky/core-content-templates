import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../../js/dynamic-form.js", import.meta.url), "utf8");

const loadDynamicForm = (pageUrl) => {
  const window = { location: new URL(pageUrl) };
  const context = vm.createContext({ window, URLSearchParams, URL, console });
  vm.runInContext(source, context);
  return window.DynamicForm;
};

const formType = ({ rootCodes = [], parentCodes = [] } = {}) => ({
  id: 17,
  attributes: rootCodes.map((code) => ({ code, className: "java.lang.String" })),
  parents: parentCodes.length
    ? [{ id: 13, attributes: parentCodes.map((code) => ({ code, className: "java.lang.String" })) }]
    : [],
});

const mergedOn = (pageUrl, schema, presetAttributes) => {
  const DynamicForm = loadDynamicForm(pageUrl);
  const form = new DynamicForm({ presetAttributes });
  form._schema = schema;
  return form._mergePresetValues({ FULL_NAME: "Test Person" });
};

test("keeps the cta_source value as it is", () => {
  const DynamicForm = loadDynamicForm("https://servicewand.com/");
  assert.equal(DynamicForm._ctaSourceFromSearch("?cta_source=hero_demo"), "hero_demo");
});

test("appends plan, period, packs and weather in a fixed order", () => {
  const DynamicForm = loadDynamicForm("https://servicewand.com/");
  assert.equal(
    DynamicForm._ctaSourceFromSearch("?weather=1&cta_source=pricing_subscribe&packs=2&plan=SERVICEWAND_GROWTH&period=MONTHLY&utm_source=x"),
    "pricing_subscribe; plan=SERVICEWAND_GROWTH; period=MONTHLY; packs=2; weather=1",
  );
});

test("returns nothing without cta_source even when plan is present", () => {
  const DynamicForm = loadDynamicForm("https://servicewand.com/");
  assert.equal(DynamicForm._ctaSourceFromSearch("?plan=SERVICEWAND_GROWTH"), "");
  assert.equal(DynamicForm._ctaSourceFromSearch(""), "");
  assert.equal(DynamicForm._ctaSourceFromSearch("?cta_source=%3C%3E%22"), "");
});

test("strips markup and caps every part and the whole value", () => {
  const DynamicForm = loadDynamicForm("https://servicewand.com/");
  assert.equal(
    DynamicForm._ctaSourceFromSearch("?cta_source=%3Cscript%3Ealert(1)%3C/script%3E"),
    "scriptalert1script",
  );
  const long = "a".repeat(500);
  const value = DynamicForm._ctaSourceFromSearch(`?cta_source=${long}&plan=${long}&period=${long}&packs=${long}&weather=${long}`);
  assert.equal(value.split("; ")[0].length, 64);
  assert.ok(value.length <= 255);
});

test("fills CTA_SOURCE from a language-prefixed page URL when the form type declares it", () => {
  const merged = mergedOn(
    "https://servicewand.com/fr/snow-removal-request-demo.html?cta_source=pricing_subscribe&plan=SERVICEWAND_FOUNDATION",
    formType({ rootCodes: ["FULL_NAME", "CTA_SOURCE"] }),
  );
  assert.equal(merged.CTA_SOURCE, "pricing_subscribe; plan=SERVICEWAND_FOUNDATION");
});

test("fills CTA_SOURCE declared on a parent type", () => {
  const merged = mergedOn(
    "https://servicewand.com/partner.html?code=X&cta_source=lawn_care_partner",
    formType({ rootCodes: ["PARTNER_TYPE"], parentCodes: ["CTA_SOURCE"] }),
  );
  assert.equal(merged.CTA_SOURCE, "lawn_care_partner");
});

test("leaves forms without a CTA_SOURCE attribute untouched", () => {
  const merged = mergedOn(
    "https://servicewand.com/request-quote.html?cta_source=hero_demo",
    formType({ rootCodes: ["FULL_NAME"] }),
  );
  assert.deepEqual(Object.keys(merged), ["FULL_NAME"]);
});

test("sends no CTA_SOURCE when the page URL carries no cta_source", () => {
  const merged = mergedOn(
    "https://servicewand.com/snow-removal-request-demo.html",
    formType({ rootCodes: ["FULL_NAME", "CTA_SOURCE"] }),
  );
  assert.equal("CTA_SOURCE" in merged, false);
});

test("an explicit preset CTA_SOURCE wins over the page URL", () => {
  const merged = mergedOn(
    "https://servicewand.com/snow-removal-request-demo.html?cta_source=hero_demo",
    formType({ rootCodes: ["FULL_NAME", "CTA_SOURCE"] }),
    { CTA_SOURCE: "set_by_page" },
  );
  assert.equal(merged.CTA_SOURCE, "set_by_page");
});

test("the submit body groups CTA_SOURCE under the type that declares it", async () => {
  const DynamicForm = loadDynamicForm("https://servicewand.com/field-service-early-access.html?cta_source=lawn_care_notify");
  const form = new DynamicForm({ dryRun: true, organizationId: 2 });
  form._schema = formType({ rootCodes: ["FULL_NAME", "CTA_SOURCE"] });
  const body = await form._createForm(form._mergePresetValues({ FULL_NAME: "Test Person" }));
  assert.deepEqual(JSON.parse(JSON.stringify(body.attributes)), {
    17: { FULL_NAME: { value: "Test Person" }, CTA_SOURCE: { value: "lawn_care_notify" } },
  });
});
