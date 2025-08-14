/**
 * @jest-environment jsdom
 */

import CulturalAssessmentService, { culturalAssessmentService } from '../culturalAssessmentService';
import { culturalContextService } from '../culturalContextService';
import { privacyPreservingAnalyticsService } from '../privacyPreservingAnalyticsService';

// Mock dependencies
jest.mock('../culturalContextService', () => ({
  culturalContextService: {
    getCulturalContext: jest.fn(),
  },
}));

jest.mock('../privacyPreservingAnalyticsService', () => ({
  privacyPreservingAnalyticsService: {
    recordInterventionOutcome: jest.fn(),
    generateEffectivenessReport: jest.fn(),
  },
}));

const mockCulturalContextService = culturalContextService as jest.Mocked<typeof culturalContextService>;
const mockPrivacyAnalyticsService = privacyPreservingAnalyticsService as jest.Mocked<typeof privacyPreservingAnalyticsService>;

describe('CulturalAssessmentService', () => {
  let service: CulturalAssessmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CulturalAssessmentService();

    // Set up default mock returns
    mockCulturalContextService.getCulturalContext.mockReturnValue({
      region: 'Western',
      mentalHealthStigma: 'medium',
      familyInvolvement: 'individual',
      crisisEscalation: 'direct',
      communicationStyle: 'direct',
    });

    mockPrivacyAnalyticsService.recordInterventionOutcome.mockResolvedValue(undefined);
    mockPrivacyAnalyticsService.generateEffectivenessReport.mockResolvedValue({
      summary: "effectiveness: 0.85",
      culturalInsights: ['Western culture shows direct communication patterns'],
      recommendations: ['Consider cultural context in assessments'],
      limitations: ['Limited cross-cultural validation data']
    });
  });

  describe('Cultural Expression Patterns', () => {
    test('should have comprehensive expression patterns for different cultures', () => {
      const patterns = (service as unknown).culturalExpressionPatterns;
      
      // Western patterns
      expect(patterns.western.depression.emotional).toContain('sad');
      expect(patterns.western.depression.emotional).toContain('hopeless');
      expect(patterns.western.anxiety.physical).toContain('racing heart');
      expect(patterns.western.helpSeeking.direct).toContain('need help');
      
      // Hispanic/Latino patterns
      expect(patterns.hispanic_latino.depression.somatic).toContain('dolor');
      expect(patterns.hispanic_latino.depression.cultural).toContain('nervios');
      expect(patterns.hispanic_latino.helpSeeking.traditional).toContain('rezar');
      
      // Arabic patterns
      expect(patterns.arabic.depression.emotional).toContain('حزن');
      expect(patterns.arabic.anxiety.spiritual).toContain('ابتلاء');
      expect(patterns.arabic.helpSeeking.traditional).toContain('دعاء');
      
      // Chinese patterns
      expect(patterns.chinese.depression.somatic).toContain('累');
      expect(patterns.chinese.depression.cultural).toContain('心烦');
      expect(patterns.chinese.helpSeeking.traditional).toContain('中医');
    });
  });

  describe('Assessment Questions Adaptation', () => {
    test('should get culturally adapted PHQ-9 questions', async () => {
      mockCulturalContextService.getCulturalContext.mockReturnValue({
        region: 'Hispanic/Latino',
        mentalHealthStigma: 'high',
        familyInvolvement: 'family-centered',
        crisisEscalation: 'gradual',
        communicationStyle: 'contextual',
      });

      const questions = await service.getCulturalAssessmentQuestions('phq-9', 'es', 'Hispanic/Latino');
      
      expect(questions).toHaveLength(9);
      expect(questions[0].culturalAdaptations).toHaveProperty('Hispanic/Latino');
      expect(questions[0].sensitivityLevel).toBeDefined();
      expect(questions[0].stigmaConsiderations).toBeInstanceOf(Array);
    });

    test('should get culturally adapted GAD-7 questions', async () => {
      const questions = await service.getCulturalAssessmentQuestions('gad-7', 'ar', 'Arabic');
      
      expect(questions).toHaveLength(7);
      expect(questions[0]).toHaveProperty('culturalAdaptations');
      expect(questions[0]).toHaveProperty('sensitivityLevel');
      expect(questions[0]).toHaveProperty('stigmaConsiderations');
    });

    test('should use default context when none provided', async () => {
      const questions = await service.getCulturalAssessmentQuestions('phq-9', 'en');
      
      expect(questions).toHaveLength(9);
      expect(mockCulturalContextService.getCulturalContext).toHaveBeenCalledWith('en');
    });

    test('should determine appropriate sensitivity levels', () => {
      const service = new CulturalAssessmentService();
      
      // Very high sensitivity for self-harm questions
      expect((service as unknown).determineSensitivityLevel('hurting yourself')).toBe('very-high');
      expect((service as unknown).determineSensitivityLevel('better off dead')).toBe('very-high');
      
      // High sensitivity for self-worth questions
      expect((service as unknown).determineSensitivityLevel('failure')).toBe('high');
      expect((service as unknown).determineSensitivityLevel('bad about yourself')).toBe('high');
      
      // Medium sensitivity for mood questions
      expect((service as unknown).determineSensitivityLevel('depressed')).toBe('medium');
      expect((service as unknown).determineSensitivityLevel('anxious')).toBe('medium');
      
      // Low sensitivity for general questions
      expect((service as unknown).determineSensitivityLevel('trouble sleeping')).toBe('low');
    });

    test('should identify stigma considerations', () => {
      const considerations = (service as unknown).getStigmaConsiderations(
        'feeling depressed or hopeless',
        'collectivist'
      );
      
      expect(considerations).toContain('Mental health stigma may affect honest responses');
      expect(considerations).toContain('Family shame considerations may influence answers');
    });

    test('should identify suicide stigma considerations', () => {
      const considerations = (service as unknown).getStigmaConsiderations(
        'thoughts of hurting yourself',
        'Arabic'
      );
      
      expect(considerations).toContain('Suicide stigma varies significantly across cultures');
      expect(considerations).toContain('Religious or spiritual beliefs may affect responses');
    });
  });

  describe('Cultural Assessment Calculation', () => {
    test('should calculate culturally-adjusted PHQ-9 results', async () => {
      const scores = [2, 1, 3, 2, 1, 2, 1, 0, 0]; // Total: 12
      const answers = ['Several days', 'Not at all', 'Nearly every day'];
      
      mockCulturalContextService.getCulturalContext.mockReturnValue({
        region: 'Chinese',
        mentalHealthStigma: 'high',
        familyInvolvement: 'family-centered',
        crisisEscalation: 'gradual',
        communicationStyle: 'indirect',
      });

      const result = await service.calculateCulturalAssessmentResult(
        'phq-9',
        scores,
        answers,
        'zh',
        'Chinese'
      );
      
      expect(result).toBeDefined();
      expect(result.culturalContext).toBe('Chinese');
      expect(result.culturalFactors).toBeDefined();
      expect(result.culturalFactors.expressionStyle).toBeDefined();
      expect(result.culturalFactors.stigmaLevel).toBeGreaterThan(0);
      expect(result.culturalFactors.familyInvolvement).toBe('family-centered');
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.primary).toBeDefined();
      expect(result.recommendations.cultural).toBeInstanceOf(Array);
      expect(result.privacyMetadata.culturallyAdjusted).toBe(true);
      expect(result.privacyMetadata.biasReductionApplied).toBe(true);
    });

    test('should calculate culturally-adjusted GAD-7 results', async () => {
      const scores = [1, 2, 2, 1, 0, 1, 1]; // Total: 8
      const answers = ['Several days', 'More than half the days'];
      
      mockCulturalContextService.getCulturalContext.mockReturnValue({
        region: 'Arabic',
        mentalHealthStigma: 'high',
        familyInvolvement: 'family-centered',
        crisisEscalation: 'authority-based',
        communicationStyle: 'indirect',
      });

      const result = await service.calculateCulturalAssessmentResult(
        'gad-7',
        scores,
        answers,
        'ar',
        'Arabic'
      );
      
      expect(result.severity).toBeDefined();
      expect(['minimal', 'mild', 'moderate', 'severe']).toContain(result.severity);
      expect(result.culturalFactors.helpSeekingStyle).toBeDefined();
    });

    test('should apply somatic bias adjustment for relevant cultures', () => {
      const somaticBias = (service as unknown).calculateSomaticBias([], 'Chinese');
      expect(somaticBias).toBe(0.1); // 10% adjustment
      
      const noSomaticBias = (service as unknown).calculateSomaticBias([], 'Western');
      expect(noSomaticBias).toBe(0);
    });

    test('should apply expressiveness adjustment for indirect cultures', () => {
      const adjustment = (service as unknown).calculateExpressivenessAdjustment([], {
        communicationStyle: 'indirect'
      });
      expect(adjustment).toBe(0.15); // 15% adjustment
      
      const noAdjustment = (service as unknown).calculateExpressivenessAdjustment([], {
        communicationStyle: 'direct'
      });
      expect(noAdjustment).toBe(0);
    });

    test('should apply stigma adjustment based on stigma level', () => {
      const highStigmaAdjustment = (service as unknown).calculateStigmaAdjustment('phq-9', {
        mentalHealthStigma: 0.8
      });
      expect(highStigmaAdjustment).toBe(0.16); // 0.8 * 0.2 = 0.16
      
      const lowStigmaAdjustment = (service as unknown).calculateStigmaAdjustment('phq-9', {
        mentalHealthStigma: 0.2
      });
      expect(lowStigmaAdjustment).toBe(0.04); // 0.2 * 0.2 = 0.04
    });

    test('should calculate adjusted PHQ-9 severity thresholds', () => {
      const severity = (service as unknown).calculatePhq9Severity(10, 0.7); // High stigma
      // Adjusted thresholds: minimal: 5.4, mild: 10.4, moderate: 15.4, moderatelySevere: 20.4
      expect(severity).toBe('mild'); // Score 10 falls in mild range with adjustment
    });

    test('should calculate adjusted GAD-7 severity thresholds', () => {
      const severity = (service as unknown).calculateGad7Severity(8, 0.5); // Medium stigma
      // Adjusted thresholds: minimal: 4.5, mild: 9.5, moderate: 14.5
      expect(severity).toBe('mild'); // Score 8 falls in mild range with adjustment
    });
  });

  describe('Cultural Recommendations', () => {
    test('should generate Hispanic/Latino cultural recommendations', async () => {
      const recommendations = (service as unknown).getCulturalRecommendations(
        'moderate',
        'hispanic_latino',
        'religious'
      );
      
      expect(recommendations).toContain('Consider speaking with a trusted family member or community elder');
      expect(recommendations).toContain('Explore culturally-informed therapy options with bilingual providers');
      expect(recommendations).toContain('Connect with your spiritual community for additional support');
    });

    test('should generate Arabic cultural recommendations', async () => {
      const recommendations = (service as unknown).getCulturalRecommendations(
        'moderate',
        'arabic',
        'traditional'
      );
      
      expect(recommendations).toContain('Consider involving family in your healing process if culturally appropriate');
      expect(recommendations).toContain('Look for mental health providers familiar with Islamic values and perspectives');
      expect(recommendations).toContain('Combine professional support with traditional wellness practices');
    });

    test('should generate Chinese cultural recommendations', async () => {
      const recommendations = (service as unknown).getCulturalRecommendations(
        'mild',
        'chinese',
        'professional'
      );
      
      expect(recommendations).toContain('Consider holistic approaches that address mind-body wellness');
      expect(recommendations).toContain('Explore providers who understand concepts like emotional balance and harmony');
      expect(recommendations).toContain('Family support may be beneficial in your healing journey');
    });

    test('should provide language-specific crisis resources', () => {
      const spanishResources = (service as unknown).getCulturalResources('hispanic_latino', 'es');
      expect(spanishResources).toContain('National Suicide Prevention Lifeline en Español: 1-888-628-9454');
      expect(spanishResources).toContain('Crisis Text Line: Text HOLA to 741741');
      
      const arabicResources = (service as unknown).getCulturalResources('arabic', 'ar');
      expect(arabicResources).toContain('Arab Community Center for Economic and Social Services (ACCESS)');
      expect(arabicResources).toContain('Muslim Mental Health resources');
      
      const chineseResources = (service as unknown).getCulturalResources('chinese', 'zh');
      expect(chineseResources).toContain('Asian Mental Health Collective');
    });

    test('should provide culturally appropriate family guidance', () => {
      const familyInclusiveGuidance = (service as unknown).getFamilyGuidance(
        'moderate',
        'hispanic_latino',
        'family-inclusive'
      );
      expect(familyInclusiveGuidance).toContain('family support is often crucial for healing');
      
      const communityOrientedGuidance = (service as unknown).getFamilyGuidance(
        'mild',
        'arabic',
        'community-oriented'
      );
      expect(communityOrientedGuidance).toContain('Community support can be valuable');
    });

    test('should generate base recommendations by severity', () => {
      const minimalRec = (service as unknown).getBaseRecommendations('minimal', 'phq-9');
      expect(minimalRec).toContain('minimal depression symptoms');
      
      const severeRec = (service as unknown).getBaseRecommendations('severe', 'gad-7');
      expect(severeRec).toContain('severe anxiety symptoms');
      expect(severeRec).toContain('strongly recommend seeking professional help');
    });
  });

  describe('Assessment Submission', () => {
    test('should submit cultural assessment with privacy preservation', async () => {
      const assessmentData = {
        userToken: 'user-123-token',
        type: 'phq-9' as const,
        scores: [2, 1, 3, 2, 1, 2, 1, 0, 0],
        answers: ['Several days', 'Not at all', 'Nearly every day'],
        languageCode: 'es',
        culturalContext: 'Hispanic/Latino',
        sessionDuration: 15000,
      };

      mockCulturalContextService.getCulturalContext.mockReturnValue({
        region: 'Hispanic/Latino',
        mentalHealthStigma: 'high',
        familyInvolvement: 'family-centered',
        crisisEscalation: 'gradual',
        communicationStyle: 'contextual',
      });

      const result = await service.submitCulturalAssessment(assessmentData);
      
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^cultural_assessment_/);
      expect(result.userToken).toBe('user-123-_anonymized'); // Anonymized
      expect(result.culturalContext).toBe('Hispanic/Latino');
      expect(result.languageCode).toBe('es');
      expect(result.culturalAdaptationsUsed).toContain('phq-9_cultural_adaptation');
      expect(result.privacyPreserved).toBe(true);
      
      expect(mockPrivacyAnalyticsService.recordInterventionOutcome).toHaveBeenCalledWith({
        sessionId: result.id,
        userToken: result.userToken,
        language: 'es',
        interventionType: 'safety-plan',
        initialRiskLevel: expect.any(Number),
        finalRiskLevel: expect.any(Number),
        sessionDuration: 15000,
        feedback: undefined,
      });
    });

    test('should handle assessment submission errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Make cultural context service throw
      mockCulturalContextService.getCulturalContext.mockImplementation(() => {
        throw new Error('Context service error');
      });

      const assessmentData = {
        userToken: 'user-123',
        type: 'phq-9' as const,
        scores: [1, 1, 1],
        answers: ['test'],
        languageCode: 'en',
        sessionDuration: 10000,
      };

      await expect(service.submitCulturalAssessment(assessmentData)).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cultural Analytics', () => {
    test('should get cultural assessment analytics', async () => {
      const analytics = await service.getCulturalAssessmentAnalytics('Western');
      
      expect(analytics.effectiveness).toBeDefined();
      expect(analytics.culturalInsights).toBeInstanceOf(Array);
      expect(analytics.recommendations).toBeInstanceOf(Array);
      expect(analytics.privacyCompliant).toBe(true);
      
      expect(mockPrivacyAnalyticsService.generateEffectivenessReport).toHaveBeenCalled();
    });

    test('should filter analytics by cultural context', async () => {
      mockPrivacyAnalyticsService.generateEffectivenessReport.mockResolvedValue({
        summary: "effectiveness: 0.9",
        culturalInsights: [
          'Western culture shows direct communication',
          'Hispanic culture prefers family involvement',
          'Western individuals seek professional help'
        ],
        recommendations: ['Test recommendation'],
        limitations: ['Sample size limitations for cultural analysis']
      });

      const analytics = await service.getCulturalAssessmentAnalytics('Western');
      
      expect(analytics.culturalInsights).toHaveLength(2); // Only Western-related insights
      expect(analytics.culturalInsights.every((insight: string) => 
        insight.toLowerCase().includes('western')
      )).toBe(true);
    });

    test('should handle analytics errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockPrivacyAnalyticsService.generateEffectivenessReport.mockRejectedValue(
        new Error('Analytics error')
      );

      await expect(service.getCulturalAssessmentAnalytics()).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should record analytics with error handling', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockPrivacyAnalyticsService.recordInterventionOutcome.mockRejectedValue(
        new Error('Recording error')
      );

      const assessment = {
        id: 'test-assessment',
        userToken: 'test-token',
        languageCode: 'en',
      };

      const result = {
        score: 10,
      };

      // Should not throw even if analytics fails
      await (service as unknown).recordCulturalAnalytics(assessment, result, 15000);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Cultural Assessment] Failed to record analytics:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Helper Methods', () => {
    test('should generate unique assessment IDs', () => {
      const id1 = (service as unknown).generateAssessmentId();
      const id2 = (service as unknown).generateAssessmentId();
      
      expect(id1).toMatch(/^cultural_assessment_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^cultural_assessment_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    test('should anonymize user tokens', () => {
      const token = 'user-123-very-long-token';
      const anonymized = (service as unknown).anonymizeUserToken(token);
      
      expect(anonymized).toBe('user-123_anonymized');
    });

    test('should get cultural adaptations used', () => {
      const adaptations = (service as unknown).getCulturalAdaptationsUsed('phq-9', 'Chinese');
      
      expect(adaptations).toContain('phq-9_cultural_adaptation');
      expect(adaptations).toContain('Chinese_context_applied');
      expect(adaptations).toContain('bias_reduction_applied');
      expect(adaptations).toContain('cultural_scoring_adjustment');
    });

    test('should analyze cultural expression patterns', () => {
      const patterns = (service as unknown).analyzeExpressionPatterns(
        ['I feel sad', 'I worry too much'],
        'Western'
      );
      
      expect(patterns.style).toBe('direct'); // Default for now
    });

    test('should get relevant expression patterns for questions', () => {
      const patterns = (service as unknown).getRelevantExpressionPatterns(
        'feeling down or depressed',
        {
          depression: {
            emotional: ['sad', 'hopeless'],
            somatic: ['tired', 'pain'],
            behavioral: ['withdrawn'],
            cultural: ['stressed']
          },
          anxiety: { physical: [], cognitive: [], social: [], spiritual: [] },
          helpSeeking: { direct: [], indirect: [], metaphorical: [], traditional: [] }
        }
      );
      
      expect(patterns).toContain('sad');
      expect(patterns).toContain('hopeless');
    });

    test('should generate alternative phrasings', () => {
      const alternatives = (service as unknown).generateAlternativePhrasings(
        'feeling depressed',
        {},
        'en'
      );
      
      expect(alternatives).toContain('feeling heavy-hearted');
      expect(alternatives).toContain('experiencing sadness');
      expect(alternatives).toContain('feeling low spirits');
    });
  });

  describe('Base Assessment Questions', () => {
    test('should provide complete PHQ-9 questions', () => {
      const questions = (service as unknown).getBaseAssessmentQuestions('phq-9');
      
      expect(questions).toHaveLength(9);
      expect(questions[0].text).toContain('Little interest or pleasure');
      expect(questions[1].text).toContain('Feeling down, depressed');
      expect(questions[8].text).toContain('thoughts that you would be better off dead');
      
      questions.forEach((question: any) => {
        expect(question.options).toHaveLength(4);
        expect(question.options[0].value).toBe(0);
        expect(question.options[3].value).toBe(3);
      });
    });

    test('should provide complete GAD-7 questions', () => {
      const questions = (service as unknown).getBaseAssessmentQuestions('gad-7');
      
      expect(questions).toHaveLength(7);
      expect(questions[0].text).toContain('Feeling nervous, anxious');
      expect(questions[1].text).toContain('Not being able to stop or control worrying');
      expect(questions[6].text).toContain('Feeling afraid, as if something awful might happen');
      
      questions.forEach((question: any) => {
        expect(question.options).toHaveLength(4);
        expect(question.options[0].text).toBe('Not at all');
        expect(question.options[3].text).toBe('Nearly every day');
      });
    });
  });

  describe('Singleton Instance', () => {
    test('should export singleton instance', () => {
      expect(culturalAssessmentService).toBeInstanceOf(CulturalAssessmentService);
    });

    test('should maintain same instance', () => {
      const instance1 = culturalAssessmentService;
      const instance2 = culturalAssessmentService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Error Handling', () => {
    test('should handle cultural question adaptation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock an error in the adaptation process
      const originalGetBaseQuestions = (service as unknown).getBaseAssessmentQuestions;
      (service as unknown).getBaseAssessmentQuestions = jest.fn(() => {
        throw new Error('Question adaptation error');
      });

      await expect(service.getCulturalAssessmentQuestions('phq-9', 'en')).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore
      (service as unknown).getBaseAssessmentQuestions = originalGetBaseQuestions;
      consoleSpy.mockRestore();
    });

    test('should handle calculation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock context service to throw
      mockCulturalContextService.getCulturalContext.mockImplementation(() => {
        throw new Error('Context error');
      });

      await expect(service.calculateCulturalAssessmentResult(
        'phq-9',
        [1, 2, 3],
        ['test'],
        'en'
      )).rejects.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle missing cultural patterns gracefully', () => {
      const patterns = (service as unknown).getRelevantExpressionPatterns(
        'unknown question type',
        undefined
      );
      
      expect(patterns).toEqual([]);
    });
  });
});
