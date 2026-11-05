"""Read-only candidate identity; writes evidence only to the authorized QA tree."""
from pathlib import Path
import hashlib, json, datetime, sys
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/showroom-evidence/qa'
OUT.mkdir(parents=True, exist_ok=True)
files = []
for directory in ('app', 'components', 'lib', 'public'):
    files.extend(p for p in (ROOT / directory).rglob('*') if p.is_file())
for name in ('package.json','package-lock.json','next.config.ts','next.config.mjs','tsconfig.json','vitest.config.ts','AGENTS.md'):
    p = ROOT / name
    if p.is_file(): files.append(p)
manifest = {str(p.relative_to(ROOT)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}
payload = json.dumps(manifest, sort_keys=True, separators=(',',':')).encode()
result = {'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'root': str(ROOT), 'git': 'No repository detected at intake', 'candidate_sha256': hashlib.sha256(payload).hexdigest(), 'algorithm': 'SHA256 of UTF-8 compact sorted JSON path-to-SHA256 map', 'files': manifest}
label = sys.argv[1] if len(sys.argv)>1 else 'before'
path = OUT / f'source-{label}.json'
path.write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps({'path':str(path),'candidate_sha256':result['candidate_sha256'],'files':len(manifest),'utc':result['utc']}))
