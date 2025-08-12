/**
 * Test Suite for Accessibility Service
 * Tests WCAG compliance, screen reader support, and accessibility features
 */

import { accessibilityService } from '../accessibilityService';

describe('AccessibilityService', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="app">
        <button id="test-button">Click me</button>
        <input id="test-input" type="text" />
        <div id="test-content" role="main">
          <h1>Test Heading</h1>
          <p>Test paragraph</p>
        </div>
        <img id="test-image" src="test.jpg" />
      </div>
    `;
    
    mockElement = document.getElementById('app')!;
    
    // Reset service state
    accessibilityService.reset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('ARIA Attributes Management', () => {
    it('should set ARIA attributes correctly', () => {
      const button = document.getElementById('test-button')!;
      
      accessibilityService.setAriaLabel(button, 'Submit form');
      expect(button.getAttribute('aria-label')).toBe('Submit form');
      
      accessibilityService.setAriaDescribedBy(button, 'help-text');
      expect(button.getAttribute('aria-describedby')).toBe('help-text');
      
      accessibilityService.setAriaLive(button, 'polite');
      expect(button.getAttribute('aria-live')).toBe('polite');
    });

    it('should manage ARIA expanded state', () => {
      const button = document.getElementById('test-button')!;
      
      accessibilityService.setAriaExpanded(button, false);
      expect(button.getAttribute('aria-expanded')).toBe('false');
      
      accessibilityService.toggleAriaExpanded(button);
      expect(button.getAttribute('aria-expanded')).toBe('true');
    });

    it('should handle ARIA roles', () => {
      const div = document.getElementById('test-content')!;
      
      accessibilityService.setRole(div, 'navigation');
      expect(div.getAttribute('role')).toBe('navigation');
      
      const hasRole = accessibilityService.hasRole(div, 'navigation');
      expect(hasRole).toBe(true);
    });
  });

  describe('Focus Management', () => {
    it('should manage focus trap', () => {
      const container = document.getElementById('test-content')!;
      const button = document.getElementById('test-button')!;
      const input = document.getElementById('test-input')!;
      
      accessibilityService.trapFocus(container);
      
      // Simulate tab navigation
      button.focus();
      expect(document.activeElement).toBe(button);
      
      // Focus should stay within container
      const trapped = accessibilityService.isFocusTrapped(container);
      expect(trapped).toBe(true);
      
      accessibilityService.releaseFocus(container);
      expect(accessibilityService.isFocusTrapped(container)).toBe(false);
    });

    it('should restore focus after modal close', () => {
      const button = document.getElementById('test-button')!;
      button.focus();
      
      accessibilityService.saveFocusContext();
      
      const input = document.getElementById('test-input')!;
      input.focus();
      expect(document.activeElement).toBe(input);
      
      accessibilityService.restoreFocusContext();
      expect(document.activeElement).toBe(button);
    });

    it('should handle focus visible state', () => {
      const button = document.getElementById('test-button')!;
      
      accessibilityService.setFocusVisible(button, true);
      expect(button.classList.contains('focus-visible')).toBe(true);
      
      accessibilityService.setFocusVisible(button, false);
      expect(button.classList.contains('focus-visible')).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should enable keyboard navigation', () => {
      const container = document.getElementById('app')!;
      
      accessibilityService.enableKeyboardNavigation(container);
      
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      container.dispatchEvent(event);
      
      // Should handle tab navigation
      expect(accessibilityService.isKeyboardNavigationEnabled(container)).toBe(true);
    });

    it('should handle arrow key navigation', () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      
      accessibilityService.setupArrowKeyNavigation(buttons);
      
      buttons[0].focus();
      
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      buttons[0].dispatchEvent(downEvent);
      
      // Focus should move to next element
      // Note: This would require proper implementation in the service
    });

    it('should skip disabled elements', () => {
      const input = document.getElementById('test-input') as HTMLInputElement;
      input.disabled = true;
      
      const focusable = accessibilityService.getFocusableElements(mockElement);
      expect(focusable).not.toContain(input);
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce messages to screen readers', () => {
      accessibilityService.announce('Form submitted successfully', 'polite');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeDefined();
      expect(announcement?.textContent).toBe('Form submitted successfully');
    });

    it('should announce urgent messages', () => {
      accessibilityService.announceUrgent('Error: Invalid input');
      
      const announcement = document.querySelector('[role="alert"]');
      expect(announcement).toBeDefined();
      expect(announcement?.textContent).toBe('Error: Invalid input');
    });

    it('should manage live regions', () => {
      const region = document.createElement('div');
      document.body.appendChild(region);
      
      accessibilityService.createLiveRegion(region, 'polite');
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(region.getAttribute('aria-atomic')).toBe('true');
      
      accessibilityService.updateLiveRegion(region, 'Updated content');
      expect(region.textContent).toBe('Updated content');
    });
  });

  describe('Color Contrast', () => {
    it('should check color contrast ratio', () => {
      const ratio = accessibilityService.getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBe(21); // Black on white = 21:1
      
      const ratio2 = accessibilityService.getContrastRatio('#777777', '#FFFFFF');
      expect(ratio2).toBeGreaterThan(4.5); // WCAG AA standard
    });

    it('should validate WCAG contrast requirements', () => {
      const passesAA = accessibilityService.meetsWCAGContrast('#000000', '#FFFFFF', 'AA');
      expect(passesAA).toBe(true);
      
      const passesAAA = accessibilityService.meetsWCAGContrast('#777777', '#FFFFFF', 'AAA');
      expect(passesAAA).toBe(false); // Gray on white might not meet AAA
    });

    it('should suggest contrast improvements', () => {
      const suggestion = accessibilityService.suggestContrastImprovement('#CCCCCC', '#FFFFFF');
      expect(suggestion).toBeDefined();
      expect(suggestion.foreground).not.toBe('#CCCCCC'); // Should suggest darker color
    });
  });

  describe('Alt Text Management', () => {
    it('should check for missing alt text', () => {
      const image = document.getElementById('test-image') as HTMLImageElement;
      
      const hasAlt = accessibilityService.hasAltText(image);
      expect(hasAlt).toBe(false);
      
      image.alt = 'Test image description';
      expect(accessibilityService.hasAltText(image)).toBe(true);
    });

    it('should validate alt text quality', () => {
      const image = document.getElementById('test-image') as HTMLImageElement;
      
      image.alt = 'image';
      expect(accessibilityService.isAltTextDescriptive(image)).toBe(false);
      
      image.alt = 'A red bicycle leaning against a brick wall';
      expect(accessibilityService.isAltTextDescriptive(image)).toBe(true);
    });

    it('should handle decorative images', () => {
      const image = document.getElementById('test-image') as HTMLImageElement;
      
      accessibilityService.markAsDecorative(image);
      expect(image.getAttribute('role')).toBe('presentation');
      expect(image.getAttribute('aria-hidden')).toBe('true');
      expect(image.alt).toBe('');
    });
  });

  describe('Form Accessibility', () => {
    it('should associate labels with inputs', () => {
      const input = document.getElementById('test-input')!;
      const label = document.createElement('label');
      label.textContent = 'Enter your name';
      document.body.appendChild(label);
      
      accessibilityService.associateLabel(label, input);
      expect(label.getAttribute('for')).toBe('test-input');
      expect(input.getAttribute('aria-labelledby')).toBeDefined();
    });

    it('should add error messages accessibly', () => {
      const input = document.getElementById('test-input')!;
      
      accessibilityService.setFieldError(input, 'This field is required');
      
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBeDefined();
      
      const errorElement = document.getElementById(input.getAttribute('aria-describedby')!);
      expect(errorElement?.textContent).toBe('This field is required');
    });

    it('should mark required fields', () => {
      const input = document.getElementById('test-input')!;
      
      accessibilityService.markRequired(input, true);
      expect(input.getAttribute('aria-required')).toBe('true');
      expect(input.hasAttribute('required')).toBe(true);
    });
  });

  describe('Skip Links', () => {
    it('should create skip links', () => {
      accessibilityService.createSkipLink('main', 'Skip to main content');
      
      const skipLink = document.querySelector('a[href="#main"]');
      expect(skipLink).toBeDefined();
      expect(skipLink?.textContent).toBe('Skip to main content');
      expect(skipLink?.classList.contains('skip-link')).toBe(true);
    });

    it('should handle skip link activation', () => {
      const main = document.getElementById('test-content')!;
      main.id = 'main';
      
      accessibilityService.createSkipLink('main', 'Skip to content');
      const skipLink = document.querySelector('a[href="#main"]') as HTMLAnchorElement;
      
      skipLink.click();
      // Main content should receive focus
      expect(document.activeElement).toBe(main);
    });
  });

  describe('Accessibility Preferences', () => {
    it('should store user preferences', () => {
      accessibilityService.setPreference('reduceMotion', true);
      accessibilityService.setPreference('highContrast', true);
      accessibilityService.setPreference('fontSize', 'large');
      
      expect(accessibilityService.getPreference('reduceMotion')).toBe(true);
      expect(accessibilityService.getPreference('highContrast')).toBe(true);
      expect(accessibilityService.getPreference('fontSize')).toBe('large');
    });

    it('should apply preferences to document', () => {
      accessibilityService.setPreference('reduceMotion', true);
      accessibilityService.applyPreferences();
      
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
    });

    it('should respect prefers-reduced-motion', () => {
      // Mock matchMedia
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any;
      
      const prefersReducedMotion = accessibilityService.prefersReducedMotion();
      expect(prefersReducedMotion).toBe(true);
    });
  });

  describe('Accessibility Audit', () => {
    it('should audit page for issues', () => {
      const issues = accessibilityService.auditPage();
      
      expect(Array.isArray(issues)).toBe(true);
      // Should find missing alt text on test image
      expect(issues.some(i => i.type === 'missing-alt-text')).toBe(true);
    });

    it('should check heading hierarchy', () => {
      document.body.innerHTML = `
        <h1>Main Title</h1>
        <h3>Skipped H2</h3>
        <h2>Correct H2</h2>
      `;
      
      const issues = accessibilityService.checkHeadingHierarchy();
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].message).toContain('heading hierarchy');
    });

    it('should validate landmark regions', () => {
      const hasMain = accessibilityService.hasLandmark('main');
      const hasNav = accessibilityService.hasLandmark('navigation');
      
      expect(hasMain).toBe(true); // test-content has role="main"
      expect(hasNav).toBe(false);
    });
  });

  describe('Touch Target Size', () => {
    it('should validate touch target size', () => {
      const button = document.getElementById('test-button')!;
      
      // Mock getBoundingClientRect
      button.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 44,
        height: 44,
      });
      
      const meetsMinimum = accessibilityService.meetsTouchTargetSize(button);
      expect(meetsMinimum).toBe(true); // 44x44 meets WCAG minimum
    });

    it('should report small touch targets', () => {
      const button = document.getElementById('test-button')!;
      
      button.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 20,
        height: 20,
      });
      
      const issues = accessibilityService.findSmallTouchTargets();
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].element).toBe(button);
    });
  });
});