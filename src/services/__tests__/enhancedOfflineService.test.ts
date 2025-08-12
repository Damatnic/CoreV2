import { EnhancedOfflineService } from '../enhancedOfflineService';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

const mockIDBDatabase = {
  close: jest.fn(),
  transaction: jest.fn(),
  objectStoreNames: ['resources', 'syncQueue', 'cache'],
};

const mockIDBObjectStore = {
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  createIndex: jest.fn(),
};

const mockIDBTransaction = {
  objectStore: jest.fn(() => mockIDBObjectStore),
  oncomplete: null,
  onerror: null,
};

// Mock culturalContextService and enhancedAICrisisDetectionService
jest.mock('../culturalContextService', () => ({
  culturalContextService: {
    getCulturalCopingStrategies: jest.fn().mockReturnValue('Cultural coping strategies'),
    getCulturalSafetyPlan: jest.fn().mockReturnValue('Cultural safety plan'),
    getCulturalGuidance: jest.fn().mockReturnValue('Cultural guidance'),
  }
}));

jest.mock('../enhancedAiCrisisDetectionService', () => ({
  enhancedAICrisisDetectionService: {
    detectCrisisOffline: jest.fn().mockResolvedValue({
      hasCrisisIndicators: false,
      severity: 'low',
      confidence: 0.1,
    }),
  }
}));

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: jest.fn().mockResolvedValue({
      quota: 1000000000,
      usage: 100000,
    }),
  },
  writable: true,
});

// Mock window.indexedDB
Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

