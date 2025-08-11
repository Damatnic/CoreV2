/**
 * Astral Core Service Worker
 * 
 * Provides offline functionality, caching strategies, and PWA enhancement
 * for the mental health platform with focus on crisis resource availability.
 */

const CACHE_NAME = 'astral-core-v1.0.0';
const STATIC_CACHE_NAME = 'astral-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'astral-dynamic-v1.0.0';
const CRISIS_CACHE_NAME = 'astral-crisis-v1.0.0';

// Critical resources that must be available offline
const CRITICAL_STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html', // Fallback page
  
  // Core CSS and JS (will be updated with actual build files)
  '/assets/index.css',
  '/assets/index.js',
  
  // Crisis resources (critical for offline access)
  '/crisis',
  '/safety-plan',
  '/crisis-resources',
  '/emergency-contacts'
];

// Crisis-related resources that should be prioritized for caching
const CRISIS_RESOURCES = [
  // API endpoints for crisis features
  '/.netlify/functions/crisis',
  '/.netlify/functions/safety-plan',
  '/.netlify/functions/emergency-contacts',
  
  // Crisis-related pages and components
  '/crisis',
  '/safety-plan',
  '/crisis-chat',
  '/emergency-resources'
];

// Resources to cache on demand (dynamic caching)
const DYNAMIC_CACHE_PATTERNS = [
  // API calls
  /\.netlify\/functions\//,
  
  // Images and media
  /\.(png|jpg|jpeg|gif|webp|svg)$/,
  
  // User-generated content
  /\/api\/posts/,
  /\/api\/chat/,
  /\/api\/wellness/
];

// Network-first patterns (for real-time features)
const NETWORK_FIRST_PATTERNS = [
  // Real-time chat and crisis features
  /\.netlify\/functions\/chat/,
  /\.netlify\/functions\/crisis/,
  /\.netlify\/functions\/sessions/,
  
  // User authentication and sessions
  /\.netlify\/functions\/auth/,
  /\.netlify\/functions\/users/
];

/**
 * Install Event - Cache critical resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical static resources
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching critical static resources');
        return cache.addAll(CRITICAL_STATIC_RESOURCES);
      }),
      
      // Cache crisis resources with high priority
      caches.open(CRISIS_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching crisis resources');
        return cache.addAll(CRISIS_RESOURCES.filter(url => !url.includes('/.netlify/functions/')));
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CRISIS_CACHE_NAME
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

/**
 * Fetch Event - Handle network requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Crisis resources - Cache First with Network Fallback
  if (isCrisisResource(request.url)) {
    event.respondWith(crisisResourceStrategy(request));
    return;
  }
  
  // Real-time features - Network First
  if (isNetworkFirstResource(request.url)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Static resources - Cache First
  if (isStaticResource(request.url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Dynamic content - Stale While Revalidate
  if (isDynamicResource(request.url)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }
  
  // Default - Network First with Cache Fallback
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Crisis Resource Strategy - Prioritize offline access for crisis features
 */
async function crisisResourceStrategy(request) {
  try {
    // Try cache first for crisis resources
    const cachedResponse = await caches.match(request, {
      cacheName: CRISIS_CACHE_NAME
    });
    
    if (cachedResponse) {
      console.log('[SW] Crisis resource served from cache:', request.url);
      
      // Update cache in background if possible
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CRISIS_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
      }).catch(() => {
        // Ignore network errors for background updates
      });
      
      return cachedResponse;
    }
    
    // Try network if not in cache
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(CRISIS_CACHE_NAME);
      await cache.put(request, responseClone);
      console.log('[SW] Crisis resource cached from network:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Crisis resource strategy failed:', error);
    
    // Return offline fallback for crisis pages
    if (request.url.includes('/crisis') || request.url.includes('/safety-plan')) {
      return await caches.match('/offline.html');
    }
    
    throw error;
  }
}

