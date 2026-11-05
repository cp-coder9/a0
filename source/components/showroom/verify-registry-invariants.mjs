// Framework-free registry invariant gate (Brett errata 55 §5).
// vitest does not start on this host, so the control cannot live only in the suite.
// Run from packaging or any gate: node components/showroom/verify-registry-invariants.mjs
import{readFileSync,existsSync}from'node:fs';
import{createHash}from'node:crypto';
import{fileURLToPath}from'node:url';
import{dirname,join}from'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const argPath=(process.argv.find(a=>a.startsWith('--registry='))??'').split('=')[1];
const REG=argPath?argPath:join(here,'supplied-models.ts');
const LOG=join(here,'SUPPLIED-MODELS-WRITE-LOG.md');
const RECORD='E:/Sitrak-website-assets/approvals/APPR-2026-10-29-C7H-LOOPBACK-PREVIEW.md';

const rows=[];
const check=(name,pass,detail)=>rows.push({name,pass,detail});

const bytes=readFileSync(REG);
const rawSha=createHash('sha256').update(bytes).digest('hex');
// Semantic identity is the LF-normalised digest (errata 56 fix 3): a pin that flips on line
// endings is noise, and noise gets relaxed. The raw digest is an environmental attribute and is
// asserted to be a logged state, not to equal the semantic pin.
const CRLF_PINNED_LF='570eac10c960f0d6eba6d6e273cc89eedeeb377be5afe501783041971c54b722';
const src=bytes.toString('utf8');
const lfBytes=Buffer.from(src.split(String.fromCharCode(13)+String.fromCharCode(10)).join(String.fromCharCode(10)),'utf8');
const sha=createHash('sha256').update(lfBytes).digest('hex');
const crlfPairs=src.split(String.fromCharCode(13)+String.fromCharCode(10)).length-1;


// (1) the file's identity is a LOGGED state — an unlogged variant is unattributable
const log=existsSync(LOG)?readFileSync(LOG,'utf8'):'';
check('registry content matches the pinned semantic digest (LF-normalised)',sha===CRLF_PINNED_LF,`${sha} (${lfBytes.length} B LF)`);
// PROVENANCE, not compliance: this file's log also contains non-compliant states (the 6,323 B
// entry that deleted the supplied record). Never quote this row alone as an assurance about the file.
check('raw digest matches a logged state (provenance, not compliance)',log.includes(rawSha),`${rawSha} (${bytes.length} B, ${crlfPairs} CRLF)`);
// Encoding is its own question with its own sentence: CRLF is a normalisation task, not a content change.
check('encoding: file is LF (no CRLF pairs)',crlfPairs===0,crlfPairs===0?'0 CRLF pairs (LF)':`${crlfPairs} CRLF pairs - run the normaliser; this is not a content change`);

// (2) ruled content: the supplied original is bound, the derivative is absent
// Ruled state: the C-series is retired at the user's request, so c7h.glb keeps its grant and its
// value-gated URL but is bound to no route. The check asserts the UNBIND, not the old binding.
check('c7h.glb is granted but unbound (no catalogModelId)',/literalFilename:'c7h\.glb',catalogModelId:null/.test(src),null);

// Every catalogue reference must resolve to a catalogue entry AND a real route directory.
// A reference that resolves to nothing is the defect this row exists to catch.
const catalogIds=[...src.matchAll(/literalFilename:'([^']+)',catalogModelId:'([^']+)'/g)].map(m=>[m[1],m[2]]);
const catalogSrc=existsSync(join(here,'..','..','lib','truck-catalog.ts'))?readFileSync(join(here,'..','..','lib','truck-catalog.ts'),'utf8'):'';
const danglingIds=catalogIds.filter(([,id])=>!new RegExp(`'${id}'\s*:\s*\{fullName`).test(catalogSrc)).map(([f,id])=>`${f} -> catalogue has no '${id}'`);
const danglingRoutes=catalogIds.filter(([,id])=>!existsSync(join(here,'..','..','app','models',id))).map(([f,id])=>`${f} -> no route app/models/${id}`);
check('every catalogModelId resolves to a catalogue entry and a route directory',danglingIds.length===0&&danglingRoutes.length===0,
  `cited=${catalogIds.length} catalogue_missing=[${danglingIds.join('; ')}] route_missing=[${danglingRoutes.join('; ')}]`);
