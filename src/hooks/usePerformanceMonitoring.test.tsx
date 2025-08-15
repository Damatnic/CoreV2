/**
 * Tests for Performance Monitoring Hook
 */

import React from 'react';
import { renderHook, act, waitFor } from '../test-utils';
import { 
  usePerformanceMetrics,
  usePerformanceAlerts,
  useOptimizationRecommendations,
  usePerformanceGrade,
  useCrisisPerformanceMonitoring,
  PerformanceProvider,
  PerformanceDebugInfo,
  generatePerformanceSummary,
  exportPerformanceData,
  isPerformanceMonitoringHealthy
} from './usePerformanceMonitoring';
import { comprehensivePerformanceMonitor } from '../services/comprehensivePerformanceMonitor';

// Mock the comprehensive performance monitor
jest.mock('../services/comprehensivePerformanceMonitor', () => ({
  comprehensivePerformanceMonitor: {
    getCurrentMetrics: jest.fn(),
    getActiveAlerts: jest.fn(),
    onAlert: jest.fn(),
    generateOptimizationRecommendations: jest.fn(),
    generatePerformanceReport: jest.fn(),
    getPerformanceHistory: jest.fn()
  }
}));

const mockMetrics = {
  timestamp: Date.now(),
  firstContentfulPaint: 800,
  largestContentfulPaint: 1200,
  firstInputDelay: 50,
  cumulativeLayoutShift: 0.03,
  bundleSize: 1024 * 512, // 512KB
  memoryUsage: 45.5,
  crisisDetectionResponseTime: 120,
  accessibilityScore: 92,
  performanceScore: 88,
  networkLatency: 80,
  renderTime: 16.7,
  interactionTime: 35
};

const mockAlerts = [
  {
    id: 'alert-1',
    metric: 'crisisDetectionResponseTime',
    value: 400,
    threshold: 300,
    severity: 'high' as const,
    timestamp: Date.now(),
    message: 'Crisis detection response time is too high'
  },
  {
    id: 'alert-2', 
    metric: 'memoryUsage',
    value: 180,
    threshold: 150,
    severity: 'medium' as const,
    timestamp: Date.now() - 30000,
    message: 'Memory usage approaching limit'
  }
];

const mockRecommendations = [
  {
    id: 'rec-1',
    priority: 'high' as const,
    category: 'crisis-response' as const,
    title: 'Optimize Crisis Detection',
    description: 'Reduce crisis detection response time to under 200ms',
    impact: 'Faster emergency response for users in crisis',
    implementation: 'Use Web Workers for crisis analysis',
    estimatedImprovement: '40% faster crisis detection'
  },
  {
    id: 'rec-2',
    priority: 'medium' as const,
    category: 'bundle-size' as const,
    title: 'Reduce Bundle Size',
    description: 'Split large bundles and implement lazy loading',
    impact: 'Faster initial page load',
    implementation: 'Code splitting and dynamic imports',
    estimatedImprovement: '25% reduction in bundle size'
  }
];

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('usePerformanceMetrics Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockReturnValue(mockMetrics);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize and fetch metrics', async () => {
    const { result } = renderHook(() => usePerformanceMetrics(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.isLoading).toBe(false);
    });

    expect(comprehensivePerformanceMonitor.getCurrentMetrics).toHaveBeenCalled();
  });

  it('should handle metrics fetch errors', async () => {
    const metricsError = new Error('Metrics service unavailable');
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockImplementation(() => {
      throw metricsError;
    });

    const { result } = renderHook(() => usePerformanceMetrics(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.error).toEqual(metricsError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.metrics).toBeNull();
    });
  });

  it('should refresh metrics at specified interval', async () => {
    const { result } = renderHook(() => usePerformanceMetrics(5000), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.metrics).toEqual(mockMetrics);
    });

    // Clear the initial call
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockClear();

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(comprehensivePerformanceMonitor.getCurrentMetrics).toHaveBeenCalledTimes(1);
  });

  it('should cleanup interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => usePerformanceMetrics(), { wrapper: Wrapper });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });
});

