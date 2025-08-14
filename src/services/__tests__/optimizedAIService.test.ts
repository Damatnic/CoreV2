import { AIServiceManager } from '../optimizedAIService';

// Mock AI/ML libraries and APIs
const mockTensorFlow = {
  loadLayersModel: jest.fn(),
  tensor: jest.fn(),
  ready: jest.fn().mockResolvedValue(undefined),
};

const mockModel = {
  predict: jest.fn(),
  dispose: jest.fn(),
  summary: jest.fn(),
};

// Mock fetch for API calls
global.fetch = jest.fn();

jest.mock('@tensorflow/tfjs', () => mockTensorFlow);

describe('AIServiceManager', () => {
  let aiService: AIServiceManager;

  beforeEach(() => {
    aiService = new AIServiceManager();
    jest.clearAllMocks();
    
    mockTensorFlow.loadLayersModel.mockResolvedValue(mockModel);
    mockModel.predict.mockReturnValue({
      dataSync: () => [0.8, 0.2], // Mock prediction scores
      dispose: jest.fn(),
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await aiService.initialize();
      
      expect(mockTensorFlow.ready).toHaveBeenCalled();
    });

    it('should load crisis detection model', async () => {
      await aiService.loadCrisisDetectionModel();
      
      expect(mockTensorFlow.loadLayersModel).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockTensorFlow.ready.mockRejectedValue(new Error('TensorFlow loading failed'));
      
      await expect(aiService.initialize()).rejects.toThrow('TensorFlow loading failed');
    });
  });

  describe('crisis detection', () => {
    beforeEach(async () => {
      await aiService.initialize();
      await aiService.loadCrisisDetectionModel();
    });

    it('should detect crisis in text with high confidence', async () => {
      mockModel.predict.mockReturnValue({
        dataSync: () => [0.9], // High crisis probability
        dispose: jest.fn(),
      });

      const result = await aiService.detectCrisis("I want to hurt myself");

      expect(result.hasCrisis).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.riskLevel).toBe('high');
    });

    it('should not detect crisis in normal text', async () => {
      mockModel.predict.mockReturnValue({
        dataSync: () => [0.1], // Low crisis probability
        dispose: jest.fn(),
      });

      const result = await aiService.detectCrisis("I'm having a good day");

      expect(result.hasCrisis).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.riskLevel).toBe('low');
    });

    it('should handle edge cases with medium confidence', async () => {
      mockModel.predict.mockReturnValue({
        dataSync: () => [0.6], // Medium crisis probability
        dispose: jest.fn(),
      });

      const result = await aiService.detectCrisis("I'm feeling down lately");

      expect(result.riskLevel).toBe('medium');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe('sentiment analysis', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    it('should analyze positive sentiment correctly', async () => {
      mockModel.predict.mockReturnValue({
        dataSync: () => [0.1, 0.9], // [negative, positive]
        dispose: jest.fn(),
      });

      const result = await aiService.analyzeSentiment("I'm feeling great today!");

      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.score).toBeGreaterThan(0.5);
    });

    it('should analyze negative sentiment correctly', async () => {
      mockModel.predict.mockReturnValue({
        dataSync: () => [0.85, 0.15], // [negative, positive]
        dispose: jest.fn(),
      });

      const result = await aiService.analyzeSentiment("I'm feeling terrible");

      expect(result.sentiment).toBe('negative');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.score).toBeLessThan(-0.5);
    });

    it('should handle neutral sentiment', async () => {
      mockModel.predict.mockReturnValue({
        dataSync: () => [0.5, 0.5], // Neutral
        dispose: jest.fn(),
      });

      const result = await aiService.analyzeSentiment("The weather is okay");

      expect(result.sentiment).toBe('neutral');
      expect(Math.abs(result.score)).toBeLessThan(0.3);
    });
  });

  describe('response generation', () => {
    beforeEach(async () => {
      await aiService.initialize();
      
      // Mock API response for text generation
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ text: "I understand you're going through a difficult time..." }]
        })
      });
    });

    it('should generate appropriate crisis response', async () => {
      const response = await aiService.generateCrisisResponse(
        "I'm having thoughts of self-harm",
        { riskLevel: 'high', confidence: 0.9 }
      );

      expect(response.text).toBeDefined();
      expect(response.urgency).toBe('immediate');
      expect(response.resources).toContain(expect.stringMatching(/crisis|hotline|emergency/i));
    });

    it('should generate supportive response for medium risk', async () => {
      const response = await aiService.generateSupportiveResponse(
        "I'm feeling really down",
        { sentiment: 'negative', confidence: 0.7 }
      );

      expect(response.text).toBeDefined();
      expect(response.tone).toBe('supportive');
      expect(response.suggestions.length).toBeGreaterThan(0);
    });

    it('should generate contextual response', async () => {
      const response = await aiService.generateContextualResponse(
        "I'm anxious about work",
        { 
          context: 'workplace_stress',
          userHistory: ['anxiety', 'work_related'],
          culturalBackground: 'western'
        }
      );

      expect(response.text).toBeDefined();
      expect(response.personalized).toBe(true);
      expect(response.context).toBe('workplace_stress');
    });
  });

  describe('model optimization', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    it('should optimize model for mobile devices', async () => {
      const optimizedModel = await aiService.optimizeForMobile();

      expect(optimizedModel.quantized).toBe(true);
      expect(optimizedModel.size).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    it('should perform model quantization', async () => {
      const result = await aiService.quantizeModel(mockModel);

      expect(result.quantized).toBe(true);
      expect(result.compressionRatio).toBeGreaterThan(0.5);
    });

    it('should handle batch predictions efficiently', async () => {
      const texts = ["text1", "text2", "text3"];
      
      const results = await aiService.batchPredict(texts);

      expect(results).toHaveLength(3);
      expect(mockModel.predict).toHaveBeenCalledTimes(1); // Batch call
    });
  });

  describe('performance monitoring', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    it('should track inference performance', async () => {
      await aiService.detectCrisis("test text");

      const metrics = aiService.getPerformanceMetrics();

      expect(metrics.averageInferenceTime).toBeDefined();
      expect(metrics.totalPredictions).toBeGreaterThan(0);
      expect(metrics.successRate).toBeDefined();
    });

    it('should monitor model accuracy', async () => {
      const accuracy = await aiService.evaluateModelAccuracy([
        { text: "I'm happy", expectedLabel: 'positive' },
        { text: "I'm sad", expectedLabel: 'negative' }
      ]);

      expect(accuracy.overall).toBeDefined();
      expect(accuracy.byClass).toBeDefined();
      expect(accuracy.confusionMatrix).toBeDefined();
    });

    it('should track resource usage', () => {
      const usage = aiService.getResourceUsage();

      expect(usage.memoryUsage).toBeDefined();
      expect(usage.cpuUsage).toBeDefined();
      expect(usage.gpuUsage).toBeDefined();
    });
  });

  describe('error handling and fallbacks', () => {
    it('should handle model loading failures', async () => {
      mockTensorFlow.loadLayersModel.mockRejectedValue(new Error('Model loading failed'));

      await expect(aiService.loadCrisisDetectionModel()).rejects.toThrow();
    });

    it('should fallback to rule-based detection when model fails', async () => {
      mockModel.predict.mockImplementation(() => {
        throw new Error('Prediction failed');
      });

      const result = await aiService.detectCrisisWithFallback("I want to die");

      expect(result.method).toBe('rule_based');
      expect(result.hasCrisis).toBe(true);
    });

    it('should handle malformed input gracefully', async () => {
      const result = await aiService.detectCrisis("");

      expect(result.hasCrisis).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should handle network errors in API calls', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await aiService.generateCrisisResponse("test", { riskLevel: 'high' });

      expect(result.text).toBeDefined(); // Should use fallback
      expect(result.source).toBe('fallback');
    });
  });

  describe('privacy and security', () => {
    it('should anonymize input before processing', async () => {
      const anonymizeSpy = jest.spyOn(aiService, 'anonymizeInput');
      anonymizeSpy.mockReturnValue('anonymized text');

      await aiService.detectCrisis("My name is John and I live at 123 Main St");

      expect(anonymizeSpy).toHaveBeenCalled();
    });

    it('should not store sensitive data', async () => {
      await aiService.detectCrisis("I have depression and take medication");

      const storedData = aiService.getStoredData();
      
      expect(storedData.some((item: unknown) => 
        item.includes('depression') || item.includes('medication')
      )).toBe(false);
    });

    it('should encrypt model data at rest', () => {
      const isEncrypted = aiService.isModelDataEncrypted();
      
      expect(isEncrypted).toBe(true);
    });
  });

  describe('cultural context adaptation', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    it('should adapt responses for different cultural contexts', async () => {
      const westernResponse = await aiService.generateCulturallyAdaptedResponse(
        "I'm struggling", 
        'western'
      );
      
      const easternResponse = await aiService.generateCulturallyAdaptedResponse(
        "I'm struggling", 
        'eastern'
      );

      expect(westernResponse.culturalContext).toBe('western');
      expect(easternResponse.culturalContext).toBe('eastern');
      expect(westernResponse.text).not.toBe(easternResponse.text);
    });

    it('should consider cultural taboos in responses', async () => {
      const response = await aiService.generateCulturallyAdaptedResponse(
        "Family problems", 
        'collectivist',
        { considerTaboos: true }
      );

      expect(response.culturalSensitivity.checked).toBe(true);
      expect(response.containsTaboos).toBe(false);
    });
  });
});

// Add method stubs for testing
declare module '../optimizedAIService' {
  interface AIServiceManager {
    initialize(): Promise<void>;
    loadCrisisDetectionModel(): Promise<void>;
    detectCrisis(text: string): Promise<unknown>;
    analyzeSentiment(text: string): Promise<unknown>;
    generateCrisisResponse(text: string, context: any): Promise<unknown>;
    generateSupportiveResponse(text: string, context: any): Promise<unknown>;
    generateContextualResponse(text: string, context: any): Promise<unknown>;
    optimizeForMobile(): Promise<unknown>;
    quantizeModel(model: any): Promise<unknown>;
    batchPredict(texts: string[]): Promise<any[]>;
    getPerformanceMetrics(): any;
    evaluateModelAccuracy(testData: unknown[]): Promise<unknown>;
    getResourceUsage(): any;
    detectCrisisWithFallback(text: string): Promise<unknown>;
    anonymizeInput(text: string): string;
    getStoredData(): unknown[];
    isModelDataEncrypted(): boolean;
    generateCulturallyAdaptedResponse(text: string, culture: string, options?: any): Promise<unknown>;
  }
}