import json,pathlib,unittest,sys,hashlib,re
from prepare_root import resolve
PACKAGE=pathlib.Path(sys.argv.pop(1)) if len(sys.argv)>1 and not sys.argv[1].startswith('-') else pathlib.Path('tmp/cms-root-stage-1')
class PackageChecks(unittest.TestCase):
 def setUp(self):
  self.ops=json.loads((PACKAGE/'requests.json').read_text());self.ids=json.loads((PACKAGE/'identities.json').read_text())
 def test_unresolved_reference_fails(self):
  with self.assertRaises(ValueError):resolve({'x':{'$ref':'form|missing'}},{})
  with self.assertRaises(ValueError):resolve({'{{REF:block|missing}}':'text'},{})
 def test_binding_types_and_embedded_links(self):
  self.assertEqual(resolve({'id':{'$ref':'org'},'{{REF:block}}':'/core/image/{{REF:media}}/get'},{'org':909,'block':'new-block','media':'new-media'}),{'id':909,'new-block':'/core/image/new-media/get'})
 def test_every_reference_has_identity(self):
  raw=json.dumps(self.ops);refs=set(re.findall(r'"\$ref": "([^"]+)"',raw))|set(re.findall(r'\{\{REF:(.*?)\}\}',raw))
  self.assertFalse(refs-set(self.ids)-{k for k in refs if k.startswith('optimistic|') and k[len('optimistic|'):] in self.ids})
  bindings={k:('target-'+str(i) if k.startswith(('block|','media|')) else 10000+i) for i,k in enumerate(self.ids)};bindings.update({'optimistic|'+k:1 for k in self.ids})
  concrete=resolve(self.ops,bindings);self.assertNotIn('{{REF:',json.dumps(concrete));self.assertNotIn('"$ref"',json.dumps(concrete))
 def test_order_is_dependency_safe(self):
  seen=set(json.loads((PACKAGE/'bindings-observed.json').read_text()))
  for op in self.ops:
   raw=json.dumps(op.get('bodyTemplate',op.get('multipartTemplate')));deps=set(re.findall(r'"\$ref": "([^"]+)"',raw))|set(re.findall(r'\{\{REF:(.*?)\}\}',raw))
   self.assertFalse(deps-seen,op['key']+' unresolved '+str(deps-seen))
   seen.add(op['capture']);seen.add('optimistic|'+op['capture'])
   if op['key']=='workflow|FORM#states':seen.update(k for k in self.ids if k.startswith('state|FORM|'));seen.add('optimistic|workflow|FORM')
 def test_only_expected_writes_and_scope(self):
  self.assertEqual(sum('/page-context/' in o['path'] for o in self.ops),10);self.assertEqual(sum('/block-template/' in o['path'] for o in self.ops),70);self.assertEqual(sum('/form-type/' in o['path'] for o in self.ops),10)
  self.assertFalse(any('submit.json' in o['path'] or 'send-event' in o['path'] for o in self.ops))
  for o in self.ops:
   if '/form-type/' in o['path'] or '/page-context/' in o['path']:self.assertEqual(o['bodyTemplate']['entities'][0]['permissions'],[])
 def test_quarantine_and_payload(self):
  q=json.loads((PACKAGE/'quarantined-overrides.json').read_text());self.assertEqual(len(q),3);raw=json.dumps(self.ops)
  for x in q:self.assertNotIn(x['sourceGroup'],raw)
  self.assertEqual({tuple(x['values']) for x in q},{('TABLE_COL_CRM',),('DOCUMENT_CODE',),('FEAT_CARD_3_TITLE',)})
 def test_all_files_match_hashes(self):
  for name,digest in json.loads((PACKAGE/'SHA256SUMS.json').read_text()).items():self.assertEqual(hashlib.sha256((PACKAGE/name).read_bytes()).hexdigest(),digest,name)
  uploads=[o for o in self.ops if 'multipartTemplate' in o];self.assertEqual(len(uploads),53)
  for op in uploads:
   f=op['multipartTemplate']['files'][0];self.assertEqual(hashlib.sha256((PACKAGE/f['path']).read_bytes()).hexdigest(),f['sha256'])
if __name__=='__main__':unittest.main()
