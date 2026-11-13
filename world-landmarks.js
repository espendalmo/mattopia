import {lunarArchitecture} from './lunar-architecture.js';
import {box as b,rounded as r,dome as d,tube as t,roof,beam,worldSign,pointOnSite,placeParts,parkedVehicle,SERVICE_STOPS,WASH_BAY} from './scenery.js';
import {transitStation,helipadParts,REGIONAL_HELIPAD} from './transport.js';
import {slidePark} from './slide-parks.js';
import {detailFacades} from './facades.js';
import {RESIDENCE_PLOT} from './regions.js';

const cream='#f3e5c8', stone='#c9bda6', dark='#344451', glass='#68a4ba', ice='#a1dae2';
const brass='#e5bc68', teal='#347e81', rose='#c86173';
const pair=[-1,1];

const base=(w,d,color=stone)=>[
  {...b(0,0,w-.24,d-.24,1.32,color,-1.25),support:true},
  r(0,0,w,d,.27,color,.04),
  b(0,0,w-.3,d-.3,.085,cream,.292),
];

function entrance(z,width=1.55,height=1.72) {
  return [r(0,z,width,.14,height,dark,.36),b(-width*.21,z+.09,.08,.037,height*.7,brass,.46),
    b(width*.21,z+.09,.08,.037,height*.7,brass,.46),r(0,z+.31,width+.62,.72,.125,cream,.225)];
}

function glazing(xs,ys,z,{w=.72,h=.74,color=glass}={}) {
  return ys.flatMap(y=>xs.flatMap(x=>[
    b(x,z,w+.16,.123,h+.14,cream,y-.055),b(x,z+.079,w,.071,h,color,y),
    b(x-w*.26,z+.12,w*.18,.024,h*.78,ice,y+.077),
  ]));
}

function flankWindows(distance,zs,ys,options) {
  return pair.flatMap(side=>placeParts(glazing(zs.map(z=>-z*side),ys,distance,options),
    {x:0,y:0,z:0,yaw:side*Math.PI/2}));
}

function hotelLetters(y,z,color) {
  const strokes=[
    [[0,0,0,1],[1,0,1,1],[0,.5,1,.5]],
    [[0,0,0,1],[1,0,1,1],[0,0,1,0],[0,1,1,1]],
    [[0,1,1,1],[.5,0,.5,1]],
    [[0,0,0,1],[0,0,1,0],[0,.5,.85,.5],[0,1,1,1]],
    [[0,0,0,1],[0,0,1,0]],
  ];
  return strokes.flatMap((letter,i)=>letter.map(([a,b,c,d])=>{
    const x=-.89+i*.37;
    return beam([x+a*.26,y+b*.37,z],[x+c*.26,y+d*.37,z],.055,color);
  }));
}

function shrub(x,z,color='#5f9565',height=.48) {
  return [t(x,z,.79,.75,.22,'#c08467',.35),d(x,z,.96,.86,height,color,.56)];
}

function palm(x,z,height=2.5) {
  return [beam([x,.35,z],[x+.28,height,z],.22,'#a17851'),
    ...Array.from({length:5},(_,i)=>{
      const a=i*Math.PI*2/5;
      return d(x+.28+.51*Math.cos(a),z+.51*Math.sin(a),1.63,.51,.29,i%2?'#7fb66c':'#459265',height-.08,a);
    })];
}

function umbrella(x,z,color=rose) {
  return [t(x,z,.095,.095,1.62,'#8b7265',.35),d(x,z,1.31,1.25,.35,color,1.87),
    t(x,z,.89,.89,.075,cream,1.05),r(x,z+.68,.42,.39,.3,'#ac7651',.34)];
}

function grandHotel(tropical) {
  const walls=tropical?'#e4a479':'#aaa6c0', roofColor=tropical?'#9c5463':'#435c86';
  const podium=tropical?'#d8ad7b':'#b0b6c1';
  const ground=base(10.8,9.4,podium);
  const main=[
    r(0,-1.08,7.76,4.25,1.62,walls,.36),r(0,-1.14,6.1,4.1,3.92,walls,1.92),
    ...pair.map(s=>r(s*3.57,-1.04,1.8,3.87,2.6,tropical?'#d8916c':'#797e9d',1.88)),
    b(0,-1.12,6.48,4.4,.25,cream,5.76),r(0,-1.51,4.92,3.22,1.04,walls,6),
    tropical?roof(0,-1.51,5.45,3.7,.84,roofColor,7.04):d(0,-1.51,5.27,3.52,.97,roofColor,7.02),
  ];
  const details=[
    ...glazing([-2.35,-1.2,0,1.2,2.35],[2.35,3.48,4.62],.92,{w:.66,h:.83}),
    ...[2.31,3.44,4.58].flatMap(y=>[b(0,1.33,6.5,.96,.12,cream,y-.11),
      b(0,1.77,6.42,.09,.095,brass,y+.45),
      ...[-3,-1.53,0,1.53,3].map(x=>b(x,1.77,.085,.08,.54,brass,y-.02))]),
    ...glazing([-3.64,3.64],[2.48,3.57],.93),
    ...glazing([-1.45,0,1.45],[6.16],.12,{w:.82,h:.63}),
    ...flankWindows(3.04,[-2.5,-1.4,-.26],[4.74],{w:.65,h:.69}),
    ...flankWindows(4.49,[-2.21,-.65],[2.46,3.48],{w:.63,h:.72}),
    ...pair.flatMap(s=>[b(s*4.47,-1.04,.21,3.97,.14,cream,4.41),b(s*4.48,-1.04,.17,3.96,.1,brass,3.28)]),
    ...entrance(1.08,1.93,1.42),r(0,1.89,3.15,1.86,.25,roofColor,1.86),
    ...pair.flatMap(s=>[t(s*1.36,2.53,.16,.16,1.6,brass,.3),
      ...(tropical?palm(s*4.32,2.49,2.67):shrub(s*3.64,2.42,'#639079',.73))]),
    ...worldSign('bed',0,6.85,.38,roofColor),
    r(0,2.77,2.22,.16,.61,roofColor,2.03),...hotelLetters(2.17,2.88,'#f6dfa2'),
  ];
  if (tropical) details.push(r(1.23,3.32,5.22,1.85,.21,cream,.35),
    b(1.23,3.32,4.85,1.48,.055,'#54bdcd',.57),
    b(1.8,3.48,3.3,.078,.014,'#a2e3da',.631),
    ...umbrella(-2.42,3.4,'#f2b761'),...umbrella(4.11,3.45,'#ed8f8e'));
  else details.push(...pair.map(s=>b(s*2.97,1.63,1.09,.14,.14,brass,5.66)),t(0,-1.5,.13,.13,1.1,brass,7.8),
    b(.31,-1.5,.62,.072,.29,'#cc6c75',8.51),
    ...pair.flatMap(s=>[r(s*2.86,2.7,1.15,.58,.25,'#c9b7ab',.34),r(s*2.86,2.7,1.02,.45,.31,'#7a9f75',.56),
      b(s*1.39,2.67,.14,.12,.18,'#ffe1a0',1.59)]));
  return [ground,main,details];
}

function civic(bank) {
  const trim=bank?'#bdc0b6':'#e9cca3', walls=bank?'#d6d4c4':'#ce8e70', top=bank?'#527f7a':'#8b4e58';
  const deck=base(bank?9.1:10.4,8.6,bank?'#a1aca8':'#b8ab91');
  const main=[
    r(0,-.78,7.4,4.91,3.03,walls,.34),b(0,-.8,7.7,5.13,.26,trim,3.28),
    roof(0,-.8,7.87,5.25,1.17,top,3.5),r(0,1.51,4.85,2.16,2.35,trim,.35),
    roof(0,1.55,5.27,2.34,1.02,top,2.64),
    ...(bank?[t(0,-.9,3.45,2.69,.54,'#a3b0a6',4.17),d(0,-.9,3.46,2.68,1.38,top,4.68)]
      :[r(0,-1.05,2.48,2.45,2.51,walls,3.55),b(0,-1.05,2.66,2.62,.21,trim,5.88),
        roof(0,-1.05,2.78,2.74,1.57,top,6.05)]),
  ];
  const columnX=bank?[-2.19,-1.42,1.42,2.19]:[-2.18,-1.55,1.55,2.18];
  const details=[
    ...columnX.flatMap(x=>[t(x,2.64,.29,.29,2.17,cream,.36),b(x,2.65,.45,.45,.18,trim,.34),
      b(x,2.65,.45,.45,.15,cream,2.4)]),
    ...entrance(2.64,1.55,1.96),...glazing([-3.05,3.05],[.74,1.89],1.71,{h:.91}),
    ...flankWindows(3.7,[-2.48,-.92,.6],[1.36],{w:.86,h:1.31,color:bank?'#87a9a6':'#75a3ae'}),
    ...pair.flatMap(s=>[b(s*3.71,-.8,.15,4.91,.15,trim,2.86),b(s*3.71,-.8,.15,4.9,.105,trim,.53)]),
    ...[0,1,2].map(i=>b(0,3.07+i*.24,4.67+i*.17,.59,.15,trim,.31-i*.10)),
    ...shrub(-3.73,2.78,'#618b6c'),...shrub(3.73,2.78,'#618b6c'),
  ];
  if (bank) details.push(...worldSign('battery',0,3.17,2.57,'#506b65'),t(0,-.9,.18,.18,.68,brass,5.94),
    t(0,-.9,.48,.48,.12,brass,6.43));
  else details.push(t(0,.207,1.37,.18,1.37,dark,4.66,'z'),t(0,.32,1.12,.08,1.12,cream,4.785,'z'),
    beam([0,5.34,.38],[.01,5.71,.38],.075,dark),beam([0,5.34,.39],[.28,5.23,.39],.075,dark),
    ...pair.flatMap(s=>[t(s*3.2,2.51,.12,.12,3.25,trim,.24),b(s*3.2+.37,2.51,.77,.059,.42,s<0?'#ad5161':'#557d91',3.08)]));
  return [deck,main,details];
}

function cinema() {
  const walls='#82a9a3',accent='#527f8c',light='#e8ba76';
  return [
    base(9.9,8.1,'#b8b4b3'),
    [r(0,-.78,7.97,4.88,3.03,walls,.34),r(0,1.15,5.41,2.08,2.74,'#668b95',.35),
      ...pair.flatMap(s=>[r(s*3.17,1.11,1.51,2.1,3.6,walls,.35),r(s*3.17,1.09,1.2,1.7,.49,accent,3.9)]),
      r(0,-.42,4.2,2.83,.53,accent,3.34),r(0,1.12,2.77,1.75,1.43,accent,3.28)],
    [...entrance(2.21,2.41,1.56),r(0,2.6,5.58,1.4,.27,'#7b4d69',2.03),
      b(0,3.22,5.43,.17,.13,light,2.13),...Array.from({length:12},(_,i)=>d(-2.49+i*.45,3.27,.13,.13,.1,'#fff1a7',2.28)),
      ...glazing([-3.16,3.16],[.81,2.45],2.19,{w:.58,h:1.14,color:'#d29a91'}),
      ...worldSign('music',0,3.98,2.03,'#85516a'),t(-1.41,2.33,.56,.13,.53,light,3.06,'z'),
      t(1.41,2.33,.56,.13,.53,light,3.06,'z')],
  ];
}

function prison() {
  const masonry='#a9a29a', roofColor='#586678';
  return [base(10,9.9,'#b8b8a9'),
    [r(0,-1.76,6.04,3.72,2.59,masonry,.35),roof(0,-1.74,6.46,4.03,1.23,roofColor,2.91),
      ...pair.flatMap(s=>[b(s*4,0,.49,7.5,1.54,masonry,.32),r(s*4,-3.19,1.64,1.61,2.83,masonry,.36),
        roof(s*4,-3.19,1.88,1.86,.72,roofColor,3.12),b(s*2.63,3.67,2.77,.49,1.52,masonry,.32)]),
      b(0,2.92,5.74,1.8,.047,'#9da594',.37)],
    [...[-2.11,-.73,.73,2.11].flatMap(x=>[b(x,.145,.61,.12,1.04,dark,1.13),
      ...[-.18,0,.18].map(dx=>b(x+dx,.225,.06,.076,1.06,cream,1.13))]),
      ...Array.from({length:9},(_,i)=>b(-1.26+i*.315,3.7,.092,.12,1.55,dark,.39)),
      b(0,3.71,2.66,.15,.12,dark,1.92),b(0,3.7,2.7,.12,.085,brass,1.23),
      ...pair.flatMap(s=>[b(s*2.32,1.85,1.13,.35,.27,'#ad8168',.39),t(s*4.1,3.75,.18,.18,2.08,dark,.31),
        r(s*4.1,3.75,.43,.43,.24,brass,2.23)])],
  ];
}

function dining(tropical) {
  const walls=tropical?'#f2b16f':'#d59977',tiles=tropical?'#589688':'#a15e56';
  return [base(10,9.5,tropical?'#e0c79a':'#c6b79a'),
    [r(-.7,-1.65,6.13,3.82,2.34,walls,.34),roof(-.71,-1.65,6.64,4.37,1.46,tiles,2.63),
      r(2.99,-1.2,2.08,3.28,1.81,'#efc9a1',.35),roof(2.99,-1.2,2.35,3.62,.94,tiles,2.13),
      r(.22,1.46,8.37,2.34,.22,'#cc9d6f',.34),r(0,.76,5.86,1.22,.15,'#efdbaa',2.52)],
    [...entrance(.29,1.71,1.62),...glazing([-2.72,-1.48,1.48],[.85],.285,{w:1,h:1.11}),
      ...Array.from({length:9},(_,i)=>b(-2.62+i*.65,.76,.63,1.42,.12,i%2?tiles:cream,2.54)),
      ...umbrella(-2.75,2.57,tropical?'#eda268':'#b56871'),...umbrella(.11,2.96,'#e7b95f'),...umbrella(2.74,2.34,'#70b5a0'),
      ...worldSign('fork',0,3.15,.66,tiles),...shrub(-4.01,1.33),...shrub(4.03,1.18)],
  ];
}

function gardens(tropical,bandstand=false) {
  const grass=tropical?'#83b67b':'#89ae77', pond=tropical?'#50afc2':'#5998b2';
  return [base(10.7,9.8,'#a6b194'),
    [b(0,0,10.36,9.45,.07,grass,.35),t(.58,-.45,4.2,3.4,.13,'#d8d8bd',.42),
      t(.58,-.45,3.77,3,.095,pond,.533),
      ...pair.flatMap(s=>[b(s*3.02,0,.71,8.95,.03,'#e1cba3',.44),b(0,s*3.26,7.8,.63,.03,'#e1cba3',.441)]),
      bandstand?t(-2.24,-2.5,2.64,2.54,.27,stone,.44):t(.57,-.47,.65,.63,.66,cream,.58)],
    [...(bandstand?[d(-2.24,-2.5,2.89,2.74,.66,tropical?'#cb837c':'#879f9a',2.37),
      ...pair.flatMap(s=>pair.map(q=>t(-2.24+s*.81,-2.5+q*.79,.12,.12,1.69,cream,.71)))]
      :[t(.57,-.47,.07,.07,.88,'#d2f0eb',1.13),d(.57,-.47,1.1,1.06,.25,'#8fd4d9',1.87)]),
      ...pair.flatMap(s=>[r(s*1.69,2.41,.92,.4,.23,'#bf8c64',.45),b(s*1.69,2.22,.93,.12,.41,'#bf8c64',.5),
        ...(tropical?palm(s*4.22,-.86+s*1.7,2.65):[t(s*4.16,s*2.7,.28,.28,1.43,'#916c52',.4),d(s*4.16,s*2.7,2.25,1.91,1.67,'#679b69',1.39)])]),
      ...[-1.9,-.8,.8,1.9].flatMap(x=>[d(x,3.94,.7,.64,.27,'#5c9a65',.42),d(x+.1,3.94,.24,.24,.16,'#e29189',.59)])],
  ];
}

function harbor(theme,style) {
  const broad=style==='quay'||style==='marina', length=theme==='island'?8.6:5.85;
  const width=broad?6.8:3.55;
  const deck=broad?'#bdb8aa':'#be956b', rim=broad?'#e4d4b2':'#986e55';
  return [
    [r(0,-1.9,width+.46,2.92,.38,stone,-.27),...pair.flatMap(s=>[-1.04,length*.37,length-2.35].map(z=>t(s*(width*.5-.38),z,.35,.37,.96,'#797b72',-.82)))],
    [b(0,length*.5-2.32,width,length,.19,deck,.025),
      ...Array.from({length:Math.floor(length/.53)},(_,i)=>b(0,-2.15+i*.53,width-.22,.045,.012,rim,.22)),
      ...pair.map(s=>b(s*(width*.5-.16),length*.5-2.32,.18,length,.19,rim,.2)),
      ...(broad?[r(-1.46,-.92,2.55,2.15,1.34,'#d6a27d',.2),roof(-1.46,-.92,2.8,2.34,.68,'#7b8797',1.5)]:[])],
    [...pair.flatMap(s=>[t(s*(width*.5-.37),length-2.73,.35,.35,.46,dark,.22),d(s*(width*.5-.37),length-2.73,.44,.44,.13,brass,.59),
      t(s*(width*.5-.27),.08,.13,.13,1.85,dark,.23),r(s*(width*.5-.27),.08,.47,.38,.26,'#f3dc9e',1.89)]),
      ...worldSign('boat',0,1.12,-1.36,teal),
      ...(broad?[r(2,-.72,1.06,1.02,.57,'#a68161',.2),r(1.42,.45,.88,.76,.46,'#b98b66',.21)]:[])],
  ];
}

function suspension(span=14.6) {
  const towers=span*.275, vermilion='#bd5553', highlight='#e68465', deck='#5c6879';
  const zRails=pair.map(s=>s*1.25);
  return [
    pair.flatMap(s=>[r(s*towers,0,1.57,3.27,.52,'#a99992',-.53),...zRails.map(z=>b(s*towers,z,.64,.62,1.08,vermilion,-.32))]),
    [b(0,0,span,2.78,.36,vermilion,.04),b(0,0,span,2.49,.12,deck,.394),
      ...pair.flatMap(s=>[...zRails.map(z=>r(s*towers,z,.54,.6,5.21,vermilion,.25)),
        ...[2.32,4.27,5.27].map(y=>b(s*towers,0,.56,2.69,.27,highlight,y)),
        ...zRails.map(z=>b(s*towers,z,.73,.76,.32,highlight,5.39))])],
    [...zRails.flatMap(z=>{
      const points=Array.from({length:21},(_,i)=>{
        const x=(i/20-.5)*span;
        const y=Math.abs(x)<towers ? 1.83+3.87*(x/towers)**2 : 5.68-(Math.abs(x)-towers)/(span*.5-towers)*4.75;
        return [x,y,z];
      });
      return [...points.slice(1).map((point,i)=>beam(points[i],point,.15,highlight)),
        ...points.filter((_,i)=>i>0&&i<20&&i%2===1).map(([x,y,z])=>beam([x,.56,z],[x,y,z],.06,'#f0a17f')),
        b(0,z,span,.12,.18,cream,.65)];
    }),
    ...Array.from({length:10},(_,i)=>b((i-4.5)*span/11,0,.52,.085,.018,'#e5d3ae',.516))],
  ];
}

export const WHEEL_HUB=[.44,4.72,-.45];
export function wheelGondola(color,passenger=false) {
  return [b(0,0,.078,.08,.46,cream,-.45),r(0,0,.84,.67,.42,color,-.73),
    b(0,.356,.66,.06,.17,ice,-.6),d(0,0,.94,.77,.27,color,-.32),
    ...(passenger?[d(.11,.12,.19,.19,.20,'#eac09a',-.48)]:[])];
}

function ferris(tropical) {
  const wheelColor=tropical?'#e9a25d':'#b4667c', colors=['#dd8d8c','#e6b96b','#71aabd','#8abb83'];
  const hub=WHEEL_HUB;
  const rim=Array.from({length:16},(_,i)=>{
    const a=i*Math.PI/8;
    return [hub[0]+Math.cos(a)*3.29,hub[1]+Math.sin(a)*3.29,hub[2]];
  });
  return [base(10.2,8.6,'#bdb29e'),
    [...pair.flatMap(s=>[beam([s*2.86,.34,-1.78],hub,.25,cream),beam([s*2.86,.34,.84],hub,.25,cream)]),
      ...rim.map((point,i)=>({...beam(point,rim[(i+1)%rim.length],.19,wheelColor),wheel:true})),
      ...rim.filter((_,i)=>i%2===0).map(point=>({...beam(hub,point,.094,'#decfba'),wheel:true})),
      t(hub[0],hub[2]+.065,.83,.39,.83,wheelColor,hub[1]-.41,'z')],
    [...rim.filter((_,i)=>i%2===0).flatMap(([x,y,z],i)=>placeParts(wheelGondola(colors[i%4],i%3!==1),{x,y,z})
      .map(part=>({...part,wheel:true,hinge:[x,y]}))),
      r(-3.33,2.29,1.77,1.59,1.27,'#e1ab86',.35),roof(-3.33,2.29,2.04,1.87,.66,rose,1.57),
      ...worldSign('flag',-3.34,1.22,3.19,'#9b617d'),...shrub(3.59,2.5),...umbrella(2.37,2.56,'#e6bb72')],
  ];
}

const COASTER_POSTS=[[-3,.73,2.4],[-3.7,2.1,.05],[-2.65,4.2,-2.52],[-.1,4.82,-3.03],
  [2.9,3.3,-2.23],[3.89,1.82,-.14],[2.48,1.07,2.43],[-.4,1.17,3.01]];
export const COASTER_TRACK=COASTER_POSTS.flatMap((point,i)=>{
  const previous=COASTER_POSTS.at(i-1),next=COASTER_POSTS[(i+1)%COASTER_POSTS.length];
  return [point.map((v,j)=>.22*previous[j]+.78*v),
    point.map((v,j)=>.065*previous[j]+.87*v+.065*next[j]),
    point.map((v,j)=>.78*v+.22*next[j])];
});
function coaster() {
  const rail=(point,i,side)=>{
    const before=COASTER_TRACK.at(i-1),after=COASTER_TRACK[(i+1)%COASTER_TRACK.length];
    const yaw=Math.atan2(after[0]-before[0],after[2]-before[2]);
    return [point[0]+side*.27*Math.cos(yaw),point[1],point[2]-side*.27*Math.sin(yaw)];
  };
  return [base(10.9,10,'#d9ba87'),
    [...COASTER_POSTS.flatMap(([x,y,z])=>[t(x,z,.16,.16,y-.27,'#698a95',.31),b(x,z,.6,.55,.15,'#98a0a0',.32)]),
      ...pair.flatMap(side=>COASTER_TRACK.map((point,i)=>{
        const next=(i+1)%COASTER_TRACK.length;
        return beam(rail(point,i,side),rail(COASTER_TRACK[next],next,side),.115,'#d37766');
      }))],
    [...COASTER_TRACK.map((point,i)=>beam(rail(point,i,-1),rail(point,i,1),.074,cream)),
      r(-1.79,2.12,1.4,1.77,1.24,'#edb186',.34),roof(-1.79,2.12,1.67,1.99,.67,'#699681',1.51),
      ...glazing([-1.8],[.81],3.01,{w:.71,h:.46}),b(-1.79,3.12,1.04,.36,.095,'#bd9770',.78),
      r(.74,.18,2.81,2.4,.065,'#a9bd82',.38),
      ...[.4,1.49,2.58,3.67].flatMap(x=>[t(x,3.63,.095,.095,.76,'#b18062',.34),d(x,3.63,.19,.19,.12,brass,1.08)]),
      b(2.04,3.63,3.33,.09,.10,'#d4a179',.89),
      ...palm(3.48,3.49,2.18),...palm(-4.34,-.79,2.19),...umbrella(1.03,-.28,'#e6bd75')],
  ];
}

