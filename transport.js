import {box,rounded,dome,tube,roof,beam,placeParts,pointOnSite,tunnelLandform,visitor} from './scenery.js';
import {regionSurface,riverAt} from './regions.js';
import {roadProjections} from './street-network.js';

const cream='#f4e5c6', dark='#455366', glass='#74aab9', steel='#a7b6bb';
const sides=[-1,1];
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{ const t=clamp(value); return t*t*(3-2*t); };
const railZ=-2.45;
const deckHeight=moon=>moon?3.38:2.95;
const pose=(x,y,z,yaw,sound=false,pitch=0)=>({
  x,y,z,cos:Math.cos(yaw),sin:Math.sin(yaw),stride:0,rollCos:1,rollSin:0,pitch,sound:Number(sound),
});

function trainModel(moon,carriage=false) {
  const paint=moon?'#70b9c1':'#b96761', stripe=moon?'#f0b979':'#efd2a2';
  const end=carriage?1.31:1.49;
  const drive=moon
    ? [rounded(0,0,.56,2.43,.29,'#638791',-.09)]
    : sides.flatMap(side=>[-.83,.83].map(z=>tube(side*.52,z,.12,.37,.37,dark,.02,'x')));
  return [
    ...drive,rounded(0,0,1.21,end*2,1.07,paint,.18),
    rounded(0,-.06,1.14,end*1.79,.24,moon?'#d3d9e6':'#a4ac9e',1.15),
    ...sides.flatMap(side=>[
      box(side*.602,0,.036,2.54,.14,stripe,.43),
      ...[-.92,-.32,.28,.88].map(z=>rounded(side*.607,z,.054,.43,.32,glass,.75)),
      rounded(side*.39,end,.16,.05,.145,cream,.48),
    ]),
    rounded(0,end-.043,.88,.16,.36,'#4d788c',.73),
    ...(moon||carriage?[]:[tube(0,.7,.17,.19,.29,dark,1.31),rounded(0,1.29,1.24,.52,.29,'#b0a18e',.08)]),
  ];
}

export function transitStation(moon) {
  const level=deckHeight(moon);
  const wall=moon?'#9cabc7':'#c19079', trim=moon?'#d0b2ce':'#e9c89c';
  const canopy=moon?'#638998':'#547d77', platform='#c5c6b7';
  const stairs=Array.from({length:10},(_,i)=>box(2.83,3.77-i*.26,1.38,.54,.18+i*(level-.27)/9,trim,.3));
  const columns=[-4.34,4.34].flatMap(x=>[
    rounded(x,-1.08,1.21,1.14,level,wall,.3),box(x,-1.08,1.52,1.35,.23,trim,level-.14),
  ]);
  return [
    [{...box(0,0,10.32,9.44,1.32,wall,-1.25),support:true},
      rounded(0,0,10.55,9.67,.27,'#d2c9b2',.04)],
    [...columns, ...stairs,box(2.83,.57,1.4,1.98,.21,platform,level-.17),
      rounded(-.87,1.32,4.93,3.11,2.42,wall,.3),
      roof(-.87,1.32,5.16,3.32,.67,canopy,2.64),
      box(-.86,2.894,2.65,.08,1.46,dark,.38),
      ...sides.map(side=>box(-.86+side*.61,2.95,1.03,.055,1.1,glass,.57)),
      rounded(0,-1.11,9.88,1.54,.24,platform,level-.2),
      box(0,-1.8,9.56,.12,.047,cream,level+.043),
      ...[-3.75,0,3.75].flatMap(x=>[
        tube(x,-.8,.15,.15,1.34,steel,level+.025),
        roof(x,-1.2,3.08,1.68,.43,canopy,level+1.46),
      ]),
    ],
    [box(-.86,2.986,2.01,.075,.43,canopy,2.17),
      ...[-.51,0,.51].map(x=>rounded(x-.86,3.037,.3,.06,.15,moon?'#b3f0e6':cream,2.32)),
      ...[-3.02,-1.58,1.4].flatMap(x=>[
        box(x,-1.18,.92,.34,.09,trim,level+.24),
        box(x,-1.18,.72,.25,.21,dark,level+.04),
      ]),
      // The chooser has a short piece of track and a train. On the map the line is generated from the lot.
      ...railTrack([[-5,level,railZ],[5,level,railZ]],moon).map(part=>({...part,transitPreview:true})),
      ...placeParts(trainModel(moon),{x:1.25,y:level,z:railZ,yaw:Math.PI/2}).map(part=>({...part,transitPreview:true})),
    ],
  ];
}

function plate(outline,color) {
  const [x,y,z]=outline[0];
  return {shape:'terrain',outline,color,x,y,z,h:0};
}

function railTrack(points,moon,skip=()=>false,half=moon?.57:.94) {
  const deck=moon?'#7f8da3':'#82776e', edge=moon?'#c3c1d3':'#c5a58a';
  const sideways=(index,offset,lower=0)=>{
    const [x,y,z]=points[index];
    const before=points[Math.max(0,index-1)],after=points[Math.min(points.length-1,index+1)];
    const dx=after[0]-before[0],dz=after[2]-before[2],length=Math.hypot(dx,dz);
    return [x-dz/length*offset,y-lower,z+dx/length*offset];
  };
  const parts=[];
  for (let i=1;i<points.length;i++) {
    if (skip(i)) continue;
    const a=sideways(i-1,-half,.11),b=sideways(i-1,half,.11);
    const c=sideways(i,half,.11),d=sideways(i,-half,.11);
    parts.push(plate([a,b,c,d],deck));
    for (const side of sides) parts.push(plate([
      sideways(i-1,side*half,.11),sideways(i,side*half,.11),
      sideways(i,side*half,.46),sideways(i-1,side*half,.46),
    ],edge));
    for (const offset of moon?[0]:[-.46,.46]) {
      parts.push(beam(sideways(i-1,offset,.02),sideways(i,offset,.02),moon?.38:.082,moon?'#8ebec9':steel));
    }
    if (!moon) parts.push(beam(sideways(i,-.7,.085),sideways(i,.7,.085),.12,'#58555a'));
  }
  return parts;
}

function roadClearance(paths,x,z,clearance=2.15) {
  for (const path of paths) {
    for (let i=1;i<path.length;i++) {
      const a=path[i-1],b=path[i];
      const dx=b.x-a.x,dz=b.z-a.z;
      const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1));
      if (Math.hypot(x-a.x-dx*t,z-a.z-dz*t)<clearance) return false;
    }
  }
  return true;
}

