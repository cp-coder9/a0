import type {Metadata} from 'next';
import {SubPage} from '../../components/pages/SubPage';
import {Card} from '../../components/Primitives';

export const metadata:Metadata={
 title:'Truck finance assistance | Truk Afrik',
 description:'Truck financing assistance, trade-ins and fleet replacement for SITRAK and HOWO buyers in Mbombela and Benoni.',
};

export default function FinancePage(){
 return <SubPage
  current="/finance"
  eyebrow="Finance"
  title="Finance your truck."
  lead="Buying a truck is a business decision before it is a vehicle decision. We help you put the application together and discuss financing, trade-ins and fleet replacement with you."
  closing="Financing is subject to approval and to the terms agreed with the dealership and its finance providers. Nothing on this page is a quotation, a rate offer or a credit approval.">
  <section aria-labelledby="how-it-works">
   <h2 id="how-it-works">How it works</h2>
   <ul>
    <li><strong>Start with the work.</strong> Tell us the route, the load and the trailer so the right combination is on the table before the numbers are.</li>
    <li><strong>Choose the unit.</strong> New or pre-owned, confirmed against the exact build and availability.</li>
    <li><strong>Put the application together.</strong> We help you prepare the business and vehicle information a financier will ask for.</li>
    <li><strong>Discuss the trade-in.</strong> If an existing truck is part of the deal, bring its details so the trade-in can be assessed.</li>
   </ul>
  </section>

  <section aria-labelledby="what-to-bring">
   <h2 id="what-to-bring">What to bring to the conversation</h2>
   <div className="subpage-grid">
    <Card eyebrow="Business" title="Company details"><p>Registered business details and the person responsible for the application.</p></Card>
    <Card eyebrow="Application" title="Intended use"><p>The route, typical load, trailer and expected distance so the combination and the deal match the work.</p></Card>
    <Card eyebrow="Existing fleet" title="Trade-in information"><p>Make, model, year, odometer, service history and any finance still outstanding on a trade-in.</p></Card>
   </div>
  </section>

 </SubPage>;
}
