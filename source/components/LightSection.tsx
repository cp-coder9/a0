import './light-section.css';

const cards=[
 {title:'Parts',copy:'Genuine and replacement components for SITRAK and HOWO, with access to further parts through the supplier network.',href:'/parts',label:'Parts department'},
 {title:'Service',copy:'Maintenance, warranty and technical support, fleet solutions and 24-hour call-out assistance.',href:'/#backed-by-service',label:'Service support'},
 {title:'Finance',copy:'Financing assistance, trade-ins and fleet replacement discussed with the dealership, in writing.',href:'/finance',label:'Finance assistance'},
];

/** One light band: the contrast break that stops the page reading as a single dark block. */
export function LightSection(){
 return <section className="light-section" id="support" aria-labelledby="support-title">
  <div className="light-section-inner">
   <div className="light-section-head">
    <p className="eyebrow">After the keys</p>
    <h2 id="support-title">A truck is only as good as the backup.</h2>
    <p className="light-section-lead">Parts, service and finance sit behind every unit we sell. This is the part of the dealership that keeps the wheels turning after delivery.</p>
   </div>
   <div className="light-section-grid">
    {cards.map(card=><a className="light-card" href={card.href} key={card.title}>
     <span className="light-card-eyebrow">{card.label}</span>
     <strong>{card.title}</strong>
     <span className="light-card-copy">{card.copy}</span>
     <span className="light-card-arrow" aria-hidden="true">→</span>
    </a>)}
   </div>
  </div>
 </section>;
}
