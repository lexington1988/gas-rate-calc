// sw.js
self.addEventListener('install', event => {
  self.skipWaiting(); // Optional: activate immediately
});

self.addEventListener('activate', event => {
  // Optional: cleanup old caches
});

self.addEventListener('fetch', event => {
  // Optional: enable caching here
});
