import { PLANTS, plantById } from './plants.js';

// Local, code-drawn toy bricks. A piece is earned only by finishing a round.
const PALETTE = { blue:'#398bd4', red:'#df5149', yellow:'#efc546', green:'#60a86d', orange:'#ec9a43', purple:'#9877bd', white:'#e8eee9', black:'#52626a', pink:'#e483a5', tan:'#c99a6e', teal:'#42aba4' };
const CATALOG_VERSION = 3;
const FIRST_NEW_MODEL = 6;
const DEPTH = 44;
const project = (x,y,z=0) => [Number((.866*(x+z)).toFixed(2)),Number((y+.5*x-.5*z).toFixed(2))];
const points = coords => coords.map(p=>project(...p).join(',')).join(' ');
export const BUILD_MODELS = [
  { id:'robot', name:'en robot', done:'Roboten er ferdig!', pieces:[
    {x:36,y:164,w:128,h:28,color:'blue'},
    {x:52,y:122,w:96,h:42,color:'yellow',print:'buttons'},
    {x:20,y:122,w:32,h:42,color:'green'},
    {x:148,y:122,w:32,h:42,color:'green'},
    {x:68,y:82,w:64,h:40,color:'red',print:'face'},
  ]},
  { id:'rocket', name:'en rakett', done:'Raketten er ferdig!', pieces:[
    {x:44,y:164,w:112,h:28,color:'blue'},
    {x:68,y:136,w:64,h:28,color:'orange'},
    {x:68,y:96,w:64,h:40,color:'blue',print:'window'},
    {x:68,y:66,w:64,h:30,color:'yellow'},
    {x:68,y:24,w:64,h:42,color:'red',shape:'roof'},
  ]},
  { id:'house', name:'et hus', done:'Huset er ferdig!', pieces:[
    {x:36,y:164,w:128,h:26,color:'blue'},
    {x:44,y:124,w:48,h:40,color:'yellow',print:'door'},
    {x:92,y:124,w:64,h:40,color:'yellow',print:'window'},
    {x:44,y:94,w:112,h:30,color:'green'},
    {x:28,y:44,w:144,h:50,color:'red',shape:'roof'},
  ]},
  { id:'train', name:'et tog', done:'Toget er ferdig!', pieces:[
    {x:20,y:164,w:160,h:24,color:'blue',print:'wheels'},
    {x:24,y:124,w:80,h:40,color:'red'},
    {x:104,y:104,w:64,h:60,color:'yellow',print:'window'},
    {x:44,y:90,w:32,h:34,color:'orange'},
    {x:96,y:80,w:80,h:24,color:'green'},
  ]},
  { id:'duck', name:'en and', done:'Anden er ferdig!', pieces:[
    {x:36,y:164,w:128,h:28,color:'orange',print:'feet'},
    {x:52,y:130,w:96,h:34,color:'yellow'},
    {x:20,y:112,w:48,h:18,color:'yellow'},
    {x:116,y:98,w:32,h:32,color:'yellow'},
    {x:100,y:66,w:64,h:32,color:'yellow',print:'duck'},
  ]},
  { id:'superhero', name:'en superhelt', done:'Superhelten er ferdig!', pieces:[
    {x:52,y:164,w:96,h:28,color:'red',print:'boots'},
    {x:36,y:96,w:128,h:68,color:'red',shape:'cape'},
    {x:68,y:118,w:64,h:46,color:'blue',print:'hero-emblem'},
    {x:44,y:96,w:112,h:22,color:'blue',print:'hero-arms'},
    {x:68,y:56,w:64,h:40,color:'yellow',print:'hero-mask'},
  ]},
  { id:'racecar', name:'en racerbil', done:'Racerbilen er ferdig!', pieces:[
    {x:15,y:169,w:170,h:25,color:'black',print:'wheels'},
    {x:22,y:146,w:153,h:23,color:'red',print:'race'},
    {x:91,y:124,w:55,h:22,color:'teal',print:'windshield'},
    {x:27,y:126,w:33,h:20,color:'red'},
    {x:14,y:114,w:53,h:12,color:'yellow'},
  ]},
  { id:'cat', name:'en katt', done:'Katten er ferdig!', pieces:[
    {x:43,y:163,w:110,h:28,color:'tan',print:'paws'},
    {x:56,y:121,w:82,h:42,color:'orange'},
    {x:19,y:107,w:37,h:21,color:'tan'},
    {x:49,y:76,w:96,h:45,color:'orange',print:'cat'},
    {x:52,y:55,w:91,h:21,color:'tan',print:'ears'},
  ]},
  { id:'dinosaur', name:'en dinosaur', done:'Dinosauren er ferdig!', pieces:[
    {x:39,y:165,w:114,h:25,color:'green',print:'paws'},
    {x:39,y:127,w:98,h:38,color:'green',print:'scales'},
    {x:6,y:121,w:41,h:20,color:'teal'},
    {x:103,y:88,w:43,h:43,color:'green'},
    {x:101,y:52,w:76,h:36,color:'teal',print:'dino'},
  ]},
  { id:'plane', name:'et fly', done:'Flyet er ferdig!', pieces:[
    {x:23,y:151,w:150,h:24,color:'white',print:'plane'},
    {x:103,y:129,w:65,h:22,color:'blue',print:'windshield'},
    {x:19,y:110,w:36,h:41,color:'blue',shape:'roof'},
    {x:59,y:153,w:68,h:11,color:'red',print:'wing'},
    {x:153,y:145,w:27,h:25,color:'yellow',print:'propeller'},
  ]},
  { id:'penguin', name:'en pingvin', done:'Pingvinen er ferdig!', pieces:[
    {x:50,y:169,w:97,h:23,color:'orange',print:'paws'},
    {x:53,y:119,w:90,h:50,color:'black',print:'belly'},
    {x:27,y:113,w:28,h:44,color:'black'},
    {x:141,y:113,w:28,h:44,color:'black'},
    {x:57,y:75,w:82,h:44,color:'black',print:'penguin'},
  ]},
  { id:'boat', name:'en seilbåt', done:'Seilbåten er ferdig!', pieces:[
    {x:22,y:151,w:156,h:37,color:'blue',print:'boat',shape:'hull'},
    {x:37,y:140,w:125,h:11,color:'white'},
    {x:88,y:64,w:18,h:76,color:'tan'},
    {x:42,y:69,w:57,h:71,color:'teal',shape:'roof'},
    {x:102,y:58,w:47,h:82,color:'red',shape:'roof'},
  ]},
  { id:'owl', name:'en ugle', done:'Ugla er ferdig!', pieces:[
    {x:49,y:168,w:99,h:22,color:'tan',print:'paws'},
    {x:55,y:117,w:85,h:51,color:'orange',print:'feathers'},
    {x:27,y:124,w:29,h:37,color:'purple'},
    {x:139,y:124,w:29,h:37,color:'purple'},
    {x:49,y:71,w:96,h:46,color:'tan',print:'owl'},
  ]},
  { id:'castle', name:'en borg', done:'Borgen er ferdig!', pieces:[
    {x:24,y:162,w:152,h:27,color:'green'},
    {x:59,y:114,w:84,h:48,color:'white',print:'gate'},
    {x:25,y:81,w:38,h:81,color:'white',print:'tower'},
    {x:140,y:81,w:38,h:81,color:'white',print:'tower'},
    {x:87,y:73,w:37,h:41,color:'red',shape:'roof'},
  ]},
  { id:'dog', name:'en hund', done:'Hunden er ferdig!', pieces:[
    {x:45,y:167,w:106,h:25,color:'tan',print:'paws'},
    {x:50,y:128,w:98,h:39,color:'tan',print:'collar'},
    {x:18,y:100,w:35,h:46,color:'orange'},
    {x:145,y:100,w:35,h:46,color:'orange'},
    {x:53,y:82,w:90,h:46,color:'tan',print:'dog'},
  ]},
  { id:'helicopter', name:'et helikopter', done:'Helikopteret er ferdig!', pieces:[
    {x:52,y:169,w:116,h:20,color:'black',print:'skids'},
    {x:54,y:127,w:107,h:42,color:'orange',print:'windshield'},
    {x:16,y:125,w:50,h:15,color:'orange'},
    {x:10,y:93,w:23,h:32,color:'red'},
    {x:49,y:103,w:117,h:13,color:'black',print:'rotor'},
  ]},
  { id:'snowman', name:'en snømann', done:'Snømannen er ferdig!', pieces:[
    {x:47,y:164,w:110,h:25,color:'blue'},
    {x:52,y:119,w:101,h:45,color:'white',print:'buttons'},
    {x:50,y:106,w:104,h:13,color:'red',print:'scarf'},
    {x:64,y:71,w:76,h:35,color:'white',print:'snowman'},
    {x:59,y:48,w:86,h:23,color:'black',print:'hat'},
  ]},
  { id:'astronaut', name:'en astronaut', done:'Astronauten er ferdig!', pieces:[
    {x:48,y:165,w:104,h:26,color:'white',print:'boots'},
    {x:54,y:118,w:92,h:47,color:'white',print:'mission'},
    {x:26,y:119,w:29,h:39,color:'blue'},
    {x:145,y:119,w:29,h:39,color:'blue'},
    {x:61,y:70,w:78,h:48,color:'white',print:'visor'},
  ]},
];
const ids = BUILD_MODELS.map(m=>m.id);
export const modelById = id => BUILD_MODELS.find(m=>m.id===id);
const count = n => Number.isSafeInteger(n)&&n>=0;

