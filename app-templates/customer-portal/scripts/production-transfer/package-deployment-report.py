"""Attach sanitized actual deployment evidence; keep original preflight audit as history."""
import argparse, hashlib, json, pathlib, shutil, zipfile

p = argparse.ArgumentParser()
p.add_argument('--package', required=True)
args = p.parse_args()
package = pathlib.Path(args.package)
docs = pathlib.Path('app-templates/customer-portal/content/production-transfer')
report = json.loads((docs/'production-deployment-2026-11-17.json').read_text())
for name in ['production-deployment-2026-11-17.json', 'production-deployment-registry-2026-11-17.json', 'sensor-definitions-2026-11-17.json']:
    shutil.copyfile(docs/name, package/name)
if (docs/'report-templates/manifest.json').exists():
    shutil.copytree(docs/'report-templates', package/'deferred-report-templates', dirs_exist_ok=True)
text = '# Production deployment — 17 November 2026\n\n'
text += 'Configuration was written to prod.servicewand.com in stages. This report supersedes the preflight status in the historical candidate documents. Do not replay saved requests: resolve current target references and optimistic versions first.\n\n'
text += f"Verified save phases: {report['verifiedSaveOperations']}. Registry entries: {report['totalEntries']}.\n\n"
text += '\n'.join(f'- {key}: {value}' for key, value in report['entryCounts'].items()) + '\n\n'
text += '## Remaining blockers\n\n' + '\n'.join(f"- {b['title']}: {b['detail']}" for b in report['blockers']) + '\n\n'
text += '## Separate follow-ups\n\n' + '\n'.join('- '+x for x in report['deferred']) + '\n\n'
text += 'Payments and both schedules remain disabled. No business Accounts, Users, purchases or grants were created by the transfer. Read-back checks establish saved configuration, not production runtime/E2E readiness.\n'
(package/'DEPLOYMENT.md').write_text(text)
(docs/'production-deployment-2026-11-17.md').write_text(text)
readme = package/'README.md'
old = readme.read_text()
marker = '\n<!-- historical-preflight -->\n'
old = old.split(marker, 1)[-1]
readme.write_text('# Actual production status\n\nSee [DEPLOYMENT.md](DEPLOYMENT.md) and production-deployment-2026-11-17.json for completed writes and remaining blockers. The text below is the historical preflight review.\n'+marker+old)
(package/'BLOCKERS.md').write_text(text)
for file in [docs/'migration-readiness-2026-11-17.json', docs/'final-package-audit-2026-11-17.json']:
    value = json.loads(file.read_text())
    value.update(serversChanged=True, deployment=report, readinessStatus=report['status'], blockers=report['blockers'], ready=False)
    file.write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n')
checks = {str(f.relative_to(package)): hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(package.rglob('*')) if f.is_file() and f.name != 'SHA256SUMS.json'}
(package/'SHA256SUMS.json').write_text(json.dumps(checks, indent=2)+'\n')
archive = package.parent/'servicewand-prod-transfer-deployed-2026-11-17.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(package.rglob('*')):
        if f.is_file(): z.write(f, f.relative_to(package))
with zipfile.ZipFile(archive) as z:
    for name, digest in checks.items(): assert hashlib.sha256(z.read(name)).hexdigest() == digest
print('Deployment evidence packaged; checksums verified:', archive)
