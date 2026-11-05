// Real Three.js GLB loader used by SuppliedGlbViewer. Client-only.
// Loads the exact supplied file; never rescales textures or edits materials.
import type {Texture,Mesh,MeshStandardMaterial,Material} from 'three';
import type {LoadedModel} from './SuppliedGlbViewer';

export type LoadMetrics={loadMs:number;firstFrameMs:number;fps:number;triangles:number;drawCalls:number;textureCount:number};

/** True when the GLB embeds KTX2 textures, which need a compressed-texture transcoder. */
function usesKtx2(buffer:ArrayBuffer):boolean{
 try{
  const view=new DataView(buffer);
  if(view.getUint32(0,true)!==0x46546c67)return false; // 'glTF'
  const jsonLength=view.getUint32(12,true);
  const parsed=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jsonLength))) as {images?:{mimeType?:string;uri?:string}[]};
  return (parsed.images??[]).some(image=>/ktx2/i.test(image.mimeType??image.uri??''));
 }catch{return false}
}

/** True when the GLB uses a glTF extension that needs its matching three.js decoder. */
function usesExtension(buffer:ArrayBuffer,name:string):boolean{
 try{
  const view=new DataView(buffer);
  if(view.getUint32(0,true)!==0x46546c67)return false; // 'glTF'
  const jsonLength=view.getUint32(12,true);
  const parsed=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jsonLength))) as {extensionsUsed?:string[];extensionsRequired?:string[]};
  const used=[...(parsed.extensionsUsed??[]),...(parsed.extensionsRequired??[])];
  return used.includes(name);
 }catch{return false}
}

