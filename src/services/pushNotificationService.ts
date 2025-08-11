/**
 * Push Notification Service for Astral Core Mental Health Platform
 * 
 * Handles push notification subscriptions, crisis alerts, helper notifications,
 * and background communication with service worker
 */

// VAPID public key from environment variables with fallback for development
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 
  (import.meta.env.DEV ? 'BPrE3_xJcGZo5xOiKh_1G5VhbGxqr4K7SLkJtNhE9f2sQcDvRwXfOhY3zP8mKnN1wRtYuCvBmNzLkDhElLLr-I' : '');

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  type: 'crisis_alert' | 'helper_request' | 'system_update' | 'general';
  data?: Record<string, any>;
  requireInteraction?: boolean;
}

class PushNotificationService {
  private subscription: PushSubscription | null = null;
  private isSupported: boolean = false;
  private permissionStatus: NotificationPermission = 'default';

  constructor() {
    this.checkSupport();
    this.initializeServiceWorkerMessaging();
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): void {
    this.isSupported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    
    if (this.isSupported) {
      this.permissionStatus = Notification.permission;
      console.log('[Push] Push notifications supported, permission:', this.permissionStatus);
    } else {
      console.warn('[Push] Push notifications not supported in this browser');
    }
  }

  /**
   * Initialize service worker messaging
   */
  private initializeServiceWorkerMessaging(): void {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case 'REQUEST_NOTIFICATION_PERMISSION_UI':
          this.requestPermissionWithUI();
          break;

        case 'PUSH_SUBSCRIPTION_SUCCESS':
          this.handleSubscriptionSuccess(payload.subscription);
          break;

        case 'PUSH_SUBSCRIPTION_ERROR':
          this.handleSubscriptionError(payload.error);
          break;

        case 'CRISIS_MODE_READY':
          console.log('[Push] Crisis mode ready in service worker');
          break;

        default:
          console.log('[Push] Unknown service worker message:', type);
      }
    });
  }

  /**
   * Request notification permission with user-friendly UI
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[Push] Push notifications not supported');
      return false;
    }

    // Skip push notifications if explicitly disabled in development
    if (process.env.VITE_DISABLE_PUSH_NOTIFICATIONS === 'true') {
      console.log('[Push] Push notifications disabled in development mode');
      return false;
    }

    // Skip push notifications in development if no valid VAPID key
    if (process.env.NODE_ENV === 'development' && !process.env.VITE_VAPID_PUBLIC_KEY) {
      console.log('[Push] Push notifications disabled in development - no VAPID key configured');
      return false;
    }

    if (this.permissionStatus === 'granted') {
      return true;
    }

    if (this.permissionStatus === 'denied') {
      console.warn('[Push] Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus = permission;
      
      if (permission === 'granted') {
        console.log('[Push] Notification permission granted');
        await this.subscribeToPush();
        return true;
      } else {
        console.warn('[Push] Notification permission denied by user');
        return false;
      }
    } catch (error) {
      console.error('[Push] Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Request permission with custom UI explanation
   */
  private async requestPermissionWithUI(): Promise<void> {
    // Show custom modal explaining why notifications are important
    const userConsent = await this.showNotificationConsentModal();
    
    if (userConsent) {
      await this.requestPermission();
    }
  }

  /**
   * Show notification consent modal
   */
  private async showNotificationConsentModal(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create custom modal
      const modal = document.createElement('div');
      modal.className = 'notification-consent-modal';
      modal.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content">
            <h3>🔔 Enable Crisis Alerts</h3>
            <p>Astral Core can send you important notifications to help:</p>
            <ul>
              <li>🚨 Receive immediate crisis support requests</li>
              <li>💬 Get notified when someone needs help</li>
              <li>🔄 Stay updated on system improvements</li>
            </ul>
            <p>Your privacy is protected - notifications are sent securely and you can disable them anytime.</p>
            <div class="modal-actions">
              <button class="btn-secondary" id="decline-notifications">Not Now</button>
              <button class="btn-primary" id="enable-notifications">Enable Notifications</button>
            </div>
          </div>
        </div>
      `;

      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .notification-consent-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notification-consent-modal .modal-overlay {
          background: rgba(0, 0, 0, 0.5);
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        .notification-consent-modal .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 400px;
          position: relative;
          z-index: 1;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .notification-consent-modal h3 {
          margin: 0 0 1rem 0;
          color: #667eea;
        }
        .notification-consent-modal ul {
          text-align: left;
          margin: 1rem 0;
        }
        .notification-consent-modal li {
          margin: 0.5rem 0;
        }
        .notification-consent-modal .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }
        .notification-consent-modal button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .notification-consent-modal .btn-secondary {
          background: #f5f5f5;
          color: #666;
        }
        .notification-consent-modal .btn-primary {
          background: #667eea;
          color: white;
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(modal);

      // Handle button clicks
      modal.querySelector('#enable-notifications')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
        resolve(true);
      });

      modal.querySelector('#decline-notifications')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
        resolve(false);
      });

      // Handle overlay click
      modal.querySelector('.modal-overlay')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
        resolve(false);
      });
    });
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPush(): Promise<void> {
    if (!this.isSupported || this.permissionStatus !== 'granted') {
      return;
    }

    // Skip push notifications if explicitly disabled in development
    if (process.env.VITE_DISABLE_PUSH_NOTIFICATIONS === 'true') {
      console.log('[Push] Push notifications disabled in development mode');
      return;
    }

    // Skip push subscription in development if VAPID key is not valid
    if (process.env.NODE_ENV === 'development' && !process.env.VITE_VAPID_PUBLIC_KEY) {
      console.warn('[Push] Skipping push subscription in development - no valid VAPID key');
      return;
    }

    try {
      // Check if any service worker is registered first
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('[Push] No service worker registered - push notifications disabled');
        return;
      }
      
      const vapidKey = process.env.VITE_VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      });

      this.subscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        }
      };

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      console.log('[Push] Successfully subscribed to push notifications');
    } catch (error) {
      console.error('[Push] Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/.netlify/functions/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log('[Push] Subscription sent to server:', result);
    } catch (error) {
      console.error('[Push] Failed to send subscription to server:', error);
      // Don't throw here - app should still work without server subscription
    }
  }

  /**
   * Handle successful subscription
   */
  private handleSubscriptionSuccess(subscription: PushSubscription): void {
    this.subscription = subscription;
    console.log('[Push] Push subscription successful');
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('pushSubscriptionSuccess', {
      detail: { subscription }
    }));
  }

  /**
   * Handle subscription error
   */
  private handleSubscriptionError(error: string): void {
    console.error('[Push] Push subscription error:', error);
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('pushSubscriptionError', {
      detail: { error }
    }));
  }

  /**
   * Send crisis mode activation to service worker
   */
  public async activateCrisisMode(payload?: Record<string, any>): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      // Check if any service worker is registered first
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        registration.active.postMessage({
          type: 'CRISIS_MODE_ACTIVATED',
          payload: payload || {}
        });
      } else {
        console.log('[Push] No active service worker found for crisis mode activation');
      }

      console.log('[Push] Crisis mode activated in service worker');
    } catch (error) {
      console.error('[Push] Failed to activate crisis mode:', error);
    }
  }

  /**
   * Send test notification (for debugging)
   */
  public async sendTestNotification(): Promise<void> {
    if (!this.isSupported || this.permissionStatus !== 'granted') {
      console.warn('[Push] Cannot send test notification - not supported or no permission');
      return;
    }

    try {
      // Check if any service worker is registered first
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification('Astral Core Test', {
          body: 'Push notifications are working correctly!',
          icon: '/icon-192.png',
          tag: 'test-notification'
        });
      } else {
        console.log('[Push] No service worker registered for test notification');
      }
    } catch (error) {
      console.error('[Push] Error sending test notification:', error);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      // Check if any service worker is registered first
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('[Push] No service worker registered for unsubscription');
        this.subscription = null;
        return true;
      }
      
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const result = await subscription.unsubscribe();
        if (result) {
          this.subscription = null;
          console.log('[Push] Successfully unsubscribed from push notifications');
          
          // Notify server about unsubscription
          await this.notifyServerUnsubscription();
        }
        return result;
      }
      
      return true;
    } catch (error) {
      console.error('[Push] Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Notify server about unsubscription
   */
  private async notifyServerUnsubscription(): Promise<void> {
    try {
      await fetch('/.netlify/functions/push-unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('[Push] Failed to notify server about unsubscription:', error);
    }
  }

  /**
   * Get current subscription status
   */
  public getStatus(): {
    isSupported: boolean;
    hasPermission: boolean;
    isSubscribed: boolean;
    subscription: PushSubscription | null;
  } {
    return {
      isSupported: this.isSupported,
      hasPermission: this.permissionStatus === 'granted',
      isSubscribed: !!this.subscription,
      subscription: this.subscription
    };
  }

  /**
   * Utility: Convert URL-safe base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Utility: Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }
}

// Create singleton instance
export const pushNotificationService = new PushNotificationService();

// Export types for use in other modules
export type { PushSubscription, NotificationPayload };
