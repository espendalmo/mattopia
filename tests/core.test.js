import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, createRound, answerRound, advanceRound, continueRetry, retryPlan, noteHelp, roundSummary, restoreState, freshState } from '../core.js';

test('The original levels generate bounded, mathematically correct rounds with unique choices', () => {
  const answers = {
    ten:t => 10 - t.a, place:t => t.n, count:t => t.n + Math.sign(t.answer - t.n),
    add:t => t.a + t.b, shift:t => t.n + t.b, subtract:t => t.n - t.b, remove:t => t.n - t.b,
    missing:t => t.n - t.a, multiply:t => t.a * t.b, divide:t => t.n / t.b,
  };
  for (const level of [1,2,3,4]) {
    for (let seed = 0; seed < 1200; seed++) {
      const r = createRound(level, seed);
      assert.equal(r.tasks.length, 8);
      for (const t of r.tasks) {
        const expected = answers[t.type](t);
        assert.equal(t.answer, expected);
        assert.equal(t.choices.length, 3);
        assert.equal(new Set(t.choices).size, 3);
        assert.ok(t.choices.includes(expected));
        assert.ok(t.choices.every(c => c >= 0 && c <= LEVELS[level].max));
        if (t.type === 'remove') assert.equal(t.answer % 10, 0);
      }
    }
  }
});

test('Mixed arithmetic crosses tens in both directions and includes differences such as 39 minus 7', () => {
  for (const level of [1, 2, 3]) {
    const tasks = Array.from({length:5000}, (_, seed) => createRound(level, seed).tasks).flat();
    const minus = tasks.filter(t => t.type === 'subtract');
    assert.ok(minus.some(t => t.b > t.n % 10));
    assert.ok(minus.some(t => t.b < t.n % 10));
    assert.ok(minus.some(t => t.b === t.n % 10));
    const plus = tasks.filter(t => t.type === 'add');
    assert.ok(plus.some(t => t.a % 10 + t.b > 10));
    assert.ok(plus.some(t => t.a % 10 + t.b < 10));
    if (level === 2) assert.ok(minus.some(t => t.n === 39 && t.b === 7 && t.answer === 32));
    assert.ok(tasks.some(t => t.type === 'missing'));
    assert.ok(tasks.every(t => t.type !== 'multiply' && t.type !== 'divide'));
  }
  const state = { ...freshState(), level:4, active:createRound(4, 12) };
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state))), state);
});

test('First session introduces 17 minus 7 and remains reproducible', () => {
  const r = createRound(1, 42, true);
  assert.equal(r.tasks[0].n, 17);
  assert.equal(r.tasks[0].b, 7);
  assert.equal(r.tasks[0].answer, 10);
  assert.deepEqual(r.tasks, createRound(1, 42, true).tasks);
});

test('The tens level covers 99 to 100, and the hundreds level includes zeros and 900s', () => {
  const tens = Array.from({ length: 300 }, (_, seed) => createRound(2, seed).tasks).flat();
  const hundreds = Array.from({ length: 300 }, (_, seed) => createRound(3, seed).tasks).flat();
  assert.ok(tens.some(t => t.type === 'count' && t.n === 99 && t.answer === 100));
  assert.ok(hundreds.some(t => t.n >= 900));
  assert.ok(hundreds.some(t => t.type === 'place' && Math.floor(t.n / 10) % 10 === 0));
});

test('An error neither advances nor ends the round; help and attempts are retained', () => {
  let r = createRound(1, 51);
  assert.equal(advanceRound(r), r);
  const wrong = r.tasks[0].choices.find(c => c !== r.tasks[0].answer);
  r = answerRound(r, wrong);
  assert.equal(r.solved, false);
  assert.equal(r.index, 0);
  assert.deepEqual(r.retry, {value:wrong});
  assert.equal(answerRound(r, r.tasks[0].answer), r);
  assert.equal(advanceRound(r), r);
  r = continueRetry(r);
  assert.equal(r.tasks[0].mode, 'input');
  r = noteHelp(r);
  r = answerRound(r, r.tasks[0].answer);
  assert.equal(r.results[0].type, 'remove');
  assert.equal(r.results[0].firstTry, false);
  assert.equal(r.results[0].helped, true);
  assert.equal(r.results[0].attempts, 2);
  assert.equal(answerRound(r, r.tasks[0].answer), r, 'duplicate taps must not count');
  r = advanceRound(r);
  assert.equal(r.index, 1);
  assert.equal(r.solved, false);
  assert.equal(r.helped[1], false);
});

