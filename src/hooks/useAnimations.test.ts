import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  useScrollAnimation,
  useStaggeredAnimation,
  useRippleEffect,
  useDelayedHover,
  useLoadingState,
  useAnimationSequence,
  useFormAnimations,
  usePageTransition,
  useReducedMotion
} from './useAnimations';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();

beforeAll(() => {
  mockIntersectionObserver.mockImplementation((callback, options) => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: jest.fn(),
    callback,
    options
  }));
  
  global.IntersectionObserver = mockIntersectionObserver;
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
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
  writable: true
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useScrollAnimation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useScrollAnimation(), { wrapper: Wrapper });
    
    expect(result.current.isVisible).toBe(false);
    expect(result.current.elementRef).toBeDefined();
  });

  it('should set up IntersectionObserver with correct threshold', () => {
    const threshold = 0.5;
    renderHook(() => useScrollAnimation(threshold), { wrapper: Wrapper });
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold }
    );
  });

  it('should update visibility when intersection changes', () => {
    let callback: (entries: any[]) => void;
    mockIntersectionObserver.mockImplementation((cb) => {
      callback = cb;
      return { observe: mockObserve, unobserve: mockUnobserve };
    });

    const { result } = renderHook(() => useScrollAnimation(), { wrapper: Wrapper });
    
    // Mock element ref
    const mockElement = document.createElement('div');
    Object.defineProperty(result.current.elementRef, 'current', {
      writable: true,
      value: mockElement
    });

    // Simulate intersection
    act(() => {
      callback([{ isIntersecting: true }]);
    });

    expect(result.current.isVisible).toBe(true);

    // Simulate leaving intersection
    act(() => {
      callback([{ isIntersecting: false }]);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should clean up observer on unmount', () => {
    const { unmount } = renderHook(() => useScrollAnimation(), { wrapper: Wrapper });
    
    unmount();
    
    expect(mockUnobserve).toHaveBeenCalled();
  });
});

describe('useStaggeredAnimation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty animated items', () => {
    const { result } = renderHook(() => useStaggeredAnimation(5), { wrapper: Wrapper });
    
    expect(result.current.isItemAnimated(0)).toBe(false);
    expect(result.current.isItemAnimated(4)).toBe(false);
  });

  it('should trigger staggered animations with correct delays', async () => {
    const itemCount = 3;
    const baseDelay = 100;
    const { result } = renderHook(() => useStaggeredAnimation(itemCount, baseDelay), { wrapper: Wrapper });
    
    act(() => {
      result.current.triggerAnimation();
    });

    // Check that initially no items are animated
    expect(result.current.isItemAnimated(0)).toBe(false);

    // Advance time and check first item
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.isItemAnimated(0)).toBe(true);
    expect(result.current.isItemAnimated(1)).toBe(false);

    // Advance time and check second item
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.isItemAnimated(1)).toBe(true);
    expect(result.current.isItemAnimated(2)).toBe(false);

    // Advance time and check third item
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.isItemAnimated(2)).toBe(true);
  });

  it('should reset animations when triggered again', () => {
    const { result } = renderHook(() => useStaggeredAnimation(2), { wrapper: Wrapper });
    
    act(() => {
      result.current.triggerAnimation();
      jest.advanceTimersByTime(200);
    });
    
    expect(result.current.isItemAnimated(0)).toBe(true);
    
    // Trigger again should reset
    act(() => {
      result.current.triggerAnimation();
    });
    
    expect(result.current.isItemAnimated(0)).toBe(false);
  });
});

