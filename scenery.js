import {roadworkAge,walkingClock} from './scene-motion.js';
import {regionSurface,regionVisibility,roadElevation,regionalFootprint,regionalPoint,riverAt,residenceDrive} from './regions.js';
import {STREET_TURN_RADIUS} from './street-grid.js';
import {randomGenerator} from './worlds.js';
import {destinationRoutes,joinStreetPaths,roadProjections,streetNetwork} from './street-network.js';

export const box = (x,z,w,d,h,color,y=0,studs=0) => ({shape:'box',x,y,z,w,d,h,color,studs});
export const tube = (x,z,w,d,h,color,y=0,axis='y') => ({shape:'tube',x,y,z,w,d,h,color,axis});
export const roof = (x,z,w,d,h,color,y) => ({shape:'roof',x,y,z,w,d,h,color});
export const rounded = (x,z,w,d,h,color,y=0) => ({shape:'rounded',x,y,z,w,d,h,color});
export const dome = (x,z,w,d,h,color,y=0,angle=0) => ({shape:'dome',x,y,z,w,d,h,color,angle});
export const at = (parts,x,y,z) => parts.map(part=>({...part,x:part.x+x,y:part.y+y,z:part.z+z}));
export const beam = (from,to,width,color) => ({
  shape:'beam',from,to,width,color,x:(from[0]+to[0])/2,z:(from[2]+to[2])/2,y:Math.min(from[1],to[1]),h:Math.abs(from[1]-to[1])+width,
});
export const MAX_ACTORS=54;

export function pointOnSite([a,b,d],{x,y,z,yaw=0}) {
  const c=Math.cos(yaw),s=Math.sin(yaw);
  return [x+a*c+d*s,y+b,z+d*c-a*s];
}

export function placeParts(parts,site) {
  const point=local=>pointOnSite(local,site);
  return parts.map(part=>{
    const [px,py,pz]=point([part.x,part.y,part.z]);
    const placed={...part,x:px,y:py,z:pz,angle:(part.angle??0)-(site.yaw??0)};
    if (part.shape==='beam') {
      placed.from=point(part.from); placed.to=point(part.to);
    } else if (part.outline) {
      placed.outline=part.outline.map(point);
    }
    return placed;
  });
}

// Front-facing plaques use a few simple painted shapes, at the same scale as the buildings.
// Sweep one ridge from portal to portal, following the grade and turns of the track.
export function tunnelLandform(path,layout,{width=1.25,height=2.05}={}) {
  const moon=layout.theme==='moon';
  const rock=moon?['#9a96ae','#a5a0b6','#9290a8']:['#95a379','#a7ae81','#8e9c73'];
  const stone=moon?'#c1b9cb':'#d5c4a8',shadow=moon?'#414356':'#42494b';
  const arch=[[-width,0],[-width,height*.64],[-width*.73,height*.9],[0,height],
    [width*.73,height*.9],[width,height*.64],[width,0]];
  const rings=path.map(([x,y,z],i)=>{
    const [ax,,az]=path[Math.max(0,i-1)],[bx,,bz]=path[Math.min(path.length-1,i+1)];
    const span=Math.hypot(bx-ax,bz-az)||1;
    const nx=(bz-az)/span,nz=(ax-bx)/span;
    const ridge=Math.sin(Math.PI*i/(path.length-1));
    const point=([u,v])=>[x+nx*u,y+v,z+nz*u];
    const inner=arch.map(point);
    const outer=arch.map(([u,v])=>point([u*(1.26+.19*ridge),v+.29+.59*ridge]));
    const skirt=[-1,1].map(side=>{
      const [a,,b]=point([side*width*(2.12+.65*ridge),0]);
      return [a,regionSurface(layout,a,b).y-.15,b];
    });
    return {inner,outer,skirt};
  });
  const surface=(outline,color)=>{
    const [x,y,z]=outline[0];
    return {shape:'terrain',outline,x,y,z,h:0,color};
  };
  const parts=[];
  for (let i=1;i<rings.length;i++) {
    const a=rings[i-1],b=rings[i];
    for (let j=1;j<arch.length;j++) {
      parts.push(surface([a.outer[j-1],b.outer[j-1],b.outer[j],a.outer[j]],rock[j%3]),
        surface([a.inner[j],b.inner[j],b.inner[j-1],a.inner[j-1]],shadow));
    }
    parts.push(surface([a.skirt[0],b.skirt[0],b.outer[0],a.outer[0]],rock[0]),
      surface([a.outer.at(-1),b.outer.at(-1),b.skirt[1],a.skirt[1]],rock[0]));
  }
  for (const [index,ring] of [[0,rings[0]],[1,rings.at(-1)]]) {
    for (let j=1;j<arch.length;j++) {
      const face=[ring.inner[j-1],ring.outer[j-1],ring.outer[j],ring.inner[j]];
      parts.push(beam(ring.inner[j-1],ring.inner[j],.24,stone),
        surface(index?face.reverse():face,stone));
    }
    for (const [side,j] of [[0,0],[1,arch.length-1]]) {
      const edge=[ring.inner[j],ring.outer[j],ring.skirt[side]];
      parts.push(surface((index===side)?edge:edge.reverse(),rock[2]));
    }
  }
  return parts;
}

const cream='#fff2cc', blue='#b4e5ed', apricot='#f5ad6c', rose='#ff9db1', mint='#96dfbc', ink='#324857';
const marks = {
  bread:[['oval',0,0,1.02,.66,apricot],['line',-.23,0,.1,.35,cream],['line',.04,.015,.1,.35,cream],['line',.31,-.01,.09,.28,cream]],
  book:[['line',-.27,0,.48,.66,cream],['line',.27,0,.48,.66,blue],['line',0,0,.07,.65,ink]],
  wind:[['line',0,0,1.05,.17,cream],['line',0,0,.17,1.05,cream],['oval',0,0,.29,.29,apricot]],
  bus:[['line',0,.04,.98,.69,cream],['line',0,.16,.73,.27,blue],['oval',-.29,-.32,.22,.22,ink],['oval',.29,-.32,.22,.22,ink]],
  arcade:[['line',0,-.14,1.02,.64,cream],['line',-.28,-.12,.26,.09,ink],['line',-.28,-.12,.09,.26,ink],
    ['oval',.24,-.19,.16,.16,rose],['oval',.37,-.03,.16,.16,apricot]],
  plane:[['poly',[[0,.55],[.11,.26],[.13,.07],[.5,-.14],[.49,-.26],[.12,-.16],[.08,-.36],[.23,-.47],[-.23,-.47],[-.08,-.36],[-.12,-.16],[-.49,-.26],[-.5,-.14],[-.13,.07],[-.11,.26]],cream]],
  camp:[['poly',[[-.55,-.35],[0,.53],[.55,-.35]],apricot],['poly',[[-.2,-.35],[0,.23],[.2,-.35]],ink]],
  log:[['oval',-.12,0,.76,.76,apricot],['oval',-.12,0,.48,.47,cream],['oval',-.12,0,.22,.22,apricot],['line',.38,0,.18,.52,apricot]],
  hover:[['poly',[[-.5,-.09],[-.24,.28],[.31,.27],[.52,-.07],[.38,-.29],[-.42,-.28]],cream],
    ['line',0,.14,.42,.14,blue],['line',-.33,-.38,.36,.07,rose],['line',.31,-.38,.29,.07,apricot]],
  ball:[['oval',0,0,.89,.89,cream],['oval',0,0,.3,.31,ink],['oval',.29,.21,.14,.14,ink],['oval',-.31,-.18,.14,.14,ink]],
  bed:[['line',0,-.19,1.05,.31,cream],['line',-.45,-.07,.15,.66,cream],['oval',-.23,.14,.32,.25,blue]],
  cross:[['line',0,0,.21,1.03,cream],['line',0,.18,.76,.21,cream]],
  leaf:[['oval',-.18,.14,.37,.61,mint],['oval',.22,.25,.4,.58,'#70caa3'],['line',0,-.23,.11,.63,cream]],
  basket:[['line',0,-.08,.91,.42,apricot],['line',0,.27,.49,.14,cream],['oval',-.22,-.41,.13,.13,cream],['oval',.22,-.41,.13,.13,cream]],
  flame:[['poly',[[-.43,-.28],[-.34,.14],[-.1,.57],[.08,.17],[.31,.4],[.43,-.14],[.22,-.42],[-.2,-.42]],apricot],['oval',.02,-.16,.34,.47,cream]],
  flag:[['line',-.36,0,.11,1.03,cream],['poly',[[-.3,.49],[.43,.36],[.26,-.01],[-.3,.08]],rose]],
  wave:[['poly',[[-.51,-.16],[-.18,.24],[.14,.02],[.49,.32],[.5,.03],[.14,-.24],[-.15,-.01],[-.5,-.38]],blue]],
  gear:[['oval',0,0,.74,.74,apricot],['line',0,0,1.05,.22,apricot],['line',0,0,.22,1.05,apricot],['oval',0,0,.3,.3,ink]],
  cup:[['line',-.13,-.14,.62,.55,cream],['oval',.27,-.05,.36,.31,apricot],['line',0,-.45,.93,.12,cream],['line',-.2,.38,.1,.23,blue]],
  music:[['line',.22,.11,.12,.76,cream],['line',.35,.43,.32,.14,cream],['oval',.02,-.28,.43,.34,rose]],
  rocket:[['poly',[[-.23,-.3],[-.2,.2],[0,.56],[.2,.2],[.23,-.3]],cream],['oval',0,.12,.21,.22,blue],['poly',[[-.13,-.3],[.14,-.3],[0,-.58]],apricot]],
  home:[['poly',[[-.48,-.42],[-.48,.06],[0,.49],[.48,.06],[.48,-.42]],cream],['line',.07,-.19,.26,.46,blue]],
  sun:[['oval',0,0,.67,.67,apricot],['line',0,0,1.06,.14,cream],['line',0,0,.14,1.06,cream],['oval',0,0,.64,.64,apricot]],
  wheel:[['oval',0,0,1.02,1.02,cream],['oval',0,0,.65,.65,ink],['line',0,0,.67,.12,blue],['line',0,0,.13,.67,blue]],
  drop:[['poly',[[0,.56],[.31,.14],[.44,-.14],[.28,-.42],[-.28,-.42],[-.44,-.14],[-.31,.14]],blue],['oval',-.13,-.11,.16,.22,cream]],
  flask:[['poly',[[-.44,-.43],[-.36,-.06],[-.14,.18],[-.14,.49],[.14,.49],[.14,.18],[.36,-.06],[.44,-.43]],cream],['line',0,-.22,.58,.21,mint]],
  scope:[['poly',[[-.47,-.16],[.31,.5],[.49,.25],[-.27,-.39]],blue],['line',0,-.29,.15,.43,cream]],
  radio:[['oval',0,.28,.23,.23,apricot],['poly',[[0,.21],[.35,-.45],[-.35,-.45]],cream],['line',0,-.29,.64,.12,ink]],
  battery:[['line',0,-.03,.91,.65,mint],['line',.52,-.03,.1,.22,cream],['line',-.21,-.03,.1,.42,ink],['line',.05,-.03,.1,.42,ink]],
  crate:[['line',0,0,.86,.72,apricot],['line',0,.13,.82,.1,cream],['line',0,-.14,.82,.1,cream],['line',.21,0,.1,.67,ink]],
  snow:[['line',0,0,1.08,.13,blue],['line',0,0,.13,1.06,blue],['oval',0,0,.36,.36,cream]],
  palm:[['line',0,-.22,.17,.66,apricot],['oval',-.23,.21,.51,.25,mint],['oval',.24,.21,.52,.25,mint],['oval',0,.38,.27,.41,mint]],
  board:[['oval',0,0,.38,1.07,cream],['line',0,0,.11,.75,rose]],
  fork:[['line',-.26,0,.13,.98,cream],['line',-.26,.24,.4,.12,cream],['oval',.27,.26,.34,.49,apricot],['line',.27,-.22,.13,.51,apricot]],
  boat:[['poly',[[-.48,-.16],[.48,-.16],[.29,-.45],[-.25,-.45]],apricot],['poly',[[0,.55],[0,-.03],[-.4,-.03]],cream],['poly',[[.08,.4],[.42,-.03],[.08,-.03]],blue]],
  fruit:[['oval',0,-.09,.78,.73,apricot],['oval',.15,.42,.43,.25,mint]],
};