function fitness() {
  return [base(9.75,8.25,'#e4c799'),
    [r(0,-1.3,6.88,4.02,2.49,'#c4d8bd',.35),r(0,-1.27,7.4,4.31,.26,'#607f7d',2.78),
      r(0,-1.44,5.72,3.39,.64,'#a7bdb0',3.02),b(0,1.92,8.22,2.51,.08,'#a5ac91',.354)],
    [...entrance(.75,1.66,1.78),...glazing([-2.45,2.45],[.71],.768,{w:1.49,h:1.65,color:'#79b9b3'}),
      ...pair.flatMap(s=>[b(s*2.05,2.23,1.61,.82,.16,'#6b8289',.45),
        beam([s*2.68,.62,1.9],[s*2.68,1.62,1.9],.118,dark),
        beam([s*2.68,1.62,1.9],[s*2.01,1.62,2.5],.094,dark),
        ...palm(s*4.18,.81,2.31)]),
      ...worldSign('ball',0,2.65,.97,teal)],
  ];
}

function beachClub() {
  return [base(10.7,9.1,'#d7bf91'),
    [r(0,-1.88,7.8,3.65,.23,'#d0a673',.35),roof(0,-1.89,8.1,3.9,1.17,'#588f84',2.45),
      ...[-3.6,-1.2,1.2,3.6].flatMap(x=>pair.map(side=>t(x,-1.88+side*1.57,.18,.18,2.1,'#ab7852',.39))),
      r(1.83,2.13,4.68,2.57,.18,cream,.35),r(1.83,2.13,4.37,2.31,.085,'#6cbfc6',.532)],
    [r(0,-2.83,5.93,.59,.91,'#b78767',.57),b(0,-2.52,6.02,.15,.099,cream,1.44),
      ...[-2.2,-1.1,0,1.1,2.2].map(x=>t(x,-2.1,.38,.39,.61,'#98bc9e',.58)),
      ...palm(-4.36,1.48,2.56),...umbrella(-2.74,2.56,'#e69f75'),...umbrella(-1.08,1.43,'#d6909e'),
      ...worldSign('music',0,2.76,.21,'#5c9083')],
  ];
}

function sunsetHotel(_theme,_site,index) {
  if (index===43) return mangoHotel();
  const coral='#cf8f79',tile='#578d8e';
  return [base(10.7,9.5,'#d4b890'),
    [r(0,-2.14,8.64,3.64,3.51,coral,.34),r(0,-2.16,8.9,3.93,.28,cream,3.78),
      r(0,-2.27,6.4,3.05,1.36,'#dbab91',4.04),roof(0,-2.26,6.85,3.44,.73,tile,5.37),
      ...pair.map(s=>r(s*3.14,.99,2.44,4.35,2.36,coral,.36)),
      r(0,.53,3.88,3.88,.24,'#f4e1b6',.35),r(0,.56,3.54,3.41,.069,'#62c2c7',.595)],
    [...glazing([-3.1,-1.6,0,1.6,3.1],[.91,2.2,3.17],-.27,{w:.8,h:.63}),
      ...glazing([-2.2,-.72,.72,2.2],[4.4],-.71,{w:.83,h:.66}),
      ...pair.flatMap(s=>[...glazing([s*3.15],[.75,1.86],3.2,{w:1.35,h:.56}),
        b(s*3.15,3.28,2.51,.32,.19,cream,2.45),
        ...palm(s*4.15,3.79,2.31)]),
      ...umbrella(-1.31,3.13,'#f0bc73'),...umbrella(1.11,3.13,'#dc8f85'),
      ...worldSign('bed',0,5.53,-.64,tile)],
  ];
}

function mangoHotel() {
  const wall='#dc9d72',deck='#f4d6ab',window='#679eaa',shade='#667d8c';
  return [base(10.86,10.16,'#c9ab81'),[
    r(-2.17,-1.16,4.23,5.81,5.42,wall,.34),r(-2.17,-1.16,4.5,6.06,.25,shade,5.6),
    r(1.96,-1.64,4.62,4.72,3.31,'#cf8b70',.35),r(1.96,-1.64,4.81,4.92,.29,deck,3.56),
    r(2.18,-1.61,3.66,4.1,1.26,wall,3.83),r(2.18,-1.61,3.81,4.22,.24,shade,4.93),
    t(-1.96,-1.14,3.52,3.58,.21,deck,5.82),d(-1.96,-1.13,3.45,3.54,.72,'#e6b568',5.99),
    t(-1.96,-1.13,.115,.12,.29,'#749368',6.66),
  ],[
    ...entrance(.82,1.78,1.76),...glazing([-3.36,-2.18,-.99],[1.06,2.36,3.64,4.89],1.8,{w:.67,h:.79,color:window}),
    ...[2.21,3.48,4.72].flatMap(y=>[r(-2.18,1.99,4.05,.74,.13,deck,y-.17),
      b(-2.18,2.37,3.95,.072,.24,'#e7ba86',y),...[-3.86,-2.8,-1.55,-.51].map(x=>b(x,2.39,.055,.062,.37,shade,y-.085))]),
    ...glazing([1.03,2.22,3.42],[.86,2.15],.74,{w:.71,h:.81,color:window}),
    r(2.13,2.7,3.58,1.89,.21,deck,.35),r(2.13,2.7,3.29,1.62,.065,'#69b7bf',.559),
    ...palm(-4.1,3.21,2.92),...umbrella(.93,4.12,'#eaa465'),...umbrella(3.68,4.12,'#d18482'),
    ...nameplate('MANGO',2.09,4.49,.56,shade,.162,deck),
  ]];
}

function biodome() {
  const tealGlass='#64b7ae';
  const ribs=Array.from({length:8},(_,i)=>{
    const yaw=i*Math.PI/4;
    const edge=Array.from({length:6},(_,j)=>{
      const angle=j*Math.PI/10;
      return [3.81*Math.sin(angle)*Math.cos(yaw),.70+3.35*Math.cos(angle),
        -.86+3.12*Math.sin(angle)*Math.sin(yaw)];
    });
    return edge.slice(1).map((to,j)=>beam(edge[j],to,.073,'#b8e0d0'));
  }).flat();
  return [base(10.45,9.35,'#b7bbcf'),
    [t(0,-.86,7.76,6.35,.42,'#c1d2ca',.34),d(0,-.86,7.62,6.23,3.35,tealGlass,.7),
      r(0,2.36,2.82,2.82,1.78,'#92b5b3',.35),d(0,2.4,2.86,2.76,.67,'#b0d8ce',2.11),
      ...ribs],
    [...entrance(3.81,1.55,1.37),...[-2.56,-1.36,1.36,2.56].flatMap(x=>[
      r(x,2.06,1.02,.67,.29,'#4c747c',.34),d(x-.17,2.06,.68,.59,.75,'#83c36f',.58),d(x+.22,2.04,.53,.53,.56,'#a7d67b',.56),
      t(x,.54,.09,.09,1.22,'#cae9d8',.78),
    ]),
    ...worldSign('leaf',0,2.55,3.57,'#427e7d'),...pair.map(s=>t(s*3.81,-.64,.19,.19,1.68,'#d5e8e2',.39))],
  ];
}

function habitat(hotel=false) {
  const skins=hotel?['#a5c5d9','#d4c6e1','#bcb8d3']:['#86acc6','#b9b7d4','#acc9d3'];
  const pods=[[-2.43,-.73,2.45],[2.32,-.61,2.82],[0,1.62,2.31]];
  return [base(10.5,9.23,'#aeb1cc'),
    [...pods.flatMap(([x,z,w],i)=>[t(x,z,w+.28,w+.18,.83,'#e7e1e1',.35),d(x,z,w,w-.12,hotel?2.1:1.49,skins[i],1.13)]),
      tubeLink(-1.26,.51,2.37,'#c4c9dc'),tubeLink(1.12,.51,2.45,'#aebfd4'),
      ...(hotel?[d(0,-2.72,3.45,2.29,2.48,'#9f90ba',.44)]:[])],
    [...pods.flatMap(([x,z,w])=>[r(x,z+w*.43,w*.7,.23,.52,'#47677f',.83),
      ...[-.46,0,.46].map(dx=>b(x+dx,z+w*.43+.13,.28,.064,.32,ice,.94))]),
      ...pods.flatMap(([x,z,w],i)=>(i===2?[-Math.PI/2,Math.PI/2]:[Math.PI,(i===0?-1:1)*Math.PI/2]).flatMap(yaw=>
        placeParts([t(0,.035,.66,.16,.51,cream,.585,'z'),t(0,.126,.51,.11,.39,glass,.64,'z'),
          b(-.10,.188,.064,.028,.29,ice,.685)],{
          x:x+Math.sin(yaw)*(w+.28)*.5,y:0,z:z+Math.cos(yaw)*(w+.18)*.5,yaw,
        }))),
      ...entrance(2.8,1.18,1.06),...worldSign(hotel?'bed':'home',0,2.37,2.38,'#5b7198'),
      ...pair.flatMap(s=>[t(s*3.82,1.84,.11,.11,2.41,'#bcc4d8',.38),
        d(s*3.82,1.84,.48,.45,.23,'#f3d193',2.61)])],
  ];
}
function tubeLink(x,z,length,color) { return t(x,z,1.2,length,1.18,color,.44,'z'); }

function utility(kind) {
  const oxygen=kind==='oxygen', main=oxygen?'#9dc7ca':kind==='refinery'?'#b99ab0':'#9ca9cf';
  const accent=oxygen?'#5b99aa':kind==='refinery'?'#936783':'#716e9c';
  return [base(9.9,8.78,'#b2b1c7'),
    [r(-1.63,-.67,4.15,3.45,2.08,main,.36),d(-1.62,-.68,4.35,3.63,1.02,accent,2.39),
      ...[-.18,1.67].flatMap(z=>[t(2.32,z,2.01,1.62,2.49,main,.35),d(2.32,z,2.02,1.63,.71,accent,2.8),
        t(2.32,z,2.07,1.67,.17,cream,1.26)]),
      ...pair.map(s=>t(-1.5+s*.73,-1.45,.38,.38,2.37,cream,2.56))],
    [...glazing([-2.78,-1.63,-.49],[.82,1.68],1.1,{w:.64,h:.51}),
      ...[-.18,1.67].map(z=>beam([.33,1.68,z],[2.25,1.68,z],.23,'#5bc8c0')),
      ...pair.map(s=>beam([-1.5+s*.73,4.7,-1.44],[-1.5+s*.73,4.99,-1.44],.47,brass)),
      ...worldSign(oxygen?'drop':kind==='refinery'?'gear':'battery',-1.64,2.51,1.34,accent),
      ...[-3,-1.5,0].map(x=>r(x,2.42,1.1,.81,.63,'#b5a3c8',.36))],
  ];
}

function generator() {
  return [base(10.4,9.3,'#a6abc6'),
    [r(-2.23,-1.45,4.22,3.49,2.3,'#a4a4c7',.34),roof(-2.23,-1.46,4.6,3.79,.83,'#676994',2.57),
      t(1.79,.1,3.82,3.82,.51,'#9ca6c1',.34),t(1.79,.1,2.35,2.35,2.63,'#909ec2',.84),
      ...[1.17,1.72,2.29,2.85].map(y=>t(1.79,.1,2.73,2.73,.24,'#e2c48a',y)),
      d(1.79,.1,2.4,2.4,.77,'#8599bc',3.41),
      ...[-3.18,-1.49].map(x=>b(x,2.16,1.48,2.59,.23,'#5f7da6',.67))],
    [...[-3.18,-1.49].flatMap(x=>[-.75,0,.75].map(z=>b(x,2.16+z,1.39,.05,.032,ice,.908))),
      ...[-2.7,2.6].map(z=>beam([1.79,1.28,.12],[1.79,.76,z],.23,'#78b9c3')),
      ...glazing([-2.98,-1.52],[1.08],.32,{color:'#92b7d1'}),
      ...worldSign('battery',-2.23,2.58,.49,'#7374a0')],
  ];
}

function plasmaBattery() {
  const teal='#69b7bf',gold='#e1be79',violet='#8882ad';
  return [base(10.59,9.46,'#9da6bb'),[
    r(-2.47,-1.78,3.93,3.13,2.06,'#b2b8d2',.35),r(-2.47,-1.78,4.09,3.28,.34,violet,2.36),
    t(1.79,.1,4.2,4.22,.38,violet,.35),t(1.79,.1,3.19,3.26,.77,'#a3b3c8',.71),
    t(1.79,.1,2.18,2.19,2.91,'#93c2cc',1.43),
    ...[1.48,2.15,2.89,3.68].map((y,i)=>t(1.79,.1,3.49-i*.24,3.52-i*.24,.17,teal,y)),
    ...pair.flatMap(s=>[beam([1.79+s*1.75,.75,.1],[1.79+s*.83,4.25,.1],.18,violet),
      beam([1.79+s*1.62,1.15,.12],[-2.47+s*.5,1.15,-1.68],.16,'#879db8')]),
  ],[
    d(1.79,.1,2.34,2.31,1.0,'#c9d8df',4.24),
    t(1.79,.1,.11,.11,.83,gold,5.17),d(1.79,.1,.35,.35,.31,teal,5.92),
    ...glazing([-3.45,-2.23,-1.25],[.99],-.18,{w:.57,h:.61,color:'#86cbd0'}),
    ...worldSign('battery',-2.49,2.28,-.12,violet),
    ...[-3.55,-2.26,-.99].flatMap((x,i)=>[t(x,2.35,.81,.81,.55,'#869db5',.35),
      t(x,2.35,.67,.67,.89+i*.19,teal,.85),d(x,2.35,.69,.69,.27,gold,1.71+i*.19)]),
  ]];
}

function craterLab() {
  return [base(10.25,9.32,'#a7b2c7'),
    [r(-1.37,-.89,5.93,4.56,1.72,'#bdc9d2',.34),r(-1.37,-.92,5.72,4.36,.36,'#778da8',2.01),
      d(2.92,-.77,2.67,2.8,1.91,'#b2a4c5',.34),t(2.92,-.76,2.59,2.67,.24,'#9dadd0',.36),
      r(0,2.45,7.2,2.4,.19,'#8e9aaf',.32),t(-2.86,-1.91,.18,.18,2.8,'#bacadb',2.18)],
    [...glazing([-3.35,-1.37,.61],[.9],1.43,{w:.93,h:.66}),...worldSign('flask',-1.33,2.19,1.61,'#8c7fa1'),
      ...[-2.18,0,2.1].flatMap((x,i)=>[r(x,2.45,1.34,1.21,.28,'#b5aab6',.52),
        d(x,2.45,.76,.64,.43,['#d6b39c','#b6adc8','#989db8'][i],.76,i*.45)]),
      d(-2.86,-1.91,.94,.79,.27,'#dfca9b',4.87),...entrance(1.49,1.34,1.37)],
  ];
}

function supplyDepot() {
  return [base(10.63,9.28,'#a7abc4'),
    [t(0,-1.16,6.9,5.27,.28,'#aab7ca',.34),d(0,-1.16,6.91,5.38,2.89,'#87a3bf',.59),
      r(0,.72,4.13,2.05,1.85,'#b7bccd',.34),
      ...pair.map(side=>r(side*3.58,1.28,1.12,2.52,.69,'#7f8fac',.34))],
    [...entrance(1.82,3.12,1.42),...worldSign('crate',0,2.66,1.83,'#7b799b'),
      ...[-2.89,-1.69,1.69,2.89].flatMap((x,i)=>[r(x,2.73,1.02,.91,.61,i%2?'#b7a9c8':'#cdad8a',.35),
        b(x,2.73,1.07,.94,.082,cream,.91)]),
      ...pair.map(side=>d(side*3.57,2.48,.46,.46,.25,'#e6bc78',1.03))],
  ];
}

function spaceField() {
  return [base(10.58,9.46,'#b5b3cf'),
    [b(0,0,8.86,7.78,.11,'#579f94',.34),t(0,0,2.27,2.27,.022,cream,.459),
      t(0,0,2.08,2.08,.022,'#579f94',.485),b(0,0,.075,7.44,.025,cream,.501),
      ...pair.flatMap(s=>[b(0,s*3.68,8.51,.085,.024,cream,.473),b(s*4.24,0,.085,7.4,.023,cream,.471),
        b(s*3.48,0,1.26,.085,.021,cream,.493)])],
    [...pair.flatMap(s=>[...pair.map(q=>t(s*4.37,q*3.88,.15,.15,2.73,'#6e769b',.35)),
      ...pair.map(q=>r(s*4.37,q*3.88,.58,.39,.23,'#f5d595',2.89)),
      ...pair.map(q=>b(s*4.21,q*1.13,.11,.11,.96,cream,.46)),
      b(s*4.21,0,.12,2.37,.1,cream,1.35)]),
      ...worldSign('ball',0,1.33,4.2,'#587990')],
  ];
}

export const ROCKET_PAD=[-.63,.62,-.29];

function rocketPort(orbital=false) {
  const rocketColor=orbital?'#669bac':rose;
  const tower=orbital?'#999dc3':'#a1b5ca';
  const mobile=parts=>parts.map(part=>({...part,flight:'rocket'}));
  return [base(10.3,9.77,'#a5acc6'),
    [t(-.63,-.29,6.1,6.05,.27,'#7789a7',.36),...mobile([
      t(-.63,-.29,2.16,2.15,5.24,orbital?'#ced5e2':'#e5e0dd',.62),
      t(-.63,-.29,2.25,2.23,.35,rocketColor,2.25),d(-.63,-.29,2.16,2.15,1.46,rocketColor,5.81),
      ...pair.map(s=>roof(-.63+s*1.05,-.34,1.46,.67,2.02,orbital?'#7d8daf':'#a66682',.7))]),
      ...pair.map(s=>beam([2.34,.41,-.38+s*.73],[2.34,6.79,-.38+s*.73],.23,tower)),
      ...[1.15,2.36,3.58,4.82,6.42].map(y=>b(2.34,-.39,.66,1.76,.12,brass,y)),
      ...(orbital?[r(-2.72,-2.56,2.57,2.34,1.6,'#909bb6',.34),d(-2.72,-2.56,2.7,2.54,.89,'#71a7b1',1.89)]:[])],
    [b(.66,-.34,2.52,.63,.11,'#d6be83',4.41),...mobile([
      t(-.63,.8,.86,.12,.82,dark,3.59,'z'),t(-.63,.89,.64,.07,.63,ice,3.68,'z')]),
      ...[0,1,2,3,4].map(i=>beam([2.33,.7+i*1.19,-1.1],[2.33,1.87+i*1.19,.32],.098,'#b3c8de')),
      ...worldSign('rocket',-3.29,1.15,2.7,'#81638e'),
      ...pair.map(s=>d(s*3.63,3.03,.47,.47,.21,'#efca87',.44))],
  ];
}

function telescope() {
  return [base(9.82,8.92,'#b8b6ca'),
    [t(0,-.69,5.84,5.24,.38,'#97a9bb',.34),r(0,-.68,3.83,3.38,1.9,'#bcc5d4',.67),
      t(0,-.69,1.71,1.7,2.33,'#8090aa',1.4),d(0,-.68,6.12,5.89,1.46,'#d0ccd8',3.49),
      t(0,-.54,5.65,5.41,.14,'#8195b8',3.52)],
    [beam([0,4.03,-.68],[.02,6.03,-.67],.19,'#cba96f'),d(.02,-.67,.55,.55,.27,brass,5.92),
      ...pair.flatMap(s=>[beam([s*1.52,4.16,-.67],[.02,5.8,-.67],.091,cream),
        beam([0,4.17,-.67+s*1.59],[.02,5.8,-.67],.091,cream)]),
      ...entrance(1.03,1.25,1.13),...worldSign('radio',0,2.37,1.24,'#637798'),
      ...pair.map(s=>r(s*3.57,2.58,1.1,.94,.83,'#a1aec6',.36))],
  ];
}

const LETTERS={
  A:['010','101','111','101','101'], B:['110','101','110','101','110'],
  C:['011','100','100','100','011'], D:['110','101','101','101','110'],
  E:['111','100','110','100','111'], F:['111','100','110','100','100'], G:['011','100','101','101','011'],
  H:['101','101','111','101','101'], I:['111','010','010','010','111'],
  K:['101','101','110','101','101'], L:['100','100','100','100','111'],
  M:['101','111','111','101','101'], N:['101','111','111','111','101'],
  O:['010','101','101','101','010'], P:['110','101','110','100','100'],
  'Å':['010','000','010','101','111'], 'Ø':['011','101','111','101','110'], Q:['010','101','101','111','011'],
  R:['110','101','110','101','101'], S:['011','100','010','001','110'],
  T:['111','010','010','010','010'], U:['101','101','101','101','111'],
  V:['101','101','101','101','010'], Y:['101','101','010','010','010'],
};

function nameplate(text,x,y,z,background,scale=.14,ink=cream) {
  const width=(text.length*4+1)*scale;
  const frame=[
    b(x,z,width,.19,scale,background,y-3.5*scale),
    b(x,z,width,.19,scale,background,y+2.5*scale),
    ...pair.map(s=>b(x+s*(width-scale)*.5,z,scale,.19,scale*5,background,y-2.5*scale)),
  ];
  const rows=Array.from({length:5},(_,row)=>
    [...text].map(letter=>LETTERS[letter]?.[row]??'000').join('0'));
  // The lettering and its background share a surface in both renderers.
  return [...frame,...rows.flatMap((row,j)=>[...row.matchAll(/0+|1+/g)].map(run=>{
    const w=run[0].length*scale, half=w/2, h=scale/2;
    return {shape:'plate',x:x+(run.index+run[0].length*.5-row.length*.5)*scale,y:y+(2-j)*scale,z:z+.095,
      w,d:.01,h:scale,color:run[0][0]==='1'?ink:background,profile:[[-half,-h],[half,-h],[half,h],[-half,h]]};
  }))];
}

function walkway(points,color='#d8c8a3',width=.76,base=.354) {
  return points.slice(1).map(([x,z],i)=>{
    const [a,c]=points[i], dx=x-a,dz=z-c;
    return {...b((x+a)/2,(z+c)/2,Math.hypot(dx,dz)+.27,width,.059,color,base),angle:Math.atan2(dz,dx)};
  });
}

function bench(x,z) {
  return [b(x,z,1.54,.46,.116,'#ac7655',.71),b(x,z-.25,1.5,.11,.36,'#bc8f61',.84),
    ...pair.flatMap(s=>[b(x+s*.54,z,.14,.4,.39,dark,.34),b(x+s*.54,z-.24,.09,.11,.7,dark,.43)])];
}

function broadTree(x,z,kind) {
  if (kind==='island') return palm(x,z,2.58);
  return [t(x,z,.24,.26,1.58,'#876954',.34),
    d(x-.36,z,1.72,1.45,1.34,'#699759',1.47),
    d(x+.36,z+.18,1.63,1.44,1.24,'#84aa62',1.75),
    d(x,z-.26,1.62,1.35,1.13,'#75a260',2.22)];
}

function greatPark(theme) {
  const tropical=theme==='island', lunar=theme==='moon';
  const lawn=lunar?'#8ba792':tropical?'#a6be7b':'#90a66b';
  const path=lunar?'#c2b5bd':'#d7c6a0';
  return [
    base(10.75,10.05,lawn),
    [b(0,0,10.37,9.64,.089,lawn,.291),
      ...walkway([[0,4.7],[0,2.56],[2.85,2.27],[4.02,.45],[3.79,-2.42],[1.12,-3.54],[-2.72,-3.52],[-4.32,-1.55],[-3.89,1.58],[-1.91,2.5],[0,2.56]],path),
      t(-.66,-.45,5.57,4.22,.14,lunar?'#859eae':'#b3b88d',.355),
      t(-.63,-.46,5.12,3.72,.082,lunar?'#64a5b9':'#69aeb3',.48),
      t(-1.01,-.81,2.89,1.75,.014,'#82c7c6',.559)],
    [
      ...[[-3.84,-2.71],[3.42,-3.64],[-4.18,2.86],[3.92,3.47]].flatMap(([x,z])=>
        lunar?shrub(x,z,'#6eaa9f',1.21):broadTree(x,z,theme)),
      ...bench(-1.97,2.04),...bench(1.88,2.11),
      ...[-1,1].map(s=>t(s*4.25,.82,.21,.21,.81,brass,.42)),
      ...[-1.69,-1.25,.21,.77].map((x,i)=>d(x,-1.19+i*.39,.39,.33,.068,i%2?'#e6aaae':'#8dbb86',.573)),
      ...worldSign('leaf',3.26,1.32,3.4,lunar?'#6a7299':teal),
    ],
  ];
}

