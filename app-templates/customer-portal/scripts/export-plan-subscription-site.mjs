import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { assertJteSafeTemplate } from "./export-portal-form-manual.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const distRoot = path.join(portalRoot, "dist/manual-upload");
const defaultOutputDir = path.join(distRoot, "plan-subscription-site");
const runtimeRoot = path.join(portalRoot, "runtime/plan-subscription");
const entitlementsPath = path.join(portalRoot, "scripts/plan-subscription/entitlements/config.json");
export const ROOT_CODE = "CORPORATE_LANDING_JTE";
export const REFERENCE_PAGE = "/request-demo.html";
const SHARED = ["core.js", "copy.js", "ui.js"];
export const LANGUAGES = ["en", "ru", "fr", "es", "ar", "he", "zh"];
const DESKTOP_BACKGROUND = "ac160291-315d-4109-94be-5a45196ec696";
const MOBILE_BACKGROUND = "c0e500d1-b9f6-4ead-8723-e01bc52de63e";

function parameter(code, type, value, name, description) {
  return { code, type, value, nls: { en: description ? { NAME: name, DESCRIPTION: description } : { NAME: name } }, options: [] };
}

function backgrounds(prefix) {
  return [
    parameter(prefix + "_BG_IMAGE_1", "IMAGE", DESKTOP_BACKGROUND, "Background image (desktop)"),
    parameter(prefix + "_BG_IMAGE_2", "IMAGE", MOBILE_BACKGROUND, "Background image (mobile)"),
  ];
}

function head(prefix) {
  return [
    `<link rel="preload" as="image" href="/core/image/\${${prefix}_BG_IMAGE_2@IMAGE}/get" fetchpriority="high" media="(max-width: 47.9375rem)">`,
    `<link rel="preload" as="image" href="/core/image/\${${prefix}_BG_IMAGE_1@IMAGE}/get" fetchpriority="high" media="(min-width: 48rem)">`,
  ].join("\n");
}

function sectionOpen(prefix, screen, attributes) {
  const extra = Object.entries(attributes).map(([name, code]) => ` ${name}="\${${code}}"`).join("");
  return `<section class="ps-page" data-ps-section="${screen}"${extra} style="--ps-bg-image: url('/core/image/\${${prefix}_BG_IMAGE_1@IMAGE}/get'); --ps-bg-image-mobile: url('/core/image/\${${prefix}_BG_IMAGE_2@IMAGE}/get');">`;
}

export function copyCode(key) {
  return "PS_" + key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9]+/g, "_").toUpperCase();
}

async function loadCopy() {
  const context = vm.createContext({});
  context.window = context;
  for (const name of ["copy.js", "locales.js"]) {
    vm.runInContext(await fs.readFile(path.join(runtimeRoot, name), "utf8"), context, { filename: name });
  }
  const ns = context.PlanSubscription;
  return { flat: ns.copy.flatten(ns.copy.defaults, ""), locales: ns.locales };
}

function copyParameters(screen, copy) {
  const keys = Object.keys(copy.flat).filter((key) => key.startsWith(screen + "."));
  return keys.map((key) => {
    const value = { en: copy.flat[key] };
    for (const language of LANGUAGES.slice(1)) {
      const translated = copy.locales[language] && copy.locales[language][key];
      if (typeof translated !== "string" || !translated.trim()) throw new Error(`Missing ${language} translation for ${key}`);
      value[language] = translated;
    }
    return { key, parameter: parameter(copyCode(key), "LOCALIZED_STRING_SS", value, key, copy.flat[key]) };
  });
}

function copyNodes(entries) {
  return [`<div hidden data-ps-copy>`, ...entries.map(({ key, parameter: param }) => `  <span data-ps-copy-key="${key}">\${${param.code}@LOCALIZED_STRING_SS}</span>`), `</div>`].join("\n");
}

