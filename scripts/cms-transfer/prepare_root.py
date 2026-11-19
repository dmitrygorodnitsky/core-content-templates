"""Offline CMS request compiler. No HTTP client or write executor."""
import argparse,copy,hashlib,json,pathlib,re,shutil,zipfile

def load(p):return json.loads(pathlib.Path(p).read_text())
def save(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def ref(k):return {'$ref':k}
def marker(k):return '{{REF:'+k+'}}'
def resolve(v,bindings):
 if isinstance(v,dict):
  if set(v)=={'$ref'}:
   if v['$ref'] not in bindings:raise ValueError('Unresolved '+v['$ref'])
   return bindings[v['$ref']]
  return {resolve(k,bindings):resolve(x,bindings) for k,x in v.items()}
 if isinstance(v,list):return [resolve(x,bindings) for x in v]
 if isinstance(v,str):
  def replace(m):
   if m[1] not in bindings:raise ValueError('Unresolved '+m[1])
   return str(bindings[m[1]])
  return re.sub(r'\{\{REF:(.*?)\}\}',replace,v)
 return v

def mappings(body):
 result=[]
 for k,v in body.items():
  m={'name':k}
  if k in ['organization','parent','workflow','initialState','template','mediaLibrary','script','imageWorkflow','soundWorkflow','videoWorkflow','mediaAssetWorkflow','parents','targets']:
   m.update(type='identifier',key='id',mappings=[{'name':'id'}])
  elif k in ['states','events']:
   merged={}
   for x in v:
    for field,value in x.items():
     if field=='events':merged.setdefault(field,[]).extend(value)
     else:merged[field]=value
   m.update(type='collection',mappings=mappings(merged))
  result.append(m)
 return result

def compile_package(source,out):
 snapshot=load(source/'snapshot.json')['results'];target=load(source/'prod-dependencies.json')['results'];scope=load(source/'root-scope.json');src=source/'root-package-source';forms=load(src/'forms.json');workflow=load(src/'workflow.json');libs=load(src/'libraries.json');checks=load(source/'root-media-check.json')
 out.mkdir(parents=True,exist_ok=True);ops=[];identities={};bindings={};issues=[]
 def ident(key,entity,selector):identities[key]={'entity':entity,'selector':selector}
 for o in target['core/organization']:
  key='organization|'+o['code'];ident(key,'core/organization',{'code':o['code']});bindings[key]=o['id']
 def add(key,entity,body,stage,phase='create',capture=None):
  ops.append({'key':key+'#'+phase,'stage':stage,'method':'POST','path':'/'+entity.split('/')[0]+'/api/'+entity.split('/')[1]+'/save.json','capture':capture or key,'guard':'create only if exact semantic identity absent; updates require fresh optimistic version','bodyTemplate':{'entities':[body],'mappings':mappings(body)}})
 blockpaths={};rootzip=zipfile.ZipFile(src/'root-export.bin');root= json.loads(rootzip.read('block_template_config.json'));nodes=[]
 def visit(n,parent=''):
  path=(parent+'/' if parent else '')+n['code'];blockpaths[n['id']]=path;nodes.append((n,path,parent))
  for c in n.get('children',[]):visit(c,path)
 visit(root);assert len(nodes)==35
 media={m['id']:m for m in scope['media']};checkmap={m['id']:m for m in checks};libmap={l['id']:l for l in libs};needed=set(m['mediaLibrary']['id'] for m in media.values())
 for i in list(needed):
  l=libmap[i]
  while l.get('parent'):
   i=l['parent']['id'];needed.add(i);l=libmap[i]
 for i in sorted(needed):
  l=libmap[i];key='library|'+l['code'];ident(key,'core/media-library',{'code':l['code'],'organizationCode':l['organization']['code']})
  matches=[r for r in target['core/media-library'] if r['code']==l['code'] and r.get('organization',{}).get('code')==l['organization']['code']]
  if len(matches)==1:bindings[key]=matches[0]['id'];continue
  if matches:raise ValueError('Ambiguous library '+key)
  body={k:copy.deepcopy(l[k]) for k in ['code','nls','hidden','permissions'] if k in l};body['organization']={'id':ref('organization|'+l['organization']['code'])}
  if l.get('parent'):body['parent']={'id':ref('library|'+libmap[l['parent']['id']]['code'])}
  for k in ['imageWorkflow','videoWorkflow','soundWorkflow','mediaAssetWorkflow']:
   if l.get(k):issues.append('Library workflow requires explicit comparison: '+l['code']+'.'+k)
  add(key,'core/media-library',body,10)
 mediarefs={}
 for uid,m in media.items():
  c=checkmap[uid];file=src/'media'/uid;digest=hashlib.sha256(file.read_bytes()).hexdigest();assert digest==c['sha256'] and file.stat().st_size>0
  key='media|'+m['mediaLibrary']['code']+'|'+m['name']+'|'+digest;mediarefs[uid]=key;ident(key,'core/'+c['kind'],{'libraryCode':m['mediaLibrary']['code'],'name':m['name'],'format':m['format'],'sha256':digest})
  rel='media/'+digest; (out/'media').mkdir(exist_ok=True);shutil.copyfile(file,out/rel)
  ops.append({'key':key+'#upload','stage':20,'method':'POST','path':'/core/api/media/save.json','capture':key,'guard':'resolve library/name/hash before upload; never match by source UUID alone','multipartTemplate':{'library':ref('library|'+m['mediaLibrary']['code']),'files':[{'path':rel,'filename':m['name'],'contentType':m['format'],'sha256':digest}]}})
 def strings(v):
  if isinstance(v,dict):return {strings(k):strings(x) for k,x in v.items()}
  if isinstance(v,list):return [strings(x) for x in v]
  if isinstance(v,str):
   for uid,path in blockpaths.items():v=v.replace(uid,marker('block|'+path))
   for uid,key in mediarefs.items():v=v.replace(uid,marker(key))
  return v
 # Workflow states are created before linking events/initial state.
 wkey='workflow|FORM';ident(wkey,'core/workflow',{'code':'FORM','organizationCode':'SYSTEM'});wb={k:workflow[k] for k in ['code','nls','entityType','scriptLanguage','onUpdate','onDelete'] if k in workflow};wb['organization']={'id':ref('organization|SYSTEM')};wb['states']=[]
 for st in workflow['states']:
  sk='state|FORM|'+st['code'];ident(sk,'core/workflow.states',{'workflowCode':'FORM','code':st['code']});wb['states'].append({k:st[k] for k in ['code','nls','onEnter','onExit','style','attributes'] if k in st})
 add(wkey,'core/workflow',copy.deepcopy(wb),30,'states')
 wb['id']=ref(wkey);wb['optimistic']=ref('optimistic|'+wkey)
 for body,st in zip(wb['states'],workflow['states']):
  body['id']=ref('state|FORM|'+st['code']);body['events']=[]
  for ev in st.get('events',[]):
   event={k:ev[k] for k in ['code','nls','orderIndex','style','attributes','attributeOrder'] if k in ev};event['targets']=[{'id':ref('state|FORM|'+t['code'])} for t in ev['targets']];body['events'].append(event)
 wb['initialState']={'id':ref('state|FORM|'+workflow['initialState']['code'])};add(wkey,'core/workflow',wb,31,'events')
 formids={f['id']:f['code'] for f in forms}
 def form_refs(v):
  if isinstance(v,list):return [form_refs(x) for x in v]
  if isinstance(v,dict):return {k:ref('form|'+formids[x]) if k=='typeId' else form_refs(x) for k,x in v.items()}
  return v
 pending={f['code']:f for f in forms};done=set()
 while pending:
  ready=[f for f in pending.values() if all(p['code'] in done for p in f.get('parents',[]))]
  if not ready:raise ValueError('Form parent cycle')
  for f in ready:
   key='form|'+f['code'];ident(key,'core-cms/form-type',{'code':f['code'],'organizationCode':f['organization']['code']});body=form_refs({k:copy.deepcopy(f[k]) for k in ['code','nls','attributes','attributeGroups','attributeOrder','permissions','isAbstract'] if k in f});body.update(organization={'id':ref('organization|'+f['organization']['code'])},workflow={'id':ref(wkey)},parents=[{'id':ref('form|'+p['code'])} for p in f.get('parents',[])])
   if f.get('image'):raise ValueError('Unresolved form image')
   add(key,'core-cms/form-type',body,40);done.add(f['code']);del pending[f['code']]
 orgs={o['id']:o['code'] for o in snapshot['core/organization']};orgparams=set();block_updates=[]
 for n,path,parent in nodes:
  key='block|'+path;ident(key,'core-cms/block-template',{'organizationCode':'SYSTEM','path':path});body=strings({k:copy.deepcopy(n[k]) for k in ['code','nls','head','html','javascript','css','templateLanguage','advanced','parameters'] if k in n});body['organization']={'id':ref('organization|SYSTEM')}
  if parent:body['parent']={'id':ref('block|'+parent)}
  for param in body.get('parameters',[]):
   if 'ORGANIZ' in param['code'] and isinstance(param.get('value'),int):orgparams.add(param['code']);param['value']=ref('organization|'+orgs[param['value']])
  shell={k:copy.deepcopy(body[k]) for k in ['code','nls','organization','parent','templateLanguage','advanced'] if k in body}
  add(key,'core-cms/block-template',shell,50,'shell')
  body.update(id=ref(key),optimistic=ref('optimistic|'+key));block_updates.append((key,body))
 for key,body in block_updates:add(key,'core-cms/block-template',body,51,'content')
 pages=json.loads(zipfile.ZipFile(src/'pages-export.bin').read('page_context_config.json'));rawpages={p['url']:p for p in snapshot['core-cms/page-context'] if p['organization']['code']=='SERVICEWAND'};orphans=[]
 for page in pages:
  page=copy.deepcopy(page);key='page|SERVICEWAND|'+page['url'];ident(key,'core-cms/page-context',{'organizationCode':'SERVICEWAND','site':None,'url':page['url']})
  for bid in list(page.get('values',{})):
   if bid not in blockpaths:orphans.append({'page':page['url'],'sourceGroup':bid,'values':page['values'].pop(bid),'decision':'quarantine only; never attach to a similar live block'})
  for values in page.get('values',{}).values():
   for code,value in list(values.items()):
    if code in orgparams:values[code]=ref('organization|'+orgs[value])
  body=strings({k:page[k] for k in ['url','permissions','enabledTemplates','values'] if k in page});body.update(site=rawpages[page['url']].get('site'),organization={'id':ref('organization|SERVICEWAND')},template={'id':ref('block|CORPORATE_LANDING_JTE')});add(key,'core-cms/page-context',body,60)
 assert len(orphans)==3 and {tuple(x['values']) for x in orphans}=={('TABLE_COL_CRM',),('DOCUMENT_CODE',),('FEAT_CARD_3_TITLE',)}
 save(out/'quarantined-overrides.json',orphans);save(out/'identities.json',identities);save(out/'bindings-observed.json',bindings);save(out/'requests.json',ops);save(out/'issues.json',issues)
 save(out/'manifest.json',{'serversChanged':False,'operations':len(ops),'blocks':35,'pages':10,'forms':10,'media':53,'workflowStates':len(workflow['states']),'workflowEvents':sum(len(s['events']) for s in workflow['states']),'issues':issues,'status':'offline-request-templates; resolve target IDs from read-back before each stage','sourceIdPolicy':'source IDs are evidence only; target references resolve through semantic keys','domain':'servicewand.com','formDestinationPolicy':'preserve source PNI/SERVICEWAND distribution'})
 save(out/'SHA256SUMS.json',{str(f.relative_to(out)):hashlib.sha256(f.read_bytes()).hexdigest() for f in out.rglob('*') if f.is_file() and f.name!='SHA256SUMS.json'})
 return ops,identities

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--out',required=True);a=p.parse_args();ops,ids=compile_package(pathlib.Path(a.source),pathlib.Path(a.out));print('Compiled',len(ops),'ordered request templates;',len(ids),'semantic identities; no server writes')
