import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as core from '../core.js';
import * as rewards from '../rewards.js';
import * as plants from '../plants.js';
import { createFocusBreak } from '../breaks.js';
import {hintFor} from '../learning.js';

const source=(await fs.readFile(new URL('../app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
function harness({sound=true,reduced=false}={}){
  const events={},plays=[],animations=[];
  const document={activeElement:null,querySelectorAll:()=>[],addEventListener:(name,fn)=>{events[name]=fn;}};
  const heading={focus(){document.activeElement=heading;}};
  const root={innerHTML:'',querySelector:s=>s==='h1'?heading:null};
  const output={textContent:'',animate:(...args)=>animations.push(args)};
  const submit={disabled:true},erase={disabled:true,animate:(...args)=>animations.push(args)};
  const digits=Object.fromEntries(Array.from({length:10},(_,i)=>[i,{animate:(...args)=>animations.push(args)}]));
  document.querySelector=s=>s==='#app'?root:s==='#announcer'?{textContent:''}:s==='#input-value'?output:s==='[data-action="submit-number"]'?submit:s==='[data-action="erase"]'?erase:s.match(/^\[data-digit="([0-9])"\]$/)?digits[s.match(/[0-9]/)[0]]:null;
  const context=vm.createContext({...core,...rewards,...plants,createFocusBreak,hintFor,document,navigator:{},window:{addEventListener(){},scrollTo(){}},
    localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:fn=>fn(),setTimeout(){},matchMedia:()=>({matches:reduced}),
    createUpdater:()=>({}),createSoundPlayer:()=>({play:(...args)=>plays.push(args),unlock(){}}),
  });
  const run=code=>vm.runInContext(code,context);run(source);
  run(`state.sound=${sound}; state.active=createRound(1,42,true); state.active.tasks[0].mode='input'; view='round'; render();`);
  function click(digit){const button={disabled:false,dataset:{digit},closest:s=>s==='[data-digit]'?button:null};events.click({target:button});}
  function key(value,mods={}){events.keydown({key:value,...mods,preventDefault(){},target:{closest:()=>null}});}
  return {run,click,key,events,plays,animations,output,submit,erase,root,heading,document};
}

test('Touch and physical keys update the same entry, click once per accepted digit and enforce the limit',()=>{
  const h=harness();h.click('1');h.key('2');h.click('3');h.click('4');
  assert.equal(h.output.textContent,'123');assert.equal(h.submit.disabled,false);assert.equal(h.erase.disabled,false);
  assert.equal(h.plays.filter(([kind])=>kind==='key').length,3);
  h.key('Backspace');assert.equal(h.output.textContent,'12');
  h.run('eraseDigit(); eraseDigit(); eraseDigit();');
  assert.equal(h.output.textContent,'?');assert.equal(h.submit.disabled,true);assert.equal(h.erase.disabled,true);
  assert.equal(h.plays.length,6,'erasing an already empty entry does not click');
});

test('Leading zero, mute and reduced motion are respected without losing input feedback',()=>{
  const h=harness({sound:false,reduced:true});h.click('0');h.click('5');
  assert.equal(h.output.textContent,'5');assert.deepEqual(h.plays,[['key',false],['key',false]]);
  assert.equal(h.animations.length,0);
  const animated=harness();animated.click('2');assert.equal(animated.animations.length,2);
});

test('Solved tasks, other task modes and browser shortcuts cannot accidentally type digits',()=>{
  const h=harness();h.key('1',{ctrlKey:true});assert.equal(h.plays.length,0);
  h.run('state.active.solved=true;');h.click('2');assert.equal(h.plays.length,0);
  h.run("state.active.solved=false;state.active.tasks[0].mode='choice';");h.click('3');assert.equal(h.plays.length,0);
  assert.equal(h.run('ui.entry'), '');
});

test('Starting another round clears previous answer states and moves focus to the new question',()=>{
  const h=harness();
  h.run("ui.wrong=[10];ui.entry='99';state.active=null;view='complete';startRound();");
  assert.equal(h.run('ui.entry'),'');assert.equal(h.run('ui.wrong.length'),0);
  const buttons=[...h.root.innerHTML.matchAll(/<button class="answer ([^"]*)"[^>]*>/g)];
  assert.equal(buttons.length,3);assert.ok(buttons.every(b=>!b[0].includes('correct')&&!b[0].includes('tried')&&!b[0].includes('disabled')));
  assert.equal(h.document.activeElement,h.heading);
});

test('Fast taps after a wrong answer require a fresh retry before accepting another answer', () => {
  const h = harness();
  h.run("state.active.tasks[0].mode='choice'; submitAnswer(state.active.tasks[0].choices.find(value => value !== 10)); submitAnswer(10);");
  assert.equal(h.run('state.active.attempts[0]'), 1);
  assert.equal(h.run('state.active.solved'), false);
  assert.match(h.root.innerHTML, /data-action="retry" disabled/);
  h.run('retryAnswer(); submitAnswer(10);');
  assert.equal(h.run('state.active.attempts[0]'), 1);
  h.run('ui.retryUntil = 0; retryAnswer(); submitAnswer(10);');
  assert.equal(h.run('state.active.attempts[0]'), 2);
  assert.equal(h.run('state.active.solved'), true);
});

test('A pending memory game can be retried and completed without awarding another star', () => {
  const h = harness();
  h.run("state.active=null;state.roundsCompleted=3;state.focusBreaks=true;state.focusBreakPending=true; startRound();");
  assert.equal(h.run('view'), 'focus-break');
  assert.match(h.root.innerHTML, /Husk de fire bildene/);
  h.run("focusGame.phase='guess'; answerFocusBreak(focusGame.choices.findIndex(item => item !== focusGame.missing));");
  assert.equal(h.run('focusGame.phase'), 'study');
  assert.equal(h.run('state.focusBreakPending'), true);
  h.run("focusGame.phase='guess'; answerFocusBreak(focusGame.choices.indexOf(focusGame.missing));");
  assert.equal(h.run('state.focusBreakPending'), false);
  assert.equal(h.run('state.roundsCompleted'), 3);
  assert.match(h.root.innerHTML, /Til oppgavene/);
});

test('Completing the third round schedules a game only with the option enabled', () => {
  for (const enabled of [false, true]) {
    const h = harness();
    h.run(`state.focusBreaks=${enabled}; state.roundsCompleted=2;
      for (let index = 0; index < ROUND_LENGTH; index++) {
        state.active = answerRound(state.active, state.active.tasks[index].answer);
        if (index < ROUND_LENGTH - 1) state.active = advanceRound(state.active);
      }`);
    const next = { dataset:{action:'next'}, closest:selector => selector === '[data-action]' ? next : null };
    h.events.click({target:next});
    assert.equal(h.run('state.roundsCompleted'), 3);
    assert.equal(h.run('state.focusBreakPending'), enabled);
    assert.equal(h.run('restoreState(state).focusBreakPending'), enabled);
    assert.equal(h.run('view'), 'complete');
  }
});
