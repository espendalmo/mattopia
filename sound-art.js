const TAU=2*Math.PI;
const loopLengths={city:48,island:56,moon:60};
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

function phrase(t,notes,beat) {
  const index=Math.floor(t/beat);
  if (index<0||index>=notes.length) return 0;
  const age=t-index*beat,pitch=notes[index];
  return unit(age*40)*unit((beat*.94-age)*9)*
    (wave(age,pitch)*.53+wave(age,pitch*2)*.17+wave(age,pitch*.5)*.24);
}

function waltz(t) {
  const beat=.38;
  const melody=phrase(t,[523,659,784,698,659,587,523,392,494,523,659,784,880,784,698,659,587,523],beat);
  const index=Math.floor(t/beat);
  if (index<0||index>=18) return 0;
  const age=t-index*beat;
  const root=[130.81,130.81,146.83,98,130.81,98][Math.floor(index/3)];
  const chord=index%3===0?wave(age,root)*.54:(wave(age,root*3)*.34+wave(age,root*4)*.19);
  return melody*.68+unit(age*38)*Math.exp(-age*10)*chord;
}

const jazzNotes=[392,466,523,587,554,523,466,392,349,392,466,523,0,466,392,349,392,0];
const jazzBass=[130.81,155.56,164.81,174.61,146.83,130.81,98,130.81];
const cubanNotes=[523,659,0,784,698,659,0,587,698,0,880,784,698,659,587,523,0,659,784,0,698,659,587,523];
const claveHits=[0,.324,.648,1.08,1.404];

function jazz(t,mid) {
  if (t<0||t>=7.6) return 0;
  const beat=t%.46,index=Math.floor(t/.46);
  const offbeat=beat>=.306;
  const age=offbeat?beat-.306:beat;
  const melody=jazzNotes[(index+(offbeat?1:0))%jazzNotes.length];
  const lead=unit(age*42)*Math.exp(-age*7)*(wave(age,melody)*.57+wave(age,melody*2)*.15);
  const root=jazzBass[index%jazzBass.length];
  const bass=unit(beat*34)*Math.exp(-beat*10)*(wave(beat,root)*.52+wave(beat,root*2)*.19);
  const brush=mid*unit(age*45)*Math.exp(-age*14)*(index%2?.62:.25);
  return (lead*.7+bass*.57+brush)*unit((7.6-t)*3);
}

function salsa(t,mid) {
  if (t<0||t>7.6) return 0;
  const figure=phrase(t-.13,cubanNotes,.216);
  const bar=t%1.728;
  const bassAge=bar<.648?bar:bar-.648;
  const root=Math.floor(t/1.728)%2?98:130.81;
  const bass=(wave(bassAge,root)*.49+wave(bassAge,root*1.5)*.18)*unit(bassAge*40)*Math.exp(-bassAge*8);
  const claveAge=claveHits.reduce((age,hit)=>bar>=hit?Math.min(age,bar-hit):age,1);
  const clave=(wave(claveAge,1160)+mid*.78)*Math.exp(-claveAge*85)*unit(claveAge*430);
  return (figure*.84+bass*.62+clave*.25)*unit((7.6-t)*2);
}

function moonPhrase(t) {
  if (t<0||t>7.5) return 0;
  const note=phrase(t,[220,261.63,329.63,293.66,261.63,196,220,0,329.63,392,329.63,261.63],.59);
  const glide=270*t+19*Math.sin(t*1.55)+.085*Math.sin(t*31);
  const halo=Math.sin(TAU*glide)*Math.sin(Math.PI*t/7.5)**2*.2;
  return note*.42+halo;
}

export function ambienceBuffer(context,world,buildings,{fun=0,wheel=false,hotel=false}={}) {
  const loopLength=loopLengths[world]??48;
  const birds=world==='city'?[[1.9,1550],[2.16,1790],[17.4,1850],[17.69,1580],[34.33,1710]]
    :world==='island'?[[6.2,1220],[19.6,1360],[36.7,1530],[39.1,1480]]:[];
  return synthesize(context,loopLength,(t,noise,low,mid)=>{
    let bed,music;
    if (world==='island') {
      const swell=.18+.82*(.5-.5*Math.cos(t*TAU/7))**2;
      bed=swell*(low*1.66+mid*.47+noise*.19);
      music=(hotel?.57:.47)*(salsa(t-3.5,mid)+salsa(t-26,mid));
    } else if (world==='moon') {
      bed=low*.36+mid*.07+.065*wave(t,56)*(.8+.2*Math.cos(t*TAU/12));
      music=.73*(moonPhrase(t-3.5)+moonPhrase(t-34));
    } else {
      const breeze=.67+.33*wave(t,1/12);
      const river=.49+.28*wave(t,1/3.5);
      bed=breeze*(low*.73+mid*.12)+river*(mid*.41+noise*.045);
      music=.55*(jazz(t-3.5,mid)+jazz(t-21.5,mid));
    }
    for (const [at,pitch] of birds) bed+=.085*chirp(t-at,world==='island'?.3:.15,pitch);
    const passes=(.4+.32*wave(t,1/8)+.23*wave(t,3/16))**2;
    const street=buildings*.043*passes*(low*1.2+mid*.12);
    const fair=wheel?.19*waltz(t-(world==='city'?36:44))
      :fun&&world!=='moon'?.105*phrase(t-(world==='city'?38:46),[392,523,659,784,659,698,587,523],.31):0;
    return (bed+street+music+fair)*Math.min(1,t*3,(loopLength-t)*3);
  });
}

