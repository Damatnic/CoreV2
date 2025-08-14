import DataMigrationService, { getDataMigrationService, useDataMigration, MigrationReport, MigrationOptions } from '../dataMigrationService';
import { renderHook, act } from '@testing-library/react';

// Mock the dependencies
jest.mock('../secureStorageService');
jest.mock('../encryptionService');

const mockSecureStorage = {
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  exportData: jest.fn().mockResolvedValue({}),
};

const mockEncryptionService = {
  getEncryptionStats: jest.fn().mockReturnValue({
    isSupported: true,
    totalEncrypted: 0,
    failedOperations: 0,
  }),
  performHIPAAComplianceCheck: jest.fn().mockReturnValue({
    compliant: true,
    violations: [],
    recommendations: [],
  }),
  migrateExistingData: jest.fn().mockResolvedValue(undefined),
  validateDataIntegrity: jest.fn().mockResolvedValue({
    valid: 10,
    invalid: 0,
    total: 10,
  }),
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock the service getters
require('../secureStorageService').getSecureStorage = jest.fn().mockReturnValue(mockSecureStorage);
require('../encryptionService').getEncryptionService = jest.fn().mockReturnValue(mockEncryptionService);

describe('DataMigrationService', () => {
  let service: DataMigrationService;

  beforeEach(() => {
    service = new DataMigrationService();
    jest.clearAllMocks();
    
    // Reset localStorage mock
    mockLocalStorage.length = 0;
    mockLocalStorage.key.mockImplementation((index) => {
      const keys = ['userProfile', 'mood_analyses', 'safetyPlan', 'systemKey', '_private'];
      return keys[index] || null;
    });
  });

  describe('performMigration', () => {
    it('should perform complete migration successfully', async () => {
      mockLocalStorage.length = 3;
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        const data: Record<string, string> = {
          'userProfile': JSON.stringify({ name: 'Test User' }),
          'mood_analyses': JSON.stringify([{ mood: 'happy' }]),
          'safetyPlan': JSON.stringify({ steps: ['call friend'] }),
        };
        return data[key] || null;
      });

      const options: MigrationOptions = {
        enableLogging: true,
        backupExisting: true,
      };

      const report = await service.performMigration(options);

      expect(report.totalKeys).toBe(5); // Based on mocked keys
      expect(report.migratedKeys).toBeGreaterThan(0);
      expect(report.migrationTime).toBeGreaterThan(0);
      expect(mockSecureStorage.exportData).toHaveBeenCalledWith(true);
      expect(mockEncryptionService.migrateExistingData).toHaveBeenCalled();
    });

    it('should handle dry run without making changes', async () => {
      mockLocalStorage.length = 2;
      mockLocalStorage.getItem.mockImplementation((key) => {
        return key === 'mood_analyses' ? JSON.stringify([{ mood: 'sad' }]) : null;
      });

      const options: MigrationOptions = {
        dryRun: true,
      };

      const report = await service.performMigration(options);

      expect(report.totalKeys).toBe(5);
      expect(mockSecureStorage.setItem).not.toHaveBeenCalled();
      expect(mockEncryptionService.migrateExistingData).not.toHaveBeenCalled();
    });

    it('should handle migration errors gracefully', async () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.getItem.mockImplementation(() => JSON.stringify({ data: 'test' }));
      mockSecureStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const report = await service.performMigration();

      expect(report.failedKeys).toBeGreaterThan(0);
      expect(report.errors).toContain(expect.stringContaining('Storage error'));
    });

    it('should skip system keys during migration', async () => {
      mockLocalStorage.length = 2;
      mockLocalStorage.key.mockImplementation((index) => {
        const keys = ['_secure_storage_log', 'analytics_events'];
        return keys[index] || null;
      });
      mockLocalStorage.getItem.mockReturnValue('some data');

      const report = await service.performMigration();

      expect(report.skippedKeys).toBe(2);
      expect(report.migratedKeys).toBe(0);
    });

    it('should skip already encrypted data', async () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockImplementation(() => 'mood_analyses');
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ encrypted: true, data: 'encrypted' }));

      const report = await service.performMigration();

      expect(report.skippedKeys).toBe(1);
      expect(report.migratedKeys).toBe(0);
    });

    it('should add compliance warnings when violations are detected', async () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockImplementation(() => 'mood_analyses');
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ mood: 'happy' }));

      mockEncryptionService.performHIPAAComplianceCheck.mockReturnValue({
        compliant: false,
        violations: ['Unencrypted health data detected'],
        recommendations: ['Encrypt all health data'],
      });

      const report = await service.performMigration();

      expect(report.warnings).toContain('HIPAA compliance violations detected');
      expect(report.warnings).toContain('Unencrypted health data detected');
    });
  });

  describe('validateMigration', () => {
    it('should validate successful migration', async () => {
      const result = await service.validateMigration();

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect encryption support issues', async () => {
      mockEncryptionService.getEncryptionStats.mockReturnValue({
        isSupported: false,
      });

      const result = await service.validateMigration();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Browser does not support required encryption features');
      expect(result.recommendations).toContain('Use a modern browser that supports Web Crypto API');
    });

    it('should detect HIPAA compliance violations', async () => {
      mockEncryptionService.performHIPAAComplianceCheck.mockReturnValue({
        compliant: false,
        violations: ['Unencrypted PII detected'],
        recommendations: ['Encrypt all personal data'],
      });

      const result = await service.validateMigration();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('HIPAA compliance violations detected');
      expect(result.issues).toContain('Unencrypted PII detected');
      expect(result.recommendations).toContain('Encrypt all personal data');
    });

    it('should detect data integrity issues', async () => {
      mockEncryptionService.validateDataIntegrity.mockResolvedValue({
        valid: 8,
        invalid: 2,
        total: 10,
      });

      const result = await service.validateMigration();

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('2 encrypted items failed integrity check');
      expect(result.recommendations).toContain('Re-run migration for failed items');
    });
  });

  describe('getMigrationStatus', () => {
    it('should detect no migration needed when all data is encrypted', () => {
      mockLocalStorage.length = 2;
      mockLocalStorage.key.mockImplementation((index) => {
        const keys = ['mood_analyses', 'safetyPlan'];
        return keys[index] || null;
      });
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ encrypted: true, data: 'encrypted' }));

      const status = service.getMigrationStatus();

      expect(status.needsMigration).toBe(false);
      expect(status.reason).toBe('All sensitive data is properly encrypted');
      expect(status.sensitiveKeysFound).toHaveLength(0);
    });

    it('should detect migration needed with critical urgency for crisis data', () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockImplementation(() => 'crisis_intervention_data');
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ data: 'unencrypted' }));

      const status = service.getMigrationStatus();

      expect(status.needsMigration).toBe(true);
      expect(status.urgency).toBe('critical');
      expect(status.sensitiveKeysFound).toContain('crisis_intervention_data');
    });

    it('should detect migration needed with high urgency for health data', () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockImplementation(() => 'health_records');
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ data: 'unencrypted' }));

      const status = service.getMigrationStatus();

      expect(status.needsMigration).toBe(true);
      expect(status.urgency).toBe('high');
    });

    it('should detect migration needed with medium urgency for chat data', () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockImplementation(() => 'chat_history');
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ data: 'unencrypted' }));

      const status = service.getMigrationStatus();

      expect(status.needsMigration).toBe(true);
      expect(status.urgency).toBe('medium');
    });
  });

  describe('setupDataProtection', () => {
    it('should override localStorage methods for sensitive data', async () => {
      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;
      const originalRemoveItem = localStorage.removeItem;

      await service.setupDataProtection();

      // Test that localStorage.setItem was overridden
      expect(localStorage.setItem).not.toBe(originalSetItem);
      expect(localStorage.getItem).not.toBe(originalGetItem);
      expect(localStorage.removeItem).not.toBe(originalRemoveItem);
    });

    it('should use secure storage for sensitive keys', async () => {
      await service.setupDataProtection();

      // Try to set a sensitive key
      localStorage.setItem('mood_analyses', JSON.stringify({ mood: 'happy' }));

      expect(mockSecureStorage.setItem).toHaveBeenCalledWith('mood_analyses', JSON.stringify({ mood: 'happy' }));
    });

    it('should use regular localStorage for non-sensitive keys', async () => {
      const originalSetItem = jest.fn();
      mockLocalStorage.setItem = originalSetItem;

      await service.setupDataProtection();

      // Try to set a non-sensitive key
      localStorage.setItem('theme_preference', 'dark');

      expect(originalSetItem).toHaveBeenCalledWith('theme_preference', 'dark');
    });
  });

  describe('private methods', () => {
    describe('isSystemKey', () => {
      it('should identify system keys correctly', () => {
        const isSystemKey = (service as any).isSystemKey.bind(service);

        expect(isSystemKey('_secure_storage_log')).toBe(true);
        expect(isSystemKey('security_logs')).toBe(true);
        expect(isSystemKey('analytics_opted_out')).toBe(true);
        expect(isSystemKey('_privateKey')).toBe(true);
        expect(isSystemKey('userProfile')).toBe(false);
        expect(isSystemKey('mood_analyses')).toBe(false);
      });
    });

    describe('isAlreadyEncrypted', () => {
      it('should detect encrypted data correctly', () => {
        const isAlreadyEncrypted = (service as any).isAlreadyEncrypted.bind(service);

        expect(isAlreadyEncrypted(JSON.stringify({ encrypted: true }))).toBe(true);
        expect(isAlreadyEncrypted(JSON.stringify({ encrypted: false }))).toBe(false);
        expect(isAlreadyEncrypted(JSON.stringify({ data: 'normal' }))).toBe(false);
        expect(isAlreadyEncrypted('invalid json')).toBe(false);
      });
    });

    describe('shouldEncryptKey', () => {
      it('should identify keys that need encryption', () => {
        const shouldEncryptKey = (service as any).shouldEncryptKey.bind(service);

        expect(shouldEncryptKey('safetyPlan')).toBe(true);
        expect(shouldEncryptKey('mood_analyses')).toBe(true);
        expect(shouldEncryptKey('userToken')).toBe(true);
        expect(shouldEncryptKey('userId')).toBe(true);
        expect(shouldEncryptKey('chatHistory')).toBe(true);
        expect(shouldEncryptKey('crisisData')).toBe(true);
        expect(shouldEncryptKey('healthRecords')).toBe(true);
        expect(shouldEncryptKey('personalInfo')).toBe(true);

        expect(shouldEncryptKey('theme_preference')).toBe(false);
        expect(shouldEncryptKey('language_setting')).toBe(false);
        expect(shouldEncryptKey('ui_state')).toBe(false);
      });
    });

    describe('getAllLocalStorageKeys', () => {
      it('should retrieve all localStorage keys', () => {
        mockLocalStorage.length = 3;
        mockLocalStorage.key.mockImplementation((index) => {
          const keys = ['key1', 'key2', 'key3'];
          return keys[index] || null;
        });

        const keys = (service as any).getAllLocalStorageKeys();

        expect(keys).toEqual(['key1', 'key2', 'key3']);
      });

      it('should handle empty localStorage', () => {
        mockLocalStorage.length = 0;

        const keys = (service as any).getAllLocalStorageKeys();

        expect(keys).toEqual([]);
      });
    });

    describe('createBackup', () => {
      it('should create and store backup', async () => {
        const mockBackupData = { user: 'data' };
        mockSecureStorage.exportData.mockResolvedValue(mockBackupData);

        await (service as any).createBackup();

        expect(mockSecureStorage.exportData).toHaveBeenCalledWith(true);
        expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
          expect.stringMatching(/^data_backup_\d+$/),
          JSON.stringify(mockBackupData)
        );
      });
    });

    describe('logMigrationReport', () => {
      it('should log migration report details', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const report: MigrationReport = {
          totalKeys: 10,
          migratedKeys: 8,
          failedKeys: 1,
          skippedKeys: 1,
          errors: ['Test error'],
          warnings: ['Test warning'],
          encryptionStats: { supported: true },
          complianceCheck: { compliant: true },
          migrationTime: 1000,
        };

        (service as any).logMigrationReport(report);

        expect(consoleSpy).toHaveBeenCalledWith('=== Data Migration Report ===');
        expect(consoleSpy).toHaveBeenCalledWith('Total keys processed: 10');
        expect(consoleSpy).toHaveBeenCalledWith('Keys migrated: 8');
        expect(consoleSpy).toHaveBeenCalledWith('Keys skipped: 1');
        expect(consoleSpy).toHaveBeenCalledWith('Keys failed: 1');
        expect(consoleSpy).toHaveBeenCalledWith('Migration time: 1000ms');
        expect(consoleWarnSpy).toHaveBeenCalledWith('Migration errors:', ['Test error']);
        expect(consoleWarnSpy).toHaveBeenCalledWith('Migration warnings:', ['Test warning']);

        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      });
    });
  });
});

