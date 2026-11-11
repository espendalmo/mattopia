import {box,beam,rounded,roof,tube,dome,placeParts,pointOnSite,visitor,actor} from './scenery.js';
import {regionSurface,regionVisibility} from './regions.js';
import {randomGenerator} from './worlds.js';

const timber='#8d705b';
const iron='#57616d';
const gold='#f2cb72';
const rock=(x,z,w,d,h,color,y=-.13,phase=0)=>({shape:'boulder',x,z,w,d,h,color,y,phase});

const arch=[[-1.01,-1.1],[1.01,-1.1],[.96,.38],[.53,.92],[-.47,.98],[-.98,.42]];
const wedge=[[-1.2,-1.1],[1.24,-1.1],[.95,.18],[.33,.76],[-.8,.59]];
const squared=[[-.86,-1.1],[.86,-1.1],[.8,.79],[-.8,.79]];

function opening(color,variant) {
  return {shape:'plate',x:0,y:1.11,z:.95,w:2.2,d:.01,h:2.05,color,
    profile:[arch,wedge,squared][variant]};
}

function mine(moon,variant) {
  const stone=(moon?['#8d89ab','#8a7d9e','#a19caf']:['#8c9581','#a09776','#889295'])[variant];
  const low=variant===1;
  const parts=[rock(-1.25,.18,2.06,2.02,low?1.66:2.29,stone,-.13,variant),
    rock(1.29,.06,2.14,2.15,low?2.01:2.41,stone,-.2,1.8+variant),
    rock(-.03,-.42,3.86,2.62,low?1.97:2.64,stone,-.24,.62+variant),opening('#242936',variant),
    rock(.11,.25,low?3.31:2.82,1.6,.64,moon?'#a6a1bc':'#a6aa91',low?1.42:1.96,1.25+variant)];
  if (moon) {
    const tints=[['#86d8de','#a3a2e0'],['#d9a4de','#b57ed6'],['#e8c3a1','#9bb8e7']][variant];
    return [...parts,...[-1,1].flatMap((side,i)=>[
      dome(side*1.29,1.27,.42+variant*.13,.32,.22,tints[i],.08),
      rock(side*1.67,1.31,.58,.59,.28,stone),
      sparkle(side*1.28,.44,1.32,i+variant,tints[i]),
    ]),...(variant===2?[rock(-.4,1.25,.53,.35,.29,'#ab9ab6'),rock(.42,1.7,.61,.44,.19,stone)]:[])];
  }
  if (variant===1) return [...parts,
    ...[-.7,.4].map((x,i)=>beam([x,.06,1.15],[x+(i?.27:-.16),1.91,1.15],.19,timber)),
    beam([-1.03,1.64,1.18],[.97,.44,1.18],.19,'#a48965'),
    rock(-1.47,1.39,.77,.81,.51,'#a39476'),rock(1.36,1.4,.91,.66,.42,'#899380'),
    box(1.13,1.15,.16,.18,1.49,timber,.02),box(1.13,1.27,.52,.087,.25,gold,1.11)];
  if (variant===2) return [...parts,
    ...[-1,1].flatMap(side=>Array.from({length:6},(_,i)=>box(side*(.99-i*.017),1.07,.3,.48,.278,
      ['#a7a8a0','#a1a295','#888f87'][i%3],.08+i*.28))),
    box(0,1.02,2.22,.49,.28,'#a9a697',1.89),
    ...[-.44,.44].map(x=>beam([x,.065,1.01],[x,.065,2.54],.079,iron)),
    ...[-.66,-.23,.21,.6].map((x,i)=>rock(x,1.73+i*.24,.38,.44,.24,'#9e9180'))];
  return [...parts,...[-1,1].flatMap(side=>[
    beam([side*1.04,.02,1.02],[side*.88,2.06,1.02],.24,timber),
    beam([side*.34,.046,.61],[side*.34,.055,2.68],.092,iron),
  ]),beam([-1.05,2.05,1.04],[1.05,2.05,1.04],.28,timber),
    ...Array.from({length:5},(_,i)=>box(0,.97+i*.39,1.02,.155,.085,timber,.017)),
    rounded(.18,2.18,.78,.85,.43,'#8b775e',.15),tube(.18,2.18,.91,.94,.09,iron,.55),
    dome(.18,2.18,.47,.48,.17,gold,.62),dome(-1.54,1.18,.25,.25,.28,gold,1.12)];
}

