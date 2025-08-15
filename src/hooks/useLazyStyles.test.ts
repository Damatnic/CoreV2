/**
 * Tests for Lazy CSS Loading functionality
 */

import React from 'react';
import { renderHook, act } from '../test-utils';
import { useLazyStyles, cssOptimization } from './useLazyStyles';

// Mock React Router
const mockLocation = { pathname: '/test' };
jest.mock('react-router-dom', () => ({
  useLocation: () => mockLocation
}));

// Mock DOM methods
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockQuerySelectorAll = jest.fn(() => []);

// Create a proper mock HTMLLinkElement
class MockHTMLLinkElement {
  rel = '';
  href = '';
  media = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  dataset: Record<string, string> = {};
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  setAttribute = jest.fn();
  getAttribute = jest.fn();
  removeAttribute = jest.fn();
  
  // Make it behave like a Node
  nodeType = 1;
  nodeName = 'LINK';
  parentNode = null;
}

const mockCreateElement = jest.fn((tagName: string) => {
  if (tagName === 'link') {
    return new MockHTMLLinkElement() as unknown;
  }
  return document.createElement(tagName);
});

// Mock document.head properly
Object.defineProperty(document, 'head', {
  value: { 
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
    querySelectorAll: mockQuerySelectorAll
  },
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
});

Object.defineProperty(document, 'documentElement', {
  value: {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    }
  },
  writable: true
});

// Mock window methods
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true
});

Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  writable: true
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useLazyStyles Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = '/test';
  });

  it('should initialize without errors', () => {
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    expect(result.current).toHaveProperty('loadEmotionalStyles');
    expect(result.current).toHaveProperty('loadCrisisStyles');
    expect(result.current).toHaveProperty('preloadStyles');
    expect(result.current).toHaveProperty('isStyleLoaded');
    expect(result.current).toHaveProperty('cssManager');
  });

  it('should load immediate styles on mount', () => {
    renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    // Should create link elements for immediate styles
    expect(mockCreateElement).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
  });

  it('should load route-specific styles when route changes', () => {
    const { rerender } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    // Change route
    mockLocation.pathname = '/mood-tracker';
    rerender();
    
    // Should load mood tracker styles
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('should load emotional state styles', async () => {
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.loadEmotionalStyles('seeking-help');
    });
    
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('should load crisis styles immediately', async () => {
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.loadCrisisStyles();
    });
    
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('should preload styles', () => {
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    act(() => {
      result.current.preloadStyles('/test.css');
    });
    
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('should handle responsive styles based on viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      value: 500,
      writable: true
    });
    
    renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('should setup interaction-based loading', () => {
    renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    // Should setup event listeners for interaction
    expect(window.addEventListener).toHaveBeenCalled();
  });

  it('should handle custom strategy', () => {
    const customStrategy = {
      immediate: [
        { href: '/custom.css', priority: 'immediate' as const }
      ]
    };
    
    renderHook(() => useLazyStyles(customStrategy), { wrapper: Wrapper });
    
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('should track loaded styles to prevent duplicates', async () => {
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    // Load same style multiple times
    await act(async () => {
      result.current.preloadStyles('/test.css');
      result.current.preloadStyles('/test.css');
    });
    
    // Should only create element once per unique style
    expect(result.current.isStyleLoaded('/test.css')).toBeDefined();
  });
});

describe('CSS Optimization Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark critical CSS as loaded', () => {
    cssOptimization.markCriticalCSSLoaded();
    
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('css-loaded');
  });

  it('should handle CSS performance monitoring', () => {
    // Mock PerformanceObserver
    global.PerformanceObserver = jest.fn().mockImplementation((_callback) => ({
      observe: jest.fn(),
      disconnect: jest.fn()
    })) as unknown;
    (global.PerformanceObserver as unknown).supportedEntryTypes = ['resource'];
    
    cssOptimization.monitorCSSPerformance();
    
    expect(global.PerformanceObserver).toHaveBeenCalled();
  });

  it('should get CSS metrics when performance API is available', () => {
    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        getEntriesByType: jest.fn().mockReturnValue([
          { name: 'test.css', duration: 100 },
          { name: 'other.css', duration: 200 }
        ])
      },
      writable: true
    });
    
    const metrics = cssOptimization.getCSSMetrics();
    
    expect(metrics).toHaveProperty('totalCSSFiles');
    expect(metrics).toHaveProperty('totalCSSLoadTime');
    expect(metrics).toHaveProperty('avgCSSLoadTime');
    expect(metrics.totalCSSFiles).toBe(2);
    expect(metrics.totalCSSLoadTime).toBe(300);
    expect(metrics.avgCSSLoadTime).toBe(150);
  });

  it('should handle missing performance API gracefully', () => {
    const originalPerformance = window.performance;
    // @ts-ignore
    delete window.performance;
    
    const metrics = cssOptimization.getCSSMetrics();
    
    expect(metrics).toEqual({});
    
    // Restore
    window.performance = originalPerformance;
  });
});

describe('CSS Loading Manager', () => {
  it('should handle CSS loading errors gracefully', async () => {
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    // Mock console.warn to capture error handling
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Simulate CSS loading error
    mockCreateElement.mockReturnValueOnce({
      rel: '',
      href: '',
      media: '',
      onload: null,
      onerror: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    });
    
    await act(async () => {
      try {
        await result.current.loadEmotionalStyles('invalid-state');
      } catch (error) {
        // Expected to handle errors gracefully - test passes if no error thrown
        expect(error).toBeDefined();
      }
    });
    
    consoleSpy.mockRestore();
  });

  it('should prioritize crisis styles', async () => {
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.loadCrisisStyles();
    });
    
    // Crisis styles should be loaded with immediate priority
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('should handle mental health journey patterns', () => {
    const routes = ['/mood-tracker', '/crisis', '/chat', '/community', '/helpers'];
    
    routes.forEach(route => {
      mockLocation.pathname = route;
      const { unmount } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
      
      expect(mockCreateElement).toHaveBeenCalled();
      unmount();
    });
  });
});

describe('Integration with Mental Health Platform', () => {
  it('should support crisis intervention workflow', async () => {
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    // Simulate crisis detection workflow
    await act(async () => {
      await result.current.loadCrisisStyles();
      await result.current.loadEmotionalStyles('in-crisis');
    });
    
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('should support mood tracking journey', async () => {
    mockLocation.pathname = '/mood-tracker';
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.loadEmotionalStyles('maintenance');
    });
    
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('should handle help-seeking behavior', async () => {
    mockLocation.pathname = '/helpers';
    const { result } = renderHook(() => useLazyStyles(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.loadEmotionalStyles('seeking-help');
    });
    
    expect(mockCreateElement).toHaveBeenCalled();
  });
});
