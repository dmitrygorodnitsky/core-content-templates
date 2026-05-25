import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

const labRoot = new URL("..", import.meta.url).pathname;

const sectionBlockIds = {
  header: "header.sw-default",
  hero: "hero.operational-diagram",
  features: "features.accordion-2col-numbered",
  comparison: "comparison.three-col-with-mobile-cards",
  faq: "faq.bubble-light-grouped",
  ctaPrimary: "cta.btn-primary-ring",
  ctaSecondary: "cta.btn-secondary-filled",
  footer: "footer.sw-default",
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--copy") out.copy = args[++i];
    else if (arg === "--out") out.out = args[++i];
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
node docs/cms-components/lab-ui/scripts/generate-cms-family.mjs \\
  --copy docs/cms-components/lab-ui/compositions/examples/field-service-copy.md \\
  --out docs/cms-components/lab-ui/dist/field-service`;

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const slug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const codeSlug = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const pad = (value) => String(value).padStart(2, "0");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const parseFrontmatter = (text) => {
  if (!text.startsWith("---\n")) return [{}, text];
  const end = text.indexOf("\n---", 4);
  if (end === -1) throw new Error("Frontmatter starts with --- but has no closing ---");
  const raw = text.slice(4, end).trim();
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) throw new Error(`Invalid frontmatter line: ${line}`);
    data[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return [data, text.slice(end + 4).trim()];
};

const parseInlineLinks = (text) => {
  const links = [];
  const clean = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    links.push({ label: label.trim(), href: href.trim() });
    return label;
  });
  return { clean: clean.trim(), links };
};

const pushParagraph = (target, lines) => {
  const raw = lines.join(" ").trim();
  lines.length = 0;
  if (!raw) return;
  const parsed = parseInlineLinks(raw);
  target.paragraphs.push(parsed.clean);
  target.links.push(...parsed.links);
};

const splitTableRow = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const isTableDivider = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

const parseMarkdownCopy = (file) => {
  const [frontmatter, body] = parseFrontmatter(readFileSync(file, "utf8"));
  const lines = body.split(/\r?\n/);
  const model = {
    sourceFile: file,
    frontmatter,
    title: "",
    hero: { paragraphs: [], links: [] },
    sections: {},
  };

  let current = null;
  let currentItem = null;
  let paragraphLines = [];
  let tableLines = [];

  const ensureSection = (key, title) => {
    if (!model.sections[key]) model.sections[key] = { title, paragraphs: [], links: [], items: [], table: null };
    return model.sections[key];
  };

  const flushTable = () => {
    if (!tableLines.length || !current) return;
    const rows = tableLines.filter((line) => line.includes("|"));
    tableLines = [];
    if (rows.length < 2) throw new Error(`Malformed markdown table in ${current.title}`);
    const headers = splitTableRow(rows[0]);
    const bodyRows = rows.slice(2).map(splitTableRow).filter((row) => row.some(Boolean));
    current.table = { headers, rows: bodyRows };
  };

  const flushParagraph = () => {
    if (tableLines.length) flushTable();
    const target = currentItem || current || model.hero;
    pushParagraph(target, paragraphLines);
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    if (h1 || h2 || h3) {
      flushParagraph();
      if (h1) {
        model.title = h1[1].trim();
        current = null;
        currentItem = null;
      } else if (h2) {
        const title = h2[1].trim();
        current = ensureSection(slug(title), title);
        currentItem = null;
      } else if (h3) {
        if (!current) throw new Error(`Subheading appears before a section: ${line}`);
        currentItem = { title: h3[1].trim(), paragraphs: [], links: [] };
        current.items.push(currentItem);
      }
      continue;
    }
    if (line.includes("|") && (current?.title || "").toLowerCase().includes("comparison")) {
      pushParagraph(currentItem || current || model.hero, paragraphLines);
      if (!isTableDivider(line)) tableLines.push(line);
      else tableLines.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    paragraphLines.push(line.trim());
  }
  flushParagraph();

  if (!model.title) throw new Error("Copy must include a top-level # heading for the hero title");
  if (!model.sections.features) throw new Error("Copy must include ## Features");
  if (!model.sections.comparison) throw new Error("Copy must include ## Comparison");
  if (!model.sections.faq) throw new Error("Copy must include ## FAQ");

  return model;
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

const cmsType = (type) => {
  if (type === "URL") return "STRING";
  return type || "LOCALIZED_STRING_SS";
};

const localized = (type, value, locale) => (cmsType(type).startsWith("LOCALIZED") ? { [locale]: value ?? "" } : value ?? "");

const parameter = (code, type, value, locale, name = code) => ({
  code,
  type: cmsType(type),
  nls: { en: { NAME: name } },
  value: localized(type, value, locale),
});

const placeholder = (code, type) => `\${${code}@${cmsType(type)}}`;

const replaceBlockPlaceholders = (html, block, prefix, overrides, locale) => {
  const params = [];
  const blockParams = block.json.params || [];
  const paramByCode = new Map(blockParams.map((param) => [param.code, param]));
  const used = new Set();
  const out = html.replace(/\{\{([A-Za-z0-9_-]+)\}\}/g, (_, localCode) => {
    const param = paramByCode.get(localCode) || { code: localCode, type: "LOCALIZED_STRING_SS", default: "" };
    const code = `${prefix}_${codeSlug(localCode)}`;
    const value = Object.hasOwn(overrides, localCode) ? overrides[localCode] : param.default ?? "";
    if (!used.has(code)) {
      params.push(parameter(code, param.type, value, locale, localCode));
      used.add(code);
    }
    return placeholder(code, param.type);
  });
  return { html: out, params };
};

const splitHeroTitle = (title) => {
  const match = title.match(/^(.+?)\s+for\s+(.+)$/i);
  if (!match) return { line1: title, accent: "ServiceWand", line2: "Operations" };
  const rest = match[2].trim().split(/\s+/);
  return {
    line1: match[1].trim(),
    accent: rest.slice(0, Math.min(2, rest.length)).join(" "),
    line2: rest.slice(Math.min(2, rest.length)).join(" ") || "Operations",
  };
};

const makeTemplate = ({ code, name, parentCode, html, params = [], children = [] }) => ({
  code,
  nls: { en: { NAME: name } },
  templateLanguage: "JTE",
  parent: parentCode ? { code: parentCode } : null,
  children,
  head: "",
  html,
  css: "",
  javascript: "",
  parameters: params,
});

const makeTextParam = (prefix, localCode, value, locale) =>
  parameter(`${prefix}_${codeSlug(localCode)}`, "LOCALIZED_STRING_SS", value, locale, localCode);

const makeStringParam = (prefix, localCode, value, locale) =>
  parameter(`${prefix}_${codeSlug(localCode)}`, "STRING", value, locale, localCode);

const featureItemHtml = (code, index) => {
  const n = pad(index);
  return `<article class="f-row${index === 1 ? " is-open" : ""}" data-feature-slot="${n}">
  <button class="f-row-head" type="button" aria-expanded="${index === 1 ? "true" : "false"}">
    <span class="f-num">F.${n}</span>
    <span class="f-title">${placeholder(`${code}_TITLE`, "LOCALIZED_STRING_SS")}</span>
    <span class="f-toggle" aria-hidden="true"><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span>
  </button>
  <div class="f-body"><div class="f-body-inner">${placeholder(`${code}_BODY`, "LOCALIZED_STRING_SS")}</div></div>
</article>`;
};

const faqItemHtml = (code, index) => `<details class="faq-item${index === 1 ? " is-open" : ""}" data-faq-slot="${pad(index)}"${index === 1 ? " open" : ""}>
  <summary class="faq-q"><span class="faq-q-text">${placeholder(`${code}_QUESTION`, "LOCALIZED_STRING_SS")}</span><span class="faq-q-toggle" aria-hidden="true"><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span></summary>
  <div class="faq-a">${placeholder(`${code}_ANSWER`, "LOCALIZED_STRING_SS")}</div>
</details>`;

const statusClass = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (!normalized || normalized === "no" || normalized === "none" || normalized === "false") return "no";
  if (normalized.includes("partial") || normalized.includes("limited") || normalized.includes("manual")) return "partial";
  return "yes";
};

const comparisonRowHtml = (code, columns, row) => {
  const cells = columns
    .map((column, index) => {
      const key = codeSlug(column).replace(/^SERVICEWAND$/, "SW");
      const status = placeholder(`${code}_${key}`, "LOCALIZED_STRING_SS");
      const cls = index === 0 ? " compare-cell--sw" : "";
      return `<div class="compare-cell${cls}" role="cell"><span class="compare-mobile-label">${escapeHtml(column)}</span><span class="compare-status compare-status--${statusClass(row[index + 1])}"><span class="compare-icon" aria-hidden="true"></span><span>${status}</span></span></div>`;
    })
    .join("\n    ");
  return `<article class="compare-row" role="row">
    <div class="compare-cell compare-cell--capability" role="rowheader"><span class="compare-capability">${placeholder(`${code}_CAPABILITY`, "LOCALIZED_STRING_SS")}</span></div>
    ${cells}
  </article>`;
};

const flattenTemplates = (templates) => templates.flatMap((template) => [template, ...flattenTemplates(template.children || [])]);

const collectParameters = (templates) =>
  templates.flatMap((template) => [...(template.parameters || []), ...collectParameters(template.children || [])]);

const buildFamily = (model, catalog) => {
  const locale = model.frontmatter.locale || "en";
  const rootCode = codeSlug(model.frontmatter.code || "SERVICEWAND_LANDING");
  const rootName = model.frontmatter.name || model.title;
  const heroTitle = splitHeroTitle(model.title);
  const heroLinks = model.hero.links;
  const featureSection = model.sections.features;
  const comparisonSection = model.sections.comparison;
  const faqSection = model.sections.faq;
  const finalCta = model.sections["final-cta"] || { paragraphs: [], links: [] };

  const requireBlock = (id) => {
    const block = catalog.byId.get(id);
    if (!block) throw new Error(`Required block is missing from manifest: ${id}`);
    return block;
  };

  const selected = [
    sectionBlockIds.header,
    sectionBlockIds.hero,
    sectionBlockIds.features,
    sectionBlockIds.comparison,
    sectionBlockIds.faq,
    sectionBlockIds.ctaPrimary,
    sectionBlockIds.ctaSecondary,
    sectionBlockIds.footer,
  ].map(requireBlock);

  const css = [
    "/* generated root CSS: 00-tokens/tokens.css */",
    readFileSync(join(labRoot, "00-tokens/tokens.css"), "utf8"),
    ...selected.map((block) => `\n/* generated root CSS: ${block.path}/block.css */\n${block.css}`),
  ].join("\n");

  const jsParts = selected.filter((block) => block.js.trim()).map((block) => `\n/* generated root JS: ${block.path}/block.js */\n${block.js}`);
  const javascript = `(() => {\n  if (window.__LAB_UI_CMS_FAMILY_INIT__) return;\n  window.__LAB_UI_CMS_FAMILY_INIT__ = true;\n})();\n${jsParts.join("\n")}\n`;

  const children = [];
  const values = {};

  const addValues = (params) => {
    for (const param of params) values[param.code] = param.value;
  };

  const addBlockChild = ({ code, name, block, overrides }) => {
    const rendered = replaceBlockPlaceholders(block.html, block, code, overrides, locale);
    const template = makeTemplate({ code, name, parentCode: rootCode, html: rendered.html, params: rendered.params });
    addValues(rendered.params);
    children.push(template);
    return template;
  };

  const header = requireBlock(sectionBlockIds.header);
  addBlockChild({
    code: "HEADER",
    name: "Header",
    block: header,
    overrides: {
      brand_name: "ServiceWand",
      brand_href: "/",
      cta_label: heroLinks[0]?.label || "Book a Demo",
      cta_href: heroLinks[0]?.href || "/request-demo",
      breadcrumb_root_label: "ServiceWand",
      breadcrumb_mid_1_label: "",
      breadcrumb_current_label: model.frontmatter.name || model.title,
    },
  });

  const hero = requireBlock(sectionBlockIds.hero);
  addBlockChild({
    code: "HERO",
    name: "Hero",
    block: hero,
    overrides: {
      eyebrow_root: "ServiceWand",
      eyebrow_leaf: model.frontmatter.name || "Landing",
      title_line_1: heroTitle.line1,
      title_accent: heroTitle.accent,
      title_line_2: heroTitle.line2,
      lead_1: model.hero.paragraphs[0] || "",
      lead_2: model.hero.paragraphs[1] || "",
      lead_3: model.hero.paragraphs[2] || "",
      cta_primary_label: heroLinks[0]?.label || "Book a Demo",
      cta_primary_href: heroLinks[0]?.href || "/request-demo",
      cta_secondary_label: heroLinks[1]?.label || "Explore Platform",
      cta_secondary_href: heroLinks[1]?.href || "/platform",
    },
  });

  const featureItems = featureSection.items.map((item, index) => {
    const code = `FEATURE_${index + 1}`;
    const params = [
      makeTextParam(code, "TITLE", item.title, locale),
      makeTextParam(code, "BODY", item.paragraphs.join(" "), locale),
    ];
    addValues(params);
    return makeTemplate({
      code,
      name: item.title,
      parentCode: "FEATURES",
      html: featureItemHtml(code, index + 1),
      params,
    });
  });
  const featureParams = [
    makeTextParam("FEATURES", "EYEBROW", featureSection.title, locale),
    makeTextParam("FEATURES", "TITLE", featureSection.title, locale),
    makeTextParam("FEATURES", "LEDE", featureSection.paragraphs.join(" "), locale),
  ];
  addValues(featureParams);
  children.push(
    makeTemplate({
      code: "FEATURES",
      name: "Features",
      parentCode: rootCode,
      html: `<section class="features features--accordion" id="features" data-block="features.accordion-2col-numbered">
  <div class="container">
    <header class="features-top">
      <div>
        <p class="eyebrow">${placeholder("FEATURES_EYEBROW", "LOCALIZED_STRING_SS")}</p>
        <h2 class="features-title">${placeholder("FEATURES_TITLE", "LOCALIZED_STRING_SS")}</h2>
      </div>
      <div class="features-lede"><p>${placeholder("FEATURES_LEDE", "LOCALIZED_STRING_SS")}</p></div>
    </header>
    <div class="features-list" data-features-list>
      <!-- cms-child-slot:FEATURE_ITEMS -->
    </div>
  </div>
</section>`,
      params: featureParams,
      children: featureItems,
    }),
  );

  const comparisonHeaders = comparisonSection.table?.headers || [];
  const comparisonColumns = comparisonHeaders.slice(1);
  const comparisonItems = (comparisonSection.table?.rows || []).map((row, index) => {
    const code = `COMPARE_ROW_${index + 1}`;
    const params = [makeTextParam(code, "CAPABILITY", row[0] || "", locale)];
    comparisonColumns.forEach((column, columnIndex) => {
      params.push(makeTextParam(code, codeSlug(column).replace(/^SERVICEWAND$/, "SW"), row[columnIndex + 1] || "", locale));
    });
    addValues(params);
    return makeTemplate({
      code,
      name: row[0] || `Compare row ${index + 1}`,
      parentCode: "COMPARISON",
      html: comparisonRowHtml(code, comparisonColumns, row),
      params,
    });
  });
  const comparisonParams = [
    makeTextParam("COMPARISON", "EYEBROW", comparisonSection.title, locale),
    makeTextParam("COMPARISON", "TITLE", "ServiceWand unifies it all", locale),
    makeTextParam("COMPARISON", "LEDE", comparisonSection.paragraphs.join(" "), locale),
    ...comparisonColumns.map((column, index) =>
      makeTextParam("COMPARISON", `COLUMN_${index + 1}`, column, locale),
    ),
  ];
  addValues(comparisonParams);
  children.push(
    makeTemplate({
      code: "COMPARISON",
      name: "Comparison",
      parentCode: rootCode,
      html: `<section class="compare" id="compare" data-block="comparison.three-col-with-mobile-cards">
  <div class="container">
    <header class="compare-top">
      <p class="eyebrow">${placeholder("COMPARISON_EYEBROW", "LOCALIZED_STRING_SS")}</p>
      <h2 class="compare-title">${placeholder("COMPARISON_TITLE", "LOCALIZED_STRING_SS")}</h2>
      <p class="compare-lede">${placeholder("COMPARISON_LEDE", "LOCALIZED_STRING_SS")}</p>
    </header>
    <div class="compare-grid" role="table" aria-label="ServiceWand platform comparison">
      <div class="compare-head" role="rowgroup">
        <div class="compare-row compare-row--head" role="row">
          <div class="compare-cell compare-cell--capability compare-cell--empty" role="columnheader"></div>
          ${comparisonColumns.map((_, index) => `<div class="compare-cell compare-cell--head" role="columnheader">${placeholder(`COMPARISON_COLUMN_${index + 1}`, "LOCALIZED_STRING_SS")}</div>`).join("\n          ")}
        </div>
      </div>
      <div class="compare-body" role="rowgroup" data-compare-body>
        <!-- cms-child-slot:COMPARE_ROWS -->
      </div>
    </div>
  </div>
</section>`,
      params: comparisonParams,
      children: comparisonItems,
    }),
  );

  const faqItems = faqSection.items.map((item, index) => {
    const code = `FAQ_${index + 1}`;
    const params = [
      makeTextParam(code, "QUESTION", item.title, locale),
      makeTextParam(code, "ANSWER", item.paragraphs.join(" "), locale),
    ];
    addValues(params);
    return makeTemplate({
      code,
      name: item.title,
      parentCode: "FAQ",
      html: faqItemHtml(code, index + 1),
      params,
    });
  });
  const faqParams = [
    makeTextParam("FAQ", "EYEBROW", faqSection.title, locale),
    makeTextParam("FAQ", "TITLE", "Frequently asked questions", locale),
    makeTextParam("FAQ", "LEDE", faqSection.paragraphs.join(" "), locale),
    makeTextParam("FAQ", "GROUP_TITLE", "Field service operations", locale),
  ];
  addValues(faqParams);
  children.push(
    makeTemplate({
      code: "FAQ",
      name: "FAQ",
      parentCode: rootCode,
      html: `<section class="faq" id="faq" data-block="faq.bubble-light-grouped">
  <div class="container">
    <header class="faq-top">
      <p class="eyebrow">${placeholder("FAQ_EYEBROW", "LOCALIZED_STRING_SS")}</p>
      <h2 class="faq-title">${placeholder("FAQ_TITLE", "LOCALIZED_STRING_SS")}</h2>
      <p class="faq-lede">${placeholder("FAQ_LEDE", "LOCALIZED_STRING_SS")}</p>
    </header>
    <div class="faq-groups">
      <article class="faq-group" data-faq-group="01">
        <header class="faq-group-head">
          <span class="faq-group-num">G.01</span>
          <h3 class="faq-group-title">${placeholder("FAQ_GROUP_TITLE", "LOCALIZED_STRING_SS")}</h3>
        </header>
        <div class="faq-group-body">
          <!-- cms-child-slot:FAQ_ITEMS -->
        </div>
      </article>
    </div>
  </div>
</section>`,
      params: faqParams,
      children: faqItems,
    }),
  );

  const ctaParams = [
    makeTextParam("CTA", "EYEBROW", "Next step", locale),
    makeTextParam("CTA", "TITLE", finalCta.paragraphs[0] || "Ready to see ServiceWand?", locale),
    makeTextParam("CTA", "PRIMARY_LABEL", finalCta.links[0]?.label || heroLinks[0]?.label || "Book a Demo", locale),
    makeStringParam("CTA", "PRIMARY_HREF", finalCta.links[0]?.href || heroLinks[0]?.href || "/request-demo", locale),
  ];
  addValues(ctaParams);
  children.push(
    makeTemplate({
      code: "CTA",
      name: "CTA",
      parentCode: rootCode,
      html: `<section class="section section--cta" id="cta">
  <div class="container">
    <p class="eyebrow">${placeholder("CTA_EYEBROW", "LOCALIZED_STRING_SS")}</p>
    <h2 class="section-title">${placeholder("CTA_TITLE", "LOCALIZED_STRING_SS")}</h2>
    <a class="btn btn-primary btn-primary-ring" href="${placeholder("CTA_PRIMARY_HREF", "STRING")}">
      <svg class="btn-star" width="16" height="16" viewBox="0 0 21 21" fill="currentColor" aria-hidden="true"><path d="M10.5 0L13.4698 7.53015L21 10.5L13.4698 13.4698L10.5 21L7.53015 13.4698L0 10.5L7.53015 7.53015L10.5 0Z"/></svg>
      ${placeholder("CTA_PRIMARY_LABEL", "LOCALIZED_STRING_SS")}
    </a>
  </div>
</section>`,
      params: ctaParams,
    }),
  );

  const footer = requireBlock(sectionBlockIds.footer);
  addBlockChild({
    code: "FOOTER",
    name: "Footer",
    block: footer,
    overrides: { brand_name: "ServiceWand", brand_href: "/" },
  });

  const rootParams = [
    makeTextParam("ROOT", "META_TITLE", `${rootName} | ServiceWand`, locale),
    makeTextParam("ROOT", "META_DESCRIPTION", model.hero.paragraphs[0] || rootName, locale),
  ];
  addValues(rootParams);

  const allChildrenFlat = flattenTemplates(children);
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
  <!-- cms-child-slot:ROOT_SECTIONS -->
</div>`,
    css,
    javascript,
    parameters: rootParams,
  };

  const parameters = [...rootParams, ...collectParameters(children)];
  const enabledTemplates = [rootTemplate.code, ...allChildrenFlat.map((template) => template.code)];
  const pageContext = {
    url: model.frontmatter.url || `/${slug(rootName)}`,
    template: { code: rootTemplate.code },
    enabledTemplates,
    values,
    organization: { code: "SYSTEM" },
    excludeFromSeo: false,
  };

  const resolved = {
    sourceCopy: model.sourceFile,
    root: { code: rootTemplate.code, name: rootName, templateLanguage: "JTE" },
    selectedBlocks: selected.map((block) => ({ id: block.id, path: block.path, hasJs: Boolean(block.js.trim()) })),
    tree: {
      code: rootTemplate.code,
      children: children.map((child) => ({
        code: child.code,
        children: (child.children || []).map((item) => ({ code: item.code })),
      })),
    },
  };

  return {
    model,
    resolved,
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
  };
};