function plaquePart([kind,...data],x,y,z,size,depth) {
  if (kind==='poly') {
    const [points,color]=data;
    return {shape:'plate',x,y,z,w:size,d:.01,h:size,color,
      profile:points.map(([a,b])=>[a*size,b*size])};
  }
  const [dx,dy,w,h,color]=data;
  return (kind==='oval' ? tube : rounded)(x+dx*size,z,w*size,depth,h*size,color,y+(dy-h/2)*size,'z');
}

export function worldSign(mark,x,y,z,accent) {
  if (mark==='ice') {
    // A waffle cone and two scoops are legible even at the default camera angle.
    const face=z+.16;
    const cone={shape:'plate',x,y:y-.13,z:face,w:1.08,d:.01,h:.94,color:'#dba063',
      profile:[[-.54,.48],[.54,.48],[.02,-.48]]};
    return [rounded(x,z,1.67,.31,2.12,'#754762',y-1.05),cone,
      tube(x-.19,face+.033,.91,.13,.8,'#ffd5ac',y+.12,'z'),
      tube(x+.21,face+.035,.86,.13,.78,'#f3a5be',y+.1,'z'),
      tube(x+.01,face+.047,.7,.12,.66,'#fff0d2',y+.54,'z'),
      ...[-.22,.12].map((dx,i)=>rounded(x+dx,face+.08,.075,.04,.24,'#a9774f',y-.21-i*.07))];
  }
  return [rounded(x,z,1.68,.25,1.56,'#f6e4b9',y-.78),rounded(x,z+.15,1.49,.13,1.36,accent,y-.68),
    ...marks[mark].map((shape,i)=>plaquePart(shape,x,y,z+.235+i*.012,1.03,.048))];
}

const wheel = (x,z,diameter,y) => [
  tube(x,z,.27,diameter,diameter,'#38414f',y,'x'),
  tube(x+Math.sign(x)*.145,z,.105,diameter*.52,diameter*.52,'#d6d1c5',y+diameter*.24,'x'),
];

export function vehicle(kind,color) {
  if (kind==='rover-bus') {
    return [...[-.61,.61].flatMap(x=>[-1.10,0,1.10].flatMap(z=>wheel(x,z,.61,0))),
      rounded(0,0,1.27,3.32,.43,color,.43),rounded(0,.03,1.15,3.02,.83,'#c6d7de',.83),
      ...[-1,1].flatMap(side=>[-.88,-.30,.28,.86].map(z=>rounded(side*.574,z,.065,.43,.47,'#538f9f',1.01))),
      rounded(0,1.56,.96,.12,.57,'#5c99ad',.94),dome(0,.1,1.21,3.04,.31,'#bdd7d9',1.64),
      ...[-1,1].map(side=>rounded(side*.4,1.68,.22,.10,.19,'#ffe5a5',.64)),
      tube(0,-1.29,.09,.09,.46,'#7b88b2',1.75),dome(0,-1.29,.32,.32,.16,'#e7c574',2.15),
      rounded(0,1.65,.63,.05,.16,'#e5ba74',1.55),
      ...at(visitor('alien','#8d77aa',undefined,true,.42,1),.02,1.04,1.03)];
  }
  if (kind==='hover') {
    return [rounded(0,0,1.17,2.34,.34,color,.18),rounded(0,.7,.99,.86,.19,color,.46),rounded(0,-.27,.68,.77,.17,ink,.5),
      ...[-1,1].map(s=>box(s*.47,-.11,.13,1.56,.098,cream,.49)),
      box(0,.45,.84,.13,.37,'#8ed0d9',.51),box(0,-.44,.65,.26,.38,ink,.47),
      ...[-1,1].flatMap(s=>[tube(s*.36,-1.02,.38,.57,.38,'#acadc2',.25,'z'),
        tube(s*.36,-1.34,.26,.095,.27,'#85d7d9',.31,'z'),rounded(s*.34,.91,.2,.1,.12,cream,.42)])];
  }
  if (kind==='bus') {
    return [...[-.57,.57].flatMap(x=>[-1.03,1.03].flatMap(z=>wheel(x,z,.48,0))),
      rounded(0,0,1.29,3.28,1.04,color,.31),rounded(0,-.01,1.2,3.17,.18,'#f0ce8d',1.25),
      ...[-1,1].flatMap(s=>[box(s*.642,-.06,.065,2.95,.18,'#e8d8a9',.56),
        ...[-1.03,-.49,.05,.59,1.13].map(z=>rounded(s*.645,z,.051,.45,.36,'#87bcc5',.86)),
        rounded(s*.41,1.64,.24,.1,.16,'#fff0bb',.48)]),
      rounded(0,1.644,.98,.092,.43,'#517a8a',.82),
      box(0,1.676,.54,.061,.11,'#edbf75',1.229),
      box(0,-1.655,.93,.081,.12,'#b65e70',.48)];
  }
  if (kind==='motorcycle'||kind==='moon-trike') {
    const trike=kind==='moon-trike';
    const rear=trike?[-.44,.44]:[0];
    return [
      ...rear.flatMap(x=>wheel(x,-.55,trike?.53:.48,0)),...wheel(0,.68,trike?.56:.48,0),
      ...rear.map(x=>beam([x,.31,-.54],[0,.53,.17],.106,'#53616f')),
      beam([0,.29,.71],[0,.91,.39],.115,'#9ba6ae'),
      rounded(0,.14,trike?.59:.35,.65,.37,color,.42),
      rounded(0,-.42,trike?.85:.33,.62,.12,'#424d61',.69),
      tube(0,.57,.22,.12,.21,'#fff0b3',.71,'z'),
      beam([-.34,.94,.43],[.34,.94,.43],.085,'#727f8f'),
      ...at(visitor(trike?'astronaut':'human',trike?'#b3becd':'#64778e',undefined,true,.51,trike?1:3),0,.74,-.27),
      ...(trike?rear.map(x=>rounded(x,-.61,.42,.59,.19,color,.53))
        :[dome(0,-.285,.35,.35,.23,color,1.25)]),
    ];
  }
  if (kind==='delivery') {
    return [...[-.54,.54].flatMap(x=>[-.98,.86].flatMap(z=>wheel(x,z,.48,0))),
      rounded(0,.74,1.14,1.2,.84,color,.32),rounded(0,-.48,1.27,1.78,1.29,'#f0e4cd',.35),
      box(0,1.338,.85,.058,.31,'#7cabb9',.81),rounded(0,-1.36,.91,.07,.89,'#b2b4ab',.48),
      ...[-1,1].flatMap(side=>[box(side*.641,-.54,.031,.84,.31,color,.86),
        rounded(side*.39,1.36,.23,.11,.14,'#ffdfa0',.49)])];
  }
  if (kind==='compact'||kind==='mini-rover') {
    const lunar=kind==='mini-rover';
    return [...[-.41,.41].flatMap(x=>[-.46,.46].flatMap(z=>wheel(x,z,lunar?.59:.43,0))),
      rounded(0,0,.93,1.54,.4,color,lunar?.39:.25),
      dome(0,-.09,.84,1.06,.45,lunar?'#91bcc9':'#9ac4ca',lunar?.74:.59),
      ...[-.29,.29].map(x=>rounded(x,.77,.14,.12,.12,'#ffe9a7',lunar?.58:.43)),
      ...(lunar?[tube(.29,-.46,.087,.087,.42,'#8c96b2',1.06),dome(.29,-.46,.25,.25,.19,color,1.41)]:[])];
  }
  if (kind==='pickup'||kind==='van') {
    const pickup=kind==='pickup';
    return [...[-.54,.54].flatMap(x=>[-.77,.77].flatMap(z=>wheel(x,z,.49,0))),
      rounded(0,0,1.23,2.4,.44,color,.28),
      rounded(0,pickup?.38:-.14,1.12,pickup?1.21:1.95,pickup?.54:.81,color,.68),
      rounded(0,.96,1.0,.092,.34,'#77b1bd',.78),
      ...[-1,1].flatMap(side=>[
        rounded(side*.554,.42,.055,.7,.36,'#8bc0c3',.8),
        rounded(side*.42,1.19,.22,.08,.15,'#fff0bf',.46),
        rounded(side*.42,-1.19,.22,.08,.15,'#c96962',.46),
        ...(pickup?[box(side*.52,-.67,.12,1.02,.24,color,.69)]:[box(side*.57,-.49,.06,.94,.19,'#e7ce86',.95)]),
      ]),
      ...(pickup?[dome(.21,-.66,.26,1.44,.17,'#e8bb72',.72,.1),dome(-.19,-.7,.27,1.56,.19,'#79c1b9',.72,-.12)]
        :[dome(0,-.4,.68,.88,.3,'#e5ab58',1.47),dome(.17,-.38,.26,.4,.1,'#8db178',1.75)])];
  }
  if (kind==='rover') {
    return [
      ...[-.67,.67].flatMap(x=>[-.86,0,.86].flatMap(z=>wheel(x,z,.71,0))),
      rounded(0,0,1.28,2.31,.39,'#b5b7cf',.43),
      rounded(0,-.35,1.08,1.15,.45,color,.78),
      rounded(0,.53,.89,.79,.48,'#e7e6dd',.76),
      box(0,.78,.65,.38,.18,'#52677e',1.14),
      ...[-.42,.42].map(x=>rounded(x,1.12,.21,.16,.17,'#fff3c1',.71)),
      tube(.3,-.66,.10,.1,.75,'#7c829d',1.12),
      dome(.3,-.66,.64,.57,.18,'#e4e3ef',1.8),
      box(-.31,-.61,.45,.6,.11,'#526582',1.15),
    ];
  }
  const cart=kind==='cart';
  return [
    ...[-.53,.53].flatMap(x=>[-.68,.68].flatMap(z=>wheel(x,z,.48,0))),
    rounded(0,0,1.19,2.02,.47,color,.28),
    rounded(0,-.18,.96,1.06,.49,cart?'#fee3a9':'#4a6c80',.72),
    rounded(0,-.21,.93,1.12,.13,cart?'#f5ce81':color,1.15),
    rounded(0,.37,.76,.12,.23,'#acdbe6',.81),
    ...[-.39,.39].flatMap(x=>[
      rounded(x,.99,.25,.13,.18,'#fff0b7',.49),rounded(x,-.99,.23,.12,.15,'#bb4c5c',.5),
    ]),
    rounded(0,1.02,.48,.13,.13,'#40535f',.36),
  ];
}

