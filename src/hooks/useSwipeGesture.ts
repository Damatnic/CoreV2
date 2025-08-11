import { useEffect, useRef, useState } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
  duration: number;
}

interface UseSwipeGestureOptions {
  threshold?: number; // Minimum distance for swipe
  velocityThreshold?: number; // Minimum velocity for swipe
  preventDefaultTouchMove?: boolean;
  onSwipeLeft?: (gesture: SwipeGesture) => void;
  onSwipeRight?: (gesture: SwipeGesture) => void;
  onSwipeUp?: (gesture: SwipeGesture) => void;
  onSwipeDown?: (gesture: SwipeGesture) => void;
  onSwipe?: (gesture: SwipeGesture) => void;
}

export const useSwipeGesture = (options: UseSwipeGestureOptions = {}) => {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefaultTouchMove = false,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
  } = options;

  const touchStartRef = useRef<TouchPosition | null>(null);
  const touchEndRef = useRef<TouchPosition | null>(null);
  const startTimeRef = useRef<number>(0);
  const [isTracking, setIsTracking] = useState(false);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    startTimeRef.current = Date.now();
    setIsTracking(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isTracking || !touchStartRef.current) return;
    
    if (preventDefaultTouchMove) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current || !isTracking) {
      setIsTracking(false);
      return;
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - startTimeRef.current;
    const velocity = distance / duration;

    // Reset tracking
    setIsTracking(false);
    touchStartRef.current = null;
    touchEndRef.current = null;

    // Check if gesture meets thresholds
    if (distance < threshold || velocity < velocityThreshold) {
      return;
    }

    // Determine direction
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    let direction: SwipeGesture['direction'] = null;
    
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const gesture: SwipeGesture = {
      direction,
      distance,
      velocity,
      duration,
    };

    // Call appropriate callbacks
    onSwipe?.(gesture);
    
    switch (direction) {
      case 'left':
        onSwipeLeft?.(gesture);
        break;
      case 'right':
        onSwipeRight?.(gesture);
        break;
      case 'up':
        onSwipeUp?.(gesture);
        break;
      case 'down':
        onSwipeDown?.(gesture);
        break;
    }
  };

  const attachListeners = (element: HTMLElement) => {
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchMove });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
  };

  const detachListeners = (element: HTMLElement) => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };

  return {
    attachListeners,
    detachListeners,
    isTracking,
  };
};

// React ref-based hook for easier integration
export const useSwipeRef = <T extends HTMLElement>(
  options: UseSwipeGestureOptions = {}
) => {
  const elementRef = useRef<T>(null);
  const { attachListeners, detachListeners, isTracking } = useSwipeGesture(options);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    attachListeners(element);

    return () => {
      detachListeners(element);
    };
  }, [attachListeners, detachListeners]);

  return {
    ref: elementRef,
    isTracking,
  };
};

// Hook for handling pull-to-refresh gesture
export const usePullToRefresh = (
  onRefresh: () => void | Promise<void>,
  options: {
    threshold?: number;
    resistance?: number;
    enabled?: boolean;
  } = {}
) => {
  const { threshold = 80, resistance = 0.5, enabled = true } = options;
  
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  const touchStartRef = useRef<{ x: number; y: number; scrollTop: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const scrollTop = element.scrollTop || window.scrollY;
      
      // Only start pull-to-refresh if we're at the top
      if (scrollTop <= 0) {
        touchStartRef.current = { 
          x: touch.clientX, 
          y: touch.clientY,
          scrollTop 
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || isRefreshing) return;
      
      const touch = e.touches[0];
      touchMoveRef.current = { x: touch.clientX, y: touch.clientY };
      
      const deltaY = touch.clientY - touchStartRef.current.y;
      const scrollTop = element.scrollTop || window.scrollY;
      
      // Only pull-to-refresh when at top and pulling down
      if (scrollTop <= 0 && deltaY > 0) {
        const distance = Math.min(deltaY * resistance, threshold * 1.5);
        setPullDistance(distance);
        setIsPulling(distance > 10);
        
        // Prevent default scrolling when pulling
        if (distance > 20) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!touchStartRef.current || !touchMoveRef.current || isRefreshing) {
        resetPull();
        return;
      }

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          resetPull();
        }
      } else {
        resetPull();
      }
    };

    const resetPull = () => {
      setPullDistance(0);
      setIsPulling(false);
      touchStartRef.current = null;
      touchMoveRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', resetPull, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', resetPull);
    };
  }, [enabled, threshold, resistance, onRefresh, pullDistance, isRefreshing]);

  return {
    ref: elementRef,
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min(pullDistance / threshold, 1),
  };
};
