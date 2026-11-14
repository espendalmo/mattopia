import {randomGenerator, REGION_PLACES, GRAND_REGION_PLACES} from './worlds.js';

const STEP=2.65;
const GRID=61;
const EDGE=STEP*(GRID-1)/2;
const NEIGHBORS=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
const layouts=new Map();

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const mix=(a,b,t)=>a+(b-a)*t;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const polar=(angle,r)=>({x:Math.sin(angle)*r,z:Math.cos(angle)*r});

export const RESIDENCE_PLOT={halfWidth:6.65,halfDepth:7.85,deck:.194,gateHalf:1.13,bayX:3.25,bayZ:4.03,
  paving:{city:'#cbbba2',island:'#e1caa7',moon:'#adabc0'}};
export const WOOD_COASTER_PLOT={halfWidth:10.8,halfDepth:7.6};
export const SHORE_WALK_HALF_WIDTH=1.12;
export const SHORE_WALK_LOT_GAP=8.2;

export function riverAt(layout,z) {
  return 6.8*Math.sin(z*.046+layout.phase)+2.45*Math.sin(z*.101-layout.phase);
}

export function riverWidth(layout,z) {
  const width=(layout.grand?6.15:3.85)+1.1*Math.sin(z*.071+layout.phase)+.45*Math.cos(z*.23);
  if (!layout.riverLagoon) return width;
  const {bridge,lagoon}=layout.riverLagoon;
  return width+2.4*Math.exp(-((z-bridge)**2)/74)+5.5*Math.exp(-((z-lagoon)**2)/91);
}

function coastAt(layout,x,z) {
  const dx=x/layout.radiusX,dz=z/layout.radiusZ;
  const angle=Math.atan2(dz,dx);
  const rim=1+.091*Math.sin(angle*3+layout.phase)+.063*Math.cos(angle*5-layout.phase)+.044*Math.sin(angle*7);
  return (rim-Math.hypot(dx,dz))*52;
}

export function insideIslandBelt(layout,center,x,z,reach=.75) {
  // Project the point outwards from the main house to test against the coast
  // in that direction, including the island's headlands and bays.
  return coastAt(layout,x,z)>=6.2
    &&coastAt(layout,center.x+(x-center.x)/reach,center.z+(z-center.z)/reach)>=0;
}

export function regionSurface(layout,x,z) {
  const {theme,phase,hills,basins}=layout;
  const detail=.55*Math.sin(x*.159+phase)*Math.cos(z*.158-phase)+.45*Math.cos((x+z)*.29+phase);
  let y=theme==='moon'?.88:.54;
  let basin=Infinity;
  let relief=0;
  for (const hill of hills) {
    const r=((x-hill.x)/hill.w)**2+((z-hill.z)/hill.d)**2;
    relief+=hill.h*Math.exp(-r*1.6);
  }
  for (const item of basins) {
    const r=Math.hypot((x-item.x)/item.w,(z-item.z)/item.d);
    basin=Math.min(basin,(r-1)*Math.min(item.w,item.d));
    if (theme==='moon'&&r<1.48) {
      relief+=item.h*(.33*Math.exp(-(((r-.9)/.22)**2))-.72*Math.max(0,1-r*r)**2);
    }
  }
  y+=relief+detail*(theme==='moon'?.38:.22);
  const lake=layout.moonLake;
  if (lake&&Math.abs(x-lake.x)<lake.w*1.17+3&&Math.abs(z-lake.z)<lake.w*1.17+3) {
    const dx=x-lake.x,dz=z-lake.z,c=Math.cos(lake.yaw),s=Math.sin(lake.yaw);
    const u=(dx*c-dz*s)/lake.w,v=(dx*s+dz*c)/lake.d,angle=Math.atan2(v,u);
    const rim=1+.083*Math.sin(angle*3+phase)+.047*Math.cos(angle*5-phase)+.035*Math.sin(angle*2);
    const bank=(Math.hypot(u,v)-rim)*lake.d;
    if (bank<2.9) {
      const edge=clamp(bank/2.9,0,1);
      const dust=lake.y+.019*Math.sin(u*13+v*8)+.015*Math.cos(v*19-u*4);
      return {y:mix(dust,y,edge*edge*(3-2*edge)),water:false,bank,basin:Math.min(basin,bank),detail,relief,moonLake:true};
    }
  }
  if (theme==='moon') return {y,water:false,bank:Infinity,basin,detail,relief};
  const volcano=layout.volcano;
  if (volcano) {
    const dx=(x-volcano.x)/volcano.halfWidth,dz=(z-volcano.z)/volcano.halfDepth;
    const r=Math.hypot(dx,dz)*(1+.074*Math.sin(Math.atan2(dz,dx)*5+phase));
    if (r<1.24) {
      const rim=Math.exp(-((r-.46)**2)/.032)*5.7;
      const cone=Math.max(0,1-r/1.24)**1.45*6.2;
      y+=rim+cone-5.25*Math.exp(-(r*r)/.065);
      if (r<.83) return {y,water:false,bank:12,basin,detail,relief:y,volcanic:r};
    }
  }
  const outerBank=theme==='city' ? Math.abs(x-riverAt(layout,z))-riverWidth(layout,z) : coastAt(layout,x,z);
  const bank=Math.min(outerBank,basin);
  const pond=basin<outerBank;
  const water=bank<0;
  return {y:water?.015:mix(.06,y,clamp(bank/3.25,0,1)),water,bank,basin,detail,relief,pond};
}