function roundedRailPath(waypoints,turnRadius=4.9,station=false) {
  const points=waypoints.filter(([x,z],i)=>!i||Math.hypot(x-waypoints[i-1][0],z-waypoints[i-1][1])>.01);
  const softened=points.flatMap(([x,z],i)=>{
    if (!i||i===points.length-1) return [[x,z]];
    const [a,b]=points[i-1],[c,d]=points[i+1];
    const incoming=Math.hypot(x-a,z-b),outgoing=Math.hypot(c-x,d-z);
    const dx=(x-a)/incoming,dz=(z-b)/incoming;
    const ex=(c-x)/outgoing,ez=(d-z)/outgoing;
    const turn=Math.atan2(dx*ez-dz*ex,dx*ex+dz*ez);
    if (Math.abs(turn)<.018||Math.abs(turn)>Math.PI-.05) return [[x,z]];
    const tangent=Math.tan(Math.abs(turn)*.5);
    const nearStation=station&&(i===1||i===points.length-2);
    const inset=Math.min(nearStation?1.07:Infinity,turnRadius*tangent,incoming*.43,outgoing*.43);
    const radius=inset/tangent,sign=Math.sign(turn);
    const px=x-dx*inset,pz=z-dz*inset;
    const cx=px-dz*radius*sign,cz=pz+dx*radius*sign;
    const angle=Math.atan2(pz-cz,px-cx),count=Math.max(5,Math.ceil(Math.abs(turn)*radius/.5));
    return Array.from({length:count+1},(_,j)=>{
      const current=angle+turn*j/count;
      return [cx+Math.cos(current)*radius,cz+Math.sin(current)*radius];
    });
  });
  const path=[softened[0]];
  for (let i=1;i<softened.length;i++) {
    const from=path.at(-1),to=softened[i];
    const count=Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/.78);
    for (let step=1;step<=count;step++) path.push(from.map((value,axis)=>value+(to[axis]-value)*step/count));
  }
  return path;
}

function railLoop(points) {
  const distances=[0];
  for (let i=1;i<points.length;i++) {
    const [x,,z]=points[i],[a,,b]=points[i-1];
    distances.push(distances.at(-1)+Math.hypot(x-a,z-b));
  }
  const length=distances.at(-1);
  const wrap=value=>(value%length+length)%length;
  const sample=value=>{
    const distance=wrap(value);
    let low=1,end=distances.length-1;
    while (low<end) {
      const middle=(low+end)>>1;
      if (distances[middle]>distance) end=middle;
      else low=middle+1;
    }
    const t=(distance-distances[end-1])/(distances[end]-distances[end-1]);
    return points[end-1].map((v,i)=>v+(points[end][i]-v)*t);
  };
  return {distances,length,wrap,sample};
}

function footprint(parts) {
  const points=parts.flatMap(part=>{
    if (part.outline) return part.outline;
    if (part.from) return [part.from,part.to].flatMap(([x,y,z])=>
      [[x-part.width/2,y,z-part.width/2],[x+part.width/2,y,z+part.width/2]]);
    const {x,y,z,w=0,d=0,angle=0}=part;
    const width=(Math.abs(w*Math.cos(angle))+Math.abs(d*Math.sin(angle)))/2;
    const depth=(Math.abs(w*Math.sin(angle))+Math.abs(d*Math.cos(angle)))/2;
    return [[x-width,y,z-depth],[x+width,y,z+depth]];
  });
  return {
    left:Math.min(...points.map(([x])=>x)),right:Math.max(...points.map(([x])=>x)),
    back:Math.min(...points.map(([, ,z])=>z)),front:Math.max(...points.map(([, ,z])=>z)),
  };
}

function railLots(plan,developments) {
  return plan.plots.map(plot=>{
    const parts=developments.find(site=>site.plot===plot)?.steps.flat()
      .filter(part=>!(part.transitPreview||part.flight||part.wheel||part.observation));
    const bounds=parts?.length?footprint(placeParts(parts,plot)):
      {left:plot.x-5.45,right:plot.x+5.45,back:plot.z-5.45,front:plot.z+5.45};
    return {...bounds,plot};
  });
}

function crossesLot([x,z],[a,b],lot,margin) {
  let enter=0,exit=1;
  for (const [start,end,lo,hi] of [[x,a,lot.left-margin,lot.right+margin],[z,b,lot.back-margin,lot.front+margin]]) {
    const delta=end-start;
    if (Math.abs(delta)<1e-8) {
      if (start<lo||start>hi) return false;
      continue;
    }
    const first=(lo-start)/delta,last=(hi-start)/delta;
    enter=Math.max(enter,Math.min(first,last));
    exit=Math.min(exit,Math.max(first,last));
    if (enter>exit) return false;
  }
  return true;
}

function railMargin(lot,margin) {
  return Math.max(margin,lot.right-lot.left>14||lot.front-lot.back>14?1.35:0);
}

function clearRail(lots,a,b,margin=1.35) {
  return !lots.some(lot=>crossesLot(a,b,lot,railMargin(lot,margin)));
}

function pathClear(points,lots,margin) {
  return points.every((point,i)=>!i||clearRail(lots,points[i-1],point,margin));
}

function overlapsLot(bounds,lots) {
  return lots.some(lot=>bounds.right>=lot.left&&bounds.left<=lot.right
    &&bounds.front>=lot.back&&bounds.back<=lot.front);
}

function simpleRailLoop(points) {
  const side=([x,z],[a,b],[p,q])=>(a-x)*(q-z)-(b-z)*(p-x);
  const overlap=(a,b,c,d)=>Math.max(Math.min(a,b),Math.min(c,d))<=Math.min(Math.max(a,b),Math.max(c,d));
  for (let i=1;i<points.length-2;i++) {
    const a=points[i-1],b=points[i];
    for (let j=i+2;j<points.length-(i===1?1:0);j++) {
      const c=points[j-1],d=points[j];
      if (overlap(a[0],b[0],c[0],d[0])&&overlap(a[1],b[1],c[1],d[1])
          &&side(a,b,c)*side(a,b,d)<=0&&side(c,d,a)*side(c,d,b)<=0) return false;
    }
  }
  return true;
}

function railDetour(lots,margin) {
  const clear=(a,b)=>clearRail(lots,a,b,margin);
  const corners=lots.flatMap(lot=>{
    const {left,right,back,front}=lot,padding=railMargin(lot,margin)+.46;
    return [left-padding,right+padding].flatMap(x=>[back-padding,front+padding].map(z=>[x,z]));
  })
    .filter(point=>clear(point,point));
  const distance=([x,z],[a,b])=>Math.hypot(x-a,z-b);
  const edges=corners.map(()=>[]);
  for (let i=0;i<corners.length;i++) {
    for (let j=i+1;j<corners.length;j++) {
      if (!clear(corners[i],corners[j])) continue;
      const cost=distance(corners[i],corners[j]);
      edges[i].push([j,cost]);
      edges[j].push([i,cost]);
    }
  }
  return (from,to)=>{
    if (clear(from,to)) return [to];
    const costs=corners.map(point=>clear(from,point)?distance(from,point):Infinity);
    const last=corners.map(point=>clear(point,to)?distance(point,to):Infinity);
    const previous=corners.map(()=>-1),seen=new Set();
    let end=-1,best=Infinity;
    while (seen.size<corners.length) {
      let next=-1,cost=best;
      for (let i=0;i<corners.length;i++) {
        if (!seen.has(i)&&costs[i]<cost) { next=i; cost=costs[i]; }
      }
      if (next<0) break;
      seen.add(next);
      if (cost+last[next]<best) { best=cost+last[next]; end=next; }
      for (const [index,step] of edges[next]) {
        if (cost+step>=costs[index]) continue;
        costs[index]=cost+step;
        previous[index]=next;
      }
    }
    if (end<0) return null;
    const path=[to];
    for (let index=end;index>=0;index=previous[index]) path.push(corners[index]);
    return path.reverse();
  };
}