function walker(kind,coat,skin='#edb88c',variant=0) {
  const astronaut=kind==='astronaut', alien=kind==='alien';
  const shoes=astronaut?'#78879d':alien?'#529d83':'#46546c';
  const legs=[-.18,.18].map((x,i)=>({...rounded(x,.05,.29,.37,.61,shoes),stride:i===0?1:-1}));
  const body=rounded(0,0,alien?.52:.68,.43,.69,coat,.56);
  const arms=[-.4,.4].map((x,i)=>({...rounded(x,.02,.2,.29,.58,coat,.68),stride:i===0?-1:1}));
  if (astronaut) {
    const accent=['#dfa767','#83ccd3','#cc9fc9','#c9d78e'][variant%4];
    const helmet=['#f1e8d7','#c8d4e1','#e7c1ab','#d6c8e6'][variant%4];
    const visor=['#354f66','#88714d','#345b74','#675782'][variant%4];
    return [...legs,body,...arms,
      rounded(0,-.31,.62,.36,.72,'#c9cfe1',.62),dome(0,.015,.87,.76,.66,helmet,1.18),
      rounded(0,.31,.62,.26,.35,visor,1.37),rounded(-.12,.447,.24,.032,.076,'#c8eef0',1.57),
      rounded(0,.25,.38,.1,.21,accent,.95),rounded(.08,.31,.10,.04,.075,'#f7e5ae',1.02),
      ...[-1,1].map(side=>rounded(side*.34,.02,.13,.42,.14,accent,.93)),
      ...(variant%2?[tube(.29,-.31,.055,.055,.58,accent,1.13),dome(.29,-.31,.13,.13,.12,'#e4e98b',1.68)]:[]),
      ...(variant%4===2?[-1,1].map(side=>tube(side*.23,-.48,.21,.26,.58,'#7196b4',.68)):[])];
  }
  if (alien) {
    const colors=['#a8df91','#b4a3dc','#81cfd2','#e8bc90'];
    const hue=colors[variant%4],oneEye=variant%3===1;
    return [...legs,body,...arms,dome(0,.03,variant%2?.94:.85,.66,.65,hue,1.15),
      ...(variant%3===2?[-1,1].map(side=>dome(side*.47,.015,.39,.28,.2,hue,1.48))
        :[-.24,.24].flatMap(x=>[tube(x,.034,.065,.065,.36,hue,1.66),dome(x,.037,.23,.23,.2,hue,1.97)])),
      ...(oneEye?[tube(0,.34,.39,.13,.35,'#f7eed9',1.39,'z'),tube(0,.42,.17,.07,.19,'#394b54',1.46,'z')]
        :[-.18,.18].map(x=>tube(x,.34,.21,.11,.23,'#394b54',1.4,'z'))),
      rounded(0,.345,.20,.045,.045,'#576575',1.27)];
  }
  return [...legs,body,...arms,rounded(0,.03,.56,.55,.57,skin,1.18),
    dome(0,-.035,.67,.65,.27,'#80535a',1.67),
    ...[-.11,.11].map(x=>rounded(x,.31,.061,.039,.071,'#354756',1.46)),
    rounded(-.05,-.24,.47,.24,.53,'#d9a658',.69)];
}

export function visitor(kind,coat,skin,seated=false,scale=.83,variant=0) {
  const standing=walker(kind,coat,skin,variant);
  const model=seated
    ? [...standing.slice(2).map(part=>({...part,y:part.y-.53})),
      ...[-.17,.17].flatMap(x=>[rounded(x,.22,.25,.51,.2,'#5b687a',-.015),
        rounded(x,.43,.2,.23,.36,'#5b687a',-.3),rounded(x,.48,.22,.38,.14,'#425568',-.39)])]
    : standing;
  return model.map(part=>({...part,characterKind:kind,variant,x:part.x*scale,y:part.y*scale,z:part.z*scale,w:part.w*scale,d:part.d*scale,h:part.h*scale}));
}

export function parkedVehicle(kind,color,site) {
  const parking={kind,color,...site};
  return placeParts(vehicle(kind,color),site).map(part=>({...part,parking}));
}

function occupiedHovercar(passenger=false,color='#b982ac') {
  const exhaust=(x,radius,length,color)=>Array.from({length:8},(_,i)=>{
    const rim=index=>[x+radius*Math.cos(index*Math.PI/4),.425+radius*Math.sin(index*Math.PI/4),-1.38];
    return {shape:'terrain',outline:[rim(i+1),rim(i),[x,.425,-1.38-length]],
      x,y:.425-radius,z:-1.38,h:radius*2,color,life:[0,0,0,-1]};
  });
  return [
    ...vehicle('hover',color),
    ...[-.36,.36].flatMap(x=>[
      {...tube(x,-1.414,.28,.084,.27,'#f2aa6c',.29,'z'),life:[0,0,0,-1]},
      ...exhaust(x,.145,.78,'#ff985e'),...exhaust(x,.09,.53,'#fff0a8'),
    ]),
    ...at(visitor('astronaut','#e7e1d6',undefined,true,.46),-.23,.60,-.19),
    tube(-.23,.25,.21,.065,.21,'#465463',.84,'z'),
    ...(passenger?at(visitor('alien','#5aa69b',undefined,true,.43),.24,.58,-.27):[]),
  ];
}

function route(points, corner, exactStart=false) {
  const path=points.flatMap(([x,z],i)=>{
    if (i===0&&exactStart) return [[x,z]];
    const approach=points.at(i-1), exit=points[(i+1)%points.length];
    const inset=([px,pz])=>{
      const t=Math.min(.35,corner/Math.hypot(px-x,pz-z));
      return [x+(px-x)*t,z+(pz-z)*t];
    };
    const [ax,az]=inset(approach),[bx,bz]=inset(exit);
    return Array.from({length:6},(_,j)=>{
      const t=j/5,u=1-t;
      return [u*u*ax+2*u*t*x+t*t*bx,u*u*az+2*u*t*z+t*t*bz];
    });
  });
  let length=0;
  const segments=path.map(([x,z],i)=>{
    const [nextX,nextZ]=path[(i+1)%path.length];
    const dx=nextX-x,dz=nextZ-z;
    const distance=Math.hypot(dx,dz);
    const start=length;
    length+=distance;
    return {x,z,dx,dz,start,end:length,yaw:Math.atan2(dx,dz)};
  }).filter(segment=>segment.end-segment.start>.0001);
  return {segments,length};
}

export function actor(parts,points,{kind,ground,speed,phase=0,corner=.85,roads=[],roadRise=0,elevation,voice,exactStart=false}) {
  return {parts,kind,ground,speed,phase,roads,roadRise,elevation,voice,route:route(points,corner,exactStart)};
}

export function worldActors(theme) {
  if (theme==='city') return [
    actor(vehicle('car','#df9b65'),[[-16,0],[-16,11],[16,11],[16,0]],{kind:'road',ground:.126,speed:3.7,corner:1.15,roads:[0,11],roadRise:.153}),
    actor(walker('human','#ce7779'),[[-14.4,-20],[-13.75,-19],[-13.75,-2],[-14.4,-2]],{kind:'walk',ground:.061,speed:1.22,phase:.08}),
    actor(walker('human','#759ac1','#bf8b67'),[[6,1.5],[13.4,1.5],[14.1,2.6],[6,2.6]],{kind:'walk',ground:.022,speed:.97,phase:.4}),
  ];
  if (theme==='moon') return [
    actor(vehicle('rover','#d5b38e'),[[-15,-13],[-15,11],[15,11],[15,-13]],{kind:'road',ground:.085,speed:2.35,phase:.018,corner:1.25,roads:[-13,-.75,11],roadRise:.102}),
    actor(occupiedHovercar(),[[-15,-13],[-15,11],[15,11],[15,-13]],{kind:'hover',ground:.27,speed:3.15,phase:.47,corner:1.25,roads:[-13,-.75,11],roadRise:.102}),
    actor(walker('astronaut','#ebe9e0'),[[-18,-19],[-17.9,-9],[-18.9,-9],[-19,-19]],{kind:'walk',ground:.045,speed:.9,phase:.14}),
    actor(walker('alien','#79b88d'),[[8,-12],[14,-12],[14,-10.8],[8,-10.8]],{kind:'walk',ground:.047,speed:1.1,phase:.24}),
  ];
  const bird=[rounded(0,0,.44,.66,.22,'#f6e9da',.06),dome(0,.32,.33,.35,.26,'#fcf2de',.12),
    ...[-1,1].map(x=>dome(x*.39,-.05,.84,.28,.14,'#eadfd1',.13,x*.32)),rounded(0,.56,.15,.24,.09,'#e8ae70',.15)];
  return [
    actor(bird,[[-29,-12],[-14,-24],[15,-24],[27,-12],[22,11],[-19,16]],{kind:'bird',ground:5.1,speed:4.8,phase:.13,corner:8}),
    actor(walker('human','#78a9a6'),[[6,-10],[7.1,-10],[7.1,1],[6,1]],{kind:'walk',ground:.465,speed:1.2,phase:.38}),
  ];
}

export function districtActors(theme,lots) {
  const starter=lots[0];
  const {left,right,back,front}=starter;
  const adjacent=lots.slice(0,2);
  const west=Math.min(...adjacent.map(lot=>lot.left)), east=Math.max(...adjacent.map(lot=>lot.right));
  const north=Math.min(...adjacent.map(lot=>lot.back)), south=Math.max(...adjacent.map(lot=>lot.front));
  const circuit=[[west,north],[west,south],[east,south],[east,north]];
  const path=[[left+2,front-1.75],[right-2,front-1.75],[right-2,front-1.24],[left+2,front-1.24]];
  const side=[[right-1.95,back+2],[right-1.95,front-2],[right-1.26,front-2],[right-1.26,back+2]];
  if (theme==='city') return [
    actor(vehicle('car','#e2a072'),circuit,{kind:'road',ground:.102,speed:2.55,phase:.11,corner:1.15}),
    actor(walker('human','#ce7779'),path,{kind:'walk',ground:.039,speed:1.04,phase:.2}),
  ];
  if (theme==='moon') return [
    actor(vehicle('rover','#d5b38e'),circuit,{kind:'road',ground:.10,speed:2.25,phase:.19,corner:1.15}),
    actor(occupiedHovercar(true),circuit,{kind:'hover',ground:.27,speed:3.15,phase:.48,corner:1.15}),
    actor(walker('astronaut','#ebe9e0'),path,{kind:'walk',ground:.04,speed:.95,phase:.21}),
    actor(walker('alien','#79b88d'),side,{kind:'walk',ground:.04,speed:1.08,phase:.59}),
  ];
  const bird=[rounded(0,0,.44,.66,.22,'#f6e9da',.06),dome(0,.32,.33,.35,.26,'#fcf2de',.12),
    ...[-1,1].map(x=>dome(x*.39,-.05,.84,.28,.14,'#eadfd1',.13,x*.32)),rounded(0,.56,.15,.24,.09,'#e8ae70',.15)];
  return [
    actor(bird,[[west-3,north-4],[west-3,south+4],[east+3,south+4],[east+3,north-4]],{kind:'bird',ground:5.2,speed:4.1,corner:6}),
    actor(walker('human','#78a9a6'),path,{kind:'walk',ground:.465,speed:1.11,phase:.38}),
  ];
}

const engineKinds=new Set(['road','bus','hover','offroad-rover','jetski']);

