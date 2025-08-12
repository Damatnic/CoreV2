import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useInterval } from './useInterval';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useInterval Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not start interval when delay is null', () => {
    const mockCallback = jest.fn();
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    
    renderHook(() => useInterval(mockCallback, null), { wrapper: Wrapper });
    
    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should start interval when delay is provided', () => {
    const mockCallback = jest.fn();
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    
    renderHook(() => useInterval(mockCallback, 1000), { wrapper: Wrapper });
    
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it('should call callback at specified intervals', () => {
    const mockCallback = jest.fn();
    
    renderHook(() => useInterval(mockCallback, 1000), { wrapper: Wrapper });
    
    expect(mockCallback).not.toHaveBeenCalled();
    
    // Advance time by 1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    
    // Advance time by another 1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(2);
    
    // Advance time by another 1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(3);
  });

  it('should update callback without restarting interval', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    
    const { rerender } = renderHook(
      ({ callback, delay }) => useInterval(callback, delay),
      {
        wrapper: Wrapper,
        initialProps: { callback: mockCallback1, delay: 1000 }
      }
    );
    
    // Advance time to trigger first callback
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockCallback1).toHaveBeenCalledTimes(1);
    expect(mockCallback2).not.toHaveBeenCalled();
    
    // Update callback
    rerender({ callback: mockCallback2, delay: 1000 });
    
    // Advance time to trigger updated callback
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockCallback1).toHaveBeenCalledTimes(1);
    expect(mockCallback2).toHaveBeenCalledTimes(1);
  });

  it('should clear interval when delay changes to null', () => {
    const mockCallback = jest.fn();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const { rerender } = renderHook(
      ({ delay }) => useInterval(mockCallback, delay),
      {
        wrapper: Wrapper,
        initialProps: { delay: 1000 }
      }
    );
    
    // Verify interval was started
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockCallback).toHaveBeenCalledTimes(1);
    
    // Change delay to null
    rerender({ delay: null });
    
    // Verify interval was cleared
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    // Advance time - callback should not be called again
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should restart interval when delay changes', () => {
    const mockCallback = jest.fn();
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const { rerender } = renderHook(
      ({ delay }) => useInterval(mockCallback, delay),
      {
        wrapper: Wrapper,
        initialProps: { delay: 1000 }
      }
    );
    
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    
    // Change delay
    rerender({ delay: 500 });
    
    // Should clear old interval and start new one
    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
    expect(setIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), 500);
  });

  it('should clear interval on unmount', () => {
    const mockCallback = jest.fn();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const { unmount } = renderHook(() => useInterval(mockCallback, 1000), { wrapper: Wrapper });
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should handle multiple intervals with different delays', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    
    renderHook(() => useInterval(mockCallback1, 500), { wrapper: Wrapper });
    renderHook(() => useInterval(mockCallback2, 1000), { wrapper: Wrapper });
    
    // Advance 500ms - only first callback should fire
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(mockCallback1).toHaveBeenCalledTimes(1);
    expect(mockCallback2).toHaveBeenCalledTimes(0);
    
    // Advance another 500ms (1000ms total) - both should have fired
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(mockCallback1).toHaveBeenCalledTimes(2);
    expect(mockCallback2).toHaveBeenCalledTimes(1);
  });

  it('should work with zero delay', () => {
    const mockCallback = jest.fn();
    
    renderHook(() => useInterval(mockCallback, 0), { wrapper: Wrapper });
    
    // With zero delay, callback should be called immediately and continuously
    act(() => {
      jest.advanceTimersByTime(0);
    });
    
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should handle callback that throws error', () => {
    const mockCallback = jest.fn(() => {
      throw new Error('Callback error');
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    renderHook(() => useInterval(mockCallback, 1000), { wrapper: Wrapper });
    
    // Should not throw when callback throws
    expect(() => {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }).not.toThrow();
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    
    consoleSpy.mockRestore();
  });

  it('should save most recent callback reference', () => {
    const logs: string[] = [];
    
    const { rerender } = renderHook(
      ({ message }) => {
        const callback = () => logs.push(message);
        useInterval(callback, 1000);
      },
      {
        wrapper: Wrapper,
        initialProps: { message: 'first' }
      }
    );
    
    // Update the message (which updates the callback)
    rerender({ message: 'second' });
    
    // Trigger the interval
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Should use the most recent callback
    expect(logs).toEqual(['second']);
    
    // Update message again
    rerender({ message: 'third' });
    
    // Trigger interval again
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(logs).toEqual(['second', 'third']);
  });

  it('should not call callback if it becomes null', () => {
    const mockCallback = jest.fn();
    
    const { rerender } = renderHook(
      ({ callback }) => useInterval(callback, 1000),
      {
        wrapper: Wrapper,
        initialProps: { callback: mockCallback }
      }
    );
    
    // Set callback to null
    rerender({ callback: null });
    
    // Trigger interval - should not call anything
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should handle very large delay values', () => {
    const mockCallback = jest.fn();
    const largeDelay = Number.MAX_SAFE_INTEGER;
    
    renderHook(() => useInterval(mockCallback, largeDelay), { wrapper: Wrapper });
    
    // Even advancing by a large amount shouldn't trigger with MAX_SAFE_INTEGER delay
    act(() => {
      jest.advanceTimersByTime(1000000);
    });
    
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should handle callback reference changing frequently', () => {
    let callCount = 0;
    
    const { rerender } = renderHook(
      ({ id }) => {
        const callback = () => { callCount += 1; };
        useInterval(callback, 100);
      },
      {
        wrapper: Wrapper,
        initialProps: { id: 1 }
      }
    );
    
    // Change the prop (and thus callback reference) multiple times
    for (let i = 2; i <= 10; i++) {
      rerender({ id: i });
    }
    
    // Trigger interval once
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should have called only once with the latest callback
    expect(callCount).toBe(1);
  });
});