// Simple passthrough Service Worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass through requests (Network Only strategy for Dev safety)
    event.respondWith(fetch(event.request));
});