function regionalRailPaths(layout,plot,obstacles,plan,limit) {
  const span=plot.streetSpan??13.4;
  const level=deckHeight(plot.kind==='monorailStation');
  const candidates=[];
  const lots=plan.plots.filter(site=>!site.airfield&&!site.waterfront);
  const growth=Math.min(13,Math.max(0,lots.length-3)*.66);
  const acrossRiver=layout.theme==='city'&&lots.length>=5
    &&new Set(lots.map(site=>Math.sign(site.x-riverAt(layout,site.z)))).size>1;
  const score=points=>{
    const samples=points.filter((_,i)=>i%7===0);
    let penalty=0;
    const banks=new Set();
    for (const [x,z] of samples) {
      const tile=regionSurface(layout,x,z);
      const distance=Math.max(Math.abs(x),Math.abs(z));
      penalty+=Math.max(0,distance-72)**2*.34+(tile.water?.18:tile.basin< -1.4?.3:0);
      if (acrossRiver&&!tile.water) banks.add(Math.sign(x-riverAt(layout,z)));
    }
    const coverage=lots.reduce((sum,site)=>sum+Math.max(0,Math.min(...samples.map(([x,z])=>Math.hypot(x-site.x,z-site.z)))-7),0);
    return penalty/samples.length+coverage/Math.max(1,lots.length)*.38+(acrossRiver&&banks.size<2?28:0);
  };
  const worldPoint=([a,b])=>{
    const [x,,z]=pointOnSite([a,0,b],plot);
    return [x,z];
  };
  const local=lots.map(site=>{
    const x=site.x-plot.x,z=site.z-plot.z,c=Math.cos(plot.yaw),s=Math.sin(plot.yaw);
    return [x*c-z*s,x*s+z*c];
  });
  function addLoop(left,right,rear,returnOffset=0) {
    const curve=Math.sign(rear)*3.55,turn=Math.min(span*1.6,left-3,right-3);
    const waypoints=[[0,railZ],[6.2,railZ],[Math.min(span*.91,turn-1),railZ-curve],[turn,railZ-curve],
      [right,railZ],[right,rear],[right*.48,rear],[0,rear+Math.sign(rear)*4+returnOffset],
      [-left*.52,rear],[-left,rear],[-left,railZ],[-turn,railZ-curve],[-Math.min(span*.91,turn-1),railZ-curve],[-6.2,railZ],[0,railZ]];
    const points=roundedRailPath(waypoints,5.2,true).map(worldPoint);
    candidates.push({waypoints:waypoints.map(worldPoint),points,penalty:score(points)});
  }
  for (const side of sides) {
    for (const [width,depth] of [[36,27],[43,34],[13,26],[16,31],[32,37],[30,24],[49,35],[42,43],[29,33],[33,47]]) {
      addLoop(width+growth,width+growth,side*(depth+growth*.55));
    }
    if (local.length>=5) {
      const west=Math.max(29,Math.min(82,-Math.min(...local.map(([x])=>x))+11));
      const east=Math.max(29,Math.min(82,Math.max(...local.map(([x])=>x))+11));
      const rear=side*Math.max(24,Math.min(70,Math.max(...local.map(([,z])=>z*side))+9));
      addLoop(west,east,rear);
      addLoop(west+3,east+3,rear+side*3,side*2.6);
    }
  }
  candidates.sort((a,b)=>a.penalty-b.penalty);
  const margin=plot.kind==='monorailStation'?.79:1.01;
  let paths=candidates.filter(({points})=>pathClear(points,obstacles,margin)).slice(0,limit).map(({points})=>points);
  if (!paths.length) {
    // Protect the straight station track while finding the largest usable
    // bend radius through the rest of the loop.
    const detour=railDetour(obstacles,margin);
    const possibilities=[];
    for (const {waypoints} of candidates) {
      const stationExit=waypoints[1],stationEntry=waypoints.at(-2),center=waypoints[0];
      if (!pathClear([stationEntry,center,stationExit],obstacles,margin)) continue;
      const outer=waypoints.slice(2,-2).filter(point=>clearRail(obstacles,point,point,margin));
      const links=[stationExit,...outer,stationEntry];
      const legs=links.slice(1).map((point,i)=>detour(links[i],point));
      if (legs.some(leg=>!leg)) continue;
      const loop=[center,stationExit,...legs.flat(),center];
      for (const radius of [5,3.8,2.8,1.7]) {
        const rounded=roundedRailPath(loop,radius,true);
        if (!pathClear(rounded,obstacles,margin)||!simpleRailLoop(rounded)) continue;
        possibilities.push({path:rounded,score:score(rounded)+(5-radius)*1.1});
        break;
      }
      if (possibilities.length>=4) break;
    }
    paths=possibilities.sort((a,b)=>a.score-b.score).slice(0,limit).map(({path})=>path);
  }
  if (!paths.length) {
    const center=worldPoint([0,railZ]),entry=worldPoint([-6.2,railZ]),exit=worldPoint([6.2,railZ]);
    const possibilities=[];
    const near=(point,circuit)=>circuit.reduce((best,p,i)=>
      Math.hypot(p.x-point[0],p.z-point[1])<Math.hypot(circuit[best].x-point[0],circuit[best].z-point[1])?i:best,0);
    for (const circuit of (plan.circuits??[]).filter(loop=>loop.length>=7).slice(0,25)) {
      const first=near(exit,circuit),last=near(entry,circuit),size=circuit.length;
      if (first===last) continue;
      for (const direction of sides) {
        const count=((last-first)*direction+size)%size+1;
        if (count<6) continue;
        const loop=Array.from({length:count},(_,i)=>circuit[(first+direction*i+size)%size]).map(({x,z})=>[x,z]);
        const path=roundedRailPath([center,exit,...loop,entry,center],2.8,true);
        if (pathClear(path,obstacles,margin)&&simpleRailLoop(path)) possibilities.push({path,score:score(path)});
      }
    }
    paths=possibilities.sort((a,b)=>a.score-b.score).slice(0,limit).map(({path})=>path);
  }
  const [startX,startZ]=worldPoint([0,railZ]);
  return paths.map(path=>path.map(([x,z])=>{
    const terrain=regionSurface(layout,x,z);
    const blend=smooth((Math.hypot(x-startX,z-startZ)-5.2)/9);
    return [x,plot.y+level+blend*(Math.max(terrain.y,plot.y-.9)-plot.y+.22),z];
  }));
}

