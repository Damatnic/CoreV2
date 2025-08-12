import MoodAnalysisService, { 
  MoodAnalysis, 
  MoodType, 
  MoodPattern, 
  PersonalizedRecommendation,
  useMoodAnalysis 
} from '../moodAnalysisService';
import { renderHook, act } from '@testing-library/react';

describe('MoodAnalysisService', () => {
  let service: MoodAnalysisService;

  beforeEach(() => {
    service = new MoodAnalysisService();
    jest.clearAllMocks();
  });

  describe('basic mood analysis', () => {
    it('should analyze happy mood correctly', async () => {
      const text = "I'm feeling really joyful and excited about today. Everything seems bright and positive!";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.primary).toBe('happy');
      expect(analysis.intensity).toBeGreaterThan(0.5);
      expect(analysis.confidence).toBeGreaterThan(0.7);
      expect(analysis.keywords).toContain('joyful');
      expect(analysis.keywords).toContain('excited');
      expect(analysis.keywords).toContain('positive');
      expect(analysis.timestamp).toBeDefined();
    });

    it('should analyze sad mood correctly', async () => {
      const text = "I feel so down and depressed today. Everything seems gloomy and I'm feeling melancholy.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.primary).toBe('sad');
      expect(analysis.intensity).toBeGreaterThan(0.5);
      expect(analysis.keywords).toContain('down');
      expect(analysis.keywords).toContain('depressed');
      expect(analysis.keywords).toContain('gloomy');
      expect(analysis.suggestions).toContain(expect.stringMatching(/self-care|support|professional/));
    });

    it('should analyze anxious mood correctly', async () => {
      const text = "I'm feeling really worried and nervous about tomorrow. I'm tense and can't stop feeling uneasy.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.primary).toBe('anxious');
      expect(analysis.keywords).toContain('worried');
      expect(analysis.keywords).toContain('nervous');
      expect(analysis.keywords).toContain('tense');
      expect(analysis.suggestions.some(s => s.includes('breathing'))).toBe(true);
    });

    it('should analyze angry mood correctly', async () => {
      const text = "I'm so mad and furious right now. I'm feeling really irritated and annoyed about this situation.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.primary).toBe('angry');
      expect(analysis.keywords).toContain('mad');
      expect(analysis.keywords).toContain('furious');
      expect(analysis.keywords).toContain('irritated');
    });

    it('should detect mixed emotions', async () => {
      const text = "I'm excited about the opportunity but also nervous and worried about whether I can handle it.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.primary).toBeDefined();
      expect(analysis.secondary).toBeDefined();
      expect(analysis.primary).not.toBe(analysis.secondary);
    });

    it('should handle neutral text appropriately', async () => {
      const text = "I went to the store and bought some groceries. Then I came home.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.intensity).toBeLessThan(0.3);
      expect(analysis.confidence).toBeLessThan(0.7);
      expect(analysis.keywords).toHaveLength(0);
    });
  });

  describe('mood intensity calculation', () => {
    it('should calculate high intensity for strong emotional words', async () => {
      const text = "I'm absolutely ecstatic and overjoyed! This is amazing and incredible!";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.intensity).toBeGreaterThan(0.8);
      expect(analysis.confidence).toBeGreaterThan(0.8);
    });

    it('should calculate low intensity for mild emotional words', async () => {
      const text = "I'm a bit happy about this situation.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.intensity).toBeLessThan(0.5);
    });

    it('should consider multiple emotional indicators', async () => {
      const text = "I'm feeling sad, depressed, gloomy, and really down today.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.intensity).toBeGreaterThan(0.7);
      expect(analysis.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('confidence scoring', () => {
    it('should have high confidence for clear emotional language', async () => {
      const text = "I am extremely happy and joyful today!";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.confidence).toBeGreaterThan(0.8);
    });

    it('should have low confidence for ambiguous text', async () => {
      const text = "Things are okay I guess.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.confidence).toBeLessThan(0.5);
    });

    it('should have medium confidence for moderate emotional content', async () => {
      const text = "I feel somewhat anxious about the meeting.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.confidence).toBeGreaterThan(0.4);
      expect(analysis.confidence).toBeLessThan(0.8);
    });
  });

  describe('mood suggestions', () => {
    it('should provide appropriate suggestions for sad moods', async () => {
      const text = "I'm feeling really sad and depressed.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.suggestions.some(s => 
        s.includes('self-care') || s.includes('support') || s.includes('professional')
      )).toBe(true);
    });

    it('should provide breathing exercises for anxious moods', async () => {
      const text = "I'm feeling extremely anxious and worried.";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.suggestions.some(s => s.includes('breathing'))).toBe(true);
    });

    it('should provide calming suggestions for angry moods', async () => {
      const text = "I'm so furious and angry right now!";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.suggestions.some(s => 
        s.includes('calm') || s.includes('step away') || s.includes('cool down')
      )).toBe(true);
    });

    it('should provide positive reinforcement for happy moods', async () => {
      const text = "I'm feeling absolutely wonderful and happy!";
      
      const analysis = await service.analyzeMood(text);

      expect(analysis.suggestions.some(s => 
        s.includes('celebrate') || s.includes('gratitude') || s.includes('positive')
      )).toBe(true);
    });
  });

  describe('mood pattern analysis', () => {
    it('should analyze daily mood patterns correctly', async () => {
      const moodHistory = [
        { primary: 'happy' as MoodType, timestamp: Date.now() - 1000 },
        { primary: 'happy' as MoodType, timestamp: Date.now() - 2000 },
        { primary: 'sad' as MoodType, timestamp: Date.now() - 3000 },
        { primary: 'happy' as MoodType, timestamp: Date.now() - 4000 },
      ];

      const pattern = await service.analyzeMoodPatterns(moodHistory, 'daily');

      expect(pattern.period).toBe('daily');
      expect(pattern.dominant_moods).toBeDefined();
      expect(pattern.dominant_moods[0].mood).toBe('happy');
      expect(pattern.dominant_moods[0].frequency).toBeCloseTo(0.75);
      expect(pattern.trends).toBeDefined();
    });

    it('should detect improving mood trends', async () => {
      const improvingMoodHistory = [
        { primary: 'sad' as MoodType, timestamp: Date.now() - 4000, intensity: 0.8 },
        { primary: 'sad' as MoodType, timestamp: Date.now() - 3000, intensity: 0.6 },
        { primary: 'anxious' as MoodType, timestamp: Date.now() - 2000, intensity: 0.4 },
        { primary: 'happy' as MoodType, timestamp: Date.now() - 1000, intensity: 0.7 },
      ];

      const pattern = await service.analyzeMoodPatterns(improvingMoodHistory, 'weekly');

      expect(pattern.trends.improving).toBe(true);
      expect(pattern.trends.stability).toBeGreaterThan(0);
    });

    it('should detect declining mood trends', async () => {
      const decliningMoodHistory = [
        { primary: 'happy' as MoodType, timestamp: Date.now() - 4000, intensity: 0.8 },
        { primary: 'content' as MoodType, timestamp: Date.now() - 3000, intensity: 0.6 },
        { primary: 'anxious' as MoodType, timestamp: Date.now() - 2000, intensity: 0.5 },
        { primary: 'sad' as MoodType, timestamp: Date.now() - 1000, intensity: 0.7 },
      ];

      const pattern = await service.analyzeMoodPatterns(decliningMoodHistory, 'weekly');

      expect(pattern.trends.improving).toBe(false);
    });

    it('should calculate mood volatility correctly', async () => {
      const volatileMoodHistory = [
        { primary: 'happy' as MoodType, timestamp: Date.now() - 4000 },
        { primary: 'sad' as MoodType, timestamp: Date.now() - 3000 },
        { primary: 'angry' as MoodType, timestamp: Date.now() - 2000 },
        { primary: 'anxious' as MoodType, timestamp: Date.now() - 1000 },
      ];

      const pattern = await service.analyzeMoodPatterns(volatileMoodHistory, 'daily');

      expect(pattern.trends.volatility).toBeGreaterThan(0.7);
    });

    it('should identify mood triggers', async () => {
      const moodHistory = [
        { 
          primary: 'sad' as MoodType, 
          timestamp: Date.now() - 1000,
          triggers: ['work stress', 'relationship issues']
        },
        { 
          primary: 'anxious' as MoodType, 
          timestamp: Date.now() - 2000,
          triggers: ['work stress', 'financial concerns']
        },
      ];

      const pattern = await service.analyzeMoodPatterns(moodHistory, 'weekly');

      expect(pattern.triggers).toContain('work stress');
    });
  });

  describe('personalized recommendations', () => {
    it('should generate immediate recommendations for crisis moods', async () => {
      const recommendations = await service.getPersonalizedRecommendations([
        { primary: 'sad' as MoodType, intensity: 0.9, timestamp: Date.now() }
      ], 'seeker');

      expect(recommendations.some(r => r.category === 'immediate')).toBe(true);
      expect(recommendations.some(r => r.priority === 'high')).toBe(true);
    });

    it('should generate daily recommendations for consistent patterns', async () => {
      const moodHistory = Array.from({ length: 5 }, (_, i) => ({
        primary: 'anxious' as MoodType,
        intensity: 0.6,
        timestamp: Date.now() - i * 86400000 // Daily entries
      }));

      const recommendations = await service.getPersonalizedRecommendations(moodHistory, 'seeker');

      expect(recommendations.some(r => r.category === 'daily')).toBe(true);
      expect(recommendations.some(r => r.type === 'technique')).toBe(true);
    });

    it('should generate professional recommendations for persistent negative moods', async () => {
      const persistentSadHistory = Array.from({ length: 10 }, (_, i) => ({
        primary: 'sad' as MoodType,
        intensity: 0.8,
        timestamp: Date.now() - i * 86400000
      }));

      const recommendations = await service.getPersonalizedRecommendations(persistentSadHistory, 'seeker');

      expect(recommendations.some(r => r.type === 'professional')).toBe(true);
      expect(recommendations.some(r => r.priority === 'high')).toBe(true);
    });

    it('should adapt recommendations based on user type', async () => {
      const moodHistory = [{ primary: 'anxious' as MoodType, intensity: 0.6, timestamp: Date.now() }];

      const seekerRecs = await service.getPersonalizedRecommendations(moodHistory, 'seeker');
      const helperRecs = await service.getPersonalizedRecommendations(moodHistory, 'helper');

      expect(seekerRecs.length).toBeGreaterThan(0);
      expect(helperRecs.length).toBeGreaterThan(0);
      
      // Helper recommendations should include self-care for caregivers
      expect(helperRecs.some(r => 
        r.description.includes('self-care') || r.description.includes('burnout')
      )).toBe(true);
    });
  });

  describe('mood comparison and insights', () => {
    it('should compare mood changes over time', async () => {
      const previousMoods = [
        { primary: 'sad' as MoodType, intensity: 0.8, timestamp: Date.now() - 604800000 }
      ];
      const currentMoods = [
        { primary: 'happy' as MoodType, intensity: 0.7, timestamp: Date.now() }
      ];

      const insights = await service.generateMoodInsights(currentMoods, previousMoods);

      expect(insights.overallChange).toBe('improved');
      expect(insights.significantChanges.length).toBeGreaterThan(0);
    });

    it('should detect mood stability', async () => {
      const stableMoods = Array.from({ length: 7 }, (_, i) => ({
        primary: 'content' as MoodType,
        intensity: 0.6 + (Math.random() * 0.2 - 0.1), // Small variations
        timestamp: Date.now() - i * 86400000
      }));

      const insights = await service.generateMoodInsights(stableMoods, []);

      expect(insights.stability).toBeGreaterThan(0.7);
    });

    it('should provide contextual insights', async () => {
      const moodWithContext = [
        { 
          primary: 'happy' as MoodType, 
          intensity: 0.8, 
          timestamp: Date.now(),
          context: 'Completed therapy session'
        }
      ];

      const insights = await service.generateMoodInsights(moodWithContext, []);

      expect(insights.contextualFactors).toContain('therapy session');
    });
  });

  describe('data validation and error handling', () => {
    it('should handle empty text gracefully', async () => {
      const analysis = await service.analyzeMood('');

      expect(analysis.primary).toBeDefined();
      expect(analysis.intensity).toBe(0);
      expect(analysis.confidence).toBe(0);
      expect(analysis.keywords).toHaveLength(0);
    });

    it('should handle very long text', async () => {
      const longText = 'I am happy. '.repeat(1000);

      const analysis = await service.analyzeMood(longText);

      expect(analysis.primary).toBe('happy');
      expect(analysis.intensity).toBeGreaterThan(0);
    });

    it('should handle special characters and emojis', async () => {
      const textWithEmojis = "I'm feeling great! 😊😃 So happy and excited!!! ✨🎉";

      const analysis = await service.analyzeMood(textWithEmojis);

      expect(analysis.primary).toBe('happy');
      expect(analysis.keywords).toContain('happy');
      expect(analysis.keywords).toContain('excited');
    });

    it('should handle malformed mood history data', async () => {
      const malformedHistory = [
        { primary: 'happy' as MoodType }, // Missing timestamp
        { timestamp: Date.now() }, // Missing primary mood
        null, // Null entry
        { primary: 'invalid_mood' as MoodType, timestamp: Date.now() }, // Invalid mood
      ] as any[];

      expect(() => service.analyzeMoodPatterns(malformedHistory, 'daily')).not.toThrow();
    });
  });

  describe('performance and efficiency', () => {
    it('should analyze mood efficiently for typical text lengths', async () => {
      const text = "I'm feeling anxious about work and stressed about my responsibilities.";
      const startTime = Date.now();

      await service.analyzeMood(text);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent mood analyses', async () => {
      const texts = [
        "I'm happy today",
        "Feeling sad and down",
        "Anxious about tomorrow",
        "Angry about the situation"
      ];

      const analyses = await Promise.all(
        texts.map(text => service.analyzeMood(text))
      );

      expect(analyses).toHaveLength(4);
      expect(analyses[0].primary).toBe('happy');
      expect(analyses[1].primary).toBe('sad');
      expect(analyses[2].primary).toBe('anxious');
      expect(analyses[3].primary).toBe('angry');
    });
  });
});

