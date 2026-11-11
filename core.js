import {randomGenerator} from './worlds.js';
export {randomGenerator};
import {restoreRewards} from './rewards.js';
import {CURRICULUM_LEVELS, CURRICULUM_TOPICS, GRADE_LEVELS, curriculumTopic, createCurriculumTask, validCurriculumTask, levelForGrade, nextLevelForGrade, levelsForGrade} from './curriculum.js';
export const VERSION='1.34.0';
export const CHANNEL = 'stable';
export const ROUND_LENGTH=8;
const DEFAULT_ROUND_LENGTH=5;
export const ROUND_LENGTHS=Object.freeze([5,6,ROUND_LENGTH]);
const validRoundLength=length=>ROUND_LENGTHS.includes(length);
export const PROGRESSION_ROUNDS=3;
export const STORAGE_KEY = CHANNEL === 'preview' ? 'tallvenn-preview-v1' : 'tallvenn-v1';
export const LEVELS = {
  1:{label:'Tall til 20', description:'Tiervenner, pluss, minus og tall som mangler.', max:20,
    pattern:['remove','ten','count','add','place','ten','subtract','missing']},
  2:{label:'Tall til 100', description:'Tiere, enere og regning med tierovergang.', max:100,
    pattern:['remove','ten','count','place','shift','add','subtract','missing']},
  3:{label:'Tall til 999', description:'Hundrere, tiere og enere, med pluss og minus.', max:999,
    pattern:['place','ten','count','shift','remove','add','subtract','missing']},
  4:{label:'Ganging og deling', description:'Små tall og brikker i like store grupper.', max:100,
    pattern:['add','subtract','multiply','divide','multiply','divide','missing','multiply']},
  ...CURRICULUM_LEVELS,
};
export const TOPICS={place:'Tall og plassverdi',ten:'Tiervenner',count:'Tallrekka',add:'Pluss',subtract:'Minus',missing:'Tall som mangler',multiply:'Ganging',divide:'Deling',...CURRICULUM_TOPICS};
const taskTypes = new Set(Object.values(LEVELS).flatMap(level => level.pattern));
const validLevel = x => Object.hasOwn(LEVELS, Number(x));
export function topicOf(task) {
  const type = typeof task === 'string' ? task : task.type;
  return ['place','remove','shift'].includes(type) ? 'place' : curriculumTopic(type) || type;
}
export const countStep=t=>t.answer<t.n?-1:1;
export const factKey=t=>curriculumTopic(t.type) ? JSON.stringify([t.type,t.prompt,t.visual])
  : [t.type,t.n??'',t.a??'',t.b??'',...(t.type==='count'?[t.answer]:[])].join(':');
