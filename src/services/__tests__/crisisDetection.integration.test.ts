/**
 * Integration test for Crisis Detection Service
 * Tests the critical functionality of detecting crisis indicators
 */

import { astralCoreCrisisDetection } from '../crisisDetectionService';

describe('Crisis Detection Service - Integration Tests', () => {
  describe('Critical Crisis Detection', () => {
    it('should detect immediate suicide risk', () => {
      const result = astralCoreCrisisDetection.analyzeCrisisContent(
        'I am going to end my life tonight'
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.severityLevel).toBe('critical');
      expect(result.escalationRequired).toBe(true);
      expect(result.emergencyServices).toBe(true);
    });

    it('should detect self-harm indicators', () => {
      const result = astralCoreCrisisDetection.analyzeCrisisContent(
        'I have been cutting myself again'
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(['high', 'critical']).toContain(result.severityLevel);
      expect(result.detectedCategories).toContain('self-harm');
    });

    it('should detect substance abuse crisis', () => {
      const result = astralCoreCrisisDetection.analyzeCrisisContent(
        'I took too many pills, I think I might be overdosing'
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.severityLevel).toBe('critical');
      expect(result.emergencyServices).toBe(true);
      expect(result.detectedCategories).toContain('emergency');
    });
  });

  describe('Protective Factors Detection', () => {
    it('should recognize protective factors that reduce risk', () => {
      const result = astralCoreCrisisDetection.analyzeCrisisContent(
        'I sometimes think about ending it all, but I could never do that to my family'
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.protectiveFactors.length).toBeGreaterThan(0);
      expect(result.protectiveFactors).toContain('life_responsibilities');
    });

    it('should detect help-seeking behavior', () => {
      const result = astralCoreCrisisDetection.analyzeCrisisContent(
        'I am having suicidal thoughts and I need help, I want to get better'
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.protectiveFactors).toContain('help_seeking');
      expect(result.recommendedActions).toContain('professional_support');
    });
  });

  describe('False Positive Prevention', () => {
    it('should not flag casual mentions', () => {
      const result = astralCoreCrisisDetection.analyzeCrisisContent(
        'That movie about depression was really well done'
      );
      
      expect(result.hasCrisisIndicators).toBe(false);
      expect(result.severityLevel).toBe('none');
    });

    it('should not flag past tense recovery stories', () => {
      const result = astralCoreCrisisDetection.analyzeCrisisContent(
        'I used to have suicidal thoughts years ago, but therapy helped me overcome them'
      );
      
      expect(result.hasCrisisIndicators).toBe(false);
      expect(result.severityLevel).toBe('none');
    });
  });

  describe('Multilingual Crisis Detection', () => {
    it('should have support for multiple languages', () => {
      // Test that the service has multilingual capabilities
      const service = astralCoreCrisisDetection as unknown;
      expect(service.supportedLanguages).toBeDefined();
      expect(service.supportedLanguages.length).toBeGreaterThan(1);
    });
  });

  describe('Escalation Workflow', () => {
    it('should trigger emergency escalation for critical threats', () => {
      const result = astralCoreCrisisDetection.analyzeCrisisContent(
        'I have a gun and I am going to use it on myself right now'
      );
      
      expect(result.escalationRequired).toBe(true);
      expect(result.emergencyServices).toBe(true);
      expect(result.recommendedActions).toContain('call_emergency');
      expect(result.recommendedActions).toContain('immediate_intervention');
    });

    it('should recommend professional support for high-risk cases', () => {
      const result = astralCoreCrisisDetection.analyzeCrisisContent(
        'I have been having constant thoughts about dying'
      );
      
      expect(result.hasCrisisIndicators).toBe(true);
      expect(result.recommendedActions).toContain('professional_support');
      expect(result.recommendedActions).toContain('crisis_hotline');
    });
  });

  describe('Performance', () => {
    it('should analyze text quickly (under 100ms)', () => {
      const startTime = performance.now();
      
      astralCoreCrisisDetection.analyzeCrisisContent(
        'This is a long text that needs to be analyzed for crisis indicators...'
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should process in under 100ms
    });

    it('should handle very long texts', () => {
      const longText = 'Normal text '.repeat(1000); // Very long text
      
      expect(() => {
        astralCoreCrisisDetection.analyzeCrisisContent(longText);
      }).not.toThrow();
    });
  });
});

describe('Crisis Detection Service - Edge Cases', () => {
  it('should handle empty input', () => {
    const result = astralCoreCrisisDetection.analyzeCrisisContent('');
    
    expect(result.hasCrisisIndicators).toBe(false);
    expect(result.severityLevel).toBe('none');
  });

  it('should handle null/undefined gracefully', () => {
    const result = astralCoreCrisisDetection.analyzeCrisisContent(null as unknown);
    
    expect(result.hasCrisisIndicators).toBe(false);
    expect(result.severityLevel).toBe('none');
  });

  it('should handle special characters and emojis', () => {
    const result = astralCoreCrisisDetection.analyzeCrisisContent(
      '😢 I want to die 💔'
    );
    
    expect(result.hasCrisisIndicators).toBe(true);
    expect(result.severityLevel).not.toBe('none');
  });
});
