import {walkingClock} from './scene-motion.js';
import {regionSurface,regionVisibility,roadElevation,riverAt} from './regions.js';
import {STREET_TURN_RADIUS} from './street-grid.js';
import {randomGenerator} from './worlds.js';

export const box = (x,z,w,d,h,color,y=0,studs=0) => ({shape:'box',x,y,z,w,d,h,color,studs});
export const tube = (x,z,w,d,h,color,y=0,axis='y') => ({shape:'tube',x,y,z,w,d,h,color,axis});
export const roof = (x,z,w,d,h,color,y) => ({shape:'roof',x,y,z,w,d,h,color});
export const rounded = (x,z,w,d,h,color,y=0) => ({shape:'rounded',x,y,z,w,d,h,color});
export const dome = (x,z,w,d,h,color,y=0,angle=0) => ({shape:'dome',x,y,z,w,d,h,color,angle});
export const at = (parts,x,y,z) => parts.map(part=>({...part,x:part.x+x,y:part.y+y,z:part.z+z}));
export const beam = (from,to,width,color) => ({
  shape:'beam',from,to,width,color,x:(from[0]+to[0])/2,z:(from[2]+to[2])/2,y:Math.min(from[1],to[1]),h:Math.abs(from[1]-to[1])+width,
});
export const MAX_ACTORS=22;

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

function occupiedHovercar(passenger=false) {
  const exhaust=(x,radius,length,color)=>Array.from({length:8},(_,i)=>{
    const rim=index=>[x+radius*Math.cos(index*Math.PI/4),.425+radius*Math.sin(index*Math.PI/4),-1.38];
    return {shape:'terrain',outline:[rim(i+1),rim(i),[x,.425,-1.38-length]],
      x,y:.425-radius,z:-1.38,h:radius*2,color,life:[0,0,0,-1]};
  });
  return [
    ...vehicle('hover','#b982ac'),
    ...[-.36,.36].flatMap(x=>[...exhaust(x,.13,.66,'#ff985e'),...exhaust(x,.086,.47,'#fff0a8')]),
    ...at(visitor('astronaut','#e7e1d6',undefined,true,.46),-.23,.60,-.19),
    tube(-.23,.25,.21,.065,.21,'#465463',.84,'z'),
    ...(passenger?at(visitor('alien','#5aa69b',undefined,true,.43),.24,.58,-.27):[]),
  ];
}

