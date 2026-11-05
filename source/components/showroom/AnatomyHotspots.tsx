'use client';
import {useState} from 'react';
import type {KeyboardEvent} from 'react';
import {truckCatalog} from '../../lib/truck-catalog';
import {heroTrucks} from '../../lib/hero-trucks';
import {TruckModel3D} from './TruckModel3D';
import {derivativeKeyForTruck} from './model-derivatives';
import './anatomy-hotspots.css';

type Anchor='start'|'end';
type Hotspot={id:string;label:string;title:string;value:string;detail:string;x:number;y:number;anchor:Anchor};
type Anatomy={id:string;name:string;config:string;image:string;alt:string;width:number;height:number;lead:string;hotspots:Hotspot[]};

function spec(truckId:string,label:string){
 const truck=truckCatalog.find(entry=>entry.id===truckId);
 return truck?.technical.find(row=>row.label===label)?.value??'';
}
function hero(truckId:string){return heroTrucks.find(truck=>truck.id===truckId)}

// The annotated section needs cut-outs with a transparent background; the range-card photos carry a
// baked dark background, which shows as a black square against this section's navy panel.
const TRANSPARENT_IMAGE:Record<string,string>={
 'g7h':'/assets/g7h.png',
 'g7s':'/assets/g7s.png',
 'howo-max':'/assets/howo-max-front.png',
 'howo-64330-tipper':'/assets/trucks/howo-64330-tipper.webp',
};

function buildAnatomy(id:string,lead:string,hotspots:Hotspot[]):Anatomy{
 const truck=hero(id);
 return {
  id,
  name:truck?.name??id,
  config:truck?.specification??'',
  image:TRANSPARENT_IMAGE[id]??truck?.image??'/assets/g7h.png',
  alt:truck?.alt??truck?.name??id,
  width:2048,
  height:2048,
  lead,
  hotspots,
 };
}

