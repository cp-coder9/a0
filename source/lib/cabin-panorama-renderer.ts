import {Mesh,MeshBasicMaterial,PerspectiveCamera,Scene,SphereGeometry,SRGBColorSpace,Texture,Vector3,WebGLRenderer,MathUtils} from 'three';
export type PanoramaView={yaw:number;pitch:number;fov:number};
export type PanoramaRenderer={update:(view:PanoramaView)=>void;dispose:()=>void};

// The camera stays at the centre of an inward-facing textured sphere.
export function mountCabinPanorama(host:HTMLElement,image:HTMLImageElement,initial:PanoramaView,onContextLost:()=>void):PanoramaRenderer{
 const renderer=new WebGLRenderer({antialias:true,powerPreference:'low-power'});
 const scene=new Scene(),camera=new PerspectiveCamera(initial.fov,1,.1,20);
 const geometry=new SphereGeometry(10,64,40);geometry.scale(-1,1,1);
 const texture=new Texture(image);texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
 const material=new MeshBasicMaterial({map:texture});scene.add(new Mesh(geometry,material));
 const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');canvas.dataset.projection='spherical-360';
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=SRGBColorSpace;
 host.appendChild(canvas);
 let disposed=false,view=initial;
 const direction=new Vector3();
 function render(){
  if(disposed||!host.clientWidth||!host.clientHeight)return;
  camera.fov=view.fov;camera.updateProjectionMatrix();
  const longitude=MathUtils.degToRad(view.yaw+180),latitude=MathUtils.degToRad(view.pitch);
  direction.set(Math.cos(latitude)*Math.cos(longitude),Math.sin(latitude),Math.cos(latitude)*Math.sin(longitude));
  camera.lookAt(direction);renderer.render(scene,camera);
  canvas.dataset.yaw=String(view.yaw);canvas.dataset.pitch=String(view.pitch);canvas.dataset.fov=String(view.fov);
 }
 function resize(){if(disposed)return;const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;render()}
 const lost=(event:Event)=>{event.preventDefault();onContextLost()};canvas.addEventListener('webglcontextlost',lost);
 const observer=new ResizeObserver(resize);observer.observe(host);
 const dispose=()=>{if(disposed)return;disposed=true;observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);geometry.dispose();texture.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove()};
 try{resize()}catch(error){dispose();throw error}
 return {update(next){view=next;render()},dispose};
}
