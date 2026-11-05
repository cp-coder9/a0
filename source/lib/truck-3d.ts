import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const truckIllustrations:Record<string,{color:number;roof:number;tipper:boolean;steering:'right'|'illustrative';name:string}>={
 'g7h':{color:0xe4e7e6,roof:3.65,tipper:false,steering:'right',name:'SITRAK G7H'},
 'g7s':{color:0xe4e7e6,roof:3.65,tipper:false,steering:'illustrative',name:'SITRAK G7S'},
 'howo-tapa':{color:0xdcc4a0,roof:3.05,tipper:true,steering:'illustrative',name:'HOWO Tapa'},
 'howo-max':{color:0x245e9e,roof:3.85,tipper:false,steering:'illustrative',name:'HOWO MAX'},
};
export type ViewState={left:boolean;right:boolean;service:boolean;cockpit:boolean;rotating:boolean};
export type ViewAction='left'|'right'|'service'|'cockpit'|'exterior'|'rotate'|'motion-on'|'motion-off';
export const initialView=(reduced:boolean):ViewState=>({left:false,right:false,service:false,cockpit:false,rotating:!reduced});
export function viewReducer(s:ViewState,a:ViewAction):ViewState{if(a==='motion-on'||a==='motion-off')return {...s,rotating:a==='motion-on'};if(a==='cockpit')return {...s,cockpit:true,rotating:false,service:false};if(a==='exterior')return {...s,cockpit:false};if(a==='rotate')return {...s,rotating:!s.rotating};return {...s,[a]:!s[a]};}
// Procedural proportions and component placement are illustrative, not CAD or mechanical specifications.
export function createTruckModel(id:string){
 const config=truckIllustrations[id];if(!config)throw new Error('Unknown truck illustration');
 if(id!=='howo-tapa')return createDetailedTractor(id,config);
 const root=new THREE.Group();root.name=id;
 const mat=(color:number,metalness=.1)=>new THREE.MeshStandardMaterial({color,metalness,roughness:.52});
 const paint=mat(config.color,.4),black=mat(0x20262b),rubber=mat(0x15191b),chrome=mat(0xa2abb0,.75),trim=mat(0x414a51),seat=mat(0x687078),gold=mat(0xd7af5c,.5);
 const glass=new THREE.MeshStandardMaterial({color:0x8eb5c8,transparent:true,opacity:.25,roughness:.15,metalness:.15,depthWrite:false,side:THREE.DoubleSide});
 function box(parent:THREE.Object3D,name:string,size:number[],pos:number[],material:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size as [number,number,number]),material);mesh.name=name;mesh.position.set(...pos as [number,number,number]);parent.add(mesh);return mesh;}
 function cylinder(parent:THREE.Object3D,name:string,r:number,h:number,pos:number[],material:THREE.Material){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),material);mesh.name=name;mesh.position.set(...pos as [number,number,number]);parent.add(mesh);return mesh;}
 box(root,'chassis',[1.8,.27,6.8],[0,.9,.6],black);
 for(const z of [-1.75,1.65,2.9]){const axle=cylinder(root,'axle',.13,2.3,[0,.65,z],black);axle.rotation.z=Math.PI/2;for(const x of [-1.12,1.12]){const wheel=cylinder(root,'tyre',.58,.38,[x,.64,z],rubber);wheel.rotation.z=Math.PI/2;const rim=cylinder(root,'wheel-rim',.33,.4,[x,.64,z],chrome);rim.rotation.z=Math.PI/2;const hub=cylinder(root,'hub',.13,.43,[x,.64,z],black);hub.rotation.z=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;const bolt=cylinder(root,'wheel-bolt',.025,.45,[x,.64+Math.cos(a)*.24,z+Math.sin(a)*.24],gold);bolt.rotation.z=Math.PI/2;}}}
 for(const x of [-.96,.96]){box(root,'fuel-tank',[.4,.6,1.25],[x,.85,.15],chrome);box(root,'step',[.42,.12,.8],[x,1.16,-1.4],trim);}
 const cab=new THREE.Group();cab.name='cab';root.add(cab);
 box(cab,'floor',[2.35,.16,2.3],[0,1.55,-1.3],trim);
 box(cab,'rear-cab-wall',[2.35,config.roof-1.55,.1],[0,(config.roof+1.55)/2,-.2],paint);
 box(cab,'roof',[2.4,.22,2.5],[0,config.roof,-1.35],paint);
 box(cab,'front-windshield',[2.13,.9,.035],[0,2.66,-2.55],glass);
 for(const x of [-1.12,1.12])box(cab,'windshield-pillar',[.13,1.35,.15],[x,2.75,-2.51],paint);
 box(cab,'windshield-header',[2.3,.13,.15],[0,3.17,-2.51],paint);
 if(config.roof>3.3)box(cab,'high-roof-front',[2.3,config.roof-3.25,.16],[0,(3.25+config.roof)/2,-2.51],paint);
 box(cab,'bumper',[2.5,.32,.27],[0,1.04,-2.6],paint);
 box(cab,'lower-grille',[1.35,.24,.08],[0,1.1,-2.76],black);
 for(const x of [-.88,.88]){box(cab,'headlight',[.44,.16,.07],[x,1.11,-2.77],new THREE.MeshStandardMaterial({color:0xf4f0da,emissive:0xb6a378,emissiveIntensity:.4}));box(cab,'front-corner',[.23,.8,.3],[x*1.22,1.7,-2.45],paint);}
 const service=new THREE.Group();service.name='front-service-panel';service.position.set(0,2.2,-2.55);cab.add(service);
 box(service,'service-face',[1.86,.88,.1],[0,-.44,0],paint);
 for(let y=-.7;y<-.15;y+=.13)box(service,'grille-slat',[1.45,.045,.06],[0,y,-.08],black);
 box(service,'illustrated-badge',[.3,.09,.07],[0,-.09,-.08],chrome);
 const engine=new THREE.Group();engine.name='engine';engine.position.set(0,1.72,-2.16);cab.add(engine);
 box(engine,'engine-block',[1.02,.48,.5],[0,0,0],trim);box(engine,'engine-head',[1.05,.12,.48],[0,.3,0],chrome);
 for(let i=0;i<6;i++)box(engine,'illustrative-cylinder',[.1,.15,.48],[-.43+i*.17,.1,-.04],gold);
 const fan=cylinder(engine,'fan',.24,.08,[.66,0,-.08],black);fan.rotation.x=Math.PI/2;
 const doors:THREE.Group[]=[];
 for(const side of [-1,1]){const door=new THREE.Group();door.name=side<0?'left-door':'right-door';door.position.set(side*1.19,1.6,-2.4);cab.add(door);doors.push(door);
 box(door,'door-panel',[.09,.72,1.45],[0,.36,.76],paint);box(door,'door-window',[.035,.75,1.3],[0,1.13,.76],glass);
 box(door,'door-top-frame',[.09,.08,1.45],[0,1.56,.76],paint);box(door,'door-rear-frame',[.09,.9,.1],[0,1.1,1.45],paint);box(door,'door-handle',[.11,.07,.25],[side*.06,.62,1.17],black);
 box(door,'mirror-stem',[.27,.05,.08],[side*.14,1.11,-.09],black);box(door,'mirror',[.18,.44,.14],[side*.29,1.1,-.11],trim);
 for(const y of [0.1,.3])box(cab,'cab-step',[.3,.06,.8],[side*1.17,1.1+y,-1.1],chrome);
 }
 box(cab,'dashboard',[2.08,.34,.53],[0,2.18,-2.18],black);
 for(const x of [-.78,.78]){box(cab,'seat-cushion',[.61,.15,.66],[x,1.87,-1.15],seat);box(cab,'seat-back',[.61,.66,.15],[x,2.2,-.88],seat);box(cab,'seat-headrest',[.36,.22,.15],[x,2.64,-.88],black);box(cab,'seat-base',[.32,.28,.32],[x,1.66,-1.15],black);}
 const driverX=config.steering==='right'?.72:-.72;
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.23,.026,12,40),black);wheel.name='steering-wheel';wheel.position.set(driverX,2.42,-1.91);wheel.rotation.x=-.45;cab.add(wheel);
 box(cab,'wheel-spoke',[.4,.035,.035],[driverX,2.42,-1.91],chrome);box(cab,'instrument-display',[.4,.17,.025],[driverX,2.4,-2.015],new THREE.MeshStandardMaterial({color:0x599dba,emissive:0x29546a,emissiveIntensity:.5}));box(cab,'console-display',[.23,.18,.02],[0,2.36,-1.905],trim);
 if(!config.tipper){box(cab,'illustrative-sleeper',[1.95,.23,.42],[0,1.84,-.48],seat);box(root,'rear-deck',[2,.1,2.6],[0,1.14,1.8],trim);const fifth=cylinder(root,'fifth-wheel',.65,.14,[0,1.28,2.05],black);fifth.scale.z=.7;box(root,'rear-mudguards',[2.55,.12,2.1],[0,1.33,2.3],paint);}
 else{const body=new THREE.Group();body.name='tipper-body';root.add(body);const bodyMat=mat(0x9a744d,.3);box(body,'tipper-floor',[2.4,.15,4.1],[0,1.48,1.95],bodyMat);for(const x of [-1.2,1.2]){box(body,'tipper-side',[.12,1.4,4.1],[x,2.18,1.95],bodyMat);for(let z=.15;z<4;z+=.65)box(body,'tipper-rib',[.18,1.45,.1],[x,2.18,z],paint);}for(const z of [-.1,4])box(body,'tipper-end',[2.4,1.4,.12],[0,2.18,z],bodyMat);}
 box(root,'rear-bumper',[2.4,.13,.12],[0,.72,4.08],chrome);
 return {root,doors,service,driverX,config};
}

