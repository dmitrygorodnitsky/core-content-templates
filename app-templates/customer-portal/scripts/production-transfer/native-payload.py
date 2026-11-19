"""Compile code-addressed Core save templates and materialize resolvable requests.
Offline only: no HTTP client, credentials, or write executor. Unknown references block.
"""
import argparse, copy, hashlib, json, pathlib, re, collections

def load(p): return json.loads(pathlib.Path(p).read_text())
def save(p,v):
 p=pathlib.Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
def key(e,c): return e+'|'+str(c)
def price_dimensions(body):
 # Values are compared only after reference resolution in the target namespace.
 attrs=copy.deepcopy(body.get('attributes',{}))
 for values in attrs.values():values.pop('UNIT_PRICE',None)
 def identity(value):return value.get('id') if isinstance(value,dict) else value
 return {'organization':identity(body.get('organization')),'product':identity(body.get('product')),
         'type':identity(body.get('type')),'terms':attrs}
def match_price(body, rows):
 dimensions=price_dimensions(body)
 matches=[row for row in rows if price_dimensions(row)==dimensions]
 if len(matches)>1:raise ValueError('Ambiguous semantic price identity')
 return matches[0] if matches else None

WORKFLOW_FIELDS = ('nls','entityType','scriptLanguage','onUpdate','onDelete')
STATE_FIELDS = ('nls','onEnter','onExit','style','attributes')
EVENT_FIELDS = ('nls','orderIndex','style','attributes','attributeOrder')
def named_fields(row, fields):
 out={f:copy.deepcopy(row[f]) for f in fields if f in row}
 if 'nls' not in out:out['nls']={'en':{'NAME':row.get('name',row['code']),**({'DESCRIPTION':row['description']} if 'description' in row else {})}}
 return out

def validate_sensor_links(source, resource, definitions):
 """SensorDefinition owns this link; never replace ResourceType's orphan collection."""
 codes=[v.get('code') for v in source]
 if not all(codes) or len(codes)!=len(set(codes)):raise ValueError('Missing or duplicate source sensor code')
 if resource is None:raise ValueError('Target resource type not loaded')
 held=resource.get('sensorDefinitions')
 if held is None or len(held)!=len(codes) or {v.get('code') for v in held}!=set(codes):raise ValueError('Target sensor collection does not match source codes')
 for code in codes:
  matches=[d for d in definitions if d.get('code')==code]
  if len(matches)!=1:raise ValueError('Sensor definition missing or ambiguous: '+code)
  definition=matches[0]
  if definition.get('resourceType',{}).get('id')!=resource['id']:raise ValueError('Sensor definition belongs to another resource type: '+code)
  if next(d for d in held if d.get('code')==code).get('id')!=definition['id']:raise ValueError('Inverse sensor link mismatch: '+code)

def expand_permissions(explicit, patterns, excluded, catalog):
 selected=set(explicit)
 for pattern in patterns:
  regex=re.compile('^'+re.escape(pattern).replace(r'\*','.*')+'$')
  selected.update(p for p in catalog if regex.fullmatch(p))
 selected.difference_update(excluded)
 return sorted(selected),sorted(selected-set(catalog))

def workflow_states(source):
 states=copy.deepcopy(source.get('states',[]));codes=[s['code'] for s in states]
 if len(codes)!=len(set(codes)):raise ValueError('Duplicate state code')
 for state in states:
  events=state.get('events')
  if events is None:events=[e for e in source.get('events',[]) if e.get('source')==state['code']]
  seen=set()
  for event in events:
   if event['code'] in seen:raise ValueError('Duplicate event code within state')
   seen.add(event['code'])
   if 'targets' not in event:raise ValueError('Event targets missing from source snapshot')
   for target in event['targets']:
    if (target.get('code') if isinstance(target,dict) else target) not in codes:raise ValueError('Unknown target state')
  state['events']=events
 initial=source.get('initialState');initial=initial.get('code') if isinstance(initial,dict) else initial
 if initial not in codes:raise ValueError('Unknown initial state')
 return states,initial

