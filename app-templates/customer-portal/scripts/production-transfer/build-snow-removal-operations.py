#!/usr/bin/env python3
"""Prepare the operations app from local exports. This command never calls Core."""

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path

APP = "SNOW-REMOVAL-OPERATIONS"
NAME = "Snow Removal Operations"
PROFILE = "DEFAULT"
OWNER = "WINTER_SERVICES"
CONTEXT = "snow-removal-operations/index.html"
WEB_ROLES = {
    "SW_FS_WS_COMPANY_ADMIN", "SW_FS_WS_OPERATIONS_MANAGER",
    "SW_FS_WS_DISPATCHER", "SW_FS_WS_CSR", "SW_FS_WS_SALES",
    "SW_FS_WS_BILLING_FINANCE",
}
VISIT_TYPES = "SNOW_SERVICE_VISIT,SNOW_INSPECTION_VISIT"
BILLING_ORDER = "SNOW_VISIT_ORDER"


def load(path):
    return json.loads(path.read_text())


def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def walk(value, path=()):
    yield path, value
    if isinstance(value, (dict, list)):
        items = value.items() if isinstance(value, dict) else enumerate(value)
        for key, child in items:
            yield from walk(child, (*path, str(key)))


def exactly_one(rows, label):
    if len(rows) != 1:
        raise ValueError(f"Expected one {label}; found {len(rows)}")
    return rows[0]


def row_by_code(catalog, kind, code, owners=None):
    rows = [r for r in catalog[kind] if r.get("code") == code
            and (owners is None or not r.get("organization")
                 or r["organization"].get("code") in owners)]
    return exactly_one(rows, f"{kind} {code}")


def change_filter(node, prop, old, new):
    f = exactly_one([f for f in node["filters"] if f["property"] == prop and f["value"] == old],
                    f"{prop} filter containing {old}")
    f["value"] = new


def form_field(screen, prop):
    return exactly_one([n for _, n in walk(screen["editor"])
                        if isinstance(n, dict) and n.get("type") == "FormItem"
                        and n.get("property") == prop], f"{prop} editor field")


def assert_safe(value):
    for path, node in walk(value):
        if isinstance(node, str) and re.search(
            r"dev-1\.servicewand\.com|lsrc\.pixelnation\.com|"
            r"SNOWLIMITLESS|SERVICE_WAND_WINTER_SERVICES|\bSNOW-CRM\b|"
            r"\b(?:SNOW|WINTER_SERVICES)_[A-Z0-9_]+_V\d+\b", node, re.I
        ):
            raise ValueError(f"Old environment/app/script reference at {'.'.join(path)}")
        if (isinstance(node, dict) and isinstance(node.get("property"), str)
                and re.search(r"(^id$|\.id$|Id$)", node.get("property", ""))
                and "operator" in node and "value" in node and str(node["value"]) != "-1"):
            raise ValueError(f"Unreviewed ID filter: {'.'.join(path)}")


