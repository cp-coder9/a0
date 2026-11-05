"""Read-only HTTP smoke checks; real email is an explicit opt-in."""
import argparse
import hashlib
import json
import pathlib
import urllib.error
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:3100')
parser.add_argument('--send-email-test', action='store_true', help='Send ONE real verification email to chris@trukafrik.com. Do not use in routine checks.')
args = parser.parse_args()
base = args.base_url.rstrip('/')
with urllib.request.urlopen(base, timeout=30) as response:
    page = response.read().decode()
    assert response.status == 200 and 'SITRAK' in page
    print('HOME', response.status, 'SECTIONS', page.count('data-screen-label='))
with urllib.request.urlopen(base + '/uploads/Sitrak%20Main%20Brochure.pdf', timeout=30) as response:
    assert response.read(5) == b'%PDF-'
    print('PDF', response.status, response.headers.get('Content-Type'))
# Invalid input reaches validation but cannot send mail.
request = urllib.request.Request(base + '/api/enquiries', data=b'{}', headers={'Content-Type': 'application/json', 'Origin': base})
try:
    urllib.request.urlopen(request, timeout=30)
    raise AssertionError('Invalid enquiry was accepted')
except urllib.error.HTTPError as error:
    assert error.code == 400, f'Expected validation 400, received {error.code}'
    print('INVALID ENQUIRY', error.code, 'NO EMAIL SENT')
if args.send_email_test:
    payload = {'name': 'Explicit SMTP smoke verification (synthetic)', 'email': 'website@trukafrik.com', 'message': 'One-time explicitly requested SMTP smoke test. Not a customer enquiry or booking.', 'consent': True}
    request = urllib.request.Request(base + '/api/enquiries', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json', 'Origin': base})
    with urllib.request.urlopen(request, timeout=35) as response:
        result = json.load(response)
        assert response.status == 201 and result.get('sent') is True and result.get('delivery') == 'email'
        print('REAL SMTP TEST ACCEPTED', response.status, result.get('id'))
for path, expected in [('/api/enquiries', 405), ('/.env.local', 404), ('/.local-data/enquiries/', 404)]:
    try:
        urllib.request.urlopen(base + path, timeout=30)
        raise AssertionError(f'Unexpected public access to {path}')
    except urllib.error.HTTPError as error:
        assert error.code == expected, f'{path}: {error.code}, expected {expected}'
        print(path, error.code)
source = pathlib.Path('D:/Sitrak-website-source')
target = pathlib.Path('D:/Sitrak-website/public')
if source.is_dir():
    files = [f for folder in ['assets', 'uploads', 'tokens'] for f in (source / folder).rglob('*') if f.is_file()]
    matched = bool(files) and all(hashlib.sha256(f.read_bytes()).digest() == hashlib.sha256((target / f.relative_to(source)).read_bytes()).digest() for f in files)
    assert matched
    print('EXACT SOURCE FILES', len(files), matched)
else:
    print('SOURCE HASH CHECK SKIPPED: original extraction is unavailable')
