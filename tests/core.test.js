import test from 'node:test';
import assert from 'node:assert/strict';
import { createRound, answerRound, advanceRound, noteHelp, roundSummary, restoreState, freshState } from '../core.js';

test('All three levels generate bounded, mathematically correct rounds with unique choices', () => {
  for (const level of [1, 2, 3]) {
    for (let seed = 0; seed < 1200; seed++) {
      const r = createRound(level, seed);
      assert.equal(r.tasks.length, 8);
      for (const t of r.tasks) {
        const expected = t.type === 'ten' ? 10 - t.a : t.type === 'place' ? t.n : t.type === 'count' ? t.n + 1 : t.type === 'add' ? t.a + t.b : t.type === 'shift' ? t.n + t.b : t.n - t.b;
        assert.equal(t.answer, expected);
        assert.equal(t.choices.length, 3);
        assert.equal(new Set(t.choices).size, 3);
        assert.ok(t.choices.includes(expected));
        assert.ok(t.choices.every(c => c >= 0 && c <= (level === 1 ? 20 : level === 2 ? 100 : 999)));
        if (t.type === 'remove') assert.equal(t.answer % 10, 0);
      }
    }
  }
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
  assert.deepEqual(r.results[0], { type: 'remove', firstTry: false, helped: true, attempts: 2 });
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
