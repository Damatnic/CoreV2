/**
 * Enhanced Workbox Configuration for PWA Features
 * 
 * Comprehensive service worker with enhanced offline support,
 * crisis-specific optimizations, and improved caching strategies
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
  
  // Mode for importing workbox libraries
  mode: 'production',
  
  // Maximum file size for precaching (10MB for enhanced resources)
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  
  // Skip waiting and claim clients immediately
  skipWaiting: true,
  clientsClaim: true,
  
  // Clean up outdated caches automatically
  cleanupOutdatedCaches: true,
  
  // Additional manifest transformations for crisis priority
  manifestTransforms: [
    (manifestEntries) => {
      // Add crisis priority to critical resources
      const transformedEntries = manifestEntries.map(entry => {
        if (entry.url.includes('crisis') || entry.url.includes('emergency')) {
          entry.revision = `crisis-${entry.revision}`;
        }
        return entry;
      });
      return { manifest: transformedEntries };
    }
  ],
  
  // Runtime caching strategies
  runtimeCaching: [
    // Crisis resources - cache first strategy with extended storage
    {
      urlPattern: /\/(crisis-resources|offline-coping-strategies|emergency-contacts)\.json$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'crisis-resources-v2',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days for crisis resources
          purgeOnQuotaError: false // Never purge crisis resources
        }
      }
    },
    
    // Offline pages - cache first with high priority
    {
      urlPattern: /\/(offline|offline-crisis)\.html$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'offline-pages-v2',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          purgeOnQuotaError: false
        }
      }
    },
    
    // API calls - network first with extended timeout
    {
      urlPattern: /^https:\/\/.*\.netlify\.app\/\.netlify\/functions\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache-v2',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        },
        networkTimeoutSeconds: 15
      }
    },
    
    // Crisis-specific API endpoints - cache first for immediate access
    {
      urlPattern: /\/\.netlify\/functions\/(crisis|emergency|help)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'crisis-api-v2',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          purgeOnQuotaError: false
        }
      }
    },
    
    // Helper availability updates - stale while revalidate for real-time data
    {
      urlPattern: /\/\.netlify\/functions\/(helpers|availability)/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'helper-availability-v2',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 10 // 10 minutes
        }
      }
    },
    
    // Images - stale while revalidate with larger cache
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images-v2',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    },
    
    // Static assets - cache first with long expiration
    {
      urlPattern: /\.(?:js|css|woff2|ttf)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets-v2',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    },
    
    // Third-party resources - stale while revalidate
    {
      urlPattern: /^https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.)/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'third-party-v2',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
        }
      }
    }
  ],
  
  // Navigation fallback strategy for SPA routing
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [
    /^\/_/,
    /\/[^/?]+\.[^/]+$/,
    /\/api\//,
    /\/\.netlify\/functions\//
  ],
  
  // Disable offline Google Analytics for privacy
  offlineGoogleAnalytics: false
};
