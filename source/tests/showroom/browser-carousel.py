"""Browser Use helper test. Run only after an owner supplies a stable candidate.
Required globals: QA_STABLE_CANDIDATE=True, QA_STAGE='post-fix-<identifier>',
QA_CAROUSEL_PHASE='quality'|'motion'|'failure'. Never submit an enquiry.
Generate carousel-contract.json first and bracket run with source-identity.py.
"""
from pathlib import Path
import json,time,datetime,hashlib
ROOT=Path('E:/Sitrak-website');OUT=ROOT/'docs/showroom-evidence/qa'
if globals().get('QA_STABLE_CANDIDATE') is not True:
    raise RuntimeError('NOT_RUN: stable owner candidate required; do not infer implementation approval')
stage=globals().get('QA_STAGE','')
if not stage or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for c in stage):
    raise ValueError('QA_STAGE must be an explicit safe candidate label')
phase=globals().get('QA_CAROUSEL_PHASE','quality')
contract=json.loads((OUT/'carousel-contract.json').read_text(encoding='utf-8'))
if hashlib.sha256((ROOT/contract['source']).read_bytes()).hexdigest()!=contract['sourceSha256']:
    raise RuntimeError('NOT_RUN: carousel source changed since expected-binding export')
models=contract['models'];results=[]
cdp('Network.enable');cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*'])

