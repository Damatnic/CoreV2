/**
 * Analytics Service for Astral Core
 * Privacy-compliant analytics for mental health platform
 * Follows GDPR, HIPAA-adjacent principles, and user privacy first approach
 */

import React from 'react';
import errorHandlingService from './errorHandlingService';
import apiService from './apiService';
import { auth0Service } from './auth0Service';

export interface AnalyticsEvent {
  id: string; // Unique event identifier
  name: string;
  category: 'user_action' | 'page_view' | 'feature_usage' | 'performance' | 'error' | 'crisis_intervention' | 'wellness_tracking';
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string; // Only if consent given
  isAnonymized: boolean;
  sensitivityLevel: 'public' | 'private' | 'sensitive' | 'crisis';
}

export interface UserJourney {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: AnalyticsEvent[];
  pageViews: string[];
  features: string[];
  errors: string[];
  crisisInterventions: string[];
  wellnessActivities: string[];
  consentStatus: ConsentStatus;
}

export interface ConsentStatus {
  analytics: boolean;
  performance: boolean;
  functionality: boolean;
  marketing: boolean;
  timestamp: number;
  version: string; // Privacy policy version
  ipHash?: string; // Hashed IP for legal compliance
}

export interface PrivacySettings {
  dataRetentionDays: number;
  allowCrossSession: boolean;
  anonymizeAfterDays: number;
  purgeAfterDays: number;
  collectLocationData: boolean;
  collectDeviceData: boolean;
  shareCrisisData: boolean; // Special handling for crisis intervention
}

export interface AnalyticsConfig {
  enabled: boolean;
  collectPersonalData: boolean;
  batchSize: number;
  flushInterval: number;
  endpoint?: string;
  privacySettings: PrivacySettings;
  requireConsent: boolean;
  gdprCompliant: boolean;
  hipaaAdjacent: boolean; // Mental health specific protections
  crisisPriority: boolean; // Prioritize crisis intervention analytics
}

