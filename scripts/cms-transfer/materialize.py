"""Resolve one staged request offline; never sends it to a server."""
import argparse,json,pathlib
from prepare_root import resolve
p=argparse.ArgumentParser();p.add_argument('--package',required=True);p.add_argument('--bindings',required=True);p.add_argument('--key',required=True);p.add_argument('--out',required=True);a=p.parse_args()
ops=json.loads((pathlib.Path(a.package)/'requests.json').read_text());matches=[o for o in ops if o['key']==a.key]
if len(matches)!=1:raise SystemExit('Request key missing or ambiguous')
r=resolve(matches[0],json.loads(pathlib.Path(a.bindings).read_text()));pathlib.Path(a.out).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
print('Resolved offline. Refresh identity and optimistic version before any write.')
