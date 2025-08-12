/**
 * Test Suite for PWA Service
 * Tests Progressive Web App functionality including installation, updates, and offline support
 */

import { pwaService } from '../pwaService';

describe('PWAService', () => {
  let mockServiceWorker: any;
  let mockRegistration: ServiceWorkerRegistration;
  let mockNavigator: any;

  beforeEach(() => {
    // Mock Service Worker
    mockServiceWorker = {
      state: 'activated',
      postMessage: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Mock Registration
    mockRegistration = {
      active: mockServiceWorker,
      installing: null,
      waiting: null,
      scope: '/',
      updateViaCache: 'none',
      update: jest.fn().mockResolvedValue(undefined),
      unregister: jest.fn().mockResolvedValue(true),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      showNotification: jest.fn(),
      getNotifications: jest.fn().mockResolvedValue([]),
    } as any;

    // Mock navigator
    mockNavigator = {
      serviceWorker: {
        ready: Promise.resolve(mockRegistration),
        register: jest.fn().mockResolvedValue(mockRegistration),
        getRegistration: jest.fn().mockResolvedValue(mockRegistration),
        controller: mockServiceWorker,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      onLine: true,
    };

    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
    });

    // Reset service state
    pwaService.reset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const registration = await pwaService.register('/sw.js');
      
      expect(registration).toBe(mockRegistration);
      expect(mockNavigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
      });
    });

    it('should handle registration with custom scope', async () => {
      await pwaService.register('/sw.js', { scope: '/app/' });
      
      expect(mockNavigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/app/',
      });
    });

    it('should handle registration failure', async () => {
      const error = new Error('Registration failed');
      mockNavigator.serviceWorker.register.mockRejectedValueOnce(error);
      
      await expect(pwaService.register('/sw.js')).rejects.toThrow('Registration failed');
    });

    it('should check if service worker is supported', () => {
      expect(pwaService.isSupported()).toBe(true);
      
      // Test without service worker support
      delete window.navigator.serviceWorker;
      expect(pwaService.isSupported()).toBe(false);
    });

    it('should get current registration', async () => {
      const registration = await pwaService.getRegistration();
      expect(registration).toBe(mockRegistration);
    });
  });

  describe('Installation Prompt', () => {
    it('should handle beforeinstallprompt event', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue({ outcome: 'accepted' }),
      };

      window.dispatchEvent(new CustomEvent('beforeinstallprompt', { detail: mockEvent }));
      
      expect(pwaService.canInstall()).toBe(true);
    });

    it('should prompt for installation', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue({ outcome: 'accepted' }),
      };

      window.dispatchEvent(new CustomEvent('beforeinstallprompt', { detail: mockEvent }));
      
      const result = await pwaService.promptInstall();
      expect(result).toBe('accepted');
      expect(mockEvent.prompt).toHaveBeenCalled();
    });

    it('should handle installation rejection', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue({ outcome: 'dismissed' }),
      };

      window.dispatchEvent(new CustomEvent('beforeinstallprompt', { detail: mockEvent }));
      
      const result = await pwaService.promptInstall();
      expect(result).toBe('dismissed');
    });

    it('should detect if app is installed', () => {
      // Mock matchMedia for standalone mode
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any;

      expect(pwaService.isInstalled()).toBe(true);
    });
  });

  describe('Update Management', () => {
    it('should check for updates', async () => {
      const hasUpdate = await pwaService.checkForUpdates();
      
      expect(mockRegistration.update).toHaveBeenCalled();
      expect(hasUpdate).toBe(false); // No waiting worker
    });

    it('should detect available updates', async () => {
      mockRegistration.waiting = { ...mockServiceWorker, state: 'installed' } as any;
      
      const hasUpdate = await pwaService.checkForUpdates();
      expect(hasUpdate).toBe(true);
    });

    it('should apply updates', async () => {
      const waitingWorker = {
        ...mockServiceWorker,
        state: 'installed',
        postMessage: jest.fn(),
      };
      mockRegistration.waiting = waitingWorker as any;

      await pwaService.applyUpdate();
      
      expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    it('should handle auto-update on visibility change', () => {
      pwaService.enableAutoUpdate();
      
      // Simulate page becoming visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
      
      expect(mockRegistration.update).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      // Mock Cache API
      const mockCache = {
        match: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        keys: jest.fn().mockResolvedValue([]),
      };

      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache),
        delete: jest.fn().mockResolvedValue(true),
        keys: jest.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
        match: jest.fn(),
        has: jest.fn().mockResolvedValue(true),
      } as any;
    });

    it('should clear all caches', async () => {
      await pwaService.clearAllCaches();
      
      expect(global.caches.keys).toHaveBeenCalled();
      expect(global.caches.delete).toHaveBeenCalledWith('cache-v1');
      expect(global.caches.delete).toHaveBeenCalledWith('cache-v2');
    });

    it('should clear specific cache', async () => {
      await pwaService.clearCache('cache-v1');
      
      expect(global.caches.delete).toHaveBeenCalledWith('cache-v1');
    });

    it('should get cache size', async () => {
      // Mock navigator.storage
      navigator.storage = {
        estimate: jest.fn().mockResolvedValue({
          usage: 1024 * 1024 * 10, // 10MB
          quota: 1024 * 1024 * 100, // 100MB
        }),
      } as any;

      const size = await pwaService.getCacheSize();
      expect(size).toEqual({
        usage: 1024 * 1024 * 10,
        quota: 1024 * 1024 * 100,
        percentage: 10,
      });
    });

    it('should precache resources', async () => {
      const resources = ['/index.html', '/style.css', '/script.js'];
      
      await pwaService.precacheResources(resources);
      
      expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({
        type: 'PRECACHE',
        resources,
      });
    });
  });

  describe('Offline Support', () => {
    it('should detect online status', () => {
      expect(pwaService.isOnline()).toBe(true);
      
      mockNavigator.onLine = false;
      expect(pwaService.isOnline()).toBe(false);
    });

    it('should handle online/offline events', () => {
      const onlineCallback = jest.fn();
      const offlineCallback = jest.fn();
      
      pwaService.onOnline(onlineCallback);
      pwaService.onOffline(offlineCallback);
      
      window.dispatchEvent(new Event('online'));
      expect(onlineCallback).toHaveBeenCalled();
      
      window.dispatchEvent(new Event('offline'));
      expect(offlineCallback).toHaveBeenCalled();
    });

    it('should queue actions when offline', async () => {
      mockNavigator.onLine = false;
      
      const action = {
        url: '/api/data',
        method: 'POST',
        data: { test: 'data' },
      };
      
      await pwaService.queueOfflineAction(action);
      
      expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({
        type: 'QUEUE_ACTION',
        action,
      });
    });

    it('should sync when back online', async () => {
      await pwaService.syncOfflineActions();
      
      expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({
        type: 'SYNC_ACTIONS',
      });
    });
  });

  describe('Background Sync', () => {
    it('should register background sync', async () => {
      mockRegistration.sync = {
        register: jest.fn().mockResolvedValue(undefined),
        getTags: jest.fn().mockResolvedValue(['sync-data']),
      } as any;

      await pwaService.registerBackgroundSync('sync-data');
      
      expect(mockRegistration.sync.register).toHaveBeenCalledWith('sync-data');
    });

    it('should handle sync registration failure gracefully', async () => {
      // No sync API available
      mockRegistration.sync = undefined;
      
      await expect(pwaService.registerBackgroundSync('sync-data')).resolves.not.toThrow();
    });
  });

  describe('Push Notifications', () => {
    beforeEach(() => {
      mockRegistration.pushManager = {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'https://push.service/endpoint',
          toJSON: () => ({ endpoint: 'https://push.service/endpoint' }),
        }),
        getSubscription: jest.fn().mockResolvedValue(null),
        permissionState: jest.fn().mockResolvedValue('granted'),
      } as any;
    });

    it('should request notification permission', async () => {
      Notification.requestPermission = jest.fn().mockResolvedValue('granted');
      
      const permission = await pwaService.requestNotificationPermission();
      expect(permission).toBe('granted');
    });

    it('should subscribe to push notifications', async () => {
      const subscription = await pwaService.subscribeToPush('public-key');
      
      expect(subscription).toHaveProperty('endpoint');
      expect(mockRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Object),
      });
    });

    it('should get existing subscription', async () => {
      const mockSubscription = { endpoint: 'existing-endpoint' };
      mockRegistration.pushManager.getSubscription.mockResolvedValueOnce(mockSubscription);
      
      const subscription = await pwaService.getPushSubscription();
      expect(subscription).toBe(mockSubscription);
    });

    it('should unsubscribe from push', async () => {
      const mockSubscription = {
        unsubscribe: jest.fn().mockResolvedValue(true),
      };
      mockRegistration.pushManager.getSubscription.mockResolvedValueOnce(mockSubscription);
      
      const result = await pwaService.unsubscribeFromPush();
      expect(result).toBe(true);
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('App Manifest', () => {
    it('should update manifest dynamically', () => {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
      
      pwaService.updateManifest({
        name: 'Updated App Name',
        theme_color: '#000000',
      });
      
      // Should create new manifest blob URL
      expect(link.href).toContain('blob:');
    });

    it('should get manifest data', async () => {
      const mockManifest = {
        name: 'Test App',
        short_name: 'Test',
        start_url: '/',
      };
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockManifest),
      }) as any;
      
      const manifest = await pwaService.getManifest();
      expect(manifest).toEqual(mockManifest);
    });
  });

  describe('Performance Metrics', () => {
    it('should collect PWA metrics', async () => {
      const metrics = await pwaService.getMetrics();
      
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('offlinePageViews');
      expect(metrics).toHaveProperty('installationStatus');
      expect(metrics).toHaveProperty('updateFrequency');
    });

    it('should track cache performance', () => {
      pwaService.trackCacheHit('/api/data');
      pwaService.trackCacheMiss('/api/other');
      
      const stats = pwaService.getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing service worker gracefully', async () => {
      delete window.navigator.serviceWorker;
      
      await expect(pwaService.register('/sw.js')).rejects.toThrow('Service Worker not supported');
    });

    it('should handle network errors', async () => {
      mockNavigator.onLine = false;
      
      const result = await pwaService.checkForUpdates();
      expect(result).toBe(false);
    });

    it('should recover from failed updates', async () => {
      mockRegistration.update.mockRejectedValueOnce(new Error('Update failed'));
      
      await expect(pwaService.checkForUpdates()).resolves.toBe(false);
    });
  });
});