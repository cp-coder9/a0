# Tess independent showroom regression harness

Scope: room `project-team-26873cc177ae326592fcf7fa`, SSIT-C7H-01 behavioral checkpoint. Only tests/showroom and docs/showroom-evidence/qa are written. Never change implementation to make a QA test pass.

## Component checks

From E:/Sitrak-website, existing Node/dependencies only:

```
node node_modules/vitest/vitest.mjs run tests/showroom/c7h-acceptance.test.tsx --pool=forks --maxWorkers=1 --reporter=verbose
node node_modules/vitest/vitest.mjs run tests/showroom components/showroom --pool=forks --maxWorkers=1 --reporter=json --outputFile=docs/showroom-evidence/qa/scoped-forks-results.json
```

The forks override is explicit, not a configuration edit. Threads encountered a worker/startup boundary under concurrent team test processes: 0 tests in its unsuccessful report and a chained command timeout. Do not call that an assertion failure or reuse its report as a pass. Forks actually ran 13 independent tests, plus 10 existing colocated owner tests in the scoped run. Dynamic renderers and fetch are mocked in component tests: no real renderer, backend or mail delivery is proved. Synthetic fields only.

## Source identity

```
python tests/showroom/source-identity.py before
# run checks
python tests/showroom/source-identity.py after
```

Compare complete file maps, not just timestamps. Source map includes app/components/lib/public and available package/config files; it excludes secrets, node_modules, generated build output and test harness. The aggregate is SHA256 of compact sorted UTF-8 JSON mapping relative paths to content SHA256. No Git repository is present. Record harness hashes separately. This is a local source identity, not a production artifact digest.

## Browser checks

Requires actual Hermes Browser Use helper runtime, not an installed project Playwright package. Python playwright and Node playwright/puppeteer were absent; none were installed. Read-only preview identity check showed local HTTP 200, correct SITRAK title and PID 9656 command using E:/Sitrak-website/node_modules/next/dist/server/lib/start-server.js. No preview start/restart/build command is in this harness.

Use Browser Use tool `browser_exec`, named isolated session `sitrak-tess-qa` (never Cole's manual session). First initialize with `new_tab('http://localhost:3100')`. Then execute one phase per call:

```python
# Geometry failures are expected until owner fixes the candidate
QA_PHASE='layout'  # alternatives: 'journeys', 'fallbacks'
QA_SCREENSHOTS=False  # True to capture; original screenshots already recorded
exec(compile(open('E:/Sitrak-website/tests/showroom/browser-acceptance.py',encoding='utf-8').read(),'browser-acceptance.py','exec'))
```

```python
exec(compile(open('E:/Sitrak-website/tests/showroom/browser-integration.py',encoding='utf-8').read(),'browser-integration.py','exec'))
```

Acceptance script saves JSON after batches and raises AssertionError if any criterion fails. Integration script records per-check status; inspect JSON rather than relying on tool exit alone. Screenshots are optional because the browser daemon later timed out capturing one; geometry-only rerun actually reached the expected acceptance assertion. Navigation timeout recovery checks actual complete target URL/path/hash; it does not blindly retry or fabricate page state.

Viewports: 1440x1000, 820x1180, 390x844 CSS pixels, DPR1, reduced motion emulated, HeadlessChrome145 on Windows. These are viewport emulations, not physical device/browser matrix certification. Programmatic DOM clicks are used for route/mode journeys; real CDP keyboard Enter/Escape additionally exercised. Do not describe these as Cole's manual pointer evidence.

Layout: hero #top.hero must be present, visible in first viewport and first main child. Across cards sharing a grid row, image bottoms, heading tops, action tops and card bottoms must agree within 2 CSS px. Single-column mobile checks CTA containment; cross-column alignment is not applicable. Test adds synthetic longer text to the second card in browser memory only and reloads later, never source writes.

Safety: all browser phases block /api/enquiries at network level. No browser form submission occurs. Integration additionally denies non-read fetch and records JS errors/console errors/attempted writes. Unit failures use explicit mocked fetch, not a real mail service. Media failure uses CDP network blocking of the actual primary/alternate image discovered from the rendered component; no asset is deleted. noGPU injection affects only this test realm and is removed afterward.

Residual scope: no static/PHP host parity, live email, deployment, full production build, security audit, load test, real device certification or media-rights approval. New source hashes require new applicable results. Evidence files are QA artifacts, not Chase's canonical task ledger.
