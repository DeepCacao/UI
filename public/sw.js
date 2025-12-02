const CACHE_NAME = 'cacao-app-v1';
const MODEL_CACHE = 'cacao-model-cache-v1';

const MODEL_URLS = [
  '/_model/best.onnx',
  '/_model/ort-wasm-simd-threaded.wasm',
  '/_model/ort-wasm-simd-threaded.mjs',
  '/_model/ort-wasm-simd-threaded.jsep.wasm',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
        caches.open(MODEL_CACHE).then((cache) => {
            console.log('Caching model files');
            return cache.addAll(MODEL_URLS);
        }),
        caches.open(CACHE_NAME).then((cache) => {
            // Pre-cache essential files if we know them.
            // For now, we rely on runtime caching for pages.
            return cache.addAll([
                '/manifest.webmanifest',
                '/icon-192x192.webp',
                '/icon-512x512.webp'
            ]);
        })
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches if any
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== MODEL_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. Model Files - Cache First
  if (url.pathname.startsWith('/_model/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;
        return fetch(event.request).then((response) => {
           if (!response || response.status !== 200) return response;
           const responseToCache = response.clone();
           caches.open(MODEL_CACHE).then((cache) => {
             cache.put(event.request, responseToCache);
           });
           return response;
        });
      })
    );
    return;
  }

  // 2. Next.js Static Assets (hashed) - Cache First
  if (url.pathname.startsWith('/_next/static/')) {
     event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;
        return fetch(event.request).then((response) => {
           if (!response || response.status !== 200) return response;
           const responseToCache = response.clone();
           caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, responseToCache);
           });
           return response;
        });
      })
    );
    return;
  }

  // 3. Navigation Requests - Network First, Fallback to Cache (specifically /home)
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with latest page
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
            // Network failed. 
            
            // Special handling for root '/': Prefer '/home' if offline as per user request
            if (url.pathname === '/' || url.pathname === '') {
                 return caches.match('/home').then(homeResponse => {
                     if (homeResponse) return homeResponse;
                     // If home not found, try root
                     return caches.match('/').then(rootResponse => {
                         if (rootResponse) return rootResponse;
                         return new Response("Offline - Content not available", { 
                            status: 503, 
                            headers: { 'Content-Type': 'text/plain' } 
                        });
                     });
                 });
            }

            // Try to serve the requested page from cache.
            return caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                
                // If the requested page is not cached, try to serve /home if available
                return caches.match('/home').then((homeResponse) => {
                    if (homeResponse) return homeResponse;
                    
                    // If even home is not cached, try root
                     return caches.match('/').then((rootResponse) => {
                         if (rootResponse) return rootResponse;
                          return new Response("Offline - Content not available", { 
                            status: 503, 
                            headers: { 'Content-Type': 'text/plain' } 
                        });
                     });
                });
            });
        })
    );
    return;
  }
  
  // 4. Other Assets (Images, etc) - Stale While Revalidate
  // We exclude API calls or other things if necessary, but here mostly static.
  event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
            // Only cache valid responses
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
            }
            return networkResponse;
        }).catch(() => {
             // If fetch fails (offline) and we have nothing in cache, we might fail.
             // But this block is for "Stale While Revalidate", so we hopefully returned cachedResponse already.
        });

        return cachedResponse || fetchPromise;
      })
  );
});
