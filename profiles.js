import { STORAGE_KEY } from './core.js';
import { illustration } from './illustrations.js';

export const PROFILE_KEY = `${STORAGE_KEY}-profiles-v1`;
export const AVATARS = {
  apple:{ icon:illustration('apple'), label:'Eple' },
  fox:{ icon:illustration('fox'), label:'Rev' },
  panda:{ icon:illustration('panda'), label:'Panda' },
  frog:{ icon:illustration('frog'), label:'Frosk' },
  octopus:{ icon:illustration('octopus'), label:'Blekksprut' },
  owl:{ icon:illustration('owl'), label:'Ugle' },
  tiger:{ icon:illustration('tiger'), label:'Tiger' },
  koala:{ icon:illustration('koala'), label:'Koala' },
  penguin:{ icon:illustration('penguin'), label:'Pingvin' },
  cat:{ icon:illustration('cat'), label:'Katt' },
  dragon:{ icon:illustration('dragon'), label:'Drage' },
  robot:{ icon:illustration('robot'), label:'Robot' },
};
export const GRADES = Array.from({ length:10 }, (_, i) => i + 1);
export const NAME_LIMIT = 24;

export function profileDetails({ name, grade, avatar } = {}) {
  return {
    name:typeof name === 'string' ? name.replace(/\s+/gu, ' ').trim().slice(0, NAME_LIMIT) : '',
    grade:GRADES.includes(Number(grade)) ? Number(grade) : null,
    avatar:typeof avatar === 'string' && Object.hasOwn(AVATARS, avatar) ? avatar : 'apple',
  };
}

export function readProfiles(storage) {
  const empty = { activeId:null, profiles:[] };
  const data = storage.getItem(PROFILE_KEY);
  if (!data) return empty;
  let raw;
  try { raw = JSON.parse(data); } catch { return empty; }
  if (raw?.version !== 1 || !Array.isArray(raw.profiles)) return empty;
  const profiles = new Map();
  for (const item of raw.profiles) {
    if (typeof item?.id !== 'string' || !/^[a-z0-9-]{1,80}$/u.test(item.id)) continue;
    const details = profileDetails(item);
    profiles.set(item.id, { ...details, name:details.name || 'Spiller', id:item.id, practice:item.practice });
  }
  return {
    activeId:profiles.has(raw.activeId) ? raw.activeId : profiles.keys().next().value ?? null,
    profiles:[...profiles.values()],
  };
}

export function saveProfile(storage, current, profile, { select=false, edit=false, recover=false } = {}) {
  let latest = { activeId:null, profiles:[] };
  try { latest = readProfiles(storage); } catch {}
  // Keep updates from other profiles when two tabs have different players open.
  const items = recover ? [...latest.profiles, ...current.profiles] : [...current.profiles, ...latest.profiles];
  const profiles = new Map(items.map(item => [item.id, item]));
  const details = edit ? profile : profiles.get(profile.id) || profile;
  profiles.set(profile.id, { ...details, practice:profile.practice });
  const store = {
    activeId:select ? profile.id : latest.activeId || current.activeId || profile.id,
    profiles:[...profiles.values()],
  };
  let saved = false;
  try {
    storage.setItem(PROFILE_KEY, JSON.stringify({ version:1, ...store }));
    saved = true;
  } catch {}
  return { store, saved };
}
