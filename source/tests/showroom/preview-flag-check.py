#!/usr/bin/env python3
"""Decide, from BUILD OUTPUT BYTES, whether a build could carry a 3D model URL.

Why this exists
---------------
`supplied-models.ts` gates the model URL behind a build-time constant:

    const PREVIEW_REQUESTED = process.env.NEXT_PUBLIC_SITRAK_PREVIEW_3D === '1'
    browserUrl: PREVIEW_REQUESTED ? '/models/c7h.glb' : null

so a flag-off build should FOLD THE LITERAL AWAY. That makes the decisive switch-off
test a byte question about the built chunks, not a matter of opinion, and it does not
need a browser at all:

    python tests/showroom/preview-flag-check.py <build-dir>            # e.g. E:/Sitrak-website/.next
    python tests/showroom/preview-flag-check.py <dir> <dir> ...        # several builds

Verdicts
--------
    URL_ABSENT   the literal /models/c7h.glb appears in no served text chunk
                 => the build is switch-off / photo-only BY CONSTRUCTION
    URL_PRESENT  the literal is present => the build could fetch it, so a browser test
                 must show whether it mounts (presence is necessary, not sufficient)
    NO_BUILD     no static chunk directory found

Note: presence proves the string survived the build, NOT that 3D renders. Mounting also
requires approvalRecord and isRenderable() to pass at runtime.

Also reports whether the source carries the switch at all, because any grep for
`renderApproved` now under-reports: the load-bearing keys are `approvalRecord` and
`NEXT_PUBLIC_SITRAK_PREVIEW_3D`.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

TEXT_SUFFIXES = {'.js', '.mjs', '.cjs', '.html', '.rsc', '.json'}
LITERALS = ['/models/c7h.glb', '/models/engine-reference.glb']
SOURCE = Path('components/showroom/supplied-models.ts')


def scan_chunks(build_dir: Path) -> dict:
    static = build_dir / 'static'
    if not static.is_dir():
        return {'verdict': 'NO_BUILD', 'build_dir': str(build_dir),
                'detail': f'no static directory at {static}'}

    hits = {lit: [] for lit in LITERALS}
    files = 0
    total = 0
    for path in static.rglob('*'):
        if not path.is_file() or path.suffix not in TEXT_SUFFIXES:
            continue
        files += 1
        try:
            data = path.read_bytes()
        except OSError:
            continue
        total += len(data)
        for lit in LITERALS:
            if lit.encode() in data:
                hits[lit].append({
                    'file': str(path.relative_to(build_dir)),
                    'bytes': len(data),
                    'sha256': hashlib.sha256(data).hexdigest()[:16],
                })

    present = {lit: h for lit, h in hits.items() if h}
    return {
        'build_dir': str(build_dir),
        'chunks_scanned': files,
        'chunk_bytes': total,
        'url_literals': present,
        'verdict': 'URL_PRESENT' if present else 'URL_ABSENT',
        'reading': ('a model URL survived into the build, so it could be fetched; '
                    'a browser test is still required to show it mounts'
                    if present else
                    'no model URL in any chunk: switch-off / photo-only by construction'),
    }


def scan_source() -> dict:
    if not SOURCE.is_file():
        return {'present': False, 'path': str(SOURCE)}
    data = SOURCE.read_bytes()
    text = data.decode('utf-8', 'replace')
    return {
        'present': True,
        'path': str(SOURCE),
        'bytes': len(data),
        'sha256': hashlib.sha256(data).hexdigest(),
        'has_preview_flag': 'NEXT_PUBLIC_SITRAK_PREVIEW_3D' in text,
        'has_approval_record': 'approvalRecord' in text,
        'approval_records': text.count("approvalRecord:'"),
        'legacy_render_approved_mentions': text.count('renderApproved'),
        'renderable_requires_node_env_not_production': "NODE_ENV!=='production'" in text,
    }


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 64
    dirs = [Path(a) for a in argv[1:]]
    report = {'built_with': __file__,
              'source': scan_source(),
              'builds': [scan_chunks(d) for d in dirs]}
    report['verdict'] = ('URL_PRESENT_IN_SOME_BUILD'
                         if any(b.get('verdict') == 'URL_PRESENT' for b in report['builds'])
                         else 'ALL_BUILDS_URL_ABSENT')
    out = Path('docs/showroom-evidence/qa/preview-flag-check.json')
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    print(f'\nwrote {out}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
