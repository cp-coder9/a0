'use client';
import {rangeModels} from '../../lib/truck-range';
import {EnquiryButton} from '../Enquiry';
import {useShowroom} from '../TruckExperience';
import './showroom.css';

// The range is the SINOTRUK SA dealer bulletin (SALES-2026/02): the models that can actually be
// ordered. Truck images are the dealer shots cut out onto the site's dark background.
// Match labels keep the specification honest where the bulletin model differs from the published
// dealer configuration — see lib/truck-range.ts for the rules.
const MATCH_LABEL:Record<string,{label:string;hint:string}>={
 exact:{label:'Published specification',hint:'Published on the SINOTRUK dealer site for this exact model and configuration.'},
 closest:{label:'Closest published configuration',hint:'The dealer site publishes a different configuration for this model number; the figures shown are that published unit.'},
 'not-published':{label:'Specification not published',hint:'The dealer site does not publish this configuration. Figures are not available yet.'},
};

export function ShowroomDiscovery(){
 const openShowroom=useShowroom();
 const cards=rangeModels.map((truck,index)=>{
  const match=MATCH_LABEL[truck.match]??MATCH_LABEL['not-published'];
  const specLine=[truck.summary.power,truck.summary.transmission].filter(Boolean).join(' · ');
  return <article className={`showroom-range-card ${index===0?'showroom-featured':''}`} key={truck.id}>
   <div className="showroom-range-image"><img src={truck.image} alt={`${truck.name} ${truck.variant}`} fetchPriority={index===0?'high':'auto'} loading={index===0?'eager':'lazy'}/><span className="showroom-model-index">{String(index+1).padStart(2,'0')} / {truck.name}</span></div>
   <div className="showroom-range-copy">
    <p className="eyebrow sky">{truck.category} · {truck.brand}</p>
    <h2>{truck.name}</h2>
    <p>{truck.variant}</p>
    {specLine&&<p className="showroom-range-spec">{specLine}</p>}
    <p className={`showroom-range-match showroom-range-match--${truck.match}`} title={match.hint}>{match.label}</p>
    <div className="showroom-range-actions">
     <EnquiryButton model={truck.name} label={`Enquire about ${truck.name}`} className="button primary">Enquire <span aria-hidden="true">→</span></EnquiryButton>
     <button type="button" className="showroom-text-action" onClick={()=>openShowroom?.(truck.id)} aria-label={`Full specifications for ${truck.name}`}>Specifications <span aria-hidden="true">→</span></button>
    </div>
   </div>
  </article>;
 });
 return <section id="the-range" data-screen-label="02 The range" className="showroom-discovery" aria-labelledby="showroom-range-title">
  <div className="showroom-range-heading"><p className="eyebrow gold">TRUK AFRIK / THE TRUCK RANGE</p><h2 id="showroom-range-title">Choose the truck<br/>{' '}for your work.</h2><p>Long-haul tractors and construction trucks from the current SINOTRUK South Africa range. Specifications are the published dealer figures.</p></div>
  <div className="showroom-range-marquee" role="group" aria-label="Truck range gallery">
   <div className="showroom-range-track">
    <div className="showroom-range-group">{cards}</div>
    <div className="showroom-range-group" aria-hidden="true" inert={true}>{cards}</div>
   </div>
  </div>
 </section>;
}
