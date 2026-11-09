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
    return `<path d="M77 55Q92 39 100 54M76 65Q65 53 52 62" fill="none" stroke="#67955d" stroke-width="4"/>${[[52,62],[99,53]].map(([x,y]) =>
      `<g transform="translate(${x} ${y})"><path d="M0 2C-26-7-15 27 0 33 15 27 26-7 0 2Z" fill="${fill}"/><path d="m-12 1 7-5 5 3 5-3 7 5-12 5Z" fill="#76a767"/><path d="M-10 9l1 2m6-1 1 2m8-3-1 2m6 5-1 2m-16 2 1 2m7 2 1 2" stroke="#ffe1a4" stroke-width="1.7" stroke-linecap="round"/></g>`).join('')}`;
  }
  if (plant.id === 'bluebell') {
    return `<path d="M76 73Q70 44 54 49m23 10q17-24 29-13" fill="none" stroke="#548452" stroke-width="4"/>${[[55,52],[104,50],[76,29]].map(([x,y]) =>
      `<g transform="translate(${x} ${y})"><path d="M-3-6Q11-8 12 7l4 8q-15 6-29-1l3-9Q-9-5-3-6Z" fill="${fill}"/><path d="M-5 11q6 3 12 1" fill="none" stroke="#a4b9f0" stroke-width="2.5" stroke-linecap="round"/></g>`).join('')}`;
  }
  const centers = plant.id === 'cherry' ? [[58,56],[79,34],[101,55]] : [[77,39]];
  const radius = plant.id === 'cherry' ? 8 : 12;
  const count = plant.id==='sunflower'?12:plant.id==='daisy'?10:5;
  const branches = plant.id==='cherry' ? '<path d="M79 76 59 56m20 14 22-15" fill="none" stroke="#805e54" stroke-width="3.5" stroke-linecap="round"/>' : '';
  return branches+centers.map(([x,y]) => `<g transform="translate(${x} ${y})">${Array.from({length:count},(_,i)=>
    `<ellipse cy="-${radius+3}" rx="${count>6?6:radius-2}" ry="${radius}" transform="rotate(${i*360/count})" fill="${fill}" stroke="${plant.color}" stroke-width=".6"/>`).join('')}<circle r="${radius-1}" fill="${plant.center}"/>${Array.from({length:7},(_,i)=>
      `<circle cx="${Math.cos(i*2.4)*radius*.56}" cy="${Math.sin(i*2.4)*radius*.56}" r="1.35" fill="#fff1b1" opacity=".76"/>`).join('')}</g>`).join('');
}

export function renderPlant(id, stage = 5, { mini = false } = {}) {
  const plant = plantById(id) || PLANTS[0];
  const height = [0, 33, 46, 58, 70, 76][stage];
  const art = `plant-art-${++plantArtId}`;
  const soil = `url(#${art}-soil)`, pottery = `url(#${art}-pot)`, leaf = `url(#${art}-leaf)`;
  const label = mini ? 'aria-hidden="true"' : `role="img" aria-label="${plant.name}, vekst ${stage} av 5"`;
  let growth = '<ellipse cx="76" cy="108" rx="7" ry="4" fill="#8b7151"/>';
  if (stage > 0 && plant.id === 'cactus') {
    growth = `${stage >= 2 ? '<path d="M67 91Q42 94 47 71m40 23q23 0 23-24" fill="none" stroke="#77ac69" stroke-width="12" stroke-linecap="round"/>' : ''}
      <rect x="63" y="${111-height}" width="29" height="${height+5}" rx="14" fill="${leaf}"/><path d="M73 ${121-height}v${height-11}M82 ${124-height}v${height-14}" stroke="#c9e1a4" stroke-width="2.2" opacity=".7" stroke-linecap="round"/>
      ${Array.from({length:Math.floor(height/9)},(_,i)=>`<path d="m${i%2?65:89} ${105-i*8} ${i%2?-4:4} -3" stroke="#e7e9ba" stroke-width="1.25" stroke-linecap="round"/>`).join('')}
      ${stage === 5 ? '<path d="m76 37-11-13 10 3 3-12 5 12 10-4-11 15Z" fill="#ef9aaf"/><ellipse cx="79" cy="33" rx="4" ry="2.4" fill="#ffd893"/>' : ''}`;
  } else if (stage > 0) {
    const base=height/3;
    growth = `<path d="M76 111Q85 89 77 ${111-height}" stroke="${plant.id==='cherry'?'#805e54':'#548452'}" stroke-width="${plant.id==='cherry'?7:5}" fill="none" stroke-linecap="round"/>
      <path d="M79 ${108-base}Q49 ${101-base} 47 ${85-base}Q73 ${82-base} 79 ${108-base}" fill="${leaf}"/>
      <path d="M74 ${104-base}Q62 ${94-base} 51 ${87-base}" stroke="#d3e2a7" stroke-width="1" fill="none" opacity=".82"/>
      ${stage>=2 ? `<path d="M80 ${100-base}Q109 ${96-base} 111 ${78-base}Q85 ${74-base} 80 ${100-base}" fill="${leaf}"/><path d="M84 ${96-base}q14-8 23-15" stroke="#d3e2a7" stroke-width="1" fill="none" opacity=".8"/>` : ''}
      ${stage>=3 ? `<path d="M79 80Q56 72 57 62Q74 57 79 80" fill="${leaf}"/>` : ''}
      ${stage===4 ? `<ellipse cx="77" cy="41" rx="8" ry="11" fill="url(#${art}-bloom)"/>` : ''}
      ${stage===5 ? blossom(plant,art) : ''}`;
  }
  return `<svg class="growing-plant" viewBox="0 0 140 155" ${label}><defs>
    <linearGradient id="${art}-pot"><stop stop-color="#bc846c"/><stop offset=".37" stop-color="#ecc5a1"/><stop offset="1" stop-color="#c48a71"/></linearGradient>
    <linearGradient id="${art}-soil" x2="0" y2="1"><stop stop-color="#8d7156"/><stop offset="1" stop-color="#644f43"/></linearGradient>
    <linearGradient id="${art}-leaf"><stop stop-color="#63966e"/><stop offset=".57" stop-color="#93bc79"/><stop offset="1" stop-color="#699f72"/></linearGradient>
    <linearGradient id="${art}-bloom" x2=".8" y2="1"><stop stop-color="#fff2dc"/><stop offset=".43" stop-color="${plant.color}"/><stop offset="1" stop-color="${plant.color}"/></linearGradient>
  </defs><ellipse cx="75" cy="140" rx="47" ry="7.5" fill="#dbe6d8"/>
  <path d="M51 111h51l-6.6 25Q75 143 58 136Z" fill="${pottery}"/>
  <path d="M61 123Q76 126 92 122m-28 5q11 3 25 0" stroke="#f8d9b7" stroke-width="1.25" fill="none" opacity=".76"/>
  <path d="M48.5 109h55v6q-26 10-55 0Z" fill="${pottery}"/>
  <ellipse cx="76" cy="109" rx="27.5" ry="6.3" fill="#efc4a2"/>
  <ellipse cx="76" cy="108.7" rx="23.5" ry="3.7" fill="${soil}"/><path d="M58 109h2m4 1h2m20-2h2m4 1h2" stroke="#c3a081" stroke-width="1.15" stroke-linecap="round"/>
  ${growth}</svg>`;
}
