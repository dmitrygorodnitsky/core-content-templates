# Kanban Board Importer for Trello Exports

This package contains Core script artifacts for importing Trello board export JSON files into Core service projects and tasks using generic Kanban naming.

## Files

- `KANBAN_BOARD_IMPORTER.java`
  - Core `Script.code`: `KANBAN_BOARD_IMPORTER`
  - `Script.language`: `Java`
  - `Script.organization`: `SYSTEM`
  - `Script.executable`: `true`
  - `Script.runInTx`: `false`
  - `Script.timeout`: use a large value for big board imports

- `KANBAN_BOARD_MAPPING_DEFAULT.json`
  - Core `Script.code`: `KANBAN_BOARD_MAPPING_DEFAULT`
  - `Script.language`: `JSON`
  - `Script.executable`: `false`
  - editable default mapping used by the importer

- `KANBAN_BOARD_SCRIPTS.save.body.json`
  - `SaveMappedRequest` body template for `/api/script/save.json`
  - contains script metadata, code, NLS, organization, category, and mappings
  - uses `contentFile` references; upload scripts read and inject the actual script content before POST

- `upload-kanban-board-scripts.ps1`
  - PowerShell example for saving/updating the Core script records

- `upload-kanban-board-scripts.sh`
  - Bash example for saving/updating the Core script records

## Upload Scripts To Core

Use a Core API key or bearer token with `P_SCRIPT_R` and `P_SCRIPT_W`. This is not the Atlassian/Trello API key. Atlassian credentials must be stored separately as an `AtlassianApi` Core secret.

PowerShell:

```powershell
.\upload-kanban-board-scripts.ps1 `
  -ApiKey "<CORE_API_KEY_OR_BEARER_TOKEN>" `
  -BaseUrl "https://lsrc.pixelnation.com/core" `
  -OrganizationCode "SYSTEM"
```

Bash:

```bash
API_KEY="<CORE_API_KEY_OR_BEARER_TOKEN>" \
BASE_URL="https://lsrc.pixelnation.com/core" \
ORGANIZATION_CODE="SYSTEM" \
./upload-kanban-board-scripts.sh
```

The upload scripts query `/api/script/list.json` by script code first. If a script exists, they inject its `id` into the save body and update it. If it does not exist, they create it.

## Runtime Functions

`KANBAN_BOARD_SCRIPTS.save.body.json` exposes all executable functions through `metadata.FUNCTIONS`: `exportBoard`, `prepareTemplate`, `importBoard`, and `revertImport`. `metadata.FUNCTION` is kept aligned with the default UI action, `exportBoard`.

## Source API Credentials

For Free Trello boards, use the normal REST API key and user token flow. Login method does not matter: if your Trello account uses "Login with Google", complete the same steps in a browser where that account is already logged in.

API keys are issued per Power-Up. The old developer key page:

```text
https://trello.com/app-key
```

currently points users to the per-Power-Up key flow rather than issuing a standalone key.

Create a small Power-Up entry and generate a key there:

1. Open `https://trello.com/power-ups/admin`.
2. Create a Power-Up such as `Core Kanban Exporter`.
3. Open the Power-Up and go to the `API Key` tab.
4. Generate or copy the API key.

Trello may not show a direct "generate token" link on the Power-Up API key screen. The workaround is to manually open the OAuth authorization URL for the Power-Up key. Replace `YOUR_API_KEY` with the Power-Up API key:

```text
https://trello.com/1/authorize?expiration=never&name=Core%20Kanban%20Exporter&scope=read&response_type=token&key=YOUR_API_KEY
```

Open that URL in a browser session where the Trello user is already logged in. This works for accounts that use "Login with Google" because Trello handles the Google login before showing the authorization page. Click `Allow`; Trello then displays the token as plain text in the browser. Copy that token and store it with the API key in Core as an `OrganizationSecret` or `UserSecret` of type `AtlassianApi`.

If you need to verify the token before storing it, call:

```text
https://api.trello.com/1/tokens/YOUR_TOKEN?key=YOUR_API_KEY&token=YOUR_TOKEN
```

The response should show the token identifier, member, permissions, and expiration. The exporter only needs read access to the target board and organization.

Expected secret attributes:

```json
{
  "API_KEY": "your Power-Up API key",
  "API_TOKEN": "the token returned by the authorization page"
}
```

Pass the secret id to the exporter as `sourceSecretId`. Do not pass API key or token directly in script function parameters, and do not store them in the JSON mapping script.

Export a board and its source assets into a Core media library:

```http
POST /api/script/KANBAN_BOARD_IMPORTER/exportBoard/exec-multipart.json
Content-Type: multipart/form-data

sourceBoardId = BOARD_ID_OR_SHORT_LINK
sourceSecretId = 123
organizationCode = SERVICEWAND
projectName = My Board
projectCode = MY_BOARD
mediaLibraryCode = MY_BOARD_MEDIA
includeActions = true
downloadBoardAssets = true
downloadAttachments = true
downloadExternalUrls = false
```

When `includeActions = true`, the exporter also calls the source card actions
endpoint for every card and merges missing `commentCard` actions into the saved
board JSON. The board-level actions endpoint can omit older card comments; the
per-card enrichment is required for repeatable `DialogUnit` imports.

Prepare or merge an editable mapping script:

```http
POST /api/script/KANBAN_BOARD_IMPORTER/prepareTemplate/exec-multipart.json
Content-Type: multipart/form-data

files = <trello-export.json>
mappingScriptCode = KANBAN_BOARD_MAPPING_MY_BOARD
boardMediaId = optional-export-json-media-id-instead-of-files
projectTypeCode = GENERIC_KANBAN
taskTypeCode = GENERIC_KANBAN_TASK
organizationCode = SERVICEWAND
overwrite = false
```

