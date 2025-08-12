import { mobileViewportManager } from './mobileViewportManager';

describe('MobileViewportManager', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalMatchMedia = window.matchMedia;

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(orientation: portrait)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn()
      }))
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.innerHeight = originalInnerHeight;
    window.matchMedia = originalMatchMedia;
  });

  describe('getState', () => {
    it('should return current viewport state', () => {
      const state = mobileViewportManager.getState();
      
      expect(state).toHaveProperty('width', 375);
      expect(state).toHaveProperty('height', 667);
      expect(state).toHaveProperty('isKeyboardOpen', false);
      expect(state).toHaveProperty('keyboardHeight', 0);
      expect(state).toHaveProperty('orientation', 'portrait');
    });

    it('should detect landscape orientation', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(orientation: landscape)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));

      const state = mobileViewportManager.getState();
      expect(state.orientation).toBe('landscape');
    });
  });

  describe('subscribe', () => {
    it('should add listener and return unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = mobileViewportManager.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
      
      // Trigger viewport change
      window.dispatchEvent(new Event('resize'));
      
      // Listener should be called with current state
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
          isKeyboardOpen: expect.any(Boolean),
          keyboardHeight: expect.any(Number),
          orientation: expect.any(String)
        })
      );
    });

    it('should unsubscribe listener when unsubscribe is called', () => {
      const listener = jest.fn();
      const unsubscribe = mobileViewportManager.subscribe(listener);

      unsubscribe();
      listener.mockClear();

      window.dispatchEvent(new Event('resize'));
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      mobileViewportManager.subscribe(listener1);
      mobileViewportManager.subscribe(listener2);

      window.dispatchEvent(new Event('resize'));

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('handleResize', () => {
    it('should detect viewport size changes', () => {
      const listener = jest.fn();
      mobileViewportManager.subscribe(listener);

      window.innerWidth = 414;
      window.innerHeight = 896;
      window.dispatchEvent(new Event('resize'));

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 414,
          height: 896
        })
      );
    });

    it('should detect keyboard opening (height decrease)', () => {
      const listener = jest.fn();
      mobileViewportManager.subscribe(listener);

      // Simulate keyboard opening
      window.innerHeight = 400;
      window.dispatchEvent(new Event('resize'));

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          height: 400,
          isKeyboardOpen: true,
          keyboardHeight: 267
        })
      );
    });

    it('should detect keyboard closing', () => {
      const listener = jest.fn();
      mobileViewportManager.subscribe(listener);

      // First open keyboard
      window.innerHeight = 400;
      window.dispatchEvent(new Event('resize'));

      // Then close keyboard
      window.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));

      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          height: 667,
          isKeyboardOpen: false,
          keyboardHeight: 0
        })
      );
    });
  });

  describe('isMobile', () => {
    it('should detect mobile viewport', () => {
      window.innerWidth = 375;
      expect(mobileViewportManager.isMobile()).toBe(true);
    });

    it('should detect tablet viewport', () => {
      window.innerWidth = 768;
      expect(mobileViewportManager.isMobile()).toBe(false);
    });

    it('should detect desktop viewport', () => {
      window.innerWidth = 1440;
      expect(mobileViewportManager.isMobile()).toBe(false);
    });
  });

  describe('getVisibleHeight', () => {
    it('should return full height when keyboard is closed', () => {
      expect(mobileViewportManager.getVisibleHeight()).toBe(667);
    });

    it('should return reduced height when keyboard is open', () => {
      window.innerHeight = 400;
      window.dispatchEvent(new Event('resize'));

      expect(mobileViewportManager.getVisibleHeight()).toBe(400);
    });
  });

  describe('orientation changes', () => {
    it('should detect orientation change', () => {
      const listener = jest.fn();
      mobileViewportManager.subscribe(listener);

      // Change to landscape
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(orientation: landscape)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn()
      }));

      window.dispatchEvent(new Event('orientationchange'));

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          orientation: 'landscape'
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle rapid resize events', () => {
      const listener = jest.fn();
      mobileViewportManager.subscribe(listener);

      for (let i = 0; i < 10; i++) {
        window.innerWidth = 300 + i * 10;
        window.dispatchEvent(new Event('resize'));
      }

      expect(listener).toHaveBeenCalledTimes(10);
    });

    it('should handle zero dimensions', () => {
      window.innerWidth = 0;
      window.innerHeight = 0;
      
      const state = mobileViewportManager.getState();
      expect(state.width).toBe(0);
      expect(state.height).toBe(0);
    });

    it('should handle extremely large dimensions', () => {
      window.innerWidth = 10000;
      window.innerHeight = 10000;
      
      const state = mobileViewportManager.getState();
      expect(state.width).toBe(10000);
      expect(state.height).toBe(10000);
    });
  });
});