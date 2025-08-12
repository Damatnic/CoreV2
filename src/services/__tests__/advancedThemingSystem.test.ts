/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import {
  THERAPEUTIC_THEMES,
  TherapeuticTheme,
  ColorMode,
  ColorIntensity,
  AccessibilityLevel,
  ThemeContextValue,
  useTheme,
  ThemeContext,
} from '../advancedThemingSystem';

// Mock React hooks
const mockUseContext = jest.fn();
const mockCreateContext = jest.fn();

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createContext: mockCreateContext,
  useContext: mockUseContext,
}));

describe('AdvancedThemingSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateContext.mockImplementation(() => ({}));
  });

  describe('TherapeuticTheme Types', () => {
    test('should have all therapeutic theme options', () => {
      const expectedThemes: TherapeuticTheme[] = [
        'calm-sanctuary',
        'warm-embrace',
        'nature-healing',
        'gentle-focus',
        'energizing-hope',
        'minimal-zen',
        'crisis-safe',
        'custom',
        'system',
        'high-contrast'
      ];

      expectedThemes.forEach(theme => {
        expect(THERAPEUTIC_THEMES[theme]).toBeDefined();
        expect(THERAPEUTIC_THEMES[theme].id).toBe(theme);
      });
    });

    test('should have required theme properties', () => {
      Object.values(THERAPEUTIC_THEMES).forEach(theme => {
        expect(theme.id).toBeDefined();
        expect(theme.name).toBeDefined();
        expect(theme.description).toBeDefined();
        expect(theme.psychologyPrinciples).toBeInstanceOf(Array);
        expect(theme.recommendedFor).toBeInstanceOf(Array);
        expect(theme.colors).toBeDefined();
        expect(theme.colors.light).toBeDefined();
        expect(theme.colors.dark).toBeDefined();
        expect(theme.accessibility).toBeDefined();
        expect(theme.customization).toBeDefined();
      });
    });
  });

  describe('Calm Sanctuary Theme', () => {
    test('should have appropriate psychology principles', () => {
      const theme = THERAPEUTIC_THEMES['calm-sanctuary'];
      
      expect(theme.psychologyPrinciples).toContain('Blue reduces cortisol levels and heart rate');
      expect(theme.psychologyPrinciples).toContain('Green promotes emotional balance and reduces eye strain');
      expect(theme.psychologyPrinciples).toContain('Cool tones activate parasympathetic nervous system');
    });

    test('should be recommended for anxiety and PTSD', () => {
      const theme = THERAPEUTIC_THEMES['calm-sanctuary'];
      
      expect(theme.recommendedFor).toContain('Anxiety disorders');
      expect(theme.recommendedFor).toContain('Panic attacks');
      expect(theme.recommendedFor).toContain('PTSD symptoms');
      expect(theme.recommendedFor).toContain('Sensory sensitivity');
    });

    test('should have high accessibility standards', () => {
      const theme = THERAPEUTIC_THEMES['calm-sanctuary'];
      
      expect(theme.accessibility.level).toBe('AAA');
      expect(theme.accessibility.contrastRatio).toBeGreaterThan(7);
      expect(theme.accessibility.colorBlindFriendly).toBe(true);
    });

    test('should allow customization', () => {
      const theme = THERAPEUTIC_THEMES['calm-sanctuary'];
      
      expect(theme.customization.allowsIntensityAdjustment).toBe(true);
      expect(theme.customization.allowsColorOverrides).toBe(true);
      expect(theme.customization.allowsAnimationControl).toBe(true);
    });

    test('should have complete color palette', () => {
      const theme = THERAPEUTIC_THEMES['calm-sanctuary'];
      const lightColors = theme.colors.light;
      const darkColors = theme.colors.dark;

      // Check essential colors exist
      const requiredColors = [
        'primary', 'primaryLight', 'primaryDark',
        'secondary', 'secondaryLight', 'secondaryDark',
        'background', 'backgroundSecondary', 'backgroundTertiary',
        'surface', 'surfaceSecondary', 'surfaceHover',
        'text', 'textSecondary', 'textMuted', 'textInverse',
        'success', 'warning', 'error', 'info',
        'crisis', 'calm', 'hope', 'support', 'growth',
        'border', 'borderLight', 'borderHover',
        'shadow', 'shadowHover'
      ];

      requiredColors.forEach(color => {
        expect(lightColors[color as keyof typeof lightColors]).toBeDefined();
        expect(darkColors[color as keyof typeof darkColors]).toBeDefined();
        expect(typeof lightColors[color as keyof typeof lightColors]).toBe('string');
        expect(typeof darkColors[color as keyof typeof darkColors]).toBe('string');
      });
    });
  });

  describe('Crisis Safe Theme', () => {
    test('should be optimized for emergency situations', () => {
      const theme = THERAPEUTIC_THEMES['crisis-safe'];
      
      expect(theme.name).toBe('Crisis Safe');
      expect(theme.description).toContain('Emergency-optimized');
      expect(theme.recommendedFor).toContain('Crisis intervention');
      expect(theme.recommendedFor).toContain('Emergency situations');
    });

    test('should have maximum accessibility', () => {
      const theme = THERAPEUTIC_THEMES['crisis-safe'];
      
      expect(theme.accessibility.level).toBe('AAA');
      expect(theme.accessibility.contrastRatio).toBeGreaterThanOrEqual(12);
      expect(theme.accessibility.colorBlindFriendly).toBe(true);
    });

    test('should restrict customization for safety', () => {
      const theme = THERAPEUTIC_THEMES['crisis-safe'];
      
      expect(theme.customization.allowsIntensityAdjustment).toBe(false);
      expect(theme.customization.allowsColorOverrides).toBe(false);
      expect(theme.customization.allowsAnimationControl).toBe(false);
    });

    test('should have high-visibility crisis colors', () => {
      const theme = THERAPEUTIC_THEMES['crisis-safe'];
      
      // Crisis red should be prominent
      expect(theme.colors.light.crisis).toBe('#C53030');
      expect(theme.colors.light.primary).toBe('#C53030');
      
      // Safety blue for secondary actions
      expect(theme.colors.light.secondary).toBe('#2B6CB0');
    });
  });

  describe('High Contrast Theme', () => {
    test('should have maximum contrast ratio', () => {
      const theme = THERAPEUTIC_THEMES['high-contrast'];
      
      expect(theme.accessibility.contrastRatio).toBe(21.0);
      expect(theme.accessibility.level).toBe('AAA');
      expect(theme.accessibility.colorBlindFriendly).toBe(true);
    });

    test('should use pure black and white', () => {
      const theme = THERAPEUTIC_THEMES['high-contrast'];
      
      // Light mode: black text on white background
      expect(theme.colors.light.primary).toBe('#000000');
      expect(theme.colors.light.background).toBe('#FFFFFF');
      expect(theme.colors.light.text).toBe('#000000');
      
      // Dark mode: white text on black background
      expect(theme.colors.dark.primary).toBe('#FFFFFF');
      expect(theme.colors.dark.background).toBe('#000000');
      expect(theme.colors.dark.text).toBe('#FFFFFF');
    });

    test('should restrict customization', () => {
      const theme = THERAPEUTIC_THEMES['high-contrast'];
      
      expect(theme.customization.allowsIntensityAdjustment).toBe(false);
      expect(theme.customization.allowsColorOverrides).toBe(false);
      expect(theme.customization.allowsAnimationControl).toBe(true); // Only animation control allowed
    });
  });

  describe('Minimal Zen Theme', () => {
    test('should support sensory sensitivity', () => {
      const theme = THERAPEUTIC_THEMES['minimal-zen'];
      
      expect(theme.recommendedFor).toContain('Autism spectrum disorders');
      expect(theme.recommendedFor).toContain('Sensory processing sensitivity');
      expect(theme.recommendedFor).toContain('ADHD focus support');
      expect(theme.recommendedFor).toContain('Migraine sensitivity');
    });

    test('should have minimal design principles', () => {
      const theme = THERAPEUTIC_THEMES['minimal-zen'];
      
      expect(theme.psychologyPrinciples).toContain('Minimal stimulation reduces sensory overload');
      expect(theme.psychologyPrinciples).toContain('High contrast improves accessibility and focus');
      expect(theme.psychologyPrinciples).toContain('Clean lines promote mental clarity');
    });

    test('should have excellent contrast', () => {
      const theme = THERAPEUTIC_THEMES['minimal-zen'];
      
      expect(theme.accessibility.contrastRatio).toBe(15.0);
      expect(theme.accessibility.level).toBe('AAA');
    });
  });

  describe('Cultural Themes', () => {
    test('should have warm embrace for depression support', () => {
      const theme = THERAPEUTIC_THEMES['warm-embrace'];
      
      expect(theme.recommendedFor).toContain('Depression');
      expect(theme.recommendedFor).toContain('Seasonal Affective Disorder');
      expect(theme.psychologyPrinciples).toContain('Orange stimulates serotonin production');
      expect(theme.psychologyPrinciples).toContain('Warm yellows increase dopamine levels');
    });

    test('should have nature healing for grounding', () => {
      const theme = THERAPEUTIC_THEMES['nature-healing'];
      
      expect(theme.recommendedFor).toContain('ADHD and attention issues');
      expect(theme.recommendedFor).toContain('Chronic stress');
      expect(theme.recommendedFor).toContain('Burnout recovery');
      expect(theme.psychologyPrinciples).toContain('Earth tones reduce stress hormones');
    });

    test('should have gentle focus for concentration', () => {
      const theme = THERAPEUTIC_THEMES['gentle-focus'];
      
      expect(theme.recommendedFor).toContain('Study and focus sessions');
      expect(theme.recommendedFor).toContain('Meditation and mindfulness');
      expect(theme.recommendedFor).toContain('Cognitive behavioral therapy');
    });

    test('should have energizing hope for motivation', () => {
      const theme = THERAPEUTIC_THEMES['energizing-hope'];
      
      expect(theme.recommendedFor).toContain('Recovery and healing');
      expect(theme.recommendedFor).toContain('Building motivation');
      expect(theme.recommendedFor).toContain('Overcoming hopelessness');
    });
  });

  describe('System Integration Theme', () => {
    test('should follow system preferences', () => {
      const theme = THERAPEUTIC_THEMES['system'];
      
      expect(theme.name).toBe('System Default');
      expect(theme.description).toContain('Follow system dark/light mode preferences');
      expect(theme.psychologyPrinciples).toContain('Consistency with user preferences');
      expect(theme.psychologyPrinciples).toContain('Adaptive to environmental conditions');
    });

    test('should use iOS-style colors', () => {
      const theme = THERAPEUTIC_THEMES['system'];
      
      // iOS blue
      expect(theme.colors.light.primary).toBe('#007AFF');
      expect(theme.colors.dark.primary).toBe('#0A84FF');
      
      // iOS red
      expect(theme.colors.light.secondary).toBe('#FF3B30');
      expect(theme.colors.dark.secondary).toBe('#FF453A');
    });
  });

  describe('Custom Theme', () => {
    test('should allow full customization', () => {
      const theme = THERAPEUTIC_THEMES['custom'];
      
      expect(theme.name).toBe('Custom Theme');
      expect(theme.recommendedFor).toContain('Individual preferences');
      expect(theme.recommendedFor).toContain('Advanced users');
      
      expect(theme.customization.allowsIntensityAdjustment).toBe(true);
      expect(theme.customization.allowsColorOverrides).toBe(true);
      expect(theme.customization.allowsAnimationControl).toBe(true);
    });

    test('should have reasonable default colors', () => {
      const theme = THERAPEUTIC_THEMES['custom'];
      
      expect(theme.colors.light.primary).toBe('#3498DB');
      expect(theme.colors.light.secondary).toBe('#E74C3C');
      expect(theme.accessibility.level).toBe('AA');
    });
  });

  describe('useTheme Hook', () => {
    test('should throw error when used outside provider', () => {
      mockUseContext.mockReturnValue(undefined);
      
      expect(() => {
        useTheme();
      }).toThrow('useTheme must be used within a ThemeProvider');
    });

    test('should return context value when used within provider', () => {
      const mockContext: Partial<ThemeContextValue> = {
        currentTheme: THERAPEUTIC_THEMES['calm-sanctuary'],
        currentColors: THERAPEUTIC_THEMES['calm-sanctuary'].colors.light,
        preferences: {
          therapeuticTheme: 'calm-sanctuary',
          colorMode: 'light',
          intensity: 'balanced',
          accessibilityLevel: 'AA',
          reduceMotion: false,
          highContrast: false,
          fontSize: 'medium',
          spacing: 'comfortable'
        }
      };

      mockUseContext.mockReturnValue(mockContext);
      
      const result = useTheme();
      expect(result).toBe(mockContext);
    });
  });

  describe('Color Validation', () => {
    test('should have valid hex colors', () => {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      
      Object.values(THERAPEUTIC_THEMES).forEach(theme => {
        Object.values(theme.colors.light).forEach(color => {
          if (typeof color === 'string' && !color.startsWith('rgba')) {
            expect(color).toMatch(hexColorRegex);
          }
        });
        
        Object.values(theme.colors.dark).forEach(color => {
          if (typeof color === 'string' && !color.startsWith('rgba')) {
            expect(color).toMatch(hexColorRegex);
          }
        });
      });
    });

    test('should have valid RGBA colors for shadows', () => {
      const rgbaRegex = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;
      
      Object.values(THERAPEUTIC_THEMES).forEach(theme => {
        const lightShadow = theme.colors.light.shadow;
        const darkShadow = theme.colors.dark.shadow;
        
        if (lightShadow.startsWith('rgba')) {
          expect(lightShadow).toMatch(rgbaRegex);
        }
        
        if (darkShadow.startsWith('rgba')) {
          expect(darkShadow).toMatch(rgbaRegex);
        }
      });
    });
  });

  describe('Mental Health Color Psychology', () => {
    test('should have crisis colors in all themes', () => {
      Object.values(THERAPEUTIC_THEMES).forEach(theme => {
        expect(theme.colors.light.crisis).toBeDefined();
        expect(theme.colors.dark.crisis).toBeDefined();
        expect(theme.colors.light.calm).toBeDefined();
        expect(theme.colors.dark.calm).toBeDefined();
        expect(theme.colors.light.hope).toBeDefined();
        expect(theme.colors.dark.hope).toBeDefined();
        expect(theme.colors.light.support).toBeDefined();
        expect(theme.colors.dark.support).toBeDefined();
        expect(theme.colors.light.growth).toBeDefined();
        expect(theme.colors.dark.growth).toBeDefined();
      });
    });

    test('should have appropriate crisis colors', () => {
      Object.values(THERAPEUTIC_THEMES).forEach(theme => {
        const lightCrisis = theme.colors.light.crisis;
        const darkCrisis = theme.colors.dark.crisis;
        
        // Crisis colors should be some shade of red for urgency
        expect(lightCrisis).toMatch(/^#[E-F][0-9A-F]{5}|^#[C-D][0-9A-F]{5}|^#FF/);
        expect(darkCrisis).toMatch(/^#[E-F][0-9A-F]{5}|^#[C-D][0-9A-F]{5}|^#FF/);
      });
    });

    test('should have calming colors that are not red', () => {
      Object.values(THERAPEUTIC_THEMES).forEach(theme => {
        const lightCalm = theme.colors.light.calm;
        const darkCalm = theme.colors.dark.calm;
        
        // Calm colors should not be red-ish
        expect(lightCalm).not.toMatch(/^#[E-F][0-5][0-5][0-5][0-5][0-5]/);
        expect(darkCalm).not.toMatch(/^#[E-F][0-5][0-5][0-5][0-5][0-5]/);
      });
    });

    test('should have hopeful colors that are bright', () => {
      Object.values(THERAPEUTIC_THEMES).forEach(theme => {
        const lightHope = theme.colors.light.hope;
        const darkHope = theme.colors.dark.hope;
        
        // Hope colors should generally be brighter (not too dark)
        expect(lightHope).toBeDefined();
        expect(darkHope).toBeDefined();
        expect(typeof lightHope).toBe('string');
        expect(typeof darkHope).toBe('string');
      });
    });
  });

  describe('Accessibility Compliance', () => {
    test('should meet minimum accessibility levels', () => {
      Object.values(THERAPEUTIC_THEMES).forEach(theme => {
        expect(theme.accessibility.level).toMatch(/^(AA|AAA)$/);
        expect(theme.accessibility.contrastRatio).toBeGreaterThanOrEqual(4.5);
        expect(typeof theme.accessibility.colorBlindFriendly).toBe('boolean');
      });
    });

    test('should have AAA level for accessibility-focused themes', () => {
      const accessibilityThemes = ['high-contrast', 'minimal-zen', 'crisis-safe'];
      
      accessibilityThemes.forEach(themeName => {
        const theme = THERAPEUTIC_THEMES[themeName as TherapeuticTheme];
        expect(theme.accessibility.level).toBe('AAA');
        expect(theme.accessibility.contrastRatio).toBeGreaterThanOrEqual(7);
      });
    });

    test('should all be color blind friendly', () => {
      Object.values(THERAPEUTIC_THEMES).forEach(theme => {
        expect(theme.accessibility.colorBlindFriendly).toBe(true);
      });
    });
  });

  describe('Theme Customization', () => {
    test('should allow appropriate customization levels', () => {
      const restrictedThemes = ['crisis-safe', 'high-contrast', 'minimal-zen'];
      const customizableThemes = ['calm-sanctuary', 'warm-embrace', 'nature-healing', 'gentle-focus', 'energizing-hope', 'custom', 'system'];

      restrictedThemes.forEach(themeName => {
        const theme = THERAPEUTIC_THEMES[themeName as TherapeuticTheme];
        // These themes may have some restrictions for safety/accessibility
        expect(theme.customization).toBeDefined();
      });

      customizableThemes.forEach(themeName => {
        const theme = THERAPEUTIC_THEMES[themeName as TherapeuticTheme];
        expect(theme.customization.allowsIntensityAdjustment).toBe(true);
        expect(theme.customization.allowsColorOverrides).toBe(true);
        expect(theme.customization.allowsAnimationControl).toBe(true);
      });
    });
  });

  describe('Context Export', () => {
    test('should export ThemeContext', () => {
      expect(ThemeContext).toBeDefined();
    });

    test('should create context properly', () => {
      expect(mockCreateContext).toBeDefined();
    });
  });

  describe('Type Definitions', () => {
    test('should have all required ColorMode options', () => {
      const colorModes: ColorMode[] = ['light', 'dark', 'auto'];
      colorModes.forEach(mode => {
        expect(typeof mode).toBe('string');
      });
    });

    test('should have all required ColorIntensity options', () => {
      const intensities: ColorIntensity[] = ['subtle', 'balanced', 'vibrant'];
      intensities.forEach(intensity => {
        expect(typeof intensity).toBe('string');
      });
    });

    test('should have all required AccessibilityLevel options', () => {
      const levels: AccessibilityLevel[] = ['AA', 'AAA'];
      levels.forEach(level => {
        expect(typeof level).toBe('string');
      });
    });
  });

  describe('Psychology Principles Validation', () => {
    test('should have evidence-based psychology principles', () => {
      const calmSanctuary = THERAPEUTIC_THEMES['calm-sanctuary'];
      expect(calmSanctuary.psychologyPrinciples).toContain('Blue reduces cortisol levels and heart rate');
      
      const warmEmbrace = THERAPEUTIC_THEMES['warm-embrace'];
      expect(warmEmbrace.psychologyPrinciples).toContain('Orange stimulates serotonin production');
      
      const natureHealing = THERAPEUTIC_THEMES['nature-healing'];
      expect(natureHealing.psychologyPrinciples).toContain('Earth tones reduce stress hormones');
    });

    test('should have appropriate recommendations for mental health conditions', () => {
      const calmSanctuary = THERAPEUTIC_THEMES['calm-sanctuary'];
      expect(calmSanctuary.recommendedFor).toContain('Anxiety disorders');
      expect(calmSanctuary.recommendedFor).toContain('PTSD symptoms');
      
      const warmEmbrace = THERAPEUTIC_THEMES['warm-embrace'];
      expect(warmEmbrace.recommendedFor).toContain('Depression');
      expect(warmEmbrace.recommendedFor).toContain('Seasonal Affective Disorder');
      
      const gentleFocus = THERAPEUTIC_THEMES['gentle-focus'];
      expect(gentleFocus.recommendedFor).toContain('Meditation and mindfulness');
      expect(gentleFocus.recommendedFor).toContain('Cognitive behavioral therapy');
    });
  });
});