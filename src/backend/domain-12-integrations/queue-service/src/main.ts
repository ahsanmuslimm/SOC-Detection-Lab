/**
 * Queue Service - Main Implementation
 * Message queuing with priorities, retries, and delivery guarantees
 */

import {
  IQueueMessage,
  IQueueConfig,
  IRetryPolicy,
  IQueueConsumer,
  MessageHandler,
  QueueListener,
  IQueueEvent,
  IQueueStats,
  IQueueHealthCheck,
  IBatchMessageResult,
  IQueueMetrics,
  IDeadLetterMessage,
  IQueueServiceConfig,
  IDeadLetterQueueStats,
} from './types';

/**
 * Queue Service - High-performance message queuing
 */
export class QueueService {
  private queues: Map<string, Map<string, IQueueMessage>>;
  private queueConfigs: Map<string, IQueueConfig>;
  private consumers: Map<string, IQueueConsumer>;
  private deadLetterQueue: Map<string, IDeadLetterMessage>;
  private listeners: QueueListener[];
  private messageHandlers: Map<string, MessageHandler[]>;
  private stats: Map<string, IQueueStats>;
  private metrics: IQueueMetrics[];
  private auditLog: Array<any>;
  private config: IQueueServiceConfig;
  private processingTimers: Map<string, NodeJS.Timer>;
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor(config: IQueueServiceConfig) {
    this.config = this.validateConfig(config);
    this.queues = new Map();
    this.queueConfigs = new Map();
    this.consumers = new Map();
    this.deadLetterQueue = new Map();
    this.listeners = [];
    this.messageHandlers = new Map();
    this.stats = new Map();
    this.metrics = [];
    this.auditLog = [];
    this.processingTimers = new Map();

    this.startCleanupInterval();
  }

  private validateConfig(config: IQueueServiceConfig): IQueueServiceConfig {
    if (config.maxQueues <= 0) {
      throw new Error('maxQueues must be greater than 0');
    }
    if (config.maxMessageSize <= 0) {
      throw new Error('maxMessageSize must be greater than 0');
    }
    return config;
  }

  public createQueue(config: Omit<IQueueConfig, 'queueId' | 'createdAt' | 'updatedAt'>): string {
    const queueId = this.generateQueueId();

    const fullConfig: IQueueConfig = {
      ...config,
      queueId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queueConfigs.set(queueId, fullConfig);
    this.queues.set(queueId, new Map());
    this.messageHandlers.set(queueId, []);
    this.stats.set(queueId, this.initializeStats(queueId));

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'queue-created',
      queueId,
    });

