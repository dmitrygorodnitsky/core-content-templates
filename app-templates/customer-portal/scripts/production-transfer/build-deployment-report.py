"""Publishable deployment evidence: codes/status only, no raw server snapshots."""
import collections,csv,datetime,json,pathlib,argparse
p=argparse.ArgumentParser();p.add_argument('--run',required=True);p.add_argument('--site',required=True);a=p.parse_args()
root=pathlib.Path.cwd();run=pathlib.Path(a.run);site=pathlib.Path(a.site);docs=root/'app-templates/customer-portal/content/production-transfer'
def read(p):return json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
journal=read(run/'journal.json');snapshot=read(run/'after.json');templates=read(run/'compiled/request-templates.json');registry=read(docs/'migration-registry-2026-11-17.json');rules=read(docs/'migration-decisions-2026-11-17.json')
verified={r['key'] for r in journal['verified']};blocked={r['key']:r for r in journal['blocked']};attempted={r['key'] for r in journal['attempts']}
lookups=read(run/'compiled/reference-catalog.json')
org_names={r['code']:r.get('nls',{}).get('en',{}).get('NAME',r['code']) for r in snapshot['results'].get('core/organization',[])}
rows=[]
for row in registry:
 row=dict(row);entry=row['entity']+'|'+row['code'];ops=[o['key'] for o in templates if o['sourceEntry']==entry];code=row['targetCode'];entity=row['entity']
 completed=[k for k in ops if k in verified];failed=[k for k in ops if k in blocked]
 if entry in rules.get('deferredNativeRequirements',{}):status='deferred';detail=rules['deferredNativeRequirements'][entry]['reason']
 elif ops and len(completed)==len(ops):status='deployed';detail='All selected save phases were verified by reading production back.'
 elif completed:status='partial';detail='Completed phases: '+', '.join(k.rsplit('#',1)[1] for k in completed)+'. Remaining phases are blocked or waiting for dependencies.'
 elif any(k in attempted for k in ops):status='verification-blocked';detail='A save was attempted; do not retry blindly. Server response/read-back needs reconciliation.'
 elif failed:status='blocked';detail='No completed save. A prerequisite or native API check blocked this entry.'
 elif not ops and row['action'].startswith('reuse'):
  lookup=lookups.get(entity+'|'+code,{})
  found=[r for r in snapshot['results'].get(entity,[]) if lookup.get('matches')==1 and r.get('id')==lookup.get('targetId')]
  status='reused' if len(found)==1 else 'blocked';detail='Existing production definition reused; not rewritten.' if status=='reused' else 'Existing definition was not uniquely resolved.'
 else:status='waiting';detail='Waiting for an unloaded dependency; no save attempted.'
 row.update(action=status,actionLabel={'deployed':'Loaded and verified','partial':'Partly loaded','verification-blocked':'Verify save outcome','blocked':'Blocked','deferred':'Load later','reused':'Reused','waiting':'Waiting'}[status],prod=detail,note=detail,differences=[])
 actual=[r for r in snapshot['results'].get(entity,[]) if r.get('code')==code]
 row['prodOwner']=actual[0].get('organization',{}).get('code',row.get('targetOrganization')) if len(actual)==1 else ''
 row['prodOwnerName']=org_names.get(row['prodOwner'],row['prodOwner'])
 rows.append(row)
supplemental=[]
sensor_file=docs/'sensor-definitions-2026-11-17.json'
if sensor_file.exists():
 for spec in read(sensor_file):
  definitions=[r for r in snapshot['results'].get('core-rm/sensor-definition',[]) if r.get('code')==spec['code']]
  resources=[r for r in snapshot['results'].get('core-rm/resource-type',[]) if r.get('code')==spec['resourceTypeCode']]
  valid=len(definitions)==len(resources)==1 and definitions[0].get('resourceType',{}).get('id')==resources[0]['id'] and definitions[0].get('sensorType',{}).get('code')==spec['sensorTypeCode'] and any(r.get('id')==definitions[0]['id'] and r.get('code')==spec['code'] for r in resources[0].get('sensorDefinitions',[]))
  parent=next(r for r in rows if r['entity']=='core-rm/resource-type' and r['targetCode']==spec['resourceTypeCode'])
  row={k:parent.get(k) for k in ['flow','scope','devOwner','targetOrganization','targetOrganizationName','prodOwner','prodOwnerName']}
  detail='Sensor definition linked to '+spec['resourceTypeCode']+' and '+spec['sensorTypeCode']+'; both directions verified on prod.' if valid else 'Sensor link requires verification.'
  row.update(entity='core-rm/sensor-definition',code=spec['code'],targetCode=spec['code'],kind='Sensor definition',category='Sensor definition',action='deployed' if valid else 'blocked',actionLabel='Loaded and verified' if valid else 'Blocked',prod=detail,note=detail,loadStage=35,dependencies=['core-rm/resource-type|'+spec['resourceTypeCode']],differences=[])
  supplemental.append(row)
