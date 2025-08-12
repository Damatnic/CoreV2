/**
 * Tests for Safe Location Hook
 */

import React, { useContext } from 'react';
import { renderHook } from '@testing-library/react';
import { useSafeLocation } from './useSafeLocation';

// Mock react-router-dom
const mockLocationContext = {
  location: {
    pathname: '/test-path',
    search: '?param=value',
    hash: '#section',
    state: { from: '/previous' },
    key: 'test-key-123'
  }
};

jest.mock('react-router-dom', () => ({
  UNSAFE_LocationContext: React.createContext(mockLocationContext)
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useSafeLocation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return location from router context when available', () => {
    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current).toEqual({
      pathname: '/test-path',
      search: '?param=value',
      hash: '#section',
      state: { from: '/previous' },
      key: 'test-key-123'
    });
  });

  it('should return fallback location when no router context exists', () => {
    // Mock useContext to return null (no context)
    jest.spyOn(React, 'useContext').mockReturnValue(null);

    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current).toEqual({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    });
  });

  it('should return fallback location when context has no location', () => {
    // Mock useContext to return context without location
    jest.spyOn(React, 'useContext').mockReturnValue({});

    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current).toEqual({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    });
  });

  it('should handle various location states', () => {
    const locationStates = [
      {
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'home'
      },
      {
        pathname: '/mood-tracker',
        search: '?date=2024-01-15',
        hash: '#current-mood',
        state: { mood: 'happy' },
        key: 'mood-key'
      },
      {
        pathname: '/crisis',
        search: '?urgent=true',
        hash: '#emergency',
        state: { emergency: true },
        key: 'crisis-key'
      },
      {
        pathname: '/community/support',
        search: '?group=anxiety&lang=en',
        hash: '#messages',
        state: { scrollTo: 'bottom' },
        key: 'community-key'
      }
    ];

    locationStates.forEach((locationState) => {
      jest.spyOn(React, 'useContext').mockReturnValue({
        location: locationState
      });

      const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

      expect(result.current).toEqual(locationState);
    });
  });

  it('should handle missing search parameter', () => {
    jest.spyOn(React, 'useContext').mockReturnValue({
      location: {
        pathname: '/test',
        hash: '#section',
        state: { test: true },
        key: 'test-key'
        // search is missing
      }
    });

    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current.pathname).toBe('/test');
    expect(result.current.hash).toBe('#section');
    expect(result.current.state).toEqual({ test: true });
    expect(result.current.key).toBe('test-key');
    expect(result.current.search).toBeUndefined();
  });

  it('should handle missing hash parameter', () => {
    jest.spyOn(React, 'useContext').mockReturnValue({
      location: {
        pathname: '/test',
        search: '?test=true',
        state: null,
        key: 'test-key'
        // hash is missing
      }
    });

    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current.pathname).toBe('/test');
    expect(result.current.search).toBe('?test=true');
    expect(result.current.state).toBeNull();
    expect(result.current.key).toBe('test-key');
    expect(result.current.hash).toBeUndefined();
  });

  it('should handle missing state parameter', () => {
    jest.spyOn(React, 'useContext').mockReturnValue({
      location: {
        pathname: '/test',
        search: '?test=true',
        hash: '#section',
        key: 'test-key'
        // state is missing
      }
    });

    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current.pathname).toBe('/test');
    expect(result.current.search).toBe('?test=true');
    expect(result.current.hash).toBe('#section');
    expect(result.current.key).toBe('test-key');
    expect(result.current.state).toBeUndefined();
  });

  it('should handle missing key parameter', () => {
    jest.spyOn(React, 'useContext').mockReturnValue({
      location: {
        pathname: '/test',
        search: '?test=true',
        hash: '#section',
        state: { test: true }
        // key is missing
      }
    });

    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current.pathname).toBe('/test');
    expect(result.current.search).toBe('?test=true');
    expect(result.current.hash).toBe('#section');
    expect(result.current.state).toEqual({ test: true });
    expect(result.current.key).toBeUndefined();
  });

  it('should work consistently across multiple renders', () => {
    const { result, rerender } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    const initialLocation = result.current;
    
    // Rerender multiple times
    rerender();
    rerender();
    rerender();

    expect(result.current).toEqual(initialLocation);
  });

  it('should handle context changes', () => {
    let contextValue = {
      location: {
        pathname: '/initial',
        search: '',
        hash: '',
        state: null,
        key: 'initial'
      }
    };

    jest.spyOn(React, 'useContext').mockImplementation(() => contextValue);

    const { result, rerender } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current.pathname).toBe('/initial');

    // Change context
    contextValue = {
      location: {
        pathname: '/updated',
        search: '?updated=true',
        hash: '#new',
        state: { updated: true },
        key: 'updated'
      }
    };

    rerender();

    expect(result.current.pathname).toBe('/updated');
    expect(result.current.search).toBe('?updated=true');
    expect(result.current.hash).toBe('#new');
    expect(result.current.state).toEqual({ updated: true });
    expect(result.current.key).toBe('updated');
  });

  it('should maintain type safety', () => {
    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    // Verify all expected properties exist and have correct types
    expect(typeof result.current.pathname).toBe('string');
    expect(typeof result.current.search).toBe('string');
    expect(typeof result.current.hash).toBe('string');
    expect(typeof result.current.key).toBe('string');
    // state can be any type, so we don't check its type
  });

  it('should handle edge case of undefined context', () => {
    jest.spyOn(React, 'useContext').mockReturnValue(undefined);

    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current).toEqual({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default'
    });
  });

  it('should handle complex state objects', () => {
    const complexState = {
      user: { id: 123, name: 'John Doe' },
      preferences: { theme: 'dark', language: 'en' },
      navigation: { from: '/previous', breadcrumb: ['home', 'profile'] },
      metadata: { timestamp: Date.now(), version: '1.0' }
    };

    jest.spyOn(React, 'useContext').mockReturnValue({
      location: {
        pathname: '/complex',
        search: '?complex=true&nested=value',
        hash: '#complex-section',
        state: complexState,
        key: 'complex-key'
      }
    });

    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current.state).toEqual(complexState);
    expect(result.current.pathname).toBe('/complex');
    expect(result.current.search).toBe('?complex=true&nested=value');
    expect(result.current.hash).toBe('#complex-section');
    expect(result.current.key).toBe('complex-key');
  });

  it('should handle empty string values correctly', () => {
    jest.spyOn(React, 'useContext').mockReturnValue({
      location: {
        pathname: '',
        search: '',
        hash: '',
        state: '',
        key: ''
      }
    });

    const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });

    expect(result.current.pathname).toBe('');
    expect(result.current.search).toBe('');
    expect(result.current.hash).toBe('');
    expect(result.current.state).toBe('');
    expect(result.current.key).toBe('');
  });

  it('should be usable outside Router context without errors', () => {
    // This simulates usage outside of Router context entirely
    jest.spyOn(React, 'useContext').mockReturnValue(null);

    expect(() => {
      const { result } = renderHook(() => useSafeLocation(), { wrapper: Wrapper });
      
      // Should not throw and should return fallback
      expect(result.current.pathname).toBe('/');
      expect(result.current.search).toBe('');
      expect(result.current.hash).toBe('');
      expect(result.current.state).toBeNull();
      expect(result.current.key).toBe('default');
    }).not.toThrow();
  });
});