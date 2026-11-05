import type {Metadata} from 'next';
import {BrandLogo} from '../../components/BrandLogo';
import {EnquiryExperience} from '../../components/Enquiry';
import {FloatingSocialLinks} from '../../components/showroom/FloatingSocialLinks';
import {RangeSpecifications} from '../../components/showroom/RangeSpecifications';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Truck range & specifications | Truk Afrik',
  description:
    'The full Truk Afrik range — SITRAK G7S and G7H tractors, the HOWO MAX and the HOWO TX tippers, water bowsers and mixers — with the engine and specification detail published by SINOTRUK dealer.',
};

export default function RangePage() {
  return (
    <EnquiryExperience>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="showroom-header">
        <a href="/" aria-label="SITRAK Truk Afrik home">
          <BrandLogo className="header-brand-logo" priority />
        </a>
        <a href="/#the-range">← Back to the range</a>
      </header>
      <FloatingSocialLinks />
      <main id="main">
        <RangeSpecifications />
      </main>
    </EnquiryExperience>
  );
}
