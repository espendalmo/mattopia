import {box,rounded,tube,dome,beam,placeParts,pointOnSite,actor,coasterActor,visitor,swimmer} from './scenery.js';
import {regionSurface} from './regions.js';
import {airportRunway,COASTER_TRACK,planeModel,ROCKET_PAD,WHEEL_HUB} from './world-landmarks.js';
import {randomGenerator} from './worlds.js';

const paint='#e3ae55';
const rust='#bf8651';
const metal='#667988';
const chalk='#f2e0b8';

function barriers() {
  return [-2.35,.1,2.55].flatMap(x=>[
    box(x-.59,4.48,.13,.18,.6,metal,.05),box(x+.59,4.48,.13,.18,.6,metal,.05),
    rounded(x,4.49,1.53,.16,.32,chalk,.27),
    ...[-.52,0,.52].map(dx=>box(x+dx,4.59,.21,.04,.3,'#d99758',.29)),
  ]);
}

function digger() {
  return [
    ...[-.47,.47].flatMap(x=>[rounded(x,1.96,.42,1.43,.32,'#52616a',.04),
      ...[-.45,0,.45].map(z=>tube(x*1.29,1.96+z,.09,.19,.19,metal,.11,'x'))]),
    rounded(0,1.94,1.13,1.14,.32,paint,.36),
    rounded(-.25,2.06,.52,.73,.59,'#8caeb2',.61),
    box(-.25,2.06,.58,.77,.095,paint,1.17),
    beam([.29,.63,2.07],[.57,1.34,2.98],.2,paint),
    beam([.57,1.34,2.98],[.58,.51,3.53],.17,paint),
    beam([.29,.79,2.13],[.57,1.16,2.82],.068,chalk),
    rounded(.58,3.61,.52,.46,.25,rust,.31),
  ];
}

function towerCrane(height) {
  const x=-4.13,z=2.58;
  const posts=[[-.23,-.23],[.23,-.23],[.23,.23],[-.23,.23]];
  const braces=Array.from({length:Math.floor(height/.75)},(_,i)=>.45+i*.75);
  return [
    rounded(x,z,1.32,1.23,.19,'#a8a798',.045),
    ...posts.map(([a,b])=>beam([x+a,.22,z+b],[x+a,height,z+b],.1,rust)),
    ...braces.flatMap(y=>posts.flatMap(([a,b],i)=>{
      const [c,d]=posts[(i+1)%posts.length];
      return [beam([x+a,y,z+b],[x+c,y,z+d],.085,paint),
        beam([x+a,y,z+b],[x+c,y+.59,z+d],.073,paint)];
    })),
    rounded(x,z,.79,.84,.37,paint,height-.07),
    rounded(x+.31,z+.18,.46,.53,.43,'#94b6bf',height+.27),
    beam([x-1.16,height+.74,z],[x+5.58,height+.74,z],.15,paint),
    beam([x-1.13,height+.74,z],[x,height+1.29,z],.09,chalk),
    beam([x,height+1.29,z],[x+5.38,height+.74,z],.085,chalk),
    box(x-.92,z,.48,.49,.42,metal,height+.32),
    beam([x+4.6,height+.74,z],[x+4.6,height-1.24,z],.045,metal),
    rounded(x+4.6,z,.22,.17,.19,paint,height-1.36),
  ];
}

function scaffold(height) {
  const side=-2.51,front=3.56;
  const bars=[];
  for (const x of [side,side+1.65,side+3.3]) {
    for (const z of [front,front-.56]) bars.push(beam([x,.14,z],[x,height,z],.082,metal));
  }
  for (let y=1.03;y<height;y+=.92) {
    bars.push(box(side+1.65,front-.29,3.5,.69,.085,'#ccac7f',y));
    bars.push(beam([side,y+.15,front],[side+3.3,y+.15,front],.068,metal));
    bars.push(beam([side,y-.76,front],[side+1.65,y+.13,front],.069,metal));
    bars.push(beam([side+1.65,y+.13,front],[side+3.3,y-.76,front],.069,metal));
  }
  return bars;
}

