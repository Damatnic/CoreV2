import React from 'react';
import { render, screen, waitFor, act } from '../../test-utils';
import { Toast, ToastContainer } from '../Toast';
import { Toast as ToastType } from '../../types';

// Mock the NotificationContext
const mockToasts: ToastType[] = [];
const mockRemoveToast = jest.fn();

jest.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    toasts: mockToasts,
    removeToast: mockRemoveToast,
  })
}));

describe('Toast', () => {
  const createMockToast = (overrides = {}): ToastType => ({
    id: 'test-toast-1',
    message: 'Test toast message',
    type: 'info' as const,
    timestamp: Date.now(),
    ...overrides,
  });

  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Toast Component', () => {
    it('should render toast with message', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      expect(screen.getByText('Test toast message')).toBeInTheDocument();
    });

    it('should apply correct type class', () => {
      const types = ['info', 'success', 'warning', 'error'] as const;
      
      types.forEach(type => {
        const toast = createMockToast({ type });
        const { container, unmount } = render(
          <Toast toast={toast} onDismiss={mockOnDismiss} />
        );
        
        expect(container.firstChild).toHaveClass(`toast-${type}`);
        unmount();
      });
    });

    it('should have correct DOM structure', () => {
      const toast = createMockToast();
      const { container } = render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      const toastElement = container.firstChild;
      expect(toastElement).toHaveClass('toast');
      
      expect(container.querySelector('.toast-message')).toBeInTheDocument();
      expect(container.querySelector('.toast-progress')).toBeInTheDocument();
    });

    it('should auto-dismiss after 5 seconds', async () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      expect(mockOnDismiss).not.toHaveBeenCalled();
      
      // Fast-forward time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(mockOnDismiss).toHaveBeenCalledWith(toast.id);
    });

    it('should not dismiss before timeout', () => {
      const toast = createMockToast();
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      // Fast-forward time by 4.9 seconds
      act(() => {
        jest.advanceTimersByTime(4900);
      });
      
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('should clear timeout when component unmounts', () => {
      const toast = createMockToast();
      const { unmount } = render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      // Unmount before timeout
      unmount();
      
      // Fast-forward past the timeout
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('should create new timer when toast changes', () => {
      const toast1 = createMockToast({ id: 'toast-1' });
      const { rerender } = render(<Toast toast={toast1} onDismiss={mockOnDismiss} />);
      
      // Fast-forward partway
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      // Change to new toast
      const toast2 = createMockToast({ id: 'toast-2' });
      rerender(<Toast toast={toast2} onDismiss={mockOnDismiss} />);
      
      // Fast-forward another 2.5 seconds (total 5 seconds from original)
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      // Should not dismiss yet (new timer started)
      expect(mockOnDismiss).not.toHaveBeenCalled();
      
      // Fast-forward another 2.5 seconds (5 seconds from new toast)
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      
      expect(mockOnDismiss).toHaveBeenCalledWith(toast2.id);
    });

    it('should handle different toast types', () => {
      const toastTypes = [
        { type: 'info' as const, message: 'Info message' },
        { type: 'success' as const, message: 'Success message' },
        { type: 'warning' as const, message: 'Warning message' },
        { type: 'error' as const, message: 'Error message' }
      ];
      
      toastTypes.forEach(({ type, message }) => {
        const toast = createMockToast({ type, message });
        const { container, unmount } = render(
          <Toast toast={toast} onDismiss={mockOnDismiss} />
        );
        
        expect(screen.getByText(message)).toBeInTheDocument();
        expect(container.firstChild).toHaveClass(`toast`, `toast-${type}`);
        
        unmount();
      });
    });
  });

  describe('ToastContainer Component', () => {
    beforeEach(() => {
      // Clear the mock array
      mockToasts.length = 0;
    });

    it('should render empty container when no toasts', () => {
      const { container } = render(<ToastContainer />);
      
      expect(container.firstChild).toHaveClass('toast-container');
      expect(container.firstChild?.children).toHaveLength(0);
    });

    it('should render single toast', () => {
      const toast = createMockToast();
      mockToasts.push(toast);
      
      render(<ToastContainer />);
      
      expect(screen.getByText(toast.message)).toBeInTheDocument();
    });

    it('should render multiple toasts', () => {
      const toast1 = createMockToast({ id: 'toast-1', message: 'First toast' });
      const toast2 = createMockToast({ id: 'toast-2', message: 'Second toast' });
      const toast3 = createMockToast({ id: 'toast-3', message: 'Third toast' });
      
      mockToasts.push(toast1, toast2, toast3);
      
      render(<ToastContainer />);
      
      expect(screen.getByText('First toast')).toBeInTheDocument();
      expect(screen.getByText('Second toast')).toBeInTheDocument();
      expect(screen.getByText('Third toast')).toBeInTheDocument();
    });

    it('should pass correct props to Toast components', () => {
      const toast1 = createMockToast({ id: 'toast-1', type: 'success' });
      const toast2 = createMockToast({ id: 'toast-2', type: 'error' });
      
      mockToasts.push(toast1, toast2);
      
      const { container } = render(<ToastContainer />);
      
      const toasts = container.querySelectorAll('.toast');
      expect(toasts).toHaveLength(2);
      expect(toasts[0]).toHaveClass('toast-success');
      expect(toasts[1]).toHaveClass('toast-error');
    });

    it('should call removeToast when toast is dismissed', async () => {
      const toast = createMockToast();
      mockToasts.push(toast);
      
      render(<ToastContainer />);
      
      // Fast-forward to trigger auto-dismiss
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(mockRemoveToast).toHaveBeenCalledWith(toast.id);
    });

    it('should handle toasts with same message but different IDs', () => {
      const toast1 = createMockToast({ id: 'toast-1', message: 'Same message' });
      const toast2 = createMockToast({ id: 'toast-2', message: 'Same message' });
      
      mockToasts.push(toast1, toast2);
      
      const { container } = render(<ToastContainer />);
      
      const toasts = container.querySelectorAll('.toast');
      expect(toasts).toHaveLength(2);
      
      const messages = screen.getAllByText('Same message');
      expect(messages).toHaveLength(2);
    });

    it('should maintain correct order of toasts', () => {
      const toast1 = createMockToast({ id: 'toast-1', message: 'First' });
      const toast2 = createMockToast({ id: 'toast-2', message: 'Second' });
      const toast3 = createMockToast({ id: 'toast-3', message: 'Third' });
      
      mockToasts.push(toast1, toast2, toast3);
      
      const { container } = render(<ToastContainer />);
      
      const toastElements = container.querySelectorAll('.toast-message');
      expect(toastElements[0]).toHaveTextContent('First');
      expect(toastElements[1]).toHaveTextContent('Second');
      expect(toastElements[2]).toHaveTextContent('Third');
    });
  });

  describe('Integration Tests', () => {
    it('should handle rapid toast additions and removals', () => {
      const toast1 = createMockToast({ id: 'toast-1' });
      const toast2 = createMockToast({ id: 'toast-2' });
      
      // Start with one toast
      mockToasts.push(toast1);
      const { rerender } = render(<ToastContainer />);
      
      expect(screen.getByText(toast1.message)).toBeInTheDocument();
      
      // Add another toast
      mockToasts.push(toast2);
      rerender(<ToastContainer />);
      
      expect(screen.getByText(toast1.message)).toBeInTheDocument();
      expect(screen.getByText(toast2.message)).toBeInTheDocument();
      
      // Remove first toast
      mockToasts.splice(0, 1);
      rerender(<ToastContainer />);
      
      expect(screen.queryByText(toast1.message)).not.toBeInTheDocument();
      expect(screen.getByText(toast2.message)).toBeInTheDocument();
    });

    it('should handle edge case of empty toast message', () => {
      const toast = createMockToast({ message: '' });
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      const messageElement = screen.getByText('');
      expect(messageElement).toBeInTheDocument();
    });

    it('should handle very long toast messages', () => {
      const longMessage = 'This is a very long toast message that contains a lot of text to test how the component handles lengthy content and ensures it displays properly without breaking the layout or functionality';
      const toast = createMockToast({ message: longMessage });
      
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in toast messages', () => {
      const specialMessage = 'Toast with special chars: @#$%^&*()[]{}|;:,.<>?`~';
      const toast = createMockToast({ message: specialMessage });
      
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle toast with HTML-like content safely', () => {
      const htmlMessage = 'Alert: <script>alert("xss")</script> dangerous content';
      const toast = createMockToast({ message: htmlMessage });
      
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      // Should render as text, not execute HTML
      expect(screen.getByText(htmlMessage)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined onDismiss gracefully', () => {
      const toast = createMockToast();
      
      expect(() => {
        render(<Toast toast={toast} onDismiss={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle malformed toast object', () => {
      const malformedToast = {
        id: null,
        message: undefined,
        type: 'unknown'
      } as any;
      
      expect(() => {
        render(<Toast toast={malformedToast} onDismiss={mockOnDismiss} />);
      }).not.toThrow();
    });

    it('should handle timer cleanup on multiple re-renders', () => {
      const toast = createMockToast();
      const { rerender, unmount } = render(
        <Toast toast={toast} onDismiss={mockOnDismiss} />
      );
      
      // Re-render multiple times
      rerender(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      rerender(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      rerender(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      
      // Should not cause any errors
      expect(() => unmount()).not.toThrow();
    });
  });
});