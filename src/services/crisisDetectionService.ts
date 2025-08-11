/**
 * Enhanced Crisis Detection Service
 * 
 * Advanced crisis keyword detection with contextual analysis, sentiment patterns,
 * escalation workflows, and integration with professional services.
 */

interface CrisisIndicator {
  keyword: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: string[];
  category: 'suicidal' | 'self-harm' | 'substance-abuse' | 'violence' | 'emergency' | 'general-distress';
  immediateAction: boolean;
}

interface CrisisAnalysisResult {
  hasCrisisIndicators: boolean;
  severityLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  detectedCategories: string[];
  confidence: number;
  recommendedActions: string[];
  escalationRequired: boolean;
  emergencyServices: boolean;
  riskFactors: string[];
  protectiveFactors: string[];
  analysisDetails: {
    triggeredKeywords: CrisisIndicator[];
    sentimentScore: number;
    contextualFactors: string[];
    urgencyLevel: number;
  };
}

interface CrisisEscalationAction {
  type: 'immediate' | 'urgent' | 'monitor' | 'support';
  description: string;
  contacts: string[];
  resources: string[];
  timeline: string;
}

class EnhancedCrisisDetectionService {
  // Critical immediate danger keywords
  private criticalKeywords: CrisisIndicator[] = [
    // Immediate suicidal intent
    { keyword: 'killing myself', severity: 'critical', context: ['tonight', 'today', 'now', 'ready'], category: 'suicidal', immediateAction: true },
    { keyword: 'end my life', severity: 'critical', context: ['tonight', 'today', 'now', 'planning'], category: 'suicidal', immediateAction: true },
    { keyword: 'suicide plan', severity: 'critical', context: ['have', 'made', 'ready', 'tonight'], category: 'suicidal', immediateAction: true },
    { keyword: 'take my own life', severity: 'critical', context: ['going to', 'want to', 'ready to'], category: 'suicidal', immediateAction: true },
    { keyword: 'better off dead', severity: 'critical', context: ['everyone', 'world', 'family'], category: 'suicidal', immediateAction: true },
    
    // High-risk suicidal ideation
    { keyword: 'want to die', severity: 'high', context: ['really', 'so badly', 'just'], category: 'suicidal', immediateAction: false },
    { keyword: 'suicidal thoughts', severity: 'high', context: ['having', 'constant', 'overwhelming'], category: 'suicidal', immediateAction: false },
    { keyword: 'kill myself', severity: 'high', context: ['want to', 'thinking about', 'might'], category: 'suicidal', immediateAction: false },
    { keyword: 'end it all', severity: 'high', context: ['want to', 'thinking about', 'need to'], category: 'suicidal', immediateAction: false },
    
    // Self-harm indicators
    { keyword: 'cutting myself', severity: 'high', context: ['started', 'been', 'tonight'], category: 'self-harm', immediateAction: true },
    { keyword: 'hurting myself', severity: 'medium', context: ['been', 'started', 'want to'], category: 'self-harm', immediateAction: false },
    { keyword: 'self harm', severity: 'medium', context: ['urges', 'thoughts', 'relapse'], category: 'self-harm', immediateAction: false },
    
    // Violence indicators
    { keyword: 'hurt someone', severity: 'critical', context: ['going to', 'want to', 'planning'], category: 'violence', immediateAction: true },
    { keyword: 'kill someone', severity: 'critical', context: ['going to', 'want to', 'thinking'], category: 'violence', immediateAction: true },
    
    // Emergency situations
    { keyword: 'overdose', severity: 'critical', context: ['took', 'taking', 'just'], category: 'emergency', immediateAction: true },
    { keyword: 'pills', severity: 'high', context: ['took all', 'whole bottle', 'too many'], category: 'emergency', immediateAction: true },
    { keyword: 'bleeding', severity: 'high', context: ['wont stop', 'too much', 'heavily'], category: 'emergency', immediateAction: true },
    
    // Substance abuse
    { keyword: 'overdosing', severity: 'critical', context: ['think', 'might be', 'am'], category: 'substance-abuse', immediateAction: true },
    { keyword: 'drinking to die', severity: 'critical', context: ['hoping', 'trying', 'want'], category: 'substance-abuse', immediateAction: true },
    { keyword: 'using to escape', severity: 'medium', context: ['pain', 'everything', 'life'], category: 'substance-abuse', immediateAction: false },
    
    // General severe distress
    { keyword: 'cant take it anymore', severity: 'high', context: ['just', 'really', 'literally'], category: 'general-distress', immediateAction: false },
    { keyword: 'giving up', severity: 'medium', context: ['completely', 'totally', 'just'], category: 'general-distress', immediateAction: false },
    { keyword: 'hopeless', severity: 'medium', context: ['completely', 'totally', 'feeling so'], category: 'general-distress', immediateAction: false }
  ];

