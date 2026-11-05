import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import Home from '../../app/page';

function homepage(){
 const document=new DOMParser().parseFromString(renderToStaticMarkup(<Home/>),'text/html');
 return document;
}
function sectionText(id:string){
 const section=homepage().getElementById(id);
 expect(section,`Missing homepage section: ${id}`).not.toBeNull();
 return section!.textContent!;
}

describe('owned homepage engineering and service claims (not Hero/catalog approval)',()=>{
 it('replaces unconditional commercial and coverage guarantees with dealership enquiries',()=>{
  const service=sectionText('backed-by-service');
  expect(service).toContain('Ask the dealership about current maintenance, registration and service-support arrangements.');
  expect(service).not.toMatch(/start earning|before it (?:starts costing|costs)|year 1|first year|included|are covered|nationwide|less downtime|parts availability|expert technical assistance/i);
  expect(service).toContain('Maintenance & registration');
  expect(service).toContain('Service-support arrangements');
 });
 it('qualifies supplied driveline, tipper and cab values without substituting specifications',()=>{
  const engineering=sectionText('the-engineering');
  const service=sectionText('backed-by-service');
  expect(engineering).not.toContain('confirm exact build with dealership');
  expect(service).not.toContain('confirm exact build with dealership');
  expect(engineering).not.toContain('Exact local build is unverified');
  expect(engineering).not.toContain('exact local fitment is unverified');
  for(const supplied of ['12.419-litre','SINOTRUK MC13.48','ZF 12TX2621','480HP · 2300NM · 65T GCM','6×4 · 34T GVM · 65T GCM','6×4 TIPPER · MINING & CONSTRUCTION']) expect(engineering).toContain(supplied);
  expect(engineering).toContain('Supplied G7H specification');
  expect(engineering).toContain('Supplied G7S specification');
  expect(service).toContain('Supplied G7H specification');
  expect(service).toContain('A sleeper cab is listed for the G7H 64480');
 });
 it('identifies the supplied G7H specification without a section-level confirmation instruction',()=>{
  const engineering=sectionText('the-engineering');
  expect(engineering).toContain('Supplied G7H specification');
  expect(engineering).not.toContain('Confirm the exact build, applicable approval documentation and intended application with the dealership.');
  expect(engineering).not.toMatch(/homologated|specified for (?:gravel|the roads)|quarry floors|mine haul roads/i);
 });
});

// Separate outstanding ownership flag, not an exception inside the claims assertions.
// Hero is mounted again; this historical "latent" source issue is now reachable.
it('reactivated hero must not describe GCM as pulling capacity',()=>{
 const hero=homepage().getElementById('top');
 expect(hero).not.toBeNull();
 expect(hero!.textContent).not.toMatch(/tonnes of pulling capacity/i);
 expect(hero!.textContent).toMatch(/gross combination mass/i);
});
