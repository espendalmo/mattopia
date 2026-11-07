import { VERSION, CHANNEL, ROUND_LENGTH, STORAGE_KEY, LEVELS, TOPICS, topicOf, topicStats, growthState, countStep, createRound, answerRound, advanceRound, noteHelp, roundSummary, freshState, restoreState } from './core.js';
import { hintFor } from './learning.js';
import { createSoundPlayer } from './sound.js';
import { createUpdater } from './update.js';
import { modelById, selectRewardMode, prepareReward, awardPractice, renderBuildSvg } from './rewards.js';
import { plantById, renderPlant } from './plants.js';
import { BREAK_ATTEMPTS, createFocusBreak } from './breaks.js';

const root = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
let storageWorks = true;
let state;
try { state = restoreState(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { state = freshState(); }
if (state.rewardMode === 'bricks') state = selectRewardMode(state, 'bricks');
let view = 'home';
let completedReward = null;
let focusGame = null;
let ui = makeUI();
const sounds = createSoundPlayer();
const AWAY_KEY = `${STORAGE_KEY}-away`;
const WELCOME_AFTER = 15 * 60 * 1000;
let celebrateOnRender = false;
let updateStatus = { ready: false, checking: false, applying: false, message: 'Se etter en nyere versjon når du er på nett.' };
const updates = createUpdater({ currentVersion: VERSION, beforeReload: () => { const saved = save(); if (saved) sounds.stop(); return saved; }, onStatus: next => {
  const changed = next.ready !== updateStatus.ready;
  updateStatus = next;
  document.querySelectorAll('[data-update-status]').forEach(el => { el.textContent = next.message; });
  document.querySelectorAll('[data-action="check-update"]').forEach(el => { el.disabled = next.checking || next.applying; });
  document.querySelectorAll('[data-action="apply-update"]').forEach(el => { el.hidden = !next.ready; el.disabled = next.applying; el.textContent = next.applying ? 'Oppdaterer …' : el.closest('.update-banner') ? 'Oppdater' : 'Oppdater nå'; });
  if (changed && view !== 'round' && !document.querySelector('dialog')) render();
} });

function makeUI() { return { wrong: [], removed: new Set(), added: new Set(), entry: '', retry: false, retryUntil: 0, retryStage: 0 }; }
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageWorks = true; }
  catch { storageWorks = false; }
  return storageWorks;
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
    sound: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/>',
    backspace: '<path d="M10 5h10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H10a2 2 0 0 1-1.5-.7L3 12l5.5-6.3A2 2 0 0 1 10 5Z"/><path d="m11.5 9.5 5 5m0-5-5 5"/>',
    brick: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M6 8V4h4v4m4 0V4h4v4M3 12h18"/>',
    flask: '<path d="M9 3h6m-5 0v7l-5 8a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-8V3M8 15h8"/>',
  };
  return `<svg class="${css}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}
function buddy(happy = false, surprised = false) {
  return `<div class="buddy ${happy ? 'happy' : surprised ? 'surprised' : ''}" aria-hidden="true"><div class="buddy-shadow"></div><div class="buddy-leaf"></div><div class="buddy-body"><i class="buddy-eye left"></i><i class="buddy-eye right"></i><i class="buddy-smile"></i><i class="buddy-cheek left"></i><i class="buddy-cheek right"></i></div><span class="buddy-spark">✦</span><span class="buddy-spark right">✦</span></div>`;
}
function brand() { return `<div class="brand"><span class="brand-mark">${icon('sprout')}</span><span>tallvenn</span></div>`; }
function betaMark() { return CHANNEL === 'preview' ? `<p class="beta-mark">${icon('flask')}<strong>BETA</strong><span>Testversjon</span></p>` : ''; }
function soundButton() { return `<button class="icon-button sound-toggle" data-action="sound" aria-label="${state.sound ? 'Lyd på. Slå av lyd' : 'Lyd av. Slå på lyd'}" aria-pressed="${state.sound}">${icon(state.sound ? 'sound' : 'muted')}</button>`; }
function header() { return `${betaMark()}<header class="site-header">${brand()}<div class="header-controls">${soundButton()}<button class="adult-link" data-action="adult">${icon('settings')}For voksne</button></div></header>`; }
function updateBanner() { return updateStatus.ready ? `<aside class="update-banner"><span>${updateStatus.applying ? 'Oppdaterer appen …' : 'Ny versjon klar.'}</span><button data-action="apply-update" ${updateStatus.applying ? 'disabled' : ''}>${updateStatus.applying ? 'Oppdaterer …' : 'Oppdater'}</button></aside>` : ''; }
function say(text) { announcer.textContent = ''; requestAnimationFrame(() => { announcer.textContent = text; }); }
function focusHeading() { root.querySelector('h1')?.focus({ preventScroll: true }); }
function goTop() { window.scrollTo({ top: 0, behavior: 'instant' }); }

function rewardDetails(reward = null) {
  const mode = reward?.mode || state.rewardMode;
  if (mode !== 'bricks') {
    const garden = reward?.garden || state.garden;
    const plant = plantById(garden.plant);
    const full = garden.stage === 5;
    const label = full ? `${plant.name} er ferdig!` : `Vi dyrker ${plant.name.toLowerCase()}`;
    return { mode:'plant', garden, plant, full, label };
  }
  const build = reward?.build || state.brickBuild;
  const model = modelById(build.model), full = build.pieces === model.pieces.length;
  return {mode,build,model,full,label:full ? model.done : `Vi bygger ${model.name}!`};
}
function rewardArt(happy = false, reward = null) {
  const info = rewardDetails(reward);
  const art = info.mode === 'bricks'
    ? renderBuildSvg(info.build, {animate:happy})
    : renderPlant(info.garden.plant, info.garden.stage);
  return `<div class="garden-art ${info.mode === 'bricks' ? 'brick-art' : ''} ${happy ? 'garden-grown' : ''}"><div class="garden-friend">${buddy(happy)}</div>${art}</div>`;
}

const BADGES = [
  { stars:3, name:'God start', symbol:'✦', tone:'leaf' },
  { stars:10, name:'Tallvenn', symbol:'★', tone:'sun' },
  { stars:25, name:'Talloppdager', symbol:'◆', tone:'sky' },
  { stars:50, name:'Stjernesamler', symbol:'✶', tone:'rose' },
  { stars:100, name:'Tallmester', symbol:'✺', tone:'violet' },
];

function badgeArt(badge) {
  return `<span class="badge-medal ${badge.tone}" aria-hidden="true">${badge.symbol}</span>`;
}

function badgeShelf(stars) {
  const earned = BADGES.filter(badge => stars >= badge.stars);
  const next = BADGES.find(badge => stars < badge.stars);
  if (!stars) return '';
  return `<section class="badge-shelf" aria-label="Merker">
    ${earned.length ? `<ul class="badge-list">${earned.map(badge =>
      `<li>${badgeArt(badge)}<strong>${badge.name}</strong><small>${badge.stars} stjerner</small></li>`).join('')}</ul>` : ''}
    ${next ? `<p class="shelf-note">Neste merke ved ${next.stars} stjerner</p>` : ''}
  </section>`;
}

function collectible(kind, id) {
  if (kind === 'plant') {
    const plant = plantById(id);
    return plant && { name:plant.name, art:mini => renderPlant(id, 5, {mini}) };
  }
  if (kind === 'brick') {
    const model = modelById(id);
    return model && {
      name:model.name.replace(/^(en|et) /, '').replace(/^./, letter => letter.toUpperCase()),
      art:mini => renderBuildSvg({model:id,pieces:model.pieces.length},{mini}),
    };
  }
  return null;
}

function collectionTile(kind, id) {
  const item = collectible(kind, id);
  return `<button class="collection-tile" data-action="collectible" data-kind="${kind}" data-id="${id}" aria-label="Se ${item.name} stort">${item.art(true)}<span>${item.name}</span></button>`;
}

function collectionShelf() {
  const bricks = state.brickBuild?.unlocked || [];
  const plants = state.garden.collection;
  if (!bricks.length && !plants.length) return '';
  const kind = state.rewardMode === 'bricks' ? 'brick' : 'plant';
  const recent = kind === 'brick'
    ? [...new Set(state.brickBuild.collection.slice().reverse())].slice(0, 3)
    : plants.slice(-3).reverse();
  return `<section class="collection-shelf" aria-label="Samlingen din">
    ${recent.length ? `<div class="collection-grid">${recent.map(id => collectionTile(kind, id)).join('')}</div>` : ''}
    <button class="secondary" data-action="collection">Se samlingen</button>
  </section>`;
}

function showCollection() {
  const bricks = state.brickBuild?.unlocked || [];
  const plants = state.garden.collection;
  const dialog = document.querySelector('.collection-dialog');
  const content = `<div class="dialog-header"><h2 id="dialog-title" tabindex="-1">Samlingen din</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk samlingen">${icon('close')}</button></div>
    ${bricks.length ? `<h3>Byggefigurer</h3><div class="collection-grid">${bricks.map(id => collectionTile('brick', id)).join('')}</div>` : ''}
    ${plants.length ? `<h3>Planter</h3><div class="collection-grid">${plants.map(id => collectionTile('plant', id)).join('')}</div>` : ''}`;
  if (dialog) {
    dialog.innerHTML = content;
    dialog.querySelector(`[data-kind="${dialog.dataset.kind}"][data-id="${dialog.dataset.id}"]`)?.focus();
  } else showDialog(content, 'collection-dialog');
}

function showCollectible(kind, id) {
  const item = collectible(kind, id);
  if (!item) return;
  const dialog = document.querySelector('.collection-dialog');
  const content = `<div class="dialog-header"><h2 id="dialog-title" tabindex="-1">${item.name}</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk stort bilde">${icon('close')}</button></div>
    <div class="collectible-large">${item.art(false)}</div>
    ${dialog ? '<button class="secondary" data-action="collection">Tilbake til samlingen</button>' : ''}`;
  if (dialog) {
    dialog.dataset.kind = kind;
    dialog.dataset.id = id;
    dialog.innerHTML = content;
    dialog.querySelector('h2').focus();
  } else showDialog(content, 'collection-dialog');
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return '';
  const colors = ['#79a85d','#efbd57','#8bb6d5','#d99da5','#b5ce8b'];
  return `<div class="confetti" aria-hidden="true">${Array.from({ length: 38 }, (_, i) => `<i style="--x:${(i*37)%100}%;--drift:${(i%2?1:-1)*(25+i%7*15)}px;--delay:${(i%9)*.055}s;--duration:${2.3+i%5*.2}s;--turn:${220+i*29}deg;background:${colors[i%colors.length]}"></i>`).join('')}</div>`;
}

function renderHome() {
  const total = state.roundsCompleted;
  const stars = Array.from({ length: 5 }, (_, i) => icon('star', i < Math.min(total, 5) ? '' : 'empty-star')).join('');
  const g = rewardDetails();
  const shelf = g.mode === 'bricks'
    ? `${g.build.pieces} av ${g.model.pieces.length} klosser på plass.`
    : `${g.garden.stage} av 5 vekststeg.`;
  root.innerHTML = `<div class="app-shell">${header()}${updateBanner()}<main class="home">
    ${rewardArt()}<p class="home-eyebrow">${g.label}</p>
    <h1 tabindex="-1">Klar for en<br>liten runde?</h1>
    <p class="home-description">8 oppgaver. I ditt tempo.</p>
    <button class="primary" data-action="start">${state.active ? 'Fortsett runden' : state.focusBreakPending ? 'Spill Kims lek' : 'Start runden'}${icon('arrow')}</button>
    <p class="gentle-note">${state.active ? `Du har gjort ${state.active.index + (state.active.solved ? 1 : 0)} av 8 oppgaver.` : 'Vi ser, teller og finner ut sammen.'}</p>
    <div class="star-shelf"><p class="shelf-label">Dine små steg</p><div class="stars" aria-label="${total} ${total === 1 ? 'stjerne' : 'stjerner'}">${stars}${total > 5 ? `<span>+${total - 5}</span>` : ''}</div><p class="shelf-note">${shelf}</p>${badgeShelf(total)}${collectionShelf()}</div>
  </main></div>`;
}

function startRound() {
  if (!state.active && state.focusBreakPending) {
    openFocusBreak();
    return;
  }
  if (!state.active) {
    focusGame = null;
    state = prepareReward(state);
    const seed = globalThis.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Date.now();
    state.active = createRound(state.level, seed, state.roundsCompleted === 0, { history: state.history, alwaysShowVisuals: state.alwaysShowVisuals });
    save();
  }
  if (state.sound) sounds.unlock();
  view = 'round'; ui = makeUI(); announcer.textContent = ''; render(); goTop(); focusHeading();
}

function openFocusBreak() {
  focusGame ||= { ...createFocusBreak(), phase:'study', selected:new Set(), checks:0, score:0 };
  view = 'focus-break';
  render(); goTop(); focusHeading();
}

function renderFocusBreak() {
  const { phase, study, choices, selected, score, checks } = focusGame;
  const count = study.length;
  const matched = score === count;
  const item = ({ icon, label }) => `<span class="focus-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
  let title, description, content;
  if (phase === 'study') {
    title = 'Husk de fire bildene';
    description = checks ? 'Se godt på bildene en gang til. Ta den tiden du trenger.' : 'Se på bildene så lenge du vil. Gå videre når du er klar.';
    content = `<ul class="focus-cards" aria-label="Bilder å huske">${study.map(image => `<li>${item(image)}</li>`).join('')}</ul><button class="primary" data-action="focus-hide">Jeg er klar ${icon('arrow')}</button>`;
  } else if (phase === 'guess') {
    title = 'Hvilke bilder så du?';
    description = 'Velg de fire bildene du husker.';
    content = `<div class="focus-options" role="group" aria-label="Velg fire bilder">${choices.map((image, i) => `<button data-action="focus-answer" data-choice="${i}" aria-pressed="${selected.has(i)}">${item(image)}<span class="focus-check">${icon('check')}</span></button>`).join('')}</div>
      <p class="focus-count" aria-live="polite">${selected.size} av ${count} valgt</p><button class="primary" data-action="focus-check" ${selected.size !== count ? 'disabled' : ''}>Sjekk svarene</button>`;
  } else {
    title = matched ? 'Du husket alle fire!' : phase === 'retry' ? 'Godt forsøk!' : 'Bra at du prøvde!';
    description = matched ? 'Klar for en runde med tall?' : phase === 'retry' ? 'Vil du se på bildene igjen?' : 'Neste gang får du nye bilder å øve på.';
    content = `<div class="focus-result">${buddy(matched)}<strong>${score} av ${count} riktig</strong></div>
      ${phase === 'retry' ? '<button class="primary" data-action="focus-retry">Se bildene igjen</button>' : `<button class="primary" data-action="focus-continue">Til oppgavene ${icon('arrow')}</button>`}`;
  }
  root.innerHTML = `<div class="app-shell">${header()}<main class="focus-game">
    <p class="home-eyebrow">Mellomspill · Kims lek</p>
    <h1 tabindex="-1">${title}</h1><p>${description}</p>${content}
    <button class="text-button" data-action="home">Ferdig for nå</button>
  </main></div>`;
}

