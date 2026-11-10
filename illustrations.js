// Tallvenn illustrations use a shared palette and rounded outlines.
const circle = (x,y,r,fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const ellipse = (x,y,rx,ry,fill) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const path = (d,fill='none') => `<path d="${d}" fill="${fill}"/>`;
const rect = (x,y,w,h,fill,r=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
const eyes = (y=33) => `<path d="M24 ${y}h.1m15.9 0h.1" stroke-width="3.4"/>`;
const smile = path('M29 39q3 3 6 0');
const cheeks = `<path d="M20 38h3m18 0h3" stroke="#e48783" stroke-width="2.5"/>`;
const navy = '#273e42', cream = '#fff3dc', sky = '#8fc9e5', red = '#e9857d';
const purple = '#b9a4df', green = '#a8cf8b', gold = '#f1c56f';

function animal(color, ears, markings='') {
  return ears + ellipse(32,34,21,17,color) + markings + eyes() + smile + cheeks;
}
const pointed = (outer,inner) => path('M12 30 12 11q2-4 16 8m8 0q14-12 16-8v19',outer)
  + path('m17 13 1 12 7-5m22-7-1 12-7-5',inner);
const roundEars = (outer,inner) => circle(17,20,9,outer)+circle(47,20,9,outer)
  +circle(17,20,4,inner)+circle(47,20,4,inner);
const seeds = path('M25 29l1 2m12-2-1 2m-5 6v2m-7 2 1 2m12-2-1 2');
const flowerPetals = Array.from({length:8},(_,i)=>`<g transform="rotate(${i*45} 32 25)">${ellipse(32,13,5,8,gold)}</g>`).join('');

const art = {
  apple:path('M32 22q-16-10-22 4c-6 12 4 28 15 27l7-3 7 3c11 1 21-15 15-27q-6-14-22-4Z',green)
    +path('M32 22q-2-8 3-13')+path('M34 16q2-12 15-9-3 10-15 9Z','#79b779')+eyes()+smile+cheeks,
  fox:animal('#eaa05b',pointed('#eaa05b',cream),path('M12 34q10 0 20 8 10-8 20-8-2 16-20 17-18-1-20-17Z',cream)),
  panda:animal('#fcf6e8',roundEars(navy,'#5a7776'),ellipse(24,33,6,7,'#8ca7a0')+ellipse(40,33,6,7,'#8ca7a0')),
  frog:ellipse(32,37,22,15,green)+circle(21,24,10,green)+circle(43,24,10,green)
    +circle(21,24,4,cream)+circle(43,24,4,cream)+path('M23 38q9 10 18 0')+cheeks,
  octopus:path('M16 37C9 13 55 12 48 37q12 0 10 9-2 6-10 2-2 13-10 3-6 10-12 0-8 10-10-3-8 4-10-2-2-9 10-9Z',purple)+eyes(31)+smile+cheeks,
  owl:animal('#b8866a',pointed('#b8866a',gold),circle(24,32,9,cream)+circle(40,32,9,cream)+path('m29 39 3 5 3-5Z',gold)),
  tiger:animal(gold,roundEars(gold,cream),path('m31 18 1 7 2-7m-18 8 5 3m27-3-5 3M14 39l5-2m31 2-5-2')+ellipse(32,43,9,6,cream)),
  koala:animal('#aabfd0',roundEars('#aabfd0','#e5becb'),ellipse(32,35,4,6,'#60798b')),
  penguin:ellipse(32,33,21,24,'#455f7c')+path('M17 38q-2-18 9-18 5 0 6 7 1-7 6-7 11 0 9 18 0 15-15 15-15 0-15-15Z',cream)
    +eyes(33)+path('m28 38 4 5 4-5Z',gold)+path('M21 53q-8 1-8 5h14m16-5q8 1 8 5H37',gold),
  cat:animal('#e8b3bb',pointed('#e8b3bb',cream),path('M28 20l4 6 4-6m-24 18 7 1m-8 4 8-1m33-4-7 1m8 4-8-1')),
  dragon:animal('#8ec9af',path('M15 30 6 19l13 1 1-13 11 12 11-12 2 13 14-1-10 11',purple),path('M32 19v6m-6-4 1 5m10 0 1-5')),
  robot:path('M12 24q0-6 6-6h28q6 0 6 6v21q0 6-6 6H18q-6 0-6-6Z',sky)+path('M32 18v-6')+circle(32,9,4,gold)
    +path('M11 31H7v10h5m40-10h5v10h-5',purple)+eyes()+smile,
  rocket:path('M22 38q-10 0-12 13l14-4m18-9q10 0 12 13l-14-4',sky)
    +path('M22 39Q18 22 32 8q14 14 10 31l-4 7H26Z',cream)+circle(32,26,5,sky)+path('M28 47q-5 6 4 11 9-5 4-11Z',red),
  strawberry:path('M13 29q0-11 19-10 19-1 19 10 0 11-19 24-19-13-19-24Z',red)+path('M32 22q-12 2-13-8 7-2 11 4l2-8 3 8q3-6 11-4-1 10-14 8Z',green)+seeds,
  turtle:ellipse(31,35,17,14,green)+circle(50,30,7,'#d0d98d')+path('M14 36 6 31l7 10m8 3-5 8h9l3-5m9-1 3 6h8l-4-9','#d0d98d')
    +path('m23 29 8-4 8 4v9l-8 5-8-5Z','#83b89a')+circle(52,29,1.1,navy),
  balloon:path('M30 44c0 7 9 5 4 14')+path('m32 38-5 9 10-1Z',gold)+ellipse(32,25,16,19,purple)+path('M22 23q1-6 5-8'),
  moon:path('M39 10c-15-4-29 8-29 22s13 26 27 22c8-2 14-8 16-15C38 47 23 26 39 10Z',gold)+path('M48 13v12m-6-6h12m2 8v5m-3-2h6'),
  butterfly:path('M31 34C20 7 3 8 8 27q1 7 16 9-16 0-11 12 8 11 18-10m2-4C44 7 61 8 56 27q-1 7-16 9 16 0 11 12-8 11-18-10',purple)
    +ellipse(32,36,3,11,navy)+path('M31 26q-1-7-7-7m9 7q1-7 7-7')+circle(18,23,3,gold)+circle(46,23,3,gold),
  anchor:circle(32,13,5,cream)+path('M32 18v34m-13-27h26M10 35q0 17 22 20 22-3 22-20M7 41l3-7 7 4m40 3-3-7-7 4'),
  sunflower:path('M32 36v20m0-8q-13-9-16-1 6 9 16 5m0-4q13-9 16-1-6 9-16 5',green)+flowerPetals+circle(32,25,9,'#b77d5c')+path('m27 23 1 1m7-1 1 1m-4 4 1 1'),
  guitar:path('M37 25 50 9l5 4-13 16q4 10-6 12l-2 5q-5 12-17 8C3 48 13 35 21 34l5-2q1-10 11-7Z','#eab488')
    +circle(30,38,5,cream)+path('M28 44 53 12m-29 31 5 4'),
  bike:circle(15,42,11,sky)+circle(49,42,11,sky)+path('M15 42 27 24l8 18H15m20 0 9-16 5 16M42 19h7m-5 0v7M22 24h10'),
  melon:path('M9 22q0 28 23 31 23-3 23-31Z',green)+path('M14 22q2 22 18 25 16-3 18-25Z',red)+path('m22 29 1 2m17-2-1 2m-7 3v2'),
  sailboat:path('M10 43h44l-7 10H19Z','#e9a572')+path('M32 8v34M30 11 14 37h16Zm6 6 14 20H36Z',cream)+path('M8 57q6-4 12 0t12 0 12 0 12 0'),
  mushroom:path('M27 31q1 8-3 19c1 7 16 7 17 0q-4-11-3-19Z',cream)
    +path('M8 29Q12 9 32 9q20 0 24 20 0 9-24 8T8 29Z',red)+circle(21,23,4,cream)+circle(38,18,3,cream)+circle(44,28,3,cream),
  kite:path('m31 8 20 20-20 16-20-16Z',sky)+path('m31 8 0 36-20-16Zm0 0 20 20-20 0Z',red)
    +path('M31 44q7 6 1 10t7 6m-4-9-7 1m9 5-5 2'),
  camera:path('M12 22h10l4-7h14l4 7h8q5 0 5 5v21q0 5-5 5H12q-5 0-5-5V27q0-5 5-5Z',purple)
    +circle(32,36,12,cream)+circle(32,36,7,sky)+path('M47 28h4M28 36q0-4 4-4'),
  umbrella:path('M8 33q1-19 24-22 23 3 24 22-6-5-12 0-6-5-12 0-6-5-12 0-6-5-12 0Z',red)
    +path('M32 8v3m0 22v18q0 8 7 5m-19-23q1-16 12-22 11 6 12 22'),
  key:circle(20,23,12,gold)+circle(19,22,4,cream)+path('m28 29 23 17-4 6-5-4-3 4-5-4 3-4-15-10',gold),
  snail:path('M12 43h28q4-15 11-14 7 2 5 10l2 7q1 6-7 6H12q-7 0-6-5Z',green)
    +circle(27,33,14,'#d79875')+path('M34 33q0-8-8-7-8 2-5 9 3 4 7 2 3-3-1-5m21-3-2-9m7 9 4-8')+circle(51,36,1.5,navy),
  fish:path('M43 32q8-12 15-11v22q-7 1-15-10',sky)+path('M7 32q15-26 35-8l6 8-6 8Q22 58 7 32Z','#73bcbd')
    +path('m27 19 9-8 6 14m-12 9 9-4-2 8Z',gold)+circle(19,29,2.6,navy),
  pear:path('M33 19q12-1 14 14 2 3 6 9 2 13-21 13T11 41q3-5 7-10 1-12 15-12Z',green)
    +path('M32 18q0-7 4-11m1 8q5-10 15-7-3 9-15 7Z','#72b28c')+path('M20 41q-4 6 4 8'),
  boot:path('M24 12h23v29l7 3q4 2 3 10H13q-6 0-6-6 1-6 12-7l5-3Z','#a3c4dc')
    +path('M9 49h47v6H13q-4 0-4-3Z',purple)+path('M24 18h23m-19 7h8m-8 7h8'),
  bell:circle(32,14,4,cream)+path('M12 45q7-4 8-17 1-11 12-11t12 11q1 13 8 17Z',gold)
    +ellipse(32,46,20,4,'#e8ae54')+circle(32,52,4,'#c99152')+path('M25 30q0-7 6-9M10 24l3-5m38 5-3-5'),
  shell:path('M24 52q1-7-7-10C7 35 6 21 14 19q1-8 9-8 5-7 11-3 7-3 12 6 10 1 9 13 4 8-4 15l-10 10Z','#eaa8a8')
    +path('M29 49 15 21m18 27-9-35m12 35-2-38m5 38 6-33m-3 35 12-22M24 51h18'),
  clock:circle(32,34,19,cream)+path('M32 22v12l8 5M16 50l-5 6m36-6 5 6')
    +path('M9 22q-3-10 9-14l7 7Zm30-7 7-7q12 4 9 14Z',red)+circle(32,34,2,navy),
  drum:path('M11 23h42v21q0 10-21 10T11 44Z','#a5bae3')+ellipse(32,23,21,7,cream)
    +path('m12 28 9 21 9-18 11 18 11-21M20 7l28 12M45 7 21 18')+circle(46,17,2.3,gold)+circle(23,17,2.3,gold),
  planet:circle(32,32,17,purple)+path('M18 26q12 6 26-5m-26 20q13 2 24-1')
    +path('M18 28C6 34 4 40 9 43c10 6 44-11 48-22 2-6-7-7-13-5')+circle(51,47,2.7,gold),
  icecream:path('m18 33 14 24 14-24Z','#e7ad71')+path('m26 39 12 5m-9 6 11-13')
    +path('M17 34q-5-8 1-12 1-10 14-10 10 0 14 10 6 4 2 10-5 6-11 0-6 6-12 0-4 4-8 2Z','#efa4bb')+path('M25 22q2-4 8-5'),
  mittens:path('M24 36 15 23q-6-7-10-1-2 5 5 16 0 13 14 13h10V25q0-9-5-9t-5 7Z',red)
    +path('M44 32q-6-8-10-2l7 13q2 8 13 7h4V24q0-9-6-8-5 0-5 9v11Z',purple)+path('M13 46h20m11 0h14M21 17q6-11 22-6'),
  lantern:path('M24 16v-4q0-7 8-7t8 7v4')+path('M20 17h24l4 8H16Zm-4 30h32l3 8H13Z','#73bdb3')
    +path('M20 25h24v22H20Z','#f7daa0')+path('M21 25l22 22m0-22L21 47M32 31q8 7 0 12-7-4 0-12Z',gold),
  binoculars:path('M11 22h13l4 15h8l4-15h13l6 22H5Z','#8dbaac')
    +circle(16,44,11,cream)+circle(48,44,11,cream)+circle(16,44,6,sky)+circle(48,44,6,sky)+path('M12 19v-7h9v7m22 0v-7h9v7m-18 19v7'),
  crown:path('m10 21 12 9 10-17 10 17 12-9-5 27H15Z',gold)
    +path('M15 44h34v8H15Z','#edaf61')+circle(10,20,3,red)+circle(32,12,3,red)+circle(54,20,3,red)+circle(32,37,4,sky),
  train:path('M10 27h24v18H10Z',red)+path('M32 17h19v28H32Z',sky)+path('M36 22h11v10H36Z',cream)+path('M16 27v-9h9v9M7 45h49v4H7Z',gold)
    +circle(19,49,6,navy)+circle(43,49,6,navy)+path('M17 13q-7-4 1-6m8 7q-3-2 0-5'),
  wateringcan:path('M22 27h24v20q0 6-12 6t-12-6Z',green)
    +path('m22 33-9-9-6 4 15 17m24-14q16-8 13 6-3 8-13 8M26 26v-6q0-7 9-7 8 0 8 7v6')+circle(34,40,4,cream),
  sandwich:path('M9 38v-7q-4-8 4-13 8-6 19-3 11-3 19 3 8 5 4 13v7Z','#dba274')
    +path('m8 38 8-3 8 3 8-3 8 3 8-3 8 3v5H8Z',green)+path('M10 44h44v5H10Z','#dd7f76')+path('M10 49h44v5H10Z','#e9b785')+path('m18 24 3-1m11 0 2-2m10 3 2 1'),
  headphones:path('M13 39V29q0-18 19-18t19 18v10')+path('M17 32v-5q0-12 15-12t15 12v5m-4 13v9h-8')
    +path('M8 35q8-5 13 2v12q-5 7-13 2Zm48 0q-8-5-13 2v12q5 7 13 2Z',purple)+circle(32,54,3,red),
  controller:path('M20 20h24c6 0 9 4 11 10l4 12c3 10-4 13-10 7l-6-6H21l-6 6c-6 6-13 3-10-7l4-12c2-6 5-10 11-10Z','#72959f')
    +path('M19 26h5v5h5v5h-5v5h-5v-5h-5v-5h5Z',cream)
    +circle(45,30,3.2,gold)+circle(50,36,3.2,red)+path('M30 39h4'),
  skateboard:`<g transform="rotate(-35 32 32)">${circle(16,39,5,'#f3ca80')}${circle(48,39,5,'#f3ca80')}
    ${rect(7,22,50,15,'#58597e',7)}${rect(7,19,50,13,'#a994d8',6)}
    ${path('m21 30 5-9m3 9 5-9m3 9 5-9')}</g>`,
  basketball:circle(32,32,23,'#e89651')+path('M14 18q10 1 19 14t18 14M13 45q7-17 20-19t16-12M11 30q7 6 14 3m14 4q9-5 15-2'),
  football:circle(32,32,23,cream)+path('m32 23 9 7-3 10H26l-3-10Z','#3e5966')
    +path('m32 23 1-9m8 16 12-4M38 40l6 10M26 40l-6 10m3-20-12-4')
    +path('m27 10 6 5 6-5m12 11 1 6 3 3m-8 18-5 0-3 5m-14 0-3-5-5 0M9 30l3-3 1-6','#3e5966'),
  mountain:path('M5 51 25 15l8 12 7-8 19 32Z','#708b9b')
    +path('m19 26 6-11 8 12-7-3-3 5Zm15 1 6-8 8 13-8-5-3 3Z','#edf4ee')+path('m33 28 10 23M10 51h45')+circle(50,13,4,gold),
  compass:circle(32,12,4,'#c9d9da')+circle(32,34,20,'#42677a')+circle(32,34,15,'#e0eee8')
    +path('m41 23-6 15-12 7 6-15Z',red)+path('m29 30 6 8-12 7Z',sky)+path('M32 20v2m0 24v2M18 34h2m24 0h2'),
  lightning:path('M34 7 14 36h15l-2 22 23-31H35l6-20Z','#f3c267')
    +path('m30 24 6-8M12 15l-3-4m42 33 5 3M9 48l5-3m40-26 4-4'),
};

export function illustration(key) {
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="#273e42" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${art[key]}</svg>`;
}

const rewardBackdrop = color => `<rect width="160" height="88" fill="${color}" stroke="none"/>`;
const heroFrame = (background,halo,body,edge) => rewardBackdrop(background)
  +circle(80,47,37,halo)+path('M0 82h160v6H0Z',edge)
  +path('M36 88V72l12-12 20-4h24l20 4 12 12v16Z',body)
  +path('M48 61v13m64-13v13M65 56l5 9h20l5-9');

const rewardArt = {
  plant:rewardBackdrop('#e4efdb')+circle(80,40,29,'#f1f4cf')
    +ellipse(80,79,38,5,'#c0d3b6')+path('M80 56V25m0 18c-17 0-28-8-28-22 18 0 28 8 28 22Zm0-11c0-16 11-25 28-25 0 15-11 25-28 25Z','#75a86b')
    +path('m56 54 6 25h36l6-25Z','#b96f56')+rect(54,51,52,9,'#e5a67b',4)
    +path('M68 67l2 8m46-46h8m-4-4v8m-75 6h7m-3.5-3.5v7'),
  bricks:rewardBackdrop('#e3eaf5')+ellipse(80,76,56,8,'#c6d1e7')
    +path('M28 56l38-16 43 12-36 18Z','#8dc9ba')+path('m28 56 45 14v12L28 69Z','#62a394')
    +path('m73 70 36-18v13L73 82Z','#438275')+ellipse(46,55,6,3,'#b7ded4')+ellipse(64,62,6,3,'#b7ded4')
    +path('m56 39 34-14 42 11-33 17Z','#efab91')+path('m56 39 43 14v16L56 55Z','#d87867')
    +path('m99 53 33-17v16L99 69Z','#b75c59')+ellipse(116,37,6,3,'#ffceae')
    +path('m57 25 20-12 33 9-21 13Z','#ffdb87')+path('m57 25 32 10v14L57 38Z','#e8b25a')
    +path('m89 35 21-13v15L89 49Z','#c48747')+ellipse(74,23,6,3,'#ffeab6')+ellipse(92,26,6,3,'#ffeab6'),
  armor:heroFrame('#f0d9c5','#f6e7bc','#b9444e','#d9a694')
    +path('M60 22 69 14h22l9 8v29l-9 11H69L60 51Z','#b93646')
    +path('M65 26h9l3-7h6l3 7h9v22l-9 10H74l-9-10Z','#f0bc62')
    +path('m68 34 10 2-2 5-8-2Zm24 0-10 2 2 5 8-2Z','#c9f7ff')
    +path('m74 49 6-2 6 2')+circle(80,76,8,'#72d6e3')+circle(80,76,3.8,'#e5fbff')
    +path('M42 25h9m-4.5-4.5v9m66 8h12m-6-6v12'),
  spider:heroFrame('#e4e1f0','#f5d9de','#406d9f','#b5bbd8')
    +path('M61 24q0-11 19-11t19 11v24L90 61H70l-9-13Z','#d64c57')
    +path('M80 14v46M62 30q18-8 36 0M62 42q18-7 36 0M68 53q12-5 24 0M65 19l27 36m4-36L69 55')
    +path('M64 30q9 1 14 13-13 4-14-13Zm32 0q-9 1-14 13 13 4 14-13Z','#fff7e6')
    +ellipse(80,76,4,7,'#263e55')+path('m76 74-7-5m7 8-8 3m16-6 7-5m-7 8 8 3')
    +path('M0 10l34 21L4 57m30-26-3-29M12 15q4-3 5-13M12 52q5-11-5-13', 'none'),
  shield:heroFrame('#dcece9','#eaf2d9','#3975a9','#b3cfc7')
    +path('M61 24l8-10h22l8 10v21l-7 14H68l-7-14Z','#346b9f')
    +path('M66 39h28v9l-7 10H73l-7-10Z','#e3ae92')+path('M67 36h9m8 0h9m-16 14h6')
    +path('m75 28 5-9 5 9m-8-3h6', '#fcf2d7')
    +circle(108,67,18,'#c3525c')+circle(108,67,13.8,'#f5e8cf')
    +circle(108,67,9.2,'#427fae')+path('m108 60 2 5 5 .5-4 3 1 5-4-3-4 3 1-5-4-3 5-.5Z','#f5e8cf'),
  city:rewardBackdrop('#e1f0e9')+circle(120,17,10,'#f2d697')
    +path('M0 43q25-9 51-4t47 0 62-4v53H0Z','#a8c79c')
    +path('M100 41h20q-17 14-7 20 8 4 47 9v18H98Q66 72 78 62Z','#61a9c4')
    +path('M105 48q-17 13-13 18m21 9 20 4m-16 3 13 3')
    +rect(19,35,21,30,'#dd9a77',1)+path('m17 36 12-11 13 11Z','#a45b53')
    +rect(48,20,24,41,'#6996a6',2)+rect(52,15,16,6,'#4c788b',1)
    +path('M55 28h2m6 0h2m-10 7h2m6 0h2m-10 7h2m6 0h2m-10 7h2m6 0h2M25 43h4m4 0h3M25 51h4m4 0h3')
    +rect(123,39,23,24,'#e9c48e',1)+path('m120 40 15-11 13 11Z','#ad7164')
    +path('M62 71h70v7h-13q-3-8-10-8t-12 8H62Z','#d6a278')
    +path('M62 70h70v4H62Z','#f1d9a8')+circle(11,59,6,'#649773')+circle(150,56,5,'#7fa46b'),
  moon:rewardBackdrop('#232b49')+circle(130,20,12,'#7eb7cb')
    +path('M121 12q13-9 19 4l-9 2-3 7-6-3Z','#95c6a5')
    +`<g stroke="#f8eccf">${path('M17 13h6m-3-3v6M45 25h.1m12-16h.1m36 22h.1m15-17h.1m39 24h.1')}</g>`
    +path('M0 68q36-17 75-9t85-1v30H0Z','#9896b5')+ellipse(127,74,13,4,'#777b9b')+ellipse(16,76,9,3,'#777b9b')
    +path('M23 65q0-23 22-23t22 23Z','#91cbd5')+path('M35 65q0-23 10-23t10 23M27 54h36')
    +rect(22,64,46,7,'#d0c8d4',2)+path('M68 65h16v7H68Z','#aeacc9')
    +path('M91 52q-8 2-11 14l13-5m14-9q8 2 11 14l-13-5Z','#c96e75')
    +path('M91 52q-4-20 8-33 12 13 8 33l-3 10H94Z','#f6e7d9')
    +circle(99,40,4.5,'#7ab4c6')+path('M94 63h10l-5 10Z','#f5c781'),
  island:rewardBackdrop('#9edfe0')+path('M0 31q28-7 55-3t49-3 56-3v10q-32 5-57 4t-46 3-57 2Z','#78cbd4')
    +path('M0 66q13 2 21-2m111 4q14 3 28-2M7 80q13 2 25-1m101 4 14-1')
    +path('M19 64q17-20 49-20 49-7 76 17-8 15-42 18-60 6-83-15Z','#eed19a')
    +path('M32 57q31-17 65-10 25 3 36 13-20 9-53 8-32 2-48-11Z','#a7c98d')
    +rect(84,35,39,25,'#f2c6a1',2)+path('m82 36 9-9h24l11 9Z','#bd7365')
    +path('M90 43h7m5 0h7m5 0h4m-28 7h7m5 0h7m5 0h4')+rect(77,63,29,8,'#65b8cb',4)
    +path('M55 63q3-17-6-35l5-2q11 16 9 37Z','#b68760')
    +path('M52 30q-13-15-24-2 12-2 24 2Zm0 0q1-18 19-17-10 7-19 17Zm0 0q17-12 28 2-14-4-28-2Zm0 0q-15-5-16 9 9-7 16-9Z','#539c74')
    +path('M18 55q5-5 12 0l-4 4h-8Z','#e48b74'),
};

export function rewardIllustration(key) {
  return `<svg viewBox="0 0 160 88" aria-hidden="true" focusable="false" fill="none" stroke="#34494f" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${rewardArt[key]}</svg>`;
}
