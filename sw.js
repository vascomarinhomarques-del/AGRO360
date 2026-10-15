const CACHE_NAME = 'agro360-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './pages/sobre.html',
  './pages/offline.html',
  './manifest.json',
  './assets/css/styles.css',
  './assets/images/logo.svg',
  './assets/js/app.js',
  './assets/js/modules/UI.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('agro360-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch((error) => {
              console.error('Não foi possível guardar a página para utilização offline.', error);
            }));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('./pages/offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch((error) => {
            console.error('Não foi possível guardar o recurso para utilização offline.', error);
          }));
        }
        return response;
      });
    })
  );
});