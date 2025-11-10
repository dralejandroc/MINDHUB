// // MindHub Healthcare Platform Service Worker
// // Version 1.0.3 - Updated backend URLs and fixed caching

// // Version 1.0.4 - Fix: don't cache HTML or _next/data
// const CACHE_NAME = 'mindhub-v1.0.4';
// const STATIC_CACHE = 'mindhub-static-v1.0.4';
// const DYNAMIC_CACHE = 'mindhub-dynamic-v1.0.4';

// // Essential files to cache for offline functionality
// const ESSENTIAL_URLS = [
//   '/',
//   '/manifest.json',
//   '/offline',
//   // Add critical CSS and JS files here
// ];

// // Healthcare-specific URLs that should always be fresh
// const ALWAYS_FRESH_URLS = [
//   '/api/',
//   '/auth/',
//   '/hubs/expedix/patients',
//   '/hubs/clinimetrix/assessments',
// ];

// // Install event - cache essential resources
// self.addEventListener('install', (event) => {
//   console.log('[SW] Installing service worker...');
  
//   event.waitUntil(
//     caches.open(STATIC_CACHE)
//       .then((cache) => {
//         console.log('[SW] Caching essential files...');
//         return cache.addAll(ESSENTIAL_URLS);
//       })
//       .then(() => {
//         console.log('[SW] Essential files cached successfully');
//         return self.skipWaiting();
//       })
//       .catch((error) => {
//         console.error('[SW] Failed to cache essential files:', error);
//       })
//   );
// });

// // Activate event - clean up old caches
// self.addEventListener('activate', (event) => {
//   console.log('[SW] Activating service worker...');
  
//   event.waitUntil(
//     caches.keys()
//       .then((cacheNames) => {
//         return Promise.all(
//           cacheNames.map((cacheName) => {
//             if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
//               console.log('[SW] Deleting old cache:', cacheName);
//               return caches.delete(cacheName);
//             }
//           })
//         );
//       })
//       .then(() => {
//         // Clear any cached requests that might have www domain references
//         return caches.open(STATIC_CACHE);
//       })
//       .then((cache) => {
//         // Remove any potentially cached manifest.json from www domain
//         return cache.delete('https://www.mindhub.cloud/manifest.json');
//       })
//       .then(() => {
//         console.log('[SW] Service worker activated and old www caches cleared');
//         return self.clients.claim();
//       })
//   );
// });

// // Fetch event - handle requests with healthcare-specific caching strategy
// self.addEventListener('fetch', (event) => {
//   const requestUrl = new URL(event.request.url);
  
//   // Skip non-HTTP requests
//   if (!event.request.url.startsWith('http')) {
//     return;
//   }
  
//   // Skip Supabase auth domains - let Supabase handle its own requests
//   if (requestUrl.hostname.includes('supabase.co') ||
//       requestUrl.pathname.startsWith('/auth/v1/')) {
//     return;
//   }
  
//   // Force fresh manifest.json to prevent www domain caching issues
//   if (requestUrl.pathname === '/manifest.json') {
//     event.respondWith(
//       fetch(event.request, { 
//         cache: 'no-cache',
//         headers: {
//           'Cache-Control': 'no-cache'
//         }
//       })
//         .then((response) => {
//           if (response.ok) {
//             const responseClone = response.clone();
//             caches.open(STATIC_CACHE)
//               .then((cache) => {
//                 cache.put(event.request, responseClone);
//               });
//           }
//           return response;
//         })
//         .catch(() => {
//           // Fallback to cached version only if network fails
//           return caches.match(event.request);
//         })
//     );
//     return;
//   }
  
//   // Healthcare data should always be fresh
//   if (ALWAYS_FRESH_URLS.some(url => requestUrl.pathname.startsWith(url))) {
//     event.respondWith(
//       fetch(event.request)
//         .then((response) => {
//           // Cache successful API responses for offline fallback
//           if (response.ok && event.request.method === 'GET') {
//             const responseClone = response.clone();
//             caches.open(DYNAMIC_CACHE)
//               .then((cache) => {
//                 cache.put(event.request, responseClone);
//               });
//           }
//           return response;
//         })
//         .catch(() => {
//           // Fallback to cached version for offline access
//           return caches.match(event.request)
//             .then((cachedResponse) => {
//               if (cachedResponse) {
//                 return cachedResponse;
//               }
//               // Return offline page for critical healthcare functions
//               if (requestUrl.pathname.startsWith('/hubs/')) {
//                 return caches.match('/offline');
//               }
//               throw new Error('No cached response available');
//             });
//         })
//     );
//     return;
//   }
  
