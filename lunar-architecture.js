import {box as b,rounded as r,tube as t,dome as d,beam,worldSign,parkedVehicle,placeParts} from './scenery.js';

const pearl='#e5dfd8',ink='#3c4268',cyan='#8cddd8',gold='#eac484',pink='#d998b5',glass='#608aa9';
const pair=[-1,1];
const cone=(x,z,w,h,color,y)=>({shape:'cone',x,z,y,w,d:w,h,color});
const podium=(w=10.1,depth=9.3)=>[
  {...b(0,0,w-.24,depth-.24,1.32,'#aaa7c0',-1.25),support:true},
  r(0,0,w,depth,.27,'#bdb6ca',.04),b(0,0,w-.3,depth-.3,.085,'#e0d4cf',.292),
];

function ring(x,z,radius,y,color,width=.12,tilt=0) {
  const point=a=>[x+Math.cos(a)*radius,y+Math.sin(a)*tilt,z+Math.sin(a)*radius];
  return Array.from({length:24},(_,i)=>beam(point(i*Math.PI/12),point((i+1)*Math.PI/12),width,color));
}

function windows(x,z,radius,y,count=12,tint=cyan) {
  return Array.from({length:count},(_,i)=>{
    const a=i*Math.PI*2/count;
    return {...r(x+Math.cos(a)*radius,z+Math.sin(a)*radius,.48,.12,.40,tint,y),angle:Math.PI/2-a};
  });
}

function antenna(x,z,y,color=gold) {
  return [cone(x,z,.45,1.85,pearl,y),t(x,z,.065,.065,1.1,color,y+1.25),d(x,z,.25,.25,.22,color,y+2.26)];
}

function saucer(x,z,y,size,color=pearl) {
  return [d(x,z,size,size*.83,.65,color,y),t(x,z,size*.95,size*.79,.26,ink,y+.08),
    d(x,z,size*.62,size*.53,.92,glass,y+.49),...ring(x,z,size*.51,y+.29,gold,.09),
    ...windows(x,z,size*.46,y+.34,10,cyan)];
}

function retroTower(style) {
  const nova=style==='novaTower',halo=style==='haloTower',hotel=style==='auroraHotel'||style==='orbitalPanorama',orbital=style==='orbitalPanorama';
  const h=orbital?8.9:nova?12.1:halo?9.8:hotel?10.6:9.4;
  const wall=orbital?'#759cae':nova?'#ad8cb9':halo?'#7ba6ac':hotel?'#a48aa8':'#7e9fc1';
  const x=nova?-.6:-1.25,z=-.68;
  const shell=[t(x,z,2.5,2.32,h,wall,.36),
    ...Array.from({length:Math.floor(h)},(_,i)=>[
      t(x,z,2.67,2.46,.19,i%3===1?gold:glass,1.01+i*.91),
      ...windows(x,z,1.27,1.26+i*.91,8,i%2?cyan:'#9fbce2')]).flat(),
    ...pair.map(side=>beam([x+side*1.18,.65,z],[x+side*.85,h+.3,z],.23,pearl)),
    t(x,z,3.05,2.89,.25,pearl,h+.22)];
  const crown=halo?[
    ...saucer(x,z,h+.38,4.1,'#b4c7bf'),...ring(x,z,2.46,h+1.42,cyan,.14,.39),
    ...antenna(x,z,h+1.85),
  ]:nova?[
    cone(x,z,3.1,3.4,pearl,h+.45),...ring(x,z,2.5,h+.86,pink,.20,.65),
    ...ring(x,z,2.51,h+.98,gold,.075,.65),...antenna(x,z,h+3.15,pink),
  ]:hotel?[
    ...saucer(x,z,h+.40,orbital?5.22:4.65,orbital?'#c6d6da':'#e5c5d8'),...antenna(x,z,h+1.7),
    ...(orbital?ring(x,z,2.95,h+1.23,cyan,.14,.53):[]),
    ...worldSign('bed',x,h+.69,z+1.85,'#816a9c'),
  ]:[
    cone(x,z,2.93,2.95,cyan,h+.45),...ring(x,z,2.4,h+.49,gold,.15,-.37),
    ...pair.map(side=>cone(x+side*1.38,z,.69,2.4,pearl,h-.4)),
  ];
  const annex=halo?[
    t(2.48,.12,2.13,2.13,5.96,wall,.35),...saucer(2.48,.12,6.12,3.1,'#c4d2c4'),
    ...ring(2.48,.12,1.91,7.17,cyan,.12,.32),
  ]:[t(2.5,.38,2.28,2.07,4.34,wall,.36),d(2.5,.38,2.42,2.19,.92,glass,4.68),
    ...windows(2.5,.38,1.14,3.12,9)];
  return [podium(),[...shell,...annex,r(.68,.02,3.65,1.14,.68,glass,4.0)],
    [...crown,r(0,2.23,4.0,1.36,.23,wall,1.88),r(0,2.83,1.32,.19,1.52,ink,.36),
      ...worldSign(hotel?'bed':'home',0,1.89,2.94,wall),
      ...pair.flatMap(side=>[t(side*3.53,2.81,.13,.13,1.67,pearl,.36),d(side*3.53,2.81,.42,.42,.28,cyan,1.96)])]];
}

