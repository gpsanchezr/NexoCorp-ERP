// Service worker mínimo para NexoCorp — cachea en tiempo de ejecución (no usa
// un precache generado en build) para que el "Modo de un Solo Botón" siga
// funcionando si el mostrador pierde la señal a medio turno.
//
// Estrategia: network-first con fallback a caché. Así el cajero siempre ve la
// versión más reciente cuando hay señal, y la última vista buena cuando no.

const CACHE_NAME = "nexocorp-shell-v1";
const OFFLINE_FALLBACK_URL = "/app/mobile";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_FALLBACK_URL, "/manifest.json"]).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await caches.match(OFFLINE_FALLBACK_URL);
          if (fallback) return fallback;
        }
        return Response.error();
      })
  );
});
