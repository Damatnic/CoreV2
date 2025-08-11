/**
 * Simple Workbox Configuration for Testing
 * 
 * Basic configuration to test service worker generation and deployment integration
 */

module.exports = {
  // Source directory for the built application
  globDirectory: 'dist/',
  
  // Files to precache (critical resources)
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,json}'
  ],
  
  // Output service worker location
  swDest: 'dist/sw.js',
  
  // Maximum file size for precaching (5MB for crisis resources)
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  
  // Skip waiting and claim clients immediately
  skipWaiting: true,
  clientsClaim: true,
  
  // Runtime caching strategies
  runtimeCaching: [
    // Crisis resources - cache first strategy
    {
      urlPattern: /\/(crisis-resources|offline-coping-strategies|emergency-contacts)\.json$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'crisis-resources-v1',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    },
    
    // Offline pages - cache first
    {
      urlPattern: /\/(offline|offline-crisis)\.html$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'offline-pages-v1',
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
        }
      }
    },
    
    // API calls - network first with fallback
    {
      urlPattern: /^https:\/\/.*\.netlify\.app\/\.netlify\/functions\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache-v1',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        },
        networkTimeoutSeconds: 10
      }
    },
    
    // Images - stale while revalidate
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images-v1',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    }
  ],
  
  // Navigation fallback for SPA
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/]
};