def build(args):
    src, target = load(args.dev_inventory)["results"], load(args.prod_inventory)["results"]
    target_details = load(args.prod_details)
    ui = load(args.source / "ui-config.json")
    dm = load(args.source / "data-models.json")
    pm = load(args.source / "presentation-models.json")
    manifest = load(args.source / "manifest.json")
    exactly_one([a for a in manifest["apps"] if a["code"] == "SNOW-CRM"], "source app")
    screens = ui["screens"]
    actions_before = json.dumps([
        (p, v) for p, v in walk(ui) if p[-1:] in {
            ("roles",), ("permissions",), ("permission",), ("permissionPrefix",)
        }
    ])

    for screen in ("invoices", "snowPaidInvoices"):
        change_filter(form_field(screens[screen], "order"), "type.code",
                      "SNOW_SEASONAL_CONTRACT,SNOW_PER_VISIT_CONTRACT", BILLING_ORDER)
        if screens[screen].get("readonlyStates") != ["PAID"]:
            raise ValueError(f"{screen}: PAID lock changed")
    route = row_by_code(target, "core-svc/task-type", "SNOW_ROUTE")
    route_workflow = row_by_code(target, "core/workflow", route["workflow"]["code"])
    if route_workflow["initialState"]["code"] != "INITIAL":
        raise ValueError("Unexpected route initial state")
    change_filter(screens["routesPlanning"]["grid"], "states.code", "PLANNING", "INITIAL")
    old = "SNOW_ESTIMATE_VISIT,SNOW_SERVICE_VISIT,SNOW_INSPECTION_VISIT,SNOW_ROUTE_STOP"
    change_filter(screens["appointments"]["grid"], "type.code", old, VISIT_TYPES)
    change_filter(form_field(screens["appointments"], "type"), "code", old, VISIT_TYPES)
    exactly_one([f for f in screens["snowServiceVisits"]["grid"]["filters"]
                 if f.get("property") == "type.code" and f.get("value") == VISIT_TYPES],
                "existing service visit filter")

    row_by_code(target, "core-bill/order-type", BILLING_ORDER)
    for code in VISIT_TYPES.split(","):
        row_by_code(target, "core-svc/appointment-type", code)
    for fixed in ("routingRuns", "routingTemplates"):
        expected = fixed == "routingTemplates"
        exactly_one([f for f in screens[fixed]["grid"]["filters"]
                     if f.get("property") == "isTemplate" and f.get("value") is expected],
                    f"{fixed} template filter")

    ids = []
    owners = {"SYSTEM", OWNER, "WINTER_SERVICES_CA"}
    for screen_key, screen in screens.items():
        ent = ui["entityTypes"].get(screen["entityType"], {})
        kind = f"{ent.get('context')}/{ent.get('entity')}-type"
        defaults = [node for _, node in walk(screen)
                    if isinstance(node, dict) and isinstance(node.get("defaultValue"), dict)
                    and type(node["defaultValue"].get("id")) is int]
        type_default = next((n["defaultValue"] for n in defaults if n["property"] == "type"), None)
        target_type = None
        if type_default is not None:
            type_code = type_default.get("code")
            if type_code is None:
                type_code = exactly_one([r for r in src[kind] if r["id"] == type_default["id"]],
                                        f"{screen_key} source type")["code"]
            target_type = row_by_code(target, kind, type_code, owners)
        for node in defaults:
            field, default = node["property"], node["defaultValue"]
            if field == "type":
                lookup_kind, record = kind, target_type
            elif field == "taskType":
                lookup_kind = "core-svc/task-type"
                code = exactly_one([r for r in src[lookup_kind] if r["id"] == default["id"]],
                                   f"{screen_key} source task type")["code"]
                record = row_by_code(target, lookup_kind, code, owners)
            elif field == "workflow" and target_type and target_type.get("workflow"):
                lookup_kind = "core/workflow"
                record = row_by_code(target, lookup_kind, target_type["workflow"]["code"], owners)
            else:
                raise ValueError(f"Cannot resolve {screen_key}.{field} on production")
            if set(default) - {"id", "code"}:
                raise ValueError(f"Unexpected dedicated reference shape in {screen_key}.{field}")
            ids.append({"screen": screen_key, "field": field, "entity": lookup_kind,
                        "code": record["code"], "prodId": record["id"]})
            node["defaultValue"] = {**({"code": record["code"]} if "code" in default else {}),
                                    "id": record["id"]}

    nodes_with_ids = [(p, n) for p, n in walk({"UI_CONFIG": ui, "DATA_MODELS": dm,
                                                "PRESENTATION_MODELS": pm})
                      if p[-1:] == ("id",) and type(n) is int]
    if len(nodes_with_ids) != len(ids) or any(p[-2] != "defaultValue" for p, _ in nodes_with_ids):
        raise ValueError("Unreviewed numeric reference in config")

    role_catalog = {r["code"]: r for r in target["core/role"]}
    permission_catalog = {p["id"] for p in target["core/permission"]}
    explicit_perms = {v for path, v in walk(ui) if path[-1:] != ("permissionPrefix",)
                      and isinstance(v, str) and re.fullmatch(r"P_[A-Z0-9_:\-]+", v)}
    if explicit_perms - permission_catalog:
        raise ValueError(f"Unknown UI permissions: {sorted(explicit_perms - permission_catalog)}")
    screen_links = [(p, v) for p, v in walk(ui) if p[-1:] in {("screen",), ("screenName",)}
                    and isinstance(v, str)]
    for path, screen_name in screen_links:
        if screen_name not in screens:
            raise ValueError(f"Broken screen reference {screen_name} at {'.'.join(path)}")
    menu = [n for _, n in walk(ui["menu"]) if isinstance(n, dict) and isinstance(n.get("url"), str)]
    menu_roles = {r for n in menu for r in n.get("roles", [])}
    if menu_roles != WEB_ROLES | {"ADMIN"}:
        raise ValueError("Staff menu scope changed")
    for item in menu:
        url = item["url"]
        if url.startswith("screen:") and url.split(":", 1)[1] not in screens:
            raise ValueError(f"Broken menu link {url}")
        if not url.startswith("screen:") and url not in {
            "/dashboard", "/company-preferences", "/company-account",
            "/screens/appointments/timeline/resources", "/help/WINTER_SERVICES_HOME"
        }:
            raise ValueError(f"Unverified custom route {url}")
        for r in set(item.get("roles", [])) & WEB_ROLES:
            assigned = {p["id"] for p in role_catalog[r]["permissions"]}
            missing = set(item.get("permissions", [])) - assigned
            if missing:
                raise ValueError(f"{r} missing {missing} for {url}")
    if actions_before != json.dumps([(p, v) for p, v in walk(ui) if p[-1:] in {
        ("roles",), ("permissions",), ("permission",), ("permissionPrefix",)
    }]):
        raise ValueError("Existing UI rights changed")

    app_permissions = [f"P_UI:{APP}:{PROFILE}_R", f"P_UI_{APP}_{PROFILE}_R"]
    if any(x in permission_catalog for x in app_permissions):
        raise ValueError("New app permissions already exist; refresh the target plan")
    target_apps = target_details["results"]["core/app"]
    if any(a["code"] == APP or a["context"] == CONTEXT for a in target_apps):
        raise ValueError("Target app already exists; refusing to build a create payload")
    owner = row_by_code(target, "core/organization", OWNER)
    for code in WEB_ROLES:
        role = role_catalog[code]
        if role["organization"]["code"] != OWNER or not {
            "P_UI:SNOW-CRM:DEFAULT_R", "P_UI_SNOW-CRM_DEFAULT_R",
        }.issubset({p["id"] for p in role["permissions"]}):
            raise ValueError(f"Unexpected role ownership or source access for {code}")
    bulk = {}
    expected_bulk = {
        "confirmRequests": "WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES",
        "retryRequests": "WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES",
        "retryQuotes": "WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES",
        "sendQuotations": "WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES",
        "retryOperations": "WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES",
        "approvePlans": "WINTER_SERVICES_AGREEMENT_WORKFLOW_UTILITIES",
        "approveQuotes": "WINTER_SERVICES_BULK_APPROVE_QUOTES_DISPATCH",
        "completeVisitOrders": "WINTER_SERVICES_BULK_VISIT_ORDERS_DISPATCH",
    }
    for a in target["core/bulk-action"]:
        if a.get("organization", {}).get("code") != OWNER:
            continue
        fn, script, permission = a["function"], a["script"]["code"], a["permission"]["id"]
        if fn in bulk or expected_bulk.get(fn) != script or permission not in permission_catalog:
            raise ValueError(f"Unexpected production bulk action {fn}")
        row_by_code(target, "core/script", script, owners)
        bulk[fn] = {"script": script, "permission": permission,
                    "staffRoles": sorted(code for code in WEB_ROLES if {
                        permission, "P_BULK_ACTION_REGISTRY_R",
                    }.issubset({p["id"] for p in role_catalog[code]["permissions"]}))}
    if bulk.keys() != expected_bulk.keys():
        raise ValueError("Incomplete bulk registry")

    config = {"version": ui["version"], "UI_CONFIG": ui,
              "DATA_MODELS": dm, "PRESENTATION_MODELS": pm}
    assert_safe(config)
    app = {"code": APP, "context": CONTEXT, "enabled": True, "organization": {"id": owner["id"]},
           "activeConfiguration": PROFILE, "nls": {"en": {"NAME": NAME}},
           "configuration": {PROFILE: json.dumps(config, ensure_ascii=False, separators=(",", ":"))}}
    payload = {"entities": [app], "mappings": [
        {"name": field, **({"key": "id", "type": "identifier"} if field == "organization" else {})}
        for field in app
    ]}
    args.output.mkdir(parents=True, exist_ok=True)
    dump(args.output / "configuration.json", config)
    dump(args.output / "app-create.json", payload)
    dump(args.output / "access-plan.json", {
        "appOwnerCode": OWNER, "appCode": APP,
        "saveOrganizationHeader": OWNER,
        "readPermissionIdsToVerifyOnCreate": app_permissions,
        "grantByRoleCode": sorted(WEB_ROLES),
        "leaveUnchanged": ["CUSTOMER_PORTAL", "SW_FS_WS_DRIVER", "ADMIN"],
        "roleUpdateMode": "append only; keep current permissions and role organization",
    })
    dump(args.output / "validation.json", {
        "app": APP, "configExportedAt": manifest["exportedAt"],
        "productionCatalogReadAt": load(args.prod_inventory)["readAt"],
        "productionAppListReadAt": target_details["checkedAt"],
        "verifiedMenuLinks": len(menu), "verifiedScreenReferences": len(screen_links),
        "explicitUIPermissions": len(explicit_perms), "screens": len(screens),
        "defaultsFromProduction": ids, "verifiedBulkActions": bulk,
        "explicitChanges": ["invoice Billing Order", "routes Planning", "appointments visit types"],
        "uiPermissionsUnchanged": True, "serverWrites": False,
        "unmatchedLegacyGridTypes": [
            {"entity": v["kind"], "code": v["code"],
             "screens": sorted({row[0] for row in v["locations"]})}
            for v in load(args.source / "audit.json")["missingTypes"]
            if v["code"] not in {"SNOW_ESTIMATE_VISIT", "SNOW_ROUTE_STOP"}
        ],
    })
    if args.bundle:
        bundle = args.output / "dist.zip"
        files = sorted(p for p in args.bundle.rglob("*") if p.is_file())
        if not (args.bundle / "index.html").is_file():
            raise ValueError("Missing index.html in build")
        with zipfile.ZipFile(bundle, "w", zipfile.ZIP_DEFLATED) as archive:
            for file in files:
                if file.suffix in {".html", ".js", ".json", ".webmanifest"}:
                    text = file.read_text()
                    if re.search(r"dev-1\.servicewand\.com|lsrc\.pixelnation\.com|/core/apps/snow-crm/", text, re.I):
                        raise ValueError(f"Old environment URL in {file.name}")
                archive.write(file, file.relative_to(args.bundle).as_posix())
        with zipfile.ZipFile(bundle) as archive:
            if archive.testzip() is not None:
                raise ValueError("Corrupt frontend bundle")
    files = sorted(args.output.glob("*"))
    (args.output / "SHA256SUMS").write_text("".join(
        f"{hashlib.sha256(f.read_bytes()).hexdigest()}  {f.name}\n"
        for f in files if f.is_file() and f.name != "SHA256SUMS"
    ))
    print(f"{APP}: {len(screens)} screens, {len(menu)} menu links, "
          f"{len(ids)} target defaults, {len(WEB_ROLES)} staff roles")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("source", "dev-inventory", "prod-inventory", "prod-details", "output"):
        parser.add_argument(f"--{name}", required=True, type=Path)
    parser.add_argument("--bundle", type=Path)
    build(parser.parse_args())