export function constructionYard(layout,plot,phase,height) {
  const bank=plot.waterfront&&plot.entries?.[0];
  if (bank) {
    const {x,z}=bank;
    const site={x,z,y:regionSurface(layout,x,z).y+.08,yaw:plot.kind==='bridge'?Math.PI:plot.yaw+Math.PI};
    return placeParts([...digger(),...barriers().slice(0,7)],site);
  }
  const gravel=[[-3.41,3.34],[3.39,2.48],[3.04,3.91]].map(([x,z],i)=>dome(x,z,1.15+i*.16,1.12,.36,'#baa283',.04));
  const earth=phase===1?[rounded(0,0,8.4,7.8,.045,layout.theme==='moon'?'#ae9db2':'#c6ad87',-.025)]:[];
  const details=phase===1?digger():scaffold(Math.min(3.6,Math.max(1.7,height*.62)));
  return placeParts([...earth,...gravel,...barriers(),...details,...towerCrane(Math.min(8.8,3.35+height*.59))],plot);
}

export function rideModels(plot,stages) {
  if (plot.kind==='needleTower') {
    const parts=stages.flat().filter(part=>part.observation).map(part=>({...part,y:part.y-7.85}));
    return [{kind:'observation',parts,pose(seconds) {
      const yaw=plot.yaw+seconds*.12;
      return {x:plot.x,y:plot.y+7.85,z:plot.z,cos:Math.cos(yaw),sin:Math.sin(yaw),stride:0,rollCos:1,rollSin:0,sound:0};
    }}];
  }
  if (plot.kind==='wheel') {
    const [hx,hy,hz]=WHEEL_HUB;
    const parts=placeParts(stages.flat().filter(part=>part.wheel),{x:-hx,y:-hy,z:-hz})
      .map(part=>({...part,hinge:part.hinge?.map((value,i)=>value-WHEEL_HUB[i])}));
    const [x,y,z]=pointOnSite(WHEEL_HUB,plot);
    return [{kind:'wheel',x,y,z,yaw:plot.yaw,parts}];
  }
  if (plot.kind==='coaster') {
    const points=COASTER_TRACK.map(([x,y,z])=>pointOnSite([x,y+.11,z],plot));
    return ['#da866a','#70aeb0'].map((color,i)=>coasterActor(coasterCarModel(color,true),points,.23+i*.039));
  }
  if (plot.kind==='field'||plot.kind==='spaceField') {
    const space=plot.kind==='spaceField',radius=space?2.34:1.53;
    return [-1,1].map((side,i)=>{
      const path=[[side*radius,0],[side*.75,-1.02],[-side*.28,.3],[side*radius,1.08]].map(([x,z])=>{
        const [a,,b]=pointOnSite([x,0,z],plot);
        return [a,b];
      });
      return actor(visitor(space?'astronaut':'human',i?'#6b9bbc':'#d48078',i?'#b48466':'#edb78a',false),
        path,{kind:'walk',ground:plot.y+(space?.52:.35),speed:1.24+i*.18,phase:.12+i*.48,corner:.54,
          voice:space?'astronaut':'people'});
    });
  }
  const model=stages.flat().filter(part=>part.flight);
  if (model.length) {
    const kind=model[0].flight;
    const delay=(plot.index*11%7)*.28;
    if (kind==='plane') {
      const runway=airportRunway(plot.kind);
      const [x,y,z]=pointOnSite([runway.x,runway.y,runway.z],plot);
      return [{kind,x,y,z,yaw:plot.yaw+runway.yaw,runway:runway.length,delay,parts:planeModel()}];
    }
    const [x,y,z]=pointOnSite(ROCKET_PAD,plot);
    const parts=placeParts(model,{x:-ROCKET_PAD[0],y:-ROCKET_PAD[1],z:-ROCKET_PAD[2]});
    const craft={kind,x,y,z,yaw:plot.yaw,delay,parts};
    return [craft,{...craft,kind:'rocket-flame',parts:rocketFlame()}];
  }
  return [];
}

export function coasterCarModel(color,passenger=false) {
  return [rounded(0,0,.68,.91,.24,color,.013),rounded(0,-.19,.64,.32,.19,'#f3dbb3',.22),
    box(0,.16,.57,.095,.12,'#596f7d',.13),
    ...(passenger?[rounded(0,-.1,.36,.32,.25,'#668f9a',.22),dome(0,-.09,.26,.28,.28,'#efc391',.44)]:[])];
}

