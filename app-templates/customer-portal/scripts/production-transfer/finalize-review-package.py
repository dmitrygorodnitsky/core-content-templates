import json,pathlib,hashlib,zipfile,collections,argparse,shutil
ap=argparse.ArgumentParser();ap.add_argument('--workspace',required=True);ap.add_argument('--package',required=True);ap.add_argument('--native-draft');args=ap.parse_args()
root=pathlib.Path(args.workspace);p=pathlib.Path(args.package);docs=root/'app-templates/customer-portal/content/production-transfer'
def save(path,x):path.parent.mkdir(exist_ok=True,parents=True);path.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
schedules=[]
for code,fn in [('INVOICE_PAYMENT_REMINDERS','runReminders'),('SNOW_VISIT_ORDERS','runVisits')]:
 source=json.load(open(p/f'source-definitions/core__schedule__{code}.json'))['source']
 schedules.append({'code':code,'organization':'SYSTEM','enabled':False,'className':source['className'],'cronString':source['cronString'],'parameters':{**source['parameters'],'SCRIPT':'INVOICE_LIFECYCLE_WORKFLOW','FUNCTION':fn},'runAs':{'resolveBy':'system-user-on-target','sourceIdentity':'system'},'group':{'resolveBy':'code-or-name','source':{k:v for k,v in source.get('group',{}).items() if k not in ['id','optimistic']}}})
save(p/'proposals/schedules.json',schedules)
refs=json.load(open(p/'checks/execution-scope-references.json'));refs=[dict(v,classification='COMMENT_ONLY' if v['text'].startswith('*') else v['classification']) for v in refs];save(p/'checks/execution-scope-references.json',refs)
blockers=[

 {'code':'NATIVE_PAYLOAD_RESOLUTION','title':'Resolve and validate the final native import requests','detail':'Bundle contains exact source evidence, target rules and proposals, not API-save payloads. Resolve dictionary defaults/attributes and parent/workflow/state/event references by target codes; assign price identities from product/type/price terms, never SOURCE_ID labels. Validate the resulting requests with the native importer before loading. Source evidence must not be submitted directly.'}
]
deferred=[];validated=False
if args.native_draft:
 native=pathlib.Path(args.native_draft)
 shutil.copytree(native,p/'native-draft',dirs_exist_ok=True)
 summary=json.load(open(native/'summary.json'))
 issues=json.load(open(native/'issues.json'))
 blockers=[{'code':'NATIVE_PAYLOAD_RESOLUTION','title':'Finish validation of the staged native payload',
  'detail':'Offline draft generated: '+str(summary['operations'])+' save templates, '+str(summary['priceIdentities'])+' semantic price identities. Target references are resolved from a fresh read-only snapshot. Before execution, finish the native field contract review, state/event identity resolution, role permission expansion and staged target refresh. Draft reference-resolved requests are not approved for execution.'}]
 decisions=json.load(open(docs/'migration-decisions-2026-11-17.json'))
 save(p/'rules/migration-decisions.json',decisions)
 deferred_rules=decisions.get('deferredNativeRequirements',{})
 deferred=[{'entry':i['entry'],'technicalIssue':i['reason'],**deferred_rules[i['entry']]} for i in issues if i['entry'] in deferred_rules]
 save(p/'native-draft/deferred-requirements.json',deferred)
 blockers += [{'code':'NATIVE_SOURCE_REQUIREMENT','title':i['entry'],'detail':i['reason']} for i in issues if i['entry'] not in deferred_rules]
 if (native/'validation.json').exists():
  validation=json.load(open(native/'validation.json'))
  for name,digest in validation['artifactHashes'].items():assert hashlib.sha256((native/name).read_bytes()).hexdigest()==digest,'Stale native validation: '+name
  validated=validation['offlineContractChecksPassed'] and not validation['blockingIssues']
  if validated:blockers=[b for b in blockers if b['code']!='NATIVE_PAYLOAD_RESOLUTION']


audit={'readyToApply':False,'registryEntries':352,'javaScripts':39,'templates':20,'platformScriptDependencies':1,'missingSources':0,'missingRegistryDependencies':0,'selectedScriptPermissionReferences':11,'deferredWorkflowLinks':73,'deferredOrganizationTypeLinks':4,'blockers':blockers,'legacyDecisions':{'sendLegacyQuotations':'Document bulk binding excluded by user decision. Shared retry implementation and Order round-send binding retained.','WINTER_SERVICES_PROPERTY_PLAN_ML':'No callers in selected current scripts, workflows, app configuration, bulk actions or schedules. Only old SNOW_PROPERTY_PLAN_V1/V5 and ADMIN permissions refer to old names. Current generation uses /api/address/plan.json. Retained conservatively in the 39-script bundle pending backend/external-call confirmation; not a hard blocker if retained.'},'checksPassed':['consolidationSyntaxCheck (36 core-ui Java sources, parse only)','quotationCreationConsolidationCheck','billingConsolidationCheck (approved private-method deletion reconciled against saved before-source)','profileSupportConsolidationCheck','quotationGroupConsolidationCheck','propertyGroupConsolidationCheck','snowStaffRolesCheck','workflowGrantContractCheck','workflowSeedCheck','quotationPackageOrderFlowCheck','serviceAgreementDeliveryCheck','snowBulkSendQuotationCheck'],'runtimeChecks':['Verify destination organization visibility and method access with the intended roles.','Verify prod pages/URLs and runtime modules, credentials and service identities without enabling payment.','Keep both schedules disabled until approved.'], 'serversChanged':False,'sitesPublished':False}
tenant_audit=json.load(open(docs/'tenant-scope-audit-2026-11-17.json'))
save(p/'checks/tenant-scope-audit.json',tenant_audit)
assert tenant_audit['unchangedScriptContracts']==60 and tenant_audit['unchangedRoleDefinitions']==8
audit['readyForStagedImport']=validated
if validated:
 audit['nativeValidation']=validation
 audit['checksPassed']+=['native payload unit tests (14)', 'native field/workflow/permission package audit']
