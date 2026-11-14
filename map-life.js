import {mapStorySeed,personStories,vehicleStories} from './map-stories.js';
import {visitor,dome,tube,pointOnSite,vehicle,RESIDENCE_DRIVER} from './scenery.js';
import {roadProjections,streetNetwork,streetPathBetween} from './street-network.js';
import {regionSurface} from './regions.js';
import {streetHalfWidth} from './region-roads.js';

const modulo=(value,n)=>{const remainder=value%n;return remainder<0?remainder+n:remainder;};

function vehicleStoryKind(actor,lunar,island) {
  const kind=actor?.kind;
  if (actor?.seagull) return 'seagull';
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
  const actor=key.startsWith('actor:')?scene.ambient?.[index]:scene.ambient?.find(person=>person.resident===key);
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
    if (actor?.busJourney) story='Tar bussen videre på besøk. Teller holdeplassene for å være sikker på å gå av på riktig sted.';
    else if (actor?.railJourney) story=lunar?'Tar svevebanen på besøk. Månestøvet må vente på neste tog.'
      :scene.id==='island'?'Tar trikken på besøk. Hadde med en kokosnøtt som niste, men den tok en annen avgang.':
        'Tar toget på besøk. Har pakket niste til én holdeplass og dessert til den neste.';
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
    story:stories[(seed>>>12)%stories.length],sound:['dog','bird','seagull'].includes(kind)?'animal':kind==='swimmer'?'human':'vehicle',voice:seed%24};
}

const walkGap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const pathPoint=([x,y,z])=>({x,y,z});

function walkingLeg(points) {
  const clean=points.filter((p,i)=>!i||Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y,p.z-points[i-1].z)>.014);
  let duration=0;
  const steps=clean.slice(1).map((end,i)=>{
    const start=clean[i],begin=duration;
    duration+=Math.hypot(end.x-start.x,end.y-start.y,end.z-start.z)/1.62;
    return {start,end,begin,finish:duration};
  });
  return {duration,points:clean,at(seconds){
    const t=Math.max(0,Math.min(duration,seconds));
    const step=steps.find(step=>t<step.finish)??steps.at(-1);
    if (!step) return {...clean[0],yaw:0,stride:0};
    const {start,end,begin,finish}=step,f=(t-begin)/(finish-begin);
    return {x:start.x+(end.x-start.x)*f,y:start.y+(end.y-start.y)*f,z:start.z+(end.z-start.z)*f,
      yaw:Math.atan2(end.x-start.x,end.z-start.z),stride:seconds>0&&seconds<duration?Math.sin(t*9.5)*.16:0};
  }};
}

export function neighborhoodBus(layout,plan,plots) {
  const hub=plots.find(plot=>plot.kind==='busStation')??plots.find(plot=>plot.kind==='tramStation'||plot.kind==='monorailStation')??plots[0];
  if (!hub?.entries?.length||plots.length<4||!plan.network) return null;
  const locate=entry=>roadProjections(plan.paths,entry,1.2).sort((a,b)=>a.gap-b.gap)[0];
  const from=locate(hub.entries[0]);
  if (!from) return null;
  const targets=plots.filter(plot=>plot!==hub&&plot.entries?.length)
    .sort((a,b)=>Math.abs(walkGap(hub,a)-25)-Math.abs(walkGap(hub,b)-25));
  for (const plot of targets.slice(0,12)) {
    const to=locate(plot.entries[0]);
    const street=to&&streetPathBetween(plan.network,from,to);
    if (!street||street.length<4||walkGap(from,to)<12) continue;
    const height=({x,z})=>(plan.streetElevation?.(x,z)??regionSurface(layout,x,z).y)+.05;
    const platform=(road,side)=>({x:road.x-road.v*side*2,z:road.z+road.u*side*2});
    const last=street.at(-2),first=street[1];
    const direction=(road,point)=>Math.sign((point.x-road.x)*road.u+(point.z-road.z)*road.v)||1;
    const stops=[from,to].map((road,i)=>{
      const side=direction(road,i?last:first)*(i?-1:1);
      const stop=platform(road,side);
      return {distance:i,entry:road,access:[[stop.x,height(stop),stop.z]]};
    });
    const out=walkingLeg(street.map(point=>({...point,y:height(point)})));
    const back=walkingLeg(out.points.slice().reverse());
    const dwell=3.8,travel=out.duration*.67,period=2*(dwell+travel);
    if (out.duration<5) continue;
    const service={kind:'bus',stops,period,schedule:[{distance:0,arrive:0,depart:dwell},{distance:1,arrive:dwell+travel,depart:dwell*2+travel}]};
    service.vehicle={kind:'bus',vehicleModel:layout.theme==='moon'?'rover-bus':'bus',parts:vehicle(layout.theme==='moon'?'rover-bus':'bus','#6f9e93'),
      pose(seconds){
        const t=seconds%period,returning=t>=dwell+travel;
        const clock=returning?t-dwell-travel:t;
        const point=(returning?back:out).at((clock-dwell)/.67);
        const {x,y,z,yaw}=point;
        const moving=clock>dwell;
        const shift=.72*Math.min(1,Math.max(0,(clock-dwell)*2),(dwell+travel-clock)*2);
        return {x:x+Math.cos(yaw)*shift,y,z:z-Math.sin(yaw)*shift,cos:Math.cos(yaw),sin:Math.sin(yaw),
          stride:0,rollCos:1,rollSin:0,sound:moving?.26:0};
      }};
    return service;
  }
  return null;
}

