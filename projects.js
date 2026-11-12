import {transitVehiclePreview} from './transport.js';
import {box,tube,roof,rounded,dome,at,worldSign,vehicle,worldActors,districtActors} from './scenery.js';
import {isWorld,isRegion,hasExpandedCatalog,grandCatalog,legacyPlacement,worldLayout,worldStatus,worldChoices,WORLD_BUILD_STEPS,RAIL_PLACE,RESIDENCE_PLACE,randomGenerator} from './worlds.js';
import {expandedWorldScene} from './region-scenery.js';
import {NEW_LANDMARKS,EXPANDED_LANDMARKS,GRAND_LANDMARKS,RAIL_LANDMARKS,RESIDENCE_LANDMARKS,landmarkStages,earthStarterStages} from './world-landmarks.js';
import {shapeLandmarkGround} from './landmark-ground.js';
import {detailFacades} from './facades.js';
import {landmarkStory} from './landmark-stories.js';
import {seasonForDate} from './seasons.js';

const stage = (label, ...parts) => ({label,parts:parts.flat()});

export const PROJECTS = {
  armor:{name:'Rustningshelten', icon:'⚡', description:'En rød og gyllen helt med lys i brystet.', total:24},
  spider:{name:'Edderkopphelten', icon:'🕷️', description:'En rød og blå helt med store maskeøyne.', total:24},
  shield:{name:'Skjoldhelten', icon:'🛡️', description:'En blå helt med stjerne og klosseskjold.', total:24},
  city:{name:'Elvebyen', icon:'🏙️', description:'En by med elv, broer, parker, fabrikk og høye hus.', total:120},
  moon:{name:'Månebasen', icon:'🌙', description:'En base med raketter, kupler, rovere og solcellefelt.', total:120},
  island:{name:'Palmeøya', icon:'🌴', description:'Et feriested med strand, hotell, iskrembar og dansegulv.', total:120},
};

export function projectById(id) {
  return Object.hasOwn(PROJECTS,id) ? PROJECTS[id] : null;
}

export function restoreProjects(raw,total,bonusHeroBricks=0) {
  return Object.fromEntries(Object.keys(PROJECTS).map(id => {
    const saved = raw?.[id];
    const budget=total+(isWorld(id)?0:bonusHeroBricks);
    return [id,Number.isSafeInteger(saved) && saved>0 ? Math.min(saved,budget,PROJECTS[id].total) : 0];
  }));
}

const HERO_PALETTES = {
  armor:{main:'#bd3749', light:'#ecaf4c', dark:'#783047', trim:'#6fe1f2', ground:'#67859e', rim:'#325169'},
  spider:{main:'#c64251', light:'#e65b60', dark:'#315d99', trim:'#f6f6ea', ground:'#7776ad', rim:'#4e4d7b'},
  shield:{main:'#356bac', light:'#568ad0', dark:'#263c6c', trim:'#f6f3dc', ground:'#779d9d', rim:'#456f79'},
};

function heroScene(id) {
  const {main,light,dark,trim,ground,rim} = HERO_PALETTES[id];
  const foot = x => [box(x,.54,2.75,3.4,1.15,main,.36,2),rounded(x,2.11,2.72,.34,.32,dark,.49),
    rounded(x,2.18,1.6,.24,.14,light,.94)];
  const leg = (x,y,color) => [box(x,0,2.1,2.2,1.55,color,y,2),
    rounded(x,1.111,1.71,.09,.24,mixColor(color,light,.42),y+.31)];
  const arm = (x,y,color,w=1.55) => [box(x,0,w,2.05,1.45,color,y,1),
    rounded(x,1.05,w*.68,.14,.19,light,y+.24)];
  const emblem = id==='armor' ? [rounded(0,1.52,2.23,.34,1.44,dark,9.91),
    tube(0,1.73,1.38,.19,1.39,trim,9.94,'z'),tube(0,1.84,.77,.12,.76,'#e1f9ff',10.25,'z')]
    : id==='spider' ? [tube(0,1.62,.53,.23,1.28,dark,10.13,'z'),
      ...[-1,1].flatMap(s=>[box(s*.51,1.6,.63,.15,.12,dark,10.34),box(s*.7,1.63,.33,.12,.38,dark,10.09),
        box(s*.49,1.6,.57,.15,.13,dark,10.86),box(s*.65,1.62,.31,.12,.31,dark,10.85)])]
    : [tube(0,1.61,1.48,.17,1.48,dark,10.07,'z'),heroStar(0,10.81,1.716,1.26,trim)];
  const finalPart = id==='shield'
    ? [tube(-4.7,1.37,3.64,.47,3.64,'#d55b64',7.17,'z'),tube(-4.7,1.61,2.91,.21,2.91,trim,7.535,'z'),
      tube(-4.7,1.77,2.29,.21,2.29,'#c9465d',7.845,'z'),tube(-4.7,1.925,1.5,.18,1.5,main,8.24,'z'),
      heroStar(-4.7,8.99,2.025,1.16,trim)]
    : id==='armor'
      ? [box(0,-1.56,4.6,.95,3.1,dark,8.52,3),box(-1.32,-1.85,1.2,1.2,2.8,light,8.73,1),box(1.32,-1.85,1.2,1.2,2.8,light,8.73,1),box(-1.32,-1.85,.8,1.05,.33,trim,8.4),box(1.32,-1.85,.8,1.05,.33,trim,8.4)]
      : [box(0,-1.36,1.5,.28,1.34,light,9.76),box(0,-1.48,2.78,.22,.25,light,10.35),box(0,-1.51,2.09,.19,.22,light,10.9)];
  const steps = [
    stage('Venstre støvel',foot(-1.52)),
    stage('Høyre støvel',foot(1.52)),
    stage('Venstre legg',leg(-1.52,1.51,dark)),
    stage('Høyre legg',leg(1.52,1.51,dark)),
    stage('Venstre kneplate',leg(-1.52,3.06,main),box(-1.52,1.16,1.35,.45,.75,light,3.35)),
    stage('Høyre kneplate',leg(1.52,3.06,main),box(1.52,1.16,1.35,.45,.75,light,3.35)),
    stage('Venstre lår',leg(-1.52,4.61,id==='armor'?light:dark)),
    stage('Høyre lår',leg(1.52,4.61,id==='armor'?light:dark)),
    stage('Hoftene',box(0,0,5.34,2.4,1.31,dark,6.16,4)),
    stage('Beltet',box(0,0,5.55,2.56,.55,id==='shield'?'#be4755':main,7.47,4),rounded(0,1.35,1.21,.29,.43,light,7.54),
      ...[-1,1].map(s=>rounded(s*1.62,1.33,.66,.22,.31,dark,7.57))),
    stage('Nedre del av drakten',box(0,0,5.63,2.53,1.43,main,8.02,4)),
    stage('Brystplaten',box(0,0,6.48,2.92,2.25,main,9.45,4),box(0,.01,5.65,2.6,.53,light,11.7,3),
      ...[-1,1].flatMap(s=>[rounded(s*2.49,1.49,.83,.17,1.53,mixColor(main,dark,.38),9.72),
        rounded(s*2.36,1.61,.58,.12,.23,light,10.79)])),
    stage('Merket på brystet',emblem),
    stage('Venstre skulder',box(-3.83,0,1.76,2.63,1.35,light,10.74,2)),
    stage('Høyre skulder',box(3.83,0,1.76,2.63,1.35,light,10.74,2)),
    stage('Venstre overarm',arm(-4.06,9.29,dark)),
    stage('Høyre overarm',arm(4.06,9.29,dark)),
    stage('Venstre hanske',arm(-4.06,7.84,main,1.82),box(-4.06,.18,1.67,1.98,.62,light,7.22)),
    stage('Høyre hanske',arm(4.06,7.84,main,1.82),box(4.06,.18,1.67,1.98,.62,light,7.22)),
    stage('Kragen',box(0,0,3.04,2.3,.74,dark,12.23,2)),
    stage('Hjelmen',box(0,0,4.22,3.36,2.74,main,12.97,3),box(0,0,3.4,2.86,.6,main,15.71,3)),
    stage('Masken',box(0,1.68,3.7,.46,1.92,id==='armor'?light:main,13.34),box(0,1.75,2.81,.48,.49,id==='armor'?light:main,12.99)),
    stage('Øynene på masken',...[-1,1].flatMap(s=>[
      rounded(s*.92,1.966,1.43,.24,id==='spider'?.86:.52,dark,14.4),
      rounded(s*.92,2.103,1.15,.15,id==='spider'?.65:.32,trim,14.49),
    ]),...(id==='spider'?[]:[rounded(0,1.998,1.43,.13,.13,dark,13.73)])),
    stage(id==='armor'?'Rakettpakken':id==='spider'?'Edderkoppmerket på ryggen':'Det store skjoldet',finalPart),
  ];
  return {
    base:[rounded(0,0,12.85,8.5,.42,rim,-.66),box(0,0,12.3,7.85,.59,ground,-.23,6),
      rounded(0,4.0,5,.41,.29,light,-.15),...[-1,1].map(s=>rounded(s*4.62,4.04,1.56,.15,.11,trim,-.13))],
    steps, background:'#e7eef3', yaw:-.46, pitch:.25, world:false,
  };
}