function shuffle(items,rng){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

export function topicStats(history=[],level=1){
  const stats=Object.fromEntries(Object.keys(TOPICS).map(k=>[k,{total:0,firstTry:0,helped:0,recent:[],rounds:new Set(),independent:0,keys:new Set()}]));
  for(const round of history.filter(r=>r.level===Number(level)||r.results?.some(t=>t?.practiceLevel===Number(level))).slice(-12))for(const result of round.results||[]){
    if(!result||(result.practiceLevel??round.level)!==Number(level)||!Object.hasOwn(stats,topicOf(result)))continue;
    const s=stats[topicOf(result)];s.total++;if(result.firstTry)s.firstTry++;if(result.helped)s.helped++;
    s.recent.push(result);s.recent=s.recent.slice(-12);
    if(result.firstTry&&!result.helped)s.rounds.add(round.id);
    if(result.support==='optional'&&result.firstTry&&!result.helped)s.independent++;
    if(result.key)s.keys.add(result.key);
  }return stats;
}
function supportFor(type,stats,always){
  if (curriculumTopic(type)) return {support:'visible',input:false};
  const s=stats[topicOf(type)],r=s.recent,clean=r.filter(x=>x.firstTry&&!x.helped).length;
  const optional=!always&&type!=='place'&&r.length>=6&&s.rounds.size>=3&&clean/r.length>=.8&&r.slice(-2).every(x=>x.firstTry&&!x.helped);
  return{support:optional?'optional':'visible',input:optional&&s.independent>=6&&s.keys.size>=3&&clean/r.length>=.9};
}
function generateTask(type,level,rng,index,first=false){
  if (curriculumTopic(type)) return createCurriculumTask(type,rng,index);
  const int=(a,b)=>a+Math.floor(rng()*(b-a+1)),pick=a=>a[int(0,a.length-1)];let n,a,b,answer;
  const {max} = LEVELS[level];
  if(type==='remove'){n=level===1?first&&index===0?17:int(11,19):level===2?int(2,9)*10+int(1,9):int(1,9)*100+int(0,9)*10+int(1,9);b=n%10;answer=n-b;}
  else if(type==='ten'){a=int(3,9);answer=10-a;}
  else if(type==='count'){
    const step=pick([-1,1]);
    if(level===1)n=index%2?int(5,18):step>0?pick([9,19]):10;
    else if(level===2)n=step>0?int(2,10)*10-1:int(1,9)*10;
    else n=step>0?int(1,9)*100-1:int(1,9)*100;
    answer=n+step;
  }
  else if(type==='place'){n=level===1?int(11,19):level===2?int(2,9)*10+int(0,9):rng()<.5?int(1,9)*100+int(1,9):int(1,9)*100+int(1,9)*10+int(0,9);answer=n;}
  else if(type==='shift'){n=level===2?int(2,8)*10+int(0,9):int(2,7)*100+int(0,9)*10+int(0,9);b=level===3&&index%2===0?pick([-100,100]):pick([-10,10]);answer=n+b;}
  else if (type === 'subtract') {
    const crosses = rng() < .5;
    const ones = int(1, crosses ? 8 : 9);
    n = int(1, Math.floor((max - 1) / 10)) * 10 + ones;
    b = crosses ? int(ones + 1, 9) : int(1, ones);
    answer = n - b;
  } else if (type === 'missing') {
    a = int(3, max - 9);
    answer = int(1, 9);
    n = a + answer;
  } else if (type === 'multiply' || type === 'divide') {
    a = int(2, 4);
    b = int(2, 6);
    if (type === 'multiply') answer = a * b;
    else { n = a * b; answer = b; b = a; a = undefined; }
  } else if (max === 20) {
    a = int(5, 9);
    b = rng() < .5 ? int(1, 10 - a) : int(11 - a, 8);
    answer = a + b;
  } else {
    const crosses = rng() < .5;
    const ones = int(crosses ? 2 : 1, 9);
    a = int(1, Math.floor((max - (crosses ? 11 : 10)) / 10)) * 10 + ones;
    b = crosses ? int(11 - ones, 9) : int(1, 10 - ones);
    answer = a + b;
  }
  const choices=[answer];
  const neighbors=shuffle([answer-1,answer+1,answer-2,answer+2],rng);
  const others=shuffle([n,b,a,answer-10,answer+10],rng);
  // A place-value answer needs a distractor with a different tens digit too.
  const differentTen = type==='place' ? (answer + 10 <= max ? answer + 10 : answer - 10) : undefined;
  for(const c of [differentTen,...neighbors,...others]){if(Number.isInteger(c)&&c>=0&&c<=max&&!choices.includes(c))choices.push(c);if(choices.length===3)break;}
  return{id:`${index}-${type}`,type,...(n!==undefined&&{n}),...(a!==undefined&&{a}),...(b!==undefined&&{b}),answer,choices:shuffle(choices,rng),support:'visible',mode:'choice'};
}
function mixedRound(mode,grade,length,rng) {
  const grades=mode==='all'?[3,4,5,6,7,8,9,10]:[grade];
  const pools=new Map(grades.map(grade=>{
    const topics=new Map();
    for (const practiceLevel of levelsForGrade(grade)) {
      for (const type of new Set(LEVELS[practiceLevel].pattern)) {
        const topic=topicOf(type);
        if (!topics.has(topic)) topics.set(topic,[]);
        topics.get(topic).push({type,practiceLevel});
      }
    }
    return [grade,shuffle([...topics.values()],rng)];
  }));
  const order=shuffle(grades,rng);
  return Array.from({length},(_,i)=>{
    const topics=pools.get(order[i%order.length]);
    const candidates=topics[Math.floor(i/order.length)%topics.length];
    const {type,practiceLevel}=candidates[Math.floor(rng()*candidates.length)];
    const task=generateTask(type,practiceLevel,rng,i);
    return {...task,practiceLevel,role:'mix'};
  });
}

export function createRound(level=1,seed=Date.now(),first=false,options={}){
  level=validLevel(level)?Number(level):1;
  const length=validRoundLength(options.length)?options.length:ROUND_LENGTH;
  const reviewStart=length-(length===5?1:2);
  const rng=randomGenerator(seed),history=options.history||[],stats=topicStats(history,level);
  let focus=null, pattern=[...LEVELS[level].pattern];
  const pool=[...new Set(pattern)];
  if(!first&&history.some(r=>r.level===level&&!r.mix&&r.results?.length)){
    const recent=history.filter(r=>r.level===level&&!r.mix).slice(-3).flatMap(r=>r.results||[]).filter(r=>r&&pool.includes(r.type)),needs=recent.filter(r=>!r.firstTry||r.helped);
    focus=needs.length?needs[needs.length-1].type:shuffle(pool,rng).sort((a,b)=>stats[topicOf(a)].total-stats[topicOf(b)].total)[0];
    const familiar=shuffle(pool.filter(t=>t!==focus),rng).sort((a,b)=>{const score=t=>{const s=stats[topicOf(t)];return s.total?s.firstTry/s.total:0;};return score(b)-score(a);}),other=shuffle(pool.filter(t=>t!==focus),rng);
    const review=Array.from({length:length-reviewStart},(_,i)=>other[i]||focus);
    pattern=[familiar[0]||focus,familiar[1]||focus,...Array(reviewStart-2).fill(focus),...review];
  } else if(length<ROUND_LENGTH && pool.length>=length) {
    pattern=[pool[0],...shuffle(pool.slice(1),rng)];
  }
  const tasks=options.mix?mixedRound(options.mix,options.grade,length,rng):pattern.slice(0,length).map((type,i)=>generateTask(type,level,rng,i,first));
  if (!options.mix) {
    for(let i=1;i<tasks.length;i++)for(let j=0;j<12&&factKey(tasks[i])===factKey(tasks[i-1]);j++)tasks[i]=generateTask(tasks[i].type,level,rng,i);
    tasks.forEach((t,i)=>{const s=supportFor(t.type,stats,options.alwaysShowVisuals);t.support=s.support;if(i>=reviewStart&&s.input)t.mode='input';t.role=i<2?'warmup':i<reviewStart?'focus':'review';});
    const preview = options.preview;
    if (preview && validLevel(preview.level) && preview.level !== level && Number.isInteger(preview.count)) {
      const types = [...new Set(LEVELS[preview.level].pattern)];
      const count=Math.min(preview.count,PROGRESSION_ROUNDS-1);
      for (let i=0; i<count; i++) {
        const index=length-count+i;
        tasks[index]={...generateTask(types[i%types.length],preview.level,rng,index), practiceLevel:preview.level, role:'preview'};
      }
    }
  }
  return{id:`${seed}-${level}`,seed,level,focus:options.mix?null:focus,tasks,...(options.mix&&{mix:options.mix}),index:0,attempts:Array(length).fill(0),helped:Array(length).fill(false),hintStages:Array(length).fill(0),results:Array(length).fill(null),solved:false,startedAt:new Date().toISOString()};
}
export function noteHelp(round){if(!round||round.solved||round.index>=round.tasks.length)return round;const helped=[...round.helped],hintStages=[...(round.hintStages||Array(round.tasks.length).fill(0))];helped[round.index]=true;hintStages[round.index]=Math.min(3,hintStages[round.index]+1);return{...round,helped,hintStages};}
export function answerRound(round,value){
  if(!round||round.solved||round.index>=round.tasks.length)return round;const t=round.tasks[round.index];
  if(!Number.isInteger(value)||value<0||value>999||(t.mode!=='input'&&!t.choices.includes(value)))return round;
  const index=round.index,attempts=[...round.attempts];attempts[index]++;
  if(value!==t.answer)return{...round,attempts};const results=[...round.results];
  results[index]={type:t.type,firstTry:attempts[index]===1,helped:round.helped[index],attempts:attempts[index],support:t.support||'visible',mode:t.mode||'choice',key:factKey(t),...(t.practiceLevel&&{practiceLevel:t.practiceLevel}),...(t.n!==undefined&&{n:t.n}),...(t.a!==undefined&&{a:t.a}),...(t.b!==undefined&&{b:t.b}),answer:t.answer};
  return{...round,attempts,results,solved:true};
}
export function advanceRound(round){
  if(!round||!round.solved||round.index>=round.tasks.length)return round;
  const tasks=[...round.tasks],source=round.tasks[round.index],result=round.results[round.index],target=round.index+3;
  if(!round.mix&&target<tasks.length&&tasks[target].role!=='preview'&&(!result.firstTry||result.helped)){
    const rng=randomGenerator((round.seed||Number.parseInt(round.id)||1)+round.index*37+991), practiceLevel=source.practiceLevel||round.level;
    let repeated=generateTask(source.type,practiceLevel,rng,target);
    for(let j=0;j<12&&factKey(repeated)===factKey(source);j++)repeated=generateTask(source.type,practiceLevel,rng,target);
    tasks[target]={...repeated,...(source.practiceLevel&&{practiceLevel}),role:'review',reviewOf:round.index};
  }return{...round,tasks,index:round.index+1,solved:false};
}
export function roundSummary(r){if(!r||r.index!==r.tasks.length||!r.results.every(Boolean))return null;return{id:r.id,level:r.level,...(r.mix&&{mix:r.mix}),length:r.tasks.length,date:new Date().toISOString(),focus:r.focus||null,firstTry:r.results.filter(x=>x.firstTry).length,helped:r.results.filter(x=>x.helped).length,results:r.results};}
export function growthState(total){total=Math.max(0,Math.floor(Number(total)||0));const stage=total===0?0:((total-1)%5)+1;return{stage,flowers:Math.floor(total/5),label:['Et lite frø','En ny spire!','To fine blader!','Planten vokser!','Snart en blomst!','Nå blomstrer det!'][stage]};}
export function practiceLevelForGrade(state, grade) {
  const level=levelForGrade(grade,state.level);
  const excluded=state.progressionExcluded?.[grade]??[];
  if (!state.autoProgress||!excluded.includes(level)) return level;
  return nextLevelForGrade(grade,level,excluded)??levelsForGrade(grade).findLast(choice=>!excluded.includes(choice))??level;
}

export function progressionPreview(state, grade) {
  const level = !state.mix && state.autoProgress && nextLevelForGrade(grade, state.level, state.progressionExcluded?.[grade]);
  return level ? {level, count:state.progressRounds} : null;
}

export function advancePractice(state, grade, finishedLevel) {
  const next = progressionPreview(state, grade);
  if (!next || finishedLevel !== state.level) return state;
  const progressRounds = state.progressRounds + 1;
  return progressRounds >= PROGRESSION_ROUNDS ? {...state, level:next.level, progressRounds:0} : {...state, progressRounds};
}

export function freshState(){return{version:1,level:1,roundLength:DEFAULT_ROUND_LENGTH,mix:null,autoProgress:false,progressionExcluded:{},progressRounds:0,sound:true,haptics:true,alwaysShowVisuals:false,focusBreaks:false,focusBreakPending:false,roundsCompleted:0,history:[],active:null,...restoreRewards(null,0)};}
export function restoreState(raw){
  const fallback=freshState();if(!raw||raw.version!==1)return fallback;
  const history=Array.isArray(raw.history)?raw.history.filter(r=>{
    const length=r?.length??ROUND_LENGTH;
    return typeof r?.id==='string'&&validLevel(r.level)&&typeof r.date==='string'&&validRoundLength(length)&&Number.isInteger(r.firstTry)&&r.firstTry>=0&&r.firstTry<=length&&Number.isInteger(r.helped)&&r.helped>=0&&r.helped<=length;
  }).slice(-40):[];
  const r=raw.active;
  const length=r?.tasks?.length;
  const validNumber=x=>Number.isInteger(x)&&x>=0&&x<=999;
  const validTask=t=>t&&taskTypes.has(t.type)&&validNumber(t.answer)&&Array.isArray(t.choices)&&t.choices.length===3&&new Set(t.choices).size===3&&t.choices.includes(t.answer)&&t.choices.every(validNumber)
    && (t.practiceLevel===undefined||validLevel(t.practiceLevel)&&LEVELS[t.practiceLevel].pattern.includes(t.type))
    && (!curriculumTopic(t.type)||validCurriculumTask(t))
    && (!['remove','count','place','shift','subtract','missing','divide'].includes(t.type)||validNumber(t.n)&&t.n>0)
    && (!['ten','add','missing','multiply'].includes(t.type)||validNumber(t.a))
    && (!['remove','shift','subtract','add','multiply','divide'].includes(t.type)||Number.isInteger(t.b)&&Math.abs(t.b)<=999)
    && (t.type!=='multiply'||t.a>=2&&t.a<=4&&t.b>=2&&t.b<=6)
    && (t.type!=='divide'||t.b>=2&&t.b<=4&&t.answer>=2&&t.answer<=6&&t.n===t.b*t.answer);
  const valid=r&&typeof r.id==='string'&&validLevel(r.level)&&Array.isArray(r.tasks)&&validRoundLength(length)&&r.tasks.every(validTask)&&Number.isInteger(r.index)&&r.index>=0&&r.index<length&&['attempts','helped','results'].every(k=>Array.isArray(r[k])&&r[k].length===length)&&r.attempts.every(x=>Number.isInteger(x)&&x>=0)&&r.helped.every(x=>typeof x==='boolean')&&r.results.every((x,i)=>i<r.index||(i===r.index&&r.solved)?x&&typeof x.firstTry==='boolean'&&typeof x.helped==='boolean':x===null)&&typeof r.solved==='boolean';
  const active=valid?{...r,tasks:r.tasks.map(t=>({...t,support:t.support==='optional'&&!curriculumTopic(t.type)?'optional':'visible',mode:t.mode==='input'&&!curriculumTopic(t.type)?'input':'choice'})),hintStages:Array.isArray(r.hintStages)&&r.hintStages.length===length?r.hintStages.map(x=>Number.isInteger(x)?Math.max(0,Math.min(3,x)):0):r.helped.map(v=>v?3:0)}:null;
  const total=Number.isSafeInteger(raw.roundsCompleted)&&raw.roundsCompleted>=history.length?raw.roundsCompleted:history.length;
  const mix=['grade','all'].includes(raw.mix)?raw.mix:null;
  const autoProgress=!mix&&raw.autoProgress===true;
  const progressRounds=autoProgress&&Number.isInteger(raw.progressRounds)&&raw.progressRounds>=0&&raw.progressRounds<PROGRESSION_ROUNDS ? raw.progressRounds : 0;
  const progressionExcluded=Object.fromEntries(Object.entries(GRADE_LEVELS).flatMap(([grade,levels])=>{
    const values=raw.progressionExcluded?.[grade];
    if (!Array.isArray(values)) return [];
    const excluded=levels.filter(level=>values.includes(level)).slice(0,levels.length-1);
    return excluded.length?[[grade,excluded]]:[];
  }));
  return{...fallback,level:validLevel(raw.level)?Number(raw.level):1,roundLength:validRoundLength(raw.roundLength)?raw.roundLength:fallback.roundLength,autoProgress,progressionExcluded,progressRounds,mix,sound:typeof raw.sound==='boolean'?raw.sound:fallback.sound,haptics:raw.haptics!==false,alwaysShowVisuals:raw.alwaysShowVisuals===true,focusBreaks:raw.focusBreaks===true,focusBreakPending:raw.focusBreaks===true&&raw.focusBreakPending===true&&!active,roundsCompleted:total,history,active,...restoreRewards(raw,total)};
}
