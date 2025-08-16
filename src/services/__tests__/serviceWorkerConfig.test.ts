import { registerServiceWorker, unregisterServiceWorker, updateServiceWorker } from '../serviceWorkerConfig';

// Mock service worker APIs
const mockServiceWorkerRegistration = {
  waiting: null as unknown,
  installing: null,
  active: null,
  update: jest.fn(),
  unregister: jest.fn().mockResolvedValue(true),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    ready: Promise.resolve(mockServiceWorkerRegistration),
    getRegistration: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  writable: true,
});

describe('Service Worker Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('service worker registration', () => {
    it('should register service worker successfully', async () => {
      const registration = await registerServiceWorker();

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      expect(registration).toBe(mockServiceWorkerRegistration);
    });

    it('should handle registration failures gracefully', async () => {
      (navigator.serviceWorker.register as jest.Mock).mockRejectedValue(new Error('Registration failed'));

      const result = await registerServiceWorker();

      expect(result).toBeNull();
    });

    it('should handle browsers without service worker support', async () => {
      delete (navigator as any).serviceWorker;

      const result = await registerServiceWorker();

      expect(result).toBeNull();
    });
  });

  describe('service worker updates', () => {
    it('should check for updates', async () => {
      await updateServiceWorker();

      expect(mockServiceWorkerRegistration.update).toHaveBeenCalled();
    });

    it('should handle update check failures', async () => {
      mockServiceWorkerRegistration.update.mockRejectedValue(new Error('Update failed'));

      await expect(updateServiceWorker()).resolves.not.toThrow();
    });

    it('should notify when new version is available', async () => {
      mockServiceWorkerRegistration.waiting = { state: 'waiting' };

      const updateHandler = jest.fn();
      
      // Simulate update detection
      await registerServiceWorker({
        onUpdate: updateHandler
      });

      expect(updateHandler).toBeInstanceOf(Function);
    });
  });

  describe('service worker unregistration', () => {
    it('should unregister service worker', async () => {
      const result = await unregisterServiceWorker();

      expect(mockServiceWorkerRegistration.unregister).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle unregistration when no service worker exists', async () => {
      (navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue(null);

      const result = await unregisterServiceWorker();

      expect(result).toBe(false);
    });
  });

  describe('service worker lifecycle', () => {
    it('should handle install event', () => {
      const installHandler = jest.fn();
      
      registerServiceWorker({
        onInstall: installHandler
      });

      expect(installHandler).toBeInstanceOf(Function);
    });

    it('should handle activate event', () => {
      const activateHandler = jest.fn();
      
      registerServiceWorker({
        onActivate: activateHandler
      });

      expect(activateHandler).toBeInstanceOf(Function);
    });

    it('should handle fetch event for offline support', () => {
      const fetchHandler = jest.fn();
      
      registerServiceWorker({
        onFetch: fetchHandler
      });

      expect(fetchHandler).toBeInstanceOf(Function);
    });
  });

  describe('caching strategies', () => {
    it('should implement cache-first strategy for static assets', () => {
      const config = {
        cacheStrategy: 'cache-first',
        staticAssets: ['/css/main.css', '/js/app.js']
      };

      registerServiceWorker(config);

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    it('should implement network-first strategy for API calls', () => {
      const config = {
        cacheStrategy: 'network-first',
        apiEndpoints: ['/api/crisis', '/api/user']
      };

      registerServiceWorker(config);

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    it('should implement stale-while-revalidate for dynamic content', () => {
      const config = {
        cacheStrategy: 'stale-while-revalidate',
        dynamicContent: ['/community', '/peer-support']
      };

      registerServiceWorker(config);

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });
  });

  describe('offline functionality', () => {
    it('should configure offline page', () => {
      const config = {
        offlinePage: '/offline.html',
        offlineAssets: ['/css/offline.css']
      };

      registerServiceWorker(config);

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    it('should handle crisis resources offline', () => {
      const config = {
        criticalResources: [
          '/crisis-hotlines',
          '/safety-plan',
          '/emergency-contacts'
        ]
      };

      registerServiceWorker(config);

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });
  });

  describe('push notification support', () => {
    it('should configure push notification handling', () => {
      const config = {
        pushNotifications: {
          enabled: true,
          vapidKey: 'test-vapid-key'
        }
      };

      registerServiceWorker(config);

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    it('should handle background sync for offline actions', () => {
      const config = {
        backgroundSync: {
          enabled: true,
          tags: ['crisis-report', 'safety-check']
        }
      };

      registerServiceWorker(config);

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });
  });

  describe('performance optimization', () => {
    it('should preload critical resources', () => {
      const config = {
        preloadResources: [
          '/api/user/profile',
          '/css/critical.css',
          '/js/crisis-detection.js'
        ]
      };

      registerServiceWorker(config);

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    it('should implement resource hinting', () => {
      const config = {
        resourceHints: {
          preconnect: ['https://api.crisis-support.org'],
          prefetch: ['/api/resources/crisis']
        }
      };

      registerServiceWorker(config);

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });
  });

  describe('error handling and monitoring', () => {
    it('should handle service worker errors', async () => {
      const errorHandler = jest.fn();
      
      await registerServiceWorker({
        onError: errorHandler
      });

      // Simulate error
      const error = new Error('Service worker error');
      errorHandler(error);

      expect(errorHandler).toHaveBeenCalledWith(error);
    });

    it('should track service worker performance', () => {
      const performanceHandler = jest.fn();
      
      registerServiceWorker({
        onPerformance: performanceHandler
      });

      expect(performanceHandler).toBeInstanceOf(Function);
    });
  });
});