import test from 'node:test';
import assert from 'node:assert/strict';
import {projectScene,worldBuildingPreview} from '../projects.js';
import {freshWorld,RESIDENCE_PLACE} from '../worlds.js';
import {projectCameras,projectFaces} from '../project-view.js';
import {entityAt} from '../project-picking.js';
import {residentPoint,walkingClock,lunarSkyCamera,lunarCurvature,lunarSurfaceY} from '../scene-motion.js';
import {mapCharacterInfo,footballMoment,footballActors} from '../map-life.js';
import {actor,actorPose,createTraffic,MAX_ACTORS,RESIDENCE_DRIVER,vehicle,visitor} from '../scenery.js';

test('Touch cameras allow a closer look while overview and desktop framing stay unchanged',()=>{
  for (const id of ['city','moon','island','armor']) {
    const scene=projectScene(id,id==='armor'?7:{...freshWorld(()=>.45),order:[0],progress:3});
    const desktop=projectCameras(scene,null,true),touch=projectCameras(scene,null,true,{compact:true});
    assert.deepEqual(touch.initial,desktop.initial);
    assert.ok(touch.maxZoom>desktop.maxZoom*1.5);
    assert.ok(touch.detail.zoom>=desktop.detail.zoom);
    assert.equal(touch.detail.anchorX,desktop.detail.anchorX);
  }
});

test('Residents on every completed plot keep moving independently of the vehicle budget',()=>{
  for (const theme of ['city','moon','island']) {
    const scene=projectScene(theme,{...freshWorld(()=>.45),order:[0,1,4,7,18,19,24,25,26,27,28,29],progress:36});
    assert.ok(scene.ambient.length<=MAX_ACTORS);
    const residents=scene.parts.filter(part=>part.entity?.startsWith('resident:'));
    assert.ok(new Set(residents.map(part=>part.entity.split(':')[1])).size>=7);
    assert.ok(residents.every(part=>part.life?.every(Number.isFinite)));
    const person=residents[0];
    assert.notDeepEqual(residentPoint([person.x,person.y,person.z],person.life,0,0),residentPoint([person.x,person.y,person.z],person.life,0,2));
    assert.deepEqual(mapCharacterInfo(scene,person.entity),mapCharacterInfo(scene,person.entity));
    assert.ok(mapCharacterInfo(scene,person.entity).story.length>20);
  }
});

test('One driver at each residence takes the chosen profile name on the map',()=>{
  const map={...freshWorld(()=>6163/2**32),order:[0,3,RESIDENCE_PLACE],progress:9,residenceName:'Første navn'};
  for (const [theme,model,kind] of [['city','sport','human'],['island','classic','human'],['moon','hover','astronaut']]) {
    const scene=projectScene(theme,map);
    const drivers=scene.ambient.filter(actor=>actor.parts.some(part=>part.entity===RESIDENCE_DRIVER));
    assert.equal(drivers.length,1);
    assert.equal(drivers[0].vehicleModel,model);
    const riders=drivers[0].parts.filter(part=>part.characterKind);
    assert.ok(riders.length>0&&riders.every(part=>part.characterKind===kind));
    if (theme==='moon') assert.ok(riders.some(part=>part.color==='#e7b75a'));
    assert.equal(mapCharacterInfo(scene,RESIDENCE_DRIVER).name,'Første navn');
    assert.equal(mapCharacterInfo(scene,RESIDENCE_DRIVER,undefined,'Nytt navn').name,'Nytt navn');
    assert.equal(mapCharacterInfo(scene,RESIDENCE_DRIVER).sound,kind);
    const visible=projectFaces(scene).filter(face=>face.entity===RESIDENCE_DRIVER);
    assert.ok(visible.length>0&&visible.every(face=>face.group>=2));
  }
});

test('Picking follows moving figures and a foreground building occludes padded hit areas',()=>{
  const vertical=(key,x,z)=>({entity:key,landmark:typeof key==='number'?key:undefined,group:0,
    normal:[0,0,1],points:[[x-.4,0,z],[x+.4,0,z],[x+.4,1.5,z],[x-.4,1.5,z]]});
  const view={width:200,height:200,scale:20,camera:{yaw:0,pitch:Math.PI/4,x:0,y:0,center:0},
    effects:{age:0,growth:1,actors:[{x:2,y:0,z:0,cos:1,sin:0,stride:0,rollCos:1,rollSin:0}]}};
  const actor={...vertical('actor:0',0,0),group:2};
  assert.equal(entityAt([actor],view,140,90,12),'actor:0');
  assert.equal(entityAt([actor],view,119,90,12),null);
  assert.equal(entityAt([actor],view,129,90,12),'actor:0');
  const wall={...vertical(3,2,1),points:[[1,0,1],[3,0,1],[3,4,1],[1,4,1]]};
  assert.equal(entityAt([actor,wall],view,140,90,12),3);
  view.effects.actors[0].x=-2;
  assert.equal(entityAt([actor],view,60,90,12),'actor:0');
  assert.equal(entityAt([actor],view,140,90,12),null);
});