function prospectorCamp(variant) {
  if (variant===1) return [
    ...[-1,1].flatMap(side=>[beam([side*1.18,.02,-.87],[side*.79,1.46,-.96],.11,timber),
      beam([side*1.18,.02,.5],[side*.79,1.46,.38],.11,timber)]),
    {...roof(-.3,-.38,2.98,1.81,1.2,'#a99774',.13),angle:-.48},
    rounded(1.3,.37,1.04,.72,.54,'#ac8961',.04),box(1.3,.37,1.05,.75,.09,'#be9a6d',.57),
    ...[-.53,-.08,.42,.71].map((x,i)=>rock(x,1.39+Math.sin(i)*.35,.45,.41,.16,'#aaa29a')),
    beam([.48,.09,1.56],[1.69,.19,1.88],.13,timber),tube(1.83,1.82,.49,.51,.12,iron,.07)];
  if (variant===2) return [
    roof(-.66,-.46,2.11,1.87,1.5,'#8b9c80',.035),roof(.87,-1.02,1.8,1.64,1.18,'#b9a47a',.02),
    rounded(.71,1.18,1.66,.61,.15,timber,.41),...[-1,1].map(side=>box(.71+side*.69,1.18,.12,.49,.45,timber)),
    tube(.66,1.14,.72,.55,.13,iron,.56),dome(.73,1.14,.3,.32,.12,gold,.66),
    beam([-1.41,.08,1.12],[-1.35,1.24,.92],.082,timber),box(-1.41,1.12,.36,.15,.21,iron,.03),
    tube(-.69,.95,.37,.34,.36,'#a27f59',.06),rock(.87,2.11,.54,.48,.17,'#a9a28b')];
  return [roof(-.47,-.35,2.53,2.23,1.73,'#b19f6c',.05),
    ...[-1,1].map(side=>beam([-.47+side*1.35,.04,.84],[-.47,1.87,.84],.092,timber)),
    beam([-.47,1.87,-1.58],[-.47,1.87,1.13],.092,timber),
    box(-.48,.84,1.49,.03,1.05,'#3d493e',.025),
    rounded(1.13,.78,.92,.62,.45,timber,.03),box(1.13,.78,.96,.67,.084,'#ae8d6b',.46),
    tube(1.32,1.76,.8,.68,.11,iron,.06),dome(1.28,1.7,.21,.21,.09,gold,.16),
    beam([1.81,.12,-.33],[1.51,1.21,-.45],.078,timber),box(1.8,-.33,.34,.18,.14,iron,.06),
    ...[-.44,.02,.42].map(dx=>rock(dx,1.84,.27,.23,.13,'#aeb09b'))];
}

function oldWell(variant) {
  if (variant===1) return [rounded(0,0,2.08,1.83,.68,'#949e86',.036),box(0,0,1.58,1.27,.055,'#2f4241',.7),
    ...[-1,1].flatMap(side=>[box(side*.9,0,.17,1.89,.12,'#9ca78a',.7),box(0,side*.84,1.65,.18,.13,'#a5a88b',.71)]),
    beam([-1.04,.1,-.59],[-.84,2.25,-.62],.19,timber),beam([-.86,2.19,-.61],[1.04,2.09,-.46],.14,timber),
    beam([.49,2.13,-.5],[.49,.98,-.5],.044,'#bc9d73'),tube(.49,-.5,.37,.37,.34,iron,.85),
    ...[-.94,.55,1.11].map((x,i)=>dome(x,.65-i*.61,.48,.42,.23,'#7d9773',.67))];
  if (variant===2) return [tube(0,0,2.05,2.05,.43,'#9ea38a',.05),tube(0,0,1.59,1.59,.034,'#334b46',.46),
    ...Array.from({length:10},(_,i)=>rock(.95*Math.cos(i*Math.PI/5),.95*Math.sin(i*Math.PI/5),.43,.45,.26,'#b1b099',.39,i)),
    beam([-1.32,.12,-.65],[-.86,1.07,.05],.14,timber),beam([-.83,1.07,.05],[.49,.66,.12],.095,timber),
    tube(1.23,.66,.38,.38,.35,iron,.035),rock(-1.15,1.24,.56,.42,.25,'#879c75')];
  return [tube(0,0,1.73,1.73,.72,'#a9a69c',.04),tube(0,0,1.36,1.36,.07,'#2f4045',.754),
    ...[-1,1].map(side=>beam([side*.78,.03,0],[side*.71,1.94,.06],.17,timber)),
    roof(0,0,2.36,1.65,.79,'#826c61',1.88),beam([-.74,1.51,.09],[.74,1.51,.09],.105,timber),
    beam([.14,1.52,.11],[.14,.9,.11],.035,'#c4a987'),tube(.14,.11,.31,.31,.33,iron,.71)];
}

