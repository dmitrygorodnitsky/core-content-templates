package com.pixelnation.custom.script;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pixelnation.common.domain.AttributeOption;
import com.pixelnation.common.domain.EntityTypeAttribute;
import com.pixelnation.common.domain.Media;
import com.pixelnation.common.domain.MediaLibrary;
import com.pixelnation.common.domain.Organization;
import com.pixelnation.common.domain.OrganizationSecret;
import com.pixelnation.common.domain.Script;
import com.pixelnation.common.domain.Secret;
import com.pixelnation.common.domain.UserSecret;
import com.pixelnation.common.domain.User;
import com.pixelnation.common.domain.AbstractEntityType.AttributeGroup;
import com.pixelnation.common.domain.AbstractEntityType.AttributeOrder;
import com.pixelnation.common.exception.ApplicationException;
import com.pixelnation.common.persistence.iface.IMediaManager;
import com.pixelnation.common.persistence.iface.IMediaLibraryManager;
import com.pixelnation.common.persistence.iface.IOrganizationManager;
import com.pixelnation.common.persistence.iface.IOrganizationSecretManager;
import com.pixelnation.common.persistence.iface.ISecretManager;
import com.pixelnation.common.persistence.iface.IScriptManager;
import com.pixelnation.common.persistence.iface.IUserManager;
import com.pixelnation.common.persistence.iface.IUserSecretManager;
import com.pixelnation.common.process.media.IMediaProcessor;
import com.pixelnation.common.process.media.MediaProcessor;
import com.pixelnation.common.util.Auth;
import com.pixelnation.common.util.TransactionUtils;
import com.pixelnation.modules.workflow.domain.Workflow;
import com.pixelnation.modules.workflow.domain.WorkflowEvent;
import com.pixelnation.modules.workflow.domain.WorkflowState;
import com.pixelnation.modules.workflow.persistence.iface.IWorkflowManager;
import com.pixelnation.modules.workflow.process.WorkflowScriptGeneratorRegistry;
import com.pixelnation.modules.workflow.service.iface.IWorkflowService;
import com.pixelnation.svc.domain.Project;
import com.pixelnation.svc.domain.ProjectType;
import com.pixelnation.svc.domain.DialogUnit;
import com.pixelnation.svc.domain.Task;
import com.pixelnation.svc.domain.TaskType;
import com.pixelnation.svc.persistence.iface.IDialogUnitManager;
import com.pixelnation.svc.persistence.iface.IProjectManager;
import com.pixelnation.svc.persistence.iface.IProjectTypeManager;
import com.pixelnation.svc.persistence.iface.ITaskManager;
import com.pixelnation.svc.persistence.iface.ITaskTypeManager;

/**
 * Core Java script that exports an external board source, prepares a declarative
 * Kanban mapping script, and imports or synchronizes that board into Core service
 * entities.
 *
 * <p>
 * This source is intended to be installed as a trusted Core {@link Script} with:
 * </p>
 *
 * <ul>
 * <li>{@code code = KANBAN_BOARD_IMPORTER}</li>
 * <li>{@code language = Java}</li>
 * <li>{@code organization = SYSTEM}</li>
 * <li>{@code capability = CORE-SVC}</li>
 * </ul>
 *
 * <p>
 * The class name must remain {@code MAIN_CLASS}. Core's Java script runtime
 * replaces this placeholder with a generated class name before compilation. This
 * convention allows the same Java source file to be stored as script content and
 * compiled dynamically by Core.
 * </p>
 *
 * <p>
 * The script deliberately uses generic Kanban terminology for Core artifacts.
 * Source-specific names and trademarks are limited to source metadata and API
 * interaction. The generated Core artifacts use generic codes such as
 * {@code GENERIC_KANBAN}, {@code GENERIC_KANBAN_TASK},
 * {@code GENERIC_KANBAN_PROJECT_WORKFLOW}, and
 * {@code GENERIC_KANBAN_TASK_FLOW}.
 * </p>
 *
 * <p>
 * Credentials are not accepted as public function arguments. The source API key
 * and token must be stored in Core as an {@link OrganizationSecret} or
 * {@link UserSecret} whose {@link Secret} type code is {@code AtlassianApi}. The
 * expected secret attributes are {@code API_KEY} and {@code API_TOKEN}. This keeps
 * source credentials out of script execution logs, mapping scripts, and external
 * automation payloads.
 * </p>
 *
 * <p>
     * The importer is split into four public script functions:
 * </p>
 *
 * <ul>
 * <li>{@link #exportBoard(String, Integer, String, String, String, String, Boolean, Boolean, Boolean, Boolean, List)}
 * downloads the board JSON and source assets into a Core media library.</li>
 * <li>{@link #prepareTemplate(String, String, String, String, String, String, Boolean, List)}
 * reads a board export and creates or merges a JSON mapping script that can be
 * reviewed and edited by an administrator.</li>
     * <li>{@link #importBoard(String, String, String, String, String, Boolean, Boolean, List)}
     * applies the mapping script to create or synchronize Core project, task, type,
     * workflow, user, and media data.</li>
     * <li>{@link #revertImport(String, String, String, String, String, String, Boolean, Boolean, Boolean, List)}
     * removes imported Core project/tasks/media and, when requested, shared Kanban
     * type and workflow definitions after reference checks pass.</li>
     * </ul>
 *
 * <p>
 * The mapping script is the extension point for community integrations. It
 * describes how source board fields map to Core fixed fields, typed attributes,
 * workflows, workflow states, workflow events, media handling, synchronization
 * identity, and validation policy. If a configured Core project type, task type,
 * or workflow already exists, this importer validates that the mapping agrees
 * with the existing Core metadata. If a configured type or workflow does not
 * exist and {@code createIfMissing} is enabled, the importer creates it from the
 * mapping definition.
 * </p>
 *
 * <p>
 * Source images and attachments are staged in temporary files outside the import
 * transaction, then saved into the target Core media library. Entity rows are
 * updated with Core media identifiers after media persistence succeeds. Markdown
 * source descriptions are converted to HTML before being stored in Core NLS
 * description fields.
 * </p>
 *
 * <p>
 * Synchronization identity is stored as hidden typed attributes on the imported
 * Core entities. Board identity is stored on the project, card identity is stored
 * on each task, and list identity is stored as a task attribute. This avoids a
 * separate import-link entity while still allowing repeat imports to update
 * existing Core records instead of creating duplicates.
 * </p>
 */
public class MAIN_CLASS {
    private static final String DEFAULT_MAPPING_CODE = "KANBAN_BOARD_MAPPING_DEFAULT";
    private static final String DEFAULT_PROJECT_TYPE = "GENERIC_KANBAN";
    private static final String DEFAULT_TASK_TYPE = "GENERIC_KANBAN_TASK";
    private static final String DEFAULT_PROJECT_WORKFLOW = "GENERIC_KANBAN_PROJECT_WORKFLOW";
    private static final String DEFAULT_TASK_WORKFLOW = "GENERIC_KANBAN_TASK_FLOW";
    private static final String ATTR_TASK_TYPES = "TASK_TYPES";
    private static final String ATTR_BOARD_ID = "KANBAN_SOURCE_BOARD_ID";
    private static final String ATTR_CARD_ID = "KANBAN_SOURCE_CARD_ID";
    private static final String ATTR_LIST_ID = "KANBAN_SOURCE_LIST_ID";
    private static final String ATTR_UPDATED_AT = "KANBAN_SOURCE_UPDATED_AT";
    private static final String ATTR_BOARD_MEMBERS = "KANBAN_BOARD_MEMBERS";
    private static final String ATTR_LABELS = "KANBAN_LABELS";
    private static final String ATTR_CHECKLISTS = "KANBAN_CHECKLISTS";
    private static final String ATTR_ATTACHMENTS = "KANBAN_ATTACHMENTS";
    private static final String ATTR_DUE = "KANBAN_DUE";
    private static final String ATTR_START = "KANBAN_START";
    private static final String ATTR_DUE_COMPLETE = "KANBAN_DUE_COMPLETE";
    private static final String ATTR_CLOSED = "KANBAN_CLOSED";
    private static final String SECRET_TYPE_ATLASSIAN_API = "AtlassianApi";
    private static final String SECRET_API_KEY = "API_KEY";
    private static final String SECRET_API_TOKEN = "API_TOKEN";
    private static final int MAX_DOWNLOAD_BYTES = 250 * 1024 * 1024;

    private final ObjectMapper mapper = new ObjectMapper()
            .enable(SerializationFeature.INDENT_OUTPUT)
            .configure(JsonParser.Feature.ALLOW_COMMENTS, true);

    @Autowired
    private IScriptManager scriptManager;
    @Autowired
    private IOrganizationManager organizationManager;
    @Autowired
    private IUserManager userManager;
    @Autowired
    private ISecretManager secretManager;
    @Autowired
    private IOrganizationSecretManager organizationSecretManager;
    @Autowired
    private IUserSecretManager userSecretManager;
    @Autowired
    private IMediaManager mediaManager;
    @Autowired
    private IMediaLibraryManager mediaLibraryManager;
    @Autowired
    private IWorkflowManager workflowManager;
    @Autowired
    private IWorkflowService workflowService;
    @Autowired
    private WorkflowScriptGeneratorRegistry workflowScriptGeneratorRegistry;
    @Autowired
    private IProjectTypeManager projectTypeManager;
    @Autowired
    private ITaskTypeManager taskTypeManager;
    @Autowired
    private IProjectManager projectManager;
    @Autowired
    private ITaskManager taskManager;
    @Autowired
    private IDialogUnitManager dialogUnitManager;
    @Autowired
    private TransactionUtils tx;

