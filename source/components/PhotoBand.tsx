import type {CSSProperties} from 'react';
import './photo-band.css';

type Props={
 id:string;
 src:string;
 alt:string;
 eyebrow:string;
 title:string;
 copy?:string;
 href?:string;
 linkLabel?:string;
 position?:string;
 watermark?:string;
 priority?:boolean;
};

/** Full-bleed photographic band used to break up the dark, text-heavy sections. */
export function PhotoBand({id,src,alt,eyebrow,title,copy,href,linkLabel,position='50% 50%',watermark,priority}:Props){
 return <section className="photo-band" id={id} data-watermark={watermark} aria-labelledby={`${id}-title`}>
  <img className="photo-band-image" src={src} alt={alt} style={{objectPosition:position} as CSSProperties} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'}/>
  <div className="photo-band-shade" aria-hidden="true"/>
  <div className="photo-band-inner">
   <p className="eyebrow gold">{eyebrow}</p>
   <h2 id={`${id}-title`}>{title}</h2>
   {copy&&<p className="photo-band-copy">{copy}</p>}
   {href&&linkLabel&&<a className="photo-band-link" href={href}>{linkLabel} <span aria-hidden="true">↗</span></a>}
  </div>
 </section>;
}
