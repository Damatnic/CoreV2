import { ScreenReaderService } from '../screenReaderService';

describe('ScreenReaderService', () => {
  let service: ScreenReaderService;
  const mockAriaLiveRegion = document.createElement('div');

  beforeEach(() => {
    service = new ScreenReaderService();
    jest.clearAllMocks();
    
    // Mock DOM methods
    document.createElement = jest.fn().mockReturnValue(mockAriaLiveRegion);
    document.body.appendChild = jest.fn();
    document.getElementById = jest.fn().mockReturnValue(mockAriaLiveRegion);
  });

  describe('initialization', () => {
    it('should initialize ARIA live regions', async () => {
      await service.initialize();
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should detect screen reader presence', () => {
      // Mock screen reader detection
      Object.defineProperty(navigator, 'userAgent', {
        value: 'NVDA screen reader',
        writable: true
      });

      const detected = service.detectScreenReader();
      expect(detected.isPresent).toBe(true);
      expect(detected.type).toContain('nvda');
    });
  });

  describe('announcements', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should announce crisis alerts with high priority', async () => {
      await service.announceCrisisAlert('Crisis intervention available');

      expect(mockAriaLiveRegion.textContent).toBe('Crisis intervention available');
      expect(mockAriaLiveRegion.getAttribute('aria-live')).toBe('assertive');
    });

    it('should announce status updates', async () => {
      await service.announceStatus('Connection established');

      expect(mockAriaLiveRegion.textContent).toBe('Connection established');
      expect(mockAriaLiveRegion.getAttribute('aria-live')).toBe('polite');
    });

    it('should handle navigation announcements', async () => {
      await service.announceNavigation('Navigated to Crisis Resources page');

      expect(mockAriaLiveRegion.textContent).toContain('Crisis Resources');
    });
  });

  describe('focus management', () => {
    it('should manage focus for modals', () => {
      const modal = document.createElement('div');
      const focusableElement = document.createElement('button');
      modal.appendChild(focusableElement);
      
      focusableElement.focus = jest.fn();

      service.manageFocusForModal(modal);

      expect(focusableElement.focus).toHaveBeenCalled();
    });

    it('should restore focus after modal closes', () => {
      const originalElement = document.createElement('button');
      originalElement.focus = jest.fn();

      service.storeFocusForRestoration(originalElement);
      service.restoreFocus();

      expect(originalElement.focus).toHaveBeenCalled();
    });
  });

  describe('accessibility enhancements', () => {
    it('should enhance form accessibility', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      form.appendChild(input);

      service.enhanceFormAccessibility(form);

      expect(input.getAttribute('aria-describedby')).toBeDefined();
    });

    it('should add skip navigation links', () => {
      service.addSkipNavigationLinks();

      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('crisis-specific features', () => {
    it('should provide emergency keyboard shortcuts', () => {
      const shortcuts = service.getEmergencyKeyboardShortcuts();

      expect(shortcuts).toContain(expect.objectContaining({
        key: 'Ctrl+E',
        action: 'emergency_contacts'
      }));
    });

    it('should announce crisis escalation', async () => {
      await service.announceCrisisEscalation('High risk detected. Emergency resources activated.');

      expect(mockAriaLiveRegion.getAttribute('aria-live')).toBe('assertive');
      expect(mockAriaLiveRegion.textContent).toContain('High risk detected');
    });
  });
});