export function islandCoastPoint(layout,angle,setback=0) {
  let near=0,far=layout.grand?95:85;
  for (let i=0;i<15;i++) {
    const point=polar(angle,(near+far)/2);
    if (coastAt(layout,point.x,point.z)>0) near=(near+far)/2;
    else far=(near+far)/2;
  }
  return polar(angle,near-setback);
}

function coastSite(layout,angle) {
  const {x,z}=islandCoastPoint(layout,angle,1.45);
  return {x,z,y:Math.max(.65,regionSurface(layout,x,z).y+.28),yaw:angle,waterfront:true};
}

function cityBerth(layout,z,side) {
  const x=riverAt(layout,z)+side*(riverWidth(layout,z)+1.65);
  const turn=Math.atan2(-side,.19*Math.cos(z*.1+layout.phase));
  return {x,z,y:Math.max(.68,regionSurface(layout,x,z).y+.25),yaw:turn,waterfront:true};
}

function landscapeFeatures(theme,rng) {
  const hills=Array.from({length:theme==='city'?7:11},(_,i)=>({
    ...polar(i*2.4+rng()*.7,15+rng()*(theme==='island'?40:51)),
    w:7+rng()*10,d:6+rng()*9,h:theme==='city'?1+rng()*2.2:1.6+rng()*4.1,
  }));
  const basins=Array.from({length:theme==='moon'?10:theme==='city'?3:2},(_,i)=>({
    ...polar(i*2.39+rng()*.6,20+rng()*(theme==='moon'?43:23)),
    w:theme==='moon'?3.1+rng()*5.5:2.9+rng()*4.1,d:theme==='moon'?3.5+rng()*5.6:2.7+rng()*3.5,
    h:1.65+rng()*2.6,
  }));
  return {hills,basins};
}

function outlyingAirfield(layout) {
  const side=Math.sign(layout.origin.x)||1;
  const yaw=-side*Math.PI/2,x=side*88;
  const candidates=[-34,-19,0,19,34].map(z=>{
    const ground=Array.from({length:8},(_,i)=>-7+2*i)
      .flatMap(dx=>Array.from({length:12},(_,i)=>regionSurface(layout,x+dx,z-11+2*i).y));
    const y=Math.max(...ground)+.16;
    return {x,y,z,yaw,airfield:true,score:y-Math.min(...ground)+Math.abs(z-layout.origin.z)*.007};
  });
  const {score,...site}=candidates.sort((a,b)=>a.score-b.score)[0];
  return site;
}

export function regionalPoint(site,x,z) {
  const cos=Math.cos(site.yaw),sin=Math.sin(site.yaw);
  return {x:site.x+x*cos+z*sin,z:site.z+z*cos-x*sin};
}

export function regionalFootprint(site,x,z,margin=0) {
  const a=x-site.x,b=z-site.z,cos=Math.cos(site.yaw),sin=Math.sin(site.yaw);
  const across=Math.abs(a*cos-b*sin),along=a*sin+b*cos;
  return across<site.halfWidth+margin&&Math.abs(along)<site.halfDepth+margin
    ||site.beach&&across<12.9+margin&&along>5.5-margin&&along<23+margin;
}

function districtGround(layout,site,halfWidth,halfDepth) {
  const samples=[-halfWidth,0,halfWidth].flatMap(x=>[-halfDepth,0,halfDepth].map(z=>{
    const p=regionalPoint(site,x,z);
    return regionSurface(layout,p.x,p.z);
  }));
  const high=Math.max(...samples.map(p=>p.y)),low=Math.min(...samples.map(p=>p.y));
  return {y:high+.09,grade:high-low,dry:samples.every(p=>!p.water&&p.bank>.35&&p.basin>-.6&&p.volcanic===undefined)};
}