export function actorPose(actor, seconds, distanceOverride) {
  if (actor.pose) return actor.pose(seconds);
  if (actor.kind==='wheel') {
    const {x,y,z,yaw}=actor;
    const roll=seconds*.39;
    return {x,y,z,cos:Math.cos(yaw),sin:Math.sin(yaw),stride:0,rollCos:Math.cos(roll),rollSin:Math.sin(roll),
      sound:Number(seconds%21>10&&seconds%21<12)*.63};
  }
  if (actor.kind==='plane'||actor.kind==='shuttle') return planePose(actor,seconds);
  if (actor.kind==='rocket'||actor.kind==='rocket-flame') return rocketPose(actor,seconds);
  const clock=walkingClock(seconds,actor.encounter);
  const traveled=distanceOverride??clock.time*actor.speed;
  let path=actor.route, at=traveled+(distanceOverride===undefined?path.length*actor.phase:0);
  if (actor.wander&&distanceOverride===undefined) {
    at%=actor.wander.length;
    for (const trail of actor.wander.paths) {
      path=trail;
      if (at<path.length) break;
      at-=path.length;
    }
  }
  const {segments,length}=path;
  let distance=at%length;
  if (distance<0) distance+=length;
  let low=0,high=segments.length-1;
  while (low<high) {
    const mid=(low+high)>>1;
    if (distance<segments[mid].end) high=mid;
    else low=mid+1;
  }
  const segment=segments[low];
  const t=(distance-segment.start)/(segment.end-segment.start);
  const x=segment.x+segment.dx*t,z=segment.z+segment.dz*t;
  let yaw=clock.thinking?Math.atan2(actor.encounter.x-x,actor.encounter.z-z):segment.yaw;
  if (actor.parking&&distance<actor.parking.reverseUntil) {
    const turn=Math.max(0,Math.min(1,(actor.parking.reverseUntil-distance)/2.1));
    yaw+=Math.PI*turn*turn*(3-2*turn);
  }
  const walking=actor.kind==='walk';
  const nearestRoad=Math.min(...actor.roads.map(row=>Math.abs(row-z)));
  const y=actor.kind==='coaster'?segment.y+segment.dy*t:
    actor.elevation?.(x,z)??(actor.ground+actor.roadRise*Math.max(0,1-Math.max(0,nearestRoad-.85)/.61));
  const pitch=actor.elevation&&engineKinds.has(actor.kind)
    ? Math.atan2(actor.elevation(x+Math.sin(yaw)*.7,z+Math.cos(yaw)*.7)
        -actor.elevation(x-Math.sin(yaw)*.7,z-Math.cos(yaw)*.7),1.4)
    : 0;
  const bob=actor.kind==='bird' ? Math.sin(traveled*.44)*.35
    : ['boat','swimmer','jetski'].includes(actor.kind) ? Math.sin(traveled*2.1)*.045
    : actor.kind==='hover' ? Math.sin(traveled*2.7)*.079
    : walking ? Math.abs(Math.sin(traveled*6))*.035 : 0;
  const cycle=seconds+actor.phase*11;
  const sound=engineKinds.has(actor.kind)?Number(cycle%9.5<3.35)
    :actor.kind==='coaster'?Number(segment.dy<-.1&&cycle%7.4<4.3)
    :actor.voice?Number(cycle%14.5<2.4)*.8:0;
  return {x,y:y+bob,z,cos:Math.cos(yaw),sin:Math.sin(yaw),stride:walking&&!clock.thinking?Math.sin(traveled*6)*.17:0,rollCos:1,rollSin:0,pitch,sound,thought:Number(clock.thinking),thrust:Number(actor.kind==='hover')};
}

const streetKinds=new Set(['road','bus','hover','offroad-rover','jetski']);

function vehicleFootprint(actor) {
  switch (actor.vehicleModel) {
    case 'motorcycle': return [1.02,.36];
    case 'moon-trike': return [1.04,.63];
    case 'compact': return [.85,.54];
    case 'mini-rover': return [.93,.61];
    case 'delivery': return [1.53,.68];
    case 'cart': return [1.13,.64];
  }
  return actor.kind==='bus'?[1.83,.76]:actor.kind==='jetski'?[.69,.34]:[1.31,.74];
}

function overlaps(a,b) {
  const dx=b.pose.x-a.pose.x,dz=b.pose.z-a.pose.z;
  if (Math.abs(dx)>4||Math.abs(dz)>4||Math.abs(a.pose.y-b.pose.y)>1.7) return false;
  const {sin:as,cos:ac}=a.pose,{sin:bs,cos:bc}=b.pose;
  const [al,aw]=a.size,[bl,bw]=b.size;
  const parallel=Math.abs(as*bs+ac*bc),cross=Math.abs(as*bc-ac*bs);
  return Math.abs(dx*as+dz*ac)<al+bl*parallel+bw*cross
    &&Math.abs(dx*ac-dz*as)<aw+bl*cross+bw*parallel
    &&Math.abs(dx*bs+dz*bc)<bl+al*parallel+aw*cross
    &&Math.abs(dx*bc-dz*bs)<bw+al*cross+aw*parallel;
}

function followsTooClosely(a,b) {
  const {x,z,sin,cos,y}=a.pose;
  const dx=b.pose.x-x,dz=b.pose.z-z;
  const ahead=dx*sin+dz*cos,across=dx*cos-dz*sin;
  return ahead>0&&ahead<a.size[0]+b.size[0]+.76&&Math.abs(across)<1.12&&Math.abs(y-b.pose.y)<1.7
    &&sin*b.pose.sin+cos*b.pose.cos>.72;
}

function transferDistance(route,pose) {
  for (const segment of route.segments) {
    if (Math.abs(segment.yaw-pose.yaw)>1e-6&&Math.cos(segment.yaw-pose.yaw)<.99998) continue;
    const dx=pose.x-segment.x,dz=pose.z-segment.z;
    const advance=dx*Math.sin(segment.yaw)+dz*Math.cos(segment.yaw);
    if (advance<.15||advance>segment.end-segment.start-.15) continue;
    if (Math.abs(dx*Math.cos(segment.yaw)-dz*Math.sin(segment.yaw))<.085) return segment.start+advance;
  }
  return null;
}

function waitingCycleVehicles(vehicles) {
  const checked=new Set(),cycles=[];
  for (const start of vehicles) {
    const path=[];
    let next=start;
    while (next?.wait>1.15&&!checked.has(next)) {
      const repeated=path.indexOf(next);
      if (repeated>=0) {
        cycles.push(...path.slice(repeated));
        break;
      }
      path.push(next);
      next=next.blocker;
    }
    for (const vehicle of path) checked.add(vehicle);
  }
  return cycles;
}

function passingPose(vehicle,pass,elapsed,seconds) {
  const launch=Math.min(elapsed,pass.hover?.29:0);
  const distance=pass.start+pass.cruise*launch+pass.speed*(elapsed-launch);
  const pose=actorPose(vehicle.actor,seconds,distance);
  const smooth=t=>{ const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u); };
  const enter=smooth(elapsed/.29),exit=smooth((pass.duration-elapsed)/.31);
  const across=enter*exit*(pass.hover?1.01:1.75);
  const roll=pass.hover?(exit-enter)*enter*exit*.36:0;
  return {distance,pose:{...pose,x:pose.x+pose.cos*across,z:pose.z-pose.sin*across,
    y:pose.y+enter*exit*(pass.hover?2.15:0),rollCos:Math.cos(roll),rollSin:Math.sin(roll),
    sound:.64,thrust:Number(pass.hover)}};
}

