// sw.js — DeckFit (GitHub Pages)
const CACHE = 'deckfit-v3';
const OFFLINE_URL = '/deckfit-site/offline.html';

// ✅ Fichiers indispensables en hors-ligne (pré-cache)
const PRECACHE = [
  '/deckfit-site/',
  '/deckfit-site/index.html',
  '/deckfit-site/manifest.webmanifest',
  '/deckfit-site/DECKFIT%20-%20Leroy%20Coaching%20971_fichiers/main.ca2ac1c1.js',
  '/deckfit-site/DECKFIT%20-%20Leroy%20Coaching%20971_fichiers/main.e279b2ac.css',
  '/deckfit-site/DECKFIT%20-%20Leroy%20Coaching%20971_fichiers/LOGO.jpg',
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
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
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) Pages HTML -> Network first (avec repli cache puis offline)
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        return cached || caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // 2) Assets statiques (js, css, images, polices) -> Cache first
  if (/\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
          return res;
        }).catch(() => cached); // si réseau KO, on rend ce qu'on a (ou rien)
      })
    );
    return;
  }

  // 3) Le reste -> réseau puis cache
  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => caches.match(req))
  );
});