function islandPromenade(layout,inlandLimit=46) {
  const resort=layout.beachResort;
  const angle=resort?.yaw??layout.phase;
  const c=Math.cos(angle),s=Math.sin(angle);
  const middle=62;
  const behindResort=point=>{
    if (!resort) return true;
    const dx=point.x-resort.x,dz=point.z-resort.z;
    const across=Math.abs(dx*c-dz*s),seaward=dx*s+dz*c;
    return across>=resort.halfWidth+2.45||seaward<=-resort.halfDepth-2.9;
  };
  const buildings=[
    ...layout.regionalSites.map(site=>site.beach?{...site,beach:false}:site),
    ...Object.entries(layout.berths).filter(([kind])=>kind==='pier'||kind==='marina').map(([kind,site])=>
      ({...regionalPoint(site,0,1.35),yaw:site.yaw,halfWidth:kind==='marina'?3.75:2.15,halfDepth:4.85})),
  ];
  const room=point=>{
    const tile=regionSurface(layout,point.x,point.z);
    return !tile.water&&tile.bank>1.38&&tile.volcanic===undefined&&behindResort(point)
      &&buildings.every(site=>!regionalFootprint(site,point.x,point.z,SHORE_WALK_HALF_WIDTH+.35));
  };
  const better=(a,b)=>!b||a.behind>b.behind||
    a.behind===b.behind&&(a.length>b.length||a.length===b.length&&a.cost<b.cost);
  // The route crosses the resort's centerline inland. Keep both wings as long
  // as the terrain allows, then prefer a gentle path close to the coast.
  let previous=[];
  let longest=null;
  for (let i=0;i<=2*middle;i++) {
    const heading=angle+(i-middle)*.014;
    const coast=islandCoastPoint(layout,heading);
    const dx=Math.sin(heading),dz=Math.cos(heading);
    const options=[];
    for (let setback=1.35;setback<=inlandLimit;setback+=.72) {
      const point={x:coast.x-dx*setback,z:coast.z-dz*setback};
      if (!room(point)) continue;
      const penalty=.33*Math.abs(setback-7.65);
      const isBehind=Number(Boolean(resort)&&i===middle);
      let best={point,setback,behind:isBehind,length:1,cost:penalty,from:null};
      for (const from of previous) {
        const gap=distance(from.point,point);
        if (gap>2.64) continue;
        const offset=setback-from.setback;
        const bend=from.from?offset-(from.setback-from.from.setback):0;
        const next={point,setback,behind:Math.max(isBehind,from.behind),length:from.length+1,
          cost:from.cost+penalty+Math.abs(offset)*1.7+Math.abs(bend)*1.2,from};
        if (better(next,best)&&room({x:mix(from.point.x,point.x,.5),z:mix(from.point.z,point.z,.5)})) best=next;
      }
      options.push(best);
      if (better(best,longest)) longest=best;
    }
    previous=options;
  }
  const path=[];
  for (let node=longest;node;node=node.from) path.push(node.point);
  // Give the promenade more room to turn around an unusually deep parcel.
  if (inlandLimit===46&&(path.length<101||(resort&&!longest?.behind))) return islandPromenade(layout,56);
  return path.length>=5?[path.reverse()]:[];
}

export function resortShore(layout,site,x) {
  for (let z=6.8;z<=29;z+=.45) {
    const at=regionalPoint(site,x,z);
    const ground=regionSurface(layout,at.x,at.z);
    if (ground.water&&!ground.pond) return z;
  }
  return null;
}

function beachDistrict(layout) {
  const candidates=[];
  for (let i=0;i<64;i++) {
    const yaw=layout.phase+(i*.381966%1)*Math.PI*2;
    const coast=coastSite(layout,yaw);
    for (const setback of [9.8,12.7,15.3]) {
      const site={...regionalPoint(coast,0,-setback),yaw,halfWidth:8.6,halfDepth:6.3,beach:true};
      if (Object.values(layout.berths).some(berth=>distance(berth,site)<23)) continue;
      const ground=districtGround(layout,site,8.6,6.35);
      if (!ground.dry||ground.grade>2.8) continue;
      const rear=regionalPoint(site,0,-site.halfDepth-3.6);
      const behind=regionSurface(layout,rear.x,rear.z);
      if (behind.bank<2.15||behind.y>ground.y+2.4) continue;
      const shores=[-12,-6,0,6,12].map(x=>resortShore(layout,site,x));
      if (shores.some(z=>z===null||z<8.1)) continue;
      const span=Math.max(...shores)-Math.min(...shores);
      candidates.push({...site,y:ground.y,south:Math.cos(yaw)>=Math.SQRT1_2,
        score:ground.grade*2.3+span*.24+setback*.07+i*.018});
    }
  }
  return candidates.sort((a,b)=>Number(b.south)-Number(a.south)||a.score-b.score)[0]??null;
}

function airDistrict(layout) {
  const bases=[];
  if (layout.theme==='island') {
    for (let i=0;i<32;i++) {
      const angle=layout.phase+i*Math.PI/16;
      const yaw=Math.round((angle+Math.PI)/(Math.PI/2))*(Math.PI/2);
      for (const reach of [44,39,34,28,22]) {
        bases.push({...polar(angle,reach),yaw,airfield:true});
      }
    }
  } else bases.push(outlyingAirfield(layout));

  const candidates=[];
  for (const base of bases) {
    const field={...base,halfWidth:10.9,halfDepth:6.9,airportDistrict:true};
    const ground=districtGround(layout,field,field.halfWidth,field.halfDepth);
    if (layout.theme==='island'&&(!ground.dry||ground.grade>2.7
      ||layout.beachResort&&distance(field,layout.beachResort)<31
      ||Object.values(layout.berths).some(berth=>distance(field,berth)<22))) continue;
    field.y=layout.theme==='island'?ground.y+.14:Math.max(base.y,ground.y);
    for (const side of [-1,1]) {
      const hangar={...regionalPoint(field,side*17.1,3.1),yaw:field.yaw,halfWidth:5.4,halfDepth:4.3,airportDistrict:true};
      const apron=districtGround(layout,hangar,hangar.halfWidth,hangar.halfDepth);
      if (!apron.dry||layout.beachResort&&distance(hangar,layout.beachResort)<23
        ||Object.values(layout.berths).some(berth=>distance(hangar,berth)<15)) continue;
      const score=ground.grade+apron.grade*.8+(layout.theme==='island'?(48-Math.hypot(field.x,field.z))*.065:Math.abs(hangar.z)*.009);
      candidates.push({field,hangar:{...hangar,y:apron.y},score});
    }
  }
  const choice=candidates.sort((a,b)=>a.score-b.score)[0];
  return choice??{field:bases[0]?.y?{...bases[0],halfWidth:10.9,halfDepth:6.9,airportDistrict:true}:null,hangar:null};
}

