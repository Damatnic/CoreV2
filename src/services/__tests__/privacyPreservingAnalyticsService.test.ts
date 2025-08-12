import { PrivacyPreservingAnalyticsService } from '../privacyPreservingAnalyticsService';

// Mock crypto APIs
const mockCrypto = {
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  subtle: {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(64)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  }
};

Object.defineProperty(window, 'crypto', { value: mockCrypto });

describe('PrivacyPreservingAnalyticsService', () => {
  let service: PrivacyPreservingAnalyticsService;

  beforeEach(() => {
    service = new PrivacyPreservingAnalyticsService();
    jest.clearAllMocks();
  });

  describe('data anonymization', () => {
    it('should anonymize user identifiers', async () => {
      const sensitiveData = {
        userId: 'user-123',
        email: 'test@example.com',
        sessionId: 'session-456',
        ipAddress: '192.168.1.1'
      };

      const anonymized = await service.anonymizeData(sensitiveData);

      expect(anonymized.userId).not.toBe(sensitiveData.userId);
      expect(anonymized.email).toBeUndefined();
      expect(anonymized.sessionId).not.toBe(sensitiveData.sessionId);
      expect(anonymized.ipAddress).toBeUndefined();
      expect(anonymized.userIdHash).toBeDefined();
    });

    it('should preserve non-sensitive analytics data', async () => {
      const analyticsData = {
        userId: 'user-123',
        action: 'page_view',
        page: '/crisis-resources',
        timestamp: Date.now(),
        duration: 5000,
        browserType: 'chrome'
      };

      const anonymized = await service.anonymizeData(analyticsData);

      expect(anonymized.action).toBe(analyticsData.action);
      expect(anonymized.page).toBe(analyticsData.page);
      expect(anonymized.timestamp).toBe(analyticsData.timestamp);
      expect(anonymized.duration).toBe(analyticsData.duration);
      expect(anonymized.browserType).toBe(analyticsData.browserType);
    });

    it('should apply differential privacy noise', async () => {
      const numericData = {
        sessionDuration: 300,
        pageViews: 5,
        clickCount: 10
      };

      const privatized = await service.applyDifferentialPrivacy(numericData, 1.0);

      expect(privatized.sessionDuration).not.toBe(numericData.sessionDuration);
      expect(privatized.pageViews).not.toBe(numericData.pageViews);
      expect(privatized.clickCount).not.toBe(numericData.clickCount);
      
      // Values should be close but not exact
      expect(Math.abs(privatized.sessionDuration - numericData.sessionDuration)).toBeLessThan(100);
    });
  });

  describe('intervention outcome tracking', () => {
    it('should track crisis intervention outcomes anonymously', async () => {
      const outcome = {
        interventionType: 'crisis_chat',
        initialRiskLevel: 'high',
        finalRiskLevel: 'medium',
        interventionDuration: 1800,
        resourcesProvided: ['hotline', 'safety_plan'],
        userSatisfaction: 4,
        followUpCompleted: true
      };

      const tracked = await service.trackInterventionOutcome(outcome);

      expect(tracked.id).toBeDefined();
      expect(tracked.interventionType).toBe(outcome.interventionType);
      expect(tracked.riskLevelImprovement).toBe('improved');
      expect(tracked.anonymized).toBe(true);
      expect(tracked.timestamp).toBeDefined();
    });

    it('should aggregate intervention effectiveness metrics', async () => {
      const outcomes = [
        { initialRiskLevel: 'high', finalRiskLevel: 'low', userSatisfaction: 5 },
        { initialRiskLevel: 'medium', finalRiskLevel: 'low', userSatisfaction: 4 },
        { initialRiskLevel: 'high', finalRiskLevel: 'medium', userSatisfaction: 3 }
      ];

      const metrics = await service.aggregateInterventionMetrics(outcomes);

      expect(metrics.totalInterventions).toBe(3);
      expect(metrics.averageSatisfaction).toBeCloseTo(4.0);
      expect(metrics.riskReductionRate).toBeGreaterThan(0.5);
      expect(metrics.effectivenessScore).toBeDefined();
    });

    it('should track long-term outcome trends', async () => {
      const longitudinalData = [
        { week: 1, riskReduction: 0.3, satisfaction: 4.0 },
        { week: 2, riskReduction: 0.4, satisfaction: 4.2 },
        { week: 3, riskReduction: 0.5, satisfaction: 4.3 }
      ];

      const trends = await service.analyzeLongTermTrends(longitudinalData);

      expect(trends.riskReductionTrend).toBe('improving');
      expect(trends.satisfactionTrend).toBe('improving');
      expect(trends.trendStrength).toBeGreaterThan(0.7);
    });
  });

  describe('cultural effectiveness metrics', () => {
    it('should measure intervention effectiveness by cultural context', async () => {
      const culturalData = [
        { culturalContext: 'western', outcome: 'improved', satisfaction: 4.5 },
        { culturalContext: 'eastern', outcome: 'improved', satisfaction: 4.2 },
        { culturalContext: 'hispanic', outcome: 'no_change', satisfaction: 3.8 }
      ];

      const metrics = await service.analyzeCulturalEffectiveness(culturalData);

      expect(metrics.byContext.western.effectivenessRate).toBeGreaterThan(0.8);
      expect(metrics.byContext.eastern.averageSatisfaction).toBeCloseTo(4.2);
      expect(metrics.culturalAdaptationNeeded).toContain('hispanic');
    });

    it('should identify cultural barriers to effective intervention', async () => {
      const barrierData = [
        { culturalContext: 'conservative', barrier: 'stigma_family_involvement' },
        { culturalContext: 'collectivist', barrier: 'individual_vs_group_focus' },
        { culturalContext: 'religious', barrier: 'spiritual_vs_medical_approach' }
      ];

      const barriers = await service.identifyCulturalBarriers(barrierData);

      expect(barriers.topBarriers).toContain('stigma_family_involvement');
      expect(barriers.recommendedAdaptations).toBeDefined();
      expect(barriers.culturalSensitivityScore).toBeDefined();
    });

    it('should recommend culturally adapted interventions', async () => {
      const contextData = {
        culturalBackground: 'collectivist',
        familyInvolvement: 'high',
        religiousConsiderations: 'important',
        communicationStyle: 'indirect'
      };

      const recommendations = await service.recommendCulturalAdaptations(contextData);

      expect(recommendations.adaptations).toContain('include_family_support');
      expect(recommendations.communicationStyle).toBe('indirect_approach');
      expect(recommendations.resourceModifications).toBeDefined();
    });
  });

  describe('privacy-preserving aggregations', () => {
    it('should create k-anonymous datasets', async () => {
      const sensitiveData = [
        { age: 25, gender: 'F', zipCode: '12345', riskLevel: 'medium' },
        { age: 26, gender: 'F', zipCode: '12346', riskLevel: 'high' },
        { age: 27, gender: 'M', zipCode: '12347', riskLevel: 'low' },
        { age: 28, gender: 'M', zipCode: '12348', riskLevel: 'medium' }
      ];

      const kAnonymous = await service.createKAnonymousDataset(sensitiveData, 2);

      expect(kAnonymous.every(record => record.zipCode.endsWith('***'))).toBe(true);
      expect(kAnonymous.every(record => 
        kAnonymous.filter(r => 
          r.ageRange === record.ageRange && 
          r.gender === record.gender
        ).length >= 2
      )).toBe(true);
    });

    it('should apply l-diversity for sensitive attributes', async () => {
      const data = [
        { demographics: 'young_female', diagnosis: 'anxiety' },
        { demographics: 'young_female', diagnosis: 'depression' },
        { demographics: 'young_male', diagnosis: 'anxiety' },
        { demographics: 'young_male', diagnosis: 'bipolar' }
      ];

      const lDiverse = await service.applyLDiversity(data, 'diagnosis', 2);

      // Each demographics group should have at least 2 different diagnoses
      const groupedByDemo = lDiverse.reduce((acc, record) => {
        if (!acc[record.demographics]) acc[record.demographics] = [];
        acc[record.demographics].push(record.diagnosis);
        return acc;
      }, {} as Record<string, string[]>);

      Object.values(groupedByDemo).forEach(diagnoses => {
        const uniqueDiagnoses = new Set(diagnoses);
        expect(uniqueDiagnoses.size).toBeGreaterThanOrEqual(2);
      });
    });

    it('should implement t-closeness for distribution similarity', async () => {
      const globalDistribution = { anxiety: 0.4, depression: 0.3, bipolar: 0.2, other: 0.1 };
      
      const data = [
        { group: 'A', condition: 'anxiety' },
        { group: 'A', condition: 'depression' },
        { group: 'B', condition: 'anxiety' },
        { group: 'B', condition: 'bipolar' }
      ];

      const tClose = await service.applyTCloseness(data, globalDistribution, 0.2);

      expect(tClose.satisfiesTCloseness).toBe(true);
      expect(tClose.maxDistance).toBeLessThanOrEqual(0.2);
    });
  });

  describe('secure aggregation', () => {
    it('should perform secure multi-party computation', async () => {
      const parties = [
        { data: [10, 20, 30] },
        { data: [15, 25, 35] },
        { data: [12, 22, 32] }
      ];

      const secureSum = await service.secureAggregation(parties, 'sum');

      expect(secureSum.result).toEqual([37, 67, 97]);
      expect(secureSum.privacy_preserved).toBe(true);
      expect(secureSum.parties_count).toBe(3);
    });

    it('should compute secure averages', async () => {
      const data = [
        { satisfaction: 4.2, encrypted: true },
        { satisfaction: 3.8, encrypted: true },
        { satisfaction: 4.5, encrypted: true }
      ];

      const secureAverage = await service.computeSecureAverage(data, 'satisfaction');

      expect(secureAverage.average).toBeCloseTo(4.17, 1);
      expect(secureAverage.count).toBe(3);
      expect(secureAverage.privacy_preserved).toBe(true);
    });

    it('should create homomorphically encrypted aggregates', async () => {
      const values = [100, 200, 300, 400];

      const encrypted = await service.homomorphicEncryption(values);
      const sum = await service.homomorphicSum(encrypted.ciphertexts);
      const decrypted = await service.homomorphicDecrypt(sum, encrypted.privateKey);

      expect(decrypted).toBe(1000);
    });
  });

  describe('federated analytics', () => {
    it('should coordinate federated learning', async () => {
      const localModels = [
        { weights: [0.1, 0.2, 0.3], samples: 100 },
        { weights: [0.15, 0.25, 0.35], samples: 150 },
        { weights: [0.12, 0.22, 0.32], samples: 120 }
      ];

      const globalModel = await service.federatedAggregation(localModels);

      expect(globalModel.weights).toHaveLength(3);
      expect(globalModel.totalSamples).toBe(370);
      expect(globalModel.privacy_budget_used).toBeLessThan(1.0);
    });

    it('should implement federated averaging with privacy budget', async () => {
      const updates = [
        { gradient: [0.01, 0.02], epsilon_used: 0.1 },
        { gradient: [0.015, 0.025], epsilon_used: 0.1 },
        { gradient: [0.008, 0.018], epsilon_used: 0.1 }
      ];

      const averaged = await service.federatedAveraging(updates, 1.0);

      expect(averaged.global_gradient).toHaveLength(2);
      expect(averaged.total_epsilon_used).toBeCloseTo(0.3);
      expect(averaged.privacy_budget_remaining).toBeCloseTo(0.7);
    });
  });

  describe('analytics insights generation', () => {
    it('should generate privacy-preserving usage insights', async () => {
      const usageData = [
        { feature: 'crisis_chat', usage_count: 150, satisfaction: 4.2 },
        { feature: 'safety_plan', usage_count: 200, satisfaction: 4.5 },
        { feature: 'peer_support', usage_count: 100, satisfaction: 4.0 }
      ];

      const insights = await service.generateUsageInsights(usageData);

      expect(insights.most_used_feature).toBe('safety_plan');
      expect(insights.highest_satisfaction).toBe('safety_plan');
      expect(insights.improvement_opportunities).toBeDefined();
      expect(insights.privacy_preserved).toBe(true);
    });

    it('should analyze effectiveness patterns without revealing sensitive data', async () => {
      const patterns = await service.analyzeEffectivenessPatterns();

      expect(patterns.intervention_success_rates).toBeDefined();
      expect(patterns.temporal_trends).toBeDefined();
      expect(patterns.demographic_insights.age_groups).toBeDefined();
      expect(patterns.sensitive_data_excluded).toBe(true);
    });

    it('should provide actionable recommendations', async () => {
      const metrics = {
        crisis_response_time: 300,
        user_satisfaction: 4.1,
        intervention_success_rate: 0.85,
        cultural_adaptation_score: 0.7
      };

      const recommendations = await service.generateRecommendations(metrics);

      expect(recommendations.priority_improvements).toBeDefined();
      expect(recommendations.cultural_adaptations).toBeDefined();
      expect(recommendations.resource_allocations).toBeDefined();
      expect(recommendations.confidence_level).toBeGreaterThan(0.5);
    });
  });

  describe('data retention and deletion', () => {
    it('should implement data retention policies', async () => {
      const retentionPolicies = await service.getDataRetentionPolicies();

      expect(retentionPolicies.analytics_data).toBe('1_year');
      expect(retentionPolicies.aggregated_insights).toBe('indefinite');
      expect(retentionPolicies.personal_identifiers).toBe('immediate_deletion');
    });

    it('should purge expired data automatically', async () => {
      const purgeResult = await service.purgeExpiredData();

      expect(purgeResult.records_purged).toBeGreaterThanOrEqual(0);
      expect(purgeResult.anonymized_data_retained).toBe(true);
      expect(purgeResult.compliance_verified).toBe(true);
    });

    it('should handle right to be forgotten requests', async () => {
      const deletionRequest = {
        userId: 'user-123',
        requestType: 'complete_deletion',
        verification: 'verified'
      };

      const result = await service.processRightToBeForgotten(deletionRequest);

      expect(result.deletion_completed).toBe(true);
      expect(result.anonymized_analytics_retained).toBe(true);
      expect(result.compliance_report).toBeDefined();
    });
  });

  describe('privacy compliance monitoring', () => {
    it('should audit privacy compliance continuously', async () => {
      const audit = await service.performPrivacyAudit();

      expect(audit.anonymization_rate).toBeGreaterThan(0.95);
      expect(audit.data_minimization_score).toBeGreaterThan(0.8);
      expect(audit.encryption_coverage).toBeGreaterThan(0.99);
      expect(audit.violations_detected).toBe(0);
    });

    it('should generate compliance reports', async () => {
      const report = await service.generateComplianceReport('quarterly');

      expect(report.period).toBe('quarterly');
      expect(report.gdpr_compliance).toBe('compliant');
      expect(report.hipaa_compliance).toBe('compliant');
      expect(report.data_processing_activities).toBeDefined();
    });

    it('should track consent and purposes', async () => {
      const consentTracking = await service.getConsentTrackingReport();

      expect(consentTracking.active_consents).toBeDefined();
      expect(consentTracking.expired_consents).toBeDefined();
      expect(consentTracking.purpose_limitations_enforced).toBe(true);
      expect(consentTracking.withdrawal_processing_time).toBeLessThan(24);
    });
  });
});

