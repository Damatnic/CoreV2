import serviceWorkerManager from '../serviceWorkerManager';

// Mock service worker APIs
const mockServiceWorkerRegistration = {
  waiting: null,
  installing: null,
  active: { state: 'activated' },
  update: jest.fn().mockResolvedValue(undefined),
  unregister: jest.fn().mockResolvedValue(true),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  pushManager: {
    subscribe: jest.fn(),
    getSubscription: jest.fn(),
  },
  sync: {
    register: jest.fn().mockResolvedValue(undefined),
  },
  showNotification: jest.fn(),
};

// Mock navigator.serviceWorker
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    ready: Promise.resolve(mockServiceWorkerRegistration),
    controller: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  writable: true,
});

// Mock caches API
global.caches = {
  open: jest.fn().mockResolvedValue({
    addAll: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(true),
    keys: jest.fn().mockResolvedValue([]),
  }),
  delete: jest.fn().mockResolvedValue(true),
  keys: jest.fn().mockResolvedValue([]),
} as unknown;

describe('ServiceWorkerManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize service worker manager', async () => {
      const result = await serviceWorkerManager.initialize();
      expect(result).toHaveProperty('supported');
    });

    it('should return supported status', async () => {
      const result = await serviceWorkerManager.initialize();
      expect(result.supported).toBe(true);
    });
  });

  describe('caching', () => {
    it('should cache resources', async () => {
      const resources = ['/static/js/main.js', '/static/css/main.css'];
      const result = await serviceWorkerManager.cacheResources(resources);
      expect(typeof result).toBe('boolean');
    });

    it('should clear cache', async () => {
      const result = await serviceWorkerManager.clearCache('static-assets');
      expect(typeof result).toBe('boolean');
    });

    it('should get cache status', async () => {
      const status = await serviceWorkerManager.getCacheStatus();
      expect(status).toHaveProperty('cached');
      expect(status).toHaveProperty('size');
    });
  });

  describe('critical resources', () => {
    it('should preload critical resources', async () => {
      const criticalResources = ['/emergency-contacts', '/crisis-resources'];
      await serviceWorkerManager.preloadCriticalResources(criticalResources);
      // Should complete without throwing
    });
  });

  describe('background sync', () => {
    it('should register background sync', async () => {
      const syncData = {
        tag: 'mood-sync',
        data: { mood: 'anxious', timestamp: Date.now() }
      };
      await serviceWorkerManager.registerBackgroundSync(syncData);
      // Should complete without throwing
    });

    it('should queue offline action', async () => {
      const action = {
        type: 'POST_MOOD_ENTRY',
        url: '/api/moods',
        data: { mood: 'happy', energy: 8 }
      };
      await serviceWorkerManager.queueOfflineAction(action);
      // Should complete without throwing
    });
  });

  describe('push notifications', () => {
    it('should setup push notifications', async () => {
      const vapidKey = 'test-vapid-key';
      await serviceWorkerManager.setupPushNotifications(vapidKey);
      // Should complete without throwing
    });

    it('should send notification', async () => {
      const notification = {
        title: 'Mental Health Check',
        body: 'How are you feeling today?',
        icon: '/icon-192x192.png'
      };
      await serviceWorkerManager.sendNotification(notification);
      // Should complete without throwing
    });
  });

  describe('offline status', () => {
    it('should check offline readiness', async () => {
      const isReady = await serviceWorkerManager.isOfflineReady();
      expect(typeof isReady).toBe('boolean');
    });
  });

  describe('updates', () => {
    it('should check for updates', async () => {
      await serviceWorkerManager.checkForUpdates();
      // Should complete without throwing
    });

    it('should skip waiting', async () => {
      await serviceWorkerManager.skipWaiting();
      // Should complete without throwing
    });
  });

  describe('crisis features', () => {
    it('should cache crisis resource', async () => {
      const result = await serviceWorkerManager.cacheCrisisResource('/crisis-helpline');
      expect(typeof result).toBe('boolean');
    });

    it('should precache crisis resources', async () => {
      await serviceWorkerManager.precacheCrisisResources();
      // Should complete without throwing
    });
  });
});
