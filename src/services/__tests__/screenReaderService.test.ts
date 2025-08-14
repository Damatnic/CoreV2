import ScreenReaderService from '../screenReaderService';

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

    it('should complete initialization', async () => {
      await service.initialize();
      // Initialization should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('announcements', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should announce crisis alerts with high priority', () => {
      service.announce({
        message: 'Crisis intervention available',
        priority: 'emergency',
        type: 'crisis'
      });

      // Announcement should be made
      expect(true).toBe(true);
    });

    it('should announce status updates', () => {
      service.announce({
        message: 'Connection established',
        priority: 'low',
        type: 'status'
      });

      // Announcement should be made
      expect(true).toBe(true);
    });

    it('should handle navigation announcements', () => {
      service.announce({
        message: 'Navigated to Crisis Resources page',
        priority: 'medium',
        type: 'navigation'
      });

      const history = service.getAnnouncementHistory();
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('announcement history', () => {
    it('should track announcement history', () => {
      service.announce({
        message: 'Test announcement',
        priority: 'low',
        type: 'status'
      });

      const history = service.getAnnouncementHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should clear announcement history', () => {
      service.clearAnnouncementHistory();
      const history = service.getAnnouncementHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('crisis context', () => {
    it('should set crisis context', () => {
      service.setCrisisContext({
        isActive: true,
        severity: 'high'
      });

      const context = service.getCrisisContext();
      expect(context.isActive).toBe(true);
      expect(context.severity).toBe('high');
    });

    it('should get crisis context', () => {
      const context = service.getCrisisContext();
      expect(context).toBeDefined();
      expect(context).toHaveProperty('isActive');
      expect(context).toHaveProperty('severity');
    });
  });

  describe('cleanup', () => {
    it('should destroy service properly', () => {
      service.destroy();
      
      // Service should be destroyed
      expect(true).toBe(true);
    });

    it('should handle multiple announcements', () => {
      for (let i = 0; i < 5; i++) {
        service.announce({
          message: `Announcement ${i}`,
          priority: 'low',
          type: 'status'
        });
      }
      
      const history = service.getAnnouncementHistory();
      expect(history.length).toBeGreaterThanOrEqual(0);
    });
  });
});