function route(points, corner) {
  const path=points.flatMap(([x,z],i)=>{
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

export function actor(parts,points,{kind,ground,speed,phase=0,corner=.85,roads=[],roadRise=0,elevation,voice}) {
  return {parts,kind,ground,speed,phase,roads,roadRise,elevation,voice,route:route(points,corner)};
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
  const {segments,length}=actor.route;
  const clock=actor.kind==='walk'&&actor.voice?walkingClock(seconds,actor.phase):{time:seconds,thinking:false};
  const traveled=distanceOverride??clock.time*actor.speed;
  let distance=(traveled+(distanceOverride===undefined?length*actor.phase:0))%length;
  if (distance<0) distance+=length;
  const segment=segments.find(part=>distance<part.end) ?? segments[0];
  const t=(distance-segment.start)/(segment.end-segment.start);
  const x=segment.x+segment.dx*t,z=segment.z+segment.dz*t;
  const yaw=segment.yaw;
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
  return actor.kind==='bus'?[1.83,.76]:actor.kind==='jetski'?[.69,.34]:[1.31,.74];
}

function overlaps(a,b) {
  const dx=b.pose.x-a.pose.x,dz=b.pose.z-a.pose.z;
  if (Math.abs(dx)>4||Math.abs(dz)>4||Math.abs(a.pose.y-b.pose.y)>1.7) return false;
  const axes=({sin,cos})=>[[sin,cos],[cos,-sin]];
  const aa=axes(a.pose),bb=axes(b.pose);
  const radius=(axes,[long,wide],[x,z])=>Math.abs(x*axes[0][0]+z*axes[0][1])*long
    +Math.abs(x*axes[1][0]+z*axes[1][1])*wide;
  return [...aa,...bb].every(([x,z])=>Math.abs(dx*x+dz*z)<radius(aa,a.size,[x,z])+radius(bb,b.size,[x,z]));
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

function waitingCycle(vehicles) {
  for (const start of vehicles) {
    const path=[];
    let next=start;
    while (next?.wait>1.15) {
      const repeated=path.indexOf(next);
      if (repeated>=0) return path.slice(repeated);
      path.push(next);
      next=next.blocker;
    }
  }
  return [];
}

export function createTraffic(actors,junctions=[]) {
  const crossings=junctions.filter(point=>!point.arms||point.arms.length>=3||point.connector);
  const junctionAt=(vehicle,pose)=>{
    if (!['road','bus','hover'].includes(vehicle.actor.kind)) return null;
    const reach=2.3+Math.hypot(...vehicle.size);
    return crossings.find(point=>Math.hypot(pose.x-point.x,pose.z-point.z)<reach)??null;
  };
  const vehicles=[];
  const physicalBlocker=(vehicle,pose)=>vehicles.find(other=>other!==vehicle&&overlaps({size:vehicle.size,pose},other));
  const laneBlocker=(vehicle,pose)=>vehicles.find(other=>other!==vehicle&&(
    overlaps({size:vehicle.size,pose},other)||followsTooClosely({size:vehicle.size,pose},other)));
  const intersectionOwner=(vehicle,zone)=>zone&&vehicles.find(other=>other!==vehicle&&other.zone===zone);
  actors.forEach((actor,index)=>{
    if (!actor.route||!streetKinds.has(actor.kind)) return;
    const {length}=actor.route;
    const size=vehicleFootprint(actor);
    for (let offset=0;offset<length;offset+=.53) {
      const distance=actor.phase*length+offset;
      const candidate={actor,index,distance,size,pose:actorPose(actor,0,distance),wait:0,nextTurn:9+index*3,rng:randomGenerator(Math.round(length*200)+index*973)};
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
      const blocker=laneBlocker(vehicle,pose);
      if (blocker) return blocker;
      if (junctionAt(vehicle,pose)!==zone) return null;
    }
    return null;
  }
  function findRetreat(seconds) {
    const cycle=waitingCycle(vehicles).sort((a,b)=>a.size[0]-b.size[0]||a.index-b.index);
    for (const vehicle of cycle) {
      let clear=0;
      for (let back=.3;back<=4.5;back+=.3) {
        const pose=actorPose(vehicle.actor,seconds,vehicle.distance-back);
        if (physicalBlocker(vehicle,pose)||intersectionOwner(vehicle,junctionAt(vehicle,pose))) break;
        clear=back;
      }
      if (clear>=1.2) return {vehicle,target:vehicle.distance-clear};
    }
    return null;
  }
  return seconds=>{
    carry+=Math.max(0,Math.min(.2,seconds-last));
    last=seconds;
    const step=1/30;
    while (carry>=step) {
      carry-=step;
      if (!retreat&&vehicles.some(vehicle=>vehicle.wait>1.15)) retreat=findRetreat(seconds);
      const backing=retreat?.vehicle;
      if (backing) {
        const distance=Math.max(retreat.target,backing.distance-step*1.55);
        const pose=actorPose(backing.actor,seconds,distance);
        const zone=junctionAt(backing,pose);
        const blocked=physicalBlocker(backing,pose)||intersectionOwner(backing,zone);
        if (!blocked) Object.assign(backing,{distance,zone,pose:{...pose,sound:0,thrust:0}});
        if (blocked||distance<=retreat.target) {
          Object.assign(backing,{wait:0,blocker:null,holdUntil:seconds+.85});
          retreat=null;
        }
      }
      const priority=vehicles.slice().sort((a,b)=>Number(Boolean(b.zone))-Number(Boolean(a.zone))||b.wait-a.wait);
      for (const vehicle of priority) {
        if (vehicle===backing||seconds<vehicle.holdUntil) continue;
        const actor=vehicle.actor;
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
        const distance=vehicle.distance+vehicle.actor.speed*step;
        const pose=actorPose(vehicle.actor,seconds,distance);
        const zone=junctionAt(vehicle,pose);
        const blocker=intersectionOwner(vehicle,zone)||laneBlocker(vehicle,pose)
          ||(zone&&zone!==vehicle.zone&&exitBlocker(vehicle,distance,zone,seconds));
        if (blocker) {
          vehicle.wait+=step;
          vehicle.blocker=blocker;
          vehicle.pose={...vehicle.pose,sound:0,thrust:0};
        } else {
          Object.assign(vehicle,{pose,zone,distance,wait:0,blocker:null});
        }
      }
    }
    return actors.map((actor,i)=>{
      const vehicle=byIndex.get(i);
      if (!vehicle) return actor.route&&streetKinds.has(actor.kind)
        ? {...actorPose(actor,seconds),y:-540,sound:0} : actorPose(actor,seconds);
      const horn=actor.horn&&(seconds+17*actor.phase)%actor.horn<.68&&seconds>8;
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

function planePose({x,y,z,yaw,delay,runway,kind},seconds) {
  const clock=Math.max(0,seconds-delay),t=clock%30;
  const reverse=Math.floor(clock/30)%2===1;
  const shuttle=kind==='shuttle';
  const end=runway*.5-(shuttle?1.32:1.08);
  let along=-end,altitude=0,turn=0;
  if (t>=2.4&&t<5.3) along=-end+2*end*((t-2.4)/2.9)**1.8;
  else if (t>=5.3&&t<8.8) {
    const flight=(t-5.3)/3.5;
    along=end+189*flight**1.7;
    altitude=(shuttle?146:115)*flight**1.44;
  } else if (t>=8.8&&t<13) altitude=-540;
  else if (t>=13&&t<17.4) {
    const approach=(17.4-t)/4.4;
    along=-end-189*approach**1.91;
    altitude=103*approach**1.94;
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

function offroadRover(layout,plan,plots) {
  const routes=plan.paths.flat();
  const safe=(x,z)=>{
    const ground=regionSurface(layout,x,z);
    return ground.basin>-2.8&&regionVisibility(plan,x,z)>.59
      &&plan.plots.every(plot=>Math.hypot(plot.x-x,plot.z-z)>7.1)
      &&routes.every(point=>Math.hypot(point.x-x,point.z-z)>2.15);
  };
  for (const crater of layout.basins) {
    const points=Array.from({length:9},(_,i)=>{
      const angle=i*Math.PI*2/9;
      const radius=i===2?.57:i===3?.74:1.16;
      return [crater.x+Math.cos(angle)*crater.w*radius,crater.z+Math.sin(angle)*crater.d*radius];
    });
    if (!points.every(([x,z])=>safe(x,z))) continue;
    const rover=actor(vehicle('rover','#caa18f'),points,{kind:'offroad-rover',speed:1.5,phase:.22,corner:1.35,
      elevation:(x,z)=>regionSurface(layout,x,z).y+.043});
    if (rover.route.segments.every(({x,z,dx,dz})=>safe(x,z)&&safe(x+dx*.5,z+dz*.5))) return rover;
  }
  for (const plot of plots.slice().reverse()) {
    for (let direction=0;direction<8;direction++) {
      const angle=direction*Math.PI/4, reach=15.3+(direction%2)*1.5;
      const x=plot.x+Math.cos(angle)*reach,z=plot.z+Math.sin(angle)*reach;
      const loop=Array.from({length:7},(_,i)=>{
        const t=i*Math.PI*2/7;
        return [x+Math.cos(t)*3.85,z+Math.sin(t)*2.95];
      });
      if (!loop.every(([a,b])=>safe(a,b))) continue;
      const rover=actor(vehicle('rover','#caa18f'),loop,{kind:'offroad-rover',speed:1.45,phase:.22,corner:1.5,
        elevation:(x,z)=>regionSurface(layout,x,z).y+.043});
      if (rover.route.segments.every(part=>safe(part.x,part.z))) return rover;
    }
  }
  return null;
}

export function regionActors(theme,layout,plan,completed) {
  if (!completed.length&&!plan.circuits?.length) return [];
  const actors=[], moon=theme==='moon';
  const paths=plan.paths.filter(path=>path.length>=4);
  const circuits=(plan.circuits??[]).slice().sort((a,b)=>b.length-a.length);
  const lane=(points,offset=.87)=>points.map((point,i)=>{
    const before=points.at(i-1),after=points[(i+1)%points.length];
    const a=Math.hypot(point.x-before.x,point.z-before.z)||1;
    const b=Math.hypot(after.x-point.x,after.z-point.z)||1;
    const ax=(point.x-before.x)/a,az=(point.z-before.z)/a;
    const bx=(after.x-point.x)/b,bz=(after.z-point.z)/b;
    const miter=offset/Math.max(.5,1+ax*bx+az*bz);
    return [point.x-(az+bz)*miter,point.z+(ax+bx)*miter];
  });
  const elevation=(x,z)=>plan.streetElevation?.(x,z)??roadElevation(layout,x,z);
  const routeVariants=circuits.slice(0,18).map(points=>route(lane(points),STREET_TURN_RADIUS));
  const alternatives=routeVariants.concat(circuits.slice(0,18).map(points=>route(lane(points.slice().reverse()),STREET_TURN_RADIUS)));
  const colors=['#deaa73','#8eb1c6','#d27d84','#e0bb83'];
  const walkers=moon?['astronaut','alien']:['human'];
  if (theme==='island') actors.push(...islandWaterLife(layout,plan,completed));
  if (moon) {
    const rover=completed.length&&offroadRover(layout,plan,completed);
    if (rover) actors.push(rover,{...rover,kind:'walk',offroadExplorer:true,
      parts:visitor('alien','#9d86bb',undefined,false,.83,layout.seed%4),speed:.58,phase:.73,voice:'alien'});
    if (circuits.length||paths.length) {
      const circuit=circuits[1]??circuits[0];
      const points=circuit?lane(circuit):laneLoop(paths.at(-1),.78);
      actors.push({...actor(occupiedHovercar(layout.seed%2===1),points,{kind:'hover',speed:3.15,phase:.38,corner:STREET_TURN_RADIUS,
        elevation:(x,z)=>elevation(x,z)+.17}),...(circuit&&{alternatives})});
      if (completed.length>=2) actors.push({...actor(vehicle('rover-bus','#8daec5'),points,
        {kind:'bus',speed:1.94,phase:.76,corner:STREET_TURN_RADIUS,elevation}),
        lunarBus:true,...(circuit&&{alternatives})});
    }
  }
  const station=completed.find(plot=>plot.kind==='busStation');
  if (station&&paths.length) {
    const entry=station.entries[0]??station;
    const distance=path=>Math.min(...path.map(point=>Math.hypot(point.x-entry.x,point.z-entry.z)));
    const routes=circuits.length?circuits:paths;
    const cost=path=>distance(path)-Math.min(path.length,12)*.8;
    const closest=routes.reduce((near,route)=>cost(route)<cost(near)?route:near);
    const points=circuits.length?lane(closest):laneLoop(closest,.83);
    actors.push({...actor(vehicle('bus','#4c9694'),points,{kind:'bus',speed:2.25,phase:.33,
      elevation,corner:STREET_TURN_RADIUS}),horn:44});
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
  for (let i=0;i<Math.min(paths.length,suspension?3:4,1+Math.floor(completed.length/5));i++) {
    const path=paths[(paths.length-1-i*3+paths.length*3)%paths.length];
    const circuit=circuits[i%circuits.length];
    const points=circuit?lane(circuit):laneLoop(path,.83);
    actors.push({...actor(vehicle(moon?'rover':theme==='island'?'cart':'car',colors[i]),points,{
      kind:'road',elevation,speed:moon?2.3:2.9,phase:i*.23+.12,
      corner:circuit?STREET_TURN_RADIUS:1.12,
    }),...(circuit&&{route:routeVariants[i%circuits.length],alternatives}),horn:moon?0:34+i*11});
  }
  for (let i=0;completed.length&&i<Math.min(paths.length,4,1+Math.floor(completed.length/4));i++) {
    const path=paths[(i*3+1)%paths.length];
    const walkCircuit=circuits.find(circuit=>circuit.length>=6)??circuits[0];
    const points=walkCircuit ? lane(walkCircuit,i%2===0?1.86:-1.86) : laneLoop(path,1.83);
    const person=walkers[i%walkers.length];
    actors.push(actor(visitor(person,colors[(i+1)%4],i%2?'#a97963':'#edb88c',false,.83,(layout.seed+i)%8),points,{
      kind:'walk',elevation:(x,z)=>elevation(x,z)+.012,speed:.87+i*.092,phase:.13+i*.17,corner:.52,
      voice:moon?person:'people',
    }));
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
  return actors.slice(0,MAX_ACTORS);
}