export interface DataExportRequest {
  userId: string;
  requestDate: number;
  includeAnalytics: boolean;
  includeJourneys: boolean;
  format: 'json' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DataDeletionRequest {
  userId: string;
  requestDate: number;
  deleteAnalytics: boolean;
  deleteJourneys: boolean;
  retainCrisisData: boolean; // Special handling for safety
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

class AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private readonly sessionId: string;
  private userId?: string;
  private readonly journey: UserJourney;
  private flushTimer?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;
  private consentStatus: ConsentStatus | null = null;
  private dataRetentionTimer?: NodeJS.Timeout;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    // Default privacy-first configuration
    const defaultPrivacySettings: PrivacySettings = {
      dataRetentionDays: 30,
      allowCrossSession: false,
      anonymizeAfterDays: 7,
      purgeAfterDays: 90,
      collectLocationData: false,
      collectDeviceData: true,
      shareCrisisData: true // Important for safety but anonymized
    };

    const defaultConsentStatus: ConsentStatus = {
      analytics: false,
      performance: true, // Essential for platform functionality
      functionality: true, // Essential for platform functionality
      marketing: false,
      timestamp: Date.now(),
      version: '1.0.0'
    };

    this.config = {
      enabled: true,
      collectPersonalData: false,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      privacySettings: {
        ...defaultPrivacySettings,
        ...(config.privacySettings || {})
      },
      requireConsent: true,
      gdprCompliant: true,
      hipaaAdjacent: true,
      crisisPriority: true,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.consentStatus = this.loadConsentStatus() || defaultConsentStatus;
    this.journey = this.initializeJourney();
    
    if (this.config.enabled && this.hasRequiredConsent()) {
      this.initialize();
    }

    this.startDataRetentionTimer();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private initializeJourney(): UserJourney {
    const defaultConsentStatus: ConsentStatus = {
      analytics: false,
      performance: true,
      functionality: true,
      marketing: false,
      timestamp: Date.now(),
      version: '1.0.0'
    };

    return {
      sessionId: this.sessionId,
      startTime: Date.now(),
      events: [],
      pageViews: [],
      features: [],
      errors: [],
      crisisInterventions: [],
      wellnessActivities: [],
      consentStatus: this.consentStatus || defaultConsentStatus
    };
  }

  private loadConsentStatus(): ConsentStatus | null {
    try {
      const stored = localStorage.getItem('analytics_consent_status');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private saveConsentStatus() {
    if (this.consentStatus) {
      localStorage.setItem('analytics_consent_status', JSON.stringify(this.consentStatus));
    }
  }

  private hasRequiredConsent(): boolean {
    if (!this.config.requireConsent) return true;
    return this.consentStatus?.analytics === true || this.consentStatus?.performance === true;
  }

  private startDataRetentionTimer() {
    // Check daily for data that needs to be purged
    this.dataRetentionTimer = setInterval(() => {
      this.enforceDataRetention();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private enforceDataRetention() {
    const now = Date.now();
    const { anonymizeAfterDays, purgeAfterDays } = this.config.privacySettings;

    try {
      // Get stored events
      const stored = localStorage.getItem('analytics_events');
      if (!stored) return;

      const events: AnalyticsEvent[] = JSON.parse(stored);
      const anonymizeMs = anonymizeAfterDays * 24 * 60 * 60 * 1000;
      const purgeMs = purgeAfterDays * 24 * 60 * 60 * 1000;

      const processedEvents = events
        .filter(event => {
          // Remove events older than purge limit
          if (now - event.timestamp > purgeMs) {
            return false;
          }
          return true;
        })
        .map(event => {
          // Anonymize events older than anonymize limit
          if (now - event.timestamp > anonymizeMs && !event.isAnonymized) {
            return this.anonymizeEvent(event);
          }
          return event;
        });

      localStorage.setItem('analytics_events', JSON.stringify(processedEvents));
    } catch (error) {
      console.error('Astral Core Analytics: Failed to enforce data retention:', error);
    }
  }

  private anonymizeEvent(event: AnalyticsEvent): AnalyticsEvent {
    return {
      ...event,
      userId: undefined,
      properties: this.anonymizeProperties(event.properties),
      isAnonymized: true
    };
  }

  private anonymizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties) return undefined;

    const anonymized: Record<string, any> = {};
    
    Object.entries(properties).forEach(([key, value]) => {
      // Keep only non-personal data
      if (this.isPersonalDataKey(key)) {
        anonymized[key] = '[ANONYMIZED]';
      } else {
        anonymized[key] = value;
      }
    });

    return anonymized;
  }

  private isPersonalDataKey(key: string): boolean {
    const personalKeys = [
      'email', 'phone', 'address', 'name', 'username', 'userId', 'ip',
      'location', 'coordinates', 'personalInfo', 'identity'
    ];
    return personalKeys.some(personal => 
      key.toLowerCase().includes(personal)
    );
  }

  private initialize() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('page_visibility_change', 'page_view', {
        visible: !document.hidden
      });
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Start flush timer
    this.startFlushTimer();

    // Track initial page load
    this.trackPageView(window.location.pathname);
  }

  private setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.track('page_load_performance', 'performance', {
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              firstPaint: this.getFirstPaint(),
              firstContentfulPaint: this.getFirstContentfulPaint()
            });
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            this.track('largest_contentful_paint', 'performance', {
              value: entry.startTime
            });
          }
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] 
      });
    }
  }

  private getFirstPaint(): number | undefined {
    const entries = performance.getEntriesByType('paint');
    const fpEntry = entries.find(entry => entry.name === 'first-paint');
    return fpEntry?.startTime;
  }

  private getFirstContentfulPaint(): number | undefined {
    const entries = performance.getEntriesByType('paint');
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry?.startTime;
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private determineSensitivityLevel(
    name: string, 
    category: AnalyticsEvent['category'], 
    properties?: Record<string, any>
  ): AnalyticsEvent['sensitivityLevel'] {
    // Crisis intervention gets highest sensitivity
    if (category === 'crisis_intervention' || name.includes('crisis')) {
      return 'crisis';
    }

    // Wellness tracking is sensitive
    if (category === 'wellness_tracking') {
      return 'sensitive';
    }

    // Check for sensitive properties
    if (properties && Object.keys(properties).some(key => this.isPersonalDataKey(key))) {
      return 'private';
    }

    // Performance and basic interactions are public
    if (category === 'performance' || category === 'page_view') {
      return 'public';
    }

    return 'private';
  }

  private createEvent(
    name: string, 
    category: AnalyticsEvent['category'], 
    properties?: Record<string, any>
  ): AnalyticsEvent {
    const sensitivityLevel = this.determineSensitivityLevel(name, category, properties);
    
    return {
      id: this.generateEventId(),
      name,
      category,
      properties: this.sanitizeProperties(properties),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.config.collectPersonalData && this.consentStatus?.analytics ? this.userId : undefined,
      isAnonymized: false,
      sensitivityLevel
    };
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties) return undefined;

    const sanitized: Record<string, any> = {};
    
    Object.entries(properties).forEach(([key, value]) => {
      // Remove potentially sensitive data
      if (this.isSensitiveKey(key)) {
        return;
      }

      // Sanitize values
      if (typeof value === 'string') {
        // Remove potential PII patterns
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      }
    });

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'email', 'phone', 'address', 'ssn', 'token', 
      'apikey', 'secret', 'private', 'personal', 'medical', 'health'
    ];
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    );
  }

  private sanitizeString(value: string): string {
    // Remove email patterns
    value = value.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    
    // Remove phone patterns
    value = value.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
    
    // Remove potential tokens (long alphanumeric strings)
    value = value.replace(/\b[A-Za-z0-9]{20,}\b/g, '[TOKEN]');

    return value;
  }

  private async sendEvents(events: AnalyticsEvent[]) {
    if (!this.config.endpoint) {
      // Store locally for development
      const stored = localStorage.getItem('analytics_events') || '[]';
      const allEvents = [...JSON.parse(stored), ...events];
      
      // Enforce storage limits
      const maxEvents = this.config.privacySettings.dataRetentionDays * 100; // Rough estimate
      localStorage.setItem('analytics_events', JSON.stringify(allEvents.slice(-maxEvents)));
      return;
    }

    try {
      const payload = {
        events: events.map(event => ({
          ...event,
          // Additional privacy headers
          gdprCompliant: this.config.gdprCompliant,
          hipaaAdjacent: this.config.hipaaAdjacent,
          consentStatus: this.consentStatus
        })),
        sessionId: this.sessionId,
        timestamp: Date.now(),
        privacySettings: this.config.privacySettings
      };

      // Use Astral Core API client for proper error handling
      await apiService.post('/analytics/events', payload, {
        headers: {
          'Privacy-Compliant': 'true',
          'GDPR-Compliant': this.config.gdprCompliant.toString(),
          'Mental-Health-Platform': 'true'
        }
      });
      
      /* Original fetch code for reference:
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Privacy-Compliant': 'true',
          'GDPR-Compliant': this.config.gdprCompliant.toString(),
          'Mental-Health-Platform': 'true'
        },
        body: JSON.stringify(payload)
      }); */
    } catch (error) {
      console.error('Astral Core Analytics: Failed to send events:', error);
      
      // Store failed events for retry (with limits)
      const failed = localStorage.getItem('astralcore_analytics_failed') || '[]';
      const failedEvents = [...JSON.parse(failed), ...events];
      localStorage.setItem('astralcore_analytics_failed', JSON.stringify(failedEvents.slice(-100)));
    }
  }

  // Public API
  track(name: string, category: AnalyticsEvent['category'], properties?: Record<string, any>) {
    if (!this.config.enabled || !this.hasRequiredConsent()) return;

    const event = this.createEvent(name, category, properties);
    this.eventQueue.push(event);
    this.journey.events.push(event);

    // Track specific journey data
    if (category === 'page_view') {
      this.journey.pageViews.push(name);
    } else if (category === 'feature_usage') {
      this.journey.features.push(name);
    } else if (category === 'error') {
      this.journey.errors.push(name);
    } else if (category === 'crisis_intervention') {
      this.journey.crisisInterventions.push(name);
      // Priority handling for crisis events
      if (this.config.crisisPriority) {
        this.flush(); // Immediate flush for crisis events
      }
    } else if (category === 'wellness_tracking') {
      this.journey.wellnessActivities.push(name);
    }

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  trackPageView(path: string, title?: string) {
    const properties: Record<string, any> = {
      path,
      title: title || document.title,
      referrer: document.referrer,
      language: navigator.language,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Add device data only if consented and privacy settings allow
    if (this.config.privacySettings.collectDeviceData && this.consentStatus?.analytics) {
      properties.userAgent = navigator.userAgent;
    }

    this.track('page_view', 'page_view', properties);
  }

  trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>) {
    this.track(`${feature}_${action}`, 'feature_usage', {
      feature,
      action,
      ...properties
    });
  }

  trackEvent(eventName: string, properties?: Record<string, any>) {
    this.track(eventName, 'user_action', properties);
  }

  trackError(error: Error, context?: string) {
    this.track('error', 'error', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack trace
      context,
      url: window.location.href
    });
  }

  trackUserAction(action: string, element?: string, properties?: Record<string, any>) {
    this.track(action, 'user_action', {
      element,
      ...properties
    });
  }

  trackTiming(name: string, duration: number, category?: string) {
    this.track('timing', 'performance', {
      name,
      duration,
      category
    });
  }

  // Crisis intervention specific tracking
  trackCrisisIntervention(action: string, properties?: Record<string, any>) {
    this.track(action, 'crisis_intervention', {
      timestamp: Date.now(),
      urgent: true,
      ...properties
    });
  }

  // Wellness tracking
  trackWellnessActivity(activity: string, properties?: Record<string, any>) {
    this.track(activity, 'wellness_tracking', {
      timestamp: Date.now(),
      ...properties
    });
  }

  // Consent Management
  updateConsent(consent: Partial<ConsentStatus>) {
    this.consentStatus = {
      ...this.consentStatus!,
      ...consent,
      timestamp: Date.now()
    };
    
    this.saveConsentStatus();
    this.journey.consentStatus = this.consentStatus;

    // Track consent change
    this.track('consent_updated', 'user_action', {
      analytics: consent.analytics,
      performance: consent.performance,
      functionality: consent.functionality,
      marketing: consent.marketing
    });

    // Re-initialize if consent was granted
    if (!this.config.enabled && this.hasRequiredConsent()) {
      this.config.enabled = true;
      this.initialize();
    }

    // Disable if consent was revoked
    if (this.config.enabled && !this.hasRequiredConsent()) {
      this.optOut();
    }
  }

  getConsentStatus(): ConsentStatus | null {
    return this.consentStatus;
  }

  // GDPR Right to Access
  async exportUserData(userId: string): Promise<DataExportRequest> {
    const exportRequest: DataExportRequest = {
      userId,
      requestDate: Date.now(),
      includeAnalytics: true,
      includeJourneys: true,
      format: 'json',
      status: 'pending'
    };

    try {
      // Get all stored data for user
      const events = this.getStoredEvents().filter(event => 
        event.userId === userId || event.sessionId === this.sessionId
      );
      
      const userData = {
        user: { userId },
        events,
        journey: this.journey,
        consentStatus: this.consentStatus,
        exportRequest
      };

      // In a real implementation, this would trigger a server-side export process
      console.log('Astral Core Analytics: User data export requested:', userData);
      
      exportRequest.status = 'completed';
      return exportRequest;
    } catch (error) {
      console.error('Astral Core Analytics: Failed to export user data:', error);
      exportRequest.status = 'failed';
      return exportRequest;
    }
  }

  // GDPR Right to Erasure
  async deleteUserData(userId: string, retainCrisisData: boolean = true): Promise<DataDeletionRequest> {
    const deletionRequest: DataDeletionRequest = {
      userId,
      requestDate: Date.now(),
      deleteAnalytics: true,
      deleteJourneys: true,
      retainCrisisData,
      status: 'pending'
    };

    try {
      // Remove user data from local storage
      const events = this.getStoredEvents();
      const filteredEvents = events.filter(event => {
        if (event.userId !== userId) return true;
        
        // Retain crisis intervention data if requested (for safety)
        if (retainCrisisData && event.category === 'crisis_intervention') {
          // Anonymize but keep for safety analysis
          return { ...event, userId: undefined, isAnonymized: true };
        }
        
        return false;
      });

      localStorage.setItem('analytics_events', JSON.stringify(filteredEvents));
      
      // Clear session data if it belongs to the user
      if (this.userId === userId) {
        this.userId = undefined;
        this.journey.events = this.journey.events.filter(event => 
          retainCrisisData && event.category === 'crisis_intervention'
        );
      }

      deletionRequest.status = 'completed';
      
      // Track the deletion (anonymously)
      this.track('user_data_deleted', 'user_action', {
        retainedCrisisData: retainCrisisData,
        deletionTimestamp: Date.now()
      });

      return deletionRequest;
    } catch (error) {
      console.error('Astral Core Analytics: Failed to delete user data:', error);
      deletionRequest.status = 'failed';
      return deletionRequest;
    }
  }

  // Session management
  setUserId(userId: string) {
    if (this.config.collectPersonalData && this.consentStatus?.analytics) {
      this.userId = userId;
    }
  }

  endSession() {
    this.journey.endTime = Date.now();
    
    // Track session summary
    this.track('session_end', 'user_action', {
      duration: this.journey.endTime - this.journey.startTime,
      pageViews: this.journey.pageViews.length,
      features: this.journey.features.length,
      errors: this.journey.errors.length,
      events: this.journey.events.length,
      crisisInterventions: this.journey.crisisInterventions.length,
      wellnessActivities: this.journey.wellnessActivities.length
    });

    this.flush();
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.dataRetentionTimer) {
      clearInterval(this.dataRetentionTimer);
    }
  }

  flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.sendEvents(events);
  }

  // Configuration
  updateConfig(newConfig: Partial<AnalyticsConfig>) {
    this.config = { 
      ...this.config, 
      ...newConfig,
      privacySettings: {
        ...this.config.privacySettings,
        ...(newConfig.privacySettings || {})
      }
    };
  }

  isEnabled(): boolean {
    return this.config.enabled && this.hasRequiredConsent();
  }

  // Privacy controls
  optOut() {
    this.config.enabled = false;
    this.eventQueue = [];
    
    if (this.consentStatus) {
      this.consentStatus.analytics = false;
      this.saveConsentStatus();
    }
    
    localStorage.setItem('analytics_opted_out', 'true');
    
    // Stop timers
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (this.dataRetentionTimer) {
      clearInterval(this.dataRetentionTimer);
    }
  }

  optIn() {
    this.config.enabled = true;
    localStorage.removeItem('analytics_opted_out');
    
    if (this.consentStatus) {
      this.consentStatus.analytics = true;
      this.saveConsentStatus();
    }
    
    if (this.hasRequiredConsent()) {
      this.initialize();
    }
  }

  // Debug methods
  getStoredEvents(): AnalyticsEvent[] {
    const stored = localStorage.getItem('analytics_events');
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      // Handle malformed JSON gracefully
      console.warn('Astral Core Analytics: Failed to parse stored events:', error);
      return [];
    }
  }

  getJourney(): UserJourney {
    return { ...this.journey };
  }

  clearStoredData() {
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_failed');
    localStorage.removeItem('analytics_consent_status');
  }

  // Privacy compliance reporting
  getPrivacyReport() {
    const events = this.getStoredEvents();
    const personalDataEvents = events.filter(event => !event.isAnonymized && event.userId);
    const anonymizedEvents = events.filter(event => event.isAnonymized);
    const crisisEvents = events.filter(event => event.category === 'crisis_intervention');

    return {
      totalEvents: events.length,
      personalDataEvents: personalDataEvents.length,
      anonymizedEvents: anonymizedEvents.length,
      crisisEvents: crisisEvents.length,
      dataRetentionDays: this.config.privacySettings.dataRetentionDays,
      gdprCompliant: this.config.gdprCompliant,
      hipaaAdjacent: this.config.hipaaAdjacent,
      consentStatus: this.consentStatus,
      oldestEvent: events.length > 0 ? new Date(Math.min(...events.map(e => e.timestamp))) : null,
      newestEvent: events.length > 0 ? new Date(Math.max(...events.map(e => e.timestamp))) : null
    };
  }
}

