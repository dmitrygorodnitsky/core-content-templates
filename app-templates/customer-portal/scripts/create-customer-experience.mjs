import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertValidCmsPayload } from "./cms-schema-validation.mjs";
import {
  DEFAULT_EXPERIENCE_PATH,
  DEFAULT_REGISTRY_PATH,
  DEFAULT_SCHEMA_PATH,
  validateDescriptorSemantics,
  validateParameterRegistry,
} from "./customer-experience-config-report.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const portalRoot = path.resolve(scriptsDir, "..");
const defaultOutputDir = path.join(portalRoot, "content/cases");
const profileDefaults = {
  hvac: "on-demand-commerce",
  snow: "storm-operations",
  lawn: "storm-operations",
  pool: "storm-operations",
  roofing: "storm-operations",
  pest: "storm-operations",
  health: "appointments-service",
  beauty: "beauty-catalog",
};

export function createDescriptorFromAnswers(baseDescriptor, answers, schema, registry) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw new Error("Answers must be a JSON object");
  validateParameterRegistry(registry);
  const result = structuredClone(baseDescriptor);
  const vertical = requiredChoice(answers.vertical, Object.keys(profileDefaults), "vertical");
  const environment = requiredChoice(answers.environment || "staging", ["staging", "production"], "environment");
  const profile = answers.profile || profileDefaults[vertical];
  const profileDefinition = registry.profiles[profile];
  if (!profileDefinition || !profileDefinition.verticals.includes(vertical)) throw new Error("profile does not support vertical " + vertical);

  result.classification = environment + "-customer-experience";
  result.experience.id = requiredSlug(answers.id, "id");
  result.experience.vertical = vertical;
  result.experience.theme = requiredChoice(answers.theme || vertical, Object.keys(profileDefaults), "theme");
  result.experience.defaultMode = requiredChoice(answers.defaultMode || "light", ["light", "dark"], "defaultMode");
  result.experience.language = requiredLanguage(answers.language || "en");
  result.experience.direction = requiredChoice(answers.direction || "ltr", ["ltr", "rtl"], "direction");
  result.experience.brandName.en = requiredText(answers.brandName, "brandName");
  const origin = canonicalOrigin(answers.allowedNavOrigin);
  result.experience.allowedNavOrigins = [origin];
  result.experience.support = urlSlot(answers.supportUrl, origin, "Support URL was not supplied.", "closed");

  result.surfaces.landing.url = urlSlot(answers.landingUrl, origin, "Landing PageContext URL is not known yet.");
  result.surfaces.portal.url = urlSlot(answers.portalUrl, origin, "Portal PageContext URL is not known yet.");
  result.surfaces.portal.profile = profile;
  result.surfaces.portal.capability = profile === "appointments-commerce" ? "target-appointments" : "current-staging";
  result.surfaces.portal.defaultRoute = answers.defaultRoute || profileDefinition.navigationRoutes[0];
  result.surfaces.portal.capabilities = {
    booking: requiredChoice(answers.booking || "closed", ["closed", "open"], "booking"),
    retail: requiredChoice(answers.retail || "browse-only", ["browse-only", "retail-commerce-open"], "retail"),
    planCommerce: requiredChoice(answers.planCommerce || "closed", ["closed", "open"], "planCommerce"),
    payment: requiredChoice(answers.payment || "closed", ["closed", "simulated"], "payment"),
    demoCommands: requiredChoice(answers.demoCommands || "closed", ["closed", "current-api"], "demoCommands"),
  };
  result.surfaces.portal.anonymousIntent = {
    mode: requiredChoice(answers.anonymousIntentMode || "closed", ["closed", "selection-only"], "anonymousIntentMode"),
    storage: "session",
    ttlSeconds: boundedInteger(answers.anonymousIntentTtlSeconds ?? 1800, 60, 86400, "anonymousIntentTtlSeconds"),
    maxItems: boundedInteger(answers.anonymousIntentMaxItems ?? 10, 1, 50, "anonymousIntentMaxItems"),
    reconciliationMode: "authenticated-server",
  };
  const registrationMode = requiredChoice(answers.registrationMode || "closed", ["closed", "core-auth"], "registrationMode");
  result.surfaces.portal.registration = {
    mode: registrationMode,
    destination: registrationMode === "closed"
      ? { status: "closed", url: null, reason: "Registration remains closed until Core Auth and customer Account provisioning are proven." }
      : urlSlot(answers.registrationUrl, origin, "Core Auth registration URL is required."),
  };

  result.deployment.environment = environment;
  result.deployment.organization = requiredCode(answers.organization, "organization");
  result.deployment.accountTypeCode = requiredCode(answers.accountTypeCode || "CUSTOMER_ACCOUNT", "accountTypeCode");
  result.deployment.pim.organization = result.deployment.organization;
  if (environment === "production") {
    result.deployment.pim.enrichmentMode = "closed";
  }
  result.content.portal.documentTitle.en = result.experience.brandName.en + " | Customer Portal";
  result.content.login.documentTitle.en = "Sign in — " + result.experience.brandName.en;
  result.content.twoFactor.documentTitle.en = "Two-step verification — " + result.experience.brandName.en;

  assertValidCmsPayload(schema, result, "Generated customer experience descriptor");
  validateDescriptorSemantics(result, registry);
  return result;
}

