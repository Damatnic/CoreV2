# PostCard Swipe Gestures Testing Guide

## Swipe Gesture Implementation Summary

### 🎯 Swipe Actions Configured
1. **Swipe Left** → Support action (👍)
   - Only available when: `!isHelperView && !isMyPostView`
   - Triggers: `handleSupportClick()` after 150ms delay
   - Visual: Green gradient background, left border, support icon

2. **Swipe Right** → Accept helper role (✅)
   - Only available when: `isHelperView && dilemma.status === 'active'`
   - Triggers: `onAcceptDilemma()` after 150ms delay
   - Visual: Blue gradient background, right border, accept icon

### 🔧 Technical Configuration
- **Threshold**: 100px minimum swipe distance
- **Velocity Threshold**: 0.5 for gesture recognition
- **Animation Duration**: 150ms delay before action execution
- **CSS Classes**: `swipe-support`, `swipe-accept` applied during gesture

### 📱 Touch Events Handling
- Uses `useSwipeRef` hook with touch event listeners
- `touchstart`, `touchmove`, `touchend` events tracked
- Calculates distance, velocity, and direction
- Prevents interference with scroll and other gestures

## Testing Checklist

### ✅ Visual Feedback Testing
- [ ] Swipe left shows green gradient background
- [ ] Swipe left shows 👍 icon on left side
- [ ] Swipe left applies `swipe-support` CSS class
- [ ] Swipe right shows blue gradient background (when applicable)
- [ ] Swipe right shows ✅ icon on right side (when applicable)
- [ ] Swipe right applies `swipe-accept` CSS class (when applicable)

### ✅ Gesture Recognition Testing
- [ ] Short swipes (<100px) don't trigger actions
- [ ] Slow swipes (<0.5 velocity) don't trigger actions
- [ ] Valid left swipes trigger support action
- [ ] Valid right swipes trigger accept action (helper view only)
- [ ] Vertical swipes don't interfere with scrolling
- [ ] Multiple quick swipes are handled correctly

### ✅ Context-Specific Behavior
- [ ] Support swipe only works in community feed (not helper view)
- [ ] Accept swipe only works in helper view for active dilemmas
- [ ] My posts don't respond to support swipes
- [ ] Resolved dilemmas don't respond to accept swipes

### ✅ Animation and Timing
- [ ] 150ms delay before action execution
- [ ] Smooth transform animations during swipe
- [ ] CSS classes removed after action completion
- [ ] No conflicting animations with other interactions

### ✅ Mobile Device Testing
- [ ] Works on iOS Safari (iPhone)
- [ ] Works on Android Chrome
- [ ] Works on various screen sizes
- [ ] Touch targets remain accessible during swipe
- [ ] No interference with native browser gestures

## Expected Sample Data Behavior

### Community Tab Posts:
1. **Anxiety Post** (supportCount: 12)
   - Swipe left → Support count increases to 13
   - Swipe right → No action (not helper view)

2. **Relationships Post** (supportCount: 8)
   - Swipe left → Support count increases to 9
   - Swipe right → No action (not helper view)

3. **Coping Strategies Post** (supportCount: 25)
   - Swipe left → Support count increases to 26
   - Swipe right → No action (not helper view)

### Helper View (if available):
- Swipe right → Accept helper role
- Swipe left → No action in helper context

## Browser Developer Tools Testing

### Console Commands for Testing:
```javascript
// Check if swipe gesture hook is working
console.log('Swipe gesture elements:', document.querySelectorAll('[class*="touch-optimized"]'));

// Verify CSS classes are applied during swipe
document.addEventListener('DOMNodeInserted', (e) => {
  if (e.target.className && e.target.className.includes('swipe-')) {
    console.log('Swipe class applied:', e.target.className);
  }
});

// Monitor touch events
document.addEventListener('touchstart', (e) => console.log('Touch start:', e.touches.length));
document.addEventListener('touchmove', (e) => console.log('Touch move:', e.touches[0].clientX));
document.addEventListener('touchend', (e) => console.log('Touch end'));
```

## Accessibility Considerations

### ✅ Screen Reader Support
- [ ] Swipe actions announced properly
- [ ] Touch targets remain focusable during swipe
- [ ] Alternative button access still available
- [ ] Reduced motion preferences respected

### ✅ Touch Target Compliance
- [ ] Minimum 44px touch targets maintained
- [ ] No overlap with other interactive elements
- [ ] Clear visual feedback for all actions
- [ ] Consistent behavior across devices

## Known Edge Cases

1. **Rapid successive swipes**: Should be throttled
2. **Partial swipes**: Should not trigger actions
3. **Diagonal swipes**: Should determine primary direction
4. **Device rotation**: Should maintain functionality
5. **Browser zoom**: Should scale appropriately

## Success Criteria

✅ **Basic Functionality**: Swipe gestures trigger appropriate actions
✅ **Visual Feedback**: Clear indication of available and active actions  
✅ **Performance**: Smooth animations without lag
✅ **Accessibility**: Usable by all users including assistive technology
✅ **Cross-platform**: Consistent behavior across devices and browsers
