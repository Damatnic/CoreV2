/**
 * Test Suite fo    it('should render when show is true', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByTestId('crisis-alert-banner')).toBeInTheDocument();tBanner Component
 * Tests crisis alert display with appropriate resources
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CrisisAlertBanner } from '../../CrisisAlertBanner';
import { BrowserRouter } from 'react-router-dom';

const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CrisisAlertBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when crisis is detected', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByTestId('crisis-alert-banner')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={false}
            severity="low"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.queryByTestId('crisis-alert-banner')).not.toBeInTheDocument();
    });

    it('should display appropriate message based on severity', () => {
      const { rerender } = render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="low"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/We're here to support you/i)).toBeInTheDocument();

      rerender(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/immediate support is available/i)).toBeInTheDocument();

      rerender(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Your safety is our priority/i)).toBeInTheDocument();
    });
  });

  describe('Crisis Resources', () => {
    it('should display crisis hotline number', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/988/)).toBeInTheDocument();
      expect(screen.getByText(/Crisis Lifeline/i)).toBeInTheDocument();
    });

    it('should display text support option', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Text HOME to 741741/i)).toBeInTheDocument();
    });

    it('should show emergency services for critical severity', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Call 911/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Emergency/i })).toHaveAttribute('href', 'tel:911');
    });

    it('should display location-specific resources when provided', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"

            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Samaritans/i)).toBeInTheDocument();
      expect(screen.getByText(/116 123/)).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('should have clickable phone numbers', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const phoneLink = screen.getByRole('link', { name: /988/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:988');
    });

    it('should open chat support in new window', () => {
      const mockOpen = jest.fn();
      window.open = mockOpen;

      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const chatButton = screen.getByRole('button', { name: /Chat Now/i });
      fireEvent.click(chatButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('crisis'),
        '_blank',
        expect.any(String)
      );
    });

    it('should navigate to resources page', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="low"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const resourcesLink = screen.getByRole('link', { name: /View Resources/i });
      expect(resourcesLink).toHaveAttribute('href', '/resources');
    });
  });

  describe('Dismiss Functionality', () => {
    it('should call onDismiss when X button clicked', () => {
      const onDismiss = jest.fn();
      
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="low"
            onClose={onDismiss}
          />
        </RouterWrapper>
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
    });

    it('should not show dismiss button for emergency severity', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });

    it('should allow dismissal after delay for high severity', async () => {
      jest.useFakeTimers();
      
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}

          />
        </RouterWrapper>
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toBeDisabled();

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(dismissButton).not.toBeDisabled();
      });

      jest.useRealTimers();
    });
  });

  describe('Visual Styling', () => {
    it('should apply severity-based styling', () => {
      const { rerender } = render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="low"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      let banner = screen.getByTestId('crisis-alert-banner');
      expect(banner).toHaveClass('severity-low');

      rerender(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      banner = screen.getByTestId('crisis-alert-banner');
      expect(banner).toHaveClass('severity-high');
    });

    it('should have pulsing animation for emergency', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const banner = screen.getByTestId('crisis-alert-banner');
      expect(banner).toHaveClass('pulsing');
    });

    it('should stick to top of viewport', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const banner = screen.getByTestId('crisis-alert-banner');
      expect(banner).toHaveStyle({ position: 'sticky', top: '0' });
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA role and labels', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const banner = screen.getByRole('alert');
      expect(banner).toHaveAttribute('aria-live', 'assertive');
      expect(banner).toHaveAttribute('aria-atomic', 'true');
    });

    it('should be keyboard navigable', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const firstLink = screen.getByRole('link', { name: /988/i });
      const chatButton = screen.getByRole('button', { name: /Chat Now/i });

      fireEvent.focus(firstLink);
      expect(firstLink).toHaveFocus();

      fireEvent.keyDown(firstLink, { key: 'Tab' });
      expect(chatButton).toHaveFocus();
    });

    it('should announce to screen readers immediately', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Quick Actions', () => {
    it('should show breathing exercise button', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /Breathing Exercise/i })).toBeInTheDocument();
    });

    it('should trigger breathing exercise overlay', () => {
      const onBreathingExercise = jest.fn();
      
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}

          />
        </RouterWrapper>
      );

      const breathingButton = screen.getByRole('button', { name: /Breathing Exercise/i });
      fireEvent.click(breathingButton);

      expect(onBreathingExercise).toHaveBeenCalled();
    });

    it('should show safety plan button when available', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"

            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /View Safety Plan/i })).toBeInTheDocument();
    });

    it('should trigger safety plan view', () => {
      const onViewSafetyPlan = jest.fn();
      
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"

            onClose={jest.fn()}

          />
        </RouterWrapper>
      );

      const safetyPlanButton = screen.getByRole('button', { name: /View Safety Plan/i });
      fireEvent.click(safetyPlanButton);

      expect(onViewSafetyPlan).toHaveBeenCalled();
    });
  });

  describe('Animation and Transitions', () => {
    it('should slide in when appearing', async () => {
      const { rerender } = render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={false}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      rerender(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const banner = screen.getByTestId('crisis-alert-banner');
      expect(banner).toHaveClass('slide-in');
    });

    it('should fade out when dismissing', async () => {
      const onDismiss = jest.fn();
      
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="low"
            onClose={onDismiss}
          />
        </RouterWrapper>
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      const banner = screen.getByTestId('crisis-alert-banner');
      expect(banner).toHaveClass('fade-out');
    });
  });

  describe('Responsive Design', () => {
    it('should stack resources vertically on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });

      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      const resourceContainer = screen.getByTestId('resource-container');
      expect(resourceContainer).toHaveClass('mobile-stack');
    });

    it('should use icons only on very small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320
      });

      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"
            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      expect(screen.queryByText(/Crisis Lifeline/i)).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /988/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing resources gracefully', () => {
      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="high"

            onClose={jest.fn()}
          />
        </RouterWrapper>
      );

      // Should still show default resources
      expect(screen.getByText(/988/)).toBeInTheDocument();
    });

    it('should handle click errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const onDismiss = jest.fn(() => {
        throw new Error('Dismiss error');
      });

      render(
        <RouterWrapper>
          <CrisisAlertBanner 
            show={true}
            severity="low"
            onClose={onDismiss}
          />
        </RouterWrapper>
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      
      // Should not throw
      expect(() => fireEvent.click(dismissButton)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
