/**
 * Test Suite for Multilingual Crisis Detection Service
 * Tests crisis detection across multiple languages and dialects
 */

import { multilingualCrisisDetectionService } from '../multilingualCrisisDetectionService';

describe('MultilingualCrisisDetectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    multilingualCrisisDetectionService.reset();
  });

  describe('Language Detection', () => {
    it('should auto-detect language', async () => {
      const texts = {
        en: 'I am feeling suicidal',
        es: 'Quiero terminar con mi vida',
        fr: 'Je veux mourir',
        zh: '我想结束生命',
        ar: 'أريد أن أنهي حياتي'
      };

      for (const [lang, text] of Object.entries(texts)) {
        const result = await multilingualCrisisDetectionService.detectCrisis(text);
        expect(result.detectedLanguage).toBe(lang);
        expect(result.languageConfidence).toBeGreaterThan(0.8);
      }
    });

    it('should handle mixed language content', async () => {
      const text = 'I feel muy triste and want to 结束 everything';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text);
      
      expect(result.mixedLanguage).toBe(true);
      expect(result.languages).toContain('en');
      expect(result.languages).toContain('es');
      expect(result.languages).toContain('zh');
      expect(result.primaryLanguage).toBe('en');
    });

    it('should detect dialects and variants', async () => {
      const brazilianText = 'Não aguento mais, quero morrer';
      const europeanText = 'Não aguento mais, quero morrer';
      
      const brResult = await multilingualCrisisDetectionService.detectCrisis(
        brazilianText,
        { region: 'BR' }
      );
      const ptResult = await multilingualCrisisDetectionService.detectCrisis(
        europeanText,
        { region: 'PT' }
      );
      
      expect(brResult.dialect).toBe('pt-BR');
      expect(ptResult.dialect).toBe('pt-PT');
    });
  });

  describe('Crisis Detection Across Languages', () => {
    it('should detect crisis in Spanish', async () => {
      const text = 'Ya no puedo más, quiero acabar con todo';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, { lang: 'es' });
      
      expect(result.detected).toBe(true);
      expect(result.severity).toBeOneOf(['high', 'critical', 'emergency']);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect crisis in Chinese', async () => {
      const text = '我不想活了，太痛苦了';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, { lang: 'zh' });
      
      expect(result.detected).toBe(true);
      expect(result.severity).toBeOneOf(['critical', 'emergency']);
      expect(result.keyPhrases).toBeDefined();
    });

    it('should detect crisis in Arabic', async () => {
      const text = 'لا أريد العيش بعد الآن';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, { lang: 'ar' });
      
      expect(result.detected).toBe(true);
      expect(result.rtlLanguage).toBe(true);
      expect(result.severity).toBeOneOf(['high', 'critical']);
    });

    it('should detect crisis in Hindi', async () => {
      const text = 'मैं अब और नहीं जी सकता';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, { lang: 'hi' });
      
      expect(result.detected).toBe(true);
      expect(result.scriptType).toBe('devanagari');
    });
  });

  describe('Translation and Understanding', () => {
    it('should provide translations for crisis content', async () => {
      const text = 'Je ne veux plus vivre';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, {
        lang: 'fr',
        includeTranslation: true
      });
      
      expect(result.translation).toBeDefined();
      expect(result.translation.en).toContain('live');
      expect(result.translationConfidence).toBeGreaterThan(0.8);
    });

    it('should preserve meaning in translation', async () => {
      const text = 'Estoy pensando en hacerme daño';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, {
        lang: 'es',
        includeTranslation: true
      });
      
      expect(result.detected).toBe(true);
      expect(result.translation.en).toContain('harm');
      expect(result.meaningPreserved).toBe(true);
    });

    it('should handle untranslatable expressions', async () => {
      const text = 'Tengo el mal de vivir'; // French expression in Spanish
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, {
        lang: 'es',
        includeTranslation: true
      });
      
      expect(result.detected).toBe(true);
      expect(result.culturalExpression).toBe(true);
      expect(result.literalTranslation).not.toBe(result.contextualMeaning);
    });
  });

  describe('Colloquialisms and Slang', () => {
    it('should detect crisis in colloquial expressions', async () => {
      const text = "I'm done with this shit, gonna end it";
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text);
      
      expect(result.detected).toBe(true);
      expect(result.informalLanguage).toBe(true);
      expect(result.severity).toBeOneOf(['high', 'critical']);
    });

    it('should understand youth slang', async () => {
      const text = 'Im so over it, might just yeet myself';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text);
      
      expect(result.detected).toBe(true);
      expect(result.slangDetected).toBe(true);
      expect(result.demographicContext).toBe('youth');
    });

    it('should handle internet language', async () => {
      const text = 'kms tbh, cant do this anymore';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text);
      
      expect(result.detected).toBe(true);
      expect(result.abbreviations).toContain('kms');
      expect(result.expandedMeaning.kms).toBe('kill myself');
      expect(result.severity).toBeOneOf(['high', 'critical']);
    });
  });

  describe('Regional Variations', () => {
    it('should handle British vs American English', async () => {
      const ukText = 'I feel absolutely rubbish and want to top myself';
      const usText = 'I feel like garbage and want to kill myself';
      
      const ukResult = await multilingualCrisisDetectionService.detectCrisis(ukText, { region: 'UK' });
      const usResult = await multilingualCrisisDetectionService.detectCrisis(usText, { region: 'US' });
      
      expect(ukResult.detected).toBe(true);
      expect(usResult.detected).toBe(true);
      expect(ukResult.regionalVariant).toBe('en-GB');
      expect(usResult.regionalVariant).toBe('en-US');
    });

    it('should handle Latin American vs European Spanish', async () => {
      const mexicanText = 'Ya valió madre, me quiero morir';
      const spanishText = 'Estoy hecho polvo, quiero morir';
      
      const mxResult = await multilingualCrisisDetectionService.detectCrisis(mexicanText, { region: 'MX' });
      const esResult = await multilingualCrisisDetectionService.detectCrisis(spanishText, { region: 'ES' });
      
      expect(mxResult.detected).toBe(true);
      expect(esResult.detected).toBe(true);
      expect(mxResult.regionalExpressions).toContain('valió madre');
    });
  });

  describe('Script and Character Support', () => {
    it('should handle Cyrillic script', async () => {
      const text = 'Я больше не могу жить';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, { lang: 'ru' });
      
      expect(result.detected).toBe(true);
      expect(result.script).toBe('cyrillic');
    });

    it('should handle right-to-left languages', async () => {
      const hebrewText = 'אני לא רוצה לחיות יותר';
      const arabicText = 'لا أريد أن أعيش';
      
      const heResult = await multilingualCrisisDetectionService.detectCrisis(hebrewText, { lang: 'he' });
      const arResult = await multilingualCrisisDetectionService.detectCrisis(arabicText, { lang: 'ar' });
      
      expect(heResult.rtl).toBe(true);
      expect(arResult.rtl).toBe(true);
      expect(heResult.detected).toBe(true);
      expect(arResult.detected).toBe(true);
    });

    it('should handle emoji and emoticons', async () => {
      const text = 'Feeling 💔 want to ☠️ myself 😢';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text);
      
      expect(result.detected).toBe(true);
      expect(result.emojiContext).toBe(true);
      expect(result.emojiMeaning['💔']).toBe('heartbreak');
      expect(result.emojiMeaning['☠️']).toBe('death');
    });
  });

  describe('Confidence and Accuracy', () => {
    it('should provide language-specific confidence scores', async () => {
      const text = 'Thinking about ending things';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text);
      
      expect(result.languageConfidence).toBeGreaterThan(0.9); // High for English
      expect(result.detectionConfidence).toBeGreaterThan(0.7);
      expect(result.overallConfidence).toBeDefined();
    });

    it('should handle low-resource languages', async () => {
      const text = 'Crisis text in Swahili'; // Simulated
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, { lang: 'sw' });
      
      expect(result.lowResourceLanguage).toBe(true);
      expect(result.fallbackMethod).toBe('keyword_matching');
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('Response Localization', () => {
    it('should provide localized crisis resources', async () => {
      const text = 'Necesito ayuda urgente';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, {
        lang: 'es',
        location: 'MX'
      });
      
      expect(result.resources).toBeDefined();
      expect(result.resources[0].language).toBe('es');
      expect(result.resources[0].country).toBe('MX');
      expect(result.resources[0].name).toContain('México');
    });

    it('should provide culturally appropriate responses', async () => {
      const text = '我需要帮助';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, {
        lang: 'zh',
        culture: 'chinese'
      });
      
      expect(result.response).toBeDefined();
      expect(result.response.language).toBe('zh');
      expect(result.response.culturallyAdapted).toBe(true);
      expect(result.response.message).toMatch(/[\u4e00-\u9fa5]/); // Contains Chinese characters
    });
  });

  describe('Performance Across Languages', () => {
    it('should process all languages within timeout', async () => {
      const languages = ['en', 'es', 'fr', 'de', 'zh', 'ar', 'hi', 'ru'];
      const text = 'Crisis text';
      
      for (const lang of languages) {
        const startTime = Date.now();
        await multilingualCrisisDetectionService.detectCrisis(text, { lang });
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(2000); // 2 second max per language
      }
    });

    it('should cache language models efficiently', async () => {
      const text = 'Test crisis text';
      
      // First call - loads model
      const firstStart = Date.now();
      await multilingualCrisisDetectionService.detectCrisis(text, { lang: 'es' });
      const firstDuration = Date.now() - firstStart;
      
      // Second call - uses cached model
      const secondStart = Date.now();
      await multilingualCrisisDetectionService.detectCrisis(text, { lang: 'es' });
      const secondDuration = Date.now() - secondStart;
      
      expect(secondDuration).toBeLessThan(firstDuration / 2); // Much faster with cache
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported languages gracefully', async () => {
      const text = 'Text in unsupported language';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(text, { lang: 'xyz' });
      
      expect(result.error).toBe('unsupported_language');
      expect(result.fallbackUsed).toBe(true);
      expect(result.fallbackLanguage).toBe('en');
    });

    it('should handle encoding issues', async () => {
      const malformedText = 'Broken encoding \udcff text';
      
      const result = await multilingualCrisisDetectionService.detectCrisis(malformedText);
      
      expect(result).toBeDefined();
      expect(result.encodingIssue).toBe(true);
      expect(result.cleaned).toBe(true);
    });
  });
});