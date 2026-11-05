import {IntroReplay} from './showroom/IntroReplay';
import type {CSSProperties,ReactNode} from 'react';
import {PhoneNumber} from './PhoneNumber';
import {BrandLogo} from './BrandLogo';
import {TruckRangeCard} from './TruckRangeCard';
import {findTruck} from '../lib/truck-catalog';
type Common={children?:ReactNode;style?:CSSProperties};
export function Button({children,href='#the-range',variant='primary',size='md',style}:Common&{href?:string;variant?:string;size?:string}){return <a className={`button ${variant} ${size}`} href={href} style={style}>{children}</a>}
export function Eyebrow({children,style,tone='muted'}:Common&{tone?:string}){return <div className={`eyebrow ${tone}`} style={style}>{children}</div>}
export function SectionHeader({number,label,title,lead}:{number:string;label:string;title:string;lead?:string}){return <div className="section-header"><Eyebrow tone="gold">{number} · {label}</Eyebrow><h2>{title}</h2>{lead?<p>{lead}</p>:null}</div>}
export function SpecTable({rows}:{rows:{label:string;value:string}[]}){return <table className="spec-table"><tbody>{rows.map(row=><tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody></table>}
export function SpecPill({children}:Common){return <span className="spec-pill">{children}</span>}
export function StatBlock({value,unit,label}:{value:string;unit:string;label:string}){return <div className="stat"><div>{value}<span>{unit}</span></div><p>{label}</p></div>}
export function Card({children,eyebrow,title,active}:Common&{eyebrow:string;title:string;active?:boolean}){return <article className={`card ${active?'active':''}`}><Eyebrow>{eyebrow}</Eyebrow><h3>{title}</h3>{children}</article>}
export function BranchCard({name,region,role,description,phone}:{name:string;region:string;role:string;description:string;phone:string}){return <article className="card branch"><Eyebrow>{role} · {region}</Eyebrow><h3>{name}</h3><p>{description}</p><a href="tel:0820748725">{phone.includes('0820SITRAK')?<PhoneNumber call arrow/>:<>{phone} →</>}</a></article>}
export function TruckCard({name}: {name:string;config:string;badge?:string;image:string;specs:string[]}){return <TruckRangeCard truckId={findTruck(name)?.id||''}/> }
export function Logo(){return <span className="wordmark"><strong>SITRAK</strong><span>TRUK AFRIK</span><small>WE'RE IN IT FOR THE LONG HAUL</small></span>}
export function Footer(){return <footer><div className="footer-grid"><div><a href="/#the-range" aria-label="Truk Afrik home"><BrandLogo className="footer-logo"/></a></div><div><Eyebrow tone="gold">Our branches</Eyebrow><h3>Mbombela</h3><p>Mpumalanga · branch</p><h3>Benoni</h3><p>Gauteng · Branch</p><a href="tel:0820748725"><PhoneNumber call/></a></div><div><Eyebrow tone="gold">The range</Eyebrow><a href="#the-range">SITRAK · HOWO</a></div></div><div className="footer-bottom"><span>Truk Afrik · Built to haul. Built for Africa.</span><nav className="footer-pages" aria-label="Dealership pages"><a href="/about">About</a><a href="/finance">Finance</a><a href="/parts">Parts</a><a href="/pre-owned">Pre-owned</a><a href="/privacy-policy">Privacy</a></nav><IntroReplay/><a href="mailto:chris@trukafrik.com">chris@trukafrik.com</a></div><p className="footer-disclaimer">DISCLAIMER: The information presented on this website is provided in good faith but is subject to change without prior notice. Whilst every effort has been made to ensure that the information contained here is accurate and helpful, SINOTRUK accepts no responsibility or liability in respect of any errors or omissions which may occur. Copyright 2026. All Rights Reserved.</p></footer>}
export function SharedFooter(){return <Footer/>}
