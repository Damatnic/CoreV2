const React = require('react');

// Simplified Card component to test
const Card = ({ 
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
  // Determine base class
  const baseClass = enhanced ? 'card-enhanced' : 'card';
  
  // Add variant class only when enhanced and variant is not 'default'
  const variantClass = enhanced && variant !== 'default' ? variant : '';
  
  // Add clickable class when onClick is provided
  const clickableClass = onClick ? 'card-clickable' : '';
  
  // Touch optimization - only add for non-enhanced interactive cards
  const touchClasses = onClick && !enhanced ? 'touch-optimized touch-feedback smooth-transition' : 'smooth-transition';
  
  const isInteractive = !!onClick;
  
  const classes = [
    baseClass,
    variantClass,
    clickableClass,
    touchClasses,
    className
  ].filter(Boolean).join(' ');
  
  console.log('Classes generated:', classes);
  console.log('Props:', { enhanced, variant, onClick: !!onClick, className });
  
  return React.createElement('div', {
    className: classes,
    style,
    onClick,
    role: role || (isInteractive ? 'button' : 'region'),
    tabIndex: isInteractive ? (tabIndex ?? 0) : undefined,
    'aria-label': ariaLabel,
    ...(isInteractive && { 'aria-pressed': 'false' })
  }, children);
};

// Test cases
console.log('\n=== Test 1: Default card (enhanced=true) ===');
const test1 = Card({ children: 'Test', enhanced: true });
console.log('Expected: card-enhanced smooth-transition');

console.log('\n=== Test 2: Legacy card (enhanced=false) ===');
const test2 = Card({ children: 'Test', enhanced: false });
console.log('Expected: card smooth-transition');

console.log('\n=== Test 3: With custom className ===');
const test3 = Card({ children: 'Test', className: 'custom-card' });
console.log('Expected: card-enhanced smooth-transition custom-card');

console.log('\n=== Test 4: Interactive legacy card ===');
const test4 = Card({ children: 'Test', onClick: () => {}, enhanced: false });
console.log('Expected: card card-clickable touch-optimized touch-feedback smooth-transition');

console.log('\n=== Test 5: Interactive enhanced card ===');
const test5 = Card({ children: 'Test', onClick: () => {}, enhanced: true });
console.log('Expected: card-enhanced card-clickable smooth-transition');