describe('useMoodAnalysis hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide mood analysis functionality', () => {
    const { result } = renderHook(() => useMoodAnalysis());

    expect(result.current.analyzeMood).toBeInstanceOf(Function);
    expect(result.current.analyzeMoodPatterns).toBeInstanceOf(Function);
    expect(result.current.getPersonalizedRecommendations).toBeInstanceOf(Function);
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('should handle mood analysis state', async () => {
    const { result } = renderHook(() => useMoodAnalysis());

    expect(result.current.isAnalyzing).toBe(false);

    await act(async () => {
      const promise = result.current.analyzeMood('I am happy');
      expect(result.current.isAnalyzing).toBe(true);
      await promise;
    });

    expect(result.current.isAnalyzing).toBe(false);
  });

  it('should store analysis history', async () => {
    const { result } = renderHook(() => useMoodAnalysis());

    await act(async () => {
      await result.current.analyzeMood('I am happy');
    });

    expect(result.current.moodHistory).toHaveLength(1);
    expect(result.current.moodHistory[0].primary).toBe('happy');
  });

  it('should handle analysis errors gracefully', async () => {
    const { result } = renderHook(() => useMoodAnalysis());

    // Mock service to throw error
    const originalAnalyzeMood = MoodAnalysisService.prototype.analyzeMood;
    MoodAnalysisService.prototype.analyzeMood = jest.fn().mockRejectedValue(new Error('Analysis failed'));

    await act(async () => {
      await result.current.analyzeMood('test text');
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isAnalyzing).toBe(false);

    // Restore original method
    MoodAnalysisService.prototype.analyzeMood = originalAnalyzeMood;
  });
});

// Add method declarations for testing
declare module '../moodAnalysisService' {
  interface MoodAnalysisService {
    generateMoodInsights(currentMoods: any[], previousMoods: any[]): Promise<any>;
  }
}