function railTrip(service,from,to,ready) {
  const a=service.schedule.find(stop=>stop.distance===from.distance);
  const b=service.schedule.find(stop=>stop.distance===to.distance);
  if (!a||!b) return null;
  const period=service.period;
  const departure=a.depart;
  const lap=Math.max(0,Math.ceil((ready-departure+1.7)/period));
  const leave=departure+lap*period;
  const arrive=(b.arrive===0&&b.arrive<a.arrive?(service.returnAt??period):b.arrive+Number(b.arrive<a.arrive)*period)+lap*period;
  const door=(t,landing)=>{
    const vehicle=service.vehicle.pose(t);
    const side=Math.sign((landing.x-vehicle.x)*vehicle.cos-(landing.z-vehicle.z)*vehicle.sin)||1;
    return {x:vehicle.x+vehicle.cos*.44*side,y:vehicle.y+.21,z:vehicle.z-vehicle.sin*.44*side};
  };
  const boardAt=leave-1.7,offAt=arrive+.3;
  const here=from.access[0],there=to.access[0];
  const boarding=walkingLeg([here,door(boardAt,here)]);
  const leaving=walkingLeg([door(offAt,there),there]);
  return {boardAt,offAt,boarding,leaving,end:offAt+leaving.duration,vehicle:service.vehicle};
}

