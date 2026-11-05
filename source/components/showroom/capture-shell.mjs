
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
 const ctx=await b.newContext({viewport:{width:1440,height:1000}});const p=await ctx.newPage();p.setDefaultTimeout(180000);
 await ctx.route('**/*',q=>{const u=new URL(q.request().url());return['127.0.0.1','localhost'].includes(u.hostname)&&q.request().method()==='GET'?q.continue():q.abort()});
 p.on('pageerror',e=>r.errors.push(e.message.slice(0,200)));
 await p.goto(base+'/models/sitrak-c7h/',{waitUntil:'domcontentloaded',timeout:120000});
 await p.getByRole('button',{name:/Load 3D view/i}).waitFor({state:'visible',timeout:120000});
 await p.waitForTimeout(2000);
 r.compressedFormats=await p.evaluate(()=>{const c=document.createElement('canvas');const gl=c.getContext('webgl2')||c.getContext('webgl');if(!gl)return{webgl2:false};const n=['WEBGL_compressed_texture_s3tc','WEBGL_compressed_texture_s3tc_srgb','WEBGL_compressed_texture_astc','WEBGL_compressed_texture_etc','EXT_texture_compression_bptc'];const f={};for(const x of n)f[x]=!!gl.getExtension(x);return{webgl2:!!c.getContext('webgl2'),...f,maxTexture:gl.getParameter(gl.MAX_TEXTURE_SIZE)}});
 await p.getByRole('button',{name:/Load 3D view/i}).click();
 await p.waitForFunction(()=>{const t=document.querySelector('.c7h-view-main');return t&&/schematic guide|supplied 3D model is not yet approved/i.test(t.innerText)},{timeout:180000});
 const text=(await p.locator('.c7h-view-main').innerText()).replace(/\n+/g,' | ');
 check('truck tab states the supplied model is not displayed',/schematic guide/i.test(text),text.slice(0,260));
 check('truck tab reports measured preflight',/8192/.test(text)&&/682\.7/.test(text),text.slice(0,320));
 check('no supplied-model stage while unapproved',await p.locator('[data-testid="supplied-glb-stage"]').count()===0,await p.locator('[data-testid="supplied-glb-stage"]').count());
 check('photo gallery still reachable',await p.locator('[class*=gallery]').count()>0,await p.locator('[class*=gallery]').count());
 await p.locator('.c7h-view-main').scrollIntoViewIfNeeded();
 const s1=`${out}/c7h-3d-tab-truthful-state.png`;await p.screenshot({path:s1,animations:'disabled'});r.shots.push({file:s1,sha256:await sha(s1)});
 for(let i=0;i<5;i++){await p.getByRole('button',{name:/Hide 3D view/i}).click();await p.waitForTimeout(300);await p.getByRole('button',{name:/Load 3D view/i}).click();await p.waitForTimeout(300)}
 check('no stage accumulation over 5 open/close cycles',await p.locator('[data-testid="supplied-glb-stage"]').count()===0,await p.locator('[data-testid="supplied-glb-stage"]').count());
 await ctx.close();
 const ctx2=await b.newContext({viewport:{width:390,height:844}});const q=await ctx2.newPage();q.setDefaultTimeout(180000);
 await ctx2.route('**/*',x=>{const u=new URL(x.request().url());return['127.0.0.1','localhost'].includes(u.hostname)&&x.request().method()==='GET'?x.continue():x.abort()});
 await q.goto(base+'/models/sitrak-c7h/#specifications',{waitUntil:'domcontentloaded',timeout:120000});
 await q.locator('.showroom-engine').waitFor({state:'visible',timeout:120000});
 await q.waitForTimeout(1500);
 const et=(await q.locator('.showroom-engine').innerText()).replace(/\n+/g,' | ');
 check('engine placement states it is not yet approved',/not yet approved|not available/i.test(et),et.slice(0,260));
 check('engine placement reports measured preflight',/8192/.test(et)&&/1982476|1.?982.?476/.test(et),et.slice(0,320));
 await q.locator('.showroom-engine').scrollIntoViewIfNeeded();
 const s2=`${out}/c7h-engine-truthful-state-mobile.png`;await q.screenshot({path:s2,animations:'disabled'});r.shots.push({file:s2,sha256:await sha(s2)});
 await ctx2.close();
}catch(e){r.errors.push({fatal:e.message})}
finally{await b.close()}
await writeFile(out+'/result.json',JSON.stringify(r,null,2));
console.log(JSON.stringify({out,passed:r.checks.filter(c=>c.pass).length,failed:r.checks.filter(c=>!c.pass).map(c=>c.name),compressed:r.compressedFormats,shots:r.shots.length,errors:r.errors.slice(0,3)},null,2));
if(r.checks.some(c=>!c.pass)||r.errors.length)process.exitCode=1;
