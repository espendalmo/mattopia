import test from 'node:test';
import assert from 'node:assert/strict';
import {AMBIENCE_LEVEL,createSoundPlayer,SOUND_PATTERNS} from '../sound.js';
import {createUpdater} from '../update.js';
import {fireworkBursts,FIREWORKS_END,FINALE_FIREWORKS_END} from '../project-fireworks.js';

test('Sound off creates no audio context; rapid new feedback replaces previous notes',async()=>{
  let created=0,stopped=0,started=0;
  const context={currentTime:0,resume:()=>Promise.resolve(),destination:{},createOscillator:()=>({frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){started++;},stop(){stopped++;}}),createGain:()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}})};
  const p=createSoundPlayer(()=>{created++;return context;});p.play('success',false);assert.equal(created,0);
  p.play('success');await Promise.resolve();assert.equal(started,SOUND_PATTERNS.success.length);const previous=stopped;
  p.play('retry');await Promise.resolve();assert.ok(stopped>previous);assert.equal(started,SOUND_PATTERNS.success.length+SOUND_PATTERNS.retry.length);p.stop();
});
test('The encouraging retry melody and completion fanfare are distinct and bounded',()=>{
  assert.notDeepEqual(SOUND_PATTERNS.success,SOUND_PATTERNS.retry);
  for(const notes of Object.values(SOUND_PATTERNS))for(const[midi,start,duration,gain]of notes){assert.ok(midi>=48&&midi<=96);assert.ok(start>=0&&duration>0&&start+duration<2);assert.ok(gain>0&&gain<=.08);}
  assert.ok(SOUND_PATTERNS.retry.at(-1)[4]>SOUND_PATTERNS.retry.at(-1)[0]);
});
test('Key clicks are short and quiet, respect mute, and do not cut off an encouraging melody',async()=>{
  let created=0,stopped=0,started=0;
  const context={currentTime:0,resume:()=>Promise.resolve(),destination:{},createOscillator:()=>({frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){started++;},stop(){stopped++;}}),createGain:()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}})};
  const p=createSoundPlayer(()=>{created++;return context;});
  p.play('key',false);assert.equal(created,0);
  p.play('retry');await Promise.resolve();const previous=stopped;
  p.play('key');await Promise.resolve();
  assert.equal(stopped,previous+SOUND_PATTERNS.key.length,'only the new click schedules its own end');
  assert.equal(started,SOUND_PATTERNS.retry.length+SOUND_PATTERNS.key.length);
  assert.ok(SOUND_PATTERNS.key.every(([,start,duration,gain])=>start===0&&duration<=.05&&gain<=.02));
  p.stop();
});

test('World ambience is quiet, loops once, and stops even if its audio context resumes late',async()=>{
  let release, waiting=false;
  const started=[],stopped=[],ramps=[];
  const context={
    currentTime:2, destination:{},
    resume:()=>waiting?new Promise(resolve=>{release=resolve;}):Promise.resolve(),
    createBuffer(channels,frames,rate) {
      assert.equal(channels,1);
      assert.equal(frames/rate,20);
      return {getChannelData:()=>new Float32Array(frames)};
    },
    createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime:value=>ramps.push(value),cancelScheduledValues(){},setTargetAtTime(){}},connect(){},disconnect(){}}),
    createBufferSource:()=>({connect(){},disconnect(){},start(){started.push(this.loop);},stop(){stopped.push(this.loop);}}),
  };
  const sound=createSoundPlayer(()=>context);
  assert.equal(await sound.startAmbience('armor'),false);
  assert.equal(await sound.startAmbience('city'),true);
  assert.equal(await sound.startAmbience('city'),true);
  assert.deepEqual(started,[true]);
  assert.deepEqual(ramps,[.07*AMBIENCE_LEVEL]);
  sound.stopAmbience();
  assert.deepEqual(stopped,[true]);
  waiting=true;
  const pending=sound.startAmbience('moon');
  sound.stop();
  release();
  assert.equal(await pending,false);
  assert.equal(started.length,1);
});
function updateHarness(version='1.1.0'){
  const events={},messages=[];let reloaded=0,saved=0,checks=0,fail=false;
  const worker={state:'activated',addEventListener(){},postMessage(data,ports){if(data.type==='GET_VERSION'){ports[0].postMessage({version});ports[0].close();}}};
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
  const worker={state:'activated',addEventListener(){},postMessage(data,ports){if(data.type==='GET_VERSION'){ports[0].postMessage({version:'1.2.0'});ports[0].close();}}};
  const serviceWorker={controller:worker,register:async()=>({active:worker,addEventListener(){}}),addEventListener(){}};
  const updater=createUpdater({currentVersion:'1.1.0',serviceWorker,onStatus:s=>statuses.push(s),beforeReload:()=>false,reload:()=>{reloaded=true;}});
  await updater.init();await updater.apply();assert.equal(reloaded,false);assert.equal(statuses.at(-1).status,'error');
});

