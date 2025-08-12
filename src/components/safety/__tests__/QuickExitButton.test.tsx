/**
 * Test Suite for QuickExitButton Component
 * Tests emergency site exit functionality with keyboard shortcuts
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuickExitButton } from '../QuickExitButton';
import { BrowserRouter } from 'react-router-dom';

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000',
  replace: jest.fn()
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock sessionStorage
const mockSessionStorage = {
  clear: jest.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('QuickExitButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = 'http://localhost:3000';
  });

  describe('Rendering', () => {
    it('should render the quick exit button', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /quick exit/i })).toBeInTheDocument();
      expect(screen.getByText(/ESC x3/i)).toBeInTheDocument();
    });

    it('should display warning icon', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      expect(screen.getByTestId('exit-icon')).toBeInTheDocument();
    });

    it('should have high z-index for visibility', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      expect(button.parentElement).toHaveStyle({ zIndex: expect.stringMatching(/999/) });
    });
  });

  describe('Exit Functionality', () => {
    it('should clear browsing data on click', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      fireEvent.click(button);

      expect(mockSessionStorage.clear).toHaveBeenCalled();
      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });

    it('should redirect to safe site on click', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      fireEvent.click(button);

      expect(mockLocation.replace).toHaveBeenCalledWith('https://www.google.com');
    });

    it('should use custom redirect URL if provided', () => {
      render(
        <RouterWrapper>
          <QuickExitButton redirectUrl="https://weather.com" />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      fireEvent.click(button);

      expect(mockLocation.replace).toHaveBeenCalledWith('https://weather.com');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should exit on triple ESC press', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      // Press ESC three times quickly
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      expect(mockLocation.replace).toHaveBeenCalledWith('https://www.google.com');
    });

    it('should reset counter if ESC presses are too slow', async () => {
      jest.useFakeTimers();

      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      // First ESC
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      
      // Wait too long
      jest.advanceTimersByTime(1000);
      
      // Second and third ESC
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      expect(mockLocation.replace).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should ignore other keys', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(window, { key: 'Space', code: 'Space' });
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      expect(mockLocation.replace).not.toHaveBeenCalled();
    });

    it('should work with keyboard shortcut customization', () => {
      render(
        <RouterWrapper>
          <QuickExitButton shortcutKey="q" shortcutCount={2} />
        </RouterWrapper>
      );

      fireEvent.keyDown(window, { key: 'q', code: 'KeyQ' });
      fireEvent.keyDown(window, { key: 'q', code: 'KeyQ' });

      expect(mockLocation.replace).toHaveBeenCalled();
    });
  });

  describe('Visual Feedback', () => {
    it('should show hover state', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      
      fireEvent.mouseEnter(button);
      expect(button).toHaveClass('hover');

      fireEvent.mouseLeave(button);
      expect(button).not.toHaveClass('hover');
    });

    it('should show focus state for keyboard navigation', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      
      fireEvent.focus(button);
      expect(button).toHaveClass('focused');
    });

    it('should show pressed state', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      
      fireEvent.mouseDown(button);
      expect(button).toHaveClass('pressed');

      fireEvent.mouseUp(button);
      expect(button).not.toHaveClass('pressed');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA attributes', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      expect(button).toHaveAttribute('aria-label', 'Emergency exit - leaves site immediately');
      expect(button).toHaveAttribute('aria-describedby', expect.stringContaining('instructions'));
    });

    it('should be keyboard accessible', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      
      fireEvent.focus(button);
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(mockLocation.replace).toHaveBeenCalled();
    });

    it('should announce exit to screen readers', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      fireEvent.click(button);

      const announcement = screen.getByRole('alert');
      expect(announcement).toHaveTextContent(/Exiting site/i);
    });
  });

  describe('Positioning Options', () => {
    it('should support different positions', () => {
      const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

      positions.forEach(position => {
        const { container } = render(
          <RouterWrapper>
            <QuickExitButton position={position as any} />
          </RouterWrapper>
        );

        const wrapper = container.querySelector('.quick-exit-wrapper');
        expect(wrapper).toHaveClass(`position-${position}`);
      });
    });

    it('should be fixed position by default', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const wrapper = screen.getByTestId('quick-exit-wrapper');
      expect(wrapper).toHaveStyle({ position: 'fixed' });
    });
  });

  describe('Customization', () => {
    it('should accept custom button text', () => {
      render(
        <RouterWrapper>
          <QuickExitButton buttonText="Leave Now" />
        </RouterWrapper>
      );

      expect(screen.getByText('Leave Now')).toBeInTheDocument();
    });

    it('should accept custom styles', () => {
      render(
        <RouterWrapper>
          <QuickExitButton className="custom-exit-button" />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      expect(button).toHaveClass('custom-exit-button');
    });

    it('should support size variants', () => {
      const { rerender } = render(
        <RouterWrapper>
          <QuickExitButton size="small" />
        </RouterWrapper>
      );

      let button = screen.getByRole('button', { name: /quick exit/i });
      expect(button).toHaveClass('size-small');

      rerender(
        <RouterWrapper>
          <QuickExitButton size="large" />
        </RouterWrapper>
      );

      button = screen.getByRole('button', { name: /quick exit/i });
      expect(button).toHaveClass('size-large');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should be touch accessible on mobile', () => {
      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 0, clientY: 0 } as Touch]
      });
      
      fireEvent(button, touchStart);
      expect(button).toHaveClass('pressed');
    });

    it('should adjust size on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });

      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      expect(button).toHaveClass('mobile-size');
    });
  });

  describe('Privacy Features', () => {
    it('should clear cookies if configured', () => {
      const clearCookies = jest.fn();
      
      render(
        <RouterWrapper>
          <QuickExitButton clearCookies={clearCookies} />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      fireEvent.click(button);

      expect(clearCookies).toHaveBeenCalled();
    });

    it('should clear history if possible', () => {
      const mockHistory = {
        pushState: jest.fn(),
        replaceState: jest.fn()
      };

      Object.defineProperty(window, 'history', {
        value: mockHistory,
        writable: true
      });

      render(
        <RouterWrapper>
          <QuickExitButton clearHistory={true} />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      fireEvent.click(button);

      expect(mockHistory.replaceState).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle redirect failures gracefully', () => {
      mockLocation.replace.mockImplementation(() => {
        throw new Error('Navigation blocked');
      });

      render(
        <RouterWrapper>
          <QuickExitButton fallbackUrl="https://news.google.com" />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      fireEvent.click(button);

      // Should attempt fallback
      expect(mockLocation.href).toBe('https://news.google.com');
    });

    it('should handle storage clearing errors', () => {
      mockSessionStorage.clear.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(
        <RouterWrapper>
          <QuickExitButton />
        </RouterWrapper>
      );

      const button = screen.getByRole('button', { name: /quick exit/i });
      
      // Should not throw
      expect(() => fireEvent.click(button)).not.toThrow();
      expect(mockLocation.replace).toHaveBeenCalled();
    });
  });
});