function railTunnel(layout,plan,route,obstacles) {
  const {sample,length}=route;
  const half=5.8;
  const candidates=[];
  for (let center=27;center<length-27;center+=1.8) {
    const start=center-half,end=center+half;
    const a=sample(start),m=sample(center),b=sample(end);
    const span=Math.hypot(b[0]-a[0],b[2]-a[2]);
    if (span<2*half-.56||Math.abs(a[1]-b[1])>1.38||Math.abs(m[1]-(a[1]+b[1])*.5)>.61) continue;
    const bearings=Array.from({length:7},(_,i)=>sample(start+(end-start)*i/6));
    const land=bearings.every(([x,,z])=>!regionSurface(layout,x,z).water)
      &&pathClear(bearings.map(([x,,z])=>[x,z]),obstacles,3.1);
    if (!land) continue;
    const penalty=bearings.reduce((sum,[x,,z])=>sum
      +Math.max(0,Math.max(Math.abs(x),Math.abs(z))-69)*4
      +(roadClearance(plan.paths,x,z)?0:2),0);
    candidates.push({start,end,penalty:penalty-Math.hypot(m[0]-plan.origin.x,m[2]-plan.origin.z)*.15});
  }
  return candidates.sort((a,b)=>a.penalty-b.penalty)[0];
}

function subwayEntrance(moon) {
  const tile=moon?'#a9a5bb':'#b7a68d',paint=moon?'#6997a8':'#487a70',light=moon?'#b5eeee':'#ffe4a1';
  return [rounded(0,1.46,2.27,.61,.18,tile,.02),rounded(0,-1.45,1.75,.14,1.54,dark,-.48),
    ...Array.from({length:8},(_,i)=>[
      box(0,1.35-i*.35,1.56,.355,.17,tile,.05-i*.093),
      box(0,1.48-i*.35,1.48,.049,.025,i%2?tile:cream,.22-i*.093),
    ]).flat(),
    ...sides.flatMap(side=>[box(side*1.0,-.05,.2,3.06,.39,tile,.18),
      beam([side*.84,.61,1.37],[side*.84,1.04,-1.12],.092,steel),
      rounded(side*.93,-.98,.21,.31,1.55,paint,.35),
      rounded(side*.94,-.14,.17,.31,.24,light,.95)]),
    rounded(0,-.92,2.35,1.46,.25,paint,1.75),dome(0,-.92,2.37,1.47,.47,paint,1.9),
    tube(0,-.12,1.15,.14,1.15,paint,1.76,'z'),
    tube(0,-.02,.94,.1,.94,moon?'#526381':'#30665b',1.86,'z'),
    box(0,.035,.54,.059,.102,light,2.49),box(0,.035,.10,.059,.4,light,2.11)];
}

function walkingLink(layout,paths,lots,from,heading) {
  const clearance=layout.theme==='island'?1.50:1.69;
  const ground=point=>regionSurface(layout,point.x,point.z);
  const dry=point=>!ground(point).water&&roadClearance(paths,point.x,point.z,clearance-.13);
  const projects=roadProjections(paths,from,18).sort((a,b)=>a.gap-b.gap);
  for (const road of projects.slice(0,28)) {
    const side=Math.sign((from.z-road.z)*road.u-(from.x-road.x)*road.v)||1;
    const end={x:road.x-road.v*side*clearance,z:road.z+road.u*side*clearance};
    if (heading&&(end.x-from.x)*heading[0]+(end.z-from.z)*heading[1]<-.2) continue;
    if (!clearRail(lots,[from.x,from.z],[end.x,end.z],.26)) continue;
    const count=Math.max(2,Math.ceil(Math.hypot(end.x-from.x,end.z-from.z)/.73));
    const points=Array.from({length:count+1},(_,i)=>({x:from.x+(end.x-from.x)*i/count,z:from.z+(end.z-from.z)*i/count}));
    if (!points.every(dry)) continue;
    return points;
  }
  return null;
}

function railWalkway(layout,points) {
  const color=layout.theme==='moon'?'#b7adca':'#cdbb99';
  const edges=points.map((point,i)=>{
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
    const span=Math.hypot(b.x-a.x,b.z-a.z)||1;
    return sides.map(side=>{
      const x=point.x+(b.z-a.z)*side*.48/span,z=point.z-(b.x-a.x)*side*.48/span;
      return [x,regionSurface(layout,x,z).y+.066,z];
    });
  });
  return edges.slice(1).map(([a,b],i)=>({...plate([edges[i][0],a,b,edges[i][1]],color),layer:3.3,railWalkway:true}));
}

function subwayWalker(layout,site,i) {
  const moon=layout.theme==='moon';
  const street=site.walk.slice().reverse().map(({x,z})=>[x,regionSurface(layout,x,z).y+.079,z]);
  const stairs=[1.55,1.25,.87,.49,.11,-.27,-.65,-1.03,-1.41,-1.69].map((z,index)=>
    pointOnSite([0,.23-index*.097,z],site));
  let length=0;
  const points=[...street,...stairs];
  const sections=points.slice(1).map(([x,y,z],j)=>{
    const [a,b,c]=points[j],start=length;
    length+=Math.hypot(x-a,z-c);
    return {a,b,c,x,y,z,start,end:length};
  }).filter(section=>section.end-section.start>.01);
  const speed=.88,walk=length/speed;
  return {kind:'walk',transitPassenger:true,characterSlot:914+i,voice:moon?'astronaut':'people',
    parts:visitor(moon?'astronaut':'human',moon?'#a18fc5':'#b58b66',undefined,false,.83,layout.seed%8),
    pose(seconds) {
      const t=(seconds+1.4+i*7)%(walk+8);
      if (t>=walk) return pose(site.x,-540,site.z,0);
      const at=t*speed,segment=sections.find(section=>at<section.end)??sections.at(-1);
      const {a,b,c,x,y,z,start,end}=segment;
      const p=clamp((at-start)/(end-start));
      return {...pose(a+(x-a)*p,b+(y-b)*p,c+(z-c)*p,Math.atan2(x-a,z-c),t%9<1.2),
        stride:Math.sin(at*7)*.18};
    },
  };
}

