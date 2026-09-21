/* Service worker untuk Belanja Logistik Trip Cito */
const CACHE_NAME = 'logistik-trip-cito-v5';

const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* Install: simpan app shell ke cache */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* Activate: bersihkan cache versi lama */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* Fetch: cache-first untuk app shell, network-first (dengan fallback cache) untuk sisanya */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if(cached) return cached;

      return fetch(req)
        .then((res) => {
          // Simpan salinan response yang valid ke cache (termasuk library CDN jsPDF)
          if(res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')){
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => {
          // Offline & tidak ada di cache: untuk navigasi halaman, kembalikan app shell
          if(req.mode === 'navigate'){
            return caches.match('./index.html');
          }
        });
    })
  );
});
