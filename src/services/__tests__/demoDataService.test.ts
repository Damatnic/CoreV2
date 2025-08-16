import { DemoDataService, demoDataService } from '../demoDataService';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('DemoDataService', () => {
  let service: DemoDataService;

  beforeEach(() => {
    service = DemoDataService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DemoDataService.getInstance();
      const instance2 = DemoDataService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should export singleton instance', () => {
      expect(demoDataService).toBe(DemoDataService.getInstance());
    });
  });

  describe('Starkeeper (User) Data Methods', () => {
    const mockUserToken = 'user-123';

    describe('getStarkeeperJournalEntries', () => {
      it('should return journal entries for user', () => {
        const entries = service.getStarkeeperJournalEntries(mockUserToken);

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBeGreaterThan(0);
        
        entries.forEach(entry => {
          expect(entry).toHaveProperty('id');
          expect(entry).toHaveProperty('userToken', mockUserToken);
          expect(entry).toHaveProperty('timestamp');
          expect(entry).toHaveProperty('content');
          expect(typeof entry.content).toBe('string');
          expect(entry.content.length).toBeGreaterThan(0);
        });
      });

      it('should have chronologically ordered entries', () => {
        const entries = service.getStarkeeperJournalEntries(mockUserToken);
        
        for (let i = 1; i < entries.length; i++) {
          const prevDate = new Date(entries[i - 1].timestamp);
          const currentDate = new Date(entries[i].timestamp);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
        }
      });
    });

    describe('getStarkeeperMoodCheckIns', () => {
      it('should return mood check-ins for user', () => {
        const checkIns = service.getStarkeeperMoodCheckIns(mockUserToken);

        expect(Array.isArray(checkIns)).toBe(true);
        expect(checkIns.length).toBeGreaterThan(0);
        
        checkIns.forEach(checkIn => {
          expect(checkIn).toHaveProperty('id');
          expect(checkIn).toHaveProperty('userToken', mockUserToken);
          expect(checkIn).toHaveProperty('timestamp');
          expect(checkIn).toHaveProperty('moodScore');
          expect(checkIn).toHaveProperty('anxietyLevel');
          expect(checkIn).toHaveProperty('sleepQuality');
          expect(checkIn).toHaveProperty('energyLevel');
          expect(checkIn).toHaveProperty('tags');
          expect(checkIn).toHaveProperty('notes');
          
          // Validate score ranges (typically 1-5)
          expect(checkIn.moodScore).toBeGreaterThanOrEqual(1);
          expect(checkIn.moodScore).toBeLessThanOrEqual(5);
          expect(checkIn.anxietyLevel).toBeGreaterThanOrEqual(1);
          expect(checkIn.anxietyLevel).toBeLessThanOrEqual(5);
          expect(Array.isArray(checkIn.tags)).toBe(true);
        });
      });

      it('should show improvement trend in mood data', () => {
        const checkIns = service.getStarkeeperMoodCheckIns(mockUserToken);
        const sortedCheckIns = checkIns.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // First mood should be lower than last (showing improvement)
        expect(sortedCheckIns[sortedCheckIns.length - 1].moodScore)
          .toBeGreaterThanOrEqual(sortedCheckIns[0].moodScore);
      });
    });

    describe('getStarkeeperDilemmas', () => {
      it('should return dilemmas for user', () => {
        const dilemmas = service.getStarkeeperDilemmas(mockUserToken);

        expect(Array.isArray(dilemmas)).toBe(true);
        expect(dilemmas.length).toBeGreaterThan(0);
        
        dilemmas.forEach(dilemma => {
          expect(dilemma).toHaveProperty('id');
          expect(dilemma).toHaveProperty('userToken', mockUserToken);
          expect(dilemma).toHaveProperty('category');
          expect(dilemma).toHaveProperty('content');
          expect(dilemma).toHaveProperty('timestamp');
          expect(dilemma).toHaveProperty('supportCount');
          expect(dilemma).toHaveProperty('isSupported');
          expect(dilemma).toHaveProperty('isReported');
          expect(dilemma).toHaveProperty('status');
          
          expect(typeof dilemma.content).toBe('string');
          expect(dilemma.content.length).toBeGreaterThan(0);
          expect(typeof dilemma.supportCount).toBe('number');
          expect(dilemma.supportCount).toBeGreaterThanOrEqual(0);
        });
      });

      it('should have both resolved and active dilemmas', () => {
        const dilemmas = service.getStarkeeperDilemmas(mockUserToken);
        
        const resolvedDilemmas = dilemmas.filter(d => d.status === 'resolved');
        const activeDilemmas = dilemmas.filter(d => d.status === 'active');
        
        expect(resolvedDilemmas.length).toBeGreaterThan(0);
        expect(activeDilemmas.length).toBeGreaterThan(0);
      });
    });

    describe('getStarkeeperAssessments', () => {
      it('should return assessments for user', () => {
        const assessments = service.getStarkeeperAssessments(mockUserToken);

        expect(Array.isArray(assessments)).toBe(true);
        expect(assessments.length).toBeGreaterThan(0);
        
        assessments.forEach(assessment => {
          expect(assessment).toHaveProperty('id');
          expect(assessment).toHaveProperty('userToken', mockUserToken);
          expect(assessment).toHaveProperty('type');
          expect(assessment).toHaveProperty('timestamp');
          expect(assessment).toHaveProperty('score');
          expect(assessment).toHaveProperty('answers');
          
          expect(typeof assessment.score).toBe('number');
          expect(Array.isArray(assessment.answers)).toBe(true);
          expect(['gad-7', 'phq-9']).toContain(assessment.type);
        });
      });

      it('should show improvement in assessment scores over time', () => {
        const assessments = service.getStarkeeperAssessments(mockUserToken);
        const gad7Assessments = assessments
          .filter(a => a.type === 'gad-7')
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (gad7Assessments.length >= 2) {
          expect(gad7Assessments[gad7Assessments.length - 1].score)
            .toBeLessThanOrEqual(gad7Assessments[0].score);
        }
      });
    });
  });

  describe('Constellation Guide (Helper) Data Methods', () => {
    describe('getConstellationGuideProfile', () => {
      it('should return helper profile with required fields', () => {
        const profile = service.getConstellationGuideProfile();

        expect(profile).toHaveProperty('id');
        expect(profile).toHaveProperty('auth0UserId');
        expect(profile).toHaveProperty('displayName');
        expect(profile).toHaveProperty('bio');
        expect(profile).toHaveProperty('joinDate');
        expect(profile).toHaveProperty('helperType');
        expect(profile).toHaveProperty('role');
        expect(profile).toHaveProperty('reputation');
        expect(profile).toHaveProperty('isAvailable');
        expect(profile).toHaveProperty('expertise');
        expect(profile).toHaveProperty('kudosCount');
        expect(profile).toHaveProperty('xp');
        expect(profile).toHaveProperty('level');

        expect(typeof profile.reputation).toBe('number');
        expect(profile.reputation).toBeGreaterThan(0);
        expect(profile.reputation).toBeLessThanOrEqual(5);
        expect(Array.isArray(profile.expertise)).toBe(true);
        expect(profile.expertise.length).toBeGreaterThan(0);
        expect(typeof profile.isAvailable).toBe('boolean');
      });
    });

    describe('getAllDilemmasForHelper', () => {
      it('should return all dilemmas visible to helper', () => {
        const dilemmas = service.getAllDilemmasForHelper();

        expect(Array.isArray(dilemmas)).toBe(true);
        expect(dilemmas.length).toBeGreaterThan(0);
        
        dilemmas.forEach(dilemma => {
          expect(dilemma).toHaveProperty('id');
          expect(dilemma).toHaveProperty('userToken');
          expect(dilemma).toHaveProperty('category');
          expect(dilemma).toHaveProperty('content');
          expect(dilemma).toHaveProperty('status');
        });
      });

      it('should include different dilemma statuses', () => {
        const dilemmas = service.getAllDilemmasForHelper();
        const statuses = [...new Set(dilemmas.map(d => d.status))];
        
        expect(statuses.length).toBeGreaterThan(1);
        expect(statuses).toContain('active');
      });
    });

    describe('getHelperChatSessions', () => {
      it('should return chat sessions for helper', () => {
        const sessions = service.getHelperChatSessions();

        expect(Array.isArray(sessions)).toBe(true);
        expect(sessions.length).toBeGreaterThan(0);
        
        sessions.forEach(session => {
          expect(session).toHaveProperty('dilemmaId');
          expect(session).toHaveProperty('messages');
          expect(session).toHaveProperty('unread');
          expect(session).toHaveProperty('perspective');
          
          expect(Array.isArray(session.messages)).toBe(true);
          expect(session.messages.length).toBeGreaterThan(0);
          expect(session.perspective).toBe('helper');
          
          session.messages.forEach(message => {
            expect(message).toHaveProperty('id');
            expect(message).toHaveProperty('sender');
            expect(message).toHaveProperty('text');
            expect(message).toHaveProperty('timestamp');
            expect(['user', 'poster']).toContain(message.sender);
          });
        });
      });
    });

    describe('getHelperSessions', () => {
      it('should return help sessions', () => {
        const sessions = service.getHelperSessions();

        expect(Array.isArray(sessions)).toBe(true);
        expect(sessions.length).toBeGreaterThan(0);
        
        sessions.forEach(session => {
          expect(session).toHaveProperty('id');
          expect(session).toHaveProperty('dilemmaId');
          expect(session).toHaveProperty('seekerId');
          expect(session).toHaveProperty('helperId');
          expect(session).toHaveProperty('helperDisplayName');
          expect(session).toHaveProperty('startedAt');
          expect(session).toHaveProperty('isFavorited');
          expect(session).toHaveProperty('kudosGiven');
          
          expect(typeof session.isFavorited).toBe('boolean');
          expect(typeof session.kudosGiven).toBe('boolean');
        });
      });
    });
  });

  describe('Admin Data Methods', () => {
    describe('getAdminHelperApplications', () => {
      it('should return helper applications', () => {
        const applications = service.getAdminHelperApplications();

        expect(Array.isArray(applications)).toBe(true);
        expect(applications.length).toBeGreaterThan(0);
        
        applications.forEach(app => {
          expect(app).toHaveProperty('id');
          expect(app).toHaveProperty('displayName');
          expect(app).toHaveProperty('applicationStatus');
          expect(['pending', 'approved', 'rejected']).toContain(app.applicationStatus);
        });
      });
    });

    describe('getAdminModerationActions', () => {
      it('should return moderation actions', () => {
        const actions = service.getAdminModerationActions();

        expect(Array.isArray(actions)).toBe(true);
        expect(actions.length).toBeGreaterThan(0);
        
        actions.forEach(action => {
          expect(action).toHaveProperty('id');
          expect(action).toHaveProperty('type');
          expect(action).toHaveProperty('targetId');
          expect(action).toHaveProperty('moderatorId');
          expect(action).toHaveProperty('reason');
          expect(action).toHaveProperty('timestamp');
          expect(action).toHaveProperty('status');
        });
      });
    });

    describe('getAdminCommunityStats', () => {
      it('should return community statistics', () => {
        const stats = service.getAdminCommunityStats();

        expect(stats).toHaveProperty('activeDilemmas');
        expect(stats).toHaveProperty('totalHelpers');
        expect(stats).toHaveProperty('avgTimeToFirstSupport');
        expect(stats).toHaveProperty('mostCommonCategory');
        
        expect(typeof stats.activeDilemmas).toBe('number');
        expect(typeof stats.totalHelpers).toBe('number');
        expect(typeof stats.avgTimeToFirstSupport).toBe('string');
        expect(typeof stats.mostCommonCategory).toBe('string');
        
        expect(stats.activeDilemmas).toBeGreaterThan(0);
        expect(stats.totalHelpers).toBeGreaterThan(0);
      });
    });

    describe('getAstralAdminProfile', () => {
      it('should return admin profile', () => {
        const profile = service.getAstralAdminProfile();

        expect(profile).toHaveProperty('id');
        expect(profile).toHaveProperty('displayName');
        expect(profile).toHaveProperty('role');
        expect(profile.role).toBe('Admin');
      });
    });
  });

  describe('Community Data Methods', () => {
    describe('getCommunityReflections', () => {
      it('should return community reflections', () => {
        const reflections = service.getCommunityReflections();

        expect(Array.isArray(reflections)).toBe(true);
        expect(reflections.length).toBeGreaterThan(0);
        
        reflections.forEach(reflection => {
          expect(reflection).toHaveProperty('id');
          expect(reflection).toHaveProperty('userToken');
          expect(reflection).toHaveProperty('content');
          expect(reflection).toHaveProperty('timestamp');
          expect(typeof reflection.content).toBe('string');
        });
      });
    });

    describe('getForumThreads', () => {
      it('should return forum threads', () => {
        const threads = service.getForumThreads();

        expect(Array.isArray(threads)).toBe(true);
        expect(threads.length).toBeGreaterThan(0);
        
        threads.forEach(thread => {
          expect(thread).toHaveProperty('id');
          expect(thread).toHaveProperty('title');
          expect(thread).toHaveProperty('authorId');
          expect(thread).toHaveProperty('authorName');
          expect(thread).toHaveProperty('timestamp');
          expect(thread).toHaveProperty('postCount');
          expect(thread).toHaveProperty('lastReply');
          
          expect(typeof thread.postCount).toBe('number');
          expect(thread.postCount).toBeGreaterThanOrEqual(0);
        });
      });
    });

    describe('getAIChatDemoSession', () => {
      it('should return AI chat demo session', () => {
        const session = service.getAIChatDemoSession();

        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('messages');
        expect(session).toHaveProperty('startedAt');
        expect(session).toHaveProperty('status');
        
        expect(Array.isArray(session.messages)).toBe(true);
        expect(session.messages.length).toBeGreaterThan(0);
        
        session.messages.forEach(message => {
          expect(message).toHaveProperty('id');
          expect(message).toHaveProperty('sender');
          expect(message).toHaveProperty('text');
          expect(message).toHaveProperty('timestamp');
          expect(['user', 'ai']).toContain(message.sender);
        });
      });
    });
  });

  describe('Crisis and Workflow Data Methods', () => {
    describe('getCrisisScenarioData', () => {
      it('should return crisis scenario data', () => {
        const crisisData = service.getCrisisScenarioData();

        expect(crisisData).toBeDefined();
        expect(typeof crisisData).toBe('object');
      });
    });

    describe('getInterconnectedWorkflowData', () => {
      it('should return interconnected workflow data', () => {
        const workflowData = service.getInterconnectedWorkflowData();

        expect(workflowData).toBeDefined();
        expect(typeof workflowData).toBe('object');
      });
    });

    describe('getMultipleWorkflowScenarios', () => {
      it('should return multiple workflow scenarios', () => {
        const scenarios = service.getMultipleWorkflowScenarios();

        expect(scenarios).toBeDefined();
        expect(typeof scenarios).toBe('object');
      });
    });

    describe('getCrisisEscalationScenarios', () => {
      it('should return crisis escalation scenarios', () => {
        const scenarios = service.getCrisisEscalationScenarios();

        expect(scenarios).toBeDefined();
        expect(typeof scenarios).toBe('object');
      });
    });
  });

  describe('Additional Community Methods', () => {
    describe('getWellnessChallenges', () => {
      it('should return wellness challenges array', () => {
        const challenges = service.getWellnessChallenges();

        expect(Array.isArray(challenges)).toBe(true);
      });
    });

    describe('getGroupDiscussions', () => {
      it('should return group discussions array', () => {
        const discussions = service.getGroupDiscussions();

        expect(Array.isArray(discussions)).toBe(true);
      });
    });

    describe('getCommunityForumPosts', () => {
      it('should return community forum posts array', () => {
        const posts = service.getCommunityForumPosts();

        expect(Array.isArray(posts)).toBe(true);
      });
    });

    describe('getCommunityEvents', () => {
      it('should return community events array', () => {
        const events = service.getCommunityEvents();

        expect(Array.isArray(events)).toBe(true);
      });
    });

    describe('getPeerConnections', () => {
      it('should return peer connections array', () => {
        const connections = service.getPeerConnections();

        expect(Array.isArray(connections)).toBe(true);
      });
    });

    describe('getCommunityUsers', () => {
      it('should return community users array', () => {
        const users = service.getCommunityUsers();

        expect(Array.isArray(users)).toBe(true);
      });
    });
  });

  describe('getDemoData', () => {
    it('should return user demo data', () => {
      const userToken = 'test-user-123';
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'demo_user') {
          return JSON.stringify({ sub: userToken });
        }
        return null;
      });

      const userData = service.getDemoData('user');

      expect(userData).toBeDefined();
      expect(userData).toHaveProperty('journalEntries');
      expect(userData).toHaveProperty('moodCheckIns');
      expect(userData).toHaveProperty('dilemmas');
      expect(userData).toHaveProperty('assessments');
    });

    it('should return helper demo data', () => {
      const helperData = service.getDemoData('helper');

      expect(helperData).toBeDefined();
      expect(helperData).toHaveProperty('profile');
      expect(helperData).toHaveProperty('chatSessions');
      expect(helperData).toHaveProperty('helpSessions');
      expect(helperData).toHaveProperty('allDilemmas');
    });

    it('should return admin demo data', () => {
      const adminData = service.getDemoData('admin');

      expect(adminData).toBeDefined();
      expect(adminData).toHaveProperty('profile');
      expect(adminData).toHaveProperty('helperApplications');
      expect(adminData).toHaveProperty('moderationActions');
      expect(adminData).toHaveProperty('communityStats');
    });

    it('should use cached data when available', () => {
      const cachedData = { cached: true };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = service.getDemoData('user');

      expect(result).toEqual(cachedData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('demo_data_user');
    });

    it('should store generated data in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      service.getDemoData('user');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'demo_data_user',
        expect.any(String)
      );
    });
  });

  describe('Data consistency and quality', () => {
    it('should have consistent user tokens in user data', () => {
      const userToken = 'test-user-123';
      
      const journalEntries = service.getStarkeeperJournalEntries(userToken);
      const moodCheckIns = service.getStarkeeperMoodCheckIns(userToken);
      const dilemmas = service.getStarkeeperDilemmas(userToken);
      const assessments = service.getStarkeeperAssessments(userToken);
      
      [...journalEntries, ...moodCheckIns, ...dilemmas, ...assessments].forEach(item => {
        expect(item.userToken).toBe(userToken);
      });
    });

    it('should have realistic timestamps (not future dates)', () => {
      const now = Date.now();
      const userToken = 'test-user-123';
      
      const journalEntries = service.getStarkeeperJournalEntries(userToken);
      
      journalEntries.forEach(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        expect(entryTime).toBeLessThanOrEqual(now);
      });
    });

    it('should have consistent helper references', () => {
      const helperProfile = service.getConstellationGuideProfile();
      const dilemmas = service.getAllDilemmasForHelper();
      
      const assignedDilemmas = dilemmas.filter(d => d.assignedHelperId);
      assignedDilemmas.forEach(dilemma => {
        if (dilemma.assignedHelperId === helperProfile.id) {
          expect(dilemma.helperDisplayName).toBe(helperProfile.displayName);
        }
      });
    });

    it('should have non-empty content in all text fields', () => {
      const userToken = 'test-user-123';
      const journalEntries = service.getStarkeeperJournalEntries(userToken);
      const dilemmas = service.getStarkeeperDilemmas(userToken);
      
      [...journalEntries, ...dilemmas].forEach(item => {
        expect(item.content.trim().length).toBeGreaterThan(0);
        expect(item.content).not.toMatch(/^\s*$/); // Not just whitespace
      });
    });
  });

  describe('Error handling', () => {
    it('should handle invalid user types in getDemoData', () => {
      const result = service.getDemoData('invalid' as any);
      
      expect(result).toBeDefined();
      // Should not throw an error
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        service.getDemoData('user');
      }).not.toThrow();
    });

    it('should handle malformed cached data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = service.getDemoData('user');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });
});