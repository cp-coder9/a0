// Supplied GLB identity registry.
// Identity here is a USER-SUPPLIED DESIGNATION (relayed by Leo, 2026-10-30; recorded in
// MODEL-IDENTITY-DESIGNATIONS.json): it is an authoritative decision about which file is
// which truck, NOT independent engineering verification and NOT a claim about the variant,
// power or spec of any physical unit.
// A designation licenses the BINDING, not a render: an entry still needs a delivered,
// measured texture derivative and a served URL before it may display.
export type SuppliedIdentityStatus='filename-candidate-only'|'user-designated-only'|'engine-reference-only';

export type ApprovalRecord={recordId:string;hash:string};

export type SuppliedModelEntry={
literalFilename:string;
catalogModelId:string|null;
role:'truck'|'engine';
identityStatus:SuppliedIdentityStatus;
userDesignatedName?:string;
bytes:number;
sha256:string;
measured?:{textureDims:string;decodedMiB:number;withMipsMiB:number;triangles:number};
/** @deprecated Legacy boolean. Ignored by isRenderable; kept only so existing callers compile. */
renderApproved?:boolean;
/** The authorisation this entry rests on. Resolves to a record in E:/Sitrak-website-assets/approvals/. No record, no render. */
approvalRecord:string|null;
browserUrl:string|null;
note:string;
};

// Build-time preview switch (APPR-2026-10-29-C7H-LOOPBACK-PREVIEW, condition 1): the URL literals
// sit inside this branch so a flag-off build folds them away, and no production build can ever
// carry them. NEXT_PUBLIC_* is inlined at build time, so this is a constant the bundler can erase.
const PREVIEW_REQUESTED=process.env.NEXT_PUBLIC_SITRAK_PREVIEW_3D==='1';
export const suppliedPreviewEnabled=PREVIEW_REQUESTED&&process.env.NODE_ENV!=='production';