export function creationReport(descriptor) {
  const unresolved = [
    ["landingUrl", descriptor.surfaces.landing.url],
    ["portalUrl", descriptor.surfaces.portal.url],
    ["loginPageContextSelector", descriptor.surfaces.login.pageContextSelector],
  ].filter(([, value]) => value.status !== "resolved").map(([field, value]) => ({ field, reason: value.reason }));
  return {
    schemaVersion: 1,
    experienceId: descriptor.experience.id,
    structurallyValid: true,
    publishable: unresolved.length === 0,
    unresolved,
    nextSteps: [
      "Author tenant-specific landing content and update evidenceRefs before compiling the family.",
      "Resolve deployed landing and portal URLs.",
      "Prove the Core Auth PageContext selector and registration/account-provisioning contract before opening them.",
      "Request accepted UI states before activating anonymous selection or resume feedback.",
    ],
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [baseDescriptor, schema, registry] = await Promise.all([
    readJson(path.resolve(options.from || DEFAULT_EXPERIENCE_PATH)),
    readJson(DEFAULT_SCHEMA_PATH),
    readJson(DEFAULT_REGISTRY_PATH),
  ]);
  const answers = options.answers ? await readJson(path.resolve(options.answers)) : await promptForAnswers(baseDescriptor);
  const descriptor = createDescriptorFromAnswers(baseDescriptor, answers, schema, registry);
  const output = resolveOutput(options.output, descriptor.experience.id);
  await assertWritableTarget(output, options.force);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await atomicWrite(output, JSON.stringify(descriptor, null, 2) + "\n");
  const reportPath = output.replace(/\.json$/i, ".creation-report.json");
  await assertWritableTarget(reportPath, options.force);
  await atomicWrite(reportPath, JSON.stringify(creationReport(descriptor), null, 2) + "\n");
  process.stdout.write(JSON.stringify({ descriptor: output, report: reportPath }, null, 2) + "\n");
}

async function promptForAnswers(base) {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const vertical = await ask(terminal, "Vertical", base.experience.vertical);
    return {
      id: await ask(terminal, "Experience id (kebab-case)", base.experience.id),
      brandName: await ask(terminal, "Brand name", base.experience.brandName.en),
      vertical,
      theme: await ask(terminal, "Theme", vertical),
      defaultMode: await ask(terminal, "Default mode (light/dark)", base.experience.defaultMode),
      language: await ask(terminal, "Core Auth language (BCP-47)", base.experience.language),
      direction: await ask(terminal, "Core Auth direction (ltr/rtl)", base.experience.direction),
      environment: await ask(terminal, "Environment (staging/production)", base.deployment.environment),
      organization: await ask(terminal, "Organization code", base.deployment.organization),
      accountTypeCode: await ask(terminal, "Customer account type code", base.deployment.accountTypeCode),
      allowedNavOrigin: await ask(terminal, "Allowed HTTPS navigation origin", base.experience.allowedNavOrigins[0]),
      profile: await ask(terminal, "Portal profile", profileDefaults[vertical] || base.surfaces.portal.profile),
      booking: await ask(terminal, "Booking (closed/open)", "closed"),
      retail: await ask(terminal, "Retail (browse-only/retail-commerce-open)", "browse-only"),
      planCommerce: await ask(terminal, "Plan commerce (closed/open)", "closed"),
      payment: await ask(terminal, "Payment (closed/simulated)", "closed"),
      demoCommands: await ask(terminal, "Demo commands (closed/current-api)", "closed"),
      anonymousIntentMode: await ask(terminal, "Anonymous selection (closed/selection-only)", "closed"),
      registrationMode: await ask(terminal, "Registration (closed/core-auth)", "closed"),
      landingUrl: await ask(terminal, "Landing URL (blank = unresolved)", ""),
      portalUrl: await ask(terminal, "Portal URL (blank = unresolved)", ""),
      supportUrl: await ask(terminal, "Support URL (blank = closed)", ""),
      registrationUrl: await ask(terminal, "Core Auth registration URL (blank = unavailable)", ""),
    };
  } finally { terminal.close(); }
}

