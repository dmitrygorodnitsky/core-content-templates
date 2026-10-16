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
const mapsKeyCode = "REVIEW_MAPS_API_KEY";
const urlValidators = { [apiBaseCode]: "safeApiBase", [portalUrlCode]: "safePortalUrl" };
const styleFiles = ["tokens.css", "base.css", "components.css"];
export const runtimeFiles = ["copy.js", "core-contract.js", "adapter.js", "normalizer.js", "plan.js", "pdf.js", "maps.js", "components.js", "controller.js"];
const pdfVendorFiles = ["jspdf-4.2.1.umd.min.js", "roboto-font.js"];
export const previewOnlyFiles = ["fixtures.js"];
const COPY_NOTES = {
  CONFIRM_INFORMATION_STATEMENT: "Statement the client agrees to with the INFORMATION_CONFIRMED checkbox. A description on that event attribute replaces this default; a value changed here replaces the description.",
  CONFIRM_AUTHORITY_STATEMENT: "Statement the client agrees to with the AUTHORITY_CONFIRMED checkbox. A description on that event attribute replaces this default; a value changed here replaces the description.",
};

export async function exportClientReviewManual(options = {}) {
  const outputDir = path.resolve(options.outputDir || defaultOutputDir);
  assertSafeOutputDir(outputDir);

  const [portalCss, reviewCss, runtime, fixtures, pdfVendor] = await Promise.all([
    Promise.all(styleFiles.map((name) => fs.readFile(path.join(portalRoot, "runtime/styles", name), "utf8"))),
    fs.readFile(path.join(reviewRoot, "client-review.css"), "utf8"),
    Promise.all(runtimeFiles.map((name) => fs.readFile(path.join(reviewRoot, name), "utf8"))),
    Promise.all(previewOnlyFiles.map((name) => fs.readFile(path.join(reviewRoot, name), "utf8"))),
    Promise.all(pdfVendorFiles.map((name) => fs.readFile(path.join(reviewRoot, "vendor", name), "utf8"))),
  ]);

  const runtimeJs = runtime.map((source) => source.trim()).join("\n");
  const contract = contractOf(runtimeJs);
  const css = portalCss.concat([reviewCss]).map((source) => source.trim()).concat([documentCss()]).join("\n\n");
  const template = templateFor(css, runtimeJs + "\n" + bootScript(), contract.copy, pdfVendor);
  assertUrlDefaults(template, contract);
  assertMapsKeyShipsEmpty(template);
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

function assertMapsKeyShipsEmpty(template) {
  const parameter = template.parameters.find((entry) => entry.code === mapsKeyCode);
  if (!parameter || parameter.type !== "STRING") throw new Error(mapsKeyCode + " must be a STRING parameter of the document");
  if (parameter.value !== "") throw new Error("Refusing to export " + mapsKeyCode + " with a value: the key is set in the page's PageContext, and an upload keeps the CMS value only for a parameter the package ships empty");
}

function documentCss() {
  return [
    "html, body { min-height: 100%; }",
    "body { margin: 0; background: var(--app-bg); color: var(--ink); font-family: var(--font); }",
  ].join("\n");
}

function templateFor(css, javascript, copy, pdfVendor) {
  const attributes = {
    id: "client-review-root",
    "data-review-data-mode": "live",
    "data-review-api-base": ref(apiBaseCode, "STRING"),
    "data-review-portal-url": ref(portalUrlCode, "STRING"),
    "data-review-maps-api-key": ref(mapsKeyCode, "STRING"),
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
      ...pdfVendor.map((source) => '<script src="data:application/javascript;base64,' + Buffer.from(source).toString("base64") + '"></script>'),
    ].join("\n"),
    html: "<section " + attrs(attributes) + ">\n  <div data-client-review-mount></div>\n"
      + "  <p class=\"cr-visually-hidden\" role=\"status\" aria-live=\"polite\" aria-atomic=\"true\" data-client-review-live></p>\n</section>",
    css,
    javascript,
    parameters: [
      field(apiBaseCode, "", "STRING", "Absolute https origin of the Core deployment with no path, for example https://dev-1.servicewand.com. Any other value is discarded and the page reports that it is not set up. The link token is read only from the #token= fragment of the address the client opens; no token, account or customer value is configured here."),
      field(portalUrlCode, "", "STRING", "Absolute https address of the customer portal, for example https://portal.example.com/. When set, an approved agreement offers an Open the customer portal button above and below its text, and a closed link offers it once; while empty, the page explains portal access without a button. Any other value is discarded and no button shows. It is only linked to: no account, user or token value is configured here."),
      field(mapsKeyCode, "", "STRING", "Google Maps browser key of the contract details step: address suggestions and a map for the billing address, and each approved property's plan drawn over a map. Use the same browser key as the quote form's FORM_MAPS_API_KEY, restricted by HTTP referrer to this host and to the Maps JavaScript, Places and Geocoding APIs; it is visible in page source, as every browser key is. Set the value in the page's PageContext, not in the template: the package ships it empty so an upload never overwrites it. While it is empty or not a key, no Google script is loaded, the billing address stays a plain text field and no plan is shown. With a key the page sends its origin, never its path or link, as the referrer, because Google checks a browser key against it."),
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
  const tokenOf = (name) => (grant.entities[name].grant === "property" ? "{propertyToken}" : "{token}");
  const entity = (name, tail) => "POST {apiBase}/" + grant.entities[name].service + "/i/" + tokenOf(name) + "/" + grant.entities[name].segment + "/" + tail;
  const fragment = "#" + grant.fragment.token + "=";
  const propertyFragment = "#" + grant.fragment.propertyToken + "=";
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
      pdfAssets: pdfVendorFiles.map((name) => "app-templates/customer-portal/runtime/client-review/vendor/" + name),
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
        entity("address", "list.json") + " (while the main grant lists Address)",
        "POST {apiBase}/" + grant.introspect.service + "/i/{propertyToken}/" + grant.introspect.tail + " (only when the link carries " + propertyFragment + "; any failure means no property is readable)",
        entity("resource", "list.json") + " (only while the property grant introspects Resource as readable)",
        "GET {apiBase}/" + grant.image.service + "/" + grant.image.head + "/{imageId}/" + grant.image.tail + "?width=" + grant.image.width + " (the provider logo, loaded by the browser as an image, without the token)",
        "GET {apiBase}/" + grant.plan.service + "/" + grant.plan.head + "/{planId}/" + grant.plan.tail + " (an approved property plan named by its granted Resource's " + core.propertyAttributes.plan + ", read anonymously on the contract details step while " + mapsKeyCode + " is set, without the token)",
        "GET https://maps.googleapis.com/maps/api/js?key={" + mapsKeyCode + "} (only while " + mapsKeyCode + " is set and only on the contract details step; the token never reaches Google)",
      ],
      commands: [
        entity("order", "event.json") + " { id, event, metadata }",
        entity("document", "event.json") + " { id, event, metadata }",
      ],
      listBody: "{ offset, pageSize: " + grant.pageSize + " }, at most " + grant.pageLimit + " pages",
      credentials: "omit",
      token: "read from the " + fragment + " fragment only; it appears in no query string, storage, console output or page markup, and reaches the clipboard only inside the page address, when the client presses Copy link",
      propertyToken: "read from the " + propertyFragment + " fragment only, beside " + fragment + "; it is the separate core-rm grant of the package's Resource rows, used for the property introspection and the Resource list and nothing else, and is kept out of queries, storage, console output and page markup like the main token",
    },
    events: {
      order: Object.keys(core.orderEvents).map((key) => core.orderEvents[key].code),
      agreement: Object.keys(core.agreementEvents).map((key) => core.agreementEvents[key].code),
      contractDetailsAttributes: core.contractDetails.attributes.map((attribute) => attribute.code),
    },
    plannedFields: {
      order: [core.orderAttributes.property, core.orderAttributes.pricingModel],
      resource: [core.propertyAttributes.address, core.propertyAttributes.plan],
      address: core.addressFormat.parts.concat([core.addressFormat.fallback]),
      orderLines: core.rawShape.orderLines,
      optionLabel: "the Order's " + core.orderAttributes.pricingModel + " while it still carries one; otherwise the NAME its lines' ProductPrice rows share, else the price type (" + core.priceVariants.perService + " when no price is recurrent, " + core.priceVariants.recurring + " when every one is) refined to " + core.priceVariants.monthly + " or " + core.priceVariants.seasonal + " only by OrderItem." + core.priceVariants.lineMetadata + " " + core.priceVariants.intervalCount + "/" + core.priceVariants.intervalUnit + " in " + core.priceVariants.monthUnit + " (1 or more), else Option {n}",
      agreement: [
        core.agreementAttributes.providerLegalName,
        core.agreementAttributes.providerRepresentativeName,
        core.agreementAttributes.providerRepresentativeJobTitle,
        core.agreementAttributes.providerContactPhone,
        core.agreementAttributes.providerContactEmail,
        core.agreementAttributes.providerLogo,
        core.agreementAttributes.terms,
        core.agreementAttributes.detailsErrors,
      ].concat(core.contractDetails.attributes.map((attribute) => attribute.code)),
      account: ["LEGAL_ENTITY_TYPE"],
      accountPrimaryEmail: "contacts[type PRIMARY].contactEntries[type EMAIL], PRIMARY then WORK then one unambiguous populated value",
    },
    verified: [
      "On 2026-10-15 dev-1 agreement 208 was sent with both grants: the main one carried the quotes, the Account, the Document and the property's Address, the core-rm one the property Resource; through " + propertyFragment + " the page read the Resource's ADDRESS and PROPERTY_PLAN and showed the address, and a link without it or with a revoked property token showed the address as unavailable without an error.",
      "On 2026-09-21 a fresh dev-1 grant returned Document, Account, Order, OrderItem, ProductPrice and Product through their anonymous service endpoints, with canRead true in introspection.",
      "Order totals and Order/Document states[].code are server-owned fields; line details join through Order.items -> OrderItem.itemPrice -> ProductPrice.product -> Product.",
      "Grant list endpoints accept anonymous POST requests with offset and pageSize, get.json takes ?id=, and event.json accepts { id, event, metadata }.",
      "On 2026-09-23 a dev-1 link returned the Account's contacts and addresses as ids only, and the backend confirmed that Contact, ContactEntry and AccountAddress will never be grantable. The details pre-fill and the portal sign-in address therefore read Account attributes.",
      "On 2026-10-07 dev-1 served a PropertyPlan file without any credential from /core/media/{id}/stream.json on the grant API's origin, answered 'Entity type MediaAsset is not grantable' and 'Entity type Resource is not grantable' to grant/mappings.json, and exposed no grant endpoint under /core-rm. Contract details accepted on dev-1 were saved by the details processor as a BILLING AccountAddress of their own, beside the SERVICE ones, even when the text matched a service address.",
      "On 2026-10-15 dev-1 (core-rm 5.0.2869) granted Resource, whose SYSTEM grant profile 77 includes attributes. A grant issue context accepts only the entity types registered on its own node: core-bill refuses Resource and core-rm refuses Order. A core-rm grant introspected on /core/i/{propertyToken}/introspect.json as Resource with canRead true; /core/i/{token}/address/list.json returned the granted Address rows (country as id, without code) and /core-rm/i/{token}/address/ does not exist.",
      "On 2026-10-07 the Maps JavaScript API (weekly, 3.66) reported the page to Google (AuthenticationService.Authenticate, QuotaService.RecordEvent) as scheme, host and path with user info, query and fragment cleared, so the #token= fragment does not reach Google; Chromium honoured the referrer policy switched at run time from no-referrer to strict-origin and sent the origin alone.",
      "On 2026-10-13 dev-1 had only the SYSTEM DEFAULT grant profiles for these types, with no organization rows or named profiles: OrderItem (115) exposes itemPrice{id,nls} but no metadata, ProductPrice (96) nls and type{id,code,nls} but no attributes, Product (92) code and nls. A link can therefore tell a per-service price (TIERED) from a recurring one (TIERED_RECURRENT) and read a price name, but not a monthly from a seasonal price: their INTERVAL is a ProductPrice attribute and the pricer's copy of it is OrderItem metadata. Every SNOWLIMITLESS price had an empty nls.",
    ],
    unverified: [
      "Event metadata reaches the workflow hook, and required event attributes are enforced on this path (QUOTATION-PACKAGE-FLOW.md §9).",
      "The generated CLIENT_REVIEW_DOCUMENT package still needs a production CMS upload and browser acceptance with a fresh real link.",
      "The checking state, a returned details step and the portal invitation have not been exercised against dev-1. CLIENT_DETAILS_ERRORS is read as the details processor seed writes it.",
      "Address suggestions, the billing address map and the plan map have not run against Google with this page's own key: " + mapsKeyCode + " is set by the operator in the page's PageContext, and the preview draws on a stub map.",
    ],
    constraints: [
      "Download PDF creates a local, selectable-text A4 copy of the normalized authorized view, including every quotation option or the agreement's parties, services and terms. It never exports a token, URL, unsent form or comment draft, recalculates money, or sends document data to another service. Partial reads disable export, duplicate clicks are single-flight, and a changed or revoked document is not downloaded after generation. The pinned jsPDF engine and Roboto font are embedded as data-URI scripts to avoid JTE interpreting the vendor's template literals; no library/font request leaves the page.",
      "REVIEW_API_BASE_URL must be an absolute https origin without a path. Until it is set the page reports that it is not set up and sends nothing.",
      "PORTAL_URL ships empty. When it is an absolute https address, the completion states offer an Open the customer portal link to it above and below the agreement, and the thank-you state after approval and a closed link offer it once; any other value is discarded and no link shows. The portal access text itself never depends on Account.user.",
      "Copy link is offered on the quote review, contract details and agreement review steps, never on an approved agreement or a state card. It hands the browser's clipboard the address the page was opened with, #token= fragment included, when the client presses it, and sends it nowhere else. A browser that refuses the write leaves the client with the address bar and the provider's email. The link carries nothing the client typed: a returning client sees what the provider's system holds.",
      "A link that closes after the details or the approval were sent ends on a thank-you card; a link that is closed when it is opened keeps the expired-or-withdrawn card.",
      "An agreement awaiting approval offers Request changes beside Approve when the link delegates " + core.agreementEvents.changes.code + ". The client's text is sent as " + core.agreementEvents.changes.messageAttribute + "; an empty text is not sent. The link stays open, and while the agreement is CLIENT_CHANGES_REQUESTED it thanks the client, says the provider emails a new link, and shows the agreement as it was sent. A link issued before the change request existed offers approval alone.",
      "Contact us closes every page that has read an agreement. It shows the agreement's " + core.agreementAttributes.providerContactPhone + " and " + core.agreementAttributes.providerContactEmail + ", which the provider's workflow copies from the organization before it issues each link: a dialable number and a mail address become links, anything else is shown as text, and a missing value has no row. The agreement pages show the provider's logo from " + core.agreementAttributes.providerLogo + ", an image id; an agreement without one, or an image that fails to load, shows none.",
      mapsKeyCode + " ships empty; its value is the operator's, set in the page's PageContext. While it is empty or not a key the page loads no Google script, the billing address is a plain text field and no plan is shown. With a key, the contract details step loads the Maps JavaScript API once, offers Google address suggestions under the billing address, pins the chosen or typed address on a map (or says it was not found, and the client can still send it as written), and switches the document's referrer policy from no-referrer to strict-origin so Google can check the key against the page's origin; the #token= fragment is never part of a referrer.",
      "The billing address is the client's own value. The contract details step offers each approved property's service address as a button that copies it into the billing field, where the client sees and can change it, and sends it as BILLING_ADDRESS like a typed address; nothing fills the billing field from a service address on its own.",
      "A link may carry " + propertyFragment + " beside " + fragment + ": a second grant, issued on core-rm, of one Resource per property of the package. The page introspects it and lists Resource with it, and lists Address with the main token. A link without it, or a property grant or Address read that fails for any reason (401 and 404 included), shows the page the main grant decides, with each property's address unavailable and no plan: it never closes the page, shows an error or retries for it.",
      "A property's address is its granted Resource's " + core.propertyAttributes.address + " id looked up among the granted Address rows, written as the backend writes addresses: " + core.addressFormat.parts.join(", ") + ", each trimmed, empty parts and parts equal to an earlier one (ignoring case) skipped, joined with \"" + core.addressFormat.separator + "\", else the Address " + core.addressFormat.fallback + ". An id that is missing or not among the granted rows gives no address.",
      "Each approved property whose granted Resource names one plan in " + core.propertyAttributes.plan + " (a MediaAsset id, or a one-entry media list) shows it on the contract details step while " + mapsKeyCode + " is set: the file is read anonymously from /core/media/{id}/stream.json, its GOOGLE_MAPS shapes are drawn read-only over a satellite map, and the page lists each element with the area on the plan in square feet, measured like the Plans editor and Approve Plan (local equirectangular projection, elevation ignored). Image overlays are not drawn. PROPERTY_PLAN_DRAFT is never read. Two different plans, an unreadable file or a file without a map shape show that the plan cannot be shown.",
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
    "| `" + mapsKeyCode + "` | optional Google Maps browser key, set in the page's PageContext; empty shows plain address fields and no plan |",
    "",
    "Every other parameter is copy. The client opens the page with `#token=`, and on newer links `&property-token=`, in the address; no token is ever a parameter.",
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
