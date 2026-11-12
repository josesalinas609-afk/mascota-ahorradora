// Mascota Ahorradora: modo sin internet.
// Para publicar una versión nueva, cambia el número de VERSION.
const VERSION = 'ahorradora-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Archivos de la app: primero la red (así llegan las actualizaciones), si no hay internet, la copia guardada.
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('index.html')))
    );
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // Tipografías: se usan las guardadas y se refrescan en segundo plano.
    e.respondWith(
      caches.open(VERSION).then((c) =>
        c.match(req).then((m) => {
          const net = fetch(req)
            .then((res) => { c.put(req, res.clone()); return res; })
            .catch(() => m || Response.error());
          return m || net;
        })
      )
    );
  }
});
