# Manual upload: ServiceWand blog

This package contains exactly two independent CMS BlockTemplates:

- `index/template.json` → `FIELD_SERVICE_BLOG_INDEX`
- `post/template.json` → `FIELD_SERVICE_BLOG_POST`

Both templates have `parent: null` and an empty `children` list. Uploading them does not attach them to a root template and does not change root children or PageContext.

`cms-family.payload.json` is a flat uploader envelope containing both independent templates. Its `root` and `children` keys are transport fields only; the uploader strips all relationship fields before saving.

The page root should provide the standard lab-ui tokens and composition CSS. A review copy is included as `css.common.css`; it is embedded only in the local preview files, not duplicated in the CMS templates.

Backend contract:

- list: `POST /{locale}/core-cms/public/{organization}/blog-post/list.json`; locale must stay in the path because adding `?locale=` triggers a redirect that changes POST to GET
- PageContext URLs: `/blog` for the index and `/post` for individual articles
- article body: `${POST@BLOG_POST_CONTENT_SS}`; `POST` is a server-provided runtime value and is intentionally not a BlockTemplate parameter
- every path segment after `/post` is the BlogPost permalink, including multi-segment values such as `news/my-post`
- localized routes such as `/fr/post/{permalink}` are preserved when article links are built
- the article body is rendered by Core CMS and displayed exactly as served; the template only applies typography styles and never transforms the server DOM
- the post template head declares `META_TITLE`, `META_DESCRIPTION`, and `HERO_IMAGE_URL` as bare uppercase STRING parameters with untyped `${CODE}` placeholders, so Core CMS substitutes the matching `BlogPost.metadata` keys while an article renders; prefixed codes never match and must not be used for this bridge
- the head intentionally omits `<title>` and `<meta name="description">`: the root template owns both, and duplicating them in an included child head yields two competing tags
- client SEO only fills tags the server left empty or placeholder-valued, so a server-substituted metadata value always wins
- card and SEO images resolve in order: metadata `HERO_IMAGE_URL`, the `heroImage` field of the list payload (entity id or URL), then the first image of the server-rendered article fetched during hydration; a hydrated content image is never duplicated as the post-page hero banner
- missing display titles are omitted; an internal code, slug, or permalink is never shown as a title

The fixture URL parameter must remain empty in CMS production. It exists only for deterministic local previews.