function lunarResortDistrict(layout) {
  const candidates=[];
  const airSites=[layout.airfield,layout.hangar].filter(Boolean);
  const w=10.15+(layout.seed%7)*.37,d=6.55+((layout.seed>>>5)%7)*.29;
  for (let i=0;i<42;i++) {
    const angle=layout.phase+(i*.381966%1)*Math.PI*2;
    for (const reach of [58,51,44,38]) {
      const site={...polar(angle,reach),yaw:0,halfWidth:8.6,halfDepth:6.45,spaceResort:true};
      if (airSites.some(other=>distance(site,other)<27)) continue;
      const ground=districtGround(layout,site,site.halfWidth,site.halfDepth);
      if (!ground.dry||ground.grade>2.6) continue;
      const basin=Math.min(...layout.basins.map(crater=>distance(site,crater)-Math.max(crater.w,crater.d)));
      // East of the hotel, with enough southerly offset to stay in the foreground of the fixed map view.
      const lake={x:site.x+5.7+Math.sin(angle*2.31)*1.35,z:site.z+site.halfDepth+d*1.12+1.8};
      const edge=Math.max(Math.abs(lake.x),Math.abs(lake.z));
      const airPenalty=airSites.reduce((sum,other)=>sum+Math.max(0,26-distance(lake,other))*2,0);
      candidates.push({site:{...site,y:ground.y},lake:{...lake,w,d},
        score:ground.grade*2+Math.abs(basin-7)*.055+Math.abs(reach-48)*.088+Math.max(0,edge-64)*.43+airPenalty+i*.01});
    }
  }
  const choice=candidates.sort((a,b)=>a.score-b.score)[0];
  if (!choice) return null;
  const {site,lake}=choice;
  const y=Math.min(regionSurface(layout,lake.x,lake.z).y,site.y-.64);
  return {site,lake:{...lake,y:Math.max(-.42,y-.29),yaw:site.yaw,halfWidth:w*1.04,halfDepth:d*1.08}};
}

function woodCoasterDistrict(layout) {
  const {halfWidth,halfDepth}=WOOD_COASTER_PLOT;
  const reserved=[...layout.regionalSites,...Object.values(layout.berths)];
  const conflicts=(site,other)=>{
    const clearance=other.beach?28:other.airportDistrict?29:other.span?21:other.waterfront?18:24;
    return distance(site,other)<clearance;
  };
  const candidates=[];
  for (let i=0;i<64;i++) {
    const angle=layout.phase+i*2.399963;
    const yaw=Math.round((angle+Math.PI)/(Math.PI/2))*Math.PI/2;
    for (const reach of [33,42,50,57]) {
      const point=polar(angle,reach);
      const site={...point,yaw,halfWidth,halfDepth,coasterPark:true};
      if (reserved.some(neighbor=>conflicts(site,neighbor))) continue;
      const ground=districtGround(layout,site,halfWidth,halfDepth);
      if (!ground.dry||ground.grade>2.1) continue;
      const entry=regionalPoint(site,0,halfDepth+2.5);
      const front=regionSurface(layout,entry.x,entry.z);
      if (front.water||front.volcanic!==undefined||Math.abs(front.y-ground.y)>1.65) continue;
      const score=ground.grade*3+Math.abs(reach-37)*.23+i*.015;
      candidates.push({site:{...site,y:ground.y},score});
    }
  }
  return candidates.reduce((best,entry)=>!best||entry.score<best.score?entry:best,null)?.site;
}

export function regionalAnnex(layout,kind) {
  if (kind==='lighthouse'||kind==='stoneLighthouse') return layout.berths[kind];
  if (kind==='hangar') return layout.hangar;
  if (kind==='megaResort') return layout.beachResort;
  if (kind==='lunarResort') return layout.spaceResort;
  if (kind==='woodCoaster') return layout.woodCoaster;
  if (kind==='shoreWalk') return layout.shoreWalkSite;
  if (kind==='riverWalk') {
    const bridge=layout.berths.bridge,side=Math.sign(layout.origin.x-riverAt(layout,layout.origin.z))||1;
    return {x:bridge.x+side*(riverWidth(layout,bridge.z)+2.65),z:bridge.z,y:.35,yaw:0,waterfront:true};
  }
  if (kind==='shuttlePort'||kind==='airport') return layout.airfield;
  return null;
}

