/**
 * @jest-environment jsdom
 */

import { CoreWebVitalsService, coreWebVitalsService } from '../coreWebVitalsService';

// Mock web-vitals library
const mockOnCLS = jest.fn();
const mockOnINP = jest.fn();
const mockOnFCP = jest.fn();
const mockOnLCP = jest.fn();
const mockOnTTFB = jest.fn();

jest.mock('web-vitals', () => ({
  onCLS: mockOnCLS,
  onINP: mockOnINP,
  onFCP: mockOnFCP,
  onLCP: mockOnLCP,
  onTTFB: mockOnTTFB,
}));

// Mock PerformanceObserver
const mockPerformanceObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
  getEntries: jest.fn(() => []),
};

Object.defineProperty(global, 'PerformanceObserver', {
  value: jest.fn().mockImplementation(() => mockPerformanceObserver),
  writable: true,
});

// Mock performance API
const mockNavigationEntry: PerformanceNavigationTiming = {
  name: 'test-navigation',
  entryType: 'navigation',
  startTime: 0,
  duration: 1000,
  loadEventStart: 800,
  loadEventEnd: 900,
  domContentLoadedEventStart: 400,
  domContentLoadedEventEnd: 450,
  responseStart: 200,
  requestStart: 100,
  transferSize: 2048,
  encodedBodySize: 1536,
  decodedBodySize: 2048,
  type: 'navigate',
  redirectCount: 0,
  initiatorType: '',
  nextHopProtocol: 'http/1.1',
  renderBlockingStatus: 'non-blocking',
  deliveryType: '',
  serverTiming: [],
  workerStart: 0,
  redirectStart: 0,
  redirectEnd: 0,
  fetchStart: 100,
  domainLookupStart: 110,
  domainLookupEnd: 120,
  connectStart: 120,
  connectEnd: 140,
  secureConnectionStart: 130,
  responseEnd: 250,
  domInteractive: 350,
  domContentLoadedEventEnd: 450,
  domContentLoadedEventStart: 400,
  domComplete: 750,
  loadEventStart: 800,
  loadEventEnd: 900,
  unloadEventStart: 0,
  unloadEventEnd: 0,
  toJSON: function() { return this; }
};

Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    getEntriesByType: jest.fn(() => [mockNavigationEntry]),
    getEntriesByName: jest.fn(() => []),
    timing: {
      navigationStart: Date.now() - 5000,
    },
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  writable: true,
});

Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    rtt: 50,
    downlink: 10,
  },
  writable: true,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true,
});

Object.defineProperty(window, 'innerHeight', {
  value: 768,
  writable: true,
});

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/test-page',
    href: 'https://example.com/test-page',
  },
  writable: true,
});

// Mock history
Object.defineProperty(window, 'history', {
  value: {
    pushState: jest.fn(),
  },
  writable: true,
});

