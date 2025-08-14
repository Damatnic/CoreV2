/**
 * Environment configuration utility
 * Handles both Vite (import.meta.env) and Jest (process.env) environments
 */

// Declare process for TypeScript
declare const process: any;

/**
 * Get environment variable value with fallback support
 * Works in both Vite and Jest environments
 */
export function getEnvVar(key: string, defaultValue: string = ''): string {
  // Check if we're in a Node/Jest environment
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  
  // For Vite environment, we'll use a global approach
  // This will be replaced at build time by Vite
  if (typeof window !== 'undefined') {
    // @ts-ignore
    const globalEnv = window.__VITE_ENV__ || {};
    if (globalEnv[key]) {
      return globalEnv[key];
    }
  }
  
  return defaultValue;
}

/**
 * Check if we're in development mode
 */
export function isDev(): boolean {
  // Check Node environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return true;
  }
  
  // Check for dev flag
  if (typeof window !== 'undefined') {
    // @ts-ignore
    return window.__VITE_ENV__?.DEV === true;
  }
  
  return false;
}

/**
 * Check if we're in production mode
 */
export function isProd(): boolean {
  // Check Node environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return true;
  }
  
  // Check for prod flag
  if (typeof window !== 'undefined') {
    // @ts-ignore
    return window.__VITE_ENV__?.PROD === true;
  }
  
  return false;
}

// Initialize the global env object for Vite runtime
if (typeof window !== 'undefined' && !window.__VITE_ENV__) {
  try {
    // @ts-ignore - This will only work in Vite environment
    window.__VITE_ENV__ = import.meta.env;
  } catch (e) {
    // Not in Vite environment
    window.__VITE_ENV__ = {};
  }
}

/**
 * Get all environment variables for the app
 */
export const ENV = {
  // API Configuration
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3847/api'),
  
  // Auth0 Configuration
  AUTH0_DOMAIN: getEnvVar('VITE_AUTH0_DOMAIN', 'dev-placeholder.auth0.com'),
  AUTH0_CLIENT_ID: getEnvVar('VITE_AUTH0_CLIENT_ID', 'placeholder-client-id'),
  AUTH0_CALLBACK_URL: getEnvVar('VITE_AUTH0_CALLBACK_URL', typeof window !== 'undefined' ? window.location.origin + '/callback' : ''),
  AUTH0_AUDIENCE: getEnvVar('VITE_AUTH0_AUDIENCE', 'http://localhost:3847/api'),
  AUTH0_CLIENT_SECRET: getEnvVar('VITE_AUTH0_CLIENT_SECRET', 'placeholder-secret'),
  
  // Push Notifications
  VAPID_PUBLIC_KEY: getEnvVar('VITE_VAPID_PUBLIC_KEY', isDev() ? 'BPrE3_xJcGZo5xOiKh_1G5VhbGxqr4K7SLkJtNhE9f2sQcDvRwXfOhY3zP8mKnN1wRtYuCvBmNzLkDhElLLr-I' : ''),
  
  // WebSocket
  WS_URL: getEnvVar('VITE_WS_URL', isDev() ? 'ws://localhost:3001' : 'wss://api.astralcore.app'),
  
  // Sentry
  SENTRY_DSN: getEnvVar('VITE_SENTRY_DSN', ''),
  SENTRY_DEV_ENABLED: getEnvVar('VITE_SENTRY_DEV_ENABLED', 'false') === 'true',
  
  // App Info
  APP_VERSION: getEnvVar('VITE_APP_VERSION', 'unknown'),
  ENV: getEnvVar('VITE_ENV', 'production'),
  
  // Flags
  IS_DEV: isDev(),
  IS_PROD: isProd(),
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    __VITE_ENV__?: any;
  }
}