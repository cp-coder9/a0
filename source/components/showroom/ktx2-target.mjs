// Mirror of three r180 KTX2Loader.getTranscoderFormat priority table for UASTC.
// The loader's table ends in an UNGUARDED RGBA32 entry (priority 100): a device that
// reports no compressed-texture feature silently lands there at 4 B/texel. We resolve
// the target ourselves so RGBA32 can be refused BEFORE upload instead of discovered after.
export const TARGETS=[
 {if:'astcSupported',name:'ASTC_4x4',bytesPerTexel:1,compressed:true},
 {if:'bptcSupported',name:'BC7_M5',bytesPerTexel:1,compressed:true},
 {if:'dxtSupported',name:'BC1/BC3',bytesPerTexel:0.5,compressed:true},
 {if:'etc2Supported',name:'ETC1/ETC2',bytesPerTexel:0.5,compressed:true},
 {if:'etc1Supported',name:'ETC1',bytesPerTexel:0.5,compressed:true},
 {if:'pvrtcSupported',name:'PVRTC_4BPP',bytesPerTexel:0.5,compressed:true,needsPowerOfTwo:true},
];
export const RGBA32_FALLBACK={name:'RGBA32',bytesPerTexel:4,compressed:false};

const isPowerOfTwo=v=>v<=2||((v&(v-1))===0&&v!==0);

// Same order the loader walks; RGBA32 is reported explicitly, never as a pass.
export function selectUastcTarget(flags,size){
 for(const t of TARGETS){
  if(!flags[t.if])continue;
  if(t.needsPowerOfTwo&&size&&!(isPowerOfTwo(size.width)&&isPowerOfTwo(size.height)))continue;
  return{...t};
 }
 return{...RGBA32_FALLBACK};
}

export function budgetBytes(width,height,target,faces=1){
 const base=width*height*(target?target.bytesPerTexel:4)*faces;
 return Math.round(base*4/3); // full mip chain
}
