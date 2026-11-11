import test from 'node:test';
import assert from 'node:assert/strict';
import { createCurriculumTask, levelsForGrade, levelForGrade, validCurriculumTask } from '../curriculum.js';
import { LEVELS, topicOf, createRound, restoreState, freshState, answerRound, advanceRound, roundSummary, advancePractice, practiceLevelForGrade, progressionPreview, randomGenerator } from '../core.js';

test('Every grade has a menu of working tracks, distinct choices, hints and resumable rounds', () => {
  const levels = new Set();
  for (let grade=1; grade<=10; grade++) {
    const menu = levelsForGrade(grade);
    assert.ok(menu.length>=2);
    assert.ok(menu.includes(levelForGrade(grade,null)));
    assert.notDeepEqual(menu,levelsForGrade(grade-1));
    menu.forEach(level=>levels.add(level));
  }
  for (const level of levels) {
    for (let seed=1; seed<=200; seed++) {
      let round = createRound(level,seed);
      assert.equal(round.tasks.length,8);
      assert.deepEqual(restoreState(JSON.parse(JSON.stringify({...freshState(),level,active:round}))).active,round);
      for (let i=0; i<8; i++) {
        const task=round.tasks[i];
        assert.ok(LEVELS[level].pattern.includes(task.type));
        if (task.labels) assert.ok(validCurriculumTask(task), task.type);
        round=advanceRound(answerRound(round,task.answer));
      }
      const summary=roundSummary(round);
      assert.equal(summary.firstTry,8);
      const adapted=createRound(level,seed+1000,false,{history:[summary]});
      assert.ok(adapted.tasks.every(task=>LEVELS[level].pattern.includes(task.type)));
    }
  }
});

test('Representative curriculum answers are mathematically correct, including non-integer and negative answers', () => {
  const expected = {
    tally:'2', tinyAdd:'2', tinySubtract:'2', measure:'200 cm', tables:'4', boxUnits:'8',
    coordinate:'(1, 1)', fractionModel:'1/3', fractionOf:'2', fractionDecimal:'0,5',
    fractionCompare:'>', fractionSum:'1/2', oneStep:'2', chance:'2/3', percentOf:'4 kr',
    area:'6 cm²', perimeter:'10 cm', prism:'12 cm³', integers:'−14', order:'6',
    primeFactors:'2 × 2 × 5', functionTable:'7', pythagoras:'5 cm', dice:'2/3',
    slope:'−5', growthFactor:'0,98', repeatedGrowth:'110,25 kr', systemSum:'4', interest:'1020 kr',
  };
  for (const [type, answer] of Object.entries(expected)) {
    const task=createCurriculumTask(type,()=>0,0);
    assert.equal(task.labels[task.answer],answer,type);
    assert.ok(task.hints.every(Boolean),type);
  }
});

test('Optional progression introduces one then two tasks, moves after 24 answers and stays within the grade', () => {
  const manual = {...freshState(),level:51};
  assert.equal(advancePractice(manual,5,51),manual);
  let state = {...manual,autoProgress:true};
  for (let count=0; count<3; count++) {
    assert.equal(state.level,51);
    assert.equal(progressionPreview(state,5).count,count);
    const active=createRound(state.level,19,false,{preview:progressionPreview(state,5)});
    assert.equal(active.tasks.filter(task=>task.practiceLevel===52).length,count);
    assert.deepEqual(restoreState(JSON.parse(JSON.stringify({...state,active}))).active,active);
    state=advancePractice(state,5,51);
  }
  assert.equal(state.level,52);
  assert.equal(state.progressRounds,0);
  assert.deepEqual(progressionPreview(state,5),{level:53,count:0});
  const last={...state,level:53};
  assert.equal(progressionPreview(last,5),null);
  assert.equal(advancePractice(last,5,53),last);
  assert.equal(advancePractice({...manual,autoProgress:true},5,1).progressRounds,0);
});

test('Money tasks keep the exact value when exchanging and subtract the cost when paying',()=>{
  const rng=randomGenerator(72178);
  for (let i=0;i<100;i++) {
    for (const type of ['coinExchange','noteExchange']) {
      const task=createCurriculumTask(type,rng,i);
      assert.ok(validCurriculumTask(task));
      assert.equal(Number(task.labels[task.answer])*task.visual.exchange,task.visual.pieces[0]);
    }
    for (const type of ['smallChange','moneyChange']) {
      const task=createCurriculumTask(type,rng,i);
      const [cost,paid]=[...task.prompt.matchAll(/(\d+) kr/g)].map(match=>Number(match[1]));
      assert.equal(parseInt(task.labels[task.answer],10),paid-cost);
      assert.deepEqual(task.visual.pieces,[paid]);
    }
  }
  const active=createRound(32,42,false,{length:5});
  assert.equal(active.tasks.length,5);
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify({...freshState(),level:32,active}))).active,active);
});

test('Free mixtures cover different topics and grades, and survive a resume',()=>{
  for (let grade=1;grade<=10;grade++) {
    const level=levelForGrade(grade,null);
    const possible=new Set(levelsForGrade(grade).flatMap(level=>LEVELS[level].pattern.map(topicOf)));
    const reached=new Set();
    for (let seed=1;seed<60;seed++) {
      const round=createRound(level,seed,false,{mix:'grade',grade,length:5});
      for (const task of round.tasks) {
        assert.ok(levelsForGrade(grade).includes(task.practiceLevel));
        reached.add(topicOf(task));
      }
      assert.equal(new Set(round.tasks.slice(0,possible.size).map(topicOf)).size,Math.min(5,possible.size));
    }
    assert.deepEqual(reached,possible);
  }
  const state={...freshState(),mix:'all',autoProgress:true};
  const round=createRound(2,31,false,{mix:'all',grade:3,length:8});
  const levels=round.tasks.map(task=>task.practiceLevel);
  for (let grade=5;grade<=10;grade++) assert.ok(levels.some(level=>levelsForGrade(grade).includes(level)));
  assert.equal(progressionPreview(state,3),null);
  const saved=restoreState(JSON.parse(JSON.stringify({...state,active:round})));
  assert.equal(saved.mix,'all');
  assert.equal(saved.autoProgress,false);
  assert.deepEqual(saved.active.tasks.map(task=>task.practiceLevel),levels);
});

test('Automatic progression skips excluded tracks, including their preview exercises',()=>{
  const state=restoreState({...freshState(),level:3,autoProgress:true,progressRounds:2,
    progressionExcluded:{3:[4,4,999],4:[41]}});
  assert.deepEqual(state.progressionExcluded,{3:[4],4:[41]});
  const preview=progressionPreview(state,3);
  assert.deepEqual(preview,{level:31,count:2});
  for (let seed=0;seed<20;seed++) {
    const round=createRound(3,seed,false,{preview,length:5});
    assert.ok(round.tasks.every(task=>!['multiply','divide'].includes(task.type)));
    assert.ok(round.tasks.filter(task=>task.role==='preview').every(task=>task.practiceLevel===31));
  }
  assert.equal(advancePractice(state,3,3).level,31);
  assert.equal(practiceLevelForGrade({...state,level:4},3),31);
  assert.equal(practiceLevelForGrade({...state,level:4},4),4);
  assert.equal(practiceLevelForGrade({...state,level:4,autoProgress:false},3),4);
  assert.equal(progressionPreview({...state,level:32},3),null);
});