function factory(theme,_site,index) {
  if (theme==='island') return juiceWorks();
  if (index===41) return brickWorks();
  const brick='#ae766d',roofTone='#755257';
  return [base(10.72,9.52,'#aaa79a'),
    [r(-1.19,-.84,6.95,5.27,2.94,brick,.34),r(3.35,-1.54,2.22,3.49,1.87,'#c4977e',.36),
      ...[-2.75,.38].map(x=>roof(x,-.84,3.43,5.43,1.4,roofTone,3.25)),
      ...[.51,2.29].flatMap((x,i)=>[
        t(x,-3.2,.83,.84,4.9+i*.83,'#ac7869',.31),
        t(x,-3.2,1.01,1.02,.28,'#cc9c80',4.93+i*.83),
        t(x,-3.2,.78,.79,.135,dark,5.17+i*.83),
      ]),r(3.32,-1.55,2.51,3.7,.2,roofTone,2.21)],
    [...glazing([-3.42,-2.15,-.87,.43],[1.5,2.45],1.86,{w:.67,h:.59,color:'#99bab7'}),
      ...entrance(1.84,1.7,1.22),...glazing([3.32],[1.04],.25,{w:1.27,h:.76}),
      ...[.65,2.68].flatMap(z=>[t(3.54,z,1.32,1.32,1.12,'#b7b9aa',.35),d(3.54,z,1.36,1.36,.28,'#bdc8b7',1.46)]),
      beam([3.54,1.6,.66],[3.54,1.6,2.68],.21,'#dca76b'),
      ...worldSign('gear',-3.61,1.06,2.08,'#5c7b80')],
  ];
}

function brickWorks() {
  const brick='#a9675c',edge='#ce9b7b',roofTone='#625c65';
  return [base(10.61,9.67,'#a99583'),[
    r(-.92,-1.04,6.4,5.93,2.44,brick,.35),roof(-.92,-1.02,6.7,6.14,1.46,roofTone,2.71),
    t(2.65,-1.18,2.91,4.5,2.13,brick,.36),d(2.65,-1.18,2.94,4.57,1.19,edge,2.42),
    t(3.46,-2.89,1.02,1.04,5.98,brick,.37),t(3.46,-2.89,1.17,1.19,.28,edge,6.27),
    ...[1.12,2.05,3.02,4,4.97,5.9].map(y=>t(3.46,-2.89,1.06,1.06,.061,'#b98472',y)),
  ],[
    ...entrance(1.92,2.17,1.79),...nameplate('TEGL',-.89,2.63,2.02,roofTone,.184,edge),
    ...glazing([-3.05,1.34],[.94],1.96,{w:.81,h:.74,color:'#929da2'}),
    ...[1.36,2.33,3.3,4.27].flatMap((x,i)=>[b(x,3.16,.77,.92,.105,'#aa8c70',.35),
      ...Array.from({length:i%3+2},(_,j)=>b(x,3.18,.7-j*.07,.83-j*.059,.17,i%2?'#b87565':'#bd8570',.46+j*.18))]),
    b(-3.76,2.87,1.12,.67,.38,'#b3826b',.35),...pair.map(s=>t(-3.76+s*.45,2.87,.13,.45,.42,'#687278',.37,'x')),
  ]];
}

function juiceWorks() {
  const wall='#d6b47e',tile='#518b7d',tank='#9ac6b5',trim='#efdbaf';
  return [base(10.69,9.53,'#aeb085'),[
    b(-1.6,-1.49,5.12,4.73,2.8,wall,.35),roof(-1.6,-1.5,5.53,4.91,1.19,tile,3.08),
    r(1.45,-2.6,5.04,2.32,2.41,wall,.35),r(1.46,-2.61,5.11,2.41,.27,tile,2.73),
    ...[2.35,4.02].flatMap((x,i)=>[t(x,-.63,1.42,1.42,2.78+i*.29,tank,.35),
      d(x,-.63,1.45,1.45,.58,'#c2d9bf',3.10+i*.29),t(x,-.63,.24,.24,.21,tile,3.58+i*.29)]),
    beam([2.35,2.15,-.63],[4.02,2.15,-.63],.19,'#dbb66f'),
  ],[
    ...placeParts(entrance(.94,1.55,1.53),{x:-1.64,y:0,z:0}),
    ...glazing([-3.21,-.19],[.92,2.04],.93,{w:.79,h:.65,color:'#72a9ae'}),
    ...nameplate('JUICE',-1.58,2.75,1.06,tile,.21,trim),
    ...palm(-4.26,2.94,2.62),...palm(4.12,3.22,2.36),
    ...[.53,1.63,2.73].flatMap((x,i)=>[r(x,2.22,.81,.65,.32,'#aa8664',.35),
      ...[-.19,.19].map(dx=>d(x+dx,2.24,.32,.31,.28,i%2?'#a3bd69':'#e8b15e',.63))]),
  ]];
}

function sawmill() {
  const wood='#b48a60',shade='#876851',trim='#e4c99c';
  return [base(10.7,9.65,'#c0a783'),
    [r(-1.66,-1.72,5.82,4.8,2.53,wood,.36),roof(-1.66,-1.72,6.14,5.05,1.33,'#688380',2.89),
      r(2.52,.89,4.24,4.38,.19,trim,.37),
      ...pair.map(s=>beam([s*1.57+2.58,.59,-.43],[s*1.57+2.58,.59,2.17],.14,'#6f8285'))],
    [...[-3.98,-3.18,-2.37,-1.55,-.74,.1].map(x=>b(x,.72,.065,.048,2.37,shade,.45)),
      r(-1.68,.75,2.32,.1,1.84,shade,.39),...glazing([-3.42,.11],[1.34],.8,{w:.72,h:.64}),
      ...[1.29,2.27,3.25,4.13].flatMap((x,i)=>[t(x,1.12,.76,2.84,.76,i%2?'#98704d':'#ac8159',.54,'z'),
        t(x,2.59,.7,.065,.71,trim,.575,'z'),t(x,2.63,.4,.041,.4,'#bb9466',.74,'z')]),
      t(2.45,.99,.75,2.81,.75,'#966f51',1.25,'z'),t(2.45,2.45,.69,.077,.69,trim,1.28,'z'),
      ...worldSign('log',-3.58,2.74,.98,teal)],
  ];
}

function busStation() {
  const canopy='#4c8f8c',deck='#c8c8b7';
  return [base(10.55,9.78,deck),
    [r(0,3.09,10.14,3.56,.069,'#6d8089',.335),b(0,.91,8.08,1.12,.092,'#d7c8aa',.332),
      ...pair.flatMap(s=>[r(s*2.62,-1.75,4.42,2.51,.27,canopy,2.33),
        b(s*2.62,-1.63,4.53,.16,.15,'#e3b975',2.48),b(s*2.62,-2.67,3.94,.095,1.66,'#9bc4c4',.55),
        ...pair.map(q=>b(s*2.62+q*1.85,-2.39,.16,.16,2.03,'#627c86',.34))])],
    [...pair.flatMap(s=>[...bench(s*2.66,-1.98),...bench(s*2.31,-3.75),
      ...[0,1,2,3].map(i=>b(s*2.47-1.48+i*.95,1.75,.54,.089,.024,cream,.41)),
      t(s*3.87,.95,.13,.13,1.82,dark,.35),...worldSign('bus',s*3.87,2.03,1.03,canopy)]),
      ...nameplate('BUSS',0,2.91,-.47,'#466575',.22),
      ...[-.79,.74].map(x=>t(x,1.06,.19,.19,.67,'#dcb36b',.34)),
      ...stationVehicle('busStation')],
  ];
}

function stationVehicle(kind,theme) {
  const {model,color,x,y,z,yaw}=SERVICE_STOPS[kind];
  if (kind==='policeStation'&&theme==='moon') return parkedVehicle('lunar-police','#7568a4',{x,y,z,yaw});
  if (kind==='policeStation'&&theme==='island') return parkedVehicle('island-police','#417c8d',{x,y,z,yaw});
  return parkedVehicle(model,color,{x,y,z,yaw});
}

export function caravanModel() {
  return [r(0,0,2.53,1.74,1.14,'#e4c8a7',.19),r(0,.01,2.32,1.69,.21,'#6e9b97',1.26),
    ...glazing([-.36,.42],[.62],.92,{w:.44,h:.35}),...pair.map(s=>t(.18,s*.79,.41,.13,.4,'#586976',0,'z')),
    beam([1.12,.18,0],[1.66,.14,0],.106,'#8a877c')];
}

function camping(theme,site) {
  const tropical=theme==='island';
  const ground=tropical?'#cbbb86':'#a7aa73';
  const edge=Math.min(6.05,(site?.streetSpan??15.2)*.5-1.48);
  return [base(2*edge,2*edge,ground),
    [...walkway([[0,edge-.23],[0,2.17],[-.72,1.1],[-.26,-1.76],[1.1,-3.66],[.18,-edge+.68]],'#d4c097'),
      ...[[-2.66,-1.83,'#b97570'],[2.95,-1.98,'#64a49c'],[-3.11,1.23,'#e2ae6a']].flatMap(([x,z,color])=>
        [b(x,z,2.31,2.74,.12,'#cfad7e',.34),roof(x,z,2.26,2.66,1.79,color,.46),
          roof(x,z+1.34,1.12,.045,1.08,'#785b57',.49)]),
      ...placeParts(caravanModel(),{x:2.65,y:.35,z:2.15}),
      ...(edge>5.45?[r(3.05,-edge+.85,2.22,1.36,.083,'#a8a37f',.34),
        ...placeParts(caravanModel(),{x:2.96,y:.40,z:-edge+.9,yaw:Math.PI})]:[])],
    [
      ...[[-edge+.77,-edge+.91],[edge-.7,-3.59],[-edge+.78,edge-.97]].flatMap(([x,z])=>broadTree(x,z,theme)),
      ...bench(1.64,-.25),t(.97,.93,1.16,1.16,.18,'#8d8175',.38),
      d(.97,.93,.56,.61,.51,'#e09755',.54),d(.98,.91,.27,.34,.41,'#f4cc7d',.61),
      ...[-.46,.48].flatMap(x=>[b(1.6+x,edge-1.23,.24,.73,.17,'#89725b',.35),
        b(1.6+x,edge-1.23,.57,.74,.088,'#c49e73',.51)]),
      ...[-.39,.42].map(z=>b(1.6,edge-1.23+z,1.82,.14,.077,'#ae845d',.78)),
      ...worldSign('camp',-1.58,1.35,3.67,tropical?'#bd796d':teal)],
  ];
}

function arcade(theme) {
  if (theme==='city') return pixelPalace();
  const main=theme==='moon'?'#7880af':'#4b949c';
  const neon=theme==='moon'?'#a9dded':'#f9bd8b';
  const walls=theme==='moon'?'#aba8ca':'#d6b698';
  return [base(10.29,8.91,'#b4b3ae'),
    [r(0,-.75,7.97,4.86,3.34,walls,.34),r(0,-.85,8.22,5.04,.48,main,3.52),
      r(0,-.57,6.79,4.2,1.06,main,3.96),r(0,1.71,7.74,.85,1.58,main,2.11),
      b(0,2.14,7.7,.099,.13,neon,2.15),b(0,2.14,7.7,.1,.11,neon,3.56),
      ...pair.map(s=>r(s*3.73,1.91,.43,.68,2.99,main,.37))],
    [...entrance(1.69,1.92,1.58),...glazing([-2.64,2.64],[.8],1.72,{w:1.54,h:1.11,color:neon}),
      ...nameplate('ARCADE',0,2.92,2.18,dark,.255,neon),
      r(0,.09,2.84,1.8,.39,'#465673',4.97),beam([-.66,5.34,.14],[-.71,6.44,.06],.16,cream),
      d(-.71,.06,.82,.82,.69,'#e68c9e',6.11),...pair.map(s=>t(.55,s*.38+.08,.41,.43,.22,neon,5.33)),
      ...[-2.92,-2.37,2.36,2.91].map((x,i)=>b(x,2.2,.28,.031,.27,i%2?neon:cream,2.32))],
  ];
}

function pixelPalace() {
  const midnight='#343853',violet='#765383',blue='#78c8cf',pink='#dd78b2',amber='#f5c475';
  const cells=['0111110','1101011','1111111','0110110','1010101'];
  const pixelSign=cells.flatMap((row,j)=>[...row].flatMap((on,i)=>on==='1'?
    [b((i-3)*.34,1.56,.325,.16,.325,j>2?pink:blue,5.94-j*.34)]:[]));
  return [base(10.45,9.28,'#aaa3b2'),[
    r(0,-1.17,8.65,5.68,2.96,midnight,.35),b(0,-1.25,8.93,5.93,.3,violet,3.17),
    b(0,-.43,4.05,4.01,2.85,midnight,3.38),b(0,1.53,3.43,.20,2.02,'#594769',4.29),
    ...pair.flatMap(s=>[b(s*2.89,1.15,1.76,.94,.43,violet,3.22),
      b(s*4.13,1.57,.22,.59,2.82,pink,.42),b(s*4.23,-.83,.14,5.68,.11,blue,2.74)]),
  ],[
    ...pixelSign,...nameplate('PIKSEL',0,3.9,1.65,violet,.23,amber),
    ...entrance(1.76,2.08,1.53),r(0,2.39,5.18,1.48,.26,violet,2.43),
    ...pair.flatMap(s=>[...glazing([s*2.62],[.8],1.75,{w:1.46,h:1.1,color:'#b685ca'}),
      ...[0,1,2,3,4].map(i=>b(s*(1.42+i*.51),3.135,.36,.12,.15,i%2?blue:pink,2.51)),
      ...[0,1,2].map(i=>b(s*4.32,-2.3+i*1.49,.071,.75,.28,amber,1.62+i*.29))]),
    r(3.36,-1.16,2.24,1.53,.24,violet,3.47),beam([3.01,3.67,-1.04],[2.95,4.36,-1.17],.135,amber),
    d(2.95,-1.17,.62,.61,.47,pink,4.24),
    ...[0,1,2].flatMap(i=>[r(-2.85+i*.52,2.68,.4,.38,.19,[pink,blue,amber][i],.39),
      r(2.85-i*.52,2.68,.4,.38,.19,[amber,blue,pink][i],.39)]),
  ]];
}

function eveningCinema() {
  const brick='#9f685b',sand='#e3c294',navy='#3f536c',copper='#c67d60';
  return [base(9.94,9.18,'#b8a98d'),[
    b(0,-1.59,8.02,5.07,3.64,brick,.34),roof(0,-1.59,8.35,5.38,.97,navy,3.97),
    r(0,1.34,4.18,3.21,3.41,sand,.34),
    r(0,1.61,3.47,2.54,.54,copper,3.73),r(0,1.64,2.38,2.14,.49,navy,4.24),
    r(0,2.98,4.97,1.34,.31,navy,2.04),
  ],[
    ...entrance(2.92,2.1,1.54),...nameplate('KINO',0,2.98,2.99,navy,.29,sand),
    t(0,1.77,1.74,.33,1.72,'#bbc9cd',4.72,'z'),
    ...Array.from({length:5},(_,i)=>{const angle=i*Math.PI*2/5;return t(Math.sin(angle)*.53,1.969,.32,.103,.32,navy,5.42+Math.cos(angle)*.53,'z');}),
    ...pair.flatMap(s=>[b(s*2.95,1.02,.83,.14,1.28,navy,.94),
      b(s*2.95,1.104,.65,.07,.96,s<0?'#d89e74':'#77a7b2',1.09),
      ...[0,1,2,3,4].map(i=>d(s*(i+.35)*.47,3.68,.14,.12,.13,sand,2.31))]),
  ]];
}

function cultureHouse() {
  const stone='#d6ba95',trim='#f3deb7',roofTone='#526c80',windows='#73a8b9';
  return [base(10.96,10.53,'#c0af94'),[
    b(0,-1.31,9.14,5.91,4.43,stone,.34),b(0,-1.31,9.38,6.12,.25,trim,4.68),
    roof(0,-1.34,9.54,6.35,1.16,roofTone,4.91),
    r(0,.71,5.34,3.26,5.3,'#9eafaf',.37),b(0,2.27,5.38,.18,4.83,windows,.52),
    roof(0,.77,5.77,3.71,1.51,roofTone,5.48),
    ...pair.flatMap(s=>[b(s*3.79,1.73,1.33,1.74,4.7,stone,.35),
      r(s*3.79,1.73,1.61,1.98,.25,trim,4.92),roof(s*3.79,1.73,1.7,2.06,.95,roofTone,5.15)]),
  ],[
    ...[-2.46,-1.62,-.8,0,.8,1.62,2.46].map(x=>b(x,2.39,.109,.11,4.68,trim,.62)),
    ...[2.17,3.74].map(y=>b(0,2.42,5.28,.1,.11,trim,y)),
    ...entrance(2.48,2.21,2.19),r(0,2.91,5.52,1.29,.22,roofTone,3.08),
    ...nameplate('KULTUR',0,3.63,3.43,roofTone,.23,trim),
    ...[0,1,2].map(i=>b(0,3.04+i*.48,6.2+i*.53,.54,.13,trim,.33-i*.09)),
    ...pair.flatMap(s=>[...glazing([s*3.79],[1.31,2.88],2.65,{w:.69,h:1.05,color:windows}),
      t(s*4.43,3.45,.16,.16,2.19,roofTone,.36),d(s*4.43,3.45,.37,.37,.32,'#f1d29b',2.45)]),
  ]];
}

function radioTower(lunar=false) {
  const mast=lunar?'#b8c8d2':'#ad8570', bright=lunar?'#d2c8ec':'#e3a072';
  const corners=[[-1,-1],[-1,1],[1,1],[1,-1]], levels=[.4,2.32,4.37,6.31,8.25,9.98];
  const node=(index,level)=>{
    const [x,z]=corners[index%4],y=levels[level],span=1.62-y*.113;
    return [x*span+.88,y,z*span-.57];
  };
  return [base(9.67,9.17,lunar?'#a4a8be':'#aaa98d'),
    [...corners.flatMap((_,i)=>[beam(node(i,0),node(i,5),.19,mast),
      ...levels.slice(0,-1).flatMap((_,j)=>[
        beam(node(i,j+1),node(i+1,j+1),.103,bright),
        beam(node(i,j),node(i+1,j+1),.113,mast),
      ])]),
      r(-2.46,1.55,3.2,2.92,1.72,lunar?'#97a6bd':'#c7aa88',.33),roof(-2.46,1.55,3.49,3.07,.65,lunar?'#69577e':'#8f5e4d',2.02)],
    [beam([.88,8.49,-.57],[.88,11.9,-.57],.16,bright),
      t(.88,-.57,.6,.6,.53,'#ecb07f',10.55),d(.88,-.57,.54,.54,.41,'#ef867c',11.51),
      ...pair.flatMap(s=>[beam([.88,9.29,-.57],[.88+s*1.15,9.74,-.57],.115,cream),
        t(.88+s*1.13,-.57,.71,.16,.65,'#e1d3c7',9.45,'z')]),
      ...glazing([-3.32,-1.63],[.97],3.08,{w:.57,h:.54}),
      ...worldSign('radio',-2.45,2.33,3.11,lunar?'#756ea1':teal)],
  ];
}

function broadcastHouse() {
  const wall='#cab29a',brick='#a57667',copper='#658b86',window='#86aab6';
  return [base(10.56,9.68,'#aaa996'),[
    r(-1.04,-.98,6.66,5.7,2.93,wall,.35),r(-1.04,-.99,6.93,5.97,.24,copper,3.12),
    r(-1.39,-1.55,4.69,4.28,1.02,brick,3.33),roof(-1.39,-1.56,4.85,4.43,.88,copper,4.31),
    t(2.77,-1.93,2.48,2.48,4.96,brick,.35),t(2.77,-1.93,2.71,2.71,.21,wall,5.25),
    t(2.77,-1.93,1.71,1.71,1.19,copper,5.43),d(2.77,-1.93,2.45,2.45,.75,copper,6.56),
  ],[
    ...entrance(1.92,1.47,1.55),...glazing([-3.31,-1.74,1.43],[1.05,2.29],1.89,{w:.68,h:.62,color:window}),
    ...nameplate('RADIO',-1.46,2.98,1.96,copper,.218,cream),...worldSign('radio',3.26,3.14,-.73,copper),
    t(2.77,-1.93,.15,.15,1.73,'#b69c73',7.22),d(2.77,-1.93,.35,.35,.26,'#e7a77d',8.89),
    ...pair.flatMap(s=>[beam([2.77,8.29,-1.93],[2.77+s*.73,8.29,-1.93],.081,'#a8b9b6'),
      beam([2.77+s*.68,8.1,-1.93],[2.77+s*.68,8.5,-1.93],.055,'#a8b9b6')]),
    ...bench(-2.52,3.4),...shrub(3.45,2.82,'#78976c',.81),
  ]];
}

function glassTower(style) {
  const deco=style==='deco',hotel=['glassHotel','auroraHotel','lookout'].includes(style);
  const h=deco?12.67:style==='spire'?13.82:style==='lookout'?8.96:9.66;
  const walls=deco?'#bd9e80':style==='auroraHotel'?'#8589b1':'#63a5b1';
  const band=deco?'#957d69':style==='auroraHotel'?'#caabd5':'#a3d0d0';
  const cap=deco?'#78968a':style==='auroraHotel'?'#5f688f':'#477787';
  const w=deco?5.8:hotel?6.87:6.25,d0=4.58,z=-.81;
  const main=[r(0,z,w+1.18,d0+.97,1.53,cap,.34),r(0,z,w,d0,h-3.71,walls,1.86),
    r(0,z,w*.78,d0*.83,1.14,band,h-1.85),r(0,z,w*.66,d0*.68,.79,cap,h-.76)];
  const rows=Array.from({length:Math.floor((h-3.42)/1.12)},(_,i)=>2.14+i*1.12);
  return [base(10.58,9.65,hotel?'#d8c5a6':'#b9b5a6'),main,
    [...entrance(1.99,2.13,1.39),
      ...(deco?[
        ...glazing([-1.92,-.98,0,.98,1.92],rows,1.5,{w:.5,h:.69,color:'#90a9ad'}),
        ...flankWindows(w/2,[-1.96,-.76,.39],rows,{w:.58,h:.64,color:'#90a9ad'}),
        ...[-2.75,-1.45,1.45,2.75].map(x=>b(x,1.51,.15,.12,h-3.4,band,1.61)),
        roof(0,z,w*.56,d0*.58,1.43,cap,h-.12)]
        :[...rows.flatMap((y,i)=>[b(0,1.5,w-.16,.11,.075,band,y),...pair.map(s=>b(s*(w/2+.045),z,.109,d0-.13,.073,band,y)),
          b(-w*.3+(i%3)*.39,1.537,.46,.055,.33,i%2?'#c8e5df':'#8ebdc9',y+.16)]),
          ...[-.38,-.15,.16,.4].map(x=>b(x*w,1.55,.1,.077,h-3.7,band,1.85)),
          ...[-.38,-.06,.29].flatMap(side=>pair.map(s=>b(s*(w/2+.06),z+d0*side,.1,.078,h-3.72,band,1.83))),
          ...(hotel?[r(0,z,w*.76,d0*.77,.18,cream,h+.021),
            ...pair.map(s=>b(s*w*.37,z,.1,d0*.76,.33,band,h+.19))]
            :[t(0,z,.35,.36,2.22,cap,h),d(0,z,.46,.46,.34,'#f4b681',h+1.98)])]),
      ...(hotel?[r(2.48,3.03,3.69,1.8,.21,cream,.36),r(2.48,3.03,3.38,1.52,.045,'#65b7c7',.575),
        ...umbrella(-2.66,3.22,'#d98f90'),...nameplate('HOTEL',0,1.63,2.1,cap,.178)]
        :[...shrub(-3.72,2.58),...shrub(3.72,2.58,'#7c9f6a')])],
  ];
}

