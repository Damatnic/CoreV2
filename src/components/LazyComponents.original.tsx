// Check for errors first
// NOTE: Many components use named exports, so we need to wrap them properly

import { createEnhancedLazyComponent } from './EnhancedLazyComponent';
import { LoadingSpinner } from './LoadingSpinner';

// High Priority Components - Large files that should be lazy loaded
export const ComprehensivePerformanceMonitor = createEnhancedLazyComponent(
  () => import('./ComprehensivePerformanceMonitor'),
  {
    strategy: 'interaction',
    componentName: 'ComprehensivePerformanceMonitor',
    priority: 'high',
    fallback: () => (
      <div className="dashboard-skeleton" style={{ minHeight: '400px', padding: '20px', textAlign: 'center' }}>
        <LoadingSpinner />
        <p>Loading Performance Monitor...</p>
      </div>
    )
  }
);

export const MobileAccessibilityDashboard = createEnhancedLazyComponent(
  () => import('./MobileAccessibilityDashboard'),
  {
    strategy: 'viewport',
    componentName: 'MobileAccessibilityDashboard',
    priority: 'high',
    rootMargin: '50px'
  }
);

export const ThemeCustomizationDashboard = createEnhancedLazyComponent(
  () => import('./ThemeCustomizationDashboard'),
  {
    strategy: 'viewport',
    componentName: 'ThemeCustomizationDashboard',
    priority: 'medium'
  }
);

export const CrisisStressTestingDashboard = createEnhancedLazyComponent(
  () => import('./CrisisStressTestingDashboard'),
  {
    strategy: 'interaction',
    componentName: 'CrisisStressTestingDashboard',
    priority: 'medium'
  }
);

export const AccessibilityDashboard = createEnhancedLazyComponent(
  () => import('./AccessibilityDashboard'),
  {
    strategy: 'interaction',
    componentName: 'AccessibilityDashboard',
    priority: 'medium'
  }
);

export const CulturalCrisisDetectionTestRunner = createEnhancedLazyComponent(
  () => import('./CulturalCrisisDetectionTestRunner'),
  {
    strategy: 'interaction',
    componentName: 'CulturalCrisisDetectionTestRunner',
    priority: 'low'
  }
);

// Medium Priority - Important but not immediately critical
export const CrisisDetectionDashboard = createEnhancedLazyComponent(
  () => import('./CrisisDetectionDashboard'),
  {
    strategy: 'interaction',
    componentName: 'CrisisDetectionDashboard',
    priority: 'medium'
  }
);

export const PerformanceMonitor = createEnhancedLazyComponent(
  () => import('./PerformanceMonitor'),
  {
    strategy: 'network-aware',
    componentName: 'PerformanceMonitor',
    priority: 'medium'
  }
);

export const ResourceHintsOptimizer = createEnhancedLazyComponent(
  () => import('./ResourceHintsOptimizer'),
  {
    strategy: 'network-aware',
    componentName: 'ResourceHintsOptimizer',
    priority: 'high'
  }
);

