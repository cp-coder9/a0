import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {suppliedModels} from './supplied-models';

// Pinned SEMANTIC identity of the ruled restore (Brett errata 56, fix 3): a pin that flips on
// line endings is noise, and noise gets relaxed. So the pin is the LF-NORMALISED digest and the
// raw on-disk digest is recorded as an ENVIRONMENTAL attribute, checked as "must be a logged
// state" rather than as the semantic identity.
// 5,608 B CRLF == 5,553 B LF for this file: same content, 55 line-ending pairs, no code change.
const EXPECTED_REGISTRY_SHA256_LF='570eac10c960f0d6eba6d6e273cc89eedeeb377be5afe501783041971c54b722';
const REGISTRY_PATH=resolve(process.cwd(),'components/showroom/supplied-models.ts');

// Invariant: RESOLVING AN APPROVAL IS NOT BINDING TO IT.
// An entry may name an approval record, but that record only authorises the file whose bytes
// it actually covers. Brett's assertion #2: approvalRecord !== null IMPLIES the entry's sha256
// appears in that record's cover table. A record that resolves but does not name the hash is
// worse than a null, because a reader sees an authorisation that does not exist.
const RECORD_PATH='E:/Sitrak-website-assets/approvals/APPR-2026-10-29-C7H-LOOPBACK-PREVIEW.md';
// Digests the grant covers that intentionally have no registry entry. Add a line here ONLY with
// the record that explains the absence; a bare hash is a relaxed test (Brett errata 52).
const DOCUMENTED_EXCLUSIONS:Record<string,string>={};
const hasRecord=existsSync(RECORD_PATH);
const recordText=hasRecord?readFileSync(RECORD_PATH,'utf8'):'';
// Parse the "Covered artefacts" table ONLY. The document also carries version-history digests
// that are not artefacts; a blanket digest scan would demand registry entries for prose hashes.
function coveredArtifacts(text:string){
 const rows:[string,string,string][]=[];
 for(const line of text.split('\n')){
  if(!line.includes('|'))continue;
  const cells=line.split('|').map(cell=>cell.trim());
  if(cells.length<5)continue;
  const path=cells[1].replace(/`/g,'');
  const bytes=cells[2];
  const hash=cells[3].replace(/`/g,'');
  if(/^[0-9a-f]{64}$/.test(hash))rows.push([path,bytes,hash]);
 }
 return rows;
}
const artifacts=coveredArtifacts(recordText);
const covered=new Set(artifacts.map(([, ,hash])=>hash));
const coveredGlbs=artifacts.filter(([path])=>path.toLowerCase().endsWith('.glb'));

describe.skipIf(!hasRecord)('approval records bind to bytes, not to names',()=>{
 it('(0) the cover table was parsed, and it distinguishes GLBs from other digests',()=>{
  expect(covered.size).toBeGreaterThan(0);
  expect(coveredGlbs.length).toBeGreaterThan(0);
  for(const [path,bytes] of coveredGlbs)expect(bytes,`${path} has no byte count`).toMatch(/^[0-9,]+$/);
 });

 it('every entry citing an approval record has its sha256 covered by that record',()=>{
  const cited=suppliedModels.filter(model=>model.approvalRecord);
  expect(cited.length).toBeGreaterThan(0);
  const unbound=cited
   .filter(model=>!covered.has(model.sha256))
   .map(model=>`${model.literalFilename} ${model.sha256.slice(0,12)}… is authorised by a record that does not name its hash`);
  expect(unbound).toEqual([]);
 });

 it('any entry with a served URL has an approval record and a covered hash',()=>{
  const served=suppliedModels.filter(model=>model.browserUrl);
  for(const model of served){
   expect(model.approvalRecord,`${model.literalFilename} has a URL but no approval record`).toBeTruthy();
   expect(covered.has(model.sha256),`${model.literalFilename} is served but not covered by its record`).toBe(true);
  }
 });

 it('the user-designated supplied original is the hash the record covers',()=>{
  const supplied=suppliedModels.find(model=>model.literalFilename==='c7h.glb');
  expect(supplied?.sha256).toBe('36b75fcf17db57d3af9f638da68295e6450ca9d660de2c8839062abc41b68641');
  expect(covered.has(supplied!.sha256)).toBe(true);
 });

 it('(e) the registry content has not changed since the pinned restore (line-ending insensitive)',()=>{
  const raw=readFileSync(REGISTRY_PATH);
  const CR=String.fromCharCode(13);
  const LF=String.fromCharCode(10);
  const lf=Buffer.from(raw.toString('utf8').split(CR+LF).join(LF),'utf8');
  const normalised=createHash('sha256').update(lf).digest('hex');
  const rawDigest=createHash('sha256').update(raw).digest('hex');
  expect(normalised,`supplied-models.ts CONTENT changed since the pinned restore. `+
   `Expected LF-normalised ${EXPECTED_REGISTRY_SHA256_LF}, got ${normalised}. `+
   `Raw on-disk (environmental): ${rawDigest}, ${raw.length} B. `+
   `Restore from components/showroom/SUPPLIED-MODELS-WRITE-LOG.md and record the actor. `+
   `Line-ending-only differences must not be treated as content changes (errata 56).`).toBe(EXPECTED_REGISTRY_SHA256_LF);
 });

 it('(d) every covered GLB digest has a registry entry or a recorded exclusion reason',()=>{
  const registered=new Set(suppliedModels.map(model=>model.sha256));
  const orphans=coveredGlbs
   .filter(([, ,hash])=>!registered.has(hash)&&!DOCUMENTED_EXCLUSIONS[hash])
   .map(([path,bytes,hash])=>`${path} (${bytes} B) ${hash.slice(0,12)}… is covered by the grant but appears in no registry entry and has no recorded reason`);
  expect(orphans).toEqual([]);
 });
});