function lunarArcade() {
  return [podium(),[
    r(0,-.79,6.42,4.59,2.74,'#8779ae',.35),...saucer(0,-.79,3.05,7.23,'#c8a3d1'),
    r(0,2.04,3.94,.46,1.73,ink,.36),
    ...pair.map(side=>r(side*2.44,1.63,.63,.33,2.41,cyan,.49)),
  ],[
    ...antenna(0,-.79,4.25,pink),...worldSign('arcade',0,2.73,2.17,'#786099'),
    ...pair.flatMap(side=>[t(side*3.62,2.74,.81,.79,.27,ink,.35),d(side*3.62,2.74,.73,.71,.6,pink,.61)]),
    ...[-1.27,-.43,.43,1.27].map((x,i)=>r(x,2.14,.56,.19,.08,[gold,cyan,pink,pearl][i],.43)),
  ]];
}

function lunarGarden() {
  const mushrooms=[[-2.9,-1.9,2.2],[2.63,-1.75,2.65],[-2.24,2.02,1.19],[2.43,2.12,1.31]];
  return [podium(),[
    t(0,0,6.22,6.22,.19,'#6e8b95',.35),t(0,0,3.31,3.31,.11,'#8bc3c4',.55),
    ...mushrooms.flatMap(([x,z,h],i)=>[t(x,z,.40,.40,h,'#b0c8bb',.36),
      d(x,z,1.66,1.51,.64,i%2?pink:cyan,h+.31),t(x,z,1.71,1.55,.09,gold,h+.34),
      ...[-.37,.31].map(dx=>d(x+dx,z+.32,.22,.22,.15,pearl,h+.69))]),
  ],[
    r(-1.98,2.18,1.67,.58,.16,'#819cb5',.64),r(-1.98,1.91,1.67,.12,.48,'#a7b8cc',.83),
    ...ring(0,0,1.83,1.30,cyan,.11),...pair.map(side=>beam([side*1.48,.59,0],[0,2.67,0],.09,pearl)),
    d(0,0,.81,.81,.83,pink,2.36),...worldSign('leaf',0,1.48,3.74,'#6e879d'),
  ]];
}

