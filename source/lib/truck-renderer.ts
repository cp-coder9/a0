export type TruckBackend='WebGPU'|'WebGL 2 fallback';
type InitializableRenderer={init:()=>Promise<unknown>;backend:object;dispose:()=>void};
// Defer disposal until init settles: disposing a pending GPU backend is unsafe.
export function mountTruckRenderer(renderer:InitializableRenderer,start:(backend:TruckBackend)=>()=>void){
 let cancelled=false,settled=false,disposed=false,cleanup:(()=>void)|undefined;
 const disposeRenderer=()=>{if(!disposed){disposed=true;renderer.dispose()}};
 const ready=renderer.init().then(()=>{settled=true;if(cancelled){disposeRenderer();return}const backend=renderer.backend as {isWebGPUBackend?:boolean};cleanup=start(backend.isWebGPUBackend?'WebGPU':'WebGL 2 fallback')}).catch(error=>{settled=true;disposeRenderer();if(!cancelled)throw error});
 return {ready,dispose:()=>{if(cancelled)return;cancelled=true;cleanup?.();if(settled)disposeRenderer()}};
}
