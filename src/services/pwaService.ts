/**
 * PWA Enhancement Service for Astral Core Mental Health Platform
 * 
 * Manages app installation prompts, offline detection, mobile optimizations,
 * and enhanced app-like experience features
 */

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isStandalone: boolean;
  supportsPWA: boolean;
}

class PWAService {
  private installPrompt: InstallPromptEvent | null = null;
  private isOffline: boolean = !navigator.onLine;
  private installPromptShown: boolean = false;
  private statusCallbacks: Array<(status: PWAStatus) => void> = [];

  constructor() {
    this.initializeEventListeners();
    this.initializeOfflineDetection();
    this.initializeInstallPromptHandling();
    this.initializeMobileOptimizations();
  }

  /**
   * Initialize event listeners for PWA features
   */
  private initializeEventListeners(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as InstallPromptEvent;
      console.log('[PWA] Install prompt available');
      this.notifyStatusChange();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed');
      this.installPrompt = null;
      this.notifyStatusChange();
    });

    // Listen for visibility changes (app focus/blur)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleAppFocus();
      } else {
        this.handleAppBlur();
      }
    });
  }

  /**
   * Initialize offline detection
   */
  private initializeOfflineDetection(): void {
    window.addEventListener('online', () => {
      this.isOffline = false;
      console.log('[PWA] App is back online');
      this.handleOnlineStatusChange(true);
      this.notifyStatusChange();
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      console.log('[PWA] App is offline');
      this.handleOnlineStatusChange(false);
      this.notifyStatusChange();
    });
  }

  /**
   * Initialize smart install prompt handling
   */
  private initializeInstallPromptHandling(): void {
    // DISABLED FOR DEVELOPMENT - PWA install prompts are disabled
    // This can be re-enabled for production builds
    console.log('[PWA] Install prompts disabled for development');
  }

  /**
   * Initialize mobile-specific optimizations
   */
  private initializeMobileOptimizations(): void {
    if (this.isMobileDevice()) {
      // Optimize for mobile gestures
      this.initializeMobileGestures();
      
      // Handle safe area insets
      this.handleSafeAreaInsets();
      
      // Optimize touch interactions
      this.optimizeTouchInteractions();
      
      // Handle device orientation changes
      this.handleOrientationChanges();
    }
  }

  /**
   * Show smart install prompt with context (DISABLED FOR DEVELOPMENT)
   */
  public async showSmartInstallPrompt(): Promise<boolean> {
    // DISABLED FOR DEVELOPMENT - Install prompts are disabled
    console.log('[PWA] Install prompt disabled for development');
    return false;
  }

  /**
   * Handle app focus (user returns to app)
   */
  private handleAppFocus(): void {
    console.log('[PWA] App focused');
    
    // Update offline status
    this.isOffline = !navigator.onLine;
    
    // Refresh critical data if online
    if (!this.isOffline) {
      this.refreshCriticalData();
    }
    
    this.notifyStatusChange();
  }

  /**
   * Handle app blur (user leaves app)
   */
  private handleAppBlur(): void {
    console.log('[PWA] App blurred');
    
    // Save any pending data
    this.savePendingData();
  }

  /**
   * Handle online/offline status changes
   */
  private handleOnlineStatusChange(isOnline: boolean): void {
    // Show user-friendly offline indicator
    this.showOfflineIndicator(!isOnline);
    
    if (isOnline) {
      // Sync any pending data
      this.syncPendingData();
      
      // Refresh critical crisis resources
      this.refreshCrisisResources();
    }
  }

  /**
   * Initialize mobile gesture handling
   */
  private initializeMobileGestures(): void {
    let pullToRefreshTriggered = false;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].pageY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].pageY;
      const pullDistance = currentY - startY;

      // Pull to refresh gesture
      if (pullDistance > 100 && window.scrollY === 0 && !pullToRefreshTriggered) {
        pullToRefreshTriggered = true;
        this.handlePullToRefresh();
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      pullToRefreshTriggered = false;
    }, { passive: true });
  }

  /**
   * Handle safe area insets for notched devices
   */
  private handleSafeAreaInsets(): void {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }
      
      .mobile-safe-area {
        padding-top: var(--safe-area-inset-top);
        padding-right: var(--safe-area-inset-right);
        padding-bottom: var(--safe-area-inset-bottom);
        padding-left: var(--safe-area-inset-left);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize touch interactions
   */
  private optimizeTouchInteractions(): void {
    // Reduce touch delay
    const style = document.createElement('style');
    style.textContent = `
      * {
        touch-action: manipulation;
      }
      
      button, .clickable {
        -webkit-tap-highlight-color: transparent;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle device orientation changes
   */
  private handleOrientationChanges(): void {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        // Trigger resize event for layout adjustments
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });
  }

  /**
   * Handle pull to refresh
   */
  private async handlePullToRefresh(): Promise<void> {
    console.log('[PWA] Pull to refresh triggered');
    
    // Show refresh indicator
    this.showRefreshIndicator();
    
    try {
      // Refresh critical data
      await this.refreshCriticalData();
      
      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('pwaRefresh'));
    } catch (error) {
      console.error('[PWA] Error during pull to refresh:', error);
    } finally {
      this.hideRefreshIndicator();
    }
  }

  /**
   * Show offline indicator
   */
  private showOfflineIndicator(show: boolean): void {
    let indicator = document.getElementById('offline-indicator');
    
    if (show && !indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = '📡 You are offline - Crisis resources remain available';
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff4757;
        color: white;
        text-align: center;
        padding: 0.5rem;
        z-index: 9999;
        font-size: 0.9rem;
      `;
      document.body.appendChild(indicator);
    } else if (!show && indicator) {
      indicator.remove();
    }
  }

  /**
   * Show refresh indicator
   */
  private showRefreshIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'refresh-indicator';
    indicator.innerHTML = '🔄 Refreshing...';
    indicator.style.cssText = `
      position: fixed;
      top: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: #667eea;
      color: white;
      padding: 1rem 2rem;
      border-radius: 2rem;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(indicator);
  }

  /**
   * Hide refresh indicator
   */
  private hideRefreshIndicator(): void {
    const indicator = document.getElementById('refresh-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Refresh critical data
   */
  private async refreshCriticalData(): Promise<void> {
    // Dispatch event for app to handle critical data refresh
    window.dispatchEvent(new CustomEvent('pwaRefreshCriticalData'));
  }

  /**
   * Refresh critical crisis resources
   */
  private async refreshCrisisResources(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Check if any service worker is registered first
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          registration.active.postMessage({
            type: 'CACHE_CRISIS_RESOURCES'
          });
        } else {
          console.log('[PWA] No active service worker found - crisis resources will be handled by client-side cache');
        }
      } catch (error) {
        console.log('[PWA] Service worker not available for crisis resources caching:', error);
      }
    }
  }

  /**
   * Save pending data
   */
  private savePendingData(): void {
    // Dispatch event for app to save any pending data
    window.dispatchEvent(new CustomEvent('pwaSavePendingData'));
  }

  /**
   * Sync pending data
   */
  private async syncPendingData(): Promise<void> {
    // Dispatch event for app to sync any pending data
    window.dispatchEvent(new CustomEvent('pwaSyncPendingData'));
  }

  /**
   * Check if device is mobile
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Get current PWA status
   */
  public getStatus(): PWAStatus {
    return {
      isInstallable: !!this.installPrompt && !this.installPromptShown,
      isInstalled: this.isInstalledAsPWA(),
      isOffline: this.isOffline,
      isStandalone: this.isRunningStandalone(),
      supportsPWA: 'serviceWorker' in navigator
    };
  }

  /**
   * Check if app is installed as PWA
   */
  private isInstalledAsPWA(): boolean {
    // Type-safe check for iOS standalone property
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    return this.isRunningStandalone() || 
           navigatorWithStandalone.standalone === true;
  }

  /**
   * Check if app is running in standalone mode
   */
  private isRunningStandalone(): boolean {
    // Type-safe check for iOS standalone property
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches ||
           navigatorWithStandalone.standalone === true;
  }

  /**
   * Subscribe to status changes
   */
  public onStatusChange(callback: (status: PWAStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of status changes
   */
  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[PWA] Error in status callback:', error);
      }
    });
  }

  /**
   * Check for app updates (DISABLED FOR DEVELOPMENT)
   */
  public async checkForUpdates(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        // Check if any service worker is registered first
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          return !!registration.waiting;
        } else {
          console.log('[PWA] No service worker registered for updates');
          return false;
        }
      } catch (error) {
        console.log('[PWA] Service worker update check failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Apply app update
   */
  public async applyUpdate(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      } catch (error) {
        console.log('[PWA] Error applying update:', error);
      }
    }
  }
}

// Create and export singleton instance
export const pwaService = new PWAService();
export type { PWAStatus };