function heroStar(x,y,z,size,color) {
  const profile=Array.from({length:10},(_,i)=>{
    const angle=Math.PI/2+i*Math.PI/5, radius=(i%2?.23:.5)*size;
    return [Math.cos(angle)*radius,Math.sin(angle)*radius];
  });
  return {shape:'plate',x,y,z,w:size,d:.01,h:size,color,profile,radial:true};
}

const THEMES = {
  city:{grass:'#8cae76', road:'#606e7c', white:'#f3eddd', foundation:'#bcc6ab', leaves:'#4e986b', dark:'#405768', sky:'#e5f0e8'},
  moon:{grass:'#9a9bb7', road:'#6a6d8a', white:'#ece9f3', foundation:'#c9c8d6', leaves:'#59b4aa', dark:'#404565', sky:'#e2e6f6'},
  island:{grass:'#8fbb79', road:'#c6a57b', white:'#fff2ce', foundation:'#e2d0a2', leaves:'#409567', dark:'#405e66', sky:'#dcf0ed'},
};

const PLACES = {
  city:[
    ['Bakeriet','house','#edba66','#bd635a'],['Skolen','school','#e2a36e','#8f625c'],['Møllen','mill','#e5c27c','#b47b52'],['Fotballbanen','field','#58a067'],
    ['Biblioteket','school','#e9c58e','#648eae'],['Hotellet','tower','#94abc8','#596f9b'],['Kirken','church','#e9e4d3','#718491'],['Parken','park','#85ac75'],
    ['Butikken','house','#82b0a5','#5c7fa1'],['Brannstasjonen','school','#d4796d','#774b59'],['Torget','square','#cfbd9c'],['Svømmehallen','pool','#73bed4'],
    ['Verkstedet','house','#9eb59a','#676c86'],['Kafeen','house','#e7a295','#ad6365'],['Kulturhuset','tower','#99a6c9','#646a91'],['Elveparken','park','#85ac75'],
  ],
  moon:[
    ['Landingsplassen','launch','#c5bfd6','#7e83b3'],['Beboelsesmodulen','dome','#e6e1e8','#7697be'],['Solcellefeltet','solar','#6578b6'],['Rovergarasjen','hangar','#c5d0df','#7494b1'],
    ['Drivhuset','dome','#9dd6b9','#60aaac'],['Vannstasjonen','tank','#7db8cd','#50628b'],['Laboratoriet','hangar','#d1cbdc','#9b87ba'],['Observatoriet','dome','#c8b0d3','#77639c'],
    ['Radiostasjonen','tower','#bab9d8','#53618d'],['Verkstedet','hangar','#b9b6cc','#7a6ca1'],['Batteriparken','solar','#6c85c4'],['Forskningsfeltet','park','#a6a3ba'],
    ['Lasteterminalen','hangar','#b8c5db','#637d9e'],['Islageret','tank','#99cadd','#5b99b4'],['Satellittplassen','tower','#cbbddb','#6a5d90'],['Den andre landingsplassen','launch','#c8b7ce','#796f9a'],
  ],
  island:[
    ['Strandhotellet','tower','#f5cd86','#dd986b'],['Iskrembaren','house','#f0a8b1','#cf6d9c'],['Badebukta','pool','#63bdce'],['Surfeskolen','house','#83c6c8','#52a6ac'],
    ['Restauranten','school','#f3b576','#da846c'],['Palmeparken','park','#98c284'],['Dansegulvet','dance','#b493cf'],['Moloen','dock','#c9a17b'],
    ['Kveldsmarkedet','square','#ecc695'],['Badehotellet','tower','#f0d497','#649fa9'],['Strandkafeen','house','#ddac9b','#ab6d85'],['Spaet','pool','#79c6d4'],
    ['Utsiktstårnet','tower','#ddd2a6','#c38770'],['Hengekøyehagen','park','#98c284'],['Fruktboden','house','#f1ac7c','#ca7768'],['Feriestedets torg','square','#e7c49c'],
  ],
};
const SIGNS = {
  city:['bread','book','wind','ball','book','bed','cross','leaf','basket','flame','flag','wave','gear','cup','music','leaf'],
  moon:['rocket','home','sun','wheel','leaf','drop','flask','scope','radio','gear','battery','flask','crate','snow','radio','rocket'],
  island:['palm','ice','wave','board','fork','palm','music','boat','flag','bed','cup','drop','scope','leaf','fruit','sun'],
};

function tree(x,z,theme) {
  const trunk = tube(x,z,.34,.37,1.93,'#9f7961');
  return theme==='island'
    ? [trunk,...Array.from({length:5},(_,i)=>{
      const angle=i*Math.PI*2/5;
      return dome(x+.62*Math.cos(angle),z+.62*Math.sin(angle),1.85,.57,.33,
        i%2?'#519b70':'#75b875',1.87+i*.025,angle);
    })]
    : [trunk,dome(x,z,1.95,1.72,1.48,THEMES[theme].leaves,1.13),
      dome(x+.25,z-.18,1.19,1.15,.98,'#76ad80',1.99)];
}

function beacon(x,z,color) {
  return [box(x,z,.23,.23,1.35,'#62728a'),box(x,z,.55,.49,.27,color,1.33)];
}

