"""Build a read-only, fail-closed migration review bundle. Never contacts Core.
Source references are evidence, not destination IDs; this is NOT an import runner.
"""
import argparse, collections, csv, hashlib, json, pathlib, re, shutil, zipfile
ap=argparse.ArgumentParser();ap.add_argument('--workspace',required=True);ap.add_argument('--core-ui',required=True);ap.add_argument('--output',required=True);args=ap.parse_args()
root=pathlib.Path(args.workspace);core=pathlib.Path(args.core_ui);out=pathlib.Path(args.output)
if out.exists():raise SystemExit('Use a new output directory to preserve existing evidence')
out.mkdir(parents=True)
review=root/'app-templates/customer-portal/content/production-transfer'
load=lambda p:json.loads(p.read_text())
def write(name,value):
 p=out/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n')
registry=load(review/'migration-registry-2026-11-17.json');rules=load(review/'migration-decisions-2026-11-17.json')
keys={v['entity']+'|'+v['code'] for v in registry};assert len(keys)==len(registry)
for row in registry:
 assert not any(row['entity']==x['entity'] and row['code']==x['code'] for x in rules['transferExclusions'])
 assert all(dep in keys for dep in row.get('dependencies',[])),row['code']
# Read snapshots only. Per-entity overlays enrich the source, not its target identity.
files=[root/'tmp/retired-order-audit/dev-1.json',root/'tmp/prod-transfer-2026-11-17/dev-1-extra.json',root/'tmp/prod-transfer-2026-11-17/full-definitions.json',root/'tmp/final-transfer/details.json']
snapshot={};source_times=[]
for f in files:
 data=load(f);source_times.append({'file':f.name,'readAt':data.get('time',data.get('readAt'))})
 for entity,rows in data['results'].items():
  bank=snapshot.setdefault(entity,{})
  for v in rows:bank[str(v.get('id',v.get('code')))]=dict(bank.get(str(v.get('id',v.get('code'))),{}),**v)
local={};seed_files=set()
for base in [core/'scripts/dev/seeds',root/'app-templates/customer-portal/scripts/plan-subscription']:
 for f in sorted(base.glob('*.json')):
  data=load(f)
  if not isinstance(data,dict):continue
  for group,entity in [('scripts','core/script'),('workflows','core/workflow'),('roles','core/role')]:
   for value in data.get(group,[]):
    if isinstance(value,dict) and value.get('code'):local[entity+'|'+value['code']]=(value,f)
# Canonical script mappings are audit inputs; chains are resolved and cycles rejected.
code_map=load(root/'tmp/script-inventory/combined-mapping.json');consolidation=load(review/'script-consolidation-mapping-2026-11-16.json');code_map.update(consolidation['codes'])
def canonical(code):
 seen=set()
 while code in code_map and code_map[code]!=code:
  assert code not in seen,code;seen.add(code);code=code_map[code]
 return code
write('rules/script-codes.json',{k:canonical(k) for k in sorted(code_map)})
write('rules/method-renames.json',consolidation['renamedMethods']);write('rules/migration-decisions.json',rules)
# The source folder deliberately uses evidence wrappers. Source IDs must not be used as target IDs.
entries=[];missing=[];source_adjustments=[];permission_refs=[]
for row in registry:
 key=row['entity']+'|'+row['code'];filename=row['entity'].replace('/','__')+'__'+row['code']+'.json';definition=None;origin='snapshot'
 if key in local:
  definition,f=local[key];definition=json.loads(json.dumps(definition));origin=str(f.relative_to(core)) if f.is_relative_to(core) else str(f.relative_to(root));seed_files.add(f)
 else:
  candidates=list(snapshot.get(row['entity'],{}).values())
  codes=set(row.get('sourceCodes',[])+[row['code']]);definition=next((v for v in candidates if v.get('code') in codes),None)
  if definition is None and row['code'].startswith('SOURCE_ID_'):definition=next((v for v in candidates if str(v.get('id'))==row['code'][10:]),None)
  if definition is None and row['code']=='LSRC':definition=next((v for v in candidates if v.get('code')==rules['organizationAliases']['LSRC']),None)
 if definition is None:missing.append(key);continue
 definition=json.loads(json.dumps(definition))
 if row['category']=='Script':
  if 'contentFile' in definition:content=(local[key][1].parent/definition.pop('contentFile')).read_text()
  else:content=definition.pop('content','')
  assert content,row['code'];ext='java' if definition.get('language')=='Java' else 'vm'
  name='scripts/'+row['code']+'.'+ext;(out/'scripts').mkdir(exist_ok=True);(out/name).write_text(content);definition['contentFile']='../'+name
  for n,line in enumerate(content.splitlines(),1):
   if any(s in line for s in ['SNOWLIMITLESS','SERVICE_WAND_WINTER_SERVICES','dev-1.servicewand.com']):source_adjustments.append({'script':row['code'],'line':n,'text':line.strip(),'classification':'KEEP_DEV_CAPTURE_GUARD' if 'dev-1.servicewand.com' in line else 'REVIEW_EXECUTION_SCOPE_OR_PARENT'})
 # Seed metadata remains intact; the target owner is a separate approved instruction.
 write('source-definitions/'+filename,{'kind':'SOURCE_EVIDENCE_NOT_IMPORT_PAYLOAD','target':{'entity':row['entity'],'code':row['targetCode'],'organization':row['targetOrganization'],'action':row['action']},'source':definition,'origin':origin})
 if row['category']=='Role':
  permissions=definition.get('permissionIds',[v.get('id') for v in definition.get('permissions',[])])
  for perm in permissions:
   if isinstance(perm,str) and perm.startswith('P_SCRIPT_X_'):
    target=canonical(perm[len('P_SCRIPT_X_'):]);permission_refs.append({'role':row['targetCode'],'sourcePermission':perm,'targetPermission':'P_SCRIPT_X_'+target,'selectedTarget':'core/script|'+target in keys})
 entries.append({'key':key,'file':'source-definitions/'+filename,'stage':row['loadStage'],'action':row['action'],'dependencies':row.get('dependencies',[])})
