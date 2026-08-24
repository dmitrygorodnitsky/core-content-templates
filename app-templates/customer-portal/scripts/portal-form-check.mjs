import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve("app-templates/customer-portal");
const source = await fs.readFile(path.join(root, "runtime/forms/portal-form.js"), "utf8");
const css = await fs.readFile(path.join(root, "runtime/forms/portal-form.css"), "utf8");

const sandbox = { window: {}, document: { createElement: () => ({ setAttribute() {}, classList: { add() {} } }) } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const PortalForm = sandbox.window.PortalForm;
assert.ok(PortalForm, "the renderer must expose PortalForm");

const { parseTokens, javaType, applyMask, maskComplete, normalizeSchema, parseBehavior } = PortalForm;

const plain = (value) => JSON.parse(JSON.stringify(value === undefined ? null : value));

assert.equal(javaType("java.lang.Boolean"), "boolean");
assert.equal(javaType("boolean"), "boolean");
assert.equal(javaType("java.lang.Integer"), "number");
assert.equal(javaType("java.math.BigDecimal"), "number");
assert.equal(javaType("java.lang.String"), "string");
assert.equal(javaType("com.servicewand.core.User"), "entity");
assert.equal(javaType(""), "entity");

const flags = parseTokens("password textarea expanded slider tel url email color date");
for (const flag of ["password", "textarea", "expanded", "slider", "tel", "url", "email", "color", "date"]) {
  assert.equal(flags[flag], true, flag + " must parse as a flag");
}

const numeric = parseTokens("rows:6 cols:80 min:1 max:40 step:2 minLength:8 maxLength:120");
assert.deepEqual(
  plain([numeric.rows, numeric.cols, numeric.min, numeric.max, numeric.step, numeric.minLength, numeric.maxLength]),
  [6, 80, 1, 40, 2, 8, 120],
);

assert.equal(parseTokens("placeholder:Tell us more").placeholder, "Tell us more", "a placeholder may contain spaces");
assert.equal(parseTokens("re:^[A-Z]\\d$").re, "^[A-Z]\\d$");
assert.equal(parseTokens("mask:A9A 9A9").mask, "A9A 9A9", "a mask may contain spaces");
assert.equal(parseTokens("mask:A9A 9A9; textarea").mask, "A9A 9A9", "a semicolon terminates a mask");
assert.equal(parseTokens("mask:A9A 9A9; textarea").textarea, true, "tokens after a terminated mask still parse");
const combined = parseTokens("re:^[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d$ mask:A9A 9A9; placeholder:K1A 0B1");
assert.equal(combined.mask, "A9A 9A9");
assert.equal(combined.re, "^[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d$");
assert.equal(combined.placeholder, "K1A 0B1");
assert.equal(parseTokens("").mask, null);
assert.equal(parseTokens(undefined).placeholder, null);

assert.equal(applyMask("k1a0b1", "A9A 9A9"), "K1A 0B1", "letter slots normalize case and literals are inserted");
assert.equal(applyMask("13035550164", "+9 (999) 999-9999"), "+1 (303) 555-0164");
assert.equal(applyMask("abc", "999"), "", "a digit slot rejects letters");
assert.equal(applyMask("", "A9A"), "");
assert.equal(maskComplete("K1A 0B1", "A9A 9A9"), true);
assert.equal(maskComplete("K1A 0", "A9A 9A9"), false);

assert.deepEqual(plain(parseBehavior('applyBehavior({ COMMERCIAL: "CONDITIONAL" });')), { COMMERCIAL: "CONDITIONAL" });
assert.deepEqual(plain(parseBehavior("applyBehavior({ commercial: 'STEP_B' })")), { COMMERCIAL: "STEP_B" });
assert.equal(parseBehavior("hideStep('X'); window.location='/'"), null, "only a declarative applyBehavior mapping is honoured");
assert.equal(parseBehavior(""), null);
assert.equal(parseBehavior(null), null);
assert.doesNotMatch(source, /\bnew Function\b|\beval\(/, "the renderer must never execute server-supplied code");

const kitchen = JSON.parse(await fs.readFile(path.join(root, "content/form-types/PORTAL_FORM_KITCHEN_SINK.en.json"), "utf8"));
const sink = normalizeSchema(kitchen, "en");
const kinds = {};
sink.groups.forEach((group) => group.fields.forEach((field) => { kinds[field.code] = field.kind; }));
assert.deepEqual(kinds, {
  PLAIN_TEXT: "text", EMAIL: "email", PHONE: "tel", WEBSITE: "url", POSTAL_CODE: "text",
  START_DATE: "date", BRAND_COLOR: "color", SECRET: "password", LONG_TEXT: "textarea",
  CREW_SIZE: "number", BUDGET: "slider", SITE_COUNT: "number",
  PROPERTY_TYPE: "select", TRIGGER: "radio", SURFACES: "multiselect", EXTRAS: "checklist",
  REFERRAL: "combobox", ACCOUNT_MANAGER: "select", ACCEPT_TERMS: "boolean",
  LOADING_DOCKS: "boolean",
}, "the fixture must exercise every renderable kind");

const covered = new Set(Object.values(kinds));
for (const kind of ["text", "textarea", "password", "email", "tel", "url", "color", "date", "number", "slider", "boolean", "select", "multiselect", "radio", "checklist", "combobox"]) {
  assert.ok(covered.has(kind), "kind " + kind + " is not covered by the fixture");
}

assert.deepEqual(plain(sink.groups.map((group) => group.code)), ["TEXTS", "NUMBERS", "CHOICES", "CONDITIONAL"]);
const propertyType = sink.groups[2].fields.find((field) => field.code === "PROPERTY_TYPE");
assert.deepEqual(plain(propertyType.behavior), { COMMERCIAL: "CONDITIONAL" });
const postal = sink.groups[0].fields.find((field) => field.code === "POSTAL_CODE");
assert.equal(postal.mask, "A9A 9A9");
assert.equal(postal.placeholder, "K1A 0B1");
sink.groups.forEach((group) => group.fields.forEach((field) => {
  assert.equal(field.typeId, kitchen.id, "a root attribute keeps the root type id");
}));

const quote = JSON.parse(await fs.readFile(path.join(root, "content/form-types/GET_QUOTE_.en.json"), "utf8"));
const live = normalizeSchema(quote, "en");
assert.equal(live.id, 2);
assert.equal(live.title, "Get Your Free Quote");
assert.deepEqual(
  plain(live.groups.map((group) => group.code)),
  ["EA849F15_9108_455F_9A05_F26BED67E5CD", "C9C8004F_EFF7_470F_B924_5719E91A5E4C", "NOTES"],
  "attributeOrder decides group order, not attributeGroups",
);
assert.deepEqual(
  plain(live.groups.map((group) => group.fields.map((field) => field.code))),
  [
    ["SELECT_YOUR_PROPERTY_TYPE", "PROPERTY_ADDRESS", "RISK_FACTORS", "PROPERTY_SIZE"],
    ["SELECT_ROLE", "FIRST_NAME", "LAST_NAME", "EMAIL", "PHONE"],
    ["ADDITIONAL_NOTES"],
  ],
);
const risk = live.groups[0].fields.find((field) => field.code === "RISK_FACTORS");
assert.equal(risk.kind, "select", "RISK_FACTORS is multiselect:false in the published schema and must render as one choice");
assert.equal(risk.choices.length, 6);
assert.equal(risk.label, "Winter risk factors (select all that apply)*");
let requiredCount = 0;
live.groups.forEach((group) => group.fields.forEach((field) => { if (field.required) requiredCount += 1; }));
assert.equal(requiredCount, 0, "no attribute in the published schema declares required:true");

const parented = normalizeSchema({
  id: 10,
  nls: { en: { NAME: "Child" } },
  attributes: [{ code: "OWN", className: "java.lang.String", nls: { en: { NAME: "Own" } }, options: [] }],
  attributeGroups: [{ code: "G1", nls: { en: { NAME: "Group one" } } }],
  parents: [{
    id: 11,
    attributes: [{ code: "INHERITED", className: "java.lang.String", nls: { en: { NAME: "Inherited" } }, options: [] }],
    attributeGroups: [{ code: "G2", nls: { en: { NAME: "Group two" } } }],
  }],
  attributeOrder: [
    { G1: [{ attributeCode: "OWN", visible: true }] },
    { G2: [{ attributeCode: "INHERITED", visible: true }] },
  ],
}, "en");
assert.deepEqual(plain(parented.groups.map((group) => group.code)), ["G1", "G2"]);
assert.equal(parented.groups[0].fields[0].typeId, 10);
assert.equal(parented.groups[1].fields[0].typeId, 11, "an inherited attribute submits under its parent type id");
assert.equal(parented.groups[1].title, "Group two", "a parent group title resolves");

const hidden = normalizeSchema({
  id: 12, nls: {}, attributes: [
    { code: "SHOWN", className: "java.lang.String", nls: {}, options: [] },
    { code: "HIDDEN", className: "java.lang.String", nls: {}, options: [] },
    { code: "LOOSE", className: "java.lang.String", nls: {}, options: [] },
  ],
  attributeGroups: [{ code: "G", nls: {} }],
  attributeOrder: [{ G: [{ attributeCode: "SHOWN", visible: true }, { attributeCode: "HIDDEN", visible: false }] }],
}, "en");
assert.deepEqual(plain(hidden.groups.map((group) => group.code)), ["G", "__ungrouped"]);
assert.deepEqual(plain(hidden.groups[0].fields.map((field) => field.code)), ["SHOWN"], "visible:false is not rendered");
assert.deepEqual(plain(hidden.groups[1].fields.map((field) => field.code)), ["HIDDEN", "LOOSE"], "attributes outside attributeOrder still render");

const localeFallback = normalizeSchema({
  id: 13, nls: { ru: { NAME: "Форма" } },
  attributes: [{ code: "A", className: "java.lang.String", nls: { ru: { NAME: "Поле" } }, options: [{ value: "V", nls: { ru: { NAME: "Вариант" }, en: { NAME: "Option" } } }] }],
  attributeGroups: [], attributeOrder: [],
}, "ru");
assert.equal(localeFallback.title, "Форма");
assert.equal(localeFallback.groups[0].fields[0].label, "Поле");
assert.equal(localeFallback.groups[0].fields[0].choices[0].label, "Вариант");

assert.doesNotMatch(source, /innerHTML/, "the renderer must not assign innerHTML");
assert.doesNotMatch(source, /dev-1\.servicewand\.com|lsrc\.pixelnation\.com/, "the renderer must not hardcode a deployment host");
assert.match(source, /credentials: "omit"/, "form requests stay anonymous");
assert.equal((source.match(/credentials: "omit"/g) || []).length, 2, "both the schema read and the submit stay anonymous");

for (const token of ["--accent", "--ink", "--surface", "--hair", "--radius-md", "--danger"]) {
  assert.ok(css.includes("var(" + token), "the stylesheet must build on the portal token " + token);
}
assert.doesNotMatch(css, /#[0-9a-f]{6}(?![0-9a-f])/i, "no raw hex colour may bypass the theme tokens");
assert.doesNotMatch(css, /\.df-/, "the portal renderer must not depend on the corporate form stylesheet");

console.log("portal-form-check ok: 16 field kinds, token DSL with spaced masks, attributeOrder authority, parent type ids, declarative behaviour only, anonymous requests, token-driven theming");