def record(name,status,actual):
    results.append({'name':name,'status':status,'actual':actual})
    (OUT/f'carousel-{stage}-{phase}.json').write_text(json.dumps({'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'stage':stage,'phase':phase,'contractSourceSha256':contract['sourceSha256'],'results':results},indent=2),encoding='utf-8')

def read():
    return js('''(()=>{const hero=document.querySelector('#top.hero'),image=hero?.querySelector('.hero-image.is-active'),group=hero?.querySelector('.hero-slide-copy');const r=hero?.getBoundingClientRect();return {hero:!!hero,heroBox:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,src:image?.getAttribute('src'),currentSrc:image?.currentSrc,loaded:!!image&&image.complete&&image.naturalWidth>0,group:group?.getAttribute('aria-label'),selected:[...document.querySelectorAll('.model-selector[aria-pressed=true]')].map(e=>e.getAttribute('aria-label')),status:[...document.querySelectorAll('#top [role=status]')].map(e=>e.textContent)}})()''')

def context(index,label):
    actual=read();m=models[index]
    ok=actual['hero'] and actual['src']==m['image'] and actual['group']==f'{index+1} of {len(models)}: {m["name"]}' and actual['selected']==['Show '+m['name']]
    record(label+' context','passed' if ok else 'failed',actual)
    js("document.querySelector('.hero-actions button').click()")
    actual=js("({model:document.querySelector('select[name=model]')?.value,dialog:!!document.querySelector('[role=dialog]')})")
    record(label+' enquiry no-submit','passed' if actual['dialog'] and actual['model']==m['model'] else 'failed',actual)
    js("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")

def select(index):
    js('document.querySelectorAll(".model-selector")['+str(index)+'].click()');time.sleep(.8)

def navigate(reduced=True):
    cdp('Emulation.setEmulatedMedia',features=[{'name':'prefers-reduced-motion','value':'reduce' if reduced else 'no-preference'}])
    goto_url('http://localhost:3100/');wait_for_load();time.sleep(1)
    if not read()['hero']:raise AssertionError('Hero absent: not an implemented integrated candidate')

if phase=='quality':
    for width,height in [(1440,1000),(820,1180),(390,844)]:
        for dpr in [1,2]:
            cdp('Emulation.setDeviceMetricsOverride',width=width,height=height,deviceScaleFactor=dpr,mobile=False)
            navigate()
            baseline_box=read()['heroBox']
            for index,m in enumerate(models):
                select(index);label=f'{width}x{height}@{dpr} {m["id"]}';context(index,label)
                after_box=read()['heroBox']
                record(label+' no hero box shift across model selection','passed' if after_box and all(abs(after_box[key]-baseline_box[key])<=1 for key in ['x','y','width','height']) else 'failed',{'before':baseline_box,'after':after_box,'toleranceCssPx':1})
                data=js('''(async()=>{const image=document.querySelector('.hero-image.is-active'),r=image.getBoundingClientRect(),s=getComputedStyle(image),url=new URL(image.currentSrc||image.src,location.href);let raw=null,error=null;try{if(url.origin!==location.origin)throw Error('nonlocal asset: provenance authorization needed');const response=await fetch(url.href);if(!response.ok)throw Error('HTTP '+response.status);const bitmap=await createImageBitmap(await response.blob());raw={width:bitmap.width,height:bitmap.height};bitmap.close()}catch(e){error=String(e)}return {loaded:image.complete&&image.naturalWidth>0,natural:{width:image.naturalWidth,height:image.naturalHeight},raw,currentSrc:image.currentSrc,rendered:{width:r.width,height:r.height},dpr:devicePixelRatio,fit:s.objectFit,position:s.objectPosition,error}})()''')
                raw=data['raw'];box=data['rendered'];ratio=None
                if raw and raw['width'] and raw['height']:
                    sx=box['width']/raw['width'];sy=box['height']/raw['height']
                    ratio=(min(sx,sy) if data['fit']=='contain' else max(sx,sy))*data['dpr']
                    data['requiredPixelScale']=ratio
                    data['visibleSourceFraction']=min(1,box['width']*box['height']/((max(sx,sy)**2)*raw['width']*raw['height'])) if data['fit']=='cover' else None
                record(label+' loaded source pixels no upscaling','blocked' if ratio is None else ('passed' if data['loaded'] and ratio<=1 else 'failed'),data)
                # Passing dimensions is necessary, never proof of original quality/rights/subject crop.
                record(label+' provenance/non-upscaled-original and subject crop','not_run',{'needs':'Paige approved source/variant/rights inventory plus manual full-truck crop/sharpness inspection','crop':data.get('visibleSourceFraction'),'position':data['position']})
elif phase=='motion':
    cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
    navigate(False)
    js("document.body.tabIndex=-1;document.body.focus()")
    cdp('Input.dispatchMouseEvent',type='mouseMoved',x=1,y=1)
    initial=read();last=initial
    for index in range(1,len(models)+1):
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            current=read()
            if current['group']!=last['group']:break
            time.sleep(.2)
        expected=index%len(models);m=models[expected]
        ok=current['src']==m['image'] and current['group']==f'{expected+1} of {len(models)}: {m["name"]}'
        record('actual automatic advance '+m['id'],'passed' if ok else 'failed',current);last=current
    # Enquiry pauses autoplay, so verify auto-selected model after observing full cycle.
    context(0,'after automatic full-cycle')
    select(1);before=read();time.sleep(8);after=read()
    record('manual selection holds paused','passed' if before['group']==after['group'] else 'failed',{'before':before,'after':after})
    navigate(True);before=read();time.sleep(8);after=read()
    record('reduced motion no autoplay','passed' if before['group']==after['group'] else 'failed',{'before':before,'after':after})
    for index in range(len(models)):
        select(index);context(index,'manual '+models[index]['id'])
    select(0)
    js("document.querySelector('.model-selector').focus()")
    cdp('Input.dispatchKeyEvent',type='keyDown',key='ArrowLeft',code='ArrowLeft',windowsVirtualKeyCode=37)
    cdp('Input.dispatchKeyEvent',type='keyUp',key='ArrowLeft',code='ArrowLeft',windowsVirtualKeyCode=37)
    context(len(models)-1,'native keyboard ArrowLeft wrap')
elif phase=='failure':
    cdp('Emulation.setDeviceMetricsOverride',width=390,height=844,deviceScaleFactor=2,mobile=False)
    for index,m in enumerate(models):
        cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*','*'+m['image']]);cdp('Network.setCacheDisabled',cacheDisabled=True)
        navigate();select(index);state=read()
        record('mobile blocked '+m['id']+' honest status','passed' if not state['loaded'] and bool(state['status']) else 'failed',state)
        context(index,'mobile failed '+m['id'])
    cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*']);cdp('Network.setCacheDisabled',cacheDisabled=False)
else:raise ValueError(phase)
print(json.dumps({'stage':stage,'phase':phase,'counts':{s:sum(r['status']==s for r in results) for s in ['passed','failed','blocked','not_run']}}))
if any(r['status']=='failed' for r in results):raise AssertionError('Carousel acceptance failed; see candidate-labelled JSON')
