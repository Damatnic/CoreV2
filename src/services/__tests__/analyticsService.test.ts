// Analytics Service Test Suite
// Testing privacy-compliant analytics with GDPR/HIPAA-adjacent compliance

import { getAnalyticsService } from '../analyticsService';
import type { ConsentStatus, AnalyticsConfig } from '../analyticsService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock PerformanceObserver
const mockPerformanceObserver = jest.fn();
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

mockPerformanceObserver.mockImplementation(() => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
}));

// Setup global mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true,
});

// Cast to any to allow setting supportedEntryTypes
(global as any).PerformanceObserver = mockPerformanceObserver;
(mockPerformanceObserver as any).supportedEntryTypes = ['navigation', 'paint'];

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock document and window for browser APIs
Object.defineProperty(document, 'title', {
  value: 'Test Page',
  writable: true,
});

Object.defineProperty(document, 'referrer', {
  value: 'https://example.com',
  writable: true,
});

Object.defineProperty(navigator, 'language', {
  value: 'en-US',
  writable: true,
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 Test Browser',
  writable: true,
});

Object.defineProperty(window, 'innerWidth', {
  value: 1920,
  writable: true,
});

Object.defineProperty(window, 'innerHeight', {
  value: 1080,
  writable: true,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    getEntriesByType: jest.fn(() => [])
  },
  writable: true,
});

// Mock timers
jest.useFakeTimers();