export function residentJourneys(layout,plan,people,rail,bus) {
  if (people.length<2||!plan.paths.length) return [];
  const network=plan.network??streetNetwork(plan.paths);
  const width=streetHalfWidth(layout.theme);
  const floor=(x,z)=>Math.max(regionSurface(layout,x,z).y,plan.streetElevation?.(x,z)??-Infinity)+.037;
  const locate=(point,radius=12)=>roadProjections(plan.paths,point,radius).sort((a,b)=>a.gap-b.gap)[0];
  const available=people.flatMap(person=>{
    const entry=person.plot.entries[0],access=plan.visitorAccess?.get(person.plot.index);
    const road=locate(entry,1.25);
    if (!road||!access?.length) return [];
    const deck=access.at(-1);
    return [{...person,road,access:[person,{...deck,y:person.plot.y+.32},...access.slice().reverse()]}];
  });
  const walkingRoute=(from,to)=>{
    const street=streetPathBetween(network,from.road,to.road);
    if (!street) return null;
    const side=Math.sign((from.access.at(-1).z-from.road.z)*from.road.u-(from.access.at(-1).x-from.road.x)*from.road.v)||1;
    const shoulder=street.map((p,i)=>{
      const a=street[Math.max(0,i-1)],b=street[Math.min(street.length-1,i+1)];
      const length=walkGap(a,b)||1;
      const x=p.x-(b.z-a.z)*side*(width+.28)/length,z=p.z+(b.x-a.x)*side*(width+.28)/length;
      return {x,y:floor(x,z),z};
    });
    if (shoulder.some(p=>regionSurface(layout,p.x,p.z).water&&p.y<.13)) return null;
    return walkingLeg([...from.access,...shoulder,...to.access.slice().reverse()]);
  };
  const stops=[rail,bus].filter(Boolean).flatMap(service=>service.stops.flatMap(stop=>{
    const start=pathPoint(stop.access[0]);
    const road=locate(stop.entry??start,4.3);
    return road?[{...stop,service,road,access:stop.access.slice().reverse().map(pathPoint)}]:[];
  }));
  const residents=[],used=new Set();
  for (const from of available) {
    if (used.has(from.plot)||residents.length>=8) continue;
    const near=available.filter(to=>to.plot!==from.plot&&!used.has(to.plot)&&walkGap(from,to)<39)
      .sort((a,b)=>walkGap(from,a)-walkGap(from,b));
    const start=3.1+residents.length*.85;
    const nearStops=person=>stops.filter(stop=>walkGap(person,stop.road)<32)
      .sort((a,b)=>{
        const preference=stop=>Number((stop.service.kind==='bus')===(residents.length%4===2))*14;
        return walkGap(person,a.road)-preference(a)-walkGap(person,b.road)+preference(b);
      });
    const departures=nearStops(from).slice(0,4).map(stop=>({stop,path:walkingRoute(from,stop)})).filter(entry=>entry.path);
    let destination;
    for (const to of near) {
      const path=walkingRoute(from,to);
      if (!path) continue;
      destination??={to,path};
      for (const last of nearStops(to).slice(0,4)) {
        const first=departures.find(entry=>entry.stop!==last&&entry.stop.service===last.service);
        if (!first) continue;
        const outbound=walkingRoute(last,to);
        const service=last.service;
        const trip=outbound&&railTrip(service,first.stop,last,start+first.path.duration);
        if (!trip) continue;
        destination={to,path,trip,inbound:first.path,outbound,service};
        break;
      }
      if (destination.trip||!departures.length) break;
    }
    if (!destination) continue;
    const {to,path,trip,inbound,outbound,service}=destination;
    const end=trip?trip.end+outbound.duration:start+path.duration;
    const swapStart=end+5.5;
    const back=walkingLeg(path.points.slice().reverse());
    const endCycle=swapStart+Math.max(path.duration,back.duration)+6;
    const cycle=trip?Math.ceil(endCycle/service.period)*service.period:endCycle;
    const make=(person,away,go,returnHome,rides)=>({
      kind:'walk',resident:person.entity,visits:away.plot.index,railJourney:Boolean(rides)&&service.kind!=='bus',busJourney:Boolean(rides)&&service.kind==='bus',
      voice:person.kind==='human'?'people':person.kind,
      parts:person.model.map(part=>({...part,entity:person.entity})),
      pose(seconds){
        const t=seconds%cycle;
        let current={...person,stride:0};
        if (t>=swapStart) current=returnHome.at(t-swapStart);
        else if (t>=start) {
          if (!rides) current=go.at(t-start);
          else if (t<trip.boardAt) current=inbound.at(t-start);
          else if (t<trip.boardAt+1.7) current=trip.boarding.at((t-trip.boardAt)*trip.boarding.duration/1.7);
          else if (t<trip.offAt) {
            const vehicle=trip.vehicle.pose(t);
            current={...vehicle,y:-540,yaw:0,stride:0};
          } else if (t<trip.end) current=trip.leaving.at(t-trip.offAt);
          else current=outbound.at(t-trip.end);
        }
        const {x,y,z,yaw,stride}=current;
        return {x,y,z,cos:Math.cos(yaw),sin:Math.sin(yaw),stride,rollCos:1,rollSin:0,sound:0};
      },
    });
    residents.push(make(from,to,path,back,trip),make(to,from,back,path,null));
    used.add(from.plot);used.add(to.plot);
  }
  return residents;
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
