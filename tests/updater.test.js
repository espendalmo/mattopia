import test from 'node:test';
import assert from 'node:assert/strict';
import {createUpdater} from '../update.js';

function eventSource(){
  const listeners=new Map();
  return {
    addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},
    removeEventListener(name,fn){listeners.get(name)?.delete(fn);},
    async fire(name){await Promise.all([...(listeners.get(name)||[])].map(fn=>fn()));},
  };
}
function harness({current='1.2.1',release='1.2.2',state='installed',silent=false,defaultReload=false}={}){
  const statuses=[],posts=[],navigations=[];let saved=0;
  function worker(version,initialState){return {...eventSource(),state:initialState,postMessage(data,ports){
    posts.push(data.type);
    if(data.type==='GET_VERSION'&&!silent){ports[0].postMessage({version});ports[0].close();}
  }};}
  const old=worker(current,'activated'),next=worker(release,state);
  const registration={...eventSource(),active:state==='activated'?next:old,waiting:state==='installed'?next:null,installing:state==='activating'?next:null,update:async()=>{}};
  const serviceWorker={...eventSource(),controller:old,register:async()=>registration};
  const options={currentVersion:current,serviceWorker,onStatus:s=>statuses.push(s),beforeReload:()=>{saved++;},activationTimeout:150,messageTimeout:30,pollInterval:5};
  if(!defaultReload)options.reload=version=>navigations.push(version);
  const updater=createUpdater(options);
  async function takeControl(notify=true){
    next.state='activated';registration.waiting=null;registration.installing=null;registration.active=next;serviceWorker.controller=next;
    if(notify){await next.fire('statechange');await serviceWorker.fire('controllerchange');}
  }
  return {updater,statuses,posts,navigations,takeControl,serviceWorker,next,saved:()=>saved};
}

test('A waiting update is detected, but applying cannot reload until the new controller takes over',async()=>{
  const h=harness();await h.updater.init();assert.equal(h.statuses.at(-1).ready,true);
  const pending=h.updater.apply();assert.equal(h.statuses.at(-1).applying,true);
  assert.ok(h.posts.includes('SKIP_WAITING'));assert.equal(h.navigations.length,0);assert.equal(h.saved(),0);
  await h.takeControl();await pending;
  assert.deepEqual(h.navigations,['1.2.2']);assert.equal(h.saved(),1);
});

test('An active registration with an old page controller waits even if controllerchange is missing',async()=>{
  const h=harness({state:'activated'});await h.updater.init();
  const pending=h.updater.apply();assert.equal(h.navigations.length,0);
  await h.takeControl(false);await pending;
  assert.deepEqual(h.navigations,['1.2.2']);assert.ok(h.posts.includes('CLAIM_CLIENTS'));
});

test('Double tapping Update cannot cause duplicate saves or navigation',async()=>{
  const h=harness();await h.updater.init();const pending=h.updater.apply();await h.updater.apply();
  await h.takeControl();await pending;
  assert.equal(h.saved(),1);assert.equal(h.navigations.length,1);
});

test('A stalled activation ends with an actionable message instead of a refresh loop',async()=>{
  const h=harness();await h.updater.init();await h.updater.apply();
  assert.equal(h.navigations.length,0);assert.equal(h.saved(),0);
  assert.equal(h.statuses.at(-1).status,'error');assert.equal(h.statuses.at(-1).applying,false);
  assert.equal(h.statuses.at(-1).ready,true);assert.match(h.statuses.at(-1).message,/Lukk appen helt/);
});

test('An unresponsive worker cannot be mistaken for an up-to-date app',async()=>{
  const h=harness({silent:true});await h.updater.init();
  assert.equal(h.statuses.at(-1).status,'error');assert.equal(h.statuses.at(-1).ready,false);
});

test('An older worker cannot offer a downgrade to an already newer page',async()=>{
  const h=harness({current:'1.2.2',release:'1.2.1'});await h.updater.init();await h.updater.apply();
  assert.equal(h.statuses.at(-1).ready,false);assert.equal(h.navigations.length,0);
});

test('The new navigation has a release-specific URL and preserves the GitHub project path',async()=>{
  const previous=globalThis.location;let destination;
  try{
    globalThis.location={href:'https://example.github.io/tallvenn/?demo=1#home',replace:url=>{destination=url;}};
    const h=harness({defaultReload:true});await h.updater.init();await h.takeControl();await h.updater.apply();
    const url=new URL(destination);
    assert.equal(url.pathname,'/tallvenn/');assert.equal(url.searchParams.get('__tallvenn_update'),'1.2.2');
    assert.equal(url.searchParams.get('demo'),'1');assert.equal(url.hash,'#home');
  }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});

test('Without service workers, a manual check leaves the button enabled and explains the limitation',async()=>{
  const statuses=[];
  const updater=createUpdater({currentVersion:'1.2.2',serviceWorker:null,onStatus:s=>statuses.push(s),beforeReload:()=>true});
  await updater.check();assert.equal(statuses.at(-1).checking,false);assert.equal(statuses.at(-1).status,'unavailable');
});
