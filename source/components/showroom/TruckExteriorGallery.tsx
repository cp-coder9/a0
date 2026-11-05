'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {CatalogTruck} from '../../lib/truck-catalog';
import './truck-exterior-gallery.css';

export function TruckExteriorGallery({truck}:{truck:CatalogTruck}){
 const images=truck.images;
 const [active,setActive]=useState(0);
 const [failed,setFailed]=useState<number[]>([]);
 const refs=useRef<(HTMLImageElement|null)[]>([]);
 const isFailed=(i:number)=>failed.includes(i);
 const markFailed=useCallback((i:number)=>setFailed(prev=>prev.includes(i)?prev:[...prev,i]),[]);
 const allFailed=images.every((_,i)=>isFailed(i));
 useEffect(()=>{refs.current.forEach((img,i)=>{if(img&&img.complete&&img.naturalWidth===0)markFailed(i)})},[markFailed,images]);
 useEffect(()=>{if(!allFailed&&isFailed(active)){const next=images.findIndex((_,i)=>!isFailed(i));if(next>=0)setActive(next)}},[failed,active,allFailed,images]);
 function step(delta:number){if(allFailed)return;let next=active;for(let n=0;n<images.length;n++){next=(next+delta+images.length)%images.length;if(!isFailed(next)){setActive(next);return}}}
 return <section className="truck-exterior-gallery" aria-label={`${truck.name} exterior images`}>
  <figure className="showroom-poster">
   {allFailed
    ? <p className="showroom-media-error" role="status">These images are unavailable. Specifications and the model-prefilled enquiry remain available; no substitute vehicle is shown.</p>
    : <><div className="truck-exterior-frame"><img ref={el=>{refs.current[active]=el}} src={images[active].src} alt={`${truck.name}: ${images[active].label}`} draggable={false} style={{objectPosition:images[active].position||'center',objectFit:images[active].fit||'cover'}} onError={()=>markFailed(active)}/></div><figcaption>{images[active].label}</figcaption></>}
  </figure>
  <div className="truck-exterior-controls">
   <button type="button" aria-label="Previous exterior image" disabled={allFailed||images.length<2} onClick={()=>step(-1)}>←</button>
   <p aria-live="polite">{allFailed?'Images unavailable':`${active+1} of ${images.length} images`}</p>
   <button type="button" aria-label="Next exterior image" disabled={allFailed||images.length<2} onClick={()=>step(1)}>→</button>
  </div>
  <div className="truck-exterior-thumbnails">
   {images.map((image,i)=><button key={image.src} type="button" aria-label={`Select exterior image ${i+1}: ${image.label}`} aria-pressed={i===active} disabled={isFailed(i)} onClick={()=>setActive(i)}>{isFailed(i)?'Image unavailable':<img src={image.src} alt="" draggable={false} onError={()=>markFailed(i)}/>}</button>)}
  </div>
 </section>;
}
