import React, { ReactElement } from 'react';
import { render, RenderOptions, renderHook as renderHookBase, RenderHookOptions } from '@testing-library/react';

// Import providers directly to avoid lazy loading issues in tests
// These are not used directly but are kept as comments for reference
// import { ThemeProvider } from './contexts/ThemeContext';
// import { AuthProvider } from './contexts/AuthContext';
// import { NotificationProvider } from './contexts/NotificationContext';

// Simple wrapper for hooks that don't need all providers
const SimpleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Mock minimal providers for testing
const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-theme="light">{children}</div>;
};

const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-auth="mock">{children}</div>;
};

const MockNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-notifications="mock">{children}</div>;
};

// Full provider wrapper for components using mock providers to avoid initialization issues
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MockThemeProvider>
      <MockNotificationProvider>
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </MockNotificationProvider>
    </MockThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  // Ensure we have a proper container
  const container = options?.container || document.getElementById('root') || document.body;
  return render(ui, { wrapper: AllTheProviders, container, ...options });
};

// Custom renderHook that properly accepts wrapper option
const customRenderHook = <TProps = unknown, TResult = unknown>(
  hook: (props?: TProps) => TResult,
  options?: RenderHookOptions<TProps>
) => {
  // Ensure we have a proper container for hooks too
  const container = options?.container || document.getElementById('root') || document.body;
  
  // If no wrapper is provided, use SimpleWrapper as default
  // This allows tests to provide their own wrapper when needed
  const finalOptions: RenderHookOptions<TProps> = {
    wrapper: SimpleWrapper,
    container,
    ...options
  };
  
  return renderHookBase(hook, finalOptions);
};

// Alternative render function that doesn't use providers at all
const renderWithoutProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  // Ensure we have a proper container
  const container = options?.container || document.getElementById('root') || document.body;
  return render(ui, { wrapper: SimpleWrapper, container, ...options });
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { customRender as render };
export { renderWithoutProviders };
export { customRenderHook as renderHook };
export { SimpleWrapper, AllTheProviders };

// Re-export commonly used testing utilities explicitly for better TypeScript support
export { screen, fireEvent, waitFor, within, act, cleanup } from '@testing-library/react';

// Import and re-export userEvent properly
import userEventLib from '@testing-library/user-event';
export const userEvent = userEventLib;

// Mock data creators for tests
export const createMockButtonProps = (overrides = {}) => ({
  onClick: jest.fn(),
  children: 'Test Button',
  variant: 'primary' as const,
  ...overrides
});

export const createMockCrisisAlert = (overrides = {}) => ({
  show: true,
  severity: 'high' as const,
  message: 'Test crisis alert',
  onClose: jest.fn(),
  onDismiss: jest.fn(),
  onEmergencyCall: jest.fn(),
  onCrisisChat: jest.fn(),
  ...overrides
});

export const createMockFormInputProps = (overrides = {}) => ({
  id: 'test-input',
  label: 'Test Input',
  name: 'testInput',
  value: '',
  onChange: jest.fn(),
  onBlur: jest.fn(),
  ...overrides
});

export const createMockModalProps = (overrides = {}) => ({
  isOpen: true,
  onClose: jest.fn(),
  title: 'Test Modal',
  children: 'Modal content',
  ...overrides
});

// Mock window methods
export const mockWindowMethods = () => ({
  alert: jest.fn(),
  confirm: jest.fn(),
  prompt: jest.fn(),
  open: jest.fn()
});

// Mock HTML element methods
export const mockHTMLElementMethods = () => ({
  focus: jest.fn(),
  blur: jest.fn(),
  click: jest.fn(),
  scrollIntoView: jest.fn()
});

// Mock form animations hook
export const mockUseFormAnimations = () => ({
  animateError: jest.fn(),
  animateSuccess: jest.fn(),
  animateWarning: jest.fn(),
  showFieldError: jest.fn(),
  showFieldSuccess: jest.fn(),
  clearFieldState: jest.fn(),
  errors: {},
  successFields: new Set()
});

// User event utilities alias
export const user = userEventLib;
