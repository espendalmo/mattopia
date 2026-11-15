import test from 'node:test';
import assert from 'node:assert/strict';
import {createRound,answerRound,advanceRound,continueRetry,retryPlan,noteHelp,roundSummary,restoreState,freshState,growthState,factKey} from '../core.js';
import {hintFor} from '../learning.js';

function complete(seed,level=1){let r=createRound(level,seed);for(let i=0;i<8;i++)r=advanceRound(answerRound(r,r.tasks[r.index].answer));return roundSummary(r);}

test('Struggled facts return after two intervening tasks, with changed numbers and normal support',()=>{
  let r=createRound(1,77);const first=r.tasks[0];r=noteHelp(r);r=advanceRound(answerRound(r,first.answer));
  assert.equal(r.tasks[3].type,first.type);assert.notEqual(factKey(r.tasks[3]),factKey(first));assert.equal(r.tasks[3].reviewOf,0);assert.equal(r.tasks[3].support,'visible');assert.equal(r.tasks[3].mode,'choice');
});
test('Next round uses two warmups, four focus tasks and two mixed reviews on the chosen level',()=>{
  const h=complete(10);h.results[h.results.length-1]={...h.results.at(-1),type:'ten',firstTry:false,helped:true};
  const r=createRound(1,20,false,{history:[h]});assert.equal(r.focus,'ten');assert.equal(r.level,1);
  assert.deepEqual(r.tasks.map(t=>t.role),['warmup','warmup','focus','focus','focus','focus','review','review']);
  assert.ok(r.tasks.slice(2,6).every(t=>t.type==='ten'));assert.ok(r.tasks.slice(6).every(t=>t.type!=='ten'));
});
test('Support cannot disappear after just one successful round and does not cross levels',()=>{
  const h=[complete(1)];assert.ok(createRound(1,2,false,{history:h}).tasks.every(t=>t.support==='visible'));
  const many=Array.from({length:8},(_,i)=>complete(i));assert.ok(createRound(2,2,false,{history:many}).tasks.every(t=>t.support==='visible'));
});
test('Support fades conservatively; number entry needs independent practice and can be overridden',()=>{
  const h=Array.from({length:4},(_,i)=>complete(i));
  const r=createRound(1,81,false,{history:h});assert.ok(r.tasks.some(t=>t.support==='optional'));assert.ok(r.tasks.every(t=>t.mode==='choice'));
  const independent=h.map((round,i)=>({...round,results:round.results.map((x,j)=>({...x,support:'optional',key:`${x.type}:${i}:${j}`}))}));
  const rounds=Array.from({length:40},(_,i)=>createRound(1,i,false,{history:independent}));
  assert.ok(rounds.some(r=>r.tasks.some(t=>t.mode==='input')));assert.ok(rounds.every(r=>r.tasks.slice(0,6).every(t=>t.mode==='choice')));
  assert.ok(createRound(1,81,false,{history:independent,alwaysShowVisuals:true}).tasks.every(t=>t.support==='visible'&&t.mode==='choice'));
});
test('Typed answers are checked beyond multiple-choice alternatives and duplicate submissions are ignored',()=>{
  let r=createRound(1,6);r.tasks[0].mode='input';const wrong=999;r=answerRound(r,wrong);assert.equal(r.attempts[0],1);assert.equal(r.solved,false);
  assert.equal(retryPlan(r).kind,'retry');
  r=continueRetry(r);
  r=answerRound(r,r.tasks[0].answer);assert.equal(r.solved,true);assert.equal(answerRound(r,r.tasks[0].answer),r);
});
test('A labelled task is followed by a distinct example at the same level',()=>{
  const round = createRound(51,42), original = round.tasks[0];
  const pending = answerRound(round,original.choices.find(c=>c!==original.answer));
  const plan = retryPlan(pending);
  assert.equal(plan.kind,'similar');
  const ready = continueRetry(pending), next = ready.tasks[0];
  assert.equal(ready.level,round.level);
  assert.equal(ready.index,round.index);
  assert.equal(ready.attempts[0],1);
  assert.equal(next.type,original.type);
  assert.equal(next.role,original.role);
  assert.equal(next.mode,'choice');
  assert.notEqual(factKey(next),factKey(original));
  assert.notEqual(next.labels[next.answer],original.labels[original.answer]);
  assert.equal(ready.hintStages[0],1);
  assert.deepEqual(restoreState({...freshState(),active:ready}).active,ready);
  const missed = answerRound(ready,next.choices.find(c=>c!==next.answer));
  const retry = continueRetry(missed);
  assert.equal(retry.tasks[0],next);
  assert.equal(advanceRound(retry),retry);
  const done = answerRound(retry,next.answer);
  assert.ok(done.solved);
  assert.equal(done.results[0].firstTry,false);
  assert.equal(done.results[0].helped,true);
});
test('Hint stages and old 1.0 stars, sound preference and unfinished rounds survive migration',()=>{
  let r=createRound(1,5);r=noteHelp(noteHelp(r));const stored={...freshState(),sound:false,roundsCompleted:17,active:r};
  assert.equal(restoreState(JSON.parse(JSON.stringify(stored))).active.hintStages[0],2);
  delete r.hintStages;r.tasks=r.tasks.map(({mode,support,...t})=>t);
  const migrated=restoreState({...stored,active:r});assert.equal(migrated.roundsCompleted,17);assert.equal(migrated.sound,false);assert.equal(migrated.active.index,0);assert.equal(migrated.active.hintStages[0],3);
});
test('First hint guides attention and only the final hint states the result',()=>{
  const r=createRound(1,42,true),t=r.tasks[0];assert.ok(!hintFor(t,1).includes('10'));assert.ok(!hintFor(t,2).includes('10'));assert.ok(hintFor(t,3).includes('17 − 7 = 10'));
  let helped=r;for(let i=0;i<5;i++)helped=noteHelp(helped);assert.equal(helped.hintStages[0],3);
});
test('Growth rewards every round, blooms at five and keeps earned flowers in a new cycle',()=>{
  assert.equal(growthState(0).stage,0);assert.equal(growthState(1).stage,1);assert.equal(growthState(5).flowers,1);assert.equal(growthState(5).stage,5);assert.equal(growthState(6).stage,1);assert.equal(growthState(6).flowers,1);assert.equal(growthState(10).flowers,2);
});
