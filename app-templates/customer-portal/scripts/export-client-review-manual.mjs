import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import { assertJteSafeTemplate } from "./export-portal-form-manual.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const distRoot = path.join(portalRoot, "dist/manual-upload");
const defaultOutputDir = path.join(distRoot, "client-review-document");
const reviewRoot = path.join(portalRoot, "runtime/client-review");
const rootCode = "CLIENT_REVIEW_DOCUMENT";
const apiBaseCode = "REVIEW_API_BASE_URL";
const portalUrlCode = "PORTAL_URL";
const urlValidators = { [apiBaseCode]: "safeApiBase", [portalUrlCode]: "safePortalUrl" };
const styleFiles = ["tokens.css", "base.css", "components.css"];
export const runtimeFiles = ["copy.js", "core-contract.js", "adapter.js", "normalizer.js", "components.js", "controller.js"];
export const previewOnlyFiles = ["fixtures.js"];
const COPY_NOTES = {
  CONFIRM_INFORMATION_STATEMENT: "Statement the client agrees to with the INFORMATION_CONFIRMED checkbox. A description on that event attribute replaces this default; a value changed here replaces the description.",
  CONFIRM_AUTHORITY_STATEMENT: "Statement the client agrees to with the AUTHORITY_CONFIRMED checkbox. A description on that event attribute replaces this default; a value changed here replaces the description.",
};

export async function exportClientReviewManual(options = {}) {
  const outputDir = path.resolve(options.outputDir || defaultOutputDir);
  assertSafeOutputDir(outputDir);

  const [portalCss, reviewCss, runtime, fixtures] = await Promise.all([
    Promise.all(styleFiles.map((name) => fs.readFile(path.join(portalRoot, "runtime/styles", name), "utf8"))),
    fs.readFile(path.join(reviewRoot, "client-review.css"), "utf8"),
    Promise.all(runtimeFiles.map((name) => fs.readFile(path.join(reviewRoot, name), "utf8"))),
    Promise.all(previewOnlyFiles.map((name) => fs.readFile(path.join(reviewRoot, name), "utf8"))),
  ]);

  const runtimeJs = runtime.map((source) => source.trim()).join("\n");
  const contract = contractOf(runtimeJs);
  const css = portalCss.concat([reviewCss]).map((source) => source.trim()).concat([documentCss()]).join("\n\n");
  const template = templateFor(css, runtimeJs + "\n" + bootScript(), contract.copy);
  assertUrlDefaults(template, contract);
  assertJteSafeTemplate(template);
  assertNoScriptTerminator(template.javascript);
  assertPrintable({ head: template.head, html: template.html, css: template.css, javascript: template.javascript, fixtures: fixtures.join("\n") });
  const manifest = manifestFor(template, contract);
  const preview = previewFor(template, runtimeJs, fixtures.join("\n"));
  assertNoScriptTerminator(fixtures.join("\n"));

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "client-review-manual-"));
  try {
    await writePackage(tempDir, { template, manifest, preview });
    await replaceDirectory(outputDir, tempDir);
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
  return { outputDir, template, manifest, preview };
}

function contractOf(runtimeJs) {
  const sandbox = { URL, Intl };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(runtimeJs, sandbox, { filename: "client-review-runtime.js" });
  const review = sandbox.ClientReview;
  if (!review || !review.adapter || !review.contract || typeof review.boot !== "function") {
    throw new Error("The client review runtime did not register its adapter, contract and boot");
  }
  if (review.fixtures) throw new Error("The client review runtime must not carry fixtures into the CMS document");
  return {
    copy: review.copyEntries.map((entry) => ({ code: entry[0], key: entry[1], value: entry[2] })),
    grant: JSON.parse(JSON.stringify(review.adapter.contract)),
    core: JSON.parse(JSON.stringify(review.contract)),
    checkingDelays: JSON.parse(JSON.stringify(review.checkingDelays)),
    acceptsUrl: (code, value) => review.adapter[urlValidators[code]](value) === value,
  };
}

