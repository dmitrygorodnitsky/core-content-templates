"""Offline package contract audit. Does not call Core or simulate server execution."""
import argparse, copy, hashlib, importlib.util, json, pathlib
spec=importlib.util.spec_from_file_location('native',pathlib.Path(__file__).with_name('native-payload.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def audit(package,compiled):
 package=pathlib.Path(package);compiled=pathlib.Path(compiled)
 operations=m.load(compiled/'request-templates.json');by_key={o['key']:o for o in operations}
 assert len(by_key)==len(operations),'Duplicate operation identity'
 roles=m.load(compiled/'role-contracts.json');lookups=m.load(compiled/'reference-catalog.json')
 coverage=m.load(compiled/'field-coverage.json');assert all(not r['unhandled'] for r in coverage)
 counts={'workflowStates':0,'workflowEvents':0,'scriptContracts':0,'roles':len(roles),'bulkActions':0}
 for f in (package/'source-definitions').glob('*.json'):
  definition=m.load(f);source=definition['source'];entity=definition['target']['entity'];code=source.get('code')
  entry=m.key(entity,code);selected=[o for o in operations if o['sourceEntry']==entry]
  if not selected:continue
  if entity=='core/workflow':
   states,initial=m.workflow_states(source)
   shell=by_key[entry+'#states']['bodyTemplate']['entities'][0]
   full=by_key[entry+'#events']['bodyTemplate']['entities'][0]
   assert all('events' not in s and 'id' not in s for s in shell['states'])
   assert len(full['states'])==len(states)
   for expected,actual in zip(states,full['states']):
    assert expected['code']==actual['code']
    for field in ('onEnter','onExit','style'):
     if field in expected:assert actual[field]==expected[field],(entry,field)
    assert len(expected.get('attributes',[]))==len(actual.get('attributes',[]))
    assert len(expected['events'])==len(actual['events'])
    counts['workflowStates']+=1
    for ev,out in zip(expected['events'],actual['events']):
     assert ev['code']==out['code'];assert 'id' not in out
     assert [t.get('code') if isinstance(t,dict) else t for t in ev['targets']]==[t['id']['$state'].split('|',1)[1] for t in out['targets']]
     for field in ('style','attributeOrder','orderIndex'):
      if field in ev:assert ev[field]==out[field]
     assert len(ev.get('attributes',[]))==len(out.get('attributes',[]))
     counts['workflowEvents']+=1
   # Distinct synthetic IDs test resolution only, never model a successful Core save.
   target={'states':[{'code':s['code'],'id':100000+i,'events':[{'code':e['code'],'id':200000+i*100+j} for j,e in enumerate(s['events'])]} for i,s in enumerate(states)]}
   resolved=m.resolve_workflow_identity(full,target,True)
   assert resolved['initialState']['id']==next(s['id'] for s in target['states'] if s['code']==initial)
   for state,held in zip(resolved['states'],target['states']):
    assert state['id']==held['id']
    assert [e['id'] for e in state['events']]==[e['id'] for e in held['events']]
   for field in ('entityType','onUpdate','onDelete'):
    if field in source:assert full[field]==source[field]
  elif entity=='core/script':
   body=selected[0]['bodyTemplate']['entities'][0]
   assert body['content']==(package/'source-definitions'/source['contentFile']).resolve().read_text()
   for field in ('FUNCTIONS','CAPABILITIES'):
    assert body['metadata'].get(field)==source.get('metadata',{}).get(field),(code,field)
   counts['scriptContracts']+=1
  elif entity=='core/role':
   body=selected[0]['bodyTemplate']['entities'][0]
   assert body['permissions']['$permissions']['explicit']==roles[body['code']]['expectedPermissions']
   assert not body['permissions']['$permissions']['patterns'],'Patterns must not grant additional prod-only rights'
 for op in operations:
  body=op['bodyTemplate']['entities'][0]
  assert set(body)=={x['name'] for x in op['bodyTemplate']['mappings']},op['key']
  if op['identity']['entity']=='core/bulk-action':counts['bulkActions']+=1
  if op['identity']['entity']=='core/schedule':assert body['enabled'] is False
 deferred=set(m.load(package/'rules/migration-decisions.json').get('deferredNativeRequirements',{}))
 issues=m.load(compiled/'issues.json');blocking=[i for i in issues if i['entry'] not in deferred]
 assert not blocking,blocking
 planned_permissions={o['identity']['code'] for o in operations if o['identity']['entity']=='core/permission'}
 unknown=[]
 for pending in m.load(compiled/'pending.json'):
  if pending['key'].rsplit('#',1)[0] in deferred:continue
  for reason in pending['waitingFor']:
   if reason.startswith('permission:'):
    if reason[len('permission:'):] not in planned_permissions:unknown.append(reason)
   elif reason in lookups:
    if not lookups[reason]['planned'] and 'targetId' not in lookups[reason]:unknown.append(reason)
   elif reason in ['load-and-refresh-own-shell','Load and refresh workflow states before events']:pass
   elif reason.startswith('{"$state":'):pass
   elif reason.startswith('registry:'):pass
   elif reason=='unresolved-entry-issues' and pending['key'].rsplit('#',1)[0] in deferred:pass
   elif pending['key'].rsplit('#',1)[0] in deferred:pass
   else:unknown.append(reason)
 assert not unknown,sorted(set(unknown))
 result={'offlineContractChecksPassed':True,'serversChanged':False,'counts':counts,'operations':len(operations),'fieldCoverageEntries':len(coverage),'blockingIssues':blocking,'deferredRequirements':issues,'limits':['No Core save or execution performed.','Fresh reads between import stages must resolve real IDs, optimistic versions, nested identities and permissions.','Synthetic workflow IDs verify the resolver only; they are never exported as upload payloads.']}
 result['artifactHashes']={name:hashlib.sha256((compiled/name).read_bytes()).hexdigest() for name in ['request-templates.json','resolved-requests.json','pending.json','reference-catalog.json','issues.json','role-contracts.json','field-coverage.json']}
 summary=m.load(compiled/'summary.json');summary.update(readyForStagedImport=True,offlineContractChecksPassed=True,note='Offline field, workflow and permission validation passed. Fresh target reads between stages are mandatory. No flat-batch uploader or Core execution is included.');m.save(compiled/'summary.json',summary)
 m.save(compiled/'validation.json',result);print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--package',required=True);p.add_argument('--compiled',required=True);a=p.parse_args();audit(a.package,a.compiled)