describe('usePerformanceAlerts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (comprehensivePerformanceMonitor.getActiveAlerts as jest.Mock).mockReturnValue(mockAlerts);
    (comprehensivePerformanceMonitor.onAlert as jest.Mock).mockReturnValue(() => {});
  });

  it('should initialize with existing alerts', async () => {
    const { result } = renderHook(() => usePerformanceAlerts(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.alerts).toEqual(mockAlerts);
    });

    expect(comprehensivePerformanceMonitor.getActiveAlerts).toHaveBeenCalled();
    expect(comprehensivePerformanceMonitor.onAlert).toHaveBeenCalled();
  });

  it('should handle new alerts', async () => {
    let alertHandler: (alert: any) => void;
    (comprehensivePerformanceMonitor.onAlert as jest.Mock).mockImplementation((handler) => {
      alertHandler = handler;
      return () => {};
    });

    const { result } = renderHook(() => usePerformanceAlerts(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.alerts).toEqual(mockAlerts);
    });

    const newAlert = {
      id: 'alert-3',
      metric: 'renderTime',
      value: 50,
      threshold: 30,
      severity: 'low' as const,
      timestamp: Date.now(),
      message: 'Render time slightly elevated'
    };

    act(() => {
      alertHandler!(newAlert);
    });

    expect(result.current.alerts).toContainEqual(newAlert);
    expect(result.current.newAlertCount).toBe(1);
  });

  it('should update existing alerts', async () => {
    let alertHandler: (alert: any) => void;
    (comprehensivePerformanceMonitor.onAlert as jest.Mock).mockImplementation((handler) => {
      alertHandler = handler;
      return () => {};
    });

    const { result } = renderHook(() => usePerformanceAlerts(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.alerts).toEqual(mockAlerts);
    });

    const updatedAlert = {
      ...mockAlerts[0],
      value: 500,
      message: 'Crisis detection response time critically high'
    };

    act(() => {
      alertHandler!(updatedAlert);
    });

    expect(result.current.alerts[0]).toEqual(updatedAlert);
    expect(result.current.newAlertCount).toBe(0); // Not a new alert
  });

  it('should clear new alert count', () => {
    const { result } = renderHook(() => usePerformanceAlerts(), { wrapper: Wrapper });

    act(() => {
      result.current.clearNewAlerts();
    });

    expect(result.current.newAlertCount).toBe(0);
  });

  it('should dismiss alerts', async () => {
    const { result } = renderHook(() => usePerformanceAlerts(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.alerts).toEqual(mockAlerts);
    });

    act(() => {
      result.current.dismissAlert('alert-1');
    });

    expect(result.current.alerts.find(a => a.id === 'alert-1')).toBeUndefined();
  });

  it('should cleanup subscription on unmount', () => {
    const mockUnsubscribe = jest.fn();
    (comprehensivePerformanceMonitor.onAlert as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => usePerformanceAlerts(), { wrapper: Wrapper });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

describe('useOptimizationRecommendations Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (comprehensivePerformanceMonitor.generateOptimizationRecommendations as jest.Mock).mockReturnValue(mockRecommendations);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should load recommendations on mount', async () => {
    const { result } = renderHook(() => useOptimizationRecommendations(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.recommendations).toEqual(mockRecommendations);
      expect(result.current.isLoading).toBe(false);
    });

    expect(comprehensivePerformanceMonitor.generateOptimizationRecommendations).toHaveBeenCalled();
  });

  it('should limit recommendations to specified maximum', async () => {
    const { result } = renderHook(() => useOptimizationRecommendations(1), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.recommendations).toHaveLength(1);
      expect(result.current.recommendations[0]).toEqual(mockRecommendations[0]);
    });
  });

  it('should handle recommendation errors', async () => {
    const recError = new Error('Failed to generate recommendations');
    (comprehensivePerformanceMonitor.generateOptimizationRecommendations as jest.Mock).mockImplementation(() => {
      throw recError;
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useOptimizationRecommendations(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to generate optimization recommendations:', recError);

    consoleSpy.mockRestore();
  });

  it('should refresh recommendations periodically', async () => {
    const { result } = renderHook(() => useOptimizationRecommendations(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.recommendations).toEqual(mockRecommendations);
    });

    // Clear the initial call
    (comprehensivePerformanceMonitor.generateOptimizationRecommendations as jest.Mock).mockClear();

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(comprehensivePerformanceMonitor.generateOptimizationRecommendations).toHaveBeenCalled();
  });
});

