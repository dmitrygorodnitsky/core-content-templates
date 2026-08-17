/* generated local JS: blocks/15-blog/_shared/blog-runtime.js */
(function (global) {
  "use strict";

  var KNOWN_LOCALES = [
    "en", "zh", "es", "de", "fr", "ja", "pt", "ru", "it", "nl", "pl", "tr",
    "ar", "ko", "uk", "cs", "el", "da", "sv", "nb", "vi", "fa", "he", "hi",
    "ms", "et", "sl", "kk", "th", "id", "ro", "hu", "fi", "bg", "hr", "sk",
    "lt", "lv"
  ];

  function normalizeLocale(value) {
    return String(value || "").trim().toLowerCase().replace("_", "-").split("-")[0];
  }

  function localeFromPath(pathname) {
    var first = String(pathname || "").split("/").filter(Boolean)[0] || "";
    first = normalizeLocale(first);
    return KNOWN_LOCALES.indexOf(first) >= 0 ? first : "";
  }

  function getLocale() {
    var pathLocale = localeFromPath(global.location && global.location.pathname);
    var shared = global.__swLocale;
    var sharedLocale = shared && typeof shared.getEffectiveLocale === "function"
      ? shared.getEffectiveLocale()
      : "";
    return pathLocale || normalizeLocale(sharedLocale) ||
      normalizeLocale(document.documentElement.lang) || "en";
  }

  function localizedText(value, locale, defaultValue) {
    if (typeof value === "string" || typeof value === "number") {
      var direct = String(value).trim();
      return direct || String(defaultValue || "").trim();
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return String(defaultValue || "").trim();
    }
    var current = normalizeLocale(locale);
    var candidates = [current, String(locale || ""), "default", "en"];
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = value[candidates[i]];
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
    var keys = Object.keys(value);
    for (var j = 0; j < keys.length; j += 1) {
      var fallback = value[keys[j]];
      if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
    }
    return String(defaultValue || "").trim();
  }

  function firstText(source, keys, locale) {
    for (var i = 0; i < keys.length; i += 1) {
      var text = localizedText(source && source[keys[i]], locale, "");
      if (text) return text;
    }
    return "";
  }

  function safePath(value) {
    var path = String(value || "").trim().replace(/^\/+|\/+$/g, "");
    return path && !path.includes(":") && !path.includes("..") ? path : "";
  }

  function normalizePost(post, locale) {
    post = post && typeof post === "object" ? post : {};
    var metadata = post.metadata && typeof post.metadata === "object" ? post.metadata : {};
    var title = firstText(metadata, ["TITLE", "title", "META_TITLE", "metaTitle"], locale) ||
      firstText(post, ["title", "name"], locale);
    var permalink = safePath(post.permalink || post.slug);
    if (!title || !permalink) return null;

    var summary = localizedText(post.summary, locale, "") ||
      firstText(metadata, ["SUMMARY", "summary", "META_DESCRIPTION", "metaDescription", "DESCRIPTION"], locale);
    var publishedAt = firstText(metadata, ["PUBLISHED_AT", "publishedAt", "PUBLISH_DATE", "publishDate", "DATE"], locale) ||
      String(post.publishedAt || post.publishDate || post.created || "");
    var imageUrl = firstText(metadata, ["HERO_IMAGE_URL", "heroImageUrl", "IMAGE_URL", "imageUrl", "COVER_URL", "coverUrl"], locale) ||
      firstText(post, ["imageUrl", "coverUrl"], locale);
    var imageAlt = firstText(metadata, ["HERO_IMAGE_ALT", "heroImageAlt", "IMAGE_ALT", "imageAlt"], locale) || title;
    return {
      id: String(post.id || ""),
      permalink: permalink,
      title: title,
      summary: summary,
      category: firstText(metadata, ["CATEGORY_NAME", "categoryName", "CATEGORY"], locale),
      author: firstText(metadata, ["AUTHOR_NAME", "authorName", "AUTHOR"], locale),
      publishedAt: publishedAt,
      readTime: firstText(metadata, ["READING_TIME", "readingTime", "READ_TIME", "readTime"], locale),
      imageUrl: imageUrl,
      imageAlt: imageAlt,
      metadata: metadata,
      raw: post
    };
  }

  function parsePositive(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
  }

  function optionalFixtureUrl(value) {
    var url = String(value || "").trim();
    return !url || url === "#" ? "" : url;
  }

  function optionalPositiveId(value) {
    var id = String(value || "").trim();
    return Number(id) > 0 ? id : "";
  }

  function localizedApiBase(config) {
    var base = String(config.apiBase || "").replace(/\/+$/, "");
    if (!base.startsWith("/") || base.startsWith("//")) return base;
    var first = base.split("/").filter(Boolean)[0] || "";
    if (KNOWN_LOCALES.indexOf(normalizeLocale(first)) >= 0) return base;
    return "/" + encodeURIComponent(normalizeLocale(config.locale) || "en") + base;
  }

  function configFrom(root) {
    var data = root.dataset || {};
    return {
      apiBase: String(data.blogApiBase || "/core-cms").replace(/\/+$/, ""),
      organization: String(data.blogOrganization || "SERVICEWAND").trim(),
      categoryId: optionalPositiveId(data.blogCategoryId),
      pageSize: parsePositive(data.blogPageSize, 12),
      maxResults: parsePositive(data.blogMaxResults, 1000),
      basePath: "/" + (safePath(data.blogBasePath) || "blog"),
      postPath: "/" + (safePath(data.blogPostPath) || safePath(data.blogBasePath) || "post"),
      fixtureUrl: optionalFixtureUrl(data.blogFixtureUrl),
      locale: getLocale()
    };
  }

  function requestPage(config, offset) {
    if (config.fixtureUrl) {
      return fetch(config.fixtureUrl, { headers: { Accept: "application/json" } }).then(checkResponse);
    }
    var filters = [];
    if (config.categoryId) {
      filters.push({
        property: "categories.id",
        clazz: "java.lang.Integer",
        operator: "=",
        value: config.categoryId
      });
    }
    var url = localizedApiBase(config) + "/public/" + encodeURIComponent(config.organization) +
      "/blog-post/list.json";
    return fetch(url, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        first: offset,
        offset: offset,
        pageSize: config.pageSize,
        filters: filters,
        sorting: [{ field: "permalink", direction: "DESC" }]
      })
    }).then(checkResponse);
  }

  function checkResponse(response) {
    if (!response.ok) throw new Error("Blog request failed: " + response.status);
    return response.json();
  }

  function loadPosts(config) {
    var collected = [];
    function next(offset) {
      return requestPage(config, offset).then(function (data) {
        var result = Array.isArray(data) ? data : (Array.isArray(data.result) ? data.result : []);
        var normalized = result.map(function (post) {
          return normalizePost(post, config.locale);
        }).filter(Boolean);
        collected = collected.concat(normalized);
        var total = Number(data.resultSize || data.total || result.length);
        var done = config.fixtureUrl || result.length === 0 || collected.length >= total ||
          collected.length >= config.maxResults;
        return done ? collected.slice(0, config.maxResults) : next(offset + result.length);
      });
    }
    if (!config.organization && !config.fixtureUrl) return Promise.reject(new Error("Blog organization is required"));
    return next(0);
  }

  function buildIndexUrl(config) {
    var locale = config.locale || "";
    var prefix = localeFromPath(global.location && global.location.pathname) ? "/" + locale : "";
    return prefix + config.basePath;
  }

  function buildPostUrl(post, config) {
    var locale = config.locale || "";
    var prefix = localeFromPath(global.location && global.location.pathname) ? "/" + locale : "";
    return prefix + config.postPath + "/" + post.permalink;
  }

  function currentPermalink(config) {
    var parts = String(global.location && global.location.pathname || "").split("/").filter(Boolean);
    if (parts.length && KNOWN_LOCALES.indexOf(normalizeLocale(parts[0])) >= 0) parts.shift();
    var base = config.postPath.split("/").filter(Boolean);
    for (var i = 0; i <= parts.length - base.length; i += 1) {
      if (base.every(function (part, offset) { return parts[i + offset] === part; })) {
        return parts.slice(i + base.length).map(decodeURIComponent).join("/");
      }
    }
    var legacyIndex = parts.indexOf("blog.html");
    return legacyIndex >= 0 ? parts.slice(legacyIndex + 1).map(decodeURIComponent).join("/") : "";
  }

  function formatDate(value, locale) {
    if (!value) return "";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    try {
      return new Intl.DateTimeFormat(locale || "en", { year: "numeric", month: "long", day: "numeric" }).format(date);
    } catch (error) {
      return String(value);
    }
  }

  global.LabBlog = {
    buildIndexUrl: buildIndexUrl,
    buildPostUrl: buildPostUrl,
    configFrom: configFrom,
    currentPermalink: currentPermalink,
    formatDate: formatDate,
    getLocale: getLocale,
    loadPosts: loadPosts,
    localizedText: localizedText,
    normalizePost: normalizePost
  };
})(window);