export function regionLayout(theme,seed,grand=false,capacity=grand?GRAND_REGION_PLACES:REGION_PLACES) {
  const key=theme+':'+seed+':'+grand+':'+capacity;
  if (layouts.has(key)) return layouts.get(key);
  const rng=randomGenerator(seed);
  const layout={theme,seed,grand,phase:rng()*Math.PI*2,radiusX:63+rng()*5,radiusZ:55+rng()*5,...landscapeFeatures(theme,rng)};
  if (grand && theme==='city') {
    layout.basins=layout.basins.map(pond=>({...pond,w:pond.w*1.23,d:pond.d*1.26}));
  }
  if (grand && theme==='island') {
    layout.radiusX+=6;
    layout.radiusZ+=11;
    if (capacity>=50) { layout.radiusX+=4;layout.radiusZ+=4.5; }
    layout.basins=layout.basins.map(pond=>({...pond,w:pond.w*1.24,d:pond.d*1.24}));
  }
  const side=rng()<.5?1:-1;
  const quayZ=22+rng()*8;
  const bridgeZ=(rng()<.5?1:-1)*(5+rng()*8);
  if (grand&&theme==='city') layout.riverLagoon={bridge:bridgeZ,lagoon:Math.sign(bridgeZ)*(32+seed%7)};
  const berths=theme==='city'?{
    pier:cityBerth(layout,-30-rng()*7,side),
    quay:cityBerth(layout,quayZ,-side),
    bridge:{x:riverAt(layout,bridgeZ),z:bridgeZ,y:.34,yaw:0,span:2*riverWidth(layout,bridgeZ)+5.8,waterfront:true},
  }:theme==='island'?{
    pier:coastSite(layout,layout.phase),
    marina:coastSite(layout,layout.phase+2.05+rng()*.48),
  }:{};
  layout.berths=berths;
  if (theme==='island'&&capacity>=50) {
    const peaks=[46+seed%8,40].flatMap(reach=>[-2.6,-3.05,2.66,-1.84,1.88].map(angle=>
      ({...polar(angle,reach),yaw:0,halfWidth:9.7,halfDepth:9.2})));
    const suitablePeaks=peaks.filter(site=>coastAt(layout,site.x,site.z)>11&&Object.values(berths).every(berth=>distance(site,berth)>23));
    const pickPeak=randomGenerator(seed^0x7521ac95);
    layout.volcano=suitablePeaks[Math.floor(pickPeak()*suitablePeaks.length)];
  }

  const startZ=(rng()-.5)*12;
  const start={z:startZ,x:theme==='city'?riverAt(layout,startZ)+side*(17+rng()*2): (rng()-.5)*14};
  const candidates=Array.from({length:1700},()=>({x:(rng()-.5)*(grand?140:126),z:(rng()-.5)*(grand?132:106),weight:rng()*18}));
  candidates.sort((a,b)=>distance(a,start)+a.weight-distance(b,start)-b.weight);
  const suitable=candidates.filter(point=>{
    if (Object.values(berths).some(berth=>distance(berth,point)<(berth.span??12))) return false;
    const samples=[[0,0],[5.5,0],[-5.5,0],[0,5.5],[0,-5.5],[4,4],[-4,4],[4,-4],[-4,-4]]
      .map(([x,z])=>regionSurface(layout,point.x+x,point.z+z));
    const heights=samples.map(sample=>sample.y);
    point.y=Math.max(...heights)+.06;
    return samples.every(sample=>!sample.water&&sample.bank>.55&&!(theme==='moon'&&sample.basin<.7))
      && Math.max(...heights)-Math.min(...heights)<1.3;
  });
  const sites=[];
  for (const spacing of [14.4,13,11.8]) {
    for (const point of suitable) {
      if (sites.length===capacity) break;
      if (sites.every(site=>distance(site,point)>=spacing)) sites.push(point);
    }
    if (sites.length===capacity) break;
  }
  layout.sites=sites;
  layout.origin=sites[0];
  const lighthouse=site=>({...site,halfWidth:3.53,halfDepth:3.38,lighthouse:true});
  if (grand&&theme==='city') {
    berths.lighthouse=lighthouse(cityBerth(layout,bridgeZ>0?-56:54,-side));
    const banks=[-48,48,-57,57,35,-35,63,-63].flatMap(z=>[side,-side].map(bank=>cityBerth(layout,z,bank)));
    const stone=banks.find(site=>Object.values(berths).every(berth=>distance(berth,site)>15));
    if (stone) berths.stoneLighthouse=lighthouse(stone);
  }
  if (grand&&theme==='island') {
    berths.lighthouse=lighthouse(coastSite(layout,layout.phase+4.14));
    const coast=Array.from({length:24},(_,i)=>coastSite(layout,layout.phase+i*Math.PI/12))
      .filter(site=>Object.values(berths).every(berth=>distance(berth,site)>18))
      .sort((a,b)=>a.z-b.z)[0];
    if (coast) berths.stoneLighthouse=lighthouse(coast);
    layout.beachResort=beachDistrict(layout);
  }
  if (grand) {
    const {field,hangar}=airDistrict(layout);
    layout.airfield=field;
    layout.hangar=hangar;
    if (theme==='moon') {
      const resort=lunarResortDistrict(layout);
      if (resort) {
        layout.spaceResort=resort.site;
        layout.moonLake=resort.lake;
      }
    }
  }
  layout.regionalSites=[layout.airfield,layout.hangar,layout.beachResort,layout.spaceResort,layout.moonLake,layout.volcano,
    berths.lighthouse,berths.stoneLighthouse].filter(Boolean);
  if (grand&&theme!=='moon') {
    layout.woodCoaster=woodCoasterDistrict(layout);
    if (layout.woodCoaster) layout.regionalSites.push(layout.woodCoaster);
  }
  if (grand&&theme==='island') {
    const coastWalk=islandPromenade(layout);
    const resort=layout.beachResort;
    const target=resort?regionalPoint(resort,0,-resort.halfDepth-2.9):islandCoastPoint(layout,layout.phase,5.8);
    const middle=coastWalk.flat().reduce((best,point)=>distance(point,target)<distance(best,target)?point:best,coastWalk[0]?.[0]??target);
    layout.shoreWalkSite={x:middle.x,z:middle.z,y:regionSurface(layout,middle.x,middle.z).y,yaw:0,waterfront:true};
    layout.shoreWalk=coastWalk;
    const segments=coastWalk.flatMap(path=>path.slice(1).map((point,i)=>[path[i],point]));
    layout.shoreWalkNear=transportCorridor(segments,SHORE_WALK_LOT_GAP+.4);
  }
  const grid=Array.from({length:GRID*GRID},(_,i)=>{
    const x=i%GRID*STEP-EDGE,z=Math.floor(i/GRID)*STEP-EDGE;
    const sample=regionSurface(layout,x,z);
    return {x,z,...sample,blocked:sites.some(site=>distance(site,{x,z})<5.7)
      ||layout.regionalSites.some(site=>regionalFootprint(site,x,z,.8))};
  });
  layout.grid=grid;
  layouts.set(key,layout);
  if (layouts.size>6) layouts.delete(layouts.keys().next().value);
  return layout;
}

