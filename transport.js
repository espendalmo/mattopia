import {box,rounded,dome,tube,roof,beam,placeParts,pointOnSite} from './scenery.js';
import {regionSurface,regionVisibility} from './regions.js';

const cream='#f4e5c6', dark='#455366', glass='#74aab9', steel='#a7b6bb';
const sides=[-1,1];
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{ const t=clamp(value); return t*t*(3-2*t); };
const railZ=-2.45;
const deckHeight=moon=>moon?3.38:2.95;
const pose=(x,y,z,yaw,sound=false)=>({
  x,y,z,cos:Math.cos(yaw),sin:Math.sin(yaw),stride:0,rollCos:1,rollSin:0,sound:Number(sound),
});

function trainModel(moon,carriage=false,tram=false) {
  const paint=tram?'#389589':moon?'#70b9c1':'#b96761', stripe=tram?'#ffe0a4':moon?'#f0b979':'#efd2a2';
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
    rounded(x,-1.55,1.21,1.14,level,wall,.3),box(x,-1.55,1.52,1.35,.23,trim,level-.14),
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
        roof(x,-1.2,3.08,1.68,.43,canopy,level+1.28),
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

function railTrack(points,moon) {
  const deck=moon?'#7f8da3':'#82776e', edge=moon?'#c3c1d3':'#c5a58a';
  const half=moon?.57:.94;
  const sideways=(index,offset,lower=0)=>{
    const [x,y,z]=points[index];
    const before=points[Math.max(0,index-1)],after=points[Math.min(points.length-1,index+1)];
    const dx=after[0]-before[0],dz=after[2]-before[2],length=Math.hypot(dx,dz);
    return [x-dz/length*offset,y-lower,z+dx/length*offset];
  };
  const parts=[];
  for (let i=1;i<points.length;i++) {
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

function roadClearance(paths,x,z) {
  for (const path of paths) {
    for (let i=1;i<path.length;i++) {
      const a=path[i-1],b=path[i];
      const dx=b.x-a.x,dz=b.z-a.z;
      const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1));
      if (Math.hypot(x-a.x-dx*t,z-a.z-dz*t)<2.15) return false;
    }
  }
  return true;
}

function roundedRailPath(waypoints) {
  const softened=waypoints.flatMap((point,i)=>{
    if (i===0||i===waypoints.length-1) return [point];
    const radius=i===1?.85:3.1;
    const inset=([x,z])=>{
      const dx=x-point[0],dz=z-point[1],distance=Math.hypot(dx,dz);
      const ratio=Math.min(.42,radius/distance);
      return [point[0]+dx*ratio,point[1]+dz*ratio];
    };
    const before=inset(waypoints[i-1]),after=inset(waypoints[i+1]);
    return Array.from({length:7},(_,j)=>{
      const t=j/6,u=1-t;
      return point.map((v,axis)=>u*u*before[axis]+2*u*t*v+t*t*after[axis]);
    });
  });
  const path=[softened[0]];
  for (let i=1;i<softened.length;i++) {
    const from=softened[i-1],to=softened[i];
    const count=Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/.83);
    for (let step=1;step<=count;step++) {
      path.push(from.map((value,axis)=>value+(to[axis]-value)*step/count));
    }
  }
  return path;
}

function railLeg(layout,plot,side,otherSites) {
  const span=plot.streetSpan??13.4,half=span*.5;
  const rear=-half+.46;
  const candidates=[];
  for (const turn of sides) {
    const nextStreet=rear+turn*span;
    const long=[
      [0,railZ],[side*4.74,railZ],[side*(half+2.05),rear],
      [side*span*1.5,rear],[side*span*1.5,nextStreet],[side*(half+.97),nextStreet],
    ];
    const short=[
      [0,railZ],[side*4.74,railZ],[side*(half+.16),railZ],
      [side*(half+.16),nextStreet],[side*(half+span*.69),nextStreet],
    ];
    candidates.push({path:roundedRailPath(long),penalty:0},{path:roundedRailPath(short),penalty:4.6});
  }
  const score=({path,penalty})=>{
    for (let i=1;i<path.length;i+=3) {
      const [x,,z]=pointOnSite([path[i][0],0,path[i][1]],plot);
      const ground=regionSurface(layout,x,z);
      const outside=Math.max(0,Math.abs(x)-73,Math.abs(z)-73);
      penalty+=outside*.38+(ground.water?.13:0)+(ground.basin<-1.4?.13:0);
      penalty+=Math.hypot(x-layout.origin.x,z-layout.origin.z)*.0025;
      if (otherSites.some(site=>Math.hypot(site.x-x,site.z-z)<5.4)) penalty+=.75;
    }
    const [ex,ez]=path.at(-1);
    const [x,,z]=pointOnSite([ex,0,ez],plot);
    if (regionSurface(layout,x,z).water) penalty+=3.35;
    return penalty;
  };
  const [chosen]=candidates.map(candidate=>({...candidate,score:score(candidate)})).sort((a,b)=>a.score-b.score);
  return chosen.path;
}

