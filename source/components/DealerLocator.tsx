import './dealer-locator.css';

const branches=[
 {
  id:'mbombela',
  name:'Mbombela',
  role:'Branch',
  region:'Mpumalanga',
  address:'2 Waterfall Avenue, Mbombela, Mpumalanga 1226',
  phone:'013 591 4436',
  phoneHref:'tel:+27135914436',
  email:'enquiries@trukafrik.com',
  lat:-25.4486543,
  lon:30.9597962,
  mapNote:'Waterfall Avenue, Riverside Park.',
 },
 {
  id:'benoni',
  name:'Benoni',
  role:'Branch',
  region:'Gauteng',
  address:'19 Goud Street, Benoni, Gauteng 1501',
  phone:'0820SITRAK (082 074 8725)',
  phoneHref:'tel:0820748725',
  email:'chris@trukafrik.com',
  lat:-26.1930356,
  lon:28.3082376,
  mapNote:'Benoni, Gauteng.',
 },
];

/** OpenStreetMap embed centred on the branch with a marker. */
function osmEmbed(lat:number,lon:number):string{
 const dLat=0.008,dLon=0.012;
 const bbox=[lon-dLon,lat-dLat,lon+dLon,lat+dLat].map(value=>value.toFixed(5)).join('%2C');
 return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lon.toFixed(6)}`;
}
function osmDirections(lat:number,lon:number):string{
 return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${lat.toFixed(6)}%2C${lon.toFixed(6)}`;
}
function osmPage(lat:number,lon:number):string{
 return `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=16/${lat.toFixed(4)}/${lon.toFixed(4)}`;
}

/** Branch locator: OpenStreetMap maps, addresses, hours and directions. */
export function DealerLocator(){
 return <section className="dealer-locator" id="find-us" aria-labelledby="find-us-title">
  <div className="dealer-locator-inner">
   <div className="dealer-locator-head">
    <p className="eyebrow gold">Find us</p>
    <h2 id="find-us-title">Two branches. One standard.</h2>
    <p className="dealer-locator-lead">Sales, parts and service at both our Mbombela and Benoni branches. Call ahead for parts availability or to book a test drive.</p>
   </div>
   <div className="dealer-locator-grid">
    {branches.map((branch,index)=><article className="branch-panel" key={branch.id}>
     <div className="branch-panel-top">
      <span className="branch-index" aria-hidden="true">0{index+1}</span>
      <div>
       <p className="branch-role">{branch.role} · {branch.region}</p>
       <h3>{branch.name}</h3>
      </div>
     </div>
     <div className="branch-map">
      <iframe title={`OpenStreetMap map of the ${branch.name} branch`} src={osmEmbed(branch.lat,branch.lon)} referrerPolicy="no-referrer-when-downgrade"/>
     </div>
     <p className="branch-map-note">{branch.mapNote} <a href={osmPage(branch.lat,branch.lon)} target="_blank" rel="noreferrer">Open larger map ↗</a></p>
     <address>{branch.address}</address>
     <dl className="branch-hours">
      <div><dt>Mon–Fri</dt><dd>08:00–17:00</dd></div>
      <div><dt>Saturday</dt><dd>08:00–13:00</dd></div>
      <div><dt>Sunday & public holidays</dt><dd>Closed</dd></div>
     </dl>
     <div className="branch-actions">
      <a className="button ghost" href={osmDirections(branch.lat,branch.lon)} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
      <a href={branch.phoneHref}>{branch.phone}</a>
      <a href={`mailto:${branch.email}`}>{branch.email}</a>
     </div>
    </article>)}
   </div>
   <p className="dealer-locator-note">Maps by OpenStreetMap contributors. Opening hours and directions are confirmed by the branch — call 0820SITRAK (082 074 8725) if you are travelling.</p>
  </div>
 </section>;
}
