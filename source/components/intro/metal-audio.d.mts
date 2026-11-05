export type MetalAudio={setEnabled(value:boolean):Promise<boolean>;play():void;dispose():void};
export function createMetalAudio():MetalAudio;
