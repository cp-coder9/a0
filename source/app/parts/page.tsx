import type {Metadata} from 'next';
import {SubPage} from '../../components/pages/SubPage';
import {Card} from '../../components/Primitives';

export const metadata:Metadata={
 title:'Truck parts | Truk Afrik',
 description:'Genuine and replacement parts for SITRAK and HOWO trucks, supplied from Mbombela and Benoni.',
};

export default function PartsPage(){
 return <SubPage
  current="/parts"
  eyebrow="Parts"
  title="Parts that keep it working."
  lead="Truk Afrik supplies a range of genuine and replacement parts for SITRAK and HOWO trucks, from both branches. The aim is simple: less downtime, and the right part the first time."
  closing="Part numbers, availability and pricing are confirmed by the dealership against the exact vehicle identification number. Confirm the part before fitment.">
  <section aria-labelledby="what-we-supply">
   <h2 id="what-we-supply">Parts we supply</h2>
   <div className="subpage-grid">
    <Card eyebrow="Driveline" title="Engine, gearbox and drivetrain"><p>Engine components, gearbox and drivetrain parts, clutches and transmission parts.</p></Card>
    <Card eyebrow="Chassis" title="Brakes, suspension and steering"><p>Brake components, suspension parts and steering components for supported models.</p></Card>
    <Card eyebrow="Service items" title="Filters and consumables"><p>Oil, fuel and air filters and the routine service components a working truck needs.</p></Card>
    <Card eyebrow="Network" title="Additional parts"><p>Access to further parts through our supplier network when an item is not held locally.</p></Card>
   </div>
  </section>

  <section aria-labelledby="ordering">
   <h2 id="ordering">Ordering a part</h2>
   <ul>
    <li><strong>Have the vehicle identification number (VIN) or registration ready.</strong> Model name alone does not establish the build.</li>
    <li><strong>Give us the part number, or a clear photo of the old part.</strong> That is the fastest way to avoid a wrong fitment.</li>
    <li><strong>Tell us the branch.</strong> Parts are supplied from Mbombela and Benoni; collection and delivery are confirmed by the dealership.</li>
   </ul>
  </section>

  <section aria-labelledby="parts-support">
   <h2 id="parts-support">Parts and service together</h2>
   <p>Parts sit alongside workshop support: maintenance, warranty and technical support, fleet solutions and 24-hour call-out assistance. If a part is needed as part of a repair, the dealership can coordinate both.</p>
  </section>
 </SubPage>;
}
