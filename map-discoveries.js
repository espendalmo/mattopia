import {box,beam,rounded,roof,tube,dome,placeParts,pointOnSite,visitor} from './scenery.js';
import {regionSurface,regionVisibility} from './regions.js';
import {randomGenerator} from './worlds.js';

const timber='#8d705b';
const iron='#57616d';
const gold='#f2cb72';
const rock=(x,z,w,d,h,color,y=-.13,phase=0)=>({shape:'boulder',x,z,w,d,h,color,y,phase});

function opening(color) {
  return {shape:'plate',x:0,y:1.11,z:.88,w:2.2,d:.01,h:2.05,color,
    profile:[[-1.01,-1.1],[1.01,-1.1],[.96,.38],[.53,.92],[-.47,.98],[-.98,.42]]};
}

function mine(moon=false) {
  const stone=moon?'#8d89ab':'#8c9581';
  const parts=[rock(-1.24,.18,2.07,2.02,2.29,stone),rock(1.27,.06,2.18,2.15,2.41,stone,-.2,1.8),
    rock(-.03,-.29,3.76,2.45,2.64,stone,-.24,.62),opening('#242936'),
    rock(.11,.25,2.82,1.6,.64,moon?'#a6a1bc':'#a6aa91',1.96,1.25)];
  if (moon) return [...parts,dome(-.95,1.19,.43,.32,.19,'#86d8de',.17),dome(1.23,1.27,.49,.42,.23,'#a3a2e0',.09)];
  return [...parts,...[-1,1].flatMap(side=>[
    beam([side*1.04,.02,1.02],[side*.88,2.06,1.02],.24,timber),
    beam([side*.34,.046,.61],[side*.34,.055,2.68],.092,iron),
  ]),beam([-1.05,2.05,1.04],[1.05,2.05,1.04],.28,timber),
    ...Array.from({length:5},(_,i)=>box(0,.97+i*.39,1.02,.155,.085,timber,.017)),
    rounded(.18,2.18,.78,.85,.43,'#8b775e',.15),tube(.18,2.18,.91,.94,.09,iron,.55),
    dome(.18,2.18,.47,.48,.17,gold,.62),dome(-1.54,1.18,.25,.25,.28,gold,1.12)];
}

function prospectorCamp() {
  return [roof(-.47,-.35,2.53,2.23,1.73,'#b19f6c',.05),
    ...[-1,1].map(side=>beam([-.47+side*1.35,.04,.84],[-.47,1.87,.84],.092,timber)),
    beam([-.47,1.87,-1.58],[-.47,1.87,1.13],.092,timber),
    box(-.48,.84,1.49,.03,1.05,'#3d493e',.025),
    rounded(1.13,.78,.92,.62,.45,timber,.03),box(1.13,.78,.96,.67,.084,'#ae8d6b',.46),
    tube(1.32,1.76,.8,.68,.11,iron,.06),dome(1.28,1.7,.21,.21,.09,gold,.16),
    beam([1.81,.12,-.33],[1.51,1.21,-.45],.078,timber),box(1.8,-.33,.34,.18,.14,iron,.06),
    ...[-.44,.02,.42].map(dx=>rock(dx,1.84,.27,.23,.13,'#aeb09b'))];
}

function oldWell() {
  return [tube(0,0,1.73,1.73,.72,'#a9a69c',.04),tube(0,0,1.36,1.36,.07,'#2f4045',.754),
    ...[-1,1].map(side=>beam([side*.78,.03,0],[side*.71,1.94,.06],.17,timber)),
    roof(0,0,2.36,1.65,.79,'#826c61',1.88),beam([-.74,1.51,.09],[.74,1.51,.09],.105,timber),
    beam([.14,1.52,.11],[.14,.9,.11],.035,'#c4a987'),tube(.14,.11,.31,.31,.33,iron,.71)];
}

