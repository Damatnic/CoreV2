import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/safe-ui-system.css';

interface QuickExitButtonProps {
  redirectUrl?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  hotkey?: string; // e.g., 'Escape' or 'x'
  onExit?: () => void;
  shortcutKey?: string; // Alternative shortcut key
  shortcutCount?: number; // Number of times to press shortcut
  buttonText?: string; // Custom button text
  className?: string; // Custom CSS class
  size?: 'small' | 'medium' | 'large'; // Button size variant
  clearCookies?: jest.MockedFunction<any> | (() => void); // Function to clear cookies
  clearHistory?: boolean; // Whether to clear browser history
  fallbackUrl?: string; // Fallback URL if main redirect fails
}

export const QuickExitButton: React.FC<QuickExitButtonProps> = ({
  redirectUrl = 'https://www.google.com',
  position = 'top-left',
  hotkey = 'Escape',
  onExit,
  shortcutKey,
  shortcutCount = 1,
  buttonText = 'Quick Exit',
  className = '',
  size = 'medium',
  clearCookies,
  clearHistory = true,
  fallbackUrl = 'https://news.google.com'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [exitCountdown, setExitCountdown] = useState<number | null>(null);

  const handleQuickExit = useCallback(() => {
    // Clear browsing data if possible
    try {
      // Clear session storage
      sessionStorage.clear();
      
      // Clear cookies if function provided
      if (clearCookies) {
        clearCookies();
      }
      
      // Clear browser history if enabled
      if (clearHistory) {
        // Add to history to prevent back button
        window.history.pushState(null, '', window.location.href);
        window.history.pushState(null, '', window.location.href);
        window.history.pushState(null, '', window.location.href);
      }
      
      // Call custom exit handler if provided
      if (onExit) {
        onExit();
      }
      
      // Navigate to safe site
      window.location.replace(redirectUrl);
    } catch (error) {
      // Fallback to alternative URL if main redirect fails
      console.error('Quick exit error:', error);
      try {
        window.location.replace(fallbackUrl);
      } catch (fallbackError) {
        console.error('Fallback exit error:', fallbackError);
        // Final fallback
        window.location.replace('https://www.google.com');
      }
    }
  }, [redirectUrl, onExit, clearCookies, clearHistory, fallbackUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    let keyPressCount = 0;
    let lastKeyPress = 0;

    const handleKeyPress = (e: KeyboardEvent) => {
      const now = Date.now();
      const primaryKey = e.key === hotkey || (e.key === 'x' && e.altKey);
      const alternativeKey = shortcutKey && e.key === shortcutKey;

      if (primaryKey || alternativeKey) {
        e.preventDefault();
        
        // Reset count if too much time has passed
        if (now - lastKeyPress > 2000) {
          keyPressCount = 0;
        }
        
        keyPressCount++;
        lastKeyPress = now;
        
        const requiredCount = alternativeKey ? shortcutCount : 1;
        
        if (keyPressCount >= requiredCount) {
          handleQuickExit();
          keyPressCount = 0;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [hotkey, shortcutKey, shortcutCount, handleQuickExit]);

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

  // Create CSS classes for the button
  const getButtonClasses = () => {
    const classes = ['quick-exit-button'];
    if (className) classes.push(className);
    if (size) classes.push(`size-${size}`);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) classes.push('mobile-size');
    return classes.join(' ');
  };

  // Get button styling based on size
  const getButtonStyles = () => {
    let padding = '10px 16px';
    let fontSize = '14px';
    let minWidth = '120px';

    if (size === 'small') {
      padding = '6px 12px';
      fontSize = '12px';
      minWidth = '100px';
    } else if (size === 'large') {
      padding = '14px 20px';
      fontSize = '16px';
      minWidth = '140px';
    }

    return { padding, fontSize, minWidth };
  };

  const buttonStyles = getButtonStyles();

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
        className={getButtonClasses()}
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
          padding: buttonStyles.padding,
          fontSize: buttonStyles.fontSize,
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: 'var(--safe-shadow-lg)',
          transition: 'all 0.2s ease-out',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: buttonStyles.minWidth,
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
            : buttonText}
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
            }}>{hotkey}</kbd>
            {shortcutKey && (
              <>
                {' '}or <kbd style={{
                  background: 'var(--safe-gray-600)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  margin: '0 4px',
                  fontSize: '12px',
                }}>{shortcutKey}</kbd>
                {shortcutCount > 1 && ` ${shortcutCount} times`}
              </>
            )}
            {' '}or click this button to immediately leave the site
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