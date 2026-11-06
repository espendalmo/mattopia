// Early hints suggest an action. Only the third step reveals the answer.
export function hintFor(t,stage=1){
  if(stage>=3){if(t.type==='ten')return`${t.a} + ${t.answer} = 10. Du kan velge ${t.answer}.`;if(t.type==='count')return`Etter ${t.n} kommer ${t.answer}.`;if(t.type==='place')return`Det er ${t.answer} til sammen.`;return`${t.a??t.n} ${t.type==='add'||t.type==='shift'&&t.b>0?'+':'−'} ${Math.abs(t.b)} = ${t.answer}.`;}
  if(t.type==='ten')return stage===1?'Se på de tomme rutene. Legg en brikke i hver tom rute.':'Tell de nye, gule brikkene. Hvor mange la du til?';
  if(t.type==='remove')return stage===1?`Se på de ${t.b} løse enerne. Det er dem vi tar bort.`:'La tierne og hundrerne stå. Hvor mye er igjen når enerne er borte?';
  if(t.type==='subtract')return stage===1?`Start på ${t.n}. Ta bort ${t.b} løse brikker.`:`Tell ${t.b} steg bakover. Hvilket tall stopper du på?`;
  if(t.type==='count')return stage===1?`Start på ${t.n}. Vi skal ett steg videre.`:t.n%100===99?'Ni tiere og ni enere får én ener til. Bytt til en ny hundrer.':t.n%10===9?'Ni enere får én ener til. Bytt de ti enerne til én tier.':'Tenk på tallet som er én mer.';
  if(t.type==='place')return stage===1?'Se på hundrerne, tierne og enerne. Tell én type om gangen.':'En hundrer er 100. En tier er 10. Legg til enerne til slutt.';
  if(t.type==='shift')return stage===1?`Én ${Math.abs(t.b)===100?'hundrer er 100':'tier er 10'}. ${t.b>0?'Legg til':'Ta bort'} én slik gruppe.`:'Se hva som endrer seg. Enerne blir de samme.';
  if(t.a+t.b>10)return stage===1?`Start med ${t.a}. Hvor mange trenger du for å fylle tieren?`:`Flytt ${10-t.a} av de nye brikkene inn i tieren. Tell så dem som er igjen ved siden av.`;
  return stage===1?`Start på ${t.a}, og tell ${t.b} videre.`:'La den første gruppen ligge. Tell videre med brikkene i den andre gruppen.';
}
