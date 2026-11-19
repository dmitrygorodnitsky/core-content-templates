"""Compile the explicitly scoped blog wave; no network calls."""
import copy,hashlib,json,pathlib,shutil,zipfile
from prepare_root import mappings as base_mappings,ref,marker,save,load
import datetime,re
def mappings(body):
 result=base_mappings(body)
 for m in result:
  if m['name'] in ['author','language','blogPost','heroImage','image','categories','tags','images']:
   m.update(type='identifier',key='id',mappings=[{'name':'id'}]+([{'name':'mediaType'}] if m['name'] in ['images','heroImage','image'] else []))
 return result
src=pathlib.Path('tmp/cms-blog-source');out=pathlib.Path('tmp/cms-blog-stage-2b');out.mkdir(exist_ok=True)
snapshot=load(src/'source.json')['results'];scope=load(src/'scope.json');checks={x['id']:x for x in load(src/'checks.json')};sourceblocks={x['id']:x for x in scope['blocks']};libs={x['id']:x for x in snapshot['core/media-library']};ops=[];identities={};nodes=[];paths={}
def ident(k,e,s):identities[k]={'entity':e,'selector':s}
def add(k,e,body,stage,phase):ops.append({'key':k+'#'+phase,'stage':stage,'method':'POST','path':'/'+e.split('/')[0]+'/api/'+e.split('/')[1]+'/save.json','capture':k,'bodyTemplate':{'entities':[body],'mappings':mappings(body)}})
for o in snapshot['core/organization']:ident('organization|'+o['code'],'core/organization',{'code':o['code']})
def visit(n,parent=''):
 p=(parent+'/' if parent else '')+n['code'];paths[n['id']]=p;nodes.append((n,p,parent))
 for c in n.get('children',[]):visit(c,p)
for code in ['FIELD_SERVICE_BLOG_INDEX_ROOT','FIELD_SERVICE_BLOG_POST_ROOT']:
 visit(json.loads(zipfile.ZipFile(src/(code+'.zip')).read('block_template_config.json')))
assert len(nodes)==8 and set(paths)==set(sourceblocks)
needed={m['mediaLibrary']['id'] for m in scope['media']}
for lid in list(needed):
 parent=libs[lid].get('parent')
 while parent:
  needed.add(parent['id']);parent=libs[parent['id']].get('parent')
def depth(lid):return 1+depth(libs[lid]['parent']['id']) if libs[lid].get('parent') else 0
for lid in sorted(needed,key=depth):
 l=libs[lid];k='library|'+l['code'];ident(k,'core/media-library',{'code':l['code'],'organizationCode':l['organization']['code']});body={f:copy.deepcopy(l[f]) for f in ['code','nls','hidden','permissions'] if f in l};body['organization']={'id':ref('organization|'+l['organization']['code'])};
 if l.get('parent'):body['parent']={'id':ref('library|'+libs[l['parent']['id']]['code'])}
 add(k,'core/media-library',body,10,'create')
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
raw={x['url']:x for x in scope['pages']};pages=json.loads(zipfile.ZipFile(src/'pages.zip').read('page_context_config.json'));assert len(pages)==2
for pg in pages:
 r=raw[pg['url']];assert not(set(pg.get('values',{}))-set(paths)),'Unexpected orphan override';k='page|SERVICEWAND|'+pg['url'];ident(k,'core-cms/page-context',{'organizationCode':'SERVICEWAND','site':r.get('site'),'url':pg['url']});body=remap({f:copy.deepcopy(pg[f]) for f in ['url','permissions','enabledTemplates','values'] if f in pg});body.update(site=r.get('site'),organization={'id':ref('organization|SERVICEWAND')},template={'id':ref('block|'+paths[r['template']['id']])});add(k,'core-cms/page-context',body,60,'create')

# User approved temporary existing authors; selectors contain no source/target IDs.
users=load(src/'prod-users.json');sourceusers={u['id']:u for u in load(src/'source-users.json')}
for name in ['Nick Sas','Super User']:
 matches=[u for u in users if u.get('fullname')==name];assert len(matches)==1
 u=matches[0];ident('author|'+name,'core/user',{'fullname':name,'loginSha256':hashlib.sha256(u['name'].encode()).hexdigest(),'existingOnly':True})
ident('language|eng','core/language',{'iso3':'eng','existingOnly':True})
missing={'bbc735d9-c197-49fa-841a-c3b8b2ed2709':'missing|article-illustration','266a20af-6b6f-4314-9313-b8a950d0e007':'missing|author-avatar'}
mediarefs.update(missing)
catkeys={}
for c in scope['categories']:
 name=c['nls']['en']['NAME'];k='category|SERVICEWAND|'+name;catkeys[c['id']]=k
 ident(k,'core-cms/blog-post-category',{'organizationCode':'SERVICEWAND','name':name,'slug':c.get('slug')})
 b=remap({f:copy.deepcopy(c[f]) for f in ['nls','slug','permalink','metadata','enabled'] if f in c});b['organization']={'id':ref('organization|SERVICEWAND')}
 assert not c.get('parent') and not c.get('image')
 add(k,'core-cms/blog-post-category',b,30,'create')
