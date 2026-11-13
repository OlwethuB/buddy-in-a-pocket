// =========================================================
// SERVICE WORKER
// File: service-worker.js
// Basic offline app-shell caching for the prototype.
// =========================================================

const CACHE_NAME = "buddy-pocket-v6";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/ai.js",
  "./js/hourly-content.js",
  "./js/timer.js",
  "./js/schedule.js",
  "./js/app.js",
  "./js/dashboard.js",
  "./js/conversation.js",
  "./js/flashcard.js",
  "./js/mood.js",
  "./js/accessibility.js",
  "./js/timetable.js",
  "./js/notes.js",
  "./js/community.js",
  "./js/settings.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put("./index.html", copy)
            );
          }
          return response;
        })
        .catch(async () =>
          (await caches.match(request)) ||
          (await caches.match("./index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(request, copy)
          );
        }
        return response;
      });

      return cached || network;
    })
  );
});