test('Curious walkers pause briefly and then continue along their existing path',()=>{
  const times=Array.from({length:700},(_,i)=>i*.1);
  const clocks=times.map(t=>walkingClock(t,{first:19.1,period:74,pause:3.6}));
  assert.ok(clocks.some(clock=>clock.thinking));
  for (let i=1;i<clocks.length;i++) assert.ok(clocks[i].time>=clocks[i-1].time-1e-8);
  assert.ok(clocks.at(-1).time>55);
  const stopped=clocks.findIndex((clock,i)=>i>0&&clock.thinking&&clocks[i-1].thinking);
  assert.ok(Math.abs(clocks[stopped].time-clocks[stopped-1].time)<1e-8);
  const sky=lunarSkyCamera({x:100,y:-40,anchorX:2,anchorZ:3,zoom:2},10,0);
  assert.ok(sky.x>0&&sky.x<20);
  assert.ok(sky.width>640&&sky.width<700);
});

test('Wondering walkers stop beside a real find and tell the child which one it was',()=>{
  for (const theme of ['city','moon','island']) {
    const scene=projectScene(theme,{...freshWorld(()=>.45),order:[0,1,2,3,4,5,6,7],progress:24});
    const index=scene.ambient.findIndex(actor=>actor.encounter);
    assert.ok(index>=0);
    const walker=scene.ambient[index], encounter=walker.encounter;
    const find=scene.discoveries[encounter.key];
    assert.ok(find);
    assert.ok(encounter.period>=62);
    const thinking=actorPose(walker,encounter.first+.4);
    assert.equal(thinking.thought,1);
    assert.ok(Math.hypot(thinking.x-find.x,thinking.z-find.z)<7.2);
    assert.equal(actorPose(walker,encounter.first+5).thought,0);
    const info=mapCharacterInfo(scene,`actor:${index}`,encounter.key);
    assert.equal(info.status,'Har oppdaget noe');
    assert.ok(info.story.includes(find.name));
    assert.notEqual(mapCharacterInfo(scene,`actor:${index}`).story,info.story);
  }
});

test('The moon curves gently at wide zoom and the centre stays level',()=>{
  assert.equal(lunarCurvature(2.3),0);
  assert.equal(lunarCurvature(.75),1);
  assert.equal(lunarSurfaceY(16,4,-11,1),4);
  assert.ok(lunarSurfaceY(105,4,0,1)<lunarSurfaceY(58,4,0,1));
  assert.equal(lunarSurfaceY(0,4,-105,1),lunarSurfaceY(105,4,0,1));
});

test('Football passes, a helmet bump and dizzy stars share the same small scene',()=>{
  const actors=footballActors({kind:'spaceField',index:18,x:0,y:0,z:0,yaw:0});
  const stars=actors.find(actor=>actor.kind==='football-stars');
  let hidden=0,visible=0;
  for (let seconds=0;seconds<54;seconds+=.1) {
    const state=footballMoment(seconds);
    assert.ok(state.players.flat().every(Number.isFinite));
    assert.ok(state.ball.every(Number.isFinite));
    assert.ok(Math.abs(state.ball[0])<3&&Math.abs(state.ball[2])<2);
    for (const actor of actors) assert.ok(Object.values(actorPose(actor,seconds)).every(Number.isFinite));
    actorPose(stars,seconds).y>0?visible++:hidden++;
  }
  assert.ok(hidden>visible*3&&visible>15);
  const bump=footballMoment(16.3);
  assert.equal(bump.stunned,true);
  assert.ok(Math.hypot(bump.ball[0]-bump.players[1][0],bump.ball[2]-bump.players[1][1])<.01);
  assert.ok(bump.ball[1]>1.3);
});

test('Moon visitors have different helmets and alien faces, and every new tower renders',()=>{
  for (const kind of ['astronaut','alien']) {
    const models=Array.from({length:4},(_,i)=>visitor(kind,'#8a9ab1',undefined,false,.83,i));
    assert.equal(new Set(models.map(model=>JSON.stringify(model))).size,4);
  }
  const map=freshWorld(()=>.45);
  for (const index of [5,6,8,10,11,13,14,29,31,45,46,47]) {
    const scene=worldBuildingPreview('moon',index,map);
    assert.ok(scene.parts.length>50);
    assert.ok(projectFaces(scene).every(face=>[...face.normal,...face.points.flat()].every(Number.isFinite)));
  }
  const scene=projectScene('moon',{...map,order:[0,1,18],progress:9});
  const bus=scene.ambient.findIndex(actor=>actor.lunarBus);
  assert.ok(bus>=0);
  assert.match(mapCharacterInfo(scene,`actor:${bus}`).name,/Kraterbussen/);
  assert.ok(projectFaces(scene).some(face=>face.entity===`actor:${bus}`));
});

