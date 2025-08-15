import React from 'react';
import { renderHook, act, waitFor } from '../test-utils';
import {
  useAccessibilityAudit,
  useAccessibilityMonitoring,
  useAccessibilityAlerts,
  useAccessibilityKeyboardSupport
} from './useAccessibilityMonitoring';
import {
  accessibilityAuditSystem,
  WCAGLevel,
  AccessibilityIssueType
} from '../services/accessibilityAuditSystem';

jest.mock('../services/accessibilityAuditSystem', () => ({
  accessibilityAuditSystem: {
    runAccessibilityAudit: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    setupAlerts: jest.fn(),
    teardownAlerts: jest.fn(),
    setupKeyboardSupport: jest.fn(),
    teardownKeyboardSupport: jest.fn()
  },
  WCAGLevel: {
    A: 'A',
    AA: 'AA',
    AAA: 'AAA'
  },
  AccessibilityIssueType: {
    COLOR_CONTRAST: 'COLOR_CONTRAST',
    MISSING_ALT_TEXT: 'MISSING_ALT_TEXT',
    KEYBOARD_NAVIGATION: 'KEYBOARD_NAVIGATION',
    ARIA_LABELS: 'ARIA_LABELS',
    FOCUS_MANAGEMENT: 'FOCUS_MANAGEMENT',
    SCREEN_READER: 'SCREEN_READER',
    SEMANTIC_HTML: 'SEMANTIC_HTML',
    FORM_LABELS: 'FORM_LABELS'
  }
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useAccessibilityAudit Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null result', () => {
    (accessibilityAuditSystem.runAccessibilityAudit as jest.Mock).mockResolvedValue({
      passed: true,
      score: 100,
      issues: [],
      wcagLevel: WCAGLevel.AA,
      timestamp: new Date().toISOString()
    });

    const { result } = renderHook(() => useAccessibilityAudit(), { wrapper: Wrapper });
    
    expect(result.current.auditResult).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should run audit on mount', async () => {
    const mockResult = {
      passed: true,
      score: 95,
      issues: [],
      wcagLevel: WCAGLevel.AA,
      timestamp: new Date().toISOString()
    };

    (accessibilityAuditSystem.runAccessibilityAudit as jest.Mock).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useAccessibilityAudit(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.auditResult).toEqual(mockResult);
      expect(result.current.isLoading).toBe(false);
    });

    expect(accessibilityAuditSystem.runAccessibilityAudit).toHaveBeenCalledWith(WCAGLevel.AA);
  });

  it('should handle custom WCAG level', async () => {
    const mockResult = {
      passed: true,
      score: 98,
      issues: [],
      wcagLevel: WCAGLevel.AAA,
      timestamp: new Date().toISOString()
    };

    (accessibilityAuditSystem.runAccessibilityAudit as jest.Mock).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useAccessibilityAudit(WCAGLevel.AAA), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.auditResult).toEqual(mockResult);
    });

    expect(accessibilityAuditSystem.runAccessibilityAudit).toHaveBeenCalledWith(WCAGLevel.AAA);
  });

  it('should handle audit errors', async () => {
    const mockError = new Error('Audit failed');
    (accessibilityAuditSystem.runAccessibilityAudit as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAccessibilityAudit(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe('Audit failed');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.auditResult).toBeNull();
    });
  });

  it('should allow manual audit trigger', async () => {
    const mockResult = {
      passed: false,
      score: 75,
      issues: [
        {
          type: AccessibilityIssueType.COLOR_CONTRAST,
          severity: 'high',
          message: 'Insufficient color contrast',
          element: 'button.primary'
        }
      ],
      wcagLevel: WCAGLevel.AA,
      timestamp: new Date().toISOString()
    };

    (accessibilityAuditSystem.runAccessibilityAudit as jest.Mock).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useAccessibilityAudit(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    jest.clearAllMocks();

    await act(async () => {
      await result.current.runAudit();
    });

    expect(accessibilityAuditSystem.runAccessibilityAudit).toHaveBeenCalledTimes(1);
    expect(result.current.auditResult).toEqual(mockResult);
  });
});

describe('useAccessibilityMonitoring Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start monitoring on mount', () => {
    const mockCallback = jest.fn();
    
    renderHook(() => useAccessibilityMonitoring(true, mockCallback), { wrapper: Wrapper });

    expect(accessibilityAuditSystem.startMonitoring).toHaveBeenCalledWith(mockCallback);
  });

  it('should not monitor when disabled', () => {
    const mockCallback = jest.fn();
    
    renderHook(() => useAccessibilityMonitoring(false, mockCallback), { wrapper: Wrapper });

    expect(accessibilityAuditSystem.startMonitoring).not.toHaveBeenCalled();
  });

  it('should stop monitoring on unmount', () => {
    const mockCallback = jest.fn();
    
    const { unmount } = renderHook(() => useAccessibilityMonitoring(true, mockCallback), { wrapper: Wrapper });

    unmount();

    expect(accessibilityAuditSystem.stopMonitoring).toHaveBeenCalled();
  });

  it('should handle monitoring state changes', () => {
    const mockCallback = jest.fn();
    
    const { rerender } = renderHook(
      ({ enabled }) => useAccessibilityMonitoring(enabled, mockCallback),
      { 
        wrapper: Wrapper,
        initialProps: { enabled: false }
      }
    );

    expect(accessibilityAuditSystem.startMonitoring).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(accessibilityAuditSystem.startMonitoring).toHaveBeenCalledWith(mockCallback);

    rerender({ enabled: false });

    expect(accessibilityAuditSystem.stopMonitoring).toHaveBeenCalled();
  });

  it('should update callback when it changes', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    
    const { rerender } = renderHook(
      ({ callback }) => useAccessibilityMonitoring(true, callback),
      { 
        wrapper: Wrapper,
        initialProps: { callback: mockCallback1 }
      }
    );

    expect(accessibilityAuditSystem.startMonitoring).toHaveBeenCalledWith(mockCallback1);

    jest.clearAllMocks();

    rerender({ callback: mockCallback2 });

    expect(accessibilityAuditSystem.stopMonitoring).toHaveBeenCalled();
    expect(accessibilityAuditSystem.startMonitoring).toHaveBeenCalledWith(mockCallback2);
  });
});