function assertUrlDefaults(template, contract) {
  for (const code of Object.keys(urlValidators)) {
    const parameter = template.parameters.find((entry) => entry.code === code);
    if (!parameter || parameter.type !== "STRING") throw new Error(code + " must be a STRING parameter of the document");
    if (parameter.value !== "" && !contract.acceptsUrl(code, parameter.value)) {
      throw new Error("Refusing to export " + code + " with a default the page would discard: " + parameter.value);
    }
  }
}

function documentCss() {
  return [
    "html, body { min-height: 100%; }",
    "body { margin: 0; background: var(--app-bg); color: var(--ink); font-family: var(--font); }",
  ].join("\n");
}

function templateFor(css, javascript, copy) {
  const attributes = {
    id: "client-review-root",
    "data-review-data-mode": "live",
    "data-review-api-base": ref(apiBaseCode, "STRING"),
    "data-review-portal-url": ref(portalUrlCode, "STRING"),
  };
  copy.forEach((entry) => { attributes["data-copy-" + kebab(entry.key)] = ref(entry.code); });
  return {
    code: rootCode,
    nls: { en: { NAME: "Client review — quotation and agreement" } },
    templateLanguage: "JTE",
    parent: null,
    children: [],
    head: [
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="robots" content="noindex, nofollow">',
      '<meta name="referrer" content="no-referrer">',
      "<title>" + ref("DOCUMENT_TITLE") + "</title>",
      '<link rel="icon" href="data:,">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;530;600;700;800&display=swap" rel="stylesheet">',
    ].join("\n"),
    html: "<section " + attrs(attributes) + ">\n  <div data-client-review-mount></div>\n"
      + "  <p class=\"cr-visually-hidden\" role=\"status\" aria-live=\"polite\" aria-atomic=\"true\" data-client-review-live></p>\n</section>",
    css,
    javascript,
    parameters: [
      field(apiBaseCode, "", "STRING", "Absolute https origin of the Core deployment with no path, for example https://dev-1.servicewand.com. Any other value is discarded and the page reports that it is not set up. The link token is read only from the #token= fragment of the address the client opens; no token, account or customer value is configured here."),
      field(portalUrlCode, "", "STRING", "Absolute https address of the customer portal, for example https://portal.example.com/. When set, an approved agreement and a closed link offer an Open the customer portal button that links to it; while empty, the page explains portal access without a button. Any other value is discarded and no button shows. It is only linked to: no account, user or token value is configured here."),
    ].concat(copy.map((entry) => field(entry.code, entry.value, "LOCALIZED_STRING_SS", copyDescription(entry.code, entry.value)))),
  };
}

function copyDescription(code, value) {
  const placeholders = [...new Set((value.match(/\{[a-zA-Z]+\}/g) || []))];
  return "Client review document copy."
    + (placeholders.length ? " Keep " + placeholders.join(", ") + ": the page fills them in." : "")
    + (COPY_NOTES[code] ? " " + COPY_NOTES[code] : "");
}

function bootScript() {
  return `(function () {
  "use strict";
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true }); else fn(); }
  function followScheme(query) { document.documentElement.dataset.mode = query && query.matches ? "dark" : "light"; }
  ready(function () {
    var root = document.getElementById("client-review-root");
    if (!root || !window.ClientReview || typeof window.ClientReview.boot !== "function") return;
    document.documentElement.dataset.theme = "snow";
    var query = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    followScheme(query);
    if (query && typeof query.addEventListener === "function") query.addEventListener("change", function () { followScheme(query); });
    window.addEventListener("hashchange", function () { window.location.reload(); });
    window.ClientReview.boot(root, {});
  });
})();`;
}

