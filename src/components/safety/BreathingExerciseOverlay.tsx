import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/safe-ui-system.css';

interface BreathingExerciseOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  technique?: 'box' | '478' | 'belly' | 'guided';
  autoStart?: boolean;
  defaultCycles?: number;
  customExercise?: {
    name: string;
    inhale: number;
    hold: number;
    exhale: number;
  };
  onComplete?: (stats: { duration: number; cycles: number; exercise: string }) => void;
}

export const BreathingExerciseOverlay: React.FC<BreathingExerciseOverlayProps> = ({
  isOpen,
  onClose,
  technique = 'box',
  autoStart = true,
  defaultCycles = 3,
  customExercise,
  onComplete
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

  const pattern = customExercise 
    ? { inhale: customExercise.inhale, hold: customExercise.hold, exhale: customExercise.exhale, pause: 0 }
    : patterns[technique];

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
        case 'exhale': {
          if (pattern.pause > 0) {
            setPhase('pause');
            setSeconds(pattern.pause);
          } else {
            // Complete a cycle
            const newCycles = cycles + 1;
            setCycles(newCycles);
            
            // Check if we've completed the target cycles
            if (newCycles >= defaultCycles) {
              setIsActive(false);
              if (onComplete) {
                onComplete({ 
                  duration: newCycles * (pattern.inhale + pattern.hold + pattern.exhale + pattern.pause), 
                  cycles: newCycles, 
                  exercise: customExercise?.name || technique 
                });
              }
            } else {
              setPhase('inhale');
              setSeconds(pattern.inhale);
            }
          }
          break;
        }
        case 'pause': {
          // Complete a cycle
          const newCycles = cycles + 1;
          setCycles(newCycles);
          
          // Check if we've completed the target cycles
          if (newCycles >= defaultCycles) {
            setIsActive(false);
            if (onComplete) {
              onComplete({ 
                duration: newCycles * (pattern.inhale + pattern.hold + pattern.exhale + pattern.pause), 
                cycles: newCycles, 
                exercise: customExercise?.name || technique 
              });
            }
          } else {
            setPhase('inhale');
            setSeconds(pattern.inhale);
          }
          break;
        }
      }
    };

    nextPhase();
  }, [seconds, isActive, phase, pattern, cycles, defaultCycles, onComplete, customExercise, technique]);

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
      data-testid="breathing-overlay"
      role="dialog"
      aria-label="Breathing Exercise"
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
      onClick={isActive ? undefined : handleClose}
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
          role="button"
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
                    technique === '478' ? '4-7-8 relaxation technique' : 
                    technique === 'belly' ? 'belly breathing' : 
                    'guided breathing'} exercise will help calm your mind and body.
            </p>
            <p style={{
              color: 'var(--safe-gray-500)',
              fontSize: '14px',
            }}>
              Follow the visual guide and breathing prompts. Press space to pause anytime.
            </p>
            
            {/* Exercise Selection */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
              <button 
                className={technique === '478' ? 'selected' : ''}
                onClick={() => {/* 4-7-8 Breathing selection */}}
                style={{ padding: '8px 16px', borderRadius: '4px', border: technique === '478' ? '2px solid blue' : '1px solid gray' }}
              >
                4-7-8 Breathing
              </button>
              <button 
                className={technique === 'box' ? 'selected' : ''}
                onClick={() => {/* Box Breathing selection */}}
                style={{ padding: '8px 16px', borderRadius: '4px', border: technique === 'box' ? '2px solid blue' : '1px solid gray' }}
              >
                Box Breathing
              </button>
              <button 
                className={technique === 'belly' ? 'selected' : ''}
                onClick={() => {/* Belly Breathing selection */}}
                style={{ padding: '8px 16px', borderRadius: '4px', border: technique === 'belly' ? '2px solid blue' : '1px solid gray' }}
              >
                Belly Breathing
              </button>
              <button 
                className={technique === 'guided' ? 'selected' : ''}
                onClick={() => {/* 5-5-5 Breathing selection */}}
                style={{ padding: '8px 16px', borderRadius: '4px', border: technique === 'guided' ? '2px solid blue' : '1px solid gray' }}
              >
                5-5-5 Breathing
              </button>
            </div>
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
              data-testid="breathing-circle"
              className={phase === 'inhale' ? 'inhaling' : phase === 'exhale' ? 'exhaling' : ''}
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
            <div 
              data-testid="timer-display"
              style={{
                fontSize: '48px',
                fontWeight: '300',
                color: getPhaseColor(),
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {seconds}
            </div>

            {/* Phase label */}
            <div 
              role="status" 
              aria-live="polite"
              style={{
                fontSize: '18px',
                fontWeight: '500',
                color: 'var(--safe-gray-700)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginTop: 'var(--safe-space-sm)',
              }}
            >
              {isActive ? (phase === 'inhale' ? 'Breathe In' : phase === 'hold' ? 'Hold' : phase === 'exhale' ? 'Breathe Out' : 'Rest') : phase}
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
        
        {/* Progress indicator */}
        {isActive && (
          <div data-testid="progress-bar" style={{
            width: '200px',
            height: '4px',
            backgroundColor: 'var(--safe-gray-200)',
            borderRadius: '2px',
            marginBottom: 'var(--safe-space-lg)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((pattern[phase] - seconds) / pattern[phase]) * 100}%`,
              height: '100%',
              backgroundColor: getPhaseColor(),
              transition: 'width 1s linear'
            }} />
          </div>
        )}

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: 'var(--safe-space-md)',
          justifyContent: 'center',
        }}>
          {!isActive ? (
            <button
              onClick={startExercise}
              role="button"
              aria-label="Start breathing exercise"
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
              Start
            </button>
          ) : (
            <>
              <button
                onClick={stopExercise}
                role="button"
                aria-label="Pause breathing exercise"
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
                  marginRight: '8px'
                }}
              >
                Pause
              </button>
              <button
                onClick={() => { stopExercise(); setShowInstructions(true); }}
                role="button"
                aria-label="Stop breathing exercise"
                style={{
                  background: 'var(--safe-gray-300)',
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
                Stop
              </button>
            </>
          )}
        </div>

        {/* Cycle counter and completion */}
        {cycles > 0 && (
          <div style={{
            marginTop: 'var(--safe-space-lg)',
            color: 'var(--safe-gray-500)',
            fontSize: '14px',
          }}>
            Cycles completed: {cycles}
          </div>
        )}
        
        {/* Cycle count controls */}
        <div style={{
          marginTop: 'var(--safe-space-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: 'var(--safe-gray-600)'
        }}>
          <button 
            onClick={() => defaultCycles > 1 && setShowInstructions(true)}
            role="button"
            aria-label="Decrease cycles"
            disabled={defaultCycles <= 1}
            style={{ padding: '4px 8px', background: 'var(--safe-gray-200)', border: 'none', borderRadius: '4px' }}
          >
            -
          </button>
          <span>{defaultCycles} cycles</span>
          <button 
            onClick={() => setShowInstructions(true)}
            role="button"
            aria-label="Increase cycles"
            style={{ padding: '4px 8px', background: 'var(--safe-gray-200)', border: 'none', borderRadius: '4px' }}
          >
            +
          </button>
        </div>
        
        {/* Completion message */}
        {cycles >= defaultCycles && !isActive && (
          <div style={{
            marginTop: 'var(--safe-space-lg)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--safe-success)', fontWeight: '600', marginBottom: '8px' }}>Great job!</p>
            <button
              onClick={() => { setCycles(0); setPhase('inhale'); setSeconds(0); }}
              role="button"
              aria-label="Continue breathing exercise"
              style={{
                background: 'var(--safe-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--safe-radius-md)',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreathingExerciseOverlay;