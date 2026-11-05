'use client';
import {useEffect,useRef,useState} from 'react';
import {isRenderable,suppliedModelFor,type SuppliedModelEntry} from './supplied-models';
import type {LoadMetrics} from './glb-loader';
import './supplied-glb-viewer.css';

export type LoadedModel={dispose:()=>void;triangles:number;zoomBy?:(factor:number)=>void;resetView?:()=>void};
export type ModelLoader=(url:string,onProgress:(fraction:number)=>void,host:HTMLElement,onMetrics?:(metrics:LoadMetrics)=>void,onContextLost?:()=>void,signal?:AbortSignal)=>Promise<LoadedModel>;

type State={status:'idle'|'loading'|'ready'|'failed'|'lost'|'cancelled';detail?:string;code?:string};

// Lazy import keeps the Three.js bundle off the page until an approved model is shown.
const defaultLoader:ModelLoader=async(url,onProgress,host,onMetrics,onContextLost,signal)=>{
 const {loadSuppliedGlb}=await import('./glb-loader');
 const model=await loadSuppliedGlb(url,onProgress,host,onMetrics,onContextLost,signal);
 return{triangles:model.triangles,dispose:model.dispose};
};

// D2: one model resident at a time. A new viewer disposes whichever held the slot.
let resident:{release:()=>void}|null=null;