async function ask(terminal, label, fallback) {
  const value = (await terminal.question(label + " [" + fallback + "]: ")).trim();
  return value || fallback;
}

function resolveOutput(candidate, id) {
  const output = path.resolve(candidate || path.join(defaultOutputDir, id + ".customer-experience.json"));
  const designInbox = path.join(portalRoot, "design-inbox") + path.sep;
  if (output.startsWith(designInbox)) throw new Error("The immutable design-inbox cannot be an output target");
  if (!output.toLowerCase().endsWith(".json")) throw new Error("Output must be a .json file");
  return output;
}

async function assertWritableTarget(filePath, force) {
  try {
    await fs.access(filePath);
    if (!force) throw new Error("Output already exists; pass --force to replace: " + filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function atomicWrite(filePath, value) {
  const temporary = filePath + ".tmp-" + process.pid;
  await fs.writeFile(temporary, value, { flag: "wx" });
  await fs.rename(temporary, filePath);
}

function urlSlot(value, allowedOrigin, unresolvedReason, emptyStatus = "unresolved") {
  if (!value) return { status: emptyStatus, url: null, reason: unresolvedReason };
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || parsed.origin !== allowedOrigin || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error("URL must be a clean HTTPS URL on the allowed navigation origin");
  }
  return { status: "resolved", url: parsed.href, reason: null };
}

function canonicalOrigin(value) {
  const parsed = new URL(requiredText(value, "allowedNavOrigin"));
  if (parsed.protocol !== "https:" || parsed.href !== parsed.origin + "/") throw new Error("allowedNavOrigin must be a canonical HTTPS origin");
  return parsed.origin;
}

function requiredText(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(label + " is required");
  return value.trim();
}

function requiredSlug(value, label) {
  const result = requiredText(value, label);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) throw new Error(label + " must be kebab-case");
  return result;
}

function requiredCode(value, label) {
  const result = requiredText(value, label);
  if (!/^[A-Za-z0-9._:-]+$/.test(result)) throw new Error(label + " contains unsupported characters");
  return result;
}

function requiredLanguage(value) {
  const result = requiredText(value, "language");
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(result)) throw new Error("language must be a simple BCP-47 tag");
  return result;
}

function requiredChoice(value, choices, label) {
  if (!choices.includes(value)) throw new Error(label + " must be one of: " + choices.join(", "));
  return value;
}

function boundedInteger(value, minimum, maximum, label) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < minimum || result > maximum) throw new Error(label + " must be an integer from " + minimum + " to " + maximum);
  return result;
}

async function readJson(filePath) { return JSON.parse(await fs.readFile(filePath, "utf8")); }

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--from") options.from = argv[++index];
    else if (arg === "--answers") options.answers = argv[++index];
    else if (arg === "--output") options.output = argv[++index];
    else if (arg === "--force") options.force = true;
    else throw new Error("Unknown argument: " + arg);
  }
  for (const key of ["from", "answers", "output"]) if (options[key] === undefined && argv.includes("--" + key)) throw new Error("Missing value for --" + key);
  return options;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) await main();