describe('useRippleEffect Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty ripples', () => {
    const { result } = renderHook(() => useRippleEffect(), { wrapper: Wrapper });
    
    expect(result.current.ripples).toEqual([]);
  });

  it('should create ripple on mouse event', () => {
    const { result } = renderHook(() => useRippleEffect(), { wrapper: Wrapper });
    
    const mockEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ left: 10, top: 20 })
      },
      clientX: 50,
      clientY: 80
    } as any;

    act(() => {
      result.current.createRipple(mockEvent);
    });

    expect(result.current.ripples).toHaveLength(1);
    expect(result.current.ripples[0]).toEqual({
      x: 40, // clientX - rect.left
      y: 60, // clientY - rect.top
      id: expect.any(Number)
    });
  });

  it('should remove ripple after timeout', () => {
    const { result } = renderHook(() => useRippleEffect(), { wrapper: Wrapper });
    
    const mockEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0 })
      },
      clientX: 0,
      clientY: 0
    } as any;

    act(() => {
      result.current.createRipple(mockEvent);
    });

    expect(result.current.ripples).toHaveLength(1);

    // Advance time to trigger removal
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(result.current.ripples).toHaveLength(0);
  });

  it('should handle multiple ripples', () => {
    const { result } = renderHook(() => useRippleEffect(), { wrapper: Wrapper });
    
    const mockEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0 })
      },
      clientX: 0,
      clientY: 0
    } as any;

    act(() => {
      result.current.createRipple(mockEvent);
      result.current.createRipple(mockEvent);
    });

    expect(result.current.ripples).toHaveLength(2);
  });
});

describe('useDelayedHover Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with not hovered state', () => {
    const { result } = renderHook(() => useDelayedHover(), { wrapper: Wrapper });
    
    expect(result.current.isHovered).toBe(false);
  });

  it('should handle mouse enter with delay', () => {
    const enterDelay = 200;
    const { result } = renderHook(() => useDelayedHover(enterDelay), { wrapper: Wrapper });
    
    act(() => {
      result.current.handleMouseEnter();
    });

    expect(result.current.isHovered).toBe(false);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current.isHovered).toBe(true);
  });

  it('should handle mouse leave with delay', () => {
    const leaveDelay = 300;
    const { result } = renderHook(() => useDelayedHover(0, leaveDelay), { wrapper: Wrapper });
    
    // First enter immediately
    act(() => {
      result.current.handleMouseEnter();
      jest.advanceTimersByTime(1);
    });

    expect(result.current.isHovered).toBe(true);

    // Then leave with delay
    act(() => {
      result.current.handleMouseLeave();
    });

    expect(result.current.isHovered).toBe(true);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isHovered).toBe(false);
  });

  it('should cancel previous timeout when new event occurs', () => {
    const { result } = renderHook(() => useDelayedHover(100, 100), { wrapper: Wrapper });
    
    act(() => {
      result.current.handleMouseEnter();
      jest.advanceTimersByTime(50);
      result.current.handleMouseLeave();
      jest.advanceTimersByTime(50);
    });

    expect(result.current.isHovered).toBe(false);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.isHovered).toBe(false);
  });

  it('should clean up timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useDelayedHover(100), { wrapper: Wrapper });
    
    act(() => {
      result.current.handleMouseEnter();
    });

    unmount();
    
    // Should not throw or cause issues
    act(() => {
      jest.advanceTimersByTime(100);
    });
  });
});

describe('useLoadingState Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with not loading state', () => {
    const { result } = renderHook(() => useLoadingState(), { wrapper: Wrapper });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.showLoading).toBe(false);
  });

  it('should start loading immediately', () => {
    const { result } = renderHook(() => useLoadingState(), { wrapper: Wrapper });
    
    act(() => {
      result.current.startLoading();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.showLoading).toBe(true);
  });

  it('should respect minimum duration', () => {
    const minDuration = 1000;
    const { result } = renderHook(() => useLoadingState(minDuration), { wrapper: Wrapper });
    
    act(() => {
      result.current.startLoading();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.showLoading).toBe(true);

    // Stop loading after short time
    act(() => {
      jest.advanceTimersByTime(200);
      result.current.stopLoading();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.showLoading).toBe(true); // Still showing due to min duration

    // Complete minimum duration
    act(() => {
      jest.advanceTimersByTime(800);
    });

    expect(result.current.showLoading).toBe(false);
  });

  it('should stop loading immediately if minimum duration exceeded', () => {
    const minDuration = 500;
    const { result } = renderHook(() => useLoadingState(minDuration), { wrapper: Wrapper });
    
    act(() => {
      result.current.startLoading();
      jest.advanceTimersByTime(600);
      result.current.stopLoading();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.showLoading).toBe(false);
  });
});

describe('useAnimationSequence Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAnimationSequence(), { wrapper: Wrapper });
    
    expect(result.current.currentStep).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });

  it('should execute animation sequence with delays', () => {
    const { result } = renderHook(() => useAnimationSequence(), { wrapper: Wrapper });
    
    const step1 = jest.fn();
    const step2 = jest.fn();
    const step3 = jest.fn();
    const steps = [step1, step2, step3];
    const delays = [100, 200, 300];

    act(() => {
      result.current.playSequence(steps, delays);
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentStep).toBe(0);

    // Execute first step immediately
    expect(step1).toHaveBeenCalled();
    expect(result.current.currentStep).toBe(1);

    // Execute second step after delay
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(step2).toHaveBeenCalled();
    expect(result.current.currentStep).toBe(2);

    // Execute third step after delay
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(step3).toHaveBeenCalled();
    expect(result.current.currentStep).toBe(3);

    // Complete sequence after final delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it('should not start sequence if already playing', () => {
    const { result } = renderHook(() => useAnimationSequence(), { wrapper: Wrapper });
    
    const step1 = jest.fn();
    const steps = [step1];
    const delays = [100];

    act(() => {
      result.current.playSequence(steps, delays);
      result.current.playSequence(steps, delays);
    });

    expect(step1).toHaveBeenCalledTimes(1);
  });

  it('should reset sequence', () => {
    const { result } = renderHook(() => useAnimationSequence(), { wrapper: Wrapper });
    
    const step1 = jest.fn();
    const steps = [step1];
    const delays = [100];

    act(() => {
      result.current.playSequence(steps, delays);
      result.current.resetSequence();
    });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });
});