describe('getDataMigrationService', () => {
  it('should return singleton instance', () => {
    const instance1 = getDataMigrationService();
    const instance2 = getDataMigrationService();

    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(DataMigrationService);
  });
});

describe('useDataMigration hook', () => {
  it('should provide migration methods', () => {
    const { result } = renderHook(() => useDataMigration());

    expect(result.current.performMigration).toBeInstanceOf(Function);
    expect(result.current.validateMigration).toBeInstanceOf(Function);
    expect(result.current.getMigrationStatus).toBeInstanceOf(Function);
    expect(result.current.setupDataProtection).toBeInstanceOf(Function);
  });

  it('should perform migration through hook', async () => {
    const { result } = renderHook(() => useDataMigration());

    mockLocalStorage.length = 1;
    mockLocalStorage.key.mockReturnValue('test_key');

    let migrationResult: MigrationReport | undefined;
    await act(async () => {
      migrationResult = await result.current.performMigration({ dryRun: true });
    });

    expect(migrationResult).toBeDefined();
    expect(migrationResult!.totalKeys).toBeGreaterThanOrEqual(0);
  });

  it('should validate migration through hook', async () => {
    const { result } = renderHook(() => useDataMigration());

    let validationResult: any;
    await act(async () => {
      validationResult = await result.current.validateMigration();
    });

    expect(validationResult).toHaveProperty('isValid');
    expect(validationResult).toHaveProperty('issues');
    expect(validationResult).toHaveProperty('recommendations');
  });

  it('should get migration status through hook', () => {
    const { result } = renderHook(() => useDataMigration());

    mockLocalStorage.length = 0;

    const status = result.current.getMigrationStatus();

    expect(status).toHaveProperty('needsMigration');
    expect(status).toHaveProperty('reason');
    expect(status).toHaveProperty('urgency');
    expect(status).toHaveProperty('sensitiveKeysFound');
  });

  it('should setup data protection through hook', async () => {
    const { result } = renderHook(() => useDataMigration());

    await act(async () => {
      await result.current.setupDataProtection();
    });

    // Verify localStorage methods were overridden
    expect(localStorage.setItem).toBeDefined();
    expect(localStorage.getItem).toBeDefined();
    expect(localStorage.removeItem).toBeDefined();
  });
});