'use client';
import {tourScenes,type TourState,type TourAction} from '../lib/truck-tour';
export function TruckTourNavigation({state,action,previews={}}:{state:TourState;action:(action:TourAction)=>void;previews?:Record<number,string>}){
 return <div className="tour-navigation" aria-label="Guided scene navigation">
  <div className="tour-navigation-bar"><button type="button" aria-label="Previous scene" onClick={()=>action({type:'previous'})}>← Previous</button><output aria-live="polite">{state.scene+1} / 7 · {tourScenes[state.scene].name}</output><button type="button" aria-label="Next scene" onClick={()=>action({type:'next'})}>Next →</button><button type="button" aria-expanded={state.list} onClick={()=>action({type:'list'})}>List</button>{state.scene===6&&<button type="button" onClick={()=>action({type:'return'})}>Return to 3D exterior</button>}</div>
  {state.list&&<div className="tour-scene-strip" aria-label="Scenes">{tourScenes.map((scene,index)=><button key={scene.name} type="button" aria-label={`Scene: ${scene.name}`} aria-pressed={state.scene===index} onClick={()=>action({type:'select',scene:index})}>{previews[index]?<img src={previews[index]} alt=""/>:<span className="tour-scene-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>}<span>{scene.name}</span></button>)}</div>}
 </div>;
}
