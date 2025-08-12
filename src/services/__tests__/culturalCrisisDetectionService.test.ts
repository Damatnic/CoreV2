/**
 * Test Suite for Cultural Crisis Detection Service
 * Tests culturally-aware crisis detection across different backgrounds
 */

import { culturalCrisisDetectionService } from '../culturalCrisisDetectionService';

describe('CulturalCrisisDetectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    culturalCrisisDetectionService.reset();
  });

  describe('Cultural Context Recognition', () => {
    it('should detect crisis with cultural context', async () => {
      const text = 'I am bringing shame to my family';
      const culturalContext = 'east-asian';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        culturalContext,
        'en'
      );
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(true);
      expect(result.culturalFactors).toContain('family_honor');
      expect(result.culturalWeight).toBeGreaterThan(0.5);
    });

    it('should recognize collectivist vs individualist expressions', async () => {
      const collectivistText = 'I am a burden to my community';
      const individualistText = 'I feel like a personal failure';
      
      const collectResult = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        collectivistText,
        'south-asian',
        'en'
      );
      
      const individResult = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        individualistText,
        'western-european',
        'en'
      );
      
      expect(collectResult.culturalOrientation).toBe('collectivist');
      expect(individResult.culturalOrientation).toBe('individualist');
      expect(collectResult.communityFactorWeight).toBeGreaterThan(individResult.communityFactorWeight);
    });

    it('should detect culturally-specific idioms of distress', async () => {
      const text = 'My heart is tired';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'west-african',
        'en'
      );
      
      expect(result.detected).toBe(true);
      expect(result.idiomOfDistress).toBe(true);
      expect(result.culturalExpression).toBe('emotional_exhaustion');
      expect(result.severity).toBeOneOf(['medium', 'high']);
    });
  });

  describe('Religious and Spiritual Contexts', () => {
    it('should consider religious expressions of crisis', async () => {
      const text = 'I feel God has abandoned me';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'latin-american',
        'en',
        { religious: 'christian' }
      );
      
      expect(result.detected).toBe(true);
      expect(result.spiritualCrisis).toBe(true);
      expect(result.culturalFactors).toContain('spiritual_distress');
    });

    it('should handle fatalistic expressions appropriately', async () => {
      const text = 'It is written in my fate to suffer';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'middle-eastern',
        'en'
      );
      
      expect(result.detected).toBe(true);
      expect(result.fatalisticThinking).toBe(true);
      expect(result.culturallyNormative).toBe('partial');
      expect(result.requiresCulturallyInformedIntervention).toBe(true);
    });
  });

  describe('Language and Expression Patterns', () => {
    it('should detect crisis in culturally-specific expressions', async () => {
      const text = 'No tengo ganas de vivir'; // Spanish: "I don't feel like living"
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'latin-american',
        'es'
      );
      
      expect(result.detected).toBe(true);
      expect(result.linguisticPattern).toBe('spanish_despair');
      expect(result.severity).toBeOneOf(['high', 'critical']);
    });

    it('should understand indirect communication styles', async () => {
      const text = 'Perhaps it would be better if I were not here';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'japanese',
        'en'
      );
      
      expect(result.detected).toBe(true);
      expect(result.communicationStyle).toBe('indirect');
      expect(result.impliedSeverity).toBeGreaterThan(result.explicitSeverity);
    });

    it('should recognize somatic expressions of distress', async () => {
      const text = 'My body aches with sadness, I cannot eat or sleep';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'chinese',
        'en'
      );
      
      expect(result.detected).toBe(true);
      expect(result.somaticExpression).toBe(true);
      expect(result.culturalFactors).toContain('body_mind_connection');
    });
  });

  describe('Family and Social Dynamics', () => {
    it('should consider family-related crisis expressions', async () => {
      const text = 'I cannot face my parents after this failure';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'south-asian',
        'en'
      );
      
      expect(result.detected).toBe(true);
      expect(result.familyDynamicsInvolved).toBe(true);
      expect(result.culturalStressors).toContain('parental_expectations');
      expect(result.severity).toBeOneOf(['medium', 'high']);
    });

    it('should detect honor-based distress', async () => {
      const text = 'I have dishonored my family name';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'middle-eastern',
        'en'
      );
      
      expect(result.detected).toBe(true);
      expect(result.honorBasedDistress).toBe(true);
      expect(result.culturalRiskFactors).toContain('honor_shame');
      expect(result.requiresSpecializedIntervention).toBe(true);
    });
  });

  describe('Age and Gender Considerations', () => {
    it('should factor in cultural age expectations', async () => {
      const text = 'At my age, I should have achieved more';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'korean',
        'en',
        { age: 30 }
      );
      
      expect(result.detected).toBe(true);
      expect(result.ageRelatedPressure).toBe(true);
      expect(result.culturalMilestoneStress).toBe(true);
    });

    it('should recognize gendered expressions of crisis', async () => {
      const text = 'As a man, I cannot show this weakness';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'latino',
        'en',
        { gender: 'male' }
      );
      
      expect(result.detected).toBe(true);
      expect(result.genderRoleConflict).toBe(true);
      expect(result.culturalFactors).toContain('machismo');
      expect(result.barriersToHelpSeeking).toContain('gender_norms');
    });
  });

  describe('Immigration and Acculturation', () => {
    it('should detect acculturation stress', async () => {
      const text = 'I do not belong anywhere, not here nor back home';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'immigrant',
        'en',
        { generationStatus: 'first' }
      );
      
      expect(result.detected).toBe(true);
      expect(result.acculturationStress).toBe(true);
      expect(result.identityConflict).toBe(true);
      expect(result.culturalFactors).toContain('bicultural_stress');
    });

    it('should recognize intergenerational conflict', async () => {
      const text = 'My parents do not understand my American values';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'asian-american',
        'en',
        { generationStatus: 'second' }
      );
      
      expect(result.detected).toBe(true);
      expect(result.intergenerationalConflict).toBe(true);
      expect(result.culturalGap).toBe('significant');
    });
  });

  describe('Culturally-Appropriate Responses', () => {
    it('should provide culturally-sensitive interventions', async () => {
      const text = 'I need help but cannot shame my family';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'east-asian',
        'en'
      );
      
      expect(result.interventionRecommendations).toBeDefined();
      expect(result.interventionRecommendations).toContain('family_inclusive_therapy');
      expect(result.interventionRecommendations).toContain('face_saving_approach');
      expect(result.culturallySafeResources).toBeDefined();
    });

    it('should suggest community-based support for collectivist cultures', async () => {
      const text = 'I am struggling and need support';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'african',
        'en'
      );
      
      expect(result.supportRecommendations).toContain('community_elders');
      expect(result.supportRecommendations).toContain('peer_support_groups');
      expect(result.individualTherapyOnly).toBe(false);
    });
  });

  describe('Stigma and Help-Seeking', () => {
    it('should identify stigma-related barriers', async () => {
      const text = 'I cannot seek help, people will think I am crazy';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'south-asian',
        'en'
      );
      
      expect(result.detected).toBe(true);
      expect(result.stigmaBarrier).toBe(true);
      expect(result.stigmaType).toBe('mental_health');
      expect(result.alternativeInterventions).toContain('anonymous_support');
    });

    it('should recognize cultural help-seeking preferences', async () => {
      const text = 'I need guidance from someone who understands';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'native-american',
        'en'
      );
      
      expect(result.preferredHelpers).toContain('cultural_elder');
      expect(result.preferredHelpers).toContain('traditional_healer');
      expect(result.culturallyMatchedProvider).toBe(true);
    });
  });

  describe('Risk Assessment Adjustments', () => {
    it('should adjust risk levels based on cultural factors', async () => {
      const text = 'Life has no meaning';
      
      const westernResult = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'western',
        'en'
      );
      
      const buddhistResult = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'buddhist',
        'en'
      );
      
      // Buddhist context might interpret differently due to concepts of impermanence
      expect(westernResult.severity).toBeGreaterThanOrEqual(buddhistResult.adjustedSeverity);
      expect(buddhistResult.culturalInterpretation).toBeDefined();
    });

    it('should consider protective cultural factors', async () => {
      const text = 'I am going through hard times';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'pacific-islander',
        'en',
        { communityConnected: true }
      );
      
      expect(result.protectiveFactors).toContain('strong_community_ties');
      expect(result.protectiveFactors).toContain('cultural_identity');
      expect(result.adjustedRisk).toBeLessThan(result.baseRisk);
    });
  });

  describe('Multi-cultural Competence', () => {
    it('should handle mixed cultural backgrounds', async () => {
      const text = 'Struggling with my identity';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'mixed',
        'en',
        { cultures: ['hispanic', 'asian'] }
      );
      
      expect(result.multiculturalFactors).toBe(true);
      expect(result.complexIdentity).toBe(true);
      expect(result.interventionRecommendations).toContain('multicultural_counseling');
    });

    it('should avoid cultural stereotyping', async () => {
      const text = 'I need professional help';
      
      const result = await culturalCrisisDetectionService.analyzeWithCulturalContext(
        text,
        'african-american',
        'en'
      );
      
      expect(result.stereotypeAvoided).toBe(true);
      expect(result.individualizedAssessment).toBe(true);
      expect(result.culturalFactorsConsidered).toBe(true);
      expect(result.notAssumed).toBeDefined();
    });
  });
});