def resolve_workflow_identity(body, existing, include_events):
 """Keep target IDs scoped to workflow + state + event; never copy dev IDs."""
 out=copy.deepcopy(body)
 if existing is not None and 'states' not in existing:raise ValueError('Target workflow states were not read')
 held=(existing or {}).get('states',[])
 def index(rows):
  result={}
  for row in rows:
   if row['code'] in result:raise ValueError('Ambiguous nested target code')
   result[row['code']]=row
  return result
 states=index(held)
 if set(states)-{s['code'] for s in out['states']}:raise ValueError('Unexpected target states; refusing implicit removal')
 for state in out['states']:
  previous=states.get(state['code'])
  if previous:state['id']=previous['id']
  elif include_events:raise ValueError('Load and refresh workflow states before events')
  if not include_events:continue
  if previous and 'events' not in previous:raise ValueError('Target workflow events were not read')
  events=index((previous or {}).get('events',[]))
  if set(events)-{e['code'] for e in state['events']}:raise ValueError('Unexpected target events; refusing implicit removal')
  for event in state['events']:
   if event['code'] in events:event['id']=events[event['code']]['id']
   for target in event['targets']:
    target_code=target['id']['$state'].split('|',1)[1]
    if target_code not in states:raise ValueError('Target state not loaded')
    target['id']=states[target_code]['id']
 if include_events:
  initial=out['initialState']['id']['$state'].split('|',1)[1]
  if initial not in states:raise ValueError('Initial state not loaded')
  out['initialState']={'id':states[initial]['id']}
 return out

CLASS={
 'Account':'core-acct/account','Invoice':'core-bill/invoice','Order':'core-bill/order','OrderItem':'core-bill/order-item',
 'Form':'core-cms/form','FormType':'core-cms/form-type','Document':'core/document','Resource':'core-rm/resource',
 'ResourceType':'core-rm/resource-type','Appointment':'core-svc/appointment','Project':'core-svc/project','Task':'core-svc/task',
 'TaskType':'core-svc/task-type','Dictionary':'core/dictionary','Product':'core-pim/product','OrganizationSecret':'core/organization-secret',
 'ContactType':'core/contact-type','User':'core/user','Country':'core/country','Chat':'core/chat','State':'core/state',
 'Address':'core/address','Media':'core/media','LocalizationMessage':'core/localization-message'}