function landscape(x,z,w,d,y,color,phase=0) {
  const outline=Array.from({length:40},(_,i)=>{
    const a=-i*Math.PI/20;
    const radius=1+.07*Math.sin(a*3+phase)+.043*Math.cos(a*5+phase);
    return [x+Math.cos(a)*w*radius/2,y,z+Math.sin(a)*d*radius/2];
  });
  return {shape:'landscape',outline,x,y,z,w,d,h:0,color};
}

function mixColor(from,to,amount) {
  const channels=color=>color.slice(1).match(/../g).map(value=>parseInt(value,16));
  const target=channels(to);
  return '#'+channels(from).map((value,i)=>Math.round(value+(target[i]-value)*amount).toString(16).padStart(2,'0')).join('');
}

function landscapeEdge(color,sky) {
  return Array.from({length:25},(_,i)=>landscape(0,0,174-i*3.05,154-i*2.7,-.62+i*.0175,
    mixColor(sky,color,(i/24)**1.7)));
}

function river(ground,sky) {
  const bend=z=>.82*Math.sin(z*.095);
  return Array.from({length:40},(_,i)=>{
    const z=-60+i*3, next=z+3;
    const color=mixColor('#5caac3',mixColor(ground,sky,.48),Math.max(0,(Math.abs(z+1.5)-32)/26));
    return {shape:'landscape',x:bend(z+1.5),y:.027,z:z+1.5,h:0,color,
      outline:[[bend(z)-3.7,.027,z],[bend(next)-3.7,.027,next],
        [bend(next)+3.7,.027,next],[bend(z)+3.7,.027,z]]};
  });
}

function groundTexture(theme) {
  const p=THEMES[theme];
  return Array.from({length:95},(_,i)=>{
    const x=((i*137)%607)/10-30.3, z=((i*113+21)%573)/10-28.6;
    if (theme==='city' && Math.abs(x)<4.25) return null;
    if (theme==='island' && (x/33)**2+((z+.9)/28)**2>1) return null;
    const color=mixColor(p.grass,i%3===0?p.dark:p.white,.085+i%5*.031);
    const y=theme==='island'?.458:.009;
    return landscape(x,z,.42+(i%6)*.19,.22+(i%5)*.24,y,color,i);
  }).filter(Boolean);
}

function groundPatches(theme,y=0) {
  const p=THEMES[theme];
  const patches=theme==='island' ? [[-21,-22,12,7],[-16,22,11,8],[12,19,14,8],[23,-14,15,8],[3,-23,13,5]]
    : [[-35,-18,17,11],[-25,-22,14,7],[-23,11,12,12],[-32,22,10,9],[20,-25,20,11],[29,-4,12,15],[23,23,15,11],[10,26,9,12]];
  return patches.map(([x,z,w,d],i)=>landscape(x,z,w,d,y+.001+i*.0007,
    mixColor(p.grass,i%2?p.white:p.dark,theme==='moon'?.19:.13),i*.7));
}

function cityRoads(p) {
  const curb='#b3b8ac';
  return [
    ...[-16,16].flatMap(x=>[box(x,0,3.86,55,.05,curb,.008),box(x,0,2.67,55,.085,p.road,.04)]),
    ...[0,11].flatMap(z=>[box(0,z,58,3.53,.085,curb,.038),box(0,z,57.8,2.53,.15,p.road,.127),
      ...[-1,1].flatMap(s=>[box(0,z+s*1.47,9,.19,.35,'#d6c9ad',.12),box(0,z+s*1.47,9,.24,.105,'#f3e3bd',.44),
        ...[-4,-2.1,0,2.1,4].map(x=>box(x,z+s*1.47,.28,.28,.47,'#e6d6b7',.12))]),
      ...Array.from({length:16},(_,i)=>-26.25+i*3.5).filter(x=>Math.abs(Math.abs(x)-16)>1.5)
        .map(x=>box(x,z,1.14,.105,.012,'#dfd9bd',.278))]),
    ...[-16,16].flatMap(x=>Array.from({length:12},(_,i)=>-23+i*4)
      .filter(z=>Math.abs(z)>1.9&&Math.abs(z-11)>1.9).map(z=>box(x,z,.105,1.16,.012,'#ddd5af',.128))),
    ...[-16,16].flatMap(x=>[0,11].flatMap(z=>[-1,1].flatMap(side=>
      [-.86,-.44,0,.44,.86].map(dx=>box(x+dx,z+side*2.07,.18,.52,.017,'#f1e5ce',.134))))),
  ];
}

function terrain(theme) {
  const p=THEMES[theme];
  const floor=(...parts)=>parts.map((part,layer)=>({...part,layer}));
  if(theme==='city') return [
    ...floor(...landscapeEdge(p.grass,p.sky),landscape(0,0,101,89,0,p.grass),...groundPatches(theme),...groundTexture(theme),
      ...river(p.grass,p.sky),
      ...Array.from({length:26},(_,i)=>box((i*11%27-13)/6,-36+i*2.8,1.02+i%4*.3,.12+i%3*.055,.01,i%3===0?'#6fb6ca':'#82c6d6',.036)),
      ...cityRoads(p)),
    rounded(-7,-12,3.5,3.1,1.73,'#e9c39a'),roof(-7,-12,4,3.4,1,'#ad6c62',1.73),
    rounded(7,-17,3.1,3,1.65,'#e9d1a2'),roof(7,-17,3.55,3.5,.95,'#688ba3',1.65),...tree(-5.4,-8,'city'),...tree(6.4,14,'city'),
  ];
  if(theme==='moon') return [
    ...floor(...landscapeEdge(p.grass,p.sky),landscape(0,0,101,89,0,p.grass,1.4),...groundPatches(theme),...groundTexture(theme),
      ...[-15,15].map(x=>box(x,0,2.1,51,.07,p.road,.01)),
      ...[-13,-.75,11].flatMap(z=>[box(0,z,56.2,2.24,.08,p.road,.1),
        ...Array.from({length:12},(_,i)=>box(-25.3+i*4.6,z,1.52,.075,.009,'#b3b8d2',.182))]),
      ...[[-2,-18],[0,7],[.7,19]].flatMap(([x,z])=>[tube(x,z,5.9,5.5,.2,'#7d7a91',.01),tube(x,z,4.7,4.35,.12,'#646881',.21),tube(x-.23,z+.2,3.75,3.45,.13,'#6f6d83',.33)])),
    rounded(-6.4,1,3.7,3.05,1.23,'#c3c8dc',.06),dome(-6.4,1,3.5,2.9,1.36,'#a6bbd4',1.28),
    ...[[-6,-4],[5,1],[-8,13],[6,17]].flatMap(([x,z])=>beacon(x,z,'#92dfdf')),
    ...[[-28,-22,1.36],[-26,11,.88],[-9,23,.76],[7,-25,1.4],[22,-24,1.1],[29,2,.66]].flatMap(([x,z,r])=>[
      dome(x,z,r,r*.88,r*.29,'#8689a5',.011),dome(x-.2,z+.6,r*.41,r*.39,r*.13,'#b1aec3',.012),
    ]),
  ];
  return [
    ...floor(...landscapeEdge('#72c2cd',p.sky),
      landscape(0,0,89,79,.02,'#8bd3d7',1),landscape(0,0,85,75,.038,'#a6ded9',1),
      ...Array.from({length:32},(_,i)=>{
        const a=i*2.39996, spread=1.21+(i%8)*.049;
        return box(Math.cos(a)*38*spread,Math.sin(a)*34*spread,1.6+i%4*.5,.11,.013,
          mixColor('#72c2cd','#e2f8f2',.13+i%4*.035),-.186);
      }),
      landscape(0,0,80,70,.16,'#e7c58d',1),
      landscape(0,-.9,74,64,.45,p.grass,1),...groundPatches(theme,.45),...groundTexture(theme),
      ...[-15,15].map(x=>box(x,-.25,1.65,40.6,.07,p.road,.46)),
      ...[.85,11].map(z=>box(0,z,48.3,1.5,.09,p.road,.46))),
    ...[[-3,18],[0,18],[3,18],[-1,-17],[-4,-17],[3,-17],[1,7]].flatMap(([x,z])=>tree(x,z,'island').map(part=>({...part,y:part.y+.43}))),
    rounded(0,-10,4.15,3,1.85,'#efcb91',.45),dome(0,-10,4.75,3.55,1.26,'#c47f71',2.28),
  ];
}

