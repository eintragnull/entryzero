const CACHE_NAME = 'eintrag-null-biosphaere-v3';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/bio.html',
  '/ungemessen',
  '/og-image.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  '/starmap_milkyway.jpg',
  '/earth_nasa.jpg',
  '/earth_clouds.jpg',
  '/butterfly_monarch.png',
  '/butterfly_morpho.png',
  '/butterfly_swallowtail.png',
  '/cover.png',
  '/favicon.ico'
];

// 1. Installation: Alle Kern-Dateien & Routen in den Cache laden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core assets for offline availability');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Aktivierung: Alte Cache-Versionen bereinigen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch-Strategie: Cache First mit Network Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/ungemessen') || caches.match('/bio.html') || caches.match('/index.html');
        }
      });
    })
  );
});