// React hooks
export const useAnalytics = () => {
  const [service] = React.useState(() => {
    const optedOut = localStorage.getItem('analytics_opted_out') === 'true';
    return new AnalyticsService({ enabled: !optedOut });
  });

  React.useEffect(() => {
    // Auto-track page changes in SPA
    const handleLocationChange = () => {
      service.trackPageView(window.location.pathname);
    };

    // Listen for route changes (this would need to be adapted to your router)
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      service.endSession();
    };
  }, [service]);

  return {
    track: service.track.bind(service),
    trackPageView: service.trackPageView.bind(service),
    trackEvent: service.trackEvent.bind(service),
    trackFeatureUsage: service.trackFeatureUsage.bind(service),
    trackError: service.trackError.bind(service),
    trackUserAction: service.trackUserAction.bind(service),
    trackTiming: service.trackTiming.bind(service),
    trackCrisisIntervention: service.trackCrisisIntervention.bind(service),
    trackWellnessActivity: service.trackWellnessActivity.bind(service),
    setUserId: service.setUserId.bind(service),
    updateConsent: service.updateConsent.bind(service),
    getConsentStatus: service.getConsentStatus.bind(service),
    exportUserData: service.exportUserData.bind(service),
    deleteUserData: service.deleteUserData.bind(service),
    optOut: service.optOut.bind(service),
    optIn: service.optIn.bind(service),
    isEnabled: service.isEnabled.bind(service),
    getPrivacyReport: service.getPrivacyReport.bind(service)
  };
};

