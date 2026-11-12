import {text as msg} from './i18n.js';
import {countStep} from './core.js';
import {curriculumTopic} from './curriculum.js';
// Early hints suggest an action. Only the third step reveals the answer.
export function hintFor(t,stage=1){
  if(curriculumTopic(t.type))return t.hints[Math.min(3, Math.max(1, stage))-1];
  if(t.type==='missing'){
    if(stage>=3)return `${t.a} + ${t.answer} = ${t.n}.`;
    return stage===1?msg('help.missing.countUp', {a: t.a, n: t.n}):msg('help.missing.subtract', {n: t.n, a: t.a});
  }
  if(t.type==='multiply'){
    if(stage>=3)return `${t.a} × ${t.b} = ${t.answer}.`;
    return stage===1?msg('help.multiply.countGroups', {b: t.b}):msg('help.multiply.addGroups', {value1: Array(t.a).fill(t.b).join(' + ')});
  }
  if(t.type==='divide'){
    if(stage>=3)return msg('help.divide.solution', {n: t.n, b: t.b, answer: t.answer});
    return stage===1?msg('help.divide.share', {b: t.b}):msg('help.divide.checkMultiply', {b: t.b, n: t.n});
  }
  if (stage>=3) {
    const {a,b,n,answer}=t;
    if (t.type==='ten') return msg('help.ten.solution',{a,answer});
    if (t.type==='count') return msg(countStep(t)<0?'help.count.before':'help.count.after',{n,answer});
    if (t.type==='place') return msg('help.place.solution',{answer});
    const sign=t.type==='add'||t.type==='shift'&&b>0?'+':'−';
    return `${a??n} ${sign} ${Math.abs(b)} = ${answer}.`;
  }
  if(t.type==='ten')return stage===1?msg('help.ten.emptySpots'):msg('help.ten.countAdded');
  if(t.type==='remove')return stage===1?msg('help.remove.ones', {b: t.b}):msg('help.remove.keepGroups');
  if(t.type==='subtract'){
    const ones = t.n % 10;
    if(t.b>ones&&ones>0)return stage===1?msg('help.subtract.reachTen', {ones, value2: t.n-ones}):msg('help.subtract.fromTen', {value1: t.n-ones, value2: t.b-ones});
    return stage===1?msg('help.subtract.takeAway', {n: t.n, b: t.b}):msg('help.subtract.stepsBack', {b: t.b});
  }
  if(t.type==='count'){
    const {n}=t;
    if (countStep(t)<0) {
      if (stage===1) return msg('help.count.oneBack',{n});
      if (n%100===0) return msg('help.count.exchangeHundred');
      return msg(n%10===0?'help.count.exchangeTen':'help.count.oneLess');
    }
    if (stage===1) return msg('help.count.oneForward',{n});
    if (n%100===99) return msg('help.count.makeHundred');
    return msg(n%10===9?'help.count.makeTen':'help.count.oneMore');
  }
  if(t.type==='place')return stage===1?msg('help.place.groupTypes'):msg('help.place.groupValues');
  if (t.type==='shift') {
    if (stage!==1) return msg('help.shift.sameOnes');
    const unit=msg(Math.abs(t.b)===100?'help.shift.hundred':'help.shift.ten');
    return msg(t.b>0?'help.shift.add':'help.shift.remove',{unit});
  }
  const toTen = 10 - t.a % 10;
  if(t.b>toTen&&t.a>=10)return stage===1?msg('help.add.missingToTen', {a: t.a, value2: t.a+toTen}):msg('help.add.bridgeTen', {toTen, value2: t.a+toTen, value3: t.b-toTen});
  if(t.a+t.b>10&&t.a<10)return stage===1?msg('help.add.fillTen', {a: t.a}):msg('help.add.moveToTen', {value1: 10-t.a});
  return stage===1?msg('help.add.countOn', {a: t.a, b: t.b}):msg('help.add.countGroups');
}