function subwayPlan(layout,plan,route,lots,tunnel,built,moon) {
  if (built<6) return null;
  const {sample,length}=route;
  const candidates=[];
  for (const [half,ramp] of [[21,14],[18,12.5],[16,10.9]]) {
    for (let center=half+15;center<length-half-15;center+=2.2) {
      const start=center-half,end=center+half;
      if (tunnel&&start<tunnel.end+3&&end>tunnel.start-3) continue;
      const [x,,z]=sample(center);
      const near=Math.min(...plan.plots.map(plot=>Math.hypot(x-plot.x,z-plot.z)));
      if (near>25||near<4.9||Math.max(Math.abs(x),Math.abs(z))>65) continue;
      const rim=[start+ramp*.56,end-ramp*.56].map(sample);
      if (rim.some(([x,,z])=>regionSurface(layout,x,z).water||!roadClearance(plan.paths,x,z,1.87))) continue;
      const [a,,b]=sample(start+5),[c,,d]=sample(end-5);
      const curve=half*2-10-Math.hypot(c-a,d-b);
      candidates.push({center,start,end,ramp,cost:near+curve*.44+(21-half)*.75});
    }
  }
  candidates.sort((a,b)=>a.cost-b.cost);
  const model=subwayEntrance(moon);
  let fallback=null;
  for (const candidate of candidates) {
    const stations=[];
    for (const shift of [0,-8,8,-5,5,-10,10]) {
      const distance=candidate.center+shift;
      if (stations.some(station=>Math.abs(station.distance-distance)<7)) continue;
      const [x,y,z]=sample(distance),[a,,b]=sample(distance+.7);
      const height=y-regionSurface(layout,x,z).y;
      const blend=smooth(Math.min(distance-candidate.start,candidate.end-distance)/candidate.ramp);
      if (height-(height+2.65)*blend> -1.72) continue;
      const yaw=Math.atan2(a-x,b-z);
      let entrance;
      for (const offset of [2.95,-2.95,4.05,-4.05,5.1,-5.1,6.3,-6.3]) {
        const px=x+Math.cos(yaw)*offset,pz=z-Math.sin(yaw)*offset;
        const ground=regionSurface(layout,px,pz);
        if (ground.water||ground.basin< -1.25||Math.hypot(px-plan.origin.x,pz-plan.origin.z)>62) continue;
        for (const turn of [yaw,yaw+Math.PI,yaw+Math.PI/2,yaw-Math.PI/2]) {
          const site={x:px,y:ground.y,z:pz,yaw:turn};
          const placed=placeParts(model,site);
          const bounds=footprint(placed);
          if (overlapsLot(bounds,lots)||stations.some(station=>overlapsLot(bounds,[station.bounds]))) continue;
          if ([bounds.left,bounds.right,px].some(u=>[bounds.back,bounds.front,pz].some(v=>
            !roadClearance(plan.paths,u,v,1.54)||regionSurface(layout,u,v).water))) continue;
          const [u,,v]=pointOnSite([0,0,1.77],site);
          const walk=walkingLink(layout,plan.paths,lots,{x:u,z:v},[Math.sin(turn),Math.cos(turn)]);
          if (!walk) continue;
          entrance={...site,distance,parts:placed,bounds,walk};
          break;
        }
        if (entrance) break;
      }
      if (entrance) stations.push(entrance);
      if (stations.length===(built>=19?2:1)) break;
    }
    if (stations.length===(built>=19?2:1)) return {...candidate,stations};
    if (stations.length&&!fallback) fallback={...candidate,stations};
  }
  return fallback;
}

function platformStairs(layout,plan,lots,site,scale) {
  const top=site.y+.129;
  const stone=layout.theme==='moon'?'#a6adc3':'#b8a588';
  for (const [u,v,dx,dz] of [[1.99,.24,1,0],[1.99,-.62,1,0],[1.55,2.08*scale,0,1],[1.55,-2.08*scale,0,-1]]) {
    for (const reach of [3.4,4.65,5.9]) {
      const [a,,b]=pointOnSite([u,0,v],site),[c,,d]=pointOnSite([u+dx*reach,0,v+dz*reach],site);
      const ground=regionSurface(layout,c,d);
      if (ground.water||top-ground.y<.41||top-ground.y>reach*.98||!clearRail(lots,[a,b],[c,d],.46)) continue;
      const heading=Math.atan2(c-a,d-b),span=Math.hypot(c-a,d-b);
      const landing=ground.y+.06;
      const count=Math.ceil((top-landing)/.24);
      const at=(fraction,side,height)=>[a+(c-a)*fraction+Math.cos(heading)*side,height,b+(d-b)*fraction-Math.sin(heading)*side];
      const safe=Array.from({length:7},(_,i)=>{
        const p=i/6,[x,level,z]=at(p,0,top+(landing-top)*p),tile=regionSurface(layout,x,z);
        return !tile.water&&level+.16>=tile.y&&(level-tile.y>2.05||roadClearance(plan.paths,x,z,1.52));
      });
      if (!safe.every(Boolean)) continue;
      const steps=Array.from({length:count},(_,i)=>{
        const p=(i+.5)/count,level=top-(top-landing)*i/count;
        const [u,,v]=at(p,0,level);
        return {...box(u,v,1.08,span/count+.027,.237,i%3?stone:cream,level-.237),
          angle:-heading,platformStair:true};
      });
      const handrails=sides.flatMap(side=>[
        beam(at(0,side*.43,top-.24),at(1,side*.43,landing-.16),.146,stone),
        beam(at(.01,side*.56,top+.61),at(1,side*.56,landing+.62),.086,steel),
        ...[0,.5,1].map(p=>beam(at(p,side*.56,top+(landing-top)*p),at(p,side*.56,top+(landing-top)*p+.61),.077,steel)),
      ]);
      const walk=walkingLink(layout,plan.paths,lots,{x:c,z:d},[Math.sin(heading),Math.cos(heading)]);
      return {parts:[...steps,...handrails],walk};
    }
  }
  return null;
}

function placeRailPlatform(route,preferred,layout,plan,lots,allowed,moon,compact=false) {
  const {sample,length}=route;
  for (let attempt=0;attempt<=46;attempt++) {
    const shift=Math.ceil(attempt/2)*.93*(attempt%2?1:-1);
    const distance=(preferred+shift+length)%length;
    if (!allowed(distance)) continue;
    const scale=compact?.61:1;
    const [a,ay,b]=sample(distance-2.64*scale),[c,cy,d]=sample(distance+2.64*scale);
    const dx=c-a,dz=d-b,chord=Math.hypot(dx,dz);
    if (chord<5.21*scale||Math.abs(cy-ay)>.49) continue;
    const test=[-1.76,-.88,0,.88,1.76].map(shift=>sample(distance+shift*scale));
    if (test.some(([x,y,z])=>Math.abs((x-a)*dz-(z-b)*dx)/chord>.091
      ||Math.abs(y-ay-(cy-ay)*((x-a)*dx+(z-b)*dz)/(chord*chord))>.16)) continue;
    const [x,y,z]=sample(distance),yaw=Math.atan2(dx,dz);
    for (const turn of [yaw,yaw+Math.PI]) {
      const site={x,y,z,yaw:turn};
      const parts=placeParts(railPlatform(moon).map(part=>({...part,z:part.z*scale,d:part.d*scale})),site);
      const bounds=footprint(parts);
      const foot=[x+Math.cos(turn)*1.82,z-Math.sin(turn)*1.82];
      if (overlapsLot(bounds,lots)||regionSurface(layout,...foot).water) continue;
      const high=y+.13-regionSurface(layout,...foot).y>.56;
      const stairs=high?platformStairs(layout,plan,lots,site,scale):null;
      if (high&&!stairs) continue;
      return {distance,...site,parts:[...parts.map(part=>({...part,railStop:true})),...(stairs?.parts??[]),
        ...(stairs?.walk?railWalkway(layout,stairs.walk):[])],foot,walk:stairs?.walk};
    }
  }
  return null;
}