// Web Vitals tracking
export class WebVitalsTracker {
  private readonly analytics: AnalyticsService;

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
    // Initialize web vitals synchronously or defer initialization
    setTimeout(() => this.initializeWebVitals(), 0);
  }

  private async initializeWebVitals() {
    if ('web-vitals' in window) {
      const webVitals = (window as any)['web-vitals'];
      
      // Track Core Web Vitals
      webVitals.getCLS((metric: any) => this.reportWebVital('CLS', metric));
      webVitals.getFID((metric: any) => this.reportWebVital('FID', metric));
      webVitals.getFCP((metric: any) => this.reportWebVital('FCP', metric));
      webVitals.getLCP((metric: any) => this.reportWebVital('LCP', metric));
      webVitals.getTTFB((metric: any) => this.reportWebVital('TTFB', metric));
    }
  }

  private reportWebVital(name: string, metric: any) {
    this.analytics.track(`web_vital_${name}`, 'performance', {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id
    });
  }
}

// A/B Testing support
export class ABTestingManager {
  private readonly experiments: Map<string, any> = new Map();
  private readonly analytics: AnalyticsService;

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
    this.loadExperiments();
  }

  private loadExperiments() {
    const stored = localStorage.getItem('ab_experiments');
    if (stored) {
      const experiments = JSON.parse(stored);
      Object.entries(experiments).forEach(([key, value]) => {
        this.experiments.set(key, value);
      });
    }
  }

  getVariant(experimentId: string, variants: string[]): string {
    // Check if user already has a variant
    if (this.experiments.has(experimentId)) {
      return this.experiments.get(experimentId);
    }

    // Assign random variant
    const variant = variants[Math.floor(Math.random() * variants.length)];
    this.experiments.set(experimentId, variant);
    
    // Save and track
    this.saveExperiments();
    this.analytics.track('ab_test_assignment', 'feature_usage', {
      experimentId,
      variant,
      timestamp: Date.now()
    });

    return variant;
  }

  trackConversion(experimentId: string, conversionType: string) {
    const variant = this.experiments.get(experimentId);
    if (variant) {
      this.analytics.track('ab_test_conversion', 'feature_usage', {
        experimentId,
        variant,
        conversionType,
        timestamp: Date.now()
      });
    }
  }

  private saveExperiments() {
    const obj = Object.fromEntries(this.experiments);
    localStorage.setItem('ab_experiments', JSON.stringify(obj));
  }
}

