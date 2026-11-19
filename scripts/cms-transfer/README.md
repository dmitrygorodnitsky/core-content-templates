# Root CMS transfer tooling

`prepare_root.py` compiles a read-only source capture into ordered request templates and verified binary files. It does not send requests. Inputs are the scoped snapshot, native root/page exports, full form/workflow/library definitions and downloaded media collected during the CMS inventory.

`materialize.py` resolves one request against operator-supplied bindings obtained by fresh target reads. Unknown identities fail closed. Do not submit a `bodyTemplate` or unresolved multipart description directly.

```sh
python3 scripts/cms-transfer/test_root_package.py /absolute/path/to/extracted-package
python3 scripts/cms-transfer/materialize.py --package /absolute/path/to/extracted-package --bindings /private/path/fresh-bindings.json --key 'page|SERVICEWAND|/index.html#create' --out /private/path/request.json
```

Before writes: resolve identities by organization code, template path, form code, workflow/state code, page organization/site/URL, and media library/name/hash. Existing definitions must be compared before reuse or update. Never replay a request after an uncertain result. Refresh optimistic versions for content/link phases. The materializer does not execute requests.

The binary upload shape follows Core UI `features/MediaLibrary/lib/hooks/useUploadMedia.ts`: `/core/api/media/save.json`, multipart `files` and `library`. JSON saves use SaveMappedRequest. Server acceptance and rendering are not established by offline tests.

Source filesystem library `location` is environment-specific and is not copied. New library workflow hooks must be explicitly reviewed if present. Payment, schedules, business forms and workflow events are outside this tool's write scope.

## Authorized staged deployment

`node scripts/cms-transfer/deploy-root.mjs --apply` consumes the verified extracted package at `tmp/cms-root-stage-1` and prompts for a production API key without echoing it. The runner resolves identities afresh, journals each attempted write, verifies JSON read-back and media hashes, and stops on conflicts or uncertain results. Credentials are not persisted. Its write allowlist contains only CMS configuration, media-library/media, and workflow definitions; it cannot submit business forms or trigger workflow events.

The dated journal under `tmp/cms-root-deploy-2026-11-17` is private operational evidence. Do not delete it to force a retry: reconcile any uncertain outcome first. This runner is scoped to the prepared root package and target host, not a general-purpose importer.

`--resume-pages` is only allowed after every non-page operation is journal-verified. It resumes page saves using the journal's verified media bindings and fresh configuration identities. `node scripts/cms-transfer/verify-root.mjs` independently checks final configuration, CMS previews, unrelated pre-existing record versions, and anonymous media hashes. The public page/form-schema check is recorded in the deployment evidence. Business form submission is deliberately excluded.

Checks: `node --test scripts/cms-transfer/runtime.test.mjs` and the seven package checks above. `enabledTemplates` is compared as a set; other scalar arrays retain their ordering requirements. Media identity includes content hash because names are not unique.

## Section wave 2A

`prepare_sections.py` compiles fresh native exports for Field Service, Snow Removal and its redirect page, plus the scoped downloaded media. It preserves template ownership and page permissions and emits no product/price writes. Its inputs are the private capture under `tmp/cms-stage-2a-source` and the stage-two catalogs; the durable deployable artifact is `docs/cms-migration/packages/sections-stage-2a-2026-11-17.zip`.

The deployment and verification entrypoints retain their original defaults, and accept `--package <extracted-package>` and `--run <private-journal-directory>` for the next approved wave. Target remains prod.servicewand.com. Video integrity uses the same `/stream/{name}` route as the page. Do not reuse one wave's journal for another package.

## Blog wave

Use `deploy-root.mjs --blog --preflight --package <directory> --run <journal-directory>` for read-only identity resolution. `--blog --apply` enables only blog, media and page/block save routes. It rejects user, form, workflow and domain writes, and validates the approved 77-post/60-enabled scope. Do not pass `held-requests.json` as the active request list.

Keep the journal directory for every retry. Media uploads run in groups of four with serialized atomic journal writes. Unknown save outcomes stop instead of blindly retrying. `--reconcile-media-absence` explicitly permits an interrupted media upload to be retried only after its attempt is at least two minutes old and two fresh matching-media searches return absent; reconciliation is recorded. Do not use it for ongoing uploads or uncertain catalog failures.

After applying, run `verify-root.mjs --package <directory> --run <journal-directory>` with the hidden API-key prompt, then `verify-blog-public.mjs <directory> <journal-directory>` for anonymous public-list and article-page checks. Credentials and deployment bindings stay outside the committed package.

For a completed media stage, `--resume-verified-media` reuses IDs from the existing journal instead of downloading all media again during deployment. A separate final anonymous hash verification remains required. `--reconcile-save-absence` is an explicit recovery mode for a failed create: after at least two minutes it rechecks absence on prod before retrying. It never retries updates or ambiguous matches. Keep the journal private and preserve it outside scratch space after deployment.

Blog collection mappings are `identifier` for writes (link-only associations) and `collection` for reads. Image references require `mediaType: image` on write; the API omits this discriminator from identifier reads, so verification compares target image IDs and the independently checked file hashes.