    return queueId;
  }

  public getQueue(queueId: string): IQueueConfig | null {
    return this.queueConfigs.get(queueId) || null;
  }

  public sendMessage(queueId: string, body: any, options?: { priority?: string; delayMs?: number; ttlMs?: number }): string {
    const queue = this.queues.get(queueId);
    if (!queue) {
      throw new Error(`Queue ${queueId} not found`);
    }

    const queueConfig = this.queueConfigs.get(queueId);
    if (!queueConfig) {
      throw new Error(`Queue config ${queueId} not found`);
    }

    if (queue.size >= queueConfig.maxMessages) {
      throw new Error(`Queue ${queueId} is full`);
    }

    const messageSize = JSON.stringify(body).length;
    if (messageSize > queueConfig.maxMessageSize) {
      throw new Error(`Message size exceeds maximum`);
    }

    const messageId = this.generateMessageId();
    const message: IQueueMessage = {
      messageId,
      queueId,
      body,
      priority: (options?.priority as any) || 'normal',
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
      delayMs: options?.delayMs,
      ttlMs: options?.ttlMs,
    };

    queue.set(messageId, message);

    const queueStats = this.stats.get(queueId)!;
    queueStats.totalMessages++;
    queueStats.pendingMessages++;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'message-received',
      queueId,
      messageId,
    });

    return messageId;
  }

  public receiveMessage(queueId: string): IQueueMessage | null {
    const queue = this.queues.get(queueId);
    if (!queue) return null;

    const queueConfig = this.queueConfigs.get(queueId);
    if (!queueConfig) return null;

    for (const [, message] of queue) {
      if (message.status === 'pending') {
        message.status = 'processing';
        message.processingStartedAt = new Date();
        message.attempts++;

        const queueStats = this.stats.get(queueId)!;
        queueStats.pendingMessages--;
        queueStats.processingMessages++;

        return message;
      }
    }

    return null;
  }

  public completeMessage(queueId: string, messageId: string): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    const message = queue.get(messageId);
    if (!message) return false;

    message.status = 'completed';
    message.completedAt = new Date();

    const queueStats = this.stats.get(queueId)!;
    queueStats.processingMessages--;
    queueStats.completedMessages++;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'message-processed',
      queueId,
      messageId,
    });

    return true;
  }

  public failMessage(queueId: string, messageId: string, error: string): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    const message = queue.get(messageId);
    if (!message) return false;

    const queueConfig = this.queueConfigs.get(queueId)!;

    if (message.attempts >= queueConfig.retryPolicy.maxAttempts) {
      if (queueConfig.deadLetterConfig?.enabled) {
        this.moveToDeadLetter(queueId, message, error);
      }
      message.status = 'failed';
      message.lastError = error;

      const queueStats = this.stats.get(queueId)!;
      queueStats.processingMessages--;
      queueStats.failedMessages++;

      this.emitEvent({
        eventId: this.generateEventId(),
        timestamp: new Date(),
        type: 'message-failed',
        queueId,
        messageId,
        error,
      });

      return true;
    }

    message.status = 'pending';
    message.lastError = error;

    const queueStats = this.stats.get(queueId)!;
    queueStats.processingMessages--;
    queueStats.pendingMessages++;

    return true;
  }

  public registerConsumer(queueId: string, consumerId: string, handler: MessageHandler): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    const consumer: IQueueConsumer = {
      consumerId,
      queueId,
      name: consumerId,
      active: true,
      concurrency: 1,
      messagesProcessed: 0,
      messagesFailed: 0,
      createdAt: new Date(),
    };

    this.consumers.set(consumerId, consumer);

    const handlers = this.messageHandlers.get(queueId) || [];
    handlers.push(handler);
    this.messageHandlers.set(queueId, handlers);

    const queueStats = this.stats.get(queueId)!;
    queueStats.totalConsumers++;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'consumer-registered',
      queueId,
      consumerId,
    });

    return true;
  }

  public unregisterConsumer(consumerId: string): boolean {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) return false;

    this.consumers.delete(consumerId);

    const handlers = this.messageHandlers.get(consumer.queueId);
    if (handlers) {
      const index = handlers.findIndex((h) => h);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    }

    return true;
  }

  public sendBatch(queueId: string, messages: Array<{ body: any; priority?: string }>): IBatchMessageResult {
    const result: IBatchMessageResult = {
      successCount: 0,
      failureCount: 0,
      messageIds: [],
      errors: [],
    };

    for (const msg of messages) {
      try {
        const messageId = this.sendMessage(queueId, msg.body, { priority: msg.priority });
        result.messageIds.push(messageId);
        result.successCount++;
      } catch (error) {
        result.failureCount++;
        result.errors?.push({
          messageId: '',
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  public getQueueStats(queueId: string): IQueueStats | null {
    return this.stats.get(queueId) || null;
  }

  public getDeadLetterStats(queueId: string): IDeadLetterQueueStats {
    const stats: IDeadLetterQueueStats = {
      totalMessages: this.deadLetterQueue.size,
      messagesByReason: {},
      oldestMessageAge: 0,
      averageRetryAttempts: 0,
      lastUpdated: new Date(),
    };

    let totalAttempts = 0;
    let oldestTime = Date.now();

    for (const [, msg] of this.deadLetterQueue) {
      const reason = msg.reason || 'unknown';
      stats.messagesByReason[reason] = (stats.messagesByReason[reason] || 0) + 1;
      totalAttempts += msg.attempts;
      oldestTime = Math.min(oldestTime, msg.createdAt.getTime());
    }

    if (this.deadLetterQueue.size > 0) {
      stats.averageRetryAttempts = totalAttempts / this.deadLetterQueue.size;
      stats.oldestMessageAge = Date.now() - oldestTime;
    }

    return stats;
  }

  public async performHealthCheck(): Promise<IQueueHealthCheck> {
    const queues = Array.from(this.queueConfigs.values()).map((config) => {
      const queue = this.queues.get(config.queueId);
      const queueStats = this.stats.get(config.queueId);

      return {
        name: config.name,
        status: (queueStats?.failedMessages ?? 0) === 0 ? 'healthy' : 'degraded',
        messageCount: queue?.size ?? 0,
        consumerCount: queueStats?.totalConsumers ?? 0,
      };
    });

    const overallStatus = queues.every((q) => q.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      status: overallStatus as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date(),
      queues,
    };
  }

  public deleteQueue(queueId: string): boolean {
    const deleted = this.queues.delete(queueId);
    this.queueConfigs.delete(queueId);
    this.stats.delete(queueId);
    this.messageHandlers.delete(queueId);

    return deleted;
  }

  public purgeQueue(queueId: string): number {
    const queue = this.queues.get(queueId);
    if (!queue) return 0;

    const count = queue.size;
    queue.clear();

    const queueStats = this.stats.get(queueId);
    if (queueStats) {
      queueStats.totalMessages = 0;
      queueStats.pendingMessages = 0;
      queueStats.processingMessages = 0;
    }

    return count;
  }

  public onEvent(listener: QueueListener): this {
    this.listeners.push(listener);
    return this;
  }

  private moveToDeadLetter(queueId: string, message: IQueueMessage, error: string): void {
    const dlMessage: IDeadLetterMessage = {
      messageId: message.messageId,
      originalQueueId: queueId,
      body: message.body,
      headers: message.headers,
      lastError: error,
      attempts: message.attempts,
      createdAt: new Date(),
      reason: 'max_retries_exceeded',
    };

    this.deadLetterQueue.set(message.messageId, dlMessage);

    const queueStats = this.stats.get(queueId);
    if (queueStats) {
      queueStats.deadLetterMessages++;
    }

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'message-dead-lettered',
      queueId,
      messageId: message.messageId,
      error,
    });
  }

  private initializeStats(queueId: string): IQueueStats {
    return {
      queueId,
      totalMessages: 0,
      pendingMessages: 0,
      processingMessages: 0,
      completedMessages: 0,
      failedMessages: 0,
      deadLetterMessages: 0,
      averageProcessingTimeMs: 0,
      totalConsumers: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async emitEvent(event: Omit<IQueueEvent, 'eventId'>): Promise<void> {
    const fullEvent: IQueueEvent = {
      eventId: this.generateEventId(),
      ...event,
    };

    for (const listener of this.listeners) {
      try {
        await Promise.resolve(listener(fullEvent));
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [queueId, queue] of this.queues) {
      const keysToDelete: string[] = [];

      for (const [messageId, message] of queue) {
        if (message.ttlMs && now - message.createdAt.getTime() > message.ttlMs) {
          keysToDelete.push(messageId);
        }
      }

      for (const messageId of keysToDelete) {
        queue.delete(messageId);
      }
    }
  }

  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private generateQueueId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function createQueueService(config: IQueueServiceConfig): QueueService {
  return new QueueService(config);
}
