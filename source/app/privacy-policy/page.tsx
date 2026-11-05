import type {Metadata} from 'next';
import {SubPage} from '../../components/pages/SubPage';

export const metadata:Metadata={
 title:'Privacy notice | Truk Afrik',
 description:'How Truk Afrik handles personal information submitted through this website, under POPIA.',
};

export default function PrivacyPage(){
 return <SubPage
  current="/privacy-policy"
  eyebrow="Privacy"
  title="Privacy notice."
  lead="This notice explains what personal information this website collects, why, and what you can ask us to do with it. It applies to www.trukafrik.com, operated by Truk Afrik."
  closing="Last updated 30 October 2026. If our practices change, this page will be updated.">
  <section aria-labelledby="what-we-collect">
   <h2 id="what-we-collect">What we collect</h2>
   <p><strong>Information you send us.</strong> The enquiry form asks for your first name, last name, email address, phone number, a topic and an optional message, plus the truck model you selected if you started from a model view. Submitting the form sends that information to the dealership.</p>
   <p><strong>Technical information.</strong> Our hosting provider records standard web server information — such as the requested page, the time of the request, your IP address and the browser or device type — for security and troubleshooting.</p>
  </section>

  <section aria-labelledby="why">
   <h2 id="why">Why we use it</h2>
   <ul>
    <li>To respond to your enquiry and route it to the right branch.</li>
    <li>To answer questions about trucks, parts, service or finance that you ask us.</li>
    <li>To keep the website secure and working, and to understand faults.</li>
   </ul>
  </section>

  <section aria-labelledby="how-handled">
   <h2 id="how-handled">How it is handled</h2>
   <p>An enquiry is validated and emailed to the dealership's mailbox. This website does not keep its own database of enquiry submissions. Email is delivered through the dealership's email service, which as the mail provider processes and stores the message in the ordinary way.</p>
   <p>We do not use the information submitted through this website for automated decision-making, profiling or advertising.</p>
  </section>

  <section aria-labelledby="cookies">
   <h2 id="cookies">Cookies and browser storage</h2>
   <p>This website does not use advertising or analytics cookies and does not run third-party tracking scripts. A small amount of interface state may be kept in your browser's session storage — for example whether the opening animation has already played in the tab, or the state of a 3D view. That information stays in your browser, is not used to identify you, and is discarded when the tab is closed.</p>
  </section>

  <section aria-labelledby="sharing">
   <h2 id="sharing">Who sees it</h2>
   <p>We do not sell or rent personal information. Enquiries are seen by the dealership staff who handle them. Our hosting and email service providers process data on our behalf so that the site can run and email can be delivered. We may disclose information where the law requires it.</p>
  </section>

  <section aria-labelledby="retention">
   <h2 id="retention">How long we keep it</h2>
   <p>Enquiries are kept only as long as needed to answer them and to keep the dealership's records. Web server logs are kept by our hosting provider for the period set out in their arrangements with us. You can ask us to delete an enquiry you sent (see below).</p>
  </section>

  <section aria-labelledby="rights">
   <h2 id="rights">Your rights</h2>
   <p>Under the Protection of Personal Information Act, 2013 (POPIA) you may ask to access the personal information we hold about you, ask us to correct or delete it, or object to its processing. Send the request to <a href="mailto:chris@trukafrik.com">chris@trukafrik.com</a> with enough detail for us to identify you and the information concerned.</p>
   <p>If you are not satisfied with how we have handled your request, you may complain to the Information Regulator (South Africa).</p>
  </section>

  <section aria-labelledby="contact">
   <h2 id="contact">Contact</h2>
   <p>Privacy questions: <a href="mailto:chris@trukafrik.com">chris@trukafrik.com</a> · 082 074 8725. Branches: Mbombela (Mpumalanga) and Benoni (Gauteng).</p>
  </section>
 </SubPage>;
}
