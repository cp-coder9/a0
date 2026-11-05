export type TargetFlags={astcSupported:boolean;bptcSupported:boolean;dxtSupported:boolean;etc2Supported:boolean;etc1Supported:boolean;pvrtcSupported:boolean};
export type UastcTarget={name:string;bytesPerTexel:number;compressed:boolean};
export declare const TARGETS:UastcTarget[];
export declare const RGBA32_FALLBACK:UastcTarget;
export declare function selectUastcTarget(flags:TargetFlags,size?:{width:number;height:number}):UastcTarget;
export declare function budgetBytes(width:number,height:number,target:UastcTarget|null,faces?:number):number;
