import {mapStorySeed,personStories,vehicleStories} from './map-stories.js';
import {visitor,dome,tube,pointOnSite,RESIDENCE_DRIVER} from './scenery.js';

const modulo=(value,n)=>{const remainder=value%n;return remainder<0?remainder+n:remainder;};

function vehicleStoryKind(actor,lunar,island) {
  const kind=actor?.kind;
  if (actor?.parts.some(piece=>piece.animalKind==='dog')) return 'dog';
  if (actor?.lunarBus) return 'rover-bus';
  if (actor?.service==='policeStation') return 'police';
  if (actor?.islandVehicle) return `island-${actor.islandVehicle}`;
  if (actor?.lightAircraft) return 'light-plane';
  if (actor?.vehicleModel&&Object.hasOwn(vehicleStories,actor.vehicleModel)) return actor.vehicleModel;
  if (kind==='road'&&lunar) return 'rover';
  if (kind==='road'&&island) return 'island-cart';
  if (kind==='bird'&&lunar) return 'drone';
  if (kind==='train-car') return lunar?'monorail':'train';
  if (kind==='helicopter-rotor') return 'helicopter';
  return kind;
}

function lunarName(scene,key,actor,kind,first,last) {
  const [role,index,person]=key.split(':');
  const slot=role==='resident'?16*Number(index)+Number(person):actor?.characterSlot??928+Number(index);
  // 173 is coprime to the 32 × 32 name combinations. Each slot gets a different name.
  const name=modulo(slot*173+mapStorySeed(scene.seed,kind),first.length*last.length);
  return `${first[name%first.length]} ${last[Math.floor(name/first.length)]}`;
}
// Names and voices stay consistent while a child explores the map.
export function mapCharacterInfo(scene,key,discovery,profileName) {
  if (typeof key!=='string') return null;
  if (scene.discoveries?.[key]) return scene.discoveries[key];
  if (key===RESIDENCE_DRIVER) {
    const lunar=scene.id==='moon';
    const story=lunar
      ?'Kjører sin egen svevebil. Gullhjelmen er blank, selv etter å ha rygget inn i en sky av månestøv.'
      :scene.id==='island'?'Tar gjerne den lengste veien hjem i kabrioleten. Da varer vinden i håret litt lenger.'
        :'Har en sportsbil med to striper. Den ene gir fart, den andre er til pynt.';
    return {name:profileName||scene.residenceName||(lunar?'Astronauten med gullhjelmen':'Sjåføren'),
      status:lunar?'Bak spakene i svevebilen':'På kjøretur',story,sound:lunar?'astronaut':'human',
      voice:mapStorySeed(scene.seed,key)%24};
  }
  const index=Number(key.split(':')[1]);
  const actor=key.startsWith('actor:')?scene.ambient?.[index]:null;
  const part=actor?.parts.find(piece=>piece.characterKind)??scene.parts.find(piece=>piece.entity===key);
  if (!actor&&!part) return null;
  const seed=mapStorySeed(scene.seed,key);
  const lunar=scene.id==='moon';
  const dog=actor?.parts.some(piece=>piece.animalKind==='dog');
  if (!dog&&(actor?.kind==='walk'||actor?.dustBather||key.startsWith('resident:')||actor?.footballPlayer||actor?.kind==='slide')) {
    const kind=part?.characterKind??(lunar?'astronaut':'human');
    const {first,last,stories}=personStories[kind]??personStories.human;
    const name=lunar&&['alien','astronaut'].includes(kind)?lunarName(scene,key,actor,kind,first,last)
      :`${first[seed%first.length]} ${last[(seed>>>8)%last.length]}`;
    const found=actor?.encounter?.key===discovery?scene.discoveries?.[discovery]:null;
    if (found) return {name,status:'Har oppdaget noe',story:`Se hva jeg fant! ${found.name}. ${found.story}`,
      sound:kind,voice:seed%24};
    const status=kind==='alien'?'En venn fra verdensrommet':kind==='astronaut'?'På månebesøk':'På oppdagelsestur';
    let story=stories[(seed>>>16)%stories.length];
    if (actor?.transitPassenger==='subway') story=lunar
      ?'På vei ned til månetoget. Billetten ligger i den eneste lommen uten månestøv.'
      :'Skal ta T-banen til neste stopp. Har gått ned trappen så ofte at trinnene nesten kan telles med lukkede øyne.';
    if (actor?.transitPassenger==='train') story='På vei opp til toget. Håper å få vindusplass når det kjører over elven.';
    if (actor?.transitPassenger==='monorail') story='Tar trappen opp til månetoget. Teller trinnene for å sjekke om det er like mange i månetyngdekraft.';
    if (actor?.transitPassenger==='tram') story='På vei opp til trikken. Skal ta én runde til for å se hvilken palm som er høyest.';
    if (actor?.kind==='slide') story=lunar
      ? 'Skal slå sin egen rekord i støvrutsjebanen. Må bare finne ut hvor støvet har gjemt stoppeklokken.'
      : 'Har tenkt å ta rutsjebanen én gang til. Det har visst vært planen hele ettermiddagen.';
    if (actor?.dustBather) story='Tar et månestøvbad. Hotellgjestene får låne en støvkost i stedet for et håndkle.';
    if (actor?.peeking) story='Leker gjemsel bak steinen. Har blitt veldig flink til å gjemme alt unntatt antennene.';
    if (actor?.footballPlayer) {
      const team=lunar?'Månespark':'Elvespark';
      const play=['Øver på pasninger. Ballen øver på å treffe alt mulig annet.',
        'Har avtalt å feire hvert mål med en dans. Må bare score først.',
        'Trener på langskudd. Håper å treffe målet før det blir matpause.',
        'Liker korte pasninger og lange fotballvitser.'][seed%4];
      story=`Spiller på laget ${team}. ${play}`;
    }
    return {name,status,story,sound:kind,voice:seed%24};
  }
  const island=scene.id==='island';
  const kind=vehicleStoryKind(actor,lunar,island);
  const pool=vehicleStories[kind];
  if (!pool) return null;
  const [names,stories]=pool;
  const ordinal=scene.ambient.slice(0,index).filter(other=>vehicleStoryKind(other,lunar,island)===kind).length;
  const name=names[(mapStorySeed(scene.seed,kind)+ordinal)%names.length]+(ordinal>=names.length?` ${Math.floor(ordinal/names.length)+1}`:'');
  return {name,status:lunar?'Liv i månebasen':'Liv på kartet',
    story:stories[(seed>>>12)%stories.length],sound:['dog','bird'].includes(kind)?'animal':kind==='swimmer'?'human':'vehicle',voice:seed%24};
}