const anatomy:Anatomy[]=[
 buildAnatomy('g7h','The G7H 64480, annotated where it counts. Use the arrows to move through the range, then select a hotspot to read each published figure.',[
  {id:'rated-power',label:'480 hp',title:'Rated power',value:spec('g7h','Rated power'),detail:'The MC13,48 diesel is rated at 480 hp (353 kW) on the published G7H 64480 configuration.',x:26,y:52,anchor:'start'},
  {id:'peak-torque',label:'2 300 Nm',title:'Peak torque',value:spec('g7h','Peak torque'),detail:'Peak torque is quoted from 1050 to 1400 rpm: the band that matters on a long climb.',x:37,y:60,anchor:'start'},
  {id:'transmission',label:'12-speed AMT',title:'Transmission',value:spec('g7h','Transmission'),detail:'A 12-speed automated manual, so the long haul is not left hunting for a gear.',x:52,y:72,anchor:'end'},
  {id:'gcm',label:'65 T GCM',title:'Gross combination mass',value:spec('g7h','Gross combination mass'),detail:'Rated to a 65,000 kg gross combination mass, with the vehicle itself listed at 34,000 kg GVM.',x:64,y:64,anchor:'start'},
  {id:'configuration',label:'6×4 tractor',title:'Configuration',value:spec('g7h','Configuration'),detail:'A 6×4 long-haul tractor with air suspension, as published for the G7H 64480.',x:82,y:71,anchor:'end'},
 ]),
 buildAnatomy('g7s','The G7S 64480, annotated where it counts. Use the arrows to move through the range, then select a hotspot to read each published figure.',[
  {id:'rated-power',label:'480 hp',title:'Rated power',value:spec('g7s','Rated power'),detail:'The published G7S 64480 uses the 12.419-litre MC13,48, rated at 480 hp (353 kW).',x:26,y:52,anchor:'start'},
  {id:'peak-torque',label:'2 300 Nm',title:'Peak torque',value:spec('g7s','Peak torque'),detail:'2300 Nm from 1050 to 1400 rpm on the published Euro 3 configuration.',x:37,y:62,anchor:'start'},
  {id:'gcm',label:'80 T GCM',title:'Gross combination mass',value:spec('g7s','Gross combination mass'),detail:'The published G7S 64480 is listed at 80,000 kg GCM and 25,000 kg GVM — GCM is not payload.',x:62,y:70,anchor:'start'},
  {id:'configuration',label:'6×4 tractor · air',title:'Configuration',value:spec('g7s','Configuration'),detail:'A 6×4 long-haul tractor on air suspension: the published G7S 64480 configuration.',x:80,y:60,anchor:'end'},
 ]),
 buildAnatomy('howo-max','The HOWO MAX 64480, annotated where it counts. Use the arrows to move through the range, then select a hotspot to read each published figure.',[
  {id:'rated-power',label:'480 hp',title:'Rated power',value:spec('howo-max','Rated power'),detail:'The published MC13.48-30 is rated at 480 hp (353 kW) in the MAX 64480.',x:34,y:50,anchor:'start'},
  {id:'peak-torque',label:'2 300 Nm',title:'Peak torque',value:spec('howo-max','Peak torque'),detail:'2300 Nm @ 1050–1400 rpm on the published Euro 3 configuration.',x:31,y:64,anchor:'start'},
  {id:'engine',label:'MC13.48-30',title:'Engine',value:spec('howo-max','Engine'),detail:'A 12,419 cc six-cylinder in-line, water-cooled, Euro 3 — as published for the MAX 64480.',x:45,y:73,anchor:'start'},
  {id:'gearbox',label:'16-speed AMT',title:'Transmission',value:spec('howo-max','Transmission'),detail:'The published MAX 64480 uses a HW16-HD27 automated manual with 16 forward gears.',x:58,y:82,anchor:'end'},
  {id:'configuration',label:'6×4 tractor',title:'Configuration',value:spec('howo-max','Configuration'),detail:'A 6×4 long-haul tractor. The published page states cab suspension only; rear suspension is not confirmed.',x:74,y:66,anchor:'end'},
 ]),
 buildAnatomy('howo-64330-tipper','The HOWO TX 64330, annotated where it counts. Use the arrows to move through the range, then select a hotspot to read each published figure.',[
  {id:'rated-power',label:'330 hp',title:'Rated power',value:spec('howo-64330-tipper','Rated power'),detail:'The published MC07.33 is rated at 330 hp (248 kW) for the 6×4 64330 tipper.',x:30,y:48,anchor:'start'},
  {id:'body',label:'12 m³ body',title:'Tipper body',value:spec('howo-64330-tipper','Tipper body'),detail:'The published dealer unit carries a 12 m³ body; the attached bulletin lists a 10 CBM body.',x:66,y:52,anchor:'start'},
  {id:'torque',label:'1 250 Nm',title:'Peak torque',value:spec('howo-64330-tipper','Peak torque'),detail:'1250 Nm @ 1200–1800 rpm on the published Euro 3 configuration.',x:55,y:66,anchor:'end'},
  {id:'transmission',label:'10-speed AMT',title:'Transmission',value:spec('howo-64330-tipper','Transmission'),detail:'A HW15710A automated manual with 10 forward gears, as published for the 64330.',x:44,y:80,anchor:'start'},
  {id:'configuration',label:'6×4 tipper',title:'Configuration',value:spec('howo-64330-tipper','Configuration'),detail:'A 6×4 tipper chassis, published for construction and mining work.',x:74,y:82,anchor:'end'},
 ]),
];

function pad(value:number){return String(value).padStart(2,'0')}
function ordinal(index:number){return pad(index+1)}