  // Context modifiers that increase urgency
  private urgencyModifiers = [
    'tonight', 'today', 'now', 'right now', 'immediately', 'soon', 'later today',
    'this evening', 'in a few hours', 'before morning', 'cant wait', 'ready to'
  ];

  // TODO: Integrate protective factors functionality (see todos list)

  /**
   * Analyze text for crisis indicators using advanced pattern matching
   */
  public analyzeCrisisContent(text: string): CrisisAnalysisResult {
    const normalizedText = text.toLowerCase().trim();
    const triggeredKeywords: CrisisIndicator[] = [];
    const detectedCategories = new Set<string>();
    let maxSeverity = 'none';
    let escalationRequired = false;
    let emergencyServices = false;
    let urgencyLevel = 0;

    // Analyze each crisis indicator
    for (const indicator of this.criticalKeywords) {
      if (this.matchesIndicator(normalizedText, indicator)) {
        triggeredKeywords.push(indicator);
        detectedCategories.add(indicator.category);
        
        // Update max severity
        if (this.getSeverityWeight(indicator.severity) > this.getSeverityWeight(maxSeverity)) {
          maxSeverity = indicator.severity;
        }
        
        // Check for immediate action requirements
        if (indicator.immediateAction) {
          escalationRequired = true;
          if (indicator.severity === 'critical') {
            emergencyServices = true;
          }
        }
        
        // Calculate urgency based on context
        urgencyLevel += this.calculateUrgency(normalizedText, indicator);
      }
    }

    // Analyze sentiment and context
    const sentimentScore = this.analyzeSentiment(normalizedText);
    const contextualFactors = this.analyzeContextualFactors(normalizedText);
    const riskFactors = this.identifyRiskFactors(normalizedText);
    const identifiedProtectiveFactors = this.identifyProtectiveFactors(normalizedText);

    // Adjust severity based on context
    if (urgencyLevel > 3 && maxSeverity !== 'none') {
      maxSeverity = this.escalateSeverity(maxSeverity);
      escalationRequired = true;
    }

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions({
      severityLevel: maxSeverity,
      categories: Array.from(detectedCategories),
      urgencyLevel,
      emergencyServices,
      escalationRequired
    });

    // Calculate confidence score
    const confidence = this.calculateConfidence({
      triggeredKeywords: triggeredKeywords.length,
      severityLevel: maxSeverity,
      urgencyLevel,
      sentimentScore,
      contextualFactors: contextualFactors.length
    });

    return {
      hasCrisisIndicators: triggeredKeywords.length > 0,
      severityLevel: maxSeverity as any,
      detectedCategories: Array.from(detectedCategories),
      confidence,
      recommendedActions,
      escalationRequired,
      emergencyServices,
      riskFactors,
      protectiveFactors: identifiedProtectiveFactors,
      analysisDetails: {
        triggeredKeywords,
        sentimentScore,
        contextualFactors,
        urgencyLevel
      }
    };
  }

