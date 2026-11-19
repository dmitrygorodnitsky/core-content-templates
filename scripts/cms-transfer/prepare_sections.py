"""Compile the explicitly scoped second CMS wave; no network calls."""
import copy,hashlib,json,pathlib,shutil,zipfile
from prepare_root import mappings,ref,marker,save,load
src=pathlib.Path('tmp/cms-stage-2a-source');out=pathlib.Path('tmp/cms-stage-2a');out.mkdir(exist_ok=True)
snapshot=load('tmp/cms-stage-2/source.json')['results'];scope=load(src/'scope.json');checks={x['id']:x for x in load(src/'checks.json')};sourceblocks={x['id']:x for x in scope['blocks']};libs={x['id']:x for x in snapshot['core/media-library']};ops=[];identities={};nodes=[];paths={}
def ident(k,e,s):identities[k]={'entity':e,'selector':s}
def add(k,e,body,stage,phase):ops.append({'key':k+'#'+phase,'stage':stage,'method':'POST','path':'/'+e.split('/')[0]+'/api/'+e.split('/')[1]+'/save.json','capture':k,'bodyTemplate':{'entities':[body],'mappings':mappings(body)}})
for o in snapshot['core/organization']:ident('organization|'+o['code'],'core/organization',{'code':o['code']})
def visit(n,parent=''):
 p=(parent+'/' if parent else '')+n['code'];paths[n['id']]=p;nodes.append((n,p,parent))
 for c in n.get('children',[]):visit(c,p)
for code in ['FIELD_SERVICE_LANDING','SNOW_REMOVAL_LANDING','SNOW_REMOVAL_LANDING_NEW_REDIRECT']:
 visit(json.loads(zipfile.ZipFile(src/(code+'.zip')).read('block_template_config.json')))
assert len(nodes)==20 and set(paths)==set(sourceblocks)
needed={m['mediaLibrary']['id'] for m in scope['media']}
for lid in sorted(needed):
 l=libs[lid];assert not l.get('parent'),'Resolve parent library explicitly';k='library|'+l['code'];ident(k,'core/media-library',{'code':l['code'],'organizationCode':l['organization']['code']});body={f:copy.deepcopy(l[f]) for f in ['code','nls','hidden','permissions'] if f in l};body['organization']={'id':ref('organization|'+l['organization']['code'])};add(k,'core/media-library',body,10,'create')
mediarefs={};(out/'media').mkdir(exist_ok=True)
for m in scope['media']:
 c=checks[m['id']];file=src/'media'/m['id'];assert c['sha256']==hashlib.sha256(file.read_bytes()).hexdigest() and c['bytes']>0;k='media|'+m['mediaLibrary']['code']+'|'+m['name']+'|'+c['sha256'];mediarefs[m['id']]=k;ident(k,'core/'+m['kind'],{'libraryCode':m['mediaLibrary']['code'],'name':m['name'],'format':m['format'],'sha256':c['sha256']});rel='media/'+c['sha256'];shutil.copyfile(file,out/rel);ops.append({'key':k+'#upload','stage':20,'method':'POST','path':'/core/api/media/save.json','capture':k,'multipartTemplate':{'library':ref('library|'+m['mediaLibrary']['code']),'files':[{'path':rel,'filename':m['name'],'contentType':m['format'],'sha256':c['sha256']}]}})
def remap(v):
 if isinstance(v,dict):return {remap(k):remap(x) for k,x in v.items()}
 if isinstance(v,list):return [remap(x) for x in v]
 if isinstance(v,str):
  for uid,p in paths.items():v=v.replace(uid,marker('block|'+p))
  for uid,k in mediarefs.items():v=v.replace(uid,marker(k))
 return v
updates=[]
for n,p,parent in nodes:
 k='block|'+p;owner=sourceblocks[n['id']]['organization']['code'];ident(k,'core-cms/block-template',{'organizationCode':owner,'path':p});body=remap({f:copy.deepcopy(n[f]) for f in ['code','nls','head','html','javascript','css','templateLanguage','advanced','parameters'] if f in n});body['organization']={'id':ref('organization|'+owner)}
 if parent:body['parent']={'id':ref('block|'+parent)}
 assert not any('ORGANIZ' in a['code'] and isinstance(a.get('value'),int) for a in body.get('parameters',[]))
 add(k,'core-cms/block-template',{f:copy.deepcopy(body[f]) for f in ['code','nls','organization','parent','templateLanguage','advanced'] if f in body},50,'shell');body.update(id=ref(k),optimistic=ref('optimistic|'+k));updates.append((k,body))
for k,b in updates:add(k,'core-cms/block-template',b,51,'content')
raw={x['url']:x for x in scope['pages']};pages=json.loads(zipfile.ZipFile(src/'pages.zip').read('page_context_config.json'));assert len(pages)==3
for pg in pages:
 r=raw[pg['url']];assert not(set(pg.get('values',{}))-set(paths)),'Unexpected orphan override';k='page|SERVICEWAND|'+pg['url'];ident(k,'core-cms/page-context',{'organizationCode':'SERVICEWAND','site':r.get('site'),'url':pg['url']});body=remap({f:copy.deepcopy(pg[f]) for f in ['url','permissions','enabledTemplates','values'] if f in pg});body.update(site=r.get('site'),organization={'id':ref('organization|SERVICEWAND')},template={'id':ref('block|'+paths[r['template']['id']])});add(k,'core-cms/page-context',body,60,'create')
save(out/'requests.json',ops);save(out/'identities.json',identities);save(out/'manifest.json',{'scope':'Field Service, Snow Removal and redirect only','pages':3,'blocks':20,'media':len(mediarefs),'operations':len(ops),'pricesChanged':False,'domainChanged':False});save(out/'SHA256SUMS.json',{str(f.relative_to(out)):hashlib.sha256(f.read_bytes()).hexdigest() for f in out.rglob('*') if f.is_file() and f.name!='SHA256SUMS.json'});print(len(ops),'operations',len(mediarefs),'media')
