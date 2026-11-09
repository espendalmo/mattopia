import {regionSurface,roadElevation} from './regions.js';
import {pointOnSite} from './scenery.js';
import {randomGenerator} from './worlds.js';

const rectangle=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
const clipped=[[-.37,-.5],[.38,-.5],[.5,-.34],[.5,.31],[.34,.5],[-.34,.5],[-.5,.34],[-.5,-.33]];
const plaza=[[-.5,-.5],[.5,-.5],[.5,.21],[.29,.5],[-.29,.5],[-.5,.22]];
const runway=[[-.5,-.5],[.25,-.5],[.5,-.23],[.5,.5],[-.25,.5],[-.5,.22]];
const oval=Array.from({length:16},(_,i)=>{
  const angle=i*Math.PI/8;
  return [Math.sign(Math.cos(angle))*Math.abs(Math.cos(angle))**.7*.5,
    Math.sign(Math.sin(angle))*Math.abs(Math.sin(angle))**.7*.5];
});
const curved=new Set(['park','garden','greatPark','bandstand','palmGarden','moonGarden','biodome','habitat','ringHabitat',
  'moonHotel','spaceField','rocketPort','orbitalPort','telescope','tropicalPools','beachClub','coaster']);
const square=new Set(['school','sawmill','factory','airstrip','solar','solarGarden','prison','field']);
const paved=new Set(['busStation','airport','airstrip','factory','sawmill','hoverDealer','roverGarage','moonWorkshop','moonCargo','cargoDepot',
  'railwayStation','monorailStation']);

export function shapeLandmarkGround(stages,kind) {
  const foundation=stages[0].find(part=>part.support);
  if (!foundation) return stages;
  const profile=kind==='airport'?runway:curved.has(kind)?oval:square.has(kind)?rectangle:
    ['hall','bank','arcade','nightCinema','market','tropicalMarket','square'].includes(kind)?plaza:clipped;
  if (profile===rectangle) return stages;
  return stages.map(parts=>parts.map(part=>{
    const slab=part.support||part.y+part.h<.4&&Math.abs(part.x-foundation.x)<.16&&Math.abs(part.z-foundation.z)<.16&&
      part.w>=foundation.w*.87&&part.d>=foundation.d*.87;
    if (!slab) return part;
    const outline=profile.map(([x,z])=>[part.x+x*part.w,part.y,part.z+z*part.d]);
    return {...part,shape:'support',outline};
  }));
}

const colors={
  brick:['#9b786a','#aa8270','#b18a79','#8f7264','#b6987d'],
  stone:['#9c9b83','#aba58e','#8c9181','#b2ac96','#a19783'],
  sand:['#c4aa83','#b89c78','#d7bc96','#c0a989','#b6a389'],
  basalt:['#888ba4','#9b9bb3','#81869e','#aba5bc','#9394aa'],
};

export function terrainFoundation(layout,part,seed) {
  if (!part.support) return [part];
  const {x,y,z,w,d,h,angle=0}=part;
  const c=Math.cos(angle),s=Math.sin(angle),top=y+h;
  const rim=part.outline??rectangle.map(([u,v])=>[x+u*w*c-v*d*s,y,z+u*w*s+v*d*c]);
  const outline=rim.map(([a,,b])=>[a,Math.min(top-.026,regionSurface(layout,a,b).y),b]);
  const floor=Math.min(...outline.map(point=>point[1]));
  const wall={...part,shape:'support',outline,y:floor,h:top-floor};
  if (top-floor<.14) return [wall];

  const rng=randomGenerator(seed);
  const material=layout.theme==='moon'?'basalt':layout.theme==='island'?'sand':rng()>.61?'brick':'stone';
  const palette=colors[material],row=material==='brick'?.19+rng()*.11:.27+rng()*.21;
  const length=material==='brick'?.47+rng()*.19:.6+rng()*.33;
  const inset=material==='brick'?.028:.039;
  const blocks=[];
  for (let edge=0;edge<outline.length;edge++) {
    const [a,lowA,b]=outline[edge],[e,lowB,f]=outline[(edge+1)%outline.length];
    const dx=e-a,dz=f-b,span=Math.hypot(dx,dz);
    const offset=.021, point=(along,height)=>[a+dx*along/span+dz/span*offset,height,b+dz*along/span-dx/span*offset];
    const foot=along=>lowA+(lowB-lowA)*along/span;
    for (let level=0;top-level*row>Math.min(lowA,lowB)+.09;level++) {
      const upper=top-level*row-.022,lower=upper-row+.041;
      for (let start=level%2?-length*.47:0;start<span;start+=length) {
        const from=Math.max(0,start)+inset,to=Math.min(span,start+length)-inset;
        const base=Math.max(lower,foot(from)+.024,foot(to)+.024);
        if (to-from<.15||upper-base<.08) continue;
        const clip=Math.min((to-from)*.14,(upper-base)*.23,material==='brick'?.035:.076);
        const polygon=[point(from,base+clip),point(from,upper-clip),point(from+clip,upper),
          point(to-clip,upper),point(to,upper-clip),point(to,base+clip),point(to-clip,base),point(from+clip,base)];
        blocks.push({shape:'terrain',outline:polygon,x:polygon[0][0],z:polygon[0][2],y:base,h:upper-base,
          layer:(part.layer??7)+.018,color:palette[Math.floor(rng()*palette.length)]});
      }
    }
  }
  return [wall,...blocks];
}

export function plotAccess(layout,plot,foundation) {
  const entry=plot.entries[0];
  if (plot.waterfront||!entry||!foundation) return null;
  const s=Math.sin(plot.yaw),c=Math.cos(plot.yaw);
  const dx=entry.x-plot.x,dz=entry.z-plot.z;
  const front=dx*s+dz*c,across=dx*c-dz*s;
  const drive=paved.has(plot.kind);
  const endX=foundation.x+(drive?.18:plot.index%2===0?-.21:.21)*foundation.w;
  const rim=foundation.outline;
  let endZ=foundation.z+foundation.d*.5;
  if (rim) {
    const edges=rim.flatMap(([x,,z],i)=>{
      const [a,,b]=rim[(i+1)%rim.length];
      return (x<=endX&&endX<a||a<=endX&&endX<x)?[z+(b-z)*(endX-x)/(a-x)]:[];
    });
    if (edges.length) endZ=Math.max(...edges);
  }
  const startZ=front-(layout.theme==='island'?.85:1.05);
  if (startZ-endZ<.34) return null;
  const startX=across+(endX-across)*.26;
  const path=Array.from({length:7},(_,i)=>{
    const t=i/6,ease=t*t*(3-2*t);
    const [x,,z]=pointOnSite([startX+(endX-startX)*ease,0,startZ+(endZ-startZ+.06)*t],plot);
    return {x,z,y:roadElevation(layout,x,z)*(1-ease)+(plot.y+.155)*ease};
  });
  return {path,drive};
}