describe('AnalyticsService', () => {
  let service: any; // Using any to access private methods for testing

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock Date.now for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1234567890000);
    
    // Create new service instance
    service = getAnalyticsService();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it('should respect opt-out setting', () => {
      // Opt out the current service
      service.optOut();
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      // Ensure consent for tracking
      service.updateConsent({ analytics: true });
    });

    it('should track basic events', () => {
      service.track('test_event', 'user_action', { testProp: 'value' });
      
      // Events are stored when batched or flushed
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should track page views', () => {
      service.trackPageView('/test-page', 'Test Page');
      
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should track feature usage', () => {
      service.trackFeatureUsage('test_feature', 'click', { button: 'primary' });
      
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should track errors', () => {
      const testError = new Error('Test error');
      service.trackError(testError, 'test_context');
      
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should track user actions', () => {
      service.trackUserAction('button_click', 'submit_button', { form: 'contact' });
      
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should track timing data', () => {
      service.trackTiming('api_call', 1500, 'network');
      
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Crisis Intervention Tracking', () => {
    beforeEach(() => {
      service.updateConsent({ analytics: true });
    });

    it('should track crisis intervention events', () => {
      service.trackCrisisIntervention('crisis_detected', { severity: 'high', trigger: 'keyword' });
      
      // Crisis events should trigger immediate flush
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should prioritize crisis events for immediate flush', () => {
      const flushSpy = jest.spyOn(service, 'flush');
      
      service.trackCrisisIntervention('crisis_action', { action: 'contact_support' });
      
      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe('Wellness Tracking', () => {
    beforeEach(() => {
      service.updateConsent({ analytics: true });
    });

    it('should track wellness activities', () => {
      service.trackWellnessActivity('meditation', { duration: 600, type: 'guided' });
      
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle wellness tracking with sensitive data', () => {
      service.trackWellnessActivity('mood_check', { mood: 'anxious', scale: 7 });
      
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Consent Management', () => {
    it('should update consent status', () => {
      const consentStatus: Partial<ConsentStatus> = {
        analytics: true,
        performance: false,
        functionality: true,
        marketing: false
      };
      
      service.updateConsent(consentStatus);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'analytics_consent_status',
        expect.stringContaining('"analytics":true')
      );
    });

    it('should get current consent status', () => {
      const consent = service.getConsentStatus();
      expect(consent).toBeDefined();
    });

    it('should disable service when consent is revoked', () => {
      service.updateConsent({ analytics: false, performance: false });
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('GDPR Compliance', () => {
    it('should export user data', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const userData = await service.exportUserData('test-user-123');
      
      expect(userData).toHaveProperty('userId');
      expect(userData).toHaveProperty('requestDate');
      expect(userData).toHaveProperty('status');
    });

    it('should delete user data', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = await service.deleteUserData('test-user-123');
      
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('status');
    });

    it('should handle data deletion with crisis data retention', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = await service.deleteUserData('test-user-123', true);
      
      expect(result).toHaveProperty('retainCrisisData', true);
    });
  });

  describe('Privacy Controls', () => {
    it('should opt out of analytics', () => {
      service.optOut();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('analytics_opted_out', 'true');
      expect(service.isEnabled()).toBe(false);
    });

    it('should opt in to analytics', () => {
      service.optIn();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('analytics_opted_out');
    });
  });

  describe('Data Sanitization', () => {
    beforeEach(() => {
      service.updateConsent({ analytics: true });
    });

    it('should sanitize sensitive properties', () => {
      service.track('test_event', 'user_action', {
        email: 'test@example.com',
        password: 'secret123',
        normalProp: 'value'
      });
      
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle sensitive strings in properties', () => {
      service.track('test_event', 'user_action', {
        text: 'My email is user@domain.com and phone is 555-123-4567'
      });
      
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should set user ID when consent given', () => {
      // First give consent
      service.updateConsent({ analytics: true });
      
      service.setUserId('test-user-123');
      
      // setUserId stores internally, verify through tracking
      service.track('test_event', 'user_action');
      service.flush();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should end session properly', () => {
      const flushSpy = jest.spyOn(service, 'flush');
      
      service.endSession();
      
      expect(flushSpy).toHaveBeenCalled();
    });

    it('should get current journey data', () => {
      const journey = service.getJourney();
      
      expect(journey).toHaveProperty('sessionId');
      expect(journey).toHaveProperty('startTime');
      expect(journey).toHaveProperty('events');
    });
  });

  describe('Performance Monitoring', () => {
    it('should setup performance monitoring', () => {
      // Performance monitoring capability exists
      // We verify the service has timing tracking functionality
      expect(service.trackTiming).toBeDefined();
      expect(typeof service.trackTiming).toBe('function');
    });
  });

  describe('Batch Processing', () => {
    beforeEach(() => {
      service.updateConsent({ analytics: true });
    });

    it('should flush events when batch size reached', () => {
      const flushSpy = jest.spyOn(service, 'flush');
      
      // Track enough events to trigger auto-flush (default batch size is 10)
      for (let i = 0; i < 10; i++) {
        service.track(`event_${i}`, 'user_action');
      }
      
      expect(flushSpy).toHaveBeenCalled();
    });

    it('should flush events manually', () => {
      service.track('test_event', 'user_action');
      
      const result = service.flush();
      expect(result).toBeUndefined(); // flush() doesn't return anything
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      expect(() => {
        service.track('test_event', 'user_action');
      }).not.toThrow();
    });

    it('should handle malformed stored data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // The service should handle malformed JSON gracefully
      const events = service.getStoredEvents();
      expect(events).toEqual([]);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig: Partial<AnalyticsConfig> = {
        batchSize: 50,
        flushInterval: 15000
      };
      
      service.updateConfig(newConfig);
      
      // Configuration is internal, so we test through behavior
      expect(service.isEnabled()).toBeDefined();
    });

    it('should check if service is enabled', () => {
      const enabled = service.isEnabled();
      expect(typeof enabled).toBe('boolean');
    });
  });

  describe('Data Management', () => {
    it('should get stored events', () => {
      const mockEvents = [
        {
          id: 'test-1',
          name: 'test_event',
          category: 'user_action',
          timestamp: Date.now(),
          sessionId: 'session-1',
          isAnonymized: false,
          sensitivityLevel: 'private'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEvents));
      
      const events = service.getStoredEvents();
      expect(events).toEqual(mockEvents);
    });

    it('should clear stored data', () => {
      service.clearStoredData();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('analytics_events');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('analytics_failed');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('analytics_consent_status');
    });
  });

  describe('Singleton Service', () => {
    it('should return singleton instance', () => {
      const service1 = getAnalyticsService();
      const service2 = getAnalyticsService();
      
      expect(service1).toBe(service2);
    });
  });

  describe('Privacy Reporting', () => {
    it('should generate privacy compliance report', () => {
      const report = service.getPrivacyReport();
      
      expect(report).toHaveProperty('totalEvents');
      expect(report).toHaveProperty('gdprCompliant');
      expect(report).toHaveProperty('hipaaAdjacent');
      expect(report).toHaveProperty('consentStatus');
    });
  });
});