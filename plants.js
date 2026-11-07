export const PLANTS = [
  { id:'sunflower', name:'Solsikke', color:'#f1c64c', center:'#79513e' },
  { id:'tulip', name:'Tulipan', color:'#e6819c' },
  { id:'daisy', name:'Prestekrage', color:'#fff9e8', center:'#e4a73f' },
  { id:'lavender', name:'Lavendel', color:'#9b78c6' },
  { id:'strawberry', name:'Jordbærplante', color:'#db5755' },
  { id:'cactus', name:'Kaktus', color:'#77ac69' },
  { id:'bluebell', name:'Blåklokke', color:'#7297e3' },
  { id:'cherry', name:'Kirsebærtre', color:'#ef9cb0', center:'#b95d7b' },
];

export const plantById = id => PLANTS.find(plant => plant.id === id);

function blossom(plant) {
  const fill = plant.color;
  if (plant.id === 'tulip') {
    return `<path d="M55 31 66 38 77 26 88 38 99 31Q98 63 77 62 56 63 55 31Z" fill="${fill}"/><path d="M65 40Q66 53 76 56" fill="none" stroke="#f8b3c4" stroke-width="4" stroke-linecap="round"/>`;
  }
  if (plant.id === 'lavender') {
    return `<path d="M61 78 55 40m22 27V25m12 55 11-36" fill="none" stroke="#6c9967" stroke-width="4" stroke-linecap="round"/>${[[55,40],[77,24],[101,43]].map(([x,y]) =>
      `<g fill="${fill}"><ellipse cx="${x}" cy="${y-3}" rx="5" ry="8"/><ellipse cx="${x-5}" cy="${y+6}" rx="5" ry="6"/><ellipse cx="${x+5}" cy="${y+6}" rx="5" ry="6"/><ellipse cx="${x}" cy="${y+15}" rx="7" ry="6"/></g>`).join('')}`;
  }
  if (plant.id === 'strawberry') {
    return `<path d="M77 55Q92 39 100 54M76 65Q65 53 52 62" fill="none" stroke="#67955d" stroke-width="4"/>${[[52,62],[99,53]].map(([x,y]) =>
      `<g transform="translate(${x} ${y})"><path d="M0 2C-26-7-15 27 0 33 15 27 26-7 0 2Z" fill="${fill}"/><path d="m-12 1 7-5 5 3 5-3 7 5-12 5Z" fill="#76a767"/><path d="m-6 12 1 2m11-2 1 2m-7 7 1 2" stroke="#ffe1a4" stroke-width="2" stroke-linecap="round"/></g>`).join('')}`;
  }
  if (plant.id === 'bluebell') {
    return `<path d="M76 73Q70 44 54 49m23 10q17-24 29-13" fill="none" stroke="#548452" stroke-width="4"/>${[[55,52],[104,50],[76,29]].map(([x,y]) =>
      `<g transform="translate(${x} ${y})"><path d="M-3-6Q11-8 12 7l4 8q-15 6-29-1l3-9Q-9-5-3-6Z" fill="${fill}"/><path d="M-5 11q6 3 12 1" fill="none" stroke="#a4b9f0" stroke-width="2.5" stroke-linecap="round"/></g>`).join('')}`;
  }
  const centers = plant.id === 'cherry' ? [[58,56],[79,34],[101,55]] : [[77,39]];
  const radius = plant.id === 'cherry' ? 8 : 12;
  return centers.map(([x,y]) => `<g transform="translate(${x} ${y})">${[0,60,120,180,240,300].map(angle =>
    `<ellipse cy="-${radius+3}" rx="${radius-3}" ry="${radius}" transform="rotate(${angle})" fill="${fill}"/>`).join('')}<circle r="${radius-1}" fill="${plant.center}"/><circle cx="-3" cy="-3" r="2" fill="#fff5b8" opacity=".8"/></g>`).join('');
}

export function renderPlant(id, stage = 5, { mini = false } = {}) {
  const plant = plantById(id) || PLANTS[0];
  const height = [0, 33, 46, 58, 70, 76][stage];
  const label = mini ? 'aria-hidden="true"' : `role="img" aria-label="${plant.name}, vekst ${stage} av 5"`;
  let growth = '<ellipse cx="76" cy="108" rx="7" ry="4" fill="#8b7151"/>';
  if (stage > 0 && plant.id === 'cactus') {
    growth = `<rect x="63" y="${111-height}" width="29" height="${height+5}" rx="14" fill="#77ac69"/><path d="M74 ${121-height}v${height-11}" stroke="#a5cd82" stroke-width="4" stroke-linecap="round"/>${stage >= 2 ? '<path d="M67 91Q42 94 47 71m40 23q23 0 23-24" fill="none" stroke="#77ac69" stroke-width="12" stroke-linecap="round"/>' : ''}${stage === 5 ? '<path d="m76 37-11-13 10 3 3-12 5 12 10-4-11 15Z" fill="#ef9aaf"/>' : ''}`;
  } else if (stage > 0) {
    growth = `<path d="M76 111Q85 89 77 ${111-height}" stroke="#548452" stroke-width="${plant.id === 'cherry' ? 7 : 5}" fill="none" stroke-linecap="round"/><path d="M79 ${108-height/3}Q49 ${101-height/3} 47 ${85-height/3}Q73 ${82-height/3} 79 ${108-height/3}" fill="#99c37c"/>${stage >= 2 ? `<path d="M80 ${100-height/3}Q109 ${96-height/3} 111 ${78-height/3}Q85 ${74-height/3} 80 ${100-height/3}" fill="#679d60"/>` : ''}${stage >= 3 ? '<path d="M79 80Q56 72 57 62Q74 57 79 80" fill="#87b66d"/>' : ''}${stage === 4 ? `<ellipse cx="77" cy="41" rx="8" ry="11" fill="${plant.color}"/>` : ''}${stage === 5 ? blossom(plant) : ''}`;
  }
  return `<svg class="growing-plant" viewBox="0 0 140 155" ${label}><ellipse cx="75" cy="139" rx="48" ry="8" fill="#e3eadd"/>${growth}<path d="M52 113h49l-7 25H59Z" fill="#dba88b"/><path d="M49 111h54v9H49Z" fill="#e7b99a"/><path d="M62 124h28" stroke="#c99173" stroke-width="2" stroke-linecap="round"/></svg>`;
}
