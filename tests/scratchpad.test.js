import test from 'node:test';
import assert from 'node:assert/strict';
import {createRound, answerRound, noteHelp, continueRetry, advanceRound, restoreState, freshState} from '../core.js';
import {mountScratchpad, restoreScratchpad} from '../scratchpad.js';

const savedDrawing = {width:320, height:380, strokes:[[20,30,40,60], [90,80]]};

test('Earlier profiles get the scratchpad by default and each profile can store it disabled', () => {
  assert.equal(freshState().scratchpadEnabled,true);
  assert.equal(restoreState({version:1}).scratchpadEnabled,true);
  assert.equal(restoreState({version:1,scratchpadEnabled:false}).scratchpadEnabled,false);
});

test('A drawing survives hints, typing retries and resuming the same question', () => {
  let round = createRound(1,42,true);
  round.scratchpad = savedDrawing;
  const original = round.tasks[0];
  const wrong = original.choices.find(value => value !== original.answer);
  round = continueRetry(answerRound(noteHelp(round),wrong));
  const restored = restoreState(JSON.parse(JSON.stringify({...freshState(),active:round}))).active;
  assert.equal(restored.index,0);
  assert.equal(restored.tasks[0].mode,'input');
  assert.deepEqual(restored.scratchpad,savedDrawing);
  assert.equal(advanceRound(restored),restored);
  const next = advanceRound(answerRound(restored,original.answer));
  assert.equal(next.index,1);
  assert.equal(next.scratchpad,undefined);
  assert.deepEqual(round.scratchpad,savedDrawing);
});

test('A replacement question opens with a blank sheet and a malformed drawing leaves practice resumable', () => {
  const round = createRound(51,42);
  round.scratchpad = savedDrawing;
  const original = round.tasks[0];
  const wrong = original.choices.find(value => value !== original.answer);
  const replacement = continueRetry(answerRound(round,wrong));
  assert.equal(replacement.index,round.index);
  assert.notEqual(replacement.tasks[0],original);
  assert.equal(replacement.scratchpad,undefined);
  const invalid = {...savedDrawing,strokes:[[321,100], [40]]};
  assert.equal(restoreScratchpad(invalid),null);
  const restored = restoreState({...freshState(),active:{...round,scratchpad:invalid}}).active;
  assert.deepEqual(restored.tasks,round.tasks);
  assert.equal(restored.scratchpad,undefined);
});

test('Drawing captures one contact, keeps the grid and ink in proportion when resized, and supports undo and clear', t => {
  const paper = {clientWidth:300,clientHeight:400};
  const painted = [];
  const canvas = Object.assign(new EventTarget(), {
    parentElement:paper,
    style:{setProperty(key,value){this[key]=value;}},
    getContext:() => ({beginPath(){}, moveTo(){}, lineTo(...args){painted.push(['to',...args]);},
      quadraticCurveTo(...args){painted.push(['curve',...args]);}, stroke(){painted.push('line');},
      arc(){}, fill(){painted.push('dot');}, setTransform(){}}),
    getBoundingClientRect(){return {left:12,top:25,width:parseFloat(this.style.width),height:parseFloat(this.style.height)};},
    setPointerCapture(id){this.captured=id;},
  });
  const undo = Object.assign(new EventTarget(),{disabled:false});
  const clear = Object.assign(new EventTarget(),{disabled:false});
  const dialog = {querySelector:selector => ({canvas,'[data-scratchpad-undo]':undo,'[data-scratchpad-clear]':clear})[selector]};
  const commits=[];
  let observer;
  const original = Object.getOwnPropertyDescriptor(globalThis,'ResizeObserver');
  const originalDensity = Object.getOwnPropertyDescriptor(globalThis,'devicePixelRatio');
  const observerClass = class {
    constructor(resize){this.resize=resize;observer=this;}
    observe(){}
    disconnect(){this.disconnected=true;}
  };
  Object.defineProperty(globalThis,'ResizeObserver',{value:observerClass,configurable:true});
  Object.defineProperty(globalThis,'devicePixelRatio',{value:2,configurable:true});
  t.after(() => {
    if (original) Object.defineProperty(globalThis,'ResizeObserver',original);
    else delete globalThis.ResizeObserver;
    if (originalDensity) Object.defineProperty(globalThis,'devicePixelRatio',originalDensity);
    else delete globalThis.devicePixelRatio;
  });
  const send = (type, id, x, y, pointerType='touch', extra={}) => canvas.dispatchEvent(Object.assign(new Event(type), {
    pointerId:id, pointerType, button:0, clientX:x+12, clientY:y+25,
  },extra));
  const dispose=mountScratchpad(dialog,null,draft=>commits.push(draft));
  assert.ok(undo.disabled && clear.disabled);
  assert.equal(canvas.style['--grid-size'],'24px');
  assert.equal(canvas.width,900);
  assert.equal(canvas.height,1200);
  send('pointerdown',11,50.25,60.5);
  assert.equal(canvas.captured,11);
  send('pointerdown',12,170,170);
  send('pointermove',12,170,190);
  send('pointermove',11,82.5,93.75,'touch',{
    getCoalescedEvents:()=>[{clientX:74.25,clientY:95.5},{clientX:94.5,clientY:118.75}]
  });
  assert.equal(commits.length,0);
  send('pointerup',11,110.25,150);
  send('lostpointercapture',11,110.25,150);
  assert.deepEqual(commits,[{width:300,height:400,strokes:[[50.25,60.5,62.25,70.5,82.5,93.75,110.25,150]]}]);
  assert.deepEqual(restoreScratchpad(JSON.parse(JSON.stringify(commits[0]))),commits[0]);
  assert.ok(!undo.disabled && !clear.disabled);
  assert.deepEqual(painted.find(command=>command[0]==='curve'),['curve',62.25,70.5,72.375,82.125]);
  assert.deepEqual(painted.at(-2),['to',110.25,150]);
  Object.assign(paper,{clientWidth:450,clientHeight:200});
  observer.resize();
  assert.equal(canvas.style.width,'150px');
  assert.equal(canvas.style.height,'200px');
  assert.equal(canvas.style['--grid-size'],'12px');
  assert.equal(canvas.width,450);
  assert.equal(canvas.height,600);
  send('pointerdown',13,10,20,'pen');
  send('pointerup',13,10,20,'pen');
  assert.deepEqual(commits.at(-1).strokes.at(-1),[20,40]);
  assert.ok(painted.includes('dot'));
  undo.dispatchEvent(new Event('click'));
  assert.equal(commits.at(-1).strokes.length,1);
  clear.dispatchEvent(new Event('click'));
  assert.equal(commits.at(-1),null);
  assert.equal(canvas.style.width,'450px');
  assert.ok(undo.disabled && clear.disabled);
  dispose();
  assert.equal(observer.disconnected,true);
});
