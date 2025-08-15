import React from 'react';
import { renderHook, act, waitFor } from '../test-utils';
import { useConnectionStatus } from './useConnectionStatus';

// Mock navigator
const mockNavigator = {
  onLine: true,
  serviceWorker: {
    getRegistration: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  connection: {
    effectiveType: '4g',
    downlink: 2,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

// Mock caches API
const mockCaches = {
  open: jest.fn(),
  keys: jest.fn()
};

Object.defineProperty(global, 'caches', {
  value: mockCaches,
  writable: true
});

// Mock window events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useConnectionStatus Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigator.onLine = true;
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue(null);
  });

  it('should initialize with default connection status', () => {
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    expect(result.current.connectionStatus.isOnline).toBe(true);
    expect(result.current.connectionStatus.isServiceWorkerSupported).toBe(true);
    expect(result.current.connectionStatus.isServiceWorkerRegistered).toBe(false);
    expect(result.current.connectionStatus.serviceWorkerStatus).toBe('not_registered');
    expect(result.current.connectionStatus.crisisResourcesAvailable).toBe(false);
    expect(result.current.connectionStatus.lastSync).toBeNull();
  });

  it('should detect offline status', () => {
    mockNavigator.onLine = false;
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    expect(result.current.connectionStatus.isOnline).toBe(false);
    expect(result.current.connectionStatus.connectionQuality).toBe('offline');
  });

  it('should determine connection quality from network information', () => {
    mockNavigator.connection.effectiveType = '4g';
    mockNavigator.connection.downlink = 2;
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    expect(result.current.connectionStatus.connectionQuality).toBe('excellent');
  });

  it('should handle poor connection quality', () => {
    mockNavigator.connection.effectiveType = '2g';
    mockNavigator.connection.downlink = 0.1;
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    expect(result.current.connectionStatus.connectionQuality).toBe('poor');
  });

  it('should handle good connection quality', () => {
    mockNavigator.connection.effectiveType = '3g';
    mockNavigator.connection.downlink = 0.8;
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    expect(result.current.connectionStatus.connectionQuality).toBe('good');
  });

  it('should handle missing network information gracefully', () => {
    const originalConnection = mockNavigator.connection;
    delete (mockNavigator as any).connection;
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    expect(result.current.connectionStatus.connectionQuality).toBe('good');
    
    // Restore connection
    mockNavigator.connection = originalConnection;
  });

  it('should register service worker when available', async () => {
    const mockRegistration = {
      installing: null,
      waiting: null,
      active: { state: 'active', addEventListener: jest.fn() }
    };
    
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue(mockRegistration);
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.connectionStatus.isServiceWorkerRegistered).toBe(true);
      expect(result.current.connectionStatus.serviceWorkerStatus).toBe('active');
    });
  });

  it('should handle service worker state changes', async () => {
    const mockStateChangeHandler = jest.fn();
    const mockServiceWorker = {
      state: 'installing',
      addEventListener: mockStateChangeHandler
    };
    
    const mockRegistration = {
      installing: mockServiceWorker,
      waiting: null,
      active: null
    };
    
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue(mockRegistration);
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.connectionStatus.serviceWorkerStatus).toBe('installing');
      expect(mockStateChangeHandler).toHaveBeenCalledWith('statechange', expect.any(Function));
    });
  });

  it('should check crisis resources availability', async () => {
    const mockCache = {
      keys: jest.fn().mockResolvedValue([
        { url: 'https://example.com/crisis-resources.json' },
        { url: 'https://example.com/emergency-contacts.json' },
        { url: 'https://example.com/offline-coping-strategies.json' }
      ])
    };
    
    mockCaches.open.mockResolvedValue(mockCache);
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.connectionStatus.crisisResourcesAvailable).toBe(true);
    });
  });

  it('should handle cache check errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockCaches.open.mockRejectedValue(new Error('Cache error'));
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.connectionStatus.crisisResourcesAvailable).toBe(false);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[useConnectionStatus] Failed to check crisis resources:',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('should update offline capabilities based on service worker status', async () => {
    const mockRegistration = {
      active: { state: 'active', addEventListener: jest.fn() }
    };
    
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue(mockRegistration);
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      const capabilities = result.current.connectionStatus.offlineCapabilities;
      const communityPosts = capabilities.find(c => c.feature === 'Community Posts');
      const helperChat = capabilities.find(c => c.feature === 'Helper Chat');
      
      expect(communityPosts?.available).toBe(true);
      expect(helperChat?.available).toBe(true);
    });
  });

  it('should handle online/offline events', () => {
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    
    // Simulate offline event
    const offlineHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'offline')?.[1];
    
    act(() => {
      offlineHandler();
    });
    
    expect(result.current.connectionStatus.isOnline).toBe(false);
    expect(result.current.connectionStatus.connectionQuality).toBe('offline');
    
    // Simulate online event
    const onlineHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'online')?.[1];
    
    act(() => {
      onlineHandler();
    });
    
    expect(result.current.connectionStatus.isOnline).toBe(true);
  });

  it('should handle connection quality changes', () => {
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    expect(mockNavigator.connection.addEventListener).toHaveBeenCalledWith(
      'change', 
      expect.any(Function)
    );
    
    // Simulate connection change
    const changeHandler = mockNavigator.connection.addEventListener.mock.calls[0][1];
    
    // Change connection to poor quality
    mockNavigator.connection.effectiveType = '2g';
    mockNavigator.connection.downlink = 0.1;
    
    act(() => {
      changeHandler();
    });
    
    expect(result.current.connectionStatus.connectionQuality).toBe('poor');
  });

  it('should send messages to service worker', async () => {
    const mockPostMessage = jest.fn();
    const mockRegistration = {
      active: { 
        state: 'active', 
        addEventListener: jest.fn(),
        postMessage: mockPostMessage
      }
    };
    
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue(mockRegistration);
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.connectionStatus.isServiceWorkerRegistered).toBe(true);
    });
    
    const message = { type: 'test', data: 'test data' };
    
    await act(async () => {
      const success = await result.current.sendMessageToServiceWorker(message);
      expect(success).toBe(true);
    });
    
    expect(mockPostMessage).toHaveBeenCalledWith(message);
  });

  it('should handle service worker message sending errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockPostMessage = jest.fn().mockImplementation(() => {
      throw new Error('Message failed');
    });
    
    const mockRegistration = {
      active: { 
        state: 'active', 
        addEventListener: jest.fn(),
        postMessage: mockPostMessage
      }
    };
    
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue(mockRegistration);
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.connectionStatus.isServiceWorkerRegistered).toBe(true);
    });
    
    await act(async () => {
      const success = await result.current.sendMessageToServiceWorker({ type: 'test' });
      expect(success).toBe(false);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[useConnectionStatus] Failed to send message to service worker:',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('should update crisis resources', async () => {
    const mockPostMessage = jest.fn();
    const mockRegistration = {
      active: { 
        state: 'active', 
        addEventListener: jest.fn(),
        postMessage: mockPostMessage
      }
    };
    
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue(mockRegistration);
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.connectionStatus.isServiceWorkerRegistered).toBe(true);
    });
    
    await act(async () => {
      const success = await result.current.updateCrisisResources();
      expect(success).toBe(true);
    });
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'update-crisis-resources',
      timestamp: expect.any(Number)
    });
  });

  it('should force cache update', async () => {
    const mockPostMessage = jest.fn();
    const mockRegistration = {
      active: { 
        state: 'active', 
        addEventListener: jest.fn(),
        postMessage: mockPostMessage
      }
    };
    
    mockNavigator.serviceWorker.getRegistration.mockResolvedValue(mockRegistration);
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.connectionStatus.isServiceWorkerRegistered).toBe(true);
    });
    
    await act(async () => {
      const success = await result.current.forceCacheUpdate();
      expect(success).toBe(true);
    });
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'force-cache-update',
      timestamp: expect.any(Number)
    });
  });

  it('should handle service worker messages', async () => {
    let messageHandler: (event: MessageEvent) => void;
    
    mockNavigator.serviceWorker.addEventListener.mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(mockNavigator.serviceWorker.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
    
    // Simulate crisis resources cached message
    act(() => {
      messageHandler({
        data: {
          type: 'crisis-resources-cached',
          timestamp: Date.now()
        }
      } as MessageEvent);
    });
    
    expect(result.current.connectionStatus.crisisResourcesAvailable).toBe(true);
    expect(result.current.connectionStatus.lastSync).toBeInstanceOf(Date);
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(mockNavigator.serviceWorker.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );
    
    if (mockNavigator.connection) {
      expect(mockNavigator.connection.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    }
  });

  it('should handle when service worker is not supported', () => {
    const originalServiceWorker = mockNavigator.serviceWorker;
    delete (mockNavigator as unknown).serviceWorker;
    
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    expect(result.current.connectionStatus.isServiceWorkerSupported).toBe(false);
    
    // Restore service worker
    mockNavigator.serviceWorker = originalServiceWorker;
  });

  it('should warn when trying to send message without active service worker', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const { result } = renderHook(() => useConnectionStatus(), { wrapper: Wrapper });
    
    await act(async () => {
      const success = await result.current.sendMessageToServiceWorker({ type: 'test' });
      expect(success).toBe(false);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[useConnectionStatus] No active service worker to send message to'
    );
    
    consoleSpy.mockRestore();
  });
});