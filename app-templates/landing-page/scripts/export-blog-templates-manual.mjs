import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { composeCmsFamily } from "./compose-cms-family.mjs";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const labRoot = resolve(scriptsDir, "..");
const manualRoot = join(labRoot, "dist", "manual-upload", "servicewand-blog");
const stagingRoot = join(labRoot, "dist", ".blog-export-staging");

const definitions = [
  {
    key: "index",
    code: "FIELD_SERVICE_BLOG_INDEX",
    spec: join(labRoot, "compositions", "specs", "servicewand-blog-index.spec.json"),
    build: join(stagingRoot, "index"),
    child: "02-field-service-blog-index",
    previewTitle: "ServiceWand Blog Index",
  },
  {
    key: "post",
    code: "FIELD_SERVICE_BLOG_POST",
    spec: join(labRoot, "compositions", "specs", "servicewand-blog-post.spec.json"),
    build: join(stagingRoot, "post"),
    child: "02-field-service-blog-post",
    previewTitle: "ServiceWand Blog Post",
  },
];

const readText = (file) => readFileSync(file, "utf8");
const readJson = (file) => JSON.parse(readText(file));
const writeText = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, String(value ?? "").replace(/\n*$/, "\n"));
};
const writeJson = (file, value) => writeText(file, JSON.stringify(value, null, 2));

function splitTemplate(dir, template) {
  writeJson(join(dir, "template.json"), template);
  writeText(join(dir, "head.html"), template.head || "");
  writeText(join(dir, "html.html"), template.html || "");
  writeText(join(dir, "css.css"), template.css || "");
  writeText(join(dir, "javascript.js"), template.javascript || "");
  writeJson(join(dir, "parameters.json"), template.parameters || []);
}

function scalar(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value.en ?? value.default ?? Object.values(value)[0] ?? "";
  }
  return value ?? "";
}

function renderDefaults(source, parameters) {
  const values = new Map(parameters.map((parameter) => [parameter.code, scalar(parameter.value)]));
  return String(source || "").replace(/\$\{([A-Z0-9_]+)@[^}]+\}/g, (_, code) => String(values.get(code) ?? ""));
}

function previewArticle() {
  return `<div class="blog-post">
  <h1>A practical guide to field service routing</h1>
  <p class="summary">Reliable routes start with clear operational inputs—not with a map full of pins.</p>
  <div class="content">
    <p>Field service routing connects demand, technician capacity, travel time, and customer commitments. When those inputs live in separate tools, dispatchers spend the day reconciling them by hand.</p>
    <h2>Start with the decisions your dispatcher makes</h2>
    <p>Document the decisions that repeat every day: who is qualified, what the arrival window allows, and which work can move without breaking a promise.</p>
    <h3>Make constraints visible</h3>
    <p>A useful route is one the team can execute. Skills, equipment, job duration, and geographic boundaries all need to be explicit.</p>
    <h2>Measure the route after the work is done</h2>
    <p>Compare planned and actual travel, arrival, service, and completion times.</p>
  </div>
</div>`;
}

function previewDocument(definition, template, commonCss) {
  let sourceHtml = template.html;
  if (definition.key === "post") {
    sourceHtml = sourceHtml.replace("${POST@BLOG_POST_CONTENT_SS}", previewArticle());
  }
  let html = renderDefaults(sourceHtml, template.parameters);
  html = html.replace('data-blog-fixture-url=""', 'data-blog-fixture-url="../../../../blocks/15-blog/_fixtures/posts.en.json"');
  if (definition.key === "post") {
    html = html.replace("data-blog-post\n", 'data-blog-post data-blog-current-permalink="field-service-routing-guide"\n');
  }
  const js = renderDefaults(template.javascript, template.parameters);
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${definition.previewTitle}">
<title>${definition.previewTitle}</title>
<style>${commonCss}\n${template.css || ""}</style>
</head>
<body>
${html}
<script>${js}</script>
</body>
</html>`;
}

function main() {
  const tokensCss = readText(join(labRoot, "blocks", "00-tokens", "tokens.css"));
  const compositionCss = readText(join(labRoot, "blocks", "00-tokens", "composition.css"));
  const commonCss = `${tokensCss}\n${compositionCss}`;

  rmSync(manualRoot, { recursive: true, force: true });
  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(manualRoot, { recursive: true });
  const independentTemplates = [];

  try {
    for (const definition of definitions) {
      composeCmsFamily({ specPath: definition.spec, outDir: definition.build });
      const source = readJson(join(definition.build, "children", definition.child, "template.json"));
      if (source.code !== definition.code) throw new Error(`Expected ${definition.code}, found ${source.code}`);
      const independent = { ...source, parent: null, children: [] };
      independentTemplates.push(independent);
      const out = join(manualRoot, definition.key);
      splitTemplate(out, independent);
      writeText(join(out, "preview.html"), previewDocument(definition, independent, commonCss));
    }
  } finally {
    rmSync(stagingRoot, { recursive: true, force: true });
  }

  writeJson(join(manualRoot, "cms-family.payload.json"), {
    root: independentTemplates[0],
    children: independentTemplates.slice(1),
  });

  writeText(join(manualRoot, "css.common.css"), commonCss);
  writeText(join(manualRoot, "README.md"), `# Manual upload: ServiceWand blog

This package contains exactly two independent CMS BlockTemplates:

- \`index/template.json\` → \`FIELD_SERVICE_BLOG_INDEX\`
- \`post/template.json\` → \`FIELD_SERVICE_BLOG_POST\`

Both templates have \`parent: null\` and an empty \`children\` list. Uploading them does not attach them to a root template and does not change root children or PageContext.

\`cms-family.payload.json\` is a flat uploader envelope containing both independent templates. Its \`root\` and \`children\` keys are transport fields only; the uploader strips all relationship fields before saving.

The page root should provide the standard lab-ui tokens and composition CSS. A review copy is included as \`css.common.css\`; it is embedded only in the local preview files, not duplicated in the CMS templates.

Backend contract:

- list: \`POST /core-cms/public/{organization}/blog-post/list.json?locale={locale}\`
- PageContext URLs: \`/blog\` for the index and \`/post\` for individual articles
- article body: \`\${POST@BLOG_POST_CONTENT_SS}\`; \`POST\` is a server-provided runtime value and is intentionally not a BlockTemplate parameter
- every path segment after \`/post\` is the BlogPost permalink, including multi-segment values such as \`news/my-post\`
- localized routes such as \`/fr/post/{permalink}\` are preserved when article links are built
- until Core CMS renders Markdown semantically, a client fallback converts its \`pre > code\` wrapper into headings, paragraphs, lists, links, quotes, and code blocks
- missing display titles are omitted; an internal code, slug, or permalink is never shown as a title

The fixture URL parameter must remain empty in CMS production. It exists only for deterministic local previews.
`);

  console.log(`Blog manual export written: ${manualRoot}`);
  console.log(`Templates: ${definitions.map((definition) => definition.code).join(", ")}`);
}

main();
