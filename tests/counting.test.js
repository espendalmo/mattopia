import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as core from '../core.js';
import * as rewards from '../rewards.js';
import * as plants from '../plants.js';
import * as breaks from '../breaks.js';
import {hintFor} from '../learning.js';

test('Counting covers upward and downward transitions within each selected number range', () => {
  for (const level of [1, 2, 3]) {
    const tasks = Array.from({length:300}, (_, seed) => core.createRound(level, seed).tasks).flat().filter(t => t.type === 'count');
    const unit = level === 3 ? 100 : 10;
    const max = [0, 20, 100, 999][level];
    assert.ok(tasks.some(t => t.answer > t.n));
    assert.ok(tasks.some(t => t.answer < t.n));
    for (const t of tasks) {
      assert.equal(Math.abs(t.answer - t.n), 1);
      assert.ok([t.n - core.countStep(t), t.n, t.answer].every(n => n >= 0 && n <= max));
      if (t.answer > t.n) assert.equal(t.answer % unit, 0);
      else assert.equal(t.n % unit, 0);
    }
    if (level === 3) {
      assert.ok(tasks.some(t => t.n === 699 && t.answer === 700));
      assert.ok(tasks.some(t => t.n === 700 && t.answer === 699));
    }
  }
});

test('Backward hints explain exchanging a ten or hundred and reveal the answer only at the last step', () => {
  for (const n of [10, 70, 700]) {
    const t = {type:'count', n, answer:n - 1};
    assert.match(hintFor(t, 1), /bakover/);
    assert.match(hintFor(t, 2), /Bytt/);
    assert.ok(!hintFor(t, 1).includes(String(t.answer)));
    assert.ok(!hintFor(t, 2).includes(String(t.answer)));
    assert.equal(hintFor(t, 3), `Før ${n} kommer ${n - 1}.`);
  }
  assert.match(hintFor({type:'count', n:699, answer:700}, 2), /ny hundrer/);
  assert.equal(hintFor({type:'count', n:699, answer:700}, 3), 'Etter 699 kommer 700.');
});

test('Old upward rounds and new downward rounds survive storage without changing tasks', () => {
  for (const [n, answer] of [[699, 700], [700, 699]]) {
    const active = core.createRound(3, 1);
    active.tasks[2] = {...active.tasks[2], n, answer, choices:[698, 699, 700]};
    active.index = 2;
    for (let i = 0; i < 2; i++) active.results[i] = {firstTry:true, helped:false};
    const state = {...core.freshState(), level:3, roundsCompleted:12, active};
    const restored = core.restoreState(JSON.parse(JSON.stringify(state)));
    assert.deepEqual(restored.active, active);
    assert.equal(restored.roundsCompleted, 12);
  }
  assert.notEqual(core.factKey({type:'count', n:10, answer:9}), core.factKey({type:'count', n:10, answer:11}));
});

test('The task, accessible text, help sequence and feedback all follow the same counting direction', async () => {
  const source = (await fs.readFile(new URL('../app.js', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
  const root = {innerHTML:''};
  const context = vm.createContext({
    ...core, ...rewards, ...plants, ...breaks, hintFor,
    document:{querySelector:s => s === '#app' ? root : s === '#announcer' ? {textContent:''} : null, querySelectorAll:() => [], addEventListener(){}},
    localStorage:{getItem:() => null, setItem(){}},
    window:{addEventListener(){}}, navigator:{},
    createSoundPlayer:() => ({}), createUpdater:() => ({}),
  });
  vm.runInContext(source, context);
  for (const [n, answer, first, label] of [[700, 699, 701, 'mindre'], [699, 700, 698, 'mer']]) {
    context.fixture = {type:'count', n, answer, support:'visible', mode:'choice', choices:[698, 699, 700]};
    const render = (stage, solved = false) => vm.runInContext(`state.active = createRound(3, 1); state.active.tasks[0] = fixture; state.active.hintStages[0] = ${stage}; state.active.solved = ${solved}; view = 'round'; renderRound(); root.innerHTML;`, context);
    const initial = render(0);
    assert.ok(initial.includes(n === 700 ? 'aria-label="Hvilket tall mangler? Ukjent tall, 700, 701."' : `aria-label="${first}, ${n}, hvilket tall kommer nå?"`));
    const equation = initial.match(/<div class="equation sequence"[\s\S]*?<\/div>/)[0];
    assert.ok(n === 700 ? equation.indexOf('class="blank') < equation.indexOf('class="sequence-number') : equation.lastIndexOf('class="sequence-number') < equation.indexOf('class="blank'));
    assert.match(initial, n === 700 ? /Ett steg bakover/ : /Ett steg videre/);
    const hinted = render(1);
    const expected = n === 700 ? '698, hvilket tall, 700, 701, 702' : '697, 698, 699, hvilket tall, 701';
    assert.ok(hinted.includes(`aria-label="${expected}"`));
    assert.match(hinted, new RegExp(`Én ${label} enn før`));
    assert.ok(!hinted.includes(`class="line-target">${answer}</span>`));
    assert.ok(render(3).includes(`class="line-target">${answer}</span>`));
    assert.ok(render(0, true).includes(`${n === 700 ? 'Før' : 'Etter'} ${n} kommer ${answer}.`));
  }
});
