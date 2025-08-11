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
    <output className={`loading-spinner-container ${className}`} aria-live="polite">
      <div 
        className={`loading-spinner ${sizeClasses[size]}`}
        aria-hidden="true"
      >
        <div className="loading-spinner-inner"></div>
      </div>
      {message && (
        <p className="loading-message">
          <span className="sr-only">Loading: </span>
          {message}
          <span className="loading-dots" aria-hidden="true"></span>
        </p>
      )}
    </output>
  );
};

export { LoadingSpinner };
export default LoadingSpinner;
