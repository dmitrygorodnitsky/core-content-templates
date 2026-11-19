# AI_AWARE reference resolution

The four placeholder labels unambiguously identify existing Dictionary Types. Each target occurs once in the 17 November prod snapshot and is owned by SYSTEM. The same types exist on dev-1.

| Placeholder | Resolve by code |
|---|---|
| `<AI_TEXT_TYPE_ID>` | `AI_TEXT` |
| `<AI_VIDEO_TYPE_ID>` | `AI_VIDEO` |
| `<AI_AUDIO_TYPE_ID>` | `AI_AUDIO` |
| `<AI_PUBLIC_CHAT_TYPE_ID>` | `AI_PUBLIC_CHAT` |

Apply these replacements only to `core/dictionary-type / AI_AWARE / attributes.entityTypes` when building the import payload. Resolve target references by code in the destination environment; no numeric ID is stored in the rules. Preserve both allowed types for ASK_SERVICE and DEFAULT_ASK_SERVICE, and preserve existing AUDIO_GENERATION_SERVICE constraints including AI_REALTIME_VOICE.

This closes 12 placeholder references across 10 attributes in the static migration plan. It does not select service records, providers, models, credentials or defaults and does not prove runtime AI availability. No Core writes were performed.

The previous readiness snapshot lists these references as unresolved; this decision supersedes that finding. The three SW_FS_WS_PROPERTY_SITE references are also resolved by the subsequently approved SNOW_REMOVAL_PROPERTY rules; see migration-decisions-2026-11-17.json.
