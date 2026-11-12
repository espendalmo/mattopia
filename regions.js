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

export function riverAt(layout,z) {
  return 6.8*Math.sin(z*.046+layout.phase)+2.45*Math.sin(z*.101-layout.phase);
}

export function riverWidth(layout,z) {
  return (layout.grand?5.2:3.85)+1.1*Math.sin(z*.071+layout.phase)+.45*Math.cos(z*.23);
}

function coastAt(layout,x,z) {
  const dx=x/layout.radiusX,dz=z/layout.radiusZ;
  const angle=Math.atan2(dz,dx);
  const rim=1+.091*Math.sin(angle*3+layout.phase)+.063*Math.cos(angle*5-layout.phase)+.044*Math.sin(angle*7);
  return (rim-Math.hypot(dx,dz))*52;
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
  if (theme==='moon') return {y,water:false,bank:Infinity,basin,detail,relief};
  const outerBank=theme==='city' ? Math.abs(x-riverAt(layout,z))-riverWidth(layout,z) : coastAt(layout,x,z);
  const bank=Math.min(outerBank,basin);
  const pond=basin<outerBank;
  const water=bank<0;
  return {y:water?.015:mix(.06,y,clamp(bank/3.25,0,1)),water,bank,basin,detail,relief,pond};
}

function coastSite(layout,angle) {
  let near=0,far=layout.grand?95:85;
  for (let i=0;i<15;i++) {
    const point=polar(angle,(near+far)/2);
    if (coastAt(layout,point.x,point.z)>0) near=(near+far)/2;
    else far=(near+far)/2;
  }
  const point=polar(angle,near-1.45);
  const {x,z}=point;
  return {...point,y:Math.max(.65,regionSurface(layout,x,z).y+.28),yaw:angle,waterfront:true};
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
  return {y:high+.09,grade:high-low,dry:samples.every(p=>!p.water&&p.bank>.35&&p.basin>-.6)};
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
      const shores=[-12,-6,0,6,12].map(x=>resortShore(layout,site,x));
      if (shores.some(z=>z===null||z<8.1)) continue;
      const span=Math.max(...shores)-Math.min(...shores);
      candidates.push({...site,y:ground.y,score:ground.grade*2.3+span*.24+setback*.07+i*.018});
    }
  }
  return candidates.sort((a,b)=>a.score-b.score)[0]??null;
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
  for (let i=0;i<42;i++) {
    const angle=layout.phase+(i*.381966%1)*Math.PI*2;
    const yaw=Math.round((angle+Math.PI)/(Math.PI/2))*(Math.PI/2);
    for (const reach of [58,51,44,38]) {
      const site={...polar(angle,reach),yaw,halfWidth:8.6,halfDepth:6.45,spaceResort:true};
      if ([layout.airfield,layout.hangar].some(other=>other&&distance(site,other)<27)) continue;
      const ground=districtGround(layout,site,site.halfWidth,site.halfDepth);
      if (!ground.dry||ground.grade>2.6) continue;
      const basin=Math.min(...layout.basins.map(crater=>distance(site,crater)-Math.max(crater.w,crater.d)));
      candidates.push({...site,y:ground.y,score:ground.grade*2+Math.abs(basin-7)*.055+Math.abs(reach-53)*.054+i*.01});
    }
  }
  return candidates.sort((a,b)=>a.score-b.score)[0]??null;
}

export function regionalAnnex(layout,kind) {
  if (kind==='lighthouse') return layout.berths.lighthouse;
  if (kind==='hangar') return layout.hangar;
  if (kind==='megaResort') return layout.beachResort;
  if (kind==='lunarResort') return layout.spaceResort;
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
    layout.basins=layout.basins.map(pond=>({...pond,w:pond.w*1.24,d:pond.d*1.24}));
  }
  const side=rng()<.5?1:-1;
  const quayZ=22+rng()*8;
  const bridgeZ=(rng()<.5?1:-1)*(5+rng()*8);
  const berths=theme==='city'?{
    pier:cityBerth(layout,-30-rng()*7,side),
    quay:cityBerth(layout,quayZ,-side),
    bridge:{x:riverAt(layout,bridgeZ),z:bridgeZ,y:.34,yaw:0,span:2*riverWidth(layout,bridgeZ)+5.8,waterfront:true},
  }:theme==='island'?{
    pier:coastSite(layout,layout.phase),
    marina:coastSite(layout,layout.phase+2.05+rng()*.48),
  }:{};
  layout.berths=berths;

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
  if (grand&&theme==='city') berths.lighthouse=cityBerth(layout,bridgeZ>0?-56:54,-side);
  if (grand&&theme==='island') {
    berths.lighthouse=coastSite(layout,layout.phase+4.14);
    layout.beachResort=beachDistrict(layout);
  }
  if (grand) {
    const {field,hangar}=airDistrict(layout);
    layout.airfield=field;
    layout.hangar=hangar;
    if (theme==='moon') layout.spaceResort=lunarResortDistrict(layout);
  }
  layout.regionalSites=[layout.airfield,layout.hangar,layout.beachResort,layout.spaceResort].filter(Boolean);
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
  if (site.beach) return [regionalPoint(site,0,-8.1)];
  if (site.spaceResort) return [regionalPoint(site,0,8.25)];
  if (kind==='bridge') return [-1,1].map(side=>({x:site.x+side*site.span*.5,y:site.y+.514,z:site.z}));
  const land=polar(site.yaw+Math.PI,kind==='lighthouse'?5.2:3.4);
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
  const sites=layout.sites.filter(({x,z})=>!layout.regionalSites.some(site=>regionalFootprint(site,x,z,5.4)));
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
  for (const plot of plan.plots) reach=Math.max(reach,1-(distanceTo(plot)-(plot.beach?32:plot.airfield?26:22))/23);
  for (const path of plan.paths) {
    for (let i=1;i<path.length;i+=4) reach=Math.max(reach,1-(distanceTo(path[i])-7.4)/20);
  }
  if (plan.transit) {
    for (let i=0;i<plan.transit.length;i+=5) {
      reach=Math.max(reach,1-(distanceTo(plan.transit[i])-3.7)/12);
    }
  }
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