function shuffle(items,rng) {
  const a=[...items];
  for(let i=a.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(rng()*(i+1))));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
export function restoreBuild(raw) {
  const model=modelById(raw?.model);
  if(!model||!count(raw.pieces)||raw.pieces>model.pieces.length)return null;
  const collection=Array.isArray(raw.collection)?raw.collection.filter(id=>ids.includes(id)).slice(-20):[];
  const bag=Array.isArray(raw.bag)?[...new Set(raw.bag.filter(id=>ids.includes(id)&&id!==raw.model))]:[];
  // Add the new model to an old shuffled set without changing the current build.
  if((raw.catalogVersion || 0)<2&&raw.model!=='superhero'&&!bag.includes('superhero'))bag.push('superhero');
  if ((raw.catalogVersion || 0) < 3) {
    const additions = ids.slice(FIRST_NEW_MODEL).filter(id => id !== raw.model && !bag.includes(id));
    // Alternate with the old queue so existing players soon get a new model.
    additions.forEach((id, index) => bag.splice(index * 2, 0, id));
  }
  const previousUnlocks = Array.isArray(raw.unlocked) ? raw.unlocked.filter(id => ids.includes(id)) : [];
  const unlocked = [...new Set([...previousUnlocks, ...collection])];
  return {model:raw.model,pieces:raw.pieces,bag,collection,unlocked,completed:count(raw.completed)&&raw.completed>=collection.length?raw.completed:collection.length,catalogVersion:CATALOG_VERSION};
}
function nextBuild(previous,rng) {
  let bag=previous?.bag?.length?[...previous.bag]:shuffle(ids,rng);
  // Across shuffled sets, avoid an immediate repeat of the finished model.
  if(bag[0]===previous?.model&&bag.length>1)[bag[0],bag[1]]=[bag[1],bag[0]];
  const model=bag.shift();
  return {model,pieces:0,bag,collection:[...(previous?.collection||[])],unlocked:[...(previous?.unlocked||[])],completed:previous?.completed||0,catalogVersion:CATALOG_VERSION};
}
export function ensureBuild(build,rng=Math.random) { return restoreBuild(build)||nextBuild(null,rng); }
function restoreGarden(raw, rounds) {
  const stage = rounds === 0 ? 0 : (rounds - 1) % 5 + 1;
  if (!plantById(raw?.plant) || !count(raw.stage) || raw.stage > 5) {
    return { plant:'sunflower', stage, bag:[], collection:rounds >= 5 ? ['sunflower'] : [] };
  }
  const validPlants = items => Array.isArray(items) ? [...new Set(items.filter(id => plantById(id)))] : [];
  return {
    plant:raw.plant,
    stage:raw.stage,
    bag:validPlants(raw.bag).filter(id => id !== raw.plant),
    collection:validPlants(raw.collection),
  };
}