// Crisis Components - Special handling with immediate loading for safety
export const CrisisResourcesModal = createEnhancedLazyComponent(
  () => import('./CrisisResourcesModal'),
  {
    strategy: 'immediate',
    componentName: 'CrisisResourcesModal',
    priority: 'high',
    fallback: () => (
      <div className="crisis-loading" style={{ 
        padding: '20px', 
        textAlign: 'center',
        border: '2px solid #ff6b6b',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <LoadingSpinner />
        <p><strong>Loading crisis resources...</strong></p>
        <p>If this is an emergency, please call 911</p>
      </div>
    )
  }
);

export const CrisisAlert = createEnhancedLazyComponent(
  () => import('./CrisisAlert'),
  {
    strategy: 'immediate',
    componentName: 'CrisisAlert',
    priority: 'high'
  }
);

// Utility Components
export const CopyToClipboard = createEnhancedLazyComponent(
  () => import('./CopyToClipboard'),
  {
    strategy: 'viewport',
    componentName: 'CopyToClipboard',
    priority: 'low'
  }
);

export const Custom404Page = createEnhancedLazyComponent(
  () => import('./Custom404Page'),
  {
    strategy: 'immediate',
    componentName: 'Custom404Page',
    priority: 'low'
  }
);

export const LanguageSelector = createEnhancedLazyComponent(
  () => import('./LanguageSelector'),
  {
    strategy: 'interaction',
    componentName: 'LanguageSelector',
    priority: 'low'
  }
);

export const MobileSidebarNav = createEnhancedLazyComponent(
  () => import('./MobileSidebarNav').then(module => ({ default: module.MobileSidebarNav })),
  {
    strategy: 'immediate',
    componentName: 'MobileSidebarNav',
    priority: 'medium'
  }
);

export const PWAInstallBanner = createEnhancedLazyComponent(
  () => import('./PWAInstallBanner'),
  {
    strategy: 'viewport',
    componentName: 'PWAInstallBanner',
    priority: 'low'
  }
);

export const ServiceWorkerUpdate = createEnhancedLazyComponent(
  () => import('./ServiceWorkerUpdate'),
  {
    strategy: 'immediate',
    componentName: 'ServiceWorkerUpdate',
    priority: 'medium'
  }
);

// Accessibility Components
export const ScreenReaderAnnouncement = createEnhancedLazyComponent(
  () => import('./ScreenReaderAnnouncement'),
  {
    strategy: 'immediate',
    componentName: 'ScreenReaderAnnouncement',
    priority: 'medium'
  }
);

export const AccessibilitySettings = createEnhancedLazyComponent(
  () => import('./AccessibilitySettings'),
  {
    strategy: 'interaction',
    componentName: 'AccessibilitySettings',
    priority: 'high'
  }
);

// Network and Status Components
export const NetworkBanner = createEnhancedLazyComponent(
  () => import('./NetworkBanner'),
  {
    strategy: 'immediate',
    componentName: 'NetworkBanner',
    priority: 'medium'
  }
);

export const OfflineIndicator = createEnhancedLazyComponent(
  () => import('./OfflineIndicator'),
  {
    strategy: 'immediate',
    componentName: 'OfflineIndicator',
    priority: 'medium'
  }
);

export const OfflineCapabilities = createEnhancedLazyComponent(
  () => import('./OfflineCapabilities'),
  {
    strategy: 'interaction',
    componentName: 'OfflineCapabilities',
    priority: 'medium'
  }
);

// Preload critical components for faster access
export const preloadCriticalComponents = () => {
  // Preload crisis-related components immediately
  const criticalImports = [
    () => import('./CrisisResourcesModal'),
    () => import('./CrisisAlert'),
    () => import('./NetworkBanner'),
    () => import('./OfflineIndicator'),
    () => import('./ScreenReaderAnnouncement')
  ];

  criticalImports.forEach(importFn => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFn().catch(() => {}));
    } else {
      setTimeout(() => importFn().catch(() => {}), 100);
    }
  });
};

// Initialize preloading when the module loads
if (typeof window !== 'undefined') {
  preloadCriticalComponents();
}

// Bundle impact calculator
export const calculateLazyLoadingSavings = () => {
  const lazyComponents = [
    'ComprehensivePerformanceMonitor',
    'MobileAccessibilityDashboard', 
    'ThemeCustomizationDashboard',
    'CrisisStressTestingDashboard',
    'AccessibilityDashboard',
    'CrisisDetectionDashboard',
    'PerformanceMonitor',
    'ResourceHintsOptimizer',
    'OfflineCapabilities'
  ];

  const estimatedSavings = lazyComponents.length * 15; // Average 15KB per component
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Lazy Loading Active: ${lazyComponents.length} components`);
    console.log(`💾 Estimated initial bundle savings: ~${estimatedSavings}KB`);
  }

  return {
    componentCount: lazyComponents.length,
    estimatedSavings
  };
};

export default {
  preloadCriticalComponents,
  calculateLazyLoadingSavings
};
