import {box,dome,rounded,tube,beam,placeParts,visitor} from './scenery.js';
import {regionSurface,roadElevation} from './regions.js';
import {randomGenerator} from './worlds.js';
import {roadworkAge} from './scene-motion.js';

const sides=[-1,1];
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};

function workCrew(theme,site) {
  const moon=theme==='moon',orange=moon?'#e9ae75':'#ee9c4e',ivory='#fff0d3',steel='#697482';
  const cones=sides.flatMap(side=>[-.92,0,.92].map(x=>[
    box(x,side*1.35,.34,.34,.073,steel),
    dome(x,side*1.35,.26,.26,.39,orange,.072),
    tube(x,side*1.35,.16,.16,.067,ivory,.242),
  ]).flat());
  const barricades=sides.flatMap(side=>[
    ...sides.map(leg=>box(leg*.73,side*.93,.15,.39,.56,steel)),
    rounded(0,side*.93,1.8,.17,.32,ivory,.42),
    ...[-.68,-.23,.22,.67].map(x=>({...box(x,side*1.028,.20,.047,.26,orange,.45),angle:side*.11})),
  ]);
  const people=[[-1.13,-.36,.36],[1.11,.39,Math.PI+.45]].flatMap(([x,z,yaw],i)=>{
    const model=visitor(moon?'astronaut':'human',i?'#ce7768':'#e9aa52',undefined,false,.80,moon?5:3);
    const hat=moon?[]:[dome(0,.015,.53,.54,.19,'#edc15f',1.37),rounded(0,.05,.55,.55,.067,'#f3d578',1.34)];
    return placeParts([...model,...hat],{x,y:0,z,yaw}).map(part=>({...part,life:[x,.65,z,2.1+i]}));
  });
  const kit=[rounded(.18,-.1,.62,.52,.31,'#566a7b'),rounded(.18,-.08,.31,.063,.082,orange,.295),
    beam([-.48,.06,.07],[-.21,1.07,.25],.071,'#ba9274'),box(-.50,.1,.35,.17,.11,steel)];
  const yaw=Math.atan2(site.dx,site.dz);
  return {kind:'roadwork',parts:[...cones,...barricades,...kit,...people],
    pose(seconds) {
      const age=roadworkAge(site,seconds);
      const intoRoad=age===null?0:smooth(Math.min(age,site.duration-age)/1.5);
      const side=site.side*(1-intoRoad)*2.7;
      const angle=yaw+site.side*(1-intoRoad)*.22;
      return {x:site.x+site.dz*side,y:age===null?-540:site.y+.026,z:site.z-site.dx*side,
        cos:Math.cos(angle),sin:Math.sin(angle),stride:0,rollCos:1,rollSin:0,sound:0};
    },
  };
}

function usesStreet(driver,x,z,dx,dz) {
  return driver.route?.segments.some(segment=>{
    const run=Math.hypot(segment.dx,segment.dz);
    if (!run||Math.abs(segment.dx*dx+segment.dz*dz)<run*.78) return false;
    const u=x-segment.x,v=z-segment.z;
    const t=clamp((u*segment.dx+v*segment.dz)/(run*run));
    return Math.hypot(u-segment.dx*t,v-segment.dz*t)<1.58;
  });
}

export function planRoadworks(layout,plan,drivers,built) {
  if (built<5) return {sites:[],crews:[]};
  const rng=randomGenerator(layout.seed^0x7624a9bc);
  const elevation=plan.streetElevation??((x,z)=>roadElevation(layout,x,z));
  const sites=plan.paths.flatMap(path=>{
    const a=path[0],b=path.at(-1),length=Math.hypot(b.x-a.x,b.z-a.z);
    if (length<10.6) return [];
    const dx=(b.x-a.x)/length,dz=(b.z-a.z)/length;
    if (path.some(point=>Math.abs((point.x-a.x)*dz-(point.z-a.z)*dx)>.27)) return [];
    const x=(a.x+b.x)*.5,z=(a.z+b.z)*.5,y=elevation(x,z);
    const dry=sides.every(side=>{
      const u=x+dx*side*3.6,v=z+dz*side*3.6;
      return !regionSurface(layout,u,v).water&&Math.abs(elevation(u,v)-y)<.46&&!plan.inRoadTunnel?.(u,v);
    });
    if (!dry||plan.inRoadTunnel?.(x,z)||regionSurface(layout,x,z).water
      ||(plan.transit??[]).some(point=>Math.abs(y-point.y)<2.1&&Math.hypot(x-point.x,z-point.z)<3.9)
      ||plan.plots.some(plot=>plot.entries.some(point=>Math.hypot(x-point.x,z-point.z)<3.25))) return [];
    const usableSide=sides.filter(side=>!regionSurface(layout,x+dz*side*2.7,z-dx*side*2.7).water);
    if (!usableSide.length) return [];
    const count=drivers.filter(actor=>usesStreet(actor,x,z,dx,dz)).length;
    if (count<2) return [];
    const reach=Math.hypot(x-plan.origin.x,z-plan.origin.z);
    return [{x,y,z,dx,dz,side:usableSide[Math.floor(rng()*usableSide.length)],
      score:Math.min(6,count)*.92-reach*.065+rng()*1.6,roadwork:true}];
  }).sort((a,b)=>b.score-a.score);
  if (!sites.length) return {sites:[],crews:[]};
  const period=130+rng()*22,first=12+rng()*11;
  const places=[sites[0]];
  const second=sites.find(site=>Math.hypot(site.x-places[0].x,site.z-places[0].z)>14);
  if (second) places.push(second);
  const closures=places.map((site,i)=>({...site,start:first+i*period*.5,period,duration:12+rng()*3}));
  return {sites:closures,crews:closures.map(site=>workCrew(layout.theme,site))};
}
