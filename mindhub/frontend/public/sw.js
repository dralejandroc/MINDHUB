// MindHub Healthcare Platform Service Worker
// Version 1.0.2 - Fixed CSP Railway connection issue

const CACHE_NAME = 'mindhub-v1.0.2';
const STATIC_CACHE = 'mindhub-static-v1.0.2';
const DYNAMIC_CACHE = 'mindhub-dynamic-v1.0.2';

// Essential files to cache for offline functionality
const ESSENTIAL_URLS = [
  '/',
  '/manifest.json',
  '/offline',
  // Add critical CSS and JS files here
];

// Healthcare-specific URLs that should always be fresh
const ALWAYS_FRESH_URLS = [
  '/api/',
  '/auth/',
  '/hubs/expedix/patients',
  '/hubs/clinimetrix/assessments',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching essential files...');
        return cache.addAll(ESSENTIAL_URLS);
      })
      .then(() => {
        console.log('[SW] Essential files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache essential files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Clear any cached requests that might have www domain references
        return caches.open(STATIC_CACHE);
      })
      .then((cache) => {
        // Remove any potentially cached manifest.json from www domain
        return cache.delete('https://www.mindhub.cloud/manifest.json');
      })
      .then(() => {
        console.log('[SW] Service worker activated and old www caches cleared');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with healthcare-specific caching strategy
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Skip Supabase auth domains - let Supabase handle its own requests
  if (requestUrl.hostname.includes('supabase.co') ||
      requestUrl.pathname.startsWith('/auth/v1/')) {
    return;
  }
  
  // Force fresh manifest.json to prevent www domain caching issues
  if (requestUrl.pathname === '/manifest.json') {
    event.respondWith(
      fetch(event.request, { 
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached version only if network fails
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Healthcare data should always be fresh
  if (ALWAYS_FRESH_URLS.some(url => requestUrl.pathname.startsWith(url))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses for offline fallback
          if (response.ok && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached version for offline access
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page for critical healthcare functions
              if (requestUrl.pathname.startsWith('/hubs/')) {
                return caches.match('/offline');
              }
              throw new Error('No cached response available');
            });
        })
    );
    return;
  }
  
  // Static assets - cache first strategy
  if (event.request.destination === 'image' || 
      event.request.destination === 'script' || 
      event.request.destination === 'style' ||
      requestUrl.pathname.includes('/_next/static/')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            });
        })
    );
    return;
  }
  
  // Default: network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline');
            }
            throw new Error('No cached response available');
          });
      })
  );
});

// Background sync for healthcare data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'healthcare-data-sync') {
    event.waitUntil(
      syncHealthcareData()
    );
  }
});

// Sync healthcare data when connection is restored
async function syncHealthcareData() {
  try {
    console.log('[SW] Syncing healthcare data...');
    // Implement healthcare-specific sync logic here
    // This could include patient data, assessment results, etc.
  } catch (error) {
    console.error('[SW] Healthcare data sync failed:', error);
  }
}

// Push notifications for healthcare alerts
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have a new healthcare notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('MindHub Healthcare', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});