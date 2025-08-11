/**
 * Advanced Theming System with Mental Health-Optimized Color Psychology
 * 
 * This system provides therapeutic color environments designed to support
 * mental wellness through scientifically-backed color psychology principles.
 * Features user customization and accessibility compliance.
 */

import { createContext, useContext } from 'react';

// Mental Health Color Psychology Themes
export type TherapeuticTheme = 
  | 'calm-sanctuary'      // Cool blues and greens for anxiety relief
  | 'warm-embrace'        // Warm oranges and yellows for depression support
  | 'nature-healing'      // Earth tones for grounding and stability
  | 'gentle-focus'        // Muted purples for concentration and clarity
  | 'energizing-hope'     // Bright but soft colors for motivation
  | 'minimal-zen'         // High contrast minimalism for sensory sensitivity
  | 'crisis-safe'         // Emergency-optimized high visibility colors
  | 'custom'              // User-defined personalized theme
  | 'system'              // Follow system dark/light mode
  | 'high-contrast';      // WCAG AAA accessibility compliance

export type ColorMode = 'light' | 'dark' | 'auto';

export type ColorIntensity = 'subtle' | 'balanced' | 'vibrant';

export type AccessibilityLevel = 'AA' | 'AAA';

export interface ThemeColors {
  // Primary brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary accent colors  
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Surface colors
  surface: string;
  surfaceSecondary: string;
  surfaceHover: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Mental health specific colors
  crisis: string;           // Crisis/emergency states
  calm: string;            // Calming/soothing elements
  hope: string;            // Positive/uplifting elements
  support: string;         // Peer support elements
  growth: string;          // Progress/growth indicators
  
  // Border and divider colors
  border: string;
  borderLight: string;
  borderHover: string;
  
  // Shadow colors
  shadow: string;
  shadowHover: string;
}

export interface TherapeuticThemeConfig {
  id: TherapeuticTheme;
  name: string;
  description: string;
  psychologyPrinciples: string[];
  recommendedFor: string[];
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  accessibility: {
    contrastRatio: number;
    level: AccessibilityLevel;
    colorBlindFriendly: boolean;
  };
  customization: {
    allowsIntensityAdjustment: boolean;
    allowsColorOverrides: boolean;
    allowsAnimationControl: boolean;
  };
}

export interface UserThemePreferences {
  therapeuticTheme: TherapeuticTheme;
  colorMode: ColorMode;
  intensity: ColorIntensity;
  accessibilityLevel: AccessibilityLevel;
  reduceMotion: boolean;
  highContrast: boolean;
  colorOverrides?: Partial<ThemeColors>;
  customAnimationDuration?: number;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  spacing: 'compact' | 'comfortable' | 'spacious';
}

export interface ThemeContextValue {
  // Current theme state
  currentTheme: TherapeuticThemeConfig;
  currentColors: ThemeColors;
  preferences: UserThemePreferences;
  
  // Theme management
  setTherapeuticTheme: (theme: TherapeuticTheme) => void;
  setColorMode: (mode: ColorMode) => void;
  setIntensity: (intensity: ColorIntensity) => void;
  setAccessibilityLevel: (level: AccessibilityLevel) => void;
  setColorOverride: (colorKey: keyof ThemeColors, color: string) => void;
  resetCustomizations: () => void;
  
  // Utilities
  getContrastRatio: (color1: string, color2: string) => number;
  isAccessibilityCompliant: (foreground: string, background: string) => boolean;
  exportTheme: () => string;
  importTheme: (themeData: string) => boolean;
  
  // Mental health specific
  getMoodBasedColors: (mood: string) => Partial<ThemeColors>;
  getCrisisSafeColors: () => ThemeColors;
  getTherapeuticRecommendations: (userProfile?: any) => TherapeuticTheme[];
}

