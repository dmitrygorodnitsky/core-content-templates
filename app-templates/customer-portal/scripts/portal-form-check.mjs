import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve("app-templates/customer-portal");
const source = await fs.readFile(path.join(root, "runtime/forms/portal-form.js"), "utf8");
const css = await fs.readFile(path.join(root, "runtime/forms/portal-form.css"), "utf8");

function createDom() {
  const byId = new Map();
  const dom = { activeElement: null };
  const holds = (outer, node) => { for (let current = node; current; current = current.parentNode) if (current === outer) return true; return false; };
  const make = (tag) => {
    const node = {
      tagName: String(tag).toUpperCase(),
      className: "", textContent: "", hidden: false,
      children: [], attributes: {}, dataset: {}, listeners: {}, parentNode: null,
      classList: { add() {} },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
        if (name === "id") this.id = String(value);
        if (name === "hidden") this.hidden = true;
        if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
      },
      getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; },
      removeAttribute(name) { delete this.attributes[name]; },
      appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
      insertBefore(child, before) {
        const at = this.children.indexOf(before);
        child.parentNode = this;
        this.children.splice(at === -1 ? this.children.length : at, 0, child);
        return child;
      },
      replaceChildren() {
        const lost = this.children.some((child) => holds(child, dom.activeElement)) ? dom.activeElement : null;
        if (lost) {
          dom.activeElement = null;
          lost.fire("blur", { relatedTarget: null });
          for (let current = lost; current; current = current.parentNode) current.fire("focusout", { relatedTarget: null });
        }
        this.children.forEach((child) => { child.parentNode = null; });
        this.children = [];
      },
      addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
      removeEventListener() {},
      focus() { dom.activeElement = this; },
      fire(type, event) { (this.listeners[type] || []).slice().forEach((fn) => fn.call(this, event || {})); },
      querySelector() { return null; },
    };
    let id = "";
    Object.defineProperty(node, "id", { get: () => id, set(value) { id = String(value); byId.set(id, node); }, enumerable: true });
    return node;
  };
  const documentListeners = {};
  dom.document = {
    head: make("head"),
    createElement: make,
    getElementById: (value) => byId.get(String(value)) || null,
    querySelector: () => null,
    addEventListener(type, fn) { (documentListeners[type] = documentListeners[type] || []).push(fn); },
    fire(type, event) { (documentListeners[type] || []).slice().forEach((fn) => fn(event || {})); },
    get activeElement() { return dom.activeElement; },
  };
  return dom;
}

function collect(node, className) {
  const found = [];
  const walk = (candidate) => {
    if (String(candidate.className).split(/\s+/).includes(className)) found.push(candidate);
    candidate.children.forEach(walk);
  };
  walk(node);
  return found;
}

const dom = createDom();
const posted = [];
const timers = new Map();
let timerSeq = 0;
const runTimers = () => {
  const due = [...timers.values()];
  timers.clear();
  due.forEach((timer) => timer.fn());
};
const runZeroDelayTimers = () => {
  const due = [...timers.entries()].filter(([, timer]) => timer.delay === 0);
  due.forEach(([id]) => timers.delete(id));
  due.forEach(([, timer]) => timer.fn());
};
const settle = () => new Promise((resolve) => setImmediate(resolve));
const librariesLoaded = async () => { await settle(); await settle(); };
const sandbox = {
  window: {},
  document: dom.document,
  setTimeout(fn, delay) { timerSeq += 1; timers.set(timerSeq, { fn, delay: Number(delay) || 0 }); return timerSeq; },
  clearTimeout(id) { timers.delete(id); },
  fetch(url, init) {
    posted.push({ url, init });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ id: 7 }) });
  },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const PortalForm = sandbox.window.PortalForm;
assert.ok(PortalForm, "the renderer must expose PortalForm");

const copyEcho = new Proxy({}, { get: (_, key) => String(key) });

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
assert.equal(parseTokens("address").address, true);
assert.deepEqual(plain(parseTokens("address country:us,ca").country), ["us", "ca"]);
assert.equal(parseTokens("address").country, null, "country restriction stays optional");
assert.equal(parseTokens("coordinates-of:PROPERTY_ADDRESSES").coordinatesOf, "PROPERTY_ADDRESSES");
assert.equal(parseTokens("address").coordinatesOf, null, "only a declared link derives coordinates");
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
  LOADING_DOCKS: "boolean", SITE_ADDRESS: "address",
}, "the fixture must exercise every renderable kind");

const KINDS = ["text", "textarea", "password", "email", "tel", "url", "color", "date", "number", "slider", "boolean", "select", "multiselect", "radio", "checklist", "combobox", "address", "address-list"];
const covered = new Set(Object.values(kinds));
for (const kind of KINDS.filter((kind) => kind !== "address-list")) {
  assert.ok(covered.has(kind), "kind " + kind + " is not covered by the fixture");
}
assert.equal(covered.has("address-list"), false, "the fixture declares no multiselect address, so its SITE_ADDRESS must stay the single-value kind");

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
  ["C9C8004F_EFF7_470F_B924_5719E91A5E4C", "PROPERTIES", "NOTES"],
  "attributeOrder decides group order, not attributeGroups, and a group whose every row names a deleted attribute renders not at all",
);
assert.deepEqual(
  plain(live.groups.map((group) => group.fields.map((field) => field.code))),
  [
    ["ORGANIZATION_NAME", "SELECT_ROLE", "FIRST_NAME", "LAST_NAME", "EMAIL", "PHONE"],
    ["PROPERTY_ADDRESSES"],
    ["ADDITIONAL_NOTES"],
  ],
);
assert.deepEqual(
  plain(live.groups.map((group) => group.fields.map((field) => field.kind))),
  [["text", "select", "text", "text", "email", "tel"], ["address-list"], ["textarea"]],
  "inputFormat drives the control: address, email, tel and textarea are declared by the published schema",
);
const addresses = live.groups[1].fields[0];
assert.equal(addresses.multiselect, true, "PROPERTY_ADDRESSES is the repeating field the published type declares");
assert.equal(addresses.required, true);
assert.equal(addresses.choices.length, 0, "the repeating address is free text, not a pick list");
assert.equal(addresses.tokens.address, true);
assert.equal(addresses.label, "Addresses of properties");
assert.equal(live.groups[1].title, "Real estate properties");
const published = new Set();
live.groups.forEach((group) => group.fields.forEach((field) => published.add(field.code)));
for (const retired of ["PROPERTY_ADDRESS", "PROPERTY_SIZE", "RISK_FACTORS", "SELECT_YOUR_PROPERTY_TYPE"]) {
  assert.equal(published.has(retired), false, retired + " no longer exists on the published form type");
}
let requiredCount = 0;
live.groups.forEach((group) => group.fields.forEach((field) => { if (field.required) requiredCount += 1; }));
assert.equal(requiredCount, 7, "every attribute but ADDITIONAL_NOTES declares required:true");

const repeat = new PortalForm({ schema: quote, locale: "en", copy: copyEcho, organizationId: 43, apiBaseUrl: "https://forms.example" });
const mounted = dom.document.createElement("div");
repeat.mount(mounted);
await Promise.resolve();
repeat.step = repeat.model.groups.findIndex((group) => group.code === "PROPERTIES");
repeat.render();

