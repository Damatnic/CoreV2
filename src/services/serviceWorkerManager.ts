/**
 * Service Worker Manager - Basic Implementation
 * 
 * Provides basic service worker functionality interface
 * for compatibility with existing hooks.
 */

export interface CacheStatus {
  staticResources: boolean;
  crisisResources: boolean;
  translations: boolean;
  culturalContent: boolean;
  aiModels: boolean;
  swRegistered?: boolean;
  cacheVersion?: string;
  updateAvailable?: boolean;
}

class ServiceWorkerManager {
  private readonly isReady: boolean = false;
  private readonly onlineCallbacks: Array<() => void> = [];
  private readonly offlineCallbacks: Array<() => void> = [];
  private readonly updateCallbacks: Array<() => void> = [];

  async isOfflineReady(): Promise<boolean> {
    return this.isReady;
  }

  async getCacheStatus(): Promise<CacheStatus> {
    return {
      staticResources: false,
      crisisResources: false,
      translations: false,
      culturalContent: false,
      aiModels: false,
      swRegistered: 'serviceWorker' in navigator,
      cacheVersion: '1.0.0',
      updateAvailable: false
    };
  }

  async skipWaiting(): Promise<void> {
    // Stub implementation
    console.log('[ServiceWorker] Skip waiting requested');
  }

  async checkForUpdates(): Promise<boolean> {
    // Stub implementation
    return false;
  }

  async clearCache(): Promise<boolean> {
    // Stub implementation
    return true;
  }

  async cacheCrisisResource(url: string): Promise<boolean> {
    console.log('[ServiceWorker] Cache crisis resource:', url);
    return true;
  }

  async precacheCrisisResources(): Promise<void> {
    console.log('[ServiceWorker] Precache crisis resources');
  }

  forceReload(): void {
    window.location.reload();
  }

  onOnline(callback: () => void): void {
    this.onlineCallbacks.push(callback);
  }

  onOffline(callback: () => void): void {
    this.offlineCallbacks.push(callback);
  }

  onUpdateAvailable(callback: () => void): void {
    this.updateCallbacks.push(callback);
  }

  removeOnlineListener(callback: () => void): void {
    const index = this.onlineCallbacks.indexOf(callback);
    if (index > -1) {
      this.onlineCallbacks.splice(index, 1);
    }
  }

  removeOfflineListener(callback: () => void): void {
    const index = this.offlineCallbacks.indexOf(callback);
    if (index > -1) {
      this.offlineCallbacks.splice(index, 1);
    }
  }

  removeUpdateListener(callback: () => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  getNetworkStatus(): { isOnline: boolean; type?: string } {
    return {
      isOnline: navigator.onLine,
      type: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }
}

const serviceWorkerManager = new ServiceWorkerManager();
export default serviceWorkerManager;
