import {text as msg} from './i18n.js';
import {constructionStory} from './landmark-stories.js';
import {mapCharacterInfo} from './map-life.js';
import { VERSION, CHANNEL, ROUND_LENGTH, ROUND_LENGTHS, PROGRESSION_ROUNDS, STORAGE_KEY, LEVELS, TOPICS, topicOf, topicStats, growthState, countStep, createRound, answerRound, advanceRound, noteHelp, roundSummary, freshState, restoreState, practiceLevelForGrade, progressionPreview, advancePractice } from './core.js';
import { hintFor } from './learning.js';
import { createSoundPlayer, taskSuccessStep } from './sound.js';
import { createUpdater, readPublishedVersion, PRODUCTION_PATH } from './update.js';
import { modelById, selectRewardMode, prepareReward, awardPractice, upcomingBuild, renderBuildSvg, puzzleBrickLayout, renderPuzzleBrick, PERFECT_ROUNDS_PER_BONUS } from './rewards.js';
import { plantById, renderPlant } from './plants.js';
import { BREAK_ATTEMPTS, BREAK_INTERVAL, BREAK_TITLES, BRICK_COLORS, breakKind, createBreakGame, placeBreakBrick, retryBreak, scoreBreak } from './breaks.js';
import { AVATARS, AVATAR_GROUPS, GRADES, NAME_LIMIT, PROFILE_KEY, chosenProfileName, profileDetails, readProfiles, saveProfile, deleteProfile } from './profiles.js';
import { rewardIllustration } from './illustrations.js';
import { curriculumTopic, levelForGrade, levelsForGrade } from './curriculum.js';
import { PROJECTS, projectById, projectScene, worldBuilding, worldBuildingOptions, worldBuildingPreview } from './projects.js';
import { isWorld, isRegion, currentWorld, worldStatus, worldCompletedPlaces, worldSelect, worldAdvance, freshWorld, replaceCurrentWorld, startNewWorld, WORLD_IDS, REGION_PLACES } from './worlds.js';
import { mountProjectView } from './project-view.js';
import { seasonForDate, seasonMark } from './seasons.js';

const root = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
let storageWorks = true;
let profileStore = { activeId:null, profiles:[] };
let profile = null;
let storage;
let state;
try {
  storage = localStorage;
  profileStore = readProfiles(storage);
  profile = profileStore.profiles.find(item => item.id === profileStore.activeId) || null;
  state = restoreState(profile ? profile.practice : profileStore.deletedIds?.length ? null : JSON.parse(storage.getItem(STORAGE_KEY)));
} catch { state = freshState(); }
alignPracticeLevel(profile?.grade);
if (state.rewardMode === 'bricks' || isWorld(state.rewardMode)) state = selectRewardMode(state, state.rewardMode);
let view = profile ? 'home' : 'onboarding';
let completedReward = null;
let focusGame = null;
let testBreakReturn = null;
let brickDrag = null;
let ignoredBrickClick = null;
let disposeProjectPreview;
let disposeHomeSurprise;
let setup = null;
let ui = makeUI();
const sounds = createSoundPlayer();

// Safari may report pinch gestures separately from the map's pointer events.
for (const name of ['gesturestart','gesturechange']) {
  document.addEventListener(name,event=>{
    if (matchMedia('(pointer: coarse)').matches) event.preventDefault();
  },{passive:false});
}
const AWAY_KEY = `${STORAGE_KEY}-away`;
const WELCOME_AFTER = 15 * 60 * 1000;
const TEST_BREAK_LINKS = { memory:'#pauselek=kims-lek', build:'#pauselek=klossebygget', floor:'#pauselek=klossegulvet' };
let celebrateOnRender = false;
let updateStatus = { ready: false, checking: false, applying: false, message: 'Se etter en nyere versjon når du er på nett.' };
const updates = createUpdater({ currentVersion: VERSION, beforeReload: () => { const saved = save(); if (saved) sounds.stop(); return saved; }, onStatus: next => {
  const changed = next.ready !== updateStatus.ready;
  updateStatus = next;
  document.querySelectorAll('[data-update-status]').forEach(el => { el.textContent = next.message; });
  document.querySelectorAll('[data-action="check-update"]').forEach(el => { el.disabled = next.checking || next.applying; });
  document.querySelectorAll('[data-action="apply-update"]').forEach(el => { el.hidden = !next.ready; el.disabled = next.applying; el.textContent = next.applying ? 'Oppdaterer …' : el.closest('.update-banner') ? 'Oppdater' : 'Oppdater nå'; });
  if (changed && view !== 'round' && view !== 'onboarding' && !document.querySelector('dialog')) render();
} });

function makeUI() { return { wrong: [], removed: new Set(), added: new Set(), entry: '', retry: false, retryUntil: 0, retryStage: 0 }; }
function save({ select=false, edit=false } = {}) {
  if (profile) {
    const result = saveProfile(storage, profileStore, { ...profile, practice:state }, { select, edit, recover:!storageWorks });
    profileStore = result.store;
    if (result.removed) {
      const id=profile.id;
      queueMicrotask(()=>{ if (profile?.id===id) selectAfterDeletion(); });
      return true;
    }
    profile = profileStore.profiles.find(item => item.id === profile.id);
    storageWorks = result.saved;
    return storageWorks;
  }
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); storageWorks = true; }
  catch { storageWorks = false; }
  return storageWorks;
}
save();