function shed(variant) {
  const boards=['#9c805f','#b29672','#b8a083','#896f58'];
  if (variant===1) return [
    ...[-1,1].flatMap(side=>[-1,1].map(depth=>beam([side*1.12,-.02,depth*.86],[side*1.08,1.91,depth*.86],.17,timber))),
    box(0,-.08,2.51,2.01,.17,'#a98962',.68),
    ...[-1,1].flatMap(side=>Array.from({length:7},(_,i)=>box(side*1.12,-.86+i*.29,.09,.25,1.28,boards[(i+1)%4],.74))),
    roof(0,-.07,2.95,2.37,.81,'#b6a171',1.86),roof(-.81,-.16,1.58,2.51,.41,'#a59365',1.69),
    ...[-.6,.23,.58].map((x,i)=>dome(x,.75,.41,.39,.38,'#a58158',.89+i*.02)),
    box(1.52,.59,.55,.64,.4,'#c19f6e',.02),beam([-.59,.09,1.74],[.62,1.08,1.03],.13,timber)];
  if (variant===2) return [
    ...Array.from({length:8},(_,i)=>box(-1.35+i*.34,-.93,.28,.12,i%3===0?.72:1.62,boards[i%4],.04)),
    ...Array.from({length:6},(_,i)=>box(1.19,-.75+i*.32,.12,.28,1.48-i*.15,boards[(i+1)%4],.02)),
    ...[-1,1].map(side=>beam([side*1.24,.03,-1],[side*1.11,2.13,-.88],.18,timber)),
    beam([-1.12,2.14,-.87],[1.13,1.9,-.92],.19,timber),
    {...roof(-.14,-.1,2.25,1.86,.79,'#ad7d5f',.41),angle:.42},
    box(-1.02,.99,.72,1.37,.15,'#8c7770',.13),box(-.94,.96,.49,1.12,.12,'#b4a17f',.25),
    rock(1.65,1.2,.49,.55,.29,'#a2a58a')];
  return [rounded(0,-.05,2.47,2.31,1.63,'#88745f',.04),
    ...Array.from({length:9},(_,i)=>box(-1.16+i*.28,1.12,.245,.083,1.68-(i%3)*.035,boards[i%4],.04)),
    roof(-.18,-.17,2.95,2.79,.83,'#8d6157',1.67),box(.74,.21,.78,2.07,.12,'#ac7e63',1.78),
    box(-.18,1.18,.76,.09,1.33,'#3b4140',.06),
    beam([-.66,.12,1.26],[.38,1.32,1.26],.098,'#ab8865'),
    rock(-1.58,.83,.49,.44,.3,'#afad8f'),
    beam([1.63,.03,.18],[1.25,1.21,.98],.11,'#a18363'),tube(-1.44,-.93,.17,.17,.49,iron,1.83)];
}

