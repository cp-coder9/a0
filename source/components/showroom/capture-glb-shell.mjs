// Shell evidence: truthful 3D tab states + runtime compressed-format probe.
import{createRequire}from'node:module';
import{mkdir,writeFile,readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
const{chromium}=createRequire('E:/social-studio/apps/web/package.json')('playwright');
const base=process.argv[2]||'http://127.0.0.1:3100';
const stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');
const out=`E:/Sitrak-website/docs/showroom-evidence/ui/screenshots/GLB-SHELL-${stamp}`;
await mkdir(out,{recursive:true});
const sha=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
const b=await chromium.launch({channel:'msedge',headless:true});
const r={base,out,checks:[],shots:[],errors:[]};
const check=(name,pass,actual)=>r.checks.push({name,pass,actual});
try{
 const ctx=await b.newContext({viewport:{width:1440,height:1000}});const p=await ctx.newPage();p.setDefaultTimeout(120000);
 await ctx.route('**/*',q=>{const u=new URL(q.request().url());return['127.0.0.1','localhost'].includes(u.hostname)&&q.request().method()==='GET'?q.continue():q.abort()});
 p.on('pageerror',e=>r.errors.push(e.message.slice(0,200)));
 await p.goto(base+'/models/sitrak-c7h/',{waitUntil:'domcontentloaded',timeout:90000});
 await p.getByRole('button',{name:/Load 3D view/i}).waitFor({state:'visible',timeout:90000});
 await p.waitForTimeout(2000);
 r.compressedFormats=await p.evaluate(()=>{const c=document.createElement('canvas');const gl=c.getContext('webgl2')||c.getContext('webgl');if(!gl)return{webgl2:false};const names=['WEBGL_compressed_texture_s3tc','WEBGL_compressed_texture_s3tc_srgb','WEBGL_compressed_texture_astc','WEBGL_compressed_texture_etc','EXT_texture_compression_bptc'];const found={};for(const n of names)found[n]=!!gl.getExtension(n);return{webgl2:!!c.getContext('webgl2'),...found,maxTexture:gl.getParameter(gl.MAX_TEXTURE_SIZE),renderer:gl.getParameter(gl.RENDERER)}});
 await p.getByRole('button',{name:/Load 3D view/i}).click();
 const shell=p.locator('.supplied-glb');
 await shell.waitFor({state:'visible',timeout:30000});
 const text=(await shell.innerText()).replace(/\n+/g,' | ');
 check('3D tab shows an explicit unavailable state',/not yet approved|not available/i.test(text),text.slice(0,220));
 check('3D tab shows measured preflight numbers',/8192/.test(text)&&/682\.7/.test(text)&&/1.?970.?454/.test(text),text.slice(0,320));
 check('supplied model not mounted while unapproved',await p.locator('[data-testid="supplied-glb-stage"]').count()===0,await p.locator('[data-testid="supplied-glb-stage"]').count());
 check('photo path still present',await p.locator('.truck-exterior-gallery, [class*=gallery]').count()>0,await p.locator('[class*=gallery]').count());
 const shot=`${out}/c7h-3d-tab-truthful-state.png`;await shell.scrollIntoViewIfNeeded();await p.screenshot({path:shot,animations:'disabled'});r.shots.push({file:shot,sha256:await sha(shot)});
 // repeated open/close must not leak or accumulate canvases
 for(let i=0;i<5;i++){await p.getByRole('button',{name:/Hide 3D view/i}).click();await p.waitForTimeout(250);await p.getByRole('button',{name:/Load 3D view/i}).click();await p.waitForTimeout(250)}
 check('no supplied-model stage accumulates across 5 open/close cycles',await p.locator('[data-testid="supplied-glb-stage"]').count()===0,await p.locator('[data-testid="supplied-glb-stage"]').count());
 await ctx.close();
 // engine placement
 const ctx2=await b.newContext({viewport:{width:390,height:844}});const q=await ctx2.newPage();q.setDefaultTimeout(120000);
 await ctx2.route('**/*',x=>{const u=new URL(x.request().url());return['127.0.0.1','localhost'].includes(u.hostname)&&x.request().method()==='GET'?x.continue():x.abort()});
 await q.goto(base+'/models/sitrak-c7h/#specifications',{waitUntil:'domcontentloaded',timeout:90000});
 await q.waitForTimeout(3000);
 const engine=q.locator('.showroom-engine');
 await engine.waitFor({state:'visible',timeout:30000});
 const engineText=(await engine.innerText()).replace(/\n+/g,' | ');
 check('engine placement shows truthful state',/not yet approved|not available/i.test(engineText),engineText.slice(0,220));
 await engine.scrollIntoViewIfNeeded();
 const shot2=`${out}/c7h-engine-truthful-state-mobile.png`;await q.screenshot({path:shot2,animations:'disabled'});r.shots.push({file:shot2,sha256:await sha(shot2)});
 await ctx2.close();
}catch(e){r.errors.push({fatal:e.message})}
finally{await b.close()}
await writeFile(out+'/result.json',JSON.stringify(r,null,2));
console.log(JSON.stringify({out,passed:r.checks.filter(c=>c.pass).length,failed:r.checks.filter(c=>!c.pass).map(c=>c.name),compressed:r.compressedFormats,shots:r.shots.length,errors:r.errors},null,2));
if(r.checks.some(c=>!c.pass)||r.errors.length)process.exitCode=1;
