import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/safe-ui-system.css';

interface BreathingExerciseOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  technique?: 'box' | '478' | 'belly' | 'guided';
  autoStart?: boolean;
}

export const BreathingExerciseOverlay: React.FC<BreathingExerciseOverlayProps> = ({
  isOpen,
  onClose,
  technique = 'box',
  autoStart = true
}) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [seconds, setSeconds] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Breathing patterns based on technique
  const patterns = {
    box: { inhale: 4, hold: 4, exhale: 4, pause: 4 }, // Box breathing
    '478': { inhale: 4, hold: 7, exhale: 8, pause: 0 }, // 4-7-8 technique
    belly: { inhale: 5, hold: 2, exhale: 7, pause: 2 }, // Belly breathing
    guided: { inhale: 4, hold: 2, exhale: 6, pause: 2 }, // General guided
  };

  const pattern = patterns[technique];

  const getPhaseMessage = () => {
    switch(phase) {
      case 'inhale':
        return 'Breathe in slowly through your nose...';
      case 'hold':
        return 'Hold your breath gently...';
      case 'exhale':
        return 'Release slowly through your mouth...';
      case 'pause':
        return 'Rest and prepare...';
      default:
        return '';
    }
  };

  const getPhaseColor = () => {
    switch(phase) {
      case 'inhale': return 'var(--safe-accent-cool)';
      case 'hold': return 'var(--safe-warning)';
      case 'exhale': return 'var(--safe-accent)';
      case 'pause': return 'var(--safe-gray-400)';
      default: return 'var(--safe-primary)';
    }
  };

  const startExercise = useCallback(() => {
    setIsActive(true);
    setShowInstructions(false);
    setPhase('inhale');
    setSeconds(pattern.inhale);
    setCycles(0);
  }, [pattern.inhale]);

  const stopExercise = useCallback(() => {
    setIsActive(false);
    setPhase('inhale');
    setSeconds(0);
  }, []);

  const handleClose = useCallback(() => {
    stopExercise();
    onClose();
  }, [stopExercise, onClose]);

  // Auto-start on open
  useEffect(() => {
    if (isOpen && autoStart) {
      setTimeout(() => startExercise(), 1000);
    }
  }, [isOpen, autoStart, startExercise]);

  // Breathing cycle timer
  useEffect(() => {
    if (!isActive || seconds <= 0) return;

    const timer = setTimeout(() => {
      setSeconds(seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, isActive]);

  // Phase transitions
  useEffect(() => {
    if (!isActive || seconds > 0) return;

    const nextPhase = () => {
      switch(phase) {
        case 'inhale':
          if (pattern.hold > 0) {
            setPhase('hold');
            setSeconds(pattern.hold);
          } else {
            setPhase('exhale');
            setSeconds(pattern.exhale);
          }
          break;
        case 'hold':
          setPhase('exhale');
          setSeconds(pattern.exhale);
          break;
        case 'exhale':
          if (pattern.pause > 0) {
            setPhase('pause');
            setSeconds(pattern.pause);
          } else {
            setPhase('inhale');
            setSeconds(pattern.inhale);
            setCycles(cycles + 1);
          }
          break;
        case 'pause':
          setPhase('inhale');
          setSeconds(pattern.inhale);
          setCycles(cycles + 1);
          break;
      }
    };

    nextPhase();
  }, [seconds, isActive, phase, pattern, cycles]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isActive) {
          stopExercise();
        } else {
          startExercise();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, isActive, handleClose, startExercise, stopExercise]);

  if (!isOpen) return null;

  const circleRadius = 120;
  const circumference = 2 * Math.PI * circleRadius;
  const progress = seconds / pattern[phase];
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div 
      className="breathing-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26, 25, 23, 0.85)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.5s ease-out',
      }}
      onClick={handleClose}
    >
      <div 
        className="breathing-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--safe-white)',
          borderRadius: 'var(--safe-radius-xl)',
          padding: 'var(--safe-space-3xl)',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          boxShadow: 'var(--safe-shadow-xl)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close breathing exercise"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--safe-gray-500)',
            padding: '8px',
            borderRadius: 'var(--safe-radius-sm)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--safe-gray-100)';
            e.currentTarget.style.color = 'var(--safe-gray-700)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--safe-gray-500)';
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--safe-gray-800)',
          marginBottom: 'var(--safe-space-lg)',
        }}>
          Breathing Exercise
        </h2>

        {showInstructions ? (
          <div style={{ marginBottom: 'var(--safe-space-xl)' }}>
            <p style={{
              color: 'var(--safe-gray-600)',
              marginBottom: 'var(--safe-space-lg)',
              lineHeight: 1.6,
            }}>
              This {technique === 'box' ? 'box breathing' : 
                    technique === '478' ? '4-7-8' : 
                    technique === 'belly' ? 'belly breathing' : 
                    'guided breathing'} exercise will help calm your mind and body.
            </p>
            <p style={{
              color: 'var(--safe-gray-500)',
              fontSize: '14px',
            }}>
              Follow the visual guide and breathing prompts. Press space to pause anytime.
            </p>
          </div>
        ) : null}

        {/* Breathing visualization */}
        <div style={{
          position: 'relative',
          width: '280px',
          height: '280px',
          margin: '0 auto var(--safe-space-xl)',
        }}>
          {/* Background circle */}
          <svg
            width="280"
            height="280"
            style={{
              position: 'absolute',
              transform: 'rotate(-90deg)',
            }}
          >
            <circle
              cx="140"
              cy="140"
              r={circleRadius}
              fill="none"
              stroke="var(--safe-gray-200)"
              strokeWidth="8"
            />
            <circle
              cx="140"
              cy="140"
              r={circleRadius}
              fill="none"
              stroke={getPhaseColor()}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
              }}
            />
          </svg>

          {/* Center content */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Animated circle */}
            <div
              style={{
                width: phase === 'inhale' ? '100px' : 
                       phase === 'hold' ? '100px' : 
                       phase === 'exhale' ? '60px' : '60px',
                height: phase === 'inhale' ? '100px' : 
                        phase === 'hold' ? '100px' : 
                        phase === 'exhale' ? '60px' : '60px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${getPhaseColor()}, transparent)`,
                opacity: 0.3,
                transition: 'all 1s ease-in-out',
                marginBottom: 'var(--safe-space-md)',
              }}
            />

            {/* Timer */}
            <div style={{
              fontSize: '48px',
              fontWeight: '300',
              color: getPhaseColor(),
              fontVariantNumeric: 'tabular-nums',
            }}>
              {seconds}
            </div>

            {/* Phase label */}
            <div style={{
              fontSize: '18px',
              fontWeight: '500',
              color: 'var(--safe-gray-700)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginTop: 'var(--safe-space-sm)',
            }}>
              {phase}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <p style={{
          color: 'var(--safe-gray-600)',
          fontSize: '16px',
          marginBottom: 'var(--safe-space-xl)',
          minHeight: '24px',
        }}>
          {isActive ? getPhaseMessage() : 'Press Start to begin'}
        </p>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: 'var(--safe-space-md)',
          justifyContent: 'center',
        }}>
          {!isActive ? (
            <button
              onClick={startExercise}
              style={{
                background: 'var(--safe-gradient-primary)',
                color: 'var(--safe-white)',
                border: 'none',
                borderRadius: 'var(--safe-radius-full)',
                padding: 'var(--safe-space-md) var(--safe-space-xl)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: 'var(--safe-shadow-md)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = 'var(--safe-shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'var(--safe-shadow-md)';
              }}
            >
              Start Exercise
            </button>
          ) : (
            <button
              onClick={stopExercise}
              style={{
                background: 'var(--safe-gray-200)',
                color: 'var(--safe-gray-700)',
                border: 'none',
                borderRadius: 'var(--safe-radius-full)',
                padding: 'var(--safe-space-md) var(--safe-space-xl)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Pause
            </button>
          )}
        </div>

        {/* Cycle counter */}
        {cycles > 0 && (
          <div style={{
            marginTop: 'var(--safe-space-lg)',
            color: 'var(--safe-gray-500)',
            fontSize: '14px',
          }}>
            Cycles completed: {cycles}
          </div>
        )}
      </div>
    </div>
  );
};

export default BreathingExerciseOverlay;