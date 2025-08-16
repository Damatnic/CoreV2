import React, { ReactElement } from 'react';
import { render, RenderOptions, renderHook as renderHookBase, RenderHookOptions } from '@testing-library/react';

// Lazy load providers to avoid initialization issues
const ThemeProvider = React.lazy(() => import('./contexts/ThemeContext').then(m => ({ default: m.ThemeProvider })));
const AuthProvider = React.lazy(() => import('./contexts/AuthContext').then(m => ({ default: m.AuthProvider })));
const NotificationProvider = React.lazy(() => import('./contexts/NotificationContext').then(m => ({ default: m.NotificationProvider })));

// Simple wrapper for hooks that don't need all providers
const SimpleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Full provider wrapper for components
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </React.Suspense>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Custom renderHook that properly accepts wrapper option
const customRenderHook = <TProps = unknown, TResult = unknown>(
  hook: (props?: TProps) => TResult,
  options?: RenderHookOptions<TProps>
) => {
  // If no wrapper is provided, use SimpleWrapper as default
  // This allows tests to provide their own wrapper when needed
  const finalOptions: RenderHookOptions<TProps> = {
    wrapper: SimpleWrapper,
    ...options
  };
  
  return renderHookBase(hook, finalOptions);
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { customRender as render };
export { customRenderHook as renderHook };

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
  showFieldSuccess: jest.fn()
});

// User event utilities alias
export const user = userEventLib;