//   // Static assets - cache first strategy
//   if (event.request.destination === 'image' || 
//       event.request.destination === 'script' || 
//       event.request.destination === 'style' ||
//       requestUrl.pathname.includes('/_next/static/')) {
    
//     event.respondWith(
//       caches.match(event.request)
//         .then((cachedResponse) => {
//           if (cachedResponse) {
//             return cachedResponse;
//           }
          
//           return fetch(event.request)
//             .then((response) => {
//               if (response.ok) {
//                 const responseClone = response.clone();
//                 caches.open(STATIC_CACHE)
//                   .then((cache) => {
//                     cache.put(event.request, responseClone);
//                   });
//               }
//               return response;
//             });
//         })
//     );
//     return;
//   }
  
//   // Default: network first, fallback to cache
//   event.respondWith(
//     fetch(event.request)
//       .then((response) => {
//         // Cache successful GET responses
//         if (response.ok && event.request.method === 'GET') {
//           const responseClone = response.clone();
//           caches.open(DYNAMIC_CACHE)
//             .then((cache) => {
//               cache.put(event.request, responseClone);
//             });
//         }
//         return response;
//       })
//       .catch(() => {
//         return caches.match(event.request)
//           .then((cachedResponse) => {
//             if (cachedResponse) {
//               return cachedResponse;
//             }
//             // Fallback to offline page
//             if (event.request.mode === 'navigate') {
//               return caches.match('/offline');
//             }
//             throw new Error('No cached response available');
//           });
//       })
//   );
// });

// // Background sync for healthcare data
// self.addEventListener('sync', (event) => {
//   console.log('[SW] Background sync triggered:', event.tag);
  
//   if (event.tag === 'healthcare-data-sync') {
//     event.waitUntil(
//       syncHealthcareData()
//     );
//   }
// });

// // Sync healthcare data when connection is restored
// async function syncHealthcareData() {
//   try {
//     console.log('[SW] Syncing healthcare data...');
//     // Implement healthcare-specific sync logic here
//     // This could include patient data, assessment results, etc.
//   } catch (error) {
//     console.error('[SW] Healthcare data sync failed:', error);
//   }
// }

// // Push notifications for healthcare alerts
// self.addEventListener('push', (event) => {
//   console.log('[SW] Push notification received');
  
//   const options = {
//     body: 'You have a new healthcare notification',
//     icon: '/icon-192x192.png',
//     badge: '/icon-192x192.png',
//     vibrate: [200, 100, 200],
//     data: {
//       dateOfArrival: Date.now(),
//       primaryKey: '1'
//     },
//     actions: [
//       {
//         action: 'explore',
//         title: 'View Details',
//         icon: '/icon-192x192.png'
//       },
//       {
//         action: 'close',
//         title: 'Dismiss',
//         icon: '/icon-192x192.png'
//       }
//     ]
//   };
  
//   event.waitUntil(
//     self.registration.showNotification('MindHub Healthcare', options)
//   );
// });

// // Handle notification clicks
// self.addEventListener('notificationclick', (event) => {
//   console.log('[SW] Notification clicked:', event.action);
  
//   event.notification.close();
  
//   if (event.action === 'explore') {
//     event.waitUntil(
//       clients.openWindow('/')
//     );
//   }
// });

// self.addEventListener('message', (event) => {
//   if (event.data && event.data.type === 'SKIP_WAITING') {
//     self.skipWaiting();
//   }
// });


/* ============================================================================
   MindHub Healthcare Platform Service Worker
   Version 1.0.4 — Fix: no cachear HTML ni /_next/data; SWR para estáticos; 
   limpieza de caches antiguas; network-first para APIs críticas
   ============================================================================ */

const CACHE_VERSION = 'v1.0.4';
const STATIC_CACHE = `mindhub-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mindhub-dynamic-${CACHE_VERSION}`;

// Archivos esenciales para modo offline (agrega tu /offline real)
const ESSENTIAL_URLS = [
  '/',
  '/manifest.json',
  '/offline',
];

// Endpoints que SIEMPRE deben ser frescos (se guardan solo como fallback)
const ALWAYS_FRESH_URLS = [
  '/api/',
  '/auth/',
  '/hubs/expedix/patients',
  '/hubs/clinimetrix/assessments',
];