describe('useFormAnimations Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty errors and success fields', () => {
    const { result } = renderHook(() => useFormAnimations(), { wrapper: Wrapper });
    
    expect(result.current.errors).toEqual({});
    expect(result.current.successFields.size).toBe(0);
  });

  it('should show and clear field error', () => {
    const { result } = renderHook(() => useFormAnimations(), { wrapper: Wrapper });
    
    act(() => {
      result.current.showFieldError('email', 'Invalid email');
    });

    expect(result.current.errors.email).toBe('Invalid email');

    // Auto-clear after 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('should show and clear field success', () => {
    const { result } = renderHook(() => useFormAnimations(), { wrapper: Wrapper });
    
    act(() => {
      result.current.showFieldSuccess('email');
    });

    expect(result.current.successFields.has('email')).toBe(true);

    // Auto-clear after 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.successFields.has('email')).toBe(false);
  });

  it('should clear field state manually', () => {
    const { result } = renderHook(() => useFormAnimations(), { wrapper: Wrapper });
    
    act(() => {
      result.current.showFieldError('email', 'Error');
      result.current.showFieldSuccess('email');
    });

    expect(result.current.errors.email).toBe('Error');
    expect(result.current.successFields.has('email')).toBe(true);

    act(() => {
      result.current.clearFieldState('email');
    });

    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.successFields.has('email')).toBe(false);
  });
});

describe('usePageTransition Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize in idle state', () => {
    const { result } = renderHook(() => usePageTransition(), { wrapper: Wrapper });
    
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.transitionStage).toBe('idle');
  });

  it('should execute transition sequence', () => {
    const { result } = renderHook(() => usePageTransition(), { wrapper: Wrapper });
    
    act(() => {
      result.current.startTransition();
    });

    expect(result.current.isTransitioning).toBe(true);
    expect(result.current.transitionStage).toBe('exit');

    // Move to enter stage
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current.transitionStage).toBe('enter');

    // Complete transition
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.transitionStage).toBe('idle');
  });
});

describe('useReducedMotion Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with current reduced motion preference', () => {
    const mockMatchMedia = jest.fn(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true
    });

    const { result } = renderHook(() => useReducedMotion(), { wrapper: Wrapper });
    
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(result.current).toBe(true);
  });

  it('should update when media query changes', () => {
    let changeHandler: (event: any) => void;
    const mockMatchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true
    });

    const { result } = renderHook(() => useReducedMotion(), { wrapper: Wrapper });
    
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      changeHandler({ matches: true });
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listener on unmount', () => {
    const mockRemoveEventListener = jest.fn();
    const mockMatchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: mockRemoveEventListener,
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true
    });

    const { unmount } = renderHook(() => useReducedMotion(), { wrapper: Wrapper });
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalled();
  });
});