// Session Recording (privacy-compliant)
export class SessionRecorder {
  private readonly analytics: AnalyticsService;
  private recording: boolean = false;
  private events: any[] = [];
  private startTime: number = 0;

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
  }

  startRecording(consent: boolean = false) {
    if (!consent) {
      console.warn('Session recording requires explicit consent');
      return;
    }

    this.recording = true;
    this.startTime = Date.now();
    this.events = [];

    // Record user interactions (privacy-compliant)
    document.addEventListener('click', this.recordEvent);
    document.addEventListener('input', this.recordEvent);
    document.addEventListener('scroll', this.recordEvent);
  }

  private readonly recordEvent = (event: Event) => {
    if (!this.recording) return;

    // Sanitize event data
    const sanitizedEvent = {
      type: event.type,
      timestamp: Date.now() - this.startTime,
      target: {
        tagName: (event.target as HTMLElement)?.tagName,
        className: (event.target as HTMLElement)?.className,
        // Don't record actual input values for privacy
        value: event.type === 'input' ? '[REDACTED]' : undefined
      }
    };

    this.events.push(sanitizedEvent);
  };

  stopRecording() {
    this.recording = false;
    document.removeEventListener('click', this.recordEvent);
    document.removeEventListener('input', this.recordEvent);
    document.removeEventListener('scroll', this.recordEvent);

    // Send recording data
    if (this.events.length > 0) {
      this.analytics.track('session_recording', 'user_action', {
        duration: Date.now() - this.startTime,
        eventCount: this.events.length,
        // Don't send actual events, just metadata
        metadata: {
          clicks: this.events.filter(e => e.type === 'click').length,
          inputs: this.events.filter(e => e.type === 'input').length,
          scrolls: this.events.filter(e => e.type === 'scroll').length
        }
      });
    }
  }
}