/**
 * Network First Strategy - For real-time features
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/offline.html');
    }
    
    throw error;
  }
}

/**
 * Cache First Strategy - For static resources
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Failed to fetch static resource:', request.url);
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy - For dynamic content
 */
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      const responseClone = response.clone();
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return response;
  }).catch(() => {
    // Ignore network errors for background updates
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network
  return await networkResponsePromise;
}

/**
 * Resource type checking functions
 */
function isCrisisResource(url) {
  return CRISIS_RESOURCES.some(pattern => {
    if (typeof pattern === 'string') {
      return url.includes(pattern);
    }
    return pattern.test(url);
  });
}

function isNetworkFirstResource(url) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

function isStaticResource(url) {
  return CRITICAL_STATIC_RESOURCES.some(resource => {
    if (resource === '/') {
      return url.endsWith('/') && !url.includes('?');
    }
    return url.includes(resource);
  }) || /\.(css|js|woff2?|ttf|eot)$/.test(url);
}

function isDynamicResource(url) {
  return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Background Sync - For offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'crisis-message') {
    event.waitUntil(syncCrisisMessages());
  } else if (event.tag === 'mood-entry') {
    event.waitUntil(syncMoodEntries());
  } else if (event.tag === 'safety-plan-update') {
    event.waitUntil(syncSafetyPlanUpdates());
  }
});

/**
 * Sync crisis messages when back online
 */
async function syncCrisisMessages() {
  try {
    // Get pending crisis messages from IndexedDB
    const pendingMessages = await getPendingCrisisMessages();
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/.netlify/functions/crisis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          await removePendingCrisisMessage(message.id);
          console.log('[SW] Synced crisis message:', message.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync crisis message:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Crisis message sync failed:', error);
  }
}

/**
 * Sync mood entries when back online
 */
async function syncMoodEntries() {
  try {
    const pendingEntries = await getPendingMoodEntries();
    
    for (const entry of pendingEntries) {
      try {
        const response = await fetch('/.netlify/functions/wellness', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry)
        });
        
        if (response.ok) {
          await removePendingMoodEntry(entry.id);
          console.log('[SW] Synced mood entry:', entry.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync mood entry:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Mood entry sync failed:', error);
  }
}

/**
 * Sync safety plan updates when back online
 */
async function syncSafetyPlanUpdates() {
  try {
    const pendingUpdates = await getPendingSafetyPlanUpdates();
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/.netlify/functions/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update)
        });
        
        if (response.ok) {
          await removePendingSafetyPlanUpdate(update.id);
          console.log('[SW] Synced safety plan update:', update.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync safety plan update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Safety plan sync failed:', error);
  }
}

/**
 * IndexedDB helper functions (placeholder implementations)
 * These would integrate with the actual offline storage system
 */
async function getPendingCrisisMessages() {
  // TODO: Implement IndexedDB retrieval
  return [];
}

async function removePendingCrisisMessage(id) {
  // TODO: Implement IndexedDB removal
}

async function getPendingMoodEntries() {
  // TODO: Implement IndexedDB retrieval
  return [];
}

async function removePendingMoodEntry(id) {
  // TODO: Implement IndexedDB removal
}

async function getPendingSafetyPlanUpdates() {
  // TODO: Implement IndexedDB retrieval
  return [];
}

async function removePendingSafetyPlanUpdate(id) {
  // TODO: Implement IndexedDB removal
}

/**
 * Message handling for communication with main thread
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'CACHE_CRISIS_RESOURCE':
      if (payload && payload.url) {
        cacheResource(payload.url, CRISIS_CACHE_NAME).then(() => {
          event.ports[0].postMessage({ success: true });
        }).catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      }
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Helper function to clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

/**
 * Helper function to manually cache a resource
 */
async function cacheResource(url, cacheName) {
  const cache = await caches.open(cacheName);
  const response = await fetch(url);
  
  if (response && response.status === 200) {
    await cache.put(url, response);
    return true;
  }
  
  throw new Error(`Failed to cache resource: ${url}`);
}

console.log('[SW] Service Worker script loaded successfully');
