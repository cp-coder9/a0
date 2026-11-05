import {findTruck} from '../lib/truck-catalog';
import {rangeModels} from '../lib/truck-range';
export function SelectedTruckSummary({model}:{model:string}){
 if(!model)return null;
 const truck=findTruck(model);
 if(truck)return <section className="selected-truck-summary" aria-label="Selected truck information"><img src={truck.images[0].src} alt={truck.name}/><div><p className="eyebrow gold">Your selected truck</p><h3>{truck.fullName}</h3><p>{truck.config}</p><dl>{truck.technical.slice(0,4).map(row=><div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></div></section>;
 // Range models without a dedicated showroom page still resolve, so a range-card enquiry is prefilled.
 const range=rangeModels.find(entry=>[entry.id,entry.name,entry.sheetName].includes(model));
 if(!range)return null;
 const rows=[['Rated power',range.summary.power],['Emission',range.summary.euro],['Transmission',range.summary.transmission],['Drive',range.summary.drive]].filter(([,value])=>!!value);
 return <section className="selected-truck-summary" aria-label="Selected truck information"><img src={range.image} alt={range.name}/><div><p className="eyebrow gold">Your selected truck</p><h3>{range.name}</h3><p>{range.variant}</p><dl>{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div></section>;
}
