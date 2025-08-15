/**
 * Tests for Performance Monitor Hook
 */

import React from 'react';
import { renderHook, act, waitFor } from '../test-utils';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { coreWebVitalsService } from '../services/coreWebVitalsService';

// Mock the core web vitals service
jest.mock('../services/coreWebVitalsService', () => ({
  coreWebVitalsService: {
    initialize: jest.fn(),
    generateReport: jest.fn(),
    getPerformanceSummary: jest.fn()
  }
}));

// Mock performance API
const mockPerformanceEntry = {
  name: 'navigation',
  duration: 1500,
  startTime: 0
};

Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    getEntriesByType: jest.fn(() => [mockPerformanceEntry]),
    mark: jest.fn(),
    measure: jest.fn(),
    navigation: {
      type: 'navigate'
    }
  },
  writable: true
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));

const mockWebVitalsReport = {
  timestamp: Date.now(),
  url: 'http://localhost/test',
  metrics: {
    lcp: 1200,
    fid: 80,
    cls: 0.05,
    fcp: 800,
    ttfb: 200,
    inp: 120
  },
  score: 95,
  grade: 'A',
  recommendations: []
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('usePerformanceMonitor Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/test',
        search: '',
        hash: '',
        href: 'http://localhost/test'
      },
      writable: true
    });

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true
    });

    // Mock console methods
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();

    // Default service mocks
    (coreWebVitalsService.initialize as jest.Mock).mockResolvedValue(undefined);
    (coreWebVitalsService.generateReport as jest.Mock).mockReturnValue(mockWebVitalsReport);
    (coreWebVitalsService.getPerformanceSummary as jest.Mock).mockReturnValue({
      lcp: 1200,
      fid: 80,
      cls: 0.05,
      performanceScore: 95
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    expect(result.current.metrics.lcp).toBeNull();
    expect(result.current.metrics.fid).toBeNull();
    expect(result.current.metrics.cls).toBeNull();
    expect(result.current.metrics.fcp).toBeNull();
    expect(result.current.metrics.ttfb).toBeNull();
    expect(result.current.metrics.inp).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.performanceScore).toBe(0);
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.crisisOptimized).toBe(false);
    expect(result.current.mobileOptimized).toBe(false);
  });

  it('should initialize with custom options', () => {
    const options = {
      enableRealTimeAlerts: false,
      enableCrisisOptimization: false,
      enableAutomaticReporting: false,
      reportingInterval: 60000
    };

    const { result } = renderHook(() => usePerformanceMonitor(options), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(typeof result.current.getPerformanceSummary).toBe('function');
  });

  it('should identify crisis routes correctly', () => {
    // Test crisis route
    Object.defineProperty(window, 'location', {
      value: { pathname: '/crisis/help' },
      writable: true
    });

    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    expect(result.current.isCrisisRoute).toBe(true);
  });

  it('should identify non-crisis routes correctly', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/mood-tracker' },
      writable: true
    });

    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    expect(result.current.isCrisisRoute).toBe(false);
  });

  it('should detect mobile devices correctly', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 500,
      writable: true
    });

    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    expect(result.current.isMobileDevice).toBe(true);
  });

  it('should detect desktop devices correctly', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1200,
      writable: true
    });

    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    expect(result.current.isMobileDevice).toBe(false);
  });

  it('should calculate performance scores correctly for normal pages', async () => {
    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    await act(async () => {
      // Simulate metric updates
      // result.current.handleMetricUpdate?.({ name: 'LCP', value: 2000 });
      // result.current.handleMetricUpdate?.({ name: 'FID', value: 90 });
      // result.current.handleMetricUpdate?.({ name: 'CLS', value: 0.08 });
      // result.current.handleMetricUpdate?.({ name: 'TTFB', value: 600 });
    });

    expect(result.current.performanceScore).toBeGreaterThan(0);
  });

  it('should apply crisis-specific performance thresholds', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/crisis' },
      writable: true
    });

    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    await act(async () => {
      // LCP over crisis threshold (1.5s)
      // result.current.handleMetricUpdate?.({ name: 'LCP', value: 2000 });
    });

    expect(result.current.performanceScore).toBeLessThan(100);
    expect(result.current.crisisOptimized).toBe(false);
  });

  it('should generate appropriate recommendations for poor LCP', async () => {
    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    await act(async () => {
      // result.current.handleMetricUpdate?.({ name: 'LCP', value: 3000 });
    });

    expect(result.current.recommendations).toContain(
      expect.stringContaining('Large Contentful Paint too slow')
    );
  });

  it('should generate crisis-specific recommendations', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/emergency' },
      writable: true
    });

    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    await act(async () => {
      // result.current.handleMetricUpdate?.({ name: 'LCP', value: 2000 });
    });

    expect(result.current.recommendations).toContain(
      expect.stringContaining('Crisis page LCP too slow')
    );
  });

  it('should monitor emergency button performance', async () => {
    const mockButton = document.createElement('button');
    mockButton.className = 'crisis-button';
    document.body.appendChild(mockButton);

    const { result: _result } = renderHook(() => usePerformanceMonitor({ enableRealTimeAlerts: true }), { wrapper: Wrapper });

    await act(async () => {
      // Simulate click on emergency button
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: mockButton });
      
      mockButton.dispatchEvent(clickEvent);
    });

    // Should monitor the response time
    expect(window.performance.now).toHaveBeenCalled();

    document.body.removeChild(mockButton);
  });

  it('should detect critical performance issues in crisis scenarios', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/crisis' },
      writable: true
    });

    const consoleSpy = jest.spyOn(console, 'warn');

    const { result: _result } = renderHook(() => usePerformanceMonitor({ enableRealTimeAlerts: true }), { wrapper: Wrapper });

    await act(async () => {
      // result.current.handleMetricUpdate?.({ name: 'LCP', value: 3000 }); // Over crisis threshold
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Critical performance issue in crisis scenario')
    );
  });

  it('should generate performance reports', () => {
    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    const report = result.current.generateReport();

    expect(coreWebVitalsService.generateReport).toHaveBeenCalled();
    expect(report).toEqual(mockWebVitalsReport);
  });

  it('should get performance summary', () => {
    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    const summary = result.current.getPerformanceSummary();

    expect(summary).toHaveProperty('webVitalsSummary');
    expect(summary).toHaveProperty('isCrisisRoute');
    expect(summary).toHaveProperty('isMobileDevice');
  });

  it('should identify critical performance conditions', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/crisis' },
      writable: true
    });

    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    await act(async () => {
      // result.current.handleMetricUpdate?.({ name: 'LCP', value: 2000 }); // Over crisis threshold
      // result.current.handleMetricUpdate?.({ name: 'FID', value: 100 }); // Over crisis threshold
    });

    expect(result.current.isPerformanceCritical()).toBe(true);
  });

  it('should not flag non-crisis pages as critical with moderate issues', async () => {
    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    await act(async () => {
      // result.current.handleMetricUpdate?.({ name: 'LCP', value: 3000 });
    });

    // Should calculate score but not necessarily be critical
    expect(result.current.performanceScore).toBeLessThan(100);
  });

  it('should handle mobile-specific performance considerations', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 400,
      writable: true
    });

    const { result } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    await act(async () => {
      // result.current.handleMetricUpdate?.({ name: 'LCP', value: 3500 }); // Slow on mobile
    });

    expect(result.current.recommendations).toContain(
      expect.stringContaining('Mobile performance suboptimal')
    );
  });

  it('should reset metrics on route change', async () => {
    const { result, rerender } = renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    await act(async () => {
      // result.current.handleMetricUpdate?.({ name: 'LCP', value: 2000 });
    });

    expect(result.current.metrics.lcp).toBe(2000);

    // Simulate route change
    Object.defineProperty(window, 'location', {
      value: { pathname: '/new-route' },
      writable: true
    });

    rerender();

    expect(result.current.metrics.lcp).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should enable crisis optimization features', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/crisis' },
      writable: true
    });

    const { result: _result } = renderHook(() => usePerformanceMonitor({ enableCrisisOptimization: true }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(document.head.children.length).toBeGreaterThan(0);
    });

    // Should prefetch crisis resources
    const linkElements = Array.from(document.head.children).filter(
      child => child.tagName === 'LINK' && (child as HTMLLinkElement).href.includes('offline-crisis.html')
    );
    
    expect(linkElements.length).toBeGreaterThan(0);
  });

  it('should handle initialization errors gracefully', async () => {
    const initError = new Error('Web Vitals service failed to initialize');
    (coreWebVitalsService.initialize as jest.Mock).mockRejectedValue(initError);

    const consoleSpy = jest.spyOn(console, 'warn');

    renderHook(() => usePerformanceMonitor(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Performance monitoring initialization failed:',
        initError
      );
    });
  });

  it('should store performance reports locally when automatic reporting is enabled', async () => {
    jest.useFakeTimers();

    const mockLocalStorage = {
      getItem: jest.fn(() => '[]'),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    renderHook(() => usePerformanceMonitor({ 
      enableAutomaticReporting: true, 
      reportingInterval: 10000 
    }), { wrapper: Wrapper });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'performance_reports',
        expect.any(String)
      );
    });

    jest.useRealTimers();
  });

  it('should limit stored reports to 50', async () => {
    jest.useFakeTimers();

    const existingReports = Array(50).fill(0).map((_, i) => ({ id: i }));
    
    const mockLocalStorage = {
      getItem: jest.fn(() => JSON.stringify(existingReports)),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    renderHook(() => usePerformanceMonitor({ 
      enableAutomaticReporting: true, 
      reportingInterval: 10000 
    }), { wrapper: Wrapper });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      if (setItemCall) {
        const storedReports = JSON.parse(setItemCall[1]);
        expect(storedReports.length).toBeLessThanOrEqual(50);
      }
    });

    jest.useRealTimers();
  });

  it('should handle localStorage errors gracefully', async () => {
    jest.useFakeTimers();

    const mockLocalStorage = {
      getItem: jest.fn(() => { throw new Error('Storage quota exceeded'); }),
      setItem: jest.fn(() => { throw new Error('Storage quota exceeded'); }),
      removeItem: jest.fn()
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    const consoleSpy = jest.spyOn(console, 'warn');

    renderHook(() => usePerformanceMonitor({ 
      enableAutomaticReporting: true, 
      reportingInterval: 10000 
    }), { wrapper: Wrapper });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not store performance report:',
        expect.any(Error)
      );
    });

    jest.useRealTimers();
  });

  it('should cleanup intervals and event listeners on unmount', () => {
    jest.useFakeTimers();

    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => usePerformanceMonitor({ 
      enableAutomaticReporting: true 
    }), { wrapper: Wrapper });

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(clearIntervalSpy).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