const writeTemplateTree = (outDir, template, indexPrefix = "") => {
  const dir = join(outDir, "children", `${indexPrefix}${slug(template.code)}`);
  mkdirSync(dir, { recursive: true });
  writeJson(join(dir, "template.json"), template);
  (template.children || []).forEach((child, index) => writeTemplateTree(outDir, child, `${indexPrefix}${pad(index + 1)}-`));
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
    "## Tree",
    "",
    `- \`${family.rootTemplate.code}\``,
    ...family.children.flatMap((child) => [
      `  - \`${child.code}\``,
      ...(child.children || []).map((item) => `    - \`${item.code}\``),
    ]),
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
  if (!args.copy || !args.out) throw new Error(usage());
  if (!existsSync(args.copy)) throw new Error(`Copy file not found: ${args.copy}`);

  const catalog = loadCatalog();
  const model = parseMarkdownCopy(args.copy);
  const family = buildFamily(model, catalog);

  rmSync(args.out, { recursive: true, force: true });
  mkdirSync(args.out, { recursive: true });

  writeJson(join(args.out, "landing.model.json"), family.model);
  writeJson(join(args.out, "composition.resolved.json"), family.resolved);
  writeFileSync(join(args.out, "head.html"), `${family.rootTemplate.head}\n`);
  writeFileSync(join(args.out, "root.css"), `${family.rootTemplate.css}\n`);
  writeFileSync(join(args.out, "root.js"), `${family.rootTemplate.javascript}\n`);
  writeJson(join(args.out, "root.template.json"), family.rootTemplate);
  family.children.forEach((child, index) => writeTemplateTree(args.out, child, `${pad(index + 1)}-`));
  writeJson(join(args.out, "parameters.json"), family.parameters);
  writeJson(join(args.out, "page-context.sample.json"), family.pageContext);
  writeJson(join(args.out, "cms-family.payload.json"), family.payload);
  writeSummary(args.out, family);

  console.log(`Generated CMS family ${family.rootTemplate.code}`);
  console.log(`Output: ${relative(process.cwd(), args.out)}`);
  console.log(`Child templates: ${flattenTemplates(family.children).length}`);
  console.log(`Parameters: ${family.parameters.length}`);
};

main();
