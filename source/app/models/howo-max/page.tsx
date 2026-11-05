import type {Metadata} from 'next';
import {BrandLogo} from '../../../components/BrandLogo';
import {EnquiryExperience} from '../../../components/Enquiry';
import {TruckShowroom} from '../../../components/showroom/TruckShowroom';
import {FloatingSocialLinks} from '../../../components/showroom/FloatingSocialLinks';

export const dynamic='force-static';
export const metadata:Metadata={title:'HOWO MAX showroom | Truk Afrik',description:'Explore the HOWO MAX exterior, cabin, specifications and model-prefilled enquiry.'};
export default function HowoMaxPage(){
 return <EnquiryExperience><a className="skip-link" href="#main">Skip to content</a><header className="showroom-header"><a href="/" aria-label="SITRAK Truk Afrik home"><BrandLogo className="header-brand-logo" priority/></a><a href="/#the-range">← Back to the range</a></header><FloatingSocialLinks/><TruckShowroom truckId="howo-max"/></EnquiryExperience>;
}