export function AnatomyHotspots(){
 const [position,setPosition]=useState(0);
 const article=anatomy[position];
 const [active,setActive]=useState<string|null>(article.hotspots[0]?.id??null);
 const [show3d,setShow3d]=useState(false);
 const activeIndex=article.hotspots.findIndex(hotspot=>hotspot.id===active);
 const current=activeIndex>=0?article.hotspots[activeIndex]:undefined;
 const side=current?(current.x<50?'left':'right'):'left';
 const derivative=derivativeKeyForTruck(article.id,article.name);
 function go(step:number){
  const next=(position+step+anatomy.length)%anatomy.length;
  setPosition(next);
  setActive(anatomy[next].hotspots[0]?.id??null);
  setShow3d(false);
 }
 function handleKeyDown(event:KeyboardEvent<HTMLElement>){
  if(event.key==='Escape'){setActive(null);return}
  if(event.key==='ArrowLeft'){event.preventDefault();go(-1)}
  if(event.key==='ArrowRight'){event.preventDefault();go(1)}
 }
 return <section id="the-anatomy" data-screen-label="The range, annotated" className="anatomy-band" aria-labelledby="anatomy-title" onKeyDown={handleKeyDown} data-model={article.id}>
  <div className="anatomy-inner">
   <div className="anatomy-heading">
    <p className="eyebrow gold">The {article.name}, annotated</p>
    <h2 id="anatomy-title">The range,<br/>{' '}annotated.</h2>
    <p className="anatomy-lead">{article.lead}</p>
   </div>
   <div className="anatomy-stage" role="group" aria-roledescription="carousel" aria-label="Annotated truck range">
    <div className="anatomy-carousel">
     <button type="button" className="anatomy-arrow is-prev" aria-label="Previous truck" onClick={()=>go(-1)}><span aria-hidden="true">←</span></button>
     <figure className="anatomy-figure" style={{aspectRatio:`${article.width} / ${article.height}`}}>
      <img src={article.image} alt={article.alt} loading="lazy" decoding="async"/>
      {current&&<span className={side==='left'?'anatomy-leader is-left':'anatomy-leader is-right'} style={{top:`${current.y}%`,['--hotspot-x' as string]:`${current.x}%`} as React.CSSProperties} aria-hidden="true" key={`line-${current.id}`}/>}
      {current&&<div className={side==='left'?'anatomy-callout is-left':'anatomy-callout is-right'} style={{top:`${current.y}%`}} aria-live="polite" aria-atomic="true" key={current.id}>
       <p className="anatomy-callout-eyebrow">{ordinal(activeIndex)} / {current.title}</p>
       <p className="anatomy-callout-value">{current.value}</p>
       <p className="anatomy-callout-copy">{current.detail}</p>
      </div>}
      <div className="anatomy-hotspots">
       {article.hotspots.map((hotspot,index)=><button key={hotspot.id} type="button" className={hotspot.anchor==='end'?'anatomy-hotspot is-end':'anatomy-hotspot'} style={{left:`${hotspot.x}%`,top:`${hotspot.y}%`}} aria-label={`${hotspot.title}: ${hotspot.label}`} aria-expanded={active===hotspot.id} aria-controls="anatomy-hotspot-detail" onClick={()=>setActive(hotspot.id)} onFocus={()=>setActive(hotspot.id)}>
        <span className="anatomy-hotspot-dot" aria-hidden="true">{ordinal(index)}</span>
        <span className="anatomy-hotspot-label">{hotspot.label}</span>
       </button>)}
      </div>
     </figure>
     <button type="button" className="anatomy-arrow is-next" aria-label="Next truck" onClick={()=>go(1)}><span aria-hidden="true">→</span></button>
    </div>
    <p className="anatomy-position" aria-live="polite">{ordinal(position)} / {pad(anatomy.length)} · {article.name}</p>
    {derivative&&<div className="anatomy-model">
     <button type="button" className="anatomy-model-toggle" aria-expanded={show3d} onClick={()=>setShow3d(value=>!value)}>{show3d?'Hide the 3D model':`Walk around the ${article.name} in 3D`} <span aria-hidden="true">{show3d?'−':'↗'}</span></button>
     {show3d&&<TruckModel3D derivativeKey={derivative} modelName={article.name} compact/>}
    </div>}
    <div className="anatomy-detail" id="anatomy-hotspot-detail" role="status" aria-live="polite" aria-atomic="true">
     {current
      ? <><p className="anatomy-detail-eyebrow">{ordinal(activeIndex)} / {current.title}</p><p className="anatomy-detail-value">{current.value}</p><p className="anatomy-detail-copy">{current.detail}</p></>
      : <p className="anatomy-detail-copy">Select a hotspot on the truck to read the published figure.</p>}
    </div>
   </div>
  </div>
 </section>;
}
