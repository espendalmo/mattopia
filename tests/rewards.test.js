import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,restoreState,createRound} from '../core.js';
import {BUILD_MODELS,modelById,selectRewardMode,prepareReward,awardPractice,restoreBuild,upcomingBuild,renderBuildSvg} from '../rewards.js';
const rng=()=>.41;
function earn(state,id){state={...state,roundsCompleted:state.roundsCompleted+1};return awardPractice(state,id,rng);}

test('The eighteen models have five large pieces and their projected faces fit inside the drawing',()=>{
  assert.equal(BUILD_MODELS.length,18);assert.equal(new Set(BUILD_MODELS.map(m=>m.id)).size,18);
  for(const m of BUILD_MODELS){
    assert.equal(m.pieces.length,5);
    const svg=renderBuildSvg({model:m.id,pieces:5});
    const [x,y,w,h]=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    for(const face of svg.matchAll(/points="([^"]+)"/g))for(const point of face[1].split(' ')){
      const [px,py]=point.split(',').map(Number);assert.ok(px>=x&&px<=x+w&&py>=y&&py<=y+h);
    }
    assert.ok(svg.includes('brick-front'));assert.ok(svg.includes('brick-top'));assert.ok(svg.includes('brick-side'));assert.ok(svg.includes('brick-stud'));
  }
});
test('Old plant growth, stars, settings and unfinished practice migrate without awarding bricks',()=>{
  const old={version:1,level:2,sound:false,alwaysShowVisuals:true,roundsCompleted:17,history:[],active:createRound(2,90)};
  const migrated=restoreState(old);assert.equal(migrated.plantRounds,17);assert.equal(migrated.roundsCompleted,17);assert.equal(migrated.rewardMode,'plant');assert.equal(migrated.brickBuild,null);assert.equal(migrated.active.id,old.active.id);assert.equal(migrated.sound,false);
  const bricks=selectRewardMode(migrated,'bricks',rng);assert.equal(bricks.brickBuild.pieces,0);assert.equal(bricks.plantRounds,17);assert.equal(bricks.roundsCompleted,17);
});
test('Each completed round gives exactly one piece; revisiting a screen or re-awarding gives none',()=>{
  let s=selectRewardMode(freshState(),'bricks',rng);const chosen=s.brickBuild.model;
  for(let i=1;i<=5;i++){
    const a=earn(s,`round-${i}`);s=a.state;assert.equal(s.brickBuild.model,chosen);assert.equal(s.brickBuild.pieces,i);assert.equal(s.plantRounds,0);
    assert.equal(awardPractice(s,`round-${i}`,rng).state,s);
    assert.equal(awardPractice(s,`round-${i}`,rng).reward,null);
  }
  assert.equal(s.brickBuild.completed,1);assert.deepEqual(s.brickBuild.collection,[chosen]);
  const next=prepareReward(s,rng);assert.notEqual(next.brickBuild.model,chosen);assert.equal(next.brickBuild.pieces,0);assert.deepEqual(next.brickBuild.collection,[chosen]);
});
test('Mode switching pauses both projects independently and preserves the selected random model',()=>{
  let s=freshState();s=earn(s,'plant-1').state;s=selectRewardMode(s,'bricks',rng);s=earn(s,'brick-1').state;const chosen=s.brickBuild.model;
  s=selectRewardMode(s,'plant',()=>.99);s=earn(s,'plant-2').state;
  assert.equal(s.plantRounds,2);assert.equal(s.brickBuild.pieces,1);
  s=selectRewardMode(s,'bricks',()=>.01);assert.equal(s.brickBuild.model,chosen);
  s=restoreState(JSON.parse(JSON.stringify(s)));assert.equal(s.rewardMode,'bricks');assert.equal(s.brickBuild.model,chosen);assert.equal(s.brickBuild.pieces,1);assert.equal(s.plantRounds,2);assert.equal(s.roundsCompleted,3);
});
test('All figures appear before a shuffled set repeats, and neighbouring sets do not repeat immediately',()=>{
  let s=selectRewardMode(freshState(),'bricks',rng),last=null;const sets=[[],[]];
  for(let model=0;model<36;model++){
    const preview=upcomingBuild(s.brickBuild);
    s=restoreState(JSON.parse(JSON.stringify(s)));
    s=prepareReward(s,rng);assert.notEqual(s.brickBuild.model,last);sets[Math.floor(model/18)].push(s.brickBuild.model);last=s.brickBuild.model;
    if (preview) assert.equal(s.brickBuild.model, preview.model);
    for(let part=0;part<5;part++)s=earn(s,`${model}-${part}`).state;
  }
  assert.ok(sets.every(set => new Set(set).size===18));assert.equal(s.brickBuild.completed,36);assert.equal(s.brickBuild.unlocked.length,18);
});