function icon(name, css = '') {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    expand: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>',
    collapse: '<path d="M4 9h5V4m6 0v5h5M9 20v-5H4m11 5v-5h5"/>',
    play: '<path d="M8 5.5 19 12 8 18.5Z" fill="currentColor"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--paper)"/><circle cx="15" cy="17" r="3" fill="var(--paper)"/>',
    sprout: '<path d="M12 20v-9M12 14C5 14 4 9 4 6c6 0 8 3 8 8ZM12 11c0-6 4-8 8-8 0 5-2 8-8 8Z"/>',
    'brand-friend': '<path d="M11.5 7.6c0-3.6 2.5-5.5 5.5-5.1-.3 2.9-2.1 4.5-5.5 5.1Z" fill="#81c77f" stroke="none"/><path d="M11.3 8c6.1-2.1 8.5 1.4 8.5 6.2 0 4.5-3 7.2-8 7.2s-8-2.5-8-7 2.4-7.6 7.5-6.4Z" fill="#d4edb7" stroke="none"/><ellipse cx="8.8" cy="13.4" rx="1" ry="1.35" fill="#203c34" stroke="none"/><ellipse cx="14.6" cy="13.4" rx="1" ry="1.35" fill="#203c34" stroke="none"/><path d="M10.4 16.3q1.3 1.7 2.6 0" stroke="#203c34" stroke-width="1.05"/><path d="M20.1 3.7l.7 1.9 1.8.7-1.8.6-.7 1.9-.7-1.9-1.8-.6 1.8-.7Z" fill="#f6cd6e" stroke="none"/>',
    again: '<path d="M20 11a8 8 0 1 1-3-6.2L20 8M20 3v5h-5"/><path d="m12 8 .7 2.3L15 11l-2.3.7L12 14l-.7-2.3L9 11l2.3-.7L12 8Z"/>',
    star: '<path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.4l6.3-.9Z"/>',
    sound: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/>',
    backspace: '<path d="M10 5h10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H10a2 2 0 0 1-1.5-.7L3 12l5.5-6.3A2 2 0 0 1 10 5Z"/><path d="m11.5 9.5 5 5m0-5-5 5"/>',
    brick: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M6 8V4h4v4m4 0V4h4v4M3 12h18"/>',
  };
  return `<svg class="${css}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}
function buddy(happy = false, surprised = false) {
  return `<div class="buddy ${happy ? 'happy' : surprised ? 'surprised' : ''}" aria-hidden="true"><div class="buddy-shadow"></div><div class="buddy-leaf"></div><div class="buddy-body"><i class="buddy-eye left"></i><i class="buddy-eye right"></i><i class="buddy-smile"></i><i class="buddy-cheek left"></i><i class="buddy-cheek right"></i></div><span class="buddy-spark">✦</span><span class="buddy-spark right">✦</span></div>`;
}
function eploNote(message,celebration=false) {
  return `<div class="eplo-note${celebration?' eplo-finale':''}"><div class="eplo-avatar">${buddy(celebration)}</div>
    <div class="eplo-bubble"><strong>Eplo</strong><p>${escapeHtml(message)}</p></div></div>`;
}
function mapEplo(note, demo=false, standalone=false) {
  return `<div class="map-eplo-overlay${standalone?' map-eplo-standalone':''}" ${demo?'data-demo-finale hidden':''}>${note}<button type="button" class="icon-button map-eplo-close" data-action="dismiss-eplo" aria-label="Lukk meldingen fra Eplo">${icon('close')}</button></div>`;
}
function projectCongratulations(id) {
  const messages={
    city:'Gratulerer! Rundene dine ble til en hel by. Nå kan du ta en siste titt på alt du fikk til.',
    moon:'Hele månebasen er ferdig! Se hvor mye du fikk til, ett byggesteg om gangen.',
    island:'Gratulerer! Se for en flott ferieøy du har bygd. Jeg har lyst til å dra på ferie dit.',
  };
  return eploNote(messages[id]??'Du fullførte superhelten! Se alle delene du fikk på plass, én runde om gangen.',true);
}
function brand() { return `<div class="brand"><span class="brand-mark">${icon('brand-friend', 'brand-friend')}<span class="brand-season">${seasonMark(seasonForDate())}</span></span><span>Mattopia</span></div>`; }
function betaMark() { return CHANNEL === 'preview' ? '<span class="beta-mark"><strong>BETA</strong><span class="sr-only"> Testversjon</span></span>' : ''; }
function soundButton() { return `<button class="icon-button sound-toggle" data-action="sound" aria-label="${state.sound ? 'Lyd på. Slå av lyd' : 'Lyd av. Slå på lyd'}" aria-pressed="${state.sound}">${icon(state.sound ? 'sound' : 'muted')}</button>`; }
function header(showAdult = true, showSound = true) { return `<header class="site-header"><div class="brand-wrap">${brand()}${betaMark()}</div><div class="header-controls">${showSound ? soundButton() : ''}${showAdult ? `<button class="adult-link" data-action="adult">${icon('settings')}${msg('adult.title')}</button>` : ''}</div></header>`; }
function updateBanner() { return updateStatus.ready ? `<aside class="update-banner"><span>${updateStatus.applying ? 'Oppdaterer appen …' : 'Ny versjon klar.'}</span><button data-action="apply-update" ${updateStatus.applying ? 'disabled' : ''}>${updateStatus.applying ? 'Oppdaterer …' : 'Oppdater'}</button></aside>` : ''; }
function say(text) { announcer.textContent = ''; requestAnimationFrame(() => { announcer.textContent = text; }); }
function focusHeading() { root.querySelector('h1')?.focus({ preventScroll: true }); }
function goTop() { window.scrollTo({ top: 0, behavior: 'instant' }); }

function escapeHtml(value) {
  const escaped = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  return value.replace(/[&<>"']/g, character => escaped[character]);
}

function avatarArt(key) {
  return `<span class="player-avatar" aria-hidden="true">${AVATARS[key].icon}</span>`;
}

function gradeOptions(selected) {
  return `<option value="">Velg senere</option>${GRADES.map(grade => `<option value="${grade}" ${grade === selected ? 'selected' : ''}>${grade}. trinn</option>`).join('')}`;
}

function alignPracticeLevel(grade) {
  const level = practiceLevelForGrade(state, grade);
  if (level !== state.level || !grade) state.progressRounds = 0;
  if (!grade) state.autoProgress = false;
  if (!grade && state.mix === 'grade') state.mix = null;
  state.level = level;
}

function profileFields(person) {
  return `<label class="profile-field"><span>${msg('profile.name')}</span><input type="text" name="name" maxlength="${NAME_LIMIT}" value="${escapeHtml(person.name)}" autocomplete="off" placeholder="Valgfritt"></label>
    <label class="profile-field"><span>${msg('profile.grade')}</span><select name="grade">${gradeOptions(person.grade)}</select></label>
    <fieldset class="avatar-options"><legend>${msg('profile.avatar')}</legend>
      ${AVATAR_GROUPS.map(({label,avatars})=>`<div class="avatar-group">
        <p>${label}</p><div class="avatar-grid">${Object.entries(avatars).map(([key,name])=>`<label class="avatar-option">
          <input class="sr-only" type="radio" name="avatar" value="${key}" ${key === person.avatar ? 'checked' : ''}>
          ${avatarArt(key)}<span class="avatar-name">${name}</span></label>`).join('')}</div>
      </div>`).join('')}
    </fieldset>`;
}

const SETUP_TITLES = [msg('setup.profileTitle'), msg('setup.practiceTitle'), msg('setup.rewardTitle')];

function makeSetup(mode) {
  const practice = mode === 'new' ? freshState() : state;
  const level = practice.active || practice.roundsCompleted || practice.level !== 1 ? practice.level : null;
  const person=profileDetails(mode==='edit'?{...profile,name:chosenProfileName(profile)}:undefined);
  return {mode,step:0,person,level,mix:practice.mix,autoProgress:practice.autoProgress,
    progressionExcluded:{...practice.progressionExcluded},roundLength:practice.roundLength,rewardMode:practice.rewardMode};
}

function progressionTracks(grade,excluded,expanded=false) {
  const levels=levelsForGrade(grade);
  const onlyOne=levels.length-excluded.length===1;
  return `<details class="adult-details progression-tracks" ${expanded?'open':''}><summary>${msg('setup.tracks')}</summary>
    <p class="adult-note">${msg('setup.tracksNote')}</p>
    ${levels.map(n=>`<label class="sound-setting progression-track"><input type="checkbox" name="progression-track" value="${n}"
      ${excluded.includes(n)?'':`checked ${onlyOne?'disabled':''}`}>${LEVELS[n].label}</label>`).join('')}
  </details>`;
}

function setupExcluded(form) {
  return [...form.querySelectorAll('input[name="progression-track"]:not(:checked)')].map(input=>Number(input.value));
}

function syncSetupTracks(form) {
  const select=form.elements.level;
  if (!setup?.person.grade||!select) return;
  const autoProgress=form.elements.practice.value==='auto';
  const {grade}=setup.person, excluded=setupExcluded(form);
  const level=practiceLevelForGrade({level:Number(select.value),autoProgress,progressionExcluded:{[grade]:excluded}},grade);
  for (const option of select.options) option.disabled=autoProgress&&excluded.includes(Number(option.value));
  select.value=level;
  const inputs=[...form.querySelectorAll('input[name="progression-track"]')];
  const onlyOne=inputs.length-excluded.length===1;
  inputs.forEach(input=>{ input.disabled=input.checked&&onlyOne; });
}

function setupForm(draft) {
  const {step,person,mix,autoProgress,roundLength,rewardMode} = draft;
  const excluded=draft.progressionExcluded?.[person.grade]??[];
  const startingLevel=practiceLevelForGrade(draft,person.grade);
  const modes = [['fixed',msg('practice.fixed'),msg('practice.fixedNote')],['auto',msg('practice.auto'),msg('practice.autoNote')],
    ['grade',msg('practice.grade'),msg('practice.gradeNote')],
    ['all',msg('practice.mixed'),msg('practice.mixedNote')]];
  const rewards = [
    ['plant',msg('reward.plant'),msg('reward.plantNote')],
    ['bricks',msg('reward.bricks'),msg('reward.bricksNote')],
    ...Object.entries(PROJECTS).map(([id,{name,description}])=>
      [id,name,`Bygg ${description[0].toLowerCase()}${description.slice(1)}`]),
  ];
  const practiceModes=modes.map(([id,label,note])=>{
    const unavailable=!person.grade&&['auto','grade'].includes(id);
    const selected=id===(mix||(autoProgress&&person.grade?'auto':'fixed'));
    return `<label class="level-option${unavailable?' unavailable':''}">
      <input type="radio" name="practice" value="${id}" ${selected?'checked':''} ${unavailable?'disabled':''}>
      <span><strong>${label}</strong><small>${unavailable?msg('setup.gradeRequired'):note}</small></span>
    </label>`;
  }).join('');
  const fields = [
    () => profileFields(person),
    () => `<fieldset class="setup-modes"><legend>${msg('setup.practiceLegend')}</legend>
    ${!person.grade?'<p class="setup-grade-note">Gå tilbake og velg klassetrinn for å bruke «Følg progresjonen» eller «Fri blanding på trinnet».</p>':''}
    ${practiceModes}</fieldset>
    <label class="profile-field"><span>${msg('setup.startTopic')}</span><select name="level">${levelsForGrade(person.grade).map(id=>`<option value="${id}" ${id === startingLevel ? 'selected' : ''} ${autoProgress&&excluded.includes(id)?'disabled':''}>${LEVELS[id].label}</option>`).join('')}</select></label>
    ${person.grade?`<div class="progression-setting setup-progression">${progressionTracks(person.grade,excluded,true)}</div>`:''}
    <label class="profile-field"><span>${msg('setup.roundLength')}</span><select name="length">${ROUND_LENGTHS.map(length=>`<option value="${length}" ${length === roundLength ? 'selected' : ''}>${length} oppgaver</option>`).join('')}</select></label>`,
    () => `<fieldset class="setup-rewards"><legend class="sr-only">Velg belønning</legend><div>${rewards.map(([id,label,note])=>`<label class="setup-reward">
      <input type="radio" name="reward" value="${id}" class="sr-only" ${id === rewardMode ? 'checked' : ''}>
      <span class="setup-reward-card"><span class="setup-reward-art" aria-hidden="true">${rewardIllustration(id)}<span class="setup-reward-check">${icon('check')}</span></span>
        <strong>${label}</strong><small>${note}</small></span>
    </label>`).join('')}</div></fieldset><p class="adult-note">Du kan endre valgene under «For voksne».</p>`,
  ];
  return `<form class="profile-form setup-form" data-setup-form>
    <div class="setup-progress"><span>${msg('setup.step', {step:step+1,total:SETUP_TITLES.length})}</span><div aria-hidden="true">${SETUP_TITLES.map((_,i)=>`<i ${i<=step?'class="done"':''}></i>`).join('')}</div></div>
    ${step===0&&draft.mode!=='edit'?eploNote(msg('setup.intro')):''}
    ${fields[step]()}
    <div class="setup-actions">${step ? '<button type="button" class="secondary" data-action="setup-back">Tilbake</button>' : ''}
      <button type="submit" class="primary">${step < SETUP_TITLES.length-1 ? msg('round.next') : draft.mode==='edit'?msg('setup.save'):msg('setup.start')} ${icon('arrow')}</button></div>
  </form>`;
}

function stepSetup(form, direction) {
  if (!setup) return;
  const values = new FormData(form);
  if (setup.step === 0) {
    const next = profileDetails(Object.fromEntries(values));
    if (!next.grade) setup.autoProgress = false;
    if (!next.grade&&setup.mix==='grade') setup.mix=null;
    if (next.grade===3 && !Object.hasOwn(setup.progressionExcluded,3) && (setup.mode==='new'||!state.roundsCompleted&&!state.active)) {
      setup.progressionExcluded[3]=[4];
    }
    setup.person = next;
  } else if (setup.step === 1) {
    const mode=values.get('practice');
    setup.autoProgress = Boolean(setup.person.grade && mode === 'auto');
    setup.mix=mode==='all'||mode==='grade'&&setup.person.grade?mode:null;
    if (setup.person.grade) setup.progressionExcluded[setup.person.grade]=setupExcluded(form);
    setup.level = practiceLevelForGrade({...setup,level:Number(values.get('level'))},setup.person.grade);
    const length = Number(values.get('length'));
    if (ROUND_LENGTHS.includes(length)) setup.roundLength = length;
  } else {
    const reward = values.get('reward');
    if (reward === 'plant' || reward === 'bricks' || projectById(reward)) setup.rewardMode = reward;
  }
  if (setup.step + direction === SETUP_TITLES.length) {
    submitProfile(setup.mode,setup.person,setup);
    return;
  }
  setup.step = Math.max(0,setup.step+direction);
  const dialog = form.closest('[data-setup-dialog]');
  if (dialog) {
    const heading = dialog.querySelector('#dialog-title');
    heading.textContent = setup.step===0&&setup.mode==='edit'?msg('setup.edit'):SETUP_TITLES[setup.step];
    form.outerHTML = setupForm(setup);
    dialog.scrollTop = 0;
    heading.focus({preventScroll:true});
  } else {
    render(); goTop(); focusHeading();
  }
}

function renderOnboarding() {
  setup ||= makeSetup('first');
  const carry = state.roundsCompleted || state.active;
  root.innerHTML = `<div class="app-shell">${header(CHANNEL === 'preview', false)}${updateBanner()}<main class="onboarding">
    <p class="home-eyebrow">${msg('setup.greeting')}</p><h1 tabindex="-1">${SETUP_TITLES[setup.step]}</h1>
    ${setup.step === 0 ? `<p>${carry ? msg('setup.import') : msg('setup.playerIntro')}</p>` : ''}
    ${setupForm(setup)}<p class="adult-note">${msg('setup.storage')}</p>
    ${!storageWorks ? '<p class="storage-warning">Framgangen kan forsvinne hvis nettleseren blokkerer lagring.</p>' : ''}
  </main></div>`;
}

function showProfiles() {
  showDialog(`<div class="dialog-header"><h2 id="dialog-title" tabindex="-1" autofocus>${msg('setup.profileTitle')}</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk profilvalget">${icon('close')}</button></div>
    <div class="player-list">${profileStore.profiles.map(person => `<button class="player-row" data-action="select-profile" data-profile-id="${person.id}" ${person.id === profile.id ? 'aria-current="true"' : ''}>
      ${avatarArt(person.avatar)}<span><strong>${escapeHtml(person.name)}</strong>${person.grade ? `<small>${person.grade}. trinn</small>` : ''}</span>
      ${person.id === profile.id ? '<small class="current-player">Spiller nå</small>' : icon('arrow')}</button>`).join('')}</div>
    <div class="profile-actions"><button class="secondary" data-action="new-profile">${msg('profile.new')}</button><button class="secondary" data-action="edit-profile">${msg('profile.edit')}</button></div>`, 'profile-dialog');
}

function showProfileForm(mode) {
  setup = makeSetup(mode);
  const title = mode === 'edit' ? msg('setup.edit') : SETUP_TITLES[0];
  showDialog(`<div class="dialog-header"><h2 id="dialog-title" tabindex="-1" autofocus>${title}</h2><button class="icon-button" data-action="show-profiles" aria-label="Tilbake til spillerne">${icon('close')}</button></div>
    ${setupForm(setup)}`, 'profile-dialog', dialog => { dialog.dataset.setupDialog = ''; });
}

function openProfile(person, practice, edit = false) {
  profile = person;
  state = restoreState(practice);
  alignPracticeLevel(person.grade);
  if (state.rewardMode === 'bricks' || isWorld(state.rewardMode)) state = selectRewardMode(state, state.rewardMode);
  save({ select:true, edit });
  sounds.stop();
  if (state.sound) sounds.resume();
  completedReward = null;
  focusGame = null;
  setup = null;
  ui = makeUI();
  view = 'home';
  closeDialog();
  render(); goTop(); focusHeading();
}

function selectProfile(id) {
  if (id === profile?.id) { closeDialog(); return; }
  save();
  const person = profileStore.profiles.find(item => item.id === id);
  if (person) openProfile(person, person.practice);
}

function selectAfterDeletion() {
  const next=profileStore.profiles.find(person=>person.id===profileStore.activeId);
  if (next) { openProfile(next,next.practice); return; }
  profile=null;
  state=freshState();
  completedReward=null;
  focusGame=null;
  testBreakReturn=null;
  setup=null;
  ui=makeUI();
  sounds.stop();
  view='onboarding';
  closeDialog();
  render(); goTop(); focusHeading();
}

function confirmProfileDeletion() {
  if (!profile) return;
  const {id,name}=profile;
  showDialog(`<h2 id="dialog-title">Slette profilen til ${escapeHtml(name)}?</h2>
    <p>Øvingshistorikk, stjerner og alt spilleren har bygd eller dyrket, slettes fra denne enheten.</p>
    <button class="primary" data-action="close-dialog">${msg('profile.keep')}</button>
    <button class="delete-button" data-action="confirm-profile-delete" data-profile-id="${id}">${msg('profile.confirmDelete')}</button>
    <p class="adult-note" data-delete-error role="alert" hidden></p>`, 'pause-dialog');
}

function applySetupPreferences(practice,person,preferences) {
  if (!preferences) return practice;
  const autoProgress = Boolean(person.grade && preferences.autoProgress);
  const progressionExcluded = preferences.progressionExcluded ?? practice.progressionExcluded;
  const level = practiceLevelForGrade({level:preferences.level,autoProgress,progressionExcluded},person.grade);
  const progressRounds = practice.level!==level || practice.autoProgress!==autoProgress ? 0 : practice.progressRounds;
  return selectRewardMode({...practice,level,autoProgress,progressionExcluded,progressRounds,
    mix:autoProgress?null:preferences.mix??null,roundLength:preferences.roundLength},preferences.rewardMode);
}

function submitProfile(mode, details, preferences = null) {
  const person = profileDetails(details);
  if (mode === 'edit' && profile) {
    if (profile.grade !== person.grade) state.progressRounds = 0;
    const number=profileStore.profiles.findIndex(player=>player.id===profile.id)+1;
    profile = { ...profile, ...person, name:person.name || `Spiller ${Math.max(1,number)}`, hasName:Boolean(person.name) };
    state=applySetupPreferences(state,profile,preferences);
    alignPracticeLevel(profile.grade);
    setup=null;
    save({ edit:true });
    closeDialog(); render(); focusHeading();
    return;
  }
  if (mode !== (profile ? 'new' : 'first')) return;
  if (profile) save();
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const name = person.name || `Spiller ${profileStore.profiles.length + 1}`;
  let practice = profile ? freshState() : state;
  if (profile || !practice.roundsCompleted && !practice.active && practice.level === 1) {
    practice.level = levelForGrade(person.grade, null);
  }
  practice=applySetupPreferences(practice,person,preferences);
  openProfile({ ...person, name, id, hasName:Boolean(person.name) }, practice, true);
}

function rewardDetails(reward = null) {
  const mode = reward?.mode || state.rewardMode;
  const project = projectById(mode);
  if (project) {
    const map = isWorld(mode) ? reward?.map || currentWorld(state, mode) : null;
    if (isWorld(mode)) return {mode,project,map,...worldStatus(map),added:reward?.added,label:project.name};
    const completed = reward?.completed ?? state.projects[mode];
    return {mode,project,completed,total:project.total,added:reward?.added,full:completed===project.total,label:project.name};
  }
  if (mode !== 'bricks') {
    const garden = reward?.garden || state.garden;
    const plant = plantById(garden.plant);
    const full = garden.stage === 5;
    const label = full ? `${plant.name} er ferdig!` : `Vi dyrker ${plant.name.toLowerCase()}`;
    return { mode:'plant', garden, plant, full, label };
  }
  const build = reward?.build || state.brickBuild;
  const model = modelById(build.model), full = build.pieces === model.pieces.length;
  const label = full ? model.done : build.pieces ? `Vi bygger ${model.name}!` : 'Neste bygg';
  return {mode,build,model,full,label};
}
function rewardArt(happy = false, reward = null, {showBuddy=true}={}) {
  const info = rewardDetails(reward);
  if (info.project) {
    const world = isWorld(info.mode);
    const label = world ? msg('map.explore') : msg('project.explore');
    return `<button class="project-peek${world?' project-peek--world':''}" data-action="project-open" data-project="${info.mode}" aria-label="${label}: ${info.project.name}">
      <canvas data-project-preview="${info.mode}" data-completed="${info.completed}" ${happy && info.added && celebrateOnRender ? 'data-reveal' : ''} aria-hidden="true"></canvas><span>${label} ${icon('arrow')}</span>
    </button>`;
  }
  const art = info.mode === 'bricks'
    ? renderBuildSvg(info.build, {animate:happy, preview:info.build.pieces === 0, newPieces:1+(reward?.bonusSteps??0)})
    : renderPlant(info.garden.plant, info.garden.stage);
  const finished = happy && reward && info.full && celebrateOnRender;
  return `<div class="garden-art ${info.mode === 'bricks' ? 'brick-art' : ''} ${happy ? 'garden-grown' : ''}${finished?' reward-finished':''}">${showBuddy?`<div class="garden-friend">${buddy(happy)}</div>`:''}${art}</div>`;
}

function completedProjectScene(reward) {
  if (!reward?.added) return null;
  const scene=projectScene(reward.mode,reward.map??reward.completed);
  if (!reward.bonusSteps||reward.map) return scene;
  const earlier=projectScene(reward.mode,reward.completed-1-reward.bonusSteps);
  return {...scene,latest:scene.parts.slice(earlier.parts.length)};
}

function mountProjectPreview(container) {
  const canvas = container.querySelector('[data-project-preview]');
  if (!canvas) return;
  const id=canvas.dataset.projectPreview;
  const reward=view==='complete'&&completedReward?.mode===id?completedReward:null;
  const map=reward?.map??currentWorld(state,id);
  const scene = completedProjectScene(reward)??projectScene(id,map??Number(canvas.dataset.completed));
  const reveal=canvas.hasAttribute('data-reveal');
  const result=container===root&&view==='complete';
  if (!scene) return;
  const finale=result&&rewardDetails(completedReward).full;
  if (result) container.querySelector('[data-project-latest]')?.addEventListener('click',()=>{
    sounds.playBuild(scene,state.sound,{finale});
  });
  return mountProjectView(canvas.closest('.complete') || canvas.parentElement, scene, false, {
    closeUp:true, reveal, focusLatest:view==='complete'||Boolean(state.active), still:!reveal&&scene.parts.length>2200,
    finale,
    onActivity:result&&scene.world?sounds.activity:undefined,
  });
}

function mountDialogProjectPreview(dialog) {
  const dispose = mountProjectPreview(dialog);
  if (dispose) dialog.addEventListener('close', dispose, {once:true});
}

function projectProgress(info) {
  return isWorld(info.mode) ? msg('map.progress',{built:info.built??0,capacity:info.capacity??REGION_PLACES})
    : msg('map.steps',{completed:info.completed,total:info.total});
}

function projectAmbience(dialog, currentScene) {
  const button = dialog.querySelector('[data-project-ambience]');
  if (!button) return ()=>{};
  const events = new AbortController();
  let enabled = state.sound;
  let revision = 0;
  async function sync() {
    const turn = ++revision;
    const playing = enabled && dialog.open && !document.hidden;
    if (!playing) sounds.stopAmbience();
    const audible = playing && await sounds.startAmbience(currentScene());
    if (turn !== revision || !dialog.open) return;
    button.setAttribute('aria-pressed', String(audible));
    button.innerHTML = `${icon(audible ? 'sound' : 'muted')} Omgivelseslyd`;
    if (playing && !audible) enabled = false;
  }
  button.addEventListener('click', () => { enabled = !enabled; sounds.play('tap', state.sound); sync(); });
  document.addEventListener('visibilitychange', sync, {signal:events.signal});
  window.addEventListener('pageshow', sync, {signal:events.signal});
  dialog.addEventListener('close', () => {
    revision++;
    events.abort();
    if (!document.querySelector('.project-dialog[open]')) sounds.stopAmbience();
  }, {once:true});
  sync();
  return sync;
}

function showProject(id, demo = false, archivedMap = null, {galleryMap=null,place=null,fromCollection=galleryMap!==null} = {}) {
  const project = projectById(id);
  if (!project || (demo && CHANNEL !== 'preview')) return;
  let trail = demo && isWorld(id) ? [freshWorld()] : null;
  let completed = demo ? 0 : state.projects[id] || 0;
  let map = trail ? trail[0] : archivedMap || currentWorld(state,id);
  const progress = () => ({mode:id,...(map ? worldStatus(map) : {completed,total:project.total,full:completed===project.total})});
  let scene = projectScene(id, map || completed);
  const target=place===null?null:scene.landmarks?.[place];
  if (place!==null&&!target) return;
  const title=target?worldBuilding(id,place,map).name:project.name;
  const latest = () => `<strong>${scene.last ? escapeHtml(scene.last) : msg('map.ready')}</strong>`;
  const milestone = () => progress().full ? 'Hele byggeprosjektet er ferdig!'
    : scene.next ? `Neste byggesteg er «${scene.next}».`
    : isRegion(map) && map.progress===0 ? 'Bygg videre for å se hva som skjuler seg i tåken.' : 'Velg neste bygg før en ny runde.';
  const roundAction=scene.world&&!demo&&!archivedMap&&!fromCollection;
  showDialog(`<div class="dialog-header"><div><h2 id="dialog-title" tabindex="-1" autofocus>${escapeHtml(title)}</h2>
      <p data-demo-progress>${demo ? 'Byggedemo · ' : target ? project.name+' · ' : ''}${projectProgress(progress())}</p></div><button class="icon-button" data-action="close-dialog" aria-label="Lukk byggeprosjektet">${icon('close')}</button></div>
    ${fromCollection ? `<button class="secondary project-back" data-action="collection" data-project="${id}" ${galleryMap===null?'':`data-map="${galleryMap}"`} ${place===null?'':`data-place="${place}"`}>Tilbake til samlingen</button>` : ''}
    <div class="project-viewer${scene.world?' map-viewer':''}" data-drag-mode="${scene.world?'move':'rotate'}">
      ${demo ? `<div class="demo-controls" role="group" aria-label="Byggesteg i demoen">
        <button class="secondary" data-demo-step="-1" disabled aria-label="Forrige byggesteg"><span class="demo-back">${icon('arrow')}</span> Forrige</button>
        <p data-demo-status aria-live="polite">${latest()}</p>
        <button class="secondary" data-demo-step="1" aria-label="Neste byggesteg">Neste ${icon('arrow')}</button>
      </div>` : ''}
      ${demo ? `<div class="demo-shortcuts"><button class="secondary" data-demo-finish>Vis finalen</button></div>` : ''}
      <div class="project-map-stage">
        <canvas tabindex="0" role="img" aria-label="${escapeHtml(scene.world ? 'Kart: '+title : title+' i 3D')}" aria-describedby="project-instructions project-milestone"></canvas>
        ${scene.world?`<section class="map-info-card" data-map-info hidden aria-live="polite">
          <span class="eplo-avatar">${buddy()}</span>
          <div class="eplo-bubble"><small data-map-info-status></small><h3></h3><p data-map-info-description></p>
            <p><strong class="sr-only">Eplo</strong> <span data-map-info-story></span></p></div>
          <button class="icon-button" type="button" data-map-info-close aria-label="Lukk informasjonen">${icon('close')}</button>
        </section>`:''}
        ${scene.world ? `<div class="map-stage-actions">
          ${roundAction ? `<button type="button" class="icon-button map-full-start" data-action="map-start" aria-label="${startRoundLabel()}" title="${startRoundLabel()}">${icon('play')}</button>` : ''}
          <button type="button" class="icon-button" data-map-expand aria-label="Vis kartet i fullskjerm" aria-pressed="false" title="Fullskjerm">${icon('expand')}</button>
        </div>` : ''}
        ${demo ? mapEplo(projectCongratulations(id),true) : ''}
      </div>
      <div class="project-controls">
        ${scene.world?`<label class="map-inspect-label" hidden><span>${msg('map.buildings')}</span><select data-map-inspect aria-label="Velg bygg på kartet"></select></label>`:''}
        <div class="project-control-group" role="group" aria-label="Zoom og tilbakestill">
          <button class="secondary project-zoom" data-project-zoom=".8" aria-label="Zoom ut">−</button>
          <button class="secondary project-zoom" data-project-zoom="1.25" aria-label="Zoom inn">+</button>
          <button class="secondary" data-project-reset>${msg('map.overview')}</button>
        </div>
      </div>
      <p id="project-instructions">${scene.world?'Dra kartet for å flytte. Trykk på bygg, folk, kjøretøy og kartfunn.':'Dra for å rotere.'} Klyp<span class="project-desktop-hint"> eller bruk pluss og minus</span> for å zoome.</p>
      ${scene.world ? `<div class="project-atmosphere"><button class="secondary" data-project-ambience aria-pressed="false" ${state.sound ? '' : 'disabled'}>${icon('muted')} Omgivelseslyd</button>${state.sound ? '' : '<small>Lyden i appen er slått av.</small>'}</div>` : ''}
      ${!demo && !target && progress().completed ? `<div class="project-latest"><div><small>Siste byggesteg · ${progress().completed} av ${progress().total}</small>${latest()}</div><button class="secondary" data-project-latest>Vis siste steg</button></div>` : ''}
    </div>
    <p id="project-milestone" class="project-milestone">${escapeHtml(milestone())}</p>
    ${roundAction ? `<div class="project-round-action"><button type="button" class="primary" data-action="map-start">${startRoundLabel()}${icon('arrow')}</button></div>` : ''}
    ${trail ? '<button class="secondary demo-new-map" data-demo-new>Nytt demokart</button>' : ''}`, 'project-dialog', dialog => {
    const viewer = dialog.querySelector('.project-viewer');
    const selector=viewer.querySelector('[data-map-inspect]');
    const card=viewer.querySelector('[data-map-info]');
    const expand=viewer.querySelector('[data-map-expand]');
    const demoControls=viewer.querySelector('.demo-controls');
    const stage=viewer.querySelector('.project-map-stage');
    if (expand) {
      let fullScreen=false;
      let previousScroll=0;
      const viewport=window.visualViewport;
      const events=new AbortController();
      const syncViewport=()=>{
        if (!viewport?.width||!viewport.height) return;
        dialog.style.setProperty('--map-viewport-left',`${viewport.offsetLeft}px`);
        dialog.style.setProperty('--map-viewport-top',`${viewport.offsetTop}px`);
        dialog.style.setProperty('--map-viewport-width',`${viewport.width}px`);
        dialog.style.setProperty('--map-viewport-height',`${viewport.height}px`);
      };
      const stopPageGesture=event=>{ if (fullScreen&&event.cancelable) event.preventDefault(); };
      const showFullScreen=enabled=>{
        fullScreen=enabled;
        if (enabled) previousScroll=dialog.scrollTop;
        dialog.classList.toggle('project-fullscreen',enabled);
        if (enabled) syncViewport();
        if (demoControls) {
          if (enabled) stage.append(demoControls);
          else viewer.prepend(demoControls);
        }
        expand.innerHTML=icon(enabled?'collapse':'expand');
        expand.setAttribute('aria-pressed',String(enabled));
        expand.setAttribute('aria-label',enabled?msg('map.collapse'):msg('map.expand'));
        expand.title=enabled?msg('map.collapse'):'Fullskjerm';
        dialog.scrollTop=enabled?0:previousScroll;
        expand.focus({preventScroll:true});
      };
      expand.addEventListener('click',()=>showFullScreen(!fullScreen));
      for (const name of ['scroll','resize']) {
        viewport?.addEventListener(name,()=>{ if (fullScreen) syncViewport(); },{signal:events.signal});
      }
      for (const name of ['gesturestart','gesturechange','wheel']) {
        dialog.addEventListener(name,stopPageGesture,{passive:false,signal:events.signal});
      }
      dialog.addEventListener('close',()=>events.abort(),{once:true});
      dialog.addEventListener('cancel',event=>{
        if (!fullScreen) return;
        event.preventDefault();
        showFullScreen(false);
      });
    }

    let dispose,selection=null;
    const inspect=(index,{focus=false,playSound=false,discovery}={})=>{
      if (!card) return;
      const character=mapCharacterInfo(scene,index,discovery,chosenProfileName(profile));
      const site=typeof index==='number'?scene.sites?.[index]:null;
      const building=site&&worldBuilding(id,index,map);
      selection=building||character?index:null;
      card.hidden=!building&&!character;
      selector.value=building?String(index):'';
      dispose?.inspect?.(selection,{focus});
      if (character) {
        if (playSound) {
          sounds.play('select',state.sound);
          sounds.playCharacter(character.sound,character.voice,state.sound);
        }
        card.querySelector('h3').textContent=character.name;
        card.querySelector('[data-map-info-status]').textContent=character.status;
        card.querySelector('[data-map-info-description]').textContent='';
        card.querySelector('[data-map-info-story]').textContent=character.story;
        card.querySelector('.eplo-avatar').innerHTML=buddy();
        return;
      }
      if (!building) return;
      if (playSound) {
        sounds.play('select',state.sound);
        sounds.playBuilding(id,index,building.kind,state.sound);
      }
      card.querySelector('h3').textContent=building.name;
      card.querySelector('[data-map-info-status]').textContent=site.built?'På kartet':'Under bygging';
      card.querySelector('[data-map-info-description]').textContent=building.story?building.description:'';
      const story=card.querySelector('[data-map-info-story]');
      story.textContent=building.story||building.description;
      const avatar=card.querySelector('.eplo-avatar');
      avatar.innerHTML=buddy();
    };
    const updateBuildingList=()=>{
      if (!selector) return;
      const sites=Object.entries(scene.sites??{});
      const current=selector.value;
      selector.innerHTML='<option value="">Velg et bygg</option>'+sites.map(([index,site])=>{
        const {name}=worldBuilding(id,Number(index),map);
        return `<option value="${index}">${escapeHtml(name)}${site.built?'':' · under bygging'}</option>`;
      }).join('');
      selector.parentElement.hidden=sites.length===0;
      inspect(current===''?null:Number(current));
    };
    if (selector) {
      selector.addEventListener('change',()=>{
        inspect(selector.value===''?null:Number(selector.value),{focus:true,playSound:true});
      });
      card.querySelector('[data-map-info-close]').addEventListener('click',()=>{
        inspect(null);
        viewer.querySelector('.project-map-stage canvas')?.focus({preventScroll:true});
      });
      updateBuildingList();
      if (place!==null) inspect(place);
    }
    const mount = reveal => {
      dispose=mountProjectView(viewer, scene, true, {
        closeUp:!fromCollection && Boolean(progress().completed), reveal, demo, target, finale:progress().full,
        focusLatest:!demo&&!archivedMap&&!fromCollection&&(view==='complete'||Boolean(state.active)),
        onActivity:scene.world?sounds.activity:undefined,
        onInspect:selector?(index,context)=>inspect(index,{...context,playSound:true}):undefined,
      });
      if (selection!==null) dispose.inspect?.(selection);
    };
    mount(false);
    const syncAmbience=projectAmbience(dialog,()=>scene);
    viewer.querySelector('[data-project-latest]')?.addEventListener('click',()=>{
      sounds.playBuild(scene,state.sound,{finale:progress().full,tail:false});
    });
    if (demo) {
      const previous = viewer.querySelector('[data-demo-step="-1"]');
      const next = viewer.querySelector('[data-demo-step="1"]');
      const finish = viewer.querySelector('[data-demo-finish]');
      const finale = viewer.querySelector('[data-demo-finale]');
      const refresh = amount => {
        const info = progress();
        scene = projectScene(id, map || completed);
        updateBuildingList();
        previous.disabled = completed === 0;
        next.disabled = info.full;
        if (previous.disabled && document.activeElement === previous) next.focus({preventScroll:true});
        if (next.disabled && document.activeElement === next) previous.focus({preventScroll:true});
        dialog.querySelector('[data-demo-progress]').textContent = `Byggedemo · ${projectProgress(info)}`;
        viewer.querySelector('[data-demo-status]').innerHTML = `<small>Steg ${info.completed} av ${info.total}</small>${scene.finished ? `<strong>${escapeHtml(scene.finished)} er på plass!</strong>` : latest()}`;
        dialog.querySelector('#project-milestone').textContent = milestone();
        finale.hidden=!info.full;
        finish.textContent=info.full?msg('map.replayDemo'):msg('map.finishDemo');
        dispose();
        const canvas=viewer.querySelector('canvas');
        canvas.replaceWith(canvas.cloneNode());
        mount(amount > 0);
        syncAmbience();
        dialog.querySelector('.confetti')?.remove();
        if (amount>0&&(scene.world||scene.finished)) {
          if (scene.finished) dialog.insertAdjacentHTML('beforeend', confetti(true));
          sounds.playBuild(scene,state.sound,{finale:info.full,tail:false});
        } else {
          sounds.stopBuild();
          if (amount) sounds.play('build', state.sound);
        }
      };
      const goTo = (target,amount) => {
        if (trail) {
          while (!trail[target]) {
            const latest=trail.at(-1);
            const [choice]=worldBuildingOptions(id,latest);
            trail.push(worldAdvance(worldSelect(latest,choice,id),id));
          }
          map = trail[target];
        }
        completed = target;
        refresh(amount);
      };
      const step = amount => {
        const target=completed+amount;
        if (target<0||target>progress().total) return;
        goTo(target,amount);
      };
      previous.addEventListener('click', () => step(-1));
      next.addEventListener('click', () => step(1));
      finish.addEventListener('click',()=>goTo(progress().total,1));
      dialog.querySelector('[data-demo-new]')?.addEventListener('click', () => {
        map = freshWorld(Math.random, map);
        trail = [map];
        completed = 0;
        refresh(0);
      });
      dialog.addEventListener('keydown', event => {
        if (event.target.matches('canvas, select') || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        step(event.key === 'ArrowLeft' ? -1 : 1);
      });
    }
    dialog.addEventListener('close', () => {
      dispose();
      sounds.stopBuild({fade:true});
    }, {once:true});
  });
}

function nextBuildReward() {
  const build = state.rewardMode === 'bricks' && upcomingBuild(state.brickBuild);
  return build ? { mode:'bricks', build } : null;
}

function breakButtonLabel() {
  return breakKind(state.roundsCompleted) === 'memory' ? 'Spill Kims lek' : 'Spill pauseleken';
}

const BADGES = [
  { stars:3, name:'God start', tone:'leaf', shape:'M32 5 54 16v24L32 57 10 40V16Z',
    motif:'<path d="M32 44V29m0 8c-9 0-13-4-13-12 8 0 13 4 13 12Zm0-4c0-8 4-13 13-14 0 8-5 14-13 14Z" />' },
  { stars:10, name:'Tallbygger', tone:'sun', shape:'M32 5 42 8 52 15 57 28 53 42 44 53 32 57 20 53 11 42 7 28 12 15 22 8Z',
    motif:'<path d="M32 17 36.5 26.5 47 28 39.5 35.5 41 46 32 41 23 46l1.5-10.5L17 28l10.5-1.5Z" />' },
  { stars:25, name:'Talloppdager', tone:'sky', shape:'M32 3 59 31 32 59 5 31Z',
    motif:'<circle cx="32" cy="31" r="13" fill="none"/><path d="m39 23-4 12-11 4 4-12Z"/><circle cx="32" cy="31" r="1.7" />' },
  { stars:50, name:'Stjernesamler', tone:'rose', shape:'M32 4 40 9 50 9 53 18 60 25 56 34 56 44 47 48 41 56 32 54 23 56 17 48 8 44 8 34 4 25 11 18 14 9 24 9Z',
    motif:'<path d="M32 15q3 12 13 15-10 3-13 16-3-13-13-16 10-3 13-15Zm12 2 2.5 4.5L51 24l-4.5 2.5L44 31l-2.5-4.5L37 24l4.5-2.5ZM21 33l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" />' },
  { stars:100, name:'Tallmester', tone:'violet', shape:'M32 3 54 11v25c0 12-12 19-22 25C22 55 10 48 10 36V11Z',
    motif:'<path d="m18 25 8 6 6-11 6 11 8-6-4 16H22Z"/><path d="M23 45h18M32 13v3m-10 3 2 2m18-2-2 2" fill="none"/>' },
];

let badgeArtId = 0;
function badgeArt(badge) {
  const surface = `badge-surface-${++badgeArtId}`;
  return `<span class="badge-medal ${badge.tone}" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false">
    <defs><linearGradient id="${surface}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--medal-light)"/><stop offset=".37" stop-color="var(--medal-fill)"/>
      <stop offset=".75" stop-color="var(--medal-fill)"/><stop offset="1" stop-color="var(--medal-ribbon)"/>
    </linearGradient></defs>
    <path class="medal-ribbon" d="m19 37-7 25 11-5 6 5 4-19 4 19 6-5 10 5-7-25Z"/>
    <path class="medal-frame" fill="url(#${surface})" d="${badge.shape}"/><path class="medal-inset" d="${badge.shape}"/>
    <g class="medal-motif">${badge.motif}</g>
  </svg></span>`;
}

function badgeShelf(stars) {
  const earned = BADGES.filter(badge => stars >= badge.stars);
  const next = BADGES.find(badge => stars < badge.stars);
  if (!stars) return '';
  return `<section class="badge-shelf" aria-label="Utmerkelser">
    ${earned.length ? `<ul class="badge-list">${earned.map(badge =>
      `<li>${badgeArt(badge)}<strong>${badge.name}</strong><small>${badge.stars} stjerner</small></li>`).join('')}</ul>` : ''}
    ${next ? `<p class="shelf-note">Neste utmerkelse ved ${next.stars} stjerner</p>` : ''}
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

