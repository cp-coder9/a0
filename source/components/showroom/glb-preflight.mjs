// GLB preflight: parse header + JSON chunk, read image dimensions (JPEG SOF or KTX2
// header), and budget the GPU bytes for the texture format the runtime will use.
// No texture decode, no GPU upload.
import{readFile}from'node:fs/promises';

const BUDGET_BYTES=Number(process.env.GLB_BUDGET_BYTES||1024*1024*1024);

// Bytes per texel for the transcode targets we accept. RGBA32 is the unguarded
// fallback that must be refused rather than silently uploaded.
export const FORMAT_BYTES_PER_TEXEL={bptc:1,astc:1,bc1:0.5,etc2:0.5,rgba32:4};

function jpegSize(buffer,start,end){
 let i=start+2;
 while(i<end-9){
  if(buffer[i]!==0xff){i++;continue}
  const marker=buffer[i+1];
  if(marker>=0xc0&&marker<=0xcf&&marker!==0xc4&&marker!==0xc8&&marker!==0xcc){
   return{height:buffer.readUInt16BE(i+5),width:buffer.readUInt16BE(i+7)};
  }
  const len=buffer.readUInt16BE(i+2);
  i+=2+len;
 }
 return null;
}

function pngInfo(buffer,start,end){
 // PNG signature + IHDR: width at 16, height at 20 (big-endian).
 if(buffer[start]!==0x89||buffer[start+1]!==0x50||buffer[start+2]!==0x4e||buffer[start+3]!==0x47)return null;
 return{width:buffer.readUInt32BE(start+16),height:buffer.readUInt32BE(start+20)};
}

function ktx2Info(buffer,start,end){
 const magic=[0xab,0x4b,0x54,0x58,0x20,0x32,0x30,0xbb,0x0d,0x0a,0x1a,0x0a];
 for(let i=0;i<magic.length;i++)if(buffer[start+i]!==magic[i])return null;
 return{
  vkFormat:buffer.readUInt32LE(start+12),
  width:buffer.readUInt32LE(start+20),
  height:buffer.readUInt32LE(start+24),
  depth:buffer.readUInt32LE(start+28),
  layers:buffer.readUInt32LE(start+32),
  faces:buffer.readUInt32LE(start+36),
  levels:buffer.readUInt32LE(start+40),
  supercompression:buffer.readUInt32LE(start+44),
 };
}

// Decides which texture path the file actually needs, so the budget is not fiction.
export function texturePath(json,images){
 const required=(json.extensionsRequired||[]);
 const usesKtx2=required.includes('KHR_texture_basisu')||images.some(i=>i.mimeType==='image/ktx2');
 return usesKtx2?'ktx2':'jpeg';
}

export async function preflightGlb(path,options={}){
 const format=options.format||'bptc';          // runtime transcode target when KTX2
 const budget=options.budget||BUDGET_BYTES;
 const buffer=await readFile(path);
 if(buffer.readUInt32LE(0)!==0x46546c67)throw new Error('Not a GLB file');
 const version=buffer.readUInt32LE(4),total=buffer.readUInt32LE(8);
 if(version!==2)throw new Error('Unsupported GLB version '+version);
 const jsonLength=buffer.readUInt32LE(12);
 if(buffer.readUInt32LE(16)!==0x4e4f534a)throw new Error('First chunk is not JSON');
 const json=JSON.parse(buffer.subarray(20,20+jsonLength).toString('utf8'));
 const binStart=20+jsonLength+8;
 const views=json.bufferViews||[];
 const images=(json.images||[]).map(image=>{
  const view=views[image.bufferView];
  const bytes=view&&view.byteLength||0;
  const start=view?binStart+(view.byteOffset||0):0;
  let dims=null,ktx=null;
  if(image.mimeType==='image/jpeg')dims=jpegSize(buffer,start,start+bytes);
  if(image.mimeType==='image/ktx2'||(image.extensions&&image.extensions.KHR_texture_basisu))ktx=ktx2Info(buffer,start,start+bytes);
  if(image.mimeType==='image/png'){const png=pngInfo(buffer,start,start+bytes);if(png)dims=png;}
  return{mimeType:image.mimeType||'unknown',bytes,
   width:dims?dims.width:(ktx?ktx.width:null),
   height:dims?dims.height:(ktx?ktx.height:null),
   ktxLevels:ktx?ktx.levels:null};
 });
 const path_=texturePath(json,images);
 let triangles=0;
 for(const mesh of json.meshes||[])for(const primitive of mesh.primitives||[]){
  const positions=json.accessors&&json.accessors[primitive.attributes&&primitive.attributes.POSITION];
  const indices=primitive.indices!=null&&json.accessors?json.accessors[primitive.indices]:null;
  const count=indices?indices.count:(positions?positions.count:0);
  triangles+=Math.floor(count/3);
 }
 const componentSizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
 const typeSizes={VEC3:3,VEC2:2,VEC4:4,SCALAR:1,MAT4:16};
 const attributeBytes=(json.accessors||[]).reduce((sum,accessor)=>{
  const componentBytes=componentSizes[accessor.componentType]||4;
  const components=typeSizes[accessor.type]||4;
  return sum+accessor.count*components*componentBytes;
 },0);

 // Budget the format the runtime will ACTUALLY use, not a worst case we never ship.
 const bytesPerTexel=path_==='ktx2'?(FORMAT_BYTES_PER_TEXEL[format]||1):4;
 const decodedTextureBytes=images.reduce((sum,image)=>{
  if(!image.width||!image.height)return sum;
  const base=image.width*image.height*bytesPerTexel*(image.ktxLevels?1:1);
  // KTX2 ships a full mip chain; JPEG does not, but the GPU still allocates it when mips are generated.
  return sum+base;
 },0);
 const decodedWithMipsBytes=Math.round(decodedTextureBytes*4/3);
 const verdict=decodedWithMipsBytes===0?'unknown':(decodedWithMipsBytes<=budget?'within-budget':'over-budget');
 return{fileSizeBytes:total||buffer.length,jsonChunkBytes:jsonLength,generator:json.asset&&json.asset.generator||null,texturePath:path_,format:path_==='ktx2'?format:'rgba32',bytesPerTexel,triangles:triangles||null,images,decodedTextureBytes,decodedWithMipsBytes,attributeBytesEstimate:attributeBytes,requiredExtensions:json.extensionsRequired||[],verdict,budgetBytes:budget};
}
