import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/safe-ui-system.css';

interface QuickExitButtonProps {
  redirectUrl?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  hotkey?: string; // e.g., 'Escape' or 'x'
  onExit?: () => void;
}

export const QuickExitButton: React.FC<QuickExitButtonProps> = ({
  redirectUrl = 'https://www.google.com',
  position = 'top-left',
  hotkey = 'Escape',
  onExit
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [exitCountdown, setExitCountdown] = useState<number | null>(null);

  const handleQuickExit = useCallback(() => {
    // Clear browsing data if possible
    try {
      // Clear session storage
      sessionStorage.clear();
      
      // Add to history to prevent back button
      window.history.pushState(null, '', window.location.href);
      window.history.pushState(null, '', window.location.href);
      window.history.pushState(null, '', window.location.href);
      
      // Call custom exit handler if provided
      if (onExit) {
        onExit();
      }
      
      // Open new safe site and close current
      window.open(redirectUrl, '_newtab');
      window.location.replace(redirectUrl);
      
      // Try to close current window (may be blocked by browser)
      window.close();
    } catch (error) {
      // Fallback to simple redirect
      window.location.replace(redirectUrl);
    }
  }, [redirectUrl, onExit]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === hotkey || (e.key === 'x' && e.altKey)) {
        e.preventDefault();
        handleQuickExit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [hotkey, handleQuickExit]);

  // Show tooltip on first visit
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('quickExitTooltipSeen');
    if (!hasSeenTooltip) {
      setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem('quickExitTooltipSeen', 'true');
        }, 5000);
      }, 2000);
    }
  }, []);

  const getPositionStyles = () => {
    const base = { position: 'fixed' as const, zIndex: 9999 };
    switch(position) {
      case 'top-left':
        return { ...base, top: '20px', left: '20px' };
      case 'top-right':
        return { ...base, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { ...base, bottom: '20px', right: '20px' };
      default:
        return { ...base, top: '20px', left: '20px' };
    }
  };

  return (
    <>
      <button
        className="quick-exit-button"
        onClick={handleQuickExit}
        onMouseEnter={() => {
          setIsHovered(true);
          setExitCountdown(3);
          const interval = setInterval(() => {
            setExitCountdown(prev => {
              if (prev === null || prev <= 1) {
                clearInterval(interval);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setExitCountdown(null);
        }}
        aria-label="Quick exit - Leave site immediately"
        style={{
          ...getPositionStyles(),
          background: isHovered 
            ? 'var(--safe-error)' 
            : 'var(--safe-gray-700)',
          color: 'var(--safe-white)',
          border: 'none',
          borderRadius: 'var(--safe-radius-md)',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: 'var(--safe-shadow-lg)',
          transition: 'all 0.2s ease-out',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '120px',
        }}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3"
          style={{
            animation: isHovered ? 'pulse 0.5s infinite' : 'none',
          }}
        >
          <path d="M9 3l-6 6l6 6" />
          <path d="M3 9h12" />
          <path d="M21 3v18" />
        </svg>
        <span>
          {exitCountdown !== null 
            ? `Exit in ${exitCountdown}...` 
            : 'Quick Exit'}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            ...getPositionStyles(),
            top: position.includes('top') ? '70px' : 'auto',
            bottom: position.includes('bottom') ? '70px' : 'auto',
            background: 'var(--safe-gray-800)',
            color: 'var(--safe-white)',
            padding: '12px 16px',
            borderRadius: 'var(--safe-radius-md)',
            fontSize: '13px',
            maxWidth: '250px',
            boxShadow: 'var(--safe-shadow-xl)',
            animation: 'fadeIn 0.3s ease-out',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            Quick Exit Available
          </div>
          <div style={{ opacity: 0.9 }}>
            Press <kbd style={{
              background: 'var(--safe-gray-600)',
              padding: '2px 6px',
              borderRadius: '3px',
              margin: '0 4px',
              fontSize: '12px',
            }}>{hotkey}</kbd> or click this button to immediately leave the site
          </div>
          <div 
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              background: 'var(--safe-gray-800)',
              transform: 'rotate(45deg)',
              [position.includes('top') ? 'top' : 'bottom']: '-5px',
              [position.includes('left') ? 'left' : 'right']: '30px',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default QuickExitButton;