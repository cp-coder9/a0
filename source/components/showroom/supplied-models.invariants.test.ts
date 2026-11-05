import {describe,it,expect} from 'vitest';
import {suppliedModels,isRenderable,suppliedPreviewEnabled} from './supplied-models';

// The build-time flag gates the URL literals, so a flag-off build carries no model URL at all.
// These invariants fail the suite if a model can be served without naming its approval record,
// or if the flag stops being a precondition of rendering.

describe('supplied model approval invariants',()=>{
 it('every entry that carries a served URL names the approval record it rests on',()=>{
  for(const entry of suppliedModels){
   if(entry.browserUrl)expect(entry.approvalRecord,`${entry.literalFilename} serves ${entry.browserUrl} with no approval record`).toBeTruthy();
  }
 });

 it('an approval record is either absent or a non-empty identifier',()=>{
  for(const entry of suppliedModels){
   if(entry.approvalRecord!==null)expect(entry.approvalRecord.trim().length,`${entry.literalFilename} has a blank approval record`).toBeGreaterThan(0);
  }
 });

 it('with the build-time flag off, no entry is renderable',()=>{
  // The test environment does not set NEXT_PUBLIC_SITRAK_PREVIEW_3D, so this reads the real
  // import-time value rather than a stubbed constant.
  expect(suppliedPreviewEnabled).toBe(false);
  for(const entry of suppliedModels)expect(isRenderable(entry),`${entry.literalFilename} renders with the flag off`).toBe(false);
 });

 it('with the flag off, no entry carries a model URL that could be emitted',()=>{
  for(const entry of suppliedModels)expect(entry.browserUrl,`${entry.literalFilename} still carries a URL with the flag off`).toBeNull();
 });

 it('only the user-supplied trucks and the engine reference name a record; the other two name none',()=>{
  const approved=suppliedModels.filter(entry=>entry.approvalRecord);
  expect(approved.map(entry=>entry.literalFilename)).toEqual(['c7h.glb','g7h.glb','g7s.glb','SITRACK_C7h_ENGINE_REFERNCE.glb']);
  for(const name of['c7_max.glb','-HOWO-T7S-6X4-TIPPER-.glb','SITRACK G7S TIPPER 6X4.glb']){
   const entry=suppliedModels.find(candidate=>candidate.literalFilename===name)!;
   expect(entry.approvalRecord,`${name} must stay unapproved`).toBeNull();
  }
 });

 it('the shipped registry still holds the seven supplied files',()=>{
  expect(suppliedModels).toHaveLength(7);
 });
});
