/**
 * Test Suite for Storage Service
 * Tests local storage, session storage, and data persistence
 */

import { storageService } from '../storageService';

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
    storageService.reset();
  });

  describe('Local Storage Operations', () => {
    it('should set and get items from localStorage', () => {
      storageService.setItem('testKey', 'testValue');
      
      expect(storageService.getItem('testKey')).toBe('testValue');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', '"testValue"');
    });

    it('should store objects as JSON', () => {
      const testObject = { name: 'Test', value: 123 };
      storageService.setItem('objectKey', testObject);
      
      const retrieved = storageService.getItem('objectKey');
      expect(retrieved).toEqual(testObject);
    });

    it('should handle arrays', () => {
      const testArray = [1, 2, 3, 'test'];
      storageService.setItem('arrayKey', testArray);
      
      const retrieved = storageService.getItem('arrayKey');
      expect(retrieved).toEqual(testArray);
    });

    it('should remove items', () => {
      storageService.setItem('tempKey', 'tempValue');
      storageService.removeItem('tempKey');
      
      expect(storageService.getItem('tempKey')).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tempKey');
    });

    it('should clear all items', () => {
      storageService.setItem('key1', 'value1');
      storageService.setItem('key2', 'value2');
      storageService.clear();
      
      expect(storageService.getItem('key1')).toBeNull();
      expect(storageService.getItem('key2')).toBeNull();
      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('Session Storage Operations', () => {
    it('should set and get items from sessionStorage', () => {
      storageService.setSessionItem('sessionKey', 'sessionValue');
      
      expect(storageService.getSessionItem('sessionKey')).toBe('sessionValue');
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('sessionKey', '"sessionValue"');
    });

    it('should clear session storage independently', () => {
      storageService.setItem('localKey', 'localValue');
      storageService.setSessionItem('sessionKey', 'sessionValue');
      
      storageService.clearSession();
      
      expect(storageService.getSessionItem('sessionKey')).toBeNull();
      expect(storageService.getItem('localKey')).toBe('localValue');
    });
  });

  describe('Encryption', () => {
    it('should encrypt sensitive data', () => {
      const sensitiveData = { password: 'secret123', ssn: '123-45-6789' };
      
      storageService.setSecureItem('sensitive', sensitiveData);
      
      // Check that stored value is encrypted (not plaintext)
      const storedValue = localStorageMock.getItem('secure_sensitive');
      expect(storedValue).not.toContain('secret123');
      expect(storedValue).not.toContain('123-45-6789');
    });

    it('should decrypt sensitive data on retrieval', () => {
      const sensitiveData = { apiKey: 'abc123xyz' };
      
      storageService.setSecureItem('apiData', sensitiveData);
      const retrieved = storageService.getSecureItem('apiData');
      
      expect(retrieved).toEqual(sensitiveData);
    });

    it('should handle encryption errors gracefully', () => {
      // Mock encryption failure
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      storageService.setSecureItem('', null);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Expiration', () => {
    it('should set items with expiration', () => {
      jest.useFakeTimers();
      
      storageService.setItemWithExpiry('tempData', 'value', 3600000); // 1 hour
      
      expect(storageService.getItem('tempData')).toBe('value');
      
      // Advance time past expiration
      jest.advanceTimersByTime(3600001);
      
      expect(storageService.getItem('tempData')).toBeNull();
      
      jest.useRealTimers();
    });

    it('should clean up expired items', () => {
      jest.useFakeTimers();
      
      storageService.setItemWithExpiry('expire1', 'value1', 1000);
      storageService.setItemWithExpiry('expire2', 'value2', 2000);
      storageService.setItem('permanent', 'value3');
      
      jest.advanceTimersByTime(1500);
      
      storageService.cleanupExpired();
      
      expect(storageService.getItem('expire1')).toBeNull();
      expect(storageService.getItem('expire2')).toBe('value2');
      expect(storageService.getItem('permanent')).toBe('value3');
      
      jest.useRealTimers();
    });
  });

  describe('Size Management', () => {
    it('should calculate storage size', () => {
      storageService.setItem('key1', 'a'.repeat(1000));
      storageService.setItem('key2', 'b'.repeat(2000));
      
      const size = storageService.getStorageSize();
      
      expect(size).toBeGreaterThan(3000);
    });

    it('should check if storage is available', () => {
      expect(storageService.isStorageAvailable()).toBe(true);
    });

    it('should handle quota exceeded errors', () => {
      // Mock quota exceeded
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      const result = storageService.setItem('largeData', 'x'.repeat(10000000));
      
      expect(result).toBe(false);
    });

    it('should implement LRU eviction when quota exceeded', () => {
      // Set max size limit
      storageService.setMaxSize(100);
      
      storageService.setItem('old', 'oldData');
      storageService.setItem('medium', 'mediumData');
      storageService.setItem('new', 'newData');
      
      // Access 'old' to make it recently used
      storageService.getItem('old');
      
      // Add large item that triggers eviction
      storageService.setItem('large', 'x'.repeat(50));
      
      // 'medium' should be evicted (least recently used)
      expect(storageService.getItem('medium')).toBeNull();
      expect(storageService.getItem('old')).toBe('oldData');
      expect(storageService.getItem('new')).toBe('newData');
    });
  });

  describe('Namespacing', () => {
    it('should support namespaced storage', () => {
      const userStorage = storageService.namespace('user123');
      const appStorage = storageService.namespace('app');
      
      userStorage.setItem('preference', 'dark');
      appStorage.setItem('preference', 'light');
      
      expect(userStorage.getItem('preference')).toBe('dark');
      expect(appStorage.getItem('preference')).toBe('light');
    });

    it('should clear namespace without affecting others', () => {
      const ns1 = storageService.namespace('ns1');
      const ns2 = storageService.namespace('ns2');
      
      ns1.setItem('key', 'value1');
      ns2.setItem('key', 'value2');
      
      ns1.clear();
      
      expect(ns1.getItem('key')).toBeNull();
      expect(ns2.getItem('key')).toBe('value2');
    });
  });

  describe('Backup and Restore', () => {
    it('should create backup of all data', () => {
      storageService.setItem('key1', 'value1');
      storageService.setItem('key2', { data: 'value2' });
      
      const backup = storageService.createBackup();
      
      expect(backup).toHaveProperty('timestamp');
      expect(backup).toHaveProperty('data');
      expect(backup.data).toHaveProperty('key1');
      expect(backup.data).toHaveProperty('key2');
    });

    it('should restore from backup', () => {
      storageService.setItem('key1', 'value1');
      
      const backup = storageService.createBackup();
      
      storageService.clear();
      expect(storageService.getItem('key1')).toBeNull();
      
      storageService.restoreBackup(backup);
      expect(storageService.getItem('key1')).toBe('value1');
    });

    it('should validate backup before restore', () => {
      const invalidBackup = { data: null, timestamp: null };
      
      const result = storageService.restoreBackup(invalidBackup as any);
      
      expect(result).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    it('should emit events on storage changes', () => {
      const listener = jest.fn();
      
      storageService.addEventListener('change', listener);
      storageService.setItem('key', 'value');
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        key: 'key',
        newValue: 'value',
        oldValue: null
      }));
    });

    it('should handle storage events from other tabs', () => {
      const listener = jest.fn();
      storageService.addEventListener('change', listener);
      
      // Simulate storage event from another tab
      const event = new StorageEvent('storage', {
        key: 'externalKey',
        newValue: '"externalValue"',
        oldValue: null,
        storageArea: localStorage
      });
      
      window.dispatchEvent(event);
      
      expect(listener).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      const listener = jest.fn();
      
      storageService.addEventListener('change', listener);
      storageService.removeEventListener('change', listener);
      storageService.setItem('key', 'value');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Migration', () => {
    it('should migrate data between storage types', () => {
      // Set data in session storage
      storageService.setSessionItem('migrateKey', 'migrateValue');
      
      // Migrate to local storage
      storageService.migrate('migrateKey', 'session', 'local');
      
      expect(storageService.getItem('migrateKey')).toBe('migrateValue');
      expect(storageService.getSessionItem('migrateKey')).toBeNull();
    });

    it('should migrate with transformation', () => {
      storageService.setItem('oldFormat', { version: 1, data: 'test' });
      
      storageService.migrateWithTransform('oldFormat', (oldData: any) => ({
        version: 2,
        content: oldData.data,
        migrated: true
      }));
      
      const migrated = storageService.getItem('oldFormat');
      expect(migrated.version).toBe(2);
      expect(migrated.content).toBe('test');
      expect(migrated.migrated).toBe(true);
    });
  });

  describe('Compression', () => {
    it('should compress large data', () => {
      const largeData = 'x'.repeat(10000);
      
      storageService.setCompressedItem('large', largeData);
      
      // Check that stored size is smaller than original
      const storedValue = localStorageMock.getItem('compressed_large');
      expect(storedValue.length).toBeLessThan(largeData.length);
    });

    it('should decompress on retrieval', () => {
      const originalData = { large: 'y'.repeat(5000) };
      
      storageService.setCompressedItem('compressed', originalData);
      const retrieved = storageService.getCompressedItem('compressed');
      
      expect(retrieved).toEqual(originalData);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted data gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('corrupted{invalid json');
      
      const result = storageService.getItem('corrupted');
      
      expect(result).toBeNull();
    });

    it('should handle missing localStorage', () => {
      // Temporarily remove localStorage
      const originalLS = window.localStorage;
      delete (window as any).localStorage;
      
      const fallbackStorage = storageService.getFallbackStorage();
      expect(fallbackStorage).toBeDefined();
      
      // Restore
      Object.defineProperty(window, 'localStorage', { value: originalLS });
    });

    it('should handle private browsing mode', () => {
      // Mock private browsing (storage throws)
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Private browsing');
      });
      
      const result = storageService.setItem('test', 'value');
      
      expect(result).toBe(false);
      // Should fallback to memory storage
      expect(storageService.getItem('test')).toBe('value');
    });
  });
});