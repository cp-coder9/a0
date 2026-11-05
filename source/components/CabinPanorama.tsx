'use client';
import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import type {PanoramaRenderer,PanoramaView} from '../lib/cabin-panorama-renderer';
import './cabin-panorama.css';

const wrap=(value:number)=>(value%360+360)%360;
const initial:PanoramaView={yaw:0,pitch:0,fov:75};
export function CabinPanorama({src,modelName='SITRAK',onImageFailure}:{src:string;modelName?:string;onImageFailure?:()=>void}){
 const [view,setView]=useState<PanoramaView>(initial),[dragging,setDragging]=useState(false),[fullscreen,setFullscreen]=useState(false),[message,setMessage]=useState(''),[failed,setFailed]=useState(false);
 const [image,setImage]=useState<HTMLImageElement|null>(null),[graphics,setGraphics]=useState<'loading'|'ready'|'unavailable'>('loading');
 const [attempt,setAttempt]=useState(0);
 const frame=useRef<HTMLDivElement>(null),surface=useRef<HTMLDivElement>(null),renderer=useRef<PanoramaRenderer|null>(null);
 const sourceImage=useRef<HTMLImageElement>(null),failureNotified=useRef(false),failureListener=useRef(onImageFailure);
 failureListener.current=onImageFailure;
 function failImage(){setFailed(true);if(!failureNotified.current){failureNotified.current=true;failureListener.current?.();}}
 useEffect(()=>{const element=sourceImage.current;if(element?.complete){if(element.naturalWidth>0)setImage(element);else failImage();}},[src,attempt]);
 const current=useRef(view);current.current=view;
 const drag=useRef<{x:number;y:number;view:PanoramaView;pointer:number}|null>(null);
 const instructions=useId();
 useEffect(()=>{const sync=()=>setFullscreen(document.fullscreenElement===frame.current);document.addEventListener('fullscreenchange',sync);return()=>document.removeEventListener('fullscreenchange',sync)},[]);
 useEffect(()=>{
  if(!image||!surface.current)return;
  let cancelled=false,instance:PanoramaRenderer|null=null;const host=surface.current;
  setGraphics('loading');
  void import('../lib/cabin-panorama-renderer').then(({mountCabinPanorama})=>{
   if(cancelled)return;
   instance=mountCabinPanorama(host,image,current.current,()=>{if(!cancelled)setGraphics('unavailable')});
   renderer.current=instance;setGraphics('ready');
  }).catch(()=>{if(!cancelled)setGraphics('unavailable')});
  return()=>{cancelled=true;instance?.dispose();if(renderer.current===instance)renderer.current=null};
 },[image]);
 useEffect(()=>{renderer.current?.update(view)},[view]);
 function retry(){failureNotified.current=false;setImage(null);setFailed(false);setGraphics('loading');setAttempt(value=>value+1);}
 function rotate(yaw:number,pitch=0){setView(value=>({...value,yaw:wrap(value.yaw+yaw),pitch:Math.max(-80,Math.min(80,value.pitch+pitch))}))}
 function zoom(delta:number){setView(value=>({...value,fov:Math.max(35,Math.min(95,value.fov+delta))}))}
 function keyboard(event:KeyboardEvent<HTMLDivElement>){
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','=','-'].includes(event.key)){event.preventDefault();event.stopPropagation();
   if(event.key==='Home')setView(initial);
   else if(event.key==='+'||event.key==='='||event.key==='-')zoom(event.key==='-'?10:-10);
   else rotate(event.key==='ArrowRight'?15:event.key==='ArrowLeft'?-15:0,event.key==='ArrowUp'?10:event.key==='ArrowDown'?-10:0);
  }
 }
 async function toggleFullscreen(){
  try{if(document.fullscreenElement===frame.current)await document.exitFullscreen();else if(frame.current?.requestFullscreen)await frame.current.requestFullscreen();else setMessage('Full screen is unavailable in this browser. You can still explore the panorama here.')}
  catch{setMessage('Full screen could not open. You can still explore the panorama here.')}
 }
 return <div className="cabin-panorama">
  <div ref={frame} className={`cabin-panorama-frame${dragging?' is-dragging':''}`}>
   <div ref={surface} className="cabin-panorama-surface" role="region" aria-roledescription="360-degree panorama" aria-label={`Interactive ${modelName} cabin panorama`} aria-describedby={instructions} tabIndex={0} data-yaw={view.yaw} data-pitch={view.pitch} data-fov={view.fov} data-renderer={graphics==='ready'?'webgl-360':graphics} onKeyDown={keyboard}
    onPointerDown={event=>{if(event.button!==0||failed)return;event.preventDefault();event.currentTarget.focus({preventScroll:true});drag.current={x:event.clientX,y:event.clientY,view:current.current,pointer:event.pointerId};event.currentTarget.setPointerCapture?.(event.pointerId);setDragging(true)}}
    onPointerMove={event=>{const start=drag.current;if(start&&start.pointer===event.pointerId)setView({...start.view,yaw:wrap(start.view.yaw+(start.x-event.clientX)*.2),pitch:Math.max(-80,Math.min(80,start.view.pitch+(event.clientY-start.y)*.2))})}}
    onPointerUp={()=>{drag.current=null;setDragging(false)}} onPointerCancel={()=>{drag.current=null;setDragging(false)}} onLostPointerCapture={()=>{drag.current=null;setDragging(false)}}>
    {failed?<div className="cabin-panorama-error"><p role="status">The cabin panorama could not load. Retry or choose another view.</p><button type="button" onClick={retry}>Retry cabin view</button></div>:<img key={`${src}-${attempt}`} ref={sourceImage} className={graphics==='ready'?'is-rendered':''} src={src} alt={`${modelName} cabin panorama`} draggable={false} onLoad={event=>setImage(event.currentTarget)} onError={failImage}/>}
   </div>
   <div className="cabin-panorama-heading"><span className="eyebrow gold">The long-road office</span><h4>{modelName} <span>360° cabin viewer</span></h4></div>
   <div className="cabin-panorama-controls" aria-label="Cabin panorama controls">
    <p id={instructions}>Click and drag to look around · arrow keys · + / − to zoom</p>
    <div><button type="button" aria-label="Pan left" disabled={failed} onClick={()=>rotate(-15)}>←</button><button type="button" aria-label="Pan right" disabled={failed} onClick={()=>rotate(15)}>→</button><button type="button" aria-label="Look up" disabled={failed} onClick={()=>rotate(0,10)}>↑</button><button type="button" aria-label="Look down" disabled={failed} onClick={()=>rotate(0,-10)}>↓</button><button type="button" aria-label="Zoom in panorama" disabled={failed||view.fov===35} onClick={()=>zoom(-10)}>+</button><button type="button" aria-label="Zoom out panorama" disabled={failed||view.fov===95} onClick={()=>zoom(10)}>−</button><button type="button" onClick={()=>setView(initial)}>Reset panorama</button><button type="button" onClick={()=>{void toggleFullscreen()}}>{fullscreen?'Exit full screen panorama':'Full screen panorama'}</button></div>
   </div>
  </div>
  {message&&<p role="status" className="cabin-panorama-message">{message}</p>}
  {graphics==='unavailable'&&!failed&&<p role="status" className="cabin-panorama-message">360° graphics are unavailable in this browser. Showing the supplied still image instead.</p>}
  <div className="reference-credit"><h4>Look around the {modelName}</h4><p>Explore the cabin using the controls above.</p></div>
 </div>;
}
