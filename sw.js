const SCOPE = new URL('./', self.location.href);
const INDEX = new URL('index.html', SCOPE);
const PREFIX = `tallvenn:${SCOPE.pathname}:`;
const VERSION = '1.22.0';
const CACHE = `${PREFIX}${VERSION}`;
const ASSETS = ['./', './index.html', './style.css', './app.js', './core.js', './learning.js', './sound.js', './sound-art.js', './update.js', './rewards.js', './plants.js', './breaks.js', './profiles.js', './illustrations.js', './curriculum.js', './projects.js', './worlds.js', './regions.js', './street-grid.js', './region-roads.js', './map-art.js', './region-scenery.js', './world-landmarks.js', './scenery.js', './transport.js', './project-view.js', './project-picking.js', './landmark-ground.js', './landmark-stories.js', './seasons.js', './project-fireworks.js', './manifest.webmanifest', './assets/icon.svg', './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable.png'];
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
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname) || url.searchParams.has('__tallvenn_published')) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    if (event.request.mode === 'navigate' && (url.pathname === SCOPE.pathname || url.pathname === INDEX.pathname)) return cache.match(INDEX.href);
    return fetch(event.request);
  }));
});
