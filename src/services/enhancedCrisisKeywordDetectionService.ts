/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enhanced Crisis Keyword Detection Service
 * 
 * Advanced crisis keyword detection with contextual understanding, emotional pattern recognition,
 * risk assessment scoring, and immediate intervention triggers for better crisis detection and user protection.
 * 
 * Features:
 * - Contextual crisis phrase analysis with semantic understanding
 * - Emotional pattern recognition with crisis correlation
 * - Advanced risk assessment scoring with multiple factors
 * - Immediate intervention triggers for emergency situations
 * - Temporal urgency detection with timeline analysis
 * - Linguistic pattern analysis for indirect crisis expressions
 * - Multi-layered validation to reduce false positives
 * - Enhanced suicide ideation detection with severity grading
 */

// Enhanced crisis keyword detection interfaces

// Enhanced crisis keyword detection interfaces
export type InterventionUrgencyLevel = 'none' | 'low' | 'medium' | 'high' | 'immediate';

export interface CrisisKeywordMatch {
  keyword: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  context: string[];
  position: number;
  surrounding: string;
  category: CrisisCategory;
  urgencyScore: number;
  interventionRequired: boolean;
  emotionalWeight: number;
}

export interface ContextualCrisisPattern {
  pattern: RegExp;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  category: CrisisCategory;
  contextRequirement: string[];
  negativeFlagWords: string[]; // Words that reduce crisis significance
  positiveAmplifiers: string[]; // Words that increase crisis significance
  timelineIndicators: string[];
  emotionalIndicators: string[];
  riskWeight: number;
}

export interface EmotionalCrisisIndicator {
  emotionalState: string;
  intensity: number;
  crisisCorrelation: number; // 0-1 correlation with crisis states
  linguisticMarkers: string[];
  behavioralPatterns: string[];
  interventionUrgency: InterventionUrgencyLevel;
}

export interface CrisisRiskAssessment {
  immediateRisk: number; // 0-100
  shortTermRisk: number; // 0-100 (24 hours)
  longTermRisk: number; // 0-100 (7 days)
  interventionUrgency: InterventionUrgencyLevel;
  confidenceScore: number;
  riskFactors: string[];
  protectiveFactors: string[];
  triggerIndicators: string[];
  timelineAnalysis: {
    hasTemporalUrgency: boolean;
    timeframe: string;
    urgencyModifiers: string[];
  };
  emotionalProfile: {
    primaryEmotion: string;
    intensity: number;
    stability: number;
    crisisAlignment: number;
  };
}

export interface EnhancedCrisisDetectionResult {
  hasCrisisIndicators: boolean;
  overallSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical' | 'emergency';
  keywordMatches: CrisisKeywordMatch[];
  contextualPatterns: ContextualCrisisPattern[];
  riskAssessment: CrisisRiskAssessment;
  emotionalIndicators: EmotionalCrisisIndicator[];
  interventionRecommendations: InterventionRecommendation[];
  escalationRequired: boolean;
  emergencyServicesRequired: boolean;
  analysisMetadata: {
    analysisMethod: 'keyword' | 'contextual' | 'semantic' | 'ml-enhanced';
    confidence: number;
    processingTime: number;
    flaggedConcerns: string[];
  };
}

export interface InterventionRecommendation {
  type: 'immediate' | 'urgent' | 'supportive' | 'monitoring' | 'resources';
  priority: number;
  description: string;
  actionItems: string[];
  timeframe: string;
  resources: string[];
  culturalConsiderations: string[];
}

export type CrisisCategory = 
  | 'suicidal-ideation'
  | 'suicide-plan'
  | 'self-harm'
  | 'substance-crisis'
  | 'violence-threat'
  | 'medical-emergency'
  | 'severe-distress'
  | 'panic-crisis'
  | 'psychotic-episode'
  | 'abuse-disclosure'
  | 'trauma-response';

class EnhancedCrisisKeywordDetectionService {
  private readonly contextWindow = 150; // Characters to analyze around keywords
  private readonly confidenceThreshold = 0.7; // Minimum confidence for crisis detection