const plot = (index, theme) => {
  const x = [-21,-9,theme==='city'?10.3:9,21][index%4], z = [-18,-6,6,18][Math.floor(index/4)];
  const shoreline = theme==='island' && Math.abs(z)===18 && Math.abs(x)>18;
  return [shoreline?Math.sign(x)*17.8:x, shoreline?Math.sign(z)*15.4:z];
};

function landmark(theme, index, definition, location=plot(index,theme)) {
  const [label, type, color, accent='#698ba7']=definition;
  const [x,z]=location;
  const p=THEMES[theme], y=theme==='island'?.45:.04;
  const wide=['school','hangar','tower'].includes(type);
  const w=wide?6.55:5.45, d=wide?5.8:4.68;
  const wall=type==='tower'?4.1:type==='dome'?1.55:2.17;
  const flat=['field','park','square','pool','dance','dock','solar','launch'].includes(type);
  const B=(dx,dz,bw,bd,h,c,dy=0)=>(Math.min(bw,bd)>=.7&&h>=.2?rounded:box)(x+dx,z+dz,bw,bd,h,c,y+dy);
  const T=(dx,dz,bw,bd,h,c,dy=0)=>tube(x+dx,z+dz,bw,bd,h,c,y+dy);
  const R=(dx,dz,bw,bd,h,c,dy)=>(theme==='island'?dome:roof)(x+dx,z+dz,bw,bd,h,c,y+dy);
  const stages = [[B(.04,.08,w+1.81,d+1.64,.052,mixColor(p.grass,p.dark,.35)),
    B(0,0,w+1.66,d+1.47,.18,p.foundation,.045),
    B(0,0,w+1.39,d+1.16,.048,mixColor(p.foundation,p.white,.54),.212)],[],[],[],[],[]];
  if (!flat) {
    stages[1]=[B(0,0,w,d,wall,color,.2)];
    const window='#6490a5', glass='#a1c7d1';
    stages[2]=[...[-1,1].flatMap(side=>[
      B(0,side*d/2,w+.3,.24,.26,p.white,wall+.12),
      B(side*w/2,0,.29,d-.24,.26,p.white,wall+.12),
    ]),...[-1.72,1.72].flatMap(dx=>[
      B(dx,d/2+.055,1.21,.23,.98,p.white,.91),B(dx,d/2+.188,.95,.086,.74,window,1.02),
      B(dx-.17,d/2+.24,.4,.034,.53,glass,1.15),B(dx,d/2+.27,1.3,.25,.095,p.white,.9),
      B(-w/2-.048,dx,.2,.89,.88,p.white,.97),B(-w/2-.162,dx,.06,.66,.66,window,1.08),
    ])];
    stages[3]=type==='house'||type==='church'||type==='mill'
      ? [R(0,0,w+.6,d+.52,1.32,accent,wall+.39)]
      : ['dome','tank','hangar'].includes(type)
        ? [dome(x,z,w+.15,d+.08,type==='dome'?2.25:1.3,accent,y+wall+.36)]
        : [B(0,0,w+.59,d+.45,.4,accent,wall+.37),...(type==='tower'?[B(0,0,w-.75,d-.79,1.2,color,wall+.77),B(0,0,w-.39,d-.43,.29,accent,wall+1.97)]:[])];
    stages[4]=[B(0,d/2+.14,1.11,.22,1.42,p.dark,.28),
      B(.31,d/2+.27,.105,.09,.11,'#eac888',.84),B(0,d/2+.53,1.48,.51,.13,p.white,.19)];
    if(type==='house') {
      const awning=theme==='island'?'#fff3cd':'#f6d9a2';
      stages[4].push(...Array.from({length:7},(_,i)=>B((i-3)*.29,d/2+.31,.29,.9,.13,i%2?accent:awning,1.93)));
    }
    if (theme==='island'&&type==='house') {
      stages[4].push(...[-1,1].flatMap(side=>[
        B(side*2.03,d/2+.44,.53,.52,.29,'#cf906f',.2),
        dome(x+side*2.03,z+d/2+.44,.59,.56,.38,'#77b68a',y+.43),
      ]));
    }
    if (theme==='city'&&['house','school'].includes(type)) {
      stages[4].push(B(-w*.26,-d*.23,.67,.64,1.13,mixColor(color,p.dark,.39),wall+.5),
        B(-w*.26,-d*.23,.8,.75,.17,accent,wall+1.54));
    }
    if (theme==='island'&&type==='tower') {
      stages[4].push(B(0,d/2+.27,w-.46,.84,.16,p.white,wall-.95),
        B(0,d/2+.64,w-.5,.087,.12,accent,wall-.48),
        ...[-1.9,-.95,0,.95,1.9].map(dx=>B(dx,d/2+.64,.11,.11,.39,p.white,wall-.86)));
    }
    if (theme==='moon'&&type==='dome') {
      stages[4].push(B(.47,d/2+.37,2.44,.76,.48,'#b4b9cd',.24),
        B(.92,d/2+.37,.12,.8,.075,'#e8dbba',.715),
        B(-.03,d/2+.37,.12,.8,.075,'#e8dbba',.715),
        ...[-1,1].map(side=>dome(x+side*(w/2+.08),z+d*.19,.39,.39,.32,'#89c8c9',y+.44)));
    }
    if(type==='tower') stages[4].push(...[-1.7,0,1.7].map(dx=>B(dx,d/2+.03,1.04,.16,.75,'#7aa7bd',2.7)),B(1.23,-.7,.19,.2,1.25,p.dark,wall+2.2),B(1.24,-.7,.55,.27,.18,'#f4d577',wall+3.28));
    if(type==='mill') stages[4].push(B(0,d/2+.28,.37,.4,4.16,p.white,1.31),B(0,d/2+.31,4.26,.37,.39,p.white,3.29),T(0,d/2+.43,.6,.51,.49,accent,3.24));
    if(type==='church') stages[4].push(B(-1.35,.78,1.64,1.66,2.16,color,wall+.45),R(-1.35,.78,1.94,1.96,.97,accent,wall+2.61));
    if(type==='tank') stages[4].push(T(-1.6,1.36,1.51,1.42,2.4,accent,.38),T(1.6,1.36,1.51,1.42,2.4,accent,.38));
  } else {
    stages[1]=[B(0,0,w,d,.14,color,.22)];
    if(type==='field') {
      stages[2]=[B(0,0,.12,d,.02,p.white,.37),...[-1,1].flatMap(s=>[B(s*(w/2-.2),0,.11,d-.2,.02,p.white,.37),B(0,s*(d/2-.17),w-.35,.11,.02,p.white,.37)])];
      stages[3]=[-1,1].flatMap(s=>[B(s*2.42,0,.14,1.93,.13,p.white,.98),...[-.87,.87].map(dz=>B(s*2.42,dz,.17,.15,.63,p.white,.37))]);
      stages[4]=[B(0,-3.05,3.64,.43,.32,'#d6a765',.22),B(0,-3.29,3.64,.27,.35,'#e6c17d',.47),
        T(0,0,.67,.67,.025,p.white,.374),T(0,0,.5,.5,.027,color,.394)];
    } else if(type==='pool') {
      stages[2]=[B(0,0,w-.81,d-.68,.12,'#62b8d1',.31),B(0,d/2-.28,w,.28,.23,p.white,.31)];
      stages[3]=[-1,1].map(s=>B(s*1.08,.16,.12,d-1,.028,'#a2e3e6',.44));
      stages[4]=[T(2.42,2.3,1.44,1.44,.23,'#edb669',1.48),B(2.42,2.3,.12,.12,1.29,p.dark,.27)];
    } else if(type==='launch') {
      stages[2]=[T(0,0,4.35,4.1,.13,'#909ab9',.31),T(0,0,3.52,3.37,.14,'#6e789c',.44)];
      stages[3]=[T(0,0,1.58,1.58,2.97,'#e0e6ef',.55),T(0,0,1.68,1.68,.25,'#da927e',1.26),
        T(0,0,1.62,1.62,.18,accent,2.95),
        tube(x,z+.743,.64,.22,.65,'#52667e',y+2.21,'z'),tube(x,z+.877,.45,.09,.45,'#9acfe1',y+2.31,'z')];
      stages[4]=[dome(x,z,1.58,1.58,1.15,accent,y+3.51),...[-1,1].flatMap(s=>[
        R(s*.82,.21,1.1,.37,1.4,'#bc7479',.55),B(s*1.02,.21,.48,.4,.12,'#efd1a7',.54),
      ]),R(0,.75,.47,.84,.96,'#bc7479',.55)];
    } else if(type==='solar') {
      stages[2]=[-1.68,0,1.68].map(dx=>B(dx,0,.27,.28,1.12,p.dark,.29));
      stages[3]=[-1.68,0,1.68].map(dx=>B(dx,0,1.33,3.25,.28,'#4e68a3',1.31));
      stages[4]=[-1.68,0,1.68].flatMap(dx=>[-1,0,1].map(dz=>B(dx,dz,1.2,.09,.028,'#9cb6e1',1.6)));
    } else if(type==='dock') {
      stages[2]=[-2,0,2].map(dx=>B(dx,.8,.37,.37,.95,'#91705e',.18));
      stages[3]=Array.from({length:7},(_,i)=>B(-2.22+i*.74,.85,.7,2.7,.23,'#c69f76',1.02));
      stages[4]=[B(.2,1.83,2.27,.2,.25,'#fff0ce',1.24),B(-2.2,-1.71,2.1,1.04,.42,'#6cb7c5',.35),B(-2.2,-1.71,1.15,.71,.37,'#f8dbac',.77)];
    } else if(type==='dance') {
      stages[2]=Array.from({length:12},(_,i)=>B((i%4-1.5)*.95,(Math.floor(i/4)-1)*.92,.87,.84,.16,['#f6bb78','#ac9acf','#8ecab1','#e992b1'][i%4],.32));
      stages[3]=[B(0,-2.1,4.3,1.12,.54,'#6e638c',.28),B(0,-2.1,1.89,.72,.55,'#e4aad0',.81)];
      stages[4]=[-2.22,2.22].flatMap(dx=>[B(dx,-2.1,.42,.51,2.09,p.dark,.3),B(dx,-2.1,.92,.75,.4,'#eed183',2.37)]);
    } else {
      stages[2]=[B(0,0,1.21,d-.14,.08,p.white,.35),B(0,0,w-.25,1.04,.09,p.white,.36)];
      stages[3]=[T(0,0,2.3,2.25,.23,accent,.47),T(0,0,1.64,1.62,.27,theme==='moon'?'#8db8ca':'#77bed0',.68)];
      stages[4]=theme==='moon' ? [B(-1.67,-1.37,1.08,1.19,1.02,'#c8b8d8',.33),B(1.67,-1.37,1.18,1.19,.73,'#adc6d5',.33)]
        : [...tree(x-1.83,z-1.42,theme).map(a=>({...a,y:a.y+y+.33})),...tree(x+1.83,z-1.42,theme).map(a=>({...a,y:a.y+y+.33}))];
    }
  }
  const mark=SIGNS[theme][index];
  const signZ=flat ? d/2+.52 : d/2+.33;
  if (flat) stages[4].push(B(-w/2+.32,signZ,.16,.16,1.32,p.dark,.19));
  const signX=flat?-w/2+.34:mark==='ice'?1.22:0;
  const signHeight=flat?1.13:mark==='ice'?wall+1.45:wall+.43;
  stages[4].push(...worldSign(mark,x+signX,y+signHeight,z+signZ,mixColor(accent,p.dark,.57)));
  const edges = theme==='moon' ? [...beacon(x-w/2-.42,z+d/2,'#a2dcde'),...beacon(x+w/2+.42,z+d/2,'#f5ce94')]
    : [...tree(x-w/2-.49,z+d/2,theme),...beacon(x+w/2+.42,z+d/2,'#f4d787')];
  stages[5]=edges.map(part=>({...part,y:part.y+y}));
  const labels = flat ? ['grunnen','flaten','merkingen','utstyret','detaljene','omgivelsene']
    : ['grunnmuren','veggene','fasaden','taket','inngangen og detaljene','omgivelsene'];
  return stages.map((parts,i)=>({...stage(`${label} · ${labels[i]}`,parts),finished:i===stages.length-1?label:null}));
}

