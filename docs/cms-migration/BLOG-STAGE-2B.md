# Blog transfer: deployed and verified

Completed 17 November 2026 on **prod.servicewand.com**. Domain not switched. Prices, users, roles, payments and schedules were not changed.

## What is on prod

| Item | Result |
|---|---:|
| Blog posts | 77: 60 enabled, 17 disabled |
| English content records | 75 |
| Categories | 4 |
| CMS blocks | 8 |
| Pages | 2: `/blogs`, `/blog` |
| Image dependencies | 126: 123 uploaded, 3 reused |
| Media libraries | 6: 4 created, 2 reused |

The 306 package operations are complete. The two empty disabled posts remain empty. All three disabled records sharing `snow-removal/blog-1` remain separate and disabled. SYSTEM test post `/blog/abc` was excluded.

## Authors

**64 imported posts temporarily use existing Nick Sas; 13 retain Super User.** No users or roles were created. Author names already in article metadata/text were preserved.

`author-restoration.json` in the package records the original authors for later reassignment. Its 65 temporary assignments include the one held article, which has not been imported. Author selectors use existing user identity, not source numeric IDs.

## Still deferred

One disabled article, `/blog/service-wand-one-operational-system`, and its English text remain outside prod. Its illustration and author-avatar references have no usable source image.

An illustration with the same filename was downloaded and inspected, but was not substituted automatically. The package retains it as a candidate in `image-repair.json`. Import this article only after approving replacement images or explicitly approving omission of the avatar. This does not block the 60 enabled articles.

## Verification

- **172 final configuration records** read back and compared with the package: libraries, categories, authors, enabled flags, post/image links, content, blocks and pages. No differences.
- Anonymous API returns **exactly 60 enabled posts**, with no missing or unexpected posts.
- Blog index and **all 60 public article pages** return HTTP 200 and contain the expected page/article markup and nonempty article text.
- Both CMS page previews return HTTP 200.
- **126 images** passed anonymous GET-range access, size and file-prefix checks. Full SHA-256 file hashes were verified after upload or before reuse; the final public-access pass does not repeat the full downloads.
- **74 previously existing pages and blocks** have unchanged configuration identity and optimistic versions in the catalog read at deployment completion.
- Eight runtime tests and five package integrity/scope tests passed.

Evidence: [configuration/media checks](blog-stage-2b-verification.json), [public pages/API checks](blog-stage-2b-public-verification.json), [deployment status](blog-stage-2b-status.json).

## Loader and recovery

The scoped loader now supports blog categories, posts and localized content. Blog mode cannot write users, forms, workflows or domains. It resolves references by semantic identity, preserves method scope, records every mutation and verifies saved records.

API-specific handling is now covered: associations use `identifier` mappings on write and collection mappings on read; image references require `mediaType: image` on write, while identifier reads omit this discriminator. Verification still requires matching image IDs and independently checked bytes.

Interrupted creates were reconciled against prod before retrying. API-format errors were corrected locally and affected records were rechecked; no unresolved deployment error remains. The private deployment journal and runtime bindings are preserved outside scratch space at `~/.local/state/servicewand/cms-blog-deploy-2026-11-17` and are not included in the shared package.

Source date fallback strings were retained in the renderer's supported `PUBLISHED_AT` metadata. System audit timestamps were not overwritten. The existing numeric-string display behavior was preserved; date-format UI changes were outside this migration.

## Package

The local `packages/blog-stage-2b-2026-11-17/` directory contains `configuration.zip`, six media archives and archive checksums. Extract all ZIPs into one directory. `requests.json` contains the applied ready subset; `held-requests.json` retains only the deferred article and text. The configuration archive includes the API-format corrections verified during deployment.

Use the existing private journal for any resume. Do not blindly replay creates or match the three disabled duplicates by permalink alone. No domain-switch action is included in this package.