/** Authored from family-level photographs, not measured factory geometry.
 * Front is -Z; hinge origins intentionally match the legacy tour contract.
 * Repeated details are merged per material and moving parent (no per-stud draw calls).
 */
function createDetailedTractor(id:string,config:(typeof truckIllustrations)[string]){
 const max=id==='howo-max',root=new THREE.Group();root.name=id;
 root.userData={accuracy:'Original reference-based illustration; not exact factory CAD',source:'Family-level supplied exterior photographs',interior:'Exterior-only illustrative void; genuine cabin imagery is the primary interior',authoring:'Original procedural geometry and generated PBR materials'};
 const material=(name:string,color:number,metalness:number,roughness:number)=>{const m=new THREE.MeshStandardMaterial({name,color,metalness,roughness});return m;};
 const paint=material('original-painted-metal',config.color,.48,.3),dark=material('powder-coated-chassis',0x192127,.45,.6),rubber=material('rubber',0x16191b,.02,.86),chrome=material('satin-aluminium',0xb5c2c9,.85,.26),trim=material('anthracite-trim',0x303a41,.15,.48),gold=material('muted-metallic-accent',0x9f8555,.7,.34);
 const glass=material('recessed-smoked-glazing',0x142e38,.5,.13),lens=material('headlamp-lens',0xb8cbd1,.45,.18),white=material('DRL-diffuser',0xe7f1f3,.05,.28),amber=material('amber-reflector',0xc77523,.2,.32),red=material('red-reflector',0x8e1b1e,.2,.3);
 white.emissive.setHex(0xb0d0db);white.emissiveIntensity=.25;
 const cab=new THREE.Group();cab.name='cab';root.add(cab);
 function mesh(p:THREE.Object3D,n:string,g:THREE.BufferGeometry,m:THREE.Material,pos:number[]=[0,0,0]){const o=new THREE.Mesh(g,m);o.name=n;o.position.set(pos[0],pos[1],pos[2]);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
 function panel(p:THREE.Object3D,n:string,s:number[],v:number[],m:THREE.Material,r=.05){const g=new RoundedBoxGeometry(s[0],s[1],s[2],3,Math.min(r,...s.map(d=>d*.45)));return mesh(p,n,g,m,v);}
 function box(p:THREE.Object3D,n:string,s:number[],v:number[],m:THREE.Material){return mesh(p,n,new THREE.BoxGeometry(s[0],s[1],s[2]),m,v);}
 function cyl(p:THREE.Object3D,n:string,r:number,h:number,v:number[],m:THREE.Material,axis='y'){const o=mesh(p,n,new THREE.CylinderGeometry(r,r,h,32),m,v);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;return o;}
 function tube(p:THREE.Object3D,n:string,points:number[][],r:number,m:THREE.Material,smooth=true){const vectors=points.map(v=>new THREE.Vector3(...v as [number,number,number]));const path=new THREE.CurvePath<THREE.Vector3>();for(let i=1;i<vectors.length;i++)path.add(new THREE.LineCurve3(vectors[i-1],vectors[i]));return mesh(p,n,new THREE.TubeGeometry(smooth?new THREE.CatmullRomCurve3(vectors):path,Math.max(8,points.length*5),r,6,false),m);}
 function shape(p:THREE.Object3D,n:string,xy:number[][],depth:number,pos:number[],m:THREE.Material){const s=new THREE.Shape();xy.forEach((v,i)=>i?s.lineTo(v[0],v[1]):s.moveTo(v[0],v[1]));s.closePath();return mesh(p,n,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.018,bevelThickness:.015}),m,pos);}
 function repeated(p:THREE.Object3D,n:string,geometry:THREE.BufferGeometry,m:THREE.Material,transforms:{pos:number[];rot?:number[];scale?:number[]}[]){const gs=transforms.map(t=>{const g=geometry.clone();const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...t.pos as [number,number,number]),new THREE.Quaternion().setFromEuler(new THREE.Euler(...(t.rot??[0,0,0]) as [number,number,number])),new THREE.Vector3(...(t.scale??[1,1,1]) as [number,number,number]));return g.applyMatrix4(matrix);});const merged=mergeGeometries(gs);gs.forEach(g=>g.dispose());geometry.dispose();if(!merged)throw new Error('Unable to merge tractor detail');const result=mesh(p,n,merged,m);result.userData.repeatedElements=transforms.length;return result;}
 // Cab is an open shell, not a solid box behind the glazing.
 panel(cab,'floor',[2.35,.16,2.3],[0,1.55,-1.3],trim);
 panel(cab,'rear-cab-wall',[2.35,config.roof-1.55,.17],[0,(config.roof+1.55)/2,-.2],paint,.08);
 panel(cab,'roof',[2.4,.4,2.42],[0,config.roof,-1.34],paint,.18);
 panel(cab,'high-roof-front',[2.34,config.roof-3.17,.42],[0,(config.roof+3.17)/2,-2.34],paint,.18);
 for(const side of [-1,1]){
  panel(cab,'sleeper-side',[.17,config.roof-1.6,.68],[side*1.105,(config.roof+1.6)/2,-.53],paint,.07);
  panel(cab,'roof-side-shoulder',[.18,.5,1.75],[side*1.105,3.36,-1.67],paint,.08);
  panel(cab,'sleeper-window-gasket',[.035,.33,.51],[side*1.201,2.9,-.55],rubber,.055);
  panel(cab,'sleeper-window',[.022,.26,.43],[side*1.222,2.9,-.55],glass,.045);
  const pillar=panel(cab,'windshield-pillar',[.15,1.11,.17],[side*1.09,2.7,-2.46],paint);pillar.rotation.x=-.08;
  panel(cab,'front-corner',[.27,.95,.38],[side*1.07,1.74,-2.36],paint,.1);
  panel(cab,'rear-cab-air-deflector',[.13,1.4,.32],[side*1.14,2.85,-.12],paint);
 }
 const wind=panel(cab,'windshield-recess',[2.17,1.03,.07],[0,2.73,-2.5],rubber,.08);wind.rotation.x=-.08;
 const glazing=panel(cab,'front-windshield',[2.02,.9,.035],[0,2.73,-2.548],glass,.075);glazing.rotation.x=-.08;
 panel(cab,'windshield-header',[2.3,.12,.18],[0,3.21,-2.49],trim);
 panel(cab,'sun-visor',[2.29,.2,.3],[0,3.22,-2.61],max?trim:paint,.07);
 panel(cab,'windscreen-cowl',[2.21,.12,.2],[0,2.19,-2.55],paint);
 for(const x of [-.53,.53]){tube(cab,'wiper-arm',[[x-.13,2.22,-2.604],[x,2.3,-2.61],[x+.23,2.27,-2.61]],.014,dark);panel(cab,'wiper-blade',[.62,.027,.025],[x+.04,2.28,-2.63],rubber,.008);}
 const doors:THREE.Group[]=[];
 for(const side of [-1,1]){
  const door=new THREE.Group();door.name=side<0?'left-door':'right-door';door.position.set(side*1.19,1.6,-2.4);cab.add(door);doors.push(door);
  panel(door,'door-panel',[.11,.72,1.45],[0,.36,.76],paint,.045);
  panel(door,'door-window-recess',[.09,.82,1.44],[-side*.006,1.1,.76],rubber,.06);
  panel(door,'door-window',[.035,.69,1.26],[side*.037,1.1,.75],glass,.055);
  panel(door,'door-top-frame',[.115,.1,1.46],[0,1.55,.76],paint);
  panel(door,'door-rear-frame',[.12,.9,.1],[0,1.1,1.46],paint);
  panel(door,'door-front-frame',[.12,.92,.1],[0,1.08,.06],paint);
  panel(door,'quarter-light-divider',[.07,.7,.035],[side*.055,1.12,.29],trim,.012);
  panel(door,'door-belt-line',[.125,.055,1.41],[side*.007,.73,.76],trim,.015);
  panel(door,'door-handle-recess',[.025,.18,.2],[side*.066,.36,1.22],rubber,.04);
  panel(door,'door-handle',[.045,.115,.045],[side*.091,.38,1.23],chrome,.018);
  tube(door,'mirror-upper-stalk',[[0,1.43,.12],[side*.19,1.38,-.18],[side*.3,1.25,-.23]],.028,trim);
  tube(door,'mirror-lower-stalk',[[0,.8,.1],[side*.24,.75,-.19],[side*.3,.95,-.23]],.025,trim);
  panel(door,'mirror-housing',[.22,.54,.21],[side*.3,1.12,-.23],trim,.075);
  panel(door,'mirror-glass',[.17,.45,.018],[side*.3,1.12,-.113],chrome,.05);
  panel(door,'wide-angle-mirror',[.22,.21,.2],[side*.3,.73,-.23],trim,.05);
  panel(door,'wide-angle-mirror-glass',[.17,.15,.018],[side*.3,.73,-.12],chrome,.035);
 }
 panel(cab,'bumper',[2.45,.31,.37],[0,.99,-2.5],paint,.095);
 panel(cab,'lower-grille',[1.38,.25,.09],[0,1.08,-2.716],dark,.06);
 panel(cab,'lower-chin',[1.7,.1,.19],[0,.8,-2.58],trim);
 panel(cab,'bumper-mid-fascia',[1.46,.12,.16],[0,1.265,-2.65],paint,.045);
 const service=new THREE.Group();service.name='front-service-panel';service.position.set(0,2.2,-2.55);cab.add(service);
 panel(service,'service-face',[1.91,.86,.13],[0,-.43,0],paint,.08);
 if(max){
  const grille=new THREE.Group();grille.name='max-chevron-grille';service.add(grille);
  shape(grille,'max-grille-recess',[[-.92,-.08],[.92,-.08],[1,-.75],[.68,-.84],[-.68,-.84],[-1,-.75]],.035,[0,0,-.13],dark);
  for(let i=0;i<3;i++){const y=-.2-i*.23;tube(grille,'max-chevron-brightwork',[[-.88,y+.055,-.18],[-.7,y+.045,-.19],[-.5,y-.035,-.2],[.5,y-.035,-.2],[.7,y+.045,-.19],[.88,y+.055,-.18]],.027,chrome,false);}
  repeated(grille,'max-grille-vertical-vanes',new THREE.BoxGeometry(.025,.59,.025),trim,Array.from({length:19},(_,i)=>({pos:[-.81+i*.09,-.46,-.16]})));
 }else{
  const grille=new THREE.Group();grille.name='c7h-mesh-grille';service.add(grille);
  shape(grille,'c7h-trapezoid-grille',[[-.86,-.15],[.86,-.15],[.69,-.77],[-.69,-.77]],.035,[0,0,-.13],dark);
  tube(grille,'c7h-grille-perimeter',[[-.88,-.14,-.18],[.88,-.14,-.18],[.7,-.78,-.18],[-.7,-.78,-.18],[-.88,-.14,-.18]],.022,gold,false);
  const diamonds=[];for(let row=0;row<6;row++)for(let col=0;col<19;col++){const x=(col-9)*.074+(row%2)*.035;if(Math.abs(x)<.8-row*.017)diamonds.push({pos:[x,-.21-row*.09,-.175],rot:[0,0,.42]});}
  repeated(grille,'c7h-diamond-mesh',new THREE.BoxGeometry(.018,.061,.015),chrome,diamonds);
 }
 panel(service,'illustrated-badge',[.13,.16,.06],[0,-.3,-.22],gold,.03);
 // Family-specific lower lamp housings: swept C7H / angular MAX projector and vertical DRL.
 for(const side of [-1,1]){
  shape(cab,'headlight-surround',[[side*.7,1.47],[side*1.15,1.59],[side*1.17,1.12],[side*.77,1.15]],.08,[0,0,-2.68],trim);
  panel(cab,'headlight-lens',[.34,.19,.026],[side*.96,1.36,-2.717],lens,.04);
  for(const dx of [-.075,.075])cyl(cab,'projector-reflector',.058,.028,[side*.96+dx,1.37,-2.742],chrome,'z');
  tube(cab,'headlamp-DRL',[[side*.79,1.43,-2.762],[side*.82,1.27,-2.766],[side*1.09,1.3,-2.762],[side*1.12,max?1.47:1.39,-2.75]],.018,white);
  if(max)tube(cab,'max-vertical-DRL',[[side*1.15,1.41,-2.74],[side*1.18,1.17,-2.75],[side*1.14,.94,-2.72]],.019,white);
  else panel(cab,'lower-fog-lamp',[.22,.09,.04],[side*.98,1.1,-2.72],amber,.025);
 }
 const engine=new THREE.Group();engine.name='engine';engine.position.set(0,1.72,-2.16);cab.add(engine);
 panel(engine,'engine-block',[1.05,.42,.49],[0,0,0],trim);
 panel(engine,'engine-head',[.94,.13,.43],[0,.27,0],chrome);
 repeated(engine,'engine-cast-ribs',new THREE.BoxGeometry(.035,.32,.46),dark,Array.from({length:9},(_,i)=>({pos:[-.43+i*.105,.02,-.08]})));
 tube(engine,'illustrative-coolant-pipe',[[-.5,.2,0],[-.65,.15,-.14],[-.64,-.13,-.2],[-.42,-.24,-.16]],.045,rubber);
 cyl(engine,'fan',.22,.07,[.64,0,-.05],dark,'z');
 // No invented dashboard or seats: invisible anchors retain consumer lookup compatibility.
 for(const name of ['dashboard','steering-wheel']){const anchor=new THREE.Group();anchor.name=name;anchor.userData.illustrativeAnchorOnly=true;cab.add(anchor);}
 const driverX=config.steering==='right'?.72:-.72;
 const chassis=new THREE.Group();chassis.name='chassis';root.add(chassis);
 for(const side of [-1,1])box(chassis,'chassis-rail',[.16,.29,6.65],[side*.72,.9,.62],dark);
 repeated(chassis,'chassis-crossmembers',new THREE.BoxGeometry(1.34,.13,.13),dark,[-2,-.8,.4,1.35,2.5,3.5].map(z=>({pos:[0,.91,z]})));
 const tread:{pos:number[];rot:number[]}[]=[],studs:{pos:number[];rot:number[]}[]=[],vents:{pos:number[];rot:number[]}[]=[],sidewall:{pos:number[];rot:number[]}[]=[];
 for(const z of [-1.75,1.65,2.9]){
  cyl(root,'axle',.12,2.2,[0,.64,z],dark,'x');const diff=cyl(root,'differential',.22,.38,[0,.64,z],trim,'x');diff.scale.z=1.2;
  for(const side of [-1,1]){
   const rear=z>0,x=side*1.12;
   const profile=[new THREE.Vector2(.37,-.19),new THREE.Vector2(.49,-.19),new THREE.Vector2(.555,-.14),new THREE.Vector2(.578,-.075),new THREE.Vector2(.578,.075),new THREE.Vector2(.555,.14),new THREE.Vector2(.49,.19),new THREE.Vector2(.37,.19)];
   const tyre=mesh(root,'tyre',new THREE.LatheGeometry(profile,48),rubber,[x,.64,z]);tyre.rotation.z=Math.PI/2;
   if(rear){const inner=mesh(root,'dual-inner-tyre',new THREE.LatheGeometry(profile,40),rubber,[side*.79,.64,z]);inner.rotation.z=Math.PI/2;inner.scale.y=.7;}
   // Profiled rim well and rolled bead rather than a flat coloured disc.
   const rim=mesh(root,'wheel-rim',new THREE.LatheGeometry([new THREE.Vector2(.11,-.19),new THREE.Vector2(.24,-.18),new THREE.Vector2(.3,-.12),new THREE.Vector2(.34,-.15),new THREE.Vector2(.35,-.2),new THREE.Vector2(.375,-.2),new THREE.Vector2(.375,.2),new THREE.Vector2(.35,.2),new THREE.Vector2(.33,.17),new THREE.Vector2(.28,.14),new THREE.Vector2(.13,.14)],48),chrome,[x,.64,z]);rim.rotation.z=Math.PI/2;
   cyl(root,'hub',.13,.44,[x,.64,z],trim,'x');cyl(root,'hub-cap',.095,.018,[side*1.351,.64,z],chrome,'x');
   const bead=mesh(root,'tyre-sidewall-bead',new THREE.TorusGeometry(.455,.009,5,48),rubber,[side*1.314,.64,z]);bead.rotation.y=Math.PI/2;
   for(let i=0;i<10;i++){const a=i*Math.PI*2/10;studs.push({pos:[side*1.335,.64+Math.cos(a)*.19,z+Math.sin(a)*.19],rot:[0,0,Math.PI/2]});vents.push({pos:[side*1.326,.64+Math.cos(a)*.285,z+Math.sin(a)*.285],rot:[0,0,Math.PI/2]});}
   for(let i=0;i<64;i++){const a=i*Math.PI*2/64;for(let row=0;row<3;row++)tread.push({pos:[x+(row-1)*.105,.64+Math.cos(a)*.578,z+Math.sin(a)*.578],rot:[a,0,row%2?.2:-.2]});if(i%2===0)sidewall.push({pos:[side*1.307,.64+Math.cos(a)*.49,z+Math.sin(a)*.49],rot:[a,0,0]});}
   if(rear){
    const mud=mesh(root,'rear-mudguard',new THREE.TorusGeometry(.67,.055,6,32,Math.PI),paint,[side*1.1,.64,z]);mud.rotation.y=Math.PI/2;mud.scale.z=4.5;
    panel(root,'rear-mudguard-top',[.52,.065,1.05],[side*1.1,1.3,z],paint,.03);
    panel(root,'mudflap',[.49,.38,.045],[side*1.1,.46,z+.58],rubber,.012);
   }else{
    const arch=mesh(cab,'front-wheel-arch',new THREE.TorusGeometry(.675,.095,8,36,Math.PI),paint,[side*1.12,.64,z]);arch.rotation.y=Math.PI/2;arch.scale.z=1.8;
    panel(cab,'front-arch-leading-cheek',[.27,.35,.26],[side*1.1,1.12,-2.42],paint,.09);
   }
   // Axle suspension leaves retain the open space between the chassis rails.
   for(let j=0;j<3;j++)box(root,'suspension-leaf',[.09,.024,1-j*.13],[side*.65,.61+j*.027,z],trim);
  }
 }
 repeated(root,'tyre-tread-batch',new THREE.BoxGeometry(.082,.018,.044),rubber,tread);
 repeated(root,'tyre-sidewall-rib-batch',new THREE.BoxGeometry(.01,.009,.05),rubber,sidewall);
 repeated(root,'wheel-stud-batch',new THREE.CylinderGeometry(.021,.021,.036,6),chrome,studs);
 repeated(root,'rim-vent-batch',new THREE.CylinderGeometry(.037,.037,.008,12),dark,vents);
 const stepPattern=[];
 for(const side of [-1,1]){
  panel(root,'fuel-tank',[.48,.62,1.28],[side*1.01,.86,.12],chrome,.13);
  cyl(root,'fuel-filler-cap',.075,.025,[side*1.263,1.04,-.26],trim,'x');
  repeated(root,'tank-straps',new THREE.BoxGeometry(.49,.635,.042),trim,[-.32,.55].map(z=>({pos:[side*1.01,.86,z]})));
  panel(root,'tank-fairing',[.08,.35,1.39],[side*1.29,.69,.11],paint,.06);
  panel(cab,'entry-step-recess',[.2,.43,.69],[side*1.14,1.14,-.86],dark,.04);
  for(let i=0;i<3;i++){
   const y=.98+i*.18,z=-.94-i*.075;panel(cab,'cab-step',[.31,.045,.53],[side*1.22,y,z],chrome,.015);
   for(let a=0;a<4;a++)for(let b=0;b<7;b++)stepPattern.push({pos:[side*1.22+(a-1.5)*.06,y+.027,z+(b-3)*.062]});
  }
  tube(cab,'entry-grab-handle',[[side*1.25,1.61,-.67],[side*1.29,1.68,-.67],[side*1.29,1.95,-.67],[side*1.25,2.01,-.67]],.018,trim);
  tube(cab,'sleeper-panel-seam',[[side*1.199,1.64,-.34],[side*1.199,2.3,-.34],[side*1.199,2.56,-.34]],.005,trim);
  panel(cab,'side-indicator',[.02,.063,.13],[side*1.247,1.48,-2.11],amber,.015);
  panel(root,'rear-tail-lamp',[.28,.11,.06],[side*1.01,.72,3.65],red,.025);
  panel(root,'rear-reverse-lamp',[.09,.1,.065],[side*.8,.72,3.65],lens,.02);
 }
 repeated(cab,'cab-step-tread-batch',new THREE.BoxGeometry(.024,.005,.025),dark,stepPattern);
 // Two small catwalk sections leave the rail structure and coupling visible.
 const catwalk=[];for(let i=0;i<17;i++)catwalk.push({pos:[0,1.12,.3+i*.044]});
 repeated(root,'perforated-catwalk',new THREE.BoxGeometry(1.21,.035,.023),chrome,catwalk);
 const fifth=new THREE.Group();fifth.name='fifth-wheel';fifth.position.set(0,1.27,2.05);root.add(fifth);
 for(const x of [-.42,.42])panel(fifth,'coupling-pedestal',[.19,.17,.8],[x,-.07,0],trim);
 const couplingShape=new THREE.Shape();couplingShape.moveTo(-.64,.34);couplingShape.bezierCurveTo(-.87,-.58,.87,-.58,.64,.34);couplingShape.lineTo(.16,.56);couplingShape.lineTo(.065,.04);couplingShape.lineTo(-.065,.04);couplingShape.lineTo(-.16,.56);couplingShape.closePath();
 const plate=mesh(fifth,'slotted-coupling-plate',new THREE.ExtrudeGeometry(couplingShape,{depth:.09,bevelEnabled:true,bevelSize:.02,bevelThickness:.015,bevelSegments:2}),dark);plate.rotation.x=Math.PI/2;plate.position.y=.12;
 tube(fifth,'coupling-release-handle',[[.54,0,.1],[.83,0,.12],[.93,0,.24]],.018,chrome);
 const hoses=new THREE.Group();hoses.name='air-hoses';root.add(hoses);
 for(let j=0;j<3;j++){
  const points=[];for(let i=0;i<=180;i++){const t=i/180,a=t*Math.PI*22;points.push([-.39+j*.28+Math.sin(a)*.053,1.57+Math.sin(t*Math.PI)*.42+Math.cos(a)*.053,-.03+t*.78]);}
  tube(hoses,j===0?'red-air-line':j===1?'amber-air-line':'electrical-line',points,.013,j===0?red:j===1?amber:rubber);
  cyl(hoses,'hose-connector',.037,.1,[-.39+j*.28,1.57,-.03],chrome,'z');
 }
 cyl(root,'air-reservoir',.17,.7,[0,.65,.3],trim,'x');
 tube(root,'prop-shaft',[[0,.7,-.45],[0,.68,1.65],[0,.68,2.9]],.065,dark);
 panel(root,'rear-bumper',[2.35,.14,.14],[0,.55,3.73],chrome);
 panel(root,'rear-registration-recess',[.47,.14,.04],[0,.72,3.75],dark,.015);
 if(!max){
  shape(cab,'c7h-lower-intake',[[-.68,1.31],[.68,1.31],[.57,.98],[-.57,.98]],.025,[0,0,-2.734],dark);
  repeated(cab,'c7h-lower-intake-mesh',new THREE.BoxGeometry(.012,.23,.013),chrome,Array.from({length:17},(_,i)=>({pos:[-.56+i*.07,1.145,-2.767],rot:[0,0,.16]})));
 }
 // Upper-roof marker lamps and a soft aerodynamic roof crown break the slab silhouette.
 panel(cab,'roof-aero-crown',[2.24,.24,1.95],[0,config.roof+.11,-1.2],paint,.11);
 for(const x of [-.66,0,.66])panel(cab,'roof-marker',[.1,.035,.05],[x,3.34,-2.57],max?white:amber,.014);
 return {root,doors,service,driverX,config};
}
