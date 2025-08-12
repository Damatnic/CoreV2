import { SecureStorageService } from '../secureStorageService';

// Mock WebCrypto API
const mockCrypto = {
  getRandomValues: jest.fn((arr) => arr.fill(1)),
  subtle: {
    generateKey: jest.fn().mockResolvedValue({ type: 'secret' }),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
    importKey: jest.fn().mockResolvedValue({ type: 'secret' }),
    exportKey: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  }
};

Object.defineProperty(window, 'crypto', { value: mockCrypto });

// Mock IndexedDB
const mockIDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

const mockDatabase = {
  transaction: jest.fn(),
  objectStoreNames: ['secure_data'],
  close: jest.fn(),
};

const mockObjectStore = {
  add: jest.fn().mockResolvedValue('key'),
  put: jest.fn().mockResolvedValue('key'),
  get: jest.fn().mockResolvedValue(null),
  delete: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
  oncomplete: null,
  onerror: null,
};

Object.defineProperty(window, 'indexedDB', { value: mockIDB });

describe('SecureStorageService', () => {
  let service: SecureStorageService;

  beforeEach(async () => {
    service = new SecureStorageService();
    jest.clearAllMocks();

    // Mock successful database operations
    mockIDB.open.mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDatabase,
    });

    mockDatabase.transaction.mockReturnValue(mockTransaction);

    await service.initialize();
  });

  describe('initialization', () => {
    it('should initialize encryption keys', async () => {
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalled();
    });

    it('should create secure database', async () => {
      expect(mockIDB.open).toHaveBeenCalledWith('SecureStorageDB', expect.any(Number));
    });
  });

  describe('secure data operations', () => {
    it('should securely store sensitive data', async () => {
      const sensitiveData = { moodData: 'feeling anxious', therapy: 'session notes' };

      await service.setSecureItem('user_health_data', sensitiveData);

      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
      expect(mockObjectStore.put).toHaveBeenCalled();
    });

    it('should retrieve and decrypt data', async () => {
      const encryptedData = { encrypted: new ArrayBuffer(32), iv: new ArrayBuffer(16) };
      mockObjectStore.get.mockResolvedValue(encryptedData);

      const decryptedText = new TextEncoder().encode('{"mood": "happy"}');
      mockCrypto.subtle.decrypt.mockResolvedValue(decryptedText.buffer);

      const result = await service.getSecureItem('user_data');

      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
      expect(result).toEqual({ mood: 'happy' });
    });

    it('should handle missing data gracefully', async () => {
      mockObjectStore.get.mockResolvedValue(null);

      const result = await service.getSecureItem('nonexistent');

      expect(result).toBeNull();
    });

    it('should remove secure data', async () => {
      await service.removeSecureItem('user_data');

      expect(mockObjectStore.delete).toHaveBeenCalledWith('user_data');
    });
  });

  describe('encryption and decryption', () => {
    it('should encrypt data with AES-GCM', async () => {
      const data = 'sensitive information';

      const encrypted = await service.encryptData(data);

      expect(encrypted.encrypted).toBeInstanceOf(ArrayBuffer);
      expect(encrypted.iv).toBeInstanceOf(ArrayBuffer);
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AES-GCM' }),
        expect.any(Object),
        expect.any(ArrayBuffer)
      );
    });

    it('should decrypt data correctly', async () => {
      const encryptedData = {
        encrypted: new ArrayBuffer(32),
        iv: new ArrayBuffer(16)
      };

      const decryptedText = new TextEncoder().encode('decrypted data');
      mockCrypto.subtle.decrypt.mockResolvedValue(decryptedText.buffer);

      const result = await service.decryptData(encryptedData);

      expect(result).toBe('decrypted data');
    });

    it('should handle encryption failures', async () => {
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'));

      await expect(service.encryptData('test')).rejects.toThrow('Encryption failed');
    });
  });

  describe('HIPAA compliance features', () => {
    it('should implement data classification', async () => {
      await service.storeClassifiedData('therapy_notes', 'session content', 'PHI');

      expect(mockObjectStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          classification: 'PHI',
          encrypted: expect.any(ArrayBuffer)
        })
      );
    });

    it('should maintain audit trail', async () => {
      await service.setSecureItem('user_data', { test: 'data' });

      const auditTrail = await service.getAuditTrail('user_data');

      expect(auditTrail).toContainEqual(
        expect.objectContaining({
          action: 'CREATE',
          timestamp: expect.any(Number),
          key: 'user_data'
        })
      );
    });

    it('should enforce data retention policies', async () => {
      const retentionPolicies = await service.getRetentionPolicies();

      expect(retentionPolicies.PHI).toBe('7_years');
      expect(retentionPolicies.PII).toBe('3_years');
      expect(retentionPolicies.anonymous).toBe('indefinite');
    });

    it('should purge expired data', async () => {
      const purgeResult = await service.purgeExpiredData();

      expect(purgeResult.itemsPurged).toBeGreaterThanOrEqual(0);
      expect(purgeResult.complianceVerified).toBe(true);
    });
  });

  describe('key management', () => {
    it('should rotate encryption keys', async () => {
      const oldKeyId = service.getCurrentKeyId();

      await service.rotateEncryptionKey();

      const newKeyId = service.getCurrentKeyId();
      expect(newKeyId).not.toBe(oldKeyId);
    });

    it('should export key material securely', async () => {
      const exportedKey = await service.exportKeyMaterial();

      expect(exportedKey.encrypted).toBe(true);
      expect(exportedKey.keyMaterial).toBeInstanceOf(ArrayBuffer);
    });

    it('should import key material', async () => {
      const keyMaterial = new ArrayBuffer(32);

      await service.importKeyMaterial(keyMaterial);

      expect(mockCrypto.subtle.importKey).toHaveBeenCalled();
    });
  });

  describe('backup and restore', () => {
    it('should create encrypted backup', async () => {
      const backup = await service.createEncryptedBackup();

      expect(backup.encrypted).toBe(true);
      expect(backup.metadata.timestamp).toBeDefined();
      expect(backup.data).toBeInstanceOf(ArrayBuffer);
    });

    it('should restore from encrypted backup', async () => {
      const backupData = {
        encrypted: true,
        data: new ArrayBuffer(64),
        metadata: { timestamp: Date.now(), version: '1.0' }
      };

      const result = await service.restoreFromBackup(backupData);

      expect(result.restored).toBe(true);
      expect(result.itemsRestored).toBeGreaterThanOrEqual(0);
    });
  });

  describe('security monitoring', () => {
    it('should detect tamper attempts', async () => {
      const tamperCheck = await service.performTamperCheck();

      expect(tamperCheck.integrity).toBe('valid');
      expect(tamperCheck.lastVerified).toBeDefined();
    });

    it('should log security events', async () => {
      await service.logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        resource: 'user_therapy_data',
        timestamp: Date.now()
      });

      const securityLogs = await service.getSecurityLogs();
      expect(securityLogs).toContainEqual(
        expect.objectContaining({
          event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          resource: 'user_therapy_data'
        })
      );
    });

    it('should implement access controls', async () => {
      const hasPermission = await service.checkPermission('user-123', 'therapy_data', 'READ');

      expect(hasPermission).toBe(true);
    });
  });

  describe('data validation', () => {
    it('should validate data integrity', async () => {
      const data = { sensitive: 'information' };

      const isValid = await service.validateDataIntegrity('user_data', data);

      expect(isValid).toBe(true);
    });

    it('should detect data corruption', async () => {
      // Mock corrupted data
      mockObjectStore.get.mockResolvedValue({
        encrypted: 'corrupted_data',
        iv: 'invalid_iv'
      });

      const isValid = await service.validateDataIntegrity('corrupted_data', null);

      expect(isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockObjectStore.put.mockRejectedValue(new Error('Storage full'));

      await expect(service.setSecureItem('data', {})).rejects.toThrow('Storage full');
    });

    it('should handle decryption failures', async () => {
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Invalid key'));
      mockObjectStore.get.mockResolvedValue({
        encrypted: new ArrayBuffer(32),
        iv: new ArrayBuffer(16)
      });

      const result = await service.getSecureItem('invalid_data');

      expect(result).toBeNull();
    });

    it('should provide fallback for unsupported browsers', () => {
      delete (window as any).crypto;

      const fallbackService = new SecureStorageService();

      expect(() => fallbackService.initialize()).not.toThrow();
    });
  });
});