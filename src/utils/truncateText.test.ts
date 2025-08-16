/**
 * Truncate Text Test Suite
 * Tests text truncation utility with various edge cases
 */

import { truncateText } from './truncateText';

describe('truncateText', () => {
  describe('basic functionality', () => {
    it('should return original text when shorter than max length', () => {
      const text = 'Hello World';
      const result = truncateText(text, 20);
      expect(result).toBe('Hello World');
    });

    it('should truncate text when longer than max length', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result).toBe('This is a very long...');
      expect(result.length).toBe(23); // 20 + 3 for '...'
    });

    it('should use custom suffix when provided', () => {
      const text = 'This is a long text';
      const result = truncateText(text, 10, ' [more]');
      expect(result).toBe('This is a [more]');
    });

    it('should return original text when exactly at max length', () => {
      const text = 'Exactly twenty chars';
      const result = truncateText(text, 20);
      expect(result).toBe('Exactly twenty chars');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });

    it('should handle null input', () => {
      const result = truncateText(null as any, 10);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = truncateText(undefined as any, 10);
      expect(result).toBe('');
    });

    it('should handle zero max length', () => {
      const text = 'Hello World';
      const result = truncateText(text, 0);
      expect(result).toBe('...');
    });

    it('should handle negative max length', () => {
      const text = 'Hello World';
      const result = truncateText(text, -5);
      expect(result).toBe('...');
    });

    it('should handle very long suffix', () => {
      const text = 'Hello World';
      const result = truncateText(text, 5, ' [this is a very long suffix]');
      expect(result).toBe('Hello [this is a very long suffix]');
    });

    it('should handle empty suffix', () => {
      const text = 'This is a long text that will be truncated';
      const result = truncateText(text, 10, '');
      expect(result).toBe('This is a ');
      expect(result.length).toBe(10);
    });
  });

  describe('unicode and special characters', () => {
    it('should handle unicode characters correctly', () => {
      const text = 'Hello 👋 World 🌍 How are you? 😊';
      const result = truncateText(text, 15);
      expect(result).toBe('Hello 👋 World ...');
    });

    it('should handle accented characters', () => {
      const text = 'Café, naïve résumé';
      const result = truncateText(text, 10);
      expect(result).toBe('Café, naïv...');
    });

    it('should handle newline characters', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const result = truncateText(text, 10);
      expect(result).toBe('Line 1\nLin...');
    });

    it('should handle tab characters', () => {
      const text = 'Column 1\tColumn 2\tColumn 3';
      const result = truncateText(text, 15);
      expect(result).toBe('Column 1\tColumn...');
    });

    it('should handle mixed whitespace', () => {
      const text = 'Word1   Word2     Word3';
      const result = truncateText(text, 12);
      expect(result).toBe('Word1   Word...');
    });
  });

  describe('boundary conditions', () => {
    it('should handle text length equal to max length', () => {
      const text = '1234567890';
      const result = truncateText(text, 10);
      expect(result).toBe('1234567890');
      expect(result.length).toBe(10);
    });

    it('should handle text length one more than max length', () => {
      const text = '12345678901';
      const result = truncateText(text, 10);
      expect(result).toBe('1234567890...');
      expect(result.length).toBe(13);
    });

    it('should handle very small max length with default suffix', () => {
      const text = 'Hello';
      const result = truncateText(text, 2);
      expect(result).toBe('He...');
    });

    it('should handle max length smaller than suffix', () => {
      const text = 'Hello World';
      const result = truncateText(text, 2, ' [truncated]');
      expect(result).toBe('He [truncated]');
    });
  });

  describe('default parameter behavior', () => {
    it('should use default suffix when not provided', () => {
      const text = 'This is a long text';
      const result = truncateText(text, 10);
      expect(result).toBe('This is a ...');
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle default suffix with various lengths', () => {
      const longText = 'This is a very long text that will definitely need truncation';
      
      const result1 = truncateText(longText, 5);
      const result2 = truncateText(longText, 15);
      const result3 = truncateText(longText, 25);
      
      expect(result1).toBe('This ...');
      expect(result2).toBe('This is a very ...');
      expect(result3).toBe('This is a very long text...');
    });
  });

  describe('performance and memory', () => {
    it('should handle very long strings efficiently', () => {
      const veryLongText = 'a'.repeat(10000);
      
      const startTime = performance.now();
      const result = truncateText(veryLongText, 100);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10); // Should complete quickly
      expect(result.length).toBe(103); // 100 + 3 for '...'
    });

    it('should not create unnecessary string copies when no truncation needed', () => {
      const originalText = 'Short text';
      const result = truncateText(originalText, 100);
      
      expect(result).toBe(originalText);
    });

    it('should handle multiple calls efficiently', () => {
      const text = 'This is a test text for performance testing';
      const iterations = 1000;
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        truncateText(text, 20);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(100); // Should complete 1000 iterations quickly
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical social media post truncation', () => {
      const tweet = 'Just had an amazing experience at the new restaurant downtown! The food was incredible and the service was outstanding. Definitely going back soon! #foodie #restaurant';
      const result = truncateText(tweet, 140);
      
      expect(result.length).toBeLessThanOrEqual(143); // 140 + 3 for ellipsis
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle news headline truncation', () => {
      const headline = 'Breaking News: Major Technology Company Announces Revolutionary New Product That Will Change the Industry Forever';
      const result = truncateText(headline, 60);
      
      expect(result.length).toBe(63); // 60 + 3
      expect(result).toBe('Breaking News: Major Technology Company Announces Revolut...');
    });

    it('should handle email subject line truncation', () => {
      const subject = 'Urgent: Please review the quarterly budget proposal and provide feedback by end of business today';
      const result = truncateText(subject, 50);
      
      expect(result.length).toBe(53);
      expect(result).toBe('Urgent: Please review the quarterly budget propos...');
    });

    it('should handle product description truncation', () => {
      const description = 'This premium organic cotton t-shirt features a comfortable relaxed fit, sustainable materials, and is perfect for casual everyday wear or outdoor activities';
      const result = truncateText(description, 80, '... read more');
      
      expect(result).toBe('This premium organic cotton t-shirt features a comfortable relaxed fit, sustai... read more');
    });

    it('should handle user bio truncation', () => {
      const bio = 'Software engineer passionate about creating innovative solutions. Love hiking, photography, and learning new technologies. Based in San Francisco.';
      const result = truncateText(bio, 100);
      
      expect(result.length).toBeLessThanOrEqual(103);
      expect(result.includes('Software engineer')).toBe(true);
    });
  });

  describe('consistent behavior', () => {
    it('should produce consistent results for same inputs', () => {
      const text = 'This is a test for consistency';
      const maxLength = 15;
      const suffix = '...';
      
      const result1 = truncateText(text, maxLength, suffix);
      const result2 = truncateText(text, maxLength, suffix);
      const result3 = truncateText(text, maxLength, suffix);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should handle different data types gracefully', () => {
      const inputs = [
        123,
        true,
        false,
        [],
        {},
        function() {},
      ];
      
      inputs.forEach(input => {
        expect(() => {
          truncateText(input as any, 10);
        }).not.toThrow();
      });
    });
  });

  describe('integration with default export', () => {
    it('should be available as default export', () => {
      // Test that the default export works the same as named export
      const { default: defaultTruncateText } = require('./truncateText');
      
      const text = 'Testing default export functionality';
      const namedResult = truncateText(text, 20);
      const defaultResult = defaultTruncateText(text, 20);
      
      expect(namedResult).toBe(defaultResult);
    });
  });
});