function closestCell(layout,point) {
  const col=Math.round((point.x+EDGE)/STEP),row=Math.round((point.z+EDGE)/STEP);
  let best=-1,span=Infinity;
  for (let y=Math.max(0,row-4);y<=Math.min(GRID-1,row+4);y++) {
    for (let x=Math.max(0,col-4);x<=Math.min(GRID-1,col+4);x++) {
      const index=y*GRID+x,cell=layout.grid[index];
      if (cell.blocked||cell.water) continue;
      const gap=distance(cell,point);
      if (gap<span) { best=index; span=gap; }
    }
  }
  return best;
}

function riverCrossing(layout,point,stayOnBank) {
  return layout.theme==='city'&&!stayOnBank&&Math.abs(point.z-layout.berths.bridge.z)>6.4
    &&Math.abs(point.x-riverAt(layout,point.z))<riverWidth(layout,point.z)+.16;
}

function routeCells(layout,start,end,stayOnBank=false) {
  const first=closestCell(layout,start), last=closestCell(layout,end);
  if (first<0||last<0) return [];
  const {grid}=layout;
  const cost=new Float64Array(grid.length).fill(Infinity);
  const previous=new Int32Array(grid.length).fill(-1);
  const queue=[{index:first,score:0}];
  const settled=new Set();
  cost[first]=0;
  while (queue.length) {
    let best=0;
    for (let i=1;i<queue.length;i++) if (queue[i].score<queue[best].score) best=i;
    const [{index}]=queue.splice(best,1);
    if (settled.has(index)) continue;
    if (index===last) {
      const path=[];
      for (let at=last;at!==-1;at=previous[at]) path.push(grid[at]);
      return path.reverse();
    }
    settled.add(index);
    const x=index%GRID,z=Math.floor(index/GRID);
    for (const [dx,dz] of NEIGHBORS) {
      if (x+dx<0||x+dx>=GRID||z+dz<0||z+dz>=GRID) continue;
      const next=(z+dz)*GRID+x+dx, cell=grid[next];
      if (settled.has(next)||cell.blocked) continue;
      const bridge=riverCrossing(layout,cell,stayOnBank);
      if (cell.water&&!bridge) continue;
      if (dx&&dz) {
        const sides=[grid[z*GRID+x+dx],grid[(z+dz)*GRID+x]];
        if (sides.some(side=>side.blocked||side.water&&!riverCrossing(layout,side,stayOnBank))) continue;
      }
      const weight=bridge ? 2.3+Math.abs(dz)*.75 : 1+Math.abs(cell.y-grid[index].y)*1.4+Math.max(0,.7-cell.basin)*.47;
      const step=cost[index]+Math.hypot(dx,dz)*weight;
      if (step>=cost[next]) continue;
      cost[next]=step; previous[next]=index;
      queue.push({index:next,score:step+distance(cell,grid[last])/STEP});
    }
  }
  return [];
}

function curvePath(points) {
  const unique=points.filter((point,i)=>!i||distance(point,points[i-1])>.16);
  return unique.flatMap((point,i)=>{
    if (!i||i===unique.length-1) return [point];
    const a=unique[i-1],b=unique[i+1];
    const corner=(p,t)=>({x:mix(point.x,p.x,t),z:mix(point.z,p.z,t)});
    return [corner(a,.23),{x:(a.x+b.x+6*point.x)/8,z:(a.z+b.z+6*point.z)/8},corner(b,.23)];
  });
}

