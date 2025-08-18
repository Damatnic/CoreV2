#!/usr/bin/env python3
import re

# Read the file
with open('src/utils/networkDetection.test.ts', 'r') as f:
    content = f.read()

# Find and replace the problematic useAdaptiveLoading hook describe block
# The block starts at line 321 and has issues with mockUseState and mockUseEffect

fixed_hook_tests = """  describe('useAdaptiveLoading hook', () => {
    it('should initialize with current adaptive loading config', () => {
      const { result } = renderHook(() => useAdaptiveLoading());
      
      // Check that the hook returns the expected config structure
      expect(result.current).toHaveProperty('connectionType');
      expect(result.current).toHaveProperty('quality');
      expect(result.current).toHaveProperty('shouldPreloadImages');
      expect(result.current).toHaveProperty('shouldPreloadVideos');
    });

    it('should setup connection change listener', () => {
      const { unmount } = renderHook(() => useAdaptiveLoading());
      
      // Check that event listener was added
      expect(mockConnection.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
      
      // Check cleanup on unmount
      unmount();
      expect(mockConnection.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should add event listener when connection is available', () => {
      const { rerender } = renderHook(() => useAdaptiveLoading());
      
      expect(mockConnection.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
      
      // Simulate connection change
      mockConnection.effectiveType = '3g';
      const changeHandler = mockConnection.addEventListener.mock.calls[0][1];
      changeHandler();
      
      // Force re-render to check if state updates
      rerender();
    });

    it('should handle missing connection in effect', () => {
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        writable: true,
      });
      
      const { result } = renderHook(() => useAdaptiveLoading());
      
      // Should return default config when connection is missing
      expect(result.current.connectionType).toBe('unknown');
      expect(result.current.quality).toBe('good');
    });

    it('should return current configuration', () => {
      // Set specific connection properties
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 0.4;
      mockConnection.rtt = 600;
      mockConnection.saveData = true;
      
      const { result } = renderHook(() => useAdaptiveLoading());
      
      expect(result.current.connectionType).toBe('3g');
      expect(result.current.quality).toBe('poor');
      expect(result.current.shouldPreloadImages).toBe(false);
    });
  });"""

# Replace the problematic block using regex
pattern = r"  describe\('useAdaptiveLoading hook',.*?\n  \}\);"
# Using DOTALL flag to match across multiple lines
content = re.sub(pattern, fixed_hook_tests, content, count=1, flags=re.DOTALL)

# Write back the fixed content
with open('src/utils/networkDetection.test.ts', 'w') as f:
    f.write(content)

print("Fixed networkDetection.test.ts")