import type {CatalogTruck} from '../lib/truck-catalog';
import {technicalDescriptions} from '../lib/truck-technical';
export function TruckTechnicalDescription({truck}:{truck:CatalogTruck}){
 const description=technicalDescriptions[truck.id];
 return <div className="truck-technical-description"><p className="eyebrow gold">The truck, in detail</p><h3>{description.heading}</h3><p className="truck-technical-lead">{description.lead}</p><p className="truck-technical-model">{truck.fullName}</p><table className="spec-table"><tbody>{truck.technical.map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody></table><div className="truck-technical-tags">{description.tags.map(tag=><span className="spec-pill" key={tag}>{tag}</span>)}</div>{truck.note&&<p className="truck-spec-note">{truck.note}</p>}</div>;
}