# Preserve bulk action bindings, including unresolved legacy action; they cannot be silently dropped.
for name in ['snowBulkActions.json','snowRbac.json','snowCustomerPortalRbac.json']:
 src=core/'scripts/dev/seeds'/name;dest=out/'bindings'/name;dest.parent.mkdir(exist_ok=True);shutil.copyfile(src,dest)
if rules.get('runtimeTenantScope',{}).get('status')=='implemented-local-tested-two-organizations':
 assert all(row['text'].startswith('*') or row['classification']=='KEEP_DEV_CAPTURE_GUARD' for row in source_adjustments), 'Customer organization hardcode reintroduced in selected scripts'
write('checks/missing-sources.json',missing);write('checks/execution-scope-references.json',source_adjustments);write('checks/script-permissions.json',permission_refs)
assert not missing,missing
assert all(p['selectedTarget'] for p in permission_refs),[p for p in permission_refs if not p['selectedTarget']]
assert len([x for x in entries if x['key'].startswith('core/script|')])==60
write('registry.json',registry)
# Stage order is two-pass: dependencies between types/workflows cannot be loaded with dev IDs.
write('load-plan.json',{'mode':'REVIEW_ONLY','steps':[
 {'stage':1,'operation':'Resolve or create organization definitions by code; no users or business records.'},
 {'stage':2,'operation':'Resolve reused dictionaries/defaults. Create type shells, parents, then typed attributes. Defer workflow links and cyclic references.'},
 {'stage':3,'operation':'Load consolidated script definitions/content after source-scope decisions; preserve capabilities and method restrictions.'},
 {'stage':4,'operation':'Create workflow states before events/targets; attach script and type links in a second pass.'},
 {'stage':5,'operation':'Load dictionaries, reports, products and configuration; remap all reference values with target lookups.'},
 {'stage':6,'operation':'Load prices after products/types. SOURCE_ID identifiers are source evidence only, not destination keys.'},
 {'stage':7,'operation':'Load selected roles, code-based permissions, bulk bindings and environment settings. Resolve method renames together with script codes.'},
 {'stage':8,'operation':'Create only two approved schedules disabled; resolve runAs/group on prod, preserve function parameters. Payment remains disabled.'}], 'entries':sorted(entries,key=lambda e:(e['stage'],e['key']))})
stages={v['key']:v['stage'] for v in entries}
write('checks/deferred-links.json',[{'entry':v['key'],'dependency':dep,'entryStage':v['stage'],'dependencyStage':stages[dep]} for v in entries for dep in v['dependencies'] if stages[dep]>v['stage']])
write('manifest.json',{'format':'servicewand-transfer-review-v1','readyToApply':False,'target':'https://prod.servicewand.com','entries':len(entries),'javaScripts':39,'templates':20,'platformScriptDependencies':1,'sourceSnapshots':source_times,'sourcePolicy':'Consolidated local scripts/workflows/roles override snapshots; numeric IDs inside evidence are not target bindings. No upload tool included.','blockerReport':'BLOCKERS.md'})
for name in ['migration-review-2026-11-17.md','service-provider-compatibility-2026-11-17.md','retired-order-transfer-audit-2026-11-17.md']:
 shutil.copyfile(review/name,out/name)
print(json.dumps({'entries':len(entries),'scripts':60,'permissionReferences':len(permission_refs),'executionScopeLines':len(source_adjustments),'missing':missing}))
