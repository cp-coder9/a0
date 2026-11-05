// Independent QA execution in a real isolated Edge context during an explicit owner hold.
import {createRequire} from 'node:module';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
process.env.TMPDIR=process.env.TEMP=process.env.TMP='C:/Users/greg/AppData/Local/hermes/profiles/tess/cache/scratch';
const {chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright'); // Existing installed driver only; no Social source work/install.
const ROOT='E:/Sitrak-website',BASE='http://127.0.0.1:3100';
const hold=JSON.parse(await readFile(`${ROOT}/docs/showroom-evidence/ui/SSIT-CURRENT-PARTIAL-HOLD.json`,'utf8'));
const OUT=`${ROOT}/docs/showroom-evidence/qa/held-${hold.candidate_sha256.slice(0,8)}`;
await mkdir(OUT,{recursive:true});const results=[],identities=[],errors=[],network=[],screenshots=[];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function filesUnder(dir){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await filesUnder(full));else if(entry.isFile())out.push(full);}return out;}
async function fingerprint(label){
 const now=new Date();if(now<new Date(hold.start_utc)||now>=new Date(hold.end_utc))throw Error('BLOCKED: outside owner hold '+now.toISOString());
 let files=[];for(const name of ['app','components','lib','public'])files.push(...await filesUnder(path.join(ROOT,name)));
 for(const name of ['package.json','package-lock.json','next.config.ts','next.config.mjs','tsconfig.json','vitest.config.ts','AGENTS.md']){try{await readFile(path.join(ROOT,name));files.push(path.join(ROOT,name));}catch(e){if(e.code!=='ENOENT')throw e;}}
 const map={};for(const file of files.sort())map[path.relative(ROOT,file).split(path.sep).join('/')]=sha(await readFile(file));
 const sorted=Object.fromEntries(Object.entries(map).sort(([a],[b])=>a<b?-1:a>b?1:0));
 // Python's source-identity uses ensure_ascii=True; preserve its exact encoding.
 const encoded=JSON.stringify(sorted).replace(/[\u0080-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
 const digest=sha(encoded);identities.push({label,utc:now.toISOString(),sha256:digest,count:files.length});
 if(digest!==hold.candidate_sha256||Object.keys(sorted).length!==Object.keys(hold.files).length||Object.entries(sorted).some(([p,h])=>hold.files[p]!==h))throw Error('BLOCKED: owner map mismatch '+digest);
}
const check=(name,ok,actual)=>results.push({name,status:ok?'passed':'failed',actual});
const versioned={};for(const file of await filesUnder(`${ROOT}/tests/showroom`))versioned[path.relative(ROOT,file).split(path.sep).join('/')]=sha(await readFile(file));
async function save(){await writeFile(`${OUT}/result.json`,JSON.stringify({hold,identities,qaInputs:versioned,results,errors,network,screenshots,utc:new Date().toISOString(),scope:'partial geometry/current owned copy/main cabin event failure omission-retry; not final GLB/quality/rights acceptance'},null,2));}
async function contextFor(label,{noGPU=false,blockImage=false,viewport={width:1440,height:1000}}={}){
 const context=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});const state={blockImage};
 await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());const allowed=['localhost','127.0.0.1'].includes(url.hostname)&&req.method()==='GET'&&!url.pathname.startsWith('/api/enquiries');
 if(!allowed){network.push({label,url:req.url(),method:req.method(),blocked:true});return route.abort();}
 if(state.blockImage&&url.pathname==='/assets/panoramas/sitrak-c7h-interior-panorama.jpg'){network.push({label,url:req.url(),blockedPrimary:true});return route.abort();}return route.continue();});
 if(noGPU)await context.addInitScript(()=>{Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true});const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:original.call(this,type,...args);};});
 const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push({label,message:e.message}));return{context,page,state};
}
async function goto(page,suffix){try{await page.goto(BASE+suffix,{waitUntil:'domcontentloaded',timeout:20000});await page.evaluate(()=>document.fonts.ready);}catch(error){error.qaEnvironmentBlocked=true;throw error;}}
async function shot(page,label){const file=`${OUT}/${label}.png`;await page.screenshot({path:file,fullPage:false,animations:'disabled',timeout:10000});screenshots.push({file,label,utc:new Date().toISOString(),sha256:sha(await readFile(file))});}
async function enquiry(page,label){await page.getByRole('button',{name:'Enquire about this C7H',exact:true}).click();const value=await page.getByRole('combobox',{name:'Truck',exact:true}).inputValue();check(label+' enquiry prefilled/no submission',value==='SITRAK C7H',{model:value});await page.keyboard.press('Escape');check(label+' Escape closed',await page.getByRole('dialog').count()===0,{});}
await fingerprint('start');let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const[label,width,height]of[['desktop',1440,1000],['tablet',820,1180],['mobile',390,844]]){
  await fingerprint(label+' geometry before');const{context,page}=await contextFor(label,{viewport:{width,height}});
  try{
   await goto(page,'/');await page.evaluate(()=>scrollTo(0,0));
   const hero=await page.evaluate(()=>{const e=document.querySelector('#top.hero'),r=e?.getBoundingClientRect(),image=e?.querySelector('.hero-image.is-active');return{first:document.querySelector('main')?.firstElementChild?.id,scrollY,box:r?{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}:null,loaded:!!image&&image.complete&&image.naturalWidth>0,rangeCount:document.querySelectorAll('#the-range').length};});
   check(label+' current hero placement/loaded image regression',hero.first==='top'&&hero.scrollY===0&&hero.box?.height>0&&hero.box.y<height&&hero.box.bottom>0&&hero.loaded&&hero.rangeCount===1,hero);await shot(page,label+'-top');
   for(const variable of[false,true]){
    if(variable)await page.locator('.showroom-range-card').nth(1).evaluate(c=>{c.querySelector('h2').textContent='HOWO 7 — Synthetic extended construction application model';c.querySelector('.showroom-range-copy>.eyebrow').textContent='Synthetic configuration with variable line length for responsive testing';c.querySelector('.showroom-range-copy>p:not(.eyebrow)').textContent='Synthetic long specification text for wrapping only, regional construction applications and challenging routes with all content retained.';});
    const data=await page.evaluate(()=>{const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};return{width:innerWidth,documentWidth:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('.showroom-range-card')].map(c=>({card:box(c),image:box(c.querySelector('.showroom-range-image')),copy:box(c.querySelector('.showroom-range-copy')),title:box(c.querySelector('h2')),description:box(c.querySelector('.showroom-range-copy>p:not(.eyebrow)')),actions:box(c.querySelector('.showroom-range-actions')),controls:[...c.querySelectorAll('.showroom-range-actions>a,.showroom-range-actions>button')].map(box)}))};});
    const rows=[];for(const c of data.cards){let r=rows.find(r=>Math.abs(r[0].card.y-c.card.y)<=2);if(r)r.push(c);else rows.push([c]);}const misaligned=[];
    for(const row of rows)if(row.length>1)for(const[part,edge]of[['image','bottom'],['title','y'],['description','y'],['actions','y'],['card','bottom']]){const a=row.map(c=>c[part][edge]);if(Math.max(...a)-Math.min(...a)>2)misaligned.push({part,edge,delta:Math.max(...a)-Math.min(...a)});}
    const outside=(b,c)=>b.x<c.x-2||b.right>c.right+2||b.y<c.y-2||b.bottom>c.bottom+2;
    const containment=data.cards.every(c=>['image','copy','title','description','actions'].every(k=>!outside(c[k],c.card))&&c.controls.every(b=>!outside(b,c.card))&&c.description.bottom<=c.actions.y+2);
    check(label+(variable?' variable':' baseline')+' row alignment and all frame/copy/control containment',data.cards.length===3&&misaligned.length===0&&containment&&data.documentWidth<=width,{data,misaligned,containment,tolerance:2,mobile:'single column containment, not cross-row y equality'});
   }
   const copy=await page.evaluate(()=>({engineering:document.querySelector('#the-engineering')?.textContent,service:document.querySelector('#backed-by-service')?.textContent,range:document.querySelector('.showroom-range-note')?.textContent,sequence:document.querySelector('#the-range')?.dataset.screenLabel}));
   check(label+' current qualified technical/neutral range copy',copy.engineering.includes('Exact local build is unverified')&&copy.engineering.includes('exact local fitment is unverified')&&!/homologated/i.test(copy.engineering)&&copy.service.includes('eligible models and applicable terms')&&copy.range==='Confirm specifications with the dealership. Supporting range: Locatelli crane trucks.'&&copy.sequence==='02 The range',copy);
   await page.locator('#the-range').scrollIntoViewIfNeeded();await shot(page,label+'-range-synthetic');
  }catch(e){if(e.qaEnvironmentBlocked){results.push({name:label+' navigation',status:'blocked',actual:{error:e.message}});await save();throw e;}check(label+' execution completed',false,{error:e.message});}finally{await context.close();await fingerprint(label+' geometry after');await save();}
 }
 for(const[label,width,height]of[['desktop',1440,1000],['mobile',390,844]])for(const mode of['normal','noGPU','image-failure']){
  await fingerprint(label+' '+mode+' before');const{context,page,state}=await contextFor(label+' '+mode,{viewport:{width,height},noGPU:mode==='noGPU',blockImage:mode==='image-failure'});
  try{
   await goto(page,'/models/sitrak-c7h/#cabin');
   if(mode==='image-failure'){
    await page.getByRole('button',{name:'Retry cabin view',exact:true}).waitFor({state:'visible'});
    const data=await page.evaluate(()=>({status:[...document.querySelectorAll('[role=status]')].map(e=>e.textContent),region:!!document.querySelector('.cabin-panorama-surface'),archive:!!document.querySelector('img[src="/assets/references/c7h-cockpit.webp"]')}));
    check(label+' primary source denied→honest error/no wrong archive',data.status.includes('Cabin view unavailable. Retry or continue to specifications.')&&!data.region&&!data.archive,data);
    state.blockImage=false;await page.getByRole('button',{name:'Retry cabin view',exact:true}).click();
   }
   const region=page.getByRole('region',{name:'Interactive SITRAK C7H cabin panorama',exact:true});await region.waitFor({state:'visible'});
   await page.waitForFunction(()=>{const i=document.querySelector('.cabin-panorama-surface img');return!!i&&i.complete&&i.naturalWidth>0;},{},{timeout:8000});
   const data=await page.evaluate(()=>({poster:!!document.querySelector('.showroom-cabin-main .showroom-poster'),gate:[...document.querySelectorAll('button')].some(e=>e.textContent==='Load optional cabin panorama'),src:document.querySelector('.cabin-panorama-surface img')?.getAttribute('src'),renderer:document.querySelector('.cabin-panorama-surface')?.dataset.renderer}));
   check(label+' '+mode+' main decoded panorama/no static gate',!data.poster&&!data.gate&&data.src==='/assets/panoramas/sitrak-c7h-interior-panorama.jpg',data);
   if(mode==='noGPU'){await page.getByText('360° graphics are unavailable in this browser. Showing the supplied still image instead.',{exact:true}).waitFor();check(label+' noGPU still inside primary viewer',await region.getAttribute('data-renderer')==='unavailable',{});}
   await region.focus();await page.keyboard.press('ArrowRight');check(label+' '+mode+' actual keyboard pan',await region.getAttribute('data-yaw')==='15',{yaw:await region.getAttribute('data-yaw')});await page.getByRole('button',{name:'Reset panorama',exact:true}).click();
   await enquiry(page,label+' '+mode);await shot(page,label+'-cabin-'+mode);
   await page.getByRole('link',{name:'Specifications',exact:true}).click();check(label+' '+mode+' specifications retained',await page.getByRole('cell',{name:'80 T GCM',exact:true}).isVisible(),{});
  }catch(e){if(e.qaEnvironmentBlocked){results.push({name:label+' '+mode+' navigation',status:'blocked',actual:{error:e.message}});await save();throw e;}check(label+' '+mode+' execution completed',false,{error:e.message});}finally{await context.close();await fingerprint(label+' '+mode+' after');await save();}
 }
 check('no page errors',errors.length===0,errors);check('no non-GET/API requests attempted',network.every(e=>e.blockedPrimary),network);
}finally{if(browser)await browser.close();await fingerprint('end');await save();}
console.log(JSON.stringify({out:OUT,counts:{passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length},errors,utc:new Date().toISOString()},null,2));
if(results.some(r=>r.status==='failed'))process.exitCode=1;