describe('CoreWebVitalsService', () => {
  let service: CoreWebVitalsService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation();
    
    // Reset performance mocks
    (performance.now as jest.Mock).mockReturnValue(Date.now());
    (performance.getEntriesByType as jest.Mock).mockReturnValue([mockNavigationEntry]);
    
    // Reset web-vitals mocks
    mockOnCLS.mockImplementation((callback) => callback);
    mockOnINP.mockImplementation((callback) => callback);
    mockOnFCP.mockImplementation((callback) => callback);
    mockOnLCP.mockImplementation((callback) => callback);
    mockOnTTFB.mockImplementation((callback) => callback);

    service = new CoreWebVitalsService();
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      expect(service).toBeDefined();
      expect((service as any).sessionId).toMatch(/^cwv-\d+-[a-z0-9]+$/);
      expect((service as any).deviceType).toBe('desktop'); // innerWidth = 1024
      expect((service as any).connectionType).toBe('4g');
    });

    test('should detect mobile device', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
      const mobileService = new CoreWebVitalsService();
      
      expect((mobileService as any).deviceType).toBe('mobile');
    });

    test('should detect tablet device', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      const tabletService = new CoreWebVitalsService();
      
      expect((tabletService as any).deviceType).toBe('tablet');
    });

    test('should track initial route', () => {
      expect((service as any).userJourney).toContain('/test-page');
    });

    test('should initialize web vitals on initialize call', async () => {
      await service.initialize('https://api.example.com/vitals');
      
      expect(mockOnCLS).toHaveBeenCalled();
      expect(mockOnINP).toHaveBeenCalled();
      expect(mockOnFCP).toHaveBeenCalled();
      expect(mockOnLCP).toHaveBeenCalled();
      expect(mockOnTTFB).toHaveBeenCalled();
    });

    test('should handle web-vitals import failure', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock import to fail
      jest.doMock('web-vitals', () => {
        throw new Error('Import failed');
      });

      await service.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('Core Web Vitals monitoring not available:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Device and Connection Detection', () => {
    test('should detect connection type from navigator', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '3g' },
        writable: true,
      });

      const service3g = new CoreWebVitalsService();
      expect((service3g as any).connectionType).toBe('3g');
    });

    test('should handle missing connection info', () => {
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        writable: true,
      });

      const serviceUnknown = new CoreWebVitalsService();
      expect((serviceUnknown as any).connectionType).toBe('unknown');
    });

    test('should generate unique session IDs', () => {
      const service1 = new CoreWebVitalsService();
      const service2 = new CoreWebVitalsService();
      
      expect((service1 as any).sessionId).not.toBe((service2 as any).sessionId);
    });
  });

  describe('Performance Budget Validation', () => {
    test('should have correct performance budgets', () => {
      const budgets = (service as any).PERFORMANCE_BUDGET;
      
      expect(budgets.LCP.good).toBe(2500);
      expect(budgets.LCP.needsImprovement).toBe(4000);
      expect(budgets.FID.good).toBe(100);
      expect(budgets.FID.needsImprovement).toBe(300);
      expect(budgets.CLS.good).toBe(0.1);
      expect(budgets.CLS.needsImprovement).toBe(0.25);
      expect(budgets.FCP.good).toBe(1800);
      expect(budgets.FCP.needsImprovement).toBe(3000);
      expect(budgets.TTFB.good).toBe(800);
      expect(budgets.TTFB.needsImprovement).toBe(1800);
      expect(budgets.INP.good).toBe(200);
      expect(budgets.INP.needsImprovement).toBe(500);
    });
  });

  describe('Metric Rating Calculation', () => {
    test('should calculate good ratings correctly', () => {
      expect((service as any).calculateRating('LCP', 2000)).toBe('good');
      expect((service as any).calculateRating('FID', 50)).toBe('good');
      expect((service as any).calculateRating('CLS', 0.05)).toBe('good');
      expect((service as any).calculateRating('FCP', 1500)).toBe('good');
      expect((service as any).calculateRating('TTFB', 600)).toBe('good');
      expect((service as any).calculateRating('INP', 150)).toBe('good');
    });

    test('should calculate needs-improvement ratings correctly', () => {
      expect((service as any).calculateRating('LCP', 3000)).toBe('needs-improvement');
      expect((service as any).calculateRating('FID', 200)).toBe('needs-improvement');
      expect((service as any).calculateRating('CLS', 0.15)).toBe('needs-improvement');
      expect((service as any).calculateRating('FCP', 2500)).toBe('needs-improvement');
      expect((service as any).calculateRating('TTFB', 1500)).toBe('needs-improvement');
      expect((service as any).calculateRating('INP', 400)).toBe('needs-improvement');
    });

    test('should calculate poor ratings correctly', () => {
      expect((service as any).calculateRating('LCP', 5000)).toBe('poor');
      expect((service as any).calculateRating('FID', 400)).toBe('poor');
      expect((service as any).calculateRating('CLS', 0.3)).toBe('poor');
      expect((service as any).calculateRating('FCP', 3500)).toBe('poor');
      expect((service as any).calculateRating('TTFB', 2000)).toBe('poor');
      expect((service as any).calculateRating('INP', 600)).toBe('poor');
    });

    test('should handle unknown metrics gracefully', () => {
      expect((service as any).calculateRating('UNKNOWN_METRIC', 1000)).toBe('good');
    });
  });

  describe('Metric Handling', () => {
    test('should handle web vital metrics correctly', () => {
      const mockMetric = {
        name: 'LCP',
        value: 2400,
        rating: 'good',
        delta: 2400,
        id: 'test-lcp',
        navigationType: 'navigate',
      };

      (service as any).handleMetric(mockMetric);
      
      const metrics = (service as any).metrics;
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('LCP');
      expect(metrics[0].value).toBe(2400);
      expect(metrics[0].rating).toBe('good');
      expect(metrics[0].route).toBe('/test-page');
      expect(metrics[0].userAgent).toBe(navigator.userAgent);
      expect(metrics[0].connectionType).toBe('4g');
    });

    test('should detect crisis situations', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/crisis-support' },
        writable: true,
      });

      const crisisService = new CoreWebVitalsService();
      expect((crisisService as any).isCrisisRoute()).toBe(true);
    });

    test('should detect emergency routes', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/emergency-help' },
        writable: true,
      });

      const emergencyService = new CoreWebVitalsService();
      expect((emergencyService as any).isCrisisRoute()).toBe(true);
    });

    test('should detect safety routes', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/safety-plan' },
        writable: true,
      });

      const safetyService = new CoreWebVitalsService();
      expect((safetyService as any).isCrisisRoute()).toBe(true);
    });

    test('should detect offline crisis routes', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/offline-crisis' },
        writable: true,
      });

      const offlineCrisisService = new CoreWebVitalsService();
      expect((offlineCrisisService as any).isCrisisRoute()).toBe(true);
    });

    test('should handle real-time alerts for poor crisis performance', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const mockCrisisMetric = {
        name: 'LCP',
        value: 5000,
        rating: 'poor',
        delta: 5000,
        id: 'crisis-lcp',
        navigationType: 'navigate',
      };

      Object.defineProperty(window, 'location', {
        value: { pathname: '/crisis-support' },
        writable: true,
      });

      const crisisService = new CoreWebVitalsService();
      (crisisService as any).handleMetric(mockCrisisMetric);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Poor LCP in crisis situation:'),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Crisis-Specific Metrics', () => {
    test('should measure crisis resource timing', () => {
      const mockResourceEntry = {
        name: 'https://example.com/crisis-support.js',
        entryType: 'resource',
        startTime: 100,
        duration: 500,
      };

      // Mock performance observer callback
      const observerCallback = mockPerformanceObserver.observe.mock.calls.find(
        call => call[0].type === 'resource'
      );
      
      if (observerCallback) {
        // Simulate resource entry being observed
        mockPerformanceObserver.getEntries.mockReturnValue([mockResourceEntry]);
        
        // Simulate observer callback
        const list = {
          getEntries: () => [mockResourceEntry]
        };
        
        // Call the observer setup method directly
        (service as any).measureCrisisResourceTiming();
      }
    });

    test('should calculate crisis resource rating', () => {
      expect((service as any).calculateCrisisResourceRating(800)).toBe('good');
      expect((service as any).calculateCrisisResourceRating(2000)).toBe('needs-improvement');
      expect((service as any).calculateCrisisResourceRating(3000)).toBe('poor');
    });

    test('should calculate emergency response rating', () => {
      expect((service as any).calculateEmergencyResponseRating(30)).toBe('good');
      expect((service as any).calculateEmergencyResponseRating(75)).toBe('needs-improvement');
      expect((service as any).calculateEmergencyResponseRating(150)).toBe('poor');
    });

    test('should monitor emergency button clicks', () => {
      document.body.innerHTML = `
        <button class="crisis-button">Emergency Help</button>
        <button class="emergency-button">Call Now</button>
        <div data-crisis="true">Crisis Resource</div>
      `;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Simulate emergency button click
      const crisisButton = document.querySelector('.crisis-button') as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      
      // Mock performance.now to simulate slow response
      (performance.now as jest.Mock)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(150); // 150ms response time - poor
      
      crisisButton.dispatchEvent(clickEvent);
      
      // Wait for requestAnimationFrame
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Poor emergency button response time:'),
          150,
          'ms'
        );
      }, 20);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Network Status Monitoring', () => {
    test('should track online status changes', () => {
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);
      
      const metrics = (service as any).metrics;
      const networkMetric = metrics.find((m: any) => m.id.includes('network-online'));
      
      expect(networkMetric).toBeDefined();
      if (networkMetric) {
        expect(networkMetric.rating).toBe('good');
      }
    });

    test('should track offline status changes', () => {
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);
      
      const metrics = (service as any).metrics;
      const networkMetric = metrics.find((m: any) => m.id.includes('network-offline'));
      
      expect(networkMetric).toBeDefined();
      if (networkMetric) {
        expect(networkMetric.rating).toBe('poor');
        expect(networkMetric.value).toBe(0);
      }
    });
  });

  describe('Performance Summary', () => {
    test('should generate performance summary', () => {
      // Add some test metrics
      const metrics = [
        {
          name: 'LCP',
          rating: 'good',
          isCrisisSituation: false,
        },
        {
          name: 'FID',
          rating: 'needs-improvement',
          isCrisisSituation: false,
        },
        {
          name: 'CLS',
          rating: 'poor',
          isCrisisSituation: true,
        },
      ];

      (service as any).metrics = metrics;

      const summary = service.getPerformanceSummary();
      
      expect(summary.totalMetrics).toBe(3);
      expect(summary.goodMetrics).toBe(1);
      expect(summary.needsImprovementMetrics).toBe(1);
      expect(summary.poorMetrics).toBe(1);
      expect(summary.crisisMetrics).toBe(1);
      expect(summary.deviceType).toBe('desktop');
      expect(summary.connectionType).toBe('4g');
      expect(summary.sessionId).toMatch(/^cwv-\d+-[a-z0-9]+$/);
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive report', () => {
      // Add test metrics
      const testMetrics = [
        {
          name: 'LCP',
          value: 2400,
          rating: 'good',
          isCrisisSituation: false,
          id: 'lcp-1',
        },
        {
          name: 'FID',
          value: 80,
          rating: 'good',
          isCrisisSituation: false,
          id: 'fid-1',
        },
        {
          name: 'CLS',
          value: 0.05,
          rating: 'good',
          isCrisisSituation: true,
          id: 'cls-crisis',
        },
      ];

      (service as any).metrics = testMetrics;

      const report = service.generateReport();
      
      expect(report.metrics).toEqual(testMetrics);
      expect(report.sessionId).toMatch(/^cwv-\d+-[a-z0-9]+$/);
      expect(report.deviceType).toBe('desktop');
      expect(report.connectionType).toBe('4g');
      expect(report.route).toBe('/test-page');
      expect(report.userJourney).toContain('/test-page');
      expect(report.timestamp).toBeCloseTo(Date.now(), -3);
    });

    test('should calculate crisis-specific metrics', () => {
      const crisisMetrics = [
        {
          name: 'LCP',
          value: 2000,
          id: 'crisis-resource-123',
          isCrisisSituation: true,
        },
        {
          name: 'FID',
          value: 50,
          id: 'emergency-response-456',
          isCrisisSituation: true,
        },
        {
          name: 'LCP',
          value: 3000,
          id: 'regular-lcp',
          isCrisisSituation: true,
        },
      ];

      (service as any).metrics = crisisMetrics;

      const crisisData = (service as any).calculateCrisisMetrics();
      
      expect(crisisData).toBeDefined();
      expect(crisisData.timeToFirstCrisisResource).toBe(2000);
      expect(crisisData.emergencyButtonResponseTime).toBe(50);
      expect(crisisData.crisisPageLoadTime).toBe(3000);
    });

    test('should handle empty crisis metrics', () => {
      (service as any).metrics = [];

      const crisisData = (service as any).calculateCrisisMetrics();
      
      expect(crisisData).toBeNull();
    });

    test('should clear metrics after reporting', () => {
      (service as any).metrics = [{ name: 'LCP', value: 2000 }];

      service.generateReport();
      
      expect((service as any).metrics).toHaveLength(0);
    });
  });

  describe('Route Tracking', () => {
    test('should track route changes with history.pushState', () => {
      const originalPushState = history.pushState;
      
      // Simulate route change
      history.pushState({}, 'New Page', '/new-route');
      
      const userJourney = (service as any).userJourney;
      expect(userJourney).toContain('/new-route');
      
      // Restore original method
      history.pushState = originalPushState;
    });

    test('should limit user journey length', () => {
      // Add 25 routes to exceed the 20-route limit
      for (let i = 0; i < 25; i++) {
        history.pushState({}, `Page ${i}`, `/route-${i}`);
      }
      
      const userJourney = (service as any).userJourney;
      expect(userJourney.length).toBe(20);
      expect(userJourney).toContain('/route-24'); // Most recent
      expect(userJourney).not.toContain('/route-0'); // Should be removed
    });
  });

  describe('Periodic Reporting', () => {
    test('should set up periodic reporting intervals', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      new CoreWebVitalsService();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
      setIntervalSpy.mockRestore();
    });

    test('should report on beforeunload', () => {
      const reportSpy = jest.spyOn(service, 'generateReport');
      
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);
      
      expect(reportSpy).toHaveBeenCalled();
    });
  });

  describe('External Reporting', () => {
    test('should send report to endpoint when configured', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      await service.initialize('https://api.example.com/vitals');
      
      (service as any).metrics = [{ name: 'LCP', value: 2000 }];
      
      const report = service.generateReport();
      
      // Wait for async send
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/vitals',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        })
      );
    });

    test('should handle fetch errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      await service.initialize('https://api.example.com/vitals');
      
      (service as any).metrics = [{ name: 'LCP', value: 2000 }];
      service.generateReport();
      
      // Wait for async send
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send Web Vitals report:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Crisis Metrics Storage', () => {
    test('should store crisis metrics in localStorage', () => {
      const crisisData = {
        metric: { name: 'LCP', value: 2000, isCrisisSituation: true },
        timestamp: Date.now(),
        route: '/crisis-support',
        sessionId: 'test-session',
        deviceType: 'mobile',
        connectionType: '4g',
      };

      (service as any).storeCrisisMetrics(crisisData);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'crisis-performance-metrics',
        JSON.stringify([crisisData])
      );
    });

    test('should limit crisis metrics storage to 100 entries', () => {
      // Mock existing data with 100 entries
      const existingData = Array(100).fill({}).map((_, i) => ({ id: i }));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));

      const newData = { id: 'new-entry' };
      (service as any).storeCrisisMetrics(newData);
      
      const expectedData = [...existingData.slice(1), newData];
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'crisis-performance-metrics',
        JSON.stringify(expectedData)
      );
    });

    test('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      (service as any).storeCrisisMetrics({ test: 'data' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not store crisis metrics:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Development Team Notifications', () => {
    test('should log critical performance issues', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const criticalMetric = {
        name: 'LCP',
        value: 8000,
        rating: 'poor',
        isCrisisSituation: true,
      };

      (service as any).notifyDevelopmentTeam(criticalMetric);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 Critical performance issue detected:',
        criticalMetric
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Service Control', () => {
    test('should stop monitoring and generate final report', () => {
      const reportSpy = jest.spyOn(service, 'generateReport');
      
      service.stop();
      
      expect(mockPerformanceObserver.disconnect).toHaveBeenCalled();
      expect(reportSpy).toHaveBeenCalled();
    });
  });

  describe('Singleton Instance', () => {
    test('should export singleton instance', () => {
      expect(coreWebVitalsService).toBeInstanceOf(CoreWebVitalsService);
    });

    test('should maintain same instance', () => {
      const instance1 = coreWebVitalsService;
      const instance2 = coreWebVitalsService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Error Handling', () => {
    test('should handle PerformanceObserver setup errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock PerformanceObserver to throw
      (global.PerformanceObserver as jest.Mock).mockImplementation(() => {
        throw new Error('Observer not supported');
      });

      const errorService = new CoreWebVitalsService();
      
      // Should still initialize without throwing
      expect(errorService).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    test('should handle missing PerformanceObserver gracefully', () => {
      const originalPerformanceObserver = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;

      const noObserverService = new CoreWebVitalsService();
      
      expect(noObserverService).toBeDefined();
      
      // Restore
      global.PerformanceObserver = originalPerformanceObserver;
    });
  });
});