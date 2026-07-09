import fs from "node:fs/promises";
import path from "node:path";

const baseDir = path.resolve("app-templates/customer-portal");
const blockPath = path.join(baseDir, "cms/block.json");
const templatePath = path.join(baseDir, "cms/root-template.html");
const distDir = path.join(baseDir, "dist");
const previewPath = path.join(distDir, "customer-portal-preview.html");

const block = JSON.parse(await fs.readFile(blockPath, "utf8"));
const params = block.params || [];
const codes = params.map((param) => param.code);
const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
if (duplicates.length) {
  throw new Error("Duplicate CMS parameter codes: " + Array.from(new Set(duplicates)).join(", "));
}

const values = Object.fromEntries(params.map((param) => [param.code, param.default || ""]));
values.portal_title = "Customer Portal Preview";

let template = await fs.readFile(templatePath, "utf8");
template = template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function (_, code) {
  if (!(code in values)) throw new Error("No CMS default for template token: " + code);
  return escapeHtml(values[code]);
});

await fs.mkdir(distDir, { recursive: true });
await fs.writeFile(previewPath, template);
console.log(`export-cms ok: ${path.relative(process.cwd(), previewPath)}`);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