function playerMaps(id) {
  const history=state.worlds?.[id];
  return history?.length ? history : [currentWorld(state,id)];
}

function collectedMaps() {
  const ids = isWorld(state.rewardMode) ? [state.rewardMode,...WORLD_IDS.filter(id=>id!==state.rewardMode)] : WORLD_IDS;
  return ids.flatMap(id=>playerMaps(id).map((map,index)=>({id,index,map,places:worldCompletedPlaces(map)}))
    .filter(item=>item.places.length).reverse());
}

function collectedHeroes() {
  return Object.keys(PROJECTS).filter(id=>!isWorld(id)&&state.projects[id]>=PROJECTS[id].total);
}

function galleryMapsMarkup(maps,preferred) {
  if (!maps.length) return '';
  const open=maps.find(item=>item.id===preferred.project&&item.index===Number(preferred.map))??maps[0];
  return `<h3>Bygg og kart</h3><div class="map-gallery">${maps.map(({id,index,map,places})=>{
    const project=projectById(id), count=places.length;
    const name=`${project.name}${playerMaps(id).length>1?' · Kart '+(index+1):''}`;
    const full=worldStatus(map).full;
    return `<details class="map-gallery-card" data-theme="${id}" ${id===open.id&&index===open.index?'open':''}>
      <summary><span class="map-gallery-icon" aria-hidden="true">${project.icon}</span><span><strong>${name}</strong><small>${full?'Fullført kart · ':''}${count} ${count===1?'ferdig bygg':'ferdige bygg'}</small></span></summary>
      <div class="map-gallery-content"><button class="secondary map-gallery-open" data-action="gallery-map" data-project="${id}" data-map="${index}">Utforsk kartet ${icon('arrow')}</button>
      <div class="map-landmarks">${places.slice().reverse().map(place=>{
        const {name}=worldBuilding(id,place,map);
        return `<button class="map-landmark" data-action="gallery-map" data-project="${id}" data-map="${index}" data-place="${place}" aria-label="Finn ${escapeHtml(name)} på kartet">
          <canvas aria-hidden="true"></canvas><span>${escapeHtml(name)}</span></button>`;
      }).join('')}</div></div></details>`;
  }).join('')}</div>`;
}

const galleryArt=new WeakMap();
function mountGalleryArt(dialog) {
  galleryArt.get(dialog)?.();
  const tiles=dialog.querySelectorAll('.map-landmark, .hero-gallery-tile');
  if (!tiles.length) return;
  const previews=new Map();
  const observer=new IntersectionObserver(entries=>{
    for (const {target,isIntersecting} of entries) {
      if (!isIntersecting || previews.has(target)) continue;
      const {project,map,place}=target.dataset;
      const scene=isWorld(project)?worldBuildingPreview(project,Number(place),playerMaps(project)[Number(map)])
        :projectScene(project,state.projects[project]);
      if (scene) previews.set(target,mountProjectView(target,scene,false,{still:true}));
      observer.unobserve(target);
    }
  },{root:dialog});
  tiles.forEach(button=>observer.observe(button));
  const clean=()=>{
    observer.disconnect();
    previews.forEach(stop=>stop());
    galleryArt.delete(dialog);
    dialog.removeEventListener('close',clean);
  };
  galleryArt.set(dialog,clean);
  dialog.addEventListener('close',clean,{once:true});
}

