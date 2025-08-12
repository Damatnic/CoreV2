/**
 * Test Suite for Encryption Service
 * Tests data encryption, decryption, and security features
 */

import { encryptionService } from '../encryptionService';

describe('EncryptionService', () => {
  beforeEach(() => {
    // Clear any stored keys
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const originalData = { message: 'sensitive data', userId: '12345' };
      
      const encrypted = await encryptionService.encrypt(originalData);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(originalData);
      expect(typeof encrypted).toBe('string');
      
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toEqual(originalData);
    });

    it('should handle string data', async () => {
      const originalData = 'This is a test string';
      
      const encrypted = await encryptionService.encrypt(originalData);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(originalData);
    });

    it('should handle complex objects', async () => {
      const complexData = {
        user: {
          id: 1,
          name: 'Test User',
          preferences: ['privacy', 'security'],
          metadata: {
            lastLogin: new Date().toISOString(),
            sessions: 5
          }
        },
        sensitive: {
          ssn: '123-45-6789',
          creditCard: '4111111111111111'
        }
      };
      
      const encrypted = await encryptionService.encrypt(complexData);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      expect(decrypted).toEqual(complexData);
    });

    it('should generate different encrypted values for same data', async () => {
      const data = 'test data';
      
      const encrypted1 = await encryptionService.encrypt(data);
      const encrypted2 = await encryptionService.encrypt(data);
      
      // Should use different IVs, so encrypted values differ
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      expect(await encryptionService.decrypt(encrypted1)).toBe(data);
      expect(await encryptionService.decrypt(encrypted2)).toBe(data);
    });
  });

  describe('Key Management', () => {
    it('should generate encryption keys', async () => {
      const key = await encryptionService.generateKey();
      
      expect(key).toBeDefined();
      expect(key).toHaveProperty('algorithm');
      expect(key).toHaveProperty('extractable');
      expect(key).toHaveProperty('type');
      expect(key).toHaveProperty('usages');
    });

    it('should rotate encryption keys', async () => {
      const data = 'test data';
      
      // Encrypt with current key
      const encrypted1 = await encryptionService.encrypt(data);
      
      // Rotate key
      await encryptionService.rotateKeys();
      
      // Should still decrypt old data
      const decrypted1 = await encryptionService.decrypt(encrypted1);
      expect(decrypted1).toBe(data);
      
      // New encryption should use new key
      const encrypted2 = await encryptionService.encrypt(data);
      expect(encrypted2).not.toBe(encrypted1);
    });

    it('should handle key storage securely', async () => {
      const key = await encryptionService.generateKey();
      
      // Key should not be directly accessible in plain text
      const storedKey = localStorage.getItem('encryption_key');
      expect(storedKey).toBeNull(); // Should not store raw key
    });
  });

  describe('Hash Functions', () => {
    it('should hash data consistently', async () => {
      const data = 'password123';
      
      const hash1 = await encryptionService.hash(data);
      const hash2 = await encryptionService.hash(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(data);
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for different data', async () => {
      const hash1 = await encryptionService.hash('data1');
      const hash2 = await encryptionService.hash('data2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle salted hashing', async () => {
      const password = 'myPassword';
      const salt = 'randomSalt';
      
      const hash1 = await encryptionService.hashWithSalt(password, salt);
      const hash2 = await encryptionService.hashWithSalt(password, salt);
      const hash3 = await encryptionService.hashWithSalt(password, 'differentSalt');
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('Secure Storage', () => {
    it('should store encrypted data in localStorage', async () => {
      const key = 'user_data';
      const data = { id: 1, name: 'John Doe' };
      
      await encryptionService.secureStore(key, data);
      
      const stored = localStorage.getItem(key);
      expect(stored).toBeDefined();
      expect(stored).not.toContain('John Doe'); // Should be encrypted
      
      const retrieved = await encryptionService.secureRetrieve(key);
      expect(retrieved).toEqual(data);
    });

    it('should handle missing data gracefully', async () => {
      const retrieved = await encryptionService.secureRetrieve('nonexistent');
      expect(retrieved).toBeNull();
    });

    it('should remove encrypted data', async () => {
      const key = 'temp_data';
      await encryptionService.secureStore(key, 'test');
      
      expect(localStorage.getItem(key)).toBeDefined();
      
      await encryptionService.secureRemove(key);
      expect(localStorage.getItem(key)).toBeNull();
    });
  });

  describe('Token Management', () => {
    it('should generate secure tokens', () => {
      const token1 = encryptionService.generateSecureToken();
      const token2 = encryptionService.generateSecureToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThanOrEqual(32);
    });

    it('should validate token format', () => {
      const validToken = encryptionService.generateSecureToken();
      const invalidToken = 'short';
      
      expect(encryptionService.isValidToken(validToken)).toBe(true);
      expect(encryptionService.isValidToken(invalidToken)).toBe(false);
      expect(encryptionService.isValidToken('')).toBe(false);
      expect(encryptionService.isValidToken(null as any)).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const sanitized = encryptionService.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should preserve safe content', () => {
      const safeInput = 'Hello, this is a safe message!';
      const sanitized = encryptionService.sanitizeInput(safeInput);
      
      expect(sanitized).toBe(safeInput);
    });
  });

  describe('Error Handling', () => {
    it('should handle decryption with invalid data', async () => {
      await expect(encryptionService.decrypt('invalid')).rejects.toThrow();
    });

    it('should handle encryption of undefined data', async () => {
      await expect(encryptionService.encrypt(undefined as any)).rejects.toThrow();
    });

    it('should handle corrupted stored data', async () => {
      localStorage.setItem('corrupted', 'not-encrypted-data');
      const result = await encryptionService.secureRetrieve('corrupted');
      expect(result).toBeNull();
    });
  });

  describe('Compliance Features', () => {
    it('should support data expiration', async () => {
      const key = 'temp_data';
      const data = 'temporary';
      const expirationMs = 100; // 100ms for testing
      
      await encryptionService.secureStoreWithExpiration(key, data, expirationMs);
      
      // Should retrieve immediately
      const immediate = await encryptionService.secureRetrieve(key);
      expect(immediate).toBe(data);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should return null after expiration
      const expired = await encryptionService.secureRetrieve(key);
      expect(expired).toBeNull();
    });

    it('should provide audit trail for encryption operations', () => {
      const auditLog = encryptionService.getAuditLog();
      
      expect(Array.isArray(auditLog)).toBe(true);
      // Implementation would track encryption/decryption operations
    });
  });
});