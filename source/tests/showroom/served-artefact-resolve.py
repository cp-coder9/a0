#!/usr/bin/env python3
"""Which BUILD_ID is the server actually serving? Answered from served bytes, not from disk.

A BUILD_ID file on disk says what was BUILT, not what is RUNNING. When two production
trees exist and one dev server rewrites `.next`, those diverge silently - and a capture
labelled from the wrong tree is unreproducible. This resolves the question by taking the
stylesheet filenames the page actually references and looking for them inside each
candidate tree's static directory.

    python tests/showroom/served-artefact-resolve.py http://127.0.0.1:3101 [tree ...]

Verdicts per tree: MATCH (every served sheet/script exists there), PARTIAL, NO_MATCH.
Exit 0 if exactly one tree matches, 2 if none or several match (ambiguous).

You may pass EITHER a build directory (…/.next) OR a project root that contains one; the tool
resolves `<root>/.next` when `<root>/static` is absent. That normalisation exists because a
project root once scored a false NO_MATCH against an artefact that was being served correctly —
a false negative on identity is as damaging as the false positive this tool was built to stop.
Both stylesheets and scripts are checked, because a build whose CSS is unchanged and whose JS is
not would otherwise slip through.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

OUT = Path('docs/showroom-evidence/qa/served-artefact-resolve.json')
DEFAULT_TREES = ['E:/Sitrak-website/.next', 'E:/Sitrak-website-buildcheck/.next']


def served_sheets(base: str) -> list[str]:
    html = urllib.request.urlopen(base.rstrip('/') + '/', timeout=240).read().decode('utf-8', 'ignore')
    return sorted(set(re.findall(r'href="(/_next/static/[^"]+?\.css[^"]*)"', html)))


def served_assets(base: str) -> list[str]:
    """Every /_next/static asset the page references: stylesheets AND scripts.

    CSS alone was enough to catch a swapped build, but a build whose CSS is unchanged and whose
    JS is not would slip through. Leo's case had 7 CSS + 7 JS; checking all 14 makes the identity
    claim stronger than either half.
    """
    html = urllib.request.urlopen(base.rstrip('/') + '/', timeout=240).read().decode('utf-8', 'ignore')
    refs = re.findall(r'(?:href|src)="(/_next/static/[^"]+?\.(?:css|js))(?:\?[^"]*)?"', html)
    return sorted(set(refs))


def probe_build_manifest(base: str, build_id: str) -> dict:
    """Primary identity signal: the per-build manifest is unique per build and server-verifiable.

    CSS filenames are content-hashed and STABLE ACROSS BUILDS when the stylesheet content does not
    change, so a stylesheet comparison can report a match against a tree that is not serving.
    /_next/static/<BUILD_ID>/_buildManifest.js returns 200 only for the build actually mounted.
    """
    url = f"{base.rstrip('/')}/_next/static/{build_id}/_buildManifest.js"
    try:
        with urllib.request.urlopen(url, timeout=240) as response:
            body = response.read()
        return {'build_id': build_id, 'url': url, 'status': response.status,
                'bytes': len(body), 'served': response.status == 200}
    except urllib.error.HTTPError as error:
        return {'build_id': build_id, 'url': url, 'status': error.code, 'bytes': 0, 'served': False}
    except Exception as error:  # noqa: BLE001
        return {'build_id': build_id, 'url': url, 'status': None,
                'error': f'{type(error).__name__}: {error}', 'served': False}


def score_tree(root: Path, sheets: list[str]) -> dict:
    # Accept EITHER a build directory (…/.next) OR a project root that contains one.
    # Pointing the tool at a project root previously scored '<root>/static/css/...', which cannot
    # exist, and produced a false NO_MATCH on an artefact that was being served correctly.
    given = root
    if not (root / 'static').is_dir() and (root / '.next' / 'static').is_dir():
        root = root / '.next'
    present, missing = [], []
    for href in sheets:
        rel = href.replace('/_next/', '').split('?')[0]
        (present if (root / rel).is_file() else missing).append(Path(href).name)
    build_id = None
    bid = root / 'BUILD_ID'
    if bid.is_file():
        build_id = bid.read_text(encoding='utf-8').strip() or None
    verdict = ('MATCH' if sheets and not missing else
               'PARTIAL' if present else 'NO_MATCH')
    return {'tree': str(given), 'resolved_build_dir': str(root), 'build_id': build_id,
            'verdict': verdict, 'sheets_present': len(present),
            'sheets_missing': len(missing), 'missing': missing[:4]}


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 64
    base = argv[1]
    trees = [Path(t) for t in argv[2:]] or [Path(t) for t in DEFAULT_TREES]
    sheets = served_sheets(base)
    assets = served_assets(base)
    rows = [score_tree(t, assets or sheets) for t in trees]

    # PRIMARY: ask the server which build ID it will serve a manifest for. Every candidate tree
    # contributes its BUILD_ID, plus any IDs named on the command line via --id.
    candidate_ids = []
    for row in rows:
        if row.get('build_id'):
            candidate_ids.append(row['build_id'])
    for i, value in enumerate(argv):
        if value == '--id' and i + 1 < len(argv):
            candidate_ids.append(argv[i + 1])
    manifests = [probe_build_manifest(base, bid) for bid in dict.fromkeys(candidate_ids)]
    served_by_manifest = [m['build_id'] for m in manifests if m['served']]
    matches = [r for r in rows if r['verdict'] == 'MATCH']
    report = {
        'base_url': base,
        'identity_primary': {
            'signal': '/_next/static/<BUILD_ID>/_buildManifest.js',
            'probes': manifests,
            'served_build_ids': served_by_manifest,
            'verdict': ('IDENTIFIED' if len(served_by_manifest) == 1 else
                        'NO_CANDIDATE_ANSWERED' if not served_by_manifest else 'AMBIGUOUS'),
        },
        'identity_corroboration': {
            'signal': 'served css/js filenames against each tree',
            'trees': rows,
            'matched_trees': [r['build_id'] for r in matches],
            'note': 'content-hashed filenames repeat across builds when the stylesheet is unchanged, '
                    'so this corroborates and never decides on its own',
        },
        'served_sheets': sheets,
        'served_sheet_count': len(sheets),
        'trees': rows,
        'served_build_id': served_by_manifest[0] if len(served_by_manifest) == 1 else None,
        'verdict': ('IDENTIFIED' if len(served_by_manifest) == 1 else
                    'UNATTRIBUTED' if not served_by_manifest else 'AMBIGUOUS'),
        'rule': 'A BUILD_ID file records what was built. The served CSS filenames record what is RUNNING. '
                'Label captures from the second, never the first.',
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    print(f'\nwrote {OUT}')
    return 0 if len(matches) == 1 else 2


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