export function SuppliedGlbViewer({modelId,modelName,entry,loadModel=defaultLoader}:{modelId:string;modelName:string;entry?:SuppliedModelEntry|null;loadModel?:ModelLoader}){
 const resolved=entry===undefined?suppliedModelFor(modelId):entry;
 const [state,setState]=useState<State>({status:'idle'});
 const [attempt,setAttempt]=useState(0);
 const [progress,setProgress]=useState<number|null>(null);
 const [metrics,setMetrics]=useState<LoadMetrics|null>(null);
 const stage=useRef<HTMLDivElement>(null);
 const active=isRenderable(resolved)?resolved:null;
 const url=active?.browserUrl??null;
 const [nonce,setNonce]=useState(0);
 const cancelRef=useRef(false);
 const controllerRef=useRef<AbortController|null>(null);
 const modelRef=useRef<LoadedModel|null>(null);

 useEffect(()=>{
  if(!url||!stage.current)return;
  let cancelled=false;let loaded:LoadedModel|null=null;
  const controller=new AbortController();
  controllerRef.current=controller;
  cancelRef.current=false;
  resident?.release();
  const holder={release:()=>{cancelled=true}};
  resident=holder;
  setState({status:'loading'});setProgress(null);setMetrics(null);
  loadModel(url,f=>{if(!cancelled)setProgress(f)},stage.current,m=>{if(!cancelled)setMetrics(m)},()=>{if(!cancelled){setState({status:'lost'});setMetrics(null)}},controller.signal)
   .then(model=>{
    if(cancelled||cancelRef.current){model.dispose();setState({status:'cancelled',detail:'Loading was cancelled.'});return}
    if(resident!==holder){model.dispose();return}
    loaded=model;modelRef.current=model;setState({status:'ready'})
   })
   .catch((error:unknown)=>{
    const code=typeof error==='object'&&error!==null&&'code'in error?String((error as {code?:unknown}).code):undefined;
    if(code==='no-gpu'){setState({status:'failed',code,detail:'This browser cannot create a WebGL context, so the 3D view cannot be shown.'});return}
    if(code==='uncompressed-fallback'){
     setState({status:'failed',code,detail:'This device offers no compressed texture format, so the model would have to be decompressed in full to memory. Loading is refused rather than risking the tab.'});
     return;
    }
    if(cancelled)return;
    if(cancelRef.current){setState({status:'cancelled',detail:'Loading was cancelled.'});return}
    setState({status:'failed',detail:error instanceof Error?error.message:'The 3D model could not load.'})
   });
  return()=>{cancelled=true;controller.abort();if(resident===holder)resident=null;modelRef.current=null;loaded?.dispose()};
 },[url,loadModel,attempt,nonce]);

 const cancel=()=>{cancelRef.current=true;controllerRef.current?.abort();resident?.release();resident=null;setProgress(null);setState({status:'cancelled',detail:'Loading was cancelled.'})};

 // Claims accuracy: identity must not be asserted in the accessible name beyond the evidence.
 // The three the user designated in their own words keep their names. `c7h.glb` was never
 // confirmed by the user — the registry records it as filename-candidate-only — so it is
 // described neutrally rather than as the C7H.
 const identityConfirmed=resolved?.literalFilename!=='c7h.glb';
 const accessibleModelName=identityConfirmed?`${modelName} interactive 3D model`:'supplied 3D model';
 const accessibleControlsName=identityConfirmed?`${modelName} 3D controls`:'3D model controls';

 if(!active){
  const reason=resolved?`${modelName}: the supplied 3D model is not available yet — its texture derivative has not been delivered, so nothing is displayed rather than a stand-in.`:`No matching supplied model is available for ${modelName}.`;
  return <div className="supplied-glb"><p className="supplied-glb-status" role="status">{reason} The photographs and specifications remain available.</p>
   {resolved?.measured&&<div className="supplied-glb-measured"><p>Measured preflight on the supplied file: {resolved.measured.textureDims} textures ≈ {resolved.measured.decodedMiB} MiB decoded, {resolved.measured.withMipsMiB} MiB with mipmaps; {resolved.measured.triangles.toLocaleString()} triangles. Loading stays disabled until a texture delivery format is approved.</p></div>}
  </div>;
 }
 return <div className="supplied-glb">
  <div className="supplied-glb-stage" data-testid="supplied-glb-stage" ref={stage} role="img" aria-label={accessibleModelName} aria-busy={state.status==='loading'}/>
  {state.status==='loading'&&<p className="supplied-glb-status" role="status">Loading 3D model{progress!==null?` — ${Math.round(progress*100)}%`:''}…</p>}
  {state.status==='ready'&&<p className="supplied-glb-status">Loaded 3D model{metrics?` · ${metrics.triangles.toLocaleString()} triangles · ${metrics.fps} fps · first frame ${Math.round(metrics.firstFrameMs)} ms`:''} · drag to orbit · scroll or pinch to zoom</p>}
  {state.status==='loading'&&<p className="supplied-glb-cancel-note" role="status">Loading cannot be cancelled — close the 3D view to stop it. The download ends on its own.</p>}
  {(state.status==='failed'||state.status==='lost'||state.status==='cancelled')&&<div className="supplied-glb-status"><p role="status">{state.status==='lost'?'The 3D graphics context was lost. The photographs and specifications remain available.':state.status==='cancelled'?'3D loading cancelled. The photographs and specifications remain available.':state.code==='uncompressed-fallback'?'3D view refused on this device. The photographs and specifications remain available.':'The 3D model could not load. The photographs and specifications remain available.'}</p>{state.detail&&<p className="supplied-glb-detail">{state.detail}</p>}<button type="button" className="button ghost" onClick={()=>setAttempt(value=>value+1)}>Retry 3D model</button></div>}
  <div className="supplied-glb-controls" aria-label={accessibleControlsName}>
   <button type="button" aria-label="Zoom in on the supplied model" onClick={()=>modelRef.current?.zoomBy?.(0.8)} disabled={state.status!=='ready'}>Zoom +</button>
   <button type="button" aria-label="Zoom out of the supplied model" onClick={()=>modelRef.current?.zoomBy?.(1.25)} disabled={state.status!=='ready'}>Zoom −</button>
   <button type="button" aria-label="Reset view" onClick={()=>modelRef.current?.resetView?.()} disabled={state.status!=='ready'}>Reset camera</button>
  </div>
  <p className="supplied-glb-note">Drag to orbit. Only controls supported by the supplied model are shown.</p>
 </div>;
}
