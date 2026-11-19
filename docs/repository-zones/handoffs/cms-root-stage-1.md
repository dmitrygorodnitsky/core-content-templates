# Root CMS offline package handoff

- Parent task: prepare root ServiceWand CMS payload without server writes.
- From zone: Shared tooling (`scripts/cms-transfer`).
- To zone: Repository documentation (`docs/cms-migration`).
- Blocking dependency: target IDs and optimistic versions are available only after fresh semantic lookup/read-back during staged deployment.
- Required inputs: scoped read-only CMS snapshots, native exports, full form/workflow/library definitions, verified media bytes.
- Expected outputs: archived staged request templates, semantic identity registry, orphan quarantine, integrity checks.
- Acceptance criteria: no HTTP writer; unresolved references fail closed; dependency order passes; source page/form permissions and current organization destinations preserved.
- Target time: first-stage CMS transfer preparation.
- Owner: shared-tooling.
- Backup owner: documentation.

## Evidence

- Package: `docs/cms-migration/packages/root-site-stage-1-2026-11-17.zip`.
- Validation: `python3 scripts/cms-transfer/test_root_package.py tmp/cms-root-stage-1` (7 passed), ZIP CRC and SHA-256 verification, scoped `git diff --check`.
- Follow-up risks: native save acceptance and rendered UI remain untested; no test business form was submitted. Refresh historical bindings before writes. Source snapshots in tmp are private acquisition data; the durable prepared artifact is the package above.

## Authorized execution, 17 November 2026

The user authorized stage-one deployment. Shared tooling now owns a narrowly scoped writer with fresh semantic lookup, integrity checks, a write journal, and read-back verification. Documentation owns the deployment result. The original offline-preparation acceptance criteria above describe the earlier phase; server writes are now authorized for the package only. Domain switching, payment, schedules, and business submissions remain outside scope.

Execution completed: 146 operations, 57 final configuration checks, 10 CMS previews and public pages, 10 public form schemas, 53 anonymous media hash checks. No outstanding stage-one deployment issue. Durable result: `docs/cms-migration/root-deployment-verification-2026-11-17.json`. Business submissions and visual browser QA were not performed; full-site/domain cutover remains a later stage.

## Stage-two read-only preparation

The user requested the remaining sections and dependency audit, without domain cutover. Documentation now owns `docs/cms-migration/REMAINING-STAGE-2.md`, its JSON register and page CSV. Acquisition scripts and raw captures remain private scratch; the durable register records evidence and limits. No stage-two server writes or executable payload were produced.

## Authorized stage 2A execution

The user authorized Field Service, Snow Removal and its redirect page with dependencies, preserving prices and domain. Shared tooling compiles three fresh native exports into 20 blocks, 3 pages and 46 media dependencies, and reuses the scoped deployment runner with explicit package/run paths. Documentation owns the resulting status. No product, price, domain, payment or schedule write is included.

Stage 2A completed: 3 pages, 20 blocks, 46 media dependencies, 3 new libraries; 27 final configuration checks, 51 unchanged prior records, public HTML and anonymous media hashes passed. Catalog response unchanged. Durable status: `docs/cms-migration/sections-stage-2a-status.json`. Domain unchanged.

## Blog preparation, 17 November 2026

`scripts/cms-transfer/prepare_blog.py` owns offline blog request compilation; `docs/cms-migration/BLOG-STAGE-2B.md` and its packaged archives own reviewable transfer evidence. No authored CMS source or server changed. Existing user author selectors are read-only dependencies; no user creation. Blog routes remain outside the root executor allowlist pending a dedicated importer.

## Blog deployment completed, 17 November 2026

User authorized ready-blog deployment to prod without switching the domain. Shared tooling now supports a separate blog write allowlist and identifier-write/collection-read mappings. 77 posts, 75 English contents, 4 categories, 8 blocks, 2 pages and 126 media dependencies are deployed. One disabled article remains held. All 172 final records, 61 public pages, 126 public image access checks and 74 unchanged prior records passed. Runtime journal is private outside the repository. The earlier preparation-only status above is superseded.