function lagoonTower() {
  const mint='#83ae9d',teal='#4f7c87',sand='#efd1a1';
  return [base(10.51,9.49,'#cbb58d'),[
    t(0,-.4,6.92,5.9,.34,'#b6a682',.34),t(0,-.59,3.33,3.27,5.62,mint,.63),
    t(0,-.59,6.26,5.68,.54,sand,6.02),t(0,-.59,5.73,5.13,1.42,'#83b2b8',6.49),
    t(0,-.59,6.36,5.71,.29,teal,7.81),d(0,-.59,5.75,5.32,.93,'#709c96',8.07),
    ...pair.flatMap(s=>[beam([s*2.7,.54,.59],[s*1.79,6.17,.24],.37,teal),
      beam([s*2.65,.54,-2.46],[s*1.79,6.17,-1.53],.37,teal)]),
  ],[
    ...entrance(1.21,1.2,1.73),...nameplate('LAGUNE',0,6.79,2.06,teal,.193,sand),
    ...Array.from({length:12},(_,i)=>{
      const a=i*Math.PI/6;
      return t(2.81*Math.cos(a),-.59+2.56*Math.sin(a),.10,.10,1.22,sand,6.57);
    }),...palm(-4.06,2.61,2.88),...palm(4.02,2.56,2.4),...bench(0,3.51),
    ...[2.26,3.15,4.08,4.97].map(y=>t(0,-.59,3.42,3.37,.104,sand,y)),
  ]];
}

function bookHall() {
  const green='#5e8784';
  return [base(10.22,8.83,'#c3bb9f'),
    [r(-1.4,-.64,5.69,4.83,3.52,'#cbb9a3',.36),r(2.48,-.3,2.48,4.64,2.67,'#7eb0b0',.37),
      roof(-1.43,-.67,5.98,5.17,.9,green,3.84),r(2.49,-.3,2.67,4.78,.23,'#cfae77',3.0)],
    [...glazing([-3.42,-2.13,-.81],[1.09,2.32],1.8,{w:.71,h:.82}),...entrance(2.03,1.33,1.68),
      ...[.79,1.43,2.17,2.83,3.44].map(x=>b(x,2.07,.088,.087,2.54,cream,.44)),
      ...worldSign('book',-1.53,3.19,1.9,green),...bench(-2.5,3.01),...shrub(3.96,2.78)],
  ];
}

function townLibrary() {
  const brick='#ac7463',stone='#f0d2a1',copper='#749f8e',tealGlass='#83b4b6';
  return [base(10.5,9.48,'#b5aa91'),[
    b(0,-1.55,8.45,5.39,3.42,brick,.35),b(0,-1.55,8.71,5.7,.28,stone,3.69),
    r(0,1.08,5.73,4.16,3.12,brick,.35),t(0,1.18,5.97,4.15,.26,stone,3.27),
    d(0,1.19,5.75,4.07,1.45,copper,3.49),
    ...pair.flatMap(s=>[roof(s*2.7,-1.6,3.45,5.84,1.08,copper,3.92),
      r(s*3.34,1.25,1.66,2.02,2.31,'#a76a58',.35),r(s*3.34,1.26,1.76,2.11,.19,stone,2.58)]),
  ],[
    ...entrance(3.17,1.61,1.56),...nameplate('BØKER',0,2.76,3.3,copper,.21,stone),
    ...glazing([-1.93,1.93],[1.12],2.75,{w:.88,h:1.36,color:tealGlass}),
    ...flankWindows(4.24,[-3.2,-1.84,-.49],[1.13,2.68],{w:.7,h:.88,color:tealGlass}),
    ...pair.flatMap(s=>[...glazing([s*3.36],[.98],2.25,{w:.85,h:1.12,color:tealGlass}),
      ...bench(s*2.73,3.81),t(s*3.92,3.4,.29,.29,.3,'#a78262',.35),d(s*3.92,3.4,.78,.7,.53,'#76996c',.59)]),
  ]];
}

function courthouse() {
  const sand='#c8a485',trim='#edcca4',roofTone='#657181',doors='#526778';
  return [base(10.7,9.64,'#bbb198'),[
    ...pair.flatMap(s=>[b(s*3.35,-1.33,2.51,4.22,3.82,sand,.35),
      r(s*3.35,-1.33,2.75,4.48,.26,trim,3.98),roof(s*3.35,-1.34,2.96,4.59,1.26,roofTone,4.19)]),
    b(0,-1.08,4.96,5.39,3.4,sand,.36),b(0,-1.08,5.23,5.52,.24,trim,3.68),
    roof(0,-1.09,5.24,5.61,1.08,roofTone,3.89),r(0,1.6,5.46,1.61,.35,trim,3.11),
    ...[-2.36,-1.36,1.36,2.36].map(x=>t(x,2.17,.28,.28,2.74,'#ead5b6',.37)),
  ],[
    ...entrance(1.64,1.54,1.99),...nameplate('TINGHUS',0,3.9,2.48,doors,.20),
    ...glazing([-3.39,3.39],[.85,2.46],.79,{w:.81,h:1.17,color:'#7ca2af'}),
    ...glazing([-1.62,1.62],[1.3],1.65,{w:.62,h:1.38,color:'#789fae'}),
    ...[0,1,2].map(i=>b(0,2.93+i*.48,5.28+i*.31,.55,.15,trim,.33-i*.086)),
    ...pair.flatMap(s=>[b(s*3.54,3.17,.7,.73,.48,sand,.36),t(s*3.54,3.17,.54,.54,.16,trim,.8),
      d(s*3.54,3.17,.91,.87,.64,'#789269',.93)]),
    ...pair.flatMap(s=>[beam([0,5.32,1.61],[s*1.11,5.32,1.61],.089,brass),
      beam([s*.81,5.30,1.61],[s*.81,4.94,1.61],.046,brass),
      t(s*.81,1.61,.75,.31,.10,brass,4.91)]),
    t(0,1.61,.115,.11,.73,brass,4.69),
  ]];
}

function market(theme) {
  const tropical=theme==='island',shade=tropical?'#5f9481':'#658287';
  const stripe=tropical?'#e5a276':'#b9747e';
  return [base(10.57,9.33,tropical?'#d3b981':'#b7b09b'),
    [r(0,-1.91,8.55,3.93,1.2,'#c49a72',.34),roof(0,-1.83,8.96,4.14,1.1,shade,2.89),
      ...[-3.82,-1.18,1.18,3.82].flatMap(x=>pair.map(s=>t(x,-1.8+s*1.6,.19,.19,2.55,'#a48565',.36))),
      ...[-2.77,0,2.77].flatMap(x=>[r(x,.33,2.12,1.05,.62,'#a47f60',.36),
        ...Array.from({length:5},(_,i)=>b(x+(i-2)*.39,.98,.38,1.11,.09,i%2?cream:stripe,2.15))])],
    [...[-2.77,0,2.77].flatMap((x,i)=>[-.52,0,.52].map((dx,j)=>
      d(x+dx,.45,.37,.45,.27,['#df8c6d','#99b87b','#f0ca7a'][(i+j)%3],.98))),
      ...nameplate('MARKED',0,3.22,.32,shade,.16),
      ...[-3.39,3.36].flatMap(x=>[...umbrella(x,2.59,stripe),...bench(x,3.57)])],
  ];
}

function burger(x,y,z) {
  return [d(x,z,3.06,2.62,.34,'#c79055',y),t(x,z,3.03,2.59,.32,'#845f4b',y+.27),
    t(x,z,3.14,2.71,.14,'#9ab064',y+.57),b(x,z,2.65,2.09,.09,'#f0be56',y+.716),
    t(x,z,2.86,2.51,.15,'#d37d67',y+.79),d(x,z,3.23,2.75,1.1,'#e5ae68',y+.94),
    ...[[-.52,.38],[.43,.41],[0,-.36],[.79,.04],[-.7,-.24]].map(([a,c],i)=>
      d(x+a,z+c,.24,.14,.059,'#f5db9f',y+1.94-i%3*.08,i*.71))];
}

function smoothie() {
  return [t(.2,-.15,1.66,1.46,1.72,'#e49968',3.42),t(.2,-.15,1.81,1.63,.23,cream,5.1),
    d(.2,-.14,1.54,1.37,.32,'#e6a1a5',5.28),beam([.27,5.28,-.15],[.62,6.16,-.2],.19,'#78c4ae'),
    d(-.47,-.19,.86,.55,.39,'#95b873',5.16,.42),d(.03,.57,.51,.18,.42,'#f3d286',4.36)];
}

function snackHouse(style) {
  const bistro=style==='bistro', tropical=['tikiBar','coralCafe'].includes(style), tiki=style==='tikiBar', moon=!tropical&&!bistro;
  const burgerShop=style==='moonBurger', iceShop=style==='cosmicIce';
  const main=tiki?'#b98462':iceShop?'#9a86b7':burgerShop?'#ba796b':style==='coralCafe'?'#d79b89':moon?'#9299b7':'#c39e81';
  const trim=tiki?'#608d77':iceShop?'#4c8fa5':burgerShop?'#654e69':style==='coralCafe'?'#428c92':'#647781';
  const label=burgerShop?'MOON BURGER':iceShop?'COSMIC ICE':tiki?'TIKI':moon?'DUST CAFE':bistro?'BISTRO':'CAFE';
  const awning=iceShop?'#dba7cc':burgerShop?'#edb574':tropical?'#efad82':'#9bbcb2';
  const rooftop=bistro?[
    r(0,-1.06,7.83,4.5,.18,'#f0c996',3.11),
    roof(0,-1.06,7.65,4.38,.78,'#b3634d',3.26),
    b(0,-1.06,.16,4.44,.10,'#c17d60',4),
  ]:[r(0,-1.06,7.83,4.5,.23,moon&&!iceShop&&!burgerShop?'#625574':trim,3.11)];
  return [base(10.2,9.08,moon?'#adb1c3':'#cfb89a'),
    [r(0,-1.16,tiki?5.9:7.59,4.36,2.75,main,.36),
      ...(tiki?[roof(0,-1.08,6.84,4.86,1.14,'#b9a375',2.98),...pair.map(s=>t(s*2.77,1.31,.3,.3,2.42,'#946954',.39))]
        :[...rooftop,r(0,1.01,7.38,.36,.21,awning,2.96)]),
      b(0,2.32,8.81,2.48,.07,moon?'#c2b5c8':'#c1a27e',.349)],
    [...entrance(1.07,1.25,1.57),...glazing([-2.28,2.28],[1.11],1.067,{w:1.51,h:.94,color:'#85c5ca'}),
      ...Array.from({length:13},(_,i)=>b((i-6)*.49,1.49,.48,.98,.123,i%2?cream:awning,2.16)),
      ...nameplate(label,0,2.71,1.15,trim,tiki?.24:.171),
      ...(burgerShop?burger(0,3.35,-1.12):iceShop?worldSign('ice',0,4.61,-.27,trim):tiki?smoothie():worldSign('cup',0,bistro?4.32:3.79,.5,trim)),
      ...umbrella(-2.8,2.57,awning),...umbrella(2.73,2.65,trim),
      ...(tropical?palm(-4.21,-1.81,2.57):shrub(4.19,-1.43,'#8aab98'))],
  ];
}

function strandCafe() {
  const wall='#d6a17e',teal='#60978e',sand='#f1d8a9';
  return [base(9.95,8.6,'#d3b989'),[
    r(-1.02,-1.33,6.05,3.93,2.28,wall,.35),roof(-1.02,-1.36,6.51,4.34,1.33,'#b9815f',2.61),
    r(.64,1.91,7.93,3.04,.15,sand,.34),
    ...pair.flatMap(s=>[t(s*3.44,2.12,.15,.15,2.08,'#ae8a63',.45),
      t(s*3.44,3.23,.15,.15,1.68,'#ae8a63',.44),
      beam([s*3.44,2.53,2.12],[s*3.44,2.08,3.23],.1,'#ad8662')]),
    ...[-2.92,-1.95,-.97,0,.97,1.95,2.92].map((x,i)=>b(x,2.68,.94,1.34,.083,i%2?teal:sand,2.28)),
  ],[
    ...entrance(.65,1.42,1.52),...glazing([-2.93,1.28],[.92],.66,{w:.94,h:.88,color:'#85b5b8'}),
    ...worldSign('cup',-1.23,2.62,.72,teal),...umbrella(2.73,3.1,'#da968b'),
    ...palm(-3.99,3.06,2.67),...bench(1.01,3.15),...bench(-1.9,3.12),
  ]];
}

function driveThrough(theme) {
  const moon=theme==='moon',island=theme==='island';
  const trim=moon?'#68628a':island?'#368b82':'#a24841';
  const wall=moon?'#a7aaca':island?'#f0ca81':'#edd7b0';
  const lane=moon?'#64657f':'#666e70',stripe='#ffebac';
  return [base(10.9,10.5,moon?'#a5a6c1':'#b7a995'),
    [r(0,-2.23,7.5,4.55,2.35,wall,.35),r(0,-2.24,7.88,4.76,.35,trim,2.66),
      r(0,1.63,10.28,1.84,.09,lane,.35),
      ...pair.flatMap(side=>[b(side*4.26,3.44,1.78,4.2,.08,lane,.35),b(side*4.26,4.24,.09,1.35,.026,stripe,.44)]),
      b(0,1.52,.87,.09,.026,stripe,.46)],
    [b(0,.105,1.71,.15,.93,'#9ed3d2',1.01),b(0,.25,1.91,.43,.13,trim,.93),
      r(0,.28,3.44,1.27,.17,trim,2.37),...nameplate(moon?'ROVER':island?'MANGO':'BURGER',0,2.94,.14,trim,.22),
      ...(island?smoothie().map(part=>({...part,z:part.z-1.2})):burger(0,3.04,-2.1)),
      ...pair.map(side=>t(side*4.96,2.13,.23,.23,.77,trim,.37))]];
}

function headquartersModel(theme) {
  if (theme==='moon') {
    return [...lunarArchitecture('haloTower',art.haloTower(),47).flat(),
      ...nameplate('HQ',0,2.84,2.9,'#66548a',.32),
      t(0,-1.28,.17,.17,4.4,'#a8acc9',3.4),d(0,-1.28,1.46,1.28,.45,'#a6dbe6',7.68)];
  }
  if (theme==='island') {
    const wall='#efc6a0',trim='#fff1ce',roofTone='#418c84';
    return [...base(10.62,9.5,'#d0b78c'),
      r(0,-.74,8.8,5.4,3.25,wall,.35),r(0,-.74,9.18,5.75,.24,trim,3.52),
      roof(0,-.76,9.43,5.92,1.14,roofTone,3.73),
      r(0,-1.1,3.05,2.64,1.9,wall,4.4),roof(0,-1.1,3.42,2.98,1.19,roofTone,6.22),
      t(0,-1.1,.15,.15,.8,'#b28553',7.39),b(.38,-1.1,.78,.09,.44,'#f2a77c',7.75),
      ...glazing([-3.16,-1.68,1.68,3.16],[1,2.22],2.01,{w:.85,h:.69,color:'#74b7b5'}),
      ...glazing([0],[5.25],.24,{w:.85,h:.72,color:'#74b7b5'}),...entrance(2.04,1.6,1.92),
      r(0,2.83,5.6,1.68,.25,roofTone,2.89),
      ...[-2.57,-1.72,1.72,2.57].map(x=>t(x,3.46,.22,.22,2.59,trim,.35)),
      ...pair.flatMap(side=>palm(side*4.35,3.07,3.53)),
      ...nameplate('PALMEØYA',0,3.04,3.72,'#34716b',.16)];
  }
  return civic(false).flat();
}

export function regionalHeadquarters(theme) {
  return detailFacades([headquartersModel(theme)],theme,'headquarters').flat();
}

function hoverDealer() {
  const slate='#675475',blue='#70aeb6';
  return [base(10.77,9.53,'#aaaec4'),
    [r(-.95,-2.44,7.71,3.03,2.6,'#9eadd2',.35),r(-.95,-2.46,7.94,3.24,.38,slate,2.85),
      b(-.95,-.86,7.51,.13,1.68,blue,.69),
      ...pair.map(s=>t(s*2.25,1.66,3.24,2.92,.205,'#b4b3c4',.35))],
    [...pair.flatMap((s,i)=>[
      t(s*2.25,1.66,2.49,2.41,.048,'#80c9ce',.55),
      ...parkedVehicle('hover',i?'#e29d71':'#c2729b',{x:s*2.25,y:.73,z:1.62,yaw:s*.38})]),
      ...[-3.96,-2.39,-.83,.72,2.29].map(x=>b(x,-.75,.087,.078,1.91,cream,.62)),
      ...pair.map(s=>beam([s*.72+2.08,.34,-.95],[s*.72+2.08,4.08,-.95],.2,slate)),
      ...nameplate('MOON MOTORS',2.08,4.07,-.94,'#af6e8d',.126),
      ...worldSign('hover',3.12,2.18,-.74,'#677d9d')],
  ];
}

function ringHabitat() {
  const pods=[[-2.53,-1.25,'#a1b5d1'],[2.54,-1.25,'#94bad0'],[0,2.07,'#c3a5ca']];
  return [base(10.52,9.49,'#b2b4cc'),
    [t(0,-.07,3.59,3.45,.83,'#929dbb',.37),d(0,-.07,2.72,2.65,1.19,'#78adbc',1.12),
      ...pods.flatMap(([x,z,color])=>[t(x,z,3.12,2.98,.97,color,.35),d(x,z,3.09,2.96,1.92,color,1.29),
        beam([0,.82,-.07],[x,.82,z],.67,'#8fb2c3')])],
    [...pods.flatMap(([x,z])=>[
      t(x,z,3.14,2.99,.13,cream,1.27),...glazing([x-.53,x+.53],[.77],z+1.42,{w:.49,h:.4}),
      d(x,z,1.14,1.06,.27,'#f3cb89',3.02)]),
      ...worldSign('home',3.24,1.16,3.32,'#6b79a7')],
  ];
}

function solarGarden() {
  return [base(10.6,9.65,'#9da6bd'),
    [...[-3.1,0,3.1].flatMap(x=>[-1.94,1.35].flatMap(z=>[
      t(x,z,.34,.36,1.65,'#788caa',.34),
      beam([x-1.1,1.62,z+.77],[x+1.1,2.03,z-.77],.12,'#c2cfdd'),
      b(x,z,2.69,2.13,.15,'#4f719e',1.98)]))],
    [...[-3.1,0,3.1].flatMap(x=>[-1.94,1.35].flatMap(z=>[
      ...[-.85,-.28,.28,.85].map(dx=>b(x+dx,z,.055,1.99,.027,'#91b6cd',2.13)),
      ...[-.49,0,.49].map(dz=>b(x,z+dz,2.52,.047,.023,'#92b1c9',2.134))])),
      ...worldSign('battery',-2.83,1.13,3.55,'#697db0')],
  ];
}

function moonWorks(style) {
  const garage=style==='roverGarage', workshop=style==='moonWorkshop', depot=style==='cargoDepot';
  const tint=garage?'#74a4af':workshop?'#a183a8':depot?'#8899bb':'#6386a9';
  const shell=garage?'#b0c5ca':workshop?'#c1abc8':'#a8b6cd';
  const tower=garage?4.89:workshop?6.12:depot?5.67:7.23;
  const bridge=tower-1.72;
  const mast=(x,z,height,size)=>[
    ...pair.map(s=>beam([x+s*.85,.36,z+.19],[x+s*.26,height-.54,z],.16,'#8699b0')),
    t(x,z,.71,.75,height-1.01,shell,.35),t(x,z,size,size*.91,.47,tint,height-.87),
    t(x,z,size*.94,size*.88,.64,'#70a7b9',height-.42),
    d(x,z,size*1.05,size*.94,.53,shell,height+.12),
    t(x,z,.115,.116,.64,'#d4c6bc',height+.58),d(x,z,.23,.23,.21,'#efba7c',height+1.16),
  ];
  const containers=[[-.32,2.45,.8],[1.08,2.56,1.3],[2.56,2.62,1.02]].map(([x,z,h],i)=>
    [r(x,z,1.13,1.5,h,['#b3a0be','#70a7af','#c6a178'][i],.35),
      ...[-.36,-.14,.09,.32].map(dx=>b(x+dx,z+.755,.07,.025,h*.83,cream,.41))]).flat();
  return [base(10.59,9.67,'#a7aabd'),
    [r(0,-.73,6.9,4.36,garage?2.03:2.57,shell,.34),d(0,-.73,7.04,4.47,.71,tint,garage?2.36:2.91),
      ...mast(-2.68,-1.62,tower,2.98),...mast(2.93,-1.62,tower-1.3,2.48)],
    [t(.16,-1.62,4.89,1.15,.93,'#87bed0',bridge,'x'),
      ...[-1.96,-1.33,-.68,.01,.66,1.29,1.97].map(x=>t(x,-1.62,.091,1.23,1.04,'#c7d5e0',bridge-.04,'x')),
      beam([-2.29,bridge-.13,-1.62],[2.61,bridge-.13,-1.62],.18,tint),
      ...[-1.91,1.9].flatMap((x,i)=>[r(x,1.51,2.06,.1,1.58,dark,.38),
        r(x,1.59,1.89,.088,.23,'#83bed0',1.53),b(x,1.73,2.12,.39,.116,'#d2d9e0',.38),
        b(x,2.56,.075,1.78,.014,i?cream:'#e2b685',.38)]),
      ...(garage?pair.flatMap((s,i)=>parkedVehicle('rover',i?'#6e9fb6':'#d7aa78',{x:s*2.12,y:.377,z:2.93,yaw:s*.2}))
        :workshop?[r(2.85,2.78,1.35,.92,.51,'#a292b1',.36),t(2.85,2.75,.51,.56,.17,brass,.83),
          ...pair.map(s=>beam([2.9+s*.48,.37,3.48],[2.9+s*.48,1.6,3.48],.12,tint))]
        :containers),
      ...worldSign(garage?'wheel':workshop?'gear':'crate',.01,1.76,1.65,tint)],
  ];
}

function pool(x,z,w,depth) {
  return [r(x,z,w+.34,depth+.34,.23,cream,.35),r(x,z,w,depth,.045,'#65bec4',.578),
    b(x-w*.21,z+depth*.32,w*.44,.044,.01,'#a9e4e0',.625)];
}

