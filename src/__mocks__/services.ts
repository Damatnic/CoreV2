/**
 * Global service mocks for tests
 * These mocks provide default implementations for commonly used services
 */

// Crisis Detection Service Mock
export const mockCrisisDetectionService = {
  detectCrisis: jest.fn(() => ({
    isInCrisis: false,
    severity: 'none' as const,
    confidence: 0,
    keywords: [],
    suggestedActions: []
  })),
  analyzeMoodPattern: jest.fn(() => ({
    trend: 'stable' as const,
    riskLevel: 'low' as const,
    recommendations: []
  })),
  updateContext: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(() => ({
    isInCrisis: false,
    lastCheck: Date.now()
  }))
};

// Performance Monitor Service Mock
export const mockPerformanceMonitor = {
  startMeasure: jest.fn(),
  endMeasure: jest.fn(() => 100),
  trackMetric: jest.fn(),
  trackEvent: jest.fn(),
  trackError: jest.fn(),
  getMetrics: jest.fn(() => ({
    pageLoad: 1000,
    firstContentfulPaint: 500,
    timeToInteractive: 1500
  })),
  clearMetrics: jest.fn(),
  flush: jest.fn(() => Promise.resolve())
};

// Analytics Service Mock
export const mockAnalyticsService = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  trackEvent: jest.fn(),
  trackError: jest.fn(),
  setUserProperties: jest.fn(),
  reset: jest.fn()
};

// Auth Service Mock
export const mockAuthService = {
  login: jest.fn(() => Promise.resolve({
    token: 'mock-token',
    user: { id: 'test-user', email: 'test@example.com' }
  })),
  logout: jest.fn(() => Promise.resolve()),
  register: jest.fn(() => Promise.resolve({
    token: 'mock-token',
    user: { id: 'test-user', email: 'test@example.com' }
  })),
  refreshToken: jest.fn(() => Promise.resolve('new-mock-token')),
  getCurrentUser: jest.fn(() => ({
    id: 'test-user',
    email: 'test@example.com'
  })),
  isAuthenticated: jest.fn(() => true),
  getToken: jest.fn(() => 'mock-token')
};

// Notification Service Mock
export const mockNotificationService = {
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  showNotification: jest.fn(() => Promise.resolve()),
  scheduleNotification: jest.fn(() => Promise.resolve('notification-id')),
  cancelNotification: jest.fn(() => Promise.resolve()),
  getPermissionStatus: jest.fn(() => 'granted'),
  isSupported: jest.fn(() => true)
};

// WebSocket Service Mock
export const mockWebSocketService = {
  connect: jest.fn(() => Promise.resolve()),
  disconnect: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  getState: jest.fn(() => 'connected'),
  isConnected: jest.fn(() => true)
};

// Cache Service Mock
export const mockCacheService = {
  get: jest.fn((key) => Promise.resolve(null)),
  set: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  has: jest.fn(() => Promise.resolve(false)),
  getAll: jest.fn(() => Promise.resolve({})),
  size: jest.fn(() => Promise.resolve(0))
};

// Export all mocks as a single object for easy importing
export const serviceMocks = {
  crisisDetection: mockCrisisDetectionService,
  performance: mockPerformanceMonitor,
  analytics: mockAnalyticsService,
  auth: mockAuthService,
  notification: mockNotificationService,
  websocket: mockWebSocketService,
  cache: mockCacheService
};

// Helper function to reset all service mocks
export const resetAllServiceMocks = () => {
  Object.values(serviceMocks).forEach(service => {
    Object.values(service).forEach(method => {
      if (typeof method === 'function' && method.mockReset) {
        method.mockReset();
      }
    });
  });
};

// Helper function to setup default mock implementations
export const setupDefaultMocks = () => {
  // Setup localStorage with some default values
  localStorage.setItem('theme', 'light');
  localStorage.setItem('userPreferences', JSON.stringify({
    notifications: true,
    soundEnabled: false
  }));
  
  // Setup sessionStorage with default session
  sessionStorage.setItem('sessionId', 'test-session');
  
  // Setup fetch to return successful responses by default
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
    headers: new Headers(),
    clone: () => ({
      ok: true,
      status: 200,
      json: async () => ({})
    })
  });
};

export default serviceMocks;