/**
 * @jest-environment jsdom
 */

import { getAstralTetherService } from '../astralTetherService';
import type {
  TetherRequest,
  TetherSession,
  TetherSettings,
  TetherProfile
} from '../astralTetherService';

// Mock dependencies
const mockWebSocketService = {
  subscribe: jest.fn(),
  send: jest.fn(),
  unsubscribe: jest.fn(),
};

const mockNotificationService = {
  addToast: jest.fn(),
};

const mockSecureStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('../webSocketService', () => ({
  getWebSocketService: () => mockWebSocketService,
}));

jest.mock('../notificationService', () => ({
  notificationService: mockNotificationService,
}));

jest.mock('../secureStorageService', () => ({
  getSecureStorage: () => mockSecureStorage,
}));

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: jest.fn(),
  },
});

// Mock network status
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('AstralTetherService', () => {
  let tetherService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset storage mocks
    mockSecureStorage.getItem.mockResolvedValue(null);
    mockSecureStorage.setItem.mockResolvedValue(undefined);
    
    // Reset navigator mocks
    (navigator.vibrate as jest.Mock).mockReturnValue(true);
    (navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      });
    });

    tetherService = getAstralTetherService();
  });

  afterEach(() => {
    if (tetherService && typeof tetherService.destroy === 'function') {
      tetherService.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize service with default settings', () => {
      expect(tetherService).toBeDefined();
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('tether-request', expect.any(Function));
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('tether-response', expect.any(Function));
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('tether-pressure', expect.any(Function));
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('tether-heartbeat', expect.any(Function));
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('tether-breathing', expect.any(Function));
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('tether-end', expect.any(Function));
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith('tether-emergency', expect.any(Function));
    });

    test('should load user settings from storage', async () => {
      const mockSettings: TetherSettings = {
        hapticEnabled: true,
        hapticIntensity: 0.8,
        breathingGuideEnabled: true,
        breathingPattern: '4-7-8',
        pressureShareEnabled: true,
        emergencyContacts: ['contact1'],
        professionalHandoffEnabled: true,
        privacyLevel: 'friends',
        autoAcceptFromCircle: false,
      };

      mockSecureStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockSettings));
      
      const newService = getAstralTetherService();
      
      // Allow time for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const userSettings = newService.getUserSettings();
      expect(userSettings).toBeDefined();
    });

    test('should create default profile if none exists', async () => {
      mockSecureStorage.getItem.mockResolvedValue(null);
      
      getAstralTetherService();
      
      // Allow time for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSecureStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    test('should register and trigger event handlers', () => {
      const mockHandler = jest.fn();
      
      tetherService.on('test-event', mockHandler);
      tetherService.emit('test-event', { data: 'test' });
      
      expect(mockHandler).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should remove event handlers', () => {
      const mockHandler = jest.fn();
      
      tetherService.on('test-event', mockHandler);
      tetherService.off('test-event', mockHandler);
      tetherService.emit('test-event', { data: 'test' });
      
      expect(mockHandler).not.toHaveBeenCalled();
    });

    test('should remove all listeners', () => {
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();
      
      tetherService.on('event1', mockHandler1);
      tetherService.on('event2', mockHandler2);
      
      tetherService.removeAllListeners();
      
      tetherService.emit('event1', {});
      tetherService.emit('event2', {});
      
      expect(mockHandler1).not.toHaveBeenCalled();
      expect(mockHandler2).not.toHaveBeenCalled();
    });

    test('should handle errors in event handlers gracefully', () => {
      const mockHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      tetherService.on('test-event', mockHandler);
      
      expect(() => {
        tetherService.emit('test-event', {});
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Tether Requests', () => {
    test('should send tether request successfully', async () => {
      const request: Omit<TetherRequest, 'id' | 'timestamp' | 'expiresAt'> = {
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'I need support',
        urgency: 'medium',
        tetherType: 'presence',
        preferredDuration: 30,
      };

      const requestId = await tetherService.sendTetherRequest(request);
      
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      expect(requestId).toMatch(/^tether-/);
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-request', expect.objectContaining({
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'I need support',
        urgency: 'medium',
        tetherType: 'presence',
      }));
      expect(mockNotificationService.addToast).toHaveBeenCalled();
    });

    test('should handle anonymous tether requests', async () => {
      const request: Omit<TetherRequest, 'id' | 'timestamp' | 'expiresAt'> = {
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'Anonymous support needed',
        urgency: 'high',
        tetherType: 'emergency',
        isAnonymous: true,
      };

      await tetherService.sendTetherRequest(request);
      
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-request', expect.objectContaining({
        fromUserId: expect.stringMatching(/^anon-/),
        anonymousAlias: expect.any(String),
      }));
    });

    test('should queue requests when offline', async () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const request: Omit<TetherRequest, 'id' | 'timestamp' | 'expiresAt'> = {
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'Offline request',
        urgency: 'low',
        tetherType: 'breathing',
      };

      const requestId = await tetherService.sendTetherRequest(request);
      
      expect(requestId).toBeDefined();
      expect(mockWebSocketService.send).not.toHaveBeenCalled();
      expect(mockNotificationService.addToast).toHaveBeenCalledWith(
        expect.stringContaining('queued'),
        'info'
      );
    });

    test('should set appropriate expiration times based on urgency', async () => {
      const criticalRequest: Omit<TetherRequest, 'id' | 'timestamp' | 'expiresAt'> = {
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'Critical help needed',
        urgency: 'critical',
        tetherType: 'emergency',
      };

      await tetherService.sendTetherRequest(criticalRequest);
      
      const sentRequest = mockWebSocketService.send.mock.calls[0][1];
      const expirationTime = sentRequest.expiresAt - sentRequest.timestamp;
      
      // Critical requests should expire in 5 minutes (5 * 60 * 1000 = 300000ms)
      expect(expirationTime).toBe(300000);
    });
  });

  describe('Tether Sessions', () => {
    test('should respond to tether request and create session', async () => {
      const mockRequest: TetherRequest = {
        id: 'request-123',
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'Need support',
        urgency: 'medium',
        timestamp: Date.now(),
        expiresAt: Date.now() + 1800000,
        tetherType: 'presence',
      };

      // Simulate receiving a request
      tetherService.handleTetherRequest(mockRequest);

      const sessionId = await tetherService.respondToTetherRequest('request-123', true);
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-response', {
        requestId: 'request-123',
        accepted: true,
        sessionId,
      });
    });

    test('should decline tether request', async () => {
      const mockRequest: TetherRequest = {
        id: 'request-456',
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'Need support',
        urgency: 'low',
        timestamp: Date.now(),
        expiresAt: Date.now() + 1800000,
        tetherType: 'conversation',
      };

      tetherService.handleTetherRequest(mockRequest);

      const sessionId = await tetherService.respondToTetherRequest('request-456', false);
      
      expect(sessionId).toBeNull();
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-response', {
        requestId: 'request-456',
        accepted: false,
      });
    });

    test('should end tether session properly', async () => {
      // Create a mock session
      const mockSession: TetherSession = {
        id: 'session-789',
        participants: ['user1', 'user2'],
        startTime: Date.now() - 10000,
        status: 'active',
        tetherType: 'breathing',
        hapticSync: true,
        breathingSync: true,
        pressureSensitivity: 0.5,
        settings: {
          hapticEnabled: true,
          hapticIntensity: 0.7,
          breathingGuideEnabled: true,
          breathingPattern: 'box',
          pressureShareEnabled: true,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      // Simulate active session
      tetherService.activeSessions.set('session-789', mockSession);

      await tetherService.endTetherSession('session-789');
      
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-end', expect.objectContaining({
        sessionId: 'session-789',
        endTime: expect.any(Number),
        metrics: expect.any(Object),
      }));
    });
  });

  describe('Breathing Synchronization', () => {
    test('should start breathing sync with box pattern', async () => {
      const mockSession: TetherSession = {
        id: 'session-breathing',
        participants: ['user1', 'user2'],
        startTime: Date.now(),
        status: 'active',
        tetherType: 'breathing',
        hapticSync: false,
        breathingSync: true,
        pressureSensitivity: 0.5,
        settings: {
          breathingPattern: 'box',
          hapticEnabled: false,
          hapticIntensity: 0.5,
          breathingGuideEnabled: true,
          pressureShareEnabled: false,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      tetherService.activeSessions.set('session-breathing', mockSession);
      
      const mockHandler = jest.fn();
      tetherService.on('breathing-phase', mockHandler);

      await tetherService.startBreathingSync('session-breathing');
      
      // Allow time for first breathing phase
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        sessionId: 'session-breathing',
        phase: 'inhale',
        duration: 4000,
      }));
    });

    test('should use different breathing patterns', async () => {
      const mockSession: TetherSession = {
        id: 'session-478',
        participants: ['user1', 'user2'],
        startTime: Date.now(),
        status: 'active',
        tetherType: 'breathing',
        hapticSync: false,
        breathingSync: true,
        pressureSensitivity: 0.5,
        settings: {
          breathingPattern: '4-7-8',
          hapticEnabled: false,
          hapticIntensity: 0.5,
          breathingGuideEnabled: true,
          pressureShareEnabled: false,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      tetherService.activeSessions.set('session-478', mockSession);
      
      const mockHandler = jest.fn();
      tetherService.on('breathing-phase', mockHandler);

      await tetherService.startBreathingSync('session-478');
      
      // Allow time for breathing phase
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        sessionId: 'session-478',
        phase: 'inhale',
        duration: 4000, // 4 seconds for 4-7-8 pattern
      }));
    });
  });

  describe('Pressure Updates', () => {
    test('should send pressure updates with haptic feedback', () => {
      const mockSession: TetherSession = {
        id: 'session-pressure',
        participants: ['user1', 'user2'],
        startTime: Date.now(),
        status: 'active',
        tetherType: 'presence',
        hapticSync: true,
        breathingSync: false,
        pressureSensitivity: 0.5,
        settings: {
          hapticEnabled: true,
          hapticIntensity: 0.8,
          breathingGuideEnabled: false,
          breathingPattern: 'box',
          pressureShareEnabled: true,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      tetherService.activeSessions.set('session-pressure', mockSession);

      tetherService.sendPressureUpdate('session-pressure', 0.7);
      
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-pressure', {
        sessionId: 'session-pressure',
        pressure: 0.7,
        timestamp: expect.any(Number),
      });
      
      expect(navigator.vibrate).toHaveBeenCalledWith(56); // 0.7 * 0.8 * 100 = 56
    });

    test('should normalize pressure values', () => {
      const mockSession: TetherSession = {
        id: 'session-normalize',
        participants: ['user1', 'user2'],
        startTime: Date.now(),
        status: 'active',
        tetherType: 'presence',
        hapticSync: false,
        breathingSync: false,
        pressureSensitivity: 0.5,
        settings: {
          hapticEnabled: false,
          hapticIntensity: 0.5,
          breathingGuideEnabled: false,
          breathingPattern: 'box',
          pressureShareEnabled: true,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      tetherService.activeSessions.set('session-normalize', mockSession);

      // Test values outside 0-1 range
      tetherService.sendPressureUpdate('session-normalize', 1.5);
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-pressure', expect.objectContaining({
        pressure: 1.0,
      }));

      tetherService.sendPressureUpdate('session-normalize', -0.3);
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-pressure', expect.objectContaining({
        pressure: 0.0,
      }));
    });
  });

  describe('Crisis Features', () => {
    test('should trigger panic mode', async () => {
      const mockProfile: TetherProfile = {
        userId: 'user1',
        displayName: 'Test User',
        isAvailable: true,
        availabilityStatus: 'available',
        friendCode: 'TEST-1234',
        preferredTetherTypes: ['emergency'],
        responseTime: 0,
        successfulSessions: 0,
        rating: 0,
        emergencyContact: true,
        professionalSupport: false,
        languages: ['en'],
        timezone: 'UTC',
        availability: {
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: '00:00',
          endTime: '23:59',
        },
        trustedConnections: ['emergency-contact-1'],
      };

      tetherService.userProfiles.set('default-user', mockProfile);

      await tetherService.triggerPanicMode();
      
      expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200, 100, 200]);
      expect(mockNotificationService.addToast).toHaveBeenCalledWith(
        'Emergency tether sent. Help is on the way.',
        'error'
      );
    });

    test('should escalate to emergency services if no trusted connections', async () => {
      const mockProfile: TetherProfile = {
        userId: 'user1',
        displayName: 'Test User',
        isAvailable: true,
        availabilityStatus: 'available',
        friendCode: 'TEST-5678',
        preferredTetherTypes: ['emergency'],
        responseTime: 0,
        successfulSessions: 0,
        rating: 0,
        emergencyContact: true,
        professionalSupport: false,
        languages: ['en'],
        timezone: 'UTC',
        availability: {
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: '00:00',
          endTime: '23:59',
        },
        trustedConnections: [], // No trusted connections
      };

      tetherService.userProfiles.set('default-user', mockProfile);

      // Mock window.location.href
      delete (window as unknown).location;
      (window as unknown).location = { href: '' };

      await tetherService.triggerPanicMode();
      
      expect(window.location.href).toBe('tel:911');
    });

    test('should request emergency escalation', async () => {
      const mockSession: TetherSession = {
        id: 'session-emergency',
        participants: ['user1', 'user2'],
        startTime: Date.now(),
        status: 'active',
        tetherType: 'emergency',
        hapticSync: false,
        breathingSync: false,
        pressureSensitivity: 0.5,
        settings: {
          hapticEnabled: false,
          hapticIntensity: 0.5,
          breathingGuideEnabled: false,
          breathingPattern: 'box',
          pressureShareEnabled: false,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      tetherService.activeSessions.set('session-emergency', mockSession);

      await tetherService.requestEmergencyEscalation('session-emergency', 'professional');
      
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-emergency', expect.objectContaining({
        sessionId: 'session-emergency',
        escalationType: 'professional',
        urgency: 'critical',
      }));
    });
  });

  describe('Friend Code System', () => {
    test('should generate valid friend codes', () => {
      // Test multiple generations to ensure uniqueness
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        const code = tetherService.generateFriendCode();
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
        expect(code).toHaveLength(9); // 4 chars + dash + 4 chars
        codes.add(code);
      }
      // Should have generated 100 unique codes
      expect(codes.size).toBe(100);
    });

    test('should add trusted connection with valid friend code', async () => {
      const mockProfile: TetherProfile = {
        userId: 'current-user',
        displayName: 'Current User',
        isAvailable: true,
        availabilityStatus: 'available',
        friendCode: 'CURR-USER',
        preferredTetherTypes: ['presence'],
        responseTime: 0,
        successfulSessions: 0,
        rating: 0,
        emergencyContact: false,
        professionalSupport: false,
        languages: ['en'],
        timezone: 'UTC',
        availability: {
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: '00:00',
          endTime: '23:59',
        },
        trustedConnections: [],
      };

      const friendProfile: TetherProfile = {
        userId: 'friend-user',
        displayName: 'Friend User',
        isAvailable: true,
        availabilityStatus: 'available',
        friendCode: 'FREN-CODE',
        preferredTetherTypes: ['presence'],
        responseTime: 0,
        successfulSessions: 0,
        rating: 0,
        emergencyContact: false,
        professionalSupport: false,
        languages: ['en'],
        timezone: 'UTC',
        availability: {
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: '00:00',
          endTime: '23:59',
        },
        trustedConnections: [],
      };

      tetherService.userProfiles.set('current-user', mockProfile);
      tetherService.userProfiles.set('friend-user', friendProfile);
      tetherService.currentUserId = 'current-user';

      const result = await tetherService.addTrustedConnection('FREN-CODE');
      
      expect(result).toBe(true);
      expect(mockProfile.trustedConnections).toContain('friend-user');
    });

    test('should fail to add connection with invalid friend code', async () => {
      const mockProfile: TetherProfile = {
        userId: 'current-user',
        displayName: 'Current User',
        isAvailable: true,
        availabilityStatus: 'available',
        friendCode: 'CURR-USER',
        preferredTetherTypes: ['presence'],
        responseTime: 0,
        successfulSessions: 0,
        rating: 0,
        emergencyContact: false,
        professionalSupport: false,
        languages: ['en'],
        timezone: 'UTC',
        availability: {
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: '00:00',
          endTime: '23:59',
        },
        trustedConnections: [],
      };

      tetherService.userProfiles.set('current-user', mockProfile);
      tetherService.currentUserId = 'current-user';

      const result = await tetherService.addTrustedConnection('INVALID');
      
      expect(result).toBe(false);
    });
  });

  describe('Availability Management', () => {
    test('should update availability status', async () => {
      const mockProfile: TetherProfile = {
        userId: 'user1',
        displayName: 'Test User',
        isAvailable: true,
        availabilityStatus: 'available',
        friendCode: 'TEST-CODE',
        preferredTetherTypes: ['presence'],
        responseTime: 0,
        successfulSessions: 0,
        rating: 0,
        emergencyContact: false,
        professionalSupport: false,
        languages: ['en'],
        timezone: 'UTC',
        availability: {
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: '00:00',
          endTime: '23:59',
        },
        trustedConnections: [],
      };

      tetherService.userProfiles.set('user1', mockProfile);
      tetherService.currentUserId = 'user1';

      await tetherService.updateAvailabilityStatus('in-session');
      
      expect(mockProfile.availabilityStatus).toBe('in-session');
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-status-update', {
        userId: 'user1',
        status: 'in-session',
        timestamp: expect.any(Number),
      });
    });

    test('should check if user is available', () => {
      tetherService.activeSessions.clear();
      
      const available = tetherService.isAvailable();
      expect(available).toBe(true);

      // Simulate reaching session limit
      for (let i = 0; i < 5; i++) {
        tetherService.activeSessions.set(`session-${i}`, {} as TetherSession);
      }
      
      const notAvailable = tetherService.isAvailable();
      expect(notAvailable).toBe(false);
    });
  });

  describe('Session Management', () => {
    test('should get active session', () => {
      const mockSession: TetherSession = {
        id: 'session-123',
        participants: ['user1', 'user2'],
        startTime: Date.now(),
        status: 'active',
        tetherType: 'presence',
        hapticSync: false,
        breathingSync: false,
        pressureSensitivity: 0.5,
        settings: {
          hapticEnabled: false,
          hapticIntensity: 0.5,
          breathingGuideEnabled: false,
          breathingPattern: 'box',
          pressureShareEnabled: false,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      tetherService.activeSessions.set('session-123', mockSession);
      
      const session = tetherService.getActiveSession('session-123');
      expect(session).toBe(mockSession);
    });

    test('should get all active sessions', () => {
      const session1: TetherSession = {
        id: 'session-1',
        participants: ['user1', 'user2'],
        startTime: Date.now(),
        status: 'active',
        tetherType: 'breathing',
        hapticSync: false,
        breathingSync: true,
        pressureSensitivity: 0.5,
        settings: {
          hapticEnabled: false,
          hapticIntensity: 0.5,
          breathingGuideEnabled: true,
          breathingPattern: 'box',
          pressureShareEnabled: false,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      const session2: TetherSession = {
        id: 'session-2',
        participants: ['user3', 'user4'],
        startTime: Date.now(),
        status: 'active',
        tetherType: 'conversation',
        hapticSync: false,
        breathingSync: false,
        pressureSensitivity: 0.3,
        settings: {
          hapticEnabled: false,
          hapticIntensity: 0.5,
          breathingGuideEnabled: false,
          breathingPattern: 'box',
          pressureShareEnabled: false,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      tetherService.activeSessions.set('session-1', session1);
      tetherService.activeSessions.set('session-2', session2);
      
      const sessions = tetherService.getActiveSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions).toContain(session1);
      expect(sessions).toContain(session2);
    });

    test('should get pending requests', () => {
      const request1: TetherRequest = {
        id: 'request-1',
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'Request 1',
        urgency: 'low',
        timestamp: Date.now(),
        expiresAt: Date.now() + 1800000,
        tetherType: 'presence',
      };

      const request2: TetherRequest = {
        id: 'request-2',
        fromUserId: 'user3',
        toUserId: 'user4',
        message: 'Request 2',
        urgency: 'high',
        timestamp: Date.now(),
        expiresAt: Date.now() + 600000,
        tetherType: 'emergency',
      };

      tetherService.pendingRequests.set('request-1', request1);
      tetherService.pendingRequests.set('request-2', request2);
      
      const requests = tetherService.getPendingRequests();
      expect(requests).toHaveLength(2);
      expect(requests).toContain(request1);
      expect(requests).toContain(request2);
    });
  });

  describe('Settings Management', () => {
    test('should update user settings', async () => {
      const newSettings: Partial<TetherSettings> = {
        hapticEnabled: false,
        breathingPattern: '4-7-8',
        hapticIntensity: 0.9,
      };

      const mockHandler = jest.fn();
      tetherService.on('settings-updated', mockHandler);

      await tetherService.updateUserSettings(newSettings);
      
      const settings = tetherService.getUserSettings();
      expect(settings?.hapticEnabled).toBe(false);
      expect(settings?.breathingPattern).toBe('4-7-8');
      expect(settings?.hapticIntensity).toBe(0.9);
      expect(mockHandler).toHaveBeenCalledWith(settings);
    });
  });

  describe('Compatibility Methods', () => {
    test('should handle legacy initiateTether', async () => {
      const request = {
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'Legacy request',
        urgency: 'medium' as const,
        tetherType: 'presence' as const,
      };

      const sessionId = await tetherService.initiateTether(request);
      
      expect(typeof sessionId).toBe('string');
      expect(mockWebSocketService.send).toHaveBeenCalled();
    });

    test('should handle legacy acceptTether', async () => {
      const mockRequest: TetherRequest = {
        id: 'legacy-request',
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'Legacy accept test',
        urgency: 'low',
        timestamp: Date.now(),
        expiresAt: Date.now() + 1800000,
        tetherType: 'conversation',
      };

      tetherService.pendingRequests.set('legacy-request', mockRequest);

      const result = await tetherService.acceptTether('legacy-request', 'user2');
      
      expect(result).toBe(true);
    });

    test('should handle legacy endTether', async () => {
      const mockSession: TetherSession = {
        id: 'legacy-session',
        participants: ['user1', 'user2'],
        startTime: Date.now() - 5000,
        status: 'active',
        tetherType: 'presence',
        hapticSync: false,
        breathingSync: false,
        pressureSensitivity: 0.5,
        settings: {
          hapticEnabled: false,
          hapticIntensity: 0.5,
          breathingGuideEnabled: false,
          breathingPattern: 'box',
          pressureShareEnabled: false,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      tetherService.activeSessions.set('legacy-session', mockSession);

      await tetherService.endTether('legacy-session', 'user1');
      
      expect(mockWebSocketService.send).toHaveBeenCalledWith('tether-end', expect.objectContaining({
        sessionId: 'legacy-session',
      }));
    });
  });

  describe('Cleanup and Destruction', () => {
    test('should destroy service properly', () => {
      const mockSession: TetherSession = {
        id: 'cleanup-session',
        participants: ['user1', 'user2'],
        startTime: Date.now(),
        status: 'active',
        tetherType: 'presence',
        hapticSync: false,
        breathingSync: false,
        pressureSensitivity: 0.5,
        settings: {
          hapticEnabled: false,
          hapticIntensity: 0.5,
          breathingGuideEnabled: false,
          breathingPattern: 'box',
          pressureShareEnabled: false,
          emergencyContacts: [],
          professionalHandoffEnabled: true,
          privacyLevel: 'friends',
          autoAcceptFromCircle: false,
        },
        metrics: {
          sessionQuality: 0,
          completionRate: 0,
          averageResponseTime: 0,
          effectivenessScore: 0,
        },
      };

      tetherService.activeSessions.set('cleanup-session', mockSession);
      tetherService.on('test-event', jest.fn());

      tetherService.destroy();
      
      expect(tetherService.activeSessions.size).toBe(0);
      expect(tetherService.eventHandlers.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle WebSocket errors gracefully', async () => {
      mockWebSocketService.send.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      const request: Omit<TetherRequest, 'id' | 'timestamp' | 'expiresAt'> = {
        fromUserId: 'user1',
        toUserId: 'user2',
        message: 'Error test',
        urgency: 'low',
        tetherType: 'presence',
      };

      await expect(tetherService.sendTetherRequest(request)).rejects.toThrow();
    });

    test('should handle storage errors gracefully', async () => {
      mockSecureStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const newSettings: Partial<TetherSettings> = {
        hapticEnabled: false,
      };

      // Should not throw even if storage fails
      await tetherService.updateUserSettings(newSettings);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle geolocation errors gracefully', async () => {
      (navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation((_, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      const location = await tetherService.getCurrentLocation();
      expect(location).toBeUndefined();
    });
  });
});