function collectionShelf() {
  const bricks = state.brickBuild?.unlocked || [];
  const plants = state.garden.collection;
  const maps = collectedMaps();
  if (!bricks.length && !plants.length && !maps.length && !collectedHeroes().length) return '';
  const kind = state.rewardMode === 'bricks' ? 'brick' : 'plant';
  const recent = kind === 'brick'
    ? [...new Set(state.brickBuild.collection.slice().reverse())].slice(0, 3)
    : plants.slice(-3).reverse();
  return `<section class="collection-shelf" aria-label="Samlingen din">
    ${recent.length ? `<div class="collection-grid">${recent.map(id => collectionTile(kind, id)).join('')}</div>` : ''}
    <button class="secondary" data-action="collection">Se samlingen</button>
  </section>`;
}

function showCollection(preferred={}) {
  const bricks = state.brickBuild?.unlocked || [];
  const plants = state.garden.collection;
  const heroes = collectedHeroes();
  const dialog = document.querySelector('.collection-dialog');
  const content = `<div class="dialog-header"><h2 id="dialog-title" tabindex="-1">Samlingen din</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk samlingen">${icon('close')}</button></div>
    ${heroes.length ? `<h3>Superheltbygg</h3><div class="map-landmarks hero-gallery">${heroes.map(id=>`<button class="map-landmark hero-gallery-tile" data-action="gallery-hero" data-project="${id}" aria-label="Utforsk ${PROJECTS[id].name} i 3D"><canvas aria-hidden="true"></canvas><span>${PROJECTS[id].name}</span><small>Fullført bygg</small></button>`).join('')}</div>` : ''}
    ${galleryMapsMarkup(collectedMaps(),preferred)}
    ${bricks.length ? `<h3>Byggefigurer</h3><div class="collection-grid">${bricks.map(id => collectionTile('brick', id)).join('')}</div>` : ''}
    ${plants.length ? `<h3>Planter</h3><div class="collection-grid">${plants.map(id => collectionTile('plant', id)).join('')}</div>` : ''}`;
  if (dialog) {
    dialog.innerHTML = content;
    mountGalleryArt(dialog);
    dialog.querySelector(`[data-kind="${dialog.dataset.kind}"][data-id="${dialog.dataset.id}"]`)?.focus();
  } else showDialog(content, 'collection-dialog', dialog => {
    mountGalleryArt(dialog);
    const matching=[...dialog.querySelectorAll('[data-action="gallery-map"], [data-action="gallery-hero"]')].find(({dataset})=>
      dataset.project===preferred.project&&dataset.map===preferred.map&&dataset.place===preferred.place);
    matching?.scrollIntoView({block:'nearest'});
  });
}

function showCollectible(kind, id) {
  const item = collectible(kind, id);
  if (!item) return;
  const dialog = document.querySelector('.collection-dialog');
  const content = `<div class="dialog-header"><h2 id="dialog-title" tabindex="-1">${item.name}</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk stort bilde">${icon('close')}</button></div>
    <div class="collectible-large">${item.art(false)}</div>
    ${dialog ? '<button class="secondary" data-action="collection">Tilbake til samlingen</button>' : ''}`;
  if (dialog) {
    galleryArt.get(dialog)?.();
    dialog.dataset.kind = kind;
    dialog.dataset.id = id;
    dialog.innerHTML = content;
    dialog.querySelector('h2').focus();
  } else showDialog(content, 'collection-dialog');
}

function confetti(landmark = false) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return '';
  const colors = landmark ? ['#efbd57','#ffd993','#58a893','#86b2e6','#d993ac'] : ['#79a85d','#efbd57','#8bb6d5','#d99da5','#b5ce8b'];
  return `<div class="confetti${landmark ? ' landmark-confetti' : ''}" aria-hidden="true">${Array.from({ length: landmark ? 48 : 38 }, (_, i) => `<i style="--x:${(i*37)%100}%;--drift:${(i%2?1:-1)*(25+i%7*15)}px;--delay:${(landmark ? .83 : 0)+(i%9)*.055}s;--duration:${2.3+i%5*.2}s;--turn:${220+i*29}deg;background:${colors[i%colors.length]}"></i>`).join('')}</div>`;
}

const homeSurpriseProps = {
  juice: '<svg class="juice-glass" viewBox="0 0 46 68"><path d="m16 34 6-26 16-5" fill="none" stroke="#f4c6a0" stroke-width="4" stroke-linecap="round"/><path d="M5 27h35l-5 34q-1 4-5 4H15q-4 0-5-4Z" fill="#fff6dc" stroke="#385854" stroke-width="2"/><path d="M9 40q14-5 27 0l-3 20H13Z" fill="#eea744"/><path d="m13 33 3 22" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="36" cy="29" r="7" fill="#ffd474" stroke="#c77a43" stroke-width="2"/><path d="M36 25v8m-4-4h8" stroke="#fff0af" stroke-width="1.5"/></svg>',
  shades: '<svg class="sun-glasses" viewBox="0 0 71 31"><path d="M2 8h23q6 0 7 5h7q1-5 7-5h23v6l-3 2-2 8q-2 4-7 4h-8q-6 0-8-6l-3-6h-5l-3 6q-2 6-8 6h-8q-5 0-7-4l-2-8-3-2Z" fill="#213d41" stroke="#f8d671" stroke-width="2.6" stroke-linejoin="round"/><path d="m10 17 8-5m29 5 8-5" stroke="#8dbbc3" stroke-width="2.5" stroke-linecap="round"/></svg>',
  stars: `<div class="juggle-stars">${icon('star')}${icon('star')}${icon('star')}</div>`,
  winter: '<svg class="winter-gear" viewBox="0 0 142 132" stroke="#714752" stroke-width="2.4" stroke-linejoin="round"><path d="M28 42Q22 12 51 6c23-5 43 6 56 29l-12 10Z" fill="#bc6474"/><circle cx="51" cy="6" r="7.4" fill="#f5d9ac"/><path d="M31 28q30-17 60-11m-46 7 2-9m14 5 3-8m11 8 3-5" fill="none" stroke="#f1adab"/><path d="M28 34q42-11 77-8l4 13q-39-2-79 10Z" fill="#f5d9ac"/><path d="m37 35 2 9m9-12 2 9m10-12 2 9m10-11 2 9m9-10 2 9m9-10 2 9" stroke="#c79a7f"/><path d="M31 105q34 11 75-3l2 13q-45 15-78 2Z" fill="#bc6474"/><path d="M94 109q13 2 18 21l-14 1q-2-11-8-16Z" fill="#cf7884"/><path d="M98 124l11-1m-72-14 1 9m11-6 1 9m12-8 1 9" fill="none" stroke="#f5d9ac"/></svg>',
  yawn: '<span class="yawn-breath">zzz</span>',
  book: '<svg class="eplo-book" viewBox="0 0 84 52" stroke="#385854" stroke-width="2.4" stroke-linejoin="round"><path d="M4 10q19-6 38 5 19-11 38-5v35q-21-5-38 4-17-9-38-4Z" fill="#659b9b"/><path d="M7 6q20-6 35 7 15-13 35-7v33q-19-4-35 6-16-10-35-6Z" fill="#fff1cb"/><path d="M42 14v31m-27-27q9-1 20 5m-20 3q9-1 20 5m14-8q10-6 20-5m-20 13q10-6 20-5" fill="none"/></svg>',
};
const homeSurpriseCloud = '<svg class="eplo-puff" viewBox="0 0 142 132"><path d="M38 91a19 19 0 0 1-4-37 25 25 0 0 1 45-17 22 22 0 0 1 29 17 18 18 0 0 1-3 36Z" fill="#f3f1e8" stroke="#b5c4bc" stroke-width="2"/><path d="M46 66q3-11 14-11m20-4q11 0 14 10" fill="none" stroke="#d5ded3" stroke-width="3" stroke-linecap="round"/><circle cx="19" cy="42" r="6" fill="#e0e7dc"/><circle cx="122" cy="39" r="5" fill="#f3f1e8"/><circle cx="124" cy="99" r="7" fill="#e0e7dc"/></svg>';

function mountHomeSurprise() {
  const stage = root.querySelector('[data-home-surprise]');
  if (!stage) return;
  const acts = Object.keys(homeSurpriseProps);
  const pick = (options,previous) => {
    const choices = options.filter(option => option !== previous);
    return choices[Math.floor(Math.random() * choices.length)];
  };
  const cue = kind => {
    if (!document.hidden && !document.querySelector('dialog[open]')) sounds.play(kind,state.sound,{onlyWhileRunning:true});
  };
  let idleTimer, sceneTimer, previous;
  const showDefault = () => {
    stage.dataset.act = 'idle';
    stage.innerHTML = `<div class="eplo-act">${buddy()}</div>`;
  };
  const schedule = (delay=12000) => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(appear, delay);
  };
  const dismiss = () => {
    if (stage.dataset.act === 'idle' || stage.dataset.act === 'puff') return;
    clearTimeout(sceneTimer);
    stage.dataset.act = 'puff';
    stage.innerHTML = homeSurpriseCloud;
    cue('eplo-puff');
    sceneTimer = setTimeout(showDefault, 420);
  };
  function appear() {
    if (document.hidden || document.querySelector('dialog[open]')) { schedule(); return; }
    previous = pick(acts,previous);
    stage.dataset.act = previous;
    stage.innerHTML = `<div class="eplo-act">${buddy(previous !== 'yawn')}${homeSurpriseProps[previous]}</div>`;
    cue(`eplo-${previous}`);
    sceneTimer = setTimeout(() => { dismiss(); schedule(20000); }, 6400);
  }
  const activity = () => { dismiss(); schedule(); };
  const events = ['pointerdown','keydown','scroll','visibilitychange'];
  events.forEach(event => document.addEventListener(event,activity,{capture:true,passive:true}));
  schedule();
  return () => {
    clearTimeout(idleTimer);
    clearTimeout(sceneTimer);
    events.forEach(event => document.removeEventListener(event,activity,true));
  };
}

function renderHome() {
  const total = state.roundsCompleted;
  const stars = Array.from({ length: 5 }, (_, i) => icon('star', i < Math.min(total, 5) ? '' : 'empty-star')).join('');
  const next = nextBuildReward();
  const g = rewardDetails(next);
  const shelf = g.project ? projectProgress(g) : g.mode === 'bricks'
    ? `${g.build.pieces} av ${g.model.pieces.length} klosser på plass.`
    : `${g.garden.stage} av 5 vekststeg.`;
  const nextBuilding = g.map && worldBuilding(g.mode, g.building,g.map);
  const choose = g.map && g.building === null && !g.full;
  const firstBuild = g.map && g.completed === 0;
  const archives = g.map ? (state.worlds?.[g.mode] ?? []).slice(0,-1) : [];
  const cta = startRoundLabel(g);
  root.innerHTML = `<div class="app-shell">${header()}${updateBanner()}<main class="home">
    ${profile ? `<button class="profile-switch" data-action="show-profiles">${avatarArt(profile.avatar)}<strong>${escapeHtml(profile.name)}</strong><span>${msg('home.switchProfile')}</span></button>` : ''}
    <div class="home-reward">${rewardArt(false, next,{showBuddy:false})}<div class="home-surprise" data-home-surprise data-act="idle" aria-hidden="true"><div class="eplo-act">${buddy()}</div></div></div><p class="home-eyebrow">${g.label}</p>
    <h1 tabindex="-1">${firstBuild ? msg('home.startQuestion') : total % 2 ? msg('home.againQuestion') : msg('home.moreQuestion')}</h1>
    <p class="home-description">${msg('home.tasksWaiting', {count:state.active?.tasks.length??state.roundLength})}</p>
    <button class="primary" data-action="start">${cta}${icon('arrow')}</button>
    <p class="gentle-note">${state.active ? `Du har gjort ${state.active.index + (state.active.solved ? 1 : 0)} av ${state.active.tasks.length} oppgaver.` : nextBuilding ? `Neste byggesteg · ${escapeHtml(nextBuilding.name)}` : g.map && g.full ? msg('home.mapComplete') : choose ? msg('home.pickBuilding') : msg('home.together')}</p>
    ${g.map && g.full && !state.active ? `<button class="secondary secondary-cta" data-action="world-new">${msg('map.startNew')}</button>` : ''}
    <div class="star-shelf"><p class="shelf-label">${msg('home.progress')}</p><div class="stars" aria-label="${total} ${total === 1 ? 'stjerne' : 'stjerner'}">${stars}${total > 5 ? `<span>+${total - 5}</span>` : ''}</div><p class="shelf-note">${shelf}</p>${badgeShelf(total)}${collectionShelf()}
    ${archives.length ? `<details class="world-archives"><summary>Tidligere kart</summary><div>${archives.map((_,index)=>`<button class="secondary" data-action="project-archive" data-project="${g.mode}" data-archive="${index}">Kart ${index+1}</button>`).join('')}</div></details>` : ''}</div>
  </main></div>`;
}

function showWorldChoices(id, choices) {
  const map={...currentWorld(state,id),residenceName:chosenProfileName(profile)};
  const cards = choices.map(index => {
    const {name,description} = worldBuilding(id,index,map);
    return `<button class="world-option" data-action="world-choose" data-project="${id}" data-building="${index}">
      <canvas data-world-art="${index}" aria-hidden="true"></canvas><strong>${escapeHtml(name)}</strong><small>${escapeHtml(description)}</small>
    </button>`;
  }).join('');
  sounds.play('open', state.sound);
  showDialog(`<div class="dialog-header"><h2 id="dialog-title" tabindex="-1" autofocus>${map.progress===0?msg('map.firstQuestion'):msg('map.nextQuestion')}</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk byggevalget">${icon('close')}</button></div>
    <p class="world-choose-note">${msg('map.threeRounds')}</p><div class="world-options">${cards}</div>`, 'world-chooser', dialog => {
    const dispose = [...dialog.querySelectorAll('[data-world-art]')].map(canvas => mountProjectView(canvas.parentElement, worldBuildingPreview(id,Number(canvas.dataset.worldArt),map)));
    dialog.addEventListener('close', () => dispose.forEach(stop => stop()), {once:true});
  });
}

function startRoundLabel(info=rewardDetails()) {
  if (state.active) return msg('round.resume');
  if (state.focusBreakPending) return breakButtonLabel();
  if (info.map && info.building === null && !info.full) return info.completed === 0 ? msg('map.first') : msg('map.next');
  return msg('round.start');
}

function startRound() {
  if (!state.active && state.focusBreakPending) {
    openFocusBreak();
    return;
  }
  if (!state.active) {
    const id = state.rewardMode;
    const choices = isWorld(id) ? worldBuildingOptions(id,currentWorld(state,id),chosenProfileName(profile)) : [];
    if (choices.length) { showWorldChoices(id,choices); return; }
    focusGame = null;
    state = prepareReward(state);
    const seed = globalThis.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Date.now();
    state.active = createRound(state.level, seed, state.roundsCompleted === 0, {
      length:state.roundLength, mix:state.mix, grade:profile?.grade, history:state.history, alwaysShowVisuals:state.alwaysShowVisuals, preview:progressionPreview(state, profile?.grade),
    });
    save();
  }
  sounds.play('open',state.sound);
  view = 'round'; ui = makeUI(); announcer.textContent = ''; render(); goTop(); focusHeading();
}

function openFocusBreak() {
  sounds.play('open',state.sound);
  focusGame ||= createBreakGame(breakKind(state.roundsCompleted));
  view = 'focus-break';
  render(); goTop(); focusHeading();
}

function syncTestBreak() {
  const kind = Object.keys(TEST_BREAK_LINKS).find(key => TEST_BREAK_LINKS[key] === window.location.hash);
  if (!kind && !testBreakReturn) return;
  const dialog = document.querySelector('dialog');
  if (dialog) { dialog.close(); dialog.remove(); }
  if (kind) {
    testBreakReturn ||= { view, game:focusGame };
    focusGame = createBreakGame(kind);
    view = 'focus-break';
  } else {
    ({ view, game:focusGame } = testBreakReturn);
    testBreakReturn = null;
  }
  render(); goTop(); focusHeading();
  if (view === 'round' && ui.retry) showRetry(state.active.tasks[state.active.index]);
}

function exitTestBreak() {
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', pathname + search);
  syncTestBreak();
  if (view !== 'round') adultView();
}

function breakReadyButton() {
  return `<button class="primary" data-action="focus-hide">Jeg er klar ${icon('arrow')}</button>`;
}

function breakCheckButton(label) {
  return `<button class="primary" data-action="focus-check" ${scoreBreak(focusGame) ? '' : 'disabled'}>${label}</button>`;
}