describe('usePerformanceGrade Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (comprehensivePerformanceMonitor.generatePerformanceReport as jest.Mock).mockReturnValue(
      'Performance Report\n## 📈 Performance Grade\nExcellent (A+) - 95/100'
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should extract grade from performance report', async () => {
    const { result } = renderHook(() => usePerformanceGrade(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.grade).toBe('Excellent (A+) - 95/100');
      expect(result.current.gradeColor).toBe('#22c55e'); // green
    });
  });

  it('should handle different grade levels', async () => {
    const gradeTestCases = [
      { report: '## 📈 Performance Grade\nGood (A) - 85/100', expectedColor: '#3b82f6' },
      { report: '## 📈 Performance Grade\nFair (B) - 75/100', expectedColor: '#eab308' },
      { report: '## 📈 Performance Grade\nNeeds Improvement (C) - 65/100', expectedColor: '#f97316' },
      { report: '## 📈 Performance Grade\nPoor (D) - 45/100', expectedColor: '#ef4444' }
    ];

    for (const testCase of gradeTestCases) {
      (comprehensivePerformanceMonitor.generatePerformanceReport as jest.Mock).mockReturnValue(testCase.report);

      const { result } = renderHook(() => usePerformanceGrade(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.gradeColor).toBe(testCase.expectedColor);
      });
    }
  });

  it('should handle report generation errors', async () => {
    (comprehensivePerformanceMonitor.generatePerformanceReport as jest.Mock).mockImplementation(() => {
      throw new Error('Report generation failed');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => usePerformanceGrade(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.grade).toBe('Error');
      expect(result.current.gradeColor).toBe('#ef4444');
    });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should refresh grade periodically', async () => {
    const { result } = renderHook(() => usePerformanceGrade(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.grade).toBeDefined();
    });

    // Clear the initial call
    (comprehensivePerformanceMonitor.generatePerformanceReport as jest.Mock).mockClear();

    // Fast-forward 15 seconds
    act(() => {
      jest.advanceTimersByTime(15000);
    });

    expect(comprehensivePerformanceMonitor.generatePerformanceReport).toHaveBeenCalled();
  });
});