function megaResort(site) {
  const creamWall='#dec0a1',pink='#c48e84',water='#5e9fa4';
  const towers=pair.flatMap(s=>[
    r(s*3.66,-1.92,2.91,4.85,6.35,pink,.36),
    r(s*3.66,-2.37,2.81,3.5,1.91,creamWall,6.67),
    roof(s*3.66,-2.36,3.13,3.82,1.04,'#668d8c',8.55),
  ]);
  const stages=[base(10.92,10.02,'#d6bd93'),
    [r(0,-2.15,5.81,4.59,4.82,creamWall,.35),r(0,-2.28,6.11,4.67,.28,pink,5.13),
      r(0,-2.19,4.36,3.26,1.36,creamWall,5.36),r(0,-2.22,4.55,3.42,.22,water,6.69),
      ...towers,...pool(-1.77,2.41,3.27,2.58),...pool(2.03,2.68,3.47,2.27)],
    [...[1.19,2.5,3.77,4.64].flatMap(y=>[
      ...glazing([-1.95,-.65,.65,1.95],[y],.21,{w:.71,h:.65,color:'#74b5bd'}),
      b(0,.59,5.87,.59,.13,cream,y-.14),
    ]),
      ...pair.flatMap(s=>[...glazing([s*3.66-.62,s*3.66+.61],[1.17,2.38,3.64,4.91,5.78],.56,{w:.63,h:.62}),
        ...[1.18,2.4,3.66,4.93,5.79].map(y=>b(s*3.67,.86,2.85,.67,.11,cream,y-.1)),
        ...glazing([s*3.66],[7.27],-.58,{w:1.09,h:.76}),
        ...palm(s*4.68,2.87,2.87),...umbrella(s*.8,4.03,s<0?'#e3a28c':'#78b6ae')]),
      ...entrance(.24,1.81,1.19),...nameplate('LAGUNE',0,5.94,-.45,'#68848c',.176)],
  ];
  if (!site?.beach) return stages;
  const widen=([x,y,z])=>[x*1.5,y,z*1.22];
  return stages.map(parts=>parts.map(part=>({
    ...part,x:part.x*1.5,z:part.z*1.22,
    ...(part.w!==undefined&&{w:part.w*1.5,d:part.d*1.22}),
    ...(part.from&&{from:widen(part.from),to:widen(part.to)}),
    ...(part.outline&&{outline:part.outline.map(widen)}),
  })));
}

function lunarResort() {
  const pearl='#d2c9d6',violet='#665c8c',gold='#e9bd80',aqua='#90d3df';
  const dust='#b3a8c5',terrace='#b9b2c9';
  const towers=pair.flatMap(side=>{
    const x=side*5.2,z=-2.86;
    const upper=side>0?5.75:6.65;
    return [r(x,z,4.87,5.12,2.23,pearl,.35),t(x,z,3.97,4.35,upper-2.42,pearl,2.57),
      t(x,z,4.06,4.46,.68,'#77a6bd',upper+.15),t(x,z,4.61,4.9,.22,gold,upper+.81),
      d(x,z,4.64,4.92,.68,violet,upper+.98),d(x,z,1.31,1.36,.31,aqua,upper+1.61)];
  });
  const arcs=pair.flatMap(side=>[1.18,2.07,3.18,4.24].flatMap(y=>
    glazing([side*5.2-.85,side*5.2+.86],[y],y>2.4?-.72:-.29,{w:.66,h:.49,color:'#86bdd0'})));
  const lounges=pair.flatMap(side=>[1.52,4.1].flatMap((z,i)=>{
    const x=side*(5.45+i*.42),stripe=side>0?'#aa83b8':'#64aab6';
    return [t(x+.77*side,z,.13,.13,1.97,pearl,.37),
      d(x+.77*side,z,2.48,2.24,.46,stripe,2.22),d(x+.77*side,z,1.22,1.13,.2,gold,2.51),
      r(x-.58*side,z+.43,.88,1.86,.21,violet,.37),
      r(x-.58*side,z+.67,.71,1.17,.13,stripe,.59),
      beam([x-.58*side,.6,z+.16],[x-.58*side,.95,z-.44],.51,stripe),
      d(x+1.67*side,z+.69,.48,.46,.39,'#a7cfd9',.38)];
  }));
  const rim=[
    r(0,2.9,9.6,5.16,.25,'#eee1d5',.35),
    r(0,2.9,8.98,4.48,.075,dust,.575),
    ...[-3.1,-1.74,-.48,1.36,2.89].map((x,i)=>d(x,2.62+(i%3)*.69,1.95,2.02,.094,
      ['#bfb3cc','#c7bbd2','#a89db9'][i%3],.64)),
    ...pair.flatMap(side=>[-2.91,-1.45,.08,1.62,3.11].map(x=>
      b(x,2.9+side*2.38,.46,.1,.052,'#b2e3e1',.597))),
  ];
  return [base(16.8,12.52,terrace),
    [r(0,-3.48,6.22,4.04,4.68,pearl,.34),r(0,-3.51,6.48,4.15,.26,violet,5.01),
      t(0,-3.49,4.47,3.66,2.32,pearl,5.24),t(0,-3.49,4.91,4.12,.58,'#71acbf',7.34),
      t(0,-3.49,6.48,5.29,.24,gold,7.89),d(0,-3.49,5.57,4.75,.92,violet,8.07),
      t(0,-3.48,.15,.16,1.34,pearl,8.77),d(0,-3.48,.69,.65,.31,aqua,10.04),
      ...pair.flatMap(side=>[b(side*3.48,-2.84,3.7,1.23,.85,'#89b8c8',3.05),
        b(side*3.48,-2.84,3.88,1.38,.14,violet,3.84)]),
      ...towers,...rim],
    [...arcs,...glazing([-2.02,-.84,.84,2.02],[1.18,2.46,3.74],-1.37,{w:.66,h:.64,color:'#7caec6'}),
      ...entrance(-1.37,1.49,1.61),...nameplate('LUNA',0,4.56,-1.37,violet,.205),
      ...lounges,...pair.flatMap(side=>[-3.25,.45,4.85].map(z=>t(side*7.48,z,.17,.19,.53,gold,.35))),
      ...pair.flatMap(side=>[-3.47,3.48].map(x=>d(x,5.71,.57,.54,.22,aqua,.38)))],
  ];
}

function tropicalPools() {
  return [base(10.53,9.75,'#d8bf95'),
    [r(-2.59,-2.45,4.14,2.82,.27,'#a98d70',.35),roof(-2.59,-2.48,4.42,3.11,1.2,'#6f9e89',2.39),
      ...pair.flatMap(s=>pair.map(q=>t(-2.59+s*1.91,-2.46+q*1.21,.19,.19,1.8,'#a4866c',.57))),
      ...pool(1.93,-.93,4.68,5.38),...pool(-1.83,1.95,2.59,2.43)],
    [...palm(4.44,2.16,2.68),...palm(-4.37,2.62,2.38),
      ...umbrella(-3.27,2.67,'#dd997d'),...umbrella(2.11,2.83,'#74adac'),
      ...[.3,1.62,2.96].map(x=>r(x,3.54,.59,1.06,.15,'#e3ac88',.41)),
      ...worldSign('wave',-2.6,2.74,-.89,'#648e8c')],
  ];
}

function lagoonPark() {
  const green='#95ae76',path='#e6c995',reed='#66976b';
  return [base(10.52,9.67,'#aab685'),[
    r(0,0,10.19,9.36,.073,green,.34),t(-.95,-.48,6.66,4.83,.15,'#d0c391',.407),
    t(-.95,-.48,6.29,4.46,.051,'#5ba9ae',.556),t(-1.65,-.96,2.78,1.94,.019,'#82c7bd',.606),
    ...walkway([[.25,4.29],[2.68,3.1],[3.71,1.7],[3.96,-.4],[3.37,-2.38],[1.27,-3.7],[-1.19,-3.76],[-3.17,-2.88]],path,.76,.41),
    b(-.73,-.13,1.11,3.33,.12,'#c1a37d',.63),b(-.73,-.14,1.33,1.39,.13,'#d1b28a',.72),
  ],[
    ...[-1.94,-1.29,.38,1.21].flatMap((z,i)=>pair.map(s=>t(-.73+s*.63,z,.12,.13,.74,'#a88f70',.39+i*.01))),
    ...[[-3.72,-2.81],[3.68,-2.71],[-3.71,2.56],[3.72,2.53]].flatMap(([x,z],i)=>palm(x,z,2.49+i*.17)),
    ...[[-3.34,-1.17],[.7,-2.21],[1.41,1.08],[-2.66,1.3]].flatMap(([x,z],i)=>[
      t(x,z,.28,.32,.03,reed,.621),d(x,z,.15,.16,.13,i%2?'#f1c178':'#e99baa',.65)]),
    ...bench(2.22,3.36),...worldSign('leaf',-1.58,1.6,3.42,reed),
  ]];
}

export function airportRunway(kind) {
  if (kind==='shuttlePort'||kind==='majorAirport') {
    return {x:0,y:.464,z:-1.35,yaw:Math.PI/2,length:kind==='shuttlePort'?19.4:19.8,width:3.2};
  }
  return kind==='airstrip'
    ? {x:1.78,y:.464,z:0,yaw:0,length:10.75,width:3.16}
    : {x:.06,y:.464,z:-.07,yaw:Math.PI/4,length:12.6,width:2.36};
}

export function lightPlaneModel() {
  const body='#ecd3a3',trim='#b96c65',glass='#79a9b9';
  return [
    r(0,-.06,.55,2.08,.41,body,.14),d(0,.74,.53,.62,.31,body,.2),
    r(0,.12,.43,.54,.2,glass,.45),r(0,.04,2.15,.55,.13,trim,.61),
    b(0,-.91,1.07,.3,.08,trim,.36),b(0,-.86,.08,.34,.44,trim,.43),
    t(0,1.046,.17,.12,.18,'#708089',.29,'z'),
    beam([-.27,.16,1.13],[.27,.57,1.13],.071,'#454c57'),
    ...pair.flatMap(side=>[beam([side*.19,.22,.3],[side*.85,.63,.04],.057,body),
      beam([side*.16,.28,.29],[side*.31,.115,.46],.068,trim),t(side*.31,.46,.11,.25,.25,dark,.013,'x')]),
  ];
}

export function planeModel() {
  return [r(0,0,.93,3.41,.52,'#eee5d6',.16),d(0,1.51,.87,1.12,.39,'#e7e4dc',.23),
    r(0,1.03,.81,.64,.31,'#649dae',.49),b(0,-1.31,.09,.61,.67,'#c87c7b',.44),
    ...pair.flatMap(s=>[
      {...b(s*1.03,-.11,1.92,.71,.12,'#8cb5bf',.38),angle:s*-.23},
      b(s*.43,-1.23,.9,.38,.092,'#c87c7b',.5),
      t(s*.8,-.11,.36,.71,.36,'#b5c3c3',.23,'z'),
      ...[-.96,-.55,-.15,.24].map(z=>b(s*.464,z,.055,.179,.18,'#77aab5',.37)),
      t(s*.37,.22,.12,.23,.22,dark,.05,'x'),
    ]),t(0,1.01,.14,.22,.22,dark,.05,'x')];
}

export function shuttleModel() {
  const pearl='#e6e7e2', graphite='#465265', glow='#93d9df';
  return [r(0,-.23,1.28,3.42,.66,pearl,.18),d(0,1.42,1.24,1.2,.48,pearl,.25),
    r(0,.68,1.03,.8,.28,graphite,.67),b(0,-1.21,.16,.78,.86,'#826fa1',.72),
    ...pair.flatMap(side=>[
      {...b(side*.94,-.55,1.62,.86,.13,pearl,.31),angle:side*.47},
      {...b(side*1.48,-.89,.37,.46,.13,'#a18abe',.32),angle:side*.38},
      t(side*.35,-1.92,.49,.26,.45,graphite,.3,'z'),
      t(side*.35,-2.05,.33,.08,.28,glow,.38,'z'),
      t(side*.43,-.79,.12,.23,.23,graphite,.05,'x'),
    ]), t(0,.83,.14,.21,.21,graphite,.04,'x')];
}

function regionalAirport(shuttle=false,tropical=false) {
  const runway=airportRunway(shuttle?'shuttlePort':'majorAirport');
  const strip={...runway,y:0};
  const [x,y,z]=pointOnSite([0,0,1.32-runway.length*.5],runway);
  const color=shuttle?'#a6a2bf':tropical?'#edc79d':'#a3bbc0';
  const hangar=shuttle?'#7e79a1':tropical?'#4e9388':'#577b90';
  const terminal=shuttle?'#658ba5':tropical?'#4e8c89':'#577e8b';
  const marks=Array.from({length:13},(_,i)=>(i-6)*1.42);
  return [
    [...base(21.65,13.65,shuttle?'#a09db1':tropical?'#abaf81':'#94a382'),...airfieldGround(runway,21.65,13.65,shuttle?'moon':tropical?'island':'city')],
    [...placeParts([b(0,0,runway.width,runway.length,.059,'#536577',.404)],strip),
      r(-3.7,3.9,6.8,3.22,2.13,color,.34),roof(-3.7,3.9,7.02,3.54,.83,hangar,2.47),
      r(4.6,3.72,4.24,2.79,1.67,color,.34),r(4.6,3.72,4.45,2.98,.21,hangar,2),
      r(7.65,2.75,1.27,1.29,3.02,color,.35),r(7.65,2.75,1.89,1.75,.86,terminal,3.34),
      r(7.65,2.75,2.04,1.91,.18,hangar,4.18),
      b(.17,.61,.77,1.51,.09,'#89959f',.386)],
    [...placeParts([
      ...marks.map(z=>b(0,z,.093,.79,.026,cream,.465)),
      ...pair.flatMap(s=>marks.map(z=>t(s*1.48,z,.105,.105,.113,shuttle?'#84e7df':'#f5d388',.434))),
      ...pair.flatMap(s=>[-.76,-.4,.4,.76].map(a=>b(a,s*(runway.length*.5-.36),.14,.43,.025,cream,.464))),
    ],strip),
    ...[-5.83,-3.87,-1.91,3.24,5.33].map(a=>b(a,1.46,.063,1.47,.025,'#e0bd70',.423)),
    ...glazing([-5.9,-4.4,-2.9,-1.4],[1.21],5.53,{w:.93,h:.79}),
    ...glazing([3.44,4.6,5.76],[.89],5.13,{w:.82,h:.66}),
    ...worldSign(shuttle?'radio':'plane',-.83,2.16,5.53,terminal),
    ...(shuttle?[]:helipadParts(REGIONAL_HELIPAD)),
    ...placeParts(shuttle?shuttleModel():planeModel(),{x,y,z,yaw:runway.yaw}).map(part=>({...part,flight:shuttle?'shuttle':'plane'}))],
  ];
}

function airfieldGround(runway,width,depth,theme) {
  const moon=theme==='moon',island=theme==='island';
  const lawn=moon?['#a8a2b7','#9691a7','#9e9cb0','#ada9b9']:island?['#a9b57e','#b8b982','#9da972','#c3ba87']
    :['#95a47d','#a4ad84','#8e9e77','#b0b792'];
  const slab=moon?'#878a9e':island?'#a9a9a0':'#939c9a';
  const ground=[
    r(0,0,width-.33,depth-.31,.027,lawn[1],.378),
    ...placeParts([b(0,0,runway.width+.68,runway.length+.11,.022,moon?'#898ca3':'#a4a898',.406)],{...runway,y:0}),
  ];
  if (width>15) {
    ground.push(b(0,2.08,width-2.1,3.43,.034,slab,.383),
      b(-2.44,.02,1.33,2.48,.038,slab,.386),b(2.67,.02,1.33,2.48,.038,slab,.386),
      ...Array.from({length:12},(_,i)=>b((i-5.5)*1.57,2.2,.032,3.08,.009,'#737d83',.419)));
  } else ground.push(b(-3.01,2.84,3.71,2.03,.038,slab,.39),b(.21,1.24,3.54,.92,.036,slab,.39));
  const c=Math.cos(runway.yaw),s=Math.sin(runway.yaw);
  for (let i=0;i<82;i++) {
    const x=(.5-((i*37+3)%83)/83)*(width-.8);
    const z=(.5-((i*51+7)%83)/83)*(depth-.82);
    const a=x-runway.x,b0=z-runway.z,across=a*c-b0*s,along=a*s+b0*c;
    if (Math.abs(across)<runway.width*.5+.48&&Math.abs(along)<runway.length*.5+.18
      ||width>15&&z>.32&&z<4.12&&Math.abs(x)<width*.5-1) continue;
    const color=lawn[(i+Math.floor(i/9))%lawn.length];
    ground.push({shape:'landscape',outline:[[x-.13,.416,z-.19],[x+.31,.416,z-.16],[x+.23,.416,z+.17],[x-.19,.416,z+.13]],
      x,y:.416,z,h:0,color,layer:7.425});
    if (i%5===2&&(width<15||z<.27||Math.abs(x)>8.1)) ground.push(
      ...(moon?[d(x,z,.26,.22,.13,'#bcb1bd',.407)]
        :[b(x,z,.047,.05,.12,'#7e9368',.408),b(x+.12,z+.04,.051,.052,.17,'#a2ad78',.408)]));
  }
  return ground;
}

function airport(tiny=false,tropical=false) {
  const terminal=tiny?'#a9b99d':'#93b5b6',roofTone=tiny?'#9d796a':'#597b91';
  const runway=airportRunway(tiny?'airstrip':'airport'),site={...runway,y:0};
  const [px,py,pz]=pointOnSite([0,0,(tiny?.74:1.08)-runway.length/2],runway);
  const x=tiny?-2.75:-3.13,z=tiny?-.86:2.71,w=tiny?3.52:3.45,d0=tiny?3.6:3.15;
  const strip=[b(0,0,runway.width,runway.length,.059,tiny?'#9a936e':'#647b89',.404)];
  const markings=[...[-4.3,-2.86,-1.42,0,1.42,2.86,4.3].map(z=>b(0,z,.09,.72,.02,cream,.465)),
    ...pair.flatMap(s=>[-5.8,-4.21,-2.74,-1.36,1.36,2.74,4.21,5.8].filter(z=>Math.abs(z)<runway.length/2).map(z=>
      t(s*(runway.width*.5-.066),z,.11,.11,.12,'#ebca87',.431))),
    ...pair.flatMap(s=>[-.63,-.32,.32,.63].map(x=>b(x,s*(runway.length*.5-.36),.12,.35,.019,cream,.468)))];
  const width=tiny?10.73:10.96,depth=tiny?10.79:10.93;
  return [[...base(width,depth,'#a3ac88'),...airfieldGround(runway,width,depth,tropical?'island':'city')],
    [...placeParts(strip,site),r(x,z,w,d0,2.17,terminal,.34),
      roof(x,z,w+.24,d0+.21,.91,roofTone,2.49),
      ...(tiny?[]:[r(3.48,-3.06,1.48,1.55,3.08,'#a1b6bb',.36),r(3.48,-3.06,1.92,1.88,.89,'#72aaba',3.42),
        r(3.48,-3.06,2.09,2.07,.19,roofTone,4.28),r(-3.08,4.54,3.43,.79,.24,'#d7c59f',.35)])],
    [...placeParts(markings,site),...(tiny?[]:helipadParts()),...glazing([x-1.08,x,x+1.08],[1.04],z+d0/2+.013,{w:.67,h:.81}),
      ...worldSign('plane',x,2.17,z+d0/2+.09,roofTone),
      ...placeParts(tiny?lightPlaneModel():planeModel(),{x:px,y:py,z:pz,yaw:runway.yaw}).map(part=>({...part,flight:'plane'}))],
  ];
}

function lighthouse(island) {
  const paint=island?'#d88b70':'#b96a61';
  return [
    [...base(6.8,6.5,'#b7b095'),d(0,0,5.5,4.9,.98,'#949d8b',.37)],
    [t(0,0,2.19,2.19,1.73,cream,.72),t(0,0,1.96,1.96,1.35,paint,2.43),
      t(0,0,1.84,1.84,1.37,cream,3.76),t(0,0,1.76,1.76,.65,paint,5.13),
      r(0,.99,.62,.16,1.09,dark,1.11)],
    [t(0,0,2.62,2.62,.26,dark,5.76),t(0,0,1.43,1.43,1.16,'#7cb9c7',6.01),
      t(0,0,.62,.62,.88,'#f5db8a',6.14),d(0,0,2.14,2.14,.83,paint,7.14),
      ...[-Math.PI/2,Math.PI/2,Math.PI].flatMap(yaw=>placeParts([
        ...glazing([0],[2.88],.96,{w:.29,h:.46}),...glazing([0],[4.2],.90,{w:.28,h:.44}),
      ],{x:0,y:0,z:0,yaw})),
      ...Array.from({length:10},(_,i)=>t(Math.sin(i*Math.PI/5)*1.18,Math.cos(i*Math.PI/5)*1.18,.095,.095,.49,cream,6.01))],
  ];
}

function stoneLighthouse(theme) {
  const top=theme==='island'?'#4b7780':'#606c72';
  const stones=['#a19c8d','#b1a99a','#bcb3a0','#8e8d85','#c0b8a7'];
  const courses=Array.from({length:15},(_,i)=>{
    const radius=1.52-i*.044,level=.76+i*.416;
    const count=12,angle=i%2*Math.PI/count;
    return [t(0,0,2*radius-.09,2*radius-.09,.433,'#807b71',level-.012),
      ...Array.from({length:count},(_,j)=>{
        const a=2*Math.PI*j/count+angle,x=Math.sin(a)*radius,z=Math.cos(a)*radius;
        return {...r(x,z,radius*.485,.28,.389,stones[(i*13+j*7)%stones.length],level),angle:-a};
      })];
  }).flat();
  return [
    [...base(6.92,6.58,'#a9a091'),d(0,0,5.51,4.89,.99,'#9c9f8b',.33)],
    [...courses,t(0,0,3.45,3.45,.26,top,6.96),t(0,0,3.17,3.17,.12,'#ded5b7',7.18),
      t(0,0,2.03,2.03,1.39,'#80aeb9',7.24),t(0,0,2.62,2.62,.24,top,8.57)],
    [t(0,0,.89,.89,1.25,'#f0d37e',7.33),d(0,0,2.76,2.76,1.13,top,8.72),
      t(0,0,.12,.12,.58,'#bd985d',9.74),d(0,0,.25,.25,.23,'#e6b564',10.22),
      r(0,1.46,.76,.27,1.22,'#54565a',.56),b(0,1.66,.98,.39,.17,'#d2c4a6',.44),
      ...Array.from({length:12},(_,i)=>{
        const a=i*Math.PI/6,x=Math.sin(a),z=Math.cos(a);
        const next=[1.53*Math.sin(a+Math.PI/6),7.84,1.53*Math.cos(a+Math.PI/6)];
        return [t(x, z,.10,.1,1.34,top,7.25),t(x*1.53,z*1.53,.084,.084,.59,top,7.26),
          beam([x*1.53,7.84,z*1.53],next,.077,top)];
      }).flat(),
      ...[0,Math.PI*.5,Math.PI,Math.PI*1.5].flatMap(yaw=>placeParts([
        ...glazing([0],[3.32],1.34,{w:.30,h:.65}),...glazing([0],[5.53],1.12,{w:.31,h:.56}),
      ],{x:0,y:0,z:0,yaw}))],
  ];
}

function hangar(theme) {
  const paint=theme==='moon'?'#827f9f':'#5c8d95';
  return [base(10.7,8.3,'#adada0'),
    [r(-.7,-.52,7.4,5.7,2.28,'#c1c4bd',.33),d(-.7,-.52,7.5,5.73,1.56,paint,2.31),
      r(-.7,2.37,5.92,.22,1.74,dark,.41),r(3.66,-.39,1.49,3.1,1.65,paint,.34)],
    [...[-2.95,-2.12,-1.29,-.46,.37,1.2,2.03].map(x=>b(x,2.5,.63,.07,1.55,'#81999f',.53)),
      ...worldSign('plane',-.7,2.74,2.43,paint),
      ...(theme==='moon'?parkedVehicle('rover','#b48ca3',{x:3.37,y:.377,z:2.54,yaw:.27}):placeParts(planeModel(),{x:3.37,y:.37,z:2.23,yaw:.27})),
      ...[-2,-1,0,1,2].map(x=>b(x,3.2,.17,.66,.018,brass,.378))],
  ];
}

