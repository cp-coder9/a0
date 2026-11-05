'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {derivativeFor,pickDerivativeModel,type DerivativeKey,type NetworkHint} from './model-derivatives';
import type {LoadMetrics} from './glb-loader';
import './truck-model-3d.css';

type Status='idle'|'loading'|'ready'|'failed';
type Loaded={dispose:()=>void;triangles:number;zoomBy?:(factor:number)=>void;resetView?:()=>void};

// One model resident at a time: a second viewer releases the first.
let resident:{release:()=>void}|null=null;

function networkHint():NetworkHint{
 const connection=(navigator as unknown as {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 return {saveData:connection?.saveData,effectiveType:connection?.effectiveType,maxTouchPoints:navigator.maxTouchPoints};
}

export function TruckModel3D({derivativeKey,modelName,compact=false}:{derivativeKey:DerivativeKey|string;modelName:string;compact?:boolean}){
 const derivative=derivativeFor(derivativeKey);
 const [source,setSource]=useState<{url:string;variant:'desktop'|'mobile'}|null>(null);
 const [status,setStatus]=useState<Status>('idle');
 const [progress,setProgress]=useState<number|null>(null);
 const [detail,setDetail]=useState<string|null>(null);
 const [metrics,setMetrics]=useState<LoadMetrics|null>(null);
 const [attempt,setAttempt]=useState(0);
 const stage=useRef<HTMLDivElement>(null);
 const modelRef=useRef<Loaded|null>(null);

 // Choose the derivative on the client only, so server and first client render agree.
 useEffect(()=>{
  if(!derivative)return;
  setSource(pickDerivativeModel(derivative,networkHint(),window.innerWidth));
 },[derivative]);

 useEffect(()=>{
  if(!source||!stage.current)return;
  let cancelled=false;
  const controller=new AbortController();
  resident?.release();
  const holder={release:()=>{cancelled=true}};
  resident=holder;
  setStatus('loading');setProgress(null);setDetail(null);setMetrics(null);
  void (async()=>{
   try{
    const {loadSuppliedGlb}=await import('./glb-loader');
    const loaded=await loadSuppliedGlb(
      source.url,
      fraction=>{if(!cancelled)setProgress(fraction)},
      stage.current!,
      value=>{if(!cancelled)setMetrics(value)},
      ()=>{if(!cancelled)setStatus('failed')},
      controller.signal,
    );
    if(cancelled||resident!==holder){loaded.dispose();return}
    modelRef.current=loaded;
    setStatus('ready');
   }catch(error:unknown){
    if(cancelled)return;
    setStatus('failed');
    setDetail(error instanceof Error?error.message:'The 3D model could not load.');
   }
  })();
  return()=>{
   cancelled=true;controller.abort();
   if(resident===holder)resident=null;
   modelRef.current?.dispose();
   modelRef.current=null;
  };
 },[source,attempt]);

 const retry=useCallback(()=>{
  setAttempt(value=>value+1);
  if(derivative)setSource(pickDerivativeModel(derivative,networkHint(),window.innerWidth));
 },[derivative]);

 if(!derivative){
  return <p className="model3d-status" role="status">A 3D model has not been supplied for the {modelName} yet. The photograph and the published specification are available.</p>;
 }

 return <div className={compact?'model3d is-compact':'model3d'}>
  <div className="model3d-stage" ref={stage} role="img" aria-label={`${modelName} interactive 3D model`} aria-busy={status==='loading'}/>
  {status==='loading'&&<p className="model3d-status" role="status">Loading the 3D model{progress!==null?` — ${Math.round(progress*100)}%`:''}…</p>}
  {status==='ready'&&<p className="model3d-status">Loaded 3D model{metrics?` · ${metrics.triangles.toLocaleString()} triangles · first frame ${Math.round(metrics.firstFrameMs)} ms`:''} · drag to orbit · scroll or pinch to zoom</p>}
  {status==='failed'&&<div className="model3d-status"><p role="status">The 3D model could not load. The photograph and specifications remain available.</p>{detail&&<p className="model3d-detail">{detail}</p>}<button type="button" className="button ghost" onClick={retry}>Retry 3D model</button></div>}
  <div className="model3d-controls" aria-label={`${modelName} 3D controls`}>
   <button type="button" aria-label="Zoom in" onClick={()=>modelRef.current?.zoomBy?.(0.8)} disabled={status!=='ready'}>Zoom +</button>
   <button type="button" aria-label="Zoom out" onClick={()=>modelRef.current?.zoomBy?.(1.25)} disabled={status!=='ready'}>Zoom −</button>
   <button type="button" aria-label="Reset camera" onClick={()=>modelRef.current?.resetView?.()} disabled={status!=='ready'}>Reset camera</button>
   {source&&<span className="model3d-variant">{source.variant==='mobile'?'Light model':'Full model'}</span>}
  </div>
 </div>;
}