function nextPlant(garden, rng) {
  const firstCycle = garden.collection.length === 1 && garden.plant === 'sunflower';
  const options = PLANTS.map(plant => plant.id).filter(id => !firstCycle || id !== 'sunflower');
  const bag = garden.bag.length ? garden.bag.slice() : shuffle(options, rng);
  if (bag[0] === garden.plant) [bag[0], bag[1]] = [bag[1], bag[0]];
  return { ...garden, plant:bag.shift(), stage:0, bag };
}

export function restoreRewards(raw,total=0) {
  const plantRounds = count(raw?.plantRounds) && raw.plantRounds <= total ? raw.plantRounds : total;
  return {
    rewardMode:raw?.rewardMode==='bricks'?'bricks':'plant',
    plantRounds,
    garden:restoreGarden(raw?.garden, plantRounds),
    brickBuild:restoreBuild(raw?.brickBuild),
    lastRewardRoundId:typeof raw?.lastRewardRoundId==='string'?raw.lastRewardRoundId:null,
  };
}
export function selectRewardMode(state,mode,rng=Math.random) {
  if(!['plant','bricks'].includes(mode))return state;
  return {...state,rewardMode:mode,brickBuild:mode==='bricks'?ensureBuild(state.brickBuild,rng):state.brickBuild};
}
export function prepareReward(state,rng=Math.random) {
  if (state.rewardMode !== 'bricks') {
    const garden = restoreGarden(state.garden, state.plantRounds);
    return garden.stage === 5 ? { ...state, garden:nextPlant(garden, rng) } : state;
  }
  let build=ensureBuild(state.brickBuild,rng);
  if(build.pieces===modelById(build.model).pieces.length)build=nextBuild(build,rng);
  return {...state,brickBuild:build};
}
export function awardPractice(state,roundId,rng=Math.random) {
  if(!roundId||state.lastRewardRoundId===roundId)return {state,reward:null};
  if(state.rewardMode!=='bricks') {
    const plantRounds=(state.plantRounds||0)+1;
    let garden = restoreGarden(state.garden, state.plantRounds || 0);
    if (garden.stage === 5) garden = nextPlant(garden, rng);
    garden = { ...garden, stage:garden.stage + 1 };
    if (garden.stage === 5 && !garden.collection.includes(garden.plant)) {
      garden.collection = [...garden.collection, garden.plant];
    }
    return { state:{ ...state, plantRounds, garden, lastRewardRoundId:roundId }, reward:{ mode:'plant', garden } };
  }
  let build=ensureBuild(state.brickBuild,rng);
  const model=modelById(build.model);
  if(build.pieces===model.pieces.length)build=nextBuild(build,rng);
  build={...build,pieces:build.pieces+1};
  const complete=build.pieces===modelById(build.model).pieces.length;
  if(complete)build={...build,collection:[...build.collection,build.model].slice(-20),unlocked:[...new Set([...build.unlocked,build.model])],completed:build.completed+1};
  return {state:{...state,brickBuild:build,lastRewardRoundId:roundId},reward:{mode:'bricks',build,complete}};
}