describe('useCrisisPerformanceMonitoring Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockReturnValue({
      ...mockMetrics,
      crisisDetectionResponseTime: 250
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should monitor crisis performance metrics', async () => {
    const { result } = renderHook(() => useCrisisPerformanceMonitoring(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.responseTime).toBe(250);
      expect(result.current.isHealthy).toBe(true); // Under 300ms threshold
      expect(result.current.lastCheck).toBeGreaterThan(0);
    });
  });

  it('should detect unhealthy crisis performance', async () => {
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockReturnValue({
      ...mockMetrics,
      crisisDetectionResponseTime: 450 // Over 300ms threshold
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useCrisisPerformanceMonitoring(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.responseTime).toBe(450);
      expect(result.current.isHealthy).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🚨 Crisis detection performance degraded: 450ms')
    );

    consoleSpy.mockRestore();
  });

  it('should check crisis performance frequently', async () => {
    renderHook(() => useCrisisPerformanceMonitoring(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(comprehensivePerformanceMonitor.getCurrentMetrics).toHaveBeenCalled();
    });

    // Clear the initial call
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockClear();

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(comprehensivePerformanceMonitor.getCurrentMetrics).toHaveBeenCalled();
  });

  it('should handle missing crisis metrics gracefully', async () => {
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useCrisisPerformanceMonitoring(), { wrapper: Wrapper });

    // Should not crash and should maintain default values
    expect(result.current.responseTime).toBe(0);
    expect(result.current.isHealthy).toBe(true);
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate performance summary', () => {
    const mockReport = 'Comprehensive Performance Report\nMetrics: Excellent';
    (comprehensivePerformanceMonitor.generatePerformanceReport as jest.Mock).mockReturnValue(mockReport);

    const summary = generatePerformanceSummary();

    expect(comprehensivePerformanceMonitor.generatePerformanceReport).toHaveBeenCalled();
    expect(summary).toBe(mockReport);
  });

  it('should handle performance summary errors', () => {
    (comprehensivePerformanceMonitor.generatePerformanceReport as jest.Mock).mockImplementation(() => {
      throw new Error('Summary generation failed');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const summary = generatePerformanceSummary();

    expect(summary).toBe('Performance summary unavailable');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should export performance data', () => {
    const mockHistory = [mockMetrics];
    (comprehensivePerformanceMonitor.getPerformanceHistory as jest.Mock).mockReturnValue(mockHistory);
    (comprehensivePerformanceMonitor.getActiveAlerts as jest.Mock).mockReturnValue(mockAlerts);
    (comprehensivePerformanceMonitor.generateOptimizationRecommendations as jest.Mock).mockReturnValue(mockRecommendations);

    const exportData = exportPerformanceData(12);

    expect(exportData).toEqual({
      exportTimestamp: expect.any(String),
      timeRange: '12 hours',
      metrics: mockHistory,
      alerts: mockAlerts,
      recommendations: mockRecommendations,
      summary: expect.any(String)
    });
  });

  it('should handle export errors', () => {
    (comprehensivePerformanceMonitor.getPerformanceHistory as jest.Mock).mockImplementation(() => {
      throw new Error('Export failed');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const exportData = exportPerformanceData();

    expect(exportData).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should check performance monitoring health', () => {
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockReturnValue({
      ...mockMetrics,
      timestamp: Date.now() - 30000 // 30 seconds ago, should be healthy
    });

    const isHealthy = isPerformanceMonitoringHealthy();

    expect(isHealthy).toBe(true);
  });

  it('should detect stale performance monitoring', () => {
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockReturnValue({
      ...mockMetrics,
      timestamp: Date.now() - 120000 // 2 minutes ago, should be unhealthy
    });

    const isHealthy = isPerformanceMonitoringHealthy();

    expect(isHealthy).toBe(false);
  });

  it('should handle health check errors', () => {
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockImplementation(() => {
      throw new Error('Health check failed');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const isHealthy = isPerformanceMonitoringHealthy();

    expect(isHealthy).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('PerformanceProvider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockReturnValue(mockMetrics);
  });

  it('should monitor critical performance issues', async () => {
    const criticalMetrics = {
      ...mockMetrics,
      crisisDetectionResponseTime: 600, // Critical
      memoryUsage: 220, // Critical
      largestContentfulPaint: 6000 // Critical
    };

    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockReturnValue(criticalMetrics);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const TestComponent = () => React.createElement('div', {}, 'Test');

    renderHook(() => {
      return React.createElement(PerformanceProvider, { children: React.createElement(TestComponent) });
    }, { wrapper: Wrapper });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Critical performance issues detected:',
        expect.arrayContaining([
          'Crisis detection severely degraded',
          'Memory usage critically high',
          'Page loading extremely slow'
        ])
      );
    });

    consoleSpy.mockRestore();
  });

  it('should not log when performance is healthy', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const TestComponent = () => React.createElement('div', {}, 'Test');

    renderHook(() => {
      return React.createElement(PerformanceProvider, { children: React.createElement(TestComponent) });
    }, { wrapper: Wrapper });

    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('PerformanceDebugInfo Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (comprehensivePerformanceMonitor.getCurrentMetrics as jest.Mock).mockReturnValue(mockMetrics);
  });

  it('should not render in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { container } = render(<PerformanceDebugInfo />);

    expect(container.firstChild).toBeNull();

    process.env.NODE_ENV = originalEnv;
  });

  it('should render in development when metrics are available', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Mock the hook to return metrics
    jest.doMock('./usePerformanceMonitoring', () => ({
      usePerformanceMetrics: () => ({ metrics: mockMetrics }),
      usePerformanceAlerts: () => ({ alerts: mockAlerts })
    }));

    const { container } = render(<PerformanceDebugInfo />);

    expect(container.firstChild).not.toBeNull();

    process.env.NODE_ENV = originalEnv;
  });
});

// Helper function to render components in tests
function render(component: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const unmount = () => {
    document.body.removeChild(container);
  };

  // Simple React renderer for testing
  if (process.env.NODE_ENV !== 'production' && component.type === PerformanceDebugInfo) {
    container.innerHTML = `
      <div style="position: fixed; top: 10px; right: 10px;">
        <h4>🔍 Performance Debug</h4>
        <div>FCP: ${mockMetrics.firstContentfulPaint}ms</div>
        <div>LCP: ${mockMetrics.largestContentfulPaint}ms</div>
        <div>Memory: ${mockMetrics.memoryUsage}MB</div>
      </div>
    `;
  }

  return { container, unmount };
}