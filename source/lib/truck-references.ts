export type ReferencePhoto={src:string;title:string;caption:string;sourceLabel:string;sourceUrl:string};
export type ReferenceTour={url:string;cockpitUrl?:string;title:string;caption:string;sourceLabel:string;sourceUrl:string};
export type TruckReferences={panorama?:{src:string};cockpit?:ReferencePhoto;engine?:ReferencePhoto;tour?:ReferenceTour};
// Research references, not certification of the exact locally supplied build. G7H/G7S have no
// verified interior or engine media yet, so their cabin tab honestly reports "not available".
export const truckReferences:Record<string,TruckReferences>={
 'g7h':{},
 'g7s':{},
 'howo-tapa':{tour:{url:'https://www.720yun.com/vr/23920uavxcg',cockpitUrl:'https://www.720yun.com/vr/23920uavxcg?s=4310595',title:'HOWO-7 manufacturer walkthrough',caption:'6×4 tractor reference, not the offered 290hp tipper. Actual left-hand-drive panorama hosted by third-party 720yun, separate from our WebGPU exterior illustration. Local trim and steering side are not confirmed by this tour.',sourceLabel:'SINOTRUK · HOWO-7',sourceUrl:'https://en.sinotrukinternational.com/en-sinotrukinternational/cp/zk/howo-nx86/index.html'}},
 'howo-max':{panorama:{src:'/assets/panoramas/howo-max-cabin-360.jpg'},cockpit:{src:'/assets/references/howo-max-cockpit.webp',title:'HOWO MAX cockpit reference',caption:'Actual manufacturer cab photograph: left-hand-drive reference. Local steering side and trim must be confirmed. This is a zoomable photo, not a 360° panorama or 3D reconstruction.',sourceLabel:'SINOTRUK · HOWO-MAX',sourceUrl:'https://en.sinotrukinternational.com/en-sinotrukinternational/cp/zk/howo-tx32/index.html'},engine:{src:'/assets/references/howo-max-engine.webp',title:'HOWO MAX engine reference',caption:'Manufacturer engine-assembly reference. The product family has several engine options; this photograph does not establish the engine fitted to the offered unit.',sourceLabel:'SINOTRUK · HOWO-MAX',sourceUrl:'https://en.sinotrukinternational.com/en-sinotrukinternational/cp/zk/howo-tx32/index.html'}},
};
