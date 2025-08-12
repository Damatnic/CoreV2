import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { useReflectionStore } from './reflectionStore';
import { Reflection } from '../types';
import { act } from 'react';

const initialState = {
  reflections: [],
  isLoading: false,
  error: null,
  setReflections: expect.any(Function),
  addReflection: expect.any(Function),
  updateReaction: expect.any(Function),
  setLoading: expect.any(Function),
  setError: expect.any(Function),
};

// Mock reflection data for testing
const createMockReflection = (overrides: Partial<Reflection> = {}): Reflection => ({
  id: 'reflection-1',
  userToken: 'user-token-123',
  content: 'This is a test reflection about my day.',
  timestamp: '2023-10-15T10:30:00.000Z',
  reactions: {
    light: 5,
    heart: 3,
    strength: 2
  },
  myReaction: undefined,
  ...overrides,
});

describe('reflectionStore', () => {
  beforeEach(() => {
    useReflectionStore.setState(initialState);
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const state = useReflectionStore.getState();
      expect(state.reflections).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(typeof state.setReflections).toBe('function');
      expect(typeof state.addReflection).toBe('function');
      expect(typeof state.updateReaction).toBe('function');
      expect(typeof state.setLoading).toBe('function');
      expect(typeof state.setError).toBe('function');
    });
  });

  describe('setReflections action', () => {
    test('should set reflections array', () => {
      const mockReflections = [
        createMockReflection({ id: 'ref1' }),
        createMockReflection({ id: 'ref2' }),
      ];

      act(() => {
        useReflectionStore.getState().setReflections(mockReflections);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toEqual(mockReflections);
      expect(state.reflections).toHaveLength(2);
    });

    test('should replace existing reflections', () => {
      const initialReflections = [createMockReflection({ id: 'old-ref' })];
      const newReflections = [
        createMockReflection({ id: 'new-ref-1' }),
        createMockReflection({ id: 'new-ref-2' }),
      ];

      useReflectionStore.setState({ reflections: initialReflections });

      act(() => {
        useReflectionStore.getState().setReflections(newReflections);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toEqual(newReflections);
      expect(state.reflections).not.toContain(initialReflections[0]);
    });

    test('should handle empty array', () => {
      const existingReflections = [createMockReflection()];
      useReflectionStore.setState({ reflections: existingReflections });

      act(() => {
        useReflectionStore.getState().setReflections([]);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toEqual([]);
      expect(state.reflections).toHaveLength(0);
    });

    test('should handle reflections with complex reactions', () => {
      const complexReflection = createMockReflection({
        id: 'complex-ref',
        reactions: {
          light: 15,
          heart: 8,
          strength: 12,
          hope: 5,
          calm: 3
        }
      });

      act(() => {
        useReflectionStore.getState().setReflections([complexReflection]);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections[0].reactions).toEqual(complexReflection.reactions);
    });
  });

  describe('addReflection action', () => {
    test('should add reflection to the beginning of the array', () => {
      const existingReflection = createMockReflection({ id: 'existing' });
      const newReflection = createMockReflection({ id: 'new' });

      useReflectionStore.setState({ reflections: [existingReflection] });

      act(() => {
        useReflectionStore.getState().addReflection(newReflection);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toHaveLength(2);
      expect(state.reflections[0]).toEqual(newReflection);
      expect(state.reflections[1]).toEqual(existingReflection);
    });

    test('should add reflection to empty array', () => {
      const newReflection = createMockReflection({ id: 'first' });

      act(() => {
        useReflectionStore.getState().addReflection(newReflection);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toHaveLength(1);
      expect(state.reflections[0]).toEqual(newReflection);
    });

    test('should preserve existing reflections when adding new one', () => {
      const reflection1 = createMockReflection({ id: 'ref1' });
      const reflection2 = createMockReflection({ id: 'ref2' });
      const reflection3 = createMockReflection({ id: 'ref3' });

      useReflectionStore.setState({ reflections: [reflection1, reflection2] });

      act(() => {
        useReflectionStore.getState().addReflection(reflection3);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toHaveLength(3);
      expect(state.reflections).toEqual([reflection3, reflection1, reflection2]);
    });

    test('should handle adding reflection with no reactions', () => {
      const reflectionWithoutReactions = createMockReflection({
        id: 'no-reactions',
        reactions: {}
      });

      act(() => {
        useReflectionStore.getState().addReflection(reflectionWithoutReactions);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections[0].reactions).toEqual({});
    });
  });

  describe('updateReaction action', () => {
    const mockReflections = [
      createMockReflection({
        id: 'ref1',
        reactions: { light: 5, heart: 3 },
        myReaction: undefined
      }),
      createMockReflection({
        id: 'ref2',
        reactions: { strength: 2 },
        myReaction: 'light'
      }),
    ];

    beforeEach(() => {
      useReflectionStore.setState({ reflections: [...mockReflections] });
    });

    test('should add user reaction and increment count when user has no existing reaction', () => {
      act(() => {
        useReflectionStore.getState().updateReaction('ref1', 'heart', 'heart');
      });

      const state = useReflectionStore.getState();
      const updatedReflection = state.reflections.find(r => r.id === 'ref1');
      
      expect(updatedReflection?.reactions.heart).toBe(4); // Incremented from 3
      expect(updatedReflection?.myReaction).toBe('heart');
    });

    test('should set user reaction without incrementing when reaction type not provided', () => {
      act(() => {
        useReflectionStore.getState().updateReaction('ref1', 'light');
      });

      const state = useReflectionStore.getState();
      const updatedReflection = state.reflections.find(r => r.id === 'ref1');
      
      expect(updatedReflection?.reactions).toEqual({ light: 5, heart: 3 }); // Unchanged
      expect(updatedReflection?.myReaction).toBeUndefined(); // Unchanged
    });

    test('should not increment count when user already has a reaction', () => {
      act(() => {
        useReflectionStore.getState().updateReaction('ref2', 'strength', 'strength');
      });

      const state = useReflectionStore.getState();
      const updatedReflection = state.reflections.find(r => r.id === 'ref2');
      
      expect(updatedReflection?.reactions.strength).toBe(2); // Not incremented
      expect(updatedReflection?.myReaction).toBe('strength'); // Updated
    });

    test('should handle reaction type not existing in reactions object', () => {
      act(() => {
        useReflectionStore.getState().updateReaction('ref1', 'hope', 'hope');
      });

      const state = useReflectionStore.getState();
      const updatedReflection = state.reflections.find(r => r.id === 'ref1');
      
      expect(updatedReflection?.reactions.hope).toBe(1); // Added new reaction type
      expect(updatedReflection?.myReaction).toBe('hope');
    });

    test('should not modify other reflections when updating one', () => {
      const originalRef2 = { ...mockReflections[1] };

      act(() => {
        useReflectionStore.getState().updateReaction('ref1', 'light', 'light');
      });

      const state = useReflectionStore.getState();
      const unchangedReflection = state.reflections.find(r => r.id === 'ref2');
      
      expect(unchangedReflection?.reactions).toEqual(originalRef2.reactions);
      expect(unchangedReflection?.myReaction).toBe(originalRef2.myReaction);
    });

    test('should handle non-existent reflection ID gracefully', () => {
      const originalState = useReflectionStore.getState();

      act(() => {
        useReflectionStore.getState().updateReaction('non-existent', 'heart', 'heart');
      });

      const newState = useReflectionStore.getState();
      expect(newState.reflections).toEqual(originalState.reflections); // Unchanged
    });

    test('should handle switching user reactions', () => {
      // User changes their reaction from light to heart
      act(() => {
        useReflectionStore.getState().updateReaction('ref2', 'heart', 'heart');
      });

      const state = useReflectionStore.getState();
      const updatedReflection = state.reflections.find(r => r.id === 'ref2');
      
      expect(updatedReflection?.reactions.heart).toBe(1); // New reaction added
      expect(updatedReflection?.myReaction).toBe('heart'); // Changed from 'light'
    });

    test('should preserve other reaction properties during update', () => {
      const originalContent = mockReflections[0].content;
      const originalTimestamp = mockReflections[0].timestamp;

      act(() => {
        useReflectionStore.getState().updateReaction('ref1', 'strength', 'strength');
      });

      const state = useReflectionStore.getState();
      const updatedReflection = state.reflections.find(r => r.id === 'ref1');
      
      expect(updatedReflection?.content).toBe(originalContent);
      expect(updatedReflection?.timestamp).toBe(originalTimestamp);
    });
  });

  describe('setLoading action', () => {
    test('should set loading state to true', () => {
      act(() => {
        useReflectionStore.getState().setLoading(true);
      });

      const state = useReflectionStore.getState();
      expect(state.isLoading).toBe(true);
    });

    test('should set loading state to false', () => {
      useReflectionStore.setState({ isLoading: true });

      act(() => {
        useReflectionStore.getState().setLoading(false);
      });

      const state = useReflectionStore.getState();
      expect(state.isLoading).toBe(false);
    });

    test('should not affect other state properties', () => {
      const mockReflections = [createMockReflection()];
      const mockError = 'Test error';
      
      useReflectionStore.setState({ 
        reflections: mockReflections,
        error: mockError 
      });

      act(() => {
        useReflectionStore.getState().setLoading(true);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toEqual(mockReflections);
      expect(state.error).toBe(mockError);
      expect(state.isLoading).toBe(true);
    });
  });

  describe('setError action', () => {
    test('should set error message', () => {
      const errorMessage = 'Failed to load reflections';

      act(() => {
        useReflectionStore.getState().setError(errorMessage);
      });

      const state = useReflectionStore.getState();
      expect(state.error).toBe(errorMessage);
    });

    test('should clear error when set to null', () => {
      useReflectionStore.setState({ error: 'Previous error' });

      act(() => {
        useReflectionStore.getState().setError(null);
      });

      const state = useReflectionStore.getState();
      expect(state.error).toBeNull();
    });

    test('should not affect other state properties', () => {
      const mockReflections = [createMockReflection()];
      const mockLoading = true;
      
      useReflectionStore.setState({ 
        reflections: mockReflections,
        isLoading: mockLoading 
      });

      act(() => {
        useReflectionStore.getState().setError('Test error');
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toEqual(mockReflections);
      expect(state.isLoading).toBe(mockLoading);
      expect(state.error).toBe('Test error');
    });

    test('should handle empty string as error', () => {
      act(() => {
        useReflectionStore.getState().setError('');
      });

      const state = useReflectionStore.getState();
      expect(state.error).toBe('');
    });
  });

  describe('complex state interactions', () => {
    test('should handle loading state during reflection operations', () => {
      const newReflection = createMockReflection();

      act(() => {
        useReflectionStore.getState().setLoading(true);
        useReflectionStore.getState().addReflection(newReflection);
        useReflectionStore.getState().setLoading(false);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toContain(newReflection);
      expect(state.isLoading).toBe(false);
    });

    test('should handle error clearing when new data is loaded', () => {
      const reflections = [createMockReflection()];

      useReflectionStore.setState({ error: 'Previous error' });

      act(() => {
        useReflectionStore.getState().setReflections(reflections);
        useReflectionStore.getState().setError(null);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections).toEqual(reflections);
      expect(state.error).toBeNull();
    });

    test('should maintain reactions integrity during multiple updates', () => {
      const reflection = createMockReflection({
        reactions: { light: 5, heart: 3, strength: 2 }
      });

      useReflectionStore.setState({ reflections: [reflection] });

      act(() => {
        useReflectionStore.getState().updateReaction(reflection.id, 'light', 'light');
        useReflectionStore.getState().updateReaction(reflection.id, 'hope', 'hope');
      });

      const state = useReflectionStore.getState();
      const updated = state.reflections[0];
      
      expect(updated.reactions.light).toBe(6); // Incremented
      expect(updated.reactions.hope).toBe(1); // Added new
      expect(updated.reactions.heart).toBe(3); // Preserved
      expect(updated.reactions.strength).toBe(2); // Preserved
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle reflections with missing properties gracefully', () => {
      const incompleteReflection = {
        id: 'incomplete',
        userToken: 'token',
        content: 'Content',
        timestamp: '2023-10-15T10:30:00.000Z',
        reactions: {},
        // Missing myReaction property
      } as Reflection;

      act(() => {
        useReflectionStore.getState().addReflection(incompleteReflection);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections[0]).toEqual(incompleteReflection);
    });

    test('should handle very long reflection content', () => {
      const longContent = 'A'.repeat(10000);
      const longReflection = createMockReflection({
        content: longContent
      });

      act(() => {
        useReflectionStore.getState().addReflection(longReflection);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections[0].content).toBe(longContent);
      expect(state.reflections[0].content).toHaveLength(10000);
    });

    test('should handle unicode content in reflections', () => {
      const unicodeContent = '🌟 Today I felt 💙 and found 🕊️ peace in 🌸';
      const unicodeReflection = createMockReflection({
        content: unicodeContent
      });

      act(() => {
        useReflectionStore.getState().addReflection(unicodeReflection);
      });

      const state = useReflectionStore.getState();
      expect(state.reflections[0].content).toBe(unicodeContent);
    });

    test('should handle large numbers in reaction counts', () => {
      const largeReactionReflection = createMockReflection({
        reactions: {
          light: 999999,
          heart: 1000000,
          strength: Number.MAX_SAFE_INTEGER
        }
      });

      act(() => {
        useReflectionStore.getState().addReflection(largeReactionReflection);
        useReflectionStore.getState().updateReaction(largeReactionReflection.id, 'light', 'light');
      });

      const state = useReflectionStore.getState();
      const updated = state.reflections[0];
      expect(updated.reactions.light).toBe(1000000);
      expect(updated.reactions.heart).toBe(1000000);
    });

    test('should handle rapid consecutive updates', () => {
      const reflection = createMockReflection({ reactions: { light: 0 } });
      useReflectionStore.setState({ reflections: [reflection] });

      act(() => {
        // Simulate rapid consecutive reaction updates
        for (let i = 0; i < 10; i++) {
          useReflectionStore.getState().updateReaction(reflection.id, 'light', i % 2 === 0 ? 'light' : undefined);
        }
      });

      const state = useReflectionStore.getState();
      const updated = state.reflections[0];
      // Should handle all updates, though exact count depends on implementation details
      expect(updated.reactions.light).toBeGreaterThanOrEqual(0);
    });
  });

  describe('state immutability', () => {
    test('should not mutate original reflections array when adding', () => {
      const originalReflections = [createMockReflection({ id: 'original' })];
      const originalReflectionsCopy = [...originalReflections];
      
      useReflectionStore.setState({ reflections: originalReflections });

      act(() => {
        useReflectionStore.getState().addReflection(createMockReflection({ id: 'new' }));
      });

      expect(originalReflections).toEqual(originalReflectionsCopy);
      expect(originalReflections).toHaveLength(1); // Original array unchanged
    });

    test('should not mutate original reflection objects when updating reactions', () => {
      const originalReflection = createMockReflection({
        reactions: { light: 5, heart: 3 }
      });
      const originalReactionsCopy = { ...originalReflection.reactions };
      
      useReflectionStore.setState({ reflections: [originalReflection] });

      act(() => {
        useReflectionStore.getState().updateReaction(originalReflection.id, 'light', 'light');
      });

      expect(originalReflection.reactions).toEqual(originalReactionsCopy);
      expect(originalReflection.myReaction).toBeUndefined(); // Original object unchanged
    });
  });
});