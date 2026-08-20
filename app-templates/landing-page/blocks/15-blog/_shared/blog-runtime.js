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

  function heroImageUrlOf(post) {
    var hero = post.heroImage;
    if (!hero) return "";
    if (typeof hero === "string") return hero.trim();
    if (typeof hero === "object" && hero.id) {
      return "/core/image/" + encodeURIComponent(String(hero.id)) + "/get";
    }
    return "";
  }

  function normalizePost(post, locale) {
    post = post && typeof post === "object" ? post : {};
    var metadata = post.metadata && typeof post.metadata === "object" ? post.metadata : {};
    var title = firstText(metadata, ["TITLE", "title", "META_TITLE", "metaTitle"], locale) ||
      firstText(post, ["title", "name"], locale);
    var permalink = safePath(post.permalink || post.slug);
    if (!permalink) return null;

    var summary = localizedText(post.summary, locale, "") ||
      firstText(metadata, ["SUMMARY", "summary", "META_DESCRIPTION", "metaDescription", "DESCRIPTION"], locale);
    var publishedAt = firstText(metadata, ["PUBLISHED_AT", "publishedAt", "PUBLISH_DATE", "publishDate", "DATE"], locale) ||
      String(post.publishedAt || post.publishDate || post.created || "");
    var imageUrl = firstText(metadata, ["HERO_IMAGE_URL", "heroImageUrl", "IMAGE_URL", "imageUrl", "COVER_URL", "coverUrl"], locale) ||
      heroImageUrlOf(post) ||
      firstText(post, ["imageUrl", "coverUrl"], locale);
    var imageAlt = firstText(metadata, ["HERO_IMAGE_ALT", "heroImageAlt", "IMAGE_ALT", "imageAlt"], locale) || title;
    var category = firstText(metadata, ["CATEGORY_NAME", "categoryName", "CATEGORY"], locale);
    if (!category && Array.isArray(post.categories)) {
      for (var i = 0; i < post.categories.length && !category; i += 1) {
        var categoryNls = post.categories[i] && post.categories[i].nls;
        var localizedCategory = categoryNls && (categoryNls[normalizeLocale(locale)] || categoryNls.en);
        category = firstText(localizedCategory, ["NAME", "name"], locale);
      }
    }
    return {
      id: String(post.id || ""),
      permalink: permalink,
      title: title,
      summary: summary,
      category: category,
      author: firstText(metadata, ["AUTHOR_NAME", "authorName", "AUTHOR"], locale),
      authorAvatarUrl: firstText(metadata, ["AUTHOR_AVATAR_URL", "authorAvatarUrl", "AUTHOR_IMAGE_URL", "authorImageUrl", "AUTHOR_PHOTO_URL"], locale),
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

  function detailsFromMarkdown(source) {
    var lines = String(source || "").replace(/\r/g, "").split("\n");
    var title = "";
    var summary = "";
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!title) {
        var heading = line.match(/^#\s+(.+)$/);
        if (heading) title = heading[1].trim();
        continue;
      }
      if (!line || /^(?:#{1,6}\s|[-*+]\s|>\s|```)/.test(line)) continue;
      summary = line;
      break;
    }
    return { title: title, summary: summary };
  }

  function detailsFromPostHtml(html) {
    var parsed = new DOMParser().parseFromString(String(html || ""), "text/html");
    var documentRoot = parsed.querySelector("[data-blog-document]") || parsed.querySelector(".blog-post");
    if (!documentRoot) return { title: "", summary: "", imageUrl: "", imageAlt: "" };
    var titleNode = documentRoot.querySelector("h1");
    var summaryNode = documentRoot.querySelector("h1 ~ p") || documentRoot.querySelector("p");
    var details = {
      title: titleNode ? titleNode.textContent.trim() : "",
      summary: summaryNode ? summaryNode.textContent.trim() : ""
    };
    if (!details.title) {
      var markdownNode = documentRoot.querySelector("pre code");
      if (markdownNode) details = detailsFromMarkdown(markdownNode.textContent);
    }
    var imageNode = documentRoot.querySelector("img");
    details.imageUrl = imageNode ? String(imageNode.getAttribute("src") || "").trim() : "";
    details.imageAlt = imageNode ? String(imageNode.getAttribute("alt") || "").trim() : "";
    return details;
  }

  function hydratePost(post, config) {
    if (post.title && post.summary && post.imageUrl) return Promise.resolve(post);
    return fetch(buildPostUrl(post, config), {
      credentials: "omit",
      headers: { Accept: "text/html" }
    }).then(function (response) {
      if (!response.ok) throw new Error("Blog post request failed: " + response.status);
      return response.text();
    }).then(function (html) {
      var details = detailsFromPostHtml(html);
      post.title = post.title || details.title;
      post.summary = post.summary || details.summary;
      if (!post.imageUrl && details.imageUrl) {
        post.imageUrl = details.imageUrl;
        post.imageAlt = post.imageAlt || details.imageAlt || post.title;
        post.imageFromContent = true;
      }
      return post;
    }).catch(function () {
      return post;
    });
  }

  function hydratePosts(posts, config) {
    return Promise.all(posts.map(function (post) {
      return hydratePost(post, config);
    })).then(function (hydrated) {
      return hydrated.filter(function (post) { return Boolean(post.title); });
    });
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
        return done
          ? hydratePosts(collected.slice(0, config.maxResults), config)
          : next(offset + result.length);
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
