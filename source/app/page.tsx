import {Eyebrow,SectionHeader,Card} from '../components/Primitives';
import {PhoneNumber} from '../components/PhoneNumber';
import {Header} from '../components/Header';
import {Hero} from '../components/Hero';
import {TruckExperience} from '../components/TruckExperience';
import {ShowroomDiscovery} from '../components/showroom/ShowroomDiscovery';
import {FloatingSocialLinks} from '../components/showroom/FloatingSocialLinks';

import {FleetGuide} from '../components/FleetGuide';
import {DealerLinks} from '../components/DealerLinks';
import {PhotoBand} from '../components/PhotoBand';
import {LightSection} from '../components/LightSection';
import {DealerLocator} from '../components/DealerLocator';
import {MagneticButtons} from '../components/MagneticButtons';
import {CompareRange} from '../components/showroom/CompareRange';
import {AnatomyHotspots} from '../components/showroom/AnatomyHotspots';
import {SiteMotion} from '../components/SiteMotion';
import {EnquiryExperience,EnquiryButton} from '../components/Enquiry';


export default function Home(){return <EnquiryExperience><TruckExperience><a className="skip-link" href="#main">Skip to content</a><Header/><SiteMotion/><MagneticButtons/><FloatingSocialLinks/><main id="main"><Hero/><ShowroomDiscovery/>

<PhotoBand id="long-road" src="/assets/hero-howo-max-road.jpg" alt="SITRAK and HOWO tractor on the open road" eyebrow="Long haul · The open road" title="Built for the long road." copy="A 12-speed AMT, a 12.419-litre MC13 and a sleeper cab: the combination is chosen for the route, not the brochure." href="/models/howo-max" linkLabel="Explore the HOWO MAX" position="50% 58%" watermark="02" priority/>



<section id="the-engineering" data-screen-label="03 The engineering" className="has-watermark" data-watermark="03" style={{"position": "relative", "background": "var(--ta-black)", "padding": "var(--section-pad-y) 0", "overflow": "hidden", "scrollMarginTop": "72px"}}>
  <div style={{"position": "absolute", "top": "0", "right": "0", "height": "100%", "width": "46%", "backgroundImage": "url(./assets/grill-mesh.jpg)", "backgroundRepeat": "repeat", "backgroundSize": "230px 263px", "opacity": ".5", "mixBlendMode": "screen"}}></div>
  <div style={{"position": "absolute", "inset": "0", "background": "linear-gradient(90deg,var(--ta-black) 0%,rgba(5,11,20,.88) 55%,rgba(5,11,20,.55) 100%)"}}></div>
  <div style={{"position": "relative", "maxWidth": "var(--container-max)", "margin": "0 auto", "padding": "0 var(--gutter)"}}>
    <SectionHeader number="03" label="The engineering" title="Supplied G7H and G7S specification"></SectionHeader>
    <div className="card-grid">
      <Card eyebrow="Supplied G7H specification" title="MC13.48 · ZF 12-speed">
        <p style={{"margin": "0 0 var(--space-4)", "font": "var(--type-body)", "color": "var(--text-body)"}}>G7H: a 12.419-litre SINOTRUK MC13.48 driving a ZF 12TX2621 twelve-speed automated manual.</p>
        <div style={{"font": "var(--type-spec)", "letterSpacing": "var(--track-mono)", "textTransform": "uppercase", "color": "var(--ta-gold-light)"}}>→ 480HP · 2300NM · 65T GCM</div>
      </Card>
      <Card eyebrow="Supplied G7H specification" title="6×4 · 65 T GCM">
        <p style={{"margin": "0 0 var(--space-4)", "font": "var(--type-body)", "color": "var(--text-body)"}}>The G7H 64480 is a 6×4 long-haul tractor listed at 34 T GVM and 65 T GCM.</p>
        <div style={{"font": "var(--type-spec)", "letterSpacing": "var(--track-mono)", "textTransform": "uppercase", "color": "var(--ta-gold-light)"}}>→ 6×4 · 34T GVM · 65T GCM</div>
      </Card>
      <Card eyebrow="Supplied G7S specification" title="G7S · 6×4 tipper">
        <p style={{"margin": "0 0 var(--space-4)", "font": "var(--type-body)", "color": "var(--text-body)"}}>The G7S is a 6×4 tipper specified for mining and construction.</p>
        <div style={{"font": "var(--type-spec)", "letterSpacing": "var(--track-mono)", "textTransform": "uppercase", "color": "var(--ta-gold-light)"}}>→ 6×4 TIPPER · MINING & CONSTRUCTION</div>
      </Card>
    </div>
  </div>
</section>

<AnatomyHotspots/>

<LightSection/>

<section id="backed-by-service" data-screen-label="04 Backed by service" className="has-watermark" data-watermark="04" style={{"position": "relative", "background": "var(--ta-black)", "scrollMarginTop": "72px"}}>
  <div style={{"position": "relative", "height": "420px", "overflow": "hidden"}}>
    <img src="/assets/band-lineup-v1.jpg" alt="SITRAK and HOWO MAX tractors on site" style={{"position": "absolute", "inset": "0", "width": "100%", "height": "100%", "objectFit": "cover", "objectPosition": "50% 55%"}} />
    <div style={{"position": "absolute", "inset": "0", "background": "linear-gradient(90deg,rgba(5,11,20,.9) 0%,rgba(5,11,20,.45) 55%,rgba(5,11,20,.2) 100%)"}}></div>
    <div style={{"position": "absolute", "inset": "0", "display": "flex", "alignItems": "center"}}>
      <div style={{"width": "100%", "maxWidth": "var(--container-max)", "margin": "0 auto", "padding": "0 var(--gutter)"}}>
        <Eyebrow tone="gold" style={{"marginBottom": "var(--space-4)"}}>04 · Backed by service</Eyebrow>
        <h2 style={{"margin": "0", "fontFamily": "var(--font-display)", "fontWeight": "900", "fontSize": "68px", "lineHeight": ".98", "textTransform": "uppercase", "color": "var(--ta-white)", "maxWidth": "16ch"}}>Built for Africa. Backed by service.</h2>
      </div>
    </div>
  </div>
  <div style={{"maxWidth": "var(--container-max)", "margin": "0 auto", "padding": "var(--space-8) var(--gutter) var(--section-pad-y)"}}>
    <p style={{"margin": "0 0 var(--space-6)", "font": "var(--type-body-lg)", "color": "var(--text-body)", "maxWidth": "58ch", "textWrap": "pretty"}}>Ask the dealership about current maintenance, registration and service-support arrangements.</p>
    <div className="card-grid">
      <Card eyebrow="Current arrangements" title="Maintenance & registration" active={true}>
        <p style={{"margin": "0", "font": "var(--type-body)", "color": "var(--text-body)"}}>Ask the dealership about current maintenance and registration arrangements, eligible models and applicable terms.</p>
      </Card>
      <Card eyebrow="Ask the dealership" title="Service-support arrangements">
        <p style={{"margin": "0", "font": "var(--type-body)", "color": "var(--text-body)"}}>Ask the dealership in Mbombela or Benoni about current parts and service-support arrangements for your intended routes and application.</p>
      </Card>
      <Card eyebrow="Supplied G7H specification" title="A home on the road">
        <p style={{"margin": "0", "font": "var(--type-body)", "color": "var(--text-body)"}}>A sleeper cab is listed for the G7H 64480.</p>
      </Card>
    </div>
  </div>
</section>
<PhotoBand id="cab-office" src="/assets/gallery/c7h-cab.jpg" alt="Cab detail of the SITRAK G7H" eyebrow="Inside the cab · Long haul" title="The long-road office." copy="Flat floor, engine-off air conditioning and a double sleeper are listed for the supplied G7H specification." href="/models/g7h" linkLabel="Step inside the G7H" position="50% 45%" watermark="04"/>

<CompareRange/>

<DealerLocator/>

<DealerLinks/>

<FleetGuide/>
</main><div className="mobile-enquiry"><a href="tel:0820748725"><PhoneNumber call/></a><EnquiryButton/></div></TruckExperience></EnquiryExperience>}
