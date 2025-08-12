/**
 * Test Suite for Enhanced Crisis Detection Integration Service
 * Tests advanced integration of multiple crisis detection systems
 */

import { enhancedCrisisDetectionIntegrationService } from '../enhancedCrisisDetectionIntegrationService';

describe('EnhancedCrisisDetectionIntegrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    enhancedCrisisDetectionIntegrationService.reset();
  });

  describe('Multi-Model Integration', () => {
    it('should integrate NLP, sentiment, and keyword models', async () => {
      const text = 'I cant do this anymore, everything hurts and I want it to stop';
      
      const result = await enhancedCrisisDetectionIntegrationService.analyzeComprehensive(text);
      
      expect(result.models).toHaveProperty('nlp');
      expect(result.models).toHaveProperty('sentiment');
      expect(result.models).toHaveProperty('keyword');
      expect(result.models).toHaveProperty('contextual');
      expect(result.models).toHaveProperty('behavioral');
      
      expect(result.consensusScore).toBeGreaterThan(0.7);
      expect(result.finalSeverity).toBeOneOf(['high', 'critical']);
    });

    it('should weight models based on confidence', async () => {
      const text = 'Feeling overwhelmed today';
      
      const result = await enhancedCrisisDetectionIntegrationService.analyzeComprehensive(text);
      
      expect(result.modelWeights).toBeDefined();
      expect(result.modelWeights.nlp).toBeGreaterThan(0);
      expect(result.modelWeights.sentiment).toBeGreaterThan(0);
      
      const totalWeight = Object.values(result.modelWeights).reduce((a, b) => a + b, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should handle model disagreements', async () => {
      const ambiguousText = 'I need to end this';
      
      const result = await enhancedCrisisDetectionIntegrationService.analyzeComprehensive(ambiguousText);
      
      expect(result.disagreement).toBeDefined();
      expect(result.disagreement.level).toBeOneOf(['low', 'medium', 'high']);
      expect(result.tiebreaker).toBeDefined();
      expect(result.confidence).toBeLessThan(0.9); // Lower confidence on disagreement
    });
  });

  describe('Contextual Analysis Enhancement', () => {
    it('should analyze conversation context', async () => {
      const conversation = [
        { text: 'I had a bad day', timestamp: Date.now() - 3600000 },
        { text: 'Nothing seems to work out', timestamp: Date.now() - 1800000 },
        { text: 'Maybe I should just give up', timestamp: Date.now() }
      ];

      const result = await enhancedCrisisDetectionIntegrationService.analyzeConversation(conversation);
      
      expect(result.escalationDetected).toBe(true);
      expect(result.trend).toBe('worsening');
      expect(result.contextualSeverity).toBeGreaterThan(result.lastMessageSeverity);
    });

    it('should detect crisis patterns over time', async () => {
      const history = [
        { text: 'Feeling down', timestamp: Date.now() - 86400000 * 7 },
        { text: 'Really struggling', timestamp: Date.now() - 86400000 * 3 },
        { text: 'I cant take it anymore', timestamp: Date.now() }
      ];

      const result = await enhancedCrisisDetectionIntegrationService.analyzeTemporalPattern(history);
      
      expect(result.patternType).toBe('escalating');
      expect(result.velocity).toBeGreaterThan(0);
      expect(result.predictedTrajectory).toBe('critical');
      expect(result.interventionRecommended).toBe(true);
    });

    it('should incorporate user profile context', async () => {
      const userProfile = {
        pastCrises: 2,
        riskFactors: ['depression', 'isolation'],
        protectiveFactors: ['therapy', 'medication'],
        lastCrisisDate: Date.now() - 86400000 * 30
      };

      const text = 'Having dark thoughts';
      
      const result = await enhancedCrisisDetectionIntegrationService.analyzeWithProfile(text, userProfile);
      
      expect(result.adjustedSeverity).toBeGreaterThan(result.baseSeverity);
      expect(result.riskScore).toBeGreaterThan(0.6);
      expect(result.personalizedInterventions).toBeDefined();
    });
  });

  describe('Advanced Pattern Recognition', () => {
    it('should detect suicide planning language', async () => {
      const planningTexts = [
        'I need to get my affairs in order',
        'Writing letters to say goodbye',
        'Giving away my belongings',
        'Found a peaceful way to go'
      ];

      for (const text of planningTexts) {
        const result = await enhancedCrisisDetectionIntegrationService.detectPlanning(text);
        
        expect(result.planningDetected).toBe(true);
        expect(result.planningStage).toBeDefined();
        expect(result.urgency).toBeOneOf(['high', 'critical', 'emergency']);
      }
    });

    it('should identify protective statements', async () => {
      const text = 'I feel terrible but I would never hurt myself because of my kids';
      
      const result = await enhancedCrisisDetectionIntegrationService.analyzeComprehensive(text);
      
      expect(result.protectiveFactors).toBeDefined();
      expect(result.protectiveFactors).toContain('family');
      expect(result.adjustedRisk).toBeLessThan(result.initialRisk);
    });

    it('should detect coded/euphemistic language', async () => {
      const codedTexts = [
        'Going to catch the bus',
        'Time to check out',
        'Taking the permanent vacation',
        'Going to sleep forever'
      ];

      for (const text of codedTexts) {
        const result = await enhancedCrisisDetectionIntegrationService.detectCodedLanguage(text);
        
        expect(result.codedLanguageDetected).toBe(true);
        expect(result.decodedMeaning).toBeDefined();
        expect(result.severity).toBeOneOf(['high', 'critical']);
      }
    });
  });

  describe('Real-time Monitoring Integration', () => {
    it('should track crisis indicators in real-time', async () => {
      const monitor = enhancedCrisisDetectionIntegrationService.createRealTimeMonitor('user-123');
      
      monitor.addMessage('Feeling hopeless');
      monitor.addMessage('No one cares');
      monitor.addMessage('Want to disappear');
      
      const status = monitor.getCurrentStatus();
      
      expect(status.riskLevel).toBeGreaterThan(0.5);
      expect(status.trajectory).toBe('worsening');
      expect(status.alertTriggered).toBe(true);
    });

    it('should detect rapid deterioration', async () => {
      const monitor = enhancedCrisisDetectionIntegrationService.createRealTimeMonitor('user-456');
      
      // Simulate rapid messages
      const messages = [
        'I cant', 'do this', 'anymore', 'goodbye', 'everyone'
      ];
      
      messages.forEach((msg, i) => {
        monitor.addMessage(msg, Date.now() + i * 1000); // 1 second apart
      });
      
      const alert = monitor.getAlert();
      
      expect(alert.type).toBe('rapid_deterioration');
      expect(alert.severity).toBe('emergency');
      expect(alert.responseTime).toBeLessThan(5000); // Alert within 5 seconds
    });
  });

  describe('Intervention Recommendation Engine', () => {
    it('should recommend appropriate interventions', async () => {
      const scenarios = [
        { text: 'Feeling a bit down', expectedIntervention: 'self-help' },
        { text: 'Really struggling today', expectedIntervention: 'peer-support' },
        { text: 'I want to hurt myself', expectedIntervention: 'crisis-counselor' },
        { text: 'I have a plan to end it', expectedIntervention: 'emergency-services' }
      ];

      for (const scenario of scenarios) {
        const result = await enhancedCrisisDetectionIntegrationService.recommendIntervention(scenario.text);
        
        expect(result.primaryIntervention).toBe(scenario.expectedIntervention);
        expect(result.alternatives).toBeDefined();
        expect(result.escalationPath).toBeDefined();
      }
    });

    it('should personalize interventions based on history', async () => {
      const userHistory = {
        preferredSupport: 'peer',
        successfulInterventions: ['breathing-exercises', 'journaling'],
        unsuccessfulInterventions: ['meditation']
      };

      const result = await enhancedCrisisDetectionIntegrationService.personalizeIntervention(
        'Anxiety is overwhelming',
        userHistory
      );
      
      expect(result.recommendations).toContain('breathing-exercises');
      expect(result.recommendations).not.toContain('meditation');
      expect(result.primarySupport).toBe('peer');
    });
  });

  describe('Cross-Platform Integration', () => {
    it('should aggregate signals from multiple platforms', async () => {
      const multiPlatformData = {
        chat: { text: 'Feeling lost', severity: 0.6 },
        voice: { emotion: 'despair', intensity: 0.7 },
        behavior: { appUsage: 'decreased', sleepPattern: 'disrupted' }
      };

      const result = await enhancedCrisisDetectionIntegrationService.aggregatePlatformSignals(multiPlatformData);
      
      expect(result.combinedRisk).toBeGreaterThan(0.6);
      expect(result.primaryConcern).toBeDefined();
      expect(result.dataPoints).toBe(3);
    });

    it('should handle missing platform data gracefully', async () => {
      const partialData = {
        chat: { text: 'Need help', severity: 0.8 }
        // Missing voice and behavior data
      };

      const result = await enhancedCrisisDetectionIntegrationService.aggregatePlatformSignals(partialData);
      
      expect(result.combinedRisk).toBeDefined();
      expect(result.confidence).toBeLessThan(1.0); // Lower confidence with missing data
      expect(result.missingDataHandled).toBe(true);
    });
  });

  describe('Explainability and Transparency', () => {
    it('should provide detailed detection reasoning', async () => {
      const text = 'I dont want to live anymore';
      
      const result = await enhancedCrisisDetectionIntegrationService.analyzeWithExplanation(text);
      
      expect(result.explanation).toBeDefined();
      expect(result.explanation.triggerPhrases).toContain('dont want to live');
      expect(result.explanation.sentimentScore).toBeLessThan(-0.5);
      expect(result.explanation.riskFactors).toBeDefined();
      expect(result.explanation.confidenceBreakdown).toBeDefined();
    });

    it('should provide model contribution breakdown', async () => {
      const text = 'Everything is hopeless and I want out';
      
      const result = await enhancedCrisisDetectionIntegrationService.analyzeWithExplanation(text);
      
      expect(result.modelContributions).toBeDefined();
      expect(result.modelContributions.nlp).toBeGreaterThan(0);
      expect(result.modelContributions.sentiment).toBeGreaterThan(0);
      expect(result.modelContributions.keyword).toBeGreaterThan(0);
      
      const total = Object.values(result.modelContributions).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1.0, 2);
    });
  });

  describe('Feedback Loop and Learning', () => {
    it('should incorporate counselor feedback', async () => {
      const detection = {
        text: 'Feeling overwhelmed',
        detectedSeverity: 'medium',
        counselorFeedback: 'high',
        actualOutcome: 'crisis-averted'
      };

      await enhancedCrisisDetectionIntegrationService.processFeedback(detection);
      
      // Test with similar text
      const result = await enhancedCrisisDetectionIntegrationService.analyzeComprehensive('Feeling overwhelmed');
      
      expect(result.adjustedByCounselor).toBe(true);
      expect(result.severity).toBe('high'); // Adjusted based on feedback
    });

    it('should track detection accuracy over time', async () => {
      const testCases = [
        { predicted: 'high', actual: 'high', correct: true },
        { predicted: 'low', actual: 'medium', correct: false },
        { predicted: 'critical', actual: 'critical', correct: true }
      ];

      testCases.forEach(tc => {
        enhancedCrisisDetectionIntegrationService.recordOutcome(tc);
      });

      const metrics = enhancedCrisisDetectionIntegrationService.getAccuracyMetrics();
      
      expect(metrics.accuracy).toBeCloseTo(0.67, 2);
      expect(metrics.precision).toBeDefined();
      expect(metrics.recall).toBeDefined();
      expect(metrics.f1Score).toBeDefined();
    });
  });

  describe('Emergency Response Integration', () => {
    it('should trigger emergency protocol for imminent danger', async () => {
      const text = 'I have the pills in my hand right now';
      
      const result = await enhancedCrisisDetectionIntegrationService.analyzeComprehensive(text);
      
      expect(result.emergencyProtocol).toBe(true);
      expect(result.notifications).toContain('crisis-team');
      expect(result.notifications).toContain('emergency-services');
      expect(result.responseTime).toBeLessThan(1000); // Under 1 second
    });

    it('should coordinate multi-channel emergency response', async () => {
      const emergency = {
        userId: 'user-emergency',
        text: 'This is goodbye',
        location: { lat: 40.7128, lng: -74.0060 }
      };

      const response = await enhancedCrisisDetectionIntegrationService.coordinateEmergencyResponse(emergency);
      
      expect(response.channels).toContain('sms');
      expect(response.channels).toContain('phone');
      expect(response.channels).toContain('app-notification');
      expect(response.localResources).toBeDefined();
      expect(response.eta).toBeDefined();
    });
  });

  describe('Privacy and Security Integration', () => {
    it('should anonymize crisis data for analysis', async () => {
      const sensitiveData = {
        userId: 'john.doe@example.com',
        text: 'I want to end my life',
        personalInfo: ['John', 'Doe', '123-456-7890']
      };

      const result = await enhancedCrisisDetectionIntegrationService.analyzeSecurely(sensitiveData);
      
      expect(result.userId).not.toBe('john.doe@example.com');
      expect(result.anonymized).toBe(true);
      expect(result.personalInfoRedacted).toBe(true);
      expect(result.severity).toBeDefined(); // Still provides analysis
    });

    it('should handle encrypted communications', async () => {
      const encryptedMessage = 'ENCRYPTED:eyJtZXNzYWdlIjoiY3Jpc2lzIn0=';
      
      const result = await enhancedCrisisDetectionIntegrationService.analyzeEncrypted(encryptedMessage);
      
      expect(result.decrypted).toBe(true);
      expect(result.analyzed).toBe(true);
      expect(result.reEncrypted).toBe(true);
      expect(result.severity).toBeDefined();
    });
  });
});