export const suppliedModels:SuppliedModelEntry[]=[
 {literalFilename:'c7h.glb',catalogModelId:null,role:'truck',identityStatus:'user-designated-only',userDesignatedName:'SITRAK C7H',bytes:50810436,sha256:'36b75fcf17db57d3af9f638da68295e6450ca9d660de2c8839062abc41b68641',measured:{textureDims:'8192×8192 ×2',decodedMiB:512,withMipsMiB:682.7,triangles:1970454},approvalRecord:'APPR-2026-10-29-C7H-LOOPBACK-PREVIEW',browserUrl:suppliedPreviewEnabled?'/models/c7h.glb':null,note:'UNBOUND BY RULING: the C-series is retired per the user instruction recorded in the approval changelog, 2026-10-31 15:21:51: "User requested these replace the C-series listings"), so this file is bound to no live route. The file stays, the loopback grant stays, the binding goes.'},
 {literalFilename:'g7h.glb',catalogModelId:'g7h',role:'truck',identityStatus:'user-designated-only',userDesignatedName:'SITRAK G7H',bytes:1564996,sha256:'818bc4e3e771cc86146dba6c323f6e4c85557b227d8eb2bc6b5baabd2690f30f',measured:{textureDims:'PNG ×1',decodedMiB:0,withMipsMiB:0,triangles:12286},approvalRecord:'APPR-2026-10-29-C7H-LOOPBACK-PREVIEW',browserUrl:suppliedPreviewEnabled?'/models/g7h.glb':null,note:'User-supplied SITRAK G7H 64480 TT AMT 3D model (g7h.glb, 1.49 MB, one PNG texture, 12,286 triangles), delivered 2026-10-31 with the 64480 spec sheet. Loopback preview only; no variant or specification claim.'},
 {literalFilename:'g7s.glb',catalogModelId:'g7s',role:'truck',identityStatus:'user-designated-only',userDesignatedName:'SITRAK G7S',bytes:1669240,sha256:'b495733cddd31cb26b46632145e8a8631522f3def503bd0eea6cecb8776fd86d',measured:{textureDims:'PNG ×1',decodedMiB:0,withMipsMiB:0,triangles:15918},approvalRecord:'APPR-2026-10-29-C7H-LOOPBACK-PREVIEW',browserUrl:suppliedPreviewEnabled?'/models/g7s.glb':null,note:'User-supplied SITRAK G7S 6×4 tipper 3D model (g7s.glb, 1.59 MB, one PNG texture, 15,918 triangles), delivered 2026-10-31. Loopback preview only; no variant or specification claim.'},
 {literalFilename:'c7_max.glb',catalogModelId:'howo-max',role:'truck',identityStatus:'user-designated-only',userDesignatedName:'HOWO MAX',bytes:49414132,sha256:'ecda8aa34bbb3c1bdf5a74eb7f6c75a964902ae32546d079dccbebcebd5120bd',measured:{textureDims:'8192×8192 ×2',decodedMiB:512,withMipsMiB:682.7,triangles:1975428},approvalRecord:null,browserUrl:null,note:'User-designated HOWO MAX. No body-style, power or build claim. Display blocked until a texture derivative is delivered.'},
 {literalFilename:'-HOWO-T7S-6X4-TIPPER-.glb',catalogModelId:'howo-tapa',role:'truck',identityStatus:'user-designated-only',userDesignatedName:'HOWO 7 tipper',bytes:49585108,sha256:'aa5c222b37aef5e2075874bbfe36b0e228d342b83f89554880da1214b02c39bc',measured:{textureDims:'8192×8192 ×2',decodedMiB:512,withMipsMiB:682.7,triangles:1976446},approvalRecord:null,browserUrl:null,note:'User-designated HOWO 7 tipper. No capacity or spec claim. Display blocked until a texture derivative is delivered.'},
 {literalFilename:'SITRACK G7S TIPPER 6X4.glb',catalogModelId:null,role:'truck',identityStatus:'user-designated-only',userDesignatedName:'SITRAK G7S 6×4 tipper',bytes:72244556,sha256:'a8f1aed6a74336c49310f716be6dd94ced1dffc304fdd5c76eb08b8d7abde492',measured:{textureDims:'8192×8192 ×2',decodedMiB:512,withMipsMiB:682.7,triangles:2124574},approvalRecord:null,browserUrl:null,note:'User-designated ADDITIVE range entry, distinct from the G7S tractor. No catalogue entry yet: specifications and photographs would have to be supplied, not invented.'},
 {literalFilename:'SITRACK_C7h_ENGINE_REFERNCE.glb',catalogModelId:null,role:'engine',identityStatus:'user-designated-only',userDesignatedName:'C7H engine reference',bytes:50194396,sha256:'824361bf0cd4050b7404394766c8567ceebdf7c8f11c3e6f1cb84c5d985614f9',measured:{textureDims:'8192×8192 ×2',decodedMiB:512,withMipsMiB:682.7,triangles:1982476},approvalRecord:'APPR-2026-10-29-C7H-LOOPBACK-PREVIEW',browserUrl:suppliedPreviewEnabled?'/models/engine-reference.glb':null,note:'C7H engine section ONLY — never a whole-truck view. Covered by APPR-2026-10-29-C7H-LOOPBACK-PREVIEW for loopback preview only; served copy must stay byte-identical.'},
];

export function suppliedModelFor(catalogModelId:string):SuppliedModelEntry|null{
 return suppliedModels.find(model=>model.catalogModelId===catalogModelId&&model.role==='truck')??null;
}
export function suppliedEngineModel(){return suppliedModels.find(model=>model.role==='engine')??null}

export function isRenderable(entry:SuppliedModelEntry|null):entry is SuppliedModelEntry&{browserUrl:string}{
 if(!suppliedPreviewEnabled)return false; // production half of the guarantee, enforced where consumers call
 if(!entry)return false;
 // The build-time flag gates the URL itself (browserUrl is null when the flag is off), so a
 // renderable entry already proves the flag was on. No approval record, no render.
 if(!entry.approvalRecord||entry.approvalRecord.trim().length===0)return false;
 return typeof entry.browserUrl==='string'&&entry.browserUrl.length>0;
}
