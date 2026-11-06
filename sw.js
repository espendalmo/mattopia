const PREFIX = `tallvenn:${new URL('./', self.location.href).pathname}:`;
const VERSION = '1.2.2';
const CACHE = `${PREFIX}${VERSION}`;
const ASSETS = ['./', './index.html', './style.css', './app.js', './core.js', './learning.js', './sound.js', './update.js', './rewards.js', './manifest.webmanifest', './assets/icon.svg', './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable.png'];
let activationReady = Promise.resolve();
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Fetch a fresh release rather than copying old HTTP-cached app files.
    const entries = await Promise.all(ASSETS.map(async path => {
      const key = new URL(path, self.location.href);
      const fresh = new URL(key); fresh.searchParams.set('__tallvenn_release', VERSION);
      const response = await fetch(new Request(fresh, {cache:'reload', credentials:'same-origin'}));
      if (!response.ok) throw new Error('Incomplete app download');
      return [key.href, response];
    }));
    const cache = await caches.open(CACHE);
    await Promise.all(entries.map(([key, response]) => cache.put(key, response)));
    await self.skipWaiting();
  })());
  // Activate a complete cached bundle. Never reload or interrupt open pages.
});
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_VERSION') event.waitUntil(activationReady.then(() => event.ports[0]?.postMessage({ version: VERSION })));
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'CLAIM_CLIENTS') event.waitUntil(self.clients.claim());
});
self.addEventListener('activate', event => {
  activationReady = caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim());
  event.waitUntil(activationReady);
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location.href).pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    if (event.request.mode === 'navigate') return cache.match('./index.html');
    return fetch(event.request);
  }));
});