test('Finds have reproducible locations and stories on each map and more appear as the map grows',()=>{
  for (const theme of ['city','moon','island']) {
    const map=freshWorld(()=>.45);
    const early=projectScene(theme,map);
    const later=projectScene(theme,{...map,order:[0,1,2,3,4,5,6,7,8,9,10,11],progress:36});
    const keys=Object.keys(later.discoveries);
    assert.ok(Object.keys(early.discoveries).length>=2);
    assert.ok(keys.some(key=>!early.discoveries[key]));
    for (const key of keys.filter(key=>early.discoveries[key])) {
      assert.deepEqual(later.discoveries[key],early.discoveries[key]);
      assert.deepEqual(later.parts.filter(part=>part.entity===key),early.parts.filter(part=>part.entity===key));
    }
    const find=later.parts.find(part=>part.entity===keys[0]);
    assert.equal(mapCharacterInfo(later,find.entity).status,'Kartfunn');
    const faces=projectFaces({...later,ambient:[],parts:later.parts.filter(part=>part.entity===find.entity)});
    assert.ok(faces.length>10&&faces.every(face=>face.entity===find.entity&&face.points.flat().every(Number.isFinite)));
    if (theme==='moon') {
      const peeker=later.ambient.find(actor=>actor.peeking);
      const poses=Array.from({length:80},(_,i)=>actorPose(peeker,i*.5));
      assert.ok(poses.some(pose=>pose.y> -150)&&poses.some(pose=>pose.y< -150));
      assert.ok(later.parts.some(part=>part.entity?.startsWith('discovery:')&&part.life?.[3]< -1));
    }
  }
});

test('Three crossing routes clear their queue and a waiting hovercar stops its flame',()=>{
  const paths=[
    [[-12,0],[12,0],[12,16],[-12,16]],
    [[0,-12],[0,12],[-16,12],[-16,-12]],
    [[-12,-12],[12,12],[18,4],[-4,-18]],
  ];
  const kinds=['road','bus','hover'];
  const cars=paths.map((path,i)=>actor(vehicle(i===1?'bus':'car','#809090'),path,{
    kind:kinds[i],speed:2.4+i*.23,ground:0,phase:((7+i*3)%19)*.014,
  }));
  const traffic=createTraffic(cars,[{x:0,z:0}]);
  let previous=traffic(0),hoverWaited=false;
  const held=[0,0,0],travel=[0,0,0];
  for (let frame=1;frame<2400;frame++) {
    const poses=traffic(frame/30);
    poses.forEach((pose,i)=>{
      const step=Math.hypot(pose.x-previous[i].x,pose.z-previous[i].z);
      travel[i]+=step;
      held[i]=step<1e-6?held[i]+1:0;
      assert.ok(held[i]<105,'a vehicle must get through the junction within a few seconds');
      if (i===2&&held[i]>2) {
        assert.equal(pose.thrust,0);
        hoverWaited=true;
      }
      for (const other of poses.slice(i+1)) assert.ok(Math.hypot(other.x-pose.x,other.z-pose.z)>1.3);
    });
    previous=poses;
  }
  assert.ok(hoverWaited&&travel.every(distance=>distance>150));
});

test('A temporary road closure stops a line of vehicles, cues a horn and releases the queue',()=>{
  const path=[[0,0],[36,0],[36,14],[0,14]];
  const cars=[.09,.046,0].map((phase,i)=>actor(vehicle(i?'car':'bus','#799da6'),path,{
    kind:i?'road':'bus',ground:0,speed:2.6+i*.2,phase,
  }));
  const closure={roadwork:true,x:23,y:0,z:0,dx:1,dz:0,start:.8,period:200,duration:14};
  const run=createTraffic(cars,[],[],[closure]);
  let previous=run(0);
  const waited=new Set(),horns=new Set(),cleared=new Set();
  for (let frame=1;frame<960;frame++) {
    const seconds=frame/30,poses=run(seconds);
    poses.forEach((pose,i)=>{
      const last=previous[i];
      if (seconds>6&&seconds<13.3&&pose.x>3&&pose.x<23&&Math.abs(pose.z)<.4
        &&Math.hypot(pose.x-last.x,pose.z-last.z)<.00001) waited.add(i);
      if (pose.cue==='queue-horn') horns.add(i);
      if (seconds>16&&pose.x>26&&Math.abs(pose.z)<.4) cleared.add(i);
    });
    previous=poses;
  }
  assert.equal(waited.size,3);
  assert.ok(horns.size>=1);
  assert.equal(cleared.size,3);
});

test('A hovercar passes a slower bus on a clear stretch and toots during some passes',()=>{
  const path=[[0,0],[45,0],[45,18],[0,18]];
  const bus=actor(vehicle('bus','#799da6'),path,{kind:'bus',ground:0,speed:1.9,phase:.07});
  const hover=actor(vehicle('hover','#d590af'),path,{kind:'hover',ground:.2,speed:3.3,phase:.02});
  const traffic=createTraffic([bus,hover]);
  let climbed=false,passed=false,horn=false;
  for (let i=0;i<3600;i++) {
    const [b,h]=traffic(i/30);
    if (h.y>1.9) climbed=true;
    if (climbed&&h.y<.5&&h.z<2&&b.z<2&&h.x>b.x+2) passed=true;
    if (h.cue==='horn') horn=true;
    if (Math.abs(b.y-h.y)<1.65) assert.ok(Math.hypot(b.x-h.x,b.z-h.z)>1.4);
  }
  assert.ok(climbed&&passed&&horn);
});