function manifestFor(template, contract) {
  const grant = contract.grant;
  const core = contract.core;
  const entity = (name, tail) => "POST {apiBase}/" + grant.entities[name].service + "/i/{token}/" + grant.entities[name].segment + "/" + tail;
  return {
    schemaVersion: 1,
    uploadPerformed: false,
    kind: "client-review-document",
    template: {
      code: template.code,
      templateLanguage: template.templateLanguage,
      parameterCount: template.parameters.length,
      sha256: {
        head: sha256(template.head),
        html: sha256(template.html),
        css: sha256(template.css),
        javascript: sha256(template.javascript),
      },
    },
    runtime: {
      sources: runtimeFiles.map((name) => "app-templates/customer-portal/runtime/client-review/" + name),
      styles: styleFiles.map((name) => "app-templates/customer-portal/runtime/styles/" + name)
        .concat(["app-templates/customer-portal/runtime/client-review/client-review.css"]),
      previewOnly: previewOnlyFiles.map((name) => "app-templates/customer-portal/runtime/client-review/" + name),
      dataMode: "live",
      theme: "snow",
      colorMode: "prefers-color-scheme",
      checkingDelaysMs: contract.checkingDelays,
    },
    api: {
      introspect: "POST {apiBase}/" + grant.introspect.service + "/i/{token}/" + grant.introspect.tail,
      reads: [
        entity("document", "list.json"),
        entity("account", "list.json"),
        entity("order", "list.json"),
        entity("order", "get.json") + "?id={orderId}",
        entity("order-item", "list.json"),
        entity("product-price", "list.json"),
        entity("product", "list.json"),
      ],
      commands: [
        entity("order", "event.json") + " { id, event, metadata }",
        entity("document", "event.json") + " { id, event, metadata }",
      ],
      listBody: "{ offset, pageSize: " + grant.pageSize + " }, at most " + grant.pageLimit + " pages",
      credentials: "omit",
      token: "read from the #token= fragment only; it appears in no query string, storage, console output or page markup",
    },
    events: {
      order: Object.keys(core.orderEvents).map((key) => core.orderEvents[key].code),
      agreement: Object.keys(core.agreementEvents).map((key) => core.agreementEvents[key].code),
      contractDetailsAttributes: core.contractDetails.attributes.map((attribute) => attribute.code),
    },
    plannedFields: {
      order: [core.orderAttributes.address, core.orderAttributes.pricingModel],
      orderLines: core.rawShape.orderLines,
      agreement: [
        core.agreementAttributes.providerLegalName,
        core.agreementAttributes.providerRepresentativeName,
        core.agreementAttributes.providerRepresentativeJobTitle,
        core.agreementAttributes.terms,
        core.agreementAttributes.detailsErrors,
      ].concat(core.contractDetails.attributes.map((attribute) => attribute.code)),
      accountPrimaryEmail: "contacts[type PRIMARY].contactEntries[type EMAIL].value, shown only when exactly one is returned",
    },
    verified: [
      "On 2026-09-21 a fresh dev-1 grant returned Document, Account, Order, OrderItem, ProductPrice and Product through their anonymous service endpoints, with canRead true in introspection.",
      "Order totals and Order/Document states[].code are server-owned fields; line details join through Order.items -> OrderItem.itemPrice -> ProductPrice.product -> Product.",
      "Grant list endpoints accept anonymous POST requests with offset and pageSize, get.json takes ?id=, and event.json accepts { id, event, metadata }.",
    ],
    unverified: [
      "Event metadata reaches the workflow hook, and required event attributes are enforced on this path (QUOTATION-PACKAGE-FLOW.md §9).",
      "The generated CLIENT_REVIEW_DOCUMENT package still needs a production CMS upload and browser acceptance with a fresh real link.",
      "The checking state, a returned details step and the portal invitation have not been exercised against dev-1. CLIENT_DETAILS_ERRORS is read as the details processor seed writes it, and whether the link's Account profile returns contacts with their EMAIL entries is unverified; without them the invitation names no address.",
    ],
    constraints: [
      "REVIEW_API_BASE_URL must be an absolute https origin without a path. Until it is set the page reports that it is not set up and sends nothing.",
      "PORTAL_URL ships empty. When it is an absolute https address, the completion states, the closed-after-approval state and a closed link offer an Open the customer portal link to it; any other value is discarded and no link shows. The portal access text itself never depends on Account.user.",
      "Every other parameter is copy. No token, account, order, document or customer value is a parameter.",
      "While the agreement is CLIENT_DETAILS_RECEIVED the page re-reads it one read at a time after " + contract.checkingDelays.map((ms) => ms / 1000).join(", ") + " s, then says the check is taking longer than usual and offers Refresh status. It stops re-reading as soon as the agreement leaves that state.",
      "CLIENT_DETAILS_ERRORS reaches the client only as copy: a known code marks its field, PROCESSING_FAILED has its own notice, and an unknown code adds a generic line, never the code.",
      "The document ships in live data mode with no fixtures. A data mode other than live finds no fixtures and reports that it is not set up; it never shows demonstration data.",
      "Money is shown only as the server returns it: unit price as amount, quantity as itemCount, subtotal as totalCharges, taxes as totalTaxes and option total as grandTotal. A field the server does not return has no row; nothing is summed or multiplied in the browser.",
      "Every command is single-flight per record and renders only the state read back afterwards; a refusal shows the server message and assumes nothing.",
      "Markup is built with createElement and textContent; the runtime uses no innerHTML, eval or new Function, and terms are rendered as text blocks.",
      "The theme is snow and the colour mode follows the viewer's prefers-color-scheme.",
    ],
  };
}