function worldDetail(theme,i) {
  const x=[-26,26,-6.7,6.7][i%4], z=-21+Math.floor(i/4)*8.3;
  const p=THEMES[theme], y=theme==='island'?.45:.06;
  const xPos=theme==='island'&&Math.abs(x)>20 ? Math.sign(x)*20 : x;
  const colors=['#edb275','#dd8695','#82b8d0','#9ba2c9'];
  const color=colors[i%colors.length];
  if(i%6===1 || i%6===5) {
    const name=theme==='moon'?'En rover':theme==='city'?'Et kjøretøy':'En strandvogn';
    return stage(name,at(vehicle(theme==='moon'?'rover':theme==='island'?'cart':'car',color),xPos,y,z));
  }
  if(i%6===2 || i%6===4) {
    return stage(theme==='moon'?'Et nytt lyspunkt':'Et nytt hvilested',...beacon(xPos,z,'#f6d997').map(part=>({...part,y:part.y+y})),
      box(xPos+.88,z,.92,1.39,.26,color,y+.09),box(xPos+.88,z-.53,.94,.22,.36,p.dark,y+.24));
  }
  return stage(theme==='moon'?'En liten forsyningsstasjon':theme==='island'?'En palme ved stien':'Et tre langs elven',
    theme==='moon' ? [rounded(xPos,z,1.94,1.72,.76,color,y),dome(xPos,z,1.18,1.28,.34,p.white,y+.76)]
      : tree(xPos,z,theme).map(part=>({...part,y:part.y+y})));
}

