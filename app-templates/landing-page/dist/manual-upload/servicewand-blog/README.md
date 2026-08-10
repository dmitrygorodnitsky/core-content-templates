# Manual upload: ServiceWand blog

This package contains exactly two independent CMS BlockTemplates:

- `index/template.json` → `SERVICEWAND_BLOG_INDEX`
- `post/template.json` → `SERVICEWAND_BLOG_POST`

Both templates have `parent: null` and an empty `children` list. Uploading them does not attach them to a root template and does not change root children or PageContext.

`cms-family.payload.json` is a flat uploader envelope containing both independent templates. Its `root` and `children` keys are transport fields only; the uploader strips all relationship fields before saving.

The page root should provide the standard lab-ui tokens and composition CSS. A review copy is included as `css.common.css`; it is embedded only in the local preview files, not duplicated in the CMS templates.

Backend contract:

- list: `POST /core-cms/public/{organization}/blog-post/list.json?locale={locale}`
- article body: `SERVICEWAND_BLOG_POST_BLOG_POST_CONTENT` with type `BLOG_POST_CONTENT_SS`
- localized routes such as `/fr/blog/{permalink}` are preserved when article links are built
- missing display titles are omitted; an internal code, slug, or permalink is never shown as a title

The fixture URL parameter must remain empty in CMS production. It exists only for deterministic local previews.
