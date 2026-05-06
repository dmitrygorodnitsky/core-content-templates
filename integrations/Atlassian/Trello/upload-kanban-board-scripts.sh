#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://lsrc.pixelnation.com/core}"
ORGANIZATION_CODE="${ORGANIZATION_CODE:-SYSTEM}"
API_KEY="${API_KEY:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BODY_PATH="${BODY_PATH:-$SCRIPT_DIR/KANBAN_BOARD_SCRIPTS.save.body.json}"

if [[ -z "$API_KEY" ]]; then
  echo "API_KEY is required" >&2
  echo "Example: API_KEY='...' $0" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

api_post() {
  local path="$1"
  local body="$2"
  curl -fsS \
    -X POST \
    "${BASE_URL%/}${path}" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "x-organization-code: ${ORGANIZATION_CODE}" \
    --data-binary "$body"
}

payload="$(cat "$BODY_PATH")"

importer_content="$(cat "$SCRIPT_DIR/KANBAN_BOARD_IMPORTER.java")"
mapping_content="$(cat "$SCRIPT_DIR/KANBAN_BOARD_MAPPING_DEFAULT.json")"

payload="$(
  jq \
    --arg importer "$importer_content" \
    --arg mapping "$mapping_content" \
    '(.entities[] | select(.code == "KANBAN_BOARD_IMPORTER") | .content) = $importer
     | (.entities[] | select(.code == "KANBAN_BOARD_MAPPING_DEFAULT") | .content) = $mapping
     | del(.entities[].contentFile)' \
    <<< "$payload"
)"

codes="$(jq -r '.entities[].code' <<< "$payload")"
for code in $codes; do
  list_body="$(
    jq -n --arg code "$code" '{
      offset: 0,
      pageSize: 1,
      sorting: [],
      filters: [
        {
          property: "code",
          type: "STRING",
          operator: "=",
          value: $code
        }
      ],
      mappings: [
        {name: "id"},
        {name: "code"},
        {name: "language", type: "enumeration"}
      ]
    }'
  )"
  existing_id="$(api_post "/api/script/list.json" "$list_body" | jq -r '.result[0].id // empty')"
  if [[ -n "$existing_id" ]]; then
    echo "Updating script ${code} id=${existing_id}"
    payload="$(jq --arg code "$code" --argjson id "$existing_id" '(.entities[] | select(.code == $code) | .id) = $id' <<< "$payload")"
  else
    echo "Creating script ${code}"
  fi
done

api_post "/api/script/save.json" "$payload"
echo