    /**
     * Downloads a source board export and its referenced assets into a Core media
     * library.
     *
     * <p>
     * This function is the preferred first step for boards whose attachments are
     * not publicly downloadable. It calls the source REST API with credentials from
     * an {@code AtlassianApi} Core secret, downloads the board JSON, optionally
     * downloads board-level visual assets, and downloads uploaded card attachments
     * through authenticated attachment endpoints. The resulting JSON and media
     * files are stored as Core media records in the selected media library.
     * </p>
     *
     * <p>
     * The returned {@code boardMediaId} should be passed to
     * {@link #prepareTemplate(String, String, String, String, String, String, Boolean, List)}
     * and
     * {@link #importBoard(String, String, String, String, String, Boolean, Boolean, List)}
     * so later steps can reuse the exact exported JSON without calling the source
     * API again. When this function successfully downloads attachments, later
     * imports can usually run with {@code downloadMedia = false}; the importer will
     * reuse the media already saved into the project media library.
     * </p>
     *
     * @param sourceBoardId
     *            source board id or short link accepted by the source board API.
     * @param sourceSecretId
     *            id of an {@link OrganizationSecret} or {@link UserSecret} of type
     *            {@code AtlassianApi}; the secret must contain {@code API_KEY} and
     *            {@code API_TOKEN}.
     * @param organizationCode
     *            Core organization code used to resolve the secret and own the media
     *            library; defaults to the current runtime organization when blank.
     * @param projectName
     *            optional Core project display name; when blank, the source board
     *            name is used.
     * @param projectCode
     *            optional Core project code seed; when blank, a code is derived from
     *            the project or board name.
     * @param mediaLibraryCode
     *            Core media library code where the exported JSON and media files are
     *            saved; when blank, {@code <projectCode>_MEDIA} is used.
     * @param includeActions
     *            whether source board actions should be included in the exported
     *            JSON. Actions can improve later synchronization and audit analysis,
     *            but make the JSON larger.
     * @param downloadBoardAssets
     *            whether board-level visual assets such as backgrounds should be
     *            downloaded into the media library.
     * @param downloadAttachments
     *            whether card attachments should be downloaded through authenticated
     *            source API attachment URLs.
     * @param downloadExternalUrls
     *            whether non-uploaded external attachment URLs should also be
     *            downloaded. This is disabled by default because external URLs may
     *            be large, unstable, or unrelated to the source API credential.
     * @param files
     *            multipart upload file list supplied by Core's script endpoint. This
     *            function does not require an uploaded file, but the parameter is
     *            kept in the signature for endpoint consistency.
     * @return structured status containing source board id/name, saved board media
     *         id, media library id/code, created counters, saved media summaries,
     *         warnings, and a source board summary.
     * @throws Exception
     *             when credentials, source access, media persistence, or Core
     *             transaction processing fails.
     */
    public Map<String, Object> exportBoard(String sourceBoardId, Integer sourceSecretId, String organizationCode,
            String projectName, String projectCode, String mediaLibraryCode, Boolean includeActions,
            Boolean downloadBoardAssets, Boolean downloadAttachments, Boolean downloadExternalUrls,
            List<String> files) throws Exception {
        Map<String, Object> parsedArgs = args(
                "sourceBoardId", sourceBoardId,
                "sourceSecretId", sourceSecretId,
                "organizationCode", organizationCode,
                "projectName", projectName,
                "projectCode", projectCode,
                "mediaLibraryCode", mediaLibraryCode,
                "includeActions", includeActions,
                "downloadBoardAssets", downloadBoardAssets,
                "downloadAttachments", downloadAttachments,
                "downloadExternalUrls", downloadExternalUrls);
        String boardId = firstNonBlank(stringArg(parsedArgs, "sourceBoardId", null), stringArg(parsedArgs, "boardId", null));
        organizationCode = stringArg(parsedArgs, "organizationCode", defaultOrganizationCode());
        boolean effectiveIncludeActions = booleanArg(parsedArgs, "includeActions", true);
        boolean effectiveDownloadAttachments = booleanArg(parsedArgs, "downloadAttachments", true);
        boolean effectiveDownloadBoardAssets = booleanArg(parsedArgs, "downloadBoardAssets", true);
        boolean effectiveDownloadExternalUrls = booleanArg(parsedArgs, "downloadExternalUrls", false);

        if (blank(boardId)) {
            throw new ApplicationException("sourceBoardId is required");
        }
        AtlassianCredentials credentials = resolveAtlassianCredentials(parsedArgs, organizationCode);

        Path dir = Files.createTempDirectory("kanban-source-export-");
        Path boardFile = dir.resolve(safeFileName(boardId) + "-board.json");
        List<StagedMedia> stagedMedia = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        try {
            JsonNode board = fetchBoardExport(boardId, credentials.apiKey(), credentials.apiToken(), effectiveIncludeActions, warnings);
            projectName = stringArg(parsedArgs, "projectName", boardName(board));
            projectCode = stringArg(parsedArgs, "projectCode", code(projectName));
            mediaLibraryCode = stringArg(parsedArgs, "mediaLibraryCode", projectCode + "_MEDIA");
            String resolvedOrganizationCode = organizationCode;
            String resolvedProjectCode = projectCode;
            String resolvedMediaLibraryCode = mediaLibraryCode;

            Files.writeString(boardFile, writeJson(board), StandardCharsets.UTF_8);
            stagedMedia.add(new StagedMedia(null, text(board, "id"), sourceBoardRef(text(board, "id")), safeFileName(resolvedProjectCode + "-board-export.json"), boardFile));

            if (effectiveDownloadBoardAssets) {
                stagedMedia.addAll(stageBoardAssets(board, dir, warnings));
            }
            if (effectiveDownloadAttachments) {
                stagedMedia.addAll(stageAuthenticatedAttachments(board, credentials.apiKey(), credentials.apiToken(), effectiveDownloadExternalUrls, dir, warnings));
            }

            List<StagedMedia> staged = stagedMedia;
            return tx.getInNewTxRW(() -> {
                try {
                    Organization organization = resolveOrganization(resolvedOrganizationCode);
                    ResultCounter created = new ResultCounter();
                    MediaLibrary library = ensureMediaLibrary(resolvedMediaLibraryCode, organization, nls(resolvedMediaLibraryCode, "Kanban exported source assets"), created);
                    List<String> allWarnings = new ArrayList<>(warnings);
                    Map<String, List<Map<String, Object>>> savedByCard = saveExportedMedia(staged, library, created, allWarnings);
                    String boardMediaId = findSavedBoardMediaId(savedByCard, text(board, "id"));
                    return orderedMap(
                            "boardId", text(board, "id"),
                            "boardName", boardName(board),
                            "boardMediaId", boardMediaId,
                            "sourceSecretId", credentials.secretId(),
                            "projectCode", resolvedProjectCode,
                            "mediaLibraryId", library.getId(),
                            "mediaLibraryCode", library.getCode(),
                            "created", created.values,
                            "savedMedia", savedByCard,
                            "warnings", allWarnings,
                            "summary", boardSummary(board));
                } catch (RuntimeException e) {
                    throw e;
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });
        } finally {
            for (StagedMedia media : stagedMedia) {
                media.deleteQuietly();
            }
        }
    }

    /**
     * Creates or updates a JSON mapping script from a source board export.
     *
     * <p>
     * This function reads the source board JSON either from {@code boardMediaId},
     * {@code sourceMediaId}, or an uploaded multipart JSON file. It then infers a
     * candidate mapping that describes Core project type, task type, project
     * workflow, task workflow, typed attributes, fixed-field mappings, media
     * behavior, synchronization identity, and ignored source fields.
     * </p>
     *
     * <p>
     * If the target mapping script does not exist, the function creates a
     * {@link Script.ScriptLanguage#JSON} script owned by the requested Core
     * organization. If the mapping script already exists and {@code overwrite} is
     * false, the existing user-edited mapping is merged with the inferred candidate:
     * existing values are preserved, inferred additions are inserted, and conflicts
     * are returned in {@code annotatedContent} with comments such as
     * {@code <= CONFLICT}. Conflict-annotated content is for review only and should
     * not be passed to {@link #importBoard(String, String, String, String, String, Boolean, Boolean, List)}
     * until resolved.
     * </p>
     *
     * <p>
     * The generated mapping is intentionally declarative so community developers
     * can reuse the importer pattern for other board systems. Integration-specific
     * code should produce a mapping with the same Core concepts: type definitions,
     * workflow definitions, state/event definitions, field mappings, media mapping,
     * sync identity, and validation policy.
     * </p>
     *
     * @param mappingScriptCode
     *            code of the JSON mapping script to create or update. When blank, a
     *            code is derived from the source board name.
     * @param boardMediaId
     *            optional Core media id returned by {@link #exportBoard}; this media
     *            record should contain the source board JSON.
     * @param sourceMediaId
     *            legacy alias for {@code boardMediaId}; used when callers keep
     *            generic source-media terminology.
     * @param projectTypeCode
     *            Core {@link ProjectType} code to align with. If the type exists,
     *            its attributes are assumed to be authoritative and later import
     *            validation must match them. If it does not exist, the generated
     *            mapping includes a create-if-missing definition.
     * @param taskTypeCode
     *            Core {@link TaskType} code to align with. Existing task types are
     *            validated during import; missing task types can be created from the
     *            mapping definition.
     * @param organizationCode
     *            Core organization code for the mapping script and generated Core
     *            entities; defaults to the current runtime organization when blank.
     * @param overwrite
     *            when true, replaces existing mapping script content with the newly
     *            inferred mapping. When false, merges inferred content into the
     *            existing mapping and reports conflicts.
     * @param files
     *            multipart uploaded files. If no media id is supplied, the first
     *            uploaded JSON file is used as the source board export.
     * @return structured status containing mapping script id/code, create/update
     *         flags, conflict details, optional annotated conflict content, final
     *         JSON content, type-existence hints, board summary, and warnings.
     * @throws Exception
     *             when the source JSON cannot be read, the mapping cannot be parsed,
     *             or the Core script record cannot be saved.
     */
    public Map<String, Object> prepareTemplate(String mappingScriptCode, String boardMediaId, String sourceMediaId,
            String projectTypeCode, String taskTypeCode, String organizationCode, Boolean overwrite,
            List<String> files) throws Exception {
        Map<String, Object> parsedArgs = args(
                "mappingScriptCode", mappingScriptCode,
                "boardMediaId", boardMediaId,
                "sourceMediaId", sourceMediaId,
                "projectTypeCode", projectTypeCode,
                "taskTypeCode", taskTypeCode,
                "organizationCode", organizationCode,
                "overwrite", overwrite);
        JsonNode board = readBoardSource(parsedArgs, files);
        mappingScriptCode = stringArg(parsedArgs, "mappingScriptCode", derivedMappingCode(board));
        projectTypeCode = stringArg(parsedArgs, "projectTypeCode", DEFAULT_PROJECT_TYPE);
        taskTypeCode = stringArg(parsedArgs, "taskTypeCode", DEFAULT_TASK_TYPE);
        organizationCode = stringArg(parsedArgs, "organizationCode", defaultOrganizationCode());
        boolean effectiveOverwrite = booleanArg(parsedArgs, "overwrite", false);

        ObjectNode inferred = inferMapping(board, mappingScriptCode, projectTypeCode, taskTypeCode, organizationCode);
        String effectiveMappingScriptCode = mappingScriptCode;
        String effectiveProjectTypeCode = projectTypeCode;
        String effectiveTaskTypeCode = taskTypeCode;
        String effectiveOrganizationCode = organizationCode;
        return tx.getInNewTxRW(() -> {
            try {
                Script existing = scriptManager.getByCodeAndLanguage(effectiveMappingScriptCode, Script.ScriptLanguage.JSON);

                List<Map<String, Object>> conflicts = new ArrayList<>();
                ObjectNode finalMapping = inferred;
                boolean created = false;
                boolean updated = false;
                String annotated = null;

                if (existing == null) {
                    Script script = new Script();
                    script.setCode(effectiveMappingScriptCode);
                    script.setLanguage(Script.ScriptLanguage.JSON);
                    script.setReadonly(false);
                    script.setPredefined(false);
                    script.setOrganization(resolveOrganization(effectiveOrganizationCode));
                    script.setNls(nls(boardName(board) + " Kanban Import Mapping", boardDescriptionSummary(board)));
                    script.setContent(writeJson(inferred));
                    script.setMetadata(Map.of("source", "KANBAN_BOARD_EXPORT", "generatedBy", "KANBAN_BOARD_IMPORTER.prepareTemplate"));
                    existing = scriptManager.save(script);
                    created = true;
                } else if (effectiveOverwrite) {
                    existing.setContent(writeJson(inferred));
                    existing.setNls(nls(boardName(board) + " Kanban Import Mapping", boardDescriptionSummary(board)));
                    scriptManager.update(existing);
                    updated = true;
                } else {
                    ObjectNode current = readObject(existing.getContent());
                    MergeResult merge = mergeMapping(current, inferred, "");
                    finalMapping = merge.merged();
                    conflicts.addAll(merge.conflicts());
                    if (conflicts.isEmpty()) {
                        existing.setContent(writeJson(finalMapping));
                        scriptManager.update(existing);
                        updated = true;
                    } else {
                        annotated = annotateConflicts(finalMapping, conflicts);
                    }
                }

                return orderedMap(
                        "mappingScriptId", existing.getId(),
                        "mappingScriptCode", effectiveMappingScriptCode,
                        "created", created,
                        "updated", updated,
                        "hasConflicts", !conflicts.isEmpty(),
                        "conflicts", conflicts,
                        "annotatedContent", annotated,
                        "content", writeJson(finalMapping),
                        "boardName", boardName(board),
                        "projectType", Map.of("code", effectiveProjectTypeCode, "exists", projectTypeManager.getByCode(effectiveProjectTypeCode) != null),
                        "taskType", Map.of("code", effectiveTaskTypeCode, "exists", taskTypeManager.getByCode(effectiveTaskTypeCode) != null),
                        "summary", boardSummary(board),
                        "warnings", List.of());
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    /**
     * Imports or synchronizes a source board into Core using a JSON mapping script.
     *
     * <p>
     * This function reads the source board JSON, loads the mapping script, validates
     * that the mapping has no unresolved conflict comments, builds an import plan,
     * and either returns a dry-run report or applies the import in a Core
     * transaction. The import creates or reuses Core project type, task type,
     * project workflow, task workflow, media library, users, project, and tasks
     * according to the mapping.
     * </p>
     *
     * <p>
     * Synchronization is based on hidden typed attributes that store source board,
     * card, and list identities. If a project with the source board identity or
     * project code already exists, it is updated. If a task with the source card
     * identity already exists in the project, it is updated. Missing source cards
     * can be archived according to the mapping's sync policy. Task codes for newly
     * created tasks are generated as uppercase UUID strings.
     * </p>
     *
     * <p>
     * Workflow state is assigned by invoking workflow events rather than directly
     * writing state collections. The task workflow is generated from source lists
     * when needed, with each list represented as a workflow state and movement
     * events generated between allowed states. Transition history reconstruction is
     * intentionally out of scope for this function; it assigns the current state
     * only.
     * </p>
     *
     * <p>
     * Media import follows the mapping configuration. When {@code boardMediaId} or
     * {@code sourceMediaId} points to an export created by
     * {@link #exportBoard(String, Integer, String, String, String, String, Boolean, Boolean, Boolean, Boolean, List)},
     * {@code downloadMedia} normally defaults to false and previously saved media is
     * reused. When importing from a plain uploaded JSON file, {@code downloadMedia}
     * can be enabled so external media URLs are downloaded into temporary files
     * outside the import transaction and then saved into the target media library.
     * </p>
     *
     * @param mappingScriptCode
     *            code of the JSON mapping script produced by
     *            {@link #prepareTemplate(String, String, String, String, String, String, Boolean, List)}
     *            or supplied by an integration developer.
     * @param boardMediaId
     *            optional Core media id containing the source board JSON, usually
     *            returned by {@link #exportBoard}.
     * @param sourceMediaId
     *            legacy alias for {@code boardMediaId}; used by generic importer
     *            callers.
     * @param projectName
     *            Core project name to create or update. When blank, the source board
     *            name is used.
     * @param projectCode
     *            Core project code to create or update. When blank, a code is
     *            derived from {@code projectName} or the source board name.
     * @param dryRun
     *            when true, validates inputs and returns the import plan without
     *            creating or updating Core entities.
     * @param downloadMedia
     *            overrides mapping media download behavior. Use false when importing
     *            from media created by {@code exportBoard}; use true when importing
     *            from raw JSON and the media URLs should be fetched during import.
     * @param files
     *            multipart uploaded files. If no media id is supplied, the first
     *            uploaded JSON file is used as the source board export.
     * @return for dry runs, an import plan with counts and reuse/create estimates;
     *         for real imports, a structured result with project id/code, import or
     *         sync mode, created/updated/archived counters, warnings, and errors.
     * @throws Exception
     *             when source data cannot be read, the mapping is invalid, strict
     *             validation fails, required Core metadata is missing, or Core
     *             persistence/workflow processing fails.
     */
    public Map<String, Object> importBoard(String mappingScriptCode, String boardMediaId, String sourceMediaId,
            String projectName, String projectCode, Boolean dryRun, Boolean downloadMedia,
            List<String> files) throws Exception {
        Map<String, Object> parsedArgs = args(
                "mappingScriptCode", mappingScriptCode,
                "boardMediaId", boardMediaId,
                "sourceMediaId", sourceMediaId,
                "projectName", projectName,
                "projectCode", projectCode,
                "dryRun", dryRun,
                "downloadMedia", downloadMedia);
        JsonNode board = readBoardSource(parsedArgs, files);
        mappingScriptCode = stringArg(parsedArgs, "mappingScriptCode", DEFAULT_MAPPING_CODE);
        projectName = stringArg(parsedArgs, "projectName", boardName(board));
        projectCode = stringArg(parsedArgs, "projectCode", code(projectName));
        boolean effectiveDryRun = booleanArg(parsedArgs, "dryRun", false);

        Script mappingScript = scriptManager.getByCodeAndLanguage(mappingScriptCode, Script.ScriptLanguage.JSON);
        if (mappingScript == null) {
            throw new ApplicationException("Mapping script not found: {}", mappingScriptCode);
        }
        ObjectNode mapping = readObject(mappingScript.getContent());
        validateNoConflictComments(mappingScript.getContent(), mappingScriptCode);

        ImportPlan plan = buildImportPlan(board, mapping, projectName, projectCode);
        boolean hasBoardMediaId = !blank(firstNonBlank(stringArg(parsedArgs, "boardMediaId", null), stringArg(parsedArgs, "sourceMediaId", null)));
        plan.downloadMedia = booleanArg(parsedArgs, "downloadMedia", hasBoardMediaId ? false : plan.downloadMedia);
        if (effectiveDryRun) {
            return plan.asDryRunResult();
        }

        List<StagedMedia> stagedMedia = List.of();
        if (plan.downloadMedia) {
            stagedMedia = stageExternalMedia(board, plan);
        }

        try {
            List<StagedMedia> staged = stagedMedia;
            Map<String, Object> result = tx.getInNewTxRW(() -> {
                try {
                    return executeImport(board, mapping, plan, staged);
                } catch (RuntimeException e) {
                    throw importFailure(e);
                } catch (Exception e) {
                    throw importFailure(e);
                }
            });
            Map<String, Object> dialogResult = tx.getInNewTxRW(() -> executeDialogUnitImport(board, mapping, plan));
            mergeExecutionResult(result, dialogResult);
            return result;
        } finally {
            for (StagedMedia media : stagedMedia) {
                media.deleteQuietly();
            }
        }
    }

    /**
     * Removes Core artifacts created by a Kanban import.
     *
     * <p>
     * The function is intentionally destructive and therefore defaults to
     * {@code dryRun = true}. In dry-run mode it returns the artifacts that would be
     * deleted and any definitions that would be skipped because they are still
     * referenced. In execution mode it deletes the imported project tasks, the
     * imported project, optional project/task type and workflow definitions, and the
     * media library with all media assets stored under it.
     * </p>
     *
     * <p>
     * Project and task rows are always scoped by {@code projectCode}. Shared
     * definitions such as {@code GENERIC_KANBAN}, {@code GENERIC_KANBAN_TASK}, and
     * generic workflows are removed only when {@code deleteSharedDefinitions} is
     * true and no remaining project/task/type references exist. Set {@code force}
     * to true only when the caller intentionally wants to remove those definitions
     * even if other Core objects still reference them.
     * </p>
     *
     * @param projectCode
     *            Core project code to remove. This is the primary import identity
     *            for tasks and the project.
     * @param mediaLibraryCode
     *            Core media library code to delete with its assets. When blank,
     *            {@code <projectCode>_MEDIA} is used.
     * @param projectTypeCode
     *            optional ProjectType code to delete when definition deletion is
     *            enabled.
     * @param taskTypeCode
     *            optional TaskType code to delete when definition deletion is
     *            enabled.
     * @param projectWorkflowCode
     *            optional project Workflow code to delete when definition deletion
     *            is enabled.
     * @param taskWorkflowCode
     *            optional task Workflow code to delete when definition deletion is
     *            enabled.
     * @param deleteSharedDefinitions
     *            when true, delete project/task types and workflows after verifying
     *            they are no longer referenced.
     * @param force
     *            when true, delete definitions even if references remain. Use only
     *            for controlled cleanup of an isolated import sandbox.
     * @param dryRun
     *            when true, report what would be deleted without deleting anything.
     * @param files
     *            unused multipart parameter kept for runtime signature consistency.
     * @return structured deletion plan or deletion result with counters, skipped
     *         definitions, and warnings.
     */
    public Map<String, Object> revertImport(String projectCode, String mediaLibraryCode, String projectTypeCode,
            String taskTypeCode, String projectWorkflowCode, String taskWorkflowCode, Boolean deleteSharedDefinitions,
            Boolean force, Boolean dryRun, List<String> files) {
        Map<String, Object> parsedArgs = args(
                "projectCode", projectCode,
                "mediaLibraryCode", mediaLibraryCode,
                "projectTypeCode", projectTypeCode,
                "taskTypeCode", taskTypeCode,
                "projectWorkflowCode", projectWorkflowCode,
                "taskWorkflowCode", taskWorkflowCode,
                "deleteSharedDefinitions", deleteSharedDefinitions,
                "force", force,
                "dryRun", dryRun);
        String effectiveProjectCode = stringArg(parsedArgs, "projectCode", "");
        if (blank(effectiveProjectCode)) {
            throw new ApplicationException("projectCode is required for Kanban import revert");
        }
        String effectiveMediaLibraryCode = stringArg(parsedArgs, "mediaLibraryCode", effectiveProjectCode + "_MEDIA");
        String effectiveProjectTypeCode = stringArg(parsedArgs, "projectTypeCode", DEFAULT_PROJECT_TYPE);
        String effectiveTaskTypeCode = stringArg(parsedArgs, "taskTypeCode", DEFAULT_TASK_TYPE);
        String effectiveProjectWorkflowCode = stringArg(parsedArgs, "projectWorkflowCode", DEFAULT_PROJECT_WORKFLOW);
        String effectiveTaskWorkflowCode = stringArg(parsedArgs, "taskWorkflowCode", DEFAULT_TASK_WORKFLOW);
        boolean effectiveDeleteDefinitions = booleanArg(parsedArgs, "deleteSharedDefinitions", false);
        boolean effectiveForce = booleanArg(parsedArgs, "force", false);
        boolean effectiveDryRun = booleanArg(parsedArgs, "dryRun", true);

        return tx.getInNewTxRW(() -> executeRevert(
                effectiveProjectCode,
                effectiveMediaLibraryCode,
                effectiveProjectTypeCode,
                effectiveTaskTypeCode,
                effectiveProjectWorkflowCode,
                effectiveTaskWorkflowCode,
                effectiveDeleteDefinitions,
                effectiveForce,
                effectiveDryRun));
    }

    private RuntimeException importFailure(Throwable e) {
        StackTraceElement[] stack = e.getStackTrace();
        String location = stack.length == 0 ? "unknown location" : stack[0].toString();
        return new ApplicationException("Kanban import failed: " + e.getClass().getName() + " at " + location
                + ". Message: " + firstNonBlank(e.getMessage(), e.toString()), e);
    }

    private Map<String, Object> executeImport(JsonNode board, ObjectNode mapping, ImportPlan plan, List<StagedMedia> stagedMedia) throws Exception {
        ResultCounter created = new ResultCounter();
        ResultCounter updated = new ResultCounter();
        ResultCounter archived = new ResultCounter();
        List<String> warnings = new ArrayList<>();

        Organization organization = resolveOrganization(plan.organizationCode);
        ProjectType projectType = ensureProjectType(mapping, organization, created, updated);
        TaskType taskType = ensureTaskType(mapping, organization, created, updated);
        Workflow projectWorkflow = ensureWorkflow((ObjectNode) mapping.path("projectWorkflow"), Project.class.getName(), organization, created);
        Workflow taskWorkflow = ensureTaskWorkflow(mapping, board, organization, created);
        assignProjectTypeWorkflow(projectType, projectWorkflow, updated);
        assignTaskTypeWorkflow(taskType, taskWorkflow, updated);

        MediaLibrary library = ensureMediaLibrary(mapping, organization, plan.projectCode, created);
        Map<String, List<String>> sourceMediaIds = findSourceMediaInLibrary(board, library);
        mergeMediaIds(sourceMediaIds, saveStagedMedia(stagedMedia, library, created, warnings));
        Map<String, String> mediaTypesById = mediaTypesById(sourceMediaIds);

        Map<String, User> usersBySourceId = resolveUsers(board, organization, warnings, created);
        Project project = ensureProject(board, plan, organization, projectType, projectWorkflow, taskType, usersBySourceId, created, updated);

        Map<String, WorkflowState> taskStates = taskWorkflow.getStates().stream()
                .collect(Collectors.toMap(WorkflowState::getCode, s -> s, (a, b) -> a, LinkedHashMap::new));
        Map<String, String> listIdToState = listIdToStateCode(board);
        Set<String> seenCardSourceIds = new HashSet<>();
        Map<String, Task> tasksBySourceId = tasksBySourceId(project);
        for (JsonNode card : array(board, "cards")) {
            String sourceCardId = text(card, "id");
            if (blank(sourceCardId)) {
                warnings.add("Skipped card without source id: " + text(card, "name"));
                continue;
            }
            seenCardSourceIds.add(sourceCardId);
            String targetState = Boolean.TRUE.equals(bool(card, "closed"))
                    ? "ARCHIVED"
                    : listIdToState.getOrDefault(text(card, "idList"), "INITIAL");
            Task task = ensureTask(card, board, plan, project, taskType, taskWorkflow, sourceMediaIds, mediaTypesById, tasksBySourceId, created, updated);
            transitionTask(task, taskWorkflow, targetState, warnings);
            if ("ARCHIVED".equals(targetState)) {
                archived.inc("tasks");
            }
        }

        archiveMissingTasks(project, taskWorkflow, seenCardSourceIds, plan, archived, warnings, tasksBySourceId.values());
        transitionProject(project, projectWorkflow, Boolean.TRUE.equals(bool(board, "closed")) ? "ARCHIVED" : "ACTIVE", warnings);

        return orderedMap(
                "projectId", project.getId(),
                "projectCode", project.getCode(),
                "mode", created.get("projects") > 0 ? "IMPORT" : "SYNC",
                "created", created.values,
                "updated", updated.values,
                "archived", archived.values,
                "warnings", warnings,
                "errors", List.of());
    }

    private Map<String, Object> executeDialogUnitImport(JsonNode board, ObjectNode mapping, ImportPlan plan) {
        ResultCounter created = new ResultCounter();
        ResultCounter updated = new ResultCounter();
        List<String> warnings = new ArrayList<>();
        Project project = findProjectByCode(plan.projectCode);
        if (project == null) {
            warnings.add("Skipped comment import because project was not found: " + plan.projectCode);
            return orderedMap("created", created.values, "updated", updated.values, "warnings", warnings);
        }
        Organization organization = resolveOrganization(plan.organizationCode);
        Map<String, User> usersBySourceId = resolveUsers(board, organization, warnings, created);
        User systemUser = userManager.getSystemUser();
        Map<String, Task> tasksBySourceId = tasksBySourceId(project);
        Map<String, Long> dialogUnitIdsBySourceActionId = dialogUnitIdsBySourceActionId(project);
        for (JsonNode card : array(board, "cards")) {
            Task task = tasksBySourceId.get(text(card, "id"));
            if (task == null) {
                continue;
            }
            ensureDialogUnits(card, board, mapping, task, usersBySourceId, systemUser, dialogUnitIdsBySourceActionId, created, updated, warnings);
        }
        return orderedMap("created", created.values, "updated", updated.values, "warnings", warnings);
    }

    @SuppressWarnings("unchecked")
    private void mergeExecutionResult(Map<String, Object> target, Map<String, Object> source) {
        mergeCounterValues((Map<String, Integer>) target.get("created"), (Map<String, Integer>) source.get("created"));
        mergeCounterValues((Map<String, Integer>) target.get("updated"), (Map<String, Integer>) source.get("updated"));
        Object targetWarnings = target.get("warnings");
        Object sourceWarnings = source.get("warnings");
        if (targetWarnings instanceof List<?> targetList && sourceWarnings instanceof List<?> sourceList) {
            ((List<Object>) targetList).addAll(sourceList);
        }
    }

    private void mergeCounterValues(Map<String, Integer> target, Map<String, Integer> source) {
        if (target == null || source == null) {
            return;
        }
        for (Map.Entry<String, Integer> entry : source.entrySet()) {
            target.merge(entry.getKey(), entry.getValue(), Integer::sum);
        }
    }

    private Map<String, Object> executeRevert(String projectCode, String mediaLibraryCode, String projectTypeCode,
            String taskTypeCode, String projectWorkflowCode, String taskWorkflowCode, boolean deleteSharedDefinitions,
            boolean force, boolean dryRun) {
        ResultCounter deleted = new ResultCounter();
        List<String> warnings = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        Project project = findProjectByCode(projectCode);
        List<Task> projectTasks = tasksForProject(project);
        Set<Long> taskIdsToDelete = projectTasks.stream().map(Task::getId).collect(Collectors.toCollection(LinkedHashSet::new));
        ProjectType projectType = findProjectTypeByCode(projectTypeCode);
        TaskType taskType = findTaskTypeByCode(taskTypeCode);
        Workflow projectWorkflow = findWorkflowByCode(projectWorkflowCode);
        Workflow taskWorkflow = findWorkflowByCode(taskWorkflowCode);
        MediaLibrary mediaLibrary = findMediaLibraryByCode(mediaLibraryCode);
        List<MediaLibrary> mediaLibraries = mediaLibraryTreePostOrder(mediaLibrary);
        int mediaCount = mediaLibraries.stream().mapToInt(library -> mediaManager.getByLibrary(library).size()).sum();

        Map<String, Object> found = orderedMap(
                "project", project == null ? null : orderedMap("id", project.getId(), "code", project.getCode()),
                "tasks", projectTasks.size(),
                "mediaLibrary", mediaLibrary == null ? null : orderedMap("id", mediaLibrary.getId(), "code", mediaLibrary.getCode()),
                "mediaLibraries", mediaLibraries.size(),
                "mediaAssets", mediaCount,
                "projectType", projectType == null ? null : orderedMap("id", projectType.getId(), "code", projectType.getCode()),
                "taskType", taskType == null ? null : orderedMap("id", taskType.getId(), "code", taskType.getCode()),
                "projectWorkflow", projectWorkflow == null ? null : orderedMap("id", projectWorkflow.getId(), "code", projectWorkflow.getCode()),
                "taskWorkflow", taskWorkflow == null ? null : orderedMap("id", taskWorkflow.getId(), "code", taskWorkflow.getCode()));

        DefinitionRefCounts refs = definitionRefCounts(project, taskIdsToDelete, projectType, taskType, projectWorkflow, taskWorkflow);
        Map<String, Object> plan = orderedMap(
                "projectCode", projectCode,
                "mediaLibraryCode", mediaLibraryCode,
                "projectTypeCode", projectTypeCode,
                "taskTypeCode", taskTypeCode,
                "projectWorkflowCode", projectWorkflowCode,
                "taskWorkflowCode", taskWorkflowCode,
                "deleteSharedDefinitions", deleteSharedDefinitions,
                "force", force,
                "found", found,
                "referencesAfterProjectRemoval", refs.asMap());

        if (dryRun) {
            return orderedMap(
                    "dryRun", true,
                    "plan", plan,
                    "warnings", warnings,
                    "skipped", skipped,
                    "deleted", deleted.values);
        }

        for (Task task : projectTasks) {
            taskManager.delete(task);
            deleted.inc("tasks");
        }
        if (project != null) {
            projectManager.delete(project);
            deleted.inc("projects");
        }

        if (deleteSharedDefinitions) {
            deleteTaskTypeIfSafe(taskType, refs.remainingTasksForTaskType, force, deleted, skipped);
            deleteProjectTypeIfSafe(projectType, refs.remainingProjectsForProjectType, force, deleted, skipped);
            deleteWorkflowIfSafe(taskWorkflow, refs.remainingTaskWorkflowReferences(), force, "taskWorkflow", deleted, skipped);
            deleteWorkflowIfSafe(projectWorkflow, refs.remainingProjectWorkflowReferences(), force, "projectWorkflow", deleted, skipped);
        } else {
            skipped.add("ProjectType/TaskType/Workflow definitions were not deleted because deleteSharedDefinitions=false");
        }

        for (MediaLibrary library : mediaLibraries) {
            List<String> mediaIds = mediaManager.getByLibrary(library).stream().map(Media::getId).toList();
            if (!mediaIds.isEmpty()) {
                mediaManager.deleteById(mediaIds, false);
                deleted.add("mediaAssets", mediaIds.size());
            }
            mediaLibraryManager.delete(library);
            deleted.inc("mediaLibraries");
        }

        clearImportCaches(project, projectType, taskType, projectWorkflow, taskWorkflow, mediaLibrary);
        return orderedMap(
                "dryRun", false,
                "plan", plan,
                "deleted", deleted.values,
                "skipped", skipped,
                "warnings", warnings,
                "errors", List.of());
    }

    private ObjectNode inferMapping(JsonNode board, String mappingScriptCode, String projectTypeCode, String taskTypeCode, String organizationCode) {
        ObjectNode root = mapper.createObjectNode();
        root.putObject("source")
                .put("format", "KANBAN_BOARD_EXPORT")
                .put("vendor", "Atlassian")
                .put("product", "Trello")
                .put("version", 1);
        root.putObject("organization").put("code", organizationCode);
        root.putObject("mediaLibrary")
                .put("code", "${projectCode}_MEDIA")
                .put("createIfMissing", true)
                .put("projectScoped", true)
                .put("codePattern", "${projectCode}_MEDIA")
                .put("downloadExternalUrls", true)
                .put("associateLibraryWithProject", true)
                .set("nls", nlsNode("Kanban Import Media", "Media imported from external Kanban boards"));
        root.putObject("contentConversion")
                .put("sourceDescriptionFormat", "MARKDOWN")
                .put("targetDescriptionFormat", "HTML")
                .put("convertDescriptionsToHtml", true)
                .put("convertDialogMessagesToHtml", true);

        root.set("projectType", inferProjectType(projectTypeCode));
        root.set("taskType", inferTaskType(taskTypeCode, board));
        root.set("projectWorkflow", defaultProjectWorkflow());
        root.set("taskWorkflow", inferTaskWorkflow(board));
        root.set("mappings", defaultMappings(board));
        root.set("sync", defaultSync());
        root.put("_mappingScriptCode", mappingScriptCode);
        return root;
    }

    private ObjectNode inferProjectType(String projectTypeCode) {
        ObjectNode node = mapper.createObjectNode();
        ProjectType existing = projectTypeManager.getByCode(projectTypeCode);
        node.put("code", projectTypeCode);
        node.put("createIfMissing", existing == null);
        node.put("strictValidation", true);
        node.set("nls", existing != null ? mapper.valueToTree(existing.getNls()) : nlsNode("Generic Kanban Board", "Imported Kanban board"));
        ArrayNode attrs = node.putArray("attributes");
        addAttribute(attrs, ATTR_TASK_TYPES, TaskType.class.getName(), false, true, "Task Types", "Task types allowed for projects of this type", false);
        addAttribute(attrs, ATTR_BOARD_ID, String.class.getName(), false, false, "Source Board ID", null, true);
        addAttribute(attrs, ATTR_UPDATED_AT, String.class.getName(), false, false, "Source Updated At", null, true);
        addAttribute(attrs, ATTR_BOARD_MEMBERS, User.class.getName(), false, true, "Board Members", null, false);
        return node;
    }

    private ObjectNode inferTaskType(String taskTypeCode, JsonNode board) {
        ObjectNode node = mapper.createObjectNode();
        TaskType existing = taskTypeManager.getByCode(taskTypeCode);
        node.put("code", taskTypeCode);
        node.put("createIfMissing", existing == null);
        node.put("strictValidation", true);
        node.set("nls", existing != null ? mapper.valueToTree(existing.getNls()) : nlsNode("Generic Kanban Task", "Imported Kanban card"));
        ArrayNode attrs = node.putArray("attributes");
        addAttribute(attrs, ATTR_CARD_ID, String.class.getName(), false, false, "Source Card ID", null, true);
        addAttribute(attrs, ATTR_LIST_ID, String.class.getName(), false, false, "Source List ID", null, true);
        addAttribute(attrs, ATTR_UPDATED_AT, String.class.getName(), false, false, "Source Updated At", null, true);
        ObjectNode labels = addAttribute(attrs, ATTR_LABELS, String.class.getName(), false, true, "Labels", null, false);
        labels.put("freeValue", false);
        labels.set("options", labelOptions(board));
        addAttribute(attrs, ATTR_CHECKLISTS, String.class.getName(), false, true, "Checklists", null, false);
        ObjectNode attachments = addAttribute(attrs, ATTR_ATTACHMENTS, Media.class.getName(), false, true, "Attachments", null, false);
        attachments.set("entityTypes", mediaEntityTypes());
        addAttribute(attrs, ATTR_DUE, LocalDateTime.class.getName(), false, false, "Due Date", null, false);
        addAttribute(attrs, ATTR_START, LocalDateTime.class.getName(), false, false, "Start Date", null, false);
        addAttribute(attrs, ATTR_DUE_COMPLETE, Boolean.class.getName(), false, false, "Due Complete", null, false);
        addAttribute(attrs, ATTR_CLOSED, Boolean.class.getName(), false, false, "Archived", null, false);
        return node;
    }

    private ObjectNode defaultProjectWorkflow() {
        ObjectNode wf = mapper.createObjectNode();
        wf.put("code", DEFAULT_PROJECT_WORKFLOW);
        wf.put("createIfMissing", true);
        wf.put("entityType", Project.class.getName());
        wf.put("scriptLanguage", "Java");
        wf.set("nls", nlsNode("Generic Kanban Project Workflow", "Project lifecycle for imported Kanban boards"));
        wf.set("image", mapper.nullNode());
        wf.putObject("style");
        wf.putArray("attributes");
        wf.putArray("attributeGroups");
        wf.putArray("attributeOrder");
        wf.put("initialState", "INITIAL");
        ArrayNode states = wf.putArray("states");
        states.add(workflowState("INITIAL", "Initial", event("INITIAL_TO_ACTIVE", "ACTIVE", "Activate")));
        states.add(workflowState("ACTIVE", "Active", event("ACTIVE_TO_ARCHIVED", "ARCHIVED", "Archive")));
        states.add(workflowState("ARCHIVED", "Archived", event("ARCHIVED_TO_ACTIVE", "ACTIVE", "Restore")));
        return wf;
    }

    private ObjectNode inferTaskWorkflow(JsonNode board) {
        ObjectNode wf = mapper.createObjectNode();
        wf.put("code", DEFAULT_TASK_WORKFLOW);
        wf.put("createIfMissing", true);
        wf.put("entityType", Task.class.getName());
        wf.put("scriptLanguage", "Java");
        wf.set("nls", nlsNode("Generic Kanban Task Flow", "Task flow generated from source board lists"));
        wf.set("image", mapper.nullNode());
        wf.putObject("style");
        wf.putArray("attributes");
        wf.putArray("attributeGroups");
        wf.putArray("attributeOrder");
        wf.put("initialState", "INITIAL");
        ArrayNode states = wf.putArray("states");
        Set<String> codes = new LinkedHashSet<>();
        codes.add("INITIAL");
        states.add(workflowState("INITIAL", "Initial"));
        for (JsonNode list : array(board, "lists")) {
            if (Boolean.TRUE.equals(bool(list, "closed"))) {
                continue;
            }
            String code = uniqueCode(code(text(list, "name")), codes);
            codes.add(code);
            ObjectNode state = workflowState(code, text(list, "name"));
            state.put("sourceListId", text(list, "id"));
            states.add(state);
        }
        codes.add("ARCHIVED");
        states.add(workflowState("ARCHIVED", "Archived"));
        ArrayNode definitions = mapper.createArrayNode();
        List<String> allCodes = new ArrayList<>(codes);
        for (String source : allCodes) {
            for (String target : allCodes) {
                if (!source.equals(target) && !"INITIAL".equals(target)) {
                    ObjectNode definition = event(eventCode(source, target), target, eventName(target));
                    definition.put("source", source);
                    definitions.add(definition);
                }
            }
        }
        wf.putObject("events").put("mode", "ANY_STATE_TO_ANY_STATE").set("definitions", definitions);
        return wf;
    }

    private ObjectNode defaultMappings(JsonNode board) {
        ObjectNode mappings = mapper.createObjectNode();
        ObjectNode project = mappings.putObject("project");
        ArrayNode projectFixed = project.putArray("fixedFields");
        projectFixed.add(pathMapping("$.name", "nls.en.NAME"));
        projectFixed.add(pathMapping("$.desc", "nls.en.DESCRIPTION", "MARKDOWN_TO_HTML"));
        ArrayNode projectAttrs = project.putArray("attributes");
        projectAttrs.add(pathMapping("$.id", ATTR_BOARD_ID));
        ObjectNode task = mappings.putObject("task");
        ArrayNode taskFixed = task.putArray("fixedFields");
        taskFixed.add(pathMapping("$.cards[*].name", "nls.en.NAME"));
        taskFixed.add(pathMapping("$.cards[*].desc", "nls.en.DESCRIPTION", "MARKDOWN_TO_HTML"));
        ArrayNode taskAttrs = task.putArray("attributes");
        taskAttrs.add(pathMapping("$.cards[*].id", ATTR_CARD_ID));
        taskAttrs.add(pathMapping("$.cards[*].idList", ATTR_LIST_ID));
        taskAttrs.add(pathMapping("$.cards[*].due", ATTR_DUE, "ISO_OFFSET_TO_LOCAL_DATE_TIME"));
        taskAttrs.add(pathMapping("$.cards[*].start", ATTR_START, "ISO_OFFSET_TO_LOCAL_DATE_TIME"));
        taskAttrs.add(pathMapping("$.cards[*].dueComplete", ATTR_DUE_COMPLETE));
        taskAttrs.add(pathMapping("$.cards[*].closed", ATTR_CLOSED));
        taskAttrs.add(pathMapping("$.cards[*].labels[*]", ATTR_LABELS, "LABEL_NAME_OR_COLOR"));
        taskAttrs.add(pathMapping("$.cards[*].attachments[*]", ATTR_ATTACHMENTS, "CORE_MEDIA_REFERENCE"));
        mappings.putObject("users")
                .put("boardMembersAreProjectMembers", true)
                .put("createMissingUsers", true)
                .putArray("matchBy").add("email").add("fullName").add("username");
        mappings.putObject("media")
                .put("downloadExternalUrls", true)
                .put("associateLibraryWithProject", true);
        ArrayNode ignored = mappings.putArray("ignored");
        ignored.add(ignore("$.idOrganization", "Core organization is supplied by mapping/runtime context"));
        ignored.add(ignore("$..shortLink", "Source short links are not useful Core data"));
        ignored.add(ignore("$..shortUrl", "Source short URLs are not useful Core data"));
        ignored.add(ignore("$..url", "Non-media page URLs are ignored unless traceability is enabled"));
        return mappings;
    }

    private ObjectNode defaultSync() {
        ObjectNode sync = mapper.createObjectNode();
        sync.putObject("identity")
                .put("project", "$.id")
                .put("task", "$.cards[*].id")
                .put("state", "$.lists[*].id")
                .put("member", "$.members[*].id");
        sync.put("deletePolicy", "ARCHIVE");
        sync.put("closedPolicy", "ARCHIVE");
        sync.put("missingCardPolicy", "ARCHIVE");
        return sync;
    }

    private ImportPlan buildImportPlan(JsonNode board, ObjectNode mapping, String projectName, String projectCode) {
        ImportPlan plan = new ImportPlan();
        plan.projectName = blank(projectName) ? boardName(board) : projectName;
        plan.projectCode = blank(projectCode) ? code(plan.projectName) : projectCode;
        plan.organizationCode = text(mapping.path("organization"), "code", defaultOrganizationCode());
        plan.projectTypeCode = text(mapping.path("projectType"), "code", DEFAULT_PROJECT_TYPE);
        plan.taskTypeCode = text(mapping.path("taskType"), "code", DEFAULT_TASK_TYPE);
        plan.projectWorkflowCode = text(mapping.path("projectWorkflow"), "code", DEFAULT_PROJECT_WORKFLOW);
        plan.taskWorkflowCode = text(mapping.path("taskWorkflow"), "code", DEFAULT_TASK_WORKFLOW);
        plan.downloadMedia = mapping.path("mediaLibrary").path("downloadExternalUrls").asBoolean(true)
                && mapping.path("mappings").path("media").path("downloadExternalUrls").asBoolean(true);
        plan.missingCardPolicy = text(mapping.path("sync"), "missingCardPolicy", "ARCHIVE");
        plan.summary = boardSummary(board);
        plan.toCreate.put("tasks", countCardsWithoutExistingMatch(board));
        plan.toReuse.put("projectTypes", projectTypeManager.getByCode(plan.projectTypeCode) == null ? 0 : 1);
        plan.toReuse.put("taskTypes", taskTypeManager.getByCode(plan.taskTypeCode) == null ? 0 : 1);
        return plan;
    }

    private ProjectType ensureProjectType(ObjectNode mapping, Organization org, ResultCounter created, ResultCounter updated) {
        ObjectNode typeNode = (ObjectNode) mapping.path("projectType");
        String code = text(typeNode, "code", DEFAULT_PROJECT_TYPE);
        ProjectType existing = projectTypeManager.getByCode(code);
        if (existing == null) {
            if (!typeNode.path("createIfMissing").asBoolean(true)) {
                throw new ApplicationException("ProjectType {} does not exist", code);
            }
            ProjectType type = new ProjectType();
            type.setCode(code);
            type.setOrganization(org);
            type.setNls(readNls(typeNode.path("nls"), "Generic Kanban Board", "Imported Kanban board"));
            type.setAttributes(attributes(typeNode.path("attributes")));
            type = projectTypeManager.save(type);
            created.inc("projectTypes");
            return type;
        }
        validateAttributes(existing.getAttributes(), typeNode.path("attributes"), "ProjectType " + code);
        requireAttribute(existing.getAttributes(), ATTR_TASK_TYPES, TaskType.class.getName(), true, "ProjectType " + code);
        return existing;
    }

    private TaskType ensureTaskType(ObjectNode mapping, Organization org, ResultCounter created, ResultCounter updated) {
        ObjectNode typeNode = (ObjectNode) mapping.path("taskType");
        String code = text(typeNode, "code", DEFAULT_TASK_TYPE);
        TaskType existing = taskTypeManager.getByCode(code);
        if (existing == null) {
            if (!typeNode.path("createIfMissing").asBoolean(true)) {
                throw new ApplicationException("TaskType {} does not exist", code);
            }
            TaskType type = new TaskType();
            type.setCode(code);
            type.setOrganization(org);
            type.setNls(readNls(typeNode.path("nls"), "Generic Kanban Task", "Imported Kanban card"));
            type.setAttributes(attributes(typeNode.path("attributes")));
            type = taskTypeManager.save(type);
            created.inc("taskTypes");
            return type;
        }
        validateAttributes(existing.getAttributes(), typeNode.path("attributes"), "TaskType " + code);
        return existing;
    }

    private Workflow ensureWorkflow(ObjectNode workflowNode, String entityType, Organization org, ResultCounter created) {
        String code = text(workflowNode, "code");
        Workflow existing = workflowManager.getByCode(code);
        if (existing != null) {
            return existing;
        }
        if (!workflowNode.path("createIfMissing").asBoolean(true)) {
            throw new ApplicationException("Workflow {} does not exist", code);
        }
        Workflow workflow = new Workflow();
        workflow.setCode(code);
        workflow.setOrganization(org);
        workflow.setEntityType(text(workflowNode, "entityType", entityType));
        workflow.setScriptLanguage(Script.ScriptLanguage.valueOf(text(workflowNode, "scriptLanguage", "Java")));
        workflow.setNls(readNls(workflowNode.path("nls"), code, null));
        workflow.setAttributes(attributes(workflowNode.path("attributes")));
        workflow.setAttributeGroups(attributeGroups(workflowNode.path("attributeGroups")));
        workflow.setAttributeOrder(attributeOrder(workflowNode.path("attributeOrder")));
        workflow.setStates(new ArrayList<>());
        String initial = text(workflowNode, "initialState", "INITIAL");
        Map<String, WorkflowState> states = new LinkedHashMap<>();
        for (JsonNode stateNode : workflowNode.withArray("states")) {
            WorkflowState state = toWorkflowState(stateNode, workflow);
            state.setEvents(new ArrayList<>());
            states.put(state.getCode(), state);
            workflow.getStates().add(state);
        }
        Map<String, WorkflowEvent> eventsByCode = new LinkedHashMap<>();
        for (JsonNode stateNode : workflowNode.withArray("states")) {
            WorkflowState source = states.get(text(stateNode, "code"));
            for (JsonNode eventNode : stateNode.withArray("events")) {
                addWorkflowEvent(workflow, source, eventNode, states, eventsByCode, initial);
            }
        }
        for (JsonNode eventNode : workflowNode.path("events").path("definitions")) {
            WorkflowState source = states.get(eventSourceCode(eventNode));
            addWorkflowEvent(workflow, source, eventNode, states, eventsByCode, initial);
        }
        workflow.setStates(new ArrayList<>(states.values()));
        normalizeWorkflowEvents(workflow, initial);
        verifyInitialCandidate(workflow);
        workflow.setInitialState(states.get(initial));
        Workflow saved = workflowService.save(workflow);
        generateWorkflowSource(saved);
        created.inc("workflows");
        return saved;
    }

    private void generateWorkflowSource(Workflow workflow) {
        try {
            String sourceCode = workflowScriptGeneratorRegistry.getGenerator(workflow.getScriptLanguage()).generateSourceCode(workflow);
            workflow.setSourceCode(sourceCode);
            workflow.setValid(sourceCode != null);
            workflowManager.saveNoNotify(workflow);
            workflowManager.flush();
        } catch (Exception e) {
            throw new ApplicationException("Could not generate workflow script for " + workflow.getCode(), e);
        }
    }

    private Workflow ensureTaskWorkflow(ObjectNode mapping, JsonNode board, Organization org, ResultCounter created) {
        ObjectNode wfNode = (ObjectNode) mapping.path("taskWorkflow");
        if (wfNode.withArray("states").isEmpty()) {
            wfNode = inferTaskWorkflow(board);
            ((ObjectNode) mapping).set("taskWorkflow", wfNode);
        }
        return ensureWorkflow(wfNode, Task.class.getName(), org, created);
    }

    private WorkflowState toWorkflowState(JsonNode node, Workflow workflow) {
        WorkflowState state = new WorkflowState();
        state.setCode(text(node, "code"));
        state.setWorkflow(workflow);
        state.setNls(readNls(node.path("nls"), state.getCode(), null));
        state.setStyle(readMap(node.path("style")));
        state.setAttributes(attributes(node.path("attributes")));
        state.setAttributeGroups(attributeGroups(node.path("attributeGroups")));
        state.setAttributeOrder(attributeOrder(node.path("attributeOrder")));
        return state;
    }

    private WorkflowEvent toWorkflowEvent(JsonNode node, Workflow workflow, WorkflowState source, Map<String, WorkflowState> states) {
        WorkflowEvent event = new WorkflowEvent();
        event.setCode(text(node, "code"));
        event.setWorkflow(workflow);
        event.setSource(source);
        event.setOrderIndex(node.path("orderIndex").asInt(0));
        event.setNls(readNls(node.path("nls"), event.getCode(), null));
        event.setStyle(readMap(node.path("style")));
        event.setAttributes(attributes(node.path("attributes")));
        event.setAttributeGroups(attributeGroups(node.path("attributeGroups")));
        event.setAttributeOrder(attributeOrder(node.path("attributeOrder")));
        List<WorkflowState> targets = new ArrayList<>();
        if (node.has("target")) {
            targets.add(states.get(text(node, "target")));
        }
        for (JsonNode target : node.withArray("targets")) {
            targets.add(states.get(target.asText()));
        }
        event.setTargets(targets.stream().filter(Objects::nonNull).toList());
        return event;
    }

    private void normalizeWorkflowEvents(Workflow workflow, String initialStateCode) {
        for (WorkflowState state : workflow.getStates()) {
            Map<String, WorkflowEvent> unique = new LinkedHashMap<>();
            for (WorkflowEvent event : new ArrayList<>(state.getEvents())) {
                if (blank(event.getCode())) {
                    continue;
                }
                if (!Objects.equals(state.getCode(), initialStateCode)
                        && event.getTargets().stream().anyMatch(target -> Objects.equals(target.getCode(), initialStateCode))) {
                    continue;
                }
                event.setSource(state);
                event.setWorkflow(workflow);
                unique.putIfAbsent(event.getCode(), event);
            }
            state.setEvents(new ArrayList<>(unique.values()));
        }
    }

    private void verifyInitialCandidate(Workflow workflow) {
        Set<String> targeted = workflow.getStates().stream()
                .flatMap(state -> state.getEvents().stream())
                .flatMap(event -> event.getTargets().stream())
                .map(WorkflowState::getCode)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<String> candidates = workflow.getStates().stream()
                .map(WorkflowState::getCode)
                .filter(code -> !targeted.contains(code))
                .toList();
        if (candidates.isEmpty()) {
            String events = workflow.getStates().stream()
                    .flatMap(state -> state.getEvents().stream())
                    .map(event -> event.getCode() + ":" + event.getSource().getCode() + "->"
                            + event.getTargets().stream().map(WorkflowState::getCode).collect(Collectors.joining("|")))
                    .collect(Collectors.joining(","));
            throw new ApplicationException("Workflow {} has no initial candidate before save. Events: {}", workflow.getCode(), events);
        }
    }

    private void addWorkflowEvent(Workflow workflow, WorkflowState source, JsonNode eventNode, Map<String, WorkflowState> states,
            Map<String, WorkflowEvent> eventsByCode, String initialStateCode) {
        if (source == null || eventNode == null || eventNode.isMissingNode() || eventNode.isNull()) {
            return;
        }
        WorkflowEvent event = toWorkflowEvent(eventNode, workflow, source, states);
        if (blank(event.getCode()) || event.getTargets() == null || event.getTargets().isEmpty()) {
            return;
        }
        if (!Objects.equals(source.getCode(), initialStateCode)
                && event.getTargets().stream().anyMatch(target -> Objects.equals(target.getCode(), initialStateCode))) {
            return;
        }
        WorkflowEvent existing = eventsByCode.get(event.getCode());
        if (existing != null) {
            if (!Objects.equals(existing.getSource().getCode(), source.getCode()) || !sameTargets(existing, event)) {
                throw new ApplicationException("Workflow {} contains duplicate event code {}", workflow.getCode(), event.getCode());
            }
            return;
        }
        eventsByCode.put(event.getCode(), event);
        if (!source.getEvents().contains(event)) {
            source.getEvents().add(event);
        }
    }

    private boolean sameTargets(WorkflowEvent a, WorkflowEvent b) {
        Set<String> aTargets = a.getTargets().stream().map(WorkflowState::getCode).collect(Collectors.toCollection(LinkedHashSet::new));
        Set<String> bTargets = b.getTargets().stream().map(WorkflowState::getCode).collect(Collectors.toCollection(LinkedHashSet::new));
        return aTargets.equals(bTargets);
    }

    private String eventSourceCode(JsonNode eventNode) {
        String source = text(eventNode, "source");
        if (!blank(source)) {
            return source;
        }
        String eventCode = text(eventNode, "code");
        int split = eventCode.indexOf("_TO_");
        return split > 0 ? eventCode.substring(0, split) : "";
    }

    private void assignProjectTypeWorkflow(ProjectType type, Workflow workflow, ResultCounter updated) {
        Workflow current = type.getWorkflow();
        if (current != null && Objects.equals(current.getId(), workflow.getId())) {
            return;
        }
        type.setWorkflow(workflow);
        projectTypeManager.update(type);
        updated.inc("projectTypes");
    }

    private void assignTaskTypeWorkflow(TaskType type, Workflow workflow, ResultCounter updated) {
        Workflow current = type.getWorkflow();
        if (current != null && Objects.equals(current.getId(), workflow.getId())) {
            return;
        }
        type.setWorkflow(workflow);
        taskTypeManager.update(type);
        updated.inc("taskTypes");
    }

    private MediaLibrary ensureMediaLibrary(ObjectNode mapping, Organization org, String projectCode, ResultCounter created) {
        JsonNode libNode = mapping.path("mediaLibrary");
        String configured = text(libNode, "code", "${projectCode}_MEDIA");
        String code = configured.replace("${projectCode}", projectCode);
        if (libNode.path("projectScoped").asBoolean(true)) {
            code = text(libNode, "codePattern", "${projectCode}_MEDIA").replace("${projectCode}", projectCode);
        }
        return ensureMediaLibrary(code, org, readNls(libNode.path("nls"), code, "Kanban imported media"), created);
    }

    private MediaLibrary ensureMediaLibrary(String code, Organization org, Map<String, Map<String, String>> nls, ResultCounter created) {
        MediaLibrary existing = mediaLibraryManager.getByCode(code);
        if (existing != null) {
            return existing;
        }
        MediaLibrary lib = new MediaLibrary();
        lib.setCode(code);
        lib.setOrganization(org);
        lib.setNls(nls);
        lib.setHidden(false);
        MediaLibrary saved = mediaLibraryManager.save(lib);
        created.inc("mediaLibraries");
        return saved;
    }

    private Project ensureProject(JsonNode board, ImportPlan plan, Organization org, ProjectType type, Workflow workflow, TaskType taskType,
            Map<String, User> usersBySourceId, ResultCounter created, ResultCounter updated) {
        String boardId = text(board, "id");
        Project project = findProjectBySourceId(boardId);
        if (project == null) {
            project = projectManager.getByCode(plan.projectCode);
        }
        boolean isNew = project == null;
        if (isNew) {
            project = new Project();
            project.setCode(plan.projectCode);
            project.setOrganization(org);
            project.setType(type);
            project.setWorkflow(workflow);
        }
        project.setNls(nls(plan.projectName, markdownToHtml(text(board, "desc"))));
        project.setAttributeValue(type.getId(), ATTR_BOARD_ID, boardId, null);
        project.setAttributeValue(type.getId(), ATTR_UPDATED_AT, bestUpdatedAt(board), null);
        project.setAttributeValue(type.getId(), ATTR_TASK_TYPES, List.of(taskType.getId()), null);
        if (!usersBySourceId.isEmpty()) {
            project.setAttributeValue(type.getId(), ATTR_BOARD_MEMBERS,
                    usersBySourceId.values().stream().map(User::getId).toList(), null);
        }
        Project saved = isNew ? projectManager.save(project) : projectManager.update(project);
        if (isNew) {
            created.inc("projects");
        } else {
            updated.inc("projects");
        }
        return saved;
    }

    private Task ensureTask(JsonNode card, JsonNode board, ImportPlan plan, Project project, TaskType type, Workflow workflow,
            Map<String, List<String>> sourceMediaIds, Map<String, String> mediaTypesById, Map<String, Task> tasksBySourceId,
            ResultCounter created, ResultCounter updated) {
        String cardId = text(card, "id");
        Task task = tasksBySourceId.get(cardId);
        boolean isNew = task == null;
        if (isNew) {
            task = new Task();
            task.setCode(UUID.randomUUID().toString().toUpperCase(Locale.ROOT));
            task.setProject(project);
            task.setOrganization(project.getOrganization());
            task.setType(type);
            task.setWorkflow(workflow);
        }
        task.setNls(nls(text(card, "name"), markdownToHtml(text(card, "desc"))));
        task.setAttributeValue(type.getId(), ATTR_CARD_ID, cardId, null);
        task.setAttributeValue(type.getId(), ATTR_LIST_ID, text(card, "idList"), null);
        task.setAttributeValue(type.getId(), ATTR_UPDATED_AT, bestUpdatedAt(card), null);
        LocalDateTime due = trelloDateTime(text(card, "due"));
        if (due != null) {
            task.setAttributeValue(type.getId(), ATTR_DUE, due, null);
        }
        LocalDateTime start = trelloDateTime(text(card, "start"));
        if (start != null) {
            task.setAttributeValue(type.getId(), ATTR_START, start, null);
        }
        task.setAttributeValue(type.getId(), ATTR_DUE_COMPLETE, bool(card, "dueComplete"), null);
        task.setAttributeValue(type.getId(), ATTR_CLOSED, bool(card, "closed"), null);
        List<String> labels = labels(card, board);
        if (!labels.isEmpty()) {
            task.setAttributeValue(type.getId(), ATTR_LABELS, labels, null);
        }
        List<String> checklists = checklists(card, board);
        if (!checklists.isEmpty()) {
            task.setAttributeValue(type.getId(), ATTR_CHECKLISTS, checklists, null);
        }
        List<Map<String, String>> mediaRefs = mediaRefsForCard(card, sourceMediaIds, mediaTypesById);
        if (!mediaRefs.isEmpty()) {
            task.setAttributeValue(type.getId(), ATTR_ATTACHMENTS, mediaRefs, null);
        }
        Task saved = isNew ? taskManager.save(task) : task;
        if (isNew) {
            created.inc("tasks");
        } else {
            updated.inc("tasks");
        }
        tasksBySourceId.put(cardId, saved);
        return saved;
    }

    private void ensureDialogUnits(JsonNode card, JsonNode board, ObjectNode mapping, Task task, Map<String, User> usersBySourceId,
            User systemUser,
            Map<String, Long> dialogUnitIdsBySourceActionId,
            ResultCounter created, ResultCounter updated, List<String> warnings) {
        String cardId = text(card, "id");
        if (blank(cardId)) {
            return;
        }
        List<JsonNode> comments = commentActionsForCard(board, cardId);
        boolean convertToHtml = mapping.path("contentConversion").path("convertDialogMessagesToHtml").asBoolean(true);
        for (JsonNode action : comments) {
            String actionId = text(action, "id");
            String sourceText = text(action.path("data"), "text");
            if (blank(actionId) || blank(sourceText)) {
                continue;
            }
            if (dialogUnitIdsBySourceActionId.containsKey(actionId)) {
                continue;
            }
            DialogUnit unit = new DialogUnit();
            unit.setTask(task);
            unit.setOrganization(task.getOrganization());
            LocalDateTime createdAt = trelloDateTime(text(action, "date"));
            if (createdAt != null) {
                unit.setCreated(createdAt);
                unit.setUpdated(createdAt);
            }
            unit.setUser(resolveDialogUser(action, usersBySourceId, systemUser, warnings));
            unit.setContent(convertToHtml ? markdownToHtml(sourceText) : sourceText);
            unit.setMetadata(dialogUnitMetadata(cardId, action));
            if (unit.getPermissions().isEmpty() && task.getPermissions() != null) {
                unit.setPermissions(new HashSet<>(task.getPermissions()));
            }
            DialogUnit saved = dialogUnitManager.save(unit);
            if (saved != null) {
                dialogUnitIdsBySourceActionId.put(actionId, saved.getId());
                created.inc("dialogUnits");
            }
        }
    }

    private List<JsonNode> commentActionsForCard(JsonNode board, String cardId) {
        List<JsonNode> comments = new ArrayList<>();
        for (JsonNode action : array(board, "actions")) {
            if (!"commentCard".equals(text(action, "type"))) {
                continue;
            }
            String actionCardId = text(action.path("data").path("card"), "id");
            if (cardId.equals(actionCardId)) {
                comments.add(action);
            }
        }
        comments.sort((left, right) -> text(left, "date").compareTo(text(right, "date")));
        return comments;
    }

    private Map<String, Long> dialogUnitIdsBySourceActionId(Project project) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (DialogUnit unit : dialogUnitManager.listAll()) {
            Task task = unit.getTask();
            if (task == null || task.getProject() == null || !Objects.equals(project.getId(), task.getProject().getId())) {
                continue;
            }
            String actionId = metadataValue(unit.getMetadata(), "KANBAN_SOURCE_ACTION_ID");
            if (!blank(actionId) && unit.getId() != null) {
                result.put(actionId, unit.getId());
            }
        }
        return result;
    }

    private User resolveDialogUser(JsonNode action, Map<String, User> usersBySourceId, User systemUser, List<String> warnings) {
        String sourceUserId = text(action, "idMemberCreator");
        User user = usersBySourceId.get(sourceUserId);
        JsonNode creator = action.path("memberCreator");
        if (user == null) {
            user = systemUser;
            warnings.add("Could not resolve comment author " + firstNonBlank(text(creator, "fullName"), text(creator, "username"), sourceUserId)
                    + "; assigned the comment to system user.");
        }
        return user;
    }

    private User findUserByProfile(String username, String fullName, String email) {
        User user = null;
        if (!blank(username)) {
            user = userManager.getByName(username);
        }
        if (user == null && !blank(email)) {
            user = userManager.getByEmail(email);
        }
        if (user == null && !blank(fullName)) {
            for (User candidate : userManager.listAll()) {
                if (fullName.equalsIgnoreCase(candidate.getFullname()) || fullName.equalsIgnoreCase(candidate.getName())) {
                    return candidate;
                }
            }
        }
        return user;
    }

    private String dialogUnitMetadata(String cardId, JsonNode action) {
        ObjectNode metadata = mapper.createObjectNode();
        metadata.put("source", "KANBAN_BOARD_IMPORT");
        metadata.put("KANBAN_SOURCE_CARD_ID", cardId);
        metadata.put("KANBAN_SOURCE_ACTION_ID", text(action, "id"));
        metadata.put("KANBAN_ACTION_TYPE", text(action, "type"));
        metadata.put("KANBAN_ACTION_DATE", text(action, "date"));
        metadata.put("KANBAN_SOURCE_MEMBER_ID", text(action, "idMemberCreator"));
        JsonNode creator = action.path("memberCreator");
        if (!creator.isMissingNode() && !creator.isNull()) {
            metadata.set("KANBAN_SOURCE_MEMBER", creator.deepCopy());
        }
        return writeJson(metadata);
    }

    private String metadataValue(String metadata, String field) {
        if (blank(metadata)) {
            return "";
        }
        try {
            JsonNode node = mapper.readTree(metadata);
            return text(node, field);
        } catch (Exception ignored) {
            return "";
        }
    }

    private void transitionProject(Project project, Workflow workflow, String targetState, List<String> warnings) {
        transition(project, workflow, targetState, warnings, "project " + project.getCode());
    }

    private void transitionTask(Task task, Workflow workflow, String targetState, List<String> warnings) {
        transition(task, workflow, targetState, warnings, "task " + task.getCode());
    }

    private void transition(Object entity, Workflow workflow, String targetState, List<String> warnings, String label) {
        try {
            if (hasState(entity, targetState)) {
                return;
            }
            String current = currentStateCode(entity);
            String eventCode = eventCode(blank(current) ? "INITIAL" : current, targetState);
            if (entity instanceof Project project) {
                workflowService.sendEventUnsecured(eventCode, project, Map.of());
            } else if (entity instanceof Task task) {
                workflowService.sendEventUnsecured(eventCode, task, Map.of());
            }
        } catch (Exception e) {
            warnings.add("Could not transition " + label + " to " + targetState + ": " + e.getMessage());
        }
    }

    private void archiveMissingTasks(Project project, Workflow workflow, Set<String> seenCardSourceIds, ImportPlan plan,
            ResultCounter archived, List<String> warnings, Collection<Task> projectTasks) {
        if (!"ARCHIVE".equalsIgnoreCase(plan.missingCardPolicy)) {
            return;
        }
        for (Task task : projectTasks) {
            if (task.getProject() == null || !Objects.equals(task.getProject().getId(), project.getId())) {
                continue;
            }
            String sourceId = task.findFirstAttributeValue(ATTR_CARD_ID, null);
            if (!blank(sourceId) && !seenCardSourceIds.contains(sourceId) && !hasState(task, "ARCHIVED")) {
                transitionTask(task, workflow, "ARCHIVED", warnings);
                archived.inc("tasks");
            }
        }
    }

    private Project findProjectBySourceId(String boardId) {
        if (blank(boardId)) {
            return null;
        }
        for (Project project : projectManager.listAll()) {
            String value = project.findFirstAttributeValue(ATTR_BOARD_ID, null);
            if (boardId.equals(value)) {
                return project;
            }
        }
        return null;
    }

    private Map<String, Task> tasksBySourceId(Project project) {
        Map<String, Task> result = new LinkedHashMap<>();
        for (Task task : taskManager.listAll()) {
            if (task.getProject() == null || !Objects.equals(project.getId(), task.getProject().getId())) {
                continue;
            }
            String sourceId = task.findFirstAttributeValue(ATTR_CARD_ID, null);
            if (!blank(sourceId)) {
                result.put(sourceId, task);
            }
        }
        return result;
    }

    private Task findTaskBySourceId(Project project, String cardId) {
        if (blank(cardId)) {
            return null;
        }
        for (Task task : taskManager.listAll()) {
            if (task.getProject() == null || !Objects.equals(project.getId(), task.getProject().getId())) {
                continue;
            }
            String value = task.findFirstAttributeValue(ATTR_CARD_ID, null);
            if (cardId.equals(value)) {
                return task;
            }
        }
        return null;
    }

    private int countCardsWithoutExistingMatch(JsonNode board) {
        int count = 0;
        for (JsonNode card : array(board, "cards")) {
            if (findTaskBySourceIdStub(text(card, "id")) == null) {
                count++;
            }
        }
        return count;
    }

    private Object findTaskBySourceIdStub(String id) {
        if (blank(id)) {
            return null;
        }
        for (Task task : taskManager.listAll()) {
            String value = task.findFirstAttributeValue(ATTR_CARD_ID, null);
            if (id.equals(value)) {
                return task;
            }
        }
        return null;
    }

    private Map<String, User> resolveUsers(JsonNode board, Organization organization, List<String> warnings, ResultCounter created) {
        Map<String, User> users = new LinkedHashMap<>();
        for (JsonNode member : array(board, "members")) {
            String sourceId = text(member, "id");
            String fullName = text(member, "fullName");
            String username = text(member, "username");
            String email = text(member, "email");
            User user = findUserByProfile(username, fullName, email);
            if (user == null) {
                warnings.add("Core user not found for board member: " + firstNonBlank(fullName, username, sourceId));
            } else if (!blank(sourceId)) {
                users.put(sourceId, user);
            }
        }
        return users;
    }

    private List<StagedMedia> stageExternalMedia(JsonNode board, ImportPlan plan) throws IOException {
        List<StagedMedia> staged = new ArrayList<>();
        Path dir = Files.createTempDirectory("kanban-import-media-");
        for (JsonNode card : array(board, "cards")) {
            for (JsonNode attachment : array(card, "attachments")) {
                String url = text(attachment, "url");
                if (!isDownloadableMediaUrl(url)) {
                    continue;
                }
                String fileName = safeFileName(firstNonBlank(text(attachment, "fileName"), text(attachment, "name"), text(attachment, "id"), "media"));
                Path target = dir.resolve(UUID.randomUUID() + "-" + fileName);
                download(url, target);
                staged.add(new StagedMedia(text(card, "id"), text(attachment, "id"), url, fileName, target));
            }
        }
        return staged;
    }

    private JsonNode fetchBoardExport(String boardId, String apiKey, String apiToken, boolean includeActions, List<String> warnings) throws IOException {
        String url = buildBoardExportUrl(boardId, apiKey, apiToken, includeActions);
        ObjectNode board = (ObjectNode) mapper.readTree(httpGetBytes(url, null));
        if (includeActions) {
            enrichCardCommentActions(board, apiKey, apiToken, warnings);
        }
        return board;
    }

    private void enrichCardCommentActions(ObjectNode board, String apiKey, String apiToken, List<String> warnings) {
        ArrayNode actions = board.withArray("actions");
        Set<String> existingActionIds = new LinkedHashSet<>();
        for (JsonNode action : actions) {
            String actionId = text(action, "id");
            if (!blank(actionId)) {
                existingActionIds.add(actionId);
            }
        }
        int importedComments = 0;
        for (JsonNode card : array(board, "cards")) {
            String cardId = text(card, "id");
            if (blank(cardId)) {
                continue;
            }
            String url = "https://api.trello.com/1/cards/" + encodePathSegment(cardId)
                    + "/actions?filter=commentCard&limit=1000"
                    + "&key=" + urlParam(apiKey)
                    + "&token=" + urlParam(apiToken);
            try {
                JsonNode comments = mapper.readTree(httpGetBytes(url, null));
                if (!comments.isArray()) {
                    continue;
                }
                for (JsonNode comment : comments) {
                    String actionId = text(comment, "id");
                    if (!blank(actionId) && existingActionIds.add(actionId)) {
                        actions.add(comment);
                        importedComments++;
                    }
                }
            } catch (Exception e) {
                warnings.add("Could not fetch source comments for card " + firstNonBlank(text(card, "name"), cardId) + ": " + e.getMessage());
            }
        }
        if (importedComments > 0) {
            warnings.add("Enriched board export with " + importedComments + " per-card comments missing from board actions.");
        }
    }

    private AtlassianCredentials resolveAtlassianCredentials(Map<String, Object> args, String organizationCode) {
        if (args.containsKey("sourceApiKey") || args.containsKey("apiKey") || args.containsKey("sourceApiToken") || args.containsKey("apiToken")) {
            throw new ApplicationException("Atlassian API credentials must be supplied through an OrganizationSecret or UserSecret of type {}", SECRET_TYPE_ATLASSIAN_API);
        }

        Integer secretId = integerArg(args, "sourceSecretId", null);
        if (secretId == null) {
            secretId = integerArg(args, "secretId", null);
        }

        Secret secret = secretId == null ? findDefaultAtlassianSecret(organizationCode) : secretManager.get(secretId);
        validateAtlassianSecret(secret, organizationCode);

        String apiKey = stringSecretAttribute(secret, SECRET_API_KEY);
        String apiToken = stringSecretAttribute(secret, SECRET_API_TOKEN);
        if (blank(apiKey) || blank(apiToken)) {
            throw new ApplicationException("{} secret {} must define {} and {}", SECRET_TYPE_ATLASSIAN_API, secret.getId(), SECRET_API_KEY, SECRET_API_TOKEN);
        }
        return new AtlassianCredentials(secret.getId(), apiKey, apiToken);
    }

    private Secret findDefaultAtlassianSecret(String organizationCode) {
        List<Secret> candidates = new ArrayList<>();
        Organization organization = resolveOrganization(organizationCode);
        candidates.addAll(organizationSecretManager.listByOrganizationAndTypeHierarchical(organization.getId(), SECRET_TYPE_ATLASSIAN_API));

        User user = Auth.getAuthenticatedUser();
        if (user != null) {
            for (UserSecret secret : userSecretManager.listByUser(user.getId())) {
                if (secret.getType() != null && SECRET_TYPE_ATLASSIAN_API.equals(secret.getType().getCode())) {
                    candidates.add(secret);
                }
            }
        }

        if (candidates.isEmpty()) {
            throw new ApplicationException("No {} OrganizationSecret or UserSecret found. Provide sourceSecretId.", SECRET_TYPE_ATLASSIAN_API);
        }
        if (candidates.size() > 1) {
            throw new ApplicationException("Multiple {} secrets found. Provide sourceSecretId.", SECRET_TYPE_ATLASSIAN_API);
        }
        return candidates.get(0);
    }

    private void validateAtlassianSecret(Secret secret, String organizationCode) {
        if (secret == null) {
            throw new ApplicationException("{} secret not found", SECRET_TYPE_ATLASSIAN_API);
        }
        if (secret.getType() == null || !SECRET_TYPE_ATLASSIAN_API.equals(secret.getType().getCode())) {
            throw new ApplicationException("Secret {} must be of type {}", secret.getId(), SECRET_TYPE_ATLASSIAN_API);
        }
        if (secret instanceof OrganizationSecret organizationSecret) {
            Organization expected = resolveOrganization(organizationCode);
            List<Integer> allowedOrganizations = organizationManager.listParentIdsRecursively(expected.getId());
            if (organizationSecret.getOrganization() == null || !allowedOrganizations.contains(organizationSecret.getOrganization().getId())) {
                throw new ApplicationException("OrganizationSecret {} does not belong to organization {} or its hierarchy", secret.getId(), expected.getCode());
            }
            return;
        }
        if (secret instanceof UserSecret userSecret) {
            User user = Auth.getAuthenticatedUser();
            if (user == null || userSecret.getUser() == null || !Objects.equals(user.getId(), userSecret.getUser().getId())) {
                throw new ApplicationException("UserSecret {} does not belong to the authenticated user", secret.getId());
            }
            return;
        }
        throw new ApplicationException("Secret {} must be an OrganizationSecret or UserSecret", secret.getId());
    }

    private String stringSecretAttribute(Secret secret, String code) {
        Object value = secret.getAttributeValue(code, null);
        return value == null ? null : String.valueOf(value);
    }

    private String buildBoardExportUrl(String boardId, String apiKey, String apiToken, boolean includeActions) {
        StringBuilder url = new StringBuilder("https://api.trello.com/1/boards/")
                .append(encodePathSegment(boardId))
                .append("?fields=all")
                .append("&lists=all")
                .append("&cards=all")
                .append("&card_fields=all")
                .append("&card_attachments=true")
                .append("&card_attachment_fields=all")
                .append("&checklists=all")
                .append("&members=all")
                .append("&member_fields=all")
                .append("&labels=all")
                .append("&customFields=true")
                .append("&card_customFieldItems=true")
                .append("&actions=").append(includeActions ? "all" : "none")
                .append("&key=").append(urlParam(apiKey))
                .append("&token=").append(urlParam(apiToken));
        return url.toString();
    }

    private List<StagedMedia> stageAuthenticatedAttachments(JsonNode board, String apiKey, String apiToken, boolean downloadExternalUrls, Path dir,
            List<String> warnings) {
        List<StagedMedia> staged = new ArrayList<>();
        for (JsonNode card : array(board, "cards")) {
            String cardId = text(card, "id");
            for (JsonNode attachment : array(card, "attachments")) {
                String attachmentId = text(attachment, "id");
                String originalName = firstNonBlank(text(attachment, "fileName"), text(attachment, "name"), attachmentId, "media");
                String fileName = safeFileName(originalName);
                String sourceUrl = text(attachment, "url");
                String downloadUrl;
                Map<String, String> headers = null;
                if (Boolean.TRUE.equals(bool(attachment, "isUpload"))) {
                    downloadUrl = "https://api.trello.com/1/cards/" + encodePathSegment(cardId)
                            + "/attachments/" + encodePathSegment(attachmentId)
                            + "/download/" + encodePathSegment(originalName);
                    headers = Map.of("Authorization", trelloOAuthHeader(apiKey, apiToken));
                } else if (downloadExternalUrls && isDownloadableMediaUrl(sourceUrl)) {
                    downloadUrl = sourceUrl;
                } else {
                    continue;
                }
                Path target = dir.resolve(UUID.randomUUID() + "-" + fileName);
                try {
                    httpDownload(downloadUrl, target, headers);
                    staged.add(new StagedMedia(cardId, attachmentId, attachmentSourceRef(attachment), fileName, target));
                } catch (Exception e) {
                    warnings.add("Could not download source attachment " + firstNonBlank(attachmentId, fileName) + ": " + e.getMessage());
                }
            }
        }
        return staged;
    }

    private List<StagedMedia> stageBoardAssets(JsonNode board, Path dir, List<String> warnings) {
        List<StagedMedia> staged = new ArrayList<>();
        Set<String> urls = new LinkedHashSet<>();
        JsonNode prefs = board.path("prefs");
        addAssetUrl(urls, text(prefs, "backgroundImage"));
        for (JsonNode scaled : array(prefs, "backgroundImageScaled")) {
            addAssetUrl(urls, text(scaled, "url"));
        }
        int index = 1;
        for (String url : urls) {
            String fileName = safeFileName(firstNonBlank(fileNameFromUrl(url), "board-asset-" + index));
            Path target = dir.resolve(UUID.randomUUID() + "-" + fileName);
            try {
                httpDownload(url, target, null);
                staged.add(new StagedMedia(null, "board-asset-" + index, url, fileName, target));
            } catch (Exception e) {
                warnings.add("Could not download board asset " + url + ": " + e.getMessage());
            }
            index++;
        }
        return staged;
    }

    private void addAssetUrl(Set<String> urls, String url) {
        if (isHttpUrl(url)) {
            urls.add(url);
        }
    }

    private Map<String, List<String>> saveStagedMedia(List<StagedMedia> staged, MediaLibrary library, ResultCounter created, List<String> warnings) {
        Map<String, List<String>> byCard = new LinkedHashMap<>();
        for (StagedMedia media : staged) {
            try {
                Media item = saveStagedMediaItem(media, library);
                byCard.computeIfAbsent(media.cardId, k -> new ArrayList<>()).add(item.getId());
                created.inc("media");
            } catch (Exception e) {
                warnings.add("Could not save media " + media.url + ": " + e.getMessage());
            }
        }
        return byCard;
    }

    private Map<String, List<Map<String, Object>>> saveExportedMedia(List<StagedMedia> staged, MediaLibrary library, ResultCounter created,
            List<String> warnings) {
        Map<String, List<Map<String, Object>>> byCard = new LinkedHashMap<>();
        for (StagedMedia media : staged) {
            try {
                Media item = saveStagedMediaItem(media, library);
                byCard.computeIfAbsent(blank(media.cardId) ? "BOARD" : media.cardId, k -> new ArrayList<>()).add(orderedMap(
                        "id", item.getId(),
                        "name", item.getName(),
                        "mediaType", mediaType(item),
                        "sourceAttachmentId", media.attachmentId,
                        "sourceUrl", media.url));
                created.inc("media");
            } catch (Exception e) {
                warnings.add("Could not save exported media " + media.url + ": " + e.getMessage());
            }
        }
        return byCard;
    }

    @SuppressWarnings({ "rawtypes", "unchecked" })
    private Media saveStagedMediaItem(StagedMedia staged, MediaLibrary library) throws IOException {
        IMediaProcessor processor = MediaProcessor.getProcessor(staged.path.toFile());
        if (processor == null) {
            throw new ApplicationException("No media processor found for file: {}", staged.path);
        }
        Media media = (Media) processor.newInstance();
        media.setName(staged.name);
        media.setMediaLibrary(library);
        media.setRemoteUrl(staged.url);
        return (Media) processor.saveMediaWithContent(media, staged.path.toFile());
    }

    private Map<String, List<String>> findSourceMediaInLibrary(JsonNode board, MediaLibrary library) {
        Map<String, List<String>> byCard = new LinkedHashMap<>();
        Map<String, String> bySource = new LinkedHashMap<>();
        for (Media media : mediaManager.getByLibrary(library)) {
            if (!blank(media.getRemoteUrl())) {
                bySource.put(media.getRemoteUrl(), media.getId());
            }
        }
        for (JsonNode card : array(board, "cards")) {
            String cardId = text(card, "id");
            for (JsonNode attachment : array(card, "attachments")) {
                String mediaId = firstNonBlank(
                        bySource.get(attachmentSourceRef(attachment)),
                        bySource.get(text(attachment, "url")));
                if (!blank(mediaId)) {
                    byCard.computeIfAbsent(cardId, k -> new ArrayList<>()).add(mediaId);
                }
            }
        }
        return byCard;
    }

    private void mergeMediaIds(Map<String, List<String>> target, Map<String, List<String>> source) {
        for (Map.Entry<String, List<String>> entry : source.entrySet()) {
            List<String> values = target.computeIfAbsent(entry.getKey(), k -> new ArrayList<>());
            for (String id : entry.getValue()) {
                if (!values.contains(id)) {
                    values.add(id);
                }
            }
        }
    }

    private void download(String url, Path target) throws IOException {
        try (var in = new URL(url).openStream(); var out = Files.newOutputStream(target)) {
            byte[] buffer = new byte[8192];
            int read;
            int total = 0;
            while ((read = in.read(buffer)) >= 0) {
                total += read;
                if (total > MAX_DOWNLOAD_BYTES) {
                    throw new IOException("Download exceeds max size " + MAX_DOWNLOAD_BYTES);
                }
                out.write(buffer, 0, read);
            }
        }
    }

    private void httpDownload(String url, Path target, Map<String, String> headers) throws IOException {
        Files.write(target, httpGetBytes(url, headers));
    }

    private byte[] httpGetBytes(String url, Map<String, String> headers) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("Accept", "*/*");
        if (headers != null) {
            for (Map.Entry<String, String> header : headers.entrySet()) {
                connection.setRequestProperty(header.getKey(), header.getValue());
            }
        }
        int status = connection.getResponseCode();
        if (status >= 300 && status < 400) {
            String redirect = connection.getHeaderField("Location");
            if (!blank(redirect)) {
                return httpGetBytes(redirect, null);
            }
        }
        if (status < 200 || status >= 300) {
            throw new IOException("HTTP " + status + " from " + redactUrl(url));
        }
        try (var in = connection.getInputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            int total = 0;
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            while ((read = in.read(buffer)) >= 0) {
                total += read;
                if (total > MAX_DOWNLOAD_BYTES) {
                    throw new IOException("Download exceeds max size " + MAX_DOWNLOAD_BYTES);
                }
                out.write(buffer, 0, read);
            }
            return out.toByteArray();
        } finally {
            connection.disconnect();
        }
    }

    private boolean isDownloadableMediaUrl(String url) {
        if (!isHttpUrl(url)) {
            return false;
        }
        String lower = url.toLowerCase(Locale.ROOT);
        return lower.contains("/download/")
                || lower.matches(".*\\.(png|jpg|jpeg|gif|webp|svg|pdf|mp4|mov|mp3|wav)(\\?.*)?$");
    }

    private boolean isHttpUrl(String url) {
        return !blank(url) && (url.startsWith("http://") || url.startsWith("https://"));
    }

    private String trelloOAuthHeader(String apiKey, String apiToken) {
        return "OAuth oauth_consumer_key=\"" + apiKey + "\", oauth_token=\"" + apiToken + "\"";
    }

    private String urlParam(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String encodePathSegment(String value) {
        return URLEncoder.encode(firstNonBlank(value, ""), StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String mediaType(Media media) {
        if (!blank(media.getMediaType())) {
            return media.getMediaType();
        }
        String typeName = media.getClass().getSimpleName();
        if ("Image".equals(typeName)) {
            return "image";
        }
        if ("Video".equals(typeName)) {
            return "video";
        }
        if ("Sound".equals(typeName)) {
            return "sound";
        }
        return "mediaAsset";
    }

    private String redactUrl(String url) {
        if (blank(url)) {
            return url;
        }
        return url.replaceAll("([?&](key|token)=)[^&]+", "$1***");
    }

    private String sourceBoardRef(String boardId) {
        return "kanban://board/" + boardId;
    }

    private String attachmentSourceRef(JsonNode attachment) {
        String id = text(attachment, "id");
        return blank(id) ? text(attachment, "url") : "kanban://attachment/" + id;
    }

    private String findSavedBoardMediaId(Map<String, List<Map<String, Object>>> savedByCard, String boardId) {
        for (Map<String, Object> media : savedByCard.getOrDefault("BOARD", List.of())) {
            if (Objects.equals(boardId, media.get("sourceAttachmentId"))) {
                Object id = media.get("id");
                return id == null ? null : String.valueOf(id);
            }
        }
        return null;
    }

    private String fileNameFromUrl(String url) {
        try {
            String path = new URI(url).getPath();
            if (blank(path)) {
                return "";
            }
            int slash = path.lastIndexOf('/');
            return slash >= 0 ? path.substring(slash + 1) : path;
        } catch (Exception e) {
            return "";
        }
    }

    private void validateAttributes(Set<EntityTypeAttribute> existing, JsonNode required, String label) {
        for (JsonNode attr : required) {
            requireAttribute(existing, text(attr, "code"), text(attr, "className", String.class.getName()),
                    attr.path("multiselect").asBoolean(false), label);
        }
    }

    private void requireAttribute(Set<EntityTypeAttribute> existing, String code, String className, boolean multiselect, String label) {
        EntityTypeAttribute found = existing == null ? null : existing.stream()
                .filter(a -> code.equals(a.getCode()))
                .findFirst()
                .orElse(null);
        if (found == null) {
            throw new ApplicationException("{} is missing required attribute {}", label, code);
        }
        if (!Objects.equals(found.getClassName(), className)) {
            throw new ApplicationException("{} attribute {} has class {} but mapping requires {}", label, code, found.getClassName(), className);
        }
        if (Boolean.TRUE.equals(multiselect) != Boolean.TRUE.equals(found.getMultiselect())) {
            throw new ApplicationException("{} attribute {} has incompatible multiselect flag", label, code);
        }
    }

    private Set<EntityTypeAttribute> attributes(JsonNode nodes) {
        Set<EntityTypeAttribute> attrs = new LinkedHashSet<>();
        for (JsonNode node : nodes) {
            EntityTypeAttribute attr = new EntityTypeAttribute();
            attr.setCode(text(node, "code"));
            attr.setClassName(text(node, "className", String.class.getName()));
            attr.setRequired(node.path("required").asBoolean(false));
            attr.setMultiselect(node.path("multiselect").asBoolean(false));
            attr.setFreeValue(node.path("freeValue").asBoolean(true));
            attr.setUnique(node.path("unique").asBoolean(false));
            attr.setInputFormat(text(node, "inputFormat", null));
            attr.setDefaultValue(jsonScalar(node.path("defaultValue")));
            attr.setNls(readNls(node.path("nls"), text(node, "code"), null));
            attr.setOptions(attributeOptions(node.path("options")));
            attr.setEntityTypes(attributeOptions(node.path("entityTypes")));
            attrs.add(attr);
        }
        return attrs;
    }

    private Set<AttributeGroup> attributeGroups(JsonNode nodes) {
        Set<AttributeGroup> groups = new LinkedHashSet<>();
        for (JsonNode node : nodes) {
            groups.add(new AttributeGroup(text(node, "code"), readNls(node.path("nls"), text(node, "code"), null)));
        }
        return groups;
    }

    private List<Map<String, List<AttributeOrder>>> attributeOrder(JsonNode nodes) {
        return (List<Map<String, List<AttributeOrder>>>) (List<?>) mapper.convertValue(nodes,
                mapper.getTypeFactory().constructCollectionType(List.class, Map.class));
    }

    private Map<String, Object> readMap(JsonNode node) {
        if (node == null || !node.isObject()) {
            return new HashMap<>();
        }
        return mapper.convertValue(node, Map.class);
    }

    private LinkedHashSet<AttributeOption> attributeOptions(JsonNode nodes) {
        LinkedHashSet<AttributeOption> options = new LinkedHashSet<>();
        for (JsonNode node : nodes) {
            options.add(new AttributeOption(jsonScalar(node.path("value")), readNls(node.path("nls"), text(node, "value"), null)));
        }
        return options;
    }

    private Map<String, Map<String, String>> readNls(JsonNode node, String name, String description) {
        if (node != null && node.isObject() && node.size() > 0) {
            return mapper.convertValue(node, Map.class);
        }
        return nls(name, description);
    }

    private Map<String, Map<String, String>> nls(String name, String description) {
        Map<String, String> en = new LinkedHashMap<>();
        en.put("NAME", blank(name) ? "" : name);
        if (!blank(description)) {
            en.put("DESCRIPTION", description);
        }
        return Map.of("en", en);
    }

    private ObjectNode nlsNode(String name, String description) {
        return mapper.valueToTree(nls(name, description));
    }

    private List<String> labels(JsonNode card, JsonNode board) {
        List<String> labels = new ArrayList<>();
        for (JsonNode label : array(card, "labels")) {
            String name = firstNonBlank(text(label, "name"), text(label, "color"));
            if (!blank(name)) {
                labels.add(name);
            }
        }
        return labels;
    }

    private List<String> checklists(JsonNode card, JsonNode board) {
        Set<String> checklistIds = new HashSet<>();
        for (JsonNode id : array(card, "idChecklists")) {
            checklistIds.add(id.asText());
        }
        List<String> values = new ArrayList<>();
        for (JsonNode checklist : array(board, "checklists")) {
            if (!checklistIds.contains(text(checklist, "id"))) {
                continue;
            }
            String checklistName = text(checklist, "name");
            for (JsonNode item : array(checklist, "checkItems")) {
                values.add(checklistName + ": [" + text(item, "state") + "] " + text(item, "name"));
            }
        }
        return values;
    }

    private Map<String, String> mediaTypesById(Map<String, List<String>> sourceMediaIds) {
        Map<String, String> types = new LinkedHashMap<>();
        for (List<String> mediaIds : sourceMediaIds.values()) {
            for (String mediaId : mediaIds) {
                if (types.containsKey(mediaId)) {
                    continue;
                }
                Media media = mediaManager.get(mediaId);
                if (media != null) {
                    types.put(mediaId, mediaType(media));
                }
            }
        }
        return types;
    }

    private List<Map<String, String>> mediaRefsForCard(JsonNode card, Map<String, List<String>> sourceMediaIds, Map<String, String> mediaTypesById) {
        List<Map<String, String>> refs = new ArrayList<>();
        for (String mediaId : sourceMediaIds.getOrDefault(text(card, "id"), List.of())) {
            String mediaType = mediaTypesById.get(mediaId);
            refs.add(blank(mediaType) ? Map.of("id", mediaId) : Map.of("id", mediaId, "type", mediaType));
        }
        return refs;
    }

    private LocalDateTime trelloDateTime(String value) {
        if (blank(value)) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(value);
            } catch (Exception ignoredAgain) {
                return null;
            }
        }
    }

    private Map<String, String> listIdToStateCode(JsonNode board) {
        Map<String, String> map = new LinkedHashMap<>();
        Set<String> used = new HashSet<>();
        used.add("INITIAL");
        used.add("ARCHIVED");
        for (JsonNode list : array(board, "lists")) {
            String stateCode = uniqueCode(code(text(list, "name")), used);
            used.add(stateCode);
            map.put(text(list, "id"), stateCode);
        }
        return map;
    }

    private boolean hasState(Object entity, String stateCode) {
        try {
            Collection<?> states = (Collection<?>) entity.getClass().getMethod("getStates").invoke(entity);
            if (states == null) {
                return false;
            }
            for (Object state : states) {
                if (state instanceof WorkflowState workflowState && stateCode.equals(workflowState.getCode())) {
                    return true;
                }
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    private String currentStateCode(Object entity) {
        try {
            Collection<?> states = (Collection<?>) entity.getClass().getMethod("getStates").invoke(entity);
            if (states == null || states.isEmpty()) {
                return "INITIAL";
            }
            Object first = states.iterator().next();
            if (first instanceof WorkflowState workflowState) {
                return workflowState.getCode();
            }
        } catch (Exception ignored) {
        }
        return "INITIAL";
    }

    private String bestUpdatedAt(JsonNode node) {
        return firstNonBlank(text(node, "dateLastActivity"), text(node, "dateClosed"), text(node, "datePluginDisable"));
    }

    private String boardName(JsonNode board) {
        return firstNonBlank(text(board, "name"), "Imported Kanban Board");
    }

    private String boardDescriptionSummary(JsonNode board) {
        String desc = text(board, "desc");
        if (blank(desc)) {
            return "Mapping generated from Kanban board export.";
        }
        return desc.length() > 500 ? desc.substring(0, 500) : desc;
    }

    private Map<String, Object> boardSummary(JsonNode board) {
        return orderedMap(
                "lists", array(board, "lists").size(),
                "cards", array(board, "cards").size(),
                "members", array(board, "members").size(),
                "labels", array(board, "labels").size(),
                "checklists", array(board, "checklists").size(),
                "attachments", countAttachments(board));
    }

    private int countAttachments(JsonNode board) {
        int count = 0;
        for (JsonNode card : array(board, "cards")) {
            count += array(card, "attachments").size();
        }
        return count;
    }

    private JsonNode readUploadedBoard(List<String> files) throws IOException {
        if (files == null || files.size() != 1) {
            throw new ApplicationException("Exactly one board export file is required");
        }
        return mapper.readTree(Path.of(URI.create(files.get(0))).toFile());
    }

    private JsonNode readBoardSource(Map<String, Object> args, List<String> files) throws Exception {
        String boardMediaId = firstNonBlank(stringArg(args, "boardMediaId", null), stringArg(args, "sourceMediaId", null));
        if (blank(boardMediaId)) {
            return readUploadedBoard(files);
        }
        String id = boardMediaId;
        return tx.getInNewTx(() -> {
            try {
                Media media = mediaManager.get(id);
                if (media == null) {
                    throw new ApplicationException("Board export media not found: {}", id);
                }
                var processor = MediaProcessor.getProcessor(media);
                if (processor == null) {
                    throw new ApplicationException("No media processor for board export media: {}", id);
                }
                return mapper.readTree(processor.getFile(media));
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    private Map<String, Object> args(Object... entries) {
        Map<String, Object> values = new LinkedHashMap<>();
        for (int i = 0; i < entries.length; i += 2) {
            Object value = entries[i + 1];
            if (value != null) {
                values.put(String.valueOf(entries[i]), value);
            }
        }
        return values;
    }

    private ObjectNode readObject(String json) throws IOException {
        JsonNode node = mapper.readTree(json);
        if (!node.isObject()) {
            throw new ApplicationException("Expected JSON object");
        }
        return (ObjectNode) node;
    }

    private String writeJson(JsonNode node) {
        try {
            return mapper.writeValueAsString(node);
        } catch (Exception e) {
            throw new ApplicationException(e);
        }
    }

    private void validateNoConflictComments(String content, String scriptCode) {
        if (content != null && content.contains("<= CONFLICT")) {
            throw new ApplicationException("Mapping script {} contains unresolved merge conflict comments", scriptCode);
        }
    }

    private MergeResult mergeMapping(ObjectNode current, ObjectNode inferred, String path) {
        ObjectNode merged = current.deepCopy();
        List<Map<String, Object>> conflicts = new ArrayList<>();
        inferred.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            JsonNode next = entry.getValue();
            String childPath = path + "/" + key;
            if (!merged.has(key) || merged.get(key).isNull()) {
                merged.set(key, next);
                return;
            }
            JsonNode existing = merged.get(key);
            if (existing.isObject() && next.isObject()) {
                MergeResult child = mergeMapping((ObjectNode) existing, (ObjectNode) next, childPath);
                merged.set(key, child.merged());
                conflicts.addAll(child.conflicts());
            } else if (existing.isArray() && next.isArray()) {
                ArrayNode mergedArray = mergeArray(existing, next);
                merged.set(key, mergedArray);
            } else if (!existing.equals(next)) {
                conflicts.add(orderedMap("path", childPath, "existing", jsonScalar(existing), "inferred", jsonScalar(next)));
            }
        });
        return new MergeResult(merged, conflicts);
    }

    private ArrayNode mergeArray(JsonNode existing, JsonNode inferred) {
        ArrayNode array = mapper.createArrayNode();
        Set<String> seen = new LinkedHashSet<>();
        for (JsonNode item : existing) {
            array.add(item);
            seen.add(arrayIdentity(item));
        }
        for (JsonNode item : inferred) {
            if (seen.add(arrayIdentity(item))) {
                array.add(item);
            }
        }
        return array;
    }

    private String arrayIdentity(JsonNode node) {
        if (node.isObject()) {
            String code = text(node, "code", null);
            String source = text(node, "source", null);
            String target = text(node, "target", null);
            return firstNonBlank(code, source + "->" + target, node.toString());
        }
        return node.toString();
    }

    private String annotateConflicts(ObjectNode mapping, List<Map<String, Object>> conflicts) {
        StringBuilder sb = new StringBuilder(writeJson(mapping));
        sb.append("\n\n");
        for (Map<String, Object> conflict : conflicts) {
            sb.append("// ").append(conflict.get("path"))
                    .append(" <= CONFLICT inferred: ")
                    .append(conflict.get("inferred"))
                    .append(" existing: ")
                    .append(conflict.get("existing"))
                    .append("\n");
        }
        return sb.toString();
    }

    private String markdownToHtml(String markdown) {
        if (blank(markdown)) {
            return "";
        }
        try {
            Class<?> parserClass = Class.forName("org.commonmark.parser.Parser");
            Object parserBuilder = parserClass.getMethod("builder").invoke(null);
            List<Object> extensions = commonMarkExtensions();
            if (!extensions.isEmpty()) {
                parserBuilder.getClass().getMethod("extensions", Iterable.class).invoke(parserBuilder, extensions);
            }
            Object parser = parserBuilder.getClass().getMethod("build").invoke(parserBuilder);
            Object node = parserClass.getMethod("parse", String.class).invoke(parser, markdown);
            Class<?> rendererClass = Class.forName("org.commonmark.renderer.html.HtmlRenderer");
            Object rendererBuilder = rendererClass.getMethod("builder").invoke(null);
            if (!extensions.isEmpty()) {
                rendererBuilder.getClass().getMethod("extensions", Iterable.class).invoke(rendererBuilder, extensions);
            }
            Object renderer = rendererBuilder.getClass().getMethod("build").invoke(rendererBuilder);
            Class<?> nodeClass = Class.forName("org.commonmark.node.Node");
            return (String) rendererClass.getMethod("render", nodeClass).invoke(renderer, node);
        } catch (Exception ignored) {
            return fallbackMarkdownToHtml(markdown);
        }
    }

    private List<Object> commonMarkExtensions() {
        try {
            Class<?> tablesExtensionClass = Class.forName("org.commonmark.ext.gfm.tables.TablesExtension");
            return List.of(tablesExtensionClass.getMethod("create").invoke(null));
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private String fallbackMarkdownToHtml(String markdown) {
        String normalized = markdown.replace("\r\n", "\n").replace('\r', '\n');
        StringBuilder html = new StringBuilder();
        StringBuilder paragraph = new StringBuilder();
        StringBuilder code = new StringBuilder();
        boolean inCodeBlock = false;
        String codeLanguage = "";

        for (String line : normalized.split("\n", -1)) {
            String trimmed = line.stripLeading();
            if (trimmed.startsWith("```")) {
                if (inCodeBlock) {
                    appendCodeBlock(html, code, codeLanguage);
                    code.setLength(0);
                    codeLanguage = "";
                    inCodeBlock = false;
                } else {
                    appendParagraph(html, paragraph);
                    codeLanguage = trimmed.length() > 3 ? trimmed.substring(3).trim() : "";
                    inCodeBlock = true;
                }
                continue;
            }

            if (inCodeBlock) {
                code.append(line).append('\n');
                continue;
            }

            if (line.isBlank()) {
                appendParagraph(html, paragraph);
            } else {
                if (paragraph.length() > 0) {
                    paragraph.append('\n');
                }
                paragraph.append(line);
            }
        }

        if (inCodeBlock) {
            appendCodeBlock(html, code, codeLanguage);
        } else {
            appendParagraph(html, paragraph);
        }
        return html.toString();
    }

    private void appendParagraph(StringBuilder html, StringBuilder paragraph) {
        if (paragraph.length() == 0) {
            return;
        }
        html.append("<p>")
                .append(renderInlineMarkdown(paragraph.toString()).replace("\n", "<br>"))
                .append("</p>\n");
        paragraph.setLength(0);
    }

    private void appendCodeBlock(StringBuilder html, StringBuilder code, String language) {
        String classAttribute = blank(language) ? "" : " class=\"language-" + escapeHtmlAttribute(language) + "\"";
        html.append("<pre><code").append(classAttribute).append(">")
                .append(escapeHtml(stripTrailingNewline(code.toString())))
                .append("</code></pre>\n");
    }

    private String renderInlineMarkdown(String text) {
        StringBuilder html = new StringBuilder();
        int index = 0;
        while (index < text.length()) {
            int start = text.indexOf('`', index);
            if (start < 0) {
                html.append(renderInlineText(text.substring(index)));
                break;
            }
            int end = text.indexOf('`', start + 1);
            if (end < 0) {
                html.append(renderInlineText(text.substring(index)));
                break;
            }
            html.append(renderInlineText(text.substring(index, start)));
            html.append("<code>").append(escapeHtml(text.substring(start + 1, end))).append("</code>");
            index = end + 1;
        }
        return html.toString();
    }

    private String renderInlineText(String text) {
        String rendered = escapeHtml(text);
        rendered = rendered.replaceAll("\\[([^\\]]+)]\\((https?://[^\\s)]+)(?:\\s+&quot;[^&]*&quot;)?\\)", "<a href=\"$2\">$1</a>");
        rendered = rendered.replaceAll("\\*\\*([^*]+)\\*\\*", "<strong>$1</strong>");
        rendered = rendered.replaceAll("\\*([^*]+)\\*", "<em>$1</em>");
        return rendered;
    }

    private String stripTrailingNewline(String text) {
        if (text.endsWith("\n")) {
            return text.substring(0, text.length() - 1);
        }
        return text;
    }

    private String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String escapeHtmlAttribute(String text) {
        return escapeHtml(text).replace("\"", "&quot;");
    }

    private Organization resolveOrganization(String code) {
        Organization org = organizationManager.getByCode(code, false, jakarta.persistence.LockModeType.NONE);
        if (org == null) {
            org = Auth.getAuthenticatedOrganization();
        }
        if (org == null) {
            org = organizationManager.getSystemOrganization();
        }
        return org;
    }

    private String defaultOrganizationCode() {
        Organization org = Auth.getAuthenticatedOrganization();
        return org == null ? Organization.SYSTEM : org.getCode();
    }

    private String stringArg(Map<String, Object> args, String key, String defaultValue) {
        Object value = args.get(key);
        return value == null || blank(value.toString()) ? defaultValue : value.toString();
    }

    private boolean booleanArg(Map<String, Object> args, String key, boolean defaultValue) {
        Object value = args.get(key);
        return value == null ? defaultValue : Boolean.parseBoolean(value.toString());
    }

    private Integer integerArg(Map<String, Object> args, String key, Integer defaultValue) {
        Object value = args.get(key);
        if (value == null || blank(value.toString())) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(value.toString());
    }

    private ArrayNode array(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isArray() ? (ArrayNode) value : mapper.createArrayNode();
    }

    private Boolean bool(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asBoolean();
    }

    private String text(JsonNode node, String field) {
        return text(node, field, "");
    }

    private String text(JsonNode node, String field, String defaultValue) {
        JsonNode value = node == null ? null : node.path(field);
        return value == null || value.isMissingNode() || value.isNull() ? defaultValue : value.asText(defaultValue);
    }

    private String text(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? "" : node.asText();
    }

    private boolean blank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!blank(value)) {
                return value;
            }
        }
        return "";
    }

    private String code(String value) {
        String code = firstNonBlank(value, "KANBAN").toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
        code = code.replaceAll("^_+|_+$", "");
        return blank(code) ? "KANBAN" : code;
    }

    private String uniqueCode(String base, Set<String> used) {
        String candidate = blank(base) ? "STATE" : base;
        int i = 2;
        while (used.contains(candidate)) {
            candidate = base + "_" + i++;
        }
        return candidate;
    }

    private String eventCode(String source, String target) {
        return code(source) + "_TO_" + code(target);
    }

    private String eventName(String target) {
        return "Move to " + target.replace('_', ' ');
    }

    private ObjectNode workflowState(String code, String name, ObjectNode... events) {
        ObjectNode state = mapper.createObjectNode();
        state.put("code", code);
        state.set("nls", nlsNode(firstNonBlank(name, code), null));
        state.set("image", mapper.nullNode());
        state.putObject("style");
        state.putArray("attributes");
        ArrayNode eventArray = state.putArray("events");
        for (ObjectNode event : events) {
            eventArray.add(event);
        }
        return state;
    }

    private ObjectNode event(String code, String target, String name) {
        ObjectNode event = mapper.createObjectNode();
        event.put("code", code);
        event.put("target", target);
        event.set("nls", nlsNode(name, null));
        event.set("image", mapper.nullNode());
        event.putObject("style");
        event.putArray("attributes");
        return event;
    }

    private ObjectNode pathMapping(String source, String target) {
        ObjectNode node = mapper.createObjectNode();
        node.put("source", source);
        node.put("target", target);
        return node;
    }

    private ObjectNode pathMapping(String source, String target, String convert) {
        ObjectNode node = pathMapping(source, target);
        node.put("convert", convert);
        return node;
    }

    private ObjectNode ignore(String path, String reason) {
        ObjectNode node = mapper.createObjectNode();
        node.put("path", path);
        node.put("reason", reason);
        return node;
    }

    private ArrayNode labelOptions(JsonNode board) {
        ArrayNode options = mapper.createArrayNode();
        Set<String> used = new LinkedHashSet<>();
        for (JsonNode label : array(board, "labels")) {
            String value = firstNonBlank(text(label, "name"), text(label, "color"), text(label, "id"));
            if (blank(value) || !used.add(value)) {
                continue;
            }
            ObjectNode option = options.addObject();
            option.put("value", value);
            option.set("nls", nlsNode(value, blank(text(label, "color")) ? null : "Color: " + text(label, "color")));
        }
        return options;
    }

    private ArrayNode mediaEntityTypes() {
        ArrayNode types = mapper.createArrayNode();
        for (String type : List.of("image", "video", "sound", "mediaAsset")) {
            ObjectNode option = types.addObject();
            option.put("value", type);
            option.set("nls", nlsNode(type, null));
        }
        return types;
    }

    private ObjectNode addAttribute(ArrayNode attrs, String code, String className, boolean required, boolean multiselect, String name,
            String description, boolean hidden) {
        ObjectNode attr = attrs.addObject();
        attr.put("code", code);
        attr.put("className", className);
        attr.put("required", required);
        attr.put("multiselect", multiselect);
        attr.put("hidden", hidden);
        attr.set("nls", nlsNode(name, description));
        return attr;
    }

    private String safeFileName(String name) {
        String file = firstNonBlank(name, "media").replaceAll("[\\\\/:*?\"<>|]+", "_");
        return file.length() > 120 ? file.substring(0, 120) : file;
    }

    private String derivedMappingCode(JsonNode board) {
        return "KANBAN_BOARD_MAPPING_" + code(boardName(board));
    }

    private Object jsonScalar(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isTextual()) {
            return node.asText();
        }
        if (node.isNumber()) {
            return node.numberValue();
        }
        if (node.isBoolean()) {
            return node.asBoolean();
        }
        return node.toString();
    }

    private Project findProjectByCode(String code) {
        if (blank(code)) {
            return null;
        }
        return projectManager.listAll().stream()
                .filter(project -> code.equals(project.getCode()))
                .findFirst()
                .orElse(null);
    }

    private ProjectType findProjectTypeByCode(String code) {
        if (blank(code)) {
            return null;
        }
        return projectTypeManager.listAll().stream()
                .filter(type -> code.equals(type.getCode()))
                .findFirst()
                .orElse(null);
    }

    private TaskType findTaskTypeByCode(String code) {
        if (blank(code)) {
            return null;
        }
        return taskTypeManager.listAll().stream()
                .filter(type -> code.equals(type.getCode()))
                .findFirst()
                .orElse(null);
    }

    private Workflow findWorkflowByCode(String code) {
        if (blank(code)) {
            return null;
        }
        return workflowManager.listAll().stream()
                .filter(workflow -> code.equals(workflow.getCode()))
                .findFirst()
                .orElse(null);
    }

    private MediaLibrary findMediaLibraryByCode(String code) {
        if (blank(code)) {
            return null;
        }
        return mediaLibraryManager.listAll().stream()
                .filter(library -> code.equals(library.getCode()))
                .findFirst()
                .orElse(null);
    }

    private List<Task> tasksForProject(Project project) {
        if (project == null || project.getId() == null) {
            return List.of();
        }
        return taskManager.listAll().stream()
                .filter(task -> task.getProject() != null && Objects.equals(task.getProject().getId(), project.getId()))
                .toList();
    }

    private List<MediaLibrary> mediaLibraryTreePostOrder(MediaLibrary root) {
        if (root == null) {
            return List.of();
        }
        List<MediaLibrary> libraries = new ArrayList<>();
        collectMediaLibraryTreePostOrder(root, libraries);
        return libraries;
    }

    private void collectMediaLibraryTreePostOrder(MediaLibrary library, List<MediaLibrary> libraries) {
        for (MediaLibrary child : mediaLibraryManager.findByParent(library)) {
            collectMediaLibraryTreePostOrder(child, libraries);
        }
        libraries.add(library);
    }

    private DefinitionRefCounts definitionRefCounts(Project project, Set<Long> taskIdsToDelete, ProjectType projectType,
            TaskType taskType, Workflow projectWorkflow, Workflow taskWorkflow) {
        Long projectId = project == null ? null : project.getId();
        DefinitionRefCounts refs = new DefinitionRefCounts();
        if (projectType != null) {
            refs.remainingProjectsForProjectType = (int) projectManager.listAll().stream()
                    .filter(p -> p.getType() != null && Objects.equals(p.getType().getId(), projectType.getId()))
                    .filter(p -> !Objects.equals(p.getId(), projectId))
                    .count();
        }
        if (taskType != null) {
            refs.remainingTasksForTaskType = (int) taskManager.listAll().stream()
                    .filter(task -> task.getType() != null && Objects.equals(task.getType().getId(), taskType.getId()))
                    .filter(task -> !taskIdsToDelete.contains(task.getId()))
                    .count();
        }
        if (projectWorkflow != null) {
            refs.remainingProjectsForProjectWorkflow = (int) projectManager.listAll().stream()
                    .filter(p -> p.getWorkflow() != null && Objects.equals(p.getWorkflow().getId(), projectWorkflow.getId()))
                    .filter(p -> !Objects.equals(p.getId(), projectId))
                    .count();
            refs.remainingProjectTypesForProjectWorkflow = (int) projectTypeManager.listAll().stream()
                    .filter(type -> type.getWorkflow() != null && Objects.equals(type.getWorkflow().getId(), projectWorkflow.getId()))
                    .filter(type -> projectType == null || !Objects.equals(type.getId(), projectType.getId()))
                    .count();
        }
        if (taskWorkflow != null) {
            refs.remainingTasksForTaskWorkflow = (int) taskManager.listAll().stream()
                    .filter(task -> task.getWorkflow() != null && Objects.equals(task.getWorkflow().getId(), taskWorkflow.getId()))
                    .filter(task -> !taskIdsToDelete.contains(task.getId()))
                    .count();
            refs.remainingTaskTypesForTaskWorkflow = (int) taskTypeManager.listAll().stream()
                    .filter(type -> type.getWorkflow() != null && Objects.equals(type.getWorkflow().getId(), taskWorkflow.getId()))
                    .filter(type -> taskType == null || !Objects.equals(type.getId(), taskType.getId()))
                    .count();
        }
        return refs;
    }

    private void deleteProjectTypeIfSafe(ProjectType type, int remainingReferences, boolean force, ResultCounter deleted, List<String> skipped) {
        if (type == null) {
            skipped.add("ProjectType not found");
            return;
        }
        if (remainingReferences > 0 && !force) {
            skipped.add("ProjectType " + type.getCode() + " still has " + remainingReferences + " remaining project reference(s)");
            return;
        }
        projectTypeManager.delete(type);
        deleted.inc("projectTypes");
    }

    private void deleteTaskTypeIfSafe(TaskType type, int remainingReferences, boolean force, ResultCounter deleted, List<String> skipped) {
        if (type == null) {
            skipped.add("TaskType not found");
            return;
        }
        if (remainingReferences > 0 && !force) {
            skipped.add("TaskType " + type.getCode() + " still has " + remainingReferences + " remaining task reference(s)");
            return;
        }
        taskTypeManager.delete(type);
        deleted.inc("taskTypes");
    }

    private void deleteWorkflowIfSafe(Workflow workflow, int remainingReferences, boolean force, String counterKey,
            ResultCounter deleted, List<String> skipped) {
        if (workflow == null) {
            skipped.add(counterKey + " not found");
            return;
        }
        if (remainingReferences > 0 && !force) {
            skipped.add("Workflow " + workflow.getCode() + " still has " + remainingReferences + " remaining reference(s)");
            return;
        }
        workflowManager.delete(workflow);
        deleted.inc(counterKey + "s");
    }

    private void clearImportCaches(Project project, ProjectType projectType, TaskType taskType, Workflow projectWorkflow,
            Workflow taskWorkflow, MediaLibrary mediaLibrary) {
        taskManager.clearAllCaches();
        projectManager.clearAllCaches();
        projectTypeManager.clearAllCaches();
        taskTypeManager.clearAllCaches();
        workflowManager.clearAllCaches();
        mediaManager.clearAllCaches();
        mediaLibraryManager.clearAllCaches();
    }

    private Map<String, Object> orderedMap(Object... pairs) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < pairs.length; i += 2) {
            map.put(String.valueOf(pairs[i]), pairs[i + 1]);
        }
        return map;
    }

    private record MergeResult(ObjectNode merged, List<Map<String, Object>> conflicts) {
    }

    private record AtlassianCredentials(Integer secretId, String apiKey, String apiToken) {
    }

    private final class DefinitionRefCounts {
        int remainingProjectsForProjectType;
        int remainingTasksForTaskType;
        int remainingProjectsForProjectWorkflow;
        int remainingProjectTypesForProjectWorkflow;
        int remainingTasksForTaskWorkflow;
        int remainingTaskTypesForTaskWorkflow;

        int remainingProjectWorkflowReferences() {
            return remainingProjectsForProjectWorkflow + remainingProjectTypesForProjectWorkflow;
        }

        int remainingTaskWorkflowReferences() {
            return remainingTasksForTaskWorkflow + remainingTaskTypesForTaskWorkflow;
        }

        Map<String, Object> asMap() {
            return orderedMap(
                    "projectsForProjectType", remainingProjectsForProjectType,
                    "tasksForTaskType", remainingTasksForTaskType,
                    "projectsForProjectWorkflow", remainingProjectsForProjectWorkflow,
                    "projectTypesForProjectWorkflow", remainingProjectTypesForProjectWorkflow,
                    "tasksForTaskWorkflow", remainingTasksForTaskWorkflow,
                    "taskTypesForTaskWorkflow", remainingTaskTypesForTaskWorkflow);
        }
    }

    private static final class ImportPlan {
        String projectName;
        String projectCode;
        String organizationCode;
        String projectTypeCode;
        String taskTypeCode;
        String projectWorkflowCode;
        String taskWorkflowCode;
        String missingCardPolicy;
        boolean downloadMedia;
        Map<String, Object> summary = new LinkedHashMap<>();
        Map<String, Integer> toCreate = new LinkedHashMap<>();
        Map<String, Integer> toReuse = new LinkedHashMap<>();

        Map<String, Object> asDryRunResult() {
            return Map.of(
                    "mode", "DRY_RUN",
                    "projectCode", projectCode,
                    "projectName", projectName,
                    "summary", summary,
                    "toCreate", toCreate,
                    "toReuse", toReuse,
                    "downloadMedia", downloadMedia);
        }
    }

    private static final class ResultCounter {
        final Map<String, Integer> values = new LinkedHashMap<>();

        void inc(String key) {
            values.put(key, get(key) + 1);
        }

        void add(String key, int delta) {
            values.put(key, get(key) + delta);
        }

        int get(String key) {
            return values.getOrDefault(key, 0);
        }
    }

    private static final class StagedMedia {
        final String cardId;
        final String attachmentId;
        final String url;
        final String name;
        final Path path;

        StagedMedia(String cardId, String attachmentId, String url, String name, Path path) {
            this.cardId = cardId;
            this.attachmentId = attachmentId;
            this.url = url;
            this.name = name;
            this.path = path;
        }

        void deleteQuietly() {
            try {
                Files.deleteIfExists(path);
                Path parent = path.getParent();
                if (parent != null) {
                    try {
                        Files.deleteIfExists(parent);
                    } catch (Exception ignored) {
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }
}
