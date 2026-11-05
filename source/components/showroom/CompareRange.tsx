'use client';
import type {CatalogTruck} from '../../lib/truck-catalog';
import {truckCatalog} from '../../lib/truck-catalog';
import {heroTrucks} from '../../lib/hero-trucks';
import './compare-range.css';

// Supplied catalog values only. A missing row is shown as a dash, never invented.
const MISSING='—';

// Compare the four featured bulletin trucks (the hero range) rather than every retained page.
const compared=heroTrucks.map(hero=>truckCatalog.find(truck=>truck.id===hero.id)).filter((truck):truck is CatalogTruck=>!!truck);
const modelNames=compared.map(truck=>truck.name);
const captionList=modelNames.length>1?`${modelNames.slice(0,-1).join(', ')} and ${modelNames[modelNames.length-1]}`:modelNames.join('');

function collectLabels(trucks:CatalogTruck[]){
 const labels:string[]=[];
 for(const truck of trucks){
  for(const row of truck.technical){
   if(!labels.includes(row.label))labels.push(row.label);
  }
 }
 return labels;
}

function valueFor(truck:CatalogTruck,label:string){
 return truck.technical.find(row=>row.label===label)?.value??MISSING;
}

function cellClass(value:string,differs:boolean){
 const classes=['compare-value'];
 if(differs)classes.push('is-different');
 if(value===MISSING)classes.push('is-missing');
 return classes.join(' ');
}

export function CompareRange(){
 const labels=collectLabels(compared);
 return <section id="compare-range" data-screen-label="Compare the range" className="compare-range" aria-labelledby="compare-range-title">
  <div className="compare-inner">
   <div className="compare-heading">
    <p className="eyebrow gold">Truk Afrik / Compare the range</p>
    <h2 id="compare-range-title">Four trucks.<br/>{' '}One table.</h2>
    <p className="compare-lead">The four featured bulletin trucks, side by side on the published SINOTRUK dealer specification. Cells marked in gold differ across the four models.</p>
   </div>
   <div className="compare-scroll" role="region" aria-label="Truck comparison table, scrolls horizontally" tabIndex={0}>
    <table className="compare-table">
     <caption className="compare-caption">Supplied specification comparison: {captionList}</caption>
     <thead>
      <tr>
       <th scope="col" className="compare-corner">Specification</th>
       {compared.map(truck=><th scope="col" className="compare-model" key={truck.id}>
        <span className="compare-model-name">{truck.name}</span>
        <span className="compare-model-config">{truck.config}</span>
       </th>)}
      </tr>
     </thead>
     <tbody>
      {labels.map(label=>{
       const values=compared.map(truck=>valueFor(truck,label));
       const differs=new Set(values).size>1;
       return <tr key={label} className={differs?'compare-row is-different':'compare-row'}>
        <th scope="row" className="compare-label">{label}</th>
        {values.map((value,index)=><td key={compared[index].id} className={cellClass(value,differs)}>
         {value===MISSING
          ? <><span aria-hidden="true">{MISSING}</span><span className="compare-sr">Not published in the supplied specification</span></>
          : value}
        </td>)}
       </tr>;
      })}
     </tbody>
    </table>
   </div>
   <p className="compare-hint"><span aria-hidden="true">&#8596;</span>{' '}Scroll the table horizontally to compare every model.</p>
   <p className="compare-note">Published SINOTRUK dealer specifications only.</p>
  </div>
 </section>;
}
