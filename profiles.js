import { STORAGE_KEY } from './core.js';
import { illustration } from './illustrations.js';

export const PROFILE_KEY = `${STORAGE_KEY}-profiles-v1`;
export const AVATAR_GROUPS = [
  {label:'Dyr og figurer', avatars:{
    apple:'Eple', fox:'Rev', panda:'Panda', frog:'Frosk', octopus:'Blekksprut', owl:'Ugle',
    tiger:'Tiger', koala:'Koala', penguin:'Pingvin', cat:'Katt', dragon:'Drage', robot:'Robot',
  }},
  {label:'Interesser og symboler', avatars:{
    headphones:'Hodetelefoner', controller:'Spillkontroll', skateboard:'Skateboard', basketball:'Basketball',
    football:'Fotball', mountain:'Fjell', camera:'Kamera', planet:'Saturn',
    drum:'Trommer', guitar:'Gitar', compass:'Kompass', lightning:'Lyn',
  }},
];
export const AVATARS = Object.fromEntries(AVATAR_GROUPS.flatMap(({avatars})=>
  Object.entries(avatars).map(([key,label])=>[key,{icon:illustration(key),label}])));
export const GRADES = Array.from({ length:10 }, (_, i) => i + 1);
export const NAME_LIMIT = 24;
const validId = id => typeof id === 'string' && /^[a-z0-9-]{1,80}$/u.test(id);

export function profileDetails({ name, grade, avatar } = {}) {
  return {
    name:typeof name === 'string' ? name.replace(/\s+/gu, ' ').trim().slice(0, NAME_LIMIT) : '',
    grade:GRADES.includes(Number(grade)) ? Number(grade) : null,
    avatar:typeof avatar === 'string' && Object.hasOwn(AVATARS, avatar) ? avatar : 'apple',
  };
}

export function chosenProfileName(profile) {
  const name=profile?.name??'';
  return (profile?.hasName??!/^Spiller(?: \d+)?$/u.test(name))?name:'';
}

export function readProfiles(storage) {
  const empty = { activeId:null, profiles:[] };
  const data = storage.getItem(PROFILE_KEY);
  if (!data) return empty;
  let raw;
  try { raw = JSON.parse(data); } catch { return empty; }
  if (raw?.version !== 1 || !Array.isArray(raw.profiles)) return empty;
  const deleted = new Set(Array.isArray(raw.deletedIds) ? raw.deletedIds.filter(validId) : []);
  const profiles = new Map();
  for (const item of raw.profiles) {
    if (!validId(item?.id) || deleted.has(item.id)) continue;
    const details = profileDetails(item);
    profiles.set(item.id,{...details,name:details.name||'Spiller',id:item.id,practice:item.practice,
      ...(typeof item.hasName==='boolean'&&{hasName:item.hasName&&Boolean(details.name)})});
  }
  return {
    activeId:profiles.has(raw.activeId) ? raw.activeId : profiles.keys().next().value ?? null,
    profiles:[...profiles.values()],
    ...(deleted.size > 0 && {deletedIds:[...deleted]}),
  };
}

export function saveProfile(storage, current, profile, { select=false, edit=false, recover=false } = {}) {
  let latest = { activeId:null, profiles:[] };
  try { latest = readProfiles(storage); } catch {}
  const deleted = new Set([...(current.deletedIds ?? []), ...(latest.deletedIds ?? [])]);
  if (deleted.has(profile.id)) return {store:latest, saved:true, removed:true};
  // Keep updates from other profiles when two tabs have different players open.
  const items = recover ? [...latest.profiles, ...current.profiles] : [...current.profiles, ...latest.profiles];
  const profiles = new Map(items.filter(item=>!deleted.has(item.id)).map(item => [item.id, item]));
  const details = edit ? profile : profiles.get(profile.id) || profile;
  profiles.set(profile.id, { ...details, practice:profile.practice });
  const store = {
    activeId:select ? profile.id : [latest.activeId,current.activeId].find(id=>profiles.has(id)) ?? profile.id,
    profiles:[...profiles.values()],
    ...(deleted.size > 0 && {deletedIds:[...deleted]}),
  };
  let saved = false;
  try {
    storage.setItem(PROFILE_KEY, JSON.stringify({ version:1, ...store }));
    saved = true;
  } catch {}
  return { store, saved };
}

export function deleteProfile(storage, current, id) {
  try {
    const latest=readProfiles(storage);
    const deleted=new Set([...(current.deletedIds??[]),...(latest.deletedIds??[]),id]);
    const profiles=new Map([...current.profiles,...latest.profiles]
      .filter(person=>!deleted.has(person.id)).map(person=>[person.id,person]));
    const activeId=[latest.activeId,current.activeId].find(player=>profiles.has(player))??profiles.keys().next().value??null;
    const store={activeId,profiles:[...profiles.values()],deletedIds:[...deleted]};
    storage.setItem(PROFILE_KEY,JSON.stringify({version:1,...store}));
    return {store,saved:true};
  } catch {
    return {store:current,saved:false};
  }
}