function shed() {
  const boards=['#9c805f','#b29672','#b8a083','#896f58'];
  return [rounded(0,-.05,2.47,2.31,1.63,'#88745f',.04),
    ...Array.from({length:9},(_,i)=>box(-1.16+i*.28,1.12,.245,.083,1.68-(i%3)*.035,boards[i%4],.04)),
    roof(-.18,-.17,2.95,2.79,.83,'#8d6157',1.67),box(.74,.21,.78,2.07,.12,'#ac7e63',1.78),
    box(-.18,1.18,.76,.09,1.33,'#3b4140',.06),
    beam([-.66,.12,1.26],[.38,1.32,1.26],.098,'#ab8865'),
    rock(-1.58,.83,.49,.44,.3,'#afad8f'),
    beam([1.63,.03,.18],[1.25,1.21,.98],.11,'#a18363'),tube(-1.44,-.93,.17,.17,.49,iron,1.83)];
}

function oldCart() {
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

function wreck() {
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

function crystals() {
  const clusters=[[-.96,-.31,.78,1.47,'#ac85d8'],[.1,.13,1.16,2.43,'#83cfcf'],[.96,-.41,.86,1.64,'#e6a6ba'],[-.35,.81,.56,.93,'#a8c3f0']];
  return [rock(0,0,4.1,2.8,.58,'#8586a5'),...clusters.flatMap(([x,z,w,h,color],i)=>[
    {shape:'cone',x,y:.19,z,w,d:w,h,color},sparkle(x+.14,h*.76+.2,z+w*.28,i*1.7,color),
  ])];
}

function saucer() {
  return [rock(-.12,.08,4.76,3.42,.39,'#74748f'),tube(0,0,4.07,3.29,.22,'#726f92',.25),
    dome(0,0,4.16,3.33,.62,'#a3b9c9',.35),dome(-.41,-.13,1.81,1.49,.77,'#8bbae1',.79),
    ...[-1.14,-.58,0,.62,1.23].map((x,i)=>dome(x,1.40-.19*Math.abs(x),.23,.2,.18,i%2?'#e9aa81':'#86d6d6',.51)),
    beam([-.5,.82,-.56],[-1.98,1.71,-.39],.09,iron),sparkle(-1.98,1.71,-.39,1.3,'#f0b09e'),
    ...[-1,1].map(side=>rock(side*1.89,1.2,.53,.71,.29,'#b4adbb',.01,side))];
}

function hidingRock() {
  return [rock(-.31,.18,2.89,2.39,1.66,'#a29ab6',-.17,1.4),rock(1.16,.16,1.69,1.5,.83,'#aaa3b9',-.12,3.6),
    rock(-1.62,.67,.85,.91,.45,'#a49fba',-.08,.75),dome(.86,.74,.39,.39,.33,'#8bacc2',.05)];
}

const catalog={
  city:[
    {model:()=>mine(),names:['Den gamle gullgruva','Knekten gruve','Gruva ved elva'],stories:['Gruvevogna står klar. Den siste gullgraveren tok visst med seg både gull og matpakke.','Se etter sporene i bakken. De siste skinnene ble lagt av en som målte i støvellengder.','Det glimter i vogna. Kanskje det bare er en knapp fra en gullgraverjakke?']},
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
    {model:()=>mine(true),names:['Kratersprekka','Den lilla månehula','Ekkoporten'],stories:['Det lyser svakt innenfor åpningen. Kanskje noen har satt igjen en romlykt.','Hula lager ekko. Det er praktisk når du vil le av din egen vits to ganger.','En rover fikk så vidt plass til de to forhjulene. Resten ventet pent utenfor.']},
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
    const key=`discovery:${site.index}`;
    const {names,stories,model,peek}=site.type;
    info[key]={name:names[site.choice%names.length],story:stories[Math.floor(site.choice/7)%stories.length],
      status:'Kartfunn',sound:'discovery',voice:site.choice};
    parts.push(...placeParts(model(),site).map(part=>({...part,entity:key})));
    if (peek&&!visitor) visitor=peekActor(site,site.choice);
  }
  return {parts,info,sites:finds,visitor};
}
