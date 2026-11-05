// Two-artefact proof for the build-time 3D preview switch (Leo D-23 / errata 20 §2).
// Usage: node components/showroom/verify-preview-build.mjs <buildDir> <switch-off|switch-on>
// Greps the emitted output for served model URLs. A URL string must be ABSENT in switch-off
// and PRESENT in switch-on. An empty grep against a missing tree is a false negative, so the
// build directory and BUILD_ID are required and their absence fails the run.
import{readdir,readFile,stat,writeFile}from'node:fs/promises';
import{join,extname}from'node:path';
import{createHash}from'node:crypto';

const [dir,mode]=process.argv.slice(2);
const fail=msg=>{console.error('FAIL: '+msg);process.exit(1)};
if(!dir||!mode)fail('need <buildDir> <switch-off|switch-on>');
if(!['switch-off','switch-on'].includes(mode))fail('mode must be switch-off or switch-on');

try{await stat(dir)}catch{fail(`build dir does not exist: ${dir} (empty grep against a missing tree is not a pass)`)}

let buildId=null;
try{buildId=(await readFile(join(dir,'BUILD_ID'),'utf8')).trim()}catch{fail(`no BUILD_ID in ${dir} - cannot name this artefact`)}

const files=[];
async function walk(d){
 for(const entry of await readdir(d,{withFileTypes:true})){
  const p=join(d,entry.name);
  if(entry.isDirectory())await walk(p);
  else if(['.js','.mjs','.json','.html','.rsc','.txt','.css','.map'].includes(extname(entry.name)))files.push(p);
 }
}
await walk(dir);

const hits=[];
const leakedSource=[];
const inlineMaps=[];
for(const f of files){
 const text=await readFile(f,'utf8');
 if(/\/models\/[A-Za-z0-9._-]+\.glb/.test(text))hits.push(f);
 // Brett errata 51: a *.map filename rule does not cover the inline form, and shipped maps
 // must not carry original source at all.
 if(/sourceMappingURL=data:application\/json/.test(text))inlineMaps.push(f);
 if(/"sourcesContent"\s*:\s*\[/.test(text)&&/\.map$/.test(f))leakedSource.push(f);
}
const mapFiles=files.filter(f=>/\.map$/.test(f));
const found=hits.length>0;
const ok=mode==='switch-off'?!found:found;
const result={
  rule:'switch-off: no /models/*.glb string in any emitted file; switch-on: the string must be present',
  buildDir:dir,buildId,mode,
  population:{filesScanned:files.length,extensions:['.js','.mjs','.json','.html','.rsc','.txt','.css','.map'],sourceMaps:mapFiles.length},
  modelUrlStrings:found,hitFiles:hits,
  sourceMapFindings:{inlineSourceMappingURL:inlineMaps,mapsWithSourcesContent:leakedSource},
  knownInnocent:['/models/sitrak-c7h route hrefs','three.js loader test literals','docs references outside the build'],
  verdict:(ok&&inlineMaps.length===0&&leakedSource.length===0)?'PASS':'FAIL',
};
await writeFile(join(dir,`PREVIEW-PROOF-${mode}.json`),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(!ok)process.exit(1);