function oldCart(variant) {
  if (variant===1) return [
    rounded(-.02,-.42,1.97,2.73,.2,'#ab8564',.63),
    ...[-1,1].flatMap(side=>[box(side*.92,-.42,.11,2.63,.54,timber,.78),
      tube(side*1.08,.36,.19,1.24,1.24,'#755f50',.026,'x'),tube(side*1.17,.36,.03,.9,.9,'#a58b6d',.21,'x'),
      beam([side*.55,.64,.66],[side*.79,.07,2.48],.14,timber)]),
    ...[-.53,.11,.59].flatMap((x,i)=>[-1.22,-.65,.02].map((z,j)=>dome(x,z,.46,.51,.42,'#b39763',.82+((i+j)%2)*.16))),
    beam([-1.06,1.15,-1.63],[1.06,1.15,-1.63],.19,timber)];
  if (variant===2) return [
    {...rounded(.16,-.64,1.84,2.18,.24,'#9c7a5f',.18),angle:-.47},
    beam([-.91,.21,.39],[.68,.29,1.72],.16,timber),beam([-.5,.35,.16],[1.37,.04,1.58],.14,'#b7936c'),
    tube(-1.11,-.58,.18,1.32,1.32,'#7a6657',.06,'x'),tube(-1.215,-.58,.035,1.03,1.03,'#ab9074',.211,'x'),
    {...tube(1.37,1.45,1.21,1.19,.15,'#7a6657',.05),angle:.12},
    tube(1.37,1.45,.9,.91,.055,'#a98d6a',.18),rounded(.57,-1.15,.75,.62,.46,'#ae9673',.43),
    box(-.21,-.55,1.42,.15,.37,'#b38d65',.44)];
  return [rounded(0,-.23,1.64,2.39,.24,timber,.49),
    ...[-1,1].map(side=>box(side*.81,-.23,.105,2.31,.46,'#a68661',.66)),
    box(0,-1.37,1.61,.11,.48,'#997753',.65),
    ...[-1,1].flatMap(side=>[
      tube(side*.98,.38,.16,1.26,1.26,'#6c594f',.05,'x'),tube(side*1.071,.38,.028,1.03,1.03,'#a48665',.162,'x'),
      ...[0,1,2,3].map(i=>{
        const a=i*Math.PI/2;
        return beam([side*1.10,.68,.38],[side*1.10,.68+.48*Math.sin(a),.38+.48*Math.cos(a)],.061,'#67554c');
      }),
      beam([side*.48,.51,.85],[side*.69,.10,2.46],.13,timber),
    ]),rounded(.19,-.65,.73,.65,.46,'#ae9673',.73),
    tube(1.61,1.32,.8,.83,.13,'#6c594f',.042),tube(1.61,1.32,.59,.61,.065,'#a48665',.15)];
}

function wreck(variant) {
  if (variant===1) return [
    ...[-1,1].flatMap(side=>[
      beam([-.21+side*.78,.24,-1.34],[side*.91,.39,.44],.24,timber),
      beam([side*.91,.39,.44],[.22,.53,1.49],.24,timber)]),
    ...[-1.12,-.68,-.23,.22,.68].map((z,i)=>box(0,z,1.4-i*.13,.26,.11,'#b99971',.17+i*.032)),
    beam([-.27,.2,-.54],[-1.71,1.3,-.73],.2,'#ab8c72'),rock(-1.46,1.34,.61,.52,.31,'#a7a892'),
    tube(1.36,1.09,.37,.37,.58,'#78a49b',.035),tube(1.36,1.09,.29,.29,.04,'#b0d1b7',.586)];
  if (variant===2) return placeParts([
    ...[-1,1].map(side=>dome(side*.58,0,1.07,3.45,.79,side<0?'#ba8f62':'#aa795c',.07)),
    ...[-1.19,-.77,-.37,.07,.51,.96].map(z=>beam([-.67,.45,z],[.63,.58,z],.14,timber)),
    beam([-.4,.52,-.3],[-1.39,1.81,-.04],.15,timber),beam([-1.4,1.81,-.04],[-1.09,1.35,.74],.092,'#be9572'),
    box(1.42,.94,.72,.56,.41,'#c4a47b',.04),box(1.41,.94,.73,.57,.07,gold,.44),
  ],{x:0,y:0,z:0,yaw:.43});
  return [rounded(-.1,0,1.84,3.17,.48,'#96755c',.04),rounded(-.1,-.11,1.66,2.71,.21,'#d3ad7a',.43),
    ...[-1,1].map(side=>beam([side*.67,.44,-1.3],[side*.94,.6,.66],.13,timber)),
    beam([.02,.39,-.21],[1.51,1.1,.65],.14,'#ac8f6c'),beam([1.51,1.1,.65],[2.16,.22,1.02],.107,'#ac8f6c'),
    rounded(-1.43,.85,.87,.61,.32,'#a88455',.085),box(-1.43,.85,.91,.63,.08,gold,.39),
    tube(1.28,-.82,.29,.55,.29,'#719f94',.045,'z')];
}