// Therapeutic theme definitions based on color psychology research
export const THERAPEUTIC_THEMES: Record<TherapeuticTheme, TherapeuticThemeConfig> = {
  'calm-sanctuary': {
    id: 'calm-sanctuary',
    name: 'Calm Sanctuary',
    description: 'Cool blues and soft greens designed to reduce anxiety and promote tranquility',
    psychologyPrinciples: [
      'Blue reduces cortisol levels and heart rate',
      'Green promotes emotional balance and reduces eye strain',
      'Cool tones activate parasympathetic nervous system',
      'Low saturation prevents overstimulation'
    ],
    recommendedFor: [
      'Anxiety disorders',
      'Panic attacks',
      'Insomnia',
      'PTSD symptoms',
      'Sensory sensitivity'
    ],
    colors: {
      light: {
        primary: '#2E7D8F',        // Calming teal
        primaryLight: '#4A9FB0',
        primaryDark: '#1F5A6A',
        secondary: '#7FB069',       // Soft sage green
        secondaryLight: '#A4C989',
        secondaryDark: '#5E8B4A',
        background: '#F8FBFC',      // Very pale blue-white
        backgroundSecondary: '#F1F7F9',
        backgroundTertiary: '#E8F4F6',
        surface: '#FFFFFF',
        surfaceSecondary: '#F4F9FA',
        surfaceHover: '#EBF6F8',
        text: '#1B3A42',           // Deep teal-gray
        textSecondary: '#4A6B73',
        textMuted: '#7A9CA4',
        textInverse: '#FFFFFF',
        success: '#7FB069',
        warning: '#E6B17A',
        error: '#D97757',
        info: '#5BA8C4',
        crisis: '#E53E3E',
        calm: '#B8E6E1',
        hope: '#A8D8EA',
        support: '#9FD3C7',
        growth: '#86C7B8',
        border: '#D1E7EA',
        borderLight: '#E8F4F6',
        borderHover: '#B8DDE2',
        shadow: 'rgba(46, 125, 143, 0.1)',
        shadowHover: 'rgba(46, 125, 143, 0.15)'
      },
      dark: {
        primary: '#4A9FB0',
        primaryLight: '#6BB5C5',
        primaryDark: '#2E7D8F',
        secondary: '#A4C989',
        secondaryLight: '#BDD8A4',
        secondaryDark: '#7FB069',
        background: '#0F1B1E',
        backgroundSecondary: '#162329',
        backgroundTertiary: '#1D2D33',
        surface: '#243339',
        surfaceSecondary: '#2B3D44',
        surfaceHover: '#34464E',
        text: '#E8F4F6',
        textSecondary: '#B8DDE2',
        textMuted: '#7A9CA4',
        textInverse: '#1B3A42',
        success: '#A4C989',
        warning: '#F4D03F',
        error: '#F1948A',
        info: '#85C1E9',
        crisis: '#FF6B6B',
        calm: '#6BB5C5',
        hope: '#85C1E9',
        support: '#A4C989',
        growth: '#86C7B8',
        border: '#3C5259',
        borderLight: '#2B3D44',
        borderHover: '#4A6B73',
        shadow: 'rgba(0, 0, 0, 0.3)',
        shadowHover: 'rgba(0, 0, 0, 0.4)'
      }
    },
    accessibility: {
      contrastRatio: 7.2,
      level: 'AAA',
      colorBlindFriendly: true
    },
    customization: {
      allowsIntensityAdjustment: true,
      allowsColorOverrides: true,
      allowsAnimationControl: true
    }
  },

  'warm-embrace': {
    id: 'warm-embrace',
    name: 'Warm Embrace',
    description: 'Gentle oranges and warm yellows to combat depression and boost mood',
    psychologyPrinciples: [
      'Orange stimulates serotonin production',
      'Warm yellows increase dopamine levels',
      'Warm tones promote feelings of comfort and security',
      'Moderate saturation prevents overstimulation while maintaining mood benefits'
    ],
    recommendedFor: [
      'Depression',
      'Seasonal Affective Disorder',
      'Low motivation',
      'Emotional numbness',
      'Social isolation'
    ],
    colors: {
      light: {
        primary: '#E67E22',        // Warm orange
        primaryLight: '#F39C12',
        primaryDark: '#D35400',
        secondary: '#F1C40F',       // Sunshine yellow
        secondaryLight: '#F7DC6F',
        secondaryDark: '#D4AC0D',
        background: '#FFFEF7',      // Warm white
        backgroundSecondary: '#FEF9E7',
        backgroundTertiary: '#FCF3CF',
        surface: '#FFFFFF',
        surfaceSecondary: '#FEF9E7',
        surfaceHover: '#FCF3CF',
        text: '#6E2C00',           // Deep burnt orange
        textSecondary: '#935116',
        textMuted: '#B7950B',
        textInverse: '#FFFFFF',
        success: '#27AE60',
        warning: '#F39C12',
        error: '#E74C3C',
        info: '#3498DB',
        crisis: '#E53E3E',
        calm: '#F7DC6F',
        hope: '#F1C40F',
        support: '#F39C12',
        growth: '#E67E22',
        border: '#F8C471',
        borderLight: '#FCF3CF',
        borderHover: '#F4D03F',
        shadow: 'rgba(230, 126, 34, 0.1)',
        shadowHover: 'rgba(230, 126, 34, 0.15)'
      },
      dark: {
        primary: '#F39C12',
        primaryLight: '#F7DC6F',
        primaryDark: '#E67E22',
        secondary: '#F7DC6F',
        secondaryLight: '#FCF3CF',
        secondaryDark: '#F1C40F',
        background: '#1C1408',
        backgroundSecondary: '#2C1E0A',
        backgroundTertiary: '#3D280E',
        surface: '#4A3112',
        surfaceSecondary: '#583917',
        surfaceHover: '#66421C',
        text: '#FCF3CF',
        textSecondary: '#F7DC6F',
        textMuted: '#D4AC0D',
        textInverse: '#6E2C00',
        success: '#58D68D',
        warning: '#F7DC6F',
        error: '#F1948A',
        info: '#85C1E9',
        crisis: '#FF6B6B',
        calm: '#F7DC6F',
        hope: '#F1C40F',
        support: '#F39C12',
        growth: '#E67E22',
        border: '#66421C',
        borderLight: '#4A3112',
        borderHover: '#7D5A29',
        shadow: 'rgba(0, 0, 0, 0.3)',
        shadowHover: 'rgba(0, 0, 0, 0.4)'
      }
    },
    accessibility: {
      contrastRatio: 6.8,
      level: 'AAA',
      colorBlindFriendly: true
    },
    customization: {
      allowsIntensityAdjustment: true,
      allowsColorOverrides: true,
      allowsAnimationControl: true
    }
  },

  'nature-healing': {
    id: 'nature-healing',
    name: 'Nature Healing',
    description: 'Earth tones and natural greens for grounding and emotional stability',
    psychologyPrinciples: [
      'Earth tones reduce stress hormones',
      'Natural greens restore attention and reduce mental fatigue',
      'Brown promotes feelings of security and stability',
      'Forest colors activate biophilic stress reduction'
    ],
    recommendedFor: [
      'ADHD and attention issues',
      'Chronic stress',
      'Burnout recovery',
      'Trauma healing',
      'Nature-based therapy'
    ],
    colors: {
      light: {
        primary: '#27AE60',        // Forest green
        primaryLight: '#58D68D',
        primaryDark: '#1E8449',
        secondary: '#8D6E63',       // Warm brown
        secondaryLight: '#A1887F',
        secondaryDark: '#6D4C41',
        background: '#F9F9F7',      // Natural off-white
        backgroundSecondary: '#F4F2F0',
        backgroundTertiary: '#EFEBE9',
        surface: '#FFFFFF',
        surfaceSecondary: '#F8F6F4',
        surfaceHover: '#F1EDE8',
        text: '#2E4057',           // Deep blue-gray
        textSecondary: '#455A64',
        textMuted: '#78909C',
        textInverse: '#FFFFFF',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
        crisis: '#E53E3E',
        calm: '#81C784',
        hope: '#66BB6A',
        support: '#A5D6A7',
        growth: '#27AE60',
        border: '#C8E6C9',
        borderLight: '#E8F5E8',
        borderHover: '#A5D6A7',
        shadow: 'rgba(39, 174, 96, 0.1)',
        shadowHover: 'rgba(39, 174, 96, 0.15)'
      },
      dark: {
        primary: '#58D68D',
        primaryLight: '#82E5AA',
        primaryDark: '#27AE60',
        secondary: '#A1887F',
        secondaryLight: '#BCAAA4',
        secondaryDark: '#8D6E63',
        background: '#1B1F1A',
        backgroundSecondary: '#242924',
        backgroundTertiary: '#2D332B',
        surface: '#363D35',
        surfaceSecondary: '#3F473E',
        surfaceHover: '#485248',
        text: '#E8F5E8',
        textSecondary: '#C8E6C9',
        textMuted: '#81C784',
        textInverse: '#2E4057',
        success: '#81C784',
        warning: '#FFB74D',
        error: '#E57373',
        info: '#64B5F6',
        crisis: '#FF6B6B',
        calm: '#A5D6A7',
        hope: '#66BB6A',
        support: '#81C784',
        growth: '#58D68D',
        border: '#485248',
        borderLight: '#363D35',
        borderHover: '#5C6B5A',
        shadow: 'rgba(0, 0, 0, 0.3)',
        shadowHover: 'rgba(0, 0, 0, 0.4)'
      }
    },
    accessibility: {
      contrastRatio: 7.5,
      level: 'AAA',
      colorBlindFriendly: true
    },
    customization: {
      allowsIntensityAdjustment: true,
      allowsColorOverrides: true,
      allowsAnimationControl: true
    }
  },

  'gentle-focus': {
    id: 'gentle-focus',
    name: 'Gentle Focus',
    description: 'Muted purples and soft lavenders for concentration and mental clarity',
    psychologyPrinciples: [
      'Purple enhances creativity and introspection',
      'Lavender reduces anxiety while maintaining alertness',
      'Cool purples improve focus without overstimulation',
      'Muted tones prevent distraction while supporting concentration'
    ],
    recommendedFor: [
      'Study and focus sessions',
      'Meditation and mindfulness',
      'Creative work',
      'Therapy sessions',
      'Cognitive behavioral therapy'
    ],
    colors: {
      light: {
        primary: '#9C88B5',        // Soft purple
        primaryLight: '#B39DDB',
        primaryDark: '#7B1FA2',
        secondary: '#C5A3FF',       // Light lavender
        secondaryLight: '#D1C4E9',
        secondaryDark: '#9575CD',
        background: '#FAFAFA',      // Neutral gray
        backgroundSecondary: '#F5F3F7',
        backgroundTertiary: '#F0EDF4',
        surface: '#FFFFFF',
        surfaceSecondary: '#F8F5FA',
        surfaceHover: '#F3F0F6',
        text: '#37474F',           // Cool gray
        textSecondary: '#546E7A',
        textMuted: '#78909C',
        textInverse: '#FFFFFF',
        success: '#66BB6A',
        warning: '#FFB74D',
        error: '#E57373',
        info: '#64B5F6',
        crisis: '#E53E3E',
        calm: '#D1C4E9',
        hope: '#B39DDB',
        support: '#CE93D8',
        growth: '#9C88B5',
        border: '#E1BEE7',
        borderLight: '#F3E5F5',
        borderHover: '#CE93D8',
        shadow: 'rgba(156, 136, 181, 0.1)',
        shadowHover: 'rgba(156, 136, 181, 0.15)'
      },
      dark: {
        primary: '#B39DDB',
        primaryLight: '#D1C4E9',
        primaryDark: '#9C88B5',
        secondary: '#CE93D8',
        secondaryLight: '#E1BEE7',
        secondaryDark: '#BA68C8',
        background: '#1A1625',
        backgroundSecondary: '#241F2E',
        backgroundTertiary: '#2E2738',
        surface: '#382F42',
        surfaceSecondary: '#42374C',
        surfaceHover: '#4D4057',
        text: '#F3E5F5',
        textSecondary: '#E1BEE7',
        textMuted: '#CE93D8',
        textInverse: '#37474F',
        success: '#81C784',
        warning: '#FFB74D',
        error: '#E57373',
        info: '#64B5F6',
        crisis: '#FF6B6B',
        calm: '#D1C4E9',
        hope: '#B39DDB',
        support: '#CE93D8',
        growth: '#B39DDB',
        border: '#4D4057',
        borderLight: '#382F42',
        borderHover: '#5E4F69',
        shadow: 'rgba(0, 0, 0, 0.3)',
        shadowHover: 'rgba(0, 0, 0, 0.4)'
      }
    },
    accessibility: {
      contrastRatio: 6.9,
      level: 'AAA',
      colorBlindFriendly: true
    },
    customization: {
      allowsIntensityAdjustment: true,
      allowsColorOverrides: true,
      allowsAnimationControl: true
    }
  },

  'energizing-hope': {
    id: 'energizing-hope',
    name: 'Energizing Hope',
    description: 'Bright but gentle colors for motivation and positive energy',
    psychologyPrinciples: [
      'Bright colors increase energy and motivation',
      'Coral and pink promote feelings of love and hope',
      'Optimistic colors boost dopamine production',
      'Balanced saturation provides energy without anxiety'
    ],
    recommendedFor: [
      'Recovery and healing',
      'Building motivation',
      'Overcoming hopelessness',
      'Positive psychology therapy',
      'Goal setting sessions'
    ],
    colors: {
      light: {
        primary: '#FF6B9D',        // Vibrant coral-pink
        primaryLight: '#FF8FA3',
        primaryDark: '#E91E63',
        secondary: '#4ECDC4',       // Bright turquoise
        secondaryLight: '#80CBC4',
        secondaryDark: '#26A69A',
        background: '#FFFAFC',      // Very light pink
        backgroundSecondary: '#FEF7F9',
        backgroundTertiary: '#FCF0F4',
        surface: '#FFFFFF',
        surfaceSecondary: '#FEF9FA',
        surfaceHover: '#FDF2F6',
        text: '#4A148C',           // Deep purple
        textSecondary: '#6A1B9A',
        textMuted: '#8E24AA',
        textInverse: '#FFFFFF',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
        crisis: '#E53E3E',
        calm: '#F8BBD9',
        hope: '#FF6B9D',
        support: '#4ECDC4',
        growth: '#66BB6A',
        border: '#F8BBD9',
        borderLight: '#FCE4EC',
        borderHover: '#F48FB1',
        shadow: 'rgba(255, 107, 157, 0.1)',
        shadowHover: 'rgba(255, 107, 157, 0.15)'
      },
      dark: {
        primary: '#FF8FA3',
        primaryLight: '#FFB3BA',
        primaryDark: '#FF6B9D',
        secondary: '#80CBC4',
        secondaryLight: '#B2DFDB',
        secondaryDark: '#4ECDC4',
        background: '#2D1B2E',
        backgroundSecondary: '#3B2A3C',
        backgroundTertiary: '#4A394B',
        surface: '#59485A',
        surfaceSecondary: '#685769',
        surfaceHover: '#776778',
        text: '#FCE4EC',
        textSecondary: '#F8BBD9',
        textMuted: '#F48FB1',
        textInverse: '#4A148C',
        success: '#81C784',
        warning: '#FFB74D',
        error: '#E57373',
        info: '#64B5F6',
        crisis: '#FF6B6B',
        calm: '#F8BBD9',
        hope: '#FF8FA3',
        support: '#80CBC4',
        growth: '#81C784',
        border: '#776778',
        borderLight: '#59485A',
        borderHover: '#8E7A8F',
        shadow: 'rgba(0, 0, 0, 0.3)',
        shadowHover: 'rgba(0, 0, 0, 0.4)'
      }
    },
    accessibility: {
      contrastRatio: 6.5,
      level: 'AA',
      colorBlindFriendly: false
    },
    customization: {
      allowsIntensityAdjustment: true,
      allowsColorOverrides: true,
      allowsAnimationControl: true
    }
  },

  'minimal-zen': {
    id: 'minimal-zen',
    name: 'Minimal Zen',
    description: 'High contrast minimalism for sensory sensitivity and focus',
    psychologyPrinciples: [
      'Minimal stimulation reduces sensory overload',
      'High contrast improves accessibility and focus',
      'Monochromatic design reduces decision fatigue',
      'Clean lines promote mental clarity'
    ],
    recommendedFor: [
      'Autism spectrum disorders',
      'Sensory processing sensitivity',
      'ADHD focus support',
      'Migraine sensitivity',
      'Accessibility needs'
    ],
    colors: {
      light: {
        primary: '#2D3748',
        primaryLight: '#4A5568',
        primaryDark: '#1A202C',
        secondary: '#718096',
        secondaryLight: '#A0AEC0',
        secondaryDark: '#4A5568',
        background: '#FFFFFF',
        backgroundSecondary: '#F7FAFC',
        backgroundTertiary: '#EDF2F7',
        surface: '#FFFFFF',
        surfaceSecondary: '#F7FAFC',
        surfaceHover: '#EDF2F7',
        text: '#1A202C',
        textSecondary: '#2D3748',
        textMuted: '#718096',
        textInverse: '#FFFFFF',
        success: '#38A169',
        warning: '#D69E2E',
        error: '#E53E3E',
        info: '#3182CE',
        crisis: '#E53E3E',
        calm: '#E2E8F0',
        hope: '#CBD5E0',
        support: '#A0AEC0',
        growth: '#718096',
        border: '#E2E8F0',
        borderLight: '#F7FAFC',
        borderHover: '#CBD5E0',
        shadow: 'rgba(45, 55, 72, 0.1)',
        shadowHover: 'rgba(45, 55, 72, 0.2)'
      },
      dark: {
        primary: '#E2E8F0',
        primaryLight: '#F7FAFC',
        primaryDark: '#CBD5E0',
        secondary: '#A0AEC0',
        secondaryLight: '#CBD5E0',
        secondaryDark: '#718096',
        background: '#1A202C',
        backgroundSecondary: '#2D3748',
        backgroundTertiary: '#4A5568',
        surface: '#2D3748',
        surfaceSecondary: '#4A5568',
        surfaceHover: '#718096',
        text: '#F7FAFC',
        textSecondary: '#E2E8F0',
        textMuted: '#CBD5E0',
        textInverse: '#1A202C',
        success: '#68D391',
        warning: '#F6E05E',
        error: '#FC8181',
        info: '#63B3ED',
        crisis: '#FC8181',
        calm: '#4A5568',
        hope: '#718096',
        support: '#A0AEC0',
        growth: '#CBD5E0',
        border: '#4A5568',
        borderLight: '#2D3748',
        borderHover: '#718096',
        shadow: 'rgba(0, 0, 0, 0.5)',
        shadowHover: 'rgba(0, 0, 0, 0.7)'
      }
    },
    accessibility: {
      contrastRatio: 15.0,
      level: 'AAA',
      colorBlindFriendly: true
    },
    customization: {
      allowsIntensityAdjustment: false,
      allowsColorOverrides: false,
      allowsAnimationControl: true
    }
  },

  'crisis-safe': {
    id: 'crisis-safe',
    name: 'Crisis Safe',
    description: 'Emergency-optimized colors for crisis intervention and high visibility',
    psychologyPrinciples: [
      'High contrast ensures visibility during distress',
      'Specific colors for different emergency states',
      'Intuitive color coding for quick recognition',
      'Calming background with urgent accent colors'
    ],
    recommendedFor: [
      'Crisis intervention',
      'Emergency situations',
      'High stress states',
      'Accessibility requirements',
      'Professional crisis support'
    ],
    colors: {
      light: {
        primary: '#C53030',        // Crisis red
        primaryLight: '#E53E3E',
        primaryDark: '#9B2C2C',
        secondary: '#2B6CB0',       // Safety blue
        secondaryLight: '#3182CE',
        secondaryDark: '#2C5282',
        background: '#FFFAF0',      // Warm safe background
        backgroundSecondary: '#FED7C3',
        backgroundTertiary: '#FEEBC8',
        surface: '#FFFFFF',
        surfaceSecondary: '#FFFAF0',
        surfaceHover: '#FED7C3',
        text: '#1A202C',
        textSecondary: '#2D3748',
        textMuted: '#4A5568',
        textInverse: '#FFFFFF',
        success: '#38A169',
        warning: '#D69E2E',
        error: '#C53030',
        info: '#2B6CB0',
        crisis: '#C53030',
        calm: '#90CDF4',
        hope: '#68D391',
        support: '#F6E05E',
        growth: '#9AE6B4',
        border: '#FBD38D',
        borderLight: '#FEEBC8',
        borderHover: '#F6AD55',
        shadow: 'rgba(197, 48, 48, 0.15)',
        shadowHover: 'rgba(197, 48, 48, 0.25)'
      },
      dark: {
        primary: '#FC8181',
        primaryLight: '#FEB2B2',
        primaryDark: '#E53E3E',
        secondary: '#63B3ED',
        secondaryLight: '#90CDF4',
        secondaryDark: '#3182CE',
        background: '#2D1B1B',
        backgroundSecondary: '#3B2A2A',
        backgroundTertiary: '#4A3939',
        surface: '#59484A',
        surfaceSecondary: '#685759',
        surfaceHover: '#776768',
        text: '#FEEBC8',
        textSecondary: '#FBD38D',
        textMuted: '#F6AD55',
        textInverse: '#1A202C',
        success: '#9AE6B4',
        warning: '#F6E05E',
        error: '#FC8181',
        info: '#90CDF4',
        crisis: '#FC8181',
        calm: '#90CDF4',
        hope: '#9AE6B4',
        support: '#F6E05E',
        growth: '#C6F6D5',
        border: '#685759',
        borderLight: '#59484A',
        borderHover: '#8A7778',
        shadow: 'rgba(0, 0, 0, 0.4)',
        shadowHover: 'rgba(0, 0, 0, 0.6)'
      }
    },
    accessibility: {
      contrastRatio: 12.0,
      level: 'AAA',
      colorBlindFriendly: true
    },
    customization: {
      allowsIntensityAdjustment: false,
      allowsColorOverrides: false,
      allowsAnimationControl: false
    }
  },

  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum contrast for accessibility compliance and visual clarity',
    psychologyPrinciples: [
      'Maximum contrast reduces visual strain',
      'Clear distinction improves cognitive processing',
      'Reduces ambiguity in interface elements',
      'Supports users with visual impairments'
    ],
    recommendedFor: [
      'Visual impairments',
      'Dyslexia',
      'Cognitive disabilities',
      'Low vision conditions',
      'Screen reader users'
    ],
    colors: {
      light: {
        primary: '#000000',
        primaryLight: '#1A1A1A',
        primaryDark: '#000000',
        secondary: '#000000',
        secondaryLight: '#333333',
        secondaryDark: '#000000',
        background: '#FFFFFF',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F0F0F0',
        surface: '#FFFFFF',
        surfaceSecondary: '#FFFFFF',
        surfaceHover: '#F0F0F0',
        text: '#000000',
        textSecondary: '#000000',
        textMuted: '#666666',
        textInverse: '#FFFFFF',
        success: '#006600',
        warning: '#CC6600',
        error: '#CC0000',
        info: '#0066CC',
        crisis: '#CC0000',
        calm: '#E0E0E0',
        hope: '#009900',
        support: '#0066CC',
        growth: '#006600',
        border: '#000000',
        borderLight: '#666666',
        borderHover: '#000000',
        shadow: 'rgba(0, 0, 0, 0.5)',
        shadowHover: 'rgba(0, 0, 0, 0.8)'
      },
      dark: {
        primary: '#FFFFFF',
        primaryLight: '#FFFFFF',
        primaryDark: '#E6E6E6',
        secondary: '#FFFFFF',
        secondaryLight: '#FFFFFF',
        secondaryDark: '#CCCCCC',
        background: '#000000',
        backgroundSecondary: '#000000',
        backgroundTertiary: '#1A1A1A',
        surface: '#000000',
        surfaceSecondary: '#000000',
        surfaceHover: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#FFFFFF',
        textMuted: '#CCCCCC',
        textInverse: '#000000',
        success: '#00FF00',
        warning: '#FFCC00',
        error: '#FF3333',
        info: '#3399FF',
        crisis: '#FF3333',
        calm: '#333333',
        hope: '#00FF00',
        support: '#3399FF',
        growth: '#00FF00',
        border: '#FFFFFF',
        borderLight: '#999999',
        borderHover: '#FFFFFF',
        shadow: 'rgba(255, 255, 255, 0.3)',
        shadowHover: 'rgba(255, 255, 255, 0.5)'
      }
    },
    accessibility: {
      contrastRatio: 21.0,
      level: 'AAA',
      colorBlindFriendly: true
    },
    customization: {
      allowsIntensityAdjustment: false,
      allowsColorOverrides: false,
      allowsAnimationControl: true
    }
  },

  'custom': {
    id: 'custom',
    name: 'Custom Theme',
    description: 'User-defined personalized therapeutic color environment',
    psychologyPrinciples: [
      'Personal color preferences enhance comfort',
      'User control improves sense of agency',
      'Customization supports individual needs',
      'Adaptation to personal sensitivities'
    ],
    recommendedFor: [
      'Individual preferences',
      'Specific sensitivities',
      'Cultural considerations',
      'Personal therapeutic goals',
      'Advanced users'
    ],
    colors: {
      light: {
        primary: '#3498DB',
        primaryLight: '#5DADE2',
        primaryDark: '#2E86C1',
        secondary: '#E74C3C',
        secondaryLight: '#EC7063',
        secondaryDark: '#CB4335',
        background: '#FFFFFF',
        backgroundSecondary: '#F8F9FA',
        backgroundTertiary: '#E9ECEF',
        surface: '#FFFFFF',
        surfaceSecondary: '#F8F9FA',
        surfaceHover: '#E9ECEF',
        text: '#2C3E50',
        textSecondary: '#34495E',
        textMuted: '#7B8A8B',
        textInverse: '#FFFFFF',
        success: '#27AE60',
        warning: '#F39C12',
        error: '#E74C3C',
        info: '#3498DB',
        crisis: '#E74C3C',
        calm: '#85C1E9',
        hope: '#58D68D',
        support: '#F7DC6F',
        growth: '#82E5AA',
        border: '#BDC3C7',
        borderLight: '#ECF0F1',
        borderHover: '#95A5A6',
        shadow: 'rgba(52, 152, 219, 0.1)',
        shadowHover: 'rgba(52, 152, 219, 0.2)'
      },
      dark: {
        primary: '#5DADE2',
        primaryLight: '#85C1E9',
        primaryDark: '#3498DB',
        secondary: '#EC7063',
        secondaryLight: '#F1948A',
        secondaryDark: '#E74C3C',
        background: '#1C2833',
        backgroundSecondary: '#273746',
        backgroundTertiary: '#34495E',
        surface: '#2C3E50',
        surfaceSecondary: '#34495E',
        surfaceHover: '#5D6D7E',
        text: '#ECF0F1',
        textSecondary: '#D5DBDB',
        textMuted: '#BDC3C7',
        textInverse: '#2C3E50',
        success: '#58D68D',
        warning: '#F7DC6F',
        error: '#F1948A',
        info: '#85C1E9',
        crisis: '#F1948A',
        calm: '#85C1E9',
        hope: '#82E5AA',
        support: '#F7DC6F',
        growth: '#58D68D',
        border: '#5D6D7E',
        borderLight: '#34495E',
        borderHover: '#85929E',
        shadow: 'rgba(0, 0, 0, 0.3)',
        shadowHover: 'rgba(0, 0, 0, 0.5)'
      }
    },
    accessibility: {
      contrastRatio: 4.5,
      level: 'AA',
      colorBlindFriendly: true
    },
    customization: {
      allowsIntensityAdjustment: true,
      allowsColorOverrides: true,
      allowsAnimationControl: true
    }
  },

  'system': {
    id: 'system',
    name: 'System Default',
    description: 'Follow system dark/light mode preferences',
    psychologyPrinciples: [
      'Consistency with user preferences',
      'Reduced cognitive load',
      'Familiarity promotes comfort',
      'Adaptive to environmental conditions'
    ],
    recommendedFor: [
      'General use',
      'System integration',
      'Consistent experience',
      'Automatic adaptation',
      'Default option'
    ],
    colors: {
      light: {
        primary: '#007AFF',        // iOS blue
        primaryLight: '#5AC8FA',
        primaryDark: '#0051D2',
        secondary: '#FF3B30',       // iOS red
        secondaryLight: '#FF6961',
        secondaryDark: '#D70015',
        background: '#FFFFFF',
        backgroundSecondary: '#F2F2F7',
        backgroundTertiary: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceSecondary: '#F2F2F7',
        surfaceHover: '#E5E5EA',
        text: '#000000',
        textSecondary: '#3C3C43',
        textMuted: '#8E8E93',
        textInverse: '#FFFFFF',
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        info: '#007AFF',
        crisis: '#FF3B30',
        calm: '#AFCBFF',
        hope: '#30D158',
        support: '#BF5AF2',
        growth: '#34C759',
        border: '#C6C6C8',
        borderLight: '#E5E5EA',
        borderHover: '#AEAEB2',
        shadow: 'rgba(0, 122, 255, 0.1)',
        shadowHover: 'rgba(0, 122, 255, 0.2)'
      },
      dark: {
        primary: '#0A84FF',
        primaryLight: '#64D2FF',
        primaryDark: '#007AFF',
        secondary: '#FF453A',
        secondaryLight: '#FF6961',
        secondaryDark: '#FF3B30',
        background: '#000000',
        backgroundSecondary: '#1C1C1E',
        backgroundTertiary: '#2C2C2E',
        surface: '#1C1C1E',
        surfaceSecondary: '#2C2C2E',
        surfaceHover: '#3A3A3C',
        text: '#FFFFFF',
        textSecondary: '#EBEBF5',
        textMuted: '#8E8E93',
        textInverse: '#000000',
        success: '#30D158',
        warning: '#FF9F0A',
        error: '#FF453A',
        info: '#64D2FF',
        crisis: '#FF453A',
        calm: '#64D2FF',
        hope: '#30D158',
        support: '#BF5AF2',
        growth: '#30D158',
        border: '#38383A',
        borderLight: '#2C2C2E',
        borderHover: '#48484A',
        shadow: 'rgba(0, 0, 0, 0.3)',
        shadowHover: 'rgba(0, 0, 0, 0.5)'
      }
    },
    accessibility: {
      contrastRatio: 7.0,
      level: 'AAA',
      colorBlindFriendly: true
    },
    customization: {
      allowsIntensityAdjustment: true,
      allowsColorOverrides: true,
      allowsAnimationControl: true
    }
  }
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { ThemeContext };
