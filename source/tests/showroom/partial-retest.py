"""Independent bounded PARTIAL retest; Browser Use helpers are supplied by browser_exec.
QA_PARTIAL_PHASE='geometry'|'claims-fallback'. No release/HQ/rights approval.
Stops on exact source drift; writes only its candidate-scoped QA evidence tree.
"""
from pathlib import Path
import hashlib,json,time,datetime,shutil
ROOT=Path('E:/Sitrak-website');EXPECTED='516fb460579e00b13aa6800ea0487c6e0287bfbfebef62467472e7363caecdbb'
OUT=ROOT/'docs/showroom-evidence/qa/partial-516fb460';OUT.mkdir(parents=True,exist_ok=True)
PHASE=globals().get('QA_PARTIAL_PHASE','geometry');results=[];identity=[]
BASE='http://127.0.0.1:3100'
def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def fingerprint(label):
    paths=[]
    for name in ('app','components','lib','public'):paths.extend(p for p in (ROOT/name).rglob('*') if p.is_file())
    for name in ('package.json','package-lock.json','next.config.ts','next.config.mjs','tsconfig.json','vitest.config.ts','AGENTS.md'):
        p=ROOT/name
        if p.is_file():paths.append(p)
    files={str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)}
    digest=hashlib.sha256(json.dumps(files,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    identity.append({'label':label,'utc':stamp(),'sha256':digest,'fileCount':len(files)})
    if digest!=EXPECTED:
        save();raise RuntimeError('BLOCKED: candidate source drift '+digest)
    return digest

def save():
    (OUT/(PHASE+'.json')).write_text(json.dumps({'phase':PHASE,'candidate':EXPECTED,'utc':stamp(),'identity':identity,'results':results},indent=2),encoding='utf-8')
def check(name,ok,actual):
    results.append({'name':name,'status':'passed' if ok else 'failed','actual':actual});save()
def navigate(path):
    try:goto_url(BASE+path);wait_for_load()
    except Exception:
        from urllib.parse import urlsplit
        state=js('({url:location.href,ready:document.readyState})');actual=urlsplit(state['url']);expected=urlsplit(BASE+path)
        if state['ready']!='complete' or (actual.netloc,actual.path.rstrip('/'),actual.fragment)!=(expected.netloc,expected.path.rstrip('/'),expected.fragment):raise
    time.sleep(.8)
def shot(name):
    if globals().get('QA_PARTIAL_SCREENSHOTS',False):
        path=capture_screenshot()
        if path:shutil.copyfile(path,OUT/(name+'.png'))

def enquiry(label):
    js("document.querySelector('.c7h-heading-actions button').focus();document.querySelector('.c7h-heading-actions button').click()")
    state=js("({dialog:!!document.querySelector('[role=dialog]'),model:document.querySelector('select[name=model]')?.value})")
    check(label+' enquiry no-submit',state['dialog'] and state['model']=='SITRAK C7H',state)
    js("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
    check(label+' Escape closes/restores focus',js("!document.querySelector('[role=dialog]')&&document.activeElement===document.querySelector('.c7h-heading-actions button')"),{})

fingerprint('before')
cdp('Network.enable');cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*'])
cdp('Emulation.setEmulatedMedia',features=[{'name':'prefers-reduced-motion','value':'reduce'}])
auditScript=cdp('Page.addScriptToEvaluateOnNewDocument',source="""
window.__partialAudit={errors:[],consoleErrors:[],deniedWrites:[]};
addEventListener('error',e=>{if(e.message)window.__partialAudit.errors.push(e.message)});
addEventListener('unhandledrejection',e=>window.__partialAudit.errors.push(String(e.reason)));
const originalError=console.error;console.error=(...a)=>{window.__partialAudit.consoleErrors.push(a.map(String).join(' '));originalError(...a)};
const realFetch=fetch.bind(window);window.fetch=(url,options={})=>{const method=String(options.method||url?.method||'GET').toUpperCase();if(!['GET','HEAD','OPTIONS'].includes(method)){window.__partialAudit.deniedWrites.push({url:String(url),method});return Promise.reject(Error('QA write denied'))}return realFetch(url,options)};
""")['identifier']
try:
    if PHASE=='geometry':
        for width,height,label in [(1440,1000,'desktop'),(820,1180,'tablet'),(390,844,'mobile')]:
            fingerprint(label+' before')
            cdp('Emulation.setDeviceMetricsOverride',width=width,height=height,deviceScaleFactor=1,mobile=False)
            navigate('/');js('scrollTo(0,0)')
            js('document.fonts.ready.then(()=>true)')
            for variable in [False,True]:
                if variable:
                    js("(()=>{const card=document.querySelectorAll('.showroom-range-card')[1];card.querySelector('h2').textContent='HOWO 7 — Synthetic extended model heading for demanding work';card.querySelector('.showroom-range-copy>.eyebrow').textContent='Synthetic configuration with variable line length for responsive testing';card.querySelector('.showroom-range-copy>p:not(.eyebrow)').textContent='QA synthetic longer description for construction, regional operations and demanding applications; test DOM only, not approved product copy.'})()")
                state=js('''(()=>{const box=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,display:s.display,visibility:s.visibility,opacity:s.opacity}};const hero=document.querySelector('#top.hero'),header=document.querySelector('.site-header'),cards=[...document.querySelectorAll('.showroom-range-card')];return {scrollY,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,hero:box(hero),header:box(header),firstMain:document.querySelector('main')?.firstElementChild?.id,heroImage:[...document.querySelectorAll('#top .hero-image.is-active')].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),cards:cards.map(c=>({card:box(c),image:box(c.querySelector('.showroom-range-image')),copy:box(c.querySelector('.showroom-range-copy')),config:box(c.querySelector('.eyebrow')),heading:box(c.querySelector('h2')),description:box(c.querySelector('.showroom-range-copy>p:not(.eyebrow)')),actions:box(c.querySelector('.showroom-range-actions')),controls:[...c.querySelectorAll('.showroom-range-actions>a,.showroom-range-actions>button')].map(box)})),audit:window.__partialAudit}})()''')
                tag=label+('-variable' if variable else '-baseline');hero=state['hero']
                if not variable:
                    check(tag+' hero first visible at scroll zero',bool(hero and state['scrollY']==0 and state['firstMain']=='top' and hero['height']>0 and hero['width']>0 and hero['y']<height and hero['bottom']>state['header']['bottom'] and hero['visibility']=='visible' and float(hero['opacity'])>0 and state['heroImage'] and all(i['loaded'] for i in state['heroImage'])),state)
                    shot(label+'-hero-top')
                cards=state['cards'];rows=[];aligned=len(cards)==3;contained=len(cards)==3
                for card in cards:
                    row=next((r for r in rows if abs(r[0]['card']['y']-card['card']['y'])<=2),None)
                    if row is None:rows.append([card])
                    else:row.append(card)
                    c=card['card']
                    for key in ['image','copy','config','heading','description','actions']:
                        b=card[key];contained=contained and bool(b) and b['x']>=c['x']-2 and b['right']<=c['right']+2 and b['y']>=c['y']-2 and b['bottom']<=c['bottom']+2
                    for b in card['controls']:contained=contained and b['x']>=c['x']-2 and b['right']<=c['right']+2 and b['bottom']<=c['bottom']+2
                for row in rows:
                    if len(row)>1:
                        for key,edge in [('image','bottom'),('heading','y'),('description','y'),('actions','y'),('card','bottom')]:
                            values=[c[key][edge] for c in row];aligned=aligned and max(values)-min(values)<=2
                check(tag+' aligned grid rows and all frame/copy/CTA containment',aligned and contained and state['documentWidth']<=width,{'rows':rows,'documentWidth':state['documentWidth'],'viewportWidth':width,'toleranceCssPx':2,'mobileNote':'single-column containment, not cross-row Y equality'})
                check(tag+' no JS errors or attempted writes',not any(state['audit'].values()),state['audit'])
                if variable:
                    js("document.querySelector('#the-range').scrollIntoView({block:'start'})");shot(label+'-range-variable');js('scrollTo(0,0)')
                fingerprint(tag+' after')
    elif PHASE=='claims-fallback':
        for width,height,label in [(1440,1000,'desktop'),(390,844,'mobile')]:
            cdp('Emulation.setDeviceMetricsOverride',width=width,height=height,deviceScaleFactor=1,mobile=False)
            navigate('/')
            state=js("({engineering:document.querySelector('#the-engineering')?.textContent,service:document.querySelector('#backed-by-service')?.textContent,rangeLabel:document.querySelector('#the-range')?.getAttribute('data-screen-label'),heroCopy:document.querySelector('.hero-copy')?.textContent,audit:window.__partialAudit})")
            check(label+' owned engineering claims qualified',all(s in state['engineering'] for s in ['Supplied C7H specification','Confirm the exact build','Exact local build is unverified','exact local fitment is unverified']) and 'SA homologated' not in state['engineering'] and 'Homologated for South Africa' not in state['engineering'],state['engineering'])
            check(label+' service/offer scope qualified',all(s in state['service'] for s in ['Ask the dealership about current maintenance','eligible models and applicable terms','current parts and service-support arrangements','exact local build is unverified']) and 'Year 1 maintenance and registration are covered' not in state['service'],state['service'])
            check(label+' range sequence label retained',state['rangeLabel']=='02 The range',state['rangeLabel'])
            # Known unowned Hero wording remains separately recorded, not silently cleared.
            record={'name':label+' unowned hero pulling-capacity claim','status':'known_open' if 'pulling capacity' in (state['heroCopy'] or '') else 'needs_review','actual':state['heroCopy']};results.append(record);save()
            primary='/assets/panoramas/sitrak-c7h-interior-panorama.jpg';alternate='/assets/references/c7h-cockpit.webp'
            cdp('Network.setCacheDisabled',cacheDisabled=True);cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*','*'+primary])
            navigate('/models/sitrak-c7h/#cabin')
            deadline=time.monotonic()+8
            while time.monotonic()<deadline:
                state=js("(()=>{const image=document.querySelector('.showroom-poster img');return {image:!!image,src:image?.getAttribute('src'),loaded:!!image&&image.complete&&image.naturalWidth>0,naturalWidth:image?.naturalWidth,alt:image?.alt,caption:document.querySelector('.showroom-poster figcaption')?.textContent,status:[...document.querySelectorAll('[role=status]')].map(e=>e.textContent),resources:performance.getEntriesByType('resource').filter(e=>e.name.includes('sitrak-c7h-interior-panorama')||e.name.includes('c7h-cockpit')).map(e=>({url:e.name,transferSize:e.transferSize,decodedBodySize:e.decodedBodySize})),audit:window.__partialAudit}})()")
                if state['src']==alternate and state['loaded']:break
                time.sleep(.2)
            expected='Overseas LHD/manual C7-family archive photograph — not the offered RHD AMT cabin. Exact local trim is unverified.'
            check(label+' blocked primary decodes archive fallback before hydration',state['src']==alternate and state['loaded'] and state['alt']==expected and state['caption']==expected,{'blocked':primary,**state})
            enquiry(label+' archive fallback');shot(label+'-archive-fallback')
            check(label+' archive fallback no JS errors/writes',not any(state['audit'].values()),state['audit'])
            cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*']);cdp('Network.setCacheDisabled',cacheDisabled=False)
            fingerprint(label+' claims fallback after')
    else:raise ValueError(PHASE)
finally:
    cdp('Page.removeScriptToEvaluateOnNewDocument',identifier=auditScript)
    cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*']);cdp('Network.setCacheDisabled',cacheDisabled=False)
    fingerprint('after');save()
print(json.dumps({'phase':PHASE,'candidate':EXPECTED,'counts':{s:sum(r['status']==s for r in results) for s in ['passed','failed','known_open','needs_review']},'evidence':str(OUT/(PHASE+'.json'))},indent=2))
if any(r['status']=='failed' for r in results):raise AssertionError('Partial retest failed; preserve candidate-scoped JSON')
