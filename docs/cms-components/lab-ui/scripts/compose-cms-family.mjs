import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SLOT_MARKERS, slotMarker } from "./cms-family-contract.mjs";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const labRoot = resolve(scriptsDir, "..");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--spec") out.spec = args[++i];
    else if (arg === "--out") out.out = args[++i];
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
node docs/cms-components/lab-ui/scripts/compose-cms-family.mjs \\
  --spec docs/cms-components/lab-ui/compositions/generated/<slug>.spec.json \\
  --out docs/cms-components/lab-ui/dist/<slug>`;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const codeSlug = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const slug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et",
  "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis",
  "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex",
  "ea", "commodo", "consequat", "duis", "aute", "irure", "reprehenderit",
  "voluptate", "velit", "esse", "cillum", "fugiat", "nulla", "pariatur",
];

const lorem = (words, seed = 0) => {
  const count = Math.max(words, 2);
  const out = ["Lorem", "Ipsum"];
  for (let i = 2; i < count; i += 1) out.push(LOREM_WORDS[(seed + i) % LOREM_WORDS.length]);
  return `${out.join(" ")}.`;
};

const cmsType = (type) => {
  if (type === "URL") return "STRING";
  if (type === "IMAGE") return "IMAGE";
  if (type === "JSON_ARRAY") return "STRING";
  if (type === "ENUM") return "STRING";
  return type || "LOCALIZED_STRING_SS";
};

const localized = (type, value, locale) => (cmsType(type).startsWith("LOCALIZED") ? { [locale]: value ?? "" } : value ?? "");

const humanize = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\bcta\b/gi, "CTA")
    .replace(/\burl\b/gi, "URL")
    .replace(/\bfaq\b/gi, "FAQ")
    .replace(/\bseo\b/gi, "SEO")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const blockLabel = (block) => block?.title || block?.id || "template";

const parameterName = (param, fallback = param?.code) =>
  param?.name || param?.label || param?.title || humanize(fallback || param?.code);

const parameterDescription = (param, block) => {
  if (param?.description) return param.description;
  const code = param?.code || "value";
  const name = parameterName(param, code);
  const owner = blockLabel(block);
  const type = param?.type || "LOCALIZED_STRING_SS";
  const options = Array.isArray(param?.options) && param.options.length
    ? ` Allowed values: ${param.options.join(", ")}.`
    : "";

  if (type === "IMAGE") {
    return `Image source for the ${name} field in ${owner}. Leave empty to show the built-in placeholder.`;
  }
  if (/alt$/i.test(code)) {
    return `Alternative text for the ${name.replace(/\bAlt\b/g, "").trim()} image in ${owner}.`;
  }
  if (/(href|url|link)$/i.test(code)) {
    return `URL target for the ${name} link in ${owner}.`;
  }
  if (/icon$/i.test(code)) {
    return `Icon state for the ${name.replace(/\bIcon\b/g, "").trim()} field in ${owner}.${options}`;
  }
  if (/column_count$/i.test(code)) {
    return `Controls how many comparison product columns are visible in ${owner}.${options}`;
  }
  if (/placeholder_size$/i.test(code)) {
    return `Fallback placeholder size label shown when the related image is not set in ${owner}.`;
  }
  if (/placeholder_label$/i.test(code) || /photo$/i.test(code)) {
    return `Fallback placeholder label shown when the related image is not set in ${owner}.`;
  }
  if (type === "ENUM") {
    return `Selects the ${name} option for ${owner}.${options}`;
  }
  return `Text value for the ${name} field in ${owner}.`;
};

const parameter = (code, type, value, locale, meta = {}) => {
  const out = {
    code,
    type: cmsType(type),
    nls: {
      en: {
        NAME: parameterName(meta, code),
        DESCRIPTION: parameterDescription({ ...meta, type }, meta.block),
      },
    },
    value: localized(type, value, locale),
  };
  if (Array.isArray(meta.options) && meta.options.length) out.options = meta.options;
  return out;
};

const placeholder = (code, type) => `\${${code}@${cmsType(type)}}`;

const parseImageSize = (value) => {
  const match = String(value || "").match(/(\d+)\s*(?:×|x|X)\s*(\d+)/);
  if (!match) return null;
  return { width: match[1], height: match[2] };
};

const imageNameParam = (slot) => {
  if (slot?.name_param) return slot.name_param;
  const src = String(slot?.src_param || "");
  const derived = src.replace(/(?:_url|_src|Url|Src)$/i, "_name");
  return derived && derived !== src ? derived : `${src}_name`;
};

const setHtmlAttr = (tag, name, value) => {
  const attrRe = new RegExp(`\\s${name}=(["'])[^"']*\\1`, "i");
  if (attrRe.test(tag)) return tag.replace(attrRe, ` ${name}="${value}"`);
  return tag.replace(/\s*\/?>$/, (end) => ` ${name}="${value}"${end}`);
};

const loadCatalog = () => {
  const manifest = readJson(join(labRoot, "manifest.json"));
  const byId = new Map();
  for (const block of manifest.blocks) {
    const dir = join(labRoot, block.path);
    byId.set(block.id, {
      ...block,
      dir,
      json: readJson(join(dir, "block.json")),
      html: readFileSync(join(dir, "block.html"), "utf8"),
      css: existsSync(join(dir, "block.css")) ? readFileSync(join(dir, "block.css"), "utf8") : "",
      js: existsSync(join(dir, "block.js")) ? readFileSync(join(dir, "block.js"), "utf8") : "",
    });
  }
  return { manifest, byId };
};

const collectAssetBlocks = (blockIds, catalog) => {
  const assets = [];
  const visiting = new Set();
  const visited = new Set();

  const visit = (id) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Circular lab-ui block dependency detected: ${id}`);
    const block = catalog.byId.get(id);
    if (!block) throw new Error(`Required block is missing from manifest: ${id}`);

    visiting.add(id);
    for (const depId of block.json.depends_on?.other_blocks || []) visit(depId);
    visiting.delete(id);

    visited.add(id);
    assets.push(block);
  };

  blockIds.forEach(visit);
  return assets;
};

const wordsForParam = (localCode) => {
  if (/(title|heading|label|eyebrow|name|brand|current|capability|question|num|kind|time|tone|meta)$/i.test(localCode)) return 3;
  if (/(lede|lead|body|desc|description|tagline|answer|paragraph|footer|summary|act|trig|from|to)$/i.test(localCode)) return 18;
  return 6;
};

const valueForParam = (param, index) => {
  const type = param.type || "LOCALIZED_STRING_SS";
  if (type === "URL") return "#";
  if (type === "IMAGE") return "";
  if (type === "ENUM") return param.default || param.options?.[0] || "";
  if (type === "JSON_ARRAY") return JSON.stringify(param.default || []);
  return lorem(wordsForParam(param.code), index * 7);
};

const wrapBlockHtml = (block, html) => {
  if (block.id === "header.default") return `<div class="header-host">\n${html}\n</div>`;
  if (block.id === "section.axes-grid") return `<div class="container">\n${html}\n</div>`;
  if (block.id === "section.stages-list") return `<div class="container">\n${html}\n</div>`;
  if (block.id === "decorative.callout-band") return `<div class="container container--narrow">\n${html}\n</div>`;
  return html;
};

const wrapCompositionSection = (block, html) => {
  if (block.id === "header.default" || block.id === "footer.default") return html;
  const sectionClass = `composition-section composition-section--${slug(block.id)}`;
  return `<section class="${sectionClass}" data-composition-block="${escapeHtml(block.id)}">\n${html}\n</section>`;
};

const renderBlockTemplate = ({ block, code, parentCode, locale, index, values = {}, assetBlocks = [] }) => {
  const params = [];
  const paramByCode = new Map((block.json.params || []).map((param) => [param.code, param]));
  const used = new Set();
  const localParamCodes = new Map();
  let renderedHtml = block.html.replace(/\{\{([A-Za-z0-9_-]+)\}\}/g, (_, localCode) => {
    const param = paramByCode.get(localCode) || { code: localCode, type: "LOCALIZED_STRING_SS" };
    const paramCode = `${code}_${codeSlug(localCode)}`;
    localParamCodes.set(localCode, paramCode);
    if (!used.has(paramCode)) {
      const value = Object.prototype.hasOwnProperty.call(values, localCode)
        ? values[localCode]
        : valueForParam(param, index + params.length);
      params.push(parameter(paramCode, param.type, value, locale, {
        ...param,
        block,
        name: parameterName(param, localCode),
      }));
      used.add(paramCode);
    }
    return placeholder(paramCode, param.type);
  });
  for (const slot of block.json.image_slots || []) {
    if (!slot.src_param || !slot.alt_param) continue;
    const imageCode = localParamCodes.get(slot.src_param);
    const imageParam = paramByCode.get(slot.src_param);
    if (!imageCode || cmsType(imageParam?.type) !== "IMAGE") continue;

    const nameLocalCode = imageNameParam(slot);
    const nameCode = `${code}_${codeSlug(nameLocalCode)}`;
    localParamCodes.set(nameLocalCode, nameCode);
    if (!used.has(nameCode)) {
      const sizeText = slot.recommended_size ? ` Required image size: ${slot.recommended_size}.` : "";
      const ratioText = slot.aspect_ratio ? ` Required aspect ratio: ${slot.aspect_ratio}.` : "";
      params.push(parameter(nameCode, "STRING", "", locale, {
        code: nameLocalCode,
        name: `${parameterName(imageParam, slot.src_param).replace(/\b(Image|Photo|Media)?\s*(URL|Src|Source)$/i, "").trim() || humanize(slot.id)} Image Name`,
        description: `CMS image file name/path segment for the ${humanize(slot.id)} image in ${blockLabel(block)}.${sizeText}${ratioText}`,
        block,
      }));
      used.add(nameCode);
    }

    const imagePlaceholder = placeholder(imageCode, "IMAGE");
    const namePlaceholder = placeholder(nameCode, "STRING");
    const size = parseImageSize(slot.recommended_size);
    renderedHtml = renderedHtml.replace(/<img\b[^>]*>/g, (tag) => {
      if (!tag.includes(`src="${imagePlaceholder}"`)) return tag;
      let out = tag.replace(`src="${imagePlaceholder}"`, `src="/core/image/${imagePlaceholder}/get**/${namePlaceholder}"`);
      if (size) {
        out = setHtmlAttr(out, "width", size.width);
        out = setHtmlAttr(out, "height", size.height);
      }
      return out;
    });
  }
  const css = assetBlocks
    .filter((asset) => asset.css.trim())
    .map((asset) => `/* generated child CSS: ${asset.path}/block.css */\n${asset.css}`)
    .join("\n\n");
  const javascript = assetBlocks
    .filter((asset) => asset.js.trim())
    .map((asset) => `/* generated child JS: ${asset.path}/block.js */\n${asset.js}`)
    .join("\n\n");

  return {
    code,
    nls: { en: { NAME: block.title || block.id } },
    templateLanguage: "JTE",
    parent: parentCode ? { code: parentCode } : null,
    children: [],
    head: "",
    html: wrapCompositionSection(block, wrapBlockHtml(block, renderedHtml)),
    css,
    javascript,
    parameters: params,
  };
};

const flattenTemplates = (templates) => templates.flatMap((template) => [template, ...flattenTemplates(template.children || [])]);
const collectParameters = (templates) => templates.flatMap((template) => [...(template.parameters || []), ...collectParameters(template.children || [])]);

const validateSpecSections = (sections, catalog) => {
  if (!Array.isArray(sections) || !sections.length) throw new Error("spec.sections must be a non-empty array");
  const normalized = sections.map((section) => typeof section === "string" ? { block: section } : section);
  const first = normalized[0]?.block;
  const last = normalized[normalized.length - 1]?.block;
  if (first !== "header.default") throw new Error("spec.sections must start with header.default");
  if (last !== "footer.default") throw new Error("spec.sections must end with footer.default");
  for (const section of normalized) {
    if (!catalog.byId.has(section.block)) throw new Error(`spec references unknown block: ${section.block}`);
  }
  return normalized;
};

const buildFamily = (spec, catalog) => {
  const locale = spec.locale || "en";
  const rootCode = codeSlug(spec.code || "LANDING_TEMPLATE");
  const rootName = spec.name || rootCode;
  const sections = validateSpecSections(spec.sections, catalog);
  const selectedIds = sections.map((section) => section.block);

  const css = [
    "/* generated root CSS: 00-tokens/tokens.css */",
    readFileSync(join(labRoot, "00-tokens", "tokens.css"), "utf8"),
    "/* generated root CSS: 00-tokens/composition.css */",
    readFileSync(join(labRoot, "00-tokens", "composition.css"), "utf8"),
  ].join("\n");

  const javascript = [
    "(() => {",
    "  if (window.__LAB_UI_BLOCK_COMPOSER_INIT__) return;",
    "  window.__LAB_UI_BLOCK_COMPOSER_INIT__ = true;",
    "})();",
  ].join("\n");

  const children = sections.map((section, index) => {
    const block = catalog.byId.get(section.block);
    const assetBlocks = collectAssetBlocks([section.block], catalog);
    const code = `SECTION_${String(index + 1).padStart(2, "0")}_${codeSlug(section.block).slice(0, 42)}`;
    return renderBlockTemplate({ block, code, parentCode: rootCode, locale, index, values: section.values || {}, assetBlocks });
  });

  const rootParams = [
    parameter("ROOT_META_TITLE", "LOCALIZED_STRING_SS", lorem(8, 0), locale, {
      code: "meta_title",
      name: "Meta Title",
      description: "SEO title for the generated landing page.",
    }),
    parameter("ROOT_META_DESCRIPTION", "LOCALIZED_STRING_SS", lorem(24, 3), locale, {
      code: "meta_description",
      name: "Meta Description",
      description: "SEO meta description for the generated landing page.",
    }),
  ];
  const parameters = [...rootParams, ...collectParameters(children)];
  const values = {};
  for (const param of parameters) values[param.code] = param.value;

  const rootTemplate = {
    code: rootCode,
    nls: { en: { NAME: rootName } },
    templateLanguage: "JTE",
    parent: null,
    children: children.map((child) => ({ code: child.code, nls: child.nls })),
    head: `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${placeholder("ROOT_META_TITLE", "LOCALIZED_STRING_SS")}</title>
<meta name="description" content="${placeholder("ROOT_META_DESCRIPTION", "LOCALIZED_STRING_SS")}">`,
    html: `<div id="root" data-cms-family="${escapeHtml(rootCode)}">
  ${slotMarker(SLOT_MARKERS.rootSections)}
</div>`,
    css,
    javascript,
    parameters: rootParams,
  };

  const enabledTemplates = [rootTemplate.code, ...flattenTemplates(children).map((template) => template.code)];
  const pageContext = {
    url: spec.url || `/${slug(rootName)}`,
    template: { code: rootTemplate.code },
    enabledTemplates,
    values,
    organization: { code: "SYSTEM" },
    excludeFromSeo: false,
    theme: spec.theme || "",
  };

  return {
    spec,
    rootTemplate,
    children,
    parameters,
    pageContext,
    payload: {
      generatedAt: new Date().toISOString(),
      mode: "dry-run",
      root: rootTemplate,
      children,
      pageContext,
    },
    resolved: {
      sourceSpec: spec.sourceSpec || "",
      root: { code: rootTemplate.code, name: rootName, templateLanguage: "JTE" },
      selectedBlocks: sections.map((section, index) => {
        const block = catalog.byId.get(section.block);
        return { index: index + 1, id: block.id, path: block.path, category: block.category, hasJs: Boolean(block.js.trim()) };
      }),
      assetOwnership: sections.map((section, index) => {
        const block = catalog.byId.get(section.block);
        const ownedAssets = collectAssetBlocks([section.block], catalog);
        return {
          index: index + 1,
          childCode: children[index].code,
          block: block.id,
          assets: ownedAssets.map((asset) => ({ id: asset.id, path: asset.path, hasCss: Boolean(asset.css.trim()), hasJs: Boolean(asset.js.trim()) })),
        };
      }),
      tree: { code: rootTemplate.code, children: children.map((child) => ({ code: child.code, children: [] })) },
    },
  };
};

const writeTemplateTree = (outDir, template, indexPrefix = "") => {
  const dir = join(outDir, "children", `${indexPrefix}${slug(template.code)}`);
  mkdirSync(dir, { recursive: true });
  writeJson(join(dir, "template.json"), template);
  (template.children || []).forEach((child, index) => writeTemplateTree(outDir, child, `${indexPrefix}${String(index + 1).padStart(2, "0")}-`));
};

const writeSummary = (outDir, family) => {
  const flat = flattenTemplates(family.children);
  const lines = [
    "# Generated CMS Family",
    "",
    `Root: \`${family.rootTemplate.code}\``,
    `Direct children: ${family.children.length}`,
    `Nested/total child templates: ${flat.length}`,
    `Parameters: ${family.parameters.length}`,
    "",
    "## Selected Blocks",
    "",
    ...family.resolved.selectedBlocks.map((block) => `- ${block.index}. \`${block.id}\` (${block.category})`),
    "",
    "## Tree",
    "",
    `- \`${family.rootTemplate.code}\``,
    ...family.children.map((child) => `  - \`${child.code}\``),
    "",
    "## Files",
    "",
    "- `root.template.json`",
    "- `children/**/template.json`",
    "- `cms-family.payload.json`",
    "- `page-context.sample.json`",
  ];
  writeFileSync(join(outDir, "summary.md"), `${lines.join("\n")}\n`);
};

