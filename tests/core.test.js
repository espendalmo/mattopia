import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, createRound, answerRound, advanceRound, noteHelp, roundSummary, restoreState, freshState } from '../core.js';

test('All levels generate bounded, mathematically correct rounds with unique choices', () => {
  const answers = {
    ten:t => 10 - t.a, place:t => t.n, count:t => t.n + Math.sign(t.answer - t.n),
    add:t => t.a + t.b, shift:t => t.n + t.b, subtract:t => t.n - t.b, remove:t => t.n - t.b,
    missing:t => t.n - t.a, multiply:t => t.a * t.b, divide:t => t.n / t.b,
  };
  for (const level of Object.keys(LEVELS)) {
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
