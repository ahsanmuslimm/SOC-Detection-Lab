/**
 * WebSocket Service
 * 
 * Real-time communication service using WebSocket.
 * Handles connection, reconnection, subscriptions, and message handling.
 * 
 * @module services/websocketService
 */

import { useAuthStore } from '@stores/authStore';

type MessageHandler = (data: unknown) => void;
type EventSubscribers = Map<string, Set<MessageHandler>>;

interface WebSocketMessage {
  type: string;
  channel: string;
  data: unknown;
  timestamp: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private subscribers: EventSubscribers = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const apiUrlWithoutProtocol = apiUrl.replace(/^https?:\/\//, '');
    this.url = `${wsProtocol}//${apiUrlWithoutProtocol}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const authStore = useAuthStore.getState();
        const token = authStore.accessToken;

        if (!token) {
          reject(new Error('No authentication token available'));
          return;
        }

        const wsUrl = `${this.url}?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.stopHeartbeat();

          if (!this.isManualClose) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to channel
   */
  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }

    const handlers = this.subscribers.get(channel)!;
    handlers.add(handler);

    // Send subscription message to server
    this.send({
      type: 'subscribe',
      channel,
    });

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);

      if (handlers.size === 0) {
        this.subscribers.delete(channel);
        this.send({
          type: 'unsubscribe',
          channel,
        });
      }
    };
  }

  /**
   * Send message to server
   */
  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(rawData: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(rawData);

      // Emit to subscribers
      const handlers = this.subscribers.get(message.channel);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.data);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat ping
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat ping
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' {
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      return 'connecting';
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      return 'connected';
    }
    return 'disconnected';
  }
}

// Singleton instance
export const wsService = new WebSocketService();

/**
 * Hook for real-time subscriptions
 */
export const useRealTime = (channel: string, handler: MessageHandler) => {
  React.useEffect(() => {
    const unsubscribe = wsService.subscribe(channel, handler);
    return unsubscribe;
  }, [channel, handler]);
};

// Import React for the hook
import React from 'react';