class Compiler:
 def __init__(self,package,sources,target):
  self.package=pathlib.Path(package);self.rules=load(self.package/'rules/migration-decisions.json');self.renames=load(self.package/'rules/script-codes.json');self.source=collections.defaultdict(dict);self.target=collections.defaultdict(list);self.issues=[];self.current='';self.lookups={};self.operations=[];self.pricekeys={};self.permission_requirements=set();self.role_contracts={};self.field_coverage=[]
  for f in sources:
   for e,rows in load(f).get('results',{}).items():
    for r in rows or []:
     self.source[e][str(r.get('id',r.get('code')))]=dict(self.source[e].get(str(r.get('id',r.get('code'))),{}),**r)
  for f in target:
   for e,rows in load(f).get('results',{}).items():
    by={str(r.get('id')):r for r in self.target[e]}
    for r in rows or []:by[str(r.get('id'))]=dict(by.get(str(r.get('id')),{}),**r)
    self.target[e]=list(by.values())
  self.entries={key(v['entity'],v['code']):v for v in load(self.package/'registry.json')}
  self.defs={}
  # A required category absent on prod is imported as a separate prerequisite.
  for code in ['BULK_ACTIONS']:
   entity='core/script-category'; found=[r for r in self.source[entity].values() if r.get('code')==code]
   if not any(r.get('code')==code for r in self.target[entity]) and len(found)==1:
    self.entries[key(entity,code)]={'entity':entity,'code':code,'targetCode':code,'targetOrganization':'GLOBAL','action':'create','sourceCodes':[]}
    self.defs[key(entity,code)]={'source':found[0]}
  for row in self.entries.values():
   if row['entity']=='core/script':
    for old in row.get('sourceCodes',[]):self.renames[old]=row['targetCode']
  for f in (self.package/'source-definitions').glob('*.json'):
   x=load(f);self.defs[key(x['target']['entity'],x['source'].get('code',f.stem.split('__')[-1]))]=x
 def issue(self,reason,path=''):
  self.issues.append({'entry':self.current,'path':path,'reason':reason})
 def canonical(self,e,code):
  if e=='core/script':return self.renames.get(code,code)
  if e=='core/organization':return self.rules['organizationAliases'].get(code,self.rules['organizationMappings'].get(code,code))
  if e=='core/role':return self.rules['roleCodeMappings'].get(code,code)
  return code
 def reference(self,e,v,path='',owner=None):
  if isinstance(v,dict):v=v.get('code',v.get('value',v.get('id')))
  if v is None:return None
  if isinstance(v,int) or str(v).isdigit():
   r=self.source[e].get(str(v))
   if not r or not (r.get('code') or (e=='core/organization-secret' and r.get('name')) or (e=='core/country' and r.get('code2'))):
    self.issue('No source code for '+e+' reference '+str(v),path);return {'$unresolved':e}
   v=r.get('code',r.get('name',r.get('code2')))
  c=self.canonical(e,str(v));k=key(e,c)
  selected=next((r for r in self.entries.values() if r['entity']==e and self.canonical(e,r['targetCode'])==c),None)
  if selected:owner=self.canonical('core/organization',selected['targetOrganization'])
  if owner=='GLOBAL':owner=None
  matches=[r for r in self.target[e] if r.get('code',r.get('name',r.get('code2')))==c and (not owner or r.get('organization',{}).get('code')==owner or e=='core/organization')]
  if not matches and selected and selected.get('action') in ['relocate-update','update']:
   previous_owner=selected.get('prodOwner')
   matches=[r for r in self.target[e] if r.get('code')==c and r.get('organization',{}).get('code')==previous_owner]
  if not matches and selected and any(r.get('code')==c for r in self.target[e]):self.issue('Target code exists outside approved owner: '+k,path)
  if len(matches)>1:self.issue('Ambiguous target '+k,path)
  elif not matches and not selected:self.issue('Required target dependency missing: '+k,path)
  lookup={'entity':e,'code':c,'owner':owner,'matchField':'name' if e=='core/organization-secret' else 'code2' if e=='core/country' else 'code','planned':bool(selected),'matches':len(matches)}
  if len(matches)==1:lookup['targetId']=matches[0]['id']
  self.lookups[k]=lookup
  return {'$ref':k}
 def typed(self,v,cls,path):
  e=CLASS.get((cls or '').split('.')[-1]);
  if not e:return v
  if isinstance(v,list):return [self.reference(e,x,path) for x in v]
  return self.reference(e,v,path)
 def attribute_defs(self,attrs):
  out=copy.deepcopy(attrs)
  replacement=self.rules.get('typedReferenceReplacements',{}).get(self.current,{})
  for a in out:
   c=a.get('className','');e=CLASS.get(c.split('.')[-1]);path='attributes.'+a['code']
   if a.get('entityTypes'):
    te=('core/secret-type' if e=='core/organization-secret' else e+'-type' if e and not e.endswith('-type') else None)
    for r in a['entityTypes']:
     v=r.get('value')
     v=replacement.get('replacements',{}).get(str(v),v)
     if a['code'] in replacement.get('attributes',[]) and str(v)==replacement.get('from'):v=replacement.get('to')
     if e=='core/media':continue  # Media kinds are literals, not entity type IDs.
     if te:r['value']=self.reference(te,v,path+'.entityTypes')
     else:self.issue('Unknown entityTypes registry for '+c,path)
   default=a.get('defaultValue')
   if default is not None:
    if isinstance(default,dict) and 'unit' in default:
     default['unit']=self.reference('core/unit',default['unit'],path+'.default.unit')
     default['value']=self.typed(default.get('value'),c,path+'.default.value')
    else:a['defaultValue']=self.typed(default,c,path+'.defaultValue')
   unit=a.get('unitCategory')
   if isinstance(unit,dict):a['unitCategory']={'value':self.reference('core/unit-category',unit.get('code',unit.get('value')),path+'.unitCategory')}
  return out
 def attributes(self,e,attrs):
  out={};te=e+'-type'
  for oid,values in attrs.items():
   owner=self.source[te].get(str(oid))
   if not owner:self.issue('Unknown attribute owner '+te+' id '+str(oid),'attributes');continue
   ref=self.reference(te,owner,'attributes.owner')['$ref'];defs={a['code']:a for a in owner.get('attributes',[])};written={}
   for code,raw in values.items():
    if code not in defs:self.issue('Missing attribute declaration '+owner['code']+'.'+code,'attributes');continue
    v=copy.deepcopy(raw)
    if 'value' in v:v['value']=self.typed(v['value'],defs[code].get('className'),'attributes.'+code)
    if v.get('unit') is not None:v['unit']=self.reference('core/unit',v['unit'],'attributes.'+code+'.unit')
    written[code]=v
   out['@ref:'+ref]=written
  return out
 def mappings(self,body):
  result=[]
  for n,v in body.items():
   m={'name':n}
   if n in ['organization','parent','type','workflow','script','category','product','initialState','runAs','group','registry','permission']:
    m.update(type='identifier',key='id',mappings=[{'name':'id'}])
   if n in ['parents','permissions','targets']:
    m.update(type='identifier',key='id',mappings=[{'name':'id'}])
   if n in ['states','events']:
    combined={}
    for row in v:
     for field,value in row.items():
      if field in ['states','events']:combined.setdefault(field,[]).extend(value)
      else:combined[field]=value
    m.update(type='collection',mappings=self.mappings(combined))
   result.append(m)
  return result
 def add(self,e,code,body,stage,phase='save',extra=None):
  self.operations.append({'key':key(e,code)+'#'+phase,'identity':{'entity':e,'code':code,'owner':self.canonical('core/organization',self.entries[self.current]['targetOrganization'])},'stage':stage,'method':'POST','path':'/'+e.split('/')[0]+'/api/'+e.split('/')[1]+'/save.json','bodyTemplate':{'entities':[copy.deepcopy(body)],'mappings':self.mappings(body)},'sourceEntry':self.current,**(extra or {})})
 def compile(self):
  for k,row in self.entries.items():
   self.current=k;e=row['entity'];code=self.canonical(e,row['targetCode']);x=self.defs.get(k)
   if row['action'] in ['reuse-system','reuse-existing','reuse','skip','exclude']:
    self.reference(e,code,owner=None if row['targetOrganization']=='GLOBAL' else self.canonical('core/organization',row['targetOrganization']));continue
   if not x:self.issue('Missing local definition');continue
   self.cover_fields(x['source'])
   s=copy.deepcopy(x['source']);owner=self.canonical('core/organization',row['targetOrganization'])
   self.reference(e,code,owner=owner) if e!='core-pim/product-price' else None
   if row['action'] in ['reuse','skip','exclude']:continue
   body={a:s[a] for a in ['code','nls','isAbstract','attributeOrder','attributeGroups','enabled','onUpdate','onDelete','entityType','scriptLanguage','processingConfig','sensorDefinitions'] if a in s};body['code']=code
   if owner!='GLOBAL' and e!='core/organization':body['organization']={'id':self.reference('core/organization',owner)}
   for f,target in [('type',e+'-type'),('workflow','core/workflow'),('script','core/script'),('parent','core/organization')]:
    if s.get(f):body[f]={'id':self.reference(target,s[f],f)}
   if s.get('parents') is not None:body['parents']=[{'id':self.reference(e,r,'parents')} for r in s['parents']]
   if isinstance(s.get('attributes'),list):body['attributes']=self.attribute_defs(s['attributes'])
   elif isinstance(s.get('attributes'),dict):body['attributes']=self.attributes(e,s['attributes'])
   if s.get('sensorDefinitions'):
    existing_id=self.lookups.get(key(e,code),{}).get('targetId')
    existing=next((v for v in self.target[e] if v.get('id')==existing_id),None)
    try:validate_sensor_links(s['sensorDefinitions'],existing,self.target['core-rm/sensor-definition'])
    except ValueError as error:self.issue(str(error),'sensorDefinitions')
    body.pop('sensorDefinitions',None)
   elif 'sensorDefinitions' in body:
    existing_id=self.lookups.get(key(e,code),{}).get('targetId')
    existing=next((v for v in self.target[e] if v.get('id')==existing_id),None)
    if existing and existing.get('sensorDefinitions'):self.issue('Target sensor definitions are not empty; refusing implicit removal','sensorDefinitions')
    body.pop('sensorDefinitions')
   if e.endswith('-type'):
    shell={f:v for f,v in body.items() if f not in ['parents','workflow','attributes','attributeOrder','attributeGroups','sensorDefinitions','processingConfig']}
    self.add(e,code,shell,20,'shell');self.add(e,code,{f:v for f,v in body.items() if f!='workflow'},40,'attributes')
    if 'workflow'in body:self.add(e,code,{f:body[f] for f in ['code','organization','workflow'] if f in body},60,'workflow')
   elif e=='core/script':
    for f in ['language','metadata','executable']:body[f]=s.get(f)
    body['content']=(self.package/'source-definitions'/s['contentFile']).resolve().read_text()
    body['category']={'id':self.reference('core/script-category',s['category'],'category')} if s.get('category') is not None else None
    if s.get('environmentMetadata'):
     env=s['environmentMetadata'].get('prod',s['environmentMetadata'].get('dev-1',{}))
     body['metadata']={**(body['metadata'] or {}),**self.environment(env)}
    body['metadata']=self.environment(body['metadata'])
    self.add(e,code,body,30)
   elif e=='core/workflow':
    if 'nls' not in body:body['nls']={'en':{'NAME':s.get('name',code),'DESCRIPTION':s.get('description','')}}
    try:states,initial=workflow_states(s)
    except ValueError as err:self.issue(str(err),'states');continue
    shell=copy.deepcopy(body);shell.pop('initialState',None)
    shell['scriptLanguage']=s.get('scriptLanguage','JavaScript')
    shell['states']=[{'code':t['code'],**named_fields(t,STATE_FIELDS)} for t in states]
    for state in shell['states']:
     if 'attributes' in state:state['attributes']=self.attribute_defs(state['attributes'])
    self.add(e,code,shell,35,'states',{'nestedIdentity':'states'})
    for t,b in zip(states,shell['states']):
     b['events']=[]
     for index,ev in enumerate(t['events']):
      z={'code':ev['code'],**named_fields(ev,EVENT_FIELDS)};z.setdefault('orderIndex',index)
      if 'attributes'in z:z['attributes']=self.attribute_defs(z['attributes'])
      z['targets']=[{'id':{'$state':code+'|'+(v.get('code') if isinstance(v,dict) else v)}} for v in ev['targets']];b['events'].append(z)
    shell['initialState']={'id':{'$state':code+'|'+initial}}
    self.add(e,code,shell,55,'events',{'nestedIdentity':'events'})
   elif e=='core/role':
    body['nls']=s.get('nls',{'en':{'NAME':s.get('name',code),'DESCRIPTION':s.get('description','')}})
    source_permissions={self.rename_permission(v['id']) for v in self.source['core/permission'].values()}
    explicit=[self.rename_permission(v) for v in s.get('permissionIds',[])];patterns=[self.rename_permission(v) for v in s.get('permissionPatterns',[])];excluded=[self.rename_permission(v) for v in s.get('excludedPermissionIds',[])]
    frozen,missing=expand_permissions(explicit,patterns,excluded,source_permissions)
    for permission in missing:self.issue('Permission absent from source catalog: '+permission,'permissions')
    body['permissions']={'$permissions':{'explicit':frozen,'patterns':[],'exclude':[]}}
    body_permission_contract={'sourcePatterns':patterns,'sourceExclusions':excluded,'expectedPermissions':frozen}
    self.permission_requirements.update(frozen)
    self.role_contracts[code]=body_permission_contract
    self.add(e,code,body,80,extra={'permissionValidation':'All explicit permissions must exist after loading definitions; expand patterns from fresh target permission catalog, never silently drop missing permissions'})
   elif e=='core-pim/product-price':
    body.pop('code');body['product']={'id':self.reference('core-pim/product',s.get('product'),'product')}
    terms=copy.deepcopy(body.get('attributes',{}))
    for vals in terms.values():vals.pop('UNIT_PRICE',None)
    identity={'organization':body['organization'],'product':body['product'],'type':body.get('type'),'terms':terms}
    canonical=json.dumps(identity,sort_keys=True);pk=hashlib.sha256(canonical.encode()).hexdigest()
    if pk in self.pricekeys:self.issue('Duplicate semantic price identity with '+self.pricekeys[pk])
    self.pricekeys[pk]=k
    self.add(e,code,body,75,extra={'identity':{'entity':e,'priceKey':pk,'dimensions':identity},'pricePolicy':'Match owner/product/type and all pricing dimensions except UNIT_PRICE. Zero matches=create, one=update, several=block. Never use SOURCE_ID as target identity.'})
   elif e=='core-rpt/report':
    self.issue('Report requires multipart source file; source snapshot has metadata only','file')
    self.add(e,code,body,70,extra={'contentType':'multipart/form-data','requiredFile':code})
   elif e=='core/schedule':
    proposal=next(v for v in load(self.package/'proposals/schedules.json') if v['code']==code)
    for f in ['className','cronString','parameters']:body[f]=proposal[f]
    body['enabled']=False;body['runAs']={'id':{'$systemUser':True}};body['group']={'id':self.reference('core/schedule-group',s.get('group'),'group')};self.add(e,code,body,90)
   else:self.add(e,code,body,10 if e in ['core/organization','core/script-category'] else 70)
  self.compile_bulk_actions()
  self.compile_permissions()
  self.check_grants()
  return self
 def cover_fields(self,source):
  derived={'id','optimistic','updated','serverUpdated','organization','parent','parents','type','script','workflow','category','product','initialState','attributes','contentFile','environmentMetadata','name','description','states','events','grantPermissions','permissionIds','permissionPatterns','excludedPermissionIds','runAs','group'}
  direct={'code','nls','isAbstract','attributeOrder','attributeGroups','enabled','onUpdate','onDelete','entityType','scriptLanguage','processingConfig','sensorDefinitions','language','metadata','executable','className','cronString','parameters'}
  unknown=set(source)-derived-direct
  for field in sorted(unknown):self.issue('Unclassified source field '+field,'fieldCoverage')
  self.field_coverage.append({'entry':self.current,'direct':sorted(set(source)&direct),'transformedOrAudit':sorted(set(source)&derived),'unhandled':sorted(unknown)})
  if self.current.startswith('core/workflow|'):
   for state in source.get('states',[]):
    for field in set(state)-set(STATE_FIELDS)-{'id','code','name','description','events'}:self.issue('Unhandled state field '+field,'fieldCoverage')
    for event in state.get('events',[]):
     for field in set(event)-set(EVENT_FIELDS)-{'id','code','source','name','description','targets'}:self.issue('Unhandled event field '+field,'fieldCoverage')
 def check_grants(self):
  for entry,definition in self.defs.items():
   if not entry.startswith('core/workflow|'):continue
   source=definition['source'];self.current=entry
   for grant in source.get('grantPermissions',[]):
    role=self.canonical('core/role',grant['roleCode'])
    if role not in self.role_contracts:continue
    states,_=workflow_states(source);events={ev['code'] for st in states for ev in st['events']}
    required=events if '*' in grant['events'] else set(grant['events'])
    required=required-set(grant.get('exceptEvents',[]))
    held=set(self.role_contracts[role]['expectedPermissions'])
    for event in required:
     permission='P_WF:'+source['code']+':'+event
     if permission not in held:self.issue('Workflow grant missing from selected role '+role+': '+permission,'grantPermissions')
 def compile_permissions(self):
  source={}
  for permission in self.source['core/permission'].values():
   source.setdefault(self.rename_permission(permission['id']),permission)
  present={r['id'] for r in self.target['core/permission']}
  for permission in sorted(self.permission_requirements-present):
   self.current=key('core/permission',permission)
   if permission not in source:self.issue('No source permission definition');continue
   self.entries[self.current]={'targetOrganization':'WINTER_SERVICES'}
   held=source[permission]
   body={f:held[f] for f in ['name','description','group','manual'] if f in held};body['id']=permission
   if body.get('name')==held['id']:body['name']=permission
   body['organization']={'id':self.reference('core/organization','WINTER_SERVICES')}
   self.add('core/permission',permission,body,65,extra={'identity':{'entity':'core/permission','code':permission,'matchField':'id','owner':'WINTER_SERVICES'}})
 def compile_bulk_actions(self):
  path=self.package/'bindings/snowBulkActions.json'
  if not path.exists():return
  for row in load(path)['registries']:
   owner=self.canonical('core/organization',row['organization']);entity_type=row['targetEntityType']
   registry_code=owner+'|'+entity_type;self.current=key('core/bulk-action-registry',registry_code)
   self.entries[self.current]={'targetOrganization':owner}
   body={'organization':{'id':self.reference('core/organization',owner)},'targetEntityType':entity_type}
   self.add('core/bulk-action-registry',registry_code,body,81,extra={'compoundIdentity':{'organization':owner,'targetEntityType':entity_type}})
   for action in row['actions']:
    script=self.canonical('core/script',action['script']);function=action['function'];permission=self.rename_permission(action['permission'])
    code=registry_code+'|'+script+'|'+function;self.current=key('core/bulk-action',code);self.entries[self.current]={'targetOrganization':owner}
    definition=next((x['source'] for k,x in self.defs.items() if k==key('core/script',script)),None)
    if definition is None or function not in {f['name'] for f in definition.get('metadata',{}).get('FUNCTIONS',[])}:self.issue('Bulk action function is not published by script: '+script+'.'+function)
    body={f:action[f] for f in ['function','icon','nls','attributeGroups','attributeOrder'] if f in action}
    body['attributes']=self.attribute_defs(action.get('attributes',[]))
    body.update(organization={'id':self.reference('core/organization',owner)},registry={'id':{'$registry':registry_code}},script={'id':self.reference('core/script',script)},permission={'id':{'$permission':permission}})
    self.permission_requirements.add(permission)
    self.add('core/bulk-action',code,body,82,extra={'compoundIdentity':{'organization':owner,'targetEntityType':entity_type,'script':script,'function':function}})
 def environment(self,value):
  if isinstance(value,dict):return {k:(self.canonical('core/organization',v) if k in ['parentOrganizationCode','organizationCode','sellerOrganizationCode'] and isinstance(v,str) else self.environment(v)) for k,v in value.items()}
  if isinstance(value,list):return [self.environment(v) for v in value]
  rule=self.rules['urlTransformation']
  if isinstance(value,str) and value.startswith(rule['sourceOrigin']+'/'):return rule['targetOrigin']+value[len(rule['sourceOrigin']):]
  return value
 def rename_permission(self,p):
  if p.startswith('P_SCRIPT_X_'):return 'P_SCRIPT_X_'+self.canonical('core/script',p[len('P_SCRIPT_X_'):])
  return p
 def materialize(self,v,waiting):
  if isinstance(v,list):return [self.materialize(x,waiting) for x in v]
  if not isinstance(v,dict):return v
  if '$ref'in v:
   r=self.lookups[v['$ref']]
   if 'targetId'in r:return r['targetId']
   waiting.add(v['$ref']);return None
  if '$systemUser' in v:
   matches=[u for u in self.target['core/user'] if u.get('name')=='system']
   if len(matches)==1:return matches[0]['id']
   waiting.add('system-user:matches='+str(len(matches)));return None
  if '$permission' in v:
   permission=v['$permission']
   if any(p['id']==permission for p in self.target['core/permission']):return permission
   waiting.add('permission:'+permission);return None
  if '$registry' in v:
   owner,entity_type=v['$registry'].split('|',1)
   matches=[r for r in self.target['core/bulk-action-registry'] if r.get('organization',{}).get('code')==owner and r.get('targetEntityType')==entity_type]
   if len(matches)==1:return matches[0]['id']
   waiting.add('registry:'+v['$registry']+':matches='+str(len(matches)));return None
  if '$permissions' in v:
   if 'core/permission' not in self.target:waiting.add('permission-catalog-not-read');return None
   rule=v['$permissions'];catalog={r['id'] for r in self.target['core/permission']}
   permissions,missing=expand_permissions(rule['explicit'],rule['patterns'],rule['exclude'],catalog)
   waiting.update('permission:'+p for p in missing)
   return [{'id':p} for p in permissions]
  if any(k.startswith('$') for k in v):waiting.add(json.dumps(v,sort_keys=True));return None
  out={}
  for k,x in v.items():
   if k.startswith('@ref:'):
    ref=k[5:];k=self.materialize({'$ref':ref},waiting)
    if k is None:continue
    k=str(k)
   out[k]=self.materialize(x,waiting)
  return out
 def write(self,out):
  out=pathlib.Path(out);out.mkdir(parents=True,exist_ok=True);ready=[];pending=[]
  if (out/'validation.json').exists():(out/'validation.json').unlink()
  for op in sorted(self.operations,key=lambda x:(x['stage'],x['key'])):
   wait=set();template=copy.deepcopy(op['bodyTemplate'])
   if op.get('nestedIdentity'):
    found=self.lookups.get(key(op['identity']['entity'],op['identity']['code']),{}).get('targetId')
    existing_workflow=next((w for w in self.target['core/workflow'] if w['id']==found),None)
    try:
     template['entities'][0]=resolve_workflow_identity(template['entities'][0],existing_workflow,op['nestedIdentity']=='events')
     template['mappings']=self.mappings(template['entities'][0])
    except ValueError as err:wait.add(str(err))
   body=self.materialize(template,wait)
   if any(i['entry']==op['sourceEntry'] for i in self.issues):wait.add('unresolved-entry-issues')
   compound=op.get('compoundIdentity')
   if compound:
    registries=[r for r in self.target['core/bulk-action-registry'] if r.get('organization',{}).get('code')==compound['organization'] and r.get('targetEntityType')==compound['targetEntityType']]
    if len(registries)>1:wait.add('ambiguous-bulk-registry')
    if len(registries)==1:
     rows=registries if op['identity']['entity']=='core/bulk-action-registry' else [r for r in registries[0].get('actions',[]) if r.get('script',{}).get('code')==compound['script'] and r.get('function')==compound['function']]
     if len(rows)>1:wait.add('ambiguous-bulk-action')
     elif rows:
      for field in ['id','optimistic']:
       if field in rows[0]:body['entities'][0][field]=rows[0][field];body['mappings'].append({'name':field})
   identity=op['identity'];target=self.lookups.get(key(identity['entity'],identity.get('code','')),{});existing=target.get('targetId')
   if op['key'].rsplit('#',1)[-1] in ['attributes','workflow','events'] and existing is None:wait.add('load-and-refresh-own-shell')
   if existing is not None:
    body['entities'][0]['id']=existing;body['mappings'].append({'name':'id'})
    target_row=next(r for r in self.target[identity['entity']] if r['id']==existing)
    if 'optimistic' in target_row:body['entities'][0]['optimistic']=target_row['optimistic'];body['mappings'].append({'name':'optimistic'})
   if identity.get('priceKey') and not wait:
    try:
     price=match_price(body['entities'][0],self.target['core-pim/product-price'])
     if price:
      body['entities'][0]['id']=price['id'];body['mappings'].append({'name':'id'})
      if 'optimistic' in price:body['entities'][0]['optimistic']=price['optimistic'];body['mappings'].append({'name':'optimistic'})
    except ValueError:wait.add('ambiguous-semantic-price-match')
   if wait:pending.append({'key':op['key'],'waitingFor':sorted(wait)})
   else:ready.append({'key':op['key'],'method':op['method'],'path':op['path'],'body':body,'status':'DRAFT_NOT_APPROVED_FOR_EXECUTION','precondition':'Re-read target by identity immediately before save; abort on ambiguity or changed optimistic version.'})
  save(out/'request-templates.json',self.operations);save(out/'resolved-requests.json',ready);save(out/'pending.json',pending);save(out/'reference-catalog.json',self.lookups);save(out/'issues.json',self.issues);save(out/'role-contracts.json',self.role_contracts);save(out/'field-coverage.json',self.field_coverage)
  result={'readyToApply':False,'entries':len(self.entries),'operations':len(self.operations),'resolvedRequests':len(ready),'deferredRequests':len(pending),'issues':len(self.issues),'priceIdentities':len(self.pricekeys),'serversChanged':False,'note':'Draft payload: no uploader. Resolved references do not establish payload completeness. Staged refresh and full field-contract validation are required before applying.'};save(out/'summary.json',result);print(json.dumps(result))
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--package',required=True);ap.add_argument('--source',action='append',required=True);ap.add_argument('--target',action='append',required=True);ap.add_argument('--output',required=True);a=ap.parse_args();Compiler(a.package,a.source,a.target).compile().write(a.output)
