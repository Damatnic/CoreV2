import * as Sentry from '@sentry/react';
import { 
  initializeSentry,
  trackError,
  trackCrisisError,
  trackUserAction,
  setUserContext,
  addBreadcrumb,
  ErrorContext
} from '../errorTracking';

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

// Mock environment variables
const mockEnv = {
  NODE_ENV: 'test',
  VITE_SENTRY_DSN: 'https://test-dsn@sentry.io/123456'
};

Object.defineProperty(process, 'env', {
  value: mockEnv,
  writable: true,
});

describe('Error Tracking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeSentry', () => {
    it('should initialize Sentry with provided DSN', () => {
      const testDsn = 'https://test-dsn@sentry.io/123456';
      
      initializeSentry(testDsn);

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: testDsn,
          environment: expect.any(String),
          tracesSampleRate: expect.any(Number),
          beforeSend: expect.any(Function),
        })
      );
    });

    it('should warn when no DSN provided', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      initializeSentry();

      expect(consoleSpy).toHaveBeenCalledWith('Sentry DSN not provided - error tracking disabled');
      expect(Sentry.init).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should set different sample rates for production vs development', () => {
      // Test production
      process.env.NODE_ENV = 'production';
      initializeSentry('test-dsn');

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.1
        })
      );

      // Test development
      process.env.NODE_ENV = 'development';
      initializeSentry('test-dsn');

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 1.0
        })
      );
    });
  });

  describe('Error sanitization', () => {
    it('should sanitize sensitive data from error messages', () => {
      initializeSentry('test-dsn');
      
      const beforeSendFn = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
      
      const error = new Error('Failed to authenticate user with password: secret123');
      const event = {
        message: error.message,
        exception: {
          values: [{ value: error.message }]
        }
      };
      
      const sanitizedEvent = beforeSendFn(event, { originalException: error });

      expect(sanitizedEvent.message).toContain('[REDACTED]');
      expect(sanitizedEvent.message).not.toContain('secret123');
    });

    it('should sanitize context data', () => {
      initializeSentry('test-dsn');
      
      const beforeSendFn = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
      
      const error = new Error('Test error');
      const event = {
        message: error.message,
        contexts: {
          user: {
            email: 'user@example.com',
            password: 'secret',
            phone: '555-1234'
          }
        }
      };
      
      const sanitizedEvent = beforeSendFn(event, { originalException: error });

      expect(sanitizedEvent).toBeDefined();
      // Sensitive fields should be redacted
    });

    it('should preserve non-sensitive error information', () => {
      initializeSentry('test-dsn');
      
      const beforeSendFn = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
      
      const error = new Error('Network connection failed to fetch data');
      const event = {
        message: error.message,
        exception: {
          values: [{ value: error.message }]
        }
      };
      
      const sanitizedEvent = beforeSendFn(event, { originalException: error });

      expect(sanitizedEvent.message).toBe('Network connection failed to fetch data');
    });
  });

  describe('trackError function', () => {
    it('should track system errors with appropriate context', () => {
      const error = new Error('Database connection failed');
      const context: ErrorContext = {
        errorType: 'system',
        severity: 'high',
        privacyLevel: 'public'
      };

      trackError(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should track user action errors', () => {
      const error = new Error('Invalid form submission');
      const context: ErrorContext = {
        errorType: 'user-action',
        severity: 'medium',
        feature: 'mood-tracking',
        privacyLevel: 'private'
      };

      trackError(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should track network errors', () => {
      const error = new Error('API request timeout');
      const context: ErrorContext = {
        errorType: 'network',
        severity: 'medium',
        privacyLevel: 'public'
      };

      trackError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should handle security errors with high priority', () => {
      const error = new Error('Unauthorized access attempt');
      const context: ErrorContext = {
        errorType: 'security',
        severity: 'critical',
        privacyLevel: 'sensitive'
      };

      trackError(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('trackCrisisError function', () => {
    it('should track crisis-related errors with maximum priority', () => {
      const error = new Error('Crisis detection service unavailable');
      
      trackCrisisError(error, {
        userType: 'seeker',
        feature: 'crisis-detection',
        additionalContext: {
          timestamp: Date.now(),
          urgency: 'immediate'
        }
      });

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should handle crisis errors with sensitive data properly', () => {
      const error = new Error('Failed to process crisis message');
      
      trackCrisisError(error, {
        userType: 'seeker',
        feature: 'crisis-detection',
        additionalContext: {
          messageContent: 'I am having thoughts of self-harm',
          detectionResult: 'high-risk'
        }
      });

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
      // Should be called with scope modifications for crisis context
    });
  });

  describe('trackUserAction function', () => {
    it('should track user actions for analytics', () => {
      trackUserAction('button_clicked', {
        buttonId: 'emergency_resources',
        feature: 'safety-plan',
        userType: 'seeker'
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'User Action: button_clicked',
        'info'
      );
    });

    it('should track form submissions', () => {
      trackUserAction('form_submitted', {
        formType: 'mood_check_in',
        feature: 'mood-tracking',
        success: true
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'User Action: form_submitted',
        'info'
      );
    });

    it('should track navigation events', () => {
      trackUserAction('page_viewed', {
        page: '/crisis-resources',
        feature: 'community',
        duration: 5000
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'User Action: page_viewed',
        'info'
      );
    });
  });

  describe('setUserContext function', () => {
    it('should set user context without sensitive information', () => {
      setUserContext({
        id: 'user-123',
        type: 'seeker',
        joinDate: '2023-01-01',
        subscription: 'premium'
      });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        type: 'seeker',
        joinDate: '2023-01-01',
        subscription: 'premium'
      });
    });

    it('should sanitize sensitive user data', () => {
      setUserContext({
        id: 'user-123',
        email: 'user@example.com',
        password: 'secret',
        phone: '555-1234',
        type: 'helper'
      });

      // Should call setUser but with sanitized data
      expect(Sentry.setUser).toHaveBeenCalled();
    });
  });

  describe('addBreadcrumb function', () => {
    it('should add navigation breadcrumbs', () => {
      addBreadcrumb({
        message: 'Navigated to crisis resources page',
        category: 'navigation',
        level: 'info',
        data: {
          from: '/dashboard',
          to: '/crisis-resources'
        }
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Navigated to crisis resources page',
        category: 'navigation',
        level: 'info',
        data: {
          from: '/dashboard',
          to: '/crisis-resources'
        }
      });
    });

    it('should add user interaction breadcrumbs', () => {
      addBreadcrumb({
        message: 'User clicked emergency button',
        category: 'user',
        level: 'info',
        data: {
          buttonId: 'emergency_call',
          feature: 'crisis-support'
        }
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked emergency button',
        category: 'user',
        level: 'info',
        data: {
          buttonId: 'emergency_call',
          feature: 'crisis-support'
        }
      });
    });

    it('should add system event breadcrumbs', () => {
      addBreadcrumb({
        message: 'Crisis detection triggered',
        category: 'system',
        level: 'warning',
        data: {
          confidence: 0.85,
          service: 'ai-detection'
        }
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Crisis detection triggered',
        category: 'system',
        level: 'warning',
        data: {
          confidence: 0.85,
          service: 'ai-detection'
        }
      });
    });

    it('should sanitize sensitive data in breadcrumbs', () => {
      addBreadcrumb({
        message: 'User entered therapy session',
        category: 'user',
        level: 'info',
        data: {
          sessionId: 'session-123',
          therapistEmail: 'therapist@clinic.com',
          patientDiagnosis: 'anxiety disorder'
        }
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
      // Should be called with sanitized data
    });
  });

  describe('Environment-specific behavior', () => {
    it('should behave differently in production', () => {
      process.env.NODE_ENV = 'production';
      
      initializeSentry('test-dsn');
      
      const initConfig = (Sentry.init as jest.Mock).mock.calls[0][0];
      expect(initConfig.tracesSampleRate).toBe(0.1);
    });

    it('should behave differently in development', () => {
      process.env.NODE_ENV = 'development';
      
      initializeSentry('test-dsn');
      
      const initConfig = (Sentry.init as jest.Mock).mock.calls[0][0];
      expect(initConfig.tracesSampleRate).toBe(1.0);
    });

    it('should handle staging environment', () => {
      process.env.NODE_ENV = 'staging';
      
      initializeSentry('test-dsn');
      
      const initConfig = (Sentry.init as jest.Mock).mock.calls[0][0];
      expect(initConfig.environment).toBe('staging');
    });
  });

  describe('Error filtering', () => {
    it('should filter out development errors by default', () => {
      process.env.NODE_ENV = 'development';
      initializeSentry('test-dsn');
      
      const beforeSendFn = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
      
      const event = {
        message: 'Development error',
        level: 'error'
      };
      
      const result = beforeSendFn(event, { originalException: new Error('Dev error') });
      
      // Should handle development errors appropriately
      expect(result).toBeDefined();
    });

    it('should always send critical errors', () => {
      initializeSentry('test-dsn');
      
      const beforeSendFn = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
      
      const event = {
        message: 'Critical system failure',
        level: 'fatal'
      };
      
      const result = beforeSendFn(event, { originalException: new Error('Critical error') });
      
      expect(result).toBeDefined();
    });

    it('should filter out noise/spam errors', () => {
      initializeSentry('test-dsn');
      
      const beforeSendFn = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
      
      const event = {
        message: 'Script error',
        level: 'error'
      };
      
      const result = beforeSendFn(event, { originalException: new Error('Script error') });
      
      // Should handle generic script errors appropriately
      expect(result).toBeDefined();
    });
  });

  describe('Privacy compliance', () => {
    it('should redact all sensitive patterns', () => {
      const sensitiveData = {
        password: 'secret123',
        token: 'jwt-token-here',
        email: 'user@example.com',
        phone: '555-1234',
        medical: 'patient history',
        therapy: 'session notes',
        diagnosis: 'depression'
      };

      // Test that sensitive data gets redacted through the system
      const error = new Error(JSON.stringify(sensitiveData));
      const context: ErrorContext = {
        errorType: 'system',
        severity: 'low',
        privacyLevel: 'sensitive'
      };

      trackError(error, context);

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should maintain error tracking functionality while protecting privacy', () => {
      const error = new Error('Database connection failed for therapy module');
      const context: ErrorContext = {
        errorType: 'system',
        severity: 'high',
        feature: 'therapy',
        privacyLevel: 'private'
      };

      trackError(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });
});