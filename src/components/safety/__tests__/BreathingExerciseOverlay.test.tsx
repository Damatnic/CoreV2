/**
 * Test Suite for BreathingExerciseOverlay Component
 * Tests interactive breathing exercises with visual guide
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BreathingExerciseOverlay } from '../BreathingExerciseOverlay';

// Mock timers
jest.useFakeTimers();

describe('BreathingExerciseOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      expect(screen.getByTestId('breathing-overlay')).toBeInTheDocument();
      expect(screen.getByText(/Breathing Exercise/i)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<BreathingExerciseOverlay isOpen={false} onClose={jest.fn()} />);
      
      expect(screen.queryByTestId('breathing-overlay')).not.toBeInTheDocument();
    });

    it('should display all exercise options', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      expect(screen.getByText(/4-7-8 Breathing/i)).toBeInTheDocument();
      expect(screen.getByText(/Box Breathing/i)).toBeInTheDocument();
      expect(screen.getByText(/Belly Breathing/i)).toBeInTheDocument();
      expect(screen.getByText(/5-5-5 Breathing/i)).toBeInTheDocument();
    });
  });

  describe('Exercise Selection', () => {
    it('should allow selecting different exercises', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const boxBreathingButton = screen.getByText(/Box Breathing/i);
      fireEvent.click(boxBreathingButton);
      
      expect(screen.getByText(/Hold/i)).toBeInTheDocument(); // Box breathing has hold phases
    });

    it('should show exercise description on selection', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const fourSevenEightButton = screen.getByText(/4-7-8 Breathing/i);
      fireEvent.click(fourSevenEightButton);
      
      expect(screen.getByText(/relaxation technique/i)).toBeInTheDocument();
    });

    it('should highlight selected exercise', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const boxBreathingButton = screen.getByText(/Box Breathing/i);
      fireEvent.click(boxBreathingButton);
      
      expect(boxBreathingButton.parentElement).toHaveClass('selected');
    });
  });

  describe('Exercise Execution', () => {
    it('should start exercise on play button click', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      expect(screen.getByText(/Breathe In/i)).toBeInTheDocument();
    });

    it('should cycle through breathing phases', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      // Initial phase
      expect(screen.getByText(/Breathe In/i)).toBeInTheDocument();
      
      // Advance timer for inhale phase (4 seconds)
      act(() => {
        jest.advanceTimersByTime(4000);
      });
      
      // Should move to hold phase
      expect(screen.getByText(/Hold/i)).toBeInTheDocument();
    });

    it('should display countdown timer', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      expect(screen.getByTestId('timer-display')).toBeInTheDocument();
      expect(screen.getByText(/4/)).toBeInTheDocument(); // Starting countdown
    });

    it('should complete full breathing cycle', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      // Complete 4-7-8 cycle
      act(() => {
        jest.advanceTimersByTime(4000); // Inhale
        jest.advanceTimersByTime(7000); // Hold
        jest.advanceTimersByTime(8000); // Exhale
      });
      
      // Should start next cycle
      expect(screen.getByText(/Breathe In/i)).toBeInTheDocument();
    });
  });

  describe('Controls', () => {
    it('should pause exercise on pause button click', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);
      
      expect(screen.getByText(/Paused/i)).toBeInTheDocument();
    });

    it('should resume exercise after pause', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);
      
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(resumeButton);
      
      expect(screen.queryByText(/Paused/i)).not.toBeInTheDocument();
    });

    it('should reset exercise on stop button click', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      const stopButton = screen.getByRole('button', { name: /stop/i });
      fireEvent.click(stopButton);
      
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('should show breathing animation', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      const animationCircle = screen.getByTestId('breathing-circle');
      expect(animationCircle).toHaveClass('inhaling');
    });

    it('should change animation based on phase', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      const animationCircle = screen.getByTestId('breathing-circle');
      
      // Inhale phase
      expect(animationCircle).toHaveClass('inhaling');
      
      // Move to exhale phase
      act(() => {
        jest.advanceTimersByTime(11000); // Through inhale and hold
      });
      
      expect(animationCircle).toHaveClass('exhaling');
    });

    it('should display progress indicator', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Customization', () => {
    it('should allow custom cycle count', () => {
      render(
        <BreathingExerciseOverlay 
          isOpen={true} 
          onClose={jest.fn()} 
          defaultCycles={5}
        />
      );
      
      expect(screen.getByText(/5 cycles/i)).toBeInTheDocument();
    });

    it('should allow adjusting cycle count', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const increaseButton = screen.getByRole('button', { name: /increase cycles/i });
      fireEvent.click(increaseButton);
      
      expect(screen.getByText(/4 cycles/i)).toBeInTheDocument();
    });

    it('should support custom exercise durations', () => {
      const customExercise = {
        name: 'Custom Breathing',
        inhale: 5,
        hold: 5,
        exhale: 5
      };
      
      render(
        <BreathingExerciseOverlay 
          isOpen={true} 
          onClose={jest.fn()} 
          customExercise={customExercise}
        />
      );
      
      expect(screen.getByText(/Custom Breathing/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA labels', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Breathing Exercise');
      expect(screen.getByRole('button', { name: /start/i })).toHaveAttribute('aria-label', expect.stringContaining('Start'));
    });

    it('should be keyboard navigable', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      
      fireEvent.focus(playButton);
      expect(playButton).toHaveFocus();
      
      fireEvent.keyDown(playButton, { key: 'Enter' });
      expect(screen.getByText(/Breathe In/i)).toBeInTheDocument();
    });

    it('should announce phase changes to screen readers', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveTextContent(/Breathe In/i);
    });

    it('should trap focus within overlay', () => {
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      const playButton = screen.getByRole('button', { name: /start/i });
      
      // Tab from last to first
      fireEvent.focus(closeButton);
      fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
      
      expect(playButton).toHaveFocus();
    });
  });

  describe('Completion and Feedback', () => {
    it('should show completion message after all cycles', () => {
      render(
        <BreathingExerciseOverlay 
          isOpen={true} 
          onClose={jest.fn()} 
          defaultCycles={1}
        />
      );
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      // Complete one full cycle
      act(() => {
        jest.advanceTimersByTime(19000); // 4+7+8
      });
      
      expect(screen.getByText(/Great job!/i)).toBeInTheDocument();
    });

    it('should track session statistics', () => {
      const onComplete = jest.fn();
      
      render(
        <BreathingExerciseOverlay 
          isOpen={true} 
          onClose={jest.fn()}
          onComplete={onComplete}
          defaultCycles={1}
        />
      );
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      act(() => {
        jest.advanceTimersByTime(19000);
      });
      
      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
        duration: 19000,
        cycles: 1,
        exercise: '4-7-8'
      }));
    });

    it('should offer to continue after completion', () => {
      render(
        <BreathingExerciseOverlay 
          isOpen={true} 
          onClose={jest.fn()} 
          defaultCycles={1}
        />
      );
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      act(() => {
        jest.advanceTimersByTime(19000);
      });
      
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle timer errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<BreathingExerciseOverlay isOpen={true} onClose={jest.fn()} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      // Force an error
      act(() => {
        throw new Error('Timer error');
      });
      
      // Should still be functional
      expect(screen.getByTestId('breathing-overlay')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when X button clicked', () => {
      const onClose = jest.fn();
      render(<BreathingExerciseOverlay isOpen={true} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when ESC key pressed', () => {
      const onClose = jest.fn();
      render(<BreathingExerciseOverlay isOpen={true} onClose={onClose} />);
      
      fireEvent.keyDown(window, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalled();
    });

    it('should not close on overlay click when exercise is running', () => {
      const onClose = jest.fn();
      render(<BreathingExerciseOverlay isOpen={true} onClose={onClose} />);
      
      const playButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(playButton);
      
      const overlay = screen.getByTestId('breathing-overlay');
      fireEvent.click(overlay);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});