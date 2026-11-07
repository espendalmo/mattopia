export const BREAK_ITEMS = [
  { icon:'🐱', label:'Katt' }, { icon:'🚀', label:'Rakett' },
  { icon:'🍓', label:'Jordbær' }, { icon:'🐢', label:'Skilpadde' },
  { icon:'🎈', label:'Ballong' }, { icon:'🌙', label:'Måne' },
  { icon:'🦋', label:'Sommerfugl' }, { icon:'⚓', label:'Anker' },
  { icon:'🌻', label:'Solsikke' }, { icon:'🎸', label:'Gitar' },
];

export function createFocusBreak(rng = Math.random) {
  const items = BREAK_ITEMS.slice();
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const study = items.slice(0, 4);
  const missing = study[Math.floor(rng() * study.length)];
  const choices = items.slice(4, 6);
  choices.splice(Math.floor(rng() * 3), 0, missing);
  return { study, missing, choices };
}