function worldScene(theme) {
  const steps=[];
  const detail=i=>{
    const item=worldDetail(theme,i);
    return {...item,finished:item.label};
  };
  PLACES[theme].forEach((definition,i)=>{
    steps.push(...landmark(theme,i,definition).map(step=>({...step,parts:step.parts.map(part=>({...part,landmark:i}))})));
    steps.push(detail(i));
    if(i%2===1) steps.push(detail(16+Math.floor(i/2)));
  });
  return {base:terrain(theme),ambient:worldActors(theme),steps,background:THEMES[theme].sky,yaw:-.62,pitch:.57,world:true};
}

const DETAILS = {
  city:['Brødskilt og stripete markise.','Et sted å lære med lyse vinduer.','En vindmølle med store vinger.','Mål, midtsirkel og tribune.',
    'Bøker og vinduer i blått.','Et hotell med flere etasjer.','Et lite tårn over hustakene.','Trær, benker og en fontene.',
    'En butikk med kurv på skiltet.','Rød fasade og flammeskilt.','Et torg med plass til folk.','Basseng med baner.',
    'Et verksted med tannhjul på veggen.','Kaffekopp på skiltet og en koselig inngang.','Musikkskilt og mange vinduer.','Et grønt pust ved elven.'],
  moon:['Rakett, landingsmerker og lys.','En stor kuppel å bo i.','Solpaneler som gir strøm.','Et hjem til månebilene.',
    'En grønn kuppel for planter.','Beholdere for vann.','Et laboratorium med instrumenter.','Et sted å se ut i rommet.',
    'Antenner til meldinger hjem.','Utstyr til å reparere ting.','Paneler og batterier til basen.','Et område for forsøk.',
    'Et sted å ta imot forsyninger.','Lager for is og vann.','Et tårn med radiosignal.','En ekstra rakettplass.'],
  island:['Hotell med balkong ved stranden.','Iskjegleskilt og stripete markise.','En badeplass med basseng.','Surfebrett på skiltet og planter ved døren.',
    'Et sted å spise på øyen.','Palmer og skygge.','Et dansegulv med fargede ruter.','En molo med plass til en båt.',
    'Et torg for kveldsmarkedet.','Et hotell med utsikt.','En kafé ved vannet.','En rolig plass å bade.',
    'Et høyt tårn å se øyen fra.','En grønn hage under palmene.','En liten bod med fruktskilt.','Et torg der øyen kan møtes.'],
};

function catalogBuilding(id,index,map) {
  if (!isRegion(map)) return null;
  if (index===RAIL_PLACE) return RAIL_LANDMARKS[id];
  if (index===RESIDENCE_PLACE) {
    const residence=RESIDENCE_LANDMARKS[id];
    if (residence&&map.residenceName) return [`${map.residenceName} ${id==='island'?'sitt':'sin'} ${residence[0].toLowerCase()}`,...residence.slice(1)];
    return residence;
  }
  return (grandCatalog(map)?GRAND_LANDMARKS[id]?.[index]:null)??(hasExpandedCatalog(map)?EXPANDED_LANDMARKS[id]?.[index]:null)??NEW_LANDMARKS[id]?.[index];
}

export function worldBuilding(id,index,map=null) {
  const custom=catalogBuilding(id,index,map);
  if (custom) {
    const [name,description,kind,family=kind]=custom;
    return {name,description,kind,family,story:landmarkStory(id,index,kind,map?.seed)};
  }
  const definition=PLACES[id]?.[index];
  if (!definition) return null;
  const [name,kind]=definition;
  return {name,description:DETAILS[id][index],kind,story:landmarkStory(id,index,kind,map?.seed)};
}

export function worldBuildingOptions(id,map,owner='') {
  const available=worldChoices(map,id,owner).filter(index=>{
    const {kind}=worldBuilding(id,index,map);
    return !isRegion(map)||map.progress>=2*WORLD_BUILD_STEPS||!['pier','marina','quay','bridge'].includes(kind);
  });
  // Make the station easy to discover at several points in a growing map.
  if (available.includes(RAIL_PLACE) && worldStatus(map).built%4===2) {
    available.splice(available.indexOf(RAIL_PLACE),1);
    available.unshift(RAIL_PLACE);
  }
  const airport=id==='city'?37:id==='moon'?44:25;
  if (worldStatus(map).built%7===3 && available.includes(airport)) {
    available.splice(available.indexOf(airport),1);
    available.unshift(airport);
  }
  const resort=id==='island'?27:id==='moon'?55:null;
  if (worldStatus(map).built%6===0&&available.includes(resort)) {
    available.splice(available.indexOf(resort),1);
    available.unshift(resort);
  }
  const driveThrough=id==='moon'?54:50;
  if (worldStatus(map).built%8===4&&available.includes(driveThrough)) {
    available.splice(available.indexOf(driveThrough),1);
    available.unshift(driveThrough);
  }
  const slide=id==='moon'?48:44;
  if (worldStatus(map).built%6===1 && available.includes(slide)) {
    available.splice(available.indexOf(slide),1);
    available.unshift(slide);
  }
  if (available.includes(RESIDENCE_PLACE)) {
    available.splice(available.indexOf(RESIDENCE_PLACE),1);
    available.splice(1,0,RESIDENCE_PLACE);
  }
  const types=new Set();
  const varied=[];
  for (const index of available) {
    const {kind,family=kind}=worldBuilding(id,index,map);
    if (types.has(family)) continue;
    types.add(family);
    varied.push(index);
    if (varied.length===3) return varied;
  }
  return [...varied,...available.filter(index=>!varied.includes(index))].slice(0,3);
}

function regionLandmarkParts(id,index,site,map) {
  const custom=catalogBuilding(id,index,map);
  let stages=custom?landmarkStages(id,custom[2],site,index):earthStarterStages(id,index);
  if (!stages) {
    const ground=id==='island'?.45:.04;
    const steps=landmark(id,index,PLACES[id][index],[0,0]).map(step=>at(step.parts,0,-ground,0));
    const [{w,d}]=steps[0];
    stages=[
      [{...box(0,0,w-.18,d-.18,1.24,THEMES[id].foundation,-1.22),support:true},...steps[0],...steps[1]],
      [...steps[2],...steps[3]], [...steps[4],...steps[5]],
    ];
  }
  if (site?.waterfront&&custom?.[2]!=='lighthouse') return stages;
  const kind=custom?.[2]??PLACES[id][index][1];
  stages=shapeLandmarkGround(detailFacades(stages,id,kind),kind);
  // Broad, thin surfaces stay in elevation order in the Canvas painter.
  return stages.map(parts=>parts.map(part=>{
    const top=part.y+part.h;
    return part.support||top<.65&&part.w>1.4&&part.d>1.4 ? {...part,layer:7+top} : part;
  }));
}

