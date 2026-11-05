"""Fail-closed styled-load preflight (D-16).

An unstyled page still returns HTTP 200 and still has a DOM, so a 200 is not
evidence that the stylesheet applied. Run this BEFORE any visual/scale
measurement and refuse to proceed when it fails.

Checks, in order:
  1. GET <base>/ is 200 and returns HTML with a known app marker.
  2. Classify the artefact: dev mode ships CSS through JS at hydration, so absent
     stylesheet links there are expected and get their own verdict (exit 5) rather
     than a misleading "UNSTYLED".
  3. Production only: every referenced stylesheet is 200 with a non-trivial decoded
     body (>= 64 bytes) - this is what catches the 300-byte shell case.
  4. Production only: the stylesheets together carry enough CSS to be the real app,
     at least one is substantial, and a --ta-* custom property is present.

Usage:
    python tests/showroom/styled-preflight.py [base_url] [label] [--samples N] [--interval S]

Exit codes: 0 = styled and stable, 2 = not styled (production), 3 = unreachable,
4 = samples disagree, 5 = dev artefact / not a candidate.
Writes docs/showroom-evidence/qa/styled-preflight-<label>.json.
"""
from pathlib import Path
import datetime
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/showroom-evidence/qa'
MIN_SHEET_BYTES = 64          # a real sheet is never a 300-byte error shell
MIN_TOTAL_CSS_BYTES = 20000   # the app's stylesheets together are tens of KB
MIN_SUBSTANTIAL_SHEET = 1000  # at least one sheet must carry real layout rules
MARKERS = (b'id="the-range"', b'the-range', b'id="top"')
DEFAULT_SAMPLES = 2      # a single probe has called a flapping runtime healthy
DEFAULT_INTERVAL = 12    # seconds between samples
# A liveness timeout must exceed the worst COLD-COMPILE / cold-start time observed on this host.
# Measured values keep climbing as the host degrades: 78 s, then 85 s, then 179.9 s. Five false
# failures were produced tonight by impatient probes (a 6 s budget called a live server down, a
# 6.4 s polling window missed a splash, a 420 s console check timed out under load). Default is
# therefore 240 s and `--warmup` issues one throwaway request first. A slow measurement is not a
# failed one.
LIVENESS_TIMEOUT = int(__import__('os').environ.get('SITRAK_GATE_TIMEOUT', '240'))
EXIT_STYLED, EXIT_UNSTYLED, EXIT_UNREACHABLE, EXIT_UNSTABLE, EXIT_DEV, EXIT_TIMEOUT, EXIT_IDENTITY = 0, 2, 3, 4, 5, 6, 7


def is_refusal(error):
    """True only for a genuine 'nothing is listening' failure.

    A timeout is NOT evidence of a dead server: dev compiles per route and can take ~78 s cold.
    """
    text = f'{type(error).__name__}: {error}'.lower()
    return ('winerror 10061' in text or 'connection refused' in text
            or 'econnrefused' in text or 'actively refused' in text)


def is_timeout(error):
    text = f'{type(error).__name__}: {error}'.lower()
    return ('timed out' in text or 'timeout' in text or isinstance(error, TimeoutError))


def pid_alive(pid):
    """Is the process still present? A bound port with a live PID proves nothing on its own:
    Leo/Brett measured a listener that accepted connections and returned ZERO bytes across
    165 s. So record the PID, but never let its existence imply the server is healthy."""
    if not pid:
        return None
    try:
        import subprocess
        out = subprocess.run(['tasklist', '/FI', f'PID eq {pid}', '/NH'],
                             capture_output=True, timeout=20).stdout
        # tasklist emits UTF-16LE on some Windows builds and cp1252 on others. Try every
        # decoding and accept a hit in any of them: a decode-order guess once made a live
        # process look dead, which is exactly the class of false negative this gate exists to stop.
        for enc in ('cp1252', 'utf-8', 'utf-16-le'):
            try:
                if str(pid) in out.decode(enc):
                    return True
            except UnicodeDecodeError:
                continue
        return False
    except Exception:  # noqa: BLE001
        return None


