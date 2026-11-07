import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_KEY, profileDetails, readProfiles, saveProfile } from '../profiles.js';

test('A profile has a bounded name, a known avatar and a grade from 1 to 10', () => {
  assert.deepEqual(profileDetails({name:'  Lille   Rev ',grade:'10',avatar:'fox'}), {name:'Lille Rev',grade:10,avatar:'fox'});
  assert.deepEqual(profileDetails({name:null,grade:11,avatar:'constructor'}), {name:'',grade:null,avatar:'apple'});
  assert.equal(profileDetails({name:'a'.repeat(50)}).name.length,24);
});

test('Writing one profile preserves updates from another tab and its selected player', () => {
  const values = new Map();
  const storage = { getItem:key=>values.get(key), setItem:(key,value)=>values.set(key,value) };
  const make = id => ({ id, name:id, avatar:'apple', grade:3, practice:{roundsCompleted:0} });
  const ada = make('ada'), leo = make('leo');
  const initial = saveProfile(storage, readProfiles(storage), ada, {select:true}).store;
  const other = saveProfile(storage, initial, leo, {select:true}).store;
  saveProfile(storage, other, {...leo, practice:{roundsCompleted:2}});
  const saved = saveProfile(storage, initial, {...ada, practice:{roundsCompleted:3}});
  assert.equal(saved.saved,true);
  assert.equal(readProfiles(storage).activeId,'leo');
  assert.deepEqual(readProfiles(storage).profiles.map(p=>[p.id,p.practice.roundsCompleted]), [['ada',3],['leo',2]]);
  assert.equal(JSON.parse(values.get(PROFILE_KEY)).version,1);
});

test('A failed storage write keeps the current profile usable in memory', () => {
  const failed = {getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}};
  const profile = {id:'ada',name:'Ada',avatar:'fox',grade:3,practice:{roundsCompleted:1}};
  const saved = saveProfile(failed, {activeId:null,profiles:[]}, profile, {select:true});
  assert.equal(saved.saved,false);
  assert.deepEqual(saved.store,{activeId:'ada',profiles:[profile]});
});
