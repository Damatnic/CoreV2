/**
 * @jest-environment jsdom
 */

import { CacheStrategyCoordinator, getCacheStrategyCoordinator } from '../cacheStrategyCoordinator';

// Mock storage implementations
const mockMemoryStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  keys: jest.fn(),
  size: jest.fn(),
  has: jest.fn(),
};

const mockLocalStorageStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  keys: jest.fn(),
  size: jest.fn(),
  has: jest.fn(),
};

const mockIndexedDBStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  keys: jest.fn(),
  size: jest.fn(),
  has: jest.fn(),
};

// Mock storage factory
jest.mock('../../utils/storage', () => ({
  createMemoryStore: () => mockMemoryStore,
  createLocalStorageStore: () => mockLocalStorageStore,
  createIndexedDBStore: () => mockIndexedDBStore,
}));

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
  writable: true,
});

describe('CacheStrategyCoordinator', () => {
  let coordinator: CacheStrategyCoordinator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock return values
    mockMemoryStore.get.mockResolvedValue(undefined);
    mockMemoryStore.set.mockResolvedValue(true);
    mockMemoryStore.delete.mockResolvedValue(true);
    mockMemoryStore.clear.mockResolvedValue();
    mockMemoryStore.keys.mockResolvedValue([]);
    mockMemoryStore.size.mockResolvedValue(0);
    mockMemoryStore.has.mockResolvedValue(false);

    mockLocalStorageStore.get.mockResolvedValue(undefined);
    mockLocalStorageStore.set.mockResolvedValue(true);
    mockLocalStorageStore.delete.mockResolvedValue(true);
    mockLocalStorageStore.clear.mockResolvedValue();
    mockLocalStorageStore.keys.mockResolvedValue([]);
    mockLocalStorageStore.size.mockResolvedValue(0);
    mockLocalStorageStore.has.mockResolvedValue(false);

    mockIndexedDBStore.get.mockResolvedValue(undefined);
    mockIndexedDBStore.set.mockResolvedValue(true);
    mockIndexedDBStore.delete.mockResolvedValue(true);
    mockIndexedDBStore.clear.mockResolvedValue();
    mockIndexedDBStore.keys.mockResolvedValue([]);
    mockIndexedDBStore.size.mockResolvedValue(0);
    mockIndexedDBStore.has.mockResolvedValue(false);

    coordinator = new CacheStrategyCoordinator();
  });

  afterEach(() => {
    if (coordinator) {
      coordinator.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(coordinator).toBeDefined();
    });

    test('should initialize storage layers', () => {
      expect(mockMemoryStore).toBeDefined();
      expect(mockLocalStorageStore).toBeDefined();
      expect(mockIndexedDBStore).toBeDefined();
    });

    test('should register cache instances', () => {
      const cacheInstance = { id: 'test-cache' };
      coordinator.register(cacheInstance);
      
      const instances = coordinator.getRegisteredInstances();
      expect(instances).toContain(cacheInstance);
    });

    test('should unregister cache instances', () => {
      const cacheInstance = { id: 'test-cache' };
      coordinator.register(cacheInstance);
      coordinator.unregister(cacheInstance);
      
      const instances = coordinator.getRegisteredInstances();
      expect(instances).not.toContain(cacheInstance);
    });
  });

  describe('Cache Strategy Selection', () => {
    test('should use memory for high-priority items', async () => {
      const options = {
        priority: 9,
        ttl: 60000,
        tags: [],
        compressed: false,
      };

      await coordinator.set('high-priority-key', { value: 'test' }, options);
      
      expect(mockMemoryStore.set).toHaveBeenCalledWith(
        'high-priority-key',
        expect.objectContaining({
          data: { value: 'test' },
          metadata: expect.objectContaining({
            priority: 9,
            strategy: 'memory',
          }),
        })
      );
    });

    test('should use localStorage for medium-priority items', async () => {
      const options = {
        priority: 5,
        ttl: 300000,
        tags: [],
        compressed: false,
      };

      await coordinator.set('medium-priority-key', { value: 'test' }, options);
      
      expect(mockLocalStorageStore.set).toHaveBeenCalledWith(
        'medium-priority-key',
        expect.objectContaining({
          data: { value: 'test' },
          metadata: expect.objectContaining({
            priority: 5,
            strategy: 'localStorage',
          }),
        })
      );
    });

    test('should use IndexedDB for low-priority items', async () => {
      const options = {
        priority: 2,
        ttl: 3600000,
        tags: [],
        compressed: false,
      };

      await coordinator.set('low-priority-key', { value: 'test' }, options);
      
      expect(mockIndexedDBStore.set).toHaveBeenCalledWith(
        'low-priority-key',
        expect.objectContaining({
          data: { value: 'test' },
          metadata: expect.objectContaining({
            priority: 2,
            strategy: 'indexedDB',
          }),
        })
      );
    });

    test('should use IndexedDB for large data regardless of priority', async () => {
      const largeData = { value: 'x'.repeat(100000) }; // Large data
      const options = {
        priority: 9,
        ttl: 60000,
        tags: [],
        compressed: false,
      };

      await coordinator.set('large-data-key', largeData, options);
      
      expect(mockIndexedDBStore.set).toHaveBeenCalled();
      expect(mockMemoryStore.set).not.toHaveBeenCalled();
    });

    test('should use memory for frequent access items', async () => {
      // Simulate frequent access by setting access count
      const entry = {
        data: { value: 'frequent' },
        metadata: {
          accessCount: 100,
          lastAccess: Date.now(),
          priority: 3,
          strategy: 'localStorage',
        },
      };

      mockLocalStorageStore.get.mockResolvedValue(entry);
      
      await coordinator.get('frequent-key');
      
      // After frequent access, should be moved to memory
      const strategy = (coordinator as any).selectStrategy('frequent-key', { value: 'frequent' }, {
        priority: 3,
        ttl: 300000,
        tags: [],
        compressed: false,
      });
      
      expect(strategy).toBe('memory');
    });
  });

  describe('Data Retrieval', () => {
    test('should get data from memory first', async () => {
      const testData = {
        data: { value: 'memory-data' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 8,
          strategy: 'memory',
          accessCount: 1,
          lastAccess: Date.now(),
        },
      };
      
      mockMemoryStore.get.mockResolvedValue(testData);

      const result = await coordinator.get('test-key');
      
      expect(result).toEqual({ value: 'memory-data' });
      expect(mockMemoryStore.get).toHaveBeenCalledWith('test-key');
      expect(mockLocalStorageStore.get).not.toHaveBeenCalled();
      expect(mockIndexedDBStore.get).not.toHaveBeenCalled();
    });

    test('should fallback to localStorage if not in memory', async () => {
      const testData = {
        data: { value: 'localStorage-data' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'localStorage',
          accessCount: 1,
          lastAccess: Date.now(),
        },
      };

      mockMemoryStore.get.mockResolvedValue(undefined);
      mockLocalStorageStore.get.mockResolvedValue(testData);

      const result = await coordinator.get('test-key');
      
      expect(result).toEqual({ value: 'localStorage-data' });
      expect(mockMemoryStore.get).toHaveBeenCalledWith('test-key');
      expect(mockLocalStorageStore.get).toHaveBeenCalledWith('test-key');
    });

    test('should fallback to IndexedDB if not in memory or localStorage', async () => {
      const testData = {
        data: { value: 'indexedDB-data' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 2,
          strategy: 'indexedDB',
          accessCount: 1,
          lastAccess: Date.now(),
        },
      };

      mockMemoryStore.get.mockResolvedValue(undefined);
      mockLocalStorageStore.get.mockResolvedValue(undefined);
      mockIndexedDBStore.get.mockResolvedValue(testData);

      const result = await coordinator.get('test-key');
      
      expect(result).toEqual({ value: 'indexedDB-data' });
      expect(mockIndexedDBStore.get).toHaveBeenCalledWith('test-key');
    });

    test('should return undefined if not found in any store', async () => {
      mockMemoryStore.get.mockResolvedValue(undefined);
      mockLocalStorageStore.get.mockResolvedValue(undefined);
      mockIndexedDBStore.get.mockResolvedValue(undefined);

      const result = await coordinator.get('nonexistent-key');
      
      expect(result).toBeUndefined();
    });

    test('should handle expired entries', async () => {
      const expiredData = {
        data: { value: 'expired-data' },
        metadata: {
          expiresAt: Date.now() - 60000, // Expired 1 minute ago
          priority: 5,
          strategy: 'localStorage',
          accessCount: 1,
          lastAccess: Date.now() - 60000,
        },
      };

      mockMemoryStore.get.mockResolvedValue(undefined);
      mockLocalStorageStore.get.mockResolvedValue(expiredData);

      const result = await coordinator.get('expired-key');
      
      expect(result).toBeUndefined();
      expect(mockLocalStorageStore.delete).toHaveBeenCalledWith('expired-key');
    });

    test('should promote frequently accessed data', async () => {
      const testData = {
        data: { value: 'promoted-data' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'localStorage',
          accessCount: 10, // High access count
          lastAccess: Date.now(),
        },
      };

      mockMemoryStore.get.mockResolvedValue(undefined);
      mockLocalStorageStore.get.mockResolvedValue(testData);

      await coordinator.get('promoted-key');
      
      // Should promote to memory after frequent access
      expect(mockMemoryStore.set).toHaveBeenCalled();
    });
  });

  describe('Data Storage', () => {
    test('should compress large data automatically', async () => {
      const largeData = { value: 'x'.repeat(5000) };
      const options = {
        priority: 5,
        ttl: 300000,
        tags: [],
        compressed: false, // Initially false
      };

      await coordinator.set('large-compressed-key', largeData, options);
      
      // Should detect large data and compress
      expect(mockLocalStorageStore.set).toHaveBeenCalledWith(
        'large-compressed-key',
        expect.objectContaining({
          metadata: expect.objectContaining({
            compressed: true,
          }),
        })
      );
    });

    test('should handle compression errors gracefully', async () => {
      const testData = { value: 'test' };
      const options = {
        priority: 5,
        ttl: 300000,
        tags: [],
        compressed: true,
      };

      // Mock compression failure
      const originalJSON = JSON.stringify;
      JSON.stringify = jest.fn(() => {
        throw new Error('Compression error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await coordinator.set('compression-error-key', testData, options);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore
      JSON.stringify = originalJSON;
      consoleSpy.mockRestore();
    });
  });

  describe('Batch Operations', () => {
    test('should get multiple keys', async () => {
      const data1 = {
        data: { value: 'data1' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'memory',
          accessCount: 1,
          lastAccess: Date.now(),
        },
      };

      const data2 = {
        data: { value: 'data2' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'localStorage',
          accessCount: 1,
          lastAccess: Date.now(),
        },
      };

      mockMemoryStore.get
        .mockResolvedValueOnce(data1)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      
      mockLocalStorageStore.get
        .mockResolvedValueOnce(data2)
        .mockResolvedValueOnce(undefined);
      
      mockIndexedDBStore.get.mockResolvedValue(undefined);

      const result = await coordinator.getMultiple(['key1', 'key2', 'key3']);
      
      expect(result).toEqual({
        key1: { value: 'data1' },
        key2: { value: 'data2' },
        key3: undefined,
      });
    });

    test('should set multiple keys', async () => {
      const data = {
        'key1': { value: 'data1' },
        'key2': { value: 'data2' },
        'key3': { value: 'data3' },
      };

      const options = {
        priority: 5,
        ttl: 300000,
        tags: [],
        compressed: false,
      };

      mockLocalStorageStore.set.mockResolvedValue(true);

      const result = await coordinator.setMultiple(data, options);
      
      expect(result).toEqual(['key1', 'key2', 'key3']);
      expect(mockLocalStorageStore.set).toHaveBeenCalledTimes(3);
    });

    test('should delete multiple keys', async () => {
      // Mock the keys existing in different stores
      mockMemoryStore.has
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      
      mockLocalStorageStore.has
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      
      mockIndexedDBStore.has
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      mockMemoryStore.delete.mockResolvedValue(true);
      mockLocalStorageStore.delete.mockResolvedValue(true);
      mockIndexedDBStore.delete.mockResolvedValue(true);

      const result = await coordinator.deleteMultiple(['key1', 'key2', 'key3']);
      
      expect(result).toEqual(['key1', 'key2', 'key3']);
      expect(mockMemoryStore.delete).toHaveBeenCalledWith('key1');
      expect(mockLocalStorageStore.delete).toHaveBeenCalledWith('key2');
      expect(mockIndexedDBStore.delete).toHaveBeenCalledWith('key3');
    });
  });

  describe('Cache Invalidation', () => {
    test('should delete from all appropriate stores', async () => {
      mockMemoryStore.has.mockResolvedValue(true);
      mockLocalStorageStore.has.mockResolvedValue(true);
      mockIndexedDBStore.has.mockResolvedValue(false);

      mockMemoryStore.delete.mockResolvedValue(true);
      mockLocalStorageStore.delete.mockResolvedValue(true);

      const result = await coordinator.delete('test-key');
      
      expect(result).toBe(true);
      expect(mockMemoryStore.delete).toHaveBeenCalledWith('test-key');
      expect(mockLocalStorageStore.delete).toHaveBeenCalledWith('test-key');
      expect(mockIndexedDBStore.delete).not.toHaveBeenCalled();
    });

    test('should clear all stores', async () => {
      await coordinator.clear();
      
      expect(mockMemoryStore.clear).toHaveBeenCalled();
      expect(mockLocalStorageStore.clear).toHaveBeenCalled();
      expect(mockIndexedDBStore.clear).toHaveBeenCalled();
    });
  });

  describe('Cache Statistics', () => {
    test('should collect stats from all stores', async () => {
      mockMemoryStore.size.mockResolvedValue(10);
      mockLocalStorageStore.size.mockResolvedValue(50);
      mockIndexedDBStore.size.mockResolvedValue(100);

      mockMemoryStore.keys.mockResolvedValue(['key1', 'key2']);
      mockLocalStorageStore.keys.mockResolvedValue(['key3', 'key4', 'key5']);
      mockIndexedDBStore.keys.mockResolvedValue(['key6', 'key7', 'key8', 'key9']);

      const stats = await coordinator.getCacheStats();
      
      expect(stats.totalKeys).toBe(160);
      expect(stats.distribution.memory).toBe(10);
      expect(stats.distribution.localStorage).toBe(50);
      expect(stats.distribution.indexedDB).toBe(100);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeLessThanOrEqual(1);
    });

    test('should track hit and miss rates', async () => {
      // Simulate cache hit
      const testData = {
        data: { value: 'hit-data' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'memory',
          accessCount: 1,
          lastAccess: Date.now(),
        },
      };

      mockMemoryStore.get.mockResolvedValue(testData);
      await coordinator.get('hit-key');

      // Simulate cache miss
      mockMemoryStore.get.mockResolvedValue(undefined);
      mockLocalStorageStore.get.mockResolvedValue(undefined);
      mockIndexedDBStore.get.mockResolvedValue(undefined);
      await coordinator.get('miss-key');

      const stats = await coordinator.getCacheStats();
      
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.hitRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Cache Optimization', () => {
    test('should optimize cache by moving frequently accessed items', async () => {
      mockLocalStorageStore.keys.mockResolvedValue(['frequent-key', 'rare-key']);
      
      const frequentData = {
        data: { value: 'frequent' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'localStorage',
          accessCount: 100,
          lastAccess: Date.now() - 1000,
        },
      };

      const rareData = {
        data: { value: 'rare' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'localStorage',
          accessCount: 1,
          lastAccess: Date.now() - 86400000, // 1 day ago
        },
      };

      mockLocalStorageStore.get
        .mockResolvedValueOnce(frequentData)
        .mockResolvedValueOnce(rareData);

      await coordinator.optimizeCache();
      
      // Frequently accessed item should be promoted to memory
      expect(mockMemoryStore.set).toHaveBeenCalledWith(
        'frequent-key',
        expect.objectContaining({
          data: { value: 'frequent' },
        })
      );

      // Rarely accessed item should be demoted to IndexedDB
      expect(mockIndexedDBStore.set).toHaveBeenCalledWith(
        'rare-key',
        expect.objectContaining({
          data: { value: 'rare' },
        })
      );
    });

    test('should evict expired entries during optimization', async () => {
      mockMemoryStore.keys.mockResolvedValue(['expired-key', 'valid-key']);
      
      const expiredData = {
        data: { value: 'expired' },
        metadata: {
          expiresAt: Date.now() - 60000, // Expired
          priority: 8,
          strategy: 'memory',
          accessCount: 1,
          lastAccess: Date.now() - 60000,
        },
      };

      const validData = {
        data: { value: 'valid' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 8,
          strategy: 'memory',
          accessCount: 1,
          lastAccess: Date.now(),
        },
      };

      mockMemoryStore.get
        .mockResolvedValueOnce(expiredData)
        .mockResolvedValueOnce(validData);

      await coordinator.optimizeCache();
      
      expect(mockMemoryStore.delete).toHaveBeenCalledWith('expired-key');
    });

    test('should respect memory limits during optimization', async () => {
      // Mock memory store being full
      const memoryFullError = new Error('Memory limit exceeded');
      mockMemoryStore.set.mockRejectedValue(memoryFullError);

      mockLocalStorageStore.keys.mockResolvedValue(['test-key']);
      
      const testData = {
        data: { value: 'test' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'localStorage',
          accessCount: 50,
          lastAccess: Date.now() - 1000,
        },
      };

      mockLocalStorageStore.get.mockResolvedValue(testData);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await coordinator.optimizeCache();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Event System', () => {
    test('should emit cache events', async () => {
      const mockListener = jest.fn();
      coordinator.on('cache:hit', mockListener);

      const testData = {
        data: { value: 'event-test' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'memory',
          accessCount: 1,
          lastAccess: Date.now(),
        },
      };

      mockMemoryStore.get.mockResolvedValue(testData);
      
      await coordinator.get('event-key');
      
      expect(mockListener).toHaveBeenCalledWith({
        key: 'event-key',
        strategy: 'memory',
        timestamp: expect.any(Number),
      });
    });

    test('should emit miss events', async () => {
      const mockListener = jest.fn();
      coordinator.on('cache:miss', mockListener);

      mockMemoryStore.get.mockResolvedValue(undefined);
      mockLocalStorageStore.get.mockResolvedValue(undefined);
      mockIndexedDBStore.get.mockResolvedValue(undefined);
      
      await coordinator.get('miss-event-key');
      
      expect(mockListener).toHaveBeenCalledWith({
        key: 'miss-event-key',
        timestamp: expect.any(Number),
      });
    });

    test('should remove event listeners', () => {
      const mockListener = jest.fn();
      coordinator.on('cache:hit', mockListener);
      coordinator.off('cache:hit', mockListener);

      coordinator.emit('cache:hit', { key: 'test', strategy: 'memory', timestamp: Date.now() });
      
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      mockMemoryStore.get.mockRejectedValue(new Error('Memory store error'));
      mockLocalStorageStore.get.mockResolvedValue({
        data: { value: 'fallback' },
        metadata: {
          expiresAt: Date.now() + 60000,
          priority: 5,
          strategy: 'localStorage',
          accessCount: 1,
          lastAccess: Date.now(),
        },
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await coordinator.get('error-key');
      
      expect(result).toEqual({ value: 'fallback' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle set errors gracefully', async () => {
      mockMemoryStore.set.mockRejectedValue(new Error('Set error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await coordinator.set('error-key', { value: 'test' }, {
        priority: 8,
        ttl: 60000,
        tags: [],
        compressed: false,
      });
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle delete errors gracefully', async () => {
      mockMemoryStore.has.mockResolvedValue(true);
      mockMemoryStore.delete.mockRejectedValue(new Error('Delete error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await coordinator.delete('error-key');
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle stats collection errors', async () => {
      mockMemoryStore.size.mockRejectedValue(new Error('Stats error'));
      mockLocalStorageStore.size.mockResolvedValue(10);
      mockIndexedDBStore.size.mockResolvedValue(20);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const stats = await coordinator.getCacheStats();
      
      expect(stats.distribution.memory).toBe(0); // Should default to 0 on error
      expect(stats.distribution.localStorage).toBe(10);
      expect(stats.distribution.indexedDB).toBe(20);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    test('should track memory usage', async () => {
      const testData = { value: 'x'.repeat(1000) };
      const options = {
        priority: 8,
        ttl: 60000,
        tags: [],
        compressed: false,
      };

      await coordinator.set('memory-test', testData, options);
      
      const stats = await coordinator.getCacheStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    test('should enforce memory limits', async () => {
      const config = (coordinator as any).config;
      config.memoryLimit = 1000; // Very small limit
      
      const largeData = { value: 'x'.repeat(2000) };
      const options = {
        priority: 8,
        ttl: 60000,
        tags: [],
        compressed: false,
      };

      // Should reject due to size
      const result = await coordinator.set('too-large', largeData, options);
      
      expect(result).toBe(false);
    });
  });

  describe('Singleton Instance', () => {
    test('should export singleton function', () => {
      const instance1 = getCacheStrategyCoordinator();
      const instance2 = getCacheStrategyCoordinator();
      expect(instance1).toBe(instance2);
    });

    test('should maintain same coordinator instance', () => {
      expect(getCacheStrategyCoordinator()).toBeInstanceOf(CacheStrategyCoordinator);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources on destroy', () => {
      const mockListener = jest.fn();
      coordinator.on('cache:hit', mockListener);
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      coordinator.destroy();
      
      // Should clear intervals
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      // Should not emit events after destruction
      coordinator.emit('cache:hit', { key: 'test', strategy: 'memory', timestamp: Date.now() });
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    test('should allow custom configuration', () => {
      const customConfig = {
        memoryLimit: 10 * 1024 * 1024, // 10MB
        localStorageLimit: 5 * 1024 * 1024, // 5MB
        indexedDBLimit: 100 * 1024 * 1024, // 100MB
        defaultTTL: 600000, // 10 minutes
        compressionThreshold: 2048, // 2KB
        optimizationInterval: 120000, // 2 minutes
      };

      const customCoordinator = new CacheStrategyCoordinator(customConfig);
      const config = (customCoordinator as any).config;
      
      expect(config.memoryLimit).toBe(customConfig.memoryLimit);
      expect(config.localStorageLimit).toBe(customConfig.localStorageLimit);
      expect(config.indexedDBLimit).toBe(customConfig.indexedDBLimit);
      expect(config.defaultTTL).toBe(customConfig.defaultTTL);
      expect(config.compressionThreshold).toBe(customConfig.compressionThreshold);
      expect(config.optimizationInterval).toBe(customConfig.optimizationInterval);
      
      customCoordinator.destroy();
    });

    test('should validate configuration values', () => {
      const invalidConfig = {
        memoryLimit: -1000, // Invalid negative value
        localStorageLimit: 'invalid', // Invalid type
        optimizationInterval: 0, // Invalid zero value
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const customCoordinator = new CacheStrategyCoordinator(invalidConfig as any);
      
      // Should use defaults for invalid values
      const config = (customCoordinator as any).config;
      expect(config.memoryLimit).toBeGreaterThan(0);
      expect(typeof config.localStorageLimit).toBe('number');
      expect(config.optimizationInterval).toBeGreaterThan(0);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
      customCoordinator.destroy();
    });
  });
});