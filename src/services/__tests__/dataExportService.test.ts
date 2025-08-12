import DataExportService, { getDataExportService, useDataExport, ExportOptions, UserDataExport } from '../dataExportService';
import { renderHook, act } from '@testing-library/react';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  setItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Mock sessionStorage
const mockSessionStorage = {
  clear: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Mock URL and document for download functionality
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
};
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockReturnValue(mockLink),
});
Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild });
Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild });

describe('DataExportService', () => {
  let service: DataExportService;

  beforeEach(() => {
    service = new DataExportService();
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportUserData', () => {
    const mockOptions: ExportOptions = {
      format: 'json',
      includePersonalData: true,
      includeMoodData: false,
      includeActivityData: false,
      includeChatHistory: false,
      includeReflections: false,
      includeSettings: false,
    };

    it('should export data as JSON format', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'userId') return 'test-user-123';
        if (key === 'userPreferences') return JSON.stringify({ theme: 'dark' });
        if (key === 'userSettings') return JSON.stringify({ notifications: true });
        if (key === 'userProfile') return JSON.stringify({ name: 'Test User' });
        return null;
      });

      const blob = await service.exportUserData(mockOptions);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should export data as CSV format', async () => {
      const csvOptions: ExportOptions = {
        ...mockOptions,
        format: 'csv',
        includeMoodData: true,
        includeActivityData: true,
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'mood_analyses') return JSON.stringify([
          { timestamp: Date.now(), primary: 'happy', secondary: 'excited', intensity: 0.8, confidence: 0.9, keywords: ['joy', 'success'] }
        ]);
        if (key === 'userPosts') return JSON.stringify([
          { timestamp: Date.now(), content: 'Test post', mood: 'happy', supportCount: 5 }
        ]);
        return null;
      });

      const blob = await service.exportUserData(csvOptions);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv');
    });

    it('should export data as PDF format', async () => {
      const pdfOptions: ExportOptions = {
        ...mockOptions,
        format: 'pdf',
        includeMoodData: true,
        includeActivityData: true,
        includeChatHistory: true,
        includeReflections: true,
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'mood_analyses') return JSON.stringify([
          { timestamp: Date.now(), primary: 'happy', intensity: 0.8 }
        ]);
        if (key === 'userPosts') return JSON.stringify([{ timestamp: Date.now(), content: 'Test post' }]);
        if (key === 'aiChatHistory') return JSON.stringify([{ sessionId: '123' }]);
        if (key === 'userReflections') return JSON.stringify([{ timestamp: Date.now(), content: 'Reflection' }]);
        return null;
      });

      const blob = await service.exportUserData(pdfOptions);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
    });

    it('should throw error for unsupported format', async () => {
      const invalidOptions = { ...mockOptions, format: 'xml' as any };

      await expect(service.exportUserData(invalidOptions)).rejects.toThrow('Unsupported export format: xml');
    });

    it('should filter data by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const optionsWithDateRange: ExportOptions = {
        ...mockOptions,
        includeMoodData: true,
        dateRange: { start: yesterday, end: tomorrow }
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'mood_analyses') return JSON.stringify([
          { timestamp: now.getTime(), primary: 'happy' },
          { timestamp: now.getTime() - 48 * 60 * 60 * 1000, primary: 'sad' }, // 2 days ago, should be filtered out
        ]);
        return null;
      });

      const blob = await service.exportUserData(optionsWithDateRange);
      const text = await blob.text();
      const data = JSON.parse(text);

      expect(data.moodData.analyses).toHaveLength(1);
      expect(data.moodData.analyses[0].primary).toBe('happy');
    });
  });

  describe('gatherUserData', () => {
    it('should include user ID when includePersonalData is true', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'userId') return 'test-user-123';
        return null;
      });

      const options: ExportOptions = {
        format: 'json',
        includePersonalData: true,
        includeMoodData: false,
        includeActivityData: false,
        includeChatHistory: false,
        includeReflections: false,
        includeSettings: false,
      };

      // Access private method through any type casting
      const data = await (service as any).gatherUserData(options);

      expect(data.metadata.userId).toBe('test-user-123');
    });

    it('should not include user ID when includePersonalData is false', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-user-123');

      const options: ExportOptions = {
        format: 'json',
        includePersonalData: false,
        includeMoodData: false,
        includeActivityData: false,
        includeChatHistory: false,
        includeReflections: false,
        includeSettings: false,
      };

      const data = await (service as any).gatherUserData(options);

      expect(data.metadata.userId).toBeUndefined();
    });
  });

  describe('getStoredData', () => {
    it('should parse valid JSON data', () => {
      mockLocalStorage.getItem.mockReturnValue('{"key": "value"}');

      const result = (service as any).getStoredData('testKey');

      expect(result).toEqual({ key: 'value' });
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
    });

    it('should return null for invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = (service as any).getStoredData('testKey');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse stored data for testKey:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should return null when no data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = (service as any).getStoredData('testKey');

      expect(result).toBeNull();
    });
  });

  describe('filterByDateRange', () => {
    it('should return original data when no date range provided', () => {
      const data = [{ content: 'test' }];

      const result = (service as any).filterByDateRange(data);

      expect(result).toBe(data);
    });

    it('should return original data when data is not an array', () => {
      const data = 'not an array';

      const result = (service as any).filterByDateRange(data, { start: new Date(), end: new Date() });

      expect(result).toBe(data);
    });

    it('should filter data by timestamp field', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const data = [
        { timestamp: now.getTime(), content: 'today' },
        { timestamp: yesterday.getTime() - 24 * 60 * 60 * 1000, content: 'day before yesterday' },
        { timestamp: tomorrow.getTime(), content: 'tomorrow' }
      ];

      const result = (service as any).filterByDateRange(data, { start: yesterday, end: tomorrow });

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('today');
      expect(result[1].content).toBe('tomorrow');
    });
  });

  describe('calculateMoodPatterns', () => {
    it('should return null for empty data', () => {
      const result = (service as any).calculateMoodPatterns([]);

      expect(result).toBeNull();
    });

    it('should calculate dominant moods', () => {
      const moodData = [
        { primary: 'happy', timestamp: Date.now() },
        { primary: 'happy', timestamp: Date.now() },
        { primary: 'sad', timestamp: Date.now() },
      ];

      const result = (service as any).calculateMoodPatterns(moodData);

      expect(result.dominantMoods).toHaveLength(2);
      expect(result.dominantMoods[0].mood).toBe('happy');
      expect(result.dominantMoods[0].frequency).toBeCloseTo(0.67, 2);
      expect(result.totalEntries).toBe(3);
    });
  });

  describe('calculateMoodTrends', () => {
    it('should return null for insufficient data', () => {
      const result = (service as any).calculateMoodTrends([{ primary: 'happy' }]);

      expect(result).toBeNull();
    });

    it('should calculate trends for sufficient data', () => {
      const moodData = Array.from({ length: 14 }, (_, i) => ({
        timestamp: Date.now() - (13 - i) * 24 * 60 * 60 * 1000,
        intensity: 0.5 + (i * 0.05), // increasing intensity
        primary: 'happy'
      }));

      const result = (service as any).calculateMoodTrends(moodData);

      expect(result).toHaveProperty('recentAverageIntensity');
      expect(result).toHaveProperty('previousAverageIntensity');
      expect(result).toHaveProperty('trendDirection');
      expect(result).toHaveProperty('volatility');
    });
  });

  describe('calculateTrendDirection', () => {
    it('should return stable for insufficient data', () => {
      const data = [{ intensity: 0.5 }, { intensity: 0.6 }];

      const result = (service as any).calculateTrendDirection(data);

      expect(result).toBe('stable');
    });

    it('should return improving for increasing trend', () => {
      const data = [
        { intensity: 0.3 }, { intensity: 0.4 },
        { intensity: 0.7 }, { intensity: 0.8 }
      ];

      const result = (service as any).calculateTrendDirection(data);

      expect(result).toBe('improving');
    });

    it('should return declining for decreasing trend', () => {
      const data = [
        { intensity: 0.8 }, { intensity: 0.7 },
        { intensity: 0.4 }, { intensity: 0.3 }
      ];

      const result = (service as any).calculateTrendDirection(data);

      expect(result).toBe('declining');
    });
  });

  describe('calculateVolatility', () => {
    it('should return 0 for insufficient data', () => {
      const result = (service as any).calculateVolatility([{ primary: 'happy' }]);

      expect(result).toBe(0);
    });

    it('should calculate volatility based on mood changes', () => {
      const data = [
        { primary: 'happy' },
        { primary: 'sad' },
        { primary: 'happy' },
        { primary: 'happy' }
      ];

      const result = (service as any).calculateVolatility(data);

      expect(result).toBeCloseTo(0.67, 2); // 2 changes out of 3 transitions
    });
  });

  describe('downloadExport', () => {
    it('should create download link and trigger click', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const filename = 'test.txt';

      service.downloadExport(blob, filename);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe(filename);
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename without user ID', () => {
      const result = service.generateFilename('json');
      const today = new Date().toISOString().split('T')[0];

      expect(result).toBe(`astral_core_export_${today}.json`);
    });

    it('should generate filename with user ID', () => {
      const result = service.generateFilename('csv', 'user123');
      const today = new Date().toISOString().split('T')[0];

      expect(result).toBe(`astral_core_export_user123_${today}.csv`);
    });
  });

  describe('deleteAllUserData', () => {
    it('should remove all specified localStorage keys', async () => {
      await service.deleteAllUserData();

      const expectedKeys = [
        'userPreferences', 'userSettings', 'userProfile', 'mood_analyses',
        'userPosts', 'userInteractions', 'userStats', 'aiChatHistory',
        'peerChatHistory', 'userReflections', 'security_logs', 'analytics_events',
        'onboardingCompleted', 'userToken', 'userId'
      ];

      expectedKeys.forEach(key => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(key);
      });

      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });
  });

  describe('deleteSpecificDataType', () => {
    it('should delete mood data keys', async () => {
      await service.deleteSpecificDataType('mood');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mood_analyses');
    });

    it('should delete activity data keys', async () => {
      await service.deleteSpecificDataType('activity');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userPosts');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userInteractions');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userStats');
    });

    it('should handle unknown data type', async () => {
      await service.deleteSpecificDataType('unknown');

      // Should not throw error, but also shouldn't delete anything
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('getDataInventory', () => {
    it('should return inventory of stored data', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'userPreferences') return '{"theme": "dark"}';
        if (key === 'mood_analyses') return '[{"mood": "happy"}]';
        return null;
      });

      const inventory = service.getDataInventory();

      expect(inventory.userPreferences).toEqual({
        type: 'object',
        size: expect.any(Number),
        lastModified: 'Unknown',
        recordCount: 1
      });

      expect(inventory.mood_analyses).toEqual({
        type: 'object',
        size: expect.any(Number),
        lastModified: 'Unknown',
        recordCount: 1
      });

      expect(inventory.nonexistentKey).toBeUndefined();
    });
  });

  describe('getDataRetentionInfo', () => {
    it('should return data retention information', () => {
      const retentionInfo = service.getDataRetentionInfo();

      expect(retentionInfo).toHaveProperty('mood_analyses', '2 years or until user deletion');
      expect(retentionInfo).toHaveProperty('userPosts', '2 years or until user deletion');
      expect(retentionInfo).toHaveProperty('security_logs', '2 years for security purposes');
    });
  });
});

