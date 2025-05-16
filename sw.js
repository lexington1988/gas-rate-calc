const CACHE_NAME = 'ppc-gas-rate-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/icon.png',
  '/beep.mp3',
  '/end-beep.mp3',
  'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2' // external library
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
