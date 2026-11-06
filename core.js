export const VERSION = '1.0.0';
export const ROUND_LENGTH = 8;
export const STORAGE_KEY = 'tallvenn-v1';
export const LEVELS = {
  1: { label: 'Tall til 20', description: 'Små tall, tiervenner, pluss og minus.' },
  2: { label: 'Tall til 100', description: 'Tiere, enere og overganger mellom tiere.' },
  3: { label: 'Tall til 999', description: 'Hundrere, tiere, enere og tall med null.' },
};

export function randomGenerator(seed) {
  let n = seed >>> 0;
  return () => {
    n += 0x6D2B79F5;
    let t = n;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(items, rng) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createRound(level = 1, seed = Date.now(), first = false) {
  level = LEVELS[level] ? Number(level) : 1;
  const rng = randomGenerator(seed);
  const int = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const take = (items) => items[int(0, items.length - 1)];
  const patterns = {
    1: ['remove', 'ten', 'count', 'add', 'place', 'ten', 'subtract', 'add'],
    2: ['remove', 'ten', 'count', 'place', 'shift', 'add', 'shift', 'count'],
    3: ['place', 'ten', 'count', 'shift', 'remove', 'place', 'shift', 'count'],
  };
  const tasks = patterns[level].map((type, i) => {
    let n, a, b, answer;
    if (type === 'remove') {
      n = level === 1 ? (first && i === 0 ? 17 : int(11, 19)) : level === 2 ? int(2, 9) * 10 + int(1, 9) : int(1, 9) * 100 + int(0, 9) * 10 + int(1, 9);
      b = n % 10; answer = n - b;
    } else if (type === 'ten') {
      a = int(3, 9); answer = 10 - a;
    } else if (type === 'count') {
      n = level === 1 ? take([9, 19]) : level === 2 ? int(2, 10) * 10 - 1 : int(1, 9) * 100 - 1;
      answer = n + 1;
    } else if (type === 'place') {
      n = level === 1 ? int(11, 19) : level === 2 ? int(2, 9) * 10 + int(0, 9) : i === 5 ? int(1, 9) * 100 + int(1, 9) : int(1, 9) * 100 + int(1, 9) * 10 + int(0, 9);
      answer = n;
    } else if (type === 'shift') {
      n = level === 2 ? int(2, 8) * 10 + int(0, 9) : int(2, 7) * 100 + int(0, 9) * 10 + int(0, 9);
      b = level === 3 && i === 6 ? take([-100, 100]) : take([-10, 10]);
      answer = n + b;
    } else if (type === 'subtract') {
      n = int(11, 18); b = int(1, Math.min(5, n - 10)); answer = n - b;
    } else {
      a = int(5, 9); b = i === 3 ? int(1, 10 - a) : int(11 - a, 8); answer = a + b;
    }
    const max = level === 1 ? 20 : level === 2 ? 100 : 999;
    const candidates = shuffle([answer - 1, answer + 1, answer - 10, answer + 10, n, b, a, answer - 2, answer + 2], rng);
    const choices = [answer];
    for (const c of candidates) {
      if (Number.isInteger(c) && c >= 0 && c <= max && !choices.includes(c)) choices.push(c);
      if (choices.length === 3) break;
    }
    return { id: `${i}-${type}`, type, ...(n !== undefined && { n }), ...(a !== undefined && { a }), ...(b !== undefined && { b }), answer, choices: shuffle(choices, rng) };
  });
  return { id: `${seed}-${level}`, level, tasks, index: 0, attempts: Array(8).fill(0), helped: Array(8).fill(false), results: Array(8).fill(null), solved: false, startedAt: new Date().toISOString() };
}

export function noteHelp(round) {
  if (!round || round.solved || round.index >= ROUND_LENGTH) return round;
  const helped = [...round.helped]; helped[round.index] = true;
  return { ...round, helped };
}

export function answerRound(round, value) {
  if (!round || round.solved || round.index >= ROUND_LENGTH || !round.tasks[round.index].choices.includes(value)) return round;
  const index = round.index;
  const attempts = [...round.attempts]; attempts[index]++;
  if (value !== round.tasks[index].answer) return { ...round, attempts };
  const results = [...round.results];
  results[index] = { type: round.tasks[index].type, firstTry: attempts[index] === 1, helped: round.helped[index], attempts: attempts[index] };
  return { ...round, attempts, results, solved: true };
}

export function advanceRound(round) {
  if (!round || !round.solved || round.index >= ROUND_LENGTH) return round;
  return { ...round, index: round.index + 1, solved: false };
}

export function roundSummary(round) {
  if (round?.index !== ROUND_LENGTH || !round.results.every(Boolean)) return null;
  return { id: round.id, level: round.level, date: new Date().toISOString(), firstTry: round.results.filter(r => r.firstTry).length, helped: round.results.filter(r => r.helped).length, results: round.results };
}

export function freshState() {
  return { version: 1, level: 1, sound: false, roundsCompleted: 0, history: [], active: null };
}

export function restoreState(raw) {
  const fallback = freshState();
  if (!raw || raw.version !== 1) return fallback;
  const history = Array.isArray(raw.history) ? raw.history.filter(r => typeof r?.id === 'string' && LEVELS[r.level] && typeof r.date === 'string' && Number.isInteger(r.firstTry) && r.firstTry >= 0 && r.firstTry <= 8 && Number.isInteger(r.helped) && r.helped >= 0 && r.helped <= 8).slice(-40) : [];
  const r = raw.active;
  const validTask = t => t && ['remove', 'ten', 'count', 'place', 'shift', 'subtract', 'add'].includes(t.type) && Number.isInteger(t.answer) && t.answer >= 0 && t.answer <= 999 && Array.isArray(t.choices) && t.choices.length === 3 && new Set(t.choices).size === 3 && t.choices.includes(t.answer) && t.choices.every(x => Number.isInteger(x) && x >= 0 && x <= 999) && ((['remove', 'count', 'place', 'shift', 'subtract'].includes(t.type)) ? Number.isInteger(t.n) && t.n >= 1 && t.n <= 999 : Number.isInteger(t.a) && t.a >= 0 && t.a <= 9) && ((['remove', 'shift', 'subtract', 'add'].includes(t.type)) ? Number.isInteger(t.b) : true);
  const valid = r && typeof r.id === 'string' && LEVELS[r.level] && Array.isArray(r.tasks) && r.tasks.length === 8 && r.tasks.every(validTask) && Number.isInteger(r.index) && r.index >= 0 && r.index < 8 && ['attempts', 'helped', 'results'].every(k => Array.isArray(r[k]) && r[k].length === 8) && r.attempts.every(x => Number.isInteger(x) && x >= 0) && r.helped.every(x => typeof x === 'boolean') && r.results.every((x, i) => i < r.index || (i === r.index && r.solved) ? x && typeof x.firstTry === 'boolean' && typeof x.helped === 'boolean' : x === null) && typeof r.solved === 'boolean';
  return { ...fallback, level: LEVELS[raw.level] ? Number(raw.level) : 1, sound: raw.sound === true, roundsCompleted: Number.isSafeInteger(raw.roundsCompleted) && raw.roundsCompleted >= history.length ? raw.roundsCompleted : history.length, history, active: valid ? r : null };
}