export function createTraffic(actors,junctions=[],obstacles=[],roadworks=[]) {
  const crossings=new Map();
  const cell=8;
  for (const point of junctions) {
    if (point.arms&&point.arms.length<3) continue;
    const column=Math.floor(point.x/cell),row=Math.floor(point.z/cell);
    for (let x=column-1;x<=column+1;x++) for (let z=row-1;z<=row+1;z++) {
      const id=`${x}:${z}`;
      if (!crossings.has(id)) crossings.set(id,[]);
      crossings.get(id).push(point);
    }
  }
  const junctionAt=(vehicle,pose)=>{
    if (!['road','bus','hover'].includes(vehicle.actor.kind)) return null;
    const id=`${Math.floor(pose.x/cell)}:${Math.floor(pose.z/cell)}`;
    return crossings.get(id)?.find(point=>(pose.x-point.x)**2+(pose.z-point.z)**2<vehicle.crossingReach)??null;
  };
  const vehicles=[];
  let closures=[];
  const roadworkBlocker=(vehicle,pose)=>{
    if (!closures.length||!['road','bus','hover'].includes(vehicle.actor.kind)) return null;
    return closures.find(site=>{
      const contains=position=>{
        const dx=position.x-site.x,dz=position.z-site.z;
        return Math.abs(dx*site.dx+dz*site.dz)<1.45+vehicle.size[0]
          &&Math.abs(dx*site.dz-dz*site.dx)<1.4&&Math.abs(position.y-site.y)<1.45;
      };
      // Vehicles already in the work area can leave before the lane closes.
      return contains(pose)&&!contains(vehicle.pose);
    });
  };
  const physicalBlocker=(vehicle,pose)=>vehicles.find(other=>other!==vehicle&&overlaps({size:vehicle.size,pose},other));
  const laneBlocker=(vehicle,pose)=>vehicles.find(other=>other!==vehicle&&(
    overlaps({size:vehicle.size,pose},other)||followsTooClosely({size:vehicle.size,pose},other)));
  const intersectionOwner=(vehicle,zone)=>zone&&vehicles.find(other=>other!==vehicle&&other.zone===zone
    &&other.yielding?.other!==vehicle);
  const atBay=vehicle=>vehicle.distance<=vehicle.nextPark-vehicle.actor.route.length+.0001;
  function drivewayClear(vehicle,distance,seconds) {
    const {actor,size}=vehicle;
    const {entry,reach}=actor.parking.merge;
    const duration=reach/actor.speed;
    const nearby=vehicles.filter(other=>other!==vehicle&&Math.hypot(other.pose.x-entry.x,other.pose.z-entry.z)<11+other.actor.speed*duration);
    for (let t=0;t<=duration+.16;t+=.16) {
      const pose=actorPose(actor,seconds+t,distance+Math.min(reach,actor.speed*t));
      const leaving={size,pose};
      if (roadworkBlocker(vehicle,pose)||intersectionOwner(vehicle,junctionAt(vehicle,pose))) return false;
      const atGate=Math.hypot(pose.x-entry.x,pose.z-entry.z)<3.2;
      for (const other of nearby) {
        const waiting=other.holdUntil>seconds+t||other.blocker||other.workWait>0;
        const next=other.pass?passingPose(other,other.pass,Math.min(other.pass.duration,other.pass.elapsed+t),seconds+t).pose
          :waiting?other.pose:actorPose(other.actor,seconds+t,other.distance+other.actor.speed*t);
        const approaching={size:other.size,pose:next};
        const passingGate=atGate&&Math.abs(pose.y-next.y)<1.6&&Math.hypot(next.x-entry.x,next.z-entry.z)<other.size[0]+.98;
        if (passingGate||overlaps(leaving,other)||overlaps(leaving,approaching)||followsTooClosely(leaving,approaching)
          ||followsTooClosely(approaching,leaving)) return false;
      }
    }
    return true;
  }
  function planPass(vehicle,blocker,seconds) {
    const {actor,pose,size}=vehicle;
    const hover=actor.kind==='hover';
    if (!blocker||actor.parking||vehicle.zone||blocker.zone&&!hover||seconds<(vehicle.nextPass??0)
      ||!['road','hover'].includes(actor.kind)||!['road','bus','hover'].includes(blocker.actor.kind)
      ||actor.speed-blocker.actor.speed<.54
      ||vehicles.some(other=>other.pass)) return null;
    const near={...pose,x:pose.x+pose.sin*.38,z:pose.z+pose.cos*.38};
    if (!followsTooClosely({size,pose:near},blocker)) return null;
    // Surface cars need a marked, two-way road. Hovercars can lift a little
    // above their own lane without occupying the whole opposing lane.
    if (!hover&&!actor.alternatives?.length) return null;
    vehicle.nextPass=seconds+.26;
    const gap=Math.hypot(pose.x-blocker.pose.x,pose.z-blocker.pose.z);
    const clearance=size[0]+blocker.size[0]+1.15;
    const speed=Math.max(actor.speed+1.3,blocker.actor.speed+(hover?6.4:3.5));
    const cruise=blocker.actor.speed;
    const duration=(gap+clearance)/(speed-cruise)+(hover?.45:0);
    const pass={start:vehicle.distance,speed,cruise,duration,hover,elapsed:0};
    const samples=Math.ceil(duration*32);
    for (let i=0;i<=samples;i++) {
      const t=duration*i/samples;
      const next=passingPose(vehicle,pass,t,seconds+t);
      const forward=next.pose.cos*pose.cos+next.pose.sin*pose.sin>(hover?-.12:.988);
      const overJunction=hover&&t>.29&&t<duration-.31;
      const nearFind=obstacles.some(({x,z,radius})=>Math.hypot(x-next.pose.x,z-next.pose.z)<radius+Math.hypot(...size));
      if (!forward||nearFind||roadworkBlocker(vehicle,next.pose)||junctionAt(vehicle,next.pose)&&!overJunction) return null;
      for (const other of vehicles) {
        if (other===vehicle) continue;
        const expected=actorPose(other.actor,seconds+t,other.distance+other.actor.speed*t);
        if (overlaps({size,pose:next.pose},{size:other.size,pose:expected})
          ||i===samples&&followsTooClosely({size:other.size,pose:expected},{size,pose:next.pose})) return null;
        if (other!==blocker&&overlaps({size,pose:next.pose},other)) return null;
      }
    }
    return pass;
  }
  actors.forEach((actor,index)=>{
    if (!actor.route||!streetKinds.has(actor.kind)) return;
    const {length}=actor.route;
    const size=vehicleFootprint(actor),crossingReach=(2.3+Math.hypot(...size))**2;
    const spawnRange=actor.parking ? .53 : length;
    for (let offset=0;offset<spawnRange;offset+=.53) {
      const distance=actor.phase*length+offset;
      const candidate={actor,index,distance,size,crossingReach,pose:actorPose(actor,0,distance),wait:0,nextTurn:9+index*3,rng:randomGenerator(Math.round(length*200)+index*973)};
      if (actor.parking) {
        candidate.nextPark=length;
        candidate.holdUntil=actor.parking.delay;
        candidate.pose={...candidate.pose,sound:0,thrust:0};
      }
      candidate.zone=junctionAt(candidate,candidate.pose);
      if (intersectionOwner(candidate,candidate.zone)) continue;
      if (vehicles.some(other=>overlaps(candidate,other)||followsTooClosely(candidate,other)||followsTooClosely(other,candidate))) continue;
      vehicles.push(candidate);
      return;
    }
  });
  let last=0,carry=0;
  let retreat=null;
  const byIndex=new Map(vehicles.map(vehicle=>[vehicle.index,vehicle]));
  // Check the outgoing lane before taking possession of a junction. A queue
  // beyond the junction must not leave a vehicle stopped across other lanes.
  function exitBlocker(vehicle,distance,zone,seconds) {
    for (let advance=.55;advance<=12;advance+=.55) {
      const pose=actorPose(vehicle.actor,seconds,distance+advance);
      const blocker=roadworkBlocker(vehicle,pose)||laneBlocker(vehicle,pose);
      if (blocker) return blocker;
      if (junctionAt(vehicle,pose)!==zone) return null;
    }
    return null;
  }
  function findRetreat(seconds) {
    // Let a vehicle already in the junction clear it before the queue moves up.
    const cycle=waitingCycleVehicles(vehicles).sort((a,b)=>Number(Boolean(a.zone))-Number(Boolean(b.zone))
      ||b.wait-a.wait||a.size[0]-b.size[0]||a.index-b.index);
    for (const vehicle of cycle) {
      let clear=0;
      const lap=vehicle.nextPark-vehicle.actor.route.length;
      const room=Math.min(vehicle.zone?7.2:4.5,vehicle.actor.parking?vehicle.distance-lap:Infinity);
      for (let back=.3;back<=room;back+=.3) {
        const pose=actorPose(vehicle.actor,seconds,vehicle.distance-back);
        if (roadworkBlocker(vehicle,pose)||physicalBlocker(vehicle,pose)||intersectionOwner(vehicle,junctionAt(vehicle,pose))) break;
        clear=back;
      }
      if (clear>=1.2) {
        const other=vehicle.blocker;
        return {vehicle,target:vehicle.distance-clear,other,route:other.actor.route,distance:other.distance,pose:other.pose};
      }
    }
    return null;
  }
  return seconds=>{
    carry+=Math.max(0,Math.min(.2,seconds-last));
    last=seconds;
    closures=roadworks.filter(site=>{
      const age=roadworkAge(site,seconds);
      return age!==null&&age>=1.5&&age<site.duration-1.5;
    });
    const step=1/30;
    while (carry>=step) {
      carry-=step;
      if (!retreat&&vehicles.some(vehicle=>vehicle.blocker&&vehicle.wait>1.15)) retreat=findRetreat(seconds);
      const backing=retreat?.vehicle;
      if (backing) {
        const distance=Math.max(retreat.target,backing.distance-step*1.55);
        const pose=actorPose(backing.actor,seconds,distance);
        const zone=junctionAt(backing,pose);
        const blocked=roadworkBlocker(backing,pose)||physicalBlocker(backing,pose)||intersectionOwner(backing,zone);
        if (!blocked) Object.assign(backing,{distance,zone,pose:{...pose,sound:0,thrust:0}});
        if (blocked||distance<=retreat.target) {
          const {other,route,distance:otherDistance,pose:otherPose}=retreat;
          Object.assign(backing,{wait:0,blocker:null,holdUntil:seconds+1.25,
            yielding:{other,route,distance:otherDistance,pose:otherPose,expires:seconds+8.5}});
          retreat=null;
        }
      }
      const priority=vehicles.slice().sort((a,b)=>Number(Boolean(b.zone))-Number(Boolean(a.zone))||b.wait-a.wait);
      for (const vehicle of priority) {
        if (vehicle===backing||seconds<vehicle.holdUntil) continue;
        if (vehicle.yielding) {
          const {other,route,distance,pose,expires}=vehicle.yielding;
          const advance=other.actor.route===route?other.distance-distance:Math.hypot(other.pose.x-pose.x,other.pose.z-pose.z);
          if (seconds<expires&&advance<vehicle.size[0]+other.size[0]+.55) continue;
          vehicle.yielding=null;
        }
        if (vehicle.pass) {
          const pass=vehicle.pass;
          const elapsed=Math.min(pass.duration,pass.elapsed+step);
          const {distance,pose}=passingPose(vehicle,pass,elapsed,seconds);
          const work=roadworkBlocker(vehicle,pose);
          if (!work&&!physicalBlocker(vehicle,pose)) {
            Object.assign(vehicle,{distance,pose});
            vehicle.workWait=0;
            pass.elapsed=elapsed;
            if (elapsed>=pass.duration) {
              vehicle.pass=null;
              vehicle.nextPass=seconds+6+vehicle.rng()*5;
            }
          } else if (work) {
            vehicle.workWait=(vehicle.workWait??0)+step;
            vehicle.pose={...vehicle.pose,sound:0,thrust:0};
          }
          continue;
        }
        const actor=vehicle.actor;
        const merge=actor.parking?.merge;
        if (merge&&atBay(vehicle)&&vehicles.some(other=>other!==vehicle&&other.actor.parking?.plot===actor.parking.plot
          &&(!atBay(other)||other.holdUntil<vehicle.holdUntil))) continue;
        if (actor.driveThrough) {
          const near=Math.hypot(actor.driveThrough.x-vehicle.pose.x,actor.driveThrough.z-vehicle.pose.z)<.33;
          if (near&&!vehicle.pickedUp) {
            vehicle.pickedUp=true;
            vehicle.holdUntil=seconds+1.65;
            vehicle.pose={...vehicle.pose,sound:0};
            continue;
          }
          if (!near) vehicle.pickedUp=false;
        }
        if (actor.alternatives?.length&&seconds>=vehicle.nextTurn) {
          const near=vehicles.some(other=>other!==vehicle&&Math.hypot(other.pose.x-vehicle.pose.x,other.pose.z-vehicle.pose.z)<8);
          const pick=actor.alternatives[Math.floor(vehicle.rng()*actor.alternatives.length)];
          const join=pick===actor.route?null:transferDistance(pick,{...vehicle.pose,yaw:Math.atan2(vehicle.pose.sin,vehicle.pose.cos)});
          if (join!==null) {
            vehicle.actor={...actor,route:pick};
            vehicle.distance=join;
            vehicle.nextTurn=seconds+12+vehicle.rng()*17;
          } else vehicle.nextTurn=seconds+(near?.45:1.8);
        }
        let proposed=vehicle.distance+vehicle.actor.speed*step;
        const stop=merge&&vehicle.nextPark-actor.route.length+merge.stop;
        if (merge&&vehicle.distance<=stop+.00001&&proposed>=stop) {
          if (vehicle.distance<stop-.00001) proposed=stop;
          else if (seconds<vehicle.nextMergeCheck) continue;
          else if (!drivewayClear(vehicle,stop,seconds)) {
            vehicle.nextMergeCheck=seconds+.14;
            vehicle.pose={...vehicle.pose,sound:0,thrust:0};
            continue;
          }
        }
        const parking=actor.parking&&proposed>=vehicle.nextPark;
        const distance=parking?vehicle.nextPark:proposed;
        const pose=actorPose(vehicle.actor,seconds,distance);
        const zone=merge&&distance<=stop+.00001?null:junctionAt(vehicle,pose);
        const blocker=roadworkBlocker(vehicle,pose)||intersectionOwner(vehicle,zone)||laneBlocker(vehicle,pose)
          ||(zone&&zone!==vehicle.zone&&exitBlocker(vehicle,distance,zone,seconds));
        if (blocker) {
          const roadwork=blocker.roadwork||blocker.workWait>0;
          const pass=!zone&&!roadwork&&planPass(vehicle,blocker,seconds);
          if (pass) {
            Object.assign(vehicle,{pass,wait:0,blocker:null});
            vehicle.passCount=(vehicle.passCount??0)+1;
            if (vehicle.passCount%3===1) vehicle.passHorn=seconds+.54;
            continue;
          }
          vehicle.wait+=step;
          vehicle.blocker=blocker.roadwork?null:blocker;
          vehicle.workWait=roadwork?(vehicle.workWait??0)+step:0;
          vehicle.pose={...vehicle.pose,sound:0,thrust:0};
        } else {
          Object.assign(vehicle,{pose,zone,distance,wait:0,workWait:0,blocker:null});
          if (parking) {
            vehicle.nextPark+=actor.route.length;
            vehicle.holdUntil=seconds+actor.parking.rest;
            vehicle.pose={...pose,sound:0,thrust:0};
          }
        }
      }
    }
    return actors.map((actor,i)=>{
      const vehicle=byIndex.get(i);
      if (!vehicle) return actor.route&&streetKinds.has(actor.kind)
        ? {...actorPose(actor,seconds),y:-540,sound:0} : actorPose(actor,seconds);
      const queueAge=(vehicle.workWait??0)-1.55-.87*actor.phase;
      if (queueAge>=0&&queueAge%5.1<.54) {
        return {...vehicle.pose,cue:'queue-horn',sound:.8};
      }
      const horn=seconds<vehicle.passHorn||actor.horn&&(seconds+17*actor.phase)%actor.horn<.68&&seconds>8;
      return horn?{...vehicle.pose,cue:'horn',sound:.65}:vehicle.pose;
    });
  };
}