function ordinaryEntrance(site,target) {
  const yaw=Math.round(Math.atan2(target.x-site.x,target.z-site.z)/(Math.PI/4))*(Math.PI/4);
  const offset=polar(yaw,6.35);
  return {yaw,entry:{x:site.x+offset.x,z:site.z+offset.z}};
}

export function specialEntrances(site,kind) {
  if (site.airportDistrict) return [regionalPoint(site,0,site.airfield?8.9:6.05)];
  if (site.coasterPark) return [regionalPoint(site,0,site.halfDepth+2.5)];
  if (site.beach) return [regionalPoint(site,0,-8.1)];
  if (site.spaceResort) return [regionalPoint(site,-5.4,8.25)];
  if (kind==='bridge') return [-1,1].map(side=>({x:site.x+side*site.span*.5,y:site.y+.514,z:site.z}));
  const land=polar(site.yaw+Math.PI,site.lighthouse?5.4:3.4);
  return [{x:site.x+land.x,z:site.z+land.z}];
}

function clearConnector(layout,a,b,bankOnly) {
  const span=distance(a,b);
  const samples=Math.max(1,Math.ceil(span/.9));
  const dx=(b.x-a.x)/(span||1),dz=(b.z-a.z)/(span||1);
  for (let i=1;i<samples;i++) {
    const t=i/samples;
    const x=mix(a.x,b.x,t),z=mix(a.z,b.z,t);
    const tile=regionSurface(layout,x,z);
    if (tile.water&&(!riverCrossing(layout,{x,z},bankOnly)||Math.abs(dx)<.46)) return false;
    for (const offset of [-.66,0,.66]) {
      const sideX=x-dz*offset,sideZ=z+dx*offset;
      if (layout.blockedRoad) {
        if (layout.blockedRoad(sideX,sideZ)) return false;
      } else {
        const col=Math.round((sideX+EDGE)/STEP),row=Math.round((sideZ+EDGE)/STEP);
        if (col>=0&&col<GRID&&row>=0&&row<GRID&&layout.grid[row*GRID+col].blocked) return false;
      }
    }
  }
  return true;
}

function roundedConnector(points) {
  const path=[];
  const add=point=>{
    const from=path.at(-1);
    if (!from) { path.push(point); return; }
    const divisions=Math.ceil(distance(from,point)/1.6);
    for (let i=1;i<=divisions;i++) {
      const t=i/divisions;
      path.push(i===divisions?point:{x:mix(from.x,point.x,t),z:mix(from.z,point.z,t)});
    }
  };
  points.forEach((point,i)=>{
    if (!i||i===points.length-1) { add(point); return; }
    const before=points[i-1],after=points[i+1];
    const spanA=distance(before,point),spanB=distance(point,after);
    const trim=Math.min(3.25,spanA*.31,spanB*.31);
    const left={x:mix(point.x,before.x,trim/spanA),z:mix(point.z,before.z,trim/spanA)};
    const right={x:mix(point.x,after.x,trim/spanB),z:mix(point.z,after.z,trim/spanB)};
    add(left);
    for (let j=1;j<=5;j++) {
      const t=j/5,u=1-t;
      add({x:u*u*left.x+2*u*t*point.x+t*t*right.x,z:u*u*left.z+2*u*t*point.z+t*t*right.z});
    }
  });
  return path;
}

export function connectWaterfront(layout,start,end,bankOnly=false) {
  if (clearConnector(layout,start,end,bankOnly)) return roundedConnector([start,end]);
  const cells=routeCells(layout,start,end,bankOnly);
  if (!cells.length) return null;
  const points=[start,...cells,end].filter((point,i,all)=>!i||distance(point,all[i-1])>.06);
  const bends=[points[0]];
  for (let i=0;i<points.length-1;) {
    let next=points.length-1;
    while (next>i+1&&!clearConnector(layout,points[i],points[next],bankOnly)) next--;
    bends.push(points[next]);
    i=next;
  }
  return roundedConnector(bends);
}

export function planRegion(layout,buildings) {
  const {origin,berths}=layout;
  const sites=layout.sites.filter(({x,z})=>!layout.regionalSites.some(site=>regionalFootprint(site,x,z,5.4))
    &&!(layout.shoreWalkNear?.(x,z)?.gap<SHORE_WALK_LOT_GAP));
  const root={x:origin.x,z:origin.z+7.4};
  const network=[root];
  const paths=[];
  const plots=[];
  let latestStart=0;
  let land=0;
  const closest=(points,place)=>points.reduce((near,point)=>distance(point,place)<distance(near,place)?point:near,points[0]);
  for (const {index,kind} of buildings) {
    const special=regionalAnnex(layout,kind)??berths[kind];
    const site=special??sites[land++];
    if (!site) continue;
    if (kind==='shoreWalk'||kind==='riverWalk') { plots.push({...site,index,kind,entries:[]}); continue; }
    const target=closest(network,site);
    const entrance=special?{yaw:site.yaw}:ordinaryEntrance(site,target);
    const entries=special?specialEntrances(site,kind):[entrance.entry];
    const routes=entries.map(entry=>{
      if (kind!=='bridge') {
        if (!special) return curvePath([target,...routeCells(layout,target,entry),entry]);
        const peer=special.airportDistrict&&plots.find(plot=>plot.airportDistrict)?.entries[0];
        const start=peer??closest(network,entry);
        return connectWaterfront(layout,start,entry)??curvePath([start,entry]);
      }
      const side=Math.sign(entry.x-site.x);
      const onBank=network.filter(point=>(point.x-riverAt(layout,point.z))*side>riverWidth(layout,point.z)+.6);
      const stub={x:entry.x+side*5.8,z:entry.z};
      const origin=onBank.length?closest(onBank,entry):stub;
      return curvePath([origin,...routeCells(layout,origin,entry,true),entry]);
    });
    latestStart=paths.length;
    for (const path of routes) {
      paths.push(path);
      network.push(...path.filter((_,i)=>i%4===0),path.at(-1));
    }
    plots.push({...site,...entrance,entries,kind,index});
  }
  return {plots,paths,origin,latestPaths:new Map(paths.slice(latestStart).map(path=>[path,false]))};
}

