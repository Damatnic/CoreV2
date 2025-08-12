import MobileNetworkService, { 
  NetworkConnection, 
  AdaptiveLoadingStrategy,
  NetworkType,
  EffectiveType 
} from '../mobileNetworkService';

// Mock Navigator Connection API
const mockConnection = {
  effectiveType: '4g' as EffectiveType,
  downlink: 10,
  rtt: 50,
  saveData: false,
  type: 'cellular' as NetworkType,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

Object.defineProperty(navigator, 'connection', {
  value: mockConnection,
  writable: true,
});

// Also mock webkitConnection for Safari
Object.defineProperty(navigator, 'mozConnection', {
  value: mockConnection,
  writable: true,
});

describe('MobileNetworkService', () => {
  let service: MobileNetworkService;

  beforeEach(() => {
    service = new MobileNetworkService();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(service).toBeInstanceOf(MobileNetworkService);
    });

    it('should detect network connection on initialization', () => {
      const connection = service.getCurrentConnection();

      expect(connection).toHaveProperty('type');
      expect(connection).toHaveProperty('effectiveType');
      expect(connection).toHaveProperty('speed');
      expect(connection).toHaveProperty('quality');
    });

    it('should handle missing Network Information API gracefully', () => {
      // Temporarily remove connection API
      const originalConnection = navigator.connection;
      delete (navigator as any).connection;

      const newService = new MobileNetworkService();
      const connection = newService.getCurrentConnection();

      expect(connection.type).toBe('unknown');
      expect(connection.effectiveType).toBe('unknown');

      // Restore connection API
      (navigator as any).connection = originalConnection;
    });
  });

  describe('network detection', () => {
    it('should detect 5G connection correctly', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 100;
      mockConnection.rtt = 20;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.speed).toBe('fast');
      expect(connection.quality).toBe('excellent');
    });

    it('should detect slow 2G connection correctly', () => {
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.05;
      mockConnection.rtt = 2000;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.speed).toBe('slow');
      expect(connection.quality).toBe('poor');
    });

    it('should detect WiFi connection correctly', () => {
      mockConnection.type = 'wifi';
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 50;
      mockConnection.rtt = 30;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.type).toBe('wifi');
      expect(connection.speed).toBe('fast');
      expect(connection.quality).toBe('excellent');
    });

    it('should detect ethernet connection correctly', () => {
      mockConnection.type = 'ethernet';
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 100;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.type).toBe('ethernet');
      expect(connection.speed).toBe('fast');
    });

    it('should respect saveData preference', () => {
      mockConnection.saveData = true;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.saveData).toBe(true);
    });
  });

  describe('adaptive loading strategies', () => {
    it('should generate conservative strategy for slow connections', () => {
      mockConnection.effectiveType = '2g';
      mockConnection.downlink = 0.5;
      mockConnection.saveData = true;

      service = new MobileNetworkService();
      const strategy = service.getAdaptiveLoadingStrategy();

      expect(strategy.imageQuality).toBe('low');
      expect(strategy.preloadLevel).toBe('minimal');
      expect(strategy.animationsEnabled).toBe(false);
      expect(strategy.enableVideoAutoplay).toBe(false);
      expect(strategy.compressionLevel).toBe('high');
      expect(strategy.maxConcurrentRequests).toBeLessThanOrEqual(2);
    });

    it('should generate aggressive strategy for fast connections', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 50;
      mockConnection.saveData = false;

      service = new MobileNetworkService();
      const strategy = service.getAdaptiveLoadingStrategy();

      expect(strategy.imageQuality).toBe('high');
      expect(strategy.preloadLevel).toBe('aggressive');
      expect(strategy.animationsEnabled).toBe(true);
      expect(strategy.enableVideoAutoplay).toBe(true);
      expect(strategy.compressionLevel).toBe('low');
      expect(strategy.maxConcurrentRequests).toBeGreaterThanOrEqual(6);
    });

    it('should generate medium strategy for moderate connections', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 5;
      mockConnection.rtt = 300;

      service = new MobileNetworkService();
      const strategy = service.getAdaptiveLoadingStrategy();

      expect(strategy.imageQuality).toBe('medium');
      expect(strategy.preloadLevel).toBe('selective');
      expect(strategy.animationsEnabled).toBe(true);
      expect(strategy.compressionLevel).toBe('medium');
      expect(strategy.maxConcurrentRequests).toBe(4);
    });

    it('should always respect data saver preference', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 100;
      mockConnection.saveData = true; // Data saver enabled

      service = new MobileNetworkService();
      const strategy = service.getAdaptiveLoadingStrategy();

      expect(strategy.imageQuality).toBe('low');
      expect(strategy.preloadLevel).toBe('minimal');
      expect(strategy.compressionLevel).toBe('high');
    });
  });

  describe('network change detection', () => {
    it('should register listeners for network changes', () => {
      const listener = jest.fn();
      service.addNetworkChangeListener(listener);

      // Simulate network change
      const changeEvent = new Event('change');
      mockConnection.addEventListener.mock.calls[0][1](changeEvent);

      expect(listener).toHaveBeenCalled();
    });

    it('should remove listeners properly', () => {
      const listener = jest.fn();
      service.addNetworkChangeListener(listener);
      service.removeNetworkChangeListener(listener);

      expect(mockConnection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should notify all listeners on network change', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      service.addNetworkChangeListener(listener1);
      service.addNetworkChangeListener(listener2);

      // Simulate network change
      mockConnection.effectiveType = '3g';
      const changeEvent = new Event('change');
      mockConnection.addEventListener.mock.calls[0][1](changeEvent);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should update connection info on network change', () => {
      // Initial connection
      const initialConnection = service.getCurrentConnection();
      expect(initialConnection.effectiveType).toBe('4g');

      // Simulate network change
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 2;
      
      const changeEvent = new Event('change');
      mockConnection.addEventListener.mock.calls[0][1](changeEvent);

      const updatedConnection = service.getCurrentConnection();
      expect(updatedConnection.effectiveType).toBe('3g');
      expect(updatedConnection.downlink).toBe(2);
    });
  });

  describe('network quality assessment', () => {
    it('should classify excellent quality correctly', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 50;
      mockConnection.rtt = 50;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.quality).toBe('excellent');
    });

    it('should classify good quality correctly', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 5;
      mockConnection.rtt = 200;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.quality).toBe('good');
    });

    it('should classify poor quality correctly', () => {
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.1;
      mockConnection.rtt = 1500;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.quality).toBe('poor');
    });

    it('should consider RTT in quality assessment', () => {
      // High bandwidth but very high latency
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 25;
      mockConnection.rtt = 2000;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.quality).not.toBe('excellent');
    });
  });

  describe('speed categorization', () => {
    it('should categorize fast speed correctly', () => {
      mockConnection.downlink = 25;
      mockConnection.rtt = 100;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.speed).toBe('fast');
    });

    it('should categorize medium speed correctly', () => {
      mockConnection.downlink = 5;
      mockConnection.rtt = 300;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.speed).toBe('medium');
    });

    it('should categorize slow speed correctly', () => {
      mockConnection.downlink = 0.5;
      mockConnection.rtt = 1000;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.speed).toBe('slow');
    });
  });

  describe('crisis-specific optimizations', () => {
    it('should provide crisis-optimized strategies for slow connections', () => {
      mockConnection.effectiveType = '2g';
      mockConnection.downlink = 0.3;

      service = new MobileNetworkService();
      const strategy = service.getCrisisOptimizedStrategy();

      expect(strategy.imageQuality).toBe('low');
      expect(strategy.preloadLevel).toBe('minimal');
      expect(strategy.maxConcurrentRequests).toBe(1);
      expect(strategy.lazyLoadThreshold).toBeGreaterThan(1000);
    });

    it('should prioritize critical resources on slow connections', () => {
      mockConnection.effectiveType = 'slow-2g';
      
      service = new MobileNetworkService();
      const recommendations = service.getCrisisLoadingRecommendations();

      expect(recommendations).toContain('prioritize_text_content');
      expect(recommendations).toContain('disable_autoplay');
      expect(recommendations).toContain('aggressive_compression');
      expect(recommendations).toContain('minimal_images');
    });

    it('should provide optimizations for emergency situations', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 2;

      service = new MobileNetworkService();
      const emergencyStrategy = service.getEmergencyLoadingStrategy();

      expect(emergencyStrategy.preloadLevel).toBe('minimal');
      expect(emergencyStrategy.animationsEnabled).toBe(false);
      expect(emergencyStrategy.compressionLevel).toBe('high');
    });
  });

  describe('battery and performance considerations', () => {
    it('should consider battery status in strategy', () => {
      // Mock battery API
      Object.defineProperty(navigator, 'battery', {
        value: Promise.resolve({
          level: 0.2, // Low battery
          charging: false
        })
      });

      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 50;

      service = new MobileNetworkService();
      const strategy = service.getAdaptiveLoadingStrategy();

      // Should be conservative even on fast network due to low battery
      expect(strategy.animationsEnabled).toBe(false);
      expect(strategy.preloadLevel).toBe('selective');
    });

    it('should adapt to device memory constraints', () => {
      // Mock device memory API
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2 // 2GB RAM
      });

      service = new MobileNetworkService();
      const strategy = service.getAdaptiveLoadingStrategy();

      expect(strategy.maxConcurrentRequests).toBeLessThanOrEqual(4);
    });
  });

  describe('offline detection', () => {
    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.type).toBe('unknown');
      expect(service.isOnline()).toBe(false);
    });

    it('should detect online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });

      expect(service.isOnline()).toBe(true);
    });

    it('should handle online/offline events', () => {
      const listener = jest.fn();
      service.addNetworkChangeListener(listener);

      // Simulate going offline
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      // Simulate going online
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('error handling and fallbacks', () => {
    it('should handle undefined network values gracefully', () => {
      mockConnection.downlink = undefined;
      mockConnection.rtt = undefined;

      service = new MobileNetworkService();
      const connection = service.getCurrentConnection();

      expect(connection.speed).toBeDefined();
      expect(connection.quality).toBeDefined();
      expect(connection.downlink).toBeDefined();
      expect(connection.rtt).toBeDefined();
    });

    it('should provide fallback strategy when API unavailable', () => {
      // Remove network API
      delete (navigator as any).connection;

      service = new MobileNetworkService();
      const strategy = service.getAdaptiveLoadingStrategy();

      expect(strategy).toBeDefined();
      expect(strategy.imageQuality).toBe('medium');
      expect(strategy.preloadLevel).toBe('selective');
    });

    it('should handle network API exceptions gracefully', () => {
      // Mock API to throw errors
      Object.defineProperty(mockConnection, 'effectiveType', {
        get: () => {
          throw new Error('API error');
        }
      });

      expect(() => {
        service = new MobileNetworkService();
      }).not.toThrow();
    });
  });

  describe('performance monitoring', () => {
    it('should track network performance metrics', () => {
      service = new MobileNetworkService();
      
      const metrics = service.getPerformanceMetrics();

      expect(metrics).toHaveProperty('averageDownlink');
      expect(metrics).toHaveProperty('averageRtt');
      expect(metrics).toHaveProperty('connectionChanges');
      expect(metrics).toHaveProperty('dataUsage');
    });

    it('should update metrics over time', () => {
      service = new MobileNetworkService();
      
      // Initial metrics
      const initialMetrics = service.getPerformanceMetrics();
      
      // Simulate network changes
      mockConnection.downlink = 2;
      const changeEvent = new Event('change');
      mockConnection.addEventListener.mock.calls[0][1](changeEvent);
      
      const updatedMetrics = service.getPerformanceMetrics();
      
      expect(updatedMetrics.connectionChanges).toBeGreaterThan(initialMetrics.connectionChanges);
    });
  });
});

// Add method declarations for testing
declare module '../mobileNetworkService' {
  interface MobileNetworkService {
    addNetworkChangeListener(listener: (connection: NetworkConnection) => void): void;
    removeNetworkChangeListener(listener: (connection: NetworkConnection) => void): void;
    getCrisisOptimizedStrategy(): AdaptiveLoadingStrategy;
    getCrisisLoadingRecommendations(): string[];
    getEmergencyLoadingStrategy(): AdaptiveLoadingStrategy;
    isOnline(): boolean;
    getPerformanceMetrics(): any;
  }
}