import {text as msg} from './i18n.js';
// Short practice tracks based on selected competence aims in MAT01-05.
function track(label, description, ...types) {
  return { label, description, max:999, pattern:Array.from({length:8}, (_, i) => types[i % types.length]) };
}

export const CURRICULUM_LEVELS = {
  11:track(msg('track.11.label'), msg('track.11.description'), 'tally', 'tinyAdd', 'tinySubtract', 'compareQuantity'),
  21:track(msg('track.21.label'), msg('track.21.description'), 'pattern', 'shapeSides', 'tally', 'clockHours'),
  22:track(msg('track.22.label'), msg('track.22.description'), 'coinTotal', 'coinExchange', 'smallChange'),
  31:track(msg('track.31.label'), msg('track.31.description'), 'coordinate', 'measure', 'coordinateMove'),
  32:track(msg('track.32.label'), msg('track.32.description'), 'noteExchange', 'moneyChange', 'shoppingSum', 'moneyMissing'),
  33:track(msg('track.33.label'), msg('track.33.description'), 'lineAdd', 'lineSubtract', 'lineMissing'),
  41:track(msg('track.41.label'), msg('track.41.description'), 'tables', 'sharing', 'arrayCount', 'groupsMissing'),
  42:track(msg('track.42.label'), msg('track.42.description'), 'arrayCount', 'boxUnits', 'pattern', 'compositeArea'),
  51:track(msg('track.51.label'), msg('track.51.description'), 'fractionModel', 'fractionOf', 'fractionCompare', 'fractionDecimal', 'equivalentFraction'),
  52:track(msg('track.52.label'), msg('track.52.description'), 'oneStep', 'chance', 'chanceCompare'),
  53:track(msg('track.53.label'), msg('track.53.description'), 'bundleTotal', 'unitPrice', 'moneyBudget', 'moneyChange'),
  61:track(msg('track.61.label'), msg('track.61.description'), 'decimalSum', 'percentOf', 'fractionOf', 'decimalDifference'),
  62:track(msg('track.62.label'), msg('track.62.description'), 'area', 'perimeter', 'prism', 'diameter', 'angleRemainder'),
  71:track(msg('track.71.label'), msg('track.71.description'), 'integers', 'order', 'orderCompare'),
  72:track(msg('track.72.label'), msg('track.72.description'), 'fractionSum', 'fractionDecimal', 'percentMatch', 'fractionDifference'),
  73:track(msg('track.73.label'), msg('track.73.description'), 'linearEquation', 'mean', 'median', 'missingMean'),
  81:track(msg('track.81.label'), msg('track.81.description'), 'primeFactors', 'reduceFraction', 'divisible'),
  82:track(msg('track.82.label'), msg('track.82.description'), 'expression', 'linearEquation', 'patternRule', 'distributive'),
  83:track(msg('track.83.label'), msg('track.83.description'), 'functionTable', 'speed', 'intercept'),
  91:track(msg('track.91.label'), msg('track.91.description'), 'pythagoras', 'scale', 'prism', 'scaleBack'),
  92:track(msg('track.92.label'), msg('track.92.description'), 'median', 'range', 'chance', 'dice', 'frequency'),
  101:track(msg('track.101.label'), msg('track.101.description'), 'slope', 'growthFactor', 'repeatedGrowth', 'comparePlans'),
  102:track(msg('track.102.label'), msg('track.102.description'), 'systemSum', 'systemPrice', 'systemTotal'),
  103:track(msg('track.103.label'), msg('track.103.description'), 'discount', 'interest', 'speed', 'budgetBalance'),
};

export const GRADE_LEVELS = {
  1:[11, 1, 22], 2:[1, 2, 21, 22], 3:[1, 2, 33, 3, 4, 31, 32], 4:[4, 41, 42, 32], 5:[51, 52, 53],
  6:[61, 62, 53], 7:[71, 72, 73], 8:[81, 82, 83], 9:[91, 92], 10:[101, 102, 103],
};

export function levelsForGrade(grade) {
  return Object.hasOwn(GRADE_LEVELS, grade) ? GRADE_LEVELS[grade] : [1, 2, 3, 4];
}

export function levelForGrade(grade, level) {
  const choices = levelsForGrade(grade);
  return choices.includes(level) ? level : ({3:2, 4:41}[grade] || choices[0]);
}

export function nextLevelForGrade(grade, level, excluded=[]) {
  if (!Object.hasOwn(GRADE_LEVELS, grade)) return null;
  const choices = GRADE_LEVELS[grade];
  const index = choices.indexOf(level);
  return index >= 0 ? choices.slice(index+1).find(choice=>!excluded.includes(choice)) ?? null : null;
}