function railwayBridges(layout,route) {
  if (layout.theme!=='city') return [];
  const {sample,length}=route;
  const water=distance=>{
    const [x,y,z]=sample(distance);
    const tile=regionSurface(layout,x,z);
    return tile.water&&!tile.pond&&y>1.1;
  };
  const spans=[];
  let first=null;
  for (let distance=.3;distance<length-.3;distance+=.58) {
    if (water(distance)) { first??=distance; continue; }
    if (first!==null&&distance-first>3.2) spans.push([first-.9,distance+.75]);
    first=null;
  }
  const parts=spans.flatMap(([start,end])=>{
    const panels=Math.ceil((end-start)/2.45);
    const frame=Array.from({length:panels+1},(_,i)=>{
      const distance=start+(end-start)*i/panels;
      const [x,y,z]=sample(distance),[a,,b]=sample(distance-.32),[c,,d]=sample(distance+.32);
      return {x,y,z,yaw:Math.atan2(c-a,d-b)};
    });
    const line=(post,side,y)=>pointOnSite([side*1.11,y,0],post);
    const steel='#557677',lattice='#6f8983';
    return frame.flatMap((post,i)=>{
      const prev=frame[i-1],height=2.03,foot=-.46;
      const ground=regionSurface(layout,post.x,post.z).y;
      const footing=i===0||i===panels||i===Math.floor(panels/2)&&panels>=6;
      return [
        ...(footing?placeParts([rounded(0,0,2.8,1.49,Math.max(.2,post.y-ground-.39),'#a09583',ground-post.y),
          box(0,0,3.04,1.59,.2,'#c2b7a0',-.52)],post):[]),
        ...sides.flatMap(side=>[beam(line(post,side,foot),line(post,side,height),.139,steel),
          ...(prev?[beam(line(prev,side,foot),line(post,side,foot),.20,steel),
            beam(line(prev,side,height),line(post,side,height),.165,steel),
            beam(line(prev,side,i%2?foot:height),line(post,side,i%2?height:foot),.11,lattice)]:[]),
        ]),
        ...([0,panels].includes(i)||i%3===0?[beam(line(post,-1,height),line(post,1,height),.12,steel)]:[]),
      ];
    });
  });
  return parts.map(part=>({...part,railBridge:true}));
}

export function districtRail(layout,plot,plan,developments=[],built=plan.plots.length) {
  const moon=plot.kind==='monorailStation';
  const lots=railLots(plan,developments);
  const candidates=regionalRailPaths(layout,plot,lots.filter(lot=>lot.plot!==plot),plan,built>=6?8:1);
  if (!candidates.length) return null;
  let selected;
  for (const raised of candidates) {
    const route=railLoop(raised);
    const tunnel=railTunnel(layout,plan,route,lots);
    const subway=subwayPlan(layout,plan,route,lots,tunnel,built,moon);
    if (!selected||subway) selected={route,tunnel,subway};
    if (subway) break;
  }
  const {route,tunnel,subway}=selected;
  const {distances,length,wrap}=route;
  const between=(section,distance,margin=0)=>section&&distance>section.start+margin&&distance<section.end-margin;
  const inside=(distance,margin=0)=>between(tunnel,distance,margin);
  const sample=distance=>{
    const pos=route.sample(distance),at=wrap(distance);
    if (!between(subway,at)) return pos;
    const drop=smooth(Math.min(at-subway.start,subway.end-at)/subway.ramp);
    const ground=regionSurface(layout,pos[0],pos[2]).y;
    return [pos[0],pos[1]+(ground-2.65-pos[1])*drop,pos[2]];
  };
  const points=distances.map(sample);
  const subwayDepth=distance=>{
    const [x,y,z]=sample(distance);
    return y-regionSurface(layout,x,z).y;
  };
  const portals=tunnel?[tunnel.start,tunnel.end].map((distance,i)=>{
    const [x,y,z]=sample(distance),[a,,b]=sample(distance+(i?1:-1)*.8);
    return {x,y,z,yaw:Math.atan2(a-x,b-z)};
  }):[];
  // Clip the middle of the tunnel out of the exposed track, while keeping the route continuous.
  const parts=railTrack(points,moon,i=>{
    const distance=(distances[i-1]+distances[i])*.5;
    return inside(distance,1.15)||between(subway,distance)&&subwayDepth(distance)<.095;
  });
  parts.push(...railwayBridges(layout,{sample,length}));
  if (tunnel) {
    const path=Array.from({length:16},(_,i)=>sample(tunnel.start+(tunnel.end-tunnel.start)*i/15));
    parts.push(...tunnelLandform(path,layout,{width:1.08,height:1.85}).map(part=>({...part,tunnel:true})));
  }
  const entries={},walkways=[],walkers=[];
  if (subway) {
    for (const direction of sides) {
      const rim=direction>0?subway.start:subway.end;
      let offset=4.4;
      while (offset<subway.ramp&&subwayDepth(rim+direction*offset)>.63) offset+=.3;
      const distance=rim+direction*offset;
      const path=Array.from({length:8},(_,i)=>sample(distance+direction*(-.38+i*.44)));
      parts.push(...tunnelLandform(path,layout,{width:1.08,height:1.91}).map(part=>({...part,tunnel:true})));
      const [x,y,z]=sample(distance),[a,,b]=sample(distance-direction*.8);
      portals.push({x,y,z,yaw:Math.atan2(a-x,b-z)});
    }
    subway.stations.forEach((site,i)=>{
      const {x,z,parts:entrance,walk}=site;
      const key=`subway:${i}`;
      entries[key]={name:moon?['Kraterpassasjen','Støvtunnelen'][i]:['Elvepassasjen','Byporten'][i],
        status:moon?'Underjordisk månestopp':'T-banestopp',x,z,sound:'vehicle',voice:layout.seed%12+i,
        story:moon?'Følg trappen ned til månetoget. Her er det parkering for romstøvler.':'Toget stopper under gaten. Noen tar banen bare for å telle ekkoene i tunnelen.'};
      parts.push(...entrance.map(part=>({...part,entity:key})));
      parts.push(...railWalkway(layout,walk));
      walkways.push(walk);
      walkers.push(subwayWalker(layout,site,i));
    });
  }
  for (let distance=4.85;distance<length-4.3;distance+=4.65) {
    const [x,y,z]=sample(distance);
    if (inside(distance,-2)||between(subway,distance)&&subwayDepth(distance)<.65
      ||Math.hypot(x-plot.x,z-plot.z)<5.6||layout.theme==='city'&&regionSurface(layout,x,z).water) continue;
    const [nx,,nz]=sample(distance+.49),run=Math.hypot(nx-x,nz-z);
    const bases=roadClearance(plan.paths,x,z)?[[x,z]]:sides
      .map(side=>[x-side*(nz-z)/run*2.69,z+side*(nx-x)/run*2.69])
      .filter(([a,b])=>roadClearance(plan.paths,a,b));
    const column=moon?'#a4aec6':'#b4a48f',cap=moon?'#8394a8':'#a89481';
    for (const [a,b] of bases) {
      if (!clearRail(lots,[a,b],[x,z],.45)) continue;
      const ground=regionSurface(layout,a,b);
      parts.push(rounded(a,b,.58,.61,Math.max(.08,y-ground.y-.39),column,ground.y),
        a===x&&b===z?box(x,z,1.09,.88,.27,cap,y-.54):beam([a,y-.4,b],[x,y-.4,z],.27,cap));
    }
  }

  const surfaceStops=[];
  for (const fraction of [.28,.67]) {
    const stop=placeRailPlatform({sample,length},length*fraction,layout,plan,lots,distance=>
      !inside(distance,-5)&&!between(subway,distance,-4)&&distance>=12&&distance<=length-12
      &&surfaceStops.every(stop=>Math.abs(distance-stop.distance)>=12),moon);
    if (!stop) continue;
    parts.push(...stop.parts);
    const [a,b]=stop.foot,base=regionSurface(layout,a,b).y;
    if (roadClearance(plan.paths,a,b)) parts.push(rounded(a,b,.6,.61,Math.max(.08,stop.y-base-.11),'#a8a9ad',base));
    if (stop.walk) walkways.push(stop.walk);
    surfaceStops.push(stop);
  }
  const undergroundStops=subway?.stations.map(station=>station.distance)??[];
  const stops=[0,...surfaceStops.map(stop=>stop.distance).concat(undergroundStops).sort((a,b)=>a-b),length];
  const speed=moon?7.7:7.15;
  let period=0;
  const timetable=stops.slice(0,-1).map((start,i)=>{
    const end=stops[i+1],dwell=i===0?2.7:undergroundStops.includes(start)?2.1:1.65;
    const travel=(end-start)/speed;
    const entry={start,end,depart:period+dwell,arrive:period+dwell+travel,travel};
    period=entry.arrive;
    return entry;
  });
  const departures=plan.plots.length>=10&&length>=230?[0,period*.5]:[0];
  const actors=departures.flatMap(offset=>[false,true].map(carriage=>({
    kind:carriage?'train-car':moon?'monorail':'train',
    parts:trainModel(moon,carriage),
    pose(seconds) {
      const t=(seconds+offset)%period;
      const leg=timetable.find(entry=>t<entry.arrive)??timetable.at(-1);
      const progress=clamp((t-leg.depart)/leg.travel);
      const ease=progress-.12*Math.sin(2*Math.PI*progress);
      const distance=wrap(leg.start+(leg.end-leg.start)*ease-(carriage?3.15:0));
      const [x,y,z]=sample(distance);
      const [a,ay,b]=sample(distance-.38),[c,cy,d]=sample(distance+.38);
      const visible=!inside(distance,1.7)&&!(between(subway,distance)&&subwayDepth(distance)<-.55);
      const model=pose(x,visible?y:-540,z,Math.atan2(c-a,d-b),!carriage&&visible&&progress>0,
        Math.atan2(cy-ay,Math.hypot(c-a,d-b)));
      return !carriage&&visible&&t>=leg.depart&&t<leg.depart+.72
        ? {...model,cue:moon?'monorail-start':'train-start',sound:.9}:model;
    },
  })));
  return {parts,portals,points:points.map(([x,y,z])=>({x,y,z})),actors,entries,walkways,walkers,undergroundStops,surfaceStops};
}

