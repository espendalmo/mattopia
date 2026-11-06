// Local, code-drawn toy bricks. A piece is earned only by finishing a round.
const PALETTE = { blue:'#4e91cc', red:'#dc6559', yellow:'#ebbf49', green:'#76a866', orange:'#e79851', purple:'#9877bd' };
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
  { id:'duck', name:'en and', done:'Anda er ferdig!', pieces:[
    {x:36,y:164,w:128,h:28,color:'orange',print:'feet'},
    {x:52,y:130,w:96,h:34,color:'yellow'},
    {x:20,y:112,w:48,h:18,color:'yellow'},
    {x:116,y:98,w:32,h:32,color:'yellow'},
    {x:100,y:66,w:64,h:32,color:'yellow',print:'duck'},
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
  return {model:raw.model,pieces:raw.pieces,bag,collection,completed:count(raw.completed)&&raw.completed>=collection.length?raw.completed:collection.length};
}
function nextBuild(previous,rng) {
  let bag=previous?.bag?.length?[...previous.bag]:shuffle(ids,rng);
  // Across shuffled sets, avoid an immediate repeat of the finished model.
  if(bag[0]===previous?.model&&bag.length>1)[bag[0],bag[1]]=[bag[1],bag[0]];
  const model=bag.shift();
  return {model,pieces:0,bag,collection:[...(previous?.collection||[])],completed:previous?.completed||0};
}
export function ensureBuild(build,rng=Math.random) { return restoreBuild(build)||nextBuild(null,rng); }
export function restoreRewards(raw,total=0) {
  return {
    rewardMode:raw?.rewardMode==='bricks'?'bricks':'plant',
    plantRounds:count(raw?.plantRounds)&&raw.plantRounds<=total?raw.plantRounds:total,
    brickBuild:restoreBuild(raw?.brickBuild),
    lastRewardRoundId:typeof raw?.lastRewardRoundId==='string'?raw.lastRewardRoundId:null,
  };
}
export function selectRewardMode(state,mode,rng=Math.random) {
  if(!['plant','bricks'].includes(mode))return state;
  return {...state,rewardMode:mode,brickBuild:mode==='bricks'?ensureBuild(state.brickBuild,rng):state.brickBuild};
}
export function prepareReward(state,rng=Math.random) {
  if(state.rewardMode!=='bricks')return state;
  let build=ensureBuild(state.brickBuild,rng);
  if(build.pieces===modelById(build.model).pieces.length)build=nextBuild(build,rng);
  return {...state,brickBuild:build};
}
export function awardPractice(state,roundId,rng=Math.random) {
  if(!roundId||state.lastRewardRoundId===roundId)return {state,reward:null};
  if(state.rewardMode!=='bricks') {
    const plantRounds=(state.plantRounds||0)+1;
    return {state:{...state,plantRounds,lastRewardRoundId:roundId},reward:{mode:'plant',plantRounds}};
  }
  let build=ensureBuild(state.brickBuild,rng);
  const model=modelById(build.model);
  if(build.pieces===model.pieces.length)build=nextBuild(build,rng);
  build={...build,pieces:build.pieces+1};
  const complete=build.pieces===modelById(build.model).pieces.length;
  if(complete)build={...build,collection:[...build.collection,build.model].slice(-20),completed:build.completed+1};
  return {state:{...state,brickBuild:build,lastRewardRoundId:roundId},reward:{mode:'bricks',build,complete}};
}

function tint(hex,amount) {
  return '#'+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,parseInt(v,16)+amount)).toString(16).padStart(2,'0')).join('');
}
function printOn(p) {
  const {x,y,w,h}=p,cx=x+w/2,cy=y+h/2;
  if(p.print==='face')return `<g fill="#283d44"><circle cx="${cx-13}" cy="${cy-3}" r="3.5"/><circle cx="${cx+13}" cy="${cy-3}" r="3.5"/><path d="M${cx-8} ${cy+7}q8 8 16 0" fill="none" stroke="#283d44" stroke-width="2.7" stroke-linecap="round"/></g>`;
  if(p.print==='buttons')return `<g fill="#4c6b6d"><circle cx="${cx-11}" cy="${cy}" r="4"/><circle cx="${cx+11}" cy="${cy}" r="4"/></g>`;
  if(p.print==='window')return `<rect x="${cx-12}" y="${cy-12}" width="24" height="24" rx="7" fill="#d8f1f5" stroke="#50717d" stroke-width="3"/><path d="M${cx-6} ${cy-5}l5-4" stroke="white" stroke-width="3" stroke-linecap="round"/>`;
  if(p.print==='door')return `<rect x="${cx-11}" y="${y+9}" width="22" height="${h-10}" rx="5" fill="#a87556"/><circle cx="${cx+5}" cy="${cy+5}" r="2" fill="#fff0bf"/>`;
  if(p.print==='wheels')return [x+30,x+w-30].map(wx=>`<circle cx="${wx}" cy="${y+h-1}" r="10" fill="#405966"/><circle cx="${wx}" cy="${y+h-1}" r="4" fill="#c1d4db"/>`).join('');
  if(p.print==='feet')return `<path d="M${x+22} ${y+h-3}h25m37 0h25" stroke="#c67c38" stroke-width="5" stroke-linecap="round"/>`;
  if(p.print==='duck')return `<circle cx="${x+25}" cy="${y+12}" r="3.6" fill="#283d44"/><path d="M${x+w-22} ${y+15}h20v12h-20z" fill="#df8a3d"/><path d="M${x+w-19} ${y+22}h16" stroke="#a45c31" stroke-width="1.5"/>`;
  return '';
}
function brick(p,ghost=false,newPiece=false) {
  const {x,y,w,h}=p,front=ghost?'#d6dfcf':PALETTE[p.color],top=tint(front,20),side=tint(front,-24);
  let shape;
  if(p.shape==='roof')shape=`<path d="M${x} ${y+h} ${x+w/2} ${y} ${x+w} ${y+h}Z" fill="${front}"/><path d="m${x+w/2} ${y} 7-5 ${w/2} ${h}-7 5Z" fill="${side}"/>`;
  else {
    const studs=Math.max(1,Math.round(w/32));
    shape=`<path d="m${x} ${y} 7-6h${w}l-7 6Z" fill="${top}"/><path d="m${x+w} ${y} 7-6v${h}l-7 6Z" fill="${side}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${front}"/>${Array.from({length:studs},(_,i)=>{const sx=x+(i+.5)*w/studs+3;return `<rect x="${sx-7}" y="${y-12}" width="14" height="8" rx="3" fill="${front}"/><ellipse cx="${sx}" cy="${y-12}" rx="7" ry="3.4" fill="${top}" stroke="${side}" stroke-width="1"/>`;}).join('')}`;
  }
  return `<g class="brick-piece ${ghost?'unbuilt-piece':''} ${newPiece?'new-brick':''}">${shape}${ghost?'':printOn(p)}</g>`;
}
export function renderBuildSvg(build,{animate=false,mini=false}={}) {
  const model=modelById(build?.model);if(!model)return '';
  const pieces=Math.max(0,Math.min(model.pieces.length,build.pieces));
  return `<svg class="brick-figure ${mini?'mini-build':''}" viewBox="0 0 220 215" ${mini?'aria-hidden="true"':`role="img" aria-label="${model.name}, ${pieces} av ${model.pieces.length} klosser på plass"`}><ellipse cx="104" cy="202" rx="89" ry="6" fill="#e1e8dc"/>${model.pieces.slice(pieces).map(p=>brick(p,true)).join('')}${model.pieces.slice(0,pieces).map((p,i)=>brick(p,false,animate&&i===pieces-1)).join('')}</svg>`;
}