function tint(hex,amount) {
  return '#'+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,parseInt(v,16)+amount)).toString(16).padStart(2,'0')).join('');
}
function printOn(p) {
  const {x,y,w,h}=p,cx=x+w/2,cy=y+h/2;
  if (['cat', 'dog', 'owl', 'penguin', 'snowman'].includes(p.print)) {
    const eyes = p.print === 'owl' ? '#fff2cb' : p.print === 'penguin' ? '#f8f3da' : '';
    const cheeks = p.print === 'cat' ? '<path d="M-18 4h-12m12 5-12 4m48-9h12M18 9l12 4" stroke="#784931" stroke-width="2.5" stroke-linecap="round"/>' : '';
    const nose = p.print === 'penguin' || p.print === 'owl'
      ? '<path d="M-8 4H8L0 14Z" fill="#efad4c"/>'
      : p.print === 'snowman' ? '<path d="M-2 2 16 10-2 10Z" fill="#ed9d45"/>'
      : '<path d="M-7 3Q0 0 7 3L0 10Z" fill="#74473c"/><path d="M0 10q-7 7-12 1m12-1q7 7 12 1" fill="none" stroke="#74473c" stroke-width="2.5"/>';
    return `<g transform="translate(${cx} ${cy})">${eyes ? `<circle cx="-14" cy="-4" r="10" fill="${eyes}"/><circle cx="14" cy="-4" r="10" fill="${eyes}"/>` : ''}<circle cx="-14" cy="-4" r="4" fill="#283d44"/><circle cx="14" cy="-4" r="4" fill="#283d44"/>${cheeks}${nose}</g>`;
  }
  if (p.print === 'ears') return `<path d="M${x+8} ${y+h-4}l8-13 9 13Zm${w-32} 0 8-13 9 13Z" fill="#e78ca2"/>`;
  if (p.print === 'paws') return `<path d="M${cx-16} ${y+h-5}v-7m32 7v-7" stroke="#916850" stroke-width="3" stroke-linecap="round"/>`;
  if (p.print === 'dino') return `<circle cx="${cx+14}" cy="${y+11}" r="4" fill="#294c42"/><path d="M${cx-12} ${cy+7}q18 8 33-2" fill="none" stroke="#345a4b" stroke-width="3" stroke-linecap="round"/><path d="m${cx+7} ${cy+12} 5 7 5-7" fill="#fff7df"/>`;
  if (p.print === 'scales') return `<path d="m${x+10} ${y+5} 10 12 10-12 10 12 10-12 10 12 10-12" fill="none" stroke="#c3d992" stroke-width="4" stroke-linejoin="round"/>`;
  if (p.print === 'belly') return `<ellipse cx="${cx}" cy="${cy+3}" rx="28" ry="19" fill="#fbf5e1"/>`;
  if (p.print === 'feathers') return `<path d="M${cx-19} ${cy-7}q7 10 14 0m10 0q7 10 14 0m-26 13q7 10 14 0" fill="none" stroke="#f8d191" stroke-width="3" stroke-linecap="round"/>`;
  if (p.print === 'collar' || p.print === 'scarf') return `<path d="M${x+3} ${y+7}H${x+w-3}" stroke="${p.print === 'collar' ? '#d96558' : '#f6a88e'}" stroke-width="5"/><circle cx="${cx}" cy="${y+12}" r="4" fill="#efd16b"/>`;
  if (p.print === 'race') return `<path d="M${x+8} ${cy+5}h28m${w-70} 0h25" stroke="#fff4d5" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="9" fill="#fff4d5"/><path d="M${cx-3} ${cy-4}h7l-4 9" fill="none" stroke="#c74d43" stroke-width="2"/>`;
  if (p.print === 'windshield' || p.print === 'visor') {
    const visor = p.print === 'visor';
    return `<rect x="${x+7}" y="${y+5}" width="${w-14}" height="${h-10}" rx="${visor ? 13 : 6}" fill="${visor ? '#3d6382' : '#bde9f0'}" stroke="#527b92" stroke-width="2"/><path d="M${x+16} ${y+12}h${Math.min(w-29,22)}" stroke="#effaff" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (p.print === 'plane' || p.print === 'boat') {
    const count = p.print === 'plane' ? 5 : 3;
    return Array.from({length:count}, (_, index) => `<circle cx="${x+30+index*18}" cy="${cy-2}" r="5" fill="#ccebf0" stroke="#4f7e99" stroke-width="2"/>`).join('');
  }
  if (p.print === 'wing' || p.print === 'rotor' || p.print === 'hat') return `<path d="M${x+7} ${cy}H${x+w-7}" stroke="#eac052" stroke-width="3" stroke-linecap="round"/>`;
  if (p.print === 'propeller') return `<path d="M${cx-8} ${cy+8}l16-16" stroke="#4c626e" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="#fff1ae"/>`;
  if (p.print === 'skids') return `<path d="M${x+9} ${cy+4}h${w-18}" stroke="#c6d7da" stroke-width="3" stroke-linecap="round"/>`;
  if (p.print === 'gate') return `<path d="M${cx-14} ${y+h}v-17a14 14 0 0 1 28 0v17Z" fill="#9e7863"/>`;
  if (p.print === 'tower') return `<rect x="${cx-5}" y="${y+20}" width="10" height="20" rx="5" fill="#7e94a0"/><path d="M${x+4} ${y+53}h${w-8}m-${w-14} 11h${w-14}" stroke="#b2bdba" stroke-width="2"/>`;
  if (p.print === 'mission') return `<circle cx="${cx}" cy="${cy}" r="14" fill="#5b86b7"/><path d="M${cx-9} ${cy+5}q16-18 22-13 5 4-16 18" fill="none" stroke="#f1d676" stroke-width="2"/>`;
  if(p.print==='face')return `<g fill="#283d44"><circle cx="${cx-13}" cy="${cy-3}" r="3.5"/><circle cx="${cx+13}" cy="${cy-3}" r="3.5"/><path d="M${cx-8} ${cy+7}q8 8 16 0" fill="none" stroke="#283d44" stroke-width="2.7" stroke-linecap="round"/></g>`;
  if(p.print==='buttons')return `<g fill="#4c6b6d"><circle cx="${cx-11}" cy="${cy}" r="4"/><circle cx="${cx+11}" cy="${cy}" r="4"/></g>`;
  if(p.print==='window')return `<rect x="${cx-12}" y="${cy-12}" width="24" height="24" rx="7" fill="#d8f1f5" stroke="#50717d" stroke-width="3"/><path d="M${cx-6} ${cy-5}l5-4" stroke="white" stroke-width="3" stroke-linecap="round"/>`;
  if(p.print==='door')return `<rect x="${cx-11}" y="${y+9}" width="22" height="${h-10}" rx="5" fill="#a87556"/><circle cx="${cx+5}" cy="${cy+5}" r="2" fill="#fff0bf"/>`;
  if(p.print==='wheels')return [x+30,x+w-30].map(wx=>`<circle cx="${wx}" cy="${y+h-1}" r="10" fill="#405966"/><circle cx="${wx}" cy="${y+h-1}" r="4" fill="#c1d4db"/>`).join('');
  if(p.print==='feet')return `<path d="M${x+22} ${y+h-3}h25m37 0h25" stroke="#c67c38" stroke-width="5" stroke-linecap="round"/>`;
  if(p.print==='duck')return `<circle cx="${x+25}" cy="${y+12}" r="3.6" fill="#283d44"/><path d="M${x+w-22} ${y+15}h20v12h-20z" fill="#df8a3d"/><path d="M${x+w-19} ${y+22}h16" stroke="#a45c31" stroke-width="1.5"/>`;
  if(p.print==='boots')return `<path d="M${cx} ${y+4}v${h-5}" stroke="#a72c35" stroke-width="3"/><path d="M${x+8} ${y+h-6}h${w/2-16}m16 0h${w/2-16}" stroke="#f88c70" stroke-width="3" stroke-linecap="round"/>`;
  if(p.print==='hero-emblem')return `<path d="M${cx} ${y+6}l20 11-6 18h-28l-6-18Z" fill="#f8cf43" stroke="#21609e" stroke-width="2"/><path d="m${cx+3} ${y+10}-12 15h9l-3 12 15-19h-10Z" fill="white"/>`;
  if(p.print==='hero-arms')return `<rect x="${x+5}" y="${y+5}" width="17" height="12" rx="4" fill="#efc546"/><rect x="${x+w-22}" y="${y+5}" width="17" height="12" rx="4" fill="#efc546"/>`;
  if(p.print==='hero-mask')return `<g class="hero-mask"><path d="M${x+5} ${y+7}h${w-10}v17l-13-3-14 3-13-3-14 3Z" fill="#284f80"/><ellipse cx="${cx-13}" cy="${y+15}" rx="6" ry="4" fill="white"/><ellipse cx="${cx+13}" cy="${y+15}" rx="6" ry="4" fill="white"/><circle cx="${cx-12}" cy="${y+15}" r="2.4" fill="#20374b"/><circle cx="${cx+12}" cy="${y+15}" r="2.4" fill="#20374b"/><path d="M${cx-7} ${y+29}q7 6 14 0" fill="none" stroke="#7d5a37" stroke-width="2.6" stroke-linecap="round"/></g>`;
  return '';
}
function brick(p,ghost=false,newPiece=false) {
  const {x,y,w,h}=p,front=ghost?'#d6dfcf':PALETTE[p.color],top=tint(front,20),side=tint(front,-24);
  const edge=tint(front,-38),faceTransform='matrix(.866 .5 0 1 0 0)';
  let surface,face,studs='';
  if(p.shape==='roof'){
    surface=`<polygon class="brick-side" points="${points([[x+w/2,y],[x+w/2,y,DEPTH],[x+w,y+h,DEPTH],[x+w,y+h]])}" fill="${top}" stroke="${edge}" stroke-width=".7"/>`;
    face=`<path d="M${x} ${y+h} ${x+w/2} ${y} ${x+w} ${y+h}Z"/>`;
  }else{
    const inset = p.shape === 'cape' ? 22 : 0;
    const left = x + inset, right = x + w - inset;
    const baseInset = p.shape === 'hull' ? 16 : 0;
    surface=`<polygon class="brick-top" points="${points([[left,y],[right,y],[right,y,DEPTH],[left,y,DEPTH]])}" fill="${top}" stroke="${edge}" stroke-width=".7"/><polygon class="brick-side" points="${points([[right,y],[right,y,DEPTH],[x+w-baseInset,y+h,DEPTH],[x+w-baseInset,y+h]])}" fill="${side}" stroke="${edge}" stroke-width=".7"/>`;
    face=(inset||baseInset)?`<path d="M${left} ${y}H${right}L${x+w-baseInset} ${y+h}H${x+baseInset}Z"/>`:`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>`;
    const columns=Math.max(1,Math.round((right-left)/32));
    studs=Array.from({length:2},(_,row)=>Array.from({length:columns},(_,col)=>{
      const [sx,sy]=project(left+(col+.5)*(right-left)/columns,y,(row+.5)*DEPTH/2);
      return `<g class="brick-stud"><path d="M${sx-8.5} ${sy-8}v8a8.5 4.8 0 0 0 17 0v-8Z" fill="${front}" stroke="${edge}" stroke-width=".6"/><ellipse cx="${sx}" cy="${sy-8}" rx="8.5" ry="4.8" fill="${top}" stroke="${side}" stroke-width=".8"/><path d="M${sx-5} ${sy-9}q4-2 8 0" fill="none" stroke="white" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round"/></g>`;
    }).join('')).join('');
  }
  return `<g class="brick-piece ${ghost?'unbuilt-piece':''} ${newPiece?'new-brick':''}">${surface}<g class="brick-front" transform="${faceTransform}" fill="${front}" stroke="${edge}" stroke-width=".7">${face}</g><g transform="${faceTransform}">${ghost?'':printOn(p)}</g>${studs}</g>`;
}
export function renderBuildSvg(build,{animate=false,mini=false}={}) {
  const model=modelById(build?.model);if(!model)return '';
  const pieces=Math.max(0,Math.min(model.pieces.length,build.pieces));
  const left=Math.min(...model.pieces.map(p=>p.x)),right=Math.max(...model.pieces.map(p=>p.x+p.w)),floor=Math.max(...model.pieces.map(p=>p.y+p.h))+7;
  const bounds=model.pieces.flatMap(p=>[0,DEPTH].flatMap(z=>[[p.x,p.y-14,z],[p.x+p.w,p.y-14,z],[p.x,p.y+p.h,z],[p.x+p.w,p.y+p.h,z]].map(c=>project(...c))));
  bounds.push(project(left-7,floor),project(right+7,floor),project(left-7,floor,DEPTH),project(right+7,floor,DEPTH));
  const minX=Math.min(...bounds.map(p=>p[0]))-12,minY=Math.min(...bounds.map(p=>p[1]))-8,maxX=Math.max(...bounds.map(p=>p[0]))+12,maxY=Math.max(...bounds.map(p=>p[1]))+8;
  const ordered=model.pieces.map((p,i)=>({p,i})).sort((a,b)=>(b.p.y+b.p.h)-(a.p.y+a.p.h)||a.p.x-b.p.x);
  return `<svg class="brick-figure ${mini?'mini-build':''}" viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}" ${mini?'aria-hidden="true"':`role="img" aria-label="${model.name}, ${pieces} av ${model.pieces.length} klosser på plass"`}><g transform="matrix(.866 .5 .866 -.5 0 ${floor})"><ellipse cx="${(left+right)/2}" cy="${DEPTH/2}" rx="${(right-left)/2+5}" ry="${DEPTH/2+3}" fill="#dce5db"/></g>${ordered.filter(x=>x.i>=pieces).map(({p})=>brick(p,true)).join('')}${ordered.filter(x=>x.i<pieces).map(({p,i})=>brick(p,false,animate&&i===pieces-1)).join('')}</svg>`;
}
