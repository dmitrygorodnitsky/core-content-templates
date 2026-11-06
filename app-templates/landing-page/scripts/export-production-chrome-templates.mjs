/* Export two independent, production-filled header/footer BlockTemplates.
 *
 * The required code suffix prevents this package from targeting the source
 * production templates by code. CMS upload remains a separate explicit step.
 */

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { composeCmsFamily } from "./compose-cms-family.mjs";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const landingRoot = resolve(scriptsDir, "..");
const DEFAULT_VALUES = join(
  landingRoot,
  "content",
  "servicewand-production-chrome",
  "parameter-values.json",
);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--code-suffix") out.codeSuffix = args[++index];
    else if (arg === "--values") out.values = args[++index];
    else if (arg === "--out") out.out = args[++index];
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
  node app-templates/landing-page/scripts/export-production-chrome-templates.mjs \\
    --code-suffix BLOG \\
    [--out app-templates/landing-page/dist/manual-upload/servicewand-production-chrome-blog]

The suffix is mandatory and is appended to both source template codes. For
--code-suffix BLOG the generated codes are:
  FIELD_SERVICE_LANDING_HEADER_BLOG
  FIELD_SERVICE_LANDING_FOOTER_BLOG

The exporter only writes a local flat upload package. It does not access CMS.`;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeText = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, String(value ?? "").replace(/\n*$/, "\n"));
};
const writeJson = (file, value) => writeText(file, JSON.stringify(value, null, 2));
const codeToken = (value) => String(value || "")
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");
const fileSlug = (value) => codeToken(value).toLowerCase().replaceAll("_", "-");

const validateSuffix = (value) => {
  const suffix = codeToken(value);
  if (!suffix || suffix !== value?.trim()?.toUpperCase()) {
    throw new Error("--code-suffix must use only uppercase A-Z, digits, and single underscores.");
  }
  if (!/^[A-Z][A-Z0-9_]*$/.test(suffix) || suffix.includes("__")) {
    throw new Error("--code-suffix must start with A-Z and must not contain repeated underscores.");
  }
  return suffix;
};

const splitTemplate = (dir, template) => {
  writeJson(join(dir, "template.json"), template);
  writeText(join(dir, "head.html"), template.head || "");
  writeText(join(dir, "html.html"), template.html || "");
  writeText(join(dir, "css.css"), template.css || "");
  writeText(join(dir, "javascript.js"), template.javascript || "");
  writeJson(join(dir, "parameters.json"), template.parameters || []);
};

const blankLocalizedLike = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((locale) => [locale, " "]));
  }
  return { en: " " };
};

const completeMappedValues = (snapshot) => {
  const header = { ...snapshot.templates.header.values };
  const footer = { ...snapshot.templates.footer.values };
  if (!Object.hasOwn(header, "locale_selector_trigger_label")) {
    const source = header.locale_selector_dropdown_aria_label;
    if (source === undefined) throw new Error("Production snapshot cannot supply locale_selector_trigger_label.");
    header.locale_selector_trigger_label = source;
  }
  if (!Object.hasOwn(footer, "copyright_rights")) {
    footer.copyright_rights = blankLocalizedLike(footer.copyright_text);
  }
  return { header, footer };
};

const applyValues = ({ template, values }) => {
  const prefix = `${template.code}_`;
  const valuesByToken = new Map(
    Object.entries(values).map(([localCode, value]) => [codeToken(localCode), value]),
  );
  const missing = [];
  for (const parameter of template.parameters || []) {
    if (!parameter.code.startsWith(prefix)) {
      throw new Error(`${template.code}: parameter does not use the generated prefix: ${parameter.code}`);
    }
    const localToken = parameter.code.slice(prefix.length);
    if (!valuesByToken.has(localToken)) {
      missing.push(parameter.code);
      continue;
    }
    parameter.value = valuesByToken.get(localToken);
  }
  if (missing.length) {
    throw new Error(`Production values are missing for generated parameters:\n${missing.map((code) => `  - ${code}`).join("\n")}`);
  }
  if (/lorem ipsum/i.test(JSON.stringify(template.parameters))) {
    throw new Error(`${template.code}: placeholder Lorem Ipsum survived production value application.`);
  }
  return template;
};

const makeSpec = ({ suffix, headerCode, footerCode }) => ({
  $schema: "lab-ui/landing-spec@1",
  code: `PRODUCTION_CHROME_EXPORT_${suffix}`,
  name: `Production Chrome Export | ${suffix}`,
  url: `/internal/production-chrome-${fileSlug(suffix)}`,
  locale: "en",
  theme: "cyan",
  sections: [
    {
      block: "header.corporate-reference",
      code: headerCode,
      parameterPrefix: headerCode,
      name: `Production Header | ${suffix}`,
    },
    {
      block: "footer.corporate-reference",
      code: footerCode,
      parameterPrefix: footerCode,
      name: `Production Footer | ${suffix}`,
    },
  ],
});

export const exportProductionChromeTemplates = ({
  codeSuffix,
  valuesPath = DEFAULT_VALUES,
  outputDir,
  quiet = false,
}) => {
  const suffix = validateSuffix(codeSuffix);
  const snapshot = readJson(resolve(valuesPath));
  if (snapshot.$schema !== "lab-ui/production-page-chrome-values@2") {
    throw new Error(`Unsupported production chrome snapshot: ${snapshot.$schema || "<no schema>"}`);
  }
  const headerCode = `${snapshot.templates.header.rootTemplateCode}_${suffix}`;
  const footerCode = `${snapshot.templates.footer.rootTemplateCode}_${suffix}`;
  if (headerCode.length > 100 || footerCode.length > 100) {
    throw new Error("Generated template code is too long; use a shorter --code-suffix.");
  }
  const out = resolve(
    outputDir || join(landingRoot, "dist", "manual-upload", `servicewand-production-chrome-${fileSlug(suffix)}`),
  );
  const generatedSpecsRoot = join(landingRoot, "compositions", "generated");
  const distRoot = join(landingRoot, "dist");
  mkdirSync(generatedSpecsRoot, { recursive: true });
  mkdirSync(distRoot, { recursive: true });
  const specScratch = mkdtempSync(join(generatedSpecsRoot, ".production-chrome-export-"));
  const buildScratch = mkdtempSync(join(distRoot, ".production-chrome-export-"));
  const specPath = join(specScratch, "landing.spec.json");
  const mapped = completeMappedValues(snapshot);

  try {
    writeJson(specPath, makeSpec({ suffix, headerCode, footerCode }));
    const family = composeCmsFamily({ specPath, outDir: buildScratch });
    const header = family.children.find((template) => template.code === headerCode);
    const footer = family.children.find((template) => template.code === footerCode);
    if (!header || !footer) throw new Error("Generated chrome templates were not found in the compiler result.");
    const templates = [
      applyValues({ template: header, values: mapped.header }),
      applyValues({ template: footer, values: mapped.footer }),
    ].map((template) => ({ ...template, parent: null, children: [] }));

    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    splitTemplate(join(out, "header"), templates[0]);
    splitTemplate(join(out, "footer"), templates[1]);
    writeJson(join(out, "cms-family.payload.json"), {
      schemaVersion: 1,
      root: templates[0],
      children: [templates[1]],
    });
    const uploadOut = `app-templates/landing-page/dist/manual-upload/servicewand-production-chrome-${fileSlug(suffix)}`;
    writeText(join(out, "README.md"), `# Production-filled chrome | ${suffix}