function railPlatform(moon) {
  const accent=moon?'#73bcc7':'#bd795c';
  return [
    rounded(1.42,0,1.32,4.2,.23,moon?'#a8aec3':'#d8c5a1',-.1),
    box(.87,0,.095,4.08,.04,'#f6cd74',.13),
    ...sides.map(side=>tube(1.81,side*1.26,.13,.13,1.47,steel,.13)),
    rounded(1.45,0,1.45,3.05,.24,accent,1.56),
    rounded(1.58,.16,.46,1.26,.22,'#7e858c',.34),
  ];
}

function cableCar() {
  const teal='#328779',cream='#f4e0b2',red='#a94e49',brass='#d4a45f';
  return [
    rounded(0,0,1.49,3.22,.23,red,.16),rounded(0,0,1.48,3.14,.12,cream,.38),
    rounded(0,-.47,1.5,1.82,.59,teal,.48),rounded(0,-.49,1.56,1.86,.67,'#87b3b4',.98),
    rounded(0,-.47,1.62,1.89,.1,cream,1.61),
    rounded(0,.57,1.66,1.78,.16,red,1.63),dome(0,-.1,1.65,3.12,.28,'#485b5c',1.69),
    ...sides.flatMap(side=>[
      ...[-1.03,-.45,.25,1.36].map(z=>box(side*.72,z,.075,.085,1.23,z>0?brass:teal,.43)),
      box(side*.84,.91,.27,1.26,.105,teal,.3),
      box(side*.39,.83,.26,.9,.18,'#a87953',.71),
      tube(side*.6,-.9,.15,.37,.37,dark,.0,'x'),
      tube(side*.6,.9,.15,.37,.37,dark,.0,'x'),
      ...[-.81,-.23].map(z=>box(side*.786,z,.03,.06,.63,cream,1)),
    ]),
    box(0,1.43,1.23,.12,.52,teal,.44),box(0,1.51,.7,.07,.16,cream,.79),
    dome(0,1.57,.25,.19,.27,'#f7dc89',.51),
  ];
}

export function transitVehiclePreview(kind) {
  if (!['tramStation','railwayStation','monorailStation'].includes(kind)) return null;
  const moon=kind==='monorailStation',tram=kind==='tramStation';
  const x=tram?1.05:1.7,y=.85,z=tram?4.24:5.2;
  const model=tram?cableCar():trainModel(moon);
  return [
    ...railTrack([[-2.25,y,z],[4.15,y,z]],moon),
    ...placeParts(model,{x,y,z,yaw:Math.PI/2}).map(part=>({...part,vehiclePreview:true})),
  ];
}

