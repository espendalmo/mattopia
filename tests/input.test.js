import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as core from '../core.js';
import * as rewards from '../rewards.js';
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
  const context=vm.createContext({...core,...rewards,hintFor,document,navigator:{},window:{addEventListener(){},scrollTo(){}},
    localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:fn=>fn(),matchMedia:()=>({matches:reduced}),
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
