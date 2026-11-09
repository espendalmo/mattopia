import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, restoreState } from '../core.js';
import { selectRewardMode, prepareReward, awardPractice } from '../rewards.js';
import { PROJECTS, projectScene, worldBuilding, worldBuildingOptions, worldBuildingPreview } from '../projects.js';
import { projectFaces, buildMotion, projectCameras, finishTransition } from '../project-view.js';
import { actor, actorPose, createTraffic, vehicle, MAX_ACTORS, pointOnSite } from '../scenery.js';
import { AIRPORT_HELIPAD } from '../transport.js';
import {landmarkAt} from '../project-picking.js';
import {seasonForDate} from '../seasons.js';
import { WORLD_IDS, WORLD_PLACES, REGION_PLACES, REGION_CATALOG_PLACES, GRAND_REGION_PLACES, GRAND_REGION_CATALOG, RAIL_PLACE, currentWorld, freshWorld, startNewWorld, worldAdvance, worldChoices, worldCompletedPlaces, worldLayout, worldSelect, worldStatus } from '../worlds.js';
import {planRegion,regionLayout,regionSurface,regionVisibility,riverAt,riverWidth} from '../regions.js';
import {planStreetRegion,STREET_TURN_RADIUS} from '../street-grid.js';
import {regionRoads,roundedStreetPaths} from '../region-roads.js';

test('A completed round adds one step to the selected project and preserves other rewards', () => {
  let state = freshState();
  const earn = (mode, id) => {
    state = selectRewardMode(state,mode);
    state = prepareReward({...state,roundsCompleted:state.roundsCompleted+1});
    const result = awardPractice(state,id);
    state = result.state;
    assert.equal(awardPractice(state,id).reward,null);
    return result.reward;
  };
  earn('plant','plant-1');
  earn('bricks','brick-1');
  assert.deepEqual(earn('armor','hero-1'),{mode:'armor',completed:1,added:true});
  earn('city','city-1');
  assert.deepEqual(earn('armor','hero-2'),{mode:'armor',completed:2,added:true});
  const restored = restoreState(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.rewardMode,'armor');
  assert.equal(restored.projects.armor,2);
  assert.equal(currentWorld(restored,'armor'),null);
  assert.equal(worldStatus(currentWorld(restored,'city')).completed,1);
  assert.equal(restored.projects.moon,0);
  assert.equal(restored.garden.stage,1);
  assert.equal(restored.brickBuild.pieces,1);
});

test('Every stage visibly adds geometry and each world or hero can be finished', () => {
  for (const [id,project] of Object.entries(PROJECTS)) {
    let earlier = projectScene(id,0);
    assert.ok(earlier.parts.length>0);
    for (let step=1;step<=project.total;step++) {
      const scene = projectScene(id,step);
      assert.equal(scene.last,earlier.next);
      assert.ok(scene.parts.length>earlier.parts.length);
      assert.deepEqual(scene.parts.slice(0,earlier.parts.length),earlier.parts);
      assert.deepEqual(scene.latest,scene.parts.slice(earlier.parts.length));
      earlier=scene;
    }
    assert.equal(earlier.next,undefined);
    const mesh=projectFaces(earlier);
    assert.ok(mesh.every(face=>[...face.normal,...face.color,...face.points.flat()].every(Number.isFinite)));
    assert.ok(mesh.some(face=>face.group===1));
    assert.equal(mesh.some(face=>face.group===2),earlier.world);
  }
});

test('A finished project stays finished and legacy profiles start projects from zero', () => {
  const old = restoreState({version:1,roundsCompleted:17,rewardMode:'bricks'});
  assert.equal(old.rewardMode,'bricks');
  assert.ok(Object.values(old.projects).every(value=>value===0));
  const raw={...freshState(),roundsCompleted:122,rewardMode:'city',projects:{city:125,moon:-1,island:'2'}};
  const restored=restoreState(raw);
  assert.equal(restored.projects.city,120);
  assert.equal(restored.projects.moon,0);
  assert.equal(restored.projects.island,0);
  const result=awardPractice(restored,'later-round');
  assert.deepEqual(result.reward,{mode:'city',map:currentWorld(restored,'city'),completed:120,added:false});
  assert.equal(result.state.projects.city,120);
});