function rocketFlame() {
  const exhaust=(radius,length,color)=>Array.from({length:8},(_,i)=>{
    const ring=index=>[radius*Math.cos(index*Math.PI/4),.03,radius*Math.sin(index*Math.PI/4)];
    return {shape:'terrain',outline:[ring(i),ring(i+1),[0,-length,0]],color,x:0,z:0,y:-length,h:length};
  });
  return [...exhaust(.64,2.26,'#f19354'),...exhaust(.47,1.4,'#f8cd69'),
    dome(0,0,.72,.74,.31,'#fff1b6',-.16)];
}

const parkVisitors=[[-1.98,.82,2.18,0,true],[2.88,.4,2.28,-.5],[3.89,.4,-1.54,.2]];
const gardenVisitors=[[-1.69,.68,2.45,0,true],[2.97,.47,1.61,.45]];
const cafeVisitors=[[-2.8,.53,3.19,Math.PI,true],[1.96,.41,2.44,.5],[.71,.41,3.39,-.6]];
const mealVisitors=[[-2.75,.54,3.28,Math.PI,true],[.13,.54,3.65,Math.PI,true],[2.03,.37,2.24,-.44]];
const campVisitors=[[1.63,.83,-.1,.12,true],[-.01,.42,2.3,-.42]];
const hotelVisitors=[[-2.27,.35,2.63,.29],[.69,.35,3.91,-.67]];
const VISITORS={
  greatPark:parkVisitors,palmGarden:parkVisitors,moonGarden:parkVisitors,
  garden:gardenVisitors,bandstand:gardenVisitors,camp:campVisitors,beachCamp:campVisitors,
  restaurant:mealVisitors,bistro:cafeVisitors,tikiBar:cafeVisitors,coralCafe:cafeVisitors,
  dustCafe:cafeVisitors,moonBurger:cafeVisitors,cosmicIce:cafeVisitors,
  busStation:[[-2.61,.82,-1.83,0,true],[2.66,.82,-1.84,0,true],[.39,.43,3.44,-.4]],
  hotel:hotelVisitors,resort:hotelVisitors,sunsetHotel:hotelVisitors,glassHotel:hotelVisitors,
  auroraHotel:hotelVisitors,megaResort:[[.27,.35,3.33,.46],[-4.32,.35,3.66,-.3]],
  hoverDealer:[[-.84,.35,2.72,-.75],[.83,.35,2.59,.54]],
  market:[[-1.42,.35,1.95,-.62],[2.66,.35,1.76,Math.PI]],
  tropicalMarket:[[-1.28,.35,1.87,-.57],[2.59,.35,1.67,Math.PI]],
  bookHall:[[-2.49,.82,3.16,0,true],[.81,.35,3.54,-.3]],
  arcade:[[-1.54,.35,2.62,.51],[1.7,.35,2.74,-.62]],
  lunarArcade:[[-1.44,.35,2.59,.54],[1.61,.35,2.63,-.52]],
  islandArcade:[[-1.44,.35,2.59,.54],[1.61,.35,2.63,-.52]],
  airport:[[-2.92,.59,4.57,-.43],[-4.27,.59,4.56,.42]],
  tramStation:hotelVisitors, hangar:hotelVisitors, casino:cafeVisitors, needleTower:hotelVisitors,
  airstrip:[[-2.86,.35,2.18,-.26]],
  wheel:[[-2.84,.35,3.52,-.44],[-1.68,.35,3.28,-.41],[1.87,.35,3.07,.42]],
  coaster:[[-1.66,.35,3.42,-.3],[-.63,.35,3.53,-.3],[1.92,.35,3.9,Math.PI]],
  field:[[-.64,.55,-3.07,0,true],[.68,.55,-3.1,.07,true]],
  spaceField:[[-1.93,.37,4.22,-.5],[1.47,.37,4.28,-.56]],
  cinema:[[-1.53,.35,3.57,.54],[1.55,.35,3.66,-.51]],
  nightCinema:[[-1.53,.35,3.26,.54],[1.53,.35,3.42,-.51]],
  roverGarage:[[.17,.37,3.62,-.37]],
  moonWorkshop:[[-2.8,.35,3.44,-.41],[.69,.36,3.74,-.35]],
  moonCargo:[[-3.05,.36,3.49,-.53],[3.63,.36,3.55,.44]],
  cargoDepot:[[-2.79,.35,3.78,-.42]],
};

