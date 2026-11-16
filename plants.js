export const PLANT_STEPS = 5;
export const PLANTS = [
  { id:'sunflower', name:'Solsikke', color:'#f1c64c', center:'#79513e' },
  { id:'tulip', name:'Tulipan', color:'#e6819c' },
  { id:'daisy', name:'Prestekrage', color:'#fff9e8', center:'#e4a73f' },
  { id:'lavender', name:'Lavendel', color:'#9b78c6' },
  { id:'strawberry', name:'Jordbærplante', color:'#db5755' },
  { id:'cactus', name:'Kaktus', color:'#77ac69' },
  { id:'bluebell', name:'Blåklokke', color:'#7297e3' },
  { id:'cherry', name:'Kirsebærtre', color:'#ef9cb0', center:'#b95d7b' },
  { id:'rose', name:'Rose', color:'#da6384', pot:'sage' },
  { id:'poppy', name:'Valmue', color:'#ea7559', pot:'sand' },
  { id:'lily', name:'Lilje', color:'#efad56', pot:'violet' },
  { id:'hydrangea', name:'Hortensia', color:'#8a91cb', pot:'blue' },
  { id:'monstera', name:'Monstera', color:'#4e986a', pot:'sand' },
  { id:'aloe', name:'Aloe vera', color:'#8aa67f', pot:'violet' },
  { id:'chili', name:'Chiliplante', color:'#c84f49', pot:'sage' },
  { id:'lemon', name:'Sitrontre', color:'#f3cc5f', pot:'blue' },
];

const POTS = {
  clay:['#a97058','#efc5a2','#ad725b','#e3aa88'],
  sage:['#648577','#b1c5a1','#648578','#c5d4ad'],
  sand:['#b18555','#efd2a3','#b08558','#f0d6af'],
  violet:['#7f7399','#bdb4d6','#85789c','#c4b9da'],
  blue:['#5f8193','#aecbd2','#657f8e','#b7d7da'],
};

export const plantById = id => PLANTS.find(plant => plant.id === id);
let plantArtId=0;

