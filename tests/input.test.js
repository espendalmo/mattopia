import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as core from '../core.js';
import * as rewards from '../rewards.js';
import * as plants from '../plants.js';
import * as breaks from '../breaks.js';
import * as profiles from '../profiles.js';
import {hintFor} from '../learning.js';

const source=(await fs.readFile(new URL('../app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
function harness({sound=true,reduced=false,channel=core.CHANNEL,hash='',stored=new Map(),roundFixture=!hash}={}){
  const events={},plays=[],animations=[],timers=[];
  const document={activeElement:null,querySelectorAll:()=>[],addEventListener:(name,fn)=>{events[name]=fn;}};
  const heading={focus(){document.activeElement=heading;}};
  const count={textContent:''},check={disabled:true};
  const root={innerHTML:'',querySelector:s=>s==='h1'?heading:s==='.focus-count'?count:s==='[data-action="focus-check"]'?check:null};
  const output={textContent:'',animate:(...args)=>animations.push(args)};
  const submit={disabled:true},erase={disabled:true,animate:(...args)=>animations.push(args)};
  const digits=Object.fromEntries(Array.from({length:10},(_,i)=>[i,{animate:(...args)=>animations.push(args)}]));
  document.querySelector=s=>s==='#app'?root:s==='#announcer'?{textContent:''}:s==='#input-value'?output:s==='[data-action="submit-number"]'?submit:s==='[data-action="erase"]'?erase:s.match(/^\[data-digit="([0-9])"\]$/)?digits[s.match(/[0-9]/)[0]]:null;
  const location={pathname:'/tallvenn-beta/',search:'',hash};
  const window={location,history:{replaceState(){location.hash='';}},addEventListener:(name,fn)=>{events[name]=fn;},scrollTo(){}};
  const context=vm.createContext({...core,CHANNEL:channel,...rewards,...plants,...breaks,...profiles,hintFor,document,navigator:{},window,
    localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},
    requestAnimationFrame:fn=>fn(),setTimeout:(fn, delay)=>timers.push({fn,delay}),matchMedia:()=>({matches:reduced}),
    createUpdater:()=>({}),createSoundPlayer:()=>({play:(...args)=>plays.push(args),unlock(){},stop(){}}),
  });
  const run=code=>vm.runInContext(code,context);run(source);
  if (roundFixture) run(`state.sound=${sound}; state.active=createRound(1,42,true); state.active.tasks[0].mode='input'; view='round'; render();`);
  function click(digit){const button={disabled:false,dataset:{digit},closest:s=>s==='[data-digit]'?button:null};events.click({target:button});}
  function key(value,mods={}){events.keydown({key:value,...mods,preventDefault(){},target:{closest:()=>null}});}
  return {run,click,key,events,plays,animations,timers,output,submit,erase,root,heading,document,count,check,location};
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
  assert.match(h.root.innerHTML, /buddy surprised/);
  assert.doesNotMatch(h.root.innerHTML, /data-action="retry"/);
  h.run("let retryModal; showDialog=(content, css) => { retryModal = {content,css}; };");
  assert.equal(h.timers[0].delay, 320);
  h.timers[0].fn();
  assert.equal(h.run('retryModal.css'), 'retry-sheet');
  assert.match(h.run('retryModal.content'), /data-action="retry" disabled/);
  h.run('retryAnswer(); submitAnswer(10);');
  assert.equal(h.run('state.active.attempts[0]'), 1);
  h.run('ui.retryUntil = 0; retryAnswer(); submitAnswer(10);');
  assert.equal(h.run('state.active.attempts[0]'), 2);
  assert.equal(h.run('state.active.solved'), true);
  assert.deepEqual(h.plays.map(([kind])=>kind), ['retry','recover']);
});

test('A pending memory game can be retried and completed without awarding another star', () => {
  const h = harness();
  h.run("state.active=null;state.roundsCompleted=3;state.focusBreaks=true;state.focusBreakPending=true; startRound();");
  assert.equal(h.run('view'), 'focus-break');
  assert.match(h.root.innerHTML, /Husk de fire bildene/);
  h.run("focusGame.phase='guess'; focusGame.selected=new Set([0,1,2,3]); if ([...focusGame.selected].every(i=>focusGame.study.includes(focusGame.choices[i]))) focusGame.selected=new Set([4,5,6,7]); checkFocusBreak();");
  assert.equal(h.run('focusGame.phase'), 'retry');
  assert.equal(h.run('state.focusBreakPending'), true);
  assert.match(h.root.innerHTML, /buddy surprised/);
  assert.doesNotMatch(h.root.innerHTML, /class="confetti"/);
  h.run("focusGame.phase='guess'; focusGame.selected=new Set(focusGame.study.map(item=>focusGame.choices.indexOf(item))); checkFocusBreak();");
  assert.equal(h.run('state.focusBreakPending'), false);
  assert.equal(h.run('state.roundsCompleted'), 3);
  assert.match(h.root.innerHTML, /Til oppgavene/);
  assert.match(h.root.innerHTML, /class="confetti"/);
  assert.deepEqual(h.plays,[['retry',true],['memory',true]]);
  h.run('render()');
  assert.doesNotMatch(h.root.innerHTML, /class="confetti"/);
});

test('Memory choices toggle without grading and stop after three checks', () => {
  const h = harness();
  h.run("state.active=null;state.focusBreakPending=true;startRound();focusGame.phase='guess';render();");
  assert.equal((h.root.innerHTML.match(/data-action="focus-answer"/g) || []).length, 8);
  assert.doesNotMatch(h.root.innerHTML, /focus-cards/);
  const pressed = [];
  const action = (action, choice) => {
    const button = {dataset:{action,choice},setAttribute:(key,value)=>pressed.push(value),closest:s=>s.includes('data-action')?button:null};
    h.events.click({target:button});
  };
  action('focus-answer',0);
  action('focus-answer',0);
  assert.deepEqual(pressed,['true','false']);
  assert.equal(h.check.disabled,true);
  const wrong = Array.from(h.run("focusGame.choices.map((item,i)=>focusGame.study.includes(item)?null:i).filter(i=>i!==null)"));
  for (let check = 1; check <= 3; check++) {
    wrong.forEach(i=>action('focus-answer',i));
    assert.equal(h.count.textContent,'4 av 4 valgt');
    assert.equal(h.run('focusGame.checks'),check-1);
    action('focus-check');
    if (check < 3) {
      assert.match(h.root.innerHTML,/Se bildene igjen/);
      action('focus-retry');
      action('focus-hide');
    }
  }
  assert.equal(h.run('focusGame.checks'),3);
  assert.equal(h.run('state.focusBreakPending'),false);
  assert.match(h.root.innerHTML,/Til oppgavene/);
  assert.doesNotMatch(h.root.innerHTML,/Se bildene igjen/);
  assert.deepEqual(h.plays,[['retry',true],['retry',true]]);
});

test('The scheduled brick game hides colors and checks a complete arrangement together', () => {
  const h = harness();
  h.run("state.active=null;state.roundsCompleted=6;state.focusBreakPending=true;startRound();");
  assert.match(h.root.innerHTML,/Husk klossebygget/);
  assert.match(h.root.innerHTML,/class="puzzle-brick ".*--brick:/);
  h.run("focusGame.phase='guess';render();checkFocusBreak();");
  assert.equal(h.run('focusGame.checks'),0);
  assert.equal((h.root.innerHTML.match(/class="puzzle-brick puzzle-shadow"/g) || []).length,4);
  h.run("for (let i=0;i<4;i++) placeBrick(focusGame.colors[(i+1)%4],i);");
  assert.equal(h.run('focusGame.checks'),0);
  assert.deepEqual(h.plays,[]);
  h.run("checkFocusBreak();");
  assert.match(h.root.innerHTML,/0 av 4 på riktig plass/);
  h.run("retryBreak(focusGame); focusGame.phase='guess'; for (let i=0;i<4;i++) placeBrick(focusGame.colors[i],i); checkFocusBreak();");
  assert.match(h.root.innerHTML,/Du bygde den!/);
  assert.match(h.root.innerHTML,/class="confetti"/);
  assert.equal(h.run('state.roundsCompleted'),6);
  assert.equal(h.run('state.focusBreakPending'),false);
});

test('The floor break uses an empty or partially laid grid and respects reduced motion and mute', () => {
  const h = harness({sound:false,reduced:true});
  h.run("state.active=null;state.roundsCompleted=9;state.focusBreakPending=true;startRound();");
  assert.equal(h.run('focusGame.kind'),'floor');
  assert.match(h.root.innerHTML,/Sjekk svaret/);
  h.run("focusGame.selected=focusGame.choices.find(n=>n!==focusGame.answer); checkFocusBreak();");
  assert.match(h.root.innerHTML,/Prøv igjen/);
  h.run("retryBreak(focusGame); focusGame.selected=focusGame.answer; checkFocusBreak();");
  assert.match(h.root.innerHTML,/Gulvet er ferdig!/);
  assert.match(h.root.innerHTML,/floor-new/);
  assert.doesNotMatch(h.root.innerHTML,/class="confetti"/);
  assert.deepEqual(h.plays,[['retry',false],['memory',false]]);
});

test('Beta links open each break directly and are absent from the regular app', () => {
  const links = {memory:'#pauselek=kims-lek',build:'#pauselek=klossebygget',floor:'#pauselek=klossegulvet'};
  for (const [kind, hash] of Object.entries(links)) {
    const beta = harness({channel:'preview',hash});
    assert.equal(beta.run('view'),'focus-break');
    assert.equal(beta.run('focusGame.kind'),kind);
    assert.match(beta.root.innerHTML,/Test av pauselek/);
    assert.equal(beta.run('state.focusBreaks'),false);
    assert.equal(beta.run('state.active'),null);
  }
  const regular = harness({channel:'stable',hash:links.memory});
  assert.equal(regular.run('view'),'onboarding');
  assert.equal(regular.events.hashchange,undefined);
  regular.run('let adultHtml; showDialog=html=>{adultHtml=html}; adultView();');
  assert.doesNotMatch(regular.run('adultHtml'),/Test pauseleker|#pauselek=/);
});

test('Completing a beta test keeps the scheduled break and its selections in place', () => {
  const h = harness({channel:'preview'});
  h.run(`state.active=null; state.roundsCompleted=3; state.focusBreaks=true;
    state.focusBreakPending=true; startRound(); focusGame.phase='guess'; focusGame.selected.add(1);
    const scheduled = focusGame;
    let adultHtml; showDialog=html=>{adultHtml=html};`);
  h.location.hash='#pauselek=klossegulvet';
  h.events.hashchange();
  h.run('focusGame.selected=focusGame.answer; checkFocusBreak();');
  assert.match(h.root.innerHTML,/Til testlenkene/);
  assert.equal(h.run('state.focusBreakPending'),true);
  assert.equal(h.run('state.roundsCompleted'),3);
  assert.equal(h.run('state.active'),null);
  h.run('exitTestBreak();');
  assert.equal(h.location.hash,'');
  assert.equal(h.run('focusGame === scheduled && scheduled.selected.has(1)'),true);
  assert.match(h.run('adultHtml'),/Test pauseleker/);
  assert.match(h.run('adultHtml'),/#pauselek=kims-lek/);
});

test('First setup imports existing practice and later profiles get independent settings and progress', () => {
  const round = core.createRound(2, 70);
  const active = core.advanceRound(core.answerRound(round, round.tasks[0].answer));
  let legacy = rewards.selectRewardMode({...core.freshState(), level:2, roundsCompleted:4, active}, 'bricks', () => .3);
  legacy = rewards.awardPractice(legacy, 'legacy-round').state;
  const stored = new Map([[core.STORAGE_KEY, JSON.stringify(legacy)]]);
  const h = harness({stored,roundFixture:false});
  assert.match(h.root.innerHTML, /Øvingen du har fra før, følger med/);
  h.run(`submitProfile('first',{name:'  Ada  ',grade:'3',avatar:'fox'});`);
  assert.match(h.root.innerHTML,/Ada/);
  assert.equal(h.run('state.active.id'),active.id);
  assert.equal(h.run('state.active.index'),1);
  assert.equal(h.run('state.brickBuild.pieces'),1);
  assert.equal(h.run('profile.grade'),3);
  assert.equal(h.run('state.level'),2);
  h.run(`const firstId=profile.id; submitProfile('new',{name:'<Lillebror>',grade:'1',avatar:'frog'});`);
  assert.match(h.root.innerHTML,/&lt;Lillebror&gt;/);
  assert.doesNotMatch(h.root.innerHTML,/<Lillebror>/);
  assert.equal(h.run('state.roundsCompleted'),0);
  assert.equal(h.run('state.active'),null);
  h.run(`state.level=4; save(); submitProfile('edit',{name:'Leo',grade:'2',avatar:'owl'}); selectProfile(firstId);`);
  assert.equal(h.run('state.active.id'),active.id);
  assert.equal(h.run('state.roundsCompleted'),4);
  assert.equal(h.run('state.level'),2);
  const reopened = harness({stored,roundFixture:false});
  assert.match(reopened.root.innerHTML,/Ada/);
  assert.equal(reopened.run('state.active.index'),1);
  reopened.run(`selectProfile(profileStore.profiles.find(item=>item.name==='Leo').id);`);
  assert.equal(reopened.run('profile.grade'),2);
  assert.equal(reopened.run('state.level'),4);
  assert.equal(reopened.run('state.roundsCompleted'),0);
  assert.equal(JSON.parse(stored.get(core.STORAGE_KEY)).roundsCompleted,4);
});

test('The welcome appears once after a longer break and leaves a round in place', () => {
  const h = harness();
  h.run("let welcome=[]; showDialog=(content,css)=>welcome.push({content,css});");
  h.run("localStorage.setItem(AWAY_KEY, Date.now()-1000); welcomeBack();");
  assert.equal(h.run('welcome.length'),0);
  h.run("localStorage.setItem(AWAY_KEY, Date.now()-WELCOME_AFTER-1000); welcomeBack(); welcomeBack();");
  assert.equal(h.run('welcome.length'),1);
  assert.match(h.run('welcome[0].content'),/Hei igjen![\s\S]*Fortsett runden/);
  assert.equal(h.run('view'),'round');
  assert.equal(h.run('state.active.index'),0);
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