export function landmarkVisitors(theme,plot) {
  const positions=VISITORS[plot.kind]??[];
  const outfits=['#ca8677','#6c9cb4','#e0b375','#8a80b0'];
  const skins=['#deae85','#aa765b','#ebbf91'];
  const people=positions.flatMap(([x,y,z,yaw,seated],i)=>{
    const kind=theme==='moon'?(i===1?'alien':'astronaut'):'human';
    const model=visitor(kind,outfits[(plot.index+i)%outfits.length],skins[(plot.index+i)%skins.length],seated);
    return placeParts(model,{x,y,z,yaw});
  });
  const pools=plot.kind==='megaResort'?[[-1.64,.65,2.52],[2.06,.65,2.83]]
    :plot.kind==='tropicalPools'?[[1.5,.65,-.93],[-1.72,.65,2.02]]
    :plot.kind==='beachClub'?[[2.28,.64,2.16]]:[];
  for (const [x,y,z] of pools) people.push(...placeParts(swimmer('#dda97d','#d99c81'),{x,y,z,yaw:-.32}));
  if (plot.kind==='field'||plot.kind==='spaceField') {
    people.push(dome(.21,-.17,.235,.235,.224,'#f4e6cb',plot.kind==='field'?.365:.512));
  }
  return placeParts(people,plot);
}

export function lunarSky(seed,sky,amount) {
  const rng=randomGenerator(seed^0x5fa849b1);
  const right=[Math.SQRT1_2,0,Math.SQRT1_2];
  const up=[1/Math.sqrt(6),Math.sqrt(2/3),-1/Math.sqrt(6)];
  const front=[-1,1,1].map(axis=>axis/Math.sqrt(3));
  const origin=[75,17,-97];
  const point=(x,y,depth)=>origin.map((value,i)=>value+x*right[i]+y*up[i]+depth*front[i]);
  const background=sky.slice(1).match(/../g).map(value=>parseInt(value,16)/255);
  const shade=(color,strength=1)=>color.map((value,i)=>background[i]+(value-background[i])*strength*amount);
  const face=(outline,colors)=>{
    const [x,y,z]=outline[0];
    return {shape:'terrain',outline,colors,color:sky,x,y,z,h:0,layer:-1};
  };
  const stars=Array.from({length:42},()=>{
    const x=(rng()-.5)*187,y=(rng()-.51)*38,r=.15+rng()*.29;
    const strength=(.31+rng()*.61)*Math.max(.09,1-(x/105)**2);
    const color=shade(rng()<.62?[.54,.58,.73]:[1,.98,.88],strength);
    const [a,b,c,d]=[[x+r,y],[x,y+r],[x-r,y],[x,y-r]].map(([u,v])=>point(u,v,-8));
    return [face([a,b,c],[color,color,color]),face([a,c,d],[color,color,color])];
  }).flat();

  const radius=8.2,steps=28;
  const vertex=(r,angle)=>{
    const x=Math.cos(angle)*r,y=Math.sin(angle)*r,z=Math.sqrt(1-r*r);
    const land=Math.sin(8*x+3*y)*Math.cos(5*y-4*x)+.38*Math.sin(13*y+4*x)>.43;
    const light=Math.max(.38,.68-.28*x+.19*y+.11*z);
    const tint=land?[.6,.81,.65]:[.32,.68,.8];
    const rim=r**8*.43;
    return {position:point(61+x*radius,y*radius,z*radius),
      color:shade(tint.map((channel,i)=>channel*light+(background[i]-channel*light)*rim))};
  };
  const triangle=(...points)=>face(points.map(vertex=>vertex.position),points.map(vertex=>vertex.color));
  const rings=[.22,.46,.68,.84,1].map(r=>Array.from({length:steps},(_,i)=>vertex(r,i*2*Math.PI/steps)));
  const center=vertex(0,0);
  const planet=rings.flatMap((ring,index)=>ring.flatMap((vertex,i)=>{
    const next=(i+1)%steps;
    if (!index) return [triangle(center,vertex,ring[next])];
    const inner=rings[index-1];
    return [triangle(inner[i],vertex,ring[next]),triangle(inner[i],ring[next],inner[next])];
  }));
  return [...stars,...planet];
}

