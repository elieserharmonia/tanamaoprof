
const CACHE_NAME = 'tanamao-v4.0'; // Versão atualizada para forçar refresh
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_URL, '/manifest.json']);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // IGNORAR: APIs externas e métodos não-GET
  if (
    event.request.url.includes('supabase.co') || 
    event.request.url.includes('googleSearch') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // ESTRATÉGIA: Network-First para HTML (Navegação)
  // Isso impede que o navegador carregue um index.html antigo com hashes de JS expirados
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match(OFFLINE_URL))
    );
    return;
  }

  // ESTRATÉGIA: Cache-First para outros assets (JS, CSS, Imagens)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        // Opcional: Cachear dinamicamente assets novos
        if (url.pathname.startsWith('/assets/')) {
          const copy = fetchRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return fetchRes;
      });
    })
  );
});
