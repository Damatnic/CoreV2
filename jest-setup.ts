import '@testing-library/jest-dom';

// Extend Jest matchers with @testing-library/jest-dom
declare global {
  namespace jest {
    interface Matchers<R, T = {}> {
      toBeInTheDocument(): R;
      toHaveValue(value: string | string[] | number): R;
      toBeVisible(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeEmptyDOMElement(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeInvalid(): R;
      toHaveFocus(): R;
      toHaveStyle(css: string | Record<string, any>): R;
    }
  }
}

// Mock crypto.randomUUID for Jest environment
if (!global.crypto) {
  global.crypto = {} as any;
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => {
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return uuid as `${string}-${string}-${string}-${string}-${string}`;
  };
}

// Mock Web APIs for testing
global.Response = global.Response || class MockResponse {
  public body: any;
  public status: number;
  public statusText: string;
  public headers: Headers;
  public ok: boolean;
  public redirected: boolean;
  public type: ResponseType;
  public url: string;
  public bodyUsed: boolean;

  constructor(body?: any, init?: ResponseInit) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
    this.redirected = false;
    this.type = 'basic';
    this.url = '';
    this.bodyUsed = false;
  }

  async text(): Promise<string> {
    if (typeof this.body === 'string') return this.body;
    if (this.body instanceof ArrayBuffer) return new TextDecoder().decode(this.body);
    return JSON.stringify(this.body);
  }

  async json(): Promise<any> {
    const text = await this.text();
    return JSON.parse(text);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.body instanceof ArrayBuffer) return this.body;
    const text = await this.text();
    return new TextEncoder().encode(text).buffer;
  }

  clone(): Response {
    return new (Response as any)(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers
    });
  }

  // Additional methods required by Response interface
  async blob(): Promise<Blob> {
    return new Blob([await this.arrayBuffer()]);
  }

  async formData(): Promise<FormData> {
    return new FormData();
  }
};

global.Request = global.Request || class MockRequest {
  public method: string;
  public url: string;
  public headers: Headers;
  public body: any;
  public bodyUsed: boolean;
  public cache: RequestCache;
  public credentials: RequestCredentials;
  public destination: RequestDestination;
  public integrity: string;
  public mode: RequestMode;
  public redirect: RequestRedirect;
  public referrer: string;
  public referrerPolicy: ReferrerPolicy;
  public signal: AbortSignal;

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    this.method = init?.method || 'GET';
    this.url = typeof input === 'string' ? input : input.toString();
    this.headers = new Headers(init?.headers);
    this.body = init?.body || null;
    this.bodyUsed = false;
    this.cache = init?.cache || 'default';
    this.credentials = init?.credentials || 'same-origin';
    this.destination = '' as RequestDestination;
    this.integrity = init?.integrity || '';
    this.mode = init?.mode || 'cors';
    this.redirect = init?.redirect || 'follow';
    this.referrer = init?.referrer || '';
    this.referrerPolicy = init?.referrerPolicy || '';
    this.signal = init?.signal || new AbortController().signal;
  }

  clone(): Request {
    return new (Request as any)(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
      cache: this.cache,
      credentials: this.credentials,
      integrity: this.integrity,
      mode: this.mode,
      redirect: this.redirect,
      referrer: this.referrer,
      referrerPolicy: this.referrerPolicy,
      signal: this.signal
    });
  }

  // Additional methods required by Request interface
  async text(): Promise<string> {
    return this.body?.toString() || '';
  }

  async json(): Promise<any> {
    const text = await this.text();
    return JSON.parse(text);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const text = await this.text();
    return new TextEncoder().encode(text).buffer;
  }

  async blob(): Promise<Blob> {
    return new Blob([await this.arrayBuffer()]);
  }

  async formData(): Promise<FormData> {
    return new FormData();
  }
};

global.Headers = global.Headers || class MockHeaders {
  private _headers: Map<string, string> = new Map();

  constructor(init?: HeadersInit) {
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => this.set(key, value));
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }

  append(name: string, value: string): void {
    const existing = this.get(name);
    this.set(name, existing ? `${existing}, ${value}` : value);
  }

  delete(name: string): void {
    this._headers.delete(name.toLowerCase());
  }

  get(name: string): string | null {
    return this._headers.get(name.toLowerCase()) || null;
  }

  has(name: string): boolean {
    return this._headers.has(name.toLowerCase());
  }

  set(name: string, value: string): void {
    this._headers.set(name.toLowerCase(), value);
  }

  forEach(callback: (value: string, key: string, parent: Headers) => void): void {
    this._headers.forEach((value, key) => callback(value, key, this));
  }

  *entries(): IterableIterator<[string, string]> {
    yield* this._headers.entries();
  }

  *keys(): IterableIterator<string> {
    yield* this._headers.keys();
  }

  *values(): IterableIterator<string> {
    yield* this._headers.values();
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
};

// Mock service worker APIs for testing
Object.defineProperty(global.navigator, 'serviceWorker', {
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

// Mock Cache API
Object.defineProperty(global, 'caches', {
  value: {
    open: jest.fn(() => Promise.resolve({
      match: jest.fn(() => Promise.resolve(undefined)),
      matchAll: jest.fn(() => Promise.resolve([])),
      add: jest.fn(() => Promise.resolve()),
      addAll: jest.fn(() => Promise.resolve()),
      put: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve(true)),
      keys: jest.fn(() => Promise.resolve([]))
    })),
    match: jest.fn(() => Promise.resolve(undefined)),
    has: jest.fn(() => Promise.resolve(false)),
    delete: jest.fn(() => Promise.resolve(false)),
    keys: jest.fn(() => Promise.resolve([]))
  },
  writable: true
});

// Mock fetch for service worker tests
global.fetch = jest.fn();

// Mock Workbox
jest.mock('workbox-window', () => ({
  Workbox: jest.fn().mockImplementation(() => ({
    register: jest.fn(() => Promise.resolve()),
    addEventListener: jest.fn(),
    messageSW: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    controlling: false,
    waiting: false
  }))
}));

// Setup console mocking for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
