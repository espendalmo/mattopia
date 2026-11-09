// Short practice tracks based on selected competence aims in MAT01-05.
function track(label, description, ...types) {
  return { label, description, max:999, pattern:Array.from({length:8}, (_, i) => types[i % types.length]) };
}

export const CURRICULUM_LEVELS = {
  11:track('Tall og mengder', 'Tell brikker, legg til og ta bort med tall til 10.', 'tally', 'tinyAdd', 'tinySubtract', 'compareQuantity'),
  21:track('Mønstre og former', 'Fortsett tallmønstre og tell sider på figurer.', 'pattern', 'shapeSides', 'tally', 'clockHours'),
  31:track('Måling og kart', 'Finn punkter i rutenett og regn med lengde og masse.', 'coordinate', 'measure', 'coordinateMove'),
  41:track('Gangetabell og deling', 'Gangetabeller, like grupper og deling i praktiske situasjoner.', 'tables', 'sharing', 'arrayCount', 'groupsMissing'),
  42:track('Ruter og klosser', 'Finn hvor mange ruter en flate dekker, og hvor mange klosser en boks rommer.', 'arrayCount', 'boxUnits', 'pattern', 'compositeArea'),
  51:track('Brøk og desimaltall', 'Les brøker, finn en del av en mengde og sammenlign brøker.', 'fractionModel', 'fractionOf', 'fractionCompare', 'fractionDecimal', 'equivalentFraction'),
  52:track('Likninger og sjanse', 'Finn det ukjente tallet og regn ut sjansen for å trekke en bestemt farge.', 'oneStep', 'chance', 'chanceCompare'),
  61:track('Desimaltall og prosent', 'Regn med desimaltall, brøk og prosent i hverdagen.', 'decimalSum', 'percentOf', 'fractionOf', 'decimalDifference'),
  62:track('Areal, omkrets og volum', 'Mål et rektangel, regn på en boks og finn diameteren til en sirkel.', 'area', 'perimeter', 'prism', 'diameter', 'angleRemainder'),
  71:track('Tall og regnerekkefølge', 'Regn med negative tall og uttrykk med flere regnearter.', 'integers', 'order', 'orderCompare'),
  72:track('Brøk, desimaltall og prosent', 'Legg sammen brøker og bytt mellom ulike måter å vise en andel på.', 'fractionSum', 'fractionDecimal', 'percentMatch', 'fractionDifference'),
  73:track('Likninger og statistikk', 'Løs lineære likninger og finn gjennomsnitt og median.', 'linearEquation', 'mean', 'median', 'missingMean'),
  81:track('Primtall og brøk', 'Finn primtallsfaktorer og forkort brøker.', 'primeFactors', 'reduceFraction', 'divisible'),
  82:track('Algebra og likninger', 'Sett inn tall i uttrykk, løs likninger og finn regelen i et mønster.', 'expression', 'linearEquation', 'patternRule', 'distributive'),
  83:track('Funksjoner og fart', 'Les en funksjonstabell og regn med fart, tid og avstand.', 'functionTable', 'speed', 'intercept'),
  91:track('Trekanter og romfigurer', 'Bruk Pytagoras, målestokk og volumformler.', 'pythagoras', 'scale', 'prism', 'scaleBack'),
  92:track('Statistikk og sannsynlighet', 'Finn median og variasjonsbredde, og regn ut sannsynlighet.', 'median', 'range', 'chance', 'dice', 'frequency'),
  101:track('Funksjoner og vekst', 'Finn stigningstall, vekstfaktor og verdi etter flere endringer.', 'slope', 'growthFactor', 'repeatedGrowth', 'comparePlans'),
  102:track('Likningssett', 'Bruk to opplysninger sammen til å finne to ukjente.', 'systemSum', 'systemPrice', 'systemTotal'),
  103:track('Økonomi og fart', 'Regn med rabatt, sparepenger og gjennomsnittsfart.', 'discount', 'interest', 'speed', 'budgetBalance'),
};

export const GRADE_LEVELS = {
  1:[11, 1], 2:[1, 2, 21], 3:[1, 2, 3, 4, 31], 4:[4, 41, 42], 5:[51, 52],
  6:[61, 62], 7:[71, 72, 73], 8:[81, 82, 83], 9:[91, 92], 10:[101, 102, 103],
};

export function levelsForGrade(grade) {
  return Object.hasOwn(GRADE_LEVELS, grade) ? GRADE_LEVELS[grade] : [1, 2, 3, 4];
}

export function levelForGrade(grade, level) {
  const choices = levelsForGrade(grade);
  return choices.includes(level) ? level : ({3:2, 4:41}[grade] || choices[0]);
}

export function nextLevelForGrade(grade, level) {
  if (!Object.hasOwn(GRADE_LEVELS, grade)) return null;
  const choices = GRADE_LEVELS[grade];
  const index = choices.indexOf(level);
  return index >= 0 ? choices[index+1] || null : null;
}

export const CURRICULUM_TOPICS = {
  quantities:'Tall og mengder', patterns:'Mønstre', geometry:'Geometri og måling',
  fractions:'Brøk', decimals:'Desimaltall og prosent', algebra:'Algebra og likninger',
  statistics:'Statistikk', probability:'Sannsynlighet', signed:'Negative tall',
  operations:'Regnerekkefølge', factors:'Primtall og faktorer', functions:'Funksjoner',
  finance:'Økonomi', rates:'Fart og endring',
};