function memoryBreak(game) {
  const { phase, study, choices, selected, checks } = game;
  const item = ({ icon, label }) => `<span class="focus-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
  if (phase === 'study') return {
    title:'Husk de fire bildene',
    description:checks ? 'Se godt på bildene en gang til. Ta den tiden du trenger.' : 'Se på bildene så lenge du vil. Gå videre når du er klar.',
    content:`<ul class="focus-cards" aria-label="Bilder å huske">${study.map(image => `<li>${item(image)}</li>`).join('')}</ul>${breakReadyButton()}`,
  };
  return {
    title:'Hvilke bilder så du?',
    description:'Velg de fire bildene du husker.',
    content:`<div class="focus-options" role="group" aria-label="Velg fire bilder">${choices.map((image, i) => `<button data-action="focus-answer" data-choice="${i}" aria-pressed="${selected.has(i)}">${item(image)}<span class="focus-check">${icon('check')}</span></button>`).join('')}</div>
      <p class="focus-count" aria-live="polite">${selected.size} av ${study.length} valgt</p>${breakCheckButton('Sjekk svarene')}`,
  };
}

function brickTile(color) {
  return renderPuzzleBrick(color,BRICK_COLORS[color]?.mark);
}

function brickBoard(game, interactive = false) {
  const colors = interactive ? game.placed : game.colors;
  const layout = puzzleBrickLayout(game.pattern.slots);
  const descriptions = game.pattern.slots.map(([x,z,level],i)=>
    `Lag ${level+1}, ${z?'bak':'foran'} til ${x?'høyre':'venstre'}: ${colors[i]?`${BRICK_COLORS[colors[i]].label.toLowerCase()} kloss`:'tom plass'}`);
  const slots = layout.slots.map(({i,x,y}) => {
    const color=colors[i],style=`style="--slot-x:${x}%;--slot-y:${y}%"`;
    if (!interactive) return `<div ${style}>${brickTile(color)}</div>`;
    return `<button type="button" data-action="break-slot" data-slot="${i}" ${color ? `data-brick-color="${color}"` : ''} aria-label="${descriptions[i]}" ${style}>${brickTile(color)}</button>`;
  }).join('');
  const label = interactive ? 'Plasser klossene' : `${game.pattern.name}. ${descriptions.join('. ')}`;
  return `<div class="brick-board" role="${interactive ? 'group' : 'img'}" aria-label="${label}"
    style="--board-ratio:${layout.ratio};--slot-width:${layout.width}%;--slot-height:${layout.height}%">${slots}</div>`;
}

function buildBreak(game) {
  if (game.phase === 'study') return {
    title:'Husk klossebygget',
    description:'Se hvor fargene er. Ta den tiden du trenger.',
    content:`${brickBoard(game)}${breakReadyButton()}`,
  };
  const placed = game.placed.filter(Boolean).length;
  return {
    title:'Hvor skal fargene være?',
    description:'Dra en kloss til en skygge. Du kan også trykke på klossen og så på plassen.',
    content:`${brickBoard(game, true)}<div class="brick-tray" role="group" aria-label="Klosser å velge mellom">${game.tray.map(color => {
      const used = game.placed.includes(color);
      return `<button type="button" data-action="break-pick" data-brick-color="${color}" aria-label="${BRICK_COLORS[color].label} kloss" aria-pressed="${color === game.picked}" ${used ? 'disabled' : ''}>${brickTile(color)}</button>`;
    }).join('')}</div>
      <p class="focus-count" aria-live="polite">${placed} av ${game.colors.length} plassert${game.picked ? ` · ${BRICK_COLORS[game.picked].label} valgt` : ''}</p>${breakCheckButton('Sjekk bygget')}`,
  };
}

function floorBoard(game, completed = false) {
  const { rows, columns, tiles } = game;
  const labels = Array.from({length:rows}, (_, row) => {
    const cells = tiles.slice(row * columns, (row + 1) * columns);
    return `Rad ${row + 1}: ${cells.map(filled => filled ? 'fylt' : 'tom').join(', ')}.`;
  });
  const label = completed ? `Ferdig gulv med ${rows * columns} klosser` : `${rows} rader med ${columns} ruter. ${labels.join(' ')}`;
  return `<div class="floor-board" style="--columns:${columns}" role="img" aria-label="${label}">${tiles.map(filled => `<span class="floor-tile ${filled ? 'floor-laid' : completed ? 'floor-new' : ''}" aria-hidden="true"></span>`).join('')}</div>`;
}

function floorBreak(game) {
  return {
    title:game.tiles.some(Boolean) ? 'Hvor mange klosser mangler?' : 'Hvor mange klosser trenger du?',
    description:game.checks ? 'Prøv å telle de tomme rutene én rad om gangen.' : 'Legg én kloss i hver tomme rute. Hvor mange trenger du for å gjøre gulvet ferdig?',
    content:`${floorBoard(game)}<div class="floor-answers" role="group" aria-label="Velg antall klosser">${game.choices.map(n => `<button type="button" data-action="floor-answer" data-choice="${n}" aria-label="${n} klosser" aria-pressed="${game.selected === n}">${n}</button>`).join('')}</div>${breakCheckButton('Sjekk svaret')}`,
  };
}

function breakResult(game) {
  const { kind, matched, phase, score } = game;
  const retry = phase === 'retry';
  const retryLabel = { memory:'Se bildene igjen', build:'Se bygget igjen', floor:'Prøv igjen' }[kind];
  const praise = { memory:'Du husket alle fire!', build:'Du bygde den!', floor:'Gulvet er ferdig!' }[kind];
  const invitation = { memory:'Vil du se på bildene igjen?', build:'Se på fargene en gang til.', floor:'Se på de tomme rutene en gang til.' }[kind];
  let detail = '';
  if (kind === 'memory') detail = `<strong>${score} av ${game.study.length} riktig</strong>`;
  if (kind === 'build') detail = retry ? `<strong>${score} av ${game.colors.length} på riktig plass</strong>` : brickBoard(game);
  if (kind === 'floor' && !retry) detail = `<strong>${game.answer} ${game.answer === 1 ? 'kloss' : 'klosser'} fylte de tomme rutene.</strong>${floorBoard(game, true)}`;
  const continueLabel = testBreakReturn ? testBreakReturn.view === 'round' ? 'Avslutt testen' : 'Til testlenkene' : 'Til oppgavene';
  return {
    title:matched ? praise : retry ? 'Godt forsøk!' : 'Bra at du prøvde!',
    description:retry ? invitation : testBreakReturn ? 'Du kan prøve en annen pauselek fra testmenyen.' : matched ? 'Klar for en runde med tall?' : 'Du får en ny pauselek senere.',
    content:`<div class="focus-result">${buddy(matched, retry)}${detail}</div>
      ${retry ? `<button class="primary" data-action="focus-retry">${retryLabel}</button>` : `<button class="primary" data-action="focus-continue">${continueLabel} ${icon('arrow')}</button>`}`,
  };
}

function renderFocusBreak() {
  const { kind, phase, matched } = focusGame;
  const renderGame = { memory:memoryBreak, build:buildBreak, floor:floorBreak }[kind];
  const { title, description, content } = phase === 'study' || phase === 'guess' ? renderGame(focusGame) : breakResult(focusGame);
  const party = matched && celebrateOnRender ? confetti() : '';
  celebrateOnRender = false;
  const exit = testBreakReturn
    ? phase === 'done' ? '' : '<button class="text-button" data-action="test-break-exit">Avslutt testen</button>'
    : '<button class="text-button" data-action="home">Ferdig for nå</button>';
  root.innerHTML = `<div class="app-shell">${header(!testBreakReturn)}${updateBanner()}<main class="focus-game">
    <p class="home-eyebrow">${testBreakReturn ? 'Test av pauselek' : 'Pauselek'} · ${BREAK_TITLES[kind]}</p>
    <h1 tabindex="-1">${title}</h1><p>${description}</p>${content}
    ${exit}
  </main></div>${party}`;
}

function selectFocusImage(button) {
  const index = Number(button.dataset.choice);
  const { selected, study, choices } = focusGame;
  if (!choices[index]) return;
  if (selected.has(index)) selected.delete(index);
  else if (selected.size < study.length) selected.add(index);
  else return;
  sounds.play('select', state.sound);
  button.setAttribute('aria-pressed', String(selected.has(index)));
  root.querySelector('.focus-count').textContent = `${selected.size} av ${study.length} valgt`;
  root.querySelector('[data-action="focus-check"]').disabled = selected.size !== study.length;
}

function checkFocusBreak() {
  const result = scoreBreak(focusGame);
  if (!result) return;
  focusGame.checks++;
  focusGame.score = result.score;
  focusGame.matched = result.score === result.total;
  const done = focusGame.matched || focusGame.checks >= BREAK_ATTEMPTS;
  focusGame.phase = done ? 'done' : 'retry';
  if (done && !testBreakReturn) {
    state.focusBreakPending = false;
    save();
  }
  if (focusGame.matched) {
    celebrateOnRender = true;
    feedback('memory', [15,42,20]);
  } else if (!done) feedback('retry', 11);
  render(); goTop(); focusHeading();
}

function renderBreakChoice(selector) {
  render();
  root.querySelector(selector)?.focus({ preventScroll:true });
}

function placeBrick(color, slot) {
  if (placeBreakBrick(focusGame, color, slot)) {
    sounds.play('build',state.sound);
    renderBreakChoice(`[data-slot="${slot}"]`);
  }
}

function selectBuildSlot(slot) {
  const { picked, placed } = focusGame;
  if (picked) placeBrick(picked, slot);
  else if (placed[slot]) {
    placed[slot] = null;
    renderBreakChoice(`[data-slot="${slot}"]`);
  }
}

function canBuild() {
  return view === 'focus-break' && focusGame.kind === 'build' && focusGame.phase === 'guess';
}

function brickDropTarget(event) {
  return document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-action="break-slot"]');
}

document.addEventListener('pointerdown', event => {
  if (!canBuild() || !event.isPrimary || event.button !== 0) return;
  ignoredBrickClick = null;
  const source = event.target.closest('[data-brick-color]:not(:disabled)');
  if (!source) return;
  brickDrag = { source, id:event.pointerId, x:event.clientX, y:event.clientY, ghost:null, target:null };
  source.setPointerCapture(event.pointerId);
});

document.addEventListener('pointermove', event => {
  const drag = brickDrag;
  if (!drag || drag.id !== event.pointerId || !canBuild()) return;
  if (!drag.ghost) {
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8) return;
    drag.ghost = document.createElement('div');
    drag.ghost.className = 'brick-drag';
    drag.ghost.setAttribute('aria-hidden', 'true');
    drag.ghost.innerHTML = brickTile(drag.source.dataset.brickColor);
    document.body.append(drag.ghost);
  }
  drag.ghost.style.left = `${event.clientX}px`;
  drag.ghost.style.top = `${event.clientY}px`;
  const target = brickDropTarget(event);
  if (target !== drag.target) {
    drag.target?.classList.remove('brick-drop-target');
    target?.classList.add('brick-drop-target');
    drag.target = target;
  }
});

function endBrickDrag(event) {
  const drag = brickDrag;
  if (!drag || drag.id !== event.pointerId) return;
  brickDrag = null;
  if (!drag.ghost) return;
  drag.ghost.remove();
  drag.target?.classList.remove('brick-drop-target');
  ignoredBrickClick = drag.source;
  if (event.type !== 'pointerup' || !canBuild()) return;
  const target = brickDropTarget(event);
  if (target) placeBrick(drag.source.dataset.brickColor, Number(target.dataset.slot));
}
document.addEventListener('pointerup', endBrickDrag);
document.addEventListener('pointercancel', endBrickDrag);
document.addEventListener('lostpointercapture', endBrickDrag);

function taskTitle(t) {
  if (curriculumTopic(t.type)) return t.title;
  if (t.type === 'remove' || t.type === 'subtract') return msg('task.remove',{amount:t.b});
  if (t.type === 'ten') return msg('task.ten');
  if (t.type === 'missing') return msg('task.missing');
  if (t.type === 'multiply') return msg('task.multiply');
  if (t.type === 'divide') return msg('task.divide');
  if (t.type === 'count') return countStep(t) < 0 ? msg('task.missing') : msg('task.count');
  if (t.type === 'place') return msg('task.place');
  if (t.type === 'shift') return msg(t.b>0?'task.add':'task.remove',{amount:msg(Math.abs(t.b)===100?'task.hundred':'task.tenUnit')});
  return msg('task.calculate');
}
function equationText(t) {
  if (curriculumTopic(t.type)) return t.hints[2];
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
  if (curriculumTopic(t.type)) return t.prompt ? `<p class="curriculum-prompt">${escapeHtml(t.prompt)}</p>` : '';
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
function quantity(n, interactive = false, label = partsText(n)) {
  if (n <= 20) {
    const groups = Math.floor(n / 10), ones = n % 10;
    return `<div class="quantity" ${interactive ? '' : `role="img" aria-label="${label}"`}>${Array.from({ length: groups }, (_, i) => `<div role="img" aria-label="Én tier">${dotGroup(10, i * 10, false)}</div>`).join('')}${ones ? dotGroup(ones, groups * 10, interactive, true) : ''}</div>`;
  }
  const h = Math.floor(n / 100), tens = Math.floor(n / 10) % 10, ones = n % 10;
  return `<div class="quantity compact" role="${interactive ? 'group' : 'img'}" aria-label="${label}">${Array.from({ length: h }, () => '<span class="hundred-tile" aria-hidden="true">100</span>').join('')}${Array.from({ length: tens }, () => '<span class="ten-tile" aria-hidden="true">10</span>').join('')}${ones ? dotGroup(ones, h * 100 + tens * 10, interactive, true) : ''}</div>`;
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

function curriculumVisual(model,solved) {
  if (model.kind==='numberLine') {
    const {start,middle,end,missing}=model;
    const low=Math.min(start,end),span=Math.abs(end-start),sign=end>start?'+':'−';
    const x=n=>28+(n-low)*274/span;
    const jump=(from,to,hide)=>{
      const a=x(from),b=x(to),tip=(a+b)/2,side=Math.sign(b-a);
      const label=hide?'?':sign+Math.abs(to-from);
      return `<path d="M${a} 66 Q${tip} -5 ${b} 66 m${-10*side} -4 ${10*side} 4 ${-2*side} -11" /><text x="${tip}" y="25">${label}</text>`;
    };
    const endLabel=missing||solved?end:'?';
    const spokenDirection=end>start?'fram':'tilbake';
    const description=`Start på ${start}. Hopp ${Math.abs(middle-start)} ${spokenDirection} til ${middle}. ${missing&&!solved?`Hvor langt er hoppet til ${end}?`:`Hopp ${Math.abs(end-middle)} ${spokenDirection}. ${solved?`Du lander på ${end}.`:'Hvor lander du?'}`}`;
    return `<svg class="jump-line" viewBox="0 0 330 108" role="img" aria-label="${description}">
      <path class="jump-axis" d="M12 70H318"/>${jump(start,middle,false)}${jump(middle,end,missing&&!solved)}
      ${[[start,start],[middle,middle],[end,endLabel]].map(([n,label])=>`<circle cx="${x(n)}" cy="70" r="4.5"/><text class="jump-stop${label==='?'?' jump-unknown':''}" x="${x(n)}" y="98">${label}</text>`).join('')}
    </svg>`;
  }
  if (model.kind==='money') {
    const piece=(value,extra='')=>`<span class="money-piece ${value>=50?'money-note':'money-coin'} ${extra}" data-money-value="${value}"><strong>${value}</strong><small>kr</small></span>`;
    const label=model.pieces.map(value=>`${value} kroner`).join(', ');
    const exchange=model.exchange?` Veksles til ${model.exchange}-kroner.`:'';
    return `<div class="money-visual" role="img" aria-label="${label}.${exchange}">
      <span class="money-pile" aria-hidden="true">${model.pieces.map(value=>piece(value)).join('')}</span>
      ${model.exchange?`<span class="money-exchange" aria-hidden="true">${icon('arrow')}${piece(model.exchange)}<strong>× ?</strong></span>`:''}
    </div>`;
  }
  if (model.kind === 'grid') {
    const total = model.columns * model.rows;
    const label = model.split ? `${model.split} grønne og ${model.filled-model.split} gule brikker` : model.style === 'dots' ? `${model.filled} brikker`
      : model.style === 'bar' ? `${total} like deler. ${model.filled} er grønne.` : `${model.rows} rader med ${model.columns} ruter i hver`;
    const cells = Array.from({ length:total }, (_, i) => `<span aria-hidden="true" class="${i < model.filled ? model.split && i >= model.split ? 'filled alternate' : 'filled' : ''}"></span>`).join('');
    return `<div class="curriculum-grid ${model.style}" style="--columns:${model.columns}" role="img" aria-label="${label}">${cells}</div>`;
  }
  if (model.kind === 'shape') {
    const points = Array.from({ length:model.sides }, (_, i) => {
      const angle = i * 2 * Math.PI / model.sides - Math.PI / 2;
      return `${60 + 43 * Math.cos(angle)},${53 + 43 * Math.sin(angle)}`;
    }).join(' ');
    return `<svg class="curriculum-shape" viewBox="0 0 120 106" role="img" aria-label="Figur med ${model.sides} rette sider"><polygon points="${points}"/></svg>`;
  }
  if (model.kind === 'point') {
    const ticks = Array.from({ length:5 }, (_, i) => {
      const x = 23 + i*24, y = 117 - i*24;
      return `<path d="M23 ${y}H120 M${x} 117V20"/><text x="${x}" y="134">${i}</text>${i ? `<text x="11" y="${y+4}">${i}</text>` : ''}`;
    }).join('');
    return `<svg class="curriculum-point" viewBox="0 0 145 145" role="img" aria-label="Punktet er ${model.x} ruter til høyre og ${model.y} ruter opp fra origo.">
      ${ticks}<path class="coordinate-axes" d="M23 10V117H131m-104-102-4-5-4 5m107 97 5 5-5 5"/>
      <text x="134" y="134">x</text><text x="9" y="12">y</text><circle cx="${23+model.x*24}" cy="${117-model.y*24}" r="5"/></svg>`;
  }
  if (model.kind === 'table') {
    const headers = model.headers.map(text => `<th scope="col">${escapeHtml(text)}</th>`).join('');
    const rows = model.cells.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(String(cell).replace('-', '−'))}</td>`).join('')}</tr>`).join('');
    return `<table class="curriculum-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  }
  return '';
}

