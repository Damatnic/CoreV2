import { getWebSocketService } from '../webSocketService';

// Mock WebSocket
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  protocol: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string, protocol?: string) {
    this.url = url;
    this.protocol = protocol || '';
    
    // Simulate connection after a brief delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send = jest.fn((_data: string) => {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  });

  close = jest.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  });

  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

global.WebSocket = MockWebSocket as unknown;

describe('WebSocketService', () => {
  let service: any;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    service = getWebSocketService();
    jest.clearAllMocks();
  });

  describe('connection management', () => {
    it('should establish WebSocket connection', async () => {
      const connection = await service.connect('ws://localhost:8080/crisis-support');

      expect(connection.connected).toBe(true);
      expect(connection.url).toBe('ws://localhost:8080/crisis-support');
    });

    it('should handle connection with authentication', async () => {
      const authToken = 'bearer-token-123';
      
      const connection = await service.connectWithAuth('ws://localhost:8080/secure', authToken);

      expect(connection.authenticated).toBe(true);
      expect(connection.connected).toBe(true);
    });

    it('should reconnect automatically on disconnection', async () => {
      await service.connect('ws://localhost:8080/test');
      
      const reconnectSpy = jest.spyOn(service, 'reconnect');
      
      // Simulate connection loss
      service.simulateDisconnection();
      
      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(reconnectSpy).toHaveBeenCalled();
    });

    it('should handle connection failures gracefully', async () => {
      // Mock WebSocket constructor to throw error
      const FailingWebSocket = function() {
        throw new Error('Connection failed');
      } as unknown;
      FailingWebSocket.CONNECTING = 0;
      FailingWebSocket.OPEN = 1;
      FailingWebSocket.CLOSING = 2;
      FailingWebSocket.CLOSED = 3;
      
      global.WebSocket = FailingWebSocket;

      const connection = await service.connect('ws://invalid-url');

      expect(connection.connected).toBe(false);
      expect(connection.error).toBeDefined();
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await service.connect('ws://localhost:8080/test');
      mockWebSocket = (global.WebSocket as unknown).mock.instances[0];
    });

    it('should send crisis alert messages', async () => {
      const crisisAlert = {
        type: 'crisis_alert',
        userId: 'user-123',
        riskLevel: 'high',
        message: 'Immediate intervention needed'
      };

      await service.sendCrisisAlert(crisisAlert);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'crisis_alert',
          payload: crisisAlert,
          timestamp: expect.any(Number)
        })
      );
    });

    it('should send chat messages in real-time', async () => {
      const chatMessage = {
        sessionId: 'session-456',
        senderId: 'user-123',
        text: 'I need someone to talk to',
        timestamp: Date.now()
      };

      await service.sendChatMessage(chatMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat_message',
          payload: chatMessage,
          timestamp: expect.any(Number)
        })
      );
    });

    it('should handle incoming messages', async () => {
      const messageHandler = jest.fn();
      service.onMessage(messageHandler);

      const incomingMessage = {
        type: 'chat_message',
        payload: {
          sessionId: 'session-456',
          senderId: 'helper-789',
          text: 'I\'m here to help. How are you feeling?'
        },
        timestamp: Date.now()
      };

      // Simulate incoming message
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', {
          data: JSON.stringify(incomingMessage)
        }));
      }

      expect(messageHandler).toHaveBeenCalledWith(incomingMessage);
    });

    it('should handle presence updates', async () => {
      const presenceHandler = jest.fn();
      service.onPresenceUpdate(presenceHandler);

      const presenceUpdate = {
        type: 'presence_update',
        payload: {
          userId: 'helper-789',
          status: 'online',
          availability: 'available'
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', {
          data: JSON.stringify(presenceUpdate)
        }));
      }

      expect(presenceHandler).toHaveBeenCalledWith(presenceUpdate.payload);
    });
  });

  describe('room and channel management', () => {
    beforeEach(async () => {
      await service.connect('ws://localhost:8080/test');
      mockWebSocket = (global.WebSocket as unknown).mock.instances[0];
    });

    it('should join crisis support room', async () => {
      await service.joinCrisisRoom('crisis-room-123', 'user-456');

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'join_room',
          payload: {
            roomId: 'crisis-room-123',
            userId: 'user-456',
            roomType: 'crisis_support'
          },
          timestamp: expect.any(Number)
        })
      );
    });

    it('should leave room gracefully', async () => {
      await service.leaveRoom('crisis-room-123', 'user-456');

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'leave_room',
          payload: {
            roomId: 'crisis-room-123',
            userId: 'user-456'
          },
          timestamp: expect.any(Number)
        })
      );
    });

    it('should handle room events', async () => {
      const roomEventHandler = jest.fn();
      service.onRoomEvent(roomEventHandler);

      const roomEvent = {
        type: 'room_event',
        payload: {
          roomId: 'crisis-room-123',
          event: 'user_joined',
          userId: 'helper-789',
          metadata: { role: 'crisis_counselor' }
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', {
          data: JSON.stringify(roomEvent)
        }));
      }

      expect(roomEventHandler).toHaveBeenCalledWith(roomEvent.payload);
    });
  });

  describe('crisis-specific features', () => {
    beforeEach(async () => {
      await service.connect('ws://localhost:8080/crisis-ws');
      mockWebSocket = (global.WebSocket as unknown).mock.instances[0];
    });

    it('should escalate crisis with high priority', async () => {
      const escalation = {
        userId: 'user-123',
        riskLevel: 'immediate',
        details: 'User expressing suicidal ideation',
        location: 'New York, NY'
      };

      await service.escalateCrisis(escalation);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'crisis_escalation',
          payload: escalation,
          priority: 'immediate',
          timestamp: expect.any(Number)
        })
      );
    });

    it('should handle emergency interventions', async () => {
      const interventionHandler = jest.fn();
      service.onEmergencyIntervention(interventionHandler);

      const intervention = {
        type: 'emergency_intervention',
        payload: {
          userId: 'user-123',
          interventionType: 'immediate_contact',
          responderAssigned: 'counselor-456',
          estimatedResponseTime: 300
        }
      };

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', {
          data: JSON.stringify(intervention)
        }));
      }

      expect(interventionHandler).toHaveBeenCalledWith(intervention.payload);
    });

    it('should send safety check requests', async () => {
      const safetyCheck = {
        userId: 'user-789',
        checkType: 'wellness',
        scheduledTime: Date.now() + 3600000, // 1 hour from now
        priority: 'medium'
      };

      await service.sendSafetyCheck(safetyCheck);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'safety_check',
          payload: safetyCheck,
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('connection health and monitoring', () => {
    beforeEach(async () => {
      await service.connect('ws://localhost:8080/test');
      mockWebSocket = (global.WebSocket as unknown).mock.instances[0];
    });

    it('should implement heartbeat mechanism', async () => {
      service.startHeartbeat(5000); // 5 second intervals

      await new Promise(resolve => setTimeout(resolve, 6000));

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'heartbeat',
          timestamp: expect.any(Number)
        })
      );
    });

    it('should monitor connection health', () => {
      const health = service.getConnectionHealth();

      expect(health).toHaveProperty('connected');
      expect(health).toHaveProperty('latency');
      expect(health).toHaveProperty('lastHeartbeat');
      expect(health).toHaveProperty('messagesPerSecond');
    });

    it('should detect and report connection issues', async () => {
      const connectionIssueHandler = jest.fn();
      service.onConnectionIssue(connectionIssueHandler);

      // Simulate connection issues
      service.simulateConnectionIssue('high_latency');

      expect(connectionIssueHandler).toHaveBeenCalledWith({
        issue: 'high_latency',
        severity: expect.any(String),
        timestamp: expect.any(Number)
      });
    });
  });

  describe('message queuing and offline support', () => {
    it('should queue messages when disconnected', async () => {
      // Don't connect, so messages should be queued
      const message = {
        type: 'chat_message',
        payload: { text: 'Hello' }
      };

      await service.sendMessage(message);

      const queuedMessages = service.getQueuedMessages();
      expect(queuedMessages).toHaveLength(1);
      expect(queuedMessages[0]).toEqual(expect.objectContaining(message));
    });

    it('should send queued messages when reconnected', async () => {
      // Queue messages while disconnected
      await service.sendMessage({ type: 'test', payload: { data: '1' } });
      await service.sendMessage({ type: 'test', payload: { data: '2' } });

      expect(service.getQueuedMessages()).toHaveLength(2);

      // Connect and verify messages are sent
      await service.connect('ws://localhost:8080/test');
      mockWebSocket = (global.WebSocket as unknown).mock.instances[0];

      await service.flushMessageQueue();

      expect(mockWebSocket.send).toHaveBeenCalledTimes(2);
      expect(service.getQueuedMessages()).toHaveLength(0);
    });

    it('should handle message priority in queue', async () => {
      const lowPriorityMsg = { type: 'chat', payload: {}, priority: 'low' };
      const highPriorityMsg = { type: 'crisis', payload: {}, priority: 'high' };

      await service.sendMessage(lowPriorityMsg);
      await service.sendMessage(highPriorityMsg);

      const queue = service.getQueuedMessages();
      expect(queue[0].priority).toBe('high');
      expect(queue[1].priority).toBe('low');
    });
  });

  describe('security and validation', () => {
    it('should validate message format', () => {
      const validMessage = {
        type: 'chat_message',
        payload: { text: 'Hello' },
        timestamp: Date.now()
      };

      const isValid = service.validateMessage(validMessage);
      expect(isValid).toBe(true);
    });

    it('should reject invalid messages', () => {
      const invalidMessage = {
        // Missing required fields
        payload: { text: 'Hello' }
      };

      const isValid = service.validateMessage(invalidMessage);
      expect(isValid).toBe(false);
    });

    it('should sanitize message content', () => {
      const unsafeMessage = {
        type: 'chat_message',
        payload: {
          text: '<script>alert("xss")</script>Safe text'
        }
      };

      const sanitized = service.sanitizeMessage(unsafeMessage);
      expect(sanitized.payload.text).not.toContain('<script>');
      expect(sanitized.payload.text).toContain('Safe text');
    });
  });

  describe('error handling and recovery', () => {
    it('should handle WebSocket errors gracefully', async () => {
      await service.connect('ws://localhost:8080/test');
      mockWebSocket = (global.WebSocket as unknown).mock.instances[0];

      const errorHandler = jest.fn();
      service.onError(errorHandler);

      // Simulate WebSocket error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Event('error'));
      }

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should implement exponential backoff for reconnection', async () => {
      const reconnectSpy = jest.spyOn(service, 'reconnectWithBackoff');
      
      await service.connect('ws://localhost:8080/test');
      
      // Simulate multiple disconnections
      for (let i = 0; i < 3; i++) {
        service.simulateDisconnection();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(reconnectSpy).toHaveBeenCalled();
    });

    it('should cleanup resources on disconnect', async () => {
      await service.connect('ws://localhost:8080/test');
      
      const cleanupSpy = jest.spyOn(service, 'cleanup');
      
      await service.disconnect();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});

// Add method stubs for testing
declare module '../websocketService' {
  interface WebSocketService {
    connect(url: string): Promise<unknown>;
    connectWithAuth(url: string, token: string): Promise<unknown>;
    reconnect(): Promise<void>;
    simulateDisconnection(): void;
    sendCrisisAlert(alert: any): Promise<void>;
    sendChatMessage(message: any): Promise<void>;
    onMessage(handler: Function): void;
    onPresenceUpdate(handler: Function): void;
    joinCrisisRoom(roomId: string, userId: string): Promise<void>;
    leaveRoom(roomId: string, userId: string): Promise<void>;
    onRoomEvent(handler: Function): void;
    escalateCrisis(escalation: any): Promise<void>;
    onEmergencyIntervention(handler: Function): void;
    sendSafetyCheck(check: any): Promise<void>;
    startHeartbeat(interval: number): void;
    getConnectionHealth(): any;
    onConnectionIssue(handler: Function): void;
    simulateConnectionIssue(issue: string): void;
    sendMessage(message: any): Promise<void>;
    getQueuedMessages(): unknown[];
    flushMessageQueue(): Promise<void>;
    validateMessage(message: any): boolean;
    sanitizeMessage(message: any): any;
    onError(handler: Function): void;
    reconnectWithBackoff(): Promise<void>;
    cleanup(): void;
    disconnect(): Promise<void>;
  }
}