test('A 1.14 world keeps its landscape, selected landmark and expansion order', () => {
  for (const id of WORLD_IDS) {
    const initial={seed:1546188226,legacy:0,order:[],progress:0};
    let state=restoreState({...freshState(),worlds:{[id]:[initial]}});
    const options=worldBuildingOptions(id,initial);
    assert.equal(options.length,3);
    assert.equal(new Set(options).size,3);
    let map=worldSelect(initial,options[1]);
    assert.deepEqual(worldBuildingOptions(id,map),[]);
    assert.equal(worldStatus(map).building,options[1]);
    assert.deepEqual(projectScene(id,initial).parts,projectScene(id,map).parts);
    for (let step=1;step<=3;step++) {
      map=worldAdvance(map);
      assert.equal(worldStatus(map).completed,step);
      assert.equal(worldStatus(map).built,Number(step===3));
      assert.equal(Boolean(projectScene(id,map).finished),step===3);
    }
    const expanded=worldAdvance(worldSelect(map,worldBuildingOptions(id,map)[1]));
    assert.ok(projectScene(id,expanded).size>projectScene(id,map).size);
    assert.deepEqual(expanded.order.slice(0,1),map.order);
    while (!worldStatus(map).full) map=worldAdvance(map);
    assert.equal(worldStatus(map).completed,3*WORLD_PLACES);
    state=restoreState({...state,roundsCompleted:3*WORLD_PLACES,worlds:{[id]:[map]}});
    state=startNewWorld(state,id,()=>.36);
    state=restoreState(JSON.parse(JSON.stringify(state)));
    assert.deepEqual(state.worlds[id][0],map);
    const next=currentWorld(state,id);
    assert.equal(next.layout,3);
    assert.equal(worldStatus(next).capacity,GRAND_REGION_PLACES);
    assert.notEqual(next.seed,initial.seed);
    assert.notDeepEqual(worldLayout(id,next.seed),worldLayout(id,initial.seed));
    assert.equal(worldStatus(next).built,0);
  }
});

test('The same terrain becomes visible as an irregular road network reaches new landmarks', () => {
  for (const theme of WORLD_IDS) {
    const seed=38796217;
    const layout=regionLayout(theme,seed);
    const map={...freshWorld(),seed,order:[]};
    const route=Array.from({length:REGION_PLACES},(_,index)=>({index,kind:worldBuilding(theme,index,map).kind}));
    const early=planRegion(layout,route.slice(0,1));
    const late=planRegion(layout,route);
    assert.equal(late.plots.length,REGION_PLACES);
    assert.deepEqual(late.plots[0],early.plots[0]);
    assert.deepEqual(late.paths[0],early.paths[0]);
    assert.ok(new Set(late.plots.map(plot=>plot.yaw)).size>3,theme);
    const farthest=late.plots.find(({x,z})=>regionVisibility(early,x,z)===0);
    assert.ok(farthest,theme);
    assert.equal(regionVisibility(late,farthest.x,farthest.z),1);
    assert.ok(late.paths.some(path=>path.slice(1).some(({x,z},i)=>Math.abs(x-path[i].x)>.4&&Math.abs(z-path[i].z)>.4)));
    assert.notDeepEqual(regionLayout(theme,seed+1).sites,layout.sites);
  }
});

test('New maps begin with a connected street loop and reveal more grid streets as buildings are placed', () => {
  for (const id of WORLD_IDS) {
    const map={...freshWorld(),seed:38796217};
    const layout=regionLayout(id,map.seed);
    const start=planStreetRegion(layout,[]);
    assert.equal(start.paths.length,4);
    assert.equal(start.circuits[0].length,4);
    assert.equal(new Set(start.circuits[0].map(node=>node.id)).size,4);
    const first=worldBuildingOptions(id,map)[0];
    const ordinary=[first,...Array.from({length:REGION_PLACES},(_,i)=>i).filter(i=>i!==first)].slice(0,8);
    const order=ordinary.map(index=>({index,kind:worldBuilding(id,index,map).kind})).filter(item=>!layout.berths[item.kind]);
    const early=planStreetRegion(layout,order.slice(0,1));
    const advanced=planStreetRegion(layout,order);
    assert.deepEqual(advanced.plots[0],early.plots[0]);
    assert.ok(advanced.paths.length>start.paths.length);
    assert.ok(advanced.plots.every(plot=>[0,-Math.PI/2].includes(plot.yaw)));
    assert.ok(advanced.paths.every(path=>path.every(point=>point.x===path[0].x||point.z===path[0].z)));
    const vehicle=projectScene(id,map).ambient.find(actor=>actor.kind==='road');
    const poses=[0,2.5,5,7.5,10,12.5,15,17.5,20].map(time=>actorPose(vehicle,time));
    assert.ok(new Set(poses.map(pose=>Math.round(pose.x))).size>=3);
    assert.ok(new Set(poses.map(pose=>Math.round(pose.z))).size>=3);
    const saved=restoreState({...freshState(),worlds:{[id]:[map]}});
    assert.equal(currentWorld(saved,id).layout,3);
  }
});

