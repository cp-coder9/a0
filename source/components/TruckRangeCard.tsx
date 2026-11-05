'use client';
import {findTruck} from '../lib/truck-catalog';
import {TruckGallery} from './TruckGallery';
import {useTruckDetails} from './TruckExperience';
import {EnquiryButton} from './Enquiry';
export function TruckRangeCard({truckId}:{truckId:string}){
 const truck=findTruck(truckId),open=useTruckDetails();if(!truck)return null;
 const badge=truck.id==='g7h'?'Flagship':(truck.id==='howo-tapa'||truck.id==='g7s')?'Workhorse':undefined;
 return <article className="truck-card"><TruckGallery truck={truck} badge={badge} onInspect={()=>open(truck.id)}/><div className="truck-content"><p className="eyebrow sky">{truck.config}</p><h3>{truck.fullName}</h3><div className="truck-specs">{truck.stats.map(stat=><span key={stat.label}>{stat.value}{stat.unit&&` ${stat.unit}`}</span>)}</div><div className="truck-card-actions"><button type="button" className="truck-spec-link" onClick={event=>open(truck.id,event.currentTarget)}>Technical specifications <span aria-hidden="true">↗</span></button><EnquiryButton model={truck.model} label={`Enquire now about ${truck.name}`} className="button primary">Enquire now <span aria-hidden="true">→</span></EnquiryButton></div></div></article>;
}
