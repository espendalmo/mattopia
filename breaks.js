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