export function worldBuildingPreview(id,index,map=null) {
  const info=worldBuilding(id,index,map);
  if (!info) return null;
  const previewSite=grandCatalog(map)&&(info.kind==='airport'||info.kind==='megaResort')
    ?{airfield:info.kind==='airport',beach:info.kind==='megaResort'}:null;
  const staged=isRegion(map)?regionLandmarkParts(id,index,previewSite,map).flat():landmark(id,index,PLACES[id][index],[0,0]).flatMap(step=>step.parts);
  const vehicle=transitVehiclePreview(info.kind);
  const parts=vehicle?[...staged.filter(part=>!part.transitPreview),...vehicle]
    :staged.map(part=>['plane','shuttle'].includes(part.flight)?{...part,x:part.x-.9,y:part.y+1.3,z:part.z+3.25}:part);
  const height=Math.max(...parts.map(part=>part.y+part.h));
  const span=Math.max(...parts.map(part=>Math.hypot(2*Math.abs(part.x)+(part.w??0),2*Math.abs(part.z)+(part.d??0))));
  return {parts,background:THEMES[id].sky,yaw:-.52,pitch:.47,center:height*.44,size:Math.max(9.7,height*1.55,span*.95),latest:[]};
}

function landShape(x,z,w,d,y,color,layout) {
  const outline=Array.from({length:48},(_,i)=>{
    const a=-i*Math.PI/24, cos=Math.cos(a), sin=Math.sin(a);
    const swell=1+.047*Math.sin(a*3+layout.phase)+.027*Math.cos(a*5-layout.phase);
    const power=2/layout.shorePower;
    return [x+Math.sign(cos)*Math.abs(cos)**power*w*swell/2,y,
      z+Math.sign(sin)*Math.abs(sin)**power*d*swell/2];
  });
  return {shape:'landscape',outline,x,y,z,w,d,h:0,color};
}

function watercourse(layout,back,front,land) {
  const bend=z=>Math.sin(z*.085+layout.phase)*layout.waterBend;
  const length=front-back;
  const strips=Math.ceil(length/1.05);
  const river=[];
  for (let i=0;i<strips;i++) {
    const z1=back+length*i/strips,z2=back+length*(i+1)/strips;
    const z=(z1+z2)*.5,x=(bend(z1)+bend(z2))*.5;
    const fade=Math.min(1,Math.min(z-back,front-z)/5.8);
    const strength=fade*fade*(3-2*fade);
    const width=3.06+.25*Math.sin(z*.23+layout.phase);
    const shore=(half,y,color)=>({shape:'landscape',x,y,z,h:0,color,
      outline:[[bend(z1)-half,y,z1],[bend(z2)-half,y,z2],[bend(z2)+half,y,z2],[bend(z1)+half,y,z1]]});
    const water=mixColor('#509eab','#80c4c8',.41+.13*Math.sin(z*.38)+.08*Math.cos(z*.71));
    river.push(shore(width+.42,.024,mixColor(land,'#b2d3ae',strength)),shore(width,.031,mixColor(land,water,strength)));
    if (i%4===2 && strength>.45) {
      river.push(box(x+1.24*Math.sin(i*.87),z,.66+i%3*.24,.065,.008,mixColor(water,'#b0e0df',.49),.037));
    }
  }
  return river;
}

function districtRoads(theme,lots,p,y) {
  const segments=new Map();
  const connect=(a,b,c,d,bridge=false)=>segments.set([a,b,c,d].join(','),{a,b,c,d,bridge});
  for (const {left,right,back,front} of lots) {
    connect(left,back,left,front);
    connect(right,back,right,front);
    connect(left,back,right,back);
    connect(left,front,right,front);
  }
  if (theme==='city') {
    for (const west of lots.filter(lot=>lot.col===1)) {
      const east=lots.find(lot=>lot.col===2&&lot.row===west.row);
      if (east) for (const z of [west.back,west.front]) connect(west.right,z,east.left,z,true);
    }
  }
  const curbs=[],roads=[],paint=[];
  const width=theme==='island'?1.33:1.98;
  const border=theme==='moon'?'#b8b8d2':theme==='island'?'#e2c99e':'#bdc5b8';
  for (const {a,b,c,d,bridge} of segments.values()) {
    const vertical=a===c, length=Math.abs(vertical?d-b:c-a);
    const x=(a+c)*.5,z=(b+d)*.5;
    // Paint every curb first so the asphalt flows through corners and junctions.
    curbs.push(box(x,z,vertical?width+.52:length+width+.52,vertical?length+width+.52:width+.52,.036,border,y+.009));
    roads.push(box(x,z,vertical?width:length+width,vertical?length+width:width,.069,p.road,y+.033));
    if (theme!=='island') {
      const dashes=Math.floor(length/3.3);
      paint.push(...Array.from({length:dashes},(_,i)=>{
        const offset=(i+1)*length/(dashes+1);
        return box(vertical?a:a+offset,vertical?b+offset:b,vertical?.08:.92,vertical?.92:.08,.01,
          theme==='moon'?'#b6c6de':'#eadcba',y+.104);
      }));
    }
    if (bridge) paint.push(...[-1,1].flatMap(side=>[
      box(x,z+side*1.19,length,.16,.19,'#dccba9',y+.1),
      ...[-.4,0,.4].map(t=>box(x+t*length,z+side*1.19,.25,.24,.38,'#f4e7c2',y+.11)),
    ]));
  }
  return [...curbs,...roads,...paint];
}

function plotDetails(theme,lot,p,y) {
  const rng=randomGenerator(lot.seed);
  const x=lot.left+(lot.right-lot.left)*.16,z=lot.back+(lot.front-lot.back)*.13;
  const marks=Array.from({length:11},(_,i)=>{
    const dx=lot.left+1.8+rng()*(lot.right-lot.left-3.6),dz=lot.back+1.8+rng()*(lot.front-lot.back-3.6);
    const tint=mixColor(p.grass,i%3?p.white:p.dark,.075+rng()*.12);
    return landscape(dx,dz,.34+rng()*1.07,.21+rng()*.53,y+.008+i*.0005,tint,rng()*6.28);
  });
  const natural=theme==='moon' ? [
    landscape(x,z,2.3,1.82,y+.011,'#7d819f',lot.seed),
    landscape(x-.12,z+.1,1.66,1.23,y+.021,'#666d8b',lot.seed),
    dome(x+1.22,z-.43,1.1,.83,.32,'#a6a7bc',y+.035),
    dome(x+1.7,z-.7,.48,.42,.19,'#bcbaca',y+.03),
  ] : [
    dome(x,z,2.6+rng()*1.7,1.92+rng()*1.2,.43+rng()*.38,mixColor(p.grass,p.leaves,.41),y),
    dome(x+.83,z+.21,1.59,1.28,.36,mixColor(p.grass,p.white,.19),y+.03),
    ...Array.from({length:4},(_,i)=>dome(x+i*.39,z+1.05+rng()*.51,.22,.23,.14,
      ['#f7d4a2','#e8a9b7','#d8dab3','#c9a6d1'][i],y+.04)),
  ];
  return {marks,natural};
}

