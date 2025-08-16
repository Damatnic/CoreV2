import React from 'react';
import { renderHook, act, waitFor } from '../test-utils';
import { useServiceWorker, useOfflineStatus, useCacheManager } from './useServiceWorker';
import serviceWorkerManager from '../services/serviceWorkerManager';

// Mock the service worker manager
jest.mock('../services/serviceWorkerManager', () => ({
  __esModule: true,
  default: {
    onOnline: jest.fn(),
    onOffline: jest.fn(),
    onUpdateAvailable: jest.fn(),
    removeOnlineListener: jest.fn(),
    removeOfflineListener: jest.fn(),
    removeUpdateListener: jest.fn(),
    isOfflineReady: jest.fn(),
    getCacheStatus: jest.fn(),
    skipWaiting: jest.fn(),
    checkForUpdates: jest.fn(),
    clearCache: jest.fn(),
    cacheCrisisResource: jest.fn(),
    precacheCrisisResources: jest.fn(),
    forceReload: jest.fn(),
    getNetworkStatus: jest.fn()
  }
}));

// Mock navigator
Object.defineProperty(global.navigator, 'onLine', {
  value: true,
  writable: true
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useServiceWorker Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (navigator as any).onLine = true;
    
    // Default mock implementations
    (serviceWorkerManager.isOfflineReady as jest.Mock).mockResolvedValue(false);
    (serviceWorkerManager.getCacheStatus as jest.Mock).mockResolvedValue({
      totalSize: 1024,
      itemCount: 10,
      lastUpdated: Date.now()
    });
    (serviceWorkerManager.getNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: true
    });
  });

  it('should initialize with correct default state', async () => {
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOfflineReady).toBe(false);
    expect(result.current.updateAvailable).toBe(false);
    expect(result.current.cacheStatus).toBeNull();
  });

  it('should register event listeners on mount', () => {
    renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    expect(serviceWorkerManager.onOnline).toHaveBeenCalled();
    expect(serviceWorkerManager.onOffline).toHaveBeenCalled();
    expect(serviceWorkerManager.onUpdateAvailable).toHaveBeenCalled();
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    unmount();
    
    expect(serviceWorkerManager.removeOnlineListener).toHaveBeenCalled();
    expect(serviceWorkerManager.removeOfflineListener).toHaveBeenCalled();
    expect(serviceWorkerManager.removeUpdateListener).toHaveBeenCalled();
  });

  it('should update online status when coming online', async () => {
    let onlineHandler: () => void;
    (serviceWorkerManager.onOnline as jest.Mock).mockImplementation((handler) => {
      onlineHandler = handler;
    });

    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    // Initially offline
    result.current.isOnline = false;
    
    await act(async () => {
      onlineHandler();
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should update online status when going offline', async () => {
    let offlineHandler: () => void;
    (serviceWorkerManager.onOffline as jest.Mock).mockImplementation((handler) => {
      offlineHandler = handler;
    });

    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    await act(async () => {
      offlineHandler();
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should update when service worker update is available', async () => {
    let updateHandler: () => void;
    (serviceWorkerManager.onUpdateAvailable as jest.Mock).mockImplementation((handler) => {
      updateHandler = handler;
    });

    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    await act(async () => {
      updateHandler();
    });

    expect(result.current.updateAvailable).toBe(true);
  });

  it('should check offline readiness on mount', async () => {
    (serviceWorkerManager.isOfflineReady as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.isOfflineReady).toBe(true);
    });

    expect(serviceWorkerManager.isOfflineReady).toHaveBeenCalled();
  });

  it('should handle offline readiness check errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (serviceWorkerManager.isOfflineReady as jest.Mock).mockRejectedValue(new Error('Check failed'));
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.isOfflineReady).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to check offline readiness:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should get cache status on mount', async () => {
    const mockCacheStatus = {
      totalSize: 2048,
      itemCount: 20,
      lastUpdated: Date.now()
    };
    
    (serviceWorkerManager.getCacheStatus as jest.Mock).mockResolvedValue(mockCacheStatus);
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.cacheStatus).toEqual(mockCacheStatus);
    });

    expect(serviceWorkerManager.getCacheStatus).toHaveBeenCalled();
  });

  it('should handle cache status errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (serviceWorkerManager.getCacheStatus as jest.Mock).mockRejectedValue(new Error('Status failed'));
    
    renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get cache status:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should skip waiting and clear update available', async () => {
    (serviceWorkerManager.skipWaiting as jest.Mock).mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    // Set update available
    result.current.updateAvailable = true;
    
    await act(async () => {
      await result.current.skipWaiting();
    });

    expect(serviceWorkerManager.skipWaiting).toHaveBeenCalled();
    expect(result.current.updateAvailable).toBe(false);
  });

  it('should handle skip waiting errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (serviceWorkerManager.skipWaiting as jest.Mock).mockRejectedValue(new Error('Skip failed'));
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.skipWaiting();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to skip waiting:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should check for updates', async () => {
    (serviceWorkerManager.checkForUpdates as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    let hasUpdate: boolean = false;
    await act(async () => {
      hasUpdate = await result.current.checkForUpdates();
    });

    expect(hasUpdate).toBe(true);
    expect(serviceWorkerManager.checkForUpdates).toHaveBeenCalled();
  });

  it('should handle check for updates errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (serviceWorkerManager.checkForUpdates as jest.Mock).mockRejectedValue(new Error('Check failed'));
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    let hasUpdate: boolean = false;
    await act(async () => {
      hasUpdate = await result.current.checkForUpdates();
    });

    expect(hasUpdate).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to check for updates:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should clear cache and update status', async () => {
    (serviceWorkerManager.clearCache as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    let success: boolean = false;
    await act(async () => {
      success = await result.current.clearCache();
    });

    expect(success).toBe(true);
    expect(serviceWorkerManager.clearCache).toHaveBeenCalled();
    expect(serviceWorkerManager.getCacheStatus).toHaveBeenCalledTimes(2); // Initial + after clear
    expect(serviceWorkerManager.isOfflineReady).toHaveBeenCalledTimes(2); // Initial + after clear
  });

  it('should handle clear cache errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (serviceWorkerManager.clearCache as jest.Mock).mockRejectedValue(new Error('Clear failed'));
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    let success: boolean = false;
    await act(async () => {
      success = await result.current.clearCache();
    });

    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to clear cache:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should cache crisis resource', async () => {
    (serviceWorkerManager.cacheCrisisResource as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    let success: boolean = false;
    await act(async () => {
      success = await result.current.cacheCrisisResource('/crisis-resources.json');
    });

    expect(success).toBe(true);
    expect(serviceWorkerManager.cacheCrisisResource).toHaveBeenCalledWith('/crisis-resources.json');
  });

  it('should handle cache crisis resource errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (serviceWorkerManager.cacheCrisisResource as jest.Mock).mockRejectedValue(new Error('Cache failed'));
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    let success: boolean = false;
    await act(async () => {
      success = await result.current.cacheCrisisResource('/crisis-resources.json');
    });

    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to cache crisis resource:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should precache crisis resources', async () => {
    (serviceWorkerManager.precacheCrisisResources as jest.Mock).mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.precacheCrisisResources();
    });

    expect(serviceWorkerManager.precacheCrisisResources).toHaveBeenCalled();
  });

  it('should handle precache crisis resources errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (serviceWorkerManager.precacheCrisisResources as jest.Mock).mockRejectedValue(new Error('Precache failed'));
    
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.precacheCrisisResources();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to pre-cache crisis resources:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should force reload', () => {
    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    result.current.forceReload();

    expect(serviceWorkerManager.forceReload).toHaveBeenCalled();
  });

  it('should sync with service worker manager network status', () => {
    (serviceWorkerManager.getNetworkStatus as jest.Mock).mockReturnValue({
      isOnline: false
    });

    const { result } = renderHook(() => useServiceWorker(), { wrapper: Wrapper });
    
    // Should update to match service worker manager status
    expect(result.current.isOnline).toBe(false);
  });
});

