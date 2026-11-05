import{preflightGlb}from'./glb-preflight.mjs';
const files=[['c7h.glb','E:/Sitrak-website-assets/hero-models/originals/c7h.glb'],['SITRACK_C7h_ENGINE_REFERNCE.glb','E:/Sitrak-website-assets/engine-reference/originals/SITRACK_C7h_ENGINE_REFERNCE.glb'],['c7_max.glb','E:/Sitrak-website-assets/hero-models/originals/c7_max.glb'],['-HOWO-T7S-6X4-TIPPER-.glb','E:/Sitrak-website-assets/hero-models/originals/-HOWO-T7S-6X4-TIPPER-.glb'],['SITRACK G7S TIPPER 6X4.glb','E:/Sitrak-website-assets/hero-models/originals/SITRACK G7S TIPPER 6X4.glb']];
const out={budgetBytes:1024*1024*1024,results:[]};
for(const[name,path]of files){
 try{const r=await preflightGlb(path);out.results.push({name,path,...r});console.log(name,'->',JSON.stringify({dims:r.images.map(i=>`${i.width}x${i.height}`),decodedMiB:+(r.decodedTextureBytes/1048576).toFixed(1),withMipsMiB:+(r.decodedWithMipsBytes/1048576).toFixed(1),triangles:r.triangles,verdict:r.verdict}))}
 catch(e){out.results.push({name,path,error:e.message});console.log(name,'ERROR',e.message)}
}
await import('node:fs/promises').then(fs=>fs.writeFile('E:/Sitrak-website/docs/showroom-evidence/ui/GLB-PREFLIGHT-MEASURED.json',JSON.stringify(out,null,2)));
