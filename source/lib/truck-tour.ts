export const tourScenes=[
 {name:'Front left',position:[-7,4.6,-9]},
 {name:'Front',position:[0,3.6,-11]},
 {name:'Front right',position:[7,4.6,-9]},
 {name:'Right',position:[11,3.7,.5]},
 {name:'Rear',position:[0,4.6,12]},
 {name:'Left',position:[-11,3.7,.5]},
 {name:'Interior',position:null},
] as const;
export type TourState={scene:number;lastExterior:number;list:boolean};
export const initialTour=():TourState=>({scene:0,lastExterior:0,list:true});
export type TourAction={type:'next'|'previous'|'return'|'list'}|{type:'select';scene:number};
export function tourReducer(state:TourState,action:TourAction):TourState{
 if(action.type==='list')return {...state,list:!state.list};
 const scene=action.type==='return'?state.lastExterior:action.type==='select'?action.scene:(state.scene+(action.type==='next'?1:6))%7;
 if(!Number.isInteger(scene)||scene<0||scene>=tourScenes.length)return state;
 return {...state,scene,lastExterior:scene===6?state.lastExterior:scene};
}
