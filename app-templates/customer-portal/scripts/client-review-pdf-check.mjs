import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const root = path.resolve("app-templates/customer-portal/runtime/client-review");
const sandbox = { URL, Intl, Promise, setTimeout, clearTimeout };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const file of ["copy.js", "core-contract.js", "adapter.js", "normalizer.js", "pdf.js", "controller.js", "fixtures.js", "vendor/roboto-font.js"]) {
  vm.runInContext(await fs.readFile(path.join(root, file), "utf8"), sandbox, { filename: file });
}
const CR = sandbox.ClientReview;
const engine = createRequire(import.meta.url)(path.join(root, "vendor/jspdf-4.2.1.umd.min.js"));
const copy = CR.defaultCopy();
const options = { engine, font: sandbox.ClientReviewPdfFont, locale: "en-CA", now: new Date("2026-10-02T12:00:00Z") };
const output = path.resolve("tmp/pdfs/client-review");
await fs.mkdir(output, { recursive: true });
function snapshot(scenario) {
  const data = CR.fixtures.setup(scenario).data;
  const view = CR.normalizer.reviewModel({ ...data, grant: CR.normalizer.grantOf(data.grant) }, { locale: "en-CA", contract: CR.contract });
  return { phase: "ready", view, contact: view.contact };
}
const quote = snapshot("quote-review");
const agreement = snapshot("agreement-review");
for (const [name, input] of [["quotation", quote], ["agreement", agreement]]) {
  const result = CR.pdf.build(input, copy, options);
  assert.match(result.filename, name === "agreement" ? /^service-agreement-\d+\.pdf$/ : /^quotation-\d+\.pdf$/);
  const bytes = Buffer.from(result.bytes);
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(bytes.length > 10000);
  await fs.writeFile(path.join(output, name + ".pdf"), bytes);
}
for (const phase of ["loading", "error", "link-closed", "link-missing", "unconfigured"]) {
  assert.equal(CR.pdf.offered({ ...quote, phase }), false);
  assert.throws(() => CR.pdf.build({ ...quote, phase }, copy, options));
}
for (const kind of ["preparing", "checking", "unavailable", "empty", "closed"]) assert.equal(CR.pdf.offered({ ...quote, view: { ...quote.view, kind } }), false);
assert.equal(CR.pdf.available({ ...quote, view: { ...quote.view, unreadableOrders: 1 } }), false);
assert.equal(CR.pdf.available({ ...agreement, view: { ...agreement.view, accountUnavailable: true } }), false);

const long = JSON.parse(JSON.stringify(agreement));
long.view.names.client = "ООО Снежный двор - Montréal";
long.view.parties.client.legalName = long.view.names.client;
long.view.parties.client.billingAddress = "улица Пушкина, дом 10, Санкт-Петербург";
long.view.agreement.terms = Array.from({ length: 70 }, (_, i) => ({ kind: "clause", number: String(i + 1) + ".", depth: 1, text: "Conditions du service - Сроки и условия. " + "An unusually long service description must wrap without clipping the page. ".repeat(7) }));
long.view.properties[0].options[0].lines[0].product = "A long service label ".repeat(90);
const longResult = CR.pdf.build(long, copy, options);
assert.ok(longResult.document.getNumberOfPages() > 8);
await fs.writeFile(path.join(output, "long-unicode.pdf"), Buffer.from(longResult.bytes));
const unsupported = JSON.parse(JSON.stringify(agreement));
unsupported.view.names.client = "你好";
assert.throws(() => CR.pdf.build(unsupported, copy, options), /does not support/, "missing glyphs never silently become a corrupt PDF");

let generated = [], saved = [], release;
const setup = CR.fixtures.setup("agreement-review");
const controller = CR.createController({ adapter: setup.adapter, pdfFactory: (input) => { generated.push(input); return new Promise((resolve) => { release = resolve; }); }, pdfSave: (result) => saved.push(result) }).start();
await controller.idle();
controller.dispatch("details.input", { code: "LEGAL_NAME", value: "UNSENT-DRAFT" });
controller.dispatch("agreement.draft", { value: "UNSENT-COMMENT" });
controller.dispatch("pdf.download");
controller.dispatch("pdf.download");
await Promise.resolve();
assert.equal(generated.length, 1, "duplicate clicks generate only one document");
assert.equal(controller.snapshot().pdf.status, "pending");
assert.deepEqual(Object.keys(generated[0]).sort(), ["contact", "logoUrl", "phase", "view"]);
assert.doesNotMatch(JSON.stringify(generated[0]), /UNSENT-DRAFT|UNSENT-COMMENT|token=|https:/);
release({ filename: "test.pdf" });
await controller.idle();
assert.equal(saved.length, 1);
assert.equal(controller.snapshot().pdf.status, "downloaded");
controller.dispatch("pdf.download");
await Promise.resolve();
await controller.reload();
release({ filename: "stale.pdf" });
await controller.idle();
assert.equal(saved.length, 1, "changed/reloaded view is not downloaded using a stale snapshot");
assert.equal(controller.snapshot().pdf.status, "failed");
controller.dispatch("pdf.download");
await Promise.resolve();
setup.adapter.introspect = () => Promise.reject({ code: "link-closed" });
await controller.reload();
release({ filename: "revoked.pdf" });
await controller.idle();
assert.equal(controller.snapshot().phase, "link-closed");
assert.equal(saved.length, 1, "a revoked link cannot download the previously readable document");
controller.stop();

let attempts = 0;
const failing = CR.createController({ adapter: CR.fixtures.setup("quote-review").adapter, pdfFactory: () => { attempts++; throw new Error("Unavailable library"); }, pdfSave: () => { throw new Error("Must not save a failed result"); } }).start();
await failing.idle();
failing.dispatch("pdf.download");
await failing.idle();
assert.equal(failing.snapshot().pdf.status, "failed");
failing.dispatch("pdf.download");
await failing.idle();
assert.equal(attempts, 2, "export failure releases the guard for an explicit retry");
failing.stop();
console.log("client-review-pdf-check ok: real quotation/agreement PDFs, pagination and Unicode, partial/closed states, no drafts or tokens, duplicate protection, stale snapshot refusal and retry; artifacts: " + output);