test('Street bends meet the straight lanes and their dashes follow the curve', () => {
  const layout=regionLayout('city',6163);
  const plan=planStreetRegion(layout,[]);
  const paths=roundedStreetPaths(plan);
  const corner=plan.junctions[0],curve=paths[4];
  const [a,b]=[curve[0],curve.at(-1)];
  for (const point of [a,b]) {
    assert.ok(Math.abs(Math.hypot(point.x-corner.x,point.z-corner.z)-STREET_TURN_RADIUS)<1e-8);
    assert.ok(paths.slice(0,4).some(path=>[path[0],path.at(-1)].some(end=>Math.hypot(point.x-end.x,point.z-end.z)<1e-8)));
  }
  const marks=regionRoads(layout,{paths:[curve]}).filter(part=>part.layer===5);
  assert.ok(marks.length>=3);
  const headings=marks.map(({outline:[a,b]})=>Math.atan2(b[2]-a[2],b[0]-a[0]));
  assert.ok(Math.abs(headings[0]-headings.at(-1))>.2);
});

test('An automatic river crossing has a separate deck, rails and piers', () => {
  const layout=regionLayout('city',6163);
  const z=layout.berths.bridge.z+23,x=riverAt(layout,z);
  const path=Array.from({length:19},(_,i)=>({x:x+i-9,z}));
  const parts=regionRoads(layout,{paths:[path]});
  const deck=parts.filter(part=>part.color==='#9f8775');
  assert.ok(deck.length>=4);
  assert.ok(deck.every(part=>part.layer===4&&Math.abs(part.x-x)<riverWidth(layout,z)+2));
  assert.ok(parts.some(part=>part.color==='#647686'));
  assert.ok(parts.some(part=>part.shape==='beam'&&part.color==='#efdbc2'));
  assert.ok(parts.some(part=>part.color==='#997f78'&&part.y<=0));
});

test('A construction site shows its neighborhood and only a finished ride animates', () => {
  const map={layout:3,legacy:0,seed:31803,order:[18,19],progress:2};
  const building=projectScene('island',map);
  const finished=projectScene('island',{...map,progress:3});
  assert.ok(building.parts.some(part=>part.color==='#bf8651'));
  assert.ok(!finished.parts.some(part=>part.color==='#bf8651'));
  assert.ok(!building.ambient.some(actor=>actor.kind==='wheel'));
  const wheel=finished.ambient.find(actor=>actor.kind==='wheel');
  assert.ok(wheel.parts.some(part=>part.hinge));
  assert.notEqual(actorPose(wheel,.3).rollSin,actorPose(wheel,2).rollSin);
  const tracks=projectScene('island',{...map,progress:6}).ambient.filter(actor=>actor.kind==='coaster');
  assert.equal(tracks.length,2);
  assert.notEqual(actorPose(tracks[0],.3).y,actorPose(tracks[0],2).y);
  const before=projectCameras(building),after=projectCameras(finished);
  assert.equal(before.detail.zoom,before.context.zoom);
  const result=projectCameras(building,null,true);
  assert.equal(result.detail.zoom,result.maxZoom);
  assert.equal(result.detail.anchorX,building.latestTarget.x);
  assert.equal(result.detail.anchorZ,building.latestTarget.z);
  assert.ok(after.detail.zoom>after.context.zoom);
  assert.equal(after.detail.yaw,before.detail.yaw);
  assert.equal(projectCameras(projectScene('armor',4)).initial.yaw,projectScene('armor',4).yaw);
  assert.equal(finishTransition(0).travel,0);
  assert.equal(finishTransition(1800).travel,1);
  assert.ok(finishTransition(650).opacity<1);
});

test('Late horizons extend the world mesh, with edges blending into the background', () => {
  const order=Array.from({length:REGION_PLACES},(_,i)=>i);
  for (const id of WORLD_IDS) {
    const map={layout:3,legacy:0,seed:6163,order,progress:54};
    const outerTerrain=scene=>scene.parts.filter(part=>part.layer===0&&part.outline.some(([x,,z])=>Math.max(Math.abs(x),Math.abs(z))>80));
    assert.equal(outerTerrain(projectScene(id,map)).length,0);
    const late=projectScene(id,{...map,progress:72});
    const outer=outerTerrain(late);
    assert.ok(outer.length>0);
    const sky=late.background.slice(1).match(/../g).map(channel=>parseInt(channel,16)/255);
    assert.ok(outer.some(part=>part.colors.some(color=>color.every((value,i)=>value===sky[i]))));
    assert.ok(outer.some(part=>part.colors.some(color=>color.some((value,i)=>Math.abs(value-sky[i])>.03))));
    if (id==='city') assert.ok(outer.some(part=>part.outline.some(([,y])=>y>8)));
    if (id==='moon') assert.ok(late.parts.some(part=>part.layer===-1&&part.y>15));
  }
});

