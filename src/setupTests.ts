/**
 * Global test setup file
 * This file is automatically run before all tests
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Setup text encoding/decoding
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Import service mocks
import { setupDefaultMocks } from './__mocks__/services';

// Fix for React 18 act() warnings
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      canvas: {
        width: 300,
        height: 150
      },
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      arc: jest.fn(),
      arcTo: jest.fn(),
      rect: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      clip: jest.fn(),
      isPointInPath: jest.fn(() => false),
      isPointInStroke: jest.fn(() => false),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn(),
      transform: jest.fn(),
      setTransform: jest.fn(),
      resetTransform: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      })),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      })),
      createPattern: jest.fn(() => null),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(),
        width: 0,
        height: 0
      })),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(),
        width: 0,
        height: 0
      })),
      putImageData: jest.fn(),
      drawImage: jest.fn(),
      getLineDash: jest.fn(() => []),
      setLineDash: jest.fn()
    };
  }
  return null;
}) as any;

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock');
HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  if (callback) {
    callback(new Blob(['mock'], { type: 'image/png' }));
  }
}) as any;

// Mock Image
(global as any).Image = class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  width = 0;
  height = 0;
  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;

  constructor() {
    setTimeout(() => {
      this.width = 100;
      this.height = 100;
      this.naturalWidth = 100;
      this.naturalHeight = 100;
      this.complete = true;
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
};

// Mock ResizeObserver
(global as any).ResizeObserver = class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  constructor(callback: ResizeObserverCallback) {}
};

// Mock IntersectionObserver
(global as any).IntersectionObserver = class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
};

// Mock MutationObserver
(global as any).MutationObserver = class MockMutationObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
  constructor(callback: MutationCallback) {}
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.location
delete (window as any).location;
window.location = {
  href: 'http://localhost/',
  origin: 'http://localhost',
  protocol: 'http:',
  host: 'localhost',
  hostname: 'localhost',
  port: '',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  toString: jest.fn(() => 'http://localhost/')
} as any;

// Mock window methods
window.open = jest.fn();
window.alert = jest.fn();
window.confirm = jest.fn(() => true);
window.prompt = jest.fn(() => 'mocked prompt');
window.scrollTo = jest.fn();

// Mock requestAnimationFrame
window.requestAnimationFrame = jest.fn(cb => {
  setTimeout(cb, 0);
  return 0;
});
window.cancelAnimationFrame = jest.fn();

// Mock performance API
if (!window.performance) {
  (window as any).performance = {};
}
window.performance = {
  ...window.performance,
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  navigation: {
    type: 0,
    redirectCount: 0
  } as any,
  timing: {} as any
} as any;

// Mock Web Audio API
(window as any).AudioContext = jest.fn(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440 }
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 }
  })),
  destination: {}
}));

// Mock Notification API
(window as any).Notification = {
  permission: 'default',
  requestPermission: jest.fn(() => Promise.resolve('granted'))
};

// Mock navigator APIs
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: jest.fn((success) => {
      success({
        coords: {
          latitude: 0,
          longitude: 0,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });
    }),
    watchPosition: jest.fn(),
    clearWatch: jest.fn()
  }
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        scriptURL: '/sw.js',
        state: 'activated'
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn()
    })),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        scriptURL: '/sw.js',
        state: 'activated'
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn()
    }),
    controller: {
      scriptURL: '/sw.js',
      state: 'activated',
      postMessage: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getRegistration: jest.fn(() => Promise.resolve(null))
  },
  writable: true
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
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
  } as Response)
);

// Mock crypto
if (!global.crypto) {
  (global as any).crypto = {};
}
global.crypto.randomUUID = () => {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return uuid as `${string}-${string}-${string}-${string}-${string}`;
};

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock console methods to reduce noise
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((message, ...args) => {
    // Filter out known React warnings
    if (
      typeof message === 'string' &&
      (message.includes('Warning:') ||
       message.includes('ReactDOM.render') ||
       message.includes('act()'))
    ) {
      return;
    }
    originalError(message, ...args);
  });

  console.warn = jest.fn((message, ...args) => {
    // Filter out known warnings
    if (
      typeof message === 'string' &&
      (message.includes('componentWill') ||
       message.includes('findDOMNode'))
    ) {
      return;
    }
    originalWarn(message, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Setup before each test
beforeEach(() => {
  // Clear DOM
  document.body.innerHTML = '';
  
  // Create root element
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  
  // Setup default mocks
  setupDefaultMocks();
});

// Cleanup after each test
afterEach(() => {
  // Cleanup React components
  cleanup();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear timers
  jest.clearAllTimers();
  
  // Clear DOM
  document.body.innerHTML = '';
});

// Increase default timeout for async tests
jest.setTimeout(10000);

// Export commonly used utilities
export { localStorageMock, sessionStorageMock };