function rocketPose({x,y,z,yaw,kind,delay},seconds) {
  const t=(seconds+26-delay)%26;
  const ascend=t>=2.65&&t<7.5,descend=t>=11.05&&t<17.1;
  const away=t>=7.5&&t<11.05;
  const travel=ascend?(t-2.65)/4.85:descend?(17.1-t)/6.05:0;
  const altitude=260*travel**2.35;
  const flame=kind==='rocket-flame';
  const invisible=away||flame&&!(ascend||descend);
  const cos=Math.cos(yaw),sin=Math.sin(yaw);
  return {
    x:x+(flame?Math.sin(t*37)*.09:0),z,
    y:invisible?-540:y+altitude+(flame?Math.sin(t*41)*.115:0),
    cos,sin,stride:0,rollCos:1,rollSin:0,
    sound:Number(!flame&&(ascend&&t<5.5||descend&&t>14.6)),
  };
}

function planePose({x,y,z,yaw,delay,runway,kind,lightAircraft},seconds) {
  const clock=Math.max(0,seconds-delay)*(lightAircraft?.75:1),t=clock%30;
  const travel=lightAircraft?125:189;
  const reverse=Math.floor(clock/30)%2===1;
  const shuttle=kind==='shuttle';
  const end=runway*.5-(lightAircraft?.74:shuttle?1.32:1.08);
  let along=-end,altitude=0,turn=0;
  if (t>=2.4&&t<5.3) along=-end+2*end*((t-2.4)/2.9)**1.8;
  else if (t>=5.3&&t<8.8) {
    const flight=(t-5.3)/3.5;
    along=end+travel*flight**1.7;
    altitude=(lightAircraft?73:shuttle?146:115)*flight**1.44;
  } else if (t>=8.8&&t<13) altitude=-540;
  else if (t>=13&&t<17.4) {
    const approach=(17.4-t)/4.4;
    along=-end-travel*approach**1.91;
    altitude=(lightAircraft?66:103)*approach**1.94;
  } else if (t>=17.4&&t<20.5) along=-end+2*end*(1-((20.5-t)/3.1)**2);
  else if (t>=20.5) {
    along=end;
    turn=Math.PI*Math.max(0,Math.min(1,(t-22)/1.75));
  }
  const direction=reverse?-1:1,heading=yaw+(reverse?Math.PI:0)+turn;
  const bend=altitude>0 ? Math.sign(along)*Math.sin(Math.min(1,altitude/125)*Math.PI)*altitude*.56 : 0;
  const roll=altitude>0?Math.sin(t*2.4)*Math.min(.12,altitude*.012):0;
  const pitch=t>=5.05&&t<8.8?Math.min(.23,(t-5.05)*.4)
    :t>=13&&t<17.4?-.1*Math.min(1,(17.4-t)*2.3):0;
  return {x:x+Math.sin(yaw)*along*direction+Math.cos(yaw)*bend,y:y+altitude,z:z+Math.cos(yaw)*along*direction-Math.sin(yaw)*bend,
    cos:Math.cos(heading+roll),sin:Math.sin(heading+roll),pitch,stride:0,rollCos:Math.cos(roll),rollSin:Math.sin(roll),
    sound:Number(clock>0&&(t>=2.42&&t<8.16||t>=15.4&&t<21.2))};
}

export function coasterActor(parts,points,phase) {
  let length=0;
  const segments=points.map(([x,y,z],i)=>{
    const [a,b,c]=points[(i+1)%points.length];
    const dx=a-x,dy=b-y,dz=c-z,start=length;
    length+=Math.hypot(dx,dy,dz);
    return {x,y,z,dx,dy,dz,start,end:length,yaw:Math.atan2(dx,dz)};
  });
  return {kind:'coaster',parts,phase,speed:3.4,route:{segments,length},roads:[]};
}

function laneLoop(path,offset) {
  const lane=side=>path.map((point,i)=>{
    const before=path[Math.max(0,i-1)],after=path[Math.min(path.length-1,i+1)];
    const angle=Math.atan2(after.z-before.z,after.x-before.x);
    return [point.x-Math.sin(angle)*side,point.z+Math.cos(angle)*side];
  });
  return [...lane(offset),...lane(-offset).reverse()];
}

function streetLane(points,offset=.87) {
  return points.map((point,i)=>{
    const before=points.at(i-1),after=points[(i+1)%points.length];
    const a=Math.hypot(point.x-before.x,point.z-before.z)||1;
    const b=Math.hypot(after.x-point.x,after.z-point.z)||1;
    const ax=(point.x-before.x)/a,az=(point.z-before.z)/a;
    const bx=(after.x-point.x)/b,bz=(after.z-point.z)/b;
    const miter=offset/Math.max(.5,1+ax*bx+az*bz);
    return [point.x-(az+bz)*miter,point.z+(ax+bx)*miter];
  });
}

function roadNear(paths,access,loop=false) {
  return roadProjections(paths,access,loop?.75:1.85,loop).reduce((best,spot)=>
    !best||spot.gap<best.gap?spot:best,null);
}

function parkingStreet(plan,access,site) {
  const local=roadNear(plan.paths,access);
  if (!local||local.gap>1.85) return null;
  const branches=(plan.circuits??[]).filter(path=>site||path.length<=8);
  const circuit=roadNear(branches,access,true);
  if (circuit&&circuit.gap<.75) {
    const {path,i,x,z,u,v}=circuit;
    const points=path.slice(i+1).concat(path.slice(0,i+1));
    const reverse=site&&(site.x-x)*-v+(site.z-z)*u<0;
    if (reverse) points.reverse();
    const offset=reverse?-.87:.87;
    const join=[x-v*offset,z+u*offset];
    return [join,...streetLane(points),join];
  }
  const {x,z,path,i}=local;
  const right=path.slice(i+1),left=path.slice(0,i+1).reverse();
  const reach=branch=>branch.reduce((sum,p,i)=>sum+Math.hypot(p.x-(branch[i-1]?.x??x),p.z-(branch[i-1]?.z??z)),0);
  const preferred=site&&((site.x-x)*-local.v+(site.z-z)*local.u>0?right:left);
  const branch=preferred&&reach(preferred)>=5?preferred:reach(right)>reach(left)?right:left;
  if (reach(branch)<5) return null;
  const points=[{x,z},...branch.slice(0,24)].filter((point,i,all)=>!i||Math.hypot(point.x-all[i-1].x,point.z-all[i-1].z)>.15);
  return laneLoop(points,.87);
}

function residenceMerge(route,plot,entry,front) {
  const depth=(x,z)=>(x-plot.x)*Math.sin(plot.yaw)+(z-plot.z)*Math.cos(plot.yaw);
  const line=front-3.02;
  const segment=route.segments.find(p=>depth(p.x,p.z)<=line&&depth(p.x+p.dx,p.z+p.dz)>line);
  const stop=segment?segment.start+(segment.end-segment.start)*(line-depth(segment.x,segment.z))
    /(depth(segment.x+segment.dx,segment.z+segment.dz)-depth(segment.x,segment.z)):0;
  return {stop,reach:6.1,entry};
}

function residenceTours(layout,plan,plot,spots) {
  const entry=plot.entries[0];
  const street=parkingStreet(plan,entry,plot);
  if (!street) return [];
  const {front,elevation}=residenceDrive(layout,plot,plan.streetElevation);
  const point=([x,z])=>{const at=regionalPoint(plot,x,z);return [at.x,at.z];};
  const throat=[0,front-1.53];
  return spots.map((spot,i)=>{
    const side=Math.sign(spot.x);
    const leaving=[[spot.x,spot.z],[side*1.43,4.78],[0,front-3.45],throat];
    const returning=[throat,[0,front-3.48],[side*1.66,5.72],[side*4.14,5.51],[side*4.62,4.52],[side*4.34,3.58]];
    const points=leaving.map(point).concat(street,returning.map(point));
    const car=actor(vehicle(spot.kind,spot.color),points,{kind:'road',speed:2.16,corner:STREET_TURN_RADIUS,elevation,exactStart:true});
    return {...car,vehicleModel:spot.kind,parking:{model:spot,plot:plot.index,delay:8+i*11,rest:15+i*6,
      merge:residenceMerge(car.route,plot,entry,front)}};
  });
}

export function parkingTours(layout,plan,plot,stages) {
  const entry=plot.entries?.[0];
  if (!entry) return [];
  const spots=[...new Set(stages.flatMap(stage=>stage.flatMap(part=>part.parking?[part.parking]:[])))];
  if (!spots.length) return [];
  if (plot.residence) return residenceTours(layout,plan,plot,spots);
  const cos=Math.cos(plot.yaw),sin=Math.sin(plot.yaw);
  const front=(entry.x-plot.x)*sin+(entry.z-plot.z)*cos;
  return spots.flatMap((spot,i)=>{
    const apron=plot.airportDistrict?spot.x*.31:spot.x;
    const access=regionalPoint(plot,apron,front);
    const street=parkingStreet(plan,access,plot.kind==='residence'?plot:null)??parkingStreet(plan,entry);
    if (!street||front<spot.z+1.5) return [];
    const bay=regionalPoint(plot,spot.x,spot.z);
    const fromDeck=regionalPoint(plot,spot.x,Math.min(front-.84,spot.z+1.48));
    const driveway=regionalPoint(plot,apron,front-1.25);
    const toArray=({x,z})=>[x,z];
    const points=[bay,fromDeck,driveway].map(toArray).concat(street,[driveway,fromDeck].map(toArray));
    const height=spot.kind==='hover'?.17:0;
    const deck=plot.y+spot.y-height;
    const edge=Math.min(front-1.05,Math.max(plot.kind==='residence'?spot.z+.74:0,(plot.halfDepth??4.6)-.28));
    const elevation=(x,z)=>{
      const a=x-plot.x,b=z-plot.z;
      const localX=a*cos-b*sin,depth=a*sin+b*cos;
      const street=plan.streetElevation?.(x,z)??roadElevation(layout,x,z);
      if (Math.abs(localX-spot.x)>4.7||depth<spot.z-.5||depth>=front) return street+height;
      const t=Math.max(0,Math.min(1,(depth-edge)/Math.max(.5,front-edge)));
      return deck+(street-deck)*t+height;
    };
    const car=actor(spot.kind==='hover'?occupiedHovercar(i===0,spot.color):vehicle(spot.kind,spot.color),points,
      {kind:spot.kind==='hover'?'hover':'road',speed:spot.kind==='hover'?2.38:1.76,corner:STREET_TURN_RADIUS,elevation,exactStart:true});
    return [{...car,...(plot.kind==='residence'&&{vehicleModel:spot.kind}),parking:{
      model:spot,plot:plot.index,delay:7+(plot.index*3+i*12)%18,rest:18+(plot.index+i*9)%15,reverseUntil:front-spot.z+.65,
      ...(plot.kind==='residence'&&{merge:residenceMerge(car.route,plot,access,front)}),
      access:Array.from({length:7},(_,j)=>{
        const t=j/6,depth=edge+(front-.55-edge)*t;
        const point=regionalPoint(plot,spot.x+(apron-spot.x)*t,depth);
        return {...point,y:elevation(point.x,point.z)-height-.035};
      }),
    }}];
  });
}