export function districtTram(layout,plot,plan,developments=[]) {
  const circuits=plan.circuits??[];
  const lots=railLots(plan,developments.map(({plot,steps})=>({plot,
    steps:steps.map(parts=>parts.filter(part=>part.y+part.h>1.97&&part.y<4.2))})));
  const access=plot.entries?.[0]??plot;
  const score=path=>path.reduce((length,p,i)=>length+Math.hypot(p.x-path.at(i-1).x,p.z-path.at(i-1).z),0)
    -3*Math.min(...path.map(({x,z})=>Math.hypot(x-access.x,z-access.z)));
  const route=circuits.slice().sort((a,b)=>score(b)-score(a)).map(circuit=>{
    const start=circuit.reduce((best,p,i)=>Math.hypot(p.x-access.x,p.z-access.z)
      <Math.hypot(circuit[best].x-access.x,circuit[best].z-access.z)?i:best,0);
    const loop=circuit.slice(start).concat(circuit.slice(0,start));
    const corners=loop.map(({x,z})=>[x,z]);
    const seam=corners[0].map((v,i)=>(v+corners.at(-1)[i])/2);
    for (const radius of [3.6,2.35,1.68]) {
      const points=roundedRailPath([seam,...corners,seam],radius);
      if (pathClear(points,lots,.85)) return points;
    }
    return null;
  }).find(Boolean);
  if (!route) return null;
  const points=route.map(([x,z])=>[x,regionSurface(layout,x,z).y+2.48,z]);
  const {length,sample}=railLoop(points);
  const parts=railTrack(points,false,undefined,.81);
  const stops=[],walkways=[];
  for (const fraction of length>138?[0,.25,.51,.77]:[0,.32,.66]) {
    const platform=placeRailPlatform({sample,length},fraction*length,layout,plan,lots,distance=>
      stops.every(stop=>Math.min(Math.abs(distance-stop),length-Math.abs(distance-stop))>9),false);
    if (platform) { parts.push(...platform.parts); stops.push(platform.distance); if (platform.walk) walkways.push(platform.walk); }
  }
  for (let distance=0;stops.length<3&&distance<length;distance+=4.35) {
    const platform=placeRailPlatform({sample,length},distance,layout,plan,lots,candidate=>
      stops.every(stop=>Math.min(Math.abs(candidate-stop),length-Math.abs(candidate-stop))>6.8),false,true);
    if (platform) { parts.push(...platform.parts); stops.push(platform.distance); if (platform.walk) walkways.push(platform.walk); }
  }
  const start=stops[0]??0;
  const departuresAt=stops.map(distance=>(distance-start+length)%length).sort((a,b)=>a-b);
  for (let d=3.2;d<length;d+=6.1) {
    const [x,y,z]=sample(d),[nx,,nz]=sample(d+.5);
    const angle=Math.atan2(nx-x,nz-z);
    const a=x+Math.cos(angle)*2.3,b=z-Math.sin(angle)*2.3;
    if (!clearRail(lots,[a,b],[x,z],.45)) continue;
    const base=regionSurface(layout,a,b).y;
    parts.push(tube(a,b,.47,.47,Math.max(.1,y-base-.22),'#b5a389',base),beam([a,y-.26,b],[x,y-.26,z],.22,'#b5a389'));
  }
  const speed=4.2,dwell=2,period=length/speed+stops.length*dwell;
  const departures=length>=126?[0,period*.5]:[0];
  return {parts,walkways,points:points.map(([x,y,z])=>({x,y,z})),actors:departures.map(offset=>({
    kind:'tram',parts:cableCar(),
    pose(seconds) {
      const t=(seconds+offset)%period;
      let distance=t*speed,departing=false;
      for (const stop of departuresAt) {
        if (distance<stop) break;
        if (distance<stop+dwell*speed) { distance=stop; break; }
        if (distance<stop+(dwell+.63)*speed) departing=true;
        distance-=dwell*speed;
      }
      distance+=start;
      const [x,y,z]=sample(distance),[a,ay,b]=sample(distance-.35),[c,cy,d]=sample(distance+.35);
      const model=pose(x,y,z,Math.atan2(c-a,d-b),departing,Math.atan2(cy-ay,Math.hypot(c-a,d-b)));
      return departing?{...model,cue:'tram-bell'}:model;
    },
  }))};
}

export const AIRPORT_HELIPAD={x:3.63,y:.48,z:-.48};
export const REGIONAL_HELIPAD={x:.76,y:.48,z:4.15};
export function helipadParts({x,z}=AIRPORT_HELIPAD) {
  return [
    tube(x,z,3.02,3.02,.12,'#e3c37e',.35),tube(x,z,2.82,2.82,.024,'#657d87',.458),
    ...sides.map(side=>box(x+side*.29,z,.15,.85,.018,cream,.482)),
    box(x,z,.67,.16,.017,cream,.482),
  ];
}

function helicopterBody(island) {
  const paint=island?'#368e96':'#d49465';
  return [
    rounded(0,0,.99,2.04,.74,paint,.25),dome(0,.39,.91,1.17,.5,glass,.54),
    rounded(0,-.29,.91,.84,.12,cream,.71),
    beam([0,.62,-.63],[0,.79,-2.14],.22,paint),
    box(0,-2.09,.092,.44,.51,paint,.65),
    tube(0,-.16,.11,.11,.39,steel,1),
    ...sides.flatMap(side=>[
      beam([side*.32,.3,.55],[side*.52,.075,.52],.09,steel),
      beam([side*.32,.28,-.52],[side*.52,.075,-.48],.09,steel),
      beam([side*.52,.065,-.8],[side*.52,.075,.84],.092,dark),
      beam([side*.52,.075,.84],[side*.52,.184,.99],.091,dark),
      box(side*.488,-.23,.045,.47,.27,glass,.55),
    ]),
    tube(.075,-2.125,.10,.28,.28,dark,.89,'x'),
    box(.133,-2.125,.037,.54,.058,steel,1),
    box(.134,-2.125,.037,.061,.54,steel,.758),
  ];
}

export function helicopterModels(island,plot) {
  const pad=plot.airfield?REGIONAL_HELIPAD:AIRPORT_HELIPAD;
  const center=island?pointOnSite([pad.x,pad.y,pad.z],plot):[plot.x,plot.y,plot.z];
  const yaw=island?(plot.yaw??0)-Math.PI/4:0;
  const [cx,cy,cz]=center;
  function flight(seconds) {
    const t=seconds%(island?46:58);
    if (island) {
      if (t<4||t>=32) return pose(cx,-540,cz,yaw);
      let distance=0,altitude=0,heading=yaw;
      if (t<13) {
        const incoming=(13-t)/9;
        distance=-143*incoming**2.3;
        altitude=54*incoming**1.42;
      } else if (t>23) {
        const outgoing=(t-23)/9;
        distance=143*outgoing**2.25;
        altitude=53*outgoing**1.44;
      } else heading+=Math.sin((t-13)*.32)*.035;
      const bend=Math.sign(distance)*Math.min(28,Math.abs(distance)*.3)*Math.sin(Math.min(1,Math.abs(distance)/150)*Math.PI);
      return pose(cx+Math.sin(yaw)*distance+Math.cos(yaw)*bend,cy+altitude,
        cz+Math.cos(yaw)*distance-Math.sin(yaw)*bend,heading-Math.atan2(bend,Math.abs(distance)+1),t<16||t>21.8);
    }
    if (t<5||t>=41) return pose(cx,-540,cz,yaw);
    const travel=(t-5)/36, angle=travel*Math.PI*4;
    const distance=11+42*(1-smooth(travel*7)) + 42*smooth((travel-.86)*7.14);
    const along=Math.cos(angle)*distance,across=Math.sin(angle*.5)*distance*1.4;
    const heading=Math.atan2(-2*Math.sin(angle),Math.cos(angle*.5)*1.4);
    return pose(cx+along,cy+16.5+Math.sin(angle*.5)*2.65,cz+across,heading,t>8&&t<38);
  }
  const rotor=[
    tube(0,0,.32,.32,.11,dark,0),
    ...[0,Math.PI/2].flatMap(angle=>[
      {...box(0,0,.136,3.2,.038,dark,.05),angle},
      ...sides.map(side=>({...box(Math.sin(angle)*side*1.51,Math.cos(angle)*side*1.51,.137,.19,.042,cream,.05),angle})),
    ]),
  ];
  return [
    {kind:'helicopter',parts:helicopterBody(island),pose:flight},
    {kind:'helicopter-rotor',parts:rotor,pose(seconds) {
      const base=flight(seconds);
      const speed=island&&base.y===cy?10:23;
      return pose(base.x,base.y+1.37,base.z,seconds*speed);
    }},
  ];
}
