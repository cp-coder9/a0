"""Execute via Browser Use browser_exec with the helpers pre-imported.
Set QA_PHASE to 'layout', 'journeys', or 'fallbacks'; see README.md.
Never submits a form. API is network-blocked as a second safety boundary.
Uses only its named isolated session, not Cole's manual browser.
"""
from pathlib import Path
import json, time, shutil, datetime
ROOT = Path('E:/Sitrak-website')
OUT = ROOT / 'docs/showroom-evidence/qa'
OUT.mkdir(parents=True, exist_ok=True)
PHASE = globals().get('QA_PHASE', 'layout')
results = []

def check(name, passed, actual):
    results.append({'name':name,'status':'passed' if passed else 'failed','actual':actual})

def save():
    (OUT / f'browser-{PHASE}.json').write_text(json.dumps({'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'base':'http://localhost:3100','phase':PHASE,'userAgent':js('navigator.userAgent'),'results':results},indent=2),encoding='utf-8')

def shot(name):
    if not globals().get('QA_SCREENSHOTS', True):
        return
    source = capture_screenshot()
    if source:
        shutil.copyfile(source, OUT / (name+'.png'))

def navigate(path):
    try:
        goto_url('http://localhost:3100'+path)
        wait_for_load()
    except Exception:
        # Accept a timed-out CDP response only after inspecting the actual target.
        from urllib.parse import urlsplit
        expected=urlsplit('http://localhost:3100'+path)
        actual=js('({url:location.href,ready:document.readyState})')
        observed=urlsplit(actual['url'])
        if actual['ready']!='complete' or (observed.netloc,observed.path.rstrip('/'),observed.fragment)!=(expected.netloc,expected.path.rstrip('/'),expected.fragment):
            raise
        print('Navigation response timeout recovered by verified complete target: '+actual['url'])
    # Wait for hydration's event handlers, not a fabricated response.
    time.sleep(1)

cdp('Network.enable')
cdp('Network.setBlockedURLs', urls=['*://*/api/enquiries*'])
cdp('Emulation.setEmulatedMedia', features=[{'name':'prefers-reduced-motion','value':'reduce'}])
if PHASE == 'layout':
    for width,height,label in [(1440,1000,'desktop'),(820,1180,'tablet'),(390,844,'mobile')]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=height,deviceScaleFactor=1,mobile=False)
        navigate('/')
        for variable in [False,True]:
            if variable:
                js('''(()=>{const p=document.querySelectorAll('.showroom-range-copy>p:not(.eyebrow)');if(p[1])p[1].textContent='QA synthetic variable length model description for demanding construction operations and regional applications — extended reference text';})()''')
            data=js('''(()=>{const box=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,display:s.display,visibility:s.visibility,opacity:s.opacity}};const hero=document.querySelector('#top.hero');return {viewport:{width:innerWidth,height:innerHeight},scroll:{x:scrollX,y:scrollY},hero:box(hero),heroFirst:!!hero&&document.querySelector('main')?.firstElementChild===hero,documentWidth:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('.showroom-range-card')].map(e=>({card:box(e),image:box(e.querySelector('.showroom-range-image')),heading:box(e.querySelector('h2')),actions:box(e.querySelector('.showroom-range-actions')),primary:box(e.querySelector('.showroom-range-actions>a,.showroom-range-actions>button'))}))}})()''')
            suffix=label+('-variable' if variable else '-baseline')
            hero=data['hero']
            if not variable:
                check(suffix+' hero exists visible at top',bool(hero and hero['width']>0 and hero['height']>0 and hero['y']<height and hero['bottom']>0 and hero['display']!='none' and hero['visibility']=='visible' and float(hero['opacity'])>0 and data['heroFirst']), data)
                check(suffix+' no horizontal overflow', data['documentWidth']<=width, {'documentWidth':data['documentWidth'],'viewport':width})
            cards=data['cards']; rows=[]
            for card in cards:
                row=next((r for r in rows if abs(r[0]['card']['y']-card['card']['y'])<=2),None)
                if row is None: rows.append([card])
                else: row.append(card)
            aligned=len(cards)==3
            for row in rows:
                if len(row)>1:
                    for key,edge in [('image','bottom'),('heading','y'),('actions','y'),('card','bottom')]:
                        values=[c[key][edge] for c in row]
                        aligned=aligned and max(values)-min(values)<=2
            contained=all(c['primary'] and c['primary']['x']>=c['card']['x']-2 and c['primary']['x']+c['primary']['width']<=c['card']['x']+c['card']['width']+2 and c['actions']['bottom']<=c['card']['bottom']+2 for c in cards)
            check(suffix+' card grid same-row alignment and contained CTA',aligned and contained,{'rows':rows,'tolerancePx':2,'variableText':variable,'note':'Single-column rows: alignment across columns not applicable; CTA containment checked.'})
            shot(suffix)
            save()
elif PHASE == 'journeys':
    cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
    for mode in ['exterior','cabin','specifications']:
        navigate('/models/sitrak-c7h/#'+mode)
        data=js('''(()=>({hash:location.hash,current:document.querySelector('.showroom-view-tabs [aria-current]')?.textContent,view:document.querySelector('.c7h-view-main')?.getAttribute('aria-label'),image:[...document.querySelectorAll('.showroom-poster img')].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),optional:document.querySelectorAll('.truck-illustration,.cabin-panorama').length,table:!!document.querySelector('.spec-table')}))()''')
        check('direct '+mode+' route',data['current']==mode.capitalize() and data['view']==mode+' view' and (data['table'] if mode=='specifications' else bool(data['image']) and all(i['loaded'] for i in data['image'])),data)
        js("document.querySelector('.c7h-heading-actions button').click()")
        time.sleep(.1)
        data=js("({dialog:!!document.querySelector('[role=dialog]'),model:document.querySelector('select[name=model]')?.value})")
        check(mode+' enquiry prefill (never submit)',data['dialog'] and data['model']=='SITRAK C7H',data)
        js("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
        check(mode+' Escape closes enquiry',not js("!!document.querySelector('[role=dialog]')"),{})
        save()
    navigate('/models/sitrak-c7h/#exterior')
    js("document.querySelector('.showroom-view-tabs a[href=\"#cabin\"]').click()")
    js('history.back()');time.sleep(.5)
    check('actual browser Back restores exterior',js("location.hash==='#exterior'&&document.querySelector('.showroom-view-tabs [aria-current]')?.textContent==='Exterior'"),js('({hash:location.hash})'))
    js("location.hash='invalid'");time.sleep(.3)
    check('invalid hash falls back to Exterior',js("document.querySelector('.showroom-view-tabs [aria-current]')?.textContent==='Exterior'"),{})
    save()
elif PHASE == 'fallbacks':
    script=cdp('Page.addScriptToEvaluateOnNewDocument',source="Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true});HTMLCanvasElement.prototype.getContext=function(){return null}")['identifier']
    try:
        navigate('/models/sitrak-c7h/#exterior')
        js("[...document.querySelectorAll('button')].find(b=>b.textContent==='Load illustrative 3D').click()")
        data=js("({status:[...document.querySelectorAll('[role=status]')].map(x=>x.textContent),poster:!![...document.querySelectorAll('.showroom-poster img')].find(i=>i.complete&&i.naturalWidth>0),hide:[...document.querySelectorAll('button')].some(b=>b.textContent==='Hide 3D illustration')})")
        check('browser noGPU retains loaded poster and explicit message',data['poster'] and not data['hide'] and any('graphics are unavailable' in x for x in data['status']),data)
        shot('noGPU');save()
    finally:cdp('Page.removeScriptToEvaluateOnNewDocument',identifier=script)
    # Discover actual poster/fallback assets from browser DOM through first error.
    for mode in ['exterior','cabin']:
        cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*'])
        navigate('/models/sitrak-c7h/#'+mode)
        primary=js("document.querySelector('.showroom-poster img').getAttribute('src')")
        js("document.querySelector('.showroom-poster img').dispatchEvent(new Event('error'))")
        time.sleep(.2)
        alternate=js("document.querySelector('.showroom-poster img')?.getAttribute('src')")
        cdp('Network.setCacheDisabled',cacheDisabled=True)
        cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*','*'+primary,'*'+alternate])
        navigate('/models/sitrak-c7h/#'+mode)
        time.sleep(.5)
        data=js("({image:!!document.querySelector('.showroom-poster img'),status:[...document.querySelectorAll('[role=status]')].map(x=>x.textContent)})")
        check(mode+' network-blocked primary and fallback before hydration',not data['image'] and any('no substitute vehicle' in x for x in data['status']),{'blocked':[primary,alternate],**data})
        js("document.querySelector('.showroom-view-tabs a[href=\"#specifications\"]').click();document.querySelector('.c7h-heading-actions button').click()")
        check(mode+' failed media specifications and enquiry still usable',js("!!document.querySelector('.spec-table')&&document.querySelector('select[name=model]')?.value==='SITRAK C7H'"),{})
        shot(mode+'-blocked-media');save()
    cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*'])
    cdp('Network.setCacheDisabled',cacheDisabled=False)
else:raise ValueError(PHASE)
save()
print(json.dumps({'phase':PHASE,'counts':{s:sum(r['status']==s for r in results) for s in ['passed','failed']},'checks':[{'name':r['name'],'status':r['status']} for r in results]},indent=2))
if any(r['status']=='failed' for r in results):
    raise AssertionError('QA acceptance failed; see browser-'+PHASE+'.json')
