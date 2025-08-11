/**
 * Simplified browser-compatible crisis detection service
 * Temporary stub to avoid natural.js dependency issues
 */

export interface MLCrisisAnalysisResult {
  crisisLevel: number;
  confidence: number;
  riskFactors: string[];
  immediateAction: boolean;
  recommendations: string[];
  culturalContext?: any;
  // Additional properties for enhanced crisis detection
  psychologicalAssessment?: {
    depressionIndicators: number;
    anxietyIndicators: number;
    suicidalIdeation: number;
  };
  behavioralPattern?: {
    communicationStyle: string;
    helpSeekingBehavior: string;
    escalationTriggers: string[];
  };
  biasAdjustments?: Array<{
    type: string;
    description: string;
    severity: number;
  }>;
  // Legacy properties for backward compatibility
  hasCrisisIndicators?: boolean;
  realTimeRisk?: {
    immediateRisk: number;
    interventionUrgency: number;
    recommendedInterventions: Array<{
      priority: number;
      description: string;
    }>;
  };
  emotionalState?: any;
  mlConfidence?: number; // Alias for confidence
}

class EnhancedAICrisisDetectionService {
  async analyzeCrisisWithML(text: string, context?: any): Promise<MLCrisisAnalysisResult> {
    // Simple keyword-based crisis detection for browser compatibility
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'can\'t go on', 'hopeless', 'worthless'];
    const lowerText = text.toLowerCase();
    
    const matchedKeywords = crisisKeywords.filter(keyword => lowerText.includes(keyword));
    const crisisLevel = matchedKeywords.length > 0 ? Math.min(matchedKeywords.length * 0.3, 1) : 0;
    
    return {
      crisisLevel,
      confidence: crisisLevel > 0 ? 0.7 : 0.3,
      riskFactors: matchedKeywords,
      immediateAction: crisisLevel > 0.5,
      recommendations: crisisLevel > 0.5 ? ['Contact crisis helpline', 'Seek immediate support'] : [],
      culturalContext: context,
      // Enhanced properties with default values
      hasCrisisIndicators: crisisLevel > 0.3,
      mlConfidence: crisisLevel > 0 ? 0.7 : 0.3,
      psychologicalAssessment: {
        depressionIndicators: crisisLevel * 0.8,
        anxietyIndicators: crisisLevel * 0.6,
        suicidalIdeation: crisisLevel * 0.9
      },
      behavioralPattern: {
        communicationStyle: crisisLevel > 0.5 ? 'distressed' : 'normal',
        helpSeekingBehavior: crisisLevel > 0.3 ? 'active' : 'passive',
        escalationTriggers: matchedKeywords
      },
      realTimeRisk: {
        immediateRisk: crisisLevel,
        interventionUrgency: crisisLevel * 10,
        recommendedInterventions: [
          { priority: 1, description: 'Immediate crisis support' },
          { priority: 2, description: 'Follow-up care' }
        ]
      },
      biasAdjustments: [],
      emotionalState: {
        primary: crisisLevel > 0.5 ? 'distress' : 'neutral',
        intensity: crisisLevel
      }
    };
  }

  async detectCrisis(text: string): Promise<{ isCrisis: boolean; severity: number }> {
    const analysis = await this.analyzeCrisisWithML(text);
    return {
      isCrisis: analysis.crisisLevel > 0.3,
      severity: analysis.crisisLevel
    };
  }
}

export const enhancedAICrisisDetectionService = new EnhancedAICrisisDetectionService();
export default enhancedAICrisisDetectionService;
