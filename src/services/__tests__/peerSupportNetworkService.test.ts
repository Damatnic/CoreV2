import { 
  PeerSupportNetworkService,
  PeerProfile,
  PeerMatch,
  PeerSupportSession,
  PeerSupportRequest,
  CommunityGroup
} from '../peerSupportNetworkService';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock WebSocket for real-time features
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

describe('PeerSupportNetworkService', () => {
  let service: PeerSupportNetworkService;

  const mockPeerProfile: PeerProfile = {
    id: 'peer-123',
    userId: 'user-123',
    displayName: 'SupportivePeer',
    bio: 'I have experience with anxiety and depression',
    experienceAreas: ['anxiety', 'depression'],
    supportStyle: 'empathetic',
    availability: {
      timezone: 'America/New_York',
      preferredHours: [9, 10, 11, 14, 15, 16],
      daysOfWeek: [1, 2, 3, 4, 5]
    },
    isActive: true,
    rating: 4.8,
    totalSessions: 25,
    joinedDate: new Date().toISOString(),
    languages: ['en'],
    isVerified: true,
    specializations: ['workplace_stress', 'relationship_issues']
  };

  beforeEach(() => {
    service = new PeerSupportNetworkService();
    jest.clearAllMocks();
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'peer_profiles') {
        return JSON.stringify([mockPeerProfile]);
      }
      return null;
    });
  });

  describe('peer profile management', () => {
    it('should create peer profile successfully', async () => {
      const newProfile = {
        userId: 'user-456',
        displayName: 'NewPeer',
        bio: 'Here to help with mental health struggles',
        experienceAreas: ['depression', 'anxiety'],
        supportStyle: 'practical',
        languages: ['en', 'es']
      };

      const createdProfile = await service.createPeerProfile(newProfile);

      expect(createdProfile.id).toBeDefined();
      expect(createdProfile.displayName).toBe(newProfile.displayName);
      expect(createdProfile.isActive).toBe(true);
      expect(createdProfile.rating).toBe(0);
      expect(createdProfile.totalSessions).toBe(0);
    });

    it('should update peer profile', async () => {
      const updates = {
        bio: 'Updated bio with more experience',
        experienceAreas: ['anxiety', 'depression', 'ptsd']
      };

      const updatedProfile = await service.updatePeerProfile('peer-123', updates);

      expect(updatedProfile.bio).toBe(updates.bio);
      expect(updatedProfile.experienceAreas).toEqual(updates.experienceAreas);
    });

    it('should get peer profile by ID', async () => {
      const profile = await service.getPeerProfile('peer-123');

      expect(profile).toEqual(mockPeerProfile);
    });

    it('should handle non-existent peer profile', async () => {
      const profile = await service.getPeerProfile('non-existent');

      expect(profile).toBeNull();
    });

    it('should validate peer profile before creation', async () => {
      const invalidProfile = {
        userId: '',
        displayName: '',
        experienceAreas: [],
        languages: []
      };

      await expect(service.createPeerProfile(invalidProfile as any))
        .rejects.toThrow('Invalid peer profile data');
    });
  });

  describe('peer matching', () => {
    const seekerProfile = {
      strugglingWith: ['anxiety', 'workplace_stress'],
      preferredLanguages: ['en'],
      timezone: 'America/New_York',
      preferredSupportStyle: 'empathetic',
      urgency: 'medium' as const,
      culturalBackground: 'western'
    };

    beforeEach(() => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'peer_profiles') {
          return JSON.stringify([
            mockPeerProfile,
            {
              ...mockPeerProfile,
              id: 'peer-456',
              experienceAreas: ['depression', 'relationship_issues'],
              supportStyle: 'practical',
              rating: 4.5
            }
          ]);
        }
        return null;
      });
    });

    it('should find compatible peers based on experience areas', async () => {
      const matches = await service.findCompatiblePeers(seekerProfile);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].peer.experienceAreas).toContain('anxiety');
      expect(matches[0].compatibilityScore).toBeGreaterThan(0.5);
    });

    it('should prioritize peers with matching support style', async () => {
      const matches = await service.findCompatiblePeers(seekerProfile);

      const empathetic = matches.find(m => m.peer.supportStyle === 'empathetic');
      const practical = matches.find(m => m.peer.supportStyle === 'practical');

      if (empathetic && practical) {
        expect(empathetic.compatibilityScore).toBeGreaterThan(practical.compatibilityScore);
      }
    });

    it('should consider availability in matching', async () => {
      const urgentProfile = { ...seekerProfile, urgency: 'high' as const };

      const matches = await service.findCompatiblePeers(urgentProfile);

      expect(matches.every(match => match.peer.isActive)).toBe(true);
    });

    it('should handle language preferences', async () => {
      const spanishProfile = { 
        ...seekerProfile, 
        preferredLanguages: ['es'] 
      };

      // Add Spanish-speaking peer
      const spanishPeer = {
        ...mockPeerProfile,
        id: 'peer-es',
        languages: ['es', 'en']
      };

      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify([mockPeerProfile, spanishPeer])
      );

      const matches = await service.findCompatiblePeers(spanishProfile);

      expect(matches.some(m => m.peer.languages.includes('es'))).toBe(true);
    });

    it('should return empty array when no compatible peers found', async () => {
      const uncommonProfile = {
        ...seekerProfile,
        strugglingWith: ['very_rare_condition'],
        preferredLanguages: ['unknown_language']
      };

      const matches = await service.findCompatiblePeers(uncommonProfile);

      expect(matches).toHaveLength(0);
    });
  });

  describe('support session management', () => {
    const mockSession: PeerSupportSession = {
      id: 'session-123',
      seekerId: 'seeker-456',
      peerId: 'peer-123',
      status: 'active',
      startTime: new Date().toISOString(),
      topic: 'anxiety_support',
      sessionType: 'one_on_one',
      isAnonymous: true,
      messages: []
    };

    it('should create support session', async () => {
      const sessionData = {
        seekerId: 'seeker-456',
        peerId: 'peer-123',
        topic: 'workplace_anxiety',
        isAnonymous: true
      };

      const session = await service.createSupportSession(sessionData);

      expect(session.id).toBeDefined();
      expect(session.status).toBe('active');
      expect(session.startTime).toBeDefined();
      expect(session.messages).toEqual([]);
    });

    it('should send message in session', async () => {
      const message = {
        senderId: 'seeker-456',
        text: 'I\'m struggling with anxiety at work',
        type: 'text' as const
      };

      await service.sendMessage('session-123', message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'message',
          sessionId: 'session-123',
          message: expect.objectContaining({
            id: expect.any(String),
            ...message,
            timestamp: expect.any(String)
          })
        })
      );
    });

    it('should end support session', async () => {
      const feedback = {
        rating: 5,
        feedback: 'Very helpful session',
        wouldRecommend: true
      };

      const endedSession = await service.endSession('session-123', 'seeker-456', feedback);

      expect(endedSession.status).toBe('completed');
      expect(endedSession.endTime).toBeDefined();
      expect(endedSession.feedback).toEqual(feedback);
    });

    it('should get session history for user', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'support_sessions') {
          return JSON.stringify([
            { ...mockSession, seekerId: 'user-123' },
            { ...mockSession, id: 'session-456', peerId: 'user-123' }
          ]);
        }
        return null;
      });

      const history = await service.getSessionHistory('user-123');

      expect(history).toHaveLength(2);
    });

    it('should handle session not found', async () => {
      await expect(service.endSession('non-existent', 'user-123'))
        .rejects.toThrow('Session not found');
    });
  });

  describe('community groups', () => {
    const mockGroup: CommunityGroup = {
      id: 'group-123',
      name: 'Anxiety Support Circle',
      description: 'A supportive community for those dealing with anxiety',
      category: 'anxiety',
      memberCount: 15,
      isActive: true,
      createdDate: new Date().toISOString(),
      rules: ['Be respectful', 'No medical advice', 'Share experiences'],
      moderators: ['mod-123'],
      isPrivate: false,
      maxMembers: 50,
      tags: ['anxiety', 'support', 'mental_health']
    };

    beforeEach(() => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'community_groups') {
          return JSON.stringify([mockGroup]);
        }
        return null;
      });
    });

    it('should create community group', async () => {
      const groupData = {
        name: 'Depression Support Group',
        description: 'Support for depression',
        category: 'depression',
        creatorId: 'user-123',
        isPrivate: false
      };

      const group = await service.createCommunityGroup(groupData);

      expect(group.id).toBeDefined();
      expect(group.name).toBe(groupData.name);
      expect(group.memberCount).toBe(1); // Creator is first member
      expect(group.moderators).toContain('user-123');
    });

    it('should join community group', async () => {
      const result = await service.joinGroup('group-123', 'user-456');

      expect(result.success).toBe(true);
      expect(result.memberCount).toBe(16); // Increased from 15
    });

    it('should leave community group', async () => {
      const result = await service.leaveGroup('group-123', 'user-456');

      expect(result.success).toBe(true);
    });

    it('should get recommended groups for user', async () => {
      const userInterests = ['anxiety', 'workplace_stress'];

      const recommendations = await service.getRecommendedGroups('user-123', userInterests);

      expect(recommendations).toContain(
        expect.objectContaining({
          id: 'group-123',
          category: 'anxiety'
        })
      );
    });

    it('should handle group capacity limits', async () => {
      const fullGroup = { 
        ...mockGroup, 
        memberCount: 50, 
        maxMembers: 50 
      };

      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify([fullGroup])
      );

      const result = await service.joinGroup('group-123', 'user-456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('full');
    });
  });

  describe('peer verification and safety', () => {
    it('should verify peer credentials', async () => {
      const verificationData = {
        peerId: 'peer-123',
        credentials: ['certified_peer_counselor'],
        experienceProof: 'document.pdf',
        references: ['ref1@example.com']
      };

      const result = await service.verifyPeer(verificationData);

      expect(result.verified).toBe(true);
      expect(result.verificationLevel).toBe('certified');
    });

    it('should report inappropriate behavior', async () => {
      const report = {
        reporterId: 'user-456',
        reportedPeerId: 'peer-123',
        reason: 'inappropriate_advice',
        description: 'Gave medical advice instead of emotional support',
        sessionId: 'session-123'
      };

      const result = await service.reportPeer(report);

      expect(result.reportId).toBeDefined();
      expect(result.status).toBe('submitted');
    });

    it('should handle peer suspension', async () => {
      const result = await service.suspendPeer('peer-123', 'violations_of_terms', 7);

      expect(result.suspended).toBe(true);
      expect(result.suspensionEndDate).toBeDefined();
    });

    it('should validate peer safety guidelines', async () => {
      const guidelines = await service.getPeerSafetyGuidelines();

      expect(guidelines).toContain(expect.stringMatching(/no medical advice/i));
      expect(guidelines).toContain(expect.stringMatching(/respect boundaries/i));
      expect(guidelines).toContain(expect.stringMatching(/crisis situations/i));
    });
  });

  describe('real-time communication', () => {
    it('should establish WebSocket connection', async () => {
      await service.connectRealTime('user-123');

      expect(global.WebSocket).toHaveBeenCalled();
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle incoming messages', async () => {
      const messageHandler = jest.fn();
      service.onMessage(messageHandler);

      // Simulate incoming WebSocket message
      const messageEvent = {
        data: JSON.stringify({
          type: 'message',
          sessionId: 'session-123',
          message: { text: 'Hello', senderId: 'peer-123' }
        })
      };

      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1](messageEvent);

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
          message: expect.objectContaining({ text: 'Hello' })
        })
      );
    });

    it('should handle presence updates', async () => {
      const presenceHandler = jest.fn();
      service.onPresenceUpdate(presenceHandler);

      const presenceEvent = {
        data: JSON.stringify({
          type: 'presence',
          peerId: 'peer-123',
          status: 'online'
        })
      };

      mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1](presenceEvent);

      expect(presenceHandler).toHaveBeenCalledWith('peer-123', 'online');
    });

    it('should disconnect WebSocket properly', async () => {
      await service.disconnectRealTime();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('analytics and insights', () => {
    it('should track peer engagement metrics', async () => {
      const metrics = await service.getPeerEngagementMetrics('peer-123');

      expect(metrics).toHaveProperty('totalSessions');
      expect(metrics).toHaveProperty('averageRating');
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('completionRate');
    });

    it('should generate support effectiveness insights', async () => {
      const insights = await service.getSupportEffectivenessInsights();

      expect(insights).toHaveProperty('overallSatisfaction');
      expect(insights).toHaveProperty('topSupportAreas');
      expect(insights).toHaveProperty('peerRetentionRate');
      expect(insights).toHaveProperty('averageSessionDuration');
    });

    it('should provide community health metrics', async () => {
      const health = await service.getCommunityHealthMetrics();

      expect(health).toHaveProperty('activePeers');
      expect(health).toHaveProperty('activeGroups');
      expect(health).toHaveProperty('dailyInteractions');
      expect(health).toHaveProperty('supportRequestFulfillment');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle network errors gracefully', async () => {
      mockWebSocket.readyState = WebSocket.CLOSED;

      await expect(service.sendMessage('session-123', {
        senderId: 'user-123',
        text: 'test',
        type: 'text'
      })).resolves.not.toThrow();
    });

    it('should handle invalid session data', async () => {
      await expect(service.createSupportSession({
        seekerId: '',
        peerId: '',
        topic: ''
      } as any)).rejects.toThrow('Invalid session data');
    });

    it('should handle storage errors', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const profiles = await service.getAllPeerProfiles();
      
      expect(profiles).toEqual([]);
    });
  });
});

