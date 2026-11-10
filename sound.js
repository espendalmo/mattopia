import {ambienceBuffer,ACTIVITY_SOUNDS,buildingClip,soundClip} from './sound-art.js';
import {fireworkBursts} from './project-fireworks.js';

// Original, local melodies: [MIDI pitch, start, duration, gain].
export const SOUND_PATTERNS={success:[[76,0,.16,.065],[79,.078,.17,.065],[84,.159,.32,.07],[72,.159,.29,.025]],finish:[[60,0,.18,.045],[64,.12,.20,.045],[67,.24,.22,.05],[72,.38,.27,.06],[76,.56,.25,.05],[79,.70,.28,.055],[84,.9,.72,.055],[79,.9,.72,.035],[76,.9,.72,.035],[72,.9,.72,.03],[60,.9,.72,.025]]};
SOUND_PATTERNS.key=[[86,0,.035,.018]];
// Soft pitch glides give the companion a small, voice-like reaction.
SOUND_PATTERNS.retry=[[78,0,.14,.045,74],[90,0,.13,.012,86],[75,.105,.19,.043,81]];
SOUND_PATTERNS.memory=[[72,0,.13,.05],[76,.09,.14,.05],[79,.18,.16,.055],[84,.29,.34,.055],[76,.29,.34,.028]];
SOUND_PATTERNS.select=[[79,0,.075,.013]];
SOUND_PATTERNS.open=[[69,0,.095,.014],[76,.049,.13,.012]];
SOUND_PATTERNS.next=[[74,0,.085,.011],[79,.046,.09,.009]];
SOUND_PATTERNS.build=[[67,0,.06,.015],[84,.07,.105,.014]];
SOUND_PATTERNS.landmark=[[64,.8,.14,.043],[67,.9,.17,.05],[72,1.01,.2,.055],[76,1.13,.22,.052],
  [84,1.27,.44,.062],[79,1.27,.41,.038],[72,1.27,.46,.029],[60,1.27,.49,.033]];
SOUND_PATTERNS.tap=[[79,0,.061,.012]];
SOUND_PATTERNS.back=[[72,0,.082,.013,68]];
SOUND_PATTERNS.hint=[[72,0,.11,.023],[81,.075,.17,.025,83]];
SOUND_PATTERNS.finale=[[60,.45,.18,.043],[67,.55,.19,.045],[72,.72,.23,.055],[76,.91,.27,.054],
  [79,1.09,.28,.049],[84,1.29,.67,.06],[79,1.29,.64,.036],[76,1.29,.65,.029],[60,1.29,.65,.032]];
const successRoots=[65,67,69,70,72,74,76,77];
export function taskSuccessStep(index,length) {
  return Math.max(0,Math.min(7,Math.round(index*7/Math.max(1,length-1))));
}
for (const [i,root] of successRoots.entries()) {
  SOUND_PATTERNS[`task-success-${i}`]=[
    [root+4,0,.15,.059],[root+7,.078,.17,.059],[root+12,.156,i===7?.34:.285,.064],
    [root,.156,.25,.022],
  ];
}
const lightSounds=new Set(['key','select','open','next','build','tap','back','hint']);
const worlds=new Set(['city','moon','island']);
export const AMBIENCE_LEVEL=.75;
const floor=.0001;
const WINDOW_FADE=.075;

function playbackSession() {
  const device=globalThis.navigator;
  const appleTouch=device?.maxTouchPoints>0&&/^(iPhone|iPad|iPod|MacIntel)$/.test(device.platform);
  return appleTouch?device.audioSession:null;
}

