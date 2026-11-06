import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {VERSION} from '../core.js';

const root = new URL('../', import.meta.url);
const worker = await fs.readFile(new URL('sw.js', root), 'utf8');

function harness(base) {
  const events = {};
  const stores = new Map();
  const deleted = [];
  const absolute = key => new URL(typeof key === 'string' ? key : key.url, base).href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(paths) {
          for (const p of paths) {
            const local = p === './' ? 'index.html' : p.replace('./', '');
            const bytes = await fs.readFile(new URL(local, root));
            store.set(absolute(p), { bytes, url: absolute(p) });
          }
        },
        async match(key) { return store.get(absolute(key)); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(key) { deleted.push(key); return stores.delete(key); },
  };
  vm.runInNewContext(worker, {
    URL, caches, fetch: async () => { throw new Error('Offline'); },
    self: { location: new URL('sw.js', base), skipWaiting: async () => {}, clients: { claim: async () => {} }, addEventListener: (n, fn) => { events[n] = fn; } },
  });
  async function lifecycle(name) { let pending; events[name]({ waitUntil: p => { pending = p; } }); await pending; }
  async function request(path, mode = 'cors') { let result; events.fetch({ request: { url: new URL(path, base).href, method: 'GET', mode }, respondWith: p => { result = p; } }); return result; }
  return { lifecycle, request, stores, deleted, events };
}

test('All offline assets exist and load from cache at root and GitHub project paths', async () => {
  for (const base of ['https://example.github.io/', 'https://example.github.io/tallvenn/']) {
    const h = harness(base);
    await h.lifecycle('install');
    for (const name of ['index.html', 'app.js', 'core.js', 'learning.js', 'sound.js', 'update.js', 'rewards.js', 'style.css', 'manifest.webmanifest', 'assets/icon-192.png', 'assets/apple-touch-icon.png']) {
      assert.ok((await h.request(name)).bytes.length > 0, name);
    }
    assert.ok((await h.request('?from=home', 'navigate')).bytes.length > 0, 'navigation query falls back to cached entry');
  }
});

test('A cache update preserves other apps on the same GitHub Pages origin', async () => {
  const h = harness('https://example.github.io/tallvenn/');
  h.stores.set('tallvenn:/tallvenn/:0.9.0', new Map());
  h.stores.set('tallvenn:/another-app/:0.9.0', new Map());
  h.stores.set('unrelated-cache', new Map());
  await h.lifecycle('install');
  await h.lifecycle('activate');
  assert.deepEqual(h.deleted, ['tallvenn:/tallvenn/:0.9.0']);
  assert.ok(h.stores.has('tallvenn:/another-app/:0.9.0'));
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
  const h=harness('https://example.github.io/tallvenn/');let reported;
  h.events.message({data:{type:'GET_VERSION'},ports:[{postMessage:data=>{reported=data.version;}}]});
  assert.equal(reported,VERSION);
  const pkg=JSON.parse(await fs.readFile(new URL('package.json',root),'utf8'));
  assert.equal(pkg.version,VERSION);
});
