/**
 * @jest-environment jsdom
 */

import { CacheIntegration, cacheIntegration } from '../cacheIntegration';

// Mock dependencies
const mockCacheStrategyCoordinator = {
  register: jest.fn(),
  unregister: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  getMultiple: jest.fn(),
  setMultiple: jest.fn(),
  deleteMultiple: jest.fn(),
  getCacheStats: jest.fn(),
  optimizeCache: jest.fn(),
};

const mockIntelligentCachingService = {
  shouldCache: jest.fn(),
  getCacheDuration: jest.fn(),
  getCachePriority: jest.fn(),
  evictLeastImportant: jest.fn(),
  preloadPredicted: jest.fn(),
  trackAccess: jest.fn(),
  getAccessPatterns: jest.fn(),
};

jest.mock('../cacheStrategyCoordinator', () => ({
  getCacheStrategyCoordinator: () => mockCacheStrategyCoordinator,
}));

jest.mock('../intelligentCachingService', () => ({
  getIntelligentCachingService: () => mockIntelligentCachingService,
}));

// Mock crypto for hash generation
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
  writable: true,
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => [{ duration: 10 }]),
  },
  writable: true,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          get: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
            result: null,
          })),
          put: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          delete: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          clear: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
        })),
      })),
    },
  })),
};

Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

