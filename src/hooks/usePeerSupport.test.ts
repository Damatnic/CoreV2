/**
 * Tests for Peer Support Hook
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePeerSupport } from './usePeerSupport';
import { peerSupportNetworkService } from '../services/peerSupportNetworkService';

// Mock the peer support network service
jest.mock('../services/peerSupportNetworkService', () => ({
  peerSupportNetworkService: {
    registerPeerSupporter: jest.fn(),
    findCompatiblePeers: jest.fn(),
    createPeerSupportSession: jest.fn(),
    completePeerSupportSession: jest.fn(),
    getCommunityGroups: jest.fn(),
    getPeerSupportStatistics: jest.fn()
  }
}));

const mockPeerMatches = [
  {
    id: 'peer-1',
    supporterId: 'supporter-123',
    compatibility: {
      experienceMatch: 0.85,
      languageMatch: 1.0,
      culturalMatch: 0.9,
      availabilityMatch: 0.8,
      overallScore: 0.87
    },
    peerProfile: {
      id: 'supporter-123',
      anonymizedId: 'peer_abc123',
      supportAreas: ['anxiety', 'depression'],
      languages: ['en'],
      culturalContexts: ['western'],
      availability: 'available' as const,
      safetyRating: 4.8,
      totalSupportSessions: 156,
      averageRating: 4.7,
      lastActive: Date.now() - 3600000
    },
    estimatedWaitTime: 300, // 5 minutes
    matchReason: 'High experience overlap in anxiety support'
  },
  {
    id: 'peer-2',
    supporterId: 'supporter-456',
    compatibility: {
      experienceMatch: 0.72,
      languageMatch: 1.0,
      culturalMatch: 0.95,
      availabilityMatch: 0.9,
      overallScore: 0.79
    },
    peerProfile: {
      id: 'supporter-456',
      anonymizedId: 'peer_def456',
      supportAreas: ['depression', 'trauma'],
      languages: ['en'],
      culturalContexts: ['western'],
      availability: 'available' as const,
      safetyRating: 4.9,
      totalSupportSessions: 89,
      averageRating: 4.8,
      lastActive: Date.now() - 1800000
    },
    estimatedWaitTime: 180,
    matchReason: 'Strong cultural compatibility and availability'
  }
];

const mockCommunityGroups = [
  {
    id: 'group-1',
    name: 'Anxiety Support Circle',
    description: 'Safe space for anxiety support and coping strategies',
    language: 'en',
    culturalContext: 'western',
    memberCount: 45,
    activityLevel: 'high' as const,
    moderationLevel: 'high' as const,
    focusAreas: ['anxiety', 'coping-strategies'],
    meetingSchedule: 'Weekly on Wednesdays',
    isPublic: true
  },
  {
    id: 'group-2',
    name: 'Depression Recovery Network',
    description: 'Peer support for depression recovery journey',
    language: 'en',
    culturalContext: 'western',
    memberCount: 67,
    activityLevel: 'medium' as const,
    moderationLevel: 'high' as const,
    focusAreas: ['depression', 'recovery'],
    meetingSchedule: 'Bi-weekly on Sundays',
    isPublic: true
  }
];

const mockStatistics = {
  totalSessions: 1247,
  successfulMatches: 1156,
  averageMatchTime: 420,
  averageSessionDuration: 2100,
  followUpRate: 0.78,
  peerSatisfactionScore: 4.6,
  culturalDiversityIndex: 0.82,
  languageSupport: ['en', 'es', 'fr', 'de']
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
  React.createElement('div', {}, children);

describe('usePeerSupport Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (peerSupportNetworkService.getCommunityGroups as jest.Mock).mockReturnValue(mockCommunityGroups);
    (peerSupportNetworkService.getPeerSupportStatistics as jest.Mock).mockReturnValue(mockStatistics);
    (peerSupportNetworkService.findCompatiblePeers as jest.Mock).mockResolvedValue(mockPeerMatches);
    (peerSupportNetworkService.registerPeerSupporter as jest.Mock).mockResolvedValue('peer-id-123');
    (peerSupportNetworkService.createPeerSupportSession as jest.Mock).mockResolvedValue('session-456');
    (peerSupportNetworkService.completePeerSupportSession as jest.Mock).mockResolvedValue(undefined);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    expect(result.current.peerMatches).toEqual([]);
    expect(result.current.activeSessions).toEqual([]);
    expect(result.current.communityGroups).toEqual([]);
    expect(result.current.peerStatistics).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRegistering).toBe(false);
    expect(result.current.isFindingMatches).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.registerAsPeer).toBe('function');
    expect(typeof result.current.findPeerSupport).toBe('function');
    expect(typeof result.current.createSupportSession).toBe('function');
  });

  it('should load initial data on mount', async () => {
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.communityGroups).toEqual(mockCommunityGroups);
      expect(result.current.peerStatistics).toEqual(mockStatistics);
    });

    expect(peerSupportNetworkService.getCommunityGroups).toHaveBeenCalledWith('en', undefined);
    expect(peerSupportNetworkService.getPeerSupportStatistics).toHaveBeenCalled();
  });

  it('should handle initial data loading errors', async () => {
    const loadError = new Error('Failed to load community groups');
    (peerSupportNetworkService.getCommunityGroups as jest.Mock).mockImplementation(() => {
      throw loadError;
    });

    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load initial data');
    });
  });

  it('should register as peer supporter successfully', async () => {
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    const peerData = {
      supportAreas: ['anxiety', 'depression'],
      languages: ['en'],
      culturalContexts: ['western'],
      availability: 'available' as const,
      bio: 'Experienced in anxiety and depression support',
      qualifications: ['Peer Counseling Certificate']
    };

    let peerId: string | null;
    await act(async () => {
      peerId = await result.current.registerAsPeer(peerData);
    });

    expect(peerSupportNetworkService.registerPeerSupporter).toHaveBeenCalledWith({
      ...peerData,
      userToken: 'user-token-123'
    });
    expect(peerId!).toBe('peer-id-123');
    expect(result.current.isRegistering).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle peer registration errors', async () => {
    const registrationError = new Error('Registration failed - invalid credentials');
    (peerSupportNetworkService.registerPeerSupporter as jest.Mock).mockRejectedValue(registrationError);

    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    const peerData = {
      supportAreas: ['anxiety'],
      languages: ['en'],
      culturalContexts: ['western'],
      availability: 'available' as const
    };

    let peerId: string | null;
    await act(async () => {
      peerId = await result.current.registerAsPeer(peerData);
    });

    expect(peerId!).toBeNull();
    expect(result.current.error).toBe('Registration failed - invalid credentials');
    expect(result.current.isRegistering).toBe(false);
  });

  it('should find peer support matches successfully', async () => {
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    const supportRequest = {
      id: 'request-789',
      seekerToken: 'user-token-123',
      language: 'en',
      experienceNeeded: ['anxiety'],
      urgencyLevel: 'medium' as const,
      preferredSupportStyle: ['empathetic'],
      sessionType: 'text-chat' as const,
      description: 'Need support with anxiety management',
      timestamp: Date.now(),
      maxWaitTime: 30
    };

    let matches: any[];
    await act(async () => {
      matches = await result.current.findPeerSupport(supportRequest);
    });

    expect(peerSupportNetworkService.findCompatiblePeers).toHaveBeenCalledWith(supportRequest);
    expect(matches!).toEqual(mockPeerMatches);
    expect(result.current.peerMatches).toEqual(mockPeerMatches);
    expect(result.current.isFindingMatches).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle peer matching errors', async () => {
    const matchingError = new Error('No compatible peers available');
    (peerSupportNetworkService.findCompatiblePeers as jest.Mock).mockRejectedValue(matchingError);

    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    const supportRequest = {
      id: 'request-789',
      seekerToken: 'user-token-123',
      language: 'en',
      experienceNeeded: ['rare-condition'],
      urgencyLevel: 'high' as const,
      preferredSupportStyle: [],
      sessionType: 'video-call' as const,
      description: 'Need specialized support',
      timestamp: Date.now(),
      maxWaitTime: 10
    };

    let matches: any[];
    await act(async () => {
      matches = await result.current.findPeerSupport(supportRequest);
    });

    expect(matches!).toEqual([]);
    expect(result.current.error).toBe('No compatible peers available');
    expect(result.current.isFindingMatches).toBe(false);
  });

  it('should create support session successfully', async () => {
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    let sessionId: string | null;
    await act(async () => {
      sessionId = await result.current.createSupportSession('request-789', 'supporter-123');
    });

    expect(peerSupportNetworkService.createPeerSupportSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'request-789',
        seekerToken: 'user-token-123',
        language: 'en'
      }),
      'supporter-123'
    );
    expect(sessionId!).toBe('session-456');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle session creation errors', async () => {
    const sessionError = new Error('Supporter is no longer available');
    (peerSupportNetworkService.createPeerSupportSession as jest.Mock).mockRejectedValue(sessionError);

    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    let sessionId: string | null;
    await act(async () => {
      sessionId = await result.current.createSupportSession('request-789', 'supporter-123');
    });

    expect(sessionId!).toBeNull();
    expect(result.current.error).toBe('Supporter is no longer available');
    expect(result.current.isLoading).toBe(false);
  });

  it('should complete support session successfully', async () => {
    // First set up an active session
    const mockSession = {
      id: 'session-456',
      requestId: 'request-789',
      supporterId: 'supporter-123',
      startTime: Date.now() - 3600000,
      status: 'active' as const
    };

    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });
    
    // Manually add active session to state for testing
    act(() => {
      result.current.activeSessions.push(mockSession);
    });

    const feedback = {
      seekerRating: 5,
      supporterRating: 4,
      finalRiskLevel: 2,
      followUpNeeded: false
    };

    await act(async () => {
      await result.current.completeSupportSession('session-456', feedback);
    });

    expect(peerSupportNetworkService.completePeerSupportSession).toHaveBeenCalledWith('session-456', feedback);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle session completion errors', async () => {
    const completionError = new Error('Failed to save session data');
    (peerSupportNetworkService.completePeerSupportSession as jest.Mock).mockRejectedValue(completionError);

    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    const feedback = {
      finalRiskLevel: 3,
      followUpNeeded: true
    };

    await act(async () => {
      await result.current.completeSupportSession('session-456', feedback);
    });

    expect(result.current.error).toBe('Failed to save session data');
    expect(result.current.isLoading).toBe(false);
  });

  it('should get community groups', () => {
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    const groups = result.current.getCommunityGroups('en', 'western');

    expect(peerSupportNetworkService.getCommunityGroups).toHaveBeenCalledWith('en', 'western');
    expect(groups).toEqual(mockCommunityGroups);
  });

  it('should join community group successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    let joinResult: boolean;
    await act(async () => {
      joinResult = await result.current.joinCommunityGroup('group-1');
    });

    expect(joinResult!).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('[Peer Support Hook] Joining group: group-1');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should handle community group join errors', async () => {
    // Mock console.log to simulate error in joining
    jest.spyOn(console, 'log').mockImplementation(() => {
      throw new Error('Group is full');
    });

    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    let joinResult: boolean;
    await act(async () => {
      joinResult = await result.current.joinCommunityGroup('group-1');
    });

    expect(joinResult!).toBe(false);
    expect(result.current.error).toBe('Group is full');
  });

  it('should refresh peer matches', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    await act(async () => {
      await result.current.refreshMatches();
    });

    expect(consoleSpy).toHaveBeenCalledWith('[Peer Support Hook] Refreshing peer matches...');
    expect(result.current.isFindingMatches).toBe(false);
    expect(result.current.error).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should handle refresh matches errors', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {
      throw new Error('Network timeout');
    });

    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    await act(async () => {
      await result.current.refreshMatches();
    });

    expect(result.current.error).toBe('Network timeout');
    expect(result.current.isFindingMatches).toBe(false);
  });

  it('should refresh statistics', () => {
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    act(() => {
      result.current.refreshStatistics();
    });

    expect(peerSupportNetworkService.getPeerSupportStatistics).toHaveBeenCalled();
    expect(result.current.peerStatistics).toEqual(mockStatistics);
    expect(result.current.error).toBeNull();
  });

  it('should handle statistics refresh errors', () => {
    const statsError = new Error('Statistics service unavailable');
    (peerSupportNetworkService.getPeerSupportStatistics as jest.Mock).mockImplementation(() => {
      throw statsError;
    });

    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    act(() => {
      result.current.refreshStatistics();
    });

    expect(result.current.error).toBe('Statistics service unavailable');
  });

  it('should update availability status', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    act(() => {
      result.current.updateAvailability('busy');
    });

    expect(consoleSpy).toHaveBeenCalledWith('[Peer Support Hook] Updated availability to: busy');

    consoleSpy.mockRestore();
  });

  it('should refresh statistics periodically', async () => {
    jest.useFakeTimers();

    renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    // Clear the initial call
    (peerSupportNetworkService.getPeerSupportStatistics as jest.Mock).mockClear();

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(peerSupportNetworkService.getPeerSupportStatistics).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should cleanup periodic statistics refresh on unmount', () => {
    jest.useFakeTimers();

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    jest.useRealTimers();
    clearIntervalSpy.mockRestore();
  });

  it('should handle language changes in community groups', async () => {
    const { result, rerender } = renderHook(
      ({ language }) => usePeerSupport('user-token-123', language),
      { 
        wrapper: Wrapper,
        initialProps: { language: 'en' }
      }
    );

    // Initial load
    await waitFor(() => {
      expect(result.current.communityGroups).toEqual(mockCommunityGroups);
    });

    // Clear mock calls
    (peerSupportNetworkService.getCommunityGroups as jest.Mock).mockClear();

    // Change language
    rerender({ language: 'es' });

    await waitFor(() => {
      expect(peerSupportNetworkService.getCommunityGroups).toHaveBeenCalledWith('es', undefined);
    });
  });

  it('should handle multiple concurrent operations', async () => {
    const { result } = renderHook(() => usePeerSupport('user-token-123', 'en'), { wrapper: Wrapper });

    const supportRequest = {
      id: 'request-789',
      seekerToken: 'user-token-123',
      language: 'en',
      experienceNeeded: ['anxiety'],
      urgencyLevel: 'medium' as const,
      preferredSupportStyle: [],
      sessionType: 'text-chat' as const,
      description: 'Test request',
      timestamp: Date.now(),
      maxWaitTime: 30
    };

    // Start multiple operations simultaneously
    const operations = await act(async () => {
      return Promise.all([
        result.current.findPeerSupport(supportRequest),
        result.current.createSupportSession('request-123', 'supporter-456'),
        // result.current.refreshMatches() // Commented out to avoid console.log conflicts in tests
      ]);
    });

    expect(operations[0]).toEqual(mockPeerMatches); // findPeerSupport result
    expect(operations[1]).toBe('session-456'); // createSupportSession result
    
    expect(result.current.error).toBeNull();
  });
});