function renderVisual(t, solved) {
  const stage = ui.retry ? ui.retryStage : hintStage();
  if (curriculumTopic(t.type)) return t.visual ? `<div class="visual-card curriculum-visual${t.visual.kind==='numberLine'?' line-visual':''}">${curriculumVisual(t.visual,solved)}</div>` : '';
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
  } else if (t.type === 'place') {
    const showParts = stage >= 2 || solved;
    const blocks = [100,10,1].flatMap(value => Array(Math.floor(t.n/value)%10).fill(value)).join(' pluss ');
    html = quantity(t.n, false, showParts ? partsText(t.n) : blocks);
    caption = showParts ? partsText(t.n) : 'Hvor mye er brikkene verdt til sammen?';
  } else {
    const interactive = ['remove', 'subtract'].includes(t.type) && !solved && t.b <= t.n % 10;
    const shown = solved && ['remove', 'subtract', 'shift'].includes(t.type) ? t.answer : t.n;
    html = quantity(shown, interactive);
    if (interactive) caption = ui.removed.size ? `Du har tatt bort ${ui.removed.size}.` : 'Du kan trykke på de løse brikkene.';
    else if (t.type === 'subtract' && !solved) caption = 'Du må ta bort fra en tier også.';
    else if (t.n > 20) caption = partsText(shown);
    else caption = solved ? `${shown} igjen.` : 'Se på tierne og enerne.';
  }
  return `<div class="visual-card">${html}<p class="visual-caption" id="visual-caption">${caption}</p></div>`;
}

function renderRound() {
  const r = state.active;
  if (!r || r.index >= r.tasks.length) { view = 'home'; renderHome(); return; }
  const t = r.tasks[r.index];
  const done = r.index + (r.solved ? 1 : 0);
  const stage = ui.retry ? ui.retryStage : hintStage();
  const length = r.tasks.length;
  const progress = Array.from({ length }, (_, i) => `<span class="step ${i < done ? 'done' : i === done ? 'current' : ''}"></span>`).join('');
  let feedback;
  if (r.solved) {
    const messages = [msg('round.praise1'), msg('round.praise2'), msg('round.praise3'), msg('round.praise4'), msg('round.praise5'), msg('round.praise6'), msg('round.praise7'), msg('round.praise8'), msg('round.praise9'), msg('round.praise10'), msg('round.praise11'), msg('round.praise12')];
    const message=messages[(state.roundsCompleted*5+r.index)%messages.length];
    feedback = `<div class="feedback-row">${icon('check', 'feedback-icon')}<div><p class="feedback-title">${message}</p><p class="feedback-detail">${escapeHtml(equationText(t))}</p></div></div><button class="primary" data-action="next">${r.index === length - 1 ? msg('round.complete') : msg('round.next')}${icon('arrow')}</button>`;
  } else feedback = `<p class="idle-note">${msg('round.takeTime')}</p>`;
  root.innerHTML = `<div class="round-shell"><header class="round-header"><button class="icon-button" data-action="pause" aria-label="Ta en pause">${icon('close')}</button><div class="progress-wrap"><div class="progress-text"><span>${CHANNEL === 'preview' ? betaMark() : 'Din lille runde'}</span><strong>${msg('round.position', {current:r.index + 1,total:length})}</strong></div><div class="progress-track" role="progressbar" aria-label="Fullførte oppgaver" aria-valuemin="0" aria-valuemax="${length}" aria-valuenow="${done}">${progress}</div></div>${soundButton()}</header>
    <div class="task-scroll"><main class="task ${t.mode === 'input' && !r.solved ? 'with-keypad' : ''}"><div class="companion-strip"><div class="companion-stage"><div class="companion-buddy">${buddy(r.solved, ui.retry)}</div>
    <p><span class="companion-message">${r.solved ? msg('round.solved') : r.attempts[r.index] ? msg('round.retry') : msg('round.unsolved')}</span><small class="perfect-progress" hidden></small></p><span class="companion-sparks" aria-hidden="true"></span></div></div><h1 tabindex="-1">${escapeHtml(taskTitle(t))}</h1>
    ${equation(t, r.solved)}${renderVisual(t, r.solved)}
    ${!r.solved ? `<button class="help-button" data-action="help" ${stage === 3 ? 'disabled' : ''}>${icon('help')}${stage === 3 ? msg('round.showHelp') : stage ? msg('round.moreHelp') : msg('round.help')}</button>` : ''}
    ${stage && !r.solved ? `<div class="hint" id="hint-panel"><span class="eplo-hint-name">Eplo</span>${escapeHtml(hintText(t))}</div>` : ''}
    ${t.mode === 'input' ? r.solved ? `<div class="entered-correct" aria-label="Svaret ${t.answer} er riktig">${t.answer} ${icon('check')}</div>` : keypad() : renderAnswers(t, r.solved)}
    <div class="feedback-area">${feedback}</div></main></div></div>`;
}

function renderAnswers(t, solved) {
  const labels = curriculumTopic(t.type) ? t.labels : null;
  const wide = labels?.some(label => label.length > 4);
  const buttons = t.choices.map(c => {
    const label = escapeHtml(String(labels?.[c] ?? c));
    const tried = ui.wrong.includes(c), correct = solved && c === t.answer;
    return `<button class="answer ${correct ? 'correct' : ''} ${tried ? 'tried' : ''}" data-answer="${c}" ${solved || ui.retry || tried ? 'disabled' : ''} aria-label="Svar ${label}${tried ? ', prøvd' : correct ? ', riktig' : ''}">${label}${tried ? '<span class="answer-cross" aria-hidden="true">×</span>' : ''}</button>`;
  }).join('');
  return `<div class="answers ${wide ? 'wide-answers' : ''}" role="group" aria-label="Velg svar">${buttons}</div>`;
}

function renderComplete() {
  const g = rewardDetails(completedReward);
  const stage = completedProjectScene(completedReward);
  const projectStep = stage?.last;
  const buildStory=g.map&&projectStep ? constructionStory(g.mode,stage.latestTarget?.kind,stage.finished?3:g.phase||1,g.map.seed,g.completed) : '';
  const finishedProject = g.project && g.full && g.added;
  const length = state.history.at(-1)?.length ?? ROUND_LENGTH;
  const bonusSteps=completedReward?.bonusSteps??0;
  const bonus=bonusSteps?msg(g.map?'reward.bonus.map':g.mode==='plant'?'reward.bonus.plant':
    bonusSteps===1?'reward.bonus.brick':'reward.bonus.bricks',{count:bonusSteps}):'';
  const message = g.project
    ? `${g.label}${g.full ? ' er ferdig!' : ''}<br>${projectProgress(g)}.`
    : g.mode === 'bricks' ? g.full ? `${g.model.done}<br>Fem klosser, ett flott bygg!` : `${bonusSteps?'To nye klosser':'En ny kloss'} på plass!<br>${g.build.pieces} av ${g.model.pieces.length} klosser.` : `${g.label}<br>${g.garden.stage} av 5 vekststeg.`;
  const earnedBrick = g.mode === 'bricks' || g.added;
  const rewardCount=earnedBrick?1+bonusSteps:1;
  const earnedLabel=g.map?(rewardCount===1?'Et nytt byggesteg':`${rewardCount} nye byggesteg`)
    :earnedBrick?(rewardCount===1?'En ny kloss':`${rewardCount} nye klosser`):'En ny stjerne';
  const party = celebrateOnRender ? confetti(Boolean(stage?.finished)) : '';
  const newBadge = BADGES.find(badge => badge.stars === state.roundsCompleted);
  const badge = newBadge ? `<div class="new-badge">${badgeArt(newBadge)}<span>Ny utmerkelse <strong>${newBadge.name}</strong></span></div>` : '';
  const next = g.mode === 'bricks' && upcomingBuild(g.build);
  const preview = next ? `<div class="next-build-card">${renderBuildSvg(next, {mini:true, preview:true})}<div>Neste bygg<strong>Hva tror du det blir?</strong></div></div>` : '';
  const latest = projectStep ? `<div class="project-latest result-latest${stage.finished ? ' landmark-complete' : ''}"><div><small>${stage.finished&&g.map ? 'Ferdig på kartet' : finishedProject ? 'Bygget er fullført' : 'Nytt byggesteg'} · ${g.completed} av ${g.total}</small><strong>${escapeHtml(g.map&&stage.finished ? stage.finished+' er på plass!' : projectStep)}</strong>${buildStory ? `<p class="build-story">${escapeHtml(buildStory)}</p>` : ''}</div><button class="secondary" data-project-latest>Vis igjen</button></div>` : '';
  const mapIndex=g.map?playerMaps(g.mode).length-1:null;
  const inCollection=g.project&&(g.full||g.map&&stage?.finished);
  const gallery=inCollection ? `<button class="secondary result-gallery" data-action="collection" data-project="${g.mode}" ${g.map?`data-map="${mapIndex}"`:''}>${finishedProject?'Se '+(g.map?'kartet':'superhelten')+' i samlingen':'Se i samlingen'}${finishedProject?icon('arrow'):''}</button>` : '';
  const newMap = g.map && g.full && g.mode === state.rewardMode && !state.focusBreakPending;
  const again = newMap ? msg('map.startNew') : state.focusBreakPending ? breakButtonLabel() : msg('round.repeat');
  const headline=finishedProject?`${g.label} er ferdig!`:'Du klarte runden!';
  root.innerHTML = `<div class="app-shell">${header()}${updateBanner()}<main class="complete"><div class="completion-garden ${g.project ? 'completion-project' : g.mode === 'bricks' ? 'completion-build' : ''}">${rewardArt(true,completedReward)}${finishedProject&&g.map?mapEplo(projectCongratulations(g.mode)):''}<span class="earned-star" aria-label="${earnedLabel}">${icon(earnedBrick ? 'brick' : 'star')} +${rewardCount}</span></div><h1 tabindex="-1">${headline}</h1>${bonus?`<p class="completion-bonus">${icon(g.mode==='plant'?'sprout':'brick')}<span>${escapeHtml(bonus)}</span></p>`:''}${finishedProject&&!g.map?projectCongratulations(g.mode):''}${latest}${(!projectStep || g.full&&!finishedProject) ? `<p>${message}</p>` : ''}<div class="completion-steps" aria-label="${length} oppgaver fullført">${Array.from({ length }, () => `<span class="completion-dot">${icon('check')}</span>`).join('')}</div><p class="gentle-note">Stjerne nummer ${state.roundsCompleted} er din.</p>${badge}${preview}<button class="primary" data-action="${newMap ? 'world-new' : 'again'}">${again}${icon('again')}</button><button class="secondary secondary-cta" data-action="home">Ferdig for nå${icon('check')}</button>${gallery}</main></div>${party}`;
  celebrateOnRender = false;
}

let renderedScreen;
function render() {
  const taskScroll = root.querySelector('.task-scroll')?.scrollTop ?? 0;
  document.documentElement?.setAttribute('data-season', seasonForDate());
  if (renderedScreen==='complete'&&view!=='complete') {
    sounds.stopBuild();
    sounds.stopAmbience();
  }
  disposeProjectPreview?.();
  disposeHomeSurprise?.();
  if (view === 'round') renderRound();
  else if (view === 'complete') renderComplete();
  else if (view === 'focus-break') renderFocusBreak();
  else if (view === 'onboarding') renderOnboarding();
  else renderHome();
  disposeProjectPreview = mountProjectPreview(root);
  disposeHomeSurprise = view === 'home' ? mountHomeSurprise() : null;
  const screen = view === 'round' ? `round-${state.active?.id}-${state.active?.index}`
    : view === 'focus-break' ? `${view}-${focusGame.kind}-${focusGame.phase}` : view;
  if (view === 'round' && taskScroll && renderedScreen === screen) root.querySelector('.task-scroll').scrollTop = taskScroll;
  if (renderedScreen !== screen && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.querySelector(view === 'round' ? '.task' : 'main')?.animate?.(
      [{transform:'translateY(4px)'},{transform:'translateY(0)'}],
      {duration:200, easing:'cubic-bezier(.18,.65,.32,1)'});
  }
  renderedScreen = screen;
}

function feedback(kind, pulse) {
  if (state.haptics) navigator.vibrate?.(pulse);
  sounds.play(kind, state.sound);
}
function playSuccess() { sounds.play('success', state.sound); }
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
  sounds.stopBuild({fade:true});
  sounds.stopAmbience();
  document.querySelector('dialog')?.close(); document.querySelector('dialog')?.remove();
  const lastFocus = document.activeElement;
  const d = document.createElement('dialog');
  d.className = css;
  d.setAttribute('aria-labelledby', 'dialog-title');
  d.innerHTML = content;
  const title = d.querySelector('#dialog-title');
  if (title) {
    title.tabIndex = -1;
    title.setAttribute('autofocus','');
  }
  document.body.append(d);
  d.addEventListener('close', () => {
    if (!d.isConnected) return;
    const wasAdult = Boolean(d.querySelector('#sound-setting'));
    d.remove();
    if (wasAdult && view !== 'round' && view !== 'onboarding') { render(); root.querySelector('[data-action="adult"]')?.focus({ preventScroll: true }); }
    else if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  });
  d.showModal();
  afterOpen?.(d);
}
function closeDialog() { document.querySelector('dialog')?.close(); }

const pauseEncouragements = [msg('pause.encourage1'), msg('pause.encourage2'), msg('pause.encourage3'), msg('pause.encourage4')];
let pauseVisits=0;

function pauseProgress(info) {
  if (info.project) {
    if (info.full) return `${info.label} er ferdig! Du finner prosjektet i samlingen din.`;
    if (info.map) {
      const building=worldBuilding(info.mode,info.building,info.map);
      const count=info.built ? `Du har gjort ferdig ${info.built} av ${info.capacity} bygg.` : '';
      if (building) return [count,`Neste steg er på ${building.name}.`].filter(Boolean).join(' ');
      return count||`Vi kan bygge videre på ${info.label}.`;
    }
    return `Du har gjort ${msg('map.steps', {completed:info.completed,total:info.total})} på ${info.label}.`;
  }
  if (info.mode==='bricks') {
    const count=info.build.completed;
    return count ? `Du har bygd ${count===1?'én klossefigur':`${count} klossefigurer`}!` :
      `${info.build.pieces} av ${info.model.pieces.length} klosser er på plass.`;
  }
  const count=Math.max(info.garden.collection.length,Math.floor(state.plantRounds/5));
  return count ? `Du har dyrket ${count===1?'én plante':`${count} planter`}!` :
    `Planten din er på vekststeg ${info.garden.stage} av 5.`;
}

function eploGreeting(name=profile?.name) {
  return name&&!/^Spiller(?: \d+)?$/u.test(name)?`Hei igjen, ${name}!`:'Hei igjen!';
}

function showPause() {
  sounds.play('open', state.sound);
  const info=rewardDetails();
  const preview=info.project&&info.completed>0?rewardArt():'';
  const hello=eploGreeting();
  const encouragement=pauseEncouragements[pauseVisits++%pauseEncouragements.length];
  const note=eploNote(`${hello} ${pauseProgress(info)} ${encouragement}`);
  showDialog(`<h2 id="dialog-title" tabindex="-1" autofocus>${msg('pause.title')}</h2>
    ${preview&&isWorld(info.mode)?`<div class="project-map-stage">${preview}${mapEplo(note)}</div>`:`${mapEplo(note,false,true)}${preview}`}<p class="pause-context">${msg('pause.later')}</p>
    <button class="primary" data-action="close-dialog">Fortsett runden</button><button class="secondary secondary-cta" data-action="pause-home">Ta en pause</button>${CHANNEL === 'preview' ? '<button class="text-button beta-danger" data-action="beta-abort-round">Avbryt runden</button>' : ''}`, preview ? 'pause-dialog pause-dialog--map' : 'pause-dialog', preview ? mountDialogProjectPreview : undefined);
}

function confirmBetaAbort() {
  if (CHANNEL !== 'preview' || !state.active) return;
  showDialog(`<h2 id="dialog-title" tabindex="-1" autofocus>Avbryte runden?</h2>
    <p>Svarene i denne runden slettes. Neste runde begynner på første oppgave.</p>
    <button class="primary" data-action="close-dialog">Behold runden</button>
    <button class="secondary secondary-cta beta-danger" data-action="beta-confirm-abort">Ja, avbryt runden</button>`, 'pause-dialog');
}

function confirmBetaResetProject() {
  if (CHANNEL !== 'preview') return;
  const selected = projectById(state.rewardMode) ? state.rewardMode : 'city';
  const abortNote = id => state.active && state.rewardMode === id ? 'Den påbegynte runden avbrytes også.' : '';
  showDialog(`<div class="dialog-header"><h2 id="dialog-title" tabindex="-1" autofocus>Start byggeprosjektet på nytt</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk nullstillingen">${icon('close')}</button></div>
    <form class="profile-form" data-beta-reset>
      <label class="profile-field"><span>Velg byggeprosjekt</span><select name="project">${Object.entries(PROJECTS).map(([id,project])=>`<option value="${id}" ${id===selected?'selected':''}>${project.name}</option>`).join('')}</select></label>
      <p class="adult-note">Byggestegene i det valgte prosjektet slettes for denne spilleren. For kart får du et nytt landskap.</p>
      <p class="adult-note" data-reset-round role="status">${abortNote(selected)}</p>
      <div class="beta-actions"><button type="button" class="secondary" data-action="close-dialog">Behold prosjektet</button><button type="submit" class="secondary beta-danger">Nullstill valgt prosjekt</button></div>
    </form>`, '', dialog => {
    dialog.querySelector('select').addEventListener('change', event => {
      dialog.querySelector('[data-reset-round]').textContent = abortNote(event.target.value);
    });
  });
}

