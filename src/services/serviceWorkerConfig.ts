/**
 * Service Worker Configuration
 * Manages service worker registration with environment-specific settings
 */

export const registerServiceWorker = async () => {
  // Only register service worker in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[ServiceWorker] Skipping registration in development mode');
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      // Wait for the window to load
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });

          console.log('[ServiceWorker] Registration successful:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  // New service worker activated
                  if (window.confirm('New version available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch (error) {
          console.error('[ServiceWorker] Registration failed:', error);
        }
      });
    } catch (error) {
      console.error('[ServiceWorker] Not supported:', error);
    }
  }
};

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('[ServiceWorker] Unregistered successfully');
    } catch (error) {
      console.error('[ServiceWorker] Unregistration failed:', error);
    }
  }
};

// For development: clear any existing service workers that might cause issues
export const clearServiceWorkersInDev = async () => {
  if (process.env.NODE_ENV === 'development') {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[ServiceWorker] Cleared development service worker');
      }
      
      // Also clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('[ServiceWorker] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }
    }
  }
};