audit['deferredRequirements']=deferred
audit['checksFailed']=tenant_audit['existingValidationGaps']
audit['tenantScope']='Implemented locally and verified with two-organization harnesses; no server runtime verification.'
audit['checksPassed']=list(dict.fromkeys(audit['checksPassed']+tenant_audit['passed']))

save(p/'checks/final-audit.json',audit);save(docs/'final-package-audit-2026-11-17.json',audit)
text='''# Production transfer candidate — 17 November 2026

**REVIEW ONLY — NOT READY TO APPLY.** This bundle has no upload runner and makes no Core changes. Source evidence is not a native API payload. Numeric IDs in source evidence describe dev records only and must never be used as destination bindings.

## Contents

352 registry entries; 39 local Java scripts, 20 templates and one platform script dependency. `scripts/` contains the exact selected implementations. `source-definitions/` contains per-entry source evidence and the approved target owner/code. `rules/` contains script and method renames and all approved exclusions. `bindings/` preserves bulk actions and role definitions for comparison. `checks/` contains findings and dependencies. `proposals/schedules.json` contains disabled schedules with the consolidated script/method pairs.

No business Accounts, Users, existing purchases, grants or credential stores are included. Reused GENERAL_COMMUNICATION is a reference, not authorization to overwrite production contacts. Snapshot dates remain visible in the manifest; this is not a fresh prod read.

## What blocks application

1. **Final native payload:** resolve all target references, dictionary defaults, price identities and schema-specific mappings before invoking import. This source bundle is not directly uploadable. SOURCE_ID labels only identify source price records; no destination ID is fixed.
The two regression assertion discrepancies are resolved: bulk checks inspect the isolated implementation; tagged Task events are verified against the customer support permission contract.

## PROPERTY_PLAN_ML

No current selected source or configured workflow/app/schedule/bulk action calls it. The remaining references are old SNOW_PROPERTY_PLAN_V1/V5 and SYSTEM ADMIN permissions. Current Property Plan calls backend `/api/address/plan.json`. Keep the ML script provisionally in this package: backend internals and arbitrary external API callers were not verified. It is a candidate for later exclusion, not evidence that the current backend endpoint is broken.

## Load order

1. Resolve organizations and reused dictionaries by code. Resolve required organization-type references before creating organization definitions.
2. Load type shells, then parents and typed attributes/defaults; defer workflow attachments.
3. Load canonical scripts and unchanged method contracts with execution-tenant checks and unchanged method permissions.
4. Load workflow states, then events/targets, then attach type/workflow and script links.
5. Load catalog, dictionaries, reports and configuration; load prices only after products and price types.
6. Load selected roles and bulk actions using approved script **and method** mappings. CUSTOMER_PORTAL is the renamed role; do not copy SYSTEM ADMIN or user assignments.
7. Resolve both schedule groups and the target system user; import schedules disabled with `INVOICE_LIFECYCLE_WORKFLOW.runReminders` / `runVisits`. Payment stays disabled.

There are no missing entries in the declared dependency graph. 73 type→workflow links and four organization→type links require ordering beyond the registry's coarse stage number. `checks/deferred-links.json` lists them: sorting the CSV by stage alone is not an import algorithm.

## Confirmed decisions

- Customer organization hardcodes are removed from 12 Winter Services scripts. Two onboarding scripts now use the configured CA parent. Scoped scans, locked writes, invoice settlement, attachment parent lookup and portal role resolution preserve tenant boundaries. Local two-tenant checks pass; see checks/tenant-scope-audit.json. SYSTEM service semantics and the ServiceWand seller policy are not customer authorization and are retained.

- Old Document bulk Send Quotation binding is excluded. retryOperations and current round-send action remain unchanged. The old Java method is retained; this decision removes its bulk binding only.

- ORDER_LIFECYCLE_WORKFLOW is retained; retired GENERAL_FSM_ORDER and WINTER_SERVICES_QUOTATION_ORDER_UTILITIES are excluded, not merged back.
- New onboarding uses SERVICE_PROVIDER; OPERATOR and its obsolete expiry patch are excluded.
- Reuse/update the existing prod SERVICE_PROVIDER; the saved prod snapshot lacks CUSTOMER_PORTAL_URL.
- Resolve the COMMUNICATION default as the existing GENERAL_COMMUNICATION by code, preserving production contacts.
- Replace the approved AI placeholder references and three PROPERTY_SITE type restrictions through the scoped rules only.
- Keep dev-only capture guards in PLAN_SUBSCRIPTION_WORKFLOW. A production-URL transformation must not enable test mail capture on prod.

## Validation and limits

All 352 source entries were found; all declared registry dependencies resolve. Eleven script-permission references from the eight selected roles resolve to selected script definitions. The listed focused consolidation, workflow, role, grant-contract, quotation and agreement checks pass; see `checks/final-audit.json`. The retained-body fingerprint was reconciled only after proving the sole difference was the previously approved deletion of unused private awaitAgreementLeaves.

snowBulkQuotesCheck, snowVisitCrewSnapshotCheck and snowSupportTicketCheck pass. The bulk worker/dispatcher harnesses exercise approval, scope, refusals and deadlines. Customer support retains exactly its eight permitted transitions. All 60 script entry contracts/capabilities and all eight selected role definitions match the previous candidate bundle.

Java parsing and focused Java harnesses do not replace compilation against Core services or production role/context tests. Full production execution, credentials and page availability remain launch checks. No Core writes, schedule activation, payment activation or Sites publication were performed.
'''
if args.native_draft:
 text+='\n## Native payload draft\n\n'+(native/'README.md').read_text()+'\n'