export function regionVisibility(plan,x,z,full=false) {
  const developed=full?clamp((EDGE+14-Math.hypot(x,z))/15,0,1):0;
  const distanceTo=(point)=>Math.hypot(point.x-x,point.z-z);
  let reach=Math.max(0,1-(distanceTo(plan.origin)-29)/23);
  for (const plot of plan.plots) reach=Math.max(reach,1-(distanceTo(plot)-(plot.beach||plot.spaceResort?32:plot.airfield?26:22))/23);
  for (const path of plan.paths) {
    for (let i=1;i<path.length;i+=4) reach=Math.max(reach,1-(distanceTo(path[i])-7.4)/20);
  }
  if (plan.transit) {
    for (let i=0;i<plan.transit.length;i+=5) {
      reach=Math.max(reach,1-(distanceTo(plan.transit[i])-3.7)/12);
    }
  }
  if (plan.shoreWalkNear) reach=Math.max(reach,1-(plan.shoreWalkNear(x,z)?.gap??15)/15);
  for (const portal of plan.transitPortals??[]) reach=Math.max(reach,1-(distanceTo(portal)-7)/9);
  reach=clamp(reach,0,1);
  return Math.max(developed,.8*reach*reach*(3-2*reach)+.2*reach);
}

export function roadElevation(layout,x,z) {
  const surface=regionSurface(layout,x,z);
  if (layout.theme==='moon') {
    const rim=[[-1.35,0],[1.35,0],[0,-1.35],[0,1.35],[-.96,-.96],[.96,-.96],[-.96,.96],[.96,.96]];
    return Math.max(surface.y,...rim.map(([a,b])=>regionSurface(layout,x+a,z+b).y))+.19;
  }
  return Math.max(layout.theme==='city'&&surface.bank<1.1?.47:.13,surface.y+.108);
}

export function transportCorridor(segments,reach) {
  const cell=6,grid=new Map();
  const bucket=(x,z)=>Math.floor(x/cell)*4096+Math.floor(z/cell);
  for (const [a,b] of segments) {
    const dx=b.x-a.x,dz=b.z-a.z,span=dx*dx+dz*dz;
    if (span<.000001) continue;
    const segment={a,b,dx,dz,span};
    for (let x=Math.floor((Math.min(a.x,b.x)-reach)/cell);x<=Math.floor((Math.max(a.x,b.x)+reach)/cell);x++) {
      for (let z=Math.floor((Math.min(a.z,b.z)-reach)/cell);z<=Math.floor((Math.max(a.z,b.z)+reach)/cell);z++) {
        const key=x*4096+z;
        if (!grid.has(key)) grid.set(key,[]);
        grid.get(key).push(segment);
      }
    }
  }
  return (x,z)=>{
    let distance=reach*reach,nearest;
    for (const {a,b,dx,dz,span} of grid.get(bucket(x,z))??[]) {
      const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/span,0,1);
      const gap=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;
      if (gap>=distance) continue;
      distance=gap;
      nearest={y:mix(a.y,b.y,t),blend:mix(a.blend,b.blend,t)};
    }
    return nearest&&{...nearest,gap:Math.sqrt(distance)};
  };
}

export function residenceDrive(layout,plot,street=(x,z)=>roadElevation(layout,x,z)) {
  const {entries:[entry],halfDepth,yaw}=plot;
  const c=Math.cos(yaw),s=Math.sin(yaw);
  const front=(entry.x-plot.x)*s+(entry.z-plot.z)*c;
  const curb=front-(layout.theme==='island'?1.02:1.22);
  const deck=plot.y+RESIDENCE_PLOT.deck;
  const elevation=(x,z)=>{
    const dx=x-plot.x,dz=z-plot.z;
    const localX=dx*c-dz*s,localZ=dx*s+dz*c;
    if (Math.abs(localX)>plot.halfWidth+.04||localZ>=curb+.08) return street(x,z);
    if (localZ<=halfDepth-.24) return deck;
    const t=clamp((localZ-halfDepth+.24)/(curb-halfDepth+.32),0,1);
    return mix(deck,street(x,z),t*t*(3-2*t));
  };
  const path=Array.from({length:7},(_,i)=>{
    const at=regionalPoint(plot,0,mix(halfDepth-.25,curb+.15,i/6));
    return {...at,y:elevation(at.x,at.z)-.014};
  });
  return {front,elevation,path};
}
