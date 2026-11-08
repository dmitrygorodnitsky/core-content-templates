const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", mdash: "—", ndash: "–", hellip: "…", times: "×", copy: "©" };

export const plainText = (html) => String(html ?? "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === "#") return String.fromCodePoint(entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
    return ENTITIES[entity.toLowerCase()] ?? match;
  })
  .replace(/\s+/g, " ")
  .trim();

const NON_FEATURE_ANCHORS = new Set(["#pricing", "#faq"]);

export const buildSeoGraph = ({ spec, values, blockHtml, block, media, seo, origin }) => {
  const english = (value) => (value && typeof value === "object" ? value.en ?? Object.values(value)[0] : value);
  const text = (placeholder) => {
    const code = `SNOW_${placeholder.toUpperCase()}`;
    if (!(code in values)) throw new Error(`SEO graph: no value for ${code}`);
    return plainText(english(values[code]));
  };
  const page = `${origin}${spec.url}`;
  const title = plainText(english(values.ROOT_META_TITLE));
  const description = plainText(english(values.ROOT_META_DESCRIPTION));

  const faq = [...blockHtml.matchAll(/<summary><h3>\{\{(faq_h3_\d+)\}\}<\/h3>[\s\S]*?<\/summary><div class="faq-answer"><p>\{\{(faq_text_\d+)\}\}<\/p><\/div>/g)]
    .map(([, question, answer]) => ({ "@type": "Question", name: text(question), acceptedAnswer: { "@type": "Answer", text: text(answer) } }));
  if (!faq.length) throw new Error("SEO graph: the block has no FAQ items");

  const headerParams = new Map((block.header_variant?.params || []).map((param) => [param.code, param.value]));
  const anchors = [...headerParams.keys()].filter((code) => /^snow_link_\d+_href$/.test(code)).map((code) => headerParams.get(code)).filter((href) => !NON_FEATURE_ANCHORS.has(href));
  const sections = anchors.map((anchor) => {
    const match = blockHtml.match(new RegExp(`<section\\b[^>]*\\bid="${anchor.slice(1)}"[\\s\\S]*?<h2[^>]*>\\{\\{([a-z0-9_]+)\\}\\}<\\/h2>`));
    if (!match) throw new Error(`SEO graph: section ${anchor} has no parameterized H2`);
    return { name: text(match[1]), url: `${page}${anchor}` };
  });

  const hero = media[seo.heroImage];
  if (!hero) throw new Error(`SEO graph: ${seo.heroImage} has no media id`);
  const heroUrl = `${origin}/core/image/${hero.id}/get/${hero.name}`;

  const fill = (node) => JSON.parse(JSON.stringify(node), (key, value) => {
    if (value === "{sections}") return sections.map((section) => section.name).join(", ");
    if (value === "{description}") return description;
    return typeof value === "string" ? value.replaceAll("{page}", page) : value;
  });

  const breadcrumb = seo.breadcrumb.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.path ? new URL(item.path, origin).href : page,
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      ...seo.nodes.map(fill),
      {
        "@type": "WebPage",
        "@id": `${page}#webpage`,
        url: page,
        name: title,
        description,
        inLanguage: seo.language,
        isPartOf: { "@id": "https://servicewand.com/#website" },
        about: { "@id": `${page}#software` },
        breadcrumb: { "@id": `${page}#breadcrumb` },
        primaryImageOfPage: { "@id": `${page}#hero-image` },
      },
      { "@type": "BreadcrumbList", "@id": `${page}#breadcrumb`, itemListElement: breadcrumb },
      { "@type": "ImageObject", "@id": `${page}#hero-image`, url: heroUrl, contentUrl: heroUrl, caption: seo.heroCaption },
      {
        "@type": "ItemList",
        "@id": `${page}#sections`,
        name: text("hero_h1_1"),
        itemListElement: sections.map((section, index) => ({ "@type": "ListItem", position: index + 1, name: section.name, url: section.url })),
      },
      { "@type": "FAQPage", "@id": `${page}#faq`, mainEntity: faq },
    ],
  };
};
