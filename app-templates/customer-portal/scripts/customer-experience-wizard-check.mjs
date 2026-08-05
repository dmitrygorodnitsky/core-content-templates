import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  createDescriptorFromAnswers,
  creationReport,
} from "./create-customer-experience.mjs";

const [base, schema, registry] = await Promise.all([
  read("../experience/descriptors/calm-harbor-spa.staging.json"),
  read("../experience/config/customer-experience.schema.json"),
  read("../experience/config/customer-experience.parameters.json"),
]);
const answers = {
  id: "northwind-hvac-staging",
  brandName: "Northwind HVAC",
  vertical: "hvac",
  environment: "staging",
  organization: "NORTHWIND_HVAC_STAGING",
  accountTypeCode: "CUSTOMER_ACCOUNT",
  allowedNavOrigin: "https://dev-1.servicewand.com/",
};
const descriptor = createDescriptorFromAnswers(base, answers, schema, registry);
assert.equal(descriptor.experience.vertical, "hvac");
assert.equal(descriptor.experience.language, "en");
assert.equal(descriptor.experience.direction, "ltr");
assert.equal(descriptor.content.login.documentTitle.en, "Sign in — Northwind HVAC");
assert.equal(descriptor.content.twoFactor.documentTitle.en, "Two-step verification — Northwind HVAC");
assert.equal(descriptor.surfaces.portal.profile, "on-demand-commerce");
assert.equal(descriptor.surfaces.portal.anonymousIntent.mode, "closed");
assert.equal(descriptor.surfaces.portal.registration.mode, "closed");
assert.equal(descriptor.surfaces.portal.url.status, "unresolved");
assert.equal(creationReport(descriptor).publishable, false);

assert.throws(() => createDescriptorFromAnswers(base, { ...answers, allowedNavOrigin: "http://unsafe.invalid/" }, schema, registry), /canonical HTTPS origin/);
assert.throws(() => createDescriptorFromAnswers(base, { ...answers, language: "not_a_locale" }, schema, registry), /BCP-47/);
assert.throws(() => createDescriptorFromAnswers(base, { ...answers, profile: "appointments-commerce" }, schema, registry), /does not support vertical/);
assert.throws(() => createDescriptorFromAnswers(base, { ...answers, anonymousIntentMode: "selection-only" }, schema, registry), /Anonymous selection requires/);
assert.throws(() => createDescriptorFromAnswers(base, { ...answers, registrationMode: "core-auth" }, schema, registry), /URL is required|requires a resolved destination/);

console.log("customer-experience-wizard-check ok: synthetic HVAC descriptor validates and unsafe origin/profile/activation answers fail closed");

async function read(relativePath) {
  return JSON.parse(await fs.readFile(new URL(relativePath, import.meta.url), "utf8"));
}