test('The city pier and red bridge are sited on the river, and the boat arrives after the pier', () => {
  const id='city',seed=38796217,order=[16,5,22,20,21,23];
  const map={layout:2,legacy:0,seed,order,progress:11};
  assert.ok(!projectScene(id,map).ambient.some(actor=>actor.kind==='boat'));
  const completed={...map,progress:12};
  const scene=projectScene(id,completed);
  assert.ok(scene.ambient.some(actor=>actor.kind==='boat'));
  assert.deepEqual(worldCompletedPlaces(completed),order.slice(0,4));
  assert.equal(scene.finished,'Elvebrygga');
  const layout=regionLayout(id,seed);
  const bridge=scene.landmarks[22],pier=scene.landmarks[20];
  assert.equal(bridge.x,riverAt(layout,bridge.z));
  assert.ok(bridge.span>2*riverWidth(layout,bridge.z));
  assert.equal(regionSurface(layout,pier.x+3.1*Math.sin(pier.yaw),pier.z+3.1*Math.cos(pier.yaw)).water,true);
  assert.ok(projectScene(id,{...map,progress:18}).ambient.length>scene.ambient.length);
});

test('The expanded catalog offers 36 buildings and can finish with any 24 land plots', () => {
  for (const id of WORLD_IDS) {
    const seed=6163;
    const empty={...freshWorld(()=>seed/2**32),catalog:2};
    assert.equal(worldChoices(empty).length,REGION_CATALOG_PLACES);
    const layout=regionLayout(id,seed);
    const land=worldChoices(empty).filter(index=>!layout.berths[worldBuilding(id,index,empty).kind]);
    const order=land.slice(0,REGION_PLACES);
    const early=projectScene(id,{...empty,order:order.slice(0,1),progress:3});
    let map=empty;
    for (const index of order) {
      map=worldSelect(map,index);
      for (let step=0;step<3;step++) map=worldAdvance(map);
    }
    assert.equal(worldStatus(map).full,true);
    assert.equal(worldStatus(map).completed,72);
    assert.equal(worldChoices(map).length,0);
    assert.equal(worldSelect(map,land.at(-1)),map);
    const restored=currentWorld(restoreState({...freshState(),roundsCompleted:72,worlds:{[id]:[map]}}),id);
    assert.deepEqual(restored,map);
    const complete=projectScene(id,restored);
    assert.equal(Object.keys(complete.landmarks).length,REGION_PLACES);
    assert.deepEqual(complete.landmarks[order[0]],early.landmarks[order[0]]);
    assert.ok(complete.ambient.length<=MAX_ACTORS);
    for (let index=REGION_PLACES;index<REGION_CATALOG_PLACES;index++) {
      const preview=worldBuildingPreview(id,index,empty);
      assert.ok(preview.parts.length);
      assert.ok(projectFaces(preview).every(face=>[...face.normal,...face.points.flat()].every(Number.isFinite)));
    }
    const {catalog,...old}=empty;
    assert.equal(worldChoices(old).length,REGION_PLACES);
    assert.equal(worldBuilding(id,24,old),null);
    if (id==='city') assert.notEqual(worldBuilding(id,2,old).kind,worldBuilding(id,2,empty).kind);
  }
});

test('Finished launch sites animate a craft out of view and back, with flame only during rocket flight', () => {
  const empty=freshWorld(()=>6163/2**32);
  for (const [id,index,kind] of [['moon',27,'rocket'],['island',25,'plane']]) {
    const map={...empty,order:[index]};
    const building=projectScene(id,{...map,progress:2});
    assert.ok(!building.ambient.some(actor=>actor.kind===kind));
    const done=projectScene(id,{...map,progress:3});
    const craft=done.ambient.find(actor=>actor.kind===kind);
    assert.ok(craft?.parts.length);
    assert.ok(!done.parts.some(part=>part.flight));
    const onPad=actorPose(craft,0);
    assert.ok(actorPose(craft,(kind==='plane'?6.6:5.65)+craft.delay).y>onPad.y+10);
    assert.ok(actorPose(craft,9+craft.delay).y<0);
    assert.ok(actorPose(craft,(kind==='plane'?14.4:13)+craft.delay).y>onPad.y+10);
    if (kind==='rocket') {
      assert.deepEqual(actorPose(craft,19+craft.delay),onPad);
      const flame=done.ambient.find(actor=>actor.kind==='rocket-flame');
      assert.ok(flame?.parts.length);
      assert.ok(actorPose(flame,0).y<0);
      assert.ok(actorPose(flame,5+craft.delay).y>0);
      assert.ok(actorPose(flame,19+craft.delay).y<0);
      assert.ok(done.parts.some(part=>part.layer===1.4));
    } else {
      const roll=actorPose(craft,5.29+craft.delay),landing=actorPose(craft,17.4+craft.delay);
      const parked=actorPose(craft,20.6+craft.delay);
      assert.equal(roll.y,onPad.y);
      assert.equal(landing.y,onPad.y);
      assert.equal(parked.y,onPad.y);
      assert.ok(Math.hypot(onPad.x-roll.x,onPad.z-roll.z)>10);
      assert.ok(Math.hypot(landing.x-parked.x,landing.z-parked.z)>10);
      assert.ok(Math.hypot(parked.x-actorPose(craft,30+craft.delay).x,parked.z-actorPose(craft,30+craft.delay).z)<.001);
    }
  }
});

