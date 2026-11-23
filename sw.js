// Service worker: makes the site installable and usable offline.
// Strategy is network-first, so an online visitor always gets the latest
// deploy; the cache is only read when the network is unavailable.
// All URLs are relative to this file, so it works under any baseurl.

const CACHE = 'app-cache-v1';

const PRECACHE = [
  './',
  'style.css',
  'js/jquery-1.11.0.js',
  'js/bootstrap.min.js',
  'js/jquery.easing.min.js',
  'js/classie.js',
  'js/cbpAnimatedHeader.js',
  'js/jqBootstrapValidation.js',
  'js/agency.js',
  'img/favicon/android-icon-192x192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // One missing file must not block installation, so add them one by one.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Leave non-GET and third-party requests (fonts, analytics, CDN) to the browser.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
        if (cached) return cached;
        // Offline and never visited: fall back to the home page for navigations.
        if (request.mode === 'navigate') {
          const home = await caches.match('./');
          if (home) return home;
        }
        return Response.error();
      })
  );
});
