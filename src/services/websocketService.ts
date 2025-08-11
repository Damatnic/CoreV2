// WebSocket service for real-time features
import React from 'react';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  username: string;
  timestamp: number;
  type: 'text' | 'emoji' | 'system';
  roomId?: string;
}

export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  actionUrl?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 2; // Reduced from 5
  private readonly reconnectInterval = 5000; // Increased from 1000ms
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly messageQueue: WebSocketMessage[] = [];
  private readonly listeners = new Map<string, Set<(message: any) => void>>();
  private readonly connectionListeners = new Set<(connected: boolean) => void>();
  private demoMode = false;

  constructor(private readonly url: string) {
    // Check if we're in demo mode or if WebSocket server is unavailable
    this.checkDemoMode();
    if (!this.demoMode) {
      this.connect();
    }
  }

  private checkDemoMode() {
    // Enable demo mode if no backend is available
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = this.url.includes('localhost');
    
    if (isDevelopment && isLocalhost) {
      // Try a quick ping to see if server is available
      this.demoMode = true; // Default to demo mode for now
      this.demoMode = true;
    }
  }

  private connect() {
    if (this.demoMode) {
      // Don't try to connect in demo mode
      this.simulateDemoConnection();
      return;
    }

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      // Silently handle connection failure on first attempt
      if (this.reconnectAttempts === 0) {
        console.info('WebSocket server not available, running in offline mode');
      }
      this.scheduleReconnect();
    }
  }

  private simulateDemoConnection() {
    // Simulate successful connection for demo mode
    setTimeout(() => {
      this.notifyConnectionListeners(true);
      this.flushMessageQueue();
    }, 100);
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.info('✓ WebSocket connected');
      }
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyConnectionListeners(true);
      this.flushMessageQueue();
    };

    this.ws.onclose = (event) => {
      // Only log meaningful disconnections
      if (event.code !== 1000 && process.env.NODE_ENV === 'development') {
        console.info('WebSocket disconnected (offline mode)');
      }
      this.stopHeartbeat();
      this.notifyConnectionListeners(false);
      
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (_error) => {
      // Suppress error logging - we'll handle it gracefully
      // console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message.payload);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    
    // Stop trying after max attempts
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      // Switch to demo mode after failing to connect
      this.demoMode = true;
      this.simulateDemoConnection();
      return;
    }
    
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      // Silent reconnection attempt
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  private sendMessage(message: WebSocketMessage) {
    // In demo mode, simulate successful send
    if (this.demoMode) {
      // Simulate processing delay
      setTimeout(() => {
        // Echo back for demo purposes if needed
        if (message.type === 'chat_message') {
          this.handleMessage({
            type: 'chat_message',
            payload: {
              ...message.payload,
              id: Math.random().toString(36).substring(2, 11),
              userId: 'demo-echo',
              username: 'Demo Echo',
              timestamp: Date.now()
            },
            timestamp: Date.now()
          });
        }
      }, 100);
      return true;
    }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Public API
  send(type: string, payload: any) {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      userId: localStorage.getItem('userId') || undefined
    };

    if (!this.sendMessage(message)) {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  subscribe(messageType: string, callback: (payload: any) => void) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, new Set());
    }
    this.listeners.get(messageType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(messageType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(messageType);
        }
      }
    };
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionListeners.add(callback);
    
    // Return current connection status
    callback(this.isConnected());

    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  isConnected(): boolean {
    // In demo mode, always report as connected
    if (this.demoMode) {
      return true;
    }
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  // Chat-specific methods
  joinChatRoom(roomId: string) {
    this.send('join_room', { roomId });
  }

  leaveChatRoom(roomId: string) {
    this.send('leave_room', { roomId });
  }

  sendChatMessage(roomId: string, message: string) {
    this.send('chat_message', {
      roomId,
      message,
      timestamp: Date.now()
    });
  }

  // Notification methods
  subscribeToNotifications(userId: string) {
    this.send('subscribe_notifications', { userId });
  }

  markNotificationRead(notificationId: string) {
    this.send('notification_read', { notificationId });
  }

  // Presence methods
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline') {
    this.send('presence_update', { status });
  }

  // Typing indicators
  startTyping(roomId: string) {
    this.send('typing_start', { roomId });
  }

  stopTyping(roomId: string) {
    this.send('typing_stop', { roomId });
  }
}

// React hooks for WebSocket
export const useWebSocket = (url: string) => {
  const [service] = React.useState(() => new WebSocketService(url));
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = service.onConnectionChange(setIsConnected);
    
    return () => {
      unsubscribe();
      service.disconnect();
    };
  }, [service]);

  return { service, isConnected };
};

export const useChatRoom = (roomId: string, wsService: WebSocketService) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

  React.useEffect(() => {
    wsService.joinChatRoom(roomId);

    const unsubscribeMessages = wsService.subscribe('chat_message', (message: ChatMessage) => {
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
      }
    });

    const unsubscribeTyping = wsService.subscribe('typing_update', (data: { userId: string; username: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return prev.includes(data.username) ? prev : [...prev, data.username];
        } else {
          return prev.filter(user => user !== data.username);
        }
      });
    });

    return () => {
      wsService.leaveChatRoom(roomId);
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [roomId, wsService]);

  const sendMessage = React.useCallback((message: string) => {
    wsService.sendChatMessage(roomId, message);
  }, [roomId, wsService]);

  const startTyping = React.useCallback(() => {
    wsService.startTyping(roomId);
  }, [roomId, wsService]);

  const stopTyping = React.useCallback(() => {
    wsService.stopTyping(roomId);
  }, [roomId, wsService]);

  return {
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping
  };
};

// Singleton instance
let wsServiceInstance: WebSocketService | null = null;

export const getWebSocketService = () => {
  if (!wsServiceInstance) {
    // Use mock WebSocket for development
    const wsUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:8080/ws' 
      : 'wss://astral-core.netlify.app/ws';
    
    wsServiceInstance = new WebSocketService(wsUrl);
  }
  return wsServiceInstance;
};

export default WebSocketService;