// Singleton instance
let analyticsServiceInstance: AnalyticsService | null = null;

export const getAnalyticsService = () => {
  if (!analyticsServiceInstance) {
    const optedOut = localStorage.getItem('astralcore_analytics_opted_out') === 'true';
    analyticsServiceInstance = new AnalyticsService({ enabled: !optedOut });
    
    // Initialize additional tracking
    const webVitalsTracker = new WebVitalsTracker(analyticsServiceInstance);
    // Keep reference to prevent garbage collection
    (analyticsServiceInstance as any).webVitalsTracker = webVitalsTracker;
    
    // Set up error tracking integration
    errorHandlingService.onError((error) => {
      analyticsServiceInstance!.trackError(
        new Error(error.message),
        error.category
      );
    });

    // Note: WebSocket analytics would need to be implemented differently
    // as the service doesn't expose event listeners
  }
  return analyticsServiceInstance;
};

// Export singleton for Astral Core
export const astralCoreAnalytics = getAnalyticsService();

// Initialize with Auth0 user when authenticated
if (typeof window !== 'undefined') {
  window.addEventListener('auth-success', (event: any) => {
    const user = event.detail?.user || auth0Service.getCurrentUser();
    if (user?.sub) {
      astralCoreAnalytics.setUserId(user.sub);
      astralCoreAnalytics.track('user_authenticated', 'user_action', {
        provider: 'auth0',
        timestamp: Date.now()
      });
    }
  });

  window.addEventListener('auth-logout', () => {
    astralCoreAnalytics.track('user_logout', 'user_action', {
      timestamp: Date.now()
    });
    astralCoreAnalytics.endSession();
  });
}

// Export A/B testing manager
export const abTesting = new ABTestingManager(astralCoreAnalytics);

// Export session recorder
export const sessionRecorder = new SessionRecorder(astralCoreAnalytics);

// Export the class for extending
export { AnalyticsService };

// Export the configured instance as default
export default astralCoreAnalytics;