export function createSoundPlayer(getContext=()=>new(window.AudioContext||window.webkitAudioContext)(), getSession=playbackSession) {
  let context,voices=[],generation=0,buildGeneration=0,buildingGeneration=0,ambience,ambienceGeneration=0,session,carrier;
  const beds=new Map(),clips=new Map(),buildingClips=new Map();

  function releaseVoice({source,gain}) {
    try { source.stop(); } catch {}
    source.disconnect();
    gain.disconnect();
  }
  function fadeVoice(voice) {
    const {source,gain,start}=voice;
    const now=context.currentTime;
    if (start>now) {
      releaseVoice(voice);
      return;
    }
    try {
      const level=gain.gain;
      if (typeof level.cancelAndHoldAtTime==='function') level.cancelAndHoldAtTime(now);
      else {
        const current=level.value;
        level.cancelScheduledValues(now);
        level.setValueAtTime(current,now);
      }
      level.linearRampToValueAtTime(0,now+WINDOW_FADE);
      source.stop(now+WINDOW_FADE+.01);
    } catch {
      releaseVoice(voice);
    }
  }
  function stopVoices() {
    generation++;
    voices.forEach(releaseVoice);
    voices=[];
  }
  function stopBuild({fade=false}={}) {
    buildGeneration++;
    stopBuilding(fade);
    voices.filter(voice=>voice.build).forEach(fade?fadeVoice:releaseVoice);
    voices=voices.filter(voice=>!voice.build);
  }
  function stopBuilding(fade) {
    buildingGeneration++;
    voices.filter(voice=>voice.building).forEach(fade?fadeVoice:releaseVoice);
    voices=voices.filter(voice=>!voice.building);
  }
  function holdSession() {
    if (!session||carrier) return;
    // Keep the active iOS audio session running with a practically silent signal.
    const source=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
    source.frequency.setValueAtTime(23,now);
    gain.gain.setValueAtTime(.000012,now);
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    carrier={source,gain};
  }
  function unlock() {
    try {
      const next=getSession();
      if (next&&next!==session) {
        try { next.type='playback'; session=next; } catch {}
      }
      context||=getContext();
      const ready=context.resume();
      try { holdSession(); } catch {}
      return ready;
    } catch { return Promise.resolve(); }
  }
  function resume() {
    if (context) unlock().catch(()=>{});
  }
  function stopAmbience() {
    ambienceGeneration++;
    if (!ambience) return;
    const playing=ambience;
    ambience=null;
    fadeVoice(playing);
  }

  async function startAmbience(scene,{delay=0,duration=Infinity}={}) {
    const world=typeof scene==='string'?scene:scene?.id;
    const buildings=Math.min(4,Math.ceil((scene?.soundscape?.buildings??Object.keys(scene?.landmarks??{}).length)/4));
    const fun=Math.min(2,scene?.soundscape?.fun??0);
    const {wheel=false,hotel=false}=scene?.soundscape??{};
    const key=`${world}:${buildings}:${fun}:${wheel}:${hotel}`;
    const limited=Number.isFinite(duration);
    if (ambience?.key===key&&!ambience.limited&&!limited) return true;
    stopAmbience();
    if (!worlds.has(world)) return false;
    const token=ambienceGeneration;
    try {
      await unlock();
      if (!context || token!==ambienceGeneration) return false;
      if (!beds.has(key)) {
        beds.set(key,ambienceBuffer(context,world,buildings,{fun,wheel,hotel}));
        if (beds.size>8) beds.delete(beds.keys().next().value);
      }
      const source=context.createBufferSource(),gain=context.createGain();
      const start=context.currentTime+delay,end=start+duration;
      source.buffer=beds.get(key);
      source.loop=true;
      // Ambient sounds share the same 75% bus, separate from the UI effects and fanfares.
      gain.gain.setValueAtTime(floor,start);
      gain.gain.linearRampToValueAtTime(.07*AMBIENCE_LEVEL,start+.55);
      if (limited) {
        gain.gain.setValueAtTime(.07*AMBIENCE_LEVEL,end-1.1);
        gain.gain.linearRampToValueAtTime(floor,end);
      }
      source.connect(gain);
      gain.connect(context.destination);
      const mix={key,world,source,gain,start,end,limited,heard:new Map(),lastCue:-Infinity};
      source.onended=()=>{
        if (ambience===mix) ambience=null;
        source.disconnect();
        gain.disconnect();
      };
      source.start(start);
      if (limited) source.stop(end+.04);
      ambience=mix;
      return true;
    } catch { return false; }
  }

  function sample(kind,time,volume,{destination=context.destination,voice=true,build=false,building=false,buffer,length,rate=1}={}) {
    if (!context.createBufferSource) return;
    if (!buffer) {
      if (!clips.has(kind)) clips.set(kind,soundClip(context,kind));
      buffer=clips.get(kind);
    }
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=buffer;
    if (rate!==1) source.playbackRate.setValueAtTime(rate,time);
    gain.gain.setValueAtTime(volume,time);
    source.connect(gain);
    gain.connect(destination);
    const record={source,gain,build,building,start:time};
    if (voice) voices.push(record);
    source.onended=()=>{
      if (voice) voices=voices.filter(item=>item!==record);
      source.disconnect(); gain.disconnect();
    };
    if (length) {
      gain.gain.linearRampToValueAtTime(volume,time+length-.14);
      gain.gain.linearRampToValueAtTime(floor,time+length);
    }
    if (length) source.start(time,0,length);
    else source.start(time);
  }

  function activity(kind,intensity=1) {
    const clip=ACTIVITY_SOUNDS[kind];
    if (!clip||!ambience||!context) return false;
    if (ambience.world!=='moon'&&['rocket','monorail','rover','astronaut','alien'].includes(kind)) return false;
    const now=context.currentTime;
    if (now<ambience.start||now>ambience.end-.8) return false;
    const [length,volume,rest]=clip;
    if (now-(ambience.heard.get(kind)??-Infinity)<length+rest||kind!=='tram-bell'&&now-ambience.lastCue<.31) return false;
    try {
      sample(kind,now,volume*Math.max(0,Math.min(1,intensity))/.07,{destination:ambience.gain,voice:false});
      ambience.heard.set(kind,now);
      ambience.lastCue=now;
      return true;
    } catch { return false; }
  }

  function melody(kind,now,build=false) {
    for (const [midi,offset,duration,volume,endMidi] of SOUND_PATTERNS[kind]) {
      const source=context.createOscillator(),gain=context.createGain(),start=now+offset;
      source.type=kind==='finish'||kind==='finale'||kind==='key'?'triangle':'sine';
      source.frequency.setValueAtTime(440*2**((midi-69)/12),start);
      if (endMidi) source.frequency.exponentialRampToValueAtTime(440*2**((endMidi-69)/12),start+duration*.75);
      gain.gain.setValueAtTime(floor,start);
      gain.gain.exponentialRampToValueAtTime(volume,start+(kind==='key'?.003:.014));
      gain.gain.exponentialRampToValueAtTime(floor,start+duration);
      source.connect(gain); gain.connect(context.destination);
      const voice={source,gain,build,start};
      voices.push(voice);
      source.onended=()=>{
        voices=voices.filter(item=>item!==voice);
        source.disconnect(); gain.disconnect();
      };
      source.start(start); source.stop(start+duration+.03);
    }
  }

  function stop() {
    stopVoices();
    stopAmbience();
    if (carrier) { releaseVoice(carrier); carrier=null; }
    if (context?.state==='running') context.suspend?.().catch(()=>{});
    if (session) {
      try { session.type='auto'; } catch {}
      session=null;
    }
  }
  function play(kind,enabled=true) {
    if (!lightSounds.has(kind)) stopVoices();
    if (!enabled||!SOUND_PATTERNS[kind]) return;
    const token=generation;
    unlock().then(()=>{
      if (!context||token!==generation) return;
      const now=context.currentTime+(kind==='key'?0:.015);
      melody(kind,now);
    }).catch(()=>{});
  }

  function playBuilding(world,index,kind,enabled=true) {
    if (!enabled||!worlds.has(world)) return;
    stopBuilding(true);
    const token=generation,building=buildingGeneration;
    unlock().then(()=>{
      if (!context||token!==generation||building!==buildingGeneration) return;
      const key=`${world}:${index}:${kind}`;
      if (!buildingClips.has(key)) {
        buildingClips.set(key,buildingClip(context,world,index,kind));
        if (buildingClips.size>48) buildingClips.delete(buildingClips.keys().next().value);
      }
      sample(kind,context.currentTime+.075,.16,{building:true,buffer:buildingClips.get(key)});
    }).catch(()=>{});
  }

  function playBuild(scene,enabled=true,{finale=false,tail=true}={}) {
    if (!enabled) return;
    stopVoices();
    const finished=Boolean(scene?.finished);
    const kind=finale?'finale':finished?'landmark':'finish';
    const token=generation,build=++buildGeneration;
    const workStart=finished ? .06 : scene?.roadBuild ? .76 : .36;
    unlock().then(()=>{
      if (!context||token!==generation||build!==buildGeneration) return;
      const now=context.currentTime+.015;
      melody(kind,now,true);
      if (scene?.world) {
        sample(scene.id==='moon'?'build-moon':'build-earth',now+workStart,finished?.115:.23,
          {build:true,length:finished?.61:undefined});
      }
      if (finished||finale) {
        fireworkBursts(finale).forEach(({at},i)=>{
          sample('firework',now+at/1000,.105+i%3*.021,{build:true,rate:.91+i%4*.078});
        });
      }
    }).catch(()=>{});
    if (tail&&scene?.world) startAmbience(scene,{delay:finished?2.08:workStart+3.38,duration:5.4});
  }

  return {play,stop,resume,startAmbience,stopAmbience,activity,playBuilding,playBuild,stopBuild};
}
