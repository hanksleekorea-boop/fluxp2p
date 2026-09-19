const CACHE = 'flux-public-catalog-v3';
const ASSETS = ['/', '/index.html', '/help.html', '/privacy.html', '/manifest.webmanifest', '/release-manifest.json', '/icon-192.png', '/icon-512.png'];
const SAME_ORIGIN = new Set(ASSETS);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('flux-public-') && key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname === '' ? '/' : url.pathname;
  const cacheable = SAME_ORIGIN.has(path);
  event.respondWith(fetch(event.request).then(response => {
    if (cacheable && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(path, copy));
    }
    return response;
  }).catch(() => caches.match(path).then(hit => {
    if (hit) return hit;
    return event.request.mode === 'navigate' ? caches.match('/index.html') : Response.error();
  })));
});