function selectFocusImage(button) {
  const index = Number(button.dataset.choice);
  const { selected, study, choices } = focusGame;
  if (!choices[index]) return;
  if (selected.has(index)) selected.delete(index);
  else if (selected.size < study.length) selected.add(index);
  else return;
  button.setAttribute('aria-pressed', String(selected.has(index)));
  root.querySelector('.focus-count').textContent = `${selected.size} av ${study.length} valgt`;
  root.querySelector('[data-action="focus-check"]').disabled = selected.size !== study.length;
}

function checkFocusBreak() {
  const { study, selected, choices } = focusGame;
  if (selected.size !== study.length) return;
  focusGame.checks++;
  focusGame.score = [...selected].filter(i => study.includes(choices[i])).length;
  const matched = focusGame.score === study.length;
  const done = matched || focusGame.checks >= BREAK_ATTEMPTS;
  focusGame.phase = done ? 'done' : 'retry';
  if (done) {
    state.focusBreakPending = false;
    save();
  }
  if (matched) sounds.play('memory', state.sound);
  render(); focusHeading();
}

function taskTitle(t) {
  if (t.type === 'remove' || t.type === 'subtract') return `Ta bort ${t.b}`;
  if (t.type === 'ten') return 'Hvor mange mangler?';
  if (t.type === 'missing') return 'Hvilket tall mangler?';
  if (t.type === 'multiply') return 'Hvor mange til sammen?';
  if (t.type === 'divide') return 'Hvor mange i hver gruppe?';
  if (t.type === 'count') return countStep(t) < 0 ? 'Hvilket tall mangler?' : 'Hvilket tall kommer nå?';
  if (t.type === 'place') return 'Hvilket tall er dette?';
  if (t.type === 'shift') return t.b > 0 ? `Legg til ${t.b === 100 ? 'én hundrer' : 'én tier'}` : `Ta bort ${t.b === -100 ? 'én hundrer' : 'én tier'}`;
  return 'Hvor mye blir det?';
}
function equationText(t) {
  if (t.type === 'ten') return `${t.a} + ${t.answer} = 10`;
  if (t.type === 'missing') return `${t.a} + ${t.answer} = ${t.n}`;
  if (t.type === 'multiply') return `${t.a} × ${t.b} = ${t.answer}`;
  if (t.type === 'divide') return `${t.n} ÷ ${t.b} = ${t.answer}`;
  if (t.type === 'add') return `${t.a} + ${t.b} = ${t.answer}`;
  if (t.type === 'count') return `${countStep(t) < 0 ? 'Før' : 'Etter'} ${t.n} kommer ${t.answer}.`;
  if (t.type === 'place') return `${partsText(t.n)} er ${t.answer}.`;
  return `${t.n} ${t.type === 'shift' && t.b > 0 ? '+' : '−'} ${Math.abs(t.b)} = ${t.answer}`;
}
function equation(t, solved) {
  const blank = `<span class="blank ${solved ? 'answer-filled' : ''}">${solved ? t.answer : '?'}</span>`;
  if (t.type === 'place') return '<div class="place-equation"></div>';
  let content;
  if (t.type === 'count') content = countStep(t) < 0 ? `${blank}<span class="sequence-number">${t.n}</span><span class="sequence-number">${t.n + 1}</span>` : `<span class="sequence-number">${t.n - 1}</span><span class="sequence-number">${t.n}</span>${blank}`;
  else if (t.type === 'ten' || t.type === 'missing') content = `<span>${t.a}</span><span>+</span>${blank}<span>=</span><span>${t.n ?? 10}</span>`;
  else {
    const operator = { add:'+', multiply:'×', divide:'÷', shift:t.b > 0 ? '+' : '−' }[t.type] || '−';
    content = `<span>${t.a ?? t.n}</span><span>${operator}</span><span>${Math.abs(t.b)}</span><span>=</span>${blank}`;
  }
  let accessible = equationText(t);
  if (!solved) {
    if (t.type === 'count') accessible = countStep(t) < 0 ? `Hvilket tall mangler? Ukjent tall, ${t.n}, ${t.n + 1}.` : `${t.n - 1}, ${t.n}, hvilket tall kommer nå?`;
    else if (t.type === 'ten' || t.type === 'missing') accessible = `${t.a} pluss hvor mange er ${t.n ?? 'ti'}?`;
    else {
      const operator = { add:'pluss', multiply:'ganger', divide:'delt på', shift:t.b > 0 ? 'pluss' : 'minus' }[t.type] || 'minus';
      accessible = `${t.a ?? t.n} ${operator} ${Math.abs(t.b)} er hvor mye?`;
    }
  }
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
  return `<div class="quantity compact" role="${interactive ? 'group' : 'img'}" aria-label="${partsText(n)}">${Array.from({ length: h }, () => '<span class="hundred-tile" aria-hidden="true">100</span>').join('')}${Array.from({ length: tens }, () => '<span class="ten-tile" aria-hidden="true">10</span>').join('')}${ones ? dotGroup(ones, h * 100 + tens * 10, interactive, true) : ''}</div>`;
}
function tenFrame(t, solved) {
  return `<div class="ten-frame" role="group" aria-label="Ti ruter. ${t.a} er fylt, ${10 - t.a} er tomme fra starten.">${Array.from({ length: 10 }, (_, i) => {
    if (i < t.a) return '<span class="frame-cell filled" aria-hidden="true"><span class="unit"></span></span>';
    const added = ui.added.has(i) || solved;
    return `<button class="frame-cell ${added ? 'added' : ''}" data-cell="${i}" aria-label="Rute ${i + 1}: ${added ? 'ta bort den nye brikken' : 'legg til en brikke'}" aria-pressed="${added}" ${solved ? 'disabled' : ''}>${added ? '<span class="unit"></span>' : ''}</button>`;
  }).join('')}</div>`;
}