def detect_mode(base, body, build_id_file=None):
    """Classify the artefact BEFORE judging styling.

    `next dev` injects CSS through JavaScript at hydration, so the initial HTML legitimately
    contains no <link rel=stylesheet>. Calling that UNSTYLED is true but misleading: it would
    send someone chasing a styling bug on a page that is styled once hydrated. Dev mode is a
    candidate-admissibility problem, not a styling problem, so it gets its own verdict.

    Signal order (Leo's rule): BUILD_ID presence is the candidate identity and its absence is
    the dev-mode fingerprint. Page size and CSS path shape are recorded as OBSERVATIONS only -
    both have changed shape on this host and neither is a rule.
    """
    hmr = None
    try:
        status, _ctype, _body = fetch(base + '/_next/webpack-hmr', timeout=8)
        hmr = status
    except urllib.error.HTTPError as error:
        hmr = error.code
    except Exception:  # noqa: BLE001 - transport noise is not a mode signal
        hmr = None

    has_sheets = bool(re.search(rb'href="[^"]*?\.css[^"]*"', body))
    build_id = None
    build_id_path = Path(build_id_file) if build_id_file else (ROOT / '.next' / 'BUILD_ID')
    try:
        if build_id_path.is_file():
            build_id = build_id_path.read_text(encoding='utf-8').strip() or None
    except Exception:  # noqa: BLE001
        build_id = None

    evidence = {'build_id': build_id, 'hmr_status': hmr,
                'stylesheet_links': has_sheets, 'page_bytes': len(body)}
    if not build_id:
        return 'dev', evidence
    return 'production', evidence


def fetch(url, timeout=60):
    req = urllib.request.Request(url, headers={'User-Agent': 'tess-qa-preflight'})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.status, response.headers.get('content-type'), response.read()