function sparkle(x,y,z,phase,color='#d8f4ed') {
  return {shape:'plate',x,y,z,w:.46,d:.01,h:.47,color,life:[0,0,0,-2-phase],
    profile:[[0,.235],[.065,.068],[.23,0],[.065,-.068],[0,-.235],[-.065,-.068],[-.23,0],[-.065,.068]]};
}

function crystals(variant) {
  const clusters=[
    [[-.96,-.31,.78,1.47,'#ac85d8'],[.1,.13,1.16,2.43,'#83cfcf'],[.96,-.41,.86,1.64,'#e6a6ba'],[-.35,.81,.56,.93,'#a8c3f0']],
    [[-1.35,.11,1.19,1.74,'#ecc28a'],[-.46,-.72,.68,1.18,'#dc928f'],[.67,-.49,1.24,2.81,'#e29dc3'],[1.48,.48,.67,1.11,'#e6ae83'],[.21,.95,.38,.72,'#f0d4b4']],
    [[-1.16,-.42,.81,1.81,'#8f9de3'],[-.67,.63,.85,.87,'#afc2e6'],[.36,-.43,1.12,2.47,'#9088d5'],[1.32,.2,.73,1.71,'#77b9d9'],[.21,1.13,.48,.89,'#82c8c6']],
  ][variant];
  return [rock(0,0,4.1,2.8,.58,'#8586a5',-.13,variant),...clusters.flatMap(([x,z,w,h,color],i)=>[
    {shape:'cone',x,y:.19,z,w,d:w,h,color},sparkle(x+.14,h*.76+.2,z+w*.28,i*1.7,color),
  ])];
}

function saucer(variant) {
  const [rise,tip,bank,stretch,turn,metal,glass]=[
    [.31,-.57,.26,1,.02,'#a6bbc2','#7fbbcd'],
    [.13,.35,-.64,.88,-.39,'#b1a6c4','#86a1da'],
    [.38,.59,.38,1.13,.77,'#99a7bc','#79bcb8'],
  ][variant];
  const rotate=([x,y,z])=>{
    const a=x*Math.cos(bank)-y*Math.sin(bank),b=x*Math.sin(bank)+y*Math.cos(bank);
    const c=z*Math.cos(tip)+b*Math.sin(tip);
    return [a*Math.cos(turn)+c*Math.sin(turn),rise+b*Math.cos(tip)-z*Math.sin(tip),c*Math.cos(turn)-a*Math.sin(turn)];
  };
  const cutoff=.12;
  const panels=[];
  const disk=(rows,palette,dx=0,dz=0)=>{
    const rings=rows.map(([radius,y])=>Array.from({length:16},(_,i)=>{
      const angle=i*Math.PI/8;
      const dent=(variant+i)%11===4?.76:1;
      return rotate([dx+Math.cos(angle)*radius*stretch*dent,y,dz+Math.sin(angle)*radius*.82*dent]);
    }));
    for (let row=1;row<rings.length;row++) {
      for (let i=0;i<16;i++) {
        const j=(i+1)%16;
        const polygon=[rings[row-1][i],rings[row][i],rings[row][j],rings[row-1][j]];
        const outline=polygon.flatMap((point,k)=>{
          const next=polygon[(k+1)%4];
          const above=point[1]>=cutoff,after=next[1]>=cutoff;
          if (above===after) return above?[point]:[];
          const fraction=(cutoff-point[1])/(next[1]-point[1]);
          const edge=point.map((value,axis)=>value+(next[axis]-value)*fraction);
          return above?[point,edge]:[edge];
        });
        if (outline.length>=3) panels.push({shape:'terrain',outline,x:outline[0][0],y:outline[0][1],z:outline[0][2],
          h:.1,color:palette[(row-1)%palette.length]});
      }
    }
  };
  disk([[.44,-.38],[1.77,-.19],[2.05,.035],[1.96,.25],[1.13,.53],[.04,.59]],['#697082','#787b97','#c4a68f',metal,metal]);
  disk([[.89,.52],[.86,.73],[.61,1.09],[.29,1.21],[.035,1.26]],[metal,glass,'#a7cacc',glass],-.22,.04);
  const low=rotate([0,0,tip>0?1.52:-1.52]),edge=rotate([-1.21,.26,.44]);
  const lights=Array.from({length:12},(_,i)=>{
    const a=i*Math.PI/6,[x,y,z]=rotate([Math.cos(a)*1.91*stretch,.22,Math.sin(a)*1.62]);
    return y<cutoff+.04?null:{...dome(x,z,.17,.19,.14,i%2?'#e9aa81':'#86d6d6',y),life:[0,0,0,-2-i*.43]};
  }).filter(Boolean);
  const antenna=[rotate([-.51,.93,-.26]),rotate([-1.35,1.57,-.39])];
  return [
    rock(low[0],low[2],3.14,1.18,.39,'#a29bb0',-.13,variant),...panels,...lights,
    ...(antenna.every(point=>point[1]>cutoff)?[beam(...antenna,.083,iron),sparkle(...antenna[1],1.3,'#f0b09e')]:[]),
    ...[-.75,.25,.84].map((dx,i)=>rock(low[0]+dx,low[2]+.23+i*.17,.65-i*.12,.61,.21+i*.09,'#a9a1b6',-.07,i)),
    rock(edge[0]-.29,edge[2]+.37,.42,.38,.22,'#8e8ca5',-.015,variant),
    beam([low[0]-.54,.028,low[2]*1.22],[low[0]-.83,.046,low[2]*1.66],.11,'#79788b'),
  ];
}

