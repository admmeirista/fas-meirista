/* Meirista FAS — service worker (GitHub Pages).
 * Halaman: jaringan dulu (selalu versi terbaru), salinan terakhir bila offline.
 * Data keuangan (panggilan API ke Apps Script) TIDAK PERNAH di-cache. */
var CACHE = 'mfas-shell-v1';
var SHELL = './';

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.add(SHELL).catch(function () {}); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('mfas-shell-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function timeout(ms) { return new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); }); }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(Promise.race([fetch(req), timeout(8000)]).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(SHELL, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(SHELL).then(function (hit) {
        return hit || new Response('<h3 style="font-family:sans-serif">Offline — buka aplikasi saat ada koneksi internet.</h3>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      });
    }));
    return;
  }
  if (/\.(png|svg|webmanifest)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      });
    }));
  }
});