function casino(theme) {
  const island=theme==='island';
  const darkRoof=island?'#426b70':'#4d4866',walls=island?'#db9d77':'#ad829c';
  const glassTone=island?'#70a8ae':'#9a8ec1',gold='#e6bf73',ivory='#ffdfa5';
  const tower=island?[t(0,-1.1,5.47,4.8,6.16,walls,2.74),t(0,-1.1,5.8,5.1,.28,gold,8.73),
    t(0,-1.1,4.84,4.26,1.64,darkRoof,8.92),d(0,-1.1,4.97,4.37,2.31,'#7d9d9b',10.38)]
    :[b(0,-1.25,4.84,4.55,7.47,walls,2.59),b(0,-1.25,4.97,4.66,.26,gold,9.86),
      b(0,-1.26,3.21,3.34,1.7,darkRoof,10.05),roof(0,-1.26,3.48,3.66,1.46,'#8c658a',11.72)];
  return [base(10.59,9.72,'#c2b18e'),[
    r(0,-.74,8.66,5.71,2.61,walls,.34),r(0,1.85,7.29,2.48,2.27,darkRoof,.34),
    r(0,2.64,6.63,2.17,.27,gold,2.4),...tower,
    ...pair.flatMap(s=>[r(s*3.41,-1.48,1.75,4.72,island?4.02:5.87,darkRoof,2.71),
      r(s*3.41,-1.48,1.89,4.85,.31,gold,island?6.48:8.4),
      r(s*3.41,-1.48,1.15,3.66,.44,walls,island?6.73:8.66)]),
  ],[
    ...entrance(3.15,2.06,1.67),...nameplate(island?'GULL':'NORDLYS',0,3.3,3.06,darkRoof,.22,gold),
    ...Array.from({length:15},(_,i)=>d((i-7)*.38,3.77,.16,.14,.17,i%2?ivory:'#eea9ba',2.56)),
    ...pair.flatMap(s=>[...glazing([s*3.42],[3.45,4.72,5.91],.91,{w:.69,h:.72,color:glassTone}),
      ...[3.11,4.19,5.27,6.35,7.43,8.51].map(y=>b(s*1.73,1.18,.43,.082,.65,glassTone,y)),
      ...flankWindows(4.29,[-3.09,-1.62,-.16],[3.21,4.67,5.95],{w:.57,h:.73,color:glassTone})]),
    ...(island?[...palm(-3.75,3.62,3.34),...palm(3.78,3.54,3.68),
      t(0,-1.09,.32,.32,1.18,gold,11.88),
      ...Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7;return d(Math.cos(a)*.63,-1.1+Math.sin(a)*.63,1.98,.58,.38,gold,12.57,a);})]
      :[...[-2,-1,0,1,2].flatMap(i=>[b(i*.29,.41,.17,.082,.23+Math.abs(i)*.38,'#91cdc0',11.87-Math.abs(i)*.21)]),
        t(0,-1.25,.14,.14,1.15,gold,12.77),d(0,-1.25,.33,.33,.37,ivory,13.68)]),
  ]];
}

export function observationCabin() {
  return [t(0,0,4.82,4.82,.31,'#ceb5cb',0),t(0,0,4.59,4.59,.88,'#74adb9',.25),
    t(0,0,5.0,5.0,.23,'#ded6e5',1.11),d(0,0,4.72,4.72,.65,'#a3b4cb',1.33),
    ...Array.from({length:13},(_,i)=>{
      const angle=i*Math.PI*2/13;
      return r(Math.sin(angle)*2.26,Math.cos(angle)*2.26,.15,.15,.8,i%3?'#f2d28e':'#faf2d2',.29);
    }),b(.79,0,.22,4.33,.12,'#f1d5a0',1.35)];
}

function needleTower() {
  return [base(7.9,7.9,'#b7aebf'),
    [t(0,0,1.53,1.53,6.62,'#b4bdcf',.36),t(0,0,.86,.86,1.1,'#8da0b7',6.81),
      ...Array.from({length:3},(_,i)=>{
        const a=i*Math.PI*2/3;
        return beam([Math.sin(a)*2.73,.38,Math.cos(a)*2.73],[0,5.38,0],.48,'#c5c8d3');
      })],
    [...placeParts(observationCabin(),{x:0,y:7.85,z:0,yaw:0}).map(part=>({...part,observation:true})),
      t(0,0,.18,.18,1.27,'#d7c7d8',9.7),d(0,0,.45,.45,.36,'#f6b489',10.82)]];
}

function telescopeArray() {
  const [ground,body,top]=telescope();
  return [ground,body,[...top,...pair.flatMap(s=>[
    t(s*3.05,2.6,.48,.48,1.18,'#b4b8ce',.35),
    {...t(s*3.05,2.6,1.42,.22,1.42,'#e1cae1',1.61,'z'),angle:s*.45},
    domeMarker(s*3.05,2.7),
  ])]];
}
function domeMarker(x,z) { return d(x,z,.32,.33,.32,'#7ce0d4',1.57); }

function tramDepot() {
  return [base(8.7,7.4,'#c0b691'),[r(0,-.62,5.9,4.25,2.01,'#c6b884',.34),
    roof(0,-.59,6.5,4.72,1.21,'#b9765b',2.28),...entrance(1.55,1.25,1.54)],
    [...nameplate('TRIKK',0,2.42,1.65,teal,.095),...glazing([-2,-1.1,1.1,2],[1.02],1.54),
      r(0,2.73,5.76,1.13,.18,'#e5c78d',.34),
      ...pair.map(s=>r(s*2.2,2.66,1.04,.38,.27,'#9e8e76',.52))]];
}

function lunarHighrise(variant) {
  const palette=[
    ['#90a8c5','#86cdd5','#ece3bf'],
    ['#8f85ad','#a7bde2','#e0bad5'],
    ['#9da8aa','#73c6b8','#e4d394'],
  ][variant];
  const [wall,glass,tint]=palette;
  const height=[9.4,11.8,10.1][variant];
  const tower=(x,z,w,h)=>{
    const shell=variant===2?t:r;
    return [
      shell(x,z,w,w*.84,h,wall,.34),
      ...Array.from({length:Math.floor(h/.95)},(_,i)=>shell(x,z,w+.13,w*.84+.14,.28,i%3===2?tint:glass,.82+i*.91)),
      shell(x,z,w+.35,w*.84+.33,.24,wall,h+.31),
      ...(variant===0?[b(x-w*.32,z+w*.422,.19,.1,h*.91,tint,.48),
        b(x+w*.32,z+w*.422,.19,.1,h*.91,tint,.48)]:[]),
    ];
  };
  return [
    base(10.1,9.3,'#b8b6c7'),
    [...tower(-1.48,-.49,3.6,height),...tower(2.39,.12,variant===1?2.4:2.82,height*(variant===1?.56:.71))],
    [r(.57,-.12,3.73,1.33,.92,glass,height*.48),
      ...pair.map(side=>b(.58,side*.67-.12,3.8,.07,.11,tint,height*.48+.74)),
      d(-1.48,-.49,3.85,3.22,.92,tint,height+.54),
      ...(variant===1?[t(-1.48,-.49,.15,.15,1.73,wall,height+1.26),d(-1.48,-.49,.47,.47,.29,glass,height+2.89)]
        :[d(2.39,.12,2.9,2.42,.6,glass,height*.71+.54)]),
      ...worldSign('sun',-1.48,2.11,1.13,glass)],
  ];
}

function breadWorks() {
  const brick='#ac654d',tile='#754450';
  return [base(10.12,9.1,'#c9a98c'),[
    r(-.73,-.92,6.44,4.87,2.71,brick,.35),roof(-.73,-.92,6.78,5.12,1.48,tile,3.03),
    r(3.2,-1.3,2.22,3.45,1.72,'#db9d71',.35),roof(3.2,-1.3,2.43,3.67,.79,tile,2.05),
    t(-2.98,-2.45,.74,.74,3.82,'#ad7a58',.36),t(-2.98,-2.45,1.02,1.02,.23,stone,4.13),
  ],[
    ...entrance(1.52,1.35,1.59),...glazing([-2.77,-1.6,1.62],[1.24],1.55,{h:1.06}),
    ...[.68,.85,2.45,2.65].map(y=>b(-.75,1.534,6.32,.07,.043,'#d2926d',y)),
    ...nameplate('BOLLER',0,2.44,1.68,tile,.19),d(.65,-.8,3.18,2.58,.97,'#d3995b',4.05),
    ...[-.24,.43,1.06].map(x=>d(x,-.15,.13,.58,.1,cream,4.82,-.34)),
    ...[-2.85,2.92].flatMap(x=>[...bench(x,2.96),...shrub(x,3.72,'#658b64')]),
  ]];
}

function bookCastle() {
  const brick='#c89170',tile='#537577',pages='#f1d9ac';
  return [base(10.24,9.35,'#c3b6a2'),[
    r(0,-1.04,6.7,4.7,3.52,brick,.35),roof(0,-1.04,6.94,4.92,.91,tile,3.83),
    ...pair.flatMap(s=>[t(s*3.21,-1.42,1.68,1.62,4.22,brick,.34),d(s*3.21,-1.42,1.91,1.9,1.27,tile,4.56)]),
  ],[
    ...entrance(1.35,1.8,1.72),...glazing([-2.22,2.22],[1.22,2.55],1.35,{h:.83}),
    ...pair.flatMap(side=>[b(side*1.15,-.7,2.52,2.32,.17,'#b86360',4.46),
      b(side*1.15,-.7,2.35,2.16,.32,pages,4.6),b(side*1.14,-.7,2.45,2.22,.075,pages,4.89),
      ...[-1.12,-.69,-.28].map(z=>b(side*1.15,z,1.78,.049,.025,'#b99772',4.965))]),
    ...worldSign('book',0,2.85,1.49,tile),...bench(-2.93,2.73),...bench(2.93,2.73),
  ]];
}

function waterGallery(tropical) {
  const wall=tropical?'#edac88':'#87a8af',water=tropical?'#78cbc5':'#6098bc',band=tropical?'#b96382':'#416a80';
  const fish=(x,y,z,size,color)=>[
    t(x,z,size,size*.26,size*.54,color,y,'z'),
    {shape:'plate',x:x-size*.54,y:y+size*.27,z,w:size,h:size,d:.01,color,
      profile:[[.18*size,0],[-.29*size,.35*size],[-.29*size,-.35*size]]},
    d(x+size*.27,z+.15*size,size*.12,size*.065,size*.08,cream,y+size*.36),
  ];
  return [base(10.65,9.4,tropical?'#d8b991':'#bdc5bd'),[
    r(0,-.86,7.48,4.97,2.32,wall,.35),t(0,-.92,6.91,4.9,.29,band,2.63),d(0,-.92,6.92,4.91,2.7,water,2.89),
    r(0,1.69,8.05,1.1,.36,band,.37),r(0,2.24,3.01,1.75,.32,wall,1.95),
  ],[
    ...entrance(1.72,1.7,1.53),...glazing([-2.64,2.64],[.87],1.67,{w:1.42,h:1.21,color:'#77b4c0'}),
    ...pair.flatMap(s=>[...fish(s*1.61,3.45,1.3,1.37,s>0?'#e59a71':'#a2dbbb'),
      ...(tropical?palm(s*4.2,2.3,2.57):shrub(s*4.19,2.3,'#7fa197',.62))]),
    ...fish(.09,4.44,.54,1.7,'#f1c278'),...nameplate(tropical?'KORALL':'AKVARIUM',0,2.45,2.98,band,.155),
  ]];
}

function clockSpire() {
  const wall='#b27b5d',copper='#638f7d';
  const clock=[t(0,1.43,1.64,.16,1.63,brass,5.24,'z'),t(0,1.54,1.38,.11,1.37,cream,5.37,'z'),
    beam([0,6.02,1.62],[.39,6.31,1.62],.068,dark),beam([0,6.02,1.62],[-.03,6.57,1.62],.072,dark)];
  return [base(9.54,8.9,'#b8ad92'),[
    r(0,-.48,6.67,4.45,1.55,wall,.35),r(0,-.54,3.97,3.85,2.71,wall,1.82),
    r(0,-.55,3.7,3.74,2.3,wall,4.4),b(0,-.54,3.93,3.98,.24,stone,6.66),
    roof(0,-.55,3.89,3.93,2.28,copper,6.87),t(0,-.55,.13,.13,.86,brass,9.09),
  ],[
    ...[0,1,2,3].flatMap(turn=>placeParts(placeParts(clock,{x:0,y:0,z:.55}),{x:0,y:0,z:-.55,yaw:turn*Math.PI/2})),
    ...entrance(1.76,1.47,1.27),...glazing([-1.12,1.12],[2.61,3.64],1.4,{h:.79}),
    ...pair.flatMap(s=>[b(s*1.68,1.36,.21,.18,4.61,stone,1.94),...bench(s*2.61,3.21)]),
  ]];
}

function glassWorks() {
  const colors=['#87bbbd','#dc8980','#deb56c','#83a282','#8b97bd'];
  const facets=colors.flatMap((color,i)=>[
    r((i-2)*1.25,-.28,1.22,4.76,.14,color,3.27),
    roof((i-2)*1.25,-.32,1.23,4.83,.71+i*.18,color,3.4),
    b((i-2)*1.25,2.02,1.04,.081,1.16,color,1.59),
  ]);
  return [base(10.21,8.81,'#bdad9f'),[
    r(0,-.33,6.88,4.56,2.96,'#a6756b',.35),...facets,
    t(3.85,-1.67,.83,.83,3.82,'#995f55',.34),t(3.85,-1.67,1.03,1.03,.23,stone,4.1),
  ],[
    ...entrance(2.05,1.29,1.22),...nameplate('GLASS',0,3.16,2.16,'#627984',.19),
    ...colors.map((color,i)=>t((i-2)*.68,3.17,.42,.4,.74+i%3*.13,color,.44)),
  ]];
}

function surfMuseum() {
  const mint='#459e95',sand='#efcf9c';
  const crest=[[0,0],[.5,.07],[1,.19],[1.49,.52],[1.78,.91],[1.66,1.38],[1.27,1.66],[.69,1.55],[.43,1.18]]
    .map(([x,y])=>[(x-.9)*3.8,2.89+y*1.5]);
  const wave=crest.slice(1).flatMap(([x,y],i)=>{
    const [a,b0]=crest[i];
    const outline=[[a,b0,-2.98],[a,b0,1.63],[x,y,1.63],[x,y,-2.98]];
    const underside=outline.map(([u,v,w])=>[u,v-.19,w]);
    const roofFace=(outline,color)=>({shape:'terrain',outline,x,y,z:-.69,h:.19,color});
    return [
      roofFace(outline,mint),
      roofFace([...underside].reverse(),'#75bcaf'),
      roofFace([outline[1],underside[1],underside[2],outline[2]],i>4?'#c7e5d1':'#8bd2ba'),
      roofFace([outline[3],underside[3],underside[0],outline[0]],'#489d90'),
    ];
  });
  return [base(10.32,9.15,'#d9ba87'),[
    r(0,-.69,7.21,4.62,2.55,'#d9ab79',.35),...wave,
  ],[
    ...entrance(1.68,1.54,1.55),...glazing([-2.27,2.27],[1.06],1.67,{w:1.43,h:1.12}),
    ...[-3.29,2.68,3.38].map((x,i)=>t(x,2.05,.46,.18,2.47,[sand,'#e79a85','#8dc4bc'][i],.42,'z')),
    ...worldSign('board',0,3.19,1.78,mint),...palm(-4.22,2.61,2.56),...palm(4.18,3.01,2.86),
  ]];
}

function sunhatHotel() {
  const pink='#d18b78',gold='#d5a454',teal='#669894';
  return [base(10.65,9.72,'#d4b687'),[
    r(0,-.83,7.4,4.51,3.89,pink,.34),r(0,-.84,4.86,3.48,2.07,'#e6b08f',4.17),
    t(0,-.79,8.15,5.71,.26,gold,6.14),d(0,-.79,4.77,3.91,1.83,gold,6.4),
    t(0,-.79,4.48,3.7,.34,teal,6.62),...pool(.89,3.03,3.8,2.4),
  ],[
    ...glazing([-2.31,-.77,.77,2.31],[1.47,2.87],1.45,{w:.98,h:.81}),
    ...[1.35,2.72].map(y=>r(0,1.81,6.91,.86,.16,cream,y)),
    ...entrance(1.45,1.78,1.41),...nameplate('SOLHATT',0,4.72,.99,teal,.18),
    ...palm(-4.25,2.51,2.88),...palm(4.18,2.69,2.72),...umbrella(-2.39,3.31,'#e4a662'),
  ]];
}

function coconutTower() {
  const fiber='#9a6b49',milk='#eed6a5';
  return [base(9.82,9.32,'#dac095'),[
    ...pair.flatMap(s=>[beam([s*2.25,.37,-1.68],[s*1.62,4.28,-.51],.4,fiber),
      beam([s*2.21,.36,1.52],[s*1.53,4.21,.45],.36,fiber)]),
    t(0,-.14,5.36,5.14,.39,milk,3.92),d(0,-.14,5.21,5.11,2.94,fiber,4.26),
    ...[-.65,0,.65].map(x=>t(x,1.98,.47,.39,.48,dark,5.49,'z')),
  ],[
    beam([.48,6.47,.12],[2.19,7.64,.22],.34,glass),t(2.19,.22,.66,.67,.29,ice,7.54),
    ...worldSign('scope',0,4.27,2.54,teal),...palm(-3.46,2.21,2.54),...palm(3.46,2.21,2.86),
    beam([-2.81,1.58,2.29],[0,.84,2.29],.15,'#e0978a'),beam([0,.84,2.29],[2.83,1.61,2.29],.15,'#e0978a'),
  ]];
}

function icePalace() {
  const pink='#dc95a4',mint='#5daba9';
  const scoop=(x,z,y,size,color)=>d(x,z,size,size*.9,size*.47,color,y);
  return [base(9.86,9.0,'#ddc8a6'),[
    r(0,-.63,6.96,4.46,2.32,mint,.35),r(0,-.66,7.26,4.71,.24,cream,2.65),
    ...[-2.67,0,2.67].flatMap((x,i)=>[
      {shape:'cone',x,z:-.77,w:1.61,d:1.61,h:1.57,y:2.81,color:'#d19762',inverted:true},
      scoop(x,-.77,4.29,1.82,[pink,'#e7d69a','#82c2b0'][i]),scoop(x-.11,-.71,5.09,1.19,[cream,pink,'#e9ad7d'][i]),
    ]),
  ],[
    ...entrance(1.64,1.43,1.52),...glazing([-2.15,2.16],[.97],1.67,{w:1.18,h:1.09}),
    ...Array.from({length:13},(_,i)=>b((i-6)*.47,2.11,.46,1.04,.16,i%2?pink:cream,2.02)),
    ...umbrella(-2.77,2.87,mint),...umbrella(2.67,3.18,pink),...worldSign('ice',0,3.3,1.76,mint),
  ]];
}

function cometCafe() {
  const magenta='#ab719d',light='#ecd08c';
  return [base(10.1,9.29,'#b9acba'),[
    t(0,-.87,7.29,4.41,2.51,magenta,.35),t(0,-.87,7.85,4.91,.3,light,2.71),d(0,-.86,7.51,4.8,1.08,'#8a83b9',2.99),
    ...glazing([-2.47,-1.47,1.47,2.47],[1.39],.84,{color:ice}),
  ],[
    ...entrance(1.24,1.52,1.61),d(.82,-.89,1.93,1.69,1.43,'#d7b0cf',3.8),
    ...[-.31,0,.31].map(y=>beam([.49,4.37+y,-.85],[-3.56,3.88+y,-1.43],.19,light)),
    ...nameplate('KOMET',0,2.4,1.3,magenta,.22),...umbrella(-2.7,3,magenta),...umbrella(2.7,3,glass),
  ]];
}

function carWash(theme) {
  const moon=theme==='moon',island=theme==='island';
  const [wall,trim,pavement,accent]=moon?['#8273a2','#93d7d6','#9ca0b5','#c6a9e2']
    :island?['#487f7c','#f3d0a5','#a49a87','#ef9f6f']:['#527684','#d8e3ce','#93978e','#e4b46f'];
  const {lane,deck,apron,waiting}=WASH_BAY;
  const driveways=pair.map(side=>b(side*lane,.67,2.17,2*(apron-.67),deck-.377,pavement,.377));
  const exit=b(0,-3.29,2*lane+2.17,2.25,deck-.375,pavement,.377);
  const bays=pair.flatMap(side=>{
    const x=side*lane;
    return [
      ...pair.flatMap(s=>[-1.71,1.64].map(z=>b(x+s*1.16,z,.24,.26,1.83,wall,deck))),
      b(x,-.09,2.65,3.78,.17,wall,2.15),
      ...[1.76,-1.83].flatMap(z=>[b(x,z,2.62,.21,.21,trim,2.03),b(x,z+.11,1.68,.058,.07,accent,2.08)]),
      ...(island?[roof(x,-.09,2.78,3.82,.42,'#b97859',2.29)]
        :moon?[d(x,-.09,2.65,3.68,.47,'#a292bf',2.27)]:[b(x,-.09,2.64,3.77,.1,accent,2.30)]),
    ];
  });
  return [[...base(10.65,9.54,moon?'#b0b2c5':island?'#d8c392':'#b0b2a0'),...driveways,exit],[
    ...bays,r(0,-.43,1.06,2.57,1.74,wall,.377),r(0,-.45,1.21,2.73,.15,trim,2.03),
  ],[
    ...nameplate('VASK',0,2.68,1.58,wall,.183),
    ...pair.flatMap(side=>[...[-.83,.61].map(z=>t(side*(lane+.81),z,.42,.44,1.05,accent,.66)),
      b(side*lane,3.93,.65,.08,.017,trim,deck+.013),
      b(side*(lane+.97),3.56,.059,1.57,.021,trim,deck+.007)]),
    ...[[-.53,.38,.41],[.37,.58,.58],[.14,1.17,.33]].map(([x,z,size],i)=>
      d(x,1.83+z*.22,size,size,size*.81,i%2?accent:trim,2.82+z)),
    ...parkedVehicle(moon?'rover':island?'classic':'compact',moon?'#d49e80':island?'#d68b65':'#719eae',
      {x:-lane,z:waiting,y:deck,yaw:Math.PI}),
  ]];
}

function craterCinema() {
  return [base(10.2,9.48,'#b7a6bf'),[
    t(0,-1.35,7.39,5.13,.87,'#786a9e',.35),d(0,-1.38,7.47,5.32,3.24,'#9c8bb4',1.14),
    r(0,1.56,6.28,1.14,1.69,'#6c6194',.35),r(0,2.05,6.23,.22,.25,'#e0ae9f',2.02),
  ],[
    ...entrance(2.16,1.58,1.32),...nameplate('KRATER',0,2.59,2.16,'#805888',.24),
    ...[-2.1,2.1].flatMap(x=>[t(x,2.27,.22,.22,2.24,ice,.35),d(x,2.27,.64,.63,.43,'#e0a7b5',2.37)]),
    ...[[-1.93,-1.83],[1.1,-1.72],[.2,.2]].map(([x,z],i)=>t(x,z,1.1+i*.22,.69,.06,'#ba9ac0',3.61+i*.17)),
  ]];
}

function moonPost() {
  const blue='#6e93b0',red='#d28488';
  return [base(10.07,9.12,'#b9aec4'),[
    t(-1.33,-.68,4.14,4.07,2.79,blue,.36),d(-1.33,-.67,4.32,4.25,2.33,'#a6c5d6',3.07),
    r(2.34,-.36,2.85,3.23,2.02,'#9a8fba',.35),r(2.34,-.36,3.24,3.57,.22,blue,2.32),
    r(.55,-.37,2.38,1.0,.64,glass,1.5),
  ],[
    ...entrance(1.48,1.53,1.49),r(-1.37,-.52,2.31,1.44,.86,red,5.04),
    b(-1.37,.234,1.8,.08,.14,dark,5.42),...worldSign('crate',2.34,2.69,1.43,blue),
    ...[1.47,2.45,3.48].map((x,i)=>r(x,2.89,.7,.65,.45,[rose,brass,ice][i],.35)),
  ]];
}