test('The new street is revealed before the foundation grows, with the earlier parcel kept in place', () => {
  const empty=freshWorld(()=>6163/2**32);
  const map={...empty,order:[24,16],progress:3};
  const park=projectScene('city',map,'summer');
  const scene=projectScene('city',{...map,progress:4},'summer');
  assert.deepEqual(scene.landmarks[24],park.landmarks[24]);
  assert.equal(scene.roadBuild,true);
  const newRoad=scene.parts.filter(part=>part.roadBuild!==undefined);
  assert.ok(newRoad.some(part=>part.layer===4));
  assert.ok(new Set(newRoad.map(part=>part.roadBuild)).size>3);
  const early=buildMotion(true,240,0,3,true,scene.roadBuild);
  assert.ok(early.road>0&&early.road<1);
  assert.equal(early.growth,0);
  const late=buildMotion(true,1040,0,3,true,scene.roadBuild);
  assert.equal(late.road,1);
  assert.ok(late.growth>.1);
  assert.equal(scene.sites[16].built,false);
  const support=park.parts.find(part=>part.landmark===24&&part.support);
  assert.equal(support.outline.length,16);
  const stones=park.parts.filter(part=>part.landmark===24&&part.shape==='terrain'&&part.layer>7);
  assert.ok(stones.length>0);
  assert.ok(new Set(stones.map(part=>part.color)).size>1);
});

test('Tapping a projected building picks the nearest visible face', () => {
  const facade=(id,z,group=0)=>({landmark:id,group,normal:[0,0,1],points:[[-1,-1,z],[1,-1,z],[1,1,z],[-1,1,z]]});
  const view={width:100,height:100,scale:10,camera:{yaw:0,pitch:0,x:0,y:0,center:0},effects:{ground:0,growth:1,lift:0}};
  const faces=[facade(0,2),facade(7,5,1)];
  assert.equal(landmarkAt(faces,view,51,53),7);
  assert.equal(landmarkAt(faces,view,85,50),null);
  assert.equal(landmarkAt(faces,{...view,effects:{...view.effects,growth:0}},51,53),0);
});

test('Seasons follow the local date and do not change plot placement', () => {
  const dates=[[0,14,'winter'],[3,2,'easter'],[4,13,'spring'],[6,11,'summer'],[8,11,'autumn'],[9,29,'halloween'],[11,12,'christmas']];
  for (const [month,day,expected] of dates) assert.equal(seasonForDate(new Date(2026,month,day,12)),expected);
  const map={...freshWorld(()=>6163/2**32),order:[24],progress:3};
  const summer=projectScene('city',map,'summer'),winter=projectScene('city',map,'winter');
  assert.deepEqual(summer.landmarks,winter.landmarks);
  assert.notDeepEqual(summer.parts.find(part=>part.layer===0).colors,winter.parts.find(part=>part.layer===0).colors);
});

test('A bus starts at the finished terminal and swimmers and scooters stay in the sea', () => {
  const seed=6163,empty=freshWorld(()=>seed/2**32);
  const city={...empty,order:[26],progress:2};
  assert.ok(!projectScene('city',city).ambient.some(actor=>actor.kind==='bus'));
  const bus=projectScene('city',{...city,progress:3}).ambient.find(actor=>actor.kind==='bus');
  assert.ok(bus?.route.length>15);
  assert.notEqual(actorPose(bus,0).x,actorPose(bus,8).x);
  const order=[25,27,28,7,17,24];
  const island=projectScene('island',{...empty,order,progress:order.length*3});
  const shore=island.ambient.filter(actor=>['swimmer','jetski'].includes(actor.kind));
  assert.ok(shore.some(actor=>actor.kind==='swimmer'));
  assert.ok(shore.some(actor=>actor.kind==='jetski'));
  const layout=regionLayout('island',seed);
  for (const actor of shore) {
    for (let t=0;t<16;t+=.2) {
      const {x,z}=actorPose(actor,t);
      assert.equal(regionSurface(layout,x,z).water,true);
    }
  }
});

