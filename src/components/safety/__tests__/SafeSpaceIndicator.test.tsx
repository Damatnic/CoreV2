/**
 * Test Suite for SafeSpaceIndicator Component
 * Tests privacy mode indicator with session type display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SafeSpaceIndicator } from '../SafeSpaceIndicator';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock auth context
const mockAuthContext = {
  user: null,
  isAnonymous: false,
  login: jest.fn(),
  logout: jest.fn(),
  authState: {
    user: null,
    isAnonymous: false,
    helperProfile: null,
    userToken: null
  }
};

const AuthWrapper: React.FC<{ children: React.ReactNode; isAnonymous?: boolean }> = ({ 
  children, 
  isAnonymous = false 
}) => (
  <AuthContext.Provider value={{ ...mockAuthContext, isAnonymous, authState: { ...mockAuthContext.authState, isAnonymous } }}>
    {children}
  </AuthContext.Provider>
);

describe('SafeSpaceIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the safe space indicator', () => {
      render(
        <AuthWrapper>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      expect(screen.getByTestId('safe-space-indicator')).toBeInTheDocument();
    });

    it('should show anonymous mode when user is anonymous', () => {
      render(
        <AuthWrapper isAnonymous={true}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      expect(screen.getByText(/Anonymous Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/Your session is completely private/i)).toBeInTheDocument();
    });

    it('should show private mode when user is not anonymous', () => {
      render(
        <AuthWrapper isAnonymous={false}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      expect(screen.getByText(/Private Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/Your data is encrypted/i)).toBeInTheDocument();
    });

    it('should apply breathing animation class', () => {
      render(
        <AuthWrapper>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      const indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveClass('breathing');
    });
  });

  describe('Interactivity', () => {
    it('should show tooltip on hover', async () => {
      render(
        <AuthWrapper>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      const indicator = screen.getByTestId('safe-space-indicator');
      fireEvent.mouseEnter(indicator);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      render(
        <AuthWrapper>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      const indicator = screen.getByTestId('safe-space-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(indicator);

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('should be keyboard accessible', () => {
      render(
        <AuthWrapper>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      const indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveAttribute('tabIndex', '0');
      
      fireEvent.focus(indicator);
      expect(indicator).toHaveFocus();
    });
  });

  describe('Visual States', () => {
    it('should display lock icon for anonymous mode', () => {
      render(
        <AuthWrapper isAnonymous={true}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    });

    it('should display shield icon for private mode', () => {
      render(
        <AuthWrapper isAnonymous={false}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });

    it('should have appropriate color scheme for anonymous mode', () => {
      render(
        <AuthWrapper isAnonymous={true}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      const indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveStyle({ backgroundColor: expect.stringContaining('green') });
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA labels', () => {
      render(
        <AuthWrapper>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      const indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveAttribute('aria-label', expect.stringContaining('Privacy'));
      expect(indicator).toHaveAttribute('role', 'status');
    });

    it('should announce mode changes to screen readers', () => {
      const { rerender } = render(
        <AuthWrapper isAnonymous={false}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      expect(screen.getByText(/Private Mode/i)).toBeInTheDocument();

      rerender(
        <AuthWrapper isAnonymous={true}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      expect(screen.getByText(/Anonymous Mode/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should support high contrast mode', () => {
      render(
        <AuthWrapper>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      const indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveStyle({ border: expect.stringContaining('solid') });
    });
  });

  describe('Responsive Design', () => {
    it('should hide text on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });

      render(
        <AuthWrapper>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      const textElement = screen.queryByText(/Mode/i);
      expect(textElement).toHaveClass('hide-on-mobile');
    });

    it('should show full content on larger screens', () => {
      // Mock large screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });

      render(
        <AuthWrapper>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      const textElement = screen.getByText(/Mode/i);
      expect(textElement).not.toHaveClass('hide-on-mobile');
    });
  });

  describe('Integration with Auth Context', () => {
    it('should update when auth context changes', () => {
      const { rerender } = render(
        <AuthWrapper isAnonymous={false}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      expect(screen.getByText(/Private Mode/i)).toBeInTheDocument();

      rerender(
        <AuthWrapper isAnonymous={true}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      expect(screen.getByText(/Anonymous Mode/i)).toBeInTheDocument();
    });

    it('should handle undefined auth state gracefully', () => {
      render(
        <AuthContext.Provider value={null as any}>
          <SafeSpaceIndicator />
        </AuthContext.Provider>
      );

      expect(screen.getByTestId('safe-space-indicator')).toBeInTheDocument();
      expect(screen.getByText(/Private Mode/i)).toBeInTheDocument(); // Default to private
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = () => {
        renderSpy();
        return <SafeSpaceIndicator />;
      };

      const { rerender } = render(
        <AuthWrapper>
          <TestWrapper />
        </AuthWrapper>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(
        <AuthWrapper>
          <TestWrapper />
        </AuthWrapper>
      );

      expect(renderSpy).toHaveBeenCalledTimes(2); // Only one additional render
    });

    it('should handle rapid mode switches', async () => {
      const { rerender } = render(
        <AuthWrapper isAnonymous={false}>
          <SafeSpaceIndicator />
        </AuthWrapper>
      );

      // Rapid switches
      for (let i = 0; i < 10; i++) {
        rerender(
          <AuthWrapper isAnonymous={i % 2 === 0}>
            <SafeSpaceIndicator />
          </AuthWrapper>
        );
      }

      // Should still render correctly
      expect(screen.getByTestId('safe-space-indicator')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(
        <AuthWrapper>
          <SafeSpaceIndicator className="custom-class" />
        </AuthWrapper>
      );

      const indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveClass('custom-class');
    });

    it('should apply theme-based styling', () => {
      render(
        <AuthWrapper>
          <SafeSpaceIndicator theme="dark" />
        </AuthWrapper>
      );

      const indicator = screen.getByTestId('safe-space-indicator');
      expect(indicator).toHaveClass('theme-dark');
    });
  });

  describe('Error Handling', () => {
    it('should handle render errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <AuthWrapper>
          <SafeSpaceIndicator>
            <ThrowError />
          </SafeSpaceIndicator>
        </AuthWrapper>
      );

      // Should still render fallback
      expect(screen.getByTestId('safe-space-indicator')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});