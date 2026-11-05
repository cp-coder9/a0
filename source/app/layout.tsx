import type {Metadata,Viewport} from 'next';
import './fonts.css';
import './tokens.css';
import './globals.css';
import './motion.css';
import './hero-carousel.css';
import './truck-experience.css';
import './truck-explorer.css';
import './intro-splash.css';
import './fleet-discovery.css';
import {IntroSplash} from '../components/intro/IntroSplash';
import {SharedFooter} from '../components/Primitives';
import {MouseTruck} from '../components/MouseTruck';
const SITE_TITLE='SITRAK | Truk Afrik — Come drive one.';
const SITE_DESCRIPTION='480 horses. 2300Nm. 80 tonnes. Explore SITRAK and HOWO trucks, sales, parts and service in Mbombela and Benoni.';
export const metadata:Metadata={metadataBase:new URL('https://www.trukafrik.com'),title:SITE_TITLE,description:SITE_DESCRIPTION,openGraph:{title:SITE_TITLE,description:SITE_DESCRIPTION,url:'/',siteName:'Truk Afrik',locale:'en_ZA',type:'website',images:[{url:'/og/og-default.png',width:1200,height:630,alt:'SITRAK trucks by Truk Afrik'}]},twitter:{card:'summary_large_image',title:SITE_TITLE,description:SITE_DESCRIPTION,images:['/og/og-default.png']}};
export const viewport:Viewport={themeColor:'#0C2340'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-ZA"><head><link rel="preload" as="image" href="/intro/sitrak-truk-afrik.png"/></head><body><IntroSplash firstVisitOnly autoStart>{children}<SharedFooter/><MouseTruck/></IntroSplash></body></html>}
