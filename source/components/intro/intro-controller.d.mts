export type IntroPhase='idle'|'launch'|'impact'|'tagline'|'exit'|'done';
export type IntroController={start():void;skip():void;dispose():void};
export function createIntroController(options?:{onPhase?:(phase:IntroPhase)=>void;onComplete?:(reason:string)=>void;oncePerSession?:boolean;storage?:Pick<Storage,'getItem'|'setItem'>;storageKey?:string;reducedMotion?:boolean}):IntroController;
