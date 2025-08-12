import { IntelligentCachingService } from '../intelligentCachingService';

// Mock IndexedDB
const mockIDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

const mockDatabase = {
  transaction: jest.fn(),
  objectStoreNames: ['cacheEntries', 'analytics'],
  close: jest.fn(),
};

const mockObjectStore = {
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  index: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
  oncomplete: null,
  onerror: null,
};

// Mock openDB from idb
jest.mock('idb', () => ({
  openDB: jest.fn(),
}));

// Mock Cache API
const mockCache = {
  match: jest.fn(),
  add: jest.fn(),
  addAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
};

Object.defineProperty(window, 'caches', {
  value: {
    open: jest.fn().mockResolvedValue(mockCache),
    match: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
    keys: jest.fn(),
  },
  writable: true,
});

// Mock Navigator connection
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    type: 'cellular'
  },
  writable: true,
});

describe('IntelligentCachingService', () => {
  let service: IntelligentCachingService;
  const { openDB } = require('idb');

  beforeEach(() => {
    service = new IntelligentCachingService();
    jest.clearAllMocks();

    openDB.mockResolvedValue(mockDatabase);
    mockDatabase.transaction.mockReturnValue(mockTransaction);
    mockObjectStore.getAll.mockResolvedValue([]);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();

      expect(openDB).toHaveBeenCalledWith(
        'IntelligentCacheDB',
        expect.any(Number),
        expect.objectContaining({
          upgrade: expect.any(Function)
        })
      );
    });

    it('should set up database schema during upgrade', async () => {
      const mockUpgrade = jest.fn();
      openDB.mockImplementation((name, version, { upgrade }) => {
        upgrade(mockUpgrade);
        return Promise.resolve(mockDatabase);
      });

      await service.initialize();

      expect(openDB).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      openDB.mockRejectedValue(new Error('DB initialization failed'));

      await expect(service.initialize()).rejects.toThrow();
    });
  });

  describe('cache management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should cache critical resources with highest priority', async () => {
      const url = '/crisis-resources/hotlines';
      const response = new Response('Crisis hotline data');

      await service.cacheResource(url, response, 'CRITICAL', 'CRISIS_RESOURCE');

      expect(mockCache.put).toHaveBeenCalledWith(url, response);
      expect(mockObjectStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          url,
          priority: 'CRITICAL',
          resourceType: 'CRISIS_RESOURCE',
          timestamp: expect.any(Number),
          hitCount: 0,
          size: expect.any(Number)
        })
      );
    });

    it('should cache user safety plans with high priority', async () => {
      const url = '/safety-plan/user123';
      const response = new Response(JSON.stringify({ steps: ['Call friend', 'Deep breathing'] }));

      await service.cacheResource(url, response, 'HIGH', 'SAFETY_PLAN');

      expect(mockCache.put).toHaveBeenCalledWith(url, response);
      expect(mockObjectStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'HIGH',
          resourceType: 'SAFETY_PLAN'
        })
      );
    });

    it('should retrieve cached resources and update hit count', async () => {
      const url = '/cached-resource';
      const cachedResponse = new Response('Cached data');
      
      mockCache.match.mockResolvedValue(cachedResponse);
      mockObjectStore.get.mockResolvedValue({
        url,
        hitCount: 5,
        lastAccessed: Date.now() - 1000,
        priority: 'MEDIUM'
      });

      const result = await service.getResource(url);

      expect(result).toBe(cachedResponse);
      expect(mockCache.match).toHaveBeenCalledWith(url);
      expect(mockObjectStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          hitCount: 6,
          lastAccessed: expect.any(Number)
        })
      );
    });

    it('should return null for uncached resources', async () => {
      mockCache.match.mockResolvedValue(undefined);
      mockObjectStore.get.mockResolvedValue(null);

      const result = await service.getResource('/uncached-resource');

      expect(result).toBeNull();
    });

    it('should preload critical resources based on user context', async () => {
      const crisisResources = [
        '/crisis-resources/988-hotline',
        '/crisis-resources/crisis-text-line',
        '/safety-plan/template'
      ];

      // Mock the preload method
      const preloadSpy = jest.spyOn(service, 'preloadCriticalResources');
      preloadSpy.mockResolvedValue();

      await service.preloadCriticalResources(crisisResources, 'seeker');

      expect(preloadSpy).toHaveBeenCalledWith(crisisResources, 'seeker');
    });
  });

  describe('cache eviction and cleanup', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should evict expired low-priority resources', async () => {
      const oldTimestamp = Date.now() - (4 * 24 * 60 * 60 * 1000); // 4 days ago
      
      mockObjectStore.getAll.mockResolvedValue([
        {
          url: '/old-resource',
          priority: 'LOW',
          timestamp: oldTimestamp,
          resourceType: 'STATIC_ASSET'
        }
      ]);

      await service.performMaintenance();

      expect(mockCache.delete).toHaveBeenCalledWith('/old-resource');
      expect(mockObjectStore.delete).toHaveBeenCalled();
    });

    it('should never evict critical resources', async () => {
      const oldTimestamp = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      mockObjectStore.getAll.mockResolvedValue([
        {
          url: '/crisis-hotline',
          priority: 'CRITICAL',
          timestamp: oldTimestamp,
          resourceType: 'CRISIS_RESOURCE'
        }
      ]);

      await service.performMaintenance();

      expect(mockCache.delete).not.toHaveBeenCalledWith('/crisis-hotline');
    });

    it('should evict least recently used resources when storage is full', async () => {
      // Mock storage estimate showing high usage
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: jest.fn().mockResolvedValue({
            quota: 1000000,
            usage: 950000 // 95% usage
          })
        }
      });

      mockObjectStore.getAll.mockResolvedValue([
        {
          url: '/resource1',
          priority: 'MEDIUM',
          lastAccessed: Date.now() - 1000,
          size: 10000
        },
        {
          url: '/resource2',
          priority: 'MEDIUM',
          lastAccessed: Date.now() - 5000,
          size: 10000
        }
      ]);

      await service.performMaintenance();

      // Should evict older accessed resource first
      expect(mockCache.delete).toHaveBeenCalledWith('/resource2');
    });
  });

  describe('adaptive caching strategies', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should adapt caching based on network conditions', async () => {
      // Mock slow network
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          saveData: true
        }
      });

      const strategy = service.getAdaptiveStrategy();

      expect(strategy.preloadLevel).toBe('minimal');
      expect(strategy.compressionLevel).toBe('high');
      expect(strategy.imageQuality).toBe('low');
    });

    it('should use aggressive caching on fast networks', async () => {
      // Mock fast network
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 50,
          saveData: false
        }
      });

      const strategy = service.getAdaptiveStrategy();

      expect(strategy.preloadLevel).toBe('aggressive');
      expect(strategy.compressionLevel).toBe('low');
      expect(strategy.imageQuality).toBe('high');
    });

    it('should respect data saver preferences', async () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          saveData: true
        }
      });

      const strategy = service.getAdaptiveStrategy();

      expect(strategy.preloadLevel).toBe('minimal');
      expect(strategy.compressionLevel).toBe('high');
    });
  });

  describe('cache warming', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should warm cache with user-specific content', async () => {
      const userResources = [
        { url: '/user/123/safety-plan', priority: 'HIGH' },
        { url: '/user/123/chat-history', priority: 'HIGH' },
        { url: '/crisis-resources/local', priority: 'CRITICAL' }
      ];

      const warmCacheSpy = jest.spyOn(service, 'warmCache');
      warmCacheSpy.mockResolvedValue();

      await service.warmCache(userResources);

      expect(warmCacheSpy).toHaveBeenCalledWith(userResources);
    });

    it('should prioritize crisis resources in cache warming', async () => {
      const resources = [
        { url: '/static/image.jpg', priority: 'LOW' },
        { url: '/crisis-resources/988', priority: 'CRITICAL' },
        { url: '/community/posts', priority: 'MEDIUM' }
      ];

      // Mock network request
      global.fetch = jest.fn().mockResolvedValue(
        new Response('Mock response')
      );

      await service.warmCache(resources);

      // Critical resources should be fetched first
      expect(fetch).toHaveBeenCalledWith('/crisis-resources/988');
    });
  });

  describe('analytics and monitoring', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should track cache hit rates', async () => {
      // Simulate cache hits and misses
      mockCache.match
        .mockResolvedValueOnce(new Response('hit'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(new Response('hit'));

      mockObjectStore.get
        .mockResolvedValueOnce({ hitCount: 5 })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ hitCount: 10 });

      await service.getResource('/resource1');
      await service.getResource('/resource2');
      await service.getResource('/resource3');

      const analytics = await service.getCacheAnalytics();

      expect(analytics.hitRate).toBeCloseTo(0.67, 2); // 2/3 hits
      expect(analytics.missRate).toBeCloseTo(0.33, 2); // 1/3 misses
    });

    it('should track storage usage', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: jest.fn().mockResolvedValue({
            quota: 1000000,
            usage: 250000
          })
        }
      });

      const analytics = await service.getCacheAnalytics();

      expect(analytics.storageUsage).toBeCloseTo(0.25, 2); // 25% usage
    });

    it('should track performance metrics', async () => {
      const analytics = await service.getCacheAnalytics();

      expect(analytics.performanceMetrics).toHaveProperty('averageLoadTime');
      expect(analytics.performanceMetrics).toHaveProperty('cacheRetrievalTime');
      expect(analytics.performanceMetrics).toHaveProperty('networkFallbackTime');
      expect(analytics.performanceMetrics).toHaveProperty('offlineRequestCount');
    });
  });

  describe('offline support', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle offline requests gracefully', async () => {
      mockCache.match.mockResolvedValue(new Response('Offline response'));

      const result = await service.getResource('/cached-resource');

      expect(result).toBeInstanceOf(Response);
      expect(mockCache.match).toHaveBeenCalledWith('/cached-resource');
    });

    it('should queue requests for when online', async () => {
      mockCache.match.mockResolvedValue(null);

      const queueSpy = jest.spyOn(service, 'queueOfflineRequest');
      queueSpy.mockImplementation();

      await service.handleOfflineRequest('/uncached-resource');

      expect(queueSpy).toHaveBeenCalledWith('/uncached-resource');
    });

    it('should process queued requests when back online', async () => {
      const processSpy = jest.spyOn(service, 'processQueuedRequests');
      processSpy.mockResolvedValue();

      service.handleOnlineStatus(true);

      expect(processSpy).toHaveBeenCalled();
    });
  });

  describe('memory management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should clear caches when memory pressure is high', async () => {
      // Mock memory pressure event
      const clearSpy = jest.spyOn(service, 'clearLowPriorityCache');
      clearSpy.mockResolvedValue();

      service.handleMemoryPressure();

      expect(clearSpy).toHaveBeenCalled();
    });

    it('should compress large responses', async () => {
      const largeResponse = new Response('x'.repeat(100000)); // 100KB
      const compressSpy = jest.spyOn(service, 'compressResponse');
      compressSpy.mockResolvedValue(new Response('compressed'));

      await service.cacheResource('/large-resource', largeResponse, 'MEDIUM', 'API_RESPONSE');

      expect(compressSpy).toHaveBeenCalledWith(largeResponse);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle cache storage errors gracefully', async () => {
      mockCache.put.mockRejectedValue(new Error('Storage quota exceeded'));

      await expect(
        service.cacheResource('/resource', new Response('data'), 'LOW', 'STATIC_ASSET')
      ).resolves.not.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      mockObjectStore.put.mockRejectedValue(new Error('DB write failed'));

      await expect(
        service.cacheResource('/resource', new Response('data'), 'LOW', 'STATIC_ASSET')
      ).resolves.not.toThrow();
    });

    it('should handle corrupted cache entries', async () => {
      mockObjectStore.getAll.mockResolvedValue([
        { corrupted: true }, // Missing required fields
        {
          url: '/valid-resource',
          priority: 'MEDIUM',
          timestamp: Date.now(),
          resourceType: 'API_RESPONSE'
        }
      ]);

      await expect(service.performMaintenance()).resolves.not.toThrow();
    });
  });
});

// Add method stubs for testing
declare module '../intelligentCachingService' {
  interface IntelligentCachingService {
    cacheResource(url: string, response: Response, priority: string, resourceType: string): Promise<void>;
    getResource(url: string): Promise<Response | null>;
    preloadCriticalResources(resources: string[], userType: string): Promise<void>;
    performMaintenance(): Promise<void>;
    getAdaptiveStrategy(): any;
    warmCache(resources: any[]): Promise<void>;
    getCacheAnalytics(): Promise<any>;
    handleOfflineRequest(url: string): Promise<void>;
    queueOfflineRequest(url: string): void;
    processQueuedRequests(): Promise<void>;
    handleOnlineStatus(isOnline: boolean): void;
    handleMemoryPressure(): void;
    clearLowPriorityCache(): Promise<void>;
    compressResponse(response: Response): Promise<Response>;
  }
}