const format = number => String(Number(number.toFixed(4))).replace('.', ',').replace('-', '−');
const fraction = (n, d) => `${n}/${d}`;
function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}
function shuffle(items, int) {
  const copy = [...items];
  for (let i=copy.length-1; i>0; i--) {
    const j = int(0,i);
    [copy[i],copy[j]] = [copy[j],copy[i]];
  }
  return copy;
}
function reduced(n, d) {
  if (!n) return '0';
  const divisor = gcd(n, d);
  return fraction(n / divisor, d / divisor);
}

function exercise(title, prompt, correct, wrong, hint, method, solution, visual) {
  return { title, prompt, options:[correct, ...wrong], hints:[hint, method, solution], visual };
}

function number(title, prompt, answer, hint, method, solution, { wrong=[], unit='', visual, step=1, minimum=0 }={}) {
  const clean = n => Number(n.toFixed(4));
  const alternatives = [...new Set([...wrong, answer + step, answer - step, answer + 2 * step, answer - 2 * step].map(clean))]
    .filter(n => n !== clean(answer) && n >= minimum).slice(0, 2);
  return exercise(title, prompt, format(answer) + unit, alternatives.map(n => format(n) + unit), hint, method, solution, visual);
}

const grid = (columns, rows, filled=columns*rows, style='squares') => ({ kind:'grid', columns, rows, filled, style });
const table = (headers, cells) => ({ kind:'table', headers, cells });
const equation = (a, b) => `${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;

const tasks = {
  compareQuantity:['quantities', int => {
    const a=int(2,7),b=a+int(1,3);
    return number('Hvilket tall er størst?', `Se på ${a} og ${b}.`,b,'Tenk på hvor mange brikker hvert tall betyr.',
      'Tallet med flest brikker er størst.',`${b} er større enn ${a}.`,{wrong:[a,b+1]});
  }],
  clockHours:['geometry', int => {
    const start=int(8,13),hours=int(2,4);
    return number('Hvor mange timer går det?', `Øvinga begynner kl. ${start}.00 og slutter kl. ${start+hours}.00.`,hours,
      'Tell fram én time om gangen.',`Trekk ${start} fra ${start+hours}.`,`Det går ${hours} timer.`,{unit:' timer'});
  }],
  coordinateMove:['geometry', int => {
    const x=int(1,3),y=int(1,3),step=int(1,4-x);
    const answer=`(${x+step}, ${y})`;
    return exercise('Flytt punktet',`Start på (${x}, ${y}). Gå ${step} steg mot høyre.`,answer,
      [`(${x}, ${y+step})`,`(${x}, ${y})`],'Når du går til høyre, endres den første koordinaten.',
      `Legg ${step} til ${x}. La den andre koordinaten stå.`,`Du havner på ${answer}.`,{kind:'point',x,y});
  }],
  groupsMissing:['quantities', int => {
    const rows=int(2,5),per=int(3,7),total=rows*per;
    return number('Hvor mange grupper blir det?', `Du har ${total} klosser og legger ${per} klosser i hver eske.`,rows,
      'Lag like store grupper.',`Del ${total} på ${per}.`,`${total} ÷ ${per} = ${rows} esker.`,{unit:' esker',wrong:[per,total-per]});
  }],
  compositeArea:['geometry', int => {
    const a=int(3,7),b=int(3,6),cut=int(1,2);
    return number('Hvor mange ruter er igjen?', `Et brett har ${a} kolonner og ${b} rader. Vi fjerner ${cut} ruter i et hjørne.`,a*b-cut,
      'Finn først hvor mange ruter hele brettet har.',`Gang ${a} med ${b}. Trekk så fra ${cut}.`,`${a} × ${b} − ${cut} = ${a*b-cut} ruter.`,{wrong:[a*b,a*b+cut]});
  }],
  equivalentFraction:['fractions', int => {
    const n=int(1,3),d=n+int(2,5),k=int(2,4);
    return exercise('Hvilken brøk har samme verdi?',`Finn en brøk som er like stor som ${n}/${d}.`,`${n*k}/${d*k}`,
      [`${n*k}/${d}`,`${n}/${d*k}`],'Telleren og nevneren må endres med samme faktor.',
      `Gang begge med ${k}.`,`${n}/${d} = ${n*k}/${d*k}.`);
  }],
  chanceCompare:['probability', int => {
    const red=int(2,4),blue=red+int(1,3);
    return exercise('Hva er mest sannsynlig?',`En pose har ${red} røde og ${blue} blå brikker. Du trekker én uten å se.`,'Å få blå',
      ['Å få rød','Like stor sjanse'],'Tenk på hvilken farge det er flest av.',`Sammenlign ${red} med ${blue}.`,
      'Det er flest blå brikker, så det er større sjanse for blå.');
  }],
  decimalDifference:['decimals', int => {
    const cents=int(3,8),paid=int(4,9),price=paid-cents/10;
    return number('Hvor mye får du tilbake?',`Du betaler ${paid} kr for noe som koster ${format(price)} kr.`,cents/10,
      'Vekslepengene er forskjellen mellom beløpene.',`Regn ${paid} − ${format(price)}.`,
      `Du får ${format(cents/10)} kr tilbake.`,{unit:' kr',step:.1,wrong:[price,cents]});
  }],
  angleRemainder:['geometry', int => {
    const a=5*int(5,12);
    return number('Finn resten av den rette vinkelen',`En rett vinkel deles i to. Den ene delen er ${a}°.`,90-a,
      'En rett vinkel er 90°.',`Trekk ${a}° fra 90°.`,`90° − ${a}° = ${90-a}°.`,{unit:'°',wrong:[180-a,90+a]});
  }],
  orderCompare:['operations', int => {
    const a=int(2,5),b=int(3,7),c=int(2,5);
    return number('Hvilken verdi får uttrykket?',`(${a} + ${b}) × ${c}`,(a+b)*c,
      'Regn ut parentesen først.',`Gang ${a+b} med ${c}.`,`${a+b} × ${c} = ${(a+b)*c}.`,{wrong:[a+b*c,a+b+c]});
  }],
  fractionDifference:['fractions', int => {
    const denominator=int(5,10),n=int(3,denominator-1),part=int(1,n-1);
    return exercise('Hvor stor brøk er igjen?',`Du har ${n}/${denominator} av en plate og gir bort ${part}/${denominator}.`,
      `${n-part}/${denominator}`,[`${n+part}/${denominator}`,`${n}/${denominator}`],
      'Bitene har samme størrelse, så nevneren beholdes.',`Trekk ${part} fra ${n} i telleren.`,
      `Det er ${n-part}/${denominator} igjen.`);
  }],
  missingMean:['statistics', int => {
    const mean=int(5,16),d=int(1,4),last=mean+d;
    return number('Finn det tredje tallet',`Tre tall har gjennomsnitt ${mean}. To av tallene er ${mean-d} og ${mean}.`,last,
      'Gang gjennomsnittet med 3 for å finne summen.',`Trekk ${mean-d} og ${mean} fra ${mean*3}.`,
      `Det tredje tallet er ${last}.`,{wrong:[mean,mean-d]});
  }],
  divisible:['factors', int => {
    const d=int(3,9),n=d*int(3,9);
    return number('Hvilket tall er delelig?',`Hvilket alternativ kan deles på ${d} uten rest?`,n,
      `Tenk på ${d}-gangen.`,`Se etter et multiplum av ${d}.`,`${n} kan deles på ${d} uten rest.`,{wrong:[n-1,n+1]});
  }],
  distributive:['algebra', int => {
    const a=int(2,6),b=int(2,7);
    return exercise('Multipliser inn i parentesen',`${a}(x + ${b})`,`${a}x + ${a*b}`,
      [`${a}x + ${b}`,`x + ${a*b}`],'Tallet utenfor parentesen skal ganges med begge ledd.',
      `Gang ${a} med x og deretter med ${b}.`,`${a}(x + ${b}) = ${a}x + ${a*b}.`);
  }],
  intercept:['functions', int => {
    const a=int(2,7),b=int(2,14);
    return number('Hvor krysser linja y-aksen?',`y = ${a}x + ${b}`,b,'På y-aksen er x lik 0.',
      'Sett inn x = 0 i uttrykket.',`y = ${a} × 0 + ${b} = ${b}.`,{wrong:[a,a+b]});
  }],
  scaleBack:['geometry', int => {
    const scale=int(2,6),a=int(3,9);
    return number('Hvor langt er det på tegningen?',`Målestokken er 1 : ${scale}. I virkeligheten er lengden ${scale*a} cm.`,a,
      'Én cm på tegningen svarer til flere cm i virkeligheten.',`Del ${scale*a} på ${scale}.`,
      `Tegningen viser ${a} cm.`,{unit:' cm',wrong:[scale*a,scale*a*scale]});
  }],
  frequency:['statistics', int => {
    const a=int(2,6),b=int(7,12),c=int(13,20);
    return number('Hvor mange svarte totalt?', 'Tabellen viser tre svaralternativer og antallet som valgte hvert alternativ.',a+b+c,
      'Summér kolonnen med antall.',`Legg sammen ${a}, ${b} og ${c}.`,`${a} + ${b} + ${c} = ${a+b+c}.`,
      {visual:table(['Svar','Antall'],[['A',a],['B',b],['C',c]]),wrong:[a+b,b+c]});
  }],
  comparePlans:['functions', int => {
    const start=int(3,7)*10,delta=int(2,6),rides=int(3,7);
    const fee=delta*rides;
    return number('Når koster tilbudene det samme?',`A koster ${start} kr per tur. B koster ${fee} kr i startavgift og ${start-delta} kr per tur.`,rides,
      'B sparer litt per tur, men har en startavgift.',`Del startavgiften på forskjellen per tur, ${delta} kr.`,
      `Prisene er like etter ${rides} turer.`,{unit:' turer',wrong:[delta,fee]});
  }],
  systemTotal:['algebra', int => {
    const a=int(4,9),b=int(2,6);
    return number('Hvor mange store esker?',`Det er ${a+b} esker. En stor rommer 5 klosser, en liten 2. Til sammen rommer de ${5*a+2*b} klosser.`,
      a,'Tenk først at alle eskene er små.',`De store eskene rommer 3 ekstra hver. Del forskjellen på 3.`,
      `(${5*a+2*b} − 2 × ${a+b}) ÷ 3 = ${a} store esker.`,{wrong:[b,a+b]});
  }],
  budgetBalance:['finance', int => {
    const income=100*int(17,30),fixed=100*int(8,12),extra=50*int(3,7);
    return number('Hvor mye er igjen i budsjettet?',`Du har ${income} kr. Utgiftene er ${fixed} kr og ${extra} kr.`,income-fixed-extra,
      'Legg sammen utgiftene først.',`Trekk ${fixed+extra} kr fra beløpet du har.`,
      `Det er ${income-fixed-extra} kr igjen.`,{unit:' kr',wrong:[income-fixed,fixed+extra]});
  }],
  tally:['quantities', int => {
    const n = int(2, 9);
    return number('Hvor mange brikker ser du?', '', n, 'Tell én brikke om gangen.', 'Begynn på den øverste raden.', `Det er ${n} brikker.`,
      {visual:grid(5, Math.ceil(n / 5), n, 'dots')});
  }],
  tinyAdd:['quantities', int => {
    const a = int(1, 6), b = int(1, 10-a);
    return number('Hvor mange blir det?', `${a} + ${b} = ?`, a+b, `Begynn med de ${a} grønne brikkene.`, `Tell ${b} videre med de gule brikkene.`, `${a} + ${b} = ${a+b}.`,
      {visual:{...grid(5,2,a+b,'dots'), split:a}});
  }],
  tinySubtract:['quantities', int => {
    const a = int(3, 10), b = int(1, a-1);
    return number('Hvor mange er igjen?', `${a} − ${b} = ?`, a-b, `Tenk deg ${a} brikker.`, `Ta bort ${b} av dem og tell de som er igjen.`, `${a} − ${b} = ${a-b}.`,
      {visual:grid(5, Math.ceil(a / 5), a, 'dots')});
  }],
  pattern:['patterns', int => {
    const a = int(1, 12), step = int(2, 5), answer = a + 3*step;
    return number('Hva kommer etterpå?', `${a}, ${a+step}, ${a+2*step}, ?`, answer, 'Se hvor mye tallene øker for hvert steg.', `Tallene øker med ${step} hver gang.`, `${a+2*step} + ${step} = ${answer}.`);
  }],
  shapeSides:['geometry', int => {
    const sides = int(3, 6);
    return number('Hvor mange sider har figuren?', '', sides, 'Følg kanten rundt figuren.', 'Tell hver rette strek fram til neste hjørne.', `Figuren har ${sides} sider.`,
      {visual:{kind:'shape', sides}});
  }],
  coordinate:['geometry', int => {
    const x = int(1, 4), y = int(1, 4);
    return exercise('Hvor ligger punktet?', 'Les av punktet i rutenettet.', `(${x}, ${y})`, [`(${x-1}, ${y})`, `(${x}, ${y-1})`],
      'Les bortover først, så oppover.', `Start i 0. Tell ${x} ruter til høyre.`, `Punktet er (${x}, ${y}). Det er ${x} bort og ${y} opp.`, {kind:'point', x, y});
  }],
  measure:['geometry', (int, pick) => {
    const count = int(2, 8), [from, to, factor] = pick([['m','cm',100],['kg','g',1000],['dm','cm',10]]);
    return number('Bytt måleenhet', `${count} ${from} = ? ${to}`, count*factor, `Hvor mange ${to} går det på én ${from}?`, `Én ${from} er ${factor} ${to}.`,
      `${count} × ${factor} = ${count*factor} ${to}.`, {wrong:[count, count*factor/10], unit:` ${to}`});
  }],
  tables:['operations', int => {
    const a = int(2, 10), b = int(2, 10);
    return number('Hva blir produktet?', `${a} × ${b} = ?`, a*b, `Tenk ${a} grupper med ${b} i hver.`, `Du kan legge sammen ${b} én gang for hver gruppe.`,
      `${a} × ${b} = ${a*b}.`, {wrong:[a+b, a*b+b]});
  }],
  sharing:['operations', int => {
    const a = int(3, 9), b = int(2, 10);
    return number('Hvor mange får hver?', `${a*b} kort deles likt på ${a} spillere.`, b, `Se for deg at alle får ett kort hver, flere ganger.`, `Finn tallet som ganger ${a} og gir ${a*b}.`,
      `${a*b} ÷ ${a} = ${b} kort hver.`);
  }],
  arrayCount:['geometry', int => {
    const a = int(2, 8), b = int(2, 7);
    return number('Hvor mange ruter dekker figuren?', '', a*b, 'Se hvor mange ruter det er i hver rad.', `Du kan regne ${a} ruter per rad ganger ${b} rader.`,
      `${a} × ${b} = ${a*b} ruter.`, {wrong:[a+b, a*b+a], visual:grid(a,b)});
  }],
  boxUnits:['geometry', int => {
    const a = int(2, 5), b = int(2, 5), h = int(2, 4);
    return number('Hvor mange klosser rommer boksen?', `Ett lag er ${a} × ${b} klosser. Boksen er ${h} lag høy.`, a*b*h, 'Finn antallet i ett lag først.', `Det er ${a*b} klosser per lag.`,
      `${a*b} × ${h} = ${a*b*h} klosser.`, {wrong:[a*b, a*b+h], visual:grid(a,b)});
  }],
  fractionModel:['fractions', int => {
    const d = int(3, 8), n = int(1, d-1);
    return exercise('Hvor stor del er grønn?', '', fraction(n,d), [fraction(n+1,d),fraction(n,d+1)],
      'Tell alle delene for å finne nevneren.', 'Tell de grønne delene for å finne telleren.', `${n} av ${d} like deler er grønne. Det er ${fraction(n,d)}.`, grid(d,1,n,'bar'));
  }],
  fractionOf:['fractions', int => {
    const d = int(3, 6), n = int(1, d-1), each = int(2, 7), all = d*each;
    return number('Finn en del av mengden', `Hvor mye er ${fraction(n,d)} av ${all}?`, n*each, `Del ${all} i ${d} like store grupper.`, `Hver gruppe har ${each}. Hvor mye er ${n} slike grupper?`,
      `${all} ÷ ${d} = ${each}. Så blir ${n} × ${each} = ${n*each}.`);
  }],
  fractionCompare:['fractions', (int,pick) => {
    const a = int(2, 8), b = int(1, a-1), bigger = pick([true,false]);
    const first = bigger ? b+1 : b, second = bigger ? b : b+1;
    const d = a+1, sign = bigger ? '>' : '<';
    return exercise('Hvilket tegn passer?', `${fraction(first,d)}  ?  ${fraction(second,d)}`, sign, ['=', bigger ? '<' : '>'],
      'Når nevnerne er like, er delene like store.', 'Sammenlign tellerne. Størst teller betyr flest deler.', `${fraction(first,d)} ${sign} ${fraction(second,d)}.`);
  }],
  fractionDecimal:['decimals', (int,pick) => {
    const d = pick([2,4,5,10]), n = int(1,d-1), answer = n/d;
    return number('Skriv som desimaltall', fraction(n,d), answer, 'Brøkstreken betyr deling.', `Regn ${n} delt på ${d}.`,
      `${fraction(n,d)} = ${format(answer)}.`, {step:.1, visual:grid(d,1,n,'bar')});
  }],
  oneStep:['algebra', (int,pick) => {
    const x = int(2, 12), n = int(2, 12), plus = pick([true,false]), rhs = plus ? x+n : x*n;
    const expr = plus ? `x + ${n}` : `${n}x`;
    return number('Hva er x?', `${expr} = ${rhs}`, x, 'Finn hva som gjøres med x på venstre side.',
      plus ? `Trekk ${n} fra på begge sider.` : `Del på ${n} på begge sider.`, `x = ${x}, fordi ${plus ? `${x} + ${n}` : `${n} × ${x}`} = ${rhs}.`);
  }],
  chance:['probability', int => {
    const blue = int(2, 7), red = int(1, 6), total = blue+red;
    return exercise('Hva er sannsynligheten?', `En pose har ${blue} blå og ${red} røde brikker. Hva er sjansen for å trekke blått?`,
      fraction(blue,total), [fraction(blue,total+1), fraction(blue,total-1)], 'Tell hvor mange brikker som gir ønsket farge.',
      'Bruk antallet blå som teller og alle brikkene som nevner.', `${blue} av ${total} mulige brikker er blå. Sannsynligheten er ${fraction(blue,total)}.`);
  }],
  decimalSum:['decimals', int => {
    const a = int(12, 58), b = int(11, 48), answer = (a+b)/10;
    return number('Hvor mye har du til sammen?', `${format(a/10)} m bånd + ${format(b/10)} m bånd`, answer, 'Legg sammen meter og tideler for seg.',
      'Ti tideler er én hel meter.', `${format(a/10)} + ${format(b/10)} = ${format(answer)} m.`, {step:.1, unit:' m'});
  }],
  percentOf:['decimals', (int,pick) => {
    const p = pick([10,20,25,50,75]), total = 20*int(2, 20), answer = total*p/100;
    return number('Finn delen i kroner', `${p} % av ${total} kr`, answer, 'Prosent betyr hundredeler.', `Regn ${total} × ${p}/100.`,
      `${p} % av ${total} kr er ${answer} kr.`, {unit:' kr', wrong:[total-answer, total]});
  }],
  area:['geometry', int => {
    const a = int(3, 12), b = int(2, 9);
    return number('Finn arealet', `Rektangelet er ${a} cm langt og ${b} cm bredt.`, a*b, 'Arealet dekker hele flaten.', 'Gang lengden med bredden.',
      `${a} cm × ${b} cm = ${a*b} cm².`, {unit:' cm²', wrong:[2*(a+b), a+b]});
  }],
  perimeter:['geometry', int => {
    const a = int(3, 14), b = int(2, 9), answer = 2*(a+b);
    return number('Finn omkretsen', `Rektangelet er ${a} cm langt og ${b} cm bredt.`, answer, 'Omkrets er hele veien rundt.', 'Rektangelet har to lengder og to bredder.',
      `2 × (${a} + ${b}) = ${answer} cm.`, {unit:' cm', wrong:[a+b, a*b]});
  }],
  prism:['geometry', int => {
    const a = int(3, 11), b = int(2, 8), h = int(2, 7), volume = a*b*h;
    return number('Finn volumet', `En rektangulær boks er ${a} cm lang, ${b} cm bred og ${h} cm høy.`, volume, 'Finn arealet av bunnen.', 'Gang bunnarealet med høyden.',
      `${a} × ${b} × ${h} = ${volume} cm³.`, {unit:' cm³', wrong:[a*b, a+b+h]});
  }],
  diameter:['geometry', int => {
    const r = int(2, 15);
    return number('Finn diameteren', `Radiusen i sirkelen er ${r} cm.`, 2*r, 'Radius går fra midten til kanten.', 'Diameteren går tvers over og gjennom midten.',
      `${r} + ${r} = ${2*r} cm.`, {unit:' cm', wrong:[r, r*r]});
  }],
  integers:['signed', (int,pick) => {
    const a = int(-12, 6), b = int(2, 12), step = pick([-b,b]), answer = a+step;
    return number('Hvor ender du på tallinja?', `${format(a)} ${step < 0 ? '−' : '+'} ${b} = ?`, answer, `Start på ${format(a)}.`,
      `Flytt ${b} steg ${step < 0 ? 'mot venstre' : 'mot høyre'}.`, `Du ender på ${format(answer)}.`, {minimum:-30, wrong:[a-step, -answer]});
  }],
  order:['operations', int => {
    const a = int(2, 8), b = int(2, 9), c = int(2, 8), answer = a+b*c;
    return number('Hva er verdien av uttrykket?', `${a} + ${b} × ${c}`, answer, 'Ganging kommer før pluss.', `Regn ${b} × ${c} først.`,
      `${a} + ${b*c} = ${answer}.`, {wrong:[(a+b)*c, a+b+c]});
  }],
  fractionSum:['fractions', int => {
    const d = int(3, 7), a = int(1, d-2), b = int(1, 3), denominator = 2*d;
    return exercise('Legg sammen brøkene', `${fraction(a,d)} + ${fraction(b,denominator)}`, reduced(2*a+b,denominator),
      [reduced(a+b,denominator), reduced(a+b,d)], 'Finn en felles nevner før du legger sammen.',
      `Utvid den første brøken til ${fraction(2*a,denominator)}.`, `${fraction(2*a,denominator)} + ${fraction(b,denominator)} = ${reduced(2*a+b,denominator)}.`);
  }],
  percentMatch:['decimals', (int,pick) => {
    const denominator = pick([4,5,10,20]), numerator = int(1, denominator-1), value = numerator*100/denominator;
    return number('Skriv brøken som prosent', fraction(numerator,denominator), value, 'Prosent betyr av hundre.', `Gang teller og nevner med ${100/denominator}.`,
      `${fraction(numerator,denominator)} er ${value}/100, altså ${value} %.`, {unit:' %', step:5, wrong:[100-value]});
  }],
  linearEquation:['algebra', int => {
    const x = int(2, 12), a = int(2, 8), b = int(-9, 9), rhs = a*x+b;
    return number('Løs likningen', `${equation(a,b)} = ${format(rhs)}`, x,
      'Få leddet med x alene ved å gjøre det samme på begge sider.', `Da står det ${a}x = ${a*x}. Del på ${a}.`,
      `x = ${x}. Setter du det inn, får du ${format(rhs)} på begge sider.`);
  }],
  mean:['statistics', int => {
    const mid = int(6, 16), gap = int(2, 5), data = [mid+gap, mid-1, mid-gap, mid+1];
    return number('Finn gjennomsnittet', data.join(' · '), mid, 'Legg sammen alle verdiene.', `Summen er ${4*mid}. Del på antallet verdier.`, `${4*mid} ÷ 4 = ${mid}.`);
  }],
  median:['statistics', int => {
    const mid = int(5, 15), low = mid-int(1,4), high = mid+int(1,4), data = shuffle([high, low, mid, low-1, high+1],int);
    return number('Finn medianen', data.join(' · '), mid, 'Sorter tallene fra minst til størst.', 'Med fem tall er medianen det tredje tallet.',
      `I rekken ${[...data].sort((a,b)=>a-b).join(', ')} står ${mid} i midten.`, {wrong:[low,high]});
  }],
  range:['statistics', int => {
    const low = int(2, 12), gap = int(4, 16), high = low+gap, data = shuffle([high-1, high, low+2, low],int);
    return number('Finn variasjonsbredden', data.join(' · '), gap, 'Finn største og minste verdi.', 'Trekk minste fra største.',
      `${high} − ${low} = ${gap}.`, {wrong:[high, low+high]});
  }],
  primeFactors:['factors', (int,pick) => {
    const a = pick([2,3]), b = pick([5,7,11]), n = a*a*b;
    return exercise('Skriv tallet som primtallsfaktorer', String(n), `${a} × ${a} × ${b}`, [`${a*a} × ${b}`, `${a} × ${b}`],
      'Prøv å dele tallet på et lite primtall.', `Del på ${a} to ganger. Hva står igjen?`, `${n} = ${a} × ${a} × ${b}. Hver faktor er et primtall.`);
  }],
  reduceFraction:['fractions', (int,pick) => {
    const [n,d] = pick([[1,2],[1,3],[2,3],[2,5],[3,4],[3,5],[4,7]]), f = int(2, 9);
    return exercise('Forkort brøken så langt som mulig', fraction(n*f,d*f), fraction(n,d), [fraction(n+1,d), fraction(n,d+1)],
      'Finn en felles faktor i teller og nevner.', `Del begge på ${f}.`, `${fraction(n*f,d*f)} = ${fraction(n,d)}.`);
  }],
  expression:['algebra', int => {
    const a = int(2, 7), b = int(-6, 8), x = int(2, 9), value = a*x+b;
    return number('Sett inn verdien for x', `Regn ut ${equation(a,b)} når x = ${x}.`, value, `Sett inn ${x} der det står x.`, `Gang ${a} med ${x} før du tar med det siste leddet.`,
      `${equation(a,b).replace('x', ` × ${x}`)} = ${format(value)}.`, {minimum:-20});
  }],
  patternRule:['algebra', int => {
    const a = int(2, 8), b = int(1, 7);
    return exercise('Hvilken regel passer?', 'n er figurnummer. Velg uttrykket for antall brikker.',
      `${a}n + ${b}`, [`${a}n − ${b}`, `${a+1}n + ${b}`], 'Sammenlign to tall som står ved siden av hverandre.', `Antallet øker med ${a} hver gang. Hva er konstantleddet?`,
      `Regelen er ${a}n + ${b}. Når n = 1, blir det ${a+b}.`, table(['n','Brikker'], [[1,a+b],[2,2*a+b],[3,3*a+b]]));
  }],
  functionTable:['functions', int => {
    const a = int(2, 8), b = int(1, 7), x = int(3, 6), value = a*x+b;
    return number('Les av funksjonen', `f(x) = ${equation(a,b)}. Hva er f(${x})?`, value,
      `Bruk ${x} som x-verdi.`, `Gang ${x} med ${a} og legg til ${b}.`, `f(${x}) = ${value}.`,
      {visual:table(['x','f(x)'], [[0,b],[1,a+b],[x,'?']])});
  }],
  speed:['rates', int => {
    const h = int(2, 5), speed = int(12, 75), distance = speed*h;
    return number('Finn gjennomsnittsfarten', `Du reiser ${distance} km på ${h} timer.`, speed, 'Gjennomsnittsfart er avstand per time.', 'Del avstanden på reisetiden.',
      `${distance} ÷ ${h} = ${speed} km/t.`, {unit:' km/t', wrong:[distance, distance-h]});
  }],
  pythagoras:['geometry', (int,pick) => {
    const [a,b,c] = pick([[3,4,5],[5,12,13],[6,8,10],[8,15,17],[9,12,15],[12,16,20]]);
    return number('Finn hypotenusen', `Katetene i en rettvinklet trekant er ${a} cm og ${b} cm.`, c,
      'Hypotenusen er siden mot den rette vinkelen.', `Regn ${a}² + ${b}² og ta kvadratroten.`, `√(${a}² + ${b}²) = √${c*c} = ${c} cm.`,
      {unit:' cm', wrong:[a+b,b]});
  }],
  scale:['geometry', (int,pick) => {
    const k = pick([2,3,4,5]), a = int(2, 12);
    return number('Finn den nye sidelengden', `En figur forstørres med faktor ${k}. En side var ${a} cm.`, a*k, 'Alle sidelengder endres med samme faktor.',
      `Gang ${a} med ${k}.`, `${a} × ${k} = ${a*k} cm.`, {unit:' cm', wrong:[a+k,a*k*k]});
  }],
  dice:['probability', int => {
    const threshold = int(2, 5), good = 6-threshold;
    return exercise('Hva er sannsynligheten?', `En vanlig terning kastes. Hva er sjansen for å få mer enn ${threshold}?`, reduced(good,6),
      [reduced(good+1,6), reduced(good-1,6)], 'List opp utfallene som er større enn grensen.', 'Sett antallet gunstige utfall over 6.',
      `${good} av 6 utfall er større enn ${threshold}. Sannsynligheten er ${reduced(good,6)}.`);
  }],
  slope:['functions', int => {
    const x = int(1, 5), delta = int(2, 5), y = int(4, 18), slope = int(-5, 6);
    const next = y + delta*slope;
    return number('Finn stigningstallet', 'Tabellen viser to punkter på en rett linje.', slope, 'Finn endringen i y og endringen i x.',
      `Del endringen i y, ${format(next-y)}, på endringen i x, ${delta}.`, `Stigningstallet er ${format(next-y)} ÷ ${delta} = ${format(slope)}.`,
      {minimum:-30, wrong:[next-y,-slope], visual:table(['x','y'], [[x,y],[x+delta,next]])});
  }],
  growthFactor:['functions', (int,pick) => {
    const p = int(2, 30), sign = pick([-1,1]), factor = 1+sign*p/100;
    return number('Finn vekstfaktoren', `En pris ${sign<0 ? 'synker' : 'stiger'} med ${p} %.`, factor, 'Ta utgangspunkt i 100 % av den gamle prisen.',
      `Den nye prisen er ${100+sign*p} % av den gamle.`, `Vekstfaktoren er ${100+sign*p}/100 = ${format(factor)}.`,
      {step:.01, wrong:[1-sign*p/100, p/100]});
  }],
  repeatedGrowth:['functions', (int,pick) => {
    const start = 100*int(1, 12), p = pick([5,10,20]), value = start*(1+p/100)**2;
    return number('Finn verdien etter to endringer', `${start} kr øker med ${p} % hvert år i to år.`, value, 'Hvert år beregnes økningen fra den nye verdien.',
      `Gang med ${format(1+p/100)} to ganger.`, `${start} × ${format(1+p/100)}² = ${format(value)} kr.`,
      {unit:' kr', step:.5, wrong:[start*(1+2*p/100), start*(1+p/100)]});
  }],
  systemSum:['algebra', int => {
    const y = int(2, 10), x = y+int(2, 9), sum = x+y, diff = x-y;
    return number('Finn x i likningssettet', `x + y = ${sum}\nx − y = ${diff}`, x, 'Legg sammen de to likningene.', 'Da forsvinner y. Del begge sider på 2.',
      `2x = ${sum} + ${diff} = ${2*x}. Dermed er x = ${x}.`, {wrong:[y,sum]});
  }],
  systemPrice:['algebra', int => {
    const pen = 5*int(2, 8), book = 5*int(9, 17);
    return number('Hva koster én penn?', `En bok og én penn koster ${book+pen} kr. En bok og to penner koster ${book+2*pen} kr.`, pen,
      'Sammenlign de to kjøpene.', 'Trekk prisen på det første kjøpet fra prisen på det andre.',
      `${book+2*pen} − ${book+pen} = ${pen} kr for den ekstra pennen.`, {unit:' kr', wrong:[book,2*pen]});
  }],
  discount:['finance', (int,pick) => {
    const old = 20*int(15, 80), p = pick([10,20,25,30,50]), discount = old*p/100, answer = old-discount;
    return number('Hva er tilbudsprisen?', `En vare koster ${old} kr før ${p} % rabatt.`, answer, 'Regn ut rabatten i kroner først.',
      `Trekk rabatten på ${discount} kr fra den gamle prisen.`, `${old} − ${discount} = ${answer} kr.`, {unit:' kr', wrong:[discount,old+discount]});
  }],
  interest:['finance', int => {
    const money = 100*int(10, 60), rate = int(2, 8), extra = money*rate/100;
    return number('Hvor mye står på kontoen?', `Du sparer ${money} kr og får ${rate} % rente på ett år.`, money+extra,
      'Renten legges til sparebeløpet.', `Regn ut ${rate} % av ${money} kr, og legg til sparebeløpet.`, `${money} + ${extra} = ${money+extra} kr.`,
      {unit:' kr', wrong:[extra,money-extra]});
  }],
};

export const curriculumTopic = type => Object.hasOwn(tasks, type) ? tasks[type][0] : null;

export function createCurriculumTask(type, rng, index) {
  const int = (a,b) => a + Math.floor(rng()*(b-a+1));
  const pick = items => items[int(0,items.length-1)];
  const { title, prompt, options, hints, visual } = tasks[type][1](int,pick);
  // Only the display labels vary. Numeric indices keep the existing answer flow.
  const order = shuffle([0,1,2],int);
  return {
    id:`${index}-${type}`, type, title, prompt, hints, labels:order.map(i=>options[i]),
    answer:order.indexOf(0), choices:[0,1,2], ...(visual && {visual}), support:'visible', mode:'choice',
  };
}

export function validCurriculumTask(task) {
  const text = (value, max) => typeof value === 'string' && value.length <= max;
  const visual = task.visual;
  const whole = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  const validators = {
    grid:() => whole(visual.columns,1,10) && whole(visual.rows,1,10)
      && whole(visual.filled,0,visual.columns*visual.rows) && ['dots','bar','squares'].includes(visual.style)
      && (visual.split===undefined || whole(visual.split,1,visual.filled-1) && visual.style==='dots'),
    shape:() => whole(visual.sides,3,6),
    point:() => whole(visual.x,1,4) && whole(visual.y,1,4),
    table:() => Array.isArray(visual.headers) && visual.headers.length === 2 && visual.headers.every(v=>text(v,20))
      && Array.isArray(visual.cells) && visual.cells.length <= 6
      && visual.cells.every(row=>Array.isArray(row) && row.length === 2 && row.every(v=>text(v,20)||whole(v,-1000,1000))),
  };
  const validVisual = !visual || Object.hasOwn(validators, visual.kind) && validators[visual.kind]();
  return whole(task.answer,0,2) && task.choices.every(v=>whole(v,0,2))
    && text(task.title,100) && text(task.prompt,230)
    && Array.isArray(task.hints) && task.hints.length === 3 && task.hints.every(v=>text(v,250))
    && Array.isArray(task.labels) && task.labels.length === 3 && new Set(task.labels).size === 3
    && task.labels.every(v=>text(v,40)) && validVisual;
}