test('All new landmark models render and every building is recoverable for the gallery', () => {
  for (const id of WORLD_IDS) {
    const map={layout:2,legacy:0,seed:1987,order:Array.from({length:REGION_PLACES},(_,i)=>i),progress:72};
    const saved=restoreState({...freshState(),roundsCompleted:72,worlds:{[id]:[map]}});
    const restored=currentWorld(saved,id);
    assert.deepEqual(restored,map);
    assert.equal(worldStatus(restored).full,true);
    for (const index of worldCompletedPlaces(restored)) {
      const thumb=worldBuildingPreview(id,index,restored);
      assert.ok(thumb.parts.length>0);
      assert.ok(projectFaces(thumb).every(face=>[...face.normal,...face.points.flat()].every(Number.isFinite)));
    }
    const scene=projectScene(id,restored);
    assert.equal(Object.keys(scene.landmarks).length,REGION_PLACES);
    for (const actor of scene.ambient) {
      assert.ok([0,.4,1.6,8.4].every(time=>Object.values(actorPose(actor,time)).every(Number.isFinite)));
    }
  }
});

test('An existing landmark stays in place and a partly built one finishes before the next choice', () => {
  const state=restoreState({...freshState(),roundsCompleted:12,projects:{city:12}});
  const map=currentWorld(state,'city');
  const initial=projectScene('city',map);
  assert.deepEqual(initial.parts,projectScene('city',12).parts);
  assert.equal(worldStatus(map).built,1);
  assert.deepEqual(worldBuildingOptions('city',map),[]);
  const completed=worldAdvance(map);
  const scene=projectScene('city',completed);
  assert.deepEqual(scene.parts.slice(0,initial.parts.length),initial.parts);
  assert.equal(worldStatus(completed).built,2);
  assert.ok(scene.finished);
  assert.ok(worldBuildingOptions('city',completed).every(index=>index>=2));
});

function onLand([x,,z], outline) {
  let inside=false;
  for (let i=0,j=outline.length-1;i<outline.length;j=i++) {
    const [a,,b]=outline[i], [c,,d]=outline[j];
    if ((b>z)!==(d>z) && x<(c-a)*(z-b)/(d-b)+a) inside=!inside;
  }
  return inside;
}

test('Seeded lots expand along adjacent roads and landmark geometry stays on land', () => {
  for (const id of WORLD_IDS) {
    for (const seed of [11,37,983]) {
      const {lots}=worldLayout(id,seed);
      assert.ok(lots.every((lot,i)=>i===0||lots.slice(0,i).some(previous=>
        Math.abs(previous.col-lot.col)+Math.abs(previous.row-lot.row)===1)));
      const map={seed,legacy:0,order:lots.map((_,i)=>i),progress:3*WORLD_PLACES};
      const scene=projectScene(id,map);
      const land=scene.parts.find(part=>part.shape==='landscape'&&part.y===(id==='island'?.45:0));
      const landmarks=scene.parts.filter(part=>part.layer===undefined&&part.shape!=='landscape');
      for (const {points} of projectFaces({parts:landmarks})) {
        assert.ok(points.every(point=>onLand(point,land.outline)),`${id} seed ${seed}`);
        if (id==='city') assert.ok(points.every(([x])=>Math.abs(x)>4.9),`river, seed ${seed}`);
      }
    }
  }
});

test('Every world landmark and decoration stays on land, without brick studs', () => {
  for (const id of ['city','moon','island']) {
    const start=projectScene(id,0);
    const land=start.parts.find(part=>part.shape==='landscape'&&part.y===(id==='island'?.45:0));
    const scene=projectScene(id,PROJECTS[id].total);
    const structures=scene.parts.slice(start.parts.length);
    assert.ok(structures.every(part=>!part.studs),id);
    for (const {points} of projectFaces({parts:structures})) {
      assert.ok(points.every(point=>onLand(point,land.outline)),id);
      if (id==='city') assert.ok(points.every(([x,,z])=>Math.abs(x-.82*Math.sin(z*.095))>=3.7));
    }
    const milestones=Array.from({length:PROJECTS[id].total},(_,i)=>projectScene(id,i+1).finished);
    assert.equal(milestones.filter(Boolean).length,40,id);
    assert.equal(milestones[4],null,id);
    assert.ok(milestones[5],id);
  }
});

test('New world geometry starts at its support height and grows to its exact final height', () => {
  const ground=2.4, top=4.9;
  const times=[0,150,300,500,850,1400];
  const samples=times.map(time=>buildMotion(true,time,ground,top,true));
  assert.ok(samples[0].growth<.02);
  assert.equal(samples.at(-1).growth,1);
  assert.ok(samples.every(({ground:base,lift,growth},i)=>base===ground&&lift===0&&
    (i===0||growth>=samples[i-1].growth)));
  assert.ok(samples.some(({sweep})=>sweep>ground&&sweep<top));
  assert.equal(buildMotion(true,Infinity,ground,top,true).growth,1);
  assert.ok(buildMotion(false,0,ground,top,true).lift>0,'hero parts still drop into place');
});