describe('useAccessibilityAlerts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should setup alerts with default threshold', () => {
    renderHook(() => useAccessibilityAlerts(), { wrapper: Wrapper });

    expect(accessibilityAuditSystem.setupAlerts).toHaveBeenCalledWith(80);
  });

  it('should setup alerts with custom threshold', () => {
    renderHook(() => useAccessibilityAlerts(90), { wrapper: Wrapper });

    expect(accessibilityAuditSystem.setupAlerts).toHaveBeenCalledWith(90);
  });

  it('should teardown alerts on unmount', () => {
    const { unmount } = renderHook(() => useAccessibilityAlerts(), { wrapper: Wrapper });

    unmount();

    expect(accessibilityAuditSystem.teardownAlerts).toHaveBeenCalled();
  });

  it('should handle threshold changes', () => {
    const { rerender } = renderHook(
      ({ threshold }) => useAccessibilityAlerts(threshold),
      { 
        wrapper: Wrapper,
        initialProps: { threshold: 80 }
      }
    );

    expect(accessibilityAuditSystem.setupAlerts).toHaveBeenCalledWith(80);

    jest.clearAllMocks();

    rerender({ threshold: 95 });

    expect(accessibilityAuditSystem.teardownAlerts).toHaveBeenCalled();
    expect(accessibilityAuditSystem.setupAlerts).toHaveBeenCalledWith(95);
  });

  it('should not setup alerts when disabled', () => {
    renderHook(() => useAccessibilityAlerts(80, false), { wrapper: Wrapper });

    expect(accessibilityAuditSystem.setupAlerts).not.toHaveBeenCalled();
  });

  it('should handle enable/disable state changes', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useAccessibilityAlerts(80, enabled),
      { 
        wrapper: Wrapper,
        initialProps: { enabled: false }
      }
    );

    expect(accessibilityAuditSystem.setupAlerts).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(accessibilityAuditSystem.setupAlerts).toHaveBeenCalledWith(80);

    jest.clearAllMocks();

    rerender({ enabled: false });

    expect(accessibilityAuditSystem.teardownAlerts).toHaveBeenCalled();
  });
});

describe('useAccessibilityKeyboardSupport Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should setup keyboard support on mount', () => {
    renderHook(() => useAccessibilityKeyboardSupport(), { wrapper: Wrapper });

    expect(accessibilityAuditSystem.setupKeyboardSupport).toHaveBeenCalled();
  });

  it('should teardown keyboard support on unmount', () => {
    const { unmount } = renderHook(() => useAccessibilityKeyboardSupport(), { wrapper: Wrapper });

    unmount();

    expect(accessibilityAuditSystem.teardownKeyboardSupport).toHaveBeenCalled();
  });

  it('should not setup when disabled', () => {
    renderHook(() => useAccessibilityKeyboardSupport(false), { wrapper: Wrapper });

    expect(accessibilityAuditSystem.setupKeyboardSupport).not.toHaveBeenCalled();
  });

  it('should handle enable/disable state changes', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useAccessibilityKeyboardSupport(enabled),
      { 
        wrapper: Wrapper,
        initialProps: { enabled: false }
      }
    );

    expect(accessibilityAuditSystem.setupKeyboardSupport).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(accessibilityAuditSystem.setupKeyboardSupport).toHaveBeenCalled();

    jest.clearAllMocks();

    rerender({ enabled: false });

    expect(accessibilityAuditSystem.teardownKeyboardSupport).toHaveBeenCalled();
  });

  it('should handle multiple enable/disable cycles', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useAccessibilityKeyboardSupport(enabled),
      { 
        wrapper: Wrapper,
        initialProps: { enabled: true }
      }
    );

    expect(accessibilityAuditSystem.setupKeyboardSupport).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    expect(accessibilityAuditSystem.teardownKeyboardSupport).toHaveBeenCalledTimes(1);

    rerender({ enabled: true });
    expect(accessibilityAuditSystem.setupKeyboardSupport).toHaveBeenCalledTimes(2);

    rerender({ enabled: false });
    expect(accessibilityAuditSystem.teardownKeyboardSupport).toHaveBeenCalledTimes(2);
  });
});