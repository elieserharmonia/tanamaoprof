
const CACHE_NAME = 'tanamao-v3.0'; // Versão incrementada para forçar refresh total
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar requisições para APIs externas (Supabase, Google Search)
  if (
    event.request.url.includes('supabase.co') || 
    event.request.url.includes('googleSearch') ||
    event.request.method !== 'GET'
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna cache ou busca na rede
      return response || fetch(event.request).catch(() => {
        // Fallback básico se offline
        return caches.match('/');
      });
    })
  );
});