rows.extend(supplemental)
counts=dict(collections.Counter(r['action'] for r in rows));direct=[r for r in journal['blocked'] if r['reason']!='Dependent on blocked prerequisite; no write attempted' and r['key'].split('#')[0] not in rules.get('deferredNativeRequirements',{})]
# Explicitly select public-safe fields. Raw errors may contain source snippets, so publish classification only.
blockers=[]
for item in direct:
 reason=item['reason'];classification='Read-back verification mismatch'
 if reason.startswith('HTTP '):classification='Core rejected the save ('+reason.split(' ',2)[1]+')'
 elif 'optimistic' in reason:classification='Record changed during import; write was stopped'
 elif 'Interrupted' in reason:classification='Interrupted request; outcome needs reconciliation'
 elif 'sensor' in reason.lower():classification='Sensor definitions need code-based production mapping'
 elif 'Native reference unresolved' in reason:classification='A required native reference is unresolved'
 blockers.append({'title':item['key'],'detail':classification+'. Dependent entries were left pending.'})
for entity in snapshot.get('warnings',{}):blockers.append({'title':entity,'detail':'Production read failed; this registry could not be verified.'})
for issue in read(run/'compiled/issues.json'):
 if issue['entry'] not in rules.get('deferredNativeRequirements',{}) and not any(b['title'].split('#')[0]==issue['entry'] for b in blockers):blockers.append({'title':issue['entry'],'detail':'Native reference validation is unresolved. Dependent requests were not executed.'})
for original,row in zip(registry,rows):
 if original['action'].startswith('reuse') and row['action']=='blocked':
  blockers.append({'title':row['entity']+'|'+row['targetCode'],'detail':'Expected shared production definition is missing or ambiguous. Dependent workflows were not attached; no replacement was invented.'})
# Multiple phases can point at one underlying cause.
unique={}
for item in blockers:
 key=item['title'].split('#')[0]
 if key not in unique:unique[key]={**item,'title':key}
blockers=list(unique.values())
complete=all(r['action'] in ['deployed','reused','deferred'] for r in rows) and not blockers
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'staged-transfer-complete' if complete else 'staged-transfer-stopped-at-blockers','verifiedSaveOperations':len(verified)+sum(r['action']=='deployed' for r in supplemental),'supplementalSensorDefinitions':len(supplemental),'attemptedSaveOperations':len(journal['attempts'])+sum(r['action']=='deployed' for r in supplemental),'entryCounts':counts,'totalEntries':len(rows),'blockers':blockers,'deferred':['Backend: production OpenAI secret and dependent AI plan configuration.','Later, by user decision: WINTER_CONTRACT and WINTER_INVOICE. Source archives retrieved and statically checked; production upload, JDBC setup and PDF rendering deferred (not a transfer blocker).'],'paymentEnabled':False,'schedulesEnabled':False,'serversChanged':bool(journal['attempts'])}
save(docs/'production-deployment-2026-11-17.json',report);save(docs/'production-deployment-registry-2026-11-17.json',rows)
save(site/'registry.json',rows);save(site/'deployment.json',report)
with (site/'snow-crm-release.csv').open('w',newline='') as stream:
 writer=csv.DictWriter(stream,fieldnames=['flow','entity','code','targetCode','targetOrganization','actionLabel','note'],extrasaction='ignore');writer.writeheader();writer.writerows(rows)
readiness=read(site/'readiness.json');readiness.update(checkedAt=report['checkedAt'],deployment=report,ready=False,blockers=blockers,notes=['This page shows verified configuration saves, not a claim that all business flows have passed production runtime tests.','Payment and both schedules remain disabled.','Existing business Accounts, Users and purchases were not migrated.'],launchChecks=report['deferred']+['Production role/isolation and end-to-end business-flow checks remain before launch.']);save(site/'readiness.json',readiness)
print(json.dumps(report))
