import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

/**
 * Comprehensive API Integration Tests
 * Tests all API endpoints for functionality, security, and error handling
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8888/.netlify/functions';
const TEST_USER = {
  email: 'test@mentalhealth.com',
  password: 'SecureTest123!',
  name: 'Test User',
};

let authToken: string;
let userId: string;

describe('API Endpoints Integration Tests', () => {
  
  describe('Authentication API', () => {
    test('POST /api-auth - Register new user', async () => {
      const response = await fetch(`${BASE_URL}/api-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          ...TEST_USER,
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(TEST_USER.email);
      
      authToken = data.token;
      userId = data.user.id;
    });

    test('POST /api-auth - Login with valid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: TEST_USER.email,
          password: TEST_USER.password,
        }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(TEST_USER.email);
    });

    test('POST /api-auth - Login with invalid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: TEST_USER.email,
          password: 'WrongPassword',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('POST /api-auth - Validate token', async () => {
      const response = await fetch(`${BASE_URL}/api-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'validate',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('valid', true);
      expect(data).toHaveProperty('user');
    });

    test('POST /api-auth - Refresh token', async () => {
      const response = await fetch(`${BASE_URL}/api-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'refresh',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data.token).not.toBe(authToken);
    });
  });

  describe('Wellness API', () => {
    let moodEntryId: string;

    test('POST /api-wellness - Create mood entry', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'createMood',
          mood: 7,
          emotions: ['happy', 'relaxed'],
          notes: 'Feeling good today',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.mood).toBe(7);
      expect(data.emotions).toContain('happy');
      
      moodEntryId = data.id;
    });

    test('GET /api-wellness - Get mood history', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness?action=getMoodHistory`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('mood');
    });

    test('POST /api-wellness - Create journal entry', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'createJournal',
          title: 'Test Journal Entry',
          content: 'This is a test journal entry for integration testing.',
          tags: ['testing', 'development'],
          isPrivate: true,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.title).toBe('Test Journal Entry');
      expect(data.isPrivate).toBe(true);
    });

    test('POST /api-wellness - Track habit', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'trackHabit',
          habitId: 'meditation',
          completed: true,
          duration: 15,
          notes: 'Morning meditation session',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('habitId', 'meditation');
      expect(data.completed).toBe(true);
    });

    test('GET /api-wellness - Get wellness insights', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness?action=getInsights`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('averageMood');
      expect(data).toHaveProperty('moodTrend');
      expect(data).toHaveProperty('topEmotions');
      expect(data).toHaveProperty('streaks');
    });
  });

  describe('Safety API', () => {
    let safetyPlanId: string;

    test('POST /api-safety - Create safety plan', async () => {
      const response = await fetch(`${BASE_URL}/api-safety`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'createSafetyPlan',
          warningSignals: ['Feeling isolated', 'Negative thoughts'],
          copingStrategies: ['Deep breathing', 'Call a friend'],
          supportContacts: [
            { name: 'Friend', phone: '555-0123' },
            { name: 'Therapist', phone: '555-0456' },
          ],
          emergencyContacts: [
            { name: 'Crisis Line', phone: '988' },
            { name: 'Emergency', phone: '911' },
          ],
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.warningSignals).toHaveLength(2);
      expect(data.supportContacts).toHaveLength(2);
      
      safetyPlanId = data.id;
    });

    test('GET /api-safety - Get safety plan', async () => {
      const response = await fetch(`${BASE_URL}/api-safety?action=getSafetyPlan`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id', safetyPlanId);
      expect(data).toHaveProperty('warningSignals');
      expect(data).toHaveProperty('copingStrategies');
    });

    test('POST /api-safety - Report crisis', async () => {
      const response = await fetch(`${BASE_URL}/api-safety`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'reportCrisis',
          severity: 'high',
          triggerWords: ['help', 'crisis'],
          message: 'I need immediate help',
          location: { lat: 40.7128, lng: -74.0060 },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('crisisId');
      expect(data).toHaveProperty('supportContacted');
      expect(data).toHaveProperty('resources');
    });

    test('GET /api-safety - Get emergency contacts', async () => {
      const response = await fetch(`${BASE_URL}/api-safety?action=getEmergencyContacts`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('phone');
    });
  });

  describe('AI Chat API', () => {
    test('POST /api-ai - Send message to AI', async () => {
      const response = await fetch(`${BASE_URL}/api-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message: 'I am feeling anxious about my upcoming exam',
          context: 'mental_health_support',
          conversationId: 'test-conversation',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('riskAssessment');
      expect(data.response).toBeTruthy();
      expect(typeof data.response).toBe('string');
    });

    test('POST /api-ai - Crisis detection in message', async () => {
      const response = await fetch(`${BASE_URL}/api-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message: 'I am having thoughts of self-harm',
          context: 'mental_health_support',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('riskAssessment');
      expect(data.riskAssessment.level).toBe('high');
      expect(data).toHaveProperty('emergencyResources');
    });

    test('GET /api-ai - Get conversation history', async () => {
      const response = await fetch(`${BASE_URL}/api-ai?action=getHistory&conversationId=test-conversation`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('message');
        expect(data[0]).toHaveProperty('response');
        expect(data[0]).toHaveProperty('timestamp');
      }
    });
  });

  describe('Real-time API', () => {
    test('POST /api-realtime - Subscribe to notifications', async () => {
      const response = await fetch(`${BASE_URL}/api-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'subscribe',
          channels: ['notifications', 'crisis-alerts'],
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('subscribed');
      expect(data.subscribed).toBe(true);
      expect(data).toHaveProperty('channels');
    });

    test('POST /api-realtime - Send mood update', async () => {
      const response = await fetch(`${BASE_URL}/api-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'broadcastMood',
          mood: 8,
          emoji: '😊',
          message: 'Feeling great!',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('broadcast');
      expect(data.broadcast).toBe(true);
    });

    test('POST /api-realtime - Trigger crisis alert', async () => {
      const response = await fetch(`${BASE_URL}/api-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'crisisAlert',
          userId: userId,
          severity: 'critical',
          location: { lat: 40.7128, lng: -74.0060 },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('alertSent');
      expect(data).toHaveProperty('notifiedContacts');
      expect(data.alertSent).toBe(true);
    });
  });

  describe('Security Tests', () => {
    test('Unauthorized access returns 401', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness?action=getMoodHistory`);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('Invalid token returns 401', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness?action=getMoodHistory`, {
        headers: {
          'Authorization': 'Bearer invalid-token-here',
        },
      });
      
      expect(response.status).toBe(401);
    });

    test('SQL injection attempt is blocked', async () => {
      const response = await fetch(`${BASE_URL}/api-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: "admin' OR '1'='1",
          password: "password' OR '1'='1",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('XSS attempt is sanitized', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'createJournal',
          title: '<script>alert("XSS")</script>',
          content: '<img src=x onerror=alert("XSS")>',
        }),
      });

      if (response.status === 201) {
        const data = await response.json();
        expect(data.title).not.toContain('<script>');
        expect(data.content).not.toContain('onerror=');
      }
    });

    test('Rate limiting is enforced', async () => {
      const requests = [];
      
      // Send 20 rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          fetch(`${BASE_URL}/api-wellness?action=getMoodHistory`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('CORS headers are properly set', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness?action=getMoodHistory`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Origin': 'https://example.com',
        },
      });

      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
      expect(response.headers.get('access-control-allow-methods')).toContain('GET');
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    });
  });

  describe('Error Handling', () => {
    test('Invalid endpoint returns 404', async () => {
      const response = await fetch(`${BASE_URL}/api-nonexistent`);
      expect(response.status).toBe(404);
    });

    test('Invalid JSON returns 400', async () => {
      const response = await fetch(`${BASE_URL}/api-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: 'invalid-json',
      });

      expect(response.status).toBe(400);
    });

    test('Missing required fields returns 400', async () => {
      const response = await fetch(`${BASE_URL}/api-wellness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'createMood',
          // Missing required 'mood' field
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('Server error returns 500', async () => {
      // Simulate server error by sending malformed data
      const response = await fetch(`${BASE_URL}/api-wellness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'unknownAction',
          data: { corrupt: true },
        }),
      });

      expect([400, 500]).toContain(response.status);
    });
  });
});