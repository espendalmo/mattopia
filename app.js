import { VERSION, ROUND_LENGTH, STORAGE_KEY, LEVELS, createRound, answerRound, advanceRound, noteHelp, roundSummary, freshState, restoreState } from './core.js';

const root = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
let storageWorks = true;
let state;
try { state = restoreState(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { state = freshState(); }
let view = 'home';
let ui = makeUI();
let audioContext;
let lastFocus;

function makeUI() { return { hint: false, wrong: [], removed: new Set(), added: new Set() }; }
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageWorks = true; }
  catch { storageWorks = false; }
}
save();

function icon(name, css = '') {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--paper)"/><circle cx="15" cy="17" r="3" fill="var(--paper)"/>',
    sprout: '<path d="M12 20v-9M12 14C5 14 4 9 4 6c6 0 8 3 8 8ZM12 11c0-6 4-8 8-8 0 5-2 8-8 8Z"/>',
    star: '<path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.4l6.3-.9Z"/>',
  };
  return `<svg class="${css}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}
function buddy(happy = false) {
  return `<div class="buddy ${happy ? 'happy' : ''}" aria-hidden="true"><div class="buddy-shadow"></div><div class="buddy-leaf"></div><div class="buddy-body"><i class="buddy-eye left"></i><i class="buddy-eye right"></i><i class="buddy-smile"></i><i class="buddy-cheek left"></i><i class="buddy-cheek right"></i></div><span class="buddy-spark">✦</span><span class="buddy-spark right">✦</span></div>`;
}
function brand() { return `<div class="brand"><span class="brand-mark">${icon('sprout')}</span><span>tallvenn</span></div>`; }
function header() { return `<header class="site-header">${brand()}<button class="adult-link" data-action="adult">${icon('settings')}For voksne</button></header>`; }
function say(text) { announcer.textContent = ''; requestAnimationFrame(() => { announcer.textContent = text; }); }
function focusHeading() { root.querySelector('h1')?.focus({ preventScroll: true }); }
function goTop() { window.scrollTo({ top: 0, behavior: 'instant' }); }

function renderHome() {
  const total = state.roundsCompleted;
  const stars = Array.from({ length: 5 }, (_, i) => icon('star', i < Math.min(total, 5) ? '' : 'empty-star')).join('');
  root.innerHTML = `<div class="app-shell">${header()}<main class="home">
    ${buddy()}<p class="home-eyebrow">Ett lite steg om gangen</p>
    <h1 tabindex="-1">Klar for en<br>liten runde?</h1>
    <p class="home-description">8 oppgaver. I ditt tempo.</p>
    <button class="primary" data-action="start">${state.active ? 'Fortsett runden' : 'Start runden'}${icon('arrow')}</button>
    <p class="gentle-note">${state.active ? `Du har gjort ${state.active.index + (state.active.solved ? 1 : 0)} av 8 oppgaver.` : 'Vi ser, teller og finner ut sammen.'}</p>
    <div class="star-shelf"><p class="shelf-label">Dine små steg</p><div class="stars" aria-label="${total} stjerner">${stars}${total > 5 ? `<span>+${total - 5}</span>` : ''}</div><p class="shelf-note">${total === 0 ? 'En stjerne for hver runde du fullfører.' : `${total} ${total === 1 ? 'runde fullført' : 'runder fullført'}. Fint jobbet!`}</p></div>
  </main></div>`;
}

function startRound() {
  if (!state.active) {
    const seed = globalThis.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Date.now();
    state.active = createRound(state.level, seed, state.roundsCompleted === 0);
    save();
  }
  view = 'round'; ui = makeUI(); render(); goTop(); focusHeading();
}

function taskTitle(t) {
  if (t.type === 'remove' || t.type === 'subtract') return `Ta bort ${t.b}`;
  if (t.type === 'ten') return 'Hvor mange mangler?';
  if (t.type === 'count') return 'Hvilket tall kommer nå?';
  if (t.type === 'place') return 'Hvilket tall er dette?';
  if (t.type === 'shift') return t.b > 0 ? `Legg til ${t.b === 100 ? 'én hundrer' : 'én tier'}` : `Ta bort ${t.b === -100 ? 'én hundrer' : 'én tier'}`;
  return 'Hvor mye blir det?';
}
function equationText(t) {
  if (t.type === 'ten') return `${t.a} + ${t.answer} = 10`;
  if (t.type === 'add') return `${t.a} + ${t.b} = ${t.answer}`;
  if (t.type === 'count') return `Etter ${t.n} kommer ${t.answer}.`;
  if (t.type === 'place') return `${partsText(t.n)} er ${t.answer}.`;
  return `${t.n} ${t.type === 'shift' && t.b > 0 ? '+' : '−'} ${Math.abs(t.b)} = ${t.answer}`;
}
function equation(t, solved) {
  const blank = `<span class="blank ${solved ? 'answer-filled' : ''}">${solved ? t.answer : '?'}</span>`;
  if (t.type === 'place') return '<div class="place-equation"></div>';
  let content;
  if (t.type === 'count') content = `<span class="sequence-number">${t.n - 1}</span><span class="sequence-number">${t.n}</span>${blank}`;
  else if (t.type === 'ten') content = `<span>${t.a}</span><span>+</span>${blank}<span>=</span><span>10</span>`;
  else if (t.type === 'add') content = `<span>${t.a}</span><span>+</span><span>${t.b}</span><span>=</span>${blank}`;
  else content = `<span>${t.n}</span><span>${t.type === 'shift' && t.b > 0 ? '+' : '−'}</span><span>${Math.abs(t.b)}</span><span>=</span>${blank}`;
  const accessible = solved ? equationText(t) : t.type === 'count' ? `${t.n - 1}, ${t.n}, hvilket tall kommer nå?` : t.type === 'ten' ? `${t.a} pluss hvor mange er ti` : `${t.a ?? t.n} ${t.type === 'add' || t.type === 'shift' && t.b > 0 ? 'pluss' : 'minus'} ${Math.abs(t.b)} er hvor mye?`;
  return `<div class="equation ${t.type === 'count' ? 'sequence' : ''}" role="img" aria-label="${accessible}"><span class="sr-only"></span>${content.replaceAll('<span', '<span aria-hidden="true"')}</div>`;
}

function partsText(n) {
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
  const p = [];
  if (h) p.push(`${h} ${h === 1 ? 'hundrer' : 'hundrere'}`);
  if (t) p.push(`${t} ${t === 1 ? 'tier' : 'tiere'}`);
  if (o || (!h && !t)) p.push(`${o} ${o === 1 ? 'ener' : 'enere'}`);
  return p.join(' og ');
}

function dotGroup(count, start, interactive, singles = false) {
  return `<div class="unit-group ${singles ? 'singles' : ''} ${interactive ? 'interactive' : ''}">${Array.from({ length: count }, (_, i) => {
    const removed = ui.removed.has(start + i);
    return interactive ? `<button class="unit touch-unit ${removed ? 'removed' : ''}" data-unit="${start + i}" aria-label="${removed ? 'Legg tilbake' : 'Ta bort'} brikke ${start + i + 1}" aria-pressed="${removed}"></button>` : '<span class="unit" aria-hidden="true"></span>';
  }).join('')}</div>`;
}
function quantity(n, interactive = false) {
  if (n <= 20) {
    const groups = Math.floor(n / 10), ones = n % 10;
    return `<div class="quantity" ${interactive ? '' : `role="img" aria-label="${partsText(n)}"`}>${Array.from({ length: groups }, (_, i) => `<div role="img" aria-label="Én tier">${dotGroup(10, i * 10, false)}</div>`).join('')}${ones ? dotGroup(ones, groups * 10, interactive, true) : ''}</div>`;
  }
  const h = Math.floor(n / 100), tens = Math.floor(n / 10) % 10, ones = n % 10;
  return `<div class="quantity compact" role="img" aria-label="${partsText(n)}">${Array.from({ length: h }, () => '<span class="hundred-tile" aria-hidden="true">100</span>').join('')}${Array.from({ length: tens }, () => '<span class="ten-tile" aria-hidden="true">10</span>').join('')}${ones ? dotGroup(ones, h * 100 + tens * 10, false, true) : ''}</div>`;
}
function tenFrame(t, solved) {
  return `<div class="ten-frame" role="group" aria-label="Ti ruter. ${t.a} er fylt, ${10 - t.a} er tomme fra starten.">${Array.from({ length: 10 }, (_, i) => {
    if (i < t.a) return '<span class="frame-cell filled" aria-hidden="true"><span class="unit"></span></span>';
    const added = ui.added.has(i) || solved;
    return `<button class="frame-cell ${added ? 'added' : ''}" data-cell="${i}" aria-label="Rute ${i + 1}: ${added ? 'ta bort den nye brikken' : 'legg til en brikke'}" aria-pressed="${added}" ${solved ? 'disabled' : ''}>${added ? '<span class="unit"></span>' : ''}</button>`;
  }).join('')}</div>`;
}

function hintText(t) {
  if (t.type === 'ten') return `Det er ${t.answer} tomme ruter. ${t.a} og ${t.answer} blir ti til sammen.`;
  if (t.type === 'remove') return `${partsText(t.n)}. Tar vi bort de ${t.b} enerne, har vi ${t.answer} igjen.`;
  if (t.type === 'subtract') return `Start på ${t.n} og tell ${t.b} ${t.b === 1 ? 'steg' : 'steg'} bakover: ${Array.from({ length: t.b }, (_, i) => t.n - i - 1).join(', ')}.`;
  if (t.type === 'count') return `Tell én videre fra ${t.n}. Etter ${t.n} kommer ${t.answer}.`;
  if (t.type === 'place') return `${partsText(t.n)}. Det blir ${t.n} til sammen.`;
  if (t.type === 'shift') return `${Math.abs(t.b) === 100 ? 'Én hundrer er 100' : 'Én tier er 10'}. ${equationText(t)}.`;
  if (t.a + t.b > 10) return `Først til ti: ${t.a} + ${10 - t.a} = 10. Så ${t.answer - 10} til: 10 + ${t.answer - 10} = ${t.answer}.`;
  return `Start på ${t.a}, og tell ${t.b} videre: ${Array.from({ length: t.b }, (_, i) => t.a + i + 1).join(', ')}.`;
}

function renderVisual(t, solved) {
  let html = '', caption = '';
  if (t.type === 'ten') {
    html = tenFrame(t, solved);
    caption = solved ? `${t.a} og ${t.answer} blir ti.` : ui.added.size ? `Du har lagt til ${ui.added.size}.` : 'Du kan trykke i de tomme rutene.';
  } else if (t.type === 'count') {
    html = ui.hint || solved ? `<div class="number-line" role="img" aria-label="${t.n - 2}, ${t.n - 1}, ${t.n}, ${t.answer}, ${t.answer + 1}">${Array.from({ length: 5 }, (_, i) => `<span aria-hidden="true" class="${i === 3 ? 'line-target' : ''}">${t.n - 2 + i}</span>`).join('')}</div>` : '<p class="count-visual-note">Ett steg videre.<br>Hva kommer etterpå?</p>';
    caption = ui.hint || solved ? 'Én mer enn før.' : '';
  } else if (t.type === 'add') {
    html = ui.hint && t.answer > 10 ? quantity(t.answer) : `<div class="add-visual" role="img" aria-label="${t.a} brikker og ${t.b} brikker">${dotGroup(t.a, 0, false, true)}<span class="add-sign" aria-hidden="true">+</span>${dotGroup(t.b, 20, false, true)}</div>`;
    caption = ui.hint && t.answer > 10 ? `En hel tier og ${t.answer - 10} til.` : 'Se på brikkene.';
  } else {
    const interactive = ['remove', 'subtract'].includes(t.type) && t.n <= 20 && !solved;
    const shown = solved && ['remove', 'subtract', 'shift'].includes(t.type) ? t.answer : t.n;
    html = quantity(shown, interactive);
    if (interactive) caption = ui.removed.size ? `Du har tatt bort ${ui.removed.size}.` : 'Du kan trykke på de løse brikkene.';
    else if (t.type === 'place' || t.n > 20) caption = partsText(shown);
    else caption = solved ? `${shown} igjen.` : 'Se på tierne og enerne.';
  }
  return `<div class="visual-card">${html}<p class="visual-caption" id="visual-caption">${caption}</p></div>`;
}

function renderRound() {
  const r = state.active;
  if (!r || r.index >= ROUND_LENGTH) { view = 'home'; renderHome(); return; }
  const t = r.tasks[r.index];
  const done = r.index + (r.solved ? 1 : 0);
  if (r.helped[r.index]) ui.hint = true;
  const progress = Array.from({ length: 8 }, (_, i) => `<span class="step ${i < done ? 'done' : i === done ? 'current' : ''}"></span>`).join('');
  const labels = { remove: 'Se tallene', ten: 'Bygg ti', count: 'Ett steg videre', place: 'Se tallene', shift: 'Tiere og hundrere', add: 'Legg sammen', subtract: 'Ta bort' };
  let feedback;
  if (r.solved) {
    const messages = ['Der satt den!', 'Godt tenkt!', 'Du fant det!', 'Fint jobbet!'];
    feedback = `<div class="feedback-row">${icon('check', 'feedback-icon')}<div><p class="feedback-title">${messages[r.index % messages.length]}</p><p class="feedback-detail">${equationText(t)}</p></div></div><button class="primary" data-action="next">${r.index === 7 ? 'Fullfør runden' : 'Neste'}${icon('arrow')}</button>`;
  } else feedback = '<p class="idle-note">Ta den tiden du trenger.</p>';
  root.innerHTML = `<div class="round-shell"><header class="round-header"><button class="icon-button" data-action="pause" aria-label="Ta en pause">${icon('close')}</button><div class="progress-wrap"><div class="progress-text"><span>Din lille runde</span><strong>Oppgave ${r.index + 1} av 8</strong></div><div class="progress-track" role="progressbar" aria-label="Fullførte oppgaver" aria-valuemin="0" aria-valuemax="8" aria-valuenow="${done}">${progress}</div></div></header>
    <main class="task"><p class="task-label">${labels[t.type]}</p><h1 tabindex="-1">${taskTitle(t)}</h1>
    ${equation(t, r.solved)}${renderVisual(t, r.solved)}
    ${!r.solved ? `<button class="help-button" data-action="help" ${ui.hint ? 'disabled' : ''}>${icon('help')}${ui.hint ? 'Vi ser sammen' : 'Vis meg'}</button>` : ''}
    ${ui.hint && !r.solved ? `<div class="hint">${hintText(t)}</div>` : ''}
    ${ui.wrong.length && !r.solved ? '<p class="retry-feedback">Vi prøver sammen. Se på hjelpen over.</p>' : ''}
    <div class="answers" role="group" aria-label="Velg svar">${t.choices.map(c => `<button class="answer ${r.solved && c === t.answer ? 'correct' : ''} ${ui.wrong.includes(c) ? 'tried' : ''}" data-answer="${c}" ${r.solved || ui.wrong.includes(c) ? 'disabled' : ''} aria-label="Svar ${c}">${c}${r.solved && c === t.answer ? '<span class="sr-only">. Riktig.</span>' : ''}</button>`).join('')}</div>
    <div class="feedback-area">${feedback}</div></main><footer class="round-footer">Små steg teller.</footer></div>`;
}

function renderComplete() {
  root.innerHTML = `<div class="app-shell">${header()}<main class="complete"><div class="reward" aria-hidden="true">${icon('star')}</div><h1 tabindex="-1">Åtte små steg.<br>En ny stjerne!</h1><p>Du øvde og fant ut av ting.<br>Det er sånn vi lærer.</p><div class="completion-steps" aria-label="8 oppgaver fullført">${Array.from({ length: 8 }, () => `<span class="completion-dot">${icon('check')}</span>`).join('')}</div><p class="gentle-note">Stjerne nummer ${state.roundsCompleted} er din.</p><button class="primary" data-action="home">Ferdig for nå${icon('check')}</button><button class="text-button" data-action="again">En runde til</button></main></div>`;
}

function render() {
  if (view === 'round') renderRound();
  else if (view === 'complete') renderComplete();
  else renderHome();
}

function playSuccess(final = false) {
  if (!state.sound) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ||= new Audio();
    audioContext.resume();
    const now = audioContext.currentTime;
    const notes = final ? [523.25, 659.25, 783.99] : [523.25, 659.25];
    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator(); const gain = audioContext.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * .11); gain.gain.linearRampToValueAtTime(.045, now + i * .11 + .015); gain.gain.exponentialRampToValueAtTime(.001, now + i * .11 + .22);
      osc.connect(gain); gain.connect(audioContext.destination); osc.start(now + i * .11); osc.stop(now + i * .11 + .24);
    });
  } catch { /* Sound is optional. */ }
}

function showDialog(content, css = '', afterOpen) {
  document.querySelector('dialog')?.close(); document.querySelector('dialog')?.remove();
  lastFocus = document.activeElement;
  const d = document.createElement('dialog');
  d.className = css;
  d.setAttribute('aria-labelledby', 'dialog-title');
  d.innerHTML = content;
  document.body.append(d);
  d.addEventListener('close', () => { d.remove(); lastFocus?.focus({ preventScroll: true }); });
  d.showModal();
  afterOpen?.(d);
}
function closeDialog() { document.querySelector('dialog')?.close(); }
function showPause() {
  showDialog(`<h2 id="dialog-title">En liten pause?</h2><p>Oppgavene venter på deg.<br>Du kan fortsette senere.</p><button class="primary" data-action="close-dialog" autofocus>Fortsett runden</button><button class="text-button" data-action="pause-home">Ta en pause</button>`, 'pause-dialog');
}
function adultView() {
  const recent = state.history.slice(-5).reverse();
  const days = new Set(state.history.map(r => new Date(r.date).toLocaleDateString('nb-NO'))).size;
  const history = recent.length ? recent.map(r => `<div class="history-item"><div>${new Date(r.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}<small>${LEVELS[r.level].label}</small></div><div class="history-numbers">${r.firstTry}/8 på første forsøk<small>Hjelp åpnet i ${r.helped} ${r.helped === 1 ? 'oppgave' : 'oppgaver'}</small></div></div>`).join('') : '<p class="history-empty">Her vises de siste rundene når barnet har øvd.</p>';
  showDialog(`<div class="dialog-header"><h2 id="dialog-title">For voksne</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk voksenvisningen">${icon('close')}</button></div><p class="adult-intro">Én runde har åtte oppgaver. Ingen tidsfrist, liv eller poengtrekk. En stjerne betyr at barnet har øvd.</p>
    ${!storageWorks ? '<p class="storage-warning">Nettleseren tillater ikke lagring akkurat nå. Appen virker, men framgangen kan forsvinne når siden lukkes.</p>' : ''}
    <fieldset class="adult-group"><legend>Hva skal dere øve på?</legend>${Object.entries(LEVELS).map(([n, l]) => `<label class="level-option"><input type="radio" name="level" value="${n}" ${state.level === Number(n) ? 'checked' : ''}><span><strong>${l.label}</strong><small>${l.description}</small></span></label>`).join('')}<p class="adult-note">Gjelder fra neste nye runde. Begynn gjerne med tall til 20. Nivået økes når dere velger det sammen.</p></fieldset>
    <label class="sound-setting"><input type="checkbox" id="sound-setting" ${state.sound ? 'checked' : ''}>En liten lyd ved riktig svar</label>
    <div class="adult-stats"><div class="stat"><strong>${state.roundsCompleted}</strong><span>fullførte runder</span></div><div class="stat"><strong>${days}</strong><span>${days === 1 ? 'øvingsdag' : 'øvingsdager'} i siste historikk</span></div></div>
    <p class="adult-section-title">Siste runder</p>${history}<p class="adult-note">Tallene beskriver øvingen, ikke barnets samlede forståelse. Hjelp kan også åpnes automatisk etter et feil svar. Snakk gjerne om hvordan barnet tenkte.</p>
    <details class="adult-details"><summary>Tips til en god økt</summary><p>La barnet tenke ferdig. Spør av og til «Hvordan fant du det ut?». Bruk gjerne klosser ved siden av. Avslutt når overskuddet er brukt opp; en halv runde kan fortsettes senere.</p><p>Appen gir øving og erstatter ikke lærerens kartlegging eller oppfølging.</p></details>
    <details class="adult-details"><summary>Legg appen på hjemskjermen</summary><p>På iPad og iPhone: åpne adressen i Safari, velg Del og «Legg til på Hjem-skjerm». Åpne appen på nett én gang før dere bruker den uten nett.</p><p>Alt lagres bare i denne nettleseren eller den installerte appen på denne enheten. Framgang synkroniseres ikke mellom enheter. Det er ingen konto, sporing eller eksterne ressurser. Safari og en installert app kan ha hver sin framgang.</p></details>
    <button class="delete-button" data-action="reset">Slett øvingshistorikken</button><button class="primary" data-action="close-dialog">Ferdig</button><p class="version">Tallvenn ${VERSION}</p>`, '', d => {
      d.addEventListener('change', e => {
        if (e.target.name === 'level') { state.level = Number(e.target.value); save(); }
        if (e.target.id === 'sound-setting') { state.sound = e.target.checked; save(); if (state.sound) playSuccess(); }
      });
    });
}

document.addEventListener('click', e => {
  const answer = e.target.closest('[data-answer]');
  if (answer && view === 'round' && !answer.disabled) {
    const value = Number(answer.dataset.answer);
    state.active = answerRound(state.active, value);
    const r = state.active, t = r.tasks[r.index];
    if (r.solved) {
      save(); render(); playSuccess(); say(`Riktig. ${equationText(t)} Neste oppgave er klar.`);
      root.querySelector('[data-action="next"]')?.focus({ preventScroll: true });
      root.querySelector('.feedback-area')?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    } else {
      ui.wrong.push(value); ui.hint = true; state.active = noteHelp(r); save(); render();
      say(`Vi prøver sammen. ${hintText(t)}`);
      root.querySelector('.answer:not(:disabled)')?.focus({ preventScroll: true });
    }
    return;
  }
  const unit = e.target.closest('[data-unit]');
  if (unit && view === 'round' && !state.active.solved) {
    const n = Number(unit.dataset.unit);
    ui.removed.has(n) ? ui.removed.delete(n) : ui.removed.add(n);
    unit.classList.toggle('removed', ui.removed.has(n)); unit.setAttribute('aria-pressed', String(ui.removed.has(n))); unit.setAttribute('aria-label', `${ui.removed.has(n) ? 'Legg tilbake' : 'Ta bort'} brikke ${n + 1}`);
    const text = `Du har tatt bort ${ui.removed.size}.`;
    document.querySelector('#visual-caption').textContent = text; say(text); return;
  }
  const cell = e.target.closest('[data-cell]');
  if (cell && view === 'round' && !state.active.solved) {
    const n = Number(cell.dataset.cell);
    ui.added.has(n) ? ui.added.delete(n) : ui.added.add(n);
    cell.classList.toggle('added', ui.added.has(n)); cell.setAttribute('aria-pressed', String(ui.added.has(n))); cell.setAttribute('aria-label', `Rute ${n + 1}: ${ui.added.has(n) ? 'ta bort den nye brikken' : 'legg til en brikke'}`); cell.innerHTML = ui.added.has(n) ? '<span class="unit"></span>' : '';
    const text = `Du har lagt til ${ui.added.size}.`;
    document.querySelector('#visual-caption').textContent = text; say(text); return;
  }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'start' || action === 'again') startRound();
  if (action === 'help' && state.active) { ui.hint = true; state.active = noteHelp(state.active); save(); render(); say(hintText(state.active.tasks[state.active.index])); }
  if (action === 'next' && state.active?.solved) {
    state.active = advanceRound(state.active);
    if (state.active.index === 8) {
      const summary = roundSummary(state.active);
      if (summary && !state.history.some(r => r.id === summary.id)) { state.history.push(summary); state.history = state.history.slice(-40); state.roundsCompleted++; }
      state.active = null; view = 'complete'; playSuccess(true);
    }
    ui = makeUI(); save(); render(); goTop(); focusHeading();
  }
  if (action === 'home') { view = 'home'; render(); goTop(); focusHeading(); }
  if (action === 'adult') adultView();
  if (action === 'close-dialog') closeDialog();
  if (action === 'pause') showPause();
  if (action === 'pause-home') { closeDialog(); view = 'home'; save(); render(); goTop(); focusHeading(); }
  if (action === 'reset') showDialog('<h2 id="dialog-title">Slette historikken?</h2><p>Stjerner, historikk og en påbegynt runde blir slettet på denne enheten.</p><button class="primary" data-action="close-dialog" autofocus>Behold historikken</button><button class="text-button" data-action="confirm-reset">Ja, slett historikken</button>', 'pause-dialog');
  if (action === 'confirm-reset') { closeDialog(); const { level, sound } = state; state = { ...freshState(), level, sound }; save(); view = 'home'; render(); focusHeading(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && view === 'round' && !document.querySelector('dialog')) { e.preventDefault(); showPause(); }
});
window.addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {}));
}
