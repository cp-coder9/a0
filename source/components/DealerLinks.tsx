const pages=[['About us','/about','The company, the branches and what we support.'],
 ['Finance','/finance','Financing assistance, trade-ins and what to bring.'],
 ['Parts','/parts','Genuine and replacement parts, and how to order.'],
 ['Pre-owned','/pre-owned','Quality-approved used trucks, and what to check.'],
 ['Privacy notice','/privacy-policy','How this website handles your information.']] as const;

/** Home-page hub linking the standing dealership pages (about, finance, parts, pre-owned, privacy). */
export function DealerLinks(){
 return <section id="more" className="dealer-links" aria-labelledby="dealer-links-title" data-screen-label="The dealership in detail">
  <div className="dealer-links-inner">
   <p className="eyebrow gold">More from the dealership</p>
   <h2 id="dealer-links-title">Sales, parts, finance and the people behind them.</h2>
   <p className="dealer-links-lead">The truck is the start of the conversation. These pages cover the rest of the dealership.</p>
   <div className="dealer-links-grid">
    {pages.map(([title,href,copy])=><a className="dealer-link" href={href} key={href}>
     <strong>{title}</strong>
     <span className="dealer-link-copy">{copy}</span>
     <span className="dealer-link-arrow" aria-hidden="true">↗</span>
    </a>)}
   </div>
  </div>
 </section>;
}
