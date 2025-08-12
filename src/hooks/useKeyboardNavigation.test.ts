/**
 * Tests for Keyboard Navigation Hook
 */

import React, { useRef } from 'react';
import { renderHook, act } from '@testing-library/react';
import { 
  useKeyboardNavigation, 
  useFocusTrap, 
  useSkipNavigation, 
  useRovingTabindex,
  useGlobalKeyboardShortcuts,
  announceKeyboardShortcut
} from './useKeyboardNavigation';

// Mock DOM methods
const mockFocus = jest.fn();
const mockClick = jest.fn();
const mockScrollIntoView = jest.fn();

const createMockElement = (tagName: string, props: any = {}) => ({
  tagName: tagName.toUpperCase(),
  focus: mockFocus,
  click: mockClick,
  scrollIntoView: mockScrollIntoView,
  offsetParent: {},
  disabled: props.disabled || false,
  getAttribute: jest.fn((attr: string) => props[attr]),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  contains: jest.fn((node: any) => true),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  ...props
});

const mockContainer = {
  querySelectorAll: jest.fn(),
  querySelector: jest.fn(),
  contains: jest.fn((node: any) => true)
};

// Mock document methods
Object.defineProperty(document, 'activeElement', {
  writable: true,
  value: null
});

Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'removeEventListener', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName: string) => createMockElement(tagName)),
  writable: true
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  writable: true
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useKeyboardNavigation Hook', () => {
  let containerRef: React.RefObject<HTMLElement>;

  beforeEach(() => {
    jest.clearAllMocks();
    containerRef = { current: mockContainer as any };
    
    // Reset active element
    (document as any).activeElement = null;
    
    // Default focusable elements
    mockContainer.querySelectorAll.mockReturnValue([
      createMockElement('button', { textContent: 'Button 1' }),
      createMockElement('button', { textContent: 'Button 2' }),
      createMockElement('a', { href: '#', textContent: 'Link' }),
      createMockElement('input', { type: 'text' })
    ]);
  });

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    expect(typeof result.current.focusFirst).toBe('function');
    expect(typeof result.current.focusLast).toBe('function');
    expect(typeof result.current.focusNext).toBe('function');
    expect(typeof result.current.focusPrevious).toBe('function');
    expect(typeof result.current.getFocusableElements).toBe('function');
    expect(typeof result.current.trapFocusInContainer).toBe('function');
  });

  it('should get focusable elements correctly', () => {
    const { result } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    const elements = result.current.getFocusableElements();
    
    expect(mockContainer.querySelectorAll).toHaveBeenCalledWith(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(elements).toHaveLength(4);
  });

  it('should filter out disabled elements', () => {
    mockContainer.querySelectorAll.mockReturnValue([
      createMockElement('button', { disabled: false }),
      createMockElement('button', { disabled: true }),
      createMockElement('input', { disabled: false }),
      createMockElement('input', { disabled: true })
    ]);

    const { result } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    const elements = result.current.getFocusableElements();
    expect(elements).toHaveLength(2); // Only non-disabled elements
  });

  it('should focus first element', () => {
    const { result } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    act(() => {
      result.current.focusFirst();
    });

    const elements = mockContainer.querySelectorAll();
    expect(elements[0].focus).toHaveBeenCalled();
  });

  it('should focus last element', () => {
    const { result } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    act(() => {
      result.current.focusLast();
    });

    const elements = mockContainer.querySelectorAll();
    expect(elements[elements.length - 1].focus).toHaveBeenCalled();
  });

  it('should focus next element with wrapping', () => {
    const elements = mockContainer.querySelectorAll();
    (document as any).activeElement = elements[0];

    const { result } = renderHook(() => useKeyboardNavigation(containerRef, { wrap: true }), { wrapper: Wrapper });

    act(() => {
      result.current.focusNext();
    });

    expect(elements[1].focus).toHaveBeenCalled();
  });

  it('should wrap to first element when at end', () => {
    const elements = mockContainer.querySelectorAll();
    (document as any).activeElement = elements[elements.length - 1];

    const { result } = renderHook(() => useKeyboardNavigation(containerRef, { wrap: true }), { wrapper: Wrapper });

    act(() => {
      result.current.focusNext();
    });

    expect(elements[0].focus).toHaveBeenCalled();
  });

  it('should not wrap when disabled', () => {
    const elements = mockContainer.querySelectorAll();
    (document as any).activeElement = elements[elements.length - 1];

    const { result } = renderHook(() => useKeyboardNavigation(containerRef, { wrap: false }), { wrapper: Wrapper });

    act(() => {
      result.current.focusNext();
    });

    // Should stay on the last element
    expect(elements[elements.length - 1].focus).toHaveBeenCalled();
  });

  it('should focus previous element', () => {
    const elements = mockContainer.querySelectorAll();
    (document as any).activeElement = elements[1];

    const { result } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    act(() => {
      result.current.focusPrevious();
    });

    expect(elements[0].focus).toHaveBeenCalled();
  });

  it('should set up keyboard event listeners', () => {
    renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should handle arrow key navigation', () => {
    const elements = mockContainer.querySelectorAll();
    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
      target: elements[0]
    };

    mockContainer.contains.mockReturnValue(true);
    (document as any).activeElement = elements[0];

    const { result } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    // Simulate keydown event
    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    act(() => {
      keydownListener(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(elements[1].focus).toHaveBeenCalled();
  });

  it('should handle home and end keys', () => {
    const elements = mockContainer.querySelectorAll();
    const mockHomeEvent = {
      key: 'Home',
      preventDefault: jest.fn(),
      target: elements[1]
    };

    mockContainer.contains.mockReturnValue(true);
    (document as any).activeElement = elements[1];

    const { result } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    act(() => {
      keydownListener(mockHomeEvent);
    });

    expect(mockHomeEvent.preventDefault).toHaveBeenCalled();
    expect(elements[0].focus).toHaveBeenCalled();
  });

  it('should handle Enter and Space key activation', () => {
    const elements = mockContainer.querySelectorAll();
    const mockEnterEvent = {
      key: 'Enter',
      preventDefault: jest.fn(),
      target: elements[0]
    };

    mockContainer.contains.mockReturnValue(true);
    (document as any).activeElement = elements[0];

    renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    act(() => {
      keydownListener(mockEnterEvent);
    });

    expect(mockEnterEvent.preventDefault).toHaveBeenCalled();
    expect(elements[0].click).toHaveBeenCalled();
  });

  it('should handle Escape key', () => {
    const onEscape = jest.fn();
    const mockEscapeEvent = {
      key: 'Escape',
      preventDefault: jest.fn(),
      target: mockContainer.querySelectorAll()[0]
    };

    mockContainer.contains.mockReturnValue(true);

    renderHook(() => useKeyboardNavigation(containerRef, { onEscape }), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    act(() => {
      keydownListener(mockEscapeEvent);
    });

    expect(mockEscapeEvent.preventDefault).toHaveBeenCalled();
    expect(onEscape).toHaveBeenCalled();
  });

  it('should call navigation callback', () => {
    const onNavigate = jest.fn();
    const elements = mockContainer.querySelectorAll();

    const { result } = renderHook(() => useKeyboardNavigation(containerRef, { onNavigate }), { wrapper: Wrapper });

    act(() => {
      result.current.focusFirst();
    });

    expect(onNavigate).toHaveBeenCalledWith(0, elements[0]);
  });

  it('should call activation callback', () => {
    const onActivate = jest.fn();
    const elements = mockContainer.querySelectorAll();
    const mockEvent = {
      key: 'Enter',
      preventDefault: jest.fn(),
      target: elements[0]
    };

    mockContainer.contains.mockReturnValue(true);
    (document as any).activeElement = elements[0];

    renderHook(() => useKeyboardNavigation(containerRef, { onActivate }), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    act(() => {
      keydownListener(mockEvent);
    });

    expect(onActivate).toHaveBeenCalledWith(0, elements[0]);
  });

  it('should auto-focus first element when enabled', () => {
    const elements = mockContainer.querySelectorAll();

    renderHook(() => useKeyboardNavigation(containerRef, { autoFocus: true }), { wrapper: Wrapper });

    expect(elements[0].focus).toHaveBeenCalled();
  });

  it('should respect orientation settings', () => {
    const elements = mockContainer.querySelectorAll();
    const mockEvent = {
      key: 'ArrowRight',
      preventDefault: jest.fn(),
      target: elements[0]
    };

    mockContainer.contains.mockReturnValue(true);
    (document as any).activeElement = elements[0];

    renderHook(() => useKeyboardNavigation(containerRef, { orientation: 'horizontal' }), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    act(() => {
      keydownListener(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(elements[1].focus).toHaveBeenCalled();
  });

  it('should ignore events outside container', () => {
    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
      target: createMockElement('button')
    };

    mockContainer.contains.mockReturnValue(false);

    renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    act(() => {
      keydownListener(mockEvent);
    });

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should handle empty container', () => {
    mockContainer.querySelectorAll.mockReturnValue([]);

    const { result } = renderHook(() => useKeyboardNavigation(containerRef), { wrapper: Wrapper });

    expect(() => {
      act(() => {
        result.current.focusFirst();
      });
    }).not.toThrow();
  });
});

describe('useFocusTrap Hook', () => {
  let containerRef: React.RefObject<HTMLElement>;

  beforeEach(() => {
    jest.clearAllMocks();
    containerRef = { current: mockContainer as any };
    
    mockContainer.querySelectorAll.mockReturnValue([
      createMockElement('button'),
      createMockElement('input'),
      createMockElement('a', { href: '#' })
    ]);
  });

  it('should initialize focus trap when active', () => {
    const elements = mockContainer.querySelectorAll();
    
    renderHook(() => useFocusTrap(containerRef, true), { wrapper: Wrapper });

    expect(elements[0].focus).toHaveBeenCalled();
    expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should not initialize when inactive', () => {
    const elements = mockContainer.querySelectorAll();
    
    renderHook(() => useFocusTrap(containerRef, false), { wrapper: Wrapper });

    expect(elements[0].focus).not.toHaveBeenCalled();
    expect(document.addEventListener).not.toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should handle Tab key cycling', () => {
    const elements = mockContainer.querySelectorAll();
    const mockTabEvent = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: jest.fn()
    };

    (document as any).activeElement = elements[elements.length - 1]; // Last element

    renderHook(() => useFocusTrap(containerRef, true), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    act(() => {
      keydownListener(mockTabEvent);
    });

    expect(mockTabEvent.preventDefault).toHaveBeenCalled();
    expect(elements[0].focus).toHaveBeenCalled(); // Should cycle to first
  });

  it('should handle Shift+Tab key cycling', () => {
    const elements = mockContainer.querySelectorAll();
    const mockShiftTabEvent = {
      key: 'Tab',
      shiftKey: true,
      preventDefault: jest.fn()
    };

    (document as any).activeElement = elements[0]; // First element

    renderHook(() => useFocusTrap(containerRef, true), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    act(() => {
      keydownListener(mockShiftTabEvent);
    });

    expect(mockShiftTabEvent.preventDefault).toHaveBeenCalled();
    expect(elements[elements.length - 1].focus).toHaveBeenCalled(); // Should cycle to last
  });

  it('should restore focus on unmount', () => {
    const previousElement = createMockElement('button');
    (document as any).activeElement = previousElement;

    const { unmount } = renderHook(() => useFocusTrap(containerRef, true, { restoreFocus: true }), { wrapper: Wrapper });

    unmount();

    expect(previousElement.focus).toHaveBeenCalled();
  });

  it('should not restore focus when disabled', () => {
    const previousElement = createMockElement('button');
    (document as any).activeElement = previousElement;

    const { unmount } = renderHook(() => useFocusTrap(containerRef, true, { restoreFocus: false }), { wrapper: Wrapper });

    unmount();

    // Should only be called once during initialization
    expect(previousElement.focus).toHaveBeenCalledTimes(0);
  });

  it('should handle fallback focus when no focusable elements', () => {
    mockContainer.querySelectorAll.mockReturnValue([]);
    mockContainer.querySelector.mockReturnValue(createMockElement('div'));

    renderHook(() => useFocusTrap(containerRef, true, { fallbackFocus: 'div' }), { wrapper: Wrapper });

    expect(mockContainer.querySelector).toHaveBeenCalledWith('div');
  });

  it('should provide focus control functions', () => {
    const { result } = renderHook(() => useFocusTrap(containerRef, true), { wrapper: Wrapper });

    expect(typeof result.current.focusFirst).toBe('function');
    expect(typeof result.current.focusLast).toBe('function');

    const elements = mockContainer.querySelectorAll();

    act(() => {
      result.current.focusFirst();
    });

    expect(elements[0].focus).toHaveBeenCalled();

    act(() => {
      result.current.focusLast();
    });

    expect(elements[elements.length - 1].focus).toHaveBeenCalled();
  });
});

describe('useSkipNavigation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip to main content', () => {
    const mainElement = createMockElement('main');
    document.querySelector = jest.fn().mockReturnValue(mainElement);

    const { result } = renderHook(() => useSkipNavigation(), { wrapper: Wrapper });

    act(() => {
      result.current.skipToMain();
    });

    expect(document.querySelector).toHaveBeenCalledWith('main, [role="main"], #main-content');
    expect(mainElement.focus).toHaveBeenCalled();
    expect(mainElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    });
  });

  it('should skip to navigation', () => {
    const navElement = createMockElement('nav');
    const linkElement = createMockElement('a', { href: '#' });
    
    navElement.querySelector = jest.fn().mockReturnValue(linkElement);
    document.querySelector = jest.fn().mockReturnValue(navElement);

    const { result } = renderHook(() => useSkipNavigation(), { wrapper: Wrapper });

    act(() => {
      result.current.skipToNavigation();
    });

    expect(document.querySelector).toHaveBeenCalledWith('nav, [role="navigation"]');
    expect(navElement.querySelector).toHaveBeenCalledWith('a, button');
    expect(linkElement.focus).toHaveBeenCalled();
    expect(linkElement.scrollIntoView).toHaveBeenCalled();
  });

  it('should announce screen reader messages', () => {
    const mainElement = createMockElement('main');
    document.querySelector = jest.fn().mockReturnValue(mainElement);

    const { result } = renderHook(() => useSkipNavigation(), { wrapper: Wrapper });

    act(() => {
      result.current.skipToMain();
    });

    expect(document.body.appendChild).toHaveBeenCalled();
    
    // Verify announcement cleanup after timeout
    jest.runOnlyPendingTimers();
    expect(document.body.removeChild).toHaveBeenCalled();
  });
});

describe('useRovingTabindex Hook', () => {
  let containerRef: React.RefObject<HTMLElement>;

  beforeEach(() => {
    jest.clearAllMocks();
    containerRef = { current: mockContainer as any };
    
    mockContainer.querySelectorAll.mockReturnValue([
      createMockElement('button', { setAttribute: jest.fn() }),
      createMockElement('button', { setAttribute: jest.fn() }),
      createMockElement('button', { setAttribute: jest.fn() })
    ]);
  });

  it('should set initial tabindex values', () => {
    const elements = mockContainer.querySelectorAll();

    renderHook(() => useRovingTabindex(containerRef), { wrapper: Wrapper });

    expect(elements[0].setAttribute).toHaveBeenCalledWith('tabindex', '0');
    expect(elements[1].setAttribute).toHaveBeenCalledWith('tabindex', '-1');
    expect(elements[2].setAttribute).toHaveBeenCalledWith('tabindex', '-1');
  });

  it('should provide setActiveIndex function', () => {
    const elements = mockContainer.querySelectorAll();

    const { result } = renderHook(() => useRovingTabindex(containerRef), { wrapper: Wrapper });

    act(() => {
      result.current.setActiveIndex(1);
    });

    expect(elements[1].focus).toHaveBeenCalled();
  });

  it('should provide getCurrentIndex function', () => {
    const { result } = renderHook(() => useRovingTabindex(containerRef, { defaultIndex: 2 }), { wrapper: Wrapper });

    expect(result.current.getCurrentIndex()).toBe(2);
  });

  it('should handle wrapping when enabled', () => {
    const elements = mockContainer.querySelectorAll();

    const { result } = renderHook(() => useRovingTabindex(containerRef, { wrap: true }), { wrapper: Wrapper });

    // Try to set index beyond array length
    act(() => {
      result.current.setActiveIndex(5);
    });

    expect(elements[2].focus).toHaveBeenCalled(); // Should wrap to index 2 (5 % 3)
  });

  it('should not wrap when disabled', () => {
    const elements = mockContainer.querySelectorAll();

    const { result } = renderHook(() => useRovingTabindex(containerRef, { wrap: false }), { wrapper: Wrapper });

    act(() => {
      result.current.setActiveIndex(5);
    });

    expect(elements[2].focus).toHaveBeenCalled(); // Should clamp to last index
  });
});

describe('useGlobalKeyboardShortcuts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register keyboard shortcuts', () => {
    const shortcuts = {
      'ctrl+s': jest.fn(),
      'alt+h': jest.fn(),
      'shift+?': jest.fn()
    };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts), { wrapper: Wrapper });

    expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should execute shortcuts on key combination', () => {
    const saveHandler = jest.fn();
    const helpHandler = jest.fn();
    
    const shortcuts = {
      'ctrl+s': saveHandler,
      'alt+h': helpHandler
    };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    const mockEvent = {
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      key: 's',
      preventDefault: jest.fn()
    };

    act(() => {
      keydownListener(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(saveHandler).toHaveBeenCalled();
    expect(helpHandler).not.toHaveBeenCalled();
  });

  it('should handle multiple modifier keys', () => {
    const complexHandler = jest.fn();
    
    const shortcuts = {
      'ctrl+shift+alt+z': complexHandler
    };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    const mockEvent = {
      ctrlKey: true,
      altKey: true,
      shiftKey: true,
      metaKey: false,
      key: 'z',
      preventDefault: jest.fn()
    };

    act(() => {
      keydownListener(mockEvent);
    });

    expect(complexHandler).toHaveBeenCalled();
  });

  it('should clean up event listeners on unmount', () => {
    const shortcuts = { 'ctrl+s': jest.fn() };

    const { unmount } = renderHook(() => useGlobalKeyboardShortcuts(shortcuts), { wrapper: Wrapper });

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should not execute non-matching shortcuts', () => {
    const saveHandler = jest.fn();
    
    const shortcuts = {
      'ctrl+s': saveHandler
    };

    renderHook(() => useGlobalKeyboardShortcuts(shortcuts), { wrapper: Wrapper });

    const eventListeners = (document.addEventListener as jest.Mock).mock.calls;
    const keydownListener = eventListeners.find(call => call[0] === 'keydown')[1];

    const mockEvent = {
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      key: 's',
      preventDefault: jest.fn()
    };

    act(() => {
      keydownListener(mockEvent);
    });

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(saveHandler).not.toHaveBeenCalled();
  });
});

describe('announceKeyboardShortcut utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create screen reader announcement', () => {
    announceKeyboardShortcut('Ctrl+S', 'save document');

    expect(document.body.appendChild).toHaveBeenCalled();
    
    const appendCall = (document.body.appendChild as jest.Mock).mock.calls[0][0];
    expect(appendCall.getAttribute('aria-live')).toBe('polite');
    expect(appendCall.className).toBe('sr-only');
    expect(appendCall.textContent).toBe('Keyboard shortcut: Ctrl+S for save document');
  });

  it('should clean up announcement after timeout', () => {
    announceKeyboardShortcut('Alt+H', 'show help');

    expect(document.body.appendChild).toHaveBeenCalled();

    jest.advanceTimersByTime(2000);

    expect(document.body.removeChild).toHaveBeenCalled();
  });
});