describe('CacheIntegration', () => {
  let cache: CacheIntegration;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new CacheIntegration();
  });

  afterEach(() => {
    if (cache) {
      cache.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(cache).toBeDefined();
      expect(mockCacheStrategyCoordinator.register).toHaveBeenCalled();
    });

    test('should initialize IndexedDB', async () => {
      const mockDB = {
        createObjectStore: jest.fn(),
      };

      mockIndexedDB.open.mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any,
          onupgradeneeded: null as any,
          result: mockDB,
        };
        
        setTimeout(() => {
          if (request.onupgradeneeded) {
            request.onupgradeneeded({ target: { result: mockDB } } as any);
          }
          if (request.onsuccess) {
            request.onsuccess({ target: { result: mockDB } } as any);
          }
        }, 0);
        
        return request;
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockIndexedDB.open).toHaveBeenCalledWith('astral_cache', 1);
    });

    test('should handle IndexedDB initialization errors', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = {
          onsuccess: null as any,
          onerror: null as any,
          onupgradeneeded: null as any,
        };
        
        setTimeout(() => {
          if (request.onerror) {
            request.onerror(new Error('IndexedDB not supported'));
          }
        }, 0);
        
        return request;
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const newCache = new CacheIntegration();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Cache Operations', () => {
    beforeEach(() => {
      mockCacheStrategyCoordinator.get.mockResolvedValue(undefined);
      mockCacheStrategyCoordinator.set.mockResolvedValue(true);
      mockIntelligentCachingService.shouldCache.mockReturnValue(true);
      mockIntelligentCachingService.getCacheDuration.mockReturnValue(300000);
      mockIntelligentCachingService.getCachePriority.mockReturnValue(5);
    });

    test('should get data from cache', async () => {
      const testData = { value: 'test', timestamp: Date.now() };
      mockCacheStrategyCoordinator.get.mockResolvedValue(testData);

      const result = await cache.get('test-key');
      
      expect(result).toBe(testData);
      expect(mockCacheStrategyCoordinator.get).toHaveBeenCalledWith('test-key');
      expect(mockIntelligentCachingService.trackAccess).toHaveBeenCalledWith('test-key');
    });

    test('should return null for cache miss', async () => {
      mockCacheStrategyCoordinator.get.mockResolvedValue(undefined);

      const result = await cache.get('nonexistent-key');
      
      expect(result).toBeNull();
    });

    test('should set data in cache', async () => {
      const testData = { value: 'test data' };
      mockCacheStrategyCoordinator.set.mockResolvedValue(true);

      const result = await cache.set('test-key', testData);
      
      expect(result).toBe(true);
      expect(mockCacheStrategyCoordinator.set).toHaveBeenCalledWith(
        'test-key',
        testData,
        expect.objectContaining({
          ttl: 300000,
          priority: 5,
          tags: [],
          compressed: false,
        })
      );
    });

    test('should not cache when intelligent service says no', async () => {
      mockIntelligentCachingService.shouldCache.mockReturnValue(false);

      const result = await cache.set('test-key', { value: 'test' });
      
      expect(result).toBe(false);
      expect(mockCacheStrategyCoordinator.set).not.toHaveBeenCalled();
    });

    test('should delete from cache', async () => {
      mockCacheStrategyCoordinator.delete.mockResolvedValue(true);

      const result = await cache.delete('test-key');
      
      expect(result).toBe(true);
      expect(mockCacheStrategyCoordinator.delete).toHaveBeenCalledWith('test-key');
    });

    test('should clear all cache', async () => {
      mockCacheStrategyCoordinator.clear.mockResolvedValue();

      await cache.clear();
      
      expect(mockCacheStrategyCoordinator.clear).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    test('should get multiple values', async () => {
      const mockData = {
        'key1': { value: 'data1' },
        'key2': { value: 'data2' },
        'key3': undefined,
      };
      
      mockCacheStrategyCoordinator.getMultiple.mockResolvedValue(mockData);

      const result = await cache.getMultiple(['key1', 'key2', 'key3']);
      
      expect(result).toEqual({
        'key1': { value: 'data1' },
        'key2': { value: 'data2' },
        'key3': null,
      });
      expect(mockIntelligentCachingService.trackAccess).toHaveBeenCalledTimes(3);
    });

    test('should set multiple values', async () => {
      const testData = {
        'key1': { value: 'data1' },
        'key2': { value: 'data2' },
      };

      mockIntelligentCachingService.shouldCache.mockReturnValue(true);
      mockCacheStrategyCoordinator.setMultiple.mockResolvedValue(['key1', 'key2']);

      const result = await cache.setMultiple(testData);
      
      expect(result).toEqual(['key1', 'key2']);
      expect(mockCacheStrategyCoordinator.setMultiple).toHaveBeenCalledWith(
        expect.objectContaining({
          'key1': { value: 'data1' },
          'key2': { value: 'data2' },
        }),
        expect.any(Object)
      );
    });

    test('should delete multiple values', async () => {
      mockCacheStrategyCoordinator.deleteMultiple.mockResolvedValue(['key1', 'key2']);

      const result = await cache.deleteMultiple(['key1', 'key2', 'key3']);
      
      expect(result).toEqual(['key1', 'key2']);
      expect(mockCacheStrategyCoordinator.deleteMultiple).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });
  });

  describe('Cache with Tags', () => {
    test('should set data with tags', async () => {
      const testData = { value: 'test' };
      const tags = ['user:123', 'profile'];

      mockCacheStrategyCoordinator.set.mockResolvedValue(true);

      const result = await cache.setWithTags('test-key', testData, tags);
      
      expect(result).toBe(true);
      expect(mockCacheStrategyCoordinator.set).toHaveBeenCalledWith(
        'test-key',
        testData,
        expect.objectContaining({
          tags: ['user:123', 'profile'],
        })
      );
    });

    test('should invalidate by tags', async () => {
      const mockTaggedKeys = ['key1', 'key2', 'key3'];
      mockCacheStrategyCoordinator.deleteMultiple.mockResolvedValue(mockTaggedKeys);

      // Mock the internal tag tracking
      (cache as any).taggedKeys = new Map([
        ['user:123', new Set(['key1', 'key2'])],
        ['profile', new Set(['key2', 'key3'])],
      ]);

      const result = await cache.invalidateByTags(['user:123']);
      
      expect(result).toEqual(['key1', 'key2']);
    });

    test('should invalidate by multiple tags', async () => {
      const mockTaggedKeys = ['key1', 'key2', 'key3'];
      mockCacheStrategyCoordinator.deleteMultiple.mockResolvedValue(mockTaggedKeys);

      // Mock the internal tag tracking
      (cache as any).taggedKeys = new Map([
        ['user:123', new Set(['key1', 'key2'])],
        ['profile', new Set(['key2', 'key3'])],
        ['settings', new Set(['key4'])],
      ]);

      const result = await cache.invalidateByTags(['user:123', 'profile']);
      
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });
  });

  describe('Cache with TTL', () => {
    test('should set data with custom TTL', async () => {
      const testData = { value: 'test' };
      const ttl = 600000; // 10 minutes

      mockCacheStrategyCoordinator.set.mockResolvedValue(true);

      const result = await cache.setWithTTL('test-key', testData, ttl);
      
      expect(result).toBe(true);
      expect(mockCacheStrategyCoordinator.set).toHaveBeenCalledWith(
        'test-key',
        testData,
        expect.objectContaining({
          ttl: 600000,
        })
      );
    });

    test('should set data with priority', async () => {
      const testData = { value: 'test' };
      const priority = 8;

      mockCacheStrategyCoordinator.set.mockResolvedValue(true);

      const result = await cache.setWithPriority('test-key', testData, priority);
      
      expect(result).toBe(true);
      expect(mockCacheStrategyCoordinator.set).toHaveBeenCalledWith(
        'test-key',
        testData,
        expect.objectContaining({
          priority: 8,
        })
      );
    });
  });

  describe('Compression', () => {
    test('should compress large data', async () => {
      const largeData = { value: 'x'.repeat(10000) };
      
      mockCacheStrategyCoordinator.set.mockResolvedValue(true);

      const result = await cache.set('large-key', largeData);
      
      expect(result).toBe(true);
      expect(mockCacheStrategyCoordinator.set).toHaveBeenCalledWith(
        'large-key',
        largeData,
        expect.objectContaining({
          compressed: true,
        })
      );
    });

    test('should not compress small data', async () => {
      const smallData = { value: 'small' };
      
      mockCacheStrategyCoordinator.set.mockResolvedValue(true);

      const result = await cache.set('small-key', smallData);
      
      expect(result).toBe(true);
      expect(mockCacheStrategyCoordinator.set).toHaveBeenCalledWith(
        'small-key',
        smallData,
        expect.objectContaining({
          compressed: false,
        })
      );
    });
  });

  describe('Cache Statistics', () => {
    test('should get cache statistics', async () => {
      const mockStats = {
        totalKeys: 100,
        totalSize: 1024000,
        hitRate: 0.85,
        memoryUsage: 512000,
        diskUsage: 256000,
        evictionCount: 5,
      };

      mockCacheStrategyCoordinator.getCacheStats.mockResolvedValue(mockStats);

      const stats = await cache.getStats();
      
      expect(stats).toBe(mockStats);
      expect(mockCacheStrategyCoordinator.getCacheStats).toHaveBeenCalled();
    });
  });

  describe('Cache Optimization', () => {
    test('should optimize cache', async () => {
      mockCacheStrategyCoordinator.optimizeCache.mockResolvedValue();

      await cache.optimize();
      
      expect(mockCacheStrategyCoordinator.optimizeCache).toHaveBeenCalled();
      expect(mockIntelligentCachingService.evictLeastImportant).toHaveBeenCalled();
    });

    test('should preload predicted data', async () => {
      const predictedKeys = ['key1', 'key2', 'key3'];
      mockIntelligentCachingService.getAccessPatterns.mockReturnValue({
        predicted: predictedKeys,
      });

      await cache.preloadPredicted();
      
      expect(mockIntelligentCachingService.preloadPredicted).toHaveBeenCalledWith(predictedKeys);
    });
  });

  describe('Hash Generation', () => {
    beforeEach(() => {
      // Reset crypto mock for hash tests
      Object.defineProperty(global, 'crypto', {
        value: {
          subtle: {
            digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
          },
        },
        writable: true,
      });
    });

    test('should generate hash for key', async () => {
      const mockArrayBuffer = new ArrayBuffer(32);
      const view = new Uint8Array(mockArrayBuffer);
      view[0] = 0x12;
      view[1] = 0x34;
      view[2] = 0x56;
      view[3] = 0x78;

      (global.crypto.subtle.digest as jest.Mock).mockResolvedValue(mockArrayBuffer);

      const hash = await (cache as any).generateHash('test-key');
      
      expect(hash).toBe('12345678');
      expect(global.crypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        new TextEncoder().encode('test-key')
      );
    });

    test('should handle hash generation errors', async () => {
      (global.crypto.subtle.digest as jest.Mock).mockRejectedValue(new Error('Crypto error'));

      const hash = await (cache as any).generateHash('test-key');
      
      expect(hash).toBe('test-key'); // Fallback to original key
    });
  });

  describe('Cache Warming', () => {
    test('should warm cache with data', async () => {
      const warmData = {
        'key1': { value: 'data1' },
        'key2': { value: 'data2' },
        'key3': { value: 'data3' },
      };

      mockIntelligentCachingService.shouldCache.mockReturnValue(true);
      mockCacheStrategyCoordinator.setMultiple.mockResolvedValue(Object.keys(warmData));

      const result = await cache.warm(warmData);
      
      expect(result).toEqual(['key1', 'key2', 'key3']);
      expect(mockCacheStrategyCoordinator.setMultiple).toHaveBeenCalled();
    });

    test('should skip warming non-cacheable data', async () => {
      const warmData = {
        'key1': { value: 'data1' },
        'key2': { value: 'data2' },
      };

      mockIntelligentCachingService.shouldCache
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      
      mockCacheStrategyCoordinator.setMultiple.mockResolvedValue(['key1']);

      const result = await cache.warm(warmData);
      
      expect(result).toEqual(['key1']);
    });
  });

  describe('Memory Management', () => {
    test('should track memory usage', async () => {
      const testData = { value: 'x'.repeat(1000) };
      
      mockCacheStrategyCoordinator.set.mockResolvedValue(true);

      await cache.set('memory-test', testData);
      
      const memoryUsage = (cache as any).memoryUsage;
      expect(memoryUsage).toBeGreaterThan(0);
    });

    test('should clean up memory on delete', async () => {
      const testData = { value: 'x'.repeat(1000) };
      
      // Set data first
      await cache.set('memory-test', testData);
      const initialMemory = (cache as any).memoryUsage;
      
      // Delete data
      mockCacheStrategyCoordinator.delete.mockResolvedValue(true);
      await cache.delete('memory-test');
      
      const finalMemory = (cache as any).memoryUsage;
      expect(finalMemory).toBeLessThan(initialMemory);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      (performance.now as jest.Mock).mockClear();
      (performance.mark as jest.Mock).mockClear();
      (performance.measure as jest.Mock).mockClear();
    });

    test('should measure cache operation performance', async () => {
      mockCacheStrategyCoordinator.get.mockResolvedValue({ value: 'test' });

      await cache.get('perf-test');
      
      expect(performance.mark).toHaveBeenCalledWith('cache-get-start');
      expect(performance.mark).toHaveBeenCalledWith('cache-get-end');
      expect(performance.measure).toHaveBeenCalledWith('cache-get', 'cache-get-start', 'cache-get-end');
    });

    test('should track cache hit rate', async () => {
      // Cache hit
      mockCacheStrategyCoordinator.get.mockResolvedValue({ value: 'hit' });
      await cache.get('hit-key');
      
      // Cache miss
      mockCacheStrategyCoordinator.get.mockResolvedValue(undefined);
      await cache.get('miss-key');
      
      const stats = (cache as any).performanceStats;
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('Event Emission', () => {
    test('should emit events on cache operations', async () => {
      const mockListener = jest.fn();
      cache.on('cache:hit', mockListener);

      mockCacheStrategyCoordinator.get.mockResolvedValue({ value: 'test' });
      await cache.get('event-test');
      
      expect(mockListener).toHaveBeenCalledWith({
        key: 'event-test',
        value: { value: 'test' },
        timestamp: expect.any(Number),
      });
    });

    test('should emit miss events', async () => {
      const mockListener = jest.fn();
      cache.on('cache:miss', mockListener);

      mockCacheStrategyCoordinator.get.mockResolvedValue(undefined);
      await cache.get('miss-test');
      
      expect(mockListener).toHaveBeenCalledWith({
        key: 'miss-test',
        timestamp: expect.any(Number),
      });
    });

    test('should emit set events', async () => {
      const mockListener = jest.fn();
      cache.on('cache:set', mockListener);

      mockCacheStrategyCoordinator.set.mockResolvedValue(true);
      await cache.set('set-test', { value: 'test' });
      
      expect(mockListener).toHaveBeenCalledWith({
        key: 'set-test',
        value: { value: 'test' },
        timestamp: expect.any(Number),
      });
    });

    test('should remove event listeners', () => {
      const mockListener = jest.fn();
      cache.on('cache:hit', mockListener);
      cache.off('cache:hit', mockListener);

      // Event should not be emitted after removal
      cache.emit('cache:hit', { key: 'test', value: 'test', timestamp: Date.now() });
      
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle coordinator errors gracefully', async () => {
      mockCacheStrategyCoordinator.get.mockRejectedValue(new Error('Coordinator error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await cache.get('error-key');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle set errors gracefully', async () => {
      mockCacheStrategyCoordinator.set.mockRejectedValue(new Error('Set error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await cache.set('error-key', { value: 'test' });
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle intelligent caching service errors', async () => {
      mockIntelligentCachingService.shouldCache.mockImplementation(() => {
        throw new Error('Intelligence error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await cache.set('intelligence-error', { value: 'test' });
      
      // Should fall back to caching when intelligence service fails
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Singleton Instance', () => {
    test('should export singleton instance', () => {
      expect(cacheIntegration).toBeInstanceOf(CacheIntegration);
    });

    test('should maintain same instance', () => {
      const instance1 = cacheIntegration;
      const instance2 = cacheIntegration;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources on destroy', () => {
      const mockEventListener = jest.fn();
      cache.on('cache:hit', mockEventListener);
      
      cache.destroy();
      
      expect(mockCacheStrategyCoordinator.unregister).toHaveBeenCalled();
      
      // Should not emit events after destruction
      cache.emit('cache:hit', { key: 'test', value: 'test', timestamp: Date.now() });
      expect(mockEventListener).not.toHaveBeenCalled();
    });

    test('should clear intervals on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      cache.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});