/* ----------------------------- INSTALL ----------------------------------- */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing…', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(ESSENTIAL_URLS);
        console.log('[SW] Essential cached');
      } catch (err) {
        console.warn('[SW] Failed to precache essentials:', err);
      } finally {
        // Pasar a 'activate' sin esperar
        self.skipWaiting();
      }
    })()
  );
});

/* ----------------------------- ACTIVATE ---------------------------------- */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating…', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== STATIC_CACHE && name !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );

      // Tomar control inmediato de las páginas
      await self.clients.claim();
      console.log('[SW] Activated & claimed');
    })()
  );
});

/* ----------------------------- MESSAGES ---------------------------------- */
// Permite a la app pedir skipWaiting()
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ------------------------------- FETCH ----------------------------------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignorar peticiones no-HTTP
  if (!url.protocol.startsWith('http')) return;

  // Ignorar dominios de Supabase/Auth (que manejen sus propios flujos)
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/auth/v1/')) return;

  /* 0) NAVEGACIONES (HTML): NUNCA cachear
     - Evita que se “congelen” páginas en el tiempo.
     - Network-first con no-store; fallback a /offline si no hay red. */
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        return fresh;
      } catch (err) {
        const offline = await caches.match('/offline');
        if (offline) return offline;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  /* 1) manifest.json: siempre fresco, guardado como fallback */
  if (url.pathname === '/manifest.json') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-cache', headers: { 'Cache-Control': 'no-cache' } });
        if (res.ok) {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(req, clone));
        }
        return res;
      } catch {
        const cached = await caches.match(req);
        return cached || new Response('{}', { headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  /* 2) Rutas de datos de Next (/ _next/data /...): no cachear (muy sensibles a versión) */
  if (url.pathname.startsWith('/_next/data/')) {
    event.respondWith((async () => {
      try {
        return await fetch(req, { cache: 'no-store' });
      } catch {
        // fallback opcional
        const cached = await caches.match(req);
        return (
          cached ||
          new Response(JSON.stringify({ offline: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          })
        );
      }
    })());
    return;
  }

  /* 3) APIs/URLs sensibles (ALWAYS_FRESH_URLS): network-first + cache como fallback */
  if (ALWAYS_FRESH_URLS.some(prefix => url.pathname.startsWith(prefix))) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        // Guardar GETs exitosos como fallback (NO bloquear HTML aquí)
        if (res.ok && req.method === 'GET') {
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('text/html')) {
            const clone = res.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(req, clone));
          }
        }
        return res;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;

        // Si es sección /hubs sin red, intenta /offline
        if (url.pathname.startsWith('/hubs/')) {
          const offline = await caches.match('/offline');
          if (offline) return offline;
        }

        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  /* 4) Estáticos (imagenes, scripts, estilos y /_next/static): stale-while-revalidate */
  if (
    req.destination === 'image' ||
    req.destination === 'script' ||
    req.destination === 'style' ||
    url.pathname.includes('/_next/static/')
  ) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  /* 5) Default: network-first para GET no-HTML; fallback a cache
        - NO cachear HTML aquí tampoco. */
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && req.method === 'GET') {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('text/html')) {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(req, clone));
        }
      }
      return res;
    } catch {
      const cached = await caches.match(req);
      if (cached) return cached;

      if (req.mode === 'navigate') {
        const offline = await caches.match('/offline');
        if (offline) return offline;
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});

/* --------------------------- BACKGROUND SYNC ------------------------------ */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'healthcare-data-sync') {
    event.waitUntil(syncHealthcareData());
  }
});

async function syncHealthcareData() {
  try {
    console.log('[SW] Syncing healthcare data…');
    // TODO: lógica de sync (pacientes, evaluaciones, etc.)
  } catch (err) {
    console.error('[SW] Healthcare sync failed:', err);
  }
}

/* ------------------------------ PUSH ------------------------------------- */
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  const options = {
    body: 'You have a new healthcare notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: { dateOfArrival: Date.now(), primaryKey: '1' },
    actions: [
      { action: 'explore', title: 'View Details', icon: '/icon-192x192.png' },
      { action: 'close', title: 'Dismiss', icon: '/icon-192x192.png' },
    ],
  };
  event.waitUntil(self.registration.showNotification('MindHub Healthcare', options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});