test('A finished build schedules the firework sounds and world tail while iOS keeps one quiet carrier',async()=>{
  const clips=[],automation=[],tones=[];
  let carrierStops=0;
  const session={type:'auto'};
  const context={
    currentTime:10,destination:{},resume:()=>Promise.resolve(),
    createOscillator() {
      let pitch;
      return {frequency:{setValueAtTime(value){pitch=value;},exponentialRampToValueAtTime(){}},
        connect(){},disconnect(){},start(){tones.push(pitch);},stop(){if(pitch===23) carrierStops++;}};
    },
    createGain:()=>({gain:{
      setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){},
      linearRampToValueAtTime:(value,time)=>automation.push([value,time]),
    },connect(){},disconnect(){}}),
    createBuffer:(channels,frames,rate)=>({duration:frames/rate,getChannelData:()=>new Float32Array(frames)}),
    createBufferSource:()=>({
      connect(){},disconnect(){},playbackRate:{setValueAtTime(){}},
      start(time,offset,duration){clips.push({time,duration,buffer:this.buffer.duration,loop:this.loop});},
      stop(){},
    }),
  };
  const player=createSoundPlayer(()=>context,()=>session);
  const scene={id:'moon',world:true,finished:'Månesporet',soundscape:{buildings:8,fun:1}};
  player.playBuild(scene,false,{finale:true});
  assert.equal(session.type,'auto');
  assert.deepEqual(clips,[]);
  player.playBuild(scene,true,{finale:true});
  await Promise.resolve();
  assert.equal(session.type,'playback');
  assert.equal(tones.filter(pitch=>pitch===23).length,1);
  const bursts=clips.filter(clip=>clip.buffer===.86);
  assert.equal(bursts.length,fireworkBursts(true).length);
  assert.ok(bursts.every((clip,i)=>Math.abs(clip.time-10.015-fireworkBursts(true)[i].at/1000)<.001));
  assert.equal(FIREWORKS_END,4910);
  assert.equal(FINALE_FIREWORKS_END,6230);
  assert.ok(clips.some(clip=>clip.buffer===3.82&&clip.duration===.61),'the finished station gets a short construction cue');
  assert.ok(clips.some(clip=>clip.loop&&clip.time===12.08),'the soundscape starts after the fanfare');
  assert.equal(player.activity('rocket',1),false);
  context.currentTime=13;
  assert.equal(player.activity('rocket',1),true);
  assert.ok(clips.some(clip=>clip.buffer===2.25));
  assert.ok(automation.some(([value,time])=>value<.001&&Math.abs(time-17.48)<.001),'the tail fades out');
  player.stopBuild();
  assert.equal(carrierStops,0);
  player.stop();
  assert.equal(carrierStops,1);
  assert.equal(session.type,'auto');
  assert.equal(player.activity('rocket',1),false);
  player.resume();
  assert.equal(session.type,'playback');
  assert.equal(tones.filter(pitch=>pitch===23).length,2);
  clips.length=0;
  context.currentTime=21;
  player.playBuild({...scene,finished:null,roadBuild:true});
  await Promise.resolve();
  assert.ok(clips.some(clip=>clip.buffer===3.82&&clip.duration===undefined&&clip.time>21.7),
    'the complete workshop clip plays at the intermediate build stage');
  assert.ok(clips.some(clip=>clip.loop&&clip.time>25),'the soundscape follows the workshop');
  assert.ok(!clips.some(clip=>clip.buffer===.86));
  player.stop();
});