function finishBetaTestAction() {
  sounds.stop();
  completedReward = null;
  focusGame = null;
  ui = makeUI();
  save();
  view = profile ? 'home' : 'onboarding';
  closeDialog(); render(); goTop(); focusHeading();
}

function resetBetaProject(id) {
  if (CHANNEL !== 'preview' || !projectById(id)) return;
  if (isWorld(id)) state = replaceCurrentWorld(state,id,freshWorld(Math.random,currentWorld(state,id)));
  state.projects[id] = 0;
  if (id === state.rewardMode) state.active = null;
  finishBetaTestAction();
}

function markAway() {
  save();
  const key = profile ? `${AWAY_KEY}-${profile.id}` : AWAY_KEY;
  try { storage.setItem(key, String(Date.now())); } catch {}
}

function welcomeBack() {
  if (document.hidden || view === 'onboarding') return;
  const key = profile ? `${AWAY_KEY}-${profile.id}` : AWAY_KEY;
  let away;
  try {
    away = Number(storage.getItem(key));
    if (away) storage.removeItem(key);
  } catch { return; }
  if (!away || Date.now() - away < WELCOME_AFTER) return;
  if (document.querySelector('dialog[open]') || ui.retry || view === 'focus-break') return;
  const next = nextBuildReward();
  const g = rewardDetails(next);
  const note = state.active
    ? msg('welcome.resume')
    : g.project ? g.full ? msg('welcome.explore') : msg('welcome.nextStage')
    : next ? msg('welcome.firstBrick')
    : g.full ? msg('welcome.newSeed')
    : g.mode === 'bricks' ? msg('welcome.nextBrick') : msg('welcome.plantGrowth');
  const cta = state.active ? msg('round.resume') : state.focusBreakPending ? breakButtonLabel() : msg('welcome.start');
  const art=rewardArt(false,next,{showBuddy:false});
  const greeting=eploNote(`${eploGreeting()} ${note}`);
  showDialog(`<div class="dialog-header">
      <h2 id="dialog-title" tabindex="-1" autofocus>${msg('welcome.title')}</h2>
      <button type="button" class="icon-button welcome-close" data-action="close-dialog" aria-label="Lukk velkomsten">${icon('close')}</button>
    </div>
    ${greeting}
    <figure class="welcome-preview">
      <figcaption class="welcome-reward">${escapeHtml(g.label)}</figcaption>
      ${art}
    </figure>
    <button class="primary" data-action="welcome-start">${cta} ${icon('arrow')}</button>`,
    'welcome-dialog', g.project ? mountDialogProjectPreview : undefined);
}

function progressionNote() {
  if (!profile?.grade) return 'Velg et klassetrinn for å bruke automatisk progresjon.';
  if (!state.autoProgress) return 'La appen gå videre til neste valgte spor på trinnet etter tre runder.';
  const next = progressionPreview(state, profile.grade)?.level;
  if (!next) return 'Dette er siste øvingsspor på trinnet. Øvingen fortsetter her.';
  return `Neste spor er «${LEVELS[next].label}». Noen av oppgavene kommer i de neste rundene. Etter ${PROGRESSION_ROUNDS} fullførte runder på dette sporet går appen over til neste spor.`;
}

function practiceOptions() {
  const levels = levelsForGrade(profile?.grade);
  const excluded = state.progressionExcluded[profile?.grade] ?? [];
  const title = profile?.grade ? `Øving på ${profile.grade}. trinn` : 'Hva skal dere øve på?';
  const options = levels.map(n => {
    const level = LEVELS[n];
    return `<label class="level-option"><input type="radio" name="level" value="${n}" ${!state.mix && state.level === n ? 'checked' : ''} ${state.autoProgress&&excluded.includes(n)?'disabled':''}><span><strong>${level.label}</strong><small>${level.description}</small></span></label>`;
  }).join('');
  const groups = levels.includes(4) ? '<p class="adult-note"><strong>Ganging og deling.</strong> Sporet blander ganging og deling med pluss, minus og oppgaver med et manglende tall. Fordelingen kan endres etter hva barnet trenger hjelp med.</p>' : '';
  const mixes = [
    ...(profile?.grade ? [['grade','Fri blanding på '+profile.grade+'. trinn','Oppgaver fra alle øvingsområdene på trinnet, i tilfeldig rekkefølge.']] : []),
    ['all',msg('practice.mixed'),'En runde kan blande enkel hoderegning med brøk, algebra og andre oppgaver fra høyere trinn.'],
  ].map(([id,label,help])=>`<label class="level-option"><input type="radio" name="level" value="${id}" ${state.mix===id?'checked':''} ${state.autoProgress?'disabled':''}><span><strong>${label}</strong><small>${help}</small></span></label>`).join('');
  return `<legend>${title}</legend>${options}${mixes}${groups}
    <p class="adult-note">Valget gjelder fra neste nye runde.</p>
    <div class="progression-setting"><label class="sound-setting"><input type="checkbox" id="auto-progress" aria-describedby="progression-note" ${state.autoProgress ? 'checked' : ''} ${profile?.grade ? '' : 'disabled'}>Automatisk progresjon</label>
      <p class="adult-note" id="progression-note">${progressionNote()}</p>
      ${profile?.grade ? progressionTracks(profile.grade,excluded) : ''}</div>`;
}

function adultTopicSummary() {
  const stats = topicStats(state.history, state.level);
  const topics = Object.entries(TOPICS).filter(([key]) => stats[key].total).map(([key, label]) => `<div class="topic-stat"><strong>${label}</strong><span>${stats[key].total} oppgaver · hjelp i ${stats[key].helped}</span></div>`).join('');
  return `<p class="adult-section-title">Øvd på · ${LEVELS[state.level].label}</p>${topics || '<p class="history-empty">Emnene vises når dere har fullført noen oppgaver.</p>'}<p class="adult-note">Siste tolv runder på valgt nivå. En oppgavetype er ikke nødvendigvis mestret selv om svaret er riktig.</p>`;
}

function rewardThumbnail(id) {
  return `<span class="reward-choice-icon" aria-hidden="true">${rewardIllustration(id)}</span>`;
}

function projectOptions() {
  return `<details class="project-choice-list" ${projectById(state.rewardMode) ? 'open' : ''}>
    <summary>Store byggeprosjekter</summary><p class="adult-note">Hver runde gir ett byggesteg på prosjektet du velger.</p>
    ${Object.entries(PROJECTS).map(([id,project]) => `<label class="level-option">
      <input type="radio" name="reward-mode" value="${id}" ${state.rewardMode === id ? 'checked' : ''}>
      ${rewardThumbnail(id)}
      <span><strong>${project.name}</strong><small>${project.description} ${projectProgress(rewardDetails({mode:id}))}.</small></span>
    </label>`).join('')}
  </details>`;
}

function checkPublishedRelease(dialog) {
  const result = dialog.querySelector('[data-published-version]');
  const retry = dialog.querySelector('[data-published-check]');
  let active;
  async function check() {
    active?.abort();
    const controller = active = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    retry.disabled = true;
    result.textContent = 'Sjekker …';
    let version;
    try { version = await readPublishedVersion(window.location.origin, {signal:controller.signal}); }
    catch { version = null; }
    finally { clearTimeout(timer); }
    if (controller !== active || !dialog.open) return;
    result.textContent = version || 'Kunne ikke sjekke nå';
    retry.disabled = false;
  }
  retry.addEventListener('click', check);
  dialog.addEventListener('close', () => active?.abort(), {once:true});
  check();
}

