import {ambienceBuffer,soundClip} from '../sound-art.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {AMBIENCE_LEVEL,createSoundPlayer,SOUND_PATTERNS,taskSuccessStep} from '../sound.js';
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
  assert.notDeepEqual(SOUND_PATTERNS.perfect,SOUND_PATTERNS['task-success-7']);
  for(const notes of Object.values(SOUND_PATTERNS))for(const[midi,start,duration,gain]of notes){assert.ok(midi>=48&&midi<=96);assert.ok(start>=0&&duration>0&&start+duration<2);assert.ok(gain>0&&gain<=.08);}
  assert.ok(SOUND_PATTERNS.retry.at(-1)[4]>SOUND_PATTERNS.retry.at(-1)[0]);
});

test('Timed Eplo sounds wait for an already running audio context and respect mute',async()=>{
  let created=0,played=0;
  const context={state:'suspended',currentTime:0,destination:{},
    resume(){this.state='running';return Promise.resolve();},
    createOscillator:()=>({frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){played++;},stop(){}}),
    createGain:()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}})};
  const player=createSoundPlayer(()=>{created++;return context;},()=>null);
  const idle={onlyWhileRunning:true};
  player.play('eplo-shades',true,idle);
  assert.equal(created,0);
  player.play('open');
  await Promise.resolve();
  const before=played;
  player.play('eplo-shades',false,idle);
  player.play('eplo-puff',true,idle);
  await Promise.resolve();
  assert.equal(played-before,SOUND_PATTERNS['eplo-puff'].length);
  player.stop();
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

test('Building cues are short and distinct, and only the latest selection plays',async()=>{
  const played=[],stopped=[];
  let created=0;
  const context={
    currentTime:1,destination:{},resume:()=>Promise.resolve(),
    createBuffer(_channels,frames,rate) {
      const data=new Float32Array(frames);
      return {data,duration:frames/rate,getChannelData:()=>data};
    },
    createGain:()=>({gain:{setValueAtTime(){},cancelAndHoldAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}}),
    createBufferSource:()=>({
      connect(){},disconnect(){},
      start(time){played.push({time,buffer:this.buffer});},stop(time){stopped.push(time);},
    }),
  };
  const p=createSoundPlayer(()=>{created++;return context;},()=>null);
  p.playBuilding('city',0,'house',false);
  assert.equal(created,0);
  p.playBuilding('city',0,'house');
  p.playBuilding('city',8,'house');
  await Promise.resolve();
  assert.equal(played.length,1);
  assert.equal(played[0].time,1.075);
  context.currentTime=1.2;
  p.playBuilding('city',0,'house');
  await Promise.resolve();
  assert.ok(stopped[0]>1.275&&stopped[0]<1.3,'previous building cue fades out');
  assert.notDeepEqual(played[0].buffer.data,played[1].buffer.data);
  assert.ok(played.every(({buffer})=>buffer.duration<=.9&&buffer.data.some(value=>Math.abs(value)>.1)));
  p.playBuilding('moon',0,'rocketPort');
  p.stopBuild({fade:true});
  await Promise.resolve();
  assert.equal(played.length,2,'closing the map cancels a queued building cue');
  p.playCharacter('alien',4,false);
  p.playCharacter('alien',4);
  p.playCharacter('astronaut',18);
  await Promise.resolve();
  assert.equal(played.length,3,'only the latest inspected character greets the player');
  p.playCharacter('alien',4);
  await Promise.resolve();
  assert.equal(played.length,4);
  assert.notDeepEqual(played[2].buffer.data,played[3].buffer.data);
  assert.ok(played.slice(2).every(({buffer})=>buffer.duration<=.55&&buffer.data.some(value=>Math.abs(value)>.1)));
});

test('World ambience is quiet, loops once, and stops even if its audio context resumes late',async()=>{
  let release, waiting=false;
  const started=[],stopped=[],ramps=[],held=[];
  const context={
    currentTime:2, destination:{},
    resume:()=>waiting?new Promise(resolve=>{release=resolve;}):Promise.resolve(),
    createBuffer(channels,frames,rate) {
      assert.equal(channels,1);
      assert.equal(frames/rate,48);
      return {getChannelData:()=>new Float32Array(frames)};
    },
    createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime:(value,time)=>ramps.push([value,time]),cancelAndHoldAtTime:time=>held.push(time)},connect(){},disconnect(){}}),
    createBufferSource:()=>({connect(){},disconnect(){},start(){started.push(this.loop);},stop(time){stopped.push([this.loop,time]);}}),
  };
  const sound=createSoundPlayer(()=>context);
  assert.equal(await sound.startAmbience('armor'),false);
  assert.equal(await sound.startAmbience('city'),true);
  assert.equal(await sound.startAmbience('city'),true);
  assert.deepEqual(started,[true]);
  assert.deepEqual(ramps,[[.07*AMBIENCE_LEVEL,2.55]]);
  context.currentTime=3;
  sound.stopAmbience();
  assert.deepEqual(held,[3]);
  assert.deepEqual(ramps.at(-1),[0,3.075]);
  assert.equal(stopped[0][0],true);
  assert.ok(stopped[0][1]>3.075&&stopped[0][1]<3.1);
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

test('World beds are distinct, quiet environmental loops with isolated local cues',()=>{
  const context={createBuffer(_channels,frames,rate) {
    const samples=new Float32Array(frames);
    return {duration:frames/rate,getChannelData:()=>samples};
  }};
  const signatures=[];
  const energy=(samples,from,to)=>{
    const window=samples.subarray(from*16000,to*16000);
    return Math.sqrt(window.reduce((sum,value)=>sum+value*value,0)/window.length);
  };
  for (const [world,length] of [['city',48],['island',56],['moon',60]]) {
    const bed=ambienceBuffer(context,world,2);
    assert.equal(bed.duration,length);
    const samples=bed.getChannelData();
    assert.ok(samples[0]===0);
    assert.ok(energy(samples,4,7)>.008&&energy(samples,4,7)<.2,world);
    signatures.push(Array.from(samples.subarray(80000,80008)));
  }
  assert.equal(new Set(signatures.map(JSON.stringify)).size,3);
  const quiet=ambienceBuffer(context,'island',2).getChannelData();
  assert.deepEqual(ambienceBuffer(context,'island',4,{hotel:true,wheel:true}).getChannelData(),quiet);
  assert.ok(energy(quiet,0,2)<energy(quiet,2,5),'the waves come and go');
  const radio=ambienceBuffer(context,'moon',2).getChannelData();
  assert.ok(energy(radio,10.7,11.8)>energy(radio,12,13),'there is a short radio burst');
  assert.ok(soundClip(context,'tram-bell').getChannelData().some(n=>Math.abs(n)>.2));
  assert.ok(soundClip(context,'horn').getChannelData().some(n=>Math.abs(n)>.2));
});

test('Task rewards rise in pitch from first to last at every round length',()=>{
  for (const length of [5,6,8]) {
    const steps=Array.from({length},(_,index)=>taskSuccessStep(index,length));
    assert.equal(steps[0],0);
    assert.equal(steps.at(-1),7);
    assert.equal(new Set(steps).size,length);
    const peaks=steps.map(step=>Math.max(...SOUND_PATTERNS[`task-success-${step}`].map(([pitch])=>pitch)));
    assert.ok(peaks.every((peak,i)=>i===0||peak>peaks[i-1]));
  }
});