export function footballMoment(seconds) {
  const t=modulo(seconds,26);
  const player=(i,time)=>i===0?[-2.04+Math.sin(time*.52)*.49,Math.sin(time*.67)*1.12]
    :time>=14&&time<=21?[1.61,.39]:[1.96+Math.sin(time*.46)*.47,-Math.sin(time*.58)*.97];
  const beats=[0,3,6,9,12,14,16.3,19.2,22,26];
  const receivers=[0,1,0,1,0,0,1,1,0,0];
  let j=beats.findIndex(value=>value>t)-1;
  if (j<0) j=beats.length-2;
  const a=beats[j],b=beats[j+1],p=(t-a)/(b-a);
  const start=player(receivers[j],a),end=player(receivers[j+1],b);
  const bump=j===5,stunned=t>=16.3&&t<19.2;
  const ball=[start[0]+(end[0]-start[0])*p,start[1]+(end[1]-start[1])*p];
  const altitude=bump?Math.sin(p*Math.PI*.5)*1.35:stunned?Math.max(.1,1.35*(1-p)**2):.13+Math.sin(Math.PI*p)*.36;
  return {ball:[ball[0],altitude,ball[1]],players:[player(0,t),player(1,t)],stunned,kick:Math.exp(-p*13),receiver:receivers[j]};
}

export function footballActors(plot) {
  const space=plot.kind==='spaceField',level=space?.52:.35;
  const localTime=seconds=>seconds+plot.index*.31;
  const pose=(x,y,z,yaw=0,stride=0)=>{
    const [a,b,c]=pointOnSite([x,y+level,z],plot),turn=plot.yaw+yaw;
    return {x:a,y:b,z:c,cos:Math.cos(turn),sin:Math.sin(turn),stride,rollCos:1,rollSin:0,sound:0};
  };
  const players=[0,1].map(i=>({kind:'walk',footballPlayer:true,characterSlot:16*plot.index+12+i,
    parts:visitor(space?(i?'alien':'astronaut'):'human',i?'#6b9bbc':'#d48078',i?'#b48466':'#edb78a',false,.83,i+2),
    pose(seconds) {
      const t=localTime(seconds),state=footballMoment(t),[x,z]=state.players[i];
      const yaw=Math.atan2(state.ball[0]-x,state.ball[2]-z);
      const kick=state.receiver===i?state.kick*.42:0;
      const walking=state.stunned&&i===1?0:Math.sin(t*4.8)*.12;
      const result=pose(x,0,z,yaw,walking+kick);
      if (state.stunned&&i===1) { result.rollSin=Math.sin(t*8)*.075;result.rollCos=Math.sqrt(1-result.rollSin**2); }
      return result;
    },
  }));
  const ball={kind:'football-ball',parts:[dome(0,0,.33,.33,.31,'#f5e8cc'),
    tube(0,.157,.11,.045,.10,'#42546c',.10,'z')],pose(seconds){
    const [x,y,z]=footballMoment(localTime(seconds)).ball;
    return pose(x,y,z,seconds*2);
  }};
  const stars={kind:'football-stars',parts:Array.from({length:3},(_,i)=>{
    const a=i*Math.PI*2/3;
    return {shape:'plate',x:Math.cos(a)*.58,y:i*.08,z:Math.sin(a)*.58,w:.31,d:.01,h:.31,color:'#ffe28a',
      profile:Array.from({length:10},(_,j)=>{const angle=j*Math.PI/5, r=j%2?.073:.17;return [Math.sin(angle)*r,Math.cos(angle)*r];})};
  }),pose(seconds){
    const state=footballMoment(localTime(seconds));
    return pose(state.players[1][0],state.stunned?2.05:-540,state.players[1][1],seconds*3.2);
  }};
  return [...players,ball,stars];
}
