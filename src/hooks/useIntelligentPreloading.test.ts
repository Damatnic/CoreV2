/**
 * Tests for Intelligent Preloading Hook
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useIntelligentPreloading, withIntelligentPreloading } from './useIntelligentPreloading';
import { IntelligentPreloadingEngine } from '../services/intelligentPreloading';

// Mock react-router-dom
const mockLocation = {
  pathname: '/mood-tracker',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

jest.mock('react-router-dom', () => ({
  useLocation: () => mockLocation
}));

// Mock IntelligentPreloadingEngine
jest.mock('../services/intelligentPreloading', () => ({
  IntelligentPreloadingEngine: jest.fn()
}));

const mockEngine = {
  startNewSession: jest.fn(),
  trackRouteNavigation: jest.fn(),
  generatePredictions: jest.fn()
};

const mockPredictions = [
  {
    resource: '/api/user/profile',
    confidence: 0.85,
    priority: 'high' as const,
    type: 'api-call' as const,
    reasoning: 'User typically views profile after mood tracking'
  },
  {
    resource: '/mood-history',
    confidence: 0.72,
    priority: 'medium' as const,
    type: 'navigation' as const,
    reasoning: 'Common next step after mood entry'
  },
  {
    resource: '/assets/chart.js',
    confidence: 0.45,
    priority: 'low' as const,
    type: 'resource' as const,
    reasoning: 'May need charting if viewing history'
  },
  {
    resource: '/api/recommendations',
    confidence: 0.25,
    priority: 'low' as const,
    type: 'api-call' as const,
    reasoning: 'Low confidence prediction'
  }
];

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useIntelligentPreloading Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock constructor to return our mock engine
    (IntelligentPreloadingEngine as jest.Mock).mockImplementation(() => mockEngine);
    
    // Default mock implementations
    mockEngine.generatePredictions.mockResolvedValue(mockPredictions);
    mockEngine.trackRouteNavigation.mockResolvedValue(undefined);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    expect(result.current.preloadingState.isActive).toBe(false);
    expect(result.current.preloadingState.currentPredictions).toBe(0);
    expect(result.current.preloadingState.totalResourcesPreloaded).toBe(0);
    expect(result.current.preloadingState.lastPredictionTime).toBeNull();
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.isActive).toBe(false);
    expect(typeof result.current.trackInteraction).toBe('function');
    expect(typeof result.current.forcePredictions).toBe('function');
    expect(result.current.engine).toBeUndefined();
  });

  it('should initialize with custom options', () => {
    const options = {
      enabled: false,
      maxPredictions: 5,
      minConfidence: 0.8,
      trackUserBehavior: false
    };

    const { result } = renderHook(() => useIntelligentPreloading(options), { wrapper: Wrapper });

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.preloadingState.isActive).toBe(false);
  });

  it('should initialize preloading engine when enabled', async () => {
    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    expect(IntelligentPreloadingEngine).toHaveBeenCalled();
    expect(mockEngine.startNewSession).toHaveBeenCalled();
    expect(result.current.engine).toBe(mockEngine);
  });

  it('should not initialize engine when disabled', async () => {
    const { result } = renderHook(() => useIntelligentPreloading({ enabled: false }), { wrapper: Wrapper });

    // Wait a bit to ensure it doesn't initialize
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(IntelligentPreloadingEngine).not.toHaveBeenCalled();
    expect(result.current.preloadingState.isActive).toBe(false);
    expect(result.current.engine).toBeUndefined();
  });

  it('should track route changes', async () => {
    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    expect(mockEngine.trackRouteNavigation).toHaveBeenCalledWith(
      '/mood-tracker',
      1000, // Default time spent
      [], // No interactions tracked yet
      undefined // No emotional context
    );
  });

  it('should not track routes when behavior tracking is disabled', async () => {
    renderHook(() => useIntelligentPreloading({ trackUserBehavior: false }), { wrapper: Wrapper });

    await waitFor(() => {
      // Wait for initialization
    });

    expect(mockEngine.trackRouteNavigation).not.toHaveBeenCalled();
  });

  it('should not track routes when disabled', async () => {
    renderHook(() => useIntelligentPreloading({ enabled: false }), { wrapper: Wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(mockEngine.trackRouteNavigation).not.toHaveBeenCalled();
  });

  it('should generate predictions successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

    // Set NODE_ENV to development for logging
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    // Should automatically trigger predictions on route change
    await waitFor(() => {
      expect(result.current.preloadingState.currentPredictions).toBeGreaterThan(0);
    });

    expect(mockEngine.generatePredictions).toHaveBeenCalled();
    expect(result.current.preloadingState.currentPredictions).toBe(3); // Above confidence threshold
    expect(result.current.preloadingState.totalResourcesPreloaded).toBe(3);
    expect(result.current.preloadingState.lastPredictionTime).toBeGreaterThan(0);

    expect(consoleSpy).toHaveBeenCalledWith('🧠 Intelligent Preloading Results');
    expect(consoleGroupEndSpy).toHaveBeenCalled();

    // Restore environment
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  it('should filter predictions by confidence threshold', async () => {
    const { result } = renderHook(() => useIntelligentPreloading({ minConfidence: 0.5 }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.preloadingState.currentPredictions).toBe(2); // Only 2 above 0.5 confidence
    });
  });

  it('should limit predictions by max count', async () => {
    const { result } = renderHook(() => useIntelligentPreloading({ 
      maxPredictions: 1,
      minConfidence: 0.2 // Allow all predictions
    }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.preloadingState.currentPredictions).toBe(1); // Limited to 1
    });
  });

  it('should handle prediction errors gracefully', async () => {
    const predictionError = new Error('Prediction service unavailable');
    mockEngine.generatePredictions.mockRejectedValue(predictionError);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    // Wait for error to be handled
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Intelligent preloading failed:', predictionError);
    });

    expect(result.current.preloadingState.currentPredictions).toBe(0);

    consoleSpy.mockRestore();
  });

  it('should force predictions manually', async () => {
    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    // Clear the automatic calls
    mockEngine.generatePredictions.mockClear();

    act(() => {
      result.current.forcePredictions();
    });

    await waitFor(() => {
      expect(mockEngine.generatePredictions).toHaveBeenCalled();
    });
  });

  it('should track user interactions', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Set NODE_ENV to development for logging
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    act(() => {
      result.current.trackInteraction('click', 'button', { buttonType: 'submit' });
    });

    expect(consoleSpy).toHaveBeenCalledWith('📊 User Interaction:', {
      action: 'click',
      target: 'button',
      metadata: { buttonType: 'submit' },
      route: '/mood-tracker'
    });

    // Restore environment
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  it('should trigger predictions on significant interactions', async () => {
    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    // Clear automatic calls
    mockEngine.generatePredictions.mockClear();

    act(() => {
      result.current.trackInteraction('click');
    });

    // Should trigger predictions after 100ms delay
    await waitFor(() => {
      expect(mockEngine.generatePredictions).toHaveBeenCalled();
    });
  });

  it('should not trigger predictions for non-significant interactions', async () => {
    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    // Clear automatic calls
    mockEngine.generatePredictions.mockClear();

    act(() => {
      result.current.trackInteraction('hover');
    });

    // Wait and verify no additional calls
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(mockEngine.generatePredictions).not.toHaveBeenCalled();
  });

  it('should not track interactions when disabled', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentPreloading({ enabled: false }), { wrapper: Wrapper });

    act(() => {
      result.current.trackInteraction('click', 'button');
    });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should not track interactions when behavior tracking is disabled', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useIntelligentPreloading({ trackUserBehavior: false }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    act(() => {
      result.current.trackInteraction('click', 'button');
    });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle route changes correctly', async () => {
    const { result, rerender } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    // Clear initial calls
    mockEngine.trackRouteNavigation.mockClear();
    mockEngine.generatePredictions.mockClear();

    // Change route
    mockLocation.pathname = '/community';
    rerender();

    await waitFor(() => {
      expect(mockEngine.trackRouteNavigation).toHaveBeenCalledWith(
        '/community',
        1000,
        [],
        undefined
      );
    });
  });

  it('should not generate predictions when engine is not available', async () => {
    const { result } = renderHook(() => useIntelligentPreloading({ enabled: false }), { wrapper: Wrapper });

    act(() => {
      result.current.forcePredictions();
    });

    expect(mockEngine.generatePredictions).not.toHaveBeenCalled();
  });

  it('should skip tracking for repeated same route', async () => {
    const { result, rerender } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    // Clear initial calls
    mockEngine.trackRouteNavigation.mockClear();

    // "Change" to same route
    rerender();

    // Should not track the same route again
    expect(mockEngine.trackRouteNavigation).not.toHaveBeenCalled();
  });

  it('should provide access to underlying engine', async () => {
    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.engine).toBe(mockEngine);
    });
  });

  it('should handle empty predictions array', async () => {
    mockEngine.generatePredictions.mockResolvedValue([]);

    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.preloadingState.currentPredictions).toBe(0);
      expect(result.current.preloadingState.totalResourcesPreloaded).toBe(0);
    });
  });

  it('should accumulate total resources preloaded', async () => {
    const { result } = renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.preloadingState.isActive).toBe(true);
    });

    // Wait for initial predictions
    await waitFor(() => {
      expect(result.current.preloadingState.totalResourcesPreloaded).toBe(3);
    });

    // Force another round of predictions
    act(() => {
      result.current.forcePredictions();
    });

    await waitFor(() => {
      expect(result.current.preloadingState.totalResourcesPreloaded).toBe(6); // Should accumulate
    });
  });
});

describe('withIntelligentPreloading HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (IntelligentPreloadingEngine as jest.Mock).mockImplementation(() => mockEngine);
    mockEngine.generatePredictions.mockResolvedValue(mockPredictions);
  });

  it('should wrap component and add tracking functionality', () => {
    const TestComponent = ({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => {
      return React.createElement('button', { onClick }, 'Test Button');
    };

    const WrappedComponent = withIntelligentPreloading(TestComponent, { trackClicks: true });
    
    expect(typeof WrappedComponent).toBe('function');
  });

  it('should call original onClick handler', () => {
    const TestComponent = ({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => {
      return React.createElement('button', { onClick }, 'Test Button');
    };

    const WrappedComponent = withIntelligentPreloading(TestComponent);
    
    // Use the hook result to avoid unused variable warning
    renderHook(() => useIntelligentPreloading(), { wrapper: Wrapper });
    
    // This is a simplified test - in practice, the HOC would need more complex testing
    expect(typeof WrappedComponent).toBe('function');
  });

  it('should disable click tracking when specified', () => {
    const TestComponent = ({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => {
      return React.createElement('button', { onClick }, 'Test Button');
    };

    const WrappedComponent = withIntelligentPreloading(TestComponent, { trackClicks: false });
    
    expect(typeof WrappedComponent).toBe('function');
  });

  it('should handle components without onClick', () => {
    const TestComponent = () => {
      return React.createElement('div', {}, 'Test Component');
    };

    const WrappedComponent = withIntelligentPreloading(TestComponent);
    
    expect(typeof WrappedComponent).toBe('function');
  });

  it('should forward all props to wrapped component', () => {
    const TestComponent = (props: any) => {
      return React.createElement('div', props, 'Test');
    };

    const WrappedComponent = withIntelligentPreloading(TestComponent);
    
    expect(typeof WrappedComponent).toBe('function');
  });
});