function blossom(plant, art) {
  const fill = `url(#${art}-bloom)`;
  if (plant.id === 'tulip') {
    return `<path d="M55 31 66 38 77 26 88 38 99 31Q98 63 77 62 56 63 55 31Z" fill="${fill}"/><path d="M65 40Q66 53 76 56" fill="none" stroke="#f8b3c4" stroke-width="4" stroke-linecap="round"/>`;
  }
  if (plant.id === 'lavender') {
    return `<path d="M61 78 55 40m22 27V25m12 55 11-36" fill="none" stroke="#6c9967" stroke-width="4" stroke-linecap="round"/>${[[55,40],[77,24],[101,43]].map(([x,y]) =>
      `<g fill="${fill}" stroke="#725696" stroke-width=".65"><ellipse cx="${x}" cy="${y-3}" rx="5" ry="8"/><ellipse cx="${x-5}" cy="${y+6}" rx="5" ry="6"/><ellipse cx="${x+5}" cy="${y+6}" rx="5" ry="6"/><ellipse cx="${x}" cy="${y+15}" rx="7" ry="6"/></g>`).join('')}`;
  }
  if (plant.id === 'strawberry') {
    return `<path d="M77 55Q92 39 100 54M76 65Q65 53 52 62M77 57Q75 45 80 35" fill="none" stroke="#67955d" stroke-width="4"/>
      <g transform="translate(80 34)" fill="#fff6e2">${[0,72,144,216,288].map(angle=>`<ellipse cy="-6" rx="3.5" ry="5" transform="rotate(${angle})"/>`).join('')}<circle r="3.2" fill="#e5af4c"/></g>${[[52,62],[99,53]].map(([x,y]) =>
      `<g transform="translate(${x} ${y})"><path d="M0 2C-26-7-15 27 0 33 15 27 26-7 0 2Z" fill="${fill}"/><path d="m-12 1 7-5 5 3 5-3 7 5-12 5Z" fill="#76a767"/><path d="M-10 9l1 2m6-1 1 2m8-3-1 2m6 5-1 2m-16 2 1 2m7 2 1 2" stroke="#ffe1a4" stroke-width="1.7" stroke-linecap="round"/></g>`).join('')}`;
  }
  if (plant.id === 'bluebell') {
    return `<path d="M76 73Q70 44 54 49m23 10q17-24 29-13" fill="none" stroke="#548452" stroke-width="4"/>${[[55,52],[104,50],[76,29]].map(([x,y]) =>
      `<g transform="translate(${x} ${y})"><path d="M-3-6Q11-8 12 7l4 8q-15 6-29-1l3-9Q-9-5-3-6Z" fill="${fill}"/><path d="M-5 11q6 3 12 1" fill="none" stroke="#a4b9f0" stroke-width="2.5" stroke-linecap="round"/></g>`).join('')}`;
  }
  if (plant.id === 'rose') {
    return `<path d="M62 49q15 9 30 0L83 61H72Z" fill="#628e55"/>
      <path d="M77 17C64 13 55 22 56 29 46 33 53 47 65 51 67 60 86 60 92 50 103 47 107 34 97 28 96 19 86 14 77 17Z" fill="${fill}"/>
      <path d="M57 35Q59 53 79 53q16-1 20-14c-11 10-14 4-23 7Q64 48 57 35Z" fill="#b54268" opacity=".66"/>
      <path d="M65 29c4-9 22-9 25 2s-13 15-22 9q-5-4 3-9 9-5 12 0-5 6-9 3" fill="none" stroke="#ffe1e4" stroke-width="2.15" stroke-linecap="round" opacity=".87"/>`;
  }
  if (plant.id === 'poppy') {
    return `<g transform="translate(77 38)">${[0,72,144,216,288].map(angle=>`<path d="M0 6C-15 4-23-9-18-17c3-5 9-4 13-2 6-5 14-4 18 0 6 9-2 21-13 25Z" transform="rotate(${angle})" fill="${fill}" stroke="#d9614c" stroke-width=".7"/>`).join('')}
      <circle r="9.5" fill="#65444c"/><circle r="4.2" fill="#bda263"/>${[0,60,120,180,240,300].map(angle=>`<circle cy="-7" r="1" fill="#f9ca7e" transform="rotate(${angle})"/>`).join('')}</g>`;
  }
  if (plant.id === 'lily') {
    return `<g transform="translate(77 39)">${[5,65,125,185,245,305].map((angle,i)=>`<g transform="rotate(${angle})"><path d="M0 3C-9-4-11-18 ${i%2?'-2':'0'}-28 9-19 10-6 0 3Z" fill="${fill}" stroke="#db9b4c" stroke-width=".7"/><path d="M0-2Q-2-11 0-20" fill="none" stroke="#fff3d6" stroke-width="1.1"/><path d="m-4 -7 0 .7m8 -3 0 .7m-5 -5 0 .7" stroke="#ad6147" stroke-width="1.5" stroke-linecap="round"/></g>`).join('')}
      <circle r="5.5" fill="#ebbb62"/><path d="M0 2v-10m0 9 6-8m-7 8-5-6" stroke="#795840" stroke-width="1.65" stroke-linecap="round"/></g>`;
  }
  if (plant.id === 'hydrangea') {
    const flowers=[[56,43],[63,29],[79,24],[94,31],[103,44],[58,52],[76,52],[88,51],[72,37],[88,39]];
    return `<path d="M77 57 61 42m16 13 17-14" stroke="#548452" stroke-width="3.5"/>${flowers.map(([x,y],i)=>`<g transform="translate(${x} ${y}) rotate(${i*23})"><g fill="${i%3===1?'#aab3ed':fill}" stroke="#7478ac" stroke-width=".45">${[0,90,180,270].map(angle=>`<ellipse cy="-4" rx="3.6" ry="5.4" transform="rotate(${angle})"/>`).join('')}</g><circle r="1.7" fill="#fff2c6"/></g>`).join('')}`;
  }
  if (plant.id === 'chili') {
    return `<path d="M78 50Q64 37 58 49m22 7q14-16 21-4" fill="none" stroke="#5b905d" stroke-width="3.2"/>
      <path d="M57 48C44 51 53 84 69 92 63 84 63 70 64 58q0-8-7-10Zm43 1c13 1 5 31-9 36 7-11 3-23 3-29 0-4 3-6 6-7Z" fill="${fill}" stroke="#aa4c41" stroke-width=".8"/>
      <path d="M55 57q-1 14 6 25m41-28-1 7" fill="none" stroke="#ffd0aa" stroke-width="1.65" stroke-linecap="round"/>
      <g transform="translate(77 35)" fill="#fff7e3">${[0,72,144,216,288].map(angle=>`<ellipse cy="-5" rx="3.2" ry="4.8" transform="rotate(${angle})"/>`).join('')}<circle r="2.8" fill="#d4af52"/></g>`;
  }
  if (plant.id === 'lemon') {
    return `<path d="M77 77 58 48m21 23 21-31" fill="none" stroke="#805e54" stroke-width="4" stroke-linecap="round"/>
      ${[[60,45,-30],[71,32,12],[88,30,-26],[101,40,32],[67,59,28],[92,57,-36]].map(([x,y,angle])=>`<g transform="translate(${x} ${y}) rotate(${angle})"><ellipse rx="16" ry="8.5" fill="url(#${art}-leaf)"/><path d="M-11 0h22" stroke="#c1d392" stroke-width=".85" opacity=".65"/></g>`).join('')}
      ${[[62,49,-25],[84,38,14],[97,61,25]].map(([x,y,angle])=>`<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M-2-10q2-5 4 0c10 3 10 17 0 20q-2 4-4 0c-10-3-10-17 0-20Z" fill="${fill}" stroke="#c49a48" stroke-width=".8"/><path d="M-4-5q-3 4-2 7" fill="none" stroke="#fff1b9" stroke-width="1.65" stroke-linecap="round"/></g>`).join('')}`;
  }
  const centers = plant.id === 'cherry' ? [[58,56],[79,34],[101,55]] : [[77,39]];
  const radius = plant.id === 'cherry' ? 8 : 12;
  const count = plant.id==='sunflower'?12:plant.id==='daisy'?10:5;
  const branches = plant.id==='cherry' ? '<path d="M79 76 59 56m20 14 22-15" fill="none" stroke="#805e54" stroke-width="3.5" stroke-linecap="round"/>' : '';
  return branches+centers.map(([x,y]) => `<g transform="translate(${x} ${y})">${Array.from({length:count},(_,i)=>
    `<ellipse cy="-${radius+3}" rx="${count>6?6:radius-2}" ry="${radius}" transform="rotate(${i*360/count})" fill="${fill}" stroke="${plant.color}" stroke-width=".6"/>`).join('')}<circle r="${radius-1}" fill="${plant.center}"/>${Array.from({length:7},(_,i)=>
      `<circle cx="${Math.cos(i*2.4)*radius*.56}" cy="${Math.sin(i*2.4)*radius*.56}" r="1.35" fill="#fff1b1" opacity=".76"/>`).join('')}</g>`).join('');
}