if deferred:
 text+='\n## Approved separate follow-ups (not main transfer blockers)\n\n'+'\n'.join('- '+v['entry']+': '+v['reason'] for v in deferred)+'\n\nThese entries remain deferred; unresolved references are not bypassed. AI generation and report rendering are not declared ready.\n'
if validated:
 text=text.replace('**REVIEW ONLY — NOT READY TO APPLY.**','**OFFLINE VALIDATED — LOAD IN STAGES WITH FRESH TARGET READS.**')
 text=text.replace('## What blocks application','## Import status')
 text=text.replace('1. **Final native payload:** resolve all target references, dictionary defaults, price identities and schema-specific mappings before invoking import. This source bundle is not directly uploadable. SOURCE_ID labels only identify source price records; no destination ID is fixed.', 'Native field, workflow and permission checks pass. No remaining blocker in the main offline payload. The native templates must be resolved against fresh prod data between stages; this is not a flat batch to replay. SOURCE_ID labels are never destination IDs. Reports and AI configuration remain separately deferred.')
(p/'README.md').write_text(text);(p/'BLOCKERS.md').write_text(('\n'.join('# '+b['title']+'\n\n'+b['detail']+'\n' for b in blockers) or '# No remaining main payload blocker\n\nOffline validation passed. Resolve fresh target IDs and permissions between stages. Reports and AI configuration remain separately deferred; no Core execution has been verified.\n'));(docs/'final-package-review-2026-11-17.md').write_text(text)
# Integrate findings in the authoritative readiness summary, without claiming deployment readiness.
f=docs/'migration-readiness-2026-11-17.json';x=json.load(open(f));x['ready']=False;x['readinessStatus']='offline-validated-staged-import' if validated else 'candidate-bundle-blocked';x['readyForStagedImport']=validated;x['blockers']=blockers;x['deferredRequirements']=deferred;x['finalPackageAudit']='final-package-audit-2026-11-17.json';save(f,x)
f=docs/'migration-review-2026-11-17.md';f.write_text(f.read_text().split('\n## Final candidate audit')[0]+'\n## Final candidate audit\n\nSee [the package review](final-package-review-2026-11-17.md). Customer tenant scoping is implemented and locally tested. '+('Native payload fields, workflows and permissions pass offline validation; import requires fresh target reads between stages.' if validated else 'Application remains blocked by native payload reference resolution.')+' The obsolete Document bulk-send binding has been excluded. The source/permission assertion discrepancies are resolved and all three affected checks pass; see the package review. Previous configuration-only readiness conclusions do not supersede these findings.\n')
(p/'migration-review-2026-11-17.md').write_text((docs/'migration-review-2026-11-17.md').read_text())
(p/'final-package-review-2026-11-17.md').write_text(text)
checks={str(f.relative_to(p)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(p.rglob('*')) if f.is_file() and f.name != 'SHA256SUMS.json'};save(p/'SHA256SUMS.json',checks)
archive=p.parent/'servicewand-prod-transfer-candidate-2026-11-17.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for f in sorted(p.rglob('*')):
  if f.is_file():z.write(f,f.relative_to(p))
with zipfile.ZipFile(archive) as z:
 for name,digest in checks.items():assert hashlib.sha256(z.read(name)).hexdigest()==digest
print('Verified archive',archive,'files',len(checks)+1,'bytes',archive.stat().st_size)