function hidingRock(variant) {
  return [rock(-.31,.18,2.89,2.39,1.66+variant*.27,'#a29ab6',-.17,1.4+variant*3),rock(1.16,.16,1.69,1.5,.83,'#aaa3b9',-.12,3.6),
    rock(-1.62,.67,.85,.91,.45,'#a49fba',-.08,.75),dome(.86,.74,.39,.39,.33,'#8bacc2',.05)];
}

const catalog={
  city:[
    {model:variant=>mine(false,variant),names:['Den gamle gullgruva','Knekten gruve','Gruva ved elva'],stories:['Gruvevogna står klar. Den siste gullgraveren tok visst med seg både gull og matpakke.','Noen har satt et skilt ved inngangen. «Tilbake når jeg finner den andre støvelen.»','Se etter sporene i bakken. De siste skinnene ble lagt av en som målte i støvellengder.']},
    {model:prospectorCamp,names:['Gullgravernes leir','Teltet ved bekken','Panneplassen'],stories:['Panna er full av grus. Gullgraveren var bedre til å steke pannekaker.','Det ligger en rusten spade her. Eieren tok en kaffepause for veldig lenge siden.','Noen har glemt en kiste og en panne. Kanskje de hadde tenkt å komme tilbake før middag.']},
    {model:oldWell,names:['Ønskebrønnen','Brønnen i skogen','Mosebrønnen'],stories:['Byens eldste ønske var en større bolle. Det gikk i oppfyllelse hos bakeren.','Bøtta henger der ennå. Fuglene bruker taket som møteplass.','Hvis du roper «hei» ned i brønnen, sier den «hei» tilbake. Den har gode manerer.']},
  ],
  island:[
    {model:shed,names:['Det skjeve uthuset','Kokosskuret','Snekkerens gamle bod'],stories:['Takplatene ligger litt hulter til bulter. En gekko har overtatt som vaktmester.','Her oppbevarte de kokosnøtter. Nå bor det en krabbe i den minste kassa.','Døra knirker selv når den står stille. Kanskje den bare kjeder seg.']},
    {model:oldCart,names:['Den glemte hestevogna','Kokosvogna','Vogna med løst hjul'],stories:['Det ene hjulet har stukket av. Det kom heldigvis ikke lenger enn én meter.','Vogna fraktet kokosnøtter opp fra stranda. De rullet hjem av seg selv.','Det ligger en kasse igjen. På lokket står det «Viktig. Ikke rist».']},
    {model:wreck,names:['Den lille strandbåten','Vraket i sanda','Krabbekapteinens skute'],stories:['Noen har gitt den gamle båten nytt navn. Nå heter den Krabbeekspressen.','Flaska ved båten inneholder en beskjed. «Send flere boller.»','Det er en kiste ved siden av masta. Den er akkurat passe stor til én kokosnøtt.']},
  ],
  moon:[
    {model:crystals,names:['Glitterkløfta','Prismesteinene','Krystallhagen'],stories:['Krystallene blinker når du ser på dem en stund. En astronaut trodde de prøvde å si hei.','Ingen vet hvorfor den rosa krystallen lyser. Forskerne kaller den Disko.','Tre farger i én liten steinrøys. En rover prøvde å bruke den som trafikklys.']},
    {model:saucer,names:['Den glemte UFO-en','Tallerkenen i støvet','UFO 404'],stories:['UFO-en landet litt skjevt. Føreren har lagt igjen en lapp. «Tilbake etter lunsj.»','Lampene lyser fremdeles. Kanskje nødblinken varer i hundre måneår.','Noen mistet en flygende tallerken. Ingen har funnet resten av serviset.']},
    {model:variant=>mine(true,variant),names:['Kratersprekka','Den lilla månehula','Ekkoporten'],stories:['Det lyser svakt innenfor åpningen. Kanskje noen har satt igjen en romlykt.','Hula lager ekko. Det er praktisk når du vil le av din egen vits to ganger.','En rover fikk så vidt plass til de to forhjulene. Resten ventet pent utenfor.']},
    {model:hidingRock,peek:true,names:['Den mistenkelige månesteinen','Titteberget','Stein med hemmelighet'],stories:['Var det en antenne bak steinen? Stå stille et lite øyeblikk.','Her har noen satt igjen bitte små fotspor. De går bare én vei.','En astronaut mente at steinen vinket. Forskerne vil gjerne ha et bilde.']},
  ],
};