function foliage(plant, stage, leaf) {
  const scale = [.37,.52,.68,.84,1][stage-1];
  let form;
  if (plant.id === 'aloe') {
    form = `<g fill="${leaf}" stroke="#5f8766" stroke-width=".85" stroke-linejoin="round">
      <path d="M-2 1Q-20-22-24-59-7-48 4-3Z"/><path d="M1 1Q20-18 30-55 5-46-4-2Z"/>
      <path d="M-6 1Q-26-7-39-34-19-31 2-4Z"/><path d="M5 1Q27-6 41-30 20-28-1-2Z"/>
      <path d="M-5 2Q-13-26-1-68 12-34 6-2Z"/></g>
      <path d="M0-6Q0-29 0-58m-7 55q-12-14-23-24m34 24q11-11 25-21" fill="none" stroke="#d5e1a5" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M-2-49h.5m3 9h.5m-5 12h.5m5 7h.5m-23-14h.5m39 1h.5" stroke="#f3e3b9" stroke-width="1.65" stroke-linecap="round"/>`;
  } else {
    form = `<path d="M0 1Q2-30-15-58m16 58q4-20 25-36m-26 34q-6-17-26-25" fill="none" stroke="#50794e" stroke-width="3.2" stroke-linecap="round"/>
      <g fill="${leaf}" stroke="#5b885f" stroke-width=".8" fill-rule="evenodd">
        <path d="M-14-53C-34-51-46-71-37-75l10 6q-17-17-8-22l12 11q-8-19 3-21c16 1 31 15 28 27l-10-5 9 11q-7 14-21 15ZM-20-78a3 6 -41 1 0 5-2 3 6 -41 1 0-5 2Z"/>
        <path d="M24-34c-1-10 0-23 12-25l-3 10 9-12c12 1 13 19 4 26l-4-6-2 9q-10 5-16-2Zm13-8a3 4 48 1 0 4-4 3 4 48 1 0-4 4Z"/>
        <path d="M-25-23q-12 4-20-2l8-4-10-1q0-12 11-13l7 8-2-7q10 5 6 19Z"/></g>
      <path d="M-14-56Q-19-73-24-89M25-35l17-15m-68 24-12-8" fill="none" stroke="#c7d895" stroke-width="1.25" stroke-linecap="round"/>`;
  }
  return `<g transform="translate(76 109) scale(${scale})">${form}</g>`;
}

