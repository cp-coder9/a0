'use client';
import {Component,useEffect,useState,type ReactNode,type MouseEvent} from 'react';
import {findTruck} from '../../lib/truck-catalog';
import {rangeModelById,type RangeModel} from '../../lib/truck-range';
import {truckReferences} from '../../lib/truck-references';
import {CabinPanorama} from '../CabinPanorama';
import {TruckExteriorGallery} from './TruckExteriorGallery';
import {SuppliedGlbViewer} from './SuppliedGlbViewer';
import {TruckModel3D} from './TruckModel3D';
import {derivativeKeyForTruck} from './model-derivatives';
import {isRenderable,suppliedEngineModel,suppliedModelFor} from './supplied-models';
import {EnquiryButton} from '../Enquiry';
import './showroom.css';

const views=['model','images','cabin','engine','specifications'] as const;
type View=typeof views[number];
const VIEW_LABEL:Record<View,string>={model:'3D model',images:'Images',cabin:'Cabin',engine:'Engine',specifications:'Specifications'};
const readView=(available:readonly View[]):View=>{const hash=location.hash.slice(1) as View;return available.includes(hash)?hash:available[0]};

type SpecRow={label:string;value:string};
type SpecGroup={id:string;title:string;rows:SpecRow[]};
type ShowroomModel={
 id:string;name:string;fullName:string;config:string;variant?:string;
 images:{src:string;label:string;position?:string;fit?:'cover'|'contain'}[];
 technical:SpecRow[];groups:SpecGroup[];note?:string;
 match?:string;matchNote?:string;imageNote?:string;
};

/** The catalogue keeps the original four trucks; everything else comes from the bulletin range. */
function loadModel(id:string):ShowroomModel|null{
 const truck=findTruck(id);
 if(truck)return {id:truck.id,name:truck.name,fullName:truck.fullName,config:truck.config,variant:truck.variant,images:truck.images,technical:truck.technical,groups:[{id:'spec',title:'Specification',rows:truck.technical}],note:truck.note};
 const model=rangeModelById(id);
 if(!model)return null;
 return fromRange(model);
}

function fromRange(model:RangeModel):ShowroomModel{
 const technical=model.groups.flatMap(group=>group.rows);
 return {
  id:model.id,name:model.name,fullName:model.sheetName,config:model.variant,variant:model.summary.application??undefined,
  images:[{src:model.image,label:'Published dealer image'}],
  technical,groups:model.groups,
  note:[model.matchNote,model.imageNote,...model.caveats].filter(Boolean).join(' '),
  match:model.match,matchNote:model.matchNote,imageNote:model.imageNote,
 };
}

/** The supplied 3D models are registered against the original catalogue ids. */
function suppliedKey(model:ShowroomModel):string|null{
 if(model.id==='g7h'||/^SITRAK G7H/i.test(model.name))return 'g7h';
 if(model.id==='g7s'||/^SITRAK G7S/i.test(model.name))return 'g7s';
 if(model.id==='howo-max'||/^HOWO MAX/i.test(model.name))return 'howo-max';
 if(model.id==='howo-tapa')return 'howo-tapa';
 return null;
}

const MATCH_LABEL:Record<string,string>={
 exact:'Published specification',
 closest:'Closest published configuration — figures are the published adjacent unit',
 'not-published':'Specification not published by the dealer',
};

class ViewerBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<p className="showroom-view-status" role="status">The 3D viewer could not load. The images, specifications and the model-prefilled enquiry remain available.</p>:this.props.children;}
}