export function sailboat(cargo) {
  const hull=cargo?'#567a8f':'#af695c';
  const keel=[rounded(0,-.11,1.62,3.04,.48,hull,.01),dome(0,.94,1.55,1.83,.38,hull,.06),
    rounded(0,-.09,1.42,2.8,.14,'#e1ceb0',.48)];
  if (cargo) return [...keel,rounded(0,-.81,1.16,1.15,.7,'#e9dabf',.57),
    box(0,-.2,.78,.075,.26,'#90bbcb',.95),rounded(-.22,.64,.6,.99,.48,'#d38d6e',.61),
    tube(.38,-1.09,.18,.18,.61,'#5a6e7d',1.24)];
  return [...keel,tube(0,-.2,.087,.087,2.64,'#ac8d68',.57),
    {shape:'plate',x:0,y:1.6,z:-.18,w:2.15,d:.02,h:2.55,color:'#fff1d2',profile:[[0,1.38],[0,-.97],[-1.04,-.94]]},
    {shape:'plate',x:.12,y:1.38,z:-.1,w:1.12,d:.02,h:1.9,color:'#e3988e',profile:[[0,1.24],[.92,-.72],[0,-.69]]}];
}

function littleDog() {
  return [rounded(0,0,.41,.87,.41,'#bd8860',.27),dome(0,.37,.53,.59,.46,'#cd9b6d',.49),
    rounded(0,.62,.26,.32,.22,'#e5b78b',.5),dome(0,.77,.19,.19,.14,'#5b4c48',.57),
    ...[-1,1].flatMap(side=>[-.24,.24].map(z=>({...tube(side*.14,z,.10,.11,.34,'#8a5e4f'),stride:side*Math.sign(z)}))),
    beam([0,.52,-.34],[.12,.8,-.66],.105,'#bb8058')].map(part=>({...part,animalKind:'dog'}));
}

function regionBird(moon) {
  if (moon) return [rounded(0,0,.55,.7,.27,'#d4cecf',.02),dome(0,.14,.32,.31,.22,'#a7d6e5',.18),
    ...[-1,1].map(s=>box(s*.55,0,.69,.46,.11,'#617cab',.075))];
  return [rounded(0,0,.36,.66,.19,'#f9ead1',.06),dome(0,.32,.26,.34,.23,'#f5e9d3',.12),
    ...[-1,1].map(s=>dome(s*.38,-.03,.87,.24,.11,'#e8dbca',.13,s*.2)),
    rounded(0,.56,.12,.22,.08,'#e4ad73',.14)];
}

function boatRoute(theme,layout,plot) {
  if (theme==='city') {
    const sample=Array.from({length:10},(_,i)=>plot.z+(i-4.5)*2.2);
    return [...sample.map(z=>[riverAt(layout,z)-.62,z]),...sample.reverse().map(z=>[riverAt(layout,z)+.62,z])];
  }
  const c=Math.cos(plot.yaw),s=Math.sin(plot.yaw);
  return [[-5,6],[-6,13],[5,14],[8,10],[4,6]].map(([x,z])=>[plot.x+x*c+z*s,plot.z+z*c-x*s]);
}

export function swimmer(skin='#dfa881',cap='#d78684') {
  return [dome(0,-.29,.48,.75,.16,'#75aead',.016),rounded(0,.14,.38,.35,.28,skin,.052),
    dome(0,.124,.41,.36,.17,cap,.225),
    beam([-.15,.082,-.08],[-.42,.111,.23],.105,skin),beam([.15,.075,-.04],[.38,.097,.28],.1,skin),
    box(-.36,-.38,.046,.42,.016,'#a3d9d6',.022),box(.37,-.47,.046,.43,.016,'#b2ddd6',.024)];
}

export function jetski(color) {
  return [rounded(0,-.02,.82,1.63,.24,color,.055),dome(0,.55,.77,.8,.29,'#edb375',.17),
    rounded(0,-.15,.49,.64,.14,'#506b75',.28),rounded(0,-.13,.41,.42,.54,'#e5c38e',.39),
    dome(0,-.08,.49,.46,.37,'#64899c',.85),
    ...[-1,1].flatMap(s=>[beam([s*.16,.78,-.05],[s*.26,.57,.38],.112,'#e4ae84'),
      box(s*.33,-.93,.068,.67,.025,'#cae8e1',.026)]),
    beam([-.32,.56,.4],[.32,.56,.4],.09,'#445e6a')];
}

function islandWaterLife(layout,plan,completed) {
  const water=(x,z)=>{ const tile=regionSurface(layout,x,z); return tile.water&&tile.basin>=0; };
  const safe=actor=>actor.route.segments.every(({x,z,dx,dz})=>water(x,z)&&water(x+dx*.5,z+dz*.5));
  let beach=[];
  for (const plot of completed.slice().reverse()) {
    const yaw=plot.waterfront?plot.yaw:Math.atan2(plot.x,plot.z);
    const site={...plot,y:0,yaw};
    for (const across of (plot.waterfront?[-5.4,5.4,-8.4,8.4]:[0,-5,5])) {
      for (const out of [4.6,7.8,11.1,14.3]) {
        const at=(dx,dz)=>{ const [x,,z]=pointOnSite([across+dx,0,out+dz],site); return [x,z]; };
        const lagoon=[[-1.32,-.82],[1.32,-.82],[1.32,.82],[-1.32,.82]].map(([x,z])=>at(x,z));
        if (!lagoon.every(([x,z])=>water(x,z)&&regionVisibility(plan,x,z)>.57)) continue;
        const swimRoute=(dx,dz)=>[[-1.1,-.32],[-.68,-.77],[.68,-.65],[1.18,-.19],[.88,.63],[-.4,.76]].map(([x,z])=>at(x+dx,z+dz));
        const swimmers=[actor(swimmer(),swimRoute(0,0),{kind:'swimmer',ground:.034,speed:.68,phase:.17,corner:.6}),
          actor(swimmer('#a67457','#e9c67e'),swimRoute(.38,.25).reverse(),{kind:'swimmer',ground:.034,speed:.57,phase:.67,corner:.55})];
        if (!swimmers.every(safe)) continue;
        if (!beach.length) beach=swimmers;
        const route=[[-4.3,2.4],[-5.5,5.2],[-2.5,6.45],[2.4,6.25],[4.85,5.2],[4.4,3]].map(([x,z])=>at(x,z));
        if (route.every(([x,z])=>water(x,z)&&regionVisibility(plan,x,z)>.45)) {
          const scooters=['#d37d6d','#4d9cac'].map((color,i)=>actor(jetski(color),route,
            {kind:'jetski',ground:.045,speed:4.6,phase:.23+i*.52,corner:1.67}));
          if (safe(scooters[0])) return [...swimmers,...scooters];
        }
      }
    }
  }
  return beach;
}

function terrainWander(layout,plan,completed,discoveries,driver) {
  const rng=randomGenerator(layout.seed^(driver?0xa8125c1:0x4c5a021));
  const roads=plan.paths.flat(),tracks=plan.transit??[];
  const safe=(x,z)=>{
    const ground=regionSurface(layout,x,z);
    return !ground.water&&ground.basin>-2.8&&regionVisibility(plan,x,z)>.56
      &&plan.plots.every(plot=>plot.residence?!regionalFootprint(plot,x,z,1.45):Math.hypot(plot.x-x,plot.z-z)>(plot.airfield?16:7.1))
      &&discoveries.every(site=>Math.hypot(site.x-x,site.z-z)>(site.type.mine?7.15:6.25))
      &&roads.every(point=>Math.hypot(point.x-x,point.z-z)>2.9)
      &&tracks.every(point=>Math.hypot(point.x-x,point.z-z)>2.6);
  };
  const joins=([a,b],[x,z])=>{
    const length=Math.hypot(x-a,z-b);
    return Array.from({length:Math.ceil(length/.7)+1},(_,i)=>i/Math.ceil(length/.7||1))
      .every(t=>safe(a+(x-a)*t,b+(z-b)*t));
  };
  const moon=layout.theme==='moon';
  const anchors=[...(moon?layout.basins:[]),...completed.slice().reverse(),plan.origin];
  for (const anchor of anchors) {
    for (let attempt=0;attempt<12;attempt++) {
      const angle=rng()*Math.PI*2,reach=anchor.w??(10+rng()*13);
      const start=[anchor.x+Math.cos(angle)*reach,anchor.z+Math.sin(angle)*reach];
      if (!safe(...start)) continue;
      const points=[start];
      for (let i=0;i<42&&points.length<20;i++) {
        const [x,z]=points.at(-1);
        const turn=rng()*Math.PI*2,step=2.8+rng()*5.1;
        const next=[x+Math.cos(turn)*step,z+Math.sin(turn)*step];
        if (points.slice(-5).some(([a,b])=>Math.hypot(a-next[0],b-next[1])<2.3)||!joins([x,z],next)) continue;
        points.push(next);
      }
      if (points.length<5) continue;
      const end=points.at(-1),returnAt=points.findIndex((point,i)=>i<points.length-3&&joins(end,point));
      const loop=returnAt<0?points.concat(points.slice(1,-1).reverse()):points.slice(returnAt);
      const person=moon?'alien':'human';
      const traveler=actor(driver?vehicle('rover','#caa18f'):visitor(person,'#9d86bb',undefined,false,.83,layout.seed%8),loop,
        {kind:driver?'offroad-rover':'walk',speed:driver?1.45:.71,phase:.22,corner:.72,
          elevation:(x,z)=>regionSurface(layout,x,z).y+.055,voice:driver?undefined:moon?'alien':'people'});
      const usable=trail=>trail.segments.every(({x,z,dx,dz})=>joins([x,z],[x+dx,z+dz]));
      if (!usable(traveler.route)) continue;
      const variations=[];
      // Alternate trails share the first and last stretches. Crossing the
      // seam or joining a different branch doesn't jump the figure.
      for (let trial=0;trial<22&&variations.length<2;trial++) {
        if (loop.length<7) break;
        const i=2+Math.floor(rng()*(loop.length-4));
        const a=loop[i-1],b=loop[i+1];
        const angle=rng()*Math.PI*2,reach=3.4+rng()*3.7;
        const fork=[loop[i][0]+Math.cos(angle)*reach,loop[i][1]+Math.sin(angle)*reach];
        if (!joins(a,fork)||!joins(fork,b)) continue;
        const variant=route(loop.map((point,j)=>j===i?fork:point),.72);
        if (usable(variant)) variations.push(variant);
      }
      if (driver) return {...traveler,alternatives:[traveler.route,...variations]};
      const paths=variations.length?[traveler.route,...variations,traveler.route,...variations.slice().reverse()]:[];
      const wander=paths.length?{paths,length:paths.reduce((sum,path)=>sum+path.length,0)}:null;
      return {...traveler,wander,offroadExplorer:true,characterSlot:901};
    }
  }
  return null;
}

