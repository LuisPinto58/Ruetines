const CACHE_NAME = "ruetines-v2";
const APP_SHELL = [
  "./html/tasks.html",
  "./css/index.css",
  "./css/tasks.css",
  "./css/components.css",
  "./js/views/navbar-view.js",
  "./js/views/tasks-view.js",
  "./js/controller/tasks-controller.js",
  "./js/models/tasks-model.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).catch(() => caches.match("./html/tasks.html"));
    })
  );
});