// Add method stubs for testing
declare module '../peerSupportNetworkService' {
  interface PeerSupportNetworkService {
    createPeerProfile(data: any): Promise<PeerProfile>;
    updatePeerProfile(id: string, updates: any): Promise<PeerProfile>;
    getPeerProfile(id: string): Promise<PeerProfile | null>;
    findCompatiblePeers(seekerProfile: any): Promise<PeerMatch[]>;
    createSupportSession(data: any): Promise<PeerSupportSession>;
    sendMessage(sessionId: string, message: any): Promise<void>;
    endSession(sessionId: string, userId: string, feedback?: any): Promise<PeerSupportSession>;
    getSessionHistory(userId: string): Promise<PeerSupportSession[]>;
    createCommunityGroup(data: any): Promise<CommunityGroup>;
    joinGroup(groupId: string, userId: string): Promise<any>;
    leaveGroup(groupId: string, userId: string): Promise<any>;
    getRecommendedGroups(userId: string, interests: string[]): Promise<CommunityGroup[]>;
    verifyPeer(data: any): Promise<any>;
    reportPeer(report: any): Promise<any>;
    suspendPeer(peerId: string, reason: string, days: number): Promise<any>;
    getPeerSafetyGuidelines(): Promise<string[]>;
    connectRealTime(userId: string): Promise<void>;
    onMessage(handler: Function): void;
    onPresenceUpdate(handler: Function): void;
    disconnectRealTime(): Promise<void>;
    getPeerEngagementMetrics(peerId: string): Promise<any>;
    getSupportEffectivenessInsights(): Promise<any>;
    getCommunityHealthMetrics(): Promise<any>;
    getAllPeerProfiles(): Promise<PeerProfile[]>;
  }
}