export const CURRICULUM_TOPICS = {
  quantities:msg('topic.quantities'), patterns:msg('topic.patterns'), geometry:msg('topic.geometry'),
  fractions:msg('topic.fractions'), decimals:msg('topic.decimals'), algebra:msg('topic.algebra'),
  statistics:msg('topic.statistics'), probability:msg('topic.probability'), signed:msg('topic.signed'),
  operations:msg('topic.operations'), factors:msg('topic.factors'), functions:msg('topic.functions'),
  finance:msg('topic.finance'), rates:msg('topic.rates'), numberLine:msg('topic.numberLine'),
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
const money = (pieces, exchange) => ({kind:'money',pieces,...(exchange && {exchange})});
const equation = (a, b) => `${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;

function numberLine(int,direction,missing=false) {
  const ten=int(2,8)*10;
  const first=int(2,7),second=int(2,7);
  const start=ten-first*direction,end=ten+second*direction;
  const sign=direction>0?'+':'−',way=direction>0?msg('exercise.numberLine.way.if'):msg('exercise.numberLine.way.else');
  const visual={kind:'numberLine',start,middle:ten,end,missing};
  const solution=msg('exercise.numberLine.equation', {start, sign, first, ten, second, end});
  if (missing) return number(msg('exercise.numberLine.title'), msg('exercise.numberLine.prompt', {start, end, ten}), second,
    msg('exercise.numberLine.hint', {ten}), msg('exercise.numberLine.method', {way, ten, end}),
    msg('exercise.numberLine.solution', {second, way, solution}),{minimum:1,visual});
  return number(msg('exercise.numberLine.variant2.title'), `${start} ${sign} ${first+second} = ?`, end,
    msg('exercise.numberLine.variant2.hint', {first, way, start, ten}),msg('exercise.numberLine.variant2.method', {second, way, ten}),
    solution,{wrong:[ten,ten-direction*second],visual});
}

const tasks = {
  lineAdd:['numberLine',int=>numberLine(int,1)],
  lineSubtract:['numberLine',int=>numberLine(int,-1)],
  lineMissing:['numberLine',(int,pick)=>numberLine(int,pick([1,-1]),true)],
  coinTotal:['finance', (_int,pick) => {
    const pieces=[pick([1,5,10]),pick([1,5]),pick([1,5])];
    const total=pieces.reduce((sum,coin)=>sum+coin,0);
    return number(msg('exercise.coinTotal.title'), msg('exercise.coinTotal.prompt'),total,
      msg('exercise.coinTotal.hint'), msg('exercise.coinTotal.method', {value1: pieces.join(' + ')}),
      msg('exercise.coinTotal.solution', {value1: pieces.join(' + '), total}),{unit:' kr',visual:money(pieces)});
  }],
  coinExchange:['finance', (_int,pick) => {
    const [amount,coin]=pick([[5,1],[10,1],[10,5],[20,5],[20,10]]);
    const count=amount/coin;
    return number(msg('exercise.coinExchange.title'), msg('exercise.coinExchange.prompt', {amount, coin}),count,
      msg('exercise.coinExchange.hint'),
      msg('exercise.coinExchange.method', {coin, amount}),
      msg('exercise.coinExchange.solution', {count, coin, amount}),{minimum:1,visual:money([amount],coin)});
  }],
  smallChange:['finance', (int,pick) => {
    const paid=pick([10,20]),price=int(3,paid-1),change=paid-price;
    return number(msg('exercise.smallChange.title'), msg('exercise.smallChange.prompt', {price, paid}),change,
      msg('exercise.smallChange.hint', {paid, price}), msg('exercise.smallChange.method'),
      msg('exercise.smallChange.solution', {paid, price, change}),{unit:' kr',visual:money([paid])});
  }],
  noteExchange:['finance', (_int,pick) => {
    const [amount,coin]=pick([[50,5],[50,10],[100,5],[100,10],[100,20],[200,10],[200,20]]);
    const count=amount/coin;
    return number(msg('exercise.noteExchange.title'), msg('exercise.noteExchange.prompt', {amount, coin}),count,
      msg('exercise.noteExchange.hint', {coin, amount}),
      msg('exercise.noteExchange.method', {coin, amount}),
      msg('exercise.noteExchange.solution', {amount, coin, count}),{minimum:1,visual:money([amount],coin)});
  }],
  moneyChange:['finance', (int,pick) => {
    const paid=pick([50,100,200]);
    const price=int(12,paid-4);
    const item=pick(['En billett','En is','En notatbok','En fruktpose','En refleks']);
    const change=paid-price;
    return number(msg('exercise.moneyChange.title'), msg('exercise.moneyChange.prompt', {item, price, paid}),change,
      msg('exercise.moneyChange.hint'), msg('exercise.moneyChange.method', {price, paid}),
      msg('exercise.moneyChange.solution', {paid, price, change}),{unit:' kr',visual:money([paid])});
  }],
  shoppingSum:['finance', (int,pick) => {
    const a=int(9,48),b=int(7,37);
    const [first,second]=pick([['En blyant','et viskelær'],['En bolle','en juice'],['En is','et eple'],['En refleks','et klistremerke']]);
    return number(msg('exercise.shoppingSum.title'), msg('exercise.shoppingSum.prompt', {first, a, second, b}),a+b,
      msg('exercise.shoppingSum.hint'), msg('exercise.shoppingSum.method', {a, b}),
      msg('exercise.shoppingSum.solution', {a, b, value3: a+b}),{unit:' kr'});
  }],
  moneyMissing:['finance', (int,pick) => {
    const goal=pick([50,100,150,200]),saved=int(14,goal-4);
    return number(msg('exercise.moneyMissing.title'), msg('exercise.moneyMissing.prompt', {goal, saved}),goal-saved,
      msg('exercise.moneyMissing.hint'),
      msg('exercise.moneyMissing.method', {saved, goal}),
      msg('exercise.moneyMissing.solution', {goal, saved, value3: goal-saved}),{unit:' kr'});
  }],
  bundleTotal:['finance', (int,pick) => {
    const quantity=int(2,6),price=int(12,44),item=pick(['billetter','klippekort','reflekser','notatbøker']);
    return number(msg('exercise.bundleTotal.title'), msg('exercise.bundleTotal.prompt', {quantity, item, price}),quantity*price,
      msg('exercise.bundleTotal.hint', {quantity}), msg('exercise.bundleTotal.method', {quantity, price}),
      msg('exercise.bundleTotal.solution', {quantity, price, value3: quantity*price}),{unit:' kr',step:price});
  }],
  unitPrice:['finance', (int,pick) => {
    const quantity=int(2,6),price=int(11,35),item=pick(['boller','blyanter','is','reflekser']);
    const total=quantity*price;
    return number(msg('exercise.unitPrice.title'), msg('exercise.unitPrice.prompt', {quantity, item, total}),price,
      msg('exercise.unitPrice.hint', {quantity}), msg('exercise.unitPrice.method', {total, quantity}),
      msg('exercise.unitPrice.solution', {total, quantity, price}),{unit:' kr'});
  }],
  moneyBudget:['finance', (int,pick) => {
    const budget=pick([100,200,500]),a=int(14,Math.floor(budget*.55)),b=int(11,budget-a-4);
    return number(msg('exercise.moneyBudget.title'), msg('exercise.moneyBudget.prompt', {budget, a, b}),budget-a-b,
      msg('exercise.moneyBudget.hint'), msg('exercise.moneyBudget.method', {a, b, budget}),
      msg('exercise.moneyBudget.solution', {budget, value2: a+b, value3: budget-a-b}),{unit:' kr',visual:money([budget])});
  }],
  compareQuantity:['quantities', int => {
    const a=int(2,7),b=a+int(1,3);
    return number(msg('exercise.compareQuantity.title'), msg('exercise.compareQuantity.prompt', {a, b}),b,msg('exercise.compareQuantity.hint'),
      msg('exercise.compareQuantity.method'),msg('exercise.compareQuantity.solution', {b, a}),{wrong:[a,b+1]});
  }],
  clockHours:['geometry', int => {
    const start=int(8,13),hours=int(2,4);
    return number(msg('exercise.clockHours.title'), msg('exercise.clockHours.prompt', {start, value2: start+hours}),hours,
      msg('exercise.clockHours.hint'),msg('exercise.clockHours.method', {start, value2: start+hours}),msg('exercise.clockHours.solution', {hours}),{unit:' timer'});
  }],
  coordinateMove:['geometry', int => {
    const x=int(1,3),y=int(1,3),step=int(1,4-x);
    const answer=`(${x+step}, ${y})`;
    return exercise(msg('exercise.coordinateMove.title'),msg('exercise.coordinateMove.prompt', {x, y, step}),answer,
      [`(${x}, ${y+step})`,`(${x}, ${y})`],msg('exercise.coordinateMove.hint'),
      msg('exercise.coordinateMove.method', {step, x}),msg('exercise.coordinateMove.solution', {answer}),{kind:'point',x,y});
  }],
  groupsMissing:['quantities', int => {
    const rows=int(2,5),per=int(3,7),total=rows*per;
    return number(msg('exercise.groupsMissing.title'), msg('exercise.groupsMissing.prompt', {total, per}),rows,
      msg('exercise.groupsMissing.hint'),msg('exercise.groupsMissing.method', {total, per}),msg('exercise.groupsMissing.solution', {total, per, rows}),{unit:' esker',wrong:[per,total-per]});
  }],
  compositeArea:['geometry', int => {
    const a=int(3,7),b=int(3,6),cut=int(1,2);
    return number(msg('exercise.compositeArea.title'), msg('exercise.compositeArea.prompt', {a, b, cut}),a*b-cut,
      msg('exercise.compositeArea.hint'),msg('exercise.compositeArea.method', {a, b, cut}),msg('exercise.compositeArea.solution', {a, b, cut, value4: a*b-cut}),{wrong:[a*b,a*b+cut]});
  }],
  equivalentFraction:['fractions', int => {
    const n=int(1,3),d=n+int(2,5),k=int(2,4);
    return exercise(msg('exercise.equivalentFraction.title'),msg('exercise.equivalentFraction.prompt', {n, d}),`${n*k}/${d*k}`,
      [`${n*k}/${d}`,`${n}/${d*k}`],msg('exercise.equivalentFraction.hint'),
      msg('exercise.equivalentFraction.method', {k}),`${n}/${d} = ${n*k}/${d*k}.`);
  }],
  chanceCompare:['probability', int => {
    const red=int(2,4),blue=red+int(1,3);
    return exercise(msg('exercise.chanceCompare.title'),msg('exercise.chanceCompare.prompt', {red, blue}),'Å få blå',
      ['Å få rød','Like stor sjanse'],msg('exercise.chanceCompare.hint'),msg('exercise.chanceCompare.method', {red, blue}),
      msg('exercise.chanceCompare.solution'));
  }],
  decimalDifference:['decimals', int => {
    const cents=int(3,8),paid=int(4,9),price=paid-cents/10;
    return number(msg('exercise.decimalDifference.title'),msg('exercise.decimalDifference.prompt', {paid, value2: format(price)}),cents/10,
      msg('exercise.decimalDifference.hint'),msg('exercise.decimalDifference.method', {paid, value2: format(price)}),
      msg('exercise.decimalDifference.solution', {value1: format(cents/10)}),{unit:' kr',step:.1,wrong:[price,cents]});
  }],
  angleRemainder:['geometry', int => {
    const a=5*int(5,12);
    return number(msg('exercise.angleRemainder.title'),msg('exercise.angleRemainder.prompt', {a}),90-a,
      msg('exercise.angleRemainder.hint'),msg('exercise.angleRemainder.method', {a}),`90° − ${a}° = ${90-a}°.`,{unit:'°',wrong:[180-a,90+a]});
  }],
  orderCompare:['operations', int => {
    const a=int(2,5),b=int(3,7),c=int(2,5);
    return number(msg('exercise.orderCompare.title'),`(${a} + ${b}) × ${c}`,(a+b)*c,
      msg('exercise.orderCompare.hint'),msg('exercise.orderCompare.method', {value1: a+b, c}),`${a+b} × ${c} = ${(a+b)*c}.`,{wrong:[a+b*c,a+b+c]});
  }],
  fractionDifference:['fractions', int => {
    const denominator=int(5,10),n=int(3,denominator-1),part=int(1,n-1);
    return exercise(msg('exercise.fractionDifference.title'),msg('exercise.fractionDifference.prompt', {n, denominator, part}),
      `${n-part}/${denominator}`,[`${n+part}/${denominator}`,`${n}/${denominator}`],
      msg('exercise.fractionDifference.hint'),msg('exercise.fractionDifference.method', {part, n}),
      msg('exercise.fractionDifference.solution', {value1: n-part, denominator}));
  }],
  missingMean:['statistics', int => {
    const mean=int(5,16),d=int(1,4),last=mean+d;
    return number(msg('exercise.missingMean.title'),msg('exercise.missingMean.prompt', {mean, value2: mean-d}),last,
      msg('exercise.missingMean.hint'),msg('exercise.missingMean.method', {value1: mean-d, mean, value3: mean*3}),
      msg('exercise.missingMean.solution', {last}),{wrong:[mean,mean-d]});
  }],
  divisible:['factors', int => {
    const d=int(3,9),n=d*int(3,9);
    return number(msg('exercise.divisible.title'),msg('exercise.divisible.prompt', {d}),n,
      msg('exercise.divisible.hint', {d}),msg('exercise.divisible.method', {d}),msg('exercise.divisible.solution', {n, d}),{wrong:[n-1,n+1]});
  }],
  distributive:['algebra', int => {
    const a=int(2,6),b=int(2,7);
    return exercise(msg('exercise.distributive.title'),msg('exercise.distributive.prompt', {a, b}),`${a}x + ${a*b}`,
      [`${a}x + ${b}`,`x + ${a*b}`],msg('exercise.distributive.hint'),
      msg('exercise.distributive.method', {a, b}),msg('exercise.distributive.solution', {a, b, value4: a*b}));
  }],
  intercept:['functions', int => {
    const a=int(2,7),b=int(2,14);
    return number(msg('exercise.intercept.title'),msg('exercise.intercept.prompt', {a, b}),b,msg('exercise.intercept.hint'),
      msg('exercise.intercept.method'),msg('exercise.intercept.solution', {a, b}),{wrong:[a,a+b]});
  }],
  scaleBack:['geometry', int => {
    const scale=int(2,6),a=int(3,9);
    return number(msg('exercise.scaleBack.title'),msg('exercise.scaleBack.prompt', {scale, value2: scale*a}),a,
      msg('exercise.scaleBack.hint'),msg('exercise.scaleBack.method', {value1: scale*a, scale}),
      msg('exercise.scaleBack.solution', {a}),{unit:' cm',wrong:[scale*a,scale*a*scale]});
  }],
  frequency:['statistics', int => {
    const a=int(2,6),b=int(7,12),c=int(13,20);
    return number(msg('exercise.frequency.title'), msg('exercise.frequency.prompt'),a+b+c,
      msg('exercise.frequency.hint'),msg('exercise.frequency.method', {a, b, c}),`${a} + ${b} + ${c} = ${a+b+c}.`,
      {visual:table(['Svar','Antall'],[['A',a],['B',b],['C',c]]),wrong:[a+b,b+c]});
  }],
  comparePlans:['functions', int => {
    const start=int(3,7)*10,delta=int(2,6),rides=int(3,7);
    const fee=delta*rides;
    return number(msg('exercise.comparePlans.title'),msg('exercise.comparePlans.prompt', {start, fee, value3: start-delta}),rides,
      msg('exercise.comparePlans.hint'),msg('exercise.comparePlans.method', {delta}),
      msg('exercise.comparePlans.solution', {rides}),{unit:' turer',wrong:[delta,fee]});
  }],
  systemTotal:['algebra', int => {
    const a=int(4,9),b=int(2,6);
    return number(msg('exercise.systemTotal.title'),msg('exercise.systemTotal.prompt', {value1: a+b, value2: 5*a+2*b}),
      a,msg('exercise.systemTotal.hint'),msg('exercise.systemTotal.method'),
      msg('exercise.systemTotal.solution', {value1: 5*a+2*b, value2: a+b, a}),{wrong:[b,a+b]});
  }],
  budgetBalance:['finance', int => {
    const income=100*int(17,30),fixed=100*int(8,12),extra=50*int(3,7);
    return number(msg('exercise.budgetBalance.title'),msg('exercise.budgetBalance.prompt', {income, fixed, extra}),income-fixed-extra,
      msg('exercise.budgetBalance.hint'),msg('exercise.budgetBalance.method', {value1: fixed+extra}),
      msg('exercise.budgetBalance.solution', {value1: income-fixed-extra}),{unit:' kr',wrong:[income-fixed,fixed+extra]});
  }],
  tally:['quantities', int => {
    const n = int(2, 9);
    return number(msg('exercise.tally.title'), '', n, msg('exercise.tally.hint'), msg('exercise.tally.method'), msg('exercise.tally.solution', {n}),
      {visual:grid(5, Math.ceil(n / 5), n, 'dots')});
  }],
  tinyAdd:['quantities', int => {
    const a = int(1, 6), b = int(1, 10-a);
    return number(msg('exercise.tinyAdd.title'), `${a} + ${b} = ?`, a+b, msg('exercise.tinyAdd.hint', {a}), msg('exercise.tinyAdd.method', {b}), `${a} + ${b} = ${a+b}.`,
      {visual:{...grid(5,2,a+b,'dots'), split:a}});
  }],
  tinySubtract:['quantities', int => {
    const a = int(3, 10), b = int(1, a-1);
    return number(msg('exercise.tinySubtract.title'), `${a} − ${b} = ?`, a-b, msg('exercise.tinySubtract.hint', {a}), msg('exercise.tinySubtract.method', {b}), `${a} − ${b} = ${a-b}.`,
      {visual:grid(5, Math.ceil(a / 5), a, 'dots')});
  }],
  pattern:['patterns', int => {
    const a = int(1, 12), step = int(2, 5), answer = a + 3*step;
    return number(msg('exercise.pattern.title'), `${a}, ${a+step}, ${a+2*step}, ?`, answer, msg('exercise.pattern.hint'), msg('exercise.pattern.method', {step}), `${a+2*step} + ${step} = ${answer}.`);
  }],
  shapeSides:['geometry', int => {
    const sides = int(3, 6);
    return number(msg('exercise.shapeSides.title'), '', sides, msg('exercise.shapeSides.hint'), msg('exercise.shapeSides.method'), msg('exercise.shapeSides.solution', {sides}),
      {visual:{kind:'shape', sides}});
  }],
  coordinate:['geometry', int => {
    const x = int(1, 4), y = int(1, 4);
    return exercise(msg('exercise.coordinate.title'), msg('exercise.coordinate.prompt'), `(${x}, ${y})`, [`(${x-1}, ${y})`, `(${x}, ${y-1})`],
      msg('exercise.coordinate.hint'), msg('exercise.coordinate.method', {x}), msg('exercise.coordinate.solution', {x, y}), {kind:'point', x, y});
  }],
  measure:['geometry', (int, pick) => {
    const count = int(2, 8), [from, to, factor] = pick([['m','cm',100],['kg','g',1000],['dm','cm',10]]);
    return number(msg('exercise.measure.title'), `${count} ${from} = ? ${to}`, count*factor, msg('exercise.measure.hint', {to, from}), msg('exercise.measure.method', {from, factor, to}),
      `${count} × ${factor} = ${count*factor} ${to}.`, {wrong:[count, count*factor/10], unit:` ${to}`});
  }],
  tables:['operations', int => {
    const a = int(2, 10), b = int(2, 10);
    return number(msg('exercise.tables.title'), `${a} × ${b} = ?`, a*b, msg('exercise.tables.hint', {a, b}), msg('exercise.tables.method', {b}),
      `${a} × ${b} = ${a*b}.`, {wrong:[a+b, a*b+b]});
  }],
  sharing:['operations', int => {
    const a = int(3, 9), b = int(2, 10);
    return number(msg('exercise.sharing.title'), msg('exercise.sharing.prompt', {value1: a*b, a}), b, msg('exercise.sharing.hint'), msg('exercise.sharing.method', {a, value2: a*b}),
      msg('exercise.sharing.solution', {value1: a*b, a, b}));
  }],
  arrayCount:['geometry', int => {
    const a = int(2, 8), b = int(2, 7);
    return number(msg('exercise.arrayCount.title'), '', a*b, msg('exercise.arrayCount.hint'), msg('exercise.arrayCount.method', {a, b}),
      msg('exercise.arrayCount.solution', {a, b, value3: a*b}), {wrong:[a+b, a*b+a], visual:grid(a,b)});
  }],
  boxUnits:['geometry', int => {
    const a = int(2, 5), b = int(2, 5), h = int(2, 4);
    return number(msg('exercise.boxUnits.title'), msg('exercise.boxUnits.prompt', {a, b, h}), a*b*h, msg('exercise.boxUnits.hint'), msg('exercise.boxUnits.method', {value1: a*b}),
      msg('exercise.boxUnits.solution', {value1: a*b, h, value3: a*b*h}), {wrong:[a*b, a*b+h], visual:grid(a,b)});
  }],
  fractionModel:['fractions', int => {
    const d = int(3, 8), n = int(1, d-1);
    return exercise(msg('exercise.fractionModel.title'), '', fraction(n,d), [fraction(n+1,d),fraction(n,d+1)],
      msg('exercise.fractionModel.hint'), msg('exercise.fractionModel.method'), msg('exercise.fractionModel.solution', {n, d, value3: fraction(n,d)}), grid(d,1,n,'bar'));
  }],
  fractionOf:['fractions', int => {
    const d = int(3, 6), n = int(1, d-1), each = int(2, 7), all = d*each;
    return number(msg('exercise.fractionOf.title'), msg('exercise.fractionOf.prompt', {value1: fraction(n,d), all}), n*each, msg('exercise.fractionOf.hint', {all, d}), msg('exercise.fractionOf.method', {each, n}),
      msg('exercise.fractionOf.solution', {all, d, each, n, value6: n*each}));
  }],
  fractionCompare:['fractions', (int,pick) => {
    const a = int(2, 8), b = int(1, a-1), bigger = pick([true,false]);
    const first = bigger ? b+1 : b, second = bigger ? b : b+1;
    const d = a+1, sign = bigger ? '>' : '<';
    return exercise(msg('exercise.fractionCompare.title'), `${fraction(first,d)}  ?  ${fraction(second,d)}`, sign, ['=', bigger ? '<' : '>'],
      msg('exercise.fractionCompare.hint'), msg('exercise.fractionCompare.method'), `${fraction(first,d)} ${sign} ${fraction(second,d)}.`);
  }],
  fractionDecimal:['decimals', (int,pick) => {
    const d = pick([2,4,5,10]), n = int(1,d-1), answer = n/d;
    return number(msg('exercise.fractionDecimal.title'), fraction(n,d), answer, msg('exercise.fractionDecimal.hint'), msg('exercise.fractionDecimal.method', {n, d}),
      `${fraction(n,d)} = ${format(answer)}.`, {step:.1, visual:grid(d,1,n,'bar')});
  }],
  oneStep:['algebra', (int,pick) => {
    const x = int(2, 12), n = int(2, 12), plus = pick([true,false]), rhs = plus ? x+n : x*n;
    const expr = plus ? `x + ${n}` : `${n}x`;
    return number(msg('exercise.oneStep.title'), `${expr} = ${rhs}`, x, msg('exercise.oneStep.hint'),
      plus ? msg('exercise.oneStep.method.if', {n}) : msg('exercise.oneStep.method.else', {n}), msg('exercise.oneStep.solution', {x, value2: plus ? `${x} + ${n}` : `${n} × ${x}`, rhs}));
  }],
  chance:['probability', int => {
    const blue = int(2, 7), red = int(1, 6), total = blue+red;
    return exercise(msg('exercise.chance.title'), msg('exercise.chance.prompt', {blue, red}),
      fraction(blue,total), [fraction(blue,total+1), fraction(blue,total-1)], msg('exercise.chance.hint'),
      msg('exercise.chance.method'), msg('exercise.chance.solution', {blue, total, value3: fraction(blue,total)}));
  }],
  decimalSum:['decimals', int => {
    const a = int(12, 58), b = int(11, 48), answer = (a+b)/10;
    return number(msg('exercise.decimalSum.title'), msg('exercise.decimalSum.prompt', {value1: format(a/10), value2: format(b/10)}), answer, msg('exercise.decimalSum.hint'),
      msg('exercise.decimalSum.method'), msg('exercise.decimalSum.solution', {value1: format(a/10), value2: format(b/10), value3: format(answer)}), {step:.1, unit:' m'});
  }],
  percentOf:['decimals', (int,pick) => {
    const p = pick([10,20,25,50,75]), total = 20*int(2, 20), answer = total*p/100;
    return number(msg('exercise.percentOf.title'), msg('exercise.percentOf.prompt', {p, total}), answer, msg('exercise.percentOf.hint'), msg('exercise.percentOf.method', {total, p}),
      msg('exercise.percentOf.solution', {p, total, answer}), {unit:' kr', wrong:[total-answer, total]});
  }],
  area:['geometry', int => {
    const a = int(3, 12), b = int(2, 9);
    return number(msg('exercise.area.title'), msg('exercise.area.prompt', {a, b}), a*b, msg('exercise.area.hint'), msg('exercise.area.method'),
      msg('exercise.area.solution', {a, b, value3: a*b}), {unit:' cm²', wrong:[2*(a+b), a+b]});
  }],
  perimeter:['geometry', int => {
    const a = int(3, 14), b = int(2, 9), answer = 2*(a+b);
    return number(msg('exercise.perimeter.title'), msg('exercise.perimeter.prompt', {a, b}), answer, msg('exercise.perimeter.hint'), msg('exercise.perimeter.method'),
      msg('exercise.perimeter.solution', {a, b, answer}), {unit:' cm', wrong:[a+b, a*b]});
  }],
  prism:['geometry', int => {
    const a = int(3, 11), b = int(2, 8), h = int(2, 7), volume = a*b*h;
    return number(msg('exercise.prism.title'), msg('exercise.prism.prompt', {a, b, h}), volume, msg('exercise.prism.hint'), msg('exercise.prism.method'),
      msg('exercise.prism.solution', {a, b, h, volume}), {unit:' cm³', wrong:[a*b, a+b+h]});
  }],
  diameter:['geometry', int => {
    const r = int(2, 15);
    return number(msg('exercise.diameter.title'), msg('exercise.diameter.prompt', {r}), 2*r, msg('exercise.diameter.hint'), msg('exercise.diameter.method'),
      msg('exercise.diameter.solution', {r, value3: 2*r}), {unit:' cm', wrong:[r, r*r]});
  }],
  integers:['signed', (int,pick) => {
    const a = int(-12, 6), b = int(2, 12), step = pick([-b,b]), answer = a+step;
    return number(msg('exercise.integers.title'), `${format(a)} ${step < 0 ? '−' : '+'} ${b} = ?`, answer, msg('exercise.integers.hint', {value1: format(a)}),
      msg('exercise.integers.method', {b, value2: step < 0 ? 'mot venstre' : 'mot høyre'}), msg('exercise.integers.solution', {value1: format(answer)}), {minimum:-30, wrong:[a-step, -answer]});
  }],
  order:['operations', int => {
    const a = int(2, 8), b = int(2, 9), c = int(2, 8), answer = a+b*c;
    return number(msg('exercise.order.title'), `${a} + ${b} × ${c}`, answer, msg('exercise.order.hint'), msg('exercise.order.method', {b, c}),
      `${a} + ${b*c} = ${answer}.`, {wrong:[(a+b)*c, a+b+c]});
  }],
  fractionSum:['fractions', int => {
    const d = int(3, 7), a = int(1, d-2), b = int(1, 3), denominator = 2*d;
    return exercise(msg('exercise.fractionSum.title'), `${fraction(a,d)} + ${fraction(b,denominator)}`, reduced(2*a+b,denominator),
      [reduced(a+b,denominator), reduced(a+b,d)], msg('exercise.fractionSum.hint'),
      msg('exercise.fractionSum.method', {value1: fraction(2*a,denominator)}), `${fraction(2*a,denominator)} + ${fraction(b,denominator)} = ${reduced(2*a+b,denominator)}.`);
  }],
  percentMatch:['decimals', (int,pick) => {
    const denominator = pick([4,5,10,20]), numerator = int(1, denominator-1), value = numerator*100/denominator;
    return number(msg('exercise.percentMatch.title'), fraction(numerator,denominator), value, msg('exercise.percentMatch.hint'), msg('exercise.percentMatch.method', {value1: 100/denominator}),
      msg('exercise.percentMatch.solution', {value1: fraction(numerator,denominator), value}), {unit:' %', step:5, wrong:[100-value]});
  }],
  linearEquation:['algebra', int => {
    const x = int(2, 12), a = int(2, 8), b = int(-9, 9), rhs = a*x+b;
    return number(msg('exercise.linearEquation.title'), `${equation(a,b)} = ${format(rhs)}`, x,
      msg('exercise.linearEquation.hint'), msg('exercise.linearEquation.method', {a, value2: a*x}),
      msg('exercise.linearEquation.solution', {x, value2: format(rhs)}));
  }],
  mean:['statistics', int => {
    const mid = int(6, 16), gap = int(2, 5), data = [mid+gap, mid-1, mid-gap, mid+1];
    return number(msg('exercise.mean.title'), data.join(' · '), mid, msg('exercise.mean.hint'), msg('exercise.mean.method', {value1: 4*mid}), `${4*mid} ÷ 4 = ${mid}.`);
  }],
  median:['statistics', int => {
    const mid = int(5, 15), low = mid-int(1,4), high = mid+int(1,4), data = shuffle([high, low, mid, low-1, high+1],int);
    return number(msg('exercise.median.title'), data.join(' · '), mid, msg('exercise.median.hint'), msg('exercise.median.method'),
      msg('exercise.median.solution', {value1: [...data].sort((a,b)=>a-b).join(', '), mid}), {wrong:[low,high]});
  }],
  range:['statistics', int => {
    const low = int(2, 12), gap = int(4, 16), high = low+gap, data = shuffle([high-1, high, low+2, low],int);
    return number(msg('exercise.range.title'), data.join(' · '), gap, msg('exercise.range.hint'), msg('exercise.range.method'),
      `${high} − ${low} = ${gap}.`, {wrong:[high, low+high]});
  }],
  primeFactors:['factors', (int,pick) => {
    const a = pick([2,3]), b = pick([5,7,11]), n = a*a*b;
    return exercise(msg('exercise.primeFactors.title'), String(n), `${a} × ${a} × ${b}`, [`${a*a} × ${b}`, `${a} × ${b}`],
      msg('exercise.primeFactors.hint'), msg('exercise.primeFactors.method', {a}), msg('exercise.primeFactors.solution', {n, a, b}));
  }],
  reduceFraction:['fractions', (int,pick) => {
    const [n,d] = pick([[1,2],[1,3],[2,3],[2,5],[3,4],[3,5],[4,7]]), f = int(2, 9);
    return exercise(msg('exercise.reduceFraction.title'), fraction(n*f,d*f), fraction(n,d), [fraction(n+1,d), fraction(n,d+1)],
      msg('exercise.reduceFraction.hint'), msg('exercise.reduceFraction.method', {f}), `${fraction(n*f,d*f)} = ${fraction(n,d)}.`);
  }],
  expression:['algebra', int => {
    const a = int(2, 7), b = int(-6, 8), x = int(2, 9), value = a*x+b;
    return number(msg('exercise.expression.title'), msg('exercise.expression.prompt', {value1: equation(a,b), x}), value, msg('exercise.expression.hint', {x}), msg('exercise.expression.method', {a, x}),
      `${equation(a,b).replace('x', ` × ${x}`)} = ${format(value)}.`, {minimum:-20});
  }],
  patternRule:['algebra', int => {
    const a = int(2, 8), b = int(1, 7);
    return exercise(msg('exercise.patternRule.title'), msg('exercise.patternRule.prompt'),
      `${a}n + ${b}`, [`${a}n − ${b}`, `${a+1}n + ${b}`], msg('exercise.patternRule.hint'), msg('exercise.patternRule.method', {a}),
      msg('exercise.patternRule.solution', {a, b, value3: a+b}), table(['n','Brikker'], [[1,a+b],[2,2*a+b],[3,3*a+b]]));
  }],
  functionTable:['functions', int => {
    const a = int(2, 8), b = int(1, 7), x = int(3, 6), value = a*x+b;
    return number(msg('exercise.functionTable.title'), msg('exercise.functionTable.prompt', {value1: equation(a,b), x}), value,
      msg('exercise.functionTable.hint', {x}), msg('exercise.functionTable.method', {x, a, b}), msg('exercise.functionTable.solution', {x, value}),
      {visual:table(['x','f(x)'], [[0,b],[1,a+b],[x,'?']])});
  }],
  speed:['rates', int => {
    const h = int(2, 5), speed = int(12, 75), distance = speed*h;
    return number(msg('exercise.speed.title'), msg('exercise.speed.prompt', {distance, h}), speed, msg('exercise.speed.hint'), msg('exercise.speed.method'),
      msg('exercise.speed.solution', {distance, h, speed}), {unit:' km/t', wrong:[distance, distance-h]});
  }],
  pythagoras:['geometry', (int,pick) => {
    const [a,b,c] = pick([[3,4,5],[5,12,13],[6,8,10],[8,15,17],[9,12,15],[12,16,20]]);
    return number(msg('exercise.pythagoras.title'), msg('exercise.pythagoras.prompt', {a, b}), c,
      msg('exercise.pythagoras.hint'), msg('exercise.pythagoras.method', {a, b}), msg('exercise.pythagoras.solution', {a, b, value3: c*c, c}),
      {unit:' cm', wrong:[a+b,b]});
  }],
  scale:['geometry', (int,pick) => {
    const k = pick([2,3,4,5]), a = int(2, 12);
    return number(msg('exercise.scale.title'), msg('exercise.scale.prompt', {k, a}), a*k, msg('exercise.scale.hint'),
      msg('exercise.scale.method', {a, k}), msg('exercise.scale.solution', {a, k, value3: a*k}), {unit:' cm', wrong:[a+k,a*k*k]});
  }],
  dice:['probability', int => {
    const threshold = int(2, 5), good = 6-threshold;
    return exercise(msg('exercise.dice.title'), msg('exercise.dice.prompt', {threshold}), reduced(good,6),
      [reduced(good+1,6), reduced(good-1,6)], msg('exercise.dice.hint'), msg('exercise.dice.method'),
      msg('exercise.dice.solution', {good, threshold, value3: reduced(good,6)}));
  }],
  slope:['functions', int => {
    const x = int(1, 5), delta = int(2, 5), y = int(4, 18), slope = int(-5, 6);
    const next = y + delta*slope;
    return number(msg('exercise.slope.title'), msg('exercise.slope.prompt'), slope, msg('exercise.slope.hint'),
      msg('exercise.slope.method', {value1: format(next-y), delta}), msg('exercise.slope.solution', {value1: format(next-y), delta, value3: format(slope)}),
      {minimum:-30, wrong:[next-y,-slope], visual:table(['x','y'], [[x,y],[x+delta,next]])});
  }],
  growthFactor:['functions', (int,pick) => {
    const p = int(2, 30), sign = pick([-1,1]), factor = 1+sign*p/100;
    return number(msg('exercise.growthFactor.title'), msg('exercise.growthFactor.prompt', {value1: sign<0 ? 'synker' : 'stiger', p}), factor, msg('exercise.growthFactor.hint'),
      msg('exercise.growthFactor.method', {value1: 100+sign*p}), msg('exercise.growthFactor.solution', {value1: 100+sign*p, value2: format(factor)}),
      {step:.01, wrong:[1-sign*p/100, p/100]});
  }],
  repeatedGrowth:['functions', (int,pick) => {
    const start = 100*int(1, 12), p = pick([5,10,20]), value = start*(1+p/100)**2;
    return number(msg('exercise.repeatedGrowth.title'), msg('exercise.repeatedGrowth.prompt', {start, p}), value, msg('exercise.repeatedGrowth.hint'),
      msg('exercise.repeatedGrowth.method', {value1: format(1+p/100)}), msg('exercise.repeatedGrowth.solution', {start, value2: format(1+p/100), value3: format(value)}),
      {unit:' kr', step:.5, wrong:[start*(1+2*p/100), start*(1+p/100)]});
  }],
  systemSum:['algebra', int => {
    const y = int(2, 10), x = y+int(2, 9), sum = x+y, diff = x-y;
    return number(msg('exercise.systemSum.title'), msg('exercise.systemSum.prompt', {sum, diff}), x, msg('exercise.systemSum.hint'), msg('exercise.systemSum.method'),
      msg('exercise.systemSum.solution', {sum, diff, value3: 2*x, x}), {wrong:[y,sum]});
  }],
  systemPrice:['algebra', int => {
    const pen = 5*int(2, 8), book = 5*int(9, 17);
    return number(msg('exercise.systemPrice.title'), msg('exercise.systemPrice.prompt', {value1: book+pen, value2: book+2*pen}), pen,
      msg('exercise.systemPrice.hint'), msg('exercise.systemPrice.method'),
      msg('exercise.systemPrice.solution', {value1: book+2*pen, value2: book+pen, pen}), {unit:' kr', wrong:[book,2*pen]});
  }],
  discount:['finance', (int,pick) => {
    const old = 20*int(15, 80), p = pick([10,20,25,30,50]), discount = old*p/100, answer = old-discount;
    return number(msg('exercise.discount.title'), msg('exercise.discount.prompt', {old, p}), answer, msg('exercise.discount.hint'),
      msg('exercise.discount.method', {discount}), msg('exercise.discount.solution', {old, discount, answer}), {unit:' kr', wrong:[discount,old+discount]});
  }],
  interest:['finance', int => {
    const money = 100*int(10, 60), rate = int(2, 8), extra = money*rate/100;
    return number(msg('exercise.interest.title'), msg('exercise.interest.prompt', {money, rate}), money+extra,
      msg('exercise.interest.hint'), msg('exercise.interest.method', {rate, money}), msg('exercise.interest.solution', {money, extra, value3: money+extra}),
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
    money:() => Array.isArray(visual.pieces) && visual.pieces.length>=1 && visual.pieces.length<=5
      && visual.pieces.every(piece=>[1,5,10,20,50,100,200,500].includes(piece))
      && (visual.exchange===undefined || [1,5,10,20].includes(visual.exchange)),
    numberLine:() => whole(visual.start,0,99) && whole(visual.middle,10,90) && whole(visual.end,0,99)
      && visual.middle%10===0 && (visual.middle-visual.start)*(visual.end-visual.middle)>0
      && whole(Math.abs(visual.middle-visual.start),2,7) && whole(Math.abs(visual.end-visual.middle),2,7)
      && typeof visual.missing==='boolean',
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