export function driveThroughApproach(plot) {
  const entry=plot.entries?.[0]??plot;
  const reach=Math.max(5.8,Math.hypot(entry.x-plot.x,entry.z-plot.z));
  const world=(x,z,y=0)=>pointOnSite([x,y,z],plot);
  return {reach,world};
}

function driveThroughTraffic(plot,theme,elevation,circuits) {
  const {reach,world}=driveThroughApproach(plot);
  const far=reach+.87,near=reach-.87;
  const span=plot.streetSpan??13.4;
  const bend=Math.max(5.65,span*.45);
  const localX=({x,z})=>(x-plot.x)*Math.cos(plot.yaw)-(z-plot.z)*Math.sin(plot.yaw);
  const localZ=({x,z})=>(x-plot.x)*Math.sin(plot.yaw)+(z-plot.z)*Math.cos(plot.yaw);
  const pullIn=[[4.26,near],[4.26,1.63],[-4.26,1.63],[-4.26,near]];
  const convert=([x,z])=>{ const [a,,b]=world(x,z); return [a,b]; };
  let stops=[[bend,near],...pullIn,[-bend,near],[-bend,far],[bend,far]].map(convert);
  let corner=.58;
  for (const circuit of circuits.slice().sort((a,b)=>a.length-b.length)) {
    const edge=circuit.findIndex((a,i)=>{
      const b=circuit[(i+1)%circuit.length];
      return Math.abs(localZ(a)-reach)<.85&&Math.abs(localZ(b)-reach)<.85
        &&Math.min(localX(a),localX(b))< -4.9&&Math.max(localX(a),localX(b))>4.9;
    });
    if (edge<0) continue;
    const street=circuit.slice(edge).concat(circuit.slice(0,edge));
    const ordered=localX(street[0])>localX(street[1])?street:[street[1],street[0],...street.slice(2).reverse()];
    const lane=streetLane(ordered);
    stops=[lane[0],...pullIn.map(convert),...lane.slice(1)];
    corner=STREET_TURN_RADIUS;
    break;
  }
  const local=(x,z)=>(x-plot.x)*Math.sin(plot.yaw)+(z-plot.z)*Math.cos(plot.yaw);
  const car=actor(vehicle(theme==='moon'?'rover':theme==='island'?'pickup':'car','#d5a961'),stops,{
    kind:'road',speed:1.68,phase:.07,corner,
    elevation:(x,z)=>{
      const depth=local(x,z);
      const inside=Math.abs(localX({x,z}))<5.35&&depth>=.71&&depth<reach;
      const blend=inside?Math.max(0,Math.min(1,(depth-4.78)/(reach-4.78))):1;
      return (plot.y+.46)*(1-blend)+elevation(x,z)*blend;
    }});
  const [x,,z]=world(0,1.63);
  return {...car,driveThrough:{x,z},...(theme==='island'&&{islandVehicle:'pickup'})};
}

function streetFleet(theme,layout,plan,completed,circuits,alternatives,elevation) {
  const network=plan.network??streetNetwork(joinStreetPaths([],plan.paths,new Map(),new Set()).paths);
  const entries=completed.flatMap(plot=>plot.kind!=='residence'&&(plot.waterfront||plot.halfWidth)?
    plot.entries.map(point=>({...point,landmark:plot.index+1,airportDistrict:plot.airportDistrict,hangar:plot.kind==='hangar'})):[]);
  const visits=destinationRoutes(network,entries);
  const landmarkVisits=visits.filter(tour=>tour.landmark);
  const branchVisits=visits.filter(tour=>!tour.landmark);
  const models=theme==='moon'?['rover','moon-trike','mini-rover','rover','moon-trike','mini-rover']
    :theme==='island'?['cart','motorcycle','pickup','van','compact','delivery','car']
    :['car','motorcycle','compact','van','delivery','pickup','car','compact'];
  const colors=['#deaa73','#8eb1c6','#d27d84','#e0bb83','#80b5a9','#ad91c0','#d6a26e','#7798bc'];
  const span=network.edges.reduce((sum,edge)=>sum+edge.length,0);
  const count=Math.min(24,2+Math.floor(completed.length*.60),Math.max(2,Math.floor(span/21)));
  const rng=randomGenerator(layout.seed^0x52b7af34);
  const fleet=[];
  for (let i=0;i<count;i++) {
    const destination=i>0?(landmarkVisits[i-1]??(i%3===2?branchVisits.shift():null)):null;
    const circuit=circuits.length?circuits[(i*7)%circuits.length]:null;
    const tour=destination??(!circuit?visits[i%visits.length]:null);
    const points=tour?laneLoop(tour.path,.87):circuit?
      streetLane(i%3===1?circuit.slice().reverse():circuit):null;
    if (!points?.length) continue;
    const model=models[i%models.length];
    const speed=theme==='moon'?2.05+(i%4)*.32:model==='motorcycle'?3.75:model==='delivery'?2.28:2.65+(i%3)*.32;
    fleet.push({...actor(vehicle(model,colors[(i+(layout.seed%colors.length))%colors.length]),points,{
      kind:'road',elevation,speed,phase:rng(),corner:tour?1.34:STREET_TURN_RADIUS,
    }),vehicleModel:model,fleet:true,destination:tour?.landmark?tour.terminal:null,
      ...(!tour&&{alternatives}),horn:theme==='moon'?0:34+i*9,
      ...(theme==='island'&&['cart','pickup','van'].includes(model)&&{islandVehicle:model})});
  }
  return fleet;
}

export function regionActors(theme,layout,plan,completed,discoveries=[]) {
  if (!completed.length&&!plan.circuits?.length) return [];
  const actors=[], moon=theme==='moon';
  const paths=plan.paths.filter(path=>path.length>=4);
  const circuits=(plan.circuits??[]).slice().sort((a,b)=>b.length-a.length);
  const elevation=(x,z)=>plan.streetElevation?.(x,z)??roadElevation(layout,x,z);
  const alternatives=circuits.slice(0,18).flatMap(points=>
    [points,points.slice().reverse()].map(path=>route(streetLane(path),STREET_TURN_RADIUS)));
  const colors=['#deaa73','#8eb1c6','#d27d84','#e0bb83'];
  const walkers=moon?['astronaut','alien']:['human'];
  if (theme==='island') actors.push(...islandWaterLife(layout,plan,completed));
  if (completed.length) {
    const walker=terrainWander(layout,plan,completed,discoveries,false);
    if (walker) actors.push(walker);
  }
  if (moon) {
    const rover=completed.length&&terrainWander(layout,plan,completed,discoveries,true);
    if (rover) actors.push(rover);
    if (circuits.length||paths.length) {
      const circuit=circuits[1]??circuits[0];
      const points=circuit?streetLane(circuit):laneLoop(paths.at(-1),.78);
      actors.push({...actor(occupiedHovercar(layout.seed%2===1),points,{kind:'hover',speed:3.15,phase:.38,corner:STREET_TURN_RADIUS,
        elevation:(x,z)=>elevation(x,z)+.17}),...(circuit&&{alternatives})});
      if (completed.length>=2) actors.push({...actor(vehicle('rover-bus','#8daec5'),points,
        {kind:'bus',speed:1.94,phase:.47+(layout.seed%7)*.018,corner:STREET_TURN_RADIUS,elevation}),
        lunarBus:true,...(circuit&&{alternatives})});
    }
  }
  for (const shop of completed.filter(plot=>plot.kind==='driveThrough')) {
    actors.push(driveThroughTraffic(shop,theme,elevation,circuits));
  }
  const station=completed.find(plot=>plot.kind==='busStation');
  if (station&&paths.length) {
    const entry=station.entries[0]??station;
    const distance=path=>Math.min(...path.map(point=>Math.hypot(point.x-entry.x,point.z-entry.z)));
    const routes=circuits.length?circuits:paths;
    const cost=path=>distance(path)-Math.min(path.length,12)*.8;
    const closest=routes.reduce((near,route)=>cost(route)<cost(near)?route:near);
    const points=circuits.length?streetLane(closest):laneLoop(closest,.83);
    actors.push({...actor(vehicle('bus','#4c9694'),points,{kind:'bus',speed:2.25,phase:.33,
      elevation,corner:STREET_TURN_RADIUS}),horn:44});
  }
  if (theme==='island'&&completed.length>=2) {
    const busCount=completed.length>=12&&circuits.length>=2?2:1;
    for (let i=0;i<busCount;i++) {
      const circuit=circuits[i];
      const points=circuit?streetLane(i===0?circuit:circuit.slice().reverse()):laneLoop(paths.at(-1),.83);
      actors.push({...actor(vehicle('bus',i?'#cd7f75':'#4e9e98'),points,
        {kind:'bus',speed:2.05+i*.16,phase:.48+i*.17,elevation,corner:STREET_TURN_RADIUS}),
        islandVehicle:'bus',...(circuit&&{alternatives}),horn:58+i*12});
    }
  }
  for (const plot of completed.filter(plot=>['pier','quay','marina'].includes(plot.kind))) {
    const cargo=plot.kind==='quay';
    actors.push(actor(sailboat(cargo),boatRoute(theme,layout,plot),{kind:'boat',ground:.06,speed:cargo?1.45:1.85,phase:.35,corner:2}));
  }
  const suspension=completed.find(plot=>plot.kind==='bridge');
  if (suspension) {
    const span=suspension.span;
    const path=Array.from({length:9},(_,i)=>({x:suspension.x+(i/8-.5)*(span+8),z:suspension.z}));
    actors.push(actor(vehicle('car','#82a6b8'),laneLoop(path,.38),{
      kind:'road',elevation:(x,z)=>Math.abs(x-suspension.x)<span*.5?suspension.y+.514:roadElevation(layout,x,z),
      speed:2.7,phase:.1,corner:.65,
    }));
  }
  actors.push(...streetFleet(theme,layout,plan,completed,circuits,alternatives,elevation));
  for (let i=0;completed.length&&i<Math.min(paths.length,4,1+Math.floor(completed.length/4));i++) {
    const path=paths[(i*3+1)%paths.length];
    const walkCircuit=circuits.find(circuit=>circuit.length>=6)??circuits[0];
    const points=walkCircuit ? streetLane(walkCircuit,i%2===0?1.86:-1.86) : laneLoop(path,1.83);
    const person=walkers[i%walkers.length];
    actors.push({...actor(visitor(person,colors[(i+1)%4],i%2?'#a97963':'#edb88c',false,.83,(layout.seed+i)%8),points,{
      kind:'walk',elevation:(x,z)=>elevation(x,z)+.012,speed:.87+i*.092,phase:.13+i*.17,corner:.52,
      voice:moon?person:'people',
    }),characterSlot:896+i});
  }
  if (completed.length>=2) {
    const {x,z}=completed.at(-1);
    actors.push(actor(regionBird(moon),[[x-11,z-5],[x+2,z-11],[x+11,z-2],[x+4,z+10],[x-8,z+8]],{
      kind:'bird',ground:moon?7.5:6.5,speed:4.25,phase:.2,corner:5,
    }));
  }
  if (!moon&&completed.length>=4&&paths.length) {
    const path=paths[1%paths.length];
    actors.push(actor(littleDog(),laneLoop(path.slice(0,Math.min(path.length,16)),1.2),{
      kind:'walk',elevation:(x,z)=>regionSurface(layout,x,z).water?roadElevation(layout,x,z):regionSurface(layout,x,z).y+.06,
      speed:1.62,phase:.71,corner:.47,
    }));
  }
  return actors;
}