function peekActor(site,seed) {
  return {kind:'walk',peeking:true,parts:visitor('alien','#b1a4ca',undefined,false,.78,seed%8),pose(seconds) {
    const time=(seconds+seed%17)%38;
    const visible=time>=5&&time<9.3;
    const peek=Math.max(0,Math.min(1,(time-5)*2,(9.3-time)*2));
    const [x,y,z]=pointOnSite([-.82-peek*.92,0,-.53],site);
    const turn=site.yaw-.17;
    return {x,y:visible?y:-540,z,cos:Math.cos(turn),sin:Math.sin(turn),stride:Math.sin(seconds*4)*peek*.045,
      rollCos:1,rollSin:0,sound:0};
  }};
}

function nearbyFind(walker,sites,layout) {
  let match=null;
  for (const segment of walker.route.segments) {
    const {x,z,dx,dz,start,end}=segment,span=end-start;
    for (const site of sites) {
      const along=Math.max(0,Math.min(1,((site.x-x)*dx+(site.z-z)*dz)/(span*span)));
      const a=x+dx*along,b=z+dz*along;
      const gap=Math.hypot(site.x-a,site.z-b);
      if (gap<1.6||gap>7.1||match&&gap>=match.gap) continue;
      if ([.33,.66].some(t=>regionSurface(layout,a+(site.x-a)*t,b+(site.z-b)*t).water)) continue;
      match={site,gap,distance:start+span*along};
    }
  }
  return match;
}

function curiousWalker(walker,{site,distance}) {
  const {length}=walker.route;
  const lap=length/walker.speed,pause=3.6;
  let first=((distance-length*walker.phase+length)%length)/walker.speed;
  if (first<11) first+=lap*Math.ceil((11-first)/lap);
  return {...walker,encounter:{key:site.key,x:site.x,z:site.z,first,pause,
    period:lap*Math.max(2,Math.ceil((62+site.choice%27)/lap))+pause}};
}

