// public/service-worker.js
// Egyszerű PWA service worker: cache-el minden szükséges fájlt, offline működéshez

const CACHE_NAME = 'graphly-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/global.css',
  '/manifest.json',
  '/favicon.png',
  // statikus assetek, bővíthető
  // ha vannak további képek, fontok, stb.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Offline fallback: ha index.html-t kér, adjuk vissza
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
