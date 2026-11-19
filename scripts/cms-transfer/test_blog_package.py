"""Offline integrity checks for the prepared blog package (no network)."""
import hashlib,json,pathlib,re,unittest
P=pathlib.Path('tmp/cms-blog-stage-2b')
def load(n):return json.loads((P/n).read_text())
class BlogPackage(unittest.TestCase):
 def test_hashes(self):
  for f,h in load('SHA256SUMS.json').items():self.assertEqual(hashlib.sha256((P/f).read_bytes()).hexdigest(),h,f)
 def test_ready_scope_and_authors(self):
  ops=load('requests.json');posts=[o['bodyTemplate']['entities'][0] for o in ops if o['path']=='/core-cms/api/blog-post/save.json']
  self.assertEqual(len(posts),77);self.assertEqual(sum(p['enabled'] for p in posts),60)
  dup=[p for p in posts if p['permalink']=='snow-removal/blog-1'];self.assertEqual(len(dup),3);self.assertFalse(any(p['enabled'] for p in dup))
  authors=load('author-restoration.json');self.assertEqual(sum(a['temporary'] for a in authors),65);self.assertEqual(len(authors),78)
  self.assertFalse(any(o['path'].endswith('/user/save.json') for o in ops))
 def test_references_and_order(self):
  ops=load('requests.json');ids=load('identities.json');created=set();captures={o['capture'] for o in ops}
  def refs(v):
   if isinstance(v,dict):
    if set(v)=={'$ref'}:yield v['$ref']
    else:
     for k,x in v.items():yield from refs(k);yield from refs(x)
   elif isinstance(v,list):
    for x in v:yield from refs(x)
   elif isinstance(v,str):yield from re.findall(r'\{\{REF:(.*?)\}\}',v)
  for o in ops:
   for r in refs(o):
    k=r.removeprefix('optimistic|');self.assertIn(k,ids)
    if k in captures:self.assertIn(k,created,o['key']+' needs '+k)
   created.add(o['capture'])
  self.assertEqual([o['stage'] for o in ops],sorted(o['stage'] for o in ops))
 def test_polymorphic_image_links(self):
  for op in load('requests.json'):
   if op['path']=='/core-cms/api/blog-post/save.json':
    p=op['bodyTemplate']['entities'][0]
    for m in op['bodyTemplate']['mappings']:
     if m['name'] in ['categories','tags','images']:self.assertEqual(m['type'],'identifier')
    for image in p.get('images',[])+([p['heroImage']] if p.get('heroImage') else []):self.assertEqual(image['mediaType'],'image')
 def test_hold(self):
  held=load('held-requests.json');self.assertEqual(len(held),2)
  self.assertFalse(held[0]['bodyTemplate']['entities'][0]['enabled'])
  self.assertNotIn('missing|',json.dumps(load('requests.json')))
  self.assertIn('missing|',json.dumps(held));self.assertFalse(load('image-repair.json')['candidate']['approvedReplacement'])
if __name__=='__main__':unittest.main()
