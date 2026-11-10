import {taskSuccessStep} from '../sound.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as core from '../core.js';
import * as rewards from '../rewards.js';
import * as plants from '../plants.js';
import * as breaks from '../breaks.js';
import * as profiles from '../profiles.js';
import * as curriculum from '../curriculum.js';
import * as projects from '../projects.js';
import * as worlds from '../worlds.js';
import {hintFor} from '../learning.js';
import {rewardIllustration} from '../illustrations.js';
import {seasonForDate,seasonMark} from '../seasons.js';
import {PRODUCTION_PATH} from '../update.js';

const source=(await fs.readFile(new URL('../app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
function harness({sound=true,reduced=false,channel=core.CHANNEL,hash='',stored=new Map(),roundFixture=!hash,navigator={}}={}){
  const events={},plays=[],builds=[],buildingSounds=[],animations=[],timers=[];
  const document={activeElement:null,querySelectorAll:()=>[],addEventListener:(name,fn)=>{events[name]=fn;},
    removeEventListener:(name,fn)=>{if(events[name]===fn) delete events[name];}};
  const heading={focus(){document.activeElement=heading;}};
  const count={textContent:''},check={disabled:true};
  const root={innerHTML:'',
    querySelector:s=>s==='h1'?heading:s==='.focus-count'?count:s==='[data-action="focus-check"]'?check:null};
  const output={textContent:'',animate:(...args)=>animations.push(args)};
  const submit={disabled:true},erase={disabled:true,animate:(...args)=>animations.push(args)};
  const digits=Object.fromEntries(Array.from({length:10},(_,i)=>[i,{animate:(...args)=>animations.push(args)}]));
  document.querySelector=s=>s==='#app'?root:s==='#announcer'?{textContent:''}:s==='#input-value'?output:s==='[data-action="submit-number"]'?submit:s==='[data-action="erase"]'?erase:s.match(/^\[data-digit="([0-9])"\]$/)?digits[s.match(/[0-9]/)[0]]:null;
  const location={pathname:'/mattopia-beta/',search:'',hash};
  const window={location,history:{replaceState(){location.hash='';}},addEventListener:(name,fn)=>{events[name]=fn;},scrollTo(){}};
  const context=vm.createContext({...core,CHANNEL:channel,...rewards,...plants,...breaks,...profiles,...curriculum,...projects,...worlds,taskSuccessStep,mountProjectView:()=>()=>{},hintFor,rewardIllustration,seasonForDate,seasonMark,PRODUCTION_PATH,document,navigator,window,
    localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},
    requestAnimationFrame:fn=>fn(),setTimeout:(fn, delay)=>timers.push({fn,delay}),clearTimeout:id=>{if(timers[id-1]) timers[id-1].cancelled=true;},matchMedia:()=>({matches:reduced}),
    createUpdater:()=>({}),createSoundPlayer:()=>({
      play:(...args)=>plays.push(args),playBuild:(...args)=>builds.push(args),playBuilding:(...args)=>buildingSounds.push(args),stopAmbience(){},stopBuild(){},resume(){},stop(){},
    }),
  });
  const run=code=>vm.runInContext(code,context);run(source);
  if (roundFixture) run(`state.sound=${sound}; state.active=createRound(1,42,true); state.active.tasks[0].mode='input'; view='round'; render();`);
  function click(digit){const button={disabled:false,dataset:{digit},closest:s=>s==='[data-digit]'?button:null};events.click({target:button});}
  function key(value,mods={}){events.keydown({key:value,...mods,preventDefault(){},target:{closest:()=>null}});}
  return {run,click,key,events,plays,builds,buildingSounds,animations,timers,output,submit,erase,root,heading,document,count,check,location};
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
  assert.deepEqual(h.plays.map(([kind])=>kind), ['retry','task-success-0']);
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
  assert.deepEqual(h.plays,[['open',true],['retry',true],['memory',true]]);
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
  assert.deepEqual(h.plays.filter(([kind])=>kind==='retry'),[['retry',true],['retry',true]]);
  assert.equal(h.plays.filter(([kind])=>kind==='select').length,14);
});

test('The scheduled brick game hides colors and checks a complete arrangement together', () => {
  const h = harness();
  h.run("state.active=null;state.roundsCompleted=6;state.focusBreakPending=true;startRound();");
  assert.match(h.root.innerHTML,/Husk klossebygget/);
  assert.match(h.root.innerHTML,/class="puzzle-brick"[\s\S]*?class="brick-top"/);
  h.run("focusGame.phase='guess';render();checkFocusBreak();");
  assert.equal(h.run('focusGame.checks'),0);
  assert.equal((h.root.innerHTML.match(/class="puzzle-brick puzzle-shadow"/g) || []).length,4);
  h.run("for (let i=0;i<4;i++) placeBrick(focusGame.colors[(i+1)%4],i);");
  assert.equal(h.run('focusGame.checks'),0);
  assert.deepEqual(h.plays,[['open',true],...Array.from({length:4},()=>['build',true])]);
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
  assert.deepEqual(h.plays,[['open',false],['retry',false],['memory',false]]);
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
  h.run(`state.level=1; save(); submitProfile('edit',{name:'Leo',grade:'2',avatar:'owl'}); selectProfile(firstId);`);
  assert.equal(h.run('state.active.id'),active.id);
  assert.equal(h.run('state.roundsCompleted'),4);
  assert.equal(h.run('state.level'),2);
  const reopened = harness({stored,roundFixture:false});
  assert.match(reopened.root.innerHTML,/Ada/);
  assert.equal(reopened.run('state.active.index'),1);
  reopened.run(`selectProfile(profileStore.profiles.find(item=>item.name==='Leo').id);`);
  assert.equal(reopened.run('profile.grade'),2);
  assert.equal(reopened.run('state.level'),1);
  assert.equal(reopened.run('state.roundsCompleted'),0);
  assert.equal(JSON.parse(stored.get(core.STORAGE_KEY)).roundsCompleted,4);
});

test('Changing a grade filters future tracks and preserves the ongoing round', () => {
  const h = harness();
  h.run(`submitProfile('first',{name:'Ada',grade:'3'}); state.active=createRound(2,15); const oldRound=state.active;
    submitProfile('edit',{name:'Ada',grade:'9'});
    let menu; showDialog=html=>{menu=html}; adultView();`);
  assert.equal(h.run('state.level'),91);
  assert.equal(h.run('state.active === oldRound'),true);
  assert.match(h.run('menu'),/Øving på 9\. trinn/);
  assert.match(h.run('menu'),/Trekanter og romfigurer/);
  assert.doesNotMatch(h.run('menu'),/Tall til 20/);
});

test('Wizard preferences apply to the new profile and the next round', () => {
  const h=harness({roundFixture:false});
  h.run(`submitProfile('first',{name:'Ada',grade:3,avatar:'fox'},
    {level:3,autoProgress:true,roundLength:5,rewardMode:'moon'});
    const original=profile.id;
    submitProfile('new',{name:'Sam',grade:8},{level:82,autoProgress:false,roundLength:6,rewardMode:'plant'});
    startRound();`);
  assert.equal(h.run('state.active.tasks.length'),6);
  assert.equal(h.run('state.active.level'),82);
  h.run('selectProfile(original);');
  assert.equal(h.run('state.roundLength'),5);
  assert.equal(h.run('state.autoProgress'),true);
  assert.equal(h.run('state.level'),3);
  assert.equal(h.run('state.rewardMode'),'moon');
  assert.ok(h.run("currentWorld(state,'moon')"));
});

test('The wizard offers new and original avatars and an illustrated card for every reward', () => {
  const h=harness({roundFixture:false});
  const profileStep=h.run(`profileFields({name:'Sam',grade:10,avatar:'skateboard'})`);
  assert.match(profileStep,/Dyr og figurer/);
  assert.match(profileStep,/Interesser og symboler/);
  assert.match(profileStep,/name="avatar" value="fox"/);
  assert.match(profileStep,/name="avatar" value="skateboard" checked/);
  assert.equal((profileStep.match(/name="avatar"/g)??[]).length,24);
  h.run(`submitProfile('first',{name:'Sam',grade:10,avatar:'skateboard'})`);
  assert.equal(h.run('profile.avatar'),'skateboard');
  const rewardStep=h.run(`setupForm({...makeSetup('new'),step:2,rewardMode:'moon'})`);
  const expected=['plant','bricks',...Object.keys(projects.PROJECTS)];
  const images=rewardStep.match(/<svg viewBox="0 0 160 88"[^]*?<\/svg>/g)??[];
  assert.equal(images.length,expected.length);
  assert.equal(new Set(images).size,expected.length);
  assert.ok(images.every(image=>image.includes('<path')&&!image.includes('undefined')));
  assert.match(rewardStep,/<small>Bygg en rød og gyllen helt med lys i brystet\.<\/small>/);
  assert.match(rewardStep,/<small>Bygg et feriested med strand,/);
  assert.match(rewardStep,/name="reward" value="moon" class="sr-only" checked/);
});

test('Beta can discard a round without awarding progress and only Beta can reset projects', () => {
  for (const channel of ['preview','stable']) {
    const h=harness({channel});
    h.run(`submitProfile('first',{name:'Ada',grade:3}); state.roundsCompleted=24;
      state=selectRewardMode(state,'city',()=>.27);
      state=replaceCurrentWorld(state,'city',worldAdvance(currentWorld(state,'city')));
      state.projects.armor=12; state.active=createRound(state.level,123); view='round';
      const originalSeed=currentWorld(state,'city').seed;
      let markup; showDialog=html=>{markup=html}; showPause();`);
    assert.equal(h.run('markup.includes("Avbryt runden")'),channel==='preview');
    const abort={dataset:{action:'beta-confirm-abort'},closest:selector=>selector==='[data-action]'?abort:null};
    h.events.click({target:abort});
    assert.equal(h.run('state.active===null'),channel==='preview');
    assert.equal(h.run('state.roundsCompleted'),24);
    assert.equal(h.run("worldStatus(currentWorld(state,'city')).completed"),1);
    h.run("state.active=createRound(state.level,124); resetBetaProject('armor');");
    assert.equal(h.run('state.projects.armor'),channel==='preview'?0:12);
    assert.ok(h.run('state.active'));
    h.run("resetBetaProject('city');");
    assert.equal(h.run("worldStatus(currentWorld(state,'city')).completed"),channel==='preview'?0:1);
    assert.equal(h.run("currentWorld(state,'city').seed!==originalSeed"),channel==='preview');
    assert.equal(h.run('state.active===null'),channel==='preview');
    assert.equal(h.run('state.roundsCompleted'),24);
  }
});

test('Place value shows the blocks before the expanded number appears as a hint', () => {
  const h = harness();
  h.run(`state.active=createRound(2, 42); const place=state.active.tasks.find(task=>task.type==='place');
    state.active.tasks[0]={...place,n:41,answer:41,choices:[40,41,51]}; renderRound();`);
  assert.match(h.root.innerHTML, /id="visual-caption">Hvor mye er brikkene verdt til sammen\?/);
  assert.doesNotMatch(h.root.innerHTML, /id="visual-caption">4 tiere og 1 ener/);
  h.run('state.active=noteHelp(noteHelp(state.active)); renderRound();');
  assert.match(h.root.innerHTML, /id="visual-caption">4 tiere og 1 ener/);
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

test('Shorter rounds show their actual length and add exactly one building stage', () => {
  for (const length of [5, 6]) {
    const h = harness();
    h.run(`state=selectRewardMode(state,'city',()=>.3); state.roundLength=${length}; state.active=null;
      const map=currentWorld(state,'city'); state=replaceCurrentWorld(state,'city',worldSelect(map,worldBuildingOptions('city',map)[1])); startRound();`);
    assert.match(h.root.innerHTML, new RegExp(`Oppgave 1 av ${length}`));
    h.run(`state.roundLength=8;
      for (let index = 0; index < ${length}; index++) {
        state.active = answerRound(state.active, state.active.tasks[index].answer);
        if (index < ${length} - 1) state.active = advanceRound(state.active);
      }
      state=restoreState(state); render();`);
    assert.match(h.root.innerHTML, new RegExp(`Oppgave ${length} av ${length}`));
    assert.match(h.root.innerHTML, /Fullfør runden/);
    const next = { dataset:{action:'next'}, closest:selector => selector === '[data-action]' ? next : null };
    h.events.click({target:next});
    h.events.click({target:next});
    assert.equal(h.run("worldStatus(currentWorld(state,'city')).completed"), 1);
    assert.equal(h.run('restoreState(state).history.at(-1).length'), length);
    assert.match(h.root.innerHTML, new RegExp(`aria-label="${length} oppgaver fullført"`));
    assert.match(h.root.innerHTML, /Nytt byggesteg · 1 av 90/);
    assert.match(h.root.innerHTML, /data-reveal/);
    assert.match(h.root.innerHTML, /data-project-latest>Vis igjen/);
    h.run('startRound()');
    assert.match(h.root.innerHTML, /Oppgave 1 av 8/);
  }
});

test('Vibration is optional and independent of sound', () => {
  const pulses=[];
  const h=harness({sound:false,navigator:{vibrate:pulse=>pulses.push(pulse)}});
  h.run('submitAnswer(state.active.tasks[0].answer);');
  assert.deepEqual(pulses,[16]);
  h.run('state.haptics=false; feedback("finish", [18,55,25]);');
  assert.deepEqual(pulses,[16]);
  assert.equal(h.run('restoreState(state).haptics'),false);
});

test('Finishing a building uses the landmark fanfare and confetti', () => {
  const h=harness();
  h.run(`state.rewardMode='city'; state.roundsCompleted=5; state.projects.city=5;
    while (state.active.index < state.active.tasks.length-1) {
      state.active=advanceRound(answerRound(state.active,state.active.tasks[state.active.index].answer));
    }
    state.active=answerRound(state.active,state.active.tasks.at(-1).answer);`);
  const next = {dataset:{action:'next'},closest:selector=>selector==='[data-action]'?next:null};
  h.events.click({target:next});
  assert.match(h.root.innerHTML,/Ferdig på kartet · 6 av 51/);
  assert.match(h.root.innerHTML,/Bakeriet er på plass!/);
  assert.match(h.root.innerHTML,/landmark-confetti/);
  assert.equal(h.builds.at(-1)[0].finished,'Bakeriet');
  assert.equal(h.builds.at(-1)[1],true);
  assert.equal(h.builds.at(-1)[2].finale,false);
});

test('Finishing a whole project announces it and links to the matching collection entry', () => {
  for (const id of ['armor','city']) {
    const h=harness();
    h.run(`state.rewardMode='${id}'; state.focusBreaks=false;
      state.roundsCompleted=${id==='armor'?23:71};
      state.projects.armor=23;
      state=replaceCurrentWorld(state,'city',{...freshWorld(()=>.21),catalog:2,order:Array.from({length:24},(_,i)=>i+9),progress:71});
      while(state.active.index<state.active.tasks.length-1)
        state.active=advanceRound(answerRound(state.active,state.active.tasks[state.active.index].answer));
      state.active=answerRound(state.active,state.active.tasks.at(-1).answer);`);
    const next={dataset:{action:'next'},closest:selector=>selector==='[data-action]'?next:null};
    h.events.click({target:next});
    const name=projects.PROJECTS[id].name;
    assert.match(h.root.innerHTML,new RegExp(`<h1 tabindex="-1">${name} er ferdig!</h1>`));
    assert.match(h.root.innerHTML,new RegExp(`data-action="collection" data-project="${id}"`));
    assert.match(h.root.innerHTML,/class="eplo-note eplo-finale"/);
    assert.equal(h.builds.at(-1)[2].finale,true);
    if (id==='armor') assert.equal(h.run('collectedHeroes().includes("armor")'),true);
    else {
      assert.match(h.root.innerHTML,/data-project="city" data-map="0">Se kartet i samlingen/);
      assert.match(h.run('galleryMapsMarkup(collectedMaps(), {project:"city",map:"0"})'),/Fullført kart · 24 ferdige bygg/);
    }
  }
});

test('Eplo greets a named player, describes progress and changes the pause encouragement',()=>{
  const h=harness();
  h.run(`submitProfile('first',{name:'Ada & Sam',grade:3});
    let pauseMarkup;
    showDialog=html=>{ pauseMarkup=html; };
    state.plantRounds=10;
    showPause();`);
  const plants=h.run('pauseMarkup');
  assert.match(plants,/Hei igjen, Ada &amp; Sam! Du har dyrket 2 planter!/);
  assert.match(plants,/Fortsett runden/);
  h.run('showPause();');
  assert.notEqual(h.run('pauseMarkup'),plants);
  h.run(`profile.name='Spiller 1';
    state=selectRewardMode(state,'bricks',()=>.42);
    state.brickBuild.completed=1;
    showPause();`);
  assert.match(h.run('pauseMarkup'),/Hei igjen! Du har bygd én klossefigur!/);
  h.run(`state=selectRewardMode(state,'city',()=>.38);
    state=replaceCurrentWorld(state,'city',{...currentWorld(state,'city'),order:[0,3],progress:4});
    showPause();`);
  assert.match(h.run('pauseMarkup'),/1 av 30 bygg\. Neste steg er på Fotballbanen/);
  assert.match(h.run('pauseMarkup'),/data-project-preview="city"/);
});

test('An empty map invites the first build and defaults to five exercises',()=>{
  const h=harness();
  h.run(`submitProfile('first',{name:'Ada',grade:3});
    state=selectRewardMode({...freshState()},'city',()=>.3);
    render();`);
  assert.match(h.root.innerHTML,/Klar for å komme i gang/);
  assert.match(h.root.innerHTML,/Velg første bygg/);
  assert.match(h.root.innerHTML,/5 oppgaver venter/);
});

test('The returning player is greeted by name in a dismissible bubble on the map',()=>{
  const h=harness();
  h.run(`submitProfile('first',{name:'Ada',grade:3});
    state=selectRewardMode(state,'city',()=>.4);
    let welcome;
    showDialog=(content)=>welcome=content;
    localStorage.setItem(AWAY_KEY+'-'+profile.id,Date.now()-WELCOME_AFTER-1000);
    welcomeBack();`);
  const html=h.run('welcome');
  assert.match(html,/Velkommen tilbake/);
  assert.match(html,/eplo-bubble[\s\S]*Hei igjen, Ada!/);
  assert.match(html,/data-action="dismiss-eplo"/);
});

test('The building dropdown moves the camera and both selection methods play building sounds',()=>{
  const h=harness();
  const result=h.run(`
    const focusCalls=[];
    const choices={value:'',parentElement:{},addEventListener(name,fn){this[name]=fn;}};
    const nodes=new Map();
    const card={querySelector(key){
      if (!nodes.has(key)) nodes.set(key,{addEventListener(){}});
      return nodes.get(key);
    }};
    const viewer={querySelector(key){return key==='[data-map-inspect]'?choices:key==='[data-map-info]'?card:null;}};
    let mapTap;
    mountProjectView=(_viewer,_scene,_interactive,options)=>{
      mapTap=options.onInspect;
      const release=()=>{};
      release.inspect=(index,options)=>focusCalls.push([index,options.focus]);
      return release;
    };
    showDialog=(_html,_class,open)=>open({
      querySelector:key=>key==='.project-viewer'?viewer:null,
      addEventListener(){},
    });
    state=replaceCurrentWorld(state,'city',{...freshWorld(()=>.8),order:[0,3],progress:6});
    showProject('city');
    choices.value='3';
    choices.change();
    mapTap(0);
    JSON.stringify(focusCalls);
  `);
  assert.deepEqual(JSON.parse(result),[[3,true],[0,false]]);
  assert.equal(h.plays.filter(([kind])=>kind==='select').length,2);
  assert.deepEqual(h.buildingSounds,[['city',3,'field',true],['city',0,'house',true]]);
});

test('Eplo celebrates a perfect round on the last task, before opening the reward',()=>{
  for (const [wrong,reduced] of [[false,false],[true,false],[false,true]]) {
    const h=harness({reduced});
    const message={textContent:'Se hva du fikk til!'};
    const sparks={innerHTML:'',replaceChildren(){this.innerHTML='';}};
    const classes=new Set();
    const companion={querySelector:selector=>selector==='.companion-message'?message:sparks,
      classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}};
    const query=h.root.querySelector;
    h.root.querySelector=selector=>selector==='.companion-strip'?companion:query(selector);
    h.run(`
      for (let i=0;i<state.active.tasks.length-1;i++) {
        const correct=state.active.tasks[i].answer;
        if (${wrong}&&i===0) state.active=answerRound(state.active,correct+1);
        state.active=answerRound(state.active,correct);
        state.active=advanceRound(state.active);
      }
      submitAnswer(state.active.tasks[state.active.index].answer);
    `);
    assert.equal(h.run('view'),'round');
    assert.match(h.root.innerHTML,/class="companion-message"/);
    assert.equal(message.textContent==='Perfekt runde!',!wrong);
    assert.equal(classes.has('perfect-round'),!wrong);
    assert.equal((sparks.innerHTML.match(/<i /g)||[]).length,wrong||reduced?0:10);
    const dismiss=h.timers.find(timer=>timer.delay===3500);
    assert.equal(Boolean(dismiss),!wrong);
    dismiss?.fn();
    assert.equal(message.textContent,'Se hva du fikk til!');
    assert.equal(classes.has('perfect-round'),false);
    assert.equal(sparks.innerHTML,'');
    const next={dataset:{action:'next'},closest:selector=>selector==='[data-action]'?next:null};
    h.events.click({target:next});
    assert.equal(h.run('view'),'complete');
    assert.doesNotMatch(h.root.innerHTML,/Perfekt runde!/);
  }
});

test('Idle home surprises rotate, puff away on touch, and stop when leaving home',()=>{
  const h=harness();
  const stage={hidden:true,dataset:{},replaceChildren(){this.innerHTML='';}};
  const query=h.root.querySelector;
  h.root.querySelector=selector=>selector==='[data-home-surprise]'?stage:query(selector);
  h.run("view='home'; render();");
  assert.match(h.root.innerHTML,/data-home-surprise aria-hidden="true" hidden/);
  assert.match(h.run('homeSurpriseProps.winter'),/winter-gear/);
  assert.match(h.run('homeSurpriseProps.yawn'),/yawn-breath/);
  assert.match(h.run('homeSurpriseProps.book'),/eplo-book/);
  const runTimer=delay=>h.timers.findLast(timer=>timer.delay===delay&&!timer.cancelled).fn();
  runTimer(12000);
  assert.equal(stage.hidden,false);
  const first=stage.dataset.act;
  h.events.pointerdown();
  assert.equal(stage.dataset.act,'puff');
  assert.match(stage.innerHTML,/class="eplo-puff"/);
  runTimer(420);
  assert.equal(stage.hidden,true);
  runTimer(12000);
  assert.notEqual(stage.dataset.act,first);
  h.run("view='round'; render();");
  assert.equal(h.events.pointerdown,undefined);
  assert.equal(h.timers.at(-1).cancelled,true);
});
