import type {Metadata} from 'next';
import {SubPage} from '../../components/pages/SubPage';
import {Card} from '../../components/Primitives';

export const metadata:Metadata={
 title:'Pre-owned trucks | Truk Afrik',
 description:'Quality-approved pre-owned trucks for cost-effective fleet expansion, from Truk Afrik in Mbombela and Benoni.',
};

export default function PreOwnedPage(){
 return <SubPage
  current="/pre-owned"
  eyebrow="Pre-owned"
  title="Ready to work, not ready to retire."
  lead="Truk Afrik offers a selection of quality-approved previously owned trucks for operators who need dependable capacity without a new-unit price. Availability changes, so current stock is confirmed by the dealership.">
  <section aria-labelledby="why-pre-owned">
   <h2 id="why-pre-owned">Why pre-owned</h2>
   <div className="subpage-grid">
    <Card eyebrow="Fleet" title="Cost-effective expansion"><p>Add capacity at a lower capital outlay than a new unit, where the application allows.</p></Card>
    <Card eyebrow="Assessment" title="Quality-checked"><p>Vehicles are sourced and assessed before being offered, with condition and history discussed openly.</p></Card>
    <Card eyebrow="Timing" title="Ready for delivery"><p>Previously owned units can be available sooner than a factory order, subject to stock at the time.</p></Card>
    <Card eyebrow="Start-ups" title="A first truck"><p>A practical entry point for new operators and growing fleets that need a working truck now.</p></Card>
   </div>
  </section>

  <section aria-labelledby="what-to-check">
   <h2 id="what-to-check">What to check before you buy</h2>
   <ul>
    <li><strong>The configuration</strong> — tractor or tipper, axle layout and body, matched to the work you intend to do.</li>
    <li><strong>The history</strong> — service records, odometer and any previous repair work the dealership can document.</li>
    <li><strong>The application</strong> — trailer, route and load, so the unit is right for the job rather than just available.</li>
    <li><strong>The paperwork</strong> — registration, roadworthy and the terms of sale, confirmed in writing.</li>
   </ul>
  </section>

  <section aria-labelledby="stock">
   <h2 id="stock">Current stock</h2>
   <p>This page does not list live inventory. Pre-owned stock moves, and a listing that lags behind reality wastes your time. Phone or send an enquiry and the dealership will confirm what is on the floor and what is expected.</p>
  </section>
 </SubPage>;
}
