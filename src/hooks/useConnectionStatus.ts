/**
 * Offline Connection Status Hook
 * 
 * Provides real-time connection status monitoring and service worker communication
 * for the Astral Core mental health platform with crisis intervention priority.
 */

import { useState, useEffect, useCallback } from 'react';

export interface ConnectionStatus {
  isOnline: boolean;
  isServiceWorkerSupported: boolean;
  isServiceWorkerRegistered: boolean;
  serviceWorkerStatus: 'installing' | 'waiting' | 'active' | 'redundant' | 'not_registered';
  lastSync: Date | null;
  crisisResourcesAvailable: boolean;
  offlineCapabilities: OfflineCapability[];
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

export interface OfflineCapability {
  feature: string;
  available: boolean;
  description: string;
  fallbackAction?: string;
}

export interface ServiceWorkerMessage {
  type: 'crisis-resources-cached' | 'offline-capabilities-updated' | 'sync-completed' | 'cache-updated';
  data?: any;
  timestamp: number;
}

const DEFAULT_CONNECTION_STATUS: ConnectionStatus = {
  isOnline: navigator.onLine,
  isServiceWorkerSupported: 'serviceWorker' in navigator,
  isServiceWorkerRegistered: false,
  serviceWorkerStatus: 'not_registered',
  lastSync: null,
  crisisResourcesAvailable: false,
  offlineCapabilities: [],
  connectionQuality: 'offline'
};

const DEFAULT_OFFLINE_CAPABILITIES: OfflineCapability[] = [
  {
    feature: 'Crisis Resources',
    available: false,
    description: 'Emergency contacts and crisis intervention resources',
    fallbackAction: 'Access cached crisis resources'
  },
  {
    feature: 'Safety Plan',
    available: false,
    description: 'Personal safety planning tools',
    fallbackAction: 'Use offline safety plan template'
  },
  {
    feature: 'Coping Strategies',
    available: false,
    description: 'Self-help and coping technique resources',
    fallbackAction: 'Browse cached coping strategies'
  },
  {
    feature: 'Community Posts',
    available: false,
    description: 'View and create community posts',
    fallbackAction: 'Queue posts for when online'
  },
  {
    feature: 'AI Assistant',
    available: false,
    description: 'AI-powered mental health support',
    fallbackAction: 'Use offline guidance resources'
  },
  {
    feature: 'Helper Chat',
    available: false,
    description: 'Real-time chat with certified helpers',
    fallbackAction: 'Queue messages for when online'
  }
];

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(DEFAULT_CONNECTION_STATUS);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Update connection quality based on navigator connection
  const updateConnectionQuality = useCallback(() => {
    if (!navigator.onLine) {
      return 'offline';
    }

    // Use Network Information API if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const { effectiveType, downlink } = connection;
      
      if (effectiveType === '4g' && downlink > 1) {
        return 'excellent';
      } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 0.5)) {
        return 'good';
      } else {
        return 'poor';
      }
    }

    // Fallback: assume good if online but no connection info
    return 'good';
  }, []);

  // Check if crisis resources are cached
  const checkCrisisResourcesAvailability = useCallback(async () => {
    if (!('caches' in window)) return false;

    try {
      const crisisCache = await caches.open('astral-core-crisis-v1');
      const keys = await crisisCache.keys();
      
      const requiredResources = [
        '/crisis-resources.json',
        '/emergency-contacts.json',
        '/offline-coping-strategies.json'
      ];

      const availableResources = keys.map(request => new URL(request.url).pathname);
      return requiredResources.every(resource => 
        availableResources.some(available => available.includes(resource))
      );
    } catch (error) {
      console.warn('[useConnectionStatus] Failed to check crisis resources:', error);
      return false;
    }
  }, []);

  // Update offline capabilities based on current state
  const updateOfflineCapabilities = useCallback(async (crisisAvailable: boolean, swRegistered: boolean) => {
    const capabilities = DEFAULT_OFFLINE_CAPABILITIES.map(capability => {
      switch (capability.feature) {
        case 'Crisis Resources':
        case 'Safety Plan':
        case 'Coping Strategies':
          return { ...capability, available: crisisAvailable };
        
        case 'Community Posts':
        case 'Helper Chat':
          return { ...capability, available: swRegistered };
        
        case 'AI Assistant':
          return { ...capability, available: false }; // Requires online connection
        
        default:
          return capability;
      }
    });

    setConnectionStatus(prev => ({
      ...prev,
      offlineCapabilities: capabilities
    }));
  }, []);

  // Handle service worker messages
  const handleServiceWorkerMessage = useCallback((event: MessageEvent<ServiceWorkerMessage>) => {
    const { type, data, timestamp } = event.data;
    
    console.log('[useConnectionStatus] SW Message:', type, data);

    switch (type) {
      case 'crisis-resources-cached':
        setConnectionStatus(prev => ({
          ...prev,
          crisisResourcesAvailable: true,
          lastSync: new Date(timestamp)
        }));
        break;
      
      case 'offline-capabilities-updated':
        if (data?.capabilities) {
          setConnectionStatus(prev => ({
            ...prev,
            offlineCapabilities: data.capabilities
          }));
        }
        break;
      
      case 'sync-completed':
        setConnectionStatus(prev => ({
          ...prev,
          lastSync: new Date(timestamp)
        }));
        break;
      
      case 'cache-updated':
        // Refresh crisis resources availability
        checkCrisisResourcesAvailability().then(available => {
          setConnectionStatus(prev => ({
            ...prev,
            crisisResourcesAvailable: available
          }));
        });
        break;
    }
  }, [checkCrisisResourcesAvailability]);

  // Initialize service worker registration
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const initializeServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          setServiceWorkerRegistration(registration);
          
          const updateStatus = (sw: ServiceWorker | null) => {
            if (!sw) return;
            
            setConnectionStatus(prev => ({
              ...prev,
              isServiceWorkerRegistered: true,
              serviceWorkerStatus: sw.state as 'waiting' | 'active' | 'installing' | 'redundant' | 'not_registered'
            }));
          };

          // Monitor service worker state changes
          if (registration.installing) {
            updateStatus(registration.installing);
            registration.installing.addEventListener('statechange', () => updateStatus(registration.installing));
          } else if (registration.waiting) {
            updateStatus(registration.waiting);
            registration.waiting.addEventListener('statechange', () => updateStatus(registration.waiting));
          } else if (registration.active) {
            updateStatus(registration.active);
            registration.active.addEventListener('statechange', () => updateStatus(registration.active));
          }

          // Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }
      } catch (error) {
        console.warn('[useConnectionStatus] Service Worker initialization failed:', error);
      }
    };

    initializeServiceWorker();

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [handleServiceWorkerMessage]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: true,
        connectionQuality: updateConnectionQuality()
      }));
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: false,
        connectionQuality: 'offline'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection quality check
    setConnectionStatus(prev => ({
      ...prev,
      connectionQuality: updateConnectionQuality()
    }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateConnectionQuality]);

  // Monitor connection quality changes
  useEffect(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const handleConnectionChange = () => {
        setConnectionStatus(prev => ({
          ...prev,
          connectionQuality: updateConnectionQuality()
        }));
      };

      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, [updateConnectionQuality]);

  // Initial crisis resources check
  useEffect(() => {
    checkCrisisResourcesAvailability().then(available => {
      setConnectionStatus(prev => {
        const updated = {
          ...prev,
          crisisResourcesAvailable: available
        };
        
        updateOfflineCapabilities(available, prev.isServiceWorkerRegistered);
        return updated;
      });
    });
  }, [checkCrisisResourcesAvailability, updateOfflineCapabilities]);

  // Send message to service worker
  const sendMessageToServiceWorker = useCallback(async (message: any) => {
    if (!serviceWorkerRegistration?.active) {
      console.warn('[useConnectionStatus] No active service worker to send message to');
      return false;
    }

    try {
      serviceWorkerRegistration.active.postMessage(message);
      return true;
    } catch (error) {
      console.error('[useConnectionStatus] Failed to send message to service worker:', error);
      return false;
    }
  }, [serviceWorkerRegistration]);

  // Request crisis resources update
  const updateCrisisResources = useCallback(async () => {
    return sendMessageToServiceWorker({
      type: 'update-crisis-resources',
      timestamp: Date.now()
    });
  }, [sendMessageToServiceWorker]);

  // Force cache update
  const forceCacheUpdate = useCallback(async () => {
    return sendMessageToServiceWorker({
      type: 'force-cache-update',
      timestamp: Date.now()
    });
  }, [sendMessageToServiceWorker]);

  return {
    connectionStatus,
    updateCrisisResources,
    forceCacheUpdate,
    sendMessageToServiceWorker
  };
};

export default useConnectionStatus;