export const ACTIVITY_SOUNDS=Object.freeze({
  rocket:[2.25,.055,4],
  plane:[2.8,.058,4],
  helicopter:[3.45,.057,5],
  train:[1.9,.058,5],
  'tram-bell':[.65,.24,0],
  horn:[.52,.085,12],
  monorail:[1.65,.052,5],
  traffic:[1.45,.047,6.5],
  rover:[1.65,.045,7.5],
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

const buildingKinds={
  birds:['park','garden','greatPark','palmGarden','camp','beachCamp','biodome','moonGarden'],
  water:['pool','tropicalPools','beachClub','dock','pier','quay','marina','bridge','lighthouse','tank'],
  flight:['airport','airstrip','hangar','shuttlePort','launch','rocketPort','orbitalPort'],
  rail:['railwayStation','tramStation','monorailStation'],
  motor:['roverGarage','hoverDealer','busStation'],
  clock:['school','church','hall','bank','prison','bookHall'],
  fair:['wheel','coaster','cinema','nightCinema','bandstand','dance','casino'],
  arcade:['arcade','lunarArcade','islandArcade'],
  crowd:['field','spaceField','fitness','square','market','tropicalMarket'],
  work:['mill','factory','sawmill','moonWorkshop','moonCargo','oxygen','generator','refinery','supplyDepot','cargoDepot'],
  signal:['solar','solarGarden','telescope','telescopeArray','craterLab','radioTower','lunarRadio','prismTower','novaTower','haloTower'],
  dining:['restaurant','bistro','coralCafe','tikiBar','dustCafe','moonBurger','cosmicIce','needleTower'],
  hotel:['hotel','resort','sunsetHotel','moonHotel','auroraHotel','megaResort','glassHotel'],
};
const buildingVoices=Object.fromEntries(Object.entries(buildingKinds)
  .flatMap(([voice,kinds])=>kinds.map(kind=>[kind,voice])));

const greetingPitches={human:[233,294,262],astronaut:[190,237,207],alien:[383,510,314],
  animal:[516,444,627],vehicle:[116,151,132],discovery:[425,630,865]};

export function characterClip(context,kind,variant) {
  const pitches=greetingPitches[kind]??greetingPitches.human;
  const pitch=2**((variant%8-3)*.057);
  const rhythm=[[.02,.18],[.02,.13,.27],[.025,.245]][Math.floor(variant/8)%3];
  return synthesize(context,.49,(time,_noise,low,mid)=>{
    let voice=0;
    for (const [i,start] of rhythm.entries()) {
      const age=time-start;
      const frequency=pitches[(i+variant)%pitches.length]*pitch;
      const warble=kind==='alien'?1+.072*wave(age,17):1;
      voice+=.46*chirp(age,.169,frequency*warble)+.19*chirp(age,.141,frequency*2.03);
    }
    const envelope=unit(time*42)*unit((.49-time)*15);
    if (kind==='astronaut') voice=voice*.85+envelope*mid*.18+.12*chirp(time,.068,990);
    if (kind==='vehicle') voice=voice*.76+envelope*low*.68;
    return voice*envelope;
  });
}

export function buildingClip(context,world,index,kind) {
  const voice=buildingVoices[kind]??(world==='moon'?'signal':world==='island'?'dining':'chime');
  const pitch=2**(((index*7)%11-5)/12);
  const length=.73+(index%5)*.035;
  const pluck=(t,at,note,decay=13)=>{
    const age=t-at;
    if (age<0) return 0;
    const f=note*pitch;
    return unit(age*180)*Math.exp(-age*decay)*(wave(age,f)*.77+wave(age,f*2.03)*.23);
  };
  return synthesize(context,length,(t,noise,low,mid)=>{
    const envelope=unit(t*40)*unit((length-t)*10);
    const swell=Math.sin(Math.PI*t/length)**2;
    const second=length*.29;
    let cue;
    switch (voice) {
      case 'birds':
        cue=chirp(t-.035,.17,1530*pitch)+.66*chirp(t-second,.20,1840*pitch)+low*swell*.38;
        break;
      case 'water':
        cue=swell*(low*1.6+mid*.55+noise*.12)+.48*pluck(t,second,kind==='lighthouse'?204:670,7);
        break;
      case 'flight':
        cue=swell*(low*1.6+mid*.58+.5*wave(t,(world==='moon'?57:119)*pitch*(1+.85*t)));
        break;
      case 'rail':
        cue=.44*swell*(mid+wave(t,55*pitch))*(.5+.5*wave(t,10)**4)
          +pluck(t,.02,kind==='tramStation'?1000:kind==='monorailStation'?628:363,7)
          +.66*pluck(t,second,kind==='tramStation'?1000:kind==='monorailStation'?770:414,8);
        break;
      case 'motor':
        cue=swell*(.55*low+.48*wave(t,125*pitch*(1+t))+.21*wave(t,250*pitch*(1+t)))+.33*pluck(t,second,410);
        break;
      case 'clock':
        cue=.82*pluck(t,.015,440,5)+.54*pluck(t,second,350,7);
        break;
      case 'fair':
        cue=.85*phrase(t,[392*pitch,523*pitch,659*pitch,587*pitch],length*.23);
        break;
      case 'arcade':
        cue=.62*phrase(t,[523*pitch,784*pitch,659*pitch,1046*pitch],length*.19)+.35*pluck(t,length*.76,1318);
        break;
      case 'crowd':
        cue=swell*(.7*voices(t,world==='moon'?'astronaut':'people')+mid*.3)+.46*chirp(t-.04,.19,990*pitch);
        break;
      case 'work':
        cue=.75*pluck(t,.01,162,27)+.56*pluck(t,second,224,22)+.35*pluck(t,second*2.1,140,20)
          +swell*(world==='moon'?.29*wave(t,540*pitch-140*t):mid*.42);
        break;
      case 'signal':
        cue=.86*chirp(t-.025,.29,596*pitch)+.61*chirp(t-second*1.6,.34,920*pitch)+.29*swell*wave(t,230*pitch+16*wave(t,4));
        break;
      case 'dining':
        cue=.72*pluck(t,.015,world==='island'?523:349)+.62*pluck(t,second,world==='moon'?785:659)
          +.61*pluck(t,second*1.62,world==='island'?784:523,8);
        break;
      case 'hotel':
        cue=.65*pluck(t,.015,261,6)+.58*pluck(t,second,392,7)+.47*pluck(t,second*1.8,523,6);
        break;
      default:
        cue=.8*pluck(t,.018,587,8)+.58*pluck(t,second,698,9);
    }
    return cue*.72*envelope;
  });
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
      const stroke=.38+.62*Math.max(0,wave(t-.67,1.75))**1.55;
      const tool=moon
        ? (wave(t,480+t*68)+.5*wave(t,1040-t*97))*(.53+.38*wave(t,29))*.31
        : stroke*(mid*.43+noise*.13+low*.32);
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
    if (kind==='tram-bell') {
      const bell=age=>age<0?0:unit(age*195)*Math.exp(-age*13)*(wave(age,986)*.67+wave(age,1525)*.24+wave(age,2164)*.13);
      return bell(t-.01)+bell(t-.18)*.84;
    }
    if (kind==='horn') {
      const toot=age=>age<0?0:unit(age*105)*unit((.16-age)*27)*(wave(age,392)*.63+wave(age,512)*.31+wave(age,783)*.13);
      return toot(t-.01)+toot(t-.22)*.72;
    }
    if (kind==='train') return pass*(low*.65+(.5+.49*wave(t,6)**4)*(mid*.61+noise*.095)+chirp(t-.5,.53,357)*.17);
    if (kind==='monorail') return pass*(low*.36+.23*wave(t,136+t*11)+chirp(t-.13,.75,442)*.24);
    if (kind==='traffic'||kind==='rover') {
      const engine=(kind==='traffic'?115:148)+30*pass-24*t;
      return kind==='traffic'?pass*(mid*.49+low*.71+.08*wave(t,engine))
        :pass*(mid*.36+low*.51+.23*wave(t,engine)+.125*wave(t,engine*2.03));
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
