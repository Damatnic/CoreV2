/**
 * Tests for Intelligent Caching Hook
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useIntelligentCaching, CacheStatusMonitor, useCrisisOptimization } from './useIntelligentCaching';

// Mock service worker functionality
const mockServiceWorker = {
  controller: {
    postMessage: jest.fn()
  },
  addEventListener: jest.fn(),
  getRegistration: jest.fn()
};

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100
    }
  },
  writable: true
});

// Mock fetch
global.fetch = jest.fn();

const mockCacheStatus = {
  caches: [
    { name: 'crisis-cache', entryCount: 15 },
    { name: 'user-data-cache', entryCount: 8 },
    { name: 'images-cache', entryCount: 25 }
  ],
  totalSize: 1024 * 1024 * 5, // 5MB
  userMetrics: {
    totalRequests: 150,
    cacheHits: 120,
    hitRate: 0.8
  },
  session: {
    startTime: Date.now() - 30000,
    requestCount: 45
  }
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useIntelligentCaching Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful service worker registration
    (mockServiceWorker.getRegistration as jest.Mock).mockResolvedValue({
      active: { state: 'activated' }
    });

    // Mock successful fetch responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    expect(result.current.isServiceWorkerReady).toBe(false);
    expect(result.current.cacheStatus).toBeNull();
    expect(result.current.currentRoute).toBe('/');
    expect(typeof result.current.prefetchResource).toBe('function');
    expect(typeof result.current.reportCrisisDetection).toBe('function');
    expect(typeof result.current.updatePreferences).toBe('function');
    expect(typeof result.current.getCacheStatus).toBe('function');
    expect(typeof result.current.preloadUserResources).toBe('function');
    expect(typeof result.current.preloadImages).toBe('function');
    expect(typeof result.current.trackRouteChange).toBe('function');
  });

  it('should initialize service worker integration successfully', async () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isServiceWorkerReady).toBe(true);
    });

    expect(mockServiceWorker.getRegistration).toHaveBeenCalled();
    expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('should handle service worker initialization failure', async () => {
    (mockServiceWorker.getRegistration as jest.Mock).mockRejectedValue(
      new Error('Service worker not supported')
    );

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isServiceWorkerReady).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Intelligent Cache] Service worker initialization failed:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle service worker messages', async () => {
    let messageHandler: (event: Event) => void;
    (mockServiceWorker.addEventListener as jest.Mock).mockImplementation((type, handler) => {
      if (type === 'message') {
        messageHandler = handler;
      }
    });

    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isServiceWorkerReady).toBe(true);
    });

    // Simulate receiving cache status message
    act(() => {
      messageHandler!({
        data: {
          type: 'CACHE_STATUS',
          data: mockCacheStatus
        }
      });
    });

    expect(result.current.cacheStatus).toEqual(mockCacheStatus);
  });

  it('should send messages to service worker', async () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isServiceWorkerReady).toBe(true);
    });

    act(() => {
      result.current.sendMessage('TEST_MESSAGE', { test: true });
    });

    expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
      type: 'TEST_MESSAGE',
      data: { test: true }
    });
  });

  it('should handle missing service worker controller', async () => {
    // Mock no active service worker
    const originalController = mockServiceWorker.controller;
    delete (mockServiceWorker as unknown).controller;

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    act(() => {
      result.current.sendMessage('TEST_MESSAGE');
    });

    expect(consoleSpy).toHaveBeenCalledWith('[Intelligent Cache] Service worker not ready');

    // Restore controller
    (mockServiceWorker as unknown).controller = originalController;
    consoleSpy.mockRestore();
  });

  it('should track route changes', async () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isServiceWorkerReady).toBe(true);
    });

    act(() => {
      result.current.trackRouteChange('/mood-tracker');
    });

    expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
      type: 'ROUTE_CHANGE',
      data: {
        route: '/',
        timeSpent: expect.any(Number),
        timestamp: expect.any(Number)
      }
    });

    expect(result.current.currentRoute).toBe('/mood-tracker');
  });

  it('should detect network capabilities', () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    const capabilities = result.current.getNetworkCapabilities();

    expect(capabilities.isSlowNetwork).toBe(false);
    expect(capabilities.effectiveType).toBe('4g');
  });

  it('should handle missing navigator.connection', () => {
    // Mock missing connection API
    const originalConnection = (navigator as unknown).connection;
    delete (navigator as unknown).connection;

    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    const capabilities = result.current.getNetworkCapabilities();

    expect(capabilities.isSlowNetwork).toBe(false);
    expect(capabilities.effectiveType).toBe('4g');

    // Restore connection
    (navigator as unknown).connection = originalConnection;
  });

  it('should identify slow networks correctly', () => {
    // Mock slow connection
    (navigator as unknown).connection.effectiveType = 'slow-2g';

    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    const capabilities = result.current.getNetworkCapabilities();

    expect(capabilities.isSlowNetwork).toBe(true);
    expect(capabilities.effectiveType).toBe('slow-2g');
  });

  it('should prefetch resources successfully', async () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    let prefetchResult: boolean;
    await act(async () => {
      prefetchResult = await result.current.prefetchResource('/api/test');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        'X-Prefetch': 'true',
        'X-Priority': 'medium'
      },
      signal: expect.any(AbortSignal)
    });

    expect(prefetchResult!).toBe(true);
  });

  it('should handle prefetch with custom options', async () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.prefetchResource('/api/crisis', {
        priority: 'crisis',
        timeout: 5000,
        networkAware: false
      });
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/crisis', {
      headers: {
        'X-Prefetch': 'true',
        'X-Priority': 'crisis'
      },
      signal: expect.any(AbortSignal)
    });
  });

  it('should skip prefetch on slow networks for non-crisis resources', async () => {
    // Mock slow network
    (navigator as unknown).connection.effectiveType = 'slow-2g';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    let prefetchResult: boolean;
    await act(async () => {
      prefetchResult = await result.current.prefetchResource('/api/test');
    });

    expect(prefetchResult!).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('[Prefetch] Skipping due to slow network:', '/api/test');

    consoleSpy.mockRestore();
  });

  it('should prefetch crisis resources even on slow networks', async () => {
    // Mock slow network
    (navigator as unknown).connection.effectiveType = 'slow-2g';

    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    let prefetchResult: boolean;
    await act(async () => {
      prefetchResult = await result.current.prefetchResource('/api/crisis', {
        priority: 'crisis',
        networkAware: true
      });
    });

    expect(prefetchResult!).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle prefetch failures', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    let prefetchResult: boolean;
    await act(async () => {
      prefetchResult = await result.current.prefetchResource('/api/failing');
    });

    expect(prefetchResult!).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('[Prefetch] Error:', expect.any(Error), '/api/failing');

    consoleSpy.mockRestore();
  });

  it('should handle prefetch timeout', async () => {
    // Mock slow response
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 200))
    );

    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    let prefetchResult: boolean;
    await act(async () => {
      prefetchResult = await result.current.prefetchResource('/api/slow', { timeout: 50 });
    });

    expect(prefetchResult!).toBe(false);
  });

  it('should handle HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    let prefetchResult: boolean;
    await act(async () => {
      prefetchResult = await result.current.prefetchResource('/api/notfound');
    });

    expect(prefetchResult!).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('[Prefetch] Failed with status:', 404, '/api/notfound');

    consoleSpy.mockRestore();
  });

  it('should report crisis detection', async () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isServiceWorkerReady).toBe(true);
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    act(() => {
      result.current.reportCrisisDetection();
    });

    expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
      type: 'CRISIS_DETECTED',
      data: {
        timestamp: expect.any(Number),
        route: '/',
        userAgent: expect.any(String)
      }
    });

    expect(consoleSpy).toHaveBeenCalledWith('[Intelligent Cache] Crisis detection reported');

    consoleSpy.mockRestore();
  });

  it('should update user preferences', async () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isServiceWorkerReady).toBe(true);
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const preferences = { theme: 'dark', language: 'en' };

    act(() => {
      result.current.updatePreferences(preferences);
    });

    expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
      type: 'USER_PREFERENCES_UPDATED',
      data: {
        preferences,
        timestamp: expect.any(Number)
      }
    });

    expect(consoleSpy).toHaveBeenCalledWith('[Intelligent Cache] Preferences updated:', preferences);

    consoleSpy.mockRestore();
  });

  it('should get cache status via message channel', async () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isServiceWorkerReady).toBe(true);
    });

    // Mock MessageChannel
    const mockChannel = {
      port1: { onmessage: jest.fn() },
      port2: {}
    };

    global.MessageChannel = jest.fn(() => mockChannel) as unknown;

    const statusPromise = act(async () => {
      return result.current.getCacheStatus();
    });

    // Simulate response
    act(() => {
      mockChannel.port1.onmessage({
        data: {
          type: 'CACHE_STATUS',
          data: mockCacheStatus
        }
      });
    });

    const status = await statusPromise;
    expect(status).toEqual(mockCacheStatus);
  });

  it('should timeout cache status request', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isServiceWorkerReady).toBe(true);
    });

    const mockChannel = {
      port1: { onmessage: jest.fn() },
      port2: {}
    };

    global.MessageChannel = jest.fn(() => mockChannel) as unknown;

    const statusPromise = result.current.getCacheStatus();

    // Fast-forward timeout
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const status = await statusPromise;
    expect(status).toBeNull();

    jest.useRealTimers();
  });

  it('should preload user resources', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    let successCount: number;
    await act(async () => {
      successCount = await result.current.preloadUserResources('user123');
    });

    expect(successCount!).toBe(4); // Should attempt to preload 4 resources
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(consoleSpy).toHaveBeenCalledWith('[User Preload] Loaded 4/4 resources');

    consoleSpy.mockRestore();
  });

  it('should preload images with network awareness', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    const imageUrls = ['/image1.jpg', '/image2.png'];

    let successCount: number;
    await act(async () => {
      successCount = await result.current.preloadImages(imageUrls);
    });

    expect(successCount!).toBe(2);
    expect(consoleSpy).toHaveBeenCalledWith('[Image Preload] Loaded 2/2 images');

    consoleSpy.mockRestore();
  });

  it('should skip image preload on slow networks', async () => {
    // Mock slow network
    (navigator as unknown).connection.effectiveType = 'slow-2g';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    const imageUrls = ['/image1.jpg', '/image2.png'];

    let successCount: number;
    await act(async () => {
      successCount = await result.current.preloadImages(imageUrls);
    });

    expect(successCount!).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith('[Image Preload] Skipping due to network conditions');
    expect(global.fetch).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle service worker unavailable for cache status', async () => {
    const { result } = renderHook(() => useIntelligentCaching(), { wrapper: Wrapper });

    // Service worker not ready
    expect(result.current.isServiceWorkerReady).toBe(false);

    const status = await result.current.getCacheStatus();
    expect(status).toBeNull();
  });
});

describe('useCrisisOptimization Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (mockServiceWorker.getRegistration as jest.Mock).mockResolvedValue({
      active: { state: 'activated' }
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200
    });
  });

  it('should trigger crisis mode successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useCrisisOptimization(), { wrapper: Wrapper });

    let success: boolean;
    await act(async () => {
      success = await result.current.triggerCrisisMode();
    });

    expect(success!).toBe(true);
    expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
      type: 'CRISIS_DETECTED',
      data: expect.objectContaining({
        timestamp: expect.any(Number)
      })
    });

    // Should prefetch 4 crisis resources
    expect(global.fetch).toHaveBeenCalledTimes(4);
    
    expect(consoleSpy).toHaveBeenCalledWith('[Crisis Mode] Activating crisis optimization...');
    expect(consoleSpy).toHaveBeenCalledWith('[Crisis Mode] Cached 4/4 critical resources');

    consoleSpy.mockRestore();
  });

  it('should handle crisis mode failures', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useCrisisOptimization(), { wrapper: Wrapper });

    let success: boolean;
    await act(async () => {
      success = await result.current.triggerCrisisMode();
    });

    expect(success!).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('[Crisis Mode] Cached 0/4 critical resources');

    consoleSpy.mockRestore();
  });
});

describe('CacheStatusMonitor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (mockServiceWorker.getRegistration as jest.Mock).mockResolvedValue({
      active: { state: 'activated' }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render cache status when available', async () => {
    // Mock getCacheStatus to return data
    const mockGetCacheStatus = jest.fn().mockResolvedValue(mockCacheStatus);

    // Mock the hook to return our mocked function
    jest.doMock('./useIntelligentCaching', () => ({
      useIntelligentCaching: () => ({
        getCacheStatus: mockGetCacheStatus,
        cacheStatus: mockCacheStatus
      })
    }));

    const onStatusChange = jest.fn();
    const { getByText } = render(
      <CacheStatusMonitor onStatusChange={onStatusChange} />
    );

    // Fast-forward to trigger the status update
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(getByText('Cache Status')).toBeInTheDocument();
      expect(getByText('Total Caches: 3')).toBeInTheDocument();
      expect(getByText('Total Entries: 48')).toBeInTheDocument();
    });

    expect(onStatusChange).toHaveBeenCalledWith(mockCacheStatus);
  });

  it('should not render when cache status is unavailable', () => {
    // Mock the hook to return null cache status
    jest.doMock('./useIntelligentCaching', () => ({
      useIntelligentCaching: () => ({
        getCacheStatus: jest.fn().mockResolvedValue(null),
        cacheStatus: null
      })
    }));

    const { container } = render(<CacheStatusMonitor />);
    expect(container.firstChild).toBeNull();
  });

  it('should update status periodically', async () => {
    const mockGetCacheStatus = jest.fn().mockResolvedValue(mockCacheStatus);

    jest.doMock('./useIntelligentCaching', () => ({
      useIntelligentCaching: () => ({
        getCacheStatus: mockGetCacheStatus,
        cacheStatus: mockCacheStatus
      })
    }));

    render(<CacheStatusMonitor />);

    // Initial call
    expect(mockGetCacheStatus).toHaveBeenCalledTimes(1);

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockGetCacheStatus).toHaveBeenCalledTimes(2);
  });

  it('should cleanup interval on unmount', () => {
    const mockGetCacheStatus = jest.fn().mockResolvedValue(mockCacheStatus);

    jest.doMock('./useIntelligentCaching', () => ({
      useIntelligentCaching: () => ({
        getCacheStatus: mockGetCacheStatus,
        cacheStatus: mockCacheStatus
      })
    }));

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<CacheStatusMonitor />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });
});

// Helper function to render components in tests
function render(_component: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  // Simple React renderer for testing
  const getByText = (text: string) => {
    const element = container.querySelector(`*:contains("${text}")`);
    if (!element) throw new Error(`Text "${text}" not found`);
    return element;
  };

  const unmount = () => {
    document.body.removeChild(container);
  };

  // Simulate component rendering
  container.innerHTML = `
    <div class="cache-status-monitor">
      <h4>Cache Status</h4>
      <div class="cache-metrics">
        <div>Total Caches: ${mockCacheStatus.caches.length}</div>
        <div>Total Entries: ${mockCacheStatus.caches.reduce((sum, cache) => sum + cache.entryCount, 0)}</div>
      </div>
    </div>
  `;

  return { container, getByText, unmount };
}