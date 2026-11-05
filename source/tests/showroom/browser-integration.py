"""Additional actual-browser integration checks, executed by Browser Use helpers.
Never submits enquiries. Non-GET fetch is denied and /api/enquiries is CDP-blocked.
"""
from pathlib import Path
import json,time,datetime
OUT=Path('E:/Sitrak-website/docs/showroom-evidence/qa')
results=[]
cdp('Network.enable');cdp('Network.setBlockedURLs',urls=['*://*/api/enquiries*'])
script=cdp('Page.addScriptToEvaluateOnNewDocument',source="""
window.__qaAudit={errors:[],consoleErrors:[],deniedWrites:[]};
addEventListener('error',e=>window.__qaAudit.errors.push(e.message));
addEventListener('unhandledrejection',e=>window.__qaAudit.errors.push(String(e.reason)));
const old=console.error;console.error=(...a)=>{window.__qaAudit.consoleErrors.push(a.map(String).join(' '));old(...a)};
const realFetch=window.fetch.bind(window);window.fetch=(url,opts={})=>{const method=String(opts.method||url?.method||'GET').toUpperCase();if(!['GET','HEAD','OPTIONS'].includes(method)){window.__qaAudit.deniedWrites.push({url:String(url),method});return Promise.reject(new Error('QA safety: writes denied'))}return realFetch(url,opts)};
""")['identifier']
def record(name,ok,actual):
    results.append({'name':name,'status':'passed' if ok else 'failed','actual':actual})
    OUT.joinpath('browser-integration.json').write_text(json.dumps({'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'userAgent':js('navigator.userAgent'),'results':results},indent=2),encoding='utf-8')
try:
    for width,height,label in [(1440,1000,'desktop'),(820,1180,'tablet'),(390,844,'mobile')]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=height,deviceScaleFactor=1,mobile=False)
        goto_url('http://localhost:3100/');wait_for_load();time.sleep(.7)
        js("document.querySelector('a[aria-label=\"Explore SITRAK C7H\"]').click()")
        wait_for_load();time.sleep(.7)
        record(label+' home Explore link reaches C7H',js("location.pathname.replace(/\\/$/,'')==='/models/sitrak-c7h'&&!!document.querySelector('.c7h-showroom')"),js('({url:location.href})'))
        for mode in ['cabin','specifications','exterior']:
            js(f"document.querySelector('.showroom-view-tabs a[href=\"#{mode}\"]').click()")
            record(label+' tab '+mode,js(f"location.hash==='#{mode}'&&document.querySelector('.c7h-view-main')?.getAttribute('aria-label')==='{mode} view'"),js('({hash:location.hash})'))
        js("document.querySelector('.showroom-view-tabs a[href=\"#specifications\"]').focus()")
        cdp('Input.dispatchKeyEvent',type='keyDown',key='Enter',code='Enter',windowsVirtualKeyCode=13)
        cdp('Input.dispatchKeyEvent',type='keyUp',key='Enter',code='Enter',windowsVirtualKeyCode=13)
        record(label+' native Enter activates Specifications',js("location.hash==='#specifications'&&!!document.querySelector('.spec-table')"),{})
        cdp('Page.reload');wait_for_load();time.sleep(.7)
        record(label+' reload retains Specifications',js("location.hash==='#specifications'&&!!document.querySelector('.spec-table')"),{})
        js("document.querySelector('.c7h-heading-actions button').focus();document.querySelector('.c7h-heading-actions button').click()")
        data=js("({model:document.querySelector('select[name=model]')?.value,dialog:!!document.querySelector('[role=dialog]')})")
        record(label+' enquiry prefill no-submit',data['model']=='SITRAK C7H' and data['dialog'],data)
        cdp('Input.dispatchKeyEvent',type='keyDown',key='Escape',code='Escape',windowsVirtualKeyCode=27)
        cdp('Input.dispatchKeyEvent',type='keyUp',key='Escape',code='Escape',windowsVirtualKeyCode=27)
        record(label+' Escape closes and restores trigger focus',js("!document.querySelector('[role=dialog]')&&document.activeElement===document.querySelector('.c7h-heading-actions button')"),{})
        audit=js('window.__qaAudit')
        record(label+' post-reload journey no JS errors or attempted writes',bool(audit) and not audit['errors'] and not audit['consoleErrors'] and not audit['deniedWrites'],audit)
        js("document.querySelector('.c7h-model-aside a').click()")
        wait_for_load();time.sleep(.7)
        record(label+' Compare returns to range anchor',js("location.pathname==='/'&&location.hash==='#the-range'&&!!document.querySelector('#the-range')"),js('({url:location.href})'))
finally:
    cdp('Page.removeScriptToEvaluateOnNewDocument',identifier=script)
print(json.dumps({'counts':{s:sum(r['status']==s for r in results) for s in ['passed','failed']},'checks':[{'name':r['name'],'status':r['status']} for r in results]},indent=2))
