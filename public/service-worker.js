/**
 * Service Worker for CoreV2 PWA
 * Handles offline functionality, caching, and background sync
 */

const CACHE_NAME = 'corev2-v1.0.0';
const RUNTIME_CACHE = 'corev2-runtime';
const CRISIS_CACHE = 'corev2-crisis';
const SYNC_CACHE = 'corev2-sync-queue';
const SYNC_TAG = 'data-sync';

// Critical resources that must be cached
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/offline-crisis.html',
  '/crisis',
  '/crisis-resources',
  '/crisis-resources.json',
  '/emergency-contacts.json',
  '/offline-coping-strategies.json',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Resources to cache on install
const STATIC_RESOURCES = [
  '/src/index.css',
  '/src/main.tsx',
  '/src/App.tsx'
];

// Crisis-specific resources to always keep cached
const CRISIS_RESOURCES = [
  '/crisis',
  '/crisis-resources',
  '/crisis-resources.json',
  '/emergency-contacts.json',
  '/offline-coping-strategies.json',
  '/offline-crisis.html',
  '/safety-plan'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      // Cache crisis resources separately for priority access
      caches.open(CRISIS_CACHE).then((cache) => {
        console.log('[Service Worker] Caching crisis resources');
        return cache.addAll(CRISIS_RESOURCES);
      })
    ]).then(() => {
      console.log('[Service Worker] Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('corev2-') && 
                   cacheName !== CACHE_NAME && 
                   cacheName !== RUNTIME_CACHE &&
                   cacheName !== CRISIS_CACHE &&
                   cacheName !== SYNC_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[Service Worker] Activation complete');
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Crisis resources - always serve from cache first for speed
  if (isCrisisResource(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Update cache in background
          fetchAndCache(request, CRISIS_CACHE);
          return cachedResponse;
        }
        return fetchAndCache(request, CRISIS_CACHE);
      })
    );
    return;
  }

  // API calls - network first with background sync fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response before caching
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          } else if (!response.ok && request.method !== 'GET') {
            // Queue failed non-GET requests for background sync
            queueForSync(request, response);
          }
          return response;
        })
        .catch(async (error) => {
          // Network failed - check if this is a modifying request
          if (request.method !== 'GET') {
            // Queue for background sync
            const offlineResponse = new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'Request queued for sync',
                queued: true 
              }),
              { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
            await queueForSync(request, offlineResponse);
            return offlineResponse;
          }
          
          // For GET requests, return cached API response if available
          return caches.match(request);
        })
    );
    return;
  }

  // Static resources - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        // Clone response before caching
        const responseToCache = response.clone();
        
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Offline fallback
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-assessments') {
    event.waitUntil(syncAssessments());
  } else if (event.tag === 'sync-crisis-report') {
    event.waitUntil(syncCrisisReport());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'CoreV2 Notification', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false
  };

  // Special handling for crisis notifications
  if (data.type === 'crisis') {
    options.requireInteraction = true;
    options.actions = [
      { action: 'view', title: 'View Resources' },
      { action: 'call', title: 'Call Hotline' }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'CoreV2', options)
  );
});

// Background sync handler
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_TAG) {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  console.log('[Service Worker] Processing background sync...');
  
  try {
    // Get sync queue from cache
    const cache = await caches.open(SYNC_CACHE);
    const requests = await cache.keys();
    
    const results = [];
    
    for (const request of requests) {
      try {
        // Attempt to send the request
        const response = await fetch(request.clone());
        
        if (response.ok) {
          // Success - remove from cache
          await cache.delete(request);
          results.push({
            success: true,
            requestId: request.headers.get('X-Sync-Request-Id'),
            response: await response.json()
          });
        } else {
          // Server error - keep in queue for retry
          console.error('[Service Worker] Sync failed with status:', response.status);
          results.push({
            success: false,
            requestId: request.headers.get('X-Sync-Request-Id'),
            error: `Server error: ${response.status}`
          });
        }
      } catch (error) {
        // Network error - keep in queue for retry
        console.error('[Service Worker] Sync request failed:', error);
        results.push({
          success: false,
          requestId: request.headers ? request.headers.get('X-Sync-Request-Id') : null,
          error: error.message
        });
      }
    }
    
    // Notify clients of sync results
    const allClients = await self.clients.matchAll();
    allClients.forEach(client => {
      client.postMessage({
        type: 'sync-complete',
        results: results
      });
    });
    
    console.log('[Service Worker] Background sync complete');
  } catch (error) {
    console.error('[Service Worker] Background sync error:', error);
    throw error; // Re-throw to trigger retry
  }
}

