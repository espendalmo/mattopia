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

export function regionLayout(theme,seed,grand=false) {
  const key=theme+':'+seed+':'+grand;
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
  const capacity=grand?GRAND_REGION_PLACES:REGION_PLACES;
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
  const grid=Array.from({length:GRID*GRID},(_,i)=>{
    const x=i%GRID*STEP-EDGE,z=Math.floor(i/GRID)*STEP-EDGE;
    const sample=regionSurface(layout,x,z);
    return {x,z,...sample,blocked:sites.some(site=>distance(site,{x,z})<5.7)};
  });
  layout.grid=grid;
  if (grand&&theme==='city') berths.lighthouse=cityBerth(layout,bridgeZ>0?-56:54,-side);
  if (grand&&theme==='island') berths.lighthouse=coastSite(layout,layout.phase+4.14);
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

function routeCells(layout,start,end,stayOnBank=false,orthogonal=false) {
  const first=closestCell(layout,start), last=closestCell(layout,end);
  if (first<0||last<0) return [];
  const {grid,theme}=layout;
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
    for (const [dx,dz] of orthogonal?NEIGHBORS.slice(0,4):NEIGHBORS) {
      if (x+dx<0||x+dx>=GRID||z+dz<0||z+dz>=GRID) continue;
      const next=(z+dz)*GRID+x+dx, cell=grid[next];
      if (settled.has(next)||cell.blocked) continue;
      const bridge=theme==='city'&&!stayOnBank&&Math.abs(cell.z-layout.berths.bridge.z)>6.4
        &&Math.abs(cell.x-riverAt(layout,cell.z))<riverWidth(layout,cell.z)+.1;
      if (cell.water&&!bridge) continue;
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
  if (kind==='bridge') return [-1,1].map(side=>({x:site.x+side*site.span*.5,y:site.y+.514,z:site.z}));
  const land=polar(site.yaw+Math.PI,kind==='lighthouse'?5.2:3.4);
  return [{x:site.x+land.x,z:site.z+land.z}];
}

export function connectWaterfront(layout,start,end,bankOnly) {
  return curvePath([start,...routeCells(layout,start,end,bankOnly,true),end]);
}

export function planRegion(layout,buildings) {
  const {origin,sites,berths}=layout;
  const root={x:origin.x,z:origin.z+7.4};
  const network=[root];
  const paths=[];
  const plots=[];
  let latestStart=0;
  let land=0;
  const closest=(points,place)=>points.reduce((near,point)=>distance(point,place)<distance(near,place)?point:near,points[0]);
  for (const {index,kind} of buildings) {
    const lighthouse=kind==='lighthouse'&&berths.lighthouse;
    const special=lighthouse?null:berths[kind];
    const site=special??sites[land++];
    if (!site) continue;
    const target=closest(network,site);
    const entrance=special?{yaw:site.yaw}:ordinaryEntrance(site,target);
    const entries=special?specialEntrances(site,kind):[entrance.entry];
    const routes=entries.map(entry=>{
      if (kind!=='bridge') return curvePath([target,...routeCells(layout,target,entry),entry]);
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
    if (lighthouse) {
      const shore=specialEntrances(lighthouse,kind);
      const start=closest(network,shore[0]);
      paths.push(connectWaterfront(layout,start,shore[0],false));
      plots.push({...lighthouse,entries:shore,kind,index});
    } else plots.push({...site,...entrance,entries,kind,index});
  }
  return {plots,paths,origin,latestPaths:new Map(paths.slice(latestStart).map(path=>[path,false]))};
}

export function regionVisibility(plan,x,z,full=false) {
  if (full) return clamp((EDGE-Math.max(Math.abs(x),Math.abs(z)))/10,0,1);
  const distanceTo=(point)=>Math.hypot(point.x-x,point.z-z);
  let reach=Math.max(0,1-(distanceTo(plan.origin)-13)/15);
  for (const plot of plan.plots) reach=Math.max(reach,1-(distanceTo(plot)-12)/17);
  for (const path of plan.paths) {
    for (let i=1;i<path.length;i+=4) reach=Math.max(reach,1-(distanceTo(path[i])-4.8)/13);
  }
  if (plan.transit) {
    for (let i=0;i<plan.transit.length;i+=5) {
      reach=Math.max(reach,1-(distanceTo(plan.transit[i])-3.1)/9);
    }
  }
  for (const portal of plan.transitPortals??[]) reach=Math.max(reach,1-(distanceTo(portal)-7)/9);
  reach=clamp(reach,0,1);
  return reach*reach*(3-2*reach);
}

export function roadElevation(layout,x,z) {
  const surface=regionSurface(layout,x,z);
  return Math.max(layout.theme==='city'&&surface.bank<1.1?.47:.13,surface.y+.108);
}