function generatedTerrain(theme,layout,lots) {
  const p=THEMES[theme];
  const margin=5.8+lots.length*.13;
  const riverbank=theme==='city'?8.2:0;
  const left=Math.min(-riverbank,...lots.map(lot=>lot.left-margin)),right=Math.max(riverbank,...lots.map(lot=>lot.right+margin));
  const back=Math.min(...lots.map(lot=>lot.back))-margin,front=Math.max(...lots.map(lot=>lot.front))+margin;
  const x=(left+right)*.5,z=(back+front)*.5,w=right-left,d=front-back,y=theme==='island'?.45:0;
  const land=mixColor(p.grass,layout.grassTint<.5?p.white:p.leaves,Math.abs(layout.grassTint-.5)*.39);
  const edge=theme==='island'?'#76c5cd':land;
  const shape=(expand,height,color)=>landShape(x,z,w+expand,d+expand,height,color,layout);
  const details=lots.map(lot=>plotDetails(theme,lot,p,y));
  const waves=theme==='island'
    ? shape(9,-.018,edge).outline.filter((_,i)=>i%4===0).map(([x,,z],i)=>
      landscape(x,z,.95+i%3*.26,.11,-.017,mixColor(edge,p.white,.47),layout.phase+i*.3))
    : [];
  const floor=[
    ...Array.from({length:17},(_,i)=>shape(24-i*1.25,-.54+i*.022,mixColor(p.sky,edge,(i/16)**1.5))),
    ...(theme==='island'?[shape(4.8,.033,'#9cdad6'),shape(2.6,.16,'#eac991'),shape(1.2,.28,'#f2d7a1')]:[]),
    shape(0,y,land),
    ...lots.map(lot=>landscape(lot.x-1.1,lot.z+1.3,8.2,6.2,y+.005,mixColor(land,p.white,.1),(lot.seed%900)/143)),
    ...details.flatMap(detail=>detail.marks),
    ...waves,
    ...(theme==='city'?watercourse(layout,back+1,front-1,land):[]),
    ...districtRoads(theme,lots,p,y),
  ].map((part,layer)=>({...part,layer}));
  return {parts:[...floor,...details.flatMap(detail=>detail.natural)],anchorX:x,anchorZ:z,size:Math.max(w,d)*1.21};
}

const PHASES=['Grunnarbeid','Form og fasade','Siste detaljer'];
function plannedWorldScene(id,map) {
  const status=worldStatus(map);
  const {partial}=legacyPlacement(map.legacy);
  const previous=map.legacy ? projectScene(id,map.legacy) : null;
  const layout=previous?null:worldLayout(id,map.seed);
  const carry=Number(Boolean(partial));
  const earned=Math.max(0,map.progress-carry);
  const opened=Math.max(1,Math.ceil(earned/WORLD_BUILD_STEPS));
  const lots=layout?.lots.slice(0,opened);
  const terrain=previous??generatedTerrain(id,layout,lots);
  const parts=terrain.parts.slice();
  const landmarks=Object.fromEntries(legacyPlacement(map.legacy).finished.map(index=>[index,legacyTarget(id,index)]));
  const sites=Object.fromEntries(Object.entries(landmarks).map(([index,site])=>[index,{...site,built:true}]));
  let latest=previous?.latest??[],last=previous?.last,finished=previous?.finished??null;
  if (partial && map.progress) {
    const steps=landmark(id,partial.id,PLACES[id][partial.id]);
    latest=steps.slice(partial.stages).flatMap(step=>step.parts).map(part=>({...part,landmark:partial.id}));
    parts.push(...latest);
    last=steps.at(-1).label;
    finished=steps.at(-1).finished;
    landmarks[partial.id]=legacyTarget(id,partial.id);
    sites[partial.id]={...landmarks[partial.id],built:true};
  }
  map.order.forEach((place,i)=>{
    const amount=Math.max(0,Math.min(WORLD_BUILD_STEPS,earned-i*WORLD_BUILD_STEPS));
    if (!amount) return;
    const lot=lots?.[i];
    const definition=PLACES[id][place];
    const steps=landmark(id,place,definition,lot?[lot.x,lot.z]:undefined);
    for (let j=0;j<amount;j++) {
      latest=steps.slice(j*2,j*2+2).flatMap(step=>step.parts).map(part=>({...part,landmark:place}));
      parts.push(...latest);
    }
    last=`${definition[0]} · ${PHASES[amount-1].toLowerCase()}`;
    finished=amount===WORLD_BUILD_STEPS?definition[0]:null;
    sites[place]={...(lot?{x:lot.x,z:lot.z,y:0}:legacyTarget(id,place)),built:Boolean(finished)};
    if (finished) landmarks[place]=sites[place];
  });
  return {
    parts,latest,last,finished,landmarks,sites,id,world:true,background:THEMES[id].sky,yaw:-.62,pitch:.57,center:1,closeSize:79,
    size:terrain.size,anchorX:terrain.anchorX,anchorZ:terrain.anchorZ,
    ambient:previous?.ambient??(earned>=2?districtActors(id,lots):[]),
    next:status.building!==null?`${PLACES[id][status.building][0]} · ${partial&&!map.progress?'ferdigstilling':PHASES[status.phase].toLowerCase()}`:null,
  };
}

function legacyTarget(id,index) {
  const [x,z]=plot(index,id);
  return {x,z,y:id==='island'?.45:0};
}

const catalog = new Map();
const regionScenes = new Map();
export function projectScene(id, completed=0, season=seasonForDate()) {
  const project=projectById(id);
  if(!project) return null;
  if (isWorld(id)&&isRegion(completed)) {
    const key=JSON.stringify([id,completed.layout,completed.catalog,completed.starter,completed.seed,completed.progress,
      completed.order,season,completed.residenceName]);
    if (regionScenes.has(key)) return regionScenes.get(key);
    const scene=expandedWorldScene(id,completed,THEMES[id],index=>worldBuilding(id,index,completed),(index,site)=>regionLandmarkParts(id,index,site,completed),season);
    regionScenes.set(key,scene);
    if (regionScenes.size>5) regionScenes.delete(regionScenes.keys().next().value);
    return scene;
  }
  if(isWorld(id)&&completed&&typeof completed==='object') return plannedWorldScene(id,completed);
  if(!catalog.has(id)) catalog.set(id, Object.hasOwn(HERO_PALETTES,id) ? heroScene(id) : worldScene(id));
  const {base,ambient,steps,background,yaw,pitch,world}=catalog.get(id);
  const built=Math.max(0,Math.min(steps.length,completed));
  const parts=base.concat(steps.slice(0,built).flatMap(step=>step.parts));
  const height=Math.max(...parts.map(part=>part.y+part.h));
  return {
    parts, ambient, background, yaw, pitch, world, id,
    latest:steps[built-1]?.parts ?? [],
    center:world ? 1 : Math.max(0,height*.43),
    size:world ? 99 : Math.max(14,height*1.38),
    closeSize:world ? 79 : undefined,
    finished:!world&&built===steps.length?project.name:steps[built-1]?.finished || null,
    last:steps[built-1]?.label, next:steps[built]?.label,
  };
}
