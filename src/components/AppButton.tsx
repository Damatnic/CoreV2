import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AppButtonProps {
  children?: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  'aria-label'?: string;
  icon?: React.ReactNode;
  enhanced?: boolean;
  iconOnly?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  style,
  icon,
  enhanced = true,
  iconOnly = false,
  'aria-label': ariaLabel,
}) => {
  const baseClass = enhanced ? 'btn-enhanced' : 'btn';
  const variantClass = enhanced ? variant : `btn-${variant}`;
  
  // Consistent size handling for both enhanced and legacy buttons
  let sizeClass = '';
  if (enhanced) {
    // Enhanced buttons use size as a class modifier
    sizeClass = size !== 'md' ? size : '';
  } else {
    // Legacy buttons use btn-size format
    sizeClass = size !== 'md' ? `btn-${size}` : '';
  }
  
  // Icon-only button handling
  const iconOnlyClass = iconOnly ? 'btn-icon-only' : '';
  
  const touchClasses = !enhanced ? 'touch-optimized touch-feedback touch-ripple' : '';
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    iconOnlyClass,
    touchClasses,
    className
  ].filter(Boolean).join(' ');

  // Ensure WCAG 2.1 AA compliance for touch targets
  const touchTargetStyle = {
    minHeight: '44px', // WCAG 2.1 AA touch target requirement
    minWidth: iconOnly ? '44px' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation', // Improve touch responsiveness
    ...style
  };

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={touchTargetStyle}
      aria-label={ariaLabel || (iconOnly && typeof children === 'string' ? children : undefined)}
    >
      {isLoading ? (
        <div className={`loading-spinner ${size !== 'md' ? size : ''}`}>
          <div className="loading-spinner-inner"></div>
        </div>
      ) : (
        <>
          {icon}
          {!iconOnly && children}
        </>
      )}
    </button>
  );
};