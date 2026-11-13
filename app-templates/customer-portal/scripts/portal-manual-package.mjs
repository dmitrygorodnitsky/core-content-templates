import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const portalRoot = path.resolve("app-templates/customer-portal");
const styleFiles = ["tokens.css", "base.css", "shell.css", "components.css", "routes.css", "responsive.css", "seo.css"];

export const oidcLibrary = {
  integrity: "sha384-EX6IlpbPbIxs1Zi4cPDGkFJm4YuPKx31VxifYK2nLwYtwc7EoKJRA9a2BFBNxz1H",
  src: "https://cdnjs.cloudflare.com/ajax/libs/oidc-client-ts/3.0.1/browser/oidc-client-ts.js",
};

export function portalHead(title, robots) {
  return '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + escapeHtml(title) + '</title>\n'
    + (robots ? '<meta name="robots" content="' + escapeHtml(robots) + '">\n' : "")
    + '<link rel="icon" href="data:,">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;530;600;700;800&display=swap" rel="stylesheet">\n<script src="' + oidcLibrary.src + '" integrity="' + oidcLibrary.integrity + '" crossorigin="anonymous" referrerpolicy="no-referrer"></script>';
}

export async function readStyles() {
  const parts = await Promise.all(styleFiles.map(async (name) => {
    const content = await fs.readFile(path.join(portalRoot, "runtime/styles", name), "utf8");
    return "/* manual portal source: runtime/styles/" + name + " */\n" + content.trim();
  }));
  return parts.join("\n\n") + "\n";
}

export async function splitTemplate(root, template) {
  await writeJson(path.join(root, "template.json"), template);
  await writeText(path.join(root, "head.html"), template.head);
  await writeText(path.join(root, "html.html"), template.html);
  await writeText(path.join(root, "css.css"), template.css);
  await writeText(path.join(root, "javascript.js"), template.javascript);
  await writeJson(path.join(root, "parameters.json"), template.parameters);
}

export async function assertExactInventory(root, expected) {
  const actual = (await filesUnderAny(root)).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected.slice().sort())) throw new Error("Manual portal package inventory is not exact");
}

async function filesUnderAny(root, relative = "") {
  const result = [];
  for (const name of (await fs.readdir(path.join(root, relative))).sort()) {
    const item = path.join(relative, name);
    const stat = await fs.stat(path.join(root, item));
    if (stat.isDirectory()) result.push(...await filesUnderAny(root, item));
    else result.push(item.split(path.sep).join("/"));
  }
  return result;
}

export async function replaceDirectory(outputDir, staging) {
  const backup = outputDir + ".backup-" + crypto.randomBytes(8).toString("hex");
  const hadOutput = await exists(outputDir);
  try {
    if (hadOutput) await fs.rename(outputDir, backup);
    await fs.rename(staging, outputDir);
    if (hadOutput) await fs.rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (await exists(outputDir)) await fs.rm(outputDir, { recursive: true, force: true });
    if (hadOutput && await exists(backup)) await fs.rename(backup, outputDir);
    throw error;
  }
}

export function attrs(values) {
  return Object.entries(values).map(([key, value]) => key + '="' + escapeHtml(value) + '"').join(" ");
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function exists(target) {
  try { await fs.access(target); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

export async function writeJson(target, value) {
  await writeText(target, JSON.stringify(value, null, 2) + "\n");
}

export async function writeText(target, value) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, String(value).replace(/\n*$/, "\n"), "utf8");
}
