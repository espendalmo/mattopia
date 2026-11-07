import {countStep} from './core.js';
// Early hints suggest an action. Only the third step reveals the answer.
export function hintFor(t,stage=1){
  if(t.type==='missing'){
    if(stage>=3)return `${t.a} + ${t.answer} = ${t.n}.`;
    return stage===1?`Start på ${t.a}. Tell videre til ${t.n}.`:`Du kan også regne ${t.n} − ${t.a}. Hvor stor er forskjellen?`;
  }
  if(t.type==='multiply'){
    if(stage>=3)return `${t.a} × ${t.b} = ${t.answer}.`;
    return stage===1?`Hver gruppe har ${t.b} brikker. Tell alle gruppene.`:`Legg sammen ${Array(t.a).fill(t.b).join(' + ')}.`;
  }
  if(t.type==='divide'){
    if(stage>=3)return `${t.n} ÷ ${t.b} = ${t.answer}. Hver gruppe får ${t.answer} brikker.`;
    return stage===1?`Se for deg at du legger én brikke i hver av de ${t.b} gruppene, om og om igjen.`:`Hvilket tall kan du gange med ${t.b} for å få ${t.n}?`;
  }
  if(stage>=3){if(t.type==='ten')return`${t.a} + ${t.answer} = 10. Du kan velge ${t.answer}.`;if(t.type==='count')return`${countStep(t)<0?'Før':'Etter'} ${t.n} kommer ${t.answer}.`;if(t.type==='place')return`Det er ${t.answer} til sammen.`;return`${t.a??t.n} ${t.type==='add'||t.type==='shift'&&t.b>0?'+':'−'} ${Math.abs(t.b)} = ${t.answer}.`;}
  if(t.type==='ten')return stage===1?'Se på de tomme rutene. Legg en brikke i hver tom rute.':'Tell de nye, gule brikkene. Hvor mange la du til?';
  if(t.type==='remove')return stage===1?`Se på de ${t.b} løse enerne. Det er dem vi tar bort.`:'La tierne og hundrerne stå. Hvor mye er igjen når enerne er borte?';
  if(t.type==='subtract'){
    const ones = t.n % 10;
    if(t.b>ones&&ones>0)return stage===1?`Ta først bort ${ones} for å komme til ${t.n-ones}.`:`Start på ${t.n-ones}. Ta bort de ${t.b-ones} som er igjen.`;
    return stage===1?`Start på ${t.n}. Ta bort ${t.b} løse brikker.`:`Tell ${t.b} steg bakover. Hvilket tall stopper du på?`;
  }
  if(t.type==='count'){
    if(countStep(t)<0)return stage===1?`Start på ${t.n}. Tell ett steg bakover.`:t.n%100===0?'Bytt én hundrer til ti tiere. Bytt så én tier til ti enere, og ta bort én ener.':t.n%10===0?'Bytt én tier til ti enere, og ta bort én ener.':'Tenk på tallet som er én mindre.';
    return stage===1?`Start på ${t.n}. Vi skal ett steg videre.`:t.n%100===99?'Ni tiere og ni enere får én ener til. Bytt til en ny hundrer.':t.n%10===9?'Ni enere får én ener til. Bytt de ti enerne til én tier.':'Tenk på tallet som er én mer.';
  }
  if(t.type==='place')return stage===1?'Se på hundrerne, tierne og enerne. Tell én type om gangen.':'En hundrer er 100. En tier er 10. Legg til enerne til slutt.';
  if(t.type==='shift')return stage===1?`Én ${Math.abs(t.b)===100?'hundrer er 100':'tier er 10'}. ${t.b>0?'Legg til':'Ta bort'} én slik gruppe.`:'Se hva som endrer seg. Enerne blir de samme.';
  const toTen = 10 - t.a % 10;
  if(t.b>toTen&&t.a>=10)return stage===1?`Start på ${t.a}. Hvor mye mangler til ${t.a+toTen}?`:`Legg til ${toTen} for å komme til ${t.a+toTen}. Legg så til de ${t.b-toTen} som er igjen.`;
  if(t.a+t.b>10&&t.a<10)return stage===1?`Start med ${t.a}. Hvor mange trenger du for å fylle tieren?`:`Flytt ${10-t.a} av de nye brikkene inn i tieren. Tell så dem som er igjen ved siden av.`;
  return stage===1?`Start på ${t.a}, og tell ${t.b} videre.`:'La den første gruppen ligge. Tell videre med brikkene i den andre gruppen.';
}