const main = () => {
  const args = parseArgs();
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.spec || !args.out) throw new Error(usage());
  if (!existsSync(args.spec)) throw new Error(`Spec file not found: ${args.spec}`);

  const outAbs = resolve(args.out);
  if (
    outAbs === "/" ||
    outAbs === resolve(process.env.HOME || "") ||
    !(outAbs.includes(`${"dist"}${"/"}`) || /\/lab-ui\/dist\//.test(outAbs))
  ) {
    throw new Error(`Refusing to wipe --out path that is not inside a dist/ directory: ${args.out}`);
  }

  const catalog = loadCatalog();
  const spec = readJson(args.spec);
  spec.sourceSpec = relative(process.cwd(), resolve(args.spec));
  const family = buildFamily(spec, catalog);

  rmSync(args.out, { recursive: true, force: true });
  mkdirSync(args.out, { recursive: true });
  writeJson(join(args.out, "landing.spec.json"), spec);
  writeJson(join(args.out, "composition.resolved.json"), family.resolved);
  writeFileSync(join(args.out, "head.html"), `${family.rootTemplate.head}\n`);
  writeFileSync(join(args.out, "root.css"), `${family.rootTemplate.css}\n`);
  writeFileSync(join(args.out, "root.js"), `${family.rootTemplate.javascript}\n`);
  writeJson(join(args.out, "root.template.json"), family.rootTemplate);
  family.children.forEach((child, index) => writeTemplateTree(args.out, child, `${String(index + 1).padStart(2, "0")}-`));
  writeJson(join(args.out, "parameters.json"), family.parameters);
  writeJson(join(args.out, "page-context.sample.json"), family.pageContext);
  writeJson(join(args.out, "cms-family.payload.json"), family.payload);
  writeSummary(args.out, family);

  console.log(`Composed CMS family ${family.rootTemplate.code}`);
  console.log(`Output: ${relative(process.cwd(), args.out)}`);
  console.log(`Direct child templates: ${family.children.length}`);
  console.log(`Parameters: ${family.parameters.length}`);
};

main();
