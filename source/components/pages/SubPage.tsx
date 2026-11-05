import type {ReactNode} from 'react';
import {BrandLogo} from '../BrandLogo';
import {EnquiryButton, EnquiryExperience} from '../Enquiry';
import {FloatingSocialLinks} from '../showroom/FloatingSocialLinks';
import './subpage.css';

/**
 * Shared shell for the static dealership pages (about, finance, parts, pre-owned, privacy).
 * Kept separate from the one-page showroom so each legacy URL gets real, indexable content.
 */
const related=[['/about','About'],['/finance','Finance'],['/parts','Parts'],['/pre-owned','Pre-owned'],['/privacy-policy','Privacy']];

export function SubPage({eyebrow,title,lead,children,closing,current}:{eyebrow:string;title:string;lead:string;children:ReactNode;closing?:string;current:string}){
 return <EnquiryExperience>
  <a className="skip-link" href="#main">Skip to content</a>
  <header className="subpage-header">
   <a href="/" aria-label="SITRAK Truk Afrik home"><BrandLogo className="header-brand-logo" priority/></a>
   <a className="subpage-back" href="/#the-range">← Back to the range</a>
  </header>
  <main id="main" className="subpage">
   <div className="subpage-hero">
    <p className="eyebrow gold">{eyebrow}</p>
    <h1>{title}</h1>
    <p className="subpage-lead">{lead}</p>
    <div className="subpage-actions">
     <EnquiryButton label="Enquire about this topic">Enquire now <span aria-hidden="true">→</span></EnquiryButton>
     <a className="button ghost" href="tel:0820748725">Call 082 074 8725</a>
    </div>
   </div>
   {children}
   <nav className="subpage-related" aria-label="Dealership pages">
    {related.filter(([href])=>href!==current).map(([href,label])=><a key={href} href={href}>{label}</a>)}
   </nav>
   {closing&&<p className="subpage-closing">{closing}</p>}
  </main>
  <FloatingSocialLinks/>
 </EnquiryExperience>;
}
