import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoundPlayer,SOUND_PATTERNS} from '../sound.js';
import {createUpdater} from '../update.js';

test('Sound off creates no audio context; rapid new feedback replaces previous notes',async()=>{
  let created=0,stopped=0,started=0;
  const context={currentTime:0,resume:()=>Promise.resolve(),destination:{},createOscillator:()=>({frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){started++;},stop(){stopped++;}}),createGain:()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}})};
  const p=createSoundPlayer(()=>{created++;return context;});p.play('success',false);assert.equal(created,0);
  p.play('success');await Promise.resolve();assert.equal(started,SOUND_PATTERNS.success.length);const previous=stopped;
  p.play('retry');await Promise.resolve();assert.ok(stopped>previous);assert.equal(started,SOUND_PATTERNS.success.length+SOUND_PATTERNS.retry.length);p.stop();
});
test('The encouraging retry melody and completion fanfare are distinct and bounded',()=>{
  assert.notDeepEqual(SOUND_PATTERNS.success,SOUND_PATTERNS.retry);
  for(const notes of Object.values(SOUND_PATTERNS))for(const[midi,start,duration,gain]of notes){assert.ok(midi>=48&&midi<=96);assert.ok(start>=0&&duration>0&&start+duration<2);assert.ok(gain>0&&gain<=.08);}
  assert.ok(SOUND_PATTERNS.retry.at(-1)[0]>SOUND_PATTERNS.retry[1][0]);
});
function updateHarness(version='1.1.0'){
  const events={},messages=[];let reloaded=0,saved=0,checks=0,fail=false;
  const worker={postMessage(data,ports){ports[0].postMessage({version});ports[0].close();}};
  const registration={active:worker,installing:null,update:async()=>{checks++;if(fail)throw Error('Offline');},addEventListener(){}};
  const serviceWorker={controller:worker,register:async()=>registration,addEventListener:(key,fn)=>{events[key]=fn;}};
  const updater=createUpdater({currentVersion:'1.1.0',serviceWorker,onStatus:m=>messages.push(m),beforeReload:()=>saved++,reload:()=>reloaded++});
  return{updater,messages,setVersion:v=>{version=v;},events,offline:()=>{fail=true;},counts:()=>({reloaded,saved,checks})};
}
test('A new worker offers an update without reloading a running exercise; explicit update saves first',async()=>{
  const h=updateHarness();await h.updater.init();assert.equal(h.messages.at(-1).ready,false);h.setVersion('1.2.0');await h.events.controllerchange();
  assert.equal(h.messages.at(-1).ready,true);assert.equal(h.counts().reloaded,0);await h.updater.apply();assert.equal(h.counts().saved,1);assert.equal(h.counts().reloaded,1);
});
test('Manual update errors remain visible and do not claim the offline app is up to date',async()=>{
  const h=updateHarness();await h.updater.init();h.offline();await h.updater.check();assert.equal(h.messages.at(-1).status,'error');assert.equal(h.messages.at(-1).checking,false);assert.equal(h.counts().reloaded,0);
});

test('An update cannot reload the page when saving progress fails',async()=>{
  let reloaded=false;const statuses=[];
  const worker={postMessage(data,ports){ports[0].postMessage({version:'1.2.0'});ports[0].close();}};
  const serviceWorker={controller:worker,register:async()=>({active:worker,addEventListener(){}}),addEventListener(){}};
  const updater=createUpdater({currentVersion:'1.1.0',serviceWorker,onStatus:s=>statuses.push(s),beforeReload:()=>false,reload:()=>{reloaded=true;}});
  await updater.init();await updater.apply();assert.equal(reloaded,false);assert.equal(statuses.at(-1).status,'error');
});