Import or synchronize a board:

```http
POST /api/script/KANBAN_BOARD_IMPORTER/importBoard/exec-multipart.json
Content-Type: multipart/form-data

files = <trello-export.json>
mappingScriptCode = KANBAN_BOARD_MAPPING_MY_BOARD
boardMediaId = optional-export-json-media-id-instead-of-files
projectName = My Board
projectCode = MY_BOARD
dryRun = false
downloadMedia = false
```

Revert an import:

```http
POST /api/script/KANBAN_BOARD_IMPORTER/revertImport/exec-multipart.json
Content-Type: multipart/form-data

projectCode = MY_BOARD
mediaLibraryCode = MY_BOARD_MEDIA
projectTypeCode = GENERIC_KANBAN
taskTypeCode = GENERIC_KANBAN_TASK
projectWorkflowCode = GENERIC_KANBAN_PROJECT_WORKFLOW
taskWorkflowCode = GENERIC_KANBAN_TASK_FLOW
deleteSharedDefinitions = false
force = false
dryRun = true
```

The script metadata exposes `revertImport` with these parameters:

| Parameter | Type | Required | Default | Purpose |
| --- | --- | --- | --- | --- |
| `projectCode` | `java.lang.String` | yes | none | Core project code created or synchronized by the import. Tasks under this project are removed before the project. |
| `mediaLibraryCode` | `java.lang.String` | no | `<projectCode>_MEDIA` | Core media library to delete with exported JSON and downloaded assets. |
| `projectTypeCode` | `java.lang.String` | no | `GENERIC_KANBAN` | ProjectType candidate for shared definition deletion. |
| `taskTypeCode` | `java.lang.String` | no | `GENERIC_KANBAN_TASK` | TaskType candidate for shared definition deletion. |
| `projectWorkflowCode` | `java.lang.String` | no | `GENERIC_KANBAN_PROJECT_WORKFLOW` | Project workflow candidate for shared definition deletion. |
| `taskWorkflowCode` | `java.lang.String` | no | `GENERIC_KANBAN_TASK_FLOW` | Task workflow candidate for shared definition deletion. |
| `deleteSharedDefinitions` | `java.lang.Boolean` | no | `false` | Delete ProjectType, TaskType, and workflow definitions after reference checks pass. |
| `force` | `java.lang.Boolean` | no | `false` | Delete requested shared definitions even if references remain. Use only in isolated import sandboxes. |
| `dryRun` | `java.lang.Boolean` | no | `true` | Return the deletion plan and reference counts without deleting anything. |
| `files` | `java.util.List` | no | none | Multipart runtime file list. This function does not use uploaded files. |

`revertImport` defaults to `dryRun = true`. It always scopes project/task deletion by `projectCode` and media cleanup by `mediaLibraryCode`. ProjectType, TaskType, and workflow deletion only runs when `deleteSharedDefinitions = true`; those definitions are skipped if other projects, tasks, or types still reference them. Use `force = true` only for isolated import sandboxes where deleting referenced definitions is intentional.

## Behavior

- Uses direct autowired Core managers/services, not Core REST calls from inside the JVM.
- `exportBoard` downloads the board JSON with the authenticated source API, downloads board-level visual assets and uploaded attachments through the authenticated attachment endpoint, and saves the JSON plus assets into the selected Core media library.
- The exported JSON is stored as a `MediaAsset`; uploaded source files are classified by Core as `Image`, `Video`, `Sound`, or `MediaAsset`.
- `exportBoard` returns `boardMediaId`; pass that value to `prepareTemplate` or `importBoard` as `boardMediaId` to reuse the saved JSON.
- Source API key/token are read from a Core `AtlassianApi` secret. Plaintext `sourceApiKey`, `apiKey`, `sourceApiToken`, or `apiToken` runtime parameters are rejected.
- `prepareTemplate` and `importBoard` can read the board JSON either from the uploaded multipart file or from `boardMediaId`/`sourceMediaId` returned by `exportBoard`.
- `importBoard` creates or updates `DialogUnit` entries from `commentCard` actions, converts comment Markdown to HTML when the mapping has `contentConversion.convertDialogMessagesToHtml = true`, assigns task permissions, and stores source action ids in metadata for synchronization.
- When `importBoard` receives `boardMediaId`, it defaults `downloadMedia` to `false` and reuses media in the project library by source attachment identity. Pass `downloadMedia = true` only when the JSON media asset was created without the attachment files.
- `prepareTemplate` creates or merges a `ScriptLanguage.JSON` mapping script.
- Existing mapping values are preserved during merge.
- Merge conflicts are returned as annotated text using comments like `// <= CONFLICT inferred: ...`.
- Conflict-annotated JSON is for review only and must not be used by `importBoard` until resolved.
- Task codes are generated as uppercase UUIDs.
- Source descriptions are converted from Markdown to HTML before being stored in Core NLS descriptions.
- External media URLs are downloaded outside database transactions into temporary files, then uploaded to the project-associated media library.
- Current workflow state is assigned through workflow events only. Historical transition reconstruction is out of scope.
- `revertImport` removes imported project tasks, the project, and media library assets. Shared type/workflow definitions are guarded by reference checks unless `force = true`.

## Core UI Requirement

The project type must expose a `TASK_TYPES` attribute:

```json
{
  "code": "TASK_TYPES",
  "className": "com.pixelnation.svc.domain.TaskType",
  "multiselect": true
}
```

The importer populates `project.attributes.<projectTypeId>.TASK_TYPES.value` with the imported task type id so Core UI can create and edit tasks under the project.