  // Enhanced crisis keyword patterns with context and severity
  private readonly enhancedCrisisPatterns: ContextualCrisisPattern[] = [
    // Suicide ideation with immediate intent
    {
      pattern: /(?:going to|about to|ready to|planning to)\s+(?:kill myself|end my life|commit suicide|take my own life)/gi,
      description: 'Immediate suicide intent with action planning',
      severity: 'emergency',
      category: 'suicide-plan',
      contextRequirement: ['tonight', 'today', 'now', 'soon', 'ready', 'planned'],
      negativeFlagWords: ['not', 'never', 'would never', 'could never', 'hypothetically'],
      positiveAmplifiers: ['definitely', 'absolutely', 'certainly', 'finally', 'done waiting'],
      timelineIndicators: ['tonight', 'today', 'this evening', 'in an hour', 'soon'],
      emotionalIndicators: ['hopeless', 'empty', 'done', 'can\'t take it', 'over it'],
      riskWeight: 100
    },
    
    // Suicide plan details
    {
      pattern: /(?:have a plan|suicide plan|know how|figured out how|decided how)\s+(?:to|i'm going to|i will)/gi,
      description: 'Specific suicide planning with method consideration',
      severity: 'emergency',
      category: 'suicide-plan',
      contextRequirement: ['method', 'when', 'where', 'how', 'plan', 'decided'],
      negativeFlagWords: ['no plan', 'don\'t have', 'not planning', 'just thinking'],
      positiveAmplifiers: ['detailed', 'specific', 'ready', 'prepared', 'set'],
      timelineIndicators: ['tonight', 'tomorrow', 'this week', 'soon', 'when'],
      emotionalIndicators: ['calm', 'peaceful', 'resolved', 'certain', 'clear'],
      riskWeight: 95
    },

    // Active suicide ideation
    {
      pattern: /(?:want to die|wish i was dead|don't want to be alive|better off dead|life isn't worth living)/gi,
      description: 'Active suicidal ideation with death wish',
      severity: 'critical',
      category: 'suicidal-ideation',
      contextRequirement: ['really', 'so badly', 'constantly', 'all the time'],
      negativeFlagWords: ['sometimes feel like', 'used to', 'never actually'],
      positiveAmplifiers: ['desperately', 'so badly', 'constantly', 'every day'],
      timelineIndicators: ['lately', 'recently', 'for weeks', 'every day'],
      emotionalIndicators: ['hopeless', 'exhausted', 'empty', 'worthless'],
      riskWeight: 85
    },

    // Self-harm with escalation
    {
      pattern: /(?:cutting deeper|hurting myself more|escalating|getting worse|can't stop)\s+(?:cutting|harming|hurting)/gi,
      description: 'Self-harm with escalation patterns',
      severity: 'high',
      category: 'self-harm',
      contextRequirement: ['more', 'worse', 'deeper', 'harder', 'frequently'],
      negativeFlagWords: ['used to', 'stopped', 'trying not to'],
      positiveAmplifiers: ['desperately', 'compulsively', 'addicted to', 'can\'t control'],
      timelineIndicators: ['lately', 'recently', 'tonight', 'daily'],
      emotionalIndicators: ['numb', 'desperate', 'out of control', 'need to'],
      riskWeight: 75
    },

    // Substance crisis with suicidal intent
    {
      pattern: /(?:drinking to die|using to|overdose|taking too many|mixing pills)\s*(?:hoping|trying|wanting)/gi,
      description: 'Substance use with suicidal intent',
      severity: 'emergency',
      category: 'substance-crisis',
      contextRequirement: ['to die', 'to escape', 'hoping', 'trying'],
      negativeFlagWords: ['afraid of', 'worried about', 'don\'t want to'],
      positiveAmplifiers: ['hoping', 'trying', 'planning', 'ready'],
      timelineIndicators: ['tonight', 'now', 'about to', 'going to'],
      emotionalIndicators: ['hopeless', 'desperate', 'done', 'empty'],
      riskWeight: 90
    },

    // Medical emergency indicators
    {
      pattern: /(?:took too many|overdosed|can't stop bleeding|chest pain|can't breathe)/gi,
      description: 'Immediate medical emergency situation',
      severity: 'emergency',
      category: 'medical-emergency',
      contextRequirement: ['just', 'now', 'happening', 'right now'],
      negativeFlagWords: ['worry about', 'afraid of', 'what if'],
      positiveAmplifiers: ['just', 'right now', 'happening', 'emergency'],
      timelineIndicators: ['now', 'just', 'currently', 'right now'],
      emotionalIndicators: ['scared', 'panicked', 'confused', 'desperate'],
      riskWeight: 100
    },

    // Violence threats
    {
      pattern: /(?:going to hurt|kill|harm)\s+(?:someone|people|them|him|her)/gi,
      description: 'Threats of violence toward others',
      severity: 'emergency',
      category: 'violence-threat',
      contextRequirement: ['planning', 'going to', 'want to', 'thinking about'],
      negativeFlagWords: ['would never', 'could never', 'just angry'],
      positiveAmplifiers: ['planning', 'ready', 'deserve it', 'have to'],
      timelineIndicators: ['tonight', 'tomorrow', 'soon', 'when I see'],
      emotionalIndicators: ['rage', 'angry', 'hatred', 'vindictive'],
      riskWeight: 95
    },

    // Severe psychological distress
    {
      pattern: /(?:losing my mind|going crazy|can't think straight|hearing voices|seeing things)/gi,
      description: 'Severe psychological distress or psychotic symptoms',
      severity: 'high',
      category: 'psychotic-episode',
      contextRequirement: ['really', 'actually', 'literally', 'constantly'],
      negativeFlagWords: ['feel like', 'seems like', 'metaphorically'],
      positiveAmplifiers: ['actually', 'literally', 'really', 'definitely'],
      timelineIndicators: ['lately', 'for days', 'constantly', 'right now'],
      emotionalIndicators: ['confused', 'scared', 'paranoid', 'disconnected'],
      riskWeight: 80
    },

    // Panic crisis
    {
      pattern: /(?:panic attack|can't breathe|heart racing|going to die|losing control)/gi,
      description: 'Severe panic or anxiety crisis',
      severity: 'high',
      category: 'panic-crisis',
      contextRequirement: ['right now', 'happening', 'can\'t stop', 'overwhelming'],
      negativeFlagWords: ['sometimes', 'used to have', 'worried about'],
      positiveAmplifiers: ['right now', 'overwhelming', 'can\'t control', 'severe'],
      timelineIndicators: ['now', 'right now', 'currently', 'happening'],
      emotionalIndicators: ['terrified', 'panicked', 'overwhelmed', 'desperate'],
      riskWeight: 70
    },

    // Abuse disclosure
    {
      pattern: /(?:being abused|someone is hurting me|forced me|threatened me|unsafe at home)/gi,
      description: 'Disclosure of abuse or unsafe situation',
      severity: 'critical',
      category: 'abuse-disclosure',
      contextRequirement: ['currently', 'still', 'ongoing', 'happening'],
      negativeFlagWords: ['in the past', 'used to', 'worried about'],
      positiveAmplifiers: ['still', 'ongoing', 'every day', 'getting worse'],
      timelineIndicators: ['now', 'still', 'ongoing', 'every day'],
      emotionalIndicators: ['scared', 'trapped', 'helpless', 'afraid'],
      riskWeight: 85
    }
  ];

  // Emotional crisis indicators with linguistic markers
  private readonly emotionalCrisisIndicators: EmotionalCrisisIndicator[] = [
    {
      emotionalState: 'hopelessness',
      intensity: 0.9,
      crisisCorrelation: 0.95,
      linguisticMarkers: ['no point', 'nothing matters', 'no way out', 'trapped', 'stuck'],
      behavioralPatterns: ['giving up', 'withdrawal', 'isolation', 'declining self-care'],
      interventionUrgency: 'high'
    },
    {
      emotionalState: 'desperation',
      intensity: 0.85,
      crisisCorrelation: 0.9,
      linguisticMarkers: ['desperate', 'can\'t take it', 'at the end', 'breaking point'],
      behavioralPatterns: ['impulsive actions', 'seeking extreme solutions', 'risk-taking'],
      interventionUrgency: 'high'
    },
    {
      emotionalState: 'emotional_numbness',
      intensity: 0.8,
      crisisCorrelation: 0.85,
      linguisticMarkers: ['numb', 'empty', 'nothing', 'void', 'hollow'],
      behavioralPatterns: ['disconnection', 'emotional flatness', 'disengagement'],
      interventionUrgency: 'medium'
    },
    {
      emotionalState: 'rage_crisis',
      intensity: 0.9,
      crisisCorrelation: 0.8,
      linguisticMarkers: ['rage', 'furious', 'explosive', 'violent thoughts', 'lose control'],
      behavioralPatterns: ['aggression', 'threats', 'destruction', 'violence ideation'],
      interventionUrgency: 'immediate'
    },
    {
      emotionalState: 'severe_anxiety',
      intensity: 0.85,
      crisisCorrelation: 0.75,
      linguisticMarkers: ['overwhelming anxiety', 'can\'t cope', 'spiraling', 'out of control'],
      behavioralPatterns: ['avoidance', 'panic', 'hypervigilance', 'catastrophizing'],
      interventionUrgency: 'medium'
    }
  ];

  // Timeline urgency indicators
  private readonly urgencyTimelineIndicators = {
    immediate: ['now', 'right now', 'currently', 'as we speak', 'this moment'],
    veryUrgent: ['tonight', 'today', 'this evening', 'in an hour', 'soon'],
    urgent: ['tomorrow', 'this week', 'in a few days', 'by weekend'],
    concerning: ['next week', 'soon', 'eventually', 'when I get chance'],
    planning: ['been planning', 'have planned', 'working on plan', 'thinking about when']
  };

  /**
   * Enhanced crisis keyword detection with contextual analysis
   */
  public async analyzeEnhancedCrisisKeywords(
    text: string,
    _userId?: string,
    _culturalContext?: string,
    _languageCode: string = 'en'
  ): Promise<EnhancedCrisisDetectionResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Enhanced keyword and pattern matching
      const keywordMatches = this.detectCrisisKeywords(text);
      
      // Step 2: Contextual pattern analysis
      const contextualPatterns = this.analyzeContextualPatterns(text);
      
      // Step 3: Risk assessment with multiple factors
      const riskAssessment = this.performComprehensiveRiskAssessment(text, keywordMatches, contextualPatterns);
      
      // Step 4: Emotional pattern recognition
      const emotionalIndicators = this.analyzeEmotionalCrisisPatterns(text);
      
      // Step 5: Generate intervention recommendations
      const interventionRecommendations = this.generateInterventionRecommendations(
        riskAssessment,
        keywordMatches,
        emotionalIndicators
      );
      
      // Step 6: Determine overall severity and urgency
      const overallSeverity = this.calculateOverallSeverity(
        keywordMatches,
        contextualPatterns,
        riskAssessment
      );
      
      const hasCrisisIndicators = overallSeverity !== 'none' && riskAssessment.immediateRisk > 30;
      const escalationRequired = riskAssessment.immediateRisk >= 70 || overallSeverity === 'emergency';
      const emergencyServicesRequired = riskAssessment.immediateRisk >= 90 || 
        keywordMatches.some(match => match.severity === 'emergency');

      return {
        hasCrisisIndicators,
        overallSeverity,
        keywordMatches,
        contextualPatterns,
        riskAssessment,
        emotionalIndicators,
        interventionRecommendations,
        escalationRequired,
        emergencyServicesRequired,
        analysisMetadata: {
          analysisMethod: 'contextual',
          confidence: riskAssessment.confidenceScore,
          processingTime: Date.now() - startTime,
          flaggedConcerns: this.extractFlaggedConcerns(keywordMatches, contextualPatterns)
        }
      };
      
    } catch (error) {
      console.error('[Enhanced Crisis Keyword Detection] Analysis failed:', error);
      return this.createFailsafeResult(text, startTime);
    }
  }

  /**
   * Detect crisis keywords with enhanced context analysis
   */
  private detectCrisisKeywords(text: string): CrisisKeywordMatch[] {
    const matches: CrisisKeywordMatch[] = [];
    const normalizedText = text.toLowerCase();

    for (const pattern of this.enhancedCrisisPatterns) {
      const regexMatches = Array.from(normalizedText.matchAll(pattern.pattern));
      
      for (const match of regexMatches) {
        if (match.index !== undefined) {
          const position = match.index;
          const surrounding = this.extractSurroundingContext(text, position, this.contextWindow);
          
          // Analyze context for confidence scoring
          const confidence = this.calculateKeywordConfidence(
            match[0],
            surrounding,
            pattern
          );
          
          if (confidence >= this.confidenceThreshold) {
            matches.push({
              keyword: match[0],
              confidence,
              severity: pattern.severity,
              context: this.extractContextWords(surrounding, pattern.contextRequirement),
              position,
              surrounding,
              category: pattern.category,
              urgencyScore: this.calculateUrgencyScore(surrounding, pattern),
              interventionRequired: pattern.severity === 'emergency' || pattern.severity === 'critical',
              emotionalWeight: pattern.riskWeight / 100
            });
          }
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze contextual patterns in the text
   */
  private analyzeContextualPatterns(text: string): ContextualCrisisPattern[] {
    const detectedPatterns: ContextualCrisisPattern[] = [];
    
    for (const pattern of this.enhancedCrisisPatterns) {
      if (pattern.pattern.test(text)) {
        detectedPatterns.push(pattern);
      }
    }
    
    return detectedPatterns;
  }

  /**
   * Comprehensive risk assessment with multiple factors
   */
  private performComprehensiveRiskAssessment(
    text: string,
    keywordMatches: CrisisKeywordMatch[],
    contextualPatterns: ContextualCrisisPattern[]
  ): CrisisRiskAssessment {
    // Calculate immediate risk (0-100)
    const keywordRisk = keywordMatches.reduce((sum, match) => 
      sum + (match.urgencyScore * match.confidence), 0
    ) / Math.max(keywordMatches.length, 1);

    const patternRisk = contextualPatterns.reduce((sum, pattern) => 
      sum + pattern.riskWeight, 0
    ) / Math.max(contextualPatterns.length, 1);

    // Timeline urgency analysis
    const timelineAnalysis = this.analyzeTimelineUrgency(text);
    const temporalMultiplier = timelineAnalysis.hasTemporalUrgency ? 1.5 : 1.0;

    // Emotional intensity analysis
    const emotionalProfile = this.analyzeEmotionalIntensity(text);
    const emotionalMultiplier = emotionalProfile.intensity * emotionalProfile.crisisAlignment;

    // Calculate overall immediate risk
    const immediateRisk = Math.min(100, 
      (keywordRisk * 0.4 + patternRisk * 0.3) * temporalMultiplier * (1 + emotionalMultiplier)
    );

    // Calculate short-term and long-term risk
    const shortTermRisk = Math.min(100, immediateRisk * 0.8 + this.assessBehavioralPatterns(text) * 20);
    const longTermRisk = Math.min(100, immediateRisk * 0.6 + this.assessOverallRiskFactors(text) * 40);

    // Determine intervention urgency
    let interventionUrgency: 'none' | 'low' | 'medium' | 'high' | 'immediate' = 'none';
    if (immediateRisk >= 90) interventionUrgency = 'immediate';
    else if (immediateRisk >= 70) interventionUrgency = 'high';
    else if (immediateRisk >= 50) interventionUrgency = 'medium';
    else if (immediateRisk >= 30) interventionUrgency = 'low';

    return {
      immediateRisk,
      shortTermRisk,
      longTermRisk,
      interventionUrgency,
      confidenceScore: this.calculateOverallConfidence(keywordMatches, contextualPatterns),
      riskFactors: this.extractRiskFactors(text),
      protectiveFactors: this.extractProtectiveFactors(text),
      triggerIndicators: keywordMatches.map(match => match.keyword),
      timelineAnalysis,
      emotionalProfile
    };
  }

  /**
   * Analyze emotional crisis patterns with linguistic markers
   */
  private analyzeEmotionalCrisisPatterns(text: string): EmotionalCrisisIndicator[] {
    const detectedIndicators: EmotionalCrisisIndicator[] = [];
    const normalizedText = text.toLowerCase();

    for (const indicator of this.emotionalCrisisIndicators) {
      let markerCount = 0;
      let behaviorCount = 0;

      // Check linguistic markers
      for (const marker of indicator.linguisticMarkers) {
        if (normalizedText.includes(marker)) {
          markerCount++;
        }
      }

      // Check behavioral patterns
      for (const behavior of indicator.behavioralPatterns) {
        if (normalizedText.includes(behavior)) {
          behaviorCount++;
        }
      }

      // Calculate indicator strength
      const markerRatio = markerCount / indicator.linguisticMarkers.length;
      const behaviorRatio = behaviorCount / indicator.behavioralPatterns.length;
      const overallStrength = (markerRatio + behaviorRatio) / 2;

      if (overallStrength > 0.3) { // Threshold for detection
        detectedIndicators.push({
          ...indicator,
          intensity: indicator.intensity * overallStrength
        });
      }
    }

    return detectedIndicators.sort((a, b) => 
      (b.intensity * b.crisisCorrelation) - (a.intensity * a.crisisCorrelation)
    );
  }

  /**
   * Generate intervention recommendations based on analysis
   */
  private generateInterventionRecommendations(
    riskAssessment: CrisisRiskAssessment,
    _keywordMatches: CrisisKeywordMatch[],
    _emotionalIndicators: EmotionalCrisisIndicator[]
  ): InterventionRecommendation[] {
    const recommendations: InterventionRecommendation[] = [];

    // Emergency interventions
    if (riskAssessment.interventionUrgency === 'immediate') {
      recommendations.push({
        type: 'immediate',
        priority: 1,
        description: 'Immediate crisis intervention required - emergency services recommended',
        actionItems: [
          'Contact emergency services (911)',
          'Ensure immediate safety',
          'Stay with person until help arrives',
          'Remove access to means of harm'
        ],
        timeframe: 'Immediate',
        resources: ['911', '988 Suicide & Crisis Lifeline'],
        culturalConsiderations: ['Emergency services', 'Immediate family notification']
      });
    }

    // High-risk interventions
    if (riskAssessment.interventionUrgency === 'high') {
      recommendations.push({
        type: 'urgent',
        priority: 2,
        description: 'Urgent professional intervention needed within hours',
        actionItems: [
          'Contact crisis hotline immediately',
          'Schedule emergency therapy session',
          'Activate support network',
          'Consider voluntary hospitalization'
        ],
        timeframe: 'Within 2-4 hours',
        resources: ['988 Suicide & Crisis Lifeline', 'Crisis Text Line', 'Emergency therapy services'],
        culturalConsiderations: ['Family involvement preferences', 'Cultural crisis response methods']
      });
    }

    // Medium-risk supportive interventions
    if (riskAssessment.interventionUrgency === 'medium') {
      recommendations.push({
        type: 'supportive',
        priority: 3,
        description: 'Increased support and monitoring recommended',
        actionItems: [
          'Schedule therapy session within 24 hours',
          'Daily check-ins with support person',
          'Safety planning session',
          'Medication review if applicable'
        ],
        timeframe: 'Within 24 hours',
        resources: ['Mental health professionals', 'Crisis support groups', 'Peer support services'],
        culturalConsiderations: ['Culturally appropriate support methods', 'Community resources']
      });
    }

    // Ongoing monitoring and resources
    if (riskAssessment.immediateRisk > 20) {
      recommendations.push({
        type: 'monitoring',
        priority: 4,
        description: 'Ongoing monitoring and support resources',
        actionItems: [
          'Regular mental health check-ins',
          'Access to crisis resources',
          'Continued therapy engagement',
          'Peer support group participation'
        ],
        timeframe: 'Ongoing',
        resources: ['Mental health apps', 'Support groups', 'Crisis resource cards'],
        culturalConsiderations: ['Cultural healing practices', 'Community support systems']
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  // Helper methods for analysis
  private calculateKeywordConfidence(
    _keyword: string,
    context: string,
    pattern: ContextualCrisisPattern
  ): number {
    let confidence = 0.5; // Base confidence

    // Check for positive amplifiers
    for (const amplifier of pattern.positiveAmplifiers) {
      if (context.toLowerCase().includes(amplifier)) {
        confidence += 0.15;
      }
    }

    // Check for negative flags that reduce confidence
    for (const negativeFlag of pattern.negativeFlagWords) {
      if (context.toLowerCase().includes(negativeFlag)) {
        confidence -= 0.3;
      }
    }

    // Check for context requirements
    const contextRequirementMet = pattern.contextRequirement.some(req => 
      context.toLowerCase().includes(req)
    );
    if (contextRequirementMet) {
      confidence += 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private calculateUrgencyScore(context: string, pattern: ContextualCrisisPattern): number {
    let urgencyScore = pattern.riskWeight;

    // Check timeline indicators
    for (const [urgencyLevel, indicators] of Object.entries(this.urgencyTimelineIndicators)) {
      for (const indicator of indicators) {
        if (context.toLowerCase().includes(indicator)) {
          switch (urgencyLevel) {
            case 'immediate': urgencyScore += 30; break;
            case 'veryUrgent': urgencyScore += 20; break;
            case 'urgent': urgencyScore += 15; break;
            case 'concerning': urgencyScore += 10; break;
            case 'planning': urgencyScore += 25; break;
          }
        }
      }
    }

    return Math.min(100, urgencyScore);
  }

  private analyzeTimelineUrgency(text: string): { hasTemporalUrgency: boolean; timeframe: string; urgencyModifiers: string[] } {
    const normalizedText = text.toLowerCase();
    let hasTemporalUrgency = false;
    let timeframe = 'unspecified';
    const urgencyModifiers: string[] = [];

    for (const [urgencyLevel, indicators] of Object.entries(this.urgencyTimelineIndicators)) {
      for (const indicator of indicators) {
        if (normalizedText.includes(indicator)) {
          hasTemporalUrgency = true;
          timeframe = urgencyLevel;
          urgencyModifiers.push(indicator);
        }
      }
    }

    return { hasTemporalUrgency, timeframe, urgencyModifiers };
  }

  private analyzeEmotionalIntensity(text: string): { primaryEmotion: string; intensity: number; stability: number; crisisAlignment: number } {
    // Simplified emotional analysis - in production, this would use more sophisticated NLP
    const normalizedText = text.toLowerCase();
    
    const emotions = {
      despair: ['hopeless', 'despair', 'empty', 'worthless', 'pointless'],
      anger: ['angry', 'rage', 'furious', 'hate', 'violent'],
      fear: ['scared', 'terrified', 'afraid', 'panic', 'anxious'],
      numbness: ['numb', 'empty', 'void', 'nothing', 'disconnect']
    };

    let maxEmotion = 'neutral';
    let maxScore = 0;

    for (const [emotion, keywords] of Object.entries(emotions)) {
      const score = keywords.reduce((sum, keyword) => 
        sum + (normalizedText.includes(keyword) ? 1 : 0), 0
      );
      
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    }

    const intensity = Math.min(1, maxScore / 5);
    const stability = 1 - intensity; // Higher intensity = lower stability
    
    // Calculate crisis alignment based on emotion type
    let crisisAlignment = 0.3;
    if (maxEmotion === 'despair') crisisAlignment = 0.9;
    else if (maxEmotion === 'anger') crisisAlignment = 0.7;
    else if (maxEmotion === 'fear') crisisAlignment = 0.6;
    else if (maxEmotion === 'numbness') crisisAlignment = 0.8;

    return { primaryEmotion: maxEmotion, intensity, stability, crisisAlignment };
  }

  private calculateOverallSeverity(
    _keywordMatches: CrisisKeywordMatch[],
    _contextualPatterns: ContextualCrisisPattern[],
    riskAssessment: CrisisRiskAssessment
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' | 'emergency' {
    if (riskAssessment.immediateRisk >= 90) return 'emergency';
    if (riskAssessment.immediateRisk >= 75) return 'critical';
    if (riskAssessment.immediateRisk >= 55) return 'high';
    if (riskAssessment.immediateRisk >= 35) return 'medium';
    if (riskAssessment.immediateRisk >= 15) return 'low';
    return 'none';
  }

  private calculateOverallConfidence(
    keywordMatches: CrisisKeywordMatch[],
    contextualPatterns: ContextualCrisisPattern[]
  ): number {
    if (keywordMatches.length === 0) return 0;
    
    const avgKeywordConfidence = keywordMatches.reduce((sum, match) => 
      sum + match.confidence, 0
    ) / keywordMatches.length;
    
    const patternBonus = Math.min(0.2, contextualPatterns.length * 0.05);
    
    return Math.min(1, avgKeywordConfidence + patternBonus);
  }

  // Additional helper methods
  private extractSurroundingContext(text: string, position: number, window: number): string {
    const start = Math.max(0, position - window);
    const end = Math.min(text.length, position + window);
    return text.substring(start, end);
  }

  private extractContextWords(context: string, requirements: string[]): string[] {
    const words = context.toLowerCase().split(/\s+/);
    return requirements.filter(req => words.some(word => word.includes(req)));
  }

  private extractRiskFactors(text: string): string[] {
    const riskFactors = ['isolation', 'substance use', 'recent loss', 'trauma', 'financial stress'];
    return riskFactors.filter(factor => text.toLowerCase().includes(factor));
  }

  private extractProtectiveFactors(text: string): string[] {
    const protectiveFactors = ['support system', 'therapy', 'medication', 'family', 'friends', 'pets'];
    return protectiveFactors.filter(factor => text.toLowerCase().includes(factor));
  }

  private extractFlaggedConcerns(
    keywordMatches: CrisisKeywordMatch[],
    contextualPatterns: ContextualCrisisPattern[]
  ): string[] {
    const concerns: string[] = [];
    
    if (keywordMatches.some(m => m.severity === 'emergency')) {
      concerns.push('Emergency-level crisis indicators detected');
    }
    
    if (contextualPatterns.some(p => p.category === 'suicide-plan')) {
      concerns.push('Suicide planning indicators present');
    }
    
    if (keywordMatches.some(m => m.category === 'violence-threat')) {
      concerns.push('Violence threat indicators detected');
    }
    
    return concerns;
  }

  private assessBehavioralPatterns(text: string): number {
    // Simplified behavioral pattern assessment
    const patterns = ['giving up', 'withdrawal', 'impulsive', 'reckless'];
    const detected = patterns.filter(pattern => text.toLowerCase().includes(pattern));
    return (detected.length / patterns.length) * 100;
  }

  private assessOverallRiskFactors(text: string): number {
    // Simplified risk factor assessment
    const riskFactors = ['alone', 'isolated', 'lost job', 'relationship ended', 'death', 'trauma'];
    const detected = riskFactors.filter(factor => text.toLowerCase().includes(factor));
    return (detected.length / riskFactors.length) * 100;
  }

  private createFailsafeResult(_text: string, startTime: number): EnhancedCrisisDetectionResult {
    return {
      hasCrisisIndicators: false,
      overallSeverity: 'none',
      keywordMatches: [],
      contextualPatterns: [],
      riskAssessment: {
        immediateRisk: 0,
        shortTermRisk: 0,
        longTermRisk: 0,
        interventionUrgency: 'none',
        confidenceScore: 0,
        riskFactors: [],
        protectiveFactors: [],
        triggerIndicators: [],
        timelineAnalysis: { hasTemporalUrgency: false, timeframe: 'unspecified', urgencyModifiers: [] },
        emotionalProfile: { primaryEmotion: 'neutral', intensity: 0, stability: 1, crisisAlignment: 0 }
      },
      emotionalIndicators: [],
      interventionRecommendations: [],
      escalationRequired: false,
      emergencyServicesRequired: false,
      analysisMetadata: {
        analysisMethod: 'keyword',
        confidence: 0,
        processingTime: Date.now() - startTime,
        flaggedConcerns: ['Analysis failed - using failsafe mode']
      }
    };
  }
}

// Singleton instance
export const enhancedCrisisKeywordDetectionService = new EnhancedCrisisKeywordDetectionService();
export default enhancedCrisisKeywordDetectionService;
