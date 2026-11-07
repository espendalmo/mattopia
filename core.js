import {restoreRewards} from './rewards.js';
export const VERSION='1.3.0';
export const ROUND_LENGTH=8;
export const STORAGE_KEY='tallvenn-v1';
export const LEVELS={1:{label:'Tall til 20',description:'Små tall, tiervenner, pluss og minus.'},2:{label:'Tall til 100',description:'Tiere, enere og overganger mellom tiere.'},3:{label:'Tall til 999',description:'Hundrere, tiere, enere og tall med null.'}};
export const TOPICS={place:'Tall og plassverdi',ten:'Tiervenner',count:'Tallrekka',add:'Pluss',subtract:'Minus'};
const POOLS={1:['remove','ten','count','add','place','subtract'],2:['remove','ten','count','place','shift','add'],3:['place','ten','count','shift','remove']};
const PATTERNS={1:['remove','ten','count','add','place','ten','subtract','add'],2:['remove','ten','count','place','shift','add','shift','count'],3:['place','ten','count','shift','remove','place','shift','count']};
const validLevel=x=>[1,2,3].includes(Number(x));
export const topicOf=t=>['place','remove','shift'].includes(typeof t==='string'?t:t.type)?'place':(typeof t==='string'?t:t.type);
export const countStep=t=>t.answer<t.n?-1:1;
export const factKey=t=>[t.type,t.n??'',t.a??'',t.b??'',...(t.type==='count'?[t.answer]:[])].join(':');
export function randomGenerator(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(items,rng){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

export function topicStats(history=[],level=1){
  const stats=Object.fromEntries(Object.keys(TOPICS).map(k=>[k,{total:0,firstTry:0,helped:0,recent:[],rounds:new Set(),independent:0,keys:new Set()}]));
  for(const round of history.filter(r=>r.level===Number(level)).slice(-12))for(const result of round.results||[]){
    if(!result||!stats[topicOf(result)])continue;
    const s=stats[topicOf(result)];s.total++;if(result.firstTry)s.firstTry++;if(result.helped)s.helped++;
    s.recent.push(result);s.recent=s.recent.slice(-12);
    if(result.firstTry&&!result.helped)s.rounds.add(round.id);
    if(result.support==='optional'&&result.firstTry&&!result.helped)s.independent++;
    if(result.key)s.keys.add(result.key);
  }return stats;
}
function supportFor(type,stats,always){
  const s=stats[topicOf(type)],r=s.recent,clean=r.filter(x=>x.firstTry&&!x.helped).length;
  const optional=!always&&type!=='place'&&r.length>=6&&s.rounds.size>=3&&clean/r.length>=.8&&r.slice(-2).every(x=>x.firstTry&&!x.helped);
  return{support:optional?'optional':'visible',input:optional&&s.independent>=6&&s.keys.size>=3&&clean/r.length>=.9};
}
function generateTask(type,level,rng,index,first=false){
  const int=(a,b)=>a+Math.floor(rng()*(b-a+1)),pick=a=>a[int(0,a.length-1)];let n,a,b,answer;
  if(type==='remove'){n=level===1?first&&index===0?17:int(11,19):level===2?int(2,9)*10+int(1,9):int(1,9)*100+int(0,9)*10+int(1,9);b=n%10;answer=n-b;}
  else if(type==='ten'){a=int(3,9);answer=10-a;}
  else if(type==='count'){
    const step=pick([-1,1]);
    if(level===1)n=index%2?int(5,18):step>0?pick([9,19]):10;
    else if(level===2)n=step>0?int(2,10)*10-1:int(1,9)*10;
    else n=step>0?int(1,9)*100-1:int(1,9)*100;
    answer=n+step;
  }
  else if(type==='place'){n=level===1?int(11,19):level===2?int(2,9)*10+int(0,9):index%2?int(1,9)*100+int(1,9):int(1,9)*100+int(1,9)*10+int(0,9);answer=n;}
  else if(type==='shift'){n=level===2?int(2,8)*10+int(0,9):int(2,7)*100+int(0,9)*10+int(0,9);b=level===3&&index%2===0?pick([-100,100]):pick([-10,10]);answer=n+b;}
  else if(type==='subtract'){n=int(11,18);b=int(1,Math.min(5,n-10));answer=n-b;}
  else{a=int(5,9);b=index===3?int(1,10-a):int(11-a,8);answer=a+b;}
  const max=level===1?20:level===2?100:999,choices=[answer];
  for(const c of [...shuffle([answer-1,answer+1,answer-2,answer+2],rng),...shuffle([n,b,a,answer-10,answer+10],rng)]){if(Number.isInteger(c)&&c>=0&&c<=max&&!choices.includes(c))choices.push(c);if(choices.length===3)break;}
  return{id:`${index}-${type}`,type,...(n!==undefined&&{n}),...(a!==undefined&&{a}),...(b!==undefined&&{b}),answer,choices:shuffle(choices,rng),support:'visible',mode:'choice'};
}
export function createRound(level=1,seed=Date.now(),first=false,options={}){
  level=validLevel(level)?Number(level):1;
  const rng=randomGenerator(seed),history=options.history||[],stats=topicStats(history,level),pool=POOLS[level];let focus=null,pattern=[...PATTERNS[level]];
  if(!first&&history.some(r=>r.level===level&&r.results?.length)){
    const recent=history.filter(r=>r.level===level).slice(-3).flatMap(r=>r.results||[]).filter(r=>r&&pool.includes(r.type)),needs=recent.filter(r=>!r.firstTry||r.helped);
    focus=needs.length?needs[needs.length-1].type:shuffle(pool,rng).sort((a,b)=>stats[topicOf(a)].total-stats[topicOf(b)].total)[0];
    const familiar=shuffle(pool.filter(t=>t!==focus),rng).sort((a,b)=>{const score=t=>{const s=stats[topicOf(t)];return s.total?s.firstTry/s.total:0;};return score(b)-score(a);}),other=shuffle(pool.filter(t=>t!==focus),rng);
    pattern=[familiar[0]||'ten',familiar[1]||'remove',focus,focus,focus,focus,other[0],other[1]];
  }
  const tasks=pattern.map((type,i)=>generateTask(type,level,rng,i,first));
  for(let i=1;i<tasks.length;i++)for(let j=0;j<12&&factKey(tasks[i])===factKey(tasks[i-1]);j++)tasks[i]=generateTask(tasks[i].type,level,rng,i);
  tasks.forEach((t,i)=>{const s=supportFor(t.type,stats,options.alwaysShowVisuals);t.support=s.support;if(i>=6&&s.input)t.mode='input';t.role=i<2?'warmup':i<6?'focus':'review';});
  return{id:`${seed}-${level}`,seed,level,focus,tasks,index:0,attempts:Array(8).fill(0),helped:Array(8).fill(false),hintStages:Array(8).fill(0),results:Array(8).fill(null),solved:false,startedAt:new Date().toISOString()};
}
export function noteHelp(round){if(!round||round.solved||round.index>=8)return round;const helped=[...round.helped],hintStages=[...(round.hintStages||Array(8).fill(0))];helped[round.index]=true;hintStages[round.index]=Math.min(3,hintStages[round.index]+1);return{...round,helped,hintStages};}
export function answerRound(round,value){
  if(!round||round.solved||round.index>=8)return round;const t=round.tasks[round.index];
  if(!Number.isInteger(value)||value<0||value>999||(t.mode!=='input'&&!t.choices.includes(value)))return round;
  const index=round.index,attempts=[...round.attempts];attempts[index]++;
  if(value!==t.answer)return{...round,attempts};const results=[...round.results];
  results[index]={type:t.type,firstTry:attempts[index]===1,helped:round.helped[index],attempts:attempts[index],support:t.support||'visible',mode:t.mode||'choice',key:factKey(t),...(t.n!==undefined&&{n:t.n}),...(t.a!==undefined&&{a:t.a}),...(t.b!==undefined&&{b:t.b}),answer:t.answer};
  return{...round,attempts,results,solved:true};
}
export function advanceRound(round){
  if(!round||!round.solved||round.index>=8)return round;
  const tasks=[...round.tasks],source=round.tasks[round.index],result=round.results[round.index],target=round.index+3;
  if(target<8&&(!result.firstTry||result.helped)){
    const rng=randomGenerator((round.seed||Number.parseInt(round.id)||1)+round.index*37+991);let repeated=generateTask(source.type,round.level,rng,target);
    for(let j=0;j<12&&factKey(repeated)===factKey(source);j++)repeated=generateTask(source.type,round.level,rng,target);
    tasks[target]={...repeated,role:'review',reviewOf:round.index};
  }return{...round,tasks,index:round.index+1,solved:false};
}
export function roundSummary(r){if(r?.index!==8||!r.results.every(Boolean))return null;return{id:r.id,level:r.level,date:new Date().toISOString(),focus:r.focus||null,firstTry:r.results.filter(x=>x.firstTry).length,helped:r.results.filter(x=>x.helped).length,results:r.results};}
export function growthState(total){total=Math.max(0,Math.floor(Number(total)||0));const stage=total===0?0:((total-1)%5)+1;return{stage,flowers:Math.floor(total/5),label:['Et lite frø','En ny spire!','To fine blader!','Planten vokser!','Snart en blomst!','Nå blomstrer det!'][stage]};}
export function freshState(){return{version:1,level:1,sound:true,alwaysShowVisuals:false,roundsCompleted:0,history:[],active:null,...restoreRewards(null,0)};}
export function restoreState(raw){
  const fallback=freshState();if(!raw||raw.version!==1)return fallback;
  const history=Array.isArray(raw.history)?raw.history.filter(r=>typeof r?.id==='string'&&validLevel(r.level)&&typeof r.date==='string'&&Number.isInteger(r.firstTry)&&r.firstTry>=0&&r.firstTry<=8&&Number.isInteger(r.helped)&&r.helped>=0&&r.helped<=8).slice(-40):[];
  const r=raw.active;
  const validTask=t=>t&&POOLS[1].concat('shift').includes(t.type)&&Number.isInteger(t.answer)&&t.answer>=0&&t.answer<=999&&Array.isArray(t.choices)&&t.choices.length===3&&new Set(t.choices).size===3&&t.choices.includes(t.answer)&&t.choices.every(x=>Number.isInteger(x)&&x>=0&&x<=999)&&(['remove','count','place','shift','subtract'].includes(t.type)?Number.isInteger(t.n)&&t.n>=1&&t.n<=999:Number.isInteger(t.a)&&t.a>=0&&t.a<=9)&&(['remove','shift','subtract','add'].includes(t.type)?Number.isInteger(t.b):true);
  const valid=r&&typeof r.id==='string'&&validLevel(r.level)&&Array.isArray(r.tasks)&&r.tasks.length===8&&r.tasks.every(validTask)&&Number.isInteger(r.index)&&r.index>=0&&r.index<8&&['attempts','helped','results'].every(k=>Array.isArray(r[k])&&r[k].length===8)&&r.attempts.every(x=>Number.isInteger(x)&&x>=0)&&r.helped.every(x=>typeof x==='boolean')&&r.results.every((x,i)=>i<r.index||(i===r.index&&r.solved)?x&&typeof x.firstTry==='boolean'&&typeof x.helped==='boolean':x===null)&&typeof r.solved==='boolean';
  const active=valid?{...r,tasks:r.tasks.map(t=>({...t,support:t.support==='optional'?'optional':'visible',mode:t.mode==='input'?'input':'choice'})),hintStages:Array.isArray(r.hintStages)&&r.hintStages.length===8?r.hintStages.map(x=>Number.isInteger(x)?Math.max(0,Math.min(3,x)):0):r.helped.map(v=>v?3:0)}:null;
  const total=Number.isSafeInteger(raw.roundsCompleted)&&raw.roundsCompleted>=history.length?raw.roundsCompleted:history.length;
  return{...fallback,level:validLevel(raw.level)?Number(raw.level):1,sound:typeof raw.sound==='boolean'?raw.sound:fallback.sound,alwaysShowVisuals:raw.alwaysShowVisuals===true,roundsCompleted:total,history,active,...restoreRewards(raw,total)};
}
