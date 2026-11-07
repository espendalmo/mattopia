// Original, local melodies: [MIDI pitch, start, duration, gain].
export const SOUND_PATTERNS={success:[[76,0,.23,.065],[79,.10,.25,.065],[84,.22,.42,.07],[72,.22,.40,.025]],finish:[[60,0,.18,.045],[64,.12,.20,.045],[67,.24,.22,.05],[72,.38,.27,.06],[76,.56,.25,.05],[79,.70,.28,.055],[84,.9,.72,.055],[79,.9,.72,.035],[76,.9,.72,.035],[72,.9,.72,.03],[60,.9,.72,.025]]};
SOUND_PATTERNS.key=[[86,0,.035,.018]];
// Soft pitch glides give the companion a small, voice-like reaction.
SOUND_PATTERNS.retry=[[78,0,.14,.045,74],[90,0,.13,.012,86],[75,.105,.19,.043,81]];
SOUND_PATTERNS.recover=[[74,0,.13,.045,81],[86,0,.13,.012,93],[81,.10,.27,.05,86]];
SOUND_PATTERNS.memory=[[72,0,.13,.05],[76,.09,.14,.05],[79,.18,.16,.055],[84,.29,.34,.055],[76,.29,.34,.028]];
export function createSoundPlayer(getContext=()=>new(window.AudioContext||window.webkitAudioContext)()){
  let context,voices=[],generation=0;
  function stop(){generation++;for(const v of voices){try{v.osc.stop();v.osc.disconnect();v.gain.disconnect();}catch{}}voices=[];}
  function unlock(){try{context||=getContext();return context.resume();}catch{return Promise.resolve();}}
  function play(kind,enabled=true){
    if(kind!=='key')stop();if(!enabled||!SOUND_PATTERNS[kind])return;const token=generation;
    unlock().then(()=>{
      if(!context||token!==generation)return;const now=context.currentTime+(kind==='key'?0:.015);
      for(const[midi,offset,duration,volume,endMidi]of SOUND_PATTERNS[kind]){
        const osc=context.createOscillator(),gain=context.createGain();osc.type=kind==='finish'||kind==='key'?'triangle':'sine';osc.frequency.setValueAtTime(440*2**((midi-69)/12),now+offset);
        if(endMidi)osc.frequency.exponentialRampToValueAtTime(440*2**((endMidi-69)/12),now+offset+duration*.75);
        gain.gain.setValueAtTime(.0001,now+offset);gain.gain.exponentialRampToValueAtTime(volume,now+offset+(kind==='key'?.003:.014));gain.gain.exponentialRampToValueAtTime(.0001,now+offset+duration);
        osc.connect(gain);gain.connect(context.destination);osc.start(now+offset);osc.stop(now+offset+duration+.03);
        const voice={osc,gain};voices.push(voice);osc.onended=()=>{voices=voices.filter(x=>x!==voice);try{osc.disconnect();gain.disconnect();}catch{}};
      }
    }).catch(()=>{});
  }return{play,stop,unlock};
}
