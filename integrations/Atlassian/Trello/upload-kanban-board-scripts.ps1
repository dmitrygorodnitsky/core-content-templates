param(
    [Parameter(Mandatory = $true)]
    [string]$ApiKey,

    [string]$BaseUrl = "https://lsrc.pixelnation.com/core",

    [string]$AuthBaseUrl = "http://localhost:9001",

    [string]$OrganizationCode = "SYSTEM",

    [string]$BodyPath = (Join-Path $PSScriptRoot "KANBAN_BOARD_SCRIPTS.save.body.json"),

    [switch]$ApiKeyIsAccessToken
)

$ErrorActionPreference = "Stop"

$script:AccessToken = $ApiKey

function Get-AccessToken {
    if ($ApiKeyIsAccessToken) {
        return $ApiKey
    }

    $tokenResponse = Invoke-RestMethod `
        -Method Post `
        -Uri (($AuthBaseUrl.TrimEnd("/")) + "/oauth2/token") `
        -Headers @{
            "X-API-Key" = $ApiKey
            Accept = "application/json"
        } `
        -ContentType "application/x-www-form-urlencoded" `
        -Body "grant_type=api_key"

    return $tokenResponse.access_token
}

function Invoke-CoreJson {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [object]$Body
    )

    $headers = @{
        Authorization = "Bearer $script:AccessToken"
        Accept = "application/json"
        "x-organization-code" = $OrganizationCode
    }

    $json = $Body | ConvertTo-Json -Depth 30
    return Invoke-RestMethod `
        -Method Post `
        -Uri (($BaseUrl.TrimEnd("/")) + $Path) `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $json
}

function Get-ScriptId {
    param([Parameter(Mandatory = $true)][string]$Code)

    $request = @{
        offset = 0
        pageSize = 1
        sorting = @()
        filters = @(
            @{
                property = "code"
                type = "STRING"
                operator = "="
                value = $Code
            }
        )
        mappings = @(
            @{ name = "id" },
            @{ name = "code" },
            @{ name = "language"; type = "enumeration" }
        )
    }

    $response = Invoke-CoreJson -Path "/api/script/list.json" -Body $request
    if ($response.result -and $response.result.Count -gt 0) {
        return [int]$response.result[0].id
    }
    return $null
}

function ConvertTo-JsonStringLiteral {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Value)

    Add-Type -AssemblyName System.Web.Extensions
    $serializer = [System.Web.Script.Serialization.JavaScriptSerializer]::new()
    $serializer.MaxJsonLength = [int]::MaxValue
    return $serializer.Serialize($Value)
}

$script:AccessToken = Get-AccessToken

$bodyDirectory = Split-Path -Parent (Resolve-Path $BodyPath)
$body = Get-Content -Path $BodyPath -Raw | ConvertFrom-Json

foreach ($entity in $body.entities) {
    $existingId = Get-ScriptId -Code $entity.code
    if ($existingId) {
        $entity | Add-Member -Force -NotePropertyName id -NotePropertyValue $existingId
        Write-Host "Updating script $($entity.code) id=$existingId"
    } else {
        Write-Host "Creating script $($entity.code)"
    }
}

$json = $body | ConvertTo-Json -Depth 30
foreach ($entity in $body.entities) {
    if ($entity.contentFile) {
        $contentPath = Join-Path $bodyDirectory $entity.contentFile
        $contentLiteral = ConvertTo-JsonStringLiteral -Value (Get-Content -Path $contentPath -Raw)
        $contentFilePattern = '"contentFile"\s*:\s*"' + [regex]::Escape($entity.contentFile) + '"'
        $json = [regex]::Replace($json, $contentFilePattern, '"content": ' + $contentLiteral, 1)
    }
}

$headers = @{
    Authorization = "Bearer $script:AccessToken"
    Accept = "application/json"
    "x-organization-code" = $OrganizationCode
}

$result = Invoke-RestMethod `
    -Method Post `
    -Uri (($BaseUrl.TrimEnd("/")) + "/api/script/save.json") `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $json

Write-Host "Saved script ids: $($result -join ', ')"
