/**
 * Tests for Enhanced Crisis Detection Hook
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnhancedCrisisDetection } from './useEnhancedCrisisDetection';
import { enhancedAICrisisDetectionService } from '../services/enhancedAiCrisisDetectionService';

// Mock the enhanced AI crisis detection service
jest.mock('../services/enhancedAiCrisisDetectionService', () => ({
  enhancedAICrisisDetectionService: {
    analyzeCrisisWithML: jest.fn()
  }
}));

const mockMLAnalysisResult = {
  hasCrisisIndicators: true,
  mlConfidence: 0.85,
  emotionalState: {
    primaryEmotion: 'despair',
    valence: -0.7,
    arousal: 0.6,
    dominance: -0.3,
    timestamp: Date.now()
  },
  realTimeRisk: {
    immediateRisk: 75,
    interventionUrgency: 8,
    recommendedInterventions: [
      {
        priority: 8,
        description: 'Immediate professional intervention recommended'
      },
      {
        priority: 6,
        description: 'Contact emergency mental health services'
      }
    ]
  },
  biasAdjustments: [
    {
      factor: 'Language bias adjustment',
      confidence: 0.9
    }
  ],
  culturalContext: 'Western'
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useEnhancedCrisisDetection Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.lastAnalysis).toBeNull();
    expect(result.current.emotionalHistory).toEqual([]);
    expect(result.current.riskTrend).toEqual([]);
    expect(result.current.interventionSuggestions).toEqual([]);
    expect(result.current.analysisHistory).toEqual([]);
    expect(result.current.crisisAlert.show).toBe(false);
    expect(result.current.crisisAlert.severity).toBe('none');
    expect(result.current.hasCrisisIndicators).toBe(false);
    expect(result.current.currentRiskLevel).toBe(0);
    expect(result.current.currentEmotionalState).toBe('neutral');
    expect(result.current.interventionUrgency).toBe(0);
    expect(result.current.isEmergency).toBe(false);
    expect(result.current.mlConfidence).toBe(0);
  });

  it('should initialize with custom options', () => {
    const onCrisisDetected = jest.fn();
    const onRiskEscalation = jest.fn();
    const onInterventionRecommended = jest.fn();

    const options = {
      autoAnalyze: false,
      enableMLFeatures: true,
      minAnalysisLength: 20,
      maxHistorySize: 50,
      debounceMs: 2000,
      languageCode: 'es',
      culturalContext: 'Latino',
      userId: 'test-user-123',
      onCrisisDetected,
      onRiskEscalation,
      onInterventionRecommended
    };

    const { result } = renderHook(() => useEnhancedCrisisDetection(options), { wrapper: Wrapper });

    expect(result.current.isAnalyzing).toBe(false);
    expect(typeof result.current.analyzeText).toBe('function');
  });

  it('should analyze text successfully with ML', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    let analysisResult: any;
    await act(async () => {
      analysisResult = await result.current.analyzeText('I feel completely hopeless and see no way out');
    });

    expect(enhancedAICrisisDetectionService.analyzeCrisisWithML).toHaveBeenCalledWith(
      'I feel completely hopeless and see no way out',
      { userId: undefined, languageCode: 'en', culturalContext: undefined }
    );

    expect(analysisResult).toEqual(mockMLAnalysisResult);
    expect(result.current.lastAnalysis).toEqual(mockMLAnalysisResult);
    expect(result.current.hasCrisisIndicators).toBe(true);
    expect(result.current.currentRiskLevel).toBe(75);
    expect(result.current.currentEmotionalState).toBe('despair');
    expect(result.current.mlConfidence).toBe(0.85);
  });

  it('should handle analysis errors gracefully', async () => {
    const analysisError = new Error('ML service unavailable');
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockRejectedValue(analysisError);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    let analysisResult: any;
    await act(async () => {
      analysisResult = await result.current.analyzeText('Test text');
    });

    expect(analysisResult).toBeNull();
    expect(result.current.isAnalyzing).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Enhanced Crisis Detection] Analysis failed:',
      analysisError
    );

    consoleSpy.mockRestore();
  });

  it('should skip analysis for text that is too short', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection({ minAnalysisLength: 15 }), { wrapper: Wrapper });

    let analysisResult: any;
    await act(async () => {
      analysisResult = await result.current.analyzeText('Short');
    });

    expect(analysisResult).toBeNull();
    expect(enhancedAICrisisDetectionService.analyzeCrisisWithML).not.toHaveBeenCalled();
  });

  it('should skip analysis when ML features are disabled', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const { result } = renderHook(() => useEnhancedCrisisDetection({ enableMLFeatures: false }), { wrapper: Wrapper });

    let analysisResult: any;
    await act(async () => {
      analysisResult = await result.current.analyzeText('Test text for analysis');
    });

    expect(analysisResult).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('[Enhanced Crisis Detection] ML features disabled');
    expect(enhancedAICrisisDetectionService.analyzeCrisisWithML).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should track emotional history', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.analyzeText('Test emotional analysis');
    });

    expect(result.current.emotionalHistory).toHaveLength(1);
    expect(result.current.emotionalHistory[0]).toEqual(mockMLAnalysisResult.emotionalState);
  });

  it('should track risk trend', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.analyzeText('Test risk tracking');
    });

    expect(result.current.riskTrend).toHaveLength(1);
    expect(result.current.riskTrend[0]).toBe(75);
  });

  it('should limit history size', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection({ maxHistorySize: 2 }), { wrapper: Wrapper });

    // Add 3 analyses to exceed limit
    await act(async () => {
      await result.current.analyzeText('First text');
    });
    await act(async () => {
      await result.current.analyzeText('Second text');
    });
    await act(async () => {
      await result.current.analyzeText('Third text');
    });

    expect(result.current.emotionalHistory).toHaveLength(2);
    expect(result.current.riskTrend).toHaveLength(2);
    expect(result.current.analysisHistory).toHaveLength(2);
  });

  it('should call crisis detected callback', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const onCrisisDetected = jest.fn();
    const { result } = renderHook(() => useEnhancedCrisisDetection({ onCrisisDetected }), { wrapper: Wrapper });

    await act(async () => {
      await result.current.analyzeText('Crisis text');
    });

    expect(onCrisisDetected).toHaveBeenCalledWith(mockMLAnalysisResult);
  });

  it('should call risk escalation callback', async () => {
    const lowRiskResult = {
      ...mockMLAnalysisResult,
      realTimeRisk: { ...mockMLAnalysisResult.realTimeRisk, immediateRisk: 30 }
    };
    const highRiskResult = {
      ...mockMLAnalysisResult,
      realTimeRisk: { ...mockMLAnalysisResult.realTimeRisk, immediateRisk: 80 }
    };

    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValueOnce(lowRiskResult)
      .mockResolvedValueOnce(highRiskResult);

    const onRiskEscalation = jest.fn();
    const { result } = renderHook(() => useEnhancedCrisisDetection({ onRiskEscalation }), { wrapper: Wrapper });

    // First analysis with low risk
    await act(async () => {
      await result.current.analyzeText('Low risk text');
    });

    expect(onRiskEscalation).not.toHaveBeenCalled();

    // Second analysis with significantly higher risk
    await act(async () => {
      await result.current.analyzeText('High risk text');
    });

    expect(onRiskEscalation).toHaveBeenCalledWith(80);
  });

  it('should call intervention recommended callback', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const onInterventionRecommended = jest.fn();
    const { result } = renderHook(() => useEnhancedCrisisDetection({ onInterventionRecommended }), { wrapper: Wrapper });

    await act(async () => {
      await result.current.analyzeText('Test text');
    });

    expect(onInterventionRecommended).toHaveBeenCalledWith([
      'Immediate professional intervention recommended',
      'Contact emergency mental health services'
    ]);
  });

  it('should update crisis alert based on risk level', async () => {
    const criticalRiskResult = {
      ...mockMLAnalysisResult,
      realTimeRisk: { ...mockMLAnalysisResult.realTimeRisk, immediateRisk: 95 }
    };

    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(criticalRiskResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.analyzeText('Critical risk text');
    });

    expect(result.current.crisisAlert.show).toBe(true);
    expect(result.current.crisisAlert.severity).toBe('immediate');
    expect(result.current.crisisAlert.emergencyMode).toBe(true);
    expect(result.current.crisisAlert.riskLevel).toBe(95);
    expect(result.current.crisisAlert.emotionalState).toBe('despair');
    expect(result.current.isEmergency).toBe(true);
  });

  it('should handle different severity levels correctly', async () => {
    const testCases = [
      { risk: 15, expectedSeverity: 'none' },
      { risk: 25, expectedSeverity: 'low' },
      { risk: 45, expectedSeverity: 'medium' },
      { risk: 65, expectedSeverity: 'high' },
      { risk: 85, expectedSeverity: 'critical' },
      { risk: 95, expectedSeverity: 'immediate' }
    ];

    for (const testCase of testCases) {
      const riskResult = {
        ...mockMLAnalysisResult,
        realTimeRisk: { ...mockMLAnalysisResult.realTimeRisk, immediateRisk: testCase.risk }
      };

      (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
        .mockResolvedValue(riskResult);

      const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.analyzeText(`Risk level ${testCase.risk} text`);
      });

      expect(result.current.crisisAlert.severity).toBe(testCase.expectedSeverity);
    }
  });

  it('should provide debounced analysis', async () => {
    jest.useFakeTimers();
    
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection({ debounceMs: 500 }), { wrapper: Wrapper });

    // Call debounced analysis multiple times quickly
    act(() => {
      result.current.analyzeTextDebounced('Text 1');
      result.current.analyzeTextDebounced('Text 2');
      result.current.analyzeTextDebounced('Text 3');
    });

    // Should not have called service yet
    expect(enhancedAICrisisDetectionService.analyzeCrisisWithML).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(enhancedAICrisisDetectionService.analyzeCrisisWithML).toHaveBeenCalledTimes(1);
      expect(enhancedAICrisisDetectionService.analyzeCrisisWithML).toHaveBeenCalledWith(
        'Text 3', // Should use the last text
        { userId: undefined, languageCode: 'en', culturalContext: undefined }
      );
    });

    jest.useRealTimers();
  });

  it('should monitor text input automatically', async () => {
    const mockInputElement = document.createElement('textarea');
    const addEventListenerSpy = jest.spyOn(mockInputElement, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(mockInputElement, 'removeEventListener');

    const { result } = renderHook(() => useEnhancedCrisisDetection({ autoAnalyze: true }), { wrapper: Wrapper });

    const cleanup = result.current.monitorTextInput(mockInputElement);

    expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function));

    cleanup();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function));
  });

  it('should dismiss crisis alert', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    // First trigger an alert
    await act(async () => {
      await result.current.analyzeText('High risk text');
    });

    expect(result.current.crisisAlert.show).toBe(true);

    // Then dismiss it
    act(() => {
      result.current.dismissAlert();
    });

    expect(result.current.crisisAlert.show).toBe(false);
  });

  it('should get emotional trend analysis', async () => {
    const emotionalStates = [
      { ...mockMLAnalysisResult.emotionalState, valence: -0.5, arousal: 0.3 },
      { ...mockMLAnalysisResult.emotionalState, valence: -0.3, arousal: 0.4 },
      { ...mockMLAnalysisResult.emotionalState, valence: -0.1, arousal: 0.2 }
    ];

    for (let i = 0; i < emotionalStates.length; i++) {
      (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
        .mockResolvedValueOnce({ 
          ...mockMLAnalysisResult, 
          emotionalState: emotionalStates[i] 
        });
    }

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    // Analyze multiple times to build history
    for (let i = 0; i < emotionalStates.length; i++) {
      await act(async () => {
        await result.current.analyzeText(`Text ${i + 1}`);
      });
    }

    const trend = result.current.getEmotionalTrend();

    expect(trend.trend).toBe('improving'); // Valence increasing, arousal decreasing
    expect(trend.confidence).toBeGreaterThan(0);
    expect(trend.valenceSlope).toBeGreaterThan(0);
    expect(trend.arousalSlope).toBeLessThan(0);
  });

  it('should get risk prediction', async () => {
    const riskLevels = [40, 50, 60, 70, 65];

    for (let i = 0; i < riskLevels.length; i++) {
      (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
        .mockResolvedValueOnce({ 
          ...mockMLAnalysisResult, 
          realTimeRisk: { ...mockMLAnalysisResult.realTimeRisk, immediateRisk: riskLevels[i] }
        });
    }

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    // Analyze multiple times to build trend
    for (let i = 0; i < riskLevels.length; i++) {
      await act(async () => {
        await result.current.analyzeText(`Text ${i + 1}`);
      });
    }

    const prediction = result.current.getRiskPrediction();

    expect(prediction.currentRisk).toBe(65);
    expect(prediction.predictedRisk).toBeGreaterThanOrEqual(0);
    expect(prediction.predictedRisk).toBeLessThanOrEqual(100);
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(['increasing', 'decreasing', 'stable']).toContain(prediction.trend);
  });

  it('should get personalized intervention recommendations', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.analyzeText('Test text');
    });

    const interventions = result.current.getPersonalizedInterventions();

    expect(interventions).toHaveLength(2);
    expect(interventions[0].type).toBe('immediate');
    expect(interventions[0].priority).toBe(8);
    expect(interventions[0].description).toBe('Immediate professional intervention recommended');
    expect(interventions[0].timeframe).toBe('immediate');
    expect(interventions[0].actionItems).toContain('Contact appropriate support');
  });

  it('should clear analysis history', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    // First analyze to populate state
    await act(async () => {
      await result.current.analyzeText('Test text');
    });

    expect(result.current.analysisHistory).toHaveLength(1);
    expect(result.current.emotionalHistory).toHaveLength(1);
    expect(result.current.riskTrend).toHaveLength(1);

    // Then clear
    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.analysisHistory).toEqual([]);
    expect(result.current.emotionalHistory).toEqual([]);
    expect(result.current.riskTrend).toEqual([]);
    expect(result.current.lastAnalysis).toBeNull();
    expect(result.current.analysisCount).toBe(0);
  });

  it('should handle insufficient data for trend analysis', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    const trend = result.current.getEmotionalTrend();
    const prediction = result.current.getRiskPrediction();

    expect(trend.trend).toBe('insufficient_data');
    expect(trend.confidence).toBe(0);
    expect(prediction.predictedRisk).toBe(0);
    expect(prediction.confidence).toBe(0);
    expect(prediction.trend).toBe('unknown');
  });

  it('should handle analysis without tracking history', async () => {
    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(mockMLAnalysisResult);

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.analyzeText('Test text', { trackHistory: false });
    });

    expect(result.current.lastAnalysis).toEqual(mockMLAnalysisResult);
    expect(result.current.analysisHistory).toEqual([]);
    expect(result.current.emotionalHistory).toEqual([]);
    expect(result.current.riskTrend).toEqual([]);
  });

  it('should cleanup debounce timeout on unmount', async () => {
    jest.useFakeTimers();

    const { unmount } = renderHook(() => useEnhancedCrisisDetection({ debounceMs: 1000 }), { wrapper: Wrapper });

    unmount();

    // Should not throw errors when cleanup runs
    expect(() => {
      jest.runAllTimers();
    }).not.toThrow();

    jest.useRealTimers();
  });

  it('should handle analysis without real-time risk', async () => {
    const analysisWithoutRisk = {
      ...mockMLAnalysisResult,
      realTimeRisk: null
    };

    (enhancedAICrisisDetectionService.analyzeCrisisWithML as jest.Mock)
      .mockResolvedValue(analysisWithoutRisk);

    const { result } = renderHook(() => useEnhancedCrisisDetection(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.analyzeText('Test text');
    });

    expect(result.current.crisisAlert.show).toBe(false);
    expect(result.current.crisisAlert.severity).toBe('none');
    expect(result.current.currentRiskLevel).toBe(0);
    expect(result.current.interventionUrgency).toBe(0);
  });
});