function previewFor(template, runtimeJs, fixturesJs) {
  const values = new Map(template.parameters.map((parameter) => [parameter.code, parameter.type.startsWith("LOCALIZED") ? parameter.value.en : parameter.value]));
  const resolve = (value) => value.replace(/\$\{([A-Z0-9_]+)@([A-Z_]+)\}/g, (_, code) => escapeHtml(values.get(code) || ""));
  const html = resolve(template.html).replace('data-review-data-mode="live"', 'data-review-data-mode="fixture"');
  return "<!doctype html>\n<html lang=\"en\" data-theme=\"snow\" data-mode=\"light\">\n<head>\n"
    + resolve(template.head) + "\n<style>\n" + template.css + "\n</style>\n</head>\n<body>\n"
    + html + "\n<script>\n" + runtimeJs + "\n" + fixturesJs + "\n</script>\n"
    + "<script>\ndocument.addEventListener(\"DOMContentLoaded\", function () {\n"
    + "  var controller = window.ClientReview.boot(document.getElementById(\"client-review-root\"), { scenario: \"quote-review\", locale: \"en-CA\" });\n"
    + "  if (controller) window.ClientReview.fixtures.play(controller, controller.steps);\n"
    + "});\n</script>\n</body>\n</html>\n";
}

async function writePackage(dir, packageData) {
  await fs.mkdir(path.join(dir, "root"), { recursive: true });
  await writeJson(path.join(dir, "cms-family.payload.json"), { schemaVersion: 1, root: packageData.template, children: [] });
  await writeJson(path.join(dir, "manual-export-manifest.json"), packageData.manifest);
  await writeJson(path.join(dir, "root/template.json"), packageData.template);
  await writeText(path.join(dir, "root/head.html"), packageData.template.head);
  await writeText(path.join(dir, "root/html.html"), packageData.template.html);
  await writeText(path.join(dir, "root/css.css"), packageData.template.css);
  await writeText(path.join(dir, "root/javascript.js"), packageData.template.javascript);
  await writeJson(path.join(dir, "root/parameters.json"), packageData.template.parameters);
  await writeText(path.join(dir, "preview.html"), packageData.preview);
  await writeText(path.join(dir, "README.md"), readme(packageData));
}