// Add method stubs for testing
declare module '../privacyPreservingAnalyticsService' {
  interface PrivacyPreservingAnalyticsService {
    anonymizeData(data: any): Promise<any>;
    applyDifferentialPrivacy(data: any, epsilon: number): Promise<any>;
    trackInterventionOutcome(outcome: any): Promise<any>;
    aggregateInterventionMetrics(outcomes: any[]): Promise<any>;
    analyzeLongTermTrends(data: any[]): Promise<any>;
    analyzeCulturalEffectiveness(data: any[]): Promise<any>;
    identifyCulturalBarriers(data: any[]): Promise<any>;
    recommendCulturalAdaptations(context: any): Promise<any>;
    createKAnonymousDataset(data: any[], k: number): Promise<any[]>;
    applyLDiversity(data: any[], sensitiveAttr: string, l: number): Promise<any[]>;
    applyTCloseness(data: any[], distribution: any, t: number): Promise<any>;
    secureAggregation(parties: any[], operation: string): Promise<any>;
    computeSecureAverage(data: any[], field: string): Promise<any>;
    homomorphicEncryption(values: number[]): Promise<any>;
    homomorphicSum(ciphertexts: any[]): Promise<any>;
    homomorphicDecrypt(ciphertext: any, privateKey: any): Promise<number>;
    federatedAggregation(models: any[]): Promise<any>;
    federatedAveraging(updates: any[], privacyBudget: number): Promise<any>;
    generateUsageInsights(data: any[]): Promise<any>;
    analyzeEffectivenessPatterns(): Promise<any>;
    generateRecommendations(metrics: any): Promise<any>;
    getDataRetentionPolicies(): Promise<any>;
    purgeExpiredData(): Promise<any>;
    processRightToBeForgotten(request: any): Promise<any>;
    performPrivacyAudit(): Promise<any>;
    generateComplianceReport(period: string): Promise<any>;
    getConsentTrackingReport(): Promise<any>;
  }
}