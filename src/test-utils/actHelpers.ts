/**
 * Helpers to fix React act() warnings in tests
 */

import { act } from '@testing-library/react';

/**
 * Wrap async operations with act() to prevent warnings
 */
export const actAsync = async <T>(fn: () => Promise<T> | T): Promise<T> => {
  let result: T;
  await act(async () => {
    result = await fn();
  });
  return result!;
};

/**
 * Wait for all pending promises to resolve
 */
export const flushPromises = (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

/**
 * Advance timers and flush promises with act() wrapping
 */
export const advanceTimers = async (ms?: number): Promise<void> => {
  await act(async () => {
    if (ms !== undefined) {
      jest.advanceTimersByTime(ms);
    } else {
      jest.runAllTimers();
    }
    await flushPromises();
  });
};

/**
 * Run pending timers with act() wrapping
 */
export const runPendingTimers = async (): Promise<void> => {
  await act(async () => {
    jest.runOnlyPendingTimers();
    await flushPromises();
  });
};

/**
 * Helper to wait for next tick
 */
export const nextTick = (): Promise<void> => {
  return new Promise((resolve) => {
    process.nextTick(resolve);
  });
};

/**
 * Helper to wait for microtasks
 */
export const waitForMicrotasks = async (): Promise<void> => {
  await act(async () => {
    await nextTick();
    await flushPromises();
  });
};

/**
 * Helper to safely update state in tests
 */
export const updateState = async (updateFn: () => void): Promise<void> => {
  await act(async () => {
    updateFn();
    await flushPromises();
  });
};

/**
 * Helper to safely click elements
 */
export const safeClick = async (element: HTMLElement): Promise<void> => {
  await act(async () => {
    element.click();
    await flushPromises();
  });
};

/**
 * Helper to safely fire events
 */
export const safeFireEvent = async (
  element: HTMLElement,
  event: Event
): Promise<void> => {
  await act(async () => {
    element.dispatchEvent(event);
    await flushPromises();
  });
};

/**
 * Helper to wait for a condition with retries
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, interval));
    });
  }
};

/**
 * Helper to mock and wait for async functions
 */
export const mockAsyncFunction = <T>(
  fn: jest.Mock,
  returnValue: T,
  delay = 0
): void => {
  fn.mockImplementation(() => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(returnValue), delay);
    });
  });
};

/**
 * Helper to test async errors
 */
export const expectAsyncError = async (
  fn: () => Promise<any>,
  errorMessage?: string | RegExp
): Promise<void> => {
  let error: Error | undefined;
  
  try {
    await act(async () => {
      await fn();
    });
  } catch (e) {
    error = e as Error;
  }
  
  expect(error).toBeDefined();
  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(error?.message).toContain(errorMessage);
    } else {
      expect(error?.message).toMatch(errorMessage);
    }
  }
};

/**
 * Helper to clean up after async tests
 */
export const cleanupAsync = async (): Promise<void> => {
  await act(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    await flushPromises();
  });
};

export default {
  actAsync,
  flushPromises,
  advanceTimers,
  runPendingTimers,
  nextTick,
  waitForMicrotasks,
  updateState,
  safeClick,
  safeFireEvent,
  waitForCondition,
  mockAsyncFunction,
  expectAsyncError,
  cleanupAsync
};