export function TruckShowroom({truckId,embedded=false}:{truckId:string;embedded?:boolean}){
 const model=loadModel(truckId);
 const key=model?suppliedKey(model):null;
 const derivative=model?derivativeKeyForTruck(model.id,model.name):null;
 const supplied=key?suppliedModelFor(key):null;
 // The "3D model" mode is offered only when a model can actually be shown: an optimised
 // derivative exists, or the legacy supplied entry is renderable. Without this the HOWO MAX
 // (which has no supplied model) carried a tab whose only content was "on its way".
 const modelAvailable=Boolean(derivative)||Boolean(supplied&&isRenderable(supplied));
 const availableViews:View[]=views.filter(value=>value!=='model'||modelAvailable);
 const availableKey=availableViews.join('|');
 const [view,setView]=useState<View>(availableViews[0]);
 const [cabinFailed,setCabinFailed]=useState(false),[cabinAttempt,setCabinAttempt]=useState(0);
 useEffect(()=>{
  const available=availableKey.split('|') as View[];
  const sync=()=>{setView(readView(available));setCabinFailed(false);};
  sync();
  window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);
  return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync);};
 },[availableKey]);
 if(!model)return <div className="truck-showroom"><p className="showroom-view-status" role="status">This model is not in the range yet.</p></div>;
 const references=(key?truckReferences[key]:undefined)??{};
 const engineModel=suppliedEngineModel();
 function navigate(next:View,event?:MouseEvent<HTMLAnchorElement>){
  if(event&&(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey))return;
  event?.preventDefault();if(!embedded&&view!==next)history.pushState(null,'',`#${next}`);setView(next);setCabinFailed(false);
 }
 const configParts=model.config.split('·').map(part=>part.trim());
 const configuration=configParts[0]||'';
 const application=configParts[1]||'Long haul';
 const eyebrow=`THE RANGE / ${application.toUpperCase()}`;
 const engineGroup=model.groups.find(group=>group.id==='engine');
 const engineRows=engineGroup?engineGroup.rows:model.technical.filter(row=>/engine|power|torque|transmission|gear|fuel|cylinder|displacement|driveline/i.test(`${row.label} ${row.value}`));
 const content=(<>
  <div className="truck-model-heading"><div><p className="eyebrow gold">{eyebrow}</p><h1>{model.name}</h1><p>{model.fullName} · {model.config}</p>{model.match&&<p className={`showroom-range-match showroom-range-match--${model.match}`}>{MATCH_LABEL[model.match]??model.match}</p>}</div><div className="truck-heading-actions"><EnquiryButton model={model.name} label={`Enquire about this ${model.name}`}>Enquire about this {model.name} <span aria-hidden="true">→</span></EnquiryButton><a className="button ghost" href="tel:0820748725">Call the dealership</a></div></div>
  <nav className="showroom-view-tabs" aria-label={`${model.name} exploration modes`}>{availableViews.map(value=><a key={value} href={`#${value}`} aria-current={view===value?'page':undefined} onClick={event=>navigate(value,event)}>{VIEW_LABEL[value]}</a>)}</nav>
  <div className="truck-view-layout"><section className="truck-view-main" aria-label={`${VIEW_LABEL[view]} view`}>
   {modelAvailable&&view==='model'&&<>
    {derivative
     ? <TruckModel3D derivativeKey={derivative} modelName={model.name}/>
     : supplied&&isRenderable(supplied)
      ? <ViewerBoundary><SuppliedGlbViewer modelId={key??truckId} modelName={model.name} entry={supplied}/></ViewerBoundary>
      : <div className="showroom-model-pending"><figure className="showroom-engine-photo"><img src={model.images[0].src} alt={`${model.name} ${model.config}`}/><figcaption><strong>{model.name}</strong><span>{model.imageNote??'Published dealer image. A 3D model for this truck is being prepared.'}</span></figcaption></figure><p className="showroom-view-status" role="status">The interactive 3D model for the {model.name} is on its way. The dealer image and the published specification are available now.</p></div>}
   </>}
   {view==='images'&&<>
    {model.images.length>1
     ? <TruckExteriorGallery truck={model as never}/>
     : <figure className="showroom-engine-photo"><img src={model.images[0].src} alt={`${model.name} ${model.config}`}/><figcaption><strong>{model.name}</strong><span>{model.imageNote??'Published dealer image'}</span></figcaption></figure>}
    {model.imageNote&&<p className="showroom-caveat">{model.imageNote}</p>}
   </>}
   {view==='cabin'&&<div className="showroom-cabin-main">{references.panorama?cabinFailed?<div className="showroom-view-status"><p role="status">Cabin view unavailable. Retry or continue to specifications.</p><button type="button" className="button ghost" onClick={()=>{setCabinAttempt(value=>value+1);setCabinFailed(false);}}>Retry cabin view</button></div>:<ViewerBoundary key={cabinAttempt}><CabinPanorama src={references.panorama.src} modelName={model.name} onImageFailure={()=>setCabinFailed(true)}/></ViewerBoundary>:<div className="showroom-view-status"><p role="status">A 360° interior panorama is not yet available for the {model.name}. Explore the exterior and specifications, or ask the dealership for interior photography.</p><button type="button" className="button ghost" onClick={()=>navigate('specifications')}>Continue to specifications</button></div>}</div>}
   {view==='engine'&&<div className="showroom-engine-main">
    {references.engine
     ? <figure className="showroom-engine-photo"><img src={references.engine.src} alt={`${model.name} engine reference`}/><figcaption><strong>{references.engine.title}</strong><span>{references.engine.caption}</span><a href={references.engine.sourceUrl} target="_blank" rel="noopener noreferrer">Source: {references.engine.sourceLabel} ↗</a></figcaption></figure>
     : <div className="showroom-view-status"><p role="status">Engine photography for the {model.name} has not been supplied yet. The engine specification below is from the published dealer figures.</p></div>}
    {engineRows.length>0
     ? <table className="spec-table"><caption className="sr-only">{model.name} engine specification</caption><tbody>{engineRows.map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody></table>
     : <p className="showroom-caveat">Engine and driveline specification for the {model.name} is not yet on file.</p>}
    <p className="showroom-caveat">Engine and driveline figures are published dealer references.</p>
   </div>}
   {view==='specifications'&&<div className="showroom-specs"><h2>Specification reference</h2><p>Published dealer figures for this configuration.</p>{model.groups.map(group=><div key={group.id} className="showroom-spec-group"><h3>{group.title}</h3><table className="spec-table"><caption className="sr-only">{model.name} {group.title}</caption><tbody>{group.rows.map(row=><tr key={`${group.id}-${row.label}`}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody></table></div>)}{model.note&&<p className="showroom-caveat">{model.note}</p>}</div>}
  </section><aside className="truck-model-aside"><h2>A defined starting point.</h2><p>Explore first. Then discuss the trailer, route and load with the dealership.</p><dl><dt>Configuration</dt><dd>{configuration}</dd><dt>Application</dt><dd>{application}</dd>{model.variant&&<><dt>Variant reference</dt><dd>{model.variant}</dd></>}</dl><p>Sales, parts and service in Mbombela and Benoni.</p><a href="/#the-range">Compare the range <span aria-hidden="true">↗</span></a></aside></div>
 </>);
 return embedded?<div className="truck-showroom truck-showroom-embedded">{content}</div>:<main id="main" className="truck-showroom">{content}</main>;
}
