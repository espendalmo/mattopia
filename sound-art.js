const TAU=2*Math.PI;
const loopLength=20;
const unit=value=>Math.max(0,Math.min(1,value));
const wave=(time,pitch)=>Math.sin(TAU*time*pitch);

function synthesize(context,length,sample) {
  const rate=16000,buffer=context.createBuffer(1,Math.round(rate*length),rate);
  const samples=buffer.getChannelData(0);
  let seed=7231,low=0,mid=0;
  for (let i=0;i<samples.length;i++) {
    const t=i/rate;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const noise=seed/2147483648-1;
    low+=(noise-low)*.025;
    mid+=(noise-mid)*.13;
    samples[i]=sample(t,noise,low,mid);
  }
  return buffer;
}

function chirp(t,length,pitch) {
  if (t<0||t>=length) return 0;
  return Math.sin(Math.PI*t/length)**2*wave(t,pitch*(1-.145*t/length));
}

const fairPhrases=[
  {at:3.1,notes:[523,659,784,698,659,587,523,392]},
  {at:13.4,notes:[392,523,659,784,659,698,587,523]},
];
function fairground(t) {
  for (const {at,notes} of fairPhrases) {
    const beat=(t-at)/.29,index=Math.floor(beat);
    if (index<0||index>=notes.length) continue;
    const phase=(beat-index)*.29,pitch=notes[index];
    const pulse=unit(phase*45)*unit((.27-phase)*8);
    return pulse*(wave(phase,pitch)*.53+wave(phase,pitch*2)*.18+wave(phase,pitch*.5)*.22);
  }
  return 0;
}

export function ambienceBuffer(context,world,buildings,fun) {
  const calls=world==='city'?[[1.9,1550],[2.16,1790],[7.4,1850],[7.69,1580],[12.33,1710]]
    :world==='island'?[[6.2,920],[12.6,1060]]:[[4.25,392],[4.49,466],[11.2,330]];
  return synthesize(context,loopLength,(t,noise,low,mid)=>{
    let bed;
    if (world==='island') {
      const swell=.17+.69*(.5-.5*Math.cos(t*TAU/4))**2;
      bed=swell*(low*1.8+mid*.75+noise*.11);
    } else if (world==='moon') {
      bed=low*.53+mid*.12+.085*wave(t,56)*(.8+.2*Math.cos(t*TAU/8));
    } else bed=(.78+.22*wave(t,1/8))*(low*.93+mid*.17);
    for (const [at,pitch] of calls) {
      bed+=(world==='city'?.11:.065)*chirp(t-at,world==='island'?.42:.15,pitch);
    }
    const passes=(.4+.32*wave(t,1/8)+.23*wave(t,3/16))**2;
    const street=buildings*.11*passes*(low*1.2+wave(t,world==='moon'?172:124)*.25);
    const fair=fun?(.22+fun*.075)*fairground(t):0;
    const chatter=buildings>=2 ? mid*.16*unit((t-9.2)*1.9)*unit((12.1-t)*1.6)*(.7+.24*wave(t,5)) : 0;
    return (bed+street+fair+chatter)*Math.min(1,t*3,(loopLength-t)*3);
  });
}

export const ACTIVITY_SOUNDS=Object.freeze({
  rocket:[2.25,.24,3],
  plane:[2.8,.29,3],
  helicopter:[3.45,.29,4],
  train:[1.9,.21,4],
  monorail:[1.65,.19,4],
  traffic:[1.45,.17,5.8],
  rover:[1.65,.14,6.5],
  people:[1.63,.145,9],
  astronaut:[1.55,.14,11],
  alien:[1.57,.145,13],
  'ride-cheer':[1.45,.2,7],
});

const syllables={
  alien:[[.09,325],[.29,435],[.5,288],[.93,485],[1.19,308]],
  astronaut:[[.14,206],[.33,241],[.6,183],[.82,221],[1.1,177]],
  people:[[.11,204],[.34,163],[.62,228],[.93,271],[1.15,202]],
};

function voices(t,kind) {
  const warble=kind==='alien'?.065:.024;
  let voice=0;
  for (const [at,pitch] of syllables[kind]) {
    const age=t-at;
    if (age<0||age>.24) continue;
    const glide=1+warble*wave(age,12);
    voice+=.44*chirp(age,.24,pitch*glide)+.31*chirp(age,.22,pitch*2.02*glide)+.17*chirp(age,.22,pitch*3.08);
  }
  return voice;
}

export function soundClip(context,kind) {
  if (kind==='firework') {
    return synthesize(context,.86,(t,noise,low,mid)=>{
      const rise=unit(t/.006);
      const burst=rise*Math.exp(-t*13)*(low*1.35+mid*.95+wave(t,77-21*t)*.51);
      const crackle=Math.exp(-t*7)*unit(t/.035)*(mid*.5+noise*.35)*(1+wave(t,37)**6)*.7;
      return burst+crackle;
    });
  }
  if (kind==='build-earth'||kind==='build-moon') {
    const moon=kind==='build-moon';
    const strikes=[.07,.28,.53,1.51,1.72,2.01,2.91,3.15,3.42,3.61];
    return synthesize(context,3.82,(t,noise,low,mid)=>{
      let knocks=0;
      for (const start of strikes) {
        const age=t-start;
        if (age>=0&&age<.18) knocks+=Math.exp(-age*29)*unit(age/.003)*
          (low*.72+mid*.82+wave(age,moon?134:212)*.37+wave(age,347)*.16);
      }
      const work=unit((t-.63)*14)*unit((1.48-t)*10)+unit((t-2.08)*11)*unit((2.87-t)*9);
      const tool=moon
        ? (wave(t,480+t*68)+.5*wave(t,1040-t*97))*(.53+.38*wave(t,29))*.31
        : (.62+.34*wave(t,7.4))*(mid*.87+noise*.28+wave(t,176)*.11);
      return knocks*.89+work*tool;
    });
  }
  const [length]=ACTIVITY_SOUNDS[kind];
  return synthesize(context,length,(t,noise,low,mid)=>{
    const pass=Math.sin(Math.PI*t/length)**1.3;
    if (kind==='rocket') return pass*(1.2*low+.48*mid+.19*noise+.2*wave(t,44+12*t));
    if (kind==='plane') return pass*(low*.83+mid*.62+.28*wave(t,164-18*t)+.12*wave(t,322-37*t));
    if (kind==='helicopter') {
      const rotor=.27+.71*wave(t,11.2)**4;
      return pass*rotor*(low*.82+mid*.47+.31*wave(t,112-2*t)+.18*wave(t,224-4*t));
    }
    if (kind==='train') return pass*(low*.65+(.5+.49*wave(t,6)**4)*(mid*.61+noise*.095)+chirp(t-.5,.53,357)*.17);
    if (kind==='monorail') return pass*(low*.36+.23*wave(t,136+t*11)+chirp(t-.13,.75,442)*.24);
    if (kind==='traffic'||kind==='rover') {
      const engine=(kind==='traffic'?115:148)+30*pass-24*t;
      return pass*(mid*.36+low*.51+.23*wave(t,engine)+.125*wave(t,engine*2.03));
    }
    if (kind==='ride-cheer') {
      const a=chirp(t-.12,.83,618+110*pass),b=chirp(t-.33,.86,825+145*pass);
      return pass*(.37*a+.3*b+mid*.26);
    }
    const voice=voices(t,kind);
    const radio=kind==='astronaut'?pass*.13*mid+.17*chirp(t,.15,637)+.13*chirp(t-1.37,.17,560):0;
    return pass*(voice*.73+mid*.14)+radio;
  });
}
