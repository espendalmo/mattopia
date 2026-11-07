export const BREAK_ITEMS = [
  { icon:'🐱', label:'Katt' }, { icon:'🚀', label:'Rakett' },
  { icon:'🍓', label:'Jordbær' }, { icon:'🐢', label:'Skilpadde' },
  { icon:'🎈', label:'Ballong' }, { icon:'🌙', label:'Måne' },
  { icon:'🦋', label:'Sommerfugl' }, { icon:'⚓', label:'Anker' },
  { icon:'🌻', label:'Solsikke' }, { icon:'🎸', label:'Gitar' },
  { icon:'🦉', label:'Ugle' }, { icon:'🚲', label:'Sykkel' },
  { icon:'🍉', label:'Melon' }, { icon:'⛵', label:'Seilbåt' },
  { icon:'🐙', label:'Blekksprut' }, { icon:'🍄', label:'Sopp' },
];

export const BREAK_ATTEMPTS = 3;
export const BREAK_INTERVAL = 3;
export const BREAK_TITLES = { memory:'Kims lek', build:'Husk klossebygget', floor:'Klossegulvet' };

export function breakKind(roundsCompleted) {
  const index = Math.max(0, Math.floor(roundsCompleted / BREAK_INTERVAL) - 1);
  const games = Object.keys(BREAK_TITLES);
  return games[index % games.length];
}

export const BRICK_COLORS = {
  red:{ label:'Rød', mark:'●', color:'#c85346' },
  blue:{ label:'Blå', mark:'◆', color:'#3d79b0' },
  yellow:{ label:'Gul', mark:'★', color:'#f1bf49' },
  green:{ label:'Grønn', mark:'✚', color:'#3b8b5e' },
  purple:{ label:'Lilla', mark:'▲', color:'#855cb0' },
};

const BUILD_PATTERNS = [
  { name:'Robot', slots:[[1,2,1],[2,1,3],[3,1,1],[3,3,1]] },
  { name:'Trapp', slots:[[1,1,1],[2,1,2],[3,1,2],[3,3,1]] },
  { name:'Båt', slots:[[1,2,1],[2,1,1],[2,2,2],[3,1,3]] },
];

function shuffle(items, rng) {
  items = items.slice();
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function createFocusBreak(rng = Math.random) {
  const items = shuffle(BREAK_ITEMS, rng).slice(0, 8);
  return { study:items.slice(0, 4), choices:shuffle(items, rng) };
}

export function createBreakGame(kind, rng = Math.random) {
  const progress = { kind, phase:'study', checks:0, score:0, matched:false };
  if (kind === 'build') {
    const pattern = BUILD_PATTERNS[Math.floor(rng() * BUILD_PATTERNS.length)];
    const colors = shuffle(Object.keys(BRICK_COLORS), rng).slice(0, pattern.slots.length);
    return { ...progress, pattern, colors, tray:shuffle(colors, rng), placed:Array(colors.length).fill(null), picked:null };
  }
  if (kind === 'floor') {
    const rows = 3 + Math.floor(rng() * 3);
    const columns = 3 + Math.floor(rng() * 3);
    const layout = Math.floor(rng() * 3);
    const tiles = Array.from({ length:rows * columns }, (_, i) => layout !== 0 && (i < columns || layout === 2 && i % columns === 0));
    const answer = tiles.filter(filled => !filled).length;
    const choices = shuffle([answer, answer - 1, answer + (layout === 0 ? columns : 1)], rng);
    return { ...progress, phase:'guess', rows, columns, tiles, answer, choices, selected:null };
  }
  return { ...progress, ...createFocusBreak(rng), selected:new Set() };
}

export function placeBreakBrick(game, color, slot) {
  if (!game.tray.includes(color) || !Number.isInteger(slot) || slot < 0 || slot >= game.placed.length) return false;
  const from = game.placed.indexOf(color);
  if (from !== -1) game.placed[from] = game.placed[slot];
  game.placed[slot] = color;
  game.picked = null;
  return true;
}

export function scoreBreak(game) {
  if (game.kind === 'build') {
    if (game.placed.some(color => color === null)) return null;
    return { score:game.placed.filter((color, i) => game.colors[i] === color).length, total:game.colors.length };
  }
  if (game.kind === 'floor') {
    if (!game.choices.includes(game.selected)) return null;
    return { score:Number(game.selected === game.answer), total:1 };
  }
  const { study, selected, choices } = game;
  if (selected.size !== study.length) return null;
  return { score:[...selected].filter(i => study.includes(choices[i])).length, total:study.length };
}

export function retryBreak(game) {
  if (game.kind === 'build') { game.placed.fill(null); game.picked = null; }
  else if (game.kind === 'floor') game.selected = null;
  else game.selected.clear();
  game.phase = game.kind === 'floor' ? 'guess' : 'study';
}