Two independent BlockTemplates generated from repo-owned corporate chrome blocks
and the versioned production PageContext snapshot:

- \`${headerCode}\`
- \`${footerCode}\`

The suffix prevents the flat uploader from targeting the source production
templates. Parent links, root includes, enabled templates, and PageContext are
not part of this package.

Create-only production dry-run:

\`\`\`bash
SERVICEWAND_API_KEY="..." \\
node app-templates/landing-page/scripts/upload-cms-family.mjs \\
  --out ${uploadOut} \\
  --base-url https://servicewand.com/core \\
  --org SYSTEM \\
  --require-missing \\
  --dry-run
\`\`\`

Replace \`--dry-run\` with \`--live\` only after both codes are reported as
\`would create\`.
`);

    if (!quiet) {
      console.log(`Production-filled chrome export written: ${relative(process.cwd(), out)}`);
      console.log(`Templates: ${headerCode}, ${footerCode}`);
      console.log(`Parameters: ${templates.reduce((total, template) => total + template.parameters.length, 0)}`);
    }
    return { outputDir: out, templates, codes: [headerCode, footerCode] };
  } finally {
    rmSync(specScratch, { recursive: true, force: true });
    rmSync(buildScratch, { recursive: true, force: true });
  }
};

const main = () => {
  const args = parseArgs();
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.codeSuffix) throw new Error(usage());
  exportProductionChromeTemplates({
    codeSuffix: args.codeSuffix,
    valuesPath: args.values,
    outputDir: args.out,
  });
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`export-production-chrome-templates: ${error.stack || error.message || String(error)}`);
    process.exit(1);
  }
}
