"""Check the enumerated GLB acceptance matrix against the registry source and the files on disk.

Read-only. Does NOT prove rendering, orbit, zoom, latency or identity — it only establishes
whether each expected asset exists, is registered, is approved and is served, i.e. whether a
browser pass could possibly succeed for that row.
"""
from pathlib import Path
import json, hashlib, re, sys, datetime

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/showroom-evidence/qa'
MATRIX = OUT / 'glb-acceptance-matrix.json'
REGISTRY = ROOT / 'components/showroom/supplied-models.ts'


def parse_registry():
    text = REGISTRY.read_text(encoding='utf-8')
    entries = []
    for block in re.findall(r'\{literalFilename:(.*?)\}', text, re.S):
        def field(name, pattern=r"'([^']*)'"):
            m = re.search(name + r':(' + pattern + r')', block, re.S)
            return m.group(1) if m else None
        sha = re.search(r"sha256:'([0-9a-f]{64})'", block)
        approved = re.search(r'renderApproved:(true|false)', block)
        url = re.search(r"browserUrl:(null|'[^']*')", block)
        entries.append({
            'literalFilename': field('literalFilename'),
            'catalogModelId': field('catalogModelId', r'null|' + r"'[^']*'"),
            'role': field('role'),
            'identityStatus': field('identityStatus'),
            'sha256': sha.group(1) if sha else None,
            'renderApproved': approved.group(1) == 'true' if approved else None,
            'browserUrl': None if not url or url.group(1) == 'null' else url.group(1).strip("'"),
        })
    return entries


def disk_glbs():
    found = {}
    for path in ROOT.rglob('*.glb'):
        parts = set(path.parts)
        if 'node_modules' in parts or '.next' in parts:
            continue
        found[str(path.relative_to(ROOT)).replace('\\', '/')] = hashlib.sha256(path.read_bytes()).hexdigest()
    return found


def main():
    label = sys.argv[1] if len(sys.argv) > 1 else 'check'
    matrix = json.loads(MATRIX.read_text(encoding='utf-8'))
    registry = parse_registry()
    disk = disk_glbs()
    by_sha = {e['sha256']: e for e in registry if e['sha256']}

    rows = []
    for row in matrix['expectations_per_route_tab']:
        entry = by_sha.get(row['expected_sha256'])
        on_disk = [p for p, h in disk.items() if h == row['expected_sha256']]
        registered = entry is not None
        approved = bool(entry and entry['renderApproved'])
        served = bool(entry and entry['browserUrl'])
        status = ('GAP-unregistered' if not registered else
                  'GAP-not-approved' if not approved else
                  'GAP-no-served-url' if not served else
                  'READY')
        rows.append({
            'id': row['id'], 'route': row['route'], 'model': row['model_name'], 'tab': row['tab_label'],
            'expected_file': row['expected_file'], 'expected_sha256': row['expected_sha256'],
            'registered': registered,
            'registry_catalog_model': entry['catalogModelId'] if entry else None,
            'render_approved': approved,
            'browser_url': entry['browserUrl'] if entry else None,
            'file_present_in_repo': bool(on_disk),
            'file_paths': on_disk,
            'status': status,
        })

    unregistered = [{'path': p, 'sha256': h} for p, h in disk.items()
                    if h not in by_sha]
    summary = {
        'rows': len(rows),
        'ready': sum(1 for r in rows if r['status'] == 'READY'),
        'gaps': sum(1 for r in rows if r['status'] != 'READY'),
        'by_status': {},
        'unregistered_binaries_in_repo': len(unregistered),
    }
    for r in rows:
        summary['by_status'][r['status']] = summary['by_status'].get(r['status'], 0) + 1

    result = {
        'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'scope': 'registry/disk reachability check for the GLB acceptance matrix; NOT a render, identity or latency test',
        'registry_entries': registry,
        'rows': rows,
        'unregistered_binaries_in_repo': unregistered,
        'summary': summary,
        'verdict': 'A browser pass cannot pass any row yet' if summary['ready'] == 0 else 'some rows are reachable; still requires the frozen-candidate browser pass',
    }
    path = OUT / f'glb-matrix-check-{label}.json'
    path.write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps({'path': str(path), 'summary': summary, 'verdict': result['verdict']}, indent=1))


if __name__ == '__main__':
    main()