// Queue failed requests for background sync
async function queueForSync(request, response) {
  // Only queue API requests
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) {
    return response;
  }
  
  // Clone request for caching
  const requestClone = request.clone();
  
  try {
    // Add to sync cache
    const cache = await caches.open(SYNC_CACHE);
    await cache.put(requestClone, response.clone());
    
    // Register for background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register(SYNC_TAG);
      console.log('[Service Worker] Queued for background sync:', request.url);
    }
  } catch (error) {
    console.error('[Service Worker] Failed to queue for sync:', error);
  }
  
  return response;
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'call') {
    // Open crisis hotline
    event.waitUntil(
      clients.openWindow('tel:988')
    );
  } else if (event.action === 'view') {
    // Open crisis resources
    event.waitUntil(
      clients.openWindow('/crisis-resources')
    );
  } else {
    // Open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_URLS') {
    cacheUrls(event.data.urls);
  } else if (event.data.type === 'CLEAR_CACHE') {
    clearCache(event.data.cacheName);
  }
});

// Helper functions

function isCrisisResource(pathname) {
  return CRISIS_RESOURCES.some(resource => pathname.startsWith(resource));
}

function fetchAndCache(request, cacheName) {
  return fetch(request).then((response) => {
    if (response.ok) {
      const responseToCache = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseToCache);
      });
    }
    return response;
  }).catch(() => {
    // Return offline page for document requests
    if (request.destination === 'document') {
      if (isCrisisResource(new URL(request.url).pathname)) {
        return caches.match('/offline-crisis.html');
      }
      return caches.match('/offline.html');
    }
  });
}

async function syncMessages() {
  console.log('[Service Worker] Syncing messages...');
  // Implement message sync logic
  try {
    const cache = await caches.open('offline-messages');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Send to server
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // Remove from cache after successful sync
      await cache.delete(request);
    }
  } catch (error) {
    console.error('[Service Worker] Message sync failed:', error);
    throw error; // Retry sync
  }
}

async function syncAssessments() {
  console.log('[Service Worker] Syncing assessments...');
  // Implement assessment sync logic
  try {
    const cache = await caches.open('offline-assessments');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Send to server
      await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // Remove from cache after successful sync
      await cache.delete(request);
    }
  } catch (error) {
    console.error('[Service Worker] Assessment sync failed:', error);
    throw error; // Retry sync
  }
}

async function syncCrisisReport() {
  console.log('[Service Worker] Syncing crisis report...');
  // Implement crisis report sync with high priority
  try {
    const cache = await caches.open('offline-crisis-reports');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Send to server with high priority
      await fetch('/api/crisis/report', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Priority': 'high'
        },
        body: JSON.stringify(data)
      });
      
      // Remove from cache after successful sync
      await cache.delete(request);
    }
  } catch (error) {
    console.error('[Service Worker] Crisis report sync failed:', error);
    // Don't throw - crisis reports should not block other syncs
  }
}

function cacheUrls(urls) {
  caches.open(RUNTIME_CACHE).then((cache) => {
    cache.addAll(urls);
  });
}

function clearCache(cacheName) {
  if (cacheName) {
    caches.delete(cacheName);
  } else {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((name) => {
        if (name.startsWith('corev2-')) {
          caches.delete(name);
        }
      });
    });
  }
}

// Log service worker version
console.log('[Service Worker] Version 1.0.0');