function equalGroups(t, solved) {
  const dividing = t.type === 'divide';
  const groups = dividing ? t.b : t.a;
  const size = dividing ? (solved ? t.answer : 0) : t.b;
  const loose = dividing && !solved ? `<div class="loose-dots" aria-hidden="true">${dotGroup(t.n, 0, false, true)}</div>` : '';
  const label = dividing
    ? solved ? `${groups} grupper med ${size} brikker i hver` : `${t.n} brikker og ${groups} tomme grupper`
    : `${groups} grupper med ${size} brikker i hver`;
  return `<div class="group-model" role="img" aria-label="${label}">${loose}<div class="group-trays" aria-hidden="true">${Array.from({ length:groups }, () => `<div>${size ? dotGroup(size, 0, false, true) : '?'}</div>`).join('')}</div></div>`;
}

function hintStage() { return state.active?.hintStages?.[state.active.index] || 0; }
function hintText(t) { return hintFor(t, hintStage() || 1); }

function renderVisual(t, solved) {
  const stage = ui.retry ? ui.retryStage : hintStage();
  if (t.support === 'optional' && !stage && !solved && !state.alwaysShowVisuals) return '<p class="mental-note">Prøv gjerne i hodet.<br>Brikkene er her hvis du trenger dem.</p>';
  let html = '', caption = '';
  if (t.type === 'ten') {
    html = tenFrame(t, solved);
    caption = solved ? `${t.a} og ${t.answer} blir ti.` : ui.added.size ? `Du har lagt til ${ui.added.size}.` : 'Du kan trykke i de tomme rutene.';
  } else if (t.type === 'count') {
    const step = countStep(t);
    const target = step < 0 ? 1 : 3;
    const numbers = Array.from({ length: 5 }, (_, i) => t.n + i - 2);
    const shown = numbers.map((n, i) => i === target && !solved && stage < 3 ? '?' : n);
    html = stage || solved ? `<div class="number-line" role="img" aria-label="${shown.map(n => n === '?' ? 'hvilket tall' : n).join(', ')}">${shown.map((n, i) => `<span aria-hidden="true" class="${i === target ? 'line-target' : ''}">${n}</span>`).join('')}</div>` : `<p class="count-visual-note">Ett steg ${step < 0 ? 'bakover' : 'videre'}.<br>Hva kommer ${step < 0 ? 'før' : 'etterpå'}?</p>`;
    caption = stage || solved ? step < 0 ? 'Én mindre enn før.' : 'Én mer enn før.' : '';
  } else if (t.type === 'add') {
    const bridge = t.a < 10 && stage >= 2 && t.answer > 10 && !solved;
    html = bridge ? `<div class="bridge-layout">${tenFrame(t, false)}<div class="bridge-extra" role="img" aria-label="${t.b - ui.added.size} nye brikker ved siden av">${dotGroup(t.b - ui.added.size, 20, false, true)}</div></div>` : solved ? quantity(t.answer) : `<div class="add-visual" role="img" aria-label="${t.a} brikker og ${t.b} brikker">${t.a < 10 ? dotGroup(t.a, 0, false, true) : quantity(t.a)}<span class="add-sign" aria-hidden="true">+</span>${dotGroup(t.b, 20, false, true)}</div>`;
    caption = bridge ? 'Trykk i de tomme rutene for å flytte brikker.' : solved ? `${t.answer} til sammen.` : 'Se på brikkene.';
  } else if (t.type === 'missing') {
    html = solved ? quantity(t.n) : `<div class="add-visual">${quantity(t.a)}<span class="add-sign" aria-hidden="true">+</span><span class="missing-part" aria-label="Brikker som mangler">?</span></div>`;
    caption = solved ? `${t.a} og ${t.answer} blir ${t.n}.` : `Hvor mange flere trengs for å få ${t.n}?`;
  } else if (t.type === 'multiply' || t.type === 'divide') {
    html = equalGroups(t, solved);
    caption = t.type === 'divide' ? solved ? `${t.answer} i hver gruppe.` : 'Del brikkene likt mellom gruppene.' : solved ? `${t.answer} til sammen.` : 'Gruppene er like store.';
  } else {
    const interactive = ['remove', 'subtract'].includes(t.type) && !solved && t.b <= t.n % 10;
    const shown = solved && ['remove', 'subtract', 'shift'].includes(t.type) ? t.answer : t.n;
    html = quantity(shown, interactive);
    if (interactive) caption = ui.removed.size ? `Du har tatt bort ${ui.removed.size}.` : 'Du kan trykke på de løse brikkene.';
    else if (t.type === 'subtract' && !solved) caption = 'Du må ta bort fra en tier også.';
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
  const stage = ui.retry ? ui.retryStage : hintStage();
  const progress = Array.from({ length: 8 }, (_, i) => `<span class="step ${i < done ? 'done' : i === done ? 'current' : ''}"></span>`).join('');
  let feedback;
  if (r.solved) {
    const messages = ['Der satt den!', 'Godt tenkt!', 'Du fant det!', 'Fint jobbet!'];
    feedback = `<div class="feedback-row">${icon('check', 'feedback-icon')}<div><p class="feedback-title">${messages[r.index % messages.length]}</p><p class="feedback-detail">${equationText(t)}</p></div></div><button class="primary" data-action="next">${r.index === 7 ? 'Fullfør runden' : 'Neste'}${icon('arrow')}</button>`;
  } else feedback = '<p class="idle-note">Ta den tiden du trenger.</p>';
  root.innerHTML = `<div class="round-shell">${betaMark()}<header class="round-header"><button class="icon-button" data-action="pause" aria-label="Ta en pause">${icon('close')}</button><div class="progress-wrap"><div class="progress-text"><span>Din lille runde</span><strong>Oppgave ${r.index + 1} av 8</strong></div><div class="progress-track" role="progressbar" aria-label="Fullførte oppgaver" aria-valuemin="0" aria-valuemax="8" aria-valuenow="${done}">${progress}</div></div>${soundButton()}</header>
    <main class="task ${t.mode === 'input' && !r.solved ? 'with-keypad' : ''}"><div class="companion-strip"><div class="companion-buddy">${buddy(r.solved, ui.retry)}</div><p>${r.solved ? 'Se hva du fikk til!' : r.attempts[r.index] ? 'Vi prøver igjen sammen.' : 'Vi finner det ut.'}</p></div><h1 tabindex="-1">${taskTitle(t)}</h1>
    ${equation(t, r.solved)}${renderVisual(t, r.solved)}
    ${!r.solved ? `<button class="help-button" data-action="help" ${stage === 3 ? 'disabled' : ''}>${icon('help')}${stage === 3 ? 'Vi ser sammen' : stage ? 'Et hint til' : 'Vis meg'}</button>` : ''}
    ${stage && !r.solved ? `<div class="hint" id="hint-panel">${hintText(t)}</div>` : ''}
    ${t.mode === 'input' ? r.solved ? `<div class="entered-correct" aria-label="Svaret ${t.answer} er riktig">${t.answer} ${icon('check')}</div>` : keypad() : `<div class="answers" role="group" aria-label="Velg svar">${t.choices.map(c => `<button class="answer ${r.solved && c === t.answer ? 'correct' : ''} ${ui.wrong.includes(c) ? 'tried' : ''}" data-answer="${c}" ${r.solved || ui.retry || ui.wrong.includes(c) ? 'disabled' : ''} aria-label="Svar ${c}${ui.wrong.includes(c) ? ', prøvd' : ''}">${c}${ui.wrong.includes(c) ? '<span class="answer-cross" aria-hidden="true">×</span>' : ''}${r.solved && c === t.answer ? '<span class="sr-only">. Riktig.</span>' : ''}</button>`).join('')}</div>`}
    <div class="feedback-area">${feedback}</div></main><footer class="round-footer">Små steg teller.</footer></div>`;
}

function renderComplete() {
  const g = rewardDetails(completedReward);
  const message = g.mode === 'bricks' ? g.full ? `${g.model.done}<br>Fem klosser, ett flott bygg!` : `En ny kloss på plass!<br>${g.build.pieces} av ${g.model.pieces.length} klosser.` : `${g.label}<br>${g.garden.stage} av 5 vekststeg.`;
  const party = celebrateOnRender ? confetti() : ''; celebrateOnRender = false;
  const newBadge = BADGES.find(badge => badge.stars === state.roundsCompleted);
  const badge = newBadge ? `<div class="new-badge">${badgeArt(newBadge)}<span>Nytt merke <strong>${newBadge.name}</strong></span></div>` : '';
  root.innerHTML = `<div class="app-shell">${header()}${updateBanner()}<main class="complete"><div class="completion-garden ${g.mode === 'bricks' ? 'completion-build' : ''}">${rewardArt(true,completedReward)}<span class="earned-star" aria-label="${g.mode === 'bricks' ? 'En ny kloss' : 'En ny stjerne'}">${icon(g.mode === 'bricks' ? 'brick' : 'star')} +1</span></div><h1 tabindex="-1">Du klarte runden!</h1><p>${message}</p><div class="completion-steps" aria-label="8 oppgaver fullført">${Array.from({ length: 8 }, () => `<span class="completion-dot">${icon('check')}</span>`).join('')}</div><p class="gentle-note">Stjerne nummer ${state.roundsCompleted} er din.</p>${badge}<button class="primary" data-action="home">Ferdig for nå${icon('check')}</button><button class="text-button" data-action="again">${state.focusBreakPending ? 'Spill Kims lek' : 'En runde til'}</button></main></div>${party}`;
}

function render() {
  if (view === 'round') renderRound();
  else if (view === 'complete') renderComplete();
  else if (view === 'focus-break') renderFocusBreak();
  else renderHome();
}

function playSuccess(final = false) { sounds.play(final ? 'finish' : 'success', state.sound); }
function keypad() { return `<div class="number-entry"><p>Svaret ditt</p><output id="input-value" aria-label="Svaret ditt" aria-live="polite">${ui.entry || '?'}</output><div class="keypad" role="group" aria-label="Skriv svaret">${[1,2,3,4,5,6,7,8,9].map(n => `<button data-digit="${n}" aria-label="Skriv ${n}" ${ui.retry ? 'disabled' : ''}>${n}</button>`).join('')}<button data-action="erase" aria-label="Slett siste siffer" ${ui.retry || !ui.entry ? 'disabled' : ''}>${icon('backspace')}</button><button data-digit="0" aria-label="Skriv 0" ${ui.retry ? 'disabled' : ''}>0</button><button class="submit-number" data-action="submit-number" ${ui.retry || !ui.entry ? 'disabled' : ''}>Svar</button></div></div>`; }
function keyFeedback(key) {
  sounds.play('key', state.sound);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const button = document.querySelector(key === 'erase' ? '[data-action="erase"]' : `[data-digit="${key}"]`);
  button?.animate?.([{ transform: 'translateY(2px)', boxShadow: '0 1px 0 #dce5db' }, { transform: 'translateY(0)', boxShadow: '0 3px 0 #dce5db' }], { duration: 120, easing: 'ease-out' });
  document.querySelector('#input-value')?.animate?.([{ transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 120, easing: 'ease-out' });
}
function canEnter() { return view === 'round' && !ui.retry && !state.active?.solved && state.active?.tasks[state.active.index].mode === 'input'; }
function enterDigit(digit) {
  if (!canEnter() || !/^[0-9]$/.test(digit) || ui.entry.length >= 3) return;
  ui.entry = ui.entry === '0' ? digit : ui.entry + digit;
  updateEntry(); keyFeedback(digit);
}
function eraseDigit() {
  if (!canEnter() || !ui.entry) return;
  ui.entry = ui.entry.slice(0, -1); updateEntry(); keyFeedback('erase');
}
function updateEntry() {
  const output = document.querySelector('#input-value'); if (output) output.textContent = ui.entry || '?';
  const submit = document.querySelector('[data-action="submit-number"]'); if (submit) submit.disabled = !ui.entry;
  const erase = document.querySelector('[data-action="erase"]'); if (erase) erase.disabled = !ui.entry;
}

function showDialog(content, css = '', afterOpen) {
  document.querySelector('dialog')?.close(); document.querySelector('dialog')?.remove();
  const lastFocus = document.activeElement;
  const d = document.createElement('dialog');
  d.className = css;
  d.setAttribute('aria-labelledby', 'dialog-title');
  d.innerHTML = content;
  document.body.append(d);
  d.addEventListener('close', () => {
    const wasAdult = Boolean(d.querySelector('#sound-setting'));
    d.remove();
    if (wasAdult && view !== 'round') { render(); root.querySelector('[data-action="adult"]')?.focus({ preventScroll: true }); }
    else if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  });
  d.showModal();
  afterOpen?.(d);
}
function closeDialog() { document.querySelector('dialog')?.close(); }
function showPause() {
  showDialog(`<h2 id="dialog-title" tabindex="-1" autofocus>En liten pause?</h2><p>Oppgavene venter på deg.<br>Du kan fortsette senere.</p><button class="primary" data-action="close-dialog">Fortsett runden</button><button class="text-button" data-action="pause-home">Ta en pause</button>`, 'pause-dialog');
}

function markAway() {
  save();
  try { localStorage.setItem(AWAY_KEY, String(Date.now())); } catch {}
}

function welcomeBack() {
  if (document.hidden) return;
  let away;
  try {
    away = Number(localStorage.getItem(AWAY_KEY));
    if (away) localStorage.removeItem(AWAY_KEY);
  } catch { return; }
  if (!away || Date.now() - away < WELCOME_AFTER) return;
  if (document.querySelector('dialog[open]') || ui.retry || view === 'focus-break') return;
  const g = rewardDetails();
  const note = state.active
    ? 'Vi kan fortsette der du slapp.'
    : g.full ? g.mode === 'bricks' ? 'Neste runde starter et nytt bygg!' : 'Neste runde får du et nytt frø!'
    : g.mode === 'bricks' ? 'Én runde gir deg neste kloss.' : 'Én runde gir planten litt mer vekst.';
  const cta = state.active ? 'Fortsett runden' : state.focusBreakPending ? 'Spill Kims lek' : 'Ta en runde';
  showDialog(`<button class="icon-button welcome-close" data-action="close-dialog" aria-label="Lukk velkomsten">${icon('close')}</button>${rewardArt()}<h2 id="dialog-title" tabindex="-1" autofocus>Hei igjen!</h2><p class="welcome-reward">${g.label}</p><p>${note}</p><button class="primary" data-action="welcome-start">${cta} ${icon('arrow')}</button>`, 'welcome-dialog');
}

function adultView() {
  const recent = state.history.slice(-5).reverse();
  const stats = topicStats(state.history, state.level);
  const topics = Object.entries(TOPICS).filter(([key]) => stats[key].total).map(([key, label]) => `<div class="topic-stat"><strong>${label}</strong><span>${stats[key].total} oppgaver · hjelp i ${stats[key].helped}</span></div>`).join('');
  const days = new Set(state.history.map(r => new Date(r.date).toLocaleDateString('nb-NO'))).size;
  const history = recent.length ? recent.map(r => `<div class="history-item"><div>${new Date(r.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}<small>${LEVELS[r.level].label}</small></div><div class="history-numbers">${r.firstTry}/8 på første forsøk<small>Hjelp åpnet i ${r.helped} ${r.helped === 1 ? 'oppgave' : 'oppgaver'}</small></div></div>`).join('') : '<p class="history-empty">Her vises de siste rundene når barnet har øvd.</p>';
  showDialog(`<div class="dialog-header"><h2 id="dialog-title">For voksne</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk voksenvisningen">${icon('close')}</button></div><p class="adult-intro">Én runde har åtte oppgaver. Ingen tidsfrist, liv eller poengtrekk. En stjerne betyr at barnet har øvd.</p>
    ${!storageWorks ? '<p class="storage-warning">Nettleseren tillater ikke lagring akkurat nå. Appen virker, men framgangen kan forsvinne når siden lukkes.</p>' : ''}
    <fieldset class="adult-group"><legend>Hva skal dere øve på?</legend>${Object.entries(LEVELS).map(([n, l]) => `<label class="level-option"><input type="radio" name="level" value="${n}" ${state.level === Number(n) ? 'checked' : ''}><span><strong>${l.label}</strong><small>${l.description}</small></span></label>`).join('')}<p class="adult-note">Gjelder fra neste nye runde. Begynn gjerne med tall til 20. Nivået økes når dere velger det sammen.</p></fieldset>
    <fieldset class="adult-group reward-options"><legend>Hva vil barnet bygge videre på?</legend><label class="level-option"><input type="radio" name="reward-mode" value="plant" ${state.rewardMode === 'plant' ? 'checked' : ''}><span class="reward-choice-icon" aria-hidden="true">${icon('sprout')}</span><span><strong>Plante</strong><small>En spire som vokser og blomstrer.</small></span></label><label class="level-option"><input type="radio" name="reward-mode" value="bricks" ${state.rewardMode === 'bricks' ? 'checked' : ''}><span class="reward-choice-icon brick-choice" aria-hidden="true">${icon('brick')}</span><span><strong>Klossebygging</strong><small>Fem store klosser blir en tilfeldig figur.</small></span></label><p class="adult-note">Én fullført runde gir én ny kloss eller litt plantevekst. Dere kan bytte uten å miste framgangen i noen av delene. En ferdig figur starter et nytt bygg ved neste nye runde.</p></fieldset>
    <label class="sound-setting"><input type="checkbox" id="sound-setting" ${state.sound ? 'checked' : ''}>Lyder ved svar og fullføring</label>
    <label class="sound-setting"><input type="checkbox" id="visual-setting" ${state.alwaysShowVisuals ? 'checked' : ''}>Vis alltid brikker og figurer</label>
    <div class="focus-setting"><label class="sound-setting"><input type="checkbox" id="focus-break-setting" aria-describedby="focus-break-note" ${state.focusBreaks ? 'checked' : ''}>Kims lek mellom øvingsrundene</label>
    <p class="adult-note" id="focus-break-note">En kort huskelek etter hver tredje runde. Barnet får se på fire bilder i sitt eget tempo.</p></div>
    <p class="adult-note adaptation-note">Oppgaver som trengte hjelp får litt mer plass. Etter flere trygge runder kan figurene bli valgfrie. Senere kan én eller to oppgaver få talltastatur. «Vis meg» er alltid tilgjengelig.</p>
    <div class="adult-stats"><div class="stat"><strong>${state.roundsCompleted}</strong><span>fullførte runder</span></div><div class="stat"><strong>${days}</strong><span>${days === 1 ? 'øvingsdag' : 'øvingsdager'} i siste historikk</span></div></div>
    <p class="adult-section-title">Øvd på · ${LEVELS[state.level].label}</p>${topics || '<p class="history-empty">Emnene vises når dere har fullført noen oppgaver.</p>'}<p class="adult-note">Siste tolv runder på valgt nivå. En oppgavetype er ikke nødvendigvis mestret selv om svaret er riktig.</p>
    <p class="adult-section-title history-title">Siste runder</p>${history}<p class="adult-note">Tallene beskriver øvingen, ikke barnets samlede forståelse. Hjelp kan også åpnes automatisk etter et feil svar. Snakk gjerne om hvordan barnet tenkte.</p>
    <div class="update-section"><p class="adult-section-title">Appversjon ${VERSION}</p><p class="adult-note" data-update-status role="status">${updateStatus.message}</p><div class="update-actions"><button class="secondary" data-action="check-update" ${updateStatus.checking || updateStatus.applying ? 'disabled' : ''}>Se etter oppdatering</button><button class="secondary update-apply" data-action="apply-update" ${updateStatus.ready ? '' : 'hidden'} ${updateStatus.applying ? 'disabled' : ''}>${updateStatus.applying ? 'Oppdaterer …' : 'Oppdater nå'}</button></div></div>
    <details class="adult-details"><summary>Tips til en god økt</summary><p>La barnet tenke ferdig. Spør av og til «Hvordan fant du det ut?». Bruk gjerne klosser ved siden av. Avslutt når overskuddet er brukt opp; en halv runde kan fortsettes senere.</p><p>Appen gir øving og erstatter ikke lærerens kartlegging eller oppfølging.</p></details>
    <details class="adult-details"><summary>Legg appen på hjemskjermen</summary><p>På iPad og iPhone: åpne adressen i Safari, velg Del og «Legg til på Hjem-skjerm». Åpne appen på nett én gang før dere bruker den uten nett.</p><p>Alt lagres bare i denne nettleseren eller den installerte appen på denne enheten. Framgang synkroniseres ikke mellom enheter. Det er ingen konto, sporing eller eksterne ressurser. Safari og en installert app kan ha hver sin framgang.</p></details>
    <button class="delete-button" data-action="reset">Slett øvingshistorikken</button><button class="primary" data-action="close-dialog">Ferdig</button><p class="version">Tallvenn ${VERSION}</p>`, '', d => {
      d.addEventListener('change', e => {
        if (e.target.name === 'level') { state.level = Number(e.target.value); save(); }
        if (e.target.name === 'reward-mode') { state = selectRewardMode(state, e.target.value); save(); }
        if (e.target.id === 'sound-setting') { state.sound = e.target.checked; save(); state.sound ? playSuccess() : sounds.stop(); }
        if (e.target.id === 'visual-setting') { state.alwaysShowVisuals = e.target.checked; save(); }
        if (e.target.id === 'focus-break-setting') {
          state.focusBreaks = e.target.checked;
          if (!state.focusBreaks) {
            state.focusBreakPending = false;
            focusGame = null;
            if (view === 'focus-break') view = 'home';
          }
          save();
        }
      });
    });
}

function submitAnswer(value) {
  if (view !== 'round' || ui.retry) return;
  const currentTask = state.active?.tasks[state.active.index];
  if (currentTask?.mode === 'choice' && ui.wrong.includes(value)) return;
  const answered = answerRound(state.active, value);
  if (answered === state.active) return;
  state.active = answered;
  const task = answered.tasks[answered.index];
  if (answered.solved) {
    save(); render();
    sounds.play(answered.attempts[answered.index] === 1 ? 'success' : 'recover', state.sound);
    flashAnswer(task, value, true);
    say(`Riktig. ${equationText(task)} Neste oppgave er klar.`);
    root.querySelector('[data-action="next"]')?.focus({ preventScroll: true });
    root.querySelector('.feedback-area')?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    return;
  }
  ui.wrong.push(value);
  ui.retryStage = hintStage();
  ui.retry = true;
  ui.retryUntil = Date.now() + 1100;
  state.active = noteHelp(answered);
  save(); render(); sounds.play('retry', state.sound);
  flashAnswer(task, value, false);
  const attempt = ui;
  setTimeout(() => {
    if (ui === attempt && ui.retry && view === 'round') showRetry(task);
  }, 320);
}

function showRetry(task) {
  const attempt = ui;
  showDialog(`<h2 id="dialog-title" tabindex="-1" autofocus>Nesten!</h2>
    <p>Se på hintet og tenk en gang til.</p><p class="retry-hint">${hintText(task)}</p>
    <button class="primary" data-action="retry" disabled>Prøv igjen ${icon('arrow')}</button>`, 'retry-sheet', dialog => {
    dialog.addEventListener('cancel', event => { event.preventDefault(); retryAnswer(); });
    const button = dialog.querySelector('[data-action="retry"]');
    const remaining = Math.max(0, attempt.retryUntil - Date.now());
    setTimeout(() => { if (dialog.open && ui === attempt) button.disabled = false; }, remaining);
  });
}

function flashAnswer(task, value, correct) {
  const selector = task.mode === 'choice' ? `[data-answer="${value}"]`
    : correct ? '.entered-correct' : '.submit-number';
  const target = root.querySelector(selector);
  if (!target) return;
  target.classList.add(correct ? 'answer-spark' : 'answer-miss');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#25865b', '#e8b32f', '#66a2d1', '#e68d92', '#76a85a'];
  const particles = Array.from({ length:correct ? 12 : 6 }, (_, i) => {
    const angle = i * Math.PI / 6;
    const reach = 34 + i % 3 * 11;
    return correct
      ? `<i style="--x:${Math.round(Math.cos(angle) * reach)}px;--y:${Math.round(Math.sin(angle) * reach)}px;--turn:${60+i*23}deg;background:${colors[i%colors.length]}"></i>`
      : `<i style="--x:${(i - 2.5) * 12}px;--delay:${i%3 * 55}ms"></i>`;
  }).join('');
  target.insertAdjacentHTML('beforeend', `<span class="answer-particles" aria-hidden="true">${particles}</span>`);
  const effect = target.querySelector('.answer-particles');
  setTimeout(() => effect?.remove(), 850);
}

function retryAnswer() {
  if (view !== 'round' || !ui.retry || Date.now() < ui.retryUntil) return;
  ui.retry = false;
  ui.entry = '';
  document.querySelector('.retry-sheet')?.close();
  render();
  const first = root.querySelector('.answer:not(:disabled), [data-digit]:not(:disabled)');
  (first || root.querySelector('h1'))?.focus({ preventScroll: true });
}

document.addEventListener('click', e => {
  const answer = e.target.closest('[data-answer]');
  if (answer && view === 'round' && !answer.disabled) { submitAnswer(Number(answer.dataset.answer)); return; }
  const digit = e.target.closest('[data-digit]');
  if (digit && view === 'round' && !state.active.solved) { enterDigit(digit.dataset.digit); return; }
  const unit = e.target.closest('[data-unit]');
  if (unit && view === 'round' && !ui.retry && !state.active.solved) {
    const n = Number(unit.dataset.unit);
    ui.removed.has(n) ? ui.removed.delete(n) : ui.removed.add(n);
    unit.classList.toggle('removed', ui.removed.has(n)); unit.setAttribute('aria-pressed', String(ui.removed.has(n))); unit.setAttribute('aria-label', `${ui.removed.has(n) ? 'Legg tilbake' : 'Ta bort'} brikke ${n + 1}`);
    const text = `Du har tatt bort ${ui.removed.size}.`;
    document.querySelector('#visual-caption').textContent = text; say(text); return;
  }
  const cell = e.target.closest('[data-cell]');
  if (cell && view === 'round' && !ui.retry && !state.active.solved) {
    const n = Number(cell.dataset.cell);
    ui.added.has(n) ? ui.added.delete(n) : ui.added.add(n);
    cell.classList.toggle('added', ui.added.has(n)); cell.setAttribute('aria-pressed', String(ui.added.has(n))); cell.setAttribute('aria-label', `Rute ${n + 1}: ${ui.added.has(n) ? 'ta bort den nye brikken' : 'legg til en brikke'}`); cell.innerHTML = ui.added.has(n) ? '<span class="unit"></span>' : '';
    const t = state.active.tasks[state.active.index];
    const text = t.type === 'add' ? `Du har flyttet ${ui.added.size} brikker inn i tieren.` : `Du har lagt til ${ui.added.size}.`;
    if (t.type === 'add') {
      const extra = document.querySelector('.bridge-extra');
      extra.innerHTML = dotGroup(t.b - ui.added.size, 20, false, true);
      extra.setAttribute('aria-label', `${t.b - ui.added.size} nye brikker ved siden av`);
    }
    document.querySelector('#visual-caption').textContent = text; say(text); return;
  }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'start' || action === 'again') startRound();
  if (action === 'welcome-start') {
    closeDialog();
    if (view !== 'round') startRound();
  }
  if (action === 'retry') retryAnswer();
  if (action === 'collection') showCollection();
  if (action === 'collectible') {
    const { kind, id } = e.target.closest('[data-action="collectible"]').dataset;
    showCollectible(kind, id);
  }
  if (action === 'focus-hide' && view === 'focus-break' && focusGame.phase === 'study') {
    focusGame.phase = 'guess';
    render(); focusHeading();
  }
  if (action === 'focus-answer' && view === 'focus-break' && focusGame.phase === 'guess') selectFocusImage(e.target.closest('[data-action="focus-answer"]'));
  if (action === 'focus-check' && view === 'focus-break' && focusGame.phase === 'guess') checkFocusBreak();
  if (action === 'focus-retry' && view === 'focus-break' && focusGame.phase === 'retry') {
    focusGame.selected.clear();
    focusGame.phase = 'study';
    render(); goTop(); focusHeading();
  }
  if (action === 'focus-continue' && view === 'focus-break' && focusGame.phase === 'done') {
    focusGame = null;
    startRound();
  }
  if (action === 'help' && state.active && !ui.retry) { state.active = noteHelp(state.active); save(); render(); say(hintText(state.active.tasks[state.active.index])); }
  if (action === 'sound') { state.sound = !state.sound; save(); state.sound ? playSuccess() : sounds.stop(); render(); document.querySelector('[data-action="sound"]')?.focus({ preventScroll: true }); }
  if (action === 'erase') eraseDigit();
  if (action === 'submit-number' && ui.entry) submitAnswer(Number(ui.entry));
  if (action === 'check-update') updates.check();
  if (action === 'apply-update') updates.apply();
  if (action === 'next' && state.active?.solved) {
    state.active = advanceRound(state.active);
    if (state.active.index === 8) {
      const summary = roundSummary(state.active);
      if (summary && !state.history.some(r => r.id === summary.id)) {
        state.history.push(summary); state.history = state.history.slice(-40); state.roundsCompleted++;
        const awarded = awardPractice(state, summary.id); state = awarded.state; completedReward = awarded.reward;
        state.focusBreakPending = state.focusBreaks && state.roundsCompleted % 3 === 0;
      }
      state.active = null; view = 'complete'; celebrateOnRender = true; playSuccess(true);
    }
    ui = makeUI(); save(); render(); goTop(); focusHeading();
  }
  if (action === 'home') { view = 'home'; render(); goTop(); focusHeading(); }
  if (action === 'adult') adultView();
  if (action === 'close-dialog') closeDialog();
  if (action === 'pause' && !ui.retry) showPause();
  if (action === 'pause-home') { closeDialog(); view = 'home'; save(); render(); goTop(); focusHeading(); }
  if (action === 'reset') showDialog('<h2 id="dialog-title">Slette historikken?</h2><p>Stjerner, plantevekst, bygg og en påbegynt runde blir slettet på denne enheten.</p><button class="primary" data-action="close-dialog" autofocus>Behold historikken</button><button class="text-button" data-action="confirm-reset">Ja, slett historikken</button>', 'pause-dialog');
  if (action === 'confirm-reset') { closeDialog(); const { level, sound, rewardMode, focusBreaks } = state; state = selectRewardMode({ ...freshState(), level, sound, focusBreaks }, rewardMode); completedReward = null; focusGame = null; save(); view = 'home'; render(); focusHeading(); }
});

document.addEventListener('keydown', e => {
  if (e.repeat && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return; }
  if (e.key === 'Escape' && view === 'round' && !ui.retry && !document.querySelector('dialog')) { e.preventDefault(); showPause(); }
  if (canEnter() && !document.querySelector('dialog')) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); enterDigit(e.key); }
    if (e.key === 'Backspace') { e.preventDefault(); eraseDigit(); }
    if (e.key === 'Enter' && ui.entry && !e.target.closest('[data-action="help"], [data-action="sound"], [data-action="pause"]')) { e.preventDefault(); submitAnswer(Number(ui.entry)); }
  }
});
window.addEventListener('pagehide', markAway);
window.addEventListener('pageshow', welcomeBack);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { markAway(); sounds.stop(); }
  else { welcomeBack(); if (view !== 'round') updates.check(); }
});
render();
welcomeBack();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => updates.init());
}
