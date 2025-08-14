import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export testing library utilities
export * from '@testing-library/react';
export { customRender as render };

// Mock data creators for tests
export const createMockButtonProps = (overrides = {}) => ({
  onClick: jest.fn(),
  children: 'Test Button',
  variant: 'primary' as const,
  ...overrides
});

export const createMockCrisisAlert = (overrides = {}) => ({
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

// User event utilities
import userEvent from '@testing-library/user-event';
export { userEvent };
export const user = userEvent;