function railExit(layout,plot,leg,side,obstacles) {
  const [x,z]=leg.at(-1);
  const end=side*145;
  const candidates=[z-22,z,z+22].map(turn=>{
    const tail=roundedRailPath([[x,z],[x+side*12,z],[x+side*25,turn],[end,turn]]);
    const score=tail.reduce((sum,[a,b])=>{
      const [wx,,wz]=pointOnSite([a,0,b],plot);
      const terrain=regionSurface(layout,wx,wz);
      return sum+(terrain.water?.13:0)+Math.max(0,terrain.y-plot.y)*.05
        +3*obstacles.filter(other=>other!==plot&&Math.hypot(other.x-wx,other.z-wz)<6.2).length;
    },0);
    return {tail,score};
  });
  return leg.concat(candidates.sort((a,b)=>a.score-b.score)[0].tail.slice(1));
}

export function districtRail(layout,plot,plan) {
  const moon=plot.kind==='monorailStation',level=deckHeight(moon);
  const obstacles=[...Object.values(layout.berths),...plan.plots];
  const [left,right]=sides.map(side=>railExit(layout,plot,railLeg(layout,plot,side,obstacles),side,obstacles));
  const middle=left.length-1;
  const path=left.slice(1).reverse().concat(right);
  const points=path.map(([along,across])=>{
    const [x,y,z]=pointOnSite([along,level,across],plot);
    const terrain=regionSurface(layout,x,z);
    const outside=smooth((Math.hypot(along,across-railZ)-5.1)/6.5);
    return [x,y+Math.max(0,terrain.y-plot.y+.31)*outside,z];
  });
  const distances=[0];
  for (let i=1;i<points.length;i++) {
    const [x,y,z]=points[i],[a,b,c]=points[i-1];
    distances.push(distances[i-1]+Math.hypot(x-a,y-b,z-c));
  }
  const length=distances.at(-1),station=distances[middle];
  const sample=distance=>{
    const position=Math.max(0,Math.min(length,distance));
    const next=distances.findIndex((value,index)=>index>0&&value>=position);
    const progress=(position-distances[next-1])/(distances[next]-distances[next-1]);
    return points[next-1].map((value,axis)=>value+(points[next][axis]-value)*progress);
  };

  const onMap=([x,,z])=>Math.max(Math.abs(x),Math.abs(z))<84;
  const parts=railTrack(points.filter(onMap),moon);
  for (let distance=3.4;distance<length-1;distance+=4.65) {
    const [x,y,z]=sample(distance);
    if (!onMap([x,y,z])||Math.hypot(x-plot.x,z-plot.z)<5.6) continue;
    const [nx,,nz]=sample(distance+.49),run=Math.hypot(nx-x,nz-z);
    const bases=roadClearance(plan.paths,x,z)?[[x,z]]:sides
      .map(side=>[x-side*(nz-z)/run*2.69,z+side*(nx-x)/run*2.69])
      .filter(([a,b])=>roadClearance(plan.paths,a,b));
    const column=moon?'#a4aec6':'#b4a48f',cap=moon?'#8394a8':'#a89481';
    for (const [a,b] of bases) {
      const ground=regionSurface(layout,a,b);
      parts.push(rounded(a,b,.58,.61,Math.max(.08,y-ground.y-.39),column,ground.y),
        a===x&&b===z?box(x,z,1.09,.88,.27,cap,y-.54):beam([a,y-.4,b],[x,y-.4,z],.27,cap));
    }
  }
  const distancesFromStation=[-23,24].map(offset=>station+offset);
  for (const distance of distancesFromStation) {
    const [x,y,z]=sample(distance),[nx,,nz]=sample(distance+.56);
    const yaw=Math.atan2(nx-x,nz-z);
    parts.push(...placeParts(railPlatform(moon),{x,y,z,yaw}));
    const a=x+Math.cos(yaw)*1.82,b=z-Math.sin(yaw)*1.82;
    const base=regionSurface(layout,a,b).y;
    if (roadClearance(plan.paths,a,b)) parts.push(rounded(a,b,.6,.61,Math.max(.08,y-base-.11),'#a8a9ad',base));
  }
  const stops=[0,distancesFromStation[0],station,distancesFromStation[1],length];
  const timing=[0];
  const cruise=moon?8.4:7.75;
  for (let i=1;i<stops.length;i++) {
    const dwell=i===stops.length-1?2.2:i===2?2.7:1.65;
    timing.push(timing.at(-1)+(stops[i]-stops[i-1])/cruise+dwell);
  }
  const leg=timing.at(-1);
  const actors=[false,true].map(carriage=>({
    kind:carriage?'train-car':moon?'monorail':'train',
    parts:trainModel(moon,carriage),
    pose(seconds) {
      const time=seconds+timing[2]-1.25;
      const reverse=Math.floor(time/leg)%2!==0;
      const t=reverse?leg-time%leg:time%leg;
      const next=timing.findIndex((end,i)=>i>0&&end>=t);
      const from=stops[next-1],to=stops[next],duration=(to-from)/cruise;
      const fraction=clamp((t-timing[next-1])/duration);
      const ease=fraction+.1*Math.sin(2*Math.PI*fraction);
      const direction=reverse?-1:1;
      const distance=from+(to-from)*ease-(carriage?direction*3.15:0);
      const [x,y,z]=sample(distance);
      const [a,,b]=sample(distance-.34*direction),[c,,d]=sample(distance+.34*direction);
      const visible=Math.max(Math.abs(x),Math.abs(z))<86&&regionVisibility(plan,x,z)>.095;
      return pose(x,visible?y:-540,z,Math.atan2(c-a,d-b),!carriage&&visible&&fraction<1);
    },
  }));
  return {parts,points:points.filter(onMap).map(([x,y,z])=>({x,y,z})),actors};
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

export function districtTram(layout,plot,plan) {
  const circuits=plan.circuits??[];
  const access=plot.entries?.[0]??plot;
  const score=path=>path.length*.9-Math.min(...path.map(({x,z})=>Math.hypot(x-access.x,z-access.z)));
  const circuit=circuits.slice().sort((a,b)=>score(b)-score(a))[0];
  if (!circuit) return null;
  const start=circuit.reduce((best,p,i)=>Math.hypot(p.x-access.x,p.z-access.z)
    <Math.hypot(circuit[best].x-access.x,circuit[best].z-access.z)?i:best,0);
  const loop=circuit.slice(start).concat(circuit.slice(0,start));
  const corners=loop.map(({x,z})=>[x,z]);
  const mid=(a,b)=>a.map((v,i)=>(v+b[i])/2);
  const seam=mid(corners.at(-1),corners[0]);
  const points=roundedRailPath([seam,...corners,seam]).map(([x,z])=>[x,regionSurface(layout,x,z).y+2.48,z]);
  const distances=[0];
  for (let i=1;i<points.length;i++) distances.push(distances.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][2]-points[i-1][2]));
  const length=distances.at(-1);
  const sample=value=>{
    const distance=(value%length+length)%length;
    const end=distances.findIndex(d=>d>distance);
    const t=(distance-distances[end-1])/(distances[end]-distances[end-1]);
    return points[end-1].map((v,i)=>v+(points[end][i]-v)*t);
  };
  const parts=railTrack(points,false);
  const stops=[0,.32,.66].map(fraction=>length*fraction);
  for (const distance of stops) {
    const [x,y,z]=sample(distance),[nx,,nz]=sample(distance+.53);
    parts.push(...placeParts(railPlatform(false),{x,y,z,yaw:Math.atan2(nx-x,nz-z)}));
  }
  for (let d=3.2;d<length;d+=6.1) {
    const [x,y,z]=sample(d),[nx,,nz]=sample(d+.5);
    const angle=Math.atan2(nx-x,nz-z);
    const a=x+Math.cos(angle)*2.3,b=z-Math.sin(angle)*2.3;
    const base=regionSurface(layout,a,b).y;
    parts.push(tube(a,b,.47,.47,Math.max(.1,y-base-.22),'#b5a389',base),beam([a,y-.26,b],[x,y-.26,z],.22,'#b5a389'));
  }
  const speed=4.2,dwell=2,period=length/speed+stops.length*dwell;
  return {parts,points:points.map(([x,y,z])=>({x,y,z})),actors:[{
    kind:'tram',parts:trainModel(false,false,true),
    pose(seconds) {
      const t=seconds%period;
      let distance=t*speed,stopped=false;
      for (let i=0;i<stops.length;i++) {
        if (distance<stops[i]) break;
        if (distance<stops[i]+dwell*speed) { distance=stops[i]; stopped=true; break; }
        distance-=dwell*speed;
      }
      const [x,y,z]=sample(distance),[a,,b]=sample(distance-.35),[c,,d]=sample(distance+.35);
      return pose(x,y,z,Math.atan2(c-a,d-b),!stopped&&t%11<3);
    },
  }]};
}

export const AIRPORT_HELIPAD={x:3.63,y:.48,z:-.48};
export function helipadParts() {
  const {x,z}=AIRPORT_HELIPAD;
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
  const center=island?pointOnSite([AIRPORT_HELIPAD.x,AIRPORT_HELIPAD.y,AIRPORT_HELIPAD.z],plot):[plot.x,plot.y,plot.z];
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
