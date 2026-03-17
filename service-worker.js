const CACHE_NAME = 'engelsiz-yol-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Kurulum: Temel dosyaları cache'e al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Önbelleğe alınıyor...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivasyon: Eski cache'leri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Önce cache, yoksa network
self.addEventListener('fetch', (event) => {
  // Google Script POST isteklerini cache'leme
  if (event.request.method === 'POST') return;
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((networkResponse) => {
          // Başarılı yanıtları cache'e ekle
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
      );
    }).catch(() => {
      // Harita tile'ları için offline fallback
      if (event.request.url.includes('tile')) {
        return new Response('', { status: 503, statusText: 'Offline' });
      }
    })
  );
});
