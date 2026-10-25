// Only the public offline document is cached. No sessions, credentials, API
// responses, dashboard HTML, mutations or background redemption queue.
const CACHE = "movrr-partner-offline-v2";
const OFFLINE = "/offline.html";
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(OFFLINE)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith("movrr-partner-offline-") && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).catch(async () =>
    (await caches.match(OFFLINE, { cacheName: CACHE })) || Response.error()));
});