function sunMirror() {
  const blue='#7693b5',gold='#e4b974';
  const edge=Array.from({length:16},(_,i)=>[2.84*Math.cos(i*Math.PI/8),5.07+1.44*Math.sin(i*Math.PI/8),
    -1.56+2.35*Math.sin(i*Math.PI/8)]);
  return [base(10.16,9.28,'#b7aec2'),[
    r(0,-1.14,4.71,3.72,1.7,'#9291b3',.35),t(0,-1.54,.74,.74,3.43,blue,1.85),
    ...edge.flatMap((point,i)=>[
      beam(point,edge[(i+1)%16],.16,gold),
      {shape:'terrain',outline:[point,edge[(i+1)%16],[0,4.48,-1.56]],x:0,y:4.48,z:-1.56,h:2.13,color:i%2?'#8bbecb':'#b2d4d3'},
      {shape:'terrain',outline:[[0,4.46,-1.56],edge[(i+1)%16],point],x:0,y:4.46,z:-1.56,h:2.15,color:blue},
    ]),
  ],[
    ...pair.flatMap(s=>[t(s*2.81,1.97,1.31,1.31,.84,blue,.35),d(s*2.81,1.97,1.26,1.31,.6,'#d6c2c7',1.16),
      beam([s*2.7,1.38,1.97],[0,4.48,-1.56],.073,gold)]),
    ...entrance(.73,1.45,1.29),...worldSign('sun',0,2.37,.79,blue),
  ]];
}

function riverShop(kind) {
  const shop={
    bakery:{wall:'#bd795d',roof:'#835254',trim:'#f0c68a',mark:'bread',label:'BAKERI'},
    store:{wall:'#8eaf9c',roof:'#3e7979',trim:'#e6c390',mark:'basket',label:'BUTIKK'},
    repair:{wall:'#ad9480',roof:'#647c91',trim:'#cf9b60',mark:'gear',label:'VERKSTED'},
  }[kind];
  const {wall,roof:tile,trim,mark,label}=shop;
  const garage=kind==='repair';
  const ground=base(9.68,8.76,'#c9b6a1');
  const body=[
    r(-.55,-.73,6.75,4.42,2.76,wall,.35),r(2.98,-1.15,1.94,3.49,1.95,wall,.35),
    ...(garage?[r(-.55,-.73,7.08,4.79,.28,tile,3.04),r(-1.28,.62,3.09,1.75,1.03,'#aabdca',3.28)]
      :[roof(-.55,-.74,7.14,4.82,1.31,tile,3.05),roof(3.02,-1.16,2.27,3.81,.8,tile,2.25)]),
    b(-.55,1.55,7.02,.22,.19,trim,2.99),
  ];
  const frontage=garage?[
    r(-.76,1.49,3.61,.16,2.13,dark,.36),
    ...Array.from({length:7},(_,i)=>b(-.76,1.59,3.53,.06,.105,'#8798a7',.54+i*.25)),
    ...glazing([1.93,2.9],[1.28],1.49,{w:.66,h:.81}),
    r(2.09,2.85,2.61,2.62,.026,'#b9ada2',.377),
    ...parkedVehicle('car','#e1aa71',{x:2.09,z:2.85,y:.403,yaw:1.04}),
  ]:[
    ...entrance(1.52,1.35,1.62),...glazing([-2.66,1.64],[.92],1.54,{w:1.57,h:1.03}),
    ...Array.from({length:13},(_,i)=>b(-.55+(i-6)*.46,1.97,.452,1.01,.12,i%2?tile:trim,2.15)),
    ...(kind==='bakery'?[d(-2.13,-1.72,1.95,1.7,.69,trim,3.76),d(-2.13,-1.37,.36,.38,.12,cream,4.36)]
      :[-2.65,-1.84,2.8].flatMap((x,i)=>[r(x,2.65,.67,.56,.26,'#a78363',.34),
        ...[-.16,.16].map(dx=>d(x+dx,2.65,.3,.31,.23,['#b77168','#96ae7c','#e2bd72'][i],.6))])),
  ];
  return [ground,body,[
    ...frontage,...nameplate(label,-.51,2.75,1.61,tile,garage?.15:.195),...worldSign(mark,3.35,2.01,.68,tile),
    ...[.54,.73,2.72].map(y=>b(-3.96,-.79,.055,4.25,.054,trim,y)),
  ]];
}

function schoolhouse() {
  return [base(10.64,9.68,'#b4baa1'),[
    r(0,-1.16,8.61,4.29,2.59,'#cc916e',.35),roof(0,-1.2,8.93,4.64,1.27,'#8e635b',2.91),
    r(0,-.96,2.04,2.2,1.33,'#edc89e',4.01),roof(0,-.96,2.41,2.51,1.01,'#8e635b',5.27),
    r(2.15,2.63,3.95,2.4,.07,'#9eaf84',.32),r(-1.71,2.55,2.62,1.73,.065,'#c9a77f',.33),
  ],[
    ...entrance(1.04,1.65,1.56),...glazing([-3.26,-2.04,2.04,3.26],[1.19,2.21],1.01,{w:.78,h:.65}),
    t(0,.166,.81,.1,.81,cream,4.31,'z'),beam([0,4.72,.226],[.24,4.83,.226],.065,dark),
    ...[-3.64,-2.49,2.52,3.64].map(x=>b(x,1.07,1.01,.17,.12,'#a86d50',.99)),
    ...Array.from({length:6},(_,i)=>b(-2.48+(i%2)*.59,2.04+Math.floor(i/2)*.52,.48,.42,.021,i%3===0?'#e2c378':'#e3d3b0',.41)),
    ...broadTree(3.7,3.36,1),...worldSign('book',0,2.59,1.13,'#607e79'),
  ]];
}

function openServiceBay({x,y},front,back,width,top,trim) {
  const end=4.53;
  return [
    ...[[back,front],[front,end]].map(([a,bound])=>
      b(x,(a+bound)*.5,width+.17,bound-a,.069,'#7a8086',y-.069)),
    b(x,back+.035,width,.082,top-y,'#4d525d',y),
    ...pair.flatMap(side=>[
      b(x+side*(width*.5+.045),front+.055,.105,.13,top-y+.055,trim,y),
      b(x+side*(width*.5-.095),2.58,.052,1.85,.012,'#e5d5a9',y+.006),
    ]),
    b(x,front+.065,width+.24,.21,.19,trim,top),
    ...[.038,.1].map(height=>b(x,front+.178,width+.11,.034,.025,'#abb5b7',top+height)),
    b(x,back+.16,width*.61,.19,.06,'#f6dfa7',top-.16),
  ];
}

function firehouse() {
  const red='#ab625d',roofColor='#754f61';
  const bay=SERVICE_STOPS.fireStation;
  const width=2.2,half=width*.5,left=bay.x-half,right=bay.x+half;
  const edge=4.005,front=1.25;
  return [base(10.34,9.34,'#bcb19f'),[
    b((left-edge)*.5,-1.21,left+edge,4.92,3.28,red,.35),b((right+edge)*.5,-1.21,edge-right,4.92,3.28,red,.35),
    b(bay.x,-3.53,width,.28,3.28,red,.35),b(bay.x,-1.21,width,4.92,1.11,red,2.52),
    r(0,-1.2,8.31,5.14,.28,cream,3.59),
    r(-2.71,-2.03,2.27,2.31,2.15,red,3.84),roof(-2.71,-2.02,2.65,2.71,1.22,roofColor,5.96),
    r(1.69,-1.44,3.44,3.21,.29,roofColor,3.85),
  ],[
    ...[-2.42,-.13].flatMap(x=>[b(x,front+.093,1.95,.16,2.18,'#ead1b9',.36),
      b(x,front+.192,1.76,.064,2.04,'#934a52',.419),
      ...[.69,.99,1.29,1.59,1.89].map(y=>b(x,front+.241,1.72,.034,.041,'#d39b8d',y)),
      b(x,front+.241,1.4,.046,.31,'#7d9ca8',2.02)]),
    ...glazing([-2.71],[4.53],-.84,{w:.67,h:.89}),
    ...nameplate('BRANN',0,3.02,1.31,roofColor,.215),...worldSign('flame',-2.68,5.46,-.78,red),
    ...openServiceBay(bay,front,-3.37,width,2.52,'#dfb6a0'),
    ...stationVehicle('fireStation'),
  ]];
}

function policeStation(theme) {
  const moon=theme==='moon',island=theme==='island';
  const navy=moon?'#665a92':island?'#477d86':'#456784';
  const wall=moon?'#aaa9cb':island?'#efd0a8':'#b5c0c2';
  const window=moon?'#81cad2':island?'#81b6b5':'#77a4b4';
  const crest='#f1cc78';
  const bay=SERVICE_STOPS.policeStation;
  const badge={shape:'plate',x:-1.75,y:3.25,z:1.92,w:1.4,d:.011,h:1.45,color:crest,
    profile:[[-.62,.51],[.62,.51],[.56,-.17],[0,-.68],[-.56,-.17]]};
  const main=moon?[r(-1.73,-.67,5.45,4.57,3.04,wall,.35),d(-1.73,-.68,5.53,4.58,1.4,navy,3.31),
    t(-1.73,-.66,3.51,3.3,.21,'#91c2cf',3.96),t(-1.73,-.66,.16,.17,1.19,'#d1cbdf',4.13)]
    :[r(-1.73,-.72,5.45,4.77,3.1,wall,.35),
      ...(island?[roof(-1.72,-.71,5.87,5.08,1.46,navy,3.31)]
        :[b(-1.73,-.72,5.67,4.93,.22,navy,3.28),b(-2.86,-1.14,2.32,3.39,1.38,navy,3.44)])];
  return [base(10.47,9.42,'#b4b4ac'),[
    ...main,b(1.3075,-1.11,.425,4.37,1.91,wall,.34),b(3.8625,-1.11,.765,4.37,1.91,wall,.34),
    b(bay.x,-3.16,1.96,.27,1.91,wall,.34),r(2.67,-1.09,3.28,4.52,.28,navy,2.23),
    r(-1.75,1.83,4.91,.26,.21,navy,2.71),
  ],[
    badge,b(-1.75,1.962,.16,.055,.48,navy,3.03),b(-1.75,1.962,.47,.055,.14,navy,3.19),
    ...nameplate('POLITI',-1.75,2.6,1.99,navy,.18,cream),
    ...placeParts(entrance(1.74,1.44,1.72),{x:-1.73,y:0,z:0}),
    ...glazing([-3.43,.03],[.98,1.86],1.7,{w:.84,h:.62,color:window}),
    ...glazing([-3.02,-1.28],[3.72],.6,{w:.52,h:.51,color:window}),
    ...openServiceBay(bay,1.075,-3.02,1.96,2.14,navy),
    ...pair.flatMap(s=>[t(2.5+s*.99,3.54,.13,.13,.48,navy,.34),b(2.5+s*.94,2.97,.067,.68,.016,crest,.425)]),
    ...stationVehicle('policeStation',theme),
  ]];
}

function riversideChurch() {
  const stone='#bca995',trim='#e7d4b2',tile='#617d7b',darkGlass='#53658f';
  const pointed=(x,z,y,w,h,color)=>({shape:'plate',x,y,z,w,d:.015,h,color,
    profile:[[-w*.5,0],[w*.5,0],[w*.5,h*.66],[w*.31,h*.85],[0,h],[-w*.31,h*.85],[-w*.5,h*.66]]});
  const window=(x,z,y,w,h)=>[pointed(x,z,y,w+.16,h+.16,trim),pointed(x,z+.023,y+.055,w,h,darkGlass),
    b(x,z+.044,.051,.048,h*.83,'#e2ba78',y+.094),b(x-w*.24,z+.048,w*.27,.042,h*.50,'#91c8c7',y+.16)];
  return [base(10.89,10.58,'#b2ac98'),[
    b(0,-1.07,5.34,6.76,4.29,stone,.35),roof(0,-1.1,5.8,6.98,2.67,tile,4.54),
    r(0,-3.81,4.63,1.92,3.41,stone,.35),roof(0,-3.8,4.92,2.11,1.92,tile,3.74),
    ...pair.flatMap(s=>[b(s*3.53,1.07,2.19,3.06,5.84,stone,.35),b(s*3.53,1.07,2.39,3.21,.28,trim,5.89),
      {shape:'cone',x:s*3.53,z:1.07,y:6.11,w:2.52,d:2.67,h:3.58,color:tile},
      b(s*3.6,-1.94,2.36,2.45,2.96,stone,.35),roof(s*3.58,-1.94,2.48,2.6,1.52,tile,3.24),
      ...[-3.06,-1.28,.38].map(z=>b(s*2.77,z,.36,.53,3.84,trim,.35))]),
  ],[
    pointed(0,2.352,.39,1.99,2.61,trim),pointed(0,2.387,.4,1.53,2.24,'#65564e'),
    ...[0,1,2].map(i=>b(0,2.67+i*.45,2.66+i*.32,.56,.11,trim,.32-i*.07)),
    t(0,2.36,1.94,.13,1.91,trim,3.05,'z'),t(0,2.44,1.57,.08,1.57,darkGlass,3.21,'z'),
    ...Array.from({length:8},(_,i)=>{
      const angle=i*Math.PI/4,x=Math.cos(angle),y=Math.sin(angle);
      return beam([x*.18,3.99+y*.18,2.49],[x*.72,3.99+y*.72,2.49],.066,i%2?'#b6d3d2':'#edba79');
    }),
    ...pair.flatMap(s=>[...window(s*3.53,2.62,3.57,.72,1.46),...window(s*3.53,2.62,1.34,.65,1.04),
      ...placeParts([-2.78,-1.19,.53].flatMap(z=>window(-z*s,2.68,1.61,.73,1.66)),{x:0,y:0,z:0,yaw:s*Math.PI/2}),
      t(s*3.53,1.07,.096,.096,.62,'#c7a46f',9.55),b(s*3.53,1.07,.57,.105,.095,'#c7a46f',9.94),
      ...bench(s*3.78,3.66),...shrub(s*4.45,-3.59,'#789269',.69)]),
  ]];
}

function beachHut(style) {
  const [wall,shade,mark,label]={
    ice:['#e4a7b3','#ae6188','ice','ISKREM'],
    surf:['#82b3aa','#377d87','board','SURF'],
    fruit:['#dda578','#9b9265','fruit','FRUKT'],
  }[style];
  return [base(9.44,8.73,'#dfc498'),[
    r(0,-.87,6.09,4.3,2.35,wall,.35),roof(0,-.88,6.62,4.78,1.42,shade,2.68),
    b(0,1.34,6.6,.23,.18,'#dec391',2.64),
    r(0,1.69,7.82,1.45,.18,'#ba956c',.36),
    ...pair.map(s=>t(s*3.01,2.41,.15,.15,2.01,'#a98362',.54)),
  ],[
    ...entrance(1.31,1.39,1.46),...glazing([-2.07,2.08],[.89],1.32,{w:1.26,h:1.05}),
    ...Array.from({length:13},(_,i)=>b((i-6)*.487,1.89,.48,1.54,.15,i%2?wall:cream,2.46)),
    ...worldSign(mark,0,style==='ice'?3.64:3.35,1.49,shade),...nameplate(label,0,2.32,2.66,shade,.18),
    ...palm(-3.8,2.54,2.6),...palm(3.84,-2.53,2.95),
    ...(style==='surf'?[-1,0,1].map((side,i)=>t(2.47+side*.54,2.83,.34,.16,2.14,['#e8ab79','#6fb3a8','#d87891'][i],.41,'z'))
      :style==='ice'?[...umbrella(2.76,3.04,'#d894a9'),...umbrella(-1.39,3.19,'#7fb0a9')]
        :[-2.8,-1.7,2.8].flatMap((x,i)=>[b(x,2.9,.84,.6,.34,'#aa815b',.35),
          ...[-.19,.19].map(dx=>d(x+dx,2.9,.39,.4,.32,['#d78e65','#d9bc64','#96b381'][i],.69))])),
  ]];
}

const earthStarters={
  city:{
    0:()=>riverShop('bakery'),1:schoolhouse,4:townLibrary,6:riversideChurch,
    8:()=>riverShop('store'),9:firehouse,12:()=>riverShop('repair'),14:cultureHouse,
  },
  island:{1:()=>beachHut('ice'),3:()=>beachHut('surf'),10:strandCafe,14:()=>beachHut('fruit')},
};

export function earthStarterStages(theme,index) {
  return earthStarters[theme]?.[index]?.();
}

function earthAccents(theme,style,stages,index) {
  const tropical=theme==='island';
  let details;
  if (style==='bank') details=[...pair.flatMap(side=>[t(side*3.41,2.16,.22,.22,.57,stone,.34),
    d(side*3.41,2.16,.66,.66,.81,'#7b9779',.91)]),...nameplate('BANK',0,2.5,2.72,teal,.187)];
  if (style==='restaurant'&&tropical&&index===20) details=[
    ...pair.flatMap(side=>[t(side*3.75,.96,.13,.13,2.98,'#966e54',.36),
      beam([side*3.75,3.21,.96],[side*2.81,2.63,3.49],.11,cream)]),
    ...nameplate('HAV',2.9,2.39,.51,'#498e99',.23),...palm(3.98,-2.55,2.85),
  ];
  if (style==='bandstand'&&tropical&&index===13) details=[
    ...pair.map(s=>t(-.63+s*1.22,2.16,.14,.14,1.86,'#9a7454',.36)),
    ...[-.23,.23].flatMap(z=>[beam([-1.85,1.95,2.16],[-.63,1.17,2.16+z],.12,'#e3a075'),
      beam([-.63,1.17,2.16+z],[.59,1.95,2.16],.12,'#e3a075')]),
  ];
  if (style==='decoTower'&&index===42) details=[
    ...pair.flatMap(side=>[r(side*3.28,-1.09,1.11,3.12,6.25,'#b68d77',.39),
      r(side*3.27,-1.09,1.14,3.14,.21,'#e3b976',6.61),b(side*3.27,.48,.64,.07,5.11,'#8ba5a5',.81)]),
    ...nameplate('ELVA',0,1.65,2.19,'#86796b',.22),
  ];
  return details?[stages[0],stages[1],[...stages[2],...details]]:stages;
}

function picketFence(length,x,z,yaw,color,level=0) {
  const pickets=Math.ceil(length/.43),posts=Math.ceil(length/2.18);
  return placeParts([
    ...[.42,.78].map(y=>b(0,0,length,.085,.09,color,y)),
    ...Array.from({length:pickets},(_,i)=>b(((i+.5)/pickets-.5)*length,.045,.096,.085,.76,color,.187)),
    ...Array.from({length:posts+1},(_,i)=>{
      const post=(i/posts-.5)*length;
      return [b(post,0,.17,.17,.86,color,.18),r(post,0,.22,.22,.11,color,1.02)];
    }).flat(),
  ],{x,y:level,z,yaw});
}

function residencePark(theme,trim,lawn,water) {
  const {halfWidth,halfDepth,deck,gateHalf}=RESIDENCE_PLOT;
  const moon=theme==='moon',island=theme==='island';
  const edge=moon?'#868aa6':island?'#8aab70':'#729666';
  const paving=RESIDENCE_PLOT.paving[theme];
  const hedge=moon?'#9caac6':island?'#6a9c68':'#62865c';
  const fence=moon?'#d0d9ed':'#ffedd0';
  const fenceX=halfWidth-.38,fenceZ=halfDepth-.38;
  const border=[
    {...b(0,0,2*halfWidth,2*halfDepth,1.28,moon?'#9496ab':'#b6a487',-1.24),support:true},
    b(0,0,2*halfWidth,2*halfDepth,.115,edge,.04),
    r(0,0,2*(fenceX-.18),2*(fenceZ-.2),.021,lawn,.155),
    r(0,4.81,10.71,4.7,.018,paving,deck-.018),
    b(0,halfDepth-.61,2*gateHalf,1.25,.018,paving,deck-.018),
    r(0,-1.46,9.38,5.94,.22,trim,.158),
    r(0,2.55,1.91,1.32,.095,trim,.18),
    ...pair.flatMap(side=>[
      r(side*5.68,-1.14,.53,9.44,.29,hedge,.174),
      r(side*4.36,-6.84,2.72,.56,.32,hedge,.17),
      r(side*3.6,6.72,3.55,.64,.30,hedge,.176),
      ...picketFence(2*fenceZ,side*fenceX,0,Math.PI/2,fence),
      ...picketFence(fenceX-gateHalf,side*(fenceX+gateHalf)*.5,fenceZ,0,fence),
    ]),
    ...picketFence(2*fenceX,0,-fenceZ,0,fence),
  ];
  const pond=[
    {...t(-1.64,-5.83,4.07,2.53,.12,moon?'#af9fb7':'#b0b490',.167),angle:-.19},
    {...t(-1.65,-5.85,3.69,2.17,.044,water,.285),angle:-.19},
    t(-2.14,-6.06,1.87,.68,.009,moon?'#9be8e4':'#a5d6c9',.33),
    ...[[-.46,-5.5],[-.69,-6.2],[-1.06,-6.36]].flatMap(([x,z],i)=>[
      t(x,z,.27,.21,.015,hedge,.33),d(x,z,.13,.12,.084,i===1?'#edcb7e':'#e9a9b2',.345),
    ]),
    r(2.56,-5.89,3.1,1.18,.027,paving,.174),
    ...placeParts(bench(2.61,-5.81),{x:0,y:-.164,z:0,yaw:0}),
    ...[[-4.1,-5.55],[3.94,-6.11],[-5.29,-2.88],[5.32,-1.64],[-5.4,.44],[5.4,.58],[-4.39,6.65],[4.4,6.62]]
      .flatMap(([x,z],i)=>moon?[d(x,z,.96,.89,.52,hedge,.177),
        ...pair.map(side=>t(x+side*.24,z,.24,.25,.49+i%3*.15,side<0?'#a5d9d6':'#c3b0d8',.43))]
        :i<6?placeParts(broadTree(x,z,theme),{x:0,y:-.16,z:0,yaw:0})
          :[d(x,z,1.19,.86,.53,hedge,.17),d(x+.23,z,.36,.36,.17,island?'#eab37c':'#e8b585',.57)]),
    ...pair.flatMap(side=>[1.44,2.09,2.74,4.83,5.43].map((x,i)=>d(side*x,7.13,.21,.24,.13,
      moon?'#bed4ef':i%2?'#eac782':'#dea1a5',.18))),
  ];
  return {border,pond};
}