function readme(packageData) {
  const manifest = packageData.manifest;
  return [
    "# Client review — quotation and agreement",
    "",
    "One anonymous, token-only CMS document for the snow quotation flow: quote review, the contract details step, agreement review and every state around them, in the customer portal design language.",
    "Generated by `scripts/export-client-review-manual.mjs`. Never hand-edit this directory. There is no upload script.",
    "",
    "| field | value |",
    "| --- | --- |",
    "| template code | `" + packageData.template.code + "` |",
    "| template language | `" + packageData.template.templateLanguage + "` |",
    "| parameters | " + packageData.template.parameters.length + " |",
    "| data mode | `" + manifest.runtime.dataMode + "` |",
    "",
    "## Configure",
    "",
    "| parameter | meaning |",
    "| --- | --- |",
    "| `" + apiBaseCode + "` | absolute https origin of the Core deployment, without a path |",
    "| `" + portalUrlCode + "` | optional absolute https address of the customer portal; empty shows no portal button |",
    "",
    "Every other parameter is copy. The client opens the page with `#token=` in the address; the token is never a parameter.",
    "",
    "## Contract",
    "",
    "```text",
    manifest.api.introspect,
    ...manifest.api.reads,
    ...manifest.api.commands,
    "```",
    "",
    "## Verified",
    "",
    ...manifest.verified.map((line) => "- " + line),
    "",
    "## Unverified",
    "",
    ...manifest.unverified.map((line) => "- " + line),
    "",
    "## Constraints",
    "",
    ...manifest.constraints.map((line) => "- " + line),
    "",
    "`preview.html` renders the document against the repository fixtures, so it opens without a network.",
    "",
  ].join("\n");
}

export function controlCharacterOffsets(value) {
  const offsets = [];
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127 || code === 65533) offsets.push(index);
  }
  return offsets;
}

function assertPrintable(fields) {
  for (const [name, value] of Object.entries(fields)) {
    const offsets = controlCharacterOffsets(value);
    if (offsets.length) {
      throw new Error("Refusing to export " + name + ": control character " + value.charCodeAt(offsets[0]) + " at offset " + offsets[0] + " would be rewritten by the HTML parser inside an inline script");
    }
  }
}

function assertNoScriptTerminator(source) {
  if (/<\/script/i.test(source)) throw new Error("Refusing to inline a script that contains a script terminator");
}

function assertSafeOutputDir(outputDir) {
  const insideDist = path.relative(distRoot, outputDir);
  const insideTemp = path.relative(os.tmpdir(), outputDir);
  const underDist = insideDist && !insideDist.startsWith("..") && !path.isAbsolute(insideDist);
  const underTemp = insideTemp && !insideTemp.startsWith("..") && !path.isAbsolute(insideTemp);
  if (!underDist && !underTemp) {
    throw new Error("Manual packages may only be written under dist/manual-upload/ or a temporary directory");
  }
}

async function replaceDirectory(outputDir, tempDir) {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(outputDir), { recursive: true });
  await fs.rename(tempDir, outputDir);
}

async function writeText(file, value) { await fs.writeFile(file, String(value).replace(/\n*$/, "\n"), "utf8"); }
async function writeJson(file, value) { await writeText(file, JSON.stringify(value, null, 2)); }
function sha256(value) { return crypto.createHash("sha256").update(value, "utf8").digest("hex"); }
function kebab(key) { return key.replace(/[A-Z]/g, (character) => "-" + character.toLowerCase()); }
function field(code, value, type, description) {
  return {
    code,
    type,
    nls: { en: { NAME: code.replaceAll("_", " "), DESCRIPTION: description } },
    value: type.startsWith("LOCALIZED") ? { en: value } : value,
  };
}
function ref(code, type = "LOCALIZED_STRING_SS") { return "$" + "{" + code + "@" + type + "}"; }
function attrs(map) {
  return Object.entries(map).map((entry) => entry[0] + '="' + escapeHtml(entry[1]) + '"').join("\n  ");
}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const flag = process.argv.indexOf("--output");
  const result = await exportClientReviewManual({ outputDir: flag !== -1 ? process.argv[flag + 1] : undefined });
  console.log("export-client-review-manual ok: " + path.relative(process.cwd(), result.outputDir)
    + " (" + result.template.parameters.length + " parameters)");
}