export function renderPlant(id, stage = PLANT_STEPS, { mini = false } = {}) {
  const plant = plantById(id) || PLANTS[0];
  const height = [0, 33, 46, 58, 70, 76][stage];
  const art = `plant-art-${++plantArtId}`;
  const [dark,light,shade,rim] = POTS[plant.pot] ?? POTS.clay;
  const soil = `url(#${art}-soil)`, pottery = `url(#${art}-pot)`, leaf = `url(#${art}-leaf)`;
  const label = mini ? 'aria-hidden="true"' : `role="img" aria-label="${plant.name}, vekst ${stage} av ${PLANT_STEPS}"`;
  let growth = '<ellipse cx="76" cy="107.6" rx="6" ry="2.8" fill="#ccb08a" transform="rotate(-9 76 107.6)"/><path d="M73 108q3-2 6-1.6" stroke="#946d4b" stroke-width=".7" fill="none"/>';
  if (stage > 0 && ['aloe','monstera'].includes(plant.id)) {
    growth = foliage(plant,stage,leaf);
  } else if (stage > 0 && plant.id === 'cactus') {
    growth = `${stage >= 2 ? '<path d="M67 91Q42 94 47 71m40 23q23 0 23-24" fill="none" stroke="#77ac69" stroke-width="12" stroke-linecap="round"/>' : ''}
      <rect x="63" y="${111-height}" width="29" height="${height+5}" rx="14" fill="${leaf}"/><path d="M73 ${121-height}v${height-11}M82 ${124-height}v${height-14}" stroke="#c9e1a4" stroke-width="2.2" opacity=".7" stroke-linecap="round"/>
      ${Array.from({length:Math.floor(height/9)},(_,i)=>`<path d="m${i%2?65:89} ${105-i*8} ${i%2?-4:4} -3" stroke="#e7e9ba" stroke-width="1.25" stroke-linecap="round"/>`).join('')}
      ${stage === PLANT_STEPS ? '<path d="m76 37-11-13 10 3 3-12 5 12 10-4-11 15Z" fill="#ef9aaf"/><ellipse cx="79" cy="33" rx="4" ry="2.4" fill="#ffd893"/>' : ''}`;
  } else if (stage > 0) {
    const base=height/3;
    const woody = ['cherry','lemon'].includes(plant.id);
    const crown = stage === PLANT_STEPS && plant.id === 'strawberry' ? 55 : 111-height;
    growth = `<path d="M76 113Q84 88 77 ${crown}" stroke="${woody?'#805e54':'#548452'}" stroke-width="${woody?6.5:4.6}" fill="none" stroke-linecap="round"/>
      <path d="M79 ${108-base}Q49 ${101-base} 47 ${85-base}Q73 ${82-base} 79 ${108-base}" fill="${leaf}"/>
      <path d="M74 ${104-base}Q62 ${94-base} 51 ${87-base}" stroke="#d3e2a7" stroke-width="1" fill="none" opacity=".82"/>
      ${stage>=2 ? `<path d="M80 ${100-base}Q109 ${96-base} 111 ${78-base}Q85 ${74-base} 80 ${100-base}" fill="${leaf}"/><path d="M84 ${96-base}q14-8 23-15" stroke="#d3e2a7" stroke-width="1" fill="none" opacity=".8"/>` : ''}
      ${stage>=3 ? `<path d="M79 80Q56 72 57 62Q74 57 79 80" fill="${leaf}"/>` : ''}
      ${stage===4 ? `<ellipse cx="77" cy="41" rx="8" ry="11" fill="url(#${art}-bloom)"/>` : ''}
      ${stage===PLANT_STEPS ? blossom(plant,art) : ''}`;
  }
  return `<svg class="growing-plant" viewBox="0 0 140 155" ${label}><defs>
    <linearGradient id="${art}-pot"><stop stop-color="${dark}"/><stop offset=".37" stop-color="${light}"/><stop offset="1" stop-color="${shade}"/></linearGradient>
    <linearGradient id="${art}-soil" x2="0" y2="1"><stop stop-color="#8d7156"/><stop offset="1" stop-color="#644f43"/></linearGradient>
    <linearGradient id="${art}-leaf"><stop stop-color="#63966e"/><stop offset=".57" stop-color="#93bc79"/><stop offset="1" stop-color="#699f72"/></linearGradient>
    <linearGradient id="${art}-bloom" x2=".8" y2="1"><stop stop-color="#fff2dc"/><stop offset=".43" stop-color="${plant.color}"/><stop offset="1" stop-color="${plant.color}"/></linearGradient>
  </defs><ellipse cx="75" cy="141" rx="45" ry="7.2" fill="#dbe6d8"/>
  <path d="M50 111h52l-6.5 24Q93 141 76 141q-17 0-20-6Z" fill="${pottery}" stroke="${shade}" stroke-width=".65"/>
  <path d="M59 122Q75 126 94 122m-33 5q15 4 31 0" stroke="${rim}" stroke-width="1.25" fill="none" opacity=".79"/>
  <path d="M61 133q11 3 20 1" fill="none" stroke="#fff1d9" stroke-width="1" stroke-linecap="round" opacity=".55"/>
  <ellipse cx="76" cy="109" rx="29" ry="6.3" fill="${rim}"/>
  <ellipse cx="76" cy="108.6" rx="24.5" ry="4.2" fill="${soil}"/>
  <path d="M55 109h2m5 1h2m20-2h2m4 1h2m4 1h1" stroke="#c3a081" stroke-width="1.15" stroke-linecap="round"/>
  <g class="plant-growth">${growth}</g>
  <path class="plant-pot-rim" d="M47 109C50 115 100 117 105 109v7c-5 7-53 7-58 0Z" fill="${pottery}" stroke="${shade}" stroke-width=".6"/>
  <path d="M49 110c6 5 47 6 54 0" fill="none" stroke="${rim}" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}
