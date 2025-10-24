const CACHE = 'deckfit-v1';
const OFFLINE_URL = '/deckfit-site/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() =>
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        const accept = event.request.headers.get('accept') || '';
        if (event.request.mode === 'navigate' || accept.includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
      })
    )
  );
});