test('World actors turn and follow their routes with finite poses', () => {
  for (const id of ['city','moon','island']) {
    const {ambient}=projectScene(id,0);
    for (const actor of ambient) {
      const poses=Array.from({length:220},(_,i)=>actorPose(actor,i*.4));
      assert.ok(poses.every(pose=>Object.values(pose).every(Number.isFinite)));
      assert.ok(new Set(poses.map(pose=>Math.round(pose.x*10))).size>2);
      assert.ok(new Set(poses.map(pose=>Math.round(pose.z*10))).size>2);
      assert.ok(new Set(poses.map(pose=>Math.round(pose.sin*10))).size>2);
      if (actor.kind==='walk') assert.ok(poses.some(pose=>pose.stride>0));
    }
  }
  const car=projectScene('city',0).ambient[0];
  const poses=Array.from({length:280},(_,i)=>actorPose(car,i*.12));
  assert.ok(poses.every(({x,z})=>Math.min(Math.abs(Math.abs(x)-16),Math.abs(z),Math.abs(z-11))<1));
});

test('Train and monorail are build choices that open a route only after the station is complete',()=>{
  for (const [theme,kind] of [['city','train'],['moon','monorail']]) {
    const base={...freshWorld(()=>6163/2**32),order:[0,3],progress:6};
    assert.ok(!worldBuildingOptions(theme,{...base,order:[0],progress:3}).includes(RAIL_PLACE));
    assert.equal(worldBuildingOptions(theme,base)[0],RAIL_PLACE);
    const selected=worldSelect(base,RAIL_PLACE,theme);
    assert.notEqual(selected,base);
    let map=selected;
    for (let step=1;step<=3;step++) {
      map=worldAdvance(map,theme);
      const scene=projectScene(theme,map);
      assert.equal(scene.sites[RAIL_PLACE].built,step===3);
      assert.equal(scene.ambient.some(item=>item.kind===kind),step===3);
      assert.equal(scene.landmarks[0].x,projectScene(theme,base).landmarks[0].x);
    }
    const scene=projectScene(theme,map);
    const train=scene.ambient.find(item=>item.kind===kind);
    const carriage=scene.ambient.find(item=>item.kind==='train-car');
    assert.ok(carriage&&Math.hypot(actorPose(train,0).x-actorPose(carriage,0).x,actorPose(train,0).z-actorPose(carriage,0).z)>2.8);
    const trip=Array.from({length:340},(_,i)=>actorPose(train,i*.25));
    assert.ok(trip.some(point=>point.sound&&point.y>0));
    assert.ok(trip.some(point=>point.y<-500),'the train leaves the visible map');
    assert.ok(trip.some(point=>point.y>0&&Math.hypot(point.x-trip[0].x,point.z-trip[0].z)>10),'the train leaves the station');
    const travel=trip.reduce((sum,point,i)=>i&&point.y>0&&trip[i-1].y>0
      ?sum+Math.hypot(point.x-trip[i-1].x,point.z-trip[i-1].z):sum,0);
    assert.ok(travel>80,'the route travels through multiple blocks');
    assert.ok(trip.some(point=>point.y>0&&Math.abs(point.sin)>.94)&&trip.some(point=>point.y>0&&Math.abs(point.cos)>.94),
      'the train turns along both street axes');
    assert.ok(projectFaces(scene).every(face=>[...face.normal,...face.points.flat()].every(Number.isFinite)));
    const state=restoreState({...freshState(),roundsCompleted:9,worlds:{[theme]:[map]}});
    assert.deepEqual(worldCompletedPlaces(currentWorld(state,theme)),[0,3,RAIL_PLACE]);
    assert.ok(!worldChoices(currentWorld(state,theme),theme).includes(RAIL_PLACE));
    const previousCatalog={...base,layout:2,catalog:undefined};
    assert.ok(worldChoices(previousCatalog,theme).includes(RAIL_PLACE));
  }
  const island={...freshWorld(()=>.27),order:[0,3],progress:6};
  assert.ok(!worldChoices({...island,catalog:2},'island').includes(RAIL_PLACE));
  assert.ok(worldChoices(island,'island').includes(RAIL_PLACE));
});

