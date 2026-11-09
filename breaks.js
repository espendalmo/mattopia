import { illustration } from './illustrations.js';

export const BREAK_ITEMS = [
  ['cat','Katt'], ['rocket','Rakett'], ['strawberry','Jordbær'], ['turtle','Skilpadde'],
  ['balloon','Ballong'], ['moon','Måne'], ['butterfly','Sommerfugl'], ['anchor','Anker'],
  ['sunflower','Solsikke'], ['guitar','Gitar'], ['owl','Ugle'], ['bike','Sykkel'],
  ['melon','Melon'], ['sailboat','Seilbåt'], ['octopus','Blekksprut'], ['mushroom','Sopp'],
  ['robot','Robot'], ['penguin','Pingvin'], ['kite','Drage'], ['camera','Kamera'],
  ['umbrella','Paraply'], ['key','Nøkkel'], ['snail','Snegl'], ['fish','Fisk'],
  ['pear','Pære'], ['boot','Støvel'], ['bell','Bjelle'], ['shell','Skjell'],
  ['clock','Vekkerklokke'], ['drum','Tromme'], ['planet','Planet med ring'], ['icecream','Iskrem'],
  ['mittens','Votter'], ['lantern','Lykt'], ['binoculars','Kikkert'], ['crown','Krone'],
  ['train','Tog'], ['wateringcan','Vannkanne'], ['sandwich','Brødskive'], ['headphones','Hodetelefoner'],
].map(([key,label])=>({icon:illustration(key),label}));

export const BREAK_ATTEMPTS = 3;
export const BREAK_INTERVAL = 3;
export const BREAK_TITLES = { memory:'Kims lek', build:'Husk klossebygget', floor:'Klossegulvet' };

export function breakKind(roundsCompleted) {
  const index = Math.max(0, Math.floor(roundsCompleted / BREAK_INTERVAL) - 1);
  const games = Object.keys(BREAK_TITLES);
  return games[index % games.length];
}

export const BRICK_COLORS = {
  red:{ label:'Rød', mark:'●' },
  blue:{ label:'Blå', mark:'◆' },
  yellow:{ label:'Gul', mark:'★' },
  green:{ label:'Grønn', mark:'✚' },
  purple:{ label:'Lilla', mark:'▲' },
};

// Each position is [across, depth, level], starting at the floor.
const BUILD_PATTERNS = [
  { name:'To etasjer', slots:[[0,0,0],[1,0,0],[0,0,1],[1,0,1]] },
  { name:'Høy stabel til høyre', slots:[[0,0,0],[1,0,0],[1,0,1],[1,0,2]] },
  { name:'Høy stabel til venstre', slots:[[0,0,0],[1,0,0],[0,0,1],[0,0,2]] },
  { name:'Trapp bakover', slots:[[0,0,0],[0,1,0],[0,1,1],[1,0,0]] },
  { name:'Trapp framover', slots:[[0,0,0],[0,1,0],[0,0,1],[1,1,0]] },
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