function residence(theme,site) {
  const moon=theme==='moon',island=theme==='island';
  const estate=!site||site.residence;
  const walls=moon?'#c8cbdf':island?'#f2ce9d':'#d7b694';
  const trim=moon?'#8e9bbd':island?'#fff0cd':'#f5dfba';
  const cap=moon?'#6672a7':island?'#438f90':'#587b7a';
  const lawn=moon?'#9294b4':island?'#8fad69':'#79996b';
  const water=moon?'#88cdd2':island?'#67bdb7':'#6eacb4';
  const window={w:.74,h:1.02,color:moon?'#75bdcd':island?'#7ebdc1':'#739db4'};
  const park=estate?residencePark(theme,trim,lawn,water):null;
  const fence=moon?'#d0d9ed':'#ffedd0';
  const garden=park?.border??[
    ...base(11.72,10.62,moon?'#9295b4':'#c4b393'),
    r(0,-4.7,10.96,.91,.055,lawn,.376),
    ...pair.flatMap(side=>[
      r(side*4.68,1.92,2.0,4.95,.11,lawn,.38),
      r(side*3.36,3.69,1.65,2.97,.10,moon?'#78809f':'#a39581',.382),
      r(side*2.08,1.57,1.14,3.36,.08,lawn,.382),
      ...[-2.8,-.95,.8].map(z=>r(side*5.05,z,1.02,.82,.12,lawn,.38)),
      ...picketFence(10.02,side*5.57,0,Math.PI/2,fence,.19),
      ...picketFence(1.2,side*4.97,5.01,0,fence,.19),
      ...picketFence(1.54,side*1.47,5.01,0,fence,.19),
    ]),
    ...picketFence(11.14,0,-5.01,0,fence,.19),
    r(0,3.11,2.83,2.61,.19,trim,.38),r(0,3.12,2.51,2.27,.057,water,.56),
    r(0,4.83,1.26,.79,.057,trim,.385),
  ];
  const house=[
    r(0,-1.54,6.2,5.55,4.43,walls,.377),r(0,-1.57,6.59,5.92,.23,trim,4.62),
    r(0,-1.62,3.32,3.05,1.74,walls,4.83),
    moon?d(0,-1.67,3.62,3.27,1.26,cap,6.54):roof(0,-1.63,3.85,3.44,1.41,cap,6.53),
    ...pair.flatMap(side=>[
      r(side*3.52,-1.48,2.05,4.94,5.38,walls,.377),
      r(side*3.52,-1.48,2.29,5.11,.24,trim,5.51),
      moon?d(side*3.52,-1.49,2.34,4.96,1.03,cap,5.74):roof(side*3.52,-1.51,2.42,5.24,1.42,cap,5.72),
      ...[2.08,3.56].map(y=>b(side*4.588,-1.49,.11,4.92,.099,trim,y)),
    ]),
    r(0,1.81,4.03,1.39,.25,cap,3.24),
    ...[-1.7,-1.18,1.18,1.7].map(x=>t(x,2.22,.24,.24,2.85,trim,.39)),
    ...entrance(1.27,1.34,2.22),
  ];
  const details=[
    ...glazing([-3.51,3.51],[1.19,2.61,3.95],1.0,window),
    ...glazing([-2.16,2.16],[1.19,2.61,3.67],1.25,window),
    ...placeParts([...glazing([-2.22,0,2.22],[1.12,2.58,3.65],4.32,window),
      ...glazing([-3.51,3.51],[1.12,2.58,3.93],3.96,window)],{x:0,y:0,z:0,yaw:Math.PI}),
    ...flankWindows(4.55,[-3.08,-1.5,.11],[1.12,2.57,4.02],window),
    ...glazing([0],[5.34],-.07,{...window,w:1.15,h:.8}),
    t(0,-1.65,.13,.13,.82,trim,7.78),d(0,-1.65,.49,.45,.39,moon?'#b9ebeb':'#e9bd73',8.53),
    ...(park?.pond??[]),
    ...(estate?[]:[t(-1.53,-4.65,2.13,.65,.115,trim,.423),t(-1.53,-4.65,1.91,.49,.019,water,.54)]),
    ...pair.flatMap((side,i)=>[
      ...parkedVehicle(i?(moon?'rover':'compact'):moon?'hover':island?'classic':'sport',i?'#739dbe':'#ba646a',
        estate?{x:side*RESIDENCE_PLOT.bayX,y:RESIDENCE_PLOT.deck+(!i&&moon?.17:0),z:RESIDENCE_PLOT.bayZ,yaw:Math.atan2(-side*1.82,.75),driver:i===0}
          :{x:side*3.36,y:.482+(!i&&moon?.17:0),z:3.31,yaw:Math.PI,driver:i===0}),
      ...(!estate?[-2.87,-.94,1.14,3.09]:[]).flatMap((z,j)=>island?palm(side*4.88,z,2.45+j*.2)
        :moon?[d(side*4.88,z,.91,.89,.36,'#a8bdca',.39),...[-1,1].map(n=>t(side*4.88+n*.17,z,.23,.23,.38+j*.1,n<0?'#9cd7d6':'#cba9d7',.56))]
        :shrub(side*4.88,z,j%2?'#719261':'#577e62',.64+j*.11)),
      ...[1.0,2.26].flatMap(z=>[d(side*2.12,z,.67,.65,.33,moon?'#c3a3d2':'#6e9367',estate?.18:.45),
        d(side*2.12,z+.1,.23,.22,.12,moon?'#92cfd4':'#e5b77d',estate?.45:.72)]),
    ]),
    ...(estate?[]:island?umbrella(-1.12,3.7,'#dc877b')
      :[t(0,3.11,.52,.52,.53,trim,.56),d(0,3.11,.71,.71,.21,water,1.08)]),
  ];
  return [garden,house,details];
}

const art={
  residence,driveThrough,lunarResort,hotel:()=>grandHotel(false),resort:()=>grandHotel(true),courthouse,bank:()=>civic(true),cinema,prison,
  restaurant:theme=>dining(theme==='island'),garden:theme=>gardens(theme==='island'),bandstand:theme=>gardens(theme==='island',true),
  pier:(theme)=>harbor(theme,'pier'),quay:theme=>harbor(theme,'quay'),marina:theme=>harbor(theme,'marina'),
  bridge:(_,site)=>suspension(site?.span),wheel:theme=>ferris(theme==='island'),coaster,fitness,biodome,
  habitat:()=>habitat(),moonHotel:()=>habitat(true),oxygen:()=>utility('oxygen'),generator,
  refinery:()=>utility('refinery'),spaceField,rocketPort:()=>rocketPort(),telescope,craterLab,supplyDepot,beachClub,sunsetHotel,
  greatPark,factory,sawmill,busStation,camp:camping,arcade,radioTower:()=>radioTower(),broadcastHouse,spire:()=>glassTower('spire'),
  decoTower:()=>glassTower('deco'),bookHall,market,nightCinema:eveningCinema,bistro:()=>snackHouse('bistro'),
  hoverDealer,moonBurger:()=>snackHouse('moonBurger'),cosmicIce:()=>snackHouse('cosmicIce'),orbitalPort:()=>rocketPort(true),
  ringHabitat,lunarArcade:arcade,moonGarden:greatPark,auroraHotel:()=>glassTower('auroraHotel'),
  solarGarden,lunarRadio:()=>radioTower(true),dustCafe:()=>snackHouse('dustCafe'),cargoDepot:()=>moonWorks('cargoDepot'),
  roverGarage:()=>moonWorks('roverGarage'),moonWorkshop:()=>moonWorks('moonWorkshop'),moonCargo:()=>moonWorks('moonCargo'),
  tikiBar:()=>snackHouse('tikiBar'),airport:(theme,site)=>site?.airfield||theme==='city'&&!site?regionalAirport(false,theme==='island'):airport(false,theme==='island'),shuttlePort:()=>regionalAirport(true),islandArcade:arcade,megaResort:(_,site)=>megaResort(site),glassHotel:()=>glassTower('glassHotel'),
  beachCamp:camping,tropicalMarket:market,coralCafe:()=>snackHouse('coralCafe'),
  islandTower:()=>glassTower('lookout'),lagoonTower,palmGarden:greatPark,airstrip:theme=>airport(true,theme==='island'),tropicalPools,lagoonPark,
  railwayStation:()=>transitStation(false),monorailStation:()=>transitStation(true),
  tramStation:tramDepot,lighthouse:theme=>lighthouse(theme==='island'),stoneLighthouse,hangar,casino,needleTower,telescopeArray,
  library:townLibrary,cultureHouse,church:riversideChurch,fireStation:firehouse,policeStation,
  prismTower:()=>lunarHighrise(0),novaTower:()=>lunarHighrise(1),haloTower:()=>lunarHighrise(2),
  solarObservatory:solarGarden,waterSpire:()=>utility('oxygen'),quantumLab:craterLab,signalSpire:()=>radioTower(true),
  batteryVault:plasmaBattery,gravityPark:greatPark,iceVault:craterLab,satelliteHub:()=>radioTower(true),cometPort:()=>rocketPort(true),
  breadWorks,bookCastle,riverAquarium:()=>waterGallery(false),clockSpire,glassWorks,
  surfMuseum,sunhatHotel,coralAquarium:()=>waterGallery(true),coconutTower,icePalace,
  cometCafe,carWash,roverWash:carWash,craterCinema,moonPost,sunMirror,
};

export const RAIL_LANDMARKS={
  city:['Elveby stasjon','Toget går i en stor sløyfe med flere perronger.','railwayStation'],
  island:['Palmetrikkens depot','En turkis trikk kjører rundt øyen og stopper på tre perronger.','tramStation'],
  moon:['Månesporet','En svevebane som går i ring gjennom månebasen.','monorailStation'],
};

export const RESIDENCE_LANDMARKS={
  city:['Residens','Et hus verdig en mattemester som deg, med sportsbil og egen hagedam.','residence'],
  island:['Palass','Et palass verdig en mattemester som deg, med palmer og en klassisk kabriolet.','residence'],
  moon:['Månebase','Et rompalass verdig en mattemester som deg, med rover og en kabriolet som svever.','residence'],
};

export const NEW_LANDMARKS={
  city:{
    5:['Grand Hotel','Suiter, balkonger og en gyllen inngang.','hotel'],
    4:['Biblioteket','Et mursteinsbibliotek med en grønn kobberkuppel over lesesalen.','library'],
    6:['Elvekatedralen','Tvillingtårn med spir, spissbuer og et stort rosevindu.','church'],
    7:['Fonteneparken','Stier og benker rundt en fontene.','garden'],
    9:['Brannstasjonen','Tre garasjeporter og en brannbil som kan kjøre rett ut i gaten.','fireStation'],
    13:['Restauranten','Bord ute under stripete markiser.','restaurant'],
    14:['Kulturhuset','En staselig konsertsal med bred steintrapp og høy glassfront.','cultureHouse'],
    15:['Elveparken','En musikkpaviljong ved en liten dam.','bandstand'],
    16:['Elveby tinghus','Et tinghus med to fløyer og en gyllen rettsvekt på taket.','courthouse'],
    17:['Banken','En staselig bank med søyler og kuppel.','bank'],
    18:['Kinoen','Lysende skilt og store glassdører.','cinema'],
    19:['Fengselet','Murer, luftegård og to vakttårn.','prison'],
    20:['Elvebrygga','En trebrygge der en seilbåt kan legge til.','pier'],
    21:['Havnekaia','Kaikant, lagerhus og en liten fraktebåt.','quay'],
    22:['Rødspennbroa','En rød hengebro med høye tårn over elven.','bridge'],
    23:['Tivoliet','Et stort pariserhjul med fargerike vogner.','wheel'],
  },
  moon:{
    0:['Rakettbasen','En rakett med serviceplattform og signalmerker.','rocketPort'],
    2:['Solseilfeltet','Speil, solpaneler og en ringantenne fanger energien fra solen.','solarObservatory'],
    5:['Akvapiren','Et vanntårn med flygende tallerkentak og turkise tanker.','waterSpire'],
    6:['Kvantelaboratoriet','Et laboratorium med svevende tallerkentak og lysende prøvebeholdere.','quantumLab'],
    8:['Signalspiret','En spiss sender med en stor gyllen signalring.','signalSpire'],
    10:['Plasmabatteriet','En reaktor med blågrønne energiringer.','batteryVault'],
    11:['Tyngdeparken','Lysende romsopper og et lite sveveeksperiment.','gravityPark'],
    13:['Frosthvelvet','Et islager med blå krystallspir og kapseltanker.','iceVault'],
    14:['Satellitthuben','Et tårn som sender vitser og værmeldinger ut i verdensrommet.','satelliteHub'],
    15:['Kometporten','En turkis rakett og lysende innflygingsmerker.','cometPort'],
    1:['Måneboligene','Tre boligkupler med tunneler imellom.','habitat'],
    3:['Rovergarasjen','To månebiler står klare ved portene. En glassbro binder garasjens tårn sammen.','roverGarage'],
    4:['Biodomen','En grønn kuppel med planter og vekstlys.','biodome'],
    7:['Observatoriet','En stor skål som lytter ut i rommet.','telescope'],
    9:['Verkstedet','Rommekanikerne jobber i to tårn med en opplyst glassbro.','moonWorkshop'],
    12:['Lasteterminalen','Forsyninger kommer inn mellom to høye tårn og en glassgang.','moonCargo'],
    16:['Oksygenfabrikken','Lyse rør og tanker med oksygen.','oxygen'],
    17:['Kraftverket','En generator som gir strøm til basen.','generator'],
    18:['Astronautbanen','Fotballmål og flomlys på månen.','spaceField'],
    19:['Månehotellet','Store vinduer med utsikt mot jorden.','moonHotel'],
    20:['Kraterlaboratoriet','Instrumenter for å studere månestein.','craterLab'],
    21:['Mineralraffineriet','Sorterer og lagrer stein fra kratrene.','refinery'],
    22:['Forsyningskuppelen','En stor port og et lager for romdrakter og utstyr.','supplyDepot'],
    23:['Romstasjonen','En høy rakett klar for neste oppdrag.','rocketPort'],
  },
  island:{
    0:['Palmeresorten','Et stort hotell med balkonger, basseng og palmer.','resort'],
    4:['Strandrestauranten','Bord under parasoller og middag ved stranden.','restaurant'],
    5:['Palmeparken','En sti som slynger seg rundt en liten lagune.','garden'],
    7:['Strandbrygga','En brygge for seilbåter ute i bukten.','pier'],
    13:['Hengekøyehagen','Palmer, en liten dam og skygge i paviljongen.','bandstand'],
    16:['Treningssenteret','Store vinduer og en terrasse med treningsutstyr.','fitness'],
    17:['Marinaen','En kai med havnebod og en båt som seiler forbi.','marina'],
    18:['Strandtivoliet','Et pariserhjul med utsikt over havet.','wheel'],
    19:['Fornøyelsesparken','En berg-og-dal-bane mellom palmer og boder.','coaster'],
    20:['Havterrassen','Et sted å spise med utsikt over bukten.','restaurant'],
    21:['Laguneparken','Fargerike planter og en paviljong ved vannet.','bandstand'],
    22:['Ferieklubben','En åpen paviljong med palmer og et lite basseng.','beachClub'],
    23:['Solhotellet','Et hotell med fløyer rundt et basseng.','sunsetHotel'],
  },
};

export const EXPANDED_LANDMARKS={
  city:{
    2:['Fabrikken','En mursteinsfabrikk med skorsteiner, rør og tak i sikksakk.','factory'],
    24:['Eikeparken','En stor park med gangstier, benker og en dam.','greatPark','garden'],
    25:['Elvesagbruket','En trehall med tømmerstokker og plass til sagflis.','sawmill'],
    26:['Bussterminalen','Bussen svinger inn på terminalen og stopper ved leskurene.','busStation'],
    27:['Elvecampen','En romslig campingplass med telt, campingvogn og plass til piknik.','camp'],
    28:['Pikselpalasset','En retro arkadehall med et stort romvesen av lysende piksler.','arcade'],
    29:['Radiotårnet','Et høyt tårn med antenner og en rød signallampe.','radioTower'],
    30:['Glasspiren','En skyskraper med glassfasade og et lyst spir.','spire','tower'],
    31:['Kobbertårnet','En skyskraper i art deco-stil med terrasser og kobbertak.','decoTower','tower'],
    32:['Bokhuset','Et bibliotek med glassatrium og benk ved inngangen.','bookHall'],
    33:['Markedshallen','Fargerike boder med frukt og grønnsaker.','market'],
    34:['Kveldskinoen','En kino i varm murstein med en stor, sølvfarget filmrull over inngangen.','nightCinema','cinema'],
    35:['Hjørnebistroen','En liten bistro med markiser og bord ute.','bistro','restaurant'],
  },
  moon:{
    24:['Måne-Motor','To flyvende kabrioleter med rakettmotorer og et stort skilt.','hoverDealer'],
    25:['Moon Burger','En burgerrestaurant med en kjempestor hamburger på taket.','moonBurger'],
    26:['Cosmic Ice Cream','En iskrembar med sukkertøyfarger og en stor iskremkjegle.','cosmicIce'],
    27:['Orbitalporten','En turkis rakett med en kontrollkuppel ved siden av.','orbitalPort','rocketPort'],
    28:['Stjerneboligene','Tre runde boliger samlet rundt en felles kuppel.','ringHabitat','habitat'],
    29:['Meteorarkaden','En arkadehall med lilla vegger og blå lys.','lunarArcade'],
    30:['Kuppelhagen','Store, lysende romsopper og et sveveeksperiment i parken.','moonGarden'],
    31:['Aurora Hotel','Et romhotell med tallerkenrestaurant i toppen og en lysbro.','auroraHotel','moonHotel'],
    32:['Speilfeltet','Blå solcellepaneler samlet i et eget energifelt.','solarGarden'],
    33:['Månestudioet','Et radiotårn som sender musikk hjem til jorden.','lunarRadio'],
    34:['Støvkafeen','Et sted å ta en kopp kakao under stripete markiser.','dustCafe'],
    35:['Romlogistikken','En lagerhall og fargerike containere fra hele solsystemet.','cargoDepot','supplyDepot'],
  },
  island:{
    24:['Tiki Smoothie','En tropisk bar med bambusstolper og en smoothie på taket.','tikiBar'],
    25:['Palmeflyplassen','Fly som letter og lander, og en egen landingsplass for helikopter.','airport','flight'],
    26:['Strandarkaden','Spill, lys og en stor joystick på taket.','islandArcade'],
    27:['Laguneressorten','En stor resort med bassenger, solsenger og en badestrand.','megaResort','resort'],
    28:['Glasshotellet','Et høyt hotell med glassvegger og basseng i hagen.','glassHotel','resort'],
    29:['Strandcampen','Fargerike telt, en campingvogn og et bål under palmene.','beachCamp'],
    30:['Bambusmarkedet','Et åpent marked med fruktboder og parasoller.','tropicalMarket'],
    31:['Korallkafeen','En korallrosa kafé med skyggefulle bord ute.','coralCafe','restaurant'],
    32:['Havutsikten','Et tårn med glassfasade og utsiktsterrasse.','islandTower'],
    33:['Den botaniske hagen','Palmer og gangstier rundt en liten lagune.','palmGarden','garden'],
    34:['Laguneflystripa','En mindre flystripe med avgang fra en tropisk hangar.','airstrip','flight'],
    35:['Kokosbadet','Et badeland med to basseng og solplasser under palmene.','tropicalPools'],
  },
};

export const GRAND_LANDMARKS={
  city:{
    37:['Elveby lufthavn','Terminal, opplyst rullebane og kontrolltårn.','airport'],
    38:['Elvefyret','Et stripete fyrtårn med gyllen lykt.','lighthouse'],
    39:['Flyverkstedet','Buet hangar med et småfly parkert utenfor.','hangar'],
    40:['Nordlyskasinoet','Et høyt art deco-tårn med lysende spir og gullkantede terrasser.','casino'],
    41:['Teglverket','Et teglverk med piper og fabrikklokaler.','factory'],
    42:['Elvepalasset','Et tårn i art deco-stil.','decoTower'],
    43:['Kringkastingshuset','Et studio med kobbertak og et rundt sendetårn.','broadcastHouse'],
    44:['Elvebadet','En blå vannrutsjebane slynger seg ned til plaskebassenget.','riverSlides'],
    45:['Bollefabrikken','En mursteinsfabrikk med en bolle større enn pipen.','breadWorks'],
    46:['Bokborgen','Et bibliotek med tårn og en åpen bok på taket.','bookCastle'],
    47:['Elveakvariet','En glasskuppel med fisk som er store nok til å se fra veien.','riverAquarium'],
    48:['Klokketårnet','Fire urskiver og et høyt kobberspir.','clockSpire'],
    49:['Glassverkstedet','Fem tak i ulike farger og en rekke håndblåste vaser.','glassWorks'],
    50:['Elveburger','Sving innom hentevinduet for en burger.','driveThrough'],
    51:['Elveby politistasjon','Patruljebilen står klar til utrykning med blålys.','policeStation'],
    52:['Granittfyret','Et høyt steinfyr med messinglanterne og utsiktsgang.','stoneLighthouse','lighthouse'],
    53:['Elveby bilvask','Biler kjører gjennom vaskebåsen og kommer ut blanke og fine.','carWash'],
  },
  moon:{
    37:['Målenåla','En restaurant som roterer over månebasen.','needleTower'],
    38:['Stjerneøyet','Et romteleskop med små følgeteleskoper.','telescopeArray','telescope'],
    39:['Roverhangaren','Et buet verksted med en rover utenfor.','hangar'],
    40:['Støvfabrikken','Fabrikken lager deler av månestøv.','refinery'],
    41:['Orbital panorama','Et utsiktshotell over månebasen.','auroraHotel'],
    42:['Islaboratoriet','Her undersøkes is fra kratrene.','craterLab'],
    43:['Måneåkeren','Drivhus og grønne vekster under glass.','biodome'],
    44:['Måneflyplassen','Se romfergen ta av fra den opplyste rullebanen og lande igjen.','shuttlePort','flight'],
    45:['Prismetårnet','Et blått glasstårn med krystallspir, gyllen ring og lysbro.','prismTower'],
    46:['Novaspiret','Et høyt, lilla spir med skrå Saturn-ring og lysende antenne.','novaTower'],
    47:['Halotårnene','To grønnblå tårn med tallerkentak og lysende ringer.','haloTower'],
    48:['Støvsuget','En støvrutsjebane fra et romtårn ned i et basseng med mykt månestøv.','dustSlides'],
    49:['Kometkafeen','En lysende komet viser hvor du kan bestille kakao.','cometCafe'],
    50:['Rover-vasken','To vaskebåser til støvete månebiler.','roverWash'],
    51:['Kraterkinoen','En filmkuppel med lysmaster og et stort KRATER-skilt.','craterCinema'],
    52:['Romposten','En rosa postkasse er stor nok for pakker fra hele solsystemet.','moonPost'],
    53:['Solspeilet','Et stort speil fanger lyset og sender det mellom to små kupler.','sunMirror'],
    54:['Rover Burger','Rovere svinger innom og henter kratere med ekstra ost.','driveThrough'],
    55:['Luna Grand Resort','Et romhotell ved Månestøvsjøen, med panoramatårn og et basseng fylt med mykt månestøv.','lunarResort'],
    56:['Kraterpatruljen','Et kuppelformet politihus med en egen månepatrulje.','policeStation'],
  },
  island:{
    37:['Korallfyret','Et korallrødt fyr viser vei mellom revene.','lighthouse'],
    38:['Palmehangaren','Et småfly venter utenfor den buede hangaren.','hangar'],
    39:['Gullpalmen','Et høyt kasinotårn med avrundede etasjer og en gyllen palme på toppen.','casino'],
    40:['Palmefabrikken','Her tappes tropisk fruktjuice på flasker.','factory'],
    41:['Lagunehagen','Gangstier og en trebro over en grønn lagune.','lagoonPark'],
    42:['Lagunetårnet','En rund utsiktsring over palmetoppene.','lagoonTower'],
    43:['Mangohotellet','Store balkonger og utsikt mot havet.','sunsetHotel'],
    44:['Mangoparken','En rosa og gyllen vannrutsjebane med mange svinger.','mangoSlides'],
    45:['Surfemuseet','Brett i alle farger under et tak formet som en bølge.','surfMuseum'],
    46:['Solhatthotellet','En kjempestor solhatt gir skygge til gjestene i toppetasjen.','sunhatHotel'],
    47:['Korallakvariet','Fisk og korallfarger under en turkis glasskuppel.','coralAquarium'],
    48:['Kokosobservatoriet','Et teleskop stikker opp av en gigantisk kokosnøtt på stylter.','coconutTower'],
    49:['Ispalasset','Tre store iskremkjegler ruver over markisen.','icePalace'],
    50:['Mango Express','Biler henter mangois og smoothie på vei til stranden.','driveThrough'],
    51:['Palmeøyens politistasjon','Et politihus med grønt tak og en patruljebil til øyens gater.','policeStation'],
    52:['Stormfyret','Et klassisk, høyt steinfyr med gyllen lampe og veranda rundt lykten.','stoneLighthouse','lighthouse'],
    53:['Kokosvasken','En vaskehall med palmegrønne søyler og skum til sandete biler.','carWash'],
  },
};

export const landmarkStages=(theme,style,site,index=site?.index)=>{
  const slide=slidePark(style);
  if (slide) return slide;
  const stages=art[style]?.(theme,site,index);
  if (!stages) return null;
  if (['driveThrough','lunarResort','residence'].includes(style)) return stages;
  return theme==='moon'?lunarArchitecture(style,stages,index):earthAccents(theme,style,stages,index);
};