const entry = () => dom.document.getElementById("pf-PROPERTY_ADDRESSES");
const rows = () => collect(mounted, "pf-repeat__row");
const held = () => plain(repeat.values.PROPERTY_ADDRESSES);
const typeInto = (value) => { const box = entry(); box.value = value; box.fire("input"); return box; };
const bubble = (node, type, event) => { for (let current = node; current; current = current.parentNode) current.fire(type, event); };
const attachedTo = (node, root) => { for (let current = node; current; current = current.parentNode) if (current === root) return true; return false; };
const CONTROL_TAGS = ["INPUT", "BUTTON", "SELECT", "TEXTAREA"];
const focusTarget = (node) => {
  for (let current = node; current; current = current.parentNode) {
    if (CONTROL_TAGS.includes(current.tagName) || current.getAttribute("tabindex") !== null) return current;
  }
  return null;
};
const outside = dom.document.createElement("button");
const moveFocus = (to, root) => {
  const from = dom.activeElement;
  if (from === to) return;
  dom.activeElement = null;
  if (from) {
    from.fire("blur", { relatedTarget: to });
    bubble(from, "focusout", { relatedTarget: to });
  }
  if (to && (to === outside || attachedTo(to, root))) {
    dom.activeElement = to;
    to.fire("focus", { relatedTarget: from });
    bubble(to, "focusin", { relatedTarget: from });
  }
};
const underPointer = (root) => collect(root, "pf-field__error").map((node) => node.textContent).join("\n");
const press = (target, root) => {
  const before = underPointer(root);
  const down = { target, button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  bubble(target, "mousedown", down);
  if (!down.defaultPrevented) moveFocus(focusTarget(target), root);
  const shifted = underPointer(root) !== before;
  dom.document.fire("mouseup", { target, button: 0 });
  const clicked = attachedTo(target, root) && !shifted;
  if (clicked) {
    bubble(target, "click", { target });
    let form = target.type === "submit" ? target.parentNode : null;
    while (form && form.tagName !== "FORM") form = form.parentNode;
    if (form) form.fire("submit", { preventDefault() {} });
  }
  runZeroDelayTimers();
  return clicked;
};
const keyOn = (node, key) => {
  const event = { key, target: node, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  dom.document.fire("keydown", event);
  bubble(node, "keydown", event);
  return event;
};
const tabOrder = (root) => {
  const order = [];
  const walk = (node) => {
    const tabindex = node.getAttribute("tabindex");
    if ((CONTROL_TAGS.includes(node.tagName) && !node.disabled && tabindex !== "-1") || (tabindex !== null && Number(tabindex) >= 0)) order.push(node);
    node.children.forEach(walk);
  };
  walk(root);
  return order;
};
const tab = (root) => {
  const from = dom.activeElement;
  const order = tabOrder(root);
  const to = order[order.indexOf(from) + 1] || outside;
  if (!keyOn(from, "Tab").defaultPrevented) moveFocus(to, root);
  return to;
};

assert.deepEqual(held(), [], "a repeating address seeds as an empty array, never as a string");
assert.equal(rows().length, 0, "the empty state renders no rows");
assert.ok(entry(), "the empty state still offers one address input");
assert.equal(collect(mounted, "pf-repeat__add").length, 1, "the empty state still offers the add control");

entry().focus();
typeInto("1200 West Georgia Street, Vancouver, BC, Canada");
press(outside, mounted);
assert.equal(collect(mounted, "pf-field")[0].dataset.state, "invalid", "leaving the untouched required list with nothing added flags it");
assert.deepEqual(held(), [], "leaving the field adds nothing");
assert.equal(entry().value, "1200 West Georgia Street, Vancouver, BC, Canada", "the address typed before leaving is still on screen once the card has reacted");

typeInto("1200 West Georgia Street, Vancouver, BC, Canada").fire("keydown", { key: "Enter", preventDefault() {} });
assert.deepEqual(held(), ["1200 West Georgia Street, Vancouver, BC, Canada"], "Enter commits the first address");
assert.equal(rows().length, 1);
assert.equal(entry().value, "", "a committed address leaves the entry input empty");
assert.equal(dom.activeElement, entry(), "focus returns to the entry input");

typeInto("4000 No. 3 Road, Richmond, BC, Canada");
collect(mounted, "pf-repeat__add")[0].fire("click");
assert.deepEqual(held(), ["1200 West Georgia Street, Vancouver, BC, Canada", "4000 No. 3 Road, Richmond, BC, Canada"]);
assert.deepEqual(plain(rows().map((row) => row.getAttribute("aria-label"))), held(), "every row is named by the address it removes");
assert.deepEqual(plain(rows().map((row) => row.getAttribute("aria-pressed"))), ["true", "true"]);
assert.deepEqual(plain(rows().map((row) => row.getAttribute("type"))), ["button", "button"], "a row must never submit the form");

typeInto("4000 no. 3 road, richmond, bc, canada");
collect(mounted, "pf-repeat__add")[0].fire("click");
assert.equal(rows().length, 2, "the same address is not added twice");

const stale = rows();
stale[0].fire("click");
assert.deepEqual(held(), ["4000 No. 3 Road, Richmond, BC, Canada"], "a row removes itself");
assert.equal(dom.activeElement, entry(), "focus returns to the entry input after a removal");
stale[0].fire("click");
assert.deepEqual(held(), ["4000 No. 3 Road, Richmond, BC, Canada"], "a row that is already gone removes nothing a second time");
typeInto("1200 West Georgia Street, Vancouver, BC, Canada");
rows()[0].fire("click");
assert.deepEqual(held(), [], "removing the last row empties the list");
assert.ok(entry(), "removing the last row keeps the entry input");
assert.equal(entry().value, "1200 West Georgia Street, Vancouver, BC, Canada", "a removal re-renders the card, and the address typed but not yet added stays on screen");

repeat.advance(repeat.visibleGroups());
assert.deepEqual(held(), ["1200 West Georgia Street, Vancouver, BC, Canada"], "Continue commits the address on screen rather than losing it");

repeat.step = repeat.model.groups.findIndex((group) => group.code === "PROPERTIES");
repeat.render();
typeInto("4000 No. 3 Road, Richmond, BC, Canada").fire("keydown", { key: "Enter", preventDefault() {} });
repeat.values.ORGANIZATION_NAME = "Granite Ridge Properties";
repeat.values.SELECT_ROLE = "OWNER";
repeat.values.FIRST_NAME = "Dana";
repeat.values.LAST_NAME = "Reyes";
repeat.values.EMAIL = "dana@example.com";
repeat.values.PHONE = "+1 604 555 0164";
assert.equal(await repeat.submit(), true);
assert.equal(posted.length, 1, "the repeating field submits once, as one form");
const wire = JSON.parse(posted[0].init.body);
assert.deepEqual(
  plain(wire.attributes["2"].PROPERTY_ADDRESSES),
  { value: ["1200 West Georgia Street, Vancouver, BC, Canada", "4000 No. 3 Road, Richmond, BC, Canada"] },
  "a multiselect String submits as a JSON array inside one AttributeValue",
);
assert.equal(wire.attributes["2"].EMAIL.value, "dana@example.com", "a single-value attribute still submits a scalar");

const enter = { key: "Enter", preventDefault() {} };
const contact = {
  ORGANIZATION_NAME: "Granite Ridge Properties", SELECT_ROLE: "OWNER", FIRST_NAME: "Dana",
  LAST_NAME: "Reyes", EMAIL: "dana@example.com", PHONE: "+1 604 555 0164",
};
const coordinatesAttribute = (code, source) => ({
  code, required: false, multiselect: false, freeValue: false, unique: false,
  className: "java.lang.String", nls: { en: { NAME: "Hidden coordinates" } }, options: [],
  inputFormat: "coordinates-of:" + source,
});
const withHiddenAttribute = (schema, attribute, groupCode, visible) => {
  const patched = plain(schema);
  patched.attributes.push(attribute);
  if (groupCode) patched.attributeOrder.find((entry) => entry[groupCode])[groupCode].push({ attributeCode: attribute.code, visible });
  return patched;
};
const quoteWithCoordinates = withHiddenAttribute(quote, coordinatesAttribute("PROPERTY_COORDINATES", "PROPERTY_ADDRESSES"), "PROPERTIES", false);

assert.equal(dom.document.head.children.length, 0, "a form without a maps key loads no Google script");
const keyless = new PortalForm({ schema: quoteWithCoordinates, locale: "en", copy: copyEcho, organizationId: 43, apiBaseUrl: "https://forms.example" });
keyless.mount(dom.document.createElement("div"));
await Promise.resolve();
keyless.step = keyless.model.groups.findIndex((group) => group.code === "PROPERTIES");
keyless.render();
typeInto("1200 West Georgia Street, Vancouver, BC, Canada").fire("keydown", enter);
typeInto("4000 No. 3 Road, Richmond, BC, Canada").fire("keydown", enter);
Object.assign(keyless.values, contact);
assert.equal(keyless.values.PROPERTY_COORDINATES, "", "without a maps key no coordinates are produced");
assert.equal(await keyless.submit(), true);
assert.deepEqual(JSON.parse(posted[1].init.body), wire, "a declared hidden attribute changes nothing about a keyless submission");
assert.equal(dom.document.head.children.length, 0, "the keyless submission still loaded no Google script");

const degradedPage = async (name, breakGoogle) => {
  const page = createDom();
  const context = { window: {}, document: page.document, setTimeout: sandbox.setTimeout, clearTimeout: sandbox.clearTimeout, fetch: sandbox.fetch };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  const form = new context.window.PortalForm({ schema: quoteWithCoordinates, locale: "en", copy: copyEcho, organizationId: 43, apiBaseUrl: "https://forms.example", mapsApiKey: "test-key" });
  const formMount = page.document.createElement("div");
  form.mount(formMount);
  await settle();
  form.step = form.model.groups.findIndex((group) => group.code === "PROPERTIES");
  form.render();
  const script = page.document.head.children[0];
  assert.equal(page.document.head.children.length, 1, name + ": a keyed form asks for the Google script");
  breakGoogle(context, script);
  await librariesLoaded();
  form.render();
  await librariesLoaded();
  const control = collect(formMount, "pf-address")[0];
  assert.equal(control.dataset.autocomplete, undefined, name + ": the address stays a plain text input");
  assert.equal(collect(formMount, "pf-address__list").length, 0, name + ": no suggestion list is offered");
  assert.equal(collect(formMount, "pf-address__map")[0].dataset.state, "idle", name + ": no map is drawn");
  const box = page.document.getElementById("pf-PROPERTY_ADDRESSES");
  box.value = "1200 West Georgia Street, Vancouver, BC, Canada";
  box.fire("input");
  box.fire("keydown", { key: "Enter", preventDefault() {} });
  Object.assign(form.values, contact);
  assert.equal(await form.submit(), true, name + ": the form still submits");
  const body = JSON.parse(posted[posted.length - 1].init.body);
  assert.deepEqual(plain(body.attributes["2"].PROPERTY_ADDRESSES), { value: ["1200 West Georgia Street, Vancouver, BC, Canada"] }, name + ": the typed address is what submits");
  assert.equal(body.attributes["2"].PROPERTY_COORDINATES, undefined, name + ": and it carries no coordinates");
};
await degradedPage("a script that fails to load", (context, script) => script.fire("error"));
await degradedPage("a library import that fails", (context, script) => {
  context.window.google = { maps: { importLibrary: (name) => (name === "places" ? Promise.reject(new Error("places refused")) : Promise.resolve({})) } };
  script.fire("load");
});

const single = new PortalForm({ schema: kitchen, locale: "en", copy: copyEcho });
const singleMount = dom.document.createElement("div");
single.mount(singleMount);
await Promise.resolve();
single.step = single.model.groups.findIndex((group) => group.code === "TEXTS");
single.render();
assert.equal(single.values.SITE_ADDRESS, "", "a single-value address seeds as a string");
assert.equal(collect(singleMount, "pf-repeat").length, 0, "a non-multiselect address renders no repeat control");
assert.equal(collect(singleMount, "pf-address").length, 1, "a non-multiselect address renders exactly one address control");
const siteBox = dom.document.getElementById("pf-SITE_ADDRESS");
siteBox.value = "88 Robson Street, Vancouver, BC, Canada";
siteBox.fire("input");
assert.equal(single.values.SITE_ADDRESS, "88 Robson Street, Vancouver, BC, Canada", "a single-value address still writes a scalar on every keystroke");

const flow = new PortalForm({ schema: quote, locale: "en", copy: copyEcho, organizationId: 43, apiBaseUrl: "https://forms.example" });
const flowMount = dom.document.createElement("div");
flow.mount(flowMount);
await settle();
const control = (code) => dom.document.getElementById("pf-" + code);
const wrapOf = (root, code) => collect(root, "pf-field").find((node) => node.dataset.code === code);
const typeField = (code, value) => { const box = control(code); box.value = value; box.fire("input"); return box; };
const organizationWrap = wrapOf(flowMount, "ORGANIZATION_NAME");
control("ORGANIZATION_NAME").focus();
const tabbedTo = tab(flowMount);
assert.equal(tabbedTo, control("SELECT_ROLE"), "Tab runs from the first field to the second");
assert.equal(dom.activeElement, tabbedTo, "leaving an untouched field with Tab keeps the focus on the field Tab moved to");
assert.equal(wrapOf(flowMount, "ORGANIZATION_NAME"), organizationWrap, "leaving a field repaints it in place instead of re-rendering the card");
assert.equal(organizationWrap.dataset.state, "invalid", "the required field left empty shows its error at once");
assert.equal(collect(organizationWrap, "pf-field__error")[0].textContent, "requiredError");
moveFocus(control("ORGANIZATION_NAME"), flowMount);
typeField("ORGANIZATION_NAME", "Granite Ridge Properties");
tab(flowMount);
assert.equal(organizationWrap.dataset.state, "idle", "leaving it answered clears the error in place");

const roleBox = control("SELECT_ROLE");
roleBox.value = "OWNER";
roleBox.fire("change");
assert.equal(flow.values.SELECT_ROLE, "OWNER");
assert.notEqual(control("SELECT_ROLE"), roleBox, "a choice re-renders the card");
assert.equal(dom.activeElement, control("SELECT_ROLE"), "and gives the focus back to the control that was re-rendered");
for (const [code, value] of [["FIRST_NAME", "Dana"], ["LAST_NAME", "Reyes"], ["EMAIL", "dana@example.com"], ["PHONE", "+1 604 555 0164"]]) {
  assert.equal(tab(flowMount), control(code), "Tab reaches " + code);
  typeField(code, value);
}
assert.equal(flow.touched.PHONE, undefined, "the last field is still untouched when the pointer goes down on Continue");
assert.equal(press(collect(flowMount, "btn--primary")[0], flowMount), true, "nothing under the pointer is replaced or moved between mousedown and click");
assert.equal(flow.step, 1, "the first click on Continue advances");
assert.equal(dom.activeElement && dom.activeElement.getAttribute("data-group"), "PROPERTIES", "focus moves to the step Continue opened, not to the document body");
assert.equal(press(collect(flowMount, "btn--ghost")[0], flowMount), true);
assert.equal(flow.step, 0, "Back returns to the first step");
assert.equal(dom.activeElement && dom.activeElement.getAttribute("data-group"), "C9C8004F_EFF7_470F_B924_5719E91A5E4C", "and moves focus to the step it shows");

const sinkForm = new PortalForm({ schema: kitchen, locale: "en", copy: copyEcho });
const sinkMount = dom.document.createElement("div");
sinkForm.mount(sinkMount);
await settle();
control("PLAIN_TEXT").focus();
assert.equal(sinkForm.touched.PLAIN_TEXT, undefined);
assert.equal(press(collect(sinkMount, "btn--primary")[0], sinkMount), true, "leaving an empty required field for Continue shows no error under the pointer before the click lands");
assert.equal(sinkForm.step, 0, "the click lands and validation keeps the step");
assert.equal(dom.activeElement, control("PLAIN_TEXT"), "focus goes to the first field that needs an answer");
assert.equal(wrapOf(sinkMount, "PLAIN_TEXT").dataset.state, "invalid");

sinkForm.step = sinkForm.model.groups.findIndex((group) => group.code === "CHOICES");
sinkForm.render();
const triggers = () => collect(sinkMount, "pf-choice__input").filter((node) => node.getAttribute("name") === "TRIGGER");
triggers()[0].focus();
const arrowed = triggers()[1];
moveFocus(arrowed, sinkMount);
assert.equal(attachedTo(arrowed, sinkMount), true, "moving between the options of one radio group re-renders nothing");
arrowed.checked = true;
arrowed.fire("change");
assert.equal(sinkForm.values.TRIGGER, "5CM", "the option an arrow key selected is kept");
assert.equal(dom.activeElement.getAttribute("value"), "5CM", "and keeps the focus after the card re-renders");
const chip = collect(sinkMount, "pf-chip")[0];
moveFocus(chip, sinkMount);
chip.fire("click");
assert.deepEqual(plain(sinkForm.values.SURFACES), ["DRIVE"]);
assert.equal(dom.activeElement.getAttribute("data-focus"), "SURFACES=DRIVE", "a chip toggled from the keyboard keeps the focus");
assert.equal(dom.activeElement.getAttribute("aria-pressed"), "true");
const terms = control("ACCEPT_TERMS");
moveFocus(terms, sinkMount);
terms.checked = true;
terms.fire("change");
assert.equal(sinkForm.values.ACCEPT_TERMS, true);
assert.equal(dom.activeElement, control("ACCEPT_TERMS"), "a checkbox toggled with Space keeps the focus");

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
assert.deepEqual(plain(hidden.groups[1].fields.map((field) => field.code)), ["LOOSE"], "attributes outside attributeOrder still render");
assert.deepEqual(plain(hidden.hidden.map((field) => field.code)), ["HIDDEN"], "a visible:false attribute never falls through to the ungrouped step");

const localeFallback = normalizeSchema({
  id: 13, nls: { ru: { NAME: "Форма" } },
  attributes: [{ code: "A", className: "java.lang.String", nls: { ru: { NAME: "Поле" } }, options: [{ value: "V", nls: { ru: { NAME: "Вариант" }, en: { NAME: "Option" } } }] }],
  attributeGroups: [], attributeOrder: [],
}, "ru");
assert.equal(localeFallback.title, "Форма");
assert.equal(localeFallback.groups[0].fields[0].label, "Поле");
assert.equal(localeFallback.groups[0].fields[0].choices[0].label, "Вариант");

const liveFieldCodes = plain(live.groups.map((group) => group.fields.map((field) => field.code)));
const coordinated = normalizeSchema(quoteWithCoordinates, "en");
assert.deepEqual(plain(coordinated.groups.map((group) => group.fields.map((field) => field.code))), liveFieldCodes, "the hidden attribute joins no group and adds no step");
assert.deepEqual(plain(coordinated.hidden.map((field) => [field.code, field.typeId, field.tokens.coordinatesOf])), [["PROPERTY_COORDINATES", 2, "PROPERTY_ADDRESSES"]]);
const unordered = normalizeSchema(withHiddenAttribute(quote, coordinatesAttribute("PROPERTY_COORDINATES", "PROPERTY_ADDRESSES"), null), "en");
assert.deepEqual(plain(unordered.groups.map((group) => group.fields.map((field) => field.code))), liveFieldCodes, "a coordinates attribute left out of attributeOrder still never renders");
assert.deepEqual(plain(unordered.hidden.map((field) => field.code)), ["PROPERTY_COORDINATES"]);
const flaggedVisible = normalizeSchema(withHiddenAttribute(quote, coordinatesAttribute("PROPERTY_COORDINATES", "PROPERTY_ADDRESSES"), "PROPERTIES", true), "en");
assert.deepEqual(plain(flaggedVisible.groups.map((group) => group.fields.map((field) => field.code))), liveFieldCodes, "a coordinates attribute flagged visible still never renders");

const latLng = ([lat, lng]) => ({ lat: () => lat, lng: () => lng });
const geocoderQueue = [];
const autocompletes = [];
function StubMap() {}
StubMap.prototype.setCenter = function () {};
function StubMarker() {}
StubMarker.prototype.setMap = function () {};
function StubGeocoder() {}
StubGeocoder.prototype.geocode = function (request, callback) { geocoderQueue.push({ address: request.address, callback }); };
function StubAutocomplete(input) { this.input = input; this.listeners = {}; this.place = null; autocompletes.push(this); }
StubAutocomplete.prototype.addListener = function (type, fn) { this.listeners[type] = fn; };
StubAutocomplete.prototype.getPlace = function () { return this.place; };
const directory = [
  { text: "1200 West Georgia Street, Vancouver", formatted: "1200 West Georgia Street, Vancouver, BC V6E 4R2, Canada", at: [49.2869, -123.1257] },
  { text: "88 Robson Street, Vancouver", formatted: "88 Robson Street, Vancouver, BC V6B 0B1, Canada", at: [49.2767, -123.1146] },
];
const dataApi = {
  AutocompleteSessionToken: function AutocompleteSessionToken() {},
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: ({ input }) => Promise.resolve({
      suggestions: directory.filter((place) => place.text.toLowerCase().includes(input.toLowerCase())).map((place) => ({
        placePrediction: {
          text: place.text,
          toPlace: () => ({
            fetchFields() { this.formattedAddress = place.formatted; this.location = latLng(place.at); return Promise.resolve(); },
          }),
        },
      })),
    }),
  },
};
const legacyPlaces = { Autocomplete: StubAutocomplete };
const libraries = { maps: { Map: StubMap }, marker: { Marker: StubMarker }, geocoding: { Geocoder: StubGeocoder }, places: dataApi };
const imported = [];
const maps = {
  importLibrary(name) {
    imported.push(name);
    return new Promise((resolve) => setImmediate(resolve)).then(() => {
      if (name === "places") maps.places = libraries.places;
      else Object.assign(maps, libraries[name]);
      return libraries[name];
    });
  },
};
const answerGeocoder = (address, at) => {
  const due = geocoderQueue.filter((call) => call.address === address);
  assert.ok(due.length, "a geocoder request for " + address + " must be pending");
  due.forEach((call) => geocoderQueue.splice(geocoderQueue.indexOf(call), 1));
  due.forEach((call) => call.callback(at ? [{ formatted_address: address, geometry: { location: latLng(at) } }] : [], at ? "OK" : "ZERO_RESULTS"));
};
const choose = (widget, place) => { widget.place = place; widget.listeners.place_changed(); };
const coordinatesIn = (form, code) => (form.values[code] ? JSON.parse(form.values[code]) : []);
const surface = (node) => {
  const seen = [];
  const walk = (candidate) => {
    seen.push(String(candidate.textContent), String(candidate.value ?? ""), String(candidate.id));
    seen.push(...Object.values(candidate.attributes).map(String), ...Object.values(candidate.dataset).map(String));
    candidate.children.forEach(walk);
  };
  walk(node);
  return seen.join("\n");
};

const keyed = new PortalForm({ schema: quoteWithCoordinates, locale: "en", copy: copyEcho, organizationId: 43, apiBaseUrl: "https://forms.example", mapsApiKey: "test-key" });
const keyedMount = dom.document.createElement("div");
keyed.mount(keyedMount);
await settle();
keyed.step = keyed.model.groups.findIndex((group) => group.code === "PROPERTIES");
keyed.render();
const mapsScript = dom.document.head.children[0];
assert.match(String(mapsScript.src), /^https:\/\/maps\.googleapis\.com\/maps\/api\/js\?key=test-key&/);
assert.match(String(mapsScript.src), /[?&]loading=async(&|$)/);
sandbox.window.google = { maps };
assert.equal(typeof maps.Map, "undefined", "the async bootstrap carries importLibrary and no classes when its script loads");
mapsScript.fire("load");
await librariesLoaded();
assert.deepEqual(plain([...imported].sort()), ["geocoding", "maps", "marker", "places"], "every library the control uses is imported, once");
const keyedAddresses = () => plain(keyed.values.PROPERTY_ADDRESSES);
const keyedCoordinates = () => coordinatesIn(keyed, "PROPERTY_COORDINATES");
assert.equal(collect(keyedMount, "pf-address")[0].dataset.autocomplete, "data-api", "the field upgrades once the imported libraries have put their classes on google.maps");

const georgia = directory[0].formatted;
const robson = directory[1].formatted;
entry().focus();
typeInto("1200 West Geo");
runTimers();
await settle();
press(collect(keyedMount, "pf-address__option")[0], keyedMount);
await settle();
assert.deepEqual(keyedAddresses(), [georgia], "the first click on a suggestion lands, because pressing it never moves focus out of the untouched required list");
assert.equal(entry().value, "", "the pick leaves nothing typed behind for Continue to add unseen");
assert.equal(keyed.values.PROPERTY_COORDINATES, JSON.stringify([{ address: georgia, lat: 49.2869, lng: -123.1257 }]), "a Places data API pick keeps its location for the exact string it committed, as numbers");
assert.equal(geocoderQueue.length, 0, "a pick asks the Geocoder for nothing");

entry().focus();
typeInto("88 Rob");
press(outside, keyedMount);
entry().focus();
typeInto("88 Robs");
runTimers();
await settle();
press(collect(keyedMount, "pf-address__option")[0], keyedMount);
await settle();
assert.deepEqual(keyedAddresses(), [georgia, robson]);
answerGeocoder("88 Rob", [10, 20]);
assert.deepEqual(keyedCoordinates(), [{ address: georgia, lat: 49.2869, lng: -123.1257 }, { address: robson, lat: 49.2767, lng: -123.1146 }], "a geocoder answer for text the pick replaced is dropped");
collect(keyedMount, "pf-repeat__row").find((row) => row.getAttribute("aria-label") === robson).fire("click");
assert.deepEqual(keyedCoordinates().map((point) => point.address), [georgia]);

typeInto(georgia).fire("keydown", enter);
await settle();
assert.deepEqual(keyedAddresses(), [georgia], "typing a picked address again adds nothing");
assert.equal(geocoderQueue.length, 0, "and asks the Geocoder for nothing that could replace the picked location");

await settle();
const richmond = "4000 No. 3 Road, Richmond, BC, Canada";
entry().focus();
typeInto(richmond);
press(collect(keyedMount, "pf-repeat__add")[0], keyedMount);
assert.deepEqual(keyedAddresses(), [georgia, richmond]);
assert.deepEqual(keyedCoordinates().map((point) => point.address), [georgia], "a typed address carries no location until the Geocoder answers");
await settle();
assert.deepEqual(geocoderQueue.map((call) => call.address), [richmond], "committing with + asks the Geocoder for the committed string, with no blur involved");
answerGeocoder(richmond, [49.1848, -123.1363]);
assert.deepEqual(keyedCoordinates()[1], { address: richmond, lat: 49.1848, lng: -123.1363 }, "the answer lands on the address + committed");

await settle();
const padded = "  6551 No. 3 Road, Richmond, BC, Canada  ";
entry().focus();
typeInto(padded);
press(outside, keyedMount);
answerGeocoder(padded.trim(), [49.1666, -123.1364]);
assert.equal(keyedCoordinates().length, 2, "a location for an entry not yet committed stays out of the hidden value");
entry().focus();
entry().fire("keydown", enter);
await settle();
assert.deepEqual(keyedCoordinates()[2], { address: padded.trim(), lat: 49.1666, lng: -123.1364 }, "a location obtained while the address was being typed is kept for the trimmed string the entry commits");
assert.equal(geocoderQueue.length, 0, "and the Geocoder is not asked for it a second time");

await settle();
const main = "300 Main Street, Vancouver, BC, Canada";
entry().focus();
typeInto(main);
press(outside, keyedMount);
answerGeocoder(main, [49.2811, -123.0996]);
entry().focus();
typeInto(main + " Unit 4");
const leaving = typeInto(main);
leaving.fire("keydown", enter);
assert.equal(keyedAddresses()[3], main);
assert.equal(keyedCoordinates().some((point) => point.address === main), false, "editing the text by hand drops its location, and typing it back does not restore it");
await settle();
assert.deepEqual(geocoderQueue.map((call) => call.address), [main], "committing with Enter asks the Geocoder for the committed string, with no blur involved");
leaving.fire("blur");
assert.deepEqual(geocoderQueue.map((call) => call.address), [main], "the blur Chromium fires when the re-render removes the committed input asks for nothing more");
answerGeocoder(main, [49.2812, -123.0997]);
assert.deepEqual(keyedCoordinates()[3], { address: main, lat: 49.2812, lng: -123.0997 }, "the new location lands on the address Enter committed");

collect(keyedMount, "pf-repeat__row").find((row) => row.getAttribute("aria-label") === richmond).fire("click");
assert.deepEqual(keyedAddresses(), [georgia, padded.trim(), main]);
assert.deepEqual(keyedCoordinates().map((point) => point.address), [georgia, padded.trim(), main], "removing an address removes its entry");
await settle();
entry().focus();
typeInto(richmond).fire("keydown", enter);
assert.equal(keyedCoordinates().some((point) => point.address === richmond), false, "a removed address forgets its location, so adding it again starts without one");
await settle();
answerGeocoder(richmond, null);
assert.equal(keyedCoordinates().some((point) => point.address === richmond), false, "an address the geocoder cannot place is simply absent");

maps.places = legacyPlaces;
keyed.render();
await settle();
assert.equal(collect(keyedMount, "pf-address")[0].dataset.autocomplete, "legacy");
const keyedWidget = autocompletes[autocompletes.length - 1];
assert.equal(keyedWidget.input, entry());
typeInto("4700 King").fire("keydown", enter);
assert.equal(keyedAddresses().length, 4, "in legacy mode Enter belongs to the widget");
const kingsway = "4700 Kingsway, Burnaby, BC V5H 4M1, Canada";
choose(keyedWidget, { formatted_address: kingsway, geometry: { location: latLng([49.2276, -122.9998]) } });
assert.deepEqual(keyedAddresses(), [georgia, padded.trim(), main, richmond, kingsway]);
assert.deepEqual(keyedCoordinates().map((point) => point.address), [georgia, padded.trim(), main, kingsway], "the hidden value follows the current addresses in their order");
assert.deepEqual(keyedCoordinates()[3], { address: kingsway, lat: 49.2276, lng: -122.9998 }, "the legacy geometry.location is kept for the address it committed");

assert.equal(keyed.visibleGroups().length, 3, "a hidden attribute adds no step");
for (let index = 0; index < 3; index += 1) {
  keyed.step = index;
  keyed.render();
  assert.doesNotMatch(surface(keyedMount), /PROPERTY_COORDINATES|Hidden coordinates|"lat"|49\.2869|49\.1666|49\.2812|49\.2276/, "step " + index + " must never show the hidden attribute or a coordinate");
}
await settle();

Object.assign(keyed.values, contact);
assert.equal(await keyed.submit(), true);
const keyedWire = JSON.parse(posted[posted.length - 1].init.body);
const sentCoordinates = keyedWire.attributes["2"].PROPERTY_COORDINATES;
assert.equal(typeof sentCoordinates.value, "string", "the hidden attribute submits one JSON string");
assert.equal(sentCoordinates.value, keyed.values.PROPERTY_COORDINATES);
assert.deepEqual(
  JSON.parse(sentCoordinates.value).map((point) => point.address),
  keyedWire.attributes["2"].PROPERTY_ADDRESSES.value.filter((address) => address !== richmond),
  "every entry names an address exactly as submitted, and an address without a location has no entry",
);
for (const point of JSON.parse(sentCoordinates.value)) {
  assert.deepEqual(Object.keys(point), ["address", "lat", "lng"]);
  assert.ok(typeof point.lat === "number" && typeof point.lng === "number" && point.lat !== 0 && point.lng !== 0, "lat and lng travel as real numbers");
}

maps.places = dataApi;
const siteSchema = withHiddenAttribute(kitchen, coordinatesAttribute("SITE_COORDINATES", "SITE_ADDRESS"), "TEXTS", false);
const site = new PortalForm({ schema: siteSchema, locale: "en", copy: copyEcho, mapsApiKey: "test-key" });
const siteMount = dom.document.createElement("div");
site.mount(siteMount);
await settle();
assert.deepEqual(plain(site.model.groups.map((group) => group.code)), ["TEXTS", "NUMBERS", "CHOICES", "CONDITIONAL"]);
site.step = site.model.groups.findIndex((group) => group.code === "TEXTS");
site.render();
await settle();
const siteInput = () => dom.document.getElementById("pf-SITE_ADDRESS");
const typeSite = (value) => { const box = siteInput(); box.value = value; box.fire("input"); return box; };
const siteCoordinates = () => coordinatesIn(site, "SITE_COORDINATES");
assert.equal(collect(siteMount, "pf-address")[0].dataset.autocomplete, "data-api");

siteInput().focus();
typeSite("88 Rob");
runTimers();
await settle();
collect(siteMount, "pf-address__option")[0].fire("click");
await settle();
assert.equal(site.values.SITE_ADDRESS, robson);
assert.deepEqual(siteCoordinates(), [{ address: robson, lat: 49.2767, lng: -123.1146 }], "a single address keeps its Places location as a one-entry array");
site.render();
await settle();
moveFocus(outside, siteMount);
assert.equal(geocoderQueue.length, 0, "re-rendering and leaving a picked single address asks the Geocoder for nothing, so nothing can override the location the client picked");
assert.deepEqual(siteCoordinates(), [{ address: robson, lat: 49.2767, lng: -123.1146 }]);

typeSite(robson + " Unit 4");
assert.equal(site.values.SITE_COORDINATES, "", "editing a single address by hand drops its location");
typeSite(robson);
assert.equal(site.values.SITE_COORDINATES, "", "typing the old text back does not restore the dropped location");
siteInput().fire("blur");
answerGeocoder(robson, [49.2768, -123.1147]);
assert.deepEqual(siteCoordinates(), [{ address: robson, lat: 49.2768, lng: -123.1147 }], "the geocoder on blur obtains a new one");

const trailing = "12 Main Street, Vancouver ";
typeSite(trailing).fire("blur");
answerGeocoder(trailing.trim(), [49.2004, -123.1002]);
assert.deepEqual(siteCoordinates(), [{ address: trailing, lat: 49.2004, lng: -123.1002 }], "a single address is matched by the exact string it submits, trailing space included");

maps.places = legacyPlaces;
site.render();
await settle();
const siteWidget = autocompletes[autocompletes.length - 1];
assert.equal(siteWidget.input, siteInput());
const pender = "700 West Pender Street, Vancouver, BC V6C 1G8, Canada";
choose(siteWidget, { formatted_address: pender, geometry: { location: latLng([49.2839, -123.1152]) } });
assert.equal(site.values.SITE_ADDRESS, pender);
assert.deepEqual(siteCoordinates(), [{ address: pender, lat: 49.2839, lng: -123.1152 }], "a legacy pick replaces the old address and its entry");
site.render();
assert.doesNotMatch(surface(siteMount), /SITE_COORDINATES|Hidden coordinates|"lat"|49\.2839/, "the single control never shows the hidden attribute or a coordinate");
typeSite("");
assert.equal(site.values.SITE_COORDINATES, "", "clearing the address removes its entry");
await settle();

const unplaceable = "9 Unplaceable Lane, Nowhere";
siteInput().focus();
typeSite(unplaceable);
moveFocus(outside, siteMount);
assert.deepEqual(geocoderQueue.map((call) => call.address), [unplaceable], "leaving a typed single address asks the Geocoder once");
answerGeocoder(unplaceable, null);
site.render();
await settle();
moveFocus(siteInput(), siteMount);
moveFocus(outside, siteMount);
assert.equal(geocoderQueue.length, 0, "the unchanged address is not asked again after a re-render and a second blur, even when the first answer placed nothing");
typeSite(unplaceable + " 2");
typeSite(unplaceable);
moveFocus(siteInput(), siteMount);
moveFocus(outside, siteMount);
assert.deepEqual(geocoderQueue.map((call) => call.address), [unplaceable], "editing the text away and back asks again, once");
answerGeocoder(unplaceable, null);
typeSite("");
await settle();

maps.places = dataApi;
const combo = new PortalForm({ schema: quoteWithCoordinates, locale: "en", copy: copyEcho, organizationId: 43, apiBaseUrl: "https://forms.example", mapsApiKey: "test-key" });
const comboMount = dom.document.createElement("div");
combo.mount(comboMount);
await settle();
combo.step = combo.model.groups.findIndex((group) => group.code === "PROPERTIES");
combo.render();
await settle();
const comboHeld = () => plain(combo.values.PROPERTY_ADDRESSES);
const listbox = () => collect(comboMount, "pf-address__list")[0];
const options = () => collect(comboMount, "pf-address__option");
const combobox = entry();
assert.equal(combobox.getAttribute("role"), "combobox", "a keyed address input is a combobox");
assert.equal(combobox.getAttribute("aria-autocomplete"), "list");
assert.equal(combobox.getAttribute("aria-expanded"), "false");
assert.equal(combobox.getAttribute("aria-controls"), listbox().id, "the combobox names the listbox it controls");
assert.equal(listbox().getAttribute("role"), "listbox");

moveFocus(combobox, comboMount);
typeInto("Vancouver");
runTimers();
await settle();
assert.equal(combobox.getAttribute("aria-expanded"), "true", "suggestions open under the focused input");
assert.deepEqual(
  plain(options().map((node) => [node.getAttribute("role"), node.getAttribute("tabindex"), node.getAttribute("aria-selected")])),
  [["option", null, "false"], ["option", null, "false"]],
  "suggestions are options, never tab stops, and none is active before an arrow key moves",
);
assert.equal(combobox.getAttribute("aria-activedescendant"), null);
keyOn(combobox, "ArrowDown");
assert.equal(combobox.getAttribute("aria-activedescendant"), options()[0].id, "ArrowDown makes the first suggestion active");
assert.equal(options()[0].getAttribute("aria-selected"), "true");
assert.equal(dom.activeElement, combobox, "DOM focus stays on the input");
keyOn(combobox, "ArrowDown");
assert.equal(combobox.getAttribute("aria-activedescendant"), options()[1].id);
keyOn(combobox, "ArrowDown");
assert.equal(combobox.getAttribute("aria-activedescendant"), options()[0].id, "ArrowDown wraps from the last suggestion to the first");
keyOn(combobox, "ArrowUp");
assert.equal(combobox.getAttribute("aria-activedescendant"), options()[1].id, "ArrowUp wraps from the first suggestion to the last");
assert.equal(keyOn(combobox, "Escape").defaultPrevented, true);
assert.equal(listbox().hidden, true, "Escape closes the suggestions");
assert.equal(combobox.getAttribute("aria-expanded"), "false");
assert.equal(combobox.getAttribute("aria-activedescendant"), null);
assert.equal(combobox.value, "Vancouver", "Escape keeps the typed text");
keyOn(combobox, "ArrowDown");
assert.equal(combobox.getAttribute("aria-expanded"), "true", "ArrowDown reopens the suggestions for the unchanged text");
assert.equal(combobox.getAttribute("aria-activedescendant"), options()[0].id);
assert.equal(keyOn(combobox, "Enter").defaultPrevented, true);
await settle();
assert.deepEqual(comboHeld(), [georgia], "Enter commits the active suggestion, not the typed text");
assert.equal(dom.activeElement, entry(), "focus returns to the emptied entry input");
assert.equal(geocoderQueue.length, 0, "a picked suggestion carries its own location");

typeInto("88 Rob");
runTimers();
await settle();
keyOn(entry(), "ArrowDown");
const leftFor = tab(comboMount);
assert.equal(leftFor, collect(comboMount, "pf-repeat__add")[0], "Tab moves on to the add button, the next control after the input");
assert.equal(dom.activeElement, leftFor);
assert.equal(listbox().hidden, true, "Tab closes the suggestions at once");
assert.deepEqual(comboHeld(), [georgia], "Tab picks nothing");
assert.equal(entry().value, "88 Rob", "Tab keeps the typed text");
assert.deepEqual(geocoderQueue.map((call) => call.address), ["88 Rob"], "leaving the entry asks the Geocoder for the typed text once");
answerGeocoder("88 Rob", null);

moveFocus(entry(), comboMount);
typeInto("Vancouver");
moveFocus(outside, comboMount);
runTimers();
await settle();
assert.equal(listbox().hidden, true, "suggestions that arrive after the input lost focus never open");
answerGeocoder("Vancouver", null);

const denman = "1030 Denman Street, Vancouver, BC, Canada";
moveFocus(entry(), comboMount);
typeInto(denman);
tab(comboMount);
assert.deepEqual(geocoderQueue.map((call) => call.address), [denman], "leaving the entry for the add button asks for the typed address");
dom.activeElement.fire("click");
await settle();
assert.deepEqual(comboHeld(), [georgia, denman]);
assert.deepEqual(geocoderQueue.map((call) => call.address), [denman], "committing it with + while that answer is on its way asks nothing more");
answerGeocoder(denman, [49.2877, -123.1409]);
assert.deepEqual(coordinatesIn(combo, "PROPERTY_COORDINATES").map((point) => point.address), [georgia, denman], "the one answer lands on the committed address");

const davie = "1200 Davie Street, Vancouver, BC, Canada";
moveFocus(entry(), comboMount);
typeInto(davie);
keyOn(entry(), "Enter");
await settle();
assert.deepEqual(geocoderQueue.map((call) => call.address), [davie], "Enter asks the Geocoder for the committed address");
typeInto(davie);
tab(comboMount);
await settle();
assert.deepEqual(geocoderQueue.map((call) => call.address), [davie], "typing the committed address again and leaving asks nothing more while its answer is on its way");
answerGeocoder(davie, [49.2799, -123.1311]);
assert.equal(coordinatesIn(combo, "PROPERTY_COORDINATES").find((point) => point.address === davie).lat, 49.2799);
typeInto("");

const gated = new PortalForm({
  schema: {
    id: 30, nls: {}, attributeGroups: [],
    attributes: [
      { code: "KIND", className: "java.lang.String", nls: {}, options: [{ value: "A" }, { value: "B" }], uiBehavior: 'applyBehavior({ B: "SITE" })' },
      { code: "CHANNEL", className: "java.lang.String", nls: { en: { NAME: "Lead channel" } }, options: [] },
      { code: "WHERE", className: "java.lang.String", nls: {}, options: [], inputFormat: "address" },
      { code: "WHERE_POINT", className: "java.lang.String", nls: {}, options: [], inputFormat: "coordinates-of:WHERE" },
    ],
    attributeOrder: [
      { MAIN: [{ attributeCode: "KIND", visible: true }, { attributeCode: "CHANNEL", visible: false }] },
      { SITE: [{ attributeCode: "WHERE", visible: true }, { attributeCode: "WHERE_POINT", visible: false }] },
    ],
  },
  locale: "en", copy: copyEcho, organizationId: 43, apiBaseUrl: "https://forms.example",
  presetValues: { CHANNEL: "portal-referral" },
});
const gatedMount = dom.document.createElement("div");
gated.mount(gatedMount);
await settle();
assert.doesNotMatch(surface(gatedMount), /CHANNEL|Lead channel|portal-referral/, "a visible:false attribute renders no label, control or error");
const where = gated.model.groups[1].fields[0];
gated.values.KIND = "B";
gated.setValue(where, "1 Gate Road");
for (const broken of [null, {}, { lat: null, lng: null }, { lat: () => NaN, lng: () => -123.2 }, { lat: "49.1", lng: "-123.2" }, { lat: 91, lng: -123.2 }]) {
  gated.rememberLocation(where, "1 Gate Road", broken, false);
}
assert.equal(gated.values.WHERE_POINT, "", "a missing, non-numeric or out-of-range location is never written, so no coordinate is ever a stand-in 0");
gated.rememberLocation(where, "1 Gate Road", { lat: 49.1, lng: -123.2 }, false);
assert.equal(await gated.submit(), true);
assert.deepEqual(
  JSON.parse(posted[posted.length - 1].init.body).attributes["30"],
  { KIND: { value: "B" }, CHANNEL: { value: "portal-referral" }, WHERE: { value: "1 Gate Road" }, WHERE_POINT: { value: '[{"address":"1 Gate Road","lat":49.1,"lng":-123.2}]' } },
  "hidden attributes submit their values",
);
gated.values.KIND = "A";
assert.equal(await gated.submit(), true);
assert.deepEqual(Object.keys(JSON.parse(posted[posted.length - 1].init.body).attributes["30"]), ["KIND", "CHANNEL"], "coordinates never travel without the address they describe");

const findTags = (node, tag, found) => { if (node.tagName === tag) found.push(node); node.children.forEach((child) => findTags(child, tag, found)); return found; };
const outcomeMount = dom.document.createElement("div");
const outcome = new PortalForm({ schema: kitchen, locale: "en", copy: copyEcho, organizationId: 43, apiBaseUrl: "https://forms.example" });
outcome.mount(outcomeMount);
await settle();
Object.assign(outcome.values, { PLAIN_TEXT: "Plain", EMAIL: "dana@example.com", PROPERTY_TYPE: "RESIDENTIAL", ACCEPT_TERMS: true });
assert.equal(await outcome.submit(), true);
const successTitle = collect(outcomeMount, "pf-notice__title")[0];
assert.equal(outcomeMount.dataset.state, "success");
assert.equal(successTitle.tagName, "H2", "the confirmation is the heading of what replaced the form");
assert.equal(dom.activeElement, successTitle, "a successful submit moves focus to the confirmation instead of leaving it on the document body");
assert.deepEqual(plain(collect(outcomeMount, "pf-next__text").map((node) => node.textContent)), ["successStep1", "successStep2", "successStep3"], "the success screen lists the next steps its copy declares, in order");
assert.equal(collect(outcomeMount, "pf-next__list")[0].tagName, "OL");
assert.deepEqual(plain(collect(outcomeMount, "pf-next__n").map((node) => node.getAttribute("aria-hidden"))), ["true", "true", "true"], "the drawn numbers are decoration; the ordered list carries the order");
assert.equal(findTags(outcomeMount, "A", []).length, 0, "the success screen links nowhere: no registration, no sign-in, no portal route");
const successActions = findTags(outcomeMount, "BUTTON", []);
assert.deepEqual(plain(successActions.map((node) => node.textContent)), ["successAgainLabel"], "its only action is the optional one that starts over");
assert.equal(press(successActions[0], outcomeMount), true);
assert.equal(outcomeMount.dataset.state, "ready", "submit another response brings the form back");
assert.equal(outcome.step, 0);
assert.equal(outcome.values.PLAIN_TEXT, "", "with every answer cleared");
assert.deepEqual(plain(outcome.touched), {}, "and nothing flagged before it is touched again");
assert.equal(dom.activeElement && dom.activeElement.getAttribute("data-group"), "TEXTS", "focus lands on the first step");

const silentCopy = new Proxy({}, { get: (_, key) => (/^successStep|^successAgainLabel$/.test(String(key)) ? "" : String(key)) });
const quietMount = dom.document.createElement("div");
const quiet = new PortalForm({ schema: kitchen, locale: "en", copy: silentCopy });
quiet.mount(quietMount);
await settle();
quiet.state = "success";
quiet.render();
assert.equal(collect(quietMount, "pf-next").length, 0, "empty step copy renders no list and no heading");
assert.equal(findTags(quietMount, "BUTTON", []).length, 0, "an empty again label renders no button");
assert.equal(collect(quietMount, "pf-notice__title")[0].textContent, "successTitle");

const statesMount = dom.document.createElement("div");
const states = new PortalForm({ schema: quote, locale: "en", copy: copyEcho, organizationId: 43, apiBaseUrl: "https://forms.example" });
states.mount(statesMount);
await settle();
const drawnAs = (state) => { states.state = state; states.render(); return statesMount; };
assert.equal(collect(drawnAs("loading"), "pf-skeleton").length, 1, "loading draws the skeleton");
assert.equal(collect(drawnAs("error"), "pf-notice--error").length, 1, "a schema error draws its notice");
assert.deepEqual(plain(findTags(statesMount, "BUTTON", []).map((node) => node.textContent)), ["retryLabel"], "with a retry action");
assert.equal(collect(drawnAs("empty"), "pf-notice--empty").length, 1, "an empty form type draws its notice");
assert.equal(collect(drawnAs("blocked"), "pf-notice--blocked").length, 1, "a missing organization draws its notice inside the form");
assert.ok(collect(statesMount, "pf-field").length > 0, "and keeps the answers on screen");
const sending = collect(drawnAs("submitting"), "btn--primary")[0];
assert.equal(sending.disabled, true, "submitting disables the primary action");
assert.equal(sending.textContent, "submittingLabel");
assert.equal(collect(drawnAs("submit-error"), "pf-notice--error").length, 1, "a failed submit draws its notice inside the form");
assert.ok(collect(statesMount, "pf-field").length > 0, "and keeps the answers on screen");
assert.equal(collect(drawnAs("success"), "pf-notice--success").length, 1, "success draws the confirmation");

assert.doesNotMatch(source, /innerHTML/, "the renderer must not assign innerHTML");
assert.doesNotMatch(source, /dev-1\.servicewand\.com|lsrc\.pixelnation\.com/, "the renderer must not hardcode a deployment host");
assert.match(source, /credentials: "omit"/, "form requests stay anonymous");
assert.equal((source.match(/credentials: "omit"/g) || []).length, 2, "both the schema read and the submit stay anonymous");

for (const token of ["--accent", "--ink", "--surface", "--hair", "--radius-md", "--danger"]) {
  assert.ok(css.includes("var(" + token), "the stylesheet must build on the portal token " + token);
}
assert.doesNotMatch(css, /#[0-9a-f]{6}(?![0-9a-f])/i, "no raw hex colour may bypass the theme tokens");
assert.doesNotMatch(css, /\.df-/, "the portal renderer must not depend on the corporate form stylesheet");

const { exportPortalFormManual } = await import("./export-portal-form-manual.mjs");
const documentDir = path.join(root, "dist/manual-upload/.portal-form-document-check");
try {
  const { template, manifest } = await exportPortalFormManual({ outputDir: documentDir });
  const parameters = new Map(template.parameters.map((parameter) => [parameter.code, parameter]));

  for (const code of ["FORM_API_BASE_URL", "FORM_TYPE_CODE", "FORM_ORGANIZATION_ID"]) {
    assert.equal(parameters.get(code).value, "", code + " must ship empty so an unconfigured document cannot post");
  }
  assert.equal(parameters.get("FORM_THEME").value, "snow");
  assert.equal(parameters.get("FORM_MODE").value, "light");
  for (const theme of manifest.themes) {
    assert.ok(parameters.get("FORM_THEME").nls.en.DESCRIPTION.includes(theme), "the theme parameter must list " + theme);
  }
  assert.deepEqual(plain(manifest.modes), ["light", "dark"]);
  assert.deepEqual(plain(manifest.renderer.kinds), KINDS, "the manifest must name every kind the renderer draws");
  assert.match(template.javascript, /function oneOf\(value, allowed, fallback\)/, "an unknown theme or mode must fall back rather than reach data-theme");
  assert.match(template.javascript, /oneOf\(attribute\(root, "data-form-theme"\)\.toLowerCase\(\), THEMES, "snow"\)/);
  assert.match(template.javascript, /oneOf\(attribute\(root, "data-form-mode"\)\.toLowerCase\(\), MODES, "light"\)/);
  assert.match(template.javascript, /url\.protocol === "https:"/, "the document must reject a non-https api base");

  assert.equal(parameters.get("FORM_MAPS_API_KEY").value, "", "the maps key must ship empty");
  assert.match(parameters.get("FORM_MAPS_API_KEY").nls.en.DESCRIPTION, /restrict it by HTTP referrer/i, "the key parameter must warn that it is public");
  assert.match(template.javascript, /mapsApiKey: attribute\(root, "data-form-maps-api-key"\)/);
  assert.match(template.javascript, /if \(!apiKey\) return Promise\.reject/, "no key must mean no Google script at all");
  assert.equal((template.javascript.match(/maps\.googleapis\.com/g) || []).length, 1, "the maps script has exactly one origin and it is only reached through the loader");
  assert.match(template.javascript, /places\.AutocompleteSuggestion/, "the new Places data API is the primary path");
  assert.match(template.javascript, /places\.Autocomplete \?/, "the legacy widget stays as a fallback for older projects");

  for (const code of ["SUCCESS_TITLE", "SUCCESS_BODY", "SUCCESS_NEXT_TITLE", "SUCCESS_STEP_1", "SUCCESS_STEP_2", "SUCCESS_STEP_3", "SUCCESS_AGAIN_LABEL"]) {
    assert.equal(parameters.get(code).type, "LOCALIZED_STRING_SS", code + " is localized CMS copy");
    assert.match(template.html, new RegExp('data-copy-[a-z0-9-]+="\\$\\{' + code + '@LOCALIZED_STRING_SS\\}"'), code + " reaches the renderer through a data-copy attribute");
  }
  for (const code of ["SUCCESS_STEP_1", "SUCCESS_STEP_2", "SUCCESS_STEP_3", "SUCCESS_AGAIN_LABEL"]) {
    assert.equal(parameters.get(code).value.en, "", code + " ships empty, so the generic default lists no next step and offers no second submission");
  }
  assert.doesNotMatch(
    parameters.get("SUCCESS_TITLE").value.en + " " + parameters.get("SUCCESS_BODY").value.en,
    /quote|propert|account|sign|regist|touch|email/i,
    "the default confirmation promises nothing beyond receipt, whatever the form type",
  );

  const tokens = await fs.readFile(path.join(root, "runtime/styles/tokens.css"), "utf8");
  for (const theme of manifest.themes.filter((value) => value !== "hvac")) {
    assert.ok(tokens.includes('data-theme="' + theme + '"'), "tokens.css must define the " + theme + " palette");
  }

  assert.equal(template.parameters.filter((parameter) => parameter.code.startsWith("FORM_")).length, 7);
  assert.ok(template.parameters.every((parameter) => parameter.nls.en.DESCRIPTION.trim().length > 0), "every parameter needs a description in CMS");
} finally {
  await fs.rm(documentDir, { recursive: true, force: true });
}

console.log("portal-form-check ok: " + KINDS.length + " field kinds, token DSL with spaced masks, attributeOrder authority, parent type ids, declarative behaviour only, anonymous requests, token-driven theming, constrained theme and mode, address fields that load no Google script without a key and wait for importLibrary with one, a repeating address that adds, removes and submits a JSON array, takes the first click on a suggestion and keeps typed text on screen across re-renders, hidden attributes that never render yet still submit, and address coordinates asked for on every typed commit that follow every add, edit and removal without ever reaching the screen; focus and the first click survive blur and re-render, address suggestions follow the ARIA combobox pattern, each address string is geocoded once, and the success screen promises only its copy");