export async function loadSuppliedGlb(
 url:string,
 onProgress:(fraction:number)=>void,
 host:HTMLElement,
 onMetrics?:(metrics:LoadMetrics)=>void,
 onContextLost?:()=>void,
 signal?:AbortSignal,
):Promise<LoadedModel>{
 if(typeof WebGLRenderingContext==='undefined')throw Object.assign(new Error('3D graphics are unavailable in this browser.'),{code:'no-gpu'});
 const THREE=await import('three');
 const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
 const {KTX2Loader}=await import('three/addons/loaders/KTX2Loader.js');
 const {selectUastcTarget}=await import('./ktx2-target.mjs') as typeof import('./ktx2-target.mjs');
 const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
 const {RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js');

 const width=host.clientWidth||640,height=host.clientHeight||400;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 // Terminal, not degraded: a lost context never becomes a partial or substitute model.
 const contextLost=()=>{onContextLost?.()};
 renderer.domElement.addEventListener('webglcontextlost',contextLost,false);
 // Cancel must free the renderer and canvas immediately, not after the download ends.
 const abort=()=>{try{renderer.setAnimationLoop(null);renderer.dispose();renderer.domElement.remove()}catch{}};
 if(signal?.aborted)abort();
 signal?.addEventListener('abort',abort,{once:true});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.setSize(width,height,false);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.05;
 renderer.domElement.setAttribute('aria-hidden','true');
 renderer.domElement.style.display='block';
 renderer.domElement.style.width='100%';
 renderer.domElement.style.height='100%';
 host.appendChild(renderer.domElement);
 // Cancel may arrive while the async imports resolve. Remove the canvas we just appended rather
 // than leave a stray, model-less canvas stacked in the stage (which is what showed up as an
 // empty box with the real model pushed below it).
 if(signal?.aborted){abort();throw new DOMException('Aborted','AbortError')}

 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(40,width/height,0.05,500);
 scene.add(new THREE.HemisphereLight(0xeaf3ff,0x4a4034,2.2));
 const key=new THREE.DirectionalLight(0xfff1dc,3.1);key.position.set(4,7,5);scene.add(key);
 const fill=new THREE.DirectionalLight(0xbfd7f0,1.2);fill.position.set(-6,3,-4);scene.add(fill);
 const pmrem=new THREE.PMREMGenerator(renderer);
 const envTexture=pmrem.fromScene(new RoomEnvironment(),0.04).texture;
 scene.environment=envTexture;

 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.enablePan=false;controls.rotateSpeed=.7;controls.zoomSpeed=.8;

 const started=performance.now();
 const loader=new GLTFLoader();
 // Fetch the file once, then inspect its JSON chunk before choosing a decoder. A model that
 // ships uncompressed PNG/JPEG textures loads on any WebGL device; only a model that really
 // embeds KTX2 needs a compressed transcoder and the RGBA32 refusal guard.
 const response=await fetch(url,{signal});
 if(!response.ok)throw new Error(`3D model request failed (${response.status}).`);
 const declared=Number(response.headers.get('content-length'))||0;
 let buffer:ArrayBuffer;
 const reader=response.body?.getReader();
 if(reader){
  const chunks:Uint8Array[]=[];let received=0;
  for(;;){const{value,done}=await reader.read();if(done)break;if(value){chunks.push(value);received+=value.length;if(declared)onProgress(Math.min(1,received/declared))}}
  const merged=new Uint8Array(received);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.length}
  buffer=merged.buffer;
 }else{buffer=await response.arrayBuffer();onProgress(1)}
 if(signal?.aborted){abort();throw new DOMException('Aborted','AbortError')}
 // Meshopt-compressed geometry needs its wasm decoder. Derivatives that use it declare
 // EXT_meshopt_compression; the decoder is bundled with three.js, so no extra files are served.
 if(usesExtension(buffer,'EXT_meshopt_compression')){
  const {MeshoptDecoder}=await import('three/addons/libs/meshopt_decoder.module.js');
  await MeshoptDecoder.ready;
  loader.setMeshoptDecoder(MeshoptDecoder);
 }
 const ktx2=usesKtx2(buffer)?new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer):null;
 if(ktx2){
  // Read the feature flags the loader itself consults, then resolve the target with the
  // loader's own priority table. Its table ends in an unguarded RGBA32 entry (100); that is a
  // terminal refusal here, because 4096+ RGBA32 textures are the memory failure we removed.
  const capability=renderer as unknown as {hasFeature?:(name:string)=>boolean;backend?:{isWebGPUBackend?:boolean}};
  const has=(name:string)=>typeof capability.hasFeature==='function'?Boolean(capability.hasFeature(name)):false;
  const flags={astcSupported:has('texture-compression-astc'),bptcSupported:has('texture-compression-bc'),dxtSupported:has('texture-compression-bc'),etc2Supported:has('texture-compression-etc2'),etc1Supported:has('texture-compression-etc2'),pvrtcSupported:has('texture-compression-pvrtc')};
  const target=selectUastcTarget(flags);
  const backend=capability.backend?.isWebGPUBackend?'WebGPU':'WebGL2';
  host.dataset.ktx2Backend=backend;
  host.dataset.ktx2Target=target.name;
  host.dataset.ktx2ProjectedMiB=target.compressed?'170.7':'682.7';
  if(!target.compressed){ktx2.dispose();throw Object.assign(new Error('Compressed texture target unavailable; the loader would fall back to uncompressed RGBA32.'),{code:'uncompressed-fallback'});}
  loader.setKTX2Loader(ktx2);
 }else{
  host.dataset.ktx2Target='uncompressed';
 }
 const gltf:any=await new Promise<any>((resolve,reject)=>loader.parse(buffer,'',resolve,reject));
 ktx2?.dispose();
 if(signal?.aborted){abort();throw new DOMException('Aborted','AbortError')}
 const loadMs=performance.now()-started;

 const root=gltf.scene;
 scene.add(root);
 let triangles=0,textureCount=0;
 const seenTextures=new Set<Texture>();
 root.traverse(object=>{
  const mesh=object as Mesh;
  if(mesh.isMesh&&mesh.geometry){
   // A file exported without normals must not be lit with a zero normal (which renders black).
   if(!mesh.geometry.attributes.normal)mesh.geometry.computeVertexNormals();
   const index=mesh.geometry.getIndex();triangles+=(index?index.count:mesh.geometry.getAttribute('position').count)/3;
  }
  const material=(mesh as Mesh).material as MeshStandardMaterial|undefined;
  if(material)for(const value of[material.map,material.metalnessMap,material.roughnessMap,material.normalMap])if(value)seenTextures.add(value);
 });
 textureCount=seenTextures.size;

 // three.js material.dispose() never disposes textures, so two 8192² maps would leak on every
 // unmount or model switch. Dispose every texture a material points at, exactly once.
 const disposedTextures=new WeakSet<Texture>();
 const disposeTexture=(texture:Texture)=>{if(!texture||disposedTextures.has(texture))return;disposedTextures.add(texture);try{texture.dispose()}catch{}};
 const disposeMaterialTextures=(material:Material)=>{for(const value of Object.values(material as unknown as Record<string,unknown>))if(value&&typeof value==='object'&&(value as Texture).isTexture)disposeTexture(value as Texture)};

 const box=new THREE.Box3().setFromObject(root);
 const center=box.getCenter(new THREE.Vector3());
 const sphere=box.getBoundingSphere(new THREE.Sphere());
 const radius=sphere.radius||1;
 root.position.sub(center);
 // Fit the bounding sphere to BOTH axes so portrait and landscape both fill sensibly.
 const vFov=(camera.fov*Math.PI)/180;
 const hFov=2*Math.atan(Math.tan(vFov/2)*camera.aspect);
 const distance=Math.max(radius/Math.sin(vFov/2),radius/Math.sin(hFov/2))*0.8;
 const direction=new THREE.Vector3(.62,.40,.72).normalize();
 camera.position.copy(direction.multiplyScalar(distance));
 camera.lookAt(0,0,0);
 controls.target.set(0,0,0);
 controls.minDistance=radius*.85;controls.maxDistance=distance*3.2;
 controls.update();

 let frames=0,firstFrameMs=0,alive=true,fpsStart=0,fpsFrames=0,fps=0;
 const tick=()=>{if(!alive)return;renderer.render(scene,camera);frames++;const now=performance.now();if(!firstFrameMs){firstFrameMs=now-started;fpsStart=now}fpsFrames++;if(now-fpsStart>1000){fps=Math.round((fpsFrames*1000)/(now-fpsStart));fpsFrames=0;fpsStart=now;
   host.dataset.metrics=JSON.stringify({loadMs:Math.round(loadMs),firstFrameMs:Math.round(firstFrameMs),fps,triangles:Math.round(triangles),drawCalls:renderer.info.render.calls,textureCount} as LoadMetrics);
   onMetrics?.({loadMs,firstFrameMs,fps,triangles:Math.round(triangles),drawCalls:renderer.info.render.calls,textureCount});}
  requestAnimationFrame(tick)};
 requestAnimationFrame(tick);

 const resize=()=>{const w=host.clientWidth||width,h=host.clientHeight||height;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
 const observer=new ResizeObserver(resize);observer.observe(host);
 host.dataset.loaded='true';
 host.dataset.maxTextureSize=String(renderer.capabilities.maxTextureSize);

 const homePosition=camera.position.clone();
 return{triangles:Math.round(triangles),zoomBy(factor:number){const offset=camera.position.clone().sub(controls.target);const next=Math.min(controls.maxDistance,Math.max(controls.minDistance,offset.length()*factor));camera.position.copy(controls.target).add(offset.setLength(next));controls.update();},resetView(){camera.position.copy(homePosition);controls.target.set(0,0,0);controls.update();},dispose(){alive=false;observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',contextLost);signal?.removeEventListener('abort',abort);scene.traverse(object=>{const mesh=object as Mesh;if(mesh.isMesh){mesh.geometry?.dispose();const material=mesh.material as Material|Material[];for(const m of Array.isArray(material)?material:[material]){disposeMaterialTextures(m);m.dispose()}}});seenTextures.forEach(disposeTexture);seenTextures.clear();envTexture.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove()}};
}