def check_once(base, expect_build=None, build_id_file=None):
    report = {
        'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'base_url': base,
        'checks': [],
        'verdict': 'UNKNOWN',
    }

    started = time.time()
    try:
        status, ctype, body = fetch(base + '/', timeout=LIVENESS_TIMEOUT)
    except urllib.error.HTTPError as error:
        body = error.read() if hasattr(error, 'read') else b''
        report['checks'].append({'check': 'GET /', 'ok': False, 'status': error.code,
                                 'http_error': str(error), 'bytes': len(body),
                                 'elapsed_s': round(time.time() - started, 1),
                                 'app_marker_present': any(m in body for m in MARKERS)})
        report['verdict'] = 'UNSTYLED'
        return report, 2
    except Exception as error:  # noqa: BLE001
        elapsed = round(time.time() - started, 1)
        refusal, timed_out = is_refusal(error), is_timeout(error)
        report['checks'].append({'check': 'GET /', 'ok': False, 'elapsed_s': elapsed,
                                 'timeout_used_s': LIVENESS_TIMEOUT,
                                 'error': f'{type(error).__name__}: {error}',
                                 'classification': ('REFUSED - nothing listening'
                                                    if refusal else
                                                    'TIMEOUT - server may be cold-compiling, NOT proven down'
                                                    if timed_out else 'TRANSPORT ERROR')})
        # Only a refusal proves the server is down. A timeout does not: dev compiles per route
        # and can exceed any short probe. Reporting a compiling server as down is the error class
        # this gate was built to stop.
        report['verdict'] = 'RUNTIME_UNREACHABLE' if refusal else 'TIMEOUT_UNPROVEN'
        return report, (3 if refusal else (6 if timed_out else 3))

    title = re.search(rb'<title[^>]*>(.*?)</title>', body, re.S)
    report['checks'].append({
        'check': 'GET /',
        'ok': status == 200 and any(m in body for m in MARKERS),
        'status': status,
        'content_type': ctype,
        'bytes': len(body),
        'elapsed_s': round(time.time() - started, 1),
        'title': title.group(1).decode('utf-8', 'replace') if title else None,
        'app_marker_present': any(m in body for m in MARKERS),
    })

    mode, mode_evidence = detect_mode(base, body, build_id_file=build_id_file)
    report['artefact_mode'] = mode
    report['mode_evidence'] = mode_evidence
    if expect_build is not None:
        served_build = mode_evidence.get('build_id')
        report['expected_build'] = expect_build
        if served_build != expect_build:
            report['verdict'] = 'IDENTITY_MISMATCH'
            report['identity_detail'] = {
                'expected': expect_build,
                'found': served_build,
                'note': ('The artefact you were told to capture cannot be identified in this tree. '
                         'Do not capture: an unattributable build produces unreproducible evidence.'),
            }
            return report, EXIT_IDENTITY
    if mode == 'dev':
        # Not a candidate artefact: dev ships CSS through JS at hydration, so judging styling
        # from the initial HTML would produce a true-but-misleading verdict.
        report['verdict'] = 'DEV_ARTEFACT'
        report['guidance'] = ('Not a candidate artefact: dev mode delivers CSS at hydration, so the '
                              'initial HTML legitimately has no stylesheet links. Capture nothing here; '
                              'require a next start build with a BUILD_ID.')
        return report, EXIT_DEV

    # Match any stylesheet the page references, whatever directory the bundler emits it
    # to: a path-specific pattern produced a false UNSTYLED verdict on a dev server that
    # serves /_next/static/chunks/*.css rather than /_next/static/css/*.css.
    sheets = list(dict.fromkeys(
        href.decode() for href in re.findall(rb'href="([^"]*?\.css[^"]*)"', body)
    ))
    report['stylesheets_referenced'] = sheets
    parsed_sheets = 0
    total_css = 0
    substantial = 0
    inline_css = b''.join(re.findall(rb'<style[^>]*>(.*?)</style>', body, re.S))
    if inline_css:
        total_css += len(inline_css)
        report['inline_style_bytes'] = len(inline_css)
        if inline_css.count(b'{') > 0:
            parsed_sheets += 1
        if len(inline_css) >= MIN_SUBSTANTIAL_SHEET:
            substantial += 1
        report['checks'].append({'check': 'inline_styles', 'ok': True,
                                 'decoded_bytes': len(inline_css),
                                 'has_custom_property': b'--ta-' in inline_css})
    for href in sheets:
        url = href if href.startswith('http') else base + ('' if href.startswith('/') else '/') + href
        try:
            status, ctype, css = fetch(url)
            total_css += len(css)
            ok = status == 200 and len(css) >= MIN_SHEET_BYTES
            if ok and css.count(b'{') > 0:
                parsed_sheets += 1
            if ok and len(css) >= MIN_SUBSTANTIAL_SHEET:
                substantial += 1
            report['checks'].append({
                'check': 'stylesheet',
                'href': href,
                'ok': ok,
                'status': status,
                'content_type': ctype,
                'decoded_bytes': len(css),
                'min_bytes': MIN_SHEET_BYTES,
                'rule_blocks': css.count(b'{'),
                'has_custom_property': b'--ta-' in css,
            })
        except Exception as error:  # noqa: BLE001
            report['checks'].append({'check': 'stylesheet', 'href': href, 'ok': False,
                                     'error': f'{type(error).__name__}: {error}'})

    report['total_css_bytes'] = total_css
    # Record WHICH bundler shape served the CSS. The two shapes are themselves the
    # dev/production tell (Flo): Turbopack dev emits _next/static/chunks/*.css, production
    # emits _next/static/css/<hash>.css. A reader must be able to place a capture on one
    # side of that line without re-deriving it from the numbers.
    chunk_shape = any('/_next/static/chunks/' in href for href in sheets)
    hashed_shape = any(re.search(r'/_next/static/css/[0-9a-f]{8,}\.css', href) for href in sheets)
    report['css_shape'] = {
        'turbopack_dev_chunks': chunk_shape,
        'production_hashed_hashed_dir': hashed_shape,
        'shape': ('dev-turbopack' if chunk_shape else
                  'production-hashed' if hashed_shape else
                  'inline-or-unknown'),
        'stylesheet_count': len(sheets),
        'total_css_bytes': total_css,
        'page_bytes': len(body),
    }
    report['checks'].append({'check': 'stylesheet_parse', 'ok': parsed_sheets > 0,
                             'parsed_sheets': parsed_sheets})
    report['checks'].append({'check': 'total_css_volume', 'ok': total_css >= MIN_TOTAL_CSS_BYTES,
                             'total_css_bytes': total_css, 'min_total_bytes': MIN_TOTAL_CSS_BYTES})
    report['checks'].append({'check': 'substantial_sheet', 'ok': substantial > 0,
                             'sheets_over_1000_bytes': substantial})

    homepage_css = [c for c in report['checks']
                    if c.get('check') == 'stylesheet' and c.get('has_custom_property')]
    report['checks'].append({'check': 'custom_properties', 'ok': bool(homepage_css),
                             'sheets_with_ta_tokens': len(homepage_css)})

    failed = [c for c in report['checks'] if not c.get('ok')]
    report['failed_checks'] = [c['check'] + (':' + c.get('href', '') if c.get('href') else '') for c in failed]
    report['verdict'] = 'STYLED' if not failed else 'UNSTYLED'
    report['guidance'] = (
        'Proceed with the visual/scale measurement; re-run this preflight immediately before '
        'recording numbers and again after, and treat a mid-run failure as infrastructure, not styling.'
        if report['verdict'] == 'STYLED' else
        'DO NOT measure. Report blocked: the served page is not proven styled (200 + DOM is not evidence).'
    )
    return report, (0 if report['verdict'] == 'STYLED' else 2)


def fingerprint(report):
    """The facts two samples must agree on for the gate to be trustworthy."""
    return {
        'verdict': report.get('verdict'),
        'page_bytes': report.get('page_bytes'),
        'total_css_bytes': report.get('total_css_bytes'),
        'stylesheets': report.get('stylesheets_referenced'),
    }


