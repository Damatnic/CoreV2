import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  className = ""
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <output className={`loading-spinner-container glass-card smooth-transition animate-float ${className}`} aria-live="polite">
      <div className="therapy-spinner">
        <div className={`loading-dots ${sizeClasses[size]}`}>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
        </div>
      </div>
      {message && (
        <p className="loading-message gradient-text animate-gradient">
          <span className="sr-only">Loading: </span>
          {message}
        </p>
      )}
    </output>
  );
};

export { LoadingSpinner };
export default LoadingSpinner;
