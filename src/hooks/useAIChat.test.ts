import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIChat } from './useAIChat';
import { ApiClient } from '../utils/ApiClient';
import { authState } from '../contexts/AuthContext';

jest.mock('../utils/ApiClient', () => ({
  ApiClient: {
    ai: {
      loadChatHistory: jest.fn(),
      resetAIChat: jest.fn(),
      sendMessageToAI: jest.fn()
    }
  }
}));

jest.mock('../contexts/AuthContext', () => ({
  authState: {
    userToken: 'test-token'
  }
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('useAIChat Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authState.userToken as unknown) = 'test-token';
  });

  it('should initialize with empty session', () => {
    (ApiClient.ai.loadChatHistory as jest.Mock).mockResolvedValue([]);
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    expect(result.current.session).toEqual({ messages: [], isTyping: false });
  });

  it('should fetch chat history on mount', async () => {
    const mockHistory = [
      { id: '1', sender: 'user', text: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
      { id: '2', sender: 'ai', text: 'Hi there!', timestamp: '2024-01-01T00:01:00Z' }
    ];
    
    (ApiClient.ai.loadChatHistory as jest.Mock).mockResolvedValue(mockHistory);
    
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.session.messages).toEqual(mockHistory);
    });
    
    expect(ApiClient.ai.loadChatHistory).toHaveBeenCalled();
  });

  it('should handle chat history fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    (ApiClient.ai.loadChatHistory as jest.Mock).mockRejectedValue(
      new Error('API endpoint not available in development')
    );
    
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.session.messages).toEqual([]);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      "AI chat history unavailable in development mode - using empty state"
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle non-array response from API', async () => {
    (ApiClient.ai.loadChatHistory as jest.Mock).mockResolvedValue(null);
    
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.session.messages).toEqual([]);
    });
  });

  it('should send message when user is authenticated', async () => {
    const mockResponse = { 
      id: 'ai-1', 
      sender: 'ai', 
      text: 'I can help you!', 
      timestamp: '2024-01-01T00:02:00Z' 
    };
    
    (ApiClient.ai.loadChatHistory as jest.Mock).mockResolvedValue([]);
    (ApiClient.ai.sendMessageToAI as jest.Mock).mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.sendMessage('I need help');
    });
    
    expect(ApiClient.ai.sendMessageToAI).toHaveBeenCalledWith(
      'I need help',
      expect.any(Array)
    );
    
    await waitFor(() => {
      expect(result.current.session.messages).toHaveLength(2);
      expect(result.current.session.messages[0].text).toBe('I need help');
      expect(result.current.session.messages[1].text).toBe('I can help you!');
      expect(result.current.session.isTyping).toBe(false);
    });
  });

  it('should not send message when user is not authenticated', async () => {
    (authState.userToken as unknown) = null;
    (ApiClient.ai.loadChatHistory as jest.Mock).mockResolvedValue([]);
    
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    expect(ApiClient.ai.sendMessageToAI).not.toHaveBeenCalled();
  });

  it('should handle send message errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (ApiClient.ai.loadChatHistory as jest.Mock).mockResolvedValue([]);
    (ApiClient.ai.sendMessageToAI as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );
    
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    await waitFor(() => {
      expect(result.current.session.isTyping).toBe(false);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to send message:',
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('should reset chat session', async () => {
    const mockHistory = [
      { id: '1', sender: 'user', text: 'Hello', timestamp: '2024-01-01T00:00:00Z' }
    ];
    
    (ApiClient.ai.loadChatHistory as jest.Mock).mockResolvedValue(mockHistory);
    (ApiClient.ai.resetAIChat as jest.Mock).mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    await waitFor(() => {
      expect(result.current.session.messages).toEqual(mockHistory);
    });
    
    await act(async () => {
      await result.current.resetAIChat();
    });
    
    expect(ApiClient.ai.resetAIChat).toHaveBeenCalled();
    expect(result.current.session).toEqual({ messages: [], isTyping: false });
  });

  it('should set typing indicator when sending message', async () => {
    (ApiClient.ai.loadChatHistory as jest.Mock).mockResolvedValue([]);
    (ApiClient.ai.sendMessageToAI as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        id: 'ai-1',
        sender: 'ai',
        text: 'Response',
        timestamp: '2024-01-01T00:02:00Z'
      }), 100))
    );
    
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    const sendPromise = act(async () => {
      await result.current.sendMessage('Test');
    });
    
    await waitFor(() => {
      expect(result.current.session.isTyping).toBe(true);
    });
    
    await sendPromise;
    
    await waitFor(() => {
      expect(result.current.session.isTyping).toBe(false);
    });
  });

  it('should maintain message history across sends', async () => {
    (ApiClient.ai.loadChatHistory as jest.Mock).mockResolvedValue([]);
    (ApiClient.ai.sendMessageToAI as jest.Mock)
      .mockResolvedValueOnce({ id: 'ai-1', sender: 'ai', text: 'First response', timestamp: '2024-01-01T00:01:00Z' })
      .mockResolvedValueOnce({ id: 'ai-2', sender: 'ai', text: 'Second response', timestamp: '2024-01-01T00:02:00Z' });
    
    const { result } = renderHook(() => useAIChat(), { wrapper: Wrapper });
    
    await act(async () => {
      await result.current.sendMessage('First message');
    });
    
    await act(async () => {
      await result.current.sendMessage('Second message');
    });
    
    await waitFor(() => {
      expect(result.current.session.messages).toHaveLength(4);
      expect(result.current.session.messages[0].text).toBe('First message');
      expect(result.current.session.messages[1].text).toBe('First response');
      expect(result.current.session.messages[2].text).toBe('Second message');
      expect(result.current.session.messages[3].text).toBe('Second response');
    });
  });
});