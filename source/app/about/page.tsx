import type {Metadata} from 'next';
import {SubPage} from '../../components/pages/SubPage';
import {Card} from '../../components/Primitives';

export const metadata:Metadata={
 title:'About Truk Afrik | SITRAK and HOWO trucks',
 description:'Truk Afrik supplies heavy-duty SITRAK and HOWO trucks in South Africa, with sales, parts and service in Mbombela and Benoni.',
};

export default function AboutPage(){
 return <SubPage
  current="/about"
  eyebrow="About us"
  title="Trucks that pull their weight."
  lead="Truk Afrik is a South African commercial vehicle supplier focused on heavy-duty trucks — new and pre-owned — backed by parts and service in Mbombela and Benoni.">
  <section aria-labelledby="who-we-are">
   <h2 id="who-we-are">Who we are</h2>
   <p>We supply heavy-duty trucks for the work South African operators actually do: long-haul freight, tipper and construction work, agriculture and mining. The focus is on reliable new and pre-owned trucks, backed by support and straight-talking service — the truck has to earn, and it has to keep earning.</p>
   <p>Our range is built around SITRAK and HOWO. We work with operators who need to understand the trailer, the route and the load before they choose a combination, not after.</p>
  </section>

  <section aria-labelledby="what-we-do">
   <h2 id="what-we-do">What we do</h2>
   <div className="subpage-grid">
    <Card eyebrow="New trucks" title="SITRAK and HOWO"><p>The SITRAK G7H long-haul tractor, the G7S tipper, the HOWO Tapa tipper and the HOWO MAX tractor. Specs are confirmed against the exact supplied unit, not a brochure.</p></Card>
    <Card eyebrow="Pre-owned" title="Quality-approved used trucks"><p>Selected previously owned trucks for cost-effective fleet expansion, subject to availability and condition.</p></Card>
    <Card eyebrow="Parts" title="Genuine and replacement parts"><p>Service and repair components for supported trucks, with access to additional parts through our supplier network.</p></Card>
    <Card eyebrow="Service" title="Workshop and support"><p>Service and maintenance, warranty and technical support, fleet solutions and 24-hour call-out assistance.</p></Card>
   </div>
  </section>

  <section aria-labelledby="where-we-are">
   <h2 id="where-we-are">Where to find us</h2>
   <p><strong>Mbombela (Nelspruit)</strong> — Mpumalanga, branch. <strong>Benoni</strong> — Gauteng, branch. Both branches operate sales, parts and service.</p>
   <p>Phone 082 074 8725 (0820SITRAK) or email <a href="mailto:chris@trukafrik.com">chris@trukafrik.com</a>. Opening hours and branch directions are confirmed by the dealership.</p>
  </section>
 </SubPage>;
}
