import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

// Mock storage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useAutoSave Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    expect(result.current.state.isEnabled).toBe(true);
    expect(result.current.state.isSaving).toBe(false);
    expect(result.current.state.isDirty).toBe(false);
    expect(result.current.state.saveStatus).toBe('idle');
    expect(result.current.state.lastError).toBeNull();
  });

  it('should initialize with provided content and title', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => 
      useAutoSave('test-draft', 'initial content', 'initial title'), 
      { wrapper: Wrapper }
    );
    
    const currentDraft = result.current.getCurrentDraft();
    expect(currentDraft?.content).toBe('initial content');
    expect(currentDraft?.title).toBe('initial title');
    expect(currentDraft?.isDirty).toBe(false);
  });

  it('should update content and mark as dirty', () => {
    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    act(() => {
      result.current.updateContent('new content');
    });

    expect(result.current.state.isDirty).toBe(true);
    
    const currentDraft = result.current.getCurrentDraft();
    expect(currentDraft?.content).toBe('new content');
    expect(currentDraft?.isDirty).toBe(true);
  });

  it('should update title and mark as dirty', () => {
    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    act(() => {
      result.current.updateTitle('new title');
    });

    expect(result.current.state.isDirty).toBe(true);
    
    const currentDraft = result.current.getCurrentDraft();
    expect(currentDraft?.title).toBe('new title');
  });

  it('should save to localStorage by default', async () => {
    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    act(() => {
      result.current.updateContent('content to save');
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'draft_test-draft',
      expect.stringContaining('content to save')
    );
    expect(result.current.state.saveStatus).toBe('saved');
  });

  it('should save to sessionStorage when configured', async () => {
    const { result } = renderHook(() => 
      useAutoSave('test-draft', '', '', { 
        useLocalStorage: false, 
        useSessionStorage: true 
      }), 
      { wrapper: Wrapper }
    );
    
    act(() => {
      result.current.updateContent('session content');
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'draft_test-draft',
      expect.stringContaining('session content')
    );
  });

  it('should use custom save function', async () => {
    const mockCustomSave = jest.fn().mockResolvedValue(true);
    const { result } = renderHook(() => 
      useAutoSave('test-draft', '', '', { customSave: mockCustomSave }), 
      { wrapper: Wrapper }
    );
    
    act(() => {
      result.current.updateContent('custom save content');
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mockCustomSave).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'custom save content',
        id: 'test-draft'
      })
    );
  });

  it('should handle save errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    act(() => {
      result.current.updateContent('content that will fail');
    });

    await act(async () => {
      const success = await result.current.saveDraft();
      expect(success).toBe(false);
    });

    expect(result.current.state.saveStatus).toBe('error');
    expect(result.current.state.lastError).toBeInstanceOf(Error);

    consoleSpy.mockRestore();
  });

  it('should load draft from storage', async () => {
    const mockDraft = {
      id: 'test-draft',
      content: 'loaded content',
      title: 'loaded title',
      timestamp: Date.now(),
      isDirty: false
    };
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockDraft));

    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.loadDraft('test-draft');
    });

    const currentDraft = result.current.getCurrentDraft();
    expect(currentDraft?.content).toBe('loaded content');
    expect(currentDraft?.title).toBe('loaded title');
  });

  it('should delete draft from storage', async () => {
    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    await act(async () => {
      const success = await result.current.deleteDraft('test-draft');
      expect(success).toBe(true);
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('draft_test-draft');
  });

  it('should get all drafts from storage', async () => {
    const mockDrafts = [
      { id: 'draft-1', content: 'content 1', timestamp: 2 },
      { id: 'draft-2', content: 'content 2', timestamp: 1 }
    ];

    mockLocalStorage.length = 2;
    mockLocalStorage.key.mockImplementation((index) => 
      index === 0 ? 'draft_draft-1' : 'draft_draft-2'
    );
    mockLocalStorage.getItem.mockImplementation((key) => 
      key === 'draft_draft-1' ? JSON.stringify(mockDrafts[0]) :
      key === 'draft_draft-2' ? JSON.stringify(mockDrafts[1]) : null
    );

    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    await act(async () => {
      const allDrafts = await result.current.getAllDrafts();
      
      // Should be sorted by timestamp (newest first)
      expect(allDrafts).toHaveLength(2);
      expect(allDrafts[0].id).toBe('draft-1');
      expect(allDrafts[1].id).toBe('draft-2');
    });
  });

  it('should clear all drafts', async () => {
    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    // Mock getAllDrafts to return some drafts
    const mockGetAllDrafts = jest.spyOn(result.current, 'getAllDrafts')
      .mockResolvedValue([
        { id: 'draft-1', content: '', title: '', timestamp: 1, isDirty: false }
      ]);

    await act(async () => {
      const success = await result.current.clearAllDrafts();
      expect(success).toBe(true);
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('draft_draft-1');
    mockGetAllDrafts.mockRestore();
  });

  it('should enable/disable auto-save', () => {
    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    expect(result.current.state.isEnabled).toBe(true);

    act(() => {
      result.current.setEnabled(false);
    });

    expect(result.current.state.isEnabled).toBe(false);
  });

  it('should create new draft', () => {
    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    act(() => {
      const newId = result.current.createNewDraft();
      expect(newId).toMatch(/^draft_\d+_[a-z0-9]+$/);
    });

    const currentDraft = result.current.getCurrentDraft();
    expect(currentDraft?.content).toBe('');
    expect(currentDraft?.title).toBe('');
    expect(currentDraft?.isDirty).toBe(false);
  });

  it('should debounce content updates before auto-saving', async () => {
    const { result } = renderHook(() => 
      useAutoSave('test-draft', '', '', { debounceDelay: 1000 }), 
      { wrapper: Wrapper }
    );
    
    // Update content multiple times quickly
    act(() => {
      result.current.updateContent('content 1');
      result.current.updateContent('content 2');
      result.current.updateContent('content 3');
    });

    // Should not have saved yet
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

    // Advance time to trigger debounced save
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Should save the latest content
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'draft_test-draft',
        expect.stringContaining('content 3')
      );
    });
  });

  it('should auto-save at regular intervals', async () => {
    const { result } = renderHook(() => 
      useAutoSave('test-draft', '', '', { 
        saveInterval: 5000,
        debounceDelay: 100 
      }), 
      { wrapper: Wrapper }
    );
    
    act(() => {
      result.current.updateContent('interval content');
    });

    // Simulate time passing to trigger auto-save interval
    await act(async () => {
      jest.advanceTimersByTime(5100); // Slightly more than save interval
    });

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'draft_test-draft',
        expect.stringContaining('interval content')
      );
    });
  });

  it('should not save when content is not dirty', async () => {
    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    // Don't update content, just try to save
    await act(async () => {
      const success = await result.current.saveDraft();
      expect(success).toBe(true); // Should succeed but not actually save
    });

    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('should handle storage quota exceeded error', async () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const { result } = renderHook(() => useAutoSave('test-draft'), { wrapper: Wrapper });
    
    act(() => {
      result.current.updateContent('large content');
    });

    await act(async () => {
      const success = await result.current.saveDraft();
      expect(success).toBe(false);
    });

    expect(result.current.state.saveStatus).toBe('error');
  });

  it('should call callbacks on save events', async () => {
    const mockOnSaveSuccess = jest.fn();
    const mockOnSaveError = jest.fn();

    const { result } = renderHook(() => 
      useAutoSave('test-draft', '', '', {
        onSaveSuccess: mockOnSaveSuccess,
        onSaveError: mockOnSaveError
      }), 
      { wrapper: Wrapper }
    );
    
    act(() => {
      result.current.updateContent('callback test');
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mockOnSaveSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'callback test'
      })
    );
    expect(mockOnSaveError).not.toHaveBeenCalled();
  });

  it('should respect maxDrafts limit', async () => {
    const mockDrafts = Array.from({ length: 12 }, (_, i) => ({
      id: `draft-${i}`,
      content: `content ${i}`,
      timestamp: i,
      title: '',
      isDirty: false
    }));

    mockLocalStorage.length = 12;
    mockLocalStorage.key.mockImplementation((index) => `draft_draft-${index}`);
    mockLocalStorage.getItem.mockImplementation((key) => {
      const match = key.match(/draft_draft-(\d+)/);
      if (match) {
        const index = parseInt(match[1]);
        return JSON.stringify(mockDrafts[index]);
      }
      return null;
    });

    const { result } = renderHook(() => 
      useAutoSave('test-draft', '', '', { maxDrafts: 10 }), 
      { wrapper: Wrapper }
    );
    
    await act(async () => {
      const allDrafts = await result.current.getAllDrafts();
      expect(allDrafts).toHaveLength(10); // Should limit to maxDrafts
    });
  });

  it('should update save countdown timer', () => {
    const { result } = renderHook(() => 
      useAutoSave('test-draft', '', '', { 
        showSaveIndicators: true,
        saveInterval: 30000 
      }), 
      { wrapper: Wrapper }
    );
    
    const initialTime = result.current.state.nextSaveIn;
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.state.nextSaveIn).toBeLessThan(initialTime);
  });
});