def main():
    positional = [a for a in sys.argv[1:] if not a.startswith('--')]
    base = (positional[0] if positional else 'http://127.0.0.1:3100').rstrip('/')
    label = positional[1] if len(positional) > 1 else 'run'
    samples, interval = DEFAULT_SAMPLES, DEFAULT_INTERVAL
    expect_build = None
    build_id_file = None
    watched_pid = None
    warmup = False
    for index, value in enumerate(sys.argv):
        if value == '--samples' and index + 1 < len(sys.argv):
            samples = max(1, int(sys.argv[index + 1]))
        if value == '--interval' and index + 1 < len(sys.argv):
            interval = max(0, int(sys.argv[index + 1]))
        if value == '--expect-build' and index + 1 < len(sys.argv):
            expect_build = sys.argv[index + 1]
        if value == '--build-id-file' and index + 1 < len(sys.argv):
            build_id_file = sys.argv[index + 1]
        if value == '--pid' and index + 1 < len(sys.argv):
            try:
                watched_pid = int(sys.argv[index + 1])
            except ValueError:
                watched_pid = None
        if value == '--warmup':
            warmup = True

    if warmup:
        # Throwaway request: the first hit after an idle period has measured 179.9 s here, and
        # scoring that as a failure is the single most repeated mistake of this project.
        started = time.time()
        try:
            fetch(base + '/', timeout=LIVENESS_TIMEOUT)
            print(f'warmup: {round(time.time() - started, 1)} s (discarded)')
        except Exception as error:  # noqa: BLE001
            print(f'warmup failed after {round(time.time() - started, 1)} s: '
                  f'{type(error).__name__} — continuing to the gated samples')

    pid_before = pid_alive(watched_pid)

    collected, code = [], 0
    for sample_index in range(samples):
        report, sample_code = check_once(base, expect_build=expect_build, build_id_file=build_id_file)
        report['sample'] = sample_index + 1
        collected.append(report)
        code = max(code, sample_code)
        if sample_code in (2, 3, 5, 6, 7):
            break  # fail closed at once; never wait on a dead, unstyled, dev or timing-out runtime
        if sample_index + 1 < samples:
            time.sleep(interval)

    prints = [fingerprint(r) for r in collected]
    stable = len({json.dumps(p, sort_keys=True) for p in prints}) == 1
    if code == 0 and not stable:
        code = 4

    verdict = 'UNSTABLE' if code == 4 else (collected[-1]['verdict'] if collected else 'UNKNOWN')
    pid_after = pid_alive(watched_pid)
    guidance = {
        0: 'Safe to capture. Record BUILD_ID and source hash before and after the run.',
        2: 'DO NOT capture: served page is not proven styled (200 + DOM is not evidence).',
        3: 'DO NOT capture: runtime unreachable. Report blocked; do not restart it.',
        4: 'DO NOT capture: samples disagree, so the served artefact or the runtime changed mid-gate.',
        5: 'DO NOT capture: dev artefact, not a candidate. Dev delivers CSS at hydration; require a next start build with a BUILD_ID.',
        6: 'DO NOT capture yet: request timed out. Below the liveness budget this is NOT proof of death - it may be cold-compiling (worst observed ~78 s here). A port that stays bound but returns ZERO bytes for the whole budget, with its PID still alive, must be recorded as DOWN: ask the port, never the process table.',
        7: 'DO NOT capture: BUILD_ID mismatch. The artefact cannot be identified, so any capture would be unreproducible. Get the authoritative BUILD_ID and its source hash first.',
    }.get(code, 'Unknown state: do not capture.')

    combined = {
        'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'base_url': base,
        'samples_requested': samples,
        'sample_interval_s': interval,
        'samples_taken': len(collected),
        'stable_across_samples': stable,
        'verdict': verdict,
        'exit_code': code,
        'guidance': guidance,
        'samples': collected,
        'watched_pid': watched_pid,
        'pid_alive_before': pid_before,
        'pid_alive_after': pid_after,
        'liveness_budget_s': LIVENESS_TIMEOUT,
        'pid_note': ('A bound port with a live PID is not health: a listener has been measured '
                     'accepting connections and returning zero bytes for 165 s. Judge the server by '
                     'bytes and elapsed time, never by the presence of a process.'),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'styled-preflight-{label}.json'
    path.write_text(json.dumps(combined, indent=2), encoding='utf-8')
    print(json.dumps({'path': str(path), 'verdict': verdict, 'exit_code': code,
                      'samples': len(collected), 'stable': stable,
                      'failed': collected[-1].get('failed_checks', []) if collected else []},
                     indent=1))
    return code


def write(report, label):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'styled-preflight-{label}.json'
    path.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({'path': str(path), 'verdict': report['verdict'],
                      'failed': report.get('failed_checks', [])}, indent=1))


if __name__ == '__main__':
    raise SystemExit(main())