function scienceSpire(style) {
  const water=style==='waterSpire',ice=style==='iceVault',radio=style==='signalSpire'||style==='satelliteHub';
  const laboratory=style==='quantumLab';
  const wall=water?'#91b8ca':ice?'#a8afd3':radio?'#ac9bbd':'#a2adb9';
  const h=radio?6.8:laboratory?5.7:4.4;
  return [podium(),[
    t(-1.5,-.8,2.38,2.38,h,wall,.35),
    ...saucer(-1.5,-.8,h+.38,laboratory?4.28:3.84,pearl),
    ...pair.flatMap(side=>[t(1.99,side*1.51,1.49,1.49,2.61,glass,.36),d(1.99,side*1.51,1.58,1.58,1.28,ice?'#badfe8':cyan,2.93)]),
    r(.40,.09,2.81,.92,.47,glass,2.53),
  ],[
    ...(style==='satelliteHub'?[
      ...pair.flatMap(side=>[beam([-1.5,h+.7,-.8],[-1.5+side*1.51,h+2.4,-.8],.16,pearl),
        d(-1.5+side*1.51,-.8,1.89,1.55,.37,cyan,h+2.3),t(-1.5+side*1.51,-.8,.075,.075,.72,gold,h+2.61)]),
    ]:radio?[...ring(-1.5,-.8,2.50,h+1.27,gold,.13,.74),...antenna(-1.5,-.8,h+1.54,pink)]
      :[...ring(-1.5,-.8,2.32,h+1.26,cyan,.14),cone(-1.5,-.8,1.31,1.84,ice?'#c7ebef':pink,h+1.61)]),
    ...worldSign(water?'drop':ice?'snow':radio?'radio':'flask',-.9,2.04,2.21,'#6f82a6'),
    ...[-2.7,-1.3,.1].map((x,i)=>d(x,2.86,.68,.68,.53,[pink,cyan,gold][i],.36)),
  ]];
}

function capsuleHotel() {
  const pods=[[-2.54,-.9,5.2,'#b994b7'],[2.52,-.74,6.4,'#86b6bf'],[0,1.77,3.8,'#b7abd0']];
  return [podium(10.5,9.4),[
    ...pods.flatMap(([x,z,h,color])=>[t(x,z,.67,.67,h-1.05,pearl,.35),
      {...cone(x,z,2.45,1.05,ink,h-1.05),inverted:true},t(x,z,2.48,2.18,1.12,color,h-.35),
      d(x,z,2.51,2.21,1.52,color,h+.75),...windows(x,z,1.24,h+.13,10)]),
    r(0,-.83,4.26,.83,.63,glass,4.15),r(0,.55,.81,3.18,.58,glass,3.30),
  ],[
    ...pods.flatMap(([x,z,h])=>ring(x,z,1.67,h+.60,gold,.10,.12)),
    ...antenna(2.52,-.74,8.51,pink),...worldSign('bed',0,2.44,2.99,'#87729e'),
    r(0,3.10,2.48,1.01,.28,'#999dbb',.35),r(0,2.68,1.91,1.09,.29,'#c9bfd2',.59),
    ...pair.map(side=>d(side*3.8,2.79,.77,.77,.49,cyan,.36)),
  ]];
}

