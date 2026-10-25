// Only the public offline document and its two fonts are cached. No sessions, credentials, API
// responses, dashboard HTML, mutations or background redemption queue.
const CACHE = "movrr-partner-offline-v3";
const OFFLINE = "/offline.html";
// Exact public presentation assets only; never expand to runtime caching.
const PUBLIC = [OFFLINE, "/fonts/jakarta-400.ttf", "/fonts/lexend-700.ttf"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PUBLIC)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith("movrr-partner-offline-") && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method === "GET" && PUBLIC.includes(new URL(request.url).pathname) && new URL(request.url).origin === self.location.origin) {
    event.respondWith(caches.match(request, { cacheName: CACHE }).then(cached => cached || fetch(request)));
    return;
  }
  if (request.method !== "GET" || request.mode !== "navigate" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).catch(async () =>
    (await caches.match(OFFLINE, { cacheName: CACHE })) || Response.error()));
});