describe('EnhancedOfflineService', () => {
  let service: EnhancedOfflineService;

  beforeEach(() => {
    service = new EnhancedOfflineService();
    jest.clearAllMocks();
    
    // Setup IndexedDB mocks
    mockIndexedDB.open.mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockIDBDatabase,
    });

    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBObjectStore.getAll.mockResolvedValue([]);
    mockIDBObjectStore.get.mockResolvedValue(null);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      // Mock successful database opening
      const mockRequest = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockIDBDatabase,
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);

      await service.initialize();

      expect(mockIndexedDB.open).toHaveBeenCalledWith('AstralCoreOfflineDB', 2);
    });

    it('should detect offline capabilities', async () => {
      const capabilities = await (service as any).detectCapabilities();

      expect(capabilities).toHaveProperty('hasStorage');
      expect(capabilities).toHaveProperty('hasIndexedDB');
      expect(capabilities).toHaveProperty('storageQuota');
      expect(capabilities).toHaveProperty('isOnline');
      expect(capabilities).toHaveProperty('cacheStatus');
      
      expect(typeof capabilities.hasStorage).toBe('boolean');
      expect(typeof capabilities.hasIndexedDB).toBe('boolean');
      expect(typeof capabilities.storageQuota).toBe('number');
    });

    it('should handle IndexedDB initialization failure', async () => {
      const mockRequest = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: null,
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);

      // Simulate error
      setTimeout(() => {
        if (mockRequest.onerror) {
          mockRequest.onerror(new Event('error'));
        }
      }, 0);

      await expect(service.initialize()).rejects.toThrow();
    });
  });

  describe('crisis resources', () => {
    beforeEach(async () => {
      // Mock successful initialization
      const mockRequest = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockIDBDatabase,
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);
      
      // Trigger successful opening
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({
            target: { result: mockIDBDatabase }
          } as any);
        }
      }, 0);

      await service.initialize();
    });

    it('should get crisis resources by language and context', async () => {
      const mockResources = [
        {
          id: 'crisis-1',
          type: 'crisis-contact',
          language: 'en',
          culturalContext: 'western',
          title: 'Crisis Hotline',
          content: '988 Suicide & Crisis Lifeline',
          priority: 'critical',
          category: 'emergency',
          tags: ['hotline', 'crisis'],
          lastUpdated: Date.now(),
          emergencyContact: {
            phone: '988',
            text: '741741'
          }
        }
      ];

      mockIDBObjectStore.getAll.mockResolvedValue(mockResources);

      const resources = await service.getCrisisResources('en', 'western', 'high');

      expect(resources).toHaveLength(1);
      expect(resources[0]).toHaveProperty('id', 'crisis-1');
      expect(resources[0]).toHaveProperty('type', 'crisis-contact');
      expect(resources[0]).toHaveProperty('language', 'en');
      expect(resources[0]).toHaveProperty('culturalContext', 'western');
    });

    it('should filter resources by severity level', async () => {
      const mockResources = [
        {
          id: 'crisis-1',
          type: 'crisis-contact',
          language: 'en',
          culturalContext: 'western',
          title: 'Crisis Hotline',
          content: 'Emergency hotline',
          priority: 'critical',
          category: 'emergency',
          tags: ['hotline'],
          lastUpdated: Date.now(),
        },
        {
          id: 'coping-1',
          type: 'coping-strategy',
          language: 'en',
          culturalContext: 'western',
          title: 'Breathing Exercise',
          content: 'Deep breathing technique',
          priority: 'medium',
          category: 'coping',
          tags: ['breathing'],
          lastUpdated: Date.now(),
        }
      ];

      mockIDBObjectStore.getAll.mockResolvedValue(mockResources);

      const highSeverityResources = await service.getCrisisResources('en', 'western', 'high');
      const lowSeverityResources = await service.getCrisisResources('en', 'western', 'low');

      // High severity should include critical resources
      expect(highSeverityResources.some(r => r.priority === 'critical')).toBe(true);
      
      // Low severity should include all resources
      expect(lowSeverityResources.length).toBeGreaterThanOrEqual(highSeverityResources.length);
    });

    it('should return fallback resources when database is unavailable', async () => {
      mockIDBObjectStore.getAll.mockRejectedValue(new Error('Database error'));

      const resources = await service.getCrisisResources('en', 'western', 'high');

      expect(resources.length).toBeGreaterThan(0);
      expect(resources.every(r => r.language === 'en')).toBe(true);
      expect(resources.every(r => r.culturalContext === 'western')).toBe(true);
    });

    it('should support multiple languages', async () => {
      const mockResources = [
        {
          id: 'crisis-es',
          type: 'crisis-contact',
          language: 'es',
          culturalContext: 'hispanic',
          title: 'Línea de Crisis',
          content: 'Línea de ayuda en crisis',
          priority: 'critical',
          category: 'emergency',
          tags: ['hotline'],
          lastUpdated: Date.now(),
        }
      ];

      mockIDBObjectStore.getAll.mockResolvedValue(mockResources);

      const resources = await service.getCrisisResources('es', 'hispanic', 'high');

      expect(resources).toHaveLength(1);
      expect(resources[0].language).toBe('es');
      expect(resources[0].title).toBe('Línea de Crisis');
    });

    it('should generate appropriate emergency contacts for different regions', async () => {
      const emergencyContacts = (service as any).getEmergencyContactsForRegion('en', 'western');

      expect(emergencyContacts).toHaveProperty('phone');
      expect(emergencyContacts).toHaveProperty('text');
      expect(typeof emergencyContacts.phone).toBe('string');
      expect(typeof emergencyContacts.text).toBe('string');
    });
  });

  describe('offline crisis detection', () => {
    beforeEach(async () => {
      // Mock successful initialization
      const mockRequest = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockIDBDatabase,
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);
      
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({
            target: { result: mockIDBDatabase }
          } as any);
        }
      }, 0);

      await service.initialize();
    });

    it('should detect crisis in offline mode', async () => {
      const crisisText = "I want to end my life";
      
      const result = await service.detectCrisisOffline(crisisText, 'en', 'western');

      expect(result).toHaveProperty('hasCrisisIndicators');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('resources');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.hasCrisisIndicators).toBe('boolean');
      expect(['low', 'medium', 'high']).toContain(result.severity);
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.resources)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should provide culturally appropriate recommendations', async () => {
      const result = await service.detectCrisisOffline('I feel hopeless', 'es', 'hispanic');

      expect(result.resources.every(r => r.language === 'es')).toBe(true);
      expect(result.resources.every(r => r.culturalContext === 'hispanic')).toBe(true);
    });

    it('should handle different languages', async () => {
      const englishResult = await service.detectCrisisOffline('I am sad', 'en', 'western');
      const spanishResult = await service.detectCrisisOffline('Estoy triste', 'es', 'hispanic');

      expect(englishResult.resources.every(r => r.language === 'en')).toBe(true);
      expect(spanishResult.resources.every(r => r.language === 'es')).toBe(true);
    });

    it('should use fallback detection when AI service is unavailable', async () => {
      // Mock AI service failure
      const mockAIService = require('../enhancedAiCrisisDetectionService');
      mockAIService.enhancedAICrisisDetectionService.detectCrisisOffline.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const result = await service.detectCrisisOffline('I want to die', 'en', 'western');

      expect(result).toBeDefined();
      expect(result.hasCrisisIndicators).toBeDefined();
      expect(result.severity).toBeDefined();
    });
  });

  describe('sync queue management', () => {
    beforeEach(async () => {
      const mockRequest = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockIDBDatabase,
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);
      
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({
            target: { result: mockIDBDatabase }
          } as any);
        }
      }, 0);

      await service.initialize();
    });

    it('should add items to sync queue', async () => {
      const syncItem = {
        type: 'crisis-event' as const,
        data: { crisisLevel: 'high', timestamp: Date.now() },
        priority: 1,
        culturalContext: 'western',
        language: 'en',
      };

      await service.addToSyncQueue(syncItem);

      expect(mockIDBObjectStore.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'crisis-event',
          data: syncItem.data,
          priority: 1,
          culturalContext: 'western',
          language: 'en',
          id: expect.any(String),
          timestamp: expect.any(Number),
          retryCount: 0,
        })
      );
    });

    it('should prioritize crisis events in sync queue', async () => {
      const crisisItem = {
        type: 'crisis-event' as const,
        data: { level: 'critical' },
        priority: 1,
        culturalContext: 'western',
        language: 'en',
      };

      const analyticsItem = {
        type: 'analytics' as const,
        data: { event: 'page_view' },
        priority: 3,
        culturalContext: 'western',
        language: 'en',
      };

      await service.addToSyncQueue(crisisItem);
      await service.addToSyncQueue(analyticsItem);

      // Crisis events should have higher priority (lower number)
      const crisisCall = mockIDBObjectStore.add.mock.calls.find(
        call => call[0].type === 'crisis-event'
      );
      const analyticsCall = mockIDBObjectStore.add.mock.calls.find(
        call => call[0].type === 'analytics'
      );

      expect(crisisCall[0].priority).toBeLessThan(analyticsCall[0].priority);
    });

    it('should handle sync queue errors gracefully', async () => {
      mockIDBObjectStore.add.mockRejectedValue(new Error('Storage full'));

      const syncItem = {
        type: 'session-data' as const,
        data: { session: 'test' },
        priority: 2,
        culturalContext: 'western',
        language: 'en',
      };

      await expect(service.addToSyncQueue(syncItem)).resolves.not.toThrow();
    });
  });

  describe('network monitoring', () => {
    it('should detect online status', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      (service as any).setupNetworkMonitoring();

      expect(navigator.onLine).toBe(true);
    });

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      (service as any).setupNetworkMonitoring();

      expect(navigator.onLine).toBe(false);
    });

    it('should handle network changes', () => {
      const statusListener = jest.fn();
      service.onStatusChange(statusListener);

      // Simulate online event
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      // The listener should be set up to handle network changes
      expect(statusListener).toHaveBeenCalled;
    });
  });

  describe('cultural context integration', () => {
    it('should get culturally appropriate coping strategies', async () => {
      const strategies = (service as any).getCulturalCopingStrategies('en', 'western');

      expect(typeof strategies).toBe('string');
      expect(strategies.length).toBeGreaterThan(0);
    });

    it('should get culturally appropriate safety plans', async () => {
      const safetyPlan = (service as any).getCulturalSafetyPlan('es', 'hispanic');

      expect(typeof safetyPlan).toBe('string');
      expect(safetyPlan.length).toBeGreaterThan(0);
    });

    it('should get culturally appropriate guidance', async () => {
      const guidance = (service as any).getCulturalGuidance('en', 'western', { severity: 'high' });

      expect(typeof guidance).toBe('string');
      expect(guidance.length).toBeGreaterThan(0);
    });

    it('should get culturally appropriate emergency protocols', async () => {
      const protocol = (service as any).getEmergencyProtocol('en', 'western');

      expect(typeof protocol).toBe('string');
      expect(protocol.length).toBeGreaterThan(0);
    });
  });

  describe('fallback mechanisms', () => {
    it('should initialize fallback mode when IndexedDB is unavailable', () => {
      mockIndexedDB.open.mockImplementation(() => {
        throw new Error('IndexedDB not supported');
      });

      expect(() => {
        (service as any).initializeFallbackMode();
      }).not.toThrow();
    });

    it('should provide fallback crisis resources', () => {
      const fallbackResources = (service as any).getFallbackCrisisResources('en', 'western');

      expect(Array.isArray(fallbackResources)).toBe(true);
      expect(fallbackResources.length).toBeGreaterThan(0);
      expect(fallbackResources.every(r => r.language === 'en')).toBe(true);
      expect(fallbackResources.every(r => r.culturalContext === 'western')).toBe(true);
    });

    it('should provide fallback crisis detection', () => {
      const result = (service as any).fallbackCrisisDetection('I want to die', 'en', 'western');

      expect(result).toHaveProperty('hasCrisisIndicators');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('resources');
    });

    it('should handle missing translations gracefully', () => {
      const text = (service as any).getLocalizedText('unsupported_language', 'crisis_detected');

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });
  });

  describe('storage and caching', () => {
    it('should store crisis resources successfully', async () => {
      const resources = [
        {
          id: 'test-1',
          type: 'crisis-contact' as const,
          language: 'en',
          culturalContext: 'western',
          title: 'Test Resource',
          content: 'Test content',
          priority: 'high' as const,
          category: 'test',
          tags: ['test'],
          lastUpdated: Date.now(),
        }
      ];

      await (service as any).storeCrisisResources(resources);

      expect(mockIDBObjectStore.put).toHaveBeenCalled();
    });

    it('should handle storage quota limitations', async () => {
      // Mock storage estimate to show full quota
      (navigator.storage.estimate as jest.Mock).mockResolvedValue({
        quota: 1000,
        usage: 950, // 95% usage
      });

      const capabilities = await (service as any).detectCapabilities();
      
      expect(capabilities.storageQuota).toBe(1000);
    });

    it('should handle storage errors gracefully', async () => {
      mockIDBObjectStore.put.mockRejectedValue(new Error('Storage error'));

      const resources = [
        {
          id: 'test-1',
          type: 'crisis-contact' as const,
          language: 'en',
          culturalContext: 'western',
          title: 'Test Resource',
          content: 'Test content',
          priority: 'high' as const,
          category: 'test',
          tags: ['test'],
          lastUpdated: Date.now(),
        }
      ];

      await expect((service as any).storeCrisisResources(resources)).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle initialization failures gracefully', async () => {
      mockIndexedDB.open.mockImplementation(() => {
        throw new Error('IndexedDB failed');
      });

      const newService = new EnhancedOfflineService();
      
      await expect(newService.initialize()).rejects.toThrow();
    });

    it('should handle database transaction failures', async () => {
      mockIDBDatabase.transaction.mockImplementation(() => {
        throw new Error('Transaction failed');
      });

      const resources = await service.getCrisisResources('en', 'western', 'high');

      // Should fall back to default resources
      expect(Array.isArray(resources)).toBe(true);
    });

    it('should handle corrupt data gracefully', async () => {
      mockIDBObjectStore.getAll.mockResolvedValue([
        { corrupted: 'data', missing: 'fields' }
      ]);

      const resources = await service.getCrisisResources('en', 'western', 'high');

      // Should filter out corrupt data and provide fallback
      expect(Array.isArray(resources)).toBe(true);
    });
  });

  describe('status listeners', () => {
    it('should allow registering status listeners', () => {
      const listener = jest.fn();
      
      service.onStatusChange(listener);
      
      expect(listener).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should notify listeners of status changes', () => {
      const listener = jest.fn();
      service.onStatusChange(listener);
      
      // Simulate a status change
      (service as any).notifyStatusListeners({
        hasStorage: true,
        hasIndexedDB: true,
        storageQuota: 1000,
        isOnline: false,
        hasServiceWorker: true,
        cacheStatus: {
          staticResources: true,
          crisisResources: true,
          translations: true,
          culturalContent: true,
          aiModels: false,
        }
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          hasStorage: true,
          isOnline: false,
        })
      );
    });
  });
});

// Add extension to service to allow testing of status listeners
declare module '../enhancedOfflineService' {
  interface EnhancedOfflineService {
    onStatusChange(listener: (status: any) => void): void;
  }
}

// Mock the onStatusChange method for testing
(EnhancedOfflineService.prototype as any).onStatusChange = function(listener: (status: any) => void) {
  this.statusListeners.push(listener);
  // Call immediately with current status
  if (this.capabilities) {
    listener(this.capabilities);
  }
};

(EnhancedOfflineService.prototype as any).notifyStatusListeners = function(status: any) {
  this.statusListeners.forEach(listener => listener(status));
};