  /**
   * Check if text matches a crisis indicator with context awareness
   */
  private matchesIndicator(text: string, indicator: CrisisIndicator): boolean {
    // Check for exact keyword match
    if (!text.includes(indicator.keyword)) {
      return false;
    }

    // If no context required, return true
    if (indicator.context.length === 0) {
      return true;
    }

    // Check if any context words appear near the keyword
    const keywordIndex = text.indexOf(indicator.keyword);
    const surroundingText = text.substring(
      Math.max(0, keywordIndex - 50),
      Math.min(text.length, keywordIndex + indicator.keyword.length + 50)
    );

    return indicator.context.some(context => surroundingText.includes(context));
  }

  /**
   * Calculate urgency level based on time indicators and context
   */
  private calculateUrgency(text: string, indicator: CrisisIndicator): number {
    let urgency = 0;

    // Base urgency from severity
    switch (indicator.severity) {
      case 'critical': urgency += 4; break;
      case 'high': urgency += 3; break;
      case 'medium': urgency += 2; break;
      case 'low': urgency += 1; break;
    }

    // Check for urgency modifiers
    const urgencyWords = this.urgencyModifiers.filter(modifier => text.includes(modifier));
    urgency += urgencyWords.length * 2;

    // Immediate action indicators
    if (indicator.immediateAction) {
      urgency += 3;
    }

    return urgency;
  }