export function discoveryGuides(walkers,sites,layout,plan) {
  if (!sites.length) return walkers;
  const occupied=new Set();
  const max=plan.plots.length>=14?2:1;
  const guided=walkers.map(walker=>{
    if (occupied.size>=max||walker.kind!=='walk'||!walker.voice||!walker.route) return walker;
    const match=nearbyFind(walker,sites.filter(site=>!occupied.has(site.key)),layout);
    if (!match) return walker;
    occupied.add(match.site.key);
    return curiousWalker(walker,match);
  });
  if (occupied.size) return guided;

  const moon=layout.theme==='moon';
  for (const site of sites) {
    for (const turn of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
      const points=[[-2.66,2.42],[2.62,2.46],[2.92,3.94],[-2.77,3.98]].map(([x,z])=>{
        const [a,,b]=pointOnSite([x,0,z],{...site,yaw:site.yaw+turn});
        return [a,b];
      });
      const clear=points.every(([x,z],i)=>{
        const [a,b]=points[(i+1)%points.length];
        const tiles=[[x,z],[(x+a)/2,(z+b)/2]];
        return tiles.every(([u,v])=>{
          const tile=regionSurface(layout,u,v);
          return !tile.water&&Math.abs(tile.y-site.y)<1.4
            &&!plan.plots.some(plot=>Math.hypot(u-plot.x,v-plot.z)<6.5);
        });
      });
      if (!clear) continue;
      const guide=actor(visitor(moon?'alien':'human','#87ada4',undefined,false,.83,site.choice%8),points,
        {kind:'walk',voice:moon?'alien':'people',elevation:(x,z)=>regionSurface(layout,x,z).y+.06,speed:.75,phase:.17,corner:.52});
      const match=nearbyFind(guide,[site],layout);
      if (match) return [...guided,curiousWalker(guide,match)];
    }
  }
  return guided;
}

export function terrainDiscoveries(layout,plan,full) {
  const options=catalog[layout.theme];
  const seed=(layout.seed^0x607d08ef)>>>0;
  const finds=[];
  const routes=[...plan.paths.flat(),...(plan.transit??[])];
  const plots=[...plan.plots,...Object.values(layout.berths),...(layout.airfield?[layout.airfield]:[])];
  for (let band=0;band<15;band++) {
    const radius=10+band*3.95;
    const type=options[(band+(seed%options.length))%options.length];
    for (let attempt=0;attempt<32;attempt++) {
      const index=band*32+attempt;
      const rng=randomGenerator(seed^Math.imul(index+1,0x7feb352d));
      const angle=rng()*Math.PI*2;
      const x=plan.origin.x+Math.cos(angle)*radius;
      const z=plan.origin.z+Math.sin(angle)*radius;
      if (Math.abs(x)>63||Math.abs(z)>61||regionVisibility(plan,x,z,full)<.66) continue;
      if (finds.some(site=>Math.hypot(x-site.x,z-site.z)<7.3)) continue;
      if (plots.some(plot=>Math.hypot(x-plot.x,z-plot.z)<(plot.airfield?15:(plot.span??9.1)))) continue;
      if (routes.some(point=>Math.hypot(x-point.x,z-point.z)<4.9)) continue;
      const samples=[[-2.5,-2.5],[-2.5,2.5],[2.5,-2.5],[2.5,2.5],[0,0]]
        .map(([dx,dz])=>regionSurface(layout,x+dx,z+dz));
      if (samples.some(tile=>tile.water||tile.bank<.55||layout.theme==='moon'&&tile.basin< -1.9)) continue;
      const heights=samples.map(tile=>tile.y);
      if (Math.max(...heights)-Math.min(...heights)>1.15) continue;
      finds.push({x,y:heights.at(-1)+.035,z,yaw:rng()*.72-.39,index,type,choice:Math.floor(rng()*10000)});
      break;
    }
  }
  const info={},parts=[];
  let visitor;
  for (const site of finds) {
    const key=site.key=`discovery:${site.index}`;
    const {names,stories,model,peek}=site.type;
    const variant=(Math.floor(site.index/(32*options.length))+seed%3)%3;
    info[key]={name:names[variant],story:stories[variant],x:site.x,z:site.z,
      status:'Kartfunn',sound:'discovery',voice:site.choice};
    parts.push(...placeParts(model(variant),site).map(part=>({...part,entity:key})));
    if (peek&&!visitor) visitor=peekActor(site,site.choice);
  }
  return {parts,info,sites:finds,visitor};
}