postkeys={};restoration=[];held=[];dates={d['id']:d for d in load(src/'post-dates.json')}
for p in sorted(scope['posts'],key=lambda p:dates[p['id']]['created']):
 variant=hashlib.sha256(json.dumps({'metadata':p.get('metadata',{}),'slug':p.get('slug')},sort_keys=True).encode()).hexdigest()[:16]
 k='post|SERVICEWAND|'+p['permalink']
 if sum(q['permalink']==p['permalink'] for q in scope['posts'])>1:k+='|'+variant
 assert k not in postkeys.values();postkeys[p['id']]=k
 ident(k,'core-cms/blog-post',{'organizationCode':'SERVICEWAND','permalink':p['permalink'],'sourceVariant':variant,'duplicatePermalink':sum(q['permalink']==p['permalink'] for q in scope['posts'])>1})
 b=remap({f:copy.deepcopy(p[f]) for f in ['enabled','slug','permalink','metadata'] if f in p})
 # Preserve the existing renderer's date fallback verbatim; do not overwrite audit-created.
 b.setdefault('metadata',{})['PUBLISHED_AT']=str(dates[p['id']]['created'])
 original=sourceusers[p['author']['id']]['fullname'];author='Super User' if original=='Super User' else 'Nick Sas'
 b.update(organization={'id':ref('organization|SERVICEWAND')},author={'id':ref('author|'+author)},categories=[{'id':ref(catkeys[c['id']])} for c in p.get('categories',[])],tags=[],images=[{'id':ref(mediarefs[m['id']]),'mediaType':'image'} for m in p.get('images',[])])
 assert not p.get('tags') and not p.get('parent')
 if p.get('heroImage'):b['heroImage']={'id':ref(mediarefs[p['heroImage']['id']]),'mediaType':'image'}
 add(k,'core-cms/blog-post',b,40,'create')
 restoration.append({'postKey':k,'originalAuthor':original,'temporaryAuthor':author,'temporary':original!='Super User','enabled':p['enabled']})
for c in scope['contents']:
 k='content|'+postkeys[c['blogPost']['id']]+'|eng';ident(k,'core-cms/localized-blog-content',{'blogPostKey':postkeys[c['blogPost']['id']],'languageIso3':'eng'})
 assert c['language']['id']=='eng'
 b=remap({f:copy.deepcopy(c[f]) for f in ['title','summary','content','contentType','metadata'] if f in c});b.update(organization={'id':ref('organization|SERVICEWAND')},language={'id':ref('language|eng')},blogPost={'id':ref(postkeys[c['blogPost']['id']])})
 add(k,'core-cms/localized-blog-content',b,41,'create')
blocked='post|SERVICEWAND|/blog/service-wand-one-operational-system'
for op in list(ops):
 if op['capture']==blocked or op['capture']=='content|'+blocked+'|eng':ops.remove(op);held.append(op)
ops.sort(key=lambda x:x['stage'])
assert len(held)==2 and not held[0]['bodyTemplate']['entities'][0].get('enabled',False)
assert sum(p['enabled'] for p in scope['posts'])==60
assert len(restoration)==78 and sum(x['temporary'] for x in restoration)==65
assert len(postkeys)==78 and len(set(postkeys.values()))==78
assert not any('missing|' in json.dumps(op) for op in ops)
# Candidate is archived separately, never silently substituted.
candidate=scope['imageCandidates'][0];cid=candidate['id'];cs=checks[cid];(out/'candidates').mkdir(exist_ok=True)
shutil.copyfile(src/'media'/cid,out/'candidates'/cs['sha256'])
manifest={'scope':'ServiceWand blog only','status':'prepared-not-deployed','pages':2,'blocks':8,'posts':78,'readyPosts':77,'enabledPosts':60,'heldDisabledPosts':1,'contents':76,'readyContents':75,'categories':4,'media':126,'operations':len(ops),'authorDecision':'65 posts temporarily use existing Nick Sas; 13 keep Super User; no user writes','dates':'PUBLISHED_AT preserves source created fallback string; audit dates are not imported','guard':'Resolve identities against fresh prod. Existing records require full comparison; ambiguous matches must fail. Duplicate permalinks require captured deployment IDs for retries. Use the blog-scoped executor; validate identifier writes, collection reads and image discriminators.','serverWrites':False}
save(out/'requests.json',ops);save(out/'held-requests.json',held);save(out/'identities.json',identities);save(out/'author-restoration.json',restoration);save(out/'manifest.json',manifest)
save(out/'image-repair.json',{'article':blocked,'missing':['article illustration','author avatar'],'candidate':{'path':'candidates/'+cs['sha256'],'name':candidate['name'],'sha256':cs['sha256'],'sameFilename':True,'approvedReplacement':False},'decision':'Keep disabled article out of ready requests; retain both missing references in held requests.'})
save(out/'SHA256SUMS.json',{str(f.relative_to(out)):hashlib.sha256(f.read_bytes()).hexdigest() for f in out.rglob('*') if f.is_file() and f.name!='SHA256SUMS.json'})
print(json.dumps(manifest,indent=2))