check('derivative entry absent',!/literalFilename:'c7h-main-range\.glb'/.test(src),null);
const entries=[...src.matchAll(/literalFilename:'([^']+)'/g)].map(m=>m[1]);
check('seven supplied entries (c7h, g7h, g7s, c7_max, T7S, G7S tipper, engine)',entries.length===7,entries.join(', '));

// (3) the emission gate is the composed constant, not the raw flag
const rawGates=(src.match(/browserUrl:PREVIEW_REQUESTED/g)??[]).length;
const valueGates=(src.match(/browserUrl:suppliedPreviewEnabled/g)??[]).length;
check('no browserUrl gated on the raw flag',rawGates===0,`raw=${rawGates}`);
check('served URLs gated on suppliedPreviewEnabled',valueGates===4,`valueGates=${valueGates}`);
check('isRenderable guarded by the composed switch',/if\(!suppliedPreviewEnabled\)return false;/.test(src),null);

// (4) approval binding: a cited record must cover that entry's bytes
const covered=new Set();
const coverRows=[];
if(existsSync(RECORD)){
 for(const line of readFileSync(RECORD,'utf8').split('\n')){
  if(!line.includes('|'))continue;
  const cells=line.split('|').map(c=>c.trim());
  if(cells.length<5)continue;
  const hash=cells[3].replace(/`/g,'');
  if(/^[0-9a-f]{64}$/.test(hash)){covered.add(hash);coverRows.push([cells[1].replace(/`/g,''),cells[2],hash]);}
 }
}
const cited=[...src.matchAll(/literalFilename:'([^']+)'.*?sha256:'([0-9a-f]{64})'.*?approvalRecord:([^,]+),/g)]
 .filter(m=>m[3].trim()!=='null').map(m=>[m[1],m[2]]);
check('every cited approval record covers its entry',cited.every(([,h])=>covered.has(h)),cited.map(([n,h])=>`${n}:${covered.has(h)?'covered':'UNBOUND'}`).join(', '));


// (5) the granted files are actually present with the recorded bytes and hashes. A gate that only
// checks the registry would pass while the served files were missing — or while quarantined ones
// had not yet returned (Leo, 31 Oct).
{
 const served=coverRows.filter(([p])=>p.startsWith('public/models/'));
 const missing=[],mismatched=[];
 for(const [rel,bytes,hash] of served){
  const abs=join(here,'..','..',rel);
  if(!existsSync(abs)){missing.push(rel);continue}
  const buf=readFileSync(abs);
  if(buf.length!==Number(String(bytes).replace(/[^0-9]/g,''))||createHash('sha256').update(buf).digest('hex')!==hash)mismatched.push(rel);
 }
 check('every granted file is served with the recorded bytes and hash',missing.length===0&&mismatched.length===0,
   `served=${served.length} missing=${missing.join(',')||'none'} mismatched=${mismatched.join(',')||'none'}`);
}


// (6) the registry PARSES and exports its array. A textual scan passed a file whose string was
// unterminated; only the compiler noticed, so the gate asks the runtime to import it.
{
 let parseError=null;
 try{
  const mod=await import(new URL('./supplied-models.ts',import.meta.url).href);
  if(!Array.isArray(mod.suppliedModels))parseError='no suppliedModels export';
 }catch(e){parseError=String(e.message).split(String.fromCharCode(10))[0];}
 check('registry parses and exports suppliedModels',parseError===null,parseError===null?'parsed':parseError);
}

const failed=rows.filter(r=>!r.pass);
console.log(JSON.stringify({registry:REG,bytesOnDisk:bytes.length,crlfPairs,semanticSha256:sha,rawSha256:rawSha,rows,verdict:failed.length?'FAIL':'PASS'},null,2));
if(failed.length)process.exit(1);
