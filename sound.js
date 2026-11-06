// Original, local melodies: [MIDI pitch, start, duration, gain].
export const SOUND_PATTERNS={success:[[76,0,.23,.065],[79,.10,.25,.065],[84,.22,.42,.07],[72,.22,.40,.025]],retry:[[72,0,.16,.045],[69,.13,.16,.04],[74,.26,.28,.05]],finish:[[60,0,.18,.045],[64,.12,.20,.045],[67,.24,.22,.05],[72,.38,.27,.06],[76,.56,.25,.05],[79,.70,.28,.055],[84,.9,.72,.055],[79,.9,.72,.035],[76,.9,.72,.035],[72,.9,.72,.03],[60,.9,.72,.025]]};
export function createSoundPlayer(getContext=()=>new(window.AudioContext||window.webkitAudioContext)()){
  let context,voices=[],generation=0;
  function stop(){generation++;for(const v of voices){try{v.osc.stop();v.osc.disconnect();v.gain.disconnect();}catch{}}voices=[];}
  function unlock(){try{context||=getContext();return context.resume();}catch{return Promise.resolve();}}
  function play(kind,enabled=true){
    stop();if(!enabled||!SOUND_PATTERNS[kind])return;const token=generation;
    unlock().then(()=>{
      if(!context||token!==generation)return;const now=context.currentTime+.015;
      for(const[midi,offset,duration,volume]of SOUND_PATTERNS[kind]){
        const osc=context.createOscillator(),gain=context.createGain();osc.type=kind==='finish'?'triangle':'sine';osc.frequency.setValueAtTime(440*2**((midi-69)/12),now+offset);
        gain.gain.setValueAtTime(.0001,now+offset);gain.gain.exponentialRampToValueAtTime(volume,now+offset+.014);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+duration);
        osc.connect(gain);gain.connect(context.destination);osc.start(now+offset);osc.stop(now+offset+duration+.03);
        const voice={osc,gain};voices.push(voice);osc.onended=()=>{voices=voices.filter(x=>x!==voice);try{osc.disconnect();gain.disconnect();}catch{}};
      }
    }).catch(()=>{});
  }return{play,stop,unlock};
}
