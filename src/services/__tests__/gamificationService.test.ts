/**
 * Test Suite for Gamification Service
 * Tests achievement system, points, badges, and user progression
 */

import { gamificationService } from '../gamificationService';

describe('GamificationService', () => {
  const mockUserId = 'user123';
  
  beforeEach(() => {
    localStorage.clear();
    gamificationService.reset();
    gamificationService.initializeUser(mockUserId);
  });

  describe('Points System', () => {
    it('should award points for actions', () => {
      gamificationService.awardPoints(mockUserId, 100, 'completed_assessment');
      
      const points = gamificationService.getUserPoints(mockUserId);
      expect(points).toBe(100);
    });

    it('should accumulate points', () => {
      gamificationService.awardPoints(mockUserId, 50, 'daily_checkin');
      gamificationService.awardPoints(mockUserId, 30, 'helped_peer');
      gamificationService.awardPoints(mockUserId, 20, 'journal_entry');
      
      expect(gamificationService.getUserPoints(mockUserId)).toBe(100);
    });

    it('should track point history', () => {
      gamificationService.awardPoints(mockUserId, 50, 'daily_checkin');
      gamificationService.awardPoints(mockUserId, 30, 'helped_peer');
      
      const history = gamificationService.getPointHistory(mockUserId);
      expect(history).toHaveLength(2);
      expect(history[0].points).toBe(50);
      expect(history[0].reason).toBe('daily_checkin');
    });

    it('should handle point deduction', () => {
      gamificationService.awardPoints(mockUserId, 100, 'initial');
      gamificationService.deductPoints(mockUserId, 30, 'penalty');
      
      expect(gamificationService.getUserPoints(mockUserId)).toBe(70);
    });

    it('should not allow negative points', () => {
      gamificationService.awardPoints(mockUserId, 50, 'initial');
      gamificationService.deductPoints(mockUserId, 100, 'penalty');
      
      expect(gamificationService.getUserPoints(mockUserId)).toBe(0);
    });
  });

  describe('Achievements', () => {
    it('should unlock achievements based on criteria', () => {
      // Trigger achievement by completing actions
      gamificationService.trackAction(mockUserId, 'complete_assessment');
      gamificationService.trackAction(mockUserId, 'complete_assessment');
      gamificationService.trackAction(mockUserId, 'complete_assessment');
      
      const achievements = gamificationService.getUserAchievements(mockUserId);
      expect(achievements).toContain('assessment_master');
    });

    it('should award badge for achievement', () => {
      gamificationService.unlockAchievement(mockUserId, 'first_session');
      
      const badges = gamificationService.getUserBadges(mockUserId);
      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('first_session');
      expect(badges[0].name).toBeDefined();
      expect(badges[0].description).toBeDefined();
    });

    it('should check if achievement is unlocked', () => {
      expect(gamificationService.hasAchievement(mockUserId, 'helper_hero')).toBe(false);
      
      gamificationService.unlockAchievement(mockUserId, 'helper_hero');
      expect(gamificationService.hasAchievement(mockUserId, 'helper_hero')).toBe(true);
    });

    it('should get achievement progress', () => {
      const progress = gamificationService.getAchievementProgress(mockUserId, 'daily_streak_7');
      
      expect(progress).toHaveProperty('current');
      expect(progress).toHaveProperty('target');
      expect(progress).toHaveProperty('percentage');
    });

    it('should trigger achievement notification', () => {
      const notificationSpy = jest.spyOn(gamificationService, 'notifyAchievement');
      
      gamificationService.unlockAchievement(mockUserId, 'crisis_helper');
      
      expect(notificationSpy).toHaveBeenCalledWith(mockUserId, 'crisis_helper');
    });
  });

  describe('Levels and Progression', () => {
    it('should calculate user level based on XP', () => {
      gamificationService.awardXP(mockUserId, 100);
      expect(gamificationService.getUserLevel(mockUserId)).toBe(1);
      
      gamificationService.awardXP(mockUserId, 500);
      expect(gamificationService.getUserLevel(mockUserId)).toBe(2);
      
      gamificationService.awardXP(mockUserId, 1500);
      expect(gamificationService.getUserLevel(mockUserId)).toBe(3);
    });

    it('should track XP to next level', () => {
      gamificationService.awardXP(mockUserId, 450);
      
      const progress = gamificationService.getLevelProgress(mockUserId);
      expect(progress.currentXP).toBe(450);
      expect(progress.xpToNextLevel).toBeGreaterThan(0);
      expect(progress.percentage).toBeGreaterThan(0);
      expect(progress.percentage).toBeLessThan(100);
    });

    it('should trigger level up rewards', () => {
      gamificationService.awardXP(mockUserId, 500);
      
      const levelUpReward = gamificationService.checkLevelUpReward(mockUserId);
      expect(levelUpReward).toBeDefined();
      expect(levelUpReward).toHaveProperty('newLevel');
      expect(levelUpReward).toHaveProperty('rewards');
    });

    it('should handle prestige levels', () => {
      // Award massive XP to reach max level
      gamificationService.awardXP(mockUserId, 100000);
      
      const level = gamificationService.getUserLevel(mockUserId);
      const prestige = gamificationService.getPrestigeLevel(mockUserId);
      
      expect(level).toBeLessThanOrEqual(100); // Max level cap
      expect(prestige).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Streaks', () => {
    it('should track daily login streak', () => {
      gamificationService.recordDailyLogin(mockUserId);
      
      const streak = gamificationService.getLoginStreak(mockUserId);
      expect(streak).toBe(1);
    });

    it('should increment streak for consecutive days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      gamificationService.recordLoginOnDate(mockUserId, yesterday);
      gamificationService.recordDailyLogin(mockUserId);
      
      expect(gamificationService.getLoginStreak(mockUserId)).toBe(2);
    });

    it('should reset streak after missing a day', () => {
      const today = new Date();
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      gamificationService.recordLoginOnDate(mockUserId, twoDaysAgo);
      gamificationService.recordDailyLogin(mockUserId);
      
      expect(gamificationService.getLoginStreak(mockUserId)).toBe(1);
    });

    it('should track longest streak', () => {
      // Build a 5-day streak
      for (let i = 4; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        gamificationService.recordLoginOnDate(mockUserId, date);
      }
      
      expect(gamificationService.getLongestStreak(mockUserId)).toBe(5);
    });

    it('should award streak achievements', () => {
      // Build a 7-day streak
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        gamificationService.recordLoginOnDate(mockUserId, date);
      }
      
      const achievements = gamificationService.getUserAchievements(mockUserId);
      expect(achievements).toContain('week_streak');
    });
  });

  describe('Challenges', () => {
    it('should create daily challenges', () => {
      const challenges = gamificationService.getDailyChallenges(mockUserId);
      
      expect(challenges).toHaveLength(3); // Default 3 daily challenges
      expect(challenges[0]).toHaveProperty('id');
      expect(challenges[0]).toHaveProperty('description');
      expect(challenges[0]).toHaveProperty('reward');
      expect(challenges[0]).toHaveProperty('progress');
    });

    it('should track challenge progress', () => {
      const challenges = gamificationService.getDailyChallenges(mockUserId);
      const challengeId = challenges[0].id;
      
      gamificationService.updateChallengeProgress(mockUserId, challengeId, 1);
      
      const updated = gamificationService.getChallengeById(mockUserId, challengeId);
      expect(updated.progress.current).toBe(1);
    });

    it('should complete challenges and award rewards', () => {
      const challenges = gamificationService.getDailyChallenges(mockUserId);
      const challenge = challenges[0];
      
      // Complete the challenge
      gamificationService.updateChallengeProgress(mockUserId, challenge.id, challenge.progress.target);
      
      const completed = gamificationService.getChallengeById(mockUserId, challenge.id);
      expect(completed.completed).toBe(true);
      
      // Check if reward was awarded
      const points = gamificationService.getUserPoints(mockUserId);
      expect(points).toBeGreaterThanOrEqual(challenge.reward.points);
    });

    it('should refresh challenges daily', () => {
      const challengesToday = gamificationService.getDailyChallenges(mockUserId);
      
      // Simulate next day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      jest.spyOn(Date, 'now').mockImplementation(() => tomorrow.getTime());
      
      const challengesTomorrow = gamificationService.getDailyChallenges(mockUserId);
      
      expect(challengesTomorrow[0].id).not.toBe(challengesToday[0].id);
    });
  });

  describe('Leaderboards', () => {
    it('should get global leaderboard', async () => {
      // Add multiple users with scores
      gamificationService.initializeUser('user1');
      gamificationService.initializeUser('user2');
      gamificationService.initializeUser('user3');
      
      gamificationService.awardPoints('user1', 100, 'test');
      gamificationService.awardPoints('user2', 200, 'test');
      gamificationService.awardPoints('user3', 150, 'test');
      
      const leaderboard = await gamificationService.getGlobalLeaderboard();
      
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].userId).toBe('user2');
      expect(leaderboard[0].points).toBe(200);
    });

    it('should get user rank', () => {
      gamificationService.initializeUser('user1');
      gamificationService.initializeUser('user2');
      
      gamificationService.awardPoints('user1', 100, 'test');
      gamificationService.awardPoints('user2', 200, 'test');
      gamificationService.awardPoints(mockUserId, 150, 'test');
      
      const rank = gamificationService.getUserRank(mockUserId);
      expect(rank).toBe(2);
    });

    it('should get friends leaderboard', async () => {
      const friendIds = ['friend1', 'friend2', 'friend3'];
      friendIds.forEach(id => gamificationService.initializeUser(id));
      
      gamificationService.awardPoints('friend1', 100, 'test');
      gamificationService.awardPoints('friend2', 200, 'test');
      gamificationService.awardPoints('friend3', 150, 'test');
      
      const leaderboard = await gamificationService.getFriendsLeaderboard(mockUserId, friendIds);
      
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].userId).toBe('friend2');
    });
  });

  describe('Statistics and Analytics', () => {
    it('should track user statistics', () => {
      gamificationService.trackAction(mockUserId, 'help_given');
      gamificationService.trackAction(mockUserId, 'help_given');
      gamificationService.trackAction(mockUserId, 'post_created');
      
      const stats = gamificationService.getUserStats(mockUserId);
      
      expect(stats.totalActions).toBe(3);
      expect(stats.actionsBreakdown['help_given']).toBe(2);
      expect(stats.actionsBreakdown['post_created']).toBe(1);
    });

    it('should calculate engagement score', () => {
      // Perform various activities
      gamificationService.recordDailyLogin(mockUserId);
      gamificationService.trackAction(mockUserId, 'help_given');
      gamificationService.trackAction(mockUserId, 'assessment_completed');
      gamificationService.awardPoints(mockUserId, 100, 'activity');
      
      const engagement = gamificationService.getEngagementScore(mockUserId);
      
      expect(engagement).toBeGreaterThan(0);
      expect(engagement).toBeLessThanOrEqual(100);
    });

    it('should generate activity summary', () => {
      // Perform activities over time
      gamificationService.trackAction(mockUserId, 'login');
      gamificationService.trackAction(mockUserId, 'post_created');
      gamificationService.awardPoints(mockUserId, 50, 'daily_bonus');
      
      const summary = gamificationService.getActivitySummary(mockUserId, 7); // Last 7 days
      
      expect(summary).toHaveProperty('totalPoints');
      expect(summary).toHaveProperty('achievementsUnlocked');
      expect(summary).toHaveProperty('activeDays');
      expect(summary).toHaveProperty('mostFrequentAction');
    });
  });

  describe('Rewards Shop', () => {
    it('should list available rewards', () => {
      const rewards = gamificationService.getAvailableRewards();
      
      expect(Array.isArray(rewards)).toBe(true);
      expect(rewards.length).toBeGreaterThan(0);
      expect(rewards[0]).toHaveProperty('id');
      expect(rewards[0]).toHaveProperty('name');
      expect(rewards[0]).toHaveProperty('cost');
    });

    it('should purchase rewards with points', () => {
      gamificationService.awardPoints(mockUserId, 1000, 'initial');
      
      const reward = { id: 'theme_unlock', cost: 500 };
      const result = gamificationService.purchaseReward(mockUserId, reward.id);
      
      expect(result.success).toBe(true);
      expect(gamificationService.getUserPoints(mockUserId)).toBe(500);
      expect(gamificationService.getUserRewards(mockUserId)).toContain(reward.id);
    });

    it('should prevent purchase with insufficient points', () => {
      gamificationService.awardPoints(mockUserId, 100, 'initial');
      
      const result = gamificationService.purchaseReward(mockUserId, 'expensive_reward');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient points');
      expect(gamificationService.getUserPoints(mockUserId)).toBe(100);
    });
  });
});