function boot(screen, options) {
  const settings = Object.entries(options).map(([key, value]) => `      ${key}: ${value},`).join("\n");
  return `(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var html = document.documentElement;
    function dark() { html.setAttribute("data-theme", "dark"); }
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(dark);
    else dark();
    var section = document.querySelector('[data-ps-section="${screen}"]');
    if (!section) return;
    window.PlanSubscription.${screen}.mount(section.querySelector("[data-ps-root]"), {
      apiBase: window.location.origin,
      locale: html.getAttribute("lang") || "en",
      copy: window.PlanSubscription.copy.fromDocument(section, "${screen}"),
${settings}
    });
  });
})();`;
}

export async function buildPackage() {
  const read = (name) => fs.readFile(path.join(runtimeRoot, name), "utf8");
  const [css, entitlements] = await Promise.all([
    read("plan-subscription.css"),
    fs.readFile(entitlementsPath, "utf8").then(JSON.parse),
  ]);
  const modules = async (names) => (await Promise.all(SHARED.concat(names).map(read))).map((source) => source.trim()).join("\n");
  const rules = {
    planCodes: entitlements.plans.productCodes,
    siteExpansionCodes: entitlements.addons.siteExpansion.productCodes,
    weatherCode: entitlements.addons.weather.productCode,
    maximumByPlanCode: entitlements.propertyCapacity.overallPlanMaximum.byPlanCode,
  };
  const copy = await loadCopy();
  const purchaseCopy = copyParameters("purchase", copy);
  const confirmCopy = copyParameters("confirm", copy);
  const orderCopy = copyParameters("order", copy);
  const codeOf = (entries, key) => entries.find((entry) => entry.key === key).parameter.code;

  const sections = [
    {
      code: "SUBSCRIBE",
      nls: { en: { NAME: "Subscribe", DESCRIPTION: "Self-service ServiceWand plan purchase: plan, add-ons, company details, PLAN_SUBSCRIPTION submit." } },
      head: head("SUBSCRIBE"),
      html: [
        sectionOpen("SUBSCRIBE", "purchase", { "data-ps-organization-id": "SUBSCRIBE_ORGANIZATION_ID@INTEGER", "data-ps-sales-url": "SUBSCRIBE_SALES_URL@STRING" }),
        `  <div class="container">`,
        `    <div class="ps-page__container">`,
        `      <h2 class="ps-page__title">\${${codeOf(purchaseCopy, "purchase.title")}@LOCALIZED_STRING_SS}</h2>`,
        `      <p class="subtitle ps-page__subtitle">\${${codeOf(purchaseCopy, "purchase.subtitle")}@LOCALIZED_STRING_SS}</p>`,
        `      <div class="ps-page__body" data-ps-root></div>`,
        `    </div>`,
        `  </div>`,
        copyNodes(purchaseCopy),
        `</section>`,
      ].join("\n"),
      css,
      javascript: (await modules(["catalog.js", "selection.js", "purchase.js"])) + "\n" + boot("purchase", {
        organizationId: `Number(section.getAttribute("data-ps-organization-id"))`,
        organizationCode: JSON.stringify(entitlements.ownerOrganizationCode),
        salesHref: `section.getAttribute("data-ps-sales-url") || "request-demo.html"`,
        rules: JSON.stringify(rules),
      }),
      parameters: [
        parameter("SUBSCRIBE_ORGANIZATION_ID", "INTEGER", 0, "Seller organization ID", "Numeric id of the SERVICEWAND organization in this environment; 0 keeps the form disabled."),
        parameter("SUBSCRIBE_SALES_URL", "STRING", "request-demo.html", "Talk to sales link"),
        ...backgrounds("SUBSCRIBE"),
        ...purchaseCopy.map((entry) => entry.parameter),
      ],
    },
    {
      code: "SUBSCRIBE_CONFIRM",
      nls: { en: { NAME: "Subscribe confirmation link", DESCRIPTION: "Landing page for the PLAN_SUBSCRIPTION VERIFY_EMAIL and CONFIRM_PURCHASE email links." } },
      head: head("SUBSCRIBE_CONFIRM"),
      html: [
        sectionOpen("SUBSCRIBE_CONFIRM", "confirm", { "data-ps-purchase-url": "SUBSCRIBE_CONFIRM_PURCHASE_URL@STRING" }),
        `  <div class="container">`,
        `    <div class="ps-page__container">`,
        `      <div class="ps-page__body" data-ps-root></div>`,
        `    </div>`,
        `  </div>`,
        copyNodes(confirmCopy),
        `</section>`,
      ].join("\n"),
      css,
      javascript: (await modules(["confirm.js"])) + "\n" + boot("confirm", {
        purchaseHref: `section.getAttribute("data-ps-purchase-url") || "subscribe.html"`,
      }),
      parameters: [
        parameter("SUBSCRIBE_CONFIRM_PURCHASE_URL", "STRING", "subscribe.html", "Start a new request link"),
        ...backgrounds("SUBSCRIBE_CONFIRM"),
        ...confirmCopy.map((entry) => entry.parameter),
      ],
    },
    {
      code: "SUBSCRIPTION_ORDER",
      nls: { en: { NAME: "Subscription order", DESCRIPTION: "Read-only view of a confirmed DRAFT subscription Order through its native AccessGrant link." } },
      head: head("SUBSCRIPTION_ORDER"),
      html: [
        sectionOpen("SUBSCRIPTION_ORDER", "order", { "data-ps-contact-url": "SUBSCRIPTION_ORDER_CONTACT_URL@STRING" }),
        `  <div class="container">`,
        `    <div class="ps-page__container">`,
        `      <div class="ps-page__body" data-ps-root></div>`,
        `    </div>`,
        `  </div>`,
        copyNodes(orderCopy),
        `</section>`,
      ].join("\n"),
      css,
      javascript: (await modules(["order.js"])) + "\n" + boot("order", {
        contactHref: `section.getAttribute("data-ps-contact-url") || ""`,
      }),
      parameters: [
        parameter("SUBSCRIPTION_ORDER_CONTACT_URL", "STRING", "", "Contact link for expired order links", "Empty hides the contact button."),
        ...backgrounds("SUBSCRIPTION_ORDER"),
        ...orderCopy.map((entry) => entry.parameter),
      ],
    },
  ].map((section) => ({ ...section, templateLanguage: "JTE", advanced: false }));

  for (const section of sections) assertJteSafeTemplate(section);

  return {
    $schema: "customer-portal/plan-subscription-site@1",
    rootCode: ROOT_CODE,
    pageOrganizationCode: entitlements.ownerOrganizationCode,
    sections,
    pages: [
      { url: "/subscribe.html", section: "SUBSCRIBE", reference: REFERENCE_PAGE, organizationIdParameter: "SUBSCRIBE_ORGANIZATION_ID" },
      { url: "/subscribe-confirm.html", section: "SUBSCRIBE_CONFIRM", reference: REFERENCE_PAGE, excludeFromSeo: true },
      { url: "/subscription-order.html", section: "SUBSCRIPTION_ORDER", reference: REFERENCE_PAGE, excludeFromSeo: true },
    ],
  };
}

export async function exportPlanSubscriptionSite(options = {}) {
  const outputDir = path.resolve(options.outputDir || defaultOutputDir);
  const insideDist = path.relative(distRoot, outputDir);
  const insideTemp = path.relative(os.tmpdir(), outputDir);
  const safe = [insideDist, insideTemp].some((relative) => relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  if (!safe) throw new Error("Manual packages may only be written under dist/manual-upload/ or a temporary directory");
  const pkg = await buildPackage();
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  return { outputDir, sections: pkg.sections.map((section) => section.code), pages: pkg.pages.map((page) => page.url) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outIndex = process.argv.indexOf("--out");
  const result = await exportPlanSubscriptionSite({ outputDir: outIndex > 0 ? process.argv[outIndex + 1] : undefined });
  console.log(JSON.stringify(result, null, 2));
}