function adultView() {
  const recent = state.history.slice(-5).reverse();
  const days = new Set(state.history.map(r => new Date(r.date).toLocaleDateString('nb-NO'))).size;
  const history = recent.length ? recent.map(r => `<div class="history-item"><div>${new Date(r.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}<small>${LEVELS[r.level].label}</small></div><div class="history-numbers">${r.firstTry}/${r.length ?? ROUND_LENGTH} på første forsøk<small>Hjelp åpnet i ${r.helped} ${r.helped === 1 ? 'oppgave' : 'oppgaver'}</small></div></div>`).join('') : '<p class="history-empty">Her vises de siste rundene når barnet har øvd.</p>';
  const testLinks = CHANNEL === 'preview' ? `<nav class="beta-test-links" aria-labelledby="test-links-title">
    <h3 id="test-links-title">Test pauseleker</h3><p>Prøv en lek direkte, uten å endre øvingsframgangen.</p>
    <div>${Object.entries(TEST_BREAK_LINKS).map(([kind, href]) => `<a class="secondary" href="${href}">${BREAK_TITLES[kind]}</a>`).join('')}</div></nav>` : '';
  const release = CHANNEL === 'preview' ? `<section class="beta-release" aria-label="Versjonsoversikt">
    <div><strong>Beta</strong><span>${VERSION}</span></div>
    <div><strong>Publisert på ${PRODUCTION_PATH}</strong><span data-published-version role="status">Sjekker …</span></div>
    <button class="secondary" data-published-check>Sjekk på nytt</button>
  </section>` : '';
  const demos = CHANNEL === 'preview' ? `<details class="beta-test-links project-demos">
    <summary>Byggedemoer</summary><p>Prøv byggestegene med piltastene eller knappene. Demoen lagrer ingen framgang.</p>
    <div>${Object.entries(PROJECTS).map(([id,project]) => `<button class="secondary" data-action="project-demo" data-project="${id}">${project.name}</button>`).join('')}</div>
  </details>` : '';
  const testActions = CHANNEL === 'preview' ? `<details class="beta-test-links beta-test-actions">
    <summary>Start på nytt i Beta</summary><p>Avbryt en runde eller nullstill ett stort byggeprosjekt.</p>
    <div class="beta-actions"><button class="secondary" data-action="beta-abort-round" ${state.active?'':'disabled'}>Avbryt påbegynt runde</button>
    <button class="secondary" data-action="beta-reset-project">Nullstill stort byggeprosjekt</button></div>
  </details>` : '';
  const playerSettings = profile ? `<section class="adult-profile">
    <h3>${avatarArt(profile.avatar)}${escapeHtml(profile.name)}</h3>
    <label class="profile-field"><span>${msg('profile.grade')}</span><select id="player-grade" aria-describedby="grade-note">${gradeOptions(profile.grade)}</select></label>
    <p class="adult-note" id="grade-note">Velg trinn for å se aktuelle øvingsspor nedenfor.</p>
    <button class="secondary" data-action="show-profiles">Bytt eller legg til spiller</button>
    <button class="delete-button" data-action="delete-profile">Slett profilen</button>
  </section>` : '';
  showDialog(`<div class="dialog-header"><h2 id="dialog-title" tabindex="-1" autofocus>${msg('adult.title')}</h2><button class="icon-button" data-action="close-dialog" aria-label="Lukk voksenvisningen">${icon('close')}</button></div><p class="adult-intro">Ingen tidsfrist, liv eller poengtrekk. En stjerne betyr at barnet har øvd.</p>
    ${!storageWorks ? '<p class="storage-warning">Nettleseren tillater ikke lagring akkurat nå. Appen virker, men framgangen kan forsvinne når siden lukkes.</p>' : ''}
    <details class="adult-details admin-section"><summary>Spiller og øving</summary><div class="admin-section-body">${playerSettings}
    <div class="round-length-setting"><label class="profile-field"><span>${msg('setup.roundLength')}</span>
      <select id="round-length" aria-describedby="round-length-note">${ROUND_LENGTHS.map(length => `<option value="${length}" ${state.roundLength === length ? 'selected' : ''}>${length} oppgaver</option>`).join('')}</select></label>
      <p class="adult-note" id="round-length-note">Gjelder fra neste nye runde. En fullført runde gir én stjerne og ett steg på det du bygger eller dyrker.</p></div>
    <fieldset class="adult-group" id="practice-options">${practiceOptions()}</fieldset>
    </div></details>
    <details class="adult-details admin-section"><summary>Bygging og belønninger</summary><div class="admin-section-body"><fieldset class="adult-group reward-options"><legend>Hva vil barnet bygge videre på?</legend><label class="level-option"><input type="radio" name="reward-mode" value="plant" ${state.rewardMode === 'plant' ? 'checked' : ''}>${rewardThumbnail('plant')}<span><strong>Plante</strong><small>En spire som vokser og blomstrer.</small></span></label><label class="level-option"><input type="radio" name="reward-mode" value="bricks" ${state.rewardMode === 'bricks' ? 'checked' : ''}>${rewardThumbnail('bricks')}<span><strong>Klossebygging</strong><small>Fem store klosser blir en tilfeldig figur.</small></span></label>
      ${projectOptions()}<p class="adult-note">Du kan bytte mellom belønningene og fortsette på hvert prosjekt senere.</p></fieldset></div></details>
    <details class="adult-details admin-section"><summary>Lyd, hjelp og pauseleker</summary><div class="admin-section-body">
    <label class="sound-setting"><input type="checkbox" id="sound-setting" ${state.sound ? 'checked' : ''}>Lyd i appen</label>
    ${typeof navigator.vibrate === 'function' ? `<label class="sound-setting"><input type="checkbox" id="haptics-setting" ${state.haptics ? 'checked' : ''}>Vibrasjon ved svar og fullføring</label>` : ''}
    <div class="described-setting"><label class="sound-setting"><input type="checkbox" id="visual-setting" aria-describedby="visual-setting-note" ${state.alwaysShowVisuals ? 'checked' : ''}>Vis alltid brikker og figurer</label>
    <p class="adult-note" id="visual-setting-note">Holder tellebrikker og andre figurer synlige i matteoppgavene. Med valget av kan støtten bli valgfri etter flere trygge runder. Barnet kan da hente den fram med «Forklar meg».</p></div>
    <div class="described-setting"><label class="sound-setting"><input type="checkbox" id="focus-break-setting" aria-describedby="focus-break-note" ${state.focusBreaks ? 'checked' : ''}>Pauseleker mellom øvingsrundene</label>
    <p class="adult-note" id="focus-break-note">En kort lek etter hver tredje runde. Appen veksler mellom Kims lek, klossebygging etter hukommelsen og å telle klosser til et gulv.</p></div>
    <p class="adult-note adaptation-note">Oppgaver som trengte hjelp får litt mer plass. Etter flere trygge runder kan én eller to oppgaver få talltastatur.</p>
    </div></details>
    <details class="adult-details admin-section"><summary>Øvingshistorikk</summary><div class="admin-section-body"><div class="adult-stats"><div class="stat"><strong>${state.roundsCompleted}</strong><span>fullførte runder</span></div><div class="stat"><strong>${days}</strong><span>${days === 1 ? 'øvingsdag' : 'øvingsdager'} i siste historikk</span></div></div>
    <div id="adult-topic-summary">${adultTopicSummary()}</div>
    <p class="adult-section-title history-title">Siste runder</p>${history}<p class="adult-note">Tallene beskriver øvingen, ikke barnets samlede forståelse. Hjelp kan også åpnes automatisk etter et feil svar. Snakk gjerne om hvordan barnet tenkte.</p>
    </div></details>
    ${CHANNEL === 'preview' ? `<details class="adult-details admin-section"><summary>Testverktøy i Beta</summary><div class="admin-section-body">${release}${testLinks}${demos}${testActions}</div></details>` : ''}
    <details class="adult-details admin-section"><summary>App og lagring</summary><div class="admin-section-body"><div class="update-section"><p class="adult-section-title">Appversjon ${VERSION}</p><p class="adult-note" data-update-status role="status">${updateStatus.message}</p><div class="update-actions"><button class="secondary" data-action="check-update" ${updateStatus.checking || updateStatus.applying ? 'disabled' : ''}>Se etter oppdatering</button><button class="secondary update-apply" data-action="apply-update" ${updateStatus.ready ? '' : 'hidden'} ${updateStatus.applying ? 'disabled' : ''}>${updateStatus.applying ? 'Oppdaterer …' : 'Oppdater nå'}</button></div></div>
    <details class="adult-details"><summary>Tips til en god økt</summary><p>La barnet tenke ferdig. Spør av og til «Hvordan fant du det ut?». Bruk gjerne klosser ved siden av. Avslutt når overskuddet er brukt opp; en halv runde kan fortsettes senere.</p><p>Appen gir øving og erstatter ikke lærerens kartlegging eller oppfølging.</p></details>
    <details class="adult-details"><summary>Legg appen på hjemskjermen</summary><p>På iPad og iPhone: åpne adressen i Safari, velg Del og «Legg til på Hjem-skjerm». Åpne appen på nett én gang før dere bruker den uten nett.</p><p>Profiler og framgang lagres lokalt i denne nettleseren eller i den installerte appen. Safari og hjemskjermappen kan ha hver sine profiler. Det er ingen konto, sporing eller eksterne ressurser.</p></details>
    <button class="delete-button" data-action="reset">${profile ? 'Slett denne spillerens øvingshistorikk' : 'Slett øvingshistorikken'}</button></div></details><button class="primary" data-action="close-dialog">Ferdig</button><p class="version">Mattopia ${VERSION}</p>`, 'adult-dialog', d => {
      if (CHANNEL === 'preview') checkPublishedRelease(d);
      const refreshPractice = selector => {
        const fieldset=d.querySelector('#practice-options');
        const expanded=fieldset.querySelector('.progression-tracks')?.open;
        fieldset.innerHTML=practiceOptions();
        if (expanded && fieldset.querySelector('.progression-tracks')) fieldset.querySelector('.progression-tracks').open=true;
        if (selector) fieldset.querySelector(selector)?.focus({preventScroll:true});
        d.querySelector('#adult-topic-summary').innerHTML=adultTopicSummary();
      };
      d.addEventListener('change', e => {
        if (e.target.name === 'level') {
          const value=e.target.value;
          if (value==='all' || value==='grade'&&profile?.grade) {
            if (state.autoProgress) return;
            state.mix=value;
          }
          else if (levelsForGrade(profile?.grade).includes(Number(value))) {
            state.level=Number(value);
            state.mix=null;
          } else return;
          state.progressRounds = 0;
          save();
          refreshPractice('input[name=level]:checked');
        }
        if (e.target.id === 'player-grade' && profile) {
          profile = { ...profile, grade:profileDetails({ grade:e.target.value }).grade };
          state.progressRounds = 0;
          alignPracticeLevel(profile.grade);
          save({ edit:true });
          refreshPractice();
        }
        if (e.target.id === 'auto-progress' && profile?.grade) {
          state.autoProgress = e.target.checked;
          if (state.autoProgress) state.mix = null;
          state.progressRounds = 0;
          alignPracticeLevel(profile.grade);
          save();
          refreshPractice('#auto-progress');
        }
        if (e.target.name === 'progression-track' && profile?.grade) {
          const {grade}=profile, level=Number(e.target.value), choices=levelsForGrade(grade);
          if (!choices.includes(level)) return;
          const excluded=new Set(state.progressionExcluded[grade]??[]);
          if (e.target.checked) excluded.delete(level);
          else if (excluded.size<choices.length-1) excluded.add(level);
          state.progressionExcluded={...state.progressionExcluded,[grade]:[...excluded]};
          state.progressRounds=0;
          alignPracticeLevel(grade);
          save();
          refreshPractice(`input[name="progression-track"][value="${level}"]`);
        }
        if (e.target.id === 'round-length' && ROUND_LENGTHS.includes(Number(e.target.value))) {
          state.roundLength = Number(e.target.value);
          save();
        }
        if (e.target.name === 'reward-mode') { state = selectRewardMode(state, e.target.value); save(); }
        if (e.target.id === 'sound-setting') { state.sound = e.target.checked; save(); state.sound ? playSuccess() : sounds.stop(); }
        if (e.target.id === 'haptics-setting') { state.haptics = e.target.checked; save(); }
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
    const last = answered.index === answered.tasks.length - 1;
    const perfect = last && answered.results.every(result => result?.firstTry);
    const goal=PERFECT_ROUNDS_PER_BONUS;
    const progress=perfect ? state.perfectRounds%goal+1 : 0;
    const bonusMessage=progress===goal ? `${goal} av ${goal}. Byggebonus klar!` : `${progress} av ${goal} til byggebonus`;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    save(); render();
    feedback(perfect ? 'perfect' : `task-success-${taskSuccessStep(answered.index,answered.tasks.length)}`, 16);
    flashAnswer(task, value, true);
    if (perfect) {
      const companion = root.querySelector('.companion-strip');
      const message = companion?.querySelector('.companion-message');
      if (message) {
        const count=companion.querySelector('.perfect-progress');
        const previous = message.textContent;
        message.textContent = msg('round.perfect');
        if (count) { count.textContent=bonusMessage; count.hidden=false; }
        companion.classList.add('perfect-round');
        const sparks = companion.querySelector('.companion-sparks');
        if (sparks && !reducedMotion) {
          const offsets = [[-94,-51],[-53,-68],[-17,-49],[28,-60],[79,-48],[100,-16],[84,47],[42,59],[-21,54],[-84,43]];
          sparks.innerHTML = offsets.map(([x,y],i) =>
            `<i style="--spark-x:${x}px;--spark-y:${y}px;--spark-delay:${220+i%4*85}ms">${i%3===1?'✦':icon('star')}</i>`).join('');
        }
        setTimeout(() => {
          message.textContent = previous;
          if (count) count.hidden=true;
          companion.classList.replace('perfect-round','companion-returned');
          sparks?.replaceChildren();
        }, 3500);
      }
    }
    say(`Riktig. ${equationText(task)} ${perfect ? `Eplo sier: Perfekt runde! ${bonusMessage}` : last ? 'Runden er klar til å fullføres.' : 'Neste oppgave er klar.'}`);
    root.querySelector('[data-action="next"]')?.focus({ preventScroll: true });
    root.querySelector('.feedback-area')?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
    return;
  }
  ui.wrong.push(value);
  ui.retryStage = hintStage();
  ui.retry = true;
  ui.retryUntil = Date.now() + 1100;
  state.active = noteHelp(answered);
  save(); render(); feedback('retry', 11);
  flashAnswer(task, value, false);
  const attempt = ui;
  setTimeout(() => {
    if (ui === attempt && ui.retry && view === 'round') showRetry(task);
  }, 320);
}

function showRetry(task) {
  const attempt = ui;
  showDialog(`<h2 id="dialog-title" tabindex="-1" autofocus>Nesten!</h2>
    <p>Se på hintet og tenk en gang til.</p><p class="retry-hint">${escapeHtml(hintText(task))}</p>
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

const ownClickSound=new Set([
  'start','again','welcome-start','map-start','next','help','sound','erase','submit-number','pause',
  'focus-hide','focus-answer','focus-check','focus-continue','break-slot',
  'world-choose','project-open','project-demo','gallery-map','gallery-hero','select-profile',
]);

document.addEventListener('click', e => {
  if (e.detail && ignoredBrickClick?.contains(e.target)) { ignoredBrickClick = null; return; }
  const answer = e.target.closest('[data-answer]');
  if (answer && view === 'round' && !answer.disabled) { submitAnswer(Number(answer.dataset.answer)); return; }
  const digit = e.target.closest('[data-digit]');
  if (digit && view === 'round' && !state.active.solved) { enterDigit(digit.dataset.digit); return; }
  const unit = e.target.closest('[data-unit]');
  if (unit && view === 'round' && !ui.retry && !state.active.solved) {
    sounds.play('tap',state.sound);
    const n = Number(unit.dataset.unit);
    ui.removed.has(n) ? ui.removed.delete(n) : ui.removed.add(n);
    unit.classList.toggle('removed', ui.removed.has(n)); unit.setAttribute('aria-pressed', String(ui.removed.has(n))); unit.setAttribute('aria-label', `${ui.removed.has(n) ? 'Legg tilbake' : 'Ta bort'} brikke ${n + 1}`);
    const text = `Du har tatt bort ${ui.removed.size}.`;
    document.querySelector('#visual-caption').textContent = text; say(text); return;
  }
  const cell = e.target.closest('[data-cell]');
  if (cell && view === 'round' && !ui.retry && !state.active.solved) {
    sounds.play('tap',state.sound);
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
  const actionButton = e.target.closest('[data-action]');
  const action = actionButton?.dataset.action;
  const control=e.target.closest('button:not(:disabled), summary, a.secondary');
  if (control&&!ownClickSound.has(action)&&!control.matches('[data-project-latest], [data-demo-step], [data-demo-finish], [data-project-ambience]')) {
    const back=['close-dialog','setup-back','pause-home','home','retry'].includes(action);
    sounds.play(back?'back':'tap',state.sound);
  }
  if (action === 'dismiss-eplo') {
    const overlay=actionButton.closest('.map-eplo-overlay');
    const stage=overlay.parentElement;
    overlay.hidden=true;
    (stage.querySelector('.project-peek, canvas[tabindex], [data-action=close-dialog]')??document.querySelector('.complete h1'))?.focus({preventScroll:true});
  }
  if (action === 'start' || action === 'again') startRound();
  if (action === 'welcome-start' || action === 'map-start') {
    closeDialog();
    if (view !== 'round') startRound();
  }
  if (action === 'retry') retryAnswer();
  if (action === 'collection') showCollection(actionButton.dataset);
  if (action === 'collectible') {
    const { kind, id } = e.target.closest('[data-action="collectible"]').dataset;
    showCollectible(kind, id);
  }
  if (action === 'focus-hide' && view === 'focus-break' && focusGame.phase === 'study') {
    sounds.play('next', state.sound);
    focusGame.phase = 'guess';
    render(); focusHeading();
  }
  if (action === 'focus-answer' && view === 'focus-break' && focusGame.phase === 'guess') selectFocusImage(e.target.closest('[data-action="focus-answer"]'));
  if (action === 'break-pick' && canBuild()) {
    const { brickColor } = e.target.closest('[data-brick-color]').dataset;
    if (!focusGame.placed.includes(brickColor)) {
      focusGame.picked = focusGame.picked === brickColor ? null : brickColor;
      renderBreakChoice(`[data-action="break-pick"][data-brick-color="${brickColor}"]`);
    }
  }
  if (action === 'break-slot' && canBuild()) selectBuildSlot(Number(e.target.closest('[data-slot]').dataset.slot));
  if (action === 'floor-answer' && view === 'focus-break' && focusGame.kind === 'floor' && focusGame.phase === 'guess') {
    const n = Number(e.target.closest('[data-choice]').dataset.choice);
    if (focusGame.choices.includes(n)) {
      focusGame.selected = n;
      renderBreakChoice(`[data-action="floor-answer"][data-choice="${n}"]`);
    }
  }
  if (action === 'focus-check' && view === 'focus-break' && focusGame.phase === 'guess') checkFocusBreak();
  if (action === 'focus-retry' && view === 'focus-break' && focusGame.phase === 'retry') {
    retryBreak(focusGame);
    render(); goTop(); focusHeading();
  }
  if (action === 'focus-continue' && view === 'focus-break' && focusGame.phase === 'done') {
    if (testBreakReturn) exitTestBreak();
    else { focusGame = null; startRound(); }
  }
  if (action === 'test-break-exit' && testBreakReturn) exitTestBreak();
  if (action === 'help' && state.active && !ui.retry) {
    sounds.play('hint',state.sound);
    state.active = noteHelp(state.active); save(); render(); say(hintText(state.active.tasks[state.active.index]));
  }
  if (action === 'sound') { state.sound = !state.sound; save(); state.sound ? playSuccess() : sounds.stop(); render(); document.querySelector('[data-action="sound"]')?.focus({ preventScroll: true }); }
  if (action === 'erase') eraseDigit();
  if (action === 'submit-number' && ui.entry) submitAnswer(Number(ui.entry));
  if (action === 'check-update') updates.check();
  if (action === 'apply-update') updates.apply();
  if (action === 'next' && state.active?.solved) {
    state.active = advanceRound(state.active);
    if (state.active.index === state.active.tasks.length) {
      completedReward = null;
      const summary = roundSummary(state.active);
      if (summary && !state.history.some(r => r.id === summary.id)) {
        state.history.push(summary); state.history = state.history.slice(-40); state.roundsCompleted++;
        const awarded = awardPractice(state, summary.id, Math.random, summary.firstTry===summary.length);
        state = summary.mix ? awarded.state : advancePractice(awarded.state, profile?.grade, summary.level); completedReward = awarded.reward;
        state.focusBreakPending = state.focusBreaks && state.roundsCompleted % BREAK_INTERVAL === 0;
      }
      const stage = completedProjectScene(completedReward);
      state.active = null; view = 'complete'; celebrateOnRender = true;
      if (stage) {
        if (state.haptics) navigator.vibrate?.([18,55,25]);
        sounds.playBuild(stage,state.sound,{finale:rewardDetails(completedReward).full});
      } else feedback('finish',[18,55,25]);
    } else sounds.play('next', state.sound);
    ui = makeUI(); save(); render(); goTop(); focusHeading();
  }
  if (action === 'home') { view = 'home'; render(); goTop(); focusHeading(); }
  if (action === 'project-open' || (action === 'project-demo' && CHANNEL === 'preview')) {
    sounds.play('open', state.sound);
    showProject(e.target.closest('[data-project]').dataset.project, action === 'project-demo');
  }
  if (action === 'project-archive') {
    const {project,archive} = actionButton.dataset;
    const maps = state.worlds?.[project];
    const index = Number(archive);
    if (maps && index >= 0 && index < maps.length-1 && maps[index]) showProject(project,false,maps[index]);
  }
  if (action === 'gallery-map') {
    const {project,map,place}=actionButton.dataset;
    if (!isWorld(project)) return;
    const selected=playerMaps(project)[Number(map)];
    if (selected && worldStatus(selected).built) {
      sounds.play('open',state.sound);
      showProject(project,false,selected,{galleryMap:Number(map),place:place===undefined?null:Number(place)});
    }
  }
  if (action === 'gallery-hero' && collectedHeroes().includes(actionButton.dataset.project)) {
    sounds.play('open',state.sound);
    showProject(actionButton.dataset.project,false,null,{fromCollection:true});
  }
  if (action === 'world-choose' && !state.active && !state.focusBreakPending) {
    const {project,building} = actionButton.dataset;
    if (project !== state.rewardMode || !isWorld(project)) return;
    const map = currentWorld(state,project);
    const owner=chosenProfileName(profile);
    if (!worldBuildingOptions(project,map,owner).includes(Number(building))) return;
    const chosen = worldSelect(map,Number(building),project,owner);
    if (chosen === map) return;
    state = replaceCurrentWorld(state,project,chosen);
    closeDialog(); startRound();
  }
  if (action === 'world-new' && !state.active && isWorld(state.rewardMode)) {
    const next = startNewWorld(state,state.rewardMode);
    if (next === state) return;
    state = next;
    completedReward = null;
    view = 'home';
    save(); render(); goTop(); focusHeading();
  }
  if (action === 'adult') adultView();
  if (action === 'setup-back') stepSetup(actionButton.form,-1);
  if (action === 'show-profiles' && profile) showProfiles();
  if (action === 'delete-profile') confirmProfileDeletion();
  if (action === 'confirm-profile-delete' && profile?.id===actionButton.dataset.profileId) {
    const result=deleteProfile(storage,profileStore,profile.id);
    if (result.saved) { profileStore=result.store; selectAfterDeletion(); }
    else {
      const error=document.querySelector('[data-delete-error]');
      if (error) { error.hidden=false; error.textContent='Kunne ikke slette profilen. Prøv igjen når nettleseren tillater lagring.'; }
    }
  }
  if (action === 'new-profile' && profile) showProfileForm('new');
  if (action === 'edit-profile' && profile) showProfileForm('edit');
  if (action === 'select-profile' && profile) selectProfile(e.target.closest('[data-profile-id]').dataset.profileId);
  if (action === 'close-dialog') closeDialog();
  if (action === 'pause' && !ui.retry) showPause();
  if (action === 'pause-home') { closeDialog(); view = 'home'; save(); render(); goTop(); focusHeading(); }
  if (action === 'beta-abort-round') confirmBetaAbort();
  if (action === 'beta-reset-project') confirmBetaResetProject();
  if (action === 'beta-confirm-abort' && CHANNEL === 'preview' && state.active) {
    state.active = null;
    finishBetaTestAction();
  }
  if (action === 'reset') showDialog('<h2 id="dialog-title">Slette historikken?</h2><p>Denne spilleren mister stjerner, plantevekst, bygg og en påbegynt runde.</p><button class="primary" data-action="close-dialog">Behold historikken</button><button class="text-button" data-action="confirm-reset">Ja, slett historikken</button>', 'pause-dialog');
  if (action === 'confirm-reset') { closeDialog(); const { level, sound, haptics, rewardMode, focusBreaks, alwaysShowVisuals, autoProgress, progressionExcluded, roundLength, mix } = state; state = selectRewardMode({ ...freshState(), level, sound, haptics, focusBreaks, alwaysShowVisuals, autoProgress, progressionExcluded, roundLength, mix }, rewardMode); completedReward = null; focusGame = null; save(); view = profile ? 'home' : 'onboarding'; render(); focusHeading(); }
});

document.addEventListener('submit', event => {
  const form = event.target;
  if (form.matches('[data-setup-form]')) {
    event.preventDefault();
    stepSetup(form,1);
    return;
  }
  if (form.matches('[data-beta-reset]')) {
    event.preventDefault();
    resetBetaProject(new FormData(form).get('project'));
    return;
  }
});

document.addEventListener('change', event => {
  if (event.target.name==='practice'||event.target.name==='progression-track') {
    const form=event.target.closest('[data-setup-form]');
    if (form) syncSetupTracks(form);
  }
  if (event.target.matches('.avatar-option input, .level-option input, .setup-reward input, .profile-field select, #round-length, .progression-setting input')) {
    sounds.play('select',state.sound);
  }
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
window.addEventListener('pagehide', () => { markAway(); sounds.stop(); });
window.addEventListener('storage', event=>{
  if (event.key!==PROFILE_KEY||!profile) return;
  try {
    const latest=readProfiles(storage);
    if (latest.deletedIds?.includes(profile.id)) { profileStore=latest; selectAfterDeletion(); }
  } catch {}
});
window.addEventListener('pageshow', () => {
  if (!document.hidden&&state.sound) sounds.resume();
  welcomeBack();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { markAway(); sounds.stop(); }
  else {
    if (state.sound) sounds.resume();
    welcomeBack();
    if (view !== 'round') updates.check();
  }
});
render();
if (CHANNEL === 'preview') {
  window.addEventListener('hashchange', syncTestBreak);
  syncTestBreak();
}
welcomeBack();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => updates.init());
}