test('The city helicopter circles and the island helicopter lands only on a completed airport',()=>{
  const city={...freshWorld(()=>.39),order:[0,3],progress:6};
  assert.ok(!projectScene('city',{...city,progress:3}).ambient.some(item=>item.kind==='helicopter'));
  const cityHelicopter=projectScene('city',city).ambient.find(item=>item.kind==='helicopter');
  assert.ok(actorPose(cityHelicopter,12).y>10);
  assert.notEqual(actorPose(cityHelicopter,12).z,actorPose(cityHelicopter,18).z);
  assert.ok(actorPose(cityHelicopter,42).y<0);
  const map={...freshWorld(()=>.39),order:[25],progress:3};
  assert.ok(!projectScene('island',{...map,progress:2}).ambient.some(item=>item.kind==='helicopter'));
  const scene=projectScene('island',map);
  const helicopter=scene.ambient.find(item=>item.kind==='helicopter');
  const rotor=scene.ambient.find(item=>item.kind==='helicopter-rotor');
  const plane=scene.ambient.find(item=>item.kind==='plane');
  const {x,y,z}=AIRPORT_HELIPAD;
  const pad=pointOnSite([x,y,z],scene.landmarks[25]);
  const landed=actorPose(helicopter,17),airborne=actorPose(helicopter,29);
  assert.deepEqual([landed.x,landed.y,landed.z],pad);
  assert.ok(airborne.y>landed.y&&airborne.sound);
  assert.ok(actorPose(helicopter,14.4).sound,'the rotor can be heard while touching down');
  assert.ok(actorPose(plane,plane.delay+2.8).sound,'the plane can be heard while taxiing');
  assert.ok(scene.ambient.some(actor=>actor.kind==='road'&&Array.from({length:10},(_,i)=>actorPose(actor,i)).some(pose=>pose.sound)));
  assert.ok(actorPose(helicopter,37).y<0);
  assert.ok(actorPose(rotor,17).y>landed.y);
  assert.notEqual(actorPose(rotor,17).sin,actorPose(rotor,17.1).sin);
});

test('New regions keep older lots intact and complete after 30 buildings',()=>{
  for (const theme of WORLD_IDS) {
    const empty=freshWorld(()=>6163/2**32);
    const order=worldChoices(empty,theme).slice(0,GRAND_REGION_PLACES);
    assert.equal(worldChoices(empty,theme).length,GRAND_REGION_CATALOG-1);
    const active={...empty,order,progress:order.length*3};
    assert.equal(worldStatus(active).full,true);
    const scene=projectScene(theme,active);
    assert.equal(Object.keys(scene.landmarks).length,GRAND_REGION_PLACES);
    for (let i=37;i<GRAND_REGION_CATALOG;i++) {
      const preview=worldBuildingPreview(theme,i,empty);
      assert.ok(preview.parts.length>0);
      assert.ok(projectFaces(preview).every(face=>face.points.flat().every(Number.isFinite)));
    }
    const old={...empty,catalog:2,seed:9,order:Array.from({length:24},(_,i)=>i),progress:72};
    const restored=restoreState({...freshState(),roundsCompleted:162,worlds:{[theme]:[old,active]}});
    assert.deepEqual(restored.worlds[theme],[old,active]);
  }
});

test('Tram stops along its loop and the city airport opens a flight path',()=>{
  const base={...freshWorld(()=>6163/2**32),order:[0,3,RAIL_PLACE],progress:9};
  const tram=projectScene('island',base).ambient.find(actor=>actor.kind==='tram');
  const samples=Array.from({length:1100},(_,i)=>actorPose(tram,i*.1));
  const stops=new Set(samples.flatMap((p,i)=>i&&p.x===samples[i-1].x&&p.z===samples[i-1].z?[p.x.toFixed(2)]:[]));
  assert.ok(stops.size>=3);
  assert.ok(samples.every(p=>Number.isFinite(p.y)&&p.y>1));
  const city={...base,order:[0,3,37]};
  assert.ok(projectScene('city',city).ambient.some(actor=>actor.kind==='plane'));
  assert.ok(!projectScene('city',{...city,progress:8}).ambient.some(actor=>actor.kind==='plane'));
});

test('Street traffic yields to a slower bus without overlapping or standing still permanently',()=>{
  const path=[[0,0],[25,0],[25,15],[0,15]];
  const bus=actor(vehicle('bus','#333333'),path,{kind:'bus',ground:0,speed:2,phase:.11});
  const car=actor(vehicle('car','#ff0000'),path,{kind:'road',ground:0,speed:4,phase:.02});
  const traffic=createTraffic([bus,car]);
  let last=traffic(0),stopped=0,driven=0;
  for (let i=1;i<=1800;i++) {
    const next=traffic(i/30);
    const carStep=Math.hypot(next[1].x-last[1].x,next[1].z-last[1].z);
    if (carStep<.001) stopped++;
    driven+=carStep;
    assert.ok(Math.hypot(next[0].x-next[1].x,next[0].z-next[1].z)>1.6);
    last=next;
  }
  assert.ok(stopped>25);
  assert.ok(driven>80);
});

test('The wider new river and larger ponds leave the earlier terrain alone',()=>{
  const classic=regionLayout('city',6163);
  const expanded=regionLayout('city',6163,true);
  assert.ok(riverWidth(expanded,0)>riverWidth(classic,0)+1);
  assert.ok(expanded.basins.every((pond,i)=>pond.w*pond.d>classic.basins[i].w*classic.basins[i].d));
  assert.ok(expanded.basins.every(({x,z})=>regionSurface(expanded,x,z).water));
  const island=regionLayout('island',6163,true);
  assert.ok(island.basins.every(({x,z})=>regionSurface(island,x,z).pond&&regionSurface(island,x,z).water));
});
