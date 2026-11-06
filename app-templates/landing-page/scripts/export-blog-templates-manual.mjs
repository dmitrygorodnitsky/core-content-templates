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
  let current = value;
  if (current && typeof current === "object" && !Array.isArray(current)) {
    current = current.en ?? current.default ?? Object.values(current)[0] ?? "";
  }
  if (current && typeof current === "object") return JSON.stringify(current);
  return current ?? "";
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
    <blockquote>Routing quality improves when operational truth is available before the schedule is published.</blockquote>
    <h3>Route checklist</h3>
    <ol>
      <li>Confirm technician skills and territories</li>
      <li>Lock arrival windows
        <ul>
          <li>Morning slots first</li>
          <li>Keep one buffer stop</li>
        </ul>
      </li>
      <li>Publish the schedule to the field app</li>
    </ol>
    <h4>Quick reference</h4>
    <table>
      <thead><tr><th>Metric</th><th>Target</th><th>Alert level</th></tr></thead>
      <tbody>
        <tr><td>On-time arrival</td><td>≥ 92%</td><td>&lt; 85%</td></tr>
        <tr><td>Travel share of shift</td><td>≤ 25%</td><td>&gt; 35%</td></tr>
      </tbody>
    </table>
    <p>Press <kbd>⌘</kbd> + <kbd>K</kbd> to find any job, and remember that <mark>published promises</mark> are the ones <strong>dispatch must protect</strong>.</p>
    <figure>
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 360'%3E%3Crect width='800' height='360' fill='%23DCE9EE'/%3E%3Cpath d='M60 280 L260 170 L420 240 L700 90' stroke='%238FB4C4' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M60 300 L300 210 L470 280 L740 140' stroke='%23FFFFFF' stroke-width='12' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" alt="Planned versus actual route timeline">
      <figcaption>Planned versus actual arrival windows across one shift.</figcaption>
    </figure>
    <dl>
      <dt>Anti-icing</dt>
      <dd>Preventive treatment applied before snowfall bonds to pavement.</dd>
      <dt>De-icing</dt>
      <dd>Reactive treatment that breaks an existing snow and ice bond.</dd>
    </dl>
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
  html = html.replace('data-blog-fixture-url="#"', 'data-blog-fixture-url="../../../../blocks/15-blog/_fixtures/posts.en.json"');
  if (definition.key === "post") {
    html = html.replace("data-blog-post\n", 'data-blog-post data-blog-current-permalink="field-service-routing-guide"\n');
  }
  const js = renderDefaults(template.javascript, template.parameters);
  const head = renderDefaults(template.head, template.parameters);
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${definition.previewTitle}">
<title>${definition.previewTitle}</title>
${head}<style>${commonCss}\n${template.css || ""}</style>
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

- list: \`POST /{locale}/core-cms/public/{organization}/blog-post/list.json\`; locale must stay in the path because adding \`?locale=\` triggers a redirect that changes POST to GET
- PageContext URLs: \`/blog\` for the index and \`/post\` for individual articles
- article body: \`\${POST@BLOG_POST_CONTENT_SS}\`; \`POST\` is a server-provided runtime value and is intentionally not a BlockTemplate parameter
- every path segment after \`/post\` is the BlogPost permalink, including multi-segment values such as \`news/my-post\`
- localized routes such as \`/fr/post/{permalink}\` are preserved when article links are built
- the article body is rendered by Core CMS and displayed exactly as served; the template only applies typography styles and never transforms the server DOM
- four bare uppercase parameters bridge \`BlogPost.metadata\` into the render: \`META_TITLE\`, \`META_DESCRIPTION\`, and \`HERO_IMAGE_URL\` are STRING with untyped \`\${CODE}\` placeholders in the head, and \`SEO_LD_SCHEMA\` is LOCALIZED_JSON_OBJECT with a typed placeholder in the body JSON-LD slot; prefixed codes never match a metadata key and must not be used for this bridge
- author fields ride the same bridge: \`AUTHOR_NAME\` (STRING) and \`AUTHOR_AVATAR\` (STRING; the repo declares it as URL, which Core CMS stores as STRING) plus localized \`AUTHOR_BIO\` render the author card after the article; the avatar URL sits in a data attribute so an empty value never triggers a phantom image request
- the root template also declares \`SEO_LD_SCHEMA\` in its own head, so the same post schema renders twice unless the operator clears one of the two slots
- the head intentionally omits \`<title>\` and \`<meta name="description">\`: the root template owns both, and duplicating them in an included child head yields two competing tags
- client SEO only fills tags the server left empty or placeholder-valued, so a server-substituted metadata value always wins
- taxonomy: posts carry \`categories\` and \`tags\` as \`{id, name, description, slug}\`; the legacy \`{id, nls:{<locale>:{NAME}}}\` shape is still accepted, and \`name\`/\`description\` may be a plain string or a language map
- \`GET /{locale}/core-cms/public/{organization}/blog-post/{categories|tags}.json\` lists enabled taxonomy; the locale must stay in the path because \`?locale=\` redirects
- a post is public only while it is enabled and every one of its categories is enabled; disabled tags are omitted from responses but do not hide the post
- card and SEO images resolve in order: metadata \`HERO_IMAGE_URL\`, the \`heroImage\` field of the list payload (entity id or URL), then the first image of the server-rendered article fetched during hydration; a hydrated content image is never duplicated as the post-page hero banner
- missing display titles are omitted; an internal code, slug, or permalink is never shown as a title

The fixture URL parameter must remain empty in CMS production. It exists only for deterministic local previews.
`);

  console.log(`Blog manual export written: ${manualRoot}`);
  console.log(`Templates: ${definitions.map((definition) => definition.code).join(", ")}`);
}

main();
