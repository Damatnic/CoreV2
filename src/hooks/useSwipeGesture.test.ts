import React from 'react';
import { renderHook, act } from '../test-utils';
import { useSwipeGesture, useSwipeRef, usePullToRefresh } from './useSwipeGesture';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

// Mock touch events
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
  return new TouchEvent(type, {
    touches: touches.map(touch => ({
      ...touch,
      identifier: 0,
      target: document.body,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
      screenX: touch.clientX,
      screenY: touch.clientY,
      pageX: touch.clientX,
      pageY: touch.clientY
    })) as unknown,
    changedTouches: [] as unknown,
    targetTouches: [] as unknown
  });
};

describe('useSwipeGesture Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useSwipeGesture(), { wrapper: Wrapper });
    
    expect(result.current.isTracking).toBe(false);
    expect(typeof result.current.attachListeners).toBe('function');
    expect(typeof result.current.detachListeners).toBe('function');
  });

  it('should attach and detach listeners to an element', () => {
    const { result } = renderHook(() => useSwipeGesture(), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');

    result.current.attachListeners(element);

    expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });

    result.current.detachListeners(element);

    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
  });

  it('should use non-passive listeners when preventDefaultTouchMove is enabled', () => {
    const { result } = renderHook(() => useSwipeGesture({ preventDefaultTouchMove: true }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    const addEventListenerSpy = jest.spyOn(element, 'addEventListener');

    result.current.attachListeners(element);

    expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
  });

  it('should detect left swipe gesture', () => {
    const onSwipeLeft = jest.fn();
    const onSwipe = jest.fn();
    
    const { result } = renderHook(() => useSwipeGesture({ 
      onSwipeLeft, 
      onSwipe,
      threshold: 50,
      velocityThreshold: 0.1
    }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    result.current.attachListeners(element);

    // Simulate swipe left
    const touchStart = createTouchEvent('touchstart', [{ clientX: 200, clientY: 100 }]);
    const touchEnd = createTouchEvent('touchend', []);

    act(() => {
      element.dispatchEvent(touchStart);
      jest.setSystemTime(Date.now() + 100); // Add some time for velocity calculation
    });

    // Simulate touch move
    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchMove);
    });

    act(() => {
      element.dispatchEvent(touchEnd);
    });

    expect(onSwipeLeft).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: 'left',
        distance: 100,
        velocity: expect.any(Number),
        duration: expect.any(Number)
      })
    );

    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: 'left'
      })
    );
  });

  it('should detect right swipe gesture', () => {
    const onSwipeRight = jest.fn();
    
    const { result } = renderHook(() => useSwipeGesture({ 
      onSwipeRight,
      threshold: 50,
      velocityThreshold: 0.1
    }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    result.current.attachListeners(element);

    // Simulate swipe right
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
      jest.setSystemTime(Date.now() + 100);
    });

    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 200, clientY: 100 }]);
      element.dispatchEvent(touchMove);
    });

    act(() => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(onSwipeRight).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: 'right',
        distance: 100
      })
    );
  });

  it('should detect up swipe gesture', () => {
    const onSwipeUp = jest.fn();
    
    const { result } = renderHook(() => useSwipeGesture({ 
      onSwipeUp,
      threshold: 50,
      velocityThreshold: 0.1
    }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    result.current.attachListeners(element);

    // Simulate swipe up
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }]);
      element.dispatchEvent(touchStart);
      jest.setSystemTime(Date.now() + 100);
    });

    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchMove);
    });

    act(() => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(onSwipeUp).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: 'up',
        distance: 100
      })
    );
  });

  it('should detect down swipe gesture', () => {
    const onSwipeDown = jest.fn();
    
    const { result } = renderHook(() => useSwipeGesture({ 
      onSwipeDown,
      threshold: 50,
      velocityThreshold: 0.1
    }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    result.current.attachListeners(element);

    // Simulate swipe down
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
      jest.setSystemTime(Date.now() + 100);
    });

    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 200 }]);
      element.dispatchEvent(touchMove);
    });

    act(() => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(onSwipeDown).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: 'down',
        distance: 100
      })
    );
  });

  it('should not trigger swipe if distance is below threshold', () => {
    const onSwipe = jest.fn();
    
    const { result } = renderHook(() => useSwipeGesture({ 
      onSwipe,
      threshold: 100
    }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    result.current.attachListeners(element);

    // Simulate short swipe (below threshold)
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
      jest.setSystemTime(Date.now() + 100);
    });

    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 150, clientY: 100 }]);
      element.dispatchEvent(touchMove);
    });

    act(() => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('should not trigger swipe if velocity is below threshold', () => {
    const onSwipe = jest.fn();
    
    const { result } = renderHook(() => useSwipeGesture({ 
      onSwipe,
      threshold: 50,
      velocityThreshold: 1.0 // High velocity threshold
    }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    result.current.attachListeners(element);

    // Simulate slow swipe
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
      jest.setSystemTime(Date.now() + 1000); // Long duration = low velocity
    });

    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 200, clientY: 100 }]);
      element.dispatchEvent(touchMove);
    });

    act(() => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('should ignore multi-touch events', () => {
    const onSwipe = jest.fn();
    
    const { result } = renderHook(() => useSwipeGesture({ onSwipe }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    result.current.attachListeners(element);

    // Simulate multi-touch start
    act(() => {
      const touchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 }
      ]);
      element.dispatchEvent(touchStart);
    });

    expect(result.current.isTracking).toBe(false);
  });

  it('should handle touchend without touchmove', () => {
    const onSwipe = jest.fn();
    
    const { result } = renderHook(() => useSwipeGesture({ onSwipe }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    result.current.attachListeners(element);

    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
    });

    expect(result.current.isTracking).toBe(true);

    // End without move
    act(() => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(result.current.isTracking).toBe(false);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('should update tracking state correctly', () => {
    const { result } = renderHook(() => useSwipeGesture(), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    result.current.attachListeners(element);

    expect(result.current.isTracking).toBe(false);

    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
    });

    expect(result.current.isTracking).toBe(true);

    act(() => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(result.current.isTracking).toBe(false);
  });
});

describe('useSwipeRef Hook', () => {
  it('should return ref and tracking state', () => {
    const { result } = renderHook(() => useSwipeRef(), { wrapper: Wrapper });
    
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
    expect(result.current.isTracking).toBe(false);
  });

  it('should automatically attach listeners when ref is set', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipeRef({ onSwipe }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    const addEventListenerSpy = jest.spyOn(element, 'addEventListener');

    act(() => {
      (result.current.ref as unknown).current = element;
    });

    // Trigger useEffect by re-rendering
    act(() => {
      // Force re-render to trigger useEffect
    });

    expect(addEventListenerSpy).toHaveBeenCalled();
  });
});

describe('usePullToRefresh Hook', () => {
  beforeEach(() => {
    // Mock scrollY and scrollTop
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('should initialize with correct default state', () => {
    const mockOnRefresh = jest.fn();
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh), { wrapper: Wrapper });
    
    expect(result.current.isPulling).toBe(false);
    expect(result.current.pullDistance).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.pullProgress).toBe(0);
    expect(result.current.ref).toBeDefined();
  });

  it('should start pulling when swiping down from top', () => {
    const mockOnRefresh = jest.fn();
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh, { threshold: 80 }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollTop', { value: 0, writable: true });

    act(() => {
      (result.current.ref as unknown).current = element;
    });

    // Simulate touch start at top
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
    });

    // Simulate pulling down
    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
      element.dispatchEvent(touchMove);
    });

    expect(result.current.isPulling).toBe(true);
    expect(result.current.pullDistance).toBeGreaterThan(0);
    expect(result.current.pullProgress).toBeGreaterThan(0);
  });

  it('should not start pulling when not at top', () => {
    const mockOnRefresh = jest.fn();
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollTop', { value: 100, writable: true });

    act(() => {
      (result.current.ref as unknown).current = element;
    });

    // Simulate touch start when scrolled
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
    });

    expect(result.current.isPulling).toBe(false);
  });

  it('should trigger refresh when threshold is exceeded', async () => {
    const mockOnRefresh = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh, { threshold: 50, resistance: 1 }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollTop', { value: 0, writable: true });

    act(() => {
      (result.current.ref as unknown).current = element;
    });

    // Start pull
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
    });

    // Pull down beyond threshold
    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 160 }]);
      element.dispatchEvent(touchMove);
    });

    // Release
    await act(async () => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should not trigger refresh when below threshold', () => {
    const mockOnRefresh = jest.fn();
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh, { threshold: 80, resistance: 1 }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollTop', { value: 0, writable: true });

    act(() => {
      (result.current.ref as unknown).current = element;
    });

    // Start pull
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
    });

    // Pull down but not enough
    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 130 }]);
      element.dispatchEvent(touchMove);
    });

    // Release
    act(() => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(mockOnRefresh).not.toHaveBeenCalled();
    expect(result.current.isPulling).toBe(false);
    expect(result.current.pullDistance).toBe(0);
  });

  it('should handle refresh errors gracefully', async () => {
    const mockOnRefresh = jest.fn().mockRejectedValue(new Error('Refresh failed'));
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh, { threshold: 50, resistance: 1 }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollTop', { value: 0, writable: true });

    act(() => {
      (result.current.ref as unknown).current = element;
    });

    // Start and complete pull gesture
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
    });

    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 160 }]);
      element.dispatchEvent(touchMove);
    });

    await act(async () => {
      const touchEnd = createTouchEvent('touchend', []);
      element.dispatchEvent(touchEnd);
    });

    expect(mockOnRefresh).toHaveBeenCalled();
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.isPulling).toBe(false);
  });

  it('should not pull when disabled', () => {
    const mockOnRefresh = jest.fn();
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh, { enabled: false }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollTop', { value: 0, writable: true });

    act(() => {
      (result.current.ref as unknown).current = element;
    });

    // Try to start pull
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
    });

    expect(result.current.isPulling).toBe(false);
  });

  it('should apply resistance to pull distance', () => {
    const mockOnRefresh = jest.fn();
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh, { resistance: 0.5 }), { wrapper: Wrapper });
    
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollTop', { value: 0, writable: true });

    act(() => {
      (result.current.ref as unknown).current = element;
    });

    // Start pull
    act(() => {
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      element.dispatchEvent(touchStart);
    });

    // Pull down 100px
    act(() => {
      const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 200 }]);
      element.dispatchEvent(touchMove);
    });

    // With 0.5 resistance, 100px pull should result in 50px distance
    expect(result.current.pullDistance).toBe(50);
  });
});
