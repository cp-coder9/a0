'use client';
import {useEffect,useReducer,useRef,useState,type ReactNode} from 'react';
import {initialTour,tourReducer,tourScenes,type TourAction} from '../lib/truck-tour';
import {TruckTourNavigation} from './TruckTourNavigation';
import * as THREE from 'three';
import {WebGPURenderer} from 'three/webgpu';
import {mountTruckRenderer} from '../lib/truck-renderer';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createTruckModel,initialView,viewReducer,type ViewState} from '../lib/truck-3d';
import './truck-illustration.css';
import './truck-tour.css';
import {isRenderable,suppliedModelFor} from './showroom/supplied-models';
import './showroom/supplied-glb-viewer.css';
import {SuppliedGlbViewer} from './showroom/SuppliedGlbViewer';
export function TruckIllustration(props:{id:string;onViewCockpit?:()=>void;cockpitPhoto?:ReactNode;cockpitThumbnail?:string}){
 // Supplied-GLB seam: an approved, served model takes over the Interactive 3D tab.
 // Otherwise the existing view is retained unchanged; no procedural output is relabelled.
 const supplied=suppliedModelFor(props.id);
 if(isRenderable(supplied))return <SuppliedGlbViewer modelId={props.id} modelName={props.id}/>;
 const candidate=suppliedModelFor(props.id);
 // Truthful labelling: the schematic guide must never read as the supplied truck model.
 // The notice appears for EVERY model that has a supplied candidate but no approved display, so
 // HOWO 7 and HOWO MAX explain themselves the way C7H already does (Tess finding).
 const modelName=candidate?.userDesignatedName??props.id;
 const measured=candidate?.measured;
 const notice=candidate
  ?(measured
    ?`${modelName}: the supplied 3D model is not available yet (file ${candidate.literalFilename}, measured ${measured.textureDims} textures ≈ ${measured.withMipsMiB} MiB decoded). This view is a schematic guide, not that model.`
    :`${modelName}: the supplied 3D model is not approved for display yet (file ${candidate.literalFilename}). This view is a schematic guide, not that model.`)
  :null;
 return <div className="illustration-with-notice">{notice&&<p className="supplied-glb-measured" role="status">{notice}</p>}<ExistingGuide {...props}/></div>;
}
function ExistingGuide({id,onViewCockpit,cockpitPhoto,cockpitThumbnail}:{id:string;onViewCockpit?:()=>void;cockpitPhoto?:ReactNode;cockpitThumbnail?:string}){
 const [tour,tourDispatch]=useReducer(tourReducer,undefined,initialTour);
 const tourRef=useRef(tour);tourRef.current=tour;
 const guide=useRef<HTMLElement>(null),hotspots=useRef<HTMLButtonElement[]>([]),restored=useRef(false);
 const [isFullscreen,setIsFullscreen]=useState(false);
 useEffect(()=>{const changed=()=>setIsFullscreen(document.fullscreenElement===guide.current);document.addEventListener('fullscreenchange',changed);return()=>document.removeEventListener('fullscreenchange',changed)},[]);
 const [previews,setPreviews]=useState<Record<number,string>>({}),[fullscreenError,setFullscreenError]=useState('');
 const photoActive=tour.scene===6&&!!cockpitPhoto;
 const photoRef=useRef(photoActive);photoRef.current=photoActive;
 const navigate=(action:TourAction)=>{dispatch('motion-off');if(tourReducer(tourRef.current,action).scene===6&&!cockpitPhoto&&action.type!=='list'){onViewCockpit?.();return}tourDispatch(action)};
 const enterInterior=()=>{if(cockpitPhoto)navigate({type:'select',scene:6});else onViewCockpit?.()};
 useEffect(()=>{if(restored.current)return;restored.current=true;try{const saved=JSON.parse(sessionStorage.getItem(`truck-guide-${id}`)||'null');if(saved&&Number.isInteger(saved.scene)&&saved.scene>=0&&saved.scene<7){if(Number.isInteger(saved.lastExterior)&&saved.lastExterior>=0&&saved.lastExterior<6)tourDispatch({type:'select',scene:saved.lastExterior});tourDispatch({type:'select',scene:saved.scene});if(saved.list===false)tourDispatch({type:'list'})}}catch{}},[id]);
 useEffect(()=>{try{sessionStorage.setItem(`truck-guide-${id}`,JSON.stringify(tour))}catch{}},[id,tour]);
 async function fullscreen(){try{if(!guide.current?.requestFullscreen){setFullscreenError('Full screen is unavailable in this browser.');return}if(document.fullscreenElement)await document.exitFullscreen();else await guide.current.requestFullscreen();setFullscreenError('')}catch{setFullscreenError('Full screen is unavailable in this browser.')}}
 const [state,dispatch]=useReducer(viewReducer,initialView(true));
 const current=useRef<ViewState>(state);current.current=state;
 const host=useRef<HTMLDivElement>(null),api=useRef<{zoom:(factor:number)=>void;reset:()=>void}|null>(null);
 const [status,setStatus]=useState('Loading 3D view…');

 const [motionReduced,setMotionReduced]=useState(false);
 useEffect(()=>{
  const el=host.current;if(!el)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');let reduced=preference.matches;
  setMotionReduced(reduced);dispatch(reduced?'motion-off':'motion-on');
  const onPreference=()=>{reduced=preference.matches;setMotionReduced(reduced);if(reduced)dispatch('motion-off')};preference.addEventListener('change',onPreference);
  let renderer:WebGPURenderer;
  try{renderer=new WebGPURenderer({antialias:true,alpha:false});}catch{setStatus('3D graphics are unavailable. Choose the photo or another view instead.');preference.removeEventListener('change',onPreference);return;}
  setStatus('Loading 3D view…');let cancelled=false;
  const lifecycle=mountTruckRenderer(renderer,backend=>{
  el.dataset.backend=backend;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setClearColor(0x172126);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;
  const canvas=renderer.domElement;canvas.setAttribute('aria-label','Interactive 3D view. Drag to orbit; scroll or pinch to zoom.');canvas.tabIndex=0;el.appendChild(canvas);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.035,100);
  const exterior=new THREE.Vector3(...tourScenes[0].position),exteriorTarget=new THREE.Vector3(0,1.7,.45);camera.position.copy(exterior);
  const controls=new OrbitControls(camera,canvas);controls.target.copy(exteriorTarget);controls.minDistance=4.5;controls.maxDistance=18;controls.maxPolarAngle=Math.PI*.49;controls.enablePan=false;controls.autoRotateSpeed=.32;controls.enableDamping=true;controls.update();
  const model=createTruckModel(id);scene.add(model.root);model.root.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});
  scene.add(new THREE.HemisphereLight(0xdaedff,0x786650,3));const key=new THREE.DirectionalLight(0xfff2d5,4.2);key.position.set(3,8,-5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:25});key.shadow.bias=-.0005;key.shadow.normalBias=.035;scene.add(key);const fill=new THREE.DirectionalLight(0x9bbbdc,2);fill.position.set(-5,4,3);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(12,64),new THREE.MeshStandardMaterial({color:0x29353a,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=.02;ground.receiveShadow=true;scene.add(ground);
  const rim=new THREE.DirectionalLight(0xf3dfb4,1.5);rim.position.set(-3,6,6);scene.add(rim);
  let transition:{start:number;from:THREE.Vector3;target:THREE.Vector3;to:THREE.Vector3;look:THREE.Vector3}|null=null;
  let lastScene=-1,last=performance.now(),frames=0,disposed=false;
  const captured=new Set<number>();
  const projected=new THREE.Vector3();
  function begin(index:number){const position=tourScenes[index].position;if(!position)return;controls.enabled=false;controls.minDistance=4.5;controls.maxDistance=18;transition={start:performance.now(),from:camera.position.clone(),target:controls.target.clone(),to:new THREE.Vector3(...position),look:exteriorTarget.clone()};}
  const stopRotation=()=>{dispatch('motion-off')};controls.addEventListener('start',stopRotation);
  api.current={zoom:factor=>{if(current.current.cockpit)return;stopRotation();camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update()},reset:()=>{dispatch('exterior');dispatch('motion-off');tourDispatch({type:'select',scene:0});begin(0)}};
  const keyboard=(event:KeyboardEvent)=>{if(event.key==='+'||event.key==='='){event.preventDefault();api.current?.zoom(.88)}if(event.key==='-'){event.preventDefault();api.current?.zoom(1.12)}};canvas.addEventListener('keydown',keyboard);
  const lost=(event:Event)=>{event.preventDefault();setStatus('The 3D graphics context was interrupted. Reopen this tab to retry, or choose the photo view.');};canvas.addEventListener('webglcontextlost',lost);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  function animate(now:number){if(disposed)return;if(photoRef.current){last=now;return}const dt=Math.min((now-last)/1000,.05);last=now;const s=current.current;
   const sceneIndex=tourRef.current.scene;if(sceneIndex!==lastScene){begin(sceneIndex);lastScene=sceneIndex;}
   const ease=reduced?1:1-Math.exp(-dt*8);
   const targetFov=s.cockpit?72:43;if(Math.abs(camera.fov-targetFov)>.01){camera.fov=THREE.MathUtils.lerp(camera.fov,targetFov,ease);camera.updateProjectionMatrix();}
   model.doors[0].rotation.y=THREE.MathUtils.lerp(model.doors[0].rotation.y,s.left?-1.2:0,ease);
   model.doors[1].rotation.y=THREE.MathUtils.lerp(model.doors[1].rotation.y,s.right?1.2:0,ease);
   model.service.rotation.x=THREE.MathUtils.lerp(model.service.rotation.x,s.service?1.55:0,ease);
   controls.autoRotate=s.rotating&&!reduced&&!transition;controls.enableDamping=!reduced&&s.rotating;
   if(transition){const t=reduced?1:Math.min((now-transition.start)/1400,1),smooth=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,smooth);controls.target.lerpVectors(transition.target,transition.look,smooth);camera.lookAt(controls.target);if(t===1){transition=null;controls.enabled=!s.cockpit;controls.update()}}
   else if(!s.cockpit)controls.update(dt);
   renderer.render(scene,camera);frames++;
   // Anchors are transformed with the actual articulated geometry each frame.
   const anchors=[new THREE.Vector3(0,3.3,-2.55),model.service.localToWorld(new THREE.Vector3(0,-.35,-.12)),model.doors[0].localToWorld(new THREE.Vector3(-.12,.65,.75)),model.doors[1].localToWorld(new THREE.Vector3(.12,.65,.75))];
   anchors.forEach((point,index)=>{const button=hotspots.current[index];if(!button)return;projected.copy(point).project(camera);const visible=projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.93&&Math.abs(projected.y)<.86&&(index===0||(index===1?camera.position.z<-1:index===2?camera.position.x<-.5:camera.position.x>.5));button.hidden=!visible;button.style.left=`${(projected.x+1)*50}%`;button.style.top=`${(1-projected.y)*50}%`;});
   if(!transition&&!captured.has(sceneIndex)&&frames>10){captured.add(sceneIndex);try{const preview=document.createElement('canvas');preview.width=160;preview.height=90;preview.getContext('2d')?.drawImage(canvas,0,0,160,90);const url=preview.toDataURL('image/webp',.65);setPreviews(previous=>({...previous,[sceneIndex]:url}));}catch{/* Numbered scenes remain available if capture is unsupported. */}}
   // Read-only diagnostics let browser checks verify actual geometry transforms, not just button text.
   if(frames%10===0){el.dataset.geometry=JSON.stringify({model:id,backend,frames,meshes:renderer.info.render.drawCalls,triangles:renderer.info.render.triangles,doors:model.doors.map(d=>d.rotation.y),service:model.service.rotation.x,camera:camera.position.toArray(),target:controls.target.toArray(),transition:!!transition,scene:sceneIndex,cockpit:s.cockpit,rotating:controls.autoRotate,reduced});}
  }
  renderer.setAnimationLoop(animate);setStatus('');
  return()=>{disposed=true;renderer.setAnimationLoop(null);observer.disconnect();controls.removeEventListener('start',stopRotation);controls.dispose();canvas.removeEventListener('keydown',keyboard);canvas.removeEventListener('webglcontextlost',lost);const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.LineSegments){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());key.shadow.dispose();canvas.remove();api.current=null;};
  });
  void lifecycle.ready.catch(()=>{if(!cancelled){setStatus('3D graphics could not initialize. Choose the photo or another view instead.')}});
  return()=>{cancelled=true;preference.removeEventListener('change',onPreference);lifecycle.dispose();};
 },[id]);
 return <section ref={guide} className="truck-illustration" aria-label="Interactive 3D view" data-scene={tourScenes[tour.scene].name} onKeyDown={event=>{if(event.key==='Escape'&&document.fullscreenElement){event.stopPropagation();void document.exitFullscreen();return}if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;const target=event.target as HTMLElement;if(target.closest('.reference-photo-view,.cabin-panorama'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();navigate({type:event.key==='ArrowRight'?'next':'previous'})}else if(event.key==='Home'||event.key==='End'){event.preventDefault();navigate({type:'select',scene:event.key==='Home'?0:6})}}} >

  <div className="illustration-stage" hidden={photoActive} ref={host} data-testid="truck-3d-stage" data-model={id}>{status&&<p className="illustration-status" role="status">{status}</p>}<span className="illustration-view">{tourScenes[tour.scene].name}</span>{['Interior','Engine','Left door','Right door'].map((label,index)=><button key={label} hidden type="button" className="tour-hotspot" aria-label={`Hotspot: ${label}`} ref={node=>{if(node)hotspots.current[index]=node}} onClick={()=>{dispatch('motion-off');if(index===0)enterInterior();else dispatch(index===1?'service':index===2?'left':'right')}}><span aria-hidden="true">＋</span>{label}</button>)}</div>
  {photoActive&&<div className="tour-interior">{cockpitPhoto}</div>}
  <TruckTourNavigation state={tour} action={navigate} previews={{...previews,...(cockpitThumbnail?{6:cockpitThumbnail}:{})}}/>
  <div className="tour-toolbar"><button type="button" onClick={()=>{void fullscreen()}}>{isFullscreen?'Exit full screen guide':'Full screen guide'}</button><span>VR unavailable</span></div>{fullscreenError&&<p role="status">{fullscreenError}</p>}
  <div className="illustration-controls" hidden={photoActive} aria-label="3D controls">
   <button type="button" aria-pressed={state.rotating&&!motionReduced} disabled={state.cockpit||motionReduced} onClick={()=>dispatch('rotate')}>{motionReduced?'Reduced motion':state.rotating?'Pause rotation':'Start rotation'}</button>
   <button type="button" aria-pressed={state.left} onClick={()=>dispatch('left')}>{state.left?'Close':'Open'} left door</button>
   <button type="button" aria-pressed={state.right} onClick={()=>dispatch('right')}>{state.right?'Close':'Open'} right door</button>
   <button type="button" aria-pressed={state.service} disabled={state.cockpit} onClick={()=>dispatch('service')}>{state.service?'Close service panel':'Reveal engine view'}</button>
   <button type="button" onClick={enterInterior}>View cabin</button>
   <button type="button" aria-label="Zoom into 3D view" disabled={state.cockpit} onClick={()=>api.current?.zoom(.85)}>Zoom +</button>
   <button type="button" aria-label="Zoom out of 3D view" disabled={state.cockpit} onClick={()=>api.current?.zoom(1.15)}>Zoom −</button>
   <button type="button" onClick={()=>api.current?.reset()}>Reset camera</button>
  </div>
  <p className="illustration-help">Drag to orbit · Scroll / pinch to zoom · ← / → for scenes · Home / End for first / interior · + / − to zoom. These controls are not service instructions.</p>

 </section>;
}