/* generated child JS: blocks/15-blog/blog.post-dynamic/block.js */
(function () {
  "use strict";

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function safeUrl(value, image) {
    var source = String(value || "").trim();
    if (!source || /^javascript:/i.test(source) || /^data:/i.test(source)) return "";
    try {
      var url = new URL(source, window.location.href);
      if (["http:", "https:"].indexOf(url.protocol) >= 0) return source;
      if (!image && ["mailto:", "tel:"].indexOf(url.protocol) >= 0) return source;
    } catch (error) {
      return "";
    }
    return "";
  }

  function appendInlineMarkdown(target, source) {
    var remaining = String(source || "");
    var match;
    while (remaining) {
      match = remaining.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/);
      if (match) {
        var imageUrl = safeUrl(match[2], true);
        if (imageUrl) {
          var image = document.createElement("img");
          image.src = imageUrl;
          image.alt = match[1];
          image.loading = "lazy";
          image.decoding = "async";
          if (match[3]) image.title = match[3];
          target.appendChild(image);
        } else {
          target.appendChild(document.createTextNode(match[1]));
        }
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/);
      if (match) {
        var linkUrl = safeUrl(match[2], false);
        if (linkUrl) {
          var link = document.createElement("a");
          link.href = linkUrl;
          if (match[3]) link.title = match[3];
          appendInlineMarkdown(link, match[1]);
          target.appendChild(link);
        } else {
          target.appendChild(document.createTextNode(match[1]));
        }
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^`([^`]+)`/);
      if (match) {
        target.appendChild(element("code", "", match[1]));
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^(?:\*\*|__)(.+?)(?:\*\*|__)/);
      if (match) {
        var strong = document.createElement("strong");
        appendInlineMarkdown(strong, match[1]);
        target.appendChild(strong);
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^(?:\*|_)([^*_]+?)(?:\*|_)/);
      if (match) {
        var emphasis = document.createElement("em");
        appendInlineMarkdown(emphasis, match[1]);
        target.appendChild(emphasis);
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^<((?:https?:\/\/|mailto:)[^>]+)>/i);
      if (match) {
        var autoUrl = safeUrl(match[1], false);
        var autoLink = document.createElement("a");
        autoLink.href = autoUrl;
        autoLink.textContent = match[1];
        target.appendChild(autoLink);
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^\\([\\`*_[\]{}()#+\-.!>])/);
      if (match) {
        target.appendChild(document.createTextNode(match[1]));
        remaining = remaining.slice(match[0].length);
        continue;
      }
      target.appendChild(document.createTextNode(remaining.charAt(0)));
      remaining = remaining.slice(1);
    }
  }

  function markdownFragment(source) {
    var fragment = document.createDocumentFragment();
    var lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
    var paragraph = [];
    var list = null;
    var quote = [];
    var code = null;
    var codeLanguage = "";

    function appendTextBlock(tag, values) {
      if (!values.length) return;
      var node = document.createElement(tag);
      appendInlineMarkdown(node, values.join(" ").trim());
      fragment.appendChild(node);
      values.length = 0;
    }

    function flushParagraph() {
      appendTextBlock("p", paragraph);
    }

    function flushQuote() {
      appendTextBlock("blockquote", quote);
    }

    function closeList() {
      list = null;
    }

    lines.forEach(function (line) {
      var match;
      if (code) {
        if (/^\s*```\s*$/.test(line)) {
          var pre = document.createElement("pre");
          var codeNode = document.createElement("code");
          codeNode.textContent = code.join("\n");
          if (codeLanguage) codeNode.className = "language-" + codeLanguage;
          pre.appendChild(codeNode);
          fragment.appendChild(pre);
          code = null;
          codeLanguage = "";
        } else {
          code.push(line);
        }
        return;
      }

      match = line.match(/^\s*```([A-Za-z0-9_-]*)\s*$/);
      if (match) {
        flushParagraph();
        flushQuote();
        closeList();
        code = [];
        codeLanguage = match[1];
        return;
      }
      if (!line.trim()) {
        flushParagraph();
        flushQuote();
        closeList();
        return;
      }
      match = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (match) {
        flushParagraph();
        flushQuote();
        closeList();
        var heading = document.createElement("h" + match[1].length);
        appendInlineMarkdown(heading, match[2]);
        fragment.appendChild(heading);
        return;
      }
      if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        flushParagraph();
        flushQuote();
        closeList();
        fragment.appendChild(document.createElement("hr"));
        return;
      }
      match = line.match(/^\s*>\s?(.*)$/);
      if (match) {
        flushParagraph();
        closeList();
        quote.push(match[1]);
        return;
      }
      match = line.match(/^\s*[-+*]\s+(.+)$/);
      if (match) {
        flushParagraph();
        flushQuote();
        if (!list || list.tagName !== "UL") {
          list = document.createElement("ul");
          fragment.appendChild(list);
        }
        var unorderedItem = document.createElement("li");
        appendInlineMarkdown(unorderedItem, match[1]);
        list.appendChild(unorderedItem);
        return;
      }
      match = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (match) {
        flushParagraph();
        flushQuote();
        if (!list || list.tagName !== "OL") {
          list = document.createElement("ol");
          fragment.appendChild(list);
        }
        var orderedItem = document.createElement("li");
        appendInlineMarkdown(orderedItem, match[1]);
        list.appendChild(orderedItem);
        return;
      }
      flushQuote();
      closeList();
      paragraph.push(line.trim());
    });

    if (code) paragraph.push("```" + codeLanguage, code.join("\n"));
    flushParagraph();
    flushQuote();
    return fragment;
  }

  function renderServerMarkdown(root) {
    var documentRoot = root.querySelector("[data-blog-document]");
    if (!documentRoot) return;
    documentRoot.querySelectorAll(".blog-post > .content").forEach(function (content) {
      var pre = content.querySelector(":scope > pre");
      if (!pre) return;
      var meaningfulSiblings = Array.from(content.children).filter(function (child) {
        return child !== pre && String(child.textContent || "").trim();
      });
      if (meaningfulSiblings.length) return;
      var source = String((pre.querySelector("code") || pre).textContent || "").trim();
      if (!source) return;
      content.replaceChildren(markdownFragment(source));
      content.setAttribute("data-blog-markdown-rendered", "true");
    });
  }

  function serverRenderedTitle(root) {
    var heading = root.querySelector("[data-blog-document] h1");
    return heading ? String(heading.textContent || "").trim() : "";
  }

  function setMeta(name, value) {
    if (!value) return;
    var selector = name === "description" ? 'meta[name="description"]' : 'meta[property="' + name + '"]';
    var node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      if (name === "description") node.name = name;
      else node.setAttribute("property", name);
      document.head.appendChild(node);
    }
    node.content = value;
  }

  function setCanonical(url) {
    var canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  function applySeo(root, post) {
    document.title = post.title;
    setMeta("description", post.summary);
    setMeta("og:title", post.title);
    setMeta("og:description", post.summary);
    if (post.imageUrl) setMeta("og:image", post.imageUrl);
    setCanonical(window.location.href.split("?")[0].split("#")[0]);
    var schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.summary || undefined,
      datePublished: post.publishedAt || undefined,
      author: post.author ? { "@type": "Organization", name: post.author } : undefined,
      image: post.imageUrl || undefined,
      mainEntityOfPage: window.location.href.split("#")[0]
    };
    Object.keys(schema).forEach(function (key) { if (schema[key] === undefined) delete schema[key]; });
    var node = root.querySelector("[data-blog-article-schema]");
    if (node) node.textContent = JSON.stringify(schema);
  }

  function renderCurrent(root, post, config) {
    var title = root.querySelector("[data-blog-current-title]");
    if (title) title.textContent = post.title;
    var meta = root.querySelector("[data-blog-current-meta]");
    var date = window.LabBlog.formatDate(post.publishedAt, config.locale);
    [post.category, date, post.readTime, post.author].filter(Boolean).forEach(function (value) {
      meta.appendChild(element("span", "blog-post-page__meta-item", value));
    });
    meta.hidden = meta.children.length === 0;
    var hero = root.querySelector("[data-blog-current-image]");
    if (post.imageUrl) {
      var image = document.createElement("img");
      image.src = post.imageUrl;
      image.alt = post.imageAlt || post.title;
      image.decoding = "async";
      hero.appendChild(image);
      hero.hidden = false;
    }
    applySeo(root, post);
  }

  function renderRelated(root, posts, current, config) {
    var limit = Math.max(1, Number(root.getAttribute("data-blog-related-limit") || 3));
    var readLabel = root.getAttribute("data-blog-read-label") || "Read article";
    var list = posts.filter(function (post) { return post.permalink !== current; }).slice(0, limit);
    if (!list.length) return;
    var grid = root.querySelector("[data-blog-related]");
    list.forEach(function (post) {
      var article = element("article", "blog-related-card");
      var link = element("a", "blog-related-card__link");
      link.href = window.LabBlog.buildPostUrl(post, config);
      if (post.category) link.appendChild(element("span", "blog-related-card__category", post.category));
      link.appendChild(element("h3", "blog-related-card__title", post.title));
      if (post.summary) link.appendChild(element("p", "blog-related-card__summary", post.summary));
      link.appendChild(element("span", "blog-related-card__read", readLabel));
      article.appendChild(link);
      grid.appendChild(article);
    });
    root.querySelector("[data-blog-related-section]").hidden = false;
  }

  function init(root) {
    if (!window.LabBlog) return;
    renderServerMarkdown(root);
    var config = window.LabBlog.configFrom(root);
    var indexLink = root.querySelector("[data-blog-index-link]");
    if (indexLink) indexLink.href = window.LabBlog.buildIndexUrl(config);
    var title = root.querySelector("[data-blog-current-title]");
    var fallbackTitle = serverRenderedTitle(root);
    if (title && fallbackTitle) title.textContent = fallbackTitle;
    var current = root.getAttribute("data-blog-current-permalink") || window.LabBlog.currentPermalink(config);
    window.LabBlog.loadPosts(config).then(function (posts) {
      var post = posts.find(function (candidate) { return candidate.permalink === current; });
      if (post) renderCurrent(root, post, config);
      renderRelated(root, posts, current, config);
    }).catch(function (error) {
      console.error(error);
    });
  }

  function ready() {
    document.querySelectorAll("[data-blog-post]").forEach(init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