describe('getDataExportService', () => {
  it('should return singleton instance', () => {
    const instance1 = getDataExportService();
    const instance2 = getDataExportService();

    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(DataExportService);
  });
});

describe('useDataExport hook', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'userId') return 'test-user';
      return null;
    });
  });

  it('should export data successfully', async () => {
    const { result } = renderHook(() => useDataExport());

    expect(result.current.isExporting).toBe(false);

    const mockOptions: ExportOptions = {
      format: 'json',
      includePersonalData: true,
      includeMoodData: false,
      includeActivityData: false,
      includeChatHistory: false,
      includeReflections: false,
      includeSettings: false,
    };

    let exportResult: any;
    await act(async () => {
      exportResult = await result.current.exportData(mockOptions);
    });

    expect(exportResult.success).toBe(true);
    expect(exportResult.filename).toContain('astral_core_export');
    expect(result.current.isExporting).toBe(false);
  });

  it('should handle export errors', async () => {
    const { result } = renderHook(() => useDataExport());

    const mockOptions: ExportOptions = {
      format: 'invalid' as any,
      includePersonalData: true,
      includeMoodData: false,
      includeActivityData: false,
      includeChatHistory: false,
      includeReflections: false,
      includeSettings: false,
    };

    let exportResult: any;
    await act(async () => {
      exportResult = await result.current.exportData(mockOptions);
    });

    expect(exportResult.success).toBe(false);
    expect(exportResult.error).toContain('Unsupported export format');
  });

  it('should delete all data', async () => {
    const { result } = renderHook(() => useDataExport());

    await act(async () => {
      await result.current.deleteAllData();
    });

    // Verify that deleteAllUserData was called
    expect(mockSessionStorage.clear).toHaveBeenCalled();
  });

  it('should delete specific data type', async () => {
    const { result } = renderHook(() => useDataExport());

    await act(async () => {
      await result.current.deleteDataType('mood');
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mood_analyses');
  });

  it('should get data inventory', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'userPreferences') return '{"theme": "dark"}';
      return null;
    });

    const { result } = renderHook(() => useDataExport());

    const inventory = result.current.getDataInventory();

    expect(inventory.userPreferences).toBeDefined();
  });

  it('should get data retention info', () => {
    const { result } = renderHook(() => useDataExport());

    const retentionInfo = result.current.getDataRetentionInfo();

    expect(retentionInfo).toHaveProperty('mood_analyses');
    expect(retentionInfo).toHaveProperty('userPosts');
  });
});