// Each addition belongs to a named building. No random geometry changes on reload.
export function lunarArchitecture(style,stages,index) {
  if (['prismTower','novaTower','haloTower','auroraHotel'].includes(style)) return retroTower(style==='auroraHotel'&&index===41?'orbitalPanorama':style);
  if (style==='moonHotel') return capsuleHotel();
  if (style==='lunarArcade') return lunarArcade();
  if (style==='moonGarden'||style==='gravityPark') return lunarGarden();
  if (['waterSpire','iceVault','signalSpire','satelliteHub','quantumLab'].includes(style)) return scienceSpire(style);
  const extra=[];
  if (style==='habitat'||style==='ringHabitat'||style==='moonHotel') {
    const hotel=style==='moonHotel';
    extra.push(...ring(0,-.71,hotel?2.81:2.43,hotel?4.18:3.35,gold,.12,hotel?.35:.0),
      ...antenna(0,-.72,hotel?3.8:2.95,hotel?pink:cyan),
      ...pair.map(side=>d(side*3.23,2.73,.68,.68,.53,pink,.39)));
  } else if (['oxygen','refinery','generator'].includes(style)) {
    const power=style==='generator';
    extra.push(...ring(power?1.79:-1.55,power?.1:-.7,2.29,4.43,power?cyan:pink,.16,power?.77:.38),
      cone(power?1.79:-1.55,power?.1:-.7,.81,1.56,gold,4.29));
    if (style==='refinery') extra.push(...[-1,0,1].map((v,i)=>cone(v*1.37,2.59,.77,1.07+i*.29,['#b8b6e0','#c0d9d0','#e1b8cf'][i],.35)));
  } else if (['craterLab','supplyDepot','cargoDepot'].includes(style)) {
    extra.push(...saucer(style==='cargoDepot'?-.6:-1.31,-1.02,4.03,3.76,'#d4c6de'),
      ...antenna(-1.31,-1.02,5.18));
  } else if (['moonWorkshop','moonCargo','roverGarage','hangar'].includes(style)) {
    const garage=style==='roverGarage'||style==='hangar';
    extra.push(...ring(-2.68,-1.62,1.99,garage?5.27:6.49,cyan,.15,.26),
      cone(-2.68,-1.62,.57,1.45,pink,garage?5.49:6.79));
    if (style==='hangar') extra.push(...parkedVehicle('rover','#d6ac8c',{x:-3.15,y:.37,z:2.86,yaw:.22}));
  } else if (['biodome','solarGarden','solarObservatory'].includes(style)) {
    extra.push(...antenna(0,-2.7,style==='biodome'?3.18:1.77,cyan),
      ...ring(0,-1.45,2.53,style==='biodome'?3.35:2.66,pink,.12,.61));
  } else if (style==='telescope'||style==='telescopeArray'||style==='lunarRadio') {
    extra.push(...ring(0,-.73,2.28,4.82,cyan,.12,.83),
      ...pair.map(side=>cone(side*3.24,2.4,.47,1.75,gold,.36)));
  } else if (style==='spaceField') {
    extra.push(...pair.map(side=>cone(side*4.37,-3.88,.45,1.12,cyan,3.13)));
  } else if (style==='moonBurger') {
    // A Saturn-like burger sign, complete with an onion-ring orbit.
    extra.push(...ring(0,-.94,2.28,5.89,gold,.12,.62));
  } else if (style==='cosmicIce') {
    extra.push(...ring(0,-1.0,1.98,5.39,cyan,.13,-.55));
  } else if (style==='dustCafe') {
    extra.push(...saucer(-.28,-1.08,3.49,3.03,'#d5b8ca'));
  } else if (style==='hoverDealer') {
    extra.push(...antenna(-3.20,-2.3,3.9,pink),...ring(-3.20,-2.3,1.12,5.0,cyan,.11,.37));
  } else if (style==='rocketPort'||style==='orbitalPort'||style==='cometPort') {
    extra.push(...pair.map(side=>cone(side*3.70,-2.39,.46,1.67,cyan,.35)));
  } else if (style==='monorailStation') {
    extra.push(...ring(-2.82,-1.16,1.59,4.41,gold,.13,.47),...antenna(-2.82,-1.16,4.19));
  }
  if (index===23) extra.push(...ring(-.63,-.29,3.2,.55,pink,.15),...antenna(-3.82,-2.53,2.2,cyan));
  if (index===40) extra.push(...pair.map(side=>cone(side*2.8,2.4,1.07,2.25,side<0?pink:cyan,.36)));
  if (index===42) extra.push(...ring(2.92,-.77,1.82,2.68,cyan,.12,.52),cone(2.92,-.77,1.58,2.07,'#b7e5e4',2.21));
  if (index===43) extra.push(...pair.flatMap(side=>[t(side*2.3,.12,.18,.18,2.29,'#9eb98e',.34),
    d(side*2.3,.12,1.09,1.09,.86,side<0?'#c5d98c':'#e5b79b',2.43)]));
  return extra.length?[stages[0],stages[1],[...stages[2],...extra]]:stages;
}
