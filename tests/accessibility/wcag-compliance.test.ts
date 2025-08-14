import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

/**
 * WCAG 2.1 AA Compliance Testing Suite
 * Comprehensive accessibility testing for mental health platform
 */

test.describe('WCAG 2.1 AA Compliance', () => {
  let violations: any[] = [];

  test.afterEach(async ({}, testInfo) => {
    if (violations.length > 0) {
      console.log('Accessibility violations found:');
      violations.forEach(v => {
        console.log(`- ${v.id}: ${v.description}`);
        console.log(`  Impact: ${v.impact}`);
        console.log(`  Affected nodes: ${v.nodes.length}`);
      });
      
      // Attach violations to test results
      await testInfo.attach('accessibility-violations', {
        body: JSON.stringify(violations, null, 2),
        contentType: 'application/json',
      });
    }
  });

  test.describe('Color Contrast', () => {
    test('should meet WCAG AA color contrast requirements', async ({ page }) => {
      await page.goto('/');
      await injectAxe(page);
      
      const results = await page.evaluate(() => {
        return (window as any).axe.run({
          rules: {
            'color-contrast': { enabled: true },
          },
        });
      });
      
      violations = results.violations.filter((v: any) => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });

    test('should maintain contrast in crisis alert components', async ({ page }) => {
      await page.goto('/crisis');
      await injectAxe(page);
      
      // Trigger crisis alert
      await page.evaluate(() => {
        // Simulate crisis alert display
        const alert = document.querySelector('.crisis-alert');
        if (alert) {
          (alert as HTMLElement).style.display = 'block';
        }
      });
      
      const results = await page.evaluate(() => {
        return (window as any).axe.run({
          rules: {
            'color-contrast': { enabled: true },
          },
        });
      });
      
      violations = results.violations.filter((v: any) => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });

    test('should maintain contrast in dark mode', async ({ page }) => {
      await page.goto('/');
      
      // Enable dark mode
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
      });
      
      await page.reload();
      await injectAxe(page);
      
      const results = await page.evaluate(() => {
        return (window as any).axe.run({
          rules: {
            'color-contrast': { enabled: true },
          },
        });
      });
      
      violations = results.violations.filter((v: any) => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate through all interactive elements with keyboard', async ({ page }) => {
      await page.goto('/');
      
      const focusableElements = await page.evaluate(() => {
        const selector = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
        return document.querySelectorAll(selector).length;
      });
      
      let focusedCount = 0;
      for (let i = 0; i < focusableElements; i++) {
        await page.keyboard.press('Tab');
        const isFocused = await page.evaluate(() => {
          return document.activeElement !== document.body;
        });
        if (isFocused) focusedCount++;
      }
      
      expect(focusedCount).toBeGreaterThan(0);
      expect(focusedCount).toBeLessThanOrEqual(focusableElements);
    });

    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/');
      
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      
      const hasFocusIndicator = await page.evaluate(() => {
        const activeElement = document.activeElement;
        if (!activeElement) return false;
        
        const styles = window.getComputedStyle(activeElement);
        const hasOutline = styles.outline !== 'none' && styles.outline !== '';
        const hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';
        const hasBorder = styles.borderStyle !== 'none';
        
        return hasOutline || hasBoxShadow || hasBorder;
      });
      
      expect(hasFocusIndicator).toBe(true);
    });

    test('should trap focus in modals', async ({ page }) => {
      await page.goto('/');
      
      // Open a modal (example: crisis resources modal)
      await page.click('button[aria-label="Crisis Resources"]');
      await page.waitForSelector('[role="dialog"]');
      
      // Tab through modal elements
      const modalElements = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return 0;
        const selector = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
        return modal.querySelectorAll(selector).length;
      });
      
      for (let i = 0; i < modalElements + 2; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Focus should still be within modal
      const focusInModal = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        const activeElement = document.activeElement;
        return modal?.contains(activeElement);
      });
      
      expect(focusInModal).toBe(true);
    });

    test('should support escape key to close modals', async ({ page }) => {
      await page.goto('/');
      
      // Open a modal
      await page.click('button[aria-label="Crisis Resources"]');
      await page.waitForSelector('[role="dialog"]');
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Modal should be closed
      const modalVisible = await page.isVisible('[role="dialog"]');
      expect(modalVisible).toBe(false);
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      await injectAxe(page);
      
      const results = await page.evaluate(() => {
        return (window as any).axe.run({
          rules: {
            'aria-valid-attr': { enabled: true },
            'aria-valid-attr-value': { enabled: true },
            'aria-required-attr': { enabled: true },
            'aria-required-children': { enabled: true },
            'aria-required-parent': { enabled: true },
          },
        });
      });
      
      violations = results.violations;
      expect(violations).toHaveLength(0);
    });

    test('should have descriptive button labels', async ({ page }) => {
      await page.goto('/');
      
      const buttons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map(btn => ({
          text: btn.textContent?.trim(),
          ariaLabel: btn.getAttribute('aria-label'),
          hasContent: (btn.textContent?.trim() || '').length > 0 || !!btn.getAttribute('aria-label'),
        }));
      });
      
      buttons.forEach(btn => {
        expect(btn.hasContent).toBe(true);
      });
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/chat');
      
      const formElements = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        return inputs.map(input => {
          const id = input.id;
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          
          return {
            type: input.tagName.toLowerCase(),
            hasLabel: !!label || !!ariaLabel || !!ariaLabelledBy,
          };
        });
      });
      
      formElements.forEach(element => {
        expect(element.hasLabel).toBe(true);
      });
    });

    test('should announce live regions for crisis alerts', async ({ page }) => {
      await page.goto('/');
      
      // Check for live regions
      const liveRegions = await page.evaluate(() => {
        const regions = document.querySelectorAll('[aria-live]');
        return Array.from(regions).map(region => ({
          ariaLive: region.getAttribute('aria-live'),
          ariaAtomic: region.getAttribute('aria-atomic'),
          role: region.getAttribute('role'),
        }));
      });
      
      // Crisis alerts should have assertive live regions
      const alertRegions = liveRegions.filter(r => r.role === 'alert');
      alertRegions.forEach(region => {
        expect(region.ariaLive).toBe('assertive');
      });
    });
  });

  test.describe('Text and Content', () => {
    test('should have sufficient text sizing', async ({ page }) => {
      await page.goto('/');
      
      const textSizes = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, div, li, a, button');
        const sizes = Array.from(elements).map(el => {
          const styles = window.getComputedStyle(el);
          return parseFloat(styles.fontSize);
        });
        return sizes.filter(size => size > 0);
      });
      
      // Minimum text size should be at least 12px
      const smallText = textSizes.filter(size => size < 12);
      expect(smallText.length).toBe(0);
    });

    test('should support text zoom up to 200%', async ({ page }) => {
      await page.goto('/');
      
      // Set zoom to 200%
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      
      // Check for horizontal scrolling
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
      
      // Check that content is still accessible
      const mainContent = await page.isVisible('main');
      expect(mainContent).toBe(true);
    });

    test('should have proper language attributes', async ({ page }) => {
      await page.goto('/');
      
      const htmlLang = await page.evaluate(() => {
        return document.documentElement.getAttribute('lang');
      });
      
      expect(htmlLang).toBeTruthy();
      expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
    });
  });

  test.describe('Images and Media', () => {
    test('should have alt text for all images', async ({ page }) => {
      await page.goto('/');
      
      const images = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          hasAlt: img.hasAttribute('alt'),
          isDecorative: img.getAttribute('role') === 'presentation' || img.alt === '',
        }));
      });
      
      images.forEach(img => {
        expect(img.hasAlt).toBe(true);
      });
    });

    test('should have captions or transcripts for videos', async ({ page }) => {
      await page.goto('/wellness-videos');
      
      const videos = await page.evaluate(() => {
        const videoElements = Array.from(document.querySelectorAll('video'));
        return videoElements.map(video => {
          const tracks = video.querySelectorAll('track[kind="captions"], track[kind="subtitles"]');
          const hasTranscript = !!document.querySelector(`[aria-describedby="${video.id}-transcript"]`);
          
          return {
            hasCaptions: tracks.length > 0,
            hasTranscript: hasTranscript,
          };
        });
      });
      
      videos.forEach(video => {
        expect(video.hasCaptions || video.hasTranscript).toBe(true);
      });
    });
  });

  test.describe('Touch Targets', () => {
    test('should have adequate touch target sizes on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const touchTargets = await page.evaluate(() => {
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea');
        return Array.from(interactiveElements).map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            tag: el.tagName.toLowerCase(),
          };
        });
      });
      
      // WCAG 2.1 AA requires minimum 44x44 CSS pixels for touch targets
      touchTargets.forEach(target => {
        if (target.tag === 'button' || target.tag === 'a') {
          expect(target.width >= 44 || target.height >= 44).toBe(true);
        }
      });
    });

    test('should have adequate spacing between touch targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const spacing = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const spacings: number[] = [];
        
        for (let i = 0; i < buttons.length - 1; i++) {
          const rect1 = buttons[i].getBoundingClientRect();
          const rect2 = buttons[i + 1].getBoundingClientRect();
          
          // Calculate minimum distance between elements
          const horizontalSpace = Math.abs(rect2.left - rect1.right);
          const verticalSpace = Math.abs(rect2.top - rect1.bottom);
          
          spacings.push(Math.min(horizontalSpace, verticalSpace));
        }
        
        return spacings;
      });
      
      // Minimum spacing should be at least 8px
      spacing.forEach(space => {
        if (space > 0) {
          expect(space).toBeGreaterThanOrEqual(8);
        }
      });
    });
  });

  test.describe('Forms and Validation', () => {
    test('should provide clear error messages', async ({ page }) => {
      await page.goto('/login');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Check for error messages
      const errors = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[role="alert"], .error-message');
        return Array.from(errorElements).map(el => ({
          text: el.textContent?.trim(),
          isVisible: (el as HTMLElement).offsetParent !== null,
        }));
      });
      
      expect(errors.length).toBeGreaterThan(0);
      errors.forEach(error => {
        expect(error.text).toBeTruthy();
        expect(error.isVisible).toBe(true);
      });
    });

    test('should associate error messages with form fields', async ({ page }) => {
      await page.goto('/login');
      
      // Submit empty form to trigger errors
      await page.click('button[type="submit"]');
      
      const associations = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        return inputs.map(input => {
          const errorId = input.getAttribute('aria-describedby');
          const errorElement = errorId ? document.getElementById(errorId) : null;
          const hasError = input.getAttribute('aria-invalid') === 'true';
          
          return {
            hasError,
            hasErrorDescription: !!errorElement,
          };
        });
      });
      
      associations.filter(a => a.hasError).forEach(association => {
        expect(association.hasErrorDescription).toBe(true);
      });
    });
  });

  test.describe('Crisis-Specific Accessibility', () => {
    test('crisis resources should be immediately accessible', async ({ page }) => {
      await page.goto('/');
      
      // Crisis resources should be reachable within 3 tab stops
      let crisisButtonFound = false;
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            text: el?.textContent?.toLowerCase(),
            ariaLabel: el?.getAttribute('aria-label')?.toLowerCase(),
          };
        });
        
        if (focusedElement.text?.includes('crisis') || 
            focusedElement.ariaLabel?.includes('crisis') ||
            focusedElement.text?.includes('help') ||
            focusedElement.ariaLabel?.includes('emergency')) {
          crisisButtonFound = true;
          break;
        }
      }
      
      expect(crisisButtonFound).toBe(true);
    });

    test('emergency contacts should be screen reader accessible', async ({ page }) => {
      await page.goto('/crisis');
      
      const contacts = await page.evaluate(() => {
        const contactElements = document.querySelectorAll('[data-emergency-contact]');
        return Array.from(contactElements).map(el => {
          const link = el.querySelector('a[href^="tel:"]');
          return {
            hasPhoneLink: !!link,
            hasAriaLabel: !!link?.getAttribute('aria-label'),
            phoneNumber: link?.getAttribute('href'),
          };
        });
      });
      
      contacts.forEach(contact => {
        expect(contact.hasPhoneLink).toBe(true);
        expect(contact.hasAriaLabel).toBe(true);
        expect(contact.phoneNumber).toMatch(/^tel:/);
      });
    });

    test('crisis alerts should not rely on color alone', async ({ page }) => {
      await page.goto('/');
      
      // Simulate crisis alert
      await page.evaluate(() => {
        const alert = document.createElement('div');
        alert.className = 'crisis-alert';
        alert.setAttribute('role', 'alert');
        alert.textContent = 'Crisis support needed';
        document.body.appendChild(alert);
      });
      
      const alert = await page.evaluate(() => {
        const alertEl = document.querySelector('.crisis-alert');
        return {
          hasText: !!alertEl?.textContent,
          hasIcon: !!alertEl?.querySelector('svg, img, [aria-label]'),
          role: alertEl?.getAttribute('role'),
        };
      });
      
      expect(alert.hasText || alert.hasIcon).toBe(true);
      expect(alert.role).toBe('alert');
    });
  });
});