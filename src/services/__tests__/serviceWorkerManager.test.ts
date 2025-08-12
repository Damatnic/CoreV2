import { ServiceWorkerManager } from '../serviceWorkerManager';

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

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    ready: Promise.resolve(mockServiceWorkerRegistration),
    getRegistration: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    controller: { state: 'activated' },
  },
  writable: true,
});

describe('ServiceWorkerManager', () => {
  let manager: ServiceWorkerManager;

  beforeEach(async () => {
    manager = new ServiceWorkerManager();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize service worker manager', async () => {
      await manager.initialize();

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    it('should handle browsers without service worker support', async () => {
      delete (navigator as any).serviceWorker;

      const result = await manager.initialize();

      expect(result.supported).toBe(false);
    });

    it('should setup message channel for communication', async () => {
      await manager.initialize();

      const hasMessageChannel = manager.hasMessageChannel();
      expect(hasMessageChannel).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should add resources to cache', async () => {
      const resources = ['/css/main.css', '/js/app.js', '/crisis-resources'];

      await manager.cacheResources(resources);

      // Should send message to service worker
      expect(manager.getLastMessage()).toEqual(
        expect.objectContaining({
          type: 'CACHE_RESOURCES',
          resources: resources
        })
      );
    });

    it('should clear specific cache', async () => {
      await manager.clearCache('static-assets');

      expect(manager.getLastMessage()).toEqual(
        expect.objectContaining({
          type: 'CLEAR_CACHE',
          cacheName: 'static-assets'
        })
      );
    });

    it('should get cache status', async () => {
      const status = await manager.getCacheStatus();

      expect(status).toHaveProperty('caches');
      expect(status).toHaveProperty('totalSize');
      expect(status).toHaveProperty('lastUpdated');
    });

    it('should preload critical resources for crisis support', async () => {
      const criticalResources = [
        '/crisis-hotlines',
        '/safety-plan-template',
        '/emergency-contacts'
      ];

      await manager.preloadCriticalResources(criticalResources);

      expect(manager.getLastMessage()).toEqual(
        expect.objectContaining({
          type: 'PRELOAD_CRITICAL',
          resources: criticalResources,
          priority: 'high'
        })
      );
    });
  });

  describe('background sync', () => {
    it('should register background sync for crisis data', async () => {
      const syncData = {
        tag: 'crisis-report',
        data: { userId: 'user-123', riskLevel: 'high' }
      };

      await manager.registerBackgroundSync(syncData);

      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith('crisis-report');
    });

    it('should queue actions for offline sync', async () => {
      const action = {
        type: 'safety-check',
        data: { checkInTime: Date.now(), status: 'safe' }
      };

      await manager.queueOfflineAction(action);

      expect(manager.getQueuedActions()).toContain(
        expect.objectContaining({
          type: 'safety-check',
          queued: true
        })
      );
    });

    it('should handle sync events from service worker', async () => {
      const syncHandler = jest.fn();
      manager.onSync(syncHandler);

      // Simulate sync event from service worker
      const syncEvent = {
        data: JSON.stringify({
          type: 'SYNC_COMPLETE',
          tag: 'crisis-report',
          success: true
        })
      };

      await manager.handleMessage(syncEvent);

      expect(syncHandler).toHaveBeenCalledWith({
        tag: 'crisis-report',
        success: true
      });
    });
  });

  describe('push notifications', () => {
    it('should setup push notification subscription', async () => {
      const vapidKey = 'test-vapid-key';

      const subscription = await manager.setupPushNotifications(vapidKey);

      expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalled();
    });

    it('should handle push notification events', async () => {
      const notificationHandler = jest.fn();
      manager.onNotification(notificationHandler);

      const pushEvent = {
        data: JSON.stringify({
          type: 'PUSH_RECEIVED',
          notification: {
            title: 'Crisis Support Alert',
            body: 'Someone needs immediate help',
            tag: 'crisis-alert'
          }
        })
      };

      await manager.handleMessage(pushEvent);

      expect(notificationHandler).toHaveBeenCalled();
    });

    it('should send crisis notifications', async () => {
      const notification = {
        title: 'Safety Check',
        body: 'How are you feeling today?',
        tag: 'safety-check',
        urgency: 'normal'
      };

      await manager.sendNotification(notification);

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        notification.title,
        expect.objectContaining({
          body: notification.body,
          tag: notification.tag
        })
      );
    });
  });

  describe('offline functionality', () => {
    it('should detect online/offline status', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const isOnline = manager.isOnline();
      expect(isOnline).toBe(false);
    });

    it('should handle network status changes', async () => {
      const statusHandler = jest.fn();
      manager.onNetworkStatusChange(statusHandler);

      // Simulate going offline
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      expect(statusHandler).toHaveBeenCalledWith(false);
    });

    it('should provide offline resources list', async () => {
      const offlineResources = await manager.getOfflineResources();

      expect(offlineResources).toContain('/crisis-hotlines');
      expect(offlineResources).toContain('/safety-plan');
      expect(offlineResources).toContain('/emergency-contacts');
    });

    it('should sync queued data when back online', async () => {
      // Queue some offline actions
      await manager.queueOfflineAction({
        type: 'mood-check',
        data: { mood: 'anxious', timestamp: Date.now() }
      });

      // Simulate going back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      await manager.syncQueuedData();

      expect(manager.getQueuedActions()).toHaveLength(0);
    });
  });

  describe('performance monitoring', () => {
    it('should track cache hit rates', async () => {
      const metrics = await manager.getPerformanceMetrics();

      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('networkFallbackCount');
      expect(metrics).toHaveProperty('averageResponseTime');
    });

    it('should monitor service worker health', async () => {
      const health = await manager.getServiceWorkerHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('lastUpdated');
      expect(health).toHaveProperty('errorCount');
      expect(health).toHaveProperty('cacheSize');
    });

    it('should log performance events', async () => {
      await manager.logPerformanceEvent('CACHE_HIT', {
        url: '/crisis-resources',
        responseTime: 50
      });

      const logs = await manager.getPerformanceLogs();
      expect(logs).toContainEqual(
        expect.objectContaining({
          event: 'CACHE_HIT',
          url: '/crisis-resources'
        })
      );
    });
  });

  describe('update management', () => {
    it('should check for service worker updates', async () => {
      const updateAvailable = await manager.checkForUpdates();

      expect(mockServiceWorkerRegistration.update).toHaveBeenCalled();
    });

    it('should handle update notifications', async () => {
      const updateHandler = jest.fn();
      manager.onUpdateAvailable(updateHandler);

      // Simulate update available
      mockServiceWorkerRegistration.waiting = { state: 'installed' };
      
      await manager.checkForUpdates();

      expect(updateHandler).toHaveBeenCalled();
    });

    it('should skip waiting and activate new service worker', async () => {
      await manager.skipWaitingAndActivate();

      expect(manager.getLastMessage()).toEqual(
        expect.objectContaining({
          type: 'SKIP_WAITING'
        })
      );
    });
  });

  describe('crisis-specific features', () => {
    it('should handle emergency cache clearing', async () => {
      await manager.emergencyCacheClear();

      expect(manager.getLastMessage()).toEqual(
        expect.objectContaining({
          type: 'EMERGENCY_CACHE_CLEAR'
        })
      );
    });

    it('should ensure crisis resources are always cached', async () => {
      await manager.ensureCrisisResourcesAvailable();

      const criticalResources = [
        '/crisis-hotlines',
        '/emergency-contacts',
        '/safety-plan',
        '/offline-crisis-resources'
      ];

      expect(manager.getLastMessage()).toEqual(
        expect.objectContaining({
          type: 'ENSURE_CRITICAL_CACHE',
          resources: expect.arrayContaining(criticalResources)
        })
      );
    });

    it('should handle high priority background sync for crisis data', async () => {
      const crisisData = {
        userId: 'user-123',
        riskLevel: 'immediate',
        timestamp: Date.now(),
        interventionNeeded: true
      };

      await manager.syncCrisisDataWithPriority(crisisData);

      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith('crisis-data-priority');
    });
  });

  describe('error handling and recovery', () => {
    it('should handle service worker registration failures', async () => {
      (navigator.serviceWorker.register as jest.Mock).mockRejectedValue(new Error('Registration failed'));

      const result = await manager.initialize();

      expect(result.error).toBeDefined();
      expect(result.supported).toBe(true);
      expect(result.registered).toBe(false);
    });

    it('should recover from service worker errors', async () => {
      await manager.recoverFromError('CACHE_ERROR');

      expect(manager.getLastMessage()).toEqual(
        expect.objectContaining({
          type: 'RECOVER_FROM_ERROR',
          errorType: 'CACHE_ERROR'
        })
      );
    });

    it('should fallback to network when cache fails', async () => {
      const fallbackHandler = jest.fn();
      manager.onCacheFallback(fallbackHandler);

      const cacheError = {
        data: JSON.stringify({
          type: 'CACHE_FALLBACK',
          url: '/crisis-resources',
          reason: 'cache_miss'
        })
      };

      await manager.handleMessage(cacheError);

      expect(fallbackHandler).toHaveBeenCalledWith({
        url: '/crisis-resources',
        reason: 'cache_miss'
      });
    });
  });
});

// Add method stubs for testing
declare module '../serviceWorkerManager' {
  interface ServiceWorkerManager {
    hasMessageChannel(): boolean;
    getLastMessage(): any;
    handleMessage(event: any): Promise<void>;
    getQueuedActions(): any[];
    onSync(handler: Function): void;
    onNotification(handler: Function): void;
    isOnline(): boolean;
    onNetworkStatusChange(handler: Function): void;
    getOfflineResources(): Promise<string[]>;
    syncQueuedData(): Promise<void>;
    getPerformanceMetrics(): Promise<any>;
    getServiceWorkerHealth(): Promise<any>;
    logPerformanceEvent(event: string, data: any): Promise<void>;
    getPerformanceLogs(): Promise<any[]>;
    checkForUpdates(): Promise<boolean>;
    onUpdateAvailable(handler: Function): void;
    skipWaitingAndActivate(): Promise<void>;
    emergencyCacheClear(): Promise<void>;
    ensureCrisisResourcesAvailable(): Promise<void>;
    syncCrisisDataWithPriority(data: any): Promise<void>;
    recoverFromError(errorType: string): Promise<void>;
    onCacheFallback(handler: Function): void;
  }
}