/**
 * Main Entry Point for Astral Core Application
 * This file bootstraps the React application
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Import global styles
import './styles/design-system.css';
import './styles/accessibility.css';
import './styles/mobile-responsive-fixes.css';
import './styles/dark-theme-enhancements.css';
import './styles/safe-ui-system.css';

// Import i18n configuration
import './i18n';

// Import Auth0 provider
import { auth0Service } from './services/auth0Service';

// Import environment validator
import { loadAndValidateEnv } from './utils/envValidator';

// Import error tracking
import { initializeErrorTracking } from './services/errorTrackingService';

// Import service worker manager
import { registerServiceWorker } from './services/serviceWorkerManager';

// Import OpenTelemetry
import { openTelemetryService } from './services/openTelemetryService';

// Import performance monitoring
import { performanceMonitoringService } from './services/performanceMonitoringService';

// Validate environment variables on startup
try {
  loadAndValidateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  if (process.env.NODE_ENV === 'production') {
    // In production, show a friendly error page
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem;">
          <h1>Configuration Error</h1>
          <p>We're experiencing technical difficulties. Please try again later.</p>
          <p style="color: #666; font-size: 0.9rem;">If this problem persists, please contact support.</p>
        </div>
      </div>
    `;
    throw error;
  }
}

// Initialize error tracking
if (process.env.NODE_ENV === 'production') {
  initializeErrorTracking();
}

// Initialize OpenTelemetry
if (import.meta.env.VITE_OTEL_ENABLED === 'true') {
  openTelemetryService.initialize().catch(error => {
    console.error('Failed to initialize OpenTelemetry:', error);
  });
}

// Initialize performance monitoring
performanceMonitoringService.initialize();

// Initialize Auth0
auth0Service.initialize().catch(error => {
  console.error('Failed to initialize Auth0:', error);
});

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element. Make sure index.html contains a div with id="root"');
}

// Create React root and render app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker for PWA support
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Report Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}

// Accessibility: Announce app ready to screen readers
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'Astral Core Mental Health Support Platform has loaded and is ready to use.';
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  });
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // In production, report to error tracking
  if (process.env.NODE_ENV === 'production') {
    // Report to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(event.reason);
    }
  }
  
  // Prevent default browser behavior
  event.preventDefault();
});

// Export for testing
export { root };