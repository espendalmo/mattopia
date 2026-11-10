import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {VERSION} from '../core.js';

const root = new URL('../', import.meta.url);
const worker = await fs.readFile(new URL('sw.js', root), 'utf8');

function harness(base, {failAsset, claim = async () => {}} = {}) {
  const events = {};
  const stores = new Map();
  const deleted = [];
  const downloads = [];
  let skipped = 0;
  const absolute = key => new URL(typeof key === 'string' ? key : key.url, base).href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async put(key, response) { store.set(absolute(key), response); },
        async match(key) { return store.get(absolute(key)); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(key) { deleted.push(key); return stores.delete(key); },
  };
  vm.runInNewContext(worker, {
    URL, Request, caches, fetch: async request => {
      if (!request.cache) throw new Error('Offline');
      downloads.push(request);
      const url = new URL(request.url);
      const local = url.pathname.slice(new URL(base).pathname.length) || 'index.html';
      if (local === failAsset) return {ok:false};
      const bytes = await fs.readFile(new URL(local, root));
      return {ok:true, bytes, url:request.url};
    },
    self: { location: new URL('sw.js', base), skipWaiting: async () => {skipped++;}, clients: { claim }, addEventListener: (n, fn) => { events[n] = fn; } },
  });
  async function lifecycle(name) { let pending; events[name]({ waitUntil: p => { pending = p; } }); await pending; }
  async function request(path, mode = 'cors') { let result; events.fetch({ request: { url: new URL(path, base).href, method: 'GET', mode }, respondWith: p => { result = p; } }); return result; }
  async function message(data, port) { let pending; events.message({data,ports:port?[port]:[],waitUntil:p => {pending=p;}});await pending; }
  return { lifecycle, request, message, stores, deleted, events, downloads, skipped:() => skipped };
}

test('All offline assets exist and load from cache at root and GitHub project paths', async () => {
  for (const base of ['https://example.github.io/', 'https://example.github.io/mattopia/']) {
    const h = harness(base);
    await h.lifecycle('install');
    for (const name of ['index.html', 'app.js', 'core.js', 'learning.js', 'sound.js', 'sound-art.js', 'update.js', 'rewards.js', 'plants.js', 'breaks.js', 'profiles.js', 'illustrations.js', 'curriculum.js', 'projects.js', 'worlds.js', 'regions.js', 'street-grid.js', 'region-roads.js', 'map-art.js', 'region-scenery.js', 'world-landmarks.js', 'scenery.js', 'transport.js', 'project-view.js', 'project-picking.js', 'landmark-ground.js', 'landmark-stories.js', 'seasons.js', 'project-fireworks.js', 'style.css', 'manifest.webmanifest', 'assets/icon-192.png', 'assets/apple-touch-icon.png', 'assets/moon-stars.svg']) {
      assert.ok((await h.request(name)).bytes.length > 0, name);
    }
    assert.ok((await h.request('?from=home', 'navigate')).bytes.length > 0, 'navigation query falls back to cached entry');
  }
});

test('A cache update preserves other apps on the same GitHub Pages origin', async () => {
  const h = harness('https://example.github.io/mattopia/');
  h.stores.set('tallvenn:/mattopia/:0.9.0', new Map());
  h.stores.set('tallvenn:/another-app/:0.9.0', new Map());
  h.stores.set('unrelated-cache', new Map());
  await h.lifecycle('install');
  await h.lifecycle('activate');
  assert.deepEqual(h.deleted, ['tallvenn:/mattopia/:0.9.0']);
  assert.ok(h.stores.has('tallvenn:/another-app/:0.9.0'));
});

test('Published version lookups pass through the offline service worker', async () => {
  const h=harness('https://example.github.io/');
  await h.lifecycle('install');
  assert.equal(await h.request('/mattopia/core.js?__tallvenn_published=1'),undefined);
});

test('The root app never serves its offline index to a beta page in a subdirectory', async () => {
  const h = harness('https://example.github.io/');
  await h.lifecycle('install');
  await assert.rejects(h.request('mattopia-beta/', 'navigate'), /Offline/);
  assert.ok((await h.request('index.html?from=home', 'navigate')).bytes.length > 0);
});

test('Manifest is portable and all icon declarations resolve to real files', async () => {
  const m = JSON.parse(await fs.readFile(new URL('manifest.webmanifest', root), 'utf8'));
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  for (const icon of m.icons) assert.ok((await fs.stat(new URL(icon.src, root))).size > 0);
  const css = await fs.readFile(new URL('style.css', root), 'utf8');
  const html = await fs.readFile(new URL('index.html', root), 'utf8');
  assert.ok(!css.includes('@import'));
  assert.ok(!/src=["']https?:/.test(html));
});

test('The actual service worker reports the same release as the app and package',async()=>{
  const h=harness('https://example.github.io/mattopia/');let reported;
  await h.message({type:'GET_VERSION'},{postMessage:data=>{reported=data.version;}});
  assert.equal(reported,VERSION);
  const pkg=JSON.parse(await fs.readFile(new URL('package.json',root),'utf8'));
  assert.equal(pkg.version,VERSION);
});

test('Every release asset bypasses the HTTP cache and is stored under its normal offline URL',async()=>{
  const h=harness('https://example.github.io/mattopia/');await h.lifecycle('install');
  assert.ok(h.downloads.length>=15);
  for(const request of h.downloads){
    assert.equal(request.cache,'reload');
    assert.equal(new URL(request.url).searchParams.get('__tallvenn_release'),VERSION);
  }
  assert.equal(h.skipped(),1);
  const result=await h.request('core.js');
  assert.ok(result.bytes.toString().includes(`VERSION='${VERSION}'`));
});

test('An incomplete download cannot activate or replace the previous complete offline bundle',async()=>{
  const h=harness('https://example.github.io/mattopia/',{failAsset:'app.js'});
  const old=new Map([['saved',{bytes:'previous release'}]]);
  h.stores.set('tallvenn:/mattopia/:1.2.1',old);
  await assert.rejects(h.lifecycle('install'),/Incomplete app download/);
  assert.equal(h.skipped(),0);
  assert.equal(h.stores.get('tallvenn:/mattopia/:1.2.1'),old);
  assert.deepEqual(h.deleted,[]);
});

test('A legacy page cannot receive the new worker version before activation and claiming finish',async()=>{
  let claimStarted,releaseClaim;
  const started=new Promise(resolve=>{claimStarted=resolve;});
  const h=harness('https://example.github.io/mattopia/',{claim:()=>{claimStarted();return new Promise(resolve=>{releaseClaim=resolve;});}});
  const activating=h.lifecycle('activate');await started;
  let reported;
  const response=h.message({type:'GET_VERSION'},{postMessage:data=>{reported=data.version;}});
  await Promise.resolve();assert.equal(reported,undefined);
  releaseClaim();await activating;await response;
  assert.equal(reported,VERSION);
});
