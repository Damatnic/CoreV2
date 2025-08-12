/**
 * Test Suite for Safety Plan Reminders Service
 * Tests safety plan creation, management, and reminder systems
 */

import { safetyPlanRemindersService } from '../safetyPlanRemindersService';

describe('SafetyPlanRemindersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    safetyPlanRemindersService.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Safety Plan Creation', () => {
    it('should create a comprehensive safety plan', async () => {
      const planData = {
        userId: 'user-123',
        warningSignsTriggers: [
          'Feeling isolated',
          'Sleep disruption',
          'Negative self-talk'
        ],
        copingStrategies: [
          'Deep breathing',
          'Go for a walk',
          'Listen to music'
        ],
        supportContacts: [
          { name: 'Best Friend', phone: '555-0001', available: '24/7' },
          { name: 'Therapist', phone: '555-0002', available: 'Business hours' }
        ],
        professionalContacts: [
          { name: 'Crisis Hotline', phone: '988', available: '24/7' },
          { name: 'Emergency', phone: '911', available: '24/7' }
        ],
        safeEnvironment: [
          'Remove sharp objects',
          'Store medications safely',
          'Have someone stay with me'
        ]
      };

      const plan = await safetyPlanRemindersService.createSafetyPlan(planData);
      
      expect(plan.id).toBeDefined();
      expect(plan.userId).toBe('user-123');
      expect(plan.warningSignsTriggers).toHaveLength(3);
      expect(plan.copingStrategies).toHaveLength(3);
      expect(plan.supportContacts).toHaveLength(2);
      expect(plan.createdAt).toBeDefined();
      expect(plan.lastUpdated).toBeDefined();
    });

    it('should validate required safety plan components', async () => {
      const incompletePlan = {
        userId: 'user-456',
        warningSignsTriggers: [],
        copingStrategies: []
      };

      const result = await safetyPlanRemindersService.createSafetyPlan(incompletePlan);
      
      expect(result.valid).toBe(false);
      expect(result.missingComponents).toContain('warningSignsTriggers');
      expect(result.missingComponents).toContain('copingStrategies');
      expect(result.missingComponents).toContain('supportContacts');
    });

    it('should create templates for common situations', async () => {
      const templates = await safetyPlanRemindersService.getTemplates();
      
      expect(templates).toContainEqual(expect.objectContaining({
        name: 'Depression Safety Plan',
        category: 'mood'
      }));
      expect(templates).toContainEqual(expect.objectContaining({
        name: 'Anxiety Crisis Plan',
        category: 'anxiety'
      }));
      expect(templates).toContainEqual(expect.objectContaining({
        name: 'Substance Use Safety Plan',
        category: 'substance'
      }));
    });
  });

  describe('Reminder Scheduling', () => {
    it('should schedule daily check-in reminders', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-daily',
        reminderSettings: {
          dailyCheckIn: true,
          checkInTimes: ['09:00', '18:00']
        }
      });

      const reminders = await safetyPlanRemindersService.getScheduledReminders(plan.id);
      
      expect(reminders).toHaveLength(2);
      expect(reminders[0].type).toBe('daily-check-in');
      expect(reminders[0].time).toBe('09:00');
      expect(reminders[1].time).toBe('18:00');
    });

    it('should schedule strategy practice reminders', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-practice',
        copingStrategies: ['Meditation', 'Journaling'],
        reminderSettings: {
          practiceReminders: true,
          practiceFrequency: 'weekly'
        }
      });

      const reminders = await safetyPlanRemindersService.getPracticeReminders(plan.id);
      
      expect(reminders).toBeDefined();
      expect(reminders[0].strategy).toBeOneOf(['Meditation', 'Journaling']);
      expect(reminders[0].frequency).toBe('weekly');
    });

    it('should adapt reminder timing based on user patterns', async () => {
      const userPatterns = {
        highRiskTimes: ['evening', 'weekend'],
        lowEngagementTimes: ['morning'],
        timezone: 'America/New_York'
      };

      const plan = await safetyPlanRemindersService.createAdaptivePlan('user-789', userPatterns);
      
      expect(plan.reminders).toBeDefined();
      expect(plan.reminders.some(r => r.timing === 'evening')).toBe(true);
      expect(plan.reminders.some(r => r.dayOfWeek.includes('Saturday'))).toBe(true);
    });
  });

  describe('Crisis Detection Integration', () => {
    it('should trigger safety plan when crisis detected', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-crisis',
        triggerOnCrisis: true
      });

      const crisisEvent = {
        userId: 'user-crisis',
        severity: 'high',
        timestamp: Date.now()
      };

      const response = await safetyPlanRemindersService.handleCrisisEvent(crisisEvent);
      
      expect(response.planActivated).toBe(true);
      expect(response.notifications).toContain('safety-plan-activated');
      expect(response.immediateActions).toBeDefined();
      expect(response.contactsNotified).toBeDefined();
    });

    it('should escalate reminders during high-risk periods', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-risk',
        adaptiveIntensity: true
      });

      await safetyPlanRemindersService.updateRiskLevel('user-risk', 'elevated');
      
      const reminders = await safetyPlanRemindersService.getActiveReminders('user-risk');
      
      expect(reminders.frequency).toBe('increased');
      expect(reminders.intensity).toBe('high');
      expect(reminders.additionalCheckIns).toBeGreaterThan(0);
    });
  });

  describe('Interactive Reminders', () => {
    it('should create interactive coping strategy reminders', async () => {
      const reminder = await safetyPlanRemindersService.createInteractiveReminder({
        userId: 'user-interactive',
        strategy: 'breathing-exercise',
        interactive: true
      });

      expect(reminder.type).toBe('interactive');
      expect(reminder.actions).toContain('start-exercise');
      expect(reminder.actions).toContain('skip');
      expect(reminder.actions).toContain('snooze');
      expect(reminder.feedbackRequired).toBe(true);
    });

    it('should track reminder engagement', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-engagement'
      });

      // Simulate reminder interactions
      await safetyPlanRemindersService.recordInteraction(plan.id, {
        reminderId: 'rem-1',
        action: 'completed',
        timestamp: Date.now()
      });

      await safetyPlanRemindersService.recordInteraction(plan.id, {
        reminderId: 'rem-2',
        action: 'skipped',
        timestamp: Date.now()
      });

      const engagement = await safetyPlanRemindersService.getEngagementMetrics(plan.id);
      
      expect(engagement.totalReminders).toBe(2);
      expect(engagement.completedReminders).toBe(1);
      expect(engagement.engagementRate).toBe(0.5);
      expect(engagement.mostEngagedStrategy).toBeDefined();
    });

    it('should provide quick access buttons in reminders', async () => {
      const reminder = await safetyPlanRemindersService.createQuickAccessReminder({
        userId: 'user-quick',
        includeQuickActions: true
      });

      expect(reminder.quickActions).toBeDefined();
      expect(reminder.quickActions).toContainEqual(expect.objectContaining({
        label: 'Call Support',
        action: 'dial-support'
      }));
      expect(reminder.quickActions).toContainEqual(expect.objectContaining({
        label: 'Start Breathing',
        action: 'breathing-exercise'
      }));
      expect(reminder.quickActions).toContainEqual(expect.objectContaining({
        label: 'View Full Plan',
        action: 'open-safety-plan'
      }));
    });
  });

  describe('Progress Tracking', () => {
    it('should track safety plan usage over time', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-progress'
      });

      // Simulate plan usage
      const usageEvents = [
        { strategy: 'breathing', success: true },
        { strategy: 'walking', success: true },
        { strategy: 'calling-friend', success: false },
        { strategy: 'breathing', success: true }
      ];

      for (const event of usageEvents) {
        await safetyPlanRemindersService.recordUsage(plan.id, event);
      }

      const progress = await safetyPlanRemindersService.getProgressReport(plan.id);
      
      expect(progress.totalUsage).toBe(4);
      expect(progress.successRate).toBe(0.75);
      expect(progress.mostEffectiveStrategy).toBe('breathing');
      expect(progress.leastEffectiveStrategy).toBe('calling-friend');
    });

    it('should identify patterns in plan effectiveness', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-patterns'
      });

      // Simulate usage patterns
      const patterns = [
        { time: 'morning', strategy: 'exercise', effective: true },
        { time: 'evening', strategy: 'exercise', effective: false },
        { time: 'evening', strategy: 'meditation', effective: true }
      ];

      for (const pattern of patterns) {
        await safetyPlanRemindersService.recordPatternData(plan.id, pattern);
      }

      const analysis = await safetyPlanRemindersService.analyzePatterns(plan.id);
      
      expect(analysis.timeBasedEffectiveness).toBeDefined();
      expect(analysis.recommendations).toContain('Use exercise in morning');
      expect(analysis.recommendations).toContain('Use meditation in evening');
    });
  });

  describe('Personalization and Learning', () => {
    it('should personalize reminders based on user preferences', async () => {
      const preferences = {
        communicationStyle: 'encouraging',
        reminderTone: 'gentle',
        preferredStrategies: ['art', 'music'],
        avoidStrategies: ['social']
      };

      const plan = await safetyPlanRemindersService.createPersonalizedPlan('user-personal', preferences);
      
      expect(plan.reminders[0].tone).toBe('gentle');
      expect(plan.reminders[0].message).toContain('You can do this');
      expect(plan.suggestedStrategies).toContain('art');
      expect(plan.suggestedStrategies).not.toContain('social');
    });

    it('should learn from user feedback', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-learning'
      });

      // Provide feedback
      await safetyPlanRemindersService.provideFeedback(plan.id, {
        reminderId: 'rem-1',
        helpful: false,
        reason: 'too-frequent'
      });

      await safetyPlanRemindersService.provideFeedback(plan.id, {
        reminderId: 'rem-2',
        helpful: true,
        reason: 'perfect-timing'
      });

      const updatedPlan = await safetyPlanRemindersService.optimizePlan(plan.id);
      
      expect(updatedPlan.reminderFrequency).toBeLessThan(plan.reminderFrequency);
      expect(updatedPlan.optimized).toBe(true);
    });
  });

  describe('Multi-channel Delivery', () => {
    it('should deliver reminders through multiple channels', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-multichannel',
        deliveryChannels: ['app', 'sms', 'email']
      });

      const reminder = await safetyPlanRemindersService.sendReminder(plan.id, {
        type: 'check-in',
        priority: 'normal'
      });

      expect(reminder.deliveredChannels).toContain('app');
      expect(reminder.deliveredChannels).toContain('sms');
      expect(reminder.deliveredChannels).toContain('email');
      expect(reminder.deliveryStatus).toBe('success');
    });

    it('should fallback to alternative channels on failure', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-fallback',
        primaryChannel: 'app',
        fallbackChannels: ['sms', 'email']
      });

      // Simulate primary channel failure
      safetyPlanRemindersService.simulateChannelFailure('app');

      const reminder = await safetyPlanRemindersService.sendReminder(plan.id, {
        type: 'urgent'
      });

      expect(reminder.primaryFailed).toBe(true);
      expect(reminder.deliveredVia).toBe('sms');
      expect(reminder.fallbackUsed).toBe(true);
    });
  });

  describe('Emergency Activation', () => {
    it('should activate emergency contacts in crisis', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-emergency',
        emergencyContacts: [
          { name: 'Emergency Contact', phone: '555-911', priority: 1 },
          { name: 'Therapist', phone: '555-0001', priority: 2 }
        ]
      });

      const activation = await safetyPlanRemindersService.activateEmergencyProtocol(plan.id);
      
      expect(activation.contactsNotified).toHaveLength(2);
      expect(activation.contactsNotified[0].name).toBe('Emergency Contact');
      expect(activation.locationShared).toBe(true);
      expect(activation.crisisResourcesProvided).toBe(true);
    });

    it('should provide immediate coping strategies during activation', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-immediate'
      });

      const activation = await safetyPlanRemindersService.activateImmediate(plan.id);
      
      expect(activation.immediateStrategies).toBeDefined();
      expect(activation.immediateStrategies).toContainEqual(expect.objectContaining({
        name: 'Grounding Exercise',
        duration: '5 minutes'
      }));
      expect(activation.guidedSupport).toBe(true);
    });
  });

  describe('Collaboration Features', () => {
    it('should allow sharing safety plan with trusted contacts', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-share'
      });

      const shareResult = await safetyPlanRemindersService.sharePlan(plan.id, {
        recipients: ['contact1@example.com', 'contact2@example.com'],
        permissions: 'view-only'
      });

      expect(shareResult.shared).toBe(true);
      expect(shareResult.recipients).toHaveLength(2);
      expect(shareResult.accessLevel).toBe('view-only');
    });

    it('should sync updates with care team', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-team',
        careTeam: ['therapist-id', 'psychiatrist-id']
      });

      await safetyPlanRemindersService.updatePlan(plan.id, {
        copingStrategies: ['New strategy']
      });

      const syncStatus = await safetyPlanRemindersService.getSyncStatus(plan.id);
      
      expect(syncStatus.synced).toBe(true);
      expect(syncStatus.lastSync).toBeDefined();
      expect(syncStatus.syncedWith).toContain('therapist-id');
    });
  });

  describe('Maintenance and Review', () => {
    it('should prompt for periodic plan reviews', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-review',
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days ago
      });

      const reviewStatus = await safetyPlanRemindersService.checkReviewStatus(plan.id);
      
      expect(reviewStatus.reviewDue).toBe(true);
      expect(reviewStatus.daysSinceLastReview).toBe(30);
      expect(reviewStatus.suggestedChanges).toBeDefined();
    });

    it('should track plan version history', async () => {
      const plan = await safetyPlanRemindersService.createSafetyPlan({
        userId: 'user-version'
      });

      // Make updates
      await safetyPlanRemindersService.updatePlan(plan.id, {
        copingStrategies: ['Updated strategy 1']
      });

      await safetyPlanRemindersService.updatePlan(plan.id, {
        copingStrategies: ['Updated strategy 2']
      });

      const history = await safetyPlanRemindersService.getVersionHistory(plan.id);
      
      expect(history.versions).toHaveLength(3); // Initial + 2 updates
      expect(history.versions[0].version).toBe(1);
      expect(history.canRevert).toBe(true);
    });
  });
});