  /**
   * Analyze sentiment to gauge emotional state
   */
  private analyzeSentiment(text: string): number {
    const positiveWords = ['hope', 'better', 'help', 'support', 'love', 'care', 'tomorrow', 'future'];
    const negativeWords = ['hopeless', 'worthless', 'alone', 'empty', 'dark', 'pain', 'suffering', 'burden'];
    
    let sentiment = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) sentiment += 1;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) sentiment -= 1;
    });
    
    return sentiment;
  }

  /**
   * Analyze contextual factors that may affect crisis level
   */
  private analyzeContextualFactors(text: string): string[] {
    const factors: string[] = [];
    
    // Isolation indicators
    if (/\b(alone|lonely|no one|nobody)\b/.test(text)) {
      factors.push('social_isolation');
    }
    
    // Time-based urgency
    if (/\b(tonight|today|now|soon)\b/.test(text)) {
      factors.push('immediate_timeframe');
    }
    
    // Method references
    if (/\b(pills|knife|gun|rope|bridge|jump)\b/.test(text)) {
      factors.push('method_reference');
    }
    
    // Support system
    if (/\b(family|friends|therapist|doctor|help)\b/.test(text)) {
      factors.push('support_available');
    }
    
    return factors;
  }

  /**
   * Identify risk factors that increase danger
   */
  private identifyRiskFactors(text: string): string[] {
    const riskFactors: string[] = [];
    
    if (/\b(drinking|drugs|alcohol|high|drunk)\b/.test(text)) {
      riskFactors.push('substance_use');
    }
    
    if (/\b(plan|method|when|how|where)\b/.test(text)) {
      riskFactors.push('specific_planning');
    }
    
    if (/\b(alone|isolated|no one knows)\b/.test(text)) {
      riskFactors.push('isolation');
    }
    
    if (/\b(failed|worthless|burden|waste)\b/.test(text)) {
      riskFactors.push('negative_self_perception');
    }
    
    return riskFactors;
  }

  /**
   * Identify protective factors that may reduce risk
   */
  private identifyProtectiveFactors(text: string): string[] {
    const factors: string[] = [];
    
    if (/\b(but|except|although|however)\b/.test(text)) {
      factors.push('ambivalence');
    }
    
    if (/\b(family|children|pet|responsibility)\b/.test(text)) {
      factors.push('life_responsibilities');
    }
    
    if (/\b(help|therapist|counselor|doctor)\b/.test(text)) {
      factors.push('professional_support');
    }
    
    if (/\b(tomorrow|future|plans|hope)\b/.test(text)) {
      factors.push('future_orientation');
    }
    
    return factors;
  }

  /**
   * Generate specific recommended actions based on analysis
   */
  private generateRecommendedActions(params: {
    severityLevel: string;
    categories: string[];
    urgencyLevel: number;
    emergencyServices: boolean;
    escalationRequired: boolean;
  }): string[] {
    const actions: string[] = [];

    if (params.emergencyServices) {
      actions.push('IMMEDIATE: Contact emergency services (911)');
      actions.push('IMMEDIATE: Do not leave user alone');
      actions.push('IMMEDIATE: Activate crisis intervention protocol');
    }

    if (params.escalationRequired) {
      actions.push('Escalate to crisis counselor immediately');
      actions.push('Initiate suicide risk assessment');
      actions.push('Contact designated emergency contacts');
    }

    if (params.categories.includes('suicidal')) {
      actions.push('Provide suicide prevention resources');
      actions.push('Share safety planning tools');
      actions.push('Connect with crisis hotline');
    }

    if (params.categories.includes('self-harm')) {
      actions.push('Offer self-harm alternatives');
      actions.push('Provide coping strategies');
      actions.push('Connect with self-harm support resources');
    }

    if (params.severityLevel === 'medium' || params.severityLevel === 'high') {
      actions.push('Schedule follow-up check-in');
      actions.push('Provide comprehensive resource list');
      actions.push('Connect with peer support');
    }

    return actions;
  }

  /**
   * Calculate confidence in crisis detection
   */
  private calculateConfidence(params: {
    triggeredKeywords: number;
    severityLevel: string;
    urgencyLevel: number;
    sentimentScore: number;
    contextualFactors: number;
  }): number {
    let confidence = 0;

    // Base confidence from keyword matches
    confidence += Math.min(params.triggeredKeywords * 20, 60);

    // Severity level contribution
    const severityWeights = { 'critical': 30, 'high': 20, 'medium': 15, 'low': 10, 'none': 0 };
    confidence += severityWeights[params.severityLevel as keyof typeof severityWeights] || 0;

    // Urgency level contribution
    confidence += Math.min(params.urgencyLevel * 5, 20);

    // Contextual factors
    confidence += Math.min(params.contextualFactors * 3, 10);

    // Sentiment analysis
    if (params.sentimentScore < -2) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  /**
   * Get numeric weight for severity level
   */
  private getSeverityWeight(severity: string): number {
    const weights = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return weights[severity as keyof typeof weights] || 0;
  }

  /**
   * Escalate severity level based on context
   */
  private escalateSeverity(currentSeverity: string): string {
    const escalationMap = {
      'low': 'medium',
      'medium': 'high',
      'high': 'critical',
      'critical': 'critical'
    };
    return escalationMap[currentSeverity as keyof typeof escalationMap] || currentSeverity;
  }

  /**
   * Get escalation actions based on severity and categories
   */
  public getEscalationActions(analysisResult: CrisisAnalysisResult): CrisisEscalationAction[] {
    const actions: CrisisEscalationAction[] = [];

    if (analysisResult.emergencyServices) {
      actions.push({
        type: 'immediate',
        description: 'Contact emergency services immediately - active suicide attempt or imminent danger',
        contacts: ['911', '988 Suicide & Crisis Lifeline', 'Local emergency services'],
        resources: ['Crisis intervention team', 'Emergency psychiatric services', 'Mobile crisis unit'],
        timeline: 'Within 5 minutes'
      });
    }

    if (analysisResult.escalationRequired) {
      actions.push({
        type: 'urgent',
        description: 'Escalate to crisis counselor - high risk situation requiring immediate professional intervention',
        contacts: ['Crisis hotline counselor', 'Platform crisis team', 'Mental health professionals'],
        resources: ['Suicide risk assessment', 'Safety planning', 'Crisis counseling'],
        timeline: 'Within 15 minutes'
      });
    }

    if (analysisResult.severityLevel === 'high' || analysisResult.severityLevel === 'medium') {
      actions.push({
        type: 'monitor',
        description: 'Implement enhanced monitoring and support protocols',
        contacts: ['Peer support team', 'Regular check-in coordinator', 'Mental health navigator'],
        resources: ['Increased check-ins', 'Safety plan review', 'Additional coping resources'],
        timeline: 'Within 1 hour'
      });
    }

    if (analysisResult.hasCrisisIndicators) {
      actions.push({
        type: 'support',
        description: 'Provide immediate emotional support and resource connection',
        contacts: ['Peer supporters', 'Crisis chat volunteers', 'Mental health advocates'],
        resources: ['Crisis chat', 'Emotional support', 'Resource navigation', 'Coping strategies'],
        timeline: 'Immediately available'
      });
    }

    return actions;
  }

  /**
   * Generate crisis response for different user types
   */
  public generateCrisisResponse(analysisResult: CrisisAnalysisResult, userType: 'seeker' | 'helper'): {
    message: string;
    actions: string[];
    resources: string[];
    followUp: string[];
  } {
    const isSeeker = userType === 'seeker';
    
    if (analysisResult.emergencyServices) {
      return {
        message: isSeeker 
          ? "I'm very concerned about your safety right now. You mentioned thoughts or plans that suggest immediate danger. Please reach out for emergency help immediately."
          : "The person you're helping has indicated immediate danger. This requires emergency intervention. Do not attempt to handle this alone.",
        actions: [
          'Call 911 immediately',
          'Contact 988 Suicide & Crisis Lifeline: 988',
          'Text HOME to 741741 for Crisis Text Line',
          isSeeker ? 'Stay with someone or go to emergency room' : 'Ensure the person is not left alone'
        ],
        resources: [
          '988 Suicide & Crisis Lifeline',
          'National Crisis Text Line: Text HOME to 741741',
          'Emergency Services: 911',
          'Crisis Chat: suicidepreventionlifeline.org/chat'
        ],
        followUp: [
          'Emergency services contacted',
          'Safety assessment completed',
          'Crisis intervention activated',
          'Professional follow-up scheduled'
        ]
      };
    }

    if (analysisResult.escalationRequired) {
      return {
        message: isSeeker
          ? "I can see you're going through something very difficult right now. Your safety is important, and I want to connect you with people who can provide immediate help."
          : "The situation you're dealing with requires immediate professional support. Please help connect this person with crisis resources.",
        actions: [
          'Contact crisis hotline: 988',
          'Reach out to a mental health professional',
          'Connect with crisis chat support',
          'Contact trusted friend or family member'
        ],
        resources: [
          '988 Suicide & Crisis Lifeline',
          'Crisis Text Line: 741741',
          'Local crisis services',
          'Mental health emergency services'
        ],
        followUp: [
          'Crisis counselor consultation',
          'Safety plan development',
          'Regular check-ins scheduled',
          'Professional referral provided'
        ]
      };
    }

    // Medium/High severity response
    return {
      message: isSeeker
        ? "I notice you're struggling with some difficult thoughts and feelings. You don't have to go through this alone - there are people and resources available to help."
        : "The person you're supporting is showing signs of distress that may need additional support. Consider connecting them with professional resources.",
      actions: [
        'Talk to someone you trust',
        'Consider contacting a counselor or therapist',
        'Use coping strategies from your safety plan',
        'Reach out to support networks'
      ],
      resources: [
        'Mental health professionals',
        'Support groups',
        'Crisis resources',
        'Peer support networks'
      ],
      followUp: [
        'Schedule regular check-ins',
        'Review and update safety plan',
        'Connect with ongoing support',
        'Monitor mood and symptoms'
      ]
    };
  }
}

// Singleton instance
export const crisisDetectionService = new EnhancedCrisisDetectionService();
export default crisisDetectionService;
export type { CrisisAnalysisResult, CrisisIndicator, CrisisEscalationAction };