test('Repeated wrong answers keep the same question active after reload and only a correct answer advances', () => {
  const loadRound = active => restoreState(JSON.parse(JSON.stringify({...freshState(), active}))).active;
  const round = createRound(1,42,true);
  const wrong = round.tasks[0].choices.find(c => c !== round.tasks[0].answer);
  const pending = answerRound(round,wrong);
  assert.deepEqual(loadRound(pending).retry,{value:wrong});
  const legacy = {...pending};
  delete legacy.retry;
  assert.equal(retryPlan(loadRound(legacy)).kind,'input');
  let typing = loadRound(continueRetry(pending));
  assert.equal(typing.retry,null);
  for (const guess of [33,22,9]) {
    const missed = loadRound(answerRound(typing,guess));
    assert.deepEqual(missed.retry,{value:guess});
    assert.deepEqual(retryPlan(missed),{kind:'retry',stage:2});
    assert.equal(answerRound(missed,10),missed);
    typing = loadRound(continueRetry(missed));
    assert.equal(typing.retry,null);
    assert.equal(typing.index,0);
    assert.equal(typing.results[0],null);
    assert.equal(typing.solved,false);
    assert.equal(advanceRound(typing),typing);
    assert.equal(typing.tasks[0].mode,'input');
    assert.equal(typing.tasks[0].n,17);
    assert.equal(typing.tasks[0].b,7);
  }
  const solved = answerRound(typing,10);
  assert.equal(solved.results[0].firstTry,false);
  assert.equal(solved.results[0].helped,true);
  assert.equal(solved.results[0].attempts,5);
  let advanced = advanceRound(solved);
  assert.equal(advanced.index,1);
  assert.equal(advanceRound(advanced),advanced);
  while (advanced.index < advanced.tasks.length) {
    advanced = advanceRound(answerRound(advanced,advanced.tasks[advanced.index].answer));
  }
  assert.equal(roundSummary(advanced).firstTry,round.tasks.length-1);
});

test('The final hint keeps the answer available and the task still needs a correct response', () => {
  const round = noteHelp(noteHelp(noteHelp(createRound(1,42,true))));
  const task = round.tasks[0];
  const pending = answerRound(round,task.choices.find(value=>value!==task.answer));
  assert.deepEqual(retryPlan(pending),{kind:'input',stage:3});
  const retry = continueRetry(pending);
  assert.equal(retry.hintStages[0],3);
  assert.equal(advanceRound(retry),retry);
  assert.equal(answerRound(retry,10).solved,true);
});

test('An active question previously marked as reviewed resumes as an unanswered question', () => {
  const round = createRound(1,42,true);
  round.attempts[0]=2;
  round.solved=true;
  round.results[0]={firstTry:false,helped:true,reviewed:true,answer:10};
  assert.equal(advanceRound(round),round);
  const resumed = restoreState({...freshState(),active:round}).active;
  assert.equal(resumed.index,0);
  assert.equal(resumed.solved,false);
  assert.equal(resumed.results[0],null);
  assert.deepEqual(retryPlan(resumed),{kind:'input',stage:3});
  assert.equal(advanceRound(answerRound(continueRetry(resumed),10)).index,1);
});

test('Eight solved tasks produce a complete summary and a single round boundary', () => {
  let r = createRound(3, 20);
  assert.equal(roundSummary(r), null);
  for (let i = 0; i < 8; i++) {
    r = answerRound(r, r.tasks[r.index].answer);
    r = advanceRound(r);
  }
  assert.equal(r.index, 8);
  assert.equal(advanceRound(r), r);
  assert.equal(roundSummary(r).firstTry, 8);
  assert.equal(roundSummary(r).helped, 0);
});

test('Saved progress resumes at the same task, including a solved task awaiting Next', () => {
  let r = createRound(2, 83);
  r = advanceRound(answerRound(r, r.tasks[0].answer));
  r = noteHelp(r);
  r = answerRound(r, r.tasks[1].answer);
  const s = { ...freshState(), level: 2, active: r };
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(s))), s);
});

test('Malformed stored progress is discarded without losing valid settings or history', () => {
  assert.deepEqual(restoreState(null), freshState());
  assert.equal(restoreState({ version: 1, level: 3, active: { index: 999 } }).active, null);
  assert.equal(restoreState({ version: 1, level: 3 }).level, 3);
  assert.equal(restoreState({ version: 1, level: 99 }).level, 1);
  const s = { ...freshState(), active: createRound(1, 1) };
  s.active.tasks[0].choices = [10, 10, 10];
  assert.equal(restoreState(s).active, null);
});
