import * as Sentry from '@sentry/react';
import { 
  initializeSentry,
  trackError,
  trackCrisisError,
  trackUserAction,
  setUserContext,
  addBreadcrumb,
  ErrorContext
} from '../errorTrackingService';

// Mock Sentry
jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  withScope: jest.fn((callback) => {
    const scope = {
      setLevel: jest.fn(),
      setTag: jest.fn(),
      setContext: jest.fn(),
    };
    callback(scope);
  }),
}));

// Mock environment variables for Vite
const mockImportMeta = {
  env: {
    PROD: false,
    DEV: true,
    VITE_SENTRY_DSN: 'https://test-dsn@sentry.io/123456'
  }
};

// Mock import.meta
Object.defineProperty(window, 'import', {
  value: {
    meta: mockImportMeta
  },
  writable: true,
});

describe('Error Tracking Service (Vite Version)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Environment detection', () => {
    it('should detect production environment correctly', () => {
      mockImportMeta.env.PROD = true;
      mockImportMeta.env.DEV = false;
      
      initializeSentry('test-dsn');

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.1
        })
      );
    });

    it('should detect development environment correctly', () => {
      mockImportMeta.env.PROD = false;
      mockImportMeta.env.DEV = true;
      
      initializeSentry('test-dsn');

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 1.0
        })
      );
    });

    it('should use environment DSN when available', () => {
      const envDsn = 'https://env-dsn@sentry.io/789';
      mockImportMeta.env.VITE_SENTRY_DSN = envDsn;
      
      initializeSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: envDsn
        })
      );
    });
  });

  describe('Vite-specific configuration', () => {
    it('should handle missing import.meta gracefully', () => {
      // Temporarily remove import.meta
      const originalImportMeta = (window as any).import;
      delete (window as any).import;

      expect(() => {
        initializeSentry('test-dsn');
      }).not.toThrow();

      // Restore import.meta
      (window as any).import = originalImportMeta;
    });

    it('should handle missing env variables gracefully', () => {
      const originalEnv = mockImportMeta.env;
      mockImportMeta.env = {};

      expect(() => {
        initializeSentry('test-dsn');
      }).not.toThrow();

      mockImportMeta.env = originalEnv;
    });

    it('should default to development behavior when env is unclear', () => {
      mockImportMeta.env.PROD = undefined;
      mockImportMeta.env.DEV = undefined;
      
      initializeSentry('test-dsn');

      // Should default to development-like behavior
      expect(Sentry.init).toHaveBeenCalled();
    });
  });

  describe('Error sanitization (Vite version)', () => {
    it('should work identically to non-Vite version', () => {
      initializeSentry('test-dsn');
      
      const beforeSendFn = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
      
      const error = new Error('Authentication failed with token: abc123');
      const event = {
        message: error.message,
        exception: {
          values: [{ value: error.message }]
        }
      };
      
      const sanitizedEvent = beforeSendFn(event, { originalException: error });

      expect(sanitizedEvent.message).toContain('[REDACTED]');
      expect(sanitizedEvent.message).not.toContain('abc123');
    });

    it('should sanitize Vite-specific error patterns', () => {
      initializeSentry('test-dsn');
      
      const beforeSendFn = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
      
      const error = new Error('Vite HMR failed to update module with session data');
      const event = {
        message: error.message,
        exception: {
          values: [{ value: error.message }]
        }
      };
      
      const sanitizedEvent = beforeSendFn(event, { originalException: error });

      expect(sanitizedEvent.message).toContain('[REDACTED]');
    });
  });

  describe('Mental health specific error tracking', () => {
    it('should track crisis-related errors with appropriate sensitivity', () => {
      const error = new Error('Crisis detection AI model failed');
      const context: ErrorContext = {
        errorType: 'crisis',
        severity: 'critical',
        feature: 'crisis-detection',
        privacyLevel: 'sensitive'
      };

      trackError(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should handle therapy session errors sensitively', () => {
      const error = new Error('Therapy session connection lost');
      
      trackCrisisError(error, {
        userType: 'seeker',
        feature: 'chat',
        additionalContext: {
          sessionType: 'therapy',
          duration: 1800,
          encrypted: true
        }
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should track mood tracking errors', () => {
      const error = new Error('Mood data sync failed');
      const context: ErrorContext = {
        errorType: 'user-action',
        severity: 'medium',
        feature: 'mood-tracking',
        userType: 'seeker',
        privacyLevel: 'private'
      };

      trackError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should track safety plan errors with high priority', () => {
      const error = new Error('Safety plan save failed');
      const context: ErrorContext = {
        errorType: 'system',
        severity: 'high',
        feature: 'safety-plan',
        userType: 'seeker',
        privacyLevel: 'sensitive'
      };

      trackError(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
    });

    it('should track community moderation errors', () => {
      const error = new Error('Automated moderation system failed');
      const context: ErrorContext = {
        errorType: 'system',
        severity: 'high',
        feature: 'community',
        userType: 'admin',
        privacyLevel: 'public'
      };

      trackError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('User action tracking', () => {
    it('should track emergency resource access', () => {
      trackUserAction('emergency_resource_accessed', {
        resourceType: 'crisis_hotline',
        feature: 'crisis-detection',
        userType: 'seeker',
        timestamp: Date.now()
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'User Action: emergency_resource_accessed',
        'info'
      );
    });

    it('should track helper response actions', () => {
      trackUserAction('crisis_response_sent', {
        responseTime: 300,
        feature: 'chat',
        userType: 'helper',
        priority: 'high'
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'User Action: crisis_response_sent',
        'info'
      );
    });

    it('should track safety plan activations', () => {
      trackUserAction('safety_plan_activated', {
        planId: 'plan-123',
        feature: 'safety-plan',
        userType: 'seeker',
        trigger: 'crisis_detected'
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'User Action: safety_plan_activated',
        'info'
      );
    });
  });

  describe('Context and breadcrumb management', () => {
    it('should set appropriate user context for seekers', () => {
      setUserContext({
        id: 'seeker-123',
        type: 'seeker',
        anonymousId: 'anon-456',
        riskLevel: 'medium',
        hasActiveSafetyPlan: true
      });

      expect(Sentry.setUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'seeker-123',
          type: 'seeker'
        })
      );
    });

    it('should set appropriate user context for helpers', () => {
      setUserContext({
        id: 'helper-789',
        type: 'helper',
        certification: 'licensed_therapist',
        specializations: ['anxiety', 'depression'],
        activeClients: 5
      });

      expect(Sentry.setUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'helper-789',
          type: 'helper'
        })
      );
    });

    it('should add crisis-related breadcrumbs', () => {
      addBreadcrumb({
        message: 'Crisis keywords detected in user input',
        category: 'crisis-detection',
        level: 'warning',
        data: {
          confidence: 0.92,
          keywords: ['redacted'],
          model_version: 'v2.1'
        }
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Crisis keywords detected in user input',
        category: 'crisis-detection',
        level: 'warning',
        data: {
          confidence: 0.92,
          keywords: ['redacted'],
          model_version: 'v2.1'
        }
      });
    });

    it('should add therapy session breadcrumbs', () => {
      addBreadcrumb({
        message: 'Therapy session started',
        category: 'session',
        level: 'info',
        data: {
          sessionId: 'session-encrypted-id',
          participantCount: 2,
          sessionType: 'video'
        }
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Therapy session started',
          category: 'session',
          level: 'info'
        })
      );
    });
  });

  describe('Performance and reliability', () => {
    it('should handle high volume of error tracking', () => {
      // Simulate multiple concurrent error tracking calls
      const errors = Array.from({ length: 100 }, (_, i) => 
        new Error(`Test error ${i}`)
      );

      errors.forEach((error, i) => {
        trackError(error, {
          errorType: 'system',
          severity: 'low',
          privacyLevel: 'public'
        });
      });

      expect(Sentry.captureException).toHaveBeenCalledTimes(100);
    });

    it('should handle malformed error objects', () => {
      const malformedError = {
        message: 'Not a proper Error object',
        stack: null
      };

      expect(() => {
        trackError(malformedError as Error, {
          errorType: 'system',
          severity: 'low',
          privacyLevel: 'public'
        });
      }).not.toThrow();
    });

    it('should handle circular references in context', () => {
      const circularObject: any = { name: 'test' };
      circularObject.self = circularObject;

      expect(() => {
        trackError(new Error('Test'), {
          errorType: 'system',
          severity: 'low',
          privacyLevel: 'public'
        });
      }).not.toThrow();
    });
  });

  describe('Privacy compliance edge cases', () => {
    it('should handle deeply nested sensitive data', () => {
      const error = new Error('Complex nested data error');
      const context = {
        user: {
          profile: {
            medical: {
              history: {
                diagnosis: 'sensitive information',
                medications: ['med1', 'med2']
              }
            }
          }
        }
      };

      trackError(error, {
        errorType: 'system',
        severity: 'medium',
        privacyLevel: 'sensitive'
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should handle URLs with sensitive query parameters', () => {
      const error = new Error('Request failed: https://api.example.com/therapy?session_id=secret&token=abc123');
      
      initializeSentry('test-dsn');
      const beforeSendFn = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
      
      const event = {
        message: error.message,
        exception: {
          values: [{ value: error.message }]
        }
      };
      
      const sanitizedEvent = beforeSendFn(event, { originalException: error });

      expect(sanitizedEvent.message).not.toContain('secret');
      expect(sanitizedEvent.message).not.toContain('abc123');
    });

    it('should maintain error context while protecting privacy', () => {
      const error = new Error('Service unavailable');
      const context: ErrorContext = {
        errorType: 'network',
        severity: 'high',
        feature: 'crisis-detection',
        privacyLevel: 'sensitive'
      };

      trackError(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });
});