test('An old finished build reserves a stable preview before giving a brick to the next model', () => {
  const old = {model:'duck',pieces:5,bag:[],collection:['duck'],completed:1,catalogVersion:3};
  let s = selectRewardMode({...freshState(),brickBuild:old},'bricks',rng);
  const next = upcomingBuild(s.brickBuild);
  assert.equal(s.brickBuild.pieces,5);
  assert.notEqual(next.model,'duck');
  assert.equal(next.pieces,0);
  const outline = renderBuildSvg(next,{preview:true});
  assert.match(outline, /build-outline/);
  assert.match(outline, /aria-label="Omrisset av neste bygg"/);
  assert.ok(!outline.includes(modelById(next.model).name));
  assert.doesNotMatch(outline, /unbuilt-piece|new-brick|stroke="white"/);
  assert.deepEqual([...new Set([...outline.matchAll(/fill="([^"]+)"/g)].map(match=>match[1]))], ['#edf1e8']);
  s = restoreState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(upcomingBuild(s.brickBuild),next);
  const firstBrick=earn(prepareReward(s,()=>.99),'next-1').state;
  assert.equal(firstBrick.brickBuild.model,next.model);
  assert.equal(firstBrick.brickBuild.pieces,1);
  assert.deepEqual(firstBrick.brickBuild.collection,['duck']);
});

test('An existing build gains the new models without losing pieces or collection',()=>{
  const old={model:'duck',pieces:3,bag:['robot','train'],collection:['rocket'],completed:1};
  const restored=restoreBuild(old);
  assert.equal(restored.model,old.model);assert.equal(restored.pieces,old.pieces);
  assert.deepEqual(restored.collection,old.collection);assert.equal(restored.completed,old.completed);
  assert.deepEqual(restored.bag.filter(id => ['robot','train','superhero'].includes(id)), ['robot','train','superhero']);
  assert.equal(restored.bag.length, 15);
  assert.deepEqual(restored.unlocked, ['rocket']);
  assert.deepEqual(restoreBuild(restored),restored);
  assert.deepEqual(restoreBuild({...restored,bag:[]}).bag,[],'the hero is not reinserted after it has been built');
});

test('The superhero mask is earned with the final brick, and partial stages keep the same framing',()=>{
  const early=renderBuildSvg({model:'superhero',pieces:4});
  const complete=renderBuildSvg({model:'superhero',pieces:5},{animate:true});
  assert.ok(!early.includes('class="hero-mask"'));assert.ok(complete.includes('class="hero-mask"'));
  assert.ok(complete.includes('en superhelt, 5 av 5 klosser'));
  assert.equal(early.match(/viewBox="[^"]+"/)[0],complete.match(/viewBox="[^"]+"/)[0]);
  assert.equal((complete.match(/new-brick/g)||[]).length,1);
});
test('Stored model corruption is isolated and cannot erase math progress',()=>{
  assert.equal(restoreBuild({model:'unknown',pieces:3}),null);assert.equal(restoreBuild({model:'robot',pieces:1000}),null);
  const s=restoreState({...freshState(),roundsCompleted:12,rewardMode:'bricks',brickBuild:{model:'bad',pieces:99}});
  assert.equal(s.roundsCompleted,12);assert.equal(s.brickBuild,null);const repaired=selectRewardMode(s,'bricks',rng);assert.equal(repaired.brickBuild.pieces,0);
});
test('SVG reveals only earned pieces and animates exactly the newly earned piece',()=>{
  for(const model of BUILD_MODELS){
    const svg=renderBuildSvg({model:model.id,pieces:3},{animate:true});
    assert.equal((svg.match(/class="brick-piece /g)||[]).length,5);assert.equal((svg.match(/unbuilt-piece/g)||[]).length,2);assert.equal((svg.match(/new-brick/g)||[]).length,1);assert.ok(svg.includes('3 av 5 klosser'));
    assert.ok(!renderBuildSvg({model:model.id,pieces:3}).includes('new-brick'));
  }
});

test('Legacy garden progress becomes a sunflower and later plants grow once per round', () => {
  let state = restoreState({version:1, roundsCompleted:7, plantRounds:7});
  assert.equal(state.garden.plant, 'sunflower');
  assert.equal(state.garden.stage, 2);
  assert.deepEqual(state.garden.collection, ['sunflower']);
  for (let round = 0; round < 3; round++) state = earn(state, `garden-${round}`).state;
  assert.equal(state.garden.stage, 5);
  const planted = prepareReward(state, rng);
  assert.notEqual(planted.garden.plant, 'sunflower');
  assert.equal(planted.garden.stage, 0);
  const resumed = restoreState(JSON.parse(JSON.stringify(planted)));
  assert.deepEqual(resumed.garden, planted.garden);
  for (let round = 0, next = resumed; round < 5; round++) {
    const id = `plant-${round}`;
    next = earn(next, id).state;
    assert.equal(next.garden.stage, round + 1);
    assert.equal(awardPractice(next, id).state, next);
    if (round === 4) assert.ok(next.garden.collection.includes(next.garden.plant));
  }
});
