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
  constructor(_callback: ResizeObserverCallback) {}
};

// Mock IntersectionObserver
(global as any).IntersectionObserver = class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
};

// Mock MutationObserver
(global as any).MutationObserver = class MockMutationObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
  constructor(_callback: MutationCallback) {}
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

// Ensure timer functions are available in the global scope
if (typeof global.setInterval === 'undefined') {
  global.setInterval = setInterval;
}
if (typeof global.clearInterval === 'undefined') {
  global.clearInterval = clearInterval;
}
if (typeof global.setTimeout === 'undefined') {
  global.setTimeout = setTimeout;
}
if (typeof global.clearTimeout === 'undefined') {
  global.clearTimeout = clearTimeout;
}

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

// Mock comprehensive DOM element methods
HTMLElement.prototype.setAttribute = jest.fn();
HTMLElement.prototype.getAttribute = jest.fn((attr: string) => {
  // Return some default values for commonly used attributes
  switch (attr) {
    case 'class':
    case 'className':
      return '';
    case 'id':
      return '';
    case 'role':
      return '';
    case 'tabindex':
      return '0';
    case 'aria-label':
      return '';
    case 'aria-hidden':
      return 'false';
    case 'data-testid':
      return '';
    default:
      return null;
  }
});
HTMLElement.prototype.removeAttribute = jest.fn();
HTMLElement.prototype.hasAttribute = jest.fn(() => false);
HTMLElement.prototype.getAttributeNames = jest.fn(() => []);

// Mock Element methods
Element.prototype.setAttribute = jest.fn();
Element.prototype.getAttribute = jest.fn((attr: string) => {
  switch (attr) {
    case 'class':
    case 'className':
      return '';
    case 'id':
      return '';
    case 'role':
      return '';
    case 'tabindex':
      return '0';
    default:
      return null;
  }
});
Element.prototype.removeAttribute = jest.fn();
Element.prototype.hasAttribute = jest.fn(() => false);
Element.prototype.getAttributeNames = jest.fn(() => []);
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0
} as DOMRect));
Element.prototype.closest = jest.fn(() => null);
Element.prototype.matches = jest.fn(() => false);
Element.prototype.querySelector = jest.fn(() => null);
Element.prototype.querySelectorAll = jest.fn(() => [] as any);

// Mock comprehensive window.getComputedStyle with getPropertyValue
const createMockComputedStyle = () => {
  const getPropertyValue = jest.fn((property: string) => {
    // Return default values for commonly accessed CSS properties
    switch (property) {
      case 'display':
        return 'block';
      case 'visibility':
        return 'visible';
      case 'opacity':
        return '1';
      case 'color':
        return 'rgb(0, 0, 0)';
      case 'background-color':
        return 'rgba(0, 0, 0, 0)';
      case 'font-size':
        return '16px';
      case 'font-family':
        return 'serif';
      case 'width':
        return 'auto';
      case 'height':
        return 'auto';
      case 'margin':
      case 'margin-top':
      case 'margin-right':
      case 'margin-bottom':
      case 'margin-left':
        return '0px';
      case 'padding':
      case 'padding-top':
      case 'padding-right':
      case 'padding-bottom':
      case 'padding-left':
        return '0px';
      case 'border':
      case 'border-top':
      case 'border-right':
      case 'border-bottom':
      case 'border-left':
        return 'none';
      case 'border-style':
        return 'none';
      case 'outline':
        return 'none';
      case 'box-shadow':
        return 'none';
      case 'transform':
        return 'none';
      case 'transition':
        return 'none';
      case 'position':
        return 'static';
      case 'top':
      case 'right':
      case 'bottom':
      case 'left':
        return 'auto';
      case 'z-index':
        return 'auto';
      case 'overflow':
      case 'overflow-x':
      case 'overflow-y':
        return 'visible';
      default:
        return '';
    }
  });

  return {
    getPropertyValue,
    // Add commonly accessed CSS properties as direct properties
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    color: 'rgb(0, 0, 0)',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    fontSize: '16px',
    fontFamily: 'serif',
    width: 'auto',
    height: 'auto',
    margin: '0px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    padding: '0px',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    border: 'none',
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    borderStyle: 'none',
    outline: 'none',
    boxShadow: 'none',
    transform: 'none',
    transition: 'none',
    position: 'static',
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto',
    zIndex: 'auto',
    overflow: 'visible',
    overflowX: 'visible',
    overflowY: 'visible'
  };
};

window.getComputedStyle = jest.fn((element: Element, pseudoElt?: string | null) => {
  return createMockComputedStyle() as any;
});

// Also mock it on the global object for broader compatibility
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn((element: Element, pseudoElt?: string | null) => {
    return createMockComputedStyle() as any;
  })
});

// Mock additional Element/Node methods that might be accessed
Element.prototype.insertAdjacentElement = jest.fn();
Element.prototype.insertAdjacentHTML = jest.fn();
Element.prototype.insertAdjacentText = jest.fn();
Node.prototype.appendChild = jest.fn();
Node.prototype.removeChild = jest.fn();
Node.prototype.insertBefore = jest.fn();
Node.prototype.replaceChild = jest.fn();
Node.prototype.cloneNode = jest.fn(() => ({} as Node));

// Mock focus/blur methods
HTMLElement.prototype.focus = jest.fn();
HTMLElement.prototype.blur = jest.fn();
HTMLElement.prototype.click = jest.fn();

// Mock form element methods
HTMLInputElement.prototype.setSelectionRange = jest.fn();
HTMLInputElement.prototype.select = jest.fn();
HTMLTextAreaElement.prototype.setSelectionRange = jest.fn();
HTMLTextAreaElement.prototype.select = jest.fn();

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

// Ensure DOM root element exists immediately
if (!document.getElementById('root')) {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
}

// Setup before each test
beforeEach(() => {
  // Clear DOM but preserve root
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '';
  } else {
    // Create root element if it doesn't exist
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
  }
  
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