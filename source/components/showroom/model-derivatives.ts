// Optimised derivatives of the user-supplied GLB models.
//
// Each supplied model is delivered twice by glTF-Transform (see _glb-report.json):
//   - desktop: geometry quantised (KHR_mesh_quantization), textures WebP at max 2048², no simplification
//   - mobile:  same, textures WebP at max 1024², geometry simplified, borders locked
//
// The viewer (glb-loader.ts) has no Draco/Meshopt decoder, so neither derivative uses those
// codecs. Both are plain glTF 2.0 that any WebGL2 browser can open.
export type DerivativeKey='g7h'|'g7s'|'howo-tipper'|'howo-mixer'|'howo-water';

export type ModelDerivative={
 /** Full-detail derivative, served to desktop browsers. */
 desktop:string;
 /** Low-bandwidth derivative, served to phones and to clients asking to save data. */
 mobile:string;
 /** What the derivative is, in the dealer's own terms. No specification claim. */
 label:string;
};

export const modelDerivatives:Record<DerivativeKey,ModelDerivative>={
 'g7h':{desktop:'/models/g7h-desktop.glb',mobile:'/models/g7h-mobile.glb',label:'SITRAK heavy truck'},
 'g7s':{desktop:'/models/g7s-desktop.glb',mobile:'/models/g7s-mobile.glb',label:'SITRAK heavy-duty tractor'},
 'howo-tipper':{desktop:'/models/howo-tipper-desktop.glb',mobile:'/models/howo-tipper-mobile.glb',label:'HOWO dump truck'},
 'howo-mixer':{desktop:'/models/howo-mixer-desktop.glb',mobile:'/models/howo-mixer-mobile.glb',label:'Concrete mixer'},
 'howo-water':{desktop:'/models/howo-water-desktop.glb',mobile:'/models/howo-water-mobile.glb',label:'Water tanker'},
};

export function isDerivativeKey(value:string|null|undefined):value is DerivativeKey{
 return typeof value==='string'&&Object.prototype.hasOwnProperty.call(modelDerivatives,value);
}

export function derivativeFor(value:string|null|undefined):ModelDerivative|null{
 return isDerivativeKey(value)?modelDerivatives[value]:null;
}

/** Family key for a range entry: the body type decides which supplied model fits. */
export function derivativeKeyForTruck(id:string,name?:string):DerivativeKey|null{
 if(id==='g7h'||/^SITRAK G7H/i.test(name??''))return 'g7h';
 if(id==='g7s'||/^SITRAK G7S/i.test(name??''))return 'g7s';
 if(/tipper/i.test(id))return 'howo-tipper';
 if(/water/i.test(id))return 'howo-water';
 if(/mixer/i.test(id))return 'howo-mixer';
 return null;
}

export type NetworkHint={saveData?:boolean;effectiveType?:string;maxTouchPoints?:number};

/**
 * Pick the derivative for this client. Save-Data and slow connections always win; otherwise a
 * narrow viewport (a phone held upright) gets the small file. Unknown values fall back to the
 * desktop derivative, which is the complete one.
 */
export function pickDerivativeModel(derivative:ModelDerivative,network?:NetworkHint,viewportWidth?:number):{url:string;variant:'desktop'|'mobile'}{
 const slow=network?.saveData===true||/^(slow-2g|2g|3g)$/.test(network?.effectiveType??'');
 const narrow=(viewportWidth??Number.POSITIVE_INFINITY)<768;
 if(slow||narrow)return {url:derivative.mobile,variant:'mobile'};
 return {url:derivative.desktop,variant:'desktop'};
}
