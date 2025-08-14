import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  enhanced?: boolean;
  variant?: 'default' | 'interactive' | 'glass' | 'elevated';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  style, 
  onClick, 
  role,
  tabIndex,
  enhanced = true,
  variant = 'default',
  'aria-label': ariaLabel 
}) => {
  const baseClass = enhanced ? 'card-enhanced' : 'card';
  const variantClass = enhanced && variant !== 'default' ? variant : '';
  const touchClasses = !enhanced && onClick ? 'touch-optimized touch-feedback' : '';
  const isInteractive = !!onClick;
  
  const classes = [
    baseClass,
    variantClass,
    touchClasses,
    className
  ].filter(Boolean).join(' ');
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(event as any as React.MouseEvent<HTMLDivElement>);
    }
  };
  
  return (
    <div 
      className={classes}
      style={style} 
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={role || (isInteractive ? 'button' : 'region')}
      tabIndex={isInteractive ? (tabIndex ?? 0) : undefined}
      aria-label={ariaLabel}
      {...(isInteractive && { 'aria-pressed': 'false' })}
    >
      {children}
    </div>
  );
};