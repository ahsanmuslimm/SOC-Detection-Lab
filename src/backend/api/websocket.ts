/**
 * WebSocket Server
 *
 * Real-time alert broadcast for connected SOC analysts.
 * Clients subscribe to channels (alerts, cases, investigations).
 * New alerts / status changes are pushed instantly without polling.
 *
 * Protocol:
 *   Client → { type: 'subscribe',   channel: 'alerts' }
 *   Client → { type: 'unsubscribe', channel: 'alerts' }
 *   Client → { type: 'ping' }
 *   Server → { type: 'pong' }
 *   Server → { type: 'message', channel: 'alerts', data: {...}, timestamp: '...' }
 *   Server → { type: 'connected', message: '...' }
 *
 * Auth: JWT passed as ?token=<jwt> query parameter on connect.
 *
 * @module api/websocket
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { parse } from 'url';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WSClient {
  ws: WebSocket;
  userId: string;
  role: string;
  subscriptions: Set<string>;
  lastPing: number;
}

interface WSMessage {
  type: string;
  channel?: string;
  data?: unknown;
}

// ── WebSocket Manager ─────────────────────────────────────────────────────────

export class SOCWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
    this.startHeartbeat();
    console.log('[WS] ✓ WebSocket server attached to /ws');
  }

  // ── Connection handling ───────────────────────────────────────────────────

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    // Extract and verify JWT from query string
    const query = parse(req.url ?? '', true).query;
    const token = query.token as string | undefined;

    let userId = 'anonymous';
    let role   = 'viewer';

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          userId?: string;
          role?:   string;
        };
        userId = decoded.userId ?? 'anonymous';
        role   = decoded.role   ?? 'viewer';
      } catch {
        // Invalid token — allow read-only connection, not authenticated
      }
    }

    const clientId = `${userId}-${Date.now()}`;
    const client: WSClient = {
      ws,
      userId,
      role,
      subscriptions: new Set(),
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);
    console.log(`[WS] Client connected: ${userId} (${this.clients.size} total)`);

    // Welcome message
    this.send(ws, {
      type: 'connected',
      message: `Connected to SOC Detection Lab real-time feed`,
      userId,
      timestamp: new Date().toISOString(),
    });

    ws.on('message', (raw) => {
      try {
        const msg: WSMessage = JSON.parse(raw.toString());
        this.handleMessage(clientId, msg);
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      console.log(`[WS] Client disconnected: ${userId} (${this.clients.size} total)`);
    });

    ws.on('error', () => {
      this.clients.delete(clientId);
    });
  }

  private handleMessage(clientId: string, msg: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (msg.type) {
      case 'subscribe':
        if (msg.channel) {
          client.subscriptions.add(msg.channel);
          this.send(client.ws, {
            type: 'subscribed',
            channel: msg.channel,
            timestamp: new Date().toISOString(),
          });
        }
        break;

      case 'unsubscribe':
        if (msg.channel) {
          client.subscriptions.delete(msg.channel);
        }
        break;

      case 'ping':
        client.lastPing = Date.now();
        this.send(client.ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
    }
  }

  // ── Broadcast helpers ─────────────────────────────────────────────────────

  private send(ws: WebSocket, data: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast an event to all clients subscribed to a channel.
   * Used by controllers when alerts/cases are created or updated.
   */
  broadcast(channel: string, data: unknown): void {
    const payload = JSON.stringify({
      type:      'message',
      channel,
      data,
      timestamp: new Date().toISOString(),
    });

    let sent = 0;
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
        sent++;
      }
    }

    if (sent > 0) {
      console.log(`[WS] Broadcast to ${sent} client(s) on channel: ${channel}`);
    }
  }

  /**
   * Broadcast a new alert to all subscribers of the 'alerts' channel.
   * Call this from AlertController after createAlert succeeds.
   */
  broadcastNewAlert(alert: unknown): void {
    this.broadcast('alerts', { event: 'alert.created', alert });
  }

  /**
   * Broadcast an alert status change.
   */
  broadcastAlertUpdate(alert: unknown): void {
    this.broadcast('alerts', { event: 'alert.updated', alert });
  }

  /**
   * Broadcast a new case.
   */
  broadcastNewCase(caseData: unknown): void {
    this.broadcast('cases', { event: 'case.created', case: caseData });
  }

  // ── Heartbeat — drop dead connections ────────────────────────────────────

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, client] of this.clients.entries()) {
        if (client.ws.readyState !== WebSocket.OPEN) {
          this.clients.delete(id);
        } else if (now - client.lastPing > 120_000) {
          // No ping in 2 minutes — terminate
          client.ws.terminate();
          this.clients.delete(id);
        }
      }
    }, 30_000);
  }

  stop(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.wss.close();
    console.log('[WS] WebSocket server stopped');
  }

  get connectedClients(): number {
    return this.clients.size;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let wsServer: SOCWebSocketServer | null = null;

export function getWSServer(): SOCWebSocketServer | null {
  return wsServer;
}

export function initWSServer(server: Server): SOCWebSocketServer {
  wsServer = new SOCWebSocketServer(server);
  return wsServer;
}
