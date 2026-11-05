import './site-brand.css';
export function BrandLogo({className='',priority=false}:{className?:string;priority?:boolean}){return <img className={`brand-logo ${className}`.trim()} src="/intro/sitrak-truk-afrik-white.png" width={1386} height={766} alt="SITRAK Truk Afrik" loading={priority?'eager':'lazy'} decoding="async" draggable={false}/>}