describe('useOfflineStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (navigator as any).onLine = true;
  });

  it('should initialize with navigator online status', () => {
    const { result } = renderHook(() => useOfflineStatus(), { wrapper: Wrapper });
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should register event listeners', () => {
    renderHook(() => useOfflineStatus(), { wrapper: Wrapper });
    
    expect(serviceWorkerManager.onOnline).toHaveBeenCalled();
    expect(serviceWorkerManager.onOffline).toHaveBeenCalled();
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOfflineStatus(), { wrapper: Wrapper });
    
    unmount();
    
    expect(serviceWorkerManager.removeOnlineListener).toHaveBeenCalled();
    expect(serviceWorkerManager.removeOfflineListener).toHaveBeenCalled();
  });

  it('should update status when going online', () => {
    let onlineHandler: () => void;
    (serviceWorkerManager.onOnline as jest.Mock).mockImplementation((handler) => {
      onlineHandler = handler;
    });

    const { result } = renderHook(() => useOfflineStatus(), { wrapper: Wrapper });
    
    act(() => {
      onlineHandler();
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should update status when going offline', () => {
    let offlineHandler: () => void;
    (serviceWorkerManager.onOffline as jest.Mock).mockImplementation((handler) => {
      offlineHandler = handler;
    });

    const { result } = renderHook(() => useOfflineStatus(), { wrapper: Wrapper });
    
    act(() => {
      offlineHandler();
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });
});

describe('useCacheManager Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (serviceWorkerManager.getCacheStatus as jest.Mock).mockResolvedValue({
      totalSize: 1024,
      itemCount: 10,
      lastUpdated: Date.now()
    });
  });

  it('should initialize with null cache status', () => {
    const { result } = renderHook(() => useCacheManager(), { wrapper: Wrapper });
    
    expect(result.current.cacheStatus).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should get cache status on mount', async () => {
    const mockStatus = {
      totalSize: 2048,
      itemCount: 20,
      lastUpdated: Date.now()
    };
    
    (serviceWorkerManager.getCacheStatus as jest.Mock).mockResolvedValue(mockStatus);
    
    const { result } = renderHook(() => useCacheManager(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.cacheStatus).toEqual(mockStatus);
    });

    expect(serviceWorkerManager.getCacheStatus).toHaveBeenCalled();
  });

  it('should show loading state during cache operations', async () => {
    (serviceWorkerManager.clearCache as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(true), 100))
    );
    
    const { result } = renderHook(() => useCacheManager(), { wrapper: Wrapper });
    
    act(() => {
      result.current.clearCache();
    });

    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should clear cache and update status', async () => {
    (serviceWorkerManager.clearCache as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useCacheManager(), { wrapper: Wrapper });
    
    let success: boolean = false;
    await act(async () => {
      success = await result.current.clearCache();
    });

    expect(success).toBe(true);
    expect(serviceWorkerManager.clearCache).toHaveBeenCalled();
  });

  it('should handle clear cache errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (serviceWorkerManager.clearCache as jest.Mock).mockRejectedValue(new Error('Clear failed'));
    
    const { result } = renderHook(() => useCacheManager(), { wrapper: Wrapper });
    
    let success: boolean = false;
    await act(async () => {
      success = await result.current.clearCache();
    });

    expect(success).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to clear cache:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should cache crisis resource', async () => {
    (serviceWorkerManager.cacheCrisisResource as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useCacheManager(), { wrapper: Wrapper });
    
    let success: boolean = false;
    await act(async () => {
      success = await result.current.cacheCrisisResource('/test-resource.json');
    });

    expect(success).toBe(true);
    expect(serviceWorkerManager.cacheCrisisResource).toHaveBeenCalledWith('/test-resource.json');
  });

  it('should handle cache crisis resource errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (serviceWorkerManager.cacheCrisisResource as jest.Mock).mockRejectedValue(new Error('Cache failed'));
    
    const { result } = renderHook(() => useCacheManager(), { wrapper: Wrapper });
    
    let success: boolean = false;
    await act(async () => {
      success = await result.current.cacheCrisisResource('/test-resource.json');
    });

    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to cache crisis resource:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should update cache status manually', async () => {
    const { result } = renderHook(() => useCacheManager(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.updateCacheStatus();
    });

    expect(serviceWorkerManager.getCacheStatus).toHaveBeenCalledTimes(2); // Initial + manual
  });
});
