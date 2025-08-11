/**
 * Service Worker Update Notification
 * 
 * Notifies users when a new version of the app is available
 * and provides controls for updating.
 */

import React, { useState } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import './ServiceWorkerUpdate.css';

interface UpdateNotificationProps {
  onDismiss?: () => void;
  autoShow?: boolean;
  className?: string;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  onDismiss,
  autoShow = true,
  className = ''
}) => {
  const { updateAvailable, skipWaiting, forceReload } = useServiceWorker();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if no update available, auto-show is disabled, or user dismissed
  if (!updateAvailable || !autoShow || isDismissed) {
    return null;
  }

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      await skipWaiting();
    } catch (error) {
      console.error('Failed to update:', error);
      // Fallback to force reload
      forceReload();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`update-notification ${className}`}>
      <div className="update-content">
        <div className="update-icon">🔄</div>
        <div className="update-text">
          <div className="update-title">New Version Available</div>
          <div className="update-subtitle">
            A new version of Astral Core is ready with improvements and bug fixes.
          </div>
        </div>
        <div className="update-actions">
          <button
            type="button"
            className="update-btn primary"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Now'}
          </button>
          <button
            type="button"
            className="update-btn secondary"
            onClick={handleDismiss}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Service Worker Status Component
 * Shows detailed service worker and cache status
 */
interface ServiceWorkerStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const ServiceWorkerStatus: React.FC<ServiceWorkerStatusProps> = ({
  showDetails = false,
  className = ''
}) => {
  const { 
    isOnline, 
    isOfflineReady, 
    cacheStatus, 
    checkForUpdates,
    clearCache 
  } = useServiceWorker();
  
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleCheckUpdates = async () => {
    try {
      setIsCheckingUpdates(true);
      await checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setIsClearingCache(true);
      const success = await clearCache();
      if (success) {
        alert('Cache cleared successfully. The page will refresh.');
        window.location.reload();
      } else {
        alert('Failed to clear cache. Please try again.');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <div className={`sw-status ${className}`}>
      <div className="status-header">
        <h4>App Status</h4>
      </div>
      
      <div className="status-grid">
        <div className="status-item">
          <span className="status-label">Connection:</span>
          <span className={`status-value ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">Offline Ready:</span>
          <span className={`status-value ${isOfflineReady ? 'ready' : 'not-ready'}`}>
            {isOfflineReady ? '✅ Yes' : '⚠️ Limited'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">Service Worker:</span>
          <span className={`status-value ${cacheStatus?.swRegistered ? 'active' : 'inactive'}`}>
            {cacheStatus?.swRegistered ? '✅ Active' : '❌ Inactive'}
          </span>
        </div>
        
        {showDetails && cacheStatus && (
          <>
            <div className="status-item">
              <span className="status-label">Cache Version:</span>
              <span className="status-value">
                {cacheStatus.cacheVersion || 'Unknown'}
              </span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Update Available:</span>
              <span className={`status-value ${cacheStatus.updateAvailable ? 'available' : 'current'}`}>
                {cacheStatus.updateAvailable ? '🔄 Yes' : '✅ Current'}
              </span>
            </div>
          </>
        )}
      </div>
      
      {showDetails && (
        <div className="status-actions">
          <button
            type="button"
            className="status-btn"
            onClick={handleCheckUpdates}
            disabled={isCheckingUpdates}
          >
            {isCheckingUpdates ? 'Checking...' : 'Check for Updates'}
          </button>
          
          <button
            type="button"
            className="status-btn secondary"
            onClick={handleClearCache}
            disabled={isClearingCache}
          >
            {isClearingCache ? 'Clearing...' : 'Clear Cache'}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Crisis Cache Status
 * Shows status of crisis resource caching
 */
interface CrisisCacheStatusProps {
  className?: string;
}

export const CrisisCacheStatus: React.FC<CrisisCacheStatusProps> = ({
  className = ''
}) => {
  const { precacheCrisisResources } = useServiceWorker();
  const [isPrecaching, setIsPrecaching] = useState(false);

  const handlePrecacheResources = async () => {
    try {
      setIsPrecaching(true);
      await precacheCrisisResources();
      alert('Crisis resources cached successfully for offline access.');
    } catch (error) {
      console.error('Failed to cache crisis resources:', error);
      alert('Failed to cache crisis resources. Please try again.');
    } finally {
      setIsPrecaching(false);
    }
  };

  return (
    <div className={`crisis-cache-status ${className}`}>
      <div className="cache-header">
        <h4>🚨 Crisis Resource Caching</h4>
        <p>Ensure critical resources are available offline</p>
      </div>
      
      <div className="cache-actions">
        <button
          type="button"
          className="cache-btn primary"
          onClick={handlePrecacheResources}
          disabled={isPrecaching}
        >
          {isPrecaching ? 'Caching Resources...' : 'Cache Crisis Resources'}
        </button>
      </div>
      
      <div className="cache-note">
        <small>
          This will download and cache your safety plan, emergency contacts, 
          and crisis intervention resources for offline access.
